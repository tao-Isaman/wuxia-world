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
const { evaluateCondition } = await import("../lib/world/conditions");
const { getScene } = await import("../lib/world/data/scenes");
const { OPPONENTS: ALL_OPPONENTS } = await import("../lib/world/data/opponents");
const OPPONENTS = ALL_OPPONENTS;
const { foeLook, worldBattleSetup } = await import("../lib/world/battle-looks");
const { livingVoice, npcBaseName, voiceLabel } = await import("../lib/world/speaker");
const { kidnapReturned } = await import("../lib/world/bad-actions");
const { encounterFoeAvailable } = await import("../lib/world/encounters");
const { repairNpcExt } = await import("../lib/world/npc-repair");
const { validateAndRepair } = await import("../lib/world/validate");
const { npcPortrait } = await import("../lib/world/data/npc-portraits");
const { NPC_PORTRAIT_IDS } = await import("../lib/world/data/npc-portrait-ids");
const { SECT_PORTRAITS, SECTLESS_PORTRAITS, ageBand, generatedPortraitId } = await import("../lib/world/data/generated-portraits");
const { FEMALE_ONLY_SECTS } = await import("../lib/world/data/liveness-roster");
const feuds = await import("../lib/world/feuds");
const { rollWalkEvent } = await import("../lib/world/encounters");
const { followLeads, loreLeads, noteLeadHeard, LEAD_WEXP } = await import("../lib/world/rumor-engine");
const { TOURNAMENT, TOURNAMENT_WARNING_DAYS, scheduleTournamentWarning, tournamentDay } = await import("../lib/world/tournament");
const { ITEMS_BY_ID } = await import("../lib/world/data/items");
const { existsSync } = await import("node:fs");
import type { DialogScene, NpcExtState, Rumor, WorldStateData } from "../lib/world/types";

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
      if (e.dynamic) assert.ok(npcPortrait(id), `${id} (generated) has a portrait`);
    }
    // Five years of the simulation leave nothing for the load repair to fix.
    const repaired = clone(state);
    const report = repairNpcExt(repaired);
    assert.deepEqual(report, { dropped: [], fixed: [] }, "a healthy world needs no repair");
  });

  await check("generated people borrow a portrait that fits their school, sex and age, and read as someone", () => {
    for (const [sect, pool] of Object.entries(SECT_PORTRAITS)) {
      assert.ok(pool.length > 0, `${sect} has faces`);
      for (const [id, sex] of pool) {
        assert.ok(NPC_PORTRAIT_IDS.has(id) && existsSync(`public/npcs/${id}.png`), `${id} is a painted portrait`);
        if (FEMALE_ONLY_SECTS.has(sect as never)) assert.equal(sex, "female", `${sect} admits women only`);
        if (sect === "shaolin") assert.equal(sex, "male");
      }
    }
    for (const [id] of SECTLESS_PORTRAITS) assert.ok(NPC_PORTRAIT_IDS.has(id) && existsSync(`public/npcs/${id}.png`), `${id} is a painted portrait`);
    const all = [...Object.values(SECT_PORTRAITS).flat(), ...SECTLESS_PORTRAITS];
    for (const named of namedNpcIds()) assert.ok(!all.some(([id]) => id === named), `${named} (simulated) lends no face`);
    const sexOf = new Map(all.map(([id, sex]) => [id, sex]));
    const bandOf = new Map(all.map(([id, , band]) => [id, band]));
    // Every school, both sexes, three ages: a face of the right sex, the right age where one exists.
    for (const sect of [...Object.keys(SECT_MEMBERSHIPS), null] as (keyof typeof SECT_PORTRAITS | null)[]) {
      for (const gender of ["male", "female"] as const) {
        for (const age of [18, 40, 70]) {
          const id = `dyn_${sect ?? "none"}_${gender}_${age}`;
          const face = generatedPortraitId(id, { sect, gender, age });
          assert.equal(sexOf.get(face), gender, `${id}: ${face}`);
          assert.equal(generatedPortraitId(id, { sect, gender, age }), face, "the same person keeps the same face");
          const pool = sect ? SECT_PORTRAITS[sect] : SECTLESS_PORTRAITS;
          if (pool.some(([, s, b]) => s === gender && b === ageBand(age))) assert.equal(bandOf.get(face), ageBand(age), `${id}: a face of their age`);
        }
      }
    }
    const state = fresh();
    const id = life.spawnPerson(state, { sect: "wudang", rank: 1, home: "sect_wudang", power: 20, age: 17, day: state.day, gender: "male", masterId: "sect_wudang_master_zhang" }, seeded(7))!;
    const portrait = npcPortrait(id);
    assert.ok(portrait && SECT_PORTRAITS.wudang.some(([face]) => portrait === `/npcs/${face}.png`), `a Wudang disciple wears a Wudang face (${portrait})`);
    const def = getNpc(id)!;
    assert.ok(def.description?.includes("อายุ 17"), def.description);
    assert.ok(!def.description?.includes("ยุทธจักรเพิ่งรู้จักชื่อ"), "no longer the one generic line");
  });

  await check("the load repair drops unknown people and brings every field back in range", () => {
    const state = fresh();
    const chief = state.npcExt[CHIEF]!;
    state.npcExt.ghost_nobody = clone(chief);
    state.npcExt.dyn_bad = { ...clone(chief), dynamic: true, name: "x" } as NpcExtState; // a generated id must be dyn_<n>
    state.npcExt[CHIEF] = {
      ...chief, power: 500, age: -3, status: "zombie" as never, currentLocation: "nowhere", sect: "atlantis" as never, sectRank: 99,
      rivals: ["ghost_nobody", VICE, VICE], allies: [CHIEF], temper: { righteous: 7, ambition: -1, wanderlust: Number.NaN, loyalty: 2 },
      birthday: 900, woundedUntil: Number.POSITIVE_INFINITY, masterId: "ghost_nobody", formerSect: "nowhere" as never,
      plan: { purpose: "wander", path: ["nowhere"], to: "city_capital" },
    };
    state.flags["feud:atlantis"] = 99;
    state.flags["feud:emei"] = "soon";
    state.flags["feud:wudang"] = state.day + 5;
    validateAndRepair(state);
    assert.ok(!("ghost_nobody" in state.npcExt) && !("dyn_bad" in state.npcExt), "unknown ids dropped");
    const e = state.npcExt[CHIEF]!;
    assert.equal(e.power, 100);
    assert.equal(e.age, 1);
    assert.equal(e.status, "alive");
    assert.equal(e.currentLocation, e.homeLocation);
    assert.equal(getScene(e.homeLocation)?.kind, "location");
    assert.equal(e.sect, null);
    assert.equal(e.sectRank, 0);
    assert.deepEqual(e.rivals, [VICE], "unknown and duplicate rivals dropped");
    assert.deepEqual(e.allies, [], "nobody is their own ally");
    assert.deepEqual(e.temper, { righteous: 1, ambition: 0, wanderlust: 0.3, loyalty: 1 });
    assert.equal(e.birthday, 364);
    assert.equal(e.woundedUntil, undefined);
    assert.equal(e.masterId, undefined);
    assert.equal(e.formerSect, undefined);
    assert.equal(e.plan, null, "a journey through nowhere is dropped");
    assert.equal(state.flags["feud:atlantis"], undefined);
    assert.equal(state.flags["feud:emei"], undefined);
    assert.equal(state.flags["feud:wudang"], state.day + 5, "a sound feud stays");
    assert.deepEqual(state.npcExt[VICE], fresh().npcExt[VICE], "sound entries are left as they were");
  });

  await check("a sect avenges its dead: killing a member brings its hunters for a while, until beaten off or blood is paid", async () => {
    const state = fresh();
    useWorldStore.setState({ ...state, currentSceneId: "sect_emei", lastLocationId: "sect_emei", wanted: 0 });
    useWorldStore.getState().startKillDuel(VICE);
    ensureBattleStarted();
    const won = useBattleStore.getState().state!;
    useBattleStore.setState({ state: { ...won, winner: "A", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    useBattleStore.getState().reset();
    let s = useWorldStore.getState();
    assert.deepEqual(feuds.activeFeuds(s), ["emei"], "Emei swears vengeance");
    assert.equal(feuds.feudVictim(s, "emei"), VICE);
    assert.ok(s.actionLog.some((e) => e.kind === "feud" && e.message.includes(getNpc(VICE)!.name)), "the log says so");
    assert.ok(s.rumorPool.some((r) => r.source === "player_echo" && r.id.includes("feud_declared") && r.text.includes(SECT_MEMBERSHIPS.emei.name)), "and the jianghu hears of it");
    // The hunters catch up on the road (the law aside: no marks here).
    const road = clone(s) as WorldStateData;
    road.wanted = 0;
    road.currentSceneId = "city_changan";
    Math.random = () => 0.01;
    rollWalkEvent(road, 1);
    Math.random = random;
    assert.equal(road.pendingEncounter?.opponentId, "hunter_emei");
    Math.random = () => 0.5;
    const calm = clone(s) as WorldStateData;
    calm.wanted = 0;
    rollWalkEvent(calm, 1);
    Math.random = random;
    assert.equal(calm.pendingEncounter ?? null, null, `only now and then (${feuds.FEUD_CHANCE * 100} % a tick)`);
    // Beat FEUD_SETTLE_WINS of them and the sect lets it go.
    for (let i = 0; i < feuds.FEUD_SETTLE_WINS; i++) {
      assert.ok(feuds.feudActive(useWorldStore.getState(), "emei"), `still hunted after ${i} wins`);
      useWorldStore.setState({ pendingEncounter: { opponentId: "hunter_emei", returnSceneId: "city_changan" }, currentSceneId: "city_changan" });
      useWorldStore.getState().acceptEncounter();
      ensureBattleStarted();
      const fight = useBattleStore.getState().state!;
      useBattleStore.setState({ state: { ...fight, winner: "A", phase: "over" } });
      useWorldStore.getState().acknowledgeBattleResult();
      useBattleStore.getState().reset();
    }
    s = useWorldStore.getState();
    assert.deepEqual(feuds.activeFeuds(s), [], "settled");
    assert.ok(s.actionLog.some((e) => e.kind === "feud" && e.message.includes("ยอมเลิก")));
    // Struck down by an avenger: blood is paid.
    const again = clone(s) as WorldStateData;
    feuds.startFeud(again, "wudang", "sect_wudang_master_zhang");
    useWorldStore.setState({ ...again, pendingEncounter: { opponentId: "hunter_wudang", returnSceneId: "city_changan" } });
    useWorldStore.getState().acceptEncounter();
    ensureBattleStarted();
    const lost = useBattleStore.getState().state!;
    useBattleStore.setState({ state: { ...lost, winner: "B", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    useBattleStore.getState().reset();
    assert.equal(feuds.feudActive(useWorldStore.getState(), "wudang"), false, "a fall to the avengers ends it");
    // Or time runs out.
    const old = clone(s) as WorldStateData;
    feuds.startFeud(old, "huashan", "x");
    old.day += feuds.FEUD_DAYS + 1;
    assert.deepEqual(feuds.expireFeuds(old), ["huashan"]);
    assert.equal(old.flags["feud:huashan"], undefined);
    // A school the hero betrayed hunts them already: no second feud on top.
    const traitor = fresh();
    traitor.sectMembership.emei = { ...(traitor.sectMembership.emei ?? { rank: 9, points: 0 }), status: "betrayed" } as never;
    useWorldStore.setState({ ...traitor, currentSceneId: "sect_emei", lastLocationId: "sect_emei", wanted: 0 });
    useWorldStore.getState().startKillDuel(VICE);
    ensureBattleStarted();
    const w2 = useBattleStore.getState().state!;
    useBattleStore.setState({ state: { ...w2, winner: "A", phase: "over" } });
    useWorldStore.getState().acknowledgeBattleResult();
    useBattleStore.getState().reset();
    assert.deepEqual(feuds.activeFeuds(useWorldStore.getState()), []);
  });

  await check("warnings fire: the inns talk about the tournament in the three days before it comes", () => {
    const state = fresh();
    const year = 1;
    const day = tournamentDay(year);
    state.rumorPool = state.rumorPool.filter((r) => r.source !== "warning");
    state.day = day - TOURNAMENT_WARNING_DAYS - 1;
    assert.equal(scheduleTournamentWarning(state), null, "not yet");
    state.day = day - 30;
    const id = scheduleTournamentWarning(state)!;
    const warning = () => state.rumorPool.find((r) => r.id === id)!;
    assert.equal(warning().source, "warning");
    assert.equal(warning().region, "global");
    assert.ok(warning().text.includes("คืนวันเสาร์นี้") && warning().text.includes("ชุมนุมประลองกระบี่หัวซาน"), warning().text);
    assert.equal(warning().expiresDay, day - 1);
    state.day = day - 3;
    assert.equal(scheduleTournamentWarning(state), id, "one rumor a round");
    assert.equal(state.rumorPool.filter((r) => r.source === "warning").length, 1);
    state.day = day;
    assert.equal(scheduleTournamentWarning(state), null, "the day itself needs no warning");
    assert.equal(TOURNAMENT.startDay, 309);
    // syncClock schedules it: a store action in the window leaves the warning in the pool.
    setTestWorldTime(day - 10, 0);
    useWorldStore.setState({ ...fresh(), day: day - 11 });
    setTestWorldTime(day - 10, 0);
    useWorldStore.getState().recordRumorHeard("nothing");
    useWorldStore.getState().gotoScene(useWorldStore.getState().currentSceneId);
    assert.ok(useWorldStore.getState().rumorPool.some((r) => r.id === `rumor_warn_tournament_y${year}` && r.text.includes("คืนวันเสาร์นี้")));
    setTestWorldTime(1, 0);
  });

  await check("lore leads pay off: reaching the place a heard lead names finds something, once", () => {
    const leads = [...loreLeads()];
    assert.ok(leads.length >= 8);
    for (const [id, lore] of leads) {
      assert.equal(getScene(lore.leadsTo!.locationId)?.kind, "location", `${id} leads to a real place`);
      if (lore.leadsTo!.hintItemId) assert.ok(ITEMS_BY_ID.has(lore.leadsTo!.hintItemId), `${id} hints at a real item`);
    }
    const [rumorId, lore] = leads.find(([, l]) => l.leadsTo!.hintItemId === "snow_lotus")!;
    const place = lore.leadsTo!.locationId;
    const state = fresh();
    assert.deepEqual(followLeads(state, place), [], "an unheard lead gives nothing");
    noteLeadHeard(state, rumorId);
    const wExp = state.wExp;
    const found = followLeads(state, place);
    assert.deepEqual(found.map((f) => f.itemId), ["snow_lotus"]);
    assert.equal(state.inventory.snow_lotus, 1);
    assert.equal(state.wExp, wExp + LEAD_WEXP);
    assert.deepEqual(followLeads(state, place), [], "once only");
    // A lead whose hint is a quest item gives no quest item (its quest hands it over).
    const [questLead, ql] = leads.find(([, l]) => ITEMS_BY_ID.get(l.leadsTo!.hintItemId ?? "")?.category === "quest")!;
    const s2 = fresh();
    noteLeadHeard(s2, questLead);
    assert.deepEqual(followLeads(s2, ql.leadsTo!.locationId).map((f) => f.itemId), [null]);
    // In the store: hearing it at an inn, then arriving, logs the find.
    useWorldStore.setState({ ...fresh(), stamina: 999 });
    useWorldStore.getState().recordRumorHeard(rumorId);
    assert.equal(useWorldStore.getState().flags[`lead:${rumorId}`], "heard");
    useWorldStore.getState().gotoScene(place);
    const after = useWorldStore.getState();
    assert.equal(after.currentSceneId, place);
    assert.equal(after.flags[`lead:${rumorId}`], "found");
    assert.ok(after.actionLog.some((e) => e.kind === "lead" && e.message.includes(ITEMS_BY_ID.get("snow_lotus")!.name)));
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
    // The master's door (store joinSect) opens once the intro quest is done.
    useWorldStore.setState({ ...state, quests: { ...state.quests, qst_wudang_disciple_intro: { id: "qst_wudang_disciple_intro", status: "done", stage: 1 } } });
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

  await check("a dead lineage teacher's quest passes on: to the heir, else a schoolmate or a neighbour; the spar is waived; the stand-in speaks", () => {
    const lineage = QUESTS.filter((q) => q.lineage && q.giverNpcId);
    const teachers = [...new Set(lineage.map((q) => q.giverNpcId!))];
    let orphaned = 0;
    for (const teacher of teachers) {
      const state = fresh();
      life.killNpc(state, teacher, state.day, { kind: "death_natural" });
      const holder = life.questHolder(state, teacher);
      if (!holder) { orphaned++; continue; }
      assert.notEqual(holder, teacher);
      assert.ok(life.heldQuests(state, holder).some((q) => q.lineage && q.giverNpcId === teacher), `${teacher}'s lineage passes to ${holder}`);
      assert.ok(!life.npcsAt(state, getNpc(teacher)!.locationIds[0]!).some((n) => n.id === teacher), `${teacher} is on no map`);
    }
    assert.ok(orphaned <= 2, `only a lone school with no one else on its grounds dies with its teacher (${orphaned})`);
    // The spar stage of a T2+ lineage quest passes once its teacher is dead.
    const sparQuest = lineage.find((q) => q.stages.some((s) => s.id === "spar"))!;
    const spar = sparQuest.stages.find((s) => s.id === "spar")!;
    const state = fresh();
    assert.equal(evaluateCondition(state, spar.autoAdvance!), false);
    life.killNpc(state, sparQuest.giverNpcId!, state.day, { kind: "death_natural" });
    assert.equal(evaluateCondition(state, spar.autoAdvance!), true, "no spar with the dead");
    // Their lines in the quest's dialogs are spoken by the stand-in.
    const offer = getScene(`qs_${sparQuest.id}_offer`) as DialogScene;
    const label = offer.lines.find((l) => l.t === "dialogue" && getNpc(sparQuest.giverNpcId!)!.name.startsWith(l.speaker))!;
    assert.ok(label && label.t === "dialogue");
    const heir = getNpc(life.questHolder(state, sparQuest.giverNpcId!)!)!;
    assert.equal(voiceLabel(state, offer.id, label.speaker), npcBaseName(heir.name));
    assert.equal(livingVoice(state, getNpc(sparQuest.giverNpcId!) ?? undefined)?.id, heir.id);
  });

  await check("a foe borrowing a dead or carried-off person's look is drawn as its kind, not as them", () => {
    const boss = "st_outsider_sixfold_dushi";
    const person = getOpponent(boss)!.look!.npc!;
    const alive = foeLook(boss, () => true);
    assert.equal(alive.kind === "character" && (alive.characterId === person || !!alive.still), true, "while they live, the boss wears their look");
    const gone = foeLook(boss, (id) => id !== person);
    assert.ok(gone.kind === "character" && gone.characterId !== person && !gone.still, "once they are gone, an enemy type");
    const state = fresh();
    life.killNpc(state, person, state.day, { kind: "death_natural" });
    const setup = worldBattleSetup(boss, { present: (id) => npcPresent(state, id) })!;
    assert.deepEqual(setup.looks.B, gone);
  });

  await check("a kidnapped person can be carried off again once back; quest conditions still read the first time", () => {
    const state = fresh();
    const npc = getNpc(CHIEF)!;
    state.kidnappedNpcIds = [CHIEF];
    state.kidnappedUntil = { [CHIEF]: state.day + 10 };
    assert.equal(kidnapReturned(state, CHIEF), false);
    assert.equal(npcPresent(state, CHIEF), false);
    state.day += 10;
    assert.equal(kidnapReturned(state, CHIEF), true, "back at their spot");
    assert.equal(evaluateCondition(state, { t: "kidnappedNpc", npcId: CHIEF }), true, "the record stays for quests");
    useWorldStore.setState({ ...state, currentSceneId: npc.locationIds[0]!, lastLocationId: npc.locationIds[0]!, stamina: 100 });
    Math.random = () => 0;
    const r = useWorldStore.getState().attemptKidnap(CHIEF);
    Math.random = random;
    assert.equal(r.ok, true, "taken again");
    assert.ok((useWorldStore.getState().kidnappedUntil[CHIEF] ?? 0) > state.day, "away again");
    assert.equal(useWorldStore.getState().kidnappedNpcIds.filter((id) => id === CHIEF).length, 1);
    // A villain carried off rides again once back.
    const villain = OPPONENTS.find((o) => o.look?.npc && encounterFoeAvailable(state, o.id))!;
    const away = { ...state, kidnappedNpcIds: [villain.look!.npc!], kidnappedUntil: { [villain.look!.npc!]: state.day + 5 } };
    assert.equal(encounterFoeAvailable(away, villain.id), false);
    assert.equal(encounterFoeAvailable({ ...away, day: state.day + 5 }, villain.id), true);
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
