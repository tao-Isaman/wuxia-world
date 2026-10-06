import type { QuestDef } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const QUESTS__OTHER: readonly QuestDef[] = [
  {
    id: "qst_yaowang_rare_ingredient",
    name: "ส่วนผสมลับของตำรับยา",
    description: "หมอเสินหนงแห่งคุ้มสมุนไพรกำลังปรุงยาตำรับพิเศษ ขาดโสม 2 รากกับหยกล้ำค่า 1 ก้อน (หยกบดใช้ถอนพิษร้อน)",
    briefSummary: "รวบรวมส่วนผสมหายากสำหรับหมอเสินหนง",
    type: "side",
    giverNpcId: "villa_yaowang_doctor_shennong",
    stages: [
      {
        id: "gather_ginseng",
        description: "หาโสม 2 ราก",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 2 },
      },
      {
        id: "gather_jade",
        description: "หาหยกล้ำค่า 1 ก้อน",
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
        description: "เดินทางไปสำรวจหมู่บ้านที่ป่วยแถบถ้ำหุบเขาผีเสื้อ",
        objective: {
          spots: [
            { locationId: "valley_hudie", label: "สำรวจหมู่บ้านที่ป่วย", text: "ชาวบ้านไข้สูง ผิวขึ้นผื่นม่วง ดูคล้ายพิษจากสมุนไพรบางชนิด" },
          ],
        },
      },
      {
        id: "collect_sample",
        description: "เก็บตัวอย่างสมุนไพรและจดอาการคนป่วยที่ถ้ำหุบเขาผีเสื้อ",
        objective: {
          spots: [
            { locationId: "valley_hudie", label: "เก็บตัวอย่างสมุนไพรและบันทึกอาการ", text: "เก็บต้นหญ้าริมลำธารที่ชาวบ้านใช้ต้มกิน และจดอาการไว้ครบ" },
          ],
        },
      },
      {
        id: "return_report",
        description: "นำตัวอย่างกลับไปให้หมอเสินหนง",
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
        description: "สืบสวนที่เกิดเหตุปากถ้ำแมงมุม",
        objective: {
          spots: [
            { locationId: "cave_zhizhu", label: "สืบสวนปากถ้ำแมงมุม", text: "พบเศษขวดยาและรอยเท้าคนเลี้ยงพิษ — ต้องหาพิษงูมาเทียบ" },
          ],
        },
      },
      {
        id: "find_clues",
        description: "หาพิษงู 2 ขวดมาเทียบกับพิษที่ใช้",
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
    name: "พระธาตุวิหารล้อลม",
    description: "พระธาตุโบราณแห่งวิหารล้อลมหายไปในคืนพายุ พระกงซินสงสัยว่ามีคนในวัดเกี่ยวข้อง",
    briefSummary: "สืบหาพระธาตุที่หายจากวิหารล้อลม",
    type: "side",
    giverNpcId: "temple_dalun_monk_kongxin",
    stages: [
      {
        id: "search_temple",
        description: "ค้นหาร่องรอยในวิหารล้อลม",
        autoAdvance: { t: "visitedLocation", locationId: "temple_dalun" },
      },
      {
        id: "question_monks",
        description: "สัมภาษณ์พระในวัดเพื่อหาเบาะแส",
        objective: {
          spots: [
            { locationId: "temple_dalun", label: "สอบถามพระในวัด", text: "พระเณรรูปหนึ่งเห็นเงาชุดดำปีนกำแพงคืนพายุ มุ่งหน้าออกนอกวัด" },
          ],
        },
      },
      {
        id: "find_culprit",
        description: "เผชิญหน้ากับผู้ต้องสงสัย",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "recover_relic",
        description: "นำพระธาตุกลับคืนพระกงซิน",
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
    description: "พระกงซินขอให้ไปสวดมนต์ที่วิหารหลวงจีนสวรรค์และกลับมารายงาน เพื่อเป็นส่วนหนึ่งของพิธีกรรมโบราณ",
    briefSummary: "เดินทางไปวิหารหลวงจีนสวรรค์แล้วกลับมารายงาน",
    type: "side",
    giverNpcId: "temple_dalun_monk_kongxin",
    prereqs: { t: "questStatus", questId: "qst_dalun_stolen_relic", status: "done" },
    stages: [
      {
        id: "visit_tianning",
        description: "เดินทางไปยังวิหารหลวงจีนสวรรค์",
        autoAdvance: { t: "visitedLocation", locationId: "temple_tianning" },
      },
      {
        id: "return_report",
        description: "กลับไปรายงานพระกงซิน",
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
    description: "ตระกูลหลงส่งนักรบมาคุกคามคุ้มนกนางแอ่น เจ้าบ้านเหยินเฟิงขอให้ขับไล่พวกมัน",
    briefSummary: "ขับไล่นักรบตระกูลหลงออกจากคุ้มนกนางแอ่น",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    stages: [
      {
        id: "patrol",
        description: "ลาดตระเวนรอบคุ้มนกนางแอ่น",
        autoAdvance: { t: "visitedLocation", locationId: "villa_yanzi" },
      },
      {
        id: "defeat_raiders",
        description: "ปราบหัวหน้านักรบตระกูลหลง (ผู้อาวุโสสำนักที่ตระกูลหลงจ้างมา)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_elder", count: 1 },
      },
      {
        id: "report",
        description: "รายงานเจ้าบ้านเหยินเฟิงว่าเหตุการณ์สงบแล้ว",
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
    description: "เจ้าบ้านเหยินเฟิงส่งพ่อค้าของคุ้มไปค้าขายที่นครหลวง ขอให้คุ้มกันไปจนถึงร้านแล้วกลับมารายงาน",
    briefSummary: "คุ้มกันพ่อค้าของเจ้าบ้านเหยินเฟิงถึงจุดหมาย",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    stages: [
      {
        id: "depart",
        description: "พบพ่อค้าที่หน้าคุ้มนกนางแอ่นแล้วออกเดินทาง",
        objective: {
          spots: [
            { locationId: "villa_yanzi", label: "พบพ่อค้าที่หน้าคฤหาสน์", text: "พ่อค้าบรรทุกเกวียนเสร็จแล้ว ออกเดินทางได้ — ระวังโจรดักปล้นตามทาง" },
          ],
        },
      },
      {
        id: "fend_ambush",
        description: "ขับไล่โจรเส้นทาง 2 คนที่ดักซุ่มระหว่างทาง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 2 },
      },
      {
        id: "deliver_safely",
        description: "ส่งพ่อค้าถึงร้านในนครหลวงโดยสวัสดิภาพ",
        objective: {
          spots: [
            { locationId: "city_capital", label: "ส่งพ่อค้าถึงร้านในเมืองหลวง", text: "พ่อค้าถึงเมืองหลวงอย่างปลอดภัย ฝากคำขอบคุณถึงเจ้าบ้าน" },
          ],
        },
      },
      {
        id: "return_report",
        description: "กลับไปรายงานเจ้าบ้านเหยินเฟิง",
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
    description: "ดาบมรดกของเจ้าบ้านเหยินเฟิงถูกขโมยไปในคืนงานเลี้ยงที่คุ้มนกนางแอ่น ผู้ต้องสงสัยมีสามคน: พ่อบ้าน แขกนักดนตรี และองครักษ์",
    briefSummary: "สืบหาดาบมรดกที่ถูกขโมยจากคุ้มนกนางแอ่น",
    type: "side",
    giverNpcId: "villa_yanzi_lord_yanfeng",
    prereqs: { t: "questStatus", questId: "qst_yanzi_rival_clan", status: "done" },
    stages: [
      {
        id: "investigate",
        description: "สืบร่องรอยในห้องเก็บดาบของคุ้มนกนางแอ่น",
        objective: {
          spots: [
            { locationId: "villa_yanzi", label: "สืบร่องรอยในห้องเก็บดาบ", text: "กุญแจไม่ถูกงัด — คนร้ายต้องเป็นคนที่อยู่ในงานเลี้ยงคืนนั้น" },
          ],
        },
      },
      {
        id: "question_suspects",
        description: "สอบสวนผู้ต้องสงสัยสามคน: พ่อบ้าน แขกนักดนตรี และองครักษ์",
        objective: {
          spots: [
            { locationId: "villa_yanzi", label: "สอบสวนพ่อบ้าน", text: "พ่อบ้านอยู่ในครัวทั้งคืน มีพยานยืนยัน" },
            { locationId: "villa_yanzi", label: "สอบสวนแขกนักดนตรี", text: "นักดนตรีเล่นพิณไม่หยุดจนรุ่งเช้า" },
            { locationId: "villa_yanzi", label: "สอบสวนองครักษ์", text: "องครักษ์ผู้หนึ่งพูดวกวน และแขนมีรอยแผลใหม่ — เขาคือนักฆ่าเงาที่แฝงตัวมา" },
          ],
        },
      },
      {
        id: "confront_thief",
        description: "เผชิญหน้ากับนักฆ่าเงาที่ขโมยดาบ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "recover_sword",
        description: "นำดาบมรดกกลับคืนเจ้าบ้านเหยินเฟิง",
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
    name: "สาส์นจากราชสำนัก",
    description: "ทูตหลิวอิงได้รับสาส์นเร่งด่วนจากราชสำนัก ขอให้ส่งสาส์นไปยังอาจารย์ชิงซวี่แห่งอู่ตัง",
    briefSummary: "นำสาส์นราชสำนักจากพระราชวังจงหยางไปให้อาจารย์ชิงซวี่แห่งอู่ตัง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    stages: [
      {
        id: "receive_letter",
        description: "รับสาส์นจากทูตหลิวอิง",
        objective: {
          spots: [
            { locationId: "palace_zhongyang", label: "รับสาส์นจากทูตหลิวอิง", npcId: "palace_zhongyang_envoy_liuying", text: "ทูตหลิวอิงมอบสาส์นประทับตรามังกร — ต้องถึงมืออาจารย์ชิงซวี่เท่านั้น" },
          ],
        },
      },
      {
        id: "travel_wudang",
        description: "เดินทางไปยังสำนักอู่ตัง",
        autoAdvance: { t: "visitedLocation", locationId: "sect_wudang" },
      },
      {
        id: "deliver_letter",
        description: "ส่งสาส์นให้อาจารย์ชิงซวี่",
        objective: {
          spots: [
            { locationId: "sect_wudang", label: "ส่งสาส์นให้อาจารย์ชิงซวี่", npcId: "sect_wudang_master_qingxu", text: "อาจารย์ชิงซวี่อ่านสาส์นแล้วพยักหน้า ฝากคำตอบกลับไปยังทูต" },
          ],
        },
      },
      {
        id: "return_confirm",
        description: "กลับไปรายงานทูตหลิวอิง",
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
    description: "ทูตหลิวอิงพบว่าขุนนางสองฝ่ายในพระราชวังจงหยางกำลังแย่งชิงตำแหน่ง ขอให้ไปสอดแนมเรือนของทั้งสองฝ่ายและรายงานว่าฝ่ายไหนโกง",
    briefSummary: "สอดแนมขุนนางสองฝ่ายในพระราชวังจงหยาง แล้วรายงานทูตหลิวอิง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    prereqs: { t: "questStatus", questId: "qst_zhongyang_imperial_letter", status: "done" },
    stages: [
      {
        id: "spy_faction_a",
        description: "สอดแนมเรือนขุนนางฝั่งตะวันออกในพระราชวังจงหยาง",
        objective: {
          spots: [
            { locationId: "palace_zhongyang", label: "สอดแนมเรือนขุนนางฝั่งตะวันออก", text: "ขุนนางฝั่งตะวันออกนับทองกับพ่อค้าเกลือเถื่อนกลางดึก" },
          ],
        },
      },
      {
        id: "spy_faction_b",
        description: "สอดแนมเรือนขุนนางฝั่งตะวันตกในพระราชวังจงหยาง",
        objective: {
          spots: [
            { locationId: "palace_zhongyang", label: "สอดแนมเรือนขุนนางฝั่งตะวันตก", text: "ขุนนางฝั่งตะวันตกเขียนฎีกาทูลเรื่องภาษีอย่างซื่อตรง" },
          ],
        },
      },
      {
        id: "discover_truth",
        description: "ค้นห้องเก็บเอกสารในวังเพื่อหาความจริง",
        objective: {
          spots: [
            { locationId: "palace_zhongyang", label: "ค้นห้องเก็บเอกสาร", text: "บัญชีลับยืนยันว่าฝั่งตะวันออกยักยอกภาษี — ต้องตัดสินใจว่าจะรายงานทูตอย่างไร" },
          ],
        },
      },
      {
        id: "report_with_choice",
        description: "รายงานทูตหลิวอิง — จะพูดความจริงหรือบิดเบือน?",
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
    name: "คุ้มกันพิธีในวังหลวง",
    description: "มีข่าวว่าจะมีความพยายามลอบสังหารระหว่างพิธีพิเศษที่พระราชวังจงหยาง ทูตหลิวอิงขอให้คอยเฝ้าระวัง",
    briefSummary: "คุ้มกันพิธีสำคัญในพระราชวังจงหยาง",
    type: "side",
    giverNpcId: "palace_zhongyang_envoy_liuying",
    prereqs: { t: "questStatus", questId: "qst_zhongyang_noble_intrigue", status: "done" },
    stages: [
      {
        id: "station_guard",
        description: "ไปรับตำแหน่งยามที่พระราชวังจงหยาง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_zhongyang" },
      },
      {
        id: "repel_assassin",
        description: "ขับไล่นักฆ่าที่บุกเข้ามา (อาจารย์ดาบรับจ้าง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "report_success",
        description: "รายงานผลการคุ้มกันต่อทูตหลิวอิง",
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
