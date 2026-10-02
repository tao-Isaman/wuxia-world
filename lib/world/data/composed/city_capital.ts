import type { ComposedMap, ComposedObject, GroundArea } from "./types";

// นครหลวง, built from assets: 3072 × 2048 units, ten times the area of the old
// 960 × 640 painting. North is up. The layout keeps the old map's plan — the
// palace forecourt at the top, the market plaza in the middle, the craftsmen's
// row and the walled south gate at the bottom — so its exits (location-maps.ts)
// still face their destinations on the world map.
//
//   y  110–190   north ring road (to the fields, Songshan and the palace walk)
//   y  560–780   palace forecourt          x 1180–1900
//   y  780–880   the great east–west avenue (Chang'an west, the inn east)
//   y  880–1330  market plaza              x 1100–1980
//   y 1440–1640  craftsmen's street, shops on its north side
//   y 1960       the south wall and gate; a canal runs out of it in the south-west

const W = 3072, H = 2048;

const ground: GroundArea[] = [
  { material: "dirt", x: 0, y: 110, w: W, h: 80 },                    // north ring road
  { material: "dirt", x: 820, y: 190, w: 80, h: 590 },                // lane up to the fields
  { material: "dirt", x: 200, y: 190, w: 80, h: 590 },                // trail to Songshan
  { material: "paving", x: 2620, y: 190, w: 90, h: 590, edge: true }, // palace walk
  { material: "paving", x: 1180, y: 560, w: 720, h: 220, edge: true },// palace forecourt
  { material: "paving", x: 0, y: 780, w: W, h: 100, edge: true },     // the great avenue
  { material: "dirt", x: 2300, y: 540, w: W - 2300, h: 80 },          // east lane to the guard gate
  { material: "plaza", x: 1100, y: 880, w: 880, h: 450, edge: true }, // market plaza
  { material: "paving", x: 1440, y: 880, w: 192, h: 1080 },           // south avenue to the gate
  { material: "dirt", x: 1980, y: 1230, w: W - 1980, h: 80 },         // old alley east (to Yuelai inn)
  { material: "paving", x: 300, y: 1440, w: 2500, h: 200, edge: true },// craftsmen's street
  { material: "dirt", x: 100, y: 1640, w: 280, h: 240 },              // canal landing
  { material: "water", x: 380, y: 1100, w: 100, h: H - 1100, edge: true }, // the grand canal
];

const objects: ComposedObject[] = [];
const put = (asset: string, x: number, y: number, extra: Partial<ComposedObject> = {}) => objects.push({ asset, x, y, ...extra });

// ── North: palace gate, pagoda, temple, the north side of the avenue ──
put("palace_gate", 1540, 560);
put("stone_lion", 1330, 600); put("stone_lion", 1750, 600, { flip: true });
put("pagoda", 2120, 520);
put("temple", 520, 520);
put("shop_general", 768, 740);
put("yamen", 1000, 330, { scale: 0.9 });
put("granary", 2420, 360); put("granary", 2860, 360, { flip: true });
put("house_c", 2420, 760, { scale: 0.85 });
put("house_a", 2900, 470, { scale: 0.85 });
put("house_b", 380, 760, { scale: 0.9 });
for (const x of [60, 1250, 1830, 2250]) put("tree_pine", x, 300);
for (const x of [140, 2000]) put("tree_maple", x, 720);
for (const x of [1300, 1780]) put("tree_willow", x, 470);
put("rock_garden", 2000, 300);
put("flower_bed", 1215, 580); put("flower_bed", 1865, 580);

// ── The avenue: lanterns along both sides ──
for (const x of [600, 1000, 1300, 1780, 2100, 2500, 2900]) { put("lantern_post", x, 776); put("lantern_post", x, 900); }

// ── West: houses, the woodlot, the canal ──
put("house_a", 760, 1080); put("house_c", 980, 1300, { scale: 0.9 }); put("house_b", 680, 1330, { flip: true });
for (const [x, y] of [[90, 980], [210, 1080], [70, 1220], [190, 1330], [300, 990]]) put("tree_pine", x, y);
put("tree_willow", 300, 1250); put("tree_willow", 560, 1620);
put("notice_board", 1060, 930);

// ── Market plaza ──
put("well", 1250, 1130);
put("stall_fruit", 1720, 960); put("stall_cloth", 1860, 980); put("stall_pottery", 1700, 1070);
put("stall_food", 1905, 1150);
put("stall_fruit", 1200, 1000, { flip: true }); put("stall_pottery", 1330, 960);
put("cart", 1360, 1250); put("crates", 1790, 1270);
put("lantern_post", 1110, 1320); put("lantern_post", 1970, 1320);

// ── East: the inn, its yard, the alley ──
put("inn", 2300, 770);
put("house_c", 2850, 760, { scale: 0.85 });
put("house_a", 2200, 1180); put("house_b", 2560, 1200);
put("house_c", 2900, 1180, { scale: 0.9, flip: true });
put("crates", 2700, 1000); put("cart", 2840, 1020, { flip: true });
put("tree_plum", 2440, 1000); put("tree_maple", 3000, 960);

// ── Craftsmen's row (north side of the street, doors facing south) ──
put("smithy", 645, 1440);
put("shop_apothecary", 1014, 1440);
put("shop_cloth", 1260, 1440);
put("shop_general", 1843, 1440, { flip: true });
put("shop_cloth", 2150, 1440, { flip: true });
put("shop_apothecary", 2458, 1440, { flip: true });
put("house_a", 2720, 1440, { scale: 0.85 });
for (const x of [800, 1360, 1720, 2300, 2620]) put("lantern_post", x, 1640);

// ── South: the wall and gate, the canal landing, the quarry corner ──
put("gate_tower", 1536, 1960);
for (const x of [710, 1076, 1996, 2382, 2842]) put("wall_segment", x, 1960);
put("wall_segment", 190, 1960, { scale: 0.83 });
put("bridge", 430, 1580);
put("crates", 250, 1760); put("cart", 160, 1690);
put("tree_willow", 600, 1840); put("house_b", 1000, 1880, { scale: 0.8 });
put("granary", 2100, 1880, { scale: 0.85 });
put("rock_garden", 2820, 1800); put("crates", 2700, 1850);
put("tree_pine", 2400, 1820);

export const CITY_CAPITAL_MAP: ComposedMap = {
  id: "city_capital",
  width: W,
  height: H,
  base: "grass",
  ground,
  objects,
  // The canal is water except where the bridge crosses the craftsmen's street.
  blocks: [
    { left: 380, top: 1100, right: 480, bottom: 1520 },
    { left: 380, top: 1630, right: 480, bottom: H },
  ],
};
