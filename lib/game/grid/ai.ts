// ─── Grid combat AI (pure, deterministic) ─────────────────────────────
// Plans one whole turn — optional move, then one action — for the active
// unit. Plays every enemy turn, and the player's units when "อัตโนมัติ" is on.
//
// How it thinks (docs/grid-combat.md):
//   1. Candidate end tiles = reachableFor (incl. staying put; only the current
//      tile once the unit has moved).
//   2. For every tile × ready slot × aim cell (computed from the geometry as if
//      standing on that tile) find the foes the area would cover and score it:
//        attack  — Σ expected damage (hit % × raw × crit factor, capped at the
//                  foe's HP) × focus (wounded / leader foes) + kill bonus
//                  + a small value for debuffs that are not already on the foe;
//        support — heals are worth the HP they restore (only below 60 % HP);
//                  buffs are worth a fraction of the unit's best hit when they
//                  are not already active and a foe is within two moves.
//   3. Tiny positional terms break near-ties: ranged casters avoid tiles next
//      to foes, melee units edge toward the enemy leader, everyone drifts
//      toward the nearest tile from which a foe can be hit, and walking
//      further than needed costs a hair.
//   4. Nothing to hit → walk toward the best attack position and wait.
// Estimates mirror calcSkillDamage / resolveArtActive without rolling dice or
// touching state. Ties break on lower x, then y, then slot (deterministic).
// The AI never flees — retreat is the player's decision.

import { critPct, CRIT_MULTIPLIER, hitPct } from "../damage";
import { effectiveBp } from "../leveling";
import { getStatusFactor } from "../skill-conflict";
import { parseSlotId } from "../slots";
import type { Art, Skill } from "../types";
import { pairContext } from "./duel";
import { boardOf, reachableFor, slotReady, unitById } from "./engine";
import { aimCells, areaCells, inBounds, manhattan, neighbours, type Board } from "./geometry";
import { slotGrid } from "./skill-grid";
import { cellKey, type AreaShape, type Cell, type GridBattleState, type GridSkillProfile, type GridUnit, type TurnPlan } from "./types";

// ─── Tuning ───────────────────────────────────────────────────────────
/** Heals only matter below this HP fraction. */
const HEAL_BELOW = 0.6;
/** Value of HP restored relative to damage dealt. */
const HEAL_WEIGHT = 1.3;
/** A buff is worth this fraction of the unit's best expected hit. */
const BUFF_WEIGHT = 0.4;
/** Kill bonus as a fraction of the victim's max HP (× chance to land it). */
const KILL_WEIGHT = 0.5;
/** Leader focus multiplier. */
const LEADER_FOCUS = 1.15;
/** Wounded focus: up to +50 % value on a foe at 0 HP left. */
const WOUNDED_FOCUS = 0.5;
/** Debuff riders are worth this fraction of the foe's max HP (× landing chance). */
const DEBUFF_WEIGHT = 0.03;
/** Positional terms, as fractions of the unit's best expected hit ("scale"). */
const RANGED_ADJ_PENALTY = 0.15;
const MELEE_LEADER_PULL = 0.01;
const APPROACH_PULL = 0.02;
const WALK_COST = 0.001;
/** MP spent is a small cost so free skills win ties against arts. */
const MP_COST = 0.05;

const EPS = 1e-9;

// ─── Estimates (mirror battle.ts, no dice, no mutation) ───────────────
interface Estimate {
  /** Expected damage (hit chance and crits folded in), before the HP cap. */
  expected: number;
  /** Damage when it lands without a crit. */
  onHit: number;
  hit: number;   // 0..1
  crit: number;  // 0..1
}

function evasion(foe: GridUnit): number {
  let ee = foe.derived.Eva;
  for (const d of foe.status.debuffs) if (d.t === "debuff_eva" && d.v != null) ee = Math.max(0, ee + d.v);
  for (const b of foe.status.buffs) if (b.t === "buff_eva") ee += b.v;
  return ee;
}
function accuracy(u: GridUnit): number {
  let ea = u.derived.Acc;
  for (const d of u.status.debuffs) if (d.t === "debuff_acc" && d.v != null) ea = Math.max(0, ea + d.v);
  return ea;
}
function critOf(u: GridUnit, foe: GridUnit): number {
  let bonus = 0;
  for (const b of u.status.buffs) if (b.t === "buff_cri") bonus += b.v;
  return critPct(u.derived.Cri + bonus, foe.derived.Res) / 100;
}
function defenderMods(foe: GridUnit) {
  let fD = 0, pR = 0, dR = 0, ref = 0;
  for (const b of foe.status.buffs) {
    if (b.t === "buff_def") fD += b.v;
    if (b.t === "buff_reduce") pR += b.v;
    if (b.t === "buff_reflect") ref = b.v;
  }
  for (const d of foe.status.debuffs) if (d.t === "debuff_def" && d.v != null) dR += Math.abs(d.v);
  return { fD, pR, dR, ref };
}

function estimateSkill(u: GridUnit, foe: GridUnit, sk: Skill): Estimate {
  if (!sk.at) return { expected: 0, onHit: 0, hit: hitPct(accuracy(u), evasion(foe)) / 100, crit: 0 };
  const ctx = pairContext(u, foe);
  let iatk = 0;
  for (const b of u.status.buffs) if (b.t === "buff_iatk") iatk += b.v;
  let im = 1 + iatk / 100;
  let ab = 1;
  const aid = ctx.artIds.A;
  if (aid === "taiji" && sk.at === "int") im *= 1.12;
  if (aid === "scholar" && sk.at === "int") ab = 1.1;
  let atkDebuff = 0;
  for (const d of u.status.debuffs) if (d.t === "debuff_atk" && d.v != null) atkDebuff += d.v;
  const sm = Math.max(0, 1 + (u.status.stk * u.status.stkV) / 100 + ctx.equipBonus.A.pct_atk / 100 + atkDebuff / 100);
  const { fD, dR } = defenderMods(foe);
  const pR = defenderMods(foe).pR + ctx.equipBonus.B.pct_red;
  const mm = 1 + ((ctx.masteries.A[sk.w] ?? 0) / 200) * 0.5;
  const lv = ctx.skillLevels.A[sk.id];
  const eBp = effectiveBp(sk, typeof lv === "number" ? lv : 1) * getStatusFactor(sk, ctx.conflict.A);
  const d = u.derived, dd = foe.derived;
  const ta = sk.at === "phy" ? d.PA : d.IA * im;
  const vit = sk.vitScale ? sk.vitScale * (ctx.stats.A.VIT ?? 0) : 0;
  const se = eBp * (1 + sk.p / 100) + sk.f + vit;
  const ed = Math.max(0, (sk.at === "phy" ? dd.PD : dd.ID) + fD - dR);
  const raw = Math.max(1, (d.Atk * sm * ab + ta + se) * sk.dm * mm - ed) * (1 - pR / 100);
  const hit = hitPct(accuracy(u), evasion(foe)) / 100;
  const crit = critOf(u, foe);
  return { expected: raw * hit * (1 + crit * (CRIT_MULTIPLIER - 1)), onHit: raw, hit, crit };
}

function estimateArt(u: GridUnit, foe: GridUnit, art: Art): Estimate {
  const act = art.act;
  const hit = hitPct(accuracy(u), evasion(foe)) / 100;
  const crit = critOf(u, foe);
  if (!act) return { expected: 0, onHit: 0, hit, crit };
  const d = u.derived, dd = foe.derived;
  const { fD, pR } = defenderMods(foe);
  let raw = 0;
  switch (act.t) {
    case "atk_phy_pen":
      raw = Math.max(1, (d.Atk + d.PA) * (act.m ?? 1) - (dd.PD * (1 - (act.pen ?? 0) / 100) + fD)) * (1 - pR / 100);
      break;
    case "atk_int_pen":
      raw = Math.max(1, (d.Atk + d.IA) * (act.m ?? 1) - (dd.ID * (1 - (act.pen ?? 0) / 100) + fD)) * (1 - pR / 100);
      break;
    case "drain":
    case "drain_acc":
      raw = Math.max(1, (d.Atk + d.IA) * (act.m ?? 1) - (dd.ID + fD)) * (1 - pR / 100);
      break;
    case "drain_phy":
      raw = Math.max(1, (d.Atk + d.PA) * (act.m ?? 1) - (dd.PD + fD)) * (1 - pR / 100);
      break;
    case "debuff_acc_dmg":
      raw = Math.max(1, (d.Atk + d.IA) * (act.dm ?? 1) - (dd.ID + fD)) * (1 - pR / 100);
      break;
    default:
      raw = 0;
  }
  return { expected: raw * hit * (1 + crit * (CRIT_MULTIPLIER - 1)), onHit: raw, hit, crit };
}

const hasDebuff = (foe: GridUnit, t: string) => foe.status.debuffs.some((d) => d.t === t && (d.u ?? 1) > 0);
const hasBuff = (u: GridUnit, t: string) => u.status.buffs.some((b) => b.t === t && b.u > 0);

/** Value of an enemy-effect rider (skill `ee` / debuffing art), before the landing chance. */
function debuffValue(foe: GridUnit, t: string, extra: { pp?: number; u?: number; ch?: number } = {}): number {
  const hp = foe.derived.HP;
  switch (t) {
    case "stun":
      return hasDebuff(foe, "stun") ? 0 : hp * 0.15 * ((extra.ch ?? 100) / 100);
    case "debuff_poison":
    case "heavy_poison":
    case "poison_dmg":
    case "burn_hp_mp": {
      const already = hasDebuff(foe, t === "burn_hp_mp" ? "burn_hp_mp" : "debuff_poison");
      const dot = hp * ((extra.pp ?? 5) / 100) * Math.min(3, extra.u ?? 2) * 0.5;
      return already ? dot * 0.25 : dot;
    }
    case "multi_debuff":
    case "debuff_def_eva":
      return hp * DEBUFF_WEIGHT * 1.5;
    case "drain_mp":
      return foe.mp > 0 ? hp * DEBUFF_WEIGHT : 0;
    default:
      return hasDebuff(foe, t) ? hp * DEBUFF_WEIGHT * 0.3 : hp * DEBUFF_WEIGHT;
  }
}

// ─── Per-slot tables built once per plan ──────────────────────────────
interface SlotPlan {
  slot: number;
  profile: GridSkillProfile;
  /** Per foe id: the value of hitting that foe once (enemy slots). */
  perFoe: Map<string, number>;
  /** Support value (self slots) before the "foe nearby" gate. */
  support: number;
  /** True when the support value is a buff (needs a foe within reach to matter). */
  buffOnly: boolean;
  /** Once-per-cast bonus for an attack's self rider (heal_pct / buff on a damaging skill). */
  selfBonus: number;
  mpCost: number;
}

function foeValue(u: GridUnit, foe: GridUnit, est: Estimate, rider: number, drainPct: number, scale: number): number {
  const capped = Math.min(est.expected, foe.hp);
  const focus = (1 + WOUNDED_FOCUS * (1 - foe.hp / Math.max(1, foe.derived.HP))) * (foe.leader ? LEADER_FOCUS : 1);
  let kill = 0;
  if (est.onHit > 0) {
    const bonus = KILL_WEIGHT * foe.derived.HP + 0.3 * scale;
    if (est.onHit >= foe.hp) kill = est.hit * bonus;
    else if (est.onHit * CRIT_MULTIPLIER >= foe.hp) kill = est.hit * est.crit * bonus;
  }
  const missing = u.derived.HP - u.hp;
  const drain = drainPct > 0 ? Math.min(missing, capped * drainPct / 100) : 0;
  return capped * focus + kill + rider * est.hit + drain;
}

function supportOfSkill(u: GridUnit, sk: Skill): { v: number; buff: boolean } {
  const se = sk.se;
  if (!se) return { v: 0, buff: true };
  const max = u.derived.HP, missing = max - u.hp;
  const low = u.hp / Math.max(1, max) < HEAL_BELOW;
  switch (se.t) {
    case "heal_pct":
      return { v: low ? Math.min(missing, max * se.v / 100) * HEAL_WEIGHT : 0, buff: false };
    case "heal_buff": {
      const heal = low ? Math.min(missing, max * se.hp / 100) * HEAL_WEIGHT : 0;
      return { v: heal, buff: heal === 0 && !hasBuff(u, se.bt) };
    }
    case "stack_atk":
      return { v: 0, buff: u.status.stk < se.mx };
    case "buff_iatk_reduce":
      return { v: 0, buff: !hasBuff(u, "buff_iatk") };
    case "buff_reflect_eva":
      return { v: 0, buff: !hasBuff(u, "buff_reflect") };
    default:
      return { v: 0, buff: !hasBuff(u, se.t) };
  }
}

function supportOfArt(u: GridUnit, art: Art): { v: number; buff: boolean } {
  const act = art.act;
  if (!act) return { v: 0, buff: false };
  const max = u.derived.HP, missing = max - u.hp;
  const low = u.hp / Math.max(1, max) < HEAL_BELOW;
  switch (act.t) {
    case "heal":
    case "heal_cleanse":
    case "heal_full_cleanse": {
      let v = low ? Math.min(missing, max * (act.h ?? 0) / 100) * HEAL_WEIGHT : 0;
      if (v > 0 && act.t !== "heal" && u.status.debuffs.length) v += max * DEBUFF_WEIGHT;
      return { v, buff: false };
    }
    case "buff_eva_debuff_eva":
      return { v: 0, buff: !hasBuff(u, "buff_eva") };
    default:
      return { v: 0, buff: !hasBuff(u, act.t) };
  }
}

function buildSlotPlans(state: GridBattleState, u: GridUnit, foes: GridUnit[]): { plans: SlotPlan[]; scale: number; attackProfiles: GridSkillProfile[] } {
  const raws = u.build.skillIds;
  const ests: { slot: number; profile: GridSkillProfile; est: Map<string, Estimate>; rider: Map<string, number>; drain: number; ready: boolean; self: { v: number; buff: boolean } }[] = [];
  const supports: { slot: number; profile: GridSkillProfile; v: number; buff: boolean; mp: number }[] = [];
  const attackProfiles: GridSkillProfile[] = [];
  let scale = 1;
  for (let slot = 0; slot < raws.length; slot++) {
    const info = parseSlotId(raws[slot]);
    const profile = slotGrid(raws[slot]);
    if (!info || !profile) continue;
    const ready = slotReady(state, u.id, slot);
    if (profile.target === "enemy") {
      attackProfiles.push(profile);
      const est = new Map<string, Estimate>(), rider = new Map<string, number>();
      for (const f of foes) {
        const e = info.kind === "skill" ? estimateSkill(u, f, info.skill) : estimateArt(u, f, info.art);
        est.set(f.id, e);
        scale = Math.max(scale, e.expected);
        let r = 0;
        if (info.kind === "skill" && info.skill.ee) {
          const ee = info.skill.ee;
          r = debuffValue(f, ee.t, "pp" in ee ? { pp: ee.pp, u: ee.u } : ee.t === "burn_hp_mp" ? { pp: ee.dmg, u: ee.u } : ee.t === "stun" ? { ch: ee.ch } : {});
        } else if (info.kind === "art" && info.art.act) {
          const a = info.art.act;
          if (a.t === "debuff_poison") r = debuffValue(f, "debuff_poison", { pp: a.pp, u: a.u });
          else if (a.t === "drain_acc" || a.t === "debuff_acc_dmg") r = debuffValue(f, "debuff_acc");
        }
        rider.set(f.id, r);
      }
      const drain = info.kind === "skill" ? info.skill.dr ?? 0
        : info.art.act && /drain/.test(info.art.act.t) ? info.art.act.h ?? 0 : 0;
      const self = info.kind === "skill" && info.skill.se ? supportOfSkill(u, info.skill) : { v: 0, buff: false };
      ests.push({ slot, profile, est, rider, drain, ready, self });
    } else if (ready) {
      const s = info.kind === "skill" ? supportOfSkill(u, info.skill) : supportOfArt(u, info.art);
      supports.push({ slot, profile, v: s.v, buff: s.buff, mp: info.kind === "art" ? info.art.act?.c ?? 0 : 0 });
    }
  }
  const plans: SlotPlan[] = [];
  for (const e of ests) {
    if (!e.ready) continue;
    const perFoe = new Map<string, number>();
    for (const f of foes) perFoe.set(f.id, foeValue(u, f, e.est.get(f.id)!, e.rider.get(f.id)!, e.drain, scale));
    const info = parseSlotId(raws[e.slot]);
    const mpCost = info?.kind === "art" ? info.art.act?.c ?? 0 : 0;
    const selfBonus = e.self.v + (e.self.buff ? 0.1 * scale : 0);
    plans.push({ slot: e.slot, profile: e.profile, perFoe, support: 0, buffOnly: false, selfBonus, mpCost });
  }
  for (const s of supports) {
    plans.push({ slot: s.slot, profile: s.profile, perFoe: new Map(), support: s.v, buffOnly: s.v === 0 && s.buff, selfBonus: 0, mpCost: s.mp });
  }
  return { plans, scale, attackProfiles };
}

// ─── Approach map: steps from each cell to the nearest attack position ──
/** Cells from which `profile` could reach `foe` (manhattan ring, straight line for line shapes). */
function attackPositions(board: Board, foe: GridUnit, profile: GridSkillProfile, blockedForStand: Set<string>): Cell[] {
  const out: Cell[] = [];
  const { min, max } = profile.range;
  const reach = max + areaReach(profile.area);
  for (let y = foe.pos.y - reach; y <= foe.pos.y + reach; y++) {
    for (let x = foe.pos.x - reach; x <= foe.pos.x + reach; x++) {
      const c = { x, y };
      const d = manhattan(c, foe.pos);
      if (!inBounds(board, c) || board.blocked.has(cellKey(c)) || blockedForStand.has(cellKey(c))) continue;
      if (profile.area.kind === "line" || profile.area.kind === "single") {
        if (d < Math.max(1, min) || d > max) continue;
        if (profile.area.kind === "line" && x !== foe.pos.x && y !== foe.pos.y) continue;
      } else if (d < 1 || d > reach) continue;
      out.push(c);
    }
  }
  return out;
}
function areaReach(area: AreaShape): number {
  switch (area.kind) {
    case "diamond": case "cross": return area.size;
    case "square": return area.size * 2;
    case "arc": return 1;
    default: return 0;
  }
}

/** BFS distance (walking, enemies block, allies pass) from every cell to the nearest source. */
function distanceField(board: Board, sources: Cell[], enemyCells: Set<string>): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: Cell[] = [];
  for (const s of sources) { const k = cellKey(s); if (!dist.has(k)) { dist.set(k, 0); queue.push(s); } }
  for (let i = 0; i < queue.length; i++) {
    const here = queue[i];
    const d = dist.get(cellKey(here))!;
    for (const n of neighbours(here)) {
      const k = cellKey(n);
      if (!inBounds(board, n) || board.blocked.has(k) || enemyCells.has(k) || dist.has(k)) continue;
      dist.set(k, d + 1);
      queue.push(n);
    }
  }
  return dist;
}

// ─── Candidates ───────────────────────────────────────────────────────
interface Candidate {
  tile: Cell;
  slot: number;       // -1 = wait
  aim: Cell | null;
  score: number;
}

function better(a: Candidate, b: Candidate | null): boolean {
  if (!b) return true;
  if (a.score > b.score + EPS) return true;
  if (a.score < b.score - EPS) return false;
  if (a.tile.x !== b.tile.x) return a.tile.x < b.tile.x;
  if (a.tile.y !== b.tile.y) return a.tile.y < b.tile.y;
  const sa = a.slot < 0 ? Infinity : a.slot, sb = b.slot < 0 ? Infinity : b.slot;
  if (sa !== sb) return sa < sb;
  if (a.aim && b.aim) {
    if (a.aim.x !== b.aim.x) return a.aim.x < b.aim.x;
    return a.aim.y < b.aim.y;
  }
  return false;
}

/**
 * Score one (tile, slot, aim) option for `unitId` without mutating state.
 * Returns null when the option would hit nobody (illegal for enemy slots).
 * Exposed for tests / debugging; planTurn uses the same maths.
 */
export function scoreAction(state: GridBattleState, unitId: string, tile: Cell, slot: number, aim: Cell): number | null {
  const u = unitById(state, unitId);
  if (!u) return null;
  const foes = state.units.filter((o) => o.alive && o.team !== u.team);
  const { plans } = buildSlotPlans(state, u, foes);
  const p = plans.find((x) => x.slot === slot);
  if (!p) return null;
  if (p.profile.target !== "enemy") return p.support;
  const cells = areaCells(boardOf(state), tile, aim, p.profile.area);
  let v = 0, hits = 0;
  for (const f of foes) if (cells.some((c) => c.x === f.pos.x && c.y === f.pos.y)) { v += p.perFoe.get(f.id) ?? 0; hits++; }
  return hits ? v + p.selfBonus : null;
}

/** Plan the active unit's whole turn: optional move, then one action. */
export function planTurn(state: GridBattleState, unitId: string): TurnPlan {
  const u = unitById(state, unitId);
  if (!u || !u.alive || state.activeId !== unitId || (state.phase !== "turn" && state.phase !== "moved")) {
    return { action: { t: "wait" } };
  }
  const board = boardOf(state);
  const foes = state.units.filter((o) => o.alive && o.team !== u.team);
  if (!foes.length) return { action: { t: "wait" } };

  // End tiles with their walking paths.
  const reach = state.phase === "turn" ? reachableFor(state, unitId) : new Map<string, Cell[]>();
  const tiles: { tile: Cell; steps: number }[] = reach.size
    ? [...reach.values()].map((p) => ({ tile: p[p.length - 1], steps: p.length - 1 }))
    : [{ tile: { ...u.pos }, steps: 0 }];

  const { plans, scale, attackProfiles } = buildSlotPlans(state, u, foes);
  const foeAt = new Map<string, GridUnit>();
  for (const f of foes) foeAt.set(cellKey(f.pos), f);
  const enemyCells = new Set(foeAt.keys());

  // Approach field toward positions that can hit the most valuable foe.
  const othersCells = new Set(state.units.filter((o) => o.alive && o !== u).map((o) => cellKey(o.pos)));
  const approachProfiles = attackProfiles.length ? attackProfiles : [{ range: { min: 1, max: 1 }, area: { kind: "single" }, target: "enemy" } as GridSkillProfile];
  const fields = foes.map((f) => {
    const sources: Cell[] = [];
    for (const pr of approachProfiles) sources.push(...attackPositions(board, f, pr, othersCells));
    const worth = (f.leader ? 0.3 : 0) + WOUNDED_FOCUS * (1 - f.hp / Math.max(1, f.derived.HP));
    return { f, dist: distanceField(board, sources, enemyCells), worth };
  });
  const approachDist = (c: Cell): number => {
    let best = Infinity;
    for (const fl of fields) {
      const d = fl.dist.get(cellKey(c));
      const v = (d ?? 50 + manhattan(c, fl.f.pos)) - fl.worth;
      if (v < best) best = v;
    }
    return best;
  };

  const enemyLeader = foes.find((f) => f.leader) ?? foes[0];
  const unitRanged = attackProfiles.length > 0 && attackProfiles.every((p) => p.range.max >= 2);
  const adjacentFoes = (c: Cell) => foes.reduce((n, f) => n + (manhattan(c, f.pos) === 1 ? 1 : 0), 0);
  const foeNear = (c: Cell) => foes.some((f) => manhattan(c, f.pos) <= 2 * f.move + 1);

  // Two pools: real actions (attacks / useful support) always beat idling;
  // the idle pool (walk + wait) only plays when there is nothing to do.
  let bestAct: Candidate | null = null;
  let bestIdle: Candidate | null = null;
  for (const { tile, steps } of tiles) {
    const walk = WALK_COST * steps * scale;
    const approach = APPROACH_PULL * scale * approachDist(tile);
    const adj = adjacentFoes(tile);
    const idlePos = -walk - approach - (unitRanged ? RANGED_ADJ_PENALTY * scale * adj : 0);

    const wait: Candidate = { tile, slot: -1, aim: null, score: idlePos };
    if (better(wait, bestIdle)) bestIdle = wait;

    for (const p of plans) {
      const mp = MP_COST * p.mpCost;
      if (p.profile.target !== "enemy") {
        let v = p.support;
        if (p.buffOnly) v = foeNear(tile) ? BUFF_WEIGHT * scale : 0;
        if (v - mp <= 0) continue;
        const c: Candidate = { tile, slot: p.slot, aim: tile, score: v - mp + idlePos };
        if (better(c, bestAct)) bestAct = c;
        continue;
      }
      const ranged = p.profile.range.max >= 2;
      const pos = -walk
        - (ranged ? RANGED_ADJ_PENALTY * scale * adj : MELEE_LEADER_PULL * scale * manhattan(tile, enemyLeader.pos));
      const r = areaReach(p.profile.area);
      for (const aim of aimCells(board, tile, p.profile)) {
        // Cheap reject: no foe close enough to the aim for this area.
        if (p.profile.area.kind !== "line" && !foes.some((f) => manhattan(aim, f.pos) <= r)) continue;
        const cells = areaCells(board, tile, aim, p.profile.area);
        let v = 0, hits = 0;
        for (const c of cells) {
          const f = foeAt.get(cellKey(c));
          if (f) { v += p.perFoe.get(f.id) ?? 0; hits++; }
        }
        if (!hits) continue;
        const cand: Candidate = { tile, slot: p.slot, aim, score: v + p.selfBonus - mp + pos };
        if (better(cand, bestAct)) bestAct = cand;
      }
    }
  }

  const pick = bestAct ?? bestIdle!;
  const move = pick.tile.x !== u.pos.x || pick.tile.y !== u.pos.y ? { ...pick.tile } : undefined;
  const action: TurnPlan["action"] = pick.slot < 0 || !pick.aim
    ? { t: "wait" }
    : { t: "skill", slot: pick.slot, target: { ...pick.aim } };
  return move ? { move, action } : { action };
}
