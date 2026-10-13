import type { WorldFoe } from "@/lib/stage/types";
import { getOpponent } from "@/lib/world/data/opponents";
import { BOSSES, bossesAt } from "@/lib/world/data/bosses";
import { bossIsUp, cloudRaid, useRaid } from "@/store/cloud-raid";
import { foeLook } from "@/lib/world/battle-looks";
import { npcPresent } from "@/lib/world/npc-presence";
import type { WorldStateData } from "@/lib/world";
import { useWorldStore, type RoamingFoe } from "@/store/world-store";

/** How a foe is drawn on the map: its animated sheet (bosses, T5), else its battle look. */
function mapLook(opponentId: string): WorldFoe["look"] {
  const opp = getOpponent(opponentId);
  if (opp?.look?.anim) return { kind: "anim", sheet: opp.look.anim, tint: opp.look.tint, size: opp.look.size };
  const world = useWorldStore.getState();
  const look = foeLook(opponentId, (id) => npcPresent(world, id));
  if (look.kind === "creature") return { kind: "creature", frame: look.frame, tint: look.tint, size: look.size };
  if (look.kind === "character") return { kind: "character", characterId: look.characterId, tint: look.tint, size: look.size };
  return { kind: "anim", sheet: look.sheet, tint: look.tint, size: look.size };
}

/** The foes waiting on this map (a location or a road), as the world runtime draws them; walking into one engages it. */
export function roamingFoesOn(foes: readonly RoamingFoe[], sceneId: string): WorldFoe[] {
  return foes.filter((foe) => foe.locationId === sceneId).map((foe) => ({
    id: foe.id, x: foe.x, y: foe.y, name: getOpponent(foe.opponentId)?.name ?? foe.opponentId,
    look: mapLook(foe.opponentId),
    onEngage: () => useWorldStore.getState().engageFoe(foe.id),
  }));
}

/**
 * The legendary beasts waiting in this lair (data/bosses.ts): drawn large at
 * their spot, never wandering; walking into one opens the encounter screen
 * and the battle brings its minions.
 */
export function bossFoesAt(state: Pick<WorldStateData, "bossDefeatedDay" | "day">, sceneId: string): WorldFoe[] {
  // Online the beasts are the world's (store/cloud-raid.ts): drawn while the server says they wait.
  const online = cloudRaid.enabled();
  const statuses = useRaid.getState().bosses;
  const here = online ? BOSSES.filter((b) => b.lair === sceneId && bossIsUp(statuses[b.id])) : bossesAt(state, sceneId);
  return here.map((boss) => ({
    id: `boss:${boss.id}`, x: boss.spot.x, y: boss.spot.y, boss: true,
    name: online && statuses[boss.id]?.fighting ? `${boss.name} (กำลังสู้กับคณะของ${statuses[boss.id]!.fighting})` : boss.name,
    look: mapLook(boss.id),
    onEngage: () => useWorldStore.getState().engageBoss(boss.id),
  }));
}
