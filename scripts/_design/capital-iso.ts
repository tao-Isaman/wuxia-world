import { writeFileSync } from "fs";
import { Design, index } from "./lib";
const out = process.argv[2];
const d = new Design("city_capital", "til_heartland_brick_dirt_07");
const WALL = "kit_heartland_isowall_city_greybrick";
const ROAD = "kit_heartland_isoroad_slab";
const PLAZA = "kit_heartland_isoplaza_slab";
// Iso cells (a, b) on the 64-unit diamond grid: centre (480 + (a − b)·32, (a + b + 1)·16).

// ── Paving: the avenue (screen-vertical), the artisans' street (screen-horizontal), the market and the yamen forecourt ──
d.isoFill(PLAZA, -2, 26, -2, 26, (a, b) =>
  (Math.abs(a - b) <= 1 && a + b >= 12 && a + b <= 36) ||       // imperial avenue
  (a + b >= 29 && a + b <= 31 && Math.abs(a - b) <= 13) ||      // artisans' street
  (a >= 7 && a <= 13 && b >= 6 && b <= 11) ||                  // market square
  (a >= 4 && a <= 8 && b >= 4 && b <= 8));                     // yamen forecourt
// ── Streets to the gates and exits ──
d.kitLine(ROAD, [[5, -3], [5, 5]]);      // NE gate (home)
d.kitLine(ROAD, [[11, -2], [11, 7]]);    // to the yangzhou exit (inside the wall, on the east edge)
d.kitLine(ROAD, [[-3, 6], [5, 6]]);      // NW gate (songshan, changan)
d.kitLine(ROAD, [[11, 17], [11, 24]]);   // SW gate (inn)
d.kitLine(ROAD, [[16, 11], [25, 11]]);   // SE gate (quarry)
d.kitLine(ROAD, [[-1, 14], [13, 14]]);   // west street (qigu)
d.kitLine(ROAD, [[12, 5], [21, 5]]);     // east street (jinyiwei)

// ── City walls cutting the four corners, gates where the exits lie outside ──
d.kitLine(WALL, [[-1, -3], [-1, 24]]);   // north-west
d.kitLine(WALL, [[-3, -2], [24, -2]]);   // north-east
d.kitLine(WALL, [[21, -3], [21, 24]]);   // south-east
d.kitLine(WALL, [[-3, 20], [24, 20]]);   // south-west
d.isoGate(WALL, "b", -1, 5);
d.isoGate(WALL, "a", 4, -2);
d.isoGate(WALL, "a", 10, 20);
d.isoGate(WALL, "b", 21, 10);

// ── Buildings and props (as before, nudged off the streets) ──
d.add("bld_heartland_yamen_01", 470, 180);
d.add("bld_heartland_wine_shop_01", 640, 168, { scale: 0.75 });
d.add("bld_heartland_teahouse_02", 175, 226, { scale: 0.8 });
d.add("bld_heartland_teahouse_01", 735, 236, { scale: 0.85 });
d.add("bld_heartland_smithy_01", 200, 448, { scale: 0.75 });
d.add("prp_heartland_incense_burner_02", 330, 176, { scale: 0.9 });
d.add("prp_interior_dining_table_03", 650, 292, { scale: 0.75 });
d.add("prp_interior_guqin_table_02", 790, 330, { scale: 0.8 });
d.add("prp_heartland_crates_sacks_05", 912, 278, { scale: 0.9 });
d.add("prp_heartland_barrels_02", 918, 352, { scale: 0.8 });
d.add("prp_heartland_market_stall_03", 602, 276, { scale: 0.85 });
d.add("prp_heartland_market_stall_06", 380, 302, { scale: 0.85 });
d.add("prp_heartland_market_stall_02", 640, 362, { scale: 0.85 });
d.add("prp_heartland_well_05", 480, 350, { scale: 0.9 });
d.add("prp_heartland_stone_lion_05", 424, 430, { scale: 0.85 });
d.add("prp_heartland_stone_lion_05", 536, 430, { scale: 0.85, flip: true });
d.add("prp_heartland_market_stall_05", 336, 452, { scale: 0.7 });
d.add("prp_heartland_market_stall_07", 412, 452, { scale: 0.7 });
d.add("prp_heartland_market_stall_01", 584, 452, { scale: 0.7 });
d.add("prp_heartland_market_stall_08", 691, 452, { scale: 0.7 });
d.add("prp_heartland_market_stall_04", 797, 452, { scale: 0.7 });
d.add("prp_heartland_water_vat_03", 262, 450, { scale: 0.8 });
d.add("nat_temperate_willow_05", 70, 440, { scale: 0.8 });
d.add("nat_temperate_maple_02", 40, 330, { scale: 0.75 });
d.add("nat_temperate_maple_05", 115, 318, { scale: 0.7 });
d.add("nat_temperate_blossom_tree_04", 880, 440, { scale: 0.8 });
d.add("nat_temperate_willow_02", 880, 240, { scale: 0.75 });
d.add("prp_heartland_notice_board_01", 345, 548, { scale: 0.9 });
d.add("sct_songshan_alliance_flag", 422, 552, { scale: 0.9 });
d.add("sct_jinyiwei_horse_post", 620, 552);
d.add("prp_heartland_haystack_02", 660, 566, { scale: 0.8 });
d.add("prp_heartland_handcart_05", 535, 568, { scale: 0.8 });
d.add("nat_temperate_boulder_02", 850, 600, { scale: 0.8 });
d.add("nat_temperate_pine_05", 20, 440, { scale: 0.7 });
d.add("nat_temperate_pine_06", 130, 40, { scale: 0.7 });
d.add("nat_temperate_maple_06", 860, 60, { scale: 0.7 });
// Outskirts beyond the walls: trees, fields, rocks.
for (const [id, x, y, sc] of [
  ["nat_temperate_pine_01", 40, 70, 0.8], ["nat_temperate_pine_07", 205, 30, 0.7], ["nat_temperate_maple_03", 330, 20, 0.6],
  ["nat_temperate_pine_04", 920, 120, 0.7], ["nat_temperate_willow_07", 640, 20, 0.6],
  ["prp_heartland_veg_plot_02", 60, 520, 0.9], ["prp_heartland_veg_plot_05", 150, 600, 0.9], ["prp_heartland_scarecrow_03", 40, 600, 0.9],
  ["nat_temperate_boulder_05", 925, 590, 0.8], ["nat_temperate_boulder_03", 800, 625, 0.8], ["nat_temperate_bush_04", 700, 615, 1],
  ["nat_temperate_bush_06", 280, 625, 1], ["nat_temperate_maple_08", 935, 500, 0.7],
] as const) d.add(id, x, y, { scale: sc });
for (const x of [440, 520]) for (const y of [250]) d.add("prp_heartland_street_lantern_07", x, y, { scale: 0.8 });

// ── Fill the blocks: buildings packed close, never on a street, over a marker or in front of one ──
{
  const { index, kits } = await import("./lib");
  const { kitCells, cellAt } = await import("@/lib/assets/kits");
  const { placementGeometry } = await import("@/lib/assets/placement-geometry");
  const { mapAnchors } = await import("@/lib/stage/map-anchors");
  const { getLocationMap } = await import("@/lib/world/data/location-maps");
  const paved = new Set<string>();
  for (const set of [ROAD, PLAZA]) for (const k of kitCells(d.list, index, set).keys()) paved.add(k);
  const wallGrid = kits.get(WALL)!;
  const onPaving = (x: number, y: number) => { const c = cellAt(wallGrid, x, y); return paved.has(`${c.col},${c.row}`); };
  const inside = (x: number, y: number) => { const c = cellAt(wallGrid, x, y); return c.col >= 0 && c.col <= 20 && c.row >= -1 && c.row <= 19; };
  const anchors = mapAnchors(getLocationMap("city_capital")!, "city_capital");
  type R = { l: number; t: number; r: number; b: number };
  const hit = (p: R, q: R) => p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
  const solidsOf = () => d.list.flatMap((p) => { const a = index.get(p.asset)!; const g = placementGeometry(p, a); return g.blocks ? g.solids.map((s) => ({ l: s.left, t: s.top, r: s.right, b: s.bottom })) : []; });
  const boxes = () => d.list.filter((p) => index.get(p.asset)!.category === "building").map((p) => { const g = placementGeometry(p, index.get(p.asset)!); return { l: g.box.left, t: g.box.top, r: g.box.right, b: g.box.bottom, y: p.y }; });
  const POOL = ["bld_heartland_pharmacy_01", "bld_heartland_pharmacy_02", "bld_heartland_pharmacy_03", "bld_heartland_pharmacy_04",
    "bld_heartland_teahouse_02", "bld_heartland_teahouse_03", "bld_heartland_wine_shop_01", "bld_heartland_wine_shop_02", "bld_heartland_wine_shop_03",
    "bld_heartland_wine_shop_04", "bld_heartland_granary_02", "bld_heartland_shrine_hall_03", "bld_heartland_courtyard_house_01",
    "bld_heartland_smithy_02", "bld_heartland_smithy_04", "bld_heartland_shrine_hall_04", "bld_heartland_granary_01"];
  let seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  let added = 0;
  // Candidate spots on a half-cell iso lattice, closest to the paving first, so
  // buildings line the streets and squares; each faces the street it is on.
  const { isoCenter } = await import("@/lib/assets/kits");
  const near = (a: number, b: number) => {
    let best = 9, side: "a" | "b" | null = null;
    for (let da = -3; da <= 3; da++) for (let db = -3; db <= 3; db++) {
      if (!paved.has(`${Math.round(a + da)},${Math.round(b + db)}`)) continue;
      const dist = Math.hypot(da, db);
      if (dist < best) { best = dist; side = Math.abs(da) >= Math.abs(db) ? (da > 0 ? "a" : null) : (db > 0 ? "b" : null); }
    }
    return { dist: best, side };
  };
  const spots: { x: number; y: number; dist: number; side: "a" | "b" | null }[] = [];
  for (let a = -1; a <= 21; a += 0.5) for (let b = -2; b <= 20; b += 0.5) {
    const c = isoCenter(64, a, b);
    if (c.x < 30 || c.x > 930 || c.y < 60 || c.y > 600) continue;
    if (paved.has(`${Math.round(a)},${Math.round(b)}`)) continue;
    const n = near(a, b);
    if (n.dist > 3) continue;
    spots.push({ ...c, ...n });
  }
  spots.sort((p, q) => p.dist - q.dist || p.y - q.y);
  for (const spot of spots) {
    const { x, y } = spot;
    for (let attempt = 0; attempt < 4; attempt++) {
      const id = POOL[Math.floor(rand() * POOL.length)];
      const asset = index.get(id)!;
      const scale = 0.56 + rand() * 0.14;
      // Fronts face down-left; mirrored, down-right — toward the street.
      const flip = spot.side === "a" && asset.flippable;
      const g = placementGeometry({ id: "probe", asset: id, x, y, scale, flip }, asset);
      const fp = g.footprint!;
      const corners = [[fp.left, fp.top], [fp.right, fp.top], [fp.left, fp.bottom], [fp.right, fp.bottom], [(fp.left + fp.right) / 2, fp.bottom], [(fp.left + fp.right) / 2, fp.top]];
      if (corners.some(([cx, cy]) => onPaving(cx, cy) || !inside(cx, cy))) continue;
      if (g.box.top < -30 || g.box.left < -10 || g.box.right > 970) continue;
      const pad = { l: fp.left - 3, t: fp.top - 2, r: fp.right + 3, b: fp.bottom + 2 };
      if (solidsOf().some((q) => hit(q, pad))) continue;
      const box = { l: g.box.left, t: g.box.top, r: g.box.right, b: g.box.bottom };
      let bad = false;
      for (const m of anchors) {
        const person = m.kind === "npc" || m.kind === "spawn" || m.kind === "arrival";
        const mark = { l: m.x - 16, t: m.y - 12, r: m.x + 16, b: m.y + 30 };
        if (hit(mark, { l: fp.left, t: fp.top, r: fp.right, b: fp.bottom })) { bad = true; break; }
        if (person && y > m.y && hit({ l: m.x - 12, t: m.y - 52, r: m.x + 12, b: m.y }, box)) { bad = true; break; }
      }
      if (bad) continue;
      d.add(id, x, y, { scale: Math.round(scale * 100) / 100, ...(flip ? { flip: true } : {}) });
      added++;
      break;
    }
  }
  console.log("filled", added, "buildings");
  // Second pass: market clutter on the square and the plazas' edges (not the avenue, not the streets).
  const roadCells = new Set(kitCells(d.list, index, ROAD).keys());
  const PROPS = ["prp_heartland_market_stall_02", "prp_heartland_market_stall_04", "prp_heartland_market_stall_06", "prp_heartland_market_stall_08",
    "prp_heartland_crates_sacks_02", "prp_heartland_barrels_05", "prp_heartland_handcart_01", "prp_heartland_water_vat_05",
    "prp_heartland_pottery_03", "prp_heartland_street_lantern_02", "prp_heartland_crates_sacks_07"];
  let props = 0;
  for (let y = 230; y <= 540; y += 12) for (let x = 330; x <= 700; x += 14) {
    const c = cellAt(wallGrid, x, y);
    if (!paved.has(`${c.col},${c.row}`) || roadCells.has(`${c.col},${c.row}`) || Math.abs(c.col - c.row) <= 1) continue;
    if (rand() > 0.5) continue;
    const id = PROPS[Math.floor(rand() * PROPS.length)];
    const asset = index.get(id)!;
    const scale = id.includes("stall") ? 0.68 : 0.85;
    const g = placementGeometry({ id: "probe", asset: id, x, y, scale }, asset);
    const fp = g.footprint!;
    if (solidsOf().some((q) => hit(q, { l: fp.left - 10, t: fp.top - 8, r: fp.right + 10, b: fp.bottom + 8 }))) continue;
    const box = { l: g.box.left, t: g.box.top, r: g.box.right, b: g.box.bottom };
    let bad = false;
    for (const m of anchors) {
      const person = m.kind === "npc" || m.kind === "spawn" || m.kind === "arrival";
      if (hit({ l: m.x - 20, t: m.y - 16, r: m.x + 20, b: m.y + 34 }, { l: fp.left, t: fp.top, r: fp.right, b: fp.bottom })) { bad = true; break; }
      if (person && y > m.y && hit({ l: m.x - 12, t: m.y - 52, r: m.x + 12, b: m.y }, box)) { bad = true; break; }
    }
    if (bad) continue;
    d.add(id, x, y, { scale, ...(rand() < 0.5 && asset.flippable ? { flip: true } : {}) });
    props++;
  }
  console.log("market props", props);
}

// Drop whatever still covers a marker (the checker is the editor's own).
for (let pass = 0; pass < 5; pass++) {
  const bad = new Set(d.check().flatMap((i) => i.placementId ? [i.placementId] : []));
  if (!bad.size) break;
  d.list = d.list.filter((p) => !bad.has(p.id) || index.get(p.asset)!.category === "kit");
}
writeFileSync(out + ".json", JSON.stringify(d.file(), null, 1));
const issues = d.check();
console.log(d.list.length, "placements;", issues.length, "issues", issues.map((i) => `${i.reason}:${i.anchor.id}:${i.placementId ? d.list.find((p) => p.id === i.placementId)?.asset : ""}`).join(" | "));
await d.render(out + ".png", { markers: true });
