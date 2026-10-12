// The world atlas (แผนที่โลก): every place on the world map with its kind and
// region, the roads between them, the five regions' outlines, where the hero
// is, and the walk from one place to another. Pure — the popup
// (components/world/popups/world-map-popup.tsx) draws it over the painted
// map (public/maps/world-atlas.webp, painted to WORLD_COORDS).

import { WORLD_COORDS, WORLD_MAP_SIZE } from "./data/world-coords";
import { CENTRAL_RADIUS, regionOf } from "./data/regions";
import { classifyRouteEdge, type RouteMapType } from "./data/route-maps";
import { getScene } from "./data/scenes";
import { DIR8_LABEL, dir8Of } from "./compass";
import { hasStation } from "./stations";
import { FERRYMAN, ferryFare, hasFerry, isFerryHop } from "./ferries";
import { LOCATION_ROUTES } from "./data/location-routes";
import { pathBetween, routeBackTarget } from "./quest-guide";
import type { Region, WorldStateData } from "./types";

export const ATLAS_IMAGE = "/maps/world-atlas.webp";
export const ATLAS_SIZE = WORLD_MAP_SIZE;

/** The five regions a place can be in, in the order the map's tabs list them. */
export const ATLAS_REGIONS = ["heartland", "north", "south", "east", "west"] as const satisfies readonly Region[];
export type AtlasRegion = (typeof ATLAS_REGIONS)[number];

export const REGION_LABEL: Record<AtlasRegion, string> = {
  heartland: "ภาคกลาง", north: "ภาคเหนือ", south: "ภาคใต้", east: "ภาคตะวันออก", west: "ภาคตะวันตก",
};

export type PlaceKind =
  | "city" | "sect" | "village" | "home" | "inn" | "temple" | "villa"
  | "cave" | "isle" | "peak" | "water" | "desert" | "camp";

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  city: "เมือง", sect: "สำนัก", village: "หมู่บ้าน", home: "บ้านยอดยุทธ", inn: "โรงเตี๊ยม", temple: "วัดและวัง",
  villa: "คฤหาสน์", cave: "ถ้ำและหุบเขา", isle: "เกาะ", peak: "ภูเขาและหน้าผา", water: "ทะเลสาบและสระ",
  desert: "ทะเลทราย", camp: "ชนเผ่าและตลาด",
};

const KIND_BY_PREFIX: readonly [string, PlaceKind][] = [
  ["city_", "city"], ["palace_", "temple"], ["sect_", "sect"], ["village_", "village"], ["home_", "home"],
  ["inn_", "inn"], ["temple_", "temple"], ["villa_", "villa"], ["cave_", "cave"], ["valley_", "cave"],
  ["isle_", "isle"], ["mt_", "peak"], ["peak_", "peak"], ["cliff_", "peak"], ["sea_", "water"],
  ["pool_", "water"], ["desert_", "desert"], ["tribe_", "camp"], ["market_", "camp"],
];

export function placeKind(id: string): PlaceKind {
  return KIND_BY_PREFIX.find(([prefix]) => id.startsWith(prefix))?.[1] ?? "village";
}

export interface AtlasPlace {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  kind: PlaceKind;
  region: AtlasRegion;
  station: boolean;
  /** The boatman calls here (a port or an island). */
  ferry: boolean;
}

export interface AtlasRoad {
  a: string;
  b: string;
  type: RouteMapType;
  /** The road's name seen from each end (the location's exit label). */
  labelA: string;
  labelB: string;
  /** A sea lane: sailed with the boatman, not walked. */
  sea?: boolean;
}

export const ROAD_TYPE_LABEL: Record<RouteMapType, string> = {
  highway: "ทางหลวง", country: "ทางชนบท", forest: "ทางป่า", mountain: "ทางขึ้นเขา",
  gorge: "ทางหุบผา", coast: "ทางเรือ", lane: "ทางตรอก",
};

const asAtlasRegion = (region: Region): AtlasRegion =>
  (ATLAS_REGIONS as readonly Region[]).includes(region) ? region as AtlasRegion : "heartland";

let places: AtlasPlace[] | null = null;
let roads: AtlasRoad[] | null = null;

/** Every location with a spot on the world map. */
export function atlasPlaces(): readonly AtlasPlace[] {
  places ??= Object.entries(WORLD_COORDS).flatMap(([id, point]) => {
    const scene = getScene(id);
    if (scene?.kind !== "location") return [];
    return [{
      id, name: scene.name, description: scene.description ?? "", x: point.x, y: point.y,
      kind: placeKind(id), region: asAtlasRegion(regionOf(id)), station: hasStation(id), ferry: hasFerry(id),
    }];
  });
  return places;
}

const PLACE_BY_ID = () => new Map(atlasPlaces().map((p) => [p.id, p]));
let placeIndex: Map<string, AtlasPlace> | null = null;
export function atlasPlace(id: string | null | undefined): AtlasPlace | undefined {
  if (!id) return undefined;
  placeIndex ??= PLACE_BY_ID();
  return placeIndex.get(id);
}

/** The walkable roads between placed locations, once each (the scenes' own route exits). */
export function atlasRoads(): readonly AtlasRoad[] {
  if (roads) return roads;
  const found = new Map<string, AtlasRoad>();
  for (const place of atlasPlaces()) {
    const scene = getScene(place.id);
    if (scene?.kind !== "location") continue;
    for (const ref of scene.routes) {
      const route = getScene(ref.routeSceneId);
      if (route?.kind !== "route") continue;
      for (const destination of route.destinations) {
        const other = destination.locationId;
        if (other === place.id || !atlasPlace(other)) continue;
        const [a, b] = [place.id, other].sort();
        const key = `${a}|${b}`;
        const road = found.get(key) ?? { a, b, type: classifyRouteEdge(a, b), labelA: "", labelB: "" };
        if (place.id === a) road.labelA = ref.label; else road.labelB = ref.label;
        found.set(key, road);
      }
    }
  }
  // The sea lanes the boats sail (drawn as boat lanes; any pier reaches any other).
  for (const lane of LOCATION_ROUTES) {
    if (!lane.sea || !atlasPlace(lane.a) || !atlasPlace(lane.b)) continue;
    const [a, b] = [lane.a, lane.b].sort();
    found.set(`${a}|${b}`, { a, b, type: "coast", labelA: a === lane.a ? lane.fromA : lane.fromB, labelB: a === lane.a ? lane.fromB : lane.fromA, sea: true });
  }
  roads = [...found.values()];
  return roads;
}

/** The road between two neighbouring places, if there is one. */
export function atlasRoad(from: string, to: string): AtlasRoad | undefined {
  const [a, b] = [from, to].sort();
  return atlasRoads().find((road) => road.a === a && road.b === b);
}

/** Where the hero stands on the world map: at a place, or on the road between two. */
export type AtlasPosition =
  | { kind: "place"; id: string }
  | { kind: "road"; from: string; to: string }
  | { kind: "off"; id: string | null };

export function atlasPosition(state: Pick<WorldStateData, "currentSceneId" | "lastLocationId">): AtlasPosition {
  const scene = getScene(state.currentSceneId);
  if (scene?.kind === "route") {
    const parsed = /^route_(.+)__to__(.+)$/.exec(scene.id);
    if (parsed && atlasPlace(parsed[1]) && atlasPlace(parsed[2])) return { kind: "road", from: parsed[1], to: parsed[2] };
    const back = routeBackTarget(state, scene);
    if (back && atlasPlace(back)) return { kind: "place", id: back };
  }
  if (scene?.kind === "location" && atlasPlace(scene.id)) return { kind: "place", id: scene.id };
  const last = state.lastLocationId;
  if (last && atlasPlace(last)) return { kind: "place", id: last };
  return { kind: "off", id: scene?.kind === "location" ? scene.id : last ?? null };
}

/** The point to draw the hero at (a road: its middle). */
export function positionPoint(position: AtlasPosition): { x: number; y: number } | null {
  if (position.kind === "place") return atlasPlace(position.id) ?? null;
  if (position.kind === "road") {
    const a = atlasPlace(position.from), b = atlasPlace(position.to);
    return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
  }
  return null;
}

/** The place routing starts from: where the hero stands, or the road's far end when walking one. */
export function routingOrigin(position: AtlasPosition): string | null {
  if (position.kind === "place") return position.id;
  if (position.kind === "road") return position.to;
  return position.id;
}

export interface AtlasStep {
  from: string;
  to: string;
  /** The exit's name at `from` (ทางหลวงราชา, ทางขึ้นเขา…). */
  road: string;
  type: RouteMapType;
  /** Compass direction of the step, in Thai. */
  direction: string;
  /** A boat ride with the boatman, and its fare in gold. */
  ferry?: { gold: number };
}

/** The walk from one place to another, step by step, or null when no road leads there. */
export function atlasRoute(from: string, to: string): AtlasStep[] | null {
  const path = pathBetween(from, to);
  if (!path) return null;
  const steps: AtlasStep[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const road = atlasRoad(a, b);
    const pa = atlasPlace(a), pb = atlasPlace(b);
    const direction = pa && pb ? DIR8_LABEL[dir8Of(pb.x - pa.x, pb.y - pa.y)] : "";
    if (isFerryHop(a, b) && (!road || road.sea)) {
      steps.push({ from: a, to: b, road: `เรือของ${FERRYMAN.name}`, type: "coast", direction, ferry: { gold: ferryFare(a, b).gold } });
      continue;
    }
    steps.push({
      from: a, to: b,
      road: road ? (road.a === a ? road.labelA : road.labelB) || ROAD_TYPE_LABEL[road.type] : "ทางเดิน",
      type: road?.type ?? "country",
      direction,
    });
  }
  return steps;
}

/** The places next to one, by road. */
export function atlasNeighbours(id: string): { id: string; road: AtlasRoad }[] {
  return atlasRoads().flatMap((road) => road.a === id ? [{ id: road.b, road }] : road.b === id ? [{ id: road.a, road }] : []);
}

// ─── Region outlines ─────────────────────────────────────────────────

const CAPITAL = WORLD_COORDS.city_capital;

/** The heartland: a circle of CENTRAL_RADIUS around the capital (regionAt). */
export const HEARTLAND_CIRCLE = { cx: CAPITAL.x, cy: CAPITAL.y, r: CENTRAL_RADIUS };

/**
 * The four outer regions are the compass quarters seen from the capital,
 * split on the diagonals (regionAt): each is a polygon from the capital out
 * to the map's edge. The popup cuts the heartland circle out of them.
 */
export function regionPolygon(region: Exclude<AtlasRegion, "heartland">): { x: number; y: number }[] {
  const { width: w, height: h } = ATLAS_SIZE;
  const far = 4000;
  const ray = (deg: number) => {
    const a = deg * Math.PI / 180;
    return { x: CAPITAL.x + Math.cos(a) * far, y: CAPITAL.y - Math.sin(a) * far };
  };
  // Angles measured counter-clockwise from east, y up (as regionAt).
  const span: Record<typeof region, [number, number]> = { east: [-45, 45], north: [45, 135], west: [135, 225], south: [225, 315] };
  const [from, to] = span[region];
  const raw = [CAPITAL, ray(from), ray((from + to) / 2), ray(to)];
  return clipToRect(raw, w, h);
}

/** Sutherland–Hodgman against the map rectangle. */
function clipToRect(points: { x: number; y: number }[], w: number, h: number): { x: number; y: number }[] {
  const edges: [(p: { x: number; y: number }) => boolean, (a: { x: number; y: number }, b: { x: number; y: number }) => { x: number; y: number }][] = [
    [(p) => p.x >= 0, (a, b) => ({ x: 0, y: a.y + (b.y - a.y) * (0 - a.x) / (b.x - a.x) })],
    [(p) => p.x <= w, (a, b) => ({ x: w, y: a.y + (b.y - a.y) * (w - a.x) / (b.x - a.x) })],
    [(p) => p.y >= 0, (a, b) => ({ x: a.x + (b.x - a.x) * (0 - a.y) / (b.y - a.y), y: 0 })],
    [(p) => p.y <= h, (a, b) => ({ x: a.x + (b.x - a.x) * (h - a.y) / (b.y - a.y), y: h })],
  ];
  let out = points;
  for (const [inside, cut] of edges) {
    const input = out; out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i], prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cut(prev, cur));
    }
  }
  return out.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

/**
 * Where to write a region's name: the open spot inside the region farthest
 * from any place (so the name covers no marker), drawn a little toward the
 * region's middle. The heartland's name sits in its own circle.
 */
const labelPoints = new Map<AtlasRegion, { x: number; y: number }>();
export function regionLabelPoint(region: AtlasRegion): { x: number; y: number } {
  const cached = labelPoints.get(region);
  if (cached) return cached;
  const all = atlasPlaces();
  const members = all.filter((p) => p.region === region);
  const mid = {
    x: members.reduce((s, p) => s + p.x, 0) / Math.max(1, members.length),
    y: members.reduce((s, p) => s + p.y, 0) / Math.max(1, members.length),
  };
  const { cx, cy, r } = HEARTLAND_CIRCLE;
  let best = mid, bestScore = -Infinity;
  for (let x = 90; x <= ATLAS_SIZE.width - 90; x += 15) {
    for (let y = 50; y <= ATLAS_SIZE.height - 50; y += 15) {
      const fromCapital = Math.hypot(x - cx, y - cy);
      if (region === "heartland" ? fromCapital > r - 30 : regionAtPoint(x, y) !== region || fromCapital < r + 40) continue;
      // A name is about 220 × 50 units (the heartland's 150 × 40): keep its box clear of markers and their names.
      const [hw, hh] = region === "heartland" ? [80, 24] : [115, 30];
      let clear = Infinity, covered = 0;
      for (const p of all) {
        const gx = Math.abs(p.x - x) - hw, gy = Math.abs(p.y - y) - hh;
        if (gx < 0 && gy < 0) covered++;
        clear = Math.min(clear, Math.max(gx, gy, 0));
      }
      const score = -covered * 100 + Math.min(clear, 60) * 4 - Math.hypot(x - mid.x, y - mid.y) * 0.3;
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
  }
  const point = { x: Math.round(best.x), y: Math.round(best.y) };
  labelPoints.set(region, point);
  return point;
}

/** The region a world-map point lies in (as regionAt in data/regions.ts). */
function regionAtPoint(x: number, y: number): AtlasRegion {
  const dx = x - CAPITAL.x, dy = y - CAPITAL.y;
  if (Math.hypot(dx, dy) <= CENTRAL_RADIUS) return "heartland";
  const angle = Math.atan2(-dy, dx) * 180 / Math.PI;
  if (angle >= -45 && angle < 45) return "east";
  if (angle >= 45 && angle < 135) return "north";
  if (angle >= -135 && angle < -45) return "south";
  return "west";
}

/** The box around a region's places, padded, for zooming the map to it. */
export function regionBounds(region: AtlasRegion): { x: number; y: number; w: number; h: number } {
  const members = atlasPlaces().filter((p) => p.region === region);
  const xs = members.map((p) => p.x), ys = members.map((p) => p.y);
  const pad = 70;
  const x = Math.max(0, Math.min(...xs) - pad), y = Math.max(0, Math.min(...ys) - pad);
  return { x, y, w: Math.min(ATLAS_SIZE.width, Math.max(...xs) + pad) - x, h: Math.min(ATLAS_SIZE.height, Math.max(...ys) + pad) - y };
}
