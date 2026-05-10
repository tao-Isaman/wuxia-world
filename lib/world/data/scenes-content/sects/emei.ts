import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_EMEI: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_emei_abbess_jingchan_talk",
    lines: [
      { t: "narration", text: "ท่านนิ้วจิงฉานยืนทอดพระเนตรสวนดอกไม้ด้วยสีหน้าสงบแต่มีเรื่องกังวล" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ง้อไบ๊สอนให้เราเมตตาต่อสรรพสิ่ง แต่บางครั้งโลกก็บีบให้เราใช้กำลัง" },
      { t: "dialogue", speaker: "จิงฉาน", text: "เจ้ามาด้วยเรื่องอะไร?" },
    ],
    choices: [
      // Sect-disciple lore offers gated to disciples only — outsiders
      // get pointed at the registration trial via the NPC popup.
      {
        text: "รับภารกิจช่วยสาวก",
        next: "qs_qst_emei_kidnapped_novice_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "none" },
            { t: "sectMember", sectId: "emei" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_emei_kidnapped_novice" }],
      },
      {
        text: "ข้าพบสาวกแล้ว (ส่งมอบ)",
        next: "qs_qst_emei_kidnapped_novice_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "active" },
            { t: "flag", flag: "emei_novice_rescued" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_emei_kidnapped_novice", success: true }],
      },
      {
        text: "รับภารกิจพิษ",
        next: "qs_qst_emei_poison_antidote_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_poison_antidote", status: "none" },
            { t: "sectMember", sectId: "emei" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_emei_poison_antidote" }],
      },
      {
        text: "ส่งพิษตะขาบ",
        next: "qs_qst_emei_poison_antidote_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_poison_antidote", status: "active" },
            { t: "hasItem", itemId: "centipede_venom", count: 1 },
          ],
        },
        effects: [
          { t: "takeItem", itemId: "centipede_venom", count: 1 },
          { t: "finishQuest", questId: "qst_emei_poison_antidote", success: true },
        ],
      },
      { text: "แค่ทักทาย", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_disciple_intro_offer",
    lines: [
      { t: "narration", text: "ท่านนิ้วจิงฉานพยักหน้าและยกมือประสานต่อหน้าอก" },
      { t: "dialogue", speaker: "จิงฉาน", text: "เจ้าต้องการเป็นศิษย์ง้อไบ๊? ดี — ดวงใจเมตตาของเจ้าเหมาะกับสำนักของเรา" },
      { t: "dialogue", speaker: "จิงฉาน", text: "แต่ก่อนรับเจ้าเข้าสำนัก ขอพิสูจน์ความเพียร — เก็บสมุนไพรหายาก ๑๐, โสม ๑๐, เม็ดบัว ๑๐ มาให้ห้องยา" },
      { t: "dialogue", speaker: "จิงฉาน", text: "เมื่อครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปทำตามคำสั่ง", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรหลากชนิดลงบนแท่นไม้หน้าหอใหญ่" },
      { t: "dialogue", speaker: "จิงฉาน", text: "เจ้ากลับมาแล้ว และครบจำนวนทุกชนิด — ความเพียรของเจ้าน่ายกย่อง" },
      { t: "narration", text: "ท่านยกมือประสานเปล่งวาจาภาวนาเบา ๆ" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์ง้อไบ๊ขั้นที่ ๙ — รับกระบี่อ่อนช้อยและสมาธิเยือกเย็นเป็นวิชาแรกของศิษย์ง้อไบ๊" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบพระคุณ",
        next: "sect_emei",
        effects: [
          { t: "takeItem", itemId: "herb", count: 10 },
          { t: "takeItem", itemId: "ginseng", count: 10 },
          { t: "takeItem", itemId: "lotus_seed", count: 10 },
          { t: "finishQuest", questId: "qst_emei_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_emei_vice_abbess_huimiao_talk",
    lines: [
      { t: "narration", text: "รองท่านนิ้วฮุยเหมียวนั่งร้อยดอกบุปผาเป็นมาลัย ยิ้มน้อย ๆ ให้เจ้า" },
      { t: "dialogue", speaker: "ฮุยเหมียว", text: "ดอกเหมยห้ากลีบทั้งบริสุทธิ์และคมเฉียบ — กระบี่ของง้อไบ๊ก็เช่นกัน" },
      { t: "dialogue", speaker: "ฮุยเหมียว", text: "หากเจ้าตั้งใจฝึก สำนักจะไม่ปิดประตูใส่เจ้า" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_emei_sword_elder_qingxin_talk",
    lines: [
      { t: "narration", text: "ท่านนิ้วดาบชิงซินสาธิตท่ากระบี่พิทักษ์โพธิสัตว์ในลานฝึก เสียงเหล็กกระทบลมดังก้อง" },
      { t: "dialogue", speaker: "ชิงซิน", text: "กระบี่พิทักษ์โพธิสัตว์มี ๓ ท่าหลัก — แต่ละท่ารักษาทั้งตัวเองและผู้อื่นในเวลาเดียวกัน" },
      { t: "dialogue", speaker: "ชิงซิน", text: "อยากลองดูฝีมือกระบี่ของเจ้าไหม? มาประลองสักวันก็ได้" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_kidnapped_novice_offer",
    lines: [
      { t: "dialogue", speaker: "จิงฉาน", text: "สาวกของเราถูกจับไปเรียกค่าไถ่ ข้ากังวลมาก" },
      { t: "dialogue", speaker: "จิงฉาน", text: "โจรซ่อนตัวอยู่แถวป่าทางตะวันออก เจ้าช่วยได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_kidnapped_novice_complete",
    lines: [
      { t: "narration", text: "ท่านนิ้วจิงฉานโอบกอดสาวกผู้กลับมาด้วยความโล่งใจ" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ขอบคุณมาก... สาวกของเราปลอดภัยแล้ว" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ง้อไบ๊จะไม่ลืมบุญคุณนี้" },
    ],
    choices: [
      { text: "รับรางวัลและกล่าวลา", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_poison_antidote_offer",
    lines: [
      { t: "dialogue", speaker: "จิงฉาน", text: "มีสาวกถูกวางยาพิษชนิดที่ข้าไม่รู้จัก" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ต้องการพิษตะขาบยักษ์เพื่อสังเคราะห์ยาต้านพิษ นำมาให้ได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_emei_poison_antidote_complete",
    lines: [
      { t: "narration", text: "ท่านนิ้วรับพิษตะขาบและรีบไปปรุงยา" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ดีแล้ว... ข้าจะปรุงยาให้ทันเวลา ขอบคุณยอดยุทธ" },
    ],
    choices: [
      { text: "รับรางวัลและกล่าวลา", next: "sect_emei" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_emei_nun_qingyu_talk",
    lines: [
      { t: "dialogue", speaker: "นักพรตชิงอวี้", text: "กระบี่น้ำต้องไหลเหมือนน้ำ จะลองสัมผัสกับข้าไหม?" },
      { t: "narration", text: "เธอวางมือบนด้ามดาบน้ำค้างอย่างนิ่มนวล" },
    ],
  },
];
