import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_TAISHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_taishan_master_tianmen_talk",
    lines: [
      { t: "narration", text: "เทียนเหมินเต้าเหรินยืนหันหลังมองพระอาทิตย์อรุณขึ้นจากขอบฟ้าด้านบูรพา · มือขวากุมด้ามกระบี่ตามนิสัย" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "ไท่ซานคือเขาบูรพา แสงแรกของฟ้าตกที่นี่ก่อนใคร" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "กระบี่ของเราตวัดออกครั้งใด ไม่เคยพลาด · เจ้ามาที่นี่เพื่อสิ่งใด?" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_taishan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_taishan_disciple_intro_offer",
    lines: [
      { t: "narration", text: "เทียนเหมินเต้าเหรินหันมามองเจ้าด้วยสายตาสงบราวกับพื้นน้ำในฤดูใบไม้ผลิ" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "เจ้าจะเป็นศิษย์ไท่ซาน? ดี — ใจของเจ้าสะอาดพอจะรับแสงแรกของฟ้า" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "แต่หอบูชาตะวันต้องการหยก ๓ ก้อนสำหรับพิธีรับเข้าสำนัก · และค่าเข้าสำนักของไท่ซานคือ ๕๐๐ เหรียญทอง" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "เก็บหยกและเงินมาให้ครบ ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙ และมอบกระบี่ไท่ซานเป็นวิชาแรก" },
    ],
    choices: [
      { text: "ข้าจะไปเตรียมของและเงิน", next: "sect_taishan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_taishan_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงทองและหยกสามก้อนลงบนแท่นบูชาตะวันหน้าหอใหญ่ · แสงเช้ากระทบหยกจนเปล่งประกายจาง" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "ครบจำนวน — เจ้าใจกล้าและตั้งใจ · ข้ายินดีรับเจ้าเข้าสำนัก" },
      { t: "narration", text: "ท่านยกกระบี่ฝึกที่ลับคมเสร็จใหม่ ส่งให้เจ้าด้วยมือทั้งสอง" },
      { t: "dialogue", speaker: "เทียนเหมิน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์ไท่ซานขั้นที่ ๙ · จงจดจำ — กระบี่ของไท่ซาน ตวัดออกแล้วต้องไม่พลาด" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบคุณ (จ่าย 500 ทอง + หยก 3 ก้อน)",
        next: "sect_taishan",
        // Gate the choice on actually having the gold + jade — prevents
        // broke / under-supplied players from finishing accidentally.
        visibleIf: {
          t: "and",
          all: [
            { t: "goldAtLeast", amount: 500 },
            { t: "hasItem", itemId: "jade", count: 3 },
          ],
        },
        effects: [
          { t: "addGold", amount: -500 },
          { t: "takeItem", itemId: "jade", count: 3 },
          { t: "finishQuest", questId: "qst_taishan_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_taishan_vice_yuyangzi_talk",
    lines: [
      { t: "narration", text: "อวี้หยางจื่อยืนทำสมาธิอยู่บนลานหิน เงาทอดตามแสงเช้าที่เคลื่อนช้า ๆ" },
      { t: "dialogue", speaker: "อวี้หยางจื่อ", text: "กระบี่ไท่ซานคือดวงตา · ตาเห็นชัด มือก็ไม่พลาด" },
      { t: "dialogue", speaker: "อวี้หยางจื่อ", text: "หากเจ้าฝึกใจให้นิ่งดั่งภูเขา กระบี่ของเจ้าก็จะเที่ยงตรงไม่แพ้แสงอรุณ" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_taishan_elder_chiyangzi_talk",
    lines: [
      { t: "narration", text: "ฉื่อหยางจื่อกำลังสอนศิษย์รุ่นเยาว์ตวัดกระบี่ทะลวงอรุณ · เสียงปลายกระบี่ผ่านอากาศคมราวกับฉีกผ้าไหม" },
      { t: "dialogue", speaker: "ฉื่อหยางจื่อ", text: "เพลงกระบี่ไท่ซานเหมือนแสงตะวัน — ตรงไปข้างหน้า ไม่อ้อมค้อม ไม่หลบเลี่ยง" },
      { t: "dialogue", speaker: "ฉื่อหยางจื่อ", text: "อยากลองวัดสายตาและฝีมือกับข้าหรือ? ก็ดี — ดวงตาที่ไม่พร้อม ย่อมพ่ายแพ้ตั้งแต่ยังไม่ตวัดดาบ" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_taishan_disciple_kunwu_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์คุนหวู่", text: "ดาบไท่ซานสองมือไม่อายใคร · อยากลองวัดฝีมือกับข้าหรือ?" },
      { t: "narration", text: "เขาวางดาบลงบนไหล่อย่างมั่นใจ ตามองเจ้าราวกับวัดระยะตวัดกระบี่อยู่แล้ว" },
      { t: "dialogue", speaker: "ศิษย์คุนหวู่", text: "วันหนึ่งข้าจะตวัดกระบี่ของไท่ซานให้ลือทั่วยุทธจักร · เจ้าคอยดูเถอะ" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_taishan_disciple2_jingyang_talk",
    lines: [
      { t: "narration", text: "ศิษย์จิ้งหยางยืนตรงคล้ายเสาหินที่ประตูสำนัก สายตาจับจ้องผู้ที่เดินผ่านมา" },
      { t: "dialogue", speaker: "ศิษย์จิ้งหยาง", text: "ยินดีต้อนรับสู่ไท่ซาน · เขาแห่งแสงอรุณ" },
      { t: "dialogue", speaker: "ศิษย์จิ้งหยาง", text: "ใครก็ตามที่ดูหมิ่นชื่อสำนักของเรา · กระบี่ของข้าจะไม่ยั้งมือ" },
    ],
  },
];
