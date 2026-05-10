import type { QuestDef } from "../../../types";

// Songshan sect quests. Mirror structure of huashan.ts:
//   1 paid intro (gold + iron ingredient)
//   3 repeating sect chores (patrol / iron / wooden)
//   1 art quest (T3 pillar)
//   1 redemption quest (betrayed → resigned)

export const QUESTS_SONGSHAN: readonly QuestDef[] = [
  {
    id: "qst_songshan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ซงซาน",
    description: "อาจารย์ใหญ่จั่วเหลิงฉานปกครองซงซานด้วยกฎเหล็ก — ผู้ใดต้องการเข้าสำนักต้องถวายเหล็กดิบ ๓ ก้อนสำหรับหลอมดาบฝึก และค่าเข้าสำนัก ๕๐๐ ทอง",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งเหล็กดิบ 3 ก้อน เข้าเป็นศิษย์ซงซานขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_songshan_master_zuolengchan",
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
        description: "เตรียมเหล็กดิบ 3 ก้อน + เก็บเงินให้ครบ 500 ทอง",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "iron_ore", count: 3 },
            { t: "goldAtLeast", amount: 500 },
          ],
        },
      },
      {
        id: "return_to_master",
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์ใหญ่จั่วเหลิงฉาน",
      },
    ],
    // Gold deduction + iron deduction happen in the complete-scene's choice
    // (addGold:-500 + takeItem iron_ore×3) so the player only pays when
    // they actually accept registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 5 },
      { t: "joinSect", sectId: "songshan" },
      { t: "sectPoints", sectId: "songshan", amount: 20 },
    ],
  },

  {
    id: "qst_songshan_sect_patrol",
    name: "ลาดตระเวนเชิงเขาซงซาน",
    description: "ภารกิจประจำของศิษย์ซงซาน — ลาดตระเวนเชิงเขายอดกลาง กำราบโจรเร่ร่อนที่บุกรุกอาณาเขต",
    briefSummary: "ปราบโจรเชิงเขา 2 คน · sect points +50",
    type: "side",
    sectId: "songshan",
    giverNpcId: "sect_songshan_master_zuolengchan",
    prereqs: { t: "sectMember", sectId: "songshan" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์ใหญ่จั่วเหลิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 3 },
      { t: "sectPoints", sectId: "songshan", amount: 50 },
    ],
  },

  {
    id: "qst_songshan_sect_iron",
    name: "ส่งเหล็กดิบให้โรงตีดาบ",
    description: "โรงตีดาบเหล็กหนักของซงซานต้องการเหล็กดิบเพิ่มเพื่อหลอมดาบเหล็กให้ห้าทวาร — เก็บเหล็กดิบมาถวาย",
    briefSummary: "ส่งเหล็กดิบ 5 ก้อน · sect points +60",
    type: "side",
    sectId: "songshan",
    giverNpcId: "sect_songshan_master_zuolengchan",
    prereqs: { t: "sectMember", sectId: "songshan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บเหล็กดิบ 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้อาจารย์ใหญ่จั่วเหลิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 3 },
      { t: "sectPoints", sectId: "songshan", amount: 60 },
    ],
  },

  {
    id: "qst_songshan_sect_wooden",
    name: "ส่งไม้แข็งให้โรงดาบ",
    description: "ภารกิจประจำของศิษย์ซงซาน — เก็บไม้เนื้อแข็งสำหรับทำด้ามดาบเหล็กหนัก ๕ ชิ้น",
    briefSummary: "ส่งไม้แข็ง 5 ชิ้น · sect points +50",
    type: "side",
    sectId: "songshan",
    giverNpcId: "sect_songshan_master_zuolengchan",
    prereqs: { t: "sectMember", sectId: "songshan" },
    stages: [
      { id: "main", description: "เก็บไม้แข็ง 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 5 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 3 },
      { t: "sectPoints", sectId: "songshan", amount: 50 },
    ],
  },

  {
    id: "qst_songshan_art_pillar",
    name: "ตำราพลังเสาภูผา",
    description: "อาจารย์ใหญ่จั่วเหลิงฉานยอมเปิดตำราพลังเสาภูผาให้ศิษย์ที่พิสูจน์ทั้งดาบและจิตใจอย่างหนักแน่น — ผ่านการประลองกับหัวหน้าโจรชั้นสูงและการรวบรวมเหล็กพิเศษ",
    briefSummary: "ฝึกพลังเสาภูผา — รับ T3 art ลับของซงซาน",
    type: "side",
    sectId: "songshan",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_songshan_master_zuolengchan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "songshan" },
        { t: "sectRankAtLeast", sectId: "songshan", maxRank: 5 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์ดาบ — ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_iron",
        description: "พิสูจน์ใจ — รวบรวมแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากอาจารย์ใหญ่จั่วเหลิงฉาน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_ssh_pillar", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "songshan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 10 },
    ],
  },

  {
    id: "qst_songshan_redemption",
    name: "ไถ่บาปต่อซงซาน",
    description: "เจ้าทรยศซงซานกลับมาขออภัย — อาจารย์ใหญ่จั่วเหลิงฉานทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำเหล็กดิบ 5 ชิ้นถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อซงซาน — ปราบหัวหน้าโจร 5 + ส่งเหล็ก 5 ชิ้น",
    type: "side",
    sectId: "songshan",
    giverNpcId: "sect_songshan_master_zuolengchan",
    prereqs: { t: "sectStatus", sectId: "songshan", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำเหล็กดิบ 5 ชิ้นถวาย", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่ออาจารย์ใหญ่จั่วเหลิงฉาน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "songshan" },
      { t: "npcRelationship", npcId: "sect_songshan_master_zuolengchan", amount: 10 },
    ],
  },
];
