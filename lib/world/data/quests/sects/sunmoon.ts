import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_SUNMOON: readonly QuestDef[] = [
  {
    id: "qst_sunmoon_disciple_intro",
    name: "ขอเข้าเป็นศิษย์พรรคตะวันจันทรา",
    description: "อาจารย์ใหญ่หยินอวี้ต้องการพิสูจน์ความจงรักภักดีของเจ้า — ลอบสังหารองครักษ์ฉินแห่งองครักษ์เสื้อแพร ผู้กำลังตามล่าศิษย์ของพรรค (เขาประจำอยู่ที่กรมองครักษ์เสื้อแพร)",
    briefSummary: "ลอบสังหารองครักษ์ฉินเพื่อพิสูจน์ความจงรักต่อพรรคตะวันจันทรา",
    type: "side",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 30 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "assassinate_guard",
        description: "ลอบสังหารองครักษ์ฉิน",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_jinyiwei_soldier_qin" },
      },
      {
        id: "report_back",
        description: "กลับไปรายงานอาจารย์ใหญ่หยินอวี้",
      },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "evil", amount: 3 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 10 },
      { t: "joinSect", sectId: "sunmoon" },
      { t: "sectPoints", sectId: "sunmoon", amount: 30 },
    ],
  },

  {
    id: "qst_sunmoon_sect_patrol",
    name: "ลาดตระเวนหุบเขา",
    description: "ภารกิจประจำของศิษย์พรรคตะวันจันทรา — ลาดตระเวนหุบเขาและกำราบโจรที่กล้าเข้ามา",
    briefSummary: "ปราบหัวหน้าโจร 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "patrol",
        description: "ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ใหญ่หยินอวี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 3 },
      { t: "sectPoints", sectId: "sunmoon", amount: 50 },
    ],
  },

  {
    id: "qst_sunmoon_sect_scripture",
    name: "กระดาษหมึกคัดคัมภีร์",
    description: "ห้องคัมภีร์ของพรรคต้องการกระดาษสาและหมึกเข้มเพิ่มเพื่อคัดลอกคัมภีร์ลับ — เก็บมาให้ครบ",
    briefSummary: "ส่งกระดาษสา 6 + หมึกเข้ม 6 · แต้มสำนัก +60",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "gather",
        description: "เก็บกระดาษสา 6 + หมึกเข้ม 6",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 6 },
            { t: "hasItem", itemId: "ink", count: 6 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งวัสดุให้อาจารย์ใหญ่หยินอวี้",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 3 },
      { t: "sectPoints", sectId: "sunmoon", amount: 60 },
    ],
  },

  {
    id: "qst_sunmoon_art_qiankun",
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "อาจารย์ใหญ่หยินอวี้จะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความภักดี — ปราบหัวหน้าโจร 4 คน และสะสมความหยิ่งยโสให้ถึง 25 (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "sunmoon",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "sunmoon" },
        { t: "sectRankAtLeast", sectId: "sunmoon", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_loyalty",
        description: "พิสูจน์ความภักดี — สะสมความหยิ่งยโส ถึง 25",
        autoAdvance: { t: "trait", trait: "arrogance", min: 25 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่ออาจารย์ใหญ่หยินอวี้",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "arrogance", amount: 5 },
      { t: "sectPoints", sectId: "sunmoon", amount: 200 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 20 },
    ],
  },

  {
    id: "qst_sunmoon_redemption",
    name: "ไถ่บาปต่อพรรคตะวันจันทรา",
    description: "เจ้าเคยทรยศพรรคตะวันจันทรา สำนักจึงส่งนักล่ามาตามเจ้า — แต่อาจารย์ใหญ่หยินอวี้ยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำเหรียญโบราณ 5 เหรียญมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของพรรคตะวันจันทราที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อพรรคตะวันจันทรา — ปราบหัวหน้าโจร 5 + ถวายเหรียญโบราณ 5 เหรียญ",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectStatus", sectId: "sunmoon", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำเหรียญโบราณ 5 เหรียญมาถวาย", autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์ใหญ่หยินอวี้" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "sunmoon" },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 10 },
    ],
  },

  {
    id: "qst_sunmoon_sect_patrol2",
    name: "ลาดตระเวนยอดเขา",
    description: "ภารกิจประจำของศิษย์พรรคตะวันจันทรา — ปราบโจร 3 คน",
    briefSummary: "ปราบโจร 3 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 } },
      { id: "report", description: "กลับไปรายงานอาจารย์ใหญ่หยินอวี้" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 3 },
      { t: "sectPoints", sectId: "sunmoon", amount: 50 },
    ],
  },

  {
    id: "qst_sunmoon_sect_suntalisman",
    name: "วัสดุยันต์ตะวัน",
    description: "พิธีบูชาตะวันของพรรคต้องใช้กระดาษสาและหยกล้ำค่าเป็นวัสดุยันต์ — เก็บกระดาษสา 6 แผ่น และหยก 2 ก้อน",
    briefSummary: "ส่งกระดาษสา 6 + หยก 2 · แต้มสำนัก +50",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "main",
        description: "เก็บกระดาษสา 6 แผ่น · หยก 2 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 6 },
            { t: "hasItem", itemId: "jade", count: 2 },
          ],
        },
      },
      { id: "report", description: "กลับไปรายงานอาจารย์ใหญ่หยินอวี้" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 3 },
      { t: "sectPoints", sectId: "sunmoon", amount: 50 },
    ],
  },

  {
    id: "qst_sunmoon_sect_purgespies",
    name: "กำจัดสายลับฝ่ายธรรมะ",
    description: "ฝ่ายธรรมะส่งสายลับเข้ามาแฝงตัวเป็นโจรเพื่อสืบความลับของพรรค — กำจัดสายลับ 3 คนและเก็บเหรียญโบราณที่พวกมันถือมา 2 เหรียญเป็นหลักฐาน",
    briefSummary: "ปราบโจรป่า 3 + เก็บเหรียญโบราณ 2 · แต้มสำนัก +65",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "purge",
        description: "ปราบโจรป่า 3 คน (สายลับแฝงตัวมา)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 },
      },
      {
        id: "evidence",
        description: "เก็บเหรียญโบราณ 2 เหรียญ",
        autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 2 },
      },
      { id: "report", description: "กลับไปรายงานอาจารย์ใหญ่หยินอวี้" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 4 },
      { t: "sectPoints", sectId: "sunmoon", amount: 65 },
    ],
  },

  {
    id: "qst_sunmoon_sect_yinyang_elixir",
    name: "วัสดุโอสถหยินหยาง",
    description: "ห้องปรุงโอสถของพรรคต้องการวัตถุดิบสำหรับโอสถหยินหยาง — โสมเป็นพลังหยาง บัวหิมะเป็นพลังหยิน และเม็ดบัวสำหรับเชื่อมประสานทั้งสอง",
    briefSummary: "ส่งโสม 5 + บัวหิมะ 1 + เม็ดบัว 5 · แต้มสำนัก +70",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "yang",
        description: "เก็บโสม 5 ราก (พลังหยาง)",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 5 },
      },
      {
        id: "yin",
        description: "เก็บบัวหิมะ 1 ดอก (พลังหยิน)",
        autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 },
      },
      {
        id: "bind",
        description: "เก็บเม็ดบัว 5 ฝัก เชื่อมประสาน",
        autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 5 },
      },
      { id: "report", description: "ส่งวัตถุดิบให้อาจารย์ใหญ่หยินอวี้ นำเข้าห้องโอสถ" },
    ],
    rewards: [
      { t: "gold", amount: 170 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 4 },
      { t: "sectPoints", sectId: "sunmoon", amount: 70 },
    ],
  },
];
