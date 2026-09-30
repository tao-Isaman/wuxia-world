import assert from "node:assert/strict";
import { JAIL_BRIBE_GOLD, jailCityFor, jailDays, lawChance, pickLawPursuer, isLawOpponent, LAW_OPPONENTS } from "../lib/world/law";
import { applyEffect, rollWalkEvent } from "../lib/world/effects";
import { getOpponent, getScene } from "../lib/world";
import { useWorldStore } from "../store/world-store";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
const withRandom = (value: number, run: () => void) => { const r = Math.random; Math.random = () => value; try { run(); } finally { Math.random = r; } };

function freshState() {
  useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  return JSON.parse(JSON.stringify(useWorldStore.getState())) as ReturnType<typeof useWorldStore.getState>;
}

check("law pursuers and jail cities exist", () => {
  for (const id of LAW_OPPONENTS) { assert.ok(getOpponent(id), id); assert.ok(isLawOpponent(id)); }
  for (const id of ["jail_cell", "jail_released", "jail_bribed"]) assert.equal(getScene(id)?.kind, "dialog", id);
  for (const place of ["city_capital", "sect_wudang", "route_home_player__to__city_capital", "village_noname", null]) {
    assert.equal(getScene(jailCityFor(place))?.kind, "location", `jail city for ${place}`);
  }
  assert.equal(jailCityFor("city_dali"), "city_dali");
});

check("more marks: more pursuit, tougher pursuers, longer sentences", () => {
  assert.equal(lawChance(0), 0);
  for (let m = 1; m < 5; m++) assert.ok(lawChance(m + 1) > lawChance(m));
  assert.equal(pickLawPursuer(1, 0.99), "law_constable");
  const heavy = new Set(Array.from({ length: 50 }, (_, i) => pickLawPursuer(5, i / 50)));
  assert.ok(heavy.has("law_imperial_guard") && heavy.has("law_bounty_hunter"));
  assert.equal(jailDays(1), 2);
  assert.equal(jailDays(5), 10);
});

check("a wanted player's walk tick can bring the law; losing routes to jail", () => {
  const state = freshState();
  state.currentSceneId = "city_capital";
  state.wanted = 4;
  withRandom(0.01, () => rollWalkEvent(state, 0.4));
  assert.ok(state.pendingEncounter && isLawOpponent(state.pendingEncounter.opponentId));
  assert.equal(state.jailCityId, "city_capital");
  const clean = freshState();
  clean.currentSceneId = "city_capital";
  withRandom(0.999, () => rollWalkEvent(clean, 0.4));
  assert.equal(clean.pendingEncounter, null, "no event on a high roll");
});

check("serving time clears the marks and releases into the jail's city", () => {
  const state = freshState();
  state.wanted = 3; state.jailCityId = "city_suzhou"; const day = state.day;
  state.currentHp = 1;
  applyEffect(state, { t: "serveJail" });
  assert.equal(state.day, day + 6);
  assert.equal(state.wanted, 0);
  assert.equal(state.lastLocationId, "city_suzhou");
  assert.equal(state.jailCityId, null);
  assert.ok(state.currentHp > 1);
});

check("a bribe costs gold and lifts two marks", () => {
  const state = freshState();
  state.wanted = 3; state.gold = JAIL_BRIBE_GOLD + 5; state.jailCityId = "city_capital";
  applyEffect(state, { t: "bribeJail" });
  assert.equal(state.gold, 5);
  assert.equal(state.wanted, 1);
  assert.equal(state.lastLocationId, "city_capital");
});

check("a failed theft adds a wanted mark; home is safe from walk events", () => {
  const store = useWorldStore.getState();
  store.startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  const thief = [...(require("../lib/world").NPCS as { id: string; stealLoot?: unknown[] }[])].find((npc) => npc.stealLoot?.length);
  assert.ok(thief, "a stealable NPC exists");
  withRandom(0.999, () => useWorldStore.getState().attemptSteal(thief!.id));
  assert.equal(useWorldStore.getState().wanted, 1);
  useWorldStore.setState({ pendingBattle: null, currentSceneId: "home_player", wanted: 5 });
  withRandom(0, () => useWorldStore.getState().walkTick());
  assert.equal(useWorldStore.getState().pendingEncounter, null);
});

console.log(`${checks} law checks passed`);
