import type { NpcDef, QuestDef, WorldStateData } from "./types";
import { NPCS, getNpc } from "./data/npcs";
import { getQuest } from "./data/quests";
import { getScene } from "./data/scenes";
import { evaluateCondition } from "./conditions";

/**
 * Quest guidance: who the player should go and see for a quest's current
 * stage, where that person is, and which way to walk. Stages name the
 * person in their description ("พบนายอำเภอหวู่ในนครหลวง…"); the earliest
 * named NPC is the target. A final "report back" stage falls back to the
 * quest's turn-in / giver NPC.
 */
export interface QuestGuide {
  questId: string;
  questName: string;
  npcId: string;
  npcName: string;
  locationId: string;
  locationName: string;
  /** Locations from here to the target, both ends included (length 1 = already there). */
  path: string[];
}

// Longest names first so "หมอหลิน" wins over a shorter name inside it.
const NAMED_NPCS = [...NPCS].filter((npc) => npc.name.length >= 2 && npc.locationIds.length > 0)
  .sort((a, b) => b.name.length - a.name.length);

/** The person the current stage of `quest` sends the player to, if any. */
export function stageTargetNpc(state: WorldStateData, quest: QuestDef): NpcDef | null {
  const progress = state.quests[quest.id];
  if (!progress || progress.status !== "active") return null;
  const stage = quest.stages[progress.stage];
  if (!stage) return null;
  let best: { npc: NpcDef; at: number } | null = null;
  const taken: [number, number][] = [];
  for (const npc of NAMED_NPCS) {
    const at = stage.description.indexOf(npc.name);
    if (at < 0 || taken.some(([start, end]) => at >= start && at < end)) continue;
    taken.push([at, at + npc.name.length]);
    if (!best || at < best.at) best = { npc, at };
  }
  if (best) return best.npc;
  if (progress.stage === quest.stages.length - 1) return getNpc(quest.turnInNpcId ?? quest.giverNpcId) ?? null;
  return null;
}

/** Location adjacency through route scenes: A → route_A__to__B → B. */
function neighbours(locationId: string): string[] {
  const scene = getScene(locationId);
  if (scene?.kind !== "location") return [];
  const out: string[] = [];
  for (const ref of scene.routes) {
    const route = getScene(ref.routeSceneId);
    if (route?.kind !== "route") continue;
    for (const destination of route.destinations) if (destination.locationId !== locationId) out.push(destination.locationId);
  }
  return out;
}

/** Shortest walk between two locations (breadth-first), or null if unreachable. */
export function pathBetween(from: string, to: string): string[] | null {
  if (from === to) return [from];
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    for (const next of neighbours(here)) {
      if (previous.has(next)) continue;
      previous.set(next, here);
      if (next === to) {
        const path = [to];
        while (path[0] !== from) path.unshift(previous.get(path[0])!);
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

/** Where the player stands for routing: a location, or the route's origin. */
function currentLocation(state: WorldStateData): string | null {
  const scene = getScene(state.currentSceneId);
  if (scene?.kind === "location") return scene.id;
  return state.lastLocationId;
}

/** Guide for one quest (the nearest of the target's locations). */
export function guideForQuest(state: WorldStateData, questId: string): QuestGuide | null {
  const quest = getQuest(questId);
  if (!quest) return null;
  const npc = stageTargetNpc(state, quest);
  if (!npc) return null;
  const here = currentLocation(state);
  let best: string[] | null = null;
  for (const locationId of npc.locationIds) {
    const path = here ? pathBetween(here, locationId) : null;
    if (path && (!best || path.length < best.length)) best = path;
  }
  const locationId = best?.[best.length - 1] ?? npc.locationIds[0];
  const location = getScene(locationId);
  return {
    questId: quest.id, questName: quest.name, npcId: npc.id, npcName: npc.name,
    locationId, locationName: location?.kind === "location" ? location.name : locationId,
    path: best ?? [],
  };
}

/** The quest being guided: the tracked one if set and still guidable, else the newest active quest with a target. */
export function activeGuide(state: WorldStateData): QuestGuide | null {
  const tracked = typeof state.flags.trackedQuestId === "string" ? state.flags.trackedQuestId : null;
  if (tracked && state.quests[tracked]?.status === "active") {
    const guide = guideForQuest(state, tracked);
    if (guide) return guide;
  }
  const active = Object.values(state.quests).filter((quest) => quest.status === "active").reverse();
  for (const quest of active) {
    const guide = guideForQuest(state, quest.id);
    if (guide) return guide;
  }
  return null;
}

/**
 * Which marker on the current map the guide arrow should sit on:
 *   at the target's location → the NPC ("npc-<id>")
 *   elsewhere on a location map → the exit toward the next stop
 *   on a route map → the destination closest to the target
 */
export function guideMarkerId(state: WorldStateData, guide: QuestGuide): string | null {
  const scene = getScene(state.currentSceneId);
  if (scene?.kind === "location") {
    if (scene.id === guide.locationId) return "npc-" + guide.npcId;
    const next = guide.path[1];
    return next ? "route_" + scene.id + "__to__" + next : null;
  }
  if (scene?.kind === "route") {
    // Same filter + indexing as RouteMapView's destination markers.
    const visible = scene.destinations.filter((d) => !d.visibleIf || evaluateCondition(state, d.visibleIf));
    let bestIndex = -1, bestLength = Infinity;
    visible.forEach((destination, index) => {
      const path = pathBetween(destination.locationId, guide.locationId);
      if (path && path.length < bestLength) { bestIndex = index; bestLength = path.length; }
    });
    return bestIndex >= 0 ? "destination-" + bestIndex : null;
  }
  return null;
}
