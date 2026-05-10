import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS__OTHER: readonly QuestDef[] = [
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

];
