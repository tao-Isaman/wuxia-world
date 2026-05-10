import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_TANG: readonly NpcDef[] = [
  {
    id: "sect_tang_chief_tangmen",
    name: "เจ้าสำนักถังเหมิน",
    description: "เจ้าสำนักของตระกูลถัง · ผู้สืบทอดมีดสั้นทะลวงใจและพลังถังหมื่นพิษ · ฝีมือเทียบเท่าตำนานยุทธจักร · เงียบขรึมและคิดล้ำลึก",
    locationIds: ["sect_tang"],
    dialogSceneId: "npc_sect_tang_chief_tangmen_talk",
    sparOpponentId: "spar_tang_chief_tangmen",
    sparFameReward: 18,
    questIds: [
      "qst_tang_disciple_intro",
      "qst_tang_sect_patrol",
      "qst_tang_sect_venom",
      "qst_tang_art_tenkpoisons",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "viper_venom", weight: 4 },
      { itemId: "scorpion_venom", weight: 3 },
      { itemId: "centipede_venom", weight: 3 },
      { itemId: "iron_blade", weight: 3 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "tang", "venom", "hidden_weapon"],
  },

  {
    id: "sect_tang_vice_tangshanhu",
    name: "รองเจ้าสำนักถังซานหู",
    description: "รองเจ้าสำนักของถังเหมิน · เชี่ยวชาญดาราพิรุณโปรย · พูดน้อยแต่เด็ดขาด",
    locationIds: ["sect_tang"],
    dialogSceneId: "npc_sect_tang_vice_tangshanhu_talk",
    sparOpponentId: "spar_tang_tangshanhu",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "viper_venom", weight: 3 },
      { itemId: "iron_blade", weight: 2 },
    ],
    tags: ["vice_master", "tang", "hidden_weapon"],
  },

  {
    id: "sect_tang_venom_elder_tangzhongtian",
    name: "ผู้อาวุโสพิษถังจงเทียน",
    description: "ผู้อาวุโสฝ่ายพิษของถังเหมิน · เชี่ยวชาญพลังถังหมื่นพิษและกายาร้อยพิษ · ดูแลห้องปรุงพิษของสำนัก",
    locationIds: ["sect_tang"],
    dialogSceneId: "npc_sect_tang_venom_elder_tangzhongtian_talk",
    sparOpponentId: "spar_tang_tangzhongtian",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "viper_venom", weight: 5 },
      { itemId: "scorpion_venom", weight: 4 },
      { itemId: "centipede_venom", weight: 3 },
      { itemId: "potion_big", weight: 2 },
    ],
    tags: ["elder", "tang", "venom"],
  },

  {
    id: "sect_tang_blade_elder_tangshibi",
    name: "ผู้อาวุโสมีดถังซือปี้",
    description: "ผู้อาวุโสฝ่ายมีดสั้นของถังเหมิน · เชี่ยวชาญมีดสั้นทะลวงใจและร้อยอสรพิษ · เด็ดเดี่ยวและเย็นชา",
    locationIds: ["sect_tang"],
    sparOpponentId: "spar_tang_tangshibi",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "iron_blade", weight: 4 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "potion_big", weight: 2 },
    ],
    tags: ["elder", "tang", "blade"],
  },

  {
    id: "sect_tang_chase_elder_tangrong",
    name: "ผู้อาวุโสไล่ล่าถังหรง",
    description: "ผู้อาวุโสฝ่ายเดินเร็วของถังเหมิน · เชี่ยวชาญท่าเท้าไล่ล่า · ใช้สำหรับงานติดตามและจารกรรม",
    locationIds: ["sect_tang"],
    sparOpponentId: "spar_tang_tangrong",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "viper_venom", weight: 2 },
    ],
    tags: ["elder", "tang", "scout"],
  },

  {
    id: "sect_tang_head_disciple_tanglin",
    name: "หัวหน้าศิษย์ถังหลิน",
    description: "หัวหน้ารุ่นพี่ของศิษย์ถังเหมิน · เชี่ยวชาญดาวตกแหวกฟ้า · นำคำสั่งจากเจ้าสำนัก",
    locationIds: ["sect_tang"],
    sparOpponentId: "spar_tang_tanglin",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "viper_venom", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["head_disciple", "tang"],
  },

  {
    id: "sect_tang_disciple_tangtao",
    name: "ศิษย์ถังเทา",
    description: "ศิษย์ถังเหมินผู้ฝึกมีดบินเคลือบพิษ · นิสัยคล่องแคล่วและขยันฝึกซ้อม",
    locationIds: ["sect_tang"],
    sparOpponentId: "spar_tang_tangtao",
    sparFameReward: 5,
    tags: ["disciple", "tang"],
  },

  {
    id: "sect_tang_junior_tangxiu",
    name: "ศิษย์ถังซิ่ว",
    description: "ศิษย์รุ่นเยาว์ของถังเหมิน · เพิ่งเริ่มฝึกมีดบินพื้นฐาน · สดใสและกระตือรือร้น",
    locationIds: ["sect_tang"],
    sparOpponentId: "spar_tang_tangxiu",
    sparFameReward: 3,
    tags: ["disciple", "tang"],
  },
];
