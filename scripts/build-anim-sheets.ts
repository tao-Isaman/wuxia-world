/**
 * Pack the PixelLab-animated big foes (bosses and T5 masters) into their sheets.
 *
 *   bun scripts/build-anim-sheets.ts --from <raw> [id …]
 *
 * <raw>/<id>/<clip>/NN.png are one subject's animation frames (clip = idle,
 * attack, hurt), every clip painted on the same canvas from the same start
 * pose (PixelLab animate-object v3, frame 00 being that start pose; see
 * docs/assets.md#animated-big-foes). SUBJECTS below picks the frames
 * of each clip, its fps and the sheet's scale.
 *
 * Each sheet is cut to the union of every picked frame's drawn pixels (plus a
 * 1 px margin), so all frames share one size and stay registered: the body
 * does not jump between clips and the feet sit on one line — the bottom of the
 * start pose, written as feetY. Rows are idle, attack, hurt. The PNG is
 * palette-quantised, and lib/characters/anim-sheets-data.ts is rewritten with
 * a ?v= content hash, so rerunning on the same frames changes nothing.
 * Ids not given (or without frames in <raw>) keep their current entry.
 */
import sharp from "sharp";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { BOSS_SHEET_IDS, T5_SHEET_IDS, type AnimClipName, type AnimSheet } from "../lib/characters/anim-sheets";
import { ANIM_SHEET_DATA } from "../lib/characters/anim-sheets-data";

type ClipPick = { frames: number[]; fps: number };
type Subject = { scale: number; clips: Record<AnimClipName, ClipPick> };

/** 0…n-1 then back down (n … 1), a seamless loop out of a clip that drifts. */
const pingPong = (n: number) => [...Array(n).keys(), ...Array.from({ length: n - 2 }, (_, i) => n - 2 - i)];
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const SUBJECTS: Record<string, Subject> = {
  boss_golden_serpent: { scale: 2.3, clips: { idle: { frames: range(0, 7), fps: 7 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: range(1, 5), fps: 9 } } },
  boss_blood_tiger: { scale: 2.2, clips: { idle: { frames: range(0, 7), fps: 7 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: [3, 4, 5, 4], fps: 8 } } },
  boss_sword_eagle: { scale: 2.4, clips: { idle: { frames: pingPong(4), fps: 6 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: [1, 3, 4, 5, 6], fps: 9 } } },
  boss_sun_turtle: { scale: 2.6, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 6), fps: 9 }, hurt: { frames: range(1, 5), fps: 9 } } },
  boss_blade_crab: { scale: 2.5, clips: { idle: { frames: pingPong(5), fps: 7 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: [1, 2, 3, 4], fps: 9 } } },
  boss_flame_bull: { scale: 2.4, clips: { idle: { frames: range(0, 7), fps: 7 }, attack: { frames: range(1, 7), fps: 11 }, hurt: { frames: [1, 3, 4, 5], fps: 8 } } },
  t5_nameless_sword_hermit: { scale: 1.08, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 8), fps: 12 }, hurt: { frames: [1, 2, 3, 2], fps: 9 } } },
  t5_blood_blade_lord: { scale: 1.15, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: [1, 2, 3, 1], fps: 9 } } },
  t5_poison_matriarch: { scale: 1.05, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 8), fps: 10 }, hurt: { frames: [1, 2, 2, 1], fps: 9 } } },
  t5_iron_monk: { scale: 1.2, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 8), fps: 11 }, hurt: { frames: [1, 3, 4, 3], fps: 9 } } },
  t5_white_tiger: { scale: 1.3, clips: { idle: { frames: range(0, 7), fps: 7 }, attack: { frames: range(1, 8), fps: 12 }, hurt: { frames: [1, 2, 3, 4], fps: 9 } } },
  t5_wolf_king: { scale: 1.35, clips: { idle: { frames: pingPong(5), fps: 6 }, attack: { frames: range(1, 8), fps: 12 }, hurt: { frames: [1, 2, 3, 4], fps: 9 } } },
};
const CLIPS: AnimClipName[] = ["idle", "attack", "hurt"];
const MAX_WIDTH = 2048;
const OUT_DIR = "public/art/anims";
const DATA_FILE = "lib/characters/anim-sheets-data.ts";

const args = process.argv.slice(2);
const fromAt = args.indexOf("--from");
const from = fromAt >= 0 ? args[fromAt + 1] : undefined;
if (!from || !existsSync(from)) throw new Error("usage: bun scripts/build-anim-sheets.ts --from <raw dir> [id …]");
const only = args.filter((a, i) => i !== fromAt && i !== fromAt + 1);
const ids = [...BOSS_SHEET_IDS, ...T5_SHEET_IDS].filter((id) => !only.length || only.includes(id));

type Frame = { data: Buffer; w: number; h: number };
type Box = { x0: number; y0: number; x1: number; y1: number };

async function loadFrame(file: string): Promise<Frame> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Drop the faint fringe the model leaves around the figure.
  for (let i = 3; i < data.length; i += 4) if (data[i] < 24) data[i] = 0;
  return { data, w: info.width, h: info.height };
}

function drawnBox(f: Frame): Box | null {
  let x0 = f.w, y0 = f.h, x1 = -1, y1 = -1;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    if (f.data[(y * f.w + x) * 4 + 3] === 0) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

const next: Record<string, AnimSheet> = { ...ANIM_SHEET_DATA };
for (const id of ids) {
  const subject = SUBJECTS[id];
  const dir = `${from}/${id}`;
  if (!subject || !CLIPS.every((c) => existsSync(`${dir}/${c}/00.png`))) { console.warn(`${id}: no frames in ${dir}, kept as is`); continue; }

  const clips = {} as Record<AnimClipName, Frame[]>;
  for (const clip of CLIPS) clips[clip] = await Promise.all(subject.clips[clip].frames.map((i) => loadFrame(`${dir}/${clip}/${String(i).padStart(2, "0")}.png`)));
  const start = await loadFrame(`${dir}/idle/00.png`);
  const all = CLIPS.flatMap((c) => clips[c]);
  if (all.some((f) => f.w !== start.w || f.h !== start.h)) throw new Error(`${id}: clips are not on one canvas`);

  const union = all.map(drawnBox).reduce<Box>((u, b) => b ? { x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) } : u,
    { x0: start.w, y0: start.h, x1: 0, y1: 0 });
  const feet = drawnBox(start)!.y1 + 1;
  const left = Math.max(0, union.x0 - 1), top = Math.max(0, union.y0 - 1);
  const frameW = Math.min(start.w, union.x1 + 2) - left, frameH = Math.min(start.h, union.y1 + 2) - top;
  const columns = Math.max(...CLIPS.map((c) => clips[c].length));
  if (columns * frameW > MAX_WIDTH) throw new Error(`${id}: ${columns} × ${frameW} px is wider than ${MAX_WIDTH}`);

  const tiles: sharp.OverlayOptions[] = [];
  for (const [row, clip] of CLIPS.entries()) for (const [col, f] of clips[clip].entries()) {
    const input = await sharp(f.data, { raw: { width: f.w, height: f.h, channels: 4 } }).extract({ left, top, width: frameW, height: frameH }).png().toBuffer();
    tiles.push({ input, left: col * frameW, top: row * frameH });
  }
  const png = await sharp({ create: { width: columns * frameW, height: CLIPS.length * frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles).png({ palette: true, colours: 256, dither: 0, effort: 10, compressionLevel: 9 }).toBuffer();
  writeFileSync(`${OUT_DIR}/${id}.png`, png);
  const v = createHash("sha1").update(png).digest("hex").slice(0, 8);

  next[id] = {
    id, url: `/art/anims/${id}.png?v=${v}`, frameW, frameH,
    feetY: Math.round(((feet - top) / frameH) * 1000) / 1000,
    facing: "right", scale: subject.scale,
    clips: Object.fromEntries(CLIPS.map((clip, row) => [clip, { row, frames: clips[clip].length, fps: subject.clips[clip].fps }])) as AnimSheet["clips"],
  };
  console.log(`${id}: ${frameW}×${frameH}, ${CLIPS.map((c) => `${c} ${clips[c].length}`).join(" · ")}, ${(png.length / 1024).toFixed(0)} KB`);
}

const order = [...BOSS_SHEET_IDS, ...T5_SHEET_IDS, ...Object.keys(next).filter((k) => !(BOSS_SHEET_IDS as readonly string[]).includes(k) && !(T5_SHEET_IDS as readonly string[]).includes(k))];
const body = Object.fromEntries(order.filter((k) => next[k]).map((k) => [k, next[k]]));
const text = `// Generated by scripts/build-anim-sheets.ts — do not edit by hand.\nimport type { AnimSheet } from "./anim-sheets";\n\nexport const ANIM_SHEET_DATA: Record<string, AnimSheet> = ${JSON.stringify(body, null, 2)};\n`;
if (!existsSync(DATA_FILE) || readFileSync(DATA_FILE, "utf8") !== text) writeFileSync(DATA_FILE, text);
console.log(`wrote ${DATA_FILE}`);
