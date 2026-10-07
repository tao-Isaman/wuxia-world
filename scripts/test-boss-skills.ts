// The legendary beasts' (บอส) moves, arts and effects (docs/combat.md#boss-effects,
// docs/design/foes-and-bosses.md "Boss skills"). Run: bun run test:boss-skills
import assert from "node:assert/strict";
import {
  ARTS, BEAST_SECT, SKILLS, TIERS, getArt, getSkill, isBeastMove, isBossArt, isBossMove,
} from "../lib/game/data";
import type { BattleState, CharacterBuild, Skill, StatBlock } from "../lib/game/types";
import { calcSkillDamage, makeContext, makeInitialState, resolveSkill, skillCooldown } from "../lib/game/battle";
import { BLEED_CAP, applyEnemyEffect, applySelfEffect, checkPassive, frenzyPct, healHp, tickSideEffects } from "../lib/game/effects";
import { atkPctOf, landDamage } from "../lib/game/meridian-battle";
import { describeEffectThai, skillSummaryLines } from "../lib/game/skill-text";
import {
  activeUnit, applyAction, beginNextTurn, createGridBattle, isOver, planTurn, reachableFor, cellKey, skillGrid, targetsFor, unitById,
  type GridBattleState, type UnitSpec,
} from "../lib/game/grid";
import { castVfx } from "../lib/stage/cast-vfx";
import { QUESTS, SCENES, SHOPS } from "../lib/world/data";

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

const STATS: StatBlock = { STR: 40, AGI: 30, POW: 30, VIT: 50, DEX: 30, LUK: 10, DEF: 30, INT: 30 };
const build = (name: string, skillIds: (string | null)[], stats: Partial<StatBlock> = {}, art = "none"): CharacterBuild => ({
  name, stats: { ...STATS, ...stats }, artId: art, artLevel: 10, skillIds,
  equipment: { W: null, A: null, H: null, B: null, BR: [null, null], R: [null, null], C: [null, null] },
  skillLevels: Object.fromEntries(skillIds.filter((s): s is string => !!s && !s.startsWith("art:")).map((s) => [s, 10])),
});
const names = { A: "ผู้กล้า", B: "อสูร" };
const duel = (a = build("ผู้กล้า", ["sf"]), b = build("อสูร", ["sf"])): BattleState => makeInitialState(a, b);
const look = { kind: "creature", frame: 0 } as const;

// ─── The contract's moves and arts ─────────────────────────────────────
const BOSS_MOVES: Record<string, [string, string][]> = {
  serpent: [["bss_serpent_fang", "เขี้ยวพิษทองคำ"], ["bss_serpent_coil", "รัดกระดูกแหลก"], ["bss_serpent_molt", "ลอกคราบเกล็ดทอง"]],
  tiger: [["bss_tiger_claw", "กรงเล็บเลือดคราม"], ["bss_tiger_roar", "คำรามสะท้านภพ"], ["bss_tiger_frenzy", "โลหิตคลั่ง"]],
  eagle: [["bss_eagle_feathers", "ขนนกพันกระบี่"], ["bss_eagle_dive", "ดิ่งฟ้าผ่าภูผา"], ["bss_eagle_gale", "ปีกพายุ"]],
  turtle: [["bss_turtle_shell", "กระดองแบกตะวัน"], ["bss_turtle_sun", "ตะวันแผดเผา"], ["bss_turtle_quake", "ทับภูผา"]],
  crab: [["bss_crab_pincers", "คีมพันดาบ"], ["bss_crab_mirror", "กระดองสะท้อนดาบ"], ["bss_crab_tide", "ฟองคลื่นหมอก"]],
  bull: [["bss_bull_charge", "เขาเพลิงพุ่งทะลวง"], ["bss_bull_stomp", "กระทืบธรณี"], ["bss_bull_rage", "เพลิงโทสะ"]],
};
/** Each boss's own effect kinds (contract table), found in its moves' se / ee / pen. */
const OWN_EFFECTS: Record<string, string[]> = {
  serpent: ["bind", "molt"], tiger: ["bleed", "frenzy"], eagle: ["pierce", "blind"],
  turtle: ["sun_shell", "scorch"], crab: ["sunder"], bull: ["scorch", "frenzy"],
};
const effectsOf = (sk: Skill) => [sk.se?.t, sk.ee?.t, sk.pen ? "pierce" : undefined].filter(Boolean) as string[];

check("the 18 bss_* moves: contract ids and Thai names, สัตว์ร้าย, T5, each boss's own effects, Thai text for every effect", () => {
  const all = Object.values(BOSS_MOVES).flat();
  assert.equal(all.length, 18);
  assert.equal(SKILLS.filter((s) => isBossMove(s.id)).length, 18, "no other bss_* move");
  for (const [beast, moves] of Object.entries(BOSS_MOVES)) {
    const own = new Set(moves.flatMap(([id]) => effectsOf(getSkill(id)!)));
    for (const e of OWN_EFFECTS[beast]) assert.ok(own.has(e), `${beast} uses ${e}`);
    for (const [id, n] of moves) {
      const sk = getSkill(id);
      assert.ok(sk, id);
      assert.equal(sk!.n, n, `${id} name`);
      assert.equal(sk!.sc, BEAST_SECT, `${id} sect`);
      assert.equal(sk!.ti, 5, `${id} tier`);
      assert.ok(sk!.se || sk!.ee || sk!.at, `${id} does something`);
      for (const line of skillSummaryLines(sk!)) assert.ok(!/\b(bind|bleed|blind|scorch|sunder|molt|frenzy|sun_shell)\b/.test(line), `${id}: "${line}" is Thai`);
      const st = Object.values(sk!.st).reduce((a, v) => a + (v ?? 0), 0);
      assert.equal(st, 35, `${id}: T5 stat sum`);
      assert.ok(skillCooldown(sk!) <= TIERS[5].cd, `${id}: cooldown ${skillCooldown(sk!)}`);
    }
  }
  // A boss always has something ready: at least one move with no cooldown.
  for (const moves of Object.values(BOSS_MOVES)) assert.ok(moves.some(([id]) => skillCooldown(getSkill(id)!) === 0));
});

check("six art_boss_* arts: T5, สัตว์ร้าย, a big HP / MP pool, an active and a passive", () => {
  const arts = ARTS.filter((a) => isBossArt(a.id));
  assert.deepEqual(arts.map((a) => a.id).sort(), ["art_boss_bull", "art_boss_crab", "art_boss_eagle", "art_boss_serpent", "art_boss_tiger", "art_boss_turtle"]);
  const t4 = ARTS.filter((a) => a.ti === 4);
  const t4Pool = Math.max(...t4.map((a) => a.hL + a.mL));
  for (const a of arts) {
    assert.equal(a.ti, 5);
    assert.equal(a.sc, BEAST_SECT);
    assert.ok(a.hL + a.mL > t4Pool, `${a.id}: pool ${a.hL + a.mL} > T4's ${t4Pool}`);
    assert.ok(a.act && a.pas, `${a.id}: active + passive`);
  }
  assert.equal(getArt("art_boss_tiger").pas?.e.t, "frenzy", "the tiger frenzies when hurt");
});

check("never learnable: only bss_* / art_boss_* are สัตว์ร้าย, and no quest, scene or shop teaches one", () => {
  for (const s of SKILLS) assert.equal(isBeastMove(s.id), s.id.startsWith("bst_") || s.id.startsWith("bss_"), s.id);
  for (const s of SKILLS.filter((x) => x.sc === BEAST_SECT)) assert.ok(isBossMove(s.id), `${s.id}: only boss moves are สัตว์ร้าย`);
  for (const a of ARTS.filter((x) => x.sc === BEAST_SECT)) assert.ok(isBossArt(a.id), `${a.id}: only boss arts are สัตว์ร้าย`);
  const world = JSON.stringify([QUESTS, SCENES, SHOPS]);
  assert.ok(!/"(skillId|artId)":"(bss_|art_boss_)/.test(world), "a quest / scene / shop teaches a boss move");
});

check("grid shapes: area / line / multi-hit as the contract says; self moves are self", () => {
  const g = (id: string) => skillGrid(getSkill(id)!);
  assert.equal(g("bss_tiger_roar").area.kind, "diamond");
  assert.equal(g("bss_tiger_roar").range.min, 0, "the roar is centred on the tiger");
  assert.equal(g("bss_bull_stomp").area.kind, "diamond");
  assert.equal(g("bss_eagle_feathers").area.kind, "diamond");
  assert.equal(getSkill("bss_eagle_feathers")!.hits, 6);
  assert.equal(g("bss_eagle_gale").area.kind, "cross");
  assert.equal(g("bss_turtle_sun").area.kind, "diamond");
  assert.equal(g("bss_crab_tide").area.kind, "diamond");
  assert.equal(getSkill("bss_crab_pincers")!.hits, 4);
  assert.deepEqual(g("bss_bull_charge").area, { kind: "line", size: 4 });
  for (const id of ["bss_serpent_molt", "bss_tiger_frenzy", "bss_turtle_shell", "bss_crab_mirror", "bss_bull_rage"]) assert.equal(g(id).target, "self", id);
});

check("VFX / SFX: every boss move has its own signature (18 distinct) and the T5 palette", () => {
  const sigs = new Set<string>();
  for (const s of SKILLS.filter((x) => isBossMove(x.id))) {
    const v = castVfx({ tier: s.ti, source: { kind: "skill", id: s.id } });
    assert.ok(v.signature, `${s.id}: signature`);
    assert.equal(v.tier, 5);
    sigs.add(v.signature!);
  }
  assert.equal(sigs.size, 18);
  assert.equal(castVfx({ tier: 2, source: { kind: "skill", id: "sf" } }).signature, undefined, "ordinary moves have none");
});

// ─── Effects ───────────────────────────────────────────────────────────
check("bleed: a DoT of % max HP that grows by inc every tick (capped), and a fresh coat keeps the running %", () => {
  const s = duel();
  applyEnemyEffect(s, "A", { t: "bleed", pp: 3, inc: 2, u: 5 }, names);
  const max = s.dB.HP;
  const hits: number[] = [];
  for (let i = 0; i < 4; i++) {
    const before = s.hB;
    tickSideEffects(s, "B", 0, names);
    hits.push(before - s.hB);
  }
  assert.deepEqual(hits, [3, 5, 7, 9].map((p) => Math.round(max * p / 100)), "3 % → 5 % → 7 % → 9 %");
  // Re-applying a weaker bleed keeps the grown % and refreshes the timer.
  applyEnemyEffect(s, "A", { t: "bleed", pp: 3, inc: 2, u: 5 }, names);
  const rec = s.st.B.debuffs.find((d) => d.t === "bleed")!;
  assert.equal(rec.pp, 11);
  assert.equal(rec.u, 5);
  for (let i = 0; i < 10; i++) { s.hB = max; tickSideEffects(s, "B", 0, names); }
  assert.ok(!s.st.B.debuffs.some((d) => d.t === "bleed"), "it runs out");
  const capped = duel();
  applyEnemyEffect(capped, "A", { t: "bleed", pp: 14, inc: 5, u: 9 }, names);
  for (let i = 0; i < 3; i++) tickSideEffects(capped, "B", 0, names);
  assert.equal(capped.st.B.debuffs.find((d) => d.t === "bleed")!.pp, BLEED_CAP);
});

check("scorch: burns each tick and blocks every heal (self heal, passive, drain, regen, potion) until it ends; a molt sheds it", () => {
  const s = duel(build("ผู้กล้า", ["sf"]), build("อสูร", ["sf"], {}, "kuyt"));
  applyEnemyEffect(s, "A", { t: "scorch", pp: 5, u: 3 }, names);
  const max = s.dB.HP;
  s.hB = Math.round(max / 2);
  const half = s.hB;
  applySelfEffect(s, "B", { t: "heal_pct", v: 30 }, names);
  assert.equal(s.hB, half, "heal_pct blocked");
  assert.equal(healHp(s, "B", 500), 0, "healHp blocked");
  applySelfEffect(s, "B", { t: "heal_buff", hp: 20, bt: "buff_def", bv: 5, bu: 3 }, names);
  assert.equal(s.hB, half, "heal_buff's heal blocked (its buff still lands)");
  // A tick: the burn lands, the kuyt aura (5 %) and gear regen (10 %) heal nothing.
  tickSideEffects(s, "B", 10, names, "kuyt");
  assert.equal(s.hB, half - Math.round(max * 0.05), "tick: burn only");
  // Drain on a scorched attacker heals nothing.
  const d = duel(build("ผู้กล้า", ["nh2"], { STR: 200 }), build("อสูร", ["sf"]));
  applyEnemyEffect(d, "B", { t: "scorch", pp: 1, u: 3 }, names);
  d.hA = 10;
  withRandom(() => 0.01, () => resolveSkill(d, "A", 0, "nh2", makeContext(build("ผู้กล้า", ["nh2"], { STR: 200 }), build("อสูร", ["sf"])), { tick: false }));
  assert.equal(d.hA, 10, "drain blocked");
  // Molt sheds the scorch first, so its heal gets through.
  applySelfEffect(s, "B", { t: "molt", hp: 20, rv: 30, u: 4 }, names);
  assert.ok(!s.st.B.debuffs.length, "molt cleansed everything");
  assert.equal(s.hB, half - Math.round(max * 0.05) + Math.round(max * 0.2));
  // Grid: a scorched leader's potion restores MP but no HP.
  const g = createGridBattle([
    { id: "a1", team: "ally", build: build("ผู้กล้า", ["sf"]), look, leader: true, pos: { x: 2, y: 3 }, hp: 50, mp: 0 },
    { id: "e1", team: "enemy", build: build("อสูร", ["sf"]), look, pos: { x: 8, y: 3 } },
  ]);
  g.bag = { potion_test: 1 };
  const a1 = unitById(g, "a1")!;
  a1.status.debuffs.push({ t: "scorch", n: "แผดเผา", pp: 1, u: 9 });
  a1.gauge = 100;
  assert.equal(beginNextTurn(g)!.id, "a1");
  const hp = a1.hp;
  assert.ok(applyAction(g, "a1", { t: "item", itemId: "potion_test", name: "ยา", effect: { t: "heal", hp: 100, mp: 20 }, target: { ...a1.pos } }));
  assert.equal(a1.hp, hp, "potion HP blocked");
  assert.equal(a1.mp, 20, "potion MP still flows");
});

check("sunder: strips every buff (shield, ward, reflect, stacks) — the ward can't stop it — then PDef down", () => {
  const s = duel();
  s.st.B.buffs.push({ t: "shield", n: "โล่", v: 300, u: 1 }, { t: "ward", n: "ผนึก", v: 3, u: 1 }, { t: "buff_def", v: 20, u: 4 }, { t: "buff_reflect", v: 30, u: 4 });
  s.st.B.stk = 3; s.st.B.stkV = 10;
  applyEnemyEffect(s, "A", { t: "sunder", dv: -12, u: 5 }, names);
  assert.deepEqual(s.st.B.buffs, []);
  assert.equal(s.st.B.stk, 0);
  assert.equal(s.st.B.debuffs.find((d) => d.t === "debuff_def")?.v, -12);
  // The shield it broke no longer soaks a hit.
  const hp = s.hB;
  landDamage(s, "B", 40);
  assert.equal(s.hB, hp - 40);
});

check("blind: Acc down and the next action fails at its chance (1v1 and grid), spent on that roll either way", () => {
  const a = build("ผู้กล้า", ["sf"]), b = build("อสูร", ["sf"], { STR: 100 });
  const ctx = makeContext(a, b);
  const s = makeInitialState(a, b);
  applyEnemyEffect(s, "A", { t: "blind", v: -30, ch: 100, u: 5 }, names);
  assert.equal(s.st.B.debuffs.find((d) => d.t === "debuff_acc")?.v, -30);
  const hp = s.hA;
  // B (blinded) strikes A.
  withRandom(() => 0, () => resolveSkill(s, "B", 0, "sf", ctx, { tick: false }));
  assert.equal(s.hA, hp, "the blinded strike never lands");
  assert.ok(!s.st.B.debuffs.some((d) => d.t === "blind"), "blind spent");
  assert.ok(s.lastCast?.hitMisses.every((m) => m), "cast shows a whiff");
  // Chance 0: the action goes through, and the blind is still spent.
  applyEnemyEffect(s, "A", { t: "blind", v: -1, ch: 0, u: 5 }, names);
  s.st.B.debuffs = s.st.B.debuffs.filter((d) => d.t !== "debuff_acc");
  withRandom(() => 0, () => resolveSkill(s, "B", 0, "sf", ctx, { tick: false }));
  assert.ok(s.hA < hp, "lands with ch 0");
  assert.ok(!s.st.B.debuffs.some((d) => d.t === "blind"));
  // Grid: a blinded unit's cast whiffs on every target and spends its cooldown.
  const g = createGridBattle([
    { id: "a1", team: "ally", build: build("ผู้กล้า", ["bss_tiger_roar"]), look, leader: true, pos: { x: 4, y: 3 } },
    { id: "e1", team: "enemy", build: build("อสูร", ["sf"]), look, pos: { x: 5, y: 3 } },
    { id: "e2", team: "enemy", build: build("อสูร", ["sf"]), look, pos: { x: 4, y: 4 } },
  ]);
  const a1 = unitById(g, "a1")!;
  a1.status.debuffs.push({ t: "blind", n: "ตาบอด", ch: 100, u: 5 });
  a1.gauge = 100;
  assert.equal(beginNextTurn(g)!.id, "a1");
  const hp0 = g.units.map((u) => u.hp);
  assert.ok(applyAction(g, "a1", { t: "skill", slot: 0, target: { ...a1.pos } }, () => 0.5));
  assert.deepEqual(g.units.map((u) => u.hp), hp0, "nobody hurt");
  const ev = g.events[g.events.length - 1];
  assert.ok(ev.t === "cast" && ev.results.length === 2 && ev.results.every((r) => r.misses.every((m) => m)), "a whiff on both foes");
  assert.equal(a1.cd[0], skillCooldown(getSkill("bss_tiger_roar")!), "cooldown spent");
  assert.ok(!a1.status.debuffs.some((d) => d.t === "blind"));
});

check("bind: PDef down always, a stun at its chance — the bound unit loses its next grid turn", () => {
  const s = duel();
  withRandom(() => 0.5, () => applyEnemyEffect(s, "A", { t: "bind", ch: 70, u: 2, dv: -35, du: 5 }, names));
  assert.ok(s.st.B.debuffs.some((d) => d.t === "stun"), "0.5 < 70 %: stunned");
  assert.equal(s.st.B.debuffs.find((d) => d.t === "debuff_def")?.v, -35);
  const miss = duel();
  withRandom(() => 0.9, () => applyEnemyEffect(miss, "A", { t: "bind", ch: 70, u: 2, dv: -35, du: 5 }, names));
  assert.ok(!miss.st.B.debuffs.some((d) => d.t === "stun"), "0.9 ≥ 70 %: wriggles free");
  assert.equal(miss.st.B.debuffs.find((d) => d.t === "debuff_def")?.v, -35, "but the armour still cracks");
  // Grid: the serpent's coil (ch 70) on a seeded hit; the victim's next turn is skipped.
  const g = createGridBattle([
    { id: "a1", team: "ally", build: build("ผู้กล้า", ["sf"], { VIT: 400, DEF: 100 }), look, leader: true, pos: { x: 4, y: 3 } },
    { id: "e1", team: "enemy", build: build("งู", ["bss_serpent_coil"]), look, pos: { x: 5, y: 3 } },
  ]);
  const e1 = unitById(g, "e1")!, a1 = unitById(g, "a1")!;
  e1.gauge = 100;
  assert.equal(beginNextTurn(g)!.id, "e1");
  // Roll 0.5: hits, no crit, and 50 < 70 binds.
  withRandom(() => 0.5, () => applyAction(g, "e1", { t: "skill", slot: 0, target: { ...a1.pos } }));
  assert.ok(a1.alive, "survives the squeeze");
  assert.ok(a1.status.debuffs.some((d) => d.t === "stun"), "coiled");
  a1.gauge = 100; e1.gauge = 0;
  beginNextTurn(g);
  assert.ok(g.events.some((e) => e.t === "stunned" && e.unitId === "a1"), "a1 loses the turn");
});

check("molt: sheds every debuff, heals % of max HP and reflects the next hit", () => {
  const s = duel();
  s.st.B.debuffs.push({ t: "debuff_poison", pp: 5, u: 4 }, { t: "debuff_def", v: -20, u: 4 }, { t: "stun", u: 2 });
  s.hB = Math.round(s.dB.HP * 0.4);
  const before = s.hB;
  applySelfEffect(s, "B", { t: "molt", hp: 20, rv: 30, u: 4 }, names);
  assert.deepEqual(s.st.B.debuffs, []);
  assert.equal(s.hB, before + Math.round(s.dB.HP * 0.2));
  assert.equal(s.st.B.buffs.find((b) => b.t === "buff_reflect")?.v, 30);
});

check("sun_shell: a shield of % max HP that soaks hits before HP, plus reflect", () => {
  const s = duel();
  applySelfEffect(s, "B", { t: "sun_shell", v: 25, rv: 30, u: 5 }, names);
  const shield = s.st.B.buffs.find((b) => b.t === "shield")!;
  assert.equal(shield.v, Math.round(s.dB.HP * 0.25));
  assert.equal(s.st.B.buffs.find((b) => b.t === "buff_reflect")?.v, 30);
  const hp = s.hB;
  const through = landDamage(s, "B", 20);
  assert.equal(through, 0);
  assert.equal(s.hB, hp, "absorbed");
  assert.equal(s.st.B.buffs.find((b) => b.t === "shield")!.v, Math.round(s.dB.HP * 0.25) - 20);
  // A second cast never shrinks a bigger shield.
  s.st.B.buffs.find((b) => b.t === "shield")!.v = 99999;
  applySelfEffect(s, "B", { t: "sun_shell", v: 25, rv: 30, u: 5 }, names);
  assert.equal(s.st.B.buffs.find((b) => b.t === "shield")!.v, 99999);
});

check("frenzy: Atk % scales with HP lost (v at full → mx at 0), keeps the larger roll, and hits harder", () => {
  assert.equal(frenzyPct(20, 80, 100, 100), 20);
  assert.equal(frenzyPct(20, 80, 25, 100), 65);
  assert.equal(frenzyPct(20, 80, 0, 100), 80);
  const a = build("ผู้กล้า", ["sf"], { STR: 120 }), b = build("อสูร", ["sf"]);
  const ctx = makeContext(a, b);
  const s = makeInitialState(a, b);
  const sf = getSkill("sf")!;
  const plain = withRandom(() => 0.5, () => calcSkillDamage(s, "A", sf, ctx)).dmg;
  s.hA = Math.round(s.dA.HP / 4);
  applySelfEffect(s, "A", { t: "frenzy", v: 20, mx: 80, u: 5 }, names);
  assert.equal(atkPctOf(s.st.A), frenzyPct(20, 80, s.hA, s.dA.HP));
  s.hA = s.dA.HP;
  applySelfEffect(s, "A", { t: "frenzy", v: 20, mx: 80, u: 5 }, names);
  assert.ok(atkPctOf(s.st.A) > 60, "a full-HP recast keeps the larger frenzy");
  const angry = withRandom(() => 0.5, () => calcSkillDamage(s, "A", sf, ctx)).dmg;
  assert.ok(angry > plain, `${angry} > ${plain}`);
  // The tiger art's passive frenzies on every hit taken.
  const t = duel(build("ผู้กล้า", ["sf"]), build("พยัคฆ์", ["sf"], {}, "art_boss_tiger"));
  t.hB = Math.round(t.dB.HP / 2);
  checkPassive(t, "B", "art_boss_tiger", "hit_recv", names);
  assert.equal(t.st.B.buffs.find((x) => x.t === "frenzy")?.v, frenzyPct(10, 60, t.hB, t.dB.HP));
});

check("pierce: a move's pen ignores that share of PD (dive pen 50 vs the same move without)", () => {
  const a = build("อินทรี", ["bss_eagle_dive"], { STR: 120 }), b = build("กำแพง", ["sf"], { DEF: 200, VIT: 120 });
  const ctx = makeContext(a, b);
  const s = makeInitialState(a, b);
  const dive = getSkill("bss_eagle_dive")!;
  const rng = () => 0.5;
  const withPen = withRandom(rng, () => calcSkillDamage(s, "A", dive, ctx)).dmg;
  const noPen = withRandom(rng, () => calcSkillDamage(s, "A", { ...dive, pen: 0 }, ctx)).dmg;
  assert.ok(withPen > noPen, `${withPen} > ${noPen}`);
  // Exactly half the PD comes off (no crit at roll 0.5, no reduce / buffs here).
  assert.ok(Math.abs((withPen - noPen) - s.dB.PD * 0.5) <= 1, `difference ${withPen - noPen} = PD/2 ${s.dB.PD * 0.5}`);
});

check("effect text: every new kind reads as Thai", () => {
  const effs = [
    { t: "molt", hp: 20, rv: 30, u: 4 }, { t: "frenzy", v: 20, mx: 80, u: 5 }, { t: "sun_shell", v: 25, rv: 30, u: 5 },
    { t: "bind", ch: 70, u: 2, dv: -35, du: 5 }, { t: "bleed", pp: 3, inc: 2, u: 5 }, { t: "blind", v: -30, ch: 40, u: 5 },
    { t: "scorch", pp: 5, u: 5 }, { t: "sunder", dv: -12, u: 5 },
  ] as const;
  for (const e of effs) {
    const text = describeEffectThai(e);
    assert.ok(/[฀-๿]/.test(text) && !text.includes(e.t), `${e.t}: ${text}`);
  }
});

// ─── Boss battles: each beast with its three moves + art + two minions vs a party ──
// About the contract's boss power (1100–1600) against a strong T4 party.
const BOSS_STATS: StatBlock = { STR: 170, AGI: 110, POW: 130, VIT: 260, DEX: 150, LUK: 70, DEF: 180, INT: 110 };
function bossBuild(beast: string): CharacterBuild {
  const ids = BOSS_MOVES[beast].map(([id]) => id);
  return build(`บอส ${beast}`, [...ids, `art:art_boss_${beast}`], BOSS_STATS, `art_boss_${beast}`);
}
const minion = (n: number) => build(`ลูกสมุน${n}`, ["bst_maul", "bst_venom"], { STR: 90, VIT: 120, DEX: 70, DEF: 60 });
const heroes = [
  build("จอมยุทธ์ดาบ", ["dgjj", "ng5", "nh2", "ig"], { STR: 150, AGI: 120, VIT: 400, DEX: 110, DEF: 220, LUK: 40 }, "kuyt"),
  build("จอมยุทธ์ฝ่ามือ", ["nu2", "nf5", "na2", "nd7"], { STR: 160, AGI: 90, VIT: 420, DEX: 100, DEF: 230, POW: 60 }, "military"),
  build("จอมยุทธ์ภายใน", ["lmsj", "nf2", "ne4", "zs"], { POW: 160, INT: 140, VIT: 380, DEX: 90, AGI: 80, DEF: 200 }, "fire"),
];

function runAi(s: GridBattleState, max: number): number {
  let turns = 0;
  while (!isOver(s) && turns < max) {
    const u = beginNextTurn(s);
    if (!u) break;
    assert.equal(activeUnit(s), u);
    const plan = planTurn(s, u.id);
    if (plan.move) {
      assert.ok(reachableFor(s, u.id).has(cellKey(plan.move)));
      assert.ok(applyAction(s, u.id, { t: "move", to: plan.move }));
    }
    if (plan.action.t === "skill") assert.ok(targetsFor(s, u.id, plan.action.slot, plan.action.target).length > 0);
    assert.ok(applyAction(s, u.id, plan.action), `${u.id}: ${JSON.stringify(plan.action)}`);
    turns++;
  }
  return turns;
}

check("every boss (3 moves + art + 2 minions) fights a 1–3 hero party to a finish on the grid, using its attacks", () => {
  const used = new Set<string>();
  let total = 0, bossWins = 0;
  for (const [i, beast] of Object.keys(BOSS_MOVES).entries()) {
    for (let seed = 1; seed <= 3; seed++) {
      const specs: UnitSpec[] = [
        ...heroes.slice(0, 1 + (seed % 3)).map((b, k) => ({ id: `h${k}`, team: "ally" as const, build: b, look, leader: k === 0 })),
        { id: "boss", team: "enemy", build: bossBuild(beast), look: { kind: "creature", frame: i, size: 1.6 } },
        { id: "m1", team: "enemy", build: minion(1), look },
        { id: "m2", team: "enemy", build: minion(2), look },
      ];
      const s = createGridBattle(specs, { cols: 13, rows: 9 });
      const turns = withRandom(seeded(seed * 7907 + i * 131), () => runAi(s, 800));
      assert.ok(isOver(s) && s.winnerTeam, `${beast} seed ${seed}: finished (${turns} turns)`);
      total += turns;
      if (s.winnerTeam === "enemy") bossWins++;
      for (const id of Object.keys(unitById(s, "boss")!.skillUses)) used.add(id);
    }
  }
  const bossMoves = SKILLS.filter((x) => isBossMove(x.id)).map((x) => x.id);
  const unused = bossMoves.filter((id) => !used.has(id));
  console.log(`  18 boss battles · avg ${Math.round(total / 18)} turns · boss won ${bossWins} · moves used ${bossMoves.length - unused.length}/18${unused.length ? ` (unused: ${unused.join(", ")})` : ""}`);
  // Every attack move is used somewhere (self moves wait for their moment: next check).
  for (const id of bossMoves) if (getSkill(id)!.at) assert.ok(used.has(id), `${id} used in some battle`);
});

check("the AI reaches for a boss's self moves when they pay: frenzy when wounded, molt under DoTs, the sun shell once hurt", () => {
  /** A beast at `hpPct` beside one hero; returns the slot its plan uses. */
  const planFor = (beast: string, hpPct: number, prep?: (s: GridBattleState) => void): string | null => {
    const s = createGridBattle([
      { id: "h0", team: "ally", build: heroes[1], look, leader: true, pos: { x: 4, y: 3 } },
      { id: "boss", team: "enemy", build: bossBuild(beast), look, pos: { x: 5, y: 3 } },
    ]);
    const boss = unitById(s, "boss")!;
    boss.hp = Math.round(boss.derived.HP * hpPct);
    prep?.(s);
    boss.gauge = 100;
    assert.equal(beginNextTurn(s)!.id, "boss");
    const plan = planTurn(s, "boss");
    return plan.action.t === "skill" ? boss.build.skillIds[plan.action.slot] : null;
  };
  assert.notEqual(planFor("tiger", 1), "bss_tiger_frenzy", "fresh: it attacks");
  assert.equal(planFor("tiger", 0.25), "bss_tiger_frenzy", "wounded: it frenzies");
  assert.equal(planFor("bull", 0.25), "bss_bull_rage");
  assert.equal(planFor("serpent", 0.4, (s) => unitById(s, "boss")!.status.debuffs.push(
    { t: "bleed", pp: 6, inc: 2, u: 5 }, { t: "scorch", pp: 5, u: 5 }, { t: "debuff_def", v: -30, u: 5 })), "bss_serpent_molt");
  // The shell is worth a heal of its size: it beats waiting, not a big hit in reach.
  const s0 = createGridBattle([
    { id: "h0", team: "ally", build: heroes[1], look, leader: true, pos: { x: 0, y: 0 } },
    { id: "boss", team: "enemy", build: bossBuild("turtle"), look, pos: { x: 14, y: 9 } },
  ], { cols: 15, rows: 10 });
  const turtle = unitById(s0, "boss")!;
  turtle.gauge = 100;
  beginNextTurn(s0);
  const far = () => { const p = planTurn(s0, "boss"); return p.action.t === "skill" ? turtle.build.skillIds[p.action.slot] : null; };
  assert.notEqual(far(), "bss_turtle_shell", "unhurt: no shell yet");
  turtle.hp = Math.round(turtle.derived.HP * 0.5);
  assert.equal(far(), "bss_turtle_shell", "hurt and nothing in reach: shell up");
});

console.log(`\n${checks} boss skill checks passed`);
