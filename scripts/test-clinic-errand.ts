import assert from "node:assert/strict";
import type { Choice, DialogScene, WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });

const { useWorldStore } = await import("../store/world-store");
const { applyEffects, evaluateCondition, getNpc, getQuest, getScene, isQuestOfferable, isQuestTurnInForNpc } = await import("../lib/world");
const id = "qc_capital_clinic_supplies";
const lin = "city_capital_physician_lin";
const quest = getQuest(id)!;
const scene = (sceneId: string) => {
  const value = getScene(sceneId);
  assert.equal(value?.kind, "dialog");
  return value as DialogScene;
};
function chooseVisible(state: WorldStateData, choice: Choice): boolean {
  if (choice.visibleIf && !evaluateCondition(state, choice.visibleIf)) return false;
  applyEffects(state, choice.effects ?? []);
  return true;
}

useWorldStore.getState().startNewGame({ name: "Clinic errand test" });
const state: WorldStateData = JSON.parse(JSON.stringify(useWorldStore.getState()));
state.quests.qc_capital_rare_herb = { id: "qc_capital_rare_herb", status: "active", stage: 0 };
const existing = JSON.stringify(state.quests.qc_capital_rare_herb);
const before = {
  gold: state.gold, herb: state.inventory.herb ?? 0, xp: state.wExp,
  relationship: state.npcStates[lin]?.relationship ?? 0,
};
const wu = scene("npc_city_capital_magistrate_wu_talk");
const delivery = wu.choices!.find(choice => choice.next === `qs_${id}_delivery`)!;
const claim = scene(`qs_${id}_complete`).choices!.find(choice => choice.effects?.some(effect => effect.t === "finishQuest"))!;
assert.ok(getNpc(lin)?.questIds?.includes(id));
assert.ok(isQuestOfferable(state, quest), "new player can accept without gold, items, mastery or combat");
assert.equal(chooseVisible(state, delivery), false, "Wu cannot deliver before acceptance");
assert.equal(chooseVisible(state, claim), false, "Lin cannot reward before acceptance");
applyEffects(state, [{ t: "startQuest", questId: id }]);
assert.equal(state.quests[id].stage, 0);
assert.equal(isQuestTurnInForNpc(state, quest, lin), false, "Lin cannot turn in before Wu");
assert.equal(chooseVisible(state, claim), false);
assert.ok(chooseVisible(state, scene(`qs_${id}_offer`).choices![0]));
assert.equal(state.quests[id].stage, 0, "popup acceptance plus offer acceptance is idempotent");
assert.ok(chooseVisible(state, delivery));
assert.equal(state.quests[id].stage, 1);
assert.equal(state.quests[id].status, "active");
assert.equal(state.gold, before.gold, "delivery itself does not pay out");
assert.equal(state.wExp, before.xp);
assert.equal(chooseVisible(state, delivery), false, "the same delivery choice cannot repeat");
assert.equal(state.quests[id].stage, 1);
assert.ok(isQuestTurnInForNpc(state, quest, lin));
assert.ok(chooseVisible(state, claim));
assert.equal(state.quests[id].status, "done");
assert.equal(state.gold - before.gold, 80);
assert.equal((state.inventory.herb ?? 0) - before.herb, 3);
assert.equal(state.wExp - before.xp, 20);
assert.equal((state.npcStates[lin]?.relationship ?? 0) - before.relationship, 2);
const after = JSON.stringify(state);
assert.equal(chooseVisible(state, delivery), false);
assert.equal(chooseVisible(state, claim), false);
applyEffects(state, [{ t: "finishQuest", questId: id, success: true }, { t: "advanceQuest", questId: id }]);
assert.equal(JSON.stringify(state), after, "settled effects cannot grant duplicate rewards");
assert.equal(JSON.stringify(state.quests.qc_capital_rare_herb), existing, "existing active quests stay intact");
assert.equal(isQuestOfferable(state, quest), false, "completed errand is not offered again");
assert.equal(isQuestTurnInForNpc(state, quest, lin), false);

const advanced = getQuest("qc_capital_rare_herb")!;
assert.match(advanced.stages[0].description, /ก้นหุบเขาตัดใจ/);
assert.match(advanced.briefSummary!, /ระดับ 5/);
assert.deepEqual(advanced.rewards, [
  { t: "gold", amount: 100 }, { t: "item", itemId: "ginseng", count: 3 },
  { t: "wExp", amount: 30 }, { t: "npcRelationship", npcId: lin, amount: 10 },
]);
console.log("PASS clinic errand: fresh-player eligibility, gated delivery, one advance, exact rewards, idempotent completion, existing-quest preservation, advanced-quest disclosure");

function chooseInStore(text: string) {
  const current = scene(useWorldStore.getState().currentSceneId);
  const index = current.choices!.findIndex(choice => choice.text === text);
  assert.ok(index >= 0, `authored choice exists: ${text}`);
  const choice = current.choices![index];
  assert.ok(!choice.visibleIf || evaluateCondition(useWorldStore.getState(), choice.visibleIf));
  useWorldStore.getState().makeChoice(index);
}
function liveResources() {
  const current = useWorldStore.getState();
  return {
    gold: current.gold, wExp: current.wExp, hp: current.currentHp, mp: current.currentMp,
    day: current.day, time: current.time, stamina: current.stamina,
    inventory: { ...current.inventory }, relationship: current.npcStates[lin]?.relationship ?? 0,
  };
}
function assertLocalReturn(expected: ReturnType<typeof liveResources>) {
  const current = useWorldStore.getState();
  assert.equal(current.currentSceneId, "city_capital");
  assert.equal(current.lastLocationId, "city_capital");
  assert.equal(current.pendingEncounter, null, "stationary conversation does not roll an arrival encounter");
  assert.equal(current.pendingBattle, null);
  assert.deepEqual(liveResources(), expected, "local return spends no travel/time/resources and grants only authored rewards");
}
const random = Math.random;
try {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Clinic local-return test" });
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  useWorldStore.getState().travelRoute("city_capital");
  const baseline = liveResources();
  assertLocalReturn(baseline);

  // The real NPC quest card accepts before displaying the authored offer.
  // Force the encounter lottery throughout every stationary conversation.
  Math.random = () => 0;
  assert.equal(useWorldStore.getState().acceptQuest(id).ok, true);
  useWorldStore.getState().gotoScene(`qs_${id}_offer`);
  chooseInStore("ไปส่งคำขอให้นายอำเภอหวู่");
  assertLocalReturn(baseline);
  assert.equal(useWorldStore.getState().quests[id].stage, 0);

  useWorldStore.getState().gotoScene(wu.id);
  chooseInStore("ส่งคำขอเสบียงจากหมอหลิน");
  assert.equal(useWorldStore.getState().currentSceneId, `qs_${id}_delivery`);
  chooseInStore("กลับไปรายงานหมอหลิน");
  assertLocalReturn(baseline);
  assert.equal(useWorldStore.getState().quests[id].stage, 1);

  useWorldStore.getState().gotoScene(`qs_${id}_complete`);
  chooseInStore("กลับไปสำรวจนครหลวง");
  assertLocalReturn(baseline);
  assert.equal(useWorldStore.getState().quests[id].status, "active", "leaving before claiming preserves the earned turn-in");
  useWorldStore.getState().gotoScene(`qs_${id}_complete`);
  chooseInStore("รับรางวัลเสบียงยาของคลินิก");
  assertLocalReturn({
    ...baseline, gold: baseline.gold + 80, wExp: baseline.wExp + 20,
    inventory: { ...baseline.inventory, herb: (baseline.inventory.herb ?? 0) + 3 },
    relationship: baseline.relationship + 2,
  });
  assert.equal(useWorldStore.getState().quests[id].status, "done");
  console.log("PASS real-store clinic returns with RNG 0: offer, Wu delivery, unclaimed exit and paid claim stay local with no encounter, time or travel cost; only exact earned rewards");

  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Ordinary arrival control" });
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  Math.random = () => 0;
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
  assert.equal(useWorldStore.getState().pendingEncounter, null, "arrival no longer rolls; walking does");
  useWorldStore.getState().walkTick();
  assert.ok(useWorldStore.getState().pendingEncounter, "a walk tick in the capital rolls its encounter with the same RNG 0");
  assert.equal(useWorldStore.getState().pendingEncounter!.returnSceneId, "city_capital");
  console.log("PASS ordinary home→capital arrival is quiet; walking the capital rolls the encounter lottery");
} finally {
  Math.random = random;
}
