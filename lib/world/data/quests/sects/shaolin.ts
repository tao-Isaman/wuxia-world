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
    briefSummary: "ปราบโจรในเขตวัด 2 คน · แต้มสำนัก +50",
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
        description: "กลับไปรายงานเจ้าอาวาสฮุยหยวน",
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
    briefSummary: "ส่งสมุนไพรหายาก 5 ชิ้น · แต้มสำนัก +60",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "gather_herbs",
        description: "เก็บสมุนไพรหายาก 5 ชิ้น",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 5 },
      },
      {
        id: "deliver",
        description: "ส่งสมุนไพรให้เจ้าอาวาสฮุยหยวน",
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
    name: "ทานแก่ผู้ตกยาก",
    description: "ปฏิบัติธรรมด้วยการให้ทาน — พรานป่าและคนตัดฟืนที่หลบหนาวในถ้ำลึกของซงซานกำลังอดอยาก พระฆ่าสัตว์ไม่ได้ แต่ศิษย์ฆราวาสหาเนื้อย่างไปให้ได้ เจ้าอาวาสฮุยหยวนว่าการให้โดยไม่หวังสิ่งใดคือการขัดเกลาใจให้ถ่อมตน",
    briefSummary: "หาเนื้อย่าง 3 ชิ้นไปเป็นทาน · แต้มสำนัก +80",
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
        description: "หาเนื้อย่าง 3 ชิ้น (ซื้อหรือย่างเองก็ได้)",
        autoAdvance: { t: "hasItem", itemId: "cooked_meat", count: 3 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าอาวาสฮุยหยวน",
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
    name: "บททดสอบก่อนสืบทอด: วิชาลึกลับ",
    description: "เจ้าอาวาสจะทดสอบก่อนเปิดตำราวิชาลึกลับให้ศิษย์ผู้มีจิตใจสูงสุดได้ฝึก — ปราบหัวหน้าโจร 2 คน และเก็บสมุนไพรหายาก 8 ชิ้นถวายโรงยาของวัด (ผ่านแล้วจึงรับภารกิจสืบทอดวิชาลึกลับได้)",
    briefSummary: "บททดสอบ — เปิดทางสู่การสืบทอดวิชาลึกลับ",
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
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร 2 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 2 },
      },
      {
        id: "trial_meditate",
        description: "พิสูจน์ความเพียร — เก็บสมุนไพรหายาก 8 ชิ้นถวายโรงยาของวัด",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 8 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อเจ้าอาวาสฮุยหยวน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "shaolin", amount: 100 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 10 },
    ],
  },

  {
    id: "qst_shaolin_art_legendary",
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "เจ้าอาวาสฮุยหยวนเก็บตำนานสุดยอดของเส้าหลินไว้ให้ศิษย์ที่ไว้ใจที่สุดเท่านั้น — ปราบหัวหน้าโจร 3 คนเพื่อพิสูจน์กาย และสะสมความถ่อมตนให้ถึง 30 เพื่อพิสูจน์ใจ ผ่านแล้วท่านจะเล่าตำนานที่นำไปสู่วิชานั้น (ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
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
        description: "พิสูจน์ร่างกาย — ปราบหัวหน้าโจร 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_mind",
        description: "พิสูจน์จิตใจ — สะสมความถ่อมตนถึง 30",
        autoAdvance: { t: "trait", trait: "humility", min: 30 },
      },
      {
        id: "return_legend",
        description: "กลับไปรายงานผลต่อเจ้าอาวาสฮุยหยวน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "humility", amount: 10 },
      { t: "sectPoints", sectId: "shaolin", amount: 200 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 20 },
    ],
  },

  {
    id: "qst_shaolin_relic_theft",
    name: "พระธาตุสูญหาย",
    description: "พระธาตุสำคัญของวัดเส้าหลินถูกขโมยไปเมื่อคืน เจ้าอาวาสฮุยหยวนสงสัยว่าเป็นฝีมือโจรปีนขื่อ — สืบร่องรอยในวัด ตามโจรไปทางซงซาน แล้วชิงพระธาตุคืนมา",
    briefSummary: "ค้นหาและนำพระธาตุกลับคืนให้เจ้าอาวาสเส้าหลิน",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    stages: [
      {
        id: "investigate",
        description: "สืบหาร่องรอยพระธาตุที่วัดเส้าหลิน",
        autoAdvance: { t: "visitedLocation", locationId: "sect_shaolin" },
      },
      {
        id: "track_thief",
        description: "ตามรอยโจรที่หนีขึ้นเนินเขาซงซาน",
        objective: {
          spots: [
            { locationId: "sect_songshan", label: "ตามรอยโจรบนเนินซงซาน", text: "กิ่งไม้หักและรอยเท้าบอกว่าโจรหนีไปรวมกับหัวหน้าโจรแถบภูเขา" },
          ],
        },
      },
      {
        id: "defeat_thief",
        description: "ปราบหัวหน้าโจรที่ขโมยพระธาตุ แล้วชิงคืนมา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "return_relic",
        description: "ส่งพระธาตุคืนแก่เจ้าอาวาสฮุยหยวน",
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
    description: "ลูกศิษย์เส้าหลินคนหนึ่งหนีออกจากวัด มีคนเห็นเขาลักขโมยและก่อเรื่องในนครหลวง เจ้าอาวาสฮุยหยวนขอให้ไปตามตัวกลับมา — ถ้าเขาไม่ยอม ก็ต้องเอาชนะให้ได้ก่อน",
    briefSummary: "ตามหาและนำลูกศิษย์เส้าหลินที่หลงทางกลับมาสำนัก",
    type: "side",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "questStatus", questId: "qst_shaolin_relic_theft", status: "done" },
    stages: [
      {
        id: "search_city",
        description: "สอบถามหาลูกศิษย์ที่หนีไปในนครหลวง",
        objective: {
          spots: [
            { locationId: "city_capital", label: "สอบถามหาลูกศิษย์ในเมืองหลวง", text: "ชาวบ้านเห็นภิกษุหนุ่มก่อเรื่องแล้วหนีออกนอกเมือง — เขายังท่องไปตามทาง" },
          ],
        },
      },
      {
        id: "confront",
        description: "เผชิญหน้ากับลูกศิษย์ที่หลงทาง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_disciple", count: 1 },
      },
      {
        id: "bring_back",
        description: "พาลูกศิษย์กลับวัดเส้าหลิน ไปหาเจ้าอาวาสฮุยหยวน",
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
        description: "เข้ารับการทดสอบจากเจ้าอาวาสฮุยหยวน",
      },
      {
        id: "complete_trial",
        description: "ผ่านการทดสอบ",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "wExp", amount: 150 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 20 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "sectPoints", sectId: "shaolin", amount: 120 },
    ],
  },

  {
    id: "qst_shaolin_iron_training",
    name: "วัตถุดิบฝึกเหล็ก",
    description: "อาจารย์ฝาหมิงแห่งวัดเส้าหลินฝึกวิชากระดิ่งทองด้วยการให้ศิษย์ตีกายด้วยเหล็ก — ท่านต้องการแร่เทพ 1 ก้อนมาหลอมเป็นตะบองฝึก",
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
      { t: "gold", amount: 1300 },
      { t: "wExp", amount: 100 },
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
      { t: "gold", amount: 2300 },
      { t: "wExp", amount: 200 },
      { t: "trait", trait: "fame", amount: 10 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "sect_shaolin_abbot_huiyuan", amount: 25 },
      { t: "npcRelationship", npcId: "sect_wudang_master_qingxu", amount: 25 },
      { t: "sectPoints", sectId: "shaolin", amount: 200 },
    ],
  },

  {
    id: "qst_shaolin_redemption",
    name: "ไถ่บาปต่อเส้าหลิน",
    description: "เจ้าเคยทรยศเส้าหลิน สำนักจึงส่งนักล่ามาตามเจ้า — แต่เจ้าอาวาสฮุยหยวนยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำโสม 5 รากมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของเส้าหลินที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อเส้าหลิน — ปราบหัวหน้าโจร 5 + ถวายโสม 5 ราก",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectStatus", sectId: "shaolin", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำโสม 5 รากมาถวาย", autoAdvance: { t: "hasItem", itemId: "ginseng", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อเจ้าอาวาสฮุยหยวน" },
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
    briefSummary: "ปราบโจร 3 คน + นำข้าวหมูแดง 5 จานแจกชาวบ้าน · แต้มสำนัก +65",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "fight_bandits",
        description: "ปราบโจร 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 },
      },
      {
        id: "gather_food",
        description: "หาข้าวหมูแดง 5 จานแจกชาวบ้าน",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 5 },
      },
      {
        id: "report",
        description: "กลับไปรายงานเจ้าอาวาสฮุยหยวน",
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
    name: "กระดาษสาคัดลอกพระสูตร",
    description: "หอพระสูตรของวัดเส้าหลินขาดกระดาษสาสำหรับคัดลอกพระไตรปิฎก เจ้าอาวาสฮุยหยวนขอให้ศิษย์ไปหากระดาษสา 6 แผ่นจากร้านในเมืองใกล้เคียง",
    briefSummary: "ส่งกระดาษสา 6 แผ่นเข้าหอพระสูตร · แต้มสำนัก +50",
    type: "side",
    sectId: "shaolin",
    giverNpcId: "sect_shaolin_abbot_huiyuan",
    prereqs: { t: "sectMember", sectId: "shaolin" },
    stages: [
      {
        id: "main",
        description: "หากระดาษสา 6 แผ่น",
        autoAdvance: { t: "hasItem", itemId: "paper", count: 6 },
      },
      {
        id: "report",
        description: "ส่งกระดาษสาให้เจ้าอาวาสฮุยหยวน",
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
