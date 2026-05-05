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

// XP needed to advance a stat from `base` to `base + 1`.
export function xpToNextStatLevel(base: number): number {
  if (!Number.isFinite(base) || base < 1) return STAT_XP_PER_BASE_POINT;
  return STAT_XP_PER_BASE_POINT * Math.floor(base);
}

// LUK roll chance — base 10% + 1% per current LUK point, capped at 50%.
// Used as the per-action gate for granting LUK xp.
export function lukRollChance(baseLUK: number): number {
  const lk = Number.isFinite(baseLUK) && baseLUK > 0 ? baseLUK : 0;
  return Math.min(LUK_MAX_CHANCE, LUK_BASE_CHANCE + LUK_PER_POINT * lk);
}
