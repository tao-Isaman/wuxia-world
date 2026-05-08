import type {
  BattleState,
  Side,
  SelfEffect,
  EnemyEffect,
  ArtPassiveEffect,
  ArtPassiveTrigger,
  BuffRecord,
  DebuffRecord,
} from "./types";
import { getArt } from "./data";

// Helper: opposite side.
export function opposite(s: Side): Side {
  return s === "A" ? "B" : "A";
}

// Buff/debuff list mutation: dedupe by `t`, then push the new record.
export function addBuff(state: BattleState, side: Side, b: BuffRecord): void {
  const list = state.st[side].buffs;
  state.st[side].buffs = list.filter((x) => x.t !== b.t);
  state.st[side].buffs.push({ ...b });
}

export function addDebuff(state: BattleState, side: Side, d: DebuffRecord): void {
  const list = state.st[side].debuffs;
  state.st[side].debuffs = list.filter((x) => x.t !== d.t);
  state.st[side].debuffs.push({ ...d });
}

export function logLine(state: BattleState, cls: "lA" | "lB" | "lS" | "lC", txt: string): void {
  state.log.push({ cls, txt });
  if (state.log.length > 100) state.log.shift();
}

function nameOf(side: Side, names: Record<Side, string>): string {
  return names[side];
}

// ─── Self-effect dispatcher (skill `se` + art active self-buff ops) ───
export function applySelfEffect(
  state: BattleState,
  side: Side,
  eff: SelfEffect,
  names: Record<Side, string>,
): void {
  const nm = nameOf(side, names);
  switch (eff.t) {
    case "buff_reflect":
      addBuff(state, side, { t: "buff_reflect", n: "สะท้อน", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: สะท้อน${eff.v}%(${eff.u}ตา)`);
      return;
    case "buff_eva":
      addBuff(state, side, { t: "buff_eva", n: "ว่องไว", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: Eva+${eff.v}(${eff.u}ตา)`);
      return;
    case "buff_reduce":
      addBuff(state, side, { t: "buff_reduce", n: "เกราะ", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: ลดdmg${eff.v}%(${eff.u}ตา)`);
      return;
    case "buff_def":
      addBuff(state, side, { t: "buff_def", n: "DEF↑", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: DEF+${eff.v}(${eff.u}ตา)`);
      return;
    case "buff_spd":
      addBuff(state, side, { t: "buff_spd", n: "เร็ว", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: SPD+${eff.v}(${eff.u}ตา)`);
      return;
    case "heal_pct": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * eff.v / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      logLine(state, "lS", `&nbsp;⟳ ${nm}: ฟื้น${heal}HP`);
      return;
    }
    case "heal_buff": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * eff.hp / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      addBuff(state, side, { t: eff.bt, n: "บัฟ", v: eff.bv, u: eff.bu });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: ฟื้น${heal}HP+${eff.bt}+${eff.bv}(${eff.bu}ตา)`);
      return;
    }
    case "stack_atk": {
      const cur = state.st[side].stk;
      if (cur < eff.mx) {
        state.st[side].stk++;
        logLine(state, "lS", `&nbsp;⟳ ${nm}: ATK+${state.st[side].stk * eff.v}%`);
      }
      return;
    }
    case "buff_iatk_reduce":
      addBuff(state, side, { t: "buff_iatk", n: "ลมปราณอุดร", v: eff.iv, u: eff.u });
      addBuff(state, side, { t: "buff_reduce", n: "ลดรับ", v: eff.rv, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: IAtk+${eff.iv}% + ลดรับ${eff.rv}%(${eff.u}ตา)`);
      return;
    case "buff_reflect_eva":
      addBuff(state, side, { t: "buff_reflect", n: "ดาวคล้อย", v: eff.rv, u: eff.u });
      addBuff(state, side, { t: "buff_eva", n: "ดาวคล้อย", v: eff.ev, u: eff.u });
      logLine(state, "lS", `&nbsp;⟳ ${nm}: สะท้อน${eff.rv}% + Eva+${eff.ev}(${eff.u}ตา)`);
      return;
  }
}

// ─── Enemy-effect dispatcher (skill `ee`) ───
export function applyEnemyEffect(
  state: BattleState,
  caster: Side,
  eff: EnemyEffect,
  names: Record<Side, string>,
): void {
  const ds = opposite(caster);
  const dnm = nameOf(ds, names);
  switch (eff.t) {
    case "debuff_eva":
      addDebuff(state, ds, { t: "debuff_eva", n: "Eva↓", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: Eva${eff.v}(${eff.u}ตา)`);
      return;
    case "debuff_acc":
      addDebuff(state, ds, { t: "debuff_acc", n: "Acc↓", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: Acc${eff.v}(${eff.u}ตา)`);
      return;
    case "debuff_def":
      addDebuff(state, ds, { t: "debuff_def", n: "DEF↓", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: PDef${eff.v}(${eff.u}ตา)`);
      return;
    case "debuff_atk":
      addDebuff(state, ds, { t: "debuff_atk", n: "ATK↓", v: eff.v, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: ATK${eff.v}%(${eff.u}ตา)`);
      return;
    case "burn_hp_mp":
      addDebuff(state, ds, { t: "burn_hp_mp", n: "เผาไหม้", pp: eff.dmg, mpp: eff.mp, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: เผาไหม้ HP${eff.dmg}% MP${eff.mp}%/ตา (${eff.u}ตา)`);
      return;
    case "stun":
      if (Math.random() * 100 < eff.ch) {
        addDebuff(state, ds, { t: "stun", n: "สตัน", u: eff.u });
        logLine(state, "lS", `&nbsp;✗ ${dnm}: สตัน (${eff.u}ตา)`);
      } else {
        logLine(state, "lS", `&nbsp;✗ ${dnm}: ต้านสตัน`);
      }
      return;
    case "debuff_poison":
      addDebuff(state, ds, { t: "debuff_poison", n: "พิษ", pp: eff.pp, u: eff.u });
      addDebuff(state, ds, { t: "debuff_eva", n: "พิษEva", v: eff.ev, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: พิษ${eff.pp}%/ตา Eva${eff.ev}(${eff.u}ตา)`);
      return;
    case "multi_debuff":
      addDebuff(state, ds, { t: "debuff_acc", n: "Acc↓", v: eff.av, u: eff.u });
      addDebuff(state, ds, { t: "debuff_eva", n: "Eva↓", v: eff.ev, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: Acc${eff.av} Eva${eff.ev}(${eff.u}ตา)`);
      return;
    case "heavy_poison":
      addDebuff(state, ds, { t: "debuff_poison", n: "พิษร้าย", pp: eff.pp, u: eff.u });
      addDebuff(state, ds, { t: "debuff_acc", n: "พิษAcc", v: eff.av, u: eff.u });
      addDebuff(state, ds, { t: "debuff_eva", n: "พิษEva", v: eff.ev, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: พิษ${eff.pp}%/ตา Acc${eff.av} Eva${eff.ev}(${eff.u}ตา)`);
      return;
    case "drain_mp": {
      const dCap = ds === "A" ? state.dA.MP : state.dB.MP;
      const drain = Math.round(dCap * eff.v / 100);
      const have = ds === "A" ? state.mpA : state.mpB;
      const gained = Math.min(have, drain);
      if (ds === "A") state.mpA = Math.max(0, state.mpA - gained);
      else state.mpB = Math.max(0, state.mpB - gained);
      const cCap = caster === "A" ? state.dA.MP : state.dB.MP;
      if (caster === "A") state.mpA = Math.min(cCap, state.mpA + gained);
      else state.mpB = Math.min(cCap, state.mpB + gained);
      logLine(state, "lS", `&nbsp;✗ ${dnm}: ดูด MP ${gained}`);
      return;
    }
    case "dispel": {
      const removed = state.st[ds].buffs.shift();
      addDebuff(state, ds, { t: "debuff_acc", n: "สลายพลัง", v: eff.acc, u: eff.u });
      logLine(state, "lS", `&nbsp;✗ ${dnm}: ${removed ? `สลาย[${removed.n ?? "บัฟ"}]` : ""} Acc${eff.acc}(${eff.u}ตา)`);
      return;
    }
  }
}

// ─── Art passive trigger ───
export function checkPassive(
  state: BattleState,
  side: Side,
  artId: string,
  trigger: ArtPassiveTrigger,
  names: Record<Side, string>,
): void {
  const art = getArt(artId);
  if (!art.pas || art.pas.tr !== trigger) return;
  if (Math.random() * 100 >= art.pas.ch) return;
  applyPassiveEffect(state, side, art.pas.e, names);
}

function applyPassiveEffect(
  state: BattleState,
  side: Side,
  e: ArtPassiveEffect,
  names: Record<Side, string>,
): void {
  const nm = nameOf(side, names);
  const ds = opposite(side);
  const dnm = nameOf(ds, names);
  switch (e.t) {
    case "buff_def":
      addBuff(state, side, { t: "buff_def", n: e.n ?? "DEF↑", v: e.v, u: e.u });
      logLine(state, "lS", `&nbsp;◆ ${nm}: DEF+${e.v}(${e.u}ตา)`);
      return;
    case "buff_eva":
      addBuff(state, side, { t: "buff_eva", n: e.n ?? "Eva↑", v: e.v, u: e.u });
      logLine(state, "lS", `&nbsp;◆ ${nm}: Eva+${e.v}(${e.u}ตา)`);
      return;
    case "heal_pct": {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * e.v / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      logLine(state, "lS", `&nbsp;◆ ${nm} ฟื้น ${heal} HP`);
      return;
    }
    case "debuff_acc":
      addDebuff(state, ds, { t: "debuff_acc", n: e.n ?? "Acc↓", v: e.v, u: e.u });
      logLine(state, "lS", `&nbsp;◆ ${dnm}: Acc${e.v}(${e.u}ตา)`);
      return;
    case "debuff_eva":
      addDebuff(state, ds, { t: "debuff_eva", n: e.n ?? "Eva↓", v: e.v, u: e.u });
      logLine(state, "lS", `&nbsp;◆ ${dnm}: Eva${e.v}(${e.u}ตา)`);
      return;
    case "debuff_def":
      addDebuff(state, ds, { t: "debuff_def", n: e.n ?? "DEF↓", v: e.v, u: e.u });
      logLine(state, "lS", `&nbsp;◆ ${dnm}: PDef${e.v}(${e.u}ตา)`);
      return;
    case "stack_atk": {
      const cur = state.st[side].stk;
      if (cur < e.mx) {
        state.st[side].stk++;
        logLine(state, "lS", `&nbsp;◆ ${nm}: ATK+${state.st[side].stk * e.v}%`);
      }
      return;
    }
    case "mult_iatk":
    case "mult_atk":
      // Handled inline in damage calc (taiji/scholar branches).
      return;
  }
}

// ─── Per-turn buff/debuff tick ───
// Applies poison damage, decrements durations, prunes expired records,
// regenerates HP from equipment, and detects death by DOT.
export function tickEffects(
  state: BattleState,
  hpRegenA: number,
  hpRegenB: number,
  names: Record<Side, string>,
): void {
  if (state.winner) return;

  for (const side of ["A", "B"] as const) {
    const st = state.st[side];
    const poison = st.debuffs.find((d) => d.t === "debuff_poison");
    if (poison && poison.u > 0 && poison.pp != null) {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const dmg = Math.round(cap * poison.pp / 100);
      if (side === "A") state.hA = Math.max(0, state.hA - dmg);
      else state.hB = Math.max(0, state.hB - dmg);
      if (dmg > 0) logLine(state, "lS", `&nbsp;☠ ${names[side]} รับพิษ ${dmg}`);
    }

    const burn = st.debuffs.find((d) => d.t === "burn_hp_mp");
    if (burn && burn.u > 0) {
      const hpCap = side === "A" ? state.dA.HP : state.dB.HP;
      const mpCap = side === "A" ? state.dA.MP : state.dB.MP;
      const hpDmg = burn.pp != null ? Math.round(hpCap * burn.pp / 100) : 0;
      const mpDmg = burn.mpp != null ? Math.round(mpCap * burn.mpp / 100) : 0;
      if (side === "A") {
        state.hA = Math.max(0, state.hA - hpDmg);
        state.mpA = Math.max(0, state.mpA - mpDmg);
      } else {
        state.hB = Math.max(0, state.hB - hpDmg);
        state.mpB = Math.max(0, state.mpB - mpDmg);
      }
      if (hpDmg > 0 || mpDmg > 0)
        logLine(state, "lS", `&nbsp;🔥 ${names[side]} เผาไหม้ HP-${hpDmg} MP-${mpDmg}`);
    }

    for (const b of st.buffs) if (b.u > 0) b.u--;
    state.st[side].buffs = st.buffs.filter((b) => b.u > 0);
    for (const d of st.debuffs) if (d.u > 0) d.u--;
    state.st[side].debuffs = st.debuffs.filter((d) => d.u > 0);

    const hp = side === "A" ? state.hA : state.hB;
    if (hp <= 0 && !state.winner) {
      state.winner = opposite(side);
      state.phase = "over";
      logLine(state, "lS", `━━ ${names[state.winner]} ชนะ! (พิษ) ━━`);
    }

    const regen = side === "A" ? hpRegenA : hpRegenB;
    if (regen > 0 && hp > 0 && !state.winner) {
      const cap = side === "A" ? state.dA.HP : state.dB.HP;
      const heal = Math.round(cap * regen / 100);
      if (side === "A") state.hA = Math.min(cap, state.hA + heal);
      else state.hB = Math.min(cap, state.hB + heal);
      if (heal > 0) logLine(state, "lS", `&nbsp;💊 ${names[side]} ฟื้น ${heal} (อุปกรณ์)`);
    }
  }
}

export function checkWin(state: BattleState, names: Record<Side, string>): void {
  if (state.winner) return;
  const w = state.hA <= 0 ? "B" : state.hB <= 0 ? "A" : null;
  if (w) {
    state.winner = w;
    state.phase = "over";
    logLine(state, "lS", `━━ ${names[w]} ชนะ! (${state.turn} ตา) ━━`);
  }
}
