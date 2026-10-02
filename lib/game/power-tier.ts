// Power tiers (ระดับพลัง): one number for how strong a fighter is, from what
// they have trained — never from what they wear. Shown before every fight so
// the player knows what they are walking into.
//
//   score = Σ stats (base + inner-art and move-skill bonuses, conflict-scaled; no equipment)
//         + ½ × Σ base power of the slotted move skills at their levels
//         + Σ over known inner arts of (tier + 1) × level
//
// Twelve tiers, each about 1.4× the last. Players see only the names (no
// numbers); `tier` orders them and drives the warning's verdict. Calibrated on the opponent table:
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
  /** The tier's own colour (badge fill), from dull grey up to radiant gold. */
  color: string;
  /** Text colour that reads on `color`. */
  ink: string;
}

const DARK = "#1b130c", LIGHT = "#fff8ea";
export const POWER_TIERS: readonly PowerTier[] = [
  { tier: 1, name: "สามัญชน", min: 0, color: "#8b8d84", ink: DARK },
  { tier: 2, name: "ศิษย์ฝึกหัด", min: 25, color: "#d8cfb2", ink: DARK },
  { tier: 3, name: "ศิษย์สำนัก", min: 45, color: "#6cae55", ink: DARK },
  { tier: 4, name: "มือดีประจำถิ่น", min: 75, color: "#1f7a6d", ink: LIGHT },
  { tier: 5, name: "ท่องเที่ยวทั่วหล้า", min: 120, color: "#2a6cbf", ink: LIGHT },
  { tier: 6, name: "ผู้เชี่ยวชาญวรยุทธ์", min: 180, color: "#5148c4", ink: LIGHT },
  { tier: 7, name: "ฝีมือล้ำลึกเหนือคน", min: 260, color: "#8640bb", ink: LIGHT },
  { tier: 8, name: "วรยุทธโดดเด่นใต้หล้า", min: 370, color: "#b3327f", ink: LIGHT },
  { tier: 9, name: "จอมยุทธไร้พ่าย", min: 520, color: "#bf2f25", ink: LIGHT },
  { tier: 10, name: "ปรมาจารย์ยุทธภพ", min: 720, color: "#e9802a", ink: DARK },
  { tier: 11, name: "เป็นหนึ่งในยุทธจักร", min: 1000, color: "#ecc338", ink: DARK },
  { tier: 12, name: "ยอดคนใต้หล้า", min: 1400, color: "#fff0b0", ink: DARK },
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
