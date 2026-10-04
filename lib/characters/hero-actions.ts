/**
 * The heroes' painted action sprites (m1 and f1 only), built by
 * scripts/build-hero-actions.ts from painted strips, all facing right:
 *
 *   /art/characters/<id>-combat.png  6 × 8 cells — one attack row per weapon
 *     family (stance, wind-up, strike, follow-through, recover), then the
 *     combat row: stance, qi cast, hurt, guard, victory, defeat.
 *   /art/characters/<id>-work.png    4 × 14 cells — a four-frame loop per activity.
 *
 * Cells are HERO_ACTION_CELL wide and tall, the figure centred on its
 * head-and-torso at the cell's middle column, feet on the `feet` row, and a
 * standing figure `figure` px tall (the walk8 scale), so a pose can swap in for
 * a base frame at the same anchor. Serializable; safe for React and pure tests.
 */
import type { WeaponFamily } from "../game/types";

export const HERO_ACTION_IDS = ["m1", "f1"] as const;
export const HERO_ACTION_CELL = { width: 256, height: 160, feet: 150, figure: 104 } as const;

/** Combat sheet rows: the seven weapon families, then the combat poses. */
export const HERO_COMBAT_ROWS = ["fist", "long", "sword", "blade", "short", "hidden", "music", "combat"] as const;
export type HeroCombatRow = typeof HERO_COMBAT_ROWS[number];
export const HERO_COMBAT_COLUMNS = 6;
/** Frames in a weapon row (the sixth cell is empty). */
export const HERO_ATTACK_FRAMES = 5;
/** Columns of the combat row. */
export const HERO_COMBAT_POSE = { stance: 0, cast: 1, hurt: 2, guard: 3, victory: 4, defeat: 5 } as const;
export type HeroCombatPose = keyof typeof HERO_COMBAT_POSE;

/** Work sheet rows: one four-frame loop per activity. */
export const HERO_ACTIVITIES = [
  "mine", "chop", "fish", "herb", "hunt", "venom",
  "forge", "cook", "alchemy", "craft",
  "meditate", "read", "music", "sleep",
] as const;
export type HeroActivity = typeof HERO_ACTIVITIES[number];
export const HERO_WORK_COLUMNS = 4;
export const HERO_WORK_FPS = 5;

/**
 * Each hero's work sheet grid. f1's loops are cut from paintings
 * (scripts/build-hero-actions.ts: 4 frames in HERO_ACTION_CELL cells); m1's
 * are animated by PixelLab from his painted poses (scripts/build-hero-work-loops.ts:
 * 8 frames in 128 px cells). `feet` is the foot row of a cell, `figure` the
 * height of a standing figure in it, `anchor` the column the body stands on.
 */
export interface HeroWorkLayout { width: number; height: number; feet: number; figure: number; anchor: number; columns: number; frames: number; fps: number }
export const HERO_WORK_LAYOUT: Readonly<Record<string, HeroWorkLayout>> = {
  m1: { width: 128, height: 128, feet: 122, figure: 83, anchor: 52, columns: 8, frames: 8, fps: 8 },
  f1: { ...HERO_ACTION_CELL, anchor: HERO_ACTION_CELL.width / 2, columns: HERO_WORK_COLUMNS, frames: HERO_WORK_COLUMNS, fps: HERO_WORK_FPS },
};
export const heroWorkLayout = (id: string): HeroWorkLayout => HERO_WORK_LAYOUT[id] ?? HERO_WORK_LAYOUT.f1;

export const HERO_ACTIVITY_LABEL: Record<HeroActivity, string> = {
  mine: "ขุดแร่", chop: "ตัดไม้", fish: "ตกปลา", herb: "เก็บสมุนไพร", hunt: "ล่าสัตว์", venom: "จับงูเก็บพิษ",
  forge: "ตีเหล็ก", cook: "ทำอาหาร", alchemy: "ปรุงยา", craft: "เย็บปักและเจียระไน",
  meditate: "นั่งสมาธิ", read: "อ่านตำรา", music: "บรรเลงพิณ", sleep: "นอนพัก",
};

export function hasHeroActions(id: string): boolean { return (HERO_ACTION_IDS as readonly string[]).includes(id); }
export function heroCombatSheet(id: string): string { return `/art/characters/${id}-combat.png`; }
export function heroWorkSheet(id: string): string { return `/art/characters/${id}-work.png`; }

/** Frame index in the combat sheet. */
export function heroCombatFrame(row: HeroCombatRow, column: number): number {
  return HERO_COMBAT_ROWS.indexOf(row) * HERO_COMBAT_COLUMNS + column;
}
export function heroCombatPoseFrame(pose: HeroCombatPose): number {
  return heroCombatFrame("combat", HERO_COMBAT_POSE[pose]);
}

/**
 * The attack frame (0–4 of a weapon row) at `age` ms into a cast whose hits
 * land from `hitDelay` to `lastImpact`: stance, wind-up, the strike on every
 * hit (follow-through between hits), then follow-through and recovery.
 */
export function heroAttackColumn(age: number, timing: { hitDelay: number; lastImpact: number; gap: number }): number {
  if (age < timing.hitDelay * 0.3) return 0;
  if (age < timing.hitDelay - 30) return 1;
  if (age <= timing.lastImpact + 90) {
    const since = age - timing.hitDelay + 30;
    return timing.gap > 0 && Math.floor(since / timing.gap) % 2 === 1 && since % timing.gap > timing.gap * 0.55 ? 3 : 2;
  }
  return age < timing.lastImpact + 230 ? 3 : 4;
}

/** The weapon row for a skill's family; arts are channelled with the cast pose. */
export function heroAttackRow(family: WeaponFamily | undefined): HeroCombatRow {
  return family && (HERO_COMBAT_ROWS as readonly string[]).includes(family) ? family : "fist";
}

/** What a life skill looks like while the hero works at it (null: no painted loop). */
export function activityForLifeSkill(skill: string | undefined): HeroActivity | null {
  switch (skill) {
    case "mining": return "mine";
    case "woodcutting": return "chop";
    case "fishing": return "fish";
    case "herbalism": return "herb";
    case "hunting": return "hunt";
    case "venom": return "venom";
    case "forge": return "forge";
    case "chef": return "cook";
    case "alchemy": return "alchemy";
    case "tailoring": case "jewelry": case "accessory": return "craft";
    case "reading": case "writing": case "drawing": case "chess": return "read";
    case "music": return "music";
    default: return null;
  }
}

/** A place or jail activity's loop, by its map badge. */
export function activityForBadge(badge: string | undefined): HeroActivity | null {
  switch (badge) {
    case "labor": return "mine";
    case "practice": return "meditate";
    case "rest": return "sleep";
    case "herbalism": return "herb";
    case "fishing": return "fish";
    case "alchemy": return "alchemy";
    default: return null;
  }
}

/** A painted loop to show the hero in (the work overlay): an activity, or a weapon row's attack. */
export type HeroPose = { sheet: "work"; row: HeroActivity } | { sheet: "combat"; row: HeroCombatRow };

/** Sheet geometry of a pose: its url, cell size, foot row, standing height and body column, grid, row and frame count. */
export interface HeroPoseStrip { url: string; width: number; height: number; feet: number; figure: number; anchor: number; columns: number; rows: number; row: number; frames: number; fps: number }
export function heroPoseStrip(id: string, pose: HeroPose): HeroPoseStrip {
  if (pose.sheet === "work") {
    const layout = heroWorkLayout(id);
    return { url: heroWorkSheet(id), width: layout.width, height: layout.height, feet: layout.feet, figure: layout.figure, anchor: layout.anchor,
      columns: layout.columns, rows: HERO_ACTIVITIES.length, row: HERO_ACTIVITIES.indexOf(pose.row), frames: layout.frames, fps: layout.fps };
  }
  return { url: heroCombatSheet(id), ...HERO_ACTION_CELL, anchor: HERO_ACTION_CELL.width / 2, columns: HERO_COMBAT_COLUMNS, rows: HERO_COMBAT_ROWS.length,
    row: HERO_COMBAT_ROWS.indexOf(pose.row), frames: pose.row === "combat" ? HERO_COMBAT_COLUMNS : HERO_ATTACK_FRAMES, fps: 7 };
}

/** The work loop for a life skill, as a pose (null: no painted loop). */
export function lifeSkillPose(skill: string | undefined): HeroPose | null {
  const row = activityForLifeSkill(skill);
  return row ? { sheet: "work", row } : null;
}
/** The work loop for a place or jail activity's badge. */
export function badgePose(badge: string | undefined): HeroPose | null {
  const row = activityForBadge(badge);
  return row ? { sheet: "work", row } : null;
}
/** Practising a move: its weapon form for a skill (`family`), sitting in meditation for an inner art. */
export function practicePose(isArt: boolean, family: WeaponFamily | undefined): HeroPose {
  return isArt ? { sheet: "work", row: "meditate" } : { sheet: "combat", row: heroAttackRow(family) };
}
export const HERO_SLEEP_POSE: HeroPose = { sheet: "work", row: "sleep" };

/**
 * Work loops not painted yet (their rows are empty): the work overlay keeps the
 * plain preview for them. Repaint with scripts/paint-hero-actions.py, rebuild
 * and empty the list (test:npcs checks the list matches the sheets).
 */
export const HERO_WORK_GAPS: Readonly<Record<string, readonly HeroActivity[]>> = {
  f1: ["alchemy", "craft", "meditate", "read", "music", "sleep"],
};
/** Whether the hero has this pose painted. */
export function heroHasPose(id: string, pose: HeroPose): boolean {
  if (!hasHeroActions(id)) return false;
  return pose.sheet === "combat" || !(HERO_WORK_GAPS[id] ?? []).includes(pose.row);
}
