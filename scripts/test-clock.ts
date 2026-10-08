// The world clock and the shared world (docs/design/world-clock-and-shared-world.md):
// clock maths, syncClock (time, regeneration, wanted decay, the away line),
// instant actions' stamina prices, the seeded NPC week, WorldEvents, the save
// split and its WorldService, and the v27 rebase of older saves.
import assert from "node:assert/strict";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (!String(args[0]).includes("zustand persist middleware")) originalWarn(...args);
};

const clock = await import("../lib/world/clock");
const { HOURS_PER_DAY, MS_PER_DAY, MS_PER_HOUR, WORLD_EPOCH_MS, advanceTestClock, formatWait, msAtWorld, setTestClock, setTestWorldTime, worldNow, worldTimeAt } = clock;
const { useWorldStore } = await import("../store/world-store");
const { syncClock, staminaForHours, STAMINA_REFILL_HOURS, VITALS_REFILL_HOURS } = await import("../store/world/lifecycle");
const { partializeSave, migrateSave, mergeSave, takeCarriedWorldKeys } = await import("../store/world/persist");
const { SHARED_WORLD_KEY, attachSharedWorld, joinSharedWorld, localWorldService } = await import("../store/world/shared-local");
const { SHARED_WORLD_KEYS, sameWorld, sharedSlice } = await import("../lib/world/shared/world");
const { WORLD_EVENT_LOG_MAX, applyWorldEvent, emitWorldEvent, recordWorldEvent } = await import("../lib/world/shared/events");
const { hashSeed, seededRng } = await import("../lib/world/shared/rng");
const { rebaseDays } = await import("../lib/world/shared/rebase");
const { tickAllNamedNpcs } = await import("../lib/world/npc-tick");
const { npcPresent } = await import("../lib/world/npc-presence");
const { WANTED_DECAY_DAYS, JAIL_MAX_HOURS } = await import("../lib/world/law");
const { deriveAll } = await import("../lib/game");
const { createStore } = await import("zustand/vanilla");
type WorldStateData = import("../lib/world/types").WorldStateData;
type SharedWorld = import("../lib/world/shared/world").SharedWorld;

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  } finally {
    setTestClock(null);
  }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const store = () => useWorldStore.getState();
function newGame(day = 10, time = 0): WorldStateData {
  setTestWorldTime(day, time);
  store().startNewGame({ name: "Clock test", newWorld: true });
  return clone(store()) as WorldStateData;
}

// ─── The clock ─────────────────────────────────────────────────────────
check("clock: one game day is one real hour, one ชั่วยาม five real minutes, day 1 at the epoch", () => {
  assert.equal(HOURS_PER_DAY, 12);
  assert.equal(MS_PER_DAY, 60 * 60 * 1000);
  assert.equal(MS_PER_HOUR, 5 * 60 * 1000);
  assert.deepEqual(worldTimeAt(WORLD_EPOCH_MS), { day: 1, time: 0 });
  assert.deepEqual(worldTimeAt(WORLD_EPOCH_MS + MS_PER_DAY), { day: 2, time: 0 });
  assert.equal(worldTimeAt(WORLD_EPOCH_MS + 3 * MS_PER_HOUR).day, 1);
  assert.ok(Math.abs(worldTimeAt(WORLD_EPOCH_MS + 3 * MS_PER_HOUR).time - 3) < 1e-9);
  assert.equal(worldTimeAt(WORLD_EPOCH_MS - 1).day, 0, "before the epoch: day 0");
  for (const [day, time] of [[1, 0], [7, 5.5], [400, 11.75]]) {
    const t = worldTimeAt(msAtWorld(day, time));
    assert.equal(t.day, day);
    assert.ok(Math.abs(t.time - time) < 1e-9);
  }
  const near = (t: { day: number; time: number }, day: number, time: number) =>
    assert.ok(t.day === day && Math.abs(t.time - time) < 1e-9, JSON.stringify(t));
  setTestWorldTime(33, 4);
  near(worldNow(), 33, 4);
  advanceTestClock(12);
  near(worldNow(), 34, 4);
  setTestClock(null);
  assert.ok(Math.abs(clock.now() - Date.now()) < 1000, "follows real time again");
});

check("clock: waits read in real time", () => {
  assert.equal(formatWait(5, 5), "");
  assert.equal(formatWait(5, 4), "");
  assert.equal(formatWait(5, 5 + 2 / HOURS_PER_DAY), "อีก 10 นาที");
  assert.equal(formatWait(5, 7.5), "อีก 2 ชั่วโมง 30 นาที");
  assert.equal(formatWait(5, 5 + 26), "อีก 1 วัน 2 ชั่วโมง");
});

// ─── syncClock ─────────────────────────────────────────────────────────
check("syncClock: day and time follow the clock, never back; no game, no upkeep", () => {
  const s = newGame(10, 2);
  syncClock(s, msAtWorld(10, 5));
  assert.equal(s.day, 10);
  assert.ok(Math.abs(s.time - 5) < 1e-9);
  syncClock(s, msAtWorld(9, 0));
  assert.equal(s.day, 10, "time never goes back");
  syncClock(s, msAtWorld(12, 1));
  assert.equal(s.day, 12);
  const idle = { ...clone(s), hasGame: false, stamina: 0 };
  syncClock(idle, msAtWorld(13, 0));
  assert.equal(idle.day, 13, "the time moves without a game");
  assert.equal(idle.stamina, 0, "but nothing regenerates");
});

check("syncClock: stamina refills in STAMINA_REFILL_HOURS, HP / MP in VITALS_REFILL_HOURS; fractions carry over", () => {
  const s = newGame(10, 0);
  const max = deriveAll(s.playerBuild!);
  s.stamina = 0; s.currentHp = 1; s.currentMp = 0;
  syncClock(s, msAtWorld(10, STAMINA_REFILL_HOURS / 2));
  assert.equal(s.stamina, Math.floor(s.staminaMax / 2), "half the stamina in half the time");
  // Many small syncs add up to the same as one long one.
  for (let i = 1; i <= 60; i++) syncClock(s, msAtWorld(10, STAMINA_REFILL_HOURS / 2 + (i * STAMINA_REFILL_HOURS) / 120));
  assert.equal(s.stamina, s.staminaMax, "full after STAMINA_REFILL_HOURS");
  assert.ok(s.currentHp < max.HP && s.currentHp >= Math.floor(max.HP / 2), `HP ${s.currentHp}/${max.HP} after half of VITALS_REFILL_HOURS`);
  syncClock(s, msAtWorld(10 + VITALS_REFILL_HOURS / HOURS_PER_DAY, 0));
  assert.equal(s.currentHp, max.HP);
  assert.equal(s.currentMp, max.MP);
  // Not in the middle of a fight.
  s.currentHp = 1; s.pendingBattle = { opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital" } as never;
  syncClock(s, msAtWorld(12, 0));
  assert.equal(s.currentHp, 1);
});

check("syncClock: wanted marks fade one per WANTED_DECAY_DAYS quiet days", () => {
  const s = newGame(10, 0);
  s.wanted = 3; s.wantedDay = 10;
  syncClock(s, msAtWorld(10 + WANTED_DECAY_DAYS * 2, 1));
  assert.equal(s.wanted, 1);
});

check("syncClock: back after a day or more away, the log says how long", () => {
  const s = newGame(10, 0);
  syncClock(s, msAtWorld(10, 11));
  assert.ok(!s.actionLog.some((e) => e.kind === "time"), "not for a few ชั่วยาม");
  syncClock(s, msAtWorld(14, 0));
  const line = s.actionLog.at(-1)!;
  assert.equal(line.kind, "time");
  assert.ok(line.message.includes("ผ่านไป 3 วัน"), line.message);
  // Through the store, the count comes back for the toast.
  newGame(10, 0);
  setTestWorldTime(12, 6);
  assert.equal(store().syncClock(), 2);
  assert.equal(store().syncClock(), 0, "nothing more until the clock moves");
});

check("actions take no time: a draft is brought to the clock, and instant actions cost stamina", () => {
  newGame(20, 3);
  setTestWorldTime(20, 7);
  assert.equal(store().rest("route").ok, true);
  assert.equal(store().day, 20);
  assert.ok(Math.abs(store().time - 7) < 1e-9, "the next action lands on the world clock");
  assert.equal(staminaForHours(0.2), 2);
  assert.equal(staminaForHours(1), 5);
  assert.equal(staminaForHours(6), 30);
});

check("a new hero starts on the world's day and joins its world; newWorld starts a fresh one", () => {
  const first = newGame(50, 2);
  assert.equal(first.day, 50);
  assert.equal(first.lastNpcTickDay, 50, "a new world's first week starts now");
  assert.ok(first.worldSeed > 0);
  assert.equal(Object.keys(first.npcExt).length >= 30, true);
  const victim = "sect_emei_abbess_jingchan";
  const draft = clone(store()) as WorldStateData;
  emitWorldEvent(draft, { t: "npc_killed", npcId: victim, byPlayer: "Clock test", day: draft.day, locationId: "sect_emei" });
  useWorldStore.setState(sharedSlice(draft));
  setTestWorldTime(51, 0);
  store().startNewGame({ name: "Second hero" });
  assert.equal(store().worldSeed, first.worldSeed, "same world");
  assert.equal(npcPresent(store(), victim), false, "the dead stay dead for the next hero");
  assert.equal(store().playerBuild!.name, "Second hero");
  store().resetGame();
  assert.equal(store().hasGame, false);
  assert.equal(store().worldSeed, first.worldSeed, "a reset keeps the world");
  store().startNewGame({ name: "Third", newWorld: true });
  assert.notEqual(store().worldSeed, 0);
  assert.equal(npcPresent(store(), victim), true, "a new world: everyone alive");
});

// ─── The seeded week ───────────────────────────────────────────────────
check("the NPC week is seeded: the same world gives the same weeks on any machine", () => {
  assert.equal(hashSeed(7, 3), hashSeed(7, 3));
  assert.notEqual(hashSeed(7, 3), hashSeed(7, 4));
  const a = seededRng(42, 8), b = seededRng(42, 8);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  const base = newGame(1, 0);
  const run = (seed: number) => {
    const s = clone(base);
    for (let day = 8; day <= 1 + 7 * 30; day += 7) {
      s.day = day;
      tickAllNamedNpcs(s, { currentDay: day, seed });
    }
    return JSON.stringify(Object.entries(s.npcExt).map(([id, e]) => [id, e.status, e.age, e.currentLocation, e.power, e.sect ?? null]).sort());
  };
  assert.equal(run(1234), run(1234), "same seed, same thirty weeks");
  assert.notEqual(run(1234), run(98765), "another world, another story");
});

// ─── World events ──────────────────────────────────────────────────────
check("WorldEvents: one reducer for kills, kidnaps, fallen beasts and news; the log is capped", () => {
  const s = newGame(30, 0);
  const victim = "sect_emei_abbess_jingchan";
  applyWorldEvent(s, { t: "npc_killed", npcId: victim, byPlayer: "x", day: 30, locationId: "sect_emei" });
  assert.equal(npcPresent(s, victim), false);
  assert.ok(s.assassinatedNpcIds.includes(victim));
  applyWorldEvent(s, { t: "npc_kidnapped", npcId: "wander_sun_yao", byPlayer: "x", day: 30, until: 210 });
  assert.ok(s.kidnappedNpcIds.includes("wander_sun_yao"));
  assert.equal(s.kidnappedUntil.wander_sun_yao, 210);
  applyWorldEvent(s, { t: "boss_slain", bossId: "boss_flame_bull", byPlayer: "x", day: 30 });
  assert.equal(s.bossDefeatedDay.boss_flame_bull, 30);
  const rumor = { ...s.rumorPool[0], id: "ev_test_rumor" };
  const before = s.rumorPool.length;
  applyWorldEvent(s, { t: "rumor", rumor });
  applyWorldEvent(s, { t: "rumor", rumor });
  assert.equal(s.rumorPool.length, before + 1, "the same news once");
  const ev = { t: "boss_slain" as const, bossId: "boss_flame_bull", byPlayer: "x", day: 31 };
  for (let i = 0; i < WORLD_EVENT_LOG_MAX + 5; i++) recordWorldEvent(s, ev);
  assert.equal(s.worldEventLog.length, WORLD_EVENT_LOG_MAX);
});

check("WorldEvents: the store's actions go through them (a fallen beast, a killing)", () => {
  newGame(40, 0);
  const draft = clone(store()) as WorldStateData;
  emitWorldEvent(draft, { t: "boss_slain", bossId: "boss_blade_crab", byPlayer: "Clock test", day: 40 });
  assert.deepEqual(draft.worldEventLog.at(-1), { t: "boss_slain", bossId: "boss_blade_crab", byPlayer: "Clock test", day: 40 });
  assert.equal(draft.bossDefeatedDay.boss_blade_crab, 40);
});

// ─── The save split ────────────────────────────────────────────────────
check("the save holds the player only; the shared world has its own key", () => {
  newGame(60, 0);
  const saved = partializeSave(store());
  for (const key of SHARED_WORLD_KEYS) assert.ok(!(key in saved), `${key} is not in the player's save`);
  assert.ok("playerBuild" in saved && "day" in saved && "rumorSeenLog" in saved);
  const world = JSON.parse(memory.get(SHARED_WORLD_KEY)!) as { version: number; world: SharedWorld };
  assert.equal(world.version, 1);
  for (const key of SHARED_WORLD_KEYS) assert.ok(key in world.world, `${key} is in the shared world`);
  assert.equal(world.world.worldSeed, store().worldSeed);
  // Changing the world writes it back.
  const draft = clone(store()) as WorldStateData;
  emitWorldEvent(draft, { t: "boss_slain", bossId: "boss_sun_turtle", byPlayer: "x", day: 60 });
  useWorldStore.setState(sharedSlice(draft));
  assert.equal((JSON.parse(memory.get(SHARED_WORLD_KEY)!) as { world: SharedWorld }).world.bossDefeatedDay.boss_sun_turtle, 60);
  assert.equal(localWorldService.load()?.bossDefeatedDay.boss_sun_turtle, 60);
});

check("attachSharedWorld: the stored world joins the loaded save; a save's own world fields win", () => {
  const base = newGame(70, 0);
  const memoryService = (world: SharedWorld | null) => {
    let kept = world;
    return { load: () => kept, save: (w: SharedWorld) => { kept = clone(w); }, get: () => kept };
  };
  // A stored world replaces what the state had.
  const stored = sharedSlice(clone(base));
  stored.worldSeed = 777;
  stored.bossDefeatedDay = { boss_flame_bull: 66 };
  const svc = memoryService(clone(stored));
  const s1 = createStore<WorldStateData>(() => clone(base));
  const stop = attachSharedWorld(s1, svc);
  assert.equal(s1.getState().worldSeed, 777);
  assert.deepEqual(s1.getState().bossDefeatedDay, { boss_flame_bull: 66 });
  s1.setState({ bossDefeatedDay: { boss_flame_bull: 66, boss_blade_crab: 70 } });
  assert.equal(svc.get()!.bossDefeatedDay.boss_blade_crab, 70, "saved on change");
  stop();
  // No stored world: the state's own is kept (an old save), seeded with a world seed.
  const empty = memoryService(null);
  const s2 = createStore<WorldStateData>(() => ({ ...clone(base), worldSeed: 0 }));
  attachSharedWorld(s2, empty);
  assert.ok(s2.getState().worldSeed > 0);
  assert.deepEqual(empty.get()!.npcExt, clone(s2.getState().npcExt));
  // A save carrying a world field (old or hand-edited) keeps it over the stored world.
  const joined = clone(base);
  joined.bossDefeatedDay = { boss_sun_turtle: 69 };
  joinSharedWorld(joined, stored, ["bossDefeatedDay"]);
  assert.deepEqual(joined.bossDefeatedDay, { boss_sun_turtle: 69 });
  assert.equal(joined.worldSeed, 777);
  assert.equal(sameWorld(joined, joined), true);
});

// ─── v27: older saves join the world clock ─────────────────────────────
check("rebaseDays: every day stamp moves with the save's day; jail cut to the new scale; a running tournament dropped", () => {
  const p = clone(newGame(500, 3)) as WorldStateData;
  p.wantedDay = 495;
  p.jailUntil = 500 * 12 + 3 + 40; // forty ชั่วยาม left on the old scale
  p.giftDays = { a: 480 };
  p.letterDays = { b: 490 };
  p.activityDays = { c: 499 };
  p.kidnappedUntil = { d: 600 };
  p.bossDefeatedDay = { boss_flame_bull: 450 };
  p.letters = [{ id: "l", day: 498, npcId: "x", text: "", rarity: "common", read: false, claimed: false } as never];
  p.actionLog = [{ day: 499, time: 1, kind: "rest", message: "" }];
  p.tournament = { year: 2, status: "registered", rounds: [], round: 0, playerOut: false, gold: 0, wExp: 0 };
  const ext = Object.values(p.npcExt)[0]!;
  const tick = ext.lastTickDay;
  rebaseDays(p, -490);
  assert.equal(p.day, 10);
  assert.equal(p.wantedDay, 5);
  assert.equal(p.jailUntil! - (p.day * 12 + p.time), JAIL_MAX_HOURS, "at most an hour left");
  assert.deepEqual(p.giftDays, { a: -10 });
  assert.deepEqual(p.letterDays, { b: 0 });
  assert.deepEqual(p.activityDays, { c: 9 });
  assert.deepEqual(p.kidnappedUntil, { d: 110 });
  assert.deepEqual(p.bossDefeatedDay, { boss_flame_bull: -40 });
  assert.equal(p.letters[0].day, 8);
  assert.equal(p.actionLog[0].day, 9);
  assert.equal(Object.values(p.npcExt)[0]!.lastTickDay, tick - 490);
  assert.equal(p.tournament, null);
});

check("migrate v26 → v27: an old save lands on today's world day; a v27 save is left as it is", () => {
  setTestWorldTime(12, 0);
  const old = migrateSave({ hasGame: true, day: 300, time: 4, wantedDay: 295, giftDays: { npc: 290 } }, 26);
  assert.equal(old.day, 12);
  assert.equal(old.wantedDay, 7);
  assert.deepEqual(old.giftDays, { npc: 2 });
  const current = migrateSave({ hasGame: true, day: 300, time: 4 }, 27);
  assert.equal(current.day, 300);
  // The load-time merge notes which world fields the save carried.
  const merged = mergeSave({ hasGame: true, day: 12, npcExt: {} }, store());
  assert.equal(merged.day, 12);
  assert.deepEqual(takeCarriedWorldKeys(), ["npcExt"], "the save carried npcExt: it wins when the world joins");
  assert.deepEqual(takeCarriedWorldKeys(), [], "read once");
});

console.warn = originalWarn;
if (failed) {
  console.error(`${failed} clock check(s) failed`);
  process.exit(1);
}
