import type { ComposedMap } from "./types";

/** One grid tile on screen: a 2:1 diamond this many world units wide and tall. */
export const ISO_TILE_W = 64;
export const ISO_TILE_H = 32;
/** Room above the grid's top corner for the tallest roofs there. */
export const ISO_TOP_PAD = 160;

type Grid = Pick<ComposedMap, "columns" | "rows">;

/** The map's size in world units: the grid's bounding box plus the top pad. */
export const isoSize = (map: Grid) => ({
  width: (map.columns + map.rows) * ISO_TILE_W / 2,
  height: (map.columns + map.rows) * ISO_TILE_H / 2 + ISO_TOP_PAD,
});

/** Grid point → world point. */
export function isoToWorld(map: Grid, u: number, v: number) {
  return { x: (u - v + map.rows) * ISO_TILE_W / 2, y: (u + v) * ISO_TILE_H / 2 + ISO_TOP_PAD };
}

/** World point → grid point. */
export function worldToIso(map: Grid, x: number, y: number) {
  const a = x / (ISO_TILE_W / 2) - map.rows, b = (y - ISO_TOP_PAD) / (ISO_TILE_H / 2);
  return { u: (a + b) / 2, v: (b - a) / 2 };
}

/** A grid point as a location-map percentage (markers, spawn). */
export function isoPercent(map: Grid, u: number, v: number) {
  const point = isoToWorld(map, u, v), size = isoSize(map);
  return { x: Math.round(point.x / size.width * 1000) / 10, y: Math.round(point.y / size.height * 1000) / 10 };
}

/** The four screen corners of a grid rectangle, clockwise from the top. */
export function isoDiamond(map: Grid, u0: number, v0: number, u1: number, v1: number) {
  return [isoToWorld(map, u0, v0), isoToWorld(map, u1, v0), isoToWorld(map, u1, v1), isoToWorld(map, u0, v1)];
}
