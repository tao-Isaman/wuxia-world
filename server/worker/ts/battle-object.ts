// BattleObject: the battles of one character (a Durable Object per character,
// docs/online.md "Battles on the server"). It stages a fight from the saved
// state, replays the browser's command log as it streams in, and gives the
// verdict and the spoils. A win pays its gold through the character's
// allowance on the account (Rust AccountObject `/grant`), a felled beast stays
// away for this character, and a killing of one of the simulated people
// reaches the shared world (WorldObject).
//
// Routes (from the router in entry.ts, which checked the session and loaded the save):
//   POST /start  { player, characterId, save }  → BattleStartReply
//   POST /log    { battleId, from, commands }   → { at }
//   POST /finish { battleId, from, commands }   → BattleVerdict
import { DurableObject } from "cloudflare:workers";
import { worldNow } from "@/lib/world/clock";
import { getOpponent } from "@/lib/world/data/opponents";
import type { BattleSession } from "@/lib/game/grid/session";
import type { BattleStartReply, BattleVerdict } from "@/lib/net/play-protocol";
import type { WorldStateData } from "@/lib/world/types";
import { judge, newSession, playCommands, stageBattle, withPartyBonus, type BattleRecord, type BossDays } from "./battle-doc";
import { accountObjectName, hubObjectName, WORLD_OBJECT_NAME, type Env } from "./env";
import { callObject, json, readJson } from "./http";

const RECORD = "battle";
const BOSSES = "bosses";
const STARTS = "starts";
/** Fights a character may start per real minute. */
const STARTS_PER_MINUTE = 12;

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class BattleObject extends DurableObject<Env> {
  private record: BattleRecord | null = null;
  private session: BattleSession | null = null;
  private loaded = false;

  private async load(): Promise<BattleRecord | null> {
    if (this.loaded) return this.record;
    const raw = await this.ctx.storage.get<string>(RECORD);
    this.record = raw ? (JSON.parse(raw) as BattleRecord) : null;
    this.loaded = true;
    return this.record;
  }

  private async save(): Promise<void> {
    if (this.record) await this.ctx.storage.put(RECORD, JSON.stringify(this.record));
  }

  /** The record's session, rebuilt by replaying its log when this object was asleep. */
  private sessionOf(record: BattleRecord): BattleSession | null {
    if (this.session && this.record === record) return this.session;
    const session = newSession(record);
    const log = record.commands;
    record.commands = [];
    if (playCommands(record, session, 0, log)) return null;
    this.session = session;
    return session;
  }

  private async start(body: { player?: unknown; characterId?: unknown; save?: unknown }): Promise<Response> {
    if (typeof body.player !== "string" || typeof body.characterId !== "string") return json({ error: "bad_request" }, 400);
    const now = Date.now();
    const starts = ((await this.ctx.storage.get<number[]>(STARTS)) ?? []).filter((t) => t > now - 60_000);
    if (starts.length >= STARTS_PER_MINUTE) return json({ error: "too_fast" }, 429);
    const bosses = (await this.ctx.storage.get<BossDays>(BOSSES)) ?? {};
    const seed = new Uint32Array(1);
    crypto.getRandomValues(seed);
    const staged = stageBattle(body.save as WorldStateData, {
      battleId: randomHex(8), seed: seed[0]! || 1, player: body.player, characterId: body.characterId,
    }, bosses, now);
    if ("error" in staged) return json({ error: staged.error }, staged.error === "boss_resting" ? 409 : 422);
    // A new fight replaces one left unfinished (a reload mid-fight restarts it).
    this.record = staged;
    this.session = newSession(staged);
    this.loaded = true;
    await this.ctx.storage.put({ [RECORD]: JSON.stringify(staged), [STARTS]: [...starts, now] });
    return json({ battleId: staged.battleId, seed: staged.seed, start: staged.start } satisfies BattleStartReply);
  }

  private async play(body: { battleId?: unknown; from?: unknown; commands?: unknown }, finish: boolean): Promise<Response> {
    const record = await this.load();
    if (!record || record.battleId !== body.battleId) return json({ error: "no_battle" }, 404);
    if (record.verdict) return finish ? json(record.verdict) : json({ at: record.commands.length });
    const session = this.sessionOf(record);
    if (!session) return json({ error: "bad_log" }, 422);
    const error = playCommands(record, session, Number(body.from), body.commands);
    if (error) {
      // A log that does not fit: the battle is void (no verdict, no spoils).
      if (error === "bad_log") { this.record = null; this.session = null; await this.ctx.storage.delete(RECORD); }
      return json({ error, at: record.commands.length }, error === "gap" ? 409 : 422);
    }
    if (!finish) {
      await this.save();
      return json({ at: record.commands.length });
    }
    const verdict = judge(record, session);
    if (!verdict) return json({ error: "not_over", at: record.commands.length }, 422);
    if (verdict.spoils && await this.partyBonus(record)) verdict.spoils = withPartyBonus(verdict.spoils);
    record.verdict = verdict;
    await this.save();
    await this.consequences(record, verdict);
    return json(verdict);
  }

  /** Whether another online party member stands on the hero's map (the player's hub asks the party). */
  private async partyBonus(record: BattleRecord): Promise<boolean> {
    const location = record.context.currentSceneId;
    if (!location) return false;
    const hub = this.env.HUBS.get(this.env.HUBS.idFromName(hubObjectName(record.player)));
    const reply = await hub.fetch(`https://hub/internal/party-bonus?location=${encodeURIComponent(location)}`, {
      headers: { "x-hub-user": record.player },
    }).catch(() => null);
    const body = reply?.ok ? await reply.json().catch(() => null) as { bonus?: boolean } | null : null;
    return !!body?.bonus;
  }

  /** What a checked win changes beyond the hero: gold allowance, beasts, the world. */
  private async consequences(record: BattleRecord, verdict: BattleVerdict): Promise<void> {
    if (verdict.winner !== "A" || verdict.escaped) return;
    const gold = verdict.spoils?.gold ?? 0;
    if (gold > 0) {
      const account = this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName(accountObjectName(record.player)));
      await account.fetch(`https://account/characters/${encodeURIComponent(record.characterId)}/grant`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ gold }),
      });
    }
    const world = () => this.env.WORLD.get(this.env.WORLD.idFromName(WORLD_OBJECT_NAME));
    const opponent = getOpponent(record.pending.opponentId);
    if (opponent?.boss) {
      const bosses = (await this.ctx.storage.get<BossDays>(BOSSES)) ?? {};
      await this.ctx.storage.put(BOSSES, { ...bosses, [opponent.id]: worldNow().day });
      await callObject(world(), "/boss", { player: record.player, bossId: opponent.id });
    }
    if (record.pending.killNpcId) {
      await callObject(world(), "/kill", { player: record.player, npcId: record.pending.killNpcId, locationId: record.context.currentSceneId });
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "not_found" }, 404);
    const body = await readJson<Record<string, unknown>>(request, 2_000_000);
    if (!body) return json({ error: "bad_request" }, 400);
    switch (new URL(request.url).pathname) {
      case "/start": return this.start(body);
      case "/log": return this.play(body, false);
      case "/finish": return this.play(body, true);
      default: return json({ error: "not_found" }, 404);
    }
  }
}
