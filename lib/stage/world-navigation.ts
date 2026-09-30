import type { Point } from "./types";
import { PAINTED_MAP_FOOTPRINTS } from "./world-footprints-data";

export type WorldFootprint =
  | { kind: "rect"; left: number; top: number; right: number; bottom: number }
  | { kind: "ellipse"; x: number; y: number; radiusX: number; radiusY: number };

const FOOT_RADIUS = 6;
const CLEARANCE = 0.75;
const EPSILON = 0.00001;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const inBounds = (point: Point): Point => ({ x: clamp(point.x, 12, 948), y: clamp(point.y, 18, 628) });

/** Only grounded, authored objects are solid. Paintings without footprints retain open movement. */
export function worldFootprints(key: string, image: string): readonly WorldFootprint[] {
  if (key === "home_player" && image === "/maps/home_player.png") return [
    { kind: "ellipse", x: 520, y: 337, radiusX: 33, radiusY: 22 },
    { kind: "rect", left: 432, top: 493, right: 448, bottom: 546 },
    { kind: "rect", left: 508, top: 478, right: 529, bottom: 530 },
  ];
  if (key === "city_capital" && image === "/maps/city_capital.png") return [
    // Wall footprints, not roof overhangs: narrow authored alleys remain passable.
    { kind: "rect", left: 151, top: 415, right: 260, bottom: 483 },
    { kind: "rect", left: 280, top: 415, right: 380, bottom: 480 },
    { kind: "rect", left: 404, top: 414, right: 506, bottom: 480 },
    { kind: "rect", left: 529, top: 415, right: 630, bottom: 481 },
    { kind: "rect", left: 650, top: 417, right: 730, bottom: 481 },
    { kind: "rect", left: 755, top: 418, right: 850, bottom: 482 },
    { kind: "ellipse", x: 477, y: 315, radiusX: 15, radiusY: 11 },
    { kind: "rect", left: 286, top: 319, right: 400, bottom: 352 },
    { kind: "rect", left: 548, top: 319, right: 654, bottom: 354 },
    { kind: "rect", left: 363, top: 245, right: 450, bottom: 283 },
    { kind: "rect", left: 517, top: 239, right: 610, bottom: 274 },
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
  return [];
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

function detourPoints(footprints: readonly WorldFootprint[]): Point[] {
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
  return points.filter((point) => distance(point, inBounds(point)) < EPSILON && !worldPointBlocked(point, footprints));
}

/** Clicks on a solid object stop at its nearest accessible ground edge. */
export function nearestWorldGround(point: Point, footprints: readonly WorldFootprint[]): Point {
  const target = inBounds(point);
  if (!worldPointBlocked(target, footprints)) return target;
  const candidates = detourPoints(footprints);
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
  return candidates.map(inBounds).filter((candidate) => !worldPointBlocked(candidate, footprints))
    .sort((a, b) => distance(a, target) - distance(b, target))[0] ?? target;
}

/** Slide input along a solid edge; each substep remains bounded and swept. */
export function moveOnWorldGround(from: Point, delta: Point, footprints: readonly WorldFootprint[]): Point {
  let result = nearestWorldGround(from, footprints);
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / 4));
  const dx = delta.x / steps;
  const dy = delta.y / steps;
  for (let step = 0; step < steps; step++) {
    const next = inBounds({ x: result.x + dx, y: result.y + dy });
    if (worldSegmentClear(result, next, footprints)) { result = next; continue; }
    const axes = Math.abs(dx) > Math.abs(dy) ? [{ x: dx, y: 0 }, { x: 0, y: dy }] : [{ x: 0, y: dy }, { x: dx, y: 0 }];
    for (const axis of axes) {
      const slide = inBounds({ x: result.x + axis.x, y: result.y + axis.y });
      if (worldSegmentClear(result, slide, footprints)) result = slide;
    }
  }
  return result;
}

/** Shortest visibility-graph route around the few explicitly authored solids. */
export function planWorldPath(from: Point, destination: Point, footprints: readonly WorldFootprint[]): Point[] {
  const start = nearestWorldGround(from, footprints);
  const target = nearestWorldGround(destination, footprints);
  if (worldSegmentClear(start, target, footprints)) return [target];
  const nodes = [start, target, ...detourPoints(footprints)];
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
