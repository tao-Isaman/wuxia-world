import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_QUANZHEN: readonly NpcDef[] = [
  {
    id: "sect_quanzhen_master_chongyang",
    name: "อาจารย์ใหญ่ฉงหยาง",
    description: "อาจารย์ใหญ่แห่งฉวนเจิน · ผู้สืบทอดวิชาสุริยันต์และดาบสะกดเเสง · ใจสะอาดและใช้ชีวิตอย่างนักพรต · บุคลิกเรียบง่ายแต่มากด้วยปัญญา",
    locationIds: ["sect_quanzhen"],
    dialogSceneId: "npc_sect_quanzhen_master_chongyang_talk",
    sparOpponentId: "spar_quanzhen_master_chongyang",
    sparFameReward: 12,
    questIds: [
      "qst_quanzhen_disciple_intro",
      "qst_quanzhen_sect_patrol",
      "qst_quanzhen_sect_scripture",
      "qst_quanzhen_art_sun",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "paper", weight: 5 },
      { itemId: "ink", weight: 5 },
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
    ],
    tags: ["sect_master", "taoist", "quanzhen"],
  },

  {
    id: "sect_quanzhen_vice_master_mayu",
    name: "รองอาจารย์หม่ายวี่",
    description: "รองอาจารย์ของฉวนเจิน · เคียงข้างอาจารย์ฉงหยางมานานนับสิบปี · ดาบหนักแต่แม่นยำ · พูดน้อยฟังมาก",
    locationIds: ["sect_quanzhen"],
    dialogSceneId: "npc_sect_quanzhen_vice_master_mayu_talk",
    sparOpponentId: "spar_quanzhen_mayu",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "taoist", "quanzhen"],
  },

  {
    id: "sect_quanzhen_sword_elder_qiuchuji",
    name: "อาจารย์ดาบชิวฉู่จี้",
    description: "ปรมาจารย์ดาบของฉวนเจิน · ผู้สืบทอดกระบี่สะกดสุริยันต์ · บุคลิกเด็ดเดี่ยวและใจตรงไปตรงมา",
    locationIds: ["sect_quanzhen"],
    dialogSceneId: "npc_sect_quanzhen_sword_elder_qiuchuji_talk",
    sparOpponentId: "spar_quanzhen_qiuchuji",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "iron_ore", weight: 2 },
    ],
    tags: ["elder", "taoist", "quanzhen", "swordsman"],
  },

  {
    id: "sect_quanzhen_inner_elder_yaolan",
    name: "อาจารย์ปราณเหยาหลัน",
    description: "ปรมาจารย์ปราณภายในของฉวนเจิน · เชี่ยวชาญลมปราณหยางบริสุทธิ์ · เป็นผู้คุมห้องสมุดและคัมภีร์ลับ",
    locationIds: ["sect_quanzhen"],
    sparOpponentId: "spar_quanzhen_yaolan",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 4 },
      { itemId: "ginseng", weight: 2 },
    ],
    tags: ["elder", "taoist", "quanzhen", "internal"],
  },

  {
    id: "sect_quanzhen_disciple_yangzi",
    name: "ศิษย์หยางจื่อ",
    description: "ศิษย์รุ่นเยาว์ของฉวนเจิน · ฝึกหมัดและกระบี่ขยันขันแข็ง · นิสัยร่าเริงและช่วยเหลือผู้อื่น",
    locationIds: ["sect_quanzhen"],
    sparOpponentId: "spar_quanzhen_yangzi",
    sparFameReward: 4,
    tags: ["disciple", "taoist", "quanzhen"],
  },

  {
    id: "sect_quanzhen_disciple_chongxu",
    name: "สาวกชงซวี",
    description: "ศิษย์ฉวนเจินที่กระบี่ทั้งสามทิศ ปราณภายในหนาแน่นและมั่นคง",
    locationIds: ["sect_quanzhen"],
    dialogSceneId: "npc_sect_quanzhen_disciple_chongxu_talk",
    sparOpponentId: "spar_quanzhen_disciple",
    sparFameReward: 6,
    tags: ["disciple", "taoist", "quanzhen", "sparring"],
  },
];
