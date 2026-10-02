/**
 * Build the creature atlas (/art/creature-atlas.png) from painted beasts.
 *
 *   bun scripts/build-creature-atlas.ts --from <dir>
 *
 * <dir>/b<frame>.png is one painted animal per frame (CREATURE_ATLAS in
 * lib/characters/catalog.ts: 0 wolf · 1 tiger · 2 bear · 3 boar · 4 snake ·
 * 5 fowl · 6 raptor · 7 bat · 8 hare · 9 squirrel · 10 wild cat ·
 * 11 centipede), side view, facing left, on a flat light background.
 *
 * Each one is cut out, sized by its kind (a hare is smaller than a bear),
 * stood on the cell's ground line and reduced to the same pixel look as the
 * rigged character sheets: a quantised palette, hard alpha and a 1 px dark
 * outline. The atlas is 4 × 3 cells of 160 px.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { CREATURE_ATLAS, CREATURE_FRAME_COUNT } from "../lib/characters/catalog";
import { cutOut } from "./art-cutout";

const from = process.argv[process.argv.indexOf("--from") + 1];
if (!from || !existsSync(from)) throw new Error("usage: bun scripts/build-creature-atlas.ts --from <dir with b0.png … b11.png>");

const CELL = 160;
const GROUND = 154;
const OUTLINE = [26, 18, 12] as const;
/** Largest width / height a beast may take in its cell, by frame (small game stays small). */
const FIT: Record<number, [w: number, h: number]> = {
  0: [148, 112], 1: [154, 112], 2: [150, 124], 3: [146, 104], 4: [120, 128], 5: [104, 116],
  6: [150, 132], 7: [150, 104], 8: [96, 80], 9: [84, 92], 10: [132, 96], 11: [136, 96],
};

async function cell(frame: number): Promise<Buffer> {
  const trimmed = await sharp(await cutOut(`${from}/b${frame}.png`)).trim({ threshold: 8 }).toBuffer();
  const [maxW, maxH] = FIT[frame];
  const reduced = await sharp(trimmed).resize({ width: maxW, height: maxH, fit: "inside", kernel: "lanczos3" })
    .png({ palette: true, colours: 48, dither: 0 }).toBuffer();
  const { data, info } = await sharp(reduced).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const out = new Uint8ClampedArray(CELL * CELL * 4);
  const left = Math.round((CELL - w) / 2), top = GROUND - h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 110) continue;
    const o = ((top + y) * CELL + left + x) * 4;
    out[o] = data[i]; out[o + 1] = data[i + 1]; out[o + 2] = data[i + 2]; out[o + 3] = 255;
  }
  // A 1 px dark outline around the figure, like the character sheets.
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < CELL && y < CELL && out[(y * CELL + x) * 4 + 3] === 255;
  const ring: number[] = [];
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ring.push((y * CELL + x) * 4);
  }
  for (const o of ring) { out[o] = OUTLINE[0]; out[o + 1] = OUTLINE[1]; out[o + 2] = OUTLINE[2]; out[o + 3] = 255; }
  return sharp(Buffer.from(out.buffer), { raw: { width: CELL, height: CELL, channels: 4 } }).png().toBuffer();
}

const { columns, rows } = CREATURE_ATLAS;
const cells = await Promise.all(Array.from({ length: CREATURE_FRAME_COUNT }, (_, frame) => cell(frame)));
await sharp({ create: { width: CELL * columns, height: CELL * rows, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(cells.map((input, frame) => ({ input, left: (frame % columns) * CELL, top: Math.floor(frame / columns) * CELL })))
  .png({ compressionLevel: 9, palette: true, colours: 256, dither: 0 })
  .toFile("public/art/creature-atlas.png");
console.log(`wrote ${CREATURE_FRAME_COUNT} creatures to public/art/creature-atlas.png`);
