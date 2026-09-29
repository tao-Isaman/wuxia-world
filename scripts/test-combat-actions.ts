import assert from "node:assert/strict";
import { makeContext, makeInitialState, calcSkillDamage, resolveSkill, resolveArtActive } from "../lib/game/battle";
import { tickEffects } from "../lib/game/effects";
import { SKILLS, ARTS, getSkill } from "../lib/game/data";
import { resolveCombatAction, recoveryAmount, GUARD_MP_COST } from "../lib/game/combat-actions";
import { useBattleStore } from "../store/battle-store";
import type { CharacterBuild } from "../lib/game/types";

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
  } finally { Math.random = random; }
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

check("store consumes the player turn, blocks repeated input, and keeps ATB/cooldowns", () => {
  useBattleStore.getState().start(build, build);
  const state = useBattleStore.getState().state!;
  state.phase = "player"; state.cd.A[0] = 2;
  useBattleStore.getState().useCombatAction("guard");
  assert.equal(useBattleStore.getState().state!.phase, "filling");
  useBattleStore.getState().useCombatAction("guard");
  assert.equal(useBattleStore.getState().state!.turn, 1);
  for (let i = 0; i < 10; i++) useBattleStore.getState().tick(100);
  assert.equal(useBattleStore.getState().state!.gA, 0);
  useBattleStore.getState().state!.castEndsAt = 0;
  for (let i = 0; i < 100 && useBattleStore.getState().state!.phase === "filling"; i++) useBattleStore.getState().tick(100);
  assert.equal(useBattleStore.getState().state!.phase, "player");
  assert.equal(useBattleStore.getState().state!.cd.A[0], 1);
  useBattleStore.getState().reset();
});

console.log(`${checks} combat action checks passed`);
