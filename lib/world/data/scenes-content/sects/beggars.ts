import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_BEGGARS: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_beggars_chief_hongtian_talk",
    lines: [
      { t: "narration", text: "หัวหน้าหงเทียนนั่งเอนหลังอย่างสบายใจ ไม้เท้าเก้าข้อพาดอยู่ข้างตัว" },
      { t: "dialogue", speaker: "หงเทียน", text: "ฮ่าฮ่า ยินดีต้อนรับ! ยาจกก็รู้จักน้ำใจเหมือนกัน" },
      { t: "dialogue", speaker: "หงเทียน", text: "พรรคยาจกมีหูมีตาทั่วยุทธภพ — เจ้าต้องการอะไร?" },
    ],
    choices: [
      // Lore-quest offers gated to disciples only.
      {
        text: "รับภารกิจสายลับ",
        next: "qs_qst_beggars_spy_report_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_beggars_spy_report", status: "none" },
            { t: "sectMember", sectId: "beggars" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_beggars_spy_report" }],
      },
      {
        text: "รายงานผลสืบสวน",
        next: "qs_qst_beggars_spy_report_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_beggars_spy_report", status: "active" },
            { t: "flag", flag: "beggars_spy_reported" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_beggars_spy_report", success: true }],
      },
      {
        text: "รับภารกิจช่วยเด็ก",
        next: "qs_qst_beggars_hungry_offer",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_beggars_hungry_children", status: "none" },
            { t: "sectMember", sectId: "beggars" },
          ],
        },
        effects: [{ t: "startQuest", questId: "qst_beggars_hungry_children" }],
      },
      {
        text: "ส่งอาหาร",
        next: "qs_qst_beggars_hungry_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_beggars_hungry_children", status: "active" },
            { t: "hasItem", itemId: "raw_meat", count: 3 },
          ],
        },
        effects: [
          { t: "takeItem", itemId: "raw_meat", count: 3 },
          { t: "finishQuest", questId: "qst_beggars_hungry_children", success: true },
        ],
      },
      { text: "แค่ทักทาย", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_disciple_intro_offer",
    lines: [
      { t: "narration", text: "หัวหน้าหงเทียนหัวเราะลั่นและตบเข่า" },
      { t: "dialogue", speaker: "หงเทียน", text: "ฮ่าฮ่า เจ้าฝึกขอทานจนถึงขั้น ๒ แล้วสิ — ข้าได้ยินมาจากศิษย์ของข้า" },
      { t: "dialogue", speaker: "หงเทียน", text: "พรรคยาจกไม่รับเงินทอง ไม่รับของขวัญ — เพียงพิสูจน์ว่าเจ้าเข้าใจวิถีของถนน" },
      { t: "dialogue", speaker: "หงเทียน", text: "นำข้าวห่อ ๕ ห่อ และเงิน ๑๐๐ ทองที่เจ้าหามาได้จากการขอทานมาแสดง — ข้าอยากรู้ว่าเจ้าใจกว้างพอหรือไม่" },
      { t: "dialogue", speaker: "หงเทียน", text: "เมื่อครบแล้วกลับมา ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปทำตามคำสั่ง", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางข้าวห่อและเงินทองลงบนเสื่อหน้าหัวหน้าหงเทียน" },
      { t: "dialogue", speaker: "หงเทียน", text: "ครบแล้ว — และเจ้าก็ไม่ได้บ่นแม้แต่นิดเดียว ฮ่าฮ่า" },
      { t: "narration", text: "ท่านยกไม้เท้าเก้าข้อขึ้นแตะไหล่เจ้าเบา ๆ" },
      { t: "dialogue", speaker: "หงเทียน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์พรรคยาจกขั้นที่ ๙ — รับประกาศิตและวิชาเอาชีวิตรอดเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบพระคุณ",
        next: "sect_beggars",
        effects: [
          { t: "takeItem", itemId: "rice_dish", count: 5 },
          { t: "addGold", amount: -100 },
          { t: "finishQuest", questId: "qst_beggars_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_beggars_vice_chief_lifang_talk",
    lines: [
      { t: "narration", text: "รองหัวหน้าหลี่ฟางพิงกำแพงเคี้ยวเศษอาหาร แต่สายตาคมกริบ" },
      { t: "dialogue", speaker: "หลี่ฟาง", text: "อย่าดูถูกยาจก — ในเสื้อขาดของข้ามีฝ่ามือที่หักกระดูกได้ในจังหวะเดียว" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_beggars_staff_elder_qicheng_talk",
    lines: [
      { t: "narration", text: "อาจารย์ฉีเฉิงกำลังขัดไม้เท้าด้วยมือที่หยาบกร้าน" },
      { t: "dialogue", speaker: "ฉีเฉิง", text: "ไม้เท้าของพรรคยาจกไม่ใช่อาวุธ — มันคือเพื่อนเดินทาง" },
      { t: "dialogue", speaker: "ฉีเฉิง", text: "ฝึกพอ เจ้าจะเข้าใจว่าทำไมเพลงไม้เท้าตีสุขถึงเป็นวิชาสุดยอดของพรรค" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_spy_report_offer",
    lines: [
      { t: "dialogue", speaker: "หงเทียน", text: "มีองค์กรลึกลับเคลื่อนไหวในยุทธภพ พวกยาจกของข้าสังเกตเห็น" },
      { t: "dialogue", speaker: "หงเทียน", text: "ไปสืบข้อมูลจากสามสถานที่แล้วกลับมารายงาน" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_spy_report_complete",
    lines: [
      { t: "narration", text: "หัวหน้าหงเทียนฟังรายงานอย่างสนใจ โขกไม้เท้าลงพื้น" },
      { t: "dialogue", speaker: "หงเทียน", text: "ดีมาก! ข้อมูลนี้มีค่ากับพรรคยาจกมาก รับรางวัลไปด้วย!" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_hungry_offer",
    lines: [
      { t: "dialogue", speaker: "หงเทียน", text: "เด็กยาจกในพรรคหิวโหย... เรามีน้อยเกินไป" },
      { t: "dialogue", speaker: "หงเทียน", text: "นำเนื้อสด 3 ชิ้นมาให้พวกเขาได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_beggars_hungry_complete",
    lines: [
      { t: "narration", text: "หัวหน้าหงเทียนรับเนื้อสดด้วยรอยยิ้มอบอุ่น" },
      { t: "dialogue", speaker: "หงเทียน", text: "ขอบคุณ... เด็ก ๆ จะได้กินวันนี้ จิตใจเจ้าดีมาก" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_beggars" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_beggars_brawler_jiu_talk",
    lines: [
      { t: "dialogue", speaker: "ยาจกจิ๊ว", text: "หมัดเมาน่ะนะ... โต้ได้ไม่อายใคร แม้จะเดินไม่ตรง" },
      { t: "narration", text: "เขาดื่มเหล้าอึกใหญ่และยกขวดเชิญเจ้า" },
    ],
  },
];
