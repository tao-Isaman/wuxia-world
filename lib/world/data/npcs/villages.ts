import type { NpcDef } from "../../types";

// NPCs anchored at villages and inns:
//   village_qigu · village_noname · village_meihua · village_huashan
//   village_taishan · village_hengshan · village_wuxia
//   inn_yuelai · inn_youjian · inn_gaosheng · inn_heluo
//
// Owned by content agent B. Each NPC's dialog lives in
// lib/world/data/scenes-content/villages.ts; quests in
// lib/world/data/quests/villages.ts.

export const NPCS_VILLAGES: readonly NpcDef[] = [
  // ─── village_qigu ──────────────────────────────────────────────────
  {
    id: "vil_qigu_farmer_lao",
    name: "ลาวหนาน",
    description: "ชาวนาแก่ผู้รู้จักทุกซอกมุมของหมู่บ้านชีกู่ · มีเรื่องลึกลับในครอบครัว",
    locationIds: ["village_qigu"],
    dialogSceneId: "npc_vil_qigu_farmer_lao_talk",
    questIds: [
      "qv_qigu_missing_seed",
      "qv_qigu_wolf_menace",
      "qv_qigu_ancestor_tablet",
    ],
    tags: ["farmer", "elder"],
  },
  {
    id: "vil_qigu_herbalist_mei",
    name: "นางเหมย",
    description: "หมอสมุนไพรหญิงผู้เงียบขรึม ผู้รู้แจ้งสรรพคุณของพืชทุกชนิดบนเชิงเขา",
    locationIds: ["village_qigu"],
    dialogSceneId: "npc_vil_qigu_herbalist_mei_talk",
    questIds: [
      "qv_qigu_rare_herb",
      "qv_qigu_poisoned_well",
    ],
    tags: ["herbalist", "healer"],
  },

  // ─── village_meihua ────────────────────────────────────────────────
  {
    id: "vil_meihua_musician_chen",
    name: "เฉินเยว่",
    description: "นักดนตรีเร่ร่อนที่มาปักหลักอยู่ในหมู่บ้านดอกเหมย เล่นพิณได้ไพเราะดั่งเสียงแห่งสวรรค์",
    locationIds: ["village_meihua"],
    dialogSceneId: "npc_vil_meihua_musician_chen_talk",
    questIds: [
      "qv_meihua_lost_score",
      "qv_meihua_music_duel",
      "qv_meihua_plum_festival",
    ],
    tags: ["musician", "wanderer"],
  },
  {
    id: "vil_meihua_hunter_bao",
    name: "เปาเหล็กก้าน",
    description: "นักล่าสัตว์แข็งแกร่งที่เคยเป็นทหารเก่า ตอนนี้ใช้ชีวิตเรียบง่ายในหมู่บ้านดอกเหมย",
    locationIds: ["village_meihua"],
    dialogSceneId: "npc_vil_meihua_hunter_bao_talk",
    questIds: [
      "qv_meihua_boar_hunt",
      "qv_meihua_tiger_track",
    ],
    tags: ["hunter", "retired_warrior"],
  },

  // ─── village_hengshan ─────────────────────────────────────────────
  {
    id: "vil_hengshan_elder_wu",
    name: "ผู้อาวุโสอู๋",
    description: "ผู้เฒ่าผู้รักดนตรีอย่างสุดหัวใจ ดำรงตำแหน่งผู้นำชุมชนหมู่บ้านฮิงซาน",
    locationIds: ["village_hengshan"],
    dialogSceneId: "npc_vil_hengshan_elder_wu_talk",
    questIds: [
      "qv_hengshan_song_scroll",
      "qv_hengshan_dispute_land",
      "qv_hengshan_winter_aid",
    ],
    tags: ["elder", "musician"],
  },

  // ─── village_wuxia ────────────────────────────────────────────────
  {
    id: "vil_wuxia_fisherman_deng",
    name: "เติ้งลองหาง",
    description: "ชาวประมงปากแม่น้ำผู้รู้ทุกเส้นทางน้ำ · มักเห็นสิ่งแปลกในกลางคืน",
    locationIds: ["village_wuxia"],
    dialogSceneId: "npc_vil_wuxia_fisherman_deng_talk",
    questIds: [
      "qv_wuxia_missing_boat",
      "qv_wuxia_river_ghost",
      "qv_wuxia_pirate_cache",
    ],
    tags: ["fisherman"],
  },

  // ─── inn_yuelai ───────────────────────────────────────────────────
  {
    id: "inn_yuelai_server_xiu",
    name: "นางสาวซิ่ว",
    description: "สาวเสิร์ฟช่างพูดของโรงเตี๊ยมยุเหล่ย รู้ทุกข่าวคราวของผู้คนที่ผ่านไปมา",
    locationIds: ["inn_yuelai"],
    dialogSceneId: "npc_inn_yuelai_server_xiu_talk",
    questIds: [
      "qv_inn_lost_satchel",
      "qv_inn_spy_guest",
      "qv_inn_debt_collector",
    ],
    defenseTier: 1,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "rice_dish", weight: 3 },
      { itemId: "spicy_stew", weight: 3 },
      { itemId: "potion", weight: 2 },
    ],
    tags: ["innkeeper", "gossip"],
  },

  // ─── inn_gaosheng ─────────────────────────────────────────────────
  {
    id: "inn_gaosheng_keeper_fat",
    name: "เฉาอ้วน",
    description: "เจ้าของโรงเตี๊ยมเกาเซิ่งผู้ใจดี · ครั้งหนึ่งเคยเป็นยอดยุทธแต่หันมาทำอาหาร",
    locationIds: ["inn_gaosheng"],
    dialogSceneId: "npc_inn_gaosheng_keeper_fat_talk",
    questIds: [
      "qv_inn_special_ingredient",
      "qv_inn_rival_inn",
      "qv_inn_drunk_warrior",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "rice_dish", weight: 3 },
      { itemId: "spicy_stew", weight: 3 },
      { itemId: "potion", weight: 2 },
      { itemId: "iron_blade", weight: 1 },
    ],
    tags: ["innkeeper", "retired_warrior", "chef"],
  },

  // ─── inn_heluo ────────────────────────────────────────────────────
  {
    id: "inn_heluo_storyteller_po",
    name: "โปผู้เล่าเรื่อง",
    description: "คนเฒ่าผู้เล่าเรื่องในโรงเตี๊ยมเฮ่อลั่ว เรื่องราวของท่านแปลกและน่าสนใจเสมอ",
    locationIds: ["inn_heluo"],
    dialogSceneId: "npc_inn_heluo_storyteller_po_talk",
    questIds: [
      "qv_inn_legend_verify",
      "qv_inn_missing_traveler",
    ],
    tags: ["storyteller", "elder"],
  },
];
