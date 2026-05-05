"use client";

// World ↔ Battle bridge.
//
// One-way automatic side: when a world choice's `triggerBattle` effect sets
// `pendingBattle`, this module starts the battle in the (unpersisted) battle
// store. The reverse direction (battle → world after a winner is set) is
// driven by user action (`acknowledgeBattleResult` in the world store) so
// players see the result before the world resumes.
//
// This wiring lives outside the React tree so it survives unmounts.
//
// Activated by importing once from app/page.tsx:
//   import { initBattleBridge } from "@/lib/world/battle-bridge";
//   initBattleBridge();
// It's idempotent.

import { useBattleStore } from "@/store/battle-store";
import { useWorldStore } from "@/store/world-store";
import { getOpponent } from "./data/opponents";

// Single chokepoint for "world says fight, battle hasn't started" — used by
// both the module-level subscription (fast path) and a React useEffect hook
// in WorldScreen (defensive path). Calling it when the battle already exists
// is a no-op so it's safe to invoke repeatedly.
export function ensureBattleStarted(): void {
  const ws = useWorldStore.getState();
  if (!ws.pendingBattle) return;

  const bs = useBattleStore.getState();
  if (bs.state) return; // already running

  if (!ws.playerBuild) {
    console.warn("[bridge] pendingBattle without playerBuild — clearing");
    ws.clearPendingBattle();
    return;
  }
  const opp = getOpponent(ws.pendingBattle.opponentId);
  if (!opp) {
    console.warn(
      `[bridge] unknown opponentId "${ws.pendingBattle.opponentId}" — clearing`,
    );
    ws.clearPendingBattle();
    return;
  }
  bs.start(ws.playerBuild, opp.build(), {
    hpA: ws.currentHp,
    mpA: ws.currentMp,
  });
}

let initialized = false;

export function initBattleBridge(): void {
  if (initialized) return;
  if (typeof window === "undefined") return; // SSR guard
  initialized = true;

  // World → Battle: when a scene effect sets `pendingBattle`, start the
  // battle. The world UI renders the battle inline (no tab navigation).
  useWorldStore.subscribe((next, prev) => {
    if (next.pendingBattle === prev.pendingBattle) return;
    if (!next.pendingBattle) return;
    ensureBattleStarted();
  });

  // No Battle → World subscription. The world UI shows the battle's winner
  // banner with a "ดำเนินเรื่อง" button that calls
  // `worldStore.acknowledgeBattleResult()` — that's where the seam closes.

  // Catch the case where the page rehydrates with pendingBattle already set
  // but the (unpersisted) battle store is empty.
  ensureBattleStarted();
}
