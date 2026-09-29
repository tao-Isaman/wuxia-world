"use client";

import { create } from "zustand";
import { resolveCombatAction, type CombatAction } from "@/lib/game/combat-actions";
import type {
  BattleState,
  CharacterBuild,
  Side,
} from "@/lib/game";
import {
  consumeGauge,
  decrementCooldowns,
  gaugeRate,
  getArt,
  getMasteryMap,
  logLine,
  makeContext,
  makeInitialState,
  parseSlotId,
  peekReadyActor,
  resolveArtActive,
  resolveSkill,
  runAITurn,
  tickGauges,
  type BattleContext,
  type InitialStateOpts,
} from "@/lib/game";

interface BattleStore {
  state: BattleState | null;
  ctx: BattleContext | null;
  // Build references — kept so AI can read skill ids per slot.
  builds: Record<Side, CharacterBuild> | null;

  start: (a: CharacterBuild, b: CharacterBuild, opts?: InitialStateOpts) => void;
  reset: () => void;

  // Three.js scene update drives both gauge fill and delayed enemy actions.
  tick: (dtMs: number) => void;

  useSkill: (slotIdx: number) => void;
  useArtActive: () => void;
  useCombatAction: (action: CombatAction) => void;
  // Auto-plays both sides via AI, no animation, until battle ends.
  autoAdvance: () => void;
}

// How long to pause once B's gauge fills, before the AI action resolves.
// Gives the player a moment to register "B is about to attack".
const ENEMY_ACTION_DELAY_MS = 400;

// Mutate-then-publish pattern: pure logic mutates the BattleState in place,
// then the store calls set({ state: { ...state } }) so subscribers re-render
// via reference change.

// Drains all immediately-ready turns by consuming gauges, decrementing CDs,
// and setting phase. Does NOT execute AI — that's deferred so the UI can
// show a brief "enemy is acting" state before the action resolves.
function drainToActor(state: BattleState): void {
  if (state.winner || state.phase === "over") return;
  const actor = peekReadyActor(state);
  if (!actor) {
    state.phase = "filling";
    return;
  }
  consumeGauge(state, actor);
  decrementCooldowns(state, actor);
  state.phase = actor === "A" ? "player" : "enemy";
}

export const useBattleStore = create<BattleStore>((set, get) => {
  // Elapsed scene time cannot leak into a replacement battle, unlike timers.
  let enemyElapsedMs = 0;

  return {
    state: null,
    ctx: null,
    builds: null,

    start: (a, b, opts) => {
      enemyElapsedMs = 0;
      const ctx = makeContext(a, b);
      const state = makeInitialState(a, b, opts);
      logLine(state, "lS", "━━ เริ่มการต่อสู้ ━━");
      if (typeof opts?.hpA === "number" && state.hA < state.dA.HP) {
        logLine(state, "lS", `A เริ่มต้นด้วย HP ${state.hA}/${state.dA.HP}`);
      }
      if (typeof opts?.mpA === "number" && state.mpA < state.dA.MP) {
        logLine(state, "lS", `A เริ่มต้นด้วย MP ${state.mpA}/${state.dA.MP}`);
      }
      for (const [w, v] of Object.entries(getMasteryMap(a.skillIds, a.skillLevels))) {
        logLine(state, "lS", `A: ${w} ×${(1 + (v / 200) * 0.5).toFixed(2)}`);
      }
      const aA = getArt(a.artId);
      const aB = getArt(b.artId);
      if (aA.id !== "none") logLine(state, "lS", `A IA: ${aA.n} ขั้น${a.artLevel} HP+${aA.hL * a.artLevel} MP+${aA.mL * a.artLevel}`);
      if (aB.id !== "none") logLine(state, "lS", `B IA: ${aB.n} ขั้น${b.artLevel} HP+${aB.hL * b.artLevel} MP+${aB.mL * b.artLevel}`);
      state.phase = "filling";
      set({ state: { ...state }, ctx, builds: { A: a, B: b } });
    },

    reset: () => { enemyElapsedMs = 0; set({ state: null, ctx: null, builds: null }); },

    tick: (dtMs) => {
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      // Cast hold: pause the ATB while the most-recent skill / art active
      // animation is still playing. Once Date.now() passes castEndsAt,
      // the gauge resumes filling — this is what makes "play animation
      // until done, then count turn" feel right.
      if (state.castEndsAt && Date.now() < state.castEndsAt) return;
      const delta = Number.isFinite(dtMs) ? Math.max(0, Math.min(dtMs, 100)) : 0;
      if (state.phase === "enemy") {
        enemyElapsedMs += delta;
        if (enemyElapsedMs < ENEMY_ACTION_DELAY_MS) return;
        enemyElapsedMs = 0;
        const acted = runAITurn(state, "B", ctx, builds.B.skillIds);
        if (!state.winner) {
          if (acted) drainToActor(state);
          else state.phase = "filling";
        }
        set({ state: { ...state } });
        return;
      }
      if (state.phase !== "filling") return;
      enemyElapsedMs = 0;
      tickGauges(state, delta);
      drainToActor(state);
      set({ state: { ...state } });
    },

    useSkill: (slotIdx) => {
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      if (state.phase !== "player") return;
      // Block input while a cast animation is still playing.
      if (state.castEndsAt && Date.now() < state.castEndsAt) return;
      const raw = builds.A.skillIds[slotIdx];
      if (!raw || state.cd.A[slotIdx] > 0) return;
      const info = parseSlotId(raw);
      if (!info) return;
      if (info.kind === "skill") {
        resolveSkill(state, "A", slotIdx, info.skill.id, ctx);
      } else {
        resolveArtActive(state, "A", ctx, { slotIdx, artId: info.art.id });
      }
      if (!state.winner) drainToActor(state);
      set({ state: { ...state } });
      enemyElapsedMs = 0;
    },

    useArtActive: () => {
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      if (state.phase !== "player") return;
      if (state.castEndsAt && Date.now() < state.castEndsAt) return;
      resolveArtActive(state, "A", ctx);
      if (!state.winner) drainToActor(state);
      set({ state: { ...state } });
      enemyElapsedMs = 0;
    },

    useCombatAction: (action) => {
      const { state, ctx } = get();
      if (!state || !ctx || !resolveCombatAction(state, ctx, action)) return;
      if (!state.winner) drainToActor(state);
      enemyElapsedMs = 0;
      set({ state: { ...state } });
    },

    autoAdvance: () => {
      enemyElapsedMs = 0;
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      let safety = 250;
      while (safety-- > 0 && !state.winner && state.phase !== "over") {
        if (state.gA < 100 && state.gB < 100) {
          const tA = (100 - state.gA) / gaugeRate(state.dA.Spd);
          const tB = (100 - state.gB) / gaugeRate(state.dB.Spd);
          tickGauges(state, Math.min(tA, tB));
        }
        const actor = peekReadyActor(state);
        if (!actor) break;
        consumeGauge(state, actor);
        decrementCooldowns(state, actor);
        const acted = runAITurn(state, actor, ctx, builds[actor].skillIds);
        if (state.winner) break;
        if (!acted) break;
      }
      state.phase = state.winner ? "over" : "filling";
      set({ state: { ...state } });
    },
  };
});
