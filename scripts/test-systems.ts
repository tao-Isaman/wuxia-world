// Letters, horse stations, practice xp and the sword tournament.
//   bun run test:systems
import assert from "node:assert/strict";
import { getSkill } from "../lib/game";
import { advanceTestClock, msAtWorld, setTestClock, setTestWorldTime } from "../lib/world/clock";
import { xpToNextLevel } from "../lib/game/leveling";
import { PRACTICE_XP, canPracticeAt, inferCategoriesFromId, isForestPlace, practiceMatches, practiceXpGain } from "../lib/world/location-categories";
import { LETTER_RULES, giftRarity, letterChance, letterWriters, pickLetterGift, rollLetters } from "../lib/world/letters";
import { giftable, giftWorth } from "../lib/world/gifts";
import { ARTISAN_PROFESSIONS, ARTISANS, FIELD_RECIPES, RECIPES, craftsAnywhere, getItem, getNpc, getRecipe, recipesOfferedBy } from "../lib/world/data";
import { SECT_MEMBERSHIPS } from "../lib/world/data/sect-memberships";
import { hasStation, stationFare, stationIds, stationTrips } from "../lib/world/stations";
import { FERRYMAN, FERRY_FARE, FERRY_PORTS, ferryFare, ferryStops, ferryTrips, hasFerry } from "../lib/world/ferries";
import { FERRY_LANDINGS } from "../lib/world/data/auto-map-exits";
import { WORLD_COORDS } from "../lib/world/data/world-coords";
import { getScene } from "../lib/world/data/scenes";
import { getLocationMap } from "../lib/world/data/location-maps";
import { WAYPOINT_FLAG, guideMarkerId, navigationGuide } from "../lib/world";
import {
  BOUT_GOLD, PLACE_BY_ROUND, PLAYER, TOURNAMENT, TOURNAMENT_NAME, boutOdds, sendTournamentInvitation, tournamentHost, currentTournament, dayOfYear, drawEntrants, playerOpponent,
  prizeOptions, registerBlock, resolveRound, roundPairs, settleTournaments, startBlock, tournamentDay, tournamentPhase, yearOf,
} from "../lib/world/tournament";
import { namedNpcIds } from "../lib/world/data/named-npcs";
import { COMBO_EPITHETS, NEWCOMER_EPITHET, heroEpithet } from "../lib/world/epithet";
import { useWorldStore } from "../store/world-store";
import { useBattleStore } from "../store/battle-store";

let passed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; }
}
/** A seeded RNG (Park–Miller). */
function seeded(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const store = () => useWorldStore.getState();
function newGame() {
  store().resetGame();
  store().startNewGame({ newWorld: true, name: "ทดสอบ", gender: "male" } as never);
}

// ─── Practice xp ─────────────────────────────────────────────────────
check("practice: 30 xp + 5% of the next level, 50 + 6% at a fitting place; flat at max level", () => {
  assert.deepEqual(PRACTICE_XP, { normal: { flat: 30, pct: 5 }, matched: { flat: 50, pct: 6 } });
  assert.equal(practiceXpGain(false, 1000), 80);
  assert.equal(practiceXpGain(true, 1000), 110);
  assert.equal(practiceXpGain(false, Infinity), 30);
  const skill = getSkill("sl_luohan_fist") ?? getSkill(store().playerBuild?.skillIds.find(Boolean) ?? "");
  if (skill) assert.equal(practiceXpGain(false, xpToNextLevel(skill, 1)), Math.floor(30 + xpToNextLevel(skill, 1) * 0.05));
});

check("practice: the store grants the new formula", () => {
  newGame();
  const raw = store().playerBuild!.skillIds.find(Boolean)!;
  const skill = getSkill(raw)!;
  useWorldStore.setState({ currentSceneId: "sect_shaolin", stamina: 100 });
  const before = store().skillExp[skill.id] ?? 0;
  const lv = store().skillLevel[skill.id] ?? 1;
  const result = store().practiceSkill(raw);
  assert.ok(result.ok, JSON.stringify(result));
  if (!result.ok || result.kind !== "skill") return;
  assert.equal(result.xpGained, practiceXpGain(result.matched, xpToNextLevel(skill, lv)));
  assert.ok((store().skillExp[skill.id] ?? 0) >= before || result.leveledUp);
});

check("practice: forest places (by their land) give the forest bonus; the prefix rule still holds", () => {
  for (const id of ["valley_baihua", "valley_hudie", "cave_jinshe", "mt_wuliang", "isle_taohua"]) {
    assert.ok(isForestPlace(id), id);
    assert.ok(inferCategoriesFromId(id).includes("forest"), id);
    assert.ok(canPracticeAt({ id }), id);
    assert.ok(practiceMatches({ id }, ["yang"]), `${id} fits yang`);
  }
  for (const id of ["city_capital", "village_niujia", "sect_shaolin", "cave_bingcan", "home_player"]) {
    assert.equal(inferCategoriesFromId(id).includes("forest"), false, id);
  }
  assert.deepEqual(inferCategoriesFromId("forest_new"), ["forest"]);
  assert.deepEqual(inferCategoriesFromId("valley_baihua"), ["mountain", "forest"]);
});

// ─── Crafting by one's own trade ─────────────────────────────────────
check("crafting: the hero's own trades' recipes (not artisan ones) craft anywhere, without a bought recipe", () => {
  const skills = new Set(FIELD_RECIPES.map((r) => r.skill));
  assert.equal(FIELD_RECIPES.length, RECIPES.filter((r) => !r.skill || !ARTISAN_PROFESSIONS.has(r.skill)).length);
  assert.ok(FIELD_RECIPES.length >= 12, `${FIELD_RECIPES.length} field recipes`);
  for (const s of ["mining", "hunting", "fishing", "herbalism", "venom", "woodcutting", "drawing", "writing"]) assert.ok(skills.has(s as never), s);
  for (const r of FIELD_RECIPES) assert.ok(craftsAnywhere(r) && !ARTISAN_PROFESSIONS.has(r.skill!), r.id);
  newGame();
  const recipe = getRecipe("cook_meat")!;
  const inventory: Record<string, number> = {};
  for (const inp of recipe.inputs) inventory[inp.itemId] = inp.count;
  useWorldStore.setState({ currentSceneId: "home_player", inventory, learnedRecipeIds: [] });
  const res = store().craftRecipe(recipe.id);
  assert.ok(res.ok, JSON.stringify(res));
  assert.equal(store().inventory[recipe.output.itemId], recipe.output.count);
  for (const inp of recipe.inputs) assert.equal(store().inventory[inp.itemId] ?? 0, 0);
  // An artisan recipe still needs the artisan.
  assert.equal(store().craftRecipe("forge_iron_sword").ok, false);
  // ...and every artisan recipe is sold by some artisan of its profession.
  for (const r of RECIPES.filter((x) => !craftsAnywhere(x))) {
    const sellers = ARTISANS.filter((a) => a.profession === r.skill && recipesOfferedBy(a).some((o) => o.recipeId === r.id));
    assert.ok(sellers.length > 0, `${r.id} is sold nowhere`);
  }
});

// ─── Letters ─────────────────────────────────────────────────────────
check("letters: only friends write; odds rise with relationship, fame and LUK, capped at 15%", () => {
  assert.equal(letterChance(LETTER_RULES.minRelationship - 1, 100, 100), 0);
  const base = letterChance(30, 0, 0);
  assert.ok(base > 0);
  assert.ok(letterChance(60, 0, 0) > base);
  assert.ok(letterChance(30, 200, 0) > base);
  assert.ok(letterChance(30, 0, 60) > base);
  assert.equal(letterChance(500, 500, 500), 0.15);
});

check("letters: LUK lifts the gift's rarity", () => {
  const rarities = (luk: number) => { const rng = seeded(11); let sum = 0; for (let i = 0; i < 400; i++) sum += giftRarity(rng(), luk, 0); return sum / 400; };
  assert.ok(rarities(100) > rarities(0) + 0.3, `${rarities(100)} vs ${rarities(0)}`);
  assert.equal(giftRarity(0.995, 0, 0), 4);
  assert.equal(giftRarity(0, 0, 0), 1);
});

check("letters: gifts are giftable items of the rolled rarity (or gold), never manuals or quest items", () => {
  const npc = getNpc("sect_shaolin_abbot_huiyuan")!;
  const rng = seeded(5);
  for (let i = 0; i < 200; i++) {
    const rarity = (1 + (i % 4)) as 1 | 2 | 3 | 4;
    const gift = pickLetterGift(npc, rarity, rng);
    if ("gold" in gift) { assert.ok(gift.gold > 0); continue; }
    const item = getItem(gift.itemId);
    assert.ok(giftable(item), gift.itemId);
    assert.ok(Math.min(4, giftWorth(item!.price ?? 0)) <= rarity);
  }
});

check("letters: a friend's letter lands in the inbox at most once a day, then the NPC waits", () => {
  newGame();
  const npcId = "sect_shaolin_abbot_huiyuan";
  const s = JSON.parse(JSON.stringify(useWorldStore.getState())) as ReturnType<typeof store>;
  s.npcStates = { [npcId]: { met: true, relationship: 500 } };
  s.traits = { ...s.traits, fame: 500 };
  s.playerBuild = { ...s.playerBuild!, stats: { ...s.playerBuild!.stats, LUK: 500 } };
  assert.deepEqual(letterWriters(s).map((n) => n.id), [npcId]);
  s.day = 40;
  const sent = rollLetters(s, 10, seeded(3));
  assert.ok(sent.length >= 1 && sent.length <= 3, `${sent.length} letters over 7 days with a 15-day cooldown`);
  assert.equal(new Set(sent.map((l) => l.day)).size, sent.length, "one letter a day");
  assert.equal(s.letters.length, sent.length);
  assert.equal(s.letterDays[npcId], sent[sent.length - 1].day);
  assert.deepEqual(letterWriters(s), [], "on cooldown");
});

check("letters: opening one only reads it; รับของ takes the gift once; รับทั้งหมด takes every gift left", () => {
  newGame();
  const letter = { id: "letter_test", day: 1, npcId: "sect_shaolin_abbot_huiyuan", text: "ทดสอบ", rarity: 2, itemId: "potion", count: 2, read: false, claimed: false };
  const goldLetter = { id: "letter_gold", day: 2, npcId: "sect_shaolin_abbot_huiyuan", text: "ทอง", rarity: 1, gold: 100, read: false, claimed: false };
  useWorldStore.setState({ letters: [letter, goldLetter] });
  const before = store().inventory.potion ?? 0;
  const gold = store().gold;
  assert.ok(store().readLetter("letter_test").ok);
  assert.equal(store().inventory.potion ?? 0, before, "reading takes nothing");
  assert.ok(store().letters[0].read && !store().letters[0].claimed);
  const result = store().claimLetterGift("letter_test");
  assert.ok(result.ok && result.gift);
  assert.equal(store().inventory.potion, before + 2);
  assert.ok(store().letters[0].claimed);
  assert.equal(store().claimLetterGift("letter_test").ok, false, "a gift is taken once");
  assert.equal(store().inventory.potion, before + 2);
  const all = store().claimAllLetterGifts();
  assert.deepEqual(all.gifts.length, 1);
  assert.equal(store().gold, gold + 100);
  assert.ok(store().letters[1].read && store().letters[1].claimed, "claiming reads it too");
  assert.equal(store().claimAllLetterGifts().ok, false, "nothing left to take");
  assert.equal(store().readLetter("nope").ok, false);
});

check("letters: time passing in the store delivers letters from friends", () => {
  newGame();
  const npcId = "sect_shaolin_abbot_huiyuan";
  useWorldStore.setState({ npcStates: { [npcId]: { met: true, relationship: 500 } }, traits: { ...store().traits, fame: 500 } });
  const random = Math.random;
  Math.random = seeded(9);
  setTestClock(msAtWorld(store().day, store().time));
  const day = store().day;
  try { for (let i = 0; i < 30; i++) { advanceTestClock(12); store().syncClock(); } } finally { Math.random = random; setTestClock(null); }
  assert.equal(store().day, day + 30, "a month of the world clock");
  assert.ok(store().letters.length > 0, "a friend wrote within a month");
});

// ─── Horse stations ──────────────────────────────────────────────────
check("stations: every city, village and joinable sect's grounds — and nothing else", () => {
  const ids = stationIds();
  for (const id of ids) assert.ok(/^(city|village)_/.test(id) || Object.values(SECT_MEMBERSHIPS).some((m) => m.hallLocationId === id), id);
  assert.ok(ids.includes("city_capital") && ids.includes("sect_shaolin") && ids.includes("village_noname"));
  assert.ok(!hasStation("cave_bingcan") && !hasStation("home_player") && !hasStation("inn_youjian"));
  assert.ok(ids.length >= 25, `${ids.length} stations`);
});

check("stations: fares grow with distance; only visited station places are offered", () => {
  const near = stationFare("city_capital", "city_changan"), far = stationFare("city_capital", "city_xixia");
  assert.ok(far.gold > near.gold && far.hours >= near.hours && near.hours >= 1);
  const trips = stationTrips({ visitedLocationIds: ["city_capital", "city_xixia", "cave_bingcan"] }, "city_capital");
  assert.deepEqual(trips.map((t) => t.to), ["city_xixia"]);
  assert.deepEqual(stationTrips({ visitedLocationIds: ["city_xixia"] }, "cave_bingcan"), [], "no station here");
});

check("stations: riding pays the fare and arrives at once", () => {
  newGame();
  useWorldStore.setState({ currentSceneId: "city_capital", visitedLocationIds: ["city_capital", "city_xixia"], gold: 1000 });
  const fare = stationFare("city_capital", "city_xixia");
  const { day, time } = store();
  assert.ok(store().stationTravel("city_xixia").ok);
  assert.equal(store().currentSceneId, "city_xixia");
  assert.equal(store().gold, 1000 - fare.gold);
  assert.ok(store().day * 12 + store().time < day * 12 + time + 0.5, "no time of its own: the world clock runs on");
  useWorldStore.setState({ gold: 0 });
  assert.equal(store().stationTravel("city_capital").reason, "gold");
});

// ─── Ferries ─────────────────────────────────────────────────────────
check("ferries: the islands are sailed to, never walked; the boatman waits at the ports and on every island", () => {
  const stops = ferryStops();
  const isles = Object.keys(WORLD_COORDS).filter((id) => id.startsWith("isle_"));
  assert.equal(isles.length, 10);
  for (const id of [...FERRY_PORTS, ...isles]) assert.ok(stops.includes(id) && hasFerry(id), id);
  assert.ok(!hasFerry("city_capital") && !hasFerry("cave_bingcan"));
  for (const id of isles) {
    const scene = getScene(id);
    assert.ok(scene?.kind === "location" && scene.routes.length === 0, `${id}: no road leads off it`);
    assert.ok(FERRY_LANDINGS[id] || getLocationMap(id), `${id}: a map for the boatman to stand on`);
  }
  const near = ferryFare("city_suzhou", "isle_taohua"), far = ferryFare("city_suzhou", "isle_boni");
  assert.ok(far.gold > near.gold && near.gold >= FERRY_FARE.baseGold);
  assert.deepEqual(ferryTrips("city_capital"), [], "no boat from inland");
  assert.equal(ferryTrips("isle_taohua").length, stops.length - 1, "any other pier, visited or not");
});

check("ferries: the boat ride pays the fare and lands at once; too poor stays ashore", () => {
  newGame();
  useWorldStore.setState({ currentSceneId: "city_suzhou", gold: 1000 });
  const fare = ferryFare("city_suzhou", "isle_taohua");
  assert.ok(store().ferryTravel("isle_taohua").ok);
  assert.equal(store().currentSceneId, "isle_taohua");
  assert.equal(store().gold, 1000 - fare.gold);
  assert.ok(store().visitedLocationIds.includes("isle_taohua"));
  assert.equal(store().ferryTravel("city_capital").reason, "unknown", "the boat only calls at piers");
  useWorldStore.setState({ gold: 0 });
  assert.equal(store().ferryTravel("city_suzhou").reason, "gold");
  useWorldStore.setState({ currentSceneId: "city_capital", gold: 1000 });
  assert.equal(store().ferryTravel("isle_taohua").reason, "no-ferry");
});

check("ferries: the guide walks to a port and points at the boatman for the crossing", () => {
  newGame();
  useWorldStore.setState({ currentSceneId: "city_suzhou", lastLocationId: "city_suzhou", flags: { ...store().flags, [WAYPOINT_FLAG]: "isle_boni" } });
  const guide = navigationGuide(store())!;
  assert.equal(guide.locationId, "isle_boni");
  assert.deepEqual(guide.path, ["city_suzhou", "isle_boni"]);
  assert.equal(guideMarkerId(store(), guide), FERRYMAN.markerId);
  // From inland the walk heads for a port first.
  useWorldStore.setState({ currentSceneId: "city_capital", lastLocationId: "city_capital" });
  const inland = navigationGuide(store())!;
  assert.ok(FERRY_PORTS.includes(inland.path[inland.path.length - 2] as never), inland.path.join(" → "));
  // Reaching the waypoint ends it.
  useWorldStore.setState({ currentSceneId: "city_suzhou", gold: 1000 });
  store().ferryTravel("isle_boni");
  assert.equal(store().flags[WAYPOINT_FLAG], undefined);
});

// ─── Tournament ──────────────────────────────────────────────────────
check("tournament: a 360-day year; registration from day 60, the tournament on day 90 (+2 days' grace)", () => {
  assert.equal(yearOf(1), 1); assert.equal(yearOf(361), 2); assert.equal(dayOfYear(361), 1);
  assert.equal(tournamentDay(2), 360 + 90);
  assert.equal(tournamentPhase(59), "closed");
  assert.equal(tournamentPhase(60), "registration");
  assert.equal(tournamentPhase(90), "day");
  assert.equal(tournamentPhase(92), "day");
  assert.equal(tournamentPhase(93), "closed");
});

check("tournament: 31 NPC entrants led by the living liveness roster, all distinct fighters", () => {
  newGame();
  const entrants = drawEntrants(store(), 31, seeded(1));
  assert.equal(entrants.length, 31);
  assert.equal(new Set(entrants).size, 31);
  for (const id of namedNpcIds()) assert.ok(entrants.includes(id), `${id} enters`);
});

check("tournament: stronger fighters win simulated bouts more often", () => {
  assert.ok(boutOdds(200, 100) > 0.9);
  assert.equal(boutOdds(150, 150), 0.5);
});

check("tournament: register on Mount Hua in the window, fight round by round, get paid", () => {
  // The world clock is pinned: the store brings every action to it.
  setTestWorldTime(70, 1);
  try {
    newGame();
    assert.equal(TOURNAMENT.locationId, "sect_huashan");
    assert.equal(TOURNAMENT_NAME, "ชุมนุมประลองกระบี่หัวซาน");
    useWorldStore.setState({ day: 70, gold: 500, currentSceneId: "city_capital" });
    assert.equal(registerBlock(store()), "elsewhere", "not at the capital any more");
    useWorldStore.setState({ currentSceneId: "sect_huashan" });
    assert.equal(registerBlock(store()), null);
    assert.ok(store().registerTournament());
    assert.equal(store().gold, 400);
    assert.equal(registerBlock(store()), "registered");
    assert.equal(startBlock(store()), "closed", "not before the day");
    setTestWorldTime(90, 1);
    useWorldStore.setState({ day: 90 });
    assert.ok(store().fightTournamentBout(), "starts the bracket and queues the first bout");
    const t = currentTournament(store())!;
    assert.equal(t.status, "running");
    assert.equal(t.rounds[0].length, 32);
    assert.ok(t.rounds[0].includes(PLAYER));
    const pb = store().pendingBattle!;
    assert.ok(pb.tournament && pb.nonFatal);
    // Win the first bout (the battle store's result).
    useBattleStore.setState({ state: { winner: "A", units: [], skillUses: {}, artUses: {}, hitsReceived: {}, hA: 100, mpA: 50 } as never });
    const gold = store().gold;
    store().acknowledgeBattleResult();
    const after = currentTournament(store())!;
    assert.equal(after.round, 1);
    assert.equal(after.rounds[1].length, 16);
    assert.ok(after.rounds[1].includes(PLAYER));
    assert.equal(store().gold, gold + BOUT_GOLD[0]);
    // Lose the next: out in the last 16, the rest simulated to a champion.
    assert.ok(store().fightTournamentBout());
    useBattleStore.setState({ state: { winner: "B", units: [], skillUses: {}, artUses: {}, hitsReceived: {}, hA: 0, mpA: 0 } as never });
    store().acknowledgeBattleResult();
    const done = currentTournament(store())!;
    assert.equal(done.status, "finished");
    assert.equal(done.playerPlace, PLACE_BY_ROUND[1]);
    assert.ok(done.champion && done.champion !== PLAYER);
    assert.ok(done.championPick, "an NPC champion picks too");
    assert.equal(store().tournamentHistory.at(-1)?.year, 1);
    assert.ok(store().currentHp! >= 1, "tournament defeats are never fatal");
  } finally { setTestClock(null); }
});

check("tournament: the champion picks one move or art from the entrants and learns it", () => {
  setTestWorldTime(90, 1);
  try {
    newGame();
    useWorldStore.setState({ day: 90, gold: 500, currentSceneId: "sect_huashan" });
    store().registerTournament();
    store().fightTournamentBout();
    const rng = seeded(4);
    // Win every bout.
    const s = JSON.parse(JSON.stringify(useWorldStore.getState())) as ReturnType<typeof store>;
    for (let round = 0; round < 5; round++) resolveRound(s, true, rng);
    const t = currentTournament(s)!;
    assert.equal(t.champion, PLAYER);
    assert.equal(t.playerPlace, 1);
    assert.ok(t.pickOptions && t.pickOptions.length > 5);
    assert.deepEqual(prizeOptions(t, s.playerBuild), t.pickOptions);
    useWorldStore.setState({ tournament: t, tournamentHistory: s.tournamentHistory, pendingBattle: null });
    const pick = t.pickOptions[0];
    assert.ok(store().pickTournamentPrize(pick));
    const build = store().playerBuild!;
    const learned = pick.startsWith("art:") ? build.learnedArtIds?.includes(pick.slice(4)) : build.learnedSkillIds?.includes(pick);
    assert.ok(learned, `learned ${pick}`);
    assert.equal(store().pickTournamentPrize(t.pickOptions[1]), false, "one pick only");
  } finally { setTestClock(null); }
});

check("tournament: a year without the hero is fought among the NPCs; a skipped registration is forfeit", () => {
  newGame();
  const s = JSON.parse(JSON.stringify(useWorldStore.getState())) as ReturnType<typeof store>;
  s.day = 75; s.gold = 500; s.currentSceneId = "city_capital";
  s.tournament = { year: 1, status: "registered", rounds: [], round: 0, playerOut: false, gold: 0, wExp: 0 };
  s.day = 95;
  settleTournaments(s, seeded(2));
  const record = s.tournamentHistory.find((r) => r.year === 1)!;
  assert.ok(record && record.champion !== PLAYER);
  assert.equal(record.playerPlace, undefined);
  assert.equal(s.tournament?.rounds[0].length, 32);
  assert.ok(!s.tournament!.rounds[0].includes(PLAYER));
  settleTournaments(s, seeded(2));
  assert.equal(s.tournamentHistory.filter((r) => r.year === 1).length, 1, "settled once");
  assert.equal(playerOpponent(s.tournament), null);
  assert.equal(roundPairs(s.tournament!, 0).length, 16);
});

check("letters: deleting one with a gift not yet taken throws the gift away (the window asks first); read ones go in one sweep", () => {
  store().startNewGame({ newWorld: true, name: "ผู้ทดสอบ", gender: "female" } as never);
  const before = store().inventory.potion ?? 0;
  useWorldStore.setState({ letters: [
    { id: "keep_gift", day: 1, npcId: "sect_shaolin_abbot_huiyuan", text: "x", rarity: 2, itemId: "potion", count: 2, read: false, claimed: false },
    { id: "read_one", day: 2, npcId: "sect_shaolin_abbot_huiyuan", text: "y", rarity: 1, gold: 100, read: true, claimed: true },
  ] });
  const gold = store().gold;
  const r = store().deleteLetters(["keep_gift"]);
  assert.equal(r.deleted, 1);
  assert.equal(r.discarded, 1, "the untaken gift went with it");
  assert.equal(store().inventory.potion ?? 0, before);
  assert.deepEqual(store().letters.map((l) => l.id), ["read_one"]);
  assert.equal(store().deleteLetters(["read_one"]).deleted, 1);
  assert.equal(store().gold, gold, "deleting pays nothing");
  assert.equal(store().letters.length, 0);
  assert.equal(store().deleteLetters(["nope"]).ok, false);
});

check("ฉายา: a crown, a price on the head, the top of a sect, then the strongest trait", () => {
  const base = { traits: { good: 0, evil: 0, arrogance: 0, humility: 0, fame: 0 }, tournamentHistory: [], sectMembership: {}, wanted: 0 };
  assert.equal(heroEpithet(base), NEWCOMER_EPITHET);
  assert.equal(heroEpithet({ ...base, traits: { ...base.traits, good: 30, fame: 10 } }), "จอมยุทธ์ผู้ทรงธรรม");
  assert.equal(heroEpithet({ ...base, traits: { ...base.traits, evil: 70, good: 20 } }), "มารร้ายแห่งยุทธภพ");
  const top = SECT_MEMBERSHIPS.wudang;
  assert.equal(heroEpithet({ ...base, sectMembership: { wudang: { rank: top.topRank, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 0, status: "active" } } } as never), `ประมุขแห่ง${top.name}`);
  assert.equal(heroEpithet({ ...base, wanted: 3, traits: { ...base.traits, good: 90 } }), "ผู้ต้องหาที่ทางการตามล่า");
  assert.equal(heroEpithet({ ...base, wanted: 5, tournamentHistory: [{ year: 1, champion: PLAYER }] }), "ยอดกระบี่แห่งเขาหัวซาน");
});

check("ฉายา: mixes of traits at 60+ — the widest mix, then the higher total; above wanted and sect rank", () => {
  const base = { traits: { good: 0, evil: 0, arrogance: 0, humility: 0, fame: 0 }, tournamentHistory: [], sectMembership: {}, wanted: 0 };
  const t = (traits: Partial<typeof base.traits>) => heroEpithet({ ...base, traits: { ...base.traits, ...traits } });
  assert.equal(t({ good: 61, evil: 61 }), "คนบ้าแปลกประหลาด");
  assert.equal(t({ evil: 70, arrogance: 65 }), "จอมมารโดยเนื้อแท้");
  assert.equal(t({ good: 59, evil: 80 }), "มารร้ายแห่งยุทธภพ", "every trait of a mix must reach 60");
  assert.equal(t({ evil: 70, arrogance: 65, fame: 60 }), "ราชาปีศาจครองยุทธภพ", "three traits beat two");
  assert.equal(t({ good: 60, evil: 60, arrogance: 60, humility: 60, fame: 60 }), "เทพเซียนผู้ข้ามพ้นดีชั่ว");
  assert.equal(t({ good: 90, humility: 61, fame: 60, evil: 0 }), "ปรมาจารย์ผู้ค้ำจุนแผ่นดิน");
  // Two pairs at once: the higher total wins (good+fame 190 over good+humility 160).
  assert.equal(t({ good: 100, fame: 90, humility: 60 }), "ปรมาจารย์ผู้ค้ำจุนแผ่นดิน");
  assert.equal(t({ good: 100, fame: 90, humility: 59 }), "วีรชนแห่งแผ่นดิน");
  assert.equal(heroEpithet({ ...base, wanted: 4, traits: { ...base.traits, evil: 60, arrogance: 60 } }), "จอมมารโดยเนื้อแท้");
  assert.equal(heroEpithet({ ...base, tournamentHistory: [{ year: 1, champion: PLAYER }], traits: { ...base.traits, evil: 60, arrogance: 60 } }), "ยอดกระบี่แห่งเขาหัวซาน", "a crown still wins");
  // Every mix is a distinct set of traits with its own name.
  const keys = COMBO_EPITHETS.map((c) => [...c.traits].sort().join("+"));
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(COMBO_EPITHETS.map((c) => c.name)).size, COMBO_EPITHETS.length);
  assert.equal(COMBO_EPITHETS.filter((c) => c.traits.length === 2).length, 10, "every pair of the five traits has a name");
});

check("tournament: the day registration opens, Huashan's chief sends an invitation with the fee for the road — once a year", () => {
  newGame();
  const host = tournamentHost(store());
  assert.equal(host, "sect_huashan_master_yiqing");
  useWorldStore.setState({ day: 59, time: 11, letters: [] });
  const before = store().letters.length;
  const draft = { ...store(), letters: [...store().letters], day: 60 } as never as Parameters<typeof sendTournamentInvitation>[0];
  const letter = sendTournamentInvitation(draft, 59)!;
  assert.ok(letter, "a letter on day 60");
  assert.equal(letter.npcId, host);
  assert.equal(letter.gold, TOURNAMENT.fee);
  assert.ok(letter.text.includes(TOURNAMENT_NAME) && letter.text.includes("หัวซาน"));
  assert.equal(sendTournamentInvitation(draft, 59), null, "once a year");
  assert.equal(draft.letters.length, before + 1);
  // Through the store: the world clock crossing into day 60 delivers it to the inbox.
  setTestWorldTime(59, 11);
  newGame();
  useWorldStore.setState({ day: 59, time: 11, letters: [], currentSceneId: "village_noname", lastLocationId: "village_noname" });
  setTestWorldTime(60, 1);
  store().syncClock();
  setTestClock(null);
  assert.ok(store().day >= 60);
  assert.ok(store().letters.some((l) => l.id === "letter_invite_1" && l.gold === TOURNAMENT.fee));
  assert.ok(store().actionLog.some((e) => e.message.includes("จดหมายเชิญ")));
});

console.log(`\n${passed} systems checks passed.`);
