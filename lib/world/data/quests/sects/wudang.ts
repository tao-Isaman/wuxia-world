import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_WUDANG: readonly QuestDef[] = [
  {
    id: "qst_wudang_disciple_intro",
    name: "ขอเข้าเป็นศิษย์อู่ตัง",
    description: "อาจารย์ชิงซวี่จะรับศิษย์ใหม่เพียงผู้ที่มีความเพียรและใจสงบ — เก็บสมุนไพรประจำเขาให้ครบสามชนิดเพื่อพิสูจน์ตน · สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + เม็ดบัว 10 เข้าเป็นศิษย์อู่ตังขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: {
      t: "and",
      all: [
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
        id: "return_to_master",
        description: "นำสมุนไพรกลับไปถวายอาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 5 },
      { t: "joinSect", sectId: "wudang" },
      { t: "sectPoints", sectId: "wudang", amount: 20 },
    ],
  },

  {
    id: "qst_wudang_sect_patrol",
    name: "ตรวจตรารอบเขาอู่ตัง",
    description: "ภารกิจประจำของศิษย์อู่ตัง — ลาดตระเวนรอบเขาและกำราบโจรที่ลอบเข้ามา",
    briefSummary: "ปราบโจรรอบเขา 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 50 },
    ],
  },

  {
    id: "qst_wudang_sect_herb_run",
    name: "เก็บสมุนไพรเขาอู่ตัง",
    description: "ห้องยาของอู่ตังต้องการสมุนไพรสดสำหรับปรุงยาฟื้นปราณ — เก็บโสมและบัวหิมะแล้วส่งกลับ",
    briefSummary: "ส่งโสม 5 + บัวหิมะ 1 · แต้มสำนัก +60",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
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
        description: "ส่งสมุนไพรให้อาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 60 },
    ],
  },

  {
    id: "qst_wudang_art_yinyang",
    name: "บททดสอบก่อนสืบทอด: วิชาลึกลับ",
    description: "อาจารย์ชิงซวี่จะทดสอบก่อนเปิดตำราวิชาลึกลับให้ศิษย์ที่มีจิตเที่ยงตรง — ปราบหัวหน้าโจร 2 คนเพื่อพิสูจน์หมัด และเก็บโสม 8 รากเพื่อพิสูจน์ความเพียร (ผ่านแล้วจึงรับภารกิจสืบทอดวิชาลึกลับได้)",
    briefSummary: "บททดสอบ — เปิดทางสู่การสืบทอดวิชาลึกลับ",
    type: "side",
    sectId: "wudang",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "wudang" },
        { t: "sectRankAtLeast", sectId: "wudang", maxRank: 5 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_meditate",
        description: "พิสูจน์ความเพียร — เก็บโสม 8 รากถวายห้องยา",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 8 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่ออาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "wudang", amount: 100 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 10 },
    ],
  },

  {
    id: "qst_wudang_sacred_herb",
    name: "บัวหิมะศักดิ์สิทธิ์",
    description: "อาจารย์ชิงซวี่ต้องการบัวหิมะจากก้นหุบเขาตัดใจเพื่อปรุงยาให้ลูกศิษย์ป่วย — มีเพียงที่นั่นที่บัวหิมะแท้งอกได้",
    briefSummary: "นำบัวหิมะจากก้นหุบเขาตัดใจมาให้อาจารย์อู่ตัง",
    type: "side",
    giverNpcId: "sect_wudang_master_qingxu",
    stages: [
      {
        id: "find_herb",
        description: "ลงไปยังก้นหุบเขาตัดใจและเก็บบัวหิมะ 1 ดอก",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      {
        id: "deliver_herb",
        description: "ส่งบัวหิมะให้อาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 900 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 15 },
    ],
  },

  {
    id: "qst_wudang_traitor_disciple",
    name: "ลูกศิษย์ผู้ทรยศ",
    description: "มีลูกศิษย์อู่ตังคนหนึ่งขายความลับของสำนักให้ศัตรู อาจารย์ชิงซวี่มอบให้เจ้าไปตามตัวและตัดสิน — จะส่งตัวให้สำนักลงโทษ หรือให้โอกาสกลับใจ?",
    briefSummary: "ตัดสินใจชะตากรรมของลูกศิษย์ทรยศแห่งอู่ตัง",
    type: "side",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "questStatus", questId: "qst_wudang_sacred_herb", status: "done" },
    stages: [
      {
        id: "find_traitor",
        description: "ติดตามลูกศิษย์ทรยศ",
      },
      {
        id: "decide",
        description: "ตัดสินใจว่าจะทำอย่างไรกับเขา",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 12 },
    ],
  },

  {
    id: "qst_wudang_mountain_seal",
    name: "ตราประทับภูเขา",
    description: "อาจารย์ชิงซวี่ขอให้เดินทางไปวัดต้าหลุน รับตราประทับศักดิ์สิทธิ์จากพระกงซิน แล้วนำกลับมา เพื่อต่ออายุพันธสัญญาโบราณระหว่างอู่ตังกับวิหาร",
    briefSummary: "ไปรับตราประทับจากพระกงซินที่วัดต้าหลุน มาให้อาจารย์ชิงซวี่",
    type: "side",
    giverNpcId: "sect_wudang_master_qingxu",
    stages: [
      {
        id: "visit_temple",
        description: "เดินทางไปวัดต้าหลุน",
        autoAdvance: { t: "visitedLocation", locationId: "temple_dalun" },
      },
      {
        id: "get_seal",
        description: "รับตราประทับจากพระกงซินที่วัดต้าหลุน",
        objective: {
          spots: [
            { locationId: "temple_dalun", label: "รับตราประทับจากพระกงซิน", npcId: "temple_dalun_monk_kongxin", text: "พระกงซินมอบตราประทับศักดิ์สิทธิ์ให้ห่อผ้าไหมอย่างดี" },
          ],
        },
      },
      {
        id: "return_seal",
        description: "นำตราประทับกลับคืนอาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 90 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 15 },
      { t: "npcRelationship", npcId: "temple_dalun_monk_kongxin", amount: 10 },
    ],
  },

  {
    id: "qst_wudang_redemption",
    name: "ไถ่บาปต่ออู่ตัง",
    description: "เจ้าเคยทรยศอู่ตัง สำนักจึงส่งนักล่ามาตามเจ้า — แต่อาจารย์ชิงซวี่ยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำบัวหิมะ 5 ดอกมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของอู่ตังที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่ออู่ตัง — ปราบหัวหน้าโจร 5 + ถวายบัวหิมะ 5 ดอก",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectStatus", sectId: "wudang", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำบัวหิมะ 5 ดอกมาถวาย", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์ชิงซวี่" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "wudang" },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 10 },
    ],
  },

  {
    id: "qst_wudang_sect_kindling",
    name: "ไม้ซ่อมศาลา",
    description: "ภารกิจประจำของศิษย์อู่ตัง — ศาลาริมทางขึ้นเขาผุพัง อาจารย์ชิงซวี่ขอไม้เนื้อแข็ง 4 ชิ้นมาซ่อม",
    briefSummary: "ส่งไม้เนื้อแข็ง 4 ชิ้น · แต้มสำนัก +50",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      { id: "main", description: "เก็บไม้เนื้อแข็ง 4 ชิ้น", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 4 } },
      { id: "report", description: "กลับไปรายงานอาจารย์ชิงซวี่" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 50 },
    ],
  },

  {
    id: "qst_wudang_sect_ginseng_run",
    name: "เก็บโสมเทพในป่าเขา",
    description: "ห้องยาของอู่ตังต้องการโสมจำนวนมากเพื่อปรุงยาบำรุงปราณให้ศิษย์รุ่นใหม่ — อาจารย์ชิงซวี่ขอให้ศิษย์ออกเก็บโสมในป่าเขา",
    briefSummary: "ส่งโสม 8 ราก · แต้มสำนัก +50",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      {
        id: "main",
        description: "เก็บโสม 8 ราก",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 8 },
      },
      {
        id: "report",
        description: "ส่งโสมให้อาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 50 },
    ],
  },

  {
    id: "qst_wudang_sect_tiger_hunt",
    name: "ปราบเสือร้ายเชิงเขา",
    description: "เสือดุร้ายลงจากเขาทำร้ายผู้แสวงบุญที่ขึ้นมาเขาอู่ตัง อาจารย์ชิงซวี่สั่งให้ศิษย์กำราบเสือและนำหนังของมันกลับมาเป็นหลักฐาน",
    briefSummary: "ปราบเสือเขา 2 ตัว + นำหนังสัตว์ 3 ผืน · แต้มสำนัก +65",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      {
        id: "fight",
        description: "ปราบเสือเขา 2 ตัว",
        autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 2 },
      },
      {
        id: "gather",
        description: "นำหนังสัตว์ 3 ผืนเป็นหลักฐาน",
        autoAdvance: { t: "hasItem", itemId: "fur_pelt", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "fame", amount: 2 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 65 },
    ],
  },

  {
    id: "qst_wudang_sect_scripture_copy",
    name: "คัดลอกตำราเต๋า",
    description: "หอตำราของอู่ตังต้องการเสริมตำราเต๋าเล่มใหม่ อาจารย์ชิงซวี่ให้ศิษย์รวบรวมกระดาษสาและไม้เนื้ออ่อนสำหรับทำม้วนตำรา",
    briefSummary: "ส่งกระดาษสา 5 + ไม้เนื้ออ่อน 3 · แต้มสำนัก +50",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      {
        id: "main",
        description: "หากระดาษสา 5 แผ่น + ไม้เนื้ออ่อน 3 ชิ้น",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 5 },
            { t: "hasItem", itemId: "wood_soft", count: 3 },
          ],
        },
      },
      {
        id: "report",
        description: "ส่งวัสดุให้อาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 110 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 1 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 50 },
    ],
  },
];
