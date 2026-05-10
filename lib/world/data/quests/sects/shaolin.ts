import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_SHAOLIN: readonly QuestDef[] = [
  {
    id: "qst_shaolin_disciple_intro",
    name: "ขอเข้าเป็นศิษย์เส้าหลิน",
    description: "ผู้ขอเข้าสำนักเส้าหลินต้องพิสูจน์ความตั้งใจและความขยันก่อน เจ้าอาวาสฮุยหยวนสั่งให้เจ้าเก็บสมุนไพรหลากชนิดมาถวายวัด — สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + เม็ดบัว 10 เข้าเป็นศิษย์เส้าหลินขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "gender", equals: "male" },
        { t: "trait", trait: "evil", max: 10 },
        // A disciple is loyal to one school — joining requires not being
        // affiliated with ANY existing sect. New sects added to SectId
        // are auto-excluded; no per-intro list to maintain.
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
        id: "return_to_abbot",
        description: "นำสมุนไพรกลับไปถวายเจ้าอาวาสฮุยหยวน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 5 },
      // joinSect must come BEFORE sectPoints — the dispatcher seeds the
      // membership before sectPoints can deposit into it. Out-of-order
      // would no-op the points (no membership to add to).
      { t: "joinSect", sectId: "shaolin" },
      { t: "sectPoints", sectId: "shaolin", amount: 20 },
    ],
  },

  {
    id: "qst_shaolin_sect_patrol",
    name: "ตรวจตราเขตวัด",
    description: "ภารกิจประจำของศิษย์เส้าหลิน — ออกตรวจตราเขตวัดและกำราบโจรที่ลอบเข้าสำนัก",
    briefSummary: "ปราบโจรในเขตวัด 2 คน · sect points +50",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 3 },
      { t: "sectPoints", sectId: "shaolin", amount: 50 },
    ],
  },

  {
    id: "qst_shaolin_sect_herb_run",
    name: "ส่งสมุนไพรให้วัด",
    description: "วัดต้องการสมุนไพรสำหรับยารักษาศิษย์ที่บาดเจ็บ — เก็บสมุนไพรในป่าเขาซงซานและนำกลับมา",
    briefSummary: "ส่งสมุนไพร 5 ชิ้น · sect points +60",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "gather_herbs",
        description: "เก็บสมุนไพร 5 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งสมุนไพรให้เจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 3 },
      { t: "sectPoints", sectId: "shaolin", amount: 60 },
    ],
  },

  {
    id: "qst_shaolin_sect_meditation",
    name: "ปฏิบัติธรรมที่ถ้ำลึก",
    description: "นั่งวิปัสนาที่ถ้ำลึกของซงซาน 1 ครั้ง เพื่อชำระจิตใจ — เพิ่มความถ่อมตน",
    briefSummary: "ปฏิบัติธรรม + เก็บอาหาร 5 ชิ้น · sect points +80",
    type: "side",
    sectId: "shaolin",
    minSectRank: 7,
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "shaolin" },
        { t: "sectRankAtLeast", sectId: "shaolin", maxRank: 7 },
      ],
    },
    stages: [
      {
        id: "meditate",
        description: "เก็บเนื้อย่างระหว่างเดินทาง 3 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "cooked_meat", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 5 },
      { t: "sectPoints", sectId: "shaolin", amount: 80 },
    ],
  },

  {
    id: "qst_shaolin_art_zen_finger",
    name: "ตำราเอกนิ้วเซน",
    description: "เจ้าอาวาสยอมเปิดตำราเอกนิ้วเซน (一指禅) ให้ศิษย์ผู้มีจิตใจสูงสุดได้ฝึก — ผ่านการนั่งวิปัสนาที่ถ้ำซงซานและพิสูจน์ฝีมือ",
    briefSummary: "ฝึกเอกนิ้วเซน — รับ T3 art ของเส้าหลิน",
    type: "side",
    sectId: "shaolin",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "shaolin" },
        { t: "sectRankAtLeast", sectId: "shaolin", maxRank: 5 },
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
        description: "นั่งสมาธิ — รวบรวมสมุนไพรหายาก 8 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 8 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากเจ้าอาวาสฮุยหยวน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t3_onefinger", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "shaolin", amount: 100 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 10 },
    ],
  },

  {
    id: "qst_shaolin_art_legendary",
    name: "ตำราพลังเปลี่ยนเส้นเอ็น",
    description: "ตำนานสุดยอดของเส้าหลิน — 易筋经. เปิดให้ศิษย์ที่ได้รับความไว้วางใจสูงสุดเท่านั้น พิสูจน์ทั้งกายและจิตใจ",
    briefSummary: "ฝึกเปลี่ยนเส้นเอ็น — รับ T4 art ลับของเส้าหลิน",
    type: "side",
    sectId: "shaolin",
    isArtQuest: true,
    minSectRank: 2,
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "shaolin" },
        { t: "sectRankAtLeast", sectId: "shaolin", maxRank: 2 },
      ],
    },
    stages: [
      {
        id: "trial_body",
        description: "พิสูจน์ร่างกาย — ปราบหัวหน้าโจร (bandit_chief) 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_mind",
        description: "พิสูจน์จิตใจ — สะสมความถ่อมตนถึง 30",
        autoAdvance: { t: "trait", trait: "humility", min: 30 },
      },
      {
        id: "return_legend",
        description: "กลับไปรับตำราจากเจ้าอาวาสฮุยหยวน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "tendon", level: 5 },
      { t: "trait", trait: "humility", amount: 10 },
      { t: "sectPoints", sectId: "shaolin", amount: 200 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 20 },
    ],
  },

  {
    id: "qst_shaolin_relic_theft",
    name: "พระธาตุสูญหาย",
    description: "พระธาตุสำคัญของเส้าหลินถูกขโมยออกไปในคืนวาน เจ้าอาวาสสงสัยว่าเป็นฝีมือโจรปีนขื่อ",
    briefSummary: "ค้นหาและนำพระธาตุกลับคืนให้เจ้าอาวาสเส้าหลิน",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    stages: [
      {
        id: "investigate",
        description: "สืบหาร่องรอยพระธาตุที่วัด",
        autoAdvance: { t: "visitedLocation", locationId: "sect_shaolin" },
      },
      {
        id: "track_thief",
        description: "ติดตามโจรที่หลบหนีออกไปทางป่า",
      },
      {
        id: "defeat_thief",
        description: "ปราบโจรและนำพระธาตุกลับคืน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "return_relic",
        description: "ส่งพระธาตุคืนแก่เจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 15 },
      { t: "sectPoints", sectId: "shaolin", amount: 80 },
    ],
  },

  {
    id: "qst_shaolin_disciple_gone",
    name: "ลูกศิษย์สาบสูญ",
    description: "ลูกศิษย์เส้าหลินคนหนึ่งหายตัวและถูกพบเห็นว่าลักขโมยและก่อความวุ่นวาย เจ้าอาวาสขอให้นำตัวกลับมา",
    briefSummary: "ตามหาและนำลูกศิษย์เส้าหลินที่หลงทางกลับมาสำนัก",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "questStatus", questId: "qst_shaolin_relic_theft", status: "done" },
    stages: [
      {
        id: "search_city",
        description: "ค้นหาลูกศิษย์ตามเมืองใกล้เคียง",
      },
      {
        id: "confront",
        description: "เผชิญหน้ากับลูกศิษย์ที่หลงทาง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_disciple", count: 1 },
      },
      {
        id: "bring_back",
        description: "พาลูกศิษย์กลับวัดเส้าหลิน",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 10 },
      { t: "sectPoints", sectId: "shaolin", amount: 80 },
    ],
  },

  {
    id: "qst_shaolin_proof_of_heart",
    name: "บทพิสูจน์แห่งจิตใจ",
    description: "เจ้าอาวาสเส้าหลินขอทดสอบจิตใจของผู้มาขอเรียนวิชา — จะเลือกความเมตตาหรือความเข้มแข็ง?",
    briefSummary: "ผ่านบทพิสูจน์จิตใจของเจ้าอาวาสเส้าหลิน",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "questStatus", questId: "qst_shaolin_disciple_gone", status: "done" },
        { t: "trait", trait: "good", min: 5 },
      ],
    },
    stages: [
      {
        id: "enter_trial",
        description: "เข้ารับการทดสอบจากเจ้าอาวาส",
      },
      {
        id: "complete_trial",
        description: "ผ่านการทดสอบ",
      },
    ],
    rewards: [
      { t: "wExp", amount: 150 },
      { t: "learnSkill", skillId: "sf" },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 20 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "shaolin", amount: 120 },
    ],
  },

  {
    id: "qst_shaolin_iron_training",
    name: "วัตถุดิบฝึกเหล็ก",
    description: "อาจารย์ฝาหมิงต้องการแร่เหล็กพิเศษสำหรับฝึกกระดิ่งทอง นำแร่เทพมาให้ท่าน",
    briefSummary: "นำแร่เทพให้อาจารย์ฝาหมิงของเส้าหลิน",
    type: "side",
    giverNpcId: "sect_shaolin_elder_faming",
    stages: [
      {
        id: "collect_ore",
        description: "หาแร่เทพ 1 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "mithril_ore", count: 1 },
      },
      {
        id: "deliver",
        description: "ส่งแร่เทพให้อาจารย์ฝาหมิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "wExp", amount: 100 },
      { t: "learnArt", artId: "t1_goldenbell", level: 1 },
      { t: "npcRelationship", npcId: "sect_shaolin_elder_faming", amount: 15 },
      { t: "sectPoints", sectId: "shaolin", amount: 70 },
    ],
  },

  {
    id: "qst_shaolin_wudang_joint",
    name: "ความลับใต้ผืนดิน",
    description: "ร่องรอยพระธาตุเส้าหลินและตราประทับอู่ตังนำสู่ถ้ำโบราณเดียวกัน อาจมีความลับฝังลึกกว่านั้น",
    briefSummary: "สืบสวนถ้ำโบราณที่เชื่อมพระธาตุเส้าหลินและอู่ตังเข้าด้วยกัน",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: {
      t: "and",
      all: [
        { t: "questStatus", questId: "qst_shaolin_proof_of_heart", status: "done" },
        { t: "questStatus", questId: "qst_wudang_mountain_seal", status: "done" },
      ],
    },
    stages: [
      {
        id: "discover_connection",
        description: "พูดคุยกับอาจารย์ทั้งสองสำนักเพื่อเชื่อมโยงเบาะแส",
      },
      {
        id: "enter_cave",
        description: "เข้าสำรวจถ้ำโบราณ",
      },
      {
        id: "defeat_guardian",
        description: "ปราบผู้พิทักษ์ถ้ำ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "demonic_master", count: 1 },
      },
      {
        id: "uncover_truth",
        description: "ค้นพบความลับโบราณและเลือกว่าจะทำอย่างไรกับมัน",
      },
    ],
    rewards: [
      { t: "gold", amount: 1500 },
      { t: "wExp", amount: 200 },
      { t: "trait", trait: "fame", amount: 10 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "learnArt", artId: "t3_yinyang", level: 1 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 25 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 25 },
      { t: "sectPoints", sectId: "shaolin", amount: 200 },
    ],
  },

  {
    id: "qst_shaolin_redemption",
    name: "ไถ่บาปต่อเส้าหลิน",
    description: "เจ้าผู้ทรยศกลับมาขออภัย — เจ้าสำนักเส้าหลินทดสอบความจริงใจเจ้าด้วยภารกิจหนัก ปราบหัวหน้าโจร 5 คนและนำของล้ำค่าของสำนักมาถวาย หากผ่าน ความเป็นทรยศจะถูกล้างเป็น \"ลาออก\" — นักล่าจะหยุดตามล่า แต่วิชาจะถูกแช่แข็ง",
    briefSummary: "ไถ่บาปต่อเส้าหลิน — ปราบหัวหน้าโจร 5 + ส่งของถวาย 5 ชิ้น",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectStatus", sectId: "shaolin", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร (bandit_chief) 5 คน เพื่อพิสูจน์ใจ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำของถวาย — ginseng 5 ชิ้น", autoAdvance: { t: "hasItem", itemId: "ginseng", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าสำนักเส้าหลิน" },
    ],
    rewards: [
      { t: "wExp", amount: 300 },
      { t: "trait", trait: "humility", amount: 8 },
      { t: "resignSect", sectId: "shaolin" },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 10 },
    ],
  },

  {
    id: "qst_shaolin_sect_protect_village",
    name: "ปกป้องชาวบ้านจากโจร",
    description: "ชาวบ้านใกล้เขาซงซานร้องขอความช่วยเหลือ — โจรลอบเข้ารังแกชาวนาผู้ยากไร้ เจ้าอาวาสสั่งให้ศิษย์เส้าหลินกำราบโจรและนำอาหารไปแจกชาวบ้าน",
    briefSummary: "ปราบโจร 3 คน + นำข้าวหมูแดง 5 จานแจกชาวบ้าน · sect points +65",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "fight_bandits",
        description: "ปราบโจร (bandit) 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 },
      },
      {
        id: "gather_food",
        description: "หาข้าวหมูแดง 5 จานแจกชาวบ้าน",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 5 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 3 },
      { t: "sectPoints", sectId: "shaolin", amount: 65 },
    ],
  },

  {
    id: "qst_shaolin_sect_sutra_paper",
    name: "กระดาษคัดลอกพระสูตร",
    description: "หอพระสูตรของวัดเส้าหลินขาดกระดาษสำหรับคัดลอกพระไตรปิฎก เจ้าอาวาสฮุยหยวนขอให้ศิษย์ออกหากระดาษคุณภาพดีจากเมืองใกล้เคียง",
    briefSummary: "ส่งกระดาษ 6 แผ่นเข้าหอพระสูตร · sect points +50",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "main",
        description: "หากระดาษ 6 แผ่น",
        autoAdvance: { t: "hasItem", itemId: "paper", count: 6 },
      },
      {
        id: "report",
        description: "ส่งกระดาษให้เจ้าอาวาส",
      },
    ],
    rewards: [
      { t: "gold", amount: 110 },
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 1 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 3 },
      { t: "sectPoints", sectId: "shaolin", amount: 50 },
    ],
  },
];
