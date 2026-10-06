import type { QuestDef } from "../../../types";

// Per-sect content for hengshan_south.
// เฮิงซานใต้ — ค่าเข้าสำนัก 500 ทอง + เหล็กดิบ 3 ก้อน (เพื่อตีกระบี่ฝึก)
// ภารกิจของศิษย์เน้นกระบี่ลีลาระบำและการฝึกตัวเบา

export const QUESTS_HENGSHAN_SOUTH: readonly QuestDef[] = [
  {
    id: "qst_hengshan_south_disciple_intro",
    name: "ขอเข้าเป็นศิษย์เฮิงซานใต้",
    description: "อาจารย์ใหญ่เซี่ยอวิ๋นรับศิษย์ใหม่ที่มีใจรักกระบี่ลีลาห้ายอด — ต้องเตรียมค่าเข้าสำนัก 500 เหรียญทอง และแร่เหล็ก 3 ก้อนสำหรับตีกระบี่ฝึก",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งแร่เหล็ก 3 ก้อน เข้าเป็นศิษย์เฮิงซานใต้ขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 10 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather_offering",
        description: "เตรียมแร่เหล็ก 3 ก้อน + เก็บเงินให้ครบ 500 ทอง",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "iron_ore", count: 3 },
            { t: "goldAtLeast", amount: 500 },
          ],
        },
      },
      {
        id: "return_to_master",
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์ใหญ่เซี่ยอวิ๋น",
      },
    ],
    // Gold/item deduction happens at the complete-scene's choice
    // (addGold:-500 + takeItem iron_ore×3) so the player only pays
    // when they actually accept the registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 5 },
      { t: "joinSect", sectId: "hengshan_south" },
      { t: "sectPoints", sectId: "hengshan_south", amount: 20 },
    ],
  },

  {
    id: "qst_hengshan_south_sect_patrol",
    name: "ลาดตระเวนรอบห้ายอด",
    description: "ภารกิจประจำของศิษย์เฮิงซานใต้ — ลาดตระเวนรอบเขาห้ายอดและกำราบโจรที่ก่อกวนผู้แสวงบุญ",
    briefSummary: "ปราบโจรเร่ร่อน 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "hengshan_south",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: { t: "sectMember", sectId: "hengshan_south" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ใหญ่เซี่ยอวิ๋น",
      },
    ],
    rewards: [
      { t: "gold", amount: 140 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 3 },
      { t: "sectPoints", sectId: "hengshan_south", amount: 50 },
    ],
  },

  {
    id: "qst_hengshan_south_sect_silk",
    name: "ส่งผ้าไหมให้ห้องเครื่องแต่งกาย",
    description: "ห้องเครื่องแต่งกายของเฮิงซานใต้ขาดผ้าไหมสำหรับตัดชุดศิษย์รุ่นใหม่ — เก็บผ้าไหมมาให้ครบจำนวน",
    briefSummary: "ส่งผ้าไหม 4 ผืน · แต้มสำนัก +50",
    type: "side",
    sectId: "hengshan_south",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: { t: "sectMember", sectId: "hengshan_south" },
    stages: [
      {
        id: "gather_silk",
        description: "เก็บผ้าไหม 4 ผืน",
        autoAdvance: { t: "hasItem", itemId: "silk", count: 4 },
      },
      {
        id: "deliver",
        description: "ส่งผ้าไหมให้อาจารย์ใหญ่เซี่ยอวิ๋น",
      },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 3 },
      { t: "sectPoints", sectId: "hengshan_south", amount: 50 },
    ],
  },

  {
    id: "qst_hengshan_south_sect_herb",
    name: "ปราบเสือภูเขารบกวนนักดนตรี",
    description: "เสือภูเขาลงมาคุกคามนักดนตรีที่มาฝึกบนยอดเขา — ขอให้เจ้าจัดการให้เรียบร้อย",
    briefSummary: "ปราบเสือภูเขา 2 ตัว · แต้มสำนัก +60",
    type: "side",
    sectId: "hengshan_south",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: { t: "sectMember", sectId: "hengshan_south" },
    stages: [
      {
        id: "kill_tigers",
        description: "ปราบเสือภูเขา 2 ตัว",
        autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ใหญ่เซี่ยอวิ๋น",
      },
    ],
    rewards: [
      { t: "gold", amount: 160 },
      { t: "wExp", amount: 65 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 4 },
      { t: "sectPoints", sectId: "hengshan_south", amount: 60 },
    ],
  },

  {
    id: "qst_hengshan_south_art_swiftblade",
    name: "บททดสอบก่อนสืบทอด: วิชาลึกลับ",
    description: "อาจารย์ใหญ่เซี่ยอวิ๋นจะทดสอบก่อนเปิดตำราวิชาลึกลับให้ศิษย์ที่พิสูจน์ฝีมือกระบี่และหัวใจอันสงบ — ปราบหัวหน้าโจร 2 คน และหาแร่เทพ 1 ก้อน (ผ่านแล้วจึงรับภารกิจสืบทอดวิชาลึกลับได้)",
    briefSummary: "บททดสอบ — เปิดทางสู่การสืบทอดวิชาลึกลับ",
    type: "side",
    sectId: "hengshan_south",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "hengshan_south" },
        { t: "sectRankAtLeast", sectId: "hengshan_south", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_iron",
        description: "พิสูจน์ใจ — รวบรวมแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่ออาจารย์ใหญ่เซี่ยอวิ๋น",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "hengshan_south", amount: 100 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 10 },
    ],
  },

  {
    id: "qst_hengshan_south_redemption",
    name: "ไถ่บาปต่อเฮิงซานใต้",
    description: "เจ้าเคยทรยศเฮิงซานใต้ สำนักจึงส่งนักล่ามาตามเจ้า — แต่อาจารย์ใหญ่เซี่ยอวิ๋นยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำแร่เหล็ก 5 ก้อนมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของเฮิงซานใต้ที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อเฮิงซานใต้ — ปราบหัวหน้าโจร 5 + ถวายแร่เหล็ก 5 ก้อน",
    type: "side",
    sectId: "hengshan_south",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: { t: "sectStatus", sectId: "hengshan_south", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำแร่เหล็ก 5 ก้อนมาถวาย", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์ใหญ่เซี่ยอวิ๋น" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "hengshan_south" },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 10 },
    ],
  },
];
