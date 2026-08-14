"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/wuxia/panel";
import { WuxiaButton } from "@/components/ui/wuxia/button";
import { useWorldStore } from "@/store/world-store";
import { useBattleStore } from "@/store/battle-store";
import { confirmDialog } from "@/store/confirm-store";
import { getLocationMap, getRouteMap, getScene } from "@/lib/world";
import { ensureBattleStarted } from "@/lib/world/battle-bridge";
import { StartScreen } from "./start-screen";
import { DialogDisplay } from "./dialog-display";
import { ChoicePanel } from "./choice-panel";
import { LocationView } from "./location-view";
import { RouteView } from "./route-view";
import { RouteMapView } from "./route-map-view";
import { StatusBar } from "./status-bar";
import { MenuBar } from "./menu-bar";
import { GameOverScreen } from "./game-over-screen";
import { EncounterScreen } from "./encounter-screen";
import { LoadingOverlay } from "./loading-overlay";
import { ToastStack } from "./toast-stack";
import { ConfirmDialog } from "./confirm-dialog";
import { BattleArena } from "@/components/game/battle-arena";

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
      <div className="space-y-3">
        <BattleArena mode="world" onContinue={acknowledge} />
      </div>
    );
  } else if (pendingEncounter) {
    body = (
      <div className="space-y-3">
        <StatusBar />
        <EncounterScreen />
      </div>
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
      let mainView: React.ReactNode;
      switch (scene.kind) {
        case "dialog":
          mainView = (
            <>
              <DialogDisplay scene={scene} />
              <ChoicePanel scene={scene} />
            </>
          );
          break;
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
