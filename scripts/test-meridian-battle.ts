// ชีพจร in battle — the effects of filled meridian points (rank 3): opening,
// shield, ward, revive, rage, sap, on fixture charts in scripted grid battles.
// Part of `bun run test:meridians` (after scripts/test-meridians.ts).
import assert from "node:assert/strict";
// Fixture charts join the content table BEFORE anything builds its lookup.
import { MERIDIAN_CHARTS } from "../lib/game/data/meridians";
import type { MeridianChart, MeridianEffect } from "../lib/game/meridian-types";

const node = (id: string, effects?: MeridianEffect[]) => ({
  id, name: "จุดทดสอบ", at: "dantian" as const,
  ranks: [{ stats: { VIT: 1 } }, { stats: { VIT: 1 } }, { stats: { VIT: 1 } }] as const,
  ...(effects ? { effects } : {}),
});
const fx = (id: string, effects: MeridianEffect[]): MeridianChart => ({
  id, name: `ชีพจรทดสอบ-${id}`, ti: 1, kind: "buff", description: "ทดสอบ", requires: { skills: ["basic_punch"] },
  nodes: [node("a"), node("b", effects)],
});
const FIXTURES: MeridianChart[] = [
  fx("__fx_open", [{ t: "opening", stat: "atk", v: 20, turns: 5 }, { t: "opening", stat: "eva", v: 50, turns: 5 }]),
  fx("__fx_shield", [{ t: "shield", pct: 50 }]),
  fx("__fx_ward", [{ t: "ward", count: 2 }]),
  fx("__fx_revive", [{ t: "revive", hpPct: 50 }]),
  fx("__fx_rage", [{ t: "rage", element: "fire", v: 5, turns: 3, chance: 100, maxStacks: 3 }, { t: "rage", element: "water", v: 2, turns: 3, chance: 100, maxStacks: 2 }]),
  fx("__fx_sap", [{ t: "sap", stat: "atk", v: 20, turns: 2, chance: 100 }, { t: "sap", stat: "spd", v: 30, turns: 2, chance: 100 }]),
];
(MERIDIAN_CHARTS as MeridianChart[]).push(...FIXTURES);

const { meridianActiveEffects, makeContext, calcSkillDamage, getSkill } = await import("../lib/game");
const { addDebuff, tickSideEffects } = await import("../lib/game/effects");
const { landDamage, rollRage, rollSaps, spdWithPct } = await import("../lib/game/meridian-battle");
const {
  applyAction, beginNextTurn, createGridBattle, isOver, makeDuelView, planTurn, tickUnit, unitById, unitSpd,
} = await import("../lib/game/grid");
type CharacterBuild = import("../lib/game").CharacterBuild;
type GridBattleState = import("../lib/game/grid").GridBattleState;

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
function withRandom<T>(v: number, run: () => T): T {
  const random = Math.random; Math.random = () => v;
  try { return run(); } finally { Math.random = random; }
}
const build = (name: string, meridians: Record<string, number[]> = {}, stats = 10): CharacterBuild => ({
  name, artId: "none", artLevel: 1, skillIds: ["basic_punch", null, null, null, null, null, null, null, null, null],
  stats: { STR: stats, AGI: stats, POW: stats, VIT: stats, DEX: stats, LUK: stats, DEF: stats, INT: stats },
  equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
  learnedSkillIds: ["basic_punch"], meridians,
});
const FULL = [3, 3];
const look = { kind: "character", characterId: "test" } as const;
function duel(hero: CharacterBuild, foe: CharacterBuild): GridBattleState {
  return createGridBattle([
    { id: "A", team: "ally", build: hero, look, leader: true, pos: { x: 3, y: 3 } },
    { id: "B", team: "enemy", build: foe, look, pos: { x: 4, y: 3 } },
  ]);
}
const procs = (s: GridBattleState, kind?: string) => s.events.filter((e) => e.t === "proc" && (!kind || e.kind === kind));
/** Let `actor` punch the other unit (adjacent) on its own turn. */
function punch(s: GridBattleState, actor: "A" | "B") {
  unitById(s, actor)!.gauge = 100;
  const u = beginNextTurn(s);
  assert.equal(u?.id, actor);
  const target = unitById(s, actor === "A" ? "B" : "A")!;
  assert.ok(applyAction(s, actor, { t: "skill", slot: 0, target: target.pos }));
}

check("effects switch on only at rank 3", () => {
  assert.deepEqual(meridianActiveEffects({ meridians: { __fx_shield: [3, 2] } }), []);
  assert.deepEqual(meridianActiveEffects({ meridians: { __fx_shield: [3, 3] } }), [{ t: "shield", pct: 50 }]);
  assert.equal(meridianActiveEffects({ meridians: { __fx_rage: FULL, __fx_ward: FULL } }).length, 3);
  assert.deepEqual(meridianActiveEffects({}), []);
});

check("battle start: opening (u = turns + 1), shield = pct × max HP, ward charges, revive pending, proc events", () => {
  const s = duel(build("ฮีโร่", { __fx_open: FULL, __fx_shield: FULL, __fx_ward: FULL, __fx_revive: FULL }), build("โจร"));
  const a = unitById(s, "A")!, b = unitById(s, "B")!;
  const atk = a.status.buffs.find((x) => x.t === "buff_atk_pct")!;
  assert.deepEqual([atk.v, atk.u], [20, 6]);
  assert.equal(a.status.buffs.find((x) => x.t === "buff_eva")!.v, Math.max(1, Math.round(a.derived.Eva * 0.5)));
  assert.equal(a.status.buffs.find((x) => x.t === "shield")!.v, Math.round(a.derived.HP * 0.5));
  assert.equal(a.status.buffs.find((x) => x.t === "ward")!.v, 2);
  assert.equal(a.revive, 50);
  assert.deepEqual(procs(s).map((e) => e.t === "proc" && e.kind).sort(), ["opening", "opening", "shield", "ward"]);
  assert.ok(procs(s).every((e) => e.t === "proc" && e.unitId === "A" && e.label.length > 0));
  assert.equal(b.status.buffs.length, 0, "foes without meridians start bare");
  assert.equal(b.revive, undefined);
});

check("opening lasts the unit's first 5 turns", () => {
  const s = duel(build("ฮีโร่", { __fx_open: FULL }), build("โจร"));
  const a = unitById(s, "A")!;
  for (let turn = 1; turn <= 6; turn++) {
    tickUnit(a, turn);
    const up = a.status.buffs.some((x) => x.t === "buff_atk_pct");
    assert.equal(up, turn <= 5, `turn ${turn}`);
  }
});

check("% statuses feed the math: attack, defence, speed", () => {
  const hero = build("ฮีโร่"), foe = build("โจร");
  const s = duel(hero, foe);
  const a = unitById(s, "A")!, b = unitById(s, "B")!;
  const ctx = makeContext(hero, foe);
  const sk = getSkill("basic_punch")!;
  const dmg = () => withRandom(0.5, () => calcSkillDamage(makeDuelView(a, b, 1), "A", sk, ctx).dmg);
  const base = dmg();
  a.status.buffs.push({ t: "buff_atk_pct", v: 50, u: 3 });
  assert.ok(dmg() > base, "attack +%");
  a.status.buffs = [];
  b.status.buffs.push({ t: "buff_def_pct", v: 100, u: 3 });
  assert.ok(dmg() <= base, "defence +%");
  b.status.buffs = [];
  const spd = unitSpd(a);
  a.status.buffs.push({ t: "buff_spd_pct", v: 50, u: 3 });
  assert.equal(unitSpd(a), spdWithPct(spd, 50));
  assert.ok(Math.abs((unitSpd(a) + 60) - (spd + 60) * 1.5) < 1e-9, "gauge fill ×1.5");
  a.status.buffs = [];
  a.status.debuffs.push({ t: "debuff_spd", v: -30, u: 3 });
  assert.ok(unitSpd(a) < spd, "sapped speed");
});

check("shield soaks incoming hits first, then breaks ('absorb' procs)", () => {
  const s = duel(build("ฮีโร่", { __fx_shield: FULL }), build("โจร", {}, 30));
  const a = unitById(s, "A")!;
  const hp0 = a.hp;
  const shield0 = a.status.buffs.find((x) => x.t === "shield")!.v;
  withRandom(0, () => punch(s, "B"));
  const left = a.status.buffs.find((x) => x.t === "shield")?.v ?? 0;
  const taken = hp0 - a.hp;
  assert.ok(left < shield0, "the shield took the hit");
  if (left > 0) assert.equal(taken, 0, "HP untouched while the shield holds");
  assert.ok(procs(s, "absorb").length >= 1);
  // A view-level hit bigger than the rest of the shield breaks it.
  const v = makeDuelView(a, a, 1);
  const shield = v.st.A.buffs.find((x) => x.t === "shield");
  if (shield) {
    const rest = landDamage(v, "A", shield.v + 7);
    assert.equal(rest, 7);
    assert.ok(!v.st.A.buffs.some((x) => x.t === "shield"));
  }
});

check("revive: a fallen unit rises once with 50 % HP, the second fall is final", () => {
  const s = duel(build("ฮีโร่", { __fx_revive: FULL }, 5), build("โจร", {}, 40));
  const a = unitById(s, "A")!;
  a.hp = 1;
  withRandom(0, () => punch(s, "B"));
  assert.ok(a.alive, "revived");
  assert.equal(a.hp, Math.max(1, Math.round(a.derived.HP * 0.5)));
  assert.equal(a.revive, undefined);
  assert.equal(procs(s, "revive").length, 1);
  const cast = [...s.events].reverse().find((e) => e.t === "cast");
  assert.ok(cast && cast.t === "cast" && cast.results.every((r) => !r.killed), "not reported killed");
  a.hp = 1;
  withRandom(0, () => punch(s, "B"));
  assert.ok(!a.alive && isOver(s), "second fall ends it");
});

check("rage: each hit may add a stack, capped per element; stacks expire after their turns", () => {
  const hero = build("ฮีโร่", { __fx_rage: FULL });
  const s = duel(hero, build("โจร"));
  const a = unitById(s, "A")!;
  const v = makeDuelView(a, a, 1);
  const effects = meridianActiveEffects(hero);
  for (let i = 0; i < 5; i++) rollRage(v, "A", effects, () => 0);
  const fire = v.st.A.buffs.filter((x) => x.t === "buff_atk_pct" && x.el === "fire");
  const water = v.st.A.buffs.filter((x) => x.t === "buff_regen" && x.el === "water");
  assert.equal(fire.length, 3, "fire capped at 3");
  assert.equal(water.length, 2, "water capped at 2");
  assert.ok(fire.every((x) => x.v === 5 && x.u === 4 && x.n === "เพลิงพิโรธ"));
  assert.ok((v.procs ?? []).every((p) => p.kind === "rage" && (p.el === "fire" || p.el === "water")));
  rollRage(v, "A", effects, () => 0.99);
  assert.equal(v.st.A.buffs.length, 5, "a missed roll adds nothing");
  // Water heals at the start of each own turn; all stacks are gone after 4 ticks.
  v.hA = 1;
  tickSideEffects(v, "A", 0, { A: "ฮีโร่", B: "ฮีโร่" });
  assert.equal(v.hA, 1 + Math.round(v.dA.HP * 4 / 100), "two water stacks = 4 % of max HP");
  for (let i = 0; i < 3; i++) tickSideEffects(v, "A", 0, { A: "ฮีโร่", B: "ฮีโร่" });
  assert.equal(v.st.A.buffs.length, 0);
  // In a grid battle a landed hit rolls them.
  const g = duel(hero, build("โจร"));
  withRandom(0, () => punch(g, "B"));
  assert.ok(procs(g, "rage").length >= 1);
  assert.ok(unitById(g, "A")!.status.buffs.some((x) => x.el === "fire"));
});

check("ward blocks the next N debuffs (skills, arts, saps alike), one charge each", () => {
  const s = duel(build("ฮีโร่", { __fx_ward: FULL }), build("โจร"));
  const a = unitById(s, "A")!;
  const v = makeDuelView(a, a, 1);
  for (let i = 0; i < 3; i++) addDebuff(v, "A", { t: "debuff_def", n: "DEF↓", v: -5, u: 2 });
  assert.equal(v.st.A.debuffs.length, 1, "two blocked, the third lands");
  assert.ok(!v.st.A.buffs.some((x) => x.t === "ward"), "ward spent");
  assert.equal((v.procs ?? []).filter((p) => p.kind === "ward").length, 2);
});

check("sap: a landed attack lowers the target (atk %, spd %); a ward eats it", () => {
  const hero = build("ฮีโร่", { __fx_sap: FULL });
  const s = duel(hero, build("โจร"));
  withRandom(0, () => punch(s, "A"));
  const b = unitById(s, "B")!;
  const atk = b.status.debuffs.find((d) => d.t === "debuff_atk")!;
  assert.deepEqual([atk.v, atk.u], [-20, 3]);
  assert.equal(b.status.debuffs.find((d) => d.t === "debuff_spd")!.v, -30);
  assert.equal(procs(s, "sap").length, 2);
  assert.ok(procs(s, "sap").every((e) => e.t === "proc" && e.unitId === "B"));
  // Against a warded target the saps spend its charges instead.
  const s2 = duel(hero, build("โจร", { __fx_ward: FULL }));
  const b2 = unitById(s2, "B")!;
  const v = makeDuelView(unitById(s2, "A")!, b2, 1);
  rollSaps(v, "A", meridianActiveEffects(hero), () => 0);
  assert.equal(v.st.B.debuffs.length, 0);
  assert.equal((v.procs ?? []).filter((p) => p.kind === "ward").length, 2);
  assert.equal((v.procs ?? []).filter((p) => p.kind === "sap").length, 0);
});

check("a full AI battle with every effect finishes, foes without meridians unchanged", () => {
  const all = { __fx_open: FULL, __fx_shield: FULL, __fx_ward: FULL, __fx_revive: FULL, __fx_rage: FULL, __fx_sap: FULL };
  const s = duel(build("ฮีโร่", all), build("โจร", {}, 12));
  for (let i = 0; i < 400 && !isOver(s); i++) {
    const u = beginNextTurn(s);
    if (!u) break;
    const plan = planTurn(s, u.id);
    if (plan.move) applyAction(s, u.id, { t: "move", to: plan.move });
    applyAction(s, u.id, plan.action);
  }
  assert.ok(isOver(s), "battle ended");
  assert.ok(procs(s).length >= 4);
});

console.log(`\n${passed} meridian battle checks passed`);
