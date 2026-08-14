"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/wuxia/panel";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { useWorldStore } from "@/store/world-store";
import { useBattleStore } from "@/store/battle-store";
import { confirmDialog } from "@/store/confirm-store";
import {
  NPCS,
  getLocationMap,
  getRouteMap,
  getScene,
  npcBodySprite,
} from "@/lib/world";
import { ensureBattleStarted } from "@/lib/world/battle-bridge";
import { StartScreen } from "./start-screen";
import { DialogDisplay } from "./dialog-display";
import { ChoicePanel } from "./choice-panel";
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
  art,
}: {
  children: React.ReactNode;
  bottom?: boolean;
  /** keep the in-game HUD (status panel + menu icons) on screen */
  hud?: boolean;
  /** large scene art (e.g. the speaking NPC's sprite) behind the panels */
  art?: React.ReactNode;
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
      {art}
      <div
        className={`relative z-10 max-w-3xl mx-auto p-3 min-h-full flex flex-col gap-3 ${
          bottom ? "justify-end" : "justify-center"
        }`}
      >
        {children}
      </div>
      {hud && (
        <>
          <MapHud />
          <MenuBar hud />
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
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  const pendingEncounter = useWorldStore((s) => s.pendingEncounter);
  const gameOver = useWorldStore((s) => s.gameOver);
  const acknowledge = useWorldStore((s) => s.acknowledgeBattleResult);
  const resetGame = useWorldStore((s) => s.resetGame);
  // Subscribe to battle state so the layout updates when winner is set / cleared.
  const battleStateExists = useBattleStore((s) => s.state !== null);

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
      <MapBackdrop>
        <StatusBar />
        <EncounterScreen />
      </MapBackdrop>
    );
  } else {
    const scene = getScene(currentSceneId);
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
      // Dialogs render as part of the game HUD: the status panel + menu
      // icons stay on screen, the speaking NPC's sprite stands beside a
      // game-style text box anchored low, choices beneath it.
      if (scene.kind === "dialog") {
        // Who is talking? Prefer the NPC whose talk scene this is; fall
        // back to matching the first speech line's speaker name (covers
        // chained sub-scenes). No match → no sprite, box only.
        const talkNpc =
          NPCS.find((n) => n.dialogSceneId === scene.id) ??
          (() => {
            const speech = scene.lines.find(
              (l) => l.t !== "narration" && "speaker" in l,
            ) as { speaker?: string } | undefined;
            return speech?.speaker
              ? NPCS.find((n) => n.name === speech.speaker)
              : undefined;
          })();
        const artSprite = talkNpc ? npcBodySprite(talkNpc.id) : undefined;
        return (
          <>
            <MapBackdrop
              bottom
              hud
              art={
                artSprite ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artSprite}
                    alt={talkNpc?.name ?? ""}
                    draggable={false}
                    className="fixed bottom-0 left-2 md:left-14 z-[5] h-[46vh] w-auto pixel drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)] pointer-events-none"
                  />
                ) : undefined
              }
            >
              <DialogDisplay scene={scene} />
              <ChoicePanel scene={scene} />
            </MapBackdrop>
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
      if ((scene.kind === "location" && getLocationMap(scene.id)) || routeMap) {
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
