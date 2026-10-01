// Grid tactics AI (lib/game/grid/ai.ts): legality, finishing battles, and
// the behaviours the design asks for. Run: bun run test:grid-ai
import assert from "node:assert/strict";
import { ARTS, SKILLS } from "../lib/game/data";
import type { CharacterBuild, StatBlock } from "../lib/game/types";
import {
  boardSizeFor, activeUnit, applyAction, beginNextTurn, cellKey, createGridBattle, isOver, manhattan, planTurn,
  reachableFor, scoreAction, slotGrid, targetsFor, unitById,
  type Cell, type GridBattleState, type GridUnit, type TurnPlan, type UnitSpec,
} from "../lib/game/grid";
import { getOpponent } from "../lib/world/data/opponents";
import { useWorldStore } from "../store/world-store";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

/** Seeded PRNG (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function withRandom<T>(rng: () => number, run: () => T): T {
  const random = Math.random; Math.random = rng;
  try { return run(); } finally { Math.random = random; }
}

const STATS: StatBlock = { STR: 5, AGI: 5, POW: 5, VIT: 5, DEX: 5, LUK: 5, DEF: 5, INT: 5 };
const build = (name: string, skillIds: (string | null)[], stats: Partial<StatBlock> = {}): CharacterBuild => ({
  name, stats: { ...STATS, ...stats }, artId: "none", artLevel: 1, skillIds,
  equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
});
const look = { kind: "character", characterId: "test" } as const;
const unit = (id: string, team: "ally" | "enemy", b: CharacterBuild, pos?: Cell, extra: Partial<UnitSpec> = {}): UnitSpec =>
  ({ id, team, build: b, look, pos, ...extra });
const U = (s: GridBattleState, id: string) => unitById(s, id)!;
function giveTurn(s: GridBattleState, id: string): GridUnit {
  U(s, id).gauge = 100;
  const u = beginNextTurn(s)!;
  assert.equal(u.id, id);
  return u;
}

const MELEE = "sf";                 // fist T0 · range 1 · single
const KNIFE = "tang_basic_knife";   // hidden T0 · range 2–4 · single
const AREA = "sa";                  // music T2 · range 2–4 · diamond 1
const HEAL_ART = "tendon";          // art active heal 22 % (MP 25)
assert.equal(slotGrid(KNIFE)?.range.min, 2);
assert.equal(slotGrid(AREA)?.area.kind, "diamond");
assert.equal(ARTS.find((a) => a.id === HEAL_ART)?.act?.t, "heal");

// ─── Driver: every turn planned by the AI, legality asserted ──────────
let planMs = 0, plans = 0, worstMs = 0;
function timedPlan(s: GridBattleState, id: string): TurnPlan {
  const t0 = performance.now();
  const plan = planTurn(s, id);
  const dt = performance.now() - t0;
  planMs += dt; plans++; worstMs = Math.max(worstMs, dt);
  return plan;
}
function playAiTurn(s: GridBattleState, u: GridUnit): TurnPlan {
  const plan = timedPlan(s, u.id);
  assert.notEqual(plan.action.t, "flee", "the AI never flees");
  if (plan.move) {
    assert.ok(reachableFor(s, u.id).has(cellKey(plan.move)), `${u.id}: move ${cellKey(plan.move)} reachable`);
    assert.ok(plan.move.x !== u.pos.x || plan.move.y !== u.pos.y, "move omitted when staying");
    assert.equal(applyAction(s, u.id, { t: "move", to: plan.move }), true, `${u.id}: move accepted`);
  }
  if (plan.action.t === "skill") {
    const hit = targetsFor(s, u.id, plan.action.slot, plan.action.target);
    assert.ok(hit.length > 0, `${u.id}: skill ${plan.action.slot} hits someone`);
  }
  assert.equal(applyAction(s, u.id, plan.action), true, `${u.id}: ${JSON.stringify(plan)} accepted (phase ${s.phase})`);
  return plan;
}
function runAiBattle(s: GridBattleState, max = 300): { turns: number; skills: number; waits: number } {
  let turns = 0, skills = 0, waits = 0;
  while (!isOver(s) && turns < max) {
    const u = beginNextTurn(s);
    if (!u) break;
    assert.equal(activeUnit(s), u);
    const plan = playAiTurn(s, u);
    if (plan.action.t === "skill") skills++; else waits++;
    turns++;
  }
  return { turns, skills, waits };
}

useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
const hero = useWorldStore.getState().playerBuild!;
assert.ok(hero, "startNewGame gives a player build");

// Sampled builds across every weapon family, supports and arts (as in test-grid-engine).
const attacks = SKILLS.filter((sk) => sk.at && !sk.id.startsWith("bst_"));
const support = SKILLS.filter((sk) => slotGrid(sk.id)?.target === "self");
const arts = ARTS.filter((a) => a.act);
function sample(i: number): CharacterBuild {
  const ids = [0, 1, 2, 3].map((k) => attacks[(i * 53 + k * 17) % attacks.length].id);
  const art = arts[(i * 11) % arts.length];
  const b = build(`นักสู้${i}`, [...ids, support[(i * 7) % support.length].id, `art:${art.id}`],
    { STR: 30 + (i % 3) * 10, AGI: 20 + (i % 4) * 15, POW: 30, VIT: 40, DEX: 25, LUK: 10, DEF: 25, INT: 30 });
  b.learnedArtIds = [art.id];
  return b;
}
const OPPONENTS = ["thug", "bandit", "wild_wolf", "sect_disciple", "blade_master", "shadow_assassin", "bandit_chief", "wudang_disciple"];
const opp = (id: string) => { const o = getOpponent(id); assert.ok(o, id); return o!.build(); };

check("legality + finish: seeded 1v1 / 1v2 / 2v2 battles, both sides AI, winner within 300 turns", () => {
  let n = 0, allyWins = 0, total = 0, skills = 0, waits = 0;
  for (let seed = 1; seed <= 36; seed++) {
    const rng = seeded(seed * 7919);
    const pick = () => (rng() < 0.5 ? opp(OPPONENTS[Math.floor(rng() * OPPONENTS.length)]) : sample(Math.floor(rng() * 200)));
    const shape = seed % 3; // 0 = 1v1 · 1 = 1v2 · 2 = 2v2
    const specs: UnitSpec[] = [{ id: "a1", team: "ally", build: seed % 2 ? hero : pick(), look, leader: true }];
    if (shape === 2) specs.push({ id: "a2", team: "ally", build: pick(), look });
    specs.push({ id: "e1", team: "enemy", build: pick(), look });
    if (shape >= 1) specs.push({ id: "e2", team: "enemy", build: pick(), look });
    const blocked = seed % 4 === 0 ? [{ x: 5, y: 3 }, { x: 4, y: 1 }] : undefined;
    const s = createGridBattle(specs, { blocked });
    const r = withRandom(rng, () => runAiBattle(s));
    assert.ok(isOver(s) && s.winner, `seed ${seed} (${specs.length} units): finished with a winner (${r.turns} turns)`);
    n++; total += r.turns; skills += r.skills; waits += r.waits;
    if (s.winner === "A") allyWins++;
  }
  console.log(`  ${n} battles · allies won ${allyWins} · avg ${Math.round(total / n)} turns · ${skills} casts / ${waits} waits`);
});

check("long attrition battles (tanky sampled builds: cooldowns, MP, arts, buffs) stay legal and finish", () => {
  let total = 0, longest = 0, casts = 0, waits = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const rng = seeded(seed * 31337);
    const tank = (i: number) => { const b = sample(i); b.stats = { ...b.stats, VIT: 160, DEF: 60 }; return b; };
    const specs: UnitSpec[] = [
      { id: "a1", team: "ally", build: tank(seed * 3), look, leader: true },
      { id: "e1", team: "enemy", build: tank(seed * 3 + 1), look },
    ];
    if (seed % 2) specs.push({ id: "a2", team: "ally", build: tank(seed * 3 + 2), look }, { id: "e2", team: "enemy", build: tank(seed * 3 + 100), look });
    const s = createGridBattle(specs);
    // VIT 160 tanks grind: allow a longer cap than ordinary fights (seed 5 runs ~330).
    const r = withRandom(rng, () => runAiBattle(s, 600));
    assert.ok(isOver(s) && s.winner, `tank seed ${seed}: finished (${r.turns} turns)`);
    total += r.turns; longest = Math.max(longest, r.turns); casts += r.skills; waits += r.waits;
  }
  console.log(`  10 attrition battles · avg ${Math.round(total / 10)} turns (longest ${longest}) · ${casts} casts / ${waits} waits`);
});

check("6-unit 3v3 melee brawls and hero-vs-pack finish too", () => {
  for (let seed = 1; seed <= 6; seed++) {
    const rng = seeded(seed * 104729);
    const s = createGridBattle([
      { id: "a1", team: "ally", build: hero, look, leader: true },
      { id: "a2", team: "ally", build: opp("sect_disciple"), look },
      { id: "a3", team: "ally", build: sample(seed), look },
      { id: "e1", team: "enemy", build: opp("thug"), look },
      { id: "e2", team: "enemy", build: opp("bandit"), look },
      { id: "e3", team: "enemy", build: sample(seed + 50), look },
    ], { blocked: seed % 2 ? [{ x: 4, y: 3 }, { x: 5, y: 2 }, { x: 5, y: 4 }] : undefined });
    const r = withRandom(rng, () => runAiBattle(s));
    assert.ok(isOver(s) && s.winner, `3v3 seed ${seed}: finished (${r.turns} turns)`);
  }
});

check("a melee unit next to an enemy attacks instead of waiting", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 4, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
  ]);
  giveTurn(s, "p");
  const plan = planTurn(s, "p");
  assert.equal(plan.action.t, "skill");
  assert.ok(plan.action.t === "skill" && plan.action.target.x === 5 && plan.action.target.y === 3);
  assert.equal(JSON.stringify(planTurn(s, "p")), JSON.stringify(plan), "deterministic");
});

check("a melee unit out of reach walks in and strikes in the same turn", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
  ]);
  giveTurn(s, "p");
  const plan = planTurn(s, "p");
  assert.ok(plan.move && manhattan(plan.move, { x: 5, y: 3 }) === 1, `moved adjacent: ${JSON.stringify(plan)}`);
  assert.equal(plan.action.t, "skill");
  assert.equal(withRandom(() => 0.5, () => applyAction(s, "p", { t: "move", to: plan.move! }) && applyAction(s, "p", plan.action)), true);
});

check("far away: walks strictly closer every turn, then strikes (no oscillation)", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE], { AGI: 1, POW: 1 }), { x: 0, y: 0 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE], { AGI: 1, POW: 1 }), { x: 9, y: 6 }),
  ], { blocked: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }] });
  let d = manhattan(U(s, "p").pos, U(s, "e1").pos);
  for (let turn = 0; ; turn++) {
    assert.ok(turn < 6, "reached the foe within 6 turns");
    giveTurn(s, "p");
    const plan = playAiTurn(s, U(s, "p"));
    if (plan.action.t === "skill") break;
    const d2 = manhattan(U(s, "p").pos, U(s, "e1").pos);
    assert.ok(d2 < d, `closer ${d} → ${d2}`); d = d2;
  }
});

check("a ranged unit with an enemy in range doesn't walk into melee", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [KNIFE], { DEX: 20 }), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
  ]);
  giveTurn(s, "p");
  const plan = planTurn(s, "p");
  assert.equal(plan.action.t, "skill");
  assert.ok(plan.action.t === "skill" && plan.action.slot === 0, `knife chosen: ${JSON.stringify(plan)}`);
  const end = plan.move ?? U(s, "p").pos;
  assert.ok(manhattan(end, U(s, "e1").pos) >= 2, `keeps distance: ${JSON.stringify(plan)}`);
  assert.equal(plan.move, undefined, "no need to move at all");
});

check("an area skill is aimed to catch 2+ enemies", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [AREA], { INT: 30 }), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
    unit("e2", "enemy", build("E", [MELEE]), { x: 5, y: 4 }),
    unit("e3", "enemy", build("E", [MELEE]), { x: 8, y: 0 }),
  ]);
  giveTurn(s, "p");
  const here = U(s, "p").pos;
  const both = scoreAction(s, "p", here, 0, { x: 5, y: 3 })!, one = scoreAction(s, "p", here, 0, { x: 4, y: 2 });
  assert.equal(one, null, "(4,2) diamond misses both");
  const single = scoreAction(s, "p", here, 0, { x: 6, y: 3 })!;
  assert.ok(both > single * 1.8, `two targets ≈ double value (${both.toFixed(1)} vs ${single.toFixed(1)})`);
  const plan = planTurn(s, "p");
  assert.equal(plan.action.t, "skill");
  if (plan.move) applyAction(s, "p", { t: "move", to: plan.move });
  const hit = plan.action.t === "skill" ? targetsFor(s, "p", plan.action.slot, plan.action.target).map((u) => u.id).sort() : [];
  assert.deepEqual(hit, ["e1", "e2"], `covers both: ${JSON.stringify(plan)}`);
});

check("knife vs area song with both foes in reach: the song that hits two wins", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [KNIFE, AREA], { INT: 40, DEX: 5, STR: 5 }), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
    unit("e2", "enemy", build("E", [MELEE]), { x: 5, y: 2 }),
  ]);
  giveTurn(s, "p");
  const plan = planTurn(s, "p");
  if (plan.move) applyAction(s, "p", { t: "move", to: plan.move });
  assert.ok(plan.action.t === "skill");
  const hit = plan.action.t === "skill" ? targetsFor(s, "p", plan.action.slot, plan.action.target) : [];
  assert.equal(plan.action.t === "skill" && plan.action.slot, 1, `area slot chosen: ${JSON.stringify(plan)}`);
  assert.equal(hit.length, 2);
});

check("heals are used when low, not when healthy", () => {
  const mk = (hpFrac: number, enemyPos: Cell) => {
    const b = build("A", [MELEE, `art:${HEAL_ART}`], { INT: 30, POW: 30 });
    b.learnedArtIds = [HEAL_ART];
    const s = createGridBattle([
      unit("p", "ally", b, { x: 1, y: 3 }, { leader: true }),
      unit("e1", "enemy", build("E", [MELEE], { VIT: 200 }), enemyPos),
    ]);
    const p = U(s, "p");
    p.hp = Math.max(1, Math.round(p.derived.HP * hpFrac));
    giveTurn(s, "p");
    return s;
  };
  const low = mk(0.2, { x: 9, y: 3 });
  const plan = planTurn(low, "p");
  assert.ok(plan.action.t === "skill" && plan.action.slot === 1, `heals when low and nothing to hit: ${JSON.stringify(plan)}`);
  if (plan.move) applyAction(low, "p", { t: "move", to: plan.move });
  const hp = U(low, "p").hp;
  assert.equal(withRandom(() => 0.5, () => applyAction(low, "p", plan.action)), true);
  assert.ok(U(low, "p").hp > hp, "healed");

  const lowAdj = mk(0.15, { x: 2, y: 3 });
  const planAdj = planTurn(lowAdj, "p");
  assert.ok(planAdj.action.t === "skill" && planAdj.action.slot === 1, `heals at 15 % even next to a tanky foe: ${JSON.stringify(planAdj)}`);

  const healthy = mk(0.9, { x: 9, y: 3 });
  const plan2 = planTurn(healthy, "p");
  assert.ok(!(plan2.action.t === "skill" && plan2.action.slot === 1), `no heal at 90 %: ${JSON.stringify(plan2)}`);
});

check("after a manual move (phase moved) the plan has no move and stays legal", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE, KNIFE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 6, y: 3 }),
  ]);
  giveTurn(s, "p");
  assert.equal(applyAction(s, "p", { t: "move", to: { x: 3, y: 3 } }), true);
  const plan = planTurn(s, "p");
  assert.equal(plan.move, undefined);
  assert.equal(withRandom(() => 0.5, () => applyAction(s, "p", plan.action)), true);
});

check("not the active unit / battle over → harmless wait", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 6, y: 3 }),
  ]);
  assert.deepEqual(planTurn(s, "p"), { action: { t: "wait" } });
  giveTurn(s, "p");
  assert.deepEqual(planTurn(s, "e1"), { action: { t: "wait" } });
});

check("planning time", () => {
  // A busy 3v3 board with full sampled builds, timed separately from the battles above.
  const s = createGridBattle([0, 1, 2, 3, 4, 5].map((i) => ({
    id: `u${i}`, team: i < 3 ? "ally" : "enemy", build: sample(i * 13 + 5), look, leader: i === 0,
  } as UnitSpec)));
  let ms = 0, n = 0;
  withRandom(seeded(42), () => {
    for (let t = 0; t < 60 && !isOver(s); t++) {
      const u = beginNextTurn(s);
      if (!u) break;
      const t0 = performance.now();
      planTurn(s, u.id);
      ms += performance.now() - t0; n++;
      playAiTurn(s, u);
    }
  });
  const avgAll = planMs / Math.max(1, plans);
  console.log(`  3v3 sample: ${(ms / Math.max(1, n)).toFixed(2)} ms/turn over ${n} turns · all battles: ${avgAll.toFixed(2)} ms avg, worst ${worstMs.toFixed(1)} ms over ${plans} plans`);
  assert.ok(avgAll < 15, `average plan time ${avgAll.toFixed(2)} ms < 15 ms`);
  assert.ok(ms / Math.max(1, n) < 15, "3v3 average under 15 ms");

  // The largest world battle: the hero against 7 foes on the 15 × 10 board.
  const big = createGridBattle([0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    id: `b${i}`, team: i === 0 ? "ally" : "enemy", build: sample(i * 7 + 3), look, leader: i === 0,
  } as UnitSpec)), boardSizeFor(8));
  assert.deepEqual([big.cols, big.rows], [15, 10]);
  let bigMs = 0, bigN = 0, bigWorst = 0;
  withRandom(seeded(7), () => {
    for (let t = 0; t < 80 && !isOver(big); t++) {
      const u = beginNextTurn(big);
      if (!u) break;
      const t0 = performance.now();
      planTurn(big, u.id);
      const dt = performance.now() - t0;
      bigMs += dt; bigN++; bigWorst = Math.max(bigWorst, dt);
      playAiTurn(big, u);
    }
  });
  console.log(`  1v7 on 15 × 10: ${(bigMs / Math.max(1, bigN)).toFixed(2)} ms/turn over ${bigN} turns, worst ${bigWorst.toFixed(1)} ms`);
  assert.ok(bigMs / Math.max(1, bigN) < 25, "1v7 average under 25 ms");
});

console.log(`${checks} grid AI checks passed`);
