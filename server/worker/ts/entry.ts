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
import { WorkerEntrypoint } from "cloudflare:workers";
import RustWorker, { AccountObject, KeyObject, RoomObject } from "wuxia-rust";
import { accountObjectName, battleObjectName, WORLD_OBJECT_NAME, type Env } from "./env";
import { callObject, json, readJson, withCors } from "./http";

export { AccountObject, KeyObject, RoomObject };
export { WorldObject } from "./world-object";
export { BattleObject } from "./battle-object";

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
  private async player(request: Request, url: URL): Promise<string | null> {
    const token = tokenOf(request, url);
    if (!token) return null;
    const reply = await this.rust().fetch(new Request(`${url.origin}/auth/me?token=${encodeURIComponent(token)}`));
    if (!reply.ok) return null;
    const me = await reply.json().catch(() => null) as { username?: string } | null;
    return typeof me?.username === "string" ? me.username : null;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const isWorld = parts[0] === "world" && (parts.length === 1 ? request.method === "GET" : parts.length === 2 && parts[1] === "echo" && request.method === "POST");
    const isBattle = parts[0] === "characters" && parts.length === 4 && parts[2] === "battle" && request.method === "POST"
      && ["start", "log", "finish"].includes(parts[3]!);
    if (!isWorld && !isBattle) return this.rust().fetch(request);
    const player = await this.player(request, url);
    if (!player) return withCors(json({ error: "bad_token" }, 401));
    try {
      return withCors(isWorld ? await this.world(request, url, player) : await this.battle(request, player, decodeURIComponent(parts[1]!), parts[3]!));
    } catch (error) {
      console.error("[server]", error);
      return withCors(json({ error: "server_error" }, 500));
    }
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
