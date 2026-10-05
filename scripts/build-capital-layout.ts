/**
 * The imperial capital's placed city (city_capital): rewrites
 * `maps.city_capital` and `grounds.city_capital` in public/assets/placements.json.
 * Deterministic — rerun it after changing the plan below; nothing else in the
 * file is touched.
 *
 *   bun scripts/build-capital-layout.ts
 *
 * Layout on the 64-unit iso grid (lib/assets/kits.ts: cell (a, b) has its
 * centre at (480 + (a − b)·32, (a + b + 1)·16); a runs down-right, b down-left):
 * - the imperial avenue (a 9–11, three cells wide) runs straight from the
 *   south gate in the city wall (b 21) up to the yamen: through the paved
 *   plaza (a 7–13, b 7–11) and the walled yamen compound's single gate (10, 6);
 * - the market street (b 9–10) crosses the avenue at the plaza and runs from
 *   the north-west edge to the east edge;
 * - lanes: one cell wide (a 4 and a 16 beside the yamen, b 6 off them, a 2 and
 *   a 19 across the south), two cells where shops and markers face them (the
 *   craft street b 14–15 and the street inside the wall, b 19–20); the row
 *   behind the craft street's shops holds work yards;
 * - the lei-tai stage stands in the plaza's north-west corner, an open square
 *   lies south of it, the bell tower rises at the north edge;
 * - shops stand shoulder to shoulder on whole cells, fronts to a street
 *   (unflipped buildings face down-left, flipped ones down-right); the rows
 *   behind them hold houses and storehouses; the cells beside the wide streets
 *   are kept for goods, stalls and lanterns, so no roof hides the street;
 * - outside the gate: the dirt road, a cart and a few trees and fields.
 * Every marker in lib/world/data/location-maps.ts stands on pavement in
 * front of the building it belongs to; props never land on one.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AssetManifest, Placement, PlacementsFile } from "../lib/assets/types";
import { cellAt, cellOnMap, isoCenter, kitSets, paintKit, placeKitSpecial, type KitSet } from "../lib/assets/kits";
import { indexAssets } from "../lib/assets/catalog";
import { placementGeometry } from "../lib/assets/placement-geometry";
import { getLocationMap } from "../lib/world/data/location-maps";
import { mapAnchors } from "../lib/stage/map-anchors";
import { markerApproach } from "../lib/stage/world-map-probe";

const MAP = "city_capital";
const GROUND = "til_heartland_brick_dirt_13";
const ROOT = join(import.meta.dirname, "..");
const FILE = join(ROOT, "public/assets/placements.json");
const manifest = JSON.parse(readFileSync(join(ROOT, "public/assets/manifest.json"), "utf8")) as AssetManifest;
const assets = indexAssets(manifest.assets);
const sets = kitSets(manifest.assets);
const CELL = 64;

let serial = 0;
const nextId = () => `p_${String(++serial).padStart(6, "0")}`;
let placements: Placement[] = [];

// The map's markers (lib/world/data/location-maps.ts) and the points the hero
// walks to for them stay clear: props that would stand on one are left out,
// and a building on one is an error.
const map = getLocationMap(MAP)!;
const anchors = mapAnchors(map, MAP);
const keepClear = anchors.flatMap((anchor) => anchor.kind === "spawn" || anchor.kind === "arrival"
  ? [anchor] : [anchor, markerApproach(anchor, anchor.kind)]);
// The physician's quest props and patient (lib/stage/world-vignettes.ts) stand to her left.
const lin = map.npcSpots?.city_capital_physician_lin;
if (lin) keepClear.push({ x: (lin.x - 2.7) * 9.6, y: (lin.y - 0.5) * 6.4 }, { x: (lin.x - 6.5) * 9.6, y: (lin.y - 0.3) * 6.4 });
const qing = map.npcSpots?.city_capital_clerk_qing;
if (qing) keepClear.push({ x: (qing.x - 3.2) * 9.6, y: (qing.y + 0.4) * 6.4 });
function blocksMarker(placement: Placement, margin: number): boolean {
  const g = placementGeometry(placement, assets.get(placement.asset)!);
  const boxes = g.solids.length ? g.solids : [{ left: g.x - 10, right: g.x + 10, top: g.y - 8, bottom: g.y + 4 }];
  return keepClear.some((p) => boxes.some((r) => p.x > r.left - margin && p.x < r.right + margin && p.y > r.top - margin && p.y < r.bottom + margin));
}

/** Cells kept open as street: the walk in from each exit to where the hero arrives. */
const OPEN = new Set<string>();
for (const exit of anchors.filter((a) => a.kind === "exit")) {
  const arrival = anchors.find((a) => a.id === `arrival:${exit.ref}`);
  if (!arrival) continue;
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const x = exit.x + (arrival.x - exit.x) * t, y = exit.y + (arrival.y - exit.y) * t;
    for (const [dx, dy] of [[0, 0], [14, 0], [-14, 0], [0, 10], [0, -10]]) {
      const { col, row } = cellAt({ cell: CELL, grid: "iso" }, x + dx, y + dy);
      OPEN.add(`${col},${row}`);
    }
  }
}

// ── The street plan ──
type Kind = "avenue" | "street" | "plaza" | "court" | "lane" | "yard" | "lot" | "garden" | "cityWall" | "palaceWall" | "road" | "field";
const inRange = (v: number, lo: number, hi: number) => v >= lo && v <= hi;
const WALL_B = 21;
/** The yamen compound: palace walls on a 6, a 14 and b 6 (gate at a 10), its court b 4–5. */
const inCompound = (a: number, b: number) => inRange(a, 6, 14) && b <= 6;
function plannedKind(a: number, b: number): Kind {
  if (b === WALL_B) return "cityWall";
  if (b > WALL_B) return inRange(a, 9, 11) ? "road" : "field";
  if (inCompound(a, b)) {
    if (a === 6 || a === 14 || b === 6) return "palaceWall";
    return b >= 3 ? "court" : "garden";
  }
  if (inRange(a, 7, 13) && inRange(b, 7, 11)) return "plaza";
  if (inRange(a, 9, 11)) return "avenue";
  if (inRange(b, 9, 10)) return "street";
  if (b < 9) return a === 4 || a === 16 || (b === 6 && (a < 4 || a > 16)) ? "lane" : "lot";
  // South of the market: an open square below the plaza (no roof hides it).
  if (inRange(a, 12, 14) && inRange(b, 11, 13)) return "yard";
  if (inRange(b, 14, 15) || inRange(b, 19, 20) || a === 2 || a === 19) return "lane";
  // The row behind the shops on b 14–15: work yards (timber west, ore east).
  return b === 16 ? "yard" : "lot";
}
function kindAt(a: number, b: number): Kind {
  const kind = plannedKind(a, b);
  return (kind === "lot" || kind === "garden") && OPEN.has(`${a},${b}`) ? "lane" : kind;
}
const cells: { a: number; b: number; kind: Kind }[] = [];
for (let a = -12; a <= 32; a++) for (let b = -12; b <= 32; b++) {
  if (!cellOnMap({ cell: CELL, grid: "iso" }, a, b)) continue;
  cells.push({ a, b, kind: kindAt(a, b) });
}
const key = (a: number, b: number) => `${a},${b}`;
const kindOf = new Map(cells.map((c) => [key(c.a, c.b), c.kind]));

// ── Paving and walls ──
const PAVING: Partial<Record<Kind, string>> = {
  avenue: "kit_heartland_isoroad_slab",
  street: "kit_heartland_isoroad_slab",
  plaza: "kit_heartland_isoplaza_slab",
  court: "kit_heartland_isoplaza_slab",
  lane: "kit_heartland_isoroad_brick",
  yard: "kit_heartland_isoplaza_brick",
  lot: "kit_heartland_isoplaza_brick",
  road: "kit_any_isoroad_dirt",
};
const kitSet = (id: string): KitSet => {
  const set = sets.get(id);
  if (!set) throw new Error(`no kit set ${id}`);
  return set;
};
function paint(setId: string, list: readonly { a: number; b: number }[]) {
  placements = paintKit(placements, assets, kitSet(setId), list.map((c) => ({ col: c.a, row: c.b })), false, nextId).placements;
}
for (const [kind, setId] of Object.entries(PAVING)) paint(setId!, cells.filter((c) => c.kind === kind));
function special(setId: string, suffix: string, a: number, b: number) {
  const set = kitSet(setId);
  const piece = set.specials.find((s) => s.id.endsWith(suffix))!;
  placements = placeKitSpecial(placements, assets, set, piece, a, b, nextId()).placements;
}
const CITY_WALL = "kit_heartland_isowall_city_greybrick";
paint(CITY_WALL, cells.filter((c) => c.kind === "cityWall"));
special(CITY_WALL, "_gate_se", 9, WALL_B);          // the south gate: three cells, a 9–11
const PALACE_WALL = "kit_heartland_isowall_house_palace";
paint(PALACE_WALL, cells.filter((c) => c.kind === "palaceWall"));
special(PALACE_WALL, "_gate_se", 10, 6);            // the yamen's one gate, on the avenue
// Behind the halls the wall only has to be seen: without collision there it adds
// no solids (each wall piece blocks with a staircase of boxes), so path
// planning across the map stays fast.
placements = placements.map((p) => {
  if (!p.asset.startsWith(PALACE_WALL)) return p;
  const { row } = cellAt({ cell: CELL, grid: "iso" }, p.x, p.y);
  return row <= 1 ? { ...p, collide: false } : p;
});

// ── Placing ──
const isStreet = (a: number, b: number) => ["avenue", "street", "plaza", "court", "lane", "yard"].includes(kindOf.get(key(a, b)) ?? "");
const wide = (a: number, b: number) => ["avenue", "street", "plaza"].includes(kindOf.get(key(a, b)) ?? "");
/** Cells already holding a building (or kept for something else). */
const taken = new Set<string>();
const free = (a: number, b: number) => kindOf.get(key(a, b)) === "lot" && !taken.has(key(a, b));
const at = (a: number, b: number) => isoCenter(CELL, a, b);
const round1 = (v: number) => Math.round(v * 10) / 10;
const series = (prefix: string, ...n: number[]) => n.map((i) => `${prefix}_${String(i).padStart(2, "0")}`);

let seed = 1401;
/** Deterministic 0…1. */
const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const turns = new Map<string, number>();
/** A pool's assets in turn, so a district repeats itself as little as possible. */
function nextOf(pool: readonly string[], tag: string): string {
  const i = turns.get(tag) ?? 0;
  turns.set(tag, i + 1);
  return pool[i % pool.length];
}

let skipped = 0;
/** Poles a step wide: drawn, but walked past without collision (every solid slows path planning). */
const THIN = /street_lantern|red_lanterns|imperial_lantern|_banner$/;
function put(asset: string, x: number, y: number, extra: Partial<Placement> = {}) {
  if (!assets.has(asset)) throw new Error(`unknown asset ${asset}`);
  if (THIN.test(asset) && extra.collide === undefined) extra = { ...extra, collide: false };
  if (!(x >= 0 && x <= 960 && y >= 0 && y <= 640)) return false;
  const placement: Placement = { id: "", asset, x: round1(x), y: round1(y), ...extra };
  if (assets.get(asset)!.category === "building") {
    if (blocksMarker(placement, 2)) console.warn(`! ${asset} at ${Math.round(x)},${Math.round(y)} covers a marker`);
  } else if (blocksMarker(placement, 9)) { skipped++; return false; }
  placements.push({ ...placement, id: nextId() });
  return true;
}
/** A prop at cell coordinates (fractions allowed). */
const putAt = (asset: string, a: number, b: number, extra: Partial<Placement> = {}) => put(asset, at(a, b).x, at(a, b).y, extra);

type Face = "sw" | "se" | "back";
type District = "gov" | "market" | "east" | "west" | "craft" | "home";
interface Front { asset: string; a: number; b: number; size: number; face: "sw" | "se"; district: District; tip: { x: number; y: number } }
const fronts: Front[] = [];
/**
 * A building on the size × size cells from (a, b), anchored at the lower tip
 * of their diamond. Unflipped art fronts down-left ("sw"), flipped down-right
 * ("se"); wider art is scaled to the cells.
 */
function building(asset: string, a: number, b: number, size: number, face: Face, district: District, scale?: number) {
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) taken.add(key(a + i, b + j));
  const tip = at(a + size - 0.5, b + size - 0.5);
  const entry = assets.get(asset)!;
  const width = entry.footprint?.w ?? entry.mapWidth;
  const s = scale ?? Math.min(1, (size * 64 + 8) / width);
  const flip = face === "se" || (face === "back" && rand() < 0.5);
  put(asset, tip.x, tip.y, { ...(s < 0.995 ? { scale: Math.round(s * 100) / 100 } : {}), ...(flip ? { flip: true } : {}) });
  if (face !== "back") fronts.push({ asset, a, b, size, face, district, tip });
}

function district(a: number, b: number): District {
  if (b <= 8 && inRange(a, 5, 15)) return "gov";
  if (b <= 8) return a > 15 ? "east" : "west";
  if (b <= 12) return "market";
  return a >= 12 ? "craft" : "home";
}
const FRONT_POOLS: Record<District, string[]> = {
  market: [...series("bld_heartland_wine_shop", 1, 3, 4), ...series("bld_east_silk_shop", 1, 4), "bld_heartland_teahouse_02", "bld_east_tea_house_small_02", "bld_heartland_pharmacy_03"],
  gov: [...series("bld_heartland_shrine_hall", 1, 2, 4), "bld_heartland_yamen_03"],
  east: [...series("bld_east_tea_house_small", 1, 3, 4), "bld_heartland_teahouse_01", "bld_east_inn_03", "bld_heartland_wine_shop_03"],
  west: ["bld_heartland_teahouse_03", "bld_east_silk_shop_04", "bld_heartland_wine_shop_04", "bld_east_tea_house_small_01", "bld_heartland_pharmacy_04"],
  craft: [...series("bld_heartland_smithy", 2, 3, 4), "bld_heartland_wine_shop_01", "bld_east_silk_shop_01", "bld_heartland_pharmacy_03", "bld_east_inn_02"],
  home: [...series("bld_east_water_house", 1, 2, 3), "bld_heartland_courtyard_house_01", "bld_heartland_wine_shop_03", "bld_east_tea_house_small_03", "bld_heartland_shrine_hall_03"],
};
const BACK_POOL = ["bld_heartland_courtyard_house_01", ...series("bld_heartland_granary", 1, 3, 4), ...series("bld_east_water_house", 2, 4), "bld_heartland_shrine_hall_03", "bld_east_silk_shop_04", "bld_heartland_wine_shop_01"];

// Landmarks. The yamen heads the avenue: the main hall and two wings, all
// fronting the court inside the compound's gate.
building("bld_heartland_yamen_01", 9, 0, 3, "sw", "gov");
building("bld_heartland_yamen_04", 7, 1, 2, "sw", "gov");
building("bld_heartland_yamen_02", 12, 1, 2, "sw", "gov");
// The lei-tai stage (the sword tournament's ring) stands in the plaza's
// north-west corner by the yamen gate; the bell tower rises at the north edge
// (a tall roof only hides what lies above it on screen).
building("bld_landmark_arena_stage_03", 7, 7, 2, "se", "market", 0.6);
building("bld_landmark_bell_tower_01", -1, 1, 2, "sw", "west", 1);

// The shops each marker stands before (lib/world/data/location-maps.ts).
const SHOPS: [string, number, number, Face][] = [
  ["bld_heartland_pharmacy_01", 1, 7, "sw"],       // Physician Lin's apothecary
  ["bld_east_silk_shop_03", -1, 7, "sw"],          // the tailor's
  ["bld_heartland_granary_02", 2, 3, "se"],        // the general store on the north lane
  ["bld_heartland_teahouse_02", 17, 7, "sw"],      // the tea house of rumours
  ["bld_east_inn_01", 19, 7, "sw"],                // the inn
  ["bld_heartland_wine_shop_02", 7, 12, "se"],     // the kitchen row: an eating house on the avenue
  ["bld_east_silk_shop_02", 7, 17, "se"],          // the jeweller and the charm seller
  ["bld_heartland_smithy_01", 15, 12, "sw"],       // the forge in the craft quarter
  ["bld_heartland_pharmacy_02", 17, 12, "sw"],     // the alchemist's next door
];
for (const [asset, a, b, face] of SHOPS) building(asset, a, b, 2, face, district(a, b));

const lots = cells.filter((c) => c.kind === "lot");
/**
 * Whether a building fits on the n × n cells from (a, b). Buildings keep one
 * cell back from the avenue, the market street and the plaza on their far
 * (upper) sides: a roof rises over the ground behind it, so a building there
 * would hide the street.
 */
const fits = (a: number, b: number, n: number) => {
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!free(a + i, b + j)) return false;
  for (let i = 0; i < n; i++) if (wide(a - 1, b + i) || wide(a + i, b - 1)) return false;
  const tip = at(a + n - 0.5, b + n - 0.5);
  return !keepClear.some((p) => p.x > tip.x - n * 32 - 8 && p.x < tip.x + n * 32 + 8 && p.y > tip.y - n * 30 && p.y < tip.y + 8);
};
const assetFor = (a: number, b: number) => nextOf(FRONT_POOLS[district(a, b)], district(a, b));
// Street fronts: down-left faces row by row, then down-right faces.
for (const { a, b } of [...lots].sort((p, q) => p.b - q.b || p.a - q.a)) {
  if (fits(a, b, 2) && isStreet(a, b + 2) && isStreet(a + 1, b + 2)) building(assetFor(a, b), a, b, 2, "sw", district(a, b));
}
for (const { a, b } of [...lots].sort((p, q) => p.a - q.a || p.b - q.b)) {
  if (fits(a, b, 2) && isStreet(a + 2, b) && isStreet(a + 2, b + 1)) building(assetFor(a, b), a, b, 2, "se", district(a, b));
}
// Behind the shop rows: houses and storehouses wherever two-by-two still fits.
for (const { a, b } of [...lots].sort((p, q) => p.b - q.b || p.a - q.a)) {
  if (fits(a, b, 2)) building(nextOf(BACK_POOL, "back"), a, b, 2, "back", district(a, b));
}

// ── Props ──
const hp = (name: string, ...n: number[]) => series(`prp_heartland_${name}`, ...n);
const ep = (name: string, ...n: number[]) => series(`prp_east_${name}`, ...n);
const ip = (name: string, ...n: number[]) => series(`prp_interior_${name}`, ...n);
const np = (name: string, ...n: number[]) => series(`prp_north_${name}`, ...n);
const ALL8 = [1, 2, 3, 4, 5, 6, 7, 8];
/** What a shop sets out in front, by the building it stands before. */
function goodsFor(asset: string, d: District): string[] {
  if (asset.includes("pharmacy")) return [...ip("medicine_cabinet", 1, 2, 3, 4), ...hp("pottery", 1, 3, 5), ...hp("crates_sacks", 2, 6)];
  if (asset.includes("smithy")) return [...ip("weapon_rack", 1, 2, 3, 4, 5), "sct_jinyiwei_sabre_rack", "sct_songshan_heavy_sword_rack", ...hp("barrels", 2, 5), ...ip("brazier", 1, 2)];
  if (asset.includes("silk_shop")) return [...ep("rice_racks", 1, 2, 3, 4), ...ep("mulberry_basket", 1, 2, 3), ...hp("crates_sacks", 1, 4)];
  if (asset.includes("teahouse") || asset.includes("tea_house") || asset.includes("inn")) return [...ip("dining_table", 1, 2, 3, 4, 5), ...ep("umbrella_stand", 1, 2), ...hp("water_vat", 1, 2), ...ip("kitchen_stove", 1, 2)];
  if (asset.includes("wine_shop")) return [...hp("barrels", ...ALL8), ...hp("pottery", 2, 4, 6, 8), "sct_beggars_wine_gourds"];
  if (asset.includes("shrine") || asset.includes("yamen")) return [...hp("incense_burner", ...ALL8), "sct_taishan_bronze_ding", "sct_shaolin_stone_stele"];
  if (asset.includes("granary")) return [...hp("crates_sacks", 3, 5, 7), ...np("crates_sacks", 1, 2), ...hp("handcart", 3, 4)];
  if (d === "home" || asset.includes("courtyard") || asset.includes("water_house")) return [...hp("water_vat", 3, 4, 5, 6), ...ep("lotus_tub", 1, 2, 3), ...hp("pottery", 1, 7), ...ep("pottery", 1, 2)];
  return [...hp("crates_sacks", ...ALL8), ...hp("pottery", ...ALL8)];
}
const SIGN_POLES = ["sct_taishan_red_lanterns", "sct_jinyiwei_imperial_lantern", ...hp("street_lantern", 1, 2, 3, 5, 6, 8), ...ep("street_lantern", 1, 2, 3)];

// Shop fronts: goods either side of the door and a sign pole with lanterns,
// all against the front wall (inside the building's own footprint box, so the
// street stays as wide as it was).
fronts.forEach((front) => {
  if (front.size !== 2 || front.asset.includes("landmark")) return;
  const side = front.face === "sw" ? -1 : 1;
  const goods = goodsFor(front.asset, front.district);
  put(nextOf(goods, `goods:${front.asset}`), front.tip.x + side * 52, front.tip.y - 6);
  put(nextOf(goods, `goods:${front.asset}`), front.tip.x + side * 30, front.tip.y - 2);
  put(nextOf(SIGN_POLES, "pole"), front.tip.x + side * 8, front.tip.y);
});

// The yamen court: stone lions at the main door, the drum of grievance,
// banners and censers; banner poles flank the gate on both sides.
putAt("prp_heartland_stone_lion_01", 8.9, 3.25);
putAt("prp_heartland_stone_lion_02", 11.4, 3.25, { flip: true });
putAt("sct_jinyiwei_drum_of_grievance", 11.7, 5.5);
putAt("sct_taishan_bronze_ding", 9.2, 5.3);
putAt("sct_jinyiwei_banner", 9, 6.6);
putAt("sct_jinyiwei_banner", 11, 6.6);
putAt("sct_jinyiwei_flying_fish_banner", 7.2, 5.6);
putAt("sct_jinyiwei_flying_fish_banner", 13.4, 5.6);
putAt("sct_jinyiwei_command_desk", 7.4, 5.4);
// Inside the walls: the yamen garden — pines and blossom in clumps.
const GARDEN_TREES = [...series("nat_temperate_pine", 2, 4, 7), ...series("nat_temperate_blossom_tree", 2, 4), ...series("nat_temperate_maple", 1, 6)];
for (const c of cells.filter((x) => x.kind === "garden" && !taken.has(key(x.a, x.b)))) {
  // Walled in, so they need no collision (fewer solids keep path planning fast).
  if ((c.a + c.b) % 2 === 0 || c.a === 7 || c.a === 13) putAt(nextOf(GARDEN_TREES, "garden"), c.a + (rand() - 0.5) * 0.4, c.b + 0.3, { collide: false });
}

// The plaza: a bronze cauldron on the axis, stone lanterns round it, stalls
// along its east side and ground vendors by the stage.
putAt("sct_shaolin_incense_cauldron", 10, 9, { scale: 1.4 });
putAt("sct_taishan_stele_tortoise", 12.6, 9.4);
for (const [a, b] of [[9.1, 8.1], [10.9, 8.1], [9.1, 9.9], [10.9, 9.9]]) putAt("prp_east_street_lantern_07", a, b);
const STALLS = [...hp("market_stall", ...ALL8), ...ep("market_stall", 1, 2, 3, 4, 5, 6)];
for (const [a, b] of [[13, 7.2], [13, 8.4], [12.2, 7.1], [8.7, 11.5]]) putAt(nextOf(STALLS, "stall"), a, b, rand() < 0.5 ? { flip: true } : {});
// Blossom trees in a clump at the plaza's south-west corner.
for (const [a, b] of [[7.2, 11.5], [7.9, 11.7], [7.15, 10.9]]) putAt(nextOf(series("nat_temperate_blossom_tree", 2, 6, 8), "plaza-tree"), a, b);
putAt("sct_beggars_straw_mats", 12.6, 11.3);
putAt("sct_beggars_begging_bowls", 12.9, 11.6);
putAt("sct_jinyiwei_weapon_rack", 9.2, 9.0);
putAt("sct_songshan_alliance_flag", 9.1, 8.4);

// The south gate: banner poles and a sentry's weapon rack inside, the notice
// board at the first crossing, a cart, a horse post and a trough outside.
putAt("sct_jinyiwei_flying_fish_banner", 8.6, 20.55);
putAt("sct_jinyiwei_flying_fish_banner", 12.4, 20.55);
putAt("sct_jinyiwei_weapon_rack", 12.5, 18.3);
putAt("prp_heartland_notice_board_02", 8.5, 19.0);
putAt("prp_heartland_handcart_02", 8.3, 22.6);
putAt("sct_jinyiwei_horse_post", 12.3, 22.3);
putAt("prp_north_water_trough_01", 12.6, 23);
putAt("prp_heartland_sedan_chair_05", 8.6, 23.6);

// The yard row: the timber yard west of the avenue, the ore yard east of it;
// the square south of the plaza keeps to low goods and a well.
const TIMBER = [...np("firewood_pile", 1, 2, 3, 4), ...series("nat_bamboo_fallen_log", 1, 2, 3), ...np("firewood_axe", 1, 2), ...hp("handcart", 6)];
const ORE = [...series("nat_temperate_boulder", 2, 3, 5, 7), ...hp("barrels", 3, 6), ...np("crates_sacks", 3, 4), ...hp("handcart", 1)];
const SQUARE = [...ep("crates_sacks", 1, 3, 5), ...hp("pottery", 3, 5), ...ep("fish_baskets", 2, 4), ...ep("pottery", 3, 5)];
for (const c of cells.filter((x) => x.kind === "yard" && !taken.has(key(x.a, x.b)))) {
  if (c.b !== 16) putAt(nextOf(SQUARE, "square"), c.a + (rand() - 0.5) * 0.5, c.b + (rand() - 0.5) * 0.4);
  else putAt(nextOf(c.a < 9 ? TIMBER : ORE, `yard${c.a < 9}`), c.a + (rand() - 0.5) * 0.4, c.b + 0.45);
}
putAt("prp_heartland_well_03", 13.5, 12.6);

// Pines along the yamen wall, between it and the lanes either side.
for (const a of [5, 15]) for (let b = -6; b <= 6; b += 1) {
  if (kindOf.get(key(a, b)) === "lot" && !taken.has(key(a, b))) { taken.add(key(a, b)); putAt(nextOf(GARDEN_TREES, "wall-tree"), a + 0.05, b + 0.3, { collide: false }); }
}
// The lots kept beside the wide streets: stalls along the market street,
// lanterns and trees along the avenue; elsewhere yards with wells and trees.
// Inside the shop rows only the odd blossom tree, a colour pop; big crowns would hide the lanes.
const TREES = series("nat_temperate_blossom_tree", 1, 3, 5, 7);
const YARD = [...hp("well", 1, 4, 6, 7), ...hp("water_vat", 7, 8), ...hp("chicken_coop", 1, 4), ...ep("rice_racks", 5, 6), ...ep("well", 2, 5), ...ep("duck_pen", 1), ...np("firewood_pile", 5, 6)];
const LANTERNS = [...hp("street_lantern", 1, 2, 3, 5, 6, 7, 8), ...ep("street_lantern", 1, 2, 3, 4, 5)];
const GROUND_GOODS = [...hp("crates_sacks", 1, 3, 5, 7), ...ep("fish_baskets", 1, 3, 5), ...ep("crates_sacks", 2, 4), ...hp("pottery", 2, 6), ...ep("barrels", 1, 3)];
for (const c of lots.filter((y) => free(y.a, y.b))) {
  const besideMarket = kindOf.get(key(c.a, c.b - 1)) === "street";
  const besideAvenue = wide(c.a - 1, c.b) || wide(c.a, c.b - 1);
  if (besideMarket) {
    // Ground vendors and lanterns along the low side (canopy stalls would close the street).
    putAt(nextOf(GROUND_GOODS, "ground"), c.a - 0.2, c.b + 0.35);
    if ((c.a & 1) === 0) putAt(nextOf(LANTERNS, "lantern"), c.a + 0.3, c.b + 0.45);
  } else if (besideAvenue) {
    // Low things only, so the avenue stays in view: stalls, goods and lanterns.
    if (c.b % 3 === 0) { putAt(nextOf(LANTERNS, "lantern"), c.a - 0.25, c.b); putAt(nextOf(GROUND_GOODS, "ground"), c.a + 0.2, c.b + 0.2); }
    else if (c.b % 3 === 1) putAt(nextOf(STALLS, "stall"), c.a, c.b, { flip: true });
    else putAt(nextOf(GROUND_GOODS, "ground"), c.a, c.b);
  } else if (rand() < 0.15) putAt(nextOf(TREES, "yard-tree"), c.a, c.b + 0.2);
  else { putAt(nextOf(YARD, "yard"), c.a - 0.15, c.b + 0.1); putAt(nextOf(GROUND_GOODS, "ground"), c.a + 0.3, c.b - 0.2); }
}

// Lanterns down the avenue's west edge, between the shop fronts.
for (const b of [14.1, 16.3, 19.1]) putAt(nextOf(LANTERNS, "lantern"), 8.65, b);

// Outside the wall: a few fields, haystacks and copses beside the road.
const FIELD = [...hp("veg_plot", 1, 2, 3, 4, 5, 6)];
const WILD = [...series("nat_temperate_pine", 1, 3, 5), ...series("nat_temperate_willow", 1, 3, 4), ...series("nat_temperate_maple", 3, 4)];
const GREEN = [...series("nat_temperate_bush", 1, 3, 5, 7), ...series("nat_temperate_wildflowers", 1, 3, 5, 7, 9)];
for (const c of cells.filter((x) => x.kind === "field")) {
  // Nothing tall in front of the gate: trees only away from the road.
  const nearGate = inRange(c.a, 5, 15);
  const r = rand();
  // Plots, bushes and flowers are walked through.
  if (r < 0.4) putAt(nextOf(FIELD, "field"), c.a, c.b + 0.2, { collide: false });
  else if (r < 0.7 && !nearGate) putAt(nextOf(WILD, "wild"), c.a + (rand() - 0.5) * 0.3, c.b + 0.2);
  else putAt(nextOf(GREEN, "green"), c.a + (rand() - 0.5) * 0.4, c.b, { collide: false });
}

// ── Write ──
if (process.env.CAPITAL_DEBUG) writeFileSync(process.env.CAPITAL_DEBUG, JSON.stringify(cells.map((c) => ({ ...c, taken: taken.has(key(c.a, c.b)) }))));
const file = JSON.parse(readFileSync(FILE, "utf8")) as PlacementsFile;
file.maps[MAP] = placements.map((p) => ({ ...p, x: round1(p.x), y: round1(p.y) }));
file.grounds = { ...file.grounds, [MAP]: { tile: GROUND } };
writeFileSync(FILE, JSON.stringify(file, null, 1) + "\n");
const counts: Record<string, number> = {};
for (const p of placements) { const c = assets.get(p.asset)!.category; counts[c] = (counts[c] ?? 0) + 1; }
const props = new Set(placements.filter((p) => ["prop", "sect", "nature"].includes(assets.get(p.asset)!.category)).map((p) => p.asset));
console.log(`${MAP}: ${placements.length} placements (${skipped} props left out by markers), ${props.size} distinct props`, counts);
