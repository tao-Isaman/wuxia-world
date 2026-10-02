// Power tiers (ระดับพลัง): one number for how strong a fighter is, from what
// they have trained — never from what they wear. Shown before every fight so
// the player knows what they are walking into.
//
//   score = Σ stats (base + inner-art and move-skill bonuses, conflict-scaled; no equipment)
//         + ½ × Σ base power of the slotted move skills at their levels
//         + Σ over known inner arts of (tier + 1) × level
//
// Twelve tiers, each about 1.4× the last. Calibrated on the opponent table:
// a fresh hero and the capital's trainee sit in tier 1, the median foe in
// tier 5, the strongest sect masters in tier 10; 11 and 12 are for a hero
// who has trained far beyond them.

import type { CharacterBuild } from "./types";
import { STAT_KEYS } from "./types";
import { combinedStats } from "./derive";
import { getArt, getSkill } from "./data";
import { effectiveBp } from "./leveling";
import { parseSlotId } from "./slots";
import { computeConflictFactors } from "./skill-conflict";

export interface PowerTier {
  /** 1 (weakest) … 12. */
  tier: number;
  name: string;
  /** Lowest score in this tier. */
  min: number;
}

export const POWER_TIERS: readonly PowerTier[] = [
  { tier: 1, name: "ปุถุชน", min: 0 },
  { tier: 2, name: "ศิษย์ฝึกหัด", min: 25 },
  { tier: 3, name: "นักยุทธ์ชั้นสาม", min: 45 },
  { tier: 4, name: "นักยุทธ์ชั้นสอง", min: 75 },
  { tier: 5, name: "ยอดฝีมือชั้นหนึ่ง", min: 120 },
  { tier: 6, name: "ยอดฝีมือขั้นสุดยอด", min: 180 },
  { tier: 7, name: "ยอดฝีมือไร้เทียมทาน", min: 260 },
  { tier: 8, name: "ปรมาจารย์", min: 370 },
  { tier: 9, name: "มหาปรมาจารย์", min: 520 },
  { tier: 10, name: "ราชันยุทธภพ", min: 720 },
  { tier: 11, name: "เซียนยุทธ์", min: 1000 },
  { tier: 12, name: "เทพยุทธ์", min: 1400 },
];

/** The parts of a fighter's power score, for display and tests. */
export interface PowerBreakdown {
  stats: number;
  moves: number;
  arts: number;
  total: number;
}

export function powerBreakdown(build: CharacterBuild): PowerBreakdown {
  const factors = computeConflictFactors(build, { getSkill, getArt });
  // combinedStats already leaves equipment out.
  const combined = combinedStats(build, factors);
  const stats = STAT_KEYS.reduce((sum, key) => sum + combined[key], 0);
  let moveBp = 0;
  for (const raw of build.skillIds) {
    const slot = parseSlotId(raw);
    if (slot?.kind === "skill") moveBp += effectiveBp(slot.skill, build.skillLevels?.[slot.skill.id] ?? 1);
  }
  const moves = Math.round(moveBp / 2);
  let arts = 0;
  for (const id of new Set([build.artId, ...(build.learnedArtIds ?? [])])) {
    const art = getArt(id);
    if (!art || art.id === "none") continue;
    const level = build.artLevels?.[id] ?? (id === build.artId ? build.artLevel : 1);
    arts += (art.ti + 1) * level;
  }
  return { stats, moves, arts, total: stats + moves + arts };
}

export const powerScore = (build: CharacterBuild): number => powerBreakdown(build).total;

/** The tier a score falls in. */
export function powerTierOf(score: number): PowerTier {
  let found = POWER_TIERS[0];
  for (const tier of POWER_TIERS) if (score >= tier.min) found = tier;
  return found;
}

export const powerTier = (build: CharacterBuild): PowerTier => powerTierOf(powerScore(build));

/** How a foe compares with the hero, by tier gap. */
export type PowerOutlook = "deadly" | "stronger" | "even" | "weaker" | "trivial";
export function powerOutlook(hero: number, foe: number): PowerOutlook {
  const gap = foe - hero;
  return gap >= 2 ? "deadly" : gap === 1 ? "stronger" : gap === 0 ? "even" : gap === -1 ? "weaker" : "trivial";
}
