import type { QuestDef } from "../../../types";

// เหิงซานเหนือ — Buddhist nun's order. Quest line mirrors the
// Huashan template: paid intro + 3 sect grinds + 1 art quest +
// 1 redemption quest gated on `sectStatus: "betrayed"`.

export const QUESTS_HENGSHAN_NORTH: readonly QuestDef[] = [
  {
    id: "qst_hengshan_north_disciple_intro",
    name: "ขอเข้าเป็นศิษย์เหิงซานเหนือ",
    description:
      "ภิกษุณีติ่งอี้รับศิษย์ใหม่ที่ใจสงบและเคารพพระธรรม — แต่ตามประเพณีเหิงซานเหนือ ผู้ใหม่ต้องถวายค่าจดทะเบียน ๕๐๐ ทอง พร้อมกระดาษคัดพระสูตร ๓ แผ่นเป็นเครื่องถวายธรรม",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งกระดาษคัดสูตร 3 แผ่น เข้าเป็นศิษย์ขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
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
        description: "เตรียมกระดาษ 3 แผ่น + เก็บเงินให้ครบ 500 ทอง",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 3 },
            { t: "goldAtLeast", amount: 500 },
          ],
        },
      },
      {
        id: "return_to_abbess",
        description: "นำของและเงินค่าเข้าสำนักไปถวายภิกษุณีติ่งอี้",
      },
    ],
    // Gold + paper deduction happens at the complete-scene's choice
    // effects (addGold:-500 + takeItem:paper x3) so the player only
    // pays when they actually accept registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 5 },
      { t: "joinSect", sectId: "hengshan_north" },
      { t: "sectPoints", sectId: "hengshan_north", amount: 20 },
    ],
  },

  {
    id: "qst_hengshan_north_sect_offering",
    name: "เตรียมเครื่องถวายปลายเดือน",
    description:
      "วัดเหิงซานเหนือต้องเตรียมกระดาษคัดพระสูตร + เมล็ดบัวเป็นเครื่องถวายในงานพระธรรมประจำเดือน — ศิษย์ใหม่ออกไปเก็บมาให้ครบ",
    briefSummary: "ส่งกระดาษ 5 + เมล็ดบัว 3 · sect points +50",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectMember", sectId: "hengshan_north" },
    stages: [
      {
        id: "gather",
        description: "เก็บกระดาษ 5 แผ่น + เมล็ดบัว 3 เม็ด",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 5 },
            { t: "hasItem", itemId: "lotus_seed", count: 3 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งของถวายให้ภิกษุณีติ่งอี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 1 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 3 },
      { t: "sectPoints", sectId: "hengshan_north", amount: 50 },
    ],
  },

  {
    id: "qst_hengshan_north_sect_thugs",
    name: "ปราบโจรริมเขาเหิงซาน",
    description:
      "พ่อค้าผู้แสวงบุญถูกโจรเร่ร่อนปล้นริมเชิงเขา — ภิกษุณีติ่งอี้ขอให้ศิษย์ออกไปกำราบโจรเพื่อรักษาความสงบในละแวกวัด",
    briefSummary: "ปราบโจรเร่ร่อน 3 คน · sect points +60",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectMember", sectId: "hengshan_north" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปรายงานภิกษุณีติ่งอี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 3 },
      { t: "sectPoints", sectId: "hengshan_north", amount: 60 },
    ],
  },

  {
    id: "qst_hengshan_north_sect_amulet",
    name: "ถวายหยกประทับพระ",
    description:
      "ภิกษุณีอี๋เหอกำลังแกะสลักหยกประทับพระเพื่อเป็นเครื่องคุ้มของศิษย์ใหม่ — ต้องการหยกบริสุทธิ์ ๓ ก้อน และไม้อ่อน ๒ ชิ้นสำหรับด้ามจับ",
    briefSummary: "ส่งหยก 3 + ไม้อ่อน 2 · sect points +55",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectMember", sectId: "hengshan_north" },
    stages: [
      {
        id: "gather",
        description: "เก็บหยก 3 + ไม้อ่อน 2",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "jade", count: 3 },
            { t: "hasItem", itemId: "wood_soft", count: 2 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งของให้ภิกษุณีติ่งอี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 3 },
      { t: "sectPoints", sectId: "hengshan_north", amount: 55 },
    ],
  },

  {
    id: "qst_hengshan_north_art_mirror",
    name: "ตำราดาบกระจกธรรม",
    description:
      "ภิกษุณีติ่งอี้ยอมเปิดตำราดาบกระจกธรรมให้ศิษย์ที่พิสูจน์ได้ทั้งดาบและจิตใจ — ต้องผ่านการประลองหัวหน้าโจรและรวบรวมหยกบริสุทธิ์เพื่อขัดกระจกพระธรรม",
    briefSummary: "ฝึกดาบกระจกธรรม — รับ T3 art ลับของเหิงซานเหนือ",
    type: "side",
    sectId: "hengshan_north",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "hengshan_north" },
        { t: "sectRankAtLeast", sectId: "hengshan_north", maxRank: 5 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_jade",
        description: "พิสูจน์ใจ — รวบรวมหยก 3 ก้อนสำหรับขัดกระจกพระธรรม",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 3 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากภิกษุณีติ่งอี้",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_hgn_mirror", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "hengshan_north", amount: 100 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 10 },
    ],
  },

  {
    id: "qst_hengshan_north_redemption",
    name: "ไถ่บาปต่อเหิงซานเหนือ",
    description:
      "เจ้าผู้ทรยศกลับมาขออภัย — ภิกษุณีติ่งอี้ทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คน + ถวายหยก 5 ก้อนเพื่อหล่อกระจกใหม่ หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อเหิงซานเหนือ — ปราบหัวหน้าโจร 5 + ส่งหยกถวาย 5 ชิ้น",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectStatus", sectId: "hengshan_north", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — หยก 5 ก้อนเพื่อหล่อกระจกใหม่", autoAdvance: { t: "hasItem", itemId: "jade", count: 5 } },
      { id: "return_to_abbess", description: "กลับไปขออภัยต่อภิกษุณีติ่งอี้" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "hengshan_north" },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 10 },
    ],
  },
];
