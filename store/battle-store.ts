"use client";

// Battle store — the grid (tactics) battle.
//
// Wraps the pure engine in lib/game/grid (see docs/grid-combat.md, "Store
// API"). Every change works on a fresh copy of the state and then publishes
// it, so React subscribers see new references for the state, `units`,
// `events` and `log` whenever anything changes.
//
// Pacing: the store never runs a timer. The renderer calls `step()` each time
// it has finished animating the latest events; one call does at most one
// visible thing (start the next turn and/or one AI move or action). When
// `isPlayerTurn(state, auto)` is true the store waits for `move` / `act` /
// `wait` / `flee`. UI selection state (picked skill, hovered tile) lives in
// the UI, not here.

import { create } from "zustand";
import type { CharacterBuild } from "@/lib/game/types";
import { getArt, getMasteryMap, parseSlotId } from "@/lib/game";
import {
  activeUnit,
  aimableFor,
  applyAction,
  beginNextTurn,
  createGridBattle,
  manhattan,
  planTurn,
  reachableFor,
  sameCell,
  targetsFor,
  type Cell,
  type GridAction,
  type GridBattleState,
  type GridUnit,
  type TurnPlan,
  type UnitLook,
  type UnitSpec,
} from "@/lib/game/grid";

export interface BattleStartOpts {
  /** Leader's starting HP / MP (world carryover); defaults to full. */
  hpA?: number;
  mpA?: number;
  /** Extra enemy units (pack members) after the primary opponent. */
  enemies?: UnitSpec[];
  /** Looks for the leader (A) and the primary enemy (B). */
  looks?: { A: UnitLook; B: UnitLook };
  /** Impassable board cells. */
  blocked?: Cell[];
}

interface BattleStore {
  state: GridBattleState | null;
  /** Leader + primary enemy builds. */
  builds: { A: CharacterBuild; B: CharacterBuild } | null;
  /** อัตโนมัติ: the AI also plays the player's side. */
  auto: boolean;

  start: (a: CharacterBuild, b: CharacterBuild, opts?: BattleStartOpts) => void;
  reset: () => void;
  setAuto: (on: boolean) => void;

  /** Player's active unit walks to `to` (before acting). */
  move: (to: Cell) => boolean;
  /** Player's active unit uses skill / art slot `slot` aimed at `target`. */
  act: (slot: number, target: Cell) => boolean;
  /** Player's active unit ends its turn. */
  wait: () => boolean;
  /** Leader tries to retreat (fails → turn spent). */
  flee: () => boolean;
  /** Advance one visible beat of non-player play (see header). */
  step: () => void;
  /** Tests / debug: step until the player must act or the battle ends. */
  stepAll: () => void;

  // DEPRECATED: removed once the grid UI lands (old ATB arena / runtime).
  tick: (dtMs: number) => void;
  // DEPRECATED: removed once the grid UI lands.
  useSkill: (slotIdx: number) => void;
  // DEPRECATED: removed once the grid UI lands.
  useArtActive: () => void;
  // DEPRECATED: removed once the grid UI lands.
  useCombatAction: (action: "guard" | "recover" | "flee") => void;
  // DEPRECATED: removed once the grid UI lands.
  autoAdvance: () => void;
}

export const PLAYER_UNIT = "A";
export const PRIMARY_ENEMY_UNIT = "B";
const DEFAULT_LOOKS: { A: UnitLook; B: UnitLook } = {
  A: { kind: "character", characterId: "m1" },
  B: { kind: "character", characterId: "bandit" },
};
/** Safety bound for stepAll (each step makes progress, so this is never hit in practice). */
const STEP_ALL_LIMIT = 5000;

/** Whether the AI plays this unit right now (enemies always; allies when auto is on). */
export function aiControls(unit: GridUnit, auto: boolean): boolean {
  return unit.team === "enemy" || auto;
}

/** True when the battle is waiting for the player's input (their unit holds the turn, auto off). */
export function isPlayerTurn(state: GridBattleState | null, auto: boolean): boolean {
  if (!state || state.phase === "over") return false;
  const u = activeUnit(state);
  return !!u && !aiControls(u, auto);
}

// ─── Copy-on-write ─────────────────────────────────────────────────────
function cloneUnit(u: GridUnit): GridUnit {
  return {
    ...u,
    pos: { ...u.pos },
    status: {
      ...u.status,
      buffs: u.status.buffs.map((b) => ({ ...b })),
      debuffs: u.status.debuffs.map((d) => ({ ...d })),
    },
    cd: [...u.cd],
    skillUses: { ...u.skillUses },
    artUses: { ...u.artUses },
  };
}

/** Deep-enough copy that the engine can mutate it without touching the published state. */
export function cloneBattle(s: GridBattleState): GridBattleState {
  return {
    ...s,
    blocked: [...s.blocked],
    units: s.units.map(cloneUnit),
    log: [...s.log],
    events: [...s.events],
    skillUses: { A: { ...s.skillUses.A }, B: { ...s.skillUses.B } },
    artUses: { A: { ...s.artUses.A }, B: { ...s.artUses.B } },
    hitsReceived: { ...s.hitsReceived },
  };
}

// ─── Deprecated shim helpers (old one-button arena) ────────────────────
// Aim `slot` at the closest cell that hits something; walk toward the
// nearest foe first when nothing is in range.
function autoAim(state: GridBattleState, u: GridUnit, slot: number): Cell | null {
  const cells = aimableFor(state, u.id, slot)
    .filter((c) => targetsFor(state, u.id, slot, c).length > 0)
    .sort((a, b) => manhattan(u.pos, a) - manhattan(u.pos, b));
  return cells[0] ?? null;
}

function stepToward(state: GridBattleState, u: GridUnit): Cell | null {
  const foes = state.units.filter((o) => o.alive && o.team !== u.team);
  if (!foes.length) return null;
  let best: Cell | null = null, bestD = Infinity;
  for (const path of reachableFor(state, u.id).values()) {
    const c = path[path.length - 1];
    const d = Math.min(...foes.map((f) => manhattan(c, f.pos)));
    if (d < bestD && d >= 1) { bestD = d; best = c; }
  }
  return best && !sameCell(best, u.pos) ? best : null;
}

export const useBattleStore = create<BattleStore>((set, get) => {
  // The AI plans a whole turn up front; after the move beat, its action
  // is replayed on the next step() so both animate separately.
  let planned: { unitId: string; turn: number; action: TurnPlan["action"] } | null = null;
  let tickMs = 0;

  const publish = (state: GridBattleState) => set({ state });

  /** Apply one player action for the active unit if it is the player's turn. */
  const playerAction = (action: GridAction): boolean => {
    const { state, auto } = get();
    if (!state || !isPlayerTurn(state, auto)) return false;
    const next = cloneBattle(state);
    const u = activeUnit(next)!;
    if (!applyAction(next, u.id, action)) return false;
    planned = null;
    publish(next);
    return true;
  };

  const step = () => {
    const { state, auto } = get();
    if (!state || state.phase === "over") return;
    const next = cloneBattle(state);
    let u = activeUnit(next);
    if (!u) {
      u = beginNextTurn(next);
      planned = null;
      // Player's turn (or battle over): publish the new turn and wait.
      if (!u || !aiControls(u, auto)) { publish(next); return; }
    } else if (!aiControls(u, auto)) {
      return; // waiting for the player
    }

    // One AI beat: the move, or (after moving / when not moving) the action.
    if (next.phase === "turn") {
      const plan = planTurn(next, u.id);
      if (plan.move && !sameCell(plan.move, u.pos) && applyAction(next, u.id, { t: "move", to: plan.move })) {
        planned = { unitId: u.id, turn: next.turn, action: plan.action };
        publish(next);
        return;
      }
      if (!applyAction(next, u.id, plan.action)) applyAction(next, u.id, { t: "wait" });
    } else {
      const action = planned && planned.unitId === u.id && planned.turn === next.turn
        ? planned.action
        : planTurn(next, u.id).action;
      if (!applyAction(next, u.id, action)) applyAction(next, u.id, { t: "wait" });
    }
    planned = null;
    publish(next);
  };

  const stepAll = () => {
    for (let i = 0; i < STEP_ALL_LIMIT; i++) {
      const before = get().state;
      if (!before || before.phase === "over" || isPlayerTurn(before, get().auto)) return;
      step();
      if (get().state === before) return; // no progress possible
    }
  };

  return {
    state: null,
    builds: null,
    auto: false,

    start: (a, b, opts = {}) => {
      planned = null;
      tickMs = 0;
      const looks = opts.looks ?? DEFAULT_LOOKS;
      const specs: UnitSpec[] = [
        { id: PLAYER_UNIT, team: "ally", build: a, look: looks.A, hp: opts.hpA, mp: opts.mpA, leader: true },
        { id: PRIMARY_ENEMY_UNIT, team: "enemy", build: b, look: looks.B },
        ...(opts.enemies ?? []).map((e) => ({ ...e, team: "enemy" as const, leader: false })),
      ];
      const state = createGridBattle(specs, { blocked: opts.blocked });
      const leader = state.units[0];
      const log = (txt: string) => state.log.push({ cls: "lS", txt });
      log("━━ เริ่มการต่อสู้ ━━");
      if (typeof opts.hpA === "number" && leader.hp < leader.derived.HP) log(`A เริ่มต้นด้วย HP ${leader.hp}/${leader.derived.HP}`);
      if (typeof opts.mpA === "number" && leader.mp < leader.derived.MP) log(`A เริ่มต้นด้วย MP ${leader.mp}/${leader.derived.MP}`);
      for (const [w, v] of Object.entries(getMasteryMap(a.skillIds, a.skillLevels))) {
        log(`A: ${w} ×${(1 + (v / 200) * 0.5).toFixed(2)}`);
      }
      const aA = getArt(a.artId), aB = getArt(b.artId);
      if (aA.id !== "none") log(`A IA: ${aA.n} ขั้น${a.artLevel} HP+${aA.hL * a.artLevel} MP+${aA.mL * a.artLevel}`);
      if (aB.id !== "none") log(`B IA: ${aB.n} ขั้น${b.artLevel} HP+${aB.hL * b.artLevel} MP+${aB.mL * b.artLevel}`);
      const extra = state.units.length - 2;
      if (extra > 0) log(`ฝ่ายศัตรูมีพวกอีก ${extra} คน`);
      set({ state: cloneBattle(state), builds: { A: a, B: b } });
    },

    reset: () => { planned = null; tickMs = 0; set({ state: null, builds: null, auto: false }); },

    setAuto: (on) => set({ auto: on }),

    move: (to) => playerAction({ t: "move", to }),
    act: (slot, target) => playerAction({ t: "skill", slot, target }),
    wait: () => playerAction({ t: "wait" }),
    flee: () => playerAction({ t: "flee" }),
    step,
    stepAll,

    // ── DEPRECATED shims: removed once the grid UI lands ──────────────
    tick: (dtMs) => {
      const dt = Number.isFinite(dtMs) ? Math.max(0, Math.min(dtMs, 100)) : 0;
      tickMs += dt;
      if (tickMs < 400) return;
      tickMs = 0;
      step();
    },
    useSkill: (slotIdx) => {
      const { state, auto } = get();
      if (!state || !isPlayerTurn(state, auto)) return;
      const u = activeUnit(state)!;
      let aim = autoAim(state, u, slotIdx);
      if (!aim && state.phase === "turn") {
        const to = stepToward(state, u);
        if (to && get().move(to)) {
          const s2 = get().state!;
          aim = autoAim(s2, activeUnit(s2)!, slotIdx);
        }
      }
      if (!aim || !get().act(slotIdx, aim)) get().wait();
    },
    useArtActive: () => {
      const { builds } = get();
      const slot = builds?.A.skillIds.findIndex((raw) => parseSlotId(raw ?? "")?.kind === "art") ?? -1;
      if (slot >= 0) get().useSkill(slot);
    },
    useCombatAction: (action) => { if (action === "flee") get().flee(); else get().wait(); },
    autoAdvance: () => {
      const was = get().auto;
      set({ auto: true });
      stepAll();
      set({ auto: was });
    },
  };
});
