/**
 * Pack PixelLab characters (people, style B) into the game's character sheets.
 *
 *   bun scripts/build-pixellab-sheets.ts --from <raw> [id …]
 *
 * <raw>/<id>/ is what scripts/pixellab-characters.py downloads: rotations/<dir>.png
 * and <animation>/<dir>/NN.png. The animations used (by the name they were
 * given when animated) are
 *
 *   idle    south (the map) and east (standing in battle)
 *   walk    south, south-east, east, north-east, north (the other three are mirrored)
 *   attack · hurt · stance · victory · defeat    east (battle; mirrored to face west)
 *
 * and the rotations are the standing poses. A missing battle clip falls back
 * to the east rotation, so a character can be packed before every clip exists.
 * A character's `clips` in scripts/pixellab-characters.json picks another take
 * for a clip (`"walk": "try_walk_v3"`), so a re-roll can replace a clip
 * without renaming anything on PixelLab. A take may name a frame range
 * (`"walk_loop#0-7"` drops a loop's closing frame, which repeats its first)
 * and a list of takes plays one after another (`["attack#5-6", "slash"]`:
 * the draw of one take, then the strike of another). `"walk:east"` picks a
 * take for one direction only, and a backward range (`"walk_loop#7-0"`) plays
 * a take in reverse (for a walk drawn stepping backward). A take may come from
 * another downloaded character (`"m1_square/walk_skel"`: a PixelLab state of
 * the same person), and `"stand:south": "m1_square"` takes that direction's
 * standing pose from it. A manifest entry with `partOf` is such a source only:
 * it is not packed into a sheet of its own.
 *
 * PixelLab grows the canvas of a custom animation evenly around the character
 * (a 128 px character attacks on 172 px), so every frame is aligned by its
 * canvas centre and placed with the feet — the bottom of the south rotation —
 * on one row. Frames keep their native pixels: no scaling, no palette change.
 * Cells are square, big enough for the widest and tallest frame and for the
 * preview's crop (components/game/character-preview.tsx), eight to a row.
 *
 * Writes public/art/characters/pl/<id>.png and rewrites
 * lib/characters/pl-sheets-data.ts (with a ?v= content hash). Ids not given
 * keep their current entry. See docs/assets.md#pixellab-characters.
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { PL_SHEET_DATA } from "../lib/characters/pl-sheets-data";
import type { PlSheet } from "../lib/characters/pl-sheets";
import type { CharacterClip, CharacterMotion } from "../lib/characters/catalog";
import { WALK8_DIRECTIONS, type Walk8Direction } from "../lib/characters/walk8";

const OUT_DIR = "public/art/characters/pl";
const DATA_FILE = "lib/characters/pl-sheets-data.ts";
const COLUMNS = 8;
/** The canvas PixelLab draws the character on; bigger animation canvases grow evenly around it. */
const BASE = 128;
/** The rigged atlases' figure, cell and feet row (lib/characters/sheet.ts): the preview crops to their proportions. */
const RIGGED = { figure: 108, cell: 128, feet: 120 };
const DIR_NAME: Record<Walk8Direction, string> = { S: "south", SE: "south-east", E: "east", NE: "north-east", N: "north" };
/** Per character: which downloaded take each clip uses (default: the clip's own name). */
const MANIFEST = JSON.parse(readFileSync("scripts/pixellab-characters.json", "utf8")) as Record<string, { partOf?: string; clips?: Record<string, string | string[]> }>;

const args = process.argv.slice(2);
const fromAt = args.indexOf("--from");
const from = fromAt >= 0 ? args[fromAt + 1] : undefined;
if (!from || !existsSync(from)) throw new Error("usage: bun scripts/build-pixellab-sheets.ts --from <raw dir> [id …]");
const only = args.filter((_, i) => i !== fromAt && i !== fromAt + 1);
const ids = readdirSync(from).filter((id) => existsSync(join(from, id, "rotations")) && !id.startsWith("beast_") && !MANIFEST[id]?.partOf && (!only.length || only.includes(id)));
if (!ids.length) throw new Error(`no characters to pack in ${from}`);

type Frame = { data: Buffer; w: number; h: number; dx: number; dy: number; box: { x0: number; y0: number; x1: number; y1: number } };

async function readFrame(path: string): Promise<Frame> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] < 24) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) throw new Error(`empty frame: ${path}`);
  // Offset of this canvas from the 128 px base canvas (growth is even on every side).
  return { data, w: info.width, h: info.height, dx: (info.width - BASE) / 2, dy: (info.height - BASE) / 2, box: { x0, y0, x1, y1 } };
}

function framesOf(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")).sort().map((f) => join(dir, f)) : [];
}

async function pack(id: string): Promise<PlSheet> {
  const root = join(from!, id);
  const paths: string[] = [];
  const add = (files: string[]) => { const start = paths.length; paths.push(...files); return files.map((_, i) => start + i); };
  // `clip:direction` (e.g. "walk:east") overrides the clip's take for one direction.
  const takes = (name: string, dir: string) => [MANIFEST[id]?.clips?.[`${name}:${dir}`] ?? MANIFEST[id]?.clips?.[name] ?? name].flat();
  /** The standing pose: this character's rotation, or another downloaded character's (`"stand:south": "m1_square"`). */
  const rotation = (dir: string) => {
    const from_ = MANIFEST[id]?.clips?.[`stand:${dir}`];
    return join(from!, typeof from_ === "string" ? from_ : id, "rotations", `${dir}.png`);
  };
  /** One take's frames: `name`, `name#from-to` (inclusive frame numbers), or `<character>/name`. */
  const takeFrames = (spec: string, dir: string) => {
    const [name, range] = spec.split("#");
    const files = framesOf(name.includes("/") ? join(from!, name, dir) : join(root, name, dir));
    if (!range) return files;
    // "7-0" plays the frames backward: a walk drawn stepping backward becomes a forward walk.
    const [first, last] = range.split("-").map(Number);
    return first <= last ? files.slice(first, last + 1) : files.slice(last, first + 1).reverse();
  };
  const clipOr = (name: string, dir: string) => {
    const files = takes(name, dir).flatMap((spec) => takeFrames(spec, dir));
    return files.length ? files : [rotation(dir)];
  };

  const stand = Object.fromEntries(WALK8_DIRECTIONS.map((d) => [d, add([rotation(DIR_NAME[d])])[0]])) as Record<Walk8Direction, number>;
  const walk = Object.fromEntries(WALK8_DIRECTIONS.map((d) => [d, add(clipOr("walk", DIR_NAME[d]))])) as Record<Walk8Direction, number[]>;
  const idleSouth = add(clipOr("idle", "south"));
  const idleEast = add(clipOr("idle", "east"));
  const attack = add(clipOr("attack", "east"));
  const hurt = add(clipOr("hurt", "east"));
  const stance = add(clipOr("stance", "east"));
  const victory = add(clipOr("victory", "east"));
  const defeat = add(clipOr("defeat", "east"));

  const frames = await Promise.all(paths.map(readFrame));
  // The feet: the bottom of the character's own standing south pose; the body's axis: the base canvas's centre.
  const south = await readFrame(join(root, "rotations", "south.png"));
  const feet = south.box.y1 + 1 - south.dy, axis = BASE / 2;
  const figure = south.box.y1 - south.box.y0 + 1;
  // A frame from another character (a state of the same person) stands its feet where that character's do:
  // move it so its south pose's feet meet this one's.
  const sources = [...new Set(paths.map((p) => relative(from!, p).split(sep)[0]).filter((c) => c !== id))];
  for (const c of sources) {
    const theirs = await readFrame(join(from!, c, "rotations", "south.png"));
    const shift = feet - (theirs.box.y1 + 1 - theirs.dy);
    paths.forEach((p, i) => { if (relative(from!, p).split(sep)[0] === c) frames[i].dy -= shift; });
  }
  let left = 0, right = 0, up = 0, down = 0;
  for (const f of frames) {
    left = Math.max(left, axis - (f.box.x0 - f.dx));
    right = Math.max(right, f.box.x1 + 1 - f.dx - axis);
    up = Math.max(up, feet - (f.box.y0 - f.dy));
    down = Math.max(down, f.box.y1 + 1 - f.dy - feet);
  }
  // The preview shows the square a rigged cell would: keep it inside the cell.
  const side = Math.ceil(figure * RIGGED.cell / RIGGED.figure);
  const feetY = Math.ceil(Math.max(up + 2, side * RIGGED.feet / RIGGED.cell + 1));
  let cell = Math.max(2 * Math.ceil(Math.max(left, right)) + 4, feetY + Math.ceil(down) + 2, side + 2, feetY + Math.ceil(side * (RIGGED.cell - RIGGED.feet) / RIGGED.cell) + 1);
  cell += cell % 2;
  const rows = Math.ceil(frames.length / COLUMNS);

  const pieces = frames.map((f, i) => {
    const { x0, y0, x1, y1 } = f.box, w = x1 - x0 + 1, h = y1 - y0 + 1;
    const crop = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) f.data.copy(crop, y * w * 4, ((y0 + y) * f.w + x0) * 4, ((y0 + y) * f.w + x0 + w) * 4);
    const left = (i % COLUMNS) * cell + cell / 2 - axis + (x0 - f.dx);
    const top = Math.floor(i / COLUMNS) * cell + feetY - feet + (y0 - f.dy);
    return { input: crop, raw: { width: w, height: h, channels: 4 as const }, left: Math.round(left), top: Math.round(top) };
  });
  const png = await sharp({ create: { width: COLUMNS * cell, height: rows * cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(pieces).png({ compressionLevel: 9 }).toBuffer();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `${id}.png`), png);

  const clip = (frames: number[], fps: number, repeat: number): CharacterClip => ({ frames, fps, repeat });
  const clips: Record<CharacterMotion, CharacterClip> = {
    idle: clip(idleSouth, 5, -1),
    walk: clip(walk.E, 10, -1),
    walkNorth: clip(walk.N, 10, -1),
    walkSouth: clip(walk.S, 10, -1),
    attack: clip(attack, 12, 0),
    hurt: clip(hurt, 10, 0),
    guard: clip(stance, 8, -1),
    victory: clip(victory, 8, 0),
    defeat: clip(defeat, 8, 0),
  };
  const hash = createHash("sha1").update(png).digest("hex").slice(0, 8);
  console.log(`${id}: ${frames.length} frames, cell ${cell}, feet ${feetY}, figure ${figure}, ${COLUMNS * cell}×${rows * cell}`);
  return { id, url: `/art/characters/pl/${id}.png?v=${hash}`, cell, columns: COLUMNS, rows, feetY, figure, clips,
    battleIdle: clip(idleEast, 5, -1), walk8: { walk, stand, fps: 10 } };
}

const data: Record<string, PlSheet> = { ...PL_SHEET_DATA };
for (const id of ids) data[id] = await pack(id);
const sorted = Object.fromEntries(Object.keys(data).sort().map((id) => [id, data[id]]));
writeFileSync(DATA_FILE, `// Generated by scripts/build-pixellab-sheets.ts — do not edit by hand.
import type { PlSheet } from "./pl-sheets";

export const PL_SHEET_DATA: Record<string, PlSheet> = ${JSON.stringify(sorted, null, 2).replace(/\[\s+([\d,\s]+?)\s+\]/g, (_, nums: string) => `[${nums.split(/[\s,]+/).filter(Boolean).join(", ")}]`)};
`);
console.log(`wrote ${DATA_FILE} (${Object.keys(sorted).length} sheets)`);
