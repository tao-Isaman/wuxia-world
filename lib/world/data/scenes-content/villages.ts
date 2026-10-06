import type { Scene } from "../../types";

// NPC ambient dialogs + quest beats for villages and inns. Owned by
// content agent B.

export const SCENES_VILLAGES: readonly Scene[] = [
  // ═══════════════════════════════════════════════════════════════════
  // NPC AMBIENT TALK SCENES
  // ═══════════════════════════════════════════════════════════════════

  // ─── ลาวหนาน (village_qigu) ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_qigu_farmer_lao_talk",
    lines: [
      { t: "dialogue", speaker: "ลาวหนาน", text: "เจ้าหนู เจ้ามาจากไหน? หมู่บ้านชีกู่ไม่ค่อยมีคนแปลกหน้าแวะเวียน" },
      { t: "narration", text: "ชาวนาแก่วางจอบลงและถอนหายใจ" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ข้าทำนาที่นี่มาสี่สิบปี รู้จักทุกดิน ทุกหิน... แต่ยิ่งแก่ก็ยิ่งเห็นสิ่งที่ไม่เคยเข้าใจ" },
    ],
  },

  // ─── นางเหมย (village_qigu) ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_qigu_herbalist_mei_talk",
    lines: [
      { t: "narration", text: "หญิงสาวหน้าตาแจ่มใสกำลังบดสมุนไพรอยู่หน้าร้านยาเล็ก ๆ" },
      { t: "dialogue", speaker: "นางเหมย", text: "ต้องการยาอะไรไหม? ข้ามียาสมุนไพรจากเชิงเขาทุกชนิด" },
      { t: "dialogue", speaker: "นางเหมย", text: "แต่ข้าไม่ขายให้ใครก็ได้... ต้องเป็นคนที่ใจดี และรู้จักใช้ยาอย่างถูกทาง" },
    ],
  },

  // ─── เฉินเยว่ (village_meihua) ────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_meihua_musician_chen_talk",
    lines: [
      { t: "narration", text: "เสียงพิณดังกังวานมาจากใต้ต้นเหมย ชายหนุ่มผิวขาวกำลังดีดอยู่อย่างใจจดใจจ่อ" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "โอ้ เจ้ารบกวนข้าไม่ได้เลย... เล่นเพลงนี้มาสามวันแล้วยังไม่สมบูรณ์" },
      { t: "narration", text: "เขาหยุดดีดและมองเจ้าด้วยสายตาเหนื่อยล้า" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ฟังหน่อยได้ไหม? บางทีหูคนอื่นอาจช่วยให้ข้าเข้าใจว่าเพลงนี้ขาดอะไร" },
    ],
  },

  // ─── เปาเหล็กก้าน (village_meihua) ───────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_meihua_hunter_bao_talk",
    lines: [
      { t: "narration", text: "ชายร่างใหญ่นั่งลับมีดล่าสัตว์อยู่หน้าบ้าน แผลเป็นเก่าหลายแห่งบนแขน" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "เจ้ามาทำธุระอะไรในหมู่บ้านนี้?" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "ข้าเคยเป็นทหาร แต่ตอนนี้ชอบความสงบ หมูป่าในป่าสักตัวง่ายกว่าปัญหาของมนุษย์" },
    ],
  },

  // ─── ผู้อาวุโสอู๋ (village_hengshan) ─────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_hengshan_elder_wu_talk",
    lines: [
      { t: "narration", text: "ผู้เฒ่าสวมเสื้อผ้าเรียบง่าย นั่งฟังเสียงดนตรีของเด็กในหมู่บ้านอยู่" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ยินดีต้อนรับสู่หมู่บ้านฮิงซาน ที่นี่คนชอบดนตรีทุกคน" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ข้าเชื่อว่าเสียงดนตรีรักษาใจได้ดีกว่ายาใด ๆ ในโลก" },
    ],
  },

  // ─── เติ้งลองหาง (village_wuxia) ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_wuxia_fisherman_deng_talk",
    lines: [
      { t: "narration", text: "ชาวประมงสูงอายุนั่งซ่อมแหอยู่ริมน้ำ สายตาจับอยู่กับน้ำอย่างเข้มข้น" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "แม่น้ำตรงนี้ดูเรียบ แต่ข้างล่างมีกระแสน้ำวนซ่อนอยู่" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เช่นเดียวกับคนในหมู่บ้านนี้... เห็นว่าสงบ แต่ข้างในมีเรื่องเยอะ" },
    ],
  },

  // ─── นางสาวซิ่ว (inn_yuelai) ──────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_inn_yuelai_server_xiu_talk",
    lines: [
      { t: "narration", text: "สาวเสิร์ฟอ้วนกลมมาตามโต๊ะด้วยรอยยิ้มกว้าง" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ท่านผู้เดินทาง! ท่านมาถูกที่แล้ว โรงเตี๊ยมยั่วไหลดีที่สุดในห้าสิบลี้แถวนี้!" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ข้าอยู่ที่นี่มาสิบปี รู้ว่าใครผ่านมาบ้าง... อยากรู้เรื่องอะไรถามข้าได้" },
    ],
    // Recovery branch — when the debt-collector quest is already active
    // (player accepted in a save built before the offer→confront wiring
    // fix), give them a way to reach the confrontation from here.
    choices: [
      {
        text: "ไปจัดการนักเลงเรียกหนี้ที่คุกคามเจ้า",
        next: "qs_qv_inn_debt_collector_confront",
        visibleIf: { t: "questStatus", questId: "qv_inn_debt_collector", status: "active" },
      },
    ],
  },

  // ─── เฉาอ้วน (inn_gaosheng) ──────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_inn_gaosheng_keeper_fat_talk",
    lines: [
      { t: "narration", text: "ชายอ้วนผิวขาวสวมผ้ากันเปื้อนเดินออกมาจากครัวด้วยรอยยิ้ม" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ยินดีต้อนรับ! ข้าชื่อเฉาอ้วน เจ้าของโรงเตี๊ยมเก้าอี้สูงแห่งนี้" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เมื่อก่อนข้าล่มจมในยุทธจักร ตอนนี้พบว่าทำอาหารอร่อยสุขใจกว่าจริง ๆ" },
      { t: "narration", text: "เขาส่งชาร้อนหนึ่งถ้วยมาให้" },
    ],
  },

  // ─── โปผู้เล่าเรื่อง (inn_heluo) ─────────────────────────────────
  {
    kind: "dialog",
    id: "npc_inn_heluo_storyteller_po_talk",
    lines: [
      { t: "narration", text: "คนเฒ่าหน้าตาแปลกตานั่งอยู่มุมห้อง รายล้อมด้วยความมืดและกลิ่นชา" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "เจ้าอยากฟังเรื่องราวไหม? ข้ามีมากกว่าที่เจ้าคิด" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "บางเรื่องฟังแล้วหัวเราะ บางเรื่องทำให้นอนไม่หลับ... แต่ทุกเรื่องล้วนเป็นความจริง" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "เรื่องที่ขายดีที่สุดปีนี้คือคืนที่หอคัมภีร์หลวงถูกรื้อ — คัมภีร์ที่ราชสำนักยึดไปสิบกว่าปี กระจายไปทั่วแผ่นดินในคืนเดียว" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUEST DIALOG SCENES
  // ═══════════════════════════════════════════════════════════════════

  // ─── qv_qigu_missing_seed ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_qigu_missing_seed_offer",
    lines: [
      { t: "dialogue", speaker: "ลาวหนาน", text: "เจ้าหนู ข้ามีเรื่องอยากให้ช่วย" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "เมล็ดข้าวที่เก็บไว้ทำพันธุ์ทั้งปี หนูป่ากินจนเกลี้ยงยุ้ง ปีนี้ข้าคงต้องปลูกสมุนไพรขายแทน" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "หาสมุนไพรหายากมาให้ข้าสัก 5 กำ ข้าจะเพาะเป็นต้นพันธุ์ ข้าแก่แล้ว เดินป่าไกล ๆ ไม่ไหว" },
    ],
    choices: [
      {
        text: "รับงานนำเมล็ดพันธุ์กลับมา",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qv_qigu_missing_seed" }],
      },
      { text: "ขอโทษ ข้ายังไม่ว่าง", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_missing_seed_complete",
    lines: [
      { t: "narration", text: "เจ้าวางสมุนไพรให้ลาวหนาน ชายแก่รับด้วยมือสั่นด้วยความยินดี" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ขอบใจมาก เจ้าหนู ข้าไม่มีอะไรมาก นอกจากข้าวเก่าและสมุนไพรเล็กน้อย" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "รับไปเถิด และขอให้เดินทางโชคดี" },
    ],
    choices: [
      {
        text: "รับรางวัลและกล่าวลา",
        next: "village_qigu",
        effects: [{ t: "finishQuest", questId: "qv_qigu_missing_seed", success: true }],
      },
    ],
  },

  // ─── qv_qigu_wolf_menace ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_qigu_wolf_menace_offer",
    lines: [
      { t: "dialogue", speaker: "ลาวหนาน", text: "หมาป่าตัวนั้น... มันไม่ใช่หมาป่าธรรมดา มันฉลาดกว่าปกติ" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "มันบุกทำลายนาข้าวสี่แปลงแล้ว ชาวบ้านกลัวมาก" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "เจ้าดูแข็งแกร่ง... ช่วยกำจัดมันได้ไหม? สักสามตัวก็พอ จะได้ไล่ฝูงออกไป" },
    ],
    choices: [
      {
        text: "รับงานล่าหมาป่า",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qv_qigu_wolf_menace" }],
      },
      { text: "ข้าไม่ถนัดล่าสัตว์", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_wolf_menace_complete",
    lines: [
      { t: "dialogue", speaker: "ลาวหนาน", text: "เจ้าทำสำเร็จแล้ว! หมาป่าหนีไปแล้ว ชาวบ้านโล่งอกมาก" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "รับทองและหนังสัตว์นี้ไปด้วย เก็บไว้ใช้ในการเดินทาง" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "village_qigu",
        effects: [{ t: "finishQuest", questId: "qv_qigu_wolf_menace", success: true }],
      },
    ],
  },

  // ─── qv_qigu_ancestor_tablet ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_qigu_ancestor_tablet_offer",
    lines: [
      { t: "narration", text: "ลาวหนานลดเสียงลงและมองรอบ ๆ อย่างระวัง" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "เรื่องนี้ไม่บอกใครในหมู่บ้าน... แผ่นบรรพบุรุษของตระกูลข้าถูกขโมยไป" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "โจรเส้นทางที่ดักปล้นคนแถวนี้เอาไป มันคงนึกว่าเป็นของมีค่า" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ข้าแก่เกินไปแล้ว แต่เจ้า... เจ้าดูว่องไว ช่วยนำมันกลับมาได้ไหม?" },
    ],
    choices: [
      {
        text: "รับ ข้าจะตามหาแผ่นบรรพบุรุษ",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qv_qigu_ancestor_tablet" }],
      },
      { text: "เรื่องนี้ยุ่งเกินไป ขอตัวก่อน", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_ancestor_tablet_complete",
    lines: [
      { t: "narration", text: "ลาวหนานรับแผ่นบรรพบุรุษด้วยน้ำตาคลอ" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ขอบคุณ... ขอบคุณจริง ๆ เจ้าคืนความสงบให้กับจิตใจข้าแล้ว" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "รับเหรียญโบราณนี้ไป มันเก่าแก่แต่ยังมีคุณค่า เหมือนกับข้า" },
    ],
    choices: [
      {
        text: "รับรางวัลและอวยพรให้ลาวหนาน",
        next: "village_qigu",
        effects: [
          { t: "finishQuest", questId: "qv_qigu_ancestor_tablet", success: true },
          { t: "addTrait", trait: "good", amount: 2 },
        ],
      },
    ],
  },

  // ─── qv_qigu_rare_herb ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_qigu_rare_herb_offer",
    lines: [
      { t: "dialogue", speaker: "นางเหมย", text: "เจ้าช่วยหาสมุนไพรให้ข้าได้ไหม? ต้องการบัวหิมะ ที่ขึ้นอยู่ที่ก้นหุบเขาตัดใจ" },
      { t: "dialogue", speaker: "นางเหมย", text: "ผู้ป่วยในหมู่บ้านต้องการยาเร่งด่วน ข้าไม่มีเวลาออกไปเองได้" },
      { t: "dialogue", speaker: "นางเหมย", text: "ระวังด้วย ที่นั่นมีงูและสัตว์ป่าอยู่มาก และต้องเก็บสมุนไพรเป็นถึงขั้นที่ 5 จึงจะเก็บบัวหิมะได้" },
    ],
    choices: [
      {
        text: "รับหาบัวหิมะให้",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qv_qigu_rare_herb" }],
      },
      { text: "ข้าไม่รู้จักสมุนไพร", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_rare_herb_complete",
    lines: [
      { t: "dialogue", speaker: "นางเหมย", text: "เจ้าได้บัวหิมะมาแล้วจริง ๆ! ขอบคุณมาก" },
      { t: "dialogue", speaker: "นางเหมย", text: "รับยาเลือดกลางไปสองขวด ใช้ยามฉุกเฉินในการเดินทาง" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "village_qigu",
        effects: [{ t: "finishQuest", questId: "qv_qigu_rare_herb", success: true }],
      },
    ],
  },

  // ─── qv_qigu_poisoned_well ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_qigu_poisoned_well_offer",
    lines: [
      { t: "narration", text: "นางเหมยดูวิตกกังวลผิดปกติ" },
      { t: "dialogue", speaker: "นางเหมย", text: "บ่อน้ำกลางหมู่บ้านถูกวางยาพิษ! คนป่วยแล้วสามราย" },
      { t: "dialogue", speaker: "นางเหมย", text: "ข้ารักษาอาการได้ แต่ต้องหาว่าใครทำและทำไม" },
      { t: "dialogue", speaker: "นางเหมย", text: "ข้าเห็นรอยเท้าแปลก ๆ ใกล้บ่อเมื่อคืน เจ้าช่วยสืบได้ไหม?" },
    ],
    choices: [
      {
        text: "รับสืบสวนเรื่องนี้",
        next: "village_qigu",
        effects: [{ t: "startQuest", questId: "qv_qigu_poisoned_well" }],
      },
      { text: "ข้าไม่ใช่นักสืบ", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_poisoned_well_investigate",
    lines: [
      { t: "narration", text: "ข้างบ่อน้ำมีรอยเท้าเปื้อนผงสีเขียว นำออกไปยังเพิงร้างท้ายหมู่บ้าน" },
      { t: "narration", text: "ในเพิงนั้น หมอดูเร่ที่ขายยาวิเศษให้ชาวบ้านกำลังกวาดห่อผงสีเขียวใส่ย่ามอย่างรีบร้อน" },
      { t: "dialogue", speaker: "หมอดูปลอม", text: "เจ้ารู้มากเกินไปแล้ว! อย่าหวังว่าจะได้กลับไปบอกใคร!" },
    ],
    choices: [
      {
        text: "สู้เพื่อปกป้องหมู่บ้าน",
        next: "qs_qv_qigu_poisoned_well_caught",
        effects: [
          { t: "triggerBattle", opponentId: "fortune_thief", onWin: "qs_qv_qigu_poisoned_well_caught", onLose: "village_qigu" },
        ],
      },
      {
        text: "ปล่อยเขาหนีไป แล้วรีบกลับไปบอกนางเหมย",
        next: "village_qigu",
        effects: [{ t: "advanceQuest", questId: "qv_qigu_poisoned_well" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_poisoned_well_caught",
    lines: [
      { t: "narration", text: "หมอดูปลอมล้มคว่ำ ทิ้งห่อผงสีเขียวไว้แล้ววิ่งหนีออกจากหมู่บ้านไปไม่เหลียวหลัง" },
      { t: "narration", text: "ผงในห่อนั้นมีกลิ่นเดียวกับน้ำในบ่อ — นางเหมยน่าจะรู้ว่าเป็นหญ้าอะไร" },
    ],
    choices: [
      {
        text: "นำห่อผงไปให้นางเหมยดู",
        next: "village_qigu",
        effects: [{ t: "advanceQuest", questId: "qv_qigu_poisoned_well" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_poisoned_well_complete",
    lines: [
      { t: "narration", text: "เจ้าเล่าเรื่องรอยเท้าเปื้อนผงสีเขียวให้นางเหมยฟัง" },
      { t: "dialogue", speaker: "นางเหมย", text: "ผงสีเขียว… หญ้าพิษที่หมอดูเร่คนนั้นขายเป็นยาวิเศษ! เขาวางยาบ่อให้คนป่วย จะได้ขายยาแก้" },
      { t: "dialogue", speaker: "นางเหมย", text: "พอรู้ว่ามีคนตามรอย เขาก็หนีออกจากหมู่บ้านไปแล้ว ข้าจะต้มยาล้างบ่อเอง ขอบคุณที่ปกป้องพวกเรา" },
      { t: "dialogue", speaker: "นางเหมย", text: "รับโสมนี้ไปเป็นรางวัล" },
    ],
    choices: [
      {
        text: "รับรางวัลและกลับไปหมู่บ้าน",
        next: "village_qigu",
        effects: [
          { t: "finishQuest", questId: "qv_qigu_poisoned_well", success: true },
          { t: "addTrait", trait: "good", amount: 3 },
        ],
      },
    ],
  },

  // ─── qv_meihua_lost_score ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_meihua_lost_score_offer",
    lines: [
      { t: "dialogue", speaker: "เฉินเยว่", text: "ตำราเพลงของข้าหายไป... ข้าวางไว้ในศาลาดนตรีของหมู่บ้านเมื่อสัปดาห์ก่อน" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าสงสัยว่าพ่อค้าเร่คนที่เข้ามาในหมู่บ้านเมื่อวานนำไปขาย" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ถ้าเจอตำราเพลงพื้นฐานวางขายที่ไหน ซื้อกลับมาให้ข้าสักเล่ม เล่มของข้าน่าจะไปปนอยู่ในนั้น" },
    ],
    choices: [
      {
        text: "รับตามหาตำราเพลง",
        next: "village_meihua",
        effects: [{ t: "startQuest", questId: "qv_meihua_lost_score" }],
      },
      { text: "ข้าช่วยไม่ได้", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_lost_score_complete",
    lines: [
      { t: "narration", text: "เฉินเยว่รับตำราและเปิดดูอย่างตื่นเต้น" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "นี่คือมัน! เพลงแห่งดอกเหมย... ข้าคิดว่าสูญหายไปแล้ว" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าขอสอนเพลงพื้นฐานให้แลกกัน รับตำราเพลงพื้นฐานนี้ไป" },
    ],
    choices: [
      {
        text: "รับรางวัลและคำขอบคุณ",
        next: "village_meihua",
        effects: [{ t: "finishQuest", questId: "qv_meihua_lost_score", success: true }],
      },
    ],
  },

  // ─── qv_meihua_music_duel ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_meihua_music_duel_offer",
    lines: [
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าได้รับคำท้าจากนักดนตรีในหมู่บ้านฮิงซาน" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "เขาท้าว่าดนตรีของข้าไม่สมบูรณ์ ข้าต้องพิสูจน์ตัว" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าเขียนเพลงตอบไว้แล้ว เจ้าช่วยนำสารนี้ไปส่งที่หมู่บ้านฮิงซาน แล้วนำคำตอบของเขากลับมาได้ไหม?" },
    ],
    choices: [
      {
        text: "รับ ช่วยนำสารให้",
        next: "village_meihua",
        effects: [{ t: "startQuest", questId: "qv_meihua_music_duel" }],
      },
      { text: "เรื่องดนตรีไม่ใช่ธุระข้า", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_music_duel_deliver",
    lines: [
      { t: "narration", text: "เจ้าถามหานักดนตรีผู้ท้าเฉินเยว่ในหมู่บ้านฮิงซาน แล้วมอบสารเพลงตอบให้เขา" },
      { t: "narration", text: "นักดนตรีคู่แข่งดีดพิณตามโน้ตในสารทีละวรรค ก่อนวางมือลงช้า ๆ" },
      { t: "dialogue", speaker: "นักดนตรีคู่แข่ง", text: "โอ้... เพลงนี้ไพเราะจริง ๆ ข้าแพ้แล้ว" },
      { t: "narration", text: "เขาเขียนจดหมายยอมรับฝากเจ้ากลับไปให้เฉินเยว่" },
    ],
    choices: [
      {
        text: "นำจดหมายกลับให้เฉินเยว่",
        next: "village_hengshan",
        effects: [{ t: "advanceQuest", questId: "qv_meihua_music_duel" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_music_duel_complete",
    lines: [
      { t: "dialogue", speaker: "เฉินเยว่", text: "เขายอมรับในดนตรีของข้าแล้ว! ขอบคุณที่ช่วย" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "รับตำราเพลงขั้นกลางนี้ไปเถิด เจ้าสมควรได้" },
    ],
    choices: [
      {
        text: "รับตำราและลาจาก",
        next: "village_meihua",
        effects: [{ t: "finishQuest", questId: "qv_meihua_music_duel", success: true }],
      },
    ],
  },

  // ─── qv_meihua_plum_festival ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_meihua_plum_festival_offer",
    lines: [
      { t: "dialogue", speaker: "เฉินเยว่", text: "เทศกาลดอกเหมยใกล้มาแล้ว ข้าต้องการของบางอย่างเพื่อตกแต่งงาน" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ช่วยหาเม็ดบัวมาให้ข้าสัก 5 เม็ดได้ไหม? ข้าจะร้อยเป็นพวงประดับแท่นบูชา" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ดอกเหมยบนแท่นมีพอแล้ว แต่ปีนี้ขาดพวงเม็ดบัวที่แม่ข้าเคยร้อยทุกปี" },
    ],
    choices: [
      {
        text: "รับเก็บดอกเหมย",
        next: "village_meihua",
        effects: [{ t: "startQuest", questId: "qv_meihua_plum_festival" }],
      },
      { text: "เรื่องดอกไม้ไม่ถนัด", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_plum_festival_complete",
    lines: [
      { t: "narration", text: "เจ้านำเม็ดบัว 5 เม็ดมาให้เฉินเยว่ เขาร้อยเป็นพวงอย่างประณีต" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "สมบูรณ์แบบ! ขอบคุณมาก เทศกาลนี้จะงดงามแน่" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "รับเงินค่าตอบแทนและขนมไหว้พระจันทร์ของหมู่บ้านไปด้วย" },
    ],
    choices: [
      {
        text: "รับรางวัลและอวยพร",
        next: "village_meihua",
        effects: [{ t: "finishQuest", questId: "qv_meihua_plum_festival", success: true }],
      },
    ],
  },

  // ─── qv_meihua_boar_hunt ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_meihua_boar_hunt_offer",
    lines: [
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "หมูป่าดุอยู่ในป่าทางเหนือ ทำลายสวนชาวบ้านหลายคน" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "ข้าจะไปล่า แต่หลังเข่าบาดเจ็บ เดินไกลไม่ไหวแล้ว" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "เจ้าช่วยไปปราบให้ข้าได้ไหม? สองตัวก็พอ" },
    ],
    choices: [
      {
        text: "รับงานล่าหมูป่า",
        next: "village_meihua",
        effects: [{ t: "startQuest", questId: "qv_meihua_boar_hunt" }],
      },
      { text: "ข้าไม่ล่าสัตว์", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_boar_hunt_complete",
    lines: [
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "ดีมาก! ชาวบ้านคงโล่งใจ" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "รับเนื้อย่างและเงินนี้ไป ข้าไม่มีมาก แต่รับด้วยใจจริง" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "village_meihua",
        effects: [{ t: "finishQuest", questId: "qv_meihua_boar_hunt", success: true }],
      },
    ],
  },

  // ─── qv_meihua_tiger_track ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_offer",
    lines: [
      { t: "narration", text: "เปาเหล็กก้านลดเสียงและมองรอบ ๆ" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "ข้าเห็นรอยเสือบนเขาเมื่อคืน นั่นไม่ใช่เสือธรรมดา" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "รอยมันใหญ่มาก... ข้าต้องการให้เจ้าไปยืนยันว่ามีอยู่จริง อย่าต่อสู้คนเดียว" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "รอยมุ่งไปทางถ้ำแมงมุม แค่ไปดูที่นั่นแล้วกลับมาบอกข้าก็พอ" },
    ],
    choices: [
      {
        text: "รับสำรวจรอยเสือ",
        next: "village_meihua",
        effects: [{ t: "startQuest", questId: "qv_meihua_tiger_track" }],
      },
      { text: "เสือภูเขาน่ากลัวเกินไป", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_found",
    lines: [
      { t: "narration", text: "เจ้าพบรอยเสือขนาดใหญ่และกระดูกสัตว์ที่ถ้ำ ชัดเจนว่ามีเสือภูเขาอาศัยอยู่" },
    ],
    choices: [
      {
        text: "กลับไปรายงานเปาเหล็กก้าน",
        next: "cave_zhizhu",
        effects: [{ t: "advanceQuest", questId: "qv_meihua_tiger_track" }],
      },
      {
        text: "รอดูเสือก่อน",
        next: "qs_qv_meihua_tiger_track_fight",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_fight",
    lines: [
      { t: "narration", text: "เสือภูเขาตัวใหญ่กระโจนออกมาจากพุ่มไม้!" },
    ],
    choices: [
      {
        text: "สู้กับเสือภูเขา",
        next: "qs_qv_meihua_tiger_track_slain",
        effects: [
          { t: "triggerBattle", opponentId: "mountain_tiger", onWin: "qs_qv_meihua_tiger_track_slain", onLose: "cave_zhizhu" },
        ],
      },
      {
        text: "หลบหนีออกมา",
        next: "cave_zhizhu",
        effects: [{ t: "advanceQuest", questId: "qv_meihua_tiger_track" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_slain",
    lines: [
      { t: "narration", text: "เสือภูเขาล้มลงหน้าปากถ้ำ ตัวใหญ่กว่าเสือที่ใครในหมู่บ้านเคยเห็น" },
    ],
    choices: [
      {
        text: "กลับไปรายงานเปาเหล็กก้าน",
        next: "cave_zhizhu",
        effects: [{ t: "advanceQuest", questId: "qv_meihua_tiger_track" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_complete",
    lines: [
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "เจ้าเห็นถ้ำนั้นกับตาแล้ว ข้าเชื่อเจ้า ต้องแจ้งผู้ใหญ่บ้านให้ชาวบ้านระวังตัว" },
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "รับเล็บเสือนี้ไป เก็บไว้เป็นที่ระลึกหรือขาย" },
    ],
    choices: [
      {
        text: "รับรางวัลและกลับไป",
        next: "village_meihua",
        effects: [{ t: "finishQuest", questId: "qv_meihua_tiger_track", success: true }],
      },
    ],
  },

  // ─── qv_hengshan_song_scroll ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_hengshan_song_scroll_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ม้วนเพลงโบราณของหมู่บ้านเราไปอยู่ที่สำนักเฮิงซานบนเขา ตั้งแต่อาจารย์ที่นั่นยืมไปคัดลอกเมื่อหลายปีก่อน" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ข้าอยากได้คืนมาเพื่อสอนเด็ก ๆ แต่ไม่มีคนกล้าไปขอ" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "เจ้าดูเป็นคนมีน้ำใจ ช่วยไปเจรจาขอคืนได้ไหม?" },
    ],
    choices: [
      {
        text: "รับไปขอม้วนเพลงกลับมา",
        next: "village_hengshan",
        effects: [{ t: "startQuest", questId: "qv_hengshan_song_scroll" }],
      },
      { text: "ไม่กล้าไปสำนัก", next: "village_hengshan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_song_scroll_complete",
    lines: [
      { t: "narration", text: "ผู้อาวุโสอู๋รับม้วนเพลงคืนและเปิดอ่านด้วยสายตาอ่อนโยน" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ขอบคุณที่หัวใจดีงาม เจ้าทำให้เด็ก ๆ ในหมู่บ้านได้เรียนดนตรี" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "รับทองและความนับถือของพวกเราไปเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยความถ่อมตน",
        next: "village_hengshan",
        effects: [
          { t: "finishQuest", questId: "qv_hengshan_song_scroll", success: true },
          { t: "addTrait", trait: "humility", amount: 1 },
        ],
      },
    ],
  },

  // ─── qv_hengshan_dispute_land ─────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_hengshan_dispute_land_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "มีปัญหาในหมู่บ้าน สองครอบครัวเถียงกันเรื่องที่ดินจนเกือบถึงขั้นชกต่อย" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ข้าต้องการคนกลางที่ไม่ฝักใฝ่ฝ่ายใดไปฟังทั้งสองฝ่าย" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "เจ้าเป็นคนนอก ทั้งสองฝ่ายน่าจะเชื่อถือมากกว่า" },
    ],
    choices: [
      {
        text: "รับเป็นคนกลางไกล่เกลี่ย",
        next: "village_hengshan",
        effects: [{ t: "startQuest", questId: "qv_hengshan_dispute_land" }],
      },
      { text: "เรื่องส่วนตัวของคนอื่น ไม่สะดวก", next: "village_hengshan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_dispute_land_mediate",
    lines: [
      { t: "narration", text: "เจ้าฟังทั้งสองฝ่ายอย่างอดทน ก่อนเข้าใจว่าเขตแดนเดิมถูกสร้างก่อนน้ำท่วม" },
      { t: "dialogue", speaker: "ครอบครัวแรก", text: "ที่ดินตรงนี้เป็นของบรรพบุรุษเรา!" },
      { t: "dialogue", speaker: "ครอบครัวสอง", text: "แต่หินแนวเขตหายไปตั้งแต่น้ำท่วมใหญ่!" },
    ],
    choices: [
      {
        text: "ชี้แจงว่าควรแบ่งกันอย่างยุติธรรมตามหลักฐานเก่า",
        next: "qs_qv_hengshan_dispute_land_fair",
        effects: [{ t: "addTrait", trait: "good", amount: 1 }],
      },
      {
        text: "บอกให้ฝ่ายที่ดูแลดีกว่าได้ไป",
        next: "qs_qv_hengshan_dispute_land_practical",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_dispute_land_fair",
    lines: [
      { t: "narration", text: "ทั้งสองฝ่ายถกเถียงอีกสักครู่ก่อนตกลงกันได้" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ดี ข้าเห็นว่าเจ้าใช้ปัญญาและใจเป็นธรรม" },
    ],
    choices: [
      {
        text: "รับคำขอบคุณ",
        next: "qs_qv_hengshan_dispute_land_complete",
        effects: [{ t: "advanceQuest", questId: "qv_hengshan_dispute_land" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_dispute_land_practical",
    lines: [
      { t: "narration", text: "ฝ่ายที่แพ้โกรธ แต่ยอมรับคำตัดสิน" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ดีพอ แต่อาจทิ้งรอยร้าว..." },
    ],
    choices: [
      {
        text: "รับผลการตัดสิน",
        next: "qs_qv_hengshan_dispute_land_complete",
        effects: [{ t: "advanceQuest", questId: "qv_hengshan_dispute_land" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_dispute_land_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ขอบคุณที่ช่วยแก้ปัญหานี้ รับทองและความนับถือจากหมู่บ้านไปเถิด" },
    ],
    choices: [
      {
        text: "รับและลาจาก",
        next: "village_hengshan",
        effects: [{ t: "finishQuest", questId: "qv_hengshan_dispute_land", success: true }],
      },
    ],
  },

  // ─── qv_hengshan_winter_aid ───────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_hengshan_winter_aid_offer",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ฤดูหนาวมาเร็วกว่าปกติ ผู้สูงอายุในหมู่บ้านขาดแคลนอาหาร" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "เจ้าช่วยนำข้าวหมูแดง 3 จานกับยาเลือดเล็ก 3 ขวดนี้ไปส่งที่กระท่อมท้ายหมู่บ้านได้ไหม?" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ยายหลี่กับตาเฉินอยู่ที่นั่น ตาเฉินไอไม่หยุดมาหลายคืนแล้ว สองคนนี้ไม่ยอมรับของจากข้าตรง ๆ แต่จากคนแปลกหน้าเขายอมรับ" },
    ],
    choices: [
      {
        text: "รับส่งของให้ผู้สูงอายุ",
        next: "village_hengshan",
        effects: [
          { t: "startQuest", questId: "qv_hengshan_winter_aid" },
          { t: "giveItem", itemId: "rice_dish", count: 3 },
          { t: "giveItem", itemId: "potion", count: 3 },
        ],
      },
      { text: "ไม่มีเวลา ขอโทษ", next: "village_hengshan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_winter_aid_deliver",
    lines: [
      { t: "narration", text: "กระท่อมท้ายหมู่บ้านหนาวเยียบ เตาไฟมีแต่ขี้เถ้า ยายหลี่นั่งห่มผ้าอยู่ข้างตาเฉินที่ไอโขลก" },
      { t: "dialogue", speaker: "ยายหลี่", text: "คนแปลกหน้ามาทำอะไรที่นี่... ของพวกนี้ให้พวกเราหรือ?" },
    ],
    choices: [
      {
        text: "มอบข้าวหมูแดง 3 จานกับยาเลือดเล็ก 3 ขวด",
        visibleIf: {
          t: "and",
          all: [
            { t: "hasItem", itemId: "rice_dish", count: 3 },
            { t: "hasItem", itemId: "potion", count: 3 },
          ],
        },
        next: "qs_qv_hengshan_winter_aid_delivered",
        effects: [
          { t: "takeItem", itemId: "rice_dish", count: 3 },
          { t: "takeItem", itemId: "potion", count: 3 },
          { t: "advanceQuest", questId: "qv_hengshan_winter_aid" },
        ],
      },
      {
        text: "ของในย่ามไม่ครบ — ไปหามาให้ครบก่อน (ข้าวหมูแดง 3 · ยาเลือดเล็ก 3)",
        visibleIf: {
          t: "not",
          of: {
            t: "and",
            all: [
              { t: "hasItem", itemId: "rice_dish", count: 3 },
              { t: "hasItem", itemId: "potion", count: 3 },
            ],
          },
        },
        next: "village_hengshan",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_winter_aid_delivered",
    lines: [
      { t: "narration", text: "ยายหลี่รับข้าวไปอุ่นบนเตา ส่วนตาเฉินกลืนยาเลือดเล็กแล้วไอเบาลง" },
      { t: "dialogue", speaker: "ยายหลี่", text: "ฝากขอบใจคนที่ส่งเจ้ามาด้วย... เราคงรู้ว่าเป็นใคร" },
    ],
    choices: [{ text: "กลับไปบอกผู้อาวุโสอู๋", next: "village_hengshan" }],
  },
  {
    kind: "dialog",
    id: "qs_qv_hengshan_winter_aid_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ยายหลี่กับตาเฉินได้ของครบแล้วหรือ? ขอบคุณมาก ใจดีอย่างนี้หาได้ยาก" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "รับเงินและสมุนไพรโสมนี้ไปเป็นรางวัล" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยรอยยิ้ม",
        next: "village_hengshan",
        effects: [
          { t: "finishQuest", questId: "qv_hengshan_winter_aid", success: true },
          { t: "addTrait", trait: "good", amount: 3 },
        ],
      },
    ],
  },

  // ─── qv_wuxia_missing_boat ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_wuxia_missing_boat_offer",
    lines: [
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เรือของข้าหายไปสามวันแล้ว ลูกชายเอาไปโดยไม่บอก" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "ข้าได้ยินว่ามีโจรสลัดน้ำแถวปากแม่น้ำ... กลัวว่าลูกจะเจออันตราย" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าช่วยไปหาลูกข้าได้ไหม? ชื่อเขาคือน้อยเติ้ง อายุสิบห้า กระแสน้ำช่วงนี้พัดเรือไปเกยเกาะไร้ชื่อกลางแม่น้ำบ่อย ๆ" },
    ],
    choices: [
      {
        text: "รับตามหาน้อยเติ้ง",
        next: "village_wuxia",
        effects: [{ t: "startQuest", questId: "qv_wuxia_missing_boat" }],
      },
      { text: "แม่น้ำน่ากลัว ขอโทษ", next: "village_wuxia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_missing_boat_found",
    lines: [
      { t: "narration", text: "เจ้าพบน้อยเติ้งอยู่บนเกาะกลางแม่น้ำ เรือเกยตื้น เด็กหายใจหอบแต่ปลอดภัย" },
      { t: "dialogue", speaker: "น้อยเติ้ง", text: "ท่านช่วยข้าด้วย! พบโจรสลัด ต้องหนีมา..." },
      { t: "dialogue", speaker: "น้อยเติ้ง", text: "ข้าเห็นพวกมันฝังอะไรบางอย่างไว้ที่เกาะอีกฝั่ง ข้าจะเล่าให้พ่อฟังทั้งหมด" },
    ],
    choices: [
      {
        text: "พาน้อยเติ้งกลับบ้าน",
        next: "isle_wuming",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_missing_boat" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_missing_boat_complete",
    lines: [
      { t: "narration", text: "เจ้าพบน้อยเติ้งที่เกาะไร้ชื่อ เรือเกยตื้น เด็กหิวโซแต่ปลอดภัย จึงพากลับมาที่หมู่บ้าน" },
      { t: "narration", text: "เติ้งลองหางวิ่งออกมาต้อนรับลูกชายด้วยน้ำตา" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "ขอบคุณ! ขอบคุณมาก เจ้าช่วยชีวิตลูกข้า" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "ปลาและเงินนี้น้อยไปมาก แต่รับไปเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยใจดีงาม",
        next: "village_wuxia",
        effects: [
          { t: "finishQuest", questId: "qv_wuxia_missing_boat", success: true },
          { t: "addTrait", trait: "good", amount: 2 },
        ],
      },
    ],
  },

  // ─── qv_wuxia_river_ghost ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_wuxia_river_ghost_offer",
    lines: [
      { t: "narration", text: "เติ้งลองหางลดเสียงลงและมองรอบ ๆ ด้วยความกังวล" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "ทุกคืนมีเสียงร้องประหลาดดังมาจากแม่น้ำ คนในหมู่บ้านกลัวมาก" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "บางคนบอกว่าเป็นวิญญาณ แต่ข้าว่าเป็นคนทำ" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าช่วยไปซุ่มฟังริมแม่น้ำตอนค่ำ แล้วบอกข้าว่าเสียงนั้นมาจากไหนได้ไหม?" },
    ],
    choices: [
      {
        text: "รับสืบเรื่องเสียงประหลาด",
        next: "village_wuxia",
        effects: [{ t: "startQuest", questId: "qv_wuxia_river_ghost" }],
      },
      { text: "เรื่องวิญญาณน่ากลัวเกิน", next: "village_wuxia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_river_ghost_discover",
    lines: [
      { t: "narration", text: "เจ้าซุ่มอยู่ในพงอ้อริมแม่น้ำจนดึก เสียงโหยหวนดังขึ้นอีกครั้ง — ไม่ได้มาจากน้ำ แต่มาจากใต้ต้นหลิว" },
      { t: "narration", text: "ชายสองคนผลัดกันเป่าขลุ่ยกระดูก เรือไร้ตะเกียงลำหนึ่งค่อย ๆ เทียบท่าตามสัญญาณ แล้วขนหีบขึ้นฝั่งอย่างเงียบเชียบ" },
    ],
    choices: [
      {
        text: "จดจำหน้าพวกมันไว้ แล้วกลับไปบอกเติ้งลองหาง",
        next: "village_wuxia",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_river_ghost" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_river_ghost_complete",
    lines: [
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "ขลุ่ยของพวกลักลอบขนของนี่เอง! ข้าจะบอกชาวบ้านให้เลิกกลัวผี แล้วไปแจ้งทางการ ขอบคุณมาก" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "รับปลาไหลสดและเงินค่าตอบแทนไป" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "village_wuxia",
        effects: [{ t: "finishQuest", questId: "qv_wuxia_river_ghost", success: true }],
      },
    ],
  },

  // ─── qv_wuxia_pirate_cache ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_wuxia_pirate_cache_offer",
    lines: [
      { t: "narration", text: "น้อยเติ้งกระซิบเรื่องที่เห็นบนแม่น้ำ" },
      { t: "dialogue", speaker: "น้อยเติ้ง", text: "ตอนติดเกาะ ข้าเห็นโจรสลัดฝังสมบัติไว้ที่หาดทรายของเกาะยกซาน ใต้ต้นโพธิ์สองต้น" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าไปเอามาได้ไหม? แต่ระวังโจรสลัดยังวนอยู่แน่ ๆ" },
    ],
    choices: [
      {
        text: "รับตามหาสมบัติโจรสลัด",
        next: "village_wuxia",
        effects: [{ t: "startQuest", questId: "qv_wuxia_pirate_cache" }],
      },
      { text: "เรื่องของโจรสลัดอันตรายเกิน", next: "village_wuxia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_pirate_cache_fight",
    lines: [
      { t: "narration", text: "เจ้าพบกล่องสมบัติใต้ต้นโพธิ์ แต่โจรสลัดน้ำสองคนปรากฏตัวขึ้น!" },
      { t: "dialogue", speaker: "โจรสลัด", text: "นั่นสมบัติของพวกเรา! เจ้าต้องการตาย!" },
    ],
    choices: [
      {
        text: "สู้กับโจรสลัด",
        next: "qs_qv_wuxia_pirate_cache_won",
        effects: [
          { t: "triggerBattle", opponentId: "river_pirate", onWin: "qs_qv_wuxia_pirate_cache_won", onLose: "isle_yuanyang" },
        ],
      },
      { text: "ถอยไปก่อน", next: "isle_yuanyang" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_pirate_cache_won",
    lines: [
      { t: "narration", text: "โจรสลัดพ่ายแพ้ หนีลงเรือไปทั้งที่ยังบาดเจ็บ เจ้าขุดกล่องสมบัติขึ้นจากใต้ต้นโพธิ์" },
    ],
    choices: [
      {
        text: "แบกกล่องกลับไปหาเติ้งลองหาง",
        next: "isle_yuanyang",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_pirate_cache" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_pirate_cache_complete",
    lines: [
      { t: "narration", text: "เจ้าวางกล่องสมบัติจากเกาะยกซานลงตรงหน้าเติ้งลองหาง ในกล่องมีเหรียญโบราณและหยก" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าทำได้! รักษาส่วนแบ่งไว้เถิด เราช่วยกัน" },
    ],
    choices: [
      {
        text: "แบ่งสมบัติกับครอบครัวเติ้ง",
        next: "village_wuxia",
        effects: [
          { t: "finishQuest", questId: "qv_wuxia_pirate_cache", success: true },
          { t: "addTrait", trait: "good", amount: 1 },
        ],
      },
      {
        text: "เก็บไว้เองทั้งหมด",
        next: "village_wuxia",
        effects: [
          { t: "finishQuest", questId: "qv_wuxia_pirate_cache", success: true },
          { t: "addTrait", trait: "evil", amount: 1 },
        ],
      },
    ],
  },

  // ─── qv_inn_lost_satchel ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_lost_satchel_offer",
    lines: [
      { t: "narration", text: "นางสาวซิ่วเดินมาหาเจ้าอย่างเร่งร้อน" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ท่านผู้เดินทาง! แขกที่ออกจากโรงเตี๊ยมไปเมื่อเช้าลืมกระเป๋าเอกสารไว้ กุญแจกระเป๋าก็วางทิ้งไว้บนโต๊ะด้วย" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ข้าทิ้งร้านไปไม่ได้ เจ้าช่วยนำทั้งกระเป๋ากับกุญแจไปส่งที่โรงเตี๊ยมเก้าอี้สูงได้ไหม? เขาบอกว่าจะไปพักที่นั่น ถามเฉาอ้วนเจ้าของร้านดูก็ได้" },
    ],
    choices: [
      {
        text: "รับส่งกระเป๋าให้",
        next: "inn_yuelai",
        effects: [
          { t: "startQuest", questId: "qv_inn_lost_satchel" },
          { t: "giveItem", itemId: "old_key", count: 1 },
        ],
      },
      { text: "ข้าไม่ได้เดินทางไปทางนั้น", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_lost_satchel_complete",
    lines: [
      { t: "narration", text: "เฉาอ้วนชี้ให้เจ้าไปหาแขกคนนั้นที่โต๊ะริมหน้าต่าง เขาดีใจมากเมื่อได้กระเป๋ากับกุญแจคืน" },
      { t: "dialogue", speaker: "นักเดินทาง", text: "ขอบคุณมาก! ในกระเป๋ามีเอกสารสำคัญ เจ้าช่วยข้าได้มาก" },
      { t: "dialogue", speaker: "นักเดินทาง", text: "รับทองนี้ไปเป็นรางวัล" },
    ],
    choices: [
      {
        text: "รับรางวัลและบอกว่าเป็นของนางสาวซิ่ว",
        next: "inn_gaosheng",
        effects: [
          { t: "finishQuest", questId: "qv_inn_lost_satchel", success: true },
          { t: "takeItem", itemId: "old_key", count: 1 },
          { t: "addTrait", trait: "good", amount: 1 },
        ],
      },
    ],
  },

  // ─── qv_inn_spy_guest ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_spy_guest_offer",
    lines: [
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ข้าไว้ใจท่านได้ใช่ไหม? ข้าสังเกตว่าแขกห้อง 3 แปลกมาก" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "เขาถามเรื่องที่ตั้งสำนักต่าง ๆ และทางเดินทาง แต่ไม่ได้มาเพื่อท่องเที่ยว" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ข้าสงสัยว่าเขาเป็นสายลับ เจ้าช่วยสืบว่าเขาเป็นใครได้ไหม?" },
    ],
    choices: [
      {
        text: "รับสืบตัวตนแขกประหลาด",
        next: "inn_yuelai",
        effects: [{ t: "startQuest", questId: "qv_inn_spy_guest" }],
      },
      { text: "ข้าไม่ยุ่งเรื่องคนอื่น", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_spy_guest_confront",
    lines: [
      { t: "narration", text: "เจ้าสังเกตชายในห้อง 3 อยู่นาน และพบหลักฐานว่าเขาเป็นสายลับจากสำนักหนึ่ง" },
      { t: "dialogue", speaker: "ชายประหลาด", text: "เจ้ารู้มากเกินไปแล้ว! ต้องสู้กันแน่ ๆ" },
    ],
    choices: [
      {
        text: "สู้กับสายลับ",
        next: "qs_qv_inn_spy_guest_complete",
        effects: [
          { t: "triggerBattle", opponentId: "fortune_thief", onWin: "qs_qv_inn_spy_guest_complete", onLose: "inn_yuelai" },
        ],
      },
      {
        text: "เจรจาให้เขาออกไปอย่างสงบ",
        next: "qs_qv_inn_spy_guest_peaceful",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_spy_guest_peaceful",
    lines: [
      { t: "dialogue", speaker: "ชายประหลาด", text: "เจ้าฉลาด... ข้าจะไปแล้ว ไม่มีเรื่องกัน" },
      { t: "narration", text: "ชายคนนั้นหายตัวไปในคืนเดียวกัน" },
    ],
    choices: [
      {
        text: "รายงานให้นางสาวซิ่ว",
        next: "qs_qv_inn_spy_guest_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_spy_guest" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_spy_guest_complete",
    lines: [
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "แขกห้อง 3 ไปแล้วหรือ! โรงเตี๊ยมปลอดภัยแล้ว เจ้าแก้ปัญหาให้ข้าได้จริง ๆ" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "รับทองและข้าวฟรีหนึ่งมื้อไปด้วยนะ" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "inn_yuelai",
        effects: [{ t: "finishQuest", questId: "qv_inn_spy_guest", success: true }],
      },
    ],
  },

  // ─── qv_inn_debt_collector ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_debt_collector_offer",
    lines: [
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "มีคนตามเก็บหนี้มาที่โรงเตี๊ยม บอกว่าแขกคนหนึ่งยืมเงินเขาไว้" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "แขกคนนั้นออกไปแล้ว คนเก็บหนี้คุกคามข้า" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "เจ้าช่วยไล่เขาออกไปได้ไหม? หรืออธิบายสถานการณ์ให้เขาเข้าใจ" },
    ],
    choices: [
      {
        text: "รับจัดการเรื่องนี้",
        // Accept routes straight into the confrontation so the quest is
        // actually completable — without this jump the only entry point
        // to qs_qv_inn_debt_collector_confront would be unreachable.
        next: "qs_qv_inn_debt_collector_confront",
        effects: [{ t: "startQuest", questId: "qv_inn_debt_collector" }],
      },
      { text: "เรื่องหนี้ไม่ใช่เรื่องของข้า", next: "inn_yuelai" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_debt_collector_confront",
    lines: [
      { t: "narration", text: "เจ้าพบชายร่างใหญ่ยืนขู่นางสาวซิ่วอยู่ในห้องโถง" },
      { t: "dialogue", speaker: "นักเลง", text: "ไอ้หนูนี่... เจ้าคิดว่าจะมายุ่งอะไรกันรึ?" },
    ],
    choices: [
      {
        text: "เจรจาให้เขาออกไปก่อน",
        next: "qs_qv_inn_debt_collector_talk",
        effects: [{ t: "addTrait", trait: "humility", amount: 1 }],
      },
      {
        text: "ท้าสู้ให้ออกไป",
        next: "qs_qv_inn_debt_collector_fight",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_debt_collector_talk",
    lines: [
      { t: "narration", text: "เจ้าอธิบายสถานการณ์อย่างสงบ นักเลงโกรธแต่ยอมออกไป" },
      { t: "dialogue", speaker: "นักเลง", text: "ไว้ครั้งหน้า..." },
    ],
    choices: [
      {
        text: "รายงานผลให้นางสาวซิ่ว",
        next: "qs_qv_inn_debt_collector_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_debt_collector" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_debt_collector_fight",
    lines: [
      { t: "narration", text: "นักเลงฟาดเปรี้ยงมาก่อน!" },
    ],
    choices: [
      {
        text: "ต่อสู้ขับไล่เขาออกไป",
        next: "qs_qv_inn_debt_collector_complete",
        effects: [
          { t: "triggerBattle", opponentId: "ruffian", onWin: "qs_qv_inn_debt_collector_complete", onLose: "inn_yuelai" },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_debt_collector_complete",
    lines: [
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ขอบคุณ! โรงเตี๊ยมปลอดภัยแล้ว เจ้าช่วยข้าได้มาก" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "รับอาหารฟรีและทองนี้ไปเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "inn_yuelai",
        effects: [{ t: "finishQuest", questId: "qv_inn_debt_collector", success: true }],
      },
    ],
  },

  // ─── qv_inn_special_ingredient ────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_special_ingredient_offer",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ข้าต้องการทำเมนูพิเศษสำหรับลูกค้าสำคัญคืนนี้" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ขาดปลาไหลสด หาซื้อในตลาดไม่ได้ ต้องตกเองหรือหาจากชาวประมง" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เจ้าช่วยไปหาปลาไหลสักสามตัวให้ข้าได้ไหม? รีบด่วน!" },
    ],
    choices: [
      {
        text: "รับหาปลาไหลให้",
        next: "inn_gaosheng",
        effects: [{ t: "startQuest", questId: "qv_inn_special_ingredient" }],
      },
      { text: "ข้าตกปลาไม่เป็น", next: "inn_gaosheng" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_special_ingredient_complete",
    lines: [
      { t: "narration", text: "เฉาอ้วนรับปลาไหลและรีบเข้าครัวทันที" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ทันเวลา! เจ้าช่วยข้าได้มาก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "รับต้มยำที่ข้าทำเองและทองไปด้วย ข้าปรุงเองรับรองอร่อย!" },
    ],
    choices: [
      {
        text: "รับรางวัลด้วยความยินดี",
        next: "inn_gaosheng",
        effects: [{ t: "finishQuest", questId: "qv_inn_special_ingredient", success: true }],
      },
    ],
  },

  // ─── qv_inn_rival_inn ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_rival_inn_offer",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "โรงเตี๊ยมมีหว่างที่เพิ่งดังขึ้นมา... แย่งลูกค้าข้าไปเยอะมาก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ข้าอยากรู้ว่าเขาทำอาหารอะไรพิเศษ อยากให้เจ้าไปลองดูและกลับมาบอก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ข้าจะได้ปรับปรุงเมนูของข้าเอง ไม่ได้จะก่อเรื่องอะไร" },
    ],
    choices: [
      {
        text: "รับไปสอดแนมโรงเตี๊ยมคู่แข่ง",
        next: "inn_gaosheng",
        effects: [{ t: "startQuest", questId: "qv_inn_rival_inn" }],
      },
      { text: "เรื่องแบบนี้ไม่ค่อยสบายใจ", next: "inn_gaosheng" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_rival_inn_report",
    lines: [
      { t: "narration", text: "เจ้าสั่งอาหารเต็มโต๊ะที่โรงเตี๊ยมมีหว่างและสังเกตครัว พบว่าพวกเขาใช้สมุนไพรพิเศษในการปรุง" },
      { t: "narration", text: "พ่อครัวทิ้งสูตรเครื่องเทศไว้บนโต๊ะข้างเตาโดยไม่ทันระวัง" },
    ],
    choices: [
      {
        text: "แอบจดสูตรสมุนไพรไว้บอกเฉาอ้วน",
        next: "inn_youjian",
        effects: [
          { t: "setFlag", flag: "qv_inn_rival_inn_recipe", value: true },
          { t: "advanceQuest", questId: "qv_inn_rival_inn" },
        ],
      },
      {
        text: "ชิมให้รู้รสก็พอ ไม่แตะสูตรของเขา",
        next: "inn_youjian",
        effects: [{ t: "advanceQuest", questId: "qv_inn_rival_inn" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_rival_inn_honest",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เจ้าไม่บอกความลับ... ก็ดีนะ ข้าว่าควรแข่งกันด้วยฝีมือตนเอง" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ข้าคิดออกแล้ว จะทำเมนูใหม่เอง ขอบคุณที่ตรงไปตรงมา" },
    ],
    choices: [{ text: "รับคำขอบคุณ", next: "inn_gaosheng" }],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_rival_inn_complete",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เจ้าไปลองถึงโรงเตี๊ยมมีหว่างมาแล้ว ได้รู้ว่าคู่แข่งเก่งตรงไหน ข้าก็พอใจ รับทองนี้ไปเถิด" },
    ],
    choices: [
      {
        text: "เล่าสูตรสมุนไพรที่แอบจดมา",
        visibleIf: { t: "flag", flag: "qv_inn_rival_inn_recipe" },
        next: "inn_gaosheng",
        effects: [
          { t: "finishQuest", questId: "qv_inn_rival_inn", success: true },
          { t: "addTrait", trait: "evil", amount: 1 },
        ],
      },
      {
        text: "บอกให้เขาปรับปรุงด้วยฝีมือตัวเอง ไม่เปิดเผยความลับของคู่แข่ง",
        next: "qs_qv_inn_rival_inn_honest",
        effects: [
          { t: "finishQuest", questId: "qv_inn_rival_inn", success: true },
          { t: "addTrait", trait: "good", amount: 1 },
        ],
      },
    ],
  },

  // ─── qv_inn_drunk_warrior ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_offer",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "นักรบคนนั้น... เขานั่งดื่มมาหลายชั่วยามแล้ว ดูเหมือนมีทุกข์ใจหนัก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เมื่อก่อนเขาเป็นคนแข็งแกร่ง ตอนนี้เศร้ามาก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เจ้าช่วยไปคุยดูว่าเป็นอะไรไหม? ข้าเป็นห่วงเขา" },
    ],
    choices: [
      {
        text: "รับไปพูดคุยกับนักรบผู้นั้น",
        next: "inn_gaosheng",
        effects: [{ t: "startQuest", questId: "qv_inn_drunk_warrior" }],
      },
      { text: "ข้าไม่อยากยุ่งเรื่องคนเมา", next: "inn_gaosheng" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_talk",
    lines: [
      { t: "narration", text: "เจ้าเข้าไปนั่งใกล้ ๆ นักรบกำลังจ้องถ้วยเหล้าอย่างเหม่อลอย" },
      { t: "dialogue", speaker: "นักรบเศร้า", text: "เจ้า... มายุ่งอะไรกับข้า?" },
      { t: "dialogue", speaker: "นักรบเศร้า", text: "สำนักที่ข้าอุทิศทั้งชีวิตให้... พังทลายไปแล้ว ทุกคนตาย ข้าอยู่คนเดียว" },
    ],
    choices: [
      {
        text: "ฟังและให้กำลังใจ",
        next: "qs_qv_inn_drunk_warrior_comfort",
        effects: [{ t: "addTrait", trait: "good", amount: 2 }],
      },
      {
        text: "บอกว่าต้องลุกขึ้นต่อสู้ต่อ",
        next: "qs_qv_inn_drunk_warrior_motivate",
      },
      {
        text: "ปล่อยให้เขาอยู่คนเดียว",
        next: "inn_gaosheng",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_comfort",
    lines: [
      { t: "narration", text: "เจ้านั่งฟังเรื่องราวของเขาทั้งคืน ไม่ตัดสิน ไม่เร่งรีบ" },
      { t: "dialogue", speaker: "นักรบเศร้า", text: "ขอบคุณ... นานมากแล้วที่ไม่มีใครฟังข้า" },
      { t: "dialogue", speaker: "นักรบเศร้า", text: "เจ้าทำให้ข้าคิดว่า บางทีก็ยังมีเหตุผลที่จะอยู่ต่อ" },
    ],
    choices: [
      {
        text: "กลับมารายงานเฉาอ้วน",
        next: "qs_qv_inn_drunk_warrior_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_drunk_warrior" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_motivate",
    lines: [
      { t: "dialogue", speaker: "นักรบเศร้า", text: "ลุกขึ้นสู้ต่อ... พูดน่ะง่าย ทำน่ะยาก" },
      { t: "narration", text: "แต่เขาก็วางถ้วยเหล้าลงอย่างช้า ๆ" },
      { t: "dialogue", speaker: "นักรบเศร้า", text: "บางที... เจ้าพูดถูกก็ได้" },
    ],
    choices: [
      {
        text: "กลับไปรายงานเฉาอ้วน",
        next: "qs_qv_inn_drunk_warrior_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_drunk_warrior" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_complete",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เจ้าทำให้เขาดีขึ้น ข้ารู้สึกได้ ขอบคุณที่ใส่ใจคนอื่น" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "รับอาหารพิเศษและทองนี้ไปด้วย" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "inn_gaosheng",
        effects: [{ t: "finishQuest", questId: "qv_inn_drunk_warrior", success: true }],
      },
    ],
  },

  // ─── qv_inn_legend_verify ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_legend_verify_offer",
    lines: [
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "ข้ามีเรื่องลึกลับอยากให้เจ้าสืบ" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "กล่าวกันว่าในถ้ำบทกวีถังมีภาพสลักเรื่องราวของยุทธภพสมัยก่อน" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "ข้าอยากรู้ว่าเรื่องนี้จริงไหม เจ้าช่วยไปดูได้ไหม? แล้วกลับมาเล่าให้ข้าฟังว่าเห็นอะไร" },
    ],
    choices: [
      {
        text: "รับสืบถ้ำโบราณ",
        next: "inn_heluo",
        effects: [{ t: "startQuest", questId: "qv_inn_legend_verify" }],
      },
      { text: "ข้าไม่สนใจตำนานเก่า", next: "inn_heluo" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_legend_verify_report",
    lines: [
      { t: "narration", text: "เจ้าพบถ้ำจริง ๆ ภายในมีภาพสลักบนผนังแสดงยุทธวิธีโบราณ" },
      { t: "narration", text: "เจ้าจดจำรูปแบบสำคัญไว้ก่อนกลับ" },
    ],
    choices: [
      {
        text: "กลับไปเล่าให้โปผู้เล่าเรื่องฟัง",
        next: "cave_tangshi",
        effects: [{ t: "advanceQuest", questId: "qv_inn_legend_verify" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_legend_verify_complete",
    lines: [
      { t: "narration", text: "โปผู้เล่าเรื่องฟังด้วยความตื่นเต้น ตาเป็นประกาย" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "ดีมาก! นี่คือเรื่องราวใหม่สำหรับข้า เจ้าช่วยต่อยอดตำนานไว้แล้ว" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "รับเหรียญโบราณและตำราเบื้องต้นไปเถิด ข้าพบที่ถ้ำเมื่อนานมาแล้ว" },
    ],
    choices: [
      {
        text: "รับรางวัลและฟังเรื่องราวของโปอีกสักเรื่อง",
        next: "inn_heluo",
        effects: [{ t: "finishQuest", questId: "qv_inn_legend_verify", success: true }],
      },
    ],
  },

  // ─── qv_inn_missing_traveler ──────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_missing_traveler_offer",
    lines: [
      { t: "narration", text: "โปผู้เล่าเรื่องดูกังวลผิดปกติ" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "มีผู้หญิงมาพักที่นี่สัปดาห์ก่อน บอกว่าจะออกเดินทางเช้าวันถัดไป" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "แต่ข้าไม่เห็นนางออกไปเลย ถามเจ้าของโรงเตี๊ยมก็ไม่รู้" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "เจ้าช่วยสืบร่องรอยรอบโรงเตี๊ยมนี้หน่อย ว่านางไปไหน ข้าเป็นห่วงมาก" },
    ],
    choices: [
      {
        text: "รับสืบหาผู้หญิงที่หายไป",
        next: "inn_heluo",
        effects: [{ t: "startQuest", questId: "qv_inn_missing_traveler" }],
      },
      { text: "คนแปลกหน้าไม่ใช่ธุระข้า", next: "inn_heluo" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_missing_traveler_found",
    lines: [
      { t: "narration", text: "เจ้าตามหาและพบผู้หญิงคนนั้นซ่อนอยู่ในโกดังนอกเมือง" },
      { t: "dialogue", speaker: "ผู้หญิงหายตัว", text: "อย่าบอกให้ใครรู้ที่ข้าอยู่! ข้ากำลังหนีจากสามีที่ทำร้ายข้า" },
    ],
    choices: [
      {
        text: "ช่วยเธอหาทางออกที่ปลอดภัย",
        next: "qs_qv_inn_missing_traveler_help",
        effects: [{ t: "addTrait", trait: "good", amount: 3 }],
      },
      {
        text: "บอกที่ซ่อนให้โปรู้เท่านั้น",
        next: "qs_qv_inn_missing_traveler_tell",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_missing_traveler_help",
    lines: [
      { t: "narration", text: "เจ้าช่วยผู้หญิงนั้นวางแผนหาเส้นทางที่ปลอดภัยออกไป" },
      { t: "dialogue", speaker: "ผู้หญิงหายตัว", text: "ขอบคุณ... เจ้าเป็นคนดีจริง ๆ ข้าจะไม่ลืมสิ่งนี้" },
    ],
    choices: [
      {
        text: "กลับไปบอกโปว่าเธอปลอดภัย (ไม่บอกที่อยู่)",
        next: "qs_qv_inn_missing_traveler_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_missing_traveler" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_missing_traveler_tell",
    lines: [
      { t: "narration", text: "เจ้าบอกโปว่าเธออยู่ที่ไหน โปตัดสินใจว่าจะช่วยเธอโดยไม่บอกคนอื่น" },
    ],
    choices: [
      {
        text: "พอใจกับการตัดสินใจ",
        next: "qs_qv_inn_missing_traveler_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_missing_traveler" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_missing_traveler_complete",
    lines: [
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "ข้าดีใจที่เธอปลอดภัย บางทีเรื่องราวที่ดีที่สุดคือเรื่องที่ไม่มีใครรู้" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "รับหยกน้อยชิ้นนี้ไป เป็นสิ่งของที่ข้าเก็บสะสมมานาน" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "inn_heluo",
        effects: [{ t: "finishQuest", questId: "qv_inn_missing_traveler", success: true }],
      },
    ],
  },
];
