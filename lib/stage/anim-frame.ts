// Frame maths for animated sheets (lib/characters/anim-sheets.ts: bosses and
// T5 foes). Pure, so the battle runtime, the world runtime and the tests share it.

import type { AnimClip, AnimSheet } from "../characters/anim-sheets";

/** Largest an animated sheet stands (× an ordinary figure), so a boss never swallows the board or the map. */
export const ANIM_MAX_SCALE = 2.6;

/** How many ordinary figures tall an animated sheet stands: `sheet.scale × size`, kept to 0.6–ANIM_MAX_SCALE. */
export function animScaleOf(sheet: AnimSheet, size: number | undefined): number {
  return Math.max(0.6, Math.min(ANIM_MAX_SCALE, sheet.scale * (size ?? 1)));
}

/**
 * The sheet frame (row-major index, `columns` frames per row) of `clip` after
 * `ms`: looping, or played once and held on its last frame.
 */
export function animFrame(clip: AnimClip, columns: number, ms: number, loop: boolean): number {
  const frames = Math.max(1, Math.min(clip.frames, columns));
  const step = Math.floor(Math.max(0, ms) * clip.fps / 1000);
  return clip.row * columns + (loop ? step % frames : Math.min(step, frames - 1));
}

/** How long one play of `clip` lasts (ms). */
export const animClipMs = (clip: AnimClip): number => clip.frames * 1000 / Math.max(1, clip.fps);

/**
 * Where the painted figure starts in the sheet's first idle frame, 0..1 of the
 * frame height (browser only: reads the pixels). Name plates and bars sit just
 * above it, so headroom left in a frame never floats them off the figure.
 */
export function animVisibleTop(image: CanvasImageSource, sheet: AnimSheet): number {
  const canvas = document.createElement("canvas");
  canvas.width = sheet.frameW;
  canvas.height = sheet.frameH;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 0;
  context.drawImage(image, 0, sheet.clips.idle.row * sheet.frameH, sheet.frameW, sheet.frameH, 0, 0, sheet.frameW, sheet.frameH);
  const pixels = context.getImageData(0, 0, sheet.frameW, sheet.frameH).data;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 32) return Math.floor(index / 4 / sheet.frameW) / sheet.frameH;
  }
  return 0;
}
