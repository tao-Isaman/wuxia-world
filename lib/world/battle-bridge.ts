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
    if (!next.playerBuild) {
      console.warn("[bridge] pendingBattle without playerBuild — clearing");
      useWorldStore.getState().clearPendingBattle();
      return;
    }
    const opp = getOpponent(next.pendingBattle.opponentId);
    if (!opp) {
      console.warn(
        `[bridge] unknown opponentId "${next.pendingBattle.opponentId}" — clearing`,
      );
      useWorldStore.getState().clearPendingBattle();
      return;
    }
    useBattleStore.getState().start(next.playerBuild, opp.build());
  });

  // No Battle → World subscription. The world UI shows the battle's winner
  // banner with a "ดำเนินเรื่อง" button that calls
  // `worldStore.acknowledgeBattleResult()` — that's where the seam closes.

  reconcile();
}

// Hot-reload reconciliation: if we reload while a battle is mid-flight,
// fix up store state so the player isn't stuck.
function reconcile(): void {
  const ws = useWorldStore.getState();
  const bs = useBattleStore.getState();
  if (!ws.pendingBattle) return;
  // Battle store is unpersisted — if it's null on reload, restart so the
  // player can finish. If a winner was already decided pre-reload, the
  // restart drops that and the player has to fight again. Acceptable for now.
  if (!bs.state && ws.playerBuild) {
    const opp = getOpponent(ws.pendingBattle.opponentId);
    if (opp) {
      bs.start(ws.playerBuild, opp.build());
    } else {
      console.warn("[bridge] reconcile: opponent vanished, clearing pendingBattle");
      ws.clearPendingBattle();
    }
  }
}
