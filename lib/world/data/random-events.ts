// Random events fired by `{ t: "rollRandomEvent" }` on a leaf's onEnter.
//
// On each entry the engine:
//   1. Computes per-type probabilities (fight is fixed, treasure/meet scale
//      with the player's LUK stat).
//   2. Rolls a single uniform [0, 1) — first fight, then treasure, then meet.
//      Whatever doesn't fall in those bands is "nothing happens".
//   3. Picks a specific event from the relevant pool by weight, then
//      dispatches it: fight → triggerBattle, treasure/meet → goto a small
//      dialog scene whose own onEnter applies the loot / lore.
//
// Adding new events is additive: append a record to one of the pool arrays,
// and (for meet/treasure) define the matching scene id in scenes.ts.

export interface MeetEventDef {
  id: string;
  weight: number;
  dialogSceneId: string;
}

export interface FightEventDef {
  id: string;
  weight: number;
  opponentId: string;
}

export interface TreasureEventDef {
  id: string;
  weight: number;
  dialogSceneId: string;
}

// Probability constants. Tunable here — the dispatcher reads them directly.
export const EVENT_PROBABILITY = {
  // Fight is fixed at 10 %. Per the game design this is the steady-state
  // farming rate and doesn't scale with luck.
  fight: 0.10,
  // Treasure: 5 % base + LUK / 200, capped at 25 %.
  treasureBase: 0.05,
  treasureLukDivisor: 200,
  treasureCap: 0.25,
  // Meet: 15 % base + LUK / 300, capped at 35 %.
  meetBase: 0.15,
  meetLukDivisor: 300,
  meetCap: 0.35,
} as const;

export const MEET_EVENTS: readonly MeetEventDef[] = [
  { id: "wanderer",  weight: 2, dialogSceneId: "evt_meet_wanderer" },
  { id: "monk",      weight: 2, dialogSceneId: "evt_meet_monk" },
  { id: "merchant",  weight: 1, dialogSceneId: "evt_meet_merchant" },
];

export const FIGHT_EVENTS: readonly FightEventDef[] = [
  { id: "bandit_ambush",  weight: 3, opponentId: "bandit" },
  { id: "wild_beast",     weight: 2, opponentId: "wild_beast" },
  { id: "ruffian_attack", weight: 2, opponentId: "ruffian" },
];

export const TREASURE_EVENTS: readonly TreasureEventDef[] = [
  { id: "gold_pouch",   weight: 3, dialogSceneId: "evt_treasure_gold" },
  { id: "potion_find",  weight: 3, dialogSceneId: "evt_treasure_potion" },
  { id: "herb_find",    weight: 2, dialogSceneId: "evt_treasure_herb" },
  { id: "jade_find",    weight: 1, dialogSceneId: "evt_treasure_jade" },
];

// Weighted pick from a pool. Returns null only when the pool is empty.
export function pickWeighted<T extends { weight: number }>(
  pool: readonly T[],
  rand01: number,
): T | null {
  if (pool.length === 0) return null;
  let total = 0;
  for (const e of pool) total += e.weight;
  if (total <= 0) return pool[0] ?? null;
  let target = rand01 * total;
  for (const e of pool) {
    target -= e.weight;
    if (target < 0) return e;
  }
  return pool[pool.length - 1] ?? null;
}
