import type { QuestDef } from "../../../types";

// เหิงซานเหนือ — Buddhist nun's order. Quest line mirrors the
// Huashan template: paid intro + 3 sect grinds + 1 art quest +
// 1 redemption quest gated on `sectStatus: "betrayed"`.

export const QUESTS_HENGSHAN_NORTH: readonly QuestDef[] = [
  {
    id: "qst_hengshan_north_disciple_intro",
    name: "ขอเข้าเป็นศิษย์เหิงซานเหนือ",
    description:
      "ภิกษุณีเสวียนเยว่รับศิษย์ใหม่ที่ใจสงบและเคารพพระธรรม — แต่ตามประเพณีเหิงซานเหนือ ผู้ใหม่ต้องถวายค่าจดทะเบียน ๕๐๐ ทอง พร้อมกระดาษคัดพระสูตร ๓ แผ่นเป็นเครื่องถวายธรรม",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งกระดาษสาคัดสูตร 3 แผ่น เข้าเป็นศิษย์ขั้นที่ 9",
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
        description: "เตรียมกระดาษสา 3 แผ่น + เก็บเงินให้ครบ 500 ทอง",
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
        description: "นำของและเงินค่าเข้าสำนักไปถวายภิกษุณีเสวียนเยว่",
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
    briefSummary: "ส่งกระดาษสา 5 + เม็ดบัว 3 · แต้มสำนัก +50",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectMember", sectId: "hengshan_north" },
    stages: [
      {
        id: "gather",
        description: "เก็บกระดาษสา 5 แผ่น + เม็ดบัว 3 เม็ด",
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
        description: "ส่งของถวายให้ภิกษุณีเสวียนเยว่",
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
      "พ่อค้าผู้แสวงบุญถูกโจรเร่ร่อนปล้นริมเชิงเขา — ภิกษุณีเสวียนเยว่ขอให้ศิษย์ออกไปกำราบโจรเพื่อรักษาความสงบในละแวกวัด",
    briefSummary: "ปราบโจรเร่ร่อน 3 คน · แต้มสำนัก +60",
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
        description: "กลับไปรายงานภิกษุณีเสวียนเยว่",
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
    briefSummary: "ส่งหยก 3 + ไม้เนื้ออ่อน 2 · แต้มสำนัก +55",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectMember", sectId: "hengshan_north" },
    stages: [
      {
        id: "gather",
        description: "เก็บหยก 3 + ไม้เนื้ออ่อน 2",
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
        description: "ส่งของให้ภิกษุณีเสวียนเยว่",
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
    name: "บททดสอบก่อนสืบทอด: พลังกระจกธรรม",
    description:
      "ภิกษุณีเสวียนเยว่ยอมเปิดตำราดาบกระจกธรรมให้ศิษย์ที่พิสูจน์ได้ทั้งดาบและจิตใจ — ปราบหัวหน้าโจร 2 คน และหาหยกล้ำค่า 3 ก้อนมาขัดกระจกพระธรรม",
    briefSummary: "บททดสอบ — เปิดทางสู่การสืบทอดพลังกระจกธรรม (ขั้น 3)",
    type: "side",
    sectId: "hengshan_north",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "hengshan_north" },
        { t: "sectRankAtLeast", sectId: "hengshan_north", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_jade",
        description: "พิสูจน์ใจ — รวบรวมหยก 3 ก้อนสำหรับขัดกระจกพระธรรม",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 3 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อภิกษุณีเสวียนเยว่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "hengshan_north", amount: 100 },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 10 },
    ],
  },

  {
    id: "qst_hengshan_north_redemption",
    name: "ไถ่บาปต่อเหิงซานเหนือ",
    description: "เจ้าเคยทรยศเหิงซานเหนือ สำนักจึงส่งนักล่ามาตามเจ้า — แต่ภิกษุณีเสวียนเยว่ยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำหยกล้ำค่า 5 ก้อนมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของเหิงซานเหนือที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อเหิงซานเหนือ — ปราบหัวหน้าโจร 5 + ถวายหยกล้ำค่า 5 ก้อน",
    type: "side",
    sectId: "hengshan_north",
    giverNpcId: "sect_hengshan_north_abbess_dingyi",
    prereqs: { t: "sectStatus", sectId: "hengshan_north", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำหยกล้ำค่า 5 ก้อนมาถวาย ใช้หล่อกระจกพระธรรมใหม่", autoAdvance: { t: "hasItem", itemId: "jade", count: 5 } },
      { id: "return_to_abbess", description: "กลับไปขออภัยต่อภิกษุณีเสวียนเยว่" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "hengshan_north" },
      { t: "npcRelationship", npcId: "sect_hengshan_north_abbess_dingyi", amount: 10 },
    ],
  },
];
