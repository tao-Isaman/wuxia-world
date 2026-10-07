// ─── Duel view: drive the 1v1 battle.ts resolver for one grid pair ────
// Every skill / art / passive keeps its exact numbers because the grid never
// reimplements them: it builds a BattleState with A = actor and B = target,
// shares the units' status / cooldown objects by reference, runs battle.ts,
// then copies the scalar results (hp, mp, counters, log) back onto the units.

import { makeContext, resolveArtActive, resolveSkill, type BattleContext } from "../battle";
import { tickSideEffects } from "../effects";
import type { CharacterBuild, LogLine, MeridianProc } from "../types";
import type { DuelView, GridUnit } from "./types";

// makeContext is costly (combined stats, masteries, conflict); cache per build pair.
const ctxCache = new WeakMap<CharacterBuild, WeakMap<CharacterBuild, BattleContext>>();

/** Battle context for actor `a` vs target `b`, named after the grid units (dedup suffixes). */
export function pairContext(a: GridUnit, b: GridUnit): BattleContext {
  let inner = ctxCache.get(a.build);
  if (!inner) ctxCache.set(a.build, (inner = new WeakMap()));
  let ctx = inner.get(b.build);
  if (!ctx) inner.set(b.build, (ctx = makeContext(a.build, b.build)));
  return { ...ctx, names: { A: a.name, B: b.name } };
}

export function makeDuelView(a: GridUnit, b: GridUnit, turn: number): DuelView {
  return {
    dA: a.derived, dB: b.derived,
    hA: a.hp, hB: b.hp, mpA: a.mp, mpB: b.mp,
    gA: 0, gB: 0,
    turn,
    log: [],
    winner: null,
    phase: "player",
    st: { A: a.status, B: b.status },
    cd: { A: a.cd, B: b.cd },
    iaCD: { A: a.iaCD, B: b.iaCD },
    skillUses: { A: {}, B: {} },
    artUses: { A: {}, B: {} },
    hitsReceived: { A: 0, B: 0 },
  };
}

const merge = (into: Record<string, number>, from: Record<string, number>) => {
  for (const [id, n] of Object.entries(from)) into[id] = (into[id] ?? 0) + n;
};

/** Copy a resolved view back onto its two units. `a === b` is allowed (tick views). */
export function commitDuelView(view: DuelView, a: GridUnit, b: GridUnit): void {
  if (b !== a) {
    b.hp = view.hB; b.mp = view.mpB;
    b.status = view.st.B; b.cd = view.cd.B; b.iaCD = view.iaCD.B;
    merge(b.skillUses, view.skillUses.B); merge(b.artUses, view.artUses.B);
    b.hitsReceived += view.hitsReceived.B;
  }
  a.hp = view.hA; a.mp = view.mpA;
  a.status = view.st.A; a.cd = view.cd.A; a.iaCD = view.iaCD.A;
  merge(a.skillUses, view.skillUses.A); merge(a.artUses, view.artUses.A);
  a.hitsReceived += view.hitsReceived.A;
}

// battle.ts' 1v1-only lines: "━━ X ชนะ! ━━" and the "A:hp · B:hp" footer.
const isDuelOnlyLine = (l: LogLine) => l.txt.startsWith("━━") || l.txt.startsWith("&nbsp;A:");
export const gridLogLines = (view: DuelView): LogLine[] => view.log.filter((l) => !isDuelOnlyLine(l));

export interface DuelCast {
  view: DuelView;
  /** False when battle.ts refused (art on cooldown / short of MP). */
  ok: boolean;
}

/** Resolve one skill / art slot from `a` onto `b` (tick already done at turn start). `turn` = display turn. */
export function resolveDuel(
  a: GridUnit, b: GridUnit, turn: number,
  slot: { kind: "skill" | "art"; id: string; slotIdx: number },
  secondary: boolean,
): DuelCast {
  // battle.ts bumps view.turn on a primary cast, so start one below the display turn.
  const view = makeDuelView(a, b, secondary ? turn : turn - 1);
  const ctx = pairContext(a, b);
  let ok = true;
  // The engine rolls a blind once per action (doSkill), never per target.
  const opts = { tick: false, secondary, blindChecked: true };
  if (slot.kind === "skill") resolveSkill(view, "A", slot.slotIdx, slot.id, ctx, opts);
  else ok = resolveArtActive(view, "A", ctx, { slotIdx: slot.slotIdx, artId: slot.id, ...opts });
  commitDuelView(view, a, b);
  return { view, ok };
}

/** A view's meridian triggers with the unit each landed on (A = actor, B = target). */
export function viewProcs(view: DuelView, a: GridUnit, b: GridUnit): (Omit<MeridianProc, "side"> & { unitId: string })[] {
  return (view.procs ?? []).map(({ side, ...p }) => ({ ...p, unitId: side === "A" ? a.id : b.id }));
}

/** Tick one unit's own status (poison / burn / durations / regen). Returns the log lines. */
export function tickUnit(
  u: GridUnit, turn: number,
  onProc?: (p: Omit<MeridianProc, "side"> & { unitId: string }) => void,
): LogLine[] {
  const view = makeDuelView(u, u, turn);
  const ctx = pairContext(u, u);
  tickSideEffects(view, "A", ctx.equipBonus.A.hp_regen, ctx.names, ctx.artIds.A);
  commitDuelView(view, u, u);
  if (onProc) for (const p of viewProcs(view, u, u)) onProc(p);
  return view.log;
}
