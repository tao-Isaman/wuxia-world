/**
 * m1's work loops, animated by PixelLab from his painted work poses.
 *
 *   bun scripts/build-hero-work-loops.ts --first <dir>   # 1. the start frames
 *   python3 scripts/animate-hero-work.py <dir>   # 2. PixelLab animates them (PIXELLAB_API_TOKEN)
 *   bun scripts/build-hero-work-loops.ts --from <dir>    # 3. the sheet
 *
 * Step 1 cuts the first cell of each row of the painted work sheet
 * (scripts/build-hero-actions.ts) into <dir>/first/<activity>.png: 128 × 128,
 * one shared scale, the body on column `anchor`, feet on row `feet`
 * (HERO_WORK_LAYOUT.m1). Step 2 writes <dir>/out/<activity>/00…08.png, frame 00
 * being the start frame given back. Step 3 lays frames 01–08 of every activity
 * into public/art/characters/m1-work.png (8 × 14 cells); an activity without
 * frames leaves its row empty (list it in HERO_WORK_GAPS).
 */
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { HERO_ACTION_CELL, HERO_ACTIVITIES, HERO_WORK_LAYOUT } from "../lib/characters/hero-actions";

const HERO = "m1";
const args = process.argv.slice(2);
const flag = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const layout = HERO_WORK_LAYOUT[HERO];
/** The painted sheet's figure is HERO_ACTION_CELL.figure tall; the loops' is layout.figure. */
const SCALE = layout.figure / HERO_ACTION_CELL.figure;

const first = flag("--first"), from = flag("--from");
if (!first && !from) throw new Error("usage: bun scripts/build-hero-work-loops.ts --first <dir> | --from <dir>");

if (first) {
  // The painted sheet must still be the 4 × 14 cut (rebuild it with build-hero-actions.ts first).
  const painted = process.env.PAINTED_SHEET ?? `public/art/characters/${HERO}-work.png`;
  mkdirSync(`${first}/first`, { recursive: true });
  for (const [row, activity] of HERO_ACTIVITIES.entries()) {
    const { data, info } = await sharp(painted).extract({ left: 0, top: row * HERO_ACTION_CELL.height, width: HERO_ACTION_CELL.width, height: HERO_ACTION_CELL.height })
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, x1 = 0, y0 = info.height, y1 = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 0) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, sw = Math.round(w * SCALE), sh = Math.round(h * SCALE);
    const figure = await sharp(data, { raw: info }).extract({ left: x0, top: y0, width: w, height: h }).resize(sw, sh, { kernel: "nearest" }).png().toBuffer();
    // The body (the painted cell's middle column) lands on `anchor`, leaving room in front for tools and props.
    const left = Math.max(0, Math.min(layout.width - sw, Math.round(layout.anchor - (HERO_ACTION_CELL.width / 2 - x0) * SCALE)));
    await sharp({ create: { width: layout.width, height: layout.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: figure, left, top: layout.feet - sh }]).png().toFile(`${first}/first/${activity}.png`);
  }
  console.log(`wrote ${HERO_ACTIVITIES.length} start frames to ${first}/first/`);
}

if (from) {
  const { width: W, height: H, columns } = layout;
  const tiles: sharp.OverlayOptions[] = [];
  for (const [row, activity] of HERO_ACTIVITIES.entries()) {
    const dir = `${from}/out/${activity}`;
    const frames = existsSync(dir) ? readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort().slice(1, columns + 1) : [];
    if (frames.length < columns) { console.warn(`${activity}: ${frames.length} frames, row left empty`); continue; }
    for (const [column, file] of frames.entries()) {
      const input = await sharp(`${dir}/${file}`).resize(W, H, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      tiles.push({ input, left: column * W, top: row * H });
    }
  }
  await sharp({ create: { width: W * columns, height: H * HERO_ACTIVITIES.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles).png({ compressionLevel: 9, palette: true, colours: 256, dither: 0 }).toFile(`public/art/characters/${HERO}-work.png`);
  console.log(`wrote public/art/characters/${HERO}-work.png`);
}
