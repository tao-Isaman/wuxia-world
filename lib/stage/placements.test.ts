import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { getLocationMap } from "../world/data/location-maps";
import { AUTO_MAP_IDS } from "../world/data/auto-map-ids";
import {
  blockingRects, byDepth, characterDepth, heroDepth, placementGeometry, placementsGeometry,
} from "../assets/placement-geometry";
import { indexAssets } from "../assets/catalog";
import { KIT_E, KIT_N, KIT_S, KIT_W, cellLine, kitAnchor, kitCellOf, kitSets, maskAt, kitCells, paintKit, placeKitSpecial, snapToKit } from "../assets/kits";
import type { AssetEntry, AssetManifest, Placement, PlacementsFile } from "../assets/types";
import { mapAnchors, placementIssues } from "./map-anchors";
import {
  moveOnWorldGround, planWorldPath, withPlacedSolids, worldFootprints, worldPointBlocked, worldSegmentClear,
} from "./world-navigation";

/** A 96 × 96 px crate drawn 48 × 48 map units, anchored at its base centre, with a 40 × 24 footprint. */
function asset(overrides: Partial<AssetEntry> = {}): AssetEntry {
  return {
    id: "prop_any_crate", name: "ลังไม้", category: "prop", subcategory: "crate", region: "any", tags: [],
    image: "/assets/prop/crate.png", width: 96, height: 96, mapWidth: 48, mapHeight: 48, anchorX: 48, anchorY: 90,
    footprint: { x: -20, y: -24, w: 40, h: 24 }, layer: "object", flippable: true,
    source: { tool: "test", prompt: "", size: 96 }, status: "approved", ...overrides,
  };
}
const crate = asset();
const place = (x: number, y: number, extra: Partial<Placement> = {}): Placement => ({ id: `p_${x}_${y}`, asset: crate.id, x, y, ...extra });
const MAP_IDS = ["home_player", "city_capital", "jail", ...AUTO_MAP_IDS];

test("a placement draws at its anchor, sized and mirrored about it", () => {
  const g = placementGeometry(place(300, 400), crate);
  assert.equal(g.width, 48);
  assert.equal(g.height, 48);
  assert.deepEqual(g.box, { left: 276, top: 355, right: 324, bottom: 403 });
  const scaled = placementGeometry(place(300, 400, { scale: 2 }), crate);
  assert.deepEqual(scaled.box, { left: 252, top: 310, right: 348, bottom: 406 });
  // An off-centre anchor: the mirrored box swaps its sides about x.
  const lopsided = asset({ anchorX: 24 });
  assert.deepEqual(placementGeometry(place(300, 400), lopsided).box.left, 288);
  assert.deepEqual(placementGeometry(place(300, 400, { flip: true }), lopsided).box.right, 312);
  const footprint = asset({ footprint: { x: -30, y: -10, w: 20, h: 10 } });
  assert.deepEqual(placementGeometry(place(300, 400, { flip: true }), footprint).footprint, { left: 310, top: 390, right: 330, bottom: 400 });
  assert.deepEqual(placementGeometry(place(300, 400, { scale: 0.5 }), crate).footprint, { left: 290, top: 388, right: 310, bottom: 400 });
});

test("the 8-direction view, layer and collide overrides apply", () => {
  const eight = asset({ views: { S: "/a/s.png", E: "/a/e.png" } });
  assert.equal(placementGeometry(place(1, 1, { dir: "E" }), eight).image, "/a/e.png");
  assert.equal(placementGeometry(place(1, 1, { dir: "NW" }), eight).image, crate.image);
  assert.equal(placementGeometry(place(1, 1), crate).blocks, true);
  assert.equal(placementGeometry(place(1, 1, { collide: false }), crate).blocks, false);
  assert.equal(placementGeometry(place(1, 1, { collide: true }), asset({ footprint: null })).blocks, false);
  assert.equal(placementGeometry(place(1, 1, { layer: "overhead" }), crate).layer, "overhead");
});

test("depth: ground under every character, objects sort with them by base y, overhead over all", () => {
  const ground = placementGeometry(place(500, 639, { layer: "ground" }), crate);
  const object = placementGeometry(place(500, 300), crate);
  const overhead = placementGeometry(place(500, 0, { layer: "overhead" }), crate);
  assert.ok(ground.depth > -1 && ground.depth < 1, "ground sits on the painting, under shadows");
  assert.ok(object.depth > characterDepth(299) && object.depth < characterDepth(301));
  assert.ok(object.depth < heroDepth(300), "the hero on the same line stands in front");
  assert.ok(object.depth > heroDepth(299), "a hero further up the map is behind it");
  assert.ok(overhead.depth > heroDepth(640) && overhead.depth < 8000, "over characters, under signs and the night veil");
  assert.deepEqual(byDepth([overhead, ground, object]).map((g) => g.layer), ["ground", "object", "overhead"]);
});

test("a placed footprint blocks walking and paths route around it", () => {
  const open = worldFootprints("other_map", "/maps/other.png");
  const solids = withPlacedSolids(open, blockingRects([placementGeometry(place(500, 300), crate)]));
  assert.equal(solids.length, 1);
  // Straight east into the crate stops at its west face (minus the foot radius).
  const stopped = moveOnWorldGround({ x: 400, y: 290 }, { x: 200, y: 0 }, solids);
  assert.ok(stopped.x <= 474 && stopped.x > 470, `stopped at ${stopped.x}`);
  assert.equal(worldPointBlocked(stopped, solids), false);
  // A tap beyond it plans a detour whose every leg is clear.
  const start = { x: 400, y: 290 }, end = { x: 600, y: 290 };
  const path = planWorldPath(start, end, solids);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), end);
  let previous = start;
  for (const point of path) { assert.equal(worldSegmentClear(previous, point, solids), true); previous = point; }
  // Walk-through decoration (collide: false) never blocks.
  const deco = withPlacedSolids(open, blockingRects([placementGeometry(place(500, 300, { collide: false }), crate)]));
  assert.deepEqual(planWorldPath(start, end, deco), [end]);
});

test("a map without placements is unchanged", () => {
  for (const id of ["home_player", "city_capital", "village"]) {
    const map = getLocationMap(id)!;
    const base = worldFootprints(id, map.image);
    assert.equal(withPlacedSolids(base, []), base);
    assert.equal(withPlacedSolids(base, blockingRects(placementsGeometry([], indexAssets([crate])))), base);
  }
});

test("placed solids keep path planning fast", () => {
  const map = getLocationMap("city_capital")!;
  const rows = Array.from({ length: 40 }, (_, i) => place(120 + (i % 10) * 75, 140 + Math.floor(i / 10) * 40));
  const solids = withPlacedSolids(worldFootprints("city_capital", map.image), blockingRects(placementsGeometry(rows, indexAssets([crate]))));
  const started = performance.now();
  for (let i = 0; i < 5; i++) planWorldPath({ x: 480, y: 499 }, { x: 100 + i * 150, y: 120 }, solids);
  const each = (performance.now() - started) / 5;
  assert.ok(each < 250, `a path took ${each.toFixed(1)} ms`);
});

test("the checker flags a placement covering an NPC spot or sealing an exit", () => {
  const map = getLocationMap("city_capital")!;
  const anchors = mapAnchors(map);
  const npc = anchors.find((a) => a.id === "npc:city_capital_physician_lin")!;
  const covering = placementsGeometry([place(npc.x, npc.y + 10)], indexAssets([crate]));
  const issues = placementIssues("city_capital", map, covering, { reachability: false });
  assert.deepEqual(issues.map((i) => [i.anchor.id, i.placementId, i.reason]), [["npc:city_capital_physician_lin", covering[0].id, "covered"]]);
  // A wall of crates across the whole map south of the spawn cuts off the palace exit (y 88 %).
  const wallAsset = asset({ id: "prop_any_wall", mapWidth: 120, footprint: { x: -60, y: -20, w: 120, h: 20 } });
  const wall = placementsGeometry(Array.from({ length: 9 }, (_, i) => ({ id: `w${i}`, asset: wallAsset.id, x: 60 + i * 120, y: 540 })),
    indexAssets([wallAsset]));
  const cut = placementIssues("city_capital", map, wall);
  assert.ok(cut.some((i) => i.anchor.id === "exit:palace_royal" && i.reason === "unreachable"), JSON.stringify(cut.map((i) => i.anchor.id)));
  // Off to one side, nothing is flagged.
  assert.deepEqual(placementIssues("city_capital", map, placementsGeometry([place(700, 560)], indexAssets([crate]))), []);
});

test("public/assets/placements.json: known maps and assets, unique ids, nothing sealed off", () => {
  const root = join(import.meta.dirname, "../../public/assets");
  const file = JSON.parse(readFileSync(join(root, "placements.json"), "utf8")) as PlacementsFile;
  const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as AssetManifest;
  assert.equal(file.version, 1);
  const assets = indexAssets(manifest.assets);
  const problems: string[] = [];
  for (const [mapId, placements] of Object.entries(file.maps)) {
    const map = MAP_IDS.includes(mapId) ? getLocationMap(mapId) : undefined;
    if (!map) { problems.push(`${mapId}: not a painted location map`); continue; }
    const ids = new Set<string>();
    for (const p of placements) {
      if (ids.has(p.id)) problems.push(`${mapId}: duplicate placement id ${p.id}`);
      ids.add(p.id);
      if (!(p.x >= 0 && p.x <= 960 && p.y >= 0 && p.y <= 640)) problems.push(`${mapId}/${p.id}: off the map`);
      // The asset library is filled in parallel; with an empty manifest only the shape is checked.
      if (manifest.assets.length && !assets.has(p.asset)) problems.push(`${mapId}/${p.id}: unknown asset ${p.asset}`);
    }
    for (const issue of placementIssues(mapId, map, placementsGeometry(placements, assets))) {
      problems.push(`${mapId}: ${issue.placementId ?? "placements"} ${issue.reason === "covered" ? "cover" : "cut off"} ${issue.anchor.id}`);
    }
  }
  assert.deepEqual(problems, []);
});

// ── Kits (lib/assets/kits.ts): pieces that join on a grid ──

/** A test wall set: one 32-unit piece per mask, plus a 3-cell gate joining east and west. */
function kitAssets(): AssetEntry[] {
  const pieces = Array.from({ length: 16 }, (_, mask) => asset({
    id: `kit_any_wall_test_${mask}`, category: "kit", width: 32, height: 90, mapWidth: 32, mapHeight: 90, anchorX: 16, anchorY: 90,
    footprint: { x: -12, y: -28, w: 24, h: 24 }, kit: { set: "kit_any_wall_test", kind: "wall", cell: 32, mask },
  }));
  const gate = asset({
    id: "kit_any_wall_test_gate", category: "kit", width: 96, height: 90, mapWidth: 96, mapHeight: 90, anchorX: 48, anchorY: 90,
    footprint: { x: -48, y: -28, w: 96, h: 24 }, solids: [{ x: -48, y: -28, w: 33, h: 24 }, { x: 15, y: -28, w: 33, h: 24 }],
    kit: { set: "kit_any_wall_test", kind: "wall", cell: 32, mask: KIT_E | KIT_W, span: { w: 3, h: 1 }, special: "gate" },
  });
  return [...pieces, gate];
}

test("kit grid: anchors are the bottom centre of the cells a piece covers", () => {
  assert.deepEqual(kitAnchor({ cell: 32 }, 2, 3), { x: 80, y: 128 });
  assert.deepEqual(kitAnchor({ cell: 32, span: { w: 3, h: 1 } }, 2, 3), { x: 112, y: 128 });
  assert.deepEqual(kitCellOf({ cell: 32, span: { w: 3, h: 1 } }, 112, 128), { col: 2, row: 3 });
  assert.deepEqual(snapToKit({ set: "s", kind: "road", cell: 48, mask: 0 }, 100, 100), { x: 120, y: 144 });
  // A dragged line steps one side at a time, so every cell touches the last.
  const line = cellLine({ col: 0, row: 0 }, { col: 3, row: 2 });
  assert.equal(line.length, 6);
  for (let i = 1; i < line.length; i++) assert.equal(Math.abs(line[i].col - line[i - 1].col) + Math.abs(line[i].row - line[i - 1].row), 1);
});

test("kit brush: painted cells join their neighbours, erasing re-joins the rest", () => {
  const assets = kitAssets();
  const index = indexAssets(assets);
  const set = kitSets(assets).get("kit_any_wall_test")!;
  assert.equal(set.pieces.size, 16);
  assert.equal(set.specials.length, 1);
  let n = 0;
  const nextId = () => `p_${String(++n).padStart(6, "0")}`;
  // An L: three cells east, then two south.
  let list = paintKit([], index, set, [...cellLine({ col: 1, row: 1 }, { col: 3, row: 1 }), ...cellLine({ col: 3, row: 2 }, { col: 3, row: 3 })], false, nextId).placements;
  const maskOf = (col: number, row: number) => {
    const occupant = kitCells(list, index, set.set).get(`${col},${row}`);
    return occupant ? occupant.kit.mask : -1;
  };
  assert.equal(list.length, 5);
  assert.equal(maskOf(1, 1), KIT_E);
  assert.equal(maskOf(2, 1), KIT_E | KIT_W);
  assert.equal(maskOf(3, 1), KIT_W | KIT_S);
  assert.equal(maskOf(3, 2), KIT_N | KIT_S);
  assert.equal(maskOf(3, 3), KIT_N);
  // Every piece stands where its cell says.
  for (const p of list) { const kit = index.get(p.asset)!.kit!; const c = kitCellOf(kit, p.x, p.y); assert.deepEqual(kitAnchor(kit, c.col, c.row), { x: p.x, y: p.y }); }
  // Painting over a held cell changes nothing; a branch makes a T.
  assert.equal(paintKit(list, index, set, [{ col: 2, row: 1 }], false, nextId).placements.length, 5);
  list = paintKit(list, index, set, [{ col: 2, row: 0 }], false, nextId).placements;
  assert.equal(maskOf(2, 1), KIT_E | KIT_W | KIT_N);
  assert.equal(maskOf(2, 0), KIT_S);
  // Erasing the corner leaves two ends.
  list = paintKit(list, index, set, [{ col: 3, row: 1 }], true, nextId).placements;
  assert.equal(maskOf(3, 1), -1);
  assert.equal(maskOf(2, 1), KIT_W | KIT_N);
  assert.equal(maskOf(3, 2), KIT_S);
  // Off the map: nothing.
  assert.equal(paintKit(list, index, set, [{ col: -1, row: 0 }, { col: 30, row: 0 }, { col: 0, row: 20 }], false, nextId).placements.length, list.length);
});

test("kit gates replace the run under them, the run joins them, and their passage stays open", () => {
  const assets = kitAssets();
  const index = indexAssets(assets);
  const set = kitSets(assets).get("kit_any_wall_test")!;
  let n = 0;
  const nextId = () => `p_${String(++n).padStart(6, "0")}`;
  let list = paintKit([], index, set, cellLine({ col: 2, row: 10 }, { col: 10, row: 10 }), false, nextId).placements;
  assert.equal(list.length, 9);
  list = placeKitSpecial(list, index, set, set.specials[0], 5, 10, "p_gate").placements;
  assert.equal(list.length, 7);
  const cells = kitCells(list, index, set.set);
  assert.equal(cells.get("6,10")!.placement.id, "p_gate");
  assert.equal(maskAt(cells, 4, 10), KIT_E | KIT_W);
  assert.equal(index.get(list.find((p) => p.x === kitAnchor({ cell: 32 }, 4, 10).x)!.asset)!.kit!.mask, KIT_E | KIT_W);
  // The brush leaves the gate alone.
  assert.equal(paintKit(list, index, set, [{ col: 6, row: 10 }], true, nextId).placements.length, 7);
  // Its two piers block; the middle cell lets the hero through.
  const gate = placementGeometry(list.find((p) => p.id === "p_gate")!, index.get("kit_any_wall_test_gate")!);
  assert.equal(gate.solids.length, 2);
  const solids = blockingRects([gate]);
  const middle = { x: 6.5 * 32, y: 10.5 * 32 };
  assert.ok(!solids.some((r) => middle.x >= r.left && middle.x < r.right && middle.y >= r.top && middle.y < r.bottom));
  assert.ok(solids.some((r) => 5.2 * 32 >= r.left && 5.2 * 32 < r.right && middle.y >= r.top && middle.y < r.bottom));
});

test("public/assets kits: every set has a piece for all 16 joins, on its grid", () => {
  const manifest = JSON.parse(readFileSync(join(import.meta.dirname, "../../public/assets/manifest.json"), "utf8")) as AssetManifest;
  const sets = kitSets(manifest.assets);
  assert.ok(sets.size >= 20, `${sets.size} kit sets`);
  const kinds = new Set<string>([...sets.values()].map((s) => s.set.includes("_wall_city_") ? "city" : s.kind));
  for (const kind of ["road", "city", "wall", "fence"]) assert.ok(kinds.has(kind), `no ${kind} kit`);
  for (const set of sets.values()) {
    for (let mask = 0; mask < 16; mask++) assert.ok(set.pieces.get(mask)?.length, `${set.set}: no piece for ${mask}`);
    for (const list of set.pieces.values()) for (const a of list) {
      assert.equal(a.kit!.cell, set.cell, a.id);
      assert.equal(a.mapWidth, set.cell, `${a.id}: one cell wide`);
      assert.equal(a.anchorX, a.width / 2, a.id);
      assert.equal(a.anchorY, a.height, a.id);
      assert.equal(a.layer, set.kind === "road" ? "ground" : "object", a.id);
    }
    if (set.kind !== "road") assert.ok(set.specials.some((s) => s.kit!.special === "gate"), `${set.set}: no gate`);
  }
});
