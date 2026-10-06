import type { QuestDef } from "../../types";

// Evil-themed side quests anchored to the bad-guy NPCs in
// lib/world/data/npcs/evil.ts. All `type: "side"` so the one-shot
// rule still applies. Rewards profile: high gold + addTrait evil
// (5–15) + sometimes addTrait arrogance (1–4) + sometimes addTrait
// fame (notoriety bonus 2–8). Mechanics:
//
//   kill        — autoAdvance: defeatedOpponent
//   steal       — autoAdvance: stoleFromNpc
//   assassinate — autoAdvance: assassinatedNpc
//   kidnap      — autoAdvance: kidnappedNpc
//
// Scene ids follow the same `qs_<questid>_offer | progress | complete`
// convention; dialog scenes live in lib/world/data/scenes-content/evil.ts.
export const QUESTS_EVIL: readonly QuestDef[] = [

  // ══════════════════════════════════════════════════════════════════════
  // ผู้อาวุโสตู๋ซื่อ (evil_wudu_elder_dushi) — 5 quests
  // ══════════════════════════════════════════════════════════════════════

  // qe_wudu_collect_centipede — kill (tier 2 beast)
  {
    id: "qe_wudu_collect_centipede",
    name: "เก็บตะขาบยักษ์",
    description: "ตู๋ซื่อต้องการน้ำพิษจากตะขาบยักษ์เพื่อสกัดยาพิษรุ่นใหม่ที่ทรงพลังกว่าเดิม",
    briefSummary: "ปราบตะขาบยักษ์และนำพิษกลับมาให้ตู๋ซื่อ",
    type: "side",
    giverNpcId: "evil_wudu_elder_dushi",
    stages: [
      {
        id: "hunt",
        description: "ปราบตะขาบยักษ์ 1 ตัว (พบได้ระหว่างเดินทางตามถ้ำและโขดหิน)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "giant_centipede", count: 1 },
      },
      {
        id: "report",
        description: "นำพิษกลับมาให้ผู้อาวุโสตู๋ซื่อ",
      },
    ],
    rewards: [
      { t: "gold", amount: 300 },
      { t: "trait", trait: "evil", amount: 6 },
      { t: "wExp", amount: 100 },
      { t: "item", itemId: "centipede_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_wudu_elder_dushi", amount: 12 },
    ],
  },

  // qe_wudu_kidnap_doctor — kidnap (non-warrior target)
  {
    id: "qe_wudu_kidnap_doctor",
    name: "ลักพาตัวหมอยา",
    description: "ตู๋ซื่อต้องการหมอยาที่รู้วิธีถอนพิษร้ายแรงมาทำงานรับใช้สำนัก",
    briefSummary: "ลักพาตัวหมอเสินหนงแห่งคุ้มสมุนไพรมาส่งให้ตู๋ซื่อ",
    type: "side",
    giverNpcId: "evil_wudu_elder_dushi",
    stages: [
      {
        id: "seize",
        description: "ลักพาตัวหมอเสินหนงที่คุ้มสมุนไพร",
        autoAdvance: { t: "kidnappedNpc", npcId: "villa_yaowang_doctor_shennong" },
      },
      {
        id: "deliver",
        description: "กลับไปหาผู้อาวุโสตู๋ซื่อที่พรรคเบญจพิษ",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 130 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "npcRelationship", npcId: "evil_wudu_elder_dushi", amount: 15 },
    ],
  },

  // qe_wudu_steal_antidote — steal
  {
    id: "qe_wudu_steal_antidote",
    name: "ขโมยสูตรถอนพิษ",
    description: "ตำรายาถอนพิษของหมอหลินถูกตู๋ซื่อหมายปอง เขาต้องการให้ผู้เชี่ยวชาญไปขโมยมา",
    briefSummary: "ขโมยสูตรยาจากหมอหลินในนครหลวง",
    type: "side",
    giverNpcId: "evil_wudu_elder_dushi",
    stages: [
      {
        id: "steal",
        description: "แอบขโมยสูตรยาจากหมอหลินในนครหลวง",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_capital_physician_lin", count: 1 },
      },
      {
        id: "handover",
        description: "นำสูตรยาไปให้ผู้อาวุโสตู๋ซื่อที่พรรคเบญจพิษ",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 110 },
      { t: "item", itemId: "scorpion_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_wudu_elder_dushi", amount: 13 },
    ],
  },

  // qe_wudu_assassinate_emei — assassinate
  {
    id: "qe_wudu_assassinate_emei",
    name: "ลอบสังหารเจ้าสำนักง้อไบ๊",
    description: "ท่านนิ้วห้วนจิงฉาน เจ้าสำนักง้อไบ๊ ทำลายแผนการของพรรคเบญจพิษมาหลายครั้ง ผู้อาวุโสตู๋ซื่อต้องการให้นางตาย",
    briefSummary: "ลอบสังหารท่านนิ้วห้วนจิงฉานแห่งง้อไบ๊",
    type: "side",
    giverNpcId: "evil_wudu_elder_dushi",
    stages: [
      {
        id: "execute",
        description: "ลอบสังหารท่านนิ้วห้วนจิงฉานที่สำนักง้อไบ๊",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_emei_abbess_jingchan" },
      },
      {
        id: "report",
        description: "กลับไปรายงานผู้อาวุโสตู๋ซื่อที่พรรคเบญจพิษ",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 14 },
      { t: "trait", trait: "fame", amount: 6 },
      { t: "wExp", amount: 180 },
      { t: "item", itemId: "centipede_venom", count: 3 },
      { t: "npcRelationship", npcId: "evil_wudu_elder_dushi", amount: 20 },
    ],
  },

  // qe_wudu_clear_rival_sect — kill
  {
    id: "qe_wudu_clear_rival_sect",
    name: "กวาดล้างยอดยุทธอธรรม",
    description: "ผู้อาวุโสตู๋ซื่ออยากรู้ว่าเจ้าเก่งพอจะเป็นพวกเขาหรือไม่ — จอมยุทธมาร ศัตรูเก่าของพรรคเบญจพิษ เป็นบททดสอบ",
    briefSummary: "เอาชนะจอมยุทธมารเพื่อพิสูจน์ฝีมือแก่ตู๋ซื่อ",
    type: "side",
    giverNpcId: "evil_wudu_elder_dushi",
    stages: [
      {
        id: "battle",
        description: "ปราบจอมยุทธมาร (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "demonic_master", count: 1 },
      },
      {
        id: "report",
        description: "รายงานชัยชนะแก่ผู้อาวุโสตู๋ซื่อ",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 160 },
      { t: "item", itemId: "potion_big", count: 3 },
      { t: "npcRelationship", npcId: "evil_wudu_elder_dushi", amount: 18 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // นักฆ่าเงาหยิง (evil_zhizhu_assassin_ying) — 6 quests
  // ══════════════════════════════════════════════════════════════════════

  // qe_zhizhu_assassinate_lord — assassinate
  {
    id: "qe_zhizhu_assassinate_lord",
    name: "ลอบสังหารเจ้าคฤหาสน์",
    description: "นักฆ่าเงาหยิงรับงานปิดปากเจ้าบ้านเหยินเฟิงแห่งคุ้มนกนางแอ่น ผู้รู้ความลับมากเกินไป",
    briefSummary: "ลอบสังหารเจ้าบ้านเหยินเฟิงที่คุ้มนกนางแอ่น",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "eliminate",
        description: "แอบเข้าคุ้มนกนางแอ่น แล้วลอบสังหารเจ้าบ้านเหยินเฟิง",
        autoAdvance: { t: "assassinatedNpc", npcId: "villa_yanzi_lord_yanfeng" },
      },
      {
        id: "confirm",
        description: "กลับไปบอกนักฆ่าเงาหยิงที่ถ้ำแมงมุมว่างานเสร็จ",
      },
    ],
    rewards: [
      { t: "gold", amount: 650 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "wExp", amount: 160 },
      { t: "item", itemId: "scorpion_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 18 },
    ],
  },

  // qe_zhizhu_assassinate_master — assassinate
  {
    id: "qe_zhizhu_assassinate_master",
    name: "ลอบสังหารเจ้าอาวาส",
    description: "เจ้าอาวาสฮุยหยวนแห่งวัดเส้าหลินรู้ตัวตนที่แท้ของนักฆ่าเงาหยิงมานาน นางจึงอยากให้เขาหายไป",
    briefSummary: "ลอบสังหารเจ้าอาวาสฮุยหยวนและรายงานหยิง",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "stalk",
        description: "แทรกซึมวัดเส้าหลิน แล้วลอบสังหารเจ้าอาวาสฮุยหยวน",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_shaolin_abbot_huiyuan" },
      },
      {
        id: "report",
        description: "กลับไปรายงานนักฆ่าเงาหยิงที่ถ้ำแมงมุม",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 14 },
      { t: "trait", trait: "fame", amount: 6 },
      { t: "wExp", amount: 170 },
      { t: "item", itemId: "centipede_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 20 },
    ],
  },

  // qe_zhizhu_silence_traitor — kill
  {
    id: "qe_zhizhu_silence_traitor",
    name: "ปิดปากคนทรยศ",
    description: "มีนักฆ่าเงาคนหนึ่งทรยศต่อองค์กร หยิงต้องการให้กำจัดเขาก่อนเปิดเผยข้อมูลสำคัญ",
    briefSummary: "กำจัดนักฆ่าเงาผู้ทรยศก่อนเขาจะหายตัวไป",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "hunt",
        description: "ปราบนักฆ่าเงาผู้ทรยศ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "verify",
        description: "กลับไปบอกนักฆ่าเงาหยิงว่าคนทรยศเงียบไปแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "potion_mid", count: 3 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 16 },
    ],
  },

  // qe_zhizhu_purge_witnesses — steal
  {
    id: "qe_zhizhu_purge_witnesses",
    name: "ล้วงข้อมูลพยาน",
    description: "นักยุทธศาสตร์กงแห่งจินหลิงจดบันทึกเรื่ององค์กรนักฆ่าไว้มากเกินไป หยิงต้องการบันทึกนั้นมาทำลายก่อน",
    briefSummary: "ขโมยบันทึกจากนักยุทธศาสตร์กงในจินหลิง",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "infiltrate",
        description: "แอบเข้าบ้านนักยุทธศาสตร์กงและขโมยบันทึกความลับ",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_jinling_strategist_kong", count: 1 },
      },
      {
        id: "deliver",
        description: "นำบันทึกไปให้นักฆ่าเงาหยิงที่ถ้ำแมงมุม",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "wExp", amount: 130 },
      { t: "item", itemId: "ancient_coin", count: 2 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 14 },
    ],
  },

  // qe_zhizhu_steal_target_data — steal
  {
    id: "qe_zhizhu_steal_target_data",
    name: "ขโมยข้อมูลเป้าหมาย",
    description: "หยิงต้องการข้อมูลเส้นทางเดินของทูตพระราชสำนักเพื่อวางแผนลอบสังหาร",
    briefSummary: "ขโมยข้อมูลจากทูตหลิวอิงแห่งพระราชวังจงหยาง",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "steal",
        description: "ล้วงตารางเดินทางจากทูตหลิวอิงที่พระราชวังจงหยาง",
        autoAdvance: { t: "stoleFromNpc", npcId: "palace_zhongyang_envoy_liuying", count: 1 },
      },
      {
        id: "report",
        description: "นำข้อมูลไปให้นักฆ่าเงาหยิงที่ถ้ำแมงมุม",
      },
    ],
    rewards: [
      { t: "gold", amount: 480 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "wExp", amount: 120 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 14 },
    ],
  },

  // qe_zhizhu_apprentice_test — kill
  {
    id: "qe_zhizhu_apprentice_test",
    name: "ทดสอบมือฆ่า",
    description: "หยิงต้องการรู้ว่าผู้ช่วยใหม่แกร่งพอหรือยัง โดยการส่งไปสังหารอาจารย์ดาบระดับสูง",
    briefSummary: "ปราบอาจารย์ดาบเพื่อพิสูจน์ฝีมือให้หยิง",
    type: "side",
    giverNpcId: "evil_zhizhu_assassin_ying",
    stages: [
      {
        id: "duel",
        description: "ปราบอาจารย์ดาบ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "return",
        description: "กลับไปบอกนักฆ่าเงาหยิงว่าชนะแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 580 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 145 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "npcRelationship", npcId: "evil_zhizhu_assassin_ying", amount: 16 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // พระอเถระนอกรีตฮุยเป้า (evil_chuangwang_heretic_huibao) — 5 quests
  // ══════════════════════════════════════════════════════════════════════

  // qe_chuangwang_steal_relic — steal
  {
    id: "qe_chuangwang_steal_relic",
    name: "ขโมยพระธาตุโบราณ",
    description: "พระนอกรีตฮุยเป้าเห็นในนิมิตว่าพระธาตุของวัดต้าหลุน (วัดต้าหลุน) คือกุญแจของพิธีกรรมมาร พระกงซินเป็นผู้เก็บรักษามันไว้",
    briefSummary: "ขโมยพระธาตุจากพระกงซินที่วัดต้าหลุน",
    type: "side",
    giverNpcId: "evil_chuangwang_heretic_huibao",
    stages: [
      {
        id: "infiltrate",
        description: "แอบเข้าวัดต้าหลุน แล้วขโมยพระธาตุจากพระกงซิน",
        autoAdvance: { t: "stoleFromNpc", npcId: "temple_dalun_monk_kongxin", count: 1 },
      },
      {
        id: "offer",
        description: "นำพระธาตุไปให้พระอเถระฮุยเป้าที่สมบัติราชาโจร",
      },
    ],
    rewards: [
      { t: "gold", amount: 450 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 120 },
      { t: "item", itemId: "jade", count: 2 },
      { t: "npcRelationship", npcId: "evil_chuangwang_heretic_huibao", amount: 13 },
    ],
  },

  // qe_chuangwang_kidnap_novice — kidnap
  {
    id: "qe_chuangwang_kidnap_novice",
    name: "ลักพาตัวพระเส้าหลิน",
    description: "พิธีกรรมมารของฮุยเป้าต้องใช้คนที่ฝึกธรรมะมาแล้วแต่ยังไม่บรรลุ เขาเลือกอาจารย์ฝาหมิงแห่งวัดเส้าหลิน",
    briefSummary: "ลักพาตัวอาจารย์ฝาหมิงแห่งเส้าหลินมาให้ฮุยเป้า",
    type: "side",
    giverNpcId: "evil_chuangwang_heretic_huibao",
    stages: [
      {
        id: "capture",
        description: "ลักพาตัวอาจารย์ฝาหมิงที่วัดเส้าหลิน",
        autoAdvance: { t: "kidnappedNpc", npcId: "sect_shaolin_elder_faming" },
      },
      {
        id: "deliver",
        description: "กลับไปหาพระอเถระฮุยเป้าที่สมบัติราชาโจร",
      },
    ],
    rewards: [
      { t: "gold", amount: 520 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "wExp", amount: 135 },
      { t: "item", itemId: "wood_sacred", count: 1 },
      { t: "npcRelationship", npcId: "evil_chuangwang_heretic_huibao", amount: 15 },
    ],
  },

  // qe_chuangwang_kill_pilgrim — kill
  {
    id: "qe_chuangwang_kill_pilgrim",
    name: "ขัดขวางผู้แสวงบุญ",
    description: "ฮุยเป้าเกลียดผู้ที่ยังศรัทธาในธรรมะที่แท้จริง เขาส่งผู้ช่วยไปกำจัดสาวกอู่ตังที่เดินทางมายุทธภพ",
    briefSummary: "ปราบสาวกอู่ตังที่กำลังเดินทางผ่านป่า",
    type: "side",
    giverNpcId: "evil_chuangwang_heretic_huibao",
    stages: [
      {
        id: "ambush",
        description: "ดักซุ่มปราบสาวกอู่ตัง (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wudang_disciple", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานพระอเถระฮุยเป้า",
      },
    ],
    rewards: [
      { t: "gold", amount: 380 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 105 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "npcRelationship", npcId: "evil_chuangwang_heretic_huibao", amount: 12 },
    ],
  },

  // qe_chuangwang_burn_temple — assassinate
  {
    id: "qe_chuangwang_burn_temple",
    name: "ตัดหูตาของยุทธภพ",
    description: "ก่อนเริ่มแผนการใหญ่ ฮุยเป้าต้องตัดหูตาของยุทธภพ — หัวหน้าหงเทียนแห่งพรรคยาจกรู้ความเคลื่อนไหวของทุกสำนัก",
    briefSummary: "ลอบสังหารผู้นำของพรรคยาจกเพื่อตัดแหล่งข่าว",
    type: "side",
    giverNpcId: "evil_chuangwang_heretic_huibao",
    stages: [
      {
        id: "silence",
        description: "ลอบสังหารหัวหน้าหงเทียนแห่งพรรคยาจก",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_beggars_chief_hongtian" },
      },
      {
        id: "report",
        description: "กลับไปรายงานพระอเถระฮุยเป้า",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "wExp", amount: 155 },
      { t: "item", itemId: "ancient_coin", count: 2 },
      { t: "npcRelationship", npcId: "evil_chuangwang_heretic_huibao", amount: 17 },
    ],
  },

  // qe_chuangwang_purge_witnesses — steal
  {
    id: "qe_chuangwang_purge_witnesses",
    name: "ลบร่องรอยกิจกรรมมาร",
    description: "ผู้อาวุโสจูอิงแห่งพรรคตะวันจันทรารวบรวมหลักฐานเรื่องพิธีกรรมมารของฮุยเป้าไว้ ฮุยเป้าอยากให้หลักฐานนั้นหายไป",
    briefSummary: "ขโมยบันทึกลับจากผู้อาวุโสจูอิงแห่งพรรคตะวันจันทรา",
    type: "side",
    giverNpcId: "evil_chuangwang_heretic_huibao",
    stages: [
      {
        id: "steal",
        description: "แอบเข้าพรรคตะวันจันทราและขโมยบันทึกลับของผู้อาวุโสจูอิง",
        autoAdvance: { t: "stoleFromNpc", npcId: "sect_ming_elder_zhuying", count: 1 },
      },
      {
        id: "destroy",
        description: "นำบันทึกไปให้พระอเถระฮุยเป้าทำลาย",
      },
    ],
    rewards: [
      { t: "gold", amount: 420 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 110 },
      { t: "item", itemId: "jade", count: 1 },
      { t: "npcRelationship", npcId: "evil_chuangwang_heretic_huibao", amount: 12 },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // เจ้าลัทธิจ้าวมังกรเทพ (evil_shenlong_cult_leader_zhao) — 6 quests
  // ══════════════════════════════════════════════════════════════════════

  // qe_shenlong_kidnap_scholar — kidnap
  {
    id: "qe_shenlong_kidnap_scholar",
    name: "ลักพาตัวนักปราชญ์",
    description: "เจ้าลัทธิจ้าวมังกรเทพต้องการคนอ่านอักษรโบราณออก มาถอดรหัสคัมภีร์มังกร เขาเลือกบัณฑิตต้วนแห่งต้าหลี่",
    briefSummary: "ลักพาตัวบัณฑิตต้วนแห่งต้าหลี่มาส่งให้จ้าว",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "seize",
        description: "จับตัวบัณฑิตต้วนที่ต้าหลี่",
        autoAdvance: { t: "kidnappedNpc", npcId: "city_dali_scholar_duan" },
      },
      {
        id: "transport",
        description: "นำตัวบัณฑิตส่งให้จ้าวที่เกาะมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "jade", count: 2 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 15 },
    ],
  },

  // qe_shenlong_steal_dragon_pearl — steal
  {
    id: "qe_shenlong_steal_dragon_pearl",
    name: "ขโมยลูกแก้วมังกร",
    description: "เจ้าลัทธิจ้าวเชื่อว่าลูกแก้วในคลังของเจ้าบ้านเหยินเฟิงแห่งคุ้มนกนางแอ่นคือลูกแก้วมังกรโบราณ",
    briefSummary: "ขโมยลูกแก้วจากเจ้าบ้านเหยินเฟิงที่คุ้มนกนางแอ่น",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "infiltrate",
        description: "แอบเข้าคุ้มนกนางแอ่น แล้วขโมยลูกแก้วจากเจ้าบ้านเหยินเฟิง",
        autoAdvance: { t: "stoleFromNpc", npcId: "villa_yanzi_lord_yanfeng", count: 1 },
      },
      {
        id: "offer",
        description: "นำลูกแก้วไปถวายเจ้าลัทธิจ้าวมังกรเทพที่เกาะมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "wExp", amount: 140 },
      { t: "item", itemId: "fish_dragon", count: 1 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 14 },
    ],
  },

  // qe_shenlong_assassinate_priest — assassinate
  {
    id: "qe_shenlong_assassinate_priest",
    name: "ลอบสังหารเจ้าสำนักอู่ตัง",
    description: "เจ้าลัทธิจ้าวเชื่อว่าอาจารย์ชิงซวี่ เจ้าสำนักอู่ตัง คืออุปสรรคใหญ่ที่สุดของลัทธิมังกรเทพ",
    briefSummary: "ลอบสังหารอาจารย์ชิงซวี่แห่งอู่ตัง",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "strike",
        description: "เดินทางสู่สำนักอู่ตังและลอบสังหารอาจารย์ชิงซวี่",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_wudang_master_qingxu" },
      },
      {
        id: "return",
        description: "กลับไปรายงานเจ้าลัทธิจ้าวมังกรเทพที่เกาะมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 750 },
      { t: "trait", trait: "evil", amount: 15 },
      { t: "trait", trait: "fame", amount: 7 },
      { t: "wExp", amount: 190 },
      { t: "item", itemId: "wood_sacred", count: 2 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 20 },
    ],
  },

  // qe_shenlong_collect_tribute — steal
  {
    id: "qe_shenlong_collect_tribute",
    name: "เก็บบรรณาการ",
    description: "เจ้าลัทธิจ้าวสั่งให้ 'เก็บบรรณาการ' จากเส้าหลิน — คือขโมยของมีค่าจากเจ้าอาวาสฮุยหยวน ที่เขาเชื่อว่าเป็นของมังกรเทพ",
    briefSummary: "ขโมยสิ่งของมีค่าจากเจ้าอาวาสฮุยหยวน",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "collect",
        description: "เข้าสำนักเส้าหลินและขโมยสิ่งของจากเจ้าอาวาสฮุยหยวน",
        autoAdvance: { t: "stoleFromNpc", npcId: "sect_shaolin_abbot_huiyuan", count: 1 },
      },
      {
        id: "tribute",
        description: "นำของไปถวายเจ้าลัทธิจ้าวมังกรเทพที่เกาะมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 480 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "wExp", amount: 125 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 13 },
    ],
  },

  // qe_shenlong_clear_rebel — kill
  {
    id: "qe_shenlong_clear_rebel",
    name: "กำจัดผู้ต่อต้านมังกรเทพ",
    description: "เจ้าสำนักอธรรมคนหนึ่งกล้าท้าทายลัทธิมังกรเทพ เจ้าลัทธิจ้าวให้เจ้าไปปราบเขา",
    briefSummary: "ปราบเจ้าสำนักอธรรมที่กล้าท้าทายจ้าว",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "confront",
        description: "ปราบเจ้าสำนักอธรรม (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "heretical_grandmaster", count: 1 },
      },
      {
        id: "proclaim",
        description: "กลับไปประกาศชัยชนะต่อเจ้าลัทธิจ้าวมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "arrogance", amount: 4 },
      { t: "wExp", amount: 180 },
      { t: "item", itemId: "mithril_ore", count: 1 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 18 },
    ],
  },

  // qe_shenlong_initiate_test — kidnap
  {
    id: "qe_shenlong_initiate_test",
    name: "ทดสอบสมาชิกใหม่ลัทธิ",
    description: "พิธีรับสมาชิกใหม่ของลัทธิมังกรเทพต้องมี 'เครื่องบูชา' เจ้าลัทธิจ้าวเลือกทูตหลิวอิงแห่งพระราชวังจงหยาง ผู้สืบเรื่องลัทธิอยู่",
    briefSummary: "ลักพาตัวทูตหลิวอิงไปส่งที่เกาะมังกรเทพ",
    type: "side",
    giverNpcId: "evil_shenlong_cult_leader_zhao",
    stages: [
      {
        id: "capture",
        description: "ลักพาตัวทูตหลิวอิงที่พระราชวังจงหยาง",
        autoAdvance: { t: "kidnappedNpc", npcId: "palace_zhongyang_envoy_liuying" },
      },
      {
        id: "ritual",
        description: "นำตัวทูตมาร่วมพิธีที่เกาะมังกรเทพ",
      },
    ],
    rewards: [
      { t: "gold", amount: 650 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "wExp", amount: 165 },
      { t: "item", itemId: "fish_dragon", count: 1 },
      { t: "item", itemId: "jade", count: 1 },
      { t: "npcRelationship", npcId: "evil_shenlong_cult_leader_zhao", amount: 17 },
    ],
  },


  // ═══════════════════════════════════════════════════════════════════
  // เถ้าแก่โจวตลาดมืด — evil_capital_blackmarket_zhou (7 quests)
  // ═══════════════════════════════════════════════════════════════════

  // qe_capital_jewel_heist — STEAL
  {
    id: "qe_capital_jewel_heist",
    name: "ขโมยอัญมณีราชสกุล",
    description: "เถ้าแก่โจวตลาดมืดแห่งนครหลวงต้องการอัญมณีจากคลังของเจ้าบ้านเหยินเฟิงแห่งคุ้มนกนางแอ่น ให้แอบเข้าไปเอามาโดยไม่ทิ้งร่องรอย",
    briefSummary: "ขโมยของมีค่าจากเจ้าบ้านเหยินเฟิงที่คุ้มนกนางแอ่น",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "steal_jewel",
        description: "แอบขโมยของมีค่าจากเจ้าบ้านเหยินเฟิงที่คุ้มนกนางแอ่น",
        autoAdvance: { t: "stoleFromNpc", npcId: "villa_yanzi_lord_yanfeng", count: 1 },
      },
      {
        id: "report",
        description: "นำของไปส่งเถ้าแก่โจวตลาดมืดที่นครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 450 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 110 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 12 },
    ],
  },

  // qe_capital_silence_witness — KILL
  {
    id: "qe_capital_silence_witness",
    name: "ปิดปากพยาน",
    description: "กระบี่พเนจรคนหนึ่งเห็นการค้าของเถ้าแก่โจวตลาดมืดมากเกินไป ต้องจัดการก่อนเขาจะเปิดปาก",
    briefSummary: "ปราบกระบี่พเนจรที่รู้มากเกินไป",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "find_witness",
        description: "ปราบกระบี่พเนจร (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wandering_swordsman", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกเถ้าแก่โจวตลาดมืดที่นครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 350 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 100 },
      { t: "item", itemId: "viper_venom", count: 1 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 10 },
    ],
  },

  // qe_capital_merchant_kidnap — KIDNAP
  {
    id: "qe_capital_merchant_kidnap",
    name: "จับตัวพ่อค้าเป็นตัวประกัน",
    description: "พ่อค้าหวังไม่ยอมจ่ายหนี้ให้เถ้าแก่โจว ให้จับตัวเขาเป็นประกันเพื่อบีบให้ยอม",
    briefSummary: "จับพ่อค้าที่ค้างชำระหนี้",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "kidnap_merchant",
        description: "ลักพาตัวพ่อค้าหวังในนครหลวง",
        autoAdvance: { t: "kidnappedNpc", npcId: "city_capital_merchant_wang" },
      },
      {
        id: "report",
        description: "กลับไปบอกเถ้าแก่โจวตลาดมืดว่างานสำเร็จ",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 120 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 14 },
    ],
  },

  // qe_capital_clear_rival — KILL
  {
    id: "qe_capital_clear_rival",
    name: "กำจัดคู่แข่งตลาดมืด",
    description: "หัวหน้าโจรกลุ่มใหม่เริ่มรุกเขตของเถ้าแก่โจวตลาดมืด ปราบมันให้รู้ว่าใครเป็นเจ้าถิ่น",
    briefSummary: "กำจัดหัวหน้าโจรคู่แข่ง",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "kill_rival",
        description: "ปราบหัวหน้าโจร (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกเถ้าแก่โจวตลาดมืดที่นครหลวง",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "trait", trait: "fame", amount: 4 },
      { t: "wExp", amount: 130 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 15 },
    ],
  },

  // qe_capital_ledger_burn — STEAL
  {
    id: "qe_capital_ledger_burn",
    name: "ลักบัญชีแดง",
    description: "นายอำเภอหวู่แห่งนครหลวงเก็บบัญชีการค้าเถื่อนที่โยงถึงเถ้าแก่โจวตลาดมืดไว้ ต้องขโมยมาก่อนจะถูกส่งขึ้นไปถึงผู้ใหญ่",
    briefSummary: "ขโมยหลักฐานจากนายอำเภอ",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "steal_ledger",
        description: "ขโมยสมุดบัญชีจากนายอำเภอหวู่",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_capital_magistrate_wu", count: 1 },
      },
      {
        id: "deliver",
        description: "นำบัญชีไปให้เถ้าแก่โจวตลาดมืดทำลายทิ้ง",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "wExp", amount: 140 },
      { t: "item", itemId: "ancient_coin", count: 2 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 16 },
    ],
  },

  // qe_capital_steal_seal — STEAL
  {
    id: "qe_capital_steal_seal",
    name: "ขโมยตราประทับหมอ",
    description: "ตราประทับของหมอหลินแห่งนครหลวงมีค่าในตลาดมืด ใครถือตรานั้นปลอมใบสั่งยาต้องห้ามได้ เถ้าแก่โจวอยากได้มัน",
    briefSummary: "ขโมยตราประทับจากหมอ",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    stages: [
      {
        id: "steal_seal",
        description: "ขโมยตราประทับจากหมอหลิน",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_capital_physician_lin", count: 1 },
      },
      {
        id: "report",
        description: "นำตราประทับไปให้เถ้าแก่โจวตลาดมืด",
      },
    ],
    rewards: [
      { t: "gold", amount: 480 },
      { t: "trait", trait: "evil", amount: 10 },
      { t: "wExp", amount: 120 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 13 },
    ],
  },

  // qe_capital_assassinate_official — ASSASSINATE
  {
    id: "qe_capital_assassinate_official",
    name: "สังหารทูตราชสำนัก",
    description: "ทูตหลิวอิงแห่งพระราชวังจงหยางกำลังสืบเครือข่ายตลาดมืด เถ้าแก่โจวต้องการให้เขาหายไปก่อนส่งรายงาน",
    briefSummary: "ลอบสังหารทูตก่อนส่งรายงาน",
    type: "side",
    giverNpcId: "evil_capital_blackmarket_zhou",
    prereqs: { t: "questStatus", questId: "qe_capital_ledger_burn", status: "done" },
    stages: [
      {
        id: "assassinate",
        description: "ลอบสังหารทูตหลิวอิงที่พระราชวังจงหยาง",
        autoAdvance: { t: "assassinatedNpc", npcId: "palace_zhongyang_envoy_liuying" },
      },
      {
        id: "collect",
        description: "กลับไปรับค่าจ้างจากเถ้าแก่โจวตลาดมืด",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "trait", trait: "evil", amount: 15 },
      { t: "trait", trait: "fame", amount: 6 },
      { t: "wExp", amount: 200 },
      { t: "item", itemId: "jade", count: 1 },
      { t: "npcRelationship", npcId: "evil_capital_blackmarket_zhou", amount: 20 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ขุนนางหยานทุจริต — evil_changan_corrupt_official_yan (6 quests)
  // ═══════════════════════════════════════════════════════════════════

  // qe_changan_remove_rival — ASSASSINATE
  {
    id: "qe_changan_remove_rival",
    name: "กำจัดคู่แข่งทางการ",
    description: "นักยุทธศาสตร์กงแห่งจินหลิงกำลังรวบรวมหลักฐานความทุจริตของขุนนางหยาน ต้องกำจัดเขาก่อนที่เรื่องจะใหญ่โต",
    briefSummary: "สังหารนักยุทธศาสตร์ที่รู้ความลับ",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    stages: [
      {
        id: "assassinate_strategist",
        description: "ลอบสังหารนักยุทธศาสตร์กงแห่งจินหลิง",
        autoAdvance: { t: "assassinatedNpc", npcId: "city_jinling_strategist_kong" },
      },
      {
        id: "report",
        description: "กลับไปบอกขุนนางหยานทุจริตที่ฉางอันว่าภัยหมดแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 160 },
      { t: "item", itemId: "gold_ore", count: 1 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 18 },
    ],
  },

  // qe_changan_steal_evidence — STEAL
  {
    id: "qe_changan_steal_evidence",
    name: "ขโมยเอกสารลับ",
    description: "ทูตหลิวอิงแห่งพระราชวังจงหยางมีเอกสารที่จะเปิดโปงขุนนางหยานแห่งฉางอัน ให้ขโมยมาก่อนจะถึงราชสำนัก",
    briefSummary: "ขโมยเอกสารสำคัญจากทูต",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    stages: [
      {
        id: "steal_docs",
        description: "ขโมยเอกสารลับจากทูตหลิวอิงที่พระราชวังจงหยาง",
        autoAdvance: { t: "stoleFromNpc", npcId: "palace_zhongyang_envoy_liuying", count: 1 },
      },
      {
        id: "deliver",
        description: "นำเอกสารไปให้ขุนนางหยานทุจริตทำลาย",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 16 },
    ],
  },

  // qe_changan_silence_clerk — ASSASSINATE
  {
    id: "qe_changan_silence_clerk",
    name: "ปิดปากยามผู้รู้ความลับ",
    description: "ยามหยาน หัวหน้ายามประตูเมืองฉางอัน ได้ยินการสนทนาลับของขุนนางหยาน ต้องกำจัดเขาก่อนปากแตก",
    briefSummary: "ลอบสังหารยามหยานแห่งฉางอัน",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    stages: [
      {
        id: "silence_clerk",
        description: "ลอบสังหารยามหยานที่ประตูเมืองฉางอัน",
        autoAdvance: { t: "assassinatedNpc", npcId: "city_changan_guard_yan" },
      },
      {
        id: "report",
        description: "กลับไปรับค่าจ้างจากขุนนางหยานทุจริต",
      },
    ],
    rewards: [
      { t: "gold", amount: 500 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 130 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 15 },
    ],
  },

  // qe_changan_kidnap_witness — KIDNAP
  {
    id: "qe_changan_kidnap_witness",
    name: "จับตัวพยานหลักฐาน",
    description: "บัณฑิตต้วนแห่งต้าหลี่กำลังเขียนบันทึกเรื่องความทุจริตในราชสำนัก ขุนนางหยานต้องการตัวเขามาเป็นตัวประกัน",
    briefSummary: "จับตัวบัณฑิตที่จะเขียนรายงาน",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    stages: [
      {
        id: "kidnap_scholar",
        description: "ลักพาตัวบัณฑิตต้วนที่ต้าหลี่",
        autoAdvance: { t: "kidnappedNpc", npcId: "city_dali_scholar_duan" },
      },
      {
        id: "report",
        description: "กลับไปบอกขุนนางหยานทุจริตที่ฉางอันว่าจับตัวได้แล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 140 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 15 },
    ],
  },

  // qe_changan_smuggling_run — STEAL
  {
    id: "qe_changan_smuggling_run",
    name: "ขนสินค้าต้องห้ามผ่านด่าน",
    description: "ขุนนางหยานต้องการของมีค่าบางอย่างที่ยามหยานเก็บไว้เป็นหลักฐาน ให้ขโมยออกมาก่อนจะส่งให้กองตรวจ",
    briefSummary: "ขโมยสินค้าต้องห้ามจากยาม",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    stages: [
      {
        id: "steal_goods",
        description: "ขโมยของที่ยามหยานเก็บเป็นหลักฐาน",
        autoAdvance: { t: "stoleFromNpc", npcId: "city_changan_guard_yan", count: 1 },
      },
      {
        id: "deliver",
        description: "นำของไปให้ขุนนางหยานทุจริต",
      },
    ],
    rewards: [
      { t: "gold", amount: 480 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "wExp", amount: 120 },
      { t: "item", itemId: "ancient_coin", count: 3 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 13 },
    ],
  },

  // qe_changan_intimidate_judge — ASSASSINATE
  {
    id: "qe_changan_intimidate_judge",
    name: "ปิดปากที่ปรึกษาคดี",
    description: "ผู้อาวุโสจูอิงแห่งพรรคตะวันจันทราทำหน้าที่เป็นที่ปรึกษาคดีที่เป็นอันตรายต่อขุนนางหยาน ต้องหยุดเขาก่อนการพิพากษา",
    briefSummary: "สังหารที่ปรึกษาคดีก่อนตัดสิน",
    type: "side",
    giverNpcId: "evil_changan_corrupt_official_yan",
    prereqs: { t: "questStatus", questId: "qe_changan_remove_rival", status: "done" },
    stages: [
      {
        id: "silence_advisor",
        description: "ลอบสังหารผู้อาวุโสจูอิงแห่งพรรคตะวันจันทรา",
        autoAdvance: { t: "assassinatedNpc", npcId: "sect_ming_elder_zhuying" },
      },
      {
        id: "report",
        description: "กลับไปรายงานขุนนางหยานทุจริตที่ฉางอัน",
      },
    ],
    rewards: [
      { t: "gold", amount: 750 },
      { t: "trait", trait: "evil", amount: 14 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "wExp", amount: 180 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "npcRelationship", npcId: "evil_changan_corrupt_official_yan", amount: 18 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // หัวหน้าโจรชิง — evil_treasure_bandit_chief_qing (6 quests)
  // ═══════════════════════════════════════════════════════════════════

  // qe_treasure_caravan_raid — KILL
  {
    id: "qe_treasure_caravan_raid",
    name: "ปล้นกองคาราวาน",
    description: "หัวหน้าโจรชิงแห่งคลังสมบัติลับจะปล้นกองคาราวานพ่อค้า แต่ต้องการให้เจ้าจัดการยามคุ้มกันก่อนลูกน้องเข้าปล้น",
    briefSummary: "กำจัดยามคุ้มกองคาราวาน",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    stages: [
      {
        id: "kill_guard",
        description: "ปราบนักเลงฝ่ามือเหล็กที่รับจ้างคุ้มกองคาราวาน (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "iron_palm_thug", count: 1 },
      },
      {
        id: "report",
        description: "กลับมารับส่วนแบ่งจากหัวหน้าโจรชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 400 },
      { t: "trait", trait: "evil", amount: 9 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 110 },
      { t: "item", itemId: "iron_ore", count: 3 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 12 },
    ],
  },

  // qe_treasure_mountain_purge — KILL
  {
    id: "qe_treasure_mountain_purge",
    name: "กวาดล้างบนเขา",
    description: "กระบี่พเนจรกลุ่มหนึ่งมาสอดแนมแถวรังโจรในคลังสมบัติลับ หัวหน้าโจรชิงให้จัดการก่อนพวกมันจะพาพวกกลับมา",
    briefSummary: "กำจัดนักรบที่เข้ามาสอดแนม",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    stages: [
      {
        id: "purge_swordsmen",
        description: "ปราบกระบี่พเนจร 2 คน (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wandering_swordsman", count: 2 },
      },
      {
        id: "report",
        description: "รายงานให้หัวหน้าโจรชิงว่าพื้นที่ปลอดภัยแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 380 },
      { t: "trait", trait: "evil", amount: 8 },
      { t: "wExp", amount: 100 },
      { t: "item", itemId: "iron_blade", count: 1 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 11 },
    ],
  },

  // qe_treasure_steal_horde — STEAL
  {
    id: "qe_treasure_steal_horde",
    name: "ขโมยสมบัติคู่แข่ง",
    description: "สำนักดาบโลหิตซ่อนสมบัติบางส่วนไว้ที่คลังของทูตเซี่ย หัวหน้าโจรชิงต้องการให้ขโมยมาก่อนจะถูกย้าย",
    briefSummary: "ขโมยของมีค่าจากสำนักดาบโลหิต",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    stages: [
      {
        id: "steal_from_xueyu",
        description: "ขโมยสมบัติจากคลังของทูตเซี่ยแห่งสำนักดาบโลหิต",
        autoAdvance: { t: "stoleFromNpc", npcId: "evil_xueyu_envoy_xie", count: 1 },
      },
      {
        id: "deliver",
        description: "ส่งสมบัติให้หัวหน้าโจรชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "viper_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 15 },
    ],
  },

  // qe_treasure_kidnap_lord — KIDNAP
  {
    id: "qe_treasure_kidnap_lord",
    name: "จับตัวเจ้าบ้านเรียกค่าไถ่",
    description: "เจ้าบ้านเหยินเฟิงเป็นคนรวยมีทองมาก หัวหน้าโจรชิงสั่งให้จับตัวเรียกค่าไถ่สูง",
    briefSummary: "จับเจ้าบ้านผู้ดีเรียกค่าไถ่",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    stages: [
      {
        id: "kidnap_lord",
        description: "ลักพาตัวเจ้าบ้านเหยินเฟิงที่คุ้มนกนางแอ่น",
        autoAdvance: { t: "kidnappedNpc", npcId: "villa_yanzi_lord_yanfeng" },
      },
      {
        id: "report",
        description: "รายงานให้หัวหน้าโจรชิงว่าตัวประกันอยู่ในมือแล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "arrogance", amount: 4 },
      { t: "wExp", amount: 160 },
      { t: "item", itemId: "ancient_coin", count: 4 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 17 },
    ],
  },

  // qe_treasure_kill_lawman — KILL
  {
    id: "qe_treasure_kill_lawman",
    name: "สังหารเจ้าหน้าที่กฎหมาย",
    description: "อาจารย์ดาบคนหนึ่งกำลังนำกองลาดตระเวนมาตรวจรังโจรในคลังสมบัติลับ หัวหน้าโจรชิงต้องการให้จัดการเขาก่อนจะมาถึง",
    briefSummary: "สังหารอาจารย์ดาบที่นำกองสอบสวน",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    stages: [
      {
        id: "kill_blade_master",
        description: "ปราบอาจารย์ดาบที่นำกองลาดตระเวน (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
      },
      {
        id: "report",
        description: "กลับมารายงานให้หัวหน้าโจรชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "fame", amount: 5 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "gold_ore", count: 2 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 16 },
    ],
  },

  // qe_treasure_clear_competitor — KILL
  {
    id: "qe_treasure_clear_competitor",
    name: "กวาดล้างสำนักโจรคู่แข่ง",
    description: "สำนักนักฆ่าเงาเริ่มเบียดพื้นที่ปฏิบัติงานของโจรชิง ต้องส่งข้อความว่าใครเป็นใหญ่โดยการสังหารนักฆ่าของพวกเขา",
    briefSummary: "กำจัดนักฆ่าที่แย่งพื้นที่",
    type: "side",
    giverNpcId: "evil_treasure_bandit_chief_qing",
    prereqs: { t: "questStatus", questId: "qe_treasure_kill_lawman", status: "done" },
    stages: [
      {
        id: "kill_assassin",
        description: "ปราบนักฆ่าเงาที่รุกเขตของโจรชิง (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "รายงานผลให้หัวหน้าโจรชิง",
      },
    ],
    rewards: [
      { t: "gold", amount: 650 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "fame", amount: 6 },
      { t: "wExp", amount: 160 },
      { t: "item", itemId: "ancient_coin", count: 3 },
      { t: "npcRelationship", npcId: "evil_treasure_bandit_chief_qing", amount: 16 },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // ทูตเซี่ยแห่งสำนักดาบโลหิต — evil_xueyu_envoy_xie (6 quests)
  // ═══════════════════════════════════════════════════════════════════

  // qe_xueyu_sect_initiation — KIDNAP
  {
    id: "qe_xueyu_sect_initiation",
    name: "พิธีรับเข้าสำนัก",
    description: "ทูตเซี่ยแห่งสำนักดาบโลหิตบอกว่าของขวัญแรกเข้าที่ดีที่สุดคือเจ้าอาวาสฮุยหยวนแห่งวัดเส้าหลิน — ลักพาตัวมาให้ได้",
    briefSummary: "ลักพาตัวเจ้าอาวาสฮุยหยวนเป็นของขวัญแรกเข้า",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    stages: [
      {
        id: "kidnap_shaolin",
        description: "ลักพาตัวเจ้าอาวาสฮุยหยวนที่วัดเส้าหลิน",
        autoAdvance: { t: "kidnappedNpc", npcId: "sect_shaolin_abbot_huiyuan" },
      },
      {
        id: "deliver",
        description: "ส่งตัวประกันให้ทูตเซี่ยที่สำนักดาบโลหิต",
      },
    ],
    rewards: [
      { t: "gold", amount: 1500 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "arrogance", amount: 3 },
      { t: "wExp", amount: 130 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 15 },
    ],
  },

  // qe_xueyu_kill_pure_monk — KILL
  {
    id: "qe_xueyu_kill_pure_monk",
    name: "สังหารนักพรตบริสุทธิ์",
    description: "ทูตเซี่ยอยากรู้ว่าเจ้ากล้าทำบาปหรือไม่ ให้ปราบสาวกอู่ตังผู้ถือศีลที่เดินทางอยู่สักคน",
    briefSummary: "ปราบสาวกอู่ตังเพื่อพิสูจน์ความโหดเหี้ยม",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    stages: [
      {
        id: "kill_monk",
        description: "ปราบสาวกอู่ตัง (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "wudang_disciple", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกทูตเซี่ยที่สำนักดาบโลหิต",
      },
    ],
    rewards: [
      { t: "gold", amount: 450 },
      { t: "trait", trait: "evil", amount: 12 },
      { t: "trait", trait: "arrogance", amount: 2 },
      { t: "wExp", amount: 120 },
      { t: "item", itemId: "viper_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 14 },
    ],
  },

  // qe_xueyu_kidnap_disciple — KIDNAP
  {
    id: "qe_xueyu_kidnap_disciple",
    name: "ลักพาตัวเจ้าสำนักง้อไบ๊",
    description: "สำนักดาบโลหิตอยากได้วิชาของง้อไบ๊ ทูตเซี่ยจึงให้ลักพาตัวท่านนิ้วห้วนจิงฉาน เจ้าสำนักง้อไบ๊ มาสอบเค้น",
    briefSummary: "ลักพาตัวท่านนิ้วห้วนจิงฉานแห่งง้อไบ๊",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    stages: [
      {
        id: "kidnap_emei",
        description: "ลักพาตัวท่านนิ้วห้วนจิงฉานที่ง้อไบ๊",
        autoAdvance: { t: "kidnappedNpc", npcId: "sect_emei_abbess_jingchan" },
      },
      {
        id: "deliver",
        description: "กลับไปหาทูตเซี่ยที่สำนักดาบโลหิต",
      },
    ],
    rewards: [
      { t: "gold", amount: 600 },
      { t: "trait", trait: "evil", amount: 13 },
      { t: "trait", trait: "arrogance", amount: 4 },
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "scorpion_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 16 },
    ],
  },

  // qe_xueyu_steal_sutra — STEAL
  {
    id: "qe_xueyu_steal_sutra",
    name: "ขโมยพระสูตรต้องห้าม",
    description: "สำนักดาบโลหิตต้องการพระสูตรที่เจ้าอาวาสฮุยหยวนแห่งวัดเส้าหลินเก็บไว้ในห้องลับ ให้ขโมยออกมาโดยไม่ให้รู้ตัว",
    briefSummary: "ขโมยคัมภีร์ลับจากเส้าหลิน",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    stages: [
      {
        id: "steal_sutra",
        description: "ขโมยพระสูตรจากเจ้าอาวาสฮุยหยวนแห่งเส้าหลิน",
        autoAdvance: { t: "stoleFromNpc", npcId: "sect_shaolin_abbot_huiyuan", count: 1 },
      },
      {
        id: "deliver",
        description: "นำพระสูตรไปให้ทูตเซี่ยที่สำนักดาบโลหิต",
      },
    ],
    rewards: [
      { t: "gold", amount: 700 },
      { t: "trait", trait: "evil", amount: 14 },
      { t: "wExp", amount: 170 },
      { t: "item", itemId: "centipede_venom", count: 1 },
      { t: "item", itemId: "viper_venom", count: 2 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 17 },
    ],
  },

  // qe_xueyu_silence_traitor — KILL
  {
    id: "qe_xueyu_silence_traitor",
    name: "ปิดปากคนทรยศ",
    description: "สมาชิกสำนักดาบโลหิตคนหนึ่งหนีออกไปและนำความลับไปขายให้ง้อไบ๊ ต้องตามล่าและกำจัดให้สิ้นซาก",
    briefSummary: "ล่าและสังหารสมาชิกที่ทรยศสำนัก",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    stages: [
      {
        id: "hunt_traitor",
        description: "ปราบนักฆ่าเงาผู้ทรยศ (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปบอกทูตเซี่ยว่าคนทรยศไม่อยู่แล้ว",
      },
    ],
    rewards: [
      { t: "gold", amount: 550 },
      { t: "trait", trait: "evil", amount: 11 },
      { t: "trait", trait: "fame", amount: 4 },
      { t: "wExp", amount: 140 },
      { t: "item", itemId: "scorpion_venom", count: 3 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 15 },
    ],
  },

  // qe_xueyu_purge_village — KILL
  {
    id: "qe_xueyu_purge_village",
    name: "กวาดล้างหมู่บ้านพยาน",
    description: "ชาวบ้านใกล้สำนักได้เห็นเหตุการณ์ที่ไม่ควรเห็น ทูตเซี่ยต้องการกวาดล้างเพื่อความเงียบถาวร",
    briefSummary: "กวาดล้างหมู่บ้านผู้เห็นเหตุการณ์",
    type: "side",
    giverNpcId: "evil_xueyu_envoy_xie",
    prereqs: { t: "questStatus", questId: "qe_xueyu_kill_pure_monk", status: "done" },
    stages: [
      {
        id: "purge",
        description: "ปราบผู้อาวุโสสำนักที่ปกป้องหมู่บ้าน (พบได้ระหว่างเดินทาง)",
        autoAdvance: { t: "defeatedOpponent", opponentId: "sect_elder", count: 1 },
      },
      {
        id: "report",
        description: "กลับไปรายงานทูตเซี่ยที่สำนักดาบโลหิต",
      },
    ],
    rewards: [
      { t: "gold", amount: 800 },
      { t: "trait", trait: "evil", amount: 15 },
      { t: "trait", trait: "fame", amount: 7 },
      { t: "wExp", amount: 200 },
      { t: "item", itemId: "centipede_venom", count: 2 },
      { t: "item", itemId: "iron_blade", count: 1 },
      { t: "npcRelationship", npcId: "evil_xueyu_envoy_xie", amount: 20 },
    ],
  },
];
