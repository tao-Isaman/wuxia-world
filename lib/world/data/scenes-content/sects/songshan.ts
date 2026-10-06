import type { Scene } from "../../../types";

// Songshan sect scenes — 5 NPC talks + intro offer + intro complete (gold + iron deduction at choice).

export const SCENES_SONGSHAN: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_songshan_master_zuolengchan_talk",
    lines: [
      { t: "narration", text: "อาจารย์ใหญ่เกาซงเหยียนนั่งบนเก้าอี้หินขนาดใหญ่ในหอกลาง กระบี่เหล็กหนักวางพาดบนตัก" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "ซงซานคือเสาภูผาแห่งศาสตร์ดาบ — ผู้ใดเข้าสำนักนี้ ต้องหนักแน่นดั่งหิน" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "เจ้ามาทำสิ่งใดที่ยอดเขากลาง?" },
    ],
    choices: [
      { text: "แค่มาเยือน", next: "sect_songshan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_songshan_disciple_intro_offer",
    lines: [
      { t: "narration", text: "อาจารย์ใหญ่เกาซงเหยียนพยักหน้าและชี้ไปยังโรงตีดาบหลังหอกลาง" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "เจ้าใจรักดาบเหล็กของซงซาน? ดี — ใจของเจ้าเหมาะกับสำนักของข้า" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "แต่ดาบเหล็กของซงซานนั้นหนักหน่วง การหลอมต้องใช้ทั้งแร่เหล็กและทุน" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "นำแร่เหล็ก ๓ ก้อนและค่าเข้าสำนัก ๕๐๐ ทองมาให้ — ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙" },
    ],
    choices: [
      { text: "ข้าจะไปเตรียมของและเงิน", next: "sect_songshan" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_songshan_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงทองและแร่เหล็กลงบนโต๊ะหินหน้าหอกลาง" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "ครบจำนวน — เจ้าตั้งใจจริง ข้ายินดีรับเจ้าเข้าซงซาน" },
      { t: "narration", text: "ท่านลุกขึ้นพร้อมมอบกระบี่เหล็กหนักที่เพิ่งหลอมเสร็จด้วยมือทั้งสอง" },
      { t: "dialogue", speaker: "อาจารย์ใหญ่เกาซงเหยียน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์ซงซานขั้นที่ ๙ — วิชาของสำนัก ศิษย์พี่และอาจารย์จะถ่ายทอดให้ทีละขั้นเมื่อเจ้าพิสูจน์ตนได้ — ไปคารวะพวกเขาเถิด" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความเคารพ (จ่าย 500 ทอง)",
        next: "sect_songshan",
        // Gate the choice on actually having the gold — prevents broke
        // players from accidentally finishing the quest and going to 0.
        visibleIf: { t: "goldAtLeast", amount: 500 },
        effects: [
          { t: "addGold", amount: -500 },
          { t: "takeItem", itemId: "iron_ore", count: 3 },
          { t: "finishQuest", questId: "qst_songshan_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_songshan_vice_lubai_talk",
    lines: [
      { t: "narration", text: "รองอาจารย์เผิงอวิ๋นไห่ยืนพิงเสาหินกลางลานฝึก คอยจับตาดูศิษย์ทุกคนอย่างเงียบ" },
      { t: "dialogue", speaker: "รองอาจารย์เผิงอวิ๋นไห่", text: "ดาบของซงซานหนัก — มือของผู้ใช้ก็ต้องหนักให้สมกัน" },
      { t: "dialogue", speaker: "รองอาจารย์เผิงอวิ๋นไห่", text: "หากเจ้ามีใจจะเรียน ข้าก็จะไม่ห้าม" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_songshan_elder_dingmian_talk",
    lines: [
      { t: "narration", text: "อาจารย์เจิ้งซือหรานกำลังยกกระบี่เหล็กหนักฟันต้นไม้ใหญ่จนแตกออกเป็นสองท่อน" },
      { t: "dialogue", speaker: "อาจารย์อาวุโสเจิ้งซือหราน", text: "ดาบเหล็กของซงซาน ฟันลงครั้งเดียว — ต้องสะเทือนภูเขา" },
      { t: "dialogue", speaker: "อาจารย์อาวุโสเจิ้งซือหราน", text: "อยากลองวัดฝีมือกับข้าไหม? ข้าจะไม่ใช้พลังจริงให้เจ้าเสียศักดิ์" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_songshan_disciple_lifeng_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์หลี่เฟิง", text: "ข้าฝึกดาบเหล็กของซงซานมาสามปีแล้ว — แขนเริ่มแข็งดั่งหิน" },
      { t: "narration", text: "เขายกกระบี่ขึ้นในท่ามาตรฐานของซงซาน นัยน์ตาคมวับ" },
      { t: "dialogue", speaker: "ศิษย์หลี่เฟิง", text: "มาประลองหน่อยไหม? ข้าอยากรู้ว่าใจของเจ้าหนักพอจะรับดาบเหล็กของข้าไหม" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_songshan_disciple2_yangzhong_talk",
    lines: [
      { t: "narration", text: "ศิษย์หยางจงกำลังกวาดลานฝึก ใบหน้าเป็นสมาธิแม้ในงานเล็กน้อย" },
      { t: "dialogue", speaker: "ศิษย์หยางจง", text: "อาจารย์ใหญ่สอนว่า ก่อนจะใช้ดาบหนัก ใจต้องนิ่งก่อน" },
      { t: "dialogue", speaker: "ศิษย์หยางจง", text: "ถ้าเจ้าต้องการประลอง ข้ายินดี — แต่ระวังดาบเหล็กของข้าให้ดี" },
    ],
  },
];
