import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_GUMU: readonly QuestDef[] = [
  {
    id: "qst_gumu_sect_lonely",
    name: "ลำพังในเหมันต์",
    description: "หญิงปริศนาในสุสานขอบัวหิมะ 2 ดอกจากที่สูงไว้ปรุงยา และแร่เหล็ก 3 ก้อนไว้ตีกระบี่",
    briefSummary: "ส่งบัวหิมะ 2 + แร่เหล็ก 3 · แต้มสำนัก +80",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      {
        id: "gather",
        description: "เก็บบัวหิมะ 2 ดอก + แร่เหล็ก 3 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "snow_lotus", count: 2 },
            { t: "hasItem", itemId: "iron_ore", count: 3 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งของให้หญิงปริศนาในสุสาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 100 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 5 },
      { t: "sectPoints", sectId: "gumu", amount: 80 },
    ],
  },

  {
    id: "qst_gumu_sect_offering",
    name: "ส่งของถวายสุสาน",
    description: "หญิงปริศนาในสุสานขอแร่เหล็ก 4 ก้อนกับกระดาษสา 4 แผ่น ไว้ซ่อมประตูกลและคัดตำราในห้องลึก",
    briefSummary: "ส่งแร่เหล็ก 4 + กระดาษสา 4 · แต้มสำนัก +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "gather", description: "เก็บแร่เหล็ก 4 + กระดาษสา 4", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "iron_ore", count: 4 }, { t: "hasItem", itemId: "paper", count: 4 }] } },
      { id: "deliver", description: "ส่งของให้หญิงปริศนาในสุสาน" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 3 },
      { t: "sectPoints", sectId: "gumu", amount: 50 },
    ],
  },

  {
    id: "qst_gumu_redemption",
    name: "ไถ่บาปต่อสุสานโบราณ",
    description: "เจ้าเคยทรยศสุสานโบราณ สำนักจึงส่งนักล่ามาตามเจ้า — แต่หญิงปริศนาในสุสานยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำบัวหิมะ 5 ดอกมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของสุสานโบราณที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อสุสานโบราณ — ปราบหัวหน้าโจร 5 + ถวายบัวหิมะ 5 ดอก",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectStatus", sectId: "gumu", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำบัวหิมะ 5 ดอกมาถวาย", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อหญิงปริศนาในสุสาน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "gumu" },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 10 },
    ],
  },

  {
    id: "qst_gumu_sect_patrol2",
    name: "ลาดตระเวนสุสาน",
    description: "ภารกิจประจำของศิษย์สุสานโบราณ — ปราบโจร 2 คน",
    briefSummary: "ปราบโจร 2 คน · แต้มสำนัก +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 2 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 } },
      { id: "report", description: "กลับไปรายงานหญิงปริศนาในสุสาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 3 },
      { t: "sectPoints", sectId: "gumu", amount: 50 },
    ],
  },
];
