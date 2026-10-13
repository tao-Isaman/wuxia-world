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
//   ["x"]                 one AI beat for the person whose unit holds the turn (their time ran out)
//   ["u", unitId, 0 | 1]  the AI plays that person's unit from now on, or stops (a party fight)
// Only commands that changed the battle are logged, so a replay must accept
// every one of them.
//
// A party fight (a world boss, server/worker/ts/raid-*.ts) has more than one
// person on the ally side: `allies` adds their units, `humans` names the units
// people play (the rest of the side is the AI's), and `autoUnits` the people's
// units the AI plays for now. Commands still act for whichever unit holds the
// turn; who may send them is the server's business.

import type { CharacterBuild, WeaponFamily } from "../types";
import { WEAPON_FAMILY_LABEL } from "../data/weapons";
import { escapeBattleText } from "../effects";
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
  /** A party fight: more units on the leader's side (after the leader), in order. */
  allies?: UnitSpec[];
  /** The units people play (default: the whole ally side); the AI plays the others. */
  humans?: string[];
}

export type BattleCommand =
  | ["s"]
  | ["m", number, number]
  | ["a", number, number, number]
  | ["w"]
  | ["f"]
  | ["i", string, number, number]
  | ["auto", 0 | 1]
  | ["x"]
  | ["u", string, 0 | 1];

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
  /** The units people play (null: the whole ally side, a solo fight). */
  humans: string[] | null;
  /** People's units the AI plays for now (a party fight: time ran out, or they asked). */
  autoUnits: string[];
}

/** Who plays which unit: the session's settings, as the UI sees them (null fields: a solo fight). */
export interface BattleControl {
  /** The unit this screen's player plays. */
  me: string;
  humans: readonly string[] | null;
  autoUnits: readonly string[];
}

export const PLAYER_UNIT = "A";
export const PRIMARY_ENEMY_UNIT = "B";
const DEFAULT_LOOKS: { A: UnitLook; B: UnitLook } = {
  A: { kind: "character", characterId: "m1" },
  B: { kind: "character", characterId: "bandit" },
};
/** Safety bound for stepAll (each step makes progress, so this is never hit in practice). */
const STEP_ALL_LIMIT = 5000;

/**
 * Whether the AI plays this unit right now: enemies always; an ally nobody
 * plays (a party fight's `humans`); a person's unit set to the AI
 * (`autoUnits`); and every ally when auto is on.
 */
export function aiControls(unit: GridUnit, auto: boolean, control?: Pick<BattleControl, "humans" | "autoUnits"> | null): boolean {
  if (unit.team === "enemy" || auto) return true;
  if (control?.humans && !control.humans.includes(unit.id)) return true;
  return !!control?.autoUnits.includes(unit.id);
}

/**
 * True when the battle waits for a person's input (their unit holds the turn,
 * the AI not playing it). With a `control`'s `me`, only for that player's own unit.
 */
export function isPlayerTurn(state: GridBattleState | null, auto: boolean, control?: BattleControl | null): boolean {
  if (!state || state.phase === "over") return false;
  const u = activeUnit(state);
  if (!u || aiControls(u, auto, control)) return false;
  return !control || u.id === control.me;
}

/** Whether a person (any of them) must act now: the session waits for a command it cannot make itself. */
function humanTurn(session: BattleSession): boolean {
  if (session.state.phase === "over") return false;
  const u = activeUnit(session.state);
  return !!u && !aiControls(u, session.auto, session);
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
      ...(opts.allies ?? []).map((u) => ({ ...u, team: "ally" as const, leader: false })),
      { id: PRIMARY_ENEMY_UNIT, team: "enemy", build: b, look: looks.B },
      ...(opts.enemies ?? []).map((e) => ({ ...e, team: "enemy" as const, leader: false })),
    ];
    const size = opts.cols && opts.rows ? { cols: opts.cols, rows: opts.rows } : boardSizeFor(specs.length);
    const battle = createGridBattle(specs, { blocked: opts.blocked, ...size });
    if (opts.bag) { battle.bag = { ...opts.bag }; battle.itemsUsed = {}; }
    const leader = battle.units[0];
    const log = (txt: string) => battle.log.push({ cls: "lS", txt });
    log("━━ เริ่มการต่อสู้ ━━");
    const nameA = escapeBattleText(leader.name), nameB = escapeBattleText(battle.units[1]?.name ?? "");
    if (typeof opts.hpA === "number" && leader.hp < leader.derived.HP) log(`${nameA} เริ่มต้นด้วยพลังชีวิต ${leader.hp}/${leader.derived.HP}`);
    if (typeof opts.mpA === "number" && leader.mp < leader.derived.MP) log(`${nameA} เริ่มต้นด้วยปราณ ${leader.mp}/${leader.derived.MP}`);
    for (const [w, v] of Object.entries(getMasteryMap(a.skillIds, a.skillLevels))) {
      log(`${nameA}: ชำนาญ${WEAPON_FAMILY_LABEL[w as WeaponFamily] ?? w} ×${(1 + (v / 200) * 0.5).toFixed(2)}`);
    }
    const aA = getArt(a.artId), aB = getArt(b.artId);
    if (aA.id !== "none") log(`${nameA} ลมปราณ: ${aA.n} ขั้น ${a.artLevel} · พลังชีวิต +${aA.hL * a.artLevel} · ปราณ +${aA.mL * a.artLevel}`);
    if (aB.id !== "none") log(`${nameB} ลมปราณ: ${aB.n} ขั้น ${b.artLevel} · พลังชีวิต +${aB.hL * b.artLevel} · ปราณ +${aB.mL * b.artLevel}`);
    const allies = opts.allies?.length ?? 0;
    if (allies > 0) log(`ฝ่ายเรามีสหายร่วมคณะอีก ${allies} คน`);
    const extra = battle.units.length - 2 - allies;
    if (extra > 0) log(`ฝ่ายศัตรูมีพวกอีก ${extra} คน`);
    return battle;
  });
  return { state: cloneBattle(state), auto: false, planned: null, rng, commands: rng ? [] : null, humans: opts.humans ? [...opts.humans] : null, autoUnits: [] };
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
  const { state } = session;
  if (!humanTurn(session)) return false;
  const next = cloneBattle(state);
  const u = activeUnit(next)!;
  if (!withRandom(session.rng, () => applyAction(next, u.id, action))) return false;
  session.planned = null;
  session.state = next;
  record(session, commandOf(action));
  return true;
}

/**
 * One visible beat of non-player play: start the next turn and / or one AI
 * move or action. `force` plays a person's unit too (their time ran out: `["x"]`).
 */
export function stepSession(session: BattleSession, force = false): boolean {
  const { state } = session;
  if (state.phase === "over") return false;
  const next = cloneBattle(state);
  const ai = (u: GridUnit) => force || aiControls(u, session.auto, session);
  const changed = withRandom(session.rng, () => {
    let u = activeUnit(next);
    if (!u) {
      if (force) return false; // nobody's turn to play for
      u = beginNextTurn(next);
      session.planned = null;
      // Player's turn (or battle over): publish the new turn and wait.
      if (!u || !aiControls(u, session.auto, session)) return true;
    } else if (!ai(u)) {
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
  record(session, force ? ["x"] : ["s"]);
  return true;
}

/** A party fight: the AI plays a person's unit from now on (`on`), or stops. Only for `humans`. */
export function setUnitAuto(session: BattleSession, unitId: string, on: boolean): boolean {
  if (!session.humans?.includes(unitId) || session.autoUnits.includes(unitId) === on) return false;
  session.autoUnits = on ? [...session.autoUnits, unitId] : session.autoUnits.filter((id) => id !== unitId);
  record(session, ["u", unitId, on ? 1 : 0]);
  return true;
}

/** Steps until a person must act or the battle ends (the server's side of a party fight). Returns the beats made. */
export function stepUntilHuman(session: BattleSession, limit = STEP_ALL_LIMIT): number {
  let beats = 0;
  while (beats < limit && session.state.phase !== "over" && !humanTurn(session) && stepSession(session)) beats++;
  return beats;
}

/** The unit holding the turn when a person must act now, else null. */
export function humanToAct(session: BattleSession): string | null {
  return humanTurn(session) ? activeUnit(session.state)?.id ?? null : null;
}

/** Step until the player must act or the battle ends (tests, debug). */
export function stepSessionAll(session: BattleSession): void {
  for (let i = 0; i < STEP_ALL_LIMIT; i++) {
    if (session.state.phase === "over" || humanTurn(session)) return;
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
    case "x": return humanTurn(session) && stepSession(session, true);
    case "u": return typeof a === "string" && (b === 0 || b === 1) && setUnitAuto(session, a, b === 1);
    default:
      return false;
  }
}
