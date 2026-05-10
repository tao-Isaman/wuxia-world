import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_GUMU: readonly QuestDef[] = [
  {
    id: "qst_gumu_sect_lonely",
    name: "ลำพังในเหมันต์",
    description: "หญิงปริศนาขอให้เจ้านำสมุนไพรเย็นจากที่สูงและเหล็กพิเศษมาให้ — เพื่อใช้ในการปรุงยาและตีดาบในสุสาน",
    briefSummary: "ส่งบัวหิมะ 2 + เหล็กดิบ 3 · sect points +80",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      {
        id: "gather",
        description: "เก็บบัวหิมะ 2 ดอก + เหล็กดิบ 3 ก้อน",
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
        description: "ส่งของให้หญิงปริศนา",
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
    description: "หญิงปริศนาขอให้นำเหล็กดิบและกระดาษมาเพิ่ม — สำหรับซ่อมแซมห้องลึก",
    briefSummary: "ส่งเหล็กดิบ 4 + กระดาษ 4 · sect points +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "gather", description: "เก็บเหล็กดิบ 4 + กระดาษ 4", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "iron_ore", count: 4 }, { t: "hasItem", itemId: "paper", count: 4 }] } },
      { id: "deliver", description: "ส่งของให้หญิงปริศนา" },
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
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักสุสานโบราณทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อสุสานโบราณ — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectStatus", sectId: "gumu", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — snow_lotus 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักสุสานโบราณ" },
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
    briefSummary: "ปราบโจร 2 คน · sect points +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "main", description: "ปราบโจรเร่ร่อน 2 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 3 },
      { t: "sectPoints", sectId: "gumu", amount: 50 },
    ],
  },

  {
    id: "qst_gumu_sect_offering",
    name: "ส่งของถวายสุสาน",
    description: "หญิงปริศนาขอให้นำเหล็กดิบและกระดาษมาเพิ่ม — สำหรับซ่อมแซมห้องลึก",
    briefSummary: "ส่งเหล็กดิบ 4 + กระดาษ 4 · sect points +50",
    type: "side",
    sectId: "gumu",
    giverNpcId: "sect_gumu_mystery_woman",
    prereqs: { t: "sectMember", sectId: "gumu" },
    stages: [
      { id: "gather", description: "เก็บเหล็กดิบ 4 + กระดาษ 4", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "iron_ore", count: 4 }, { t: "hasItem", itemId: "paper", count: 4 }] } },
      { id: "deliver", description: "ส่งของให้หญิงปริศนา" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_gumu_mystery_woman", amount: 3 },
      { t: "sectPoints", sectId: "gumu", amount: 50 },
    ],
  },
];
