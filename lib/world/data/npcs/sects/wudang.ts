import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_WUDANG: readonly NpcDef[] = [
  {
    id: "sect_wudang_master_qingxu",
    name: "อาจารย์ชิงซวี่",
    description: "อาจารย์ใหญ่แห่งอู่ตัง · ผู้สืบทอดไทจี้และจื่อเสียจนเป็นหนึ่งเดียว · ผสานหยินหยางและสะท้อนพลังในเพลงกระบี่เดียว · บุคลิกอบอุ่นแต่ฝีมือเทียบเท่าตำนานยุทธจักร",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_master_qingxu_talk",
    sparOpponentId: "spar_wudang_master_qingxu",
    sparFameReward: 18,
    questIds: [
      "qst_wudang_disciple_intro",
      "qst_wudang_sacred_herb",
      "qst_wudang_traitor_disciple",
      "qst_wudang_mountain_seal",
      "qst_wudang_sect_patrol",
      "qst_wudang_sect_herb_run",
      "qst_wudang_art_yinyang",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 5 },
      { itemId: "snow_lotus", weight: 2 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "taoist", "wudang"],
  },

  {
    id: "sect_wudang_vice_master_xuancheng",
    name: "รองอาจารย์เสวียนเฉิง",
    description: "รองอาจารย์ของอู่ตัง · เคียงข้างอาจารย์ชิงซวี่นานนับสิบปี · ฝีมือกระบี่ไหลลื่นและจิตใจเที่ยงตรง",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_vice_master_xuancheng_talk",
    sparOpponentId: "spar_wudang_xuancheng",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
    ],
    tags: ["vice_master", "taoist", "wudang"],
  },

  {
    id: "sect_wudang_sword_elder_lingyu",
    name: "อาจารย์ดาบหลิงอวี้",
    description: "ปรมาจารย์กระบี่อู่ตัง · ผู้สืบทอดเพลงกระบี่เคลื่อนเมฆาและกระบี่เหนือฟ้า · เก่งทั้งสอนและฟัน",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_sword_elder_lingyu_talk",
    sparOpponentId: "spar_wudang_lingyu",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "iron_ore", weight: 2 },
    ],
    tags: ["elder", "taoist", "wudang", "swordsman"],
  },

  {
    id: "sect_wudang_inner_elder_baochun",
    name: "อาจารย์ปราณเป่าชุน",
    description: "ปรมาจารย์ปราณภายในของอู่ตัง · ผู้คุมการฝึกสมาธิและการหายใจ · พูดน้อยแต่ใจกว้าง",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_baochun",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 1 },
    ],
    tags: ["elder", "taoist", "wudang", "internal"],
  },

  {
    id: "sect_wudang_head_disciple_zhirong",
    name: "หัวหน้าศิษย์จื้อหรง",
    description: "หัวหน้ารุ่นพี่ของศิษย์อู่ตัง · ฝีมือกระบี่ไทเก๊กเจนจัด · เคร่งระเบียบแต่ใจดีต่อรุ่นน้อง",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_zhirong",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "ginseng", weight: 1 },
    ],
    tags: ["head_disciple", "taoist", "wudang"],
  },

  {
    id: "sect_wudang_disciple_yujian",
    name: "ศิษย์อวี่เจี้ยน",
    description: "ศิษย์อู่ตังหนุ่มผู้ฝึกกระบี่หยินหยาง · มือเร็วและฝึกซ้อมไม่หยุด",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_yujian",
    sparFameReward: 5,
    tags: ["disciple", "taoist", "wudang", "sparring"],
  },

  {
    id: "sect_wudang_disciple_qingxin",
    name: "ศิษย์ชิงซิน",
    description: "ศิษย์อู่ตังผู้เฝ้าประตูสำนัก · อ่อนน้อมและเปี่ยมใจเมตตา · คอยรับแขกที่ขึ้นเขามา",
    locationIds: ["sect_wudang"],
    sparOpponentId: "spar_wudang_qingxin",
    sparFameReward: 4,
    tags: ["disciple", "taoist", "wudang"],
  },

  {
    id: "sect_wudang_disciple_qingfeng",
    name: "สาวกชิงเฟิง",
    description: "ศิษย์อู่ตังที่ฝึกไทจี้กับสะท้อนพลังจนเป็นหนึ่งเดียว ใช้กระบี่อย่างสงบนิ่ง",
    locationIds: ["sect_wudang"],
    dialogSceneId: "npc_sect_wudang_disciple_qingfeng_talk",
    sparOpponentId: "spar_wudang_disciple",
    sparFameReward: 5,
    tags: ["disciple", "taoist", "wudang", "sparring"],
  },
];
