import assert from "node:assert/strict";
import { BATTLE_BACKGROUNDS, resolveBattleBackground } from "../lib/stage/battle-background";
import { CAPITAL_TRAINING_OPPONENT_ID, CAPITAL_TRAINING_SCENE_ID } from "../lib/world/data/capital-training";
import type { PendingBattle } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const capitalBattle: PendingBattle = { opponentId: "thug", onWin: "city_capital", onLose: "city_capital" };
const capital = { mode: "world" as const, currentSceneId: "city_capital", lastLocationId: "city_capital", pendingBattle: capitalBattle };
const training = { ...capital, pendingBattle: { ...capitalBattle, opponentId: CAPITAL_TRAINING_OPPONENT_ID } };

assert.equal(resolveBattleBackground(capital).id, "capital-street");
assert.equal(resolveBattleBackground(training).id, "capital-training", "the fixed duel takes priority over general city context");
assert.equal(resolveBattleBackground({ ...training, mode: "free" }).id, "courtyard", "debug ignores a still-saved world training encounter");
assert.equal(resolveBattleBackground({ ...capital, mode: "free" }).id, "courtyard");
assert.equal(resolveBattleBackground({ ...capital, pendingBattle: null }).id, "courtyard");
assert.equal(resolveBattleBackground({ ...capital, pendingBattle: { ...capitalBattle, opponentId: "training_other_apprentice" } }).id, "capital-street", "no broad training-name heuristic");
for (const override of [
  { currentSceneId: "city_changan" },
  { lastLocationId: "home_player" },
  { lastLocationId: null },
  { currentSceneId: "npc_city_capital_magistrate_wu_talk" },
  { pendingBattle: { ...capitalBattle, onWin: "other_return" } },
  { pendingBattle: { ...capitalBattle, onLose: "other_return" } },
]) {
  assert.equal(resolveBattleBackground({ ...capital, ...override }).id, "courtyard", "ambiguous or conflicting origin keeps the existing fallback");
}
for (const route of ["route_home_player__to__city_capital", "route_city_capital__to__home_player"]) {
  assert.equal(resolveBattleBackground({ ...capital, currentSceneId: route,
    pendingBattle: { ...capitalBattle, onWin: route, onLose: route } }).id, "courtyard", "a road must not display capital street scenery");
}
const untouched = JSON.stringify(capital);
assert.strictEqual(resolveBattleBackground(capital), BATTLE_BACKGROUNDS["capital-street"], "stable metadata avoids restarting the canvas per render");
assert.equal(JSON.stringify(capital), untouched, "resolver is read-only");
assert.equal(BATTLE_BACKGROUNDS.courtyard.image, "/art/jade-courtyard.png");
assert.equal(BATTLE_BACKGROUNDS["capital-training"].image, "/art/battle-capital-training.png");
assert.equal(BATTLE_BACKGROUNDS["capital-street"].image, "/art/battle-capital-street.png");
console.log("PASS pure background routing: exact training ID, exact capital anchors/returns, debug and ambiguous/road origins keep courtyard; immutable stable metadata");

const random = Math.random;
try {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Battle origin test" });
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  assert.equal(useWorldStore.getState().pendingEncounter, null, "the road scene itself has no random arrival roll");
  // Arrival itself never rolls; a foe met while walking in the city does. No saved origin
  // fields are invented or edited. Then accept through the real encounter action.
  Math.random = () => 0;
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().pendingEncounter, null, "arriving is not an encounter roll");
  // Walking spawns a foe on the map; walking into it opens the encounter. Towns send
  // no stray foes, so hunt the main story's hired thieves here.
  useWorldStore.setState((s) => ({ quests: { ...s.quests, st_main_02: { id: "st_main_02", status: "active", stage: 0 } } }));
  useWorldStore.getState().walkTick(() => ({ x: 40, y: 60 }));
  useWorldStore.getState().engageFoe(useWorldStore.getState().roamingFoes[0]!.id);
  const arrival = useWorldStore.getState();
  assert.equal(arrival.currentSceneId, "city_capital");
  assert.equal(arrival.lastLocationId, "city_capital");
  assert.ok(arrival.pendingEncounter);
  assert.equal(arrival.pendingEncounter.returnSceneId, "city_capital");
  useWorldStore.getState().acceptEncounter();
  assert.equal(resolveBattleBackground({ ...useWorldStore.getState(), mode: "world" }).id, "capital-street");
  const saved = JSON.parse(memory.get("wusia-world-v1")!);
  assert.equal(saved.version, 26);
  assert.equal(resolveBattleBackground({ ...saved.state, mode: "world" }).id, "capital-street", "existing serialized world fields retain the honest city origin");
  await useWorldStore.persist.rehydrate();
  assert.equal(resolveBattleBackground({ ...useWorldStore.getState(), mode: "world" }).id, "capital-street");

  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ name: "Training background test" });
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  useWorldStore.getState().travelRoute("city_capital");
  useWorldStore.getState().gotoScene(CAPITAL_TRAINING_SCENE_ID);
  assert.equal(useWorldStore.getState().pendingBattle?.opponentId, CAPITAL_TRAINING_OPPONENT_ID);
  assert.equal(resolveBattleBackground({ ...useWorldStore.getState(), mode: "world" }).id, "capital-training");
  assert.equal(resolveBattleBackground({ ...useWorldStore.getState(), mode: "free" }).id, "courtyard");
  console.log("PASS real world actions/save roundtrip: home→capital encounter is a city arrival, training scene uses its own backdrop, debug remains generic");
} finally {
  Math.random = random;
}
