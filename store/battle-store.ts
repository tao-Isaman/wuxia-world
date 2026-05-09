"use client";

import { create } from "zustand";
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

  // UI animation tick — called from a requestAnimationFrame loop while
  // `state.phase === "filling"`. dtMs is real-time milliseconds since last frame.
  tick: (dtMs: number) => void;

  useSkill: (slotIdx: number) => void;
  useArtActive: () => void;
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
  // Schedules B's AI action after ENEMY_ACTION_DELAY_MS.
  // Recurses to chain consecutive B turns (each with its own delay).
  // Honors `castEndsAt` — if a cast animation is still playing, defer
  // until it finishes so the player sees the full animation before B
  // attacks.
  const scheduleEnemyAction = () => {
    const compute = () => {
      const s = get();
      const ce = s.state?.castEndsAt ?? 0;
      const remain = Math.max(0, ce - Date.now());
      return Math.max(ENEMY_ACTION_DELAY_MS, remain);
    };
    setTimeout(() => {
      const s = get();
      if (!s.state || !s.ctx || !s.builds) return;
      if (s.state.winner || s.state.phase !== "enemy") return;
      const st = s.state;
      const acted = runAITurn(st, "B", s.ctx, s.builds.B.skillIds);
      if (!st.winner) {
        if (!acted) {
          st.phase = "filling";
        } else {
          drainToActor(st);
        }
      }
      set({ state: { ...st } });
      if (!st.winner && st.phase === "enemy") scheduleEnemyAction();
    }, compute());
  };

  // After any state mutation, if we landed on "enemy" phase, schedule the AI.
  const maybeScheduleEnemy = () => {
    const s = get();
    if (s.state?.phase === "enemy" && !s.state.winner) scheduleEnemyAction();
  };

  return {
    state: null,
    ctx: null,
    builds: null,

    start: (a, b, opts) => {
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

    reset: () => set({ state: null, ctx: null, builds: null }),

    tick: (dtMs) => {
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      if (state.phase !== "filling") return;
      // Cast hold: pause the ATB while the most-recent skill / art active
      // animation is still playing. Once Date.now() passes castEndsAt,
      // the gauge resumes filling — this is what makes "play animation
      // until done, then count turn" feel right.
      if (state.castEndsAt && Date.now() < state.castEndsAt) return;
      tickGauges(state, dtMs);
      drainToActor(state);
      set({ state: { ...state } });
      if (state.phase === "enemy") scheduleEnemyAction();
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
      maybeScheduleEnemy();
    },

    useArtActive: () => {
      const { state, ctx, builds } = get();
      if (!state || !ctx || !builds || state.winner) return;
      if (state.phase !== "player") return;
      if (state.castEndsAt && Date.now() < state.castEndsAt) return;
      resolveArtActive(state, "A", ctx);
      if (!state.winner) drainToActor(state);
      set({ state: { ...state } });
      maybeScheduleEnemy();
    },

    autoAdvance: () => {
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
