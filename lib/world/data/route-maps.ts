// ─── Route (edge) maps ────────────────────────────────────────────────
//
// Travel screens between locations reuse a small set of road paintings
// keyed by edge TYPE (mountain trail, forest road, coastal path, ...),
// classified from the two endpoint location ids. Each painting shows a
// road running bottom → top: the player walks up to the destination
// marker at the top edge, or back down to the return marker at the
// bottom. Only generated `route_<src>__to__<dst>` scenes get maps —
// authored/tutorial route scenes keep the classic card UI.

import type { MapPoint } from "./location-maps";
import { regionOf } from "./regions";

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
  /** Draw the painting mirrored left↔right (the road stays centred). */
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

// Shared geometry: road runs up the middle. Destination gate sits at the
// top of the road; extra destinations (rare) fan out beside it.
const GEOMETRY = {
  zoom: 1.7,
  spawn: { x: 50, y: 80 },
  destSlots: [
    { x: 50, y: 12 },
    { x: 30, y: 16 },
    { x: 70, y: 16 },
    { x: 18, y: 24 },
    { x: 82, y: 24 },
  ],
  back: { x: 50, y: 93 },
} as const;

export function getRouteMap(routeSceneId: string): RouteMapDef | undefined {
  if (!routeSceneId.startsWith("route_")) return undefined;
  const sep = routeSceneId.indexOf("__to__");
  if (sep < 0) return undefined;
  const src = routeSceneId.slice("route_".length, sep);
  const dst = routeSceneId.slice(sep + "__to__".length);
  const type = classifyRouteEdge(src, dst);
  return { image: routeImage(type, src, dst), mirror: routeMirror(src, dst), ...GEOMETRY };
}

// Region grades (scripts/build-route-variants.ts): the road takes the look of
// the land it crosses — the more distinctive endpoint region wins, with the
// destination preferred. Heartland keeps the original painting.
const GRADED = new Set(["north", "west", "south", "east", "jianghu_wild"]);
function routeImage(type: RouteMapType, src: string, dst: string): string {
  const region = [regionOf(dst), regionOf(src)].find((r) => GRADED.has(r));
  return region ? `/maps/routes/${type}-${region}.webp` : `/maps/routes/${type}.webp`;
}

/** Stable per road (both directions agree), so the same road never flips. */
function routeMirror(src: string, dst: string): boolean {
  const key = [src, dst].sort().join("|");
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return (hash >>> 0) % 2 === 1;
}
