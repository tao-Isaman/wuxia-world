// Animated sprite sheets for the big foes: the six legendary beasts (บอส) and
// the tier-5 masters. Each sheet is one PNG at /art/anims/<id>.png laid out
// as rows of equal frames — one row per clip — painted with PixelLab and
// packed by scripts/build-anim-sheets.ts, which also rewrites
// anim-sheets-data.ts. Battle units (`UnitLook.kind === "anim"`), map foes and
// the encounter / briefing portraits all draw from here.

import { ANIM_SHEET_DATA } from "./anim-sheets-data";

export type AnimClipName = "idle" | "attack" | "hurt";

export interface AnimClip {
  /** Row in the sheet (0-based). */
  row: number;
  /** Frames in the row, from the left. */
  frames: number;
  /** Playback rate. */
  fps: number;
}

export interface AnimSheet {
  id: string;
  /** /art/anims/<id>.png (with a cache-busting ?v=). */
  url: string;
  /** One frame's size in pixels (every frame in the sheet is this size). */
  frameW: number;
  frameH: number;
  /** Where the feet / belly touch the ground, 0..1 of the frame height. */
  feetY: number;
  /** The way the painted figure faces; renderers flip it to face its target. */
  facing: "left" | "right";
  /**
   * How tall it stands next to an ordinary fighter (1 = a person). Bosses are
   * about 2–2.6, T5 masters 1–1.2. Renderers multiply their usual figure size by it.
   */
  scale: number;
  clips: { idle: AnimClip; attack: AnimClip; hurt?: AnimClip };
}

export const ANIM_SHEETS: Readonly<Record<string, AnimSheet>> = ANIM_SHEET_DATA;

export function getAnimSheet(id: string | null | undefined): AnimSheet | null {
  return (id && ANIM_SHEETS[id]) || null;
}

/** Ids every sheet must exist for (bosses and T5 foes; the data file may hold more). */
export const BOSS_SHEET_IDS = [
  "boss_golden_serpent", "boss_blood_tiger", "boss_sword_eagle",
  "boss_sun_turtle", "boss_blade_crab", "boss_flame_bull",
] as const;
export const T5_SHEET_IDS = [
  "t5_nameless_sword_hermit", "t5_blood_blade_lord", "t5_poison_matriarch",
  "t5_iron_monk", "t5_white_tiger", "t5_wolf_king",
] as const;
