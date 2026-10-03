import type { WorldFoe } from "@/lib/stage/types";
import { getOpponent } from "@/lib/world/data/opponents";
import { opponentLook } from "@/lib/world/battle-looks";
import { useWorldStore, type RoamingFoe } from "@/store/world-store";

/** The foes waiting on this map (a location or a road), as the world runtime draws them; walking into one engages it. */
export function roamingFoesOn(foes: readonly RoamingFoe[], sceneId: string): WorldFoe[] {
  return foes.filter((foe) => foe.locationId === sceneId).map((foe) => {
    const look = opponentLook(foe.opponentId);
    return { id: foe.id, x: foe.x, y: foe.y, name: getOpponent(foe.opponentId)?.name ?? foe.opponentId,
      look: look.kind === "creature" ? { kind: "creature", frame: look.frame, tint: look.tint, size: look.size }
        : { kind: "character", characterId: look.characterId, tint: look.tint, size: look.size },
      onEngage: () => useWorldStore.getState().engageFoe(foe.id) };
  });
}
