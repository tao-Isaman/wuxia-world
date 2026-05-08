import type { QuestDef } from "../../types";

// Side and bad quests for the 5 Jinyiwei spies scattered around the world
// (สายลับเสื้อแพรกระจายตัว). Each spy hosts 2 side + 1 bad. Side quests
// favour kill / scout work; bad quests use the steal / assassinate /
// kidnap auto-advances from the bad-actions system.
//
// Naming:
//   qst_spy_<region>_<topic>   → side quest
//   qe_spy_<region>_<topic>    → bad quest
//
// Scene ids follow the existing convention:
//   qs_<questid>_offer
//   qs_<questid>_complete
export const QUESTS_SPIES: readonly QuestDef[] = [

  // ══════════════════════════════════════════════════════════════════════
  // เฟิงเจ้าของร้านบะหมี่ (spy_capital_feng) — capital chief informant
  // ══════════════════════════════════════════════════════════════════════

  {
    id: "qst_spy_capital_seal_ledger",
    name: "บัญชีตราพระราชา",
    description: "เฟิงพ่อค้าบะหมี่ในตรอกหลังนครหลวงต้องการบัญชีตราที่ถูกขโมยกลับคืน · เขาเชื่อว่าหัวหน้าโจรในชนบทใกล้เคียงเป็นต้นเรื่อง",
    briefSummary: "ปราบหัวหน้าโจรและนำบัญชีตราพระราชากลับมาให้เฟิง",
    type: "side",
    giverNpcId: "spy_capital_feng",
    stages: [
      {
        id: "scout",
        description: "ออกจากนครหลวงและค้นหาที่ซ่อนของหัวหน้าโจร",
        autoAdvance: { t: "visitedLocation", locationId: "village_qigu" },
      },
      {
        id: "defeat",
        description: "ปราบหัวหน้าโจรและยึดบัญชีคืน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "return",
        description: "ส่งบัญชีคืนเฟิงในตรอกบะหมี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_capital_feng", amount: 12 },
      { t: "item", itemId: "man_jy_chain", count: 1 },
    ],
  },

  {
    id: "qst_spy_capital_court_traitor",
    name: "คนทรยศในราชสำนัก",
    description: "เฟิงสงสัยว่ามีคนทรยศซุ่มอยู่ในวังหลวง · เขาขอให้เจ้าเข้าวังและจัดการมือสังหารที่ปลอมตัวเป็นข้าราชสำนัก",
    briefSummary: "เข้าวังหลวง ปราบมือสังหารปลอมตัว และนำหลักฐานกลับมา",
    type: "side",
    giverNpcId: "spy_capital_feng",
    prereqs: { t: "questStatus", questId: "qst_spy_capital_seal_ledger", status: "done" },
    stages: [
      {
        id: "enter_palace",
        description: "เข้าสู่พระราชวังหลวง",
        autoAdvance: { t: "visitedLocation", locationId: "palace_royal" },
      },
      {
        id: "defeat_traitor",
        description: "ปราบมือสังหารที่ปลอมตัวเป็นข้าราชสำนัก",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "นำหลักฐานกลับให้เฟิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "wExp", amount: 150 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "spy_capital_feng", amount: 16 },
      { t: "item", itemId: "man_jy_a1_silktread", count: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // ซีคนยกของท่าเรือ (spy_yangzhou_xi) — Yangzhou port watcher
  // ══════════════════════════════════════════════════════════════════════

  {
    id: "qst_spy_yangzhou_smuggler_ship",
    name: "เรือลักลอบขนสินค้า",
    description: "ซีพบเรือลักลอบขนของจากต่างเมืองเข้าหยางโจวเป็นประจำ · ขอให้เจ้าจัดการกับโจรสลัดที่คุมเส้นทาง",
    briefSummary: "ปราบโจรสลัดน้ำที่ท่าหยางโจว",
    type: "side",
    giverNpcId: "spy_yangzhou_xi",
    stages: [
      {
        id: "approach",
        description: "เดินทางถึงท่าเรือหยางโจว",
        autoAdvance: { t: "visitedLocation", locationId: "city_yangzhou" },
      },
      {
        id: "defeat",
        description: "ปราบโจรสลัดน้ำหัวหน้าเรือลักลอบ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
      },
      {
        id: "report",
        description: "รายงานซีที่ท่าเรือ",
      },
    ],
    rewards: [
      { t: "gold", amount: 350 },
      { t: "wExp", amount: 90 },
      { t: "npcRelationship", npcId: "spy_yangzhou_xi", amount: 10 },
      { t: "item", itemId: "potion_mid", count: 2 },
    ],
  },

  {
    id: "qst_spy_yangzhou_silk_seal",
    name: "ตราผ้าไหมหลวง",
    description: "ผ้าไหมที่จะส่งไปวังหลวงถูกชิงไปกลางทาง · ซีต้องการให้เจ้าตามไปยังเส้นทางคาราวานและนำตราคืน",
    briefSummary: "ปราบโจรเส้นทางและนำตราผ้าไหมหลวงคืน",
    type: "side",
    giverNpcId: "spy_yangzhou_xi",
    stages: [
      {
        id: "track",
        description: "ตามเส้นทางคาราวานออกจากหยางโจว",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 1 },
      },
      {
        id: "report",
        description: "นำตราผ้าไหมคืนให้ซี",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_yangzhou_xi", amount: 11 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // เหมยพรานป่า (spy_dali_mei) — Dali border ear
  // ══════════════════════════════════════════════════════════════════════

  {
    id: "qst_spy_dali_poisoner_track",
    name: "ตามรอยพ่อค้าพิษ",
    description: "เหมยตามรอยพ่อค้าพิษที่ลักลอบขายให้พรรคเบญจพิษ · ต้องการให้เจ้าปราบและนำหลักฐานกลับมา",
    briefSummary: "ปราบผู้ฝึกพิษและนำหลักฐานกลับให้เหมย",
    type: "side",
    giverNpcId: "spy_dali_mei",
    stages: [
      {
        id: "find",
        description: "ค้นหาผู้ฝึกพิษบริเวณป่าใกล้ต้าหลี่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "poison_practitioner", count: 1 },
      },
      {
        id: "report",
        description: "นำหลักฐานคืนเหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 450 },
      { t: "wExp", amount: 110 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_dali_mei", amount: 12 },
      { t: "item", itemId: "man_jy_eagleclaw", count: 1 },
    ],
  },

  {
    id: "qst_spy_dali_southern_envoy",
    name: "ทูตใต้",
    description: "เหมยจดได้ว่าทูตใต้กำลังจะส่งสารลับไปอู่ตัง · ขอให้เจ้าปราบมือสังหารที่คุ้มกันและยึดสาร",
    briefSummary: "ปราบนักฆ่าเงาที่คุ้มกันทูตใต้และนำสารคืน",
    type: "side",
    giverNpcId: "spy_dali_mei",
    prereqs: { t: "questStatus", questId: "qst_spy_dali_poisoner_track", status: "done" },
    stages: [
      {
        id: "intercept",
        description: "ดักจับทูตและกองกำลังคุ้มกัน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "นำสารคืนเหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 140 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "spy_dali_mei", amount: 14 },
      { t: "item", itemId: "man_jy_a2_goldarmor", count: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // โจวพ่อค้าเหล้าในโรงเตี๊ยม (spy_inn_zhou) — Yuelai listening post
  // ══════════════════════════════════════════════════════════════════════

  {
    id: "qst_spy_inn_drunk_confession",
    name: "คำสารภาพของขี้เมา",
    description: "โจวพ่อค้าเหล้าได้ยินคำสารภาพจากชายเมาก่อเรื่องคนหนึ่งว่ามีกลุ่มลึกลับเตรียมก่อการ · ขอให้เจ้าจัดการคนเมาและสืบให้แน่ใจ",
    briefSummary: "ปราบชายเมาก่อเรื่องที่โรงเตี๊ยมและรายงานโจว",
    type: "side",
    giverNpcId: "spy_inn_zhou",
    stages: [
      {
        id: "confront",
        description: "เผชิญหน้ากับชายเมาในโรงเตี๊ยม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "drunk_brawler", count: 1 },
      },
      {
        id: "report",
        description: "รายงานโจวที่เคาน์เตอร์เหล้า",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "spy_inn_zhou", amount: 9 },
      { t: "item", itemId: "man_jy_a0_brocade", count: 1 },
    ],
  },

  {
    id: "qst_spy_inn_wandering_blade",
    name: "ดาบพเนจรในโรงเตี๊ยม",
    description: "โจวสังเกตดาบพเนจรคนหนึ่งคุยเรื่องลับซ้ำในโรงเตี๊ยม · เขาคิดว่าเป็นคนของฝ่ายอธรรม ขอให้เจ้าทดสอบฝีมือและเอาคำตอบมา",
    briefSummary: "ทดสอบฝีมืออาจารย์ดาบที่ผ่านโรงเตี๊ยมและรายงานโจว",
    type: "side",
    giverNpcId: "spy_inn_zhou",
    prereqs: { t: "questStatus", questId: "qst_spy_inn_drunk_confession", status: "done" },
    stages: [
      {
        id: "test",
        description: "ทดสอบฝีมืออาจารย์ดาบ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "report",
        description: "รายงานโจว",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "wExp", amount: 130 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_inn_zhou", amount: 13 },
      { t: "item", itemId: "man_jy_blade", count: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // ซื่อชาวนาในชีกู่ (spy_village_si) — Qigu rural agent
  // ══════════════════════════════════════════════════════════════════════

  {
    id: "qst_spy_village_missing_courier",
    name: "ผู้ส่งสารหายตัว",
    description: "ผู้ส่งสารหลวงที่จะผ่านชีกู่หายตัวไป · ซื่อขอให้เจ้าตามและจัดการกับโจรเร่ร่อนที่อาจจับตัวเขาไว้",
    briefSummary: "ปราบโจรเร่ร่อนและตามหาผู้ส่งสารที่หายตัว",
    type: "side",
    giverNpcId: "spy_village_si",
    stages: [
      {
        id: "track",
        description: "ตามรอยที่ขอบหมู่บ้านชีกู่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 1 },
      },
      {
        id: "report",
        description: "รายงานซื่อในไร่",
      },
    ],
    rewards: [
      { t: "gold", amount: 280 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "spy_village_si", amount: 9 },
      { t: "item", itemId: "man_jy_grapple", count: 1 },
    ],
  },

  {
    id: "qst_spy_village_iron_caravan",
    name: "คาราวานเหล็กชายแดน",
    description: "ซื่อตามรอยคาราวานเหล็กที่ลอบขนข้ามชายแดน · ขอให้เจ้าจัดการกับนักรบทะเลทรายผู้คุ้มกัน",
    briefSummary: "ปราบนักรบทะเลทรายและสกัดคาราวานเหล็กลักลอบ",
    type: "side",
    giverNpcId: "spy_village_si",
    prereqs: { t: "questStatus", questId: "qst_spy_village_missing_courier", status: "done" },
    stages: [
      {
        id: "intercept",
        description: "ดักจับคาราวานเหล็กที่ขอบทะเลทราย",
        autoAdvance: { t: "defeatedOpponent", opponentId: "desert_marauder", count: 1 },
      },
      {
        id: "report",
        description: "รายงานซื่อพร้อมตัวอย่างเหล็ก",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "wExp", amount: 120 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_village_si", amount: 12 },
      { t: "item", itemId: "jade", count: 1 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // BAD QUESTS (5)
  // ══════════════════════════════════════════════════════════════════════

  // 1. Frame an innocent merchant — เฟิง (capital)
  {
    id: "qe_spy_capital_frame_merchant",
    name: "ปลูกหลักฐานใส่พ่อค้า",
    description: "เฟิงต้องการกำจัดเถ้าแก่หวางที่ขัดขวางเครือข่ายข่าวของเขา · ขอให้เจ้าลอบขโมยของจากร้านพ่อค้าเพื่อใช้เป็นหลักฐานเท็จ",
    briefSummary: "ลักของจากเถ้าแก่หวางในนครหลวง",
    type: "side",
    giverNpcId: "spy_capital_feng",
    stages: [
      {
        id: "steal",
        description: "ลอบขโมยของจากเถ้าแก่หวาง",
        autoAdvance: { t: "stoleFromNpc", npcId: "merchant_wang", count: 1 },
      },
      {
        id: "deliver",
        description: "ส่งของให้เฟิงเพื่อปลูกหลักฐาน",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 130 },
      { t: "npcRelationship", npcId: "spy_capital_feng", amount: 12 },
    ],
  },

  // 2. Silence a witness — ซี (yangzhou)
  {
    id: "qe_spy_yangzhou_silence_witness",
    name: "ปิดปากผู้พิพากษา",
    description: "ผู้พิพากษาอู๋แห่งนครหลวงสืบสวนเครือข่ายลักลอบของซี · เขาต้องการให้เจ้าจัดการให้เงียบไป",
    briefSummary: "สังหารผู้พิพากษาอู๋แห่งนครหลวง",
    type: "side",
    giverNpcId: "spy_yangzhou_xi",
    stages: [
      {
        id: "kill",
        description: "ลอบสังหารผู้พิพากษาอู๋ที่นครหลวง",
        autoAdvance: { t: "assassinatedNpc", npcId: "city_capital_magistrate_wu" },
      },
      {
        id: "report",
        description: "รายงานซีที่ท่าเรือหยางโจว",
      },
    ],
    rewards: [
      { t: "gold", amount: 900 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "fame", amount: 3 },
      { t: "wExp", amount: 160 },
      { t: "npcRelationship", npcId: "spy_yangzhou_xi", amount: 14 },
    ],
  },

  // 3. Steal antidote — เหมย (dali)
  {
    id: "qe_spy_dali_steal_antidote",
    name: "ลักยาแก้พิษหายาก",
    description: "เหมยต้องการยาแก้พิษหายากของหมอเสินหนงที่วิลล่ายาวัง · เธอจะใช้ต่อรองกับเครือข่ายพิษ",
    briefSummary: "ลอบขโมยยาแก้พิษจากหมอเสินหนงแห่งวิลล่ายาวัง",
    type: "side",
    giverNpcId: "spy_dali_mei",
    stages: [
      {
        id: "steal",
        description: "ลักยาแก้พิษจากหมอเสินหนง",
        autoAdvance: { t: "stoleFromNpc", npcId: "villa_yaowang_doctor_shennong", count: 1 },
      },
      {
        id: "deliver",
        description: "ส่งยาแก้พิษให้เหมย",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "npcRelationship", npcId: "spy_dali_mei", amount: 13 },
    ],
  },

  // 4. Steal a strategist's scroll — โจว (inn)
  {
    id: "qe_spy_inn_intimidate_drunk",
    name: "ม้วนกลยุทธ์ของขุนพล",
    description: "โจวเชื่อว่าขุนพลคงในจินหลิงคุมเครือข่ายลับที่อาจล้มกรมองครักษ์ · ขอให้เจ้าลักม้วนกลยุทธ์จากจวนเขามา",
    briefSummary: "ลอบขโมยม้วนกลยุทธ์จากขุนพลคงในจินหลิง",
    type: "side",
    giverNpcId: "spy_inn_zhou",
    stages: [
      {
        id: "steal",
        description: "ลักม้วนกลยุทธ์จากจวนขุนพลคง",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_jinling_strategist_kong", count: 1 },
      },
      {
        id: "report",
        description: "ส่งม้วนกลยุทธ์ให้โจว",
      },
    ],
    rewards: [
      { t: "gold", amount: 750 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 140 },
      { t: "npcRelationship", npcId: "spy_inn_zhou", amount: 13 },
    ],
  },

  // 5. Kidnap a witness — ซื่อ (village)
  {
    id: "qe_spy_village_kidnap_witness",
    name: "ลักพาตัวพ่อค้าใหญ่",
    description: "ซื่อจดได้ว่าเถ้าแก่หวางนครหลวงเริ่มรู้แผนของกรม · ขอให้เจ้าลักพาตัวเขามาส่งให้เฟิงในตรอกหลัง",
    briefSummary: "ลักพาตัวเถ้าแก่หวางและส่งให้ซื่อ",
    type: "side",
    giverNpcId: "spy_village_si",
    stages: [
      {
        id: "seize",
        description: "ลักพาตัวเถ้าแก่หวางในนครหลวง",
        autoAdvance: { t: "kidnappedNpc", npcId: "merchant_wang" },
      },
      {
        id: "deliver",
        description: "ส่งตัวเถ้าแก่หวางให้ซื่อในไร่",
      },
    ],
    rewards: [
      { t: "gold", amount: 850 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 150 },
      { t: "npcRelationship", npcId: "spy_village_si", amount: 14 },
    ],
  },
];
