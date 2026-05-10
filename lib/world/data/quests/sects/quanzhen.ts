import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_QUANZHEN: readonly QuestDef[] = [
  {
    id: "qst_quanzhen_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ฉวนเจิน",
    description: "อาจารย์ฉงหยางรับศิษย์ใหม่ที่ใจสะอาดและพากเพียร — เก็บสมุนไพรประจำเขาเทียนซานให้ครบสามชนิดเพื่อพิสูจน์ตน · สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + เม็ดบัว 10 เข้าเป็นศิษย์ฉวนเจินขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_quanzhen_master_chongyang",
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
        description: "นำสมุนไพรกลับไปถวายอาจารย์ฉงหยาง",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 5 },
      { t: "joinSect", sectId: "quanzhen" },
      { t: "sectPoints", sectId: "quanzhen", amount: 20 },
    ],
  },

  {
    id: "qst_quanzhen_sect_patrol",
    name: "ลาดตระเวนรอบพระราชวังจงหยาง",
    description: "ภารกิจประจำของศิษย์ฉวนเจิน — ลาดตระเวนรอบพระราชวังจงหยางและกำราบโจรที่ก่อกวน",
    briefSummary: "ปราบโจรเร่ร่อน 2 คน · sect points +50",
    type: "side",
    sectId: "quanzhen",
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: { t: "sectMember", sectId: "quanzhen" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ฉงหยาง",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 3 },
      { t: "sectPoints", sectId: "quanzhen", amount: 50 },
    ],
  },

  {
    id: "qst_quanzhen_sect_scripture",
    name: "คัดลอกตำราเต๋า",
    description: "ห้องสมุดของฉวนเจินต้องการกระดาษและหมึกสำหรับคัดลอกตำราเต๋าเก่า — เก็บมาให้ครบ",
    briefSummary: "ส่งกระดาษ 5 + หมึก 5 · sect points +60",
    type: "side",
    sectId: "quanzhen",
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: { t: "sectMember", sectId: "quanzhen" },
    stages: [
      {
        id: "gather",
        description: "เก็บกระดาษ 5 + หมึก 5",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "paper", count: 5 },
            { t: "hasItem", itemId: "ink", count: 5 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งวัสดุให้อาจารย์ฉงหยาง",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 3 },
      { t: "sectPoints", sectId: "quanzhen", amount: 60 },
    ],
  },

  {
    id: "qst_quanzhen_art_sun",
    name: "ตำราหนึ่งพลังสุริยันต์",
    description: "อาจารย์ฉงหยางยอมเปิดตำราหนึ่งพลังสุริยันต์ให้ศิษย์ที่จิตใจเที่ยงตรง — ผ่านการประลองและการนั่งสมาธิที่หน้าผา",
    briefSummary: "ฝึกหนึ่งพลังสุริยันต์ — รับ T3 art ของฉวนเจิน",
    type: "side",
    sectId: "quanzhen",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "quanzhen" },
        { t: "sectRankAtLeast", sectId: "quanzhen", maxRank: 3 },
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
        description: "กลับไปรับตำราจากอาจารย์ฉงหยาง",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_qz_sun", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "quanzhen", amount: 100 },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 10 },
    ],
  },

  {
    id: "qst_gumu_disciple_intro",
    name: "เส้นทางสู่สุสานโบราณ",
    description: "หญิงปริศนาในสุสานโบราณบอกใบ้ว่า — เจ้าได้ฝึกหนึ่งพลังสุริยันต์ของฉวนเจินแล้ว แต่ปลายของวิชาสุริยันต์มีเพียงน้ำแข็งเย็นเฉียบรออยู่ · พิสูจน์ใจของเจ้า แล้วนางจะเปิดประตูสุสานให้",
    briefSummary: "พิสูจน์ใจ — รับเข้าเป็นศิษย์สุสานโบราณ (สละจากฉวนเจิน)",
    type: "side",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "quanzhen" },
        { t: "learnedArt", artId: "t3_qz_sun" },
        { t: "trait", trait: "evil", max: 10 },
        // Not already in any other sect's secret line
        { t: "not", of: { t: "sectMember", sectId: "gumu" } },
      ],
    },
    stages: [
      {
        id: "trial_blade",
        description: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร (bandit_chief) 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_offering",
        description: "นำของถวาย — เก็บบัวหิมะ 3 ดอก + แร่เทพ 1 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "snow_lotus", count: 3 },
            { t: "hasItem", itemId: "mithril_ore", count: 1 },
          ],
        },
      },
      {
        id: "return_to_woman",
        description: "กลับไปพบหญิงปริศนาในสุสานโบราณ",
      },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      // Sect swap: leave Quanzhen FIRST, then join Gumu. Order matters
      // — joinSect is idempotent and would no-op if already a member,
      // but leaveSect must precede joinSect so the cross-sect-loyalty
      // condition isn't violated mid-reward-chain.
      { t: "leaveSect", sectId: "quanzhen" },
      { t: "joinSect", sectId: "gumu" },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 20 },
    ],
  },

  {
    id: "qst_quanzhen_redemption",
    name: "ไถ่บาปต่อฉวนเจิน",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักฉวนเจินทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อฉวนเจิน — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "quanzhen",
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: { t: "sectStatus", sectId: "quanzhen", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — paper 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "paper", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักฉวนเจิน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "quanzhen" },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 10 },
    ],
  },

  {
    id: "qst_quanzhen_sect_patrol2",
    name: "ลาดตระเวนภูเขา",
    description: "ภารกิจประจำของศิษย์ฉวนเจิน — ปราบโจร 3 คน",
    briefSummary: "ปราบโจร 3 คน · sect points +50",
    type: "side",
    sectId: "quanzhen",
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: { t: "sectMember", sectId: "quanzhen" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_quanzhen_master_chongyang", amount: 3 },
      { t: "sectPoints", sectId: "quanzhen", amount: 50 },
    ],
  },
];
