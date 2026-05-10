import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_XIAOYAO: readonly NpcDef[] = [
  {
    id: "sect_xiaoyao_master_yunxiao",
    name: "ปรมาจารย์ยุนเซียว",
    description: "ปรมาจารย์พรรคสราญรมย์ · ผู้สืบทอดมหาเวทดูดดาวและฝ่ามือสราญรมย์ · ฝีมือเทียบเท่าตำนานยุทธจักร · บุคลิกเสรีและไม่ชอบกฎเกณฑ์",
    locationIds: ["sect_xiaoyao"],
    dialogSceneId: "npc_sect_xiaoyao_master_yunxiao_talk",
    sparOpponentId: "spar_xiaoyao_master_yunxiao",
    sparFameReward: 18,
    questIds: [
      "qst_xiaoyao_disciple_intro",
      "qst_xiaoyao_sect_patrol",
      "qst_xiaoyao_sect_herb",
      "qst_xiaoyao_sect_music",
      "qst_xiaoyao_art_seepower",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "paper", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "xiaoyao"],
  },

  {
    id: "sect_xiaoyao_vice_tianshan",
    name: "รองอาจารย์เทียนซาน",
    description: "รองอาจารย์ของเซียวหยาว · ผู้เชี่ยวชาญลมปราณภูติอุดร · เคียงข้างยุนเซียวมาหลายสิบปี",
    locationIds: ["sect_xiaoyao"],
    dialogSceneId: "npc_sect_xiaoyao_vice_tianshan_talk",
    sparOpponentId: "spar_xiaoyao_tianshan",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "xiaoyao"],
  },

  {
    id: "sect_xiaoyao_sword_elder_wuyazi",
    name: "ผู้อาวุโสกระบี่อู๋หยาจื่อ",
    description: "ผู้อาวุโสฝ่ายกระบี่ของเซียวหยาว · เชี่ยวชาญกระบี่ขลุ่ยหยก · ตัวเงียบแต่ดาบฉับ",
    locationIds: ["sect_xiaoyao"],
    dialogSceneId: "npc_sect_xiaoyao_sword_elder_wuyazi_talk",
    sparOpponentId: "spar_xiaoyao_wuyazi",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "paper", weight: 2 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["elder", "xiaoyao", "swordsman"],
  },

  {
    id: "sect_xiaoyao_palm_elder_libai",
    name: "ผู้อาวุโสฝ่ามือหลี่ไป๋",
    description: "ผู้อาวุโสฝ่ายฝ่ามือของเซียวหยาว · เชี่ยวชาญฝ่ามือสราญรมย์และเพลงหมัด · บุคลิกขี้เล่นแต่ฝีมือเหี้ยม",
    locationIds: ["sect_xiaoyao"],
    sparOpponentId: "spar_xiaoyao_libai",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["elder", "xiaoyao", "palm_master"],
  },

  {
    id: "sect_xiaoyao_blade_elder_xiaorang",
    name: "ผู้อาวุโสดาบเสี่ยวหรง",
    description: "ผู้อาวุโสฝ่ายดาบของเซียวหยาว · เชี่ยวชาญดาบอสูรน้อยและกระบี่ลมอสูร · นิสัยเปิดเผยและตรงไปตรงมา",
    locationIds: ["sect_xiaoyao"],
    sparOpponentId: "spar_xiaoyao_xiaorang",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_blade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["elder", "xiaoyao", "blade"],
  },

  {
    id: "sect_xiaoyao_head_disciple_aliao",
    name: "หัวหน้าศิษย์อาเหลียว",
    description: "หัวหน้ารุ่นพี่ของศิษย์เซียวหยาว · เชี่ยวชาญหมัดอสูรน้อย · นำคำสั่งจากปรมาจารย์",
    locationIds: ["sect_xiaoyao"],
    sparOpponentId: "spar_xiaoyao_aliao",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["head_disciple", "xiaoyao"],
  },

  {
    id: "sect_xiaoyao_disciple_jiumozhi",
    name: "ศิษย์จิ่วม่อจื้อ",
    description: "ศิษย์เซียวหยาวผู้ฝึกหมัดรากพิษ · นิสัยลึกลับ · ใช้พิษเป็นทางออก",
    locationIds: ["sect_xiaoyao"],
    sparOpponentId: "spar_xiaoyao_jiumozhi",
    sparFameReward: 5,
    tags: ["disciple", "xiaoyao", "venom"],
  },

  {
    id: "sect_xiaoyao_junior_xiaolan",
    name: "ศิษย์เสี่ยวหลาน",
    description: "ศิษย์รุ่นเยาว์ของเซียวหยาว · เพิ่งเริ่มฝึกดาบอสูรน้อย · สดใสและขยัน",
    locationIds: ["sect_xiaoyao"],
    sparOpponentId: "spar_xiaoyao_xiaolan",
    sparFameReward: 3,
    tags: ["disciple", "xiaoyao"],
  },
];
