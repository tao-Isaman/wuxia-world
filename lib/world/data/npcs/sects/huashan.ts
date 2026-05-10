import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_HUASHAN: readonly NpcDef[] = [
  {
    id: "sect_huashan_master_yiqing",
    name: "อาจารย์ใหญ่อี้ชิง",
    description: "อาจารย์ใหญ่แห่งหัวซาน · ผู้สืบทอดเพลงกระบี่เมฆาม่วง · ใจรักดาบจนอุทิศชีวิตให้สำนัก · บุคลิกเปิดเผย รับศิษย์ทุกคนที่ใจรักดาบ",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_master_yiqing_talk",
    sparOpponentId: "spar_huashan_master_yiqing",
    sparFameReward: 12,
    questIds: [
      "qst_huashan_disciple_intro",
      "qst_huashan_sect_patrol",
      "qst_huashan_sect_iron",
      "qst_huashan_art_purplecloud",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 5 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "swordsman", "huashan"],
  },

  {
    id: "sect_huashan_vice_master_zifeng",
    name: "รองอาจารย์จื่อเฟิง",
    description: "รองอาจารย์ของหัวซาน · เคียงข้างอาจารย์อี้ชิงนับสิบปี · ฝีมือกระบี่หนักแน่น สมาธิเที่ยงตรง",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_vice_master_zifeng_talk",
    sparOpponentId: "spar_huashan_zifeng",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "swordsman", "huashan"],
  },

  {
    id: "sect_huashan_sword_elder_qingsong",
    name: "อาจารย์ดาบชิงซ่ง",
    description: "ปรมาจารย์กระบี่อาวุโสของหัวซาน · เก่งทั้งเพลงเมฆาล่องลอยและกระบี่เมฆาม่วง · พูดน้อยแต่ดาบเฉียบขาด",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_sword_elder_qingsong_talk",
    sparOpponentId: "spar_huashan_qingsong",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "swordsman", "huashan"],
  },

  {
    id: "sect_huashan_head_disciple_zhongming",
    name: "หัวหน้าศิษย์จงหมิง",
    description: "หัวหน้ารุ่นพี่ของศิษย์หัวซาน · กระบี่เมฆาล่องลอยเชี่ยวชาญ · เคร่งระเบียบและตรงไปตรงมา",
    locationIds: ["sect_huashan"],
    sparOpponentId: "spar_huashan_zhongming",
    sparFameReward: 6,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 2 },
    ],
    tags: ["head_disciple", "swordsman", "huashan"],
  },

  {
    id: "sect_huashan_disciple_xiaoyun",
    name: "ศิษย์เสี่ยวอวิ๋น",
    description: "ศิษย์หัวซานผู้เฝ้าประตูสำนัก · กระตือรือร้นและอ่อนน้อม · คอยรับแขกที่มาเยือนเขา",
    locationIds: ["sect_huashan"],
    sparOpponentId: "spar_huashan_xiaoyun",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "huashan"],
  },

  {
    id: "sect_huashan_disciple_jianyi",
    name: "ศิษย์เจี้ยนอี้",
    description: "ศิษย์ดาบหัวซาน ทะเยอทะยาน เชื่อในการฝึกซ้อมจนเลือดสาด",
    locationIds: ["sect_huashan"],
    dialogSceneId: "npc_sect_huashan_disciple_jianyi_talk",
    sparOpponentId: "spar_huashan_disciple",
    sparFameReward: 5,
    tags: ["disciple", "swordsman", "huashan", "sparring"],
  },
];
