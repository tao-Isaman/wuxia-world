"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LocationMapDef, LocationScene, NpcDef, NpcRef } from "@/lib/world";
import { evaluateCondition, getNpcsAtLocation, getScene } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  scene: LocationScene;
  map: LocationMapDef;
  /** registry-NPC marker clicked → parent opens NpcInteractionPopup */
  onRegistryNpc: (npc: NpcDef) => void;
}

// AI-painted location map with a click-to-move player token. Markers
// (NPCs / exits) are %-positioned over the painting; clicking one walks
// the token there first, then fires the action — same behaviors as the
// old button lists, just spatial. Mount with key={scene.id} so the
// token resets to spawn when the location changes.
export function LocationMap({ scene, map, onRegistryNpc }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const stamina = useWorldStore((s) => s.stamina);

  const [pos, setPos] = useState(map.spawn);
  const [walkMs, setWalkMs] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Walk the token to (x, y), then fire `after`. A new click cancels the
  // pending action of the previous walk (the token changes course).
  function walkTo(x: number, y: number, after?: () => void) {
    const dist = Math.hypot(x - pos.x, y - pos.y);
    const ms = Math.max(250, Math.round(dist * 28)); // ~28ms per % unit
    if (timer.current) clearTimeout(timer.current);
    setWalkMs(ms);
    setPos({ x, y });
    timer.current = window.setTimeout(() => {
      after?.();
    }, ms + 80);
  }

  function handleGroundClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    walkTo(clamp(x, 2, 98), clamp(y, 6, 96));
  }

  // NPC markers: scene NPCs + registry NPCs that have an authored spot.
  const spots = map.npcSpots ?? {};
  const sceneNpcs = scene.npcs.filter(
    (n) => spots[n.id] && (!n.visibleIf || evaluateCondition(state, n.visibleIf)),
  );
  const registryNpcs = getNpcsAtLocation(scene.id).filter(
    (n) => spots[n.id] && (!n.visibleIf || evaluateCondition(state, n.visibleIf)),
  );

  // Exit markers bind to the generated route scene for their destination;
  // unmatched or hidden routes simply don't render (they stay in the
  // fallback เส้นทาง card instead).
  const visibleRoutes = scene.routes.filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );
  const exits = (map.exits ?? []).flatMap((exit) => {
    const routeSceneId = `route_${scene.id}__to__${exit.to}`;
    const route = visibleRoutes.find((r) => r.routeSceneId === routeSceneId);
    if (!route || getScene(routeSceneId)?.kind !== "route") return [];
    return [{ exit, route }];
  });

  function handleSceneNpc(npc: NpcRef, spot: { x: number; y: number }) {
    if (getScene(npc.dialogSceneId)?.kind !== "dialog") return;
    walkTo(spot.x, spot.y + 4, () => gotoScene(npc.dialogSceneId));
  }

  function handleRegistryNpc(npc: NpcDef, spot: { x: number; y: number }) {
    walkTo(spot.x, spot.y + 4, () => onRegistryNpc(npc));
  }

  function handleExit(exit: { x: number; y: number }, routeSceneId: string) {
    if (stamina < TRAVEL_STAMINA_COST) {
      toast("warn", "พลังไม่พอสำหรับการเดินทาง");
      return;
    }
    walkTo(exit.x, exit.y, () => gotoScene(routeSceneId));
  }

  return (
    <Card>
      <CardContent className="p-2 space-y-1.5">
        <div
          className="relative w-full overflow-hidden frame-pixel cursor-pointer select-none"
          onClick={handleGroundClick}
        >
          <img
            src={map.image}
            alt={scene.name}
            className="block w-full h-auto pointer-events-none"
            draggable={false}
          />

          {/* player token */}
          <div
            className="absolute z-20 pointer-events-none flex flex-col items-center"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -90%)",
              transition: `left ${walkMs}ms linear, top ${walkMs}ms linear`,
            }}
          >
            <span className="text-2xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]">
              🧍
            </span>
            <span className="mt-0.5 px-1 text-[9px] font-bold bg-vermilion text-white shadow-pixel">
              เจ้า
            </span>
          </div>

          {sceneNpcs.map((npc) => (
            <MapMarker
              key={npc.id}
              x={spots[npc.id].x}
              y={spots[npc.id].y}
              icon="💬"
              label={npc.name}
              onClick={() => handleSceneNpc(npc, spots[npc.id])}
            />
          ))}
          {registryNpcs.map((npc) => (
            <MapMarker
              key={`registry-${npc.id}`}
              x={spots[npc.id].x}
              y={spots[npc.id].y}
              icon="👤"
              label={npc.name}
              onClick={() => handleRegistryNpc(npc, spots[npc.id])}
            />
          ))}
          {exits.map(({ exit, route }) => (
            <MapMarker
              key={route.routeSceneId}
              x={exit.x}
              y={exit.y}
              icon={exit.icon ?? "🚶"}
              label={route.label}
              muted={stamina < TRAVEL_STAMINA_COST}
              onClick={() => handleExit(exit, route.routeSceneId)}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          คลิกบนแผนที่เพื่อเดิน · คลิกป้ายเพื่อพูดคุยหรือเดินทาง (⚡ {TRAVEL_STAMINA_COST})
        </p>
      </CardContent>
    </Card>
  );
}

function MapMarker({
  x,
  y,
  icon,
  label,
  muted,
  onClick,
}: {
  x: number;
  y: number;
  icon: string;
  label: string;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="absolute z-10 flex flex-col items-center group"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -90%)" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)] transition-transform group-hover:-translate-y-0.5">
        {icon}
      </span>
      <span
        className={`mt-0.5 px-1 py-px text-[9px] font-semibold whitespace-nowrap shadow-pixel ${
          muted ? "bg-muted text-muted-foreground" : "bg-paper/95 text-ink"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
