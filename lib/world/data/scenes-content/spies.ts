import type { Scene } from "../../types";

// Dialog scenes for the 5 Jinyiwei spies scattered across the world.
// Each spy has:
//   1. An ambient `_talk` scene with quest-gated branches (offer / turn-in)
//   2. One `_offer` and `_complete` scene per quest (3 quests apiece)
//
// Bad-quest turn-in branches use the "evil" autoAdvance markers (stoleFromNpc
// / assassinatedNpc / kidnappedNpc) so the engine flips the stage on the
// player's evil action — the dialog only handles the verbal hand-off.
export const SCENES_SPIES: readonly Scene[] = [
  // ══════════════════════════════════════════════════════════════════════
  // เฟิงเจ้าของร้านบะหมี่ (spy_capital_feng) — capital chief
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_spy_capital_feng_talk",
    lines: [
      { t: "narration", text: "เฟิงพ่อค้าบะหมี่กำลังคนน้ำซุปด้วยกระบวยไม้ · เขาหันมามองเจ้าด้วยสายตาคม" },
      { t: "dialogue", speaker: "เฟิง", text: "เจ้ามาในเวลาที่เหมาะ · มีเรื่องที่กรมต้องการมือสะอาดช่วยจัดการ" },
    ],
    choices: [
      // Offer: seal ledger
      {
        text: "รับงานบัญชีตราพระราชา",
        next: "qs_qst_spy_capital_seal_ledger_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_capital_seal_ledger", status: "none" },
      },
      // Turn in: seal ledger
      {
        text: "ส่งบัญชีคืน (เสร็จสิ้น)",
        next: "qs_qst_spy_capital_seal_ledger_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_capital_seal_ledger", status: "active" },
            { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_capital_seal_ledger", success: true },
        ],
      },
      // Offer: court traitor
      {
        text: "สืบเรื่องคนทรยศในวัง",
        next: "qs_qst_spy_capital_court_traitor_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_capital_seal_ledger", status: "done" },
            { t: "questStatus", questId: "qst_spy_capital_court_traitor", status: "none" },
          ],
        },
      },
      {
        text: "รายงานเรื่องคนทรยศ (เสร็จสิ้น)",
        next: "qs_qst_spy_capital_court_traitor_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_capital_court_traitor", status: "active" },
            { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_capital_court_traitor", success: true },
        ],
      },
      // Bad: frame merchant
      {
        text: "(ลับ) รับงานปลูกหลักฐานพ่อค้า",
        next: "qs_qe_spy_capital_frame_merchant_offer",
        visibleIf: { t: "questStatus", questId: "qe_spy_capital_frame_merchant", status: "none" },
      },
      {
        text: "ส่งของที่ลักมา (เสร็จสิ้น)",
        next: "qs_qe_spy_capital_frame_merchant_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qe_spy_capital_frame_merchant", status: "active" },
            { t: "stoleFromNpc", npcId: "merchant_wang", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qe_spy_capital_frame_merchant", success: true },
        ],
      },
    ],
  },

  // qst_spy_capital_seal_ledger
  {
    kind: "dialog",
    id: "qs_qst_spy_capital_seal_ledger_offer",
    lines: [
      { t: "dialogue", speaker: "เฟิง", text: "บัญชีตราของกรมหายไปจากผู้ตรวจคนหนึ่ง · หัวหน้าโจรชนบทเอาไป" },
      { t: "dialogue", speaker: "เฟิง", text: "ออกไปทางชีกู่ · จัดการมัน แล้วนำบัญชีคืนมา" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_capital",
        effects: [{ t: "startQuest", questId: "qst_spy_capital_seal_ledger" }],
      },
      { text: "ขอเวลาคิด", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_capital_seal_ledger_complete",
    lines: [
      { t: "narration", text: "เจ้าวางบัญชีตราลงบนเคาน์เตอร์อย่างเงียบ ๆ" },
      { t: "dialogue", speaker: "เฟิง", text: "ดี... กรมจะจดบุญคุณนี้ · นี่ตำราเล็กของเราเอง ลองศึกษาดู" },
    ],
    choices: [{ text: "รับรางวัลและกล่าวลา", next: "city_capital" }],
  },

  // qst_spy_capital_court_traitor
  {
    kind: "dialog",
    id: "qs_qst_spy_capital_court_traitor_offer",
    lines: [
      { t: "dialogue", speaker: "เฟิง", text: "มีคนปลอมตัวเป็นข้าราชสำนักในวัง · เป็นมือสังหารฝ่ายตรงข้าม" },
      { t: "dialogue", speaker: "เฟิง", text: "เข้าวังหลวง · ทดสอบเขาด้วยฝีมือของเจ้า · จับหลักฐานกลับมา" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_capital",
        effects: [{ t: "startQuest", questId: "qst_spy_capital_court_traitor" }],
      },
      { text: "ยังไม่พร้อม", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_capital_court_traitor_complete",
    lines: [
      { t: "narration", text: "เจ้าเล่าเหตุการณ์ในวังให้เฟิงฟังขณะเขาคนซุปอย่างใจเย็น" },
      { t: "dialogue", speaker: "เฟิง", text: "พอใจแล้ว · นี่คัมภีร์ฝีก้าวของเรา ใช้รักษาตัวต่อไป" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_capital" }],
  },

  // qe_spy_capital_frame_merchant
  {
    kind: "dialog",
    id: "qs_qe_spy_capital_frame_merchant_offer",
    lines: [
      { t: "dialogue", speaker: "เฟิง", text: "เถ้าแก่หวางขัดหูขัดตามาก · ปลูกของเข้าไปในร้านเขา ข้าจะลงดาบเอง" },
      { t: "narration", text: "เฟิงยิ้มเย็นชา · ในเงาตะเกียง สายตาเขาดูเหมือนนายพรานล่าเหยื่อ" },
    ],
    choices: [
      {
        text: "(ลับ) รับงาน",
        next: "city_capital",
        effects: [{ t: "startQuest", questId: "qe_spy_capital_frame_merchant" }],
      },
      { text: "ปฏิเสธ", next: "city_capital" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_spy_capital_frame_merchant_complete",
    lines: [
      { t: "narration", text: "เจ้าวางของที่ลักมาบนเคาน์เตอร์อย่างเงียบ" },
      { t: "dialogue", speaker: "เฟิง", text: "ดีมาก · เถ้าแก่หวางจะเสียทุกอย่างพรุ่งนี้ · นี่ส่วนแบ่งของเจ้า" },
    ],
    choices: [{ text: "รับเงินและกล่าวลา", next: "city_capital" }],
  },

  // ══════════════════════════════════════════════════════════════════════
  // ซีคนยกของท่าเรือ (spy_yangzhou_xi)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_spy_yangzhou_xi_talk",
    lines: [
      { t: "narration", text: "ซีนั่งนับเหรียญเล็ก ๆ บนกองลังไม้ · เขามองขึ้นเมื่อเจ้าเข้าใกล้" },
      { t: "dialogue", speaker: "ซี", text: "ใครก็ได้ที่หัดสายตา จะอ่านได้ว่าข้าไม่ใช่คนแบกของจริง ๆ" },
    ],
    choices: [
      {
        text: "รับงานเรือลักลอบ",
        next: "qs_qst_spy_yangzhou_smuggler_ship_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_yangzhou_smuggler_ship", status: "none" },
      },
      {
        text: "รายงานเรื่องเรือ (เสร็จสิ้น)",
        next: "qs_qst_spy_yangzhou_smuggler_ship_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_yangzhou_smuggler_ship", status: "active" },
            { t: "defeatedOpponent", opponentId: "river_pirate", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_yangzhou_smuggler_ship", success: true },
        ],
      },
      {
        text: "รับงานตราผ้าไหมหลวง",
        next: "qs_qst_spy_yangzhou_silk_seal_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_yangzhou_silk_seal", status: "none" },
      },
      {
        text: "ส่งตราผ้าไหมคืน (เสร็จสิ้น)",
        next: "qs_qst_spy_yangzhou_silk_seal_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_yangzhou_silk_seal", status: "active" },
            { t: "defeatedOpponent", opponentId: "road_bandit", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_yangzhou_silk_seal", success: true },
        ],
      },
      {
        text: "(ลับ) รับงานปิดปากผู้พิพากษา",
        next: "qs_qe_spy_yangzhou_silence_witness_offer",
        visibleIf: { t: "questStatus", questId: "qe_spy_yangzhou_silence_witness", status: "none" },
      },
      {
        text: "รายงานการสังหาร (เสร็จสิ้น)",
        next: "qs_qe_spy_yangzhou_silence_witness_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qe_spy_yangzhou_silence_witness", status: "active" },
            { t: "assassinatedNpc", npcId: "city_capital_magistrate_wu" },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qe_spy_yangzhou_silence_witness", success: true },
        ],
      },
    ],
  },

  // qst_spy_yangzhou_smuggler_ship
  {
    kind: "dialog",
    id: "qs_qst_spy_yangzhou_smuggler_ship_offer",
    lines: [
      { t: "dialogue", speaker: "ซี", text: "เรือสามลำลอบเข้าเมืองทุกขึ้นสามค่ำ · หัวหน้าเรือเป็นโจรสลัดน้ำ" },
      { t: "dialogue", speaker: "ซี", text: "จัดการเขาที่ท่าเรือ กรมจะดูแลส่วนที่เหลือ" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_yangzhou",
        effects: [{ t: "startQuest", questId: "qst_spy_yangzhou_smuggler_ship" }],
      },
      { text: "ขอบคุณข่าว", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_yangzhou_smuggler_ship_complete",
    lines: [
      { t: "dialogue", speaker: "ซี", text: "เห็นแล้ว · เรือเหล่านั้นไม่กลับมาอีก · นี่ขวดยาคุณภาพดี" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_yangzhou" }],
  },

  // qst_spy_yangzhou_silk_seal
  {
    kind: "dialog",
    id: "qs_qst_spy_yangzhou_silk_seal_offer",
    lines: [
      { t: "dialogue", speaker: "ซี", text: "ผ้าไหมหลวงในคาราวานถูกแย่งกลางทาง · โจรเส้นทางเป็นต้นเหตุ" },
      { t: "dialogue", speaker: "ซี", text: "ตามกลับมาให้ทันก่อนรุ่งเช้าวันถัดไป" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_yangzhou",
        effects: [{ t: "startQuest", questId: "qst_spy_yangzhou_silk_seal" }],
      },
      { text: "ภายหลัง", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_yangzhou_silk_seal_complete",
    lines: [
      { t: "narration", text: "ซีดมตราผ้าไหมเบา ๆ · กลิ่นยังเหมือนของหลวงจริง ๆ" },
      { t: "dialogue", speaker: "ซี", text: "ดี · ของกลับมาก่อนเรื่องลุกลาม รับเงินเถิด" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_yangzhou" }],
  },

  // qe_spy_yangzhou_silence_witness
  {
    kind: "dialog",
    id: "qs_qe_spy_yangzhou_silence_witness_offer",
    lines: [
      { t: "dialogue", speaker: "ซี", text: "ผู้พิพากษาอู๋กำลังสืบเครือข่ายของกรม · เขารู้มากเกินไป" },
      { t: "dialogue", speaker: "ซี", text: "จัดการให้เขาเงียบที่นครหลวง · แล้วกลับมาที่ท่าเรือ" },
    ],
    choices: [
      {
        text: "(ลับ) รับงาน",
        next: "city_yangzhou",
        effects: [{ t: "startQuest", questId: "qe_spy_yangzhou_silence_witness" }],
      },
      { text: "ปฏิเสธ", next: "city_yangzhou" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_spy_yangzhou_silence_witness_complete",
    lines: [
      { t: "narration", text: "ซีฟังรายงานเย็นชา · จดตัวอักษรเล็ก ๆ ลงในกระดาษซับมัน" },
      { t: "dialogue", speaker: "ซี", text: "ผู้พิพากษาอู๋ถือเป็นปัญหาที่จบแล้ว · นี่ทองคำของเจ้า" },
    ],
    choices: [{ text: "รับเงิน", next: "city_yangzhou" }],
  },

  // ══════════════════════════════════════════════════════════════════════
  // เหมยพรานป่า (spy_dali_mei)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_spy_dali_mei_talk",
    lines: [
      { t: "narration", text: "เหมยกำลังเก็บใบหญ้าหายากใส่ตะกร้า · เธอยิ้มอย่างเป็นมิตรเมื่อเห็นเจ้า" },
      { t: "dialogue", speaker: "เหมย", text: "พรานคนเดียวจะรู้ทุกอย่างในป่า · กรมเลยใช้ข้าฟังแทน" },
    ],
    choices: [
      {
        text: "รับงานตามรอยพ่อค้าพิษ",
        next: "qs_qst_spy_dali_poisoner_track_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_dali_poisoner_track", status: "none" },
      },
      {
        text: "ส่งหลักฐานพ่อค้าพิษ (เสร็จสิ้น)",
        next: "qs_qst_spy_dali_poisoner_track_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_dali_poisoner_track", status: "active" },
            { t: "defeatedOpponent", opponentId: "poison_practitioner", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_dali_poisoner_track", success: true },
        ],
      },
      {
        text: "รับงานทูตใต้",
        next: "qs_qst_spy_dali_southern_envoy_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_dali_poisoner_track", status: "done" },
            { t: "questStatus", questId: "qst_spy_dali_southern_envoy", status: "none" },
          ],
        },
      },
      {
        text: "รายงานเรื่องทูต (เสร็จสิ้น)",
        next: "qs_qst_spy_dali_southern_envoy_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_dali_southern_envoy", status: "active" },
            { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_dali_southern_envoy", success: true },
        ],
      },
      {
        text: "(ลับ) รับงานลักยาแก้พิษ",
        next: "qs_qe_spy_dali_steal_antidote_offer",
        visibleIf: { t: "questStatus", questId: "qe_spy_dali_steal_antidote", status: "none" },
      },
      {
        text: "ส่งยาแก้พิษ (เสร็จสิ้น)",
        next: "qs_qe_spy_dali_steal_antidote_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qe_spy_dali_steal_antidote", status: "active" },
            { t: "stoleFromNpc", npcId: "villa_yaowang_doctor_shennong", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qe_spy_dali_steal_antidote", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_dali_poisoner_track_offer",
    lines: [
      { t: "dialogue", speaker: "เหมย", text: "พ่อค้าพิษเดินทางตามขอบป่าทางใต้ · จัดการเขา หลักฐานจะอยู่ในย่าม" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_dali",
        effects: [{ t: "startQuest", questId: "qst_spy_dali_poisoner_track" }],
      },
      { text: "ภายหลัง", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_dali_poisoner_track_complete",
    lines: [
      { t: "dialogue", speaker: "เหมย", text: "หลักฐานครบ · นี่ตำรากรงเล็บอินทรีของกรม ฝึกแล้วเก่งกว่ากำมือเดิมแน่" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_dali" }],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_dali_southern_envoy_offer",
    lines: [
      { t: "dialogue", speaker: "เหมย", text: "ทูตใต้เดินทางไปอู่ตังพร้อมสารลับ · นักฆ่าเงาคุ้มกันเขา" },
      { t: "dialogue", speaker: "เหมย", text: "หาทางดักจับ จัดการนักฆ่าเงา และนำสารกลับมา" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "city_dali",
        effects: [{ t: "startQuest", questId: "qst_spy_dali_southern_envoy" }],
      },
      { text: "ขอเวลาคิด", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_dali_southern_envoy_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสารลับลงบนตะกร้าใบหญ้า · เหมยกระดิกหัวอย่างพอใจ" },
      { t: "dialogue", speaker: "เหมย", text: "นี่คัมภีร์เกราะทองอนุรักษ์ของกรม · เข้ากับวิชาภายนอกของเจ้า" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_dali" }],
  },

  {
    kind: "dialog",
    id: "qs_qe_spy_dali_steal_antidote_offer",
    lines: [
      { t: "dialogue", speaker: "เหมย", text: "หมอเสินหนงมียาแก้พิษหายาก · ลักมา ข้าจะใช้ต่อรองกับเครือข่ายพิษ" },
    ],
    choices: [
      {
        text: "(ลับ) รับงาน",
        next: "city_dali",
        effects: [{ t: "startQuest", questId: "qe_spy_dali_steal_antidote" }],
      },
      { text: "ปฏิเสธ", next: "city_dali" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_spy_dali_steal_antidote_complete",
    lines: [
      { t: "dialogue", speaker: "เหมย", text: "ดีมาก · นี่ส่วนแบ่งและขวดยาคุณภาพสองขวด" },
    ],
    choices: [{ text: "รับรางวัล", next: "city_dali" }],
  },

  // ══════════════════════════════════════════════════════════════════════
  // โจวพ่อค้าเหล้าในโรงเตี๊ยม (spy_inn_zhou)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_spy_inn_zhou_talk",
    lines: [
      { t: "narration", text: "โจวเทเหล้าใส่จอกเล็ก ๆ ขณะหูของเขาฟังเสียงรอบโต๊ะ" },
      { t: "dialogue", speaker: "โจว", text: "นี่คือที่ซึ่งคนพูดเรื่องที่ไม่อยากให้ใครรู้ · ข้าจดทุกคำ" },
    ],
    choices: [
      {
        text: "รับงานคนเมา",
        next: "qs_qst_spy_inn_drunk_confession_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_inn_drunk_confession", status: "none" },
      },
      {
        text: "รายงานคนเมา (เสร็จสิ้น)",
        next: "qs_qst_spy_inn_drunk_confession_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_inn_drunk_confession", status: "active" },
            { t: "defeatedOpponent", opponentId: "drunk_brawler", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_inn_drunk_confession", success: true },
        ],
      },
      {
        text: "รับงานดาบพเนจร",
        next: "qs_qst_spy_inn_wandering_blade_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_inn_drunk_confession", status: "done" },
            { t: "questStatus", questId: "qst_spy_inn_wandering_blade", status: "none" },
          ],
        },
      },
      {
        text: "รายงานดาบพเนจร (เสร็จสิ้น)",
        next: "qs_qst_spy_inn_wandering_blade_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_inn_wandering_blade", status: "active" },
            { t: "defeatedOpponent", opponentId: "blade_master", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_inn_wandering_blade", success: true },
        ],
      },
      {
        text: "(ลับ) รับงานม้วนกลยุทธ์",
        next: "qs_qe_spy_inn_intimidate_drunk_offer",
        visibleIf: { t: "questStatus", questId: "qe_spy_inn_intimidate_drunk", status: "none" },
      },
      {
        text: "ส่งม้วนกลยุทธ์ (เสร็จสิ้น)",
        next: "qs_qe_spy_inn_intimidate_drunk_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qe_spy_inn_intimidate_drunk", status: "active" },
            { t: "stoleFromNpc", npcId: "city_jinling_strategist_kong", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qe_spy_inn_intimidate_drunk", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_inn_drunk_confession_offer",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "ชายเมาคนหนึ่งสารภาพแผนก่อการดัง ๆ คืนวาน · เขายังอยู่ที่นี่" },
      { t: "dialogue", speaker: "โจว", text: "จัดการเขา · กรมจะส่งคนสอบสวนต่อ" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "inn_yuelai",
        effects: [{ t: "startQuest", questId: "qst_spy_inn_drunk_confession" }],
      },
      { text: "ภายหลัง", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_inn_drunk_confession_complete",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "เก่ง · นี่คัมภีร์ลมปราณเริ่มต้นของกรม · เป็นบันไดขั้นแรก" },
    ],
    choices: [{ text: "รับรางวัล", next: "inn_yuelai" }],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_inn_wandering_blade_offer",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "ดาบพเนจรคนหนึ่งมานั่งดื่มเหล้าซ้ำสามคืน · พูดเรื่องกลุ่มลับ" },
      { t: "dialogue", speaker: "โจว", text: "ทดสอบฝีมือเขา · หากแกร่งจริง เราต้องระวัง" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "inn_yuelai",
        effects: [{ t: "startQuest", questId: "qst_spy_inn_wandering_blade" }],
      },
      { text: "ขอเวลา", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_inn_wandering_blade_complete",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "ตามคาด · เขาเป็นมือดาบฝ่ายอธรรมจริง · นี่ตำราดาบราชสำนักสำหรับเจ้า" },
    ],
    choices: [{ text: "รับรางวัล", next: "inn_yuelai" }],
  },

  {
    kind: "dialog",
    id: "qs_qe_spy_inn_intimidate_drunk_offer",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "ขุนพลคงในจินหลิงเก็บม้วนกลยุทธ์ที่อาจทำลายกรม · ลักมา · เร็ว" },
    ],
    choices: [
      {
        text: "(ลับ) รับงาน",
        next: "inn_yuelai",
        effects: [{ t: "startQuest", questId: "qe_spy_inn_intimidate_drunk" }],
      },
      { text: "ปฏิเสธ", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_spy_inn_intimidate_drunk_complete",
    lines: [
      { t: "dialogue", speaker: "โจว", text: "ม้วนกลยุทธ์อยู่ในมือกรมแล้ว · กินเหล้าจอกหนึ่ง แล้วรับเงินไป" },
    ],
    choices: [{ text: "รับรางวัล", next: "inn_yuelai" }],
  },

  // ══════════════════════════════════════════════════════════════════════
  // ซื่อชาวนาในชีกู่ (spy_village_si)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_spy_village_si_talk",
    lines: [
      { t: "narration", text: "ซื่อกำลังพรวนดินอย่างขยันขันแข็ง · เขาพูดเสียงเบาขณะเงยมองเจ้า" },
      { t: "dialogue", speaker: "ซื่อ", text: "ชาวนาผู้เดียวสามารถเดินทุกถนนได้โดยไม่มีใครสงสัย · นั่นเป็นเหตุผลกรมเลือกข้า" },
    ],
    choices: [
      {
        text: "รับงานผู้ส่งสารหายตัว",
        next: "qs_qst_spy_village_missing_courier_offer",
        visibleIf: { t: "questStatus", questId: "qst_spy_village_missing_courier", status: "none" },
      },
      {
        text: "รายงานเรื่องผู้ส่งสาร (เสร็จสิ้น)",
        next: "qs_qst_spy_village_missing_courier_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_village_missing_courier", status: "active" },
            { t: "defeatedOpponent", opponentId: "thug", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_village_missing_courier", success: true },
        ],
      },
      {
        text: "รับงานคาราวานเหล็ก",
        next: "qs_qst_spy_village_iron_caravan_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_village_missing_courier", status: "done" },
            { t: "questStatus", questId: "qst_spy_village_iron_caravan", status: "none" },
          ],
        },
      },
      {
        text: "รายงานคาราวานเหล็ก (เสร็จสิ้น)",
        next: "qs_qst_spy_village_iron_caravan_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_spy_village_iron_caravan", status: "active" },
            { t: "defeatedOpponent", opponentId: "desert_marauder", count: 1 },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_spy_village_iron_caravan", success: true },
        ],
      },
      {
        text: "(ลับ) รับงานลักพาตัวพ่อค้า",
        next: "qs_qe_spy_village_kidnap_witness_offer",
        visibleIf: { t: "questStatus", questId: "qe_spy_village_kidnap_witness", status: "none" },
      },
      {
        text: "ส่งตัวประกัน (เสร็จสิ้น)",
        next: "qs_qe_spy_village_kidnap_witness_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qe_spy_village_kidnap_witness", status: "active" },
            { t: "kidnappedNpc", npcId: "merchant_wang" },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qe_spy_village_kidnap_witness", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_village_missing_courier_offer",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "ผู้ส่งสารหลวงผ่านชีกู่ทุกเดือน · เดือนนี้ไม่มา · โจรเร่ร่อนน่าจะเป็นคนทำ" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qst_spy_village_missing_courier" }],
      },
      { text: "ภายหลัง", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_village_missing_courier_complete",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "พบแล้ว · นี่ตำรากรงเล็บคว้าจับของกรม ฝึกไว้กันรุ่นต่อไป" },
    ],
    choices: [{ text: "รับรางวัล", next: "village_qigu" }],
  },

  {
    kind: "dialog",
    id: "qs_qst_spy_village_iron_caravan_offer",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "คาราวานเหล็กลอบข้ามชายแดน · นักรบทะเลทรายคุ้มกัน · จัดการให้ทันก่อนถึงค่ายฝ่ายตรงข้าม" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qst_spy_village_iron_caravan" }],
      },
      { text: "ขอเวลาคิด", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_spy_village_iron_caravan_complete",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "ดีมาก · กรมจะรายงานต่อทูตเจ้า · นี่หยกล้ำค่าเป็นรางวัล" },
    ],
    choices: [{ text: "รับรางวัล", next: "village_qigu" }],
  },

  {
    kind: "dialog",
    id: "qs_qe_spy_village_kidnap_witness_offer",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "เถ้าแก่หวางเริ่มรู้แผนของกรม · ต้องเก็บเขาเงียบ ๆ · ลักพาตัว ส่งให้ข้า" },
    ],
    choices: [
      {
        text: "(ลับ) รับงาน",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qe_spy_village_kidnap_witness" }],
      },
      { text: "ปฏิเสธ", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qe_spy_village_kidnap_witness_complete",
    lines: [
      { t: "dialogue", speaker: "ซื่อ", text: "ดี · กรมจะรับช่วงต่อ · นี่ส่วนแบ่งของเจ้า" },
    ],
    choices: [{ text: "รับรางวัล", next: "village_qigu" }],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Sect-NPC ambient talks (3) — sparring-only, no quests.
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_jinyiwei_leader_zhao_talk",
    lines: [
      { t: "narration", text: "ผู้บัญชาการจ้าวฝู่นั่งบนเก้าอี้ดำ · เสื้อแพรปักทองสะท้อนแสงเทียน" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "เจ้ามาในกรมเสื้อแพรเพื่อสิ่งใด · หากมาประลอง · ข้าไม่ปฏิเสธ" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "แต่จงเข้าใจ · ผู้แพ้จะต้องจดจำชื่อข้าไว้นาน" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_jinyiwei" },
    ],
  },

  // Disciple intro — offer beat. NPC popup auto-routes here after Accept.
  // The commander briefs the kidnap mission against envoy Liuying.
  {
    kind: "dialog",
    id: "qs_qst_jinyiwei_disciple_intro_offer",
    lines: [
      { t: "narration", text: "จ้าวฝู่จ้องเจ้าอย่างพิเคราะห์ ก่อนชี้ไปทางพระราชวังจงหยาง" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "อยากเป็นองครักษ์เสื้อแพร? ข้ารับคนได้ — แต่ไม่รับคนใจอ่อน" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "ทูตหลิวอิงในวังจงหยางขายความลับให้ฝ่ายตรงข้ามมาหลายเดือน — ข้าต้องการสอบสวนเขาในที่ของข้า" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "ลักพาตัวเขาคืนนี้ อย่าให้มีร่องรอย เมื่อสำเร็จแล้วกลับมารายงาน — ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "รับงาน — ข้าจะลงมือทันที", next: "sect_jinyiwei" },
    ],
  },

  // Disciple intro — complete beat. The kidnappedNpc condition is
  // already satisfied; the choice fires finishQuest → joinSect:jinyiwei.
  {
    kind: "dialog",
    id: "qs_qst_jinyiwei_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้ายืนรายงานต่อจ้าวฝู่ ผู้บัญชาการพยักหน้าด้วยความพอใจ" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "ทูตอยู่ในห้องสอบสวนของข้าแล้ว — ดี เจ้าทำได้สะอาดดีกว่าที่คาด" },
      { t: "narration", text: "ท่านยกชุดเสื้อแพรปักทองชุดเล็กให้เจ้า" },
      { t: "dialogue", speaker: "จ้าวฝู่", text: "ตั้งแต่บัดนี้ เจ้าคือองครักษ์ขั้นที่ ๙ — รับโซ่และลมปราณเสื้อแพรเป็นวิชาแรกของกรมราช" },
    ],
    choices: [
      {
        text: "น้อมรับและสาบาน",
        next: "sect_jinyiwei",
        effects: [
          { t: "finishQuest", questId: "qst_jinyiwei_disciple_intro", success: true },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "npc_sect_jinyiwei_soldier_qin_talk",
    lines: [
      { t: "narration", text: "องครักษ์ฉินกำลังลับดาบโค้งของตน · ผิวเหล็กสะท้อนแสงประกาย" },
      { t: "dialogue", speaker: "ฉิน", text: "ดาบกรมราชไม่ใช่ของเล่น · หากเจ้าอยากลอง ข้าจะให้บทเรียน" },
    ],
  },
  {
    kind: "dialog",
    id: "npc_sect_jinyiwei_soldier_lu_talk",
    lines: [
      { t: "narration", text: "องครักษ์ลู่กำลังพันโซ่ทองรอบแขนเปลือยอย่างชำนาญ" },
      { t: "dialogue", speaker: "ลู่", text: "โซ่กับกรงเล็บของกรม · ใช้ล่าได้ทั้งคนและเสือ · เจ้าอยากเป็นเหยื่อตัวไหน?" },
    ],
  },
];
