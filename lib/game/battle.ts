import type {
  ArtActive,
  ArtActiveType,
  AttackType,
  BattleState,
  CharacterBuild,
  Derived,
  Side,
  SideBattleState,
  Skill,
  StatBlock,
} from "./types";
import {
  combinedStats,
  deriveAll,
  getBuildBonus,
  getMasteryMap,
  type EquipBonus,
  type MasteryMap,
} from "./derive";
import { hitPct, critPct, CRIT_MULTIPLIER } from "./damage";
import { getArt, getEquip, getSkill, TIERS } from "./data";
import { effectiveBp } from "./leveling";
import {
  computeConflictFactors,
  getStatusFactor,
  type ConflictFactors,
} from "./skill-conflict";
import { firstArtSlotIndex, parseSlotId } from "./slots";
import { meridianActiveEffects } from "./meridians";
import type { MeridianEffect } from "./meridian-types";
import { accPctOf, atkPctOf, criRateOf, defPctOf, landDamage, rollRage, rollSaps, spdPctOf, spdWithPct } from "./meridian-battle";

/** The most damage a defender can shrug off, in % (buffs + gear + meridians). */
export const PCT_REDUCE_CAP = 90;
import {
  applyEnemyEffect,
  applySelfEffect,
  checkPassive,
  checkWin,
  logLine,
  escapeBattleText,
  opposite,
  tickEffects,
  addDebuff,
  addBuff,
  blindFailLine,
  healHp,
  isScorched,
  rollBlind,
} from "./effects";

/** A move's cooldown in turns: its own `cd` when set (boss moves), else its tier's. */
export function skillCooldown(sk: Pick<Skill, "ti" | "cd">): number {
  return sk.cd ?? TIERS[sk.ti].cd;
}

// ─── Battle context: precomputed inputs that don't change during the battle ───
export interface BattleContext {
  names: Record<Side, string>;
  artIds: Record<Side, string>;
  weaponEquipIds: Record<Side, string | null>;
  equipBonus: Record<Side, EquipBonus>;
  masteries: Record<Side, MasteryMap>;
  // Per-skill levels in effect for each side. Read at damage time so the
  // skill's `bp` gets scaled by the level multiplier. Empty record → all
  // skills at level 1 (the nerfed baseline).
  skillLevels: Record<Side, Record<string, number>>;
  // Conflict factors per side — drive the half/zero base-status modifiers
  // when a side has too many opposing-type skills learned. See
  // lib/game/skill-conflict.ts.
  conflict: Record<Side, ConflictFactors>;
  // Combined stats per side (base + arts + skills, conflict-scaled; gear is
  // not included — deriveAll adds it). Used by skill features that scale
  // flat damage off a stat —
  // e.g. Skill.vitScale → `vitScale * stats[side].VIT` added to skillEffect.
  stats: Record<Side, StatBlock>;
  // Battle effects of each side's filled meridian points (rage on being hit,
  // sap on landing an attack; the start effects are applied by the grid).
  meridian: Record<Side, readonly MeridianEffect[]>;
}

// Pick the "primary" art for a side: the first art slotted in slots wins,
// otherwise fall back to the legacy `build.artId`. Powers ctx.artIds[side]
// which the existing passive-trigger code reads to fire art passives.
function primaryArtId(build: CharacterBuild): string {
  const idx = firstArtSlotIndex(build.skillIds);
  if (idx < 0) return build.artId;
  const info = parseSlotId(build.skillIds[idx]);
  return info && info.kind === "art" ? info.art.id : build.artId;
}

export function makeContext(buildA: CharacterBuild, buildB: CharacterBuild): BattleContext {
  const lvA = buildA.skillLevels ?? {};
  const lvB = buildB.skillLevels ?? {};
  const conflictA = computeConflictFactors(buildA, { getSkill, getArt });
  const conflictB = computeConflictFactors(buildB, { getSkill, getArt });
  return {
    names: { A: buildA.name, B: buildB.name },
    artIds: { A: primaryArtId(buildA), B: primaryArtId(buildB) },
    weaponEquipIds: { A: buildA.equipment.W, B: buildB.equipment.W },
    // Equipment + meridian (ชีพจร) pct_atk / pct_red / hp_regen and flats.
    equipBonus: { A: getBuildBonus(buildA), B: getBuildBonus(buildB) },
    masteries: {
      A: getMasteryMap(buildA.skillIds, lvA, conflictA),
      B: getMasteryMap(buildB.skillIds, lvB, conflictB),
    },
    skillLevels: { A: lvA, B: lvB },
    conflict: { A: conflictA, B: conflictB },
    stats: {
      A: combinedStats(buildA, conflictA),
      B: combinedStats(buildB, conflictB),
    },
    meridian: { A: meridianActiveEffects(buildA), B: meridianActiveEffects(buildB) },
  };
}

export interface InitialStateOpts {
  // Override side-A starting HP/MP — used by the world to carry post-battle
  // health into the next fight. Clamped into [0, max] from deriveAll(buildA).
  hpA?: number;
  mpA?: number;
}

export function makeInitialState(
  buildA: CharacterBuild,
  buildB: CharacterBuild,
  opts: InitialStateOpts = {},
): BattleState {
  const dA = deriveAll(buildA);
  const dB = deriveAll(buildB);
  const startHpA =
    typeof opts.hpA === "number" ? Math.max(0, Math.min(dA.HP, opts.hpA)) : dA.HP;
  const startMpA =
    typeof opts.mpA === "number" ? Math.max(0, Math.min(dA.MP, opts.mpA)) : dA.MP;
  return {
    dA, dB,
    hA: startHpA, hB: dB.HP,
    mpA: startMpA, mpB: dB.MP,
    gA: 0, gB: 0,
    turn: 0,
    log: [],
    winner: null,
    phase: "start",
    st: {
      A: { buffs: [], debuffs: [], stk: 0, stkV: 0 },
      B: { buffs: [], debuffs: [], stk: 0, stkV: 0 },
    },
    cd: {
      A: new Array(buildA.skillIds.length).fill(0) as number[],
      B: new Array(buildB.skillIds.length).fill(0) as number[],
    },
    iaCD: { A: 0, B: 0 },
    skillUses: { A: {}, B: {} },
    artUses: { A: {}, B: {} },
    hitsReceived: { A: 0, B: 0 },
  };
}

// ─── ATB turn order ───
// Both sides' gauges fill at rate (Spd + ATB_BASELINE) per ATB_UNIT_MS.
// The +60 baseline compresses raw SPD differences — a side needs ~5× SPD
// (or roughly Spd_other + 60 doubled) to act twice per opponent's turn.
//
// Calibration: at SPD = ATB_REFERENCE_SPD, gauge fills in ATB_REFERENCE_MS.
const ATB_BASELINE = 60;
const ATB_THRESHOLD = 100;
const ATB_REFERENCE_SPD = 200;
const ATB_REFERENCE_MS = 1000;
// Derived so `gaugeRate(REFERENCE_SPD) * REFERENCE_MS === THRESHOLD`.
const ATB_UNIT_MS =
  (ATB_REFERENCE_MS * (ATB_REFERENCE_SPD + ATB_BASELINE)) / ATB_THRESHOLD;
// = 1000 * 260 / 100 = 2600

// Gauge units gained per millisecond at a given SPD.
export function gaugeRate(spd: number): number {
  return (spd + ATB_BASELINE) / ATB_UNIT_MS;
}

// Effective SPD for ATB — base derived SPD plus any `buff_spd` buffs
// currently active on the side. Floor at 1 so the gauge always advances.
function effectiveSpd(state: BattleState, side: Side): number {
  const base = side === "A" ? state.dA.Spd : state.dB.Spd;
  let bonus = 0;
  for (const b of state.st[side].buffs) {
    if (b.t === "buff_spd") bonus += b.v;
  }
  // Meridian wind rage / opening / sapped speed scale the gauge fill.
  return spdWithPct(Math.max(1, base + bonus), spdPctOf(state.st[side]));
}

// Effective Cri for damage rolls — base derived Cri plus any `buff_cri`
// buffs currently active. Read inside the per-hit critPct call so a
// freshly-applied crit buff lands on the very next strike.
function effectiveCri(state: BattleState, side: Side, baseCri: number): number {
  let bonus = 0;
  for (const b of state.st[side].buffs) {
    if (b.t === "buff_cri") bonus += b.v;
  }
  return baseCri + bonus;
}

// Advance both sides' gauges by `dtMs` real-time milliseconds.
// Caps at THRESHOLD so animations land exactly on 100 (no overshoot).
export function tickGauges(state: BattleState, dtMs: number): void {
  if (state.winner) return;
  state.gA = Math.min(ATB_THRESHOLD, state.gA + gaugeRate(effectiveSpd(state, "A")) * dtMs);
  state.gB = Math.min(ATB_THRESHOLD, state.gB + gaugeRate(effectiveSpd(state, "B")) * dtMs);
}

// Returns whichever side has reached the threshold, or null if still filling.
// On simultaneous fill, A wins the tie (consistent with the original demo).
export function peekReadyActor(state: BattleState): Side | null {
  if (state.gA >= ATB_THRESHOLD && state.gB >= ATB_THRESHOLD)
    return state.gA >= state.gB ? "A" : "B";
  if (state.gA >= ATB_THRESHOLD) return "A";
  if (state.gB >= ATB_THRESHOLD) return "B";
  return null;
}

// Pay the threshold cost for taking a turn — carry-over preserved.
export function consumeGauge(state: BattleState, side: Side): void {
  if (side === "A") state.gA = Math.max(0, state.gA - ATB_THRESHOLD);
  else state.gB = Math.max(0, state.gB - ATB_THRESHOLD);
}

// Synchronous fast-path used by autoAdvance: ticks exactly to the next event.
export function getNextTurn(state: BattleState): Side {
  if (state.gA < ATB_THRESHOLD && state.gB < ATB_THRESHOLD) {
    const tA = (ATB_THRESHOLD - state.gA) / gaugeRate(effectiveSpd(state, "A"));
    const tB = (ATB_THRESHOLD - state.gB) / gaugeRate(effectiveSpd(state, "B"));
    tickGauges(state, Math.min(tA, tB));
    // Ticking by exactly the time-to-fill can land a hair under the
    // threshold in floating point (99.99999…); the side that was due must act.
    if (tA <= tB) state.gA = Math.max(state.gA, ATB_THRESHOLD);
    if (tB <= tA) state.gB = Math.max(state.gB, ATB_THRESHOLD);
  }
  const actor = peekReadyActor(state);
  if (!actor) {
    // Should be unreachable — Spd + BASELINE is always > 0.
    throw new Error("getNextTurn: no actor after tick");
  }
  consumeGauge(state, actor);
  return actor;
}

/**
 * Forecast the next `count` actors without touching the live battle. The side
 * already holding the turn (phase "player" / "enemy") comes first; the rest run
 * the real getNextTurn on a gauge-only copy, so carry-over, the +60 baseline and
 * active buff_spd all apply. Buff expiry is not simulated, so the tail of the
 * forecast is a projection, not a promise.
 */
export function predictTurnOrder(state: BattleState, count: number): Side[] {
  if (state.winner || count <= 0) return [];
  const order: Side[] = [];
  if (state.phase === "player") order.push("A");
  else if (state.phase === "enemy") order.push("B");
  const copy: BattleState = { ...state, gA: state.gA, gB: state.gB };
  while (order.length < count) order.push(getNextTurn(copy));
  return order;
}

export function decrementCooldowns(state: BattleState, side: Side): void {
  state.cd[side] = state.cd[side].map((v) => Math.max(0, v - 1));
  state.iaCD[side] = Math.max(0, state.iaCD[side] - 1);
}

// ─── Shared attack modifiers (moves and art actives) ───

/**
 * The Atk-term multiplier: attack stacks, gear `pct_atk`, the attacker's
 * `debuff_atk` and the meridian / frenzy Atk % (clamped ≥ 0).
 */
export function atkStackMod(ast: SideBattleState, equipPctAtk: number): number {
  let atkDebuff = 0;
  for (const d of ast.debuffs) if (d.t === "debuff_atk" && d.v != null) atkDebuff += d.v;
  return Math.max(0, 1 + (ast.stk * ast.stkV) / 100 + equipPctAtk / 100 + atkDebuff / 100 + atkPctOf(ast) / 100);
}

/** The IA multiplier from the attacker's `buff_iatk` records. */
export function iatkBuffMod(ast: SideBattleState): number {
  let iatkBuff = 0;
  for (const b of ast.buffs) if (b.t === "buff_iatk") iatkBuff += b.v;
  return 1 + iatkBuff / 100;
}

/** A `mult_iatk` / `mult_atk` passive's strength when its `v` is left out. */
export const MULT_IATK_DEFAULT = 12;
export const MULT_ATK_DEFAULT = 10;

/**
 * The primary art's damage passive for an attack of type `at`: `im` scales IA
 * (`mult_iatk`, internal attacks only), `ab` the Atk term (`mult_atk`; with a
 * `use_int` trigger only on internal attacks). A chance below 100 is rolled,
 * or folded in as its expected value when `expected` (the grid AI).
 */
export function artDamageMults(
  artId: string | null | undefined,
  at: AttackType,
  expected = false,
): { im: number; ab: number } {
  const out = { im: 1, ab: 1 };
  if (!artId || !at) return out;
  const pas = getArt(artId).pas;
  if (!pas || (pas.e.t !== "mult_iatk" && pas.e.t !== "mult_atk")) return out;
  if (pas.e.t === "mult_iatk" && at !== "int") return out;
  if (pas.tr === "use_int" && at !== "int") return out;
  const ch = Math.max(0, Math.min(100, pas.ch)) / 100;
  let share = 1;
  if (ch < 1) {
    if (expected) share = ch;
    else if (Math.random() >= ch) return out;
  }
  if (pas.e.t === "mult_iatk") out.im = 1 + (share * (pas.e.v ?? MULT_IATK_DEFAULT)) / 100;
  else out.ab = 1 + (share * (pas.e.v ?? MULT_ATK_DEFAULT)) / 100;
  return out;
}

/** Weapon-mastery multiplier for one family: `1 + mastery/200 × 0.5` (max ×1.5). */
export function masteryMod(mastery: number): number {
  return 1 + (Math.max(0, Math.min(200, mastery)) / 200) * 0.5;
}

/**
 * Mastery for an art active. An art has no weapon family of its own, so it
 * draws on the caster's best family (the inner force flows through the hands
 * or the weapon they know best).
 */
export function artMasteryMod(masteries: MasteryMap): number {
  let best = 0;
  for (const v of Object.values(masteries)) if (typeof v === "number" && v > best) best = v;
  return masteryMod(best);
}

/** The attack type of a damaging art active, or null for heals / buffs / poison. */
export function artActiveAttack(t: ArtActiveType): "phy" | "int" | null {
  switch (t) {
    case "atk_phy_pen":
    case "drain_phy":
      return "phy";
    case "atk_int_pen":
    case "drain":
    case "drain_acc":
    case "debuff_acc_dmg":
      return "int";
    default:
      return null;
  }
}

/** One side of an art active's damage roll. */
export interface ArtHitSide {
  d: Derived;
  st: SideBattleState;
  equip: EquipBonus;
}

/**
 * Raw (pre-crit, pre-riposte) damage of a damaging art active, with the same
 * modifiers as a move: Atk × stacks / gear `pct_atk` / `debuff_atk` / meridian
 * Atk %, IA × `buff_iatk` and the primary art's damage passive, mastery (the
 * caster's best family), the target's PD / ID % and `buff_def` − `debuff_def`,
 * and `buff_reduce` + gear `pct_reduce` (capped at PCT_REDUCE_CAP).
 * 0 for actives that deal no damage.
 */
export function artActiveRaw(
  act: Pick<ArtActive, "t" | "m" | "dm" | "pen">,
  atk: ArtHitSide & { masteries: MasteryMap; primaryArtId: string | null | undefined },
  def: ArtHitSide,
  expected = false,
): number {
  const kind = artActiveAttack(act.t);
  if (!kind) return 0;
  const mul = act.t === "debuff_acc_dmg" ? act.dm ?? 1 : act.m ?? 1;
  const pen = act.t === "atk_phy_pen" || act.t === "atk_int_pen" ? act.pen ?? 0 : 0;
  const sm = atkStackMod(atk.st, atk.equip.pct_atk);
  const pm = artDamageMults(atk.primaryArtId, kind, expected);
  const ta = kind === "phy" ? atk.d.PA : atk.d.IA * iatkBuffMod(atk.st) * pm.im;
  let fD = 0, pR = 0, dR = 0;
  for (const b of def.st.buffs) {
    if (b.t === "buff_def") fD += b.v;
    if (b.t === "buff_reduce") pR += b.v;
  }
  for (const d of def.st.debuffs) if (d.t === "debuff_def" && d.v != null) dR += Math.abs(d.v);
  pR = Math.min(PCT_REDUCE_CAP, pR + def.equip.pct_red);
  const defMul = 1 + defPctOf(def.st) / 100;
  const pierce = 1 - Math.max(0, Math.min(100, pen)) / 100;
  const ed = Math.max(0, (kind === "phy" ? def.d.PD : def.d.ID) * defMul * pierce + fD - dR);
  return Math.max(1, (atk.d.Atk * sm * pm.ab + ta) * mul * artMasteryMod(atk.masteries) - ed) * (1 - pR / 100);
}

// ─── Damage calculation ───
export interface DamageResult {
  hit: boolean;
  dmg: number;
  crit: boolean;
  hpPct: number;
  critPct: number;
  reflectDmg: number;
}

/** Consume before the hit roll: a miss spends the one-use stance too. */
function consumeRiposte(state: BattleState, side: Side): number {
  const charge = state.st[side].buffs.find((buff) => buff.t === "buff_riposte" && buff.u > 0);
  if (!charge) return 1;
  state.st[side].buffs = state.st[side].buffs.filter((buff) => buff.t !== "buff_riposte");
  return 1 + Math.max(0, charge.v) / 100;
}

export function calcSkillDamage(
  state: BattleState,
  side: Side,
  sk: Skill,
  ctx: BattleContext,
): DamageResult {
  const ds = opposite(side);
  const ad = side === "A" ? state.dA : state.dB;
  const dd = ds === "A" ? state.dA : state.dB;
  const ast = state.st[side];
  const dst = state.st[ds];
  const aid = ctx.artIds[side];
  const riposte = sk.at === "phy" ? consumeRiposte(state, side) : 1;

  // IAtk multiplier from buff_iatk and the primary art's damage passive
  // (mult_iatk on IA, mult_atk on the Atk term).
  const pm = artDamageMults(aid, sk.at);
  const im = iatkBuffMod(ast) * pm.im;
  const ab = pm.ab;

  // Stack ATK + equipment %ATK; debuff_atk on the attacker lowers it (≥ 0).
  const sm = atkStackMod(ast, ctx.equipBonus[side].pct_atk);

  // Effective Acc / Eva with debuffs/buffs
  let ea = ad.Acc * (1 + accPctOf(ast) / 100);
  for (const d of ast.debuffs) if (d.t === "debuff_acc" && d.v != null) ea = Math.max(0, ea + d.v);
  let ee = dd.Eva;
  for (const d of dst.debuffs) if (d.t === "debuff_eva" && d.v != null) ee = Math.max(0, ee + d.v);
  for (const b of dst.buffs) if (b.t === "buff_eva") ee += b.v;

  // Defender modifiers
  let fD = 0, pR = 0, dR = 0;
  let ref = 0;
  for (const b of dst.buffs) {
    if (b.t === "buff_def") fD += b.v;
    if (b.t === "buff_reduce") pR += b.v;
    if (b.t === "buff_reflect") ref = b.v;
  }
  for (const d of dst.debuffs) if (d.t === "debuff_def" && d.v != null) dR += Math.abs(d.v);
  // Damage reduction from buffs, gear and meridians stops at PCT_REDUCE_CAP.
  pR = Math.min(PCT_REDUCE_CAP, pR + ctx.equipBonus[ds].pct_red);

  // Mastery multiplier
  const mm = masteryMod(ctx.masteries[side][sk.w] ?? 0);

  // Damage formula. `bp` is scaled by the skill's level (lv1 → 50%, lv10 → 100%)
  // AND by any conflict factor on the skill's type tags (half / zero).
  const lv = ctx.skillLevels[side][sk.id];
  const conflictFactor = getStatusFactor(sk, ctx.conflict[side]);
  const eBp = effectiveBp(sk, typeof lv === "number" ? lv : 1) * conflictFactor;
  const ta = sk.at === "phy" ? ad.PA : ad.IA * im;
  const vitBonus = sk.vitScale ? sk.vitScale * (ctx.stats[side].VIT ?? 0) : 0;
  const se = eBp * (1 + sk.p / 100) + sk.f + vitBonus;
  const defMul = 1 + defPctOf(dst) / 100;
  // Pierce (`pen`) ignores that share of the target's PD / ID.
  const pierce = 1 - Math.max(0, Math.min(100, sk.pen ?? 0)) / 100;
  const ed = Math.max(0, (sk.at === "phy" ? dd.PD : dd.ID) * defMul * pierce + fD - dR);
  const raw = Math.max(1, (ad.Atk * sm * ab + ta + se) * sk.dm * mm - ed) * (1 - pR / 100);

  const hp = hitPct(ea, ee);
  if (Math.random() * 100 >= hp) {
    return { hit: false, dmg: 0, crit: false, hpPct: Math.round(hp), critPct: 0, reflectDmg: 0 };
  }
  const cp = Math.min(100, critPct(effectiveCri(state, side, ad.Cri), dd.Res) + criRateOf(ast));
  const crit = Math.random() * 100 < cp;
  const dmg = Math.round(raw * riposte * (crit ? CRIT_MULTIPLIER : 1));

  // The reflect is used up by the whole attack (resolveSkill drops it after
  // the last hit), so every landed hit of a multi-hit move reflects its share.
  const reflectDmg = ref > 0 ? Math.round(dmg * ref / 100) : 0;

  return { hit: true, dmg, crit, hpPct: Math.round(hp), critPct: Math.round(cp), reflectDmg };
}

// Stun check — true if the side has an active stun debuff. Tick has not yet
// decremented this turn, so durations look one larger than the player sees.
function isStunned(state: BattleState, side: Side): boolean {
  return state.st[side].debuffs.some((d) => d.t === "stun" && d.u > 0);
}

/**
 * Options for callers that drive battle.ts from outside the 1v1 loop (grid
 * combat). `tick: false` skips the global tickEffects at the top (the caller
 * already ticked). `secondary: true` resolves an extra target of an area cast:
 * no tick, no stun check, no cooldown / use count / MP cost, no self-effect —
 * only the damage roll(s) and the enemy effect on B.
 */
export interface ResolveOpts {
  tick?: boolean;
  secondary?: boolean;
  /** The caller already rolled the actor's blind (grid doSkill): don't roll it again. */
  blindChecked?: boolean;
}

// ─── Skill resolution ───
export function resolveSkill(
  state: BattleState,
  side: Side,
  slotIdx: number,
  skillId: string,
  ctx: BattleContext,
  opts?: ResolveOpts,
): void {
  const secondary = opts?.secondary === true;
  if (!secondary) state.turn++;
  // Per-turn HP regen from equipment is handled in tickEffects.
  if (!secondary && opts?.tick !== false)
    tickEffects(state, ctx.equipBonus.A.hp_regen, ctx.equipBonus.B.hp_regen, ctx.names, ctx.artIds.A, ctx.artIds.B);
  if (state.winner) return;

  if (!secondary && isStunned(state, side)) {
    const cls = side === "A" ? "lA" : "lB";
    logLine(state, cls, `[${state.turn}] ${escapeBattleText(ctx.names[side])} <span style="color:#AAA">ถูกสตัน — ข้ามตา!</span>`);
    return;
  }

  const skill = getSkill(skillId);
  if (!skill) return;
  if (!secondary) {
    state.cd[side][slotIdx] = skillCooldown(skill);
    state.skillUses[side][skillId] = (state.skillUses[side][skillId] ?? 0) + 1;
  }

  // Blind: the move is thrown but goes wide (cooldown spent, nothing lands).
  if (!secondary && !opts?.blindChecked && rollBlind(state.st[side])) {
    logLine(state, side === "A" ? "lA" : "lB", `[${state.turn}] ${blindFailLine(ctx.names[side])} <b>${skill.n}</b>`);
    emitCast(state, side, skill.n, 1, [0], [false], [true], skill.ti, { kind: "skill", id: skill.id });
    return;
  }

  const ds = opposite(side);
  const cls = side === "A" ? "lA" : "lB";
  const nm = escapeBattleText(ctx.names[side]);
  const tag = skillTag(skill);

  if (skill.at) {
    // Multi-hit: split the damage budget across `hits` rolls. Each hit
    // rolls hit/crit independently so the player sees actual flurry —
    // some can miss, others can crit. Per-hit damage is the full
    // calcSkillDamage divided by hit count, rounded so the total
    // approximates a single-hit cast (no free damage from multi-hit).
    const hitCount = Math.max(1, skill.hits ?? 1);
    const hitDamages: number[] = [];
    const hitCrits: boolean[] = [];
    const hitMisses: boolean[] = [];
    let firstProbe = "";
    let landed = false;
    let reflected = false;
    for (let h = 0; h < hitCount; h++) {
      if (state.winner) break;
      const res = calcSkillDamage(state, side, skill, ctx);
      const perHitDmg = Math.max(0, Math.round(res.dmg / hitCount));
      const probe = `<span class="lp">[โดน ${res.hpPct}% คริ ${res.critPct}%]</span>`;
      if (h === 0) firstProbe = probe;

      if (!res.hit) {
        hitDamages.push(0);
        hitCrits.push(false);
        hitMisses.push(true);
        const hitTag = hitCount > 1 ? ` <span class="lp">(ตี ${h + 1}/${hitCount})</span>` : "";
        logLine(
          state,
          cls,
          `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag} <span style="color:#AAA">พลาด!</span>${hitTag} ${probe}`,
        );
        continue;
      }

      // A meridian shield soaks first; what reaches HP is the hit shown.
      const hpDmg = landDamage(state, ds, perHitDmg);
      landed = true;
      hitDamages.push(hpDmg);
      hitCrits.push(res.crit);
      hitMisses.push(false);
      state.hitsReceived[ds]++;
      if ((ds === "A" ? state.hA : state.hB) > 0) rollRage(state, ds, ctx.meridian[ds]);

      const dt = res.crit
        ? `<span class="lC">★CRIT! ${perHitDmg}</span>`
        : `<b>${perHitDmg}</b>`;
      const hitTag = hitCount > 1 ? ` <span class="lp">(ตี ${h + 1}/${hitCount})</span>` : "";
      logLine(state, cls, `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag} ${dt}${hitTag} ${probe}`);

      // Life drain (per-hit)
      if (skill.dr && skill.dr > 0) {
        const heal = healHp(state, side, Math.round(perHitDmg * skill.dr / 100));
        logLine(state, "lS", `&nbsp;→ ดูดพลังชีวิต ${heal}`);
      }

      // Reflect on the caster: each landed hit reflects its share; the
      // buff is consumed once the whole cast is over (below).
      if (res.reflectDmg > 0) {
        reflected = true;
        const reflectPerHit = Math.round(res.reflectDmg / hitCount);
        if (side === "A") state.hA = Math.max(0, state.hA - reflectPerHit);
        else state.hB = Math.max(0, state.hB - reflectPerHit);
        logLine(state, "lS", `&nbsp;↩ สะท้อน ${reflectPerHit}`);
      }

      // on_hit weapon effect on attacker's weapon (fires every hit)
      const wId = ctx.weaponEquipIds[side];
      const wep = wId ? getEquip(wId) : null;
      if (wep && wep.eff && wep.eff.t === "on_hit") {
        const db = wep.eff.db;
        addDebuff(state, ds, { t: db.t, n: db.t.replace("debuff_", "") + "↓", v: db.v, u: db.u });
        logLine(state, "lS", `&nbsp;🗡 ${wep.n}: ${db.t.replace("debuff_", "")}${db.v}(${db.u}ตา)`);
      }

      if (res.crit) checkPassive(state, side, ctx.artIds[side], "on_crit", ctx.names);
      checkPassive(state, ds, ctx.artIds[ds], "hit_recv", ctx.names);
      if (skill.at === "int") checkPassive(state, side, ctx.artIds[side], "use_int", ctx.names);

      // Per-hit enemy effect: each landed hit applies the debuff again.
      // Stackable types (debuff_def / eva / acc / atk) accumulate via
      // addDebuff's stacking path; non-stackable types refresh duration.
      // Misses don't tick the debuff — only landed hits do.
      if (skill.ee) applyEnemyEffect(state, side, skill.ee, ctx.names);

      checkWin(state, ctx.names);
    }

    if (reflected) state.st[ds].buffs = state.st[ds].buffs.filter((b) => b.t !== "buff_reflect");
    // Meridian saps roll once per target an attack landed on.
    if (landed && !state.winner) rollSaps(state, side, ctx.meridian[side]);
    // Emit cast event for the UI overlay (skill name + per-hit damages).
    emitCast(state, side, skill.n, hitCount, hitDamages, hitCrits, hitMisses, skill.ti, { kind: "skill", id: skill.id });
    void firstProbe;
  } else {
    logLine(state, cls, `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag}`);
    // Pure buff / no-attack skills: ee fires once at the end (no hit
    // loop). Most pure-effect skills are buff-only anyway, but some have
    // a debuff payload (e.g., poison needles `pn` with no damage roll).
    if (skill.ee) applyEnemyEffect(state, side, skill.ee, ctx.names);
    // Buff / no-attack skills emit a single placeholder hit so the UI
    // still announces the cast name (no damage shown).
    emitCast(state, side, skill.n, 1, [0], [false], [false], skill.ti, { kind: "skill", id: skill.id });
  }

  if (!state.winner && !secondary) {
    // Self-effect (caster buff) fires once per cast — buffs don't stack
    // across the same cast's hits (would compound too aggressively).
    if (skill.se) applySelfEffect(state, side, skill.se, ctx.names);
  }
  logLine(state, "lS", `&nbsp;A:${state.hA}/${state.dA.HP} · B:${state.hB}/${state.dB.HP}`);
}

// Stash the most recent skill / art cast so the UI overlay can pick it
// up. `seq` increments on every emit so React's effect can detect repeat
// casts of the same skill (the overlay re-keys off seq). Also sets
// `castEndsAt` so the ATB tick / AI scheduler pause for the duration of
// the staggered animation, letting it play out before the next turn.
//
// Animation sequence (must stay in sync with cast-overlay CSS):
//   - 0.00s: skill name pops in
//   - 0.30s: hit 1 damage pops
//   - 0.40s: hit 2 damage pops
//   - 0.30s + (n-1)*0.10s: hit n
//   - +0.50s tail so the last hit can finish its animation
let castSeq = 0;
const CAST_NAME_MS = 300;        // skill name display
const CAST_HIT_STAGGER_MS = 100; // gap between consecutive hit pops
const CAST_TAIL_MS = 500;        // tail after last hit so it can fade
function emitCast(
  state: BattleState,
  side: Side,
  name: string,
  hits: number,
  hitDamages: number[],
  hitCrits: boolean[],
  hitMisses: boolean[],
  tier: import("./types").SkillTierIndex,
  source?: { kind: "skill" | "art"; id: string },
): void {
  castSeq = (castSeq + 1) | 0;
  const allMissed = hitMisses.length > 0 && hitMisses.every((m) => m);
  state.lastCast = {
    seq: castSeq,
    side,
    name,
    hits,
    tier,
    hitDamages,
    hitCrits,
    hitMisses,
    source,
  };
  void allMissed;
  state.castEndsAt =
    Date.now() + CAST_NAME_MS + hits * CAST_HIT_STAGGER_MS + CAST_TAIL_MS;
}

function skillTag(sk: Skill): string {
  if (sk.at === "phy") return "⚔";
  if (sk.at === "int") return "💜";
  if (sk.se) return "⟳";
  return "💥";
}

// ─── Internal-art active resolution ───
//
// `opts.slotIdx` makes the call slot-aware: cooldown lives in cd[slotIdx]
// instead of the legacy iaCD[side]. `opts.artId` overrides ctx.artIds[side]
// when a different art was slotted at that index. Both default to the
// legacy single-art path so nothing changes for /debug or older callers.
export function resolveArtActive(
  state: BattleState,
  side: Side,
  ctx: BattleContext,
  opts?: { slotIdx?: number; artId?: string } & ResolveOpts,
): boolean {
  const aid = opts?.artId ?? ctx.artIds[side];
  const art = getArt(aid);
  if (!art.act) return false;
  const act = art.act;
  const secondary = opts?.secondary === true;

  if (!secondary) {
    const slotIdx = opts?.slotIdx;
    const onCd =
      typeof slotIdx === "number" ? state.cd[side][slotIdx] : state.iaCD[side];
    if (onCd > 0) {
      logLine(state, "lS", `[ท่าออกพลัง] ${escapeBattleText(ctx.names[side])}: ยังพักอีก ${onCd} ตา`);
      return false;
    }
    const mp = side === "A" ? state.mpA : state.mpB;
    if (mp < act.c) {
      logLine(state, "lS", `[ท่าออกพลัง] ${escapeBattleText(ctx.names[side])}: ปราณไม่พอ`);
      return false;
    }

    state.turn++;
    if (opts?.tick !== false)
      tickEffects(state, ctx.equipBonus.A.hp_regen, ctx.equipBonus.B.hp_regen, ctx.names, ctx.artIds.A, ctx.artIds.B);
    if (state.winner) return true;

    // A stunned caster loses the turn before paying anything (like a move:
    // no MP, no cooldown, no use recorded).
    if (isStunned(state, side)) {
      const stunCls = side === "A" ? "lA" : "lB";
      logLine(state, stunCls, `[${state.turn}] ${escapeBattleText(ctx.names[side])} <span style="color:#AAA">ถูกสตัน — ข้ามตา!</span>`);
      return true;
    }

    if (side === "A") state.mpA -= act.c;
    else state.mpB -= act.c;
    if (typeof slotIdx === "number") state.cd[side][slotIdx] = act.cd;
    else state.iaCD[side] = act.cd;

    // Track art active uses for the world's per-art XP track.
    state.artUses[side][art.id] = (state.artUses[side][art.id] ?? 0) + 1;
  }
  if (state.winner) return true;
  // Blind: the art is spent (MP, cooldown) but its power goes astray.
  if (!secondary && !opts?.blindChecked && rollBlind(state.st[side])) {
    logLine(state, side === "A" ? "lA" : "lB", `[${state.turn}] ${blindFailLine(ctx.names[side])} ⚡<b>${act.n}</b>`);
    emitCast(state, side, act.n, 1, [0], [false], [true], art.ti, { kind: "art", id: art.id });
    return true;
  }

  const cls = side === "A" ? "lA" : "lB";
  const nm = escapeBattleText(ctx.names[side]);
  const ds = opposite(side);
  const ad = side === "A" ? state.dA : state.dB;
  const dd = ds === "A" ? state.dA : state.dB;
  const dst = state.st[ds];
  let landed = false;

  let ref = 0;
  const riposte = artActiveAttack(act.t) === "phy" ? consumeRiposte(state, side) : 1;
  for (const b of dst.buffs) if (b.t === "buff_reflect") ref = b.v;
  // The damage roll, with every modifier a move gets (artActiveRaw).
  const rawDamage = () =>
    artActiveRaw(
      act,
      { d: ad, st: state.st[side], equip: ctx.equipBonus[side], masteries: ctx.masteries[side], primaryArtId: ctx.artIds[side] },
      { d: dd, st: dst, equip: ctx.equipBonus[ds] },
    );

  // Cast tracking — emitCast at the bottom uses these.
  let castDmg = 0;
  let castCrit = false;
  let castMiss = false;

  const probe = (hp: number, cp: number) => `<span class="lp">[โดน ${hp}% คริ ${cp}%]</span>`;

  const computeMissProbe = () => {
    let ea = ad.Acc * (1 + accPctOf(state.st[side]) / 100);
    for (const d of state.st[side].debuffs) if (d.t === "debuff_acc" && d.v != null) ea = Math.max(0, ea + d.v);
    let ee = dd.Eva;
    for (const d of dst.debuffs) if (d.t === "debuff_eva" && d.v != null) ee = Math.max(0, ee + d.v);
    for (const b of dst.buffs) if (b.t === "buff_eva") ee += b.v;
    return {
      ea, ee,
      hp: Math.round(hitPct(ea, ee)),
      cp: Math.round(Math.min(100, critPct(effectiveCri(state, side, ad.Cri), dd.Res) + criRateOf(state.st[side]))),
    };
  };

  // doAtkHit applies damage, optional reflect; returns final dmg + crit flag.
  const doAtkHit = (rawDmg: number, hc: { cp: number }) => {
    const crit = Math.random() * 100 < hc.cp;
    const dealt = Math.round(rawDmg * riposte * (crit ? CRIT_MULTIPLIER : 1));
    state.hitsReceived[ds]++;
    // A meridian shield soaks first; then the defender's rages roll.
    const dmg = landDamage(state, ds, dealt);
    landed = true;
    if ((ds === "A" ? state.hA : state.hB) > 0) rollRage(state, ds, ctx.meridian[ds]);
    if (ref > 0) {
      const rd = Math.round(dmg * ref / 100);
      if (side === "A") state.hA = Math.max(0, state.hA - rd);
      else state.hB = Math.max(0, state.hB - rd);
      state.st[ds].buffs = dst.buffs.filter((b) => b.t !== "buff_reflect");
      logLine(state, "lS", `&nbsp;↩ สะท้อน${rd}`);
    }
    castDmg += dmg;
    if (crit) castCrit = true;
    return { dmg, crit };
  };

  switch (act.t) {
    case "heal": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const want = Math.round(cap * (act.h ?? 0) / 100);
      const blocked = isScorched(state.st[side]);
      healHp(state, side, want);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ฟื้น <b>${blocked ? 0 : want}</b> พลังชีวิต${blocked ? " (ถูกแผดเผา ฟื้นไม่ได้)" : ""}`);
      break;
    }
    case "heal_cleanse": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      // The cleanse comes first: wiping a scorch lets the heal through.
      const removed = state.st[side].debuffs.pop();
      const want = Math.round(cap * (act.h ?? 0) / 100);
      const blocked = isScorched(state.st[side]);
      healHp(state, side, want);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ฟื้น <b>${blocked ? 0 : want}</b> พลังชีวิต${blocked ? " (ถูกแผดเผา ฟื้นไม่ได้)" : ""}${removed ? ` +ลบ[${removed.n}]` : ""}`);
      break;
    }
    case "heal_full_cleanse": {
      const hpCap = side === "A" ? state.dA.HP : state.dB.HP;
      const mpCap = side === "A" ? state.dA.MP : state.dB.MP;
      const hpHeal = Math.round(hpCap * (act.h ?? 0) / 100);
      const mpHeal = Math.round(mpCap * (act.mh ?? 0) / 100);
      // Cleanse first (a scorch goes with the rest), then heal.
      const removedCount = state.st[side].debuffs.length;
      state.st[side].debuffs = [];
      healHp(state, side, hpHeal);
      if (side === "A") state.mpA = Math.min(mpCap, state.mpA + mpHeal);
      else state.mpB = Math.min(mpCap, state.mpB + mpHeal);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ฟื้นพลังชีวิต <b>${hpHeal}</b> / ปราณ <b>${mpHeal}</b> + ล้างสถานะผิดปกติ ${removedCount} อย่าง`);
      break;
    }
    case "atk_phy_pen": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>⚔ ${dt} ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "atk_int_pen": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>💜 ${dt} ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "buff_reflect": {
      addReflectBuff(state, side, act.v ?? 0, act.u ?? 1);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → สะท้อน${act.v}%(${act.u}ตา)`);
      break;
    }
    case "buff_reduce": {
      addReduceBuff(state, side, act.v ?? 0, act.u ?? 1);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ลดความเสียหาย ${act.v}% (${act.u} ตา)`);
      break;
    }
    case "buff_spd": {
      addBuff(state, side, { t: "buff_spd", n: act.n, v: act.v ?? 0, u: act.u ?? 1 });
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ความเร็ว +${act.v} (${act.u} ตา)`);
      break;
    }
    case "drain": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const heal = healHp(state, side, Math.round(r.dmg * (act.h ?? 0) / 100));
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>💜 ${dt} + ฟื้น <b>${heal}</b> ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "drain_phy": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const heal = healHp(state, side, Math.round(r.dmg * (act.h ?? 0) / 100));
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>⚔ ${dt} + ฟื้น <b>${heal}</b> ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "drain_acc": {
      addDebuff(state, ds, { t: "debuff_acc", n: "จุดจำ", v: act.adv ?? 0, u: 2 });
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → แม่นยำ ${act.adv} + <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const heal = healHp(state, side, Math.round(r.dmg * (act.h ?? 0) / 100));
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>💜 ${dt} + ฟื้น <b>${heal}</b> ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "debuff_acc_dmg": {
      // Debuff applies regardless of hit
      addDebuff(state, ds, { t: "debuff_acc", n: "สับสน", v: act.ad ?? 0, u: act.u ?? 2 });
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        castMiss = true;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → แม่นยำ ${act.ad} + <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const raw = rawDamage();
        const r = doAtkHit(raw, hc);
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → แม่นยำ ${act.ad} + ${dt} ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "debuff_poison": {
      addDebuff(state, ds, { t: "debuff_poison", n: "พิษ", pp: act.pp ?? 0, u: act.u ?? 2 });
      addDebuff(state, ds, { t: "debuff_eva", n: "พิษ (หลบหลีก)", v: act.ev ?? 0, u: act.u ?? 2 });
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → พิษ ${act.pp}%/ตา หลบหลีก ${act.ev}`);
      break;
    }
    case "buff_eva_debuff_eva": {
      addEvaBuff(state, side, act.selfV ?? 0, act.u ?? 2);
      addDebuff(state, ds, { t: "debuff_eva", n: "ทราย", v: act.eneV ?? 0, u: act.u ?? 2 });
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → หลบหลีก +${act.selfV} / ศัตรูหลบหลีก ${act.eneV} (${act.u} ตา)`);
      break;
    }

    default: {
      // Every kind needs a case above: a new variant without one is a type error.
      const unhandled: never = act.t;
      void unhandled;
    }
  }

  // Meridian saps: once, when the active's attack landed.
  if (landed && !state.winner) rollSaps(state, side, ctx.meridian[side]);

  // Fire the use_act passive for the art that was just activated (not the
  // primary). If multiple arts are slotted, each uses its own passive set.
  if (art.pas?.tr === "use_act" && !secondary) checkPassive(state, side, aid, "use_act", ctx.names);

  // use_int trigger — Int-flavored art actives (atk_int_pen / drain /
  // drain_acc / debuff_acc_dmg all roll off IA) should fire the primary
  // art's use_int passive too. Without this, e.g., t3_onefinger's
  // "นิ้วฟ้าผ่า" wouldn't apply its own debuff_acc payload despite being
  // a clear Int cast — the passive used to fire only on Int MOVE skills.
  const intActiveTypes = new Set(["atk_int_pen", "drain", "drain_acc", "debuff_acc_dmg"]);
  if (intActiveTypes.has(act.t)) {
    // Use the primary art (ctx.artIds[side]) so the passive ties to the
    // build's main inner-art rather than each slotted art individually.
    checkPassive(state, side, ctx.artIds[side], "use_int", ctx.names);
  }

  // Emit cast event for the UI overlay. Art actives are always 1 logical
  // cast (no engine-side multi-hit), so hits=1.
  emitCast(
    state,
    side,
    act.n,
    1,
    [castDmg],
    [castCrit],
    [castMiss],
    art.ti,
    { kind: "art", id: art.id },
  );

  logLine(state, "lS", `&nbsp;A:${state.hA}/${state.dA.HP} · B:${state.hB}/${state.dB.HP}`);
  return true;
}

function addReflectBuff(state: BattleState, side: Side, v: number, u: number) {
  const list = state.st[side].buffs.filter((x) => x.t !== "buff_reflect");
  list.push({ t: "buff_reflect", n: "สะท้อน", v, u });
  state.st[side].buffs = list;
}
function addReduceBuff(state: BattleState, side: Side, v: number, u: number) {
  const list = state.st[side].buffs.filter((x) => x.t !== "buff_reduce");
  list.push({ t: "buff_reduce", n: "เกราะ", v, u });
  state.st[side].buffs = list;
}
function addEvaBuff(state: BattleState, side: Side, v: number, u: number) {
  const list = state.st[side].buffs.filter((x) => x.t !== "buff_eva");
  list.push({ t: "buff_eva", n: "ว่องไว", v, u });
  state.st[side].buffs = list;
}
