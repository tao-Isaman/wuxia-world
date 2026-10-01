// Elders B — new quests for existing village / wilderness / temple people.
// No new NPCs: nine ยุทธจักร moves and arts are passed on by the old faces
// who fit them (a river fisherman's water sword, a Tibetan temple's
// dragon-elephant art, an ice-cave scholar's secret fire fist…), plus a few
// side quests for people who had little to do, two place activities and two
// place meetings. See lib/world/data/places/types.ts.
import type { DialogScene, QuestDef, SceneLine, Condition } from "../../types";
import type { ActivityDef } from "../activities";
import type { MeetEventDef } from "../random-events";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────
const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const narr = (text: string): SceneLine => ({ t: "narration", text });

/** Briefing scene shown right after accepting (startQuest is a no-op then). */
const offer = (questId: string, home: string, lines: SceneLine[], go = "รับปาก"): DialogScene => ({
  kind: "dialog",
  id: `qs_${questId}_offer`,
  lines,
  choices: [{ text: go, next: home, effects: [{ t: "startQuest", questId }] }],
});

/** Hand-in scene that closes the quest. */
const complete = (questId: string, home: string, lines: SceneLine[], go = "น้อมรับ"): DialogScene => ({
  kind: "dialog",
  id: `qs_${questId}_complete`,
  lines,
  choices: [{ text: go, next: home, effects: [{ t: "finishQuest", questId, success: true }] }],
});

/**
 * A friendly bout opened from an objective spot: intro → battle (non-fatal)
 * → the win scene advances the quest; a loss closes and the spot stays open.
 */
const bout = (
  questId: string,
  slug: string,
  home: string,
  opponentId: string,
  intro: SceneLine[],
  win: SceneLine[],
  lose: SceneLine[],
  fight = "ตั้งท่ารับมือ",
): DialogScene[] => [
  {
    kind: "dialog",
    id: `qd_${questId}_${slug}`,
    lines: intro,
    choices: [
      {
        text: fight,
        next: home,
        effects: [{ t: "triggerBattle", opponentId, onWin: `qd_${questId}_${slug}_win`, onLose: `qd_${questId}_${slug}_lose`, nonFatal: true }],
      },
      { text: "ขอเวลาเตรียมตัวก่อน", next: home },
    ],
  },
  {
    kind: "dialog",
    id: `qd_${questId}_${slug}_win`,
    lines: win,
    choices: [{ text: "ก้าวต่อไป", next: home, effects: [{ t: "advanceQuest", questId }] }],
  },
  { kind: "dialog", id: `qd_${questId}_${slug}_lose`, lines: lose },
];

const stat = (s: "STR" | "AGI" | "POW" | "VIT" | "DEX" | "LUK" | "DEF" | "INT", min: number): Condition => ({ t: "statAtLeast", stat: s, min });
const rel = (npcId: string, min: number): Condition => ({ t: "npcRelationship", npcId, min });
const all = (...c: Condition[]): Condition => ({ t: "and", all: c });

// ─── Givers (existing NPCs) ───────────────────────────────────────────
const DENG = "vil_wuxia_fisherman_deng";
const TAN = "wld_heilong_fisherman_tan";
const ABAO = "wld_miao_tribaleldr_abao";
const BAO = "vil_meihua_hunter_bao";
const WU = "vil_hengshan_elder_wu";
const LAO = "vil_qigu_farmer_lao";
const HUANG = "wld_taohua_hermit_huang";
const KONGXIN = "temple_dalun_monk_kongxin";
const WEI = "wld_bingcan_scholar_wei";
const XU = "wld_jinshe_beasttamer_xu";
const LIU = "jail_elder_prisoner";

// ─── Opponents (spars and one quest foe) ──────────────────────────────
const OPPONENTS: StoryOpponentSpec[] = [
  { id: "spar_hengshan_elder_wu", name: "ผู้อาวุโสอู๋", ti: 2, category: "human",
    look: { sheet: "elder" }, stats: { AGI: 8, DEX: 6, LUK: 4 },
    skillIds: ["nc4", "nd2", "ne4"], artId: "t2_craneform", artLevel: 5 },
  { id: "spar_qigu_farmer_lao", name: "ลาวหนาน", ti: 2, category: "human",
    look: { sheet: "elder", tint: 0xd8c8a8 }, stats: { STR: 8, VIT: 7, DEX: 3 },
    skillIds: ["basic_punch", "nd7", "na2"], artId: "t2_tigerroar", artLevel: 5 },
  { id: "spar_taohua_huang_waterstep", name: "ฮ่วงเอี้ยะซือ (สามส่วนฝีมือ)", ti: 2, category: "human",
    look: { sheet: "elder", tint: 0xc6e6ff }, stats: { POW: 8, AGI: 8, DEX: 4 },
    skillIds: ["ne5", "nd11", "qf"], artId: "t1_whitehorse", artLevel: 6 },
  { id: "qfoe_dalun_shadow_lama", name: "ลามะเงาไร้นาม", ti: 3, category: "human",
    look: { sheet: "monk", tint: 0x6a5a7a, size: 1.1 }, stats: { STR: 10, VIT: 8, DEF: 6 },
    skillIds: ["nm2", "nd7", "yyz"], artId: "t3_dragonelephant", artLevel: 4 },
  { id: "spar_dalun_kongxin", name: "พระกงซิน", ti: 3, category: "human",
    look: { sheet: "monk" }, stats: { VIT: 12, DEF: 8, STR: 8 },
    skillIds: ["ig", "nm2", "nd12"], artId: "t3_dragonelephant", artLevel: 7 },
  { id: "spar_bingcan_wei_firefist", name: "เว่ยชิงเหวิน (หมัดเพลิง)", ti: 3, category: "human",
    look: { sheet: "elder", tint: 0xffc8a0 }, stats: { STR: 10, AGI: 8, DEX: 4 },
    skillIds: ["nf5", "nd10", "ne7"], artId: "t2_tigerroar", artLevel: 7 },
];

// ═══════════════════════════════════════════════════════════════════════
// QUESTS
// ═══════════════════════════════════════════════════════════════════════
const QUESTS: QuestDef[] = [
  // ─── T0 · nc3 กระบี่น้ำ — เติ้งลองหาง (village_wuxia) ─────────────────
  {
    id: "qv_wuxia_river_sword",
    name: "กระบี่ที่เรียนจากกระแสน้ำ",
    description: "เติ้งลองหางชาวประมงแก่ไม่เคยถือกระบี่จริง แต่เขาฟันน้ำด้วยไม้พายมาทั้งชีวิตจนเกิดเป็นเพลงกระบี่สายน้ำ เขายอมสอนให้ถ้าเจ้าช่วยงานริมฝั่งสักครึ่งวัน",
    briefSummary: "ช่วยงานริมแม่น้ำหมู่บ้านอู่เสีย แล้วรับเพลงกระบี่น้ำจากเติ้งลองหาง",
    type: "side",
    giverNpcId: DENG,
    stages: [
      {
        id: "river_chores",
        description: "ช่วยลากแหและฝึกฟันกระแสน้ำริมแม่น้ำหมู่บ้านอู่เสีย",
        objective: {
          spots: [
            { locationId: "village_wuxia", label: "ช่วยลากแหขึ้นฝั่ง", text: "แหหนักอึ้งเพราะติดกระแสน้ำ เจ้าเรียนรู้ว่าต้องดึงตามน้ำ ไม่ใช่ฝืนน้ำ" },
            { locationId: "village_wuxia", label: "ฟันกระแสน้ำด้วยไม้พาย", text: "ไม้พายแหวกน้ำโดยไม่สาดกระเซ็น — ปราณไหลตามแรงน้ำได้แล้วหนึ่งครั้ง" },
          ],
        },
      },
      { id: "return", description: "กลับไปหาเติ้งลองหางที่ริมแม่น้ำ" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nc3" },
      { t: "gold", amount: 60 },
      { t: "npcRelationship", npcId: DENG, amount: 8 },
    ],
  },

  // ─── T0 · ns2 ขอเกี่ยวเบื้องต้น — ต่านเหลาตู (pool_heilong) ──────────
  {
    id: "qw_heilong_hook_lesson",
    name: "เบ็ดของคนแก่ริมสระ",
    description: "ต่านเหลาตูใช้ขอเกี่ยวตกปลามาทั้งชีวิต และใช้มันเกี่ยวงูที่มาขโมยปลาในข้องด้วย เขาว่าวิธีเกี่ยวงูกับวิธีเกี่ยวคนก็ไม่ต่างกันเท่าไร",
    briefSummary: "ไล่งูเล็ก 2 ตัวที่มาขโมยปลาของต่านเหลาตู",
    type: "side",
    giverNpcId: TAN,
    stages: [
      {
        id: "snakes",
        description: "ไล่งูเล็ก 2 ตัวที่ป้วนเปี้ยนแถวข้องปลา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "small_snake", count: 2 },
      },
      { id: "return", description: "กลับไปเล่าให้ต่านเหลาตูฟังที่ริมสระมังกรดำ" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ns2" },
      { t: "gold", amount: 80 },
      { t: "item", itemId: "fish_carp", count: 2 },
      { t: "npcRelationship", npcId: TAN, amount: 8 },
    ],
  },

  // ─── T1 · ig หมัดเกราะเพชร — อาเป้า (market_miao) ─────────────────────
  {
    id: "qw_miao_iron_skin_bath",
    name: "น้ำยาหนังเหล็กของเผ่าเมี่ยว",
    description: "นักรบเผ่าเมี่ยวแช่ร่างในน้ำยาสมุนไพรจนผิวหนังแข็งดั่งเปลือกไม้ แล้วจึงฝึกหมัดเกราะเพชร อาเป้ายอมต้มน้ำยาให้คนนอก — ถ้าคนนอกหาวัตถุดิบมาเอง",
    briefSummary: "หาสมุนไพร 3 หน่วยและหนังงู 1 ผืน แล้วแช่น้ำยาของเผ่าเมี่ยว",
    type: "side",
    giverNpcId: ABAO,
    prereqs: stat("VIT", 10),
    stages: [
      {
        id: "ingredients",
        description: "หาสมุนไพรหายาก 3 หน่วยและหนังงู 1 ผืนมาให้อาเป้า",
        autoAdvance: all({ t: "hasItem", itemId: "herb", count: 3 }, { t: "hasItem", itemId: "snake_skin", count: 1 }),
      },
      {
        id: "soak",
        description: "แช่ตัวในหม้อน้ำยาหนังเหล็กที่ตลาดเผ่าเมี่ยว",
        objective: {
          hours: 3,
          spots: [
            { locationId: "market_miao", label: "แช่หม้อน้ำยาหนังเหล็ก", text: "น้ำยาร้อนจนแสบไปถึงกระดูก แต่พอขึ้นจากหม้อ ผิวเจ้ารับหมัดได้แน่นขึ้นจริง ๆ" },
          ],
        },
      },
      { id: "return", description: "กลับไปให้อาเป้าดูผิวหนังที่ผ่านน้ำยาแล้ว" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ig" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: ABAO, amount: 10 },
    ],
  },

  // ─── T1 · nd4 ทวนลม — เปาเหล็กก้าน (village_meihua) ─────────────────
  {
    id: "qv_meihua_wind_spear",
    name: "ทวนของทหารเก่า",
    description: "เปาเหล็กก้านเคยเป็นพลทวนแนวหน้า โจรเส้นทางเริ่มดักปล้นคนเดินทางมาหมู่บ้านดอกเหมยอีกแล้ว เขาเลิกถือทวนไปนาน แต่ยินดีสอนทวนลมให้คนที่ไปจัดการแทน",
    briefSummary: "ปราบโจรเส้นทาง 3 คน และหาไม้เนื้อแข็ง 2 ท่อนมาทำด้ามทวน",
    type: "side",
    giverNpcId: BAO,
    prereqs: stat("STR", 10),
    stages: [
      {
        id: "bandits",
        description: "ปราบโจรเส้นทาง 3 คนที่ดักปล้นผู้คน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 3 },
      },
      {
        id: "shaft",
        description: "หาไม้เนื้อแข็ง 2 ท่อนมาให้เปาเหล็กก้านเหลาด้ามทวน",
        autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 2 },
      },
      { id: "return", description: "นำไม้กลับไปให้เปาเหล็กก้านที่หมู่บ้านดอกเหมย" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nd4" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: BAO, amount: 10 },
      { t: "trait", trait: "good", amount: 1 },
    ],
  },

  // ─── T2 · art t2_craneform กระเรียนสมาธิ — ผู้อาวุโสอู๋ (village_hengshan)
  {
    id: "qv_hengshan_crane_meditation",
    name: "ระบำกระเรียนของผู้เฒ่า",
    description: "ทุกเช้าผู้อาวุโสอู๋ยืนขาเดียวริมบ่อน้ำเหมือนนกกระเรียน ชาวบ้านคิดว่าท่านแค่บริหารร่างกาย แต่ที่จริงคือวิชากระเรียนสมาธิที่ท่านได้มาจากการเฝ้าดูกระเรียนรำตามจังหวะเพลง",
    briefSummary: "เฝ้าดูกระเรียนรำที่หุบเขาร้อยดอกไม้ แล้วรับมือท่ารำของผู้อาวุโสอู๋",
    type: "side",
    giverNpcId: WU,
    prereqs: all(stat("AGI", 15), rel(WU, 5)),
    stages: [
      {
        id: "watch_cranes",
        description: "ไปเฝ้าดูฝูงกระเรียนรำที่หุบเขาร้อยดอกไม้",
        objective: {
          hours: 2,
          spots: [
            { locationId: "valley_baihua", label: "เฝ้าดูกระเรียนรำ", text: "กระเรียนก้าวช้า ๆ แล้วกางปีกในจังหวะเดียวกับลม — เจ้าเริ่มได้ยิน 'เพลง' ที่ผู้อาวุโสอู๋พูดถึง" },
          ],
        },
      },
      {
        id: "crane_bout",
        description: "รับมือท่ารำกระเรียนของผู้อาวุโสอู๋ที่หมู่บ้านฮิงซาน",
        objective: {
          spots: [
            { locationId: "village_hengshan", npcId: WU, label: "รับมือท่ารำกระเรียน", sceneId: "qd_qv_hengshan_crane_meditation_bout" },
          ],
        },
      },
      { id: "return", description: "นั่งฟังคำสอนสุดท้ายของผู้อาวุโสอู๋" },
    ],
    rewards: [
      { t: "learnArt", artId: "t2_craneform", level: 1 },
      { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: WU, amount: 10 },
    ],
  },

  // ─── T2 · na2 หมัดมวยจีน — ลาวหนาน (village_qigu) ───────────────────
  {
    id: "qv_qigu_old_farmer_fist",
    name: "หมัดที่ซ่อนอยู่ใต้จอบ",
    description: "นักเลงฝ่ามือเหล็กคนหนึ่งเที่ยวรีดไถชาวไร่ ลาวหนานบ่นว่า 'สมัยก่อนพวกนี้ไม่กล้าเข้าหมู่บ้าน' แล้วก็เงียบไป ดูเหมือนชาวนาแก่ผู้นี้จะเคยเป็นมากกว่าชาวนา",
    briefSummary: "ปราบนักเลงฝ่ามือเหล็ก แล้วรับมือหมัดของลาวหนาน",
    type: "side",
    giverNpcId: LAO,
    prereqs: all(stat("STR", 15), rel(LAO, 5)),
    stages: [
      {
        id: "thug",
        description: "ปราบนักเลงฝ่ามือเหล็กที่รีดไถชาวบ้าน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "iron_palm_thug", count: 1 },
      },
      {
        id: "old_fist",
        description: "ลาวหนานอยากลองหมัดเจ้าด้วยตัวเองที่หมู่บ้านชีกู่",
        objective: {
          spots: [
            { locationId: "village_qigu", npcId: LAO, label: "ประลองหมัดกับลาวหนาน", sceneId: "qd_qv_qigu_old_farmer_fist_bout" },
          ],
        },
      },
      { id: "return", description: "ฟังเรื่องเก่าของลาวหนาน" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "na2" },
      { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: LAO, amount: 10 },
      { t: "trait", trait: "good", amount: 1 },
    ],
  },

  // ─── T2 · ne5 กระบี่วิ่งบนน้ำ — ฮ่วงเอี้ยะซือ (isle_taohua) ───────────
  {
    id: "qw_taohua_water_running_sword",
    name: "กระบี่วิ่งบนน้ำ",
    description: "ปรมาจารย์เกาะดอกท้อข้ามทะเลมาเกาะนี้โดยไม่ใช้เรือ — อย่างน้อยท่านก็เล่าแบบนั้น ท่านว่าเพลงกระบี่วิ่งบนน้ำเป็น 'ของเล่นเด็ก' ที่ท่านคิดขึ้นตอนเบื่อ และเบื่ออีกแล้ว จึงจะสอนใครสักคน",
    briefSummary: "ฝึกยืนบนหินเปียกยามน้ำลง แล้วรับกระบี่สามส่วนของฮ่วงเอี้ยะซือ",
    type: "side",
    giverNpcId: HUANG,
    prereqs: all(stat("POW", 15), rel(HUANG, 5)),
    stages: [
      {
        id: "wet_rocks",
        description: "ยืนกระบี่บนหินเปียกริมหาดเกาะดอกท้อจนน้ำขึ้น",
        objective: {
          hours: 3,
          spots: [
            { locationId: "isle_taohua", label: "ยืนกระบี่บนหินเปียกยามน้ำลง", text: "คลื่นซัดจนเกือบตกหลายครั้ง จนเจ้าเลิกยืนแล้วเริ่ม 'ไหล' ไปกับมัน — หินไม่ลื่นอีกเลย" },
          ],
        },
      },
      {
        id: "three_parts",
        description: "รับกระบี่สามส่วนฝีมือของฮ่วงเอี้ยะซือ",
        objective: {
          spots: [
            { locationId: "isle_taohua", npcId: HUANG, label: "รับกระบี่สามส่วนของปรมาจารย์", sceneId: "qd_qw_taohua_water_running_sword_bout" },
          ],
        },
      },
      { id: "return", description: "ฟังคำวิจารณ์ (ที่ไม่สุภาพนัก) ของฮ่วงเอี้ยะซือ" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ne5" },
      { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: HUANG, amount: 10 },
    ],
  },

  // ─── Side · พระกงซิน (temple_dalun) — gates the T3 art ──────────────
  {
    id: "qw_dalun_prayer_flags",
    name: "ธงมนตร์ที่ขาดวิ่น",
    description: "ลมภูเขาฉีกธงมนตร์รอบเจดีย์วัดตาหลุนจนขาดหมด พระกงซินอยากได้ผ้าไหมมาเย็บธงใหม่ และใครสักคนที่ไม่กลัวความสูงช่วยแขวน",
    briefSummary: "หาผ้าไหม 2 ผืนให้พระกงซิน แล้วแขวนธงมนตร์รอบเจดีย์",
    type: "side",
    giverNpcId: KONGXIN,
    stages: [
      {
        id: "silk",
        description: "หาผ้าไหม 2 ผืนมาให้พระกงซินเย็บธงมนตร์",
        autoAdvance: { t: "hasItem", itemId: "silk", count: 2 },
      },
      {
        id: "hang",
        description: "แขวนธงมนตร์ผืนใหม่รอบเจดีย์วัดตาหลุน",
        objective: {
          hours: 2,
          spots: [
            { locationId: "temple_dalun", label: "แขวนธงมนตร์รอบเจดีย์", text: "ธงห้าสีสะบัดรับลม เสียงสวดของพระในวัดดังขึ้นพร้อมกันราวกับนัดไว้" },
          ],
        },
      },
      { id: "return", description: "กลับไปแจ้งพระกงซินว่าธงแขวนเรียบร้อย" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "trait", trait: "humility", amount: 1 },
      { t: "npcRelationship", npcId: KONGXIN, amount: 10 },
    ],
  },

  // ─── T3 · art t3_dragonelephant มังกร-ช้างปัญญา — พระกงซิน ─────────
  {
    id: "qw_dalun_dragon_elephant",
    name: "จารึกใต้ฐานช้างศิลา",
    description: "ใต้ฐานรูปช้างศิลาหน้าวิหารวัดตาหลุน มีจารึกวิชามังกร-ช้างปัญญาที่พระกงซินเฝ้ามาทั้งชีวิต ท่านว่าถึงเวลาส่งต่อแล้ว — แต่ช่วงนี้มีเงาประหลาดวนเวียนรอบวิหารทุกคืน",
    briefSummary: "หาไม้ศักดิ์สิทธิ์และโสมเพื่อพิธีเปิดจารึก เฝ้าวิหารยามดึก แล้วรับการทดสอบจากพระกงซิน",
    type: "side",
    giverNpcId: KONGXIN,
    prereqs: all(stat("VIT", 25), rel(KONGXIN, 15), { t: "questStatus", questId: "qw_dalun_prayer_flags", status: "done" }),
    stages: [
      {
        id: "offerings",
        description: "หาไม้ศักดิ์สิทธิ์ 1 ท่อนและโสม 2 ราก สำหรับพิธีเปิดจารึก",
        autoAdvance: all({ t: "hasItem", itemId: "wood_sacred", count: 1 }, { t: "hasItem", itemId: "ginseng", count: 2 }),
      },
      {
        id: "vigil",
        description: "เฝ้าช้างศิลาหน้าวิหารวัดตาหลุนยามดึก",
        objective: {
          spots: [
            { locationId: "temple_dalun", label: "เฝ้าช้างศิลายามดึก", sceneId: "qd_qw_dalun_dragon_elephant_vigil" },
          ],
        },
      },
      {
        id: "trial",
        description: "รับการทดสอบหมัดช้างจากพระกงซิน",
        objective: {
          spots: [
            { locationId: "temple_dalun", npcId: KONGXIN, label: "รับการทดสอบของพระกงซิน", sceneId: "qd_qw_dalun_dragon_elephant_trial" },
          ],
        },
      },
      { id: "return", description: "นั่งสมาธิหน้าจารึกกับพระกงซิน" },
    ],
    rewards: [
      { t: "learnArt", artId: "t3_dragonelephant", level: 1 },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "npcRelationship", npcId: KONGXIN, amount: 15 },
    ],
  },

  // ─── T3 · nf5 หมัดเพลิง — เว่ยชิงเหวิน (cave_bingcan) ───────────────
  {
    id: "qw_bingcan_fire_fist",
    name: "ไฟที่ซ่อนในถ้ำน้ำแข็ง",
    description: "บัณฑิตเว่ยอยู่ในถ้ำน้ำแข็งมาหลายสิบปีโดยไม่เคยหนาวตาย ทั้งที่เตาไฟก็แทบไม่ติด ใครถามท่านก็ตอบว่า 'อ่านหนังสือแล้วใจอุ่น' — แต่ปีศาจหิมะที่เริ่มเข้ามาใกล้ถ้ำทำให้ท่านต้องเลิกปิดบัง",
    briefSummary: "ปราบปีศาจหิมะ หาเล็บเสือและไม้เนื้อแข็งให้บัณฑิตเว่ย แล้วรับหมัดเพลิงของท่าน",
    type: "side",
    giverNpcId: WEI,
    prereqs: all(stat("STR", 25), rel(WEI, 15), { t: "questStatus", questId: "qw_bingcan_ice_fever", status: "done" }),
    stages: [
      {
        id: "snow_demon",
        description: "ปราบปีศาจหิมะที่ป้วนเปี้ยนรอบถ้ำ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "snow_demon", count: 1 },
      },
      {
        id: "kindling",
        description: "หาเล็บเสือ 1 ชิ้นและไม้เนื้อแข็ง 3 ท่อนมาให้บัณฑิตเว่ย",
        autoAdvance: all({ t: "hasItem", itemId: "tiger_claw", count: 1 }, { t: "hasItem", itemId: "wood_hard", count: 3 }),
      },
      {
        id: "fire_bout",
        description: "รับหมัดเพลิงของบัณฑิตเว่ยในถ้ำน้ำแข็งไหม",
        objective: {
          spots: [
            { locationId: "cave_bingcan", npcId: WEI, label: "รับหมัดเพลิงของบัณฑิตเว่ย", sceneId: "qd_qw_bingcan_fire_fist_bout" },
          ],
        },
      },
      { id: "return", description: "ฟังเรื่องที่บัณฑิตเว่ยไม่เคยเล่าให้ใครฟัง" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nf5" },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "warrior_belt", count: 1 },
      { t: "npcRelationship", npcId: WEI, amount: 15 },
    ],
  },

  // ─── Side · ซวีเหลิงชิง (cave_jinshe) ─────────────────────────────────
  {
    id: "qw_jinshe_winter_feed",
    name: "งูหิวหน้าหนาว",
    description: "หน้าหนาวนี้หนูป่าหายากจนงูของซวีเหลิงชิงหิวโหย พวกมันเริ่มมองนางเหมือนมองอาหาร นางอยากได้เนื้อสดมาเลี้ยงพวกมันก่อนที่ใครจะโดนกัด",
    briefSummary: "หาเนื้อสด 3 ชิ้นมาเลี้ยงงูของซวีเหลิงชิง",
    type: "side",
    giverNpcId: XU,
    stages: [
      {
        id: "meat",
        description: "หาเนื้อสด 3 ชิ้นมาให้ซวีเหลิงชิง",
        autoAdvance: { t: "hasItem", itemId: "raw_meat", count: 3 },
      },
      { id: "return", description: "นำเนื้อสดไปให้ซวีเหลิงชิงที่หน้าถ้ำงูทอง" },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "viper_venom", count: 1 },
      { t: "npcRelationship", npcId: XU, amount: 10 },
    ],
  },

  // ─── Side · ตาเฒ่าหลิวนักโทษ (jail) → ลาวหนาน (village_qigu) ──────────
  {
    id: "qw_jail_old_liu_letter",
    name: "จดหมายจากหลังลูกกรง",
    description: "ตาเฒ่าหลิวติดคุกมาสามสิบปีเพราะต่อยนักเลงตายเพื่อปกป้องน้องชาย เขาเขียนจดหมายถึงน้องชายที่เป็นชาวนาอยู่หมู่บ้านชีกู่ทุกปีแต่ไม่เคยส่งออกไปได้",
    briefSummary: "นำจดหมายของตาเฒ่าหลิวไปให้ลาวหนานที่หมู่บ้านชีกู่",
    type: "side",
    giverNpcId: LIU,
    turnInNpcId: LAO,
    stages: [
      { id: "deliver", description: "นำจดหมายของตาเฒ่าหลิวไปให้ลาวหนานที่หมู่บ้านชีกู่" },
    ],
    rewards: [
      { t: "gold", amount: 60 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: LAO, amount: 5 },
      { t: "npcRelationship", npcId: LIU, amount: 10 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// SCENES
// ═══════════════════════════════════════════════════════════════════════
const SCENES: DialogScene[] = [
  // ─── qv_wuxia_river_sword ───────────────────────────────────────────
  offer("qv_wuxia_river_sword", "village_wuxia", [
    narr("เติ้งลองหางยกไม้พายขึ้น แล้วฟาดลงผิวน้ำเบา ๆ น้ำแยกเป็นทางตรงยาวราวสามวาโดยไม่กระเซ็นสักหยด"),
    say("เติ้งลองหาง", "เห็นไหม ข้าไม่เคยจับกระบี่จริงสักเล่ม แต่พายเรือมาห้าสิบปี มือมันรู้เองว่าน้ำอยากไปทางไหน"),
    say("เติ้งลองหาง", "มีจอมยุทธ์ผ่านมาคนหนึ่งเห็นเข้า เขาตั้งชื่อให้ว่า 'กระบี่น้ำ' ข้าว่าชื่อเท่เกินคนพายเรือไปหน่อย"),
    say("เติ้งลองหาง", "อยากเรียนก็ได้ แต่ข้าไม่สอนฟรี ไปช่วยลากแหกับฟันน้ำตามที่ข้าบอกสักหน่อย ร่างกายจะจำเองว่าน้ำหนักแค่ไหน"),
    say("เติ้งลองหาง", "ถ้าตกน้ำก็อย่าโทษข้านะ ข้าเตือนแล้ว"),
  ], "รับไม้พายมา"),
  complete("qv_wuxia_river_sword", "village_wuxia", [
    say("เติ้งลองหาง", "ฮ่า ๆ แหไม่ขาด ตัวเจ้าก็ไม่เปียก แปลว่าเข้าใจแล้วครึ่งหนึ่ง"),
    say("เติ้งลองหาง", "อีกครึ่งคือ อย่าฟันให้น้ำแพ้ ฟันให้น้ำพาไป ปราณภายในก็เหมือนกัน"),
    narr("ชาวประมงแก่จับมือเจ้าวาดเส้นสามเส้นในอากาศ ช้า ๆ ราวกับกำลังพายเรือข้ามคลื่น"),
    say("เติ้งลองหาง", "เอาเงินค่าแรงไปด้วย ข้าไม่ชอบติดหนี้ใคร แม้แต่ลูกศิษย์"),
  ]),

  // ─── qw_heilong_hook_lesson ─────────────────────────────────────────
  offer("qw_heilong_hook_lesson", "pool_heilong", [
    say("ต่านเหลาตู", "เจ้าเห็นข้องปลาข้าไหม? เมื่อคืนมีปลาสิบตัว เช้านี้เหลือสาม"),
    say("ต่านเหลาตู", "ไม่ใช่ขโมยหรอก งูเล็กมันเลื้อยมาจากพงหญ้า กินแล้วยังหัวเราะเยาะข้าอีก — ข้าได้ยินจริง ๆ นะ"),
    narr("ชายชราชูขอเกี่ยวเหล็กที่ผูกเชือกยาวขึ้นมา ปลายมันวาววับ"),
    say("ต่านเหลาตู", "ไล่มันไปสักสองตัว เดี๋ยวข้าสอนวิธีสะบัดขอเกี่ยวให้ ตีทีเดียวได้สองที เกี่ยวปลาก็ได้ เกี่ยวงูก็ได้"),
  ], "ไปไล่งูให้"),
  complete("qw_heilong_hook_lesson", "pool_heilong", [
    say("ต่านเหลาตู", "เงียบไปแล้ว ไม่มีเสียงหัวเราะเยาะอีก ดี ๆ"),
    narr("ต่านเหลาตูสะบัดขอเกี่ยวออกไปครั้งเดียว ปลายเหล็กแตะใบบัวสองใบที่อยู่ห่างกันก่อนกลับเข้ามือ"),
    say("ต่านเหลาตู", "ข้อมือ ไม่ใช่แขน สะบัดออกด้วยข้อมือ ดึงกลับด้วยใจ — ที่เหลือฝึกเอาเอง"),
    say("ต่านเหลาตู", "เอาปลาไปด้วยสองตัว ตัวที่งูไม่ได้กิน"),
  ]),

  // ─── qw_miao_iron_skin_bath ─────────────────────────────────────────
  offer("qw_miao_iron_skin_bath", "market_miao", [
    say("อาเป้า", "คนนอกมักคิดว่านักรบเมี่ยวหนังหนาเพราะเกิดมาอย่างนั้น ผิด"),
    say("อาเป้า", "เด็กหนุ่มเมี่ยวทุกคนต้องแช่น้ำยาสมุนไพรเจ็ดคืน ผิวจึงแข็งพอจะฝึกหมัดเกราะเพชร — หมัดที่ใช้รับมากกว่าตี"),
    say("อาเป้า", "ข้าไม่เคยต้มให้คนนอก แต่เจ้าช่วยเผ่าเรามาบ้าง... เอาเถอะ"),
    say("อาเป้า", "หาสมุนไพรหายากสามหน่วย หนังงูหนึ่งผืน ไม่ต้องเป็นงูของซวีเหลิงชิงนะ นางจะเอาเรื่องเจ้าแน่"),
    narr("ผู้อาวุโสพูดหน้าตาย แต่มุมปากกระตุกนิดหนึ่ง"),
  ]),
  complete("qw_miao_iron_skin_bath", "market_miao", [
    narr("อาเป้าเอานิ้วจิ้มแขนเจ้าแรง ๆ สามที แล้วพยักหน้า"),
    say("อาเป้า", "แข็งพอแล้ว ต่อไปนี้ยามถูกตี อย่าหนี ตั้งหมัดขึ้นรับ ปล่อยให้เกราะทำงาน"),
    say("อาเป้า", "หมัดเกราะเพชรไม่ได้ทำให้เจ้าไม่เจ็บ มันแค่ทำให้เจ้าเจ็บช้ากว่าศัตรู"),
    say("อาเป้า", "เงินนี่ค่าสมุนไพรที่เหลือ ข้าไม่เอาเปรียบคนที่ทนแช่หม้อนั้นได้"),
  ]),

  // ─── qv_meihua_wind_spear ───────────────────────────────────────────
  offer("qv_meihua_wind_spear", "village_meihua", [
    say("เปาเหล็กก้าน", "ได้ยินไหม โจรเส้นทางกลับมาดักปล้นที่ทางเข้าหมู่บ้านอีกแล้ว"),
    say("เปาเหล็กก้าน", "สมัยอยู่กองทัพ ข้าถือทวนแนวหน้า ทวนลม — แทงเร็วจนข้าศึกหลบไม่ทัน แล้วก็หลบอะไรไม่ได้อีกพักใหญ่"),
    narr("เขามองมือตัวเองที่มีแผลเป็นเต็มไปหมด แล้วหัวเราะแห้ง ๆ"),
    say("เปาเหล็กก้าน", "ข้าสาบานว่าจะไม่ถือทวนอีก แต่ไม่ได้สาบานว่าจะไม่สอน ไปจัดการโจรสามคน แล้วหาไม้เนื้อแข็งมาสองท่อน ข้าจะเหลาด้ามให้เจ้า"),
  ]),
  complete("qv_meihua_wind_spear", "village_meihua", [
    narr("เปาเหล็กก้านเหลาไม้จนเป็นด้ามทวนตรงเป๊ะ แล้วยื่นให้เจ้าสองมือแบบที่ทหารยื่นอาวุธให้กัน"),
    say("เปาเหล็กก้าน", "ทวนลมไม่ได้อยู่ที่แขน อยู่ที่สะโพก บิดสะโพก ปล่อยปลายทวนเหมือนลมผลักประตู"),
    say("เปาเหล็กก้าน", "แทงแล้วถอยทันที ให้มันมองตามปลายทวนจนตาลาย นั่นแหละที่มันหลบเจ้าไม่ได้"),
    say("เปาเหล็กก้าน", "ทางเข้าหมู่บ้านปลอดภัยแล้ว รับเงินจากชาวบ้านไปเถอะ พวกเขาเรี่ยไรกันมา"),
  ]),

  // ─── qv_hengshan_crane_meditation ───────────────────────────────────
  offer("qv_hengshan_crane_meditation", "village_hengshan", [
    say("ผู้อาวุโสอู๋", "เจ้าเห็นข้ายืนขาเดียวทุกเช้าใช่ไหม ชาวบ้านคิดว่าคนแก่ปวดเข่า"),
    say("ผู้อาวุโสอู๋", "สมัยหนุ่ม ข้าไปเป่าขลุ่ยที่หุบเขาร้อยดอกไม้ กระเรียนฝูงหนึ่งรำตามเพลงข้า... หรือข้าเป่าตามท่ารำของมัน ข้าก็ไม่แน่ใจ"),
    say("ผู้อาวุโสอู๋", "จากวันนั้น ลมหายใจกับก้าวเท้าของข้าก็เป็นจังหวะเดียวกัน นั่นคือกระเรียนสมาธิ"),
    say("ผู้อาวุโสอู๋", "ไปดูกระเรียนรำที่หุบเขาร้อยดอกไม้ก่อน อย่าดูท่า ฟังจังหวะ"),
    say("ผู้อาวุโสอู๋", "แล้วกลับมารับมือข้าสักกระบวน อย่ากังวล ข้าแก่แล้ว... แต่ข้ายังไม่ช้านะ"),
  ]),
  ...bout("qv_hengshan_crane_meditation", "bout", "village_hengshan", "spar_hengshan_elder_wu",
    [
      narr("ผู้อาวุโสอู๋วางขลุ่ยลง ยกเท้าข้างหนึ่งขึ้นช้า ๆ กางแขนเหมือนปีก"),
      say("ผู้อาวุโสอู๋", "ฟังจังหวะข้าให้ดี ถ้าเจ้าได้ยิน เจ้าจะเห็นก่อนข้าขยับ"),
    ],
    [
      say("ผู้อาวุโสอู๋", "ดี! ครั้งสุดท้ายเจ้าก้าวก่อนข้าครึ่งจังหวะ นั่นแหละที่ข้าอยากเห็น"),
      narr("ชายชราหอบนิด ๆ แต่ยิ้มกว้างอย่างที่ไม่ได้ยิ้มมานาน"),
    ],
    [
      say("ผู้อาวุโสอู๋", "เจ้ายังดูท่า ไม่ได้ฟังเพลง ไปพักก่อน แล้วค่อยมาใหม่"),
    ]),
  complete("qv_hengshan_crane_meditation", "village_hengshan", [
    say("ผู้อาวุโสอู๋", "นั่งลง หายใจเข้าสี่จังหวะ ค้างสอง ออกหก แล้วยกเท้าขึ้นตอนหายใจออก"),
    narr("เจ้าทำตาม และรู้สึกว่าร่างเบาลงอย่างประหลาด ราวกับลมช่วยพยุง"),
    say("ผู้อาวุโสอู๋", "กระเรียนสมาธิไม่ได้ทำให้เจ้าบินได้ แต่ทำให้ศัตรูตีโดนแต่ขนนก"),
    say("ผู้อาวุโสอู๋", "เวลาไม่รู้จะทำอะไร ก็มาเป่าขลุ่ยให้คนแก่ฟังบ้าง"),
  ], "คารวะผู้อาวุโส"),

  // ─── qv_qigu_old_farmer_fist ────────────────────────────────────────
  offer("qv_qigu_old_farmer_fist", "village_qigu", [
    say("ลาวหนาน", "นักเลงฝ่ามือเหล็กนั่นมาเก็บ 'ค่าคุ้มครอง' จากชาวไร่อีกแล้ว คุ้มครองจากใคร? จากตัวมันเองน่ะสิ"),
    say("ลาวหนาน", "สมัยก่อน พวกนี้ไม่กล้าเหยียบหมู่บ้านชีกู่หรอก เพราะ..."),
    narr("ชาวนาแก่หยุดพูดกลางประโยค มือที่กำด้ามจอบขาวซีด"),
    say("ลาวหนาน", "ช่างมันเถอะ เจ้าไปจัดการมันให้ที แล้วกลับมาหาข้า ข้าอยากเห็นว่าหมัดเจ้าหนักแค่ไหน"),
  ]),
  ...bout("qv_qigu_old_farmer_fist", "bout", "village_qigu", "spar_qigu_farmer_lao",
    [
      narr("ลาวหนานพับแขนเสื้อขึ้น เผยแขนที่เต็มไปด้วยกล้ามเนื้อแน่นแบบที่ชาวนาธรรมดาไม่มี"),
      say("ลาวหนาน", "ข้าสาบานกับพี่ชายว่าจะไม่ใช้หมัดนี้อีก... แต่สอนคนอื่นคงไม่ผิดคำสาบาน มาเถอะ"),
    ],
    [
      say("ลาวหนาน", "หมัดหนัก แต่ยังไม่นิ่ง หมัดมวยจีนต้องตีแล้วหายใจคืน เจ็บไม่ต้องหาหมอ"),
      narr("ลาวหนานนั่งลงบนคันนา เหงื่อซึม แต่ดวงตาเป็นประกายอย่างคนที่ได้เจอเพื่อนเก่า"),
    ],
    [
      say("ลาวหนาน", "ฮึ จอบข้ายังตีแรงกว่านี้ ไปพักแล้วค่อยกลับมา"),
    ]),
  complete("qv_qigu_old_farmer_fist", "village_qigu", [
    say("ลาวหนาน", "สามสิบปีก่อน มีนักเลงจะฉุดเมียข้า พี่ชายข้าใช้หมัดตระกูลนี้ต่อยมันตายคาที่"),
    say("ลาวหนาน", "ทางการจับพี่ข้าไป ข้าเลยสาบานว่าจะไม่ใช้หมัดนี้ ให้มันตายไปกับข้า"),
    say("ลาวหนาน", "แต่วันนี้ข้าคิดได้ หมัดไม่ผิด คนใช้ต่างหาก เจ้าเอาไปใช้ปกป้องคนแทนพวกเราก็แล้วกัน"),
    narr("เขาสอนท่าตั้งหมัด ลมหายใจ และการคืนลมหลังตีให้เจ้าจนตะวันตกดิน"),
    say("ลาวหนาน", "ถ้าเจ้าเจอชายแก่แซ่หลิวที่ไหน... ช่างเถอะ คงไม่เจอหรอก"),
  ]),

  // ─── qw_taohua_water_running_sword ──────────────────────────────────
  offer("qw_taohua_water_running_sword", "isle_taohua", [
    say("ฮ่วงเอี้ยะซือ", "เจ้ารู้ไหมว่าข้ามาเกาะนี้ยังไง? วิ่งมา บนน้ำ ไม่ต้องทำหน้าแบบนั้น"),
    say("ฮ่วงเอี้ยะซือ", "เพลงกระบี่วิ่งบนน้ำ ข้าคิดขึ้นตอนเบื่อ ใช้เวลาครึ่งชั่วยาม คนในยุทธจักรฝึกสิบปียังไม่ได้ครึ่งของข้า น่าขัน"),
    say("ฮ่วงเอี้ยะซือ", "ตอนนี้ข้าเบื่ออีก จะสอนเจ้าก็ได้ ถ้าเจ้าไม่โง่เกินไป"),
    say("ฮ่วงเอี้ยะซือ", "ไปยืนกระบี่บนหินริมหาดตอนน้ำลง ยืนจนน้ำขึ้น ถ้าตกน้ำก็ว่ายกลับมา ข้าไม่ช่วย"),
    say("ฮ่วงเอี้ยะซือ", "แล้วค่อยมารับกระบี่ข้า สามส่วน ข้าใช้สามส่วนก็พอ"),
  ], "ไม่โง่ขนาดนั้นหรอก"),
  ...bout("qw_taohua_water_running_sword", "bout", "isle_taohua", "spar_taohua_huang_waterstep",
    [
      narr("ฮ่วงเอี้ยะซือหักกิ่งท้อกิ่งหนึ่งแทนกระบี่ ดอกท้อสั่นไหวแต่ไม่ร่วงสักกลีบ"),
      say("ฮ่วงเอี้ยะซือ", "สามส่วน ถ้าเจ้าทำดอกบนกิ่งนี้ร่วงได้สักดอก ถือว่าผ่าน"),
    ],
    [
      narr("กลีบท้อกลีบหนึ่งปลิวลงพื้น ฮ่วงเอี้ยะซือมองมันอยู่นาน"),
      say("ฮ่วงเอี้ยะซือ", "...ลมพัดหรอก แต่ช่างเถอะ ข้าใจดีวันนี้"),
    ],
    [
      say("ฮ่วงเอี้ยะซือ", "สามส่วนก็ยังมากเกินไปสำหรับเจ้า กลับไปยืนบนหินใหม่ไป"),
    ]),
  complete("qw_taohua_water_running_sword", "isle_taohua", [
    say("ฮ่วงเอี้ยะซือ", "ฟัง ข้าพูดครั้งเดียว กระบี่วิ่งบนน้ำไม่ใช่เหยียบน้ำ แต่เหยียบ 'จังหวะ' ของน้ำ"),
    say("ฮ่วงเอี้ยะซือ", "ปราณลงปลายเท้า ปลายกระบี่ชี้ทางที่คลื่นจะไป ศัตรูจะรู้สึกเหมือนยืนบนเรือโคลง"),
    narr("ปรมาจารย์ร่ายกระบี่หนึ่งกระบวนให้ดู เร็วจนเจ้าเห็นแค่ประกายสะท้อนแสงทะเล"),
    say("ฮ่วงเอี้ยะซือ", "จำได้แค่ไหนก็แค่นั้น ไปได้แล้ว อย่ามาเรียกข้าว่าอาจารย์ ข้าไม่มีลูกศิษย์ที่ช้าขนาดนี้"),
    narr("แต่ก่อนเจ้าจะพ้นป่าท้อ เจ้าได้ยินเสียงขลุ่ยเพลงส่งแขกดังตามมาเบา ๆ"),
  ], "คารวะแล้วลาไป"),

  // ─── qw_dalun_prayer_flags ──────────────────────────────────────────
  offer("qw_dalun_prayer_flags", "temple_dalun", [
    say("พระกงซิน", "อมิตาภพุทธ ลมภูเขาปีนี้แรงนัก ธงมนตร์รอบเจดีย์ขาดจนเหลือแต่เชือก"),
    say("พระกงซิน", "ธงแต่ละผืนพาคำสวดไปกับลม ธงขาด คำสวดก็ไปไม่ถึงไหน"),
    say("พระกงซิน", "อาตมาเย็บเองได้ ขาดแต่ผ้าไหมสองผืน และขาอีกคู่ที่ปีนเจดีย์ได้โดยไม่ตกลงมา"),
    narr("พระรูปนั้นมองขาตัวเองแล้วยิ้มอย่างรู้ตัว"),
  ], "รับธุระ"),
  complete("qw_dalun_prayer_flags", "temple_dalun", [
    say("พระกงซิน", "ได้ยินไหม เสียงธงกระทบลมนั่น ฟังเหมือนคนหลายร้อยสวดพร้อมกัน"),
    say("พระกงซิน", "เจ้าทำงานโดยไม่บ่นสักคำ อาตมาจดจำไว้"),
    say("พระกงซิน", "ปัจจัยนี่ไม่มาก ถือเป็นค่าเหนื่อยเถิด"),
  ]),

  // ─── qw_dalun_dragon_elephant ───────────────────────────────────────
  offer("qw_dalun_dragon_elephant", "temple_dalun", [
    say("พระกงซิน", "ใต้ฐานช้างศิลาหน้าวิหาร มีจารึกวิชามังกร-ช้างปัญญา อาตมาเฝ้ามันมาสี่สิบปี"),
    say("พระกงซิน", "มังกรคือปัญญาที่ไหลไม่หยุด ช้างคือกำลังที่ไม่หวั่นไหว คนที่มีแต่ช้างจะกลายเป็นมาร คนที่มีแต่มังกรจะลอยไปไม่กลับ"),
    say("พระกงซิน", "อาตมาแก่แล้ว ควรส่งต่อให้คนที่แขวนธงโดยไม่ถามว่าได้อะไร"),
    say("พระกงซิน", "หาไม้ศักดิ์สิทธิ์หนึ่งท่อนกับโสมสองรากมาสำหรับพิธีเปิดจารึก"),
    say("พระกงซิน", "แล้ว... ช่วงนี้มีเงาประหลาดวนเวียนรอบวิหารทุกคืน คืนพิธี ช่วยเฝ้าช้างศิลาด้วยเถิด"),
  ]),
  {
    kind: "dialog",
    id: "qd_qw_dalun_dragon_elephant_vigil",
    paged: true,
    lines: [
      narr("ดึกสงัด ตะเกียงเนยหน้าวิหารไหววูบ เงาร่างสูงในจีวรสีหม่นย่องเข้ามาที่ช้างศิลา"),
      narr("มันวางมือบนฐานจารึก แล้วตบลงทีเดียว ศิลาร้าวเป็นทางยาว"),
      say("ลามะเงาไร้นาม", "สี่สิบปี... กงซิน เจ้าเฝ้ามันสี่สิบปี ข้าก็รอมันสี่สิบปีเหมือนกัน"),
      say("ลามะเงาไร้นาม", "อาจารย์ยกวิชานี้ให้เจ้า ทั้งที่ข้าแข็งแกร่งกว่า ทั้งที่ข้าเป็นศิษย์พี่!"),
      narr("ไม่ใช่ขโมย — เป็นศิษย์พี่ของพระกงซินเอง ผู้ที่ถูกขับออกจากวัดเพราะฝึกแต่ 'ช้าง' จนลืม 'มังกร'"),
      say("ลามะเงาไร้นาม", "คนนอกอย่างเจ้า หลีกไป ไม่อย่างนั้นข้าจะเหยียบเจ้าเหมือนเหยียบมด"),
    ],
    choices: [
      {
        text: "ยืนขวางหน้าช้างศิลา",
        next: "temple_dalun",
        effects: [{ t: "triggerBattle", opponentId: "qfoe_dalun_shadow_lama", onWin: "qd_qw_dalun_dragon_elephant_vigil_win", onLose: "qd_qw_dalun_dragon_elephant_vigil_lose", nonFatal: true }],
      },
      { text: "ถอยไปตั้งหลักก่อน", next: "temple_dalun" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qw_dalun_dragon_elephant_vigil_win",
    lines: [
      narr("ลามะเงาทรุดลงข้างฐานศิลา หอบหายใจ มองมือตัวเองที่สั่นอยู่"),
      say("ลามะเงาไร้นาม", "กำลังของข้ามากกว่าเจ้าสามเท่า... ทำไม"),
      say("พระกงซิน", "เพราะเจ้าเหลือแต่ช้าง ศิษย์พี่ ไม่มีมังกรนำทาง ช้างก็เดินตกเหว"),
      narr("พระกงซินเดินออกมาจากเงามืด ท่านอยู่ตรงนั้นมาตลอด ลามะเงาก้มหน้า แล้วหายเข้าไปในความมืดโดยไม่พูดอะไรอีก"),
      say("พระกงซิน", "เขาจะกลับมาหรือไม่ ก็แล้วแต่ใจเขา ส่วนเจ้า พรุ่งนี้มาหาอาตมา ยังมีบททดสอบสุดท้าย"),
    ],
    choices: [{ text: "ก้าวต่อไป", next: "temple_dalun", effects: [{ t: "advanceQuest", questId: "qw_dalun_dragon_elephant" }] }],
  },
  {
    kind: "dialog",
    id: "qd_qw_dalun_dragon_elephant_vigil_lose",
    lines: [
      narr("ลามะเงาผลักเจ้าล้มกลิ้ง แต่ก่อนมันจะตบศิลาอีกครั้ง เสียงระฆังวัดดังขึ้น มันหายไปในความมืด"),
      say("พระกงซิน", "ไม่เป็นไร เขาจะกลับมาอีก คืนหน้าลองเฝ้าใหม่เถิด"),
    ],
  },
  ...bout("qw_dalun_dragon_elephant", "trial", "temple_dalun", "spar_dalun_kongxin",
    [
      say("พระกงซิน", "ศิษย์พี่ของอาตมาแข็งแกร่งกว่าอาตมาเสมอ เขาไม่เคยเข้าใจว่าทำไมอาจารย์เลือกอาตมา"),
      say("พระกงซิน", "บททดสอบนี้ไม่ใช่ให้ชนะ แต่ให้ยืนรับกำลังช้างของอาตมาโดยใจไม่หวั่น ตั้งหลักเถิด"),
      narr("พระรูปเล็กผอมหายใจเข้าครั้งเดียว ร่างทั้งร่างดูหนักขึ้นราวกับขุนเขา"),
    ],
    [
      say("พระกงซิน", "ดี เจ้ารับได้ทั้งที่กลัว นั่นคือช้าง และเจ้ารู้ว่าเมื่อไรควรหลบ นั่นคือมังกร"),
      narr("ท่านประนมมือ เหงื่อไหลอาบใบหน้า แต่ยิ้มอย่างโล่งใจ"),
    ],
    [
      say("พระกงซิน", "ใจเจ้ายังหวั่น ไปนั่งสมาธิหน้าช้างศิลาสักคืน แล้วค่อยมาใหม่"),
    ], "ยืนรับกำลังช้าง"),
  complete("qw_dalun_dragon_elephant", "temple_dalun", [
    narr("พระกงซินจุดไม้ศักดิ์สิทธิ์ ควันหอมลอยวนรอบช้างศิลา ตัวอักษรใต้ฐานเรืองแสงจาง ๆ ใต้แสงตะเกียง"),
    say("พระกงซิน", "อ่านด้วยใจ ไม่ใช่ด้วยตา หายใจตามจังหวะที่อาตมานับ"),
    narr("เจ้านั่งอยู่จนรุ่งสาง เมื่อลืมตา ร่างกายหนักแน่นแต่ใจเบาอย่างประหลาด"),
    say("พระกงซิน", "ยามถูกตี วิชานี้จะฟื้นเจ้าเหมือนช้างที่ลุกขึ้นหลังพายุ ยามตี มันจะทะลุเกราะเหมือนช้างเหยียบประตูเมือง"),
    say("พระกงซิน", "หยกนี้เป็นของศิษย์พี่ ถ้าวันหนึ่งเจอเขาอีก... ฝากบอกว่าศิษย์น้องยังรอ"),
  ], "รับวิชาด้วยความเคารพ"),

  // ─── qw_bingcan_fire_fist ───────────────────────────────────────────
  offer("qw_bingcan_fire_fist", "cave_bingcan", [
    say("เว่ยชิงเหวิน", "ปีศาจหิมะตัวหนึ่งมาป้วนเปี้ยนหน้าถ้ำทุกคืน มันดูดความร้อนจากเตาข้าจนดับ"),
    say("เว่ยชิงเหวิน", "เจ้าคงสงสัยมานานว่าบัณฑิตแก่ ๆ อยู่ในถ้ำน้ำแข็งได้ยังไงโดยไม่หนาวตาย"),
    narr("บัณฑิตวางพู่กันลง แล้วกำมือ ไอร้อนพวยพุ่งจากกำปั้นจนน้ำแข็งบนโต๊ะละลายเป็นวง"),
    say("เว่ยชิงเหวิน", "ไปจัดการปีศาจหิมะนั่น แล้วหาเล็บเสือกับไม้เนื้อแข็งมาให้ข้าก่อไฟ ข้าจะเล่าเรื่องที่ไม่เคยเล่าให้ใครฟัง"),
  ]),
  ...bout("qw_bingcan_fire_fist", "bout", "cave_bingcan", "spar_bingcan_wei_firefist",
    [
      narr("ไฟในเตาลุกโชนจากไม้ที่เจ้านำมา บัณฑิตเว่ยถอดเสื้อคลุมบัณฑิตออก ใต้นั้นคือแผลไฟไหม้เก่าเต็มแผ่นหลัง"),
      say("เว่ยชิงเหวิน", "สี่สิบปีก่อน ข้าไม่ใช่บัณฑิต ข้าคือ 'หมัดเพลิงแห่งลั่วหยาง' นักเลงที่ไม่มีใครกล้าต่อกร"),
      say("เว่ยชิงเหวิน", "คืนหนึ่งข้าโกรธจนเผาโรงเตี๊ยมทั้งหลัง มีเด็กติดอยู่ข้างใน ข้าช่วยออกมาได้ แต่หลังข้าเป็นอย่างนี้"),
      say("เว่ยชิงเหวิน", "ข้าหนีมาอยู่ถ้ำน้ำแข็ง ให้ความเย็นกดไฟในใจ อ่านหนังสือให้ใจเย็น... สี่สิบปี ไฟก็ยังไม่ดับ"),
      say("เว่ยชิงเหวิน", "รับหมัดข้าให้ได้ ถ้าเจ้าไม่ไหม้ ข้าจะยกไฟนี้ให้เจ้าดูแลต่อ"),
    ],
    [
      narr("หมัดสุดท้ายของบัณฑิตเว่ยหยุดห่างจากหน้าเจ้าเพียงคืบ ไอร้อนทำให้ผมเจ้าไหวแต่ไม่ไหม้"),
      say("เว่ยชิงเหวิน", "เจ้าไม่หนี และไม่โกรธตอบ... ดี หมัดเพลิงต้องอยู่ในมือคนที่ใจเย็นกว่าข้า"),
    ],
    [
      say("เว่ยชิงเหวิน", "ร้อนเกินไปสำหรับเจ้า ไปทำใจให้เย็นก่อนแล้วค่อยมา — นั่นเป็นคำแนะนำที่ข้าควรได้ยินเมื่อสี่สิบปีก่อน"),
    ], "ตั้งหมัดรับไฟ"),
  complete("qw_bingcan_fire_fist", "cave_bingcan", [
    say("เว่ยชิงเหวิน", "หมัดเพลิงไม่ได้มาจากความโกรธ อย่าเข้าใจผิดอย่างข้า มันมาจากปราณหยางที่สะสมแล้วระเบิดในคราวเดียว"),
    say("เว่ยชิงเหวิน", "ตีครั้งเดียว ทะลุเกราะ แล้วให้มันละลายไปเอง ไม่ต้องตีซ้ำด้วยความแค้น"),
    narr("บัณฑิตสอนเจ้าจนเตาไฟมอด แล้วหยิบเข็มขัดหนังเก่าขาดรุ่ยจากหีบใบเล็ก"),
    say("เว่ยชิงเหวิน", "เข็มขัดของหมัดเพลิงแห่งลั่วหยาง ข้าไม่ใช่คนนั้นอีกแล้ว เจ้าเอาไปเถิด"),
    say("เว่ยชิงเหวิน", "ส่วนข้า... คืนนี้คงนอนหลับได้ดีที่สุดในรอบสี่สิบปี"),
  ], "รับไฟมาดูแลต่อ"),

  // ─── qw_jinshe_winter_feed ──────────────────────────────────────────
  offer("qw_jinshe_winter_feed", "cave_jinshe", [
    say("ซวีเหลิงชิง", "อย่าเข้ามาใกล้กว่านั้น เสี่ยวจินหิวอยู่ ตัวที่หัวเหลืองน่ะ"),
    say("ซวีเหลิงชิง", "หน้าหนาวหนูป่าหายหมด งูของข้าหิวจนเริ่มมองข้าแปลก ๆ เมื่อเช้าเสี่ยวไป๋ฉกชายเสื้อข้าไปชิ้นหนึ่ง"),
    say("ซวีเหลิงชิง", "หาเนื้อสดมาสักสามชิ้น ก่อนที่ข้าจะต้องเลือกระหว่างงูกับแขนตัวเอง"),
  ], "ไปหาเนื้อมาให้"),
  complete("qw_jinshe_winter_feed", "cave_jinshe", [
    narr("ซวีเหลิงชิงโยนเนื้อเข้าไปในถ้ำ เสียงฟู่ดังระงม แล้วก็เงียบลงอย่างพอใจ"),
    say("ซวีเหลิงชิง", "ดูนั่น เสี่ยวจินมองเจ้าแล้วไม่แลบลิ้นแล้ว แปลว่ามันนับเจ้าเป็นพวก"),
    say("ซวีเหลิงชิง", "รับพิษงูนี่ไปด้วย เก็บจากเสี่ยวจินเมื่อเช้า สดใหม่ ใช้ทำยาก็ได้ ทำอย่างอื่นก็ได้ แล้วแต่ใจเจ้า"),
  ]),

  // ─── qw_jail_old_liu_letter ─────────────────────────────────────────
  offer("qw_jail_old_liu_letter", "jail", [
    narr("ตาเฒ่าหลิวล้วงห่อกระดาษเหลืองกรอบออกมาจากใต้ฟาง มือสั่นเล็กน้อย"),
    say("ตาเฒ่าหลิว", "สามสิบปีก่อน ข้าต่อยนักเลงคนหนึ่งตายเพราะมันจะทำร้ายน้องสะใภ้ข้า"),
    say("ตาเฒ่าหลิว", "น้องชายข้าเป็นชาวนาอยู่หมู่บ้านชีกู่ ชื่อลาวหนาน ข้าเขียนจดหมายถึงมันทุกปี แต่ไม่มีใครยอมส่งให้"),
    say("ตาเฒ่าหลิว", "เจ้าดูเป็นคนที่ไม่ได้อยู่ที่นี่นาน ออกไปเมื่อไร ช่วยเอาไปให้มันที บอกว่าพี่ไม่เคยโกรธ"),
  ], "รับจดหมายไว้"),
  complete("qw_jail_old_liu_letter", "village_qigu", [
    narr("ลาวหนานแกะห่อกระดาษอย่างระวัง อ่านไปได้ไม่กี่บรรทัด จอบในมือก็หล่นลงดิน"),
    say("ลาวหนาน", "ลายมือพี่... ยังเหมือนเดิม เบี้ยวไปทางขวาเหมือนตอนเด็ก"),
    say("ลาวหนาน", "ข้าไม่กล้าไปเยี่ยมพี่เลยสักครั้ง กลัวพี่จะโทษว่าเป็นเพราะข้า"),
    narr("ชาวนาแก่เช็ดตาด้วยแขนเสื้อ แล้วยัดเงินที่เก็บไว้ใส่มือเจ้า"),
    say("ลาวหนาน", "ถ้าเจ้าเจอพี่อีก... บอกว่าน้องจะไปเยี่ยม คราวนี้จะไปจริง ๆ"),
  ], "รับปาก"),
];

// ═══════════════════════════════════════════════════════════════════════
// PLACE ACTIVITIES
// ═══════════════════════════════════════════════════════════════════════
const ACTIVITIES: ActivityDef[] = [
  {
    id: "act_wuxia_mend_nets",
    label: "ช่วยชาวประมงซ่อมแห",
    badge: "labor",
    icon: "🕸️",
    hours: 2,
    stamina: 10,
    description: "ซ่อมแหขาดกับชาวประมงหมู่บ้านอู่เสีย · ได้ค่าแรงเล็กน้อยและบางทีก็ได้ปลาติดมือ",
    place: {
      locationIds: ["village_wuxia"],
      cooldownDays: 1,
      reward: {
        gold: [15, 35],
        statXp: "DEX",
        item: { itemId: "fish_carp", count: 1, chance: 0.4 },
        relationship: { npcId: DENG, amount: 1 },
      },
      doneText: "แหผืนใหญ่กลับมาใช้ได้อีกครั้ง เติ้งลองหางพยักหน้าพอใจแล้วยื่นค่าแรงให้",
    },
  },
  {
    id: "act_dalun_prostrations",
    label: "กราบอัษฎางค์รอบเจดีย์",
    badge: "practice",
    icon: "🙏",
    hours: 3,
    stamina: 15,
    description: "กราบเต็มร่างร้อยแปดครั้งรอบเจดีย์วัดตาหลุนอย่างพระทิเบต · ฝึกความทรหดและความถ่อมตน",
    place: {
      locationIds: ["temple_dalun"],
      cooldownDays: 2,
      reward: {
        wExp: 15,
        statXp: "VIT",
        trait: { trait: "humility", amount: 1 },
      },
      doneText: "ครบร้อยแปดครั้ง เข่าสั่นแต่ใจนิ่ง ราวกับน้ำหนักบางอย่างหลุดออกจากบ่า",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// PLACE MEETINGS
// ═══════════════════════════════════════════════════════════════════════
const EVENTS: MeetEventDef[] = [
  { id: "pev_heilong_glinting_hook", weight: 2, dialogSceneId: "pev_heilong_glinting_hook", locationIds: ["pool_heilong"], once: true },
  { id: "pev_meihua_dawn_spear", weight: 2, dialogSceneId: "pev_meihua_dawn_spear", locationIds: ["village_meihua"], once: true },
];

const EVENT_SCENES: DialogScene[] = [
  {
    kind: "dialog",
    id: "pev_heilong_glinting_hook",
    lines: [
      narr("บางอย่างสะท้อนแสงอยู่ในน้ำตื้นริมสระมังกรดำ เป็นขอเกี่ยวทองเหลืองเก่าที่ยังผูกถุงผ้าเปื่อย ๆ ติดอยู่"),
      narr("ในถุงมีเหรียญเก่าสองสามเหรียญ คงเป็นของชาวประมงที่ทำหล่นไว้นานแล้ว"),
    ],
    choices: [
      { text: "เก็บไว้เอง", next: "pool_heilong", effects: [{ t: "addGold", amount: 40 }] },
      {
        text: "นำไปคืนต่านเหลาตู",
        next: "pev_heilong_glinting_hook_return",
        effects: [{ t: "addNpcRelationship", npcId: TAN, amount: 3 }, { t: "addTrait", trait: "good", amount: 1 }],
      },
    ],
  },
  {
    kind: "dialog",
    id: "pev_heilong_glinting_hook_return",
    lines: [
      say("ต่านเหลาตู", "เบ็ดของพ่อข้า! ทำหล่นไว้ตั้งแต่ข้ายังเด็ก ข้านึกว่ามังกรเอาไปแล้ว"),
      say("ต่านเหลาตู", "เหรียญเจ้าเก็บไว้เถอะ เบ็ดนี่สำคัญกว่าเยอะ"),
    ],
    choices: [{ text: "ยิ้มรับ", next: "pool_heilong", effects: [{ t: "addGold", amount: 40 }] }],
  },
  {
    kind: "dialog",
    id: "pev_meihua_dawn_spear",
    lines: [
      narr("รุ่งสาง หมอกยังไม่จาง เจ้าเห็นเปาเหล็กก้านยืนอยู่หลังบ้านคนเดียว มือกำไม้คานหาบน้ำแทนทวน"),
      narr("เขาแทงไม้ออกไปครั้งเดียว หมอกตรงหน้าแหวกเป็นช่อง แล้วเขาก็ยืนนิ่งอยู่อย่างนั้นนาน"),
    ],
    choices: [
      {
        text: "ทักทายแล้วชมฝีมือ",
        next: "pev_meihua_dawn_spear_talk",
        effects: [{ t: "addNpcRelationship", npcId: BAO, amount: 2 }],
      },
      { text: "เดินผ่านไปเงียบ ๆ", next: "village_meihua" },
    ],
  },
  {
    kind: "dialog",
    id: "pev_meihua_dawn_spear_talk",
    lines: [
      say("เปาเหล็กก้าน", "เห็นด้วยรึ... ไม่ได้ฝึกหรอก มือมันขยับเอง ทหารเก่าก็อย่างนี้"),
      say("เปาเหล็กก้าน", "อย่าบอกใครนะ ชาวบ้านจะหาว่าข้าบ้าแทงหมอก"),
    ],
    choices: [{ text: "รับปากเก็บเป็นความลับ", next: "village_meihua" }],
  },
];

export const CONTENT: PlaceContent = {
  npcs: [],
  quests: QUESTS,
  scenes: [...SCENES, ...EVENT_SCENES],
  activities: ACTIVITIES,
  events: EVENTS,
  opponents: OPPONENTS,
};
