/**
 * NPC wandering on a map (pure — no Phaser, no DOM, testable).
 *
 * NPCs with a rigged animation sheet (ANIMATED_NPC_IDS) stroll around their
 * map spot: pick a standable point within WANDER_RADIUS of home, walk there
 * at WANDER_SPEED, pause 1.5–4.5 s, repeat. The runtime freezes a wanderer
 * while the hero is close, approaching or aiming at it, while the map is
 * paused, and under prefers-reduced-motion, so talking to someone never
 * means chasing them.
 */
import { stepTowards, type Point } from "./types";

export const WANDER_RADIUS = 34;
export const WANDER_SPEED = 36;
/** A wanderer stops while the hero is this close (map units). */
export const WANDER_FREEZE_DISTANCE = 120;

export type Facing = "east" | "west" | "north" | "south";
export interface Wanderer {
  home: Point;
  pos: Point;
  target: Point | null;
  /** Seconds left in the current pause. */
  wait: number;
  facing: Facing;
  moving: boolean;
  random: () => number;
}

/** Small deterministic PRNG so every NPC strolls differently but reproducibly. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedFor(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return hash >>> 0;
}

export function createWanderer(id: string, home: Point): Wanderer {
  const random = seededRandom(seedFor(id));
  // Stagger the first stroll so a crowd doesn't set off in step.
  return { home: { ...home }, pos: { ...home }, target: null, wait: 0.6 + random() * 3, facing: "south", moving: false, random };
}

/** Advance one wanderer by `dt` seconds. `canStand` says whether a point is walkable. */
export function stepWanderer(w: Wanderer, dt: number, frozen: boolean, canStand: (point: Point) => boolean): void {
  w.moving = false;
  if (frozen) { w.target = null; return; }
  if (w.wait > 0) { w.wait -= dt; return; }
  if (!w.target) {
    for (let attempt = 0; attempt < 6 && !w.target; attempt++) {
      const angle = w.random() * Math.PI * 2, reach = WANDER_RADIUS * (0.35 + w.random() * 0.65);
      // Flatter vertically: the map is seen at an angle.
      const point = { x: w.home.x + Math.cos(angle) * reach, y: w.home.y + Math.sin(angle) * reach * 0.6 };
      if (canStand(point)) w.target = point;
    }
    if (!w.target) { w.wait = 2; return; }
  }
  const next = stepTowards(w.pos, w.target, WANDER_SPEED * dt);
  const dx = next.x - w.pos.x, dy = next.y - w.pos.y;
  if (!canStand(next)) { w.target = null; w.wait = 1 + w.random() * 2; return; }
  if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
    w.facing = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "north" : "south") : (dx < 0 ? "west" : "east");
    w.moving = true;
  }
  w.pos = next;
  if (Math.hypot(w.pos.x - w.target.x, w.pos.y - w.target.y) < 0.5) {
    w.target = null;
    w.wait = 1.5 + w.random() * 3;
  }
}
