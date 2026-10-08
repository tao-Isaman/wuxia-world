// The shared world kept in this browser (docs/design/world-clock-and-shared-
// world.md §3): a WorldService on its own localStorage key, beside the
// player's save. A server-backed service can replace it without touching the
// engines, which keep reading the shared fields off the store's state.
import type { StoreApi } from "zustand";
import { validateAndRepair, type WorldStateData } from "@/lib/world";
import { seedLiveness } from "@/lib/world/npc-life";
import { seedLoreRumors } from "@/lib/world/rumor-engine";
import { worldNow } from "@/lib/world/clock";
import { newWorldSeed } from "@/lib/world/shared/rng";
import { takeCarriedWorldKeys } from "./persist";
import { SHARED_WORLD_KEYS, sameWorld, sharedSlice, type SharedWorld, type WorldService } from "@/lib/world/shared/world";

/** The localStorage key of the shared world. Never rename it. */
export const SHARED_WORLD_KEY = "wusia-shared-v1";
/** Bumped only when the shared world's shape changes. */
export const SHARED_WORLD_VERSION = 1;

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export const localWorldService: WorldService = {
  load() {
    try {
      const raw = storage()?.getItem(SHARED_WORLD_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { version?: number; world?: Partial<SharedWorld> };
      if (!parsed || typeof parsed.world !== "object" || !parsed.world) return null;
      return parsed.world as SharedWorld;
    } catch {
      return null;
    }
  },
  save(world) {
    try {
      storage()?.setItem(SHARED_WORLD_KEY, JSON.stringify({ version: SHARED_WORLD_VERSION, world }));
    } catch {
      // Full or blocked storage: the world lives on in memory this session.
    }
  },
};

/**
 * Lay the shared world over a state in place: the stored world if there is
 * one, else the state's own, seeded when empty. Fields in `keep` (the ones
 * the loaded save carried itself: an old save) and fields the stored world
 * lacks keep the state's values.
 */
export function joinSharedWorld(state: WorldStateData, stored: Partial<SharedWorld> | null, keep: readonly string[] = []): void {
  if (stored) {
    for (const key of SHARED_WORLD_KEYS) {
      if (keep.includes(key)) continue;
      if (stored[key] !== undefined && stored[key] !== null) (state as unknown as Record<string, unknown>)[key] = stored[key];
    }
    // `tournament` may be null on purpose.
    if (stored.tournament === null && !keep.includes("tournament")) state.tournament = null;
  }
  if (!state.worldSeed) state.worldSeed = newWorldSeed();
  if (!Array.isArray(state.worldEventLog)) state.worldEventLog = [];
  if (!state.hasGame) {
    const t = worldNow();
    state.day = t.day;
    state.time = t.time;
  }
  // A new world starts now: its people where they live, its lore told.
  if (Object.keys(state.npcExt ?? {}).length === 0) state.lastNpcTickDay = state.day;
  // Completes older rosters and registers the generated people (idempotent).
  seedLiveness(state);
  seedLoreRumors(state);
}

/**
 * Join the store to its shared world once, after the save has loaded: read
 * the world from `service` (or seed it), repair ids against it, write it back,
 * then save it whenever an action changes it.
 */
export function attachSharedWorld<S extends WorldStateData>(store: StoreApi<S>, service: WorldService = localWorldService): () => void {
  const draft = { ...store.getState() } as S;
  joinSharedWorld(draft, service.load(), takeCarriedWorldKeys());
  validateAndRepair(draft);
  store.setState(draft);
  service.save(sharedSlice(store.getState()));
  return store.subscribe((s, prev) => {
    if (!sameWorld(s, prev)) service.save(sharedSlice(s));
  });
}
