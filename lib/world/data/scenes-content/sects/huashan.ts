import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_HUASHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_huashan_master_yiqing_talk",
    lines: [
      { t: "narration", text: "อาจารย์อี้ชิงยืนพิงรั้วไม้ มองพระอาทิตย์ลับยอดเขาด้วยสายตาสงบ" },
      { t: "dialogue", speaker: "อี้ชิง", text: "หัวซานเล็ก แต่ดาบของเราคมไม่แพ้สำนักไหน" },
      { t: "dialogue", speaker: "อี้ชิง", text: "เจ้ามาที่นี่เพื่อสิ่งใด?" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_huashan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_huashan_disciple_intro_offer",
    lines: [
      { t: "narration", text: "อาจารย์อี้ชิงพยักหน้าและชี้มือไปยังโรงตีดาบหลังหอใหญ่" },
      { t: "dialogue", speaker: "อี้ชิง", text: "เจ้าจะเป็นศิษย์หัวซาน? ดี — ใจรักดาบของเจ้าเข้ากันกับสำนักของเรา" },
      { t: "dialogue", speaker: "อี้ชิง", text: "แต่หัวซานเป็นสำนักเล็ก ค่าใช้จ่ายในโรงตีดาบและการฝึกศิษย์ใหม่นั้นไม่น้อย" },
      { t: "dialogue", speaker: "อี้ชิง", text: "เก็บเงินค่าเข้าสำนัก ๕๐๐ ทองและเหล็กดิบ ๓ ก้อนมาให้ — ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปเตรียมของและเงิน", next: "sect_huashan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_huashan_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงทองและเหล็กดิบลงบนโต๊ะหน้าหอใหญ่" },
      { t: "dialogue", speaker: "อี้ชิง", text: "ครบจำนวน — เจ้าใจกล้าและตั้งใจ ข้ายินดีรับเจ้าเข้าสำนัก" },
      { t: "narration", text: "ท่านยกกระบี่ฝึกที่เพิ่งหลอมเสร็จส่งให้เจ้าด้วยมือทั้งสอง" },
      { t: "dialogue", speaker: "อี้ชิง", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์หัวซานขั้นที่ ๙ — รับกระบี่หัวซานและกำลังภายในเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบคุณ (จ่าย 500 ทอง)",
        next: "sect_huashan",
        // Gate the choice on actually having the gold — prevents broke
        // players from finishing the quest by accident and going to 0.
        visibleIf: { t: "goldAtLeast", amount: 500 },
        effects: [
          { t: "addGold", amount: -500 },
          { t: "takeItem", itemId: "iron_ore", count: 3 },
          { t: "finishQuest", questId: "qst_huashan_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_huashan_vice_master_zifeng_talk",
    lines: [
      { t: "narration", text: "รองอาจารย์จื่อเฟิงนั่งขัดเหล็กกระบี่อยู่ใต้ชายคา เสียงหินกระทบเหล็กดังก้อง" },
      { t: "dialogue", speaker: "จื่อเฟิง", text: "ดาบดีต้องลับนับพันครั้ง — คนเก่งก็ต้องฝึกซ้ำเช่นนั้น" },
      { t: "dialogue", speaker: "จื่อเฟิง", text: "หากเจ้าตั้งใจ หัวซานจะไม่ปฏิเสธเจ้า" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_huashan_sword_elder_qingsong_talk",
    lines: [
      { t: "narration", text: "อาจารย์ชิงซ่งกำลังสาธิตท่ากระบี่เมฆาล่องลอยให้ศิษย์รุ่นเยาว์" },
      { t: "dialogue", speaker: "ชิงซ่ง", text: "เพลงกระบี่หัวซานต้องไหลลื่นเหมือนเมฆา — แต่หนักแน่นเหมือนหิน" },
      { t: "dialogue", speaker: "ชิงซ่ง", text: "อยากลองกระบี่ของเจ้าไหม? มาประลองกันสักวันก็ดี" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_huashan_disciple_jianyi_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์เจี้ยนอี้", text: "ฝีมือดาบหัวซานต้องคมเหมือนใจ — เจ้าพร้อมจะรู้ความหมายไหม?" },
      { t: "narration", text: "เขาดึงดาบออกครึ่งฝัก ตาวาวขึ้น" },
    ],
  },
];
