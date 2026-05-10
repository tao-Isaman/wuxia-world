import type { Scene } from "../../../types";

// Auto-split from sects-temples.ts by scripts/split-sects-file.ts.
// Edit individual entries here; the barrel file (../sects-temples.ts)
// re-exports the concatenated array so callers keep working.

export const SCENES_SHAOLIN: readonly Scene[] = [
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
      // Relic-recovery offer is gated to disciples only — strangers don't
      // get tasked with retrieving sacred relics. Hidden while the player
      // is mid-disciple-intro so they can't accidentally start a second
      // quest while accepting the registration trial.
      {
        text: "ข้ามาเพื่อช่วยเหลือ",
        next: "npc_sect_shaolin_abbot_huiyuan_talk_help",
        visibleIf: {
          t: "and",
          all: [
            { t: "questStatus", questId: "qst_shaolin_relic_theft", status: "none" },
            { t: "sectMember", sectId: "shaolin" },
          ],
        },
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
        // finishQuest moved to the complete scene's choice (see below).
        // Both turn-in paths — this dialog choice AND the NPC popup
        // "Turn in" button — converge there, so the quest reliably
        // closes regardless of which path the player takes.
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_shaolin_disciple_intro_offer",
    lines: [
      { t: "narration", text: "เจ้าอาวาสฮุยหยวนพยักหน้าช้า ๆ" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "เจ้าต้องการเป็นศิษย์เส้าหลิน? ดี — แต่วิชาเส้าหลินไม่ใช่สิ่งที่ให้กันได้ง่าย ๆ" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ห้องยาของวัดต้องการสมุนไพรหลากชนิด — สมุนไพรหายาก ๑๐, โสม ๑๐, เม็ดบัว ๑๐" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "นำมาให้ครบ แล้วเจ้าจะได้รับการรับรองเป็นศิษย์ขั้นที่ ๙ — นั่นคือบทพิสูจน์แรกของเจ้า" },
    ],
    choices: [
      {
        text: "ข้าจะไปทำตามคำสั่ง",
        next: "sect_shaolin",
      },
    ],
  },

  {
    kind: "dialog",
    id: "qs_qst_shaolin_disciple_intro_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรหลากชนิดลงบนแท่นหินด้านหน้าเจ้าอาวาส" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "เจ้ากลับมาแล้ว และครบจำนวนทุกชนิด... ไม่ใช่เรื่องง่าย แต่เจ้าทำได้" },
      { t: "narration", text: "ท่านพยักหน้าและยกมือขวาขึ้นปลายนิ้วประดิษฐานไว้กลางอก" },
      { t: "dialogue", speaker: "ฮุยหยวน", text: "ตั้งแต่บัดนี้ เจ้าคือศิษย์เส้าหลินขั้นที่ ๙ — รับเอาลมปราณอรหันต์เป็นวิชาแรกของเจ้า" },
    ],
    choices: [
      {
        text: "น้อมรับด้วยความขอบพระคุณ",
        next: "sect_shaolin",
        effects: [
          { t: "takeItem", itemId: "herb", count: 10 },
          { t: "takeItem", itemId: "ginseng", count: 10 },
          { t: "takeItem", itemId: "lotus_seed", count: 10 },
          { t: "finishQuest", questId: "qst_shaolin_disciple_intro", success: true },
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
        effects: [
          { t: "finishQuest", questId: "qst_shaolin_relic_theft", success: true },
        ],
      },
    ],
  },

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
        // Effects DELIBERATELY moved to the complete scene's choice so
        // both turn-in paths (this dialog choice AND the NPC popup's
        // "Turn in" button which routes straight to the complete scene)
        // converge on the same takeItem + finishQuest handler. Without
        // this, the popup path skipped finishQuest and let the player
        // re-turn-in indefinitely.
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
        effects: [
          { t: "takeItem", itemId: "mithril_ore", count: 1 },
          { t: "finishQuest", questId: "qst_shaolin_iron_training", success: true },
        ],
      },
    ],
  },

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
