// ─── Route (edge) maps ────────────────────────────────────────────────
//
// Travel screens between locations reuse a set of top-down road paintings
// keyed by edge TYPE (mountain trail, forest road, coastal path, ...),
// classified from the two endpoint location ids, and by DIRECTION: the
// road runs the way the player left. Leave a place by its right-hand
// (east) exit and the road is painted west → east: the hero starts at the
// left edge and walks right to the destination marker, then arrives on the
// left side of the next place (lib/stage/types.ts arrival hints). Only
// generated `route_<src>__to__<dst>` scenes get maps — authored/tutorial
// route scenes keep the classic card UI.

import { mapExitTo, type MapPoint } from "./location-maps";
import { regionOf } from "./regions";
import { DIR8, dir8Of, dirVector, mapPointDir, worldBearing, type Dir8 } from "../compass";

export type RouteMapType =
  | "highway"
  | "country"
  | "forest"
  | "mountain"
  | "gorge"
  | "coast"
  | "lane";

export interface RouteMapDef {
  image: string;
  /** Region whose colour grade the painting gets when drawn (lib/stage/route-grade.ts); none = heartland. */
  grade?: string;
  /** The way the road runs, from the start (back marker) to the destination. */
  direction: Dir8;
  /** Draw the painting mirrored left↔right. Unused by the 8-direction set. */
  mirror?: boolean;
  zoom: number;
  spawn: MapPoint;
  /** destination marker slots, assigned in destination order */
  destSlots: readonly MapPoint[];
  back: MapPoint;
}

// Endpoint prefix groups, checked in priority order — water beats rock,
// rock beats road. Sects sit on mountains (see world-map lore).
const WATER = ["isle_", "sea_"];
const ROCK = ["cave_", "valley_", "pool_", "desert_"];
const MOUNT = ["mt_", "peak_", "cliff_", "sect_", "viewpoint"];
const CITYLIKE = ["city_", "palace_"];
const RURAL = ["village", "tribe_", "market_", "villa_", "inn_", "tavern"];
const HOMEY = ["home_"];

const PEAKS = ["mt_", "peak_", "cliff_", "viewpoint"];
function highland(id: string): boolean {
  if (PEAKS.some((p) => id.startsWith(p))) return true;
  if (!id.startsWith("sect_")) return false;
  const region = regionOf(id);
  return region === "north" || region === "west";
}

function group(id: string): string {
  const hit = (list: string[]) => list.some((p) => id.startsWith(p));
  if (hit(WATER)) return "water";
  if (hit(ROCK)) return "rock";
  if (hit(MOUNT)) return "mount";
  if (hit(CITYLIKE)) return "city";
  if (hit(RURAL)) return "rural";
  if (hit(HOMEY)) return "home";
  return "wild";
}

export function classifyRouteEdge(src: string, dst: string): RouteMapType {
  const g = new Set([group(src), group(dst)]);
  if (g.has("water")) return "coast";
  if (g.has("rock")) return "gorge";
  // True highland (peaks, cliffs, northern/western sects) climbs the mountain
  // pass; sects set in the lowland south, east and heartland sit in forest.
  if ([src, dst].some(highland)) return "mountain";
  if (g.has("mount")) return "forest";
  if (g.has("home")) return g.has("city") || g.has("home") ? "lane" : "forest";
  if (g.has("city") && g.size === 1) return "highway";
  if (g.has("rural")) return "country";
  if (g.has("city")) return "highway";
  return "forest";
}

/**
 * The way a road runs. It leaves the start place by the side its exit sits on
 * (so the painting continues the way the player walked off the map); a road
 * with no exit on the map (a card) follows the world-map bearing instead.
 */
export function routeDirection(src: string, dst: string): Dir8 {
  const exit = mapExitTo(src, dst);
  if (exit) return mapPointDir(exit);
  const bearing = worldBearing(src, dst);
  return bearing === null ? "N" : dir8Of(Math.cos(bearing), Math.sin(bearing));
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** A point `t` of the way along the painted road, edge to edge (percent of the 3:2 painting). */
function along(dir: Dir8, t: number): MapPoint {
  const v = dirVector(dir);
  // Edge-to-edge in each axis: cardinal roads cross the middle, diagonals run corner to corner.
  const sx = v.x === 0 ? 0 : Math.sign(v.x) * 46, sy = v.y === 0 ? 0 : Math.sign(v.y) * 45;
  return { x: clamp(50 + sx * (2 * t - 1), 3, 97), y: clamp(50 + sy * (2 * t - 1), 4, 95) };
}

/** Spawn, destination and back markers for a road running `dir`. */
export function routeGeometry(dir: Dir8): Pick<RouteMapDef, "zoom" | "spawn" | "destSlots" | "back"> {
  const dest = along(dir, 0.97);
  // Rare extra destinations fan out beside the far end.
  const side = dirVector(DIR8[(DIR8.indexOf(dir) + 2) % 8]);
  const extra = [1, -1, 2, -2].map((k) => ({ x: clamp(dest.x + side.x * 14 * k, 6, 94), y: clamp(dest.y + side.y * 12 * k, 8, 92) }));
  return { zoom: 1.7, spawn: along(dir, 0.12), destSlots: [dest, ...extra], back: along(dir, 0.02) };
}

export function getRouteMap(routeSceneId: string): RouteMapDef | undefined {
  if (!routeSceneId.startsWith("route_")) return undefined;
  const sep = routeSceneId.indexOf("__to__");
  if (sep < 0) return undefined;
  const src = routeSceneId.slice("route_".length, sep);
  const dst = routeSceneId.slice(sep + "__to__".length);
  const type = classifyRouteEdge(src, dst);
  const direction = routeDirection(src, dst);
  return { image: routeImage(type, direction), grade: routeRegion(src, dst) ?? undefined, direction, ...routeGeometry(direction) };
}

// Region grades: the road takes the look of the land it crosses — the more
// distinctive endpoint region wins, with the destination preferred. Heartland
// keeps the painting as it is; the others are graded when the road map is
// drawn (lib/stage/route-grade.ts), so 56 base paintings serve every region.
const GRADED = new Set(["north", "west", "south", "east", "jianghu_wild"]);
export function routeRegion(src: string, dst: string): string | null {
  return [regionOf(dst), regionOf(src)].find((r) => GRADED.has(r)) ?? null;
}
export function routeImage(type: RouteMapType, dir: Dir8): string {
  return `/maps/routes/${type}-${dir}.webp`;
}
