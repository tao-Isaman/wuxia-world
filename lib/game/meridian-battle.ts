// ชีพจร in battle — what filled meridian points (rank 3) do in a fight.
// Pure helpers over the shared BattleState / SideBattleState shapes, used by
// battle.ts (hits, saps, the % statuses in the damage math) and the grid
// engine (battle start, revive). Content: MeridianNode.effects.
//
//   opening — entering battle: a % status for the unit's first `turns` turns
//   shield  — entering battle: soaks `pct` % of max HP of incoming hits first
//   ward    — entering battle: blocks the next `count` debuffs (effects.ts addDebuff)
//   revive  — once: on falling, rise with `hpPct` % of max HP (grid settle)
//   rage    — when hit: `chance` % for an elemental stack (≤ maxStacks each)
//   sap     — when an attack lands: `chance` % to lower the target's stat
//
// Durations count the owner's own turns: a status meant to last N turns is
// stored with u = N + 1, because a unit's statuses tick at the start of its
// turn (the opening is up for turns 1…N, gone at N + 1).

import type { BattleState, BuffRecord, Derived, Side, SideBattleState } from "./types";
import {
  MERIDIAN_ELEMENT_LABEL,
  type MeridianDebuffStat,
  type MeridianEffect,
  type MeridianElement,
  type MeridianOpeningStat,
} from "./meridian-types";
import { addBuff, addDebuff, logLine, pushProc } from "./effects";

/** Thai names of the stats an opening raises / a sap lowers. */
export const MERIDIAN_STAT_LABEL: Readonly<Record<MeridianOpeningStat, string>> = {
  atk: "พลังโจมตี", def: "พลังป้องกัน", spd: "ความเร็ว", cri: "โอกาสคริติคอล",
  eva: "หลบหลีก", acc: "แม่นยำ", reduce: "ลดความเสียหาย",
};

/** The status an elemental rage stack is. */
export const MERIDIAN_ELEMENT_STATUS: Readonly<Record<MeridianElement, BuffRecord["t"]>> = {
  fire: "buff_atk_pct", water: "buff_regen", wind: "buff_spd_pct", earth: "buff_def_pct", thunder: "buff_cri_rate",
};

export const SHIELD_LABEL = "โล่ชีพจร";
export const WARD_LABEL = "ผนึกชีพจร";
export const REVIVE_LABEL = "คืนชีพ";

const sumBuff = (st: SideBattleState, t: BuffRecord["t"]) => {
  let v = 0;
  for (const b of st.buffs) if (b.t === t) v += b.v;
  return v;
};

// ─── The % statuses in the math ───────────────────────────────────────
/** Attack +% (fire rage, opening atk, a boss frenzy). Added to the damage multiplier. */
export const atkPctOf = (st: SideBattleState) => sumBuff(st, "buff_atk_pct") + sumBuff(st, "frenzy");
/** PD / ID +% (earth rage, opening def). */
export const defPctOf = (st: SideBattleState) => sumBuff(st, "buff_def_pct");
/** Crit chance + points (thunder rage, opening cri). */
export const criRateOf = (st: SideBattleState) => sumBuff(st, "buff_cri_rate");
/** Accuracy +% (opening acc). */
export const accPctOf = (st: SideBattleState) => sumBuff(st, "buff_acc_pct");
/** Gauge-fill +% (wind rage, opening spd) minus sapped speed. Floor −90. */
export function spdPctOf(st: SideBattleState): number {
  let v = sumBuff(st, "buff_spd_pct");
  for (const d of st.debuffs) if (d.t === "debuff_spd" && d.v != null) v -= Math.abs(d.v);
  return Math.max(-90, v);
}

/**
 * Spd that fills the ATB gauge `pct` % faster than `spd` does (the gauge
 * rate is (Spd + 60) / 2600, so the baseline scales too). Floor 1.
 */
export function spdWithPct(spd: number, pct: number): number {
  if (!pct) return spd;
  return Math.max(1, (spd + 60) * (1 + pct / 100) - 60);
}

// ─── Battle start ─────────────────────────────────────────────────────
export interface MeridianStart {
  buffs: BuffRecord[];
  /** hpPct of a pending revive (the best one), or undefined. */
  revive?: number;
  procs: { kind: "opening" | "shield" | "ward"; label: string }[];
}

const OPENING_STATUS: Partial<Record<MeridianOpeningStat, BuffRecord["t"]>> = {
  atk: "buff_atk_pct", def: "buff_def_pct", spd: "buff_spd_pct", cri: "buff_cri_rate", acc: "buff_acc_pct", reduce: "buff_reduce",
};

/** The statuses a unit enters battle with (opening, shield, ward) and its revive. */
export function meridianStart(effects: readonly MeridianEffect[], derived: Derived): MeridianStart {
  const out: MeridianStart = { buffs: [], procs: [] };
  let shield = 0, ward = 0;
  for (const e of effects) {
    switch (e.t) {
      case "opening": {
        const label = MERIDIAN_STAT_LABEL[e.stat];
        const u = Math.max(1, e.turns) + 1;
        const n = `เปิดฉาก·${label}`;
        if (e.stat === "eva") {
          // Evasion has only the flat status: +v % of the unit's Eva.
          out.buffs.push({ t: "buff_eva", n, v: Math.max(1, Math.round(derived.Eva * e.v / 100)), u });
        } else {
          out.buffs.push({ t: OPENING_STATUS[e.stat]!, n, v: e.v, u });
        }
        out.procs.push({ kind: "opening", label: `${label} +${e.v}%` });
        break;
      }
      case "shield": shield += Math.round(derived.HP * e.pct / 100); break;
      case "ward": ward += Math.max(0, Math.floor(e.count)); break;
      case "revive": out.revive = Math.max(out.revive ?? 0, e.hpPct); break;
      default: break;
    }
  }
  if (shield > 0) {
    out.buffs.push({ t: "shield", n: SHIELD_LABEL, v: shield, u: 1 });
    out.procs.push({ kind: "shield", label: `${SHIELD_LABEL} ${shield}` });
  }
  if (ward > 0) {
    out.buffs.push({ t: "ward", n: WARD_LABEL, v: ward, u: 1 });
    out.procs.push({ kind: "ward", label: `${WARD_LABEL} ×${ward}` });
  }
  return out;
}

// ─── Hits ─────────────────────────────────────────────────────────────
/**
 * Land `dmg` on `side`: its shield soaks first ("absorb" proc), the rest hits
 * HP. Returns the HP damage dealt.
 */
export function landDamage(state: BattleState, side: Side, dmg: number): number {
  let rest = Math.max(0, dmg);
  const shield = state.st[side].buffs.find((b) => b.t === "shield" && b.v > 0);
  if (shield && rest > 0) {
    const soaked = Math.min(shield.v, rest);
    shield.v -= soaked;
    rest -= soaked;
    if (shield.v <= 0) state.st[side].buffs = state.st[side].buffs.filter((b) => b !== shield);
    pushProc(state, side, "absorb", shield.v > 0 ? `ดูดซับ ${soaked}` : `ดูดซับ ${soaked} · โล่แตก`);
    logLine(state, "lS", `&nbsp;🛡 ${SHIELD_LABEL}ดูดซับ ${soaked}${shield.v > 0 ? ` (เหลือ ${shield.v})` : " · โล่แตก"}`);
  }
  if (side === "A") state.hA = Math.max(0, state.hA - rest);
  else state.hB = Math.max(0, state.hB - rest);
  return rest;
}

/** `side` was hit: each rage rolls its chance for a stack (capped per element). */
export function rollRage(state: BattleState, side: Side, effects: readonly MeridianEffect[], rng: () => number = Math.random): void {
  for (const e of effects) {
    if (e.t !== "rage" || rng() * 100 >= e.chance) continue;
    const t = MERIDIAN_ELEMENT_STATUS[e.element];
    const u = Math.max(1, e.turns) + 1;
    const stacks = state.st[side].buffs.filter((b) => b.t === t && b.el === e.element);
    const name = MERIDIAN_ELEMENT_LABEL[e.element];
    if (stacks.length >= Math.max(1, e.maxStacks)) {
      // At the cap: the oldest stack is renewed instead.
      const oldest = stacks.reduce((a, b) => (b.u < a.u ? b : a));
      oldest.u = u;
    } else {
      addBuff(state, side, { t, n: name, v: e.v, u, el: e.element });
    }
    const count = Math.min(stacks.length + 1, Math.max(1, e.maxStacks));
    pushProc(state, side, "rage", `${name} ×${count}`, e.element);
    logLine(state, "lS", `&nbsp;✦ ${name} ×${count}`);
  }
}

const SAP_LABEL: Readonly<Record<MeridianDebuffStat, string>> = {
  atk: "พลังโจมตี", def: "พลังป้องกัน", spd: "ความเร็ว", eva: "หลบหลีก", acc: "แม่นยำ",
};

/** `attacker`'s attack landed on the other side: each sap rolls its chance. */
export function rollSaps(state: BattleState, attacker: Side, effects: readonly MeridianEffect[], rng: () => number = Math.random): void {
  const target: Side = attacker === "A" ? "B" : "A";
  const dd = target === "A" ? state.dA : state.dB;
  for (const e of effects) {
    if (e.t !== "sap" || rng() * 100 >= e.chance) continue;
    const u = Math.max(1, e.turns) + 1;
    const label = SAP_LABEL[e.stat];
    const n = `${label}↓`;
    const before = state.st[target].buffs.find((b) => b.t === "ward")?.v ?? 0;
    switch (e.stat) {
      case "atk": addDebuff(state, target, { t: "debuff_atk", n, v: -e.v, u }); break;
      case "spd": addDebuff(state, target, { t: "debuff_spd", n, v: -e.v, u }); break;
      case "def": addDebuff(state, target, { t: "debuff_def", n, v: -Math.max(1, Math.round((dd.PD + dd.ID) / 2 * e.v / 100)), u }); break;
      case "eva": addDebuff(state, target, { t: "debuff_eva", n, v: -Math.max(1, Math.round(dd.Eva * e.v / 100)), u }); break;
      case "acc": addDebuff(state, target, { t: "debuff_acc", n, v: -Math.max(1, Math.round(dd.Acc * e.v / 100)), u }); break;
    }
    const after = state.st[target].buffs.find((b) => b.t === "ward")?.v ?? 0;
    // A ward that ate it already reported ("ward" proc).
    if (after === before) {
      pushProc(state, target, "sap", `${label} −${e.v}%`);
      logLine(state, "lS", `&nbsp;✧ สกัดชีพจร: ${label} −${e.v}%`);
    }
  }
}
