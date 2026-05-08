import type { NpcDef } from "../../types";

// Bad-guy quest-givers. They live in dark corners (caves, evil sects,
// hidden alleys via existing inn locations) and offer high-reward,
// trait-corrupting side quests through lib/world/data/quests/evil.ts.
//
// Authoring rule: every NPC here has `defenseTier` set so steal/
// assassinate/kidnap fail-fights have a sensible difficulty even if a
// player tries to turn on the bad-guy giver themselves.
export const NPCS_EVIL: readonly NpcDef[] = [
  // ─── เถ้าแก่ตลาดมืด (city_capital) ────────────────────────────────────
  {
    id: "evil_capital_blackmarket_zhou",
    name: "เถ้าแก่โจวตลาดมืด",
    description: "พ่อค้ามืดในซอกซอยนครหลวง ซื้อขายของผิดกฎหมายและจ้างวานคนทำงานสกปรก",
    locationIds: ["city_capital"],
    dialogSceneId: "npc_evil_capital_blackmarket_zhou_talk",
    questIds: [
      "qe_capital_jewel_heist",
      "qe_capital_silence_witness",
      "qe_capital_merchant_kidnap",
      "qe_capital_clear_rival",
      "qe_capital_ledger_burn",
      "qe_capital_steal_seal",
      "qe_capital_assassinate_official",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "viper_venom", weight: 2 },
      { itemId: "jade", weight: 1 },
    ],
    tags: ["villain", "merchant", "underworld"],
  },

  // ─── ขุนนางฉ้อฉล (city_changan) ──────────────────────────────────────
  {
    id: "evil_changan_corrupt_official_yan",
    name: "ขุนนางหยานทุจริต",
    description: "ขุนนางใหญ่ในฉางอันที่หาวิธีกำจัดคู่แข่งทางการเมืองด้วยมือของคนนอก",
    locationIds: ["city_changan"],
    dialogSceneId: "npc_evil_changan_corrupt_official_yan_talk",
    questIds: [
      "qe_changan_remove_rival",
      "qe_changan_steal_evidence",
      "qe_changan_silence_clerk",
      "qe_changan_kidnap_witness",
      "qe_changan_smuggling_run",
      "qe_changan_intimidate_judge",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 5 },
      { itemId: "gold_ore", weight: 2 },
      { itemId: "jade_amulet", weight: 1 },
    ],
    tags: ["villain", "official", "noble"],
  },

  // ─── หัวหน้าโจรหุบเขา (cave_treasure) ───────────────────────────────
  {
    id: "evil_treasure_bandit_chief_qing",
    name: "หัวหน้าโจรชิง",
    description: "เจ้าของถ้ำโจรลึกในเขาห่างไกล จ้างวานยอดยุทธให้ปล้นและฆ่าทั่วยุทธจักร",
    locationIds: ["cave_treasure"],
    dialogSceneId: "npc_evil_treasure_bandit_chief_qing_talk",
    questIds: [
      "qe_treasure_caravan_raid",
      "qe_treasure_mountain_purge",
      "qe_treasure_steal_horde",
      "qe_treasure_kidnap_lord",
      "qe_treasure_kill_lawman",
      "qe_treasure_clear_competitor",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 4 },
      { itemId: "iron_blade", weight: 3 },
      { itemId: "gold_ore", weight: 2 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["villain", "bandit"],
  },

  // ─── ทูตสำนักดาบโลหิต (sect_xueyu) ──────────────────────────────────
  {
    id: "evil_xueyu_envoy_xie",
    name: "ทูตเซี่ยแห่งสำนักดาบโลหิต",
    description: "ทูตเลือดเย็นที่หาผู้ฝีมือมาสมัครสำนัก งานทดสอบทุกชิ้นเปื้อนเลือด",
    locationIds: ["sect_xueyu"],
    dialogSceneId: "npc_evil_xueyu_envoy_xie_talk",
    questIds: [
      "qe_xueyu_sect_initiation",
      "qe_xueyu_kill_pure_monk",
      "qe_xueyu_kidnap_disciple",
      "qe_xueyu_steal_sutra",
      "qe_xueyu_silence_traitor",
      "qe_xueyu_purge_village",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "viper_venom", weight: 4 },
      { itemId: "scorpion_venom", weight: 3 },
      { itemId: "iron_blade", weight: 2 },
      { itemId: "centipede_venom", weight: 1 },
    ],
    tags: ["villain", "evil_sect", "envoy"],
  },

  // ─── ผู้อาวุโสเบญจพิษ (sect_wudu) ───────────────────────────────────
  {
    id: "evil_wudu_elder_dushi",
    name: "ผู้อาวุโสตู๋ซื่อ",
    description: "ผู้อาวุโสฝ่ายอธรรมแห่งพรรคเบญจพิษ ใจดำและอยากครอบครองพิษในตำนาน",
    locationIds: ["sect_wudu"],
    dialogSceneId: "npc_evil_wudu_elder_dushi_talk",
    questIds: [
      "qe_wudu_collect_centipede",
      "qe_wudu_kidnap_doctor",
      "qe_wudu_steal_antidote",
      "qe_wudu_assassinate_emei",
      "qe_wudu_clear_rival_sect",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "viper_venom", weight: 5 },
      { itemId: "scorpion_venom", weight: 4 },
      { itemId: "centipede_venom", weight: 2 },
      { itemId: "snow_lotus", weight: 1 },
    ],
    tags: ["villain", "venom_master", "evil_sect"],
  },

  // ─── นักฆ่าเงา (cave_zhizhu) ────────────────────────────────────────
  {
    id: "evil_zhizhu_assassin_ying",
    name: "นักฆ่าเงาหยิง",
    description: "อดีตหัวหน้านักฆ่าผู้หลบซ่อนในถ้ำแมงมุม รับงานราคาแพงเฉพาะที่อันตรายมาก",
    locationIds: ["cave_zhizhu"],
    dialogSceneId: "npc_evil_zhizhu_assassin_ying_talk",
    questIds: [
      "qe_zhizhu_assassinate_lord",
      "qe_zhizhu_assassinate_master",
      "qe_zhizhu_silence_traitor",
      "qe_zhizhu_purge_witnesses",
      "qe_zhizhu_steal_target_data",
      "qe_zhizhu_apprentice_test",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "scorpion_venom", weight: 4 },
      { itemId: "centipede_venom", weight: 3 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade_amulet", weight: 1 },
    ],
    tags: ["villain", "assassin", "shadow"],
  },

  // ─── พระอเถระนอกรีต (cave_chuangwang) ─────────────────────────────
  {
    id: "evil_chuangwang_heretic_huibao",
    name: "พระอเถระนอกรีตฮุยเป้า",
    description: "อดีตพระเส้าหลินที่ตกอยู่ใต้อำนาจมาร ลึกในถ้ำสมบัติราชาโจร",
    locationIds: ["cave_chuangwang"],
    dialogSceneId: "npc_evil_chuangwang_heretic_huibao_talk",
    questIds: [
      "qe_chuangwang_steal_relic",
      "qe_chuangwang_kidnap_novice",
      "qe_chuangwang_kill_pilgrim",
      "qe_chuangwang_burn_temple",
      "qe_chuangwang_purge_witnesses",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "snow_lotus", weight: 1 },
    ],
    tags: ["villain", "heretic", "monk"],
  },

  // ─── ผู้นำลัทธิมังกรเทพ (isle_shenlong) ─────────────────────────────
  {
    id: "evil_shenlong_cult_leader_zhao",
    name: "เจ้าลัทธิจ้าวมังกรเทพ",
    description: "ผู้นำลัทธิมังกรเทพบนเกาะที่ขยายอำนาจด้วยการลักพาตัวและฆ่าผู้ขัดขวาง",
    locationIds: ["isle_shenlong"],
    dialogSceneId: "npc_evil_shenlong_cult_leader_zhao_talk",
    questIds: [
      "qe_shenlong_kidnap_scholar",
      "qe_shenlong_steal_dragon_pearl",
      "qe_shenlong_assassinate_priest",
      "qe_shenlong_collect_tribute",
      "qe_shenlong_clear_rebel",
      "qe_shenlong_initiate_test",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "fish_dragon", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["villain", "cult_leader"],
  },
];
