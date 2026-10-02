/**
 * Eight-direction walking for the heroes (`<id>-walk8.png`, built by
 * scripts/build-hero-walk8.ts). Five directions are painted — S, SE, E, NE, N —
 * and the three west-facing ones are their east twins mirrored.
 *
 * In the character atlas the walk8 cells follow the 24 base + direction cells:
 * rows 0–4 are the four-step walks in WALK8_DIRECTIONS order, row 5 the
 * standing poses S, SE, E, NE and row 6 the standing pose N.
 */
export const WALK8_DIRECTIONS = ["S", "SE", "E", "NE", "N"] as const;
export type Walk8Direction = typeof WALK8_DIRECTIONS[number];
export type Dir8 = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

/** First atlas frame of the walk8 cells (after 16 base + 8 direction frames). */
export const WALK8_FIRST_FRAME = 24;
export const WALK8_FRAMES = 28;
export const WALK8_FPS = 8;

/** The painted row and mirroring for a direction. */
export function walk8Source(dir: Dir8): { row: Walk8Direction; mirror: boolean } {
  switch (dir) {
    case "SW": return { row: "SE", mirror: true };
    case "W": return { row: "E", mirror: true };
    case "NW": return { row: "NE", mirror: true };
    default: return { row: dir, mirror: false };
  }
}

/** Atlas frame for walking (step 0–3) or standing (`step` null) toward `dir`. */
export function walk8Frame(dir: Dir8, step: number | null): { frame: number; mirror: boolean } {
  const { row, mirror } = walk8Source(dir);
  const index = WALK8_DIRECTIONS.indexOf(row);
  const frame = step === null ? WALK8_FIRST_FRAME + 20 + index : WALK8_FIRST_FRAME + index * 4 + (step % 4);
  return { frame, mirror };
}

const SECTORS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"] as const;
/** Keep the current heading until the movement leaves its sector by this much (no flicker on a boundary). */
const HYSTERESIS = Math.PI / 30;

/**
 * The direction of a movement on the map (x right, y down). The map is drawn
 * in a high three-quarter view, so vertical motion is weighted a little to
 * keep diagonals for real diagonal moves.
 */
export function dir8FromVector(dx: number, dy: number, current: Dir8 = "S"): Dir8 {
  if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) return current;
  const angle = Math.atan2(dy * 1.15, dx); // 0 = east, π/2 = south
  const held = SECTORS.indexOf(current) * Math.PI / 4;
  const off = Math.abs(((angle - held + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
  if (off <= Math.PI / 8 + HYSTERESIS) return current;
  return SECTORS[(Math.round(angle / (Math.PI / 4)) + 8) % 8];
}
