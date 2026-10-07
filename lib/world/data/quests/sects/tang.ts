import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_TANG: readonly QuestDef[] = [
  {
    id: "qst_tang_disciple_intro",
    name: "ขอเข้าเป็นศิษย์สำนักสกุลถัง",
    description: "เจ้าสำนักถังเหมินขอให้พิสูจน์ความสามารถในการหาวัตถุดิบของสำนัก — เก็บพิษงู 5 + พิษแมงป่อง 3 + พิษตะขาบ 1 + สมุนไพรหายาก 5. พิษงูและพิษแมงป่องได้จากการปราบงูพิษและแมงป่องในป่า ส่วนพิษตะขาบหาได้ในป่ามืด · สมุนไพรหายากขุดได้ทั่วป่าเขา",
    briefSummary: "ส่งพิษงู 5 + พิษแมงป่อง 3 + พิษตะขาบ 1 + สมุนไพรหายาก 5 เพื่อเข้าเป็นศิษย์สำนักสกุลถัง",
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
    briefSummary: "ปราบโจรเร่ร่อน 3 คน · แต้มสำนัก +50",
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
        description: "กลับไปรายงานเจ้าสำนักถังเหมิน",
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
    briefSummary: "ส่งพิษงู 8 + พิษแมงป่อง 5 · แต้มสำนัก +60",
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
        description: "ส่งพิษให้เจ้าสำนักถังเหมิน",
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
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "เจ้าสำนักถังเหมินจะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความใจกล้า — ปราบหัวหน้าโจร 4 คน และหาพิษตะขาบ 3 ขวด (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "tang",
    isArtQuest: true,
    minSectRank: 2,
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
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_venoms",
        description: "พิสูจน์ใจกล้า — หาพิษตะขาบ 3 ขวด",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 3 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อเจ้าสำนักถังเหมิน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 200 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 20 },
    ],
  },

  {
    id: "qst_tang_redemption",
    name: "ไถ่บาปต่อสำนักสกุลถัง",
    description: "เจ้าเคยทรยศสำนักสกุลถัง สำนักจึงส่งนักล่ามาตามเจ้า — แต่เจ้าสำนักถังเหมินยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำพิษตะขาบ 5 ขวดมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของสำนักสกุลถังที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อสำนักสกุลถัง — ปราบหัวหน้าโจร 5 + ถวายพิษตะขาบ 5 ขวด",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectStatus", sectId: "tang", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำพิษตะขาบ 5 ขวดมาถวาย", autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักถังเหมิน" },
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
    description: "ภารกิจประจำของศิษย์สำนักสกุลถัง — ห้องปรุงพิษต้องการพิษงู 6 ขวด",
    briefSummary: "ส่งพิษงู 6 ขวด · แต้มสำนัก +50",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      { id: "main", description: "เก็บพิษงู 6 ขวด", autoAdvance: { t: "hasItem", itemId: "viper_venom", count: 6 } },
      { id: "report", description: "กลับไปรายงานเจ้าสำนักถังเหมิน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 50 },
    ],
  },

  {
    id: "qst_tang_sect_herbgather",
    name: "เก็บสมุนไพรปรุงพิษ",
    description: "ห้องปรุงพิษถังเหมินขาดวัตถุดิบสมุนไพรสำหรับสกัดเป็นพิษพิเศษ — เก็บสมุนไพรหายาก 8 ต้น และเม็ดบัว 4 ฝัก",
    briefSummary: "ส่งสมุนไพรหายาก 8 + เม็ดบัว 4 · แต้มสำนัก +50",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      {
        id: "main",
        description: "เก็บสมุนไพรหายาก 8 · เม็ดบัว 4",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "herb", count: 8 },
            { t: "hasItem", itemId: "lotus_seed", count: 4 },
          ],
        },
      },
      { id: "report", description: "กลับไปรายงานเจ้าสำนักถังเหมิน" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 3 },
      { t: "sectPoints", sectId: "tang", amount: 50 },
    ],
  },

  {
    id: "qst_tang_sect_eliminate",
    name: "กำจัดศัตรูตระกูล",
    description: "หัวหน้าโจรสองคนลอบเข้ามาขโมยตำราพิษของตระกูลถัง — ปราบให้ได้ทั้งสองคน แล้วเก็บพิษแมงป่อง 4 ขวดที่มันขโมยไปกลับมาเป็นหลักฐาน",
    briefSummary: "ปราบหัวหน้าโจร 2 + เก็บพิษแมงป่อง 4 · แต้มสำนัก +60",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      {
        id: "hunt",
        description: "ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "venom",
        description: "เก็บพิษแมงป่อง 4 ขวด",
        autoAdvance: { t: "hasItem", itemId: "scorpion_venom", count: 4 },
      },
      { id: "report", description: "กลับไปรายงานเจ้าสำนักถังเหมิน" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 4 },
      { t: "sectPoints", sectId: "tang", amount: 65 },
    ],
  },

  {
    id: "qst_tang_sect_forge_knives",
    name: "ตีมีดบินแห่งถังเหมิน",
    description: "ช่างตีอาวุธลับของสำนักต้องการแร่เหล็กและไม้เนื้อแข็งเพื่อตีมีดบินรุ่นใหม่ พร้อมพิษเคลือบใบมีด — รวบรวมแร่เหล็ก 6 + ไม้เนื้อแข็ง 5 + พิษงู 3",
    briefSummary: "ส่งแร่เหล็ก 6 + ไม้เนื้อแข็ง 5 + พิษงู 3 · แต้มสำนัก +70",
    type: "side",
    sectId: "tang",
    giverNpcId: "sect_tang_chief_tangmen",
    prereqs: { t: "sectMember", sectId: "tang" },
    stages: [
      {
        id: "ore",
        description: "หาแร่เหล็ก 6 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 6 },
      },
      {
        id: "wood",
        description: "หาไม้เนื้อแข็ง 5 ท่อน",
        autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 5 },
      },
      {
        id: "venom",
        description: "เก็บพิษงู 3 ขวด เคลือบใบมีด",
        autoAdvance: { t: "hasItem", itemId: "viper_venom", count: 3 },
      },
      { id: "report", description: "ส่งวัตถุดิบให้ช่างตีอาวุธของสำนัก" },
    ],
    rewards: [
      { t: "gold", amount: 170 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_tang_chief_tangmen", amount: 4 },
      { t: "sectPoints", sectId: "tang", amount: 70 },
    ],
  },
];
