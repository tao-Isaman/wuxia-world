import assert from "node:assert/strict";
import { test } from "node:test";
import { LOCATION_MAPS } from "../world/data/location-maps";
import { getRememberedMapPosition, type WorldPresentation } from "./types";
import { initialWorldPlacement } from "./world-placement";
import { planWorldPath, worldBounds, worldFootprints, worldPointBlocked, worldSegmentClear } from "./world-navigation";
import { composedPresentation } from "./composed-presentation";

const map = LOCATION_MAPS.city_capital;
const qing = map.npcSpots!.city_capital_clerk_qing;
const presentation: WorldPresentation = {
  key: "city_capital", name: "Capital", image: map.image, composed: composedPresentation(map.image), playerImage: "/art/characters/m1.png",
  spawn: map.spawn, readOnly: true, dialogueSpeakerId: "npc-city_capital_clerk_qing",
  markers: [{ id: "npc-city_capital_clerk_qing", kind: "npc", label: "Qing", ...qing, onActivate: () => {} }],
};
const capital = worldFootprints(presentation.key, presentation.image);
// The capital is composed from assets: its percentages are of its own size.
const { width: W, height: H } = worldBounds(map.image);
const bounds = { width: W, height: H };
const spawn = { x: map.spawn.x * W / 100, y: map.spawn.y * H / 100 };

test("a restored Qing conversation places the hero beside Qing, facing him on connected ground", () => {
  const before = JSON.stringify(presentation);
  const sessionBefore = getRememberedMapPosition(presentation.key);
  const result = initialWorldPlacement(presentation, undefined, capital);
  assert.deepEqual(result.position, { x: qing.x * W / 100 + 38, y: qing.y * H / 100 + 4 });
  assert.equal(result.facing, "west");
  assert.equal(result.speakerMarkerId, presentation.dialogueSpeakerId);
  assert.equal(worldPointBlocked(result.position, capital), false);
  const path = planWorldPath(spawn, result.position, capital, bounds);
  assert.ok(path.length > 0);
  assert.deepEqual(path.at(-1), result.position);
  let previous = spawn;
  for (const point of path) { assert.equal(worldSegmentClear(previous, point, capital), true); previous = point; }
  assert.equal(JSON.stringify(presentation), before);
  assert.equal(getRememberedMapPosition(presentation.key), sessionBefore);
});

test("recreating a conversation with a remembered position preserves that session position", () => {
  const remembered = { x: 45, y: 37 };
  const result = initialWorldPlacement(presentation, remembered, capital);
  assert.deepEqual(result.position, { x: remembered.x * W / 100, y: remembered.y * H / 100 });
  assert.equal(result.speakerMarkerId, undefined);
  assert.deepEqual(remembered, { x: 45, y: 37 });
});

test("normal exploration uses the authored entry even when a speaker ID is present", () => {
  const result = initialWorldPlacement({ ...presentation, readOnly: false }, undefined, capital);
  assert.deepEqual(result.position, spawn);
  assert.equal(result.speakerMarkerId, undefined);
});

test("unknown, absent, disabled or non-NPC speakers keep the safe entry fallback", () => {
  for (const variant of [
    { ...presentation, dialogueSpeakerId: undefined },
    { ...presentation, dialogueSpeakerId: "npc-another-location" },
    { ...presentation, markers: [] },
    { ...presentation, markers: [{ ...presentation.markers[0], disabled: true }] },
    { ...presentation, markers: [{ ...presentation.markers[0], kind: "service" as const }] },
  ]) {
    assert.deepEqual(initialWorldPlacement(variant, undefined, capital).position, spawn);
  }
});

// Geometry on a 960 × 640 painting with hand-made solids.
const painted: WorldPresentation = { ...presentation, image: "/maps/test.webp", composed: undefined };

test("a speaker near the right map edge gets an inward approach and east-facing hero", () => {
  const result = initialWorldPlacement({ ...painted,
    markers: [{ ...presentation.markers[0], x: 98, y: 30 }] }, undefined, []);
  assert.deepEqual(result.position, { x: 98 * 960 / 100 - 38, y: 30 * 640 / 100 + 4 });
  assert.equal(result.facing, "east");
});

test("a blocked lateral approach tries the other side instead of overlapping the speaker", () => {
  const footprints = [{ kind: "rect" as const, left: 325, right: 390, top: 270, bottom: 370 }];
  const result = initialWorldPlacement({ ...painted,
    markers: [{ ...presentation.markers[0], x: 31.25, y: 50 }] }, undefined, footprints);
  assert.deepEqual(result.position, { x: 262, y: 324 });
  assert.equal(result.facing, "east");
  assert.equal(worldPointBlocked(result.position, footprints), false);
});

test("a speaker across an impassable wall cannot relocate the hero into a disconnected area", () => {
  const footprints = [{ kind: "rect" as const, left: 400, right: 420, top: -20, bottom: 660 }];
  const isolated = { ...painted, spawn: { x: 10, y: 50 },
    markers: [{ ...presentation.markers[0], x: 62.5, y: 50 }] };
  assert.deepEqual(initialWorldPlacement(isolated, undefined, footprints), {
    position: { x: 96, y: 320 }, facing: "east",
  });
});
