import assert from "node:assert/strict";
import { evaluateCondition, getNpc, getNpcsAtLocation, getQuest, getScene, isQuestTurnInForNpc } from "../lib/world";
import { LOCATION_MAPS } from "../lib/world/data/location-maps";
import { planWorldPath, worldFootprints, worldPointBlocked, worldSegmentClear } from "../lib/stage/world-navigation";
import { observeQuestReceipts, type QuestReceipt } from "../components/world/quest-completion-receipt-data";
import type { DialogScene, WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const ledger = "qc_capital_lost_ledger";
const corrupt = "qc_capital_corrupt_clerk";
const clerk = "city_capital_clerk_qing";
const wu = "city_capital_magistrate_wu";
const talk = getNpc(clerk)!.dialogSceneId!;
const chest = `qs_${ledger}_chest`;
const complete = `qs_${ledger}_complete`;
const question = "ถามถึงบัญชีคลังหลวงที่หายไป";
const inspect = "ตรวจหีบเอกสารข้างเสมียนนายฉิง";
const borrow = "ขอยืมกุญแจเก่าจากนายฉิง";
const unlock = "ใช้กุญแจเก่าเปิดหีบและหยิบบัญชี";
const claim = "ส่งมอบบัญชีและรับรางวัล";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const scene = (id = useWorldStore.getState().currentSceneId): DialogScene => {
  const value = getScene(id);
  assert.equal(value?.kind, "dialog");
  return value as DialogScene;
};
function visible(id: string, text: string) {
  const choice = scene(id).choices?.find(choice => choice.text === text);
  assert.ok(choice, `authored choice exists: ${text}`);
  return !choice.visibleIf || evaluateCondition(useWorldStore.getState(), choice.visibleIf);
}
function choose(text: string) {
  const current = scene();
  // Mirrors the rendered choice gate before calling the real store action.
  // makeChoice itself is an ungated low-level dispatcher in the legacy engine.
  assert.equal(visible(current.id, text), true, `choice is available: ${text}`);
  useWorldStore.getState().makeChoice(current.choices!.findIndex(choice => choice.text === text));
}
function resources() {
  const state = useWorldStore.getState();
  return { gold: state.gold, wExp: state.wExp, hp: state.currentHp, mp: state.currentMp,
    stamina: state.stamina, day: state.day, time: state.time,
    relationship: state.npcStates[wu]?.relationship ?? 0 };
}
function newCapital() {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Capital investigation test" });
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
}
function greetClerk() {
  useWorldStore.getState().meetNpc(clerk);
  useWorldStore.getState().gotoScene(talk);
}
function beginLedger() {
  // This is the current NPC quest-card flow: accept, then show briefing.
  assert.equal(useWorldStore.getState().acceptQuest(ledger).ok, true);
  useWorldStore.getState().gotoScene(`qs_${ledger}_offer`);
  assert.equal(visible(`qs_${ledger}_offer`, "ปฏิเสธ"), false, "active briefing must not pretend decline cancels the already accepted quest");
  choose("ข้าจะไปพบเสมียนนายฉิง");
  choose("รับทราบ");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
}
function turnIn() {
  assert.equal(isQuestTurnInForNpc(useWorldStore.getState(), getQuest(ledger)!, wu), true);
  useWorldStore.getState().gotoScene(complete);
  choose(claim);
  assert.equal(useWorldStore.getState().quests[ledger].status, "done");
}

const random = Math.random;
try {
  const map = LOCATION_MAPS.city_capital;
  const spot = map.npcSpots![clerk];
  assert.ok(spot, "Qing is placed on the live capital map");
  assert.ok(getNpcsAtLocation("city_capital").some(npc => npc.id === clerk && npc.name === "เสมียนนายฉิง"));
  // The capital as the game walks it: the painting (its placed city is a draft, DRAFT_PLACED_MAPS).
  const footprints = worldFootprints("city_capital", map.image);
  const feet = { x: spot.x * 9.6, y: spot.y * 6.4 };
  const approach = { x: feet.x + 38, y: feet.y + 4 }; // actual runtime NPC approach
  assert.equal(worldPointBlocked(feet, footprints), false);
  assert.equal(worldPointBlocked(approach, footprints), false);
  for (const point of [map.spawn, map.npcSpots![wu]]) {
    let previous = { x: point.x * 9.6, y: point.y * 6.4 };
    const path = planWorldPath(previous, approach, footprints);
    assert.deepEqual(path.at(-1), approach);
    for (const step of path) {
      assert.equal(worldSegmentClear(previous, step, footprints), true);
      previous = step;
    }
  }
  assert.deepEqual(getQuest(ledger)!.stages.map(stage => stage.id), ["investigate", "find_ledger", "return"]);
  assert.deepEqual(getQuest(corrupt)!.stages.map(stage => stage.id), ["surveil", "confront", "report"]);
  const overview = scene("npc_city_capital_magistrate_wu_jobs").lines.map(line => line.text).join(" ");
  assert.ok(overview.includes(getNpc(clerk)!.name));
  assert.match(overview, /กุญแจเก่า/);
  assert.match(overview, /โจรเร่ร่อน 2 คน/);
  assert.match(overview, /ด้านซ้าย/);
  console.log("PASS clerk registration/map: real NPC, resolvable greeting, clear feet and lateral approach with connected paths from spawn and Wu; stage IDs preserved");

  newCapital();
  greetClerk();
  for (const [id, text] of [[talk, question], [chest, borrow], [chest, unlock], [complete, claim]]) {
    assert.equal(visible(id, text), false, `unaccepted quest cannot use ${text}`);
  }
  choose("ขอตัวไปสำรวจนครหลวง");
  beginLedger();
  assert.equal(useWorldStore.getState().quests[ledger].stage, 0);
  assert.equal(visible(complete, claim), false);
  assert.equal(isQuestTurnInForNpc(useWorldStore.getState(), getQuest(ledger)!, wu), false);
  const before = resources();
  greetClerk();
  choose(question);
  assert.equal(useWorldStore.getState().quests[ledger].stage, 1);
  choose("กลับไปถามนายฉิง");
  choose(question);
  assert.equal(useWorldStore.getState().quests[ledger].stage, 1, "repeat interview cannot skip the chest");
  choose(inspect);
  assert.equal(visible(chest, unlock), false);
  choose(borrow);
  assert.equal(useWorldStore.getState().inventory.old_key, 1);
  assert.equal(useWorldStore.getState().quests[ledger].stage, 1, "owning a key does not retrieve the ledger");
  assert.equal(visible(complete, claim), false);
  assert.equal(visible(chest, borrow), false, "no repeat loan while holding a key");
  const midQuest = clone(useWorldStore.getState());
  const stored = JSON.parse(memory.get("wusia-world-v1")!);
  assert.equal(stored.version, 25);
  await useWorldStore.persist.rehydrate();
  assert.deepEqual(useWorldStore.getState().quests, midQuest.quests);
  assert.deepEqual(useWorldStore.getState().inventory, midQuest.inventory);
  assert.deepEqual(useWorldStore.getState().flags, midQuest.flags);
  assert.equal(useWorldStore.getState().currentSceneId, midQuest.currentSceneId);
  choose("กลับไปตรวจหีบเอกสาร");
  choose(unlock);
  assert.equal(useWorldStore.getState().quests[ledger].stage, 2);
  assert.equal(useWorldStore.getState().quests[ledger].status, "active");
  assert.equal(useWorldStore.getState().flags.capital_ledger_recovered, true);
  assert.deepEqual(resources(), before, "interview, key and chest have no reward or resource cost");
  for (const text of [borrow, unlock]) assert.equal(visible(chest, text), false, "retrieval cannot repeat");
  Math.random = () => 0; // Would force a random event if the return rerolled arrival.
  choose("นำบัญชีไปรายงานนายอำเภอหวู่");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
  assert.equal(useWorldStore.getState().pendingEncounter, null);
  const receipts: QuestReceipt[] = [];
  const stopReceipts = observeQuestReceipts(useWorldStore, receipt => { if (receipt) receipts.push(receipt); });
  turnIn();
  stopReceipts();
  assert.equal(receipts.length, 1, "real claim emits exactly one completion receipt");
  assert.equal(receipts[0].questId, ledger);
  assert.equal(receipts[0].npcName, "นายอำเภอหวู่");
  assert.match(receipts[0].quotation!, /ขอบคุณ.*พบบัญชี.*ตรวจหลักฐาน/);
  assert.doesNotMatch(receipts[0].quotation!, /หากท่าน|ส่งให้ข้าตรวจ/, "receipt acknowledges the accomplished investigation instead of requesting a future handoff");
  assert.deepEqual(receipts[0].rewards.map(reward => [reward.id, reward.value]), [
    ["gold", "+150"], ["wExp", "+30"], [`relationship:${wu}`, "+8"],
  ]);
  assert.deepEqual(resources(), { ...before, gold: before.gold + 150, wExp: before.wExp + 30, relationship: before.relationship + 8 });
  assert.equal(useWorldStore.getState().inventory.old_key, 1, "loaned key remains useful after reporting");
  const paid = resources();
  assert.equal(visible(complete, claim), false);
  assert.equal(visible(talk, question), false);
  assert.equal(isQuestTurnInForNpc(useWorldStore.getState(), getQuest(ledger)!, wu), false);
  useWorldStore.getState().gotoScene(complete);
  choose("ขอตัวก่อน");
  assert.deepEqual(resources(), paid);
  assert.equal(useWorldStore.getState().pendingEncounter, null);
  await useWorldStore.persist.rehydrate();
  assert.deepEqual(resources(), paid);
  assert.equal(visible(complete, claim), false);
  console.log("PASS normal real-store ledger: accepted briefing → interview → one key → explicit chest → Wu; free safe returns, midquest reload, exact earned reward once, retained key; actual receipt thanks the player for finding evidence");

  // Existing saves retain stage IDs and their acquired keys. Requiring the
  // new explicit chest interaction never resets or auto-rewards progress.
  for (const oldStage of [0, 1, 2]) {
    newCapital();
    useWorldStore.setState({ inventory: { old_key: 2 } });
    beginLedger();
    const legacy: WorldStateData = clone(useWorldStore.getState());
    legacy.quests[ledger].stage = oldStage;
    legacy.quests[ledger].acceptedHasItemAt = { old_key: 2 };
    memory.set("wusia-world-v1", JSON.stringify({ state: legacy, version: 19 }));
    await useWorldStore.persist.rehydrate();
    assert.equal(useWorldStore.getState().quests[ledger].stage, oldStage);
    assert.equal(visible(complete, claim), false, "legacy key/stage alone cannot grant the new chest evidence");
    const legacyBefore = resources();
    greetClerk();
    choose(question);
    assert.equal(useWorldStore.getState().quests[ledger].stage, Math.max(1, oldStage));
    choose(inspect);
    assert.equal(visible(chest, borrow), false);
    choose(unlock);
    assert.equal(useWorldStore.getState().quests[ledger].stage, 2);
    assert.deepEqual(resources(), legacyBefore);
    choose("นำบัญชีไปรายงานนายอำเภอหวู่");
    turnIn();
    assert.equal(useWorldStore.getState().inventory.old_key, 2, "preexisting keys are neither consumed nor duplicated");
    assert.equal(useWorldStore.getState().gold, legacyBefore.gold + 150);
  }
  console.log("PASS legacy stages 0/1/2 and preexisting key stash: no reset, no accidental auto-finish, no item duplication or consumption");

  newCapital();
  beginLedger();
  greetClerk(); choose(question); choose(inspect); choose(borrow);
  // Another authored quest can consume old_key before this chest opens.
  useWorldStore.setState({ inventory: {} });
  choose("กลับไปตรวจหีบเอกสาร");
  assert.equal(visible(chest, borrow), false, "losing the loan never enables another mint");
  choose("กุญแจที่ยืมไม่อยู่แล้ว ขอให้นายฉิงไขหีบให้");
  assert.equal(useWorldStore.getState().quests[ledger].stage, 2);
  assert.equal(useWorldStore.getState().inventory.old_key, undefined, "clerk's spare unlocks without handing out a key");
  choose("นำบัญชีไปรายงานนายอำเภอหวู่");
  turnIn();
  console.log("PASS cross-quest key loss: clerk can unlock once without minting a replacement or blocking completion");

  newCapital();
  useWorldStore.setState({ defeatedCounts: { thug: 2 } });
  assert.equal(useWorldStore.getState().acceptQuest(corrupt).ok, true);
  const untouchedLedger = clone(useWorldStore.getState().quests[ledger] ?? null);
  const contactBefore = resources();
  greetClerk();
  choose("ถามเรื่องสินบนในสำนักงาน");
  assert.equal(useWorldStore.getState().quests[corrupt].stage, 1);
  assert.deepEqual(resources(), contactBefore);
  assert.equal(visible(talk, "ถามเรื่องสินบนในสำนักงาน"), false, "contact does not repeat");
  assert.equal(isQuestTurnInForNpc(useWorldStore.getState(), getQuest(corrupt)!, wu), false, "pre-acceptance victories cannot replace two new victories");
  choose("กลับไปถามนายฉิง");
  assert.deepEqual(useWorldStore.getState().quests[ledger] ?? null, untouchedLedger);
  assert.equal(useWorldStore.getState().pendingBattle, null, "contact does not force combat");
  assert.equal(useWorldStore.getState().defeatedCounts.thug, 2);
  assert.deepEqual(getQuest(corrupt)!.stages[1].autoAdvance, { t: "defeatedOpponent", opponentId: "thug", count: 2 });
  Math.random = () => 0;
  useWorldStore.setState({ stamina: 0 });
  choose("ขอตัวไปสำรวจนครหลวง");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
  assert.equal(useWorldStore.getState().stamina, 0);
  assert.equal(useWorldStore.getState().pendingEncounter, null);
  console.log("PASS corrupt-clerk contact: real stage-0 lead, preserved two-new-thug gate, no free wins/rewards, no ledger interference, safe exit at zero stamina");
} finally {
  Math.random = random;
}
