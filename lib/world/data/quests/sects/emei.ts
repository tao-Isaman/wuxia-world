import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_EMEI: readonly QuestDef[] = [
  {
    id: "qst_emei_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ง้อไบ๊",
    description: "ท่านนิ้วห้วนจิงฉานรับเฉพาะศิษย์หญิงที่มีจิตใจเมตตา — เก็บสมุนไพรหลากชนิดมาให้ห้องยาของวัดเพื่อพิสูจน์ความเพียร · สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + เม็ดบัว 10 เข้าเป็นศิษย์ง้อไบ๊ขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: {
      t: "and",
      all: [
        { t: "gender", equals: "female" },
        { t: "trait", trait: "evil", max: 10 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather_herbs",
        description: "เก็บสมุนไพรหายาก 10 ชิ้น + โสม 10 ราก + เม็ดบัว 10 เม็ด",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "herb", count: 10 },
            { t: "hasItem", itemId: "ginseng", count: 10 },
            { t: "hasItem", itemId: "lotus_seed", count: 10 },
          ],
        },
      },
      {
        id: "return_to_abbess",
        description: "นำสมุนไพรกลับไปถวายท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 5 },
      { t: "joinSect", sectId: "emei" },
      { t: "sectPoints", sectId: "emei", amount: 20 },
    ],
  },

  {
    id: "qst_emei_sect_patrol",
    name: "ลาดตระเวนรอบวัดง้อไบ๊",
    description: "ภารกิจประจำของศิษย์ง้อไบ๊ — ลาดตระเวนรอบวัดและช่วยเหลือผู้ที่หลงเข้ามาในเขต",
    briefSummary: "ปราบโจรในเขตวัด 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 50 },
    ],
  },

  {
    id: "qst_emei_sect_herb",
    name: "เก็บสมุนไพรเขาง้อไบ๊",
    description: "ห้องยาของง้อไบ๊ต้องการบัวหิมะและโสมเพื่อปรุงยารักษาศิษย์ที่บาดเจ็บ — เก็บมาให้ครบ",
    briefSummary: "ส่งโสม 5 + บัวหิมะ 1 · แต้มสำนัก +60",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "gather",
        description: "เก็บโสม 5 ราก + บัวหิมะ 1 ดอก",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "ginseng", count: 5 },
            { t: "hasItem", itemId: "snow_lotus", count: 1 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งสมุนไพรให้ท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 60 },
    ],
  },

  {
    id: "qst_emei_art_bodhi",
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "ท่านนิ้วห้วนจิงฉานจะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่ผ่านการพิสูจน์ทั้งดาบและจิตใจ — ปราบหัวหน้าโจร 3 คน และสะสมความถ่อมตนให้ถึง 30 (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "emei",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "emei" },
        { t: "sectRankAtLeast", sectId: "emei", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_mind",
        description: "พิสูจน์จิตใจ — สะสมความถ่อมตนถึง 30",
        autoAdvance: { t: "trait", trait: "humility", min: 30 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "humility", amount: 10 },
      { t: "sectPoints", sectId: "emei", amount: 200 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 20 },
    ],
  },

  {
    id: "qst_emei_kidnapped_novice",
    name: "สาวกถูกลักพาตัว",
    description: "สาวกง้อไบ๊คนหนึ่งถูกโจรจับตัวไปเรียกค่าไถ่ ท่านนิ้วห้วนจิงฉานขอให้ช่วยนำสาวกกลับมาโดยสวัสดิภาพ",
    briefSummary: "ช่วยสาวกง้อไบ๊จากมือโจร",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    stages: [
      {
        id: "locate_hideout",
        description: "สืบที่ซ่อนโจรจากชาวบ้านที่หมู่บ้านดอกเหมย",
        objective: {
          spots: [
            { locationId: "village_meihua", label: "สืบที่ซ่อนโจรจากชาวบ้าน", text: "ชาวบ้านดงดอกเหมยชี้ว่าหัวหน้าโจรพาเด็กสาวขึ้นไปทางป่าเขา" },
          ],
        },
      },
      {
        id: "rescue",
        description: "ปราบโจรและช่วยสาวกออกมา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "escort_back",
        description: "พาสาวกกลับวัดง้อไบ๊",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 15 },
    ],
  },

  {
    id: "qst_emei_poison_antidote",
    name: "ยาต้านพิษอสุรา",
    description: "สาวกง้อไบ๊ถูกวางยาพิษจากคนร้าย ท่านนิ้วห้วนจิงฉานต้องการพิษตะขาบเพื่อสังเคราะห์ยาต้านพิษ",
    briefSummary: "หาพิษตะขาบมาให้ท่านนิ้วห้วนจิงฉานแห่งง้อไบ๊",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "done" },
    stages: [
      {
        id: "find_venom",
        description: "หาพิษตะขาบ 1 ขวด",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 1 },
      },
      {
        id: "deliver_venom",
        description: "ส่งพิษตะขาบให้ท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 10 },
    ],
  },

  {
    id: "qst_emei_redemption",
    name: "ไถ่บาปต่อง้อไบ๊",
    description: "เจ้าเคยทรยศง้อไบ๊ สำนักจึงส่งนักล่ามาตามเจ้า — แต่ท่านนิ้วห้วนจิงฉานยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำเม็ดบัว 5 เม็ดมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของง้อไบ๊ที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อง้อไบ๊ — ปราบหัวหน้าโจร 5 + ถวายเม็ดบัว 5 เม็ด",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectStatus", sectId: "emei", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำเม็ดบัว 5 เม็ดมาถวาย", autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อท่านนิ้วห้วนจิงฉาน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "emei" },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 10 },
    ],
  },

  {
    id: "qst_emei_sect_lotus",
    name: "ส่งเม็ดบัวให้แม่ชี",
    description: "ภารกิจประจำของศิษย์ง้อไบ๊ — เก็บเม็ดบัว 6 ชิ้น",
    briefSummary: "ส่งเม็ดบัว 6 ชิ้น · แต้มสำนัก +50",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      { id: "main", description: "เก็บเม็ดบัว 6 ชิ้น", autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 6 } },
      { id: "report", description: "กลับไปรายงานท่านนิ้วห้วนจิงฉาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 50 },
    ],
  },

  {
    id: "qst_emei_sect_bandit_clear",
    name: "กวาดล้างโจรเชิงเขาง้อไบ๊",
    description: "มีโจรกลุ่มหนึ่งตั้งซ่องเชิงเขาง้อไบ๊ ดักรีดไถผู้แสวงบุญที่ขึ้นมาไหว้พระ — ท่านนิ้วห้วนจิงฉานขอให้ปราบและนำสมุนไพรหายากที่โจรปล้นมาคืน",
    briefSummary: "ปราบโจรป่า 3 คน + เก็บสมุนไพรหายาก 4 ชิ้น · แต้มสำนัก +60",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "fight",
        description: "ปราบโจรป่า 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 },
      },
      {
        id: "gather",
        description: "เก็บสมุนไพรหายาก 4 ชิ้นที่โจรปล้นไป",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 4 },
      },
      {
        id: "report",
        description: "กลับไปรายงานท่านนิ้วห้วนจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 140 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 60 },
    ],
  },

  {
    id: "qst_emei_sect_snowlotus",
    name: "บัวหิมะยอดเขาง้อไบ๊",
    description: "ห้องยาของง้อไบ๊กำลังปรุงยาฟื้นฟูจิตให้แม่ชีรุ่นเก่า — ต้องใช้บัวหิมะและโสมในปริมาณมาก เก็บมาให้ครบเพื่อช่วยเหล่าแม่ชี",
    briefSummary: "ส่งบัวหิมะ 2 + โสม 6 · แต้มสำนัก +70",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "gather_snow",
        description: "เก็บบัวหิมะ 2 ดอกจากยอดเขาสูง",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 2 },
      },
      {
        id: "gather_ginseng",
        description: "เก็บโสม 6 รากเสริมยา",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 6 },
      },
      {
        id: "report",
        description: "ส่งสมุนไพรให้ห้องยาง้อไบ๊",
      },
    ],
    rewards: [
      { t: "gold", amount: 170 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 70 },
    ],
  },

  {
    id: "qst_emei_sect_pill_delivery",
    name: "ส่งยาให้หมอชาวบ้าน",
    description: "ท่านนิ้วห้วนจิงฉานปรุงยาแก้ไข้เสร็จแล้ว — ต้องการกระดาษสาห่อยาและเม็ดบัวเพื่อปรุงเป็นเม็ดยาส่งให้หมอชาวบ้านที่เชิงเขา",
    briefSummary: "ส่งกระดาษสา 6 + เม็ดบัว 5 · แต้มสำนัก +50",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "main",
        description: "เก็บกระดาษสา 6 แผ่น + เม็ดบัว 5 เม็ด",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 6 },
            { t: "hasItem", itemId: "lotus_seed", count: 5 },
          ],
        },
      },
      {
        id: "report",
        description: "ส่งของให้ท่านนิ้วห้วนจิงฉานปรุงยา",
      },
    ],
    rewards: [
      { t: "gold", amount: 110 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 50 },
    ],
  },
];
