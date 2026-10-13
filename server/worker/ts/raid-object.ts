// RaidObject: one legendary beast for everyone, and the party fights for it
// (a Durable Object per boss, docs/online.md "World bosses"; the rules are
// raid-doc.ts). It keeps the beast's state and the fight, plays the fight's
// turns as people send them, and wakes on its own (an alarm) to play a turn
// whose time ran out, to begin a gathering that ran out, and to call off a
// fight that went on too long. It tells the shared world (WorldObject) how
// the beast stands, so every map can show it, and asks the party's members
// (their PlayerHub) to join.
//
// Routes (from the router in entry.ts, which checked the session and loaded the save):
//   GET  /view?player=…&from=N                       → RaidView
//   POST /open  { player, characterId, save, party }  → RaidView
//   POST /join  { player, raid, characterId, save }   → RaidView
//   POST /start { player, raid }                      → RaidView
//   POST /act   { player, raid, intent }              → RaidView
import { DurableObject } from "cloudflare:workers";
import type { BattleSession } from "@/lib/game/grid/session";
import type { WorldStateData } from "@/lib/world/types";
import type { RaidIntent } from "@/lib/net/raid-protocol";
import {
  actRaid, beginRaid, bossStatus, judgeRaid, joinRaid, newRaidDoc, openRaid, raidView, sessionOf, tickRaid,
  type RaidDoc, type RaidError,
} from "./raid-doc";
import { accountObjectName, hubObjectName, WORLD_OBJECT_NAME, type Env } from "./env";
import { callObject, json, readJson } from "./http";

const DOC = "raid";
/** How often a running fight wakes to check the quiet and the clock, ms. */
const WAKE_MS = 5_000;

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const STATUS: Partial<Record<RaidError, number>> = { no_fight: 404, not_member: 403, not_your_turn: 409, taken: 409, resting: 409 };

export class RaidObject extends DurableObject<Env> {
  private doc: RaidDoc | null = null;
  private session: BattleSession | null = null;

  private async load(bossId: string): Promise<RaidDoc> {
    if (this.doc) return this.doc;
    const raw = await this.ctx.storage.get<string>(DOC);
    this.doc = raw ? (JSON.parse(raw) as RaidDoc) : newRaidDoc(bossId);
    return this.doc;
  }

  private async save(doc: RaidDoc): Promise<void> {
    await this.ctx.storage.put(DOC, JSON.stringify(doc));
    const fight = doc.fight;
    if (fight && fight.phase !== "over") {
      const next = Math.min(Date.now() + WAKE_MS, fight.deadline ?? Infinity);
      await this.ctx.storage.setAlarm(next);
    }
  }

  /** The fight's session (rebuilt from its log after a sleep). */
  private sessionFor(doc: RaidDoc): BattleSession | null {
    const fight = doc.fight;
    if (!fight || fight.phase !== "battle" || !fight.start) { this.session = null; return null; }
    if (!this.session || (this.session.commands?.length ?? 0) !== fight.commands.length) this.session = sessionOf(fight);
    return this.session;
  }

  /** Tell the shared world how the beast stands (it shows on every map); a fall becomes news. */
  private async tellWorld(doc: RaidDoc, fell: boolean): Promise<void> {
    const world = this.env.WORLD.get(this.env.WORLD.idFromName(WORLD_OBJECT_NAME));
    await callObject(world, "/boss-state", { player: doc.fight?.leader ?? "", bossId: doc.bossId, status: bossStatus(doc), fell }).catch(() => null);
  }

  /** What a finished fight changes beyond this beast: gold to each winner's allowance. */
  private async payOut(doc: RaidDoc): Promise<void> {
    const fight = doc.fight;
    if (!fight?.verdicts) return;
    await Promise.all(fight.members.map(async (m) => {
      const gold = fight.verdicts![m.player]?.spoils?.gold ?? 0;
      if (gold <= 0 || !m.characterId) return;
      const account = this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName(accountObjectName(m.player)));
      await account.fetch(`https://account/characters/${encodeURIComponent(m.characterId)}/grant`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gold }),
      }).catch(() => null);
    }));
  }

  /** After anything moved the fight: judge a finished one, tell the world, store. */
  private async settle(doc: RaidDoc, before: string): Promise<void> {
    const session = this.sessionFor(doc);
    let fell = false;
    if (session && session.state.phase === "over") {
      fell = judgeRaid(doc, session, Date.now()) === true;
      this.session = null;
      await this.payOut(doc);
    }
    await this.save(doc);
    if (JSON.stringify(bossStatus(doc)) !== before || fell) await this.tellWorld(doc, fell);
  }

  /** Ask each member's hub to tell them (their social socket). */
  private async push(players: string[], message: unknown): Promise<void> {
    await Promise.all(players.map((p) => {
      const hub = this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(p)));
      return hub.fetch("https://hub/internal/push", {
        method: "POST",
        headers: { "content-type": "application/json", "x-hub-user": p },
        body: JSON.stringify({ message }),
      }).catch(() => null);
    }));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const bossId = request.headers.get("x-boss-id") ?? "";
    if (!bossId) return json({ error: "bad_request" }, 400);
    const doc = await this.load(bossId);
    const now = Date.now();
    const before = JSON.stringify(bossStatus(doc));
    if (request.method === "GET" && url.pathname === "/view") {
      const player = url.searchParams.get("player") ?? "";
      this.session = tickRaid(doc, this.sessionFor(doc), now) ?? this.session;
      await this.settle(doc, before);
      return json(raidView(doc, player, Number(url.searchParams.get("from") ?? 0), now));
    }
    if (request.method !== "POST") return json({ error: "not_found" }, 404);
    const body = await readJson<Record<string, unknown>>(request, 2_000_000);
    const player = typeof body?.player === "string" ? body.player : "";
    if (!body || !player) return json({ error: "bad_request" }, 400);
    let error: RaidError | null = null;
    switch (url.pathname) {
      case "/open": {
        const party = Array.isArray(body.party) ? (body.party as { player: string; name: string }[]) : [];
        const seed = new Uint32Array(1);
        crypto.getRandomValues(seed);
        error = openRaid(doc, { player, characterId: String(body.characterId ?? ""), save: body.save as WorldStateData }, party,
          { id: randomHex(8), seed: seed[0]! || 1 }, now);
        if (!error) {
          await this.push(party.map((m) => m.player).filter((p) => p !== player),
            { t: "raid_invite", invite: { bossId, raid: doc.fight!.id, from: doc.fight!.members[0]!.name, until: doc.fight!.deadline } });
        }
        break;
      }
      case "/join":
        error = joinRaid(doc, String(body.raid ?? ""), { player, characterId: String(body.characterId ?? ""), save: body.save as WorldStateData }, now);
        // Everyone is in: the fight begins.
        if (!error && doc.fight?.members.every((m) => m.joined)) {
          const begun = beginRaid(doc, now);
          if (typeof begun !== "string") this.session = begun;
        }
        break;
      case "/start": {
        if (!doc.fight || doc.fight.id !== body.raid) { error = "no_fight"; break; }
        if (doc.fight.leader !== player) { error = "not_leader"; break; }
        const begun = beginRaid(doc, now);
        if (typeof begun === "string") error = begun;
        else this.session = begun;
        break;
      }
      case "/act": {
        if (doc.fight?.id !== body.raid) { error = "no_fight"; break; }
        const session = this.sessionFor(doc);
        if (!session) { error = "not_battle"; break; }
        error = actRaid(doc, session, player, (body.intent ?? {}) as RaidIntent, now);
        break;
      }
      default:
        return json({ error: "not_found" }, 404);
    }
    if (error) {
      await this.save(doc);
      return json({ error, view: raidView(doc, player, Number(body.from ?? 0), now) }, STATUS[error] ?? 422);
    }
    await this.settle(doc, before);
    return json(raidView(doc, player, Number(body.from ?? 0), now));
  }

  /** The fight's own clock: a turn or a gathering that ran out, the quiet, a fight too long. */
  async alarm(): Promise<void> {
    if (!this.doc) {
      const raw = await this.ctx.storage.get<string>(DOC);
      if (!raw) return;
      this.doc = JSON.parse(raw) as RaidDoc;
    }
    const doc = this.doc;
    const before = JSON.stringify(bossStatus(doc));
    this.session = tickRaid(doc, this.sessionFor(doc), Date.now()) ?? this.session;
    await this.settle(doc, before);
  }
}
