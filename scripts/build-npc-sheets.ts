/**
 * Rig a full animation sheet for every id in ANIMATED_NPC_IDS
 * (lib/characters/npc-sheets.ts) from the NPC's painted body.
 *
 *   bun scripts/build-npc-sheets.ts
 *
 * The painted bodies are single front-facing poses. Each one is trimmed and
 * reduced to a 104 px pixel-art figure (quantised palette, hard alpha), then
 * cut into four parts — the two legs (lower body, split at its centre), the
 * torso and the head — and posed like a paper puppet: every part has its own
 * transform (legs swing about the hip, the torso bends about the waist, the
 * head tilts about the neck), all under one whole-body transform. Parts are
 * drawn back to front with a little overlap so joints never open.
 *
 * Every one of the 24 cells is a different pose (`test:npcs` checks this):
 *
 *   <id>.png             512 × 512, 4 × 4 cells of 128 px
 *     0–3   idle         breathe in, sway right, breathe out, sway left
 *     4–7   walk         left stride, passing, right stride, passing — side
 *                        profile leaning into the step, arms (torso) swinging
 *     8–11  attack       wind-up (coil back), strike (lunge + qi arc),
 *                        follow-through (fading arc), recover
 *     12 hurt (knocked back, flushed) · 13 guard (crouched, hunched)
 *     14 victory (chest out, glints) · 15 defeat (lying)
 *   <id>-directions.png  512 × 256, 4 × 2 cells
 *     16–19 walk north   the back: head repainted in the hair / hat colour,
 *                        legs and shoulders alternating
 *     20–23 walk south   the front, legs and shoulders alternating
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
const FEET = 119; // ground row inside a cell
const FIGURE = 104;
/** The qi arc stays inside this width so the loader (which fits a sheet's widest frame into 118 px) barely shrinks the sheet. */
const MAX_W = 116;
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

// ─── Anatomy: where the neck, waist and leg split sit on this painting ─────
interface Anatomy { top: number; neck: number; waist: number; mid: number }
function anatomy(src: Raster): Anatomy {
  const rowSpan = (y: number) => {
    let left = -1, right = -1;
    for (let x = 0; x < src.w; x++) if (opaque(src, x, y)) { if (left < 0) left = x; right = x; }
    return left < 0 ? 0 : right - left + 1;
  };
  let top = 0;
  while (top < src.h && !rowSpan(top)) top++;
  const height = src.h - top;
  // The neck is the narrowest row in the band where it sits on every painting.
  let neck = top + Math.round(height * 0.14), narrowest = Infinity;
  for (let y = top + Math.round(height * 0.1); y <= top + Math.round(height * 0.26); y++) {
    const span = rowSpan(y);
    if (span && span < narrowest) { narrowest = span; neck = y; }
  }
  const waist = top + Math.round(height * 0.56);
  let sum = 0, count = 0;
  for (let y = waist; y < src.h; y++) for (let x = 0; x < src.w; x++) if (opaque(src, x, y)) { sum += x; count++; }
  return { top, neck, waist, mid: count ? sum / count : src.w / 2 };
}

/** The back of the figure: the head above the neck takes the hair / hat colour, the body is shaded. */
function backView(src: Raster, a: Anatomy): Raster {
  const out: Raster = { ...src, data: src.data.slice() };
  let sum = [0, 0, 0], n = 0;
  for (let y = a.top; y < a.top + Math.max(2, Math.round((a.neck - a.top) / 4)); y++) {
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
      if (y < a.neck + 1) {
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

// ─── 2D affine transforms in figure space: x right, y UP, origin at the feet centre ─
type Affine = readonly [a: number, b: number, c: number, d: number, e: number, f: number]; // x' = ax+by+c, y' = dx+ey+f
const ID: Affine = [1, 0, 0, 0, 1, 0];
const apply = (m: Affine, x: number, y: number) => [m[0] * x + m[1] * y + m[2], m[3] * x + m[4] * y + m[5]] as const;
/** compose(p, q) = p ∘ q: apply q first, then p. */
const compose = (p: Affine, q: Affine): Affine => [
  p[0] * q[0] + p[1] * q[3], p[0] * q[1] + p[1] * q[4], p[0] * q[2] + p[1] * q[5] + p[2],
  p[3] * q[0] + p[4] * q[3], p[3] * q[1] + p[4] * q[4], p[3] * q[2] + p[4] * q[5] + p[5],
];
function invert(m: Affine): Affine {
  const det = m[0] * m[4] - m[1] * m[3];
  return [m[4] / det, -m[1] / det, (m[1] * m[5] - m[4] * m[2]) / det, -m[3] / det, m[0] / det, (m[3] * m[2] - m[0] * m[5]) / det];
}
const translate = (dx: number, dy: number): Affine => [1, 0, dx, 0, 1, dy];
/** Rotate about (px, py); positive degrees tip the top toward +x (lean forward when facing right). */
function rotate(deg: number, px = 0, py = 0): Affine {
  const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
  return compose(translate(px, py), compose([c, s, 0, -s, c, 0], translate(-px, -py)));
}
const scale = (sx: number, sy: number, px = 0, py = 0): Affine => compose(translate(px, py), compose([sx, 0, 0, 0, sy, 0], translate(-px, -py)));
/** Shear x about row `y0`: a point `k` units per row below y0 moves +x (a leg swinging forward from the hip). */
const swing = (k: number, y0: number): Affine => [1, -k, k * y0, 0, 1, 0];

interface Pose {
  body?: { deg?: number; sx?: number; sy?: number };
  /** Torso bend about the waist (degrees) and vertical stretch (breathing). */
  torso?: { deg?: number; sy?: number };
  head?: { deg?: number; dx?: number; dy?: number };
  /** Leg swing: + moves that foot forward (+x). Back leg = the image-left half. */
  back?: number; front?: number;
  /** Squash the legs toward the hip (a crouch). */
  crouch?: number;
  tint?: readonly [number, number, number];
  arc?: "strike" | "follow";
  glint?: boolean;
}

function drawPose(src: Raster, a: Anatomy, sheet: Raster, cell: number, p: Pose) {
  const ox = (cell % 4) * CELL, oy = Math.floor(cell / 4) * CELL;
  const frame = blank(CELL, CELL);
  const cx = a.mid;
  // Source pixel (x, y) → figure space (fx right, fy up from the ground row).
  const toFig = (x: number, y: number) => [x - cx, src.h - 1 - y] as const;
  const waistY = src.h - 1 - a.waist, neckY = src.h - 1 - a.neck;
  const body = compose(rotate(p.body?.deg ?? 0), scale(p.body?.sx ?? 1, p.body?.sy ?? 1));
  const crouch = p.crouch ?? 0;
  // Legs: swing about the hip, squash in a crouch. The torso and head ride on top of the legs' new hip height.
  const hipDrop = waistY * crouch;
  const leg = (k: number) => compose(body, compose(scale(1 + crouch * 0.4, 1 - crouch, 0, 0), swing(k, waistY)));
  const torso = compose(body, compose(translate(0, -hipDrop), compose(rotate(p.torso?.deg ?? 0, 0, waistY), scale(1, p.torso?.sy ?? 1, 0, waistY))));
  const head = compose(torso, compose(translate(p.head?.dx ?? 0, p.head?.dy ?? 0), rotate(p.head?.deg ?? 0, 0, neckY)));
  // Parts: [transform, source mask], drawn back to front. Masks overlap 2 px at the joints.
  const parts: [Affine, (fx: number, fy: number) => boolean][] = [
    [leg(p.back ?? 0), (fx, fy) => fy <= waistY + 2 && fx < 0],
    [leg(p.front ?? 0), (fx, fy) => fy <= waistY + 2 && fx >= 0],
    [torso, (fx, fy) => fy >= waistY - 2 && fy <= neckY + 1],
    [head, (fx, fy) => fy >= neckY - 1],
  ];
  for (const [transform, mask] of parts) {
    const inverse = invert(transform);
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const [fx, fy] = apply(inverse, x - CELL / 2, FEET - y);
        const sx = Math.round(fx + cx), sy = Math.round(src.h - 1 - fy);
        if (!opaque(src, sx, sy)) continue;
        const [mx, my] = toFig(sx, sy);
        if (!mask(mx, my)) continue;
        const s = (sy * src.w + sx) * 4, t = (y * CELL + x) * 4;
        for (let c = 0; c < 4; c++) frame.data[t + c] = src.data[s + c];
      }
    }
  }
  if (p.tint) {
    for (let i = 0; i < frame.data.length; i += 4) if (frame.data[i + 3]) for (let c = 0; c < 3; c++) frame.data[i + c] = Math.min(255, frame.data[i + c] * p.tint[c]);
  }
  outline(frame);
  if (p.arc) qiArc(frame, p.arc);
  if (p.glint) glints(frame);
  blit(frame, sheet, ox, oy);
}

/** Fallen on the back: the whole figure rotated a quarter turn, head to the left. */
function drawLying(src: Raster, sheet: Raster, cell: number) {
  const ox = (cell % 4) * CELL, oy = Math.floor(cell / 4) * CELL;
  const frame = blank(CELL, CELL);
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      const sx = FEET - y, sy = Math.round(x - (CELL / 2 - src.h / 2));
      if (!opaque(src, sx, sy)) continue;
      const s = (sy * src.w + sx) * 4, t = (y * CELL + x) * 4;
      for (let c = 0; c < 4; c++) frame.data[t + c] = src.data[s + c];
    }
  }
  outline(frame);
  blit(frame, sheet, ox, oy);
}

function outline(frame: Raster) {
  const copy: Raster = { ...frame, data: frame.data.slice() };
  for (let y = 0; y < CELL; y++) {
    for (let x = 0; x < CELL; x++) {
      if (opaque(copy, x, y)) continue;
      if (opaque(copy, x - 1, y) || opaque(copy, x + 1, y) || opaque(copy, x, y - 1) || opaque(copy, x, y + 1)) {
        const t = (y * CELL + x) * 4;
        frame.data[t] = OUTLINE[0]; frame.data[t + 1] = OUTLINE[1]; frame.data[t + 2] = OUTLINE[2]; frame.data[t + 3] = 255;
      }
    }
  }
}
function bounds(frame: Raster) {
  let left = CELL, right = -1, top = CELL, bottom = -1;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) if (opaque(frame, x, y)) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return { left, right, top, bottom };
}
function plot(frame: Raster, x: number, y: number, rgb: readonly [number, number, number]) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= CELL || y >= CELL) return;
  const t = (y * CELL + x) * 4;
  frame.data[t] = rgb[0]; frame.data[t + 1] = rgb[1]; frame.data[t + 2] = rgb[2]; frame.data[t + 3] = 255;
}
/** A crescent of qi in front of the strike (+x side), kept inside the loader's width budget. */
function qiArc(frame: Raster, kind: "strike" | "follow") {
  const b = bounds(frame);
  const height = b.bottom - b.top;
  const cy = b.top + height * 0.36, r = kind === "strike" ? 16 : 12;
  const cx = Math.min(b.right - r + 10, b.left + MAX_W - r - 4, CELL - r - 3);
  const [from, to] = kind === "strike" ? [-70, 70] : [-20, 75];
  for (let deg = from; deg <= to; deg += 2) {
    const t = deg * Math.PI / 180;
    const thick = kind === "strike" ? 3 : 2;
    for (let k = 0; k < thick; k++) {
      const rr = r - k;
      plot(frame, cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, k === 0 ? [255, 214, 120] : [255, 248, 222]);
    }
  }
}
/** Two golden glints beside the head. */
function glints(frame: Raster) {
  const b = bounds(frame);
  for (const [gx, gy] of [[b.left - 1, b.top + 10], [b.right + 1, b.top + 4]]) {
    for (let k = -3; k <= 3; k++) {
      const c: [number, number, number] = Math.abs(k) < 2 ? [255, 250, 220] : [246, 200, 92];
      plot(frame, gx + k, gy, c); plot(frame, gx, gy + k, c);
    }
  }
}
function blit(frame: Raster, sheet: Raster, ox: number, oy: number) {
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const f = (y * CELL + x) * 4;
    if (!frame.data[f + 3]) continue;
    const t = ((oy + y) * sheet.w + ox + x) * 4;
    for (let c = 0; c < 4; c++) sheet.data[t + c] = frame.data[f + c];
  }
}

// ─── The poses ───────────────────────────────────────────────────────────
const SIDE = { sx: 0.88 }; // a narrower profile for walking sideways
const BASE_POSES: Pose[] = [
  // idle: breathe in, sway right, breathe out, sway left
  { torso: { sy: 1.025 }, head: { dy: 0.5 } },
  { torso: { deg: 2.5 }, head: { deg: -2 } },
  { torso: { sy: 0.975 }, head: { deg: 1.5, dy: -0.5 } },
  { torso: { deg: -2.5 }, head: { deg: 2 } },
  // walk: left stride, passing, right stride, passing — leaning into the step, shoulders counter-swinging
  { body: { ...SIDE, deg: 5 }, back: -0.32, front: 0.34, torso: { deg: -3 }, head: { deg: -3 } },
  { body: { ...SIDE, deg: 3 }, back: 0.06, front: -0.04, torso: { deg: 1, sy: 1.02 }, head: { deg: 1 } },
  { body: { ...SIDE, deg: 5 }, back: 0.34, front: -0.32, torso: { deg: 4 }, head: { deg: 2 } },
  { body: { ...SIDE, deg: 3 }, back: -0.05, front: 0.07, torso: { deg: -1, sy: 1.02 }, head: { deg: -1 } },
  // attack: coil back, lunge + qi arc, follow-through, recover
  { body: { deg: -6, sy: 0.97 }, back: -0.28, front: 0.18, torso: { deg: -12 }, head: { deg: 6 } },
  { body: { deg: 8, sx: 1.04 }, back: -0.42, front: 0.38, torso: { deg: 16 }, head: { deg: -6 }, arc: "strike" },
  { body: { deg: 6 }, back: -0.3, front: 0.26, torso: { deg: 10 }, head: { deg: -3 }, arc: "follow" },
  { body: { deg: 2 }, back: -0.1, front: 0.1, torso: { deg: 3 }, head: { deg: 0 } },
  // hurt: knocked back, flushed
  { body: { deg: -9 }, back: 0.18, front: -0.12, torso: { deg: -10 }, head: { deg: -12, dx: -1 }, tint: [1.08, 0.78, 0.74] },
  // guard: crouched and hunched behind the arms
  { crouch: 0.12, back: -0.18, front: 0.2, torso: { deg: 8 }, head: { deg: 4, dy: -1 } },
  // victory: chest out, chin up, glints
  { torso: { deg: -6, sy: 1.03 }, head: { deg: -8 }, back: -0.08, front: 0.08, glint: true },
];
// Walking toward / away from the camera: legs and shoulders alternate.
const VERTICAL_POSES: Pose[] = [
  { back: -0.3, front: 0.1, torso: { deg: 3.5 }, head: { deg: -2 } },
  { torso: { sy: 1.025 }, back: 0.04, front: -0.04, head: { deg: -0.5 } },
  { back: -0.1, front: 0.3, torso: { deg: -3.5 }, head: { deg: 2 } },
  { torso: { sy: 1.01 }, back: -0.06, front: 0.06, head: { deg: 1 } },
];

mkdirSync(OUT, { recursive: true });
for (const id of ANIMATED_NPC_IDS) {
  const front = await figure(id);
  const a = anatomy(front);
  const back = backView(front, a);
  const sheet = blank(CELL * 4, CELL * 4);
  BASE_POSES.forEach((p, cell) => drawPose(front, a, sheet, cell, p));
  drawLying(front, sheet, 15);
  const directions = blank(CELL * 4, CELL * 2);
  VERTICAL_POSES.forEach((p, i) => drawPose(back, a, directions, i, { ...p, body: { sx: 0.98 } }));
  VERTICAL_POSES.forEach((p, i) => drawPose(front, a, directions, 4 + i, p));
  for (const [name, r, rows] of [["sheet", sheet, 4], ["directions", directions, 2]] as const) {
    for (let cell = 0; cell < rows * 4; cell++) {
      const sub = blank(CELL, CELL);
      for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
        const s = ((Math.floor(cell / 4) * CELL + y) * r.w + (cell % 4) * CELL + x) * 4, t = (y * CELL + x) * 4;
        for (let c = 0; c < 4; c++) sub.data[t + c] = r.data[s + c];
      }
      const b = bounds(sub);
      // A pose that touches the cell edge was clipped.
      if (b.left <= 0 || b.top <= 0 || b.right >= CELL - 1) throw new Error(`${id} ${name} cell ${cell} is clipped by its cell`);
    }
  }
  const png = (r: Raster) => sharp(Buffer.from(r.data.buffer), { raw: { width: r.w, height: r.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 64, dither: 0 });
  await png(sheet).toFile(`${OUT}/${id}.png`);
  await png(directions).toFile(`${OUT}/${id}-directions.png`);
}
console.log(`wrote ${ANIMATED_NPC_IDS.length} NPC animation sheets to ${OUT}/`);
