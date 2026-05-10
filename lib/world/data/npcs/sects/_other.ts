import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS__OTHER: readonly NpcDef[] = [
  {
    id: "villa_yaowang_doctor_shennong",
    name: "หมอเสินหนง",
    description: "หมอผีมือสูงแห่งวิลล่ายาวัง ผู้รู้สรรพวิชาสมุนไพรและยาพิษ เงียบขรึมแต่เมตตา",
    locationIds: ["villa_yaowang"],
    dialogSceneId: "npc_villa_yaowang_doctor_shennong_talk",
    questIds: [
      "qst_yaowang_rare_ingredient",
      "qst_yaowang_plague_village",
      "qst_yaowang_venom_antidote",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 4 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "snow_lotus", weight: 2 },
      { itemId: "potion_big", weight: 2 },
      { itemId: "viper_venom", weight: 2 },
    ],
    tags: ["doctor", "herbalist", "yaowang"],
  },

  {
    id: "temple_dalun_monk_kongxin",
    name: "พระกงซิน",
    description: "พระผู้รักษาพระธาตุโบราณแห่งวัดตาหลุน สงบนิ่งอยู่เสมอ แต่มีเรื่องหนักใจซ่อนอยู่",
    locationIds: ["temple_dalun"],
    dialogSceneId: "npc_temple_dalun_monk_kongxin_talk",
    questIds: [
      "qst_dalun_stolen_relic",
      "qst_dalun_pilgrim_mission",
    ],
    defenseTier: 2,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "ginseng", weight: 3 },
      { itemId: "paper", weight: 4 },
      { itemId: "ink", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
    ],
    tags: ["monk", "temple", "dalun"],
  },

  {
    id: "villa_yanzi_lord_yanfeng",
    name: "เจ้าบ้านเหยินเฟิง",
    description: "เจ้าของคฤหาสน์เหยินซี ตระกูลขุนนางเก่า ใจโอบอ้อมอารีแต่มีศัตรูมาก ชอบผู้มีฝีมือ",
    locationIds: ["villa_yanzi"],
    dialogSceneId: "npc_villa_yanzi_lord_yanfeng_talk",
    questIds: [
      "qst_yanzi_rival_clan",
      "qst_yanzi_bodyguard_escort",
      "qst_yanzi_stolen_heirloom",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "jade", weight: 3 },
      { itemId: "gold_ore", weight: 3 },
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade_amulet", weight: 1 },
      { itemId: "silver_ring", weight: 2 },
    ],
    tags: ["noble", "lord", "yanzi"],
  },

  {
    id: "palace_zhongyang_envoy_liuying",
    name: "ทูตหลิวอิง",
    description: "ทูตพระราชสำนักประจำวังจงหยาง หน้าตาดีแต่ซ่อนเจตนาลึก ส่งข้อความระหว่างสำนักต่าง ๆ",
    locationIds: ["palace_zhongyang"],
    dialogSceneId: "npc_palace_zhongyang_envoy_liuying_talk",
    questIds: [
      "qst_zhongyang_imperial_letter",
      "qst_zhongyang_noble_intrigue",
    ],
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "gold_ore", weight: 3 },
      { itemId: "jade", weight: 2 },
      { itemId: "paper", weight: 4 },
      { itemId: "silver_ring", weight: 1 },
    ],
    tags: ["envoy", "imperial", "zhongyang"],
  },
];
