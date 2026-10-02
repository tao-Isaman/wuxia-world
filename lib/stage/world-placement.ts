import type { Point, WorldPresentation } from "./types";
import { nearestWorldGround, planWorldPath, worldPointBlocked, type WorldFootprint } from "./world-navigation";

interface WorldPlacement {
  position: Point;
  facing: "east" | "west" | "north" | "south";
  speakerMarkerId?: string;
}

/** Map size in world units: composed maps carry their own, paintings are 960 × 640. */
export const presentationSize = (presentation: Pick<WorldPresentation, "composed">) =>
  presentation.composed ? { width: presentation.composed.width, height: presentation.composed.height } : { width: 960, height: 640 };

/** Rebuild presentation after a reload; never writes a save or a session position. */
export function initialWorldPlacement(
  presentation: WorldPresentation,
  rememberedPosition: Point | undefined,
  footprints: readonly WorldFootprint[],
): WorldPlacement {
  const remembered = presentation.rememberPosition === false ? undefined : rememberedPosition;
  const bounds = presentationSize(presentation);
  const toWorld = (point: Point): Point => ({ x: point.x * bounds.width / 100, y: point.y * bounds.height / 100 });
  const position = nearestWorldGround(toWorld(remembered ?? presentation.spawn), footprints, bounds);
  const fallback: WorldPlacement = { position, facing: remembered ? "east" : presentation.spawnFacing ?? "east" };
  // Mounted conversations do not call this again. A recreated live canvas must
  // also keep its remembered position, even while dialogue is open.
  if (!presentation.readOnly || remembered || !presentation.dialogueSpeakerId) return fallback;
  const speaker = presentation.markers.find((marker) => marker.id === presentation.dialogueSpeakerId &&
    marker.kind === "npc" && !marker.disabled);
  if (!speaker) return fallback;
  const target = toWorld(speaker);
  const side = target.x > bounds.width - 60 ? -38 : 38;
  // Match the normal lateral approach first, then try the other side or nearby
  // ground. Pathfinding rejects disconnected pockets behind authored walls.
  for (const offset of [{ x: side, y: 4 }, { x: -side, y: 4 }, { x: 0, y: 38 }, { x: 0, y: -38 }]) {
    const candidate = nearestWorldGround({ x: target.x + offset.x, y: target.y + offset.y }, footprints, bounds);
    const distance = Math.hypot(candidate.x - target.x, candidate.y - target.y);
    if (distance < 28 || distance > 64 || worldPointBlocked(candidate, footprints) ||
      !planWorldPath(position, candidate, footprints, bounds).length) continue;
    const dx = target.x - candidate.x;
    const dy = target.y - candidate.y;
    return { position: candidate, speakerMarkerId: speaker.id,
      facing: Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? "north" : "south") : (dx < 0 ? "west" : "east") };
  }
  return fallback;
}
