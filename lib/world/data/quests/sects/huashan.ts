import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_HUASHAN: readonly QuestDef[] = [
  {
    id: "qst_huashan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์หัวซาน",
    description: "อาจารย์อี้ชิงรับศิษย์ใหม่ทุกคนที่ใจรักดาบ — แต่หัวซานเป็นสำนักเล็ก ต้องการค่าเข้าสำนัก ๕๐๐ เหรียญทอง และเหล็กดิบ ๓ ก้อนสำหรับตีดาบฝึก",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งเหล็กดิบ 3 ก้อน เข้าเป็นศิษย์หัวซานขั้นที่ 9",
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
        description: "เตรียมเหล็กดิบ 3 ก้อน + เก็บเงินให้ครบ 500 ทอง",
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
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์อี้ชิง",
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
    briefSummary: "ปราบโจรเชิงเขา 2 คน · sect points +50",
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
        description: "กลับไปรายงานอาจารย์อี้ชิง",
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
    description: "โรงตีดาบของหัวซานต้องการเหล็กดิบเพิ่มเพื่อหลอมดาบฝึกให้ศิษย์รุ่นใหม่ — เก็บเหล็กดิบมาให้ครบ",
    briefSummary: "ส่งเหล็กดิบ 5 ก้อน · sect points +60",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บเหล็กดิบ 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้อาจารย์อี้ชิง",
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
    name: "ตำราพลังเมฆม่วง",
    description: "อาจารย์อี้ชิงยอมเปิดตำราพลังเมฆม่วงให้ศิษย์ที่พิสูจน์ได้ทั้งดาบและจิตใจ — ผ่านการประลองกับโจรชั้นสูงและการเก็บเหล็กพิเศษ",
    briefSummary: "ฝึกพลังเมฆม่วง — รับ T4 art ลับของหัวซาน",
    type: "side",
    sectId: "huashan",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "huashan" },
        { t: "sectRankAtLeast", sectId: "huashan", maxRank: 5 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_iron",
        description: "พิสูจน์ใจ — รวบรวมแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากอาจารย์อี้ชิง",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t4_huashan_purple", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "huashan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 10 },
    ],
  },

  {
    id: "qst_huashan_redemption",
    name: "ไถ่บาปต่อหัวซาน",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักหัวซานทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อหัวซาน — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectStatus", sectId: "huashan", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — iron_ore 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักหัวซาน" },
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
    description: "ภารกิจประจำของศิษย์หัวซาน — เก็บไม้แข็ง 5 ชิ้น",
    briefSummary: "ส่งไม้แข็ง 5 ชิ้น · sect points +50",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      { id: "main", description: "เก็บไม้แข็ง 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 5 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 50 },
    ],
  },
];
