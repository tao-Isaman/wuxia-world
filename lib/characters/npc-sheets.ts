/**
 * NPCs with their own full animation sheet, in the same 4 × 4 (+ 4 × 2
 * directions) layout as the hero bodies: idle, walk, attack, hurt, guard,
 * victory, defeat, walk north and walk south. `scripts/build-npc-sheets.ts`
 * rigs each one from the NPC's painted body (`public/npcs/body/<id>.png`)
 * into `public/art/characters/npc/<id>.png` and `<id>-directions.png`.
 *
 * These NPCs wander around their spot on the map and fight with real clips
 * instead of a single still. Add an id here, then rerun the script.
 */
export const ANIMATED_NPC_IDS = [
  // The 20 most important people: the 15 sect heads and the opening cast.
  "sect_shaolin_abbot_huiyuan",
  "sect_wudang_master_qingxu",
  "sect_emei_abbess_jingchan",
  "sect_beggars_chief_hongtian",
  "sect_sunmoon_chief_dongfang",
  "sect_jinyiwei_leader_zhao",
  "sect_tang_chief_tangmen",
  "sect_xiaoyao_master_yunxiao",
  "sect_huashan_master_yiqing",
  "sect_songshan_master_zuolengchan",
  "sect_taishan_master_tianmen",
  "sect_hengshan_south_master_modaxiansheng",
  "sect_hengshan_north_abbess_dingyi",
  "sect_quanzhen_master_chongyang",
  "sect_gumu_mystery_woman",
  "city_capital_physician_lin",
  "city_capital_magistrate_wu",
  "merchant_wang",
  "palace_zhongyang_envoy_liuying",
  "city_jinling_strategist_kong",
  // The 10 most important enemies: the villains the hero can meet as bosses.
  "evil_capital_blackmarket_zhou",
  "evil_xueyu_envoy_xie",
  "evil_changan_corrupt_official_yan",
  "evil_treasure_bandit_chief_qing",
  "evil_zhizhu_assassin_ying",
  "evil_shenlong_cult_leader_zhao",
  "evil_wudu_elder_dushi",
  "evil_chuangwang_heretic_huibao",
  "sect_xuedao_blade_xuelang",
  "sect_xingxiu_disciple_dushou",
  // Townsfolk of the villages, towns and homes who stroll around their spot
  // (lib/world/data/places/, NpcDef.look.wander).
  "village_noname_carter_lu",
  "village_noname_child_xiaowu",
  "village_huashan_dreamer_yang",
  "village_huashan_apprentice_tie",
  "village_taishan_porter_shi",
  "village_taishan_pilgrim_chen",
  "city_lingxiao_guard_feng",
  "city_lingxiao_child_xue",
  "palace_royal_guard_zhao",
  "palace_royal_maid_cui",
  "tribe_huizu_wrestler_ma",
  "tribe_huizu_herder_aisha",
  "home_player_gatekeeper_zhou",
  "home_player_neighbor_niu",
  "home_hufei_guest_yuan",
  "home_hufei_guest_jiu",
  "home_chengkun_gardener_wu",
  "home_chengkun_maid_cui",
  "city_lingxiao_coal_hu",
  "home_xuemuhua_guest_li",
  "home_xuemuhua_apprentice_dan",
  "home_nanxian_servant_ashu",
  "home_nanxian_woodcutter_bai",
  "home_yideng_farmer_geng",
  "home_tianboguang_cook_luo",
  "home_tianboguang_soldier_chen",
  "home_miaoren_daughter_ruolan",
  "home_chengying_cousin_lu",
  "home_chengying_gooseboy_tong",
  "home_yanji_guard_liu",
  "home_yanji_maid_chun",
  "home_beichou_servant_amu",
  "home_beichou_herder_cao",
  "villa_meizhuang_painter_danqing",
  "villa_fuwei_young_lin",
] as const;
export type AnimatedNpcId = typeof ANIMATED_NPC_IDS[number];
const ANIMATED: ReadonlySet<string> = new Set(ANIMATED_NPC_IDS);
export function hasAnimatedSheet(npcId: string | null | undefined): npcId is AnimatedNpcId {
  return !!npcId && ANIMATED.has(npcId);
}
