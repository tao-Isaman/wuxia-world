"use client";
import { useLoadingStore } from "@/store/loading-store";
import { heroHasPose, heroPoseStrip } from "@/lib/characters/hero-actions";
import { useEffect, useRef, useState } from "react";
import type { ArtisanDef, LocationMapDef, LocationScene, MapSpot, NpcDef } from "@/lib/world";
import { npcPresent, activeGuide, evaluateCondition, guideMarkerId, objectiveMarkerId, objectiveSpotsAt, objectiveSpotsForNpc, getArtisan, getQuestsForNpc, isQuestOfferable, isQuestTurnInForNpc, getNpcsAtLocation, getResource, getScene, getSectHallAt, getShopAt, npcBodySprite, npcPixelSprite, playerBodySprite } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { getActivity } from "@/lib/world/data/activities";
import { toast } from "@/store/toast-store";
import { WorldCanvas } from "@/components/game/world-canvas";
import { clearArrivalFrom, forgetMapPosition, peekArrivalFrom, type WorldMarker, type WorldPresentation } from "@/lib/stage/types";
import { capitalVignette } from "@/lib/stage/world-vignettes";
import { roamingFoesOn } from "./roaming-foes";
import { hasStation } from "@/lib/world/stations";
import { TOURNAMENT } from "@/lib/world/tournament";
import { arrivalSpawn, freeSpot } from "@/lib/stage/map-anchors";
import { useMapPlacements } from "./use-map-placements";
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
  onStation: () => void;
  onTournament: () => void;
}

export function LocationMap({ scene, map, handlers, readOnly = false, dialogueSpeakerId }: {
  scene: LocationScene; map: LocationMapDef; handlers: MapSpotHandlers; readOnly?: boolean; dialogueSpeakerId?: string;
}) {
  const state = useWorldStore();
  const workPose = useLoadingStore((s) => s.active ? s.pose : null);
  const lastInteractivePresentation = useRef<WorldPresentation | null>(null);
  // Objects placed by the engine's map editor (null while they load).
  const placements = useMapPlacements(scene.id);
  // Walked in from a road: start beside the exit that leads back there.
  const [arrivedFrom] = useState(() => peekArrivalFrom(scene.id));
  useEffect(() => () => { clearArrivalFrom(scene.id); }, [scene.id]);
  const markers: WorldMarker[] = [];
  const spots = map.npcSpots ?? {};
  const registry = getNpcsAtLocation(scene.id).filter((n) => spots[n.id] && npcPresent(state, n.id) && (!n.visibleIf || evaluateCondition(state, n.visibleIf)));
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
      image: npcBodySprite(npc.id), sprite: npcPixelSprite(npc.id), wander: npc.look?.wander, onActivate: () => handlers.onRegistryNpc(npc) });
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
  // A horse station (fast travel) in cities, villages and the big sects' grounds.
  if (hasStation(scene.id)) {
    const point = freeSpot(map.spawn, markers);
    markers.push({ id: "station", ...point, kind: "service", label: "สถานีพักม้า", badge: "station", category: "place",
      onActivate: handlers.onStation });
  }
  // The sword tournament's ring at the capital.
  if (scene.id === TOURNAMENT.locationId) {
    const point = freeSpot(map.spawn, markers);
    markers.push({ id: "tournament", ...point, kind: "service", label: "ชุมนุมวิจารณ์กระบี่", badge: "tournament", category: "activity",
      onActivate: handlers.onTournament });
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
        forgetMapPosition(routeId); // a road always starts at its near end
        current.gotoScene(routeId);
      } });
  }
  const guide = activeGuide(state);
  const guideId = guide ? guideMarkerId(state, guide) : null;
  const guidedMarkers = guideId ? markers.map((marker) => marker.id === guideId ? { ...marker, guide: true } : marker) : markers;
  const arrival = arrivalSpawn(map, arrivedFrom);
  // Foes that turned up here while the hero walked; walking into one engages it.
  const foes = roamingFoesOn(state.roamingFoes, scene.id);
  // While the hero works, they play the activity's painted loop on the map.
  const heroAction = workPose && heroHasPose(state.playerBodyId, workPose) ? heroPoseStrip(state.playerBodyId, workPose) : null;
  const presentation: WorldPresentation = { key: scene.id, name: scene.name, image: map.image, heroAction,
    time: state.time, spawn: arrival?.spawn ?? map.spawn, spawnFacing: arrival?.facing, playerImage: playerBodySprite(state.playerBodyId), markers: guidedMarkers, foes, placements,
    ...capitalVignette(scene.id, state.quests.qc_capital_clinic_supplies?.status === "done",
      state.flags.capital_ledger_recovered === true) };
  useEffect(() => {
    if (!readOnly || !lastInteractivePresentation.current) lastInteractivePresentation.current = presentation;
  });
  // Freeze markers and the hour to preserve dialogue framing. Pre-registered
  // quest props/bystanders can still switch visibility without a canvas rebuild.
  return <WorldCanvas presentation={readOnly
    ? { ...(lastInteractivePresentation.current ?? presentation), readOnly: true,
      placements: presentation.placements, props: presentation.props, bystanders: presentation.bystanders, foes: presentation.foes, worldDescription: presentation.worldDescription,
      dialogueSpeakerId: dialogueSpeakerId ? "npc-" + dialogueSpeakerId : undefined }
    : presentation} />;
}
