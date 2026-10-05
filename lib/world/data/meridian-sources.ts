// ชีพจร — where each meridian chart's item (chart_<id>, แผนภาพชีพจร-<name>)
// can be found. Generated alongside lib/game/data/meridians.ts.
//
//   Drops only — no chart is sold. Every chance is 1 % (DROP_CHANCE).
//   T0  an early roadside foe
//   T1  a roadside foe and a journeyman fighter
//   T2  two journeyman fighters
//   T3  a master and a roaming elite
//   T4  a legendary roaming foe, an elite and the fitting saga foe (st_*)
//   T5  two elites and the fitting saga foe (st_*)
//
// Every chart has at least one repeatable source (a roaming foe that is not
// st_*); saga foes are fought once, so they are a bonus chance only.

export interface MeridianSourceEntry {
  /** Shop ids (lib/world/data/shops.ts) that sell the chart item. */
  shops?: readonly string[];
  /** Opponents (lib/world/data/opponents.ts) that may drop it on a win. */
  loot?: readonly { opponentId: string; chance: number }[];
  /** Quests whose reward includes it. */
  questRewards?: readonly string[];
}

export const MERIDIAN_SOURCES: Readonly<Record<string, MeridianSourceEntry>> = {
  // T0
  root_breath: { loot: [{ opponentId: "petty_thief", chance: 0.01 }] },
  iron_sinew: { loot: [{ opponentId: "drunk_brawler", chance: 0.01 }] },
  light_heel: { loot: [{ opponentId: "thug", chance: 0.01 }] },
  stone_skin: { loot: [{ opponentId: "bandit", chance: 0.01 }] },
  clear_eye: { loot: [{ opponentId: "ruffian", chance: 0.01 }] },
  lucky_cloud: { loot: [{ opponentId: "road_bandit", chance: 0.01 }] },
  scholar_lamp: { loot: [{ opponentId: "fortune_thief", chance: 0.01 }] },
  ox_back: { loot: [{ opponentId: "petty_thief", chance: 0.01 }] },
  first_edge: { loot: [{ opponentId: "drunk_brawler", chance: 0.01 }] },
  turtle_shell: { loot: [{ opponentId: "thug", chance: 0.01 }] },
  blood_spring: { loot: [{ opponentId: "bandit", chance: 0.01 }] },
  swift_step: { loot: [{ opponentId: "ruffian", chance: 0.01 }] },
  needle_eye: { loot: [{ opponentId: "road_bandit", chance: 0.01 }] },
  inner_pool: { loot: [{ opponentId: "fortune_thief", chance: 0.01 }] },
  tiger_mouth: { loot: [{ opponentId: "petty_thief", chance: 0.01 }] },
  still_water: { loot: [{ opponentId: "drunk_brawler", chance: 0.01 }] },
  dew_drop: { loot: [{ opponentId: "thug", chance: 0.01 }] },
  wind_gate: { loot: [{ opponentId: "bandit", chance: 0.01 }] },
  morning_sun: { loot: [{ opponentId: "ruffian", chance: 0.01 }] },
  plum_branch: { loot: [{ opponentId: "road_bandit", chance: 0.01 }] },
  // T1
  leopard_spine: { loot: [{ opponentId: "thug", chance: 0.01 }, { opponentId: "bandit_chief", chance: 0.01 }] },
  bronze_bell: { loot: [{ opponentId: "bandit", chance: 0.01 }, { opponentId: "iron_palm_thug", chance: 0.01 }] },
  cloud_mind: { loot: [{ opponentId: "ruffian", chance: 0.01 }, { opponentId: "flying_swallow", chance: 0.01 }] },
  river_arm: { loot: [{ opponentId: "road_bandit", chance: 0.01 }, { opponentId: "poison_practitioner", chance: 0.01 }] },
  crane_leg: { loot: [{ opponentId: "river_pirate", chance: 0.01 }, { opponentId: "wandering_swordsman", chance: 0.01 }] },
  mountain_root: { loot: [{ opponentId: "desert_marauder", chance: 0.01 }, { opponentId: "sect_disciple", chance: 0.01 }] },
  fox_heart: { loot: [{ opponentId: "fortune_thief", chance: 0.01 }, { opponentId: "bandit_lieutenant", chance: 0.01 }] },
  eagle_talon: { loot: [{ opponentId: "bandit_archer", chance: 0.01 }, { opponentId: "night_blade", chance: 0.01 }] },
  white_horse: { loot: [{ opponentId: "thug", chance: 0.01 }, { opponentId: "demon_cult_zealot", chance: 0.01 }] },
  black_iron_wall: { loot: [{ opponentId: "bandit", chance: 0.01 }, { opponentId: "bandit_chief", chance: 0.01 }] },
  red_lotus_flame: { loot: [{ opponentId: "ruffian", chance: 0.01 }, { opponentId: "iron_palm_thug", chance: 0.01 }] },
  north_star_edge: { loot: [{ opponentId: "road_bandit", chance: 0.01 }, { opponentId: "flying_swallow", chance: 0.01 }] },
  cloud_mist_step: { loot: [{ opponentId: "river_pirate", chance: 0.01 }, { opponentId: "poison_practitioner", chance: 0.01 }] },
  hundred_poison_skin: { loot: [{ opponentId: "desert_marauder", chance: 0.01 }, { opponentId: "wandering_swordsman", chance: 0.01 }] },
  little_dragon_palm: { loot: [{ opponentId: "fortune_thief", chance: 0.01 }, { opponentId: "sect_disciple", chance: 0.01 }] },
  spring_well: { loot: [{ opponentId: "bandit_archer", chance: 0.01 }, { opponentId: "bandit_lieutenant", chance: 0.01 }] },
  vajra_knuckle: { loot: [{ opponentId: "thug", chance: 0.01 }, { opponentId: "night_blade", chance: 0.01 }] },
  drunken_moon: { loot: [{ opponentId: "bandit", chance: 0.01 }, { opponentId: "demon_cult_zealot", chance: 0.01 }] },
  silk_thread: { loot: [{ opponentId: "ruffian", chance: 0.01 }, { opponentId: "bandit_chief", chance: 0.01 }] },
  beggar_bowl: { loot: [{ opponentId: "road_bandit", chance: 0.01 }, { opponentId: "iron_palm_thug", chance: 0.01 }] },
  // T2
  five_peaks_breath: { loot: [{ opponentId: "flying_swallow", chance: 0.01 }, { opponentId: "poison_practitioner", chance: 0.01 }] },
  bodhi_root: { loot: [{ opponentId: "wandering_swordsman", chance: 0.01 }, { opponentId: "sect_disciple", chance: 0.01 }] },
  tiger_roar_lung: { loot: [{ opponentId: "bandit_lieutenant", chance: 0.01 }, { opponentId: "night_blade", chance: 0.01 }] },
  crane_stillness: { loot: [{ opponentId: "demon_cult_zealot", chance: 0.01 }, { opponentId: "bandit_chief", chance: 0.01 }] },
  mind_body_one: { loot: [{ opponentId: "iron_palm_thug", chance: 0.01 }, { opponentId: "flying_swallow", chance: 0.01 }] },
  eight_trigram_web: { loot: [{ opponentId: "poison_practitioner", chance: 0.01 }, { opponentId: "wandering_swordsman", chance: 0.01 }] },
  five_petal_plum: { loot: [{ opponentId: "sect_disciple", chance: 0.01 }, { opponentId: "bandit_lieutenant", chance: 0.01 }] },
  seven_color_serpent: { loot: [{ opponentId: "night_blade", chance: 0.01 }, { opponentId: "demon_cult_zealot", chance: 0.01 }] },
  golden_armor: { loot: [{ opponentId: "bandit_chief", chance: 0.01 }, { opponentId: "iron_palm_thug", chance: 0.01 }] },
  ice_palm: { loot: [{ opponentId: "flying_swallow", chance: 0.01 }, { opponentId: "poison_practitioner", chance: 0.01 }] },
  twin_wind_blades: { loot: [{ opponentId: "wandering_swordsman", chance: 0.01 }, { opponentId: "sect_disciple", chance: 0.01 }] },
  garland_spring: { loot: [{ opponentId: "bandit_lieutenant", chance: 0.01 }, { opponentId: "night_blade", chance: 0.01 }] },
  rooted_peak: { loot: [{ opponentId: "demon_cult_zealot", chance: 0.01 }, { opponentId: "bandit_chief", chance: 0.01 }] },
  drunken_immortal: { loot: [{ opponentId: "iron_palm_thug", chance: 0.01 }, { opponentId: "flying_swallow", chance: 0.01 }] },
  sun_body: { loot: [{ opponentId: "poison_practitioner", chance: 0.01 }, { opponentId: "wandering_swordsman", chance: 0.01 }] },
  // T3
  dragon_elephant: { loot: [{ opponentId: "blade_master", chance: 0.01 }, { opponentId: "elite_void_grandmaster", chance: 0.01 }] },
  heart_mind_lattice: { loot: [{ opponentId: "shadow_assassin", chance: 0.01 }, { opponentId: "elite_iron_mountain", chance: 0.01 }] },
  jade_maiden: { loot: [{ opponentId: "wudang_disciple", chance: 0.01 }, { opponentId: "elite_phoenix_empress", chance: 0.01 }] },
  northern_ghost: { loot: [{ opponentId: "sect_elder", chance: 0.01 }, { opponentId: "elite_bandit_king", chance: 0.01 }] },
  one_finger: { loot: [{ opponentId: "ghost_swordsman", chance: 0.01 }, { opponentId: "elite_cult_elder", chance: 0.01 }] },
  void_step: { loot: [{ opponentId: "snow_demon", chance: 0.01 }, { opponentId: "elite_blood_rakshasa", chance: 0.01 }] },
  thunder_stride: { loot: [{ opponentId: "blade_master", chance: 0.01 }, { opponentId: "elite_demon_emperor", chance: 0.01 }] },
  blood_blade: { loot: [{ opponentId: "shadow_assassin", chance: 0.01 }, { opponentId: "elite_villain_zhou", chance: 0.01 }] },
  dharma_mirror: { loot: [{ opponentId: "wudang_disciple", chance: 0.01 }, { opponentId: "elite_villain_xie", chance: 0.01 }] },
  sun_renewal: { loot: [{ opponentId: "sect_elder", chance: 0.01 }, { opponentId: "elite_villain_yan", chance: 0.01 }] },
  sun_piercer: { loot: [{ opponentId: "ghost_swordsman", chance: 0.01 }, { opponentId: "elite_villain_qing", chance: 0.01 }] },
  viper_venom: { loot: [{ opponentId: "snow_demon", chance: 0.01 }, { opponentId: "elite_villain_ying", chance: 0.01 }] },
  dual_fusion: { loot: [{ opponentId: "blade_master", chance: 0.01 }, { opponentId: "elite_villain_zhao", chance: 0.01 }] },
  dragon_slaying_tide: { loot: [{ opponentId: "shadow_assassin", chance: 0.01 }, { opponentId: "elite_villain_dushi", chance: 0.01 }] },
  purple_cloud: { loot: [{ opponentId: "wudang_disciple", chance: 0.01 }, { opponentId: "elite_villain_huibao", chance: 0.01 }] },
  // T4
  tendon_change: { loot: [{ opponentId: "demonic_master", chance: 0.01 }, { opponentId: "elite_villain_xuelang", chance: 0.01 }, { opponentId: "st_shaolin_thirteen_fists", chance: 0.01 }] },
  taiji_cycle: { loot: [{ opponentId: "legendary_swordsman", chance: 0.01 }, { opponentId: "elite_villain_dushou", chance: 0.01 }, { opponentId: "st_wudang_pure_white_blade", chance: 0.01 }] },
  star_devouring: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.01 }, { opponentId: "elite_void_grandmaster", chance: 0.01 }, { opponentId: "st_xiaoyao_snow_bat", chance: 0.01 }] },
  emei_frost_grace: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.01 }, { opponentId: "elite_iron_mountain", chance: 0.01 }, { opponentId: "st_emei_black_iron", chance: 0.01 }] },
  army_breaker: { loot: [{ opponentId: "immortal_warrior", chance: 0.01 }, { opponentId: "elite_phoenix_empress", chance: 0.01 }, { opponentId: "st_jh_witness_spear_tulong", chance: 0.01 }] },
  heaven_flame: { loot: [{ opponentId: "demonic_master", chance: 0.01 }, { opponentId: "elite_bandit_king", chance: 0.01 }, { opponentId: "st_jh_godslayer_blade_hulan", chance: 0.01 }] },
  six_meridian_sword: { loot: [{ opponentId: "legendary_swordsman", chance: 0.01 }, { opponentId: "elite_cult_elder", chance: 0.01 }, { opponentId: "st_jh_six_meridian_mad_sword", chance: 0.01 }, { opponentId: "st_jh_six_meridian_dorje", chance: 0.01 }] },
  lonely_nine_swords: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.01 }, { opponentId: "elite_blood_rakshasa", chance: 0.01 }, { opponentId: "st_jh_lone_sword_collector", chance: 0.01 }, { opponentId: "st_jh_lone_sword_xiao", chance: 0.01 }] },
  dragon_subduing: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.01 }, { opponentId: "elite_demon_emperor", chance: 0.01 }, { opponentId: "st_beggars_iron_staff", chance: 0.01 }] },
  vajra_body: { loot: [{ opponentId: "immortal_warrior", chance: 0.01 }, { opponentId: "elite_villain_zhou", chance: 0.01 }, { opponentId: "st_shaolin_lion_mourner", chance: 0.01 }] },
  cosmos_fist: { loot: [{ opponentId: "demonic_master", chance: 0.01 }, { opponentId: "elite_villain_xie", chance: 0.01 }, { opponentId: "st_jh_cosmos_fist_iron_belly", chance: 0.01 }, { opponentId: "st_jh_cosmos_fist_deserter", chance: 0.01 }] },
  universe_shift: { loot: [{ opponentId: "legendary_swordsman", chance: 0.01 }, { opponentId: "elite_villain_yan", chance: 0.01 }, { opponentId: "st_sunmoon_radiant_envoy", chance: 0.01 }] },
  witness_spear: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.01 }, { opponentId: "elite_villain_qing", chance: 0.01 }, { opponentId: "st_jh_witness_spear_song", chance: 0.01 }, { opponentId: "st_jh_witness_spear_zhong", chance: 0.01 }] },
  godslayer_blade: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.01 }, { opponentId: "elite_villain_ying", chance: 0.01 }, { opponentId: "st_jh_godslayer_blade_bronze_keeper", chance: 0.01 }] },
  five_poison_body: { loot: [{ opponentId: "immortal_warrior", chance: 0.01 }, { opponentId: "elite_villain_zhao", chance: 0.01 }, { opponentId: "st_outsider_sixfold_dushi", chance: 0.01 }] },
  // T5
  nine_yang: { loot: [{ opponentId: "elite_villain_dushi", chance: 0.01 }, { opponentId: "elite_villain_huibao", chance: 0.01 }, { opponentId: "st_jh_six_meridian_dorje_six_fires", chance: 0.01 }] },
  nine_yin: { loot: [{ opponentId: "elite_villain_xuelang", chance: 0.01 }, { opponentId: "elite_villain_dushou", chance: 0.01 }, { opponentId: "st_gumu_xuanming_heir", chance: 0.01 }] },
  eight_extraordinary: { loot: [{ opponentId: "elite_void_grandmaster", chance: 0.01 }, { opponentId: "elite_iron_mountain", chance: 0.01 }, { opponentId: "st_jh_lone_sword_ninefold", chance: 0.01 }] },
  sunflower_needle: { loot: [{ opponentId: "elite_phoenix_empress", chance: 0.01 }, { opponentId: "elite_bandit_king", chance: 0.01 }, { opponentId: "st_sunmoon_forced_ninth", chance: 0.01 }] },
  hidden_dragon: { loot: [{ opponentId: "elite_cult_elder", chance: 0.01 }, { opponentId: "elite_blood_rakshasa", chance: 0.01 }, { opponentId: "st_jh_godslayer_blade_iron_vulture", chance: 0.01 }] },
  heaven_sword_heart: { loot: [{ opponentId: "elite_demon_emperor", chance: 0.01 }, { opponentId: "elite_villain_zhou", chance: 0.01 }, { opponentId: "st_jh_lone_sword_bai", chance: 0.01 }] },
  deathless_vajra: { loot: [{ opponentId: "elite_villain_xie", chance: 0.01 }, { opponentId: "elite_villain_yan", chance: 0.01 }, { opponentId: "st_vajra_finger_heir", chance: 0.01 }] },
  heavenly_demon: { loot: [{ opponentId: "elite_villain_qing", chance: 0.01 }, { opponentId: "elite_villain_ying", chance: 0.01 }, { opponentId: "elite_villain_xuelang", chance: 0.01 }] },
  starry_revolution: { loot: [{ opponentId: "elite_villain_zhao", chance: 0.01 }, { opponentId: "elite_villain_dushi", chance: 0.01 }, { opponentId: "st_sunmoon_radiant_envoy", chance: 0.01 }] },
  grand_circuit: { loot: [{ opponentId: "elite_villain_huibao", chance: 0.01 }, { opponentId: "elite_villain_xuelang", chance: 0.01 }, { opponentId: "st_jh_cosmos_fist_wine_monk", chance: 0.01 }] },
};
