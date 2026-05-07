import type { Scene } from "../../types";

// NPC ambient dialogs + quest beats for the 7 cities. Owned by content
// agent A. Every dialog scene id referenced from
// lib/world/data/npcs/cities.ts (`dialogSceneId`) and
// lib/world/data/quests/cities.ts (giver/turn-in flows) must resolve here.
export const SCENES_CITIES: readonly Scene[] = [

  // ═══════════════════════════════════════════════════════════════════
  // AMBIENT NPC DIALOGS
  // ═══════════════════════════════════════════════════════════════════

  // ─── city_capital_magistrate_wu ────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_capital_magistrate_wu_talk",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ท่านผู้เดินทางมาจากไหน? นครหลวงไม่ใช่สถานที่สำหรับคนที่ไม่มีธุระ" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "แต่ถ้าท่านมีฝีมือและจิตใจซื่อสัตย์ ข้ามีงานให้ทำหลายชิ้น บ้านเมืองนี้กำลังเต็มไปด้วยปัญหา" },
    ],
    choices: [
      { text: "รับฟังงานที่นายอำเภอมอบหมาย", next: "npc_city_capital_magistrate_wu_talk" },
      { text: "กลับไปสำรวจนครหลวง", next: "city_capital" },
    ],
  },

  // ─── city_capital_merchant_wang ────────────────────────────────────
  // Wang is the cross-city pickup / dropoff contact for the capital. He
  // doesn't offer or turn in any quest himself — branches are gated by
  // the active quest + inventory state and just hand over (or take) the
  // quest item.
  {
    kind: "dialog",
    id: "npc_city_capital_merchant_wang_talk",
    lines: [
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "ยินดีต้อนรับสู่ร้านข้า ของหายากจากทั่วยุทธจักรอยู่ที่นี่" },
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "ลูกค้าจากเมืองไหนล่ะ? ถ้าฝากของไว้ส่งให้ ข้ามักรับไว้แล้วรอเจ้าของมารับ" },
    ],
    choices: [
      // Spice pickup — for พ่อครัวซู (yangzhou).
      {
        text: "ข้ามาจากพ่อครัวซู หยางโจว — ขอรับเครื่องเทศพิเศษ",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qc_yangzhou_spice_delivery", status: "active" },
            { t: "not", of: { t: "hasItem", itemId: "qst_capital_spice", count: 1 } },
          ],
        },
        next: "qs_qc_yangzhou_spice_delivery_pickup",
      },
      // Silk dropoff — for ช่างทอเหมย (suzhou). Take the silk, hand over receipt.
      {
        text: "ข้ามาจากช่างทอเหมย ซูโจว — ส่งผ้าไหมราชสำนัก",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qc_suzhou_silk_shipment", status: "active" },
            { t: "hasItem", itemId: "qst_capital_silk", count: 1 },
            { t: "not", of: { t: "hasItem", itemId: "qst_capital_silk_receipt", count: 1 } },
          ],
        },
        next: "qs_qc_suzhou_silk_shipment_handoff",
      },
      { text: "ลาจาก", next: "city_capital" },
    ],
  },

  // ─── city_capital_physician_lin ────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_capital_physician_lin_talk",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "เจ็บป่วยหรือเปล่า? คลินิกเล็ก ๆ ของข้ายินดีรักษาทุกอาการ" },
      { t: "dialogue", speaker: "หมอหลิน", text: "ตำรับยาของข้าสืบทอดมาหลายชั่วคน แต่ช่วงนี้มีคนพยายามขโมยความรับรู้ น่ากังวลนัก" },
    ],
    choices: [
      { text: "ถามเรื่องยาสมุนไพร", next: "npc_city_capital_physician_lin_talk" },
      { text: "ลาจาก", next: "city_capital" },
    ],
  },

  // ─── city_xixia_blacksmith_dugu ────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_xixia_blacksmith_dugu_talk",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "งานตีเหล็กต้องการใจที่นิ่งและแขนที่แข็งแกร่ง ไม่ต่างจากการฝึกกระบี่" },
      { t: "dialogue", speaker: "ช่างดูกู", text: "ข้าตีอาวุธมาหลายสิบปี แต่ช่วงนี้แร่เหล็กขาดแคลน พวกโจรปล้นกองคาราวานแร่อยู่เรื่อย" },
    ],
    choices: [
      { text: "เสนอช่วยเหลือเรื่องแร่", next: "npc_city_xixia_blacksmith_dugu_talk" },
      { text: "ดูผลงานการตีเหล็ก", next: "npc_city_xixia_blacksmith_dugu_talk" },
      { text: "ลาจาก", next: "city_xixia" },
    ],
  },

  // ─── city_dali_scholar_duan ────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_dali_scholar_duan_talk",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "สกุลต้วนสร้างอาณาจักรด้วยปัญญาและดาบ ข้าสืบสานมรดกนั้นด้วยการบันทึกประวัติศาสตร์" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "มีคัมภีร์โบราณชิ้นหนึ่งที่ข้าตามหาอยู่นาน หากท่านสนใจช่วย ข้าจะรู้สึกขอบคุณอย่างยิ่ง" },
    ],
    choices: [
      // Coded-letter translation: take encrypted letter, hand back decoded.
      {
        text: "ขอให้แปลจดหมายรหัสลับจากนักยุทธศาสตร์กง",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qc_jinling_coded_letter", status: "active" },
            { t: "hasItem", itemId: "qst_dali_encrypted", count: 1 },
            { t: "not", of: { t: "hasItem", itemId: "qst_dali_decoded", count: 1 } },
          ],
        },
        next: "qs_qc_jinling_coded_letter_translate",
      },
      { text: "รับฟังเรื่องคัมภีร์โบราณ", next: "npc_city_dali_scholar_duan_talk" },
      { text: "ถามเรื่องประวัติสกุลต้วน", next: "npc_city_dali_scholar_duan_talk" },
      { text: "ลาจาก", next: "city_dali" },
    ],
  },

  // ─── city_dali_herbalist_bai ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_dali_herbalist_bai_talk",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ต้าหลี่มีสมุนไพรหายากมากมาย แต่ต้องรู้จักแยกแยะพืชที่เป็นประโยชน์จากพืชพิษ" },
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ตำรายาของข้าบอกวิธีเก็บสมุนไพรทุกฤดูกาล ถ้าท่านช่วยนำพืชบางชนิดมาให้ได้ ข้าจะสอนความรู้บางอย่างให้" },
    ],
    choices: [
      { text: "เสนอช่วยเก็บสมุนไพร", next: "npc_city_dali_herbalist_bai_talk" },
      { text: "ลาจาก", next: "city_dali" },
    ],
  },

  // ─── city_yangzhou_chef_su ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_yangzhou_chef_su_talk",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "อาหารหยางโจวขึ้นชื่อเรื่องความสดของปลา ถ้าใช้ปลาดี ฝีมือปานกลางก็ออกมาดีได้" },
      { t: "dialogue", speaker: "พ่อครัวซู", text: "แต่ช่วงนี้ต้องการปลามังกรมาทำเมนูพิเศษ ลูกค้าขาใหญ่จองไว้แล้ว หาไม่ได้จะเสียหน้าหนัก" },
    ],
    choices: [
      { text: "รับปากหาปลามังกร", next: "npc_city_yangzhou_chef_su_talk" },
      { text: "ถามเรื่องสูตรอาหาร", next: "npc_city_yangzhou_chef_su_talk" },
      { text: "ลาจาก", next: "city_yangzhou" },
    ],
  },

  // ─── city_yangzhou_fisherman_chen ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_yangzhou_fisherman_chen_talk",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "ข้าหาปลาในแม่น้ำนี้มาตั้งแต่เด็ก รู้จักทุกกระแสน้ำ ทุกโขดหิน" },
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "แต่โจรสลัดมันมายึดท่าเรือทางเหนือ เพื่อนบ้านหลายคนเสียสินค้าไป ข้าแก่เกินจะสู้แล้ว" },
    ],
    choices: [
      { text: "เสนอจัดการโจรสลัด", next: "npc_city_yangzhou_fisherman_chen_talk" },
      { text: "ถามเรื่องสินค้าที่จม", next: "npc_city_yangzhou_fisherman_chen_talk" },
      { text: "ลาจาก", next: "city_yangzhou" },
    ],
  },

  // ─── city_suzhou_book_merchant_li ──────────────────────────────────
  // Li is the pickup contact for the dali missing-page delivery. He
  // doesn't offer or turn in any quest — branch is gated by the active
  // quest + inventory state.
  {
    kind: "dialog",
    id: "npc_city_suzhou_book_merchant_li_talk",
    lines: [
      { t: "dialogue", speaker: "พ่อค้าหนังสือลี่", text: "ร้านหนังสือเก่าของข้ามีต้นฉบับโบราณจากทั่วยุทธจักร นักประวัติศาสตร์มักแวะมาสืบที่นี่" },
      { t: "dialogue", speaker: "พ่อค้าหนังสือลี่", text: "ถ้าท่านตามหาเล่มเฉพาะ บอกชื่อสกุลผู้สนใจมาด้วย ข้ามักรู้ว่าใครซื้อขายอะไร" },
    ],
    choices: [
      // Missing-page pickup — for บัณฑิตต้วน (dali).
      {
        text: "ข้ามาจากบัณฑิตต้วน ต้าหลี่ — ขอหน้าหนังสือประวัติศาสตร์ที่หายไป",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qc_dali_missing_page", status: "active" },
            { t: "not", of: { t: "hasItem", itemId: "qst_dali_book_pages", count: 1 } },
          ],
        },
        next: "qs_qc_dali_missing_page_pickup",
      },
      { text: "ลาจาก", next: "city_suzhou" },
    ],
  },

  // ─── city_suzhou_weaver_mei ────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_suzhou_weaver_mei_talk",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ผ้าไหมซูโจวส่งถึงราชสำนักทุกปี ต้องการความประณีตถึงขีดสุด" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ปัญหาตอนนี้คือสีย้อมพิเศษที่ต้องใช้สมุนไพรหายาก แต่มีกลุ่มช่างปลอมมาขโมยลวดลายและลูกค้าด้วย" },
    ],
    choices: [
      { text: "ถามเรื่องกลุ่มช่างปลอม", next: "npc_city_suzhou_weaver_mei_talk" },
      { text: "เสนอหาสมุนไพรสีย้อม", next: "npc_city_suzhou_weaver_mei_talk" },
      { text: "ลาจาก", next: "city_suzhou" },
    ],
  },

  // ─── city_jinling_strategist_kong ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_jinling_strategist_kong_talk",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ข้าออกจากราชการเพราะเห็นความฉ้อฉลที่ไม่อาจแก้ไขได้จากข้างใน บางครั้งต้องทำงานนอกระบบ" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "มีเครือข่ายสายลับที่แทรกซึมสำนักบางแห่ง ข้าต้องการคนที่วางใจได้ไปสอบสวนให้" },
    ],
    choices: [
      // Royal-pardon hand-off: take the amnesty letter, hand back a receipt.
      {
        text: "ส่งหนังสือนิรโทษกรรมจากนายอำเภอหวู่",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qc_capital_royal_pardon", status: "active" },
            { t: "hasItem", itemId: "qst_amnesty_letter", count: 1 },
            { t: "not", of: { t: "hasItem", itemId: "qst_amnesty_receipt", count: 1 } },
          ],
        },
        next: "qs_qc_capital_royal_pardon_handoff",
      },
      { text: "รับฟังงานสอบสวน", next: "npc_city_jinling_strategist_kong_talk" },
      { text: "ถามเรื่องอดีตในราชการ", next: "npc_city_jinling_strategist_kong_talk" },
      { text: "ลาจาก", next: "city_jinling" },
    ],
  },

  // ─── city_changan_guard_yan ────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_city_changan_guard_yan_talk",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ประตูเมืองฉางอันต้องรักษาทุกคืน ข้าไม่เคยละหน้าที่แม้แต่คืนเดียว" },
      { t: "dialogue", speaker: "ยามหยาน", text: "แต่เมื่อคืนมีคนแอบผ่านเข้ามาได้โดยไม่รู้ว่าเป็นใคร และทหารของข้าคนหนึ่งหายไปด้วย ต้องการความช่วยเหลือ" },
    ],
    choices: [
      { text: "รับเรื่องสืบสวน", next: "npc_city_changan_guard_yan_talk" },
      { text: "ถามรายละเอียดเพิ่มเติม", next: "npc_city_changan_guard_yan_talk" },
      { text: "ลาจาก", next: "city_changan" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_capital_magistrate_wu
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_capital_lost_ledger ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_capital_lost_ledger_offer",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "บัญชีรายรับรายจ่ายของคลังหลวงหายไป มีคนขโมยจากห้องเก็บเอกสาร" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ข้าสงสัยว่าเสมียนนายฉิง ผู้ดูแลเอกสาร อาจรู้เห็นเป็นใจ แต่ยังไม่มีหลักฐาน" },
      { t: "narration", text: "นายอำเภอหวู่มองตาท่านอย่างตั้งใจ" },
    ],
    choices: [
      {
        text: "รับสืบสวนคดีบัญชีหาย",
        effects: [{ t: "startQuest", questId: "qc_capital_lost_ledger" }],
        next: "qs_qc_capital_lost_ledger_offer_accept",
      },
      { text: "ปฏิเสธ", next: "qs_qc_capital_lost_ledger_decline" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_lost_ledger_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ขอบคุณ ไปพบเสมียนนายฉิงที่ห้องทำงานก่อน แล้วสังเกตดูว่าเขาพูดอะไร" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_lost_ledger_decline",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "เข้าใจ แต่ถ้าเปลี่ยนใจก็กลับมาพูดคุยได้" },
    ],
    choices: [{ text: "ลาจาก", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_lost_ledger_progress",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ยังหาบัญชีไม่เจอหรือ? ลองตรวจดูหีบเก็บของส่วนตัวของนายฉิงให้ละเอียด" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_lost_ledger_complete",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ท่านพบบัญชีแล้ว ดีมาก ข้าจะนำเรื่องขึ้นรายงานเจ้าเมืองทันที" },
      { t: "narration", text: "นายอำเภอหวู่รับบัญชีไปด้วยมือสั่น ๆ ด้วยความโล่งอก" },
    ],
    choices: [
      {
        text: "ส่งมอบบัญชีและรับรางวัล",
        effects: [
          { t: "takeItem", itemId: "old_key", count: 1 },
          { t: "finishQuest", questId: "qc_capital_lost_ledger", success: true },
        ],
        next: "city_capital",
      },
    ],
  },

  // ── qc_capital_corrupt_clerk ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_capital_corrupt_clerk_offer",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "เสมียนคนหนึ่งในสำนักงานรับสินบนจากพ่อค้า ข้าต้องการหลักฐาน ไม่ใช่แค่ข่าวลือ" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ต้องการคนที่ไม่หน้าตาคุ้นกับพวกเสมียนไปสืบ เจ้าเหมาะมาก" },
    ],
    choices: [
      {
        text: "รับงานสืบสวนเสมียน",
        effects: [{ t: "startQuest", questId: "qc_capital_corrupt_clerk" }],
        next: "qs_qc_capital_corrupt_clerk_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_corrupt_clerk_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ปล่อยเสมียนอยู่ที่ร้านค้าทางตะวันออกก่อน สังเกตการพบปะของเขา แล้วกลับมารายงาน" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_corrupt_clerk_complete",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "หลักฐานที่ท่านนำมาเพียงพอแล้ว ข้าจะดำเนินการทางกฎหมายกับเสมียนคนนั้น" },
      { t: "narration", text: "นายอำเภอกล่าวด้วยน้ำเสียงหนักแน่น" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_capital_corrupt_clerk", success: true },
          { t: "addTrait", trait: "good", amount: 5 },
        ],
        next: "city_capital",
      },
    ],
  },

  // ── qc_capital_royal_pardon ────────────────────────────────────────
  // Refactored deliver-and-return:
  //   offer (Wu)        → giveItem qst_amnesty_letter
  //   handoff (Kong)    → takeItem letter, giveItem qst_amnesty_receipt
  //   complete (Wu)     → takeItem receipt, finishQuest
  {
    kind: "dialog",
    id: "qs_qc_capital_royal_pardon_offer",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "มีนักโทษรายหนึ่งถูกตัดสินอย่างไม่เป็นธรรม พยานเดียวที่รู้เรื่องอยู่ที่จินหลิง" },
      { t: "narration", text: "นายอำเภอพูดเบา ๆ ราวกับกลัวคนได้ยิน" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ขั้นตอน: 1) รับหนังสือนิรโทษกรรม 2) ไปจินหลิง · ส่งให้นักยุทธศาสตร์กง 3) นำใบรับกลับมาให้ข้า" },
    ],
    choices: [
      {
        text: "รับส่งหนังสือสำคัญ",
        effects: [
          { t: "startQuest", questId: "qc_capital_royal_pardon" },
          { t: "giveItem", itemId: "qst_amnesty_letter", count: 1 },
        ],
        next: "qs_qc_capital_royal_pardon_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_royal_pardon_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ขอบคุณ รีบไปจินหลิงก่อนที่คนเลวจะรู้ตัว ระวังตัวด้วย" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "นักยุทธศาสตร์กงจะเซ็นใบรับให้ — นำกลับมาเป็นหลักฐานว่าหนังสือถึงมือเขาแล้ว" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  // Kong's handoff branch — invoked from Kong's NPC talk (gating below).
  {
    kind: "dialog",
    id: "qs_qc_capital_royal_pardon_handoff",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "หนังสือจากนายอำเภอหวู่... อ่า เข้าใจแล้ว เรื่องนี้เกี่ยวพันกับพยานที่ข้าปกป้องไว้" },
      { t: "narration", text: "นักยุทธศาสตร์กงหยิบพู่กันลายเซ็นรับหนังสือลงในใบเล็ก ๆ" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "นี่คือใบรับ — นำกลับให้นายอำเภอหวู่เพื่อยืนยันว่าหนังสือถึงข้าแล้ว" },
    ],
    choices: [
      {
        text: "รับใบรับและออกเดินทาง",
        effects: [
          { t: "takeItem", itemId: "qst_amnesty_letter", count: 1 },
          { t: "giveItem", itemId: "qst_amnesty_receipt", count: 1 },
        ],
        next: "city_jinling",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_royal_pardon_complete",
    lines: [
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "ใบรับจากนักยุทธศาสตร์กง! ท่านทำได้สำเร็จ พยานจะถูกคุ้มครอง นักโทษจะได้รับอิสรภาพ" },
      { t: "dialogue", speaker: "นายอำเภอหวู่", text: "นี่คือรางวัลจากใจข้า ท่านช่วยชีวิตคนบริสุทธิ์ไว้ได้" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "takeItem", itemId: "qst_amnesty_receipt", count: 1 },
          { t: "finishQuest", questId: "qc_capital_royal_pardon", success: true },
          { t: "addTrait", trait: "good", amount: 10 },
        ],
        next: "city_capital",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_capital_physician_lin
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_capital_rare_herb ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_capital_rare_herb_offer",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "ข้าต้องการบัวหิมะสำหรับยาพิเศษ แต่มันขึ้นเฉพาะบนภูเขาสูง" },
      { t: "dialogue", speaker: "หมอหลิน", text: "ผู้ป่วยของข้ารอไม่ได้นาน ถ้าท่านพอมีฝีมือก็น่าจะไหว" },
    ],
    choices: [
      {
        text: "รับหาบัวหิมะ",
        effects: [{ t: "startQuest", questId: "qc_capital_rare_herb" }],
        next: "qs_qc_capital_rare_herb_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_rare_herb_offer_accept",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "ต้องการบัวหิมะอย่างน้อยหนึ่งดอก หาได้แล้วรีบนำมาส่ง เวลาสำคัญมาก" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_rare_herb_complete",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "บัวหิมะ! ดีมาก ข้าจะรีบนำไปปรุงยาทันที" },
      { t: "narration", text: "หมอหลินรับดอกไม้ไปด้วยมือที่สั่นด้วยความตื่นเต้น" },
      { t: "dialogue", speaker: "หมอหลิน", text: "ขอบคุณมาก ท่านช่วยชีวิตคนได้แล้ว รับสมุนไพรเหล่านี้ไปด้วย" },
    ],
    choices: [
      {
        text: "ส่งบัวหิมะและรับรางวัล",
        effects: [
          { t: "takeItem", itemId: "snow_lotus", count: 1 },
          { t: "finishQuest", questId: "qc_capital_rare_herb", success: true },
        ],
        next: "city_capital",
      },
    ],
  },

  // ── qc_capital_stolen_formula ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_capital_stolen_formula_offer",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "ตำรับยาลับของข้าถูกขโมยไป น่าจะเป็นฝีมือกลุ่มพ่อค้าที่ต้องการขายเป็นสูตรสำเร็จรูป" },
      { t: "dialogue", speaker: "หมอหลิน", text: "ข้าไม่ต้องการแก้แค้น แค่อยากได้ตำรับคืน มันมีบันทึกเกี่ยวกับพ่อของข้าอยู่ในนั้นด้วย" },
    ],
    choices: [
      {
        text: "รับงานตามหาตำรับยา",
        effects: [{ t: "startQuest", questId: "qc_capital_stolen_formula" }],
        next: "qs_qc_capital_stolen_formula_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_stolen_formula_offer_accept",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "ลองสืบว่าใครมาหาข้าในช่วงสองวันที่ผ่านมา มีคนแปลกหน้าหนึ่งคนที่ทำท่าน่าสงสัย" },
    ],
    choices: [{ text: "รับทราบ", next: "city_capital" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_capital_stolen_formula_complete",
    lines: [
      { t: "dialogue", speaker: "หมอหลิน", text: "ตำรับยา! ท่านตามคืนได้แล้ว... ขอบคุณจากใจ" },
      { t: "narration", text: "หมอหลินเปิดตำรับอย่างระมัดระวัง ตรวจดูทุกหน้าด้วยความโล่งใจ" },
    ],
    choices: [
      {
        text: "รับรางวัลความรู้ด้านยา",
        effects: [
          { t: "takeItem", itemId: "book_advanced", count: 1 },
          { t: "finishQuest", questId: "qc_capital_stolen_formula", success: true },
        ],
        next: "city_capital",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_xixia_blacksmith_dugu
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_xixia_iron_supply ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_xixia_iron_supply_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "แร่เหล็กขาดแคลน กองคาราวานที่ควรส่งมาถูกปล้นทางกลางดง" },
      { t: "dialogue", speaker: "ช่างดูกู", text: "ถ้าได้แร่เหล็กสิบก้อนมาข้าจะตีอาวุธดี ๆ ให้เป็นค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับนำแร่เหล็กมาส่ง",
        effects: [{ t: "startQuest", questId: "qc_xixia_iron_supply" }],
        next: "qs_qc_xixia_iron_supply_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_xixia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_iron_supply_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "ดี! หาแร่เหล็กจากเหมืองทางเหนือได้ หรือจะปราบโจรที่ยึดกองคาราวานก็ได้ เลือกเอา" },
    ],
    choices: [{ text: "รับทราบ", next: "city_xixia" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_iron_supply_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "แร่เหล็กครบสิบก้อน! ข้าจะได้ตีงานที่ค้างอยู่สำเร็จแล้ว" },
      { t: "narration", text: "ช่างดูกูยิ้มกว้าง หยิบใบมีดเหล็กที่ขัดจนวาวมาให้" },
    ],
    choices: [
      {
        text: "รับอาวุธเป็นค่าตอบแทน",
        effects: [
          { t: "takeItem", itemId: "iron_ore", count: 10 },
          { t: "finishQuest", questId: "qc_xixia_iron_supply", success: true },
        ],
        next: "city_xixia",
      },
    ],
  },

  // ── qc_xixia_legendary_blade ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_xixia_legendary_blade_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "ข้าฝันอยากตีดาบในตำนานสักเล่มก่อนตาย ต้องการแร่เทพ — แต่หายากมาก มีแค่ในถ้ำลึก" },
      { t: "dialogue", speaker: "ช่างดูกู", text: "ถ้าท่านนำแร่เทพมาสองก้อน ข้าจะตีดาบเหล็กกล้าที่ดีที่สุดในยุทธภพให้" },
    ],
    choices: [
      {
        text: "รับภารกิจแร่เทพ",
        effects: [{ t: "startQuest", questId: "qc_xixia_legendary_blade" }],
        next: "qs_qc_xixia_legendary_blade_offer_accept",
      },
      { text: "ปฏิเสธ (ยากเกินไป)", next: "city_xixia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_legendary_blade_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "แร่เทพมักพบในถ้ำที่มีสัตว์ดุร้ายอาศัย เตรียมตัวให้ดี อย่าประมาท" },
    ],
    choices: [{ text: "รับทราบ", next: "city_xixia" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_legendary_blade_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "แร่เทพ! ท่านทำได้จริง ๆ ... ข้าจะใช้เวลาหนึ่งวันตีดาบที่ดีที่สุดในชีวิต" },
      { t: "narration", text: "สามวันต่อมา ช่างดูกูส่งมอบดาบเหล็กกล้าที่วาวยิ่งกว่าน้ำแข็ง" },
    ],
    choices: [
      {
        text: "รับดาบเหล็กกล้า",
        effects: [
          { t: "takeItem", itemId: "mithril_ore", count: 2 },
          { t: "finishQuest", questId: "qc_xixia_legendary_blade", success: true },
        ],
        next: "city_xixia",
      },
    ],
  },

  // ── qc_xixia_bandit_ore ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_xixia_bandit_ore_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "โจรที่ปล้นกองคาราวานแร่มีหัวหน้าอยู่ที่ชายป่า ถ้าจัดการเขาได้ การค้าแร่จะคล่องตัวขึ้น" },
      { t: "dialogue", speaker: "ช่างดูกู", text: "ข้าไม่ได้ขอให้ฆ่า แค่ทำให้เขาหนีหรือยอมแพ้ก็พอ" },
    ],
    choices: [
      {
        text: "รับจัดการหัวหน้าโจร",
        effects: [{ t: "startQuest", questId: "qc_xixia_bandit_ore" }],
        next: "qs_qc_xixia_bandit_ore_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_xixia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_bandit_ore_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "หัวหน้าโจรคนนี้เคยเป็นนักรบด้วย อย่าประมาท ระวังตัวให้ดี" },
    ],
    choices: [{ text: "รับทราบ", next: "city_xixia" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_xixia_bandit_ore_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างดูกู", text: "หัวหน้าโจรหนีไปแล้ว กองคาราวานแร่ผ่านมาได้ปกติ ขอบคุณมาก" },
      { t: "narration", text: "ช่างดูกูจับมือท่านแน่น" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_xixia_bandit_ore", success: true },
          { t: "addNpcRelationship", npcId: "city_xixia_blacksmith_dugu", amount: 10 },
        ],
        next: "city_xixia",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_dali_scholar_duan
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_dali_ancient_scroll ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_dali_ancient_scroll_offer",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "คัมภีร์โบราณสมัยราชวงศ์เก่าถูกทิ้งในวัดร้างที่ภูเขา ข้าอยากได้มาแปลก่อนที่มันจะผุพัง" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "แต่วัดร้างนั้นมีสัตว์ป่าอยู่ ข้าเองไม่ถนัดการต่อสู้" },
    ],
    choices: [
      {
        text: "รับไปนำคัมภีร์มาให้",
        effects: [{ t: "startQuest", questId: "qc_dali_ancient_scroll" }],
        next: "qs_qc_dali_ancient_scroll_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_ancient_scroll_offer_accept",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "วัดร้างอยู่ทางเหนือของต้าหลี่ เดินไม่เกินครึ่งวัน คัมภีร์น่าจะอยู่ในห้องสมุดเก่าของวัด" },
    ],
    choices: [{ text: "รับทราบ", next: "city_dali" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_ancient_scroll_complete",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "คัมภีร์ยังสมบูรณ์ดี! นี่คือบันทึกเทคนิควิชาภายในของปรมาจารย์สมัยก่อน น่าทึ่งมาก" },
      { t: "narration", text: "บัณฑิตต้วนเปิดอ่านคัมภีร์ด้วยตาที่เป็นประกาย" },
    ],
    choices: [
      {
        text: "รับรางวัลความรู้",
        effects: [
          { t: "takeItem", itemId: "book_basic", count: 1 },
          { t: "finishQuest", questId: "qc_dali_ancient_scroll", success: true },
        ],
        next: "city_dali",
      },
    ],
  },

  // ── qc_dali_history_route ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_dali_history_route_offer",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "ข้าจัดทำแผนที่ประวัติศาสตร์ของยุทธภพ ต้องการคนไปยืนยันว่าสถานที่บางแห่งยังมีอยู่" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "โดยเฉพาะซูโจว ซึ่งข้าไม่เคยไปเอง ช่วยไปสักครั้งและกลับมาบอกสภาพปัจจุบันได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจสำรวจซูโจว",
        effects: [{ t: "startQuest", questId: "qc_dali_history_route" }],
        next: "qs_qc_dali_history_route_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_history_route_offer_accept",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "เดินทางไปซูโจวแล้วกลับมาเล่าให้ฟัง สิ่งที่น่าสนใจที่สุดคือตลาดผ้าไหม" },
    ],
    choices: [{ text: "รับทราบ", next: "city_dali" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_history_route_complete",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "ท่านไปซูโจวกลับมาแล้ว เล่าให้ฟังสักหน่อย — ตลาดผ้าไหมเป็นยังไงบ้าง?" },
      { t: "narration", text: "ท่านเล่าเรื่องซูโจวให้บัณฑิตต้วนฟัง เขาจดบันทึกอย่างขยันขันแข็ง" },
    ],
    choices: [
      {
        text: "รายงานสภาพซูโจวและรับรางวัล",
        effects: [
          { t: "finishQuest", questId: "qc_dali_history_route", success: true },
          { t: "addNpcRelationship", npcId: "city_dali_scholar_duan", amount: 8 },
        ],
        next: "city_dali",
      },
    ],
  },

  // ── qc_dali_missing_page ───────────────────────────────────────────
  // Refactored fetch flow:
  //   offer (Duan, dali)        → start quest
  //   pickup (Li, suzhou)       → giveItem qst_dali_book_pages
  //   complete (Duan, dali)     → takeItem qst_dali_book_pages, finishQuest
  {
    kind: "dialog",
    id: "qs_qc_dali_missing_page_offer",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "หนังสือประวัติศาสตร์เล่มสำคัญของข้าขาดหน้าตอนกลาง พ่อค้าหนังสือลี่ที่ซูโจวซื้อไปโดยไม่รู้ว่าเป็นของข้า" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "ขั้นตอน: 1) ไปซูโจว 2) คุยพ่อค้าหนังสือลี่เพื่อขอหน้าหนังสือคืน 3) นำกลับมาให้ข้า" },
    ],
    choices: [
      {
        text: "รับภารกิจตามหาหน้าหนังสือ",
        effects: [{ t: "startQuest", questId: "qc_dali_missing_page" }],
        next: "qs_qc_dali_missing_page_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_missing_page_offer_accept",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "พ่อค้าหนังสือลี่อยู่ที่ร้านหนังสือริมน้ำในซูโจว บอกชื่อสกุลต้วน เขาจะรู้ว่าใครส่งท่านมา" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "ข้าได้จ่ายค่าทดแทนล่วงหน้าให้เขาแล้ว ท่านเพียงไปรับหน้าหนังสือกลับมา" },
    ],
    choices: [{ text: "รับทราบ", next: "city_dali" }],
  },
  // Li's pickup branch — invoked from npc_city_suzhou_book_merchant_li_talk.
  {
    kind: "dialog",
    id: "qs_qc_dali_missing_page_pickup",
    lines: [
      { t: "dialogue", speaker: "พ่อค้าหนังสือลี่", text: "อา หน้าหนังสือของสกุลต้วน — ข้าเก็บรักษาไว้รอเจ้าของจริงตามที่บัณฑิตต้วนสั่ง" },
      { t: "narration", text: "พ่อค้าลี่ดึงห่อกระดาษเก่าออกจากหีบไม้ ปลายกระดาษมีตราสกุลต้วน" },
      { t: "dialogue", speaker: "พ่อค้าหนังสือลี่", text: "นำกลับให้บัณฑิตต้วน หากท่านพบเล่มอื่น ๆ ของท่าน อย่าลืมแวะมาบอกข้านะ" },
    ],
    choices: [
      {
        text: "รับหน้าหนังสือและออกเดินทาง",
        effects: [{ t: "giveItem", itemId: "qst_dali_book_pages", count: 1 }],
        next: "city_suzhou",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_missing_page_complete",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "ท่านได้คืนมาแล้ว! หน้านี้สำคัญมาก บันทึกวันที่สกุลต้วนก่อตั้งอาณาจักร" },
      { t: "narration", text: "บัณฑิตต้วนอ่านหน้านั้นซ้ำแล้วซ้ำเล่าด้วยความชื่นชม" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "takeItem", itemId: "qst_dali_book_pages", count: 1 },
          { t: "finishQuest", questId: "qc_dali_missing_page", success: true },
        ],
        next: "city_dali",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_dali_herbalist_bai
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_dali_herb_collection ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_dali_herb_collection_offer",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ข้าต้องการโสมห้าหัวสำหรับยาล็อตใหญ่ที่จะส่งออก แต่ตอนนี้ถิ่นที่หาโสมมีสัตว์ป่าชุม" },
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ถ้าท่านช่วยเก็บมาได้ ข้าจะสอนวิธีใช้สมุนไพรรักษาตัวให้" },
    ],
    choices: [
      {
        text: "รับเก็บโสม",
        effects: [{ t: "startQuest", questId: "qc_dali_herb_collection" }],
        next: "qs_qc_dali_herb_collection_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_herb_collection_offer_accept",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "โสมที่ดีจะมีกลิ่นหอมเย็นและรากอวบอ้วน หาได้ตามชายป่าชื้น กลับมาพร้อมโสมห้าหัวได้เลย" },
    ],
    choices: [{ text: "รับทราบ", next: "city_dali" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_herb_collection_complete",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "โสมห้าหัว ครบถ้วน! ทุกหัวสดใหม่และมีคุณภาพดีมาก" },
      { t: "narration", text: "หมอยาไป๋แสดงขั้นตอนการเตรียมยาเบื้องต้นให้ดู" },
      { t: "dialogue", speaker: "หมอยาไป๋", text: "นี่คือยาฟื้นพลังที่ข้าปรุงไว้ ใช้ในยามจำเป็น" },
    ],
    choices: [
      {
        text: "รับโสมและยา",
        effects: [
          { t: "takeItem", itemId: "ginseng", count: 5 },
          { t: "finishQuest", questId: "qc_dali_herb_collection", success: true },
        ],
        next: "city_dali",
      },
    ],
  },

  // ── qc_dali_venom_beast ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_dali_venom_beast_offer",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "งูเห่ายักษ์ตัวหนึ่งทำให้ชาวบ้านแถวนี้ถูกกัดบ่อยมาก ข้าต้องการพิษมันเพื่อทำยาต้านพิษ" },
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ถ้าท่านไปสู้กับมันและนำพิษมาให้ ข้าจะปรุงยาต้านพิษไว้แจกชาวบ้านฟรี" },
    ],
    choices: [
      {
        text: "รับปราบงูเห่ายักษ์",
        effects: [{ t: "startQuest", questId: "qc_dali_venom_beast" }],
        next: "qs_qc_dali_venom_beast_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_venom_beast_offer_accept",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "งูเห่ายักษ์อยู่ที่ป่าชายเขาทางตะวันออก หากสู้ชนะ นำพิษมาส่งด้วย อย่าสัมผัสด้วยมือเปล่า" },
    ],
    choices: [{ text: "รับทราบ", next: "city_dali" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_dali_venom_beast_complete",
    lines: [
      { t: "dialogue", speaker: "หมอยาไป๋", text: "ท่านชนะงูเห่าและนำพิษมาให้ได้! ดีมาก ข้าจะรีบปรุงยาให้ชาวบ้าน" },
      { t: "narration", text: "หมอยาไป๋รับพิษด้วยแว่นพิเศษ ก่อนจะหยิบยาฟื้นพลังมาให้" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "takeItem", itemId: "viper_venom", count: 1 },
          { t: "finishQuest", questId: "qc_dali_venom_beast", success: true },
          { t: "addTrait", trait: "good", amount: 5 },
        ],
        next: "city_dali",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_yangzhou_chef_su
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_yangzhou_rare_fish ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_rare_fish_offer",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ลูกค้าขาใหญ่จองเมนูพิเศษ ต้องใช้ปลามังกร แต่ข้าหาไม่ได้เลย" },
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ฝีมือท่านดูดี ลองหาปลามังกรในแม่น้ำลึกให้ข้าได้ไหม? ค่าตอบแทนดีแน่" },
    ],
    choices: [
      {
        text: "รับหาปลามังกร",
        effects: [{ t: "startQuest", questId: "qc_yangzhou_rare_fish" }],
        next: "qs_qc_yangzhou_rare_fish_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_rare_fish_offer_accept",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ปลามังกรชอบอยู่ใต้น้ำลึก ใกล้โขดหินแม่น้ำ ตกยากหน่อยแต่คุ้มค่า" },
    ],
    choices: [{ text: "รับทราบ", next: "city_yangzhou" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_rare_fish_complete",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ปลามังกร! สวยงามมาก เกล็ดสีรุ้งเลยทีเดียว..." },
      { t: "narration", text: "พ่อครัวซูหยิบปลาขึ้นมาตรวจดูด้วยแววตาคนชอบอาหาร" },
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ข้าจะทำมื้ออาหารที่ดีที่สุดในชีวิต รับค่าตอบแทนไปเลย" },
    ],
    choices: [
      {
        text: "รับค่าจ้างและลาจาก",
        effects: [
          { t: "takeItem", itemId: "fish_dragon", count: 1 },
          { t: "finishQuest", questId: "qc_yangzhou_rare_fish", success: true },
        ],
        next: "city_yangzhou",
      },
    ],
  },

  // ── qc_yangzhou_spice_delivery ─────────────────────────────────────
  // Refactored fetch flow:
  //   offer (here, Su)   → start quest, no items yet
  //   pickup (Wang, capital) → giveItem qst_capital_spice, stage 0 auto-advances
  //   complete (Su)      → takeItem qst_capital_spice, finishQuest
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_spice_delivery_offer",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ข้าสั่งเครื่องเทศพิเศษไว้กับพ่อค้าหวังในนครหลวง ต้องการคนเชื่อใจไปรับและนำกลับมาที่หยางโจว" },
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ขั้นตอน: 1) ไปนครหลวง 2) คุยพ่อค้าหวังเพื่อรับเครื่องเทศ 3) นำกลับมาส่งให้ข้าที่นี่" },
    ],
    choices: [
      {
        text: "รับงานนำส่งเครื่องเทศ",
        effects: [{ t: "startQuest", questId: "qc_yangzhou_spice_delivery" }],
        next: "qs_qc_yangzhou_spice_delivery_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_spice_delivery_offer_accept",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ดีแล้ว ไปพบพ่อค้าหวังที่นครหลวง บอกว่ามาจากข้า เขาจะมอบเครื่องเทศให้" },
      { t: "dialogue", speaker: "พ่อครัวซู", text: "พกของให้ดีและรีบกลับมาทันที — ราคาของแพง อย่าให้ใครเห็น" },
    ],
    choices: [{ text: "รับทราบ", next: "city_yangzhou" }],
  },
  // Wang's pickup branch — invoked from Wang's NPC dialog (gating in
  // npc_city_capital_merchant_wang_talk). giveItem triggers the stage-0
  // autoAdvance via tickQuestProgress.
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_spice_delivery_pickup",
    lines: [
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "อา ผู้แทนพ่อครัวซู ของล็อตนี้รออยู่นานแล้ว" },
      { t: "narration", text: "พ่อค้าหวังหยิบห่อใบบัวจากชั้นด้านในร้าน ภายในมีเครื่องเทศกลิ่นแรง" },
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "นำกลับให้พ่อครัวซูที่หยางโจวด้วย ข้าจะรอรายงานเมื่อท่านถึงปลายทาง" },
    ],
    choices: [
      {
        text: "รับเครื่องเทศและออกเดินทาง",
        effects: [{ t: "giveItem", itemId: "qst_capital_spice", count: 1 }],
        next: "city_capital",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_spice_delivery_complete",
    lines: [
      { t: "dialogue", speaker: "พ่อครัวซู", text: "ท่านนำเครื่องเทศมาส่งได้สำเร็จ! นี่คือของหายากที่สุดในยุทธภพ" },
      { t: "narration", text: "พ่อครัวซูดมกลิ่นเครื่องเทศแล้วหลับตาเหมือนคนมีความสุข" },
    ],
    choices: [
      {
        text: "รับค่าจ้างและลาจาก",
        effects: [
          { t: "takeItem", itemId: "qst_capital_spice", count: 1 },
          { t: "finishQuest", questId: "qc_yangzhou_spice_delivery", success: true },
          { t: "addNpcRelationship", npcId: "city_yangzhou_chef_su", amount: 8 },
        ],
        next: "city_yangzhou",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_yangzhou_fisherman_chen
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_yangzhou_river_pirates ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_river_pirates_offer",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "โจรสลัดแม่น้ำนำโดยหัวหน้าที่ชาวบ้านเรียกว่า 'กัปตันน้ำแดง' ยึดท่าเรือทางเหนือมาหลายเดือน" },
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "ถ้าท่านปราบโจรสลัดอย่างน้อยสามคน อิทธิพลเขาจะลดลงและท่าเรือจะปลอดภัยขึ้น" },
    ],
    choices: [
      {
        text: "รับจัดการโจรสลัด",
        effects: [{ t: "startQuest", questId: "qc_yangzhou_river_pirates" }],
        next: "qs_qc_yangzhou_river_pirates_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_river_pirates_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "โจรสลัดเหล่านี้มักพบที่แม่น้ำทางเหนือของหยางโจว ออกเดินทางกลางวันจะปลอดภัยกว่า" },
    ],
    choices: [{ text: "รับทราบ", next: "city_yangzhou" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_river_pirates_complete",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "ท่านปราบโจรสลัดไปสามคนแล้ว! ข่าวแพร่ออกไป กลุ่มกัปตันน้ำแดงเริ่มถอนตัวออกจากท่าเรือ" },
      { t: "narration", text: "ชาวประมงเฉินน้ำตาซึม" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_yangzhou_river_pirates", success: true },
          { t: "addTrait", trait: "fame", amount: 5 },
          { t: "addTrait", trait: "good", amount: 5 },
        ],
        next: "city_yangzhou",
      },
    ],
  },

  // ── qc_yangzhou_sunken_cargo ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_sunken_cargo_offer",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "เรือสินค้าของข้าจมเมื่อสองวันก่อนตอนโจรสลัดโจมตี มีหีบทองแดงอยู่ในนั้น" },
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "ข้าไม่อาจดำน้ำด้วยตัวเองได้ ถ้าท่านช่วยกู้ขึ้นมาได้ แบ่งครึ่งกันก็ยังดี" },
    ],
    choices: [
      {
        text: "รับภารกิจกู้สินค้าจม",
        effects: [{ t: "startQuest", questId: "qc_yangzhou_sunken_cargo" }],
        next: "qs_qc_yangzhou_sunken_cargo_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_sunken_cargo_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "เรือจมอยู่ที่แก่งโขดหินทางเหนือ น้ำไม่ลึกมาก แต่กระแสแรง ระวังตัวด้วย" },
    ],
    choices: [{ text: "รับทราบ", next: "city_yangzhou" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_yangzhou_sunken_cargo_complete",
    lines: [
      { t: "dialogue", speaker: "ชาวประมงเฉิน", text: "ท่านกู้หีบขึ้นมาได้แล้ว! มีแร่ทองแดงอยู่ในนั้น ตามที่ตกลงแบ่งกัน" },
      { t: "narration", text: "ชาวประมงเฉินยิ้มอย่างโล่งอก" },
    ],
    choices: [
      {
        text: "รับแร่ทองแดงและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_yangzhou_sunken_cargo", success: true },
          { t: "addNpcRelationship", npcId: "city_yangzhou_fisherman_chen", amount: 10 },
        ],
        next: "city_yangzhou",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_suzhou_weaver_mei
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_suzhou_silk_shipment ────────────────────────────────────────
  // Refactored deliver-and-return:
  //   offer (Mei)        → giveItem qst_capital_silk
  //   handoff (Wang)     → takeItem silk, giveItem qst_capital_silk_receipt
  //   complete (Mei)     → takeItem receipt, finishQuest
  {
    kind: "dialog",
    id: "qs_qc_suzhou_silk_shipment_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ผ้าไหมล็อตสำคัญสำหรับราชสำนักต้องส่งให้พ่อค้าหวังที่นครหลวงภายในสามวัน คนนำส่งเดิมล้มป่วยกะทันหัน" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ขั้นตอน: 1) รับผ้าไหม 2) ไปนครหลวง · ส่งให้พ่อค้าหวังและรับใบรับ 3) นำใบรับกลับมาให้ข้า" },
    ],
    choices: [
      {
        text: "รับงานนำส่งผ้าไหม",
        effects: [
          { t: "startQuest", questId: "qc_suzhou_silk_shipment" },
          { t: "giveItem", itemId: "qst_capital_silk", count: 1 },
        ],
        next: "qs_qc_suzhou_silk_shipment_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_suzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_silk_shipment_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ดีแล้ว ไปพบพ่อค้าหวังที่ร้านในนครหลวง บอกว่ามาจากข้า เขาจะรับสินค้าและเซ็นใบรับให้" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "นำใบรับกลับมาให้ข้า ราชสำนักดูแลเราจากเงื่อนไขในใบรับนั้น" },
    ],
    choices: [{ text: "รับทราบ", next: "city_suzhou" }],
  },
  // Wang's handoff branch — invoked from Wang's NPC talk dialog.
  {
    kind: "dialog",
    id: "qs_qc_suzhou_silk_shipment_handoff",
    lines: [
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "อา ผ้าไหมล็อตราชสำนักจากซูโจว — ข้ารอมาหลายวันแล้ว" },
      { t: "narration", text: "พ่อค้าหวังตรวจคุณภาพผ้าไหมอย่างพิถีพิถัน แล้วเซ็นใบรับสินค้า" },
      { t: "dialogue", speaker: "พ่อค้าหวัง", text: "นี่คือใบรับ — นำกลับให้ช่างทอเหมยเป็นหลักฐานว่าสินค้าถึงมือข้าครบถ้วน" },
    ],
    choices: [
      {
        text: "รับใบรับและออกเดินทาง",
        effects: [
          { t: "takeItem", itemId: "qst_capital_silk", count: 1 },
          { t: "giveItem", itemId: "qst_capital_silk_receipt", count: 1 },
        ],
        next: "city_capital",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_silk_shipment_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ใบรับสินค้า! ท่านส่งตรงเวลา ราชสำนักจะพอใจมาก" },
      { t: "narration", text: "ช่างทอเหมยคำนับขอบคุณ" },
    ],
    choices: [
      {
        text: "รับค่าตอบแทนและลาจาก",
        effects: [
          { t: "takeItem", itemId: "qst_capital_silk_receipt", count: 1 },
          { t: "finishQuest", questId: "qc_suzhou_silk_shipment", success: true },
        ],
        next: "city_suzhou",
      },
    ],
  },

  // ── qc_suzhou_dye_ingredient ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_suzhou_dye_ingredient_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "สีย้อมพิเศษที่ทำให้ผ้าไหมของข้าต่างจากคนอื่นต้องใช้เม็ดบัวจากป่าชุ่มน้ำ" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "แต่ฤดูนี้ป่ามีสัตว์ป่าชุม ช่วยเก็บเม็ดบัวห้าหัวมาให้ได้ไหม?" },
    ],
    choices: [
      {
        text: "รับเก็บเม็ดบัว",
        effects: [{ t: "startQuest", questId: "qc_suzhou_dye_ingredient" }],
        next: "qs_qc_suzhou_dye_ingredient_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_suzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_dye_ingredient_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ป่าชุ่มน้ำอยู่ทางใต้ของซูโจว เม็ดบัวที่ดีต้องเก็บก่อนดอกบานเต็มที่" },
    ],
    choices: [{ text: "รับทราบ", next: "city_suzhou" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_dye_ingredient_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "เม็ดบัวห้าหัว สมบูรณ์ทุกหัว! นี่แหละวัตถุดิบที่ดีที่สุดที่ข้าเคยเห็น" },
      { t: "narration", text: "ช่างทอเหมยยิ้มกว้าง หยิบผ้าไหมที่ย้อมไว้ล่วงหน้ามาให้เป็นตัวอย่าง" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "takeItem", itemId: "lotus_seed", count: 5 },
          { t: "finishQuest", questId: "qc_suzhou_dye_ingredient", success: true },
        ],
        next: "city_suzhou",
      },
    ],
  },

  // ── qc_suzhou_copycat_guild ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_suzhou_copycat_guild_offer",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "มีกลุ่มช่างปลอมมาลอกลวดลายผ้าไหมของข้าแล้วขายในราคาถูก ลูกค้าเข้าใจผิดกันมาก" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ข้าต้องการรู้ว่าพวกเขาซ่องสุมอยู่ที่ไหน ไปสืบดูได้ไหม?" },
    ],
    choices: [
      {
        text: "รับสืบสวนช่างปลอม",
        effects: [{ t: "startQuest", questId: "qc_suzhou_copycat_guild" }],
        next: "qs_qc_suzhou_copycat_guild_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_suzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_copycat_guild_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ลองสังเกตที่ตลาดริมน้ำ มีแม่ค้าบางคนขายผ้าที่หน้าตาเหมือนของข้ามาก พยายามสืบที่มา" },
    ],
    choices: [{ text: "รับทราบ", next: "city_suzhou" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_suzhou_copycat_guild_complete",
    lines: [
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ท่านสืบพบที่ซ่องของพวกเขาแล้ว ข้าจะนำเรื่องไปแจ้งนายอำเภอ" },
      { t: "narration", text: "ช่างทอเหมยดูโล่งอกอย่างมาก" },
      { t: "dialogue", speaker: "ช่างทอเหมย", text: "ความซื่อสัตย์ของท่านทำให้งานฝีมือแท้จริงกลับมามีคุณค่า" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยความยินดี",
        effects: [
          { t: "finishQuest", questId: "qc_suzhou_copycat_guild", success: true },
          { t: "addTrait", trait: "good", amount: 5 },
          { t: "addNpcRelationship", npcId: "city_suzhou_weaver_mei", amount: 10 },
        ],
        next: "city_suzhou",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_jinling_strategist_kong
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_jinling_spy_network ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_jinling_spy_network_offer",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "มีสายลับของฝ่ายศัตรูแทรกซึมเข้าสำนักอยู่ที่ฉางอัน ข้าต้องการคนไปยืนยันข้อมูล" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ไม่ใช่ให้สู้ แค่สังเกตและรายงานกลับมา ต้องการคนที่ไม่โอ้อวดและไว้ใจได้" },
    ],
    choices: [
      {
        text: "รับภารกิจสอดแนม",
        effects: [{ t: "startQuest", questId: "qc_jinling_spy_network" }],
        next: "qs_qc_jinling_spy_network_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_jinling" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_spy_network_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ไปฉางอันก่อน สังเกตว่ามีใครผ่านเข้าออกประตูเมืองผิดปกติไหม แล้วกลับมารายงาน" },
    ],
    choices: [{ text: "รับทราบ", next: "city_jinling" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_spy_network_complete",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ท่านไปฉางอันและรายงานกลับมาแล้ว ข้อมูลที่ได้ยืนยันสิ่งที่ข้าสงสัย" },
      { t: "narration", text: "นักยุทธศาสตร์กงพยักหน้าด้วยแววตาเฉียบแหลม" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ท่านมีพรสวรรค์เรื่องการสังเกต รับรางวัลนี้ไป" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_jinling_spy_network", success: true },
          { t: "addNpcRelationship", npcId: "city_jinling_strategist_kong", amount: 10 },
        ],
        next: "city_jinling",
      },
    ],
  },

  // ── qc_jinling_coded_letter ────────────────────────────────────────
  // Refactored deliver-and-return:
  //   offer (Kong)              → giveItem qst_dali_encrypted
  //   translate (Duan, dali)    → takeItem encrypted, giveItem qst_dali_decoded
  //   complete (Kong)           → takeItem decoded, finishQuest
  {
    kind: "dialog",
    id: "qs_qc_jinling_coded_letter_offer",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ข้าได้จดหมายรหัสลับซึ่งดักจับได้จากผู้ส่งสาร เนื้อหาน่าตกใจหากแปลถูก" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ขั้นตอน: 1) รับจดหมายรหัสลับ 2) ไปต้าหลี่ · ให้บัณฑิตต้วนแปล 3) นำคำแปลกลับมาให้ข้า" },
    ],
    choices: [
      {
        text: "รับส่งจดหมายรหัส",
        effects: [
          { t: "startQuest", questId: "qc_jinling_coded_letter" },
          { t: "giveItem", itemId: "qst_dali_encrypted", count: 1 },
        ],
        next: "qs_qc_jinling_coded_letter_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_jinling" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_coded_letter_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ไปพบบัณฑิตต้วนที่ต้าหลี่ บอกชื่อข้า เขาจะแปลให้และส่งคำแปลกลับมาในรูปกระดาษอีกแผ่น" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ระวังอย่าให้ใครรู้ จดหมายต้นฉบับห้ามเปิดอ่าน" },
    ],
    choices: [{ text: "รับทราบ", next: "city_jinling" }],
  },
  // Duan's translate branch — invoked from npc_city_dali_scholar_duan_talk.
  {
    kind: "dialog",
    id: "qs_qc_jinling_coded_letter_translate",
    lines: [
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "อักษรโบราณที่ผสมรหัสลับ... รูปแบบเดียวกับเครือข่ายลับเมื่อยี่สิบปีก่อน" },
      { t: "narration", text: "บัณฑิตต้วนใช้เวลาครู่หนึ่งแปลและบันทึกคำแปลลงบนกระดาษอีกแผ่น" },
      { t: "dialogue", speaker: "บัณฑิตต้วน", text: "นี่คือคำแปล — บอกนักยุทธศาสตร์กงว่าเรื่องนี้รุนแรงกว่าที่คิด" },
    ],
    choices: [
      {
        text: "รับคำแปลและออกเดินทาง",
        effects: [
          { t: "takeItem", itemId: "qst_dali_encrypted", count: 1 },
          { t: "giveItem", itemId: "qst_dali_decoded", count: 1 },
        ],
        next: "city_dali",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_coded_letter_complete",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "คำแปลของบัณฑิตต้วน... น่าวิตกมาก ข้าต้องนำเรื่องนี้ไปพิจารณาต่อ" },
      { t: "narration", text: "นักยุทธศาสตร์กงพับกระดาษเก็บอย่างรอบคอบ" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ท่านทำงานได้ดีมาก ข้าจะจดจำท่านไว้ในฐานะผู้ที่ไว้ใจได้" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "takeItem", itemId: "qst_dali_decoded", count: 1 },
          { t: "finishQuest", questId: "qc_jinling_coded_letter", success: true },
          { t: "addNpcRelationship", npcId: "city_jinling_strategist_kong", amount: 8 },
        ],
        next: "city_jinling",
      },
    ],
  },

  // ── qc_jinling_defector ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_jinling_defector_offer",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "มีเจ้าหน้าที่สาวกสำนักหนึ่งต้องการแปรพักตร์ออกมา แต่กลัวถูกตามล่า" },
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ต้องการคนไปพาเขาออกมาให้ถึงจินหลิงอย่างปลอดภัย ถ้าทำได้ข้าจะให้ข้อมูลสำคัญตอบแทน" },
    ],
    choices: [
      {
        text: "รับภารกิจคุ้มครองผู้แปรพักตร์",
        effects: [{ t: "startQuest", questId: "qc_jinling_defector" }],
        next: "qs_qc_jinling_defector_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_jinling" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_defector_offer_accept",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ผู้แปรพักตร์อยู่ที่ฉางอัน รอท่านอยู่ที่โรงเตี๊ยมชายเมือง บอกรหัสว่า 'จันทร์เสี้ยว' เขาจะเข้าใจ" },
    ],
    choices: [{ text: "รับทราบ", next: "city_jinling" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_jinling_defector_complete",
    lines: [
      { t: "dialogue", speaker: "นักยุทธศาสตร์กง", text: "ท่านพาเขามาถึงได้อย่างปลอดภัย! ข้อมูลที่เขานำมาจะช่วยปกป้องผู้บริสุทธิ์หลายคน" },
      { t: "narration", text: "นักยุทธศาสตร์กงพยักหน้าให้ผู้แปรพักตร์ก่อนหันมาขอบคุณท่าน" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยความพอใจ",
        effects: [
          { t: "finishQuest", questId: "qc_jinling_defector", success: true },
          { t: "addTrait", trait: "good", amount: 8 },
          { t: "addTrait", trait: "fame", amount: 5 },
        ],
        next: "city_jinling",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST SCENES — city_changan_guard_yan
  // ═══════════════════════════════════════════════════════════════════

  // ── qc_changan_gate_intruder ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_changan_gate_intruder_offer",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "เมื่อคืนมีคนแอบผ่านประตูโดยไม่มีใบอนุญาต และเราตามสูญเสียรอยในเมือง" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ช่วยสืบว่าคนนั้นหนีไปไหน ข้าจะให้เหรียญทองสำหรับข้อมูลที่เป็นประโยชน์" },
    ],
    choices: [
      {
        text: "รับสืบสวนคนบุกรุก",
        effects: [{ t: "startQuest", questId: "qc_changan_gate_intruder" }],
        next: "qs_qc_changan_gate_intruder_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_changan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_gate_intruder_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "คนนั้นสวมชุดสีดำ รอยเท้าสุดท้ายพบใกล้ตลาดตะวันออก ลองเริ่มสืบจากตรงนั้น" },
    ],
    choices: [{ text: "รับทราบ", next: "city_changan" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_gate_intruder_complete",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ท่านพบตัวและนำไปแจ้งเจ้าหน้าที่ได้แล้ว ดีมาก เขาปรากฎว่าเป็นนักลักขโมยมืออาชีพ" },
      { t: "narration", text: "ยามหยานคำนับขอบคุณอย่างจริงจัง" },
    ],
    choices: [
      {
        text: "รับรางวัลเหรียญทองและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_changan_gate_intruder", success: true },
          { t: "addNpcRelationship", npcId: "city_changan_guard_yan", amount: 8 },
        ],
        next: "city_changan",
      },
    ],
  },

  // ── qc_changan_missing_soldier ─────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qc_changan_missing_soldier_offer",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ทหารในหน่วยของข้าหายตัวไปสามวันแล้ว เขาเป็นคนซื่อสัตย์ ไม่ใช่ประเภทจะหนีทัพ" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ช่วยตามหาว่าเขาอยู่ที่ไหน ข้าเป็นห่วงมาก" },
    ],
    choices: [
      {
        text: "รับตามหาทหารหาย",
        effects: [{ t: "startQuest", questId: "qc_changan_missing_soldier" }],
        next: "qs_qc_changan_missing_soldier_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_changan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_missing_soldier_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "วันสุดท้ายที่เห็นเขาคือตอนเดินลาดตระเวนแถวชายเมืองด้านใต้ ลองเริ่มสืบจากนั้น" },
    ],
    choices: [{ text: "รับทราบ", next: "city_changan" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_missing_soldier_complete",
    lines: [
      { t: "narration", text: "ท่านพบทหารคนนั้นถูกขังอยู่ในโกดังร้าง ดูเหมือนถูกกลุ่มลักลอบค้าอาวุธจับไว้" },
      { t: "dialogue", speaker: "ยามหยาน", text: "เขาปลอดภัยดี! ขอบคุณมาก ท่านช่วยชีวิตเพื่อนร่วมหน่วยของข้าไว้" },
    ],
    choices: [
      {
        text: "รับรางวัลและลาจาก",
        effects: [
          { t: "finishQuest", questId: "qc_changan_missing_soldier", success: true },
          { t: "addTrait", trait: "good", amount: 8 },
          { t: "addTrait", trait: "fame", amount: 5 },
          { t: "addNpcRelationship", npcId: "city_changan_guard_yan", amount: 10 },
        ],
        next: "city_changan",
      },
    ],
  },

  // ── qc_changan_weapon_smuggle — branching moral quest ──────────────
  {
    kind: "dialog",
    id: "qs_qc_changan_weapon_smuggle_offer",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ข้าพบหลักฐานว่ามีการลักลอบขนอาวุธเข้าเมืองฉางอันอยู่" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ปัญหาคืออาวุธเหล่านั้นน่าจะถูกส่งให้กลุ่มที่ต้องการก่อความวุ่นวาย แต่ข้ายังไม่รู้ว่าใครเป็นผู้รับ" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ช่วยสืบว่าผู้รับอาวุธคือใคร แล้วกลับมารายงาน" },
    ],
    choices: [
      {
        text: "รับสืบสวนการลักลอบขนอาวุธ",
        effects: [{ t: "startQuest", questId: "qc_changan_weapon_smuggle" }],
        next: "qs_qc_changan_weapon_smuggle_offer_accept",
      },
      { text: "ปฏิเสธ", next: "city_changan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_weapon_smuggle_offer_accept",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ระวังตัว กลุ่มลักลอบขนอาวุธเหล่านี้อาจอันตราย ถ้าเสี่ยงเกินไปอย่าฝืน" },
    ],
    choices: [{ text: "รับทราบ", next: "city_changan" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_weapon_smuggle_complete",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ท่านสืบรู้ว่าผู้รับอาวุธคือผู้นำกลุ่มชาวบ้านที่ถูกกดขี่โดยเจ้าหน้าที่ฉ้อฉล..." },
      { t: "narration", text: "ยามหยานหยุดคิด สีหน้าซับซ้อน" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ท่านจะรายงานต่อทางการ หรือเลือกนิ่งเฉยและปล่อยให้ชาวบ้านสู้เพื่อความยุติธรรม?" },
    ],
    choices: [
      {
        text: "รายงานต่อทางการ (ยึดถือกฎหมาย)",
        effects: [
          { t: "finishQuest", questId: "qc_changan_weapon_smuggle", success: true },
          { t: "addTrait", trait: "humility", amount: 3 },
          { t: "addNpcRelationship", npcId: "city_changan_guard_yan", amount: 5 },
        ],
        next: "qs_qc_changan_weapon_smuggle_lawful",
      },
      {
        text: "นิ่งเฉยปล่อยให้ชาวบ้านสู้ (ตามม양จิตใจ)",
        effects: [
          { t: "finishQuest", questId: "qc_changan_weapon_smuggle", success: true },
          { t: "addTrait", trait: "good", amount: 8 },
          { t: "addTrait", trait: "arrogance", amount: 2 },
        ],
        next: "qs_qc_changan_weapon_smuggle_rebel",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_weapon_smuggle_lawful",
    lines: [
      { t: "dialogue", speaker: "ยามหยาน", text: "ถูกต้องแล้ว กฎหมายต้องได้รับการเคารพ แม้จะขัดใจบ้าง นี่คือรางวัลจากทางการ" },
    ],
    choices: [{ text: "รับรางวัลและลาจาก", next: "city_changan" }],
  },
  {
    kind: "dialog",
    id: "qs_qc_changan_weapon_smuggle_rebel",
    lines: [
      { t: "narration", text: "ท่านเลือกนิ่งเฉย ชาวบ้านได้รับอาวุธและต่อมาจัดการกับเจ้าหน้าที่ฉ้อฉลสำเร็จ ข่าวแพร่ออกไปในยุทธภพ" },
      { t: "dialogue", speaker: "ยามหยาน", text: "ข้าเข้าใจว่าทำไมท่านถึงเลือกแบบนั้น บางครั้งความยุติธรรมไม่ได้อยู่ในกฎหมาย" },
    ],
    choices: [{ text: "ลาจาก", next: "city_changan" }],
  },
];
