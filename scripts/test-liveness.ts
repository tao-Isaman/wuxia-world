// Liveness 2.0: the living jianghu. Aging, death and its odds, journeys on
// real roads, joining sects, succession (a new chief takes the seat and the
// dead chief's quests), generated disciples, people on maps, sparring or
// killing anyone (wanted at once), the two player echoes that used to be
// unreachable, and rumors that spread and tell what happened.
import assert from "node:assert/strict";

const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });

const { useWorldStore } = await import("../store/world-store");
const { useBattleStore } = await import("../store/battle-store");
const { ensureBattleStarted } = await import("../lib/world/battle-bridge");
const { birthdaysBetween, deathChance, chooseSect, tickAllNamedNpcs } = await import("../lib/world/npc-tick");
const life = await import("../lib/world/npc-life");
const { namedNpcIds } = await import("../lib/world/data/named-npcs");
const { NPCS_WANDERERS } = await import("../lib/world/data/npcs/wanderers");
const { getNpc } = await import("../lib/world/data/npcs");
const { getOpponent, parseNpcFoeId } = await import("../lib/world/data/opponents");
const { setTestWorldTime } = await import("../lib/world/clock");
const { QUESTS, getQuest, getQuestsForNpc } = await import("../lib/world/data/quests");
const { isQuestTurnInForNpc, isMajorQuest } = await import("../lib/world/effects");
const { npcPresent } = await import("../lib/world/npc-presence");
const { rumorReaches, SPREAD_HEARTLAND_DAYS, SPREAD_ALL_DAYS } = await import("../lib/world/rumor-engine");
const { WANTED_MAX } = await import("../lib/world/law");
const { SECT_MEMBERSHIPS } = await import("../lib/world/data/sect-memberships");
const { WORLD_COORDS } = await import("../lib/world/data/world-coords");
import type { NpcExtState, Rumor, WorldStateData } from "../lib/world/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** A seeded random source (mulberry32). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = Math.random;
const warn = console.warn;
console.warn = () => {};
let failures = 0;
function check(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve().then(fn).then(() => console.log(`PASS ${name}`), (error) => {
    failures++;
    console.log(`FAIL ${name}`);
    console.log(error);
  });
}
function fresh(): WorldStateData {
  // A new world on day 1 of the world clock, as these checks count from it.
  setTestWorldTime(1, 0);
  Math.random = () => 0.5;
  useWorldStore.getState().startNewGame({ newWorld: true, name: "Liveness test" });
  Math.random = random;
  return clone(useWorldStore.getState()) as WorldStateData;
}
const CHIEF = "sect_emei_abbess_jingchan";
const VICE = "sect_emei_vice_abbess_huimiao";

try {
  await check("roster: thirty simulated people, ten of them wanderers with talk scenes and no fixed home", () => {
    assert.equal(namedNpcIds().length, 30);
    assert.equal(NPCS_WANDERERS.length, 10);
    const state = fresh();
    assert.equal(Object.keys(state.npcExt).length, 30, "a new game seeds all thirty");
    for (const npc of NPCS_WANDERERS) {
      assert.deepEqual(npc.locationIds, [], `${npc.id} goes where the simulation takes them`);
      assert.ok(npc.dialogSceneId && npc.look?.wander, `${npc.id} talks and strolls`);
      const ext = state.npcExt[npc.id]!;
      assert.equal(ext.sect, null);
      assert.ok(life.npcsAt(state, ext.currentLocation).some((n) => n.id === npc.id), `${npc.id} stands at ${ext.currentLocation}`);
    }
    for (const id of namedNpcIds()) {
      const ext = state.npcExt[id]!;
      assert.ok(ext.temper && ext.gender && typeof ext.birthday === "number", `${id} has a temper, a sex and a birthday`);
    }
    for (const sect of Object.keys(SECT_MEMBERSHIPS)) assert.ok(life.sectChief(state, sect as never), `${sect} has a chief`);
  });

  await check("aging: a year on each birthday — every living person is a year older after 365 days", () => {
    assert.equal(birthdaysBetween(0, 365, 100), 1);
    assert.equal(birthdaysBetween(99, 100, 100), 1);
    assert.equal(birthdaysBetween(100, 101, 100), 0);
    assert.equal(birthdaysBetween(1, 1 + 365 * 3, 17), 3);
    const state = fresh();
    const before = Object.fromEntries(Object.entries(state.npcExt).map(([id, e]) => [id, e.age]));
    // No one dies (rng never below the weekly odds) and nobody decides anything.
    for (let day = 8; day <= 1 + 365; day += 7) {
      state.day = day;
      tickAllNamedNpcs(state, { currentDay: day, rng: () => 0.999 });
    }
    state.day = 1 + 365 + 7;
    tickAllNamedNpcs(state, { currentDay: state.day, rng: () => 0.999 });
    for (const [id, age] of Object.entries(before)) assert.equal(state.npcExt[id]!.age, age + 1, `${id} aged one year`);
  });

  await check("mortality: risk rises with age, falls with strength, rises with wounds; weekly odds stay small", () => {
    const young = deathChance({ age: 30, power: 50 }, 1);
    const old = deathChance({ age: 80, power: 50 }, 1);
    const strongOld = deathChance({ age: 80, power: 95 }, 1);
    const wounded = deathChance({ age: 80, power: 50, woundedUntil: 10 }, 1);
    assert.ok(young < old && strongOld < old && wounded > old);
    assert.ok(old < 0.01, "an eighty-year-old is not likely to die in any given week");
  });

  await check("roads: every travel spot reaches the capital; a journey walks real neighbouring places", () => {
    for (const spot of life.TRAVEL_SPOTS.filter((id) => id !== "city_capital")) {
      const path = life.roadPath(spot, "city_capital");
      assert.ok(path && path.at(-1) === "city_capital", `${spot} → capital`);
    }
    const plan = life.journeyTo("city_changan", "sect_emei", "visit")!;
    assert.equal(plan.path.at(-1), "sect_emei");
    assert.ok(!plan.path.includes("home_player") && !plan.path.includes("jail"));
  });

  await check("sects: the sectless knock on gates that take them — Shaolin men, Emei women", () => {
    const rng = seeded(7);
    for (let i = 0; i < 50; i++) {
      const woman = { gender: "female", temper: { righteous: 0.8 }, currentLocation: "sect_shaolin" } as NpcExtState;
      const man = { gender: "male", temper: { righteous: 0.8 }, currentLocation: "sect_emei" } as NpcExtState;
      assert.notEqual(chooseSect(woman, rng), "shaolin");
      assert.ok(!["emei", "hengshan_north", "gumu"].includes(chooseSect(man, rng)!));
      const crooked = { gender: "male", temper: { righteous: -0.6 }, currentLocation: "city_capital" } as NpcExtState;
      assert.ok(["sunmoon", "tang", "xiaoyao", "jinyiwei"].includes(chooseSect(crooked, rng)!));
    }
  });

  await check("succession: a dead chief is gone from every map; the senior member takes the seat, the spot and the quests", () => {
    const state = fresh();
    const quests = getQuestsForNpc(CHIEF);
    assert.ok(quests.length > 0, "the Emei abbess gives quests");
    life.killNpc(state, CHIEF, 30, { kind: "death_natural" }, seeded(3));
    assert.equal(state.npcExt[CHIEF]!.status, "dead");
    assert.equal(npcPresent(state, CHIEF), false);
    assert.ok(!life.npcsAt(state, "sect_emei").some((n) => n.id === CHIEF), "the dead are on no map");
    assert.equal(life.sectChief(state, "emei"), VICE, "the vice abbess is the new chief");
    assert.equal(state.npcExt[CHIEF]!.heirId, VICE);
    assert.deepEqual(life.predecessorsOf(state, VICE), [CHIEF], "she sits in the old seat");
    assert.equal(life.questHolder(state, CHIEF), VICE);
    const held = life.heldQuests(state, VICE).map((q) => q.id);
    for (const q of quests) assert.ok(held.includes(q.id), `${q.id} passes to the heir`);
    // A quest at its hand-in stage is handed in to the heir.
    const quest = quests.find((q) => q.stages.length > 0)!;
    state.quests[quest.id] = { id: quest.id, status: "active", stage: quest.stages.length - 1 };
    assert.equal(isQuestTurnInForNpc(state, quest, VICE), true);
    assert.ok(state.rumorPool.some((r) => r.refersToEvent?.eventKind === "new_chief" && r.text.includes(getNpc(VICE)!.name)));
  });

  await check("succession: with no senior member left, an elder steps forward (a generated person)", () => {
    const state = fresh();
    for (const id of life.sectMembers(state, "gumu")) life.killNpc(state, id, 30, { kind: "death_natural" }, seeded(5));
    const chief = life.sectChief(state, "gumu")!;
    assert.ok(chief && state.npcExt[chief]!.dynamic, "a generated elder");
    assert.equal(state.npcExt[chief]!.gender, "female", "Gumu takes women");
    assert.equal(getNpc(chief)?.name, state.npcExt[chief]!.name, "registered with the NPC registry");
    assert.ok(life.npcsAt(state, "sect_gumu").some((n) => n.id === chief));
  });

  await check("quests of the dead: a sect member's pass to the chief; a sectless giver's fail", () => {
    const state = fresh();
    const quest = getQuestsForNpc(CHIEF)[0]!;
    state.quests[quest.id] = { id: quest.id, status: "active", stage: 0 };
    life.killNpc(state, CHIEF, 30, { kind: "death_combat", by: VICE }, seeded(9));
    const changes = life.settleChargesOfDead(state, new Set([CHIEF]), getQuest);
    assert.equal(changes[0]?.holderId, VICE);
    assert.equal(state.quests[quest.id]!.status, "active");
    const loner = "merchant_wang";
    const theirs = getQuestsForNpc(loner)[0];
    if (theirs) {
      state.quests[theirs.id] = { id: theirs.id, status: "active", stage: 0 };
      life.killNpc(state, loner, 31, { kind: "killed_by_player", by: "player" }, seeded(9));
      const failed = life.settleChargesOfDead(state, new Set([loner]), getQuest);
      assert.equal(failed[0]?.holderId, null);
      assert.equal(state.quests[theirs.id]!.status, "failed");
    }
  });

  await check("five simulated years: real deaths, heirs, disciples, journeys and sect joins; every seat held; people where they say", () => {
    const state = fresh();
    const rng = seeded(2026);
    for (let day = 8; day <= 1 + 365 * 5; day += 7) {
      state.day = day;
      tickAllNamedNpcs(state, { currentDay: day, rng });
    }
    const all = Object.entries(state.npcExt);
    const kinds = new Set(all.flatMap(([, e]) => e.eventHistory.map((h) => h.kind)));
    for (const kind of ["take_disciple", "journey", "master_art"] as const) assert.ok(kinds.has(kind), `someone did ${kind}`);
    assert.ok(all.some(([, e]) => e.dynamic), "generated people exist");
    assert.ok(all.filter(([, e]) => life.isAliveExt(e)).length >= 30, "the jianghu stays populated");
    assert.ok(life.aliveDynamicCount(state) <= life.DYNAMIC_CAP);
    for (const sect of Object.keys(SECT_MEMBERSHIPS)) assert.ok(life.sectChief(state, sect as never), `${sect} has a chief`);
    for (const [id, e] of all) {
      if (!life.isAliveExt(e)) continue;
      assert.ok(e.currentLocation in WORLD_COORDS || e.currentLocation === e.homeLocation, `${id} stands somewhere real`);
      assert.ok(getNpc(id), `${id} is in the registry`);
    }
  });

  await check("anyone can be sparred: a person without an authored build fights as themselves", () => {
    const state = fresh();
    useWorldStore.setState({ ...state, currentSceneId: "city_changan", lastLocationId: "city_changan" });
    const r = useWorldStore.getState().startSparWith("wander_li_changfeng");
    assert.equal(r.ok, true);
    const pb = useWorldStore.getState().pendingBattle!;
    assert.equal(pb.nonFatal, true);
    const parsed = parseNpcFoeId(pb.opponentId)!;
    assert.equal(parsed.npcId, "wander_li_changfeng");
    const opp = getOpponent(pb.opponentId)!;
    assert.equal(opp.name, "หลี่ฉางเฟิง");
    assert.equal(opp.look?.npc, "wander_li_changfeng");
    assert.ok(opp.build().skillIds.filter(Boolean).length >= 2);
    useWorldStore.getState().clearPendingBattle();
  });

  await check("⚔ สังหาร: winning kills them for good, wanted 5 at once, the jianghu talks; a member's quests pass on", async () => {
    const state = fresh();
    useWorldStore.setState({ ...state, currentSceneId: "sect_emei", lastLocationId: "sect_emei", wanted: 0 });
    const r = useWorldStore.getState().startKillDuel(VICE);
    assert.equal(r.ok, true);
    assert.equal(useWorldStore.getState().pendingBattle?.killNpcId, VICE);
    ensureBattleStarted();
    const battle = useBattleStore.getState().state!;
    useBattleStore.setState({ state: { ...battle, winner: "A", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    const after = useWorldStore.getState();
    assert.equal(after.npcExt[VICE]!.status, "dead");
    assert.equal(after.npcExt[VICE]!.killedBy, "player");
    assert.equal(after.wanted, WANTED_MAX, "wanted at the top of the list at once");
    assert.ok(after.assassinatedNpcIds.includes(VICE));
    assert.equal(npcPresent(after, VICE), false);
    assert.ok(after.rumorPool.some((rumor) => rumor.source === "player_echo" && rumor.about === VICE), "the kill is talked about");
    assert.ok(after.rumorPool.some((rumor) => rumor.refersToEvent?.eventKind === "killed_by_player"));
    useBattleStore.getState().reset();
  });

  await check("⚔ สังหาร failed: an attempt on a life adds two marks", () => {
    const state = fresh();
    useWorldStore.setState({ ...state, currentSceneId: "sect_emei", lastLocationId: "sect_emei", wanted: 0 });
    useWorldStore.getState().startKillDuel(CHIEF);
    ensureBattleStarted();
    const battle = useBattleStore.getState().state!;
    useBattleStore.setState({ state: { ...battle, winner: "B", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    assert.equal(useWorldStore.getState().wanted, 2);
    assert.notEqual(useWorldStore.getState().npcExt[CHIEF]!.status, "dead");
    useBattleStore.getState().reset();
  });

  await check("echoes: joining a sect by its intro quest's reward and finishing the main story are talked about", () => {
    const state = fresh();
    useWorldStore.setState(state);
    const before = useWorldStore.getState().rumorPool.length;
    assert.equal(useWorldStore.getState().joinSect("wudang").ok, true);
    assert.ok(useWorldStore.getState().rumorPool.slice(before).some((r) => r.source === "player_echo" && r.id.includes("sect_join")));
    const echoes = useWorldStore.getState().rumorPool.filter((r) => r.id.includes("sect_join")).length;
    assert.equal(echoes, 1, "one join, one echo");
    assert.ok(isMajorQuest(getQuest("st_main_01")!), "main-story chapters are milestones");
    const finale = QUESTS.find((q) => q.story && (q.rewards ?? []).some((r) => r.t === "learnSkill" || r.t === "learnArt"));
    assert.ok(finale && isMajorQuest(finale), "a saga's last chapter is a milestone");
    const errand = QUESTS.find((q) => !q.story && !q.isMajor && !q.id.startsWith("st_main_"))!;
    assert.equal(isMajorQuest(errand), false, "an errand is not");
  });

  await check("rumors spread: big news reaches every region in days; ordinary news reaches the heartland, not the far side", () => {
    const base = { id: "x", text: "", createdDay: 10, expiresDay: 999, truth: "true", channel: "inn", about: null, leadsTo: null, prerequisites: [], weight: 5 };
    const quiet: Rumor = { ...base, source: "npc_event", region: "west", refersToEvent: { eventKind: "journey", day: 10 } } as unknown as Rumor;
    const loud: Rumor = { ...base, source: "npc_event", region: "west", refersToEvent: { eventKind: "new_chief", day: 10 } } as unknown as Rumor;
    assert.equal(rumorReaches(quiet, "heartland", 10), false);
    assert.equal(rumorReaches(quiet, "heartland", 10 + SPREAD_HEARTLAND_DAYS), true);
    assert.equal(rumorReaches(quiet, "east", 10 + 60), false);
    assert.equal(rumorReaches(loud, "east", 10 + SPREAD_ALL_DAYS), true);
    const lore: Rumor = { ...base, source: "lore", region: "west", refersToEvent: null } as unknown as Rumor;
    assert.equal(rumorReaches(lore, "heartland", 500), false, "local legends stay local");
  });
} finally {
  Math.random = random;
  console.warn = warn;
}
if (failures) {
  console.log(`${failures} liveness check(s) failed`);
  process.exit(1);
}
