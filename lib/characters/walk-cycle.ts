/**
 * Walk-cycle leg alternation, applied to the atlas's walk cells.
 *
 * The painted walk strides don't read as stepping at map scale, so each walk
 * frame gets a clear beat: left foot up (right planted) → passing → right
 * foot up (left planted) → passing. The lifted side of the lower body is bent
 * upward from the hip (feet rise by `lift`, the hip stays put), so robes and
 * boots keep their pixels instead of tearing; passing frames bob the body a
 * pixel. Pure: works on RGBA bytes, so it is testable without a DOM.
 */

export type WalkBeat = "leftUp" | "pass" | "rightUp";
/** Frame order inside every 4-frame walk clip. */
export const WALK_BEATS: readonly WalkBeat[] = ["leftUp", "pass", "rightUp", "pass"];

export interface Cell { x: number; y: number; size: number; feetY: number }

const alphaAt = (data: Uint8ClampedArray, width: number, x: number, y: number) => data[(y * width + x) * 4 + 3];

/** Opaque bounds of one cell (alpha ≥ 32), or null when empty. */
function bounds(data: Uint8ClampedArray, width: number, cell: Cell) {
  let top = Infinity, bottom = -1, left = Infinity, right = -1;
  for (let y = cell.y; y < cell.y + cell.size; y++) {
    for (let x = cell.x; x < cell.x + cell.size; x++) {
      if (alphaAt(data, width, x, y) < 32) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  return bottom < 0 ? null : { top, bottom, left, right };
}

/** Rewrites one walk cell in place for the given beat. */
export function applyWalkBeat(data: Uint8ClampedArray, width: number, cell: Cell, beat: WalkBeat, lift = 7): void {
  const box = bounds(data, width, cell);
  if (!box) return;
  const copy = data.slice();
  const figure = box.bottom - box.top + 1;
  const ground = box.bottom;
  if (beat === "pass") {
    // Passing position: the body rides a pixel higher.
    for (let y = cell.y; y < cell.y + cell.size; y++) {
      for (let x = cell.x; x < cell.x + cell.size; x++) {
        const from = y + 1 < cell.y + cell.size ? y + 1 : -1;
        const target = (y * width + x) * 4;
        if (from < 0) { data[target + 3] = 0; continue; }
        const source = (from * width + x) * 4;
        for (let c = 0; c < 4; c++) data[target + c] = copy[source + c];
      }
    }
    return;
  }
  // Legs live in the lower ~30 % of the figure; split them at their centre.
  const hip = Math.round(ground - figure * 0.3);
  let sum = 0, count = 0;
  for (let y = hip; y <= ground; y++) {
    for (let x = box.left; x <= box.right; x++) if (alphaAt(copy, width, x, y) >= 32) { sum += x; count++; }
  }
  if (!count) return;
  const middle = Math.round(sum / count);
  const [from, to] = beat === "leftUp" ? [cell.x, middle] : [middle, cell.x + cell.size];
  const span = ground - hip;
  for (let x = from; x < to; x++) {
    for (let y = hip; y <= ground; y++) {
      // Destination row y samples a lower source row: the foot rises by `lift`.
      const source = y + (lift * (y - hip)) / span;
      const sy = Math.round(source);
      const target = (y * width + x) * 4;
      if (sy > ground || sy >= cell.y + cell.size) { data[target + 3] = 0; continue; }
      const s = (sy * width + x) * 4;
      for (let c = 0; c < 4; c++) data[target + c] = copy[s + c];
    }
  }
}
