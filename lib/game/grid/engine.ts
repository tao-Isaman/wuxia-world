// ─── Grid combat engine (pure) ────────────────────────────────────────
// Per-unit ATB turn order, movement, aiming and action resolution for the
// tactics board. Damage / effects run through battle.ts via duel views (see
// duel.ts); nothing here rerolls or re-tunes a number. Mutates the state it
// is given (callers clone if they need immutability). See docs/grid-combat.md.

import { gaugeRate, resolveArtActive } from "../battle";
import { fleeChance } from "../combat-actions";
import { applySelfEffect, escapeBattleText } from "../effects";
import { deriveAll } from "../derive";
import { parseSlotId } from "../slots";
import type { LogLine } from "../types";
import { aimCells, areaCells, facingToward, manhattan, reachableCells, type Board } from "./geometry";
import { slotGrid } from "./skill-grid";
import {
  GRID_DEFAULT_COLS,
  GRID_DEFAULT_ROWS,
  cellKey,
  sameCell,
  type Cell,
  type GridAction,
  type GridBattleOptions,
  type GridBattleState,
  type GridEvent,
  type GridUnit,
  type TargetResult,
  type UnitSpec,
} from "./types";
import { commitDuelView, gridLogLines, makeDuelView, pairContext, resolveDuel, tickUnit } from "./duel";

export const GRID_ATB_THRESHOLD = 100;
const LOG_CAP = 100;
const EVENT_CAP = 200;
/** Guard for beginNextTurn's skip loop (stuns / DoT deaths). */
const MAX_SKIPS = 500;

export const moveRangeFor = (spd: number): number => Math.max(3, Math.min(6, 3 + Math.floor(spd / 80)));

// ─── Small helpers ────────────────────────────────────────────────────
export const boardOf = (state: GridBattleState): Board =>
  ({ cols: state.cols, rows: state.rows, blocked: new Set(state.blocked) });
export const unitById = (state: GridBattleState, id: string): GridUnit | undefined =>
  state.units.find((u) => u.id === id);
export const activeUnit = (state: GridBattleState): GridUnit | null =>
  (state.activeId && state.phase !== "over" ? unitById(state, state.activeId) ?? null : null);
export const isOver = (state: GridBattleState): boolean => state.phase === "over";

const living = (state: GridBattleState) => state.units.filter((u) => u.alive);
const foesOf = (state: GridBattleState, u: GridUnit) => state.units.filter((o) => o.alive && o.team !== u.team);
const leaderOf = (state: GridBattleState) =>
  state.units.find((u) => u.leader) ?? state.units.find((u) => u.team === "ally");
const firstEnemy = (state: GridBattleState) => state.units.find((u) => u.team === "enemy");
const nm = (u: GridUnit) => escapeBattleText(u.name);
const cls = (u: GridUnit): LogLine["cls"] => (u.team === "ally" ? "lA" : "lB");

function pushLog(state: GridBattleState, lines: LogLine | LogLine[]): void {
  for (const l of Array.isArray(lines) ? lines : [lines]) state.log.push(l);
  if (state.log.length > LOG_CAP) state.log.splice(0, state.log.length - LOG_CAP);
}

// Distributive Omit so each GridEvent variant keeps its own fields.
type EventInput = GridEvent extends infer E ? (E extends GridEvent ? Omit<E, "seq"> : never) : never;
function pushEvent(state: GridBattleState, ev: EventInput): void {
  const seq = (state.events[state.events.length - 1]?.seq ?? 0) + 1;
  state.events.push({ ...ev, seq } as GridEvent);
  if (state.events.length > EVENT_CAP) state.events.splice(0, state.events.length - EVENT_CAP);
}

/** Effective ATB speed: derived Spd + active buff_spd, floor 1 (same rule as battle.ts). */
export function unitSpd(u: GridUnit): number {
  let bonus = 0;
  for (const b of u.status.buffs) if (b.t === "buff_spd") bonus += b.v;
  return Math.max(1, u.derived.Spd + bonus);
}

// ─── Creation ─────────────────────────────────────────────────────────
/**
 * Default starting cells, fanned around the middle row. The front lines stand
 * 3 tiles apart (columns 3 and 6 on a 10-wide board): with the minimum move of 3
 * whoever acts first can close in and strike on turn one, so first-mover
 * advantage matches the old 1v1 duel instead of flipping to the second mover.
 */
function layoutCells(team: "ally" | "enemy", cols: number, rows: number, taken: Set<string>): Cell[] {
  const front = team === "ally" ? Math.max(1, Math.floor(cols / 2) - 2) : Math.min(cols - 2, Math.ceil(cols / 2) + 1);
  const back = team === "ally" ? front - 1 : front + 1;
  const mid = Math.floor(rows / 2);
  const cells: { c: Cell; k: number }[] = [];
  for (let y = 0; y < rows; y++) {
    cells.push({ c: { x: front, y }, k: Math.abs(y - mid) });
    cells.push({ c: { x: back, y }, k: Math.abs(y - mid) + 1.5 });
  }
  return cells.sort((a, b) => a.k - b.k || a.c.y - b.c.y).map((e) => e.c).filter((c) => !taken.has(cellKey(c)));
}

export function createGridBattle(specs: UnitSpec[], opts: GridBattleOptions = {}): GridBattleState {
  const cols = opts.cols ?? GRID_DEFAULT_COLS;
  const rows = opts.rows ?? GRID_DEFAULT_ROWS;
  const blocked = (opts.blocked ?? []).map(cellKey);
  const taken = new Set(blocked);
  for (const s of specs) if (s.pos) taken.add(cellKey(s.pos));

  const seen = new Map<string, number>();
  const hasLeader = specs.some((s) => s.leader);
  let leaderSet = false;
  const units: GridUnit[] = specs.map((s) => {
    const n = (seen.get(s.build.name) ?? 0) + 1;
    seen.set(s.build.name, n);
    const derived = deriveAll(s.build);
    const leader = !leaderSet && s.team === "ally" && (hasLeader ? !!s.leader : true);
    if (leader) leaderSet = true;
    let pos = s.pos;
    if (!pos) {
      pos = layoutCells(s.team, cols, rows, taken)[0]
        ?? fallbackCell(cols, rows, taken, s.team);
      taken.add(cellKey(pos));
    }
    return {
      id: s.id, team: s.team, name: n > 1 ? `${s.build.name} ${n}` : s.build.name,
      build: s.build, look: s.look, leader, derived,
      hp: Math.max(1, Math.min(derived.HP, s.hp ?? derived.HP)),
      mp: Math.max(0, Math.min(derived.MP, s.mp ?? derived.MP)),
      pos: { ...pos }, facing: s.team === "ally" ? "right" : "left",
      status: { buffs: [], debuffs: [], stk: 0, stkV: 0 },
      cd: new Array(s.build.skillIds.length).fill(0) as number[], iaCD: 0,
      gauge: 0, move: moveRangeFor(derived.Spd), alive: true,
      skillUses: {}, artUses: {}, hitsReceived: 0,
    };
  });

  const state: GridBattleState = {
    cols, rows, blocked, units,
    activeId: null, phase: "start", turn: 0, log: [], events: [], winnerTeam: null,
    winner: null, hA: 0, mpA: 0, hB: 0, mpB: 0,
    skillUses: { A: {}, B: {} }, artUses: { A: {}, B: {} }, hitsReceived: { A: 0, B: 0 },
  };
  refreshCompat(state);
  return state;
}

// Any free cell, scanning from the team's own edge inward.
function fallbackCell(cols: number, rows: number, taken: Set<string>, team: "ally" | "enemy"): Cell {
  for (let i = 0; i < cols; i++) {
    const x = team === "ally" ? i : cols - 1 - i;
    for (let y = 0; y < rows; y++) if (!taken.has(cellKey({ x, y }))) return { x, y };
  }
  throw new Error("createGridBattle: board is full");
}

// ─── Compat mirror + victory ──────────────────────────────────────────
function refreshCompat(state: GridBattleState): void {
  const a = leaderOf(state), b = firstEnemy(state);
  if (a) {
    state.hA = a.hp; state.mpA = a.mp;
    state.skillUses.A = { ...a.skillUses }; state.artUses.A = { ...a.artUses };
    state.hitsReceived.A = a.hitsReceived;
  }
  if (b) {
    state.hB = b.hp; state.mpB = b.mp;
    state.skillUses.B = { ...b.skillUses }; state.artUses.B = { ...b.artUses };
    state.hitsReceived.B = b.hitsReceived;
  }
}

/** Mark the fallen; end the battle (log + "end" event) when a team is wiped. Returns true when over. */
function settle(state: GridBattleState): boolean {
  for (const u of state.units) {
    if (u.alive && u.hp <= 0) {
      u.alive = false; u.hp = 0;
      pushLog(state, { cls: "lS", txt: `&nbsp;✝ ${nm(u)} ล้มลง` });
    }
  }
  if (state.phase === "over") return true;
  const allies = state.units.some((u) => u.alive && u.team === "ally");
  const enemies = state.units.some((u) => u.alive && u.team === "enemy");
  if (allies && enemies) return false;
  const winner = !enemies ? "ally" : "enemy";
  state.phase = "over";
  state.activeId = null;
  state.winnerTeam = winner;
  state.winner = winner === "ally" ? "A" : "B";
  pushLog(state, { cls: "lS", txt: `━━ ${winner === "ally" ? "ฝ่ายเราชนะ" : "ฝ่ายศัตรูชนะ"}! (${state.turn} ตา) ━━` });
  pushEvent(state, { t: "end", winner, escaped: false });
  return true;
}

/** Close the active unit's turn (state.turn was bumped when its action started). */
function endTurn(state: GridBattleState): void {
  if (state.phase !== "over") { state.activeId = null; state.phase = "start"; }
  refreshCompat(state);
}

// ─── ATB ──────────────────────────────────────────────────────────────
interface Gauge { u: GridUnit; g: number; spd: number; order: number }

// Jump every gauge to the moment the first one reaches 100; returns the actor (not yet consumed).
function advanceGauges(gs: Gauge[]): Gauge {
  const time = (x: Gauge) => Math.max(0, (GRID_ATB_THRESHOLD - x.g) / gaugeRate(x.spd));
  const dt = Math.min(...gs.map(time));
  for (const x of gs) {
    const due = time(x) <= dt;
    x.g += gaugeRate(x.spd) * dt;
    // Float rounding can land a hair under 100; whoever was due must act.
    if (due) x.g = Math.max(x.g, GRID_ATB_THRESHOLD);
  }
  const ready = gs.filter((x) => x.g >= GRID_ATB_THRESHOLD);
  ready.sort((a, b) => b.g - a.g || (a.u.team === b.u.team ? 0 : a.u.team === "ally" ? -1 : 1) || a.order - b.order);
  return ready[0];
}

const gaugesOf = (state: GridBattleState): Gauge[] =>
  state.units.map((u, order) => ({ u, g: u.gauge, spd: unitSpd(u), order })).filter((x) => x.u.alive);

/** Forecast the next `count` actors (active unit first). Pure: gauges are copied. */
export function predictOrder(state: GridBattleState, count: number): string[] {
  if (state.phase === "over" || count <= 0) return [];
  const out: string[] = [];
  const active = activeUnit(state);
  if (active) out.push(active.id);
  const gs = gaugesOf(state);
  if (!gs.length) return out;
  while (out.length < count) {
    const next = advanceGauges(gs);
    next.g = Math.max(0, next.g - GRID_ATB_THRESHOLD);
    out.push(next.u.id);
  }
  return out;
}

/**
 * Advance ATB to the next ready living unit, tick its own effects and
 * cooldowns, and hand it the turn (phase "turn"). Stunned units lose the turn
 * ("stunned" event) and the loop continues. Returns the active unit, or null
 * when the battle is over. Idempotent while a unit already holds the turn.
 */
export function beginNextTurn(state: GridBattleState): GridUnit | null {
  if (state.phase === "over") return null;
  const held = activeUnit(state);
  if (held && (state.phase === "turn" || state.phase === "moved")) return held;
  for (let guard = 0; guard < MAX_SKIPS; guard++) {
    const gs = gaugesOf(state);
    const next = advanceGauges(gs);
    for (const x of gs) x.u.gauge = x.g;
    const u = next.u;
    u.gauge = Math.max(0, u.gauge - GRID_ATB_THRESHOLD);

    pushLog(state, tickUnit(u, state.turn));
    u.cd = u.cd.map((v) => Math.max(0, v - 1));
    u.iaCD = Math.max(0, u.iaCD - 1);
    if (settle(state)) { refreshCompat(state); return null; }
    if (!u.alive) continue;

    if (u.status.debuffs.some((d) => d.t === "stun" && d.u > 0)) {
      state.turn++;
      pushLog(state, { cls: cls(u), txt: `[${state.turn}] ${nm(u)} <span style="color:#AAA">ถูกสตัน — ข้ามตา!</span>` });
      pushEvent(state, { t: "stunned", unitId: u.id });
      continue;
    }
    state.activeId = u.id;
    state.phase = "turn";
    refreshCompat(state);
    return u;
  }
  // Unreachable in practice (a stun can't outlast its own ticks); fail soft.
  refreshCompat(state);
  return null;
}

// ─── Queries for UI / AI ──────────────────────────────────────────────
/** Walkable destinations (with paths) for the active unit; empty when it can't move now. */
export function reachableFor(state: GridBattleState, unitId: string): Map<string, Cell[]> {
  const u = unitById(state, unitId);
  if (!u || !u.alive || state.activeId !== unitId || state.phase !== "turn") return new Map();
  const ally = new Set<string>(), enemy = new Set<string>();
  for (const o of living(state)) if (o !== u) (o.team === u.team ? ally : enemy).add(cellKey(o.pos));
  return reachableCells(boardOf(state), u.pos, u.move, ally, enemy);
}

function slotProfile(u: GridUnit, slot: number) {
  const raw = u.build.skillIds[slot];
  const info = raw ? parseSlotId(raw) : null;
  const profile = slotGrid(raw);
  return info && profile ? { info, profile } : null;
}

export function aimableFor(state: GridBattleState, unitId: string, slot: number): Cell[] {
  const u = unitById(state, unitId);
  const sp = u && slotProfile(u, slot);
  return u && sp ? aimCells(boardOf(state), u.pos, sp.profile) : [];
}

export function previewArea(state: GridBattleState, unitId: string, slot: number, aimed: Cell): Cell[] {
  const u = unitById(state, unitId);
  const sp = u && slotProfile(u, slot);
  if (!u || !sp) return [];
  if (sp.profile.target === "self") return [{ ...u.pos }];
  return areaCells(boardOf(state), u.pos, aimed, sp.profile.area);
}

export function slotReady(state: GridBattleState, unitId: string, slot: number): boolean {
  const u = unitById(state, unitId);
  const sp = u && u.alive ? slotProfile(u, slot) : null;
  if (!u || !sp || (u.cd[slot] ?? 0) > 0) return false;
  if (sp.info.kind === "art") return !!sp.info.art.act && u.mp >= sp.info.art.act.c;
  return true;
}

/** Units the slot would affect when aimed at `aimed` (living, by the profile's target team). */
export function targetsFor(state: GridBattleState, unitId: string, slot: number, aimed: Cell): GridUnit[] {
  const u = unitById(state, unitId);
  const sp = u && slotProfile(u, slot);
  if (!u || !sp) return [];
  if (sp.profile.target === "self") return [u];
  const cells = areaCells(boardOf(state), u.pos, aimed, sp.profile.area);
  const inArea = (o: GridUnit) => cells.some((c) => sameCell(c, o.pos));
  return state.units.filter((o) => o.alive && inArea(o) && (sp.profile.target === "enemy" ? o.team !== u.team : o.team === u.team));
}

// ─── Actions ──────────────────────────────────────────────────────────
export function applyAction(state: GridBattleState, unitId: string, action: GridAction, rng: () => number = Math.random): boolean {
  const u = activeUnit(state);
  if (!u || u.id !== unitId || !u.alive || (state.phase !== "turn" && state.phase !== "moved")) return false;
  switch (action.t) {
    case "move": return doMove(state, u, action.to);
    case "skill": return doSkill(state, u, action.slot, action.target);
    case "wait":
      state.turn++;
      pushEvent(state, { t: "wait", unitId: u.id });
      pushLog(state, { cls: cls(u), txt: `[${state.turn}] ${nm(u)} รอจังหวะ` });
      endTurn(state);
      return true;
    case "flee": return doFlee(state, u, rng);
  }
}

function doMove(state: GridBattleState, u: GridUnit, to: Cell): boolean {
  if (state.phase !== "turn") return false;
  const path = reachableFor(state, u.id).get(cellKey(to));
  if (!path) return false;
  u.pos = { ...to };
  if (path.length > 1) u.facing = facingToward(path[path.length - 2], to, u.facing);
  state.phase = "moved";
  pushEvent(state, { t: "move", unitId: u.id, path: path.map((c) => ({ ...c })) });
  return true;
}

function doFlee(state: GridBattleState, u: GridUnit, rng: () => number): boolean {
  if (!u.leader || u.team !== "ally") return false;
  const foes = foesOf(state, u);
  const chance = fleeChance(u.derived.Spd, Math.max(0, ...foes.map((f) => f.derived.Spd)));
  const success = rng() * 100 < chance;
  state.turn++;
  pushEvent(state, { t: "flee", unitId: u.id, success });
  if (success) {
    pushLog(state, { cls: "lA", txt: `[${state.turn}] ${nm(u)} ถอยหนีสำเร็จ (โอกาส ${Math.round(chance)}%) — หลุดพ้นจากการต่อสู้` });
    state.escaped = true;
    state.phase = "over";
    state.activeId = null;
    pushEvent(state, { t: "end", winner: null, escaped: true });
  } else {
    pushLog(state, { cls: "lA", txt: `[${state.turn}] ${nm(u)} ถอยหนีไม่พ้น (โอกาส ${Math.round(chance)}%) — เสียจังหวะ` });
  }
  endTurn(state);
  return true;
}

const nearestFoe = (state: GridBattleState, u: GridUnit): GridUnit | undefined =>
  foesOf(state, u).sort((a, b) => manhattan(u.pos, a.pos) - manhattan(u.pos, b.pos))[0];

function doSkill(state: GridBattleState, u: GridUnit, slot: number, aimed: Cell): boolean {
  if (!slotReady(state, u.id, slot)) return false;
  const sp = slotProfile(u, slot)!;
  const { info, profile } = sp;
  if (!aimCells(boardOf(state), u.pos, profile).some((c) => sameCell(c, aimed))) return false;
  const targets = targetsFor(state, u.id, slot, aimed);
  if (!targets.length) return false;
  const cells = previewArea(state, u.id, slot, aimed);
  // Support casts pair with the nearest foe (effects needing an opponent still work).
  const foe = profile.target === "enemy" ? undefined : nearestFoe(state, u);
  if (profile.target !== "enemy" && !foe) return false;

  const src = info.kind === "skill"
    ? { kind: "skill" as const, id: info.skill.id, slotIdx: slot, name: info.skill.n, tier: info.skill.ti }
    : { kind: "art" as const, id: info.art.id, slotIdx: slot, name: info.art.act!.n, tier: info.art.ti };
  const turn = ++state.turn;
  const hp0 = new Map(state.units.map((o) => [o.id, o.hp]));
  const results = new Map<string, TargetResult>();
  const result = (o: GridUnit) => {
    let r = results.get(o.id);
    if (!r) results.set(o.id, (r = { unitId: o.id, damages: [], crits: [], misses: [], healed: 0, killed: false }));
    return r;
  };

  if (profile.target === "enemy") {
    targets.forEach((t, i) => {
      if (!u.alive || u.hp <= 0) return; // reflected to death mid-sweep
      const { view } = resolveDuel(u, t, turn, src, i > 0);
      pushLog(state, gridLogLines(view));
      const lc = view.lastCast;
      if (lc) { const r = result(t); r.damages.push(...lc.hitDamages); r.crits.push(...lc.hitCrits); r.misses.push(...lc.hitMisses); }
    });
  } else {
    // Buffs / heals: the paired foe's HP is restored — a support cast never damages anyone.
    const f = foe!;
    const foeHp = f.hp, foeHits = f.hitsReceived;
    const { view } = resolveDuel(u, f, turn, src, false);
    f.hp = foeHp; f.hitsReceived = foeHits;
    pushLog(state, gridLogLines(view));
    for (const t of targets) result(t);
    // Other allies in the area get the same support (no second cost).
    for (const t of targets) {
      if (t === u) continue;
      const tFoe = nearestFoe(state, t) ?? f;
      const tFoeHp = tFoe.hp;
      if (src.kind === "skill") {
        const se = info.kind === "skill" ? info.skill.se : null;
        if (!se) continue;
        const v = makeDuelView(t, tFoe, turn);
        const ctx = pairContext(t, tFoe);
        // Same self-effect the caster received, applied to the ally.
        applySelfEffect(v, "A", se, ctx.names);
        commitDuelView(v, t, tFoe);
        pushLog(state, gridLogLines(v));
      } else {
        const v = makeDuelView(t, tFoe, turn);
        resolveArtActive(v, "A", pairContext(t, tFoe), { slotIdx: slot, artId: src.id, tick: false, secondary: true });
        commitDuelView(v, t, tFoe);
        pushLog(state, gridLogLines(v));
      }
      tFoe.hp = tFoeHp;
    }
  }

  // Net HP change per unit → damage / heal numbers not already reported (drain, reflect, heals).
  for (const o of state.units) {
    const before = hp0.get(o.id)!;
    if (o.hp > before) result(o).healed = o.hp - before;
    else if (o.hp < before && !results.has(o.id)) {
      const r = result(o); r.damages.push(before - o.hp); r.crits.push(false); r.misses.push(false);
    }
  }
  if (!sameCell(aimed, u.pos)) u.facing = facingToward(u.pos, aimed, u.facing);
  for (const r of results.values()) r.killed = unitById(state, r.unitId)!.hp <= 0;
  pushEvent(state, {
    t: "cast", unitId: u.id, name: src.name, tier: src.tier, source: { kind: src.kind, id: src.id },
    aimed: { ...aimed }, cells, results: [...results.values()],
  });
  settle(state); // after the cast so "end" follows it
  endTurn(state);
  return true;
}
