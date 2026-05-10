import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES__OTHER: readonly Scene[] = [
  {
    kind: "dialog",
    id: "qs_quanzhen_master_gumu_hint",
    lines: [
      { t: "narration", text: "อาจารย์ฉงหยางถอนหายใจเบา ๆ มองออกไปทางหุบเขาด้านเหนือ" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "เจ้ารู้ตำนานนี้แล้วหรือ... ใช่ ข้ามหุบเขาไปทางเหนือ มีสุสานโบราณตั้งอยู่ตรงข้ามวัดของเรา" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "หลินเฉาอิง — หญิงสาวที่เคยรักท่านอาจารย์ใหญ่หวังฉงหยางผู้ก่อตั้งฉวนเจิน เมื่อความรักของนางไม่ได้รับการตอบสนอง นางจึงสร้างสุสานนั้นขึ้น" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "ทุกวิชาในสุสานโบราณถูกออกแบบมาเพื่อรับและแซงหน้าวิชาฉวนเจิน — โดยเฉพาะหนึ่งพลังสุริยันต์ที่เจ้าฝึกอยู่" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "ว่ากันว่า... ผู้สืบทอดยังคงอยู่ที่นั่น เงียบ และแข็งแกร่งเกินคำบรรยาย หากเจ้าอยากรู้เพิ่ม เดินทางไปดูเองเถิด" },
      { t: "dialogue", speaker: "ฉงหยาง", text: "แต่จงระวัง — ผู้ที่ก้าวเข้าไป มักไม่กลับออกมาเหมือนเดิม" },
    ],
    choices: [
      { text: "ขอบพระคุณท่าน", next: "sect_quanzhen" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_quanzhen_vice_gumu_hint",
    lines: [
      { t: "narration", text: "หม่ายวี่หรี่ตามองเจ้านิ่ง ๆ" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "เจ้าฝึกหนึ่งพลังสุริยันต์จนเจอกำแพงแล้วสิ — ใช่ไหม?" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "ปลายของแสง... อยู่ในเงา ปลายของไฟ... อยู่ในน้ำแข็ง พลังตรงข้ามนั้นเองที่จะปลดล็อกขั้นต่อไป" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "ข้ามภูเขาไปทางเหนือ มีสุสานเก่าตั้งอยู่ตรงข้ามวัด — แต่ข้าเตือนเจ้า หากเจ้าก้าวเข้าไปและรับวิชา เจ้าจะไม่เป็นศิษย์ฉวนเจินอีก" },
      { t: "dialogue", speaker: "หม่ายวี่", text: "เลือกเอง... แต่จงเลือกอย่างมีสติ" },
    ],
    choices: [
      { text: "ขอบคุณคำเตือน", next: "sect_quanzhen" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_villa_yaowang_doctor_shennong_talk",
    lines: [
      { t: "narration", text: "หมอเสินหนงนั่งจำแนกสมุนไพรในห้องวุ่นวายที่เต็มไปด้วยยาหม้อและหนังสือ" },
      { t: "dialogue", speaker: "เสินหนง", text: "อ๋อ มีแขกมาด้วย สักครู่นะ... ข้ากำลังตรวจสอบตำรับยา" },
      { t: "dialogue", speaker: "เสินหนง", text: "ถ้าต้องการยาหรือความรู้ด้านสมุนไพร ข้าช่วยได้" },
    ],
    choices: [
      {
        text: "รับภารกิจหาส่วนผสม",
        next: "qs_qst_yaowang_rare_ingredient_offer",
        visibleIf: { t: "questStatus", questId: "qst_yaowang_rare_ingredient", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yaowang_rare_ingredient" }],
      },
      {
        text: "ส่งโสมและหยก",
        next: "qs_qst_yaowang_rare_ingredient_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yaowang_rare_ingredient", status: "active" },
            { t: "hasItem", itemId: "ginseng", count: 2 },
            { t: "hasItem", itemId: "jade", count: 1 },
          ],
        },
        effects: [
          { t: "takeItem", itemId: "ginseng", count: 2 },
          { t: "takeItem", itemId: "jade", count: 1 },
          { t: "finishQuest", questId: "qst_yaowang_rare_ingredient", success: true },
        ],
      },
      {
        text: "รับภารกิจตรวจหมู่บ้านระบาด",
        next: "qs_qst_yaowang_plague_village_offer",
        visibleIf: { t: "questStatus", questId: "qst_yaowang_plague_village", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yaowang_plague_village" }],
      },
      {
        text: "รายงานผลหมู่บ้านระบาด",
        next: "qs_qst_yaowang_plague_village_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yaowang_plague_village", status: "active" },
            { t: "flag", flag: "plague_village_reported" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_yaowang_plague_village", success: true }],
      },
      {
        text: "รับภารกิจสืบพิษปริศนา",
        next: "qs_qst_yaowang_venom_antidote_offer",
        visibleIf: { t: "questStatus", questId: "qst_yaowang_venom_antidote", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yaowang_venom_antidote" }],
      },
      {
        text: "รายงานผลการสืบพิษ",
        next: "qs_qst_yaowang_venom_antidote_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yaowang_venom_antidote", status: "active" },
            { t: "flag", flag: "venom_source_found" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_yaowang_venom_antidote", success: true }],
      },
      { text: "แค่ทักทาย", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_rare_ingredient_offer",
    lines: [
      { t: "dialogue", speaker: "เสินหนง", text: "ข้ากำลังปรุงยาตำรับพิเศษ ต้องการโสม 2 หน่วยและหยก 1 ชิ้น" },
      { t: "dialogue", speaker: "เสินหนง", text: "หากหามาได้จะมีบัวหิมะเป็นรางวัล" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_rare_ingredient_complete",
    lines: [
      { t: "narration", text: "หมอเสินหนงรับส่วนผสมและเริ่มบดปนทันที" },
      { t: "dialogue", speaker: "เสินหนง", text: "ยอดเยี่ยม! ส่วนผสมครบแล้ว บัวหิมะนี้เป็นรางวัลของเจ้า" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_plague_village_offer",
    lines: [
      { t: "dialogue", speaker: "เสินหนง", text: "ได้ยินว่ามีหมู่บ้านป่วยระบาด อาการแปลกมาก" },
      { t: "dialogue", speaker: "เสินหนง", text: "ไปดูให้ข้าหน่อย เก็บตัวอย่างพืชพรรณที่นั่นมาด้วย" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_plague_village_complete",
    lines: [
      { t: "narration", text: "หมอเสินหนงตรวจตัวอย่างที่เจ้านำมาอย่างละเอียด" },
      { t: "dialogue", speaker: "เสินหนง", text: "อ้อ... นี่เป็นพิษจากพืชชนิดหนึ่ง ไม่ใช่โรคระบาด ข้าแก้ได้แล้ว" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_venom_antidote_offer",
    lines: [
      { t: "dialogue", speaker: "เสินหนง", text: "มีนักรบตายจากพิษลึกลับ ข้าวิเคราะห์แล้วว่าเป็นพิษงูชนิดพิเศษ" },
      { t: "dialogue", speaker: "เสินหนง", text: "ช่วยหาพิษงู 2 หน่วยมา แล้วติดตามหาว่าใครวางยา" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yaowang_venom_antidote_complete",
    lines: [
      { t: "narration", text: "หมอเสินหนงฟังรายงานและจดบันทึกอย่างรวดเร็ว" },
      { t: "dialogue", speaker: "เสินหนง", text: "ข้อมูลนี้มีค่ามาก... ข้าจะแจ้งให้ยุทธภพรู้เพื่อป้องกัน" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yaowang" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_temple_dalun_monk_kongxin_talk",
    lines: [
      { t: "narration", text: "พระกงซินยืนอยู่หน้าพระพุทธรูปโบราณ บุหงาควันพวยขึ้นเบา ๆ" },
      { t: "dialogue", speaker: "กงซิน", text: "สาธุ... วัดนี้เปิดรับผู้แสวงหาสัจธรรมทุกคน" },
      { t: "dialogue", speaker: "กงซิน", text: "มีเรื่องที่ท่านต้องการความช่วยเหลือ?" },
    ],
    choices: [
      {
        text: "รับภารกิจพระธาตุสูญหาย",
        next: "qs_qst_dalun_stolen_relic_offer",
        visibleIf: { t: "questStatus", questId: "qst_dalun_stolen_relic", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_dalun_stolen_relic" }],
      },
      {
        text: "นำพระธาตุกลับมาแล้ว",
        next: "qs_qst_dalun_stolen_relic_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_dalun_stolen_relic", status: "active" },
            { t: "flag", flag: "dalun_relic_recovered" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_dalun_stolen_relic", success: true }],
      },
      {
        text: "รับภารกิจแสวงบุญ",
        next: "qs_qst_dalun_pilgrim_offer",
        visibleIf: { t: "questStatus", questId: "qst_dalun_pilgrim_mission", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_dalun_pilgrim_mission" }],
      },
      {
        text: "กลับจากวัดเทียนหนิงแล้ว",
        next: "qs_qst_dalun_pilgrim_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_dalun_pilgrim_mission", status: "active" },
            { t: "visitedLocation", locationId: "temple_tianning" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_dalun_pilgrim_mission", success: true }],
      },
      { text: "แค่ทักทาย", next: "temple_dalun" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_dalun_stolen_relic_offer",
    lines: [
      { t: "dialogue", speaker: "กงซิน", text: "พระธาตุโบราณของวัดเราหายไปในคืนพายุ" },
      { t: "dialogue", speaker: "กงซิน", text: "ข้าพบว่ามีพระรูปหนึ่งไม่ปรากฏตัวในช่วงนั้น... ข้ายังไม่กล้ากล่าวหา" },
    ],
    choices: [
      { text: "รับภารกิจสืบสวน", next: "temple_dalun" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_dalun_stolen_relic_complete",
    lines: [
      { t: "narration", text: "พระกงซินรับพระธาตุด้วยมือสั่นเล็กน้อย น้ำตาแทบคลอเบ้า" },
      { t: "dialogue", speaker: "กงซิน", text: "ขอพระคุ้มครอง... วัดสมบูรณ์อีกครั้งแล้ว ขอบคุณมาก" },
    ],
    choices: [
      { text: "รับรางวัล", next: "temple_dalun" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_dalun_pilgrim_offer",
    lines: [
      { t: "dialogue", speaker: "กงซิน", text: "วัดตาหลุนและวัดเทียนหนิงมีพิธีกรรมร่วมกันมาหลายร้อยปี" },
      { t: "dialogue", speaker: "กงซิน", text: "เจ้าช่วยไปแวะวัดเทียนหนิงและกลับมาบอกข้าได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "temple_dalun" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_dalun_pilgrim_complete",
    lines: [
      { t: "narration", text: "พระกงซินฟังรายงานอย่างตั้งใจ ใบหน้าสงบ" },
      { t: "dialogue", speaker: "กงซิน", text: "ขอบคุณ... ความสัมพันธ์ระหว่างสองวัดยังคงแน่นแฟ้น" },
    ],
    choices: [
      { text: "รับรางวัล", next: "temple_dalun" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_villa_yanzi_lord_yanfeng_talk",
    lines: [
      { t: "narration", text: "เจ้าบ้านเหยินเฟิงนั่งอยู่ในห้องรับแขกกว้าง หน้าตาสง่า มีพนักงานรับใช้หลายคน" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ยินดีต้อนรับ... ข้าได้ยินชื่อเสียงเจ้าบ้าง ผู้ที่มีฝีมือเป็นที่ต้องการของข้าเสมอ" },
    ],
    choices: [
      {
        text: "รับภารกิจขับไล่ตระกูลคู่อริ",
        next: "qs_qst_yanzi_rival_clan_offer",
        visibleIf: { t: "questStatus", questId: "qst_yanzi_rival_clan", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yanzi_rival_clan" }],
      },
      {
        text: "จัดการตระกูลหลงแล้ว",
        next: "qs_qst_yanzi_rival_clan_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yanzi_rival_clan", status: "active" },
            { t: "flag", flag: "yanzi_rivals_defeated" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_yanzi_rival_clan", success: true }],
      },
      {
        text: "รับภารกิจคุ้มกัน",
        next: "qs_qst_yanzi_bodyguard_offer",
        visibleIf: { t: "questStatus", questId: "qst_yanzi_bodyguard_escort", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yanzi_bodyguard_escort" }],
      },
      {
        text: "ส่งมอบสำเร็จ (รายงาน)",
        next: "qs_qst_yanzi_bodyguard_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yanzi_bodyguard_escort", status: "active" },
            { t: "flag", flag: "yanzi_escort_done" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_yanzi_bodyguard_escort", success: true }],
      },
      {
        text: "รับภารกิจมรดกสูญหาย",
        next: "qs_qst_yanzi_stolen_heirloom_offer",
        visibleIf: { t: "questStatus", questId: "qst_yanzi_stolen_heirloom", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_yanzi_stolen_heirloom" }],
      },
      {
        text: "พบดาบมรดกแล้ว",
        next: "qs_qst_yanzi_stolen_heirloom_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_yanzi_stolen_heirloom", status: "active" },
            { t: "flag", flag: "yanzi_sword_recovered" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_yanzi_stolen_heirloom", success: true }],
      },
      { text: "แค่ทักทาย", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_rival_clan_offer",
    lines: [
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ตระกูลหลงส่งนักรบมาข่มขู่อีกแล้ว พวกเขาต้องการที่ดินของข้า" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ขับไล่หัวหน้าพวกเขาออกไปและข้าจะให้รางวัลงาม" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_rival_clan_complete",
    lines: [
      { t: "narration", text: "เจ้าบ้านเหยินเฟิงยิ้มกว้างเมื่อได้ยินข่าวดี" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ดีมาก! ตระกูลหลงจะไม่กล้ายุ่งกับเราอีกแล้ว" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_bodyguard_offer",
    lines: [
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ข้าส่งพ่อค้าของข้าไปค้าขาย เส้นทางอันตราย" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "คุ้มกันเขาถึงจุดหมายและกลับมา ข้าจะให้รางวัลดีมาก" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_bodyguard_complete",
    lines: [
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ดีมาก พ่อค้าของข้ารายงานว่าเจ้าสู้ดี!" },
      { t: "narration", text: "เจ้าบ้านส่งถุงเงินให้อย่างเต็มใจ" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_stolen_heirloom_offer",
    lines: [
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ดาบมรดกของตระกูลเหยินหายไปในคืนงานเลี้ยง" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ผู้ต้องสงสัยสามคน: แขกชาวเหนือ ข้าราชบริพาร และบุตรสาวตระกูลหลง" },
    ],
    choices: [
      { text: "รับภารกิจสืบสวน", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_yanzi_stolen_heirloom_complete",
    lines: [
      { t: "narration", text: "เจ้าบ้านเหยินเฟิงรับดาบมรดกคืนด้วยน้ำตาแทบคลอ" },
      { t: "dialogue", speaker: "เหยินเฟิง", text: "ดาบนี้เป็นของตระกูลเรามาหลายชั่วอายุคน... ขอบคุณมาก" },
    ],
    choices: [
      { text: "รับรางวัล", next: "villa_yanzi" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_yanzi_heirloom_investigation",
    lines: [
      { t: "narration", text: "เจ้าสอบสวนผู้ต้องสงสัยสามคนอย่างระมัดระวัง" },
      { t: "narration", text: "แขกชาวเหนือมีสีหน้าเฉยเมย ข้าราชบริพารหน้าตกใจ บุตรสาวตระกูลหลงดูเป็นปกติเกินไป" },
    ],
    choices: [
      {
        text: "กล่าวหาบุตรสาวตระกูลหลง",
        next: "qs_yanzi_heirloom_confront",
        effects: [
          { t: "setFlag", flag: "yanzi_sword_suspect", value: "long_daughter" },
        ],
      },
      {
        text: "กล่าวหาข้าราชบริพาร",
        next: "qs_yanzi_heirloom_confront",
        effects: [
          { t: "setFlag", flag: "yanzi_sword_suspect", value: "servant" },
        ],
      },
      {
        text: "กล่าวหาแขกชาวเหนือ",
        next: "qs_yanzi_heirloom_confront",
        effects: [
          { t: "setFlag", flag: "yanzi_sword_suspect", value: "northern_guest" },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_yanzi_heirloom_confront",
    lines: [
      { t: "narration", text: "เจ้าเผชิญหน้ากับผู้ต้องสงสัย ความตึงเครียดสูงขึ้น" },
      { t: "narration", text: "ผู้ต้องสงสัยชักดาบออกมา — ดาบมรดกอยู่ในมือเขา!" },
    ],
    choices: [
      {
        text: "เข้าสู้ทันที",
        next: "qs_yanzi_heirloom_battle",
        effects: [
          {
            t: "triggerBattle",
            opponentId: "shadow_assassin",
            onWin: "qs_yanzi_heirloom_win",
            onLose: "villa_yanzi",
            nonFatal: true,
          },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_yanzi_heirloom_battle",
    lines: [
      { t: "narration", text: "การต่อสู้เริ่มขึ้น..." },
    ],
  },

  {
    kind: "dialog",
    id: "qs_yanzi_heirloom_win",
    lines: [
      { t: "narration", text: "ผู้ขโมยล้มลง ดาบมรดกหล่นจากมือเขา" },
      { t: "dialogue", speaker: "ผู้ขโมย", text: "ฉัน... แพ้แล้ว" },
    ],
    choices: [
      {
        text: "นำดาบกลับให้เจ้าบ้าน",
        next: "npc_villa_yanzi_lord_yanfeng_talk",
        effects: [{ t: "setFlag", flag: "yanzi_sword_recovered", value: true }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_ming_defector_brought_back",
    lines: [
      { t: "narration", text: "เจ้านำผู้แปรพักตร์กลับพรรค สีหน้าของเขาสิ้นหวัง" },
      { t: "narration", text: "เจ้ารู้สึกอึดอัดในใจ แต่ภารกิจสำเร็จ" },
    ],
    choices: [
      { text: "กลับรายงานผู้อาวุโส", next: "npc_sect_ming_elder_zhuying_talk" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_ming_defector_released",
    lines: [
      { t: "narration", text: "เจ้าช่วยผู้แปรพักตร์หลบหนีอย่างลับ ๆ เขาขอบคุณด้วยน้ำตา" },
      { t: "dialogue", speaker: "ผู้แปรพักตร์", text: "เจ้าช่วยชีวิตข้า... ข้าจะไม่ลืมนี้" },
    ],
    choices: [
      { text: "กลับรายงานผู้อาวุโส (โกหก)", next: "npc_sect_ming_elder_zhuying_talk" },
    ],
  },

  {
    kind: "dialog",
    id: "npc_palace_zhongyang_envoy_liuying_talk",
    lines: [
      { t: "narration", text: "ทูตหลิวอิงยืนอยู่ในห้องโถงวัง แต่งตัวสวยงามตามขนบธรรมเนียมราชสำนัก สายตาตื่นตัวเสมอ" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ยินดีต้อนรับสู่วังจงหยาง ข้าเป็นตัวแทนของพระราชา ท่านนักเดินทาง" },
    ],
    choices: [
      {
        text: "รับภารกิจสาส์นพระราชา",
        next: "qs_qst_zhongyang_imperial_letter_offer",
        visibleIf: { t: "questStatus", questId: "qst_zhongyang_imperial_letter", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_zhongyang_imperial_letter" }],
      },
      {
        text: "ส่งสาส์นแล้ว (รายงาน)",
        next: "qs_qst_zhongyang_imperial_letter_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_zhongyang_imperial_letter", status: "active" },
            { t: "flag", flag: "zhongyang_letter_delivered" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_zhongyang_imperial_letter", success: true }],
      },
      {
        text: "รับภารกิจสงครามขุนนาง",
        next: "qs_qst_zhongyang_noble_intrigue_offer",
        visibleIf: { t: "questStatus", questId: "qst_zhongyang_noble_intrigue", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_zhongyang_noble_intrigue" }],
      },
      {
        text: "รายงานผลสงครามขุนนาง",
        next: "qs_qst_zhongyang_noble_intrigue_decide",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_zhongyang_noble_intrigue", status: "active" },
            { t: "flag", flag: "zhongyang_intrigue_investigated" },
          ],
        },
      },
      {
        text: "รับภารกิจคุ้มกันพิธี",
        next: "qs_qst_zhongyang_ceremony_offer",
        visibleIf: { t: "questStatus", questId: "qst_zhongyang_ceremony_guard", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_zhongyang_ceremony_guard" }],
      },
      {
        text: "คุ้มกันพิธีสำเร็จ",
        next: "qs_qst_zhongyang_ceremony_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_zhongyang_ceremony_guard", status: "active" },
            { t: "flag", flag: "zhongyang_ceremony_guarded" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_zhongyang_ceremony_guard", success: true }],
      },
      { text: "แค่ทักทาย", next: "palace_zhongyang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_imperial_letter_offer",
    lines: [
      { t: "dialogue", speaker: "หลิวอิง", text: "สาส์นนี้เร่งด่วนมาก พระราชาต้องการแจ้งอาจารย์อู่ตัง" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ไปส่งให้อาจารย์ชิงซวี่โดยเร็ว" },
    ],
    choices: [
      {
        text: "รับสาส์น",
        next: "palace_zhongyang",
        effects: [{ t: "giveItem", itemId: "old_key", count: 1 }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_imperial_letter_complete",
    lines: [
      { t: "narration", text: "ทูตหลิวอิงพยักหน้าอย่างพอใจ" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ดีมาก ภารกิจสำเร็จ รับรางวัลไปด้วย" },
    ],
    choices: [
      { text: "รับรางวัล", next: "palace_zhongyang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_noble_intrigue_offer",
    lines: [
      { t: "dialogue", speaker: "หลิวอิง", text: "ขุนนางสองฝ่ายกำลังแย่งชิงตำแหน่ง ข้าต้องการรู้ว่าฝ่ายไหนโกง" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ไปสอดแนมทั้งสองฝ่ายแล้วกลับมารายงานตามความจริง" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "palace_zhongyang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_noble_intrigue_decide",
    lines: [
      { t: "narration", text: "เจ้าค้นพบว่าฝ่าย A โกงด้วยการรับสินบน แต่ฝ่าย B ก็มีความผิดในเรื่องอื่น" },
    ],
    choices: [
      {
        text: "รายงานความจริงทั้งหมด",
        next: "qs_zhongyang_intrigue_truth",
        effects: [
          { t: "addTrait", trait: "good", amount: 4 },
          { t: "addTrait", trait: "humility", amount: 2 },
        ],
      },
      {
        text: "รายงานเฉพาะฝ่าย A (เพื่อฝ่าย B)",
        next: "qs_zhongyang_intrigue_bias",
        effects: [
          { t: "addTrait", trait: "evil", amount: 3 },
          { t: "addGold", amount: 300 },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_zhongyang_intrigue_truth",
    lines: [
      { t: "narration", text: "ทูตฟังรายงานและพยักหน้าอย่างเคร่งขรึม" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ขอบคุณที่ซื่อสัตย์... เรื่องนี้จะต้องนำขึ้นสู่พระราชา" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "palace_zhongyang",
        effects: [
          { t: "setFlag", flag: "zhongyang_intrigue_resolved", value: "truth" },
          { t: "finishQuest", questId: "qst_zhongyang_noble_intrigue", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_zhongyang_intrigue_bias",
    lines: [
      { t: "narration", text: "เจ้ารายงานแบบบิดเบือน ทูตรับฟังอย่างพอใจ" },
      { t: "dialogue", speaker: "หลิวอิง", text: "ดีมาก... รับรางวัลเพิ่มพิเศษสำหรับความร่วมมือ" },
      { t: "narration", text: "เจ้ารู้สึกอึดอัดเล็กน้อย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "palace_zhongyang",
        effects: [
          { t: "setFlag", flag: "zhongyang_intrigue_resolved", value: "bias" },
          { t: "finishQuest", questId: "qst_zhongyang_noble_intrigue", success: true },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_ceremony_offer",
    lines: [
      { t: "dialogue", speaker: "หลิวอิง", text: "มีข่าวว่านักฆ่าจะโจมตีพิธีพรุ่งนี้..." },
      { t: "dialogue", speaker: "หลิวอิง", text: "เจ้าช่วยคอยเฝ้าระวังได้ไหม? ต้องการคนที่มีฝีมือจริง ๆ" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "palace_zhongyang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_ceremony_battle_offer",
    lines: [
      { t: "narration", text: "กลางพิธี ชายในชุดดำบุกเข้ามา!" },
      { t: "dialogue", speaker: "นักฆ่า", text: "ใครขวางทาง — ตาย!" },
    ],
    choices: [
      {
        text: "เข้าสู้!",
        next: "qs_qst_zhongyang_ceremony_win",
        effects: [
          {
            t: "triggerBattle",
            opponentId: "blade_master",
            onWin: "qs_qst_zhongyang_ceremony_win",
            onLose: "palace_zhongyang",
            nonFatal: false,
          },
        ],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_ceremony_win",
    lines: [
      { t: "narration", text: "นักฆ่าล้มลง พิธีดำเนินต่อได้อย่างราบรื่น" },
      { t: "narration", text: "ทูตหลิวอิงมองเจ้าด้วยความขอบคุณ" },
    ],
    choices: [
      {
        text: "กลับรายงาน",
        next: "npc_palace_zhongyang_envoy_liuying_talk",
        effects: [{ t: "setFlag", flag: "zhongyang_ceremony_guarded", value: true }],
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_zhongyang_ceremony_complete",
    lines: [
      { t: "narration", text: "ทูตหลิวอิงโค้งคำนับอย่างสุขุม" },
      { t: "dialogue", speaker: "หลิวอิง", text: "เจ้าช่วยรักษาพิธีสำคัญไว้ได้ ยุทธภพทั้งผืนเป็นหนี้บุญคุณเจ้า" },
    ],
    choices: [
      { text: "รับรางวัล", next: "palace_zhongyang" },
    ],
  },

  {
    kind: "dialog",
    id: "qs_gumu_lengyue_hint",
    lines: [
      { t: "narration", text: "เลิ่งเยว่หยุดชะงัก สายตาเย็น ๆ ของเธอเปลี่ยนเป็นแววประหลาดใจ" },
      { t: "dialogue", speaker: "ศิษย์เลิ่งเยว่", text: "เจ้าสัมผัสได้ถึงนาง? น่าประหลาด — ปกติศิษย์ฉวนเจินจะไม่เห็นแม้กระทั่งทางเข้าห้องลึก" },
      { t: "dialogue", speaker: "ศิษย์เลิ่งเยว่", text: "ใช่... ในห้องลึกของสุสานนี้ มีท่านอาจารย์ของข้า — หญิงผู้สวมชุดขาว ผู้สืบทอดสายเลือดของหลินเฉาอิงโดยตรง" },
      { t: "dialogue", speaker: "ศิษย์เลิ่งเยว่", text: "นางจะปรากฏแก่เจ้าเองหากเจ้าพร้อม จงเข้าไปด้านในและรอ — แต่จงเตรียมใจให้ดี เพราะนางเฉียบขาดยิ่งกว่าน้ำแข็ง" },
    ],
    choices: [
      { text: "ขอบคุณ ข้าจะลองดู", next: "sect_gumu" },
    ],
  },
];
