import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_HUASHAN: readonly QuestDef[] = [
  {
    id: "qst_huashan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์หัวซาน",
    description: "อาจารย์ใหญ่อี้ชิงรับศิษย์ใหม่ทุกคนที่ใจรักดาบ — แต่หัวซานเป็นสำนักเล็ก ต้องการค่าเข้าสำนัก 500 เหรียญทอง และแร่เหล็ก 3 ก้อนสำหรับตีดาบฝึก",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งแร่เหล็ก 3 ก้อน เข้าเป็นศิษย์หัวซานขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_huashan_master_yiqing",
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
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์ใหญ่อี้ชิง",
      },
    ],
    // Gold deduction happens at the complete-scene's choice (addGold:-200)
    // alongside takeItem for the iron ore, so the player only pays when
    // they actually accept the registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 5 },
      { t: "joinSect", sectId: "huashan" },
      { t: "sectPoints", sectId: "huashan", amount: 20 },
    ],
  },

  {
    id: "qst_huashan_sect_patrol",
    name: "ลาดตระเวนเชิงเขาหัวซาน",
    description: "ภารกิจประจำของศิษย์หัวซาน — ลาดตระเวนเชิงเขาและกำราบโจรที่ตั้งฐานก่อกวน",
    briefSummary: "ปราบโจรเชิงเขา 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ใหญ่อี้ชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 50 },
    ],
  },

  {
    id: "qst_huashan_sect_iron",
    name: "ส่งเหล็กให้โรงตีดาบ",
    description: "โรงตีดาบของหัวซานต้องการแร่เหล็กเพิ่มเพื่อหลอมดาบฝึกให้ศิษย์รุ่นใหม่ — เก็บแร่เหล็กมาให้ครบ",
    briefSummary: "ส่งแร่เหล็ก 5 ก้อน · แต้มสำนัก +60",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บแร่เหล็ก 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้อาจารย์ใหญ่อี้ชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 60 },
    ],
  },

  {
    id: "qst_huashan_art_purplecloud",
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "อาจารย์ใหญ่อี้ชิงจะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่พิสูจน์ได้ทั้งดาบและจิตใจ — ปราบหัวหน้าโจร 2 คน และหาแร่เทพ 1 ก้อน (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "huashan",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "huashan" },
        { t: "sectRankAtLeast", sectId: "huashan", maxRank: 3 },
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
        description: "กลับไปรายงานผลต่ออาจารย์ใหญ่อี้ชิง",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "huashan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 10 },
    ],
  },

  {
    id: "qst_huashan_redemption",
    name: "ไถ่บาปต่อหัวซาน",
    description: "เจ้าเคยทรยศหัวซาน สำนักจึงส่งนักล่ามาตามเจ้า — แต่อาจารย์ใหญ่อี้ชิงยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำแร่เหล็ก 5 ก้อนมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของหัวซานที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อหัวซาน — ปราบหัวหน้าโจร 5 + ถวายแร่เหล็ก 5 ก้อน",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectStatus", sectId: "huashan", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำแร่เหล็ก 5 ก้อนมาถวาย", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์ใหญ่อี้ชิง" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "huashan" },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 10 },
    ],
  },

  {
    id: "qst_huashan_sect_wooden",
    name: "ส่งไม้ให้โรงดาบ",
    description: "ภารกิจประจำของศิษย์หัวซาน — เก็บไม้เนื้อแข็ง 5 ชิ้น",
    briefSummary: "ส่งไม้เนื้อแข็ง 5 ชิ้น · แต้มสำนัก +50",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      { id: "main", description: "เก็บไม้เนื้อแข็ง 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 5 } },
      { id: "report", description: "กลับไปรายงานอาจารย์ใหญ่อี้ชิง" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 50 },
    ],
  },
];
