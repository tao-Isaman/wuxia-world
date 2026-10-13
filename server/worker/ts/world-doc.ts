// The one shared world, as the game server keeps and runs it (docs/online.md
// "The shared world"). Pure: no storage, no requests — WorldObject
// (world-object.ts) stores the document and calls these. The same engines as
// the browser's run it: the NPC week (lib/world/npc-tick.ts) once the world's
// clock passes a week, rumor upkeep every day, and the rumors players' deeds
// start, written here from what the player says happened (never free text).
import { worldTimeAt } from "@/lib/world/clock";
import { getNpc, getScene } from "@/lib/world";
import { SECT_MEMBERSHIPS } from "@/lib/world/data/sect-memberships";
import { seedLiveness } from "@/lib/world/npc-life";
import { tickAllNamedNpcs } from "@/lib/world/npc-tick";
import { ECHO_ARCHETYPES, generatePlayerEcho, isEchoAction, maintainRumors, seedLoreRumors, type EchoContext } from "@/lib/world/rumor-engine";
import { emitWorldEvent, recordWorldEvent } from "@/lib/world/shared/events";
import { newWorldSeed } from "@/lib/world/shared/rng";
import { rebaseDays } from "@/lib/world/shared/rebase";
import { sharedSlice, type SharedWorld } from "@/lib/world/shared/world";
import type { WorldStateData } from "@/lib/world/types";
import { bossSlain } from "@/lib/world/victory";
import { getBoss } from "@/lib/world/data/bosses";
import type { BossStatus } from "@/lib/net/raid-protocol";
import { scheduleTournamentWarning } from "@/lib/world/tournament";
import { emptyData } from "@/store/world/state";

export interface WorldDoc {
  /** Bumped whenever the world changes (clients ask with the rev they hold). */
  rev: number;
  /** Where the world's clock stood when it last ran. */
  day: number;
  time: number;
  world: SharedWorld;
  /** Per player: the people their open quests hold (kept home), until when (ms). */
  pins: Record<string, { ids: string[]; until: number }>;
  /** Per player: when their recent echoes came (ms), for the rate limit. */
  echoes: Record<string, number[]>;
  /** The world bosses as their RaidObjects last told (docs/online.md "World bosses"). */
  bosses?: Record<string, BossStatus>;
}

/** A player's pins last this long without being sent again (two game days). */
export const PIN_TTL_MS = 2 * 3_600_000;
/** Echoes a player may start per real hour. */
export const ECHOES_PER_HOUR = 30;
const MAX_PINS = 40;

/** A full state around the world's fields, for the engines (the hero fields stay empty). */
function shell(doc: WorldDoc): WorldStateData {
  const state = emptyData();
  Object.assign(state, doc.world);
  state.hasGame = true;
  state.day = doc.day;
  state.time = doc.time;
  return state;
}

function commit(doc: WorldDoc, state: WorldStateData): void {
  doc.world = sharedSlice(state);
  doc.day = state.day;
  doc.time = state.time;
  doc.rev += 1;
}

/** A new world at real time `at` (ms): its people where they live, its lore told. */
export function createWorld(at: number, seed: number = newWorldSeed()): WorldDoc {
  const t = worldTimeAt(at);
  const state = emptyData();
  state.hasGame = true;
  state.day = t.day;
  state.time = t.time;
  state.worldSeed = seed;
  state.worldEventLog = [];
  state.lastNpcTickDay = t.day;
  seedLiveness(state);
  seedLoreRumors(state);
  return { rev: 1, day: t.day, time: t.time, world: sharedSlice(state), pins: {}, echoes: {} };
}

/** The people every player's open quests hold right now. */
export function activePins(doc: WorldDoc, at: number): string[] {
  const held = new Set<string>();
  for (const [player, pin] of Object.entries(doc.pins)) {
    if (pin.until < at) { delete doc.pins[player]; continue; }
    for (const id of pin.ids) held.add(id);
  }
  return [...held];
}

/** Record whom a player's quests hold (only known people; a few dozen at most). */
export function setPins(doc: WorldDoc, player: string, ids: readonly string[], at: number): void {
  const known = ids.filter((id) => typeof id === "string" && id.length <= 64 && !!getNpc(id)).slice(0, MAX_PINS);
  if (known.length) doc.pins[player] = { ids: known, until: at + PIN_TTL_MS };
  else delete doc.pins[player];
}

/**
 * Bring the world to real time `at`: on a new day the rumors are kept, and
 * once a week has passed the people live it. Returns whether it changed.
 */
export function advanceWorld(doc: WorldDoc, at: number): boolean {
  const t = worldTimeAt(at);
  if (t.day < doc.day) {
    // The world clock was moved back (WORLD_EPOCH_MS set later): every stamp
    // rewinds with the world's day, so the people keep living from today.
    const state = shell(doc);
    rebaseDays(state, t.day - doc.day);
    state.day = t.day;
    state.time = t.time;
    commit(doc, state);
    return true;
  }
  if (t.day <= doc.day) {
    if (t.day === doc.day && t.time > doc.time) doc.time = t.time;
    return false;
  }
  const state = shell(doc);
  state.day = t.day;
  state.time = t.time;
  tickAllNamedNpcs(state, { currentDay: state.day, seed: state.worldSeed, held: activePins(doc, at) });
  maintainRumors(state, state.day);
  // The tournament is talked about in the inns before it comes.
  scheduleTournamentWarning(state);
  commit(doc, state);
  return true;
}

export interface EchoInput {
  actionId?: unknown;
  targetNpcId?: unknown;
  context?: Partial<Record<keyof EchoContext, unknown>>;
}

/** Why an echo is refused, or null when it is fine. */
export function echoProblem(echo: EchoInput): string | null {
  if (typeof echo.actionId !== "string" || !isEchoAction(echo.actionId)) return "bad_action";
  if (echo.targetNpcId !== undefined && echo.targetNpcId !== null && (typeof echo.targetNpcId !== "string" || !getNpc(echo.targetNpcId))) return "bad_target";
  const ctx = echo.context ?? {};
  if (typeof ctx.archetype !== "string" || !ECHO_ARCHETYPES.includes(ctx.archetype)) return "bad_context";
  if (ctx.sceneId !== null && (typeof ctx.sceneId !== "string" || !getScene(ctx.sceneId))) return "bad_context";
  if (ctx.sectId !== null && (typeof ctx.sectId !== "string" || !(ctx.sectId in SECT_MEMBERSHIPS))) return "bad_context";
  return null;
}

/**
 * A player's deed becomes talk: the server writes the rumor from the echo's
 * templates (lib/world/rumor-engine.ts). Returns an error code, or null.
 */
export function acceptEcho(doc: WorldDoc, player: string, echo: EchoInput, at: number): string | null {
  const problem = echoProblem(echo);
  if (problem) return problem;
  const recent = (doc.echoes[player] ?? []).filter((t) => t > at - 3_600_000);
  if (recent.length >= ECHOES_PER_HOUR) return "too_many";
  doc.echoes[player] = [...recent, at];
  const state = shell(doc);
  const ctx = echo.context as EchoContext;
  const rumorId = generatePlayerEcho({
    state,
    actionId: echo.actionId as string,
    targetNpcId: typeof echo.targetNpcId === "string" ? echo.targetNpcId : undefined,
    context: { archetype: ctx.archetype, sceneId: ctx.sceneId, sectId: ctx.sectId },
  });
  const rumor = rumorId ? state.rumorPool.find((r) => r.id === rumorId) : undefined;
  if (rumor) recordWorldEvent(state, { t: "rumor", rumor });
  commit(doc, state);
  return null;
}

/**
 * One of the simulated people fell to a player in a fight the server checked:
 * they are dead for everyone (their seat and quests pass on in each player's
 * game). Others only die in that player's own game. Returns whether it applied.
 */
export function killInWorld(doc: WorldDoc, npcId: string, player: string, locationId: string): boolean {
  const ext = doc.world.npcExt?.[npcId];
  if (!ext || ext.status === "dead") return false;
  const state = shell(doc);
  emitWorldEvent(state, { t: "npc_killed", npcId, byPlayer: player, day: state.day, locationId });
  commit(doc, state);
  return true;
}

/** A world boss's state, as its RaidObject tells it; a fall is news. Returns whether anything changed. */
export function setBossStatus(doc: WorldDoc, bossId: string, status: BossStatus, fell: boolean): boolean {
  if (!getBoss(bossId)) return false;
  const before = JSON.stringify(doc.bosses?.[bossId] ?? null);
  doc.bosses = { ...(doc.bosses ?? {}), [bossId]: status };
  if (fell) bossFellInWorld(doc, bossId, "", status.fellBy ?? []);
  const changed = fell || JSON.stringify(status) !== before;
  if (changed && !fell) doc.rev++;
  return changed;
}

/** A legendary beast fell to a player (checked) or a party: the jianghu hears of it. */
export function bossFellInWorld(doc: WorldDoc, bossId: string, player: string, party: string[] = []): boolean {
  const state = shell(doc);
  const boss = bossSlain(state, bossId, state.day, party);
  if (!boss) return false;
  const rumor = state.rumorPool.find((r) => r.id === `rumor_boss_${boss.id}_${state.day}`);
  if (rumor) recordWorldEvent(state, { t: "rumor", rumor });
  void player;
  commit(doc, state);
  return true;
}
