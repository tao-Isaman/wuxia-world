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
      { t: "dialogue", speaker: "ลาวหนาน", text: "หนุ่มน้อย เจ้ามาจากไหน? หมู่บ้านชีกู่ไม่ค่อยมีคนแปลกหน้าแวะเวียน" },
      { t: "narration", text: "ชาวนาแก่วางจอบลงและถอนหายใจ" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ข้าทำนาที่นี่มาสี่สิบปี รู้จักทุกดิน ทุกหิน... แต่ยิ่งแก่ก็ยิ่งเห็นสิ่งที่ไม่เคยเข้าใจ" },
    ],
  },

  // ─── นางเหมย (village_qigu) ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_vil_qigu_herbalist_mei_talk",
    lines: [
      { t: "narration", text: "หญิงสาวโสมนัสกำลังบดสมุนไพรอยู่ที่หน้าร้านเล็ก ๆ" },
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
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ท่านผู้เดินทาง! ท่านมาถูกที่แล้ว โรงเตี๊ยมยุเหล่ยดีที่สุดในห้าสิบลี้แถวนี้!" },
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
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ยินดีต้อนรับ! ข้าชื่อเฉาอ้วน เจ้าของโรงเตี๊ยมเกาเซิ่ง" },
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
      { t: "dialogue", speaker: "ลาวหนาน", text: "หนุ่มน้อย ข้ามีเรื่องอยากให้ช่วย" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "เมล็ดพันธุ์ข้าวที่สะสมมาตลอดปีหายไป ข้าว่าหนูป่าขโมยไปซ่อนในโกดังเก่า" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "โกดังมีหมาป่าอยู่ใกล้ ๆ ข้าแก่แล้วไม่กล้าไปคนเดียว" },
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
      { t: "narration", text: "เจ้าวางเมล็ดพันธุ์ให้ลาวหนาน ชายแก่รับด้วยมือสั่นด้วยความยินดี" },
      { t: "dialogue", speaker: "ลาวหนาน", text: "ขอบใจมาก หนุ่มน้อย ข้าไม่มีอะไรมาก นอกจากข้าวเก่าและสมุนไพรเล็กน้อย" },
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
      { t: "dialogue", speaker: "ลาวหนาน", text: "ข้าได้ยินว่ามันอยู่ที่ถ้ำในป่า โจรเร่ร่อนพวกนั้นเอาไป" },
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
      { t: "dialogue", speaker: "นางเหมย", text: "เจ้าช่วยหาสมุนไพรให้ข้าได้ไหม? ต้องการบัวหิมะจากเชิงเขา" },
      { t: "dialogue", speaker: "นางเหมย", text: "ผู้ป่วยในหมู่บ้านต้องการยาเร่งด่วน ข้าไม่มีเวลาออกไปเองได้" },
      { t: "dialogue", speaker: "นางเหมย", text: "ระวังด้วย ที่นั่นมีงูและสัตว์ป่าอยู่มาก" },
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
      { t: "narration", text: "เจ้าค้นพบว่ามีโจรเร่ร่อนแอบปล่อยพิษเพื่อบีบค้าขาย" },
      { t: "dialogue", speaker: "โจร", text: "เจ้ารู้มากเกินไปแล้ว! ต้องกำจัดเจ้าออกก่อน!" },
    ],
    choices: [
      {
        text: "สู้เพื่อปกป้องหมู่บ้าน",
        next: "qs_qv_qigu_poisoned_well_complete",
        effects: [
          { t: "triggerBattle", opponentId: "fortune_thief", onWin: "qs_qv_qigu_poisoned_well_complete", onLose: "village_qigu" },
        ],
      },
      { text: "ถอยกลับไปแจ้งนางเหมย", next: "village_qigu" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_qigu_poisoned_well_complete",
    lines: [
      { t: "narration", text: "โจรพ่ายแพ้ หมู่บ้านปลอดภัย" },
      { t: "dialogue", speaker: "นางเหมย", text: "เจ้าทำได้! ขอบคุณที่ปกป้องพวกเรา" },
      { t: "dialogue", speaker: "นางเหมย", text: "รับโสมและยาเลือดนี้ไปเป็นรางวัล" },
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
      { t: "dialogue", speaker: "เฉินเยว่", text: "ตำราเพลงโบราณของข้าหายไป... ข้าวางไว้ในสำนักดนตรีเมื่อสัปดาห์ก่อน" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าสงสัยว่าพ่อค้าเร่คนที่เข้ามาในหมู่บ้านเมื่อวานนำไปขาย" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "เจ้าช่วยตามหาได้ไหม? ตำรานั้นสำคัญมากสำหรับข้า" },
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
      { t: "dialogue", speaker: "เฉินเยว่", text: "ข้าได้รับคำท้าทายจากนักดนตรีในหมู่บ้านใกล้เคียง" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "เขาท้าว่าดนตรีของข้าไม่สมบูรณ์ ข้าต้องพิสูจน์ตัว" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "แต่ข้าต้องการผู้ช่วยนำเพลงไปให้เขาฟังก่อน เจ้าจะช่วยพาข้าสารส่งได้ไหม?" },
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
      { t: "narration", text: "เจ้าเดินทางถึงหมู่บ้านเพื่อนบ้านและนำสารของเฉินเยว่ไปมอบ" },
      { t: "dialogue", speaker: "นักดนตรีคู่แข่ง", text: "โอ้... เพลงนี้ไพเราะจริง ๆ ข้าแพ้แล้ว" },
      { t: "narration", text: "เขาส่งจดหมายตอบรับและของขวัญกลับมา" },
    ],
    choices: [
      {
        text: "นำจดหมายกลับให้เฉินเยว่",
        next: "qs_qv_meihua_music_duel_complete",
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
      { t: "dialogue", speaker: "เฉินเยว่", text: "ช่วยเก็บดอกเหมยสดห้าดอกจากป่าให้ข้าได้ไหม?" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "แต่ต้องเก็บก่อนรุ่งสาง ดอกที่เก็บหลังตะวันขึ้นจะเหี่ยวเร็ว" },
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
      { t: "narration", text: "เจ้านำดอกเหมยสดห้าดอกมาให้เฉินเยว่ ดอกยังสดใสงดงาม" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "สมบูรณ์แบบ! ขอบคุณมาก เทศกาลนี้จะงดงามแน่" },
      { t: "dialogue", speaker: "เฉินเยว่", text: "รับเงินค่าตอบแทนและขนมจีนพิเศษของหมู่บ้านไปด้วย" },
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
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "แค่ไปดูที่ถ้ำเหนือเขาแล้วกลับมารายงาน" },
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
        next: "qs_qv_meihua_tiger_track_complete",
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
        next: "qs_qv_meihua_tiger_track_complete",
        effects: [
          { t: "triggerBattle", opponentId: "mountain_tiger", onWin: "qs_qv_meihua_tiger_track_complete", onLose: "village_meihua" },
        ],
      },
      { text: "หลบหนีออกมา", next: "qs_qv_meihua_tiger_track_complete" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_meihua_tiger_track_complete",
    lines: [
      { t: "dialogue", speaker: "เปาเหล็กก้าน", text: "ข้าเชื่อเจ้าแล้ว เสือตัวนั้นต้องแจ้งเจ้าหน้าที่หมู่บ้าน" },
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
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ม้วนเพลงโบราณของหมู่บ้านเราอยู่ที่สำนักเฮิงซาน" },
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
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "เจ้าช่วยหาอาหารและยาส่งให้ครอบครัวสามหลังในหมู่บ้านได้ไหม?" },
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "ข้าจะบอกที่อยู่ให้ รับสิ่งของเหล่านี้ไปส่ง" },
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
    id: "qs_qv_hengshan_winter_aid_complete",
    lines: [
      { t: "dialogue", speaker: "ผู้อาวุโสอู๋", text: "เจ้าส่งของให้ครบแล้ว ขอบคุณมาก ใจดีอย่างนี้หาได้ยาก" },
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
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าช่วยไปหาลูกข้าได้ไหม? ชื่อเขาคือน้อยเติ้ง อายุสิบห้า" },
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
    ],
    choices: [
      {
        text: "พาน้อยเติ้งกลับบ้าน",
        next: "qs_qv_wuxia_missing_boat_complete",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_missing_boat" }],
      },
      {
        text: "ถามเรื่องโจรสลัดก่อน",
        next: "qs_qv_wuxia_pirate_cache_offer",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_missing_boat_complete",
    lines: [
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
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "คืนนี้ ๆ มีเสียงร้องประหลาดจากแม่น้ำ คนในหมู่บ้านกลัวมาก" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "บางคนบอกว่าเป็นวิญญาณ แต่ข้าว่าเป็นคนทำ" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าช่วยสืบว่าเสียงนั้นมาจากไหนได้ไหม?" },
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
      { t: "narration", text: "เจ้าไปสืบถึงกลางคืน และพบว่าเสียงมาจากชายหนุ่มที่ซ่อนตัวอยู่ในถ้ำริมน้ำ" },
      { t: "dialogue", speaker: "ชายหนุ่ม", text: "อย่าจับข้า! ข้าแค่ซ่อนตัวจากพ่อพ่อแม่บังคับให้แต่งงาน..." },
    ],
    choices: [
      {
        text: "เข้าใจ — ช่วยเจรจากับครอบครัวให้",
        next: "qs_qv_wuxia_river_ghost_kind",
        effects: [{ t: "addTrait", trait: "good", amount: 1 }],
      },
      {
        text: "นำตัวกลับหมู่บ้านก่อน",
        next: "qs_qv_wuxia_river_ghost_complete",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_river_ghost" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_river_ghost_kind",
    lines: [
      { t: "narration", text: "เจ้าพาชายหนุ่มกลับและช่วยเจรจากับครอบครัว สุดท้ายตกลงให้เขาเลือกเองได้" },
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เจ้าใจดีจริง แก้ปัญหาได้โดยไม่ทำให้ใครเสียหน้า" },
    ],
    choices: [
      {
        text: "รับคำชม",
        next: "qs_qv_wuxia_river_ghost_complete",
        effects: [{ t: "advanceQuest", questId: "qv_wuxia_river_ghost" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_river_ghost_complete",
    lines: [
      { t: "dialogue", speaker: "เติ้งลองหาง", text: "เรื่องชัดเจนแล้ว หมู่บ้านปลอดภัย ขอบคุณมาก" },
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
      { t: "dialogue", speaker: "น้อยเติ้ง", text: "ข้าเห็นโจรสลัดฝังสมบัติไว้ที่หาดทราย ใต้ต้นโพธิ์สองต้น" },
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
        next: "qs_qv_wuxia_pirate_cache_complete",
        effects: [
          { t: "triggerBattle", opponentId: "river_pirate", onWin: "qs_qv_wuxia_pirate_cache_complete", onLose: "village_wuxia" },
        ],
      },
      { text: "หนีทิ้งสมบัติ", next: "village_wuxia" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_wuxia_pirate_cache_complete",
    lines: [
      { t: "narration", text: "โจรสลัดพ่ายแพ้ เจ้าเปิดกล่องพบเหรียญโบราณและหยก" },
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
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ท่านผู้เดินทาง! แขกที่เช็คเอาท์เมื่อเช้าลืมกระเป๋าไว้" },
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ข้าไม่สามารถออกไปส่งเองได้ เจ้าช่วยนำไปส่งที่โรงเตี๊ยมเกาเซิ่งได้ไหม? เขาน่าจะมุ่งไปทางนั้น" },
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
      { t: "narration", text: "เจ้าพบแขกคนนั้นที่โรงเตี๊ยมเกาเซิ่ง เขาดีใจมากเมื่อได้กระเป๋าคืน" },
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
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "ท่านเชื่อใจได้ไหม? ข้าสังเกตว่าแขกห้อง 3 แปลกมาก" },
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
      { t: "dialogue", speaker: "นางสาวซิ่ว", text: "เจ้าแก้ปัญหาให้ข้าได้แล้ว! โรงเตี๊ยมปลอดภัยแล้ว" },
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
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ขาดปลาไหลสดจากแม่น้ำวูเซี่ย หาซื้อในตลาดไม่ได้" },
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
      { t: "dialogue", speaker: "เฉาอ้วน", text: "มีโรงเตี๊ยมใหม่เปิดอีกฝั่งถนน... แย่งลูกค้าข้าเยอะมาก" },
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
      { t: "narration", text: "เจ้าไปลองอาหารและสังเกตดูโรงเตี๊ยมใหม่ พบว่าพวกเขาใช้สมุนไพรพิเศษในการปรุง" },
    ],
    choices: [
      {
        text: "บอกความลับนั้นกับเฉาอ้วน",
        next: "qs_qv_inn_rival_inn_complete",
        effects: [
          { t: "advanceQuest", questId: "qv_inn_rival_inn" },
          { t: "addTrait", trait: "evil", amount: 1 },
        ],
      },
      {
        text: "บอกเฉาอ้วนให้ปรับปรุงด้วยตัวเอง ไม่เปิดเผยความลับ",
        next: "qs_qv_inn_rival_inn_honest",
        effects: [
          { t: "advanceQuest", questId: "qv_inn_rival_inn" },
          { t: "addTrait", trait: "good", amount: 1 },
        ],
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
    choices: [
      {
        text: "รับคำขอบคุณ",
        next: "qs_qv_inn_rival_inn_complete",
        effects: [{ t: "advanceQuest", questId: "qv_inn_rival_inn" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qv_inn_rival_inn_complete",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "ขอบคุณที่ช่วย ไม่ว่าจะอย่างไรก็ตาม รับทองนี้ไปเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "inn_gaosheng",
        effects: [{ t: "finishQuest", questId: "qv_inn_rival_inn", success: true }],
      },
    ],
  },

  // ─── qv_inn_drunk_warrior ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qv_inn_drunk_warrior_offer",
    lines: [
      { t: "dialogue", speaker: "เฉาอ้วน", text: "นักรบคนนั้น... เขานั่งดื่มมาสามชั่วโมงแล้ว ดูเหมือนมีทุกข์ใจหนัก" },
      { t: "dialogue", speaker: "เฉาอ้วน", text: "เมื่อก่อนเข้าตามาเป็นคนแข็งแกร่ง ตอนนี้เศร้ามาก" },
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
      { t: "narration", text: "เจ้าเข้าไปนั่งใกล้ ๆ นักรบกำลังจ้องเหล้าอย่างเบิ่ม" },
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
      { t: "dialogue", speaker: "นักรบเศร้า", text: "ต่อสู้ต่อ... ง่ายพูด ยาก ทำ" },
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
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "กล่าวกันว่ามีถ้ำโบราณอยู่ใกล้ ๆ ที่มีภาพสลักเรื่องราวของยุทธจักรสมัยก่อน" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "ข้าอยากรู้ว่าเรื่องนี้จริงไหม เจ้าช่วยไปตรวจสอบได้ไหม? นำของที่เจ้าเห็นมาบอกข้าด้วย" },
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
        next: "qs_qv_inn_legend_verify_complete",
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
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "แต่ข้าไม่เห็นเธอออกไปเลย ถามเจ้าของโรงเตี๊ยมก็ไม่รู้" },
      { t: "dialogue", speaker: "โปผู้เล่าเรื่อง", text: "เจ้าช่วยสืบหาว่าเธอไปไหนได้ไหม? ข้าเป็นห่วงมาก" },
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
