import type { QuestDef } from "../../types";

// Side quests owned by content agent C — anchored to NPCs at sects,
// temples, palaces, and mansions. Pairs with
// lib/world/data/npcs/sects-temples.ts and
// lib/world/data/scenes-content/sects-temples.ts.
export const QUESTS_SECTS_TEMPLES: readonly QuestDef[] = [
  // ──────────────────────────────────────────────────────────────────────
  // เส้าหลิน — เจ้าอาวาสฮุยหยวน
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration intro)
  // Gateway quest. Prereqs gate by gender + evil trait + non-membership.
  // Mixed-herb gathering trial — three medicinal plants (herb + ginseng
  // + lotus_seed). The herbalism gather node already drops all three so
  // a single grind run satisfies the whole quest. The abbot wants a
  // variety of herbs for the apothecary, not just one species.
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำเส้าหลิน — ทำซ้ำได้ทุก 30 วัน — ทุกครั้งที่สำเร็จได้ sect points
  // (Sect quest cooldown handled by SectMembership.lastQuestDay map. Reward
  // payouts include `addSectPoints` via the quest's turn-in scene; QuestReward
  // doesn't carry sect-points directly so the scene effect drives it.)
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ตรวจตราเขตวัด — sect points 50 (rank 9–7)
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

  // SECT-2 · ส่งสมุนไพร — sect points 60 (rank 9–6)
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

  // SECT-3 · ปฏิบัติธรรม — sect points 80 (rank 7–5)
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — one-shot, rank-gated. Each completes a small trial
  // and rewards a bonus high-tier art (in addition to the normal rank pool
  // pick). Tracked in `sectMembership.shaolin.artQuestsDone`.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราเอกนิ้วเซน — unlock at rank 5, reward bonus T3 art
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

  // ART-2 · ตำราเปลี่ยนเส้นเอ็น — unlock at rank 2, reward T4 art
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

  // 1. FETCH — พระธาตุถูกขโมย (relic theft)
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

  // 2. DEFEAT — ลูกศิษย์หายตัว (disciple gone rogue)
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

  // 3. MORAL — พิสูจน์ใจ (proof of heart — branching)
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

  // 4. FETCH — ฝึกเหล็ก (iron training — materials)
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

  // ──────────────────────────────────────────────────────────────────────
  // อู่ตัง — อาจารย์ชิงซวี่
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration intro)
  // No gender requirement — Wudang welcomes any sincere seeker. The trial
  // is herb-gathering across the wider mountain biome (mixed: ginseng +
  // lotus_seed + snow_lotus from canyon herbs nodes).
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำอู่ตัง — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ตรวจตรารอบเขา — sect points 50 (rank 9–7)
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

  // SECT-2 · เก็บสมุนไพรประจำสำนัก — sect points 60 (rank 9–6)
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — one-shot, rank-gated. The high sect quest — passes
  // a multi-stage trial and rewards a bonus T3 inner art outright.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราหยินหยางสมดุล — unlock at rank 5, reward bonus T3 art
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

  // 5. FETCH — สมุนไพรศักดิ์สิทธิ์ (sacred herb)
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

  // 6. MORAL — ลูกศิษย์ทรยศ (traitor disciple — moral choice)
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

  // 7. VISIT — ตราประทับภูเขา (mountain seal pilgrimage)
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

  // ──────────────────────────────────────────────────────────────────────
  // หัวซาน — อาจารย์ใหญ่อี้ชิง (small sword sect — gold-fee admission)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration intro)
  // Huashan is the smallest of the three joinable schools. The master
  // accepts any sincere swordseeker — but the sect needs funds to keep
  // the forge running, so an entry fee of 200 gold is required. Bring
  // proof of wealth + a token of intent (a piece of iron the master
  // can rework into a practice blade).
  {
    id: "qst_huashan_disciple_intro",
    name: "ขอเข้าเป็นศิษย์หัวซาน",
    description: "อาจารย์อี้ชิงรับศิษย์ใหม่ทุกคนที่ใจรักดาบ — แต่หัวซานเป็นสำนักเล็ก ต้องการค่าเข้าสำนัก ๕๐๐ เหรียญทอง และเหล็กดิบ ๓ ก้อนสำหรับตีดาบฝึก",
    briefSummary: "จ่ายค่าเข้าสำนัก 500 ทอง + ส่งเหล็กดิบ 3 ก้อน เข้าเป็นศิษย์หัวซานขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_huashan_master_yiqing",
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
        description: "นำของและเงินค่าเข้าสำนักไปถวายอาจารย์อี้ชิง",
      },
    ],
    // Gold deduction happens at the complete-scene's choice (addGold:-200)
    // alongside takeItem for the iron ore, so the player only pays when
    // they actually accept the registration.
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 2 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 5 },
      { t: "joinSect", sectId: "huashan" },
      { t: "sectPoints", sectId: "huashan", amount: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำหัวซาน — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ลาดตระเวนเชิงเขา — sect points 50 (rank 9–7)
  {
    id: "qst_huashan_sect_patrol",
    name: "ลาดตระเวนเชิงเขาหัวซาน",
    description: "ภารกิจประจำของศิษย์หัวซาน — ลาดตระเวนเชิงเขาและกำราบโจรที่ตั้งฐานก่อกวน",
    briefSummary: "ปราบโจรเชิงเขา 2 คน · sect points +50",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานอาจารย์อี้ชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 50 },
    ],
  },

  // SECT-2 · ส่งเหล็กให้โรงตีดาบ — sect points 60 (rank 9–6)
  {
    id: "qst_huashan_sect_iron",
    name: "ส่งเหล็กให้โรงตีดาบ",
    description: "โรงตีดาบของหัวซานต้องการเหล็กดิบเพิ่มเพื่อหลอมดาบฝึกให้ศิษย์รุ่นใหม่ — เก็บเหล็กดิบมาให้ครบ",
    briefSummary: "ส่งเหล็กดิบ 5 ก้อน · sect points +60",
    type: "side",
    sectId: "huashan",
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: { t: "sectMember", sectId: "huashan" },
    stages: [
      {
        id: "gather_iron",
        description: "เก็บเหล็กดิบ 5 ก้อน",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้อาจารย์อี้ชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 3 },
      { t: "sectPoints", sectId: "huashan", amount: 60 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — high sect quest, rank-gated. The capstone art unlock.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราพลังเมฆม่วง — unlock at rank 5, reward bonus T4 art
  {
    id: "qst_huashan_art_purplecloud",
    name: "ตำราพลังเมฆม่วง",
    description: "อาจารย์อี้ชิงยอมเปิดตำราพลังเมฆม่วงให้ศิษย์ที่พิสูจน์ได้ทั้งดาบและจิตใจ — ผ่านการประลองกับโจรชั้นสูงและการเก็บเหล็กพิเศษ",
    briefSummary: "ฝึกพลังเมฆม่วง — รับ T4 art ลับของหัวซาน",
    type: "side",
    sectId: "huashan",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_huashan_master_yiqing",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "huashan" },
        { t: "sectRankAtLeast", sectId: "huashan", maxRank: 5 },
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
        description: "กลับไปรับตำราจากอาจารย์อี้ชิง",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t4_huashan_purple", level: 3 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "huashan", amount: 100 },
      { t: "npcRelationship", npcId: "sect_huashan_master_yiqing", amount: 10 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ฉวนเจิน — อาจารย์ใหญ่ฉงหยาง (ascetic Daoist sect — no entry fee)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration intro)
  // Same ascetic trial pattern as Wudang: gather mountain herbs, no
  // money required. Quanzhen Daoists value sincere effort over wealth.
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำฉวนเจิน — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ลาดตระเวนรอบจงหยาง — sect points 50 (rank 9–7)
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

  // SECT-2 · คัดลอกตำราเต๋า — sect points 60 (rank 9–6)
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — high sect quest, rank-gated. Awards bonus T3 art.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราหนึ่งพลังสุริยันต์ — unlock at rank 5, reward bonus T3 art
  {
    id: "qst_quanzhen_art_sun",
    name: "ตำราหนึ่งพลังสุริยันต์",
    description: "อาจารย์ฉงหยางยอมเปิดตำราหนึ่งพลังสุริยันต์ให้ศิษย์ที่จิตใจเที่ยงตรง — ผ่านการประลองและการนั่งสมาธิที่หน้าผา",
    briefSummary: "ฝึกหนึ่งพลังสุริยันต์ — รับ T3 art ของฉวนเจิน",
    type: "side",
    sectId: "quanzhen",
    isArtQuest: true,
    minSectRank: 5,
    giverNpcId: "sect_quanzhen_master_chongyang",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "quanzhen" },
        { t: "sectRankAtLeast", sectId: "quanzhen", maxRank: 5 },
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

  // ──────────────────────────────────────────────────────────────────────
  // ง้อไบ๊ — ท่านนิ้วห้วนจิงฉาน (Buddhist nun sect — women only)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration intro)
  // Same herb-gathering trial as Shaolin but the convent admits women
  // only. Reward chain seeds rank-9 membership + 20 sect points.
  {
    id: "qst_emei_disciple_intro",
    name: "ขอเข้าเป็นศิษย์ง้อไบ๊",
    description: "ท่านนิ้วจิงฉานรับเฉพาะศิษย์หญิงที่มีจิตใจเมตตา — เก็บสมุนไพรหลากชนิดมาให้ห้องยาของวัดเพื่อพิสูจน์ความเพียร · สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10",
    briefSummary: "ส่งสมุนไพรหายาก 10 + โสม 10 + เม็ดบัว 10 เข้าเป็นศิษย์ง้อไบ๊ขั้นที่ 9",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: {
      t: "and",
      all: [
        { t: "gender", equals: "female" },
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
        id: "return_to_abbess",
        description: "นำสมุนไพรกลับไปถวายท่านนิ้วจิงฉาน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 50 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 5 },
      { t: "joinSect", sectId: "emei" },
      { t: "sectPoints", sectId: "emei", amount: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำง้อไบ๊ — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ลาดตระเวนรอบวัด — sect points 50 (rank 9–7)
  {
    id: "qst_emei_sect_patrol",
    name: "ลาดตระเวนรอบวัดง้อไบ๊",
    description: "ภารกิจประจำของศิษย์ง้อไบ๊ — ลาดตระเวนรอบวัดและช่วยเหลือผู้ที่หลงเข้ามาในเขต",
    briefSummary: "ปราบโจรในเขตวัด 2 คน · sect points +50",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
    stages: [
      {
        id: "patrol",
        description: "ปราบโจรเร่ร่อน 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานท่านนิ้วจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 50 },
    ],
  },

  // SECT-2 · เก็บบัวหิมะ — sect points 60 (rank 9–6)
  {
    id: "qst_emei_sect_herb",
    name: "เก็บสมุนไพรเขาง้อไบ๊",
    description: "ห้องยาของง้อไบ๊ต้องการบัวหิมะและโสมเพื่อปรุงยารักษาศิษย์ที่บาดเจ็บ — เก็บมาให้ครบ",
    briefSummary: "ส่งโสม 5 + บัวหิมะ 1 · sect points +60",
    type: "side",
    sectId: "emei",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "sectMember", sectId: "emei" },
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
        description: "ส่งสมุนไพรให้ท่านนิ้วจิงฉาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 50 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 3 },
      { t: "sectPoints", sectId: "emei", amount: 60 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — high sect quest, rank-gated. Awards bonus T4 art.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราโพธิสัตว์ทรงพรต — unlock at rank 3, reward bonus T4 art
  {
    id: "qst_emei_art_bodhi",
    name: "ตำราโพธิสัตว์ทรงพรต",
    description: "ท่านนิ้วจิงฉานยอมเปิดตำราโพธิสัตว์ทรงพรตให้ศิษย์ที่ผ่านการพิสูจน์ทั้งดาบและจิตใจ — เป็นวิชาลับสุดยอดของง้อไบ๊",
    briefSummary: "ฝึกโพธิสัตว์ทรงพรต — รับ T4 art ลับของง้อไบ๊",
    type: "side",
    sectId: "emei",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "emei" },
        { t: "sectRankAtLeast", sectId: "emei", maxRank: 3 },
      ],
    },
    stages: [
      {
        id: "trial_kill",
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร (bandit_chief) 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_mind",
        description: "พิสูจน์จิตใจ — สะสมความถ่อมตนถึง 30",
        autoAdvance: { t: "trait", trait: "humility", min: 30 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากท่านนิ้วจิงฉาน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "t4_em_bodhi", level: 5 },
      { t: "trait", trait: "humility", amount: 10 },
      { t: "sectPoints", sectId: "emei", amount: 200 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // กู่มู่ — สุสานโบราณ (secret sect, defection from Quanzhen)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (secret-sect defection from Quanzhen)
  // Hidden gate. The mystery woman only offers this to a player who is
  // ALREADY a Quanzhen disciple AND has learned the t3_qz_sun art (so
  // they understand the sun path's limit and what lies beyond it). The
  // reward chain swaps sect: leaveSect quanzhen → joinSect gumu.
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

  // SECT-1 · เก็บของวัตถุดิบ — sect points 80 (sole sect quest)
  // Gumu has only one repeatable sect quest by design — the secret sect
  // doesn't need a quest grind to climb (only 3 ranks total, fixed costs).
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

  // ──────────────────────────────────────────────────────────────────────
  // ง้อไบ๊ — ท่านนิ้วห้วนจิงฉาน
  // ──────────────────────────────────────────────────────────────────────

  // 8. DEFEAT — สาวกถูกลักพาตัว (kidnapped novice)
  {
    id: "qst_emei_kidnapped_novice",
    name: "สาวกถูกลักพาตัว",
    description: "สาวกง้อไบ๊คนหนึ่งถูกโจรจับตัวไปเรียกค่าไถ่ ท่านนิ้วขอให้ช่วยนำสาวกกลับมาโดยสวัสดิภาพ",
    briefSummary: "ช่วยสาวกง้อไบ๊จากมือโจร",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    stages: [
      {
        id: "locate_hideout",
        description: "หาที่ซ่อนของโจร",
      },
      {
        id: "rescue",
        description: "ปราบโจรและช่วยสาวกออกมา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "escort_back",
        description: "พาสาวกกลับวัดง้อไบ๊",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 15 },
    ],
  },

  // 9. FETCH — ยาต้านพิษ (poison antidote)
  {
    id: "qst_emei_poison_antidote",
    name: "ยาต้านพิษอสุรา",
    description: "สาวกง้อไบ๊ถูกวางยาพิษจากคนร้าย ท่านนิ้วต้องการพิษตะขาบเพื่อสังเคราะห์ยาต้านพิษ",
    briefSummary: "หาพิษตะขาบมาให้ท่านนิ้วแห่งง้อไบ๊",
    type: "side",
    giverNpcId: "sect_emei_abbess_jingchan",
    prereqs: { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "done" },
    stages: [
      {
        id: "find_venom",
        description: "หาพิษตะขาบ 1 หน่วย",
        autoAdvance: { t: "hasItem", itemId: "centipede_venom", count: 1 },
      },
      {
        id: "deliver_venom",
        description: "ส่งพิษตะขาบให้ท่านนิ้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "sect_emei_abbess_jingchan", amount: 10 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // วิลล่ายาวัง — หมอเสินหนง
  // ──────────────────────────────────────────────────────────────────────

  // 10. FETCH — ส่วนผสมหายาก (rare ingredient)
  {
    id: "qst_yaowang_rare_ingredient",
    name: "ส่วนผสมลับของตำรับยา",
    description: "หมอเสินหนงต้องการโสมโบราณ หยก และงาช้างเพื่อปรุงยาตำรับพิเศษ",
    briefSummary: "รวบรวมส่วนผสมหายากสำหรับหมอเสินหนง",
    type: "side",
    giverNpcId: "villa_yaowang_doctor_shennong",
    stages: [
      {
        id: "gather_ginseng",
        description: "หาโสม 2 หน่วย",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 2 },
      },
      {
        id: "gather_jade",
        description: "หาหยกล้ำค่า 1 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 1 },
      },
      {
        id: "deliver_all",
        description: "ส่งส่วนผสมทั้งหมดให้หมอเสินหนง",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "item", itemId: "snow_lotus", count: 1 },
      { t: "wExp", amount: 100 },
      { t: "npcRelationship", npcId: "villa_yaowang_doctor_shennong", amount: 20 },
    ],
  },

  // 11. VISIT — หมู่บ้านระบาด (plague village)
  {
    id: "qst_yaowang_plague_village",
    name: "หมู่บ้านระบาด",
    description: "หมู่บ้านแห่งหนึ่งกำลังป่วยเป็นโรคระบาดลึกลับ หมอเสินหนงขอให้ไปสำรวจและเก็บตัวอย่าง",
    briefSummary: "ไปสำรวจหมู่บ้านที่เกิดโรคระบาดและนำตัวอย่างกลับมา",
    type: "side",
    giverNpcId: "villa_yaowang_doctor_shennong",
    prereqs: { t: "questStatus", questId: "qst_yaowang_rare_ingredient", status: "done" },
    stages: [
      {
        id: "visit_village",
        description: "เดินทางไปสำรวจหมู่บ้านที่ป่วย",
        autoAdvance: { t: "flag", flag: "visited_plague_village" },
      },
      {
        id: "collect_sample",
        description: "เก็บตัวอย่างสมุนไพรและรายงานอาการ",
      },
      {
        id: "return_report",
        description: "กลับมารายงานและส่งตัวอย่างให้หมอ",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 90 },
      { t: "trait", trait: "good", amount: 6 },
      { t: "npcRelationship", npcId: "villa_yaowang_doctor_shennong", amount: 15 },
    ],
  },

  // 12. INVESTIGATION — พิษปริศนา (venom antidote investigation)
  {
    id: "qst_yaowang_venom_antidote",
    name: "พิษสังหารอันลึกลับ",
    description: "มีผู้ถูกลอบวางยาพิษชนิดลึกลับในยุทธภพ หมอเสินหนงขอให้ช่วยสืบหาแหล่งที่มาของพิษ",
    briefSummary: "สืบสวนพิษลึกลับที่คร่าชีวิตนักรบ",
    type: "side",
    giverNpcId: "villa_yaowang_doctor_shennong",
    stages: [
      {
        id: "investigate_scene",
        description: "สืบสวนสถานที่เกิดเหตุ",
      },
      {
        id: "find_clues",
        description: "เก็บหลักฐาน: หาพิษงู 2 หน่วย",
        autoAdvance: { t: "hasItem", itemId: "viper_venom", count: 2 },
      },
      {
        id: "trace_source",
        description: "ติดตามแหล่งพิษและเผชิญหน้ากับผู้วางยา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "poison_practitioner", count: 1 },
      },
      {
        id: "report_back",
        description: "รายงานผลการสืบสวนให้หมอเสินหนง",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "wExp", amount: 120 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "villa_yaowang_doctor_shennong", amount: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // วัดตาหลุน — พระกงซิน
  // ──────────────────────────────────────────────────────────────────────

  // 13. INVESTIGATION — พระธาตุสูญหาย (stolen relic)
  {
    id: "qst_dalun_stolen_relic",
    name: "พระธาตุวัดตาหลุน",
    description: "พระธาตุโบราณแห่งวัดตาหลุนหายไปในคืนพายุ พระกงซินสงสัยว่ามีคนในวัดเกี่ยวข้อง",
    briefSummary: "สืบหาพระธาตุที่หายจากวัดตาหลุน",
    type: "side",
    giverNpcId: "temple_dalun_monk_kongxin",
    stages: [
      {
        id: "search_temple",
        description: "ค้นหาร่องรอยในวัด",
        autoAdvance: { t: "visitedLocation", locationId: "temple_dalun" },
      },
      {
        id: "question_monks",
        description: "สัมภาษณ์พระในวัดเพื่อหาเบาะแส",
      },
      {
        id: "find_culprit",
        description: "เผชิญหน้ากับผู้ต้องสงสัย",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "recover_relic",
        description: "นำพระธาตุกลับคืนวัด",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "temple_dalun_monk_kongxin", amount: 15 },
    ],
  },

  // 14. VISIT — ภารกิจแสวงบุญ (pilgrim mission)
  {
    id: "qst_dalun_pilgrim_mission",
    name: "ทางแสวงบุญแห่งสี่วัด",
    description: "พระกงซินขอให้ไปสวดมนต์ที่วัดเทียนหนิงและกลับมารายงาน เพื่อเป็นส่วนหนึ่งของพิธีกรรมโบราณ",
    briefSummary: "เดินทางไปวัดเทียนหนิงแล้วกลับมารายงาน",
    type: "side",
    giverNpcId: "temple_dalun_monk_kongxin",
    prereqs: { t: "questStatus", questId: "qst_dalun_stolen_relic", status: "done" },
    stages: [
      {
        id: "visit_tianning",
        description: "เดินทางไปยังวัดเทียนหนิง",
        autoAdvance: { t: "visitedLocation", locationId: "temple_tianning" },
      },
      {
        id: "return_report",
        description: "กลับมารายงานพระกงซิน",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: "temple_dalun_monk_kongxin", amount: 12 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // คฤหาสน์เหยินซี — เจ้าบ้านเหยินเฟิง
  // ──────────────────────────────────────────────────────────────────────

  // 15. DEFEAT — ตระกูลคู่อริ (rival clan)
  {
    id: "qst_yanzi_rival_clan",
    name: "ตระกูลอริอาฆาต",
    description: "ตระกูลหลงส่งนักรบมาคุกคามคฤหาสน์เหยินซี เจ้าของบ้านขอให้ขับไล่พวกเขา",
    briefSummary: "ขับไล่นักรบตระกูลหลงออกจากคฤหาสน์เหยินซี",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    stages: [
      {
        id: "patrol",
        description: "ลาดตระเวนบริเวณคฤหาสน์",
        autoAdvance: { t: "visitedLocation", locationId: "villa_yanzi" },
      },
      {
        id: "defeat_raiders",
        description: "ปราบหัวหน้านักรบตระกูลหลง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_elder", count: 1 },
      },
      {
        id: "report",
        description: "รายงานเจ้าบ้านว่าเหตุการณ์สงบแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "npcRelationship", npcId: "villa_yanzi_lord_yanfeng", amount: 15 },
    ],
  },

  // 16. DELIVER — คุ้มกันเส้นทาง (bodyguard escort)
  {
    id: "qst_yanzi_bodyguard_escort",
    name: "คุ้มกันแห่งพ่อค้า",
    description: "เจ้าบ้านส่งพ่อค้าไปค้าขาย ขอให้คุ้มกันพ่อค้าถึงเมืองหลวงและกลับมา",
    briefSummary: "คุ้มกันพ่อค้าของเจ้าบ้านเหยินเฟิงถึงจุดหมาย",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    stages: [
      {
        id: "depart",
        description: "รับภารกิจคุ้มกันและออกเดินทาง",
      },
      {
        id: "fend_ambush",
        description: "ขับไล่โจรที่ดักซุ่มโจมตี",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 2 },
      },
      {
        id: "deliver_safely",
        description: "ส่งพ่อค้าถึงจุดหมายโดยสวัสดิภาพ",
      },
      {
        id: "return_report",
        description: "กลับรายงานเจ้าบ้านเหยินเฟิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "villa_yanzi_lord_yanfeng", amount: 10 },
    ],
  },

  // 17. INVESTIGATION — มรดกสูญหาย (stolen heirloom investigation)
  {
    id: "qst_yanzi_stolen_heirloom",
    name: "มรดกตกทอดสูญหาย",
    description: "ดาบมรดกของตระกูลเหยินถูกขโมยออกไปในคืนงานเลี้ยง ผู้ต้องสงสัยมีสามคน",
    briefSummary: "สืบหาดาบมรดกที่ถูกขโมยจากคฤหาสน์เหยินซี",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    prereqs: { t: "questStatus", questId: "qst_yanzi_rival_clan", status: "done" },
    stages: [
      {
        id: "investigate",
        description: "สืบสวนร่องรอยในคฤหาสน์",
      },
      {
        id: "question_suspects",
        description: "สอบสวนผู้ต้องสงสัยสามคน",
      },
      {
        id: "confront_thief",
        description: "เผชิญหน้ากับผู้ขโมย",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "recover_sword",
        description: "นำดาบมรดกกลับคืนเจ้าบ้าน",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "wExp", amount: 110 },
      { t: "trait", trait: "fame", amount: 4 },
      { t: "npcRelationship", npcId: "villa_yanzi_lord_yanfeng", amount: 20 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // พรรคสว่างมืด — ผู้อาวุโสจูอิง
  // ──────────────────────────────────────────────────────────────────────

  // 18. DELIVER — ภารกิจสายลับ (spy mission — deliver)
  {
    id: "qst_ming_spy_mission",
    name: "จดหมายลับแห่งพรรค",
    description: "ผู้อาวุโสจูอิงขอให้ส่งจดหมายลับไปยังสายลับในพระราชวังจงหยาง โดยไม่ให้ใครรู้",
    briefSummary: "ส่งจดหมายลับให้สายลับในพระราชวัง",
    type: "side",
    giverNpcId: "sect_ming_elder_zhuying",
    stages: [
      {
        id: "receive_letter",
        description: "รับจดหมายลับจากผู้อาวุโส",
      },
      {
        id: "travel_palace",
        description: "เดินทางไปยังพระราชวังจงหยาง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_zhongyang" },
      },
      {
        id: "deliver_letter",
        description: "ส่งจดหมายให้สายลับอย่างลับ ๆ",
      },
      {
        id: "return_confirm",
        description: "กลับรายงานผู้อาวุโส",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "sect_ming_elder_zhuying", amount: 12 },
    ],
  },

  // 19. MORAL — ผู้แปรพักตร์ (defector moral choice)
  {
    id: "qst_ming_defector_choice",
    name: "ผู้แปรพักตร์",
    description: "สมาชิกพรรคสว่างมืดต้องการออกจากพรรค ผู้อาวุโสให้เจ้าตัดสิน — ปล่อยไปหรือนำตัวกลับมา?",
    briefSummary: "ตัดสินชะตากรรมของผู้ที่ต้องการออกจากพรรคสว่างมืด",
    type: "side",
    giverNpcId: "sect_ming_elder_zhuying",
    prereqs: { t: "questStatus", questId: "qst_ming_spy_mission", status: "done" },
    stages: [
      {
        id: "find_defector",
        description: "ตามหาผู้แปรพักตร์",
      },
      {
        id: "hear_story",
        description: "ฟังเรื่องราวของเขา",
      },
      {
        id: "decide",
        description: "ตัดสินใจ: ปล่อยไปหรือนำตัวกลับ",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_ming_elder_zhuying", amount: 10 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // พรรคยาจก — หัวหน้าหงเทียน (big sect, T4 chief — beggars line)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (disciple registration)
  // No money, no gender — only requirement is to have walked the road.
  // Player must have learned the begging life skill to lv 2 first
  // (proves they understand the way of the road). Begging trainable at
  // any city / village / sect with the begging gate flag set.
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำพรรคยาจก — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ลาดตระเวนตรอกเมือง — sect points 50
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

  // SECT-2 · แจกอาหารคนยาก — sect points 60
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

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — high sect quest, rank-gated. Awards bonus T4 art.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราหมื่นมวลชน — unlock at rank 3, reward bonus T4 art
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

  // ──────────────────────────────────────────────────────────────────────
  // พรรคยาจก — original lore quests (still authored by chief Hongtian)
  // ──────────────────────────────────────────────────────────────────────

  // 20. INVESTIGATION — รายงานสายลับ (spy report investigation)
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

  // 21. DELIVER — เด็กหิวโหย (hungry children)
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

  // ──────────────────────────────────────────────────────────────────────
  // วังจงหยาง — ทูตหลิวอิง
  // ──────────────────────────────────────────────────────────────────────

  // 22. DELIVER — จดหมายจักรพรรดิ (imperial letter)
  {
    id: "qst_zhongyang_imperial_letter",
    name: "สาส์นพระราชา",
    description: "ทูตหลิวอิงได้รับสาส์นเร่งด่วนจากพระราชา ขอให้ส่งสาส์นไปยังอาจารย์ชิงซวี่แห่งอู่ตัง",
    briefSummary: "ส่งสาส์นพระราชาจากวังจงหยางถึงอาจารย์อู่ตัง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    stages: [
      {
        id: "receive_letter",
        description: "รับสาส์นจากทูตหลิวอิง",
      },
      {
        id: "travel_wudang",
        description: "เดินทางไปยังสำนักอู่ตัง",
        autoAdvance: { t: "visitedLocation", locationId: "sect_wudang" },
      },
      {
        id: "deliver_letter",
        description: "ส่งสาส์นให้อาจารย์ชิงซวี่",
      },
      {
        id: "return_confirm",
        description: "กลับรายงานทูตหลิวอิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "palace_zhongyang_envoy_liuying", amount: 12 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 8 },
    ],
  },

  // 23. MORAL — สงครามของขุนนาง (noble intrigue — moral)
  {
    id: "qst_zhongyang_noble_intrigue",
    name: "วังวนขุนนาง",
    description: "ทูตหลิวอิงพบว่ามีขุนนางสองฝ่ายกำลังแย่งชิงตำแหน่ง ขอให้ไปสอดแนมและรายงานว่าฝ่ายไหนโกง",
    briefSummary: "สืบข้อมูลเรื่องสงครามระหว่างขุนนางในวัง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    prereqs: { t: "questStatus", questId: "qst_zhongyang_imperial_letter", status: "done" },
    stages: [
      {
        id: "spy_faction_a",
        description: "สอดแนมฝ่ายขุนนางฝั่งแรก",
      },
      {
        id: "spy_faction_b",
        description: "สอดแนมฝ่ายขุนนางฝั่งที่สอง",
      },
      {
        id: "discover_truth",
        description: "ค้นพบความจริง",
      },
      {
        id: "report_with_choice",
        description: "รายงานทูต — จะพูดความจริงหรือบิดเบือน?",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 90 },
      { t: "npcRelationship", npcId: "palace_zhongyang_envoy_liuying", amount: 15 },
    ],
  },

  // 24. DEFEAT — รักษาความปลอดภัยพิธีเปิด (palace ceremony — defeat)
  {
    id: "qst_zhongyang_ceremony_guard",
    name: "คุ้มกันพิธีพระราชา",
    description: "มีข่าวว่าจะมีความพยายามลอบสังหารระหว่างพิธีพิเศษที่วังจงหยาง ทูตขอให้คอยเฝ้าระวัง",
    briefSummary: "คุ้มกันพิธีสำคัญในวังจงหยาง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    prereqs: { t: "questStatus", questId: "qst_zhongyang_noble_intrigue", status: "done" },
    stages: [
      {
        id: "station_guard",
        description: "รับตำแหน่งยามและเฝ้าระวัง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_zhongyang" },
      },
      {
        id: "repel_assassin",
        description: "ขับไล่นักฆ่าที่บุกรุกเข้ามา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "report_success",
        description: "รายงานผลการคุ้มกัน",
      },
    ],
    rewards: [
      { t: "gold", amount: 900 },
      { t: "wExp", amount: 130 },
      { t: "trait", trait: "fame", amount: 8 },
      { t: "npcRelationship", npcId: "palace_zhongyang_envoy_liuying", amount: 20 },
    ],
  },

  // 25. INVESTIGATION — ปริศนาหินลึก (deep relic mystery — final chain)
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

  // ──────────────────────────────────────────────────────────────────────
  // องครักษ์เสื้อแพร — ผู้บัญชาการจ้าวฝู่ (imperial guard sect — kidnap intro)
  // ──────────────────────────────────────────────────────────────────────

  // 0. INTRO — ขอเข้าเป็นศิษย์ (kidnap-the-envoy intro)
  // The commander assigns a kidnap mission as the loyalty test.
  // Target: palace_zhongyang_envoy_liuying — a noble envoy whose
  // loyalty is in question. The bad-action mechanic (`attemptKidnap`)
  // already handles the apprehension; the quest just gates on the
  // resulting `kidnappedNpc` flag.
  {
    id: "qst_jinyiwei_disciple_intro",
    name: "ขอเข้าเป็นศิษย์องครักษ์",
    description: "ผู้บัญชาการจ้าวฝู่กำลังจับตามองทูตหลิวอิงในวังจงหยาง — เขาสงสัยว่าทูตคนนี้ขายความลับให้ฝ่ายตรงข้าม จงลักพาตัวเขามาเพื่อสอบสวน",
    briefSummary: "ลักพาตัวทูตหลิวอิงเพื่อพิสูจน์ความจงรักภักดี",
    type: "side",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "trait", trait: "evil", max: 30 },
        { t: "not", of: { t: "anySectMember" } },
      ],
    },
    stages: [
      {
        id: "kidnap_envoy",
        description: "ลักพาตัวทูตหลิวอิงที่วังจงหยาง",
        autoAdvance: { t: "kidnappedNpc", npcId: "palace_zhongyang_envoy_liuying" },
      },
      {
        id: "report_back",
        description: "กลับไปรายงานผู้บัญชาการจ้าวฝู่",
      },
    ],
    rewards: [
      { t: "wExp", amount: 80 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 10 },
      { t: "joinSect", sectId: "jinyiwei" },
      { t: "sectPoints", sectId: "jinyiwei", amount: 30 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจประจำองครักษ์ — ทำซ้ำได้ทุก 30 วัน
  // ──────────────────────────────────────────────────────────────────────

  // SECT-1 · ปราบโจรในเขตหลวง — sect points 50
  {
    id: "qst_jinyiwei_sect_patrol",
    name: "ปราบโจรในเขตหลวง",
    description: "ภารกิจประจำขององครักษ์ — กำราบโจรที่ก่อความวุ่นวายในเขตหลวง",
    briefSummary: "ปราบหัวหน้าโจร 2 คน · sect points +50",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "patrol",
        description: "ปราบหัวหน้าโจร (bandit_chief) 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "report",
        description: "กลับไปรายงานผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 70 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 50 },
    ],
  },

  // SECT-2 · ส่งเหล็กให้โรงตีอาวุธ — sect points 60
  {
    id: "qst_jinyiwei_sect_arms",
    name: "ส่งเหล็กให้โรงตีอาวุธ",
    description: "โรงตีอาวุธของกรมราชต้องการเหล็กพิเศษและเหล็กดิบเพิ่มเพื่อหลอมดาบโซ่ใหม่ — เก็บมาให้ครบ",
    briefSummary: "ส่งเหล็กดิบ 6 + เหล็กแท่ง 2 · sect points +60",
    type: "side",
    sectId: "jinyiwei",
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: { t: "sectMember", sectId: "jinyiwei" },
    stages: [
      {
        id: "gather",
        description: "เก็บเหล็กดิบ 6 ก้อน + เหล็กแท่ง 2 ก้อน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "iron_ore", count: 6 },
            { t: "hasItem", itemId: "iron_ingot", count: 2 },
          ],
        },
      },
      {
        id: "deliver",
        description: "ส่งเหล็กให้ผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 3 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 60 },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────
  // ภารกิจวิชาในกาย — high sect quest, rank-gated. Awards bonus T4 art.
  // ──────────────────────────────────────────────────────────────────────

  // ART-1 · ตำราพลังประหารเทพ — unlock at rank 3, reward bonus T4 art
  {
    id: "qst_jinyiwei_art_godslayer",
    name: "ตำราพลังประหารเทพ",
    description: "ผู้บัญชาการจ้าวฝู่ยอมเปิดตำราพลังประหารเทพให้ศิษย์ที่พิสูจน์ทั้งฝีมือและความภักดี — เป็นวิชาลับสุดยอดของกรมราช",
    briefSummary: "ฝึกพลังประหารเทพ — รับ T4 art ลับขององครักษ์เสื้อแพร",
    type: "side",
    sectId: "jinyiwei",
    isArtQuest: true,
    minSectRank: 3,
    giverNpcId: "sect_jinyiwei_leader_zhao",
    prereqs: {
      t: "and",
      all: [
        { t: "sectMember", sectId: "jinyiwei" },
        { t: "sectRankAtLeast", sectId: "jinyiwei", maxRank: 3 },
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
        description: "พิสูจน์ความภักดี — สะสมความหยิ่ง (arrogance) ถึง 20",
        autoAdvance: { t: "trait", trait: "arrogance", min: 20 },
      },
      {
        id: "return_art",
        description: "กลับไปรับตำราจากผู้บัญชาการ",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "learnArt", artId: "t4_jy_godslayer", level: 5 },
      { t: "trait", trait: "arrogance", amount: 5 },
      { t: "sectPoints", sectId: "jinyiwei", amount: 200 },
      { t: "npcRelationship", npcId: "sect_jinyiwei_leader_zhao", amount: 20 },
    ],
  },
];
