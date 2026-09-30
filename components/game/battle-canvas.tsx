"use client";
import { useEffect, useRef, useState } from "react";
import { useBattleStore } from "@/store/battle-store";
import { useWorldStore } from "@/store/world-store";
import type { Cell, UnitLook } from "@/lib/game/grid";
import { characterId } from "@/lib/characters/catalog";
import { resolveBattleBackground } from "@/lib/stage/battle-background";
import type { GridBattleRuntime, GridBattleUi } from "@/lib/stage/grid-battle-runtime";

export interface BattleActor { id: string; team: "ally" | "enemy"; name: string; look: UnitLook }

/**
 * Who stands on the board, with each unit's own look (from the grid state).
 * `characterA` / `characterB` remain for callers that only need the leader
 * and the primary enemy.
 */
export function useBattleActors(_mode: "world" | "free" = "world") {
  const units = useBattleStore((s) => s.state?.units);
  const actors: BattleActor[] = (units ?? []).map((u) => ({ id: u.id, team: u.team, name: u.name, look: u.look }));
  const leader = actors.find((a) => a.team === "ally");
  const enemy = actors.find((a) => a.team === "enemy");
  const charOf = (look?: UnitLook) => characterId(look?.kind === "character" ? look.characterId : "m1");
  return {
    actors,
    characterA: charOf(leader?.look),
    characterB: charOf(enemy?.look),
    creatureFrame: enemy?.look.kind === "creature" ? enemy.look.frame : null,
    spriteB: enemy?.look.kind === "character" ? enemy.look.still : undefined,
  };
}

export function BattleCanvas({ mode, ui, onTap, onHover, onAnim, onPlayed }: {
  mode: "world" | "free";
  ui: GridBattleUi;
  onTap: (cell: Cell | null, unitId: string | null, pointerType: string) => void;
  onHover: (cell: Cell | null) => void;
  onAnim: (playing: boolean) => void;
  /** Sequence number of the last fully played event (renderer failed → treat everything as played). */
  onPlayed?: (seq: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<GridBattleRuntime | null>(null);
  const builds = useBattleStore((s) => s.builds);
  const hasState = useBattleStore((s) => !!s.state);
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);
  const background = resolveBattleBackground({ mode, pendingBattle, currentSceneId, lastLocationId });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [attempt, setAttempt] = useState(0);
  const callbacks = useRef({ onTap, onHover, onAnim, onPlayed });
  callbacks.current = { onTap, onHover, onAnim, onPlayed };
  const uiRef = useRef(ui);
  uiRef.current = ui;

  useEffect(() => {
    if (!hasState) return;
    let disposed = false;
    setReady(false); setError(false);
    void import("@/lib/stage/grid-battle-runtime").then(({ createGridBattleRuntime }) => {
      if (disposed || !host.current) return;
      runtime.current = createGridBattleRuntime(host.current, {
        background,
        onReady: () => { if (!disposed) setReady(true); },
        onError: (reason) => {
          if (disposed) return;
          setReady(false); setError(reason ?? "");
          callbacks.current.onAnim(false);
          callbacks.current.onPlayed?.(Number.MAX_SAFE_INTEGER);
        },
        onTap: (cell, unitId, pointerType) => { if (!disposed) callbacks.current.onTap(cell, unitId, pointerType); },
        onHover: (cell) => { if (!disposed) callbacks.current.onHover(cell); },
        onAnim: (playing) => { if (!disposed) callbacks.current.onAnim(playing); },
        onPlayed: (seq) => { if (!disposed) callbacks.current.onPlayed?.(seq); },
      });
      runtime.current.setUi(uiRef.current);
    }).catch((cause: unknown) => {
      console.error("[battle] renderer could not start:", cause);
      if (!disposed) { setError(cause instanceof Error ? cause.message : String(cause)); callbacks.current.onPlayed?.(Number.MAX_SAFE_INTEGER); }
    });
    return () => { disposed = true; runtime.current?.destroy(); runtime.current = null; };
    // A new battle (start() replaces `builds`) or a retry rebuilds the stage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, hasState, attempt, background.id]);

  useEffect(() => { runtime.current?.setUi(ui); }, [ui]);

  return <div className="battle-stage gb-stage">
    <div ref={host} className="gb-canvas-host" role="img"
      aria-label={`${background.label} · กระดานประลอง ${builds?.A.name ?? "จอมยุทธ์"} กับ ${builds?.B.name ?? "คู่ต่อสู้"}`}
      data-testid="battle-canvas" data-renderer="phaser" data-ready={ready} data-battle-background={background.id} />
    {(!ready || error !== false) && <div className="canvas-loading" role="status">
      {error !== false ? <div className="text-center space-y-2">
        <button type="button" className="pixel-action" onClick={() => setAttempt((n) => n + 1)}>โหลดฉากใหม่</button>
        {error && <p className="text-xs opacity-80">({error})</p>}
      </div> : "กำลังเตรียมลานประลอง..."}
    </div>}
  </div>;
}
