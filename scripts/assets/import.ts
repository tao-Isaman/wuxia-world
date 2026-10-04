/**
 * Curate and import the generated asset library (docs/assets.md).
 *
 *   bun scripts/assets/import.ts --raw <raw dir> [--review] [--only <category,…>]
 *
 * For every plan job (scripts/assets/plan/*.json) with raw output in
 * <raw>/out/<category>/<job id>[__rN]/, the candidates are filtered
 * automatically (empty or almost-empty alpha, background left in, cut off at
 * the frame edge, near-duplicates by a small perceptual hash) and by hand
 * (scripts/assets/curation/rejects.json: { "<job id>/<file>": "reason" }), then
 * the job's `keep` most clearly different ones are picked.
 *
 * --review   writes contact sheets of the picks to <raw>/review/ (with a .tsv
 *            mapping each cell to its candidate) and touches nothing else.
 * default    trims and palette-quantizes the picks into
 *            public/assets/<category>/<group>/<id>.png, computes anchors,
 *            footprints and map sizes, and writes public/assets/manifest.json
 *            (sorted by category, then id). Rejected and unpicked candidates
 *            are not imported. Logs counts to <raw>/import-report.json.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import type { AssetDirection, AssetEntry, AssetManifest, Footprint } from "@/lib/assets/types";
import { contactSheet } from "./contact-sheet";
import type { PlanJob } from "./build-asset-plan";

const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const RAW = opt("--raw") ?? process.env.ASSET_RAW_DIR;
if (!RAW) throw new Error("usage: import.ts --raw <raw dir> [--review] [--only cat,…]");
const REVIEW = args.includes("--review");
const ONLY = opt("--only")?.split(",");
const PLAN_DIR = "scripts/assets/plan";
const REJECTS_FILE = "scripts/assets/curation/rejects.json";
const PUBLIC = "public/assets";

const rejects: Record<string, string> = existsSync(REJECTS_FILE) ? JSON.parse(readFileSync(REJECTS_FILE, "utf8")) : {};

const DIR_FILES: [AssetDirection, string][] = [
  ["S", "south"], ["SE", "south-east"], ["E", "east"], ["NE", "north-east"],
  ["N", "north"], ["NW", "north-west"], ["W", "west"], ["SW", "south-west"],
];
const TOOL: Record<string, string> = {
  v2: "pixellab generate-image-v2", pixen: "pixellab create-image-pixen", char3: "pixellab create-character-v3", tileset: "pixellab create-tileset",
};

interface Candidate {
  key: string;           // "<job id>[__rN]/<file>"
  path: string;
  meta: { seed?: number; jobId?: string; characterId?: string; tilesetId?: string; prompt?: string };
  width: number; height: number;
  coverage: number;      // opaque fraction
  edge: number;          // opaque fraction of the border ring
  bbox: { x: number; y: number; w: number; h: number } | null;
  hash: bigint; shape: bigint;
  problem?: string;
}

function popcount(x: bigint): number { let n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; }
function distance(a: Candidate, b: Candidate): number { return popcount(a.hash ^ b.hash) + popcount(a.shape ^ b.shape); }

async function analyse(path: string, key: string, meta: Candidate["meta"]): Promise<Candidate> {
  const img = sharp(path).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let opaque = 0, ring = 0, ringOpaque = 0, minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = data[(y * width + x) * 4 + 3];
    const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
    if (border) ring++;
    if (a > 24) {
      opaque++;
      if (border) ringOpaque++;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  // dHash of the luminance over grey + an 8×8 alpha mask.
  const lum = await sharp(path).flatten({ background: "#808080" }).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) hash = (hash << 1n) | (lum[y * 9 + x] > lum[y * 9 + x + 1] ? 1n : 0n);
  const alpha = await sharp(path).ensureAlpha().extractChannel(3).resize(8, 8, { fit: "fill" }).raw().toBuffer();
  let shape = 0n;
  for (let i = 0; i < 64; i++) shape = (shape << 1n) | (alpha[i] > 100 ? 1n : 0n);
  const coverage = opaque / (width * height);
  const edge = ringOpaque / ring;
  const c: Candidate = { key, path, meta, width, height, coverage, edge, hash, shape, bbox: maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null };
  return c;
}

function autoProblem(job: PlanJob, c: Candidate): string | undefined {
  if (job.method === "tileset") return undefined;
  if (c.coverage < (job.category === "icon" ? 0.08 : 0.04)) return "empty or almost-empty alpha";
  if (c.coverage > (job.kind === "flat" ? 0.97 : 0.9)) return "background not removed";
  if (job.method !== "char3" && c.edge > 0.12) return "cut off at the frame edge";
  return undefined;
}

/** The job's candidates across attempts (<id>/, <id>__r1/, …). */
function attemptDirs(job: PlanJob): string[] {
  const base = join(RAW!, "out", job.category);
  if (!existsSync(base)) return [];
  return readdirSync(base).filter((d) => (d === job.id || d.startsWith(`${job.id}__r`)) && existsSync(join(base, d, "job.json"))).sort().map((d) => join(base, d));
}

interface Pick { job: PlanJob; picks: Candidate[]; rejected: { key: string; reason: string }[]; available: number }

/**
 * Stitch a 64-image result (8 × 8 tiles) back into one sheet and return each
 * drawn object (an 8-connected opaque blob, small blobs merged into a
 * neighbour within 2 px) as its own image in <raw>/split/<job>/.
 */
async function splitSheet(dir: string, files: string[], job: PlanJob): Promise<{ file: string; name: string }[]> {
  const tile = (await sharp(join(dir, files[0])).metadata()).width!;
  const W = tile * 8, H = tile * 8;
  const sheet = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(files.map((f, i) => ({ input: join(dir, f), left: (i % 8) * tile, top: Math.floor(i / 8) * tile }))).raw().toBuffer();
  const label = new Int32Array(W * H).fill(-1);
  const boxes: { x0: number; y0: number; x1: number; y1: number; n: number; px: number[] }[] = [];
  for (let start = 0; start < W * H; start++) {
    if (label[start] >= 0 || sheet[start * 4 + 3] <= 24) continue;
    const id = boxes.length, box = { x0: W, y0: H, x1: -1, y1: -1, n: 0, px: [] as number[] };
    const stack = [start]; label[start] = id;
    while (stack.length) {
      const p = stack.pop()!, x = p % W, y = (p - x) / W;
      box.n++; box.px.push(p);
      if (x < box.x0) box.x0 = x; if (x > box.x1) box.x1 = x; if (y < box.y0) box.y0 = y; if (y > box.y1) box.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (label[q] < 0 && sheet[q * 4 + 3] > 24) { label[q] = id; stack.push(q); }
      }
    }
    boxes.push(box);
  }
  // Merge small blobs into the nearest big one within 2 px.
  const big = boxes.filter((b) => b.n >= 60);
  for (const b of boxes.filter((b) => b.n < 60)) {
    const host = big.find((h) => b.x0 >= h.x0 - 2 && b.x1 <= h.x1 + 2 && b.y0 >= h.y0 - 2 && b.y1 <= h.y1 + 2)
      ?? big.find((h) => b.x1 >= h.x0 - 2 && b.x0 <= h.x1 + 2 && b.y1 >= h.y0 - 2 && b.y0 <= h.y1 + 2);
    if (host) { host.px.push(...b.px); host.n += b.n; host.x0 = Math.min(host.x0, b.x0); host.y0 = Math.min(host.y0, b.y0); host.x1 = Math.max(host.x1, b.x1); host.y1 = Math.max(host.y1, b.y1); }
  }
  const outDir = join(RAW!, "split", job.category, dir.split("/").pop()!);
  mkdirSync(outDir, { recursive: true });
  const out: { file: string; name: string }[] = [];
  big.sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0));
  for (const [i, b] of big.entries()) {
    if (b.x0 === 0 || b.y0 === 0 || b.x1 === W - 1 || b.y1 === H - 1) continue; // cut by the sheet edge
    const w = b.x1 - b.x0 + 3, h = b.y1 - b.y0 + 3;
    if (w > tile * 2 || h > tile * 2) continue; // several objects fused
    const buf = Buffer.alloc(w * h * 4);
    for (const p of b.px) {
      const x = p % W, y = (p - x) / W, o = ((y - b.y0 + 1) * w + (x - b.x0 + 1)) * 4;
      sheet.copy(buf, o, p * 4, p * 4 + 4);
    }
    const name = `s${String(i).padStart(2, "0")}.png`;
    const file = join(outDir, name);
    if (!existsSync(file)) await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
    out.push({ file, name });
  }
  return out;
}

async function curateImages(job: PlanJob): Promise<Pick> {
  const rejected: Pick["rejected"] = [];
  const pool: Candidate[] = [];
  for (const dir of attemptDirs(job)) {
    const meta = JSON.parse(readFileSync(join(dir, "job.json"), "utf8"));
    const attempt = dir.split("/").pop()!;
    const files = readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort();
    // Small-size calls (64 images) come back cut on a 40 px grid that does not
    // match the drawn grid: stitch them back and cut out each drawn object.
    const sources = files.length === 64 ? await splitSheet(dir, files, job) : files.map((f) => ({ file: join(dir, f), name: f }));
    for (const { file, name } of sources) {
      const key = `${attempt}/${name}`;
      const c = await analyse(file, key, meta);
      const reason = rejects[key] ?? autoProblem(job, c);
      if (reason) { rejected.push({ key, reason }); continue; }
      pool.push(c);
    }
  }
  const available = pool.length;
  // Near-duplicates (same design twice) go first.
  const unique: Candidate[] = [];
  for (const c of pool) {
    const twin = unique.find((u) => distance(u, c) <= 5);
    if (twin) rejected.push({ key: c.key, reason: `near-duplicate of ${twin.key}` }); else unique.push(c);
  }
  if (!unique.length) return { job, picks: [], rejected, available };
  // Start from the most typical design (the medoid), then add the most different one each time.
  const medoid = unique.reduce((best, c) => {
    const sum = unique.reduce((s, o) => s + distance(c, o), 0);
    return sum < best.sum ? { c, sum } : best;
  }, { c: unique[0], sum: Infinity }).c;
  const picks = [medoid];
  while (picks.length < job.keep) {
    let best: Candidate | null = null, bestD = -1;
    for (const c of unique) {
      if (picks.includes(c)) continue;
      const d = Math.min(...picks.map((p) => distance(p, c)));
      if (d > bestD) { best = c; bestD = d; }
    }
    if (!best || bestD < 9) break; // what is left is too close to a pick: not clearly different
    picks.push(best);
  }
  for (const c of unique) if (!picks.includes(c)) rejected.push({ key: c.key, reason: "not picked (similar to a kept design or over the keep count)" });
  return { job, picks, rejected, available };
}

async function curateActor(job: PlanJob): Promise<Pick> {
  const rejected: Pick["rejected"] = [];
  for (const dir of attemptDirs(job).reverse()) { // newest attempt first
    const attempt = dir.split("/").pop()!;
    const meta = JSON.parse(readFileSync(join(dir, "job.json"), "utf8"));
    const key = `${attempt}/south.png`;
    if (!DIR_FILES.every(([, f]) => existsSync(join(dir, `${f}.png`)))) { rejected.push({ key, reason: "missing directions" }); continue; }
    if (rejects[key]) { rejected.push({ key, reason: rejects[key] }); continue; }
    const c = await analyse(join(dir, "south.png"), key, meta);
    const problem = autoProblem(job, c);
    if (problem) { rejected.push({ key, reason: problem }); continue; }
    return { job, picks: [c], rejected, available: 1 };
  }
  return { job, picks: [], rejected, available: 0 };
}

async function curateTiles(job: PlanJob): Promise<Pick> {
  const rejected: Pick["rejected"] = [];
  const picks: Candidate[] = [];
  const dir = attemptDirs(job).pop();
  if (!dir) return { job, picks, rejected, available: 0 };
  const attempt = dir.split("/").pop()!;
  const meta = JSON.parse(readFileSync(join(dir, "job.json"), "utf8"));
  for (const file of readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort()) {
    const key = `${attempt}/${file}`;
    if (rejects[key] || rejects[`${attempt}/*`]) { rejected.push({ key, reason: rejects[key] ?? rejects[`${attempt}/*`] }); continue; }
    picks.push(await analyse(join(dir, file), key, meta));
  }
  return { job, picks, rejected, available: picks.length };
}

// ─── import helpers ───
const round = (n: number) => Math.round(n * 10) / 10;

async function trimAndSave(src: string, box: { x: number; y: number; w: number; h: number }, out: string, colors: number): Promise<{ width: number; height: number; data: Buffer }> {
  const pad = 1;
  const meta = await sharp(src).metadata();
  const left = Math.max(0, box.x - pad), top = Math.max(0, box.y - pad);
  const width = Math.min(meta.width! - left, box.w + pad * 2), height = Math.min(meta.height! - top, box.h + pad * 2);
  const buffer = await sharp(src).ensureAlpha().extract({ left, top, width, height }).png({ palette: true, colors, dither: 0, effort: 10, compressionLevel: 9 }).toBuffer();
  mkdirSync(out.slice(0, out.lastIndexOf("/")), { recursive: true });
  writeFileSync(out, buffer);
  return { width, height, data: buffer };
}

/** Base centre of the opaque pixels: x = mean of the lowest 12 % rows' opaque columns, y = lowest opaque row + 1. */
async function anchorOf(png: Buffer): Promise<{ x: number; y: number }> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let bottom = -1;
  for (let y = info.height - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 24) { bottom = y; break; }
  if (bottom < 0) return { x: info.width / 2, y: info.height };
  const band = Math.max(1, Math.round(info.height * 0.12));
  let sum = 0, n = 0;
  for (let y = Math.max(0, bottom - band); y <= bottom; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 24) { sum += x; n++; }
  return { x: round(n ? sum / n + 0.5 : info.width / 2), y: bottom + 1 };
}

function footprintFor(kind: PlanJob["kind"], w: number, h: number): Footprint | null {
  const box = (fw: number, fh: number): Footprint => ({ x: round(-fw / 2), y: round(-fh), w: round(fw), h: round(fh) });
  switch (kind) {
    case "building": return box(w * 0.8, h * 0.3);
    case "solid": return box(w * 0.7, Math.min(h * 0.35, w * 0.5));
    case "tall": return box(w * 0.5, Math.min(h * 0.2, w * 0.4));
    case "tree": return box(Math.max(6, w * 0.18), Math.max(4, h * 0.08));
    default: return null;
  }
}
/**
 * Keep a footprint inside the drawn image. Footprints are in map units relative
 * to the anchor (top-left corner at anchor + (x, y)); the image spans
 * [-anchorX, width − anchorX] × [-anchorY, height − anchorY] px times `scale`.
 */
function clampFootprint(fp: Footprint | null, anchor: { x: number; y: number }, width: number, height: number, scale: number): Footprint | null {
  if (!fp) return null;
  const left = -anchor.x * scale, right = (width - anchor.x) * scale, top = -anchor.y * scale, bottom = (height - anchor.y) * scale;
  const x0 = Math.max(fp.x, left), x1 = Math.min(fp.x + fp.w, right), y0 = Math.max(fp.y, top), y1 = Math.min(fp.y + fp.h, bottom);
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  const f = (n: number, dir: "up" | "down") => dir === "up" ? Math.ceil(n * 10) / 10 : Math.floor(n * 10) / 10;
  const x = f(x0, "up"), y = f(y0, "up");
  return { x, y, w: f(x1 - x, "down"), h: f(y1 - y, "down") };
}

function layerFor(kind: PlanJob["kind"]): AssetEntry["layer"] {
  return kind === "flat" || kind === "tile" ? "ground" : kind === "overhead" || kind === "fx" || kind === "ui" ? "overhead" : "object";
}
const COLORS: Record<string, number> = { building: 96, sect: 80, character: 64, monster: 64, tile: 48, icon: 48, fx: 64, ui: 64, prop: 64, nature: 64 };

async function importPick(p: Pick): Promise<AssetEntry[]> {
  const { job } = p;
  const entries: AssetEntry[] = [];
  const folder = join(PUBLIC, job.category, job.group);
  const url = (file: string) => `/assets/${job.category}/${job.group}/${file}`;
  const source = (c: Candidate): AssetEntry["source"] => ({
    tool: TOOL[job.method], prompt: job.method === "tileset" ? `${job.lower} | ${job.upper} | ${job.transition ?? ""}` : c.meta.prompt ?? job.prompt,
    ...(c.meta.seed !== undefined ? { seed: c.meta.seed } : {}),
    ...(c.meta.jobId || c.meta.characterId || c.meta.tilesetId ? { jobId: c.meta.characterId ?? c.meta.tilesetId ?? c.meta.jobId } : {}),
    size: job.size.w,
  });
  const numbered = job.keep > 1;
  for (const [i, c] of p.picks.entries()) {
    const id = numbered ? `${job.id}_${String(i + 1).padStart(2, "0")}` : job.id;
    const name = numbered ? `${job.name} แบบ ${i + 1}` : job.name;
    const base: Omit<AssetEntry, "image" | "width" | "height" | "mapWidth" | "mapHeight" | "anchorX" | "anchorY" | "footprint"> = {
      id, name, category: job.category as AssetEntry["category"], subcategory: job.subcategory, region: job.region as AssetEntry["region"],
      ...(job.sect ? { sect: job.sect } : {}), tags: [...new Set(job.tags)], layer: layerFor(job.kind),
      flippable: job.kind !== "tile" && job.kind !== "actor", source: source(c), status: "approved",
      ...(numbered ? { variantOf: job.id } : {}),
    };
    if (job.method === "char3") {
      // One shared crop for all eight views so their anchors line up.
      const dir = c.path.slice(0, c.path.lastIndexOf("/"));
      let box: Candidate["bbox"] = null;
      const views: Partial<Record<AssetDirection, string>> = {};
      for (const [, f] of DIR_FILES) {
        const b = (await analyse(join(dir, `${f}.png`), f, {})).bbox;
        if (!b) continue;
        box = box ? { x: Math.min(box.x, b.x), y: Math.min(box.y, b.y), w: Math.max(box.x + box.w, b.x + b.w) - Math.min(box.x, b.x), h: Math.max(box.y + box.h, b.y + b.h) - Math.min(box.y, b.y) } : b;
      }
      if (!box) continue;
      let size = { width: 0, height: 0 }, south: Buffer | null = null;
      for (const [d, f] of DIR_FILES) {
        const file = d === "S" ? `${id}.png` : `${id}_${d.toLowerCase()}.png`;
        const saved = await trimAndSave(join(dir, `${f}.png`), box, join(folder, file), COLORS[job.category]);
        views[d] = url(file);
        if (d === "S") { size = saved; south = saved.data; }
      }
      const anchor = await anchorOf(south!);
      const tall = job.category === "character" ? 48 : job.mapWidth;
      const mapHeight = round(tall * size.height / Math.max(1, anchor.y));
      entries.push({ ...base, image: views.S!, width: size.width, height: size.height, mapWidth: round(mapHeight * size.width / size.height), mapHeight,
        anchorX: anchor.x, anchorY: anchor.y, footprint: null, views });
      continue;
    }
    if (job.method === "tileset") {
      const tiles = JSON.parse(readFileSync(join(c.path.slice(0, c.path.lastIndexOf("/")), "tiles.json"), "utf8")) as { corners?: Record<string, string> }[];
      const index = Number(c.key.split("/").pop()!.replace(".png", ""));
      const corners = tiles[index]?.corners as Record<"NW" | "NE" | "SW" | "SE", "lower" | "upper"> | undefined;
      const file = `${id}.png`;
      const buffer = await sharp(c.path).png({ palette: true, colors: COLORS.tile, dither: 0, effort: 10, compressionLevel: 9 }).toBuffer();
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, file), buffer);
      const cornerTag = corners ? `wang:${corners.NW[0]}${corners.NE[0]}${corners.SW[0]}${corners.SE[0]}` : "wang:?";
      entries.push({ ...base, tags: [...base.tags, cornerTag], image: url(file), width: c.width, height: c.height, mapWidth: 32, mapHeight: 32,
        anchorX: c.width / 2, anchorY: c.height, footprint: null, ...(corners ? { tile: { set: job.id, corners } } : {}) });
      continue;
    }
    if (!c.bbox) continue;
    const file = `${id}.png`;
    const saved = await trimAndSave(c.path, c.bbox, join(folder, file), COLORS[job.category] ?? 64);
    const anchor = ["icon", "fx", "ui"].includes(job.category) ? { x: saved.width / 2, y: saved.height / 2 } : await anchorOf(saved.data);
    const mapWidth = job.mapWidth, mapHeight = round(mapWidth * saved.height / saved.width);
    entries.push({ ...base, image: url(file), width: saved.width, height: saved.height, mapWidth, mapHeight, anchorX: anchor.x, anchorY: anchor.y,
      footprint: clampFootprint(footprintFor(job.kind, mapWidth, mapHeight), anchor, saved.width, saved.height, mapWidth / saved.width) });
  }
  return entries;
}

// ─── main ───
const plan: PlanJob[] = readdirSync(PLAN_DIR).filter((f) => f.endsWith(".json")).sort()
  .flatMap((f) => (JSON.parse(readFileSync(join(PLAN_DIR, f), "utf8")) as { jobs: PlanJob[] }).jobs)
  .filter((j) => !ONLY || ONLY.includes(j.category));

const results: Pick[] = [];
for (const job of plan) {
  if (!attemptDirs(job).length) continue;
  results.push(job.method === "char3" ? await curateActor(job) : job.method === "tileset" ? await curateTiles(job) : await curateImages(job));
}

const report: Record<string, { jobs: number; picked: number; wanted: number; rejected: Record<string, number> }> = {};
for (const r of results) {
  const row = report[r.job.category] ??= { jobs: 0, picked: 0, wanted: 0, rejected: {} };
  row.jobs++; row.picked += r.picks.length; row.wanted += r.job.keep;
  for (const x of r.rejected) { const k = x.reason.startsWith("near-duplicate") ? "near-duplicate" : x.reason; row.rejected[k] = (row.rejected[k] ?? 0) + 1; }
}

if (REVIEW) {
  const outDir = join(RAW, "review");
  mkdirSync(outDir, { recursive: true });
  const byCategory = new Map<string, { path: string; label: string; key: string }[]>();
  for (const r of results) for (const c of r.picks) {
    const list = byCategory.get(r.job.category) ?? [];
    list.push({ path: c.path, label: "", key: `${r.job.id}|${c.key}` });
    byCategory.set(r.job.category, list);
  }
  for (const [category, list] of byCategory) {
    const per = 120;
    for (let s = 0; s * per < list.length; s++) {
      const chunk = list.slice(s * per, (s + 1) * per).map((item, i) => ({ ...item, label: String(i) }));
      const name = `${category}-${String(s).padStart(2, "0")}`;
      const cell = category === "building" ? 128 : category === "tile" || category === "icon" ? 64 : 96;
      await contactSheet(join(outDir, `${name}.png`), chunk, cell, category === "building" ? 10 : 12);
      writeFileSync(join(outDir, `${name}.tsv`), chunk.map((c) => `${c.label}\t${c.key}`).join("\n") + "\n");
    }
  }
  const short = results.filter((r) => r.picks.length < r.job.keep).map((r) => ({ job: r.job.id, category: r.job.category, picked: r.picks.length, keep: r.job.keep }));
  writeFileSync(join(RAW, "review-report.json"), JSON.stringify({ report, short, rejected: results.flatMap((r) => r.rejected.map((x) => ({ job: r.job.id, ...x }))) }, null, 1));
  console.log(JSON.stringify(report, null, 1));
  process.exit(0);
}

for (const category of new Set(results.map((r) => r.job.category))) rmSync(join(PUBLIC, category), { recursive: true, force: true });
const entries: AssetEntry[] = [];
for (const r of results) entries.push(...await importPick(r));
const manifestPath = join(PUBLIC, "manifest.json");
const previous: AssetManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { version: 1, generatedAt: "", assets: [] };
const touched = new Set(results.map((r) => r.job.category));
const assets = [...previous.assets.filter((a) => !touched.has(a.category)), ...entries]
  .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
const manifest: AssetManifest = { version: 1, generatedAt: new Date().toISOString(), assets };
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + "\n");
writeFileSync(join(RAW, "import-report.json"), JSON.stringify({ report, rejected: results.flatMap((r) => r.rejected.map((x) => ({ job: r.job.id, ...x }))) }, null, 1));
const counts: Record<string, number> = {};
for (const a of assets) counts[a.category] = (counts[a.category] ?? 0) + 1;
console.log(JSON.stringify({ assets: assets.length, counts, report }, null, 1));
