import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_TANG: readonly QuestDef[] = [
  {
    id: "qst_tang_disciple_intro",
    name: "ขอเข้าเป็นศิษย์สำนักสุลถัง",
    description: "เจ้าสำนักถังเหมินขอให้พิสูจน์ความสามารถในการหาวัตถุดิบของสำนัก — เก็บพิษงู ๕ + พิษแมงป่อง ๓ + พิษตะขาบ ๑ + สมุนไพรหายาก ๕. พิษงู/แมงป่องหาได้จากการสู้กับ bst_viper / bst_scorpion ในป่า ส่วนพิษตะขาบหาที่ป่ามืด · สมุนไพรหายากขุดได้ทั่วป่าเขา",
    briefSummary: "ส่งพิษงู 5 + พิษแมงป่อง 3 + พิษตะขาบ 1 + สมุนไพรหายาก 5 เพื่อเข้าเป็นศิษย์สำนักสุลถัง",
    type: "side",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 30 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather_offering",
        description: "เก็บพิษงู 5 · พิษแมงป่อง 3 · พิษตะขาบ 1 · สมุนไพรหายาก 5",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "viper_venom", count: 5 },
            { t: "hasItem", itemId: "scorpion_venom", count: 3 },
            { t: "hasItem", itemId: "centipede_venom", count: 1 },
            { t: "hasItem", itemId: "herb", count: 5 },
          ],
        },
      },
      {
        id: "return_to_chief",
        description: "นำของไปถวายเจ้าสำนักถังเหมิน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 10 },
      { t: "joinSect", sectId: "tang" },
      { t: "sectPoints", sectId: "tang", amount: 30 },
    ],
  },

  {
    id: "qst_tang_sect_patrol",
    name: "ลาดตระเวนป่าเสฉวน",
    description: "ภารกิจประจำของศิษย์ถังเหมิน — ลาดตระเวนป่ารอบสำนักและกำราบโจรที่ลอบเข้ามา",
    briefSummary: "ปราบโจรเร่ร่อน 3 คน · sect points +50",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าสำนัก",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 50 },
    ],
  },

  {
    id: "qst_tang_sect_venom",
    name: "ส่งวัตถุดิบให้ห้องปรุงพิษ",
    description: "ห้องปรุงพิษของถังเหมินต้องการพิษเพิ่มเพื่อปรุงยาพิเศษ — เก็บมาให้ครบ",
    briefSummary: "ส่งพิษงู 8 + พิษแมงป่อง 5 · sect points +60",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      {
        id: "gather",
        description: "เก็บพิษงู 8 · พิษแมงป่อง 5",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "viper_venom", count: 8 },
            { t: "hasItem", itemId: "scorpion_venom", count: 5 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งพิษให้เจ้าสำนัก",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 60 },
    ],
  },

  {
    id: "qst_tang_art_tenkpoisons",
    name: "ตำราพลังถังหมื่นพิษ",
    description: "เจ้าสำนักถังเหมินยอมเปิดตำราพลังถังหมื่นพิษให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความใจกล้า — เป็นวิชาลับสุดยอดของสำนัก",
    briefSummary: "ฝึกพลังถังหมื่นพิษ — รับ T4 art ลับของถังเหมิน",
    type: "side",
    sectId: "tang",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "tang" },
        { t: "sectRankAtLeast", sectId: "tang", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร (bandit_chief) 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_venoms",
        description: "พิสูจน์ใจ — รวบรวมพิษตะขาบ 3 ตัว",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 3 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากเจ้าสำนัก",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "t4_tang_tenkpoisons", level: 5 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 200 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 20 },
    ],
  },

  {
    id: "qst_tang_redemption",
    name: "ไถ่บาปต่อสำนักสุลถัง",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักสำนักสุลถังทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อสำนักสุลถัง — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectStatus", sectId: "tang", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — centipede_venom 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักสำนักสุลถัง" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "tang" },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 10 },
    ],
  },

  {
    id: "qst_tang_sect_venom2",
    name: "เก็บพิษเพิ่ม",
    description: "ภารกิจประจำของศิษย์สำนักสุลถัง — เก็บพิษงู 6 ชิ้น",
    briefSummary: "ส่งพิษงู 6 ชิ้น · sect points +50",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      { id: "main", description: "เก็บพิษงู 6 ชิ้น", autoAdvance: { t: "hasItem", itemId: "viper_venom", count: 6 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 50 },
    ],
  },
];
