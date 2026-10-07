import assert from "node:assert/strict";
import { JAIL_BRIBE_GOLD, ambushChance, arrestPenalty, bribeCost, jailCityFor, jailDays, lawChance, pickLawPursuer, isLawOpponent, LAW_OPPONENTS } from "../lib/world/law";
import { applyEffect, rollFoeSpawn, rollWalkEvent } from "../lib/world/effects";
import { FOE_SPAWN } from "../lib/world/data/random-events";
import { getLocationMap, getOpponent, getScene } from "../lib/world";
import { JAIL_HOURS_PER_DAY, sentenceLeft } from "../lib/world/law";
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
  for (const id of ["jail_cell", "jail_bribed", "jail_elder_prisoner_talk", "jail_guard_zhang_talk"]) assert.equal(getScene(id)?.kind, "dialog", id);
  assert.equal(getScene("jail")?.kind, "location");
  assert.ok(getLocationMap("jail"), "the jail has its own map");
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
  assert.equal(jailDays(12), 24, "marks have no ceiling — nor, up to a month, does the sentence");
  assert.equal(jailDays(40), 30);
});

const sequence = (rolls: number[], run: () => void) => {
  const r = Math.random; let i = 0; Math.random = () => rolls[i++] ?? 0.5;
  try { run(); } finally { Math.random = r; }
};

check("the Brocade Guard hunts those who keep slipping the law; at last their commander comes", () => {
  const roll = (marks: number, evasions: number) => new Set(Array.from({ length: 200 }, (_, i) => pickLawPursuer(marks, i / 200, evasions)));
  assert.deepEqual([...roll(1, 0)], ["law_constable"]);
  assert.ok(!roll(3, 0).has("law_jinyiwei_agent"), "no Brocade Guard for a fresh petty record");
  assert.ok(roll(3, 3).has("law_jinyiwei_agent"), "three escapes bring the Brocade Guard");
  assert.ok(roll(5, 6).has("law_jinyiwei_captain"));
  assert.ok(!roll(5, 7).has("chief"));
  assert.ok(roll(6, 10).has("chief"), "a long run brings their commander");
  for (const id of ["law_jinyiwei_agent", "law_jinyiwei_captain"]) assert.ok((getOpponent(id)?.ti ?? 0) >= 3, `${id} is strong`);
  assert.ok(lawChance(3, 8) > lawChance(3, 0), "every escape makes them keener");
  // The commander in person: whoever holds the Brocade Guard's seat, as a law fight.
  const state = freshState();
  state.currentSceneId = "city_capital";
  state.wanted = 8; state.lawEvasions = 30;
  sequence([0, 0.999], () => rollWalkEvent(state, 0.4));
  const id = state.pendingEncounter?.opponentId ?? "";
  assert.ok(id.startsWith("lawnpc@") && isLawOpponent(id), id);
  assert.ok(getOpponent(id)?.name, "the commander resolves to a fighter");
});

check("an upright person nearby may waylay a wanted hero to hand them over — no fleeing; losing is arrest", () => {
  assert.equal(ambushChance(1), 0);
  assert.ok(ambushChance(6) > ambushChance(2));
  const state = freshState();
  state.currentSceneId = "city_capital"; state.lastLocationId = "city_capital";
  state.wanted = 6;
  for (const ext of Object.values(state.npcExt)) ext.currentLocation = "sect_xiaoyao"; // nobody near…
  state.npcExt.wander_sun_yao = { ...state.npcExt.wander_sun_yao, currentLocation: "city_capital", power: 40 }; // …but the healer
  sequence([0.99, 0, 0], () => rollWalkEvent(state, 0.4));
  const pb = state.pendingBattle!;
  assert.equal(pb.ambushNpcId, "wander_sun_yao");
  assert.ok(isLawOpponent(pb.opponentId) && pb.onLose === "jail_cell" && pb.nonFatal);
  assert.equal(state.pendingEncounter, null, "an ambush is a fight at once");
});

check("arrest costs grow with the record: fines, then seizure, then crippled arts; giving oneself up halves it", () => {
  assert.deepEqual(arrestPenalty(1), { days: 2, fine: 50, confiscate: false, cripple: 0 });
  assert.equal(arrestPenalty(5).confiscate, true);
  assert.equal(arrestPenalty(10).cripple, 1);
  assert.equal(arrestPenalty(20).cripple, 3);
  assert.deepEqual(arrestPenalty(10, true), { days: 10, fine: 250, confiscate: false, cripple: 0 });
  const state = freshState();
  state.wanted = 12; state.gold = 1200; state.inventory = { potion: 4, herb: 6 };
  state.skillLevel = { basic_punch: 7 };
  applyEffect(state, { t: "imprison" });
  assert.equal(state.wanted, 0);
  assert.equal(state.gold, Math.ceil((1200 - 600) * 2 / 3), "fine 600, then a third seized");
  assert.equal(state.skillLevel.basic_punch, 5, "the best move loses two levels");
  assert.ok(Object.values(state.inventory).reduce((a, b) => a + b, 0) < 10, "goods seized");
  const report = String(state.flags._arrestReport);
  assert.ok(report.includes("ค่าปรับ") && report.includes("ริบ") && report.includes("ทำลายวรยุทธ"), report);
});

check("มอบตัว: straight to the cells, half the sentence and fine; escapes counted until a sentence clears them", () => {
  const store = useWorldStore.getState();
  store.startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "route_home_player__to__city_capital", lastLocationId: "city_capital", wanted: 0 });
  assert.equal(useWorldStore.getState().surrender().ok, false, "nothing to answer for");
  useWorldStore.setState({ wanted: 6, gold: 500, lawEvasions: 4 });
  assert.equal(useWorldStore.getState().surrender().ok, true);
  const s = useWorldStore.getState();
  assert.equal(s.currentSceneId, "jail");
  assert.equal(s.wanted, 0);
  assert.equal(s.lawEvasions, 0);
  assert.equal(sentenceLeft(s), 6 * JAIL_HOURS_PER_DAY, "12 days halved");
  assert.equal(s.gold, 500 - 150);
  assert.ok(String(s.flags._arrestReport).includes("มอบตัว"));
  assert.equal(useWorldStore.getState().surrender().ok, false, "not twice");
  // Unlimited marks: a failed theft at 5 makes 6.
  useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ wanted: 5 });
  const thief = [...(require("../lib/world").NPCS as { id: string; stealLoot?: unknown[] }[])].find((npc) => npc.stealLoot?.length);
  withRandom(0.999, () => useWorldStore.getState().attemptSteal(thief!.id));
  assert.equal(useWorldStore.getState().wanted, 6);
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
  state.wanted = 3; state.gold = bribeCost(3) + 5; state.jailCityId = "city_capital";
  assert.equal(bribeCost(2), JAIL_BRIBE_GOLD);
  assert.equal(bribeCost(5), JAIL_BRIBE_GOLD + 3 * 150, "the price grows with the record");
  applyEffect(state, { t: "bribeJail" });
  assert.equal(state.gold, 5);
  assert.equal(state.lawEvasions, 1, "a bribe is slipping the law");
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

check("arrest locks the player in the jail map until the sentence is served", () => {
  const store = useWorldStore.getState();
  store.startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "jail_cell", lastLocationId: "city_dali", wanted: 2, jailCityId: "city_dali", stamina: 100 });
  const choice = getScene("jail_cell")!;
  assert.equal(choice.kind, "dialog");
  useWorldStore.getState().makeChoice(0);
  let s = useWorldStore.getState();
  assert.equal(s.currentSceneId, "jail");
  assert.equal(s.wanted, 0, "marks become the sentence");
  assert.equal(sentenceLeft(s), 2 * 2 * JAIL_HOURS_PER_DAY);
  // No way out on foot, and the gate stays shut.
  useWorldStore.getState().gotoScene("city_dali");
  assert.equal(useWorldStore.getState().currentSceneId, "jail");
  assert.equal(useWorldStore.getState().canTravelTo("route_city_dali__to__sect_emei"), false);
  const gate = useWorldStore.getState().doActivity("jail_gate");
  assert.equal(gate.ok, false);
  // Walking in the yard never draws the law or bandits.
  useWorldStore.setState({ wanted: 5 });
  withRandom(0, () => useWorldStore.getState().walkTick());
  assert.equal(useWorldStore.getState().pendingEncounter, null);
  useWorldStore.setState({ wanted: 0 });
  // Labour passes 6 ชั่วยาม and knocks another 6 off.
  const before = sentenceLeft(useWorldStore.getState());
  assert.equal(useWorldStore.getState().doActivity("jail_labor").ok, true);
  s = useWorldStore.getState();
  assert.equal(sentenceLeft(s), before - 12);
  assert.ok(s.statExp.STR > 0);
  // Sitting out the rest releases into the jail's city.
  useWorldStore.getState().serveSentence();
  s = useWorldStore.getState();
  assert.equal(s.jailUntil, null);
  assert.equal(s.currentSceneId, "city_dali");
});

check("dice, meditation and escape: costs, odds and consequences", () => {
  const store = useWorldStore.getState();
  store.startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "jail_cell", lastLocationId: "city_capital", wanted: 1, jailCityId: "city_capital", stamina: 100, gold: 80 });
  useWorldStore.getState().makeChoice(0);
  assert.equal(useWorldStore.getState().gold, 30, "a 50-gold fine for one mark");
  withRandom(0, () => useWorldStore.getState().doActivity("jail_dice"));
  assert.equal(useWorldStore.getState().gold, 40);
  withRandom(0.99, () => useWorldStore.getState().doActivity("jail_dice"));
  assert.equal(useWorldStore.getState().gold, 30);
  useWorldStore.setState({ currentMp: 0 });
  const wExp = useWorldStore.getState().wExp;
  useWorldStore.getState().doActivity("jail_meditate");
  assert.ok(useWorldStore.getState().currentMp > 0);
  assert.equal(useWorldStore.getState().wExp, wExp + 40, "meditation in the cells gives insight (w-exp)");
  const left = sentenceLeft(useWorldStore.getState());
  withRandom(0.99, () => useWorldStore.getState().doActivity("jail_escape"));
  assert.equal(sentenceLeft(useWorldStore.getState()), left - 2 + JAIL_HOURS_PER_DAY, "a failed escape adds a day");
  useWorldStore.setState({ stamina: 100 });
  withRandom(0, () => useWorldStore.getState().doActivity("jail_escape"));
  const s = useWorldStore.getState();
  assert.equal(s.currentSceneId, "city_capital");
  assert.equal(s.jailUntil, null);
  assert.equal(s.wanted, 2, "escaping adds two marks");
});

check("walking spawns foes that wait on the map: roads and wilds only (towns only a quest's quarry), by habitat, at most three; touching one is its encounter", () => {
  // No dice-roll fights any more: a clean walk tick never springs an encounter by itself.
  const clean = freshState();
  clean.currentSceneId = "city_capital";
  withRandom(0, () => rollWalkEvent(clean, 0.4));
  assert.equal(clean.pendingEncounter, null, "only the law and sect hunters still catch up on a roll");
  // Towns, villages, sects and homes send no stray foes; roads and the wilds do (mostly beasts).
  const city = freshState(); city.currentSceneId = "city_capital";
  const wild = freshState(); wild.currentSceneId = "cave_jinshe";
  const road = freshState(); road.currentSceneId = "route_home_player__to__city_capital";
  const kinds = (state: typeof city) => {
    const seen = { human: 0, beast: 0 } as Record<string, number>;
    for (let i = 0; i < 400; i++) {
      const id = rollFoeSpawn(state, 0);
      if (id) seen[getOpponent(id)?.category ?? "human"]++;
    }
    return seen;
  };
  const total = (seen: Record<string, number>) => seen.human + seen.beast;
  for (const id of ["city_capital", "village_qigu", "sect_wudang", "inn_yuelai", "palace_royal"]) {
    const town = freshState(); town.currentSceneId = id;
    assert.equal(total(kinds(town)), 0, `no stray foe in ${id}`);
  }
  const inWild = kinds(wild), onRoad = kinds(road);
  assert.ok(inWild.beast > inWild.human, `wild foes are mostly beasts ${JSON.stringify(inWild)}`);
  assert.ok(Math.abs(total(inWild) / 400 - FOE_SPAWN.chance) < 0.08, `about ${FOE_SPAWN.chance} per tick (${total(inWild) / 400})`);
  assert.ok(total(onRoad) > 0, "roads have foes");
  // A kill quest's quarry still shows up in town (the main story's hired thieves).
  city.quests.st_main_02 = { id: "st_main_02", status: "active", stage: 0 };
  const hunted = kinds(city);
  assert.ok(hunted.human > 0 && hunted.beast === 0, `the quarry comes to town ${JSON.stringify(hunted)}`);
  // A full map spawns nothing.
  let full: string | null = "unset";
  withRandom(0, () => { full = rollFoeSpawn(city, FOE_SPAWN.maxPerMap); });
  assert.equal(full, null);
  // The store keeps foes on their map, needs a spot, and turns contact into the encounter.
  const store = useWorldStore.getState();
  store.startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "cave_jinshe", lastLocationId: "cave_jinshe", roamingFoes: [] });
  withRandom(0, () => useWorldStore.getState().walkTick(() => null));
  assert.equal(useWorldStore.getState().roamingFoes.length, 0, "no free spot, no foe");
  withRandom(0, () => useWorldStore.getState().walkTick());
  assert.equal(useWorldStore.getState().roamingFoes.length, 0, "no spot picker (tests, read-only maps), no foe");
  for (let i = 0; i < 5; i++) withRandom(0, () => useWorldStore.getState().walkTick(() => ({ x: 20 + i * 10, y: 60 })));
  const foes = useWorldStore.getState().roamingFoes;
  assert.equal(foes.length, FOE_SPAWN.maxPerMap, "at most three wait at once");
  assert.ok(foes.every((f) => f.locationId === "cave_jinshe" && getOpponent(f.opponentId)));
  assert.equal(useWorldStore.getState().pendingEncounter, null, "they wait for the hero");
  useWorldStore.getState().engageFoe(foes[1].id);
  assert.equal(useWorldStore.getState().pendingEncounter?.opponentId, foes[1].opponentId);
  assert.equal(useWorldStore.getState().roamingFoes.length, FOE_SPAWN.maxPerMap - 1);
  useWorldStore.getState().fleeEncounter();
  // Leaving: a walk tick elsewhere drops the old map's foes.
  useWorldStore.setState({ currentSceneId: "cave_zhizhu", lastLocationId: "cave_zhizhu" });
  withRandom(0.999, () => useWorldStore.getState().walkTick(() => ({ x: 50, y: 50 })));
  assert.equal(useWorldStore.getState().roamingFoes.length, 0);
  // Safe ground: none at home.
  useWorldStore.setState({ currentSceneId: "home_player", lastLocationId: "home_player" });
  withRandom(0, () => useWorldStore.getState().walkTick(() => ({ x: 50, y: 50 })));
  assert.equal(useWorldStore.getState().roamingFoes.length, 0);
});

console.log(`${checks} law checks passed`);
