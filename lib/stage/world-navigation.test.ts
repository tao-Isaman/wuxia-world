import assert from "node:assert/strict";
import { test } from "node:test";
import {
  moveOnWorldGround, nearestWorldGround, planWorldPath, worldFootprints, worldPointBlocked, worldSegmentClear,
} from "./world-navigation";
import { probeWorldMap, type ProbeMarker } from "./world-map-probe";
import { getLocationMap } from "../world/data/location-maps";
import { AUTO_MAP_IDS } from "../world/data/auto-map-ids";

const home = worldFootprints("home_player", "/maps/home_player.png");
const capital = worldFootprints("city_capital", "/maps/city_capital.png");

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

test("capital storefront walls block north input and leave authored alleys accessible", () => {
  const blocked = moveOnWorldGround({ x: 480, y: 499 }, { x: 0, y: -220 }, capital);
  assert.ok(blocked.y >= 486 && blocked.y < 499);
  const alley = moveOnWorldGround({ x: 392, y: 499 }, { x: 0, y: -130 }, capital);
  assert.ok(Math.abs(alley.y - 369) < 0.001);
});

test("NPC interaction can detour from the south gate through an alley", () => {
  const start = { x: 480, y: 499.2 };
  const physician = { x: 336, y: 381.2 };
  const path = planWorldPath(start, physician, capital);
  assert.ok(path.length > 1);
  assert.deepEqual(path.at(-1), physician);
  let previous = start;
  for (const point of path) { assert.equal(worldSegmentClear(previous, point, capital), true); previous = point; }
});

test("service points painted on shop walls resolve to reachable ground by the entrance", () => {
  const start = { x: 480, y: 499.2 };
  for (const x of [201.6, 336, 451.2, 576, 691.2, 796.8]) {
    const path = planWorldPath(start, { x, y: 470.8 }, capital);
    assert.ok(path.length > 0);
    assert.ok(path.at(-1)!.y >= 486);
    assert.equal(worldPointBlocked(path.at(-1)!, capital), false);
  }
});

test("both lower market stalls block movement through their tables", () => {
  for (const x of [336, 595]) {
    const result = moveOnWorldGround({ x, y: 380 }, { x: 0, y: -100 }, capital);
    assert.ok(result.y >= 358);
    assert.equal(worldPointBlocked(result, capital), false);
  }
});

test("a circuit around the capital well, stalls, and shop row has clear connected routes", () => {
  const circuit = [{ x: 480, y: 499.2 }, { x: 392, y: 390 }, { x: 425, y: 355 },
    { x: 425, y: 295 }, { x: 500, y: 290 }, { x: 665, y: 325 }, { x: 665, y: 390 }, { x: 480, y: 499.2 }];
  for (let index = 1; index < circuit.length; index++) {
    const path = planWorldPath(circuit[index - 1], circuit[index], capital);
    assert.ok(path.length > 0);
    assert.deepEqual(path.at(-1), circuit[index]);
    let previous = circuit[index - 1];
    for (const point of path) { assert.equal(worldSegmentClear(previous, point, capital), true); previous = point; }
  }
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
    if (footprints.length) solid++;
    const w = (p: { x: number; y: number }) => ({ x: p.x * 9.6, y: p.y * 6.4 });
    const markers: ProbeMarker[] = [
      ...Object.entries(map.npcSpots ?? {}).map(([npc, p]) => ({ id: npc, kind: "npc" as const, ...w(p) })),
      ...(map.exits ?? []).map((exit) => ({ id: `exit ${exit.to}`, kind: "exit" as const, ...w(exit) })),
      ...(map.spots ?? []).map((spot, index) => ({ id: `${spot.kind} ${index}`, kind: "service" as const, ...w(spot) })),
    ];
    const { spawnOk, results } = probeWorldMap(w(map.spawn), markers, footprints);
    if (!spawnOk) failures.push(`${id}: spawn blocked`);
    for (const result of results) if (!result.ok) failures.push(`${id}: ${result.id} ${result.reason}`);
  }
  assert.deepEqual(failures, []);
  assert.ok(solid >= 2);
});
