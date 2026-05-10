import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_XIAOYAO: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_xiaoyao_master_yunxiao_talk",
    lines: [
      { t: "dialogue", speaker: "ปรมาจารย์ยุนเซียว", text: "ฝ่ามือสราญรมย์ผ่อนคลาย แต่อย่าดูถูก" },
      { t: "narration", text: "เขาเล่นขลุ่ยหยกอย่างผ่อนคลาย ก่อนวางลงและยกฝ่ามือ" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_xiaoyao" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_xiaoyao_disciple_intro_offer",
    lines: [
      { t: "narration", text: "ยุนเซียวยิ้มน้อย ๆ ก่อนยกขลุ่ยหยกขึ้นชี้ไปยังหุบเขา" },
      { t: "dialogue", speaker: "ยุนเซียว", text: "เจ้าจะเป็นศิษย์เซียวหยาว? ดี — แต่พรรคของเราไม่รับคนใจคับแคบ" },
      { t: "dialogue", speaker: "ยุนเซียว", text: "เก็บสมุนไพรหายาก ๑๐, โสม ๑๐, บัวหิมะ ๒ มาให้ห้องยา — แสดงว่าเจ้าเดินยุทธภพได้คล่อง" },
      { t: "dialogue", speaker: "ยุนเซียว", text: "เมื่อครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปทำตามคำสั่ง", next: "sect_xiaoyao" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_xiaoyao_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรลงตรงหน้ายุนเซียว ท่านพยักหน้ารับ" },
      { t: "dialogue", speaker: "ยุนเซียว", text: "ครบจำนวน — เจ้ามีพร้อมทั้งใจและพละกำลัง" },
      { t: "dialogue", speaker: "ยุนเซียว", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์พรรคสราญรมย์ขั้นที่ ๙ — รับดาบอสูรน้อยและลมปราณดอกเหมยเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบคุณ",
        next: "sect_xiaoyao",
        effects: [
          { t: "takeItem", itemId: "herb", count: 10 },
          { t: "takeItem", itemId: "ginseng", count: 10 },
          { t: "takeItem", itemId: "snow_lotus", count: 2 },
          { t: "finishQuest", questId: "qst_xiaoyao_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_xiaoyao_vice_tianshan_talk",
    lines: [
      { t: "narration", text: "เทียนซานยืนหันหลังให้เจ้า กำลังจ้องมองหุบเขายามค่ำ" },
      { t: "dialogue", speaker: "เทียนซาน", text: "ลมปราณภูติอุดร — สะท้อนแรงของศัตรูกลับ ใครทำร้ายข้า ข้าก็ส่งคืน" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_xiaoyao_sword_elder_wuyazi_talk",
    lines: [
      { t: "narration", text: "อู๋หยาจื่อกำลังเล่นกระบี่ขลุ่ยหยกเป็นทำนอง · เสียงเหล็กดังเหมือนดนตรี" },
      { t: "dialogue", speaker: "อู๋หยาจื่อ", text: "กระบี่ของเราเป็นเพลง · ผู้ฟังที่ตั้งใจจะรับรู้ทำนองและตาย" },
    ],
  },
];
