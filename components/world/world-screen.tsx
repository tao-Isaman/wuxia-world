"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorldStore } from "@/store/world-store";
import { useBattleStore } from "@/store/battle-store";
import { getScene } from "@/lib/world";
import { StartScreen } from "./start-screen";
import { DialogDisplay } from "./dialog-display";
import { ChoicePanel } from "./choice-panel";
import { QuestLog } from "./quest-log";
import { PlayerStatus } from "./player-status";
import { DebugOverlay } from "./debug-overlay";
import { BattleArena } from "@/components/game/battle-arena";

export function WorldScreen() {
  // Persist middleware hydrates async; render a placeholder until ready so
  // SSR/client markup matches and we don't flash the StartScreen wrongly.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const hasGame = useWorldStore((s) => s.hasGame);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  const acknowledge = useWorldStore((s) => s.acknowledgeBattleResult);
  const resetGame = useWorldStore((s) => s.resetGame);
  // Subscribe to battle state so the layout updates when winner is set / cleared.
  const battleStateExists = useBattleStore((s) => s.state !== null);

  if (!hydrated) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          กำลังโหลด...
        </CardContent>
      </Card>
    );
  }

  if (!hasGame) {
    return <StartScreen />;
  }

  // Active battle — render BattleArena inline. The bridge already started
  // the battle when pendingBattle was set; if for some reason it hasn't, the
  // arena shows its own "เริ่มการต่อสู้..." placeholder.
  if (pendingBattle) {
    void battleStateExists; // touched so the component re-renders on battle changes
    return (
      <div className="space-y-3">
        <BattleArena mode="world" onContinue={acknowledge} />
      </div>
    );
  }

  const scene = getScene(currentSceneId);
  if (!scene) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-destructive">
            ไม่พบฉาก &quot;{currentSceneId}&quot;
          </p>
          <Button variant="outline" onClick={resetGame}>
            เริ่มใหม่
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3">
      <div className="space-y-3">
        <DialogDisplay scene={scene} />
        <ChoicePanel scene={scene} />
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] text-muted-foreground"
            onClick={() => {
              if (window.confirm("ออกจากเกมและลบเซฟ?")) resetGame();
            }}
          >
            ออกเกม
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <PlayerStatus />
        <QuestLog />
        <DebugOverlay />
      </div>
    </div>
  );
}
