import type { Scene } from "../../types";

// NPC ambient dialogs + quest beats for sects, temples, palaces, and
// mansions. Owned by content agent C.
export const SCENES_SECTS_TEMPLES: readonly Scene[] = [
  // ══════════════════════════════════════════════════════════════════════
  // เส้าหลิน — เจ้าอาวาสฮุยหยวน
  // ══════════════════════════════════════════════════════════════════════

  // NPC ambient
  {
    kind: "dialog",
    id: "npc_sect_shaolin_abbot_huiyuan_talk",
    lines: [
      { t: "narration", text: "เจ้าอาวาสฮุยหยวนนั่งสงบนิ่งในวิหารหลัก สายตาแหลมคมจับจ้องเจ้า" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "คนหนุ่ม — ดาบไม่ใช่คำตอบเสมอไป แต่ก็ขาดมันไม่ได้ในยุทธภพ" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "เจ้าต้องการสิ่งใด? วิชา หรือความถูกต้อง?" },
    ],
    choices: [
      {
        text: "ข้ามาเพื่อเรียนวิชา",
        next: "npc_sect_shaolin_abbot_huiyuan_talk_skill",
      },
      {
        text: "ข้ามาเพื่อช่วยเหลือ",
        next: "npc_sect_shaolin_abbot_huiyuan_talk_help",
        visibleIf: { t: "questStatus", questId: "qst_shaolin_relic_theft", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_shaolin_relic_theft" }],
      },
      {
        text: "ข้ากลับมาแล้วท่าน (ส่งพระธาตุ)",
        next: "qs_qst_shaolin_relic_theft_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_shaolin_relic_theft", status: "active" },
            { t: "flag", flag: "shaolin_relic_recovered" },
          ],
        },
        effects: [
          { t: "finishQuest", questId: "qst_shaolin_relic_theft", success: true },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "npc_sect_shaolin_abbot_huiyuan_talk_skill",
    lines: [
      { t: "dialogue", speaker: "ฮุยหยวน", text: "วิชาเส้าหลินไม่ใช่สิ่งให้ได้ง่าย ๆ พิสูจน์จิตใจเจ้าก่อน" },
      { t: "narration", text: "ท่านจ้องมองเจ้าอย่างสงบ" },
    ],
  },
  {
    kind: "dialog",
    id: "npc_sect_shaolin_abbot_huiyuan_talk_help",
    lines: [
      { t: "dialogue", speaker: "ฮุยหยวน", text: "คืนที่ผ่านมา พระธาตุสำคัญของเราหายไป" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "มีร่องรอยว่าโจรปีนขื่อหนีออกไปทางทิศเหนือ หากเจ้าพบ — นำมาคืนเถิด" },
    ],
  },

  // Quest: qs_qst_shaolin_relic_theft_offer (ถูก start ผ่าน effects แล้ว)
  {
    kind: "dialog",
    id: "qs_qst_shaolin_relic_theft_complete",
    lines: [
      { t: "narration", text: "เจ้าวางพระธาตุลงบนแท่นด้วยความนอบน้อม" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ขอบคุณยอดยุทธ เส้าหลินจะจดจำบุญคุณนี้" },
      { t: "narration", text: "เจ้าอาวาสโค้งคำนับอย่างสุขุม" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "sect_shaolin",
      },
    ],
  },

  // Quest: disciple gone — offer and complete
  {
    kind: "dialog",
    id: "qs_qst_shaolin_disciple_gone_offer",
    lines: [
      { t: "dialogue", speaker: "ฮุยหยวน", text: "มีอีกเรื่องหนึ่ง... ลูกศิษย์ของเราชื่อเพ่ยหัวหายตัวไป" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ได้ยินว่าเขาไปก่อเรื่องที่เมือง หากพบเจอ — อย่าทำร้ายเขา นำกลับมา" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "sect_shaolin",
        effects: [{ t: "startQuest", questId: "qst_shaolin_disciple_gone" }],
      },
      { text: "ยังไม่พร้อม", next: "sect_shaolin" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_disciple_gone_complete",
    lines: [
      { t: "narration", text: "เจ้าพาเพ่ยหัวกลับมาถึงวัด หน้าตาของเขาอายแดง" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "เพ่ยหัว — กลับมาแล้ว บาปที่ทำไว้ต้องชดใช้ด้วยการฝึกวิชาสามเดือน" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ขอบคุณยอดยุทธ เส้าหลินเป็นหนี้บุญคุณ" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "sect_shaolin",
        effects: [{ t: "finishQuest", questId: "qst_shaolin_disciple_gone", success: true }],
      },
    ],
  },

  // Quest: proof of heart — trial scene
  {
    kind: "dialog",
    id: "qs_qst_shaolin_proof_of_heart_trial",
    lines: [
      { t: "narration", text: "เจ้าอาวาสนำเจ้าเข้าสู่ห้องลับเล็ก ๆ ที่มีธูปควันขึ้นอบอวล" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ข้าจะถามเจ้าเพียงคำถามเดียว..." },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "หากเจ้าต้องเลือกระหว่างชัยชนะและความเมตตา — เจ้าจะเลือกอะไร?" },
    ],
    choices: [
      {
        text: "ข้าเลือกความเมตตาเสมอ",
        next: "qs_qst_shaolin_proof_of_heart_complete_mercy",
        effects: [
          { t: "advanceQuest", questId: "qst_shaolin_proof_of_heart" },
          { t: "addTrait", trait: "humility", amount: 3 },
        ],
      },
      {
        text: "ชัยชนะนำมาซึ่งการปกป้องผู้อ่อนแอ",
        next: "qs_qst_shaolin_proof_of_heart_complete_strength",
        effects: [
          { t: "advanceQuest", questId: "qst_shaolin_proof_of_heart" },
          { t: "addTrait", trait: "good", amount: 3 },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_proof_of_heart_complete_mercy",
    lines: [
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ดี... นั่นคือหัวใจของพุทธ จิตใจเจ้าผ่านแล้ว" },
      { t: "narration", text: "ท่านยื่นมอบคัมภีร์เส้าหลินให้เจ้าด้วยรอยยิ้ม" },
    ],
    choices: [
      {
        text: "รับคัมภีร์ด้วยความนอบน้อม",
        next: "sect_shaolin",
        effects: [{ t: "finishQuest", questId: "qst_shaolin_proof_of_heart", success: true }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_proof_of_heart_complete_strength",
    lines: [
      { t: "dialogue", speaker: "ฮุยหยวน", text: "มิใช่คำตอบของพระ แต่ก็เป็นคำตอบของยอดยุทธ..." },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "เส้าหลินยินดีต้อนรับจิตใจที่มุ่งมั่นเพื่อคุ้มครองผู้อื่น" },
    ],
    choices: [
      {
        text: "รับคัมภีร์ด้วยความนอบน้อม",
        next: "sect_shaolin",
        effects: [{ t: "finishQuest", questId: "qst_shaolin_proof_of_heart", success: true }],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // เส้าหลิน — อาจารย์ฝาหมิง
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_shaolin_elder_faming_talk",
    lines: [
      { t: "narration", text: "อาจารย์ฝาหมิงยืนในลานฝึกอย่างสงบ จ้องมองลูกศิษย์อย่างใส่ใจ" },
      { t: "dialogue", speaker: "ฝาหมิง", text: "วิชากระดิ่งทองต้องการแร่เทพเป็นตัวช่วยในการฝึก" },
      { t: "dialogue", speaker: "ฝาหมิง", text: "หากเจ้าหามาได้ ข้าจะสอนวิชานั้นให้เจ้า" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "sect_shaolin",
        visibleIf: { t: "questStatus", questId: "qst_shaolin_iron_training", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_shaolin_iron_training" }],
      },
      {
        text: "ส่งแร่เทพ",
        next: "qs_qst_shaolin_iron_training_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_shaolin_iron_training", status: "active" },
            { t: "hasItem", itemId: "mithril_ore", count: 1 },
          ],
        },
        effects: [
          { t: "takeItem", itemId: "mithril_ore", count: 1 },
          { t: "finishQuest", questId: "qst_shaolin_iron_training", success: true },
        ],
      },
      { text: "พูดคุยทั่วไป", next: "sect_shaolin" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_iron_training_complete",
    lines: [
      { t: "narration", text: "อาจารย์ฝาหมิงรับแร่เทพไปพิจารณาด้วยสายตานักรู้" },
      { t: "dialogue", speaker: "ฝาหมิง", text: "ดีมาก — แร่นี้จะพาวิชากระดิ่งทองไปสู่ระดับใหม่" },
      { t: "dialogue", speaker: "ฝาหมิง", text: "นั่งฟัง ข้าจะสอนเจ้าตั้งแต่ต้น" },
    ],
    choices: [
      {
        text: "รับการสอนด้วยความขอบคุณ",
        next: "sect_shaolin",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // อู่ตัง — อาจารย์ชิงซวี่
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_wudang_master_qingxu_talk",
    lines: [
      { t: "narration", text: "อาจารย์ชิงซวี่นั่งจับคู่ลมหายใจในสวนผา สายลมเบาพัดผ่านเสื้อคลุมสีขาว" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "อู่ตังสอนว่าน้ำอ่อนโยนกว่าหิน แต่มันกัดกร่อนหินได้ในที่สุด" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "เจ้ามาเพื่ออะไร?" },
    ],
    choices: [
      {
        text: "ข้ามาขอความช่วยเหลือ",
        next: "qs_qst_wudang_sacred_herb_offer",
        visibleIf: { t: "questStatus", questId: "qst_wudang_sacred_herb", status: "none" },
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
        effects: [
          { t: "takeItem", itemId: "snow_lotus", count: 1 },
          { t: "finishQuest", questId: "qst_wudang_sacred_herb", success: true },
        ],
      },
      {
        text: "รับภารกิจลูกศิษย์ทรยศ",
        next: "qs_qst_wudang_traitor_disciple_offer",
        visibleIf: { t: "questStatus", questId: "qst_wudang_traitor_disciple", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_wudang_traitor_disciple" }],
      },
      {
        text: "รับภารกิจตราประทับ",
        next: "qs_qst_wudang_mountain_seal_offer",
        visibleIf: { t: "questStatus", questId: "qst_wudang_mountain_seal", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_wudang_mountain_seal" }],
      },
      { text: "แค่ทักทาย", next: "sect_wudang" },
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

  // ══════════════════════════════════════════════════════════════════════
  // ง้อไบ๊ — ท่านนิ้วห้วนจิงฉาน
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_emei_abbess_jingchan_talk",
    lines: [
      { t: "narration", text: "ท่านนิ้วจิงฉานยืนทอดพระเนตรสวนดอกไม้ด้วยสีหน้าสงบแต่มีเรื่องกังวล" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ง้อไบ๊สอนให้เราเมตตาต่อสรรพสิ่ง แต่บางครั้งโลกก็บีบให้เราใช้กำลัง" },
      { t: "dialogue", speaker: "จิงฉาน", text: "เจ้ามาด้วยเรื่องอะไร?" },
    ],
    choices: [
      {
        text: "รับภารกิจช่วยสาวก",
        next: "qs_qst_emei_kidnapped_novice_offer",
        visibleIf: { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_emei_kidnapped_novice" }],
      },
      {
        text: "ข้าพบสาวกแล้ว (ส่งมอบ)",
        next: "qs_qst_emei_kidnapped_novice_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_kidnapped_novice", status: "active" },
            { t: "flag", flag: "emei_novice_rescued" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_emei_kidnapped_novice", success: true }],
      },
      {
        text: "รับภารกิจพิษ",
        next: "qs_qst_emei_poison_antidote_offer",
        visibleIf: { t: "questStatus", questId: "qst_emei_poison_antidote", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_emei_poison_antidote" }],
      },
      {
        text: "ส่งพิษตะขาบ",
        next: "qs_qst_emei_poison_antidote_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_emei_poison_antidote", status: "active" },
            { t: "hasItem", itemId: "centipede_venom", count: 1 },
          ],
        },
        effects: [
          { t: "takeItem", itemId: "centipede_venom", count: 1 },
          { t: "finishQuest", questId: "qst_emei_poison_antidote", success: true },
        ],
      },
      { text: "แค่ทักทาย", next: "sect_emei" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_emei_kidnapped_novice_offer",
    lines: [
      { t: "dialogue", speaker: "จิงฉาน", text: "สาวกของเราถูกจับไปเรียกค่าไถ่ ข้ากังวลมาก" },
      { t: "dialogue", speaker: "จิงฉาน", text: "โจรซ่อนตัวอยู่แถวป่าทางตะวันออก เจ้าช่วยได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_emei" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_emei_kidnapped_novice_complete",
    lines: [
      { t: "narration", text: "ท่านนิ้วจิงฉานโอบกอดสาวกผู้กลับมาด้วยความโล่งใจ" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ขอบคุณมาก... สาวกของเราปลอดภัยแล้ว" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ง้อไบ๊จะไม่ลืมบุญคุณนี้" },
    ],
    choices: [
      { text: "รับรางวัลและกล่าวลา", next: "sect_emei" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_emei_poison_antidote_offer",
    lines: [
      { t: "dialogue", speaker: "จิงฉาน", text: "มีสาวกถูกวางยาพิษชนิดที่ข้าไม่รู้จัก" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ต้องการพิษตะขาบยักษ์เพื่อสังเคราะห์ยาต้านพิษ นำมาให้ได้ไหม?" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_emei" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_emei_poison_antidote_complete",
    lines: [
      { t: "narration", text: "ท่านนิ้วรับพิษตะขาบและรีบไปปรุงยา" },
      { t: "dialogue", speaker: "จิงฉาน", text: "ดีแล้ว... ข้าจะปรุงยาให้ทันเวลา ขอบคุณยอดยุทธ" },
    ],
    choices: [
      { text: "รับรางวัลและกล่าวลา", next: "sect_emei" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // วิลล่ายาวัง — หมอเสินหนง
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // วัดตาหลุน — พระกงซิน
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // คฤหาสน์เหยินซี — เจ้าบ้านเหยินเฟิง
  // ══════════════════════════════════════════════════════════════════════

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
  // ─── Scene: ผู้ต้องสงสัยดาบมรดก ─────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════════════
  // พรรคสว่างมืด — ผู้อาวุโสจูอิง
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_ming_elder_zhuying_talk",
    lines: [
      { t: "narration", text: "ผู้อาวุโสจูอิงนั่งอยู่ในมุมมืดของห้องรับแขก แสงเทียนน้อยเพียงพอที่จะเห็นรอยยิ้มที่ซ่อนนัยยะ" },
      { t: "dialogue", speaker: "จูอิง", text: "ยอดยุทธผู้มาเยือน... ข้าได้ยินว่าเจ้าน่าไว้วางใจ" },
      { t: "dialogue", speaker: "จูอิง", text: "พรรคสว่างมืดมีงานบางอย่างที่ต้องการผู้กล้า" },
    ],
    choices: [
      {
        text: "รับภารกิจจดหมายลับ",
        next: "qs_qst_ming_spy_mission_offer",
        visibleIf: { t: "questStatus", questId: "qst_ming_spy_mission", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_ming_spy_mission" }],
      },
      {
        text: "ส่งจดหมายแล้ว",
        next: "qs_qst_ming_spy_mission_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_ming_spy_mission", status: "active" },
            { t: "flag", flag: "ming_letter_delivered" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_ming_spy_mission", success: true }],
      },
      {
        text: "รับภารกิจผู้แปรพักตร์",
        next: "qs_qst_ming_defector_offer",
        visibleIf: { t: "questStatus", questId: "qst_ming_defector_choice", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_ming_defector_choice" }],
      },
      {
        text: "รายงานผลผู้แปรพักตร์",
        next: "qs_qst_ming_defector_complete",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_ming_defector_choice", status: "active" },
            { t: "flag", flag: "ming_defector_resolved" },
          ],
        },
        effects: [{ t: "finishQuest", questId: "qst_ming_defector_choice", success: true }],
      },
      { text: "แค่ทักทาย", next: "sect_ming" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_ming_spy_mission_offer",
    lines: [
      { t: "dialogue", speaker: "จูอิง", text: "ส่งจดหมายนี้ให้สายลับของเราในวังจงหยาง — อย่าให้ใครรู้" },
      { t: "narration", text: "จูอิงส่งซองจดหมายปิดผนึกมาให้เจ้า" },
    ],
    choices: [
      { text: "รับจดหมายและออกเดินทาง", next: "sect_ming" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_ming_spy_mission_complete",
    lines: [
      { t: "narration", text: "จูอิงพยักหน้าอย่างพอใจ" },
      { t: "dialogue", speaker: "จูอิง", text: "ดีมาก... เจ้าพิสูจน์ตัวเองแล้ว รับรางวัลไปด้วย" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_ming" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_ming_defector_offer",
    lines: [
      { t: "dialogue", speaker: "จูอิง", text: "สมาชิกคนหนึ่งต้องการออกจากพรรค เขารู้มากเกินไป" },
      { t: "dialogue", speaker: "จูอิง", text: "ตามหาเขา... แล้วตัดสินว่าจะทำอย่างไร เจ้ามีอิสระ" },
    ],
    choices: [
      { text: "รับภารกิจ", next: "sect_ming" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_ming_defector_decide",
    lines: [
      { t: "narration", text: "เจ้าพบผู้แปรพักตร์ในกระท่อมป่า เขาสีหน้าหมดหวัง" },
      { t: "dialogue", speaker: "ผู้แปรพักตร์", text: "ข้าเบื่อแล้วกับการต้องซ่อนตัวและโกหก... ข้าแค่อยากมีชีวิตปกติ" },
    ],
    choices: [
      {
        text: "นำตัวกลับพรรค",
        next: "qs_ming_defector_brought_back",
        effects: [
          { t: "addTrait", trait: "evil", amount: 2 },
          { t: "setFlag", flag: "ming_defector_resolved", value: true },
        ],
      },
      {
        text: "ปล่อยเขาไปและปิดบังเรื่องนี้",
        next: "qs_ming_defector_released",
        effects: [
          { t: "addTrait", trait: "good", amount: 4 },
          { t: "addTrait", trait: "humility", amount: 2 },
          { t: "setFlag", flag: "ming_defector_resolved", value: true },
        ],
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
    id: "qs_qst_ming_defector_complete",
    lines: [
      { t: "narration", text: "จูอิงฟังรายงานอย่างตั้งใจ ใบหน้าอ่านไม่ออก" },
      { t: "dialogue", speaker: "จูอิง", text: "ดีแล้ว... เรื่องนี้จบแล้ว รับรางวัลไปด้วย" },
    ],
    choices: [
      { text: "รับรางวัล", next: "sect_ming" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // พรรคยาจก — หัวหน้าหงเทียน
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "npc_sect_beggars_chief_hongtian_talk",
    lines: [
      { t: "narration", text: "หัวหน้าหงเทียนนั่งเอนหลังอย่างสบายใจ ไม้เท้าเก้าข้อพาดอยู่ข้างตัว" },
      { t: "dialogue", speaker: "หงเทียน", text: "ฮ่าฮ่า ยินดีต้อนรับ! ยาจกก็รู้จักน้ำใจเหมือนกัน" },
      { t: "dialogue", speaker: "หงเทียน", text: "พรรคยาจกมีหูมีตาทั่วยุทธภพ — เจ้าต้องการอะไร?" },
    ],
    choices: [
      {
        text: "รับภารกิจสายลับ",
        next: "qs_qst_beggars_spy_report_offer",
        visibleIf: { t: "questStatus", questId: "qst_beggars_spy_report", status: "none" },
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
        visibleIf: { t: "questStatus", questId: "qst_beggars_hungry_children", status: "none" },
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

  // ══════════════════════════════════════════════════════════════════════
  // วังจงหยาง — ทูตหลิวอิง
  // ══════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════
  // ภารกิจร่วม: ความลับใต้ผืนดิน (qst_shaolin_wudang_joint)
  // ══════════════════════════════════════════════════════════════════════

  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_start",
    lines: [
      { t: "narration", text: "เมื่อเจ้าเชื่อมโยงร่องรอยจากพระธาตุเส้าหลินและตราประทับอู่ตังเข้าด้วยกัน" },
      { t: "narration", text: "ทั้งสองชี้ไปยังถ้ำโบราณที่อยู่ระหว่างสองสำนัก" },
    ],
    choices: [
      {
        text: "รับภารกิจร่วมจากเจ้าอาวาสฮุยหยวน",
        next: "sect_shaolin",
        visibleIf: { t: "questStatus", questId: "qst_shaolin_wudang_joint", status: "none" },
        effects: [{ t: "startQuest", questId: "qst_shaolin_wudang_joint" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_cave",
    lines: [
      { t: "narration", text: "ถ้ำมืดทึบ กลิ่นหินเก่าและพลังปรานที่สะสมมานับพันปี" },
      { t: "narration", text: "ในใจกลางถ้ำมีรูปสลักโบราณของทั้งสองสำนัก..." },
      { t: "narration", text: "และสิ่งมีชีวิตหนึ่งที่คอยดูแลมันมาตลอด" },
    ],
    choices: [
      {
        text: "เผชิญหน้ากับผู้พิทักษ์",
        next: "qs_qst_shaolin_wudang_joint_battle",
        effects: [
          {
            t: "triggerBattle",
            opponentId: "demonic_master",
            onWin: "qs_qst_shaolin_wudang_joint_win",
            onLose: "sect_shaolin",
            nonFatal: false,
          },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_battle",
    lines: [
      { t: "narration", text: "ผู้พิทักษ์ลุกขึ้นจากความมืด..." },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_win",
    lines: [
      { t: "narration", text: "ผู้พิทักษ์ล้มลง ความลับโบราณปรากฏ — คัมภีร์ที่เส้าหลินและอู่ตังร่วมกันสร้างขึ้น" },
      { t: "narration", text: "ในคัมภีร์บอกว่าสองสำนักครั้งหนึ่งเป็นสำนักเดียวกัน..." },
    ],
    choices: [
      {
        text: "นำคัมภีร์กลับไปให้เจ้าอาวาส",
        next: "qs_qst_shaolin_wudang_joint_truth_reveal",
        effects: [
          { t: "addTrait", trait: "good", amount: 5 },
          { t: "setFlag", flag: "joint_secret_revealed", value: true },
        ],
      },
      {
        text: "เก็บความลับไว้คนเดียว",
        next: "qs_qst_shaolin_wudang_joint_secret_keep",
        effects: [
          { t: "addTrait", trait: "arrogance", amount: 3 },
          { t: "setFlag", flag: "joint_secret_hidden", value: true },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_truth_reveal",
    lines: [
      { t: "narration", text: "เจ้าอาวาสฮุยหยวนและอาจารย์ชิงซวี่ฟังเรื่องราวอย่างตั้งใจ" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "อู่ตังและเส้าหลิน... เป็นน้ำหนึ่งใจเดียวกัน ข้าลืมเรื่องนี้ไปนาน" },
      { t: "dialogue", speaker: "ชิงซวี่", text: "ขอบคุณยอดยุทธ ที่ทำให้เราจำสิ่งที่สำคัญกลับคืนมา" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "sect_shaolin",
        effects: [{ t: "finishQuest", questId: "qst_shaolin_wudang_joint", success: true }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qst_shaolin_wudang_joint_secret_keep",
    lines: [
      { t: "narration", text: "เจ้าเก็บคัมภีร์ไว้คนเดียว กลับรายงานว่าไม่พบสิ่งใดพิเศษ" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "... ขอบคุณที่ไปสำรวจ" },
      { t: "narration", text: "ความลับยังคงฝังอยู่ใต้ผืนดิน" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "sect_shaolin",
        effects: [{ t: "finishQuest", questId: "qst_shaolin_wudang_joint", success: true }],
      },
    ],
  },
];
