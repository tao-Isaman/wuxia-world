import type { LifeSkill } from "../types";

// Life-skill display metadata. Keep keys aligned with LIFE_SKILL_KEYS.
export const LIFE_SKILL_LABEL: Record<LifeSkill, string> = {
  mining:      "เหมืองแร่",
  woodcutting: "ตัดไม้",
  hunting:     "ล่าสัตว์",
  fishing:     "ประมง",
  herbalism:   "เก็บสมุนไพร",
  venom:       "เก็บพิษ",
  reading:     "อ่านตำรา",
  music:       "ดนตรี",
  drawing:     "วาดภาพ",
  writing:     "อักษรศิลป์",
  chess:       "หมากรุก",
  begging:     "ขอทาน",
  forge:       "ตีอาวุธ",
  tailoring:   "ตัดเย็บ",
  jewelry:     "ช่างเครื่องประดับ",
  alchemy:     "เภสัช",
  chef:        "ทำอาหาร",
  accessory:   "ช่างเครื่องสาน",
};

export const LIFE_SKILL_ICON: Record<LifeSkill, string> = {
  mining:      "⛏",
  woodcutting: "🪓",
  hunting:     "🏹",
  fishing:     "🎣",
  herbalism:   "🌿",
  venom:       "☠",
  reading:     "📖",
  music:       "🎵",
  drawing:     "🎨",
  writing:     "✒",
  chess:       "♟",
  begging:     "🥣",
  forge:       "🔨",
  tailoring:   "🧵",
  jewelry:     "💍",
  alchemy:     "🧪",
  chef:        "🍳",
  accessory:   "🪭",
};

// Mastery curve. Index N is the xp needed to reach level N + 1.
//   level 1: 0–99 xp
//   level 2: 100–299
//   level 3: 300–699
//   level 4: 700–1499
//   level 5: 1500+ (cap)
export const MASTERY_THRESHOLDS = [0, 100, 300, 700, 1500] as const;
export const MAX_MASTERY = 5 as const;

export function masteryLevel(xp: number): 1 | 2 | 3 | 4 | 5 {
  let lvl: 1 | 2 | 3 | 4 | 5 = 1;
  for (let i = 1; i <= 4; i++) {
    if (xp >= MASTERY_THRESHOLDS[i]!) lvl = (i + 1) as 1 | 2 | 3 | 4 | 5;
  }
  return lvl;
}

// Returns [xpInCurrentLevel, xpNeededForNext] — useful for progress bars.
// At max mastery returns [xp - MASTERY_THRESHOLDS[4], 0] so the UI can
// render a full bar with no "next" target.
export function masteryProgress(xp: number): { lvl: 1 | 2 | 3 | 4 | 5; cur: number; need: number } {
  const lvl = masteryLevel(xp);
  const thresholds = MASTERY_THRESHOLDS as readonly number[];
  if (lvl >= MAX_MASTERY) {
    return { lvl, cur: xp - (thresholds[MAX_MASTERY - 1] ?? 0), need: 0 };
  }
  const base = thresholds[lvl - 1] ?? 0;
  const next = thresholds[lvl] ?? base;
  return { lvl, cur: xp - base, need: next - base };
}

// ─── Drop check ──────────────────────────────────────────────────────
// Each gather rolls a single drop check before any picks. The chance
// depends on how far the player's mastery sits above (or below) the
// resource's level:
//
//   Δ = masteryLevel - resourceLevel        (range −4 .. +4)
//   chance = clamp(0.55 + Δ × 0.15, 0.10, 0.95)
//
// At equal mastery you succeed roughly 55% of the time; each level above
// adds 15% (capped 95%), each level below subtracts 15% (floored 10%).
// Failure still grants partial xp via the gather pipeline so low-tier
// grinding is the legitimate way to climb mastery.
export const DROP_CHECK_BASE = 0.55;
export const DROP_CHECK_PER_DELTA = 0.15;
export const DROP_CHECK_MIN = 0.10;
export const DROP_CHECK_MAX = 0.95;

export function gatherSuccessChance(masteryLv: number, resourceLevel: number): number {
  const delta = masteryLv - resourceLevel;
  return Math.max(
    DROP_CHECK_MIN,
    Math.min(DROP_CHECK_MAX, DROP_CHECK_BASE + delta * DROP_CHECK_PER_DELTA),
  );
}
