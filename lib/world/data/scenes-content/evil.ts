import type { Scene } from "../../types";

// Evil-quest dialog scenes — NPC ambient talks for the 4 bad-guy givers
// (evil_wudu_elder_dushi, evil_zhizhu_assassin_ying,
//  evil_chuangwang_heretic_huibao, evil_shenlong_cult_leader_zhao)
// plus offer/complete beats for each of the 22 evil quests in BATCH B.
// Pairs with lib/world/data/npcs/evil.ts and lib/world/data/quests/evil.ts.
export const SCENES_EVIL: readonly Scene[] = [

  // ══════════════════════════════════════════════════════════════════════
  // AMBIENT NPC TALKS — 4 bad-guy givers
  // ══════════════════════════════════════════════════════════════════════

  // ─── ผู้อาวุโสตู๋ซื่อ (sect_wudu) ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_evil_wudu_elder_dushi_talk",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "พิษทุกชนิดมีประโยชน์ในมือคนที่รู้จักใช้ ปัญหาคือคนส่วนใหญ่ไม่รู้" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ถ้าเจ้าอยากเรียนรู้ศาสตร์แห่งพิษ ก็ต้องพิสูจน์ตัวก่อน งานที่ต้องทำมีอยู่หลายชิ้น" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ข้าไม่สนใจเรื่องจริยธรรม สนแต่ผลลัพธ์ เจ้ารับได้ไหม?" },
    ],
    choices: [
      { text: "รับฟังงานที่ตู๋ซื่อมอบหมาย", next: "npc_evil_wudu_elder_dushi_talk" },
      { text: "ออกไปก่อน", next: "sect_wudu" },
    ],
  },

  // ─── นักฆ่าเงาหยิง (cave_zhizhu) ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_evil_zhizhu_assassin_ying_talk",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข้าไม่รับคนที่พูดมากเกินไป ถ้าเจ้ามาเพื่องาน — พูดสั้น ๆ แล้วไป" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ราคาที่ข้าให้คือราคาเดียว ต่อรองไม่ได้ ทำสำเร็จ — จ่าย ทำพัง — ไม่จ่าย" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ตอนนี้มีงานที่รอคนมีฝีมือพอ เจ้าสนใจไหม?" },
    ],
    choices: [
      { text: "รับฟังงานที่หยิงมี", next: "npc_evil_zhizhu_assassin_ying_talk" },
      { text: "ออกไปก่อน", next: "cave_zhizhu" },
    ],
  },

  // ─── พระอเถระนอกรีตฮุยเป้า (cave_chuangwang) ──────────────────────
  {
    kind: "dialog",
    id: "npc_evil_chuangwang_heretic_huibao_talk",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ธรรมะที่แท้จริงอยู่เหนือความดีและความชั่ว ผู้รู้จริงย่อมกระทำเพื่อบรรลุเป้าหมายสูงสุด" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เส้าหลินสอนให้ข้าว่าการฆ่าเป็นบาป แต่ข้าค้นพบว่าบาปที่ใหญ่สุดคือการไม่กระทำสิ่งที่ต้องทำ" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "หากเจ้าต้องการเข้าถึงพลังแห่งมาร ก็ต้องผ่านบททดสอบก่อน" },
    ],
    choices: [
      { text: "รับฟังบททดสอบของฮุยเป้า", next: "npc_evil_chuangwang_heretic_huibao_talk" },
      { text: "ออกไปก่อน", next: "cave_chuangwang" },
    ],
  },

  // ─── เจ้าลัทธิจ้าวมังกรเทพ (isle_shenlong) ─────────────────────────
  {
    kind: "dialog",
    id: "npc_evil_shenlong_cult_leader_zhao_talk",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "มังกรเทพได้เลือกเจ้าแล้ว นั่นคือเหตุผลเดียวที่เจ้ายังหายใจอยู่ ณ บัดนี้" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ลัทธิมังกรเทพไม่ต้องการศรัทธา — เราต้องการผลลัพธ์ เจ้าจะพิสูจน์คุณค่าของตัวได้อย่างไร?" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ท้องฟ้าและทะเลล้วนเป็นของมังกร ผู้ใดขัดขืนจะสูญสิ้นโดยพลัน" },
    ],
    choices: [
      { text: "รับฟังพันธกิจของมังกรเทพ", next: "npc_evil_shenlong_cult_leader_zhao_talk" },
      { text: "ออกไปก่อน", next: "isle_shenlong" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_wudu_elder_dushi quests
  // ══════════════════════════════════════════════════════════════════════

  // ─── qe_wudu_collect_centipede ─────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_wudu_collect_centipede_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ตะขาบยักษ์ที่ซ่อนตัวอยู่ในหินผุแถวชายถ้ำ น้ำพิษของมันทรงพลังกว่าพิษงูสิบเท่า" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ออกไปล่ามัน แล้วนำพิษกลับมาให้ข้า อย่าฆ่ามันทิ้งโดยเปล่าประโยชน์" },
    ],
    choices: [
      {
        text: "รับงาน — ออกล่าตะขาบยักษ์",
        effects: [{ t: "startQuest", questId: "qe_wudu_collect_centipede" }],
        next: "sect_wudu",
      },
      { text: "ปฏิเสธ", next: "sect_wudu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_wudu_collect_centipede_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "น้ำพิษนี้มีคุณภาพดีกว่าที่ข้าคาดไว้ เจ้ามีฝีมือพอสมควร" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "นี่ค่าตอบแทน และพิษสองหลอดที่ข้าสกัดไว้แล้ว เจ้าอาจใช้ประโยชน์ได้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_wudu_collect_centipede", success: true }],
        next: "sect_wudu",
      },
    ],
  },

  // ─── qe_wudu_kidnap_doctor ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_wudu_kidnap_doctor_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "หมอเสินหนงที่วิลล่ายาวังรู้วิธีถอนพิษที่ข้าคิดค้นมานาน — และข้าต้องการให้เขาเป็น 'แขก' ที่นี่" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "อย่าทำร้ายเขา ข้าต้องการสมองของเขา ไม่ใช่ร่างกาย แค่นำตัวมาให้ได้" },
    ],
    choices: [
      {
        text: "รับงาน — จับตัวหมอเสินหนง",
        effects: [{ t: "startQuest", questId: "qe_wudu_kidnap_doctor" }],
        next: "sect_wudu",
      },
      { text: "ปฏิเสธ", next: "sect_wudu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_wudu_kidnap_doctor_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ดีมาก หมอผู้นี้จะอยู่ที่นี่และทำงานรับใช้สำนักเบญจพิษ" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "เจ้าทำงานได้ดีกว่าที่ข้าคาด รับรางวัลไปเลย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_wudu_kidnap_doctor", success: true }],
        next: "sect_wudu",
      },
    ],
  },

  // ─── qe_wudu_steal_antidote ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_wudu_steal_antidote_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "หมอหลินในนครหลวงมีตำราที่ข้าต้องการ — สูตรยาถอนพิษที่สกัดจากสมุนไพรหายาก" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "เจ้าต้องแอบเข้าไปขโมยมาโดยไม่ให้หมอรู้ตัว ไม่ต้องฆ่า ข้าต้องการแค่สูตร" },
    ],
    choices: [
      {
        text: "รับงาน — ขโมยสูตรยาจากหมอหลิน",
        effects: [{ t: "startQuest", questId: "qe_wudu_steal_antidote" }],
        next: "sect_wudu",
      },
      { text: "ปฏิเสธ", next: "sect_wudu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_wudu_steal_antidote_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ข้าอ่านผ่านตาแล้ว สูตรนี้มีคุณค่ามากกว่าทองคำ" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "เจ้าได้พิษสองหลอดเป็นรางวัล มันจะมีประโยชน์หากเจ้าเดินบนเส้นทางเดียวกับข้า" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_wudu_steal_antidote", success: true }],
        next: "sect_wudu",
      },
    ],
  },

  // ─── qe_wudu_assassinate_emei ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_wudu_assassinate_emei_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ท่านนิ้วจิงฉาน... ข้าเกลียดนางนั้นมานานสิบปี" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "นางทำลายแผนการของสำนักเบญจพิษหลายครั้ง ถึงเวลาแล้วที่นางจะไม่ขัดขวางใครอีก" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "กำจัดนาง แล้วข้าจะให้สิ่งที่เจ้าต้องการ — ไม่มีอะไรจะหยุดเราได้อีก" },
    ],
    choices: [
      {
        text: "รับงาน — ลอบสังหารท่านนิ้วจิงฉาน",
        effects: [{ t: "startQuest", questId: "qe_wudu_assassinate_emei" }],
        next: "sect_wudu",
      },
      { text: "ปฏิเสธ", next: "sect_wudu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_wudu_assassinate_emei_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ข้าได้ยินข่าวจากง้อไบ๊แล้ว..." },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "เยี่ยมยอด ข้าอยู่กับความรู้สึกนี้มานานเกินไป เจ้าคือมือที่ข้าต้องการ รับรางวัลใหญ่ไปเลย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_wudu_assassinate_emei", success: true }],
        next: "sect_wudu",
      },
    ],
  },

  // ─── qe_wudu_clear_rival_sect ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_wudu_clear_rival_sect_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "จอมยุทธมารตัวนั้นอยู่ในขุนเขาทางตะวันออก เขาคือศัตรูของสำนักเบญจพิษมาช้านาน" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "ข้าต้องการทดสอบว่าเจ้าแกร่งพอหรือยัง ถ้าเจ้าเอาชนะเขาได้ ข้าจะถือว่าเจ้าเป็นพวกข้าอย่างแท้จริง" },
    ],
    choices: [
      {
        text: "รับงาน — ปราบจอมยุทธมาร",
        effects: [{ t: "startQuest", questId: "qe_wudu_clear_rival_sect" }],
        next: "sect_wudu",
      },
      { text: "ปฏิเสธ", next: "sect_wudu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_wudu_clear_rival_sect_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "เจ้าไม่ทำให้ข้าผิดหวัง จอมยุทธมารองค์นั้นเป็นอุปสรรคมาตลอด" },
      { t: "dialogue", speaker: "ผู้อาวุโสตู๋ซื่อ", text: "นับจากนี้เจ้าคือผู้ช่วยระดับสูงของสำนักเบญจพิษ รับรางวัลและยาพื้นฟูไปด้วย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_wudu_clear_rival_sect", success: true }],
        next: "sect_wudu",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_zhizhu_assassin_ying quests
  // ══════════════════════════════════════════════════════════════════════

  // ─── qe_zhizhu_assassinate_lord ─────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_assassinate_lord_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "เจ้าบ้านเหยินเฟิง รู้มากเกินไป และพูดมากเกินไป" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "งานตรงไปตรงมา เข้าคฤหาสน์ กำจัดเขา ออกมา อย่าทิ้งร่องรอย" },
    ],
    choices: [
      {
        text: "รับงาน — เข้าคฤหาสน์เหยินซี",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_assassinate_lord" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_assassinate_lord_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข้าได้รับการยืนยันแล้ว งานสะอาด ตรงตามที่ต้องการ" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "นี่ค่าตอบแทน ข้าอาจมีงานให้เจ้าอีก" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_assassinate_lord", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ─── qe_zhizhu_assassinate_master ───────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_assassinate_master_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "เจ้าอาวาสฮุยหยวน เส้าหลิน รู้ตัวตนของข้ามานานแล้ว" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ปล่อยให้เขาอยู่ต่อไปเป็นความเสี่ยง งานนี้ต้องการคนที่แทรกซึมเส้าหลินได้ เจ้ารับได้ไหม?" },
    ],
    choices: [
      {
        text: "รับงาน — ลอบสังหารเจ้าอาวาสฮุยหยวน",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_assassinate_master" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_assassinate_master_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "เส้าหลินจะสับสนวุ่นวายพักหนึ่ง ที่ต้องการ" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "เจ้าพิสูจน์ว่ามีฝีมือพอสำหรับงานระดับสูง รับไปเลย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_assassinate_master", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ─── qe_zhizhu_silence_traitor ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_silence_traitor_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "มีนักฆ่าเงาคนหนึ่งทรยศองค์กร กำลังจะขายข้อมูลให้ฝ่ายตรงข้าม" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ปิดปากเขาก่อนที่เขาจะหายตัวไป เขาเก่ง แต่เจ้าควรจะเก่งกว่า" },
    ],
    choices: [
      {
        text: "รับงาน — ตามล่านักฆ่าเงาผู้ทรยศ",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_silence_traitor" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_silence_traitor_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข่าวรั่วหยุดแล้ว เจ้าทำงานตรงตามเวลา" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ในงานของข้า ความเร็วคือชีวิต รับรางวัลแล้วเตรียมรับงานหน้า" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_silence_traitor", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ─── qe_zhizhu_purge_witnesses ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_purge_witnesses_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "นักยุทธศาสตร์กงในจินหลิงรวบรวมข้อมูลมานานหลายปี บันทึกของเขาเป็นอันตราย" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ขโมยบันทึกนั้นมาให้ข้า ข้าจะทำลายมันเอง อย่าแตะตัวเขา — ยังไม่ถึงเวลา" },
    ],
    choices: [
      {
        text: "รับงาน — ขโมยบันทึกจากนักยุทธศาสตร์กง",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_purge_witnesses" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_purge_witnesses_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข้าดูผ่านตาแล้ว ทุกอย่างอยู่ที่นี่ ดีมาก" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "งานเงียบเหมาะกับเจ้า รับรางวัลแล้วออกไป" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_purge_witnesses", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ─── qe_zhizhu_steal_target_data ────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_steal_target_data_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ทูตหลิวอิงเดินทางตามเส้นทางที่ข้าต้องรู้" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ขโมยตารางเส้นทางและข้อมูลการ์ดจากเขา เมื่อได้ข้อมูลแล้ว งานหน้าจะง่ายขึ้นมาก" },
    ],
    choices: [
      {
        text: "รับงาน — ล้วงข้อมูลจากทูตหลิวอิง",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_steal_target_data" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_steal_target_data_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข้อมูลนี้ดีมาก เจ้าทำงานละเอียดกว่าที่คาด" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "รับรางวัลไป ของชิ้นหนึ่งเป็นของมีค่าที่ข้าสำรองไว้สำหรับคนที่ไว้ใจได้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_steal_target_data", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ─── qe_zhizhu_apprentice_test ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_apprentice_test_offer",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ข้ารับงานจากลูกค้าได้เพราะฝีมือ ไม่ใช่ชื่อเสียง เจ้าจะพิสูจน์ฝีมือหรือเปล่า?" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "ออกไปปราบอาจารย์ดาบที่ข้าระบุ เขาเป็นระดับสูง ถ้าเจ้าชนะ ข้าจะส่งงานดีกว่านี้ให้" },
    ],
    choices: [
      {
        text: "รับงาน — พิสูจน์ฝีมือด้วยการปราบอาจารย์ดาบ",
        effects: [{ t: "startQuest", questId: "qe_zhizhu_apprentice_test" }],
        next: "cave_zhizhu",
      },
      { text: "ปฏิเสธ", next: "cave_zhizhu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_zhizhu_apprentice_test_complete",
    lines: [
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "เจ้าผ่านแล้ว อาจารย์ดาบระดับนั้นไม่ใช่คนธรรมดา" },
      { t: "dialogue", speaker: "นักฆ่าเงาหยิง", text: "รับรางวัลไป และจำไว้ว่าข้าจะส่งงานสำคัญให้เจ้าในอนาคต" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_zhizhu_apprentice_test", success: true }],
        next: "cave_zhizhu",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_chuangwang_heretic_huibao quests
  // ══════════════════════════════════════════════════════════════════════

  // ─── qe_chuangwang_steal_relic ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_steal_relic_offer",
    lines: [
      { t: "narration", text: "ฮุยเป้านั่งสมาธิในมุมมืด เปิดตาช้า ๆ เหมือนไม่ได้นอนหลับแต่เดินทางในมิติอื่น" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "พระธาตุแห่งวัดตาหลุน ข้าเห็นมันในนิมิต มันบรรจุพลังงานที่เหล่าผู้รู้ฝากไว้เป็นพัน ๆ ปี" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ขโมยมันมาให้ข้า อย่ากังวลเรื่องบาปบุญ — ธรรมะที่แท้จริงอยู่เหนือกฎระเบียบของสำนักเหล่านั้น" },
    ],
    choices: [
      {
        text: "รับงาน — ขโมยพระธาตุจากวัดตาหลุน",
        effects: [{ t: "startQuest", questId: "qe_chuangwang_steal_relic" }],
        next: "cave_chuangwang",
      },
      { text: "ปฏิเสธ", next: "cave_chuangwang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_steal_relic_complete",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "นิมิตของข้าไม่เคยโกหก พระธาตุนี้คือกุญแจที่ข้าต้องการ" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เจ้าเดินบนเส้นทางที่ถูกต้องแล้ว รับสิ่งที่ข้าสัญญาไว้ได้เลย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_chuangwang_steal_relic", success: true }],
        next: "cave_chuangwang",
      },
    ],
  },

  // ─── qe_chuangwang_kidnap_novice ────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_kidnap_novice_offer",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "พิธีกรรมที่ข้าจะทำต้องการบุคคลที่ฝึกฝนธรรมะมาแล้ว — แต่ยังไม่ถึงขั้นรู้ความจริง" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "สาวกอาวุโสแห่งเส้าหลินจะเหมาะ นำเขามาที่นี่ อย่าฆ่า แค่นำมา" },
    ],
    choices: [
      {
        text: "รับงาน — ลักพาตัวสาวกเส้าหลิน",
        effects: [{ t: "startQuest", questId: "qe_chuangwang_kidnap_novice" }],
        next: "cave_chuangwang",
      },
      { text: "ปฏิเสธ", next: "cave_chuangwang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_kidnap_novice_complete",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เส้าหลินอบรมเขามาดี ข้าจะใช้เวลาเปลี่ยนแปลงการมองโลกของเขา" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เจ้าช่วยข้าเปิดประตูใหม่ รับรางวัลแห่งความเข้าใจและทรัพย์ไป" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_chuangwang_kidnap_novice", success: true }],
        next: "cave_chuangwang",
      },
    ],
  },

  // ─── qe_chuangwang_kill_pilgrim ─────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_kill_pilgrim_offer",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "สาวกอู่ตังที่เดินทางผ่านป่ากำลังสอนธรรมะแก่ชาวบ้าน — ธรรมะที่ข้ารู้ว่าเป็นความเท็จ" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "หยุดเขา ด้วยวิธีที่เหมาะสมที่สุด ข้าไม่ต้องการความเมตตาในครั้งนี้" },
    ],
    choices: [
      {
        text: "รับงาน — ปราบสาวกอู่ตัง",
        effects: [{ t: "startQuest", questId: "qe_chuangwang_kill_pilgrim" }],
        next: "cave_chuangwang",
      },
      { text: "ปฏิเสธ", next: "cave_chuangwang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_kill_pilgrim_complete",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "อู่ตังจะได้รู้ว่ามารมีอำนาจเหนือธรรมะในโลกนี้" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เจ้ากระทำสิ่งที่ถูกต้อง รับรางวัลแห่งความกล้าหาญไป" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_chuangwang_kill_pilgrim", success: true }],
        next: "cave_chuangwang",
      },
    ],
  },

  // ─── qe_chuangwang_burn_temple ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_burn_temple_offer",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ก่อนข้าจะก้าวสู่ขั้นต่อไปในแผนการ ต้องตัดหูตาออกก่อน" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "หัวหน้าหงเทียนแห่งพรรคยาจกรู้เรื่องมากเกินไป และเขาพร้อมขายข้อมูลให้ใครก็ได้ที่จ่ายสูง กำจัดเขา" },
    ],
    choices: [
      {
        text: "รับงาน — ลอบสังหารหัวหน้าหงเทียน",
        effects: [{ t: "startQuest", questId: "qe_chuangwang_burn_temple" }],
        next: "cave_chuangwang",
      },
      { text: "ปฏิเสธ", next: "cave_chuangwang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_burn_temple_complete",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "พรรคยาจกจะต้องใช้เวลาหาผู้นำใหม่ นั่นคือเวลาที่ข้าต้องการ" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "เจ้ากล้าและแน่วแน่ รับรางวัลที่สมควรได้รับ" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_chuangwang_burn_temple", success: true }],
        next: "cave_chuangwang",
      },
    ],
  },

  // ─── qe_chuangwang_purge_witnesses ──────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_purge_witnesses_offer",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ผู้อาวุโสจูอิงแห่งพรรคสว่างมืดเก็บบันทึกพิธีกรรมที่ข้าเคยทำ" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ขโมยบันทึกนั้นมา ข้าต้องทำลายมันก่อนที่มันจะตกถึงมือทางการ เป็นเรื่องเร่งด่วน" },
    ],
    choices: [
      {
        text: "รับงาน — ขโมยบันทึกจากผู้อาวุโสจูอิง",
        effects: [{ t: "startQuest", questId: "qe_chuangwang_purge_witnesses" }],
        next: "cave_chuangwang",
      },
      { text: "ปฏิเสธ", next: "cave_chuangwang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_chuangwang_purge_witnesses_complete",
    lines: [
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "ข้าดูแล้ว นี่คือทุกสิ่ง ดีมาก เส้นทางของข้าโล่งขึ้นอีกหน้า" },
      { t: "dialogue", speaker: "พระอเถระฮุยเป้า", text: "รับรางวัลแห่งความเงียบงัน เพราะความเงียบคือพลังที่แท้จริง" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_chuangwang_purge_witnesses", success: true }],
        next: "cave_chuangwang",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_shenlong_cult_leader_zhao quests
  // ══════════════════════════════════════════════════════════════════════

  // ─── qe_shenlong_kidnap_scholar ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_kidnap_scholar_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "มังกรเทพทิ้งคัมภีร์โบราณไว้ในโลกนี้ แต่ตัวอักษรนั้นอ่านได้เฉพาะผู้ที่ศึกษาโบราณอักษรตลอดชีวิต" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "บัณฑิตต้วนแห่งต้าหลี่คือผู้นั้น นำเขามาที่เกาะนี้ — มังกรเทพจะให้บำเหน็จแก่เจ้า" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ลักพาตัวบัณฑิตต้วน",
        effects: [{ t: "startQuest", questId: "qe_shenlong_kidnap_scholar" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_kidnap_scholar_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "มังกรเทพพอใจ บัณฑิตผู้นี้จะถอดรหัสคัมภีร์และเปิดทางให้ลัทธิก้าวสู่ขั้นต่อไป" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "บำเหน็จของเจ้ามาถึงแล้ว ผู้ที่รับใช้มังกรย่อมได้รับความคุ้มครองชั่วนิรันดร์" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_kidnap_scholar", success: true }],
        next: "isle_shenlong",
      },
    ],
  },

  // ─── qe_shenlong_steal_dragon_pearl ─────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_steal_dragon_pearl_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ลูกแก้วมังกรนั้นหลงทางอยู่ในมือมนุษย์ธรรมดาที่ไม่รู้คุณค่าของมัน" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าบ้านเหยินเฟิงถือมันเป็นของสะสม แต่มันคือสมบัติของมังกรเทพ นำมันคืนมา" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ขโมยลูกแก้วจากคฤหาสน์เหยินซี",
        effects: [{ t: "startQuest", questId: "qe_shenlong_steal_dragon_pearl" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_steal_dragon_pearl_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ลูกแก้วนี้... ข้ารู้สึกพลังของมังกรเทพสั่นสะเทือนในมือข้า" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "มังกรเทพจดจำผู้รับใช้ที่ซื่อสัตย์ รับบำเหน็จที่สมควรได้รับ" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_steal_dragon_pearl", success: true }],
        next: "isle_shenlong",
      },
    ],
  },

  // ─── qe_shenlong_assassinate_priest ─────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_assassinate_priest_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "อาจารย์ชิงซวี่แห่งอู่ตังพูดถึงลัทธิมังกรเทพว่าเป็นความผิดพลาด — คำพูดนั้นแพร่กระจายไปทุกทิศ" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ผู้ที่ดูถูกมังกรเทพต้องได้รับการลงโทษ ทำให้เขาเงียบตลอดกาล" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ลอบสังหารอาจารย์ชิงซวี่",
        effects: [{ t: "startQuest", questId: "qe_shenlong_assassinate_priest" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_assassinate_priest_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "อู่ตังจะไว้อาลัยอาจารย์ของพวกเขา และลัทธิมังกรเทพจะยิ่งแข็งแกร่งขึ้นในความหวาดกลัวนั้น" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "มังกรเทพยกย่องเจ้าเป็นผู้พิทักษ์แห่งลัทธิ รับบำเหน็จสูงสุดไป" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_assassinate_priest", success: true }],
        next: "isle_shenlong",
      },
    ],
  },

  // ─── qe_shenlong_collect_tribute ────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_collect_tribute_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เส้าหลินกักตุนสมบัติที่ควรเป็นบรรณาการแด่มังกรเทพมานานแล้ว" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าอาวาสฮุยหยวนถือสิ่งที่เป็นของมังกรอยู่ในมือ นำมันมาคืนสู่ผู้ที่ควรครอบครอง" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ขโมยสิ่งของจากเจ้าอาวาสฮุยหยวน",
        effects: [{ t: "startQuest", questId: "qe_shenlong_collect_tribute" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_collect_tribute_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "สิ่งที่เจ้านำมากลับสู่ที่ที่มันควรอยู่แล้ว ลัทธิมังกรเทพแข็งแกร่งขึ้นอีกหน้า" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "รับบำเหน็จจากมังกรเทพ ผู้รับใช้ที่ซื่อสัตย์ย่อมได้รับสิ่งที่คู่ควร" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_collect_tribute", success: true }],
        next: "isle_shenlong",
      },
    ],
  },

  // ─── qe_shenlong_clear_rebel ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_clear_rebel_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าสำนักอธรรมองค์นั้นกล้าท้าทายอำนาจของมังกรเทพ เขาเผยแพร่คำสอนที่ขัดแย้งกับลัทธิของข้า" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "โลกนี้มีที่ว่างสำหรับมังกรเทพเพียงองค์เดียว ผู้ท้าทายต้องถูกกำจัด เจ้าจะปฏิบัติพันธกิจนี้หรือไม่?" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ปราบเจ้าสำนักอธรรม",
        effects: [{ t: "startQuest", questId: "qe_shenlong_clear_rebel" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_clear_rebel_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าสำนักอธรรมพ่ายแพ้แล้ว ท้องฟ้าและแผ่นดินยืนยันว่ามังกรเทพไร้เทียมทาน" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าพิสูจน์ตัวเองว่าคู่ควรกับตำแหน่งผู้พิทักษ์มังกรเทพ รับบำเหน็จสูงสุดไป" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_clear_rebel", success: true }],
        next: "isle_shenlong",
      },
    ],
  },

  // ─── qe_shenlong_initiate_test ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qe_shenlong_initiate_test_offer",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "พิธีรับสมาชิกใหม่แห่งลัทธิมังกรเทพต้องการเครื่องบูชา — ผู้แทนจากราชสำนักที่ยืนยาวมา" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ทูตหลิวอิงแห่งวังจงหยาง เขาจะเป็นพยานถึงอำนาจของมังกรเทพ นำเขามาที่เกาะนี้" },
    ],
    choices: [
      {
        text: "รับพันธกิจ — ลักพาตัวทูตหลิวอิง",
        effects: [{ t: "startQuest", questId: "qe_shenlong_initiate_test" }],
        next: "isle_shenlong",
      },
      { text: "ขอพิจารณาก่อน", next: "isle_shenlong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_shenlong_initiate_test_complete",
    lines: [
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "ทูตของราชสำนักมาที่เกาะมังกรเทพแล้ว พิธีกรรมจะเริ่มต้นในค่ำคืนนี้" },
      { t: "dialogue", speaker: "เจ้าลัทธิจ้าวมังกรเทพ", text: "เจ้าเป็นสมาชิกชั้นสูงของลัทธินับตั้งแต่บัดนี้ รับบำเหน็จของมังกรเทพไป" },
    ],
    choices: [
      {
        text: "รับบำเหน็จ",
        effects: [{ t: "finishQuest", questId: "qe_shenlong_initiate_test", success: true }],
        next: "isle_shenlong",
      },
    ],
  },


  // ══════════════════════════════════════════════════════════════════════
  // AMBIENT NPC TALKS — 4 bad-guy givers (EVIL-A batch)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_evil_capital_blackmarket_zhou_talk",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "เอ้อ...นักรบหนุ่ม ดูแวว ๆ ว่าไม่ใช่คนชอบถามมาก ดี — ข้าชอบแบบนั้น" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ตลาดของข้าไม่มีในแผนที่ราชการ แต่ทุกอย่างที่คุณต้องการ — หาได้ที่นี่ถ้าราคาตรงกัน" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ว่าแต่ ถ้าคุณพร้อมทำงานมากกว่าซื้อ ข้ามีงานที่จ่ายดีกว่าค่าแรงทั่วไปมาก..." },
    ],
  },

  {
    kind: "dialog",
    id: "npc_evil_changan_corrupt_official_yan_talk",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ท่านมาในเวลาที่ดี ข้าพเจ้ากำลังมองหาคนที่รับงานได้โดยไม่ต้องถามเหตุผล" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ในราชสำนัก ผู้ที่อยู่รอดคือผู้ที่รู้จักกำจัดปัญหาก่อนที่ปัญหาจะกำจัดตน" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ทองคำไม่ใช่ปัญหาสำหรับข้าพเจ้า ปัญหาคือหาคนที่ไว้วางใจได้และปิดปากเป็น..." },
    ],
  },

  {
    kind: "dialog",
    id: "npc_evil_treasure_bandit_chief_qing_talk",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ฮ่าฮ่า! คนที่กล้าเดินเข้ามาถ้ำข้าคนเดียว ไม่ใช่คนโง่ก็ต้องเก่งมาก" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ข้าไม่รบกวนคนที่ไม่มีอะไรให้ข้า แต่ถ้าคุณมีฝีมือ ข้ามีงานที่ต้องการมือดี" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "กฎข้าง่าย: ทำงานสำเร็จ ได้เงิน ทำงานพัง หรือทรยศ — ไม่มีกลับบ้าน" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_evil_xueyu_envoy_xie_talk",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "...ท่านเดินทางไกลมาถึงที่นี่ สำนักดาบโลหิตไม่ต้อนรับผู้มาเยือนทั่วไป" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "แต่ถ้าท่านมาเพื่อแสดงความสามารถ — สำนักเราให้โอกาสแก่คนที่พิสูจน์ตัวเองได้" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "งานทุกชิ้นที่ข้ามอบหมายมีเลือดติดมาด้วย ถ้าท่านไม่พร้อมสำหรับสิ่งนั้น จงหันหลังไปตอนนี้" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_capital_blackmarket_zhou (7 quests, EVIL-A)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "qs_qe_capital_jewel_heist_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "มีลูกค้ารายใหญ่ต้องการอัญมณีชุดพิเศษ และข้าก็รู้ว่ามันอยู่ที่ไหน" },
      { t: "narration", text: "เถ้าแก่โจวยิ้มแย้มราวกับว่ากำลังเสนอขายผักสดในตลาด" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "เจ้าบ้านเหยินเฟิงมีคลังสมบัติเต็มไปหมด เขาไม่รู้ด้วยซ้ำว่ามีอะไรอยู่บ้าง ขโมยไปก็ไม่เจ็บใคร" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_jewel_heist" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_jewel_heist_complete",
    lines: [
      { t: "narration", text: "เถ้าแก่โจวรับของมาดูอย่างพิถีพิถัน ก่อนพยักหน้าพอใจ" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "งานสะอาด ดีมาก เอาทองคำไป และอย่าลืมว่างานแบบนี้ยังมีอีก" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_capital_jewel_heist", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_silence_witness_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "มีนักดาบคนหนึ่งเห็นการแลกเปลี่ยนสินค้าของข้า ตอนนี้เขาเดินพาดพิงในย่านนี้" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ข้าต้องการให้เขาหยุดเดินอย่างถาวร เข้าใจไหม?" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_silence_witness" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_silence_witness_complete",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ดี ปัญหาหนึ่งจัดการเสร็จ คุณทำงานได้ตรงประเด็นดี นี่ค่าจ้าง" },
    ],
    choices: [
      {
        text: "รับเงิน",
        effects: [{ t: "finishQuest", questId: "qe_capital_silence_witness", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_merchant_kidnap_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "พ่อค้าหวังค้างหนี้ข้าสามเดือนแล้ว ข้าต้องแสดงให้เขาเห็นว่าหนี้ข้าไม่ใช่เรื่องติดแล้วลืม" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ไม่ต้องทำร้าย แค่จับเขาไปไว้ที่โกดังข้าก่อน พอเขาเห็นว่าสถานการณ์ไม่ดี เขาจะยอมจ่ายเอง" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_merchant_kidnap" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_merchant_kidnap_complete",
    lines: [
      { t: "narration", text: "เถ้าแก่โจวหัวเราะเบา ๆ เมื่อได้ยินข่าว" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "หวังจะจ่ายหนี้เองแล้วตอนนี้ ฮ่าฮ่า ดี นี่ส่วนแบ่งของคุณ" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_capital_merchant_kidnap", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_clear_rival_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "โจรกลุ่มใหม่เริ่มรับงานในเขตของข้า ไม่ขอราชนาม ไม่จ่ายส่วย นั่นคือการท้าทาย" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ไปบอกหัวหน้าของพวกนั้นว่าเขตนี้มีเจ้าของแล้ว วิธีที่ดีที่สุดคือทำให้เขาหยุดหายใจ" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_clear_rival" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_clear_rival_complete",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ข่าวดีมาถึงข้าแล้ว หัวหน้าโจรกลุ่มนั้นไม่มีตัวตนอีกต่อไป ดีมาก นี่ค่าจ้างบวกโบนัส" },
    ],
    choices: [
      {
        text: "รับเงิน",
        effects: [{ t: "finishQuest", questId: "qe_capital_clear_rival", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_ledger_burn_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "นายอำเภอหวู่มีบัญชีรายการที่ข้าไม่อยากให้ใครเห็น มันอยู่ที่บ้านเขา" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ข้าต้องการให้คุณเข้าไปเอาบัญชีนั้นออกมา — เงียบ ๆ และไม่มีร่องรอย ราคาของงานนี้ดีมาก" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_ledger_burn" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_ledger_burn_complete",
    lines: [
      { t: "narration", text: "เถ้าแก่โจวรับบัญชีมาโดยไม่เปิดดู แล้วโยนใส่กองไฟด้านข้างทันที" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ดีมาก ภัยหนึ่งหมดไป คุณสมควรได้รับรางวัลนี้" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_capital_ledger_burn", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_steal_seal_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ตราประทับของหมอหลิน ข้าต้องการมัน ไม่ต้องอธิบายเหตุผล แค่รู้ว่ามูลค่ามันสูงมาก" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "หมอหลินคนนั้นไม่ใช่นักสู้ เข้าและออกโดยเร็ว งานนี้ไม่ยาก" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_steal_seal" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_steal_seal_complete",
    lines: [
      { t: "narration", text: "เถ้าแก่โจวพลิกดูตราประทับด้วยความพอใจ" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "สมบูรณ์แบบ ตรานี้จะสร้างรายได้ให้ข้ามหาศาล นี่ค่าตอบแทนของคุณ" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_capital_steal_seal", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_capital_assassinate_official_offer",
    lines: [
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ทูตหลิวอิง...คนนี้เป็นปัญหาที่ใหญ่กว่าคนอื่น เขากำลังรวบรวมรายชื่อคนในธุรกิจของข้า" },
      { t: "narration", text: "เถ้าแก่โจวพูดเสียงเบาลงจนแทบเป็นการกระซิบ" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ข้าต้องการให้เขาหายไปจากยุทธภพนี้ งานนี้ข้าจ่ายสูงสุด ไม่มีคำถาม ไม่มีหลักฐาน" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_capital_assassinate_official" }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_capital_blackmarket_zhou_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_capital_assassinate_official_complete",
    lines: [
      { t: "narration", text: "เถ้าแก่โจวนิ่งเงียบอยู่ครู่หนึ่งหลังได้ยินข่าว จากนั้นก็หัวเราะเบา ๆ" },
      { t: "dialogue", speaker: "เถ้าแก่โจว", text: "ธุรกิจของข้าปลอดภัยแล้ว นี่ทองคำและของที่สัญญาไว้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_capital_assassinate_official", success: true }],
        next: "npc_evil_capital_blackmarket_zhou_talk",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_changan_corrupt_official_yan (6 quests, EVIL-A)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "qs_qe_changan_remove_rival_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "นักยุทธศาสตร์กงแห่งจินหลิง — ชื่อนี้ข้าพเจ้าได้ยินบ่อยเกินไปในรายงานของสายลับ" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "เขาเก็บรวบรวมข้อมูลเพื่อส่งรายงานต่อต้านข้าพเจ้า ก่อนที่รายงานนั้นจะเสร็จ...เขาต้องหายไปก่อน" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_remove_rival" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_remove_rival_complete",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ข้าพเจ้าได้รับการยืนยันแล้ว ดีมาก ท่านมีค่าต่อข้าพเจ้า นี่ค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_changan_remove_rival", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_changan_steal_evidence_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ทูตหลิวอิงมีเอกสารลับที่จะเปิดโปงข้าพเจ้า ให้ขโมยมาก่อนจะส่งขึ้นราชสำนัก" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ท่านจะเข้าไปขโมยมาได้ไหม? ไม่ต้องทำร้ายทูต เพียงแค่เอาเอกสารออกมา" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_steal_evidence" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_steal_evidence_complete",
    lines: [
      { t: "narration", text: "ขุนนางหยานรับเอกสารมาด้วยมือสั่นเล็กน้อย ก่อนยิ้มอย่างโล่งใจ" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ท่านช่วยชีวิตข้าพเจ้าไว้จริง ๆ นี่รางวัลที่สมควร" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_changan_steal_evidence", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_changan_silence_clerk_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ยามหยาน คนนั้นดูเหมือนซื่อสัตย์ แต่ข้าพเจ้าได้ยินว่าเขากำลังพูดถึงสิ่งที่ไม่ควรพูด" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ถ้าข่าวนั้นถูกต้อง เขาเป็นภัยคุกคามที่ต้องจัดการ ข้าพเจ้าต้องการให้ท่านจัดการเรื่องนี้" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_silence_clerk" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_silence_clerk_complete",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ปัญหาหนึ่งหมดไป ดีมาก ท่านทำงานสะอาด นี่ค่าตอบแทนที่สัญญาไว้" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_changan_silence_clerk", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_changan_kidnap_witness_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "บัณฑิตต้วนแห่งต้าหลี่กำลังบันทึกประวัติศาสตร์ที่ข้าพเจ้าไม่ต้องการให้ใครอ่าน" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ข้าพเจ้าต้องการตัวเขา — มีชีวิต เพื่อบอกให้หยุดเขียน และลบทิ้งสิ่งที่เขียนไปแล้ว" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_kidnap_witness" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_kidnap_witness_complete",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ดีมาก เขาอยู่ในมือข้าพเจ้าแล้ว บันทึกทั้งหมดจะถูกทำลาย นี่ค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_changan_kidnap_witness", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_changan_smuggling_run_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ยามหยางเก็บของที่ยึดได้จากพ่อค้าผิดกฎหมายไว้เป็นหลักฐาน ข้าพเจ้าต้องการสิ่งนั้นคืน" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ขโมยออกมาก่อนที่มันจะถูกส่งต่อ ข้าพเจ้าจะให้ทองคำเป็นค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_smuggling_run" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_smuggling_run_complete",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ดีเยี่ยม หลักฐานทั้งหมดจัดการแล้ว นี่ทองคำและของเพิ่มเติมจากข้าพเจ้า" },
    ],
    choices: [
      {
        text: "รับค่าจ้าง",
        effects: [{ t: "finishQuest", questId: "qe_changan_smuggling_run", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_changan_intimidate_judge_offer",
    lines: [
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "ผู้อาวุโสจูอิงแห่งพรรคสว่างมืด...คนนั้นทำงานเป็นที่ปรึกษาคดีที่จะเปิดโปงข้าพเจ้า" },
      { t: "narration", text: "ขุนนางหยานพูดเสียงเย็นชา ไร้อารมณ์" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "เขาต้องไม่มีชีวิตอยู่ในวันที่คดีนั้นเริ่มต้น ท่านเข้าใจไหม?" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_changan_intimidate_judge" }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_changan_corrupt_official_yan_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_changan_intimidate_judge_complete",
    lines: [
      { t: "narration", text: "ขุนนางหยานรับข่าวโดยไม่แสดงสีหน้า แล้วพยักหน้าเล็กน้อย" },
      { t: "dialogue", speaker: "ขุนนางหยาน", text: "คดีนั้นจะไม่มีวันเกิดขึ้น ท่านได้ช่วยรักษาตำแหน่งของข้าพเจ้าไว้ นี่ค่าตอบแทนสูงสุดที่ข้าพเจ้าเคยจ่าย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_changan_intimidate_judge", success: true }],
        next: "npc_evil_changan_corrupt_official_yan_talk",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_treasure_bandit_chief_qing (6 quests, EVIL-A)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "qs_qe_treasure_caravan_raid_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "มีกองคาราวานผ่านมาพรุ่งนี้ ของหนักดี แต่ยามคุ้มกันก็แกร่ง" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ลูกน้องข้าพร้อมปล้น แต่ต้องกำจัดยามก่อน นั่นคืองานของคุณ" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_caravan_raid" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_caravan_raid_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ฮ่าฮ่า! การปล้นสำเร็จ ลูกน้องข้าได้ของดีไปเต็ม ๆ นี่ส่วนแบ่งของคุณ" },
    ],
    choices: [
      {
        text: "รับส่วนแบ่ง",
        effects: [{ t: "finishQuest", questId: "qe_treasure_caravan_raid", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_treasure_mountain_purge_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "มีนักดาบพเนจรสองสามคนเดินวนเวียนแถวถ้ำข้า ดูไม่ธรรมดา อาจเป็นสายลับ" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ข้าไม่ชอบคนที่มาสอดแนม กำจัดพวกนั้นทิ้งก่อนที่จะกลับไปรายงาน" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_mountain_purge" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_mountain_purge_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ดี พื้นที่ปลอดภัยแล้ว ข้าชอบคนทำงานตรงไปตรงมาแบบนี้ นี่ค่าจ้าง" },
    ],
    choices: [
      {
        text: "รับเงิน",
        effects: [{ t: "finishQuest", questId: "qe_treasure_mountain_purge", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_treasure_steal_horde_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "พวกสำนักดาบโลหิตซ่อนสมบัติจำนวนหนึ่งไว้ที่ทูตเซี่ยของพวกเขา ข้าต้องการสิ่งนั้น" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "เซี่ยแข็งแกร่ง ถ้าจะขโมยต้องเก่งพอ ทำได้ไหม?" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_steal_horde" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_steal_horde_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ฮ่าฮ่า! ขโมยจากสำนักดาบโลหิตได้จริง ๆ คุณเก่งกว่าที่ข้าคิด นี่ส่วนแบ่งใหญ่" },
    ],
    choices: [
      {
        text: "รับส่วนแบ่ง",
        effects: [{ t: "finishQuest", questId: "qe_treasure_steal_horde", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_treasure_kidnap_lord_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "เจ้าบ้านเหยินเฟิง ตระกูลรวย ที่ดินมาก ทองคำมากมาย แต่ไม่ยอมบริจาคให้กับคนที่ต้องการ" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "จับตัวเขามาเป็นประกัน ค่าไถ่จะทำให้ลูกน้องข้ากินอิ่มได้หลายเดือน แบ่งให้คุณยุติธรรม" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_kidnap_lord" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_kidnap_lord_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "เยี่ยมมาก! ตัวประกันอยู่ที่ถ้ำแล้ว ครอบครัวเขากำลังรวบรวมค่าไถ่ นี่ส่วนแบ่งล่วงหน้าของคุณ" },
    ],
    choices: [
      {
        text: "รับส่วนแบ่ง",
        effects: [{ t: "finishQuest", questId: "qe_treasure_kidnap_lord", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_treasure_kill_lawman_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "อาจารย์ดาบคนหนึ่งนำกองทหารมาตรวจสอบพื้นที่นี้ ถ้าปล่อยให้เขามาถึง มันจะยุ่ง" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ไปตัดหนทางเขาก่อน กำจัดอาจารย์ดาบนั้น กองทหารที่เหลือก็จะหยุดชะงัก" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_kill_lawman" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_kill_lawman_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ฮ่าฮ่า! กองทหารถอยไปแล้ว ไม่มีผู้นำก็ไม่มีกล้าหาญ คุณช่วยถ้ำข้าไว้ได้ นี่ค่าจ้าง" },
    ],
    choices: [
      {
        text: "รับเงิน",
        effects: [{ t: "finishQuest", questId: "qe_treasure_kill_lawman", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_treasure_clear_competitor_offer",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "สำนักนักฆ่าเงา พวกนั้นเริ่มรับงานที่ควรเป็นของข้า ข้าไม่ทนงานที่ถูกแย่ง" },
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ไปฆ่านักฆ่าเงาสักคนให้ข้าเห็น ส่งสัญญาณว่าพื้นที่นี้มีเจ้าของแล้ว" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_treasure_clear_competitor" }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_treasure_bandit_chief_qing_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_treasure_clear_competitor_complete",
    lines: [
      { t: "dialogue", speaker: "หัวหน้าโจรชิง", text: "ฮ่าฮ่า! นักฆ่าเงาพวกนั้นถอยออกไปจากพื้นที่ข้าแล้ว นี่โบนัสพิเศษจากข้า" },
    ],
    choices: [
      {
        text: "รับโบนัส",
        effects: [{ t: "finishQuest", questId: "qe_treasure_clear_competitor", success: true }],
        next: "npc_evil_treasure_bandit_chief_qing_talk",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // QUEST BEATS — evil_xueyu_envoy_xie (6 quests, EVIL-A)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "qs_qe_xueyu_sect_initiation_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ท่านต้องการเป็นส่วนหนึ่งของสำนักดาบโลหิต พิธีรับเข้าสำนักของเราไม่ใช่พิธีธรรมดา" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "นำตัวเจ้าอาวาสฮุยหยวนแห่งเส้าหลินมาให้ข้า — มีชีวิต เป็นการพิสูจน์ว่าท่านไม่ยึดติดกับ 'ความดี'" },
    ],
    choices: [
      {
        text: "รับการทดสอบ",
        effects: [{ t: "startQuest", questId: "qe_xueyu_sect_initiation" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_sect_initiation_complete",
    lines: [
      { t: "narration", text: "ทูตเซี่ยมองตัวประกันอย่างเย็นชา แล้วพยักหน้า" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ท่านผ่านการทดสอบแล้ว ยินดีต้อนรับสู่สำนักดาบโลหิต นี่ของขวัญจากข้าเพื่อเริ่มต้นการเดินทาง" },
    ],
    choices: [
      {
        text: "รับของขวัญ",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_sect_initiation", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_xueyu_kill_pure_monk_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "สำนักดาบโลหิตไม่มีที่ว่างสำหรับผู้ที่ยังยึดติดกับศีลธรรมเก่า ๆ" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "พิสูจน์ว่าท่านสามารถข้ามพ้นกรอบนั้นได้ — สังหารสาวกอู่ตัง คนหนึ่งก็พอ" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_xueyu_kill_pure_monk" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_kill_pure_monk_complete",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ดี ข้าได้ยินเรื่องราวแล้ว ท่านก้าวข้ามกรอบได้ นี่ค่าตอบแทนจากสำนัก" },
    ],
    choices: [
      {
        text: "รับค่าตอบแทน",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_kill_pure_monk", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_xueyu_kidnap_disciple_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ง้อไบ๊มีเทคนิควิชาที่สำนักดาบโลหิตสนใจ เราต้องการข้อมูลนั้น" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "จับตัวท่านนิ้วห้วนจิงฉานมา เธอรู้วิชาเยอะ และจะพูดในที่สุด" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_xueyu_kidnap_disciple" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_kidnap_disciple_complete",
    lines: [
      { t: "narration", text: "ทูตเซี่ยรับตัวประกันโดยไม่แสดงสีหน้า แล้วมอบถุงเงินให้" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "งานดี เธอจะให้ข้อมูลที่สำนักต้องการ ท่านได้รับความไว้วางใจจากข้าเพิ่มขึ้น" },
    ],
    choices: [
      {
        text: "รับค่าตอบแทน",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_kidnap_disciple", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_xueyu_steal_sutra_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "เส้าหลินมีพระสูตรโบราณที่เจ้าอาวาสฮุยหยวนเก็บไว้ในห้องลับ เราต้องการมัน" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ขโมยออกมาโดยไม่ให้รู้ตัว — ถ้าทำให้เส้าหลินสงสัย มันจะยุ่งยากกว่านี้มาก" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_xueyu_steal_sutra" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_steal_sutra_complete",
    lines: [
      { t: "narration", text: "ทูตเซี่ยรับพระสูตรมาด้วยความระมัดระวัง แล้วพยักหน้าพอใจ" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "สำนักดาบโลหิตจะศึกษาสิ่งนี้อย่างละเอียด ท่านได้ทำประโยชน์ให้สำนักอย่างมาก นี่ค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับค่าตอบแทน",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_steal_sutra", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_xueyu_silence_traitor_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "มีคนทรยศออกไปจากสำนัก และกำลังนำความลับไปขาย ข้าไม่ยอมให้มีการทรยศในสำนักดาบโลหิต" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ตามล่าและกำจัดเขา เขาซ่อนอยู่กับนักฆ่าเงา ทำให้เสร็จก่อนข่าวแพร่ออกไป" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_xueyu_silence_traitor" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_silence_traitor_complete",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "การทรยศถูกตัดทิ้งแล้ว ดี ท่านได้พิสูจน์ว่าเชื่อถือได้ นี่ค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับค่าตอบแทน",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_silence_traitor", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qe_xueyu_purge_village_offer",
    lines: [
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "หมู่บ้านใกล้สำนักมีพยานที่เห็นสิ่งที่ไม่ควรเห็น สำนักดาบโลหิตต้องการความเงียบ" },
      { t: "narration", text: "ทูตเซี่ยมองตรงมายังเจ้าตัวด้วยสายตาเย็นชา" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "ผู้อาวุโสสำนักท้องถิ่นปกป้องหมู่บ้านนั้น กำจัดเขาเสียก่อน แล้วงานที่เหลือจะง่ายขึ้น" },
    ],
    choices: [
      {
        text: "รับงาน",
        effects: [{ t: "startQuest", questId: "qe_xueyu_purge_village" }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
      { text: "ปฏิเสธ", next: "npc_evil_xueyu_envoy_xie_talk" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_xueyu_purge_village_complete",
    lines: [
      { t: "narration", text: "ทูตเซี่ยได้ยินรายงานโดยไม่แสดงอารมณ์ใด จากนั้นก็พยักหน้าอย่างช้า ๆ" },
      { t: "dialogue", speaker: "ทูตเซี่ย", text: "งานสำเร็จ สำนักดาบโลหิตปลอดภัยแล้ว ท่านได้พิสูจน์ว่าเป็นหนึ่งในพวกเรา นี่รางวัลสูงสุด" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        effects: [{ t: "finishQuest", questId: "qe_xueyu_purge_village", success: true }],
        next: "npc_evil_xueyu_envoy_xie_talk",
      },
    ],
  },
];
