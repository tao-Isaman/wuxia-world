// Habitats: where each foe lives, and what land each place and road is.
//
// A foe turns up only where it lives (`foeLivesAt`): the walk-tick pool
// (`fightEventsForLocation`), a kill quest's quarry (`rollFoeSpawn`) and the
// quest guide's hunting grounds all read it. Places get their biomes by hand;
// a road's come from its painting type (coast / forest / mountain / gorge /
// highway / lane / country, data/route-maps.ts) plus the land it crosses
// (west deserts, north steppe and snow, east waterways, south jungle).
// Settled places (towns, villages, sects, inns, homes…) are `town`: only
// thieves, drunks and ruffians live there, and they show up only as a kill
// quest's quarry (no strays in town). See docs/design/foes-and-bosses.md.

import { LOCATION_ROUTES } from "./location-routes";
import { regionOf } from "./regions";
import { classifyRouteEdge, type RouteMapType } from "./route-maps";

export type Biome = "forest" | "mountain" | "snow" | "desert" | "steppe" | "river"
  | "coast" | "swamp" | "cave" | "road" | "town";

export const BIOMES: readonly Biome[] = ["forest", "mountain", "snow", "desert", "steppe", "river", "coast", "swamp", "cave", "road", "town"];

/** Thai names for the docs and the guide. */
export const BIOME_LABEL: Record<Biome, string> = {
  forest: "ป่า", mountain: "ภูเขา", snow: "หิมะ", desert: "ทะเลทราย", steppe: "ทุ่งหญ้า", river: "ลำน้ำ",
  coast: "ชายฝั่ง", swamp: "บึง", cave: "ถ้ำ", road: "ทางหลวง", town: "ชุมชน",
};

// ─── Places ────────────────────────────────────────────────────────────
// Wild places by hand. Every settled place is `town` (filled in below);
// the jail, the world-journey menu and the hero's home hold no foes.
const WILD_PLACES: Record<string, Biome[]> = {
  // East isles
  isle_taohua: ["coast", "forest"],
  isle_xiake: ["coast", "cave"],
  isle_binghuo: ["coast", "snow"],
  isle_yuanyang: ["coast", "river"],
  isle_wane: ["coast", "swamp"],
  isle_pili: ["coast", "mountain"],
  isle_lingshe: ["coast", "swamp", "forest"],
  isle_boni: ["coast"],
  isle_shenlong: ["coast", "forest"],
  isle_wuming: ["coast", "cave"],
  // Mountains, cliffs and peaks
  mt_baituo: ["mountain", "desert"],
  mt_tiezhang: ["mountain", "forest"],
  mt_wuliang: ["mountain", "forest"],
  mt_kunlun: ["mountain", "snow"],
  mt_kunlun_immortal: ["snow", "mountain"],
  cliff_motian: ["mountain", "snow"],
  cliff_heimu: ["mountain", "forest"],
  cliff_yunhe: ["mountain", "steppe"],
  cliff_siguo: ["mountain"],
  mt_leigu: ["mountain", "steppe"],
  peak_guangming: ["mountain"],
  // Waters
  sea_xingxiu: ["river", "desert", "swamp"],
  pool_heilong: ["river", "swamp", "cave"],
  // Valleys and caves
  valley_jueqing: ["forest", "mountain"],
  valley_jueqing_bottom: ["swamp", "cave"],
  valley_hudie: ["forest", "swamp"],
  valley_baihua: ["forest", "river"],
  cave_bingcan: ["cave", "snow"],
  cave_jinshe: ["cave", "forest", "swamp"],
  cave_zhizhu: ["cave", "forest", "swamp"],
  cave_tangshi: ["cave", "mountain"],
  cave_yangguo: ["cave", "mountain", "forest"],
  cave_treasure: ["cave", "coast"],
  cave_chuangwang: ["cave", "mountain"],
  cave_zixiu: ["cave", "mountain"],
  desert_ruins: ["desert"],
};

/** Places that hold no foes at all (safe ground and menus). */
const NO_FOES = new Set(["jail", "world_journey", "home_player"]);

/** Prefixes of the places people live in (mirrors random-events.ts isSettledPlace). */
const SETTLED = ["city_", "village_", "home_", "inn_", "sect_", "temple_", "palace_", "villa_", "market_", "tribe_"];
/** The opening village and its old tavern are settled too. */
const SETTLED_IDS = new Set(["village", "tavern"]);

function placeBiomes(id: string): Biome[] {
  if (NO_FOES.has(id)) return [];
  if (WILD_PLACES[id]) return WILD_PLACES[id];
  if (SETTLED_IDS.has(id) || SETTLED.some((p) => id.startsWith(p))) return ["town"];
  return [];
}

// ─── Roads ─────────────────────────────────────────────────────────────
const ROAD_TYPE_BIOMES: Record<RouteMapType, Biome[]> = {
  coast: ["coast"],
  forest: ["forest"],
  mountain: ["mountain"],
  gorge: ["mountain"],
  highway: ["road"],
  lane: ["road"],
  country: ["road"],
};

/** A road's biomes: its painting type, plus the land of the regions it crosses. */
export function roadBiomes(src: string, dst: string): Biome[] {
  const type = classifyRouteEdge(src, dst);
  const out = new Set<Biome>(ROAD_TYPE_BIOMES[type]);
  const high = type === "mountain" || type === "gorge";
  for (const region of new Set([regionOf(src), regionOf(dst)])) {
    if (region === "west" && type !== "lane") out.add("desert");
    if (region === "north") out.add(high ? "snow" : "steppe");
    if (region === "east" && (type === "highway" || type === "country")) out.add("river");
    if (region === "south" && type !== "lane") out.add("forest");
  }
  return [...out];
}

const ROUTE_RE = /^route_(.+)__to__(.+)$/;
/** Authored (tutorial) roads with the classic card screen: plain roads. */
const TUTORIAL_ROADS: Record<string, Biome[]> = {
  tavern_road: ["road"], back_road: ["road"], village_to_world: ["road"],
  route_village__to__home_player: ["road"], route_home_player__to__village: ["road"],
};
/** The world-journey menu's category "roads" (cat_*) are menus: nobody walks them. */
const MENU_ROADS = ["cities", "villages", "sects", "isles", "terrain", "caves", "temples", "mansions", "inns", "homes", "misc"].map((c) => `cat_${c}`);

/** Every location and every road (route scene) → its biomes. */
export const PLACE_BIOMES: Record<string, Biome[]> = (() => {
  const out: Record<string, Biome[]> = { ...TUTORIAL_ROADS };
  for (const id of MENU_ROADS) out[id] = [];
  const places = new Set<string>(Object.keys(WILD_PLACES));
  for (const route of LOCATION_ROUTES) {
    places.add(route.a);
    places.add(route.b);
    out[`route_${route.a}__to__${route.b}`] = roadBiomes(route.a, route.b);
    out[`route_${route.b}__to__${route.a}`] = roadBiomes(route.b, route.a);
  }
  for (const id of [...places, ...SETTLED_IDS, ...NO_FOES]) out[id] = placeBiomes(id);
  return out;
})();

/** The biomes of a place or road (an unknown road id is classified on the fly). */
export function biomesOf(sceneId: string): Biome[] {
  const known = PLACE_BIOMES[sceneId];
  if (known) return known;
  const m = ROUTE_RE.exec(sceneId);
  if (m) return roadBiomes(m[1], m[2]);
  return placeBiomes(sceneId);
}

/** A settled place: only town foes live there, and only as a kill quest's quarry. */
export function isTownScene(sceneId: string): boolean {
  return biomesOf(sceneId).includes("town");
}

// ─── Foes ──────────────────────────────────────────────────────────────
/** Where every walk-tick foe (FIGHT_EVENTS) lives. */
export const FOE_HABITATS: Record<string, Biome[]> = {
  // Tier 0
  petty_thief: ["town", "road"],
  drunk_brawler: ["town", "road"],
  wild_dog: ["forest", "steppe", "mountain", "road"],
  wild_chicken: ["forest", "steppe"],
  small_snake: ["swamp", "forest", "cave", "river", "desert", "coast"],
  // Tier 1
  thug: ["road", "river"],
  bandit: ["forest", "mountain", "road", "steppe"],
  ruffian: ["town", "road"],
  wild_beast: ["forest", "mountain"],
  wild_boar: ["forest", "mountain", "steppe"],
  wild_wolf: ["steppe", "forest", "mountain", "snow"],
  road_bandit: ["road", "mountain"],
  river_pirate: ["river", "coast"],
  desert_marauder: ["desert", "steppe"],
  fortune_thief: ["town", "road"],
  vampire_bat: ["cave"],
  bandit_archer: ["forest", "road", "mountain"],
  // Tier 2
  mountain_tiger: ["mountain", "forest"],
  brown_bear: ["forest", "mountain", "cave"],
  viper_snake: ["swamp", "forest", "cave"],
  giant_centipede: ["cave", "swamp", "forest", "desert"],
  bandit_chief: ["mountain", "forest", "road"],
  iron_palm_thug: ["road", "river"],
  flying_swallow: ["road", "river"],
  poison_practitioner: ["swamp", "forest"],
  wandering_swordsman: ["road", "mountain", "forest"],
  sect_disciple: ["road", "mountain"],
  frost_wolf: ["snow", "steppe"],
  blood_boar: ["forest", "steppe", "mountain"],
  bandit_lieutenant: ["forest", "mountain", "road"],
  night_blade: ["road", "forest", "river"],
  demon_cult_zealot: ["cave", "mountain", "desert", "coast"],
  // Tier 3
  blade_master: ["road", "mountain"],
  shadow_assassin: ["road", "forest"],
  wudang_disciple: ["mountain", "road"],
  snow_leopard: ["snow", "mountain"],
  sect_elder: ["mountain", "road"],
  golden_tiger: ["forest", "mountain"],
  jade_python: ["swamp", "forest", "river"],
  thunder_eagle: ["mountain", "snow", "steppe"],
  shadowless_swordsman: ["mountain", "road", "snow"],
  iron_crab: ["coast", "river", "swamp"],
  // Tier 4
  demonic_master: ["mountain", "cave", "desert"],
  legendary_swordsman: ["mountain", "road", "snow"],
  heretical_grandmaster: ["swamp", "cave", "forest"],
  stone_turtle: ["coast", "river"],
  // Elites
  elite_void_grandmaster: ["mountain", "snow"],
  elite_iron_mountain: ["mountain", "road"],
  elite_phoenix_empress: ["desert", "mountain"],
  elite_bandit_king: ["mountain", "forest"],
  elite_cult_elder: ["cave", "mountain", "swamp"],
  elite_bear_king: ["forest", "mountain", "snow"],
  elite_villain_zhou: ["road", "river"],
  elite_villain_xie: ["snow", "mountain", "desert"],
  elite_villain_yan: ["road"],
  elite_villain_qing: ["mountain", "cave", "desert"],
  elite_villain_ying: ["cave", "forest"],
  elite_villain_zhao: ["coast"],
  elite_villain_dushi: ["swamp", "forest"],
  elite_villain_huibao: ["mountain", "cave"],
  elite_villain_xuelang: ["snow", "desert", "mountain"],
  elite_villain_dushou: ["desert", "swamp"],
  // Tier 5
  t5_nameless_sword_hermit: ["mountain", "snow"],
  t5_blood_blade_lord: ["desert", "steppe"],
  t5_poison_matriarch: ["swamp", "forest"],
  t5_iron_monk: ["mountain", "road"],
  t5_white_tiger: ["snow", "mountain"],
  t5_wolf_king: ["steppe", "forest"],
};

/** Does this foe live at this place or road? */
export function foeLivesAt(opponentId: string, sceneId: string): boolean {
  const home = FOE_HABITATS[opponentId];
  if (!home) return false;
  const here = biomesOf(sceneId);
  return home.some((b) => here.includes(b));
}
