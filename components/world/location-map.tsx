"use client";
import { useEffect, useRef } from "react";
import type { ArtisanDef, LocationMapDef, LocationScene, MapSpot, NpcDef } from "@/lib/world";
import { evaluateCondition, getArtisan, getNpcsAtLocation, getResource, getScene, getSectHallAt, getShopAt, npcBodySprite, playerBodySprite } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { WorldCanvas } from "@/components/game/world-canvas";
import { forgetMapPosition, type WorldMarker, type WorldPresentation } from "@/lib/three/types";
import { capitalVignette } from "@/lib/three/world-vignettes";
export { clearMapPositions } from "@/lib/three/types";

export interface MapSpotHandlers {
  onRegistryNpc: (npc: NpcDef) => void;
  onShop: () => void;
  onSectHall: () => void;
  onArtisan: (artisan: ArtisanDef) => void;
  onRest: () => void;
  onRumor: () => void;
  onPractice: () => void;
  onResource: (resourceId: string) => void;
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
      image: npcBodySprite(npc.id), onActivate: () => {
        if (getScene(npc.dialogSceneId)?.kind === "dialog") useWorldStore.getState().gotoScene(npc.dialogSceneId);
      } });
  }
  for (const npc of registry) {
    markers.push({ id: "npc-" + npc.id, ...spots[npc.id], kind: "npc", label: npc.name,
      image: npcBodySprite(npc.id), onActivate: () => handlers.onRegistryNpc(npc) });
  }
  function service(spot: MapSpot): { label: string; icon: string; action: () => void } | null {
    switch (spot.kind) {
      case "shop": {
        const shop = getShopAt(scene.id);
        return shop ? { label: spot.label ?? shop.label, icon: "bag", action: handlers.onShop } : null;
      }
      case "sectHall": {
        const hall = getSectHallAt(scene.id);
        return hall ? { label: spot.label ?? hall.label, icon: "sect", action: handlers.onSectHall } : null;
      }
      case "artisan": {
        const artisan = getArtisan(spot.artisanId);
        return artisan?.locationId === scene.id ? { label: spot.label ?? artisan.label, icon: "craft", action: () => handlers.onArtisan(artisan) } : null;
      }
      case "rest": return { label: spot.label ?? "พักผ่อน", icon: "rest", action: handlers.onRest };
      case "rumor": return { label: spot.label ?? "ฟังข่าวลือ", icon: "log", action: handlers.onRumor };
      case "practice": return { label: spot.label ?? "ฝึกฝน", icon: "skills", action: handlers.onPractice };
      case "resource": {
        const resource = getResource(spot.resourceId);
        return resource ? { label: spot.label ?? resource.name, icon: "craft", action: () => handlers.onResource(spot.resourceId) } : null;
      }
    }
  }
  (map.spots ?? []).forEach((spot, index) => {
    const entry = service(spot);
    if (entry) markers.push({ id: "service-" + index, x: spot.x, y: spot.y, kind: "service",
      label: entry.label, icon: "/icons/ui/" + entry.icon + ".png", onActivate: entry.action });
  });
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
  const presentation: WorldPresentation = { key: scene.id, name: scene.name, image: map.image,
    time: state.time, spawn: map.spawn, playerImage: playerBodySprite(state.playerBodyId), markers,
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
