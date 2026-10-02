import type { Point } from "./types";
import { PAINTED_BOUNDS, nearestWorldGround, planWorldPath, worldPointBlocked, type WorldBounds, type WorldFootprint } from "./world-navigation";

/** Where the runtime walks for each marker kind (mirrors world-runtime moveToMarker). */
export function markerApproach(point: Point, kind: "npc" | "exit" | "service", bounds: WorldBounds = PAINTED_BOUNDS): Point {
  return kind === "npc" ? { x: point.x + (point.x > bounds.width - 60 ? -38 : 38), y: point.y + 4 }
    : { x: point.x, y: point.y + (kind === "service" ? 34 : 10) };
}

export interface ProbeMarker { id: string; kind: "npc" | "exit" | "service"; x: number; y: number }
export interface ProbeResult { id: string; kind: ProbeMarker["kind"]; ok: boolean; reason?: string; end?: Point }

/**
 * Collision safety net: from spawn, every marker must be walkable-to and the
 * walk must end within interaction reach (100 px, the runtime's E-key range)
 * of the marker, so no service, NPC or exit is sealed behind authored solids.
 */
export function probeWorldMap(spawn: Point, markers: readonly ProbeMarker[], footprints: readonly WorldFootprint[], bounds: WorldBounds = PAINTED_BOUNDS): {
  spawnOk: boolean; results: ProbeResult[];
} {
  const start = nearestWorldGround(spawn, footprints, bounds);
  const spawnOk = !worldPointBlocked(start, footprints) && Math.hypot(start.x - spawn.x, start.y - spawn.y) < 40;
  const results = markers.map((marker): ProbeResult => {
    const path = planWorldPath(start, markerApproach(marker, marker.kind, bounds), footprints, bounds);
    if (!path.length) return { id: marker.id, kind: marker.kind, ok: false, reason: "no path from spawn" };
    const end = path[path.length - 1];
    const reach = Math.hypot(end.x - marker.x, end.y - marker.y);
    if (reach > 100) return { id: marker.id, kind: marker.kind, ok: false, reason: `walk ends ${Math.round(reach)} px away`, end };
    return { id: marker.id, kind: marker.kind, ok: true, end };
  });
  return { spawnOk, results };
}
