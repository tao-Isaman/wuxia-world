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
 *
 *   bun scripts/import-npc-art.ts --from <dir> --heroes
 *
 * Hero bodies instead: <dir>/body/<m1…f4>.png → public/player/body/<id>.png
 * (no portraits, no id lists); `build-npc-sheets.ts` rigs the hero sheets from them.
 *
 *   bun scripts/import-npc-art.ts --from <dir> --foes
 *
 * Costume archetype and enemy-type bodies: <dir>/body/<elder|…|foe_*>.png →
 * public/foes/body/<id>.png; `build-npc-sheets.ts` rigs them the same way.
 */
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cutOut } from "./art-cutout";

const from = process.argv[process.argv.indexOf("--from") + 1];
if (!from || !existsSync(`${from}/body`)) throw new Error("usage: bun scripts/import-npc-art.ts --from <dir with body/ and portrait/>");

const FRAME = 192, FEET = 188, MAX_H = 184, MAX_W = 184;

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

if (process.argv.includes("--heroes")) {
  mkdirSync("public/player/body", { recursive: true });
  const heroes = readdirSync(`${from}/body`).filter((f) => /^[mf][1-4]\.png$/.test(f));
  for (const file of heroes) writeFileSync(`public/player/body/${file}`, await fitBody(await cutOut(`${from}/body/${file}`)));
  console.log(`imported ${heroes.length} hero bodies`);
  process.exit(0);
}

if (process.argv.includes("--foes")) {
  const { COSTUME_CHARACTER_IDS, FOE_CHARACTER_IDS } = await import("../lib/characters/catalog");
  const known = new Set<string>([...COSTUME_CHARACTER_IDS, ...FOE_CHARACTER_IDS]);
  mkdirSync("public/foes/body", { recursive: true });
  const files = readdirSync(`${from}/body`).filter((f) => known.has(f.replace(/\.png$/, "")));
  for (const file of files) writeFileSync(`public/foes/body/${file}`, await fitBody(await cutOut(`${from}/body/${file}`)));
  console.log(`imported ${files.length} archetype / enemy bodies`);
  process.exit(0);
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
