/**
 * Quest dialogs are reachable and the hand-written quest flows they drive
 * play through.
 *  - every `qs_*` dialog opens from something: a scene choice / next / goto /
 *    battle outcome, an NPC talk, the NPC card (`qs_<quest>_offer`,
 *    `_complete`, `_progress`) or an objective spot's `sceneId`;
 *  - every hand-written offer whose accept choice runs `startQuest` (the NPC
 *    card opens it before accepting) has no other choice that starts it;
 *  - the quests whose dialogs were once unreachable finish through them.
 * Run: bun scripts/test-quest-dialogs.ts
 */
import assert from "node:assert/strict";
import { NPCS, QUESTS, SCENES, SCENES_BY_ID, START_SCENE_ID, evaluateCondition, getNpc, getQuest, getScene, type Condition, type DialogScene, type Scene, type SceneEffect } from "../lib/world";

import { dialogSpeaker, npcForSpeaker, questIdOfScene, sceneCast } from "../lib/world/speaker";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const { useBattleStore } = await import("../store/battle-store");
const { ensureBattleStarted } = await import("../lib/world/battle-bridge");
const store = () => useWorldStore.getState();
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

// ── Reachability ─────────────────────────────────────────────────────────
function effectsOf(scene: Scene): SceneEffect[] {
  const out: SceneEffect[] = [];
  if (scene.kind === "dialog" || scene.kind === "location") out.push(...(scene.onEnter ?? []));
  if (scene.kind === "dialog") for (const c of scene.choices ?? []) out.push(...(c.effects ?? []));
  else if (scene.kind === "route") for (const d of scene.destinations) out.push(...(d.effects ?? []));
  return out;
}
function childScenes(scene: Scene): string[] {
  const out: string[] = [];
  if (scene.kind === "dialog") {
    if (scene.next) out.push(scene.next);
    for (const c of scene.choices ?? []) out.push(c.next);
  } else if (scene.kind === "location") {
    for (const r of scene.routes) out.push(r.routeSceneId);
    for (const n of scene.npcs) out.push(n.dialogSceneId);
  } else {
    for (const d of scene.destinations) out.push(d.locationId);
    if (scene.back) out.push(scene.back);
  }
  for (const e of effectsOf(scene)) {
    if (e.t === "goto") out.push(e.sceneId);
    if (e.t === "gotoRandom") out.push(...e.sceneIds);
    if (e.t === "triggerBattle") out.push(e.onWin, e.onLose);
  }
  return out;
}

check("every qs_* dialog opens from a scene, an NPC, the NPC card or an objective spot", () => {
  const seeds = [START_SCENE_ID, "jail_cell"];
  for (const npc of NPCS) if (npc.dialogSceneId) seeds.push(npc.dialogSceneId);
  for (const s of SCENES) if (s.kind === "location") seeds.push(s.id);
  for (const q of QUESTS) {
    // The NPC card opens these for the quest's giver / hand-in person.
    if (q.giverNpcId || q.turnInNpcId || q.sectId) for (const k of ["offer", "complete", "progress"]) seeds.push(`qs_${q.id}_${k}`);
    for (const stage of q.stages) for (const spot of stage.objective?.spots ?? []) if (spot.sceneId) seeds.push(spot.sceneId);
  }
  const reached = new Set<string>();
  const queue = seeds.filter((id) => SCENES_BY_ID.has(id));
  while (queue.length) {
    const id = queue.pop()!;
    if (reached.has(id)) continue;
    const scene = SCENES_BY_ID.get(id);
    if (!scene) continue;
    reached.add(id);
    queue.push(...childScenes(scene));
  }
  const orphans = SCENES.filter((s) => s.kind === "dialog" && s.id.startsWith("qs_") && !reached.has(s.id)).map((s) => s.id);
  assert.deepEqual(orphans, [], `unreachable quest dialogs:\n${orphans.join("\n")}`);
});

check("hand-written offers: only the accept choice starts the quest", () => {
  let offers = 0;
  for (const scene of SCENES) {
    const m = /^qs_(.+)_offer$/.exec(scene.id);
    const quest = m ? getQuest(m[1]) : null;
    if (!quest || scene.kind !== "dialog" || quest.story || quest.lineage) continue;
    const starts = (effects?: readonly SceneEffect[]) => (effects ?? []).some((e) => e.t === "startQuest" && e.questId === quest.id);
    assert.ok(!starts(scene.onEnter), `${scene.id} starts the quest on entry, before any choice`);
    const choices = scene.choices ?? [];
    if (!choices.some((c) => starts(c.effects))) continue;
    offers++;
    // Any other choice shown before accepting must not lead into the accepted flow.
    for (const c of choices) {
      if (starts(c.effects)) continue;
      const shownBefore = !c.visibleIf || !(c.visibleIf.t === "questStatus" && c.visibleIf.questId === quest.id && c.visibleIf.status !== "none");
      if (!shownBefore) continue;
      assert.ok(!(c.effects ?? []).some((e) => e.t === "advanceQuest" || e.t === "finishQuest"), `${scene.id}: "${c.text}" moves a quest that was never accepted`);
    }
  }
  assert.ok(offers > 150, `${offers} declinable offers`);
});

check("speaker labels find their NPC's portrait; walk-ons and the hero find nobody", () => {
  const id = (speaker: string, sceneId = "") => npcForSpeaker(speaker, sceneCast(sceneId))?.id;
  assert.equal(id("หวงชิงเฉวียน"), "wld_taohua_hermit_huang", "name before the (epithet)");
  assert.equal(id("เหลียงเก๋อ"), "wld_motian_ghost_liang");
  assert.equal(id("ฤๅษีชิวเฉียน"), "wld_kunlun_exile_qiu", "a title before the full name");
  assert.equal(id("เถ้าแก่โจว", "qs_qe_capital_jewel_heist_offer"), "evil_capital_blackmarket_zhou", "part of the quest giver's name");
  assert.equal(id("เถ้าแก่โจว"), undefined, "…but only for that giver's dialogs");
  assert.equal(id("ซี", "qs_qst_spy_yangzhou_smuggler_ship_offer"), "spy_yangzhou_xi");
  for (const walkOn of ["{hero}", "โจรสลัด", "ยายหลี่", "นักรบเศร้า", "หมอดูปลอม"]) assert.equal(id(walkOn, "qs_qv_hengshan_winter_aid_deliver"), undefined, walkOn);
  // Every hand-written quest dialog that names a known person names the right one.
  for (const scene of SCENES) {
    if (scene.kind !== "dialog" || !scene.id.endsWith("_offer")) continue;
    const quest = getQuest(questIdOfScene(scene.id));
    if (!quest || quest.story || quest.lineage) continue;
    const npc = dialogSpeaker(scene);
    if (npc) assert.ok([quest.giverNpcId, quest.turnInNpcId].includes(npc.id), `${scene.id} is voiced by ${npc.name}, not its giver`);
    else assert.ok(!scene.lines.some((l) => l.t === "dialogue"), `${scene.id}: no line resolves to ${getNpc(quest.giverNpcId ?? "")?.name}`);
  }
});

// ── Walkthroughs ─────────────────────────────────────────────────────────
function fresh(at: string) {
  Math.random = () => 0.99; // no roadside encounters
  store().startNewGame({ name: "Quest dialog test" });
  useWorldStore.setState({ currentSceneId: at, lastLocationId: at });
}
function accept(questId: string) {
  store().gotoScene(`qs_${questId}_offer`);
  choose(/./, (c) => (c.effects ?? []).some((e) => e.t === "startQuest" && e.questId === questId));
  assert.equal(store().quests[questId]?.status, "active", `${questId} accepted`);
}
function choose(pattern: RegExp, extra?: (c: NonNullable<DialogScene["choices"]>[number]) => boolean) {
  const scene = getScene(store().currentSceneId) as DialogScene;
  assert.equal(scene?.kind, "dialog", `in a dialog, got ${store().currentSceneId}`);
  const index = scene.choices!.findIndex((c) => pattern.test(c.text) && (!extra || extra(c)));
  assert.ok(index >= 0, `${scene.id}: choice ${pattern}`);
  store().makeChoice(index);
}
function goTo(locationId: string) { useWorldStore.setState({ currentSceneId: locationId, lastLocationId: locationId }); }
function useSpot(questId: string) {
  const r = store().doQuestObjective(questId, 0);
  assert.ok(r.ok, `${questId} objective: ${"message" in r ? r.message : ""}`);
}
function winBattle() {
  assert.ok(store().pendingBattle, "a battle is pending");
  ensureBattleStarted();
  useBattleStore.setState({ state: { ...useBattleStore.getState().state!, hB: 0, winner: "A", phase: "over" } });
  store().acknowledgeBattleResult();
  assert.equal(store().pendingBattle, null);
}
const evaluate = (c: Condition) => evaluateCondition(store(), c);
const stageId = (questId: string) => getQuest(questId)!.stages[store().quests[questId]!.stage]!.id;

check("declining a hand-written offer leaves the quest on offer", () => {
  fresh("pool_heilong");
  store().gotoScene("qs_qw_heilong_dragon_pearl_offer");
  choose(/อันตราย/);
  assert.equal(store().quests.qw_heilong_dragon_pearl, undefined);
  assert.equal(store().currentSceneId, "pool_heilong");
});

check("Liang Ge's restless soul: the keep-or-return choice is the hand-in", () => {
  for (const keep of [false, true]) {
    fresh("cliff_motian");
    accept("qw_motian_restless_soul");
    assert.equal(store().inventory.qst_motian_ancient_sword, 1);
    goTo("cave_treasure");
    store().gotoScene("cave_treasure");
    assert.equal(stageId("qw_motian_restless_soul"), "decide");
    goTo("cliff_motian");
    store().gotoScene("qs_qw_motian_restless_soul_complete");
    const gold = store().gold;
    choose(keep ? /เก็บดาบ/ : /คืนดาบ/);
    assert.equal(store().quests.qw_motian_restless_soul.status, "done");
    assert.equal(store().gold, gold + 350);
    assert.equal(store().inventory.qst_motian_ancient_sword ?? 0, keep ? 1 : 0);
    choose(/./);
    assert.equal(store().currentSceneId, "cliff_motian");
  }
});

check("the red glow: the full-moon dive brings up the ore Tan keeps", () => {
  fresh("pool_heilong");
  useWorldStore.setState({ npcStates: { wld_heilong_fisherman_tan: { met: true, relationship: 20 } } as never });
  accept("qw_heilong_depths_secret");
  useSpot("qw_heilong_depths_secret");
  assert.equal(store().currentSceneId, "qs_qw_heilong_depths_secret_investigate");
  choose(/เก็บตัวอย่าง/);
  assert.equal(stageId("qw_heilong_depths_secret"), "report", "holding the ore skips the mining stage");
  store().gotoScene("qs_qw_heilong_depths_secret_complete");
  choose(/รับรางวัล/);
  assert.equal(store().quests.qw_heilong_depths_secret.status, "done");
  assert.equal(store().inventory.mithril_ore ?? 0, 0);
});

check("winter aid: the rice and pills go to Granny Li and Grandpa Chen", () => {
  fresh("village_hengshan");
  accept("qv_hengshan_winter_aid");
  assert.equal(store().inventory.rice_dish, 3);
  assert.equal(stageId("qv_hengshan_winter_aid"), "deliver_aid", "holding the aid does not finish anything");
  useSpot("qv_hengshan_winter_aid");
  choose(/มอบข้าวหมูแดง/);
  assert.equal(store().inventory.rice_dish ?? 0, 0);
  assert.equal(store().inventory.potion ?? 0, 0);
  assert.equal(stageId("qv_hengshan_winter_aid"), "report_complete");
  choose(/./);
  assert.equal(store().currentSceneId, "village_hengshan");
  store().gotoScene("qs_qv_hengshan_winter_aid_complete");
  choose(/รับรางวัล/);
  assert.equal(store().quests.qv_hengshan_winter_aid.status, "done");
});

check("winter aid: without the goods the elders' door only offers to come back", () => {
  fresh("village_hengshan");
  accept("qv_hengshan_winter_aid");
  useWorldStore.setState({ inventory: {} });
  useSpot("qv_hengshan_winter_aid");
  const scene = getScene(store().currentSceneId) as DialogScene;
  const visible = scene.choices!.filter((c) => !c.visibleIf || evaluate(c.visibleIf));
  assert.equal(visible.length, 1);
  assert.match(visible[0]!.text, /ไม่ครบ/);
});

check("the Yangzhou coin is handed to the Zhao shrine keeper", () => {
  fresh("desert_ruins");
  useWorldStore.setState({ visitedLocationIds: ["desert_ruins"] });
  accept("qw_desert_relic_return");
  goTo("city_yangzhou");
  useSpot("qw_desert_relic_return");
  assert.equal(store().currentSceneId, "qs_qw_desert_relic_return_shrine");
  choose(/มอบเหรียญ/);
  assert.equal(store().inventory.ancient_coin ?? 0, 0);
  assert.equal(stageId("qw_desert_relic_return"), "confirm");
});

check("the stolen formula: the thief's bundle is what goes back to Doctor Lin", () => {
  fresh("city_capital");
  useWorldStore.setState({ npcStates: { city_capital_physician_lin: { met: true, relationship: 10 } } as never });
  accept("qc_capital_stolen_formula");
  choose(/รับทราบ/);
  useSpot("qc_capital_stolen_formula");
  assert.equal(stageId("qc_capital_stolen_formula"), "find_thief");
  useSpot("qc_capital_stolen_formula");
  choose(/ขวางไว้/);
  assert.equal(store().pendingBattle?.opponentId, "fortune_thief");
  winBattle();
  assert.equal(store().currentSceneId, "qs_qc_capital_stolen_formula_recovered");
  choose(/คืนหมอหลิน/);
  assert.equal(store().inventory.qst_lin_formula, 1);
  assert.equal(stageId("qc_capital_stolen_formula"), "return_formula");
  store().gotoScene("qs_qc_capital_stolen_formula_complete");
  choose(/คืนตำรับ/);
  assert.equal(store().quests.qc_capital_stolen_formula.status, "done");
  assert.equal(store().inventory.qst_lin_formula ?? 0, 0);
  assert.equal(store().inventory.book_advanced ?? 0, 0, "no 800-gold book needed");
});

check("Shaolin–Wudang: Qingxu at Wudang, the practice cave, its guardian, then the abbot", () => {
  fresh("sect_shaolin");
  accept("qst_shaolin_wudang_joint");
  assert.equal(stageId("qst_shaolin_wudang_joint"), "discover_connection");
  goTo("sect_wudang");
  useSpot("qst_shaolin_wudang_joint");
  choose(/ถ้ำฝึกวิทยายุทธ์/);
  assert.equal(stageId("qst_shaolin_wudang_joint"), "enter_cave");
  assert.equal(store().currentSceneId, "sect_wudang");
  goTo("cave_zixiu");
  useSpot("qst_shaolin_wudang_joint");
  choose(/รูปสลัก/);
  assert.equal(stageId("qst_shaolin_wudang_joint"), "defeat_guardian");
  choose(/ถอย/);
  useSpot("qst_shaolin_wudang_joint");
  assert.equal(store().currentSceneId, "qs_qst_shaolin_wudang_joint_guardian", "the guardian waits at the cave after a retreat");
  choose(/ผู้พิทักษ์/);
  assert.equal(store().pendingBattle?.opponentId, "demonic_master");
  winBattle();
  assert.equal(store().currentSceneId, "qs_qst_shaolin_wudang_joint_win");
  choose(/เก็บความลับ/);
  assert.equal(stageId("qst_shaolin_wudang_joint"), "uncover_truth");
  goTo("sect_shaolin");
  store().gotoScene("qs_qst_shaolin_wudang_joint_complete");
  choose(/ไม่พบสิ่งใด/);
  assert.equal(store().quests.qst_shaolin_wudang_joint.status, "done");
});

check("the pirate cache is dug up, fought for and carried home", () => {
  fresh("village_wuxia");
  useWorldStore.setState({ quests: { qv_wuxia_missing_boat: { id: "qv_wuxia_missing_boat", status: "done", stage: 1 } } });
  accept("qv_wuxia_pirate_cache");
  goTo("isle_yuanyang");
  useSpot("qv_wuxia_pirate_cache");
  choose(/สู้/);
  winBattle();
  choose(/แบกกล่อง/);
  assert.equal(store().quests.qv_wuxia_pirate_cache.status, "active", "the box still has to reach Deng");
  assert.equal(stageId("qv_wuxia_pirate_cache"), "return_cache");
});

console.log(`${checks} quest dialog checks passed`);
