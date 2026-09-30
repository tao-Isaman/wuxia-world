import assert from "node:assert/strict";
import { ARTS, SKILLS, TIERS, getSkill } from "../lib/game/data";
import type { CharacterBuild, StatBlock } from "../lib/game/types";
import {
  activeUnit, aimableFor, applyAction, artGrid, beginNextTurn, cellKey, createGridBattle, isOver, predictOrder,
  reachableFor, slotGrid, slotReady, unitById,
  type Cell, type GridBattleState, type GridUnit, type UnitSpec,
} from "../lib/game/grid";
import { getOpponent } from "../lib/world/data/opponents";
import { useWorldStore } from "../store/world-store";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
/** Pin Math.random (battle.ts rolls hit / crit / stun with it). */
function withRandom<T>(v: number, run: () => T): T {
  const random = Math.random; Math.random = () => v;
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
/** Hand the turn to `id` deterministically (a full gauge acts first). */
function giveTurn(s: GridBattleState, id: string): GridUnit {
  U(s, id).gauge = 100;
  const u = beginNextTurn(s)!;
  assert.equal(u.id, id);
  return u;
}

const MELEE = "sf";           // fist T0 · range 1 · single
const AREA = "sa";            // music T2 · range 2–4 · diamond 1
const BUFF = "cs";            // self · buff_eva
assert.deepEqual(slotGrid(MELEE)?.range, { min: 1, max: 1 });
assert.equal(slotGrid(AREA)?.area.kind, "diamond");
assert.equal(slotGrid(BUFF)?.target, "self");
const AREA_ART = ARTS.find((a) => a.act && artGrid(a)?.target === "enemy" && artGrid(a)?.area.kind === "diamond")!;
assert.ok(AREA_ART, "an area art active exists");

check("layout: teams in their columns, spread, no overlaps, never on rocks, names deduped", () => {
  const blocked = [{ x: 2, y: 3 }, { x: 7, y: 3 }];
  const s = createGridBattle([
    unit("p", "ally", build("ฮีโร่", [MELEE]), undefined, { leader: true }),
    unit("a2", "ally", build("ศิษย์", [MELEE])),
    unit("a3", "ally", build("ศิษย์", [MELEE])),
    unit("e1", "enemy", build("โจร", [MELEE])),
    unit("e2", "enemy", build("โจร", [MELEE])),
    unit("e3", "enemy", build("โจร", [MELEE])),
  ], { blocked });
  const keys = new Set(s.units.map((u) => cellKey(u.pos)));
  assert.equal(keys.size, 6);
  for (const b of blocked) assert.ok(!keys.has(cellKey(b)));
  for (const u of s.units) {
    assert.ok(u.team === "ally" ? u.pos.x >= 2 && u.pos.x <= 3 : u.pos.x >= 6 && u.pos.x <= 7, `${u.id} column`);
    assert.ok(Math.abs(u.pos.y - 3) <= 2, `${u.id} near the middle row`);
    assert.equal(u.facing, u.team === "ally" ? "right" : "left");
    assert.equal(u.move, Math.max(3, Math.min(6, 3 + Math.floor(u.derived.Spd / 80))));
    assert.equal(u.cd.length, u.build.skillIds.length);
  }
  assert.deepEqual(s.units.map((u) => u.name), ["ฮีโร่", "ศิษย์", "ศิษย์ 2", "โจร", "โจร 2", "โจร 3"]);
  assert.equal(s.hA, U(s, "p").hp); assert.equal(s.hB, U(s, "e1").hp);
  assert.equal(s.winner, null); assert.equal(s.phase, "start");
});

check("move: range, rocks and enemies stop, allies passable but not stoppable, once per turn", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE], { AGI: 1, POW: 1 }), { x: 1, y: 3 }, { leader: true }),
    unit("a2", "ally", build("B", [MELEE]), { x: 2, y: 3 }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 4, y: 3 }),
  ], { blocked: [{ x: 1, y: 2 }] });
  const p = giveTurn(s, "p");
  assert.equal(p.move, 3);
  const reach = reachableFor(s, "p");
  assert.ok(reach.has("3,3"), "walks through the ally");
  assert.deepEqual(reach.get("3,3"), [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }]);
  assert.ok(!reach.has("2,3"), "cannot stop on the ally");
  assert.ok(!reach.has("4,3") && !reach.has("5,3"), "enemy blocks");
  assert.ok(!reach.has("1,2") && !reach.has("1,1"), "rock blocks (1,1 needs a detour > 3)");
  assert.ok(!reach.has("5,4"), "out of range");
  assert.equal(reachableFor(s, "e1").size, 0, "not the active unit");
  assert.equal(applyAction(s, "p", { t: "move", to: { x: 4, y: 3 } }), false);
  assert.equal(applyAction(s, "e1", { t: "move", to: { x: 5, y: 3 } }), false);
  assert.equal(applyAction(s, "p", { t: "move", to: { x: 3, y: 3 } }), true);
  assert.equal(s.phase, "moved");
  assert.deepEqual(p.pos, { x: 3, y: 3 });
  assert.equal(p.facing, "right");
  const ev = s.events[s.events.length - 1];
  assert.ok(ev.t === "move" && ev.path.length === 3);
  assert.equal(reachableFor(s, "p").size, 0);
  assert.equal(applyAction(s, "p", { t: "move", to: { x: 3, y: 4 } }), false, "only one move");
});

check("turn order follows Spd (carry-over ATB) and predictOrder is side-effect free", () => {
  const s = createGridBattle([
    unit("fast", "ally", build("เร็ว", [MELEE], { AGI: 120, POW: 60 }), { x: 1, y: 3 }, { leader: true }),
    unit("slow", "enemy", build("ช้า", [MELEE], { AGI: 1, POW: 1 }), { x: 8, y: 3 }),
  ]);
  const snapshot = JSON.stringify(s);
  const predicted = predictOrder(s, 30);
  assert.equal(JSON.stringify(s), snapshot, "predictOrder must not mutate");
  const actual: string[] = [];
  for (let i = 0; i < 30; i++) {
    const u = beginNextTurn(s)!;
    actual.push(u.id);
    assert.equal(predictOrder(s, 1)[0], u.id, "active unit first");
    applyAction(s, u.id, { t: "wait" });
  }
  assert.deepEqual(actual, predicted);
  const fast = actual.filter((id) => id === "fast").length, slow = actual.length - fast;
  const ratio = (U(s, "fast").derived.Spd + 60) / (U(s, "slow").derived.Spd + 60);
  assert.ok(ratio > 3, `fixture ratio ${ratio}`);
  assert.ok(fast >= slow * 2.5, `fast ${fast} vs slow ${slow}`);
});

check("melee skill only reaches adjacent foes; empty or out-of-range aims are rejected", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E1", [MELEE]), { x: 3, y: 3 }),
    unit("e2", "enemy", build("E2", [MELEE]), { x: 5, y: 3 }),
  ]);
  giveTurn(s, "p");
  const aims = aimableFor(s, "p", 0).map(cellKey);
  assert.ok(aims.includes("3,3") && !aims.includes("5,3"));
  const hp2 = U(s, "e2").hp;
  assert.equal(applyAction(s, "p", { t: "skill", slot: 0, target: { x: 5, y: 3 } }), false);
  assert.equal(applyAction(s, "p", { t: "skill", slot: 0, target: { x: 2, y: 2 } }), false, "nobody there");
  const hp1 = U(s, "e1").hp;
  assert.equal(withRandom(0.01, () => applyAction(s, "p", { t: "skill", slot: 0, target: { x: 3, y: 3 } })), true);
  assert.ok(U(s, "e1").hp < hp1);
  assert.equal(U(s, "e2").hp, hp2);
  const ev = s.events[s.events.length - 1];
  assert.ok(ev.t === "cast" && ev.results.length === 1 && ev.results[0].unitId === "e1" && ev.results[0].damages[0] > 0);
  assert.equal(ev.t === "cast" && ev.source.id, MELEE);
  assert.equal(s.phase, "start"); assert.equal(s.activeId, null);
  assert.equal(U(s, "p").skillUses[MELEE], 1);
  assert.equal(U(s, "e1").hitsReceived, 1);
  assert.equal(s.hitsReceived.B, 1, "first enemy mirrored");
});

check("area skill hits every foe inside (not allies, not outside) and charges one cooldown / use", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [AREA]), { x: 1, y: 3 }, { leader: true }),
    unit("a2", "ally", build("B", [MELEE]), { x: 3, y: 3 }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 4, y: 3 }),
    unit("e2", "enemy", build("E", [MELEE]), { x: 5, y: 3 }),
    unit("e3", "enemy", build("E", [MELEE]), { x: 4, y: 4 }),
    unit("e4", "enemy", build("E", [MELEE]), { x: 7, y: 3 }),
  ]);
  giveTurn(s, "p");
  const before = new Map(s.units.map((u) => [u.id, u.hp]));
  assert.equal(withRandom(0.01, () => applyAction(s, "p", { t: "skill", slot: 0, target: { x: 4, y: 3 } })), true);
  for (const id of ["e1", "e2", "e3"]) {
    assert.ok(U(s, id).hp < before.get(id)!, `${id} hit`);
    assert.ok(U(s, id).status.debuffs.some((d) => d.t === "debuff_acc"), `${id} debuffed`);
  }
  assert.equal(U(s, "e4").hp, before.get("e4"));
  assert.equal(U(s, "a2").hp, before.get("a2"));
  assert.equal(U(s, "p").cd[0], TIERS[getSkill(AREA)!.ti].cd);
  assert.equal(U(s, "p").skillUses[AREA], 1);
  const ev = s.events[s.events.length - 1];
  assert.ok(ev.t === "cast");
  assert.deepEqual(ev.results.map((r) => r.unitId).sort(), ["e1", "e2", "e3"]);
  assert.equal(ev.cells.length, 5);
  assert.equal(slotReady(s, "p", 0), false, "on cooldown");
});

check("self buff lands on the caster and damages nobody", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [BUFF]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 3, y: 3 }),
  ]);
  giveTurn(s, "p");
  const hp = U(s, "e1").hp, hits = U(s, "e1").hitsReceived;
  assert.deepEqual(aimableFor(s, "p", 0), [{ x: 2, y: 3 }]);
  assert.equal(applyAction(s, "p", { t: "skill", slot: 0, target: { x: 3, y: 3 } }), false, "self skills aim at own cell");
  assert.equal(applyAction(s, "p", { t: "skill", slot: 0, target: { x: 2, y: 3 } }), true);
  assert.ok(U(s, "p").status.buffs.some((b) => b.t === "buff_eva"));
  assert.equal(U(s, "e1").hp, hp); assert.equal(U(s, "e1").hitsReceived, hits);
  assert.equal(U(s, "e1").status.buffs.length, 0);
  const ev = s.events[s.events.length - 1];
  assert.ok(ev.t === "cast" && ev.results.length === 1 && ev.results[0].unitId === "p" && ev.results[0].damages.length === 0);
});

check("inner-art area active spends MP once, one cooldown, one art use", () => {
  const act = AREA_ART.act!;
  const b = build("A", [`art:${AREA_ART.id}`], { INT: 60, POW: 60 });
  b.learnedArtIds = [AREA_ART.id];
  const s = createGridBattle([
    unit("p", "ally", b, { x: 1, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE], { VIT: 300, DEF: 200 }), { x: 3, y: 3 }),
    unit("e2", "enemy", build("E", [MELEE], { VIT: 300, DEF: 200 }), { x: 3, y: 4 }),
  ]);
  const p = giveTurn(s, "p");
  assert.ok(p.mp >= act.c, "fixture has the MP");
  const mp = p.mp;
  const aim = aimableFor(s, "p", 0).find((c) => c.x === 3 && c.y === 3) ?? aimableFor(s, "p", 0).find((c) => c.x === 2 && c.y === 3)!;
  assert.equal(withRandom(0.01, () => applyAction(s, "p", { t: "skill", slot: 0, target: aim })), true);
  assert.equal(p.mp, mp - act.c);
  assert.equal(p.cd[0], act.cd);
  assert.equal(p.artUses[AREA_ART.id], 1);
  const ev = s.events.findLast((e) => e.t === "cast");
  assert.ok(ev?.t === "cast" && ev.source.kind === "art" && ev.results.length === 2);
  assert.equal(s.phase, "start", "both foes survive the fixture");
  p.mp = act.c - 1; p.cd[0] = 0;
  assert.equal(slotReady(s, "p", 0), false, "short of MP");
});

check("poison, durations and cooldowns tick only on the owner's turn; a stunned unit skips", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 6, y: 3 }),
  ]);
  const e = U(s, "e1"), p = U(s, "p");
  e.status.debuffs.push({ t: "debuff_poison", n: "พิษ", pp: 10, u: 3 });
  e.cd[0] = 2; p.cd[0] = 2;
  const hp = e.hp;
  giveTurn(s, "p");
  assert.equal(e.hp, hp); assert.equal(e.status.debuffs[0].u, 3); assert.equal(e.cd[0], 2);
  assert.equal(p.cd[0], 1);
  applyAction(s, "p", { t: "wait" });
  giveTurn(s, "e1");
  assert.equal(e.hp, hp - Math.round(e.derived.HP * 0.1));
  assert.equal(e.status.debuffs[0].u, 2); assert.equal(e.cd[0], 1); assert.equal(p.cd[0], 1);
  applyAction(s, "e1", { t: "wait" });

  e.status.debuffs.push({ t: "stun", n: "สตัน", u: 2 });
  e.gauge = 100; p.gauge = 0;
  const seq = s.events.length;
  const next = beginNextTurn(s)!;
  assert.equal(next.id, "p", "stunned enemy lost its turn");
  assert.ok(s.events.slice(seq).some((ev) => ev.t === "stunned" && ev.unitId === "e1"));
  assert.ok(s.log.some((l) => l.txt.includes("ถูกสตัน")));
});

check("DoT death on the owner's turn ends the battle", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 6, y: 3 }, { hp: 1 }),
  ]);
  U(s, "e1").status.debuffs.push({ t: "debuff_poison", n: "พิษ", pp: 50, u: 3 });
  U(s, "e1").gauge = 100;
  assert.equal(beginNextTurn(s), null);
  assert.equal(isOver(s), true); assert.equal(s.winner, "A"); assert.equal(s.winnerTeam, "ally");
  assert.equal(U(s, "e1").alive, false);
});

check("victory: winner + compat mirrors from the leader", () => {
  const s = createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true, hp: 50 }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 3, y: 3 }, { hp: 1 }),
  ]);
  giveTurn(s, "p");
  assert.equal(withRandom(0.01, () => applyAction(s, "p", { t: "skill", slot: 0, target: { x: 3, y: 3 } })), true);
  assert.equal(s.phase, "over"); assert.equal(s.winner, "A"); assert.equal(s.winnerTeam, "ally");
  assert.equal(s.hA, U(s, "p").hp); assert.equal(s.hA, 50); assert.equal(s.mpA, U(s, "p").mp);
  assert.equal(s.hB, 0);
  assert.equal(s.skillUses.A[MELEE], 1); assert.equal(s.hitsReceived.B, 1);
  const [cast, end] = s.events.slice(-2);
  assert.ok(cast.t === "cast" && cast.results[0].killed);
  assert.ok(end.t === "end" && end.winner === "ally" && !end.escaped);
  assert.equal(beginNextTurn(s), null);
  assert.equal(applyAction(s, "p", { t: "wait" }), false);
});

check("flee: leader only; injected rng decides success / failure", () => {
  const mk = () => createGridBattle([
    unit("p", "ally", build("A", [MELEE]), { x: 2, y: 3 }, { leader: true }),
    unit("a2", "ally", build("B", [MELEE]), { x: 1, y: 3 }),
    unit("e1", "enemy", build("E", [MELEE]), { x: 7, y: 3 }),
  ]);
  const ok = mk(); giveTurn(ok, "p");
  assert.equal(applyAction(ok, "p", { t: "flee" }, () => 0), true);
  assert.equal(ok.escaped, true); assert.equal(ok.phase, "over"); assert.equal(ok.winner, null);
  assert.deepEqual(ok.events.slice(-2).map((e) => e.t), ["flee", "end"]);

  const fail = mk(); giveTurn(fail, "p");
  assert.equal(applyAction(fail, "p", { t: "flee" }, () => 0.999), true);
  assert.equal(fail.escaped, undefined); assert.equal(fail.phase, "start");
  const ev = fail.events[fail.events.length - 1];
  assert.ok(ev.t === "flee" && !ev.success);

  const side = mk(); giveTurn(side, "a2");
  assert.equal(applyAction(side, "a2", { t: "flee" }, () => 0), false, "companions can't flee");
});

// ─── Full battles with real builds ─────────────────────────────────────
/** Trivial driver: attack a foe in reach (after stepping closer if needed), else wait. */
function playTurn(s: GridBattleState, u: GridUnit): void {
  const foes = () => s.units.filter((o) => o.alive && o.team !== u.team);
  const tryAttack = () => {
    for (let slot = 0; slot < u.build.skillIds.length; slot++) {
      const prof = slotGrid(u.build.skillIds[slot]);
      if (!prof || prof.target !== "enemy" || !slotReady(s, u.id, slot)) continue;
      for (const aim of aimableFor(s, u.id, slot))
        if (foes().some((f) => f.pos.x === aim.x && f.pos.y === aim.y) && applyAction(s, u.id, { t: "skill", slot, target: aim })) return true;
    }
    return false;
  };
  if (tryAttack()) return;
  const dist = (c: Cell) => Math.min(...foes().map((f) => Math.abs(f.pos.x - c.x) + Math.abs(f.pos.y - c.y)));
  const best = [...reachableFor(s, u.id).values()].map((p) => p[p.length - 1]).sort((a, b) => dist(a) - dist(b))[0];
  if (best && (best.x !== u.pos.x || best.y !== u.pos.y)) assert.equal(applyAction(s, u.id, { t: "move", to: best }), true);
  if (!tryAttack()) assert.equal(applyAction(s, u.id, { t: "wait" }), true);
}
function runBattle(s: GridBattleState): number {
  let turns = 0, lastSeq = 0;
  while (!isOver(s) && turns < 300) {
    const u = beginNextTurn(s);
    if (!u) break;
    assert.equal(activeUnit(s), u);
    playTurn(s, u);
    turns++;
  }
  for (const e of s.events) { assert.ok(e.seq > lastSeq, "event seq increases"); lastSeq = e.seq; }
  return turns;
}

useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
const hero = useWorldStore.getState().playerBuild!;
assert.ok(hero, "startNewGame gives a player build");

check("full 1v1 battles with real builds always finish with a winner within 300 turns", () => {
  for (const id of ["thug", "bandit", "wild_wolf", "sect_disciple", "blade_master", "shadow_assassin", "legendary_swordsman"]) {
    const opp = getOpponent(id)!;
    assert.ok(opp, id);
    const s = createGridBattle([
      { id: "hero", team: "ally", build: hero, look, leader: true },
      { id: "foe", team: "enemy", build: opp.build(), look },
    ]);
    const turns = runBattle(s);
    assert.ok(isOver(s) && s.winner, `${id}: finished (${turns} turns)`);
    assert.equal(s.hA, U(s, "hero").hp);
    console.log(`  ${id}: ${s.winner === "A" ? "hero" : "foe"} won in ${turns} turns`);
  }
});

check("SKILLS-sampled builds (every weapon family, arts included) fight to a finish in 1v1 and 1v2", () => {
  // Deterministic sample: 4 attack skills + 1 support per build, walking the table with a stride.
  const attacks = SKILLS.filter((sk) => sk.at && !sk.id.startsWith("bst_"));
  const support = SKILLS.filter((sk) => slotGrid(sk.id)?.target === "self");
  const arts = ARTS.filter((a) => a.act);
  const sample = (i: number): CharacterBuild => {
    const ids = [0, 1, 2, 3].map((k) => attacks[(i * 53 + k * 17) % attacks.length].id);
    const b = build(`นักสู้${i}`, [...ids, support[(i * 7) % support.length].id, `art:${arts[(i * 11) % arts.length].id}`],
      { STR: 30 + (i % 3) * 10, AGI: 20 + (i % 4) * 15, POW: 30, VIT: 40, DEX: 25, LUK: 10, DEF: 25, INT: 30 });
    b.learnedArtIds = [arts[(i * 11) % arts.length].id];
    return b;
  };
  let allyWins = 0, enemyWins = 0, totalTurns = 0;
  for (let i = 0; i < 12; i++) {
    const specs: UnitSpec[] = [
      { id: "a", team: "ally", build: sample(i), look, leader: true },
      { id: "b", team: "enemy", build: sample(i + 12), look },
    ];
    if (i % 3 === 0) specs.push({ id: "c", team: "enemy", build: sample(i + 24), look });
    const s = createGridBattle(specs);
    const turns = runBattle(s);
    assert.ok(isOver(s) && s.winner, `sample ${i}: finished (${turns} turns)`);
    if (s.winner === "A") allyWins++; else enemyWins++;
    totalTurns += turns;
  }
  console.log(`  12 sampled battles: allies ${allyWins} · enemies ${enemyWins} · avg ${Math.round(totalTurns / 12)} turns`);
});

check("full 1v2 battles (hero vs pack, strong foe vs two heroes) finish within 300 turns", () => {
  const pack = createGridBattle([
    { id: "hero", team: "ally", build: hero, look, leader: true },
    { id: "t1", team: "enemy", build: getOpponent("thug")!.build(), look },
    { id: "t2", team: "enemy", build: getOpponent("thug")!.build(), look },
  ]);
  const t1 = runBattle(pack);
  assert.ok(isOver(pack) && pack.winner, `pack finished (${t1})`);
  assert.equal(U(pack, "t2").name, `${U(pack, "t1").name} 2`);
  const duo = createGridBattle([
    { id: "h1", team: "ally", build: getOpponent("sect_disciple")!.build(), look, leader: true },
    { id: "h2", team: "ally", build: getOpponent("wudang_disciple")!.build(), look },
    { id: "boss", team: "enemy", build: getOpponent("bandit_chief")!.build(), look },
  ]);
  const t2 = runBattle(duo);
  assert.ok(isOver(duo) && duo.winner, `duo finished (${t2})`);
  console.log(`  pack: ${pack.winner} in ${t1} · duo: ${duo.winner} in ${t2}`);
});

console.log(`${checks} grid engine checks passed`);
