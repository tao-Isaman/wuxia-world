// Directional roads: compass exits, 8-way road paintings, arriving on the side you came in.
//   bun run test:routes
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { SCENES } from "../lib/world/data";
import { getLocationMap } from "../lib/world/data/location-maps";
import { getRouteMap, routeDirection, routeGeometry } from "../lib/world/data/route-maps";
import { WORLD_COORDS } from "../lib/world/data/world-coords";
import { LOCATION_ROUTES } from "../lib/world/data/location-routes";
import { AUTO_MAP_EXIT_POINTS } from "../lib/world/data/auto-map-exits";
import { DIR8, angleGap, dir8Of, dirVector, mapPointAngle, mapPointDir, oppositeDir, worldBearing } from "../lib/world/compass";
import { setArrivalFrom, peekArrivalFrom, clearArrivalFrom, clearMapPositions } from "../lib/stage/types";
import { initialWorldPlacement } from "../lib/stage/world-placement";
import { ROUTE_GRADES, gradePixels } from "../lib/stage/route-grade";

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

console.log(`${passed} route checks passed`);
