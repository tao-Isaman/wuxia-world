import type { Scene } from "../../../types";

// Per-sect content for hengshan_south.
// เฮิงซานใต้ — ห้องโถงห้ายอด · กระบี่ลีลาระบำ · ดนตรีคู่ดาบ

export const SCENES_HENGSHAN_SOUTH: readonly Scene[] = [
  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_master_modaxiansheng_talk",
    lines: [
      { t: "narration", text: "อาจารย์โม่ต้านั่งใต้ต้นสนเก่า ในมือถือซอตัวเล็กบรรเลงทำนองเศร้าที่ดูเรียบง่ายแต่กินใจ" },
      { t: "dialogue", speaker: "โม่ต้า", text: "เสียงซอกับเสียงดาบ — ที่จริงไม่ต่างกันนัก" },
      { t: "dialogue", speaker: "โม่ต้า", text: "เจ้าหนุ่ม เจ้ามาที่ห้ายอดด้วยเหตุใด?" },
    ],
    choices: [
      { text: "แค่ทักทาย", next: "sect_hengshan_south" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_hengshan_south_disciple_intro_offer",
    lines: [
      { t: "narration", text: "อาจารย์โม่ต้าวางซอลงข้างกาย พินิจหน้าเจ้านิ่ง ๆ ก่อนพยักหน้า" },
      { t: "dialogue", speaker: "โม่ต้า", text: "เจ้าจะเป็นศิษย์เฮิงซานใต้? — ใจเจ้าค่อนข้างนิ่ง พอใช้ได้" },
      { t: "dialogue", speaker: "โม่ต้า", text: "แต่กระบี่ของห้ายอดต้องตีจากเหล็กดิบของเรา ไม่ใช้ดาบที่ไหนก็ได้" },
      { t: "dialogue", speaker: "โม่ต้า", text: "เก็บค่าเข้าสำนัก ๕๐๐ ทอง และเหล็กดิบ ๓ ก้อนมาให้ — ข้าจะรับเจ้าเป็นศิษย์ขั้นที่ ๙ และตีกระบี่ฝึกให้" },
    ],
    choices: [
      { text: "ข้าจะไปเตรียมของและเงิน", next: "sect_hengshan_south" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_hengshan_south_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางถุงทองและเหล็กดิบลงบนโต๊ะหินใต้ต้นสน" },
      { t: "dialogue", speaker: "โม่ต้า", text: "ครบจำนวน — ใจเจ้านิ่ง มือเจ้าก็มั่น ข้ายินดีรับเจ้าเข้าสำนัก" },
      { t: "narration", text: "ท่านยกกระบี่บางใบหนึ่งที่เพิ่งหลอมเสร็จส่งให้เจ้าด้วยมือทั้งสอง ปลายกระบี่สะท้อนแสงพระอาทิตย์ระยับ" },
      { t: "dialogue", speaker: "โม่ต้า", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์เฮิงซานใต้ขั้นที่ ๙ — รับกระบี่เฮิงซานและลมหายใจห้ายอดเป็นวิชาแรก" },
      { t: "dialogue", speaker: "โม่ต้า", text: "จงเรียนกระบี่เหมือนเรียนระบำ — เคลื่อนไหวลื่นไหล ใจสงบ" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบคุณ (จ่าย 500 ทอง)",
        next: "sect_hengshan_south",
        // Gate the choice on actually having the gold — prevents broke
        // players from finishing the quest by accident and going to 0.
        visibleIf: { t: "goldAtLeast", amount: 500 },
        effects: [
          { t: "addGold", amount: -500 },
          { t: "takeItem", itemId: "iron_ore", count: 3 },
          { t: "finishQuest", questId: "qst_hengshan_south_disciple_intro", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_vice_liuzhengfeng_talk",
    lines: [
      { t: "narration", text: "หลิวเจิ้งเฟิงนั่งบนชะง่อนผาเดี่ยวกับพิณคู่กาย เสียงพิณลอยไปกับสายลมยอดเขา" },
      { t: "dialogue", speaker: "หลิวเจิ้งเฟิง", text: "ดนตรีกับกระบี่ — สองสิ่งนี้แบ่งใจไม่ออกในทางของเรา" },
      { t: "dialogue", speaker: "หลิวเจิ้งเฟิง", text: "ถ้าเจ้าตั้งใจฝึกใจให้สงบ กระบี่ของเจ้าก็จะลื่นไหลตามมาเอง" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_elder_luge_talk",
    lines: [
      { t: "narration", text: "อาจารย์ลู่เก๋อยืนสาธิตท่ากระบี่ห้ายอดให้ศิษย์รุ่นเยาว์ ปลายกระบี่หมุนเป็นรูปวงกลมต่อเนื่อง" },
      { t: "dialogue", speaker: "ลู่เก๋อ", text: "กระบี่ห้ายอดต้องไหลลื่นเหมือนเมฆาบนยอดเขา — ไม่หยุด ไม่ขัด" },
      { t: "dialogue", speaker: "ลู่เก๋อ", text: "อยากลองประลองสักท่าไหม? ข้าจะสอนเจ้าด้วยตัวกระบี่เอง" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_disciple_yuepan_talk",
    lines: [
      { t: "dialogue", speaker: "ศิษย์เยว่ผาน", text: "ห้ายอดเฮิงซานเล่นกระบี่เป็นระบำ มาเต้นกันสักท่าไหม?" },
      { t: "narration", text: "เขายิ้มกว้าง ปลายกระบี่หมุนเล่นในมือเหมือนพัดสะบัด" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_sect_hengshan_south_disciple2_qingfeng_talk",
    lines: [
      { t: "narration", text: "ศิษย์ชิงเฟิงโผล่ออกมาจากบนต้นสน ลงพื้นด้วยจังหวะเบาแทบไม่ได้ยินเสียง" },
      { t: "dialogue", speaker: "ศิษย์ชิงเฟิง", text: "ตัวเบาของห้ายอด — วิ่งบนยอดต้นไม้ก็ยังได้!" },
      { t: "dialogue", speaker: "ศิษย์ชิงเฟิง", text: "เจ้าอยากลองเทียบความเร็วกันไหม? ข้าไม่กลัวใครหรอก" },
    ],
  },
];
