import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_BEGGARS: readonly QuestDef[] = [
  {
    id: "qst_beggars_disciple_intro",
    name: "ขอเข้าเป็นศิษย์พรรคยาจก",
    description: "หัวหน้าหงเทียนรับเฉพาะผู้ที่เข้าใจวิถียาจก — ผู้ที่ฝึกขอทานจนถึงขั้น ๒ แล้วเท่านั้น เก็บอาหารและเงินทองที่ได้จากท้องถนนมาแสดงให้ท่านเห็น",
    briefSummary: "ส่งข้าวห่อ 5 + เงิน 100 ทอง · เข้าเป็นศิษย์พรรคยาจกขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 10 },
        { t: "lifeSkillLevel", skill: "begging", min: 2 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "gather_offering",
        description: "รวบรวมข้าวห่อ 5 + เงิน 100 ทอง จากการขอทาน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "rice_dish", count: 5 },
            { t: "goldAtLeast", amount: 100 },
          ],
        },
      },
      {
        id: "return_to_chief",
        description: "นำของและเงินไปแสดงต่อหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 5 },
      { t: "joinSect", sectId: "beggars" },
      { t: "sectPoints", sectId: "beggars", amount: 20 },
    ],
  },

  {
    id: "qst_beggars_sect_patrol",
    name: "ลาดตระเวนตรอกเมือง",
    description: "ภารกิจประจำของศิษย์พรรคยาจก — ลาดตระเวนตรอกเมืองและกำราบโจรที่รังแกผู้อ่อนแอ",
    briefSummary: "ปราบโจร 2 คน · sect points +50",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 50 },
    ],
  },

  {
    id: "qst_beggars_sect_alms",
    name: "แจกอาหารคนยากไร้",
    description: "พรรคยาจกช่วยเหลือคนยากไร้เป็นกิจวัตร — เก็บข้าวห่อมาแจกให้ผู้หิวโหยในตรอกเมือง",
    briefSummary: "ส่งข้าวห่อ 8 · sect points +60",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "gather",
        description: "เก็บข้าวห่อ 8 ห่อ",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 8 },
      },
      {
        id: "deliver",
        description: "ส่งข้าวห่อให้หัวหน้าหงเทียนนำไปแจก",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 60 },
    ],
  },

  {
    id: "qst_beggars_art_thousandcrowd",
    name: "ตำราหมื่นมวลชน",
    description: "หัวหน้าหงเทียนยอมเปิดตำราวิชาหมื่นมวลชนให้ศิษย์ที่พิสูจน์ได้ทั้งฝีมือและน้ำใจ — เป็นวิชาลับสุดยอดของพรรคยาจก",
    briefSummary: "ฝึกหมื่นมวลชน — รับ T4 art ลับของพรรคยาจก",
    type: "side",
    sectId: "beggars",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "beggars" },
        { t: "sectRankAtLeast", sectId: "beggars", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร (bandit_chief) 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_alms",
        description: "พิสูจน์น้ำใจ — เก็บข้าวห่อ 12 ห่อสำหรับแจกเลี้ยง",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 12 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "t4_bg_thousandcrowd", level: 5 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "sectPoints", sectId: "beggars", amount: 200 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 20 },
    ],
  },

  {
    id: "qst_beggars_spy_report",
    name: "รายงานสายลับยุทธภพ",
    description: "หัวหน้าหงเทียนได้รับข่าวว่ามีองค์กรลึกลับเคลื่อนไหวในยุทธภพ ขอให้ไปสืบข้อมูลมาให้",
    briefSummary: "สืบหาข้อมูลองค์กรลึกลับให้หัวหน้าพรรคยาจก",
    type: "side",
    giverNpcId: "sect_beggars_chief_hongtian",
    stages: [
      {
        id: "visit_three_places",
        description: "สืบหาข้อมูลจากสามสถานที่ต่างกัน",
      },
      {
        id: "confront_spy",
        description: "เผชิญหน้าและสอบสวนสายลับขององค์กร",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report_back",
        description: "นำข้อมูลกลับรายงานหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 90 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 15 },
    ],
  },

  {
    id: "qst_beggars_hungry_children",
    name: "อาหารเพื่อเด็กยาจก",
    description: "เด็กกำพร้าในพรรคยาจกขาดแคลนอาหาร หัวหน้าขอให้นำข้าวสารและเนื้อสัตว์มาช่วย",
    briefSummary: "รวบรวมอาหารมาช่วยเด็กในพรรคยาจก",
    type: "side",
    giverNpcId: "sect_beggars_chief_hongtian",
    stages: [
      {
        id: "gather_food",
        description: "รวบรวมเนื้อสด 3 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "raw_meat", count: 3 },
      },
      {
        id: "deliver_food",
        description: "ส่งอาหารให้หัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 15 },
    ],
  },

  {
    id: "qst_beggars_redemption",
    name: "ไถ่บาปต่อพรรคยาจก",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักพรรคยาจกทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อพรรคยาจก — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectStatus", sectId: "beggars", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — rice_dish 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักพรรคยาจก" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "beggars" },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 10 },
    ],
  },

  {
    id: "qst_beggars_sect_rice2",
    name: "เก็บข้าวห่อให้คนยาก",
    description: "ภารกิจประจำของศิษย์พรรคยาจก — เก็บข้าวห่อ 6 ชิ้น",
    briefSummary: "ส่งข้าวห่อ 6 ชิ้น · sect points +50",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      { id: "main", description: "เก็บข้าวห่อ 6 ชิ้น", autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 6 } },
      { id: "report", description: "กลับไปรายงาน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 50 },
    ],
  },
];
