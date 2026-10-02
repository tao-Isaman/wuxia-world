import type { Point } from "./types";
import { PAINTED_MAP_FOOTPRINTS } from "./world-footprints-data";
import { composedFootprints, composedMapFor, isoSize } from "../world/data/composed";

export type WorldFootprint =
  | { kind: "rect"; left: number; top: number; right: number; bottom: number }
  | { kind: "ellipse"; x: number; y: number; radiusX: number; radiusY: number }
  /** A convex outline (an isometric footprint diamond), points in either winding. */
  | { kind: "poly"; points: readonly Point[] };

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
  return composed ? isoSize(composed) : PAINTED_BOUNDS;
}

/** A convex polygon's edges as outward half-planes: n·p <= offset inside. */
interface HalfPlane { nx: number; ny: number; offset: number }
const planesCache = new WeakMap<readonly Point[], HalfPlane[]>();
function halfPlanes(points: readonly Point[]): HalfPlane[] {
  const cached = planesCache.get(points);
  if (cached) return cached;
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length, cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const planes: HalfPlane[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < EPSILON) continue;
    let nx = (b.y - a.y) / length, ny = -(b.x - a.x) / length;
    // Point the normal away from the centre whatever the winding.
    if (nx * (cx - a.x) + ny * (cy - a.y) > 0) { nx = -nx; ny = -ny; }
    planes.push({ nx, ny, offset: nx * a.x + ny * a.y });
  }
  planesCache.set(points, planes);
  return planes;
}
const boxCache = new WeakMap<readonly Point[], { left: number; right: number; top: number; bottom: number }>();
const inGrownBox = (p: Point, box: { left: number; right: number; top: number; bottom: number }) =>
  p.x > box.left - FOOT_RADIUS * 3 && p.x < box.right + FOOT_RADIUS * 3 && p.y > box.top - FOOT_RADIUS * 3 && p.y < box.bottom + FOOT_RADIUS * 3;
function polyBox(points: readonly Point[]) {
  let box = boxCache.get(points);
  if (!box) {
    box = { left: Math.min(...points.map((p) => p.x)), right: Math.max(...points.map((p) => p.x)),
      top: Math.min(...points.map((p) => p.y)), bottom: Math.max(...points.map((p) => p.y)) };
    boxCache.set(points, box);
  }
  return box;
}

type RectShape = Extract<WorldFootprint, { kind: "rect" }>;
type EllipseShape = Extract<WorldFootprint, { kind: "ellipse" }>;
interface PolyShape { box: { left: number; right: number; top: number; bottom: number }; planes: HalfPlane[] }
/**
 * Footprints split by kind, so each test loop sees one object shape. Mixing
 * kinds in one loop made the engine deoptimise it for every later map once a
 * polygon-built (composed) map had been walked.
 */
interface ShapeSets { rects: RectShape[]; ellipses: EllipseShape[]; polys: PolyShape[] }
const shapeSets = new WeakMap<readonly WorldFootprint[], ShapeSets>();
function sets(footprints: readonly WorldFootprint[]): ShapeSets {
  let found = shapeSets.get(footprints);
  if (!found) {
    found = { rects: [], ellipses: [], polys: [] };
    for (const shape of footprints) {
      if (shape.kind === "rect") found.rects.push(shape);
      else if (shape.kind === "ellipse") found.ellipses.push(shape);
      else found.polys.push({ box: polyBox(shape.points), planes: halfPlanes(shape.points) });
    }
    shapeSets.set(footprints, found);
  }
  return found;
}

const rectHolds = (point: Point, shape: RectShape) =>
  point.x > shape.left - FOOT_RADIUS + EPSILON && point.x < shape.right + FOOT_RADIUS - EPSILON &&
  point.y > shape.top - FOOT_RADIUS + EPSILON && point.y < shape.bottom + FOOT_RADIUS - EPSILON;
const ellipseHolds = (point: Point, shape: EllipseShape) =>
  ((point.x - shape.x) / (shape.radiusX + FOOT_RADIUS)) ** 2 + ((point.y - shape.y) / (shape.radiusY + FOOT_RADIUS)) ** 2 < 1 - EPSILON;
function polyHolds(point: Point, shape: PolyShape) {
  if (!inGrownBox(point, shape.box)) return false;
  for (const plane of shape.planes) if (plane.nx * point.x + plane.ny * point.y >= plane.offset + FOOT_RADIUS - EPSILON) return false;
  return true;
}

export function worldPointBlocked(point: Point, footprints: readonly WorldFootprint[]): boolean {
  const { rects, ellipses, polys } = sets(footprints);
  for (const shape of rects) if (rectHolds(point, shape)) return true;
  for (const shape of ellipses) if (ellipseHolds(point, shape)) return true;
  for (const shape of polys) if (polyHolds(point, shape)) return true;
  return false;
}

/** One footprint on its own (the walk grid's rasteriser). */
function shapeHolds(point: Point, shape: WorldFootprint) {
  return shape.kind === "rect" ? rectHolds(point, shape) : shape.kind === "ellipse" ? ellipseHolds(point, shape)
    : polyHolds(point, { box: polyBox(shape.points), planes: halfPlanes(shape.points) });
}

function ellipseCrossed(from: Point, to: Point, shape: EllipseShape) {
  const x = (from.x - shape.x) / (shape.radiusX + FOOT_RADIUS);
  const y = (from.y - shape.y) / (shape.radiusY + FOOT_RADIUS);
  const dx = (to.x - from.x) / (shape.radiusX + FOOT_RADIUS);
  const dy = (to.y - from.y) / (shape.radiusY + FOOT_RADIUS);
  const lengthSquared = dx * dx + dy * dy;
  const amount = lengthSquared ? clamp(-(x * dx + y * dy) / lengthSquared, 0, 1) : 0;
  return (x + dx * amount) ** 2 + (y + dy * amount) ** 2 < 1 - EPSILON;
}
function rectCrossed(from: Point, to: Point, shape: RectShape) {
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
}
function polyCrossed(from: Point, to: Point, shape: PolyShape) {
  const box = shape.box, reach = FOOT_RADIUS * 3;
  if (Math.max(from.x, to.x) < box.left - reach || Math.min(from.x, to.x) > box.right + reach ||
    Math.max(from.y, to.y) < box.top - reach || Math.min(from.y, to.y) > box.bottom + reach) return false;
  // Clip the segment against each grown edge (Cyrus–Beck).
  let enter = 0, leave = 1;
  for (const plane of shape.planes) {
    const start = plane.nx * from.x + plane.ny * from.y - (plane.offset + FOOT_RADIUS - EPSILON);
    const rate = plane.nx * (to.x - from.x) + plane.ny * (to.y - from.y);
    if (Math.abs(rate) < EPSILON) { if (start >= 0) return false; continue; }
    const t = -start / rate;
    if (rate < 0) enter = Math.max(enter, t); else leave = Math.min(leave, t);
    if (enter >= leave) return false;
  }
  return enter < leave;
}

/** Swept segment tests also prevent a long input step from tunnelling through a post. */
export function worldSegmentClear(from: Point, to: Point, footprints: readonly WorldFootprint[]): boolean {
  const { rects, ellipses, polys } = sets(footprints);
  for (const shape of rects) if (rectCrossed(from, to, shape)) return false;
  for (const shape of ellipses) if (ellipseCrossed(from, to, shape)) return false;
  for (const shape of polys) if (polyCrossed(from, to, shape)) return false;
  return true;
}

/** A convex polygon's corners pushed out past its grown edges. */
function polyCorners(points: readonly Point[], margin: number): Point[] {
  const planes = halfPlanes(points);
  return planes.map((a, i) => {
    const b = planes[(i + 1) % planes.length];
    // Where the two grown edges meet.
    const det = a.nx * b.ny - a.ny * b.nx;
    if (Math.abs(det) < EPSILON) return { x: NaN, y: NaN };
    const oa = a.offset + margin, ob = b.offset + margin;
    return { x: (oa * b.ny - ob * a.ny) / det, y: (a.nx * ob - b.nx * oa) / det };
  }).filter((p) => Number.isFinite(p.x));
}

function detourPoints(footprints: readonly WorldFootprint[], bounds: WorldBounds): Point[] {
  const points: Point[] = [];
  for (const shape of footprints) {
    const margin = FOOT_RADIUS + CLEARANCE;
    if (shape.kind === "poly") {
      points.push(...polyCorners(shape.points, margin));
    } else if (shape.kind === "rect") {
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
    if (shape.kind === "poly") {
      for (const plane of halfPlanes(shape.points)) {
        const gap = plane.offset + margin - (plane.nx * target.x + plane.ny * target.y);
        candidates.push({ x: target.x + plane.nx * gap, y: target.y + plane.ny * gap });
      }
    } else if (shape.kind === "rect") {
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
const CELL_SAMPLES = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]];
interface WalkGrid {
  columns: number; rows: number; blocked: Uint8Array;
  scratch?: { cost: Float64Array; previous: Int32Array; closed: Uint8Array };
}
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
    const box = shape.kind === "rect" ? shape : shape.kind === "poly" ? polyBox(shape.points)
      : { left: shape.x - shape.radiusX, right: shape.x + shape.radiusX, top: shape.y - shape.radiusY, bottom: shape.y + shape.radiusY };
    // A grown polygon's sharp corners reach further than the foot radius (2.24× for a 2:1 diamond's side corners).
    const reach = shape.kind === "poly" ? FOOT_RADIUS * 3 : FOOT_RADIUS;
    const c0 = Math.max(0, Math.floor((box.left - reach) / CELL)), c1 = Math.min(columns - 1, Math.floor((box.right + reach) / CELL));
    const r0 = Math.max(0, Math.floor((box.top - reach) / CELL)), r1 = Math.min(rows - 1, Math.floor((box.bottom + reach) / CELL));
    if (shape.kind === "poly") {
      // A cell is solid when its square reaches past no grown edge (one test per edge).
      const planes = halfPlanes(shape.points).map((plane) => ({ ...plane, limit: plane.offset + FOOT_RADIUS - EPSILON + (Math.abs(plane.nx) + Math.abs(plane.ny)) * CELL / 2 }));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = (c + 0.5) * CELL, y = (r + 0.5) * CELL;
        if (planes.every((plane) => plane.nx * x + plane.ny * y < plane.limit)) blocked[r * columns + c] = 1;
      }
      continue;
    }
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const index = r * columns + c;
      // Conservative: a cell touched anywhere is solid, so paths between open cell centres stay clear.
      if (!blocked[index] && CELL_SAMPLES.some(([dx, dy]) => shapeHolds({ x: (c + dx) * CELL, y: (r + dy) * CELL }, shape))) blocked[index] = 1;
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

/** Open cells near a point with a clear straight line to it, up to `radius` cells away. */
function linkedCells(point: Point, grid: WalkGrid, footprints: readonly WorldFootprint[], radius = 3): number[] {
  const c0 = Math.floor(point.x / CELL), r0 = Math.floor(point.y / CELL);
  const cells: number[] = [];
  for (let r = r0 - radius; r <= r0 + radius; r++) for (let c = c0 - radius; c <= c0 + radius; c++) {
    if (c < 0 || r < 0 || c >= grid.columns || r >= grid.rows) continue;
    const index = r * grid.columns + c;
    if (!grid.blocked[index] && worldSegmentClear(point, centreOf(index, grid), footprints)) cells.push(index);
  }
  return cells;
}

function gridPath(start: Point, target: Point, footprints: readonly WorldFootprint[], bounds: WorldBounds): Point[] {
  const grid = walkGrid(footprints, bounds);
  // The search runs between open cells that see the real start and target, so
  // every hop of the result, including the first and the last, is clear.
  const starts = linkedCells(start, grid, footprints), goals = new Set(linkedCells(target, grid, footprints));
  if (!starts.length || !goals.size) return [];
  const to = cellOf(target, grid);
  // Search buffers are reused per grid: a large map's would otherwise be megabytes per search.
  grid.scratch ??= { cost: new Float64Array(grid.blocked.length), previous: new Int32Array(grid.blocked.length), closed: new Uint8Array(grid.blocked.length) };
  const { cost, previous, closed } = grid.scratch;
  cost.fill(Infinity); previous.fill(-1); closed.fill(0);
  const heuristic = (index: number) => {
    const dx = Math.abs(index % grid.columns - to % grid.columns), dy = Math.abs(Math.floor(index / grid.columns) - Math.floor(to / grid.columns));
    return Math.max(0, (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) - 4) * CELL);
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
  for (const index of starts) {
    cost[index] = distance(start, centreOf(index, grid));
    push([cost[index] + heuristic(index), index]);
  }
  let reached = -1;
  while (heap.length) {
    const [, current] = pop();
    if (closed[current]) continue;
    if (goals.has(current)) { reached = current; break; }
    closed[current] = 1;
    const c = current % grid.columns, r = Math.floor(current / grid.columns);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dc && !dr) continue;
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= grid.columns || nr >= grid.rows) continue;
      const next = nr * grid.columns + nc;
      if (closed[next] || grid.blocked[next]) continue;
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
  if (reached < 0) return [];
  const cells: Point[] = [];
  for (let index = reached; index >= 0; index = previous[index]) cells.unshift(centreOf(index, grid));
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
