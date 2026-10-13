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
//
// A party fight (a world boss, store/cloud-raid.ts) is played on the server:
// `startParty` stages it here as the server did, the player's moves go to the
// server as intents (`send`), and the commands the server makes — every
// person's and the AI's — come back through `receive` and play one per
// `step()`, so every screen shows the same fight. `control` says which unit
// this screen's player plays.

import { create } from "zustand";
import type { CharacterBuild } from "@/lib/game/types";
import {
  applyCommand,
  isPlayerTurn as isMyTurn,
  playerAction as sessionAction,
  setSessionAuto,
  startSession,
  stepSession,
  stepSessionAll,
  type BattleCommand,
  type BattleControl,
  type BattleItemEffect,
  type BattleSession,
  type BattleStartOpts,
  type Cell,
  type GridBattleState,
} from "@/lib/game/grid";

export { PLAYER_UNIT, PRIMARY_ENEMY_UNIT, aiControls, cloneBattle, isPlayerTurn, type BattleControl, type BattleStartOpts } from "@/lib/game/grid";

/** What a party fight's player asks the server for (store/cloud-raid.ts sends it). */
export type PartyIntent =
  | { t: "move"; to: Cell }
  | { t: "skill"; slot: number; target: Cell }
  | { t: "wait" }
  | { t: "auto"; on: boolean };

interface BattleStore {
  state: GridBattleState | null;
  /** Leader + primary enemy builds. */
  builds: { A: CharacterBuild; B: CharacterBuild } | null;
  /** อัตโนมัติ: the AI also plays the player's side. */
  auto: boolean;
  /** The seed of a battle the server checks (null: an unchecked battle). */
  seed: number | null;
  /** A party fight: who plays which unit (null: a solo fight, the player plays the ally side). */
  control: BattleControl | null;
  /** Commands from the server not played yet (a party fight). */
  queued: number;

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

  /** A party fight: stage it as the server did; `me` is this player's unit, `send` carries their intents. */
  startParty: (a: CharacterBuild, b: CharacterBuild, opts: BattleStartOpts, me: string, send: (intent: PartyIntent) => void) => void;
  /** A party fight: the server's commands from index `from` (repeats are skipped). */
  receive: (from: number, commands: readonly BattleCommand[]) => void;
}

export const useBattleStore = create<BattleStore>((set, get) => {
  let session: BattleSession | null = null;
  // A party fight: the server's commands waiting to be played, how many it has sent in all, and the intent sender.
  let party: { me: string; send: (intent: PartyIntent) => void; queue: BattleCommand[]; received: number; asked: boolean } | null = null;

  const controlOf = (): BattleControl | null => (session && party ? { me: party.me, humans: session.humans, autoUnits: [...session.autoUnits] } : null);
  const publish = () => {
    if (!session) return;
    set({ state: session.state, auto: session.auto, control: controlOf(), queued: party?.queue.length ?? 0 });
  };
  const act = (action: Parameters<typeof sessionAction>[1]): boolean => {
    if (party) {
      // A party fight: ask the server (once per turn beat); the move plays when its command comes back.
      if (!session || party.asked || party.queue.length > 0 || !isMyTurn(session.state, session.auto, controlOf())) return false;
      if (action.t !== "move" && action.t !== "skill" && action.t !== "wait") return false;
      party.asked = true;
      party.send(action.t === "move" ? { t: "move", to: action.to } : action.t === "skill" ? { t: "skill", slot: action.slot, target: action.target } : { t: "wait" });
      return true;
    }
    if (!session || !sessionAction(session, action)) return false;
    publish();
    return true;
  };

  return {
    state: null,
    builds: null,
    auto: false,
    seed: null,
    control: null,
    queued: 0,

    start: (a, b, opts = {}) => {
      party = null;
      session = startSession(a, b, opts);
      set({ state: session.state, builds: { A: a, B: b }, auto: false, seed: typeof opts.seed === "number" ? opts.seed : null, control: null, queued: 0 });
    },

    startParty: (a, b, opts, me, send) => {
      session = startSession(a, b, opts);
      party = { me, send, queue: [], received: 0, asked: false };
      set({ state: session.state, builds: { A: a, B: b }, auto: false, seed: typeof opts.seed === "number" ? opts.seed : null, control: controlOf(), queued: 0 });
    },

    receive: (from, commands) => {
      if (!party) return;
      const fresh = commands.slice(Math.max(0, party.received - from));
      if (from > party.received || fresh.length === 0) return;
      party.queue.push(...fresh);
      party.received += fresh.length;
      set({ queued: party.queue.length });
    },

    reset: () => { session = null; party = null; set({ state: null, builds: null, auto: false, seed: null, control: null, queued: 0 }); },

    setAuto: (on) => {
      if (party) {
        // A party fight: the server plays this player's unit for them (or stops).
        party.send({ t: "auto", on });
        return;
      }
      if (session) setSessionAuto(session, on);
      set({ auto: on });
    },

    move: (to) => act({ t: "move", to }),
    act: (slot, target) => act({ t: "skill", slot, target }),
    wait: () => act({ t: "wait" }),
    useItem: (itemId, name, effect, target) => act({ t: "item", itemId, name, effect, target }),
    flee: () => act({ t: "flee" }),
    step: () => {
      if (!session) return;
      if (party) {
        // A party fight: play the server's next command (none: waiting for a person).
        const next = party.queue.shift();
        if (!next) return;
        // No battle items in a party fight (the server never sends one).
        if (!applyCommand(session, next, () => null)) console.warn("[party] a command did not fit", next);
        party.asked = false;
        publish();
        return;
      }
      if (stepSession(session)) publish();
    },
    stepAll: () => {
      if (!session) return;
      if (party) { while (party.queue.length) get().step(); return; }
      stepSessionAll(session);
      publish();
    },
    commands: () => session?.commands ?? [],
  };
});
