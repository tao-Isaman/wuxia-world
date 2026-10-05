// ชีพจร — where each meridian chart's item (chart_<id>, แผนภาพชีพจร-<name>)
// can be found. Generated alongside lib/game/data/meridians.ts.
//
//   T0  two city markets (shop_*) + small loot from early roadside foes
//   T1  one city market + loot from roadside and journeyman foes
//   T2  one rarer inn / village shop + loot from journeyman fighters
//   T3  loot from masters and roaming elites; every other chart also in a rare shop
//   T4  rare loot from legendary roaming foes and elites + the fitting saga foe (st_*)
//   T5  very rare loot from elites + the fitting saga foe (st_*)
//
// Every chart has at least one repeatable source (a shop or a roaming foe);
// saga foes (st_*) are fought once, so they are a bonus chance only.

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
  root_breath: { shops: ["shop_capital", "shop_yangzhou"], loot: [{ opponentId: "petty_thief", chance: 0.06 }] },
  iron_sinew: { shops: ["shop_suzhou", "shop_jinling"], loot: [{ opponentId: "drunk_brawler", chance: 0.06 }] },
  light_heel: { shops: ["shop_changan", "shop_dali"], loot: [{ opponentId: "thug", chance: 0.06 }] },
  stone_skin: { shops: ["shop_xixia", "shop_capital"], loot: [{ opponentId: "bandit", chance: 0.06 }] },
  clear_eye: { shops: ["shop_yangzhou", "shop_suzhou"], loot: [{ opponentId: "ruffian", chance: 0.06 }] },
  lucky_cloud: { shops: ["shop_jinling", "shop_changan"], loot: [{ opponentId: "road_bandit", chance: 0.06 }] },
  scholar_lamp: { shops: ["shop_dali", "shop_xixia"], loot: [{ opponentId: "fortune_thief", chance: 0.06 }] },
  ox_back: { shops: ["shop_capital", "shop_yangzhou"], loot: [{ opponentId: "petty_thief", chance: 0.06 }] },
  first_edge: { shops: ["shop_suzhou", "shop_jinling"], loot: [{ opponentId: "drunk_brawler", chance: 0.06 }] },
  turtle_shell: { shops: ["shop_changan", "shop_dali"], loot: [{ opponentId: "thug", chance: 0.06 }] },
  blood_spring: { shops: ["shop_xixia", "shop_capital"], loot: [{ opponentId: "bandit", chance: 0.06 }] },
  swift_step: { shops: ["shop_yangzhou", "shop_suzhou"], loot: [{ opponentId: "ruffian", chance: 0.06 }] },
  needle_eye: { shops: ["shop_jinling", "shop_changan"], loot: [{ opponentId: "road_bandit", chance: 0.06 }] },
  inner_pool: { shops: ["shop_dali", "shop_xixia"], loot: [{ opponentId: "fortune_thief", chance: 0.06 }] },
  tiger_mouth: { shops: ["shop_capital", "shop_yangzhou"], loot: [{ opponentId: "petty_thief", chance: 0.06 }] },
  still_water: { shops: ["shop_suzhou", "shop_jinling"], loot: [{ opponentId: "drunk_brawler", chance: 0.06 }] },
  dew_drop: { shops: ["shop_changan", "shop_dali"], loot: [{ opponentId: "thug", chance: 0.06 }] },
  wind_gate: { shops: ["shop_xixia", "shop_capital"], loot: [{ opponentId: "bandit", chance: 0.06 }] },
  morning_sun: { shops: ["shop_yangzhou", "shop_suzhou"], loot: [{ opponentId: "ruffian", chance: 0.06 }] },
  plum_branch: { shops: ["shop_jinling", "shop_changan"], loot: [{ opponentId: "road_bandit", chance: 0.06 }] },
  // T1
  leopard_spine: { shops: ["shop_dali"], loot: [{ opponentId: "thug", chance: 0.05 }, { opponentId: "bandit_chief", chance: 0.04 }] },
  bronze_bell: { shops: ["shop_xixia"], loot: [{ opponentId: "bandit", chance: 0.05 }, { opponentId: "iron_palm_thug", chance: 0.04 }] },
  cloud_mind: { shops: ["shop_capital"], loot: [{ opponentId: "ruffian", chance: 0.05 }, { opponentId: "flying_swallow", chance: 0.04 }] },
  river_arm: { shops: ["shop_yangzhou"], loot: [{ opponentId: "road_bandit", chance: 0.05 }, { opponentId: "poison_practitioner", chance: 0.04 }] },
  crane_leg: { shops: ["shop_suzhou"], loot: [{ opponentId: "river_pirate", chance: 0.05 }, { opponentId: "wandering_swordsman", chance: 0.04 }] },
  mountain_root: { shops: ["shop_jinling"], loot: [{ opponentId: "desert_marauder", chance: 0.05 }, { opponentId: "sect_disciple", chance: 0.04 }] },
  fox_heart: { shops: ["shop_changan"], loot: [{ opponentId: "fortune_thief", chance: 0.05 }, { opponentId: "bandit_lieutenant", chance: 0.04 }] },
  eagle_talon: { shops: ["shop_dali"], loot: [{ opponentId: "bandit_archer", chance: 0.05 }, { opponentId: "night_blade", chance: 0.04 }] },
  white_horse: { shops: ["shop_xixia"], loot: [{ opponentId: "thug", chance: 0.05 }, { opponentId: "demon_cult_zealot", chance: 0.04 }] },
  black_iron_wall: { shops: ["shop_capital"], loot: [{ opponentId: "bandit", chance: 0.05 }, { opponentId: "bandit_chief", chance: 0.04 }] },
  red_lotus_flame: { shops: ["shop_yangzhou"], loot: [{ opponentId: "ruffian", chance: 0.05 }, { opponentId: "iron_palm_thug", chance: 0.04 }] },
  north_star_edge: { shops: ["shop_suzhou"], loot: [{ opponentId: "road_bandit", chance: 0.05 }, { opponentId: "flying_swallow", chance: 0.04 }] },
  cloud_mist_step: { shops: ["shop_jinling"], loot: [{ opponentId: "river_pirate", chance: 0.05 }, { opponentId: "poison_practitioner", chance: 0.04 }] },
  hundred_poison_skin: { shops: ["shop_changan"], loot: [{ opponentId: "desert_marauder", chance: 0.05 }, { opponentId: "wandering_swordsman", chance: 0.04 }] },
  little_dragon_palm: { shops: ["shop_dali"], loot: [{ opponentId: "fortune_thief", chance: 0.05 }, { opponentId: "sect_disciple", chance: 0.04 }] },
  spring_well: { shops: ["shop_xixia"], loot: [{ opponentId: "bandit_archer", chance: 0.05 }, { opponentId: "bandit_lieutenant", chance: 0.04 }] },
  vajra_knuckle: { shops: ["shop_capital"], loot: [{ opponentId: "thug", chance: 0.05 }, { opponentId: "night_blade", chance: 0.04 }] },
  drunken_moon: { shops: ["shop_yangzhou"], loot: [{ opponentId: "bandit", chance: 0.05 }, { opponentId: "demon_cult_zealot", chance: 0.04 }] },
  silk_thread: { shops: ["shop_suzhou"], loot: [{ opponentId: "ruffian", chance: 0.05 }, { opponentId: "bandit_chief", chance: 0.04 }] },
  beggar_bowl: { shops: ["shop_jinling"], loot: [{ opponentId: "road_bandit", chance: 0.05 }, { opponentId: "iron_palm_thug", chance: 0.04 }] },
  // T2
  five_peaks_breath: { shops: ["shop_inn_yuelai"], loot: [{ opponentId: "flying_swallow", chance: 0.04 }, { opponentId: "poison_practitioner", chance: 0.04 }] },
  bodhi_root: { shops: ["shop_village_huashan"], loot: [{ opponentId: "wandering_swordsman", chance: 0.04 }, { opponentId: "sect_disciple", chance: 0.04 }] },
  tiger_roar_lung: { shops: ["shop_inn_heluo"], loot: [{ opponentId: "bandit_lieutenant", chance: 0.04 }, { opponentId: "night_blade", chance: 0.04 }] },
  crane_stillness: { shops: ["shop_village_wuxia"], loot: [{ opponentId: "demon_cult_zealot", chance: 0.04 }, { opponentId: "bandit_chief", chance: 0.04 }] },
  mind_body_one: { shops: ["shop_inn_gaosheng"], loot: [{ opponentId: "iron_palm_thug", chance: 0.04 }, { opponentId: "flying_swallow", chance: 0.04 }] },
  eight_trigram_web: { shops: ["shop_village_taishan"], loot: [{ opponentId: "poison_practitioner", chance: 0.04 }, { opponentId: "wandering_swordsman", chance: 0.04 }] },
  five_petal_plum: { shops: ["shop_village_meihua"], loot: [{ opponentId: "sect_disciple", chance: 0.04 }, { opponentId: "bandit_lieutenant", chance: 0.04 }] },
  seven_color_serpent: { shops: ["shop_inn_youjian"], loot: [{ opponentId: "night_blade", chance: 0.04 }, { opponentId: "demon_cult_zealot", chance: 0.04 }] },
  golden_armor: { shops: ["shop_village_hengshan"], loot: [{ opponentId: "bandit_chief", chance: 0.04 }, { opponentId: "iron_palm_thug", chance: 0.04 }] },
  ice_palm: { shops: ["shop_village_qigu"], loot: [{ opponentId: "flying_swallow", chance: 0.04 }, { opponentId: "poison_practitioner", chance: 0.04 }] },
  twin_wind_blades: { shops: ["shop_village_noname"], loot: [{ opponentId: "wandering_swordsman", chance: 0.04 }, { opponentId: "sect_disciple", chance: 0.04 }] },
  garland_spring: { shops: ["shop_village"], loot: [{ opponentId: "bandit_lieutenant", chance: 0.04 }, { opponentId: "night_blade", chance: 0.04 }] },
  rooted_peak: { shops: ["shop_inn_yuelai"], loot: [{ opponentId: "demon_cult_zealot", chance: 0.04 }, { opponentId: "bandit_chief", chance: 0.04 }] },
  drunken_immortal: { shops: ["shop_village_huashan"], loot: [{ opponentId: "iron_palm_thug", chance: 0.04 }, { opponentId: "flying_swallow", chance: 0.04 }] },
  sun_body: { shops: ["shop_inn_heluo"], loot: [{ opponentId: "poison_practitioner", chance: 0.04 }, { opponentId: "wandering_swordsman", chance: 0.04 }] },
  // T3
  dragon_elephant: { shops: ["shop_village_wuxia"], loot: [{ opponentId: "blade_master", chance: 0.03 }, { opponentId: "elite_void_grandmaster", chance: 0.03 }] },
  heart_mind_lattice: { loot: [{ opponentId: "shadow_assassin", chance: 0.03 }, { opponentId: "elite_iron_mountain", chance: 0.03 }] },
  jade_maiden: { shops: ["shop_inn_gaosheng"], loot: [{ opponentId: "wudang_disciple", chance: 0.03 }, { opponentId: "elite_phoenix_empress", chance: 0.03 }] },
  northern_ghost: { loot: [{ opponentId: "sect_elder", chance: 0.03 }, { opponentId: "elite_bandit_king", chance: 0.03 }] },
  one_finger: { shops: ["shop_village_taishan"], loot: [{ opponentId: "ghost_swordsman", chance: 0.03 }, { opponentId: "elite_cult_elder", chance: 0.03 }] },
  void_step: { loot: [{ opponentId: "snow_demon", chance: 0.03 }, { opponentId: "elite_blood_rakshasa", chance: 0.03 }] },
  thunder_stride: { shops: ["shop_village_meihua"], loot: [{ opponentId: "blade_master", chance: 0.03 }, { opponentId: "elite_demon_emperor", chance: 0.03 }] },
  blood_blade: { loot: [{ opponentId: "shadow_assassin", chance: 0.03 }, { opponentId: "elite_villain_zhou", chance: 0.03 }] },
  dharma_mirror: { shops: ["shop_inn_youjian"], loot: [{ opponentId: "wudang_disciple", chance: 0.03 }, { opponentId: "elite_villain_xie", chance: 0.03 }] },
  sun_renewal: { loot: [{ opponentId: "sect_elder", chance: 0.03 }, { opponentId: "elite_villain_yan", chance: 0.03 }] },
  sun_piercer: { shops: ["shop_village_hengshan"], loot: [{ opponentId: "ghost_swordsman", chance: 0.03 }, { opponentId: "elite_villain_qing", chance: 0.03 }] },
  viper_venom: { loot: [{ opponentId: "snow_demon", chance: 0.03 }, { opponentId: "elite_villain_ying", chance: 0.03 }] },
  dual_fusion: { shops: ["shop_village_qigu"], loot: [{ opponentId: "blade_master", chance: 0.03 }, { opponentId: "elite_villain_zhao", chance: 0.03 }] },
  dragon_slaying_tide: { loot: [{ opponentId: "shadow_assassin", chance: 0.03 }, { opponentId: "elite_villain_dushi", chance: 0.03 }] },
  purple_cloud: { shops: ["shop_village_noname"], loot: [{ opponentId: "wudang_disciple", chance: 0.03 }, { opponentId: "elite_villain_huibao", chance: 0.03 }] },
  // T4
  tendon_change: { loot: [{ opponentId: "demonic_master", chance: 0.02 }, { opponentId: "elite_villain_xuelang", chance: 0.025 }, { opponentId: "st_shaolin_thirteen_fists", chance: 0.2 }] },
  taiji_cycle: { loot: [{ opponentId: "legendary_swordsman", chance: 0.02 }, { opponentId: "elite_villain_dushou", chance: 0.025 }, { opponentId: "st_wudang_pure_white_blade", chance: 0.2 }] },
  star_devouring: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.02 }, { opponentId: "elite_void_grandmaster", chance: 0.025 }, { opponentId: "st_xiaoyao_snow_bat", chance: 0.2 }] },
  emei_frost_grace: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.02 }, { opponentId: "elite_iron_mountain", chance: 0.025 }, { opponentId: "st_emei_black_iron", chance: 0.2 }] },
  army_breaker: { loot: [{ opponentId: "immortal_warrior", chance: 0.02 }, { opponentId: "elite_phoenix_empress", chance: 0.025 }, { opponentId: "st_jh_witness_spear_tulong", chance: 0.2 }] },
  heaven_flame: { loot: [{ opponentId: "demonic_master", chance: 0.02 }, { opponentId: "elite_bandit_king", chance: 0.025 }, { opponentId: "st_jh_godslayer_blade_hulan", chance: 0.2 }] },
  six_meridian_sword: { loot: [{ opponentId: "legendary_swordsman", chance: 0.02 }, { opponentId: "elite_cult_elder", chance: 0.025 }, { opponentId: "st_jh_six_meridian_mad_sword", chance: 0.25 }, { opponentId: "st_jh_six_meridian_dorje", chance: 0.2 }] },
  lonely_nine_swords: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.02 }, { opponentId: "elite_blood_rakshasa", chance: 0.025 }, { opponentId: "st_jh_lone_sword_collector", chance: 0.25 }, { opponentId: "st_jh_lone_sword_xiao", chance: 0.2 }] },
  dragon_subduing: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.02 }, { opponentId: "elite_demon_emperor", chance: 0.025 }, { opponentId: "st_beggars_iron_staff", chance: 0.2 }] },
  vajra_body: { loot: [{ opponentId: "immortal_warrior", chance: 0.02 }, { opponentId: "elite_villain_zhou", chance: 0.025 }, { opponentId: "st_shaolin_lion_mourner", chance: 0.2 }] },
  cosmos_fist: { loot: [{ opponentId: "demonic_master", chance: 0.02 }, { opponentId: "elite_villain_xie", chance: 0.025 }, { opponentId: "st_jh_cosmos_fist_iron_belly", chance: 0.2 }, { opponentId: "st_jh_cosmos_fist_deserter", chance: 0.2 }] },
  universe_shift: { loot: [{ opponentId: "legendary_swordsman", chance: 0.02 }, { opponentId: "elite_villain_yan", chance: 0.025 }, { opponentId: "st_sunmoon_radiant_envoy", chance: 0.2 }] },
  witness_spear: { loot: [{ opponentId: "heretical_grandmaster", chance: 0.02 }, { opponentId: "elite_villain_qing", chance: 0.025 }, { opponentId: "st_jh_witness_spear_song", chance: 0.25 }, { opponentId: "st_jh_witness_spear_zhong", chance: 0.2 }] },
  godslayer_blade: { loot: [{ opponentId: "dragon_phoenix_master", chance: 0.02 }, { opponentId: "elite_villain_ying", chance: 0.025 }, { opponentId: "st_jh_godslayer_blade_bronze_keeper", chance: 0.25 }] },
  five_poison_body: { loot: [{ opponentId: "immortal_warrior", chance: 0.02 }, { opponentId: "elite_villain_zhao", chance: 0.025 }, { opponentId: "st_outsider_sixfold_dushi", chance: 0.25 }] },
  // T5
  nine_yang: { loot: [{ opponentId: "elite_villain_dushi", chance: 0.012 }, { opponentId: "elite_villain_huibao", chance: 0.012 }, { opponentId: "st_jh_six_meridian_dorje_six_fires", chance: 0.15 }] },
  nine_yin: { loot: [{ opponentId: "elite_villain_xuelang", chance: 0.012 }, { opponentId: "elite_villain_dushou", chance: 0.012 }, { opponentId: "st_gumu_xuanming_heir", chance: 0.15 }] },
  eight_extraordinary: { loot: [{ opponentId: "elite_void_grandmaster", chance: 0.012 }, { opponentId: "elite_iron_mountain", chance: 0.012 }, { opponentId: "st_jh_lone_sword_ninefold", chance: 0.15 }] },
  sunflower_needle: { loot: [{ opponentId: "elite_phoenix_empress", chance: 0.012 }, { opponentId: "elite_bandit_king", chance: 0.012 }, { opponentId: "st_sunmoon_forced_ninth", chance: 0.15 }] },
  hidden_dragon: { loot: [{ opponentId: "elite_cult_elder", chance: 0.012 }, { opponentId: "elite_blood_rakshasa", chance: 0.012 }, { opponentId: "st_jh_godslayer_blade_iron_vulture", chance: 0.15 }] },
  heaven_sword_heart: { loot: [{ opponentId: "elite_demon_emperor", chance: 0.012 }, { opponentId: "elite_villain_zhou", chance: 0.012 }, { opponentId: "st_jh_lone_sword_bai", chance: 0.15 }] },
  deathless_vajra: { loot: [{ opponentId: "elite_villain_xie", chance: 0.012 }, { opponentId: "elite_villain_yan", chance: 0.012 }, { opponentId: "st_vajra_finger_heir", chance: 0.15 }] },
  heavenly_demon: { loot: [{ opponentId: "elite_villain_qing", chance: 0.012 }, { opponentId: "elite_villain_ying", chance: 0.012 }, { opponentId: "elite_villain_xuelang", chance: 0.04 }] },
  starry_revolution: { loot: [{ opponentId: "elite_villain_zhao", chance: 0.012 }, { opponentId: "elite_villain_dushi", chance: 0.012 }, { opponentId: "st_sunmoon_radiant_envoy", chance: 0.12 }] },
  grand_circuit: { loot: [{ opponentId: "elite_villain_huibao", chance: 0.012 }, { opponentId: "elite_villain_xuelang", chance: 0.012 }, { opponentId: "st_jh_cosmos_fist_wine_monk", chance: 0.15 }] },
};
