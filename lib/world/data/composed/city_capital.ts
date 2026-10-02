import type { ComposedMap, ComposedObject, GridRect, GroundArea, GroundMaterial } from "./types";
import { isoPercent } from "./iso";

// นครหลวง, built from isometric assets on a 64 × 64 grid (4096 × 2208 world
// units). A walled city after the Lin'an plan: the wall's four sides face NW,
// NE, SE and SW on screen; a river crosses the middle along u, a canal leaves
// it south-west for Yangzhou. Gates sit where each road leaves, so every exit
// (location-maps.ts) still faces its destination.
//
//   v  3            NE wall: gates to the fields (u 10), the palace walk (u 34), the guard post (u 50)
//   v  4–15         bamboo grove · Yunlin temple, ruined temple · pagoda · houses
//   v 15–17         north street, out through the SE wall to the Yuelai inn
//   v 17–27         houses · yamen, martial school · Prince Kang's mansion · flower garden
//   v 27–29         Songshan lane, in from the NW wall
//   v 29–37         houses · market and the docks · the flower house (teahouse) · a mansion
//   v 38–41         the river
//   v 41–47         escort agency · shops, the inn · granary
//   v 47–49         south street, in through the NW wall from Chang'an
//   v 49–61         pawnshop, treasure house · canal landing · craftsmen's row · quarry
//   v 61            SW wall: the main gate (u 50) home
//   u 9–11, 33–35, 49–51   the three long streets along v, one per NE gate

const COLUMNS = 64, ROWS = 64;
const WALL_NEAR = 3, WALL_FAR = 61, WALL_THICK = 0.85;
const RIVER: GridRect = [0, 38, COLUMNS, 41];
const CANAL: GridRect = [26, 41, 29, ROWS];
const STREETS_U = [10, 34, 50]; // streets along v, at these u
const NE_GATES = STREETS_U, SW_GATE = 50, NW_GATES = [28, 48], SE_GATE = 16;

const ground: GroundArea[] = [];
const area = (material: GroundMaterial, u: number, v: number, w: number, h: number, edge = false) => ground.push({ material, u, v, w, h, edge });
const objects: ComposedObject[] = [];
const put = (asset: string, u: number, v: number, extra: Partial<ComposedObject> = {}) => objects.push({ asset, u, v, ...extra });
const size = ([u0, v0, u1, v1]: GridRect): [number, number, number, number] => [u0, v0, u1 - u0, v1 - v0];

// ── Ground ─────────────────────────────────────────────────────────────
area("dirt", WALL_NEAR, WALL_NEAR, WALL_FAR - WALL_NEAR + WALL_THICK, WALL_FAR - WALL_NEAR + WALL_THICK); // inside the walls
area("grass", 52, 18, 8, 8);                                      // the flower garden
area("grass", 4, 5, 5, 9);                                        // the bamboo grove
area("grass", 12, 5, 21, 9);                                      // temple grounds
for (const u of STREETS_U) area("cobble", u - 1, 0, 2, ROWS, true); // the three long streets, out through the gates
area("cobble", 0, 15, WALL_FAR + 1, 2, true);                    // north street → SE gate
area("cobble", 0, 47, COLUMNS, 2, true);                          // south street ← NW gate
area("cobble", 0, 27, 34, 2, true);                               // Songshan lane ← NW gate
area("paving", 12, 29, 21, 8, true);                              // the market
area("paving", 36, 25, 12, 2);                                    // the mansion's forecourt
area("paving", 13, 23.5, 12, 1.5);                                // before the yamen and the school
area("dirt", 12, 36, 21, 2);                                      // the quay
area("dirt", 22, 54, 4, 7);                                       // canal landing
area("dirt", 53, 53, 8, 8);                                       // the quarry yard
area("water", ...size(RIVER), true);
area("water", ...size(CANAL), true);

// ── The walls ──────────────────────────────────────────────────────────
// Pieces 6 tiles long; the last one of a run is pulled back to end exactly
// at the run's end (overlapping its neighbour) rather than shrunk.
const WALL_LEN = 6;
function wallRun(along: "u" | "v", fixed: number, from: number, to: number) {
  if (to - from < 0.5) return;
  for (let s = from; s < to - 0.01; s += WALL_LEN) {
    const start = Math.max(from, Math.min(s, to - WALL_LEN));
    if (along === "u") put("wall", start, fixed);
    else put("wall", fixed, start, { flip: true });
  }
}
/** A side of the wall: runs between its gates (4 tiles wide) and gaps such as the river. */
function wallSide(along: "u" | "v", fixed: number, gates: number[], gaps: [number, number][]) {
  const cuts = [...gates.map((g): [number, number] => [g - 2, g + 2]), ...gaps].sort((a, b) => a[0] - b[0]);
  let at = WALL_NEAR + 1.4;
  for (const [a, b] of cuts) { wallRun(along, fixed, at, a); at = b; }
  wallRun(along, fixed, at, WALL_FAR - 0.6);
  // Gates sit across the wall line, centred on it.
  for (const g of gates) {
    if (along === "u") put("gate", g - 2, fixed + WALL_THICK / 2 - 1);
    else put("gate", fixed + WALL_THICK / 2 - 1, g - 2, { flip: true });
  }
}
wallSide("u", WALL_NEAR, NE_GATES, []);
wallSide("u", WALL_FAR, [SW_GATE], [[CANAL[0], CANAL[2]]]);
wallSide("v", WALL_NEAR, NW_GATES, [[RIVER[1], RIVER[3]]]);
wallSide("v", WALL_FAR, [SE_GATE], [[RIVER[1], RIVER[3]]]);
for (const [u, v] of [[WALL_NEAR, WALL_NEAR], [WALL_FAR, WALL_NEAR], [WALL_NEAR, WALL_FAR], [WALL_FAR, WALL_FAR]]) put("tower", u - 0.6, v - 0.6);

// ── Bridges over the river and the canal ──────────────────────────────
for (const u of STREETS_U) put("bridge", u - 0.75, RIVER[1] - 0.75, { flip: true });
put("bridge", CANAL[0] - 0.75, 47.25);

// ── North: bamboo grove, the temples, the pagoda, houses ──────────────
for (const [u, v] of [[4.5, 5.5], [6.5, 6], [5, 8], [7.2, 8.6], [4.6, 10.6], [6.6, 11.2], [5.4, 13]]) put("bamboo", u, v);
put("temple", 13, 5.5);                                           // วัดหยุนหลิน
put("stone_lantern", 14, 11.6); put("stone_lantern", 18, 11.6);
put("tree_pine", 20, 5.4); put("tree_pine", 20.5, 9);
put("ruined_temple", 24, 5.5);                                     // วัดร้าง
put("tree_maple", 30, 6); put("rocks", 30.5, 10);
put("pagoda", 39.5, 5.5);                                          // หอคอย
put("rocks", 37, 6); put("tree_pine", 43.6, 6); put("stone_lion", 40, 9.2); put("stone_lion", 42, 9.2);
put("house_a", 36, 11.2); put("house_b", 44.5, 11.2);
put("house_c", 52, 5.2); put("granary", 57, 5.5);
put("haystack", 57.5, 10); put("tree_plum", 53, 11.5); put("cart", 59, 12);

// ── Houses, yamen, school, Prince Kang's mansion, the flower garden ───
put("house_a", 4.5, 18.5); put("house_b", 4.6, 23);
put("yamen", 12.5, 18.5);                                          // ศาลาว่าการ
put("house_c", 20.5, 18.6); put("banner_pole", 20.6, 23.4); put("banner_pole", 24.4, 23.4); // สำนักยุทธ์
put("notice_board", 26.5, 23.5); put("tree_willow", 29.5, 19.5); put("tree_plum", 27.5, 20);
put("palace", 37.5, 18.3);                                         // จวนคังอ๋อง
put("stone_lion", 38, 25.4); put("stone_lion", 43.6, 25.4);
put("lantern_post", 36.4, 26.4); put("lantern_post", 47.4, 26.4);
put("garden_wall", 52.5, 25.3);                                    // สวนดอกไม้
put("pavilion", 55, 19); put("pond", 52.5, 21.5); put("rocks", 58.2, 21.8);
put("tree_plum", 53, 18.4); put("tree_plum", 58.6, 18.6); put("flower_pots", 57.6, 24); put("flower_pots", 52.8, 24.4);

// ── Market, quay and docks; the flower house; a mansion ───────────────
put("house_b", 4.5, 29.5); put("laundry", 4.4, 34.3); put("house_a", 4.6, 35);
put("stall_fruit", 13, 30); put("stall_food", 17, 30); put("stall_cloth", 21, 30); put("stall_pottery", 25, 30.2);  // ตลาด
put("stall_cloth", 13.4, 33.4); put("stall_fruit", 29.2, 30.4, { flip: true });
put("well", 21.6, 33.6); put("umbrella_table", 25.6, 33.4); put("umbrella_table", 29.4, 34.2);
put("lantern_line", 17.5, 30.6, { flip: true }); put("flag_line", 13, 35.2);
put("barrels", 31.2, 36.2); put("barrels", 12.4, 36.4); put("cart", 26.4, 36.2);
put("dock", 15, 37.4); put("dock", 22, 37.4);                     // ท่าเรือ
put("boat", 18, 38.8, { flip: true }); put("boat", 41, 39.2, { flip: true }); put("boat", 55, 38.6, { flip: true });
put("teahouse", 36.2, 29.4);                                       // หอหมู่บุปผา
put("umbrella_table", 44.6, 34); put("umbrella_table", 46.8, 31.6); put("tree_willow", 47, 29);
put("mansion", 53, 29.6);
put("tree_willow", 36, 36.2); put("tree_willow", 52, 36.2);

// ── South bank: the escort agency, shops, the inn, the granary ────────
put("house_c", 4.4, 41.6);
put("escort", 12, 41.4);                                           // สำนักคุ้มภัย
put("cart", 19.2, 45.4); put("barrels", 23.6, 42.4);
put("shop_a", 29.5, 41.6);
put("inn", 35.6, 42.2);                                            // โรงเตี๊ยม
put("lantern_post", 42.6, 46.4);
put("shop_cloth", 44.6, 43.4);
put("granary", 52, 41.8); put("barrels", 56, 42.4); put("house_b", 57.6, 41.8);

// ── South: pawnshop and treasure house, canal landing, craftsmen, quarry ──
put("pawnshop", 12, 50);                                           // โรงจำนำ
put("shop_a", 16, 50, { flip: true });                             // หอของล้ำค่า
put("house_a", 20.6, 50); put("house_b", 12.2, 55.2); put("house_a", 16.6, 55.6, { flip: true });
put("barrels", 22.4, 55); put("barrels", 23.6, 58.6); put("boat", 26.9, 55.2);
put("smithy", 30, 50.4);
put("smithy", 36, 50);                                             // ร้านช่างตีเหล็ก
put("apothecary", 40, 50);
put("shop_cloth", 44, 50);
put("house_c", 36.2, 55.6); put("house_a", 41.6, 56); put("house_b", 45.4, 56);
put("house_a", 52, 49.6); put("house_b", 56.6, 49.6);
put("rocks", 55, 55); put("rocks", 58, 57.8); put("rocks", 54.4, 58.6); put("cart", 58, 54);

// ── Lamps along the streets ───────────────────────────────────────────
for (const v of [8, 20, 30, 44, 54]) for (const u of STREETS_U) put("lantern_post", u + 1.1, v);
for (const u of [6, 20, 28, 40, 46, 56]) { put("lantern_post", u, 14.6); put("lantern_post", u, 49.4); }

// ── Outside the walls: trees in the fields ────────────────────────────
for (let i = 0; i < 56; i++) {
  const tree = ["tree_pine", "tree_maple", "tree_willow", "tree_plum"][i % 4];
  const side = i % 4;
  const along = 2 + ((i * 1.17 + 4) * 7.3) % 58, depth = 0.4 + (i * 0.37) % 1.4;
  const [u, v] = side === 0 ? [along, depth] : side === 1 ? [depth, along] : side === 2 ? [along, 62.2 + depth * 0.6] : [62.2 + depth * 0.6, along];
  // Keep the roads and water clear.
  const onRoad = STREETS_U.some((s) => Math.abs(u + 0.5 - s) < 3.6) || [16, 28, 48].some((s) => Math.abs(v + 0.5 - s) < 3.6)
    || (v > RIVER[1] - 1.5 && v < RIVER[3] + 0.5) || (u > CANAL[0] - 1.5 && u < CANAL[2] + 0.5 && v > 50);
  if (!onRoad) put(tree, u, v);
}

const BRIDGE_GAP = 0.8;
const riverBlocks: GridRect[] = [];
let riverFrom = RIVER[0];
for (const u of STREETS_U) { riverBlocks.push([riverFrom, RIVER[1], u - BRIDGE_GAP, RIVER[3]]); riverFrom = u + BRIDGE_GAP; }
riverBlocks.push([riverFrom, RIVER[1], RIVER[2], RIVER[3]]);

export const CITY_CAPITAL_MAP: ComposedMap = {
  id: "city_capital",
  columns: COLUMNS,
  rows: ROWS,
  base: "grass",
  ground,
  objects,
  blocks: [
    ...riverBlocks,
    // The canal, except under the south street's bridge.
    [CANAL[0], CANAL[1], CANAL[2], 47.2],
    [CANAL[0], 48.8, CANAL[2], CANAL[3]],
  ],
};

/** A spot on the capital's grid as a location-map percentage. */
export const capitalAt = (u: number, v: number) => isoPercent(CITY_CAPITAL_MAP, u, v);
