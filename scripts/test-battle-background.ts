import assert from "node:assert/strict";
import { BATTLE_BACKGROUNDS, resolveBattleBackground } from "../lib/stage/battle-background";
import { CAPITAL_TRAINING_OPPONENT_ID, CAPITAL_TRAINING_SCENE_ID } from "../lib/world/data/capital-training";
import type { PendingBattle } from "../lib/world/types";
import { existsSync } from "node:fs";
import { getLocationMap } from "../lib/world/data/location-maps";
import { getRouteMap } from "../lib/world/data/route-maps";
import { SCENES } from "../lib/world/data/scenes";

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
// Every other place fights over its own painting; a dialog's fight, over the place the talk is held.
const changan = resolveBattleBackground({ ...capital, currentSceneId: "city_changan", lastLocationId: "city_changan" });
assert.equal(changan.id, "place:city_changan");
assert.equal(changan.image, getLocationMap("city_changan")!.image);
assert.equal(resolveBattleBackground({ ...capital, currentSceneId: "npc_city_capital_magistrate_wu_talk" }).id, "capital-street", "a talk in the capital fights in the capital");
assert.equal(resolveBattleBackground({ ...capital, currentSceneId: "npc_some_talk", lastLocationId: "village_taishan" }).id, "place:village_taishan");
assert.equal(resolveBattleBackground({ ...capital, currentSceneId: "no_such_scene", lastLocationId: null }).id, "courtyard", "an unknown place keeps the courtyard");
assert.strictEqual(resolveBattleBackground({ ...capital, currentSceneId: "city_changan" }), changan, "one object per place: the canvas is not rebuilt");
// Roads: the road's own painting, graded for its region.
for (const route of ["route_home_player__to__city_capital", "route_city_capital__to__home_player"]) {
  const road = resolveBattleBackground({ ...capital, currentSceneId: route, pendingBattle: { ...capitalBattle, onWin: route, onLose: route } });
  assert.equal(road.id, `road:${route}`, "a road fights over the road, not the capital street");
  assert.equal(road.image, getRouteMap(route)!.image);
}
let painted = 0;
for (const scene of SCENES) {
  if (scene.kind !== "location" || !getLocationMap(scene.id)) continue;
  const bg = resolveBattleBackground({ ...capital, currentSceneId: scene.id, lastLocationId: scene.id });
  assert.ok(bg.id === "capital-street" || bg.id === `place:${scene.id}`, scene.id);
  assert.ok(existsSync(`public${bg.image}`), `${scene.id}: ${bg.image}`);
  painted++;
}
assert.ok(painted >= 90, `${painted} painted places`);
const untouched = JSON.stringify(capital);
assert.strictEqual(resolveBattleBackground(capital), BATTLE_BACKGROUNDS["capital-street"], "stable metadata avoids restarting the canvas per render");
assert.equal(JSON.stringify(capital), untouched, "resolver is read-only");
assert.equal(BATTLE_BACKGROUNDS.courtyard.image, "/art/jade-courtyard.png");
assert.equal(BATTLE_BACKGROUNDS["capital-training"].image, "/art/battle-capital-training.png");
assert.equal(BATTLE_BACKGROUNDS["capital-street"].image, "/art/battle-capital-street.png");
console.log("PASS pure background routing: the training yard, the capital street, every painted place and road its own painting, debug and unknown places the courtyard; stable metadata");

const random = Math.random;
try {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Battle origin test" });
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
  assert.equal(saved.version, 30);
  assert.equal(resolveBattleBackground({ ...saved.state, mode: "world" }).id, "capital-street", "existing serialized world fields retain the honest city origin");
  await useWorldStore.persist.rehydrate();
  assert.equal(resolveBattleBackground({ ...useWorldStore.getState(), mode: "world" }).id, "capital-street");

  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Training background test" });
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
