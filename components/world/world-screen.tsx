"use client";

import { useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/wuxia/panel";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { useWorldStore } from "@/store/world-store";
import { useBattleStore } from "@/store/battle-store";
import { confirmDialog } from "@/store/confirm-store";
import {
  NPCS,
  getLocationMap,
  getNpcsAtLocation,
  getRouteMap,
  getScene,
  type LocationScene,
} from "@/lib/world";
import { ensureBattleStarted } from "@/lib/world/battle-bridge";
import { StartScreen } from "./start-screen";
import { DialogStage, type DialogSpeaker } from "./dialog-stage";
import { LocationView } from "./location-view";
import { RouteView } from "./route-view";
import { RouteMapView } from "./route-map-view";
import { StatusBar } from "./status-bar";
import { MenuBar } from "./menu-bar";
import { MapHud } from "./map-hud";
import { GameOverScreen } from "./game-over-screen";
import { EncounterScreen } from "./encounter-screen";
import { LoadingOverlay } from "./loading-overlay";
import { ToastStack } from "./toast-stack";
import { ConfirmDialog } from "./confirm-dialog";
import { BattleArena } from "@/components/game/battle-arena";

// Fullscreen overlay that shows the player's current surroundings (the
// map painting of the scene, or of the last location for dialogs and
// mid-travel events) as a darkened cover background, with the given
// panels floating above as a HUD. Falls back to the classic paper
// column when no painting applies. `bottom` anchors content low —
// the JRPG conversation-box position.
function MapBackdrop({
  children,
  bottom,
  hud,
}: {
  children: React.ReactNode;
  bottom?: boolean;
  /** keep the in-game HUD on screen: true = status + menu, "status" = status only */
  hud?: boolean | "status";
}) {
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);
  const img =
    getLocationMap(currentSceneId)?.image ??
    getRouteMap(currentSceneId)?.image ??
    (lastLocationId ? getLocationMap(lastLocationId)?.image : undefined);

  if (!img) return <div className="space-y-3">{children}</div>;

  return (
    // !mt-0 counters the page wrapper's space-y margin on fixed layers.
    <div className="fixed inset-0 z-40 !mt-0 overflow-y-auto bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt=""
        draggable={false}
        className="fixed inset-0 w-full h-full object-cover pixel opacity-40 pointer-events-none"
      />
      <div
        className={`relative z-10 max-w-3xl mx-auto p-3 min-h-full flex flex-col gap-3 ${
          hud === "status" ? "backdrop-focus justify-center" : bottom ? "justify-end pb-28 pt-44" : "justify-center"
        }`}
      >
        {children}
      </div>
      {hud && (
        <>
          <MapHud />
          {hud === true && <MenuBar hud />}
        </>
      )}
    </div>
  );
}

export function WorldScreen() {
  // Persist middleware hydrates async; render a placeholder until ready
  // so SSR/client markup matches and we don't flash the StartScreen
  // wrongly.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const hasGame = useWorldStore((s) => s.hasGame);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  const pendingEncounter = useWorldStore((s) => s.pendingEncounter);
  const gameOver = useWorldStore((s) => s.gameOver);
  const acknowledge = useWorldStore((s) => s.acknowledgeBattleResult);
  const resetGame = useWorldStore((s) => s.resetGame);
  // Subscribe to battle state so the layout updates when winner is set / cleared.
  const battleStateExists = useBattleStore((s) => s.state !== null);
  const scene = getScene(currentSceneId);
  const source = useRef<{ location: LocationScene; nextSceneIds: string[]; speaker?: DialogSpeaker } | null>(null);
  const hasRenderedScene = useRef(false);
  const lastLocation = lastLocationId ? getScene(lastLocationId) : undefined;
  const candidate = source.current?.location ??
    (!hasRenderedScene.current && lastLocation?.kind === "location" ? lastLocation : undefined);
  const localNpcs = candidate ? [...getNpcsAtLocation(candidate.id), ...candidate.npcs] : [];
  const speaker = scene?.kind === "dialog"
    ? [...localNpcs, ...NPCS].find((npc) => npc.dialogSceneId === scene.id) ??
      scene.lines.flatMap((line) => line.t === "dialogue"
        ? [...localNpcs, ...NPCS].filter((npc) => npc.name === line.speaker) : [])[0]
    : undefined;
  const speakingHere = speaker && localNpcs.some((npc) => npc.id === speaker.id);
  // Only an authored successor belongs to this conversation. Returning to town
  // can dispatch a random meeting; that new speaker must not inherit Lin's face.
  const continuesConversation = scene?.kind === "dialog" && source.current?.nextSceneIds.includes(scene.id) &&
    (!speaker || speakingHere);
  const dialogueLocation = scene?.kind === "dialog" && candidate?.id === lastLocationId &&
    (continuesConversation || speakingHere) && getLocationMap(candidate.id)
    ? candidate : undefined;
  const mappedLocation = scene?.kind === "location" && getLocationMap(scene.id) ? scene : dialogueLocation;
  const stagedSpeaker = speaker ?? (dialogueLocation ? source.current?.speaker : undefined);

  useEffect(() => {
    if (!hydrated) return;
    hasRenderedScene.current = true;
    source.current = hasGame && !gameOver && !pendingBattle && !pendingEncounter && mappedLocation
      ? { location: mappedLocation, speaker: stagedSpeaker, nextSceneIds: scene?.kind === "dialog"
        ? [scene.next, ...(scene.choices ?? []).map(choice => choice.next)].filter((id): id is string => !!id)
        : [] }
      : null;
  }, [hydrated, hasGame, gameOver, pendingBattle, pendingEncounter, mappedLocation, scene, stagedSpeaker]);

  // Defensive: if pendingBattle is set but the (unpersisted) battle store
  // isn't running yet, kick it off from React's lifecycle.
  useEffect(() => {
    if (pendingBattle && !battleStateExists) ensureBattleStarted();
  }, [pendingBattle, battleStateExists]);

  if (!hydrated) {
    return (
      <Panel padding="p-8" className="text-center">
        <p className="text-sm text-muted-foreground font-display">
          กำลังโหลด...
        </p>
      </Panel>
    );
  }

  // Pick the body content per state. Globals (LoadingOverlay / ToastStack /
  // ConfirmDialog) are mounted ONCE outside the switch so confirm dialogs
  // raised by any branch (incl. game-over and the no-scene fallback) get
  // rendered. Without this, GameOverScreen's confirm-then-resetGame flow
  // silently hangs because no ConfirmDialog is on the tree.
  let body: React.ReactNode;

  if (!hasGame) {
    body = <StartScreen />;
  } else if (gameOver) {
    body = <GameOverScreen />;
  } else if (pendingBattle) {
    void battleStateExists; // re-render when battle state flips
    body = (
      <MapBackdrop>
        <BattleArena mode="world" onContinue={acknowledge} />
      </MapBackdrop>
    );
  } else if (pendingEncounter) {
    body = (
      <MapBackdrop bottom hud="status">
        <EncounterScreen />
      </MapBackdrop>
    );
  } else {
    if (!scene) {
      body = (
        <Panel padding="p-6" className="text-center space-y-3">
          <p className="text-sm text-destructive font-sans">
            ไม่พบฉาก &quot;{currentSceneId}&quot;
          </p>
          <WuxiaButton variant="default" onClick={resetGame}>
            เริ่มใหม่
          </WuxiaButton>
        </Panel>
      );
    } else {
      // This keyed sibling stays at the same position across location → dialog
      // → location. The Phaser canvas, actor positions and camera survive.
      if (mappedLocation) {
        return (
          <>
            <LocationView key={mappedLocation.id} scene={mappedLocation} readOnly={scene.kind === "dialog"}
              dialogueSpeakerId={scene.kind === "dialog" ? stagedSpeaker?.id : undefined} />
            {scene.kind === "dialog" && <DialogStage scene={scene} speaker={stagedSpeaker} locationName={mappedLocation.name} />}
            <LoadingOverlay key="loading" />
            <ToastStack key="toasts" />
            <ConfirmDialog key="confirm" />
          </>
        );
      }
      // Travel events, the opening and unassociated narration retain their
      // safe illustrated fallback instead of inventing a location or actors.
      if (scene.kind === "dialog") {
        return (
          <>
            <MapBackdrop>{null}</MapBackdrop>
            <DialogStage scene={scene} speaker={speaker ? { id: speaker.id, name: speaker.name } : undefined}
              title={scene.lines.find((line) => line.t === "dialogue")?.speaker}
              locationName={lastLocation?.kind === "location" ? lastLocation.name : ""} />
            <LoadingOverlay />
            <ToastStack />
            <ConfirmDialog />
          </>
        );
      }
      let mainView: React.ReactNode;
      switch (scene.kind) {
        case "location":
          mainView = <LocationView scene={scene} />;
          break;
        case "route":
          mainView = <RouteView scene={scene} />;
          break;
      }
      // Mapped locations and mapped route edges render as fullscreen
      // game screens — the map carries its own HUD (status + menu
      // icons), so the page chrome (StatusBar / MenuBar / exit button)
      // stays out of the tree.
      const routeMap = scene.kind === "route" ? getRouteMap(scene.id) : undefined;
      if (routeMap && scene.kind === "route") {
        mainView = <RouteMapView key={scene.id} scene={scene} map={routeMap} />;
      }
      if (routeMap) {
        return (
          <>
            {mainView}
            <LoadingOverlay />
            <ToastStack />
            <ConfirmDialog />
          </>
        );
      }
      body = (
        <div className="space-y-3">
          <StatusBar />
          <MenuBar />
          {mainView}
          <div className="flex justify-end">
            <WuxiaButton
              variant="ghost"
              size="sm"
              className="text-[11px] text-muted-foreground"
              onClick={async () => {
                const ok = await confirmDialog({
                  title: "ออกเกม",
                  message: "ออกจากเกมและลบเซฟ?\nความคืบหน้าทั้งหมดจะถูกลบทิ้ง",
                  confirmText: "ออกและลบ",
                  variant: "danger",
                });
                if (ok) resetGame();
              }}
            >
              ออกเกม
            </WuxiaButton>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {body}
      <LoadingOverlay />
      <ToastStack />
      <ConfirmDialog />
    </>
  );
}
