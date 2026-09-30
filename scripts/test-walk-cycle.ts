import assert from "node:assert/strict";
import { applyWalkBeat, WALK_BEATS } from "../lib/characters/walk-cycle";

// A 32×32 "figure": body columns 8–23 from row 4 to the ground at row 29.
const size = 32;
function figure() {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 4; y <= 29; y++) for (let x = 8; x <= 23; x++) data[(y * size + x) * 4 + 3] = 255;
  return data;
}
const lowest = (data: Uint8ClampedArray, from: number, to: number) => {
  let bottom = -1;
  for (let y = 0; y < size; y++) for (let x = from; x < to; x++) if (data[(y * size + x) * 4 + 3] >= 32) bottom = Math.max(bottom, y);
  return bottom;
};
const cell = { x: 0, y: 0, size, feetY: 30 };

assert.deepEqual(WALK_BEATS, ["leftUp", "pass", "rightUp", "pass"]);
const left = figure(); applyWalkBeat(left, size, cell, "leftUp", 3);
assert.ok(lowest(left, 8, 16) < 29, "left foot lifts");
assert.equal(lowest(left, 16, 24), 29, "right foot stays planted");
const right = figure(); applyWalkBeat(right, size, cell, "rightUp", 3);
assert.equal(lowest(right, 8, 16), 29, "left foot stays planted");
assert.ok(lowest(right, 16, 24) < 29, "right foot lifts");
const pass = figure(); applyWalkBeat(pass, size, cell, "pass");
assert.equal(lowest(pass, 8, 24), 28, "passing frame bobs the body up a pixel");
console.log("PASS walk cycle alternates left and right feet with a passing bob");
