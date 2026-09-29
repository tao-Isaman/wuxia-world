"use client";
import type { RouteMapDef, RouteScene } from "@/lib/world";
import { evaluateCondition, playerBodySprite } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { WorldCanvas } from "@/components/game/world-canvas";
import type { WorldMarker } from "@/lib/three/types";
import { toast } from "@/store/toast-store";
import { MapHud } from "./map-hud";
import { MenuBar } from "./menu-bar";
import { JourneyGuide } from "./journey-guide";

export function RouteMapView({ scene, map }: { scene: RouteScene; map: RouteMapDef }) {
  const state = useWorldStore();
  const visible = scene.destinations.filter((d) => !d.visibleIf || evaluateCondition(state, d.visibleIf));
  const tired = state.stamina < TRAVEL_STAMINA_COST;
  const markers: WorldMarker[] = visible.map((destination, index) => ({
    id: "destination-" + index, label: destination.label, kind: "exit",
    ...(map.destSlots[index] ?? { x: 15 + index * 12 % 70, y: 24 }), disabled: tired,
    onActivate: () => {
      const current = useWorldStore.getState();
      if (!current.canTravelTo(destination.locationId)) { toast("warn", "พลังไม่พอสำหรับการเดินทาง"); return; }
      current.travelRoute(destination.locationId);
    },
  }));
  const back = scene.back ?? state.lastLocationId;
  if (back && back !== scene.id) markers.push({ id: "back", ...map.back, kind: "exit", label: "ย้อนกลับ", disabled: tired,
    onActivate: () => {
      const current = useWorldStore.getState();
      if (!current.canTravelTo(back)) { toast("warn", "พลังไม่พอสำหรับการเดินทาง"); return; }
      current.gotoScene(back);
    } });
  return <div className="fixed inset-0 z-40 !mt-0 bg-[#172723]">
    <WorldCanvas presentation={{ key: scene.id, name: scene.label, image: map.image,
      time: state.time, playerImage: playerBodySprite(state.playerBodyId), spawn: map.spawn, markers }} />
    <MapHud /><JourneyGuide /><MenuBar hud />
  </div>;
}
