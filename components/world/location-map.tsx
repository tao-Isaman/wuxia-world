"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ArtisanDef,
  LocationMapDef,
  LocationScene,
  MapSpot,
  NpcDef,
  NpcRef,
} from "@/lib/world";
import {
  evaluateCondition,
  getArtisan,
  getNpcsAtLocation,
  getResource,
  getScene,
  getSectHallAt,
  getShopAt,
  npcBodySprite,
  npcPortrait,
  playerBodySprite,
} from "@/lib/world";
import { useWorldStore, TRAVEL_STAMINA_COST } from "@/store/world-store";
import { toast } from "@/store/toast-store";

// Callbacks into LocationView's popup state — the map is a spatial
// front-end over the exact same flows as the classic cards.
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

interface Props {
  scene: LocationScene;
  map: LocationMapDef;
  handlers: MapSpotHandlers;
}

// Where the token last stood, per location. Dialogs, battles, and
// encounters unmount the map — on return the player resumes from the
// same spot instead of snapping back to spawn. Leaving through an exit
// clears the entry so the NEXT arrival starts at the gate again.
const LAST_POS = new Map<string, { x: number; y: number }>();

// Fresh game → forget every remembered position (called by StartScreen).
export function clearMapPositions() {
  LAST_POS.clear();
}

// AI-painted location map rendered as a fullscreen camera viewport: the
// painting is zoomed to `map.zoom`× the viewport width so the player
// only sees part of the world; the camera follows the token (clamped at
// map edges). Clicking ground walks the token; clicking a marker walks
// there first, then fires the action. Fills its nearest positioned
// ancestor — LocationView mounts it inside a `fixed inset-0` container
// with key={scene.id} so the token resets to spawn on location change.
export function LocationMap({ scene, map, handlers }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const stamina = useWorldStore((s) => s.stamina);
  const playerBodyId = useWorldStore((s) => s.playerBodyId);

  const [pos, setPos] = useState(() => LAST_POS.get(scene.id) ?? map.spawn);
  const [walkMs, setWalkMs] = useState(0);
  const timer = useRef<number | null>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // ── camera ──────────────────────────────────────────────────────────
  // The viewport is the full screen, so its aspect (h/w) is measured and
  // tracked through resize. The world layer is zoom× the viewport width,
  // height derived from the painting's 3:2 ratio:
  //   visible width  = 100/zoom              (% of world width)
  //   visible height = aspect/(zoom·2/3)     (fraction of world height)
  // On tall/portrait screens the authored zoom could leave the world
  // shorter than the viewport, so zoom is raised to keep full coverage.
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
  const zoom = Math.max(map.zoom ?? 2.2, (aspect / (2 / 3)) * 1.001);
  const viewFracX = 100 / zoom;
  const viewFracY = Math.min(100, (aspect / (zoom * (2 / 3))) * 100);
  const camX = clamp(pos.x - viewFracX / 2, 0, 100 - viewFracX);
  const camY = clamp(pos.y - viewFracY / 2, 0, 100 - viewFracY);

  // Walk the token to (x, y), then fire `after`. A new click cancels the
  // pending action of the previous walk (the token changes course).
  function walkTo(x: number, y: number, after?: () => void) {
    const dist = Math.hypot(x - pos.x, y - pos.y);
    const ms = Math.max(250, Math.round(dist * 32)); // ~32ms per % unit
    if (timer.current) clearTimeout(timer.current);
    setWalkMs(ms);
    setPos({ x, y });
    LAST_POS.set(scene.id, { x, y });
    timer.current = window.setTimeout(() => {
      after?.();
    }, ms + 80);
  }

  function handleGroundClick(e: React.MouseEvent) {
    const el = worldRef.current;
    if (!el || e.target !== el) return;
    // offsetX/Y are reported in the element's LOCAL (pre-transform)
    // coordinate space, so this survives the mobile-landscape rotation.
    const x = (e.nativeEvent.offsetX / el.offsetWidth) * 100;
    const y = (e.nativeEvent.offsetY / el.offsetHeight) * 100;
    walkTo(clamp(x, 2, 98), clamp(y, 4, 96));
  }

  // ── markers ─────────────────────────────────────────────────────────
  const spots = map.npcSpots ?? {};
  const sceneNpcs = scene.npcs.filter(
    (n) => spots[n.id] && (!n.visibleIf || evaluateCondition(state, n.visibleIf)),
  );
  const registryNpcs = getNpcsAtLocation(scene.id).filter(
    (n) => spots[n.id] && (!n.visibleIf || evaluateCondition(state, n.visibleIf)),
  );

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
    walkTo(spot.x, spot.y + 3, () => gotoScene(npc.dialogSceneId));
  }

  function handleExit(exit: { x: number; y: number }, routeSceneId: string) {
    if (stamina < TRAVEL_STAMINA_COST) {
      toast("warn", "พลังไม่พอสำหรับการเดินทาง");
      return;
    }
    walkTo(exit.x, exit.y, () => {
      // Actually leaving — next arrival here starts at spawn again.
      LAST_POS.delete(scene.id);
      gotoScene(routeSceneId);
    });
  }

  // Resolve a service spot to its marker face + click action. Returns
  // null when the backing service doesn't exist at this location (e.g.,
  // a typo'd artisanId) so a bad author entry renders nothing.
  function resolveSpot(spot: MapSpot): { icon: string; label: string; act: () => void } | null {
    switch (spot.kind) {
      case "shop": {
        const shop = getShopAt(scene.id);
        if (!shop) return null;
        return {
          icon: spot.icon ?? "🏪",
          label: spot.label ?? shop.label,
          act: handlers.onShop,
        };
      }
      case "sectHall": {
        const hall = getSectHallAt(scene.id);
        if (!hall) return null;
        return {
          icon: spot.icon ?? "🏯",
          label: spot.label ?? hall.label,
          act: handlers.onSectHall,
        };
      }
      case "artisan": {
        const artisan = getArtisan(spot.artisanId);
        if (!artisan || artisan.locationId !== scene.id) return null;
        return {
          icon: spot.icon ?? "🛠",
          label: spot.label ?? artisan.label,
          act: () => handlers.onArtisan(artisan),
        };
      }
      case "rest":
        return {
          icon: spot.icon ?? "🛏",
          label: spot.label ?? "พักผ่อน",
          act: handlers.onRest,
        };
      case "rumor":
        return {
          icon: spot.icon ?? "🍶",
          label: spot.label ?? "ฟังข่าวลือ",
          act: handlers.onRumor,
        };
      case "practice":
        return {
          icon: spot.icon ?? "🧘",
          label: spot.label ?? "ฝึกฝน",
          act: handlers.onPractice,
        };
      case "resource": {
        const res = getResource(spot.resourceId);
        if (!res) return null;
        return {
          icon: spot.icon ?? "🌿",
          label: spot.label ?? res.name,
          act: () => handlers.onResource(spot.resourceId),
        };
      }
    }
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden cursor-pointer select-none bg-ink"
    >
      {/* world layer — zoom× viewport width, camera-follow transform */}
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
          <img
            src={map.image}
            alt={scene.name}
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

          {sceneNpcs.map((npc) => (
            <MapMarker
              key={npc.id}
              x={spots[npc.id].x}
              y={spots[npc.id].y}
              icon="💬"
              body={npcBodySprite(npc.id)}
              img={npcPortrait(npc.id)}
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
              body={npcBodySprite(npc.id)}
              img={npcPortrait(npc.id)}
              label={npc.name}
              onClick={() =>
                walkTo(spots[npc.id].x, spots[npc.id].y + 3, () =>
                  handlers.onRegistryNpc(npc),
                )
              }
            />
          ))}
          {(map.spots ?? []).map((spot, i) => {
            const r = resolveSpot(spot);
            if (!r) return null;
            return (
              <MapMarker
                key={`spot-${i}`}
                x={spot.x}
                y={spot.y}
                icon={r.icon}
                label={r.label}
                onClick={() => walkTo(spot.x, spot.y + 3, r.act)}
              />
            );
          })}
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

      {/* hint chip — HUD overlay, not part of the world */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3 py-1 bg-ink/70 text-paper/90 text-[30px] leading-tight whitespace-nowrap">
        คลิกเพื่อเดิน · คลิกป้ายเพื่อโต้ตอบ · เดินทาง ⚡ {TRAVEL_STAMINA_COST}
      </div>
    </div>
  );
}

function MapMarker({
  x,
  y,
  icon,
  img,
  body,
  label,
  muted,
  onClick,
}: {
  x: number;
  y: number;
  icon: string;
  img?: string;
  body?: string;
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
      {body ? (
        // full-body transparent sprite standing on the painting
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={body}
          alt={label}
          draggable={false}
          className="w-[168px] h-[168px] pixel drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transition-transform group-hover:-translate-y-0.5"
        />
      ) : img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={label}
          draggable={false}
          className="w-24 h-24 pixel shadow-pixel border border-ink/60 transition-transform group-hover:-translate-y-0.5"
        />
      ) : (
        <span className="text-4xl leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)] transition-transform group-hover:-translate-y-0.5">
          {icon}
        </span>
      )}
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
