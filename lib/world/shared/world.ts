// The shared world (docs/design/world-clock-and-shared-world.md §3): what
// belongs to the world, not to one player. In memory these fields stay on the
// store's state (every engine reads `state.npcExt` etc. as before); the world
// owns and persists them apart from the save (WorldService).
import type { WorldStateData } from "../types";

/** The shared fields of a state, in one list (the split of the save follows it). */
export const SHARED_WORLD_KEYS = [
  "worldSeed",
  "worldEventLog",
  "npcExt",
  "lastNpcTickDay",
  "rumorPool",
  "rumorArchive",
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
 * Where the shared world lives. Today: this browser (store/world/shared-local.ts).
 * Later: a server that applies WorldEvents and sends the world back.
 */
export interface WorldService {
  /** The world as last saved, or null when there is none yet. */
  load(): SharedWorld | null;
  /** Save the whole world (the local implementation). */
  save(world: SharedWorld): void;
}
