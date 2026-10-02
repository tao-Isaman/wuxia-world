import type { Point } from "./types";
import { PAINTED_MAP_FOOTPRINTS } from "./world-footprints-data";
import { composedFootprints, composedMapFor } from "../world/data/composed";

export type WorldFootprint =
  | { kind: "rect"; left: number; top: number; right: number; bottom: number }
  | { kind: "ellipse"; x: number; y: number; radiusX: number; radiusY: number };

const FOOT_RADIUS = 6;
const CLEARANCE = 0.75;
const EPSILON = 0.00001;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
/** The walkable extent of a map (world units). Paintings are 960 × 640; composed maps are larger. */
export interface WorldBounds { width: number; height: number }
export const PAINTED_BOUNDS: WorldBounds = { width: 960, height: 640 };
const inBounds = (point: Point, bounds: WorldBounds = PAINTED_BOUNDS): Point =>
  ({ x: clamp(point.x, 12, bounds.width - 12), y: clamp(point.y, 18, bounds.height - 12) });

/** Only grounded, authored objects are solid. Paintings without footprints retain open movement. */
export function worldFootprints(key: string, image: string): readonly WorldFootprint[] {
  if (key === "home_player" && image === "/maps/home_player.png") return [
    { kind: "ellipse", x: 520, y: 337, radiusX: 33, radiusY: 22 },
    { kind: "rect", left: 432, top: 493, right: 448, bottom: 546 },
    { kind: "rect", left: 508, top: 478, right: 529, bottom: 530 },
  ];
  if (key === "jail" && image === "/maps/jail.png") return [
    // Cell block, side walls and the south wall either side of the gate.
    { kind: "rect", left: 0, top: 0, right: 960, bottom: 196 },
    { kind: "rect", left: 0, top: 0, right: 40, bottom: 640 },
    { kind: "rect", left: 920, top: 0, right: 960, bottom: 640 },
    { kind: "rect", left: 0, top: 600, right: 434, bottom: 640 },
    { kind: "rect", left: 526, top: 600, right: 960, bottom: 640 },
    // Rock pile, millstone, trough, guard desk, weapon rack.
    { kind: "rect", left: 70, top: 452, right: 200, bottom: 520 },
    { kind: "ellipse", x: 262, y: 526, radiusX: 32, radiusY: 20 },
    { kind: "rect", left: 356, top: 318, right: 444, bottom: 348 },
    { kind: "rect", left: 700, top: 400, right: 820, bottom: 455 },
    { kind: "rect", left: 880, top: 400, right: 918, bottom: 500 },
  ];
  if (image === `/maps/${key}.webp`) return PAINTED_MAP_FOOTPRINTS[key] ?? [];
  const composed = composedMapFor(image);
  if (composed) return composedFootprints(composed);
  return [];
}

/** The walkable extent for a map image (composed maps carry their own size). */
export function worldBounds(image: string): WorldBounds {
  const composed = composedMapFor(image);
  return composed ? { width: composed.width, height: composed.height } : PAINTED_BOUNDS;
}

export function worldPointBlocked(point: Point, footprints: readonly WorldFootprint[]): boolean {
  return footprints.some((shape) => {
    if (shape.kind === "rect") {
      return point.x > shape.left - FOOT_RADIUS + EPSILON && point.x < shape.right + FOOT_RADIUS - EPSILON &&
        point.y > shape.top - FOOT_RADIUS + EPSILON && point.y < shape.bottom + FOOT_RADIUS - EPSILON;
    }
    return ((point.x - shape.x) / (shape.radiusX + FOOT_RADIUS)) ** 2 +
      ((point.y - shape.y) / (shape.radiusY + FOOT_RADIUS)) ** 2 < 1 - EPSILON;
  });
}

/** Swept segment tests also prevent a long input step from tunnelling through a post. */
export function worldSegmentClear(from: Point, to: Point, footprints: readonly WorldFootprint[]): boolean {
  return !footprints.some((shape) => {
    if (shape.kind === "ellipse") {
      const x = (from.x - shape.x) / (shape.radiusX + FOOT_RADIUS);
      const y = (from.y - shape.y) / (shape.radiusY + FOOT_RADIUS);
      const dx = (to.x - from.x) / (shape.radiusX + FOOT_RADIUS);
      const dy = (to.y - from.y) / (shape.radiusY + FOOT_RADIUS);
      const lengthSquared = dx * dx + dy * dy;
      const amount = lengthSquared ? clamp(-(x * dx + y * dy) / lengthSquared, 0, 1) : 0;
      return (x + dx * amount) ** 2 + (y + dy * amount) ** 2 < 1 - EPSILON;
    }
    let enter = 0;
    let leave = 1;
    const axes = [
      [from.x, to.x - from.x, shape.left - FOOT_RADIUS + EPSILON, shape.right + FOOT_RADIUS - EPSILON],
      [from.y, to.y - from.y, shape.top - FOOT_RADIUS + EPSILON, shape.bottom + FOOT_RADIUS - EPSILON],
    ];
    for (const [origin, delta, low, high] of axes) {
      if (Math.abs(delta) < EPSILON) {
        if (origin <= low || origin >= high) return false;
      } else {
        const a = (low - origin) / delta;
        const b = (high - origin) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
        if (enter >= leave) return false;
      }
    }
    return enter < leave;
  });
}

function detourPoints(footprints: readonly WorldFootprint[], bounds: WorldBounds): Point[] {
  const points: Point[] = [];
  for (const shape of footprints) {
    const margin = FOOT_RADIUS + CLEARANCE;
    if (shape.kind === "rect") {
      for (const x of [shape.left - margin, shape.right + margin]) {
        for (const y of [shape.top - margin, shape.bottom + margin]) points.push({ x, y });
      }
    } else {
      // Circumscribe the ellipse so adjoining waypoints never cut through its basin.
      const sides = 20;
      const expansion = 1 / Math.cos(Math.PI / sides);
      for (let index = 0; index < sides; index++) {
        const angle = index / sides * Math.PI * 2;
        points.push({ x: shape.x + Math.cos(angle) * (shape.radiusX + margin) * expansion,
          y: shape.y + Math.sin(angle) * (shape.radiusY + margin) * expansion });
      }
    }
  }
  return points.filter((point) => distance(point, inBounds(point, bounds)) < EPSILON && !worldPointBlocked(point, footprints));
}

/** Clicks on a solid object stop at its nearest accessible ground edge. */
export function nearestWorldGround(point: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds = PAINTED_BOUNDS): Point {
  const target = inBounds(point, bounds);
  if (!worldPointBlocked(target, footprints)) return target;
  if (footprints.length > GRID_THRESHOLD) return gridNearest(target, footprints, bounds);
  const candidates = detourPoints(footprints, bounds);
  for (const shape of footprints) {
    const margin = FOOT_RADIUS + CLEARANCE;
    if (shape.kind === "rect") {
      candidates.push(
        { x: target.x, y: shape.top - margin }, { x: target.x, y: shape.bottom + margin },
        { x: shape.left - margin, y: target.y }, { x: shape.right + margin, y: target.y },
      );
    } else {
      const angle = Math.atan2((target.y - shape.y) / (shape.radiusY + margin), (target.x - shape.x) / (shape.radiusX + margin));
      candidates.push({ x: shape.x + Math.cos(angle) * (shape.radiusX + margin),
        y: shape.y + Math.sin(angle) * (shape.radiusY + margin) });
    }
  }
  return candidates.map((candidate) => inBounds(candidate, bounds)).filter((candidate) => !worldPointBlocked(candidate, footprints))
    .sort((a, b) => distance(a, target) - distance(b, target))[0] ?? target;
}

/** Slide input along a solid edge; each substep remains bounded and swept. */
export function moveOnWorldGround(from: Point, delta: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds = PAINTED_BOUNDS): Point {
  let result = nearestWorldGround(from, footprints, bounds);
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / 4));
  const dx = delta.x / steps;
  const dy = delta.y / steps;
  for (let step = 0; step < steps; step++) {
    const next = inBounds({ x: result.x + dx, y: result.y + dy }, bounds);
    if (worldSegmentClear(result, next, footprints)) { result = next; continue; }
    const axes = Math.abs(dx) > Math.abs(dy) ? [{ x: dx, y: 0 }, { x: 0, y: dy }] : [{ x: 0, y: dy }, { x: dx, y: 0 }];
    for (const axis of axes) {
      const slide = inBounds({ x: result.x + axis.x, y: result.y + axis.y }, bounds);
      if (worldSegmentClear(result, slide, footprints)) result = slide;
    }
  }
  return result;
}

/** Shortest visibility-graph route around the few explicitly authored solids. */
export function planWorldPath(from: Point, destination: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds = PAINTED_BOUNDS): Point[] {
  const start = nearestWorldGround(from, footprints, bounds);
  const target = nearestWorldGround(destination, footprints, bounds);
  if (worldSegmentClear(start, target, footprints)) return [target];
  if (footprints.length > GRID_THRESHOLD) return gridPath(start, target, footprints, bounds);
  const nodes = [start, target, ...detourPoints(footprints, bounds)];
  const costs = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  const visited = new Set<number>();
  costs[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let index = 0; index < nodes.length; index++) {
      if (!visited.has(index) && (current < 0 || costs[index] < costs[current])) current = index;
    }
    if (current < 0 || !Number.isFinite(costs[current])) return [];
    if (current === 1) {
      const path: Point[] = [];
      for (let index = 1; index !== 0; index = previous[index]) path.unshift(nodes[index]);
      return path;
    }
    visited.add(current);
    for (let next = 0; next < nodes.length; next++) {
      if (visited.has(next) || !worldSegmentClear(nodes[current], nodes[next], footprints)) continue;
      const cost = costs[current] + distance(nodes[current], nodes[next]);
      if (cost < costs[next]) { costs[next] = cost; previous[next] = current; }
    }
  }
  return [];
}

// ─── Large maps: a walkability grid ────────────────────────────────────
// The visibility graph above is exact but grows with the square of the solids;
// composed maps have a hundred or more, so they path on a grid of CELL-unit
// cells (A*, eight neighbours, no corner cutting) and then pull the path taut
// with the same swept segment test the runtime walks with.

const GRID_THRESHOLD = 40;
const CELL = 8;
interface WalkGrid { columns: number; rows: number; blocked: Uint8Array }
const grids = new WeakMap<readonly WorldFootprint[], Map<string, WalkGrid>>();

function walkGrid(footprints: readonly WorldFootprint[], bounds: WorldBounds): WalkGrid {
  let byBounds = grids.get(footprints);
  if (!byBounds) { byBounds = new Map(); grids.set(footprints, byBounds); }
  const key = `${bounds.width}x${bounds.height}`;
  const cached = byBounds.get(key);
  if (cached) return cached;
  const columns = Math.ceil(bounds.width / CELL), rows = Math.ceil(bounds.height / CELL);
  const blocked = new Uint8Array(columns * rows);
  for (const shape of footprints) {
    // Only cells near the shape can be inside it.
    const box = shape.kind === "rect" ? shape
      : { left: shape.x - shape.radiusX, right: shape.x + shape.radiusX, top: shape.y - shape.radiusY, bottom: shape.y + shape.radiusY };
    const c0 = Math.max(0, Math.floor((box.left - FOOT_RADIUS) / CELL)), c1 = Math.min(columns - 1, Math.floor((box.right + FOOT_RADIUS) / CELL));
    const r0 = Math.max(0, Math.floor((box.top - FOOT_RADIUS) / CELL)), r1 = Math.min(rows - 1, Math.floor((box.bottom + FOOT_RADIUS) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const index = r * columns + c;
      if (!blocked[index] && worldPointBlocked({ x: (c + 0.5) * CELL, y: (r + 0.5) * CELL }, [shape])) blocked[index] = 1;
    }
  }
  // The map's edge band is out of bounds too.
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
    const x = (c + 0.5) * CELL, y = (r + 0.5) * CELL;
    if (x < 12 || x > bounds.width - 12 || y < 18 || y > bounds.height - 12) blocked[r * columns + c] = 1;
  }
  const grid = { columns, rows, blocked };
  byBounds.set(key, grid);
  return grid;
}
const cellOf = (point: Point, grid: WalkGrid) =>
  clamp(Math.floor(point.y / CELL), 0, grid.rows - 1) * grid.columns + clamp(Math.floor(point.x / CELL), 0, grid.columns - 1);
const centreOf = (index: number, grid: WalkGrid): Point => ({ x: (index % grid.columns + 0.5) * CELL, y: (Math.floor(index / grid.columns) + 0.5) * CELL });

/** Nearest open cell centre to a blocked point (breadth-first outwards). */
function gridNearest(target: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds): Point {
  const grid = walkGrid(footprints, bounds);
  const start = cellOf(target, grid);
  const seen = new Uint8Array(grid.blocked.length);
  const queue = [start];
  seen[start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head];
    if (!grid.blocked[index]) {
      const centre = centreOf(index, grid);
      if (!worldPointBlocked(centre, footprints)) return centre;
    }
    const c = index % grid.columns, r = Math.floor(index / grid.columns);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= grid.columns || nr >= grid.rows) continue;
      const next = nr * grid.columns + nc;
      if (!seen[next]) { seen[next] = 1; queue.push(next); }
    }
  }
  return target;
}

function gridPath(start: Point, target: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds): Point[] {
  const grid = walkGrid(footprints, bounds);
  const from = cellOf(start, grid), to = cellOf(target, grid);
  const cost = new Float64Array(grid.blocked.length).fill(Infinity);
  const previous = new Int32Array(grid.blocked.length).fill(-1);
  const closed = new Uint8Array(grid.blocked.length);
  const heuristic = (index: number) => {
    const dx = Math.abs(index % grid.columns - to % grid.columns), dy = Math.abs(Math.floor(index / grid.columns) - Math.floor(to / grid.columns));
    return (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)) * CELL;
  };
  // A binary heap of [priority, index].
  const heap: [number, number][] = [];
  const push = (item: [number, number]) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0;) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  cost[from] = 0;
  push([heuristic(from), from]);
  let reached = false;
  while (heap.length) {
    const [, current] = pop();
    if (closed[current]) continue;
    if (current === to) { reached = true; break; }
    closed[current] = 1;
    const c = current % grid.columns, r = Math.floor(current / grid.columns);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dc && !dr) continue;
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= grid.columns || nr >= grid.rows) continue;
      const next = nr * grid.columns + nc;
      if (closed[next] || (grid.blocked[next] && next !== to)) continue;
      // No squeezing diagonally between two solid cells.
      if (dc && dr && (grid.blocked[r * grid.columns + nc] || grid.blocked[nr * grid.columns + c])) continue;
      const step = (dc && dr ? Math.SQRT2 : 1) * CELL;
      if (cost[current] + step < cost[next]) {
        cost[next] = cost[current] + step;
        previous[next] = current;
        push([cost[next] + heuristic(next), next]);
      }
    }
  }
  if (!reached) return [];
  const cells: Point[] = [];
  for (let index = previous[to]; index >= 0 && index !== from; index = previous[index]) cells.unshift(centreOf(index, grid));
  const raw = [start, ...cells, target];
  // Pull the path taut: from each kept point, jump to the farthest one in clear sight.
  const path: Point[] = [];
  let i = 0;
  while (i < raw.length - 1) {
    let j = raw.length - 1;
    while (j > i + 1 && !worldSegmentClear(raw[i], raw[j], footprints)) j--;
    path.push(raw[j]);
    i = j;
  }
  return path;
}
