// Walk-tick tables: zones, foe pools and power scaling. Fights are no longer
// a dice roll that springs on the hero: a walk tick may *spawn* a foe on the
// map (`rollFoeSpawn` in lib/world/encounters.ts, by habitat, power and any hunt),
// it waits there, and touching it opens the fight-or-flee encounter. The law
// and betrayed-sect hunters still catch up on a roll (`rollWalkEvent`).
// Treasure and meeting events are gone.

export interface FightEventDef {
  id: string;
  weight: number;
  opponentId: string;
  /** Multiplies the power-shaped weight (default 1): a rarer encounter. */
  share?: number;
}

// How often foes turn up on a map while the hero walks. Tunable here.
export const FOE_SPAWN = {
  /** Chance per walk tick that a foe appears (while fewer than `maxPerMap` are about). */
  chance: 0.3,
  /** While hunting a kill-quest target that lives in this zone. */
  huntChance: 0.8,
  /** Most foes waiting on one map at once. */
  maxPerMap: 3,
} as const;

// Static base weight per tier — used at power 0 (early game). The
// dynamic helper `tierWeightForPower` reshapes these as the player's
// progression climbs so endgame players see fewer T0 chaff and more
// T3 / T4 / Elite encounters.
const TIER_SPAWN_WEIGHT = { 0: 8, 1: 5, 2: 3, 3: 1.5, 4: 0.5, 5: 0 } as const;

// Player power index (0..1). Drives dynamic tier weights + the
// OPPONENT_STAT_SCALE multiplier on random opponent base stats.
//   - early game (day 1, no sect): power = 0 → unchanged behavior
//   - late game (day 200+ OR sect rank ≤ 1): power = 1 → harder pool
import type { WorldStateData } from "../types";
import { setOpponentStatScale } from "./opponents";

export function playerPowerIndex(state: WorldStateData): number {
  let p = state.day / 200;
  for (const m of Object.values(state.sectMembership)) {
    if (!m) continue;
    // Sect rank: 9 (entry) → 1 (top). Map rank 9 → 0, rank 1 → 1.
    const rankPower = (9 - m.rank) / 8;
    if (rankPower > p) p = rankPower;
  }
  return Math.max(0, Math.min(1, p));
}

// Compute and APPLY the opponent stat scale. Call before any random
// encounter rolls. Returns the scale (informational).
export function applyOpponentStatScale(state: WorldStateData): number {
  const p = playerPowerIndex(state);
  // Scale: 1.0 at power 0 → 1.6 at power 1.0 (60% stat boost at endgame)
  const scale = 1 + p * 0.6;
  setOpponentStatScale(scale);
  return scale;
}

// Dynamic tier weight by player power. Curve shifts the bell toward
// higher tiers as power climbs:
//   power 0 (start): T0 8, T1 5, T2 3,    T3 1.5, T4 0.5, T5 0,   Elite 0
//   power 0.5:       T0 4.5, T1 3.5, T2 3.5, T3 3.75, T4 2.75, T5 0, Elite 1.5
//   power 1.0:       T0 1, T1 2, T2 4,    T3 6,   T4 5,   T5 2,   Elite 3
// T5 opens at power 0.6 and stays rarer than T4.
export function tierWeightForPower(tier: 0 | 1 | 2 | 3 | 4 | 5 | "elite", power: number): number {
  switch (tier) {
    case 0: return Math.max(0.5, 8 - power * 7);
    case 1: return Math.max(0.5, 5 - power * 3);
    case 2: return 3 + power * 1;
    case 3: return 1.5 + power * 4.5;
    case 4: return 0.5 + power * 4.5;
    case 5: return power < 0.6 ? 0 : 0.5 + (power - 0.6) * 3.75;
    case "elite": return power * 3; // unlocks gradually with progression
  }
}

/** Places where people live — cities, villages, homes, inns, sects, temples,
 *  the palace, villas, markets and tribes. No foe roams there on its own;
 *  only the target of an active kill quest can show up (`rollFoeSpawn`).
 *  Roads and the wilds (caves, mountains, cliffs, valleys, isles, deserts…)
 *  keep their roaming foes. */
const SETTLED_PREFIXES = ["city_", "village_", "home_", "inn_", "sect_", "temple_", "palace_", "villa_", "market_", "tribe_"] as const;
export function isSettledPlace(locationId: string): boolean {
  return SETTLED_PREFIXES.some((p) => locationId.startsWith(p));
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
  { id: "fight_snow_leopard",   weight: TIER_SPAWN_WEIGHT[3], opponentId: "snow_leopard" },
  { id: "fight_sect_elder",     weight: TIER_SPAWN_WEIGHT[3], opponentId: "sect_elder" },
  // ─── Tier 4 ────────
  { id: "fight_demonic_master",       weight: TIER_SPAWN_WEIGHT[4], opponentId: "demonic_master" },
  { id: "fight_legendary_swordsman",  weight: TIER_SPAWN_WEIGHT[4], opponentId: "legendary_swordsman" },
  { id: "fight_heretical_grandmaster",weight: TIER_SPAWN_WEIGHT[4], opponentId: "heretical_grandmaster" },
  // ─── Elite (endgame) — weight 0 in static pool; dynamic gating in
  // fightEventsForLocation lifts these once player power crosses
  // ~0.3+. Prefix `elite_` so the dynamic weight picker can detect them.
  { id: "fight_elite_void_grandmaster",weight: 0, opponentId: "elite_void_grandmaster" },
  { id: "fight_elite_iron_mountain",   weight: 0, opponentId: "elite_iron_mountain" },
  { id: "fight_elite_phoenix_empress", weight: 0, opponentId: "elite_phoenix_empress" },
  // ─── Variants and gangs (tier weight comes from the opponent's `ti`) ──
  { id: "fight_vampire_bat",       weight: TIER_SPAWN_WEIGHT[1], opponentId: "vampire_bat" },
  { id: "fight_bandit_archer",     weight: TIER_SPAWN_WEIGHT[1], opponentId: "bandit_archer" },
  { id: "fight_frost_wolf",        weight: TIER_SPAWN_WEIGHT[2], opponentId: "frost_wolf" },
  { id: "fight_blood_boar",        weight: TIER_SPAWN_WEIGHT[2], opponentId: "blood_boar" },
  { id: "fight_bandit_lieutenant", weight: TIER_SPAWN_WEIGHT[2], opponentId: "bandit_lieutenant" },
  { id: "fight_night_blade",       weight: TIER_SPAWN_WEIGHT[2], opponentId: "night_blade" },
  { id: "fight_demon_cult_zealot", weight: TIER_SPAWN_WEIGHT[2], opponentId: "demon_cult_zealot" },
  { id: "fight_golden_tiger",      weight: TIER_SPAWN_WEIGHT[3], opponentId: "golden_tiger" },
  { id: "fight_jade_python",       weight: TIER_SPAWN_WEIGHT[3], opponentId: "jade_python" },
  { id: "fight_thunder_eagle",     weight: TIER_SPAWN_WEIGHT[3], opponentId: "thunder_eagle" },
  { id: "fight_shadowless_swordsman", weight: TIER_SPAWN_WEIGHT[3], opponentId: "shadowless_swordsman" },
  { id: "fight_iron_crab",         weight: TIER_SPAWN_WEIGHT[3], opponentId: "iron_crab" },
  { id: "fight_stone_turtle",      weight: TIER_SPAWN_WEIGHT[4], opponentId: "stone_turtle" },
  { id: "fight_elite_bandit_king", weight: 0, opponentId: "elite_bandit_king" },
  { id: "fight_elite_cult_elder",  weight: 0, opponentId: "elite_cult_elder" },
  { id: "fight_elite_bear_king",   weight: 0, opponentId: "elite_bear_king" },
  // Named villains (rigged NPC sheets): rarer than the other elites (`share`).
  { id: "fight_elite_villain_zhou", weight: 0, opponentId: "elite_villain_zhou", share: 0.35 },
  { id: "fight_elite_villain_xie", weight: 0, opponentId: "elite_villain_xie", share: 0.35 },
  { id: "fight_elite_villain_yan", weight: 0, opponentId: "elite_villain_yan", share: 0.35 },
  { id: "fight_elite_villain_qing", weight: 0, opponentId: "elite_villain_qing", share: 0.35 },
  { id: "fight_elite_villain_ying", weight: 0, opponentId: "elite_villain_ying", share: 0.35 },
  { id: "fight_elite_villain_zhao", weight: 0, opponentId: "elite_villain_zhao", share: 0.35 },
  { id: "fight_elite_villain_dushi", weight: 0, opponentId: "elite_villain_dushi", share: 0.35 },
  { id: "fight_elite_villain_huibao", weight: 0, opponentId: "elite_villain_huibao", share: 0.35 },
  { id: "fight_elite_villain_xuelang", weight: 0, opponentId: "elite_villain_xuelang", share: 0.35 },
  { id: "fight_elite_villain_dushou", weight: 0, opponentId: "elite_villain_dushou", share: 0.35 },
  // ─── Tier 5 (power ≥ 0.6 only) ────────
  { id: "fight_t5_nameless_sword_hermit", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_nameless_sword_hermit" },
  { id: "fight_t5_blood_blade_lord", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_blood_blade_lord" },
  { id: "fight_t5_poison_matriarch", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_poison_matriarch" },
  { id: "fight_t5_iron_monk", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_iron_monk" },
  { id: "fight_t5_white_tiger", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_white_tiger" },
  { id: "fight_t5_wolf_king", weight: TIER_SPAWN_WEIGHT[5], opponentId: "t5_wolf_king" },
];


// The FIGHT_EVENTS that live at `sceneId` (a place or a road; habitats.ts),
// each weighted by the power-shaped tier weight (so endgame players see fewer
// T0 chaff and elites / T5 start to appear) and its `share`. The quest guide
// reads the same pool (at power 0) to point a kill quest at its quarry's
// habitat.
import { getOpponent } from "./opponents";
import { foeLivesAt } from "./habitats";

export function fightEventsForLocation(
  locationId: string,
  power = 0,
): readonly FightEventDef[] {
  const out: FightEventDef[] = [];
  for (const ev of FIGHT_EVENTS) {
    if (!foeLivesAt(ev.opponentId, locationId)) continue;
    const opp = getOpponent(ev.opponentId);
    if (!opp) continue;
    const tierKey: 0 | 1 | 2 | 3 | 4 | 5 | "elite" =
      opp.id.startsWith("elite_") ? "elite" : ((opp.ti ?? 0) as 0 | 1 | 2 | 3 | 4 | 5);
    const tierWeight = tierWeightForPower(tierKey, power);
    if (tierWeight <= 0) continue;
    out.push({ ...ev, weight: tierWeight * (ev.share ?? 1) });
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
