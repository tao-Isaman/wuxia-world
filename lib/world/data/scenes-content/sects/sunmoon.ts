import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_SUNMOON: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_sunmoon_chief_dongfang_talk",
    lines: [
      { t: "narration", text: "เจ้าสำนักหยินอวี้ปู้ป้ายนั่งบนบัลลังก์มังกร เสื้อคลุมขาวพลิ้วไหวกับลม" },
      { t: "dialogue", speaker: "หยินอวี้", text: "เจ้ามาที่ยอดเขาดำต้นไม้นี้เพื่อสิ่งใด?" },
      { t: "dialogue", speaker: "หยินอวี้", text: "พรรคตะวันจันทราไม่เคยปฏิเสธผู้กล้า — แต่ก็ไม่เคยรับผู้อ่อนแอ" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_sunmoon_disciple_intro_offer",
    lines: [
      { t: "narration", text: "หยินอวี้จ้องเจ้าด้วยสายตาเย็น ก่อนเอ่ยช้าๆ" },
      { t: "dialogue", speaker: "หยินอวี้", text: "ต้องการเป็นศิษย์พรรคตะวันจันทรา? ดี — แต่ข้ารับเฉพาะคนใจกล้า" },
      { t: "dialogue", speaker: "หยินอวี้", text: "องครักษ์ฉินแห่งกรมเสื้อแพรกำลังตามล่าศิษย์ของพรรค — ลอบสังหารเขา แล้วเจ้าจึงเป็นพวกเรา" },
      { t: "dialogue", speaker: "หยินอวี้", text: "อย่าเปิดเผยตัวเอง เมื่อสำเร็จแล้วกลับมารายงาน" },
    ],
    choices: [
      { text: "รับงาน — ข้าจะลงมือทันที", next: "sect_ming" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_sunmoon_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้ายืนรายงานต่อหยินอวี้ ผู้บัญชาการพยักหน้าด้วยความพอใจ" },
      { t: "dialogue", speaker: "หยินอวี้", text: "องครักษ์ฉินตายในเงา — ดี เจ้าทำได้สะอาด" },
      { t: "narration", text: "ท่านยกเหรียญทองดวงเล็กให้เจ้าพร้อมตำราม้วนหนึ่ง" },
      { t: "dialogue", speaker: "หยินอวี้", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์พรรคตะวันจันทราขั้นที่ ๙ — รับฝ่ามือเพลิงและพลังสองขั้วเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับและสาบาน",
        next: "sect_ming",
        effects: [
          { t: "finishQuest", questId: "qst_sunmoon_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_sunmoon_vice_renwoxing_talk",
    lines: [
      { t: "narration", text: "เหรินหวัวสิงยืนหลังเสาดำ เสื้อสีดำสะท้อนแสงเทียน" },
      { t: "dialogue", speaker: "เหรินหวัวสิง", text: "พลังดูดดาวของข้าเรียกพลังของศัตรูได้ — เจ้าอยากเห็นไหม?" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_sunmoon_sun_elder_zuolengchan_talk",
    lines: [
      { t: "narration", text: "จั่วเหลิงฉันยืนนิ่งหน้ากระจกแสง เปลวเพลิงน้อยล้อมรอบฝ่ามือ" },
      { t: "dialogue", speaker: "จั่วเหลิงฉัน", text: "พลังตะวันคือไฟที่จุดในกาย — ลงมือฝึกหรือถอยไป" },
    ],
  },
];
