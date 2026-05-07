import type {
  BattleState,
  CharacterBuild,
  Side,
  Skill,
} from "./types";
import {
  deriveAll,
  getEquipBonus,
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
import {
  applyEnemyEffect,
  applySelfEffect,
  checkPassive,
  checkWin,
  logLine,
  opposite,
  tickEffects,
  addDebuff,
} from "./effects";

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
    equipBonus: { A: getEquipBonus(buildA.equipment), B: getEquipBonus(buildB.equipment) },
    masteries: {
      A: getMasteryMap(buildA.skillIds, lvA, conflictA),
      B: getMasteryMap(buildB.skillIds, lvB, conflictB),
    },
    skillLevels: { A: lvA, B: lvB },
    conflict: { A: conflictA, B: conflictB },
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
      A: { buffs: [], debuffs: [], stk: 0 },
      B: { buffs: [], debuffs: [], stk: 0 },
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
  return Math.max(1, base + bonus);
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
  }
  const actor = peekReadyActor(state);
  if (!actor) {
    // Should be unreachable — Spd + BASELINE is always > 0.
    throw new Error("getNextTurn: no actor after tick");
  }
  consumeGauge(state, actor);
  return actor;
}

export function decrementCooldowns(state: BattleState, side: Side): void {
  state.cd[side] = state.cd[side].map((v) => Math.max(0, v - 1));
  state.iaCD[side] = Math.max(0, state.iaCD[side] - 1);
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

  // IAtk multiplier from buff_iatk + art-specific bonuses
  let iatkBuff = 0;
  for (const b of ast.buffs) if (b.t === "buff_iatk") iatkBuff += b.v;

  let im = 1 + iatkBuff / 100;
  let ab = 1;
  if (aid === "taiji" && sk.at === "int") im = (1 + iatkBuff / 100) * 1.12;
  if (aid === "scholar" && sk.at === "int") {
    im = 1 + iatkBuff / 100;
    ab = 1.10;
  }

  // Stack ATK + equipment %ATK
  const sm = 1 + ast.stk * 0.03 + ctx.equipBonus[side].pct_atk / 100;

  // Effective Acc / Eva with debuffs/buffs
  let ea = ad.Acc;
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
  pR += ctx.equipBonus[ds].pct_red;

  // Mastery multiplier
  const mas = ctx.masteries[side][sk.w] ?? 0;
  const mm = 1 + (mas / 200) * 0.5;

  // Damage formula. `bp` is scaled by the skill's level (lv1 → 50%, lv10 → 100%)
  // AND by any conflict factor on the skill's type tags (half / zero).
  const lv = ctx.skillLevels[side][sk.id];
  const conflictFactor = getStatusFactor(sk, ctx.conflict[side]);
  const eBp = effectiveBp(sk, typeof lv === "number" ? lv : 1) * conflictFactor;
  const ta = sk.at === "phy" ? ad.PA : ad.IA * im;
  const se = eBp * (1 + sk.p / 100) + sk.f;
  const ed = Math.max(0, (sk.at === "phy" ? dd.PD : dd.ID) + fD - dR);
  const raw = Math.max(1, (ad.Atk * sm * ab + ta + se) * sk.dm * mm - ed) * (1 - pR / 100);

  const hp = hitPct(ea, ee);
  if (Math.random() * 100 >= hp) {
    return { hit: false, dmg: 0, crit: false, hpPct: Math.round(hp), critPct: 0, reflectDmg: 0 };
  }
  const cp = critPct(ad.Cri, dd.Res);
  const crit = Math.random() * 100 < cp;
  const dmg = Math.round(raw * (crit ? CRIT_MULTIPLIER : 1));

  let reflectDmg = 0;
  if (ref > 0) {
    reflectDmg = Math.round(dmg * ref / 100);
    state.st[ds].buffs = dst.buffs.filter((b) => b.t !== "buff_reflect");
  }

  return { hit: true, dmg, crit, hpPct: Math.round(hp), critPct: Math.round(cp), reflectDmg };
}

// ─── Skill resolution ───
export function resolveSkill(
  state: BattleState,
  side: Side,
  slotIdx: number,
  skillId: string,
  ctx: BattleContext,
): void {
  state.turn++;
  // Per-turn HP regen from equipment is handled in tickEffects.
  tickEffects(state, ctx.equipBonus.A.hp_regen, ctx.equipBonus.B.hp_regen, ctx.names);
  if (state.winner) return;

  const skill = getSkill(skillId);
  if (!skill) return;
  state.cd[side][slotIdx] = TIERS[skill.ti].cd;
  state.skillUses[side][skillId] = (state.skillUses[side][skillId] ?? 0) + 1;

  const ds = opposite(side);
  const cls = side === "A" ? "lA" : "lB";
  const nm = ctx.names[side];
  const tag = skillTag(skill);

  if (skill.at) {
    const res = calcSkillDamage(state, side, skill, ctx);
    const probe = `<span class="lp">[hit${res.hpPct}% crit${res.critPct}%]</span>`;

    if (!res.hit) {
      logLine(state, cls, `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag} <span style="color:#AAA">พลาด!</span> ${probe}`);
    } else {
      state.hitsReceived[ds]++;
      if (ds === "A") state.hA = Math.max(0, state.hA - res.dmg);
      else state.hB = Math.max(0, state.hB - res.dmg);

      const dt = res.crit ? `<span class="lC">★CRIT! ${res.dmg}</span>` : `<b>${res.dmg}</b>`;
      logLine(state, cls, `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag} ${dt} ${probe}`);

      // Life drain
      if (skill.dr && skill.dr > 0) {
        const heal = Math.round(res.dmg * skill.dr / 100);
        const cap = side === "A" ? state.dA.HP : state.dB.HP;
        if (side === "A") state.hA = Math.min(cap, state.hA + heal);
        else state.hB = Math.min(cap, state.hB + heal);
        logLine(state, "lS", `&nbsp;→ ดูด ${heal} HP`);
      }

      // Reflect on caster
      if (res.reflectDmg > 0) {
        if (side === "A") state.hA = Math.max(0, state.hA - res.reflectDmg);
        else state.hB = Math.max(0, state.hB - res.reflectDmg);
        logLine(state, "lS", `&nbsp;↩ สะท้อน ${res.reflectDmg}`);
      }

      // on_hit weapon effect on attacker's weapon
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

      checkWin(state, ctx.names);
    }
  } else {
    logLine(state, cls, `[${state.turn}] ${nm} → <b>${skill.n}</b>${tag}`);
  }

  if (!state.winner) {
    if (skill.se) applySelfEffect(state, side, skill.se, ctx.names);
    if (skill.ee) applyEnemyEffect(state, side, skill.ee, ctx.names);
  }
  logLine(state, "lS", `&nbsp;A:${state.hA}/${state.dA.HP} · B:${state.hB}/${state.dB.HP}`);
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
  opts?: { slotIdx?: number; artId?: string },
): boolean {
  const aid = opts?.artId ?? ctx.artIds[side];
  const art = getArt(aid);
  if (!art.act) return false;
  const act = art.act;

  const slotIdx = opts?.slotIdx;
  const onCd =
    typeof slotIdx === "number" ? state.cd[side][slotIdx] : state.iaCD[side];
  if (onCd > 0) {
    logLine(state, "lS", `[IA] ${ctx.names[side]}: กำลังภายใน CD ${onCd}`);
    return false;
  }
  const mp = side === "A" ? state.mpA : state.mpB;
  if (mp < act.c) {
    logLine(state, "lS", `[IA] ${ctx.names[side]}: MP ไม่พอ`);
    return false;
  }

  if (side === "A") state.mpA -= act.c;
  else state.mpB -= act.c;
  if (typeof slotIdx === "number") state.cd[side][slotIdx] = act.cd;
  else state.iaCD[side] = act.cd;

  // Track art active uses for the world's per-art XP track.
  state.artUses[side][art.id] = (state.artUses[side][art.id] ?? 0) + 1;

  state.turn++;
  tickEffects(state, ctx.equipBonus.A.hp_regen, ctx.equipBonus.B.hp_regen, ctx.names);
  if (state.winner) return true;

  const cls = side === "A" ? "lA" : "lB";
  const nm = ctx.names[side];
  const ds = opposite(side);
  const ad = side === "A" ? state.dA : state.dB;
  const dd = ds === "A" ? state.dA : state.dB;
  const dst = state.st[ds];

  let fD = 0, pR = 0, ref = 0;
  for (const b of dst.buffs) {
    if (b.t === "buff_def") fD += b.v;
    if (b.t === "buff_reduce") pR += b.v;
    if (b.t === "buff_reflect") ref = b.v;
  }

  const probe = (hp: number, cp: number) => `<span class="lp">[hit${hp}% crit${cp}%]</span>`;

  const computeMissProbe = () => {
    let ea = ad.Acc;
    for (const d of state.st[side].debuffs) if (d.t === "debuff_acc" && d.v != null) ea = Math.max(0, ea + d.v);
    let ee = dd.Eva;
    for (const d of dst.debuffs) if (d.t === "debuff_eva" && d.v != null) ee = Math.max(0, ee + d.v);
    for (const b of dst.buffs) if (b.t === "buff_eva") ee += b.v;
    return {
      ea, ee,
      hp: Math.round(hitPct(ea, ee)),
      cp: Math.round(critPct(ad.Cri, dd.Res)),
    };
  };

  // doAtkHit applies damage, optional reflect; returns final dmg + crit flag.
  const doAtkHit = (rawDmg: number, hc: { cp: number }) => {
    const crit = Math.random() * 100 < hc.cp;
    const dmg = Math.round(rawDmg * (crit ? CRIT_MULTIPLIER : 1));
    state.hitsReceived[ds]++;
    if (ds === "A") state.hA = Math.max(0, state.hA - dmg);
    else state.hB = Math.max(0, state.hB - dmg);
    if (ref > 0) {
      const rd = Math.round(dmg * ref / 100);
      if (side === "A") state.hA = Math.max(0, state.hA - rd);
      else state.hB = Math.max(0, state.hB - rd);
      state.st[ds].buffs = dst.buffs.filter((b) => b.t !== "buff_reflect");
      logLine(state, "lS", `&nbsp;↩ สะท้อน${rd}`);
    }
    return { dmg, crit };
  };

  switch (act.t) {
    case "heal": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * (act.h ?? 0) / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ฟื้น <b>${heal}</b> HP`);
      break;
    }
    case "heal_cleanse": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * (act.h ?? 0) / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      const removed = state.st[side].debuffs.pop();
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ฟื้น <b>${heal}</b> HP${removed ? ` +ลบ[${removed.n}]` : ""}`);
      break;
    }
    case "atk_phy_pen": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const m = act.m ?? 1, pen = act.pen ?? 0;
        const raw = Math.max(1, (ad.Atk + ad.PA) * m - (dd.PD * (1 - pen / 100) + fD)) * (1 - pR / 100);
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
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const m = act.m ?? 1, pen = act.pen ?? 0;
        const raw = Math.max(1, (ad.Atk + ad.IA) * m - (dd.ID * (1 - pen / 100) + fD)) * (1 - pR / 100);
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
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → ลดdmg${act.v}%(${act.u}ตา)`);
      break;
    }
    case "drain": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const m = act.m ?? 1;
        const raw = Math.max(1, (ad.Atk + ad.IA) * m - (dd.ID + fD)) * (1 - pR / 100);
        const r = doAtkHit(raw, hc);
        const heal = Math.round(r.dmg * (act.h ?? 0) / 100);
        const cap = side === "A" ? state.dA.HP : state.dB.HP;
        if (side === "A") state.hA = Math.min(cap, state.hA + heal);
        else state.hB = Math.min(cap, state.hB + heal);
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b>💜 ${dt} + ฟื้น <b>${heal}</b> ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "drain_phy": {
      const hc = computeMissProbe();
      if (Math.random() * 100 >= hc.hp) {
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const m = act.m ?? 1;
        const raw = Math.max(1, (ad.Atk + ad.PA) * m - (dd.PD + fD)) * (1 - pR / 100);
        const r = doAtkHit(raw, hc);
        const heal = Math.round(r.dmg * (act.h ?? 0) / 100);
        const cap = side === "A" ? state.dA.HP : state.dB.HP;
        if (side === "A") state.hA = Math.min(cap, state.hA + heal);
        else state.hB = Math.min(cap, state.hB + heal);
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
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → Acc${act.adv} + <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const m = act.m ?? 1;
        const raw = Math.max(1, (ad.Atk + ad.IA) * m - (dd.ID + fD)) * (1 - pR / 100);
        const r = doAtkHit(raw, hc);
        const heal = Math.round(r.dmg * (act.h ?? 0) / 100);
        const cap = side === "A" ? state.dA.HP : state.dB.HP;
        if (side === "A") state.hA = Math.min(cap, state.hA + heal);
        else state.hB = Math.min(cap, state.hB + heal);
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
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → Acc${act.ad} + <span style="color:#AAA">พลาด!</span> ${probe(hc.hp, hc.cp)}`);
      } else {
        const dm = act.dm ?? 1;
        const raw = Math.max(1, (ad.Atk + ad.IA) * dm - (dd.ID + fD)) * (1 - pR / 100);
        const r = doAtkHit(raw, hc);
        const dt = r.crit ? `<span class="lC">★CRIT! ${r.dmg}</span>` : `<b>${r.dmg}</b>`;
        logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → Acc${act.ad} + ${dt} ${probe(hc.hp, hc.cp)}`);
        checkWin(state, ctx.names);
      }
      break;
    }
    case "debuff_poison": {
      addDebuff(state, ds, { t: "debuff_poison", n: "พิษ", pp: act.pp ?? 0, u: act.u ?? 2 });
      addDebuff(state, ds, { t: "debuff_eva", n: "พิษEva", v: act.ev ?? 0, u: act.u ?? 2 });
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → พิษ${act.pp}%/ตา Eva${act.ev}`);
      break;
    }
    case "buff_eva_debuff_eva": {
      addEvaBuff(state, side, act.selfV ?? 0, act.u ?? 2);
      addDebuff(state, ds, { t: "debuff_eva", n: "ทราย", v: act.eneV ?? 0, u: act.u ?? 2 });
      logLine(state, cls, `[${state.turn}] ${nm} ⚡<b>${act.n}</b> → Eva+${act.selfV} / ศัตรู Eva${act.eneV}(${act.u}ตา)`);
      break;
    }
  }

  // Fire the use_act passive for the art that was just activated (not the
  // primary). If multiple arts are slotted, each uses its own passive set.
  if (art.pas?.tr === "use_act") checkPassive(state, side, aid, "use_act", ctx.names);

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

