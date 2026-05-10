import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_WUDANG: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_wudang_master_qingxu_talk",
    lines: [
      { t: "narration", text: "อาจารย์ชิงซวี่นั่งจับคู่ลมหายใจในสวนผา สายลมเบาพัดผ่านเสื้อคลุมสีขาว" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "อู่ตังสอนว่าน้ำอ่อนโยนกว่าหิน แต่มันกัดกร่อนหินได้ในที่สุด" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เจ้ามาเพื่ออะไร?" },
    ],
    choices: [
      // Sect-disciple lore offers gated to disciples only — outsiders get
      // pointed at the registration trial instead. Hidden mid-intro so
      // the player can't double-start while accepting registration.
      {
        text: "ข้ามาขอความช่วยเหลือ (บัวหิมะ)",
        next: "qs_qst_wudang_sacred_herb_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_wudang_sacred_herb", status: "none" },
            { t: "sectMember", sectId: "wudang" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_wudang_sacred_herb" }],
      },
      {
        text: "ส่งบัวหิมะ",
        next: "qs_qst_wudang_sacred_herb_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_wudang_sacred_herb", status: "active" },
            { t: "hasItem", itemId: "snow_lotus", count: 1 },
          ],
        },
      },
      {
        text: "รับภารกิจลูกศิษย์ทรยศ",
        next: "qs_qst_wudang_traitor_disciple_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_wudang_traitor_disciple", status: "none" },
            { t: "sectMember", sectId: "wudang" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_wudang_traitor_disciple" }],
      },
      {
        text: "รับภารกิจตราประทับ",
        next: "qs_qst_wudang_mountain_seal_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_wudang_mountain_seal", status: "none" },
            { t: "sectMember", sectId: "wudang" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_wudang_mountain_seal" }],
      },
      { text: "แค่ทักทาย", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_disciple_intro_offer",
    lines: [
      { t: "narration", text: "อาจารย์ชิงซวี่จับมือเจ้าอย่างอ่อนโยน สายตาท่านดูทะลุปรุโปร่ง" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เจ้าต้องการเป็นศิษย์อู่ตัง? ดี — ดวงใจของเจ้าใสซื่อพอแล้ว" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "แต่ก่อนจะรับเป็นศิษย์ ขอให้พิสูจน์ความเพียร — เก็บสมุนไพรหายาก ๑๐, โสม ๑๐, เม็ดบัว ๑๐ มาให้ห้องยา" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เมื่อครบแล้วกลับมา เจ้าจะได้รับสมาธิพื้นฐานเป็นวิชาแรกของศิษย์อู่ตัง" },
    ],
    choices: [
      { text: "ข้าจะไปทำตามคำสั่ง", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรหลากชนิดลงบนแท่นไม้หน้าหอจันทร์" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เจ้ากลับมา และครบจำนวนทุกชนิด — ความเพียรของเจ้าน่ายกย่อง" },
      { t: "narration", text: "ท่านรับสมุนไพรไปอย่างเรียบร้อยแล้วประสานมือพยักหน้าช้า ๆ" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์อู่ตังขั้นที่ ๙ — รับสมาธิพื้นฐานเป็นวิชาแรกเถิด" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบพระคุณ",
        next: "sect_wudang",
        effects: [
          { t: "takeItem", itemId: "herb", count: 10 },
          { t: "takeItem", itemId: "ginseng", count: 10 },
          { t: "takeItem", itemId: "lotus_seed", count: 10 },
          { t: "finishQuest", questId: "qst_wudang_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_wudang_vice_master_xuancheng_talk",
    lines: [
      { t: "narration", text: "รองอาจารย์เสวียนเฉิงนั่งขัดสมาธิอยู่บนหินใหญ่ กระบี่วางขนานบนตัก" },
      { t: "dialogue", speaker: "เสวียนเฉิง", text: "กระบี่อู่ตังไม่ใช่อาวุธ แต่เป็นภาษาของลมปราณ" },
      { t: "dialogue", speaker: "เสวียนเฉิง", text: "เจ้าจะเข้าใจวันใด — วันนั้นกระบี่จะเป็นมือของเจ้า" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_wudang_sword_elder_lingyu_talk",
    lines: [
      { t: "narration", text: "อาจารย์ดาบหลิงอวี้กำลังลับกระบี่อยู่ใต้ต้นสน เสียงเหล็กกระทบหินดังต่อเนื่อง" },
      { t: "dialogue", speaker: "หลิงอวี้", text: "ทุกเพลงกระบี่อู่ตังมีจังหวะของมันเอง — เคลื่อนเมฆาก็เคลื่อนตามลม กระบี่เหนือฟ้าก็เด็ดขาดเด็ดเดี่ยว" },
      { t: "dialogue", speaker: "หลิงอวี้", text: "ฝีมือของเจ้าจะถึงไหน — มาประลองกันสักวันก็ดี" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_sacred_herb_offer",
    lines: [
      { t: "dialogue", speaker: "ชิงซวี่", text: "ลูกศิษย์ของข้าป่วยหนัก ต้องการบัวหิมะจากยอดเขาทางเหนือ" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เส้นทางนั้นไม่ง่าย แต่ถ้าเจ้าหามาได้ ข้าจะสอนไทจี้ให้" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_sacred_herb_complete",
    lines: [
      { t: "narration", text: "อาจารย์ชิงซวี่รับบัวหิมะและโค้งขอบคุณ" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ขอบคุณ... ลูกศิษย์ของข้าจะรอด" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ตามสัญญา — ข้าจะสอนไทจี้เจี้ยนให้เจ้า" },
    ],
    choices: [
      { text: "รับการสอนด้วยความยินดี", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_traitor_disciple_offer",
    lines: [
      { t: "dialogue", speaker: "ชิงซวี่", text: "มีเรื่องหนักใจ... ลูกศิษย์คนหนึ่งขายข้อมูลสำนักให้ศัตรู" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ข้าไม่อยากทำร้ายเขา แต่ก็ห้ามไม่ได้ เจ้าช่วยได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_traitor_disciple_decide",
    lines: [
      { t: "narration", text: "เจ้าพบลูกศิษย์คนนั้นซ่อนตัวอยู่ในกระท่อมร้าง ใบหน้าของเขาเต็มไปด้วยความสิ้นหวัง" },
      { t: "dialogue", speaker: "ลูกศิษย์ผู้หลงทาง", text: "ข้าทำไปเพราะครอบครัวของข้า... พวกเขาบังคับ ข้าไม่มีทางเลือก" },
    ],
    choices: [
      {
        text: "นำตัวกลับสำนักเพื่อรับโทษ",
        next: "qs_qst_wudang_traitor_punish",
        effects: [
          { t: "advanceQuest", questId: "qst_wudang_traitor_disciple" },
          { t: "addTrait", trait: "arrogance", amount: 2 },
        ],
      },
      {
        text: "ปล่อยให้เขาหนีและเริ่มต้นใหม่",
        next: "qs_qst_wudang_traitor_mercy",
        effects: [
          { t: "advanceQuest", questId: "qst_wudang_traitor_disciple" },
          { t: "addTrait", trait: "humility", amount: 3 },
          { t: "addTrait", trait: "good", amount: 3 },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_traitor_punish",
    lines: [
      { t: "narration", text: "เจ้านำลูกศิษย์กลับสำนัก อาจารย์ชิงซวี่พิจารณาโทษอย่างหนักใจ" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "นี่คือวิถีของกฎ... ขอบคุณที่ทำตามหน้าที่" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "sect_wudang",
        effects: [{ t: "finishQuest", questId: "qst_wudang_traitor_disciple", success: true }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_traitor_mercy",
    lines: [
      { t: "narration", text: "เจ้ากลับมารายงานอาจารย์ว่าลูกศิษย์หนีไปแล้ว" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เจ้าปล่อยเขาไป... ข้าเข้าใจ บางครั้งเมตตาก็เป็นกฎสูงสุด" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "sect_wudang",
        effects: [{ t: "finishQuest", questId: "qst_wudang_traitor_disciple", success: true }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_mountain_seal_offer",
    lines: [
      { t: "dialogue", speaker: "ชิงซวี่", text: "วัดตาหลุนและอู่ตังมีพันธสัญญาโบราณ ต่ออายุทุกรอบสิบปี" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "รอบนี้ถึงเวลาแล้ว แต่ข้าติดธุระ เจ้าช่วยไปรับตราประทับมาให้ได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_wudang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_wudang_mountain_seal_complete",
    lines: [
      { t: "narration", text: "เจ้าส่งตราประทับแก่อาจารย์ชิงซวี่ ท่านถือมันด้วยความเคารพ" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ดีมาก... พันธสัญญาได้รับการต่ออายุแล้ว ขอบคุณ" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "sect_wudang",
        effects: [{ t: "finishQuest", questId: "qst_wudang_mountain_seal", success: true }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_wudang_disciple_qingfeng_talk",
    lines: [
      { t: "dialogue", speaker: "สาวกชิงเฟิง", text: "ไทจี้ไม่ใช่การชนะ แต่เป็นการเรียนรู้" },
      { t: "narration", text: "เขาเคลื่อนไหวอย่างช้า ๆ พลังภายในซ่อนอยู่ในกระบวนท่าทุกท่า" },
    ],
  },
];
