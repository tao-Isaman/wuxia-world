// The game server's front door (docs/online.md). Two halves share one
// Worker: the Rust half (server/worker/src, built by worker-build) keeps
// accounts, sessions, characters, saves and the realtime rooms; this
// TypeScript half runs the game's own engines (lib/world, lib/game) for what
// must not be left to the browser — the one shared world and checked battles.
//
// Routes here (everything else goes to the Rust half):
//   GET  /world[?rev=…&pins=…]                 the shared world (WorldObject)
//   POST /world/echo                           a deed for the jianghu to talk about
//   POST /characters/<id>/battle/start|log|finish   a checked battle (BattleObject)
//   GET  /social · /social/ws                  the player's friends, mail, party (PlayerHub)
//   POST /social/<action> · /party/<action>    friends, whispers, mail, the party
//   GET  /raid/<bossId>[?from=N]               a world boss and the player's fight for it (RaidObject)
//   POST /raid/<bossId>/open|join|start|act    open a party fight, join it, begin it, play a turn
//   POST /rum                                  the browsers' timings (Analytics Engine; lib/net/rum.ts)
// Every HTTP answer carries Server-Timing (total, and the token check).
import { WorkerEntrypoint } from "cloudflare:workers";
import RustWorker, { AccountObject, KeyObject, RoomObject } from "wuxia-rust";
import { accountObjectName, battleObjectName, hubObjectName, raidObjectName, WORLD_OBJECT_NAME, type Env } from "./env";
import { getBoss } from "@/lib/world/data/bosses";
import type { PartyView } from "@/lib/net/social-protocol";
import { callObject, json, readJson, withCors } from "./http";
import { handleRum, withTiming, type Timings } from "./timing";

export { AccountObject, KeyObject, RoomObject };
export { WorldObject } from "./world-object";
export { BattleObject } from "./battle-object";
export { PlayerHub } from "./hub-object";
export { PartyObject } from "./party-object";
export { RaidObject } from "./raid-object";

/** What a player may ask their hub for (its `/internal/*` routes are for other objects only). */
const SOCIAL_ACTIONS = new Set([
  "friends/request", "friends/accept", "friends/decline", "friends/remove", "block", "unblock", "whisper",
  "mail/send", "mail/read", "mail/claim", "mail/delete",
]);
const PARTY_ACTIONS = new Set(["invite", "accept", "decline", "leave", "kick", "lead", "chat"]);

/** The session token: `Authorization: Bearer <token>`, else `?token=`. */
function tokenOf(request: Request, url: URL): string {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return url.searchParams.get("token") ?? "";
}

export default class GameServer extends WorkerEntrypoint<Env> {
  private rust(): { fetch(request: Request): Promise<Response> } {
    return new RustWorker(this.ctx, this.env);
  }

  /** The account a token belongs to (the Rust half checks it), or null. */
  private async player(request: Request, url: URL, timings: Timings): Promise<string | null> {
    const token = tokenOf(request, url);
    if (!token) return null;
    const began = Date.now();
    const reply = await this.rust().fetch(new Request(`${url.origin}/auth/me?token=${encodeURIComponent(token)}`));
    timings.auth = Date.now() - began;
    if (!reply.ok) return null;
    const me = await reply.json().catch(() => null) as { username?: string } | null;
    return typeof me?.username === "string" ? me.username : null;
  }

  async fetch(request: Request): Promise<Response> {
    const began = Date.now();
    const timings: Timings = {};
    return withTiming(await this.route(request, timings), began, timings);
  }

  private async route(request: Request, timings: Timings): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/rum" && request.method === "POST") return handleRum(request, this.env);
    const parts = url.pathname.split("/").filter(Boolean);
    const isWorld = parts[0] === "world" && (parts.length === 1 ? request.method === "GET" : parts.length === 2 && parts[1] === "echo" && request.method === "POST");
    const isBattle = parts[0] === "characters" && parts.length === 4 && parts[2] === "battle" && request.method === "POST"
      && ["start", "log", "finish"].includes(parts[3]!);
    const social = this.socialPath(request, parts);
    const isRaid = parts[0] === "raid" && !!getBoss(parts[1]) && (parts.length === 2 ? request.method === "GET"
      : parts.length === 3 && request.method === "POST" && ["open", "join", "start", "act"].includes(parts[2]!));
    if (!isWorld && !isBattle && !social && !isRaid) return this.rust().fetch(request);
    const player = await this.player(request, url, timings);
    if (!player) return withCors(json({ error: "bad_token" }, 401));
    try {
      // A socket upgrade goes back as it is (CORS headers do not apply).
      if (social === "/ws") return await this.hub(request, player, social);
      if (social) return withCors(await this.hub(request, player, social));
      if (isRaid) return withCors(await this.raid(request, url, player, parts[1]!, parts[2] ?? null));
      return withCors(isWorld ? await this.world(request, url, player) : await this.battle(request, player, decodeURIComponent(parts[1]!), parts[3]!));
    } catch (error) {
      console.error("[server]", error);
      return withCors(json({ error: "server_error" }, 500));
    }
  }

  /** The hub path a `/social…` or `/party…` request maps to, or null. */
  private socialPath(request: Request, parts: string[]): string | null {
    if (parts[0] === "social" && request.method === "GET") {
      if (parts.length === 1) return "/snapshot";
      if (parts.length === 2 && parts[1] === "ws") return "/ws";
      return null;
    }
    if (request.method !== "POST") return null;
    const rest = parts.slice(1).join("/");
    if (parts[0] === "social" && SOCIAL_ACTIONS.has(rest)) return `/${rest}`;
    if (parts[0] === "party" && PARTY_ACTIONS.has(rest)) return `/party/${rest}`;
    return null;
  }

  /** Hand a social request to the player's own hub (`x-hub-user` is set here, never by the browser). */
  private hub(request: Request, player: string, path: string): Promise<Response> {
    const stub = this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(player)));
    const headers = new Headers({ "x-hub-user": player, "content-type": "application/json" });
    const upgrade = request.headers.get("upgrade");
    if (upgrade) headers.set("upgrade", upgrade);
    return stub.fetch(`https://hub${path}`, {
      method: request.method,
      headers,
      body: request.method === "POST" ? request.body : undefined,
    });
  }

  private worldStub(): DurableObjectStub {
    return this.env.WORLD.get(this.env.WORLD.idFromName(WORLD_OBJECT_NAME));
  }

  private async world(request: Request, url: URL, player: string): Promise<Response> {
    if (request.method === "GET") {
      const query = new URLSearchParams({ player });
      const rev = url.searchParams.get("rev");
      const pins = url.searchParams.get("pins");
      if (rev !== null) query.set("rev", rev);
      if (pins !== null) query.set("pins", pins);
      return this.worldStub().fetch(`https://object/world?${query}`);
    }
    const echo = await readJson<unknown>(request, 10_000);
    if (!echo) return json({ error: "bad_request" }, 400);
    return callObject(this.worldStub(), "/echo", { player, echo });
  }

  /** A character's last accepted save (the account's Durable Object answers only for its own characters). */
  private async savedState(player: string, characterId: string): Promise<unknown | Response> {
    const account = this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName(accountObjectName(player)));
    const reply = await account.fetch(`https://account/characters/${encodeURIComponent(characterId)}/save`);
    if (!reply.ok) return new Response(reply.body, { status: reply.status, headers: { "content-type": "application/json" } });
    const { save } = await reply.json() as { save: { state?: unknown } | null };
    return save?.state ?? null;
  }

  /** A world boss: the router loads what the fight needs (saves, the party) and hands it on. */
  private async raid(request: Request, url: URL, player: string, bossId: string, action: string | null): Promise<Response> {
    const stub = this.env.RAIDS.get(this.env.RAIDS.idFromName(raidObjectName(bossId)));
    const headers = { "content-type": "application/json", "x-boss-id": bossId };
    if (!action) {
      const query = new URLSearchParams({ player, from: url.searchParams.get("from") ?? "0" });
      return stub.fetch(`https://raid/view?${query}`, { headers });
    }
    const body = await readJson<Record<string, unknown>>(request, 20_000);
    if (!body) return json({ error: "bad_request" }, 400);
    const forward: Record<string, unknown> = { ...body, player };
    if (action === "open" || action === "join") {
      const characterId = typeof body.characterId === "string" ? body.characterId : "";
      if (!characterId) return json({ error: "bad_request" }, 400);
      const save = await this.savedState(player, characterId);
      if (save instanceof Response) return save;
      if (!save) return json({ error: "no_hero" }, 422);
      forward.save = save;
    }
    if (action === "open") {
      // The party as it stands: the leader opens, everyone in it is asked.
      const hub = this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(player)));
      const reply = await hub.fetch("https://hub/internal/party", { headers: { "x-hub-user": player } });
      const { party } = (reply.ok ? await reply.json() : { party: null }) as { party: PartyView | null };
      if (!party) return json({ error: "party_small" }, 422);
      if (party.leader !== player) return json({ error: "not_leader" }, 403);
      const members = [...party.members].sort((a, b) => (a.username === player ? -1 : b.username === player ? 1 : 0));
      forward.party = members.map((m) => ({ player: m.username, name: m.name || m.username }));
    }
    return stub.fetch(`https://raid/${action}`, { method: "POST", headers, body: JSON.stringify(forward) });
  }

  private async battle(request: Request, player: string, characterId: string, action: string): Promise<Response> {
    const stub = this.env.BATTLES.get(this.env.BATTLES.idFromName(battleObjectName(player, characterId)));
    if (action !== "start") {
      const body = await readJson<unknown>(request, 1_000_000);
      if (!body) return json({ error: "bad_request" }, 400);
      return callObject(stub, `/${action}`, body);
    }
    // Stage the fight from the character's last accepted save (the account's
    // Durable Object answers only for its own characters).
    const account = this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName(accountObjectName(player)));
    const reply = await account.fetch(`https://account/characters/${encodeURIComponent(characterId)}/save`);
    if (!reply.ok) return new Response(reply.body, { status: reply.status, headers: { "content-type": "application/json" } });
    const { save } = await reply.json() as { save: { state?: unknown } | null };
    if (!save?.state) return json({ error: "no_battle" }, 422);
    return callObject(stub, "/start", { player, characterId, save: save.state });
  }
}
