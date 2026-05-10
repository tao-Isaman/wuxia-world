import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_XIAOYAO: readonly QuestDef[] = [
  {
    id: "qst_xiaoyao_disciple_intro",
    name: "ขอเข้าเป็นศิษย์พรรคสราญรมย์",
    description: "ปรมาจารย์ยุนเซียวรับเฉพาะผู้ใจอิสระ — เก็บดอกเหมย ๑๐ + โสม ๑๐ + บัวหิมะ ๒ มาแสดงว่าเจ้าก้าวเดินไปในยุทธภพได้คล่อง · ดอกเหมย/โสมเก็บได้ในป่าเขา · บัวหิมะได้จากที่สูง",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + บัวหิมะ 2 เข้าเป็นศิษย์พรรคสราญรมย์ขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_xiaoyao_master_yunxiao",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 15 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather",
        description: "เก็บสมุนไพรหายาก 10 + โสม 10 + บัวหิมะ 2",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "herb", count: 10 },
            { t: "hasItem", itemId: "ginseng", count: 10 },
            { t: "hasItem", itemId: "snow_lotus", count: 2 },
          ],
        },
      },
      { id: "return_to_master", description: "นำกลับไปถวายปรมาจารย์ยุนเซียว" },
    ],
    rewards: [
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_xiaoyao_master_yunxiao", amount: 5 },
      { t: "joinSect", sectId: "xiaoyao" },
      { t: "sectPoints", sectId: "xiaoyao", amount: 25 },
    ],
  },

  {
    id: "qst_xiaoyao_sect_patrol",
    name: "ลาดตระเวนหุบเขาเซียวหยาว",
    description: "ภารกิจประจำของศิษย์พรรคสราญรมย์ — กำราบโจรที่หลงเข้ามาในเขตหุบเขา",
    briefSummary: "ปราบหัวหน้าโจร 2 คน · sect points +50",
    type: "side",
    sectId: "xiaoyao",
    giverNpcId: "sect_xiaoyao_master_yunxiao",
    prereqs: { t: "sectMember", sectId: "xiaoyao" },
    stages: [
      { id: "patrol", description: "ปราบหัวหน้าโจร (bandit_chief) 2 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 } },
      { id: "report", description: "กลับไปรายงานปรมาจารย์" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_xiaoyao_master_yunxiao", amount: 3 },
      { t: "sectPoints", sectId: "xiaoyao", amount: 50 },
    ],
  },

  {
    id: "qst_xiaoyao_sect_herb",
    name: "เก็บสมุนไพรหุบเขาเซียวหยาว",
    description: "ห้องยาของพรรคต้องการสมุนไพรเพิ่ม — เก็บโสม + บัวหิมะมาให้",
    briefSummary: "ส่งโสม 6 + บัวหิมะ 1 · sect points +60",
    type: "side",
    sectId: "xiaoyao",
    giverNpcId: "sect_xiaoyao_master_yunxiao",
    prereqs: { t: "sectMember", sectId: "xiaoyao" },
    stages: [
      { id: "gather", description: "เก็บโสม 6 + บัวหิมะ 1", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "ginseng", count: 6 }, { t: "hasItem", itemId: "snow_lotus", count: 1 }] } },
      { id: "deliver", description: "ส่งสมุนไพรให้ปรมาจารย์" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_xiaoyao_master_yunxiao", amount: 3 },
      { t: "sectPoints", sectId: "xiaoyao", amount: 60 },
    ],
  },

  {
    id: "qst_xiaoyao_sect_music",
    name: "ส่งเครื่องเขียนให้นักดนตรี",
    description: "พรรคสราญรมย์ขึ้นชื่อเรื่องดนตรีและกวี — เก็บกระดาษและหมึกให้ห้องนักดนตรี",
    briefSummary: "ส่งกระดาษ 5 + หมึก 5 · sect points +60",
    type: "side",
    sectId: "xiaoyao",
    giverNpcId: "sect_xiaoyao_master_yunxiao",
    prereqs: { t: "sectMember", sectId: "xiaoyao" },
    stages: [
      { id: "gather", description: "เก็บกระดาษ 5 + หมึก 5", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "paper", count: 5 }, { t: "hasItem", itemId: "ink", count: 5 }] } },
      { id: "deliver", description: "ส่งวัสดุให้ห้องนักดนตรี" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_xiaoyao_master_yunxiao", amount: 3 },
      { t: "sectPoints", sectId: "xiaoyao", amount: 60 },
    ],
  },

  {
    id: "qst_xiaoyao_art_seepower",
    name: "ตำราวิชาดูพลัง",
    description: "ปรมาจารย์ยอมเปิดตำราวิชาดูพลังให้ศิษย์ที่จิตใจเที่ยงตรง — ผ่านการประลองและการเก็บสมุนไพรหายาก",
    briefSummary: "ฝึกวิชาดูพลัง — รับ T3 art ของพรรคสราญรมย์",
    type: "side",
    sectId: "xiaoyao",
    isArtQuest: true,
    minSectRank: 4,
    giverNpcId: "sect_xiaoyao_master_yunxiao",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "xiaoyao" },
        { t: "sectRankAtLeast", sectId: "xiaoyao", maxRank: 4 },
      ],
    },
    stages: [
      { id: "trial_kill", description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 } },
      { id: "trial_meditate", description: "นั่งสมาธิ — เก็บโสม 8 ราก", autoAdvance: { t: "hasItem", itemId: "ginseng", count: 8 } },
      { id: "return_art", description: "กลับไปรับตำราจากปรมาจารย์" },
    ],
    rewards: [
      { t: "wExp", amount: 250 },
      { t: "learnArt", artId: "t3_xy_seepower", level: 4 },
      { t: "trait", trait: "humility", amount: 4 },
      { t: "sectPoints", sectId: "xiaoyao", amount: 150 },
      { t: "npcRelationship", npcId: "sect_xiaoyao_master_yunxiao", amount: 12 },
    ],
  },
];
