import type { QuestDef } from "../../../types";

// Per-sect content for hengshan_south.
// เฮิงซานใต้ — ค่าเข้าสำนัก 500 ทอง + เหล็กดิบ 3 ก้อน (เพื่อตีกระบี่ฝึก)
// ภารกิจของศิษย์เน้นกระบี่ลีลาระบำและการฝึกตัวเบา

export const QUESTS_HENGSHAN_SOUTH: readonly QuestDef[] = [
  {
    id: "qst_hengshan_south_disciple_intro",
    name: "ขอเข้าเป็นศิษย์เฮิงซานใต้",
    description: "อาจารย์โม่ต้ารับศิษย์ใหม่ที่มีใจรักกระบี่ลีลาห้ายอด — ต้องเตรียมค่าเข้าสำนัก ๕๐๐ เหรียญทอง และเหล็กดิบ ๓ ก้อนสำหรับตีกระบี่ฝึก",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งเหล็กดิบ 3 ก้อน เข้าเป็นศิษย์เฮิงซานใต้ขั้นที่ 9",
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
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์โม่ต้า",
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
    briefSummary: "ปราบโจรเร่ร่อน 2 คน · sect points +50",
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
        description: "กลับไปรายงานอาจารย์โม่ต้า",
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
    briefSummary: "ส่งผ้าไหม 4 ผืน · sect points +50",
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
        description: "ส่งผ้าไหมให้อาจารย์โม่ต้า",
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
    briefSummary: "ปราบเสือภูเขา 2 ตัว · sect points +60",
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
        description: "กลับไปรายงานอาจารย์โม่ต้า",
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
    name: "ตำรากระบี่ลมรวดเร็ว",
    description: "อาจารย์โม่ต้ายอมเปิดตำรากระบี่ลมรวดเร็วให้ศิษย์ที่พิสูจน์ฝีมือกระบี่และหัวใจอันสงบ — ผ่านการประลองหัวหน้าโจรและรวบรวมแร่เทพ",
    briefSummary: "ฝึกกระบี่ลมรวดเร็ว — รับ T3 art ลับของเฮิงซานใต้",
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
        description: "กลับไปรับตำราจากอาจารย์โม่ต้า",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_hgs_swift", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "hengshan_south", amount: 100 },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 10 },
    ],
  },

  {
    id: "qst_hengshan_south_redemption",
    name: "ไถ่บาปต่อเฮิงซานใต้",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — อาจารย์โม่ต้าทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อเฮิงซานใต้ — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "hengshan_south",
    giverNpcId: "sect_hengshan_south_master_modaxiansheng",
    prereqs: { t: "sectStatus", sectId: "hengshan_south", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — iron_ore 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์โม่ต้า" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "hengshan_south" },
      { t: "npcRelationship", npcId: "sect_hengshan_south_master_modaxiansheng", amount: 10 },
    ],
  },
];
