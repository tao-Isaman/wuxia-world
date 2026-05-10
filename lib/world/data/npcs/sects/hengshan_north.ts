import type { NpcDef } from "../../../types";

// เหิงซานเหนือ — Hengshan North (恒山派 / Northern Sacred Peak),
// the Buddhist nun's sect. Heavy defensive sword styles + dharma
// protection. All NPCs here are women (ภิกษุณี / นักพรต).
//
// Existing world references kept stable:
//   - sect_hengshan_north_nun_jingxin (was in old sects/hengshan.ts)
//   - spar_hengshan_north_nun (its spar opponent id)
// Both ids are preserved here so the world-validator does not
// drop quest / scene references after the split.

export const NPCS_HENGSHAN_NORTH: readonly NpcDef[] = [
  {
    id: "sect_hengshan_north_abbess_dingyi",
    name: "ภิกษุณีติ่งอี้",
    description:
      "เจ้าสำนักเหิงซานเหนือ · ใจเย็นดั่งหิมะยอดเขา ดาบหนักดั่งระฆังธรรม · ผู้สืบทอดดาบกระจกธรรมและฝึกศิษย์หญิงทั่วยุทธจักร",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_abbess_dingyi_talk",
    sparOpponentId: "spar_hengshan_north_dingyi",
    sparFameReward: 12,
    questIds: [
      "qst_hengshan_north_disciple_intro",
      "qst_hengshan_north_sect_offering",
      "qst_hengshan_north_sect_thugs",
      "qst_hengshan_north_sect_amulet",
      "qst_hengshan_north_art_mirror",
      "qst_hengshan_north_redemption",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "paper", weight: 5 },
      { itemId: "jade", weight: 4 },
      { itemId: "wood_soft", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "lotus_seed", weight: 2 },
    ],
    tags: ["sect_master", "nun", "swordswoman", "hengshan_north"],
  },

  {
    id: "sect_hengshan_north_vice_yihe",
    name: "ภิกษุณีอี๋เหอ",
    description:
      "รองเจ้าสำนักเหิงซานเหนือ · เคียงคู่ภิกษุณีติ่งอี้นานนับสิบปี · กระบี่ปกครองธรรมหนักแน่น · เคร่งระเบียบ พูดน้อย",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_vice_yihe_talk",
    sparOpponentId: "spar_hengshan_north_yihe",
    sparFameReward: 6,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "nun", "swordswoman", "hengshan_north"],
  },

  {
    id: "sect_hengshan_north_elder_yiqing",
    name: "ภิกษุณีอี๋ชิง",
    description:
      "ภิกษุณีอาวุโสของเหิงซานเหนือ · เป็นพี่ใหญ่ของศิษย์รุ่นใหม่ · เก่งดาบสะท้อนดั่งกระจก สอนศิษย์ด้วยพระธรรม",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_elder_yiqing_talk",
    sparOpponentId: "spar_hengshan_north_yiqing",
    sparFameReward: 5,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 3 },
      { itemId: "wood_soft", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "nun", "swordswoman", "hengshan_north"],
  },

  {
    id: "sect_hengshan_north_nun_jingxin",
    name: "นักพรตจิงซิน",
    description:
      "ภิกษุณีเหิงซานเหนือผู้ฝึกดาบในขลุ่ย · เสียงดนตรีกับฝีมือเป็นหนึ่งเดียว · ใจสงบแม้กลางสนามรบ",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_nun_jingxin_talk",
    sparOpponentId: "spar_hengshan_north_nun",
    sparFameReward: 3,
    tags: ["nun", "musician", "hengshan_north", "sparring"],
  },

  {
    id: "sect_hengshan_north_nun2_yilin",
    name: "นักพรตอี๋หลิน",
    description:
      "ภิกษุณีรุ่นเยาว์ของเหิงซานเหนือ · ใสซื่อ ใจดี ยังไม่เก่งดาบเท่ารุ่นพี่ · มักช่วยกวาดลานวัด",
    locationIds: ["sect_hengshan_north"],
    dialogSceneId: "npc_sect_hengshan_north_nun2_yilin_talk",
    sparOpponentId: "spar_hengshan_north_yilin",
    sparFameReward: 3,
    tags: ["disciple", "nun", "swordswoman", "hengshan_north"],
  },
];
