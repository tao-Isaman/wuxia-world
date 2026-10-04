/**
 * The fixed points of a location map that placed objects must never seal off:
 * the spawn, the arrival spot beside each exit, every NPC spot, exit and
 * service spot. Pure — the map editor's warnings, `test:placements` and the
 * game's arrival spawn (components/world/location-map.tsx) use it.
 */
import type { LocationMapDef } from "../world/data/location-maps";
import { hasStation } from "../world/stations";
import { TOURNAMENT } from "../world/tournament";
import type { MapRect, PlacementGeometry } from "../assets/placement-geometry";
import type { Point } from "./types";
import { markerApproach, probeWorldMap, type ProbeMarker } from "./world-map-probe";
import { withPlacedSolids, worldFootprints, worldPointBlocked } from "./world-navigation";

export type MapAnchorKind = "spawn" | "arrival" | "npc" | "exit" | "service";
export interface MapAnchor extends Point {
  /** `spawn`, `arrival:<from>`, `npc:<npcId>`, `exit:<to>`, `service:<index>`, `service:station`, `service:tournament`. */
  id: string;
  kind: MapAnchorKind;
  /** NPC id, destination id or spot kind / label — the editor turns it into a Thai name. */
  ref: string;
}

/** Map percentages → map units. */
const units = (p: Point): Point => ({ x: p.x * 9.6, y: p.y * 6.4 });

/**
 * Where the hero arrives from `from`: 70 map units in from the exit back
 * there, toward the middle, facing into the map (percentages); null without one.
 */
export function arrivalSpawn(map: LocationMapDef, from: string | undefined) {
  const exit = from ? map.exits?.find((e) => e.to === from) : undefined;
  if (!exit) return null;
  const centre = { x: 50, y: 56 };
  const dx = (centre.x - exit.x) * 9.6, dy = (centre.y - exit.y) * 6.4, length = Math.hypot(dx, dy) || 1;
  const spawn = { x: exit.x + dx / length * 70 / 9.6, y: exit.y + dy / length * 70 / 6.4 };
  const facing: "east" | "west" | "north" | "south" = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : "north");
  return { spawn, facing };
}

/**
 * A free spot for a marker the map doesn't place itself (a quest objective,
 * the horse station, the tournament ring): near the arrival point, clear of
 * the other markers (percentages).
 */
export function freeSpot(spawn: Point, taken: readonly Point[]): Point {
  const offsets = [[9, -5], [-9, -5], [10, 7], [-10, 7], [0, -11], [15, 0], [-15, 0], [0, 12], [18, -10], [-18, -10]];
  for (const [dx, dy] of offsets) {
    const point = { x: Math.min(92, Math.max(8, spawn.x + dx)), y: Math.min(90, Math.max(10, spawn.y + dy)) };
    if (taken.every((other) => Math.hypot(other.x - point.x, other.y - point.y) >= 7)) return point;
  }
  return { x: spawn.x + 6, y: spawn.y - 4 };
}

/**
 * Every fixed point of a map, in map units. With the location id, the horse
 * station and the tournament ring are included where the game would put them
 * with every NPC present and no quest objective spot (those shift them).
 */
export function mapAnchors(map: LocationMapDef, locationId?: string): MapAnchor[] {
  const anchors: MapAnchor[] = [{ id: "spawn", kind: "spawn", ref: "spawn", ...units(map.spawn) }];
  for (const exit of map.exits ?? []) {
    anchors.push({ id: `exit:${exit.to}`, kind: "exit", ref: exit.to, ...units(exit) });
    const arrival = arrivalSpawn(map, exit.to);
    if (arrival) anchors.push({ id: `arrival:${exit.to}`, kind: "arrival", ref: exit.to, ...units(arrival.spawn) });
  }
  for (const [npc, point] of Object.entries(map.npcSpots ?? {})) anchors.push({ id: `npc:${npc}`, kind: "npc", ref: npc, ...units(point) });
  (map.spots ?? []).forEach((spot, index) => anchors.push({ id: `service:${index}`, kind: "service",
    ref: spot.label ?? spot.kind, ...units(spot) }));
  const taken: Point[] = [...Object.values(map.npcSpots ?? {}), ...(map.spots ?? [])];
  for (const [ref, here] of [["station", hasStation(locationId)], ["tournament", locationId === TOURNAMENT.locationId]] as const) {
    if (!here) continue;
    const point = freeSpot(map.spawn, taken);
    taken.push(point);
    anchors.push({ id: `service:${ref}`, kind: "service", ref, ...units(point) });
  }
  return anchors;
}

export interface PlacementIssue {
  /** The anchor that is covered or cut off. */
  anchor: MapAnchor;
  /** The placement whose footprint covers it; null when the anchor is only cut off. */
  placementId: string | null;
  reason: "covered" | "unreachable";
}

const baseProbes = new Map<string, ReturnType<typeof probeWorldMap>>();
const insideRect = (point: Point, rect: MapRect) => worldPointBlocked(point, [{ kind: "rect", ...rect }]);

/**
 * What the blocking placements break on a map:
 * - "covered": a footprint lies on an anchor (or on the spot the hero walks to
 *   for it);
 * - "unreachable": a marker the hero could walk to from the spawn before the
 *   placements can't any more (or the spawn itself is boxed in).
 */
export function placementIssues(key: string, map: LocationMapDef, geometry: readonly PlacementGeometry[],
  options: { reachability?: boolean } = {}): PlacementIssue[] {
  const solids = geometry.filter((g) => g.blocks && g.footprint);
  if (!solids.length) return [];
  const issues: PlacementIssue[] = [];
  const anchors = mapAnchors(map, key);
  for (const anchor of anchors) {
    const points = anchor.kind === "spawn" || anchor.kind === "arrival" ? [anchor] : [anchor, markerApproach(anchor, anchor.kind)];
    const cover = solids.find((g) => points.some((point) => insideRect(point, g.footprint!)));
    if (cover) issues.push({ anchor, placementId: cover.id, reason: "covered" });
  }
  if (options.reachability === false) return issues;
  const base = worldFootprints(key, map.image);
  const placed = withPlacedSolids(base, solids.map((g) => g.footprint!));
  const covered = new Set(issues.map((issue) => issue.anchor.id));
  const probeMarkers: ProbeMarker[] = anchors.filter((a) => a.kind !== "spawn" && a.kind !== "arrival")
    .map((a) => ({ id: a.id, kind: a.kind as ProbeMarker["kind"], x: a.x, y: a.y }));
  // The map on its own never changes: probe it once per map.
  const baseKey = `${key}\n${map.image}\n${JSON.stringify(probeMarkers)}`;
  let before = baseProbes.get(baseKey);
  if (!before) baseProbes.set(baseKey, before = probeWorldMap(anchors[0], probeMarkers, base));
  const after = probeWorldMap(anchors[0], probeMarkers, placed);
  if (before.spawnOk && !after.spawnOk && !covered.has("spawn")) issues.push({ anchor: anchors[0], placementId: null, reason: "unreachable" });
  for (const result of after.results) {
    if (result.ok || covered.has(result.id) || !before.results.find((r) => r.id === result.id)?.ok) continue;
    issues.push({ anchor: anchors.find((a) => a.id === result.id)!, placementId: null, reason: "unreachable" });
  }
  return issues;
}

