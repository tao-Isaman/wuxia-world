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
    briefSummary: "ปราบโจรรอบเขา 2 คน · sect points +50",
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
    briefSummary: "ส่งโสม 5 + บัวหิมะ 1 · sect points +60",
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
    name: "ตำราหยินหยางสมดุล",
    description: "อาจารย์ชิงซวี่ยอมเปิดตำราหยินหยางสมดุล (阴阳平衡) ให้ศิษย์ที่มีจิตเที่ยงตรง — ผ่านการทดสอบหมัดและจิต",
    briefSummary: "ฝึกหยินหยางสมดุล — รับ T3 art ของอู่ตัง",
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
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_meditate",
        description: "นั่งสมาธิ — รวบรวมโสม 8 ราก",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 8 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากอาจารย์ชิงซวี่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_yinyang", level: 3 },
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
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 80 },
      { t: "learnSkill", skillId: "tj" },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 15 },
    ],
  },

  {
    id: "qst_wudang_traitor_disciple",
    name: "ลูกศิษย์ผู้ทรยศ",
    description: "มีลูกศิษย์อู่ตังที่ขายความลับสำนักให้ศัตรู อาจารย์ให้เจ้าจัดการ — จะเลือกมอบตัวหรือให้โอกาสกลับใจ?",
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
    description: "อาจารย์ขอให้เดินทางไปวัดตาหลุนและนำตราประทับศักดิ์สิทธิ์กลับมา เพื่อต่ออายุพันธสัญญาโบราณ",
    briefSummary: "เดินทางไปวัดตาหลุนเพื่อนำตราประทับมาให้อาจารย์อู่ตัง",
    type: "side",
    giverNpcId: "sect_wudang_master_qingxu",
    stages: [
      {
        id: "visit_temple",
        description: "เดินทางไปวัดตาหลุน",
        autoAdvance: { t: "visitedLocation", locationId: "temple_dalun" },
      },
      {
        id: "get_seal",
        description: "รับตราประทับจากพระวัดตาหลุน",
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
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักอู่ตังทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่ออู่ตัง — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectStatus", sectId: "wudang", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — snow_lotus 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักอู่ตัง" },
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
    name: "ทำความสะอาดศาลา",
    description: "ภารกิจประจำของศิษย์อู่ตัง — เก็บไม้แข็ง 4 ชิ้น",
    briefSummary: "ส่งไม้แข็ง 4 ชิ้น · sect points +50",
    type: "side",
    sectId: "wudang",
    giverNpcId: "sect_wudang_master_qingxu",
    prereqs: { t: "sectMember", sectId: "wudang" },
    stages: [
      { id: "main", description: "เก็บไม้แข็ง 4 ชิ้น", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 4 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 3 },
      { t: "sectPoints", sectId: "wudang", amount: 50 },
    ],
  },
];
