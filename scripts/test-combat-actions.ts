import assert from "node:assert/strict";
import { makeContext, makeInitialState, calcSkillDamage, resolveSkill, resolveArtActive, predictTurnOrder, getNextTurn, artDamageMults, artActiveRaw } from "../lib/game/battle";
import { tickEffects } from "../lib/game/effects";
import { SKILLS, ARTS, getSkill, getArt } from "../lib/game/data";
import { resolveCombatAction, recoveryAmount, GUARD_MP_COST, fleeChance } from "../lib/game/combat-actions";
import { useBattleStore } from "../store/battle-store";
import type { CharacterBuild } from "../lib/game/types";
import { combinedStats } from "../lib/game/derive";
import { computeConflictFactors } from "../lib/game/skill-conflict";
import { POWER_TIERS, powerBreakdown, powerScore, powerTierOf, powerOutlook } from "../lib/game/power-tier";

const attack = SKILLS.find((skill) => skill.ti === 0 && skill.at === "phy")!;
const build: CharacterBuild = {
  name: "Action test", stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
  artId: "none", artLevel: 1, skillIds: [attack.id],
  equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
};
const ctx = makeContext(build, build);
const fresh = () => { const state = makeInitialState(build, build); state.phase = "player"; return state; };
const tick = (state: ReturnType<typeof fresh>) => tickEffects(state, 0, 0, ctx.names);
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

check("guard reduces the next action's damage and expires on the following turn", () => {
  const state = fresh();
  const random = Math.random;
  Math.random = () => 0.5;
  try {
    const unguarded = calcSkillDamage(state, "B", attack, ctx).dmg;
    assert.equal(resolveCombatAction(state, ctx, "guard", 1000), true);
    assert.equal(state.turn, 1);
    assert.equal(state.mpA, state.dA.MP - GUARD_MP_COST);
    assert.equal(state.castEndsAt, 1900);
    assert.deepEqual(state.lastCast?.hitDamages, [0]);
    tick(state);
    const guarded = calcSkillDamage(state, "B", attack, ctx).dmg;
    assert.ok(guarded < unguarded);
    assert.ok(Math.abs(guarded - unguarded * 0.65) <= 1);
    tick(state);
    assert.equal(calcSkillDamage(state, "B", attack, ctx).dmg, unguarded);
  } finally { Math.random = random; }
});

check("guard does not refresh other mitigation and cannot push it beyond 95 percent", () => {
  const state = fresh();
  state.st.A.buffs.push({ t: "buff_reduce", n: "existing art", v: 85, u: 5 });
  resolveCombatAction(state, ctx, "guard", 1000);
  assert.equal(state.st.A.buffs.find((buff) => buff.n === "existing art")?.u, 4);
  assert.equal(state.st.A.buffs.filter((buff) => buff.t === "buff_reduce").reduce((sum, buff) => sum + buff.v, 0), 95);
  tick(state); tick(state);
  assert.equal(state.st.A.buffs.length, 2);
  assert.equal(state.st.A.buffs[0].v, 85);
  assert.equal(state.st.A.buffs[1].t, "buff_riposte");
});

check("riposte survives enemy turns and empowers exactly one physical attempt", () => {
  const state = fresh();
  const random = Math.random; Math.random = () => 0.5;
  try {
    const baseline = calcSkillDamage(state, "A", attack, ctx).dmg;
    resolveCombatAction(state, ctx, "guard", 1000);
    for (let n = 0; n < 8; n++) tick(state);
    assert.equal(state.st.A.buffs.length, 1);
    const enhanced = calcSkillDamage(state, "A", attack, ctx).dmg;
    assert.ok(enhanced > baseline);
    assert.ok(Math.abs(enhanced - baseline * 1.2) <= 1);
    assert.equal(state.st.A.buffs.length, 0);
    assert.equal(calcSkillDamage(state, "A", attack, ctx).dmg, baseline);
  } finally { Math.random = random; }
});

check("a missed physical attempt consumes riposte; internal attacks preserve it", () => {
  const state = fresh();
  resolveCombatAction(state, ctx, "guard", 1000);
  const random = Math.random; Math.random = () => 0.5;
  try {
    calcSkillDamage(state, "A", { ...attack, at: "int" }, ctx);
    assert.equal(state.st.A.buffs.some((buff) => buff.t === "buff_riposte"), true);
    Math.random = () => 0.99;
    assert.equal(calcSkillDamage(state, "A", attack, ctx).hit, false);
    assert.equal(state.st.A.buffs.some((buff) => buff.t === "buff_riposte"), false);
  } finally { Math.random = random; }
});

check("riposte affects only the first strike of a multi-hit physical skill", () => {
  const state = fresh(); state.hB = 1000;
  resolveCombatAction(state, ctx, "guard", 1000);
  const random = Math.random; Math.random = () => 0.5;
  try {
    resolveSkill(state, "A", 0, getSkill("nd5")!.id, ctx);
    const hits = state.lastCast!.hitDamages;
    assert.equal(hits.length, 3);
    assert.ok(hits[0] > hits[1]);
    assert.equal(hits[1], hits[2]);
    assert.equal(state.st.A.buffs.some((buff) => buff.t === "buff_riposte"), false);
  } finally { Math.random = random; }
});

check("physical art attempts also consume riposte when they miss", () => {
  const art = ARTS.find((candidate) => candidate.act?.t === "atk_phy_pen")!;
  const caster = { ...build, artId: art.id };
  const context = makeContext(caster, build);
  const state = makeInitialState(caster, build); state.phase = "player";
  state.mpA = 100;
  resolveCombatAction(state, context, "guard", 1000);
  const random = Math.random; Math.random = () => 0.99;
  try {
    assert.equal(resolveArtActive(state, "A", context), true);
    assert.equal(state.st.A.buffs.some((buff) => buff.t === "buff_riposte"), false);
    assert.deepEqual(state.lastCast!.hitDamages, [0]);
    assert.deepEqual(state.lastCast!.hitMisses, [true], "an art miss is reported as a miss, not a 0 hit");
  } finally { Math.random = random; }
});

check("mult_iatk / mult_atk passives work for every art that carries them", () => {
  const carriers = ARTS.filter((a) => a.pas?.e.t === "mult_iatk" || a.pas?.e.t === "mult_atk");
  assert.ok(carriers.length >= 9, `${carriers.length} carriers`);
  for (const a of carriers) {
    const int = artDamageMults(a.id, "int");
    assert.ok(int.im > 1 || int.ab > 1, `${a.id} boosts internal attacks`);
    if (a.pas!.e.t === "mult_iatk") assert.deepEqual(artDamageMults(a.id, "phy"), { im: 1, ab: 1 }, `${a.id}: IA only`);
  }
  assert.deepEqual(artDamageMults("none", "int"), { im: 1, ab: 1 });
  // In the damage roll: the same fight, the primary art swapped for one carrier.
  const intSkill = SKILLS.find((s) => s.at === "int" && s.ti === 1 && !s.hits)!;
  const caster: CharacterBuild = { ...build, stats: { ...build.stats, POW: 30 }, skillIds: [intSkill.id] };
  const base = makeContext(caster, build);
  const random = Math.random; Math.random = () => 0.5;
  try {
    const roll = (artId: string) => {
      const state = makeInitialState(caster, build);
      return calcSkillDamage(state, "A", intSkill, { ...base, artIds: { ...base.artIds, A: artId } }).dmg;
    };
    assert.ok(roll("qzzq") > roll("none"), "a non-taiji carrier raises internal damage");
  } finally { Math.random = random; }
});

check("a reflect answers every landed hit of a multi-hit move, then is used up", () => {
  const multi = SKILLS.find((s) => s.at === "phy" && (s.hits ?? 1) >= 3 && !s.dr && !s.se && !s.ee)!;
  const caster: CharacterBuild = { ...build, stats: { ...build.stats, STR: 40, DEX: 40 }, skillIds: [multi.id] };
  const context = makeContext(caster, build);
  const state = makeInitialState(caster, build); state.phase = "player";
  state.hA = 10_000; state.hB = 10_000;
  state.st.B.buffs.push({ t: "buff_reflect", n: "สะท้อน", v: 50, u: 3 });
  const random = Math.random; Math.random = () => 0.5;
  try { resolveSkill(state, "A", 0, multi.id, context, { tick: false }); } finally { Math.random = random; }
  const dealt = state.lastCast!.hitDamages.reduce((a, b) => a + b, 0);
  const reflected = 10_000 - state.hA;
  assert.ok(state.lastCast!.hitDamages.filter((d) => d > 0).length >= 2, "several hits landed");
  assert.ok(Math.abs(reflected - dealt * 0.5) <= multi.hits!, `reflected ${reflected} of ${dealt}`);
  assert.equal(state.st.B.buffs.some((b) => b.t === "buff_reflect"), false, "used up after the cast");
});

check("art actives use stacks, gear pct, mastery and the target's debuff_def; a stunned caster pays nothing", () => {
  const act = { t: "atk_int_pen" as const, m: 1.5, pen: 0 };
  const d = makeInitialState(build, build).dA;
  const st = () => ({ buffs: [], debuffs: [], stk: 0, stkV: 0 } as ReturnType<typeof fresh>["st"]["A"]);
  const eq = { ...ctx.equipBonus.A, pct_atk: 0, pct_red: 0 };
  const raw = (o: { stk?: number; pctAtk?: number; mastery?: number; defDebuff?: number; pctRed?: number } = {}) => {
    const a = st(); a.stk = o.stk ?? 0; a.stkV = 10;
    const b = st(); if (o.defDebuff) b.debuffs.push({ t: "debuff_def", n: "x", v: -o.defDebuff, u: 3 });
    const big = { ...d, Atk: 200, IA: 200, ID: 100 };
    return artActiveRaw(act,
      { d: big, st: a, equip: { ...eq, pct_atk: o.pctAtk ?? 0 }, masteries: { fist: o.mastery ?? 0 }, primaryArtId: "none" },
      { d: big, st: b, equip: { ...eq, pct_red: o.pctRed ?? 0 } });
  };
  const plain = raw();
  assert.ok(raw({ stk: 2 }) > plain, "attack stacks");
  assert.ok(raw({ pctAtk: 20 }) > plain, "gear pct_atk");
  assert.ok(raw({ mastery: 200 }) > plain, "mastery");
  assert.ok(raw({ defDebuff: 30 }) > plain, "the target's debuff_def");
  assert.ok(raw({ pctRed: 30 }) < plain, "the target's gear pct_reduce");
  // Stunned: the turn is lost before MP, cooldown or a use are paid.
  const art = ARTS.find((candidate) => candidate.act?.t === "atk_phy_pen")!;
  const caster = { ...build, artId: art.id };
  const state = makeInitialState(caster, build); state.phase = "player";
  state.mpA = 100;
  state.st.A.debuffs.push({ t: "stun", u: 3 });
  assert.equal(resolveArtActive(state, "A", makeContext(caster, build)), true);
  assert.equal(state.mpA, 100);
  assert.equal(state.iaCD.A, 0);
  assert.deepEqual(state.artUses.A, {});
});

check("repeated Guard pays each time and refreshes one riposte charge without stacking", () => {
  const state = fresh();
  resolveCombatAction(state, ctx, "guard", 1000);
  resolveCombatAction(state, ctx, "guard", 3000);
  assert.equal(state.mpA, state.dA.MP - GUARD_MP_COST * 2);
  const charges = state.st.A.buffs.filter((buff) => buff.t === "buff_riposte");
  assert.equal(charges.length, 1);
  assert.equal(charges[0].v, 20);
  assert.equal(charges[0].u, 1);
});

check("insufficient MP rejects Guard without spending a turn; burn cannot create free Guard", () => {
  const state = fresh(); state.mpA = 1;
  assert.equal(resolveCombatAction(state, ctx, "guard", 1000), false);
  assert.equal(state.turn, 0);
  assert.equal(state.mpA, 1);
  const burned = fresh(); burned.mpA = 2;
  burned.st.A.debuffs.push({ t: "burn_hp_mp", mpp: 100, u: 2 });
  assert.equal(resolveCombatAction(burned, ctx, "guard", 1000), true);
  assert.equal(burned.mpA, 0);
  assert.equal(burned.st.A.buffs.length, 0);
});

check("recover restores modest MP, caps at maximum, and exposes the next action", () => {
  const state = fresh();
  state.mpA = state.dA.MP - 1;
  assert.equal(resolveCombatAction(state, ctx, "recover", 1000), true);
  assert.equal(state.mpA, state.dA.MP);
  assert.equal(state.turn, 1);
  tick(state);
  assert.equal(state.st.A.debuffs.find((debuff) => debuff.t === "debuff_eva")?.v, -15);
  tick(state);
  assert.equal(state.st.A.debuffs.length, 0);
  const empty = fresh(); empty.mpA = 0;
  resolveCombatAction(empty, ctx, "recover", 1000);
  assert.equal(empty.mpA, Math.min(empty.dA.MP, recoveryAmount(empty.dA.MP)));
});

check("wrong turns, active cast holds, full MP, and finished battles reject actions", () => {
  const full = fresh();
  assert.equal(resolveCombatAction(full, ctx, "recover", 1000), false);
  assert.equal(full.turn, 0);
  const casting = fresh(); casting.castEndsAt = 1001;
  assert.equal(resolveCombatAction(casting, ctx, "guard", 1000), false);
  const enemy = fresh(); enemy.phase = "enemy";
  assert.equal(resolveCombatAction(enemy, ctx, "guard", 1000), false);
  const ended = fresh(); ended.winner = "B";
  assert.equal(resolveCombatAction(ended, ctx, "guard", 1000), false);
});

check("tactical turns preserve poison death and stun rules", () => {
  const poisoned = fresh(); poisoned.hA = 1;
  poisoned.st.A.debuffs.push({ t: "debuff_poison", pp: 50, u: 2 });
  resolveCombatAction(poisoned, ctx, "guard", 1000);
  assert.equal(poisoned.winner, "B");
  assert.equal(poisoned.st.A.buffs.length, 0);
  const stunned = fresh(); stunned.mpA = 0;
  stunned.st.A.debuffs.push({ t: "stun", u: 2 });
  resolveCombatAction(stunned, ctx, "recover", 1000);
  assert.equal(stunned.turn, 1);
  assert.equal(stunned.mpA, 0);
  assert.equal(stunned.st.A.debuffs.length, 1);
});

check("grid store consumes the player turn, blocks repeated input, and keeps ATB/cooldowns", () => {
  const store = useBattleStore.getState;
  // Seeded dice: unseeded, a lucky crit now and then ends the fight before the hero's next turn.
  store().start(build, build, { seed: 1 });
  store().stepAll();
  const mine = store().state!.units.find((u) => u.id === "A")!;
  assert.equal(store().state!.activeId, "A", "ties go to the player");
  mine.cd[0] = 2;
  assert.equal(store().wait(), true);
  assert.equal(store().wait(), false, "the turn is already spent");
  assert.equal(store().state!.turn, 1);
  store().stepAll();
  assert.equal(store().state!.activeId, "A");
  assert.equal(store().state!.units.find((u) => u.id === "A")!.cd[0], 1, "cooldown ticks at the start of the unit's own turn");
  store().reset();
});

check("turn-order forecast matches real ATB turns without mutating the battle", () => {
  const fast = { ...build, name: "Fast", stats: { ...build.stats, AGI: 60 } };
  const state = makeInitialState(fast, build);
  state.phase = "filling";
  const before = { gA: state.gA, gB: state.gB, turn: state.turn };
  const forecast = predictTurnOrder(state, 8);
  assert.deepEqual({ gA: state.gA, gB: state.gB, turn: state.turn }, before);
  assert.equal(forecast.length, 8);
  assert.ok(state.dA.Spd > state.dB.Spd);
  assert.ok(forecast.filter((side) => side === "A").length > forecast.filter((side) => side === "B").length);
  const replay = { ...state };
  assert.deepEqual(Array.from({ length: 8 }, () => getNextTurn(replay)), forecast);
  state.phase = "enemy";
  assert.equal(predictTurnOrder(state, 3)[0], "B");
  state.winner = "A";
  assert.deepEqual(predictTurnOrder(state, 3), []);
});

check("turn order never loses its actor to floating-point gauge rounding", () => {
  // Ticking by exactly the time-to-fill used to leave a gauge at 99.9999…,
  // and getNextTurn threw — crashing the battle's turn-order timeline.
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 3000; run++) {
    const state = fresh();
    state.dA.Spd = Math.round(random() * 300);
    state.dB.Spd = Math.round(random() * 300);
    state.gA = random() * 99;
    state.gB = random() * 99;
    assert.equal(predictTurnOrder(state, 12).length, 12);
  }
});

check("retreat: odds follow Spd; success ends the fight with no winner, failure spends the turn", () => {
  assert.equal(fleeChance(100, 100), 50);
  assert.equal(fleeChance(400, 0), 90);
  assert.equal(fleeChance(0, 400), 20);
  const random = Math.random;
  try {
    Math.random = () => 0.1;
    const won = fresh();
    assert.equal(resolveCombatAction(won, ctx, "flee", 1000), true);
    assert.equal(won.escaped, true);
    assert.equal(won.phase, "over");
    assert.equal(won.winner, null);
    Math.random = () => 0.99;
    const lost = fresh();
    assert.equal(resolveCombatAction(lost, ctx, "flee", 1000), true);
    assert.equal(lost.escaped, undefined);
    assert.equal(lost.turn, 1);
    assert.equal(lost.lastCast?.name, "ถอยหนี");
    assert.equal(resolveCombatAction(won, ctx, "flee", 5000), false, "no actions after escaping");
  } finally { Math.random = random; }
});

check("power tiers: twelve named, coloured steps from stats, inner arts and moves; equipment never counts", () => {
  assert.equal(POWER_TIERS.length, 12);
  assert.deepEqual(POWER_TIERS.map((t) => t.tier), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  for (let i = 1; i < POWER_TIERS.length; i++) assert.ok(POWER_TIERS[i].min > POWER_TIERS[i - 1].min, "thresholds rise");
  assert.equal(new Set(POWER_TIERS.map((t) => t.name)).size, 12, "every tier has its own name");
  assert.equal(new Set(POWER_TIERS.map((t) => t.color)).size, 12, "every tier has its own colour");
  // Each badge's text reads on its fill (WCAG contrast ≥ 4.5).
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  for (const t of POWER_TIERS) {
    const [hi, lo] = [lum(t.color), lum(t.ink)].sort((x, y) => y - x);
    assert.ok((hi + 0.05) / (lo + 0.05) >= 4.5, `${t.name}: text contrast ${((hi + 0.05) / (lo + 0.05)).toFixed(2)}`);
  }
  assert.equal(powerTierOf(0).tier, 1);
  assert.equal(powerTierOf(POWER_TIERS[4].min).tier, 5);
  assert.equal(powerTierOf(POWER_TIERS[4].min - 1).tier, 4);
  assert.equal(powerTierOf(1e9).tier, 12);
  const parts = powerBreakdown(build);
  const combined = combinedStats(build, computeConflictFactors(build, { getSkill, getArt }));
  assert.equal(parts.stats, Object.values(combined).reduce((a, b) => a + b, 0), "base stats plus the move's own bonus");
  assert.equal(parts.moves, Math.round(attack.bp * 0.5 / 2), "half the slotted move's level-1 power");
  assert.equal(parts.arts, 0);
  // Gear changes nothing.
  const geared: CharacterBuild = { ...build, equipment: { ...build.equipment, W: "W3" } };
  assert.equal(powerScore(geared), powerScore(build));
  // Training does: stats, a higher move level, an inner art.
  assert.ok(powerScore({ ...build, stats: { ...build.stats, STR: 20 } }) > powerScore(build));
  assert.ok(powerScore({ ...build, skillLevels: { [attack.id]: 10 } }) > powerScore(build));
  const art = ARTS.find((a) => a.id !== "none" && a.ti === 2)!;
  assert.equal(powerBreakdown({ ...build, artId: art.id, artLevel: 4, learnedArtIds: [art.id], artLevels: { [art.id]: 4 } }).arts, 12);
  assert.deepEqual([powerOutlook(3, 6), powerOutlook(3, 4), powerOutlook(3, 3), powerOutlook(3, 2), powerOutlook(5, 1)],
    ["deadly", "stronger", "even", "weaker", "trivial"]);
});

console.log(`${checks} combat action checks passed`);
