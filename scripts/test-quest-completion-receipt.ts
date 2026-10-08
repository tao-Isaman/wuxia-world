import assert from "node:assert/strict";
import { observeQuestReceipts, questCompletionReceipt, type QuestReceipt } from "../components/world/quest-completion-receipt-data";
import { applyEffects, getQuest, getScene } from "../lib/world";
import type { WorldStateData } from "../lib/world";
import { setTestClock } from "../lib/world/clock";
// The world clock stands still here, so time never moves between two snapshots.
setTestClock(Date.now());

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
useWorldStore.getState().startNewGame({ newWorld: true, name: "Receipt test" });
const clone = (state: WorldStateData): WorldStateData => JSON.parse(JSON.stringify(state));
const initial = clone(useWorldStore.getState());
const def = getQuest("qc_capital_clinic_supplies")!;
const before = clone(initial);
applyEffects(before, [{ t: "startQuest", questId: def.id }]);
const after = clone(before);
applyEffects(after, [{ t: "finishQuest", questId: def.id, success: true }]);
const unchangedBefore = JSON.stringify(before);
const unchangedAfter = JSON.stringify(after);
const receipt = questCompletionReceipt(def, before, after)!;
assert.equal(receipt.npcName, "หมอหลิน");
assert.equal(receipt.npcId, "city_capital_physician_lin");
assert.equal(receipt.quotation, "เจ้าหน้าที่นำเสบียงมาส่งแล้ว! วันนี้ผู้ป่วยทุกคนจะได้รับยา ขอบใจเจ้ามาก");
assert.deepEqual(receipt.rewards.map(reward => [reward.id, reward.value]), [
  ["gold", "+80"], ["item:herb", "+3"], ["wExp", "+20"], ["relationship:city_capital_physician_lin", "+2"],
]);
assert.equal(JSON.stringify(before), unchangedBefore);
assert.equal(JSON.stringify(after), unchangedAfter, "building presentation never mutates reward state");
assert.equal(questCompletionReceipt(def, initial, after), null, "hydrating an already completed save cannot celebrate again");
assert.equal(questCompletionReceipt(def, after, after), null, "a settled quest never emits a second receipt");
assert.equal(questCompletionReceipt(def, before, before), null, "accepting or opening a turn-in dialog is not completion");
const failed = clone(before);
applyEffects(failed, [{ t: "finishQuest", questId: def.id, success: false }]);
assert.equal(questCompletionReceipt(def, before, failed), null);

const treasure = clone(after);
treasure.gold += 50;
treasure.inventory.herb += 4;
assert.deepEqual(questCompletionReceipt(def, before, treasure)!.rewards, receipt.rewards,
  "a same-return random reward must not be attributed to the quest");
const noGrant = clone(before);
noGrant.quests[def.id].status = "done";
assert.deepEqual(questCompletionReceipt(def, before, noGrant)!.rewards, [], "never print rewards that did not change state");
const partial = clone(after);
partial.gold = before.gold + 7;
assert.equal(questCompletionReceipt(def, before, partial)!.rewards.find(reward => reward.id === "gold")?.value, "+7");
applyEffects(after, [{ t: "finishQuest", questId: def.id, success: true }]);
assert.equal(JSON.stringify(after), unchangedAfter, "presentation leaves the existing exactly-once reward guard intact");
console.log("PASS quest receipt: actual active→done only, exact granted clinic rewards and authored reaction, capped deltas, no hydration/repeat/failure receipt, read-only state");

// Exercise the exact observer mounted by React with ordinary store actions.
// Deep-cloned effect fixtures above cannot reproduce draftFrom's shared quest
// entry mutation, which was responsible for the missing production receipt.
const observed: Array<QuestReceipt | null> = [];
const stop = observeQuestReceipts(useWorldStore, value => observed.push(value));
const random = Math.random;
Math.random = () => 0.5;
function choose(text: string) {
  const scene = getScene(useWorldStore.getState().currentSceneId);
  assert.equal(scene?.kind, "dialog");
  if (scene?.kind !== "dialog") throw new Error("expected dialog");
  const index = scene.choices?.findIndex(choice => choice.text === text) ?? -1;
  assert.ok(index >= 0, `visible authored choice exists: ${text}`);
  useWorldStore.getState().makeChoice(index);
}
try {
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().acceptQuest(def.id).ok, true);
  useWorldStore.getState().gotoScene(`qs_${def.id}_offer`);
  choose("ไปส่งคำขอให้นายอำเภอหวู่");
  useWorldStore.getState().gotoScene("npc_city_capital_magistrate_wu_talk");
  choose("ส่งคำขอเสบียงจากหมอหลิน");
  choose("กลับไปรายงานหมอหลิน");
  useWorldStore.getState().gotoScene(`qs_${def.id}_complete`);
  assert.equal(observed.length, 0, "opening the claim scene emits nothing");
  choose("รับรางวัลเสบียงยาของคลินิก");
  assert.equal(observed.length, 1, "real makeChoice completion emits one receipt despite shared quest entries");
  assert.deepEqual(observed[0], receipt, "real subscription observes the exact clinic rewards and reaction");
  assert.equal(useWorldStore.getState().gold, 80);
  assert.equal(useWorldStore.getState().finishQuestNow(def.id).ok, false);
  useWorldStore.getState().rest("route");
  assert.equal(observed.length, 1, "later store updates and a duplicate claim do not repeat the receipt");
  stop();

  const remounted: Array<QuestReceipt | null> = [];
  const stopRemounted = observeQuestReceipts(useWorldStore, value => remounted.push(value));
  useWorldStore.getState().rest("route");
  assert.equal(remounted.length, 0, "mounting with an already completed quest is silent");
  useWorldStore.getState().resetGame();
  assert.deepEqual(remounted, [null], "reset dismisses transient receipt state");
  useWorldStore.getState().startNewGame({ newWorld: true, name: "No replay" });
  assert.equal(useWorldStore.getState().acceptQuest(def.id).ok, true);
  useWorldStore.getState().abandonQuest(def.id);
  assert.ok(remounted.every(value => value === null), "real abandonment never produces a success receipt");
  stopRemounted();
  console.log("PASS real store subscription: accept → Wu delivery → Lin claim emits exactly once, follow-up/rest/duplicate claim stay silent, remount/reset/abandon handled");
} finally {
  stop();
  Math.random = random;
}
