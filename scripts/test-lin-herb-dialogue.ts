import assert from "node:assert/strict";
import { evaluateCondition, getItem, getNpc, getQuest, getResource, getScene, getShopAt, isQuestOfferable } from "../lib/world";
import type { DialogScene } from "../lib/world";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const random = Math.random;
const greetingId = getNpc("city_capital_physician_lin")!.dialogSceneId!;
const dialog = (): DialogScene => {
  const scene = getScene(useWorldStore.getState().currentSceneId);
  assert.equal(scene?.kind, "dialog");
  return scene as DialogScene;
};
function choose(text: string) {
  const choices = dialog().choices!;
  const index = choices.findIndex(choice => choice.text === text);
  assert.ok(index >= 0, `authored choice exists: ${text}`);
  assert.equal(choices[index].visibleIf, undefined, "casual conversation is always available");
  useWorldStore.getState().makeChoice(index);
}
function progression() {
  const state = useWorldStore.getState();
  return JSON.stringify({ quests: state.quests, inventory: state.inventory, gold: state.gold, wExp: state.wExp,
    flags: state.flags, npcStates: state.npcStates, stamina: state.stamina, hp: state.currentHp,
    mp: state.currentMp, day: state.day, time: state.time });
}
try {
  for (const questId of [null, "qc_capital_clinic_supplies", "qc_capital_rare_herb"]) {
    Math.random = () => 0.5;
    useWorldStore.getState().startNewGame({ name: "Lin conversation test" });
    useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
    useWorldStore.getState().travelRoute("city_capital");
    if (questId) assert.equal(useWorldStore.getState().acceptQuest(questId).ok, true);
    useWorldStore.getState().gotoScene(greetingId);
    const initialLines = dialog().lines;
    useWorldStore.setState({ stamina: 0 });
    const before = progression();
    choose("ถามเรื่องยาสมุนไพร");
    assert.notEqual(useWorldStore.getState().currentSceneId, greetingId, "herb question must produce a new response");
    assert.notDeepEqual(dialog().lines, initialLines);
    assert.equal(progression(), before, "asking a question never accepts, advances, rewards or changes existing quests");

    const information = dialog().lines.map(line => line.text).join(" ");
    const potion = getItem("potion")!;
    assert.ok(getShopAt("city_capital")!.inventory.includes(potion.id));
    assert.ok(information.includes(potion.name));
    assert.ok(information.includes(`${potion.price} ทอง`));
    assert.equal(potion.use?.t, "heal");
    if (potion.use?.t === "heal") assert.ok(information.includes(`HP ${potion.use.hp} กับอีก ${potion.use.hpPct}%`));
    assert.ok(information.includes(`เก็บสมุนไพรระดับ ${getResource("herb_snow_lotus")!.level}`));
    assert.ok(information.includes("ก้นหุบเขาตัดใจ"));
    assert.match(getQuest("qc_capital_rare_herb")!.description, /ก้นหุบเขาตัดใจ/);

    choose("กลับไปคุยเรื่องอื่น");
    assert.equal(useWorldStore.getState().currentSceneId, greetingId);
    choose("ถามเรื่องยาสมุนไพร");
    assert.equal(progression(), before, "repeated questions remain read-only");
    Math.random = () => 0; // Would force a fight if goodbye rerolled arrival.
    choose("ขอบคุณหมอ ขอตัวก่อน");
    assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
    assert.equal(useWorldStore.getState().pendingEncounter, null);
    assert.equal(useWorldStore.getState().pendingBattle, null);
    assert.equal(progression(), before, "response goodbye is safe and costs no travel resources");
    useWorldStore.getState().gotoScene(greetingId);
    choose("ลาจาก");
    assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
    assert.equal(useWorldStore.getState().pendingEncounter, null);
    assert.equal(progression(), before, "greeting goodbye is equally safe at zero stamina");
  }
  console.log("PASS Lin herb question: real store shows new authored response, truthful item/shop/mastery facts, unchanged empty/clinic/advanced quest state, repeatable read-only conversation and safe free goodbyes");

  const wu = getNpc("city_capital_magistrate_wu")!;
  const clinic = "qc_capital_clinic_supplies";
  for (const questId of [null, clinic, "qc_capital_royal_pardon"]) {
    Math.random = () => 0.5;
    useWorldStore.getState().startNewGame({ name: "Wu conversation test" });
    useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
    useWorldStore.getState().travelRoute("city_capital");
    if (questId) assert.equal(useWorldStore.getState().acceptQuest(questId).ok, true);
    useWorldStore.getState().gotoScene(wu.dialogSceneId!);
    const initialLines = dialog().lines;
    const deliveryIndex = dialog().choices!.findIndex(choice => choice.text === "ส่งคำขอเสบียงจากหมอหลิน");
    const deliveryGate = dialog().choices![deliveryIndex].visibleIf!;
    assert.equal(evaluateCondition(useWorldStore.getState(), deliveryGate), questId === clinic);
    const offersBefore = wu.questIds!.map(id => isQuestOfferable(useWorldStore.getState(), getQuest(id)!));
    useWorldStore.setState({ stamina: 0 });
    const before = progression();
    choose("รับฟังงานที่นายอำเภอมอบหมาย");
    assert.notEqual(useWorldStore.getState().currentSceneId, wu.dialogSceneId);
    assert.notDeepEqual(dialog().lines, initialLines, "Wu answers with new job information");
    const information = dialog().lines.map(line => line.text).join(" ");
    for (const id of wu.questIds!) assert.ok(information.includes(getQuest(id)!.name));
    assert.ok(information.includes(getItem("old_key")!.name));
    const fightRequirement = getQuest("qc_capital_corrupt_clerk")!.stages[1].autoAdvance!;
    assert.equal(fightRequirement.t, "defeatedOpponent");
    if (fightRequirement.t === "defeatedOpponent") assert.ok(information.includes(`นักเลง ${fightRequirement.count} คน`));
    assert.ok(information.includes("จินหลิง"));
    assert.ok(information.includes(getNpc("city_jinling_strategist_kong")!.name));
    assert.equal(progression(), before, "Wu's overview neither accepts a job nor advances clinic delivery");
    assert.deepEqual(wu.questIds!.map(id => isQuestOfferable(useWorldStore.getState(), getQuest(id)!)), offersBefore);
    choose("กลับไปคุยเรื่องอื่น");
    assert.equal(useWorldStore.getState().currentSceneId, wu.dialogSceneId);
    assert.equal(evaluateCondition(useWorldStore.getState(), deliveryGate), questId === clinic);
    choose("รับฟังงานที่นายอำเภอมอบหมาย");
    Math.random = () => 0;
    choose("ขอบคุณ ข้าขอเตรียมตัวก่อน");
    assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
    assert.equal(useWorldStore.getState().pendingEncounter, null);
    assert.equal(progression(), before);
    useWorldStore.getState().gotoScene(wu.dialogSceneId!);
    choose("กลับไปสำรวจนครหลวง");
    assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
    assert.equal(useWorldStore.getState().pendingEncounter, null);
    assert.equal(progression(), before, "both Wu goodbyes are free and safe at zero stamina");

    if (questId === clinic) {
      Math.random = () => 0.5;
      useWorldStore.getState().gotoScene(wu.dialogSceneId!);
      useWorldStore.getState().makeChoice(deliveryIndex);
      assert.equal(useWorldStore.getState().quests[clinic].stage, 1);
      assert.equal(useWorldStore.getState().quests[clinic].status, "active");
      assert.equal(useWorldStore.getState().flags.clinic_supplies_delivered, true);
      choose("กลับไปรายงานหมอหลิน");
      useWorldStore.getState().gotoScene(wu.dialogSceneId!);
      assert.equal(evaluateCondition(useWorldStore.getState(), deliveryGate), false, "delivery remains one-time after the real gated choice");
      const delivered = progression();
      choose("รับฟังงานที่นายอำเภอมอบหมาย");
      choose("กลับไปคุยเรื่องอื่น");
      assert.equal(progression(), delivered, "later job questions cannot repeat delivery or grant rewards");
    }
  }
  console.log("PASS Wu job question: real informative response and job requirements, unchanged offers/progression, safe free goodbyes, clinic delivery gate preserved before/after one real delivery");
} finally {
  Math.random = random;
}
