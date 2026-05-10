import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_QUANZHEN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_quanzhen_master_chongyang_talk",
    lines: [
      { t: "narration", text: "อาจารย์ใหญ่ฉงหยางนั่งขัดสมาธิอยู่หน้าศาลาเก่า มือกุมตำราเต๋าโบราณ" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "ฉวนเจินไม่ได้สอนวิชาเพื่อชัยชนะ — เราฝึกเพื่อเข้าใจตัวเอง" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "เจ้ามาด้วยความตั้งใจอันใด?" },
    ],
    choices: [
      // Hidden hint — only visible to a Quanzhen disciple who has
      // absorbed the sun art. Points players at the Ancient Tomb sect
      // without spelling out the lock. Routes to a lore beat that
      // explains Lin Chaoying's grudge against Wang Chongyang.
      {
        text: "ข้าได้ยินตำนานเรื่องสุสานข้ามภูเขา...",
        next: "qs_quanzhen_master_gumu_hint",
        visibleIf: {
          t: "and",
          all: [
            { t: "sectMember", sectId: "quanzhen" },
            { t: "learnedArt", artId: "t3_qz_sun" },
            { t: "not", of: { t: "sectMember", sectId: "gumu" } },
          ],
        },
      },
      { text: "แค่ทักทาย", next: "sect_quanzhen" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_quanzhen_disciple_intro_offer",
    lines: [
      { t: "narration", text: "อาจารย์ฉงหยางวางตำราลงและจ้องมองเจ้าด้วยสายตาสงบใส" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "เจ้าต้องการเป็นศิษย์ฉวนเจิน? ดี — แต่นักพรตของเราไม่รับเงินทอง เพียงรับความเพียรเท่านั้น" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "ห้องยาของพระราชวังจงหยางต้องการสมุนไพรหลากชนิด — สมุนไพรหายาก ๑๐, โสม ๑๐, เม็ดบัว ๑๐" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "เก็บมาให้ครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปทำตามคำสั่ง", next: "sect_quanzhen" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_quanzhen_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรหลากชนิดลงบนแท่นไม้หน้าศาลา" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "เจ้ากลับมา และครบจำนวนทุกชนิด — ความเพียรของเจ้าเป็นเครื่องพิสูจน์ที่ดี" },
      { t: "narration", text: "ท่านพยักหน้าและประสานมือ" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์ฉวนเจินขั้นที่ ๙ — รับวิชาเร่งพลังและกระบี่หนักเป็นปฐมเถิด" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบพระคุณ",
        next: "sect_quanzhen",
        effects: [
          { t: "takeItem", itemId: "herb", count: 10 },
          { t: "takeItem", itemId: "ginseng", count: 10 },
          { t: "takeItem", itemId: "lotus_seed", count: 10 },
          { t: "finishQuest", questId: "qst_quanzhen_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_quanzhen_vice_master_mayu_talk",
    lines: [
      { t: "narration", text: "รองอาจารย์หม่ายวี่ยืนนิ่งอยู่ข้างเสา ใบหน้าสงบเงียบ" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "ดาบของฉวนเจินหนัก — เพราะใจของเจ้าต้องหนักแน่นกว่านั้น" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "ฝึกซ้อมไม่ขาด แล้วเจ้าจะเข้าใจ" },
    ],
    choices: [
      // Secondary hint — only after the player has the sun art. Mayu's
      // angle is the personal warning rather than the historical lore.
      {
        text: "ปลายของวิชาสุริยันต์อยู่ที่ใด?",
        next: "qs_quanzhen_vice_gumu_hint",
        visibleIf: {
          t: "and",
          all: [
            { t: "sectMember", sectId: "quanzhen" },
            { t: "learnedArt", artId: "t3_qz_sun" },
            { t: "not", of: { t: "sectMember", sectId: "gumu" } },
          ],
        },
      },
      { text: "แค่ทักทาย", next: "sect_quanzhen" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_quanzhen_sword_elder_qiuchuji_talk",
    lines: [
      { t: "narration", text: "อาจารย์ดาบชิวฉู่จี้กำลังสาธิตท่ากระบี่สะกดสุริยันต์ในลานฝึก" },
      { t: "dialogue", speaker: "ชิวฉู่จี้", text: "กระบี่สะกดสุริยันต์ต้องขังเเสงไว้ในใจ แล้วระเบิดออกในจังหวะเดียว" },
      { t: "dialogue", speaker: "ชิวฉู่จี้", text: "อยากลองดูฝีมือของเจ้าไหม? มาประลองกันก็ได้" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_quanzhen_disciple_chongxu_talk",
    lines: [
      { t: "dialogue", speaker: "สาวกชงซวี", text: "ปราณภายในของฉวนเจินไหลเป็นวงกลม กระบี่ก็เช่นกัน" },
      { t: "narration", text: "เขาหายใจลึกและจับด้ามกระบี่ด้วยสองมือ" },
    ],
  },
];
