// Compass directions between places, from their spot on the world map
// (data/world-coords.ts). Screen convention everywhere: x right = east,
// y down = south. Map points are percent of a 3:2 painting, so their
// x offsets are scaled by 1.5 before taking an angle.

import { WORLD_COORDS } from "./data/world-coords";

export type Dir8 = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
/** Clockwise from north. */
export const DIR8: readonly Dir8[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const DIR8_LABEL: Record<Dir8, string> = {
  N: "เหนือ", NE: "ตะวันออกเฉียงเหนือ", E: "ตะวันออก", SE: "ตะวันออกเฉียงใต้",
  S: "ใต้", SW: "ตะวันตกเฉียงใต้", W: "ตะวันตก", NW: "ตะวันตกเฉียงเหนือ",
};

/** Screen angle (radians, 0 = east, clockwise because y points down). */
export const angleOf = (dx: number, dy: number) => Math.atan2(dy, dx);

/** The nearest of the eight directions to a screen vector. */
export function dir8Of(dx: number, dy: number): Dir8 {
  // 0 = north, clockwise in 45° steps.
  const turns = (angleOf(dx, dy) + Math.PI / 2) / (Math.PI / 4);
  return DIR8[((Math.round(turns) % 8) + 8) % 8];
}

export function dirVector(dir: Dir8): { x: number; y: number } {
  const a = DIR8.indexOf(dir) * Math.PI / 4 - Math.PI / 2;
  return { x: Math.round(Math.cos(a) * 1e6) / 1e6, y: Math.round(Math.sin(a) * 1e6) / 1e6 };
}

export const oppositeDir = (dir: Dir8): Dir8 => DIR8[(DIR8.indexOf(dir) + 4) % 8];

/** Angle from one place to another on the world map, or null when either has no spot. */
export function worldBearing(from: string, to: string): number | null {
  const a = WORLD_COORDS[from], b = WORLD_COORDS[to];
  if (!a || !b || (a.x === b.x && a.y === b.y)) return null;
  return angleOf(b.x - a.x, b.y - a.y);
}

/** Angle of a point on a 3:2 map painting, seen from its centre. */
export const mapPointAngle = (p: { x: number; y: number }) => angleOf((p.x - 50) * 1.5, p.y - 50);

export const mapPointDir = (p: { x: number; y: number }): Dir8 => dir8Of((p.x - 50) * 1.5, p.y - 50);

/** Smallest difference between two angles, 0…π. */
export function angleGap(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/** Extra cost (radians) for using an exit slot with no painted path: ~43°. */
export const UNPAINTED_SLOT_COST = 0.75;

/**
 * Put each destination on the exit slot that best matches its compass bearing
 * on the world map. Slots below `painted` have a path in the painting and are
 * preferred; any other slot may be used when the painted ones point more than
 * ~43° away from the destination. Each slot holds one exit; with more
 * destinations than slots, the worst fits are left over (they stay as cards).
 * Exact: a DP over destinations × the set of used slots.
 * Returns the slot index per destination (−1 = no slot).
 */
export function assignSlotsByBearing(from: string, dests: readonly string[], slots: readonly { x: number; y: number }[],
  painted = slots.length): number[] {
  const k = slots.length;
  const cost = dests.map((d) => {
    const bearing = worldBearing(from, d);
    return slots.map((s, i) => (bearing === null ? i : angleGap(bearing, mapPointAngle(s))) + (i >= painted ? UNPAINTED_SLOT_COST : 0));
  });
  const placeable = Math.min(k, dests.length);
  const memo = new Map<number, { c: number; pick: number }>();
  const best = (i: number, mask: number): number => {
    if (i === dests.length) return popcount(mask) === placeable ? 0 : Infinity;
    const key = i * 1024 + mask;
    const hit = memo.get(key); if (hit) return hit.c;
    let c = Infinity, pick = -1;
    if (dests.length - i - 1 >= placeable - popcount(mask)) c = best(i + 1, mask);
    for (let s = 0; s < k; s++) {
      if (mask & (1 << s)) continue;
      const v = cost[i][s] + best(i + 1, mask | (1 << s));
      if (v < c - 1e-9) { c = v; pick = s; }
    }
    memo.set(key, { c, pick });
    return c;
  };
  best(0, 0);
  const out: number[] = [];
  let mask = 0;
  for (let i = 0; i < dests.length; i++) {
    const pick = memo.get(i * 1024 + mask)?.pick ?? -1;
    out.push(pick);
    if (pick >= 0) mask |= 1 << pick;
  }
  return out;
}

function popcount(n: number): number { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }
