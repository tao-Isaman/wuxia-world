import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_TANG: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_tang_chief_tangmen_talk",
    lines: [
      { t: "narration", text: "เจ้าสำนักถังเหมินนั่งหลังโต๊ะดำ มือเย็นเฉียบลูบมีดเล็กข้างกาย" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "เจ้ามาที่เสฉวนเพื่อสิ่งใด? พรรคของข้าไม่รับใครง่าย ๆ" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_tang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_tang_disciple_intro_offer",
    lines: [
      { t: "narration", text: "ถังเหมินยกหัวคิ้วและพยักไปทางห้องปรุงพิษ" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "อยากเป็นศิษย์ถังเหมิน? ต้องพิสูจน์ว่าหาวัตถุดิบของพรรคได้เอง" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "ข้อแรก — พิษงู ๕ ตัว · พิษแมงป่อง ๓ ตัว · พิษตะขาบ ๑ ตัว · สมุนไพรหายาก ๕ ชิ้น" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "พิษงูและแมงป่อง เจ้าจะหาได้จากการล่าสัตว์ในป่า — bst_viper, bst_scorpion · ส่วนพิษตะขาบหายากกว่า ต้องเข้าถ้ำหรือป่ามืดเท่านั้น" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "สมุนไพรหายาก ขุดได้ทั่วไปบนเขาที่มีต้นไม้สูง" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "เมื่อครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปเก็บมาให้ครบ", next: "sect_tang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_tang_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงพิษและสมุนไพรลงบนโต๊ะ ถังเหมินตรวจดูอย่างพิเคราะห์" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "ครบจำนวนทุกชนิด — และเจ้าก็ยังมีชีวิตรอด นั่นคือคุณสมบัติของศิษย์ถังเหมิน" },
      { t: "narration", text: "ท่านยกมีดเล็กชุดหนึ่งให้เจ้าพร้อมตำราม้วนเล็ก" },
      { t: "dialogue", speaker: "ถังเหมิน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์สำนักสุลถังขั้นที่ ๙ — รับมีดบินและสมาธิเฉียบคมเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับและสาบาน",
        next: "sect_tang",
        effects: [
          { t: "takeItem", itemId: "viper_venom", count: 5 },
          { t: "takeItem", itemId: "scorpion_venom", count: 3 },
          { t: "takeItem", itemId: "centipede_venom", count: 1 },
          { t: "takeItem", itemId: "herb", count: 5 },
          { t: "finishQuest", questId: "qst_tang_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_tang_vice_tangshanhu_talk",
    lines: [
      { t: "narration", text: "ถังซานหูยืนหันหลังให้เจ้า มือเดียวขว้างมีดเล็กลงในเป้าไม้ที่เรียงห่างไกล" },
      { t: "dialogue", speaker: "ถังซานหู", text: "ดาราพิรุณโปรย — มีด ๑๕ เล่มในจังหวะเดียว เจ้าฝึกถึงตอนนั้นจึงค่อยมาคุยกัน" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_tang_venom_elder_tangzhongtian_talk",
    lines: [
      { t: "narration", text: "ถังจงเทียนนั่งคนพิษในชามทองแดง ไอพิษสีเขียวลอยขึ้นช้า ๆ" },
      { t: "dialogue", speaker: "ถังจงเทียน", text: "พิษหมื่นชนิดของตระกูลถัง — ไม่มีใครรอดถ้าโดนเต็มที่" },
      { t: "dialogue", speaker: "ถังจงเทียน", text: "ถ้าเจ้าฝึกถึงขั้นข้าได้ ข้าจะสอนวิชาให้" },
    ],
  },
];
