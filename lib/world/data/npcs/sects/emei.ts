import type { NpcDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const NPCS_EMEI: readonly NpcDef[] = [
  {
    id: "sect_emei_abbess_jingchan",
    name: "ท่านนิ้วห้วนจิงฉาน",
    description: "ท่านนิ้วชั้นสูงของง้อไบ๊ · ผู้สืบทอดวิชาโพธิสัตว์และกระบี่พิทักษ์ · มารยาทงดงามแต่ใจเฉียบขาดต่อกฎศีลและความยุติธรรม · ฝีมือเทียบเท่าตำนานยุทธจักร",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_abbess_jingchan_talk",
    sparOpponentId: "spar_emei_abbess_jingchan",
    sparFameReward: 18,
    questIds: [
      "qst_emei_disciple_intro",
      "qst_emei_kidnapped_novice",
      "qst_emei_poison_antidote",
      "qst_emei_sect_patrol",
      "qst_emei_sect_herb",
      "qst_emei_art_bodhi",
    ],
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 4 },
      { itemId: "ginseng", weight: 4 },
      { itemId: "lotus_seed", weight: 4 },
      { itemId: "snow_lotus", weight: 3 },
      { itemId: "potion_mid", weight: 3 },
      { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 },
    ],
    tags: ["sect_master", "nun", "emei"],
  },

  {
    id: "sect_emei_vice_abbess_huimiao",
    name: "รองท่านนิ้วฮุยเหมียว",
    description: "รองท่านนิ้วของง้อไบ๊ · เคียงข้างจิงฉานนานนับสิบปี · กระบี่ดอกเหมยและฝ่ามือดอกบัวบานเชี่ยวชาญ",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_vice_abbess_huimiao_talk",
    sparOpponentId: "spar_emei_huimiao",
    sparFameReward: 14,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 },
    ],
    tags: ["vice_master", "nun", "emei"],
  },

  {
    id: "sect_emei_sword_elder_qingxin",
    name: "ท่านนิ้วดาบชิงซิน",
    description: "ปรมาจารย์กระบี่ของง้อไบ๊ · ผู้สืบทอดเพลงกระบี่วิธีพุทธและกระบี่พิทักษ์โพธิสัตว์ · พูดน้อยแต่ดาบเฉียบขาด",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_sword_elder_qingxin_talk",
    sparOpponentId: "spar_emei_qingxin",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "herb", weight: 3 },
      { itemId: "jade", weight: 3 },
      { itemId: "iron_ore", weight: 2 },
    ],
    tags: ["elder", "nun", "emei", "swordswoman"],
  },

  {
    id: "sect_emei_palm_elder_huiyu",
    name: "ท่านนิ้วฝ่ามือฮุยอวี้",
    description: "ปรมาจารย์ฝ่ามือของง้อไบ๊ · เชี่ยวชาญฝ่ามือโพธิสัตว์และฝ่ามือดอกบัวบาน · ใจเมตตาและฝีมือเงียบ",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_huiyu",
    sparFameReward: 12,
    defenseTier: 4,
    stealLoot: [
      { itemId: "ginseng", weight: 4 },
      { itemId: "lotus_seed", weight: 3 },
      { itemId: "jade", weight: 2 },
    ],
    tags: ["elder", "nun", "emei"],
  },

  {
    id: "sect_emei_healer_elder_yuxin",
    name: "หมอนิ้วอวี้ซิน",
    description: "ปรมาจารย์ยาของง้อไบ๊ · เชี่ยวชาญสมุนไพรและการรักษาบาดแผล · ดูแลห้องยาของวัด",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_yuxin",
    sparFameReward: 10,
    defenseTier: 3,
    stealLoot: [
      { itemId: "herb", weight: 5 },
      { itemId: "ginseng", weight: 4 },
      { itemId: "snow_lotus", weight: 2 },
      { itemId: "potion_mid", weight: 3 },
    ],
    tags: ["elder", "nun", "emei", "healer"],
  },

  {
    id: "sect_emei_head_disciple_zhihui",
    name: "หัวหน้าศิษย์จื้อฮุย",
    description: "หัวหน้ารุ่นพี่ของศิษย์ง้อไบ๊ · กระบี่ดอกบุปผาเชี่ยวชาญ · เคร่งระเบียบและใจดีต่อรุ่นน้อง",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_zhihui",
    sparFameReward: 8,
    defenseTier: 2,
    stealLoot: [
      { itemId: "herb", weight: 3 },
      { itemId: "lotus_seed", weight: 2 },
      { itemId: "ginseng", weight: 1 },
    ],
    tags: ["head_disciple", "nun", "emei"],
  },

  {
    id: "sect_emei_disciple_xiaoyu",
    name: "ศิษย์เสี่ยวอวี้",
    description: "ศิษย์ง้อไบ๊หนุ่มสาวผู้ฝึกฝ่ามือดอกบัวบาน · สดใสและขยันฝึกซ้อม",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_xiaoyu",
    sparFameReward: 5,
    tags: ["disciple", "nun", "emei", "sparring"],
  },

  {
    id: "sect_emei_gatekeeper_lingxin",
    name: "ศิษย์หลิงซิน",
    description: "ศิษย์ผู้เฝ้าประตูวัดง้อไบ๊ · อ่อนน้อมและเปี่ยมเมตตา · คอยรับแขกที่ขึ้นเขามา",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_lingxin",
    sparFameReward: 4,
    tags: ["disciple", "nun", "emei"],
  },

  {
    id: "sect_emei_junior_disciple_yujie",
    name: "ศิษย์อวี้เจี๋ย",
    description: "ศิษย์รุ่นเยาว์ของง้อไบ๊ · เพิ่งเริ่มฝึกกระบี่อ่อนช้อย · ใจร้อนแต่ตั้งใจ",
    locationIds: ["sect_emei"],
    sparOpponentId: "spar_emei_yujie",
    sparFameReward: 3,
    tags: ["disciple", "nun", "emei"],
  },

  {
    id: "sect_emei_nun_qingyu",
    name: "นักพรตชิงอวี้",
    description: "ภิกษุณีง้อไบ๊ผู้ฝึกกระบี่น้ำกับดาบน้ำค้าง ใจเย็นและมือเร็ว",
    locationIds: ["sect_emei"],
    dialogSceneId: "npc_sect_emei_nun_qingyu_talk",
    sparOpponentId: "spar_emei_nun",
    sparFameReward: 5,
    tags: ["nun", "swordswoman", "emei", "sparring"],
  },
];
