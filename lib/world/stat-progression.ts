import type { LifeSkill } from "./types";
import type { StatKey } from "@/lib/game";

// ─── Passive stat progression ─────────────────────────────────────────
// Every qualifying action banks `STAT_XP_PER_ACTION` exp into a stat-
// specific pool. When the pool reaches 50 × current_base_stat, the stat
// auto-levels by 1 (overflow rolls forward). The "base" used for the
// cost calc is the player's innate value — `playerBuild.stats[k]` — i.e.,
// items and skill stat bonuses are NOT included.

export const STAT_XP_PER_ACTION = 10;
export const STAT_XP_PER_BASE_POINT = 50;

// Per-stat multiplier on the xp-to-next-level cost. 1.0 keeps the default
// 50×base curve; >1 makes the stat slower to grow (more xp needed); <1
// speeds it up. Tuned so:
//   - AGI grew too fast in early playtests because every overworld
//     travel hop grants xp — bumped to 2.0× so a single travel leg
//     contributes proportionally less of a level.
//   - DEX was painful to raise because only the 6 hard-craft skills
//     feed it — dropped to 0.6× so a few crafting sessions actually
//     move the needle.
// Other stats stay at 1.0× until playtest data suggests retuning.
export const STAT_LEVEL_COST_MULT: Record<StatKey, number> = {
  STR: 1.0,
  AGI: 2.0,
  POW: 1.0,
  VIT: 1.0,
  DEX: 0.6,
  LUK: 1.0,
  DEF: 1.0,
  INT: 1.0,
};

export const LUK_BASE_CHANCE = 0.10;
export const LUK_PER_POINT = 0.01;
export const LUK_MAX_CHANCE = 0.50;

// Activity → stat granter map for life-skill actions.
// Hunting is intentionally absent: it's combat-driven, so STR/POW grants
// arrive via skill use in the resulting battle.
// Begging is absent: it's a social pickup, not a stat-shaping activity.
export const STAT_FROM_LIFE_SKILL: Partial<Record<LifeSkill, StatKey>> = {
  // Gathering → VIT (endurance + tolerance from physical resource work)
  mining: "VIT",
  woodcutting: "VIT",
  fishing: "VIT",
  herbalism: "VIT",
  venom: "VIT",
  // Hard crafts → DEX (precision handwork)
  forge: "DEX",
  tailoring: "DEX",
  jewelry: "DEX",
  alchemy: "DEX",
  chef: "DEX",
  accessory: "DEX",
  // Steal → DEX (sleight of hand / pickpocket finesse)
  steal: "DEX",
  // Cultural / arts → INT
  reading: "INT",
  music: "INT",
  drawing: "INT",
  writing: "INT",
  chess: "INT",
};

export function statFromLifeSkill(skill: LifeSkill | undefined): StatKey | null {
  if (!skill) return null;
  return STAT_FROM_LIFE_SKILL[skill] ?? null;
}

// XP needed to advance a stat from `base` to `base + 1`. Pass the stat
// key to apply its per-stat cost multiplier (see STAT_LEVEL_COST_MULT);
// omit it to fall back to the unscaled curve (legacy callers / generic
// estimates).
export function xpToNextStatLevel(base: number, key?: StatKey): number {
  if (!Number.isFinite(base) || base < 1) {
    const baseCost = STAT_XP_PER_BASE_POINT;
    return Math.max(1, Math.round(baseCost * (key ? STAT_LEVEL_COST_MULT[key] : 1)));
  }
  const mult = key ? STAT_LEVEL_COST_MULT[key] : 1;
  return Math.max(1, Math.round(STAT_XP_PER_BASE_POINT * Math.floor(base) * mult));
}

// LUK roll chance — base 10% + 1% per current LUK point, capped at 50%.
// Used as the per-action gate for granting LUK xp.
export function lukRollChance(baseLUK: number): number {
  const lk = Number.isFinite(baseLUK) && baseLUK > 0 ? baseLUK : 0;
  return Math.min(LUK_MAX_CHANCE, LUK_BASE_CHANCE + LUK_PER_POINT * lk);
}
