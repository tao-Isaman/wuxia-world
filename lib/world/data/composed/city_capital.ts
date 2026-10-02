import type { ComposedMap, ComposedObject, GroundArea } from "./types";
import { composedAsset } from "./assets";

// นครหลวง, built from assets: 3072 × 2048 units (ten times the old painting's
// area), walled on every side like a real city. North is up. The plan keeps
// the old map's anchors — the palace forecourt, the market plaza, the
// craftsmen's row and the south gate — so its exits (location-maps.ts) still
// face their destinations, and adds the districts of a capital:
//
//   y  300       north wall: gates to the Songshan trail, the fields and the palace walk
//   y  300–380   north lane inside the wall
//   y  380–780   temple and government hall (west) · palace forecourt · flower garden, pagoda, mansion (east)
//   y  780–880   the great avenue, out through the west gate to Chang'an
//   y  880–1330  escort agency (west) · market plaza · teahouse, pawnshop, inn (east)
//   y 1230–1310  the old alley east to the Yuelai inn
//   y 1440–1640  craftsmen's street, shops on its north side
//   y 1690–1790  the river, from the east water gate to the docks
//   y 1790–2040  canal landing and the ruined temple (south-west) · houses and the quarry across the river
//   y 2040       south wall and the main gate

const W = 3072, H = 2048;
const NORTH_WALL = 300, SOUTH_WALL = 2040, WEST_WALL = 60, EAST_WALL = 3012;
const NORTH_GATES = [307, 860, 2396];

const ground: GroundArea[] = [
  // Lanes inside the walls, and the short roads out through the north gates.
  { material: "cobble", x: 140, y: NORTH_WALL, w: 2800, h: 80, edge: true },
  ...NORTH_GATES.map((x): GroundArea => ({ material: "cobble", x: x - 45, y: 0, w: 90, h: NORTH_WALL })),
  { material: "cobble", x: 0, y: 780, w: W, h: 100, edge: true },                // the great avenue
  { material: "cobble", x: 2600, y: 540, w: W - 2600, h: 80 },                   // east lane to the guard gate
  { material: "paving", x: 1180, y: 380, w: 720, h: 400, edge: true },          // palace forecourt
  { material: "paving", x: 1100, y: 880, w: 880, h: 450, edge: true },          // market plaza
  { material: "cobble", x: 1440, y: 880, w: 192, h: SOUTH_WALL - 880 },         // south avenue to the gate
  { material: "cobble", x: 1980, y: 1230, w: W - 1980, h: 80 },                 // old alley east
  { material: "paving", x: 140, y: 1440, w: 2800, h: 200, edge: true },         // craftsmen's street
  { material: "dirt", x: 1760, y: 1640, w: 1180, h: 50 },                        // the river's north bank (docks)
  { material: "water", x: 1760, y: 1690, w: W - 1760, h: 100, edge: true },     // the river
  { material: "dirt", x: 140, y: 1640, w: 240, h: 300 },                         // canal landing
  { material: "water", x: 380, y: 1100, w: 100, h: H - 1100, edge: true },      // the grand canal
  { material: "dirt", x: 2440, y: 1790, w: 500, h: 220 },                        // quarry yard
  { material: "grass", x: 1990, y: 400, w: 340, h: 330 },                        // inside the flower garden
];

const objects: ComposedObject[] = [];
const put = (asset: string, x: number, y: number, extra: Partial<ComposedObject> = {}) => objects.push({ asset, x, y, ...extra });
/** Fill a stretch of horizontal wall exactly, with pieces scaled to fit. */
const wallRun = (from: number, to: number, y: number) => {
  const span = to - from, pieces = Math.max(1, Math.round(span / 440)), width = span / pieces;
  for (let i = 0; i < pieces; i++) put("wall_segment", from + width * (i + 0.5), y, { scale: width / 460 });
};

// ── The walls ──────────────────────────────────────────────────────────
// North wall, open at the three gates.
const gateHalf = 128;
wallRun(160, NORTH_GATES[0] - gateHalf, NORTH_WALL);
wallRun(NORTH_GATES[0] + gateHalf, NORTH_GATES[1] - gateHalf, NORTH_WALL);
wallRun(NORTH_GATES[1] + gateHalf, NORTH_GATES[2] - gateHalf, NORTH_WALL);
wallRun(NORTH_GATES[2] + gateHalf, 2930, NORTH_WALL);
for (const x of NORTH_GATES) put("gate_tower", x, NORTH_WALL + 6, { scale: 0.55 });
// South wall, the main gate, and the canal's water gate.
put("gate_tower", 1536, SOUTH_WALL + 4, { scale: 0.62 });
wallRun(160, 380, SOUTH_WALL); wallRun(480, 1448, SOUTH_WALL); wallRun(1624, 2930, SOUTH_WALL);
// Side walls: vertical pieces stretched to fill each run exactly, open at the
// west gate, the east lane, the alley and the river.
const sideHeight = (composedAsset("wall_side")?.height ?? 400) * 0.98;
const wallColumn = (x: number, from: number, to: number) => {
  const span = to - from, pieces = Math.max(1, Math.round(span / sideHeight)), each = span / pieces;
  for (let i = 1; i <= pieces; i++) put("wall_side", x, from + each * i, { stretch: each / sideHeight });
};
wallColumn(WEST_WALL, NORTH_WALL, 740); wallColumn(WEST_WALL, 920, SOUTH_WALL);
wallColumn(EAST_WALL, NORTH_WALL, 520); wallColumn(EAST_WALL, 640, 1210); wallColumn(EAST_WALL, 1330, 1680); wallColumn(EAST_WALL, 1800, SOUTH_WALL);
// Corner towers, and towers either side of the west gate.
for (const [x, y] of [[WEST_WALL, NORTH_WALL], [EAST_WALL, NORTH_WALL], [WEST_WALL, SOUTH_WALL], [EAST_WALL, SOUTH_WALL]]) put("corner_tower", x, y, { scale: 0.75 });
put("corner_tower", WEST_WALL, 750, { scale: 0.6 }); put("corner_tower", WEST_WALL, 960, { scale: 0.6 });
for (const y of [500, 700]) put("lantern_post", EAST_WALL - 70, y);

// ── North-west: the Yunlin temple and the government hall ─────────────
put("temple", 470, 640);
put("pavilion", 760, 520, { scale: 0.8 });
put("bamboo", 200, 480); put("bamboo", 290, 540, { scale: 0.85 }); put("bamboo", 200, 680, { scale: 0.9 });
put("tree_pine", 780, 700, { scale: 0.85 });
put("yamen", 990, 700, { scale: 0.85 });
put("stone_lion", 880, 740, { scale: 0.9 }); put("stone_lion", 1100, 740, { scale: 0.9, flip: true });

// ── North centre: the palace gate and its forecourt ───────────────────
put("palace_gate", 1540, 560);
put("stone_lion", 1330, 600); put("stone_lion", 1750, 600, { flip: true });
put("flower_bed", 1215, 580); put("flower_bed", 1865, 580);
for (const x of [1220, 1860]) put("lantern_post", x, 770);
put("tree_willow", 1240, 470, { scale: 0.85 }); put("tree_willow", 1840, 470, { scale: 0.85 });

// ── North-east: the flower garden, the pagoda, a mansion ──────────────
put("garden_wall", 2160, 742);
put("pavilion", 2160, 560);
put("rock_garden", 2060, 690, { scale: 0.8 });
put("tree_plum", 2030, 470, { scale: 0.85 }); put("tree_plum", 2290, 480, { scale: 0.8 });
put("flower_bed", 2270, 690, { scale: 0.8 });
put("bamboo", 2320, 600, { scale: 0.7 });
put("pagoda", 2480, 520, { scale: 0.72 });
put("mansion", 2750, 470, { scale: 0.78 });
put("stone_lion", 2650, 500, { scale: 0.8 }); put("stone_lion", 2850, 500, { scale: 0.8, flip: true });
put("house_c", 2650, 760, { scale: 0.8 }); put("house_a", 2860, 760, { scale: 0.8, flip: true });

// ── The great avenue ──────────────────────────────────────────────────
for (const x of [300, 640, 1000, 1300, 1780, 2100, 2500, 2820]) { put("lantern_post", x, 776); put("lantern_post", x, 900); }
put("shop_general", 640, 740, { scale: 0.9 });
put("house_b", 380, 760, { scale: 0.85 });

// ── West: the escort agency ───────────────────────────────────────────
put("escort_agency", 560, 1140);
put("lantern_post", 330, 1180); put("lantern_post", 790, 1180);
put("cart", 470, 1230); put("crates", 680, 1240);
for (const [x, y] of [[180, 1000], [200, 1290], [260, 1360]]) put("tree_pine", x, y, { scale: 0.85 });
put("tree_maple", 900, 980, { scale: 0.8 });
put("house_c", 950, 1360, { scale: 0.75 });
put("notice_board", 1060, 930);

// ── Market plaza ──────────────────────────────────────────────────────
put("well", 1250, 1130);
put("stall_fruit", 1720, 960); put("stall_cloth", 1860, 980); put("stall_pottery", 1700, 1070);
put("stall_food", 1905, 1150);
put("stall_fruit", 1200, 1000, { flip: true }); put("stall_pottery", 1330, 960);
put("cart", 1360, 1250); put("crates", 1790, 1270);
put("bench", 1180, 1290); put("bench", 1900, 1290);
put("lantern_post", 1110, 1320); put("lantern_post", 1970, 1320);

// ── East: teahouse, pawnshop, inn ─────────────────────────────────────
put("teahouse", 2150, 1000, { scale: 0.75 });
put("bench", 2060, 1110); put("bench", 2250, 1110);
put("inn", 2560, 1180, { scale: 0.85 });
put("pawnshop", 2860, 960, { scale: 0.8 });
put("crates", 2920, 1100); put("tree_plum", 2860, 1190, { scale: 0.75 });

// ── Craftsmen's row (north side of the street, doors facing south) ────
put("smithy", 645, 1440);
put("shop_apothecary", 1014, 1440);
put("shop_cloth", 1260, 1440);
put("shop_general", 1843, 1440, { flip: true });
put("shop_cloth", 2150, 1440, { flip: true });
put("shop_apothecary", 2458, 1440, { flip: true });
put("house_a", 2720, 1440, { scale: 0.85 });
put("house_c", 260, 1440, { scale: 0.8 });
for (const x of [800, 1360, 1720, 2600]) put("lantern_post", x, 1636);

// ── The river: docks and boats on the north bank, a bridge south ──────
put("dock", 2050, 1700, { scale: 0.8 }); put("dock", 2750, 1700, { scale: 0.8 });
put("boat", 2240, 1770, { scale: 0.55 }); put("boat", 2600, 1780, { scale: 0.5, flip: true });
put("bridge_ns", 2400, 1830);
put("crates", 1900, 1670); put("crates", 2900, 1665);

// ── South-west: canal landing and the south quarter ───────────────────
put("bridge", 430, 1580);
put("dock", 250, 1760, { scale: 0.55 });
put("boat", 430, 1880, { scale: 0.42 });
put("crates", 200, 1660); put("cart", 300, 1920);
put("tree_willow", 600, 1840);
put("house_a", 760, 1830, { scale: 0.85 });
put("ruined_temple", 1150, 1880, { scale: 0.7 });
put("tree_plum", 1340, 1900, { scale: 0.8 }); put("tree_plum", 1740, 1900, { scale: 0.8 });
put("crates", 1700, 1700);

// ── Across the river: houses and the quarry ───────────────────────────
put("house_b", 2000, 1930, { scale: 0.8 }); put("house_c", 2230, 1930, { scale: 0.75, flip: true });
put("rock_garden", 2780, 1850); put("crates", 2640, 1880); put("crates", 2560, 1960);
put("tree_pine", 2900, 1990, { scale: 0.8 });

export const CITY_CAPITAL_MAP: ComposedMap = {
  id: "city_capital",
  width: W,
  height: H,
  base: "grass",
  ground,
  objects,
  blocks: [
    // The canal, except where the bridge crosses the craftsmen's street.
    { left: 380, top: 1100, right: 480, bottom: 1520 },
    { left: 380, top: 1630, right: 480, bottom: H },
    // The river, except under the bridge.
    { left: 1760, top: 1690, right: 2360, bottom: 1790 },
    { left: 2440, top: 1690, right: W, bottom: 1790 },
  ],
};
