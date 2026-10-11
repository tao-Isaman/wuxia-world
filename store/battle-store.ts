"use client";

// Battle store — the grid (tactics) battle.
//
// Wraps one battle session (lib/game/grid/session.ts: the engine driven by
// commands; see docs/grid-combat.md, "Store API"). Every change works on a
// fresh copy of the state and then publishes it, so React subscribers see new
// references for the state, `units`, `events` and `log` whenever anything
// changes.
//
// Pacing: the store never runs a timer. The renderer calls `step()` each time
// it has finished animating the latest events; one call does at most one
// visible thing (start the next turn and/or one AI move or action). When
// `isPlayerTurn(state, auto)` is true the store waits for `move` / `act` /
// `wait` / `flee`. UI selection state (picked skill, hovered tile) lives in
// the UI, not here.
//
// A battle started with `opts.seed` (a battle the game server checks,
// docs/online.md) rolls from that seed and keeps the command log the server
// replays (`commands`).

import { create } from "zustand";
import type { CharacterBuild } from "@/lib/game/types";
import {
  playerAction as sessionAction,
  setSessionAuto,
  startSession,
  stepSession,
  stepSessionAll,
  type BattleCommand,
  type BattleItemEffect,
  type BattleSession,
  type BattleStartOpts,
  type Cell,
  type GridBattleState,
} from "@/lib/game/grid";

export { PLAYER_UNIT, PRIMARY_ENEMY_UNIT, aiControls, cloneBattle, isPlayerTurn, type BattleStartOpts } from "@/lib/game/grid";

interface BattleStore {
  state: GridBattleState | null;
  /** Leader + primary enemy builds. */
  builds: { A: CharacterBuild; B: CharacterBuild } | null;
  /** อัตโนมัติ: the AI also plays the player's side. */
  auto: boolean;
  /** The seed of a battle the server checks (null: an unchecked battle). */
  seed: number | null;

  start: (a: CharacterBuild, b: CharacterBuild, opts?: BattleStartOpts) => void;
  reset: () => void;
  setAuto: (on: boolean) => void;

  /** Player's active unit walks to `to` (before acting). */
  move: (to: Cell) => boolean;
  /** Player's active unit uses skill / art slot `slot` aimed at `target`. */
  act: (slot: number, target: Cell) => boolean;
  /** Player's active unit ends its turn. */
  wait: () => boolean;
  /** The leader uses a battle item from the bag on `target` (costs the turn). */
  useItem: (itemId: string, name: string, effect: BattleItemEffect, target: Cell) => boolean;
  /** Leader tries to retreat (fails → turn spent). */
  flee: () => boolean;
  /** Advance one visible beat of non-player play (see header). */
  step: () => void;
  /** Tests / debug: step until the player must act or the battle ends. */
  stepAll: () => void;
  /** The command log of a seeded battle so far (empty for an unchecked one). */
  commands: () => readonly BattleCommand[];
}

export const useBattleStore = create<BattleStore>((set, get) => {
  let session: BattleSession | null = null;

  const publish = () => { if (session) set({ state: session.state, auto: session.auto }); };
  const act = (action: Parameters<typeof sessionAction>[1]): boolean => {
    if (!session || !sessionAction(session, action)) return false;
    publish();
    return true;
  };

  return {
    state: null,
    builds: null,
    auto: false,
    seed: null,

    start: (a, b, opts = {}) => {
      session = startSession(a, b, opts);
      set({ state: session.state, builds: { A: a, B: b }, auto: false, seed: typeof opts.seed === "number" ? opts.seed : null });
    },

    reset: () => { session = null; set({ state: null, builds: null, auto: false, seed: null }); },

    setAuto: (on) => {
      if (session) setSessionAuto(session, on);
      set({ auto: on });
    },

    move: (to) => act({ t: "move", to }),
    act: (slot, target) => act({ t: "skill", slot, target }),
    wait: () => act({ t: "wait" }),
    useItem: (itemId, name, effect, target) => act({ t: "item", itemId, name, effect, target }),
    flee: () => act({ t: "flee" }),
    step: () => { if (session && stepSession(session)) publish(); },
    stepAll: () => {
      if (!session) return;
      stepSessionAll(session);
      publish();
    },
    commands: () => session?.commands ?? [],
  };
});
