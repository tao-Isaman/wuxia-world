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
  // Fight is fixed at 15 %. Random encounters now route through a
  // fight-or-flee screen so the player can decline.
  fight: 0.15,
  // Treasure: 5 % base + LUK / 200, capped at 25 %.
  treasureBase: 0.05,
  treasureLukDivisor: 200,
  treasureCap: 0.25,
  // Meet: 10 % base + LUK / 300, capped at 35 %.
  meetBase: 0.10,
  meetLukDivisor: 300,
  meetCap: 0.35,
} as const;

export const MEET_EVENTS: readonly MeetEventDef[] = [
  { id: "wanderer",  weight: 2, dialogSceneId: "evt_meet_wanderer" },
  { id: "monk",      weight: 2, dialogSceneId: "evt_meet_monk" },
  { id: "merchant",  weight: 1, dialogSceneId: "evt_meet_merchant" },
];

// Tier-based spawn weights — higher tier = rarer. Sums to roughly:
//   T0 5×8 = 40 · T1 10×5 = 50 · T2 10×3 = 30 · T3 5×1.5 = 7.5 · T4 5×0.5 = 2.5
// → ~31 % T0, ~38 % T1, ~23 % T2, ~6 % T3, ~2 % T4 across all encounters.
const TIER_SPAWN_WEIGHT = { 0: 8, 1: 5, 2: 3, 3: 1.5, 4: 0.5 } as const;

// Per-zone enemy-category weights. The leaf id prefix decides which zone
// applies — cities and villages skip beasts entirely; wild zones skew
// strongly toward beasts; sects / temples carry the "supernatural" pool.
import type { EnemyCategory } from "../types";

export type EnemyZone =
  | "city"        // city_*, village_*, inn_*       — humans only
  | "sect"        // sect_*                         — humans + a touch of supernatural
  | "temple"      // temple_* / palace_*            — humans + supernatural
  | "mansion"     // villa_*                        — humans only
  | "wild"        // mt_* / cliff_* / cave_* / valley_* / desert / sea / pool / peak — beasts + humans + supernatural
  | "isle"        // isle_*                         — beasts + humans
  | "frontier";   // tribe / market / desert        — humans + beasts

export const ZONE_CATEGORY_WEIGHT: Record<EnemyZone, Record<EnemyCategory, number>> = {
  city:     { human: 1, beast: 0, supernatural: 0 },
  mansion:  { human: 1, beast: 0, supernatural: 0 },
  sect:     { human: 4, beast: 0, supernatural: 1 },
  temple:   { human: 2, beast: 0, supernatural: 1 },
  wild:     { human: 1, beast: 4, supernatural: 0.5 },
  isle:     { human: 2, beast: 3, supernatural: 0 },
  frontier: { human: 3, beast: 2, supernatural: 0 },
};

// Map a leaf id to its zone — uses the same id-prefix convention as
// LocationView's rest-tier detection. Authors get implicit categorisation
// by following the existing prefix scheme.
export function zoneOfLocation(locationId: string): EnemyZone {
  if (locationId.startsWith("city_")) return "city";
  if (locationId.startsWith("village_")) return "city";
  if (locationId.startsWith("inn_")) return "city";
  if (locationId.startsWith("home_")) return "city";
  if (locationId.startsWith("sect_")) return "sect";
  if (locationId.startsWith("temple_") || locationId.startsWith("palace_")) return "temple";
  if (locationId.startsWith("villa_")) return "mansion";
  if (locationId.startsWith("isle_")) return "isle";
  if (
    locationId.startsWith("tribe_") ||
    locationId.startsWith("market_") ||
    locationId.startsWith("desert_")
  ) {
    return "frontier";
  }
  // mt_* / cliff_* / cave_* / valley_* / pool_* / peak_* / sea_* and any
  // other unprefixed wilderness fall through to "wild".
  return "wild";
}

export const FIGHT_EVENTS: readonly FightEventDef[] = [
  // ─── Tier 0 ────────
  { id: "fight_petty_thief",   weight: TIER_SPAWN_WEIGHT[0], opponentId: "petty_thief" },
  { id: "fight_drunk_brawler", weight: TIER_SPAWN_WEIGHT[0], opponentId: "drunk_brawler" },
  { id: "fight_wild_dog",      weight: TIER_SPAWN_WEIGHT[0], opponentId: "wild_dog" },
  { id: "fight_wild_chicken",  weight: TIER_SPAWN_WEIGHT[0], opponentId: "wild_chicken" },
  { id: "fight_small_snake",   weight: TIER_SPAWN_WEIGHT[0], opponentId: "small_snake" },
  // ─── Tier 1 ────────
  { id: "fight_thug",          weight: TIER_SPAWN_WEIGHT[1], opponentId: "thug" },
  { id: "fight_bandit",        weight: TIER_SPAWN_WEIGHT[1], opponentId: "bandit" },
  { id: "fight_ruffian",       weight: TIER_SPAWN_WEIGHT[1], opponentId: "ruffian" },
  { id: "fight_wild_beast",    weight: TIER_SPAWN_WEIGHT[1], opponentId: "wild_beast" },
  { id: "fight_wild_boar",     weight: TIER_SPAWN_WEIGHT[1], opponentId: "wild_boar" },
  { id: "fight_wild_wolf",     weight: TIER_SPAWN_WEIGHT[1], opponentId: "wild_wolf" },
  { id: "fight_road_bandit",   weight: TIER_SPAWN_WEIGHT[1], opponentId: "road_bandit" },
  { id: "fight_river_pirate",  weight: TIER_SPAWN_WEIGHT[1], opponentId: "river_pirate" },
  { id: "fight_desert_marauder", weight: TIER_SPAWN_WEIGHT[1], opponentId: "desert_marauder" },
  { id: "fight_fortune_thief", weight: TIER_SPAWN_WEIGHT[1], opponentId: "fortune_thief" },
  // ─── Tier 2 ────────
  { id: "fight_mountain_tiger", weight: TIER_SPAWN_WEIGHT[2], opponentId: "mountain_tiger" },
  { id: "fight_brown_bear",     weight: TIER_SPAWN_WEIGHT[2], opponentId: "brown_bear" },
  { id: "fight_viper_snake",    weight: TIER_SPAWN_WEIGHT[2], opponentId: "viper_snake" },
  { id: "fight_giant_centipede",weight: TIER_SPAWN_WEIGHT[2], opponentId: "giant_centipede" },
  { id: "fight_bandit_chief",   weight: TIER_SPAWN_WEIGHT[2], opponentId: "bandit_chief" },
  { id: "fight_iron_palm_thug", weight: TIER_SPAWN_WEIGHT[2], opponentId: "iron_palm_thug" },
  { id: "fight_flying_swallow", weight: TIER_SPAWN_WEIGHT[2], opponentId: "flying_swallow" },
  { id: "fight_poison_practitioner", weight: TIER_SPAWN_WEIGHT[2], opponentId: "poison_practitioner" },
  { id: "fight_wandering_swordsman", weight: TIER_SPAWN_WEIGHT[2], opponentId: "wandering_swordsman" },
  { id: "fight_sect_disciple",  weight: TIER_SPAWN_WEIGHT[2], opponentId: "sect_disciple" },
  // ─── Tier 3 ────────
  { id: "fight_blade_master",   weight: TIER_SPAWN_WEIGHT[3], opponentId: "blade_master" },
  { id: "fight_shadow_assassin",weight: TIER_SPAWN_WEIGHT[3], opponentId: "shadow_assassin" },
  { id: "fight_wudang_disciple",weight: TIER_SPAWN_WEIGHT[3], opponentId: "wudang_disciple" },
  { id: "fight_snow_demon",     weight: TIER_SPAWN_WEIGHT[3], opponentId: "snow_demon" },
  { id: "fight_sect_elder",     weight: TIER_SPAWN_WEIGHT[3], opponentId: "sect_elder" },
  // ─── Tier 4 ────────
  { id: "fight_demonic_master",       weight: TIER_SPAWN_WEIGHT[4], opponentId: "demonic_master" },
  { id: "fight_legendary_swordsman",  weight: TIER_SPAWN_WEIGHT[4], opponentId: "legendary_swordsman" },
  { id: "fight_dragon_phoenix_master",weight: TIER_SPAWN_WEIGHT[4], opponentId: "dragon_phoenix_master" },
  { id: "fight_heretical_grandmaster",weight: TIER_SPAWN_WEIGHT[4], opponentId: "heretical_grandmaster" },
  { id: "fight_immortal_warrior",     weight: TIER_SPAWN_WEIGHT[4], opponentId: "immortal_warrior" },
];

export const TREASURE_EVENTS: readonly TreasureEventDef[] = [
  { id: "gold_pouch",   weight: 3, dialogSceneId: "evt_treasure_gold" },
  { id: "potion_find",  weight: 3, dialogSceneId: "evt_treasure_potion" },
  { id: "herb_find",    weight: 2, dialogSceneId: "evt_treasure_herb" },
  { id: "jade_find",    weight: 1, dialogSceneId: "evt_treasure_jade" },
];

// Build the FIGHT_EVENTS subset that's appropriate for `locationId` —
// each event's `weight` is multiplied by the zone's category weight.
// Cities filter out beasts entirely (zero weight); wild zones favour
// beasts; sects / temples carry the supernatural pool.
import { getOpponent } from "./opponents";

export function fightEventsForLocation(locationId: string): readonly FightEventDef[] {
  const zone = zoneOfLocation(locationId);
  const catWeights = ZONE_CATEGORY_WEIGHT[zone];
  const out: FightEventDef[] = [];
  for (const ev of FIGHT_EVENTS) {
    const opp = getOpponent(ev.opponentId);
    if (!opp) continue;
    const cat = opp.category ?? "human";
    const w = catWeights[cat] ?? 0;
    if (w <= 0) continue;
    out.push({ ...ev, weight: ev.weight * w });
  }
  return out;
}

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
