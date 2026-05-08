import type { CharacterBuild } from "@/lib/game";
import type { NpcDef } from "./types";
import { masteryLevel } from "./data/life-skills";

// Pure helpers for the three "bad action" checks: ขโมย, ลอบทำร้าย, ลักพาตัว.
// All three follow the same shape:
//
//   chance = clamp(50 + score - penalty, 5, 95)
//
// Where `score` mixes the relevant base stats and `penalty` scales with the
// target's `defenseTier`. Keeping them in one file makes the formulas easy
// to retune side-by-side and keeps the world-store action handlers thin.

const CHANCE_MIN = 5;
const CHANCE_MAX = 95;
const CHANCE_BASE = 50;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Tier → fail-fight opponent. When a check fails, the NPC fights back with
// a tier-matched opponent (no need to author per-NPC combat builds — the
// shared roster from lib/world/data/opponents.ts covers it). Tiers are
// already populated by the OPPONENT_BY_ID registry.
//
// Steal failures use the "non-fatal" version (player escapes badly, no
// game-over); assassinate / kidnap failures use the fatal version because
// you've actively tried to kill or abduct someone.
export const TIER_TO_BAD_ACTION_OPPONENT: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "thug",                // T1 chaff (no T0 default — civilians fight thug-tier)
  1: "ruffian",             // T1
  2: "iron_palm_thug",      // T2
  3: "blade_master",        // T3
  4: "demonic_master",      // T4
};

function defenseTierOf(npc: NpcDef): 0 | 1 | 2 | 3 | 4 {
  return npc.defenseTier ?? 0;
}

// ─── ขโมย — DEX + LUK/2 + steal_mastery × 3 ─────────────────────────
// Mastery is the one rating that scales: a level-3 thief beats a level-0
// thief by +9 percentage points before any other modifier. Tier penalty
// is gentle (×5) so a careful T2 player can still rob T3 lords with risk.
export function stealChance(
  build: CharacterBuild | null,
  npc: NpcDef,
  stealXp: number,
): number {
  if (!build) return CHANCE_MIN;
  const dex = build.stats.DEX ?? 0;
  const luk = build.stats.LUK ?? 0;
  const mastery = masteryLevel(stealXp);
  const score = dex + luk * 0.5 + mastery * 3;
  const penalty = defenseTierOf(npc) * 5;
  return clamp(CHANCE_BASE + score - penalty, CHANCE_MIN, CHANCE_MAX);
}

// ─── ลอบทำร้าย — STR + DEX + LUK/2 ──────────────────────────────────
// Murder is the riskiest of the three; tier penalty is steep (×8) so a
// T0 player cannot reliably kill a T3 elder no matter how lucky.
export function assassinateChance(
  build: CharacterBuild | null,
  npc: NpcDef,
): number {
  if (!build) return CHANCE_MIN;
  const str = build.stats.STR ?? 0;
  const dex = build.stats.DEX ?? 0;
  const luk = build.stats.LUK ?? 0;
  const score = str + dex + luk * 0.5;
  const penalty = defenseTierOf(npc) * 8;
  return clamp(CHANCE_BASE + score - penalty, CHANCE_MIN, CHANCE_MAX);
}

// ─── ลักพาตัว — STR + VIT + LUK/2 ─────────────────────────────────
// Kidnap leans on raw physical control + endurance; LUK still matters
// because the abduction has to slip past witnesses. Tier penalty (×7)
// sits between steal and assassinate.
export function kidnapChance(
  build: CharacterBuild | null,
  npc: NpcDef,
): number {
  if (!build) return CHANCE_MIN;
  const str = build.stats.STR ?? 0;
  const vit = build.stats.VIT ?? 0;
  const luk = build.stats.LUK ?? 0;
  const score = str + vit + luk * 0.5;
  const penalty = defenseTierOf(npc) * 7;
  return clamp(CHANCE_BASE + score - penalty, CHANCE_MIN, CHANCE_MAX);
}

// XP awarded for a steal attempt regardless of outcome — failures still
// teach the player something. Tuned to feel meaningful but not trivial.
export const STEAL_XP_ON_PASS = 25;
export const STEAL_XP_ON_FAIL = 8;

// Trait deltas applied on a successful bad action. Failures grant nothing
// — the engine punishes via the fail-fight, not a guaranteed evil bump.
export const STEAL_TRAIT_EVIL = 2;
export const ASSASSINATE_TRAIT_EVIL = 8;
export const KIDNAP_TRAIT_EVIL = 6;
