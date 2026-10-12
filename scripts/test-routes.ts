// Directional roads: compass exits, 8-way road paintings, arriving on the side you came in.
//   bun run test:routes
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { SCENES } from "../lib/world/data";
import { getLocationMap } from "../lib/world/data/location-maps";
import { getRouteMap, routeDirection, routeGeometry } from "../lib/world/data/route-maps";
import { WORLD_COORDS } from "../lib/world/data/world-coords";
import { LOCATION_ROUTES, isWalkable } from "../lib/world/data/location-routes";
import { ferryStops } from "../lib/world/ferries";
import { getScene } from "../lib/world/data/scenes";
import { AUTO_MAP_EXIT_POINTS } from "../lib/world/data/auto-map-exits";
import { DIR8, angleGap, dir8Of, dirVector, mapPointAngle, mapPointDir, oppositeDir, worldBearing } from "../lib/world/compass";
import { setArrivalFrom, peekArrivalFrom, clearArrivalFrom, clearMapPositions } from "../lib/stage/types";
import { initialWorldPlacement } from "../lib/stage/world-placement";
import { ROUTE_GRADES, gradePixels } from "../lib/stage/route-grade";
import { CENTRAL_RADIUS, regionAt, regionOf } from "../lib/world/data/regions";
import { ATLAS_IMAGE, ATLAS_REGIONS, ATLAS_SIZE, atlasNeighbours, atlasPlaces, atlasPosition, atlasRoads, atlasRoute, regionLabelPoint, regionPolygon, routingOrigin } from "../lib/world/world-atlas";

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const routes = SCENES.filter((s) => s.kind === "route" && s.id.startsWith("route_") && s.id.includes("__to__"));
const ends = (id: string) => id.slice("route_".length).split("__to__") as [string, string];

check("world coordinates are current and cover every place joined by a road", () => {
  execSync("bun scripts/build-world-coords.ts --check", { stdio: "pipe" });
  // The tutorial road (home → the foothill village) is not on the world map.
  for (const r of LOCATION_ROUTES) for (const id of [r.a, r.b]) assert.ok(WORLD_COORDS[id], `${id} has a world spot`);
});

check("compass helpers: eight directions, opposites, map-point sides", () => {
  assert.equal(DIR8.length, 8);
  for (const d of DIR8) { const v = dirVector(d); assert.equal(dir8Of(v.x, v.y), d); assert.equal(oppositeDir(oppositeDir(d)), d); }
  assert.equal(mapPointDir({ x: 95, y: 52 }), "E");
  assert.equal(mapPointDir({ x: 50, y: 92 }), "S");
  assert.equal(mapPointDir({ x: 11, y: 9 }), "NW");
  assert.equal(mapPointDir({ x: 87, y: 88 }), "SE");
});

check("exits face their destination: one exit per slot, every on-map exit within 90° of the world bearing", () => {
  let maps = 0, exits = 0, close = 0;
  for (const scene of SCENES) {
    if (scene.kind !== "location") continue;
    const map = getLocationMap(scene.id); if (!map?.exits?.length) continue;
    maps++;
    const spots = new Set(map.exits.map((e) => `${e.x},${e.y}`));
    assert.equal(spots.size, map.exits.length, `${scene.id}: two exits share a spot`);
    for (const e of map.exits) {
      const bearing = worldBearing(scene.id, e.to); if (bearing === null) continue;
      exits++;
      const gap = angleGap(bearing, mapPointAngle(e));
      assert.ok(gap <= Math.PI / 2 + 1e-6, `${scene.id} → ${e.to}: exit is ${Math.round(gap * 180 / Math.PI)}° off its bearing`);
      if (gap <= Math.PI / 4 + 1e-6) close++;
    }
  }
  console.log(`  ${maps} maps, ${exits} exits; ${close} within 45° of the bearing`);
  assert.ok(close / exits > 0.8, "most exits point the way the place lies");
});

check("every road runs the way its exit faces, with a painting for its type, direction and region", () => {
  const used = new Set<string>();
  for (const r of routes) {
    const map = getRouteMap(r.id); assert.ok(map, `${r.id} has a road map`);
    const [src, dst] = ends(r.id);
    const exit = getLocationMap(src)?.exits?.find((e) => e.to === dst);
    if (exit) assert.equal(map.direction, mapPointDir(exit), `${r.id} leaves by its exit's side`);
    assert.match(map.image, new RegExp(`/maps/routes/[a-z]+-${map.direction}\\.webp$`));
    if (map.grade) assert.ok(ROUTE_GRADES[map.grade], `${r.id}: grade ${map.grade} exists`);
    assert.ok(existsSync(`public${map.image}`), `${map.image} exists`);
    used.add(map.image);
    // The hero walks from the near end to the far end, in the road's direction.
    const walk = { x: (map.destSlots[0].x - map.spawn.x) * 1.5, y: map.destSlots[0].y - map.spawn.y };
    assert.equal(dir8Of(walk.x, walk.y), map.direction, `${r.id}: spawn → destination runs ${map.direction}`);
    const back = { x: (map.back.x - map.spawn.x) * 1.5, y: map.back.y - map.spawn.y };
    assert.equal(dir8Of(back.x, back.y), oppositeDir(map.direction), `${r.id}: the way back is behind the hero`);
  }
  console.log(`  ${routes.length} roads, ${used.size} road paintings`);
});

check("regional grades: heartland untouched, others shift the colours, results stay in range", () => {
  const px = () => new Uint8ClampedArray([200, 150, 90, 255, 30, 90, 40, 255]);
  const base = px(); gradePixels(base, undefined); assert.deepEqual([...base], [...px()]);
  for (const region of Object.keys(ROUTE_GRADES)) {
    const p = px(); gradePixels(p, region);
    assert.notDeepEqual([...p], [...px()], `${region} changes the colours`);
    assert.equal(p[3], 255, "alpha untouched");
  }
});

check("snapped exit points sit at the border on a real exit of their map", () => {
  let n = 0;
  for (const [id, points] of Object.entries(AUTO_MAP_EXIT_POINTS)) {
    const exits = getLocationMap(id)?.exits ?? [];
    for (const [to, p] of Object.entries(points)) {
      n++;
      assert.ok(exits.some((e) => e.to === to && e.x === p.x && e.y === p.y), `${id} → ${to}: an exit of the map`);
      const edge = Math.min(p.x, 100 - p.x, p.y, 100 - p.y);
      assert.ok(edge <= 13, `${id} → ${to}: (${p.x}, ${p.y}) is ${edge}% from the border`);
    }
  }
  console.log(`  ${n} exit points on ${Object.keys(AUTO_MAP_EXIT_POINTS).length} repainted maps`);
});

check("road geometry stays on the painting for all eight directions", () => {
  for (const d of DIR8) {
    const g = routeGeometry(d);
    for (const p of [g.spawn, g.back, ...g.destSlots]) assert.ok(p.x >= 3 && p.x <= 97 && p.y >= 4 && p.y <= 95, `${d}: ${JSON.stringify(p)} on the map`);
  }
  assert.equal(routeDirection("city_capital", "city_changan"), mapPointDir(getLocationMap("city_capital")!.exits!.find((e) => e.to === "city_changan")!));
});

check("arriving: a hint puts the hero just inside the exit back, facing into the map", () => {
  clearMapPositions();
  setArrivalFrom("city_changan", "city_capital");
  assert.equal(peekArrivalFrom("city_changan"), "city_capital");
  clearArrivalFrom("city_changan");
  assert.equal(peekArrivalFrom("city_changan"), undefined);
  // Placement honours the spawn and facing a location map derives from the hint.
  const placed = initialWorldPlacement({ key: "t", name: "t", image: "", playerImage: "", markers: [],
    spawn: { x: 84, y: 53 }, spawnFacing: "west" }, undefined, []);
  assert.equal(placed.facing, "west");
  assert.ok(Math.abs(placed.position.x - 84 * 9.6) < 1);
  // Arrive at B from A: B has an exit to A on the side facing A (for roads whose both ends are mapped).
  let paired = 0, facing = 0;
  for (const r of routes) {
    const [src, dst] = ends(r.id);
    const back = getLocationMap(dst)?.exits?.find((e) => e.to === src);
    const map = getRouteMap(r.id)!;
    if (!back) continue;
    paired++;
    // The road arrives heading `direction`; the exit back should sit behind the hero (within 90°).
    const v = dirVector(oppositeDir(map.direction));
    if (angleGap(Math.atan2(v.y, v.x), mapPointAngle(back)) <= Math.PI / 2 + 1e-6) facing++;
  }
  console.log(`  ${facing}/${paired} arrivals enter on the side the road came from`);
  assert.ok(facing / paired > 0.85);
});

check("every place on the world map can be reached from the hero's home: on foot, the islands by boat", () => {
  const adj: Record<string, string[]> = {};
  for (const r of LOCATION_ROUTES.filter(isWalkable)) { (adj[r.a] ??= []).push(r.b); (adj[r.b] ??= []).push(r.a); }
  for (const a of ferryStops()) for (const b of ferryStops()) if (a !== b) (adj[a] ??= []).push(b);
  // Nobody walks to an island: every sea lane touches one, and no island has a road.
  for (const r of LOCATION_ROUTES) if ([r.a, r.b].some((id) => id.startsWith("isle_"))) assert.ok(r.sea, `${r.a} ↔ ${r.b} is a sea lane`);
  for (const id of ferryStops().filter((s) => s.startsWith("isle_"))) {
    const scene = getScene(id);
    assert.ok(scene?.kind === "location" && scene.routes.length === 0, `${id} has no road out`);
  }
  const seen = new Set(["home_player"]), queue = ["home_player"];
  while (queue.length) for (const next of adj[queue.pop()!] ?? []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  const cut = Object.keys(WORLD_COORDS).filter((id) => !seen.has(id));
  assert.deepEqual(cut, [], `cut off from the road network: ${cut.join(", ")}`);
});

check("regions follow the map: the heartland around the capital, the compass quarters beyond, no wild catch-all", () => {
  const capital = WORLD_COORDS.city_capital;
  const counts: Record<string, number> = {};
  for (const [id, point] of Object.entries(WORLD_COORDS)) {
    const region = regionOf(id);
    assert.equal(region, regionAt(point), id);
    assert.notEqual(region, "jianghu_wild", id);
    counts[region] = (counts[region] ?? 0) + 1;
    const dx = point.x - capital.x, dy = point.y - capital.y;
    if (Math.hypot(dx, dy) > CENTRAL_RADIUS) {
      // East of the capital is +x, north is −y on the world map.
      if (region === "east") assert.ok(dx > Math.abs(dy) - 1e-9, id);
      if (region === "west") assert.ok(-dx >= Math.abs(dy) - 1e-9, id);
      if (region === "north") assert.ok(-dy > Math.abs(dx) - 1e-9, id);
      if (region === "south") assert.ok(dy >= Math.abs(dx) - 1e-9, id);
    }
  }
  assert.equal(regionOf("city_capital"), "heartland");
  assert.equal(regionOf("village"), "heartland", "unplaced places count as the heartland");
  for (const region of ["heartland", "north", "south", "east", "west"]) assert.ok((counts[region] ?? 0) >= 5, `${region} has places (${counts[region] ?? 0})`);
});

// ─── The world atlas (แผนที่โลก) ──────────────────────────────────────
check("world atlas: every placed location, the walked roads plus the sea lanes, the painted map's size", () => {
  const places = atlasPlaces();
  const located = Object.keys(WORLD_COORDS).filter((id) => getScene(id)?.kind === "location");
  assert.deepEqual(places.map((p) => p.id).sort(), located.sort());
  for (const p of places) assert.equal(p.region, regionOf(p.id), p.id);
  const roads = atlasRoads();
  const sea = roads.filter((r) => r.sea);
  assert.equal(sea.length, LOCATION_ROUTES.filter((r) => r.sea).length);
  assert.equal(roads.length - sea.length, LOCATION_ROUTES.filter(isWalkable).length);
  for (const road of roads) assert.ok(road.sea || (road.labelA && road.labelB), `${road.a}–${road.b} is named from both ends`);
  assert.ok(existsSync(`public${ATLAS_IMAGE}`), "the painted map");
  assert.equal(ATLAS_SIZE.width / ATLAS_SIZE.height, 1.5);
});

check("world atlas: region outlines match regionAt, names sit clear of the places", () => {
  for (const region of ["north", "south", "east", "west"] as const) {
    const poly = regionPolygon(region);
    assert.ok(poly.length >= 3, region);
    // The polygon's middle lies in the region.
    const middle = { x: poly.reduce((s, p) => s + p.x, 0) / poly.length, y: poly.reduce((s, p) => s + p.y, 0) / poly.length };
    assert.equal(regionAt(middle), region);
  }
  for (const region of ATLAS_REGIONS) {
    const at = regionLabelPoint(region);
    assert.equal(regionAt(at), region, `${region}'s name inside it`);
    const covered = atlasPlaces().filter((p) => Math.abs(p.x - at.x) < 80 && Math.abs(p.y - at.y) < 22);
    assert.deepEqual(covered.map((p) => p.id), [], `${region}'s name covers no place`);
  }
});

check("world atlas: the hero's spot (a place, a road's middle) and the way to an island ends in a boat ride", () => {
  assert.deepEqual(atlasPosition({ currentSceneId: "city_capital", lastLocationId: "city_capital" }), { kind: "place", id: "city_capital" });
  const onRoad = atlasPosition({ currentSceneId: "route_city_capital__to__city_changan", lastLocationId: "city_capital" });
  assert.deepEqual(onRoad, { kind: "road", from: "city_capital", to: "city_changan" });
  assert.equal(routingOrigin(onRoad), "city_changan");
  const way = atlasRoute("city_capital", "isle_boni")!;
  assert.ok(way.length >= 2);
  const last = way[way.length - 1];
  assert.equal(last.to, "isle_boni");
  assert.ok(last.ferry && last.ferry.gold > 0, "the last leg is the boat");
  assert.ok(way.slice(0, -1).every((step) => !step.ferry), "walked to the port");
  assert.ok(way.every((step) => step.road && step.direction), "every step named, with its direction");
  assert.deepEqual(atlasRoute("city_capital", "city_capital"), []);
  // An island lists its sea lanes; nobody walks off it.
  assert.ok(atlasNeighbours("isle_boni").every((n) => n.road.sea));
});

console.log(`${passed} route checks passed`);
