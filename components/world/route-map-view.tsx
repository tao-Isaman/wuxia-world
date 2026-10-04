"use client";
import type { RouteMapDef, RouteScene } from "@/lib/world";
import { activeGuide, evaluateCondition, guideMarkerId, playerBodySprite, routeBackTarget } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { WorldCanvas } from "@/components/game/world-canvas";
import { setArrivalFrom, type WorldMarker } from "@/lib/stage/types";
import { toast } from "@/store/toast-store";
import { MapHud } from "./map-hud";
import { MenuBar } from "./menu-bar";
import { roamingFoesOn } from "./roaming-foes";

const facingOf = (dir: RouteMapDef["direction"]) =>
  dir.includes("E") ? "east" as const : dir.includes("W") ? "west" as const : dir === "N" ? "north" as const : "south" as const;

export function RouteMapView({ scene, map }: { scene: RouteScene; map: RouteMapDef }) {
  const state = useWorldStore();
  const visible = scene.destinations.filter((d) => !d.visibleIf || evaluateCondition(state, d.visibleIf));
  const tired = state.stamina < TRAVEL_STAMINA_COST;
  // route_<source>__to__<destination>: the place this road starts from.
  const source = scene.id.startsWith("route_") ? scene.id.slice("route_".length).split("__to__")[0] : null;
  const markers: WorldMarker[] = visible.map((destination, index) => ({
    id: "destination-" + index, label: destination.label, kind: "exit",
    ...(map.destSlots[index] ?? { x: 15 + index * 12 % 70, y: 24 }), disabled: tired,
    onActivate: () => {
      const current = useWorldStore.getState();
      if (!current.canTravelTo(destination.locationId)) { toast("warn", "พลังไม่พอสำหรับการเดินทาง"); return; }
      if (source) setArrivalFrom(destination.locationId, source);
      current.travelRoute(destination.locationId);
    },
  }));
  const back = routeBackTarget(state, scene);
  if (back) markers.push({ id: "back", ...map.back, kind: "exit", label: "ย้อนกลับ", disabled: tired,
    onActivate: () => {
      const current = useWorldStore.getState();
      if (!current.canTravelTo(back)) { toast("warn", "พลังไม่พอสำหรับการเดินทาง"); return; }
      const ahead = visible[0]?.locationId;
      if (ahead) setArrivalFrom(back, ahead);
      current.gotoScene(back);
    } });
  const guide = activeGuide(state);
  const guideId = guide ? guideMarkerId(state, guide) : null;
  for (const marker of markers) if (marker.id === guideId) marker.guide = true;
  return <div className="fixed inset-0 z-40 !mt-0 bg-[#172723]" data-route-direction={map.direction}>
    <WorldCanvas presentation={{ key: scene.id, name: scene.label, image: map.image, imageGrade: map.grade, mirrorImage: map.mirror,
      time: state.time, playerImage: playerBodySprite(state.playerBodyId), spawn: map.spawn, spawnFacing: facingOf(map.direction), markers,
      foes: roamingFoesOn(state.roamingFoes, scene.id) }} />
    <MapHud /><MenuBar hud />
  </div>;
}
