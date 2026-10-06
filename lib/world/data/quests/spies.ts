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
        description: "ไปหมู่บ้านชีกู่ มีข่าวว่าหัวหน้าโจรซ่อนตัวอยู่แถวนั้น",
        autoAdvance: { t: "visitedLocation", locationId: "village_qigu" },
      },
      {
        id: "defeat",
        description: "ปราบหัวหน้าโจร (พบได้ระหว่างเดินทาง) แล้วยึดบัญชีคืน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "return",
        description: "นำบัญชีกลับไปให้เฟิงเจ้าของร้านบะหมี่ในนครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "wExp", amount: 100 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_capital_feng", amount: 12 },
      { t: "gold", amount: 400 },
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
        description: "ปราบนักฆ่าเงาที่ปลอมตัวเป็นข้าราชสำนัก",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "นำหลักฐานกลับไปให้เฟิงเจ้าของร้านบะหมี่ในนครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "wExp", amount: 150 },
      { t: "trait", trait: "good", amount: 5 },
      { t: "npcRelationship", npcId: "spy_capital_feng", amount: 16 },
      { t: "gold", amount: 400 },
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
        description: "กลับไปรายงานซีคนยกของท่าเรือที่หยางโจว",
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
        description: "ตามเส้นทางคาราวานออกจากหยางโจว แล้วปราบโจรเส้นทางที่ชิงผ้าไหมไป",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 1 },
      },
      {
        id: "report",
        description: "นำตราผ้าไหมกลับไปให้ซีคนยกของท่าเรือที่หยางโจว",
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
        description: "ปราบผู้ฝึกพิษ พ่อค้าพิษที่ออกหากินแถวป่าใกล้ต้าหลี่",
        autoAdvance: { t: "defeatedOpponent", opponentId: "poison_practitioner", count: 1 },
      },
      {
        id: "report",
        description: "นำหลักฐานไปให้เหมยพรานป่าที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 450 },
      { t: "wExp", amount: 110 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_dali_mei", amount: 12 },
      { t: "gold", amount: 400 },
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
        description: "ปราบนักฆ่าเงาที่คุ้มกันทูตใต้ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "นำสารลับไปให้เหมยพรานป่าที่ต้าหลี่",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "wExp", amount: 140 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: "spy_dali_mei", amount: 14 },
      { t: "gold", amount: 400 },
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
        description: "ปราบชายเมาก่อเรื่อง (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "drunk_brawler", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานโจวพ่อค้าเหล้าในโรงเตี๊ยมยั่วไหล",
      },
    ],
    rewards: [
      { t: "gold", amount: 250 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "spy_inn_zhou", amount: 9 },
      { t: "gold", amount: 400 },
    ],
  },

  {
    id: "qst_spy_inn_wandering_blade",
    name: "อาจารย์ดาบในโรงเตี๊ยม",
    description: "โจวพ่อค้าเหล้าสังเกตว่าอาจารย์ดาบพเนจรคนหนึ่งคุยเรื่องลับในโรงเตี๊ยมบ่อยเกินไป เขาคิดว่าเป็นคนของฝ่ายอธรรม ขอให้เจ้าลองฝีมือแล้วเค้นคำตอบมา",
    briefSummary: "ทดสอบฝีมืออาจารย์ดาบที่ผ่านโรงเตี๊ยมและรายงานโจว",
    type: "side",
    giverNpcId: "spy_inn_zhou",
    prereqs: { t: "questStatus", questId: "qst_spy_inn_drunk_confession", status: "done" },
    stages: [
      {
        id: "test",
        description: "ปราบอาจารย์ดาบ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานโจวพ่อค้าเหล้าในโรงเตี๊ยมยั่วไหล",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "wExp", amount: 130 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "spy_inn_zhou", amount: 13 },
      { t: "gold", amount: 400 },
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
        description: "ตามรอยผู้ส่งสารที่ขอบหมู่บ้านชีกู่ แล้วปราบโจรเร่ร่อนที่จับตัวเขาไว้",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานซื่อชาวนาในชีกู่ที่ไร่",
      },
    ],
    rewards: [
      { t: "gold", amount: 280 },
      { t: "wExp", amount: 80 },
      { t: "npcRelationship", npcId: "spy_village_si", amount: 9 },
      { t: "gold", amount: 400 },
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
        description: "ปราบนักรบทะเลทรายที่คุ้มกันคาราวานเหล็ก (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "desert_marauder", count: 1 },
      },
      {
        id: "report",
        description: "นำตัวอย่างเหล็กไปให้ซื่อชาวนาในชีกู่",
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
    description: "เฟิงเจ้าของร้านบะหมี่อยากโค่นเถ้าแก่หวางแห่งนครหลวงที่ขวางเครือข่ายข่าวของเขา · ขอให้เจ้าลอบขโมยของจากเถ้าแก่หวางมาใช้ปลูกหลักฐานเท็จ",
    briefSummary: "ลักของจากเถ้าแก่หวางในนครหลวง",
    type: "side",
    giverNpcId: "spy_capital_feng",
    stages: [
      {
        id: "steal",
        description: "ลอบขโมยของจากเถ้าแก่หวางในนครหลวง",
        autoAdvance: { t: "stoleFromNpc", npcId: "merchant_wang", count: 1 },
      },
      {
        id: "deliver",
        description: "นำของไปให้เฟิงเจ้าของร้านบะหมี่ปลูกหลักฐาน",
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
    name: "ปิดปากนายอำเภอ",
    description: "นายอำเภอหวู่แห่งนครหลวงกำลังสืบเครือข่ายลักลอบของซี · ซีต้องการให้เจ้าทำให้เขาเงียบไปตลอดกาล",
    briefSummary: "ลอบสังหารนายอำเภอหวู่แห่งนครหลวง",
    type: "side",
    giverNpcId: "spy_yangzhou_xi",
    stages: [
      {
        id: "kill",
        description: "ลอบสังหารนายอำเภอหวู่ที่นครหลวง",
        autoAdvance: { t: "assassinatedNpc", npcId: "city_capital_magistrate_wu" },
      },
      {
        id: "report",
        description: "กลับไปรายงานซีคนยกของท่าเรือที่หยางโจว",
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
    description: "เหมยพรานป่าต้องการยาแก้พิษหายากของหมอเสินหนงที่คุ้มสมุนไพร · นางจะใช้มันต่อรองกับเครือข่ายพิษ",
    briefSummary: "ลอบขโมยยาแก้พิษจากหมอเสินหนงที่คุ้มสมุนไพร",
    type: "side",
    giverNpcId: "spy_dali_mei",
    stages: [
      {
        id: "steal",
        description: "ขโมยยาแก้พิษจากหมอเสินหนงที่คุ้มสมุนไพร",
        autoAdvance: { t: "stoleFromNpc", npcId: "villa_yaowang_doctor_shennong", count: 1 },
      },
      {
        id: "deliver",
        description: "นำยาแก้พิษไปให้เหมยพรานป่าที่ต้าหลี่",
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
    name: "ม้วนกลยุทธ์ของนักยุทธศาสตร์",
    description: "โจวพ่อค้าเหล้าเชื่อว่านักยุทธศาสตร์กงแห่งจินหลิงคุมเครือข่ายลับที่อาจล้มกรมองครักษ์เสื้อแพรได้ · ขอให้เจ้าลักม้วนกลยุทธ์จากบ้านเขามา",
    briefSummary: "ลอบขโมยม้วนกลยุทธ์จากนักยุทธศาสตร์กงที่จินหลิง",
    type: "side",
    giverNpcId: "spy_inn_zhou",
    stages: [
      {
        id: "steal",
        description: "ขโมยม้วนกลยุทธ์จากนักยุทธศาสตร์กงที่จินหลิง",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_jinling_strategist_kong", count: 1 },
      },
      {
        id: "report",
        description: "นำม้วนกลยุทธ์ไปให้โจวพ่อค้าเหล้าในโรงเตี๊ยมยั่วไหล",
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
    description: "ซื่อชาวนาในชีกู่สืบได้ว่าเถ้าแก่หวางแห่งนครหลวงเริ่มรู้แผนของกรมองครักษ์เสื้อแพร · ขอให้เจ้าลักพาตัวเขามาส่งให้ที่ไร่",
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
        description: "กลับไปหาซื่อชาวนาในชีกู่ที่ไร่ ส่งตัวเถ้าแก่หวางให้เขา",
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
