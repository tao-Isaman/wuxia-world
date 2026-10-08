import assert from "node:assert/strict";
import { NPCS_SPIES } from "../lib/world/data/npcs/spies";
import { evaluateCondition, getScene } from "../lib/world";
import type { DialogScene } from "../lib/world";
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
const random = Math.random;
const dialog = (id: string): DialogScene => {
  const scene = getScene(id);
  assert.equal(scene?.kind, "dialog", `registered dialog: ${id}`);
  return scene as DialogScene;
};
let previewCount = 0;
try {
  for (const npc of NPCS_SPIES) {
    Math.random = () => 0.5;
    useWorldStore.getState().startNewGame({ newWorld: true, name: "Greeting exit test" });
    const location = npc.locationIds[0];
    useWorldStore.getState().gotoScene(location);
    useWorldStore.getState().gotoScene(npc.dialogSceneId!);
    const greeting = dialog(npc.dialogSceneId!);
    const exitIndex = greeting.choices!.findIndex(choice => {
      if (choice.visibleIf || choice.effects?.length) return false;
      const target = getScene(choice.next);
      return target?.kind === "dialog" && target.onEnter?.length === 1 &&
        target.onEnter[0].t === "goto" && target.onEnter[0].sceneId === location;
    });
    assert.ok(exitIndex >= 0, `${npc.id}: unconditional greeting exit returns to the NPC's actual location`);
    const exit = greeting.choices![exitIndex];
    assert.match(exit.text, /ขอตัวก่อน/);
    // An exhausted player must still be able to end a conversation. A zero
    // random roll would force an encounter if the return reran travel hooks.
    useWorldStore.setState({ stamina: 0 });
    const before = useWorldStore.getState();
    const beforeQuest = JSON.stringify(before.quests);
    const beforeItems = JSON.stringify(before.inventory);
    Math.random = () => 0;
    useWorldStore.getState().makeChoice(exitIndex);
    const after = useWorldStore.getState();
    assert.equal(after.currentSceneId, location);
    assert.equal(after.lastLocationId, location);
    assert.equal(after.pendingEncounter, null, "saying goodbye cannot roll a roadside fight");
    assert.equal(after.pendingBattle, null);
    assert.equal(after.stamina, 0);
    assert.equal(after.day, before.day);
    assert.equal(after.time, before.time);
    assert.equal(after.gold, before.gold);
    assert.equal(after.wExp, before.wExp);
    assert.equal(JSON.stringify(after.quests), beforeQuest, "leave neither accepts nor completes a quest");
    assert.equal(JSON.stringify(after.inventory), beforeItems);

    // Every authored job preview keeps its separate accept/decline choice.
    for (const choice of greeting.choices!.filter(candidate => candidate.next.endsWith("_offer"))) {
      const offer = dialog(choice.next);
      assert.ok(!choice.effects?.some(effect => effect.t === "startQuest"), "hearing the briefing is not acceptance");
      assert.match(choice.text, /ฟังเรื่อง/);
      assert.ok(offer.choices?.some(candidate => candidate.effects?.some(effect => effect.t === "startQuest")));
      assert.ok(offer.choices?.some(candidate => candidate.next === location && !candidate.effects?.length && !candidate.visibleIf), "job preview retains a free decline");
      previewCount++;
    }
    // Exercise a currently visible preview through the real store too.
    Math.random = () => 0.5;
    useWorldStore.getState().gotoScene(npc.dialogSceneId!);
    const previewIndex = greeting.choices!.findIndex(choice => choice.next.endsWith("_offer") &&
      (!choice.visibleIf || evaluateCondition(useWorldStore.getState(), choice.visibleIf)));
    assert.ok(previewIndex >= 0);
    useWorldStore.getState().makeChoice(previewIndex);
    assert.equal(useWorldStore.getState().currentSceneId, greeting.choices![previewIndex].next);
    assert.equal(JSON.stringify(useWorldStore.getState().quests), beforeQuest);
  }
  assert.equal(NPCS_SPIES.length, 5);
  assert.equal(previewCount, 15);
  console.log("PASS all 5 spy greetings have an immediate unconditional exit: correct location, zero travel/time/gold cost, no encounter, unchanged quests/items");
  console.log("PASS all 15 spy job previews remain optional: clear briefing labels, separate accept/decline branches, real preview actions do not accept quests");
} finally {
  Math.random = random;
}
