import assert from "node:assert/strict";
import { evaluateCondition } from "../lib/world/conditions";
import { LORE_RUMORS } from "../lib/world/data/lore-rumors";
import { regionOf } from "../lib/world/data/regions";
import { generatePlayerEcho, LORE_FLAVOUR_LAST_DAY, maintainRumors, RUMOR_HEARD_DAYS, RUMOR_POOL_HARD_CAP, seedLoreRumors, selectRumorsForScene } from "../lib/world/rumor-engine";
import type { Rumor, WorldStateData } from "../lib/world/types";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
const { setTestWorldTime } = await import("../lib/world/clock");
const saveKey = "wusia-world-v1";
const sharedKey = "wusia-shared-v1";
// The legacy saves below are on day 20: pin the world clock there, so loading
// them shifts no day stamps (save v27 rebases older saves onto the clock).
setTestWorldTime(20, 0);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const snapshot = (): WorldStateData => clone(useWorldStore.getState());
const loreIds = LORE_RUMORS.map(lore => lore.idSuffix.startsWith("lore_") ? lore.idSuffix : `lore_${lore.idSuffix}`);
const inCapital = (state: WorldStateData) => selectRumorsForScene(state, regionOf("city_capital"), "inn", 5);
function assertLore(state: WorldStateData) {
  const lore = state.rumorPool.filter(rumor => loreIds.includes(rumor.id));
  assert.equal(lore.length, LORE_RUMORS.length);
  assert.equal(new Set(lore.map(rumor => rumor.id)).size, LORE_RUMORS.length);
  assert.ok(lore.every(rumor => Number.isSafeInteger(rumor.expiresDay)));
  // Talk of the day: unheard flavour lore fades by LORE_FLAVOUR_LAST_DAY; unheard leads stay.
  const heard = new Set(state.rumorSeenLog.map(entry => entry.rumorId));
  for (const rumor of lore) {
    if (heard.has(rumor.id)) continue;
    if (rumor.leadsTo) assert.ok(rumor.expiresDay > state.day, `${rumor.id}: an unheard lead stays`);
    else assert.equal(rumor.expiresDay, LORE_FLAVOUR_LAST_DAY, `${rumor.id}: flavour lore fades by day ${LORE_FLAVOUR_LAST_DAY}`);
  }
  assert.ok(lore.every(rumor => rumor.source === "lore" && rumor.refersToEvent === null));
}
async function load(state: WorldStateData, version = 21) {
  memory.set(saveKey, JSON.stringify({ state, version }));
  await useWorldStore.persist.rehydrate();
  assert.equal(useWorldStore.persist.hasHydrated(), true);
}

const random = Math.random;
try {
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Rumor integration test" });
  assertLore(useWorldStore.getState());
  assert.deepEqual(useWorldStore.getState().rumorSeenLog, [], "seeding never counts as hearing");
  // Liveness 2.0: the thirty simulated people are seeded on a new game, with no events yet.
  const people = Object.values(useWorldStore.getState().npcExt);
  assert.equal(people.length, 30, "the thirty simulated people are seeded");
  assert.ok(people.every((ext) => ext.eventHistory.length === 0), "static lore does not manufacture NPC events");
  useWorldStore.getState().gotoScene("route_home_player__to__city_capital");
  useWorldStore.getState().travelRoute("city_capital");
  assert.equal(useWorldStore.getState().currentSceneId, "city_capital");
  const capital = snapshot();
  const offered = inCapital(capital);
  // The inn hears inn, market and wilderness talk (CHANNEL_ADMITS); five stories at a time.
  const expected = LORE_RUMORS.filter(lore => lore.region === "heartland" && ["inn", "market", "wilderness"].includes(lore.channel));
  assert.equal(offered.length, Math.min(5, expected.length));
  assert.ok(offered.length >= 3, "the actual capital inn channel has authored stories immediately");
  for (const rumor of offered) assert.ok(expected.some(lore => lore.text === rumor.text));
  const beforeSelection = clone(capital);
  inCapital(capital);
  assert.deepEqual(capital, beforeSelection, "opening the rumor popup is read-only");
  console.log(`PASS new game: real travel reaches capital with ${offered.length} eligible authored rumors and no fabricated events`);

  // Current-version saves bypass migrate; exercise real persist rehydrate,
  // with both an active generated rumor and independently archived history.
  const legacy = clone(capital);
  legacy.rumorPool = [];
  legacy.day = 20;
  const dynamicId = generatePlayerEcho({ state: legacy, actionId: "sect_join" });
  assert.ok(dynamicId);
  legacy.rumorArchive = [{ id: "old_heard_news", about: "shaolin", truth: "true", expiredDay: 18 }];
  legacy.rumorSeenLog = [
    { rumorId: dynamicId, dayHeard: 20, location: "city_capital" },
    { rumorId: "old_heard_news", dayHeard: 16, location: "city_capital" },
    { rumorId: offered[0].id, dayHeard: 19, location: "city_capital" },
  ];
  for (const version of [18, 19]) {
    await load(legacy, version);
    const restored = snapshot();
    assertLore(restored);
    assert.deepEqual(restored.rumorPool.filter(rumor => rumor.source !== "lore"), legacy.rumorPool);
    assert.deepEqual(restored.rumorArchive, legacy.rumorArchive);
    assert.deepEqual(restored.rumorSeenLog, legacy.rumorSeenLog);
    assert.deepEqual(restored.npcExt, legacy.npcExt);
    assert.deepEqual(restored.flags, legacy.flags);
    assert.deepEqual(restored.quests, legacy.quests);
    assert.equal(evaluateCondition(restored, { t: "heardRumorAbout", target: "shaolin" }), true);
    assert.ok(inCapital(restored).some(rumor => rumor.source === "lore"));
  }
  const unheard = inCapital(useWorldStore.getState())[0];
  assert.equal(evaluateCondition(useWorldStore.getState(), { t: "heardRumor", rumorId: unheard.id }), false);
  useWorldStore.getState().recordRumorHeard(unheard.id);
  const heard = snapshot();
  assert.equal(evaluateCondition(heard, { t: "heardRumor", rumorId: unheard.id }), true);
  assert.equal(heard.rumorSeenLog.length, legacy.rumorSeenLog.length + 1);
  assert.ok(heard.rumorPool.find(rumor => rumor.id === unheard.id)!.expiresDay <= heard.day + RUMOR_HEARD_DAYS, "heard news fades within RUMOR_HEARD_DAYS");
  assert.notEqual(inCapital(heard)[0].id, unheard.id, "remaining unseen stories sort ahead of heard stories");
  useWorldStore.getState().recordRumorHeard(unheard.id);
  assert.deepEqual(useWorldStore.getState().rumorSeenLog, heard.rumorSeenLog, "repeated hearing is idempotent");
  const saved = JSON.parse(memory.get(saveKey)!) as { version: number; state: WorldStateData };
  assert.equal(saved.version, 27);
  assert.equal((saved.state as Partial<WorldStateData>).rumorPool, undefined, "rumors are the world's, not the save's");
  assertLore({ ...saved.state, ...(JSON.parse(memory.get(sharedKey)!) as { world: Partial<WorldStateData> }).world } as WorldStateData);
  for (let i = 0; i < 2; i++) {
    await useWorldStore.persist.rehydrate();
    assert.deepEqual(useWorldStore.getState().rumorPool, heard.rumorPool);
    assert.deepEqual(useWorldStore.getState().rumorSeenLog, heard.rumorSeenLog);
    assert.deepEqual(useWorldStore.getState().rumorArchive, heard.rumorArchive);
  }
  console.log("PASS v18/v19 real hydration and hear/reload: stable IDs, finite expiry, one lore copy, dynamic news and heard/archive history preserved");

  const brokenDeadline = clone(heard);
  const oldLore = brokenDeadline.rumorPool.find(rumor => rumor.id === offered[0].id)!;
  oldLore.expiresDay = Infinity;
  assert.equal(clone(oldLore).expiresDay, null, "fixture reproduces Infinity-to-null serialization");
  await load(brokenDeadline);
  assertLore(useWorldStore.getState());
  assert.deepEqual(useWorldStore.getState().rumorSeenLog, heard.rumorSeenLog);
  assert.deepEqual(useWorldStore.getState().rumorArchive, heard.rumorArchive);
  console.log("PASS persisted null lore deadline repairs without replacing heard history");

  // Stress ordinary maintenance: old evergreen lore survives soft eviction,
  // while generated news still obeys expiry/archive and the 500-entry cap.
  const crowded = clone(capital);
  const dynamic = legacy.rumorPool[0];
  crowded.day = 100;
  crowded.rumorPool.push(...Array.from({ length: 600 }, (_, i): Rumor => ({
    ...dynamic, id: `news_${i}`, createdDay: 100, expiresDay: 130,
  })));
  crowded.rumorPool.push({ ...dynamic, id: "expired_news", expiresDay: 99 });
  maintainRumors(crowded, 100);
  assertLore(crowded);
  assert.equal(crowded.rumorPool.length, RUMOR_POOL_HARD_CAP);
  assert.ok(crowded.rumorArchive.some(rumor => rumor.id === "expired_news"));
  maintainRumors(crowded, 1000);
  crowded.day = 1000;
  assertLore(crowded);
  assert.equal(crowded.rumorPool.length, LORE_RUMORS.length);
  // Long after the start, the flavour lore has faded: only unheard leads can still be heard.
  assert.ok(selectRumorsForScene(crowded, "heartland", "inn", 50).every(rumor => rumor.source !== "lore" || rumor.leadsTo));
  const seeded = clone(crowded);
  seedLoreRumors(crowded);
  assert.deepEqual(crowded, seeded, "repeat seeding does not change history or IDs");
  console.log("PASS maintenance: lore is never evicted but flavour lore fades; generated news expires and hard cap remains enforced");

  // The same selector handles authored lore and generated news. A lore
  // prerequisite must not become optional just because its source is static.
  const gated = clone(capital);
  const base = offered.find(rumor => rumor.channel === "inn")!;
  gated.rumorPool = [
    { ...base, id: "locked_lore", weight: 100, prerequisites: [{ t: "flag", flag: "test_secret_known" }] },
    { ...base, id: "east_lore", region: "east" },
    { ...base, id: "internal_lore", channel: "sect_internal" },
    { ...base, id: "expired_lore", expiresDay: gated.day },
    { ...base, id: "public_lore" },
    { ...base, id: "global_market", region: "global", channel: "market" },
  ];
  assert.deepEqual(inCapital(gated).map(rumor => rumor.id), ["public_lore", "global_market"]);
  gated.flags.test_secret_known = true;
  assert.equal(inCapital(gated)[0].id, "locked_lore");
  assert.deepEqual(selectRumorsForScene(gated, "heartland", "sect_internal", 5).map(rumor => rumor.id), ["internal_lore"]);
  assert.deepEqual(selectRumorsForScene(gated, "heartland", "wilderness", 5), []);
  console.log("PASS selection: region, admitted channel, expiry, secret prerequisites and unseen-first rules remain intact");
} finally {
  Math.random = random;
}
