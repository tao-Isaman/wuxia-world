import assert from "node:assert/strict";
import { test } from "node:test";
import {
  moveOnWorldGround, nearestWorldGround, planWorldPath, worldBounds, worldFootprints, worldPointBlocked, worldSegmentClear,
} from "./world-navigation";
import { probeWorldMap, type ProbeMarker } from "./world-map-probe";
import { getLocationMap } from "../world/data/location-maps";
import { AUTO_MAP_IDS } from "../world/data/auto-map-ids";
import { composedMapFor, isoToWorld, worldToIso } from "../world/data/composed";

const home = worldFootprints("home_player", "/maps/home_player.png");
const capitalComposed = worldFootprints("city_capital", "composed:city_capital");
const capitalBounds = worldBounds("composed:city_capital");

test("walking straight through the home well stops at its footprint", () => {
  const result = moveOnWorldGround({ x: 440, y: 337 }, { x: 160, y: 0 }, home);
  assert.ok(result.x > 470 && result.x <= 481);
  assert.equal(worldPointBlocked(result, home), false);
});

test("diagonal movement slides past the well without entering it", () => {
  const result = moveOnWorldGround({ x: 480, y: 337 }, { x: 40, y: 65 }, home);
  assert.ok(result.y > 390);
  assert.equal(worldPointBlocked(result, home), false);
});

test("a long movement cannot tunnel through a gatepost, while the doorway stays open", () => {
  const blocked = moveOnWorldGround({ x: 390, y: 520 }, { x: 180, y: 0 }, home);
  assert.ok(blocked.x < 432);
  const doorway = moveOnWorldGround({ x: 476, y: 470 }, { x: 0, y: 110 }, home);
  assert.equal(doorway.x, 476);
  assert.ok(Math.abs(doorway.y - 580) < 0.001);
});

test("a click across the well takes clear detour segments and reaches its requested ground", () => {
  const start = { x: 440, y: 337 };
  const destination = { x: 600, y: 337 };
  const path = planWorldPath(start, destination, home);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), destination);
  let previous = start;
  for (const point of path) { assert.equal(worldSegmentClear(previous, point, home), true); previous = point; }
});

test("the authored home exit approaches through the opening between its posts", () => {
  const path = planWorldPath({ x: 441.6, y: 307.2 }, { x: 451.2, y: 566.8 }, home);
  assert.ok(path.length > 1);
  for (const point of path) {
    if (point.y > 478 && point.y < 553) assert.ok(point.x >= 454 && point.x <= 502);
  }
  assert.deepEqual(path.at(-1), { x: 451.2, y: 566.8 });
});

// Capital spots are authored on its isometric grid.
const capital = composedMapFor("composed:city_capital")!;
const at = (u: number, v: number) => isoToWorld(capital, u, v);
const walk = (from: [number, number], to: [number, number]) => {
  const a = at(...from), b = at(...to);
  const end = moveOnWorldGround(a, { x: b.x - a.x, y: b.y - a.y }, capitalComposed, capitalBounds);
  return worldToIso(capital, end.x, end.y);
};

test("the composed capital: walls, the river and buildings block; gates, bridges and streets stay open", () => {
  // The river stops a walk along v from the market quay, but the street's bridge crosses it.
  const river = walk([20, 36.5], [20, 44]);
  assert.ok(river.v < 38);
  const bridge = walk([10, 36.5], [10, 44]);
  assert.ok(bridge.v > 43.5);
  // The NE wall stops a walk out of the city, except through a gate's passage.
  const wall = walk([20, 6], [20, 0.5]);
  assert.ok(wall.v > 3);
  const gate = walk([34, 6], [34, 0.5]);
  assert.ok(gate.v < 1);
  // The inn's walls stop a walk off the south street into it; its street stays open.
  const inn = walk([38, 48], [38, 41.5]);
  assert.ok(inn.v > 45.5);
  const street = walk([34, 48], [34, 42]);
  assert.ok(street.v < 42.5);
});

test("the composed capital: long walks across the city find clear routes quickly", () => {
  const spawn = at(50, 57.5);
  const destinations = [at(10, 5.4), at(5.4, 28), at(5.4, 48), at(59.6, 16), at(24, 59), at(34, 5.4), at(15.5, 24.2)];
  const started = performance.now();
  for (const destination of destinations) {
    const path = planWorldPath(spawn, destination, capitalComposed, capitalBounds);
    assert.ok(path.length > 0, `a route to ${destination.x},${destination.y}`);
    for (const point of path) assert.equal(worldPointBlocked(point, capitalComposed), false);
    assert.ok(Math.hypot(path.at(-1)!.x - destination.x, path.at(-1)!.y - destination.y) < 40);
  }
  assert.ok(performance.now() - started < 2000, "routes across the city stay fast");
});

test("old positions inside authored objects recover to free ground; unmapped worlds stay open", () => {
  const recovered = nearestWorldGround({ x: 520, y: 337 }, home);
  assert.equal(worldPointBlocked(recovered, home), false);
  const unknown = worldFootprints("other_map", "/maps/other.png");
  assert.deepEqual(planWorldPath({ x: 400, y: 300 }, { x: 550, y: 300 }, unknown), [{ x: 550, y: 300 }]);
  assert.deepEqual(moveOnWorldGround({ x: 940, y: 620 }, { x: 100, y: 100 }, unknown), { x: 948, y: 628 });
});

test("every painted location keeps spawn open and every NPC, exit and service reachable", () => {
  const ids = ["home_player", "city_capital", "jail", ...AUTO_MAP_IDS];
  const failures: string[] = [];
  let solid = 0;
  for (const id of ids) {
    const map = getLocationMap(id);
    if (!map) continue;
    const footprints = worldFootprints(id, map.image);
    const bounds = worldBounds(map.image);
    if (footprints.length) solid++;
    const w = (p: { x: number; y: number }) => ({ x: p.x * bounds.width / 100, y: p.y * bounds.height / 100 });
    const markers: ProbeMarker[] = [
      ...Object.entries(map.npcSpots ?? {}).map(([npc, p]) => ({ id: npc, kind: "npc" as const, ...w(p) })),
      ...(map.exits ?? []).map((exit) => ({ id: `exit ${exit.to}`, kind: "exit" as const, ...w(exit) })),
      ...(map.spots ?? []).map((spot, index) => ({ id: `${spot.kind} ${index}`, kind: "service" as const, ...w(spot) })),
    ];
    const { spawnOk, results } = probeWorldMap(w(map.spawn), markers, footprints, bounds);
    if (!spawnOk) failures.push(`${id}: spawn blocked`);
    for (const result of results) if (!result.ok) failures.push(`${id}: ${result.id} ${result.reason}`);
  }
  assert.deepEqual(failures, []);
  assert.ok(solid >= 2);
});
