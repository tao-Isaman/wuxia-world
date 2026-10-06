/**
 * Regression for the campaign dead ends found by scripts/audit-quest-completion.ts:
 * three sect quests whose stage-0 advance scene was unlinked, the orphaned
 * foothill village (first_steps), and silk that nothing sold.
 * Run: bun scripts/test-quest-dead-ends.ts
 */
import assert from "node:assert/strict";
import { getScene, getShopAt, type DialogScene } from "../lib/world";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

/** Force-accept a quest as the NPC popup would, skipping its prereqs, then open the offer scene. */
function acceptAtOffer(questId: string, location: string) {
  Math.random = () => 0.99; // never roll a roadside encounter
  store().startNewGame({ name: "Dead-end test" });
  store().gotoScene(location);
  useWorldStore.setState((s) => ({ quests: { ...s.quests, [questId]: { id: questId, status: "active", stage: 0 } } }));
  store().gotoScene(`qs_${questId}_offer`);
}
function choose(pattern: RegExp) {
  const scene = getScene(store().currentSceneId) as DialogScene;
  assert.equal(scene?.kind, "dialog", `in a dialog, got ${store().currentSceneId}`);
  const index = scene.choices!.findIndex((c) => pattern.test(c.text));
  assert.ok(index >= 0, `${scene.id}: choice ${pattern}`);
  store().makeChoice(index);
}

check("Wudang traitor disciple: accepting leads into the search and the quest completes", () => {
  acceptAtOffer("qst_wudang_traitor_disciple", "sect_wudang");
  choose(/ออกตามหา/);
  assert.equal(store().currentSceneId, "qs_qst_wudang_traitor_disciple_decide");
  choose(/ปล่อยให้เขาหนี/);
  assert.equal(store().quests.qst_wudang_traitor_disciple.stage, 1);
  choose(/รับรางวัล/);
  assert.equal(store().quests.qst_wudang_traitor_disciple.status, "done");
});

check("Shaolin proof of heart: the offer opens the trial and the quest completes", () => {
  acceptAtOffer("qst_shaolin_proof_of_heart", "sect_shaolin");
  choose(/เข้ารับการทดสอบ/);
  choose(/ความเมตตา/);
  assert.equal(store().quests.qst_shaolin_proof_of_heart.stage, 1);
  choose(/.*/);
  assert.equal(store().quests.qst_shaolin_proof_of_heart.status, "done");
});

check("Shaolin–Wudang joint quest: Qingxu's clue and the cave reach the guardian at the kill stage", () => {
  acceptAtOffer("qst_shaolin_wudang_joint", "sect_shaolin");
  assert.equal(store().quests.qst_shaolin_wudang_joint.stage, 0);
  store().gotoScene("sect_wudang");
  assert.equal(store().doQuestObjective("qst_shaolin_wudang_joint", 0).ok, true);
  assert.equal(store().currentSceneId, "qs_qst_shaolin_wudang_joint_start");
  choose(/ถ้ำฝึกวิทยายุทธ์/);
  store().gotoScene("cave_zixiu");
  assert.equal(store().doQuestObjective("qst_shaolin_wudang_joint", 0).ok, true);
  assert.equal(store().currentSceneId, "qs_qst_shaolin_wudang_joint_cave");
  choose(/รูปสลัก/);
  assert.equal(store().quests.qst_shaolin_wudang_joint.stage, 2, "discover_connection and enter_cave are done");
  choose(/ผู้พิทักษ์/);
  assert.equal(store().pendingBattle?.opponentId, "demonic_master");
  assert.equal(store().pendingBattle?.onWin, "qs_qst_shaolin_wudang_joint_win");
});

check("the foothill village and its first_steps quest are reachable from home", () => {
  Math.random = () => 0.99;
  store().startNewGame({ name: "Village route test" });
  const home = getScene("home_player");
  assert.ok(home?.kind === "location" && home.routes.some((r) => r.routeSceneId === "route_home_player__to__village"));
  store().gotoScene("route_home_player__to__village");
  store().travelRoute("village");
  assert.equal(store().currentSceneId, "village");
  const village = getScene("village");
  assert.ok(village?.kind === "location" && village.routes.some((r) => r.routeSceneId === "route_village__to__home_player"));
  assert.ok(!village.routes.some((r) => r.routeSceneId === "village_to_world"), "no link to the retired teleport hub");
  store().gotoScene("elder_talk");
  choose(/รับยา/);
  assert.equal(store().quests.first_steps?.status, "active");
});

check("silk is for sale in Suzhou", () => {
  assert.ok(getShopAt("city_suzhou")?.inventory.includes("silk"));
});

console.log(`${checks} dead-end regression checks passed`);
