import assert from "node:assert/strict";
import { stepTowards, clearMapPositions, getMapPosition, rememberMapPosition } from "../lib/stage/types";
import type { RouteScene } from "../lib/world/types";
import { makeContext, makeInitialState, resolveSkill } from "../lib/game/battle";
import { checkWin } from "../lib/game/effects";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useBattleStore, isPlayerTurn } = await import("../store/battle-store");
const { useWorldStore } = await import("../store/world-store");
const { SCENES_BY_ID } = await import("../lib/world/data/scenes");

// Stores run in memory here; browser persistence is covered by Playwright.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args);
};
let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log("PASS " + name); }

check("movement has constant diagonal speed and stops at its destination", () => {
  assert.deepEqual(stepTowards({ x: 0, y: 0 }, { x: 3, y: 4 }, 2.5), { x: 1.5, y: 2 });
  assert.deepEqual(stepTowards({ x: 0, y: 0 }, { x: 3, y: 4 }, 9), { x: 3, y: 4 });
});
check("session map positions clear for a new character", () => {
  rememberMapPosition("test", { x: 40, y: 50 });
  assert.deepEqual(getMapPosition("test", { x: 1, y: 2 }), { x: 40, y: 50 });
  clearMapPositions();
  assert.deepEqual(getMapPosition("test", { x: 1, y: 2 }), { x: 1, y: 2 });
});

useWorldStore.getState().startNewGame({ name: "Runtime test" });
const build = useWorldStore.getState().playerBuild!;
check("player names remain literal text in attack and victory logs", () => {
  const named = { ...build, name: '<img src=x onerror="alert(1)">' };
  const context = makeContext(named, build);
  const state = makeInitialState(named, build);
  resolveSkill(state, "A", 0, "punch", context);
  state.hB = 0;
  checkWin(state, context.names);
  assert.ok(state.log.some((entry) => entry.txt.includes("&lt;img")));
  assert.ok(state.log.every((entry) => !entry.txt.includes("<img")));
  assert.equal(context.names.A, named.name);
});
check("enemy turns wait for step(), and a reset clears the battle", () => {
  useBattleStore.getState().start(build, { ...build, stats: { ...build.stats, AGI: 40 } });
  assert.equal(useBattleStore.getState().state!.turn, 0, "nothing happens until the renderer steps");
  useBattleStore.getState().step();
  const first = useBattleStore.getState().state!;
  assert.ok(first.activeId !== null || first.events.length > 0, "one step begins the fast enemy's turn");
  useBattleStore.getState().reset();
  assert.equal(useBattleStore.getState().state, null);
});
check("a waiting player turn cannot be skipped by stepping", () => {
  useBattleStore.getState().start({ ...build, stats: { ...build.stats, AGI: 40 } }, build);
  useBattleStore.getState().stepAll();
  const waiting = useBattleStore.getState().state!;
  assert.equal(isPlayerTurn(waiting, false), true);
  for (let i = 0; i < 10; i++) useBattleStore.getState().step();
  assert.equal(useBattleStore.getState().state, waiting);
  useBattleStore.getState().reset();
});

const route: RouteScene = { id: "__runtime_route", kind: "route", label: "Test route", destinations: [
  { locationId: "__runtime_location", label: "Test destination", effects: [{ t: "addTrait", trait: "good", amount: 7 }, { t: "addGold", amount: 13 }] },
] };
check("non-fatal defeat leaves one HP and a recoverable world; fatal defeat still ends the game", () => {
  for (const nonFatal of [true, false]) {
    useWorldStore.getState().startNewGame({ name: "Defeat test" });
    useWorldStore.setState({ pendingBattle: { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal } });
    useBattleStore.getState().start(build, build);
    useBattleStore.setState({ state: { ...useBattleStore.getState().state!, hA: 0, winner: "B", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    assert.equal(useWorldStore.getState().currentHp, nonFatal ? 1 : 0);
    assert.equal(useWorldStore.getState().gameOver, !nonFatal);
    assert.equal(useWorldStore.getState().pendingBattle, null);
    assert.equal(useWorldStore.getState().stamina, 95);
  }
  useWorldStore.getState().startNewGame({ name: "Runtime test" });
});
SCENES_BY_ID.set(route.id, route);
SCENES_BY_ID.set("__runtime_location", { id: "__runtime_location", kind: "location", name: "Test", description: "", npcs: [], routes: [] });
check("route effects and travel cost are committed together", () => {
  useWorldStore.setState({ currentSceneId: route.id, stamina: 100, gold: 0, traits: { ...useWorldStore.getState().traits, good: 0 } });
  useWorldStore.getState().travelRoute("__runtime_location");
  const state = useWorldStore.getState();
  assert.equal(state.currentSceneId, "__runtime_location");
  assert.equal(state.stamina, 90);
  assert.equal(state.gold, 13);
  assert.equal(state.traits.good, 7);
});
check("unaffordable, hidden and unknown route destinations have no effects", () => {
  useWorldStore.setState({ currentSceneId: route.id, stamina: 0, gold: 0 });
  useWorldStore.getState().travelRoute("__runtime_location");
  assert.equal(useWorldStore.getState().gold, 0);
  assert.equal(useWorldStore.getState().currentSceneId, route.id);
  useWorldStore.setState({ stamina: 100 });
  route.destinations[0].visibleIf = { t: "flag", flag: "__never_true", equals: true };
  useWorldStore.getState().travelRoute("__runtime_location");
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().currentSceneId, route.id);
  assert.equal(useWorldStore.getState().gold, 0);
});
check("Three.js runtime objects never enter the version 21 save", () => {
  const options = useWorldStore.persist.getOptions();
  assert.equal(options.version, 21);
  const saved = options.partialize!(useWorldStore.getState());
  assert.equal(JSON.stringify(saved).includes("enemyElapsedMs"), false);
  assert.equal("travelRoute" in saved, false);
});
SCENES_BY_ID.delete(route.id);
SCENES_BY_ID.delete("__runtime_location");
console.warn = originalWarn;
console.log(checks + " runtime regression checks passed.");
