// Foes, habitats, tier 5 and the legendary beasts (docs/design/foes-and-bosses.md):
// the booster, where every foe lives and spawns, the grounded categories,
// T5 and boss power, boss lairs / respawn / spoils, victory w-exp and the v26 save.
import assert from "node:assert/strict";
import { getSkill } from "../lib/game";
import { powerScore } from "../lib/game/power-tier";
import {
  BOOST_NPC, BOOST_T3, BOOST_T4, OPPONENTS, boostBuild, boostFactorOf, getOpponent, unboostedBuild,
} from "../lib/world/data/opponents";
import { FIGHT_EVENTS, FOE_SPAWN, fightEventsForLocation, tierWeightForPower } from "../lib/world/data/random-events";
import { BIOMES, FOE_HABITATS, PLACE_BIOMES, biomesOf, foeLivesAt, isTownScene } from "../lib/world/data/habitats";
import { BOSSES, BOSS_RESPAWN_DAYS, bossAlive, bossesAt, getBoss } from "../lib/world/data/bosses";
import { SCENES } from "../lib/world/data/scenes";
import { getItem } from "../lib/world/data/items";
import { itemIconId } from "../lib/world/data/item-icons";
import { getLocationMap } from "../lib/world/data/location-maps";
import { getQuest, QUESTS } from "../lib/world/data/quests";
import { rollFoeSpawn } from "../lib/world/encounters";
import { bossSlain, dropsGold, moveXpMultiplier, victoryWExp } from "../lib/world/victory";
import { validateAndRepair } from "../lib/world/validate";
import { ENEMY_CATEGORY_LABEL, type OpponentDef, type QuestStage } from "../lib/world/types";
import { nearestWorldGround, planWorldPath, worldFootprints, worldPointBlocked } from "../lib/stage/world-navigation";
import { getAnimSheet } from "../lib/characters/anim-sheets";
import { migrateSave } from "../store/world/persist";
import { rollVictorySpoils } from "../store/world/spoils";
import { useWorldStore } from "../store/world-store";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }
const withRandom = (value: number, run: () => void) => { const r = Math.random; Math.random = () => value; try { run(); } finally { Math.random = r; } };
const seeded = (seed: number) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
function withSeed<T>(seed: number, run: () => T): T { const r = Math.random; Math.random = seeded(seed); try { return run(); } finally { Math.random = r; } }

function freshState() {
  useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  return JSON.parse(JSON.stringify(useWorldStore.getState())) as ReturnType<typeof useWorldStore.getState>;
}

const LOCATIONS = SCENES.filter((s) => s.kind === "location").map((s) => s.id);
const ROADS = SCENES.filter((s) => s.kind === "route" && /^route_.+__to__.+$/.test(s.id)).map((s) => s.id);
const FIGHT_IDS = [...new Set(FIGHT_EVENTS.map((ev) => ev.opponentId))];
const ratio = (o: OpponentDef) => powerScore(o.build()) / powerScore(unboostedBuild(o.id)!);

check("booster: T3 ×1.6, T4 ×1.45, people ×1.4 (the larger of both); T5 and bosses as authored", () => {
  const near = (got: number, want: number, what: string) => assert.ok(Math.abs(got - want) <= 0.03, `${what}: ×${got.toFixed(3)} (want ×${want})`);
  // The booster itself: power grows by the factor, stats in proportion.
  const sample = getOpponent("bandit")!.build();
  const boosted = boostBuild(sample, 1.5);
  near(powerScore(boosted) / powerScore(sample), 1.5, "boostBuild");
  assert.ok(boosted.stats.STR >= sample.stats.STR && boosted.stats.INT >= sample.stats.INT);
  assert.equal(boostBuild(sample, 1), sample);
  let t3 = 0, t4 = 0, npc = 0;
  for (const o of OPPONENTS) {
    const factor = boostFactorOf(o);
    if (o.boss || (o.ti ?? 0) >= 5) { assert.equal(factor, 1, `${o.id} is authored at target`); continue; }
    const person = o.id.startsWith("spar_") || o.id.startsWith("hunter_") || !!o.look?.npc;
    const want = Math.max(o.ti === 3 ? BOOST_T3 : o.ti === 4 ? BOOST_T4 : 1, person ? BOOST_NPC : 1);
    assert.equal(factor, want, o.id);
    if (want > 1) near(ratio(o), want, o.id);
    if (o.ti === 3) t3++;
    if (o.ti === 4) t4++;
    if (person) npc++;
  }
  assert.ok(t3 >= 10 && t4 >= 10 && npc >= 30, `${t3} T3, ${t4} T4, ${npc} people`);
  // Anyone fought as themselves (npc@ / lawnpc@).
  for (const [id, want] of [["npc@x@30@-", BOOST_NPC], ["npc@x@70@-", BOOST_T3], ["npc@x@95@-", BOOST_T4]] as const) {
    const o = getOpponent(id)!;
    near(ratio(o), want, id);
    near(powerScore(getOpponent(`lawnpc@${id}`)!.build()) / powerScore(unboostedBuild(id)!), want, `lawnpc@${id}`);
  }
});

check("habitats: every place and road has biomes; every walk-tick foe lives somewhere a hero can go", () => {
  for (const id of [...LOCATIONS, ...ROADS]) {
    const biomes = biomesOf(id);
    for (const b of biomes) assert.ok(BIOMES.includes(b), `${id}: ${b}`);
    if (!["jail", "world_journey", "home_player"].includes(id)) assert.ok(biomes.length > 0, `${id} has biomes`);
  }
  for (const s of SCENES) if (s.kind === "route") assert.ok(PLACE_BIOMES[s.id], `${s.id} is in PLACE_BIOMES`);
  for (const id of FIGHT_IDS) {
    assert.ok(getOpponent(id), id);
    assert.ok(FOE_HABITATS[id]?.length, `${id} has a habitat`);
    assert.ok(LOCATIONS.some((loc) => foeLivesAt(id, loc)) || ROADS.some((r) => foeLivesAt(id, r)), `${id} lives somewhere`);
  }
  for (const id of Object.keys(FOE_HABITATS)) assert.ok(FIGHT_IDS.includes(id), `${id}: a habitat but no fight event`);
  // Town foes: thieves, drunks and ruffians only.
  const town = FIGHT_IDS.filter((id) => FOE_HABITATS[id]!.includes("town")).sort();
  assert.deepEqual(town, ["drunk_brawler", "fortune_thief", "petty_thief", "ruffian"]);
  // A few that must make sense.
  for (const [foe, place] of [["desert_marauder", "desert_ruins"], ["river_pirate", "isle_boni"], ["snow_leopard", "mt_kunlun_immortal"],
    ["frost_wolf", "cliff_motian"], ["viper_snake", "cave_jinshe"], ["vampire_bat", "cave_zhizhu"], ["petty_thief", "city_capital"]] as const) {
    assert.ok(foeLivesAt(foe, place), `${foe} at ${place}`);
  }
  for (const [foe, place] of [["desert_marauder", "isle_boni"], ["river_pirate", "desert_ruins"], ["snow_leopard", "valley_hudie"],
    ["bandit", "city_capital"], ["wild_wolf", "sect_wudang"]] as const) {
    assert.ok(!foeLivesAt(foe, place), `no ${foe} at ${place}`);
  }
});

check("every wild place and every road has foes, early and late; settled places are town", () => {
  for (const id of [...LOCATIONS, ...ROADS]) {
    if (isTownScene(id) || !biomesOf(id).length) continue;
    for (const power of [0, 1]) assert.ok(fightEventsForLocation(id, power).length > 0, `${id} has foes at power ${power}`);
    for (const ev of fightEventsForLocation(id, 1)) assert.ok(foeLivesAt(ev.opponentId, id), `${ev.opponentId} at ${id}`);
  }
  for (const id of ["city_capital", "village_qigu", "sect_wudang", "inn_yuelai", "home_hong", "village", "tavern"]) assert.ok(isTownScene(id), id);
  for (const id of ["cave_jinshe", "desert_ruins", "route_home_player__to__city_capital"]) assert.ok(!isTownScene(id), id);
});

check("tier 5 opens at power 0.6 and stays rarer than T4", () => {
  for (const p of [0, 0.3, 0.59]) assert.equal(tierWeightForPower(5, p), 0);
  for (const p of [0.6, 0.8, 1]) {
    assert.ok(tierWeightForPower(5, p) > 0);
    assert.ok(tierWeightForPower(5, p) < tierWeightForPower(4, p));
  }
  const t5 = FIGHT_IDS.filter((id) => getOpponent(id)?.ti === 5);
  assert.equal(t5.length, 6);
  assert.ok(!fightEventsForLocation("mt_kunlun", 0.5).some((ev) => t5.includes(ev.opponentId)));
  assert.ok(fightEventsForLocation("mt_kunlun", 1).some((ev) => t5.includes(ev.opponentId)));
});

check("no foe spawns outside its habitat — not strays, not a hunted quarry, not in town", () => {
  const sample = [...LOCATIONS.filter((_, i) => i % 3 === 0), ...ROADS.filter((_, i) => i % 9 === 0), "city_capital", "cave_jinshe", "desert_ruins"];
  for (const power of [0, 1]) {
    for (const id of sample) {
      const state = freshState();
      state.currentSceneId = id;
      state.day = power ? 400 : 1;
      withSeed(id.length * 31 + power, () => {
        for (let i = 0; i < 60; i++) {
          const foe = rollFoeSpawn(state, 0);
          if (!foe) continue;
          assert.ok(foeLivesAt(foe, id), `${foe} spawned at ${id}`);
          assert.ok(!isTownScene(id), `a stray ${foe} in town ${id}`);
        }
      });
    }
  }
  // Hunting: the quarry comes only where it lives.
  const quest = QUESTS.find((q) => q.stages.some((s) => s.autoAdvance?.t === "defeatedOpponent" && s.autoAdvance.opponentId === "bandit"))!;
  const stage = quest.stages.findIndex((s) => s.autoAdvance?.t === "defeatedOpponent" && s.autoAdvance.opponentId === "bandit");
  for (const [where, ok] of [["city_capital", false], ["desert_ruins", false], ["isle_boni", false], ["cliff_heimu", true]] as const) {
    const state = freshState();
    state.currentSceneId = where;
    state.quests[quest.id] = { id: quest.id, status: "active", stage } as never;
    const seen = new Set<string>();
    withSeed(7, () => { for (let i = 0; i < 80; i++) { const f = rollFoeSpawn(state, 0); if (f) seen.add(f); } });
    assert.equal(seen.has("bandit"), ok, `hunted bandit at ${where}: ${[...seen].join(",")}`);
    if (where === "city_capital") assert.equal(seen.size, 0, "no stray in town while hunting elsewhere");
    if (where === "cliff_heimu") assert.deepEqual([...seen], ["bandit"], "only the quarry while hunting where it lives");
  }
  // A town quarry still comes to town (the main story's hired thieves).
  const city = freshState();
  city.currentSceneId = "city_capital";
  city.quests.st_main_02 = { id: "st_main_02", status: "active", stage: 0 } as never;
  const got = new Set<string>();
  withSeed(3, () => { for (let i = 0; i < 40; i++) { const f = rollFoeSpawn(city, 0); if (f) got.add(f); } });
  assert.deepEqual([...got], ["petty_thief"]);
  assert.ok(FOE_SPAWN.maxPerMap >= 3);
});

check("every kill-quest quarry can be found: a place where it roams, a hunting ground, or a duel", () => {
  const pools = new Map(LOCATIONS.map((id) => [id, new Set(fightEventsForLocation(id, 1).map((ev) => ev.opponentId))]));
  const missing: string[] = [];
  for (const q of QUESTS) {
    for (const s of q.stages as QuestStage[]) {
      if (s.autoAdvance?.t !== "defeatedOpponent") continue;
      const id = s.autoAdvance.opponentId;
      if (!FIGHT_IDS.includes(id)) continue; // story / place foes come from scene duels, hunts from nodes
      if (![...pools.values()].some((pool) => pool.has(id))) missing.push(`${q.id}:${s.id} → ${id}`);
    }
  }
  assert.deepEqual(missing, []);
  assert.ok(getQuest("st_main_02"));
});

check("grounded wuxia: only people and beasts; the old spirits are gone or renamed", () => {
  assert.deepEqual(Object.keys(ENEMY_CATEGORY_LABEL).sort(), ["beast", "human"]);
  for (const o of OPPONENTS) assert.ok(o.category === undefined || o.category === "human" || o.category === "beast", `${o.id}: ${o.category}`);
  for (const gone of ["snow_demon", "ghost_swordsman", "dragon_phoenix_master", "immortal_warrior", "elite_blood_rakshasa", "elite_demon_emperor"]) {
    assert.equal(getOpponent(gone), null, `${gone} is gone`);
    assert.ok(!FIGHT_IDS.includes(gone));
  }
  assert.equal(getOpponent("snow_leopard")?.category, "beast");
  assert.equal(getOpponent("snow_leopard")?.name, "เสือดาวหิมะ");
  assert.equal(getOpponent("shadowless_swordsman")?.category, "human");
  assert.equal(getOpponent("shadowless_swordsman")?.name, "จอมกระบี่ไร้เงา");
  assert.equal(getOpponent("st_jh_lone_sword_shadow")?.category, "human");
  assert.equal(getOpponent("st_jh_nine_yang_white_ape")?.category, "beast");
  // No quest text still calls them spirits or snow demons.
  const text = JSON.stringify(QUESTS);
  for (const word of ["ปีศาจหิมะ", "วิญญาณจอมกระบี่"]) assert.ok(!text.includes(word), `quests still say ${word}`);
});

check("tier 5: six foes, power 520–900 at stat scale 1, animated sheets", () => {
  const t5 = OPPONENTS.filter((o) => o.ti === 5 && !o.boss);
  assert.deepEqual(t5.map((o) => o.id).sort(), ["t5_blood_blade_lord", "t5_iron_monk", "t5_nameless_sword_hermit", "t5_poison_matriarch", "t5_white_tiger", "t5_wolf_king"]);
  for (const o of t5) {
    const score = powerScore(o.build());
    assert.ok(score >= 520 && score <= 900, `${o.id} power ${score}`);
    assert.equal(o.look?.anim, o.id);
    assert.ok(getAnimSheet(o.id), `${o.id} has a sheet`);
    console.log(`  ${o.id}: ${score}`);
  }
  assert.equal(getOpponent("t5_white_tiger")?.category, "beast");
  assert.equal(getOpponent("t5_wolf_king")?.category, "beast");
  assert.ok(JSON.stringify(getOpponent("t5_wolf_king")?.pack).includes("wolf"), "the wolf king brings wolves");
});

check("legendary beasts: six bosses, power 1100–1600, minions, lairs on a reachable free spot", () => {
  assert.equal(BOSSES.length, 6);
  const regions = new Set<string>();
  for (const boss of BOSSES) {
    const o = getOpponent(boss.id)!;
    assert.ok(o, boss.id);
    assert.equal(o.name, boss.name);
    assert.equal(o.ti, 5); assert.equal(o.category, "beast"); assert.equal(o.boss, true);
    assert.equal(o.look?.anim, boss.id);
    assert.ok(getAnimSheet(boss.id), `${boss.id} has a sheet`);
    assert.ok(o.pack && JSON.stringify(o.pack).length > 2, `${boss.id} brings minions`);
    const build = o.build();
    assert.equal(build.artId, `art_boss_${boss.id.split("_").slice(-1)[0]}`, "its own inner art");
    const own = build.skillIds.filter((id): id is string => !!id && id.startsWith("bss_"));
    assert.equal(own.length, 3, `${boss.id}: three moves of its own`);
    // bss_* moves and art_boss_* arts come from the combat engine; count what exists.
    const score = powerScore(build);
    assert.ok(score >= 1100 && score <= 1600, `${boss.id} power ${score} (moves present: ${own.filter((id) => getSkill(id)).length}/3)`);
    console.log(`  ${boss.id}: ${score} at ${boss.lair} (${boss.spot.x}, ${boss.spot.y})`);
    assert.equal(boss.respawnDays, BOSS_RESPAWN_DAYS);
    assert.ok(boss.wExp >= 3000 && boss.wExp <= 4000);
    // Lair: a wild place with a painted map; the spot is open ground the hero can walk to, clear of markers.
    const scene = SCENES.find((s) => s.id === boss.lair);
    assert.equal(scene?.kind, "location", boss.lair);
    assert.ok(!isTownScene(boss.lair), `${boss.lair} is wild`);
    const map = getLocationMap(boss.lair)!;
    assert.ok(map, `${boss.lair} has a map`);
    const fp = worldFootprints(boss.lair, map.image);
    const at = { x: boss.spot.x * 9.6, y: boss.spot.y * 6.4 };
    assert.ok(!worldPointBlocked(at, fp), `${boss.id} stands on open ground`);
    const start = nearestWorldGround({ x: map.spawn.x * 9.6, y: map.spawn.y * 6.4 }, fp);
    const path = planWorldPath(start, at, fp);
    const end = path[path.length - 1];
    assert.ok(end && Math.hypot(end.x - at.x, end.y - at.y) <= 8, `${boss.id} can be reached from the spawn`);
    const markers = [map.spawn, ...Object.values(map.npcSpots ?? {}), ...(map.exits ?? []), ...(map.spots ?? [])];
    for (const m of markers) assert.ok(Math.hypot(m.x - boss.spot.x, m.y - boss.spot.y) >= 12, `${boss.id} clear of the marker at ${m.x},${m.y}`);
    // Trophy, lore.
    const trophy = getItem(boss.trophyItemId);
    assert.ok(trophy && (trophy.price ?? 0) >= 5000 && trophy.category === "material", boss.trophyItemId);
    assert.ok(itemIconId(boss.trophyItemId), `${boss.trophyItemId} has an icon`);
    assert.ok(boss.lore.length > 20);
    regions.add(boss.lair);
  }
  assert.equal(regions.size, 6, "one lair each");
});

check("bosses: alive until beaten, back after 90 days; bossesAt; save v26 migrate and repair", () => {
  const state = { day: 100, bossDefeatedDay: {} as Record<string, number> };
  assert.deepEqual(bossesAt(state, "cave_jinshe").map((b) => b.id), ["boss_golden_serpent"]);
  assert.deepEqual(bossesAt(state, "city_capital"), []);
  state.bossDefeatedDay.boss_golden_serpent = 100;
  assert.equal(bossAlive(state, "boss_golden_serpent"), false);
  assert.deepEqual(bossesAt(state, "cave_jinshe"), []);
  state.day = 189; assert.equal(bossAlive(state, "boss_golden_serpent"), false);
  state.day = 190; assert.equal(bossAlive(state, "boss_golden_serpent"), true, "back after 90 days");
  assert.equal(bossAlive(state, "nobody"), false);
  // bossSlain stamps the day and spreads big news.
  const world = freshState();
  world.day = 42;
  const before = world.rumorPool.length;
  assert.equal(bossSlain(world, "boss_flame_bull")?.id, "boss_flame_bull");
  assert.equal(world.bossDefeatedDay.boss_flame_bull, 42);
  assert.equal(world.rumorPool.length, before + 1);
  assert.ok(world.rumorPool.at(-1)!.text.includes("กระทิงยักษ์เขาเพลิง") && world.rumorPool.at(-1)!.weight >= 10);
  // Save: an old save gets an empty table; repair drops unknown ids and bad days.
  const old = migrateSave({ hasGame: true, day: 5 }, 25);
  assert.deepEqual(old.bossDefeatedDay, {});
  const kept = migrateSave({ hasGame: true, day: 5, bossDefeatedDay: { boss_blade_crab: 3 } }, 26);
  assert.deepEqual(kept.bossDefeatedDay, { boss_blade_crab: 3 });
  const broken = freshState();
  broken.bossDefeatedDay = { boss_blade_crab: 3, boss_gone: 4, boss_sun_turtle: "x" as never };
  validateAndRepair(broken);
  assert.deepEqual(broken.bossDefeatedDay, { boss_blade_crab: 3 });
  assert.equal(getBoss("boss_gone"), null);
  // The store: engaging a boss in its lair opens the encounter; elsewhere nothing.
  useWorldStore.getState().startNewGame({ name: "ทดสอบ", gender: "male" } as never);
  useWorldStore.setState({ currentSceneId: "city_capital" });
  useWorldStore.getState().engageBoss("boss_golden_serpent");
  assert.equal(useWorldStore.getState().pendingEncounter, null);
  useWorldStore.setState({ currentSceneId: "cave_jinshe", lastLocationId: "cave_jinshe" });
  useWorldStore.getState().engageBoss("boss_golden_serpent");
  assert.equal(useWorldStore.getState().pendingEncounter?.opponentId, "boss_golden_serpent");
  useWorldStore.getState().acceptEncounter();
  assert.equal(useWorldStore.getState().pendingBattle?.withPack, true, "its minions always come");
  useWorldStore.setState({ pendingBattle: null, pendingEncounter: null });
});

check("spoils: beasts carry no gold; w-exp by kind and tier; beasts and bosses teach double; a boss drops its trophy", () => {
  assert.equal(victoryWExp(getOpponent("petty_thief")), 40);
  assert.equal(victoryWExp(getOpponent("bandit_chief")), 80);
  assert.equal(victoryWExp(getOpponent("wild_dog")), 80);
  assert.equal(victoryWExp(getOpponent("golden_tiger")), 80 + 60 * 3);
  assert.equal(victoryWExp(getOpponent("t5_wolf_king")), 80 + 60 * 5);
  assert.equal(victoryWExp(getOpponent("t5_iron_monk")), 40 + 20 * 5);
  for (const b of BOSSES) assert.equal(victoryWExp(getOpponent(b.id)), b.wExp);
  assert.equal(moveXpMultiplier(getOpponent("brown_bear")), 2);
  assert.equal(moveXpMultiplier(getOpponent("boss_sun_turtle")), 2);
  assert.equal(moveXpMultiplier(getOpponent("bandit")), 1);
  assert.equal(dropsGold(getOpponent("brown_bear")), false);
  assert.equal(dropsGold(getOpponent("bandit")), true);
  const state = freshState();
  for (const [id, gold] of [["brown_bear", false], ["frost_wolf", false], ["boss_blood_tiger", false], ["bandit_chief", true]] as const) {
    const s = withSeed(11, () => rollVictorySpoils(state, { opponentId: id, onWin: "city_capital", onLose: "city_capital" }));
    assert.equal(s.gold > 0, gold, `${id} gold ${s.gold}`);
    assert.equal(s.wExp, victoryWExp(getOpponent(id)));
    if (id.startsWith("boss_")) assert.ok(s.items.some((it) => it.itemId === getBoss(id)!.trophyItemId), "the trophy drops");
  }
  // Every boss drop is a real item.
  for (const b of BOSSES) for (const d of getOpponent(b.id)!.drops ?? []) assert.ok(getItem(d.itemId), d.itemId);
});

console.log(`${checks} foe checks passed`);
