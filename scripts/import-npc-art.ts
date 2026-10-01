/**
 * Import painted NPC art (a full-body figure and a bust portrait per NPC)
 * into public/npcs/ and register the ids.
 *
 *   bun scripts/import-npc-art.ts --from <dir>
 *
 * <dir>/body/<id>.png      a full-body painting on a flat light background
 * <dir>/portrait/<id>.png  a square bust portrait
 *
 * The body's background is removed by a flood fill from the border (every
 * pixel close to the border colour that touches it), the edge is softened by
 * one pixel, and the figure is fitted into the 192 × 192 body frame, feet at
 * y 188. Portraits are resized to 256 × 256. The ids are added to
 * npc-body-ids.ts and npc-portrait-ids.ts; then run
 * `bun scripts/build-npc-sprites.ts` (and `build-npc-sheets.ts` for rigged ones).
 */
import sharp from "sharp";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const from = process.argv[process.argv.indexOf("--from") + 1];
if (!from || !existsSync(`${from}/body`)) throw new Error("usage: bun scripts/import-npc-art.ts --from <dir with body/ and portrait/>");

const FRAME = 192, FEET = 188, MAX_H = 184, MAX_W = 184;
const TOLERANCE = 34, POCKET_TOLERANCE = 10;

async function cutOut(path: string): Promise<Buffer> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Background colour: the median of the border pixels.
  const border: number[][] = [];
  for (let x = 0; x < w; x += 4) for (const y of [0, h - 1]) border.push([...data.subarray((y * w + x) * 4, (y * w + x) * 4 + 3)]);
  for (let y = 0; y < h; y += 4) for (const x of [0, w - 1]) border.push([...data.subarray((y * w + x) * 4, (y * w + x) * 4 + 3)]);
  const bg = [0, 1, 2].map((c) => border.map((p) => p[c]).sort((a, b) => a - b)[border.length >> 1]);
  const dist = (i: number) => Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
  const isBg = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (isBg[p] || dist(p * 4) > TOLERANCE) continue;
    isBg[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Pockets of flat background enclosed by the figure (between an arm and the
  // body, inside a coiled whip): near-exact background colour, 40+ pixels.
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (isBg[start] || seen[start] || dist(start * 4) > POCKET_TOLERANCE) continue;
    const pocket: number[] = [];
    stack.push(start); seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      pocket.push(p);
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !seen[q] && !isBg[q] && dist(q * 4) <= POCKET_TOLERANCE) { seen[q] = 1; stack.push(q); }
      }
    }
    if (pocket.length >= 40) for (const p of pocket) isBg[p] = 1;
  }
  for (let p = 0; p < w * h; p++) {
    if (isBg[p]) { data[p * 4 + 3] = 0; continue; }
    // Soften the outermost ring of the figure against the removed background.
    const x = p % w, y = (p / w) | 0;
    const edge = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
    if (edge) data[p * 4 + 3] = Math.min(255, Math.round(80 + dist(p * 4) * 4));
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function fitBody(cut: Buffer): Promise<Buffer> {
  const trimmed = await sharp(cut).trim({ threshold: 8 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const scale = Math.min(MAX_H / meta.height!, MAX_W / meta.width!);
  const fw = Math.max(1, Math.round(meta.width! * scale)), fh = Math.max(1, Math.round(meta.height! * scale));
  const fig = await sharp(trimmed).resize(fw, fh, { kernel: "lanczos3" }).png().toBuffer();
  return sharp({ create: { width: FRAME, height: FRAME, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fig, left: Math.round((FRAME - fw) / 2), top: FEET - fh }]).png().toBuffer();
}

function register(file: string, ids: string[]) {
  const src = readFileSync(file, "utf8");
  const have = new Set([...src.matchAll(/^\s+"([^"]+)",$/gm)].map((m) => m[1]));
  const all = [...new Set([...have, ...ids])].sort();
  const head = src.slice(0, src.indexOf("new Set([") + "new Set([".length);
  writeFileSync(file, `${head}\n${all.map((id) => `  ${JSON.stringify(id)},`).join("\n")}\n]);\n`);
}

const ids: string[] = [];
for (const file of readdirSync(`${from}/body`).filter((f) => f.endsWith(".png")).sort()) {
  const id = file.replace(/\.png$/, "");
  if (!existsSync(`${from}/portrait/${file}`)) { console.warn(`skip ${id}: no portrait`); continue; }
  writeFileSync(`public/npcs/body/${file}`, await fitBody(await cutOut(`${from}/body/${file}`)));
  await sharp(`${from}/portrait/${file}`).resize(256, 256, { fit: "cover", kernel: "lanczos3" }).png().toFile(`public/npcs/${file}`);
  ids.push(id);
}
register("lib/world/data/npc-body-ids.ts", ids);
register("lib/world/data/npc-portrait-ids.ts", ids);
console.log(`imported ${ids.length} NPCs`);
