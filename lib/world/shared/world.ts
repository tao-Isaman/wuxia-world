// The shared world (docs/design/world-clock-and-shared-world.md §3,
// docs/online.md "The shared world"): what belongs to the world, not to one
// player — the simulated jianghu (its people, their lives and deaths) and the
// talk (rumors). In memory these fields stay on the store's state (every
// engine reads `state.npcExt` etc. as before); the world owns and persists
// them apart from the save (WorldService). On the game server there is one
// world for everyone and the server runs it.
import type { EchoContext } from "../rumor-engine";
import type { WorldStateData } from "../types";

/** The shared fields of a state, in one list (the split of the save follows it). */
export const SHARED_WORLD_KEYS = [
  "worldSeed",
  "worldEventLog",
  "npcExt",
  "lastNpcTickDay",
  "rumorPool",
  "rumorArchive",
] as const satisfies readonly (keyof WorldStateData)[];

/**
 * Fields that were the world's before save v28 and are now each player's own:
 * whom this hero killed or carried off, the beasts this hero felled, this
 * hero's tournament. In a world shared by many, one player's deeds there must
 * not empty the map for everyone. (A killing of one of the simulated people in
 * a fight the server checks still reaches the world, docs/online.md.)
 */
export const PLAYER_FROM_WORLD_KEYS = [
  "assassinatedNpcIds",
  "kidnappedNpcIds",
  "kidnappedUntil",
  "bossDefeatedDay",
  "tournament",
  "tournamentHistory",
] as const satisfies readonly (keyof WorldStateData)[];

export type SharedWorldKey = (typeof SHARED_WORLD_KEYS)[number];
export type SharedWorld = Pick<WorldStateData, SharedWorldKey>;

/** The shared slice of a state (a shallow copy). */
export function sharedSlice(state: WorldStateData): SharedWorld {
  const out = {} as Record<SharedWorldKey, unknown>;
  for (const key of SHARED_WORLD_KEYS) out[key] = state[key];
  return out as SharedWorld;
}

/** Whether two states share the same world slice (by reference, field by field). */
export function sameWorld(a: WorldStateData, b: WorldStateData): boolean {
  return SHARED_WORLD_KEYS.every((key) => a[key] === b[key]);
}

/**
 * Where the shared world lives: this browser (store/world/shared-local.ts), or
 * the game server, which runs it and hands it out (store/cloud-world.ts; then
 * `save` writes nothing).
 */
export interface WorldService {
  /** The world as last saved, or null when there is none yet. */
  load(): SharedWorld | null;
  /** Save the whole world (the local implementation). */
  save(world: SharedWorld): void;
}

// ─── Who runs the world ────────────────────────────────────────────────
let serverRunsWorld = false;
let echoSink: ((echo: PlayerEcho) => void) | null = null;

/** What the hero did, for the server to tell (it writes the rumor itself). */
export interface PlayerEcho {
  actionId: string;
  targetNpcId?: string;
  context: EchoContext;
}

/**
 * The game server runs the world (true while a character is played there):
 * the browser then neither simulates the people nor keeps the rumors, and the
 * hero's deeds go to the server as echoes (`sink`).
 */
export function setServerRunsWorld(on: boolean, sink: ((echo: PlayerEcho) => void) | null = null): void {
  serverRunsWorld = on;
  echoSink = on ? sink : null;
}

/** Whether the game server runs the world (see setServerRunsWorld). */
export function worldRunsOnServer(): boolean {
  return serverRunsWorld;
}

/** Hand a deed to the server, when it runs the world. */
export function sendPlayerEcho(echo: PlayerEcho): void {
  echoSink?.(echo);
}
