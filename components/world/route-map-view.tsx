"use client";

import { useEffect, useRef, useState } from "react";
import type { RouteMapDef, RouteScene, SceneEffect } from "@/lib/world";
import { applyEffect, evaluateCondition, playerBodySprite } from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { MapHud } from "./map-hud";
import { MenuBar } from "./menu-bar";

interface Props {
  scene: RouteScene;
  map: RouteMapDef;
}

// Fullscreen travel screen over a shared road painting (see
// route-maps.ts): the road runs bottom → top, destinations wait at the
// top edge, the way back at the bottom. Same walk-then-act mechanics as
// LocationMap, minus service spots.
export function RouteMapView({ scene, map }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const stamina = useWorldStore((s) => s.stamina);
  const playerBodyId = useWorldStore((s) => s.playerBodyId);
  const tooTired = stamina < TRAVEL_STAMINA_COST;

  const [pos, setPos] = useState(map.spawn);
  const [walkMs, setWalkMs] = useState(0);
  const timer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Camera — identical math to LocationMap (3:2 painting).
  const [aspect, setAspect] = useState(9 / 16);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () =>
      setAspect(el.clientHeight / Math.max(1, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const zoom = Math.max(map.zoom, (aspect / (2 / 3)) * 1.001);
  const viewFracX = 100 / zoom;
  const viewFracY = Math.min(100, (aspect / (zoom * (2 / 3))) * 100);
  const camX = clamp(pos.x - viewFracX / 2, 0, 100 - viewFracX);
  const camY = clamp(pos.y - viewFracY / 2, 0, 100 - viewFracY);

  function walkTo(x: number, y: number, after?: () => void) {
    const dist = Math.hypot(x - pos.x, y - pos.y);
    const ms = Math.max(250, Math.round(dist * 32));
    if (timer.current) clearTimeout(timer.current);
    setWalkMs(ms);
    setPos({ x, y });
    timer.current = window.setTimeout(() => after?.(), ms + 80);
  }

  function handleGroundClick(e: React.MouseEvent) {
    const rect = worldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    walkTo(clamp(x, 2, 98), clamp(y, 4, 96));
  }

  const visibleDests = scene.destinations.filter(
    (d) => !d.visibleIf || evaluateCondition(state, d.visibleIf),
  );
  const backTarget = scene.back ?? state.lastLocationId;

  // Same travel semantics as the classic RouteView: apply destination
  // effects through the store; a triggerBattle effect hands control to
  // the battle bridge instead of navigating.
  function travel(locationId: string, effects?: SceneEffect[]) {
    if (effects && effects.length > 0) {
      const draft = { ...state };
      draft.flags = { ...draft.flags };
      draft.quests = { ...draft.quests };
      draft.inventory = { ...draft.inventory };
      for (const e of effects) applyEffect(draft, e);
      useWorldStore.setState({
        flags: draft.flags,
        quests: draft.quests,
        inventory: draft.inventory,
        gold: draft.gold,
        pendingBattle: draft.pendingBattle,
      });
      if (draft.pendingBattle) return;
    }
    gotoScene(locationId);
  }

  function handleDest(slot: { x: number; y: number }, d: (typeof visibleDests)[number]) {
    if (tooTired) {
      toast("warn", "พลังไม่พอสำหรับการเดินทาง");
      return;
    }
    walkTo(slot.x, slot.y, () => travel(d.locationId, d.effects));
  }

  return (
    // !mt-0 counters the page wrapper's space-y margin on fixed layers.
    <div ref={rootRef} className="fixed inset-0 z-40 bg-ink !mt-0">
      <div className="absolute inset-0 overflow-hidden cursor-pointer select-none">
        <div
          ref={worldRef}
          className="absolute top-0 left-0"
          style={{
            width: `${zoom * 100}%`,
            transform: `translate(${-camX}%, ${-camY}%)`,
            transition: `transform ${walkMs}ms linear`,
            willChange: "transform",
          }}
          onClick={handleGroundClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={map.image}
            alt={scene.label}
            className="block w-full h-auto pointer-events-none pixel"
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerBodySprite(playerBodyId)}
              alt="เจ้า"
              draggable={false}
              className="w-[168px] h-[168px] pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
            />
            <span className="mt-0.5 px-2 text-[27px] font-bold bg-vermilion text-white shadow-pixel leading-tight">
              เจ้า
            </span>
          </div>

          {visibleDests.slice(0, map.destSlots.length).map((d, i) => (
            <RouteMarker
              key={d.locationId}
              x={map.destSlots[i].x}
              y={map.destSlots[i].y}
              icon="→"
              label={d.label}
              muted={tooTired}
              onClick={() => handleDest(map.destSlots[i], d)}
            />
          ))}
          {backTarget && backTarget !== state.currentSceneId && (
            <RouteMarker
              x={map.back.x}
              y={map.back.y}
              icon="↩"
              label="ย้อนกลับ"
              muted={tooTired}
              onClick={() => {
                if (tooTired) {
                  toast("warn", "พลังไม่พอสำหรับการเดินทาง");
                  return;
                }
                walkTo(map.back.x, map.back.y, () => gotoScene(backTarget));
              }}
            />
          )}
        </div>

        {/* travel label — HUD overlay */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3 py-1 bg-ink/70 text-paper/90 text-[30px] leading-tight whitespace-nowrap">
          🚶 {scene.label} · เดินทาง ⚡ {TRAVEL_STAMINA_COST}
        </div>
      </div>

      <MapHud />
      <MenuBar hud />
    </div>
  );
}

function RouteMarker({
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
      <span className="text-4xl leading-none font-bold text-paper drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)] transition-transform group-hover:-translate-y-0.5">
        {icon}
      </span>
      <span
        className={`mt-0.5 px-2 py-0.5 text-[27px] font-semibold whitespace-nowrap shadow-pixel leading-tight ${
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
