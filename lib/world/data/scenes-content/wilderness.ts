import type { Scene } from "../../types";

// NPC ambient dialogs + quest beats for wilderness — islands, mountains,
// caves, NPC homes, misc. Owned by content agent D.
export const SCENES_WILDERNESS: readonly Scene[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // AMBIENT NPC TALK SCENES
  // ═══════════════════════════════════════════════════════════════════════

  // ─── ฮ่วงเอี้ยะซือ (isle_taohua) ─────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_taohua_hermit_huang_talk",
    lines: [
      { t: "narration", text: "ชายชราในเสื้อคลุมขาดกำลังยืนรดน้ำต้นท้อ หันมามองเจ้าด้วยแววตาไม่พอใจ" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ใครให้เจ้าขึ้นมาบนเกาะข้า? มีธุระอะไรหรือ?" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "เรื่องดาบนั้นข้าไม่สนแล้ว... แต่ถ้าเจ้าพิสูจน์ตัวได้ ก็อาจจะสอนอะไรให้บ้าง" },
    ],
  },

  // ─── ชิวเฉียน (mt_kunlun) ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_kunlun_exile_qiu_talk",
    lines: [
      { t: "narration", text: "ฤๅษีในผ้าขาวนั่งทอดสายตาไปยังทิวเขาเบื้องล่าง น้ำตาแห้งที่มุมตา" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "เจ้ามาจากสำนักไหน? ถ้ามาจากคุนหลุน... กลับไปบอกพวกเขาว่าข้าไม่ยอมรับคำกล่าวหา" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "แต่ถ้ามาด้วยตนเอง... ก็นั่งลงเถิด เขาเย็นนักในยามเย็น" },
    ],
  },

  // ─── หลินชัวซัน (valley_jueqing) ────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_jueqing_elder_lin_talk",
    lines: [
      { t: "narration", text: "ผู้เฒ่าหน้าซีดนั่งบดสมุนไพรอยู่หน้าเพิงเล็ก กลิ่นขมฉุนแพร่ไปทั่ว" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "หุบเขาตัดใจนั้น... ดอกไม้งามแต่พิษ เหมือนความรักในยุทธภพ" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "เจ้ามาทำไมกัน? อยากรู้ความจริงของที่นี่หรืออยากแค่เดินชม?" },
    ],
  },

  // ─── ซวีเหลิงชิง (cave_jinshe) ──────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_jinshe_beasttamer_xu_talk",
    lines: [
      { t: "narration", text: "หญิงสาวยิ้มแผ่กว้างขณะให้อาหารงูขนาดใหญ่ ท่าทางสบายใจเหมือนเล่นกับแมว" },
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "อย่ากลัวนะ เจ้าเขียวนี่บิตไม่ถ้าไม่ยั่ว... ส่วนเจ้าแดงนั่น—" },
      { t: "narration", text: "งูสีแดงพุ่งออกจากกรงและกลับไปหาเธออย่างรวดเร็ว" },
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "เจ้าต้องการพิษหรือต้องการความช่วยเหลือเรื่องอะไร?" },
    ],
  },

  // ─── โม่ฉิงเทียน (desert_ruins) ─────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_desert_collector_mo_talk",
    lines: [
      { t: "narration", text: "ชายชราคุ้ยทรายด้วยไม้เท้าอย่างตั้งใจ เมื่อได้ยินเสียงฝีเท้าก็หันมาด้วยแววตาหลักแหลม" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ฮ่า! คนอีกคนที่ตามรอยซากปรักหักพังมาเหมือนกัน — ดีนักเลย!" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ข้าพบแผ่นจารึกสำคัญที่นี่ แต่ยังแปลไม่ออก เจ้าช่วยได้ไหม?" },
    ],
  },

  // ─── อาเป้า (market_miao) ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_miao_tribaleldr_abao_talk",
    lines: [
      { t: "narration", text: "หัวหน้าชายแก่ในเครื่องแต่งกายสีสันสดใสมองเจ้าอย่างระมัดระวัง" },
      { t: "dialogue", speaker: "อาเป้า", text: "คนภายนอก... เจ้ามาอยู่ในตลาดของเราได้ก็เพราะเราอนุญาต" },
      { t: "dialogue", speaker: "อาเป้า", text: "เผ่าของเราไม่ขัดแย้งกับยุทธจักร แต่ก็ไม่ยอมให้ใครมาย่ำยี" },
      { t: "dialogue", speaker: "อาเป้า", text: "ถ้าเจ้ามาด้วยใจบริสุทธิ์ เราก็ยินดี" },
    ],
  },

  // ─── เหลียงเก๋อ (cliff_motian) ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_motian_ghost_liang_talk",
    lines: [
      { t: "narration", text: "เงาจางร่างเดิน ไม่มีเสียงฝีเท้า สวมเกราะทหารโบราณ ดวงตาเหมือนมีแสงฟ้า" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "เจ้า... เจ้ามองเห็นข้าได้หรือ?" },
      { t: "narration", text: "เสียงของเขาดังมาจากไกลราวกับผ่านทะเลหมอก" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ข้าตายที่นี่เมื่อสามร้อยปีก่อน... แต่ยังไปไม่ได้ เพราะดาบของข้ายังอยู่ที่นี่" },
    ],
    onEnter: [{ t: "setFlag", flag: "motian_ghost_revealed", value: true }],
  },

  // ─── เว่ยชิงเหวิน (cave_bingcan) ─────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_bingcan_scholar_wei_talk",
    lines: [
      { t: "narration", text: "บัณฑิตชราก้มหน้าอยู่กับตำรายาว กองไหมน้ำแข็งอยู่ข้าง ๆ เหมือนกองหิมะเล็ก" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "อย่าเหยียบไหมนั้น! ใช้เวลาเก็บหกเดือนเชียวนะ" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ข้าเลือกถ้ำนี้เพราะเย็นสบาย ตำราไม่เสื่อมสภาพ และที่สำคัญ — ไม่มีใครมารบกวน" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "แต่เจ้ามาแล้ว... ก็โชคดีพอดี เพราะข้าต้องการความช่วยเหลืออยู่" },
    ],
  },

  // ─── ต่านเหลาตู (pool_heilong) ───────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_heilong_fisherman_tan_talk",
    lines: [
      { t: "narration", text: "ชายชราหัวล้านนั่งพิงก้อนหินริมสระ มองผิวน้ำดำสนิทที่ไม่มีแม้คลื่นลม" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "สระนี้ไม่มีปลาธรรมดา ข้าก็รู้ดี แต่ก็ยังมาทุกวัน" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "เมื่อสามปีก่อน ลูกชายข้าโยนสายเบ็ดลงไป... แล้วก็หายไปเลย" },
      { t: "narration", text: "เขาพูดเรียบ ๆ แต่มือที่ถือคันเบ็ดสั่นเล็กน้อย" },
    ],
  },

  // ─── หลัวเฟย์หาว (home_hong) ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_wld_hong_adventurer_luo_talk",
    lines: [
      { t: "narration", text: "หนุ่มในเสื้อเกาะกลับมานอนหลังพักสนาม แผนที่กระดาษหลายแผ่นกองอยู่รอบ ๆ" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "เฮ้! เจ้ามาในเวลาพอดีเลย ข้ากำลังต้องการตัวช่วย!" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "ข้าพบแผนที่สมบัติของโฮ่งชีก๋งเจ็ดชั้น แต่ปัญหาคือมีสัตว์ป่าดุร้ายอยู่บริเวณเจาะ" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // QUEST OFFER / PROGRESS / COMPLETE / DECLINE SCENES
  // ═══════════════════════════════════════════════════════════════════════

  // ─── qw_taohua_codex_fragments ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_taohua_codex_fragments_offer",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ข้ามีตำรากระบี่โบราณ แต่หลายแผ่นถูกพัดหายไปทั่วเกาะตอนพายุ" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "นำชิ้นส่วนตำรา 3 ชิ้นที่กระจัดกระจายบนเกาะมาคืนให้ข้า ถ้าทำได้ ก็อาจสอนบางอย่างให้เจ้า" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "isle_taohua",
        effects: [{ t: "startQuest", questId: "qw_taohua_codex_fragments" }],
      },
      { text: "ยังไม่พร้อม", next: "isle_taohua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_taohua_codex_fragments_progress",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ยังหาไม่ครบ? แผ่นกระดาษมันไม่ได้หนีไปไหนหรอก — เจ้าแค่ไม่ตั้งใจ" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_taohua_codex_fragments_complete",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ฮ่า! นำมาครบแล้ว... ดีกว่าที่คาดไว้" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ข้าจะสอนท่าเคลื่อนไหวพื้นฐานที่เจ้าจะไม่ได้เรียนจากที่ไหนอีก" },
      { t: "narration", text: "ปรมาจารย์หยิบพัดขึ้นมาและสาธิตท่าที่ดูเรียบง่ายแต่ลึกซึ้ง" },
    ],
    choices: [
      {
        text: "รับคำสอน",
        next: "isle_taohua",
        effects: [
          { t: "finishQuest", questId: "qw_taohua_codex_fragments", success: true },
        ],
      },
    ],
  },

  // ─── qw_taohua_peach_wine ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_taohua_peach_wine_offer",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ข้าต้องการเหล้าท้อสำรองสำหรับฤดูหนาว ไปหาที่ตลาดชาวเมี่ยวให้ข้าได้ไหม?" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "บอกว่าข้าส่งมา เขาจะรู้ว่าต้องการของคุณภาพอะไร" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "isle_taohua",
        effects: [{ t: "startQuest", questId: "qw_taohua_peach_wine" }],
      },
      { text: "ปฏิเสธ", next: "isle_taohua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_taohua_peach_wine_complete",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ฮ่า! ได้มาแล้ว ดีใจเหมือนกัน..." },
      { t: "narration", text: "ปรมาจารย์เปิดขวดดมกลิ่น และพยักหน้าอย่างพอใจ" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "รับทองไป ข้าไม่อยากติดค้างใคร" },
    ],
    choices: [
      {
        text: "รับรางวัลและจากไป",
        next: "isle_taohua",
        effects: [
          { t: "finishQuest", questId: "qw_taohua_peach_wine", success: true },
        ],
      },
    ],
  },

  // ─── qw_taohua_duel_proof ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_taohua_duel_proof_offer",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "มีนักรบอ้างตัวว่าเป็นศิษย์ข้าไปทั่ว สร้างความเสียหายให้คนอื่น" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ไปพิสูจน์ว่าเจ้าแกร่งกว่าเขา แล้วบอกให้หยุดอ้างชื่อข้า" },
      { t: "narration", text: "ปรมาจารย์ส่งแผนที่ตำแหน่งให้เจ้า" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "isle_taohua",
        effects: [{ t: "startQuest", questId: "qw_taohua_duel_proof" }],
      },
      { text: "ไม่สนใจ", next: "isle_taohua" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_taohua_duel_proof_complete",
    lines: [
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "ปราบได้แล้ว? ดี ชื่อข้าก็จะกลับมาบริสุทธิ์" },
      { t: "dialogue", speaker: "ฮ่วงเอี้ยะซือ", text: "เจ้ามีแววดี สอนวิชาเพิ่มให้สักนิดก็คุ้ม" },
    ],
    choices: [
      {
        text: "รับคำสอน",
        next: "isle_taohua",
        effects: [
          { t: "finishQuest", questId: "qw_taohua_duel_proof", success: true },
        ],
      },
    ],
  },

  // ─── qw_kunlun_exile_truth ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_kunlun_exile_truth_offer",
    lines: [
      { t: "dialogue", speaker: "ชิวเฉียน", text: "ข้าถูกกล่าวหาว่าขโมยคัมภีร์สำคัญของสำนัก แต่มันไม่เป็นความจริง" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "คัมภีร์นั้นถูกซ่อนอยู่ในถ้ำน้ำแข็งไหม เจ้ากล้าไปหาหลักฐานให้ข้าไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "mt_kunlun",
        effects: [{ t: "startQuest", questId: "qw_kunlun_exile_truth" }],
      },
      { text: "ยังไม่แน่ใจ", next: "mt_kunlun" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_kunlun_exile_truth_progress",
    lines: [
      { t: "dialogue", speaker: "ชิวเฉียน", text: "ยังไม่พบหลักฐาน? ถ้ำน้ำแข็งไหมอาจมีผู้ดูแลอยู่ ระวังตัวด้วย" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_kunlun_exile_truth_complete",
    lines: [
      { t: "dialogue", speaker: "ชิวเฉียน", text: "เจ้านำหลักฐานมาได้... ข้าไม่รู้ว่าจะรู้สึกยินดีหรือเศร้า" },
      { t: "narration", text: "ฤๅษีแก่รับม้วนหนังสือด้วยมือสั่นเครือ น้ำตาคลอแต่ไม่ยอมหลั่ง" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "ขอบคุณ ข้าจะสอนวิชาที่เรียนมาทั้งชีวิตให้เจ้าสักส่วนหนึ่ง" },
    ],
    choices: [
      {
        text: "รับคำสอนด้วยความยินดี",
        next: "mt_kunlun",
        effects: [
          { t: "finishQuest", questId: "qw_kunlun_exile_truth", success: true },
          { t: "addTrait", trait: "good", amount: 5 },
        ],
      },
    ],
  },

  // ─── qw_kunlun_snow_lotus ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_kunlun_snow_lotus_offer",
    lines: [
      { t: "dialogue", speaker: "ชิวเฉียน", text: "ข้าเจ็บป่วยมานาน ต้องการบัวหิมะจากยอดเขาคุนหลุนนิรันดร์" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "แต่ยอดนั้นมีปีศาจหิมะพิทักษ์อยู่ ใครก็ตามที่ขึ้นไปต้องพร้อมสู้" },
    ],
    choices: [
      {
        text: "ขึ้นไปให้",
        next: "mt_kunlun",
        effects: [{ t: "startQuest", questId: "qw_kunlun_snow_lotus" }],
      },
      { text: "เรื่องนี้อันตรายเกินไป", next: "mt_kunlun" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_kunlun_snow_lotus_complete",
    lines: [
      { t: "dialogue", speaker: "ชิวเฉียน", text: "เจ้านำบัวหิมะมาได้... แล้วก็ยังแข็งแกร่งพอจะยืนอยู่ได้อีก" },
      { t: "dialogue", speaker: "ชิวเฉียน", text: "รับทองและยาบำรุงไป ข้าสอนวิชาให้แลกไม่ได้ แต่นี่คือทั้งหมดที่มี" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "mt_kunlun",
        effects: [
          { t: "finishQuest", questId: "qw_kunlun_snow_lotus", success: true },
        ],
      },
    ],
  },

  // ─── qw_jueqing_bitter_flower ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_jueqing_bitter_flower_offer",
    lines: [
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ลึกลงไปในหุบเขา มีดอกไม้สีดำที่ใช้ทำยาแก้พิษชนิดพิเศษ" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ข้าแก่เกินไปจะลงไปเก็บ แต่เจ้าดูจะหนุ่มแน่น... ช่วยเก็บดอกขมห้าดอกมาให้หน่อยได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "valley_jueqing",
        effects: [{ t: "startQuest", questId: "qw_jueqing_bitter_flower" }],
      },
      { text: "ยังไม่พร้อม", next: "valley_jueqing" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jueqing_bitter_flower_complete",
    lines: [
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ดีใจจริง ๆ ที่เจ้ากลับมาทั้งตัว ดอกไม้ขมในหุบนั้นมีพิษด้วย" },
      { t: "narration", text: "ผู้เฒ่ารับดอกไม้ไปอย่างระมัดระวัง จากนั้นหยิบยาขวดเล็กมาให้" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ยานี้เป็นความลับ ใช้ได้กับพิษสัตว์แทบทุกชนิด" },
    ],
    choices: [
      {
        text: "รับยาและขอบคุณ",
        next: "valley_jueqing",
        effects: [
          { t: "finishQuest", questId: "qw_jueqing_bitter_flower", success: true },
        ],
      },
    ],
  },

  // ─── qw_jueqing_ghost_hunt ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_jueqing_ghost_hunt_offer",
    lines: [
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ช่วงนี้มีเสียงประหลาดในก้นหุบเขาทุกคืน ลูกบ้านไม่กล้าออกไปเก็บสมุนไพรเลย" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "ข้าสงสัยว่าเป็นวิญญาณไม่สงบ เจ้ากล้าลงไปสืบดูไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "valley_jueqing",
        effects: [{ t: "startQuest", questId: "qw_jueqing_ghost_hunt" }],
      },
      { text: "เรื่องผีนี่ข้าไม่ถนัด", next: "valley_jueqing" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jueqing_ghost_hunt_investigate",
    lines: [
      { t: "narration", text: "เจ้าลงไปถึงก้นหุบเขาตัดใจ พบซากเกราะเก่าและหัวหอกแตกกระจาย" },
      { t: "narration", text: "เสียงลมพัดผ่านซอกหินฟังดูเหมือนเสียงร้องไห้" },
    ],
    choices: [
      {
        text: "ตรวจสอบซากเกราะ",
        next: "qs_qw_jueqing_ghost_hunt_found",
        effects: [{ t: "setFlag", flag: "jueqing_ghost_clue", value: true }],
      },
      {
        text: "ออกไปก่อน",
        next: "valley_jueqing_bottom",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jueqing_ghost_hunt_found",
    lines: [
      { t: "narration", text: "บนซากเกราะมีรูปงูแกะสลักอยู่ — เครื่องหมายของสำนักพรรคเบญจพิษ" },
      { t: "narration", text: "ดูเหมือนมีทหารสำนักพรรคเบญจพิษมาตายที่นี่เมื่อนานมาแล้ว และวิญญาณยังไม่อยู่นิ่ง" },
    ],
    choices: [
      {
        text: "นำหลักฐานกลับไปรายงาน",
        next: "valley_jueqing",
        effects: [{ t: "advanceQuest", questId: "qw_jueqing_ghost_hunt" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jueqing_ghost_hunt_complete",
    lines: [
      { t: "dialogue", speaker: "หลินชัวซัน", text: "วิญญาณเบญจพิษ... ไม่น่าแปลกใจ หุบเขานี้เป็นสถานที่ต่อสู้เมื่อสองร้อยปีก่อน" },
      { t: "dialogue", speaker: "หลินชัวซัน", text: "รับยาฟื้นพลังไป เจ้าทำได้ดี" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "valley_jueqing",
        effects: [
          { t: "finishQuest", questId: "qw_jueqing_ghost_hunt", success: true },
        ],
      },
    ],
  },

  // ─── qw_jinshe_venom_rare ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_jinshe_venom_rare_offer",
    lines: [
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "ข้ากำลังต้องการพิษตะขาบยักษ์จากแถวเขาคุนหลุน มันยากที่สุดในการหา" },
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "ตะขาบยักษ์นั้นน่ากลัวแต่ข้าสอนวิธีสกัดพิษให้หลังจากที่เจ้าเอาชนะมันได้" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cave_jinshe",
        effects: [{ t: "startQuest", questId: "qw_jinshe_venom_rare" }],
      },
      { text: "ฟังดูอันตรายเกินไป", next: "cave_jinshe" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jinshe_venom_rare_complete",
    lines: [
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "พิษตะขาบยักษ์! เยี่ยมมาก เจ้าสู้เก่งกว่าที่คาด" },
      { t: "narration", text: "หญิงสาวรับขวดพิษแล้วยิ้มกว้าง จากนั้นหยิบยาต้านพิษพิเศษให้แลก" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "cave_jinshe",
        effects: [
          { t: "finishQuest", questId: "qw_jinshe_venom_rare", success: true },
        ],
      },
    ],
  },

  // ─── qw_jinshe_lost_serpent ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_jinshe_lost_serpent_offer",
    lines: [
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "งูทองของข้าหายไป! มันออกไปในถ้ำลึก ข้าตามหาสามวันแล้ว" },
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "ช่วยตามหาให้หน่อยได้ไหม? งูทองนั้นขี้กลัวแต่ไม่กัดคนที่ไม่รังแกมัน" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cave_jinshe",
        effects: [{ t: "startQuest", questId: "qw_jinshe_lost_serpent" }],
      },
      { text: "งูไม่ใช่สิ่งที่ข้าถนัด", next: "cave_jinshe" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_jinshe_lost_serpent_complete",
    lines: [
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "เจ้าพบเจ้าทอง! ขอบคุณมากเลยนะ" },
      { t: "narration", text: "งูทองขดตัวอยู่รอบแขนหญิงสาวอย่างเชื่องชิด" },
      { t: "dialogue", speaker: "ซวีเหลิงชิง", text: "รับเหรียญทองไป และถ้าต้องการพิษอะไรในอนาคต บอกข้าได้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "cave_jinshe",
        effects: [
          { t: "finishQuest", questId: "qw_jinshe_lost_serpent", success: true },
        ],
      },
    ],
  },

  // ─── qw_desert_ancient_map ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_desert_ancient_map_offer",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "แผ่นจารึกนี้บอกพิกัดของสมบัติโบราณ แต่เป็นภาษาชนเผ่าเก่า ข้าอ่านไม่ออก" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ไปถามหัวหน้าเผ่าเมี่ยวดูสิ พวกเขาน่าจะรู้ภาษาโบราณแบบนี้" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "desert_ruins",
        effects: [{ t: "startQuest", questId: "qw_desert_ancient_map" }],
      },
      { text: "เรื่องนี้ไม่น่าสนใจ", next: "desert_ruins" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_ancient_map_progress",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ยังไม่ได้ถามชาวเมี่ยวหรือ? ไปเร็ว ๆ นะ ความอยากรู้ของข้ามันรอไม่ได้!" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_ancient_map_decoded",
    lines: [
      { t: "narration", text: "หัวหน้าเผ่าเมี่ยวอ่านจารึกอย่างช้า ๆ แล้วหัวเราะด้วยความประหลาดใจ" },
      { t: "dialogue", speaker: "อาเป้า", text: "นี่คือแผนที่ของคลังสมบัติโบราณในทะเลทรายร้าง... บรรพบุรุษเราเคยเก็บรักษาที่นั่น" },
      { t: "dialogue", speaker: "อาเป้า", text: "เอาข้อมูลนี้คืนให้นักสะสมไปเถิด แต่บอกเขาด้วยว่าสมบัตินั้นมีผู้พิทักษ์" },
    ],
    choices: [
      {
        text: "นำข้อมูลกลับไป",
        next: "desert_ruins",
        effects: [{ t: "advanceQuest", questId: "qw_desert_ancient_map" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_ancient_map_complete",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "มีผู้พิทักษ์! ยิ่งน่าสนใจ! ขอบคุณนะ — รับทองไป" },
      { t: "narration", text: "ชายชราหัวเราะอย่างสนุกสนาน จดบันทึกลงในสมุดขนาดเล็ก" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "desert_ruins",
        effects: [
          { t: "finishQuest", questId: "qw_desert_ancient_map", success: true },
        ],
      },
    ],
  },

  // ─── qw_desert_relic_return ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_desert_relic_return_offer",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ข้าพบเหรียญโบราณที่ชัดเจนว่าเป็นของตระกูลเชื้อพระวงศ์ในหยางโจว" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "นำมันไปคืนให้ตระกูลนั้นเถิด ข้าสะสมของได้มากมายแต่ไม่อยากรับของที่เป็นของคนอื่น" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "desert_ruins",
        effects: [
          { t: "startQuest", questId: "qw_desert_relic_return" },
          { t: "giveItem", itemId: "ancient_coin", count: 1 },
        ],
      },
      { text: "ไม่ใช่ธุระของข้า", next: "desert_ruins" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_relic_return_complete",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "เจ้าคืนเหรียญไปแล้ว? ดีนักเลย!" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ข้าเจอของดีอีกอย่าง แบ่งให้เจ้าเป็นค่าตอบแทน" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "desert_ruins",
        effects: [
          { t: "finishQuest", questId: "qw_desert_relic_return", success: true },
        ],
      },
    ],
  },

  // ─── qw_desert_guardian_test ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_desert_guardian_test_offer",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "ข้าต้องการพิสูจน์ว่าผู้พิทักษ์สมบัตินั้นแกร่งแค่ไหนจริง ๆ" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "เจ้าพอกล้าไปทดสอบแล้วรายงานผลให้ข้าได้ไหม? ถ้ารอดกลับมาได้ รางวัลจะงาม" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "desert_ruins",
        effects: [{ t: "startQuest", questId: "qw_desert_guardian_test" }],
      },
      { text: "บ้าหรือเปล่า", next: "desert_ruins" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_guardian_test_battle",
    lines: [
      { t: "narration", text: "ลึกเข้าไปในซากปรักหักพัง เจ้าพบนักรบทะเลทรายสองคนยืนอยู่หน้าประตูหิน" },
      { t: "dialogue", speaker: "นักรบทะเลทราย", text: "ไม่มีใครผ่านได้โดยไม่พิสูจน์ตัว!" },
    ],
    choices: [
      {
        text: "สู้เพื่อพิสูจน์",
        next: "qs_qw_desert_guardian_test_after_battle",
        effects: [
          { t: "triggerBattle", opponentId: "desert_marauder", onWin: "qs_qw_desert_guardian_test_after_battle", onLose: "desert_ruins" },
        ],
      },
      { text: "ถอยออกมาก่อน", next: "desert_ruins" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_guardian_test_after_battle",
    lines: [
      { t: "narration", text: "นักรบล้มลง ประตูหินเปิดออก แต่ข้างในมีเพียงกล่องว่างเปล่า" },
      { t: "narration", text: "สมบัติถูกนำออกไปแล้วตั้งนานแล้ว" },
    ],
    choices: [
      {
        text: "กลับไปรายงาน",
        next: "desert_ruins",
        effects: [{ t: "advanceQuest", questId: "qw_desert_guardian_test" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_desert_guardian_test_complete",
    lines: [
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "สมบัติหมดแล้วอยู่แล้ว! แต่ข้าแค่อยากรู้ว่าผู้พิทักษ์ยังอยู่ไหม" },
      { t: "dialogue", speaker: "โม่ฉิงเทียน", text: "เจ้าเก่งมาก รับทองและหยกชิ้นนี้ไปเป็นรางวัล" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "desert_ruins",
        effects: [
          { t: "finishQuest", questId: "qw_desert_guardian_test", success: true },
        ],
      },
    ],
  },

  // ─── qw_miao_tribal_remedy ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_miao_tribal_remedy_offer",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "คนในเผ่าล้มป่วยด้วยโรคที่ยาของเราบรรเทาไม่ได้" },
      { t: "dialogue", speaker: "อาเป้า", text: "ต้องการสมุนไพรหายากจากถ้ำน้ำแข็งไหมสามชนิด ถ้าเจ้าช่วยได้ เราจะขอบคุณอย่างดี" },
    ],
    choices: [
      {
        text: "ยินดีช่วย",
        next: "market_miao",
        effects: [{ t: "startQuest", questId: "qw_miao_tribal_remedy" }],
      },
      { text: "ข้าไม่รู้จักสมุนไพรดีพอ", next: "market_miao" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_tribal_remedy_complete",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "เจ้านำสมุนไพรมาครบแล้ว... เผ่าเราเป็นหนี้บุญคุณเจ้า" },
      { t: "narration", text: "หัวหน้าเผ่าโค้งคำนับอย่างนอบน้อม จากนั้นมอบเครื่องรางทำมือให้" },
      { t: "dialogue", speaker: "อาเป้า", text: "เครื่องรางนี้จะเป็นสัญลักษณ์ว่าเจ้าเป็นมิตรของเผ่าเมี่ยว" },
    ],
    choices: [
      {
        text: "รับเครื่องรางด้วยความซาบซึ้ง",
        next: "market_miao",
        effects: [
          { t: "finishQuest", questId: "qw_miao_tribal_remedy", success: true },
          { t: "addTrait", trait: "good", amount: 8 },
        ],
      },
    ],
  },

  // ─── qw_miao_spirit_beast ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_miao_spirit_beast_offer",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "สัตว์ศักดิ์สิทธิ์ของเผ่าเราหายไปจากป่า เราเชื่อว่ามันถูกดักจับ" },
      { t: "dialogue", speaker: "อาเป้า", text: "ถ้าเจ้าพบและปล่อยมันได้ เราจะสอนความรู้สมุนไพรโบราณของเผ่าให้" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "market_miao",
        effects: [{ t: "startQuest", questId: "qw_miao_spirit_beast" }],
      },
      { text: "เรื่องนี้ซับซ้อนเกินไป", next: "market_miao" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_spirit_beast_found",
    lines: [
      { t: "narration", text: "ในป่าลึก เจ้าพบกรงใส่สัตว์คล้ายกวางสีทอง มีโจรพรานสองคนดูแลอยู่" },
    ],
    choices: [
      {
        text: "โจมตีโจรพรานเพื่อปล่อยสัตว์",
        next: "qs_qw_miao_spirit_beast_freed",
        effects: [
          { t: "triggerBattle", opponentId: "bandit", onWin: "qs_qw_miao_spirit_beast_freed", onLose: "market_miao" },
        ],
      },
      {
        text: "แอบเปิดกรงในขณะที่ไม่มีใครเห็น",
        next: "qs_qw_miao_spirit_beast_freed",
        effects: [{ t: "addTrait", trait: "humility", amount: 3 }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_spirit_beast_freed",
    lines: [
      { t: "narration", text: "สัตว์สีทองออกจากกรงและวิ่งหายเข้าไปในป่า สายตาของมันจ้องเจ้าอยู่ครู่หนึ่งราวกับขอบคุณ" },
    ],
    choices: [
      {
        text: "กลับไปรายงานหัวหน้าเผ่า",
        next: "market_miao",
        effects: [{ t: "advanceQuest", questId: "qw_miao_spirit_beast" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_spirit_beast_complete",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "สัตว์ศักดิ์สิทธิ์กลับมาป่าแล้ว! เจ้าช่วยเผ่าเราได้มาก" },
      { t: "dialogue", speaker: "อาเป้า", text: "ตำราสมุนไพรโบราณของเผ่า — ข้าจะสอนสักส่วนหนึ่ง" },
    ],
    choices: [
      {
        text: "รับการสอน",
        next: "market_miao",
        effects: [
          { t: "finishQuest", questId: "qw_miao_spirit_beast", success: true },
        ],
      },
    ],
  },

  // ─── qw_miao_offering_cave ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_miao_offering_cave_offer",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "พิธีกรรมประจำปีของเราต้องนำของถวายไปวางที่ถ้ำบทกวีถัง" },
      { t: "dialogue", speaker: "อาเป้า", text: "แต่ถ้ำนั้นมีพวกตะขาบยักษ์อาศัยอยู่ เด็กในเผ่าไม่กล้าไป เจ้าช่วยนำของไปวางได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "market_miao",
        effects: [
          { t: "startQuest", questId: "qw_miao_offering_cave" },
          { t: "giveItem", itemId: "lotus_seed", count: 3 },
        ],
      },
      { text: "ข้าไม่ใช่คนรับใช้ใคร", next: "market_miao" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_offering_cave_arrived",
    lines: [
      { t: "narration", text: "ปากถ้ำบทกวีถัง — ผนังถ้ำสลักด้วยบทกวีโบราณนับร้อย" },
      { t: "narration", text: "เสียงเคลื่อนไหวในความมืด... ตะขาบยักษ์ออกมา" },
    ],
    choices: [
      {
        text: "สู้ตะขาบและวางของถวาย",
        next: "qs_qw_miao_offering_cave_done",
        effects: [
          { t: "triggerBattle", opponentId: "giant_centipede", onWin: "qs_qw_miao_offering_cave_done", onLose: "market_miao" },
        ],
      },
      { text: "วางของและถอยเร็ว ๆ", next: "qs_qw_miao_offering_cave_done" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_offering_cave_done",
    lines: [
      { t: "narration", text: "ของถวายถูกวางไว้บนแท่นหิน กลิ่นสมุนไพรลอยออกมา" },
      { t: "narration", text: "อากาศในถ้ำเปลี่ยนแปลงอย่างประหลาด — เหมือนมีใครรับรู้" },
    ],
    choices: [
      {
        text: "กลับไปรายงาน",
        next: "market_miao",
        effects: [{ t: "advanceQuest", questId: "qw_miao_offering_cave" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_miao_offering_cave_complete",
    lines: [
      { t: "dialogue", speaker: "อาเป้า", text: "พิธีกรรมสำเร็จแล้ว เทพเจ้าผู้รักษาถ้ำจะพอใจ" },
      { t: "dialogue", speaker: "อาเป้า", text: "รับทองและผ้าไหมของเผ่าไปเถิด ขอบคุณมาก" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "market_miao",
        effects: [
          { t: "finishQuest", questId: "qw_miao_offering_cave", success: true },
        ],
      },
    ],
  },

  // ─── qw_motian_restless_soul ──────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_motian_restless_soul_offer",
    lines: [
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ข้าตายที่นี่เพราะถูกทรยศ ดาบของข้าถูกฝังพร้อมกับร่าง แต่สหายที่ทรยศใช้มันต่อไปอีกสามสิบปี" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ดาบนั้นตอนนี้อยู่ที่ถ้ำสมบัติลับ นำมันมาคืนข้า แล้วข้าจะไปได้สักที" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cliff_motian",
        effects: [{ t: "startQuest", questId: "qw_motian_restless_soul" }],
      },
      { text: "เรื่องนี้ไม่ใช่ธุระข้า", next: "cliff_motian" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_motian_restless_soul_progress",
    lines: [
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ข้ารอมาสามร้อยปีแล้ว... อีกนิดก็คงรอได้ แต่ขอให้รวดเร็วนะ" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_motian_restless_soul_choice",
    lines: [
      { t: "narration", text: "เจ้านำดาบโบราณรูปทรงแปลกมาถึงยอดเขามรณะ วิญญาณเหลียงเก๋อปรากฏขึ้น" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "นั่นคือดาบข้า... ขอบคุณ นักเดินทาง" },
      { t: "narration", text: "เขาจ้องมองดาบด้วยความรู้สึกที่ซับซ้อน — ความโศกเศร้า ความโกรธ และบางอย่างที่เหมือนความโล่งใจ" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "มีทางเลือก — เจ้าจะคืนดาบให้ข้าตามสัญญา หรือจะเก็บไว้เป็นของตัวเอง? ดาบนี้ทรงพลังมาก" },
    ],
    choices: [
      {
        text: "คืนดาบให้วิญญาณตามสัญญา",
        next: "qs_qw_motian_restless_soul_complete_good",
        effects: [
          { t: "takeItem", itemId: "jade", count: 1 },
          { t: "addTrait", trait: "good", amount: 10 },
          { t: "addTrait", trait: "humility", amount: 5 },
        ],
      },
      {
        text: "เก็บดาบไว้ วิญญาณนี้รอมานานพอแล้ว",
        next: "qs_qw_motian_restless_soul_complete_evil",
        effects: [
          { t: "addTrait", trait: "evil", amount: 8 },
          { t: "addTrait", trait: "arrogance", amount: 5 },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_motian_restless_soul_complete_good",
    lines: [
      { t: "narration", text: "วิญญาณรับดาบไปแล้วปล่อยให้สลาย แสงทองอ่อน ๆ ลอยขึ้นจากปลายดาบ" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ข้าไปได้แล้ว... ขอบคุณ นักเดินทาง ขอให้เจ้าไม่ต้องแบกรับสิ่งที่ข้าแบกมาตลอดชีวิต" },
      { t: "narration", text: "แสงทองจางหาย ลมบนยอดเขาหยุดพัดสักครู่ก่อนกลับมาอีกครั้ง" },
    ],
    choices: [
      {
        text: "ยืนอยู่ในความเงียบสงบ",
        next: "cliff_motian",
        effects: [
          { t: "finishQuest", questId: "qw_motian_restless_soul", success: true },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_motian_restless_soul_complete_evil",
    lines: [
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "เจ้า... เจ้าเลือกเหมือนสหายที่ทรยศข้า" },
      { t: "narration", text: "วิญญาณจางหายไปพร้อมความเจ็บปวด เจ้าถือดาบโบราณไว้ในมือ แต่รู้สึกหนักอย่างแปลก" },
    ],
    choices: [
      {
        text: "จากไปโดยไม่돌หันไปมอง",
        next: "cliff_motian",
        effects: [
          { t: "finishQuest", questId: "qw_motian_restless_soul", success: true },
          { t: "giveItem", itemId: "jade", count: 1 },
        ],
      },
    ],
  },

  // ─── qw_motian_sword_return ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_motian_sword_return_offer",
    lines: [
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ถ้าเจ้าไม่อยากเข้าไปในถ้ำสมบัติ ก็มีอีกทาง" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "นำดอกไม้ขมจากหุบเขาตัดใจมาให้ข้าห้าดอก เป็นส่วนผสมพิธีกรรมที่อาจเปิดทางให้ข้าไปได้เช่นกัน" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cliff_motian",
        effects: [{ t: "startQuest", questId: "qw_motian_sword_return" }],
      },
      { text: "ข้าไม่เข้าใจพิธีกรรมแบบนี้", next: "cliff_motian" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_motian_sword_return_complete",
    lines: [
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ดอกไม้ขม... ข้าจำกลิ่นนี้ได้ มันเป็นดอกไม้ที่ปลูกบนหลุมศพข้า" },
      { t: "narration", text: "วิญญาณรับดอกไม้และเริ่มพิธีสวดอย่างเบาเบา" },
      { t: "dialogue", speaker: "เหลียงเก๋อ", text: "ข้าจะไปได้แล้ว ขอบคุณที่ช่วย" },
      { t: "narration", text: "แสงจางปรากฏและค่อย ๆ สลาย ยอดเขามรณะเงียบสงัดเหมือนไม่มีอะไรเกิดขึ้น" },
    ],
    choices: [
      {
        text: "อยู่จนกว่าแสงจะดับสนิท",
        next: "cliff_motian",
        effects: [
          { t: "finishQuest", questId: "qw_motian_sword_return", success: true },
          { t: "addTrait", trait: "good", amount: 8 },
        ],
      },
    ],
  },

  // ─── qw_bingcan_silk_scroll ───────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_bingcan_silk_scroll_offer",
    lines: [
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ข้ากำลังเขียนตำราอ้างอิงเรื่องวิชาภายในโบราณ ต้องการไหมน้ำแข็งคุณภาพดีมาเย็บปก" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ไหมนั้นอยู่ในถ้ำลึก ตะขาบพิทักษ์อยู่ แต่ไหมนี้ไม่สามารถหาได้จากที่ไหนอีกแล้ว" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cave_bingcan",
        effects: [{ t: "startQuest", questId: "qw_bingcan_silk_scroll" }],
      },
      { text: "ยังไม่อยากสู้ตะขาบ", next: "cave_bingcan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_bingcan_silk_scroll_complete",
    lines: [
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ไหมน้ำแข็งบริสุทธิ์! ข้าจะใช้เย็บตำราเล่มสำคัญที่สุดในชีวิต" },
      { t: "narration", text: "บัณฑิตผู้ชราหยิบม้วนหนังสือเก่าออกมาและมอบให้เจ้า" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ตำราเล่มนี้เป็นบันทึกของข้าเอง ไม่ได้เขียนวิชาที่สอนได้ แต่มีปัญญาของคนที่ใช้ชีวิตในถ้ำสี่สิบปีอยู่ในนั้น" },
    ],
    choices: [
      {
        text: "รับตำราด้วยความซาบซึ้ง",
        next: "cave_bingcan",
        effects: [
          { t: "finishQuest", questId: "qw_bingcan_silk_scroll", success: true },
        ],
      },
    ],
  },

  // ─── qw_bingcan_ice_fever ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_bingcan_ice_fever_offer",
    lines: [
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ข้าสังเกตว่าเจ้าดูซีดผิดปกติ... ข้าเคยเห็นอาการแบบนี้ มันเรียกว่า 'ไข้น้ำแข็ง' เกิดจากถูกพิษหิมะโดยไม่รู้ตัว" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ข้าสามารถผสมยาแก้ได้แต่ต้องการโสมจากเขาคุนหลุนนิรันดร์ เจ้าจะไปหาให้ข้าได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "cave_bingcan",
        effects: [{ t: "startQuest", questId: "qw_bingcan_ice_fever" }],
      },
      { text: "ข้าสบายดี ไม่ต้องการยา", next: "cave_bingcan" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_bingcan_ice_fever_complete",
    lines: [
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "โสมสดจากคุนหลุนนิรันดร์! ข้าจะผสมยาให้เดี๋ยวนี้" },
      { t: "narration", text: "บัณฑิตทำงานอย่างชำนาญ ยาสีเขียวอ่อนโผล่ออกมาในขวดแก้ว" },
      { t: "dialogue", speaker: "เว่ยชิงเหวิน", text: "ดื่มยานี้ และเก็บขวดใหม่ไปด้วย ถ้าเกิดอาการอีกก็ใช้ได้เลย" },
    ],
    choices: [
      {
        text: "รับยาและขอบคุณ",
        next: "cave_bingcan",
        effects: [
          { t: "finishQuest", questId: "qw_bingcan_ice_fever", success: true },
        ],
      },
    ],
  },

  // ─── qw_heilong_dragon_pearl ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_offer",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "มีข่าวลือว่าก้นสระนี้มีมังกรดำอาศัยอยู่ มีไข่มุกมังกรเป็นสมบัติ" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "ข้าไม่อยากเอา แต่พ่อค้าเมืองหลวงมาเสนอราคาสูงมาก ถ้าเจ้าดำลงไปหาได้..." },
      { t: "narration", text: "เขาหยุดและมองหน้าเจ้าจริงจัง" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "จริง ๆ แล้ว ข้าแค่อยากรู้ว่าในนั้นมีอะไร ไม่ใช่เพื่อเงิน รู้สึกอย่างนั้น" },
    ],
    choices: [
      {
        text: "รับภารกิจ — ดำลงไปสำรวจ",
        next: "pool_heilong",
        effects: [{ t: "startQuest", questId: "qw_heilong_dragon_pearl" }],
      },
      { text: "สระมังกรดำนี่อันตรายเกินไป", next: "pool_heilong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_deep",
    lines: [
      { t: "narration", text: "เจ้าดำลงไปในน้ำดำที่เย็นจัด ก้นสระมีถ้ำเล็ก แสงสีน้ำเงินจางส่องออกมา" },
      { t: "narration", text: "ข้างใน... มีก้อนหินใส สีน้ำเงิน และ... ร่างที่ห่อด้วยชุดประมง" },
      { t: "narration", text: "ร่างนั้นยังคงรูปร่าง ดูเหมือนพิทักษ์อยู่กับหินใส" },
    ],
    choices: [
      {
        text: "หยิบหินใสและกลับขึ้นไป",
        next: "pool_heilong",
        effects: [
          { t: "giveItem", itemId: "jade", count: 1 },
          { t: "advanceQuest", questId: "qw_heilong_dragon_pearl" },
        ],
      },
      {
        text: "ทิ้งหินไว้ — นี่คือที่พักผ่อนของเขา",
        next: "qs_qw_heilong_dragon_pearl_leave",
        effects: [
          { t: "addTrait", trait: "good", amount: 5 },
          { t: "addTrait", trait: "humility", amount: 3 },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_leave",
    lines: [
      { t: "narration", text: "เจ้ากลับขึ้นมือเปล่า แต่ใจรู้สึกเบา" },
      { t: "narration", text: "ความลับของสระนี้จะอยู่กับคนที่ควรอยู่กับมัน" },
    ],
    choices: [
      {
        text: "กลับไปหาชาวประมง",
        next: "pool_heilong",
        effects: [{ t: "advanceQuest", questId: "qw_heilong_dragon_pearl" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_complete",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "เจ้ากลับมาแล้ว... เจ้าพบอะไรในนั้น?" },
    ],
    choices: [
      {
        text: "บอกเรื่องร่างที่ก้นสระ",
        next: "qs_qw_heilong_dragon_pearl_truth",
        effects: [{ t: "addTrait", trait: "good", amount: 3 }],
      },
      {
        text: "ไม่มีอะไรพิเศษ แค่หิน",
        next: "qs_qw_heilong_dragon_pearl_silent",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_truth",
    lines: [
      { t: "narration", text: "ชาวประมงนิ่งฟังเรื่องที่เจ้าเล่า น้ำตาไหลออกมาโดยที่เขาไม่รู้ตัว" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "นั่นคือลูกชายข้า... ข้ารู้แล้วว่าเขาอยู่ที่ไหน ขอบคุณ" },
    ],
    choices: [
      {
        text: "อยู่เป็นเพื่อนเขาสักพัก",
        next: "pool_heilong",
        effects: [
          { t: "finishQuest", questId: "qw_heilong_dragon_pearl", success: true },
          { t: "addNpcRelationship", npcId: "wld_heilong_fisherman_tan", amount: 20 },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_dragon_pearl_silent",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "ไม่มีอะไรหรอ... ก็ดี ก็ดี" },
      { t: "narration", text: "เขาหันหน้าไปมองสระอีกครั้ง สายตาของเขาไกลและเศร้า" },
    ],
    choices: [
      {
        text: "จากไป",
        next: "pool_heilong",
        effects: [
          { t: "finishQuest", questId: "qw_heilong_dragon_pearl", success: true },
        ],
      },
    ],
  },

  // ─── qw_heilong_missing_fisher ────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_heilong_missing_fisher_offer",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "ชาวประมงอีกคนจากหมู่บ้านหายไปเมื่อคืน ข้าคิดว่าเขาตกน้ำ" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "โจรสลัดมักหลบซ่อนแถวนี้ อาจจะลักพาตัวเขาไปก็ได้ ช่วยสืบดูหน่อย?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "pool_heilong",
        effects: [{ t: "startQuest", questId: "qw_heilong_missing_fisher" }],
      },
      { text: "ไม่ใช่ธุระข้า", next: "pool_heilong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_missing_fisher_found",
    lines: [
      { t: "narration", text: "เจ้าพบโจรสลัดสองคนกักขังชายชราอยู่หลังหิน" },
      { t: "dialogue", speaker: "โจรสลัด", text: "ไอ้พวกหน้าหนาว ไปก่อนเลยหรือไง!" },
    ],
    choices: [
      {
        text: "สู้กับโจรสลัดเพื่อปลดปล่อยชาวประมง",
        next: "qs_qw_heilong_missing_fisher_freed",
        effects: [
          { t: "triggerBattle", opponentId: "river_pirate", onWin: "qs_qw_heilong_missing_fisher_freed", onLose: "pool_heilong" },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_missing_fisher_freed",
    lines: [
      { t: "narration", text: "ชาวประมงแก่ถูกปลดปล่อย เขาคุกเข่าขอบคุณเจ้า" },
    ],
    choices: [
      {
        text: "พาเขากลับไปหาต่านเหลาตู",
        next: "pool_heilong",
        effects: [{ t: "advanceQuest", questId: "qw_heilong_missing_fisher" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_missing_fisher_complete",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "เจ้าพาเขากลับมาได้! ขอบคุณมากเลย" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "รับปลาและทองไป ข้าไม่มีอะไรมากกว่านี้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "pool_heilong",
        effects: [
          { t: "finishQuest", questId: "qw_heilong_missing_fisher", success: true },
        ],
      },
    ],
  },

  // ─── qw_heilong_depths_secret ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_heilong_depths_secret_offer",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "ชาวบ้านเล่าว่าเห็นแสงสีแดงออกมาจากสระทุกคืนเพ็ญ" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "ข้าอยากรู้จริง ๆ ว่าแสงนั้นคืออะไร แต่แก่เกินจะดำน้ำ เจ้าช่วยสืบได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "pool_heilong",
        effects: [{ t: "startQuest", questId: "qw_heilong_depths_secret" }],
      },
      { text: "สระมังกรดำไม่ใช่ที่ที่จะลงไปเล่น", next: "pool_heilong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_depths_secret_investigate",
    lines: [
      { t: "narration", text: "ในคืนเพ็ญ เจ้านั่งรอริมสระ แสงสีแดงค่อย ๆ โผล่จากใต้น้ำ" },
      { t: "narration", text: "เจ้าดำลงไปตาม พบว่าแสงมาจากแร่สีแดงที่เรืองแสงในน้ำเย็น — แร่เทพหายาก" },
    ],
    choices: [
      {
        text: "เก็บตัวอย่างกลับมา",
        next: "pool_heilong",
        effects: [
          { t: "giveItem", itemId: "mithril_ore", count: 1 },
          { t: "advanceQuest", questId: "qw_heilong_depths_secret" },
        ],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_heilong_depths_secret_complete",
    lines: [
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "แร่ที่เรืองแสง! ข้าไม่เคยเห็นอะไรแบบนี้มาก่อน" },
      { t: "dialogue", speaker: "ต่านเหลาตู", text: "รับทองไป ข้าจะเก็บแร่ชิ้นนี้ไว้เป็นที่ระลึกถึงสระนี้" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "pool_heilong",
        effects: [
          { t: "finishQuest", questId: "qw_heilong_depths_secret", success: true },
        ],
      },
    ],
  },

  // ─── qw_hong_treasure_map ─────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_hong_treasure_map_offer",
    lines: [
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "แผนที่นี้บอกว่าสมบัติของโฮ่งชีก๋งอยู่ในถ้ำหิมะ แต่เส้นทางผ่านป่าที่มีหมีสีน้ำตาลเต็มไปหมด" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "เจ้าพอสู้หมีได้ไหม? ถ้าช่วยเปิดทาง เราแบ่งสมบัติกันครึ่ง!" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "home_hong",
        effects: [{ t: "startQuest", questId: "qw_hong_treasure_map" }],
      },
      { text: "หมีสีน้ำตาลไม่ใช่ศัตรูที่อยากยุ่ง", next: "home_hong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_hong_treasure_map_battle",
    lines: [
      { t: "narration", text: "กลางป่าทึบ — หมีสีน้ำตาลตัวใหญ่ยืนขวางทางอยู่" },
    ],
    choices: [
      {
        text: "สู้กับหมี",
        next: "qs_qw_hong_treasure_map_clear",
        effects: [
          { t: "triggerBattle", opponentId: "brown_bear", onWin: "qs_qw_hong_treasure_map_clear", onLose: "home_hong" },
        ],
      },
      { text: "ถอยออกมา", next: "home_hong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_hong_treasure_map_clear",
    lines: [
      { t: "narration", text: "เส้นทางเปิดแล้ว เจ้าและหลัวเฟย์หาวเดินหน้าเข้าไปในถ้ำ" },
      { t: "narration", text: "ในถ้ำมีหีบเก่า ข้างในมีของที่เคยเป็นสมบัติแต่ตอนนี้เหลือแค่เหรียญเก่าและจดหมาย" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "มันไม่ได้ยิ่งใหญ่อย่างที่คิด... แต่จดหมายนี้..." },
    ],
    choices: [
      {
        text: "อ่านจดหมาย",
        next: "qs_qw_hong_treasure_map_letter",
        effects: [{ t: "advanceQuest", questId: "qw_hong_treasure_map" }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_hong_treasure_map_letter",
    lines: [
      { t: "narration", text: "จดหมายเขียนด้วยมือแก่ว่า: 'สมบัติที่แท้จริงคือวิชาที่ข้าสอน ไม่ใช่ทองหรือเงิน'" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "โฮ่งชีก๋ง... นี่มันปรัชญาหรือว่าเขาไม่มีทรัพย์สมบัติ?" },
    ],
    choices: [
      {
        text: "กลับไปรายงาน",
        next: "home_hong",
      },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_hong_treasure_map_complete",
    lines: [
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "สมบัติที่แท้จริงคือประสบการณ์นี้เองหรือเปล่า..." },
      { t: "narration", text: "หนุ่มนักผจญภัยหัวเราะและแบ่งเหรียญโบราณให้เจ้าครึ่งหนึ่ง" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "อย่างน้อยก็ได้เหรียญโบราณ รับไปเถิด" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "home_hong",
        effects: [
          { t: "finishQuest", questId: "qw_hong_treasure_map", success: true },
        ],
      },
    ],
  },

  // ─── qw_hong_beast_swarm ──────────────────────────────────────────────
  {
    kind: "dialog",
    id: "qs_qw_hong_beast_swarm_offer",
    lines: [
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "เมื่อคืนหมาป่าฝูงใหญ่เข้ามาใกล้บ้านโฮ่งชีก๋ง คนเฝ้าบ้านกลัวจนวิ่งหนีหมด" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "ช่วยปราบหมาป่าสักสามตัวเพื่อขู่ฝูงออกไปได้ไหม?" },
    ],
    choices: [
      {
        text: "รับภารกิจ",
        next: "home_hong",
        effects: [{ t: "startQuest", questId: "qw_hong_beast_swarm" }],
      },
      { text: "ไม่อยากยุ่งเรื่องสัตว์", next: "home_hong" },
    ],
  },
  {
    kind: "dialog",
    id: "qs_qw_hong_beast_swarm_complete",
    lines: [
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "ฝูงหมาป่าออกไปแล้ว! เจ้าเก่งมาก" },
      { t: "dialogue", speaker: "หลัวเฟย์หาว", text: "รับทองไป ข้าได้ทองจากเจ้าของบ้านมาบ้างแล้ว" },
    ],
    choices: [
      {
        text: "รับรางวัล",
        next: "home_hong",
        effects: [
          { t: "finishQuest", questId: "qw_hong_beast_swarm", success: true },
        ],
      },
    ],
  },
];
