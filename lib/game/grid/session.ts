// A grid battle as a sequence of commands — the battle store's logic without
// the store (docs/grid-combat.md "Store API", docs/online.md "Battles on the
// server"). The browser's battle store wraps one session; the game server
// replays the same commands on its own session and must reach the same end.
//
// A session started with a `seed` rolls every die from that seed (withRandom
// over each engine call) and keeps `commands`, the log the server replays:
//   ["s"]                 one beat of non-player play (step)
//   ["m", x, y]           the player's unit moves
//   ["a", slot, x, y]     the player's unit uses skill / art slot `slot`
//   ["w"] · ["f"]         wait · flee
//   ["i", itemId, x, y]   a battle item (its effect comes from the item table)
//   ["auto", 0 | 1]       อัตโนมัติ off / on
// Only commands that changed the battle are logged, so a replay must accept
// every one of them.

import type { CharacterBuild } from "../types";
import { getArt } from "../data/arts";
import { getMasteryMap } from "../derive";
import { seededRng, withRandom } from "../rng";
import { activeUnit, applyAction, beginNextTurn, createGridBattle } from "./engine";
import { planTurn } from "./ai";
import { boardSizeFor, sameCell } from "./types";
import type { BattleItemEffect, Cell, GridAction, GridBattleState, GridUnit, TurnPlan, UnitLook, UnitSpec } from "./types";

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
  /** Board size; defaults to `boardSizeFor(unit count)` (10 × 7 up to 15 × 10). */
  cols?: number;
  rows?: number;
  /** The leader's battle items (item id → count); `useItem` draws on it. */
  bag?: Record<string, number>;
  /** Roll every die from this seed and keep the command log (a battle the server checks). */
  seed?: number;
}

export type BattleCommand =
  | ["s"]
  | ["m", number, number]
  | ["a", number, number, number]
  | ["w"]
  | ["f"]
  | ["i", string, number, number]
  | ["auto", 0 | 1];

/** What a battle item does in a fight (the item table's `battle` entry), for `["i", …]` replays. */
export type BattleItemLookup = (itemId: string) => { name: string; effect: BattleItemEffect } | null;

export interface BattleSession {
  state: GridBattleState;
  /** อัตโนมัติ: the AI also plays the player's side. */
  auto: boolean;
  /** The AI plans a whole turn up front; after the move beat, its action is replayed on the next step. */
  planned: { unitId: string; turn: number; action: TurnPlan["action"] } | null;
  /** The seed's random numbers (null: Math.random, an unchecked battle). */
  rng: (() => number) | null;
  /** The commands so far (only for a seeded battle). */
  commands: BattleCommand[] | null;
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

/** A new battle: the hero (A, leader) against `b` and its pack. */
export function startSession(a: CharacterBuild, b: CharacterBuild, opts: BattleStartOpts = {}): BattleSession {
  const rng = typeof opts.seed === "number" ? seededRng(opts.seed, 0x6261) : null;
  const state = withRandom(rng, () => {
    const looks = opts.looks ?? DEFAULT_LOOKS;
    const specs: UnitSpec[] = [
      { id: PLAYER_UNIT, team: "ally", build: a, look: looks.A, hp: opts.hpA, mp: opts.mpA, leader: true },
      { id: PRIMARY_ENEMY_UNIT, team: "enemy", build: b, look: looks.B },
      ...(opts.enemies ?? []).map((e) => ({ ...e, team: "enemy" as const, leader: false })),
    ];
    const size = opts.cols && opts.rows ? { cols: opts.cols, rows: opts.rows } : boardSizeFor(specs.length);
    const battle = createGridBattle(specs, { blocked: opts.blocked, ...size });
    if (opts.bag) { battle.bag = { ...opts.bag }; battle.itemsUsed = {}; }
    const leader = battle.units[0];
    const log = (txt: string) => battle.log.push({ cls: "lS", txt });
    log("━━ เริ่มการต่อสู้ ━━");
    if (typeof opts.hpA === "number" && leader.hp < leader.derived.HP) log(`A เริ่มต้นด้วย HP ${leader.hp}/${leader.derived.HP}`);
    if (typeof opts.mpA === "number" && leader.mp < leader.derived.MP) log(`A เริ่มต้นด้วย MP ${leader.mp}/${leader.derived.MP}`);
    for (const [w, v] of Object.entries(getMasteryMap(a.skillIds, a.skillLevels))) {
      log(`A: ${w} ×${(1 + (v / 200) * 0.5).toFixed(2)}`);
    }
    const aA = getArt(a.artId), aB = getArt(b.artId);
    if (aA.id !== "none") log(`A IA: ${aA.n} ขั้น${a.artLevel} HP+${aA.hL * a.artLevel} MP+${aA.mL * a.artLevel}`);
    if (aB.id !== "none") log(`B IA: ${aB.n} ขั้น${b.artLevel} HP+${aB.hL * b.artLevel} MP+${aB.mL * b.artLevel}`);
    const extra = battle.units.length - 2;
    if (extra > 0) log(`ฝ่ายศัตรูมีพวกอีก ${extra} คน`);
    return battle;
  });
  return { state: cloneBattle(state), auto: false, planned: null, rng, commands: rng ? [] : null };
}

function record(session: BattleSession, command: BattleCommand): void {
  session.commands?.push(command);
}

function commandOf(action: GridAction): BattleCommand {
  switch (action.t) {
    case "move": return ["m", action.to.x, action.to.y];
    case "skill": return ["a", action.slot, action.target.x, action.target.y];
    case "wait": return ["w"];
    case "flee": return ["f"];
    case "item": return ["i", action.itemId, action.target.x, action.target.y];
  }
}

/** The player's active unit acts, if it is the player's turn. Returns whether anything happened. */
export function playerAction(session: BattleSession, action: GridAction): boolean {
  const { state, auto } = session;
  if (!isPlayerTurn(state, auto)) return false;
  const next = cloneBattle(state);
  const u = activeUnit(next)!;
  if (!withRandom(session.rng, () => applyAction(next, u.id, action))) return false;
  session.planned = null;
  session.state = next;
  record(session, commandOf(action));
  return true;
}

/** One visible beat of non-player play: start the next turn and / or one AI move or action. */
export function stepSession(session: BattleSession): boolean {
  const { state, auto } = session;
  if (state.phase === "over") return false;
  const next = cloneBattle(state);
  const changed = withRandom(session.rng, () => {
    let u = activeUnit(next);
    if (!u) {
      u = beginNextTurn(next);
      session.planned = null;
      // Player's turn (or battle over): publish the new turn and wait.
      if (!u || !aiControls(u, auto)) return true;
    } else if (!aiControls(u, auto)) {
      return false; // waiting for the player
    }
    // One AI beat: the move, or (after moving / when not moving) the action.
    if (next.phase === "turn") {
      const plan = planTurn(next, u.id);
      if (plan.move && !sameCell(plan.move, u.pos) && applyAction(next, u.id, { t: "move", to: plan.move })) {
        session.planned = { unitId: u.id, turn: next.turn, action: plan.action };
        return true;
      }
      if (!applyAction(next, u.id, plan.action)) applyAction(next, u.id, { t: "wait" });
    } else {
      const planned = session.planned;
      const action = planned && planned.unitId === u.id && planned.turn === next.turn
        ? planned.action
        : planTurn(next, u.id).action;
      if (!applyAction(next, u.id, action)) applyAction(next, u.id, { t: "wait" });
    }
    session.planned = null;
    return true;
  });
  if (!changed) return false;
  session.state = next;
  record(session, ["s"]);
  return true;
}

/** Step until the player must act or the battle ends (tests, debug). */
export function stepSessionAll(session: BattleSession): void {
  for (let i = 0; i < STEP_ALL_LIMIT; i++) {
    if (session.state.phase === "over" || isPlayerTurn(session.state, session.auto)) return;
    if (!stepSession(session)) return;
  }
}

/** อัตโนมัติ on / off. */
export function setSessionAuto(session: BattleSession, on: boolean): void {
  if (session.auto === on) return;
  session.auto = on;
  record(session, ["auto", on ? 1 : 0]);
}

/**
 * Apply one logged command (the server's replay). Returns false when the
 * command cannot happen in this battle — a log that does not belong to it.
 */
export function applyCommand(session: BattleSession, command: unknown, items: BattleItemLookup): boolean {
  if (!Array.isArray(command)) return false;
  const [kind, a, b, c] = command as unknown[];
  const n = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 64;
  switch (kind) {
    case "s": return stepSession(session);
    case "m": return n(a) && n(b) && playerAction(session, { t: "move", to: { x: a, y: b } });
    case "a": return n(a) && n(b) && n(c) && playerAction(session, { t: "skill", slot: a, target: { x: b, y: c } });
    case "w": return playerAction(session, { t: "wait" });
    case "f": return playerAction(session, { t: "flee" });
    case "i": {
      if (typeof a !== "string" || !n(b) || !n(c)) return false;
      const item = items(a);
      return !!item && playerAction(session, { t: "item", itemId: a, name: item.name, effect: item.effect, target: { x: b, y: c } });
    }
    case "auto":
      if (a !== 0 && a !== 1) return false;
      setSessionAuto(session, a === 1);
      return true;
    default:
      return false;
  }
}
