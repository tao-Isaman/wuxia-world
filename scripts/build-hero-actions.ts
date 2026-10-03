/**
 * The heroes' painted action sprites (lib/characters/hero-actions.ts), from
 * painted strips.
 *
 *   bun scripts/build-hero-actions.ts --from <dir> [hero…]
 *
 * <dir>/<hero>/<row>.png is one painting per row: the same figure several
 * times side by side, facing right, on a flat light background — five per
 * weapon row (fist, long, sword, blade, short, hidden, music), six for the
 * combat row and four per activity (mine, chop, fish, herb, hunt, venom,
 * forge, cook, alchemy, craft, meditate, read, music_play, sleep).
 *
 * Each strip is cut out, split into its figures at the empty columns between
 * them (a stray dart or rock joins its nearer figure; figures that touch are
 * split at their thinnest column), scaled once per strip, centred on the
 * head-and-torso, set on the shared foot line and reduced to pixel art with
 * the walk8 palette, hard alpha and 1 px outline. One scale per strip comes
 * from a reference figure whose standing height is known (STRIPS below), so
 * a sitting or lying hero stays the size of a standing one.
 *
 * Output: public/art/characters/<hero>-combat.png (6 × 8 cells) and
 * <hero>-work.png (4 × 14 cells), cells of HERO_ACTION_CELL.
 * The painted sources are not kept in the repo.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { cutOut } from "./art-cutout";
import { HERO_ACTION_CELL, HERO_ACTION_IDS, HERO_ACTIVITIES, HERO_COMBAT_COLUMNS, HERO_COMBAT_ROWS, HERO_WORK_COLUMNS } from "../lib/characters/hero-actions";

const args = process.argv.slice(2);
const from = args[args.indexOf("--from") + 1];
if (!from || !existsSync(from)) throw new Error("usage: bun scripts/build-hero-actions.ts --from <dir with <hero>/<row>.png> [hero…]");
const only = args.filter((a, i) => a !== "--from" && args[i - 1] !== "--from");

const { width: CW, height: CH, feet: FEET, figure: FIGURE } = HERO_ACTION_CELL;
const OUTLINE = [26, 18, 12] as const;

/**
 * Per strip: figure count, the reference figure, and how its measure compares
 * with the standing height (`h` its torso-to-feet height, `w` its width for a lying pose).
 */
interface Strip { file: string; count: number; ref: number; measure: "h" | "w"; ratio: number }
const strip = (file: string, count: number, ref = 0, ratio = 1, measure: "h" | "w" = "h"): Strip => ({ file, count, ref, measure, ratio });
const COMBAT: Strip[] = [
  strip("fist", 5, 0, 0.97), strip("long", 5, 0, 0.97), strip("sword", 5, 0, 0.97), strip("blade", 5, 0, 0.95),
  strip("short", 5, 0, 0.97), strip("hidden", 5, 0, 0.98), strip("music", 5, 0, 1), strip("combat", 6, 0, 1),
];
const WORK: Record<string, Strip> = {
  mine: strip("mine", 4, 3, 0.97), chop: strip("chop", 4, 3, 0.97), fish: strip("fish", 4, 0, 1), herb: strip("herb", 4, 2, 0.98),
  hunt: strip("hunt", 4, 0, 1), venom: strip("venom", 4, 3, 1), forge: strip("forge", 4, 3, 0.97), cook: strip("cook", 4, 0, 1),
  alchemy: strip("alchemy", 4, 3, 1), craft: strip("craft", 4, 0, 0.58), meditate: strip("meditate", 4, 0, 0.58),
  read: strip("read", 4, 0, 0.58), music: strip("music_play", 4, 0, 0.58), sleep: strip("sleep", 4, 0, 1.0, "w"),
};

interface Raster { w: number; h: number; data: Uint8ClampedArray }
async function raster(buffer: Buffer): Promise<Raster> {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
}
const alphaAt = (r: Raster, x: number, y: number) => r.data[(y * r.w + x) * 4 + 3];

interface Figure { buffer: Buffer; w: number; h: number; anchor: number; body: number }

/**
 * Split a strip into `expected` figures by connected parts: the big parts are
 * figures (in x order); a small part (a thrown dart, a rock, a sword tip cut
 * loose) joins the figure on its left, the one it flies or lies in front of.
 * Too many big parts: the smallest joins its nearer neighbour. Too few (a
 * blade touching the next figure): the widest is cut at its thinnest column.
 */
function splitFigures(r: Raster, expected: number): Uint8Array[] {
  const n = r.w * r.h, label = new Int32Array(n).fill(-1);
  const parts: { area: number; x0: number; x1: number; cx: number; pixels: number[] }[] = [];
  for (let start = 0; start < n; start++) {
    if (label[start] >= 0 || r.data[start * 4 + 3] === 0) continue;
    const id = parts.length, pixels = [start];
    label[start] = id;
    for (let k = 0; k < pixels.length; k++) {
      const p = pixels[k], x = p % r.w, y = (p / r.w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const qx = x + dx, qy = y + dy;
        if (qx < 0 || qy < 0 || qx >= r.w || qy >= r.h) continue;
        const q = qy * r.w + qx;
        if (label[q] < 0 && r.data[q * 4 + 3] > 0) { label[q] = id; pixels.push(q); }
      }
    }
    let x0 = r.w, x1 = 0, sx = 0;
    for (const p of pixels) { const x = p % r.w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); sx += x; }
    parts.push({ area: pixels.length, x0, x1, cx: sx / pixels.length, pixels });
  }
  const largest = Math.max(...parts.map((p) => p.area));
  type Group = { x0: number; x1: number; cx: number; area: number; pixels: number[] };
  let figures: Group[] = parts.filter((p) => p.area >= largest * 0.2).map((p) => ({ ...p, pixels: [...p.pixels] })).sort((a, b) => a.cx - b.cx);
  const join = (into: Group, part: Group) => {
    into.pixels.push(...part.pixels);
    into.cx = (into.cx * into.area + part.cx * part.area) / (into.area + part.area);
    into.area += part.area; into.x0 = Math.min(into.x0, part.x0); into.x1 = Math.max(into.x1, part.x1);
  };
  while (figures.length > expected) {
    let i = 0;
    figures.forEach((f, j) => { if (f.area < figures[i].area) i = j; });
    const left = i > 0 ? figures[i].x0 - figures[i - 1].x1 : Infinity, right = i < figures.length - 1 ? figures[i + 1].x0 - figures[i].x1 : Infinity;
    join(figures[left <= right ? i - 1 : i + 1], figures[i]);
    figures.splice(i, 1);
  }
  while (figures.length < expected && figures.length) {
    let i = 0;
    figures.forEach((f, j) => { if (f.x1 - f.x0 > figures[i].x1 - figures[i].x0) i = j; });
    const f = figures[i], counts = new Int32Array(f.x1 - f.x0 + 1);
    for (const p of f.pixels) counts[p % r.w - f.x0]++;
    const a = Math.round(counts.length * 0.3), b = Math.round(counts.length * 0.7);
    let cut = a;
    for (let x = a; x <= b; x++) if (counts[x] < counts[cut]) cut = x;
    cut += f.x0;
    const halves: Group[] = [[], []].map(() => ({ x0: r.w, x1: 0, cx: 0, area: 0, pixels: [] as number[] }));
    for (const p of f.pixels) halves[p % r.w < cut ? 0 : 1].pixels.push(p);
    for (const h of halves) {
      let sx = 0;
      for (const p of h.pixels) { const x = p % r.w; h.x0 = Math.min(h.x0, x); h.x1 = Math.max(h.x1, x); sx += x; }
      h.area = h.pixels.length; h.cx = sx / Math.max(1, h.area);
    }
    figures.splice(i, 1, ...halves);
  }
  const big = new Set(figures.flatMap((f) => f.pixels.length ? [f.pixels[0]] : []));
  for (const part of parts) {
    if (part.area >= largest * 0.2 || big.has(part.pixels[0])) continue;
    // Specks; and anything else joins the nearest figure on its left (else the nearest).
    if (part.area < 12) continue;
    const lefts = figures.filter((f) => f.cx <= part.cx);
    const into = lefts.length ? lefts[lefts.length - 1] : figures[0];
    into.pixels.push(...part.pixels);
  }
  return figures.map((f) => { const mask = new Uint8Array(n); for (const p of f.pixels) mask[p] = 1; return mask; });
}

/** One figure, trimmed; `anchor` is its head-and-torso centre, `body` its height without thin tips (a raised spear, a dart). */
async function figure(r: Raster, mask: Uint8Array): Promise<Figure> {
  let x0 = r.w, x1 = -1, top = r.h, bottom = -1;
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    const x = p % r.w, y = (p / r.w) | 0;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  const w = x1 - x0 + 1, h = bottom - top + 1;
  const data = new Uint8ClampedArray(w * h * 4);
  const solid = (x: number, y: number) => mask[y * r.w + x] === 1 && r.data[(y * r.w + x) * 4 + 3] > 110;
  for (let y = top; y <= bottom; y++) for (let x = x0; x <= x1; x++) {
    if (!mask[y * r.w + x]) continue;
    const i = (y * r.w + x) * 4, o = ((y - top) * w + (x - x0)) * 4;
    data[o] = r.data[i]; data[o + 1] = r.data[i + 1]; data[o + 2] = r.data[i + 2]; data[o + 3] = r.data[i + 3];
  }
  const buffer = await sharp(Buffer.from(data.buffer), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  // The body's top: the first row with a head's worth of solid pixels.
  let bodyTop = top;
  for (let y = top; y <= bottom; y++) { let c = 0; for (let x = x0; x <= x1; x++) if (solid(x, y)) c++; if (c >= h * 0.07) { bodyTop = y; break; } }
  let sum = 0, count = 0;
  for (let y = bodyTop; y < bodyTop + Math.round((bottom - bodyTop) * 0.45); y++) for (let x = x0; x <= x1; x++) if (solid(x, y)) { sum += x - x0; count++; }
  return { buffer, w, h, anchor: count ? sum / count : w / 2, body: bottom - bodyTop + 1 };
}

/** Scale, palette-reduce, harden alpha and outline one figure into an action cell. */
async function cell(f: Figure, scale: number, centred: boolean): Promise<Raster> {
  const w = Math.max(1, Math.round(f.w * scale)), h = Math.max(1, Math.round(f.h * scale));
  const reduced = await sharp(f.buffer).resize(w, h, { kernel: "lanczos3" }).png({ palette: true, colours: 48, dither: 0 }).toBuffer();
  const src = await raster(reduced);
  const out: Raster = { w: CW, h: CH, data: new Uint8ClampedArray(CW * CH * 4) };
  const left = Math.round(CW / 2 - (centred ? w / 2 : f.anchor * scale)), top = FEET - h;
  const keep = new Uint8Array(src.w * src.h), seen = new Uint8Array(src.w * src.h);
  for (let start = 0; start < src.w * src.h; start++) {
    if (seen[start] || src.data[start * 4 + 3] < 110) continue;
    const part = [start]; seen[start] = 1;
    for (let k = 0; k < part.length; k++) {
      const p = part[k], x = p % src.w, y = (p / src.w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < src.w - 1 ? p + 1 : -1, y > 0 ? p - src.w : -1, y < src.h - 1 ? p + src.w : -1]) {
        if (q >= 0 && !seen[q] && src.data[q * 4 + 3] >= 110) { seen[q] = 1; part.push(q); }
      }
    }
    // Darts and sparks are small but wanted; only specks go.
    if (part.length >= 10) for (const p of part) keep[p] = 1;
  }
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < src.w && y < src.h && keep[y * src.w + x] === 1;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const sx = x - left, sy = y - top, o = (y * CW + x) * 4;
    if (solid(sx, sy)) {
      const i = (sy * src.w + sx) * 4;
      out.data[o] = src.data[i]; out.data[o + 1] = src.data[i + 1]; out.data[o + 2] = src.data[i + 2]; out.data[o + 3] = 255;
    } else if (solid(sx - 1, sy) || solid(sx + 1, sy) || solid(sx, sy - 1) || solid(sx, sy + 1)) {
      out.data[o] = OUTLINE[0]; out.data[o + 1] = OUTLINE[1]; out.data[o + 2] = OUTLINE[2]; out.data[o + 3] = 255;
    }
  }
  return out;
}

async function stripCells(hero: string, s: Strip): Promise<Raster[]> {
  const path = `${from}/${hero}/${s.file}.png`;
  if (!existsSync(path)) throw new Error(`missing ${path}`);
  // Pale steel on a pure white ground: a tight flood fill keeps the blades.
  const cut = await cutOut(path, { pocketTolerance: 4, pocketMin: 400, tolerance: 18 });
  const r = await raster(cut);
  const masks = splitFigures(r, s.count);
  if (masks.length !== s.count) throw new Error(`${path}: found ${masks.length} figures, expected ${s.count} (repaint this strip)`);
  const figures = await Promise.all(masks.map((mask) => figure(r, mask)));
  const ref = figures[s.ref];
  const standing = (s.measure === "w" ? ref.w : ref.body) / s.ratio;
  // One scale per strip: the standing height is FIGURE px, and no pose leaves the cell.
  const scale = Math.min(FIGURE / standing, ...figures.map((f) => (CW - 4) / f.w), ...figures.map((f) => (FEET - 2) / f.h));
  return Promise.all(figures.map((f) => cell(f, scale, s.measure === "w")));
}

async function writeSheet(cells: (Raster | null)[], columns: number, file: string) {
  const rows = Math.ceil(cells.length / columns);
  const sheet: Raster = { w: CW * columns, h: CH * rows, data: new Uint8ClampedArray(CW * columns * CH * rows * 4) };
  cells.forEach((c, index) => {
    if (!c) return;
    const ox = (index % columns) * CW, oy = Math.floor(index / columns) * CH;
    for (let y = 0; y < CH; y++) sheet.data.set(c.data.subarray(y * CW * 4, (y + 1) * CW * 4), ((oy + y) * sheet.w + ox) * 4);
  });
  await sharp(Buffer.from(sheet.data.buffer), { raw: { width: sheet.w, height: sheet.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colours: 128, dither: 0 }).toFile(file);
  console.log(`wrote ${file}`);
}

for (const hero of HERO_ACTION_IDS.filter((id) => !only.length || only.includes(id))) {
  if (!existsSync(`${from}/${hero}`)) { console.warn(`skip ${hero}: no strips`); continue; }
  const combat: (Raster | null)[] = [];
  for (const [row, s] of COMBAT.entries()) {
    if (s.file !== HERO_COMBAT_ROWS[row]) throw new Error(`combat row ${row} is ${HERO_COMBAT_ROWS[row]}, not ${s.file}`);
    const cells = await stripCells(hero, s);
    for (let c = 0; c < HERO_COMBAT_COLUMNS; c++) combat.push(cells[c] ?? null);
  }
  await writeSheet(combat, HERO_COMBAT_COLUMNS, `public/art/characters/${hero}-combat.png`);
  const work: (Raster | null)[] = [];
  for (const activity of HERO_ACTIVITIES) {
    // An unpainted loop stays empty; list it in HERO_WORK_GAPS so the game keeps the plain preview for it.
    if (!existsSync(`${from}/${hero}/${WORK[activity].file}.png`)) { console.warn(`${hero}: no ${activity} strip, row left empty`); work.push(null, null, null, null); continue; }
    work.push(...await stripCells(hero, WORK[activity]));
  }
  await writeSheet(work, HERO_WORK_COLUMNS, `public/art/characters/${hero}-work.png`);
}
