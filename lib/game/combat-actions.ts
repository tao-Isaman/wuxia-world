import type { BattleState } from "./types";
import type { BattleContext } from "./battle";
import { logLine, tickEffects } from "./effects";

export type CombatAction = "guard" | "recover" | "flee";
/** Retreat odds: 50 % at even speed, ±1 % per 4 Spd, clamped 20–90 %. */
export const fleeChance = (spdA: number, spdB: number) => Math.max(20, Math.min(90, 50 + (spdA - spdB) / 4));
export const GUARD_REDUCTION = 35;
export const GUARD_MP_COST = 2;
export const RIPOSTE_BONUS = 20;
export const RECOVER_EVASION_COST = 15;
export const recoveryAmount = (maxMp: number) => Math.max(2, Math.ceil(maxMp * 0.2));

/** Tactical actions use the same global-turn effect ticks as skills and arts. */
export function resolveCombatAction(state: BattleState, ctx: BattleContext, action: CombatAction, now = Date.now()): boolean {
  if (state.winner || state.phase !== "player" || (state.castEndsAt ?? 0) > now) return false;
  if (action === "guard" && state.mpA < GUARD_MP_COST) return false;
  if (action === "recover" && state.mpA >= state.dA.MP) return false;
  state.turn++;
  tickEffects(state, ctx.equipBonus.A.hp_regen, ctx.equipBonus.B.hp_regen, ctx.names, ctx.artIds.A, ctx.artIds.B);
  if (state.winner) return true;
  if (state.st.A.debuffs.some((debuff) => debuff.t === "stun" && debuff.u > 0)) {
    logLine(state, "lA", `[${state.turn}] ถูกสตัน — ข้ามตา!`);
    return true;
  }

  if (action === "flee") {
    const chance = fleeChance(state.dA.Spd, state.dB.Spd);
    if (Math.random() * 100 < chance) {
      state.escaped = true;
      state.phase = "over";
      logLine(state, "lA", `[${state.turn}] ถอยหนีสำเร็จ (โอกาส ${Math.round(chance)}%) — หลุดพ้นจากการต่อสู้`);
      return true;
    }
    logLine(state, "lA", `[${state.turn}] ถอยหนีไม่พ้น (โอกาส ${Math.round(chance)}%) — เสียจังหวะ`);
  } else if (action === "guard") {
    // A burn tick can reduce MP after the initial availability check. The turn
    // is still spent, matching skills that lose their action to a status tick.
    if (state.mpA < GUARD_MP_COST) {
      logLine(state, "lA", `[${state.turn}] ปราณไม่พอตั้งรับ — ต้องใช้ ${GUARD_MP_COST} MP`);
      return true;
    }
    state.mpA -= GUARD_MP_COST;
    // Keep the short stance separate from authored art buffs. Reusing the
    // stack/refresh helper would accidentally extend long-lasting effects.
    state.st.A.buffs = state.st.A.buffs.filter((buff) => buff.n !== "ตั้งรับ" && buff.t !== "buff_riposte");
    const reduction = state.st.A.buffs.filter((buff) => buff.t === "buff_reduce").reduce((sum, buff) => sum + buff.v, 0)
      + ctx.equipBonus.A.pct_red;
    const amount = Math.max(0, Math.min(GUARD_REDUCTION, 95 - reduction));
    state.st.A.buffs.push({ t: "buff_reduce", n: "ตั้งรับ", v: amount, u: 2 });
    state.st.A.buffs.push({ t: "buff_riposte", n: "สวนกลับ", v: RIPOSTE_BONUS, u: 1 });
    logLine(state, "lA", `[${state.turn}] ตั้งรับ → MP -${GUARD_MP_COST} · ลดรับ ${amount}% จังหวะถัดไป · โจมตีกายครั้งถัดไป +${RIPOSTE_BONUS}% (ใช้สิทธิ์แม้พลาด)`);
  } else {
    const amount = Math.min(state.dA.MP - state.mpA, recoveryAmount(state.dA.MP));
    state.mpA += amount;
    state.st.A.debuffs = state.st.A.debuffs.filter((debuff) => debuff.n !== "รวบรวมปราณ");
    state.st.A.debuffs.push({ t: "debuff_eva", n: "รวบรวมปราณ", v: -RECOVER_EVASION_COST, u: 2 });
    logLine(state, "lA", `[${state.turn}] รวบรวมปราณ → MP +${amount} · หลบหลีก -${RECOVER_EVASION_COST} ในจังหวะถัดไป · ใช้ 1 ตา`);
  }
  // Skills use positive sequence IDs. Tactical turns use a disjoint negative
  // sequence, so switching between them always starts a fresh animation.
  state.lastCast = { seq: -(state.turn + 1), side: "A", name: action === "guard" ? "ตั้งรับ" : action === "flee" ? "ถอยหนี" : "รวบรวมปราณ",
    hits: 1, tier: 0, hitDamages: [0], hitCrits: [false], hitMisses: [false] };
  state.castEndsAt = now + 900;
  return true;
}
