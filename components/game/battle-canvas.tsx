"use client";
import { useEffect, useRef, useState } from "react";
import { useBattleStore } from "@/store/battle-store";
import { useWorldStore } from "@/store/world-store";
import { NPCS, getOpponent } from "@/lib/world";
import { characterId, npcCharacterId } from "@/lib/characters/catalog";
import type { BattleCastProgress } from "@/lib/three/battle-runtime";
import { resolveBattleBackground } from "@/lib/three/battle-background";

export function BattleCanvas({ mode, onCastProgress }: {
  mode: "world" | "free";
  onCastProgress?: (progress: BattleCastProgress) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const builds = useBattleStore((s) => s.builds);
  const bodyId = useWorldStore((s) => s.playerBodyId);
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);
  const opponentId = pendingBattle?.opponentId;
  const background = resolveBattleBackground({ mode, pendingBattle, currentSceneId, lastLocationId });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const progressCallback = useRef(onCastProgress);
  progressCallback.current = onCastProgress;
  const npc = NPCS.find((n) => n.sparOpponentId === opponentId || n.name === builds?.B.name);
  const opponent = getOpponent(mode === "world" ? opponentId : undefined);
  const beast = opponent?.category === "beast";
  const creatureFrame = beast ? /tiger/.test(opponentId ?? "") ? 1 : /bear/.test(opponentId ?? "") ? 2 :
    /boar/.test(opponentId ?? "") ? 3 : /snake|serpent|python|viper|centipede|spider|scorpion/.test(opponentId ?? "") ? 4 :
    /chicken|rooster/.test(opponentId ?? "") ? 5 : /eagle|hawk|condor|bird/.test(opponentId ?? "") ? 6 :
    /bat/.test(opponentId ?? "") ? 7 : 0 : null;
  const characterA = characterId(mode === "world" ? bodyId : "m1");
  const characterB = npcCharacterId(npc?.id ?? opponentId ?? "thug");
  useEffect(() => {
    let disposed = false;
    let runtime: { destroy: () => void } | undefined;
    setReady(false); setError(false);
    void import("@/lib/three/battle-runtime").then(({ createBattleRuntime }) => {
      if (disposed || !host.current) return;
      runtime = createBattleRuntime(host.current, {
        characterA, characterB, creatureFrame, background,
        onReady: () => { if (!disposed) setReady(true); },
        onError: () => { if (!disposed) { setReady(false); setError(true); } },
        onCastProgress: (progress) => { if (!disposed) progressCallback.current?.(progress); },
      });
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; runtime?.destroy(); };
  }, [characterA, characterB, builds, attempt, creatureFrame, background]);
  return <div className="battle-stage">
    <div ref={host} className="absolute inset-0" role="img"
      aria-label={`${background.label} · ${builds?.A.name ?? "จอมยุทธ์"} กับ ${builds?.B.name ?? "คู่ต่อสู้"}`}
      data-testid="battle-canvas" data-renderer="three" data-ready={ready} data-battle-background={background.id} />
    {(!ready || error) && <div className="canvas-loading" role="status">
      {error ? <button type="button" className="pixel-action" onClick={() => setAttempt((n) => n + 1)}>โหลดฉากใหม่</button> : "กำลังเตรียมลานประลอง..."}
    </div>}
  </div>;
}
