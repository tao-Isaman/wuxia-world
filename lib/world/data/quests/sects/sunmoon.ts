import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_SUNMOON: readonly QuestDef[] = [
  {
    id: "qst_sunmoon_disciple_intro",
    name: "ขอเข้าเป็นศิษย์พรรคตะวันจันทรา",
    description: "เจ้าสำนักต่งฟางต้องการพิสูจน์ความจงรักภักดีของเจ้า — ลอบสังหารองครักษ์ฉินแห่งกรมเสื้อแพร ที่กำลังตามล่าศิษย์ของพรรค",
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
        description: "กลับไปรายงานเจ้าสำนักต่งฟาง",
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
    briefSummary: "ปราบหัวหน้าโจร 2 คน · sect points +50",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "patrol",
        description: "ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าสำนัก",
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
    name: "เก็บคัมภีร์เก่าจากซากเมือง",
    description: "ห้องคัมภีร์ของพรรคต้องการกระดาษและหมึกเพิ่มเพื่อคัดลอกคัมภีร์ลับ — เก็บมาให้ครบ",
    briefSummary: "ส่งกระดาษ 6 + หมึก 6 · sect points +60",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      {
        id: "gather",
        description: "เก็บกระดาษ 6 + หมึก 6",
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
        description: "ส่งวัสดุให้เจ้าสำนัก",
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
    name: "ตำราเฉียนคุนต้าหนัวอี",
    description: "เจ้าสำนักต่งฟางยอมเปิดตำราเฉียนคุนต้าหนัวอีให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความภักดี — เป็นวิชาลับสุดยอดของพรรคตะวันจันทรา",
    briefSummary: "ฝึกเฉียนคุนต้าหนัวอี — รับ T4 art ลับของพรรคตะวันจันทรา",
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
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร (bandit_chief) 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 4 },
      },
      {
        id: "trial_loyalty",
        description: "พิสูจน์ความภักดี — สะสมความหยิ่ง (arrogance) ถึง 25",
        autoAdvance: { t: "trait", trait: "arrogance", min: 25 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากเจ้าสำนัก",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "qiankun", level: 5 },
      { t: "trait", trait: "arrogance", amount: 5 },
      { t: "sectPoints", sectId: "sunmoon", amount: 200 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 20 },
    ],
  },

  {
    id: "qst_sunmoon_redemption",
    name: "ไถ่บาปต่อพรรคตะวันจันทรา",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักพรรคตะวันจันทราทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อพรรคตะวันจันทรา — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectStatus", sectId: "sunmoon", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — ancient_coin 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักพรรคตะวันจันทรา" },
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
    briefSummary: "ปราบโจร 3 คน · sect points +50",
    type: "side",
    sectId: "sunmoon",
    giverNpcId: "sect_sunmoon_chief_dongfang",
    prereqs: { t: "sectMember", sectId: "sunmoon" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_sunmoon_chief_dongfang", amount: 3 },
      { t: "sectPoints", sectId: "sunmoon", amount: 50 },
    ],
  },
];
