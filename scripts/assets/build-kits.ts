/**
 * The modular kits (docs/assets.md#kits): roads, city walls, house walls and
 * fences whose pieces join on a grid (category "kit", AssetEntry.kit,
 * lib/assets/kits.ts).
 *
 *   bun scripts/assets/build-kits.ts plan                 # writes scripts/assets/kits/plan.json
 *   PIXELLAB_API_TOKEN=... python3 scripts/assets/generate.py run <raw> scripts/assets/kits/plan.json
 *   bun scripts/assets/build-kits.ts build --raw <raw>    # pieces → public/assets/kit/, manifest entries
 *
 * Roads are PixelLab road sets (create-tiles-pro, feature "roads": 18 tiles
 * with N/E/S/W join masks) painted over plain grass; the grass is keyed out so
 * a road lies on any painting, and the 1 px frame each tile comes with is
 * cropped. Walls and fences are assembled here, piece by piece, from PixelLab
 * texture tiles (one numbered create-tiles-pro set): a top drawn `height`
 * above the wall's ground band, a face under every edge that faces the viewer,
 * parapets or a tiled coping, so every mask (and the gates) shares
 * one look and joins without seams. `build` replaces every "kit" entry in the
 * manifest and leaves the rest alone (import.ts never touches "kit").
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import type { AssetEntry, AssetManifest, AssetRegion, Footprint, KitInfo } from "@/lib/assets/types";
import { KIT_E, KIT_N, KIT_S, KIT_W, maskName } from "@/lib/assets/kits";
import { renderIso, type IsoLook } from "./kits-iso";

const PLAN = "scripts/assets/kits/plan.json";
const PUBLIC = "public/assets";
const OUT = join(PUBLIC, "kit");
const REGION_TH: Record<AssetRegion, string> = { heartland: "ภาคกลาง", east: "ตะวันออก", south: "ใต้", north: "เหนือ", west: "ตะวันตก", any: "ทุกภาค" };

// ── Specs ──────────────────────────────────────────────────────────────────

interface RoadSpec { style: string; region: AssetRegion; name: string; prompt: string; tags: string[] }
/** Map units per road cell: a 30 px tile (after the frame is cropped) drawn 48 wide. */
const ROAD_CELL = 48;
const ROADS: RoadSpec[] = [
  { style: "dirt", region: "any", name: "ถนนดิน", prompt: "green grass meadow with a packed brown dirt road, ancient Chinese countryside", tags: ["ดิน", "dirt", "ชนบท"] },
  { style: "cobble", region: "heartland", name: "ถนนหินกรวด", prompt: "plain flat green grass meadow with a grey cobblestone road, ancient Chinese town", tags: ["หินกรวด", "cobblestone", "เมือง"] },
  { style: "flagstone", region: "heartland", name: "ถนนปูแผ่นหิน", prompt: "plain flat green grass meadow with a narrow road of square grey stone slabs", tags: ["แผ่นหิน", "flagstone", "เมือง"] },
  { style: "brick", region: "heartland", name: "ถนนปูอิฐ", prompt: "plain flat green grass meadow with a narrow road paved with small grey bricks", tags: ["อิฐ", "brick", "วัง"] },
  { style: "bluestone", region: "east", name: "ถนนหินเขียวเจียงหนาน", prompt: "plain flat green grass meadow with a road of worn blue-grey bluestone slabs, Jiangnan water town", tags: ["หินเขียว", "bluestone", "เจียงหนาน"] },
  { style: "redclay", region: "south", name: "ทางดินแดง", prompt: "plain flat green grass meadow with a red laterite clay dirt path, southern jungle village", tags: ["ดินแดง", "laterite", "ป่า"] },
  { style: "boardwalk", region: "south", name: "ทางเดินไม้กระดาน", prompt: "plain flat green grass meadow with a wooden plank boardwalk path", tags: ["ไม้กระดาน", "boardwalk", "หมู่บ้านริมน้ำ"] },
  { style: "gravel", region: "any", name: "ทางกรวดภูเขา", prompt: "plain flat green grass meadow with a light grey gravel and pebble mountain path", tags: ["กรวด", "gravel", "ภูเขา"] },
  { style: "steps", region: "any", name: "ทางแผ่นหินวัด", prompt: "plain flat green grass meadow with a narrow path of round grey stepping stones", tags: ["แผ่นหิน", "stepping stones", "วัด", "สำนัก"] },
  { style: "sand", region: "west", name: "ทางทรายทะเลทราย", prompt: "plain flat green grass meadow with a pale yellow desert sand track", tags: ["ทราย", "sand", "ทะเลทราย"] },
  { style: "loess", region: "north", name: "ถนนดินเหลืองรอยล้อ", prompt: "plain flat green grass meadow with a yellow loess earth cart road with wheel ruts", tags: ["ดินเหลือง", "loess", "เกวียน"] },
  { style: "snow", region: "north", name: "ทางหิมะ", prompt: "plain flat green grass meadow with a packed white snow trail", tags: ["หิมะ", "snow", "หนาว"] },
];

/** The texture set: one numbered create-tiles-pro job; tile i is texture i. */
const TEXTURES = [
  "grey brick city wall face, ancient Chinese", "grey stone paving of a wall walk", "dark grey clay roof tiles rows",
  "white lime plaster wall with faint stains", "yellow rammed earth wall layers", "red sandstone blocks wall",
  "tan adobe mud brick wall", "vermilion red palace wall plaster", "yellow glazed roof tiles rows",
  "weathered wooden planks fence, vertical boards", "bamboo poles fence, vertical", "rough grey fieldstone wall",
  "green glazed roof tiles rows", "dark brick wall with moss", "sand-coloured flagstone paving", "light grey granite blocks",
];
const T = Object.fromEntries(["greyBrick", "walkway", "darkTiles", "plaster", "rammed", "sandstone", "adobe", "redPlaster",
  "yellowTiles", "planks", "bamboo", "fieldstone", "greenTiles", "mossBrick", "sandPaving", "granite"].map((k, i) => [k, i])) as Record<string, number>;

type WallKind = "city" | "house" | "fence";
interface WallSpec {
  style: string; region: AssetRegion; kind: WallKind; name: string; tags: string[];
  face: number; top: number;
  /** House walls: a tiled coping (roof texture) instead of a flat top. */
  coping?: boolean;
  gate?: "door" | "moon" | "arch";
}
const WALLS: WallSpec[] = [
  { style: "city_greybrick", region: "heartland", kind: "city", name: "กำแพงเมืองอิฐเทา", tags: ["กำแพงเมือง", "อิฐ", "city wall"], face: T.greyBrick, top: T.walkway, gate: "arch" },
  { style: "city_granite", region: "east", kind: "city", name: "กำแพงเมืองหินแกรนิต", tags: ["กำแพงเมือง", "หินแกรนิต", "city wall"], face: T.granite, top: T.walkway, gate: "arch" },
  { style: "city_sandstone", region: "south", kind: "city", name: "กำแพงเมืองหินทรายแดง", tags: ["กำแพงเมือง", "หินทราย", "city wall"], face: T.sandstone, top: T.sandPaving, gate: "arch" },
  { style: "city_rammed", region: "north", kind: "city", name: "กำแพงเมืองดินอัด", tags: ["กำแพงเมือง", "ดินอัด", "ด่าน", "city wall"], face: T.rammed, top: T.rammed, gate: "arch" },
  { style: "city_adobe", region: "west", kind: "city", name: "กำแพงเมืองอิฐดิน", tags: ["กำแพงเมือง", "อิฐดิน", "ทะเลทราย", "city wall"], face: T.adobe, top: T.sandPaving, gate: "arch" },
  { style: "city_fieldstone", region: "any", kind: "city", name: "กำแพงป้อมหินภูเขา", tags: ["กำแพง", "ป้อม", "หิน", "สำนัก", "fort wall"], face: T.fieldstone, top: T.walkway, gate: "arch" },
  { style: "house_whiteink", region: "east", kind: "house", name: "กำแพงบ้านขาวหลังคาดำ", tags: ["กำแพงบ้าน", "ปูนขาว", "เจียงหนาน", "courtyard wall"], face: T.plaster, top: T.darkTiles, coping: true, gate: "moon" },
  { style: "house_greybrick", region: "heartland", kind: "house", name: "กำแพงบ้านอิฐเทา", tags: ["กำแพงบ้าน", "อิฐ", "สี่เรือนล้อม", "courtyard wall"], face: T.greyBrick, top: T.darkTiles, coping: true, gate: "door" },
  { style: "house_palace", region: "heartland", kind: "house", name: "กำแพงวังแดงหลังคาทอง", tags: ["กำแพงวัง", "วัง", "palace wall"], face: T.redPlaster, top: T.yellowTiles, coping: true, gate: "door" },
  { style: "house_temple", region: "any", kind: "house", name: "กำแพงวัดหลังคาเขียว", tags: ["กำแพงวัด", "วัด", "สำนัก", "temple wall"], face: T.plaster, top: T.greenTiles, coping: true, gate: "moon" },
  { style: "house_mossbrick", region: "south", kind: "house", name: "กำแพงอิฐตะไคร่", tags: ["กำแพงบ้าน", "อิฐ", "ตะไคร่", "courtyard wall"], face: T.mossBrick, top: T.darkTiles, coping: true, gate: "door" },
  { style: "house_rammed", region: "north", kind: "house", name: "กำแพงบ้านดินอัด", tags: ["กำแพงบ้าน", "ดินอัด", "courtyard wall"], face: T.rammed, top: T.rammed, gate: "door" },
  { style: "house_adobe", region: "west", kind: "house", name: "กำแพงบ้านดินเหนียว", tags: ["กำแพงบ้าน", "ดินเหนียว", "ทะเลทราย", "courtyard wall"], face: T.adobe, top: T.adobe, gate: "door" },
  { style: "house_fieldstone", region: "any", kind: "house", name: "กำแพงหินกอง", tags: ["กำแพง", "หินกอง", "หมู่บ้าน", "stone wall"], face: T.fieldstone, top: T.fieldstone, gate: "door" },
  { style: "fence_planks", region: "any", kind: "fence", name: "รั้วไม้กระดาน", tags: ["รั้ว", "ไม้", "fence"], face: T.planks, top: T.planks, gate: "door" },
  { style: "fence_bamboo", region: "south", kind: "fence", name: "รั้วไม้ไผ่", tags: ["รั้ว", "ไผ่", "fence"], face: T.bamboo, top: T.bamboo, gate: "door" },
];
/** Cell, wall thickness (ground), face height and the headroom above the top, in map units = px. */
const WALL_DIM: Record<WallKind, { cell: number; thick: number; height: number; head: number }> = {
  city: { cell: 32, thick: 24, height: 56, head: 6 },
  house: { cell: 32, thick: 10, height: 40, head: 4 },
  fence: { cell: 32, thick: 6, height: 26, head: 2 },
};

/**
 * Isometric sets (`grid: "iso"`), drawn by kits-iso.ts so they lean the way
 * of the library's buildings. Roads and plazas sample a library ground tile
 * (seamless 32 px Wang fills); walls reuse WALLS with the texture set.
 */
interface IsoRoadSpec { style: string; region: AssetRegion; name: string; tile: string; tags: string[]; plaza?: boolean }
const ISO_ROAD_CELL = 64;
const ISO_WALL_CELL = 64;
const ISO_ROADS: IsoRoadSpec[] = [
  { style: "slab", region: "heartland", name: "ถนนแผ่นหิน", tile: "til_heartland_grass_paving_07", tags: ["แผ่นหิน", "flagstone", "เมือง"] },
  { style: "brick", region: "heartland", name: "ถนนปูอิฐ", tile: "til_heartland_brick_dirt_13", tags: ["อิฐ", "brick", "วัง"] },
  { style: "dirt", region: "any", name: "ถนนดิน", tile: "til_heartland_brick_dirt_07", tags: ["ดิน", "dirt", "ชนบท"] },
  { style: "cobble", region: "any", name: "ถนนหินกรวด", tile: "til_east_pebble_lawn_13", tags: ["หินกรวด", "cobblestone"] },
  { style: "bluestone", region: "east", name: "ถนนหินเขียวเจียงหนาน", tile: "til_east_bluestone_moss_07", tags: ["หินเขียว", "bluestone", "เจียงหนาน"] },
  { style: "clay", region: "south", name: "ทางดินแดง", tile: "til_south_clay_path_07", tags: ["ดินแดง", "laterite"] },
  { style: "sand", region: "west", name: "ทางทราย", tile: "til_east_beach_sea_13", tags: ["ทราย", "sand", "ทะเลทราย"] },
  { style: "loess", region: "north", name: "ถนนดินเหลือง", tile: "til_north_steppe_13", tags: ["ดินเหลือง", "loess"] },
  { style: "snow", region: "north", name: "ทางหิมะ", tile: "til_north_snow_dirt_13", tags: ["หิมะ", "snow"] },
  { style: "slab", region: "heartland", name: "ลานปูแผ่นหิน", tile: "til_heartland_grass_paving_07", tags: ["ลาน", "plaza", "แผ่นหิน"], plaza: true },
  { style: "brick", region: "heartland", name: "ลานปูอิฐ", tile: "til_heartland_brick_dirt_13", tags: ["ลาน", "plaza", "อิฐ"], plaza: true },
];
const ISO_WALL: Record<WallKind, { thick: number; height: number; parapet?: number; coping?: number; gateWidth: number; gateSpan: number }> = {
  city: { thick: 0.28, height: 56, parapet: 6, gateWidth: 30, gateSpan: 3 },
  house: { thick: 0.1, height: 40, coping: 7, gateWidth: 22, gateSpan: 1 },
  fence: { thick: 0.06, height: 26, gateWidth: 20, gateSpan: 1 },
};

// ── plan ───────────────────────────────────────────────────────────────────

const cmd = process.argv[2];
const args = process.argv.slice(3);
const opt = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

if (cmd === "plan") {
  const jobs = [
    { id: "kit_textures_01", category: "kit", method: "tilespro", size: { w: 32, h: 32 }, estimate: 20,
      prompt: TEXTURES.map((t, i) => `${i + 1}). ${t}, seamless`).join(" "),
      params: { tile_type: "square_topdown", tile_view: "top-down", tile_size: 32, outline_mode: "segmentation" } },
    ...ROADS.map((r) => ({ id: `kit_road_${r.style}`, category: "kit", method: "tilespro", size: { w: 32, h: 32 }, estimate: 40,
      prompt: r.prompt, params: { tile_feature: "roads", tile_type: "square_topdown", tile_size: 32, tile_view_angle: 90, outline_mode: "outline" } })),
  ];
  mkdirSync("scripts/assets/kits", { recursive: true });
  writeFileSync(PLAN, JSON.stringify({ generatedBy: "scripts/assets/build-kits.ts plan", jobs }, null, 1) + "\n");
  console.log(`${jobs.length} jobs → ${PLAN}`);
  process.exit(0);
}
if (cmd !== "build") throw new Error("usage: build-kits.ts plan | build --raw <raw dir>");
const RAW = opt("--raw") ?? process.env.ASSET_RAW_DIR;
if (!RAW) throw new Error("build needs --raw <raw dir>");
const rawJob = (id: string) => join(RAW, "out", "kit", id);

// ── Pixels ─────────────────────────────────────────────────────────────────

interface Img { w: number; h: number; px: Uint8ClampedArray }
const blank = (w: number, h: number): Img => ({ w, h, px: new Uint8ClampedArray(w * h * 4) });
async function load(path: string): Promise<Img> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, px: new Uint8ClampedArray(data) };
}
async function save(img: Img, path: string) {
  mkdirSync(join(path, ".."), { recursive: true });
  await sharp(Buffer.from(img.px.buffer), { raw: { width: img.w, height: img.h, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(path);
}
const at = (img: Img, x: number, y: number) => (y * img.w + x) * 4;
const alpha = (img: Img, x: number, y: number) => x < 0 || y < 0 || x >= img.w || y >= img.h ? 0 : img.px[at(img, x, y) + 3];
function put(img: Img, x: number, y: number, rgb: ArrayLike<number>, shade = 1) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return;
  const i = at(img, x, y);
  img.px[i] = rgb[0] * shade; img.px[i + 1] = rgb[1] * shade; img.px[i + 2] = rgb[2] * shade; img.px[i + 3] = 255;
}
function shadeAt(img: Img, x: number, y: number, f: number) {
  if (!alpha(img, x, y)) return;
  const i = at(img, x, y);
  img.px[i] *= f; img.px[i + 1] *= f; img.px[i + 2] *= f;
}
/** A texture sampled with wrap-around (texture space is world space mod its size). */
const sample = (tex: Img, x: number, y: number) => {
  const i = at(tex, ((x % tex.w) + tex.w) % tex.w, ((y % tex.h) + tex.h) % tex.h);
  return [tex.px[i], tex.px[i + 1], tex.px[i + 2]];
};

// ── Roads ──────────────────────────────────────────────────────────────────

const PIECE_TH: Record<number, string> = {
  0: "ชิ้นเดี่ยว", [KIT_N]: "ปลายต่อเหนือ", [KIT_E]: "ปลายต่อตะวันออก", [KIT_S]: "ปลายต่อใต้", [KIT_W]: "ปลายต่อตะวันตก",
  [KIT_N | KIT_S]: "ตรงแนวตั้ง", [KIT_E | KIT_W]: "ตรงแนวนอน",
  [KIT_N | KIT_E]: "มุมเหนือ-ตะวันออก", [KIT_E | KIT_S]: "มุมตะวันออก-ใต้", [KIT_S | KIT_W]: "มุมใต้-ตะวันตก", [KIT_W | KIT_N]: "มุมตะวันตก-เหนือ",
  [KIT_N | KIT_E | KIT_S]: "สามแยก (ไม่มีตะวันตก)", [KIT_E | KIT_S | KIT_W]: "สามแยก (ไม่มีเหนือ)",
  [KIT_S | KIT_W | KIT_N]: "สามแยก (ไม่มีตะวันออก)", [KIT_W | KIT_N | KIT_E]: "สามแยก (ไม่มีใต้)", 15: "สี่แยก",
};
const pieceSuffix = (mask: number) => mask ? maskName(mask).toLowerCase() : "o";

const entries: AssetEntry[] = [];
rmSync(OUT, { recursive: true, force: true });

/** Grass: green clearly over red and blue. */
const isGrass = (r: number, g: number, b: number) => g > r + 12 && g > b + 8;

async function buildRoad(spec: RoadSpec) {
  const dir = rawJob(`kit_road_${spec.style}`);
  if (!existsSync(join(dir, "job.json"))) { console.warn(`skip road ${spec.style}: no raw output`); return; }
  const job = JSON.parse(readFileSync(join(dir, "job.json"), "utf8"));
  const rules = JSON.parse(readFileSync(join(dir, "tiles.json"), "utf8")).tile_rules.tiles as Record<string, { mask: number }>;
  // One tile per mask (the first); the stamp-only plaza (tile 17) stands in for the lone mask 0.
  const byMask = new Map<number, number>();
  for (const [name, rule] of Object.entries(rules)) {
    const index = Number(name.split("_")[1]);
    if (rule.mask !== 0 && !byMask.has(rule.mask)) byMask.set(rule.mask, index);
  }
  if (existsSync(join(dir, "17.png"))) byMask.set(0, 17);
  const set = `kit_${spec.region}_road_${spec.style}`;
  for (const [mask, index] of [...byMask].sort((a, b) => a[0] - b[0])) {
    const tile = await load(join(dir, `${String(index).padStart(2, "0")}.png`));
    const size = tile.w - 2;
    const img = blank(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = at(tile, x + 1, y + 1);
      const [r, g, b] = [tile.px[i], tile.px[i + 1], tile.px[i + 2]];
      if (!isGrass(r, g, b)) put(img, x, y, [r, g, b]);
    }
    // Drop what the key left in the grass: keep the road's own shape (the biggest
    // island) and anything near its size, nothing small beside it.
    const seen = new Uint8Array(size * size);
    const islands: number[][] = [];
    for (let start = 0; start < size * size; start++) {
      if (seen[start] || !img.px[start * 4 + 3]) continue;
      const island = [start];
      seen[start] = 1;
      for (let i = 0; i < island.length; i++) {
        const x = island[i] % size, y = Math.floor(island[i] / size);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, j = ny * size + nx;
          if (nx >= 0 && ny >= 0 && nx < size && ny < size && !seen[j] && img.px[j * 4 + 3]) { seen[j] = 1; island.push(j); }
        }
      }
      islands.push(island);
    }
    const biggest = Math.max(0, ...islands.map((i) => i.length));
    for (const island of islands) if (island.length < biggest * 0.3) for (const j of island) img.px[j * 4 + 3] = 0;
    const id = `${set}_${pieceSuffix(mask)}`;
    const url = `/assets/kit/road/${id}.png`;
    await save(img, join("public", url));
    entries.push(entry({
      id, name: `${spec.name} · ${PIECE_TH[mask]}`, subcategory: "road", region: spec.region,
      tags: [...spec.tags, "ถนน", "road", "kit", maskName(mask)], image: url, width: size, height: size,
      mapWidth: ROAD_CELL, mapHeight: ROAD_CELL, anchorX: size / 2, anchorY: size, footprint: null, layer: "ground",
      kit: { set, kind: "road", cell: ROAD_CELL, mask },
      source: { tool: "pixellab create-tiles-pro (roads)", prompt: job.prompt, seed: job.seed, jobId: job.jobId, size: 32 },
    }));
  }
}

// ── Walls ──────────────────────────────────────────────────────────────────

interface Rect { x0: number; y0: number; x1: number; y1: number }
const inRect = (r: Rect, x: number, y: number) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;

/**
 * One wall piece, `cols` cells wide. `bands` are its ground rectangles (cell
 * px, y down, the piece's top-left cell at 0,0); `open` are the sides of each
 * band that face nothing (no neighbour continues there).
 */
function drawWall(spec: WallSpec, face: Img, top: Img, cols: number, mask: number): { img: Img; solids: Rect[] } {
  const d = WALL_DIM[spec.kind];
  const C = d.cell;
  const thick = d.thick;
  const H = d.height, head = d.head;
  const W = C * cols;
  const lo = (C - thick) / 2, hi = lo + thick;
  const off = H + head;                 // image row of ground y = 0
  const img = blank(W, C + off);
  // The ground band: the run along x (cols > 1 is a straight east-west run) and the arms of the mask.
  const bands: Rect[] = [{ x0: lo, y0: lo, x1: W - lo, y1: hi }];
  if (mask & KIT_N) bands.push({ x0: lo, y0: 0, x1: hi, y1: lo });
  if (mask & KIT_S) bands.push({ x0: lo, y0: hi, x1: hi, y1: C });
  if (mask & KIT_W) bands.push({ x0: 0, y0: lo, x1: lo, y1: hi });
  if (mask & KIT_E) bands.push({ x0: W - lo, y0: lo, x1: W, y1: hi });
  // Past the piece's edge the wall goes on where it joins.
  const nlo = (C - d.thick) / 2, nhi = nlo + d.thick;
  const inside = (x: number, y: number) => {
    if (x < 0) return !!(mask & KIT_W) && y >= nlo && y < nhi;
    if (x >= W) return !!(mask & KIT_E) && y >= nlo && y < nhi;
    if (y < 0) return !!(mask & KIT_N) && x >= nlo && x < nhi;
    if (y >= C) return !!(mask & KIT_S) && x >= nlo && x < nhi;
    return bands.some((b) => inRect(b, x, y));
  };
  // 1. Faces: under every top pixel whose ground south neighbour is open.
  for (let x = 0; x < W; x++) for (let y = 0; y < C; y++) {
    if (!inside(x, y) || inside(x, y + 1)) continue;
    // y is the band's south edge here: the face rises from ground row y to the top's edge.
    for (let k = 0; k < H; k++) {
      const row = y + off - k;
      let f = 0.82 + 0.18 * (k / H);           // a little darker toward the ground
      if (k === 0) f *= 0.62;                  // the foot
      if (spec.kind === "house" && k < 3) f *= 0.8; // a plinth
      if (k >= H - 2) f *= 0.72;               // shadow under the top's lip
      put(img, x, row, sample(face, x, H - k), f);
    }
  }
  // 2. The top, `H` above its ground (coping overhangs a little on open sides).
  const over = spec.coping ? 2 : 0;
  for (let x = -over; x < W + over; x++) for (let y = -over; y < C + over; y++) {
    let on = x >= 0 && y >= 0 && x < W && y < C && inside(x, y);
    if (!on && over) for (let dy = -over; dy <= over && !on; dy++) for (let dx = -over; dx <= over && !on; dx++)
      on = x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < C && inside(x + dx, y + dy) && (x >= 0 && x < W);
    if (!on) continue;
    const ix = x, iy = y + off - H;
    if (ix < 0 || ix >= W) continue;
    const rim = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
    const f = spec.coping ? (inside(x, y) ? 1 : 0.7) : rim ? 0.72 : 1.06;
    put(img, ix, iy, sample(top, x, y), f);
  }
  if (spec.coping) {
    // A ridge along the middle of each run, lit on its upper side.
    const mid = Math.floor((lo + hi) / 2);
    for (let x = 0; x < W; x++) for (let y = 0; y < C; y++) {
      if (!inside(x, y)) continue;
      const horizontalRun = inside(x - 1, y) || inside(x + 1, y);
      const verticalRun = inside(x, y - 1) || inside(x, y + 1);
      const iy = y + off - H;
      if (horizontalRun && y === mid) { shadeAt(img, x, iy, 0.55); shadeAt(img, x, iy - 1, 1.25); }
      if (verticalRun && !horizontalRun && x === mid) { shadeAt(img, x, iy, 0.55); shadeAt(img, x - 1, iy, 1.2); }
    }
  }
  // 3. Parapets with crenels on city walls, along every open edge of the top.
  if (spec.kind === "city") {
    const mh = head;
    for (let x = 0; x < W; x++) for (let y = 0; y < C; y++) {
      if (!inside(x, y)) continue;
      const iy = y + off - H;
      const merlon = ((x + 1) % 8) < 6;
      // Front (south) and back (north) edges of east-west runs: merlons rise above the edge.
      if (!inside(x, y + 1) || !inside(x, y - 1)) {
        const front = !inside(x, y + 1);
        if (merlon) for (let k = 1; k <= mh; k++) put(img, x, iy - k + (front ? 0 : 1), sample(face, x, k + 3), k === mh ? 0.75 : front ? 0.98 : 0.86);
      }
      // Side edges of north-south runs: a narrow parapet strip with notches.
      if (!inside(x - 1, y) || !inside(x + 1, y)) {
        const notch = ((y + 1) % 8) >= 6;
        for (let k = 0; k < 2; k++) {
          const sx = !inside(x - 1, y) ? x + k : x - k;
          put(img, sx, iy, sample(face, sx, y), notch ? 0.62 : k ? 0.92 : 1.12);
        }
      }
    }
  }
  // 4. An outline where the piece meets the painting (not at sides that join on).
  const out = new Uint8Array(img.w * img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!alpha(img, x, y)) continue;
    const edge = (nx: number, ny: number) => {
      if (nx < 0) return !(mask & KIT_W);
      if (nx >= img.w) return !(mask & KIT_E);
      // Above a north arm's top the next piece's top goes on.
      if (ny < head + 1 && mask & KIT_N && nx >= nlo && nx < nhi) return false;
      if (ny < 0) return !(mask & KIT_N);
      return !alpha(img, nx, ny);
    };
    if (edge(x - 1, y) || edge(x + 1, y) || edge(x, y - 1) || edge(x, y + 1)) out[y * img.w + x] = 1;
  }
  for (let i = 0; i < out.length; i++) if (out[i]) shadeAt(img, i % img.w, Math.floor(i / img.w), 0.55);
  return { img, solids: bands };
}

/** Cut a gate's passage out of a straight east-west piece; returns the two piers' ground boxes. */
function cutGate(spec: WallSpec, img: Img, cols: number): Rect[] {
  const d = WALL_DIM[spec.kind];
  const C = d.cell, W = C * cols, lo = (C - d.thick) / 2, hi = lo + d.thick, off = d.height + d.head;
  const base = hi + off;                         // image row of the face's foot
  const width = spec.gate === "arch" ? 30 : spec.kind === "fence" ? 18 : 20;
  const x0 = Math.round((W - width) / 2), x1 = x0 + width;
  const tall = spec.gate === "arch" ? 40 : spec.kind === "fence" ? d.height : d.height - 8;
  const holes = (x: number, row: number): boolean => {
    if (spec.gate === "moon") {
      // A full round opening whose foot is cut off by the ground.
      const r = 14, cx = W / 2 - 0.5, cy = base - r + 4;
      return row <= base && (x - cx) ** 2 + (row - cy) ** 2 <= r * r;
    }
    if (x < x0 || x >= x1 || row > base) return false;
    if (spec.gate === "arch") {
      const r = width / 2, cx = (x0 + x1) / 2 - 0.5, spring = base - tall + r;
      return row >= spring || (x - cx) ** 2 + (row - spring) ** 2 <= r * r;
    }
    return row > base - tall;
  };
  const cut = new Uint8Array(img.w * img.h);
  for (let row = 0; row <= base; row++) for (let x = 0; x < W; x++) if (holes(x, row)) cut[row * img.w + x] = 1;
  // A fence gate opens to the ground; a wall gate keeps its top across the passage.
  for (let i = 0; i < cut.length; i++) {
    const row = Math.floor(i / img.w);
    if (cut[i] && (spec.kind === "fence" || row > hi + off - d.height)) img.px[i * 4 + 3] = 0;
  }
  // Frame the opening: dark reveal on the passage's edge, a lintel of wood for doors.
  for (let row = 0; row <= base; row++) for (let x = 0; x < W; x++) {
    if (!alpha(img, x, row) || cut[row * img.w + x]) continue;
    const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = row + dy;
      return nx >= 0 && nx < W && ny >= 0 && ny <= base && cut[ny * img.w + nx] && !alpha(img, nx, ny);
    });
    if (touches) {
      if (spec.gate === "door") put(img, x, row, [92, 52, 30]); else shadeAt(img, x, row, 0.45);
    }
  }
  return [{ x0: 0, y0: lo, x1: x0, y1: hi }, { x0: x1, y0: lo, x1: W, y1: hi }];
}

async function buildWall(spec: WallSpec, textures: Img[], texJob: { prompt: string; seed?: number; jobId?: string }) {
  const d = WALL_DIM[spec.kind];
  const C = d.cell;
  const face = textures[spec.face], top = textures[spec.top];
  const set = `kit_${spec.region}_${spec.kind === "fence" ? "fence" : "wall"}_${spec.style}`;
  const kind: KitInfo["kind"] = spec.kind === "fence" ? "fence" : "wall";
  const label = spec.kind === "city" ? ["กำแพงเมือง", "city wall"] : spec.kind === "house" ? ["กำแพงบ้าน", "house wall"] : ["รั้ว", "fence"];
  const source = { tool: "build-kits.ts (PixelLab create-tiles-pro textures)", prompt: `${TEXTURES[spec.face]} | ${TEXTURES[spec.top]} — ${texJob.prompt.slice(0, 60)}…`,
    seed: texJob.seed, jobId: texJob.jobId, size: 32 };
  const add = async (suffix: string, name: string, img: Img, solids: Rect[], kit: KitInfo, extraTags: string[]) => {
    const id = `${set}_${suffix}`;
    const url = `/assets/kit/${kind}/${id}.png`;
    await save(img, join("public", url));
    const W = img.w;
    // Ground boxes (cell px from the top-left cell's corner) → anchor-relative map units; the anchor is the span's bottom centre.
    const rel = (r: Rect): Footprint => ({ x: r.x0 - W / 2, y: r.y0 - C * (kit.span?.h ?? 1), w: r.x1 - r.x0, h: r.y1 - r.y0 });
    const boxes = solids.map(rel);
    const bounds = boxes.length ? {
      x: Math.min(...boxes.map((b) => b.x)), y: Math.min(...boxes.map((b) => b.y)),
      w: Math.max(...boxes.map((b) => b.x + b.w)) - Math.min(...boxes.map((b) => b.x)),
      h: Math.max(...boxes.map((b) => b.y + b.h)) - Math.min(...boxes.map((b) => b.y)),
    } : null;
    entries.push(entry({
      id, name: `${spec.name} · ${name}`, subcategory: kind, region: spec.region,
      tags: [...spec.tags, ...label, "kit", ...extraTags], image: url, width: W, height: img.h, mapWidth: W, mapHeight: img.h,
      anchorX: W / 2, anchorY: img.h, footprint: bounds, ...(boxes.length > 1 ? { solids: boxes } : {}), layer: "object",
      kit, source,
    }));
  };
  for (let mask = 0; mask < 16; mask++) {
    const { img, solids } = drawWall(spec, face, top, 1, mask);
    await add(pieceSuffix(mask), PIECE_TH[mask], img, solids, { set, kind, cell: C, mask }, [maskName(mask)]);
  }
  if (spec.gate) {
    const cols = spec.gate === "arch" ? 3 : 1;
    const { img } = drawWall(spec, face, top, cols, KIT_E | KIT_W);
    const piers = cutGate(spec, img, cols);
    const gateName = spec.gate === "arch" ? "ประตูเมืองโค้ง (กว้าง 3 ช่อง)" : spec.gate === "moon" ? "ประตูวงพระจันทร์" : spec.kind === "fence" ? "ช่องประตูรั้ว" : "ประตูกำแพง";
    await add("gate", gateName, img, piers, { set, kind, cell: C, mask: KIT_E | KIT_W, ...(cols > 1 ? { span: { w: cols, h: 1 } } : {}), special: "gate" },
      ["ประตู", "gate"]);
  }
}

function entry(e: Omit<AssetEntry, "category" | "flippable" | "status"> & { name: string }): AssetEntry {
  const region = e.region;
  return { ...e, category: "kit", tags: [...new Set([...e.tags, region, REGION_TH[region]])], flippable: false, status: "approved" };
}

// ── Iso sets ───────────────────────────────────────────────────────────────

async function addIso(set: string, kind: KitInfo["kind"], spec: { name: string; region: AssetRegion; tags: string[] }, suffix: string, name: string,
  result: ReturnType<typeof renderIso>, kit: KitInfo, layer: "ground" | "object", source: AssetEntry["source"], extraTags: string[]) {
  const id = `${set}_${suffix}`;
  const url = `/assets/kit/${kind}/${id}.png`;
  await save(result.img, join("public", url));
  const boxes = result.solids;
  const bounds = boxes.length ? {
    x: Math.min(...boxes.map((b) => b.x)), y: Math.min(...boxes.map((b) => b.y)),
    w: Math.max(...boxes.map((b) => b.x + b.w)) - Math.min(...boxes.map((b) => b.x)),
    h: Math.max(...boxes.map((b) => b.y + b.h)) - Math.min(...boxes.map((b) => b.y)),
  } : null;
  entries.push(entry({
    id, name: `${spec.name} (แนวทแยง) · ${name}`, subcategory: kind, region: spec.region,
    tags: [...spec.tags, "แนวทแยง", "isometric", "kit", ...extraTags], image: url, width: result.img.w, height: result.img.h,
    mapWidth: result.img.w, mapHeight: result.img.h, anchorX: result.anchorX, anchorY: result.anchorY,
    footprint: bounds, ...(boxes.length > 1 ? { solids: boxes } : {}), layer, kit, source,
  }));
}

async function buildIsoRoad(spec: IsoRoadSpec) {
  const tile = await load(join("public/assets/tile", spec.tile.split("_")[1], `${spec.tile}.png`));
  const look: IsoLook = { cell: ISO_ROAD_CELL, thick: spec.plaza ? 0.5 : 0.4, height: 0, face: tile, top: tile };
  const set = `kit_${spec.region}_${spec.plaza ? "isoplaza" : "isoroad"}_${spec.style}`;
  const source = { tool: "build-kits.ts iso (library ground tile)", prompt: `${spec.tile} on the iso grid`, size: 32 };
  for (let mask = 0; mask < 16; mask++) {
    await addIso(set, "road", spec, pieceSuffix(mask), PIECE_TH[mask], renderIso(look, { mask }),
      { set, kind: "road", cell: ISO_ROAD_CELL, grid: "iso", mask }, "ground", source, [maskName(mask), spec.plaza ? "ลาน" : "ถนน"]);
  }
}

async function buildIsoWall(spec: WallSpec, textures: Img[], texJob: { prompt: string; seed?: number; jobId?: string }) {
  const dim = ISO_WALL[spec.kind];
  const look: IsoLook = { cell: ISO_WALL_CELL, thick: dim.thick, height: dim.height, parapet: dim.parapet,
    coping: spec.coping ? dim.coping : undefined, face: textures[spec.face], top: textures[spec.top], roof: textures[spec.top] };
  const kind: KitInfo["kind"] = spec.kind === "fence" ? "fence" : "wall";
  const set = `kit_${spec.region}_iso${kind}_${spec.style}`;
  const label = spec.kind === "city" ? ["กำแพงเมือง", "city wall"] : spec.kind === "house" ? ["กำแพงบ้าน", "house wall"] : ["รั้ว", "fence"];
  const source = { tool: "build-kits.ts iso (PixelLab create-tiles-pro textures)", prompt: `${TEXTURES[spec.face]} | ${TEXTURES[spec.top]} — ${texJob.prompt.slice(0, 60)}…`,
    seed: texJob.seed, jobId: texJob.jobId, size: 32 };
  const tagged = { ...spec, tags: [...spec.tags, ...label] };
  for (let mask = 0; mask < 16; mask++) {
    await addIso(set, kind, tagged, pieceSuffix(mask), PIECE_TH[mask], renderIso(look, { mask }),
      { set, kind, cell: ISO_WALL_CELL, grid: "iso", mask }, "object", source, [maskName(mask)]);
  }
  if (!spec.gate) return;
  const shape = spec.kind === "fence" ? "gap" : spec.gate;
  const gateName = spec.gate === "arch" ? `ประตูเมืองโค้ง (${dim.gateSpan} ช่อง)` : spec.gate === "moon" ? "ประตูวงพระจันทร์" : spec.kind === "fence" ? "ช่องประตูรั้ว" : "ประตูกำแพง";
  for (const axis of ["a", "b"] as const) {
    const mask = axis === "a" ? KIT_E | KIT_W : KIT_N | KIT_S;
    const span = dim.gateSpan;
    await addIso(set, kind, tagged, `gate_${axis === "a" ? "se" : "sw"}`, `${gateName} แนว${axis === "a" ? "ขวาลง" : "ซ้ายลง"}`,
      renderIso(look, { mask, span, gate: { axis, shape, width: dim.gateWidth } }),
      { set, kind, cell: ISO_WALL_CELL, grid: "iso", mask, ...(span > 1 ? { span: axis === "a" ? { w: span, h: 1 } : { w: 1, h: span } } : {}), special: "gate" },
      "object", source, ["ประตู", "gate"]);
  }
}

// ── build ──────────────────────────────────────────────────────────────────

for (const spec of ROADS) await buildRoad(spec);
for (const spec of ISO_ROADS) await buildIsoRoad(spec);
const texDir = rawJob("kit_textures_01");
if (existsSync(join(texDir, "job.json"))) {
  const texJob = JSON.parse(readFileSync(join(texDir, "job.json"), "utf8"));
  const textures = await Promise.all(TEXTURES.map((_, i) => load(join(texDir, `${String(i).padStart(2, "0")}.png`))));
  for (const spec of WALLS) await buildWall(spec, textures, texJob);
  for (const spec of WALLS) await buildIsoWall(spec, textures, texJob);
} else console.warn("skip walls: no texture set");

const manifestPath = join(PUBLIC, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AssetManifest;
const assets = [...manifest.assets.filter((a) => a.category !== "kit"), ...entries]
  .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
writeFileSync(manifestPath, JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), assets }, null, 1) + "\n");
const sets = new Set(entries.map((e) => e.kit!.set));
console.log(`kits: ${entries.length} pieces in ${sets.size} sets → ${OUT}`);
