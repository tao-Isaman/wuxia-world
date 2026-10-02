/**
 * Eight-direction walking sprites for the heroes, from painted walk strips.
 *
 *   bun scripts/build-hero-walk8.ts --from <dir>
 *
 * <dir>/<hero>/<D>.png is one painting per drawn direction D (S, SE, E, NE, N):
 * five full-body figures in a row on a flat light background — standing, then
 * a four-step walk (left foot forward, passing, right foot forward, passing).
 * The west-facing directions are the east ones mirrored at runtime.
 *
 * Each strip is cut out of its background, split into its five figures at the
 * empty columns between them, scaled once per strip so the standing figure is
 * FIGURE px tall, centred on its head-and-torso (so a stride does not slide the
 * body), set on the shared foot line and reduced to pixel art with the same
 * palette, hard alpha and 1 px outline as the rigged sheets. Output:
 *
 *   public/art/characters/<hero>-walk8.png   512 × 896, 4 × 7 cells of 128 px
 *     rows 0–4  walk S, SE, E, NE, N (4 frames each)
 *     row 5     stand S, SE, E, NE
 *     row 6     stand N (×4)
 *
 * The painted sources are not kept in the repo; rerun with a new folder to replace a hero.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { cutOut } from "./art-cutout";
import { PLAYER_CHARACTER_IDS } from "../lib/characters/catalog";
import { WALK8_DIRECTIONS } from "../lib/characters/walk8";

const from = process.argv[process.argv.indexOf("--from") + 1];
if (!from || !existsSync(from)) throw new Error("usage: bun scripts/build-hero-walk8.ts --from <dir with <hero>/<S|SE|E|NE|N>.png>");

const CELL = 128, FEET = 119, FIGURE = 104, MAX_W = 120;
const OUTLINE = [26, 18, 12] as const;

interface Raster { w: number; h: number; data: Uint8ClampedArray }

async function raster(buffer: Buffer): Promise<Raster> {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
}
const alphaAt = (r: Raster, x: number, y: number) => r.data[(y * r.w + x) * 4 + 3];

/** Split a strip into figures at runs of empty columns; tiny slivers (a stray ribbon) join their neighbour. */
function splitFigures(r: Raster, expected: number): { x0: number; x1: number }[] {
  // A column belongs to a figure when it has more than a few solid pixels: stray
  // ribbon wisps and soft edges must not bridge the gap between two figures.
  const filled = Array.from({ length: r.w }, (_, x) => { let n = 0; for (let y = 0; y < r.h; y++) if (alphaAt(r, x, y) > 110) n++; return n > 6; });
  let spans: { x0: number; x1: number }[] = [];
  for (let x = 0; x < r.w; x++) {
    if (!filled[x]) continue;
    const x0 = x;
    while (x < r.w && filled[x]) x++;
    spans.push({ x0, x1: x - 1 });
  }
  // Merge the narrowest span into its nearer neighbour until `expected` remain.
  while (spans.length > expected) {
    let i = 0;
    spans.forEach((s, j) => { if (s.x1 - s.x0 < spans[i].x1 - spans[i].x0) i = j; });
    const left = i > 0 ? spans[i].x0 - spans[i - 1].x1 : Infinity, right = i < spans.length - 1 ? spans[i + 1].x0 - spans[i].x1 : Infinity;
    const j = left <= right ? i - 1 : i + 1;
    const merged = { x0: Math.min(spans[i].x0, spans[j].x0), x1: Math.max(spans[i].x1, spans[j].x1) };
    spans = spans.filter((_, k) => k !== i && k !== j);
    spans.push(merged);
    spans.sort((a, b) => a.x0 - b.x0);
  }
  if (spans.length !== expected) throw new Error(`found ${spans.length} figures, expected ${expected}`);
  return spans;
}

interface Figure { buffer: Buffer; w: number; h: number; anchor: number }

/** One figure, trimmed; `anchor` is the x of its head-and-torso centre of mass. */
async function figure(strip: Buffer, r: Raster, span: { x0: number; x1: number }): Promise<Figure> {
  let top = r.h, bottom = -1;
  for (let y = 0; y < r.h; y++) for (let x = span.x0; x <= span.x1; x++) if (alphaAt(r, x, y) > 40) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  const w = span.x1 - span.x0 + 1, h = bottom - top + 1;
  const buffer = await sharp(strip).extract({ left: span.x0, top, width: w, height: h }).png().toBuffer();
  let sum = 0, count = 0;
  for (let y = top; y < top + Math.round(h * 0.45); y++) for (let x = span.x0; x <= span.x1; x++) if (alphaAt(r, x, y) > 40) { sum += x - span.x0; count++; }
  return { buffer, w, h, anchor: count ? sum / count : w / 2 };
}

/** Scale, palette-reduce, harden alpha and outline one figure into a 128 px cell. */
async function cell(f: Figure, scale: number): Promise<Raster> {
  const w = Math.max(1, Math.round(f.w * scale)), h = Math.max(1, Math.round(f.h * scale));
  const reduced = await sharp(f.buffer).resize(w, h, { kernel: "lanczos3" }).png({ palette: true, colours: 40, dither: 0 }).toBuffer();
  const src = await raster(reduced);
  const out: Raster = { w: CELL, h: CELL, data: new Uint8ClampedArray(CELL * CELL * 4) };
  const left = Math.round(CELL / 2 - f.anchor * scale), top = FEET - h;
  // Specks cut loose from a ribbon tip (under 24 px) are dropped.
  const keep = new Uint8Array(src.w * src.h);
  const seen = new Uint8Array(src.w * src.h);
  for (let start = 0; start < src.w * src.h; start++) {
    if (seen[start] || src.data[start * 4 + 3] < 110) continue;
    const part = [start]; seen[start] = 1;
    for (let k = 0; k < part.length; k++) {
      const p = part[k], x = p % src.w, y = (p / src.w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < src.w - 1 ? p + 1 : -1, y > 0 ? p - src.w : -1, y < src.h - 1 ? p + src.w : -1]) {
        if (q >= 0 && !seen[q] && src.data[q * 4 + 3] >= 110) { seen[q] = 1; part.push(q); }
      }
    }
    if (part.length >= 24) for (const p of part) keep[p] = 1;
  }
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < src.w && y < src.h && keep[y * src.w + x] === 1;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const sx = x - left, sy = y - top, o = (y * CELL + x) * 4;
    if (solid(sx, sy)) {
      const i = (sy * src.w + sx) * 4;
      out.data[o] = src.data[i]; out.data[o + 1] = src.data[i + 1]; out.data[o + 2] = src.data[i + 2]; out.data[o + 3] = 255;
    } else if (solid(sx - 1, sy) || solid(sx + 1, sy) || solid(sx, sy - 1) || solid(sx, sy + 1)) {
      out.data[o] = OUTLINE[0]; out.data[o + 1] = OUTLINE[1]; out.data[o + 2] = OUTLINE[2]; out.data[o + 3] = 255;
    }
  }
  return out;
}

for (const hero of PLAYER_CHARACTER_IDS) {
  if (!existsSync(`${from}/${hero}`)) { console.warn(`skip ${hero}: no strips`); continue; }
  const sheet: Raster = { w: CELL * 4, h: CELL * 7, data: new Uint8ClampedArray(CELL * 4 * CELL * 7 * 4) };
  const put = (c: Raster, index: number) => {
    const ox = (index % 4) * CELL, oy = Math.floor(index / 4) * CELL;
    for (let y = 0; y < CELL; y++) sheet.data.set(c.data.subarray(y * CELL * 4, (y + 1) * CELL * 4), ((oy + y) * sheet.w + ox) * 4);
  };
  for (const [row, dir] of WALK8_DIRECTIONS.entries()) {
    // White and pale robes have flat near-white folds: only large, pure-background pockets (between the legs) go.
    const strip = await cutOut(`${from}/${hero}/${dir}.png`, { pocketTolerance: 4, pocketMin: 400 });
    const r = await raster(strip);
    let spans;
    try { spans = splitFigures(r, 5); } catch (error) { throw new Error(`${hero}/${dir}.png: ${(error as Error).message} (repaint this strip)`); }
    const figures = await Promise.all(spans.map((span) => figure(strip, r, span)));
    // One scale per strip: the standing figure is FIGURE px tall, and no pose is wider than the cell allows.
    const scale = Math.min(FIGURE / figures[0].h, ...figures.map((f) => MAX_W / f.w), ...figures.map((f) => (FEET - 2) / f.h));
    const cells = await Promise.all(figures.map((f) => cell(f, scale)));
    cells.slice(1).forEach((c, i) => put(c, row * 4 + i));
    put(cells[0], 20 + row);
    if (dir === "N") for (let i = 1; i < 4; i++) put(cells[0], 24 + i);
  }
  await sharp(Buffer.from(sheet.data.buffer), { raw: { width: sheet.w, height: sheet.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 96, dither: 0 }).toFile(`public/art/characters/${hero}-walk8.png`);
  console.log(`wrote public/art/characters/${hero}-walk8.png`);
}
