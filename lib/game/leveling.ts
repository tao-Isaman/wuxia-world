import type { Art, CharacterBuild, Skill } from "./types";

// ─── Skill leveling ───────────────────────────────────────────────────
// Every move skill carries a level (1..10). Level 1 cuts the skill's base
// power in half; each level adds back 1/9 of that gap, so level 10 lands
// exactly at the skill's table value. Mastery (`mg`) goes the opposite
// direction — level 1 gives the skill's listed `mg`, level 10 doubles it.
// Rarer skills (higher `ti`) need more xp per level so the climb is
// proportional to the skill's stated tier.

export const SKILL_LEVEL_MIN = 1;
export const SKILL_LEVEL_MAX = 10;
export const ART_LEVEL_MIN = 1;
export const ART_LEVEL_MAX = 10;

// Per-level xp = BASE × current_level × (tier + 1)
// Tier 0 caps at 50·(1+2+…+9) = 2,250 xp total.
// Tier 4 caps at 5× that = 11,250 xp total.
export const SKILL_XP_BASE = 50;

export function getSkillLevel(
  build: CharacterBuild | null | undefined,
  skillId: string | null | undefined,
): number {
  if (!build || !skillId) return SKILL_LEVEL_MIN;
  const lv = build.skillLevels?.[skillId];
  if (typeof lv !== "number" || !Number.isFinite(lv)) return SKILL_LEVEL_MIN;
  return clampLevel(lv);
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return SKILL_LEVEL_MIN;
  if (level < SKILL_LEVEL_MIN) return SKILL_LEVEL_MIN;
  if (level > SKILL_LEVEL_MAX) return SKILL_LEVEL_MAX;
  return Math.floor(level);
}

// bp multiplier — lv1 = 0.5, lv10 = 1.0 (linear).
export function bpMultiplier(level: number): number {
  const lv = clampLevel(level);
  return 0.5 + (lv - 1) / ((SKILL_LEVEL_MAX - 1) * 2);
}

// mg multiplier — lv1 = 1.0, lv10 = 2.0 (linear).
export function mgMultiplier(level: number): number {
  const lv = clampLevel(level);
  return 1 + (lv - 1) / (SKILL_LEVEL_MAX - 1);
}

// Effective base power for a skill at the given level — what `bp` should
// read as inside the damage formula.
export function effectiveBp(skill: Skill, level: number): number {
  return skill.bp * bpMultiplier(level);
}

// Effective mastery contribution for an equipped skill at the given level.
// Used by getMasteryMap when summing per-family mastery.
export function effectiveMg(skill: Skill, level: number): number {
  return skill.mg * mgMultiplier(level);
}

// XP cost to advance from `currentLevel` to `currentLevel + 1`.
// Returns Infinity at SKILL_LEVEL_MAX so callers can't accidentally
// over-level the skill.
export function xpToNextLevel(skill: Skill, currentLevel: number): number {
  const lv = clampLevel(currentLevel);
  if (lv >= SKILL_LEVEL_MAX) return Infinity;
  return SKILL_XP_BASE * lv * (skill.ti + 1);
}

// ─── Inner-art leveling ──────────────────────────────────────────────
// Arts level on the same 1..10 axis as move skills, but the per-level xp
// gap is **2× steeper** at the same tier — arts are the slow-burn power
// curve of a wuxia build, so the climb has to feel weightier than ฝีมือ.

export function clampArtLevel(level: number): number {
  if (!Number.isFinite(level)) return ART_LEVEL_MIN;
  if (level < ART_LEVEL_MIN) return ART_LEVEL_MIN;
  if (level > ART_LEVEL_MAX) return ART_LEVEL_MAX;
  return Math.floor(level);
}

// XP cost to advance an inner art from `currentLevel` to `currentLevel + 1`.
// Twice the skill cost at the same tier; Infinity at ART_LEVEL_MAX.
export function xpToNextArtLevel(art: Art, currentLevel: number): number {
  const lv = clampArtLevel(currentLevel);
  if (lv >= ART_LEVEL_MAX) return Infinity;
  return SKILL_XP_BASE * 2 * lv * (art.ti + 1);
}
