import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS_BEGGARS: readonly QuestDef[] = [
  {
    id: "qst_beggars_disciple_intro",
    name: "ขอเข้าเป็นศิษย์พรรคยาจก",
    description: "หัวหน้าหงเทียนรับเฉพาะผู้ที่เข้าใจวิถียาจก — ผู้ที่ฝึกอาชีพขอทานถึงขั้น 2 แล้วเท่านั้น — นำข้าวหมูแดง 5 จานกับเงิน 100 ทองที่หาได้จากท้องถนนมาแสดงให้ท่านเห็น",
    briefSummary: "ส่งข้าวหมูแดง 5 + เงิน 100 ทอง · เข้าเป็นศิษย์พรรคยาจกขั้นที่ 9",
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
        description: "รวบรวมข้าวหมูแดง 5 + เงิน 100 ทอง จากการขอทาน",
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
    briefSummary: "ปราบโจร 2 คน · แต้มสำนัก +50",
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
    description: "พรรคยาจกช่วยเหลือคนยากไร้เป็นกิจวัตร — เก็บข้าวหมูแดงมาแจกให้ผู้หิวโหยในตรอกเมือง",
    briefSummary: "ส่งข้าวหมูแดง 8 · แต้มสำนัก +60",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "gather",
        description: "เก็บข้าวหมูแดง 8 จาน",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 8 },
      },
      {
        id: "deliver",
        description: "ส่งข้าวหมูแดงให้หัวหน้าหงเทียนนำไปแจก",
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
    name: "บททดสอบก่อนตำนาน: วิชาลึกลับ",
    description: "หัวหน้าหงเทียนจะเล่าตำนานของวิชาลึกลับให้ศิษย์ที่พิสูจน์ได้ทั้งฝีมือและน้ำใจ — ปราบหัวหน้าโจร 3 คน และเก็บข้าวหมูแดง 12 จานไว้แจกเลี้ยง (เมื่อผ่าน ดูแท็บตำนานในบันทึกภารกิจ)",
    briefSummary: "บททดสอบ — เปิดทางสู่ตำนานของวิชาลึกลับ",
    type: "side",
    sectId: "beggars",
    isArtQuest: true,
    minSectRank: 2,
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
        description: "พิสูจน์พลัง — ปราบหัวหน้าโจร 3 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 3 },
      },
      {
        id: "trial_alms",
        description: "พิสูจน์น้ำใจ — เก็บข้าวหมูแดง 12 จานสำหรับแจกเลี้ยง",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 12 },
      },
      {
        id: "return_art",
        description: "กลับไปรายงานผลต่อหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "wExp", amount: 400 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "sectPoints", sectId: "beggars", amount: 200 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 20 },
    ],
  },

  {
    id: "qst_beggars_spy_report",
    name: "รายงานสายลับยุทธภพ",
    description: "หัวหน้าหงเทียนได้ข่าวว่ามีองค์กรลึกลับเคลื่อนไหวในยุทธภพ ขอให้ไปสืบข่าวที่นครหลวง หยางโจว และจินหลิง แล้วจับตัวสายลับของมันมาสอบสวน",
    briefSummary: "สืบหาข้อมูลองค์กรลึกลับให้หัวหน้าพรรคยาจก",
    type: "side",
    giverNpcId: "sect_beggars_chief_hongtian",
    stages: [
      {
        id: "visit_three_places",
        description: "สืบข่าวสามแห่ง: โรงน้ำชาในนครหลวง ท่าเรือหยางโจว และตลาดจินหลิง",
        objective: {
          spots: [
            { locationId: "city_capital", label: "สืบข่าวในโรงน้ำชาเมืองหลวง", text: "คนในโรงน้ำชาพูดถึงนักฆ่าชุดดำที่ถามหาเส้นทางลับ" },
            { locationId: "city_yangzhou", label: "สืบข่าวที่ท่าเรือหยางโจว", text: "คนแบกของเห็นเรือไร้ธงขนหีบลับขึ้นฝั่งตอนดึก" },
            { locationId: "city_jinling", label: "สืบข่าวในตลาดจินหลิง", text: "พ่อค้าเล่าว่ามีคนจ่ายทองซื้อแผนที่สำนักต่าง ๆ" },
          ],
        },
      },
      {
        id: "confront_spy",
        description: "ตามจับนักฆ่าเงาที่เป็นสายลับขององค์กร แล้วเอาชนะให้ได้",
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
    description: "เด็กกำพร้าในพรรคยาจกขาดแคลนอาหาร หัวหน้าหงเทียนขอเนื้อสด 3 ชิ้นมาต้มเลี้ยงพวกเขา",
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
    description: "เจ้าเคยทรยศพรรคยาจก สำนักจึงส่งนักล่ามาตามเจ้า — แต่หัวหน้าหงเทียนยังเปิดทางให้ไถ่โทษ: ปราบหัวหน้าโจร 5 คน แล้วนำข้าวหมูแดง 5 จานมาถวาย หากผ่าน เจ้าจะนับเป็น \"ผู้ลาออก\" แทน \"ผู้ทรยศ\" นักล่าจะเลิกตามล่า แต่วิชาของพรรคยาจกที่ติดตัวจะไม่เก่งขึ้นจากการต่อสู้อีก และกลับเข้าสำนักไม่ได้",
    briefSummary: "ไถ่บาปต่อพรรคยาจก — ปราบหัวหน้าโจร 5 + ถวายข้าวหมูแดง 5 จาน",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectStatus", sectId: "beggars", status: "betrayed" },
    stages: [
      { id: "trial_kill", description: "ปราบหัวหน้าโจร 5 คนเพื่อพิสูจน์ว่ากลับใจจริง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 5 } },
      { id: "trial_offering", description: "นำข้าวหมูแดง 5 จานมาถวาย", autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 5 } },
      { id: "return_to_master", description: "กลับไปขออภัยต่อหัวหน้าหงเทียน" },
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
    name: "เก็บข้าวหมูแดงให้คนยาก",
    description: "ภารกิจประจำของศิษย์พรรคยาจก — เก็บข้าวหมูแดง 6 จาน",
    briefSummary: "ส่งข้าวหมูแดง 6 จาน · แต้มสำนัก +50",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      { id: "main", description: "เก็บข้าวหมูแดง 6 จาน", autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 6 } },
      { id: "report", description: "กลับไปรายงานหัวหน้าหงเทียน" },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 55 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 50 },
    ],
  },

  {
    id: "qst_beggars_sect_thug_road",
    name: "กำราบโจรริมทาง",
    description: "หัวหน้าหงเทียนได้ข่าวว่ามีโจรเร่ร่อนรังแกพ่อค้าและคนเดินทางตามชายป่า — ขอให้ปราบและนำเหรียญที่โจรขโมยไปคืน",
    briefSummary: "ปราบโจรเร่ร่อน 4 + เหรียญโบราณ 1 · แต้มสำนัก +65",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "fight",
        description: "ปราบโจรเร่ร่อน 4 คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 4 },
      },
      {
        id: "recover",
        description: "เก็บเหรียญโบราณ 1 เหรียญที่โจรปล้นไป",
        autoAdvance: { t: "hasItem", itemId: "ancient_coin", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 65 },
    ],
  },

  {
    id: "qst_beggars_sect_supplies",
    name: "รวบรวมเสบียงและผ้าให้คนยากไร้",
    description: "ฤดูหนาวใกล้มาถึง — พรรคยาจกจะแจกข้าวและผ้าให้คนยากไร้ในตรอก หัวหน้าขอให้ช่วยรวบรวมข้าวหมูแดงและผ้าไหมเก่าให้พอแจก",
    briefSummary: "ส่งข้าวหมูแดง 6 + ผ้าไหม 4 · แต้มสำนัก +70",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "gather_food",
        description: "รวบรวมข้าวหมูแดง 6 จาน",
        autoAdvance: { t: "hasItem", itemId: "rice_dish", count: 6 },
      },
      {
        id: "gather_silk",
        description: "หาผ้าไหม 4 ผืนสำหรับห่อกันหนาว",
        autoAdvance: { t: "hasItem", itemId: "silk", count: 4 },
      },
      {
        id: "report",
        description: "ส่งเสบียงให้หัวหน้าหงเทียนนำไปแจก",
      },
    ],
    rewards: [
      { t: "gold", amount: 160 },
      { t: "wExp", amount: 70 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 70 },
    ],
  },

  {
    id: "qst_beggars_sect_village_delivery",
    name: "ส่งของยังหมู่บ้านอดอยาก",
    description: "หมู่บ้านชายแดนกำลังประสบภัยอดอยาก — หัวหน้าหงเทียนขอให้นำเนื้อย่างไปส่งและเอาข้าวหมูแดงแจกชาวบ้าน",
    briefSummary: "ส่งเนื้อย่าง 5 + ข้าวหมูแดง 4 · แต้มสำนัก +60",
    type: "side",
    sectId: "beggars",
    giverNpcId: "sect_beggars_chief_hongtian",
    prereqs: { t: "sectMember", sectId: "beggars" },
    stages: [
      {
        id: "main",
        description: "เก็บเนื้อย่าง 5 ชิ้น + ข้าวหมูแดง 4 จาน",
        autoAdvance: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "cooked_meat", count: 5 },
            { t: "hasItem", itemId: "rice_dish", count: 4 },
          ],
        },
      },
      {
        id: "report",
        description: "กลับไปรายงานหัวหน้าหงเทียน",
      },
    ],
    rewards: [
      { t: "gold", amount: 130 },
      { t: "wExp", amount: 60 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "sect_beggars_chief_hongtian", amount: 3 },
      { t: "sectPoints", sectId: "beggars", amount: 60 },
    ],
  },
];
