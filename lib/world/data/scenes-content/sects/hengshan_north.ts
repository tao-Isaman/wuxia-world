import type { Scene } from "../../../types";

// เหิงซานเหนือ — Buddhist nun's order. Five NPC ambient talks +
// the intro offer/complete pair. Quest grinds + redemption use the
// auto-finish popup path; no scene needed.

export const SCENES_HENGSHAN_NORTH: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_abbess_dingyi_talk",
    lines: [
      { t: "narration", text: "ภิกษุณีติ่งอี้นั่งสมาธิอยู่ในศาลาธรรม เสียงระฆังเล็กดังกริ๊งเป็นจังหวะ" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "ดาบของเหิงซานเหนือไม่ใช่ดาบฆ่า — เป็นดาบปกป้องและดาบไถ่" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "ใจผู้ใดสงบ ดาบผู้นั้นย่อมหนัก เจ้ามาที่นี่เพื่อสิ่งใด?" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_hengshan_north" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_hengshan_north_disciple_intro_offer",
    lines: [
      { t: "narration", text: "ภิกษุณีติ่งอี้พยักหน้าและชี้มือไปยังลานคัดพระสูตรหลังศาลาใหญ่" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "เจ้าจะเป็นศิษย์เหิงซานเหนือ? ดี — ใจสงบของเจ้าเหมาะกับสำนักของเรา" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "แต่วัดเล็ก ค่าใช้จ่ายในการถวายธรรมและฝึกศิษย์ใหม่นั้นไม่น้อย" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "เก็บเงินค่าจดทะเบียน ๕๐๐ ทองและกระดาษคัดพระสูตร ๓ แผ่นมาให้ — ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปเตรียมของและเงิน", next: "sect_hengshan_north" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_hengshan_north_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงทองและกระดาษคัดสูตรลงบนโต๊ะหน้าศาลาธรรม" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "ครบจำนวน — เจ้าตั้งใจและใจสงบดี ข้ายินดีรับเจ้าเข้าสำนัก" },
      { t: "narration", text: "ท่านยกกระบี่ไม้ฝึกขึ้นด้วยมือทั้งสอง วางทาบลงบนฝ่ามือเจ้าอย่างเคารพธรรม" },
      { t: "dialogue", speaker: "ภิกษุณีติ่งอี้", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์เหิงซานเหนือขั้นที่ ๙ — รับกระบี่ธรรมและลมปราณเป็นวิชาแรก" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบคุณ (จ่าย 500 ทอง)",
        next: "sect_hengshan_north",
        // Gate the choice on actually having both the gold AND the paper —
        // mirrors the huashan intro's pattern so the player can't
        // accidentally finish broke or short on offerings.
        visibleIf: {
          t: "and",
          all: [
            { t: "goldAtLeast", amount: 500 },
            { t: "hasItem", itemId: "paper", count: 3 },
          ],
        },
        effects: [
          { t: "addGold", amount: -500 },
          { t: "takeItem", itemId: "paper", count: 3 },
          { t: "finishQuest", questId: "qst_hengshan_north_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_vice_yihe_talk",
    lines: [
      { t: "narration", text: "ภิกษุณีอี๋เหอนั่งคัดพระสูตรอยู่ใต้ชายคา ปลายพู่กันเขียนช้าและหนักแน่น" },
      { t: "dialogue", speaker: "ภิกษุณีอี๋เหอ", text: "ดาบเหิงซานเหนือเหมือนพระสูตร — ทุกตัวอักษรต้องเที่ยงตรง" },
      { t: "dialogue", speaker: "ภิกษุณีอี๋เหอ", text: "หากเจ้าใจร้อน ดาบของเจ้าก็จะร้อน และจะไม่อาจปกป้องผู้ใด" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_elder_yiqing_talk",
    lines: [
      { t: "narration", text: "ภิกษุณีอี๋ชิงกำลังสาธิตท่ากระบี่กระจกธรรมให้ศิษย์รุ่นเยาว์ เคลื่อนช้าราวรำพระธรรม" },
      { t: "dialogue", speaker: "ภิกษุณีอี๋ชิง", text: "กระบี่กระจกไม่โจมตี — มันสะท้อนแรงของผู้โจมตีกลับคืน" },
      { t: "dialogue", speaker: "ภิกษุณีอี๋ชิง", text: "ผู้ที่โกรธก่อน ย่อมพ่ายก่อน เจ้าเข้าใจไหม?" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_nun_jingxin_talk",
    lines: [
      { t: "dialogue", speaker: "นักพรตจิงซิน", text: "ดนตรีกับดาบไม่ขัดกัน — ถ้าใจสงบ" },
      { t: "narration", text: "ขลุ่ยในมือเธอแอบบรรจุใบดาบบาง ๆ เสียงลมผ่านขลุ่ยฟังคล้ายบทสวด" },
      { t: "dialogue", speaker: "นักพรตจิงซิน", text: "ฟังเสียงนี้ แล้วเจ้าจะเข้าใจว่าทำไมเหิงซานเหนือไม่กลัวการโจมตี" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_north_nun2_yilin_talk",
    lines: [
      { t: "narration", text: "นักพรตอี๋หลินถือไม้กวาด กวาดใบไม้ที่ลานวัดด้วยรอยยิ้ม" },
      { t: "dialogue", speaker: "นักพรตอี๋หลิน", text: "พี่ทั้งหลายเก่งดาบมาก ข้ายังไกลนัก แต่อาจารย์บอกว่าใจสำคัญกว่ามือ" },
      { t: "dialogue", speaker: "นักพรตอี๋หลิน", text: "เจ้าจะมาฝึกที่นี่ไหม? ข้าจะคอยกวาดลานให้สะอาดทุกเช้า" },
    ],
  },
];
