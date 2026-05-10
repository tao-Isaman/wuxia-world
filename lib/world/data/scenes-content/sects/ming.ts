import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_MING: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_ming_elder_zhuying_talk",
    lines: [
      { t: "narration", text: "ผู้อาวุโสจูอิงนั่งอยู่ในมุมมืดของห้องรับแขก แสงเทียนน้อยเพียงพอที่จะเห็นรอยยิ้มที่ซ่อนนัยยะ" },
      { t: "dialogue", speaker: "จูอิง", text: "ยอดยุทธผู้มาเยือน... ข้าได้ยินว่าเจ้าน่าไว้วางใจ" },
      { t: "dialogue", speaker: "จูอิง", text: "พรรคตะวันจันทรามีงานบางอย่างที่ต้องการผู้กล้า" },
    ],
    choices: [
      {
        text: "รับภารกิจจดหมายลับ",
        next: "qs_qst_ming_spy_mission_offer",
        visibleIf: { t: "questStatus", questId: "qst_ming_spy_mission", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_ming_spy_mission" }],
      },
      {
        text: "ส่งจดหมายแล้ว",
        next: "qs_qst_ming_spy_mission_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_ming_spy_mission", status: "active" },
            { t: "flag", flag: "ming_letter_delivered" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_ming_spy_mission", success: true }],
      },
      {
        text: "รับภารกิจผู้แปรพักตร์",
        next: "qs_qst_ming_defector_offer",
        visibleIf: { t: "questStatus", questId: "qst_ming_defector_choice", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_ming_defector_choice" }],
      },
      {
        text: "รายงานผลผู้แปรพักตร์",
        next: "qs_qst_ming_defector_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_ming_defector_choice", status: "active" },
            { t: "flag", flag: "ming_defector_resolved" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_ming_defector_choice", success: true }],
      },
      { text: "แค่ทักทาย", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_ming_spy_mission_offer",
    lines: [
      { t: "dialogue", speaker: "จูอิง", text: "ส่งจดหมายนี้ให้สายลับของเราในวังจงหยาง — อย่าให้ใครรู้" },
      { t: "narration", text: "จูอิงส่งซองจดหมายปิดผนึกมาให้เจ้า" },
    ],
    choices: [
      { text: "รับจดหมายและออกเดินทาง", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_ming_spy_mission_complete",
    lines: [
      { t: "narration", text: "จูอิงพยักหน้าอย่างพอใจ" },
      { t: "dialogue", speaker: "จูอิง", text: "ดีมาก... เจ้าพิสูจน์ตัวเองแล้ว รับรางวัลไปด้วย" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_ming_defector_offer",
    lines: [
      { t: "dialogue", speaker: "จูอิง", text: "สมาชิกคนหนึ่งต้องการออกจากพรรค เขารู้มากเกินไป" },
      { t: "dialogue", speaker: "จูอิง", text: "ตามหาเขา... แล้วตัดสินว่าจะทำอย่างไร เจ้ามีอิสระ" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_ming_defector_decide",
    lines: [
      { t: "narration", text: "เจ้าพบผู้แปรพักตร์ในกระท่อมป่า เขาสีหน้าหมดหวัง" },
      { t: "dialogue", speaker: "ผู้แปรพักตร์", text: "ข้าเบื่อแล้วกับการต้องซ่อนตัวและโกหก... ข้าแค่อยากมีชีวิตปกติ" },
    ],
    choices: [
      {
        text: "นำตัวกลับพรรค",
        next: "qs_ming_defector_brought_back",
        effects: [
          { t: "addTrait", trait: "evil", amount: 2 },
          { t: "setFlag", flag: "ming_defector_resolved", value: true },
        ],
      },
      {
        text: "ปล่อยเขาไปและปิดบังเรื่องนี้",
        next: "qs_ming_defector_released",
        effects: [
          { t: "addTrait", trait: "good", amount: 4 },
          { t: "addTrait", trait: "humility", amount: 2 },
          { t: "setFlag", flag: "ming_defector_resolved", value: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_ming_defector_complete",
    lines: [
      { t: "narration", text: "จูอิงฟังรายงานอย่างตั้งใจ ใบหน้าอ่านไม่ออก" },
      { t: "dialogue", speaker: "จูอิง", text: "ดีแล้ว... เรื่องนี้จบแล้ว รับรางวัลไปด้วย" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_ming_envoy_huozhi_talk",
    lines: [
      { t: "dialogue", speaker: "ผู้แทนหั่วจี้", text: "พรรคมิ่งไม่ได้ดำดังคำเล่าลือ — แต่ฝ่ามือเพลิงนี่ของจริง" },
      { t: "narration", text: "ฝ่ามือเขาเรืองแสงสีแดงจาง ๆ" },
    ],
  },
];
