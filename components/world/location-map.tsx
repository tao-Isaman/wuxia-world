"use client";
import { useEffect, useRef } from "react";
import type { ArtisanDef, LocationMapDef, LocationScene, MapSpot, NpcDef } from "@/lib/world";
import { activeGuide, evaluateCondition, guideMarkerId, objectiveMarkerId, objectiveSpotsAt, objectiveSpotsForNpc, getArtisan, getQuestsForNpc, isQuestOfferable, isQuestTurnInForNpc, getNpcsAtLocation, getResource, getScene, getSectHallAt, getShopAt, npcBodySprite, npcPixelSprite, playerBodySprite } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { getActivity } from "@/lib/world/data/activities";
import { toast } from "@/store/toast-store";
import { WorldCanvas } from "@/components/game/world-canvas";
import { forgetMapPosition, type WorldMarker, type WorldPresentation } from "@/lib/stage/types";
import { capitalVignette } from "@/lib/stage/world-vignettes";
export { clearMapPositions } from "@/lib/stage/types";

export interface MapSpotHandlers {
  onRegistryNpc: (npc: NpcDef) => void;
  onShop: () => void;
  onSectHall: () => void;
  onArtisan: (artisan: ArtisanDef) => void;
  onRest: () => void;
  onRumor: () => void;
  onPractice: () => void;
  onResource: (resourceId: string) => void;
  onActivity: (activityId: string) => void;
  onObjective: (questId: string, spotIndex: number) => void;
}

/** A free spot for a quest objective marker: near the arrival point, clear of other markers. */
function freeSpot(spawn: { x: number; y: number }, taken: readonly { x: number; y: number }[]) {
  const offsets = [[9, -5], [-9, -5], [10, 7], [-10, 7], [0, -11], [15, 0], [-15, 0], [0, 12], [18, -10], [-18, -10]];
  for (const [dx, dy] of offsets) {
    const point = { x: Math.min(92, Math.max(8, spawn.x + dx)), y: Math.min(90, Math.max(10, spawn.y + dy)) };
    if (taken.every((other) => Math.hypot(other.x - point.x, other.y - point.y) >= 7)) return point;
  }
  return { x: spawn.x + 6, y: spawn.y - 4 };
}
export function LocationMap({ scene, map, handlers, readOnly = false, dialogueSpeakerId }: {
  scene: LocationScene; map: LocationMapDef; handlers: MapSpotHandlers; readOnly?: boolean; dialogueSpeakerId?: string;
}) {
  const state = useWorldStore();
  const lastInteractivePresentation = useRef<WorldPresentation | null>(null);
  const markers: WorldMarker[] = [];
  const spots = map.npcSpots ?? {};
  const registry = getNpcsAtLocation(scene.id).filter((n) => spots[n.id] && (!n.visibleIf || evaluateCondition(state, n.visibleIf)));
  const registryIds = new Set(registry.map((n) => n.id));
  for (const npc of scene.npcs) {
    if (!spots[npc.id] || registryIds.has(npc.id) || (npc.visibleIf && !evaluateCondition(state, npc.visibleIf))) continue;
    markers.push({ id: "npc-" + npc.id, ...spots[npc.id], kind: "npc", label: npc.name,
      image: npcBodySprite(npc.id), sprite: npcPixelSprite(npc.id), onActivate: () => {
        if (getScene(npc.dialogSceneId)?.kind === "dialog") useWorldStore.getState().gotoScene(npc.dialogSceneId);
      } });
  }
  for (const npc of registry) {
    // Same filters as the NPC popup: a turn-in outranks a fresh offer.
    const quests = getQuestsForNpc(npc.id);
    const quest = quests.some((q) => isQuestTurnInForNpc(state, q, npc.id)) || objectiveSpotsForNpc(state, npc.id).length ? "turnin" as const
      : quests.some((q) => isQuestOfferable(state, q)) ? "offer" as const : undefined;
    markers.push({ id: "npc-" + npc.id, ...spots[npc.id], kind: "npc", label: npc.name, quest,
      image: npcBodySprite(npc.id), sprite: npcPixelSprite(npc.id), onActivate: () => handlers.onRegistryNpc(npc) });
  }
  type Service = { label: string; badge: string; category: "place" | "activity"; action: () => void };
  function service(spot: MapSpot): Service | null {
    switch (spot.kind) {
      case "shop": {
        const shop = getShopAt(scene.id);
        return shop ? { label: spot.label ?? shop.label, badge: "shop", category: "place", action: handlers.onShop } : null;
      }
      case "sectHall": {
        const hall = getSectHallAt(scene.id);
        return hall ? { label: spot.label ?? hall.label, badge: "sect", category: "place", action: handlers.onSectHall } : null;
      }
      case "artisan": {
        const artisan = getArtisan(spot.artisanId);
        return artisan?.locationId === scene.id ? { label: spot.label ?? artisan.label, badge: artisan.profession,
          category: "place", action: () => handlers.onArtisan(artisan) } : null;
      }
      case "rest": return { label: spot.label ?? "พักผ่อน", badge: "rest", category: "place", action: handlers.onRest };
      case "rumor": return { label: spot.label ?? "ฟังข่าวลือ", badge: "rumor", category: "place", action: handlers.onRumor };
      case "practice": return { label: spot.label ?? "ฝึกฝน", badge: "practice", category: "activity", action: handlers.onPractice };
      case "resource": {
        // Gated nodes (begging before it's learned) stay hidden on the map too.
        const node = scene.resources?.find((r) => r.resourceId === spot.resourceId);
        if (node?.visibleIf && !evaluateCondition(state, node.visibleIf)) return null;
        const resource = getResource(spot.resourceId);
        return resource ? { label: spot.label ?? resource.name, badge: resource.skill, category: "activity",
          action: () => handlers.onResource(spot.resourceId) } : null;
      }
      case "activity": {
        const activity = getActivity(spot.activityId);
        return activity ? { label: spot.label ?? activity.label, badge: activity.badge, category: "activity",
          action: () => handlers.onActivity(activity.id) } : null;
      }
    }
  }
  (map.spots ?? []).forEach((spot, index) => {
    const entry = service(spot);
    if (entry) markers.push({ id: "service-" + index, x: spot.x, y: spot.y, kind: "service", label: entry.label,
      badge: entry.badge, glyph: spot.icon, category: entry.category, onActivate: entry.action });
  });
  // Hands-on quest objectives here ("observe the city gate") — magnifier spots.
  for (const entry of objectiveSpotsAt(state, scene.id)) {
    const point = freeSpot(map.spawn, markers);
    markers.push({ id: objectiveMarkerId(entry.questId, entry.spotIndex), ...point, kind: "service", label: entry.spot.label,
      badge: "investigate", glyph: "🔍", category: "activity", quest: "turnin",
      onActivate: () => handlers.onObjective(entry.questId, entry.spotIndex) });
  }
  for (const exit of map.exits ?? []) {
    const routeId = "route_" + scene.id + "__to__" + exit.to;
    const route = scene.routes.find((r) => r.routeSceneId === routeId && (!r.visibleIf || evaluateCondition(state, r.visibleIf)));
    if (!route || getScene(routeId)?.kind !== "route") continue;
    const destination = getScene(exit.to);
    const duplicateLabel = scene.routes.some((other) => other !== route && other.label === route.label &&
      (!other.visibleIf || evaluateCondition(state, other.visibleIf)));
    const label = duplicateLabel && destination?.kind === "location" ? `${route.label} · ${destination.name}` : route.label;
    markers.push({ id: routeId, x: exit.x, y: exit.y, label, kind: "exit",
      disabled: state.stamina < TRAVEL_STAMINA_COST, onActivate: () => {
        const current = useWorldStore.getState();
        if (!current.canTravelTo(routeId)) { toast("warn", "พลังไม่พอสำหรับการเดินทาง"); return; }
        forgetMapPosition(scene.id);
        current.gotoScene(routeId);
      } });
  }
  const guide = activeGuide(state);
  const guideId = guide ? guideMarkerId(state, guide) : null;
  const guidedMarkers = guideId ? markers.map((marker) => marker.id === guideId ? { ...marker, guide: true } : marker) : markers;
  const presentation: WorldPresentation = { key: scene.id, name: scene.name, image: map.image,
    time: state.time, spawn: map.spawn, playerImage: playerBodySprite(state.playerBodyId), markers: guidedMarkers,
    ...capitalVignette(scene.id, state.quests.qc_capital_clinic_supplies?.status === "done",
      state.flags.capital_ledger_recovered === true) };
  useEffect(() => {
    if (!readOnly || !lastInteractivePresentation.current) lastInteractivePresentation.current = presentation;
  });
  // Freeze markers and the hour to preserve dialogue framing. Pre-registered
  // quest props/bystanders can still switch visibility without a canvas rebuild.
  return <WorldCanvas presentation={readOnly
    ? { ...(lastInteractivePresentation.current ?? presentation), readOnly: true,
      props: presentation.props, bystanders: presentation.bystanders, worldDescription: presentation.worldDescription,
      dialogueSpeakerId: dialogueSpeakerId ? "npc-" + dialogueSpeakerId : undefined }
    : presentation} />;
}
