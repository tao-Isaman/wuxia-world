import type { NpcDef } from "../../../types";

// Per-sect content for hengshan_south.
// เฮิงซานใต้ — สำนักห้ายอด (5 peaks) · ชำนาญกระบี่ลีลาระบำ
// ธีม: yin/soft + SPEED — AGI หลัก, สกิลบัฟ Spd/Eva/Acc และตีหลายครั้ง

export const NPCS_HENGSHAN_SOUTH: readonly NpcDef[] = [
  {
    id: "sect_hengshan_south_master_modaxiansheng",
    name: "อาจารย์ใหญ่โม่ต้า",
    description: "อาจารย์ใหญ่แห่งเฮิงซานใต้ · ผู้สืบทอดเพลงกระบี่ห้ายอด · เคลื่อนไหวเหมือนระบำพริ้วไหว · บุคลิกสันโดษ ชอบสีซอเดี่ยวอยู่ใต้ต้นสน",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_master_modaxiansheng_talk",
    sparOpponentId: "spar_hengshan_south_master",
    sparFameReward: 12,
    questIds: [
      "qst_hengshan_south_disciple_intro",
      "qst_hengshan_south_sect_patrol",
      "qst_hengshan_south_sect_silk",
      "qst_hengshan_south_sect_herb",
      "qst_hengshan_south_art_swiftblade",
      "qst_hengshan_south_redemption",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "iron_ore", weight: 4 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "swordsman", "hengshan_south"],
  },

  {
    id: "sect_hengshan_south_vice_liuzhengfeng",
    name: "รองอาจารย์หลิวเจิ้งเฟิง",
    description: "รองอาจารย์ของเฮิงซานใต้ · ฝีมือกระบี่เปี่ยมไหวพริบ · ชอบบรรเลงพิณคู่กับเพื่อนรัก · ใจเปิดกว้างต่อจอมยุทธ์ทุกฝ่าย",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_vice_liuzhengfeng_talk",
    sparOpponentId: "spar_hengshan_south_vice",
    sparFameReward: 10,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["vice_master", "swordsman", "hengshan_south"],
  },

  {
    id: "sect_hengshan_south_elder_luge",
    name: "อาจารย์กระบี่ลู่เก๋อ",
    description: "อาจารย์กระบี่อาวุโส · เก่งเพลงกระบี่ห้ายอดและกระบี่ระบำเมฆา · พูดน้อยแต่ลีลากระบี่ลื่นไหลเหมือนสายน้ำ",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_elder_luge_talk",
    sparOpponentId: "spar_hengshan_south_elder",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "iron_ore", weight: 3 },
      { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "swordsman", "hengshan_south"],
  },

  {
    id: "sect_hengshan_south_disciple_yuepan",
    name: "ศิษย์เยว่ผาน",
    description: "ลูกศิษย์เฮิงซานใต้ผู้ชำนาญลีลากระบี่ห้ายอด · เคลื่อนไหวเหมือนระบำ · กระตือรือร้น มักเชิญแขกมาประลองอยู่หน้าประตูสำนัก",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_disciple_yuepan_talk",
    sparOpponentId: "spar_hengshan_south_disciple",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "hengshan_south", "sparring"],
  },

  {
    id: "sect_hengshan_south_disciple2_qingfeng",
    name: "ศิษย์ชิงเฟิง",
    description: "ศิษย์ดาบเฮิงซานใต้รุ่นรอง · ตัวเบาว่องไว · มักวิ่งบนยอดต้นไม้เพื่อฝึกท่ากระบี่บินเหินเมฆ",
    locationIds: ["sect_hengshan_south"],
    dialogSceneId: "npc_sect_hengshan_south_disciple2_qingfeng_talk",
    sparOpponentId: "spar_hengshan_south_disciple2",
    sparFameReward: 4,
    tags: ["disciple", "swordsman", "hengshan_south", "sparring"],
  },
];
