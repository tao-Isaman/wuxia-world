/**
 * Rig a full animation sheet for every id in ANIMATED_NPC_IDS
 * (lib/characters/npc-sheets.ts) from the NPC's painted body.
 *
 *   bun scripts/build-npc-sheets.ts
 *
 * The painted bodies are single front-facing poses. Each one is trimmed,
 * reduced to a 104 px pixel-art figure (quantised palette, hard alpha), then
 * warped into the hero-sheet layout so the same loader, clips and runtimes
 * play it:
 *
 *   <id>.png             512 × 512, 4 × 4 cells of 128 px
 *     0–3   idle         breathing: the upper body rises 0 / 1 / 2 / 1 px
 *     4–7   walk         a narrower, forward-leaning profile (the loader adds
 *                        the left / right foot beats)
 *     8–11  attack       wind-up lean back, strike, follow-through, recover
 *     12 hurt · 13 guard (crouch) · 14 victory (stand tall) · 15 defeat (lying)
 *   <id>-directions.png  512 × 256, 4 × 2 cells
 *     16–19 walk north   the back: the head is repainted in the hair / hat
 *                        colour and the body shaded
 *     20–23 walk south   the front pose
 *
 * Every frame gets the same 1 px dark outline as the single-pose sprites.
 * Output is deterministic; rerun after adding ids or changing a painting.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { ANIMATED_NPC_IDS } from "../lib/characters/npc-sheets";

const SRC = "public/npcs/body";
const OUT = "public/art/characters/npc";
const CELL = 128;
const FEET = 119; // last opaque row of the figure inside a cell
const FIGURE = 104;
const OUTLINE = [26, 18, 12] as const;

interface Raster { w: number; h: number; data: Uint8ClampedArray }
const blank = (w: number, h: number): Raster => ({ w, h, data: new Uint8ClampedArray(w * h * 4) });
const opaque = (r: Raster, x: number, y: number) => x >= 0 && y >= 0 && x < r.w && y < r.h && r.data[(y * r.w + x) * 4 + 3] >= 128;

async function figure(id: string): Promise<Raster> {
  const trimmed = await sharp(`${SRC}/${id}.png`).trim({ threshold: 8 }).toBuffer();
  const reduced = await sharp(trimmed).resize({ height: FIGURE, kernel: "lanczos3" })
    .png({ palette: true, colours: 40, dither: 0 }).toBuffer();
  const { data, info } = await sharp(reduced).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const r: Raster = { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
  for (let i = 3; i < r.data.length; i += 4) r.data[i] = r.data[i] >= 110 ? 255 : 0;
  return r;
}

/** The back of the figure: the head above the neck takes the hair / hat colour, the body is shaded. */
function backView(src: Raster): Raster {
  const out: Raster = { ...src, data: src.data.slice() };
  const rowWidth = (y: number) => {
    let left = -1, right = -1;
    for (let x = 0; x < src.w; x++) if (opaque(src, x, y)) { if (left < 0) left = x; right = x; }
    return left < 0 ? 0 : right - left + 1;
  };
  let top = 0;
  while (top < src.h && !rowWidth(top)) top++;
  const height = src.h - top;
  // The neck is the narrowest row in the band where it sits on every painting.
  let neck = top + Math.round(height * 0.12), narrowest = Infinity;
  for (let y = top + Math.round(height * 0.1); y <= top + Math.round(height * 0.26); y++) {
    const width = rowWidth(y);
    if (width && width < narrowest) { narrowest = width; neck = y; }
  }
  // Hair / hat colour: the mean of the top quarter of the head.
  let sum = [0, 0, 0], n = 0;
  for (let y = top; y < top + Math.max(2, Math.round((neck - top) / 4)); y++) {
    for (let x = 0; x < src.w; x++) if (opaque(src, x, y)) {
      const i = (y * src.w + x) * 4;
      sum = [sum[0] + src.data[i], sum[1] + src.data[i + 1], sum[2] + src.data[i + 2]]; n++;
    }
  }
  const hair = n ? sum.map((v) => v / n) : [40, 30, 24];
  const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
  const hairLum = Math.max(1, lum(hair[0], hair[1], hair[2]));
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      if (!opaque(src, x, y)) continue;
      const i = (y * src.w + x) * 4;
      if (y < neck) {
        // Keep the painting's light and shade, in the hair colour.
        const shade = Math.min(1.25, Math.max(0.7, lum(src.data[i], src.data[i + 1], src.data[i + 2]) / hairLum * 0.5 + 0.5));
        for (let c = 0; c < 3; c++) out.data[i + c] = Math.min(255, hair[c] * shade);
      } else {
        for (let c = 0; c < 3; c++) out.data[i + c] = src.data[i + c] * 0.86;
      }
    }
  }
  return out;
}

interface Pose { width?: number; height?: number; lean?: number; breathe?: number; lying?: boolean }

/** Draw one pose of the figure into a cell, feet on FEET, centred. Nearest-neighbour inverse warp. */
function pose(src: Raster, sheet: Raster, cell: number, p: Pose) {
  const ox = (cell % 4) * CELL, oy = Math.floor(cell / 4) * CELL;
  const frame = blank(CELL, CELL);
  const cx = CELL / 2, H = src.h, half = src.w / 2;
  const ws = p.width ?? 1, hs = p.height ?? 1, lean = p.lean ?? 0, breathe = p.breathe ?? 0;
  const waist = H * 0.5;
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      let sx: number, sy: number;
      if (p.lying) {
        // Fallen on the back: the head lies to the left, the feet to the right.
        sx = FEET - y; sy = Math.round(x - (cx - H / 2));
      } else {
        let fy = (FEET - y) / hs;
        if (breathe && fy > waist) fy = waist + (fy - waist) * (H - waist) / (H - waist + breathe);
        const fx = (x - cx - lean * fy / H) / ws;
        sx = Math.round(half + fx); sy = Math.round(H - 1 - fy);
      }
      if (!opaque(src, sx, sy)) continue;
      const s = (sy * src.w + sx) * 4, t = (y * CELL + x) * 4;
      for (let c = 0; c < 4; c++) frame.data[t + c] = src.data[s + c];
    }
  }
  // 1 px dark outline, then copy into the sheet.
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      const t = ((oy + y) * sheet.w + ox + x) * 4, f = (y * CELL + x) * 4;
      if (opaque(frame, x, y)) {
        for (let c = 0; c < 4; c++) sheet.data[t + c] = frame.data[f + c];
      } else if (opaque(frame, x - 1, y) || opaque(frame, x + 1, y) || opaque(frame, x, y - 1) || opaque(frame, x, y + 1)) {
        sheet.data[t] = OUTLINE[0]; sheet.data[t + 1] = OUTLINE[1]; sheet.data[t + 2] = OUTLINE[2]; sheet.data[t + 3] = 255;
      }
    }
  }
}

const BASE_POSES: Pose[] = [
  { breathe: 0 }, { breathe: 1 }, { breathe: 2 }, { breathe: 1 }, // idle
  { width: 0.9, lean: 2 }, { width: 0.9, lean: 3 }, { width: 0.9, lean: 2 }, { width: 0.9, lean: 3 }, // walk
  { width: 0.97, height: 0.98, lean: -4 }, { width: 1.04, lean: 9 }, { width: 1.02, lean: 6 }, { lean: 1 }, // attack
  { height: 0.96, lean: -6 }, // hurt
  { width: 1.05, height: 0.92 }, // guard
  { height: 1.03, breathe: 2 }, // victory
  { lying: true }, // defeat
];

mkdirSync(OUT, { recursive: true });
for (const id of ANIMATED_NPC_IDS) {
  const front = await figure(id);
  const back = backView(front);
  const sheet = blank(CELL * 4, CELL * 4);
  BASE_POSES.forEach((p, cell) => pose(front, sheet, cell, p));
  const directions = blank(CELL * 4, CELL * 2);
  for (let i = 0; i < 4; i++) pose(back, directions, i, { width: 0.98 });
  for (let i = 0; i < 4; i++) pose(front, directions, 4 + i, {});
  const png = (r: Raster) => sharp(Buffer.from(r.data.buffer), { raw: { width: r.w, height: r.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 64, dither: 0 });
  await png(sheet).toFile(`${OUT}/${id}.png`);
  await png(directions).toFile(`${OUT}/${id}-directions.png`);
}
console.log(`wrote ${ANIMATED_NPC_IDS.length} NPC animation sheets to ${OUT}/`);
