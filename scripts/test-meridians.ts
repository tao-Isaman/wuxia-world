// ชีพจร — meridian charts: the pure engine, combat integration, chart items,
// sources, the store (points, reading a chart, opening points), save repair,
// and the content table's invariants.
//   bun run test:meridians
import assert from "node:assert/strict";
import { ARTS_BY_ID } from "../lib/game/data/arts";
import { SKILLS_BY_ID } from "../lib/game/data/skills";
import {
  MERIDIAN_BODY_POINTS,
  MERIDIAN_CHARTS,
  MERIDIAN_CHARTS_PER_TIER,
  MERIDIAN_COMBAT_KEYS,
  MERIDIAN_NODES_BY_TIER,
  checkOpenMeridianNode,
  combinedStats,
  deriveAll,
  emptyMeridianCombat,
  getBuildBonus,
  getEquipBonus,
  getMeridianChart,
  makeContext,
  meridianBuildBonus,
  meridianChartBonus,
  meridianChartFullCost,
  meridianChartItemId,
  meridianChartSpent,
  meridianNextCost,
  meridianNodeState,
  meridianRankBonus,
  meridianRankCost,
  normalizeMeridianRanks,
  statBreakdown,
  STAT_KEYS,
  type CharacterBuild,
  type MeridianChart,
  type MeridianTier,
} from "../lib/game";
import { getItem } from "../lib/world/data/items";
import { itemIconId } from "../lib/world/data/item-icons";
import { SHOPS } from "../lib/world/data/shops";
import { OPPONENTS_BY_ID } from "../lib/world/data/opponents";
import { QUESTS_BY_ID } from "../lib/world/data/quests";
import { MERIDIAN_SOURCES } from "../lib/world/data/meridian-sources";
import { meridianLootFor, meridianReadBlock, meridianSourceOf, rollMeridianLoot } from "../lib/world/meridians";
import { validateAndRepair } from "../lib/world/validate";

// An in-memory localStorage, so the store's persist layer (version,
// partialize, migrate) runs as in the browser.
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const store = () => useWorldStore.getState();
function newGame() {
  store().resetGame();
  store().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
}

// ─── Fixtures (the engine is tested apart from the content table) ────
const FX_SMALL: MeridianChart = {
  id: "fx_small", name: "ชีพจรทดสอบเล็ก", ti: 0, kind: "base", description: "ทดสอบ",
  requires: { skills: ["basic_punch"] },
  nodes: [
    { id: "a", name: "จุดไป่ฮุ่ย", at: "crown", ranks: [{ stats: { STR: 1 } }, { stats: { STR: 2 } }, { stats: { STR: 3, VIT: 1 } }] },
    { id: "b", name: "จุดถานจง", at: "chest", ranks: [{ combat: { atk: 5 } }, { combat: { atk: 5, hp: 20 } }, { combat: { pct_atk: 2 } }] },
  ],
};
const FX_BIG: MeridianChart = {
  id: "fx_big", name: "ชีพจรทดสอบใหญ่", ti: 3, kind: "ability", description: "ทดสอบ",
  requires: { arts: ["t0_sevenstar"] },
  nodes: Array.from({ length: 7 }, (_, i) => ({
    id: `n${i}`, name: "จุดฉี่ไห่", at: "dantian" as const,
    ranks: [{ combat: { pct_red: 1 } }, { combat: { hp_regen: 0.5 } }, { stats: { DEF: 2 } }] as const,
  })),
};
const fxLookup = (id: string) => (id === FX_SMALL.id ? FX_SMALL : id === FX_BIG.id ? FX_BIG : undefined);

check("engine: rank bonuses are cumulative (rank r = ranks 1..r)", () => {
  const n = FX_SMALL.nodes[0]!;
  assert.deepEqual(meridianRankBonus(n, 0).stats, {});
  assert.deepEqual(meridianRankBonus(n, 1).stats, { STR: 1 });
  assert.deepEqual(meridianRankBonus(n, 2).stats, { STR: 3 });
  assert.deepEqual(meridianRankBonus(n, 3).stats, { STR: 6, VIT: 1 });
  assert.deepEqual(meridianRankBonus(n, 9).stats, { STR: 6, VIT: 1 }, "clamped to 3");
  const c = meridianRankBonus(FX_SMALL.nodes[1]!, 3).combat;
  assert.equal(c.atk, 10); assert.equal(c.hp, 20); assert.equal(c.pct_atk, 2);
  assert.deepEqual(Object.keys(emptyMeridianCombat()).sort(), [...MERIDIAN_COMBAT_KEYS].sort());
});

check("engine: chart and build bonuses add every node; unknown charts are ignored", () => {
  const b = meridianChartBonus(FX_SMALL, [2, 1]);
  assert.deepEqual(b.stats, { STR: 3 });
  assert.equal(b.combat.atk, 5);
  const big = meridianChartBonus(FX_BIG, [3, 3, 3, 3, 3, 3, 3]);
  assert.equal(big.combat.pct_red, 7); assert.equal(big.combat.hp_regen, 3.5); assert.equal(big.stats.DEF, 14);
  const build = { meridians: { fx_small: [3, 3], fx_big: [1, 0, 0, 0, 0, 0, 0], nope: [3] } };
  const all = meridianBuildBonus(build, fxLookup);
  assert.deepEqual(all.stats, { STR: 6, VIT: 1 });
  assert.equal(all.combat.atk, 10); assert.equal(all.combat.pct_atk, 2); assert.equal(all.combat.pct_red, 1);
  assert.deepEqual(meridianBuildBonus({}, fxLookup).stats, {});
});

check("engine: points open in order; cost (ti+1)×rank; null at max", () => {
  assert.equal(meridianNodeState(FX_SMALL, [0, 0], 0), "open");
  assert.equal(meridianNodeState(FX_SMALL, [0, 0], 1), "locked");
  assert.equal(meridianNodeState(FX_SMALL, [1, 0], 1), "open");
  assert.equal(meridianNodeState(FX_SMALL, [3, 2], 0), "max");
  assert.equal(meridianNodeState(FX_SMALL, [1, 3], 1), "max");
  assert.equal(meridianNextCost(FX_SMALL, [0, 0], 0), 1);
  assert.equal(meridianNextCost(FX_SMALL, [2, 0], 0), 3);
  assert.equal(meridianNextCost(FX_SMALL, [3, 0], 0), null);
  assert.equal(meridianNextCost(FX_BIG, [1, 0, 0, 0, 0, 0, 0], 0), 8, "T3 rank 2 = 4×2");
  for (const ti of [0, 1, 2, 3, 4, 5] as const) for (const r of [1, 2, 3] as const) assert.equal(meridianRankCost(ti, r), (ti + 1) * r);
  assert.equal(meridianChartFullCost(FX_SMALL), 2 * (1 + 2 + 3));
  assert.equal(meridianChartSpent(FX_SMALL, [2, 1]), 1 + 2 + 1);
  assert.deepEqual(normalizeMeridianRanks(FX_SMALL, [7, -1, 2] as unknown[]), [3, 0]);
  assert.deepEqual(normalizeMeridianRanks(FX_BIG, [1]), [1, 0, 0, 0, 0, 0, 0]);
});

check("engine: checkOpenMeridianNode refuses locked, maxed, unlearned and unaffordable points in Thai", () => {
  assert.deepEqual(checkOpenMeridianNode(FX_SMALL, [0, 0], 0, 1), { ok: true, rank: 1, cost: 1 });
  const locked = checkOpenMeridianNode(FX_SMALL, [0, 0], 1, 99);
  assert.ok(!locked.ok && locked.reason.includes("ไป่ฮุ่ย"), JSON.stringify(locked));
  assert.ok(!checkOpenMeridianNode(FX_SMALL, [3, 0], 0, 99).ok);
  assert.ok(!checkOpenMeridianNode(FX_SMALL, undefined, 0, 99).ok);
  assert.ok(!checkOpenMeridianNode(FX_SMALL, [0, 0], 5, 99).ok);
  const poor = checkOpenMeridianNode(FX_SMALL, [1, 0], 0, 1);
  assert.ok(!poor.ok && poor.reason.includes("แต้มชีพจรไม่พอ"));
});

// ─── Content invariants ──────────────────────────────────────────────
check("content: 95 charts — T0 20, T1 20, T2 15, T3 15, T4 15, T5 10", () => {
  const per: Record<number, number> = {};
  for (const c of MERIDIAN_CHARTS) per[c.ti] = (per[c.ti] ?? 0) + 1;
  for (const ti of [0, 1, 2, 3, 4, 5] as MeridianTier[]) assert.equal(per[ti] ?? 0, MERIDIAN_CHARTS_PER_TIER[ti], `T${ti}`);
  assert.equal(MERIDIAN_CHARTS.length, 95);
});

check("content: unique chart ids (snake case) and names; point count by tier; 3 ranks; body spots", () => {
  const ids = new Set<string>(); const names = new Set<string>();
  for (const c of MERIDIAN_CHARTS) {
    assert.match(c.id, /^[a-z0-9_]+$/, c.id);
    assert.ok(!ids.has(c.id), `duplicate id ${c.id}`); ids.add(c.id);
    assert.ok(c.name.trim().length > 0 && !names.has(c.name), `duplicate / empty name ${c.name}`); names.add(c.name);
    assert.ok(c.description.trim().length > 0, `${c.id} description`);
    assert.ok(["base", "combat", "ability", "buff"].includes(c.kind), `${c.id} kind`);
    const [min, max] = MERIDIAN_NODES_BY_TIER[c.ti];
    assert.ok(c.nodes.length >= min && c.nodes.length <= max, `${c.id} T${c.ti} has ${c.nodes.length} points`);
    const nodeIds = new Set<string>();
    for (const n of c.nodes) {
      assert.ok(!nodeIds.has(n.id), `${c.id}: duplicate point ${n.id}`); nodeIds.add(n.id);
      assert.ok(n.name.trim().length > 0, `${c.id}.${n.id} name`);
      assert.ok(MERIDIAN_BODY_POINTS.includes(n.at), `${c.id}.${n.id} at ${n.at}`);
      assert.equal(n.ranks.length, 3, `${c.id}.${n.id} ranks`);
      for (const [r, rank] of n.ranks.entries()) {
        const statKeys = Object.keys(rank.stats ?? {});
        const combatKeys = Object.keys(rank.combat ?? {});
        assert.ok(statKeys.length + combatKeys.length > 0, `${c.id}.${n.id} rank ${r + 1} gives nothing`);
        for (const k of statKeys) assert.ok((STAT_KEYS as readonly string[]).includes(k), `${c.id}.${n.id}: stat ${k}`);
        for (const k of combatKeys) assert.ok((MERIDIAN_COMBAT_KEYS as readonly string[]).includes(k), `${c.id}.${n.id}: combat ${k}`);
        for (const v of [...Object.values(rank.stats ?? {}), ...Object.values(rank.combat ?? {})]) {
          assert.ok(typeof v === "number" && Number.isFinite(v) && v > 0, `${c.id}.${n.id} rank ${r + 1}: ${v}`);
        }
      }
    }
  }
});

check("content: a node's three ranks grow the same keys, positive and never shrinking", () => {
  for (const c of MERIDIAN_CHARTS) for (const n of c.nodes) {
    const flat = (r: (typeof n.ranks)[number]) => ({
      ...Object.fromEntries(Object.entries(r.stats ?? {}).map(([k, v]) => [`s:${k}`, v as number])),
      ...Object.fromEntries(Object.entries(r.combat ?? {}).map(([k, v]) => [`c:${k}`, v as number])),
    });
    const [a, b, d] = n.ranks.map(flat);
    const keys = Object.keys(a!).sort().join(",");
    assert.equal(Object.keys(b!).sort().join(","), keys, `${c.id}.${n.id}: rank 2 keys`);
    assert.equal(Object.keys(d!).sort().join(","), keys, `${c.id}.${n.id}: rank 3 keys`);
    for (const k of Object.keys(a!)) {
      for (const v of [a![k]!, b![k]!, d![k]!]) assert.ok(Number.isFinite(v) && v > 0, `${c.id}.${n.id} ${k}: ${v}`);
      assert.ok(b![k]! >= a![k]! && d![k]! >= b![k]!, `${c.id}.${n.id} ${k} shrinks: ${a![k]} ${b![k]} ${d![k]}`);
    }
  }
});

check("content: a fully opened chart stays in the gear scale (≤ 60 stat points, pct_atk / pct_red ≤ 16 %, hp_regen ≤ 4.5)", () => {
  for (const c of MERIDIAN_CHARTS) {
    const b = meridianChartBonus(c, c.nodes.map(() => 3));
    const statSum = Object.values(b.stats).reduce((a, v) => a + (v ?? 0), 0);
    assert.ok(statSum <= 60, `${c.id}: ${statSum} stat points`);
    assert.ok(b.combat.pct_atk <= 16 && b.combat.pct_red <= 16, `${c.id}: pct_atk ${b.combat.pct_atk} pct_red ${b.combat.pct_red}`);
    assert.ok(b.combat.hp_regen <= 4.5, `${c.id}: hp_regen ${b.combat.hp_regen}`);
  }
});

check("content: requires name at least one real, learnable skill / art", () => {
  for (const c of MERIDIAN_CHARTS) {
    const skills = c.requires.skills ?? []; const arts = c.requires.arts ?? [];
    assert.ok(skills.length + arts.length > 0, `${c.id} requires nothing`);
    for (const id of skills) assert.ok(SKILLS_BY_ID.has(id) && !id.startsWith("bst_"), `${c.id}: skill ${id}`);
    for (const id of arts) assert.ok(ARTS_BY_ID.has(id) && id !== "none", `${c.id}: art ${id}`);
    assert.equal(new Set(skills).size, skills.length, `${c.id}: repeated skill`);
    assert.equal(new Set(arts).size, arts.length, `${c.id}: repeated art`);
  }
});

check("content: every chart has a source; shops, opponents and quests exist; chances in (0, 1]", () => {
  const shopIds = new Set(SHOPS.map((s) => s.id));
  for (const id of Object.keys(MERIDIAN_SOURCES)) assert.ok(getMeridianChart(id), `source for unknown chart ${id}`);
  for (const c of MERIDIAN_CHARTS) {
    const src = meridianSourceOf(c.id);
    const n = (src.shops?.length ?? 0) + (src.loot?.length ?? 0) + (src.questRewards?.length ?? 0);
    assert.ok(n > 0, `${c.id} has no source`);
    for (const s of src.shops ?? []) assert.ok(shopIds.has(s), `${c.id}: shop ${s}`);
    for (const l of src.loot ?? []) {
      assert.ok(OPPONENTS_BY_ID.has(l.opponentId), `${c.id}: opponent ${l.opponentId}`);
      assert.ok(l.chance > 0 && l.chance <= 1, `${c.id}: chance ${l.chance}`);
    }
    for (const q of src.questRewards ?? []) assert.ok(QUESTS_BY_ID.has(q), `${c.id}: quest ${q}`);
    // Repeatable: a shop, or a roaming foe (saga foes st_* are fought once).
    const repeatable = (src.shops?.length ?? 0) > 0 || (src.loot ?? []).some((l) => !l.opponentId.startsWith("st_"));
    assert.ok(repeatable, `${c.id} has no repeatable source`);
    // T4 / T5 charts are never sold.
    if (c.ti >= 4) assert.equal(src.shops?.length ?? 0, 0, `${c.id} (T${c.ti}) is sold in a shop`);
  }
});

check("items: every chart has its แผนภาพชีพจร item (manual, priced, with a scroll icon)", () => {
  for (const c of MERIDIAN_CHARTS) {
    const item = getItem(meridianChartItemId(c.id));
    assert.ok(item, `no item for ${c.id}`);
    assert.equal(item.name, `แผนภาพชีพจร-${c.name}`);
    assert.equal(item.category, "manual");
    assert.deepEqual(item.use, { t: "learnMeridian", chartId: c.id });
    assert.ok((item.price ?? 0) > 0);
    assert.match(itemIconId(item.id) ?? "", /^ico_book_scroll_\d\d$/);
  }
});

check("sources: shops stock their charts; loot rolls by chance; quests hand theirs over", () => {
  for (const c of MERIDIAN_CHARTS) {
    const src = meridianSourceOf(c.id);
    const itemId = meridianChartItemId(c.id);
    for (const s of src.shops ?? []) assert.ok(SHOPS.find((x) => x.id === s)!.inventory.includes(itemId), `${s} lacks ${itemId}`);
    for (const l of src.loot ?? []) {
      assert.ok(meridianLootFor(l.opponentId).some((x) => x.itemId === itemId));
      assert.ok(rollMeridianLoot(l.opponentId, () => 0).includes(itemId), "rand 0 always drops");
      assert.ok(!rollMeridianLoot(l.opponentId, () => 0.999999).includes(itemId) || l.chance >= 0.999999);
    }
    for (const q of src.questRewards ?? []) {
      assert.ok((QUESTS_BY_ID.get(q)!.rewards ?? []).some((r) => r.t === "item" && r.itemId === itemId), `${q} lacks ${itemId}`);
    }
  }
  assert.deepEqual(rollMeridianLoot("__nobody__", () => 0), []);
});

// ─── Combat integration (with a real chart) ──────────────────────────
const statChart = MERIDIAN_CHARTS.find((c) => c.nodes.some((n) => Object.keys(n.ranks[0].stats ?? {}).length > 0));
const combatChart = MERIDIAN_CHARTS.find((c) => c.nodes.some((n) => (n.ranks[0].combat?.pct_atk ?? 0) > 0 || (n.ranks[1].combat?.pct_atk ?? 0) > 0 || (n.ranks[2].combat?.pct_atk ?? 0) > 0));

check("combat: meridian stats join combinedStats / statBreakdown; combat fields join deriveAll and the battle bonus", () => {
  newGame();
  const base = store().playerBuild!;
  assert.ok(statChart, "no chart with base stats");
  const full = (c: MeridianChart) => c.nodes.map(() => 3);
  const withStats: CharacterBuild = { ...base, meridians: { [statChart.id]: full(statChart) } };
  const bonus = meridianChartBonus(statChart, full(statChart));
  const before = combinedStats(base); const after = combinedStats(withStats);
  for (const k of STAT_KEYS) assert.equal(after[k] - before[k], bonus.stats[k] ?? 0, `combined ${k}`);
  const bd = statBreakdown(withStats);
  for (const k of STAT_KEYS) assert.equal(bd.fromMeridians[k], bonus.stats[k] ?? 0, `breakdown ${k}`);
  assert.deepEqual(statBreakdown(base).fromMeridians, { STR: 0, AGI: 0, POW: 0, VIT: 0, DEX: 0, LUK: 0, DEF: 0, INT: 0 });

  // Combat fields: a hand-made learned map through the real lookup.
  const anyCombat = MERIDIAN_CHARTS.find((c) => c.nodes.some((n) => n.ranks.some((r) => (r.combat?.atk ?? 0) > 0)));
  if (anyCombat) {
    const b2: CharacterBuild = { ...base, meridians: { [anyCombat.id]: full(anyCombat) } };
    const cb = meridianChartBonus(anyCombat, full(anyCombat));
    const statOnly = { ...meridianChartBonus(anyCombat, full(anyCombat)).stats };
    const d0 = deriveAll({ ...base, stats: { ...base.stats, ...Object.fromEntries(STAT_KEYS.map((k) => [k, base.stats[k] + (statOnly[k] ?? 0)])) } });
    const d1 = deriveAll(b2);
    assert.equal(d1.Atk - d0.Atk, cb.combat.atk, "deriveAll adds meridian atk");
    assert.equal(d1.HP - d0.HP, cb.combat.hp, "deriveAll adds meridian hp");
  }
  if (combatChart) {
    const b3: CharacterBuild = { ...base, meridians: { [combatChart.id]: full(combatChart) } };
    const cb = meridianChartBonus(combatChart, full(combatChart)).combat;
    const eb = getBuildBonus(b3);
    const plain = getEquipBonus(b3.equipment);
    assert.equal(eb.pct_atk - plain.pct_atk, cb.pct_atk);
    assert.equal(eb.pct_red - plain.pct_red, cb.pct_red);
    assert.equal(eb.hp_regen - plain.hp_regen, cb.hp_regen);
    const ctx = makeContext(b3, base);
    assert.equal(ctx.equipBonus.A.pct_atk, eb.pct_atk, "battle context (1v1 and grid duels) carries it");
    assert.equal(ctx.equipBonus.B.pct_atk, getEquipBonus(base.equipment).pct_atk);
  }
});

// ─── Store ───────────────────────────────────────────────────────────
check("store: every skill / art level gained gives +1 meridian point (w-exp, practice / battle xp)", () => {
  newGame();
  assert.equal(store().meridianPoints, 0);
  const skillId = store().playerBuild!.skillIds.find((s) => s && !s.startsWith("art:"))!;
  useWorldStore.setState({ wExp: 1_000_000 });
  assert.ok(store().levelUpSkillFromWExp(skillId).ok);
  assert.equal(store().meridianPoints, 1);
  const artId = store().playerBuild!.learnedArtIds?.[0] ?? null;
  if (artId) {
    assert.ok(store().levelUpArtFromWExp(artId).ok);
    assert.equal(store().meridianPoints, 2);
  }
  // Auto level-ups on overflow (practice / battle xp share applySkillLevelUps).
  const p0 = store().meridianPoints;
  useWorldStore.setState({ currentSceneId: "sect_shaolin", stamina: 100, skillExp: { ...store().skillExp, [skillId]: 1_000_000 } });
  const lv0 = store().skillLevel[skillId] ?? 1;
  const r = store().practiceSkill(skillId);
  assert.ok(r.ok, JSON.stringify(r));
  const gained = (store().skillLevel[skillId] ?? 1) - lv0;
  assert.ok(gained >= 2, `levels gained ${gained}`);
  assert.equal(store().meridianPoints - p0, gained);
  assert.ok(store().actionLog.some((e) => e.kind === "meridian"));
});

check("store: a chart item reads only with its requirements, once; it stores zero ranks", () => {
  const chart = MERIDIAN_CHARTS.find((c) => (c.requires.skills?.length ?? 0) + (c.requires.arts?.length ?? 0) > 0)!;
  assert.ok(chart);
  newGame();
  const itemId = meridianChartItemId(chart.id);
  const b = store().playerBuild!;
  // Strip the requirements so the read refuses.
  const need = new Set([...(chart.requires.skills ?? []), ...(chart.requires.arts ?? [])]);
  useWorldStore.setState({
    inventory: { [itemId]: 1 },
    playerBuild: { ...b, learnedSkillIds: (b.learnedSkillIds ?? []).filter((x) => !need.has(x)), learnedArtIds: (b.learnedArtIds ?? []).filter((x) => !need.has(x)) },
  });
  const refused = store().useItem(itemId);
  assert.ok(!refused.ok && refused.reason === "meridian-locked" && refused.message.startsWith("ต้องเรียน"), JSON.stringify(refused));
  assert.equal(store().inventory[itemId], 1, "item kept");
  assert.ok(meridianReadBlock(chart, store().playerBuild));
  // Learn them.
  const pb = store().playerBuild!;
  useWorldStore.setState({ playerBuild: { ...pb,
    learnedSkillIds: [...(pb.learnedSkillIds ?? []), ...(chart.requires.skills ?? [])],
    learnedArtIds: [...(pb.learnedArtIds ?? []), ...(chart.requires.arts ?? [])] } });
  assert.equal(meridianReadBlock(chart, store().playerBuild), null);
  const ok = store().useItem(itemId);
  assert.ok(ok.ok && ok.kind === "learnMeridian" && ok.chartId === chart.id, JSON.stringify(ok));
  assert.deepEqual(store().playerBuild!.meridians?.[chart.id], chart.nodes.map(() => 0));
  assert.equal(store().inventory[itemId] ?? 0, 0, "item used up");
  useWorldStore.setState({ inventory: { [itemId]: 1 } });
  const again = store().useItem(itemId);
  assert.ok(!again.ok && again.reason === "already-learned");
  assert.equal(store().inventory[itemId], 1);
});

check("store: openMeridianNode spends points, keeps order, stops at rank 3", () => {
  const chart = MERIDIAN_CHARTS.find((c) => c.nodes.length >= 2)!;
  newGame();
  const b = store().playerBuild!;
  useWorldStore.setState({ meridianPoints: 0, playerBuild: { ...b, meridians: { [chart.id]: chart.nodes.map(() => 0) } } });
  const poor = store().openMeridianNode(chart.id, 0);
  assert.ok(!poor.ok && poor.reason.includes("แต้มชีพจรไม่พอ"));
  useWorldStore.setState({ meridianPoints: 1000 });
  const locked = store().openMeridianNode(chart.id, 1);
  assert.ok(!locked.ok, "node 1 is locked until node 0 opens");
  assert.equal(store().meridianPoints, 1000);
  for (let r = 1; r <= 3; r++) {
    const res = store().openMeridianNode(chart.id, 0);
    assert.deepEqual(res, { ok: true, rank: r });
  }
  const spent = meridianRankCost(chart.ti, 1) + meridianRankCost(chart.ti, 2) + meridianRankCost(chart.ti, 3);
  assert.equal(store().meridianPoints, 1000 - spent);
  assert.ok(!store().openMeridianNode(chart.id, 0).ok, "max");
  assert.deepEqual(store().openMeridianNode(chart.id, 1), { ok: true, rank: 1 });
  assert.deepEqual(store().playerBuild!.meridians![chart.id]!.slice(0, 2), [3, 1]);
  assert.ok(!store().openMeridianNode("__nope__", 0).ok);
  assert.ok(!store().openMeridianNode(MERIDIAN_CHARTS.find((c) => c.id !== chart.id)!.id, 0).ok, "unlearned chart");
  assert.ok(store().actionLog.some((e) => e.kind === "meridian" && e.message.includes(chart.name)));
});

check("save: v24 persists meridianPoints; migrate defaults it; repair drops unknown charts and fixes ranks", () => {
  const options = useWorldStore.persist.getOptions();
  assert.equal(options.version, 24);
  newGame();
  useWorldStore.setState({ meridianPoints: 7 });
  const saved = options.partialize!(store()) as { meridianPoints?: number };
  assert.equal(saved.meridianPoints, 7);
  const migrated = options.migrate!({ ...saved, meridianPoints: undefined }, 23) as { meridianPoints: number };
  assert.equal(migrated.meridianPoints, 0);
  const chart = MERIDIAN_CHARTS[0]!;
  const state = JSON.parse(JSON.stringify(store())) as ReturnType<typeof store>;
  state.meridianPoints = -3;
  state.playerBuild = { ...state.playerBuild!, meridians: { [chart.id]: [9, -2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], gone_chart: [1] } };
  validateAndRepair(state);
  assert.equal(state.meridianPoints, 0);
  assert.deepEqual(Object.keys(state.playerBuild!.meridians!), [chart.id]);
  const ranks = state.playerBuild!.meridians![chart.id]!;
  assert.equal(ranks.length, chart.nodes.length);
  assert.equal(ranks[0], 3);
  if (chart.nodes.length > 1) assert.equal(ranks[1], 0);
});

console.log(`\n${passed} meridian checks passed`);
