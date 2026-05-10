import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_SHAOLIN: readonly NpcDef[] = [
  {
    id: "sect_shaolin_abbot_huiyuan",
    name: "เจ้าอาวาสฮุยหยวน",
    description: "เจ้าอาวาสวัดเส้าหลิน วัยสูงอายุแต่ดวงตาเปล่งประกายเฉียบคม ฝีมือสุดยอดของยุทธจักรเทียบเท่าตำนาน · ผู้รวมหมัด-ดาบ-พลอง-เซน-อรหันต์เข้าเป็นหนึ่ง · ผู้รักษากฎเหล็กของสำนัก",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_abbot_huiyuan_talk",
    sparOpponentId: "spar_shaolin_abbot_huiyuan",
    sparFameReward: 18,
    questIds: [
      "qst_shaolin_disciple_intro",
      "qst_shaolin_relic_theft",
      "qst_shaolin_disciple_gone",
      "qst_shaolin_proof_of_heart",
      "qst_shaolin_sect_patrol",
      "qst_shaolin_sect_herb_run",
      "qst_shaolin_sect_meditation",
      "qst_shaolin_art_zen_finger",
      "qst_shaolin_art_legendary",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 5 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "monk", "shaolin"],
  },

  {
    id: "sect_shaolin_elder_faming",
    name: "อาจารย์ฝาหมิง",
    description: "พระอาจารย์อาวุโสแห่งเส้าหลิน ผู้คุมการฝึกหัดของสาวก ท่าทางเข้มขรึมเงียบขรึม",
    locationIds: ["sect_shaolin"],
    dialogSceneId: "npc_sect_shaolin_elder_faming_talk",
    sparOpponentId: "spar_shaolin_faming",
    sparFameReward: 8,
    questIds: ["qst_shaolin_iron_training"],
    tags: ["elder", "monk", "shaolin"],
  },

  {
    id: "sect_shaolin_disciple_xuanji",
    name: "ศิษย์เซวียนจี้",
    description: "ศิษย์ผู้เฝ้าประตูวัดเส้าหลิน อ่อนน้อมและกระตือรือร้น คอยรับแขกที่มาเยือน",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_xuanji",
    sparFameReward: 4,
    tags: ["disciple", "monk", "shaolin"],
  },

  {
    id: "sect_shaolin_head_disciple_yuanquan",
    name: "หัวหน้าศิษย์หยวนเฉวียน",
    description: "หัวหน้ารุ่นพี่ของศิษย์เส้าหลิน ฝีมือครบครันทั้งหมัดและดาบอรหันต์ เคร่งระเบียบแต่ใจดีต่อผู้เริ่มต้น",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_yuanquan",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "ginseng", weight: 1 },
    ],
    tags: ["head_disciple", "monk", "shaolin"],
  },

  {
    id: "sect_shaolin_zen_master_xianren",
    name: "หลวงพ่อเซียนเหริน",
    description: "พระอาจารย์อาวุโสสายเซน เชี่ยวชาญเอกนิ้วเซนและกระบี่วิธีเซน พลังภายในล้ำลึก พูดน้อยแต่ทุกประโยคเปี่ยมด้วยปัญญา",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_xianren",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "paper", weight: 3 },
      { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["elder", "monk", "shaolin", "zen"],
  },

  {
    id: "sect_shaolin_staff_master_juti",
    name: "หลวงพ่อจูตี้",
    description: "ปรมาจารย์พลองของเส้าหลิน ผู้สืบทอดตำราไม้เท้าสัจธรรม ร่างกายแข็งแกร่งดุจหินผา",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_juti",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "wood_hard", weight: 5 },
      { itemId: "iron_ore", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["elder", "monk", "shaolin", "staff_master"],
  },

  {
    id: "sect_shaolin_dharma_guardian_huimiao",
    name: "หลวงพี่ใหญ่ฮุยเหมียว",
    description: "ผู้พิทักษ์พระธรรมของเส้าหลิน ฝีมือหมัดทรงพลังที่สุดของวัด ร่างกายเปลี่ยนเส้นเอ็นแข็งแกร่งเหนือมนุษย์",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_huimiao",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 1 },
    ],
    tags: ["guardian", "monk", "shaolin"],
  },

  {
    id: "sect_shaolin_vice_abbot_luohan",
    name: "รองเจ้าอาวาสลั่วฮั่น",
    description: "รองเจ้าอาวาสเส้าหลิน เคียงข้างเจ้าอาวาสฮุยหยวนมานานนับสิบปี ฝีมือสูงสุดเป็นรองเพียงเจ้าอาวาส รวบรวมหมัด-ดาบ-พลองเข้าเป็นหนึ่ง",
    locationIds: ["sect_shaolin"],
    sparOpponentId: "spar_shaolin_luohan",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 5 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["vice_abbot", "monk", "shaolin"],
  },
];
