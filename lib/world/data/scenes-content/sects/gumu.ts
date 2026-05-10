import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_GUMU: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_gumu_disciple_lengyue_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์เลิ่งเยว่", text: "สาวหยกสอนกระบี่เย็นเหมือนน้ำแข็ง — เจ้ารับไหวหรือ?" },
      { t: "narration", text: "เธอชักกระบี่ออกอย่างเงียบงัน อากาศรอบตัวเย็นลงทันที" },
    ],
    choices: [
      // Hint #3 — for non-disciple Quanzhen members with the sun art.
      // Lengyue points the player toward the inner chamber where the
      // mystery woman waits. Closes the breadcrumb chain.
      {
        text: "ที่นี่มีอาจารย์อีกผู้หนึ่งหรือ?",
        next: "qs_gumu_lengyue_hint",
        visibleIf: {
          t: "and",
          all: [
            { t: "sectMember", sectId: "quanzhen" },
            { t: "learnedArt", artId: "t3_qz_sun" },
            { t: "not", of: { t: "sectMember", sectId: "gumu" } },
          ],
        },
      },
      { text: "แค่ทักทาย", next: "sect_gumu" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_gumu_mystery_woman_talk",
    lines: [
      { t: "narration", text: "ในห้องลึกของสุสาน หญิงสาวสวมชุดขาวบริสุทธิ์ยืนนิ่งหันหลังให้เจ้า สายตาเย็นเฉียบราวกับน้ำแข็ง" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เจ้ามาถึงที่นี่... แสดงว่าเจ้าได้สัมผัสปลายของวิชาสุริยันต์แห่งฉวนเจินแล้ว" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เจ้ารู้หรือไม่ว่าสุสานโบราณนี้สร้างขึ้นโดยผู้ใด?" },
      { t: "narration", text: "นางหันหน้าครึ่งหนึ่ง สายลมเย็นพัดเส้นผมขาวยาวสะบัด" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "หลินเฉาอิง — หญิงสาวผู้เคยรักหวังฉงหยาง ผู้ก่อตั้งฉวนเจิน" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เมื่อความรักของนางไม่ได้รับการตอบสนอง นางจึงสร้างสุสานโบราณนี้ขึ้นตรงข้ามกับวัดของฉวนเจิน เพื่อให้เป็นเงาสะท้อนของกันและกันชั่วนิรันดร์" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "ทุกวิชาในกายาของสุสานโบราณ ถูกสร้างขึ้นเพื่อรับและแซงหน้าวิชาของฉวนเจิน — น้ำแข็งดับไฟ เงามืดกลืนแสง" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เพราะเหตุนั้น ผู้จะเข้าสู่สุสานนี้ต้องเดินทางตามเส้นทางของฉวนเจินถึงปลายเสียก่อน เจ้าถึงจะเข้าใจว่าน้ำแข็งกับไฟไม่ใช่สิ่งตรงข้าม — แต่เป็นใบหน้าสองด้านของพลังเดียวกัน" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_gumu_disciple_intro_offer",
    lines: [
      { t: "narration", text: "หญิงปริศนาหันหน้ามาสบตาเจ้าเป็นครั้งแรก" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เจ้าต้องการเรียนวิชาน้ำแข็ง? ดี — แต่ก่อนอื่น เจ้าต้องสละพันธะกับฉวนเจินเสียก่อน" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "พิสูจน์ฝีมือ — ปราบหัวหน้าโจร ๓ คน เพื่อแสดงว่าเจ้าไม่กลัวเลือด" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "แล้วนำของถวาย — บัวหิมะ ๓ ดอก และแร่เทพ ๑ ก้อน เพื่อแสดงว่าเจ้าเข้าใจคุณค่าของของหายาก" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "เมื่อครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ — และเจ้าจะไม่เป็นศิษย์ฉวนเจินอีกต่อไป" },
    ],
    choices: [
      { text: "ข้ายอมรับเงื่อนไข", next: "sect_gumu" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_gumu_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางบัวหิมะและแร่เทพลงบนแท่นหินเย็นยะเยือกหน้าหญิงปริศนา" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "ครบแล้ว... และดวงตาของเจ้ามีแววของผู้ที่พร้อมจะละทิ้งสิ่งเก่า" },
      { t: "narration", text: "นางหยิบดวงไข่มุกหยกออกจากอก แล้วยื่นให้เจ้า" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "ตั้งแต่บัดนี้ พันธะของเจ้ากับฉวนเจินสิ้นสุดลง — เจ้าคือศิษย์ของสุสานโบราณขั้นที่ ๓" },
      { t: "dialogue", speaker: "หญิงปริศนา", text: "รับคัมภีร์สาวหยกเป็นวิชาแรก จงฝึกในความเงียบ" },
    ],
    choices: [
      {
        text: "น้อมรับและสัญญา",
        next: "sect_gumu",
        effects: [
          { t: "takeItem", itemId: "snow_lotus", count: 3 },
          { t: "takeItem", itemId: "mithril_ore", count: 1 },
          { t: "finishQuest", questId: "qst_gumu_disciple_intro", success: true },
        ],
      },
    ],
  },
];
