// Group elders_a — no new people: new quests for old faces in the cities
// (นครหลวง, ซูโจว, หยางโจว, ต้าหลี่, ซีเซี่ย) and the inns (ยั่วไหล, เกาเซิ่ง, เฮ่อลั่ว).
// Ten ยุทธจักร moves are taught here, one quest each, by people whose trade or
// past fits the weapon; four plain side quests; two activities; two meetings.
import type { Condition, DialogScene, QuestDef, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

// ─── Givers (all existing NPCs) ─────────────────────────────────────────
const CHEN = "city_yangzhou_fisherman_chen";   // ชาวประมงเฉิน
const SU = "city_yangzhou_chef_su";            // พ่อครัวซู
const XIAO = "swordsman_xiao";                 // เซียวจิ้งเทียน
const FAT = "inn_gaosheng_keeper_fat";         // เฉาอ้วน
const QING = "city_capital_clerk_qing";        // เสมียนนายฉิง
const DUGU = "city_xixia_blacksmith_dugu";     // ช่างดูกู
const LI = "city_suzhou_book_merchant_li";     // พ่อค้าหนังสือลี่
const MEI = "city_suzhou_weaver_mei";          // ช่างทอเหมย
const BAI = "city_dali_herbalist_bai";         // หมอยาไป๋
const PO = "inn_heluo_storyteller_po";         // โปผู้เล่าเรื่อง

// ─── Line helpers ───────────────────────────────────────────────────────
const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const nar = (text: string): SceneLine => ({ t: "narration", text });
const stat = (s: "STR" | "AGI" | "POW" | "INT", min: number): Condition => ({ t: "statAtLeast", stat: s, min });
const rel = (npcId: string, min: number): Condition => ({ t: "npcRelationship", npcId, min });
const all = (...c: Condition[]): Condition => ({ t: "and", all: c });

/** Briefing shown after accepting (the quest is already active; startQuest is idempotent). */
function offer(questId: string, home: string, lines: SceneLine[], go: string): DialogScene {
  return {
    kind: "dialog", id: `qs_${questId}_offer`, lines,
    choices: [{ text: go, next: home, effects: [{ t: "startQuest", questId }] }],
  };
}
/** Hand-in dialog: its one choice closes the quest and pays the rewards. */
function complete(questId: string, home: string, lines: SceneLine[], go: string): DialogScene {
  return {
    kind: "dialog", id: `qs_${questId}_complete`, lines,
    choices: [{ text: go, next: home, effects: [{ t: "finishQuest", questId, success: true }] }],
  };
}
/** A bout inside a quest: fight, then the win dialog advances the quest; a loss just ends the dialog. */
function bout(
  questId: string, slug: string, home: string, opponentId: string,
  intro: SceneLine[], fightText: string, win: SceneLine[], winGo: string, lose: SceneLine[],
): DialogScene[] {
  const base = `qd_${questId}_${slug}`;
  return [
    {
      kind: "dialog", id: base, lines: intro,
      choices: [
        { text: fightText, next: `${base}_win`, effects: [{ t: "triggerBattle", opponentId, onWin: `${base}_win`, onLose: `${base}_lose`, nonFatal: true }] },
        { text: "ขอเตรียมตัวก่อน", next: home },
      ],
    },
    { kind: "dialog", id: `${base}_win`, lines: win, choices: [{ text: winGo, next: home, effects: [{ t: "advanceQuest", questId }] }] },
    { kind: "dialog", id: `${base}_lose`, lines: lose },
  ];
}

// ─── Quest ids ──────────────────────────────────────────────────────────
const Q = {
  hook: "qc_yangzhou_hook_and_line",          // nc10 T0
  net: "qc_yangzhou_mend_the_net",            // side
  cleavers: "qc_yangzhou_twin_cleavers",      // ws T2
  woodpile: "qc_yuelai_woodpile_sword",       // ns1 T0
  letter: "qc_yuelai_letter_to_gaosheng",     // side
  dragon: "qc_gaosheng_dragon_palm",          // dp T1
  nightSword: "qc_capital_clerk_night_sword", // nd3 T1
  ledgers: "qc_capital_soaked_ledgers",       // side
  ironPalm: "qc_xixia_anvil_palm",            // nm2 T1
  starChart: "qc_suzhou_star_chart_sword",    // na1 T2
  mildew: "qc_suzhou_mildewed_books",         // side
  qin: "qc_suzhou_guqin_heart",               // zs T3
  lotus: "qc_dali_nine_jewel_lotus",          // ne4 T2
  envoy: "qc_heluo_envoy_palm",               // nf4 T3
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Quests
// ═══════════════════════════════════════════════════════════════════════
const QUESTS: QuestDef[] = [
  // ── หยางโจว · ชาวประมงเฉิน ─────────────────────────────────────────
  {
    id: Q.hook, type: "side", giverNpcId: CHEN,
    name: "ขอเกี่ยวกับสายเบ็ด",
    description: "ชาวประมงเฉินเคยใช้ขอเกี่ยวเรือดึงโจรสลัดตกน้ำมาแล้วครึ่งลำ เขาจะสอนให้ ถ้าเจ้าพิสูจน์ว่ารู้จักปลาพอ ๆ กับรู้จักอาวุธ",
    briefSummary: "นำปลาคาร์ป 2 ตัวมาให้ชาวประมงเฉิน",
    stages: [
      { id: "catch_carp", description: "หาปลาคาร์ป 2 ตัว (ตกเองหรือซื้อก็ได้)", autoAdvance: { t: "hasItem", itemId: "fish_carp", count: 2 } },
      { id: "return_chen", description: "นำปลากลับไปให้ชาวประมงเฉินที่หยางโจว" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nc10" },
      { t: "gold", amount: 80 },
      { t: "npcRelationship", npcId: CHEN, amount: 8 },
    ],
  },
  {
    id: Q.net, type: "side", giverNpcId: CHEN,
    name: "อวนขาดกลางแม่น้ำ",
    description: "อวนผืนใหญ่ของชาวประมงเฉินขาดเป็นรูโหว่เพราะติดตอไม้ใต้น้ำ เขาต้องการด้ายมาซ่อม และคนช่วยลากอวนตอนรุ่งสาง",
    briefSummary: "หาเส้นด้าย 3 ม้วน แล้วช่วยลากอวนที่ท่าน้ำหยางโจว",
    stages: [
      { id: "get_thread", description: "หาเส้นด้าย 3 ม้วนสำหรับซ่อมอวน", autoAdvance: { t: "hasItem", itemId: "thread", count: 3 } },
      {
        id: "haul_net", description: "ช่วยชาวประมงเฉินลากอวนที่ท่าน้ำตอนรุ่งสาง",
        objective: { hours: 2, spots: [
          { locationId: "city_yangzhou", label: "ลากอวนกับชาวประมงเฉิน", npcId: CHEN, text: "อวนที่ซ่อมแล้วหนักอึ้งด้วยปลา ชาวประมงเฉินหัวเราะจนน้ำตาไหล 'ข้าบอกแล้วว่ามันยังใช้ได้!'" },
        ] },
      },
      { id: "return_chen", description: "รับค่าแรงจากชาวประมงเฉิน" },
    ],
    rewards: [
      { t: "gold", amount: 90 },
      { t: "item", itemId: "fish_eel", count: 2 },
      { t: "npcRelationship", npcId: CHEN, amount: 10 },
      { t: "trait", trait: "good", amount: 1 },
    ],
  },

  // ── หยางโจว · พ่อครัวซู ───────────────────────────────────────────
  {
    id: Q.cleavers, type: "side", giverNpcId: SU,
    name: "มีดคู่ของพ่อครัว",
    description: "มีดสับคู่ของพ่อครัวซูถูกมือมีดราตรีขโมยไปจากครัวกลางดึก ใครเอาคืนมาได้ เขาจะสอนเพลงดาบคู่ที่เขาใช้แล่ปลาสิบตัวในหนึ่งลมหายใจ",
    briefSummary: "ปราบมือมีดราตรี เอามีดคืน แล้วประลองกับพ่อครัวซู",
    prereqs: all(stat("STR", 15), rel(SU, 5)),
    stages: [
      { id: "beat_thief", description: "ปราบมือมีดราตรีที่ขโมยมีดคู่ไป", autoAdvance: { t: "defeatedOpponent", opponentId: "night_blade", count: 1 } },
      {
        id: "spar_su", description: "ประลองดาบคู่กับพ่อครัวซูหลังร้าน",
        objective: { spots: [{ locationId: "city_yangzhou", label: "ประลองกับพ่อครัวซู", npcId: SU, sceneId: `qd_${Q.cleavers}_spar` }] },
      },
      { id: "return_su", description: "กลับไปหาพ่อครัวซูเพื่อรับวิชา" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ws" },
      { t: "wExp", amount: 200 },
      { t: "item", itemId: "spicy_stew", count: 2 },
      { t: "npcRelationship", npcId: SU, amount: 12 },
    ],
  },

  // ── โรงเตี๊ยมยั่วไหล · เซียวจิ้งเทียน ────────────────────────────
  {
    id: Q.woodpile, type: "side", giverNpcId: XIAO,
    name: "กระบี่จากกองฟืน",
    description: "เซียวจิ้งเทียนค้างค่าห้องโรงเตี๊ยม เขาตกลงกับเถ้าแก่ว่าจะผ่าฟืนใช้หนี้ — แล้วโยนงานให้เจ้า แลกกับการสอนกระบี่ท่าแรก",
    briefSummary: "ผ่าฟืนและฝึกฟันหุ่นฟางที่โรงเตี๊ยมยั่วไหล",
    stages: [
      {
        id: "chop_and_cut", description: "ผ่าฟืนหลังโรงเตี๊ยม แล้วฟันหุ่นฟางร้อยครั้งตามที่เซียวจิ้งเทียนสั่ง",
        objective: { spots: [
          { locationId: "inn_yuelai", label: "ผ่าฟืนหลังโรงเตี๊ยม", text: "ฟืนกองโตกลายเป็นกองเล็ก มือเจ้าพองแต่ข้อมือเริ่มรู้จักน้ำหนักของคม" },
          { locationId: "inn_yuelai", label: "ฟันหุ่นฟางร้อยครั้ง", text: "ครั้งที่เก้าสิบเก้า หุ่นฟางขาดสองท่อน — เซียวจิ้งเทียนที่แอบดูอยู่ปรบมือช้า ๆ" },
        ] },
      },
      { id: "return_xiao", description: "กลับไปหาเซียวจิ้งเทียน" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ns1" },
      { t: "gold", amount: 60 },
      { t: "npcRelationship", npcId: XIAO, amount: 8 },
    ],
  },
  {
    id: Q.letter, type: "side", giverNpcId: XIAO,
    name: "จดหมายถึงเพื่อนเก่า",
    description: "เซียวจิ้งเทียนมีจดหมายค้างส่งถึงเฉาอ้วนแห่งโรงเตี๊ยมเกาเซิ่งมาสามปี เขาอายเกินกว่าจะไปเอง",
    briefSummary: "นำจดหมายไปให้เฉาอ้วนที่โรงเตี๊ยมเกาเซิ่ง แล้วกลับมาเล่า",
    stages: [
      {
        id: "deliver_letter", description: "ส่งจดหมายให้เฉาอ้วนที่โรงเตี๊ยมเกาเซิ่ง",
        objective: { spots: [
          { locationId: "inn_gaosheng", label: "ส่งจดหมายของเซียวจิ้งเทียน", npcId: FAT, text: "เฉาอ้วนอ่านจบแล้วหัวเราะลั่น 'เจ้าบ้านั่นยังติดเหล้าข้าอยู่สามไห! บอกมันว่าข้ายกให้ แต่ต้องมากินข้าวด้วยกัน'" },
        ] },
      },
      { id: "return_xiao", description: "กลับไปบอกเซียวจิ้งเทียนที่โรงเตี๊ยมยั่วไหล" },
    ],
    rewards: [
      { t: "gold", amount: 70 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: XIAO, amount: 10 },
      { t: "npcRelationship", npcId: FAT, amount: 5 },
    ],
  },

  // ── โรงเตี๊ยมเกาเซิ่ง · เฉาอ้วน ───────────────────────────────────
  {
    id: Q.dragon, type: "side", giverNpcId: FAT,
    name: "ฝ่ามือนวดแป้งมังกร",
    description: "เฉาอ้วนบอกว่าวิชาลึกลับที่เขาเคยใช้ล้มโจรทั้งค่าย ทุกวันนี้ใช้นวดแป้งหมั่นโถว — แต่นักเลงที่มาก่อกวนร้านคงต้องได้ลิ้มรสของจริง",
    briefSummary: "ไล่คนร้าย 3 คน แล้วนำเนื้อสด 2 ชิ้นมาให้เฉาอ้วน",
    prereqs: stat("STR", 10),
    stages: [
      { id: "drive_ruffians", description: "ปราบคนร้าย 3 คนที่ก่อกวนตามทาง", autoAdvance: { t: "defeatedOpponent", opponentId: "ruffian", count: 3 } },
      { id: "fetch_meat", description: "นำเนื้อสด 2 ชิ้นมาทำซาลาเปาฉลองชัย", autoAdvance: { t: "hasItem", itemId: "raw_meat", count: 2 } },
      { id: "return_fat", description: "กลับไปหาเฉาอ้วนที่โรงเตี๊ยมเกาเซิ่ง" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "dp" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: FAT, amount: 10 },
    ],
  },

  // ── นครหลวง · เสมียนนายฉิง ────────────────────────────────────────
  {
    id: Q.nightSword, type: "side", giverNpcId: QING,
    name: "กระบี่ของเสมียนยามดึก",
    description: "เสมียนนายฉิงคัดลอกตำราวิชาลึกลับเก็บเข้าหีบทะเบียนจนจำได้ทุกท่า แต่ไม่เคยใช้จริง จนกระทั่งโจรเร่ร่อนดักเขาทุกคืนที่ทางกลับบ้าน",
    briefSummary: "ปราบโจรเร่ร่อน 3 คนที่ดักเสมียนนายฉิง",
    prereqs: stat("STR", 10),
    stages: [
      { id: "beat_thugs", description: "ปราบโจรเร่ร่อน 3 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 } },
      { id: "return_qing", description: "กลับไปรายงานเสมียนนายฉิงที่หน้าสำนักงานนครหลวง" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nd3" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: QING, amount: 10 },
    ],
  },
  {
    id: Q.ledgers, type: "side", giverNpcId: QING,
    name: "ทะเบียนเปียกฝน",
    description: "หลังคาหอทะเบียนรั่ว ทะเบียนครัวเรือนครึ่งหีบเปียกจนตัวหมึกเลือน เสมียนนายฉิงต้องคัดใหม่ก่อนนายอำเภอหวู่จะรู้",
    briefSummary: "หากระดาษสา 3 แผ่นกับหมึก 1 แท่ง แล้วช่วยคัดทะเบียน",
    stages: [
      { id: "get_paper", description: "หากระดาษสา 3 แผ่นและหมึกเข้ม 1 แท่ง", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "paper", count: 3 }, { t: "hasItem", itemId: "ink", count: 1 }] } },
      {
        id: "copy_ledgers", description: "นั่งคัดทะเบียนกับเสมียนนายฉิง",
        objective: { hours: 2, spots: [
          { locationId: "city_capital", label: "ช่วยคัดทะเบียนครัวเรือน", npcId: QING, text: "สองชั่วยามผ่านไป ทะเบียนใหม่เรียบร้อยกว่าของเดิมเสียอีก เสมียนนายฉิงลอบถอนใจโล่งอก" },
        ] },
      },
      { id: "return_qing", description: "ส่งงานให้เสมียนนายฉิง" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "alpha_basic", count: 1 },
      { t: "npcRelationship", npcId: QING, amount: 12 },
      { t: "trait", trait: "humility", amount: 1 },
    ],
  },

  // ── ซีเซี่ย · ช่างดูกู ─────────────────────────────────────────────
  {
    id: Q.ironPalm, type: "side", giverNpcId: DUGU,
    name: "ฝ่ามือบนทั่งเหล็ก",
    description: "ช่างดูกูตีเหล็กด้วยค้อน แต่ดัดเหล็กร้อนด้วยฝ่ามือเปล่า ผิวมือเขาด้านเหมือนเกราะ — วิชานี้เรียนได้ แต่ต้องเริ่มจากแร่ก้อนแรก",
    briefSummary: "นำแร่เหล็ก 3 ก้อนมา แล้วตบเหล็กร้อนที่โรงตีเหล็ก",
    prereqs: stat("STR", 10),
    stages: [
      { id: "bring_ore", description: "นำแร่เหล็ก 3 ก้อนมาให้ช่างดูกู", autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 3 } },
      {
        id: "temper_palm", description: "ฝึกตบเหล็กร้อนที่เตาของช่างดูกู",
        objective: { hours: 2, spots: [
          { locationId: "city_xixia", label: "ตบเหล็กร้อนบนทั่ง", text: "ฝ่ามือแสบร้อนจนชา แต่แผ่นเหล็กยุบลงเป็นรอยห้านิ้ว ช่างดูกูพยักหน้าครั้งเดียว — สำหรับเขา นั่นคือคำชม" },
        ] },
      },
      { id: "return_dugu", description: "กลับไปหาช่างดูกู" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nm2" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 180 },
      { t: "npcRelationship", npcId: DUGU, amount: 10 },
    ],
  },

  // ── ซูโจว · พ่อค้าหนังสือลี่ ──────────────────────────────────────
  {
    id: Q.mildew, type: "side", giverNpcId: LI,
    name: "ตำราขึ้นรา",
    description: "ฤดูฝนปีนี้ยาวนาน ตำราโบราณในร้านพ่อค้าหนังสือลี่เริ่มขึ้นราทีละเล่ม เขาต้องการคนช่วยขนออกไปผึ่งแดดและไล่หนอนกินกระดาษ",
    briefSummary: "ผึ่งตำราที่ท่าน้ำ และรมควันไล่หนอนในร้าน",
    stages: [
      {
        id: "air_books", description: "ช่วยพ่อค้าหนังสือลี่ดูแลตำรา",
        objective: { hours: 2, spots: [
          { locationId: "city_suzhou", label: "ผึ่งตำราริมท่าน้ำ", text: "ตำราสามสิบเล่มเรียงรับแดด เจ้าเจอแผนที่ดาวแผ่นหนึ่งสอดอยู่ในเล่มที่เขียนว่า 'อย่าเปิด'" },
          { locationId: "city_suzhou", label: "รมควันไล่หนอนในร้าน", text: "ควันใบโกฐลอยคลุ้ง หนอนกินกระดาษหนีออกจากชั้นเป็นแถว พ่อค้าลี่ไอไปยิ้มไป" },
        ] },
      },
      { id: "return_li", description: "กลับไปรายงานพ่อค้าหนังสือลี่" },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "book_basic", count: 1 },
      { t: "npcRelationship", npcId: LI, amount: 10 },
    ],
  },
  {
    id: Q.starChart, type: "side", giverNpcId: LI,
    name: "กระบี่ใต้แผนที่ดาว",
    description: "แผนที่ดาวในตำรา 'อย่าเปิด' คือวิชาลึกลับ ที่ต้องอ่านกับฟ้าจริงเท่านั้น — แต่กระบี่พเนจรคนหนึ่งขโมยแผ่นคู่ของมันไปจากร้าน",
    briefSummary: "ชิงแผนที่ดาวคืนจากกระบี่พเนจร แล้วอ่านมันกับฟ้ายามดึก",
    prereqs: all(stat("INT", 15), rel(LI, 5)),
    stages: [
      { id: "beat_swordsman", description: "ปราบกระบี่พเนจรที่ขโมยแผนที่ดาวแผ่นคู่", autoAdvance: { t: "defeatedOpponent", opponentId: "wandering_swordsman", count: 1 } },
      {
        id: "read_sky", description: "ขึ้นหลังคาร้านยามดึก อ่านแผนที่ดาวเทียบกับฟ้าจริง",
        objective: { hours: 3, spots: [
          { locationId: "city_suzhou", label: "อ่านแผนที่ดาวบนหลังคา", text: "ดาวเหนือเจ็ดดวงเรียงตรงกับรอยหมึกพอดี ปลายกระบี่ในจินตนาการลากตามเส้นดาว — ปราณไหลตามไปเอง" },
        ] },
      },
      { id: "return_li", description: "กลับไปเล่าให้พ่อค้าหนังสือลี่ฟัง" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "na1" },
      { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: LI, amount: 12 },
    ],
  },

  // ── ซูโจว · ช่างทอเหมย ───────────────────────────────────────────
  {
    id: Q.qin, type: "side", giverNpcId: MEI,
    name: "พิณที่ทอเป็นลายผ้า",
    description: "ช่างทอเหมยทอผ้าตามจังหวะกู่ฉินของสามีผู้ล่วงลับ ทุกลายมีเพลงซ่อนอยู่ สายพิณขาดมาหลายปี — และคืนนี้มีคนดีดเพลงของเขาอยู่ริมคลอง",
    briefSummary: "ทำสายพิณใหม่ ตามหาคนดีดพิณยามดึก แล้วช่วยชีวิตเขา",
    prereqs: all(stat("INT", 25), rel(MEI, 15), { t: "questStatus", questId: "qc_suzhou_copycat_guild", status: "done" }),
    stages: [
      { id: "strings", description: "หาผ้าไหม 1 ผืนและเส้นด้าย 3 ม้วนสำหรับฟั่นสายพิณ", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "silk", count: 1 }, { t: "hasItem", itemId: "thread", count: 3 }] } },
      {
        id: "canal_night", description: "ตามเสียงพิณไปที่สะพานริมคลองยามดึก",
        objective: { spots: [{ locationId: "city_suzhou", label: "ตามเสียงพิณริมคลอง", sceneId: `qd_${Q.qin}_canal` }] },
      },
      { id: "snow_lotus", description: "หาบัวหิมะ 1 ดอกมาถอนพิษที่มือของหลานอิง", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 } },
      { id: "return_mei", description: "พาเรื่องทั้งหมดกลับไปหาช่างทอเหมย" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "zs" },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "silk_fan", count: 1 },
      { t: "npcRelationship", npcId: MEI, amount: 15 },
      { t: "trait", trait: "good", amount: 2 },
    ],
  },

  // ── ต้าหลี่ · หมอยาไป๋ ────────────────────────────────────────────
  {
    id: Q.lotus, type: "side", giverNpcId: BAI,
    name: "ดอกบัวเก้าเม็ด",
    description: "หมอยาไป๋ใช้มีดปิ่นรูปดอกบัวกรีดหนองและปิดแผลในท่าเดียว บรรพบุรุษเรียกมันว่าวิชาลึกลับ — มีดที่ทำร้ายและรักษาไปพร้อมกัน",
    briefSummary: "นำเม็ดบัว 3 เม็ดมา แล้วปราบผู้ฝึกพิษที่วางยาในตลาด",
    prereqs: all(stat("INT", 15), rel(BAI, 5)),
    stages: [
      { id: "lotus_seeds", description: "เก็บเม็ดบัว 3 เม็ดสำหรับปรุงยาทาใบมีด", autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 3 } },
      { id: "poisoner", description: "ปราบผู้ฝึกพิษที่ทดลองยาพิษกับชาวบ้าน", autoAdvance: { t: "defeatedOpponent", opponentId: "poison_practitioner", count: 1 } },
      { id: "return_bai", description: "กลับไปหาหมอยาไป๋ที่ต้าหลี่" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ne4" },
      { t: "wExp", amount: 200 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "npcRelationship", npcId: BAI, amount: 12 },
    ],
  },

  // ── โรงเตี๊ยมเฮ่อลั่ว · โปผู้เล่าเรื่อง ───────────────────────────
  {
    id: Q.envoy, type: "side", giverNpcId: PO,
    name: "นิทานเรื่องยมฑูต",
    description: "นิทานเรื่องโปรดของโปคือยมฑูตไร้นามผู้ใช้ฝ่ามือพิษล้มเก้าโจรแห่งเฮ่อลั่ว คืนนี้เขาเล่าไม่จบ — เพราะมีคนมารอฟังตอนจบอยู่ที่ประตู",
    briefSummary: "ฟังความจริงของนิทาน ปราบนักฆ่าเงา และหายาถอนพิษให้ฝ่ามือ",
    prereqs: all(stat("STR", 25), rel(PO, 15), { t: "questStatus", questId: "qv_inn_legend_verify", status: "done" }),
    stages: [
      {
        id: "the_tale", description: "นั่งฟังตอนจบของนิทานยมฑูตที่โปไม่เคยเล่า",
        objective: { spots: [{ locationId: "inn_heluo", label: "ฟังนิทานตอนจบ", npcId: PO, sceneId: `qd_${Q.envoy}_tale` }] },
      },
      { id: "the_shadow", description: "ปราบนักฆ่าเงาที่ตามล่ายมฑูตเฒ่า", autoAdvance: { t: "defeatedOpponent", opponentId: "shadow_assassin", count: 1 } },
      { id: "the_balm", description: "หาพิษตะขาบ 1 ขวดกับโสม 1 ราก สำหรับยาเคลือบฝ่ามือ", autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "centipede_venom", count: 1 }, { t: "hasItem", itemId: "ginseng", count: 1 }] } },
      { id: "return_po", description: "กลับไปหาโปที่โรงเตี๊ยมเฮ่อลั่ว" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nf4" },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "warrior_belt", count: 1 },
      { t: "npcRelationship", npcId: PO, amount: 15 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Dialogs
// ═══════════════════════════════════════════════════════════════════════
const N_CHEN = "ชาวประมงเฉิน", N_SU = "พ่อครัวซู", N_XIAO = "เซียวจิ้งเทียน", N_FAT = "เฉาอ้วน";
const N_QING = "เสมียนนายฉิง", N_DUGU = "ช่างดูกู", N_LI = "พ่อค้าหนังสือลี่", N_MEI = "ช่างทอเหมย";
const N_BAI = "หมอยาไป๋", N_PO = "โปผู้เล่าเรื่อง";

const SCENES: DialogScene[] = [
  // ── nc10 · ชาวประมงเฉิน ──
  offer(Q.hook, "city_yangzhou", [
    nar("ชาวประมงเฉินกำลังลับขอเกี่ยวเรือด้วยหินลับมีด ตาไม่ละจากใบขอ"),
    say(N_CHEN, "เจ้าอยากรู้ว่าข้าไล่โจรสลัดยังไงหรือ? ด้วยไอ้นี่แหละ เกี่ยวขาแล้วกระชาก ตูม! ลงน้ำไปเลี้ยงปลา"),
    say(N_CHEN, "แต่คนที่จะใช้ขอเกี่ยวต้องรู้จักปลาก่อน ปลามันดิ้นแบบไหน คนก็ดิ้นแบบนั้น"),
    say(N_CHEN, "ไปหาปลาคาร์ปมาสองตัว ตกเองได้ยิ่งดี ซื้อมาข้าก็ดูออกนะ แต่ข้าไม่ว่าหรอก"),
  ], "รับคำ — เดี๋ยวพาปลามาให้"),
  complete(Q.hook, "city_yangzhou", [
    say(N_CHEN, "ฮ่า! ตัวนี้ตาใส เกล็ดแน่น ใช้ได้"),
    nar("ชาวประมงเฉินยื่นขอเกี่ยวให้ แล้วจับข้อมือเจ้าหมุนช้า ๆ"),
    say(N_CHEN, "ไม่ต้องดึงแรง ปล่อยให้น้ำหนักของมันทำงาน เกี่ยวครั้งหนึ่ง กระตุกอีกครั้ง — สองจังหวะ เหมือนตวัดเบ็ด"),
    say(N_CHEN, "เอาเงินนี่ไปด้วย ค่าปลา ข้าไม่ชอบติดหนี้ใคร"),
  ], "รับขอเกี่ยวและขอบคุณ"),
  offer(Q.net, "city_yangzhou", [
    say(N_CHEN, "เห็นอวนผืนนั้นไหม? ติดตอไม้ใต้น้ำ ขาดเป็นรูโตเท่าเกวียน"),
    say(N_CHEN, "ลูกชายข้าบอกให้ทิ้ง ข้าบอกว่าอวนผืนนี้อายุมากกว่ามันอีก"),
    say(N_CHEN, "หาด้ายมาสามม้วน แล้วมาช่วยข้าลากตอนรุ่งสาง แขนข้าไม่เหมือนเมื่อก่อนแล้ว"),
  ], "รับปาก — จะหาด้ายมาให้"),
  complete(Q.net, "city_yangzhou", [
    say(N_CHEN, "ปลาเต็มอวน! เห็นไหม ข้าบอกแล้ว"),
    say(N_CHEN, "ปลาไหลสองตัวนี่ของเจ้า เอาไปให้พ่อครัวซูทำ เขาทำปลาไหลอร่อยที่สุดในหยางโจว"),
  ], "รับค่าแรง"),

  // ── ws · พ่อครัวซู ──
  offer(Q.cleavers, "city_yangzhou", [
    nar("พ่อครัวซูยืนสับผักด้วยมีดเล่มเดียว ทุกครั้งที่สับ หน้าเขาเหมือนคนไว้ทุกข์"),
    say(N_SU, "มีดคู่ของข้า... สองเล่มที่อาจารย์ข้าส่งต่อมาสามรุ่น ถูกขโมยไปเมื่อคืน"),
    say(N_SU, "คนร้ายเข้าออกครัวไม่ให้กระทะดังสักใบ ฝีมือแบบนี้มีแต่พวกมือมีดราตรี"),
    say(N_SU, "เอามีดคืนมา แล้วมาประลองกับข้าสักกระบวน ถ้ามือเจ้าตามมีดคู่ทัน ข้าจะสอนสองดาบล่องลมให้"),
    say(N_SU, "เพลงนี้ข้าใช้แล่ปลาสิบตัวในลมหายใจเดียว ใช้กับคนก็... เออ อย่าให้ข้าต้องเล่า"),
  ], "รับปาก — จะเอามีดคืนมา"),
  ...bout(Q.cleavers, "spar", "city_yangzhou", "spar_chef_su_twin",
    [
      nar("พ่อครัวซูรับมีดคู่คืน ลูบสันมีดอย่างทะนุถนอม แล้วโยนเล่มหนึ่งให้เจ้า... ไม่สิ โยนกระบวยให้"),
      say(N_SU, "มีดเป็นของข้า เจ้าใช้กระบวยไปก่อน ฮ่า ๆ ล้อเล่น เอาอาวุธเจ้ามาเลย"),
      say(N_SU, "ข้าจะบุกสี่ทีติดกัน ทีละแรงขึ้น ถ้าเจ้ายืนอยู่ได้จนจบ ถือว่าผ่าน"),
    ],
    "เริ่มประลอง",
    [
      nar("มีดคู่หยุดห่างคอเจ้าครึ่งนิ้ว แล้วพ่อครัวซูก็หัวเราะ"),
      say(N_SU, "ดี! ยืนได้ทั้งที่ข้าเร่งถึงจังหวะที่สี่ ไปล้างมือแล้วมาหาข้าที่ร้าน"),
    ],
    "กลับไปหาพ่อครัวซู",
    [say(N_SU, "จังหวะที่สามเจ้าก็หลุดแล้ว กินข้าวให้อิ่มแล้วค่อยมาใหม่")],
  ),
  complete(Q.cleavers, "city_yangzhou", [
    say(N_SU, "สองดาบล่องลมไม่ได้อยู่ที่มีด อยู่ที่ลม — ฟันเล่มแรกเปิดทาง เล่มที่สองตามลมของเล่มแรกไป"),
    say(N_SU, "ยิ่งฟัน ยิ่งเร็ว ยิ่งหนัก จนคนตรงหน้าไม่ทันได้นับ"),
    nar("เขาฟันแตงกวาบนเขียงหนึ่งลูก ชิ้นบางเท่ากันสามสิบชิ้นเรียงเป็นพัด"),
    say(N_SU, "ต้มยำสองถ้วยนี้ห่อกลับไปด้วย ฝึกเหนื่อยแล้วต้องกิน"),
  ], "คารวะพ่อครัวซู"),

  // ── ns1 · เซียวจิ้งเทียน ──
  offer(Q.woodpile, "inn_yuelai", [
    say(N_XIAO, "เจ้าอยากเรียนกระบี่? ดี ข้าก็อยากได้คนผ่าฟืน"),
    nar("เซียวจิ้งเทียนกระแอม หันไปมองเถ้าแก่โรงเตี๊ยมที่จ้องเขาอยู่"),
    say(N_XIAO, "ข้าค้างค่าห้องนิดหน่อย... เถ้าแก่บอกว่าผ่าฟืนใช้หนี้ได้ ส่วนเจ้า — ผ่าฟืนแลกท่ากระบี่"),
    say(N_XIAO, "ผ่าเสร็จแล้วไปฟันหุ่นฟางหลังครัวร้อยครั้ง ข้อมือที่ผ่าฟืนเป็น จับกระบี่ไม่สั่น"),
  ], "รับงาน — ไปผ่าฟืน"),
  complete(Q.woodpile, "inn_yuelai", [
    say(N_XIAO, "ฟืนพอถึงหน้าหนาว หนี้ข้าหมด ส่วนเจ้าได้ข้อมือ"),
    say(N_XIAO, "กระบี่เบื้องต้นมีแค่สามอย่าง ยืนให้มั่น แทงให้ตรง ถอยให้ทัน"),
    say(N_XIAO, "คนส่วนใหญ่ข้ามข้อสามไป แล้วไม่ได้กลับมาเรียนข้ออื่น"),
    say(N_XIAO, "เงินนี่เถ้าแก่ฝากให้ ค่าฟืนส่วนที่เกิน... อย่าบอกเขาว่าข้าเก็บไว้ครึ่งหนึ่ง"),
  ], "รับวิชาและเงิน"),
  offer(Q.letter, "inn_yuelai", [
    nar("เซียวจิ้งเทียนหยิบจดหมายยับยู่ยี่ออกจากอกเสื้อ กระดาษเหลืองจนเกือบเป็นสีน้ำตาล"),
    say(N_XIAO, "นี่... ถึงเฉาอ้วนที่โรงเตี๊ยมเกาเซิ่ง เขียนไว้สามปีแล้ว"),
    say(N_XIAO, "สมัยก่อนข้ากับเขาดื่มด้วยกันทุกคืน แล้วข้าก็หนีไปโดยไม่จ่ายค่าเหล้าสามไห"),
    say(N_XIAO, "ข้าไม่กล้าไปเอง ถ้าเขาจะด่า ให้ด่าเจ้าแทน... เอ่อ หมายถึง ฝากด้วยนะ"),
  ], "รับจดหมาย"),
  complete(Q.letter, "inn_yuelai", [
    say(N_XIAO, "เขาว่ายังไง? ด่าข้าใช่ไหม?"),
    nar("เจ้าเล่าคำของเฉาอ้วน เซียวจิ้งเทียนนิ่งไปครู่หนึ่ง แล้วหัวเราะจนต้องเช็ดตา"),
    say(N_XIAO, "ไอ้อ้วนนั่น... ยังเหมือนเดิม ขอบใจเจ้ามาก ข้าจะไปกินข้าวกับมันสักวัน"),
  ], "รับน้ำใจ"),

  // ── dp · เฉาอ้วน ──
  offer(Q.dragon, "inn_gaosheng", [
    nar("เฉาอ้วนนวดแป้งด้วยฝ่ามือข้างเดียว แป้งทั้งก้อนยุบลงพร้อมเสียงทุ้มเหมือนกลองศึก"),
    say(N_FAT, "เห็นไหม ฝ่ามือมังกร ยี่สิบปีก่อนข้าใช้ล้มโจรทั้งค่าย ทุกวันนี้ใช้ทำหมั่นโถว"),
    say(N_FAT, "แต่ช่วงนี้มีคนร้ายมาเก็บค่าคุ้มครองตามทาง ลูกค้าข้าไม่กล้ามา"),
    say(N_FAT, "ไปไล่มันสักสามคน แล้วเอาเนื้อสดมาสองชิ้น ข้าจะทำซาลาเปาฉลอง แล้วสอนวิชาให้"),
    say(N_FAT, "ฝ่ามือนี้ต้องมีแรงก่อนนะ แขนลีบ ๆ ตีไปก็เหมือนนวดแป้ง"),
  ], "รับคำ — ไล่คนร้ายให้"),
  complete(Q.dragon, "inn_gaosheng", [
    say(N_FAT, "ทางสะอาดแล้ว ลูกค้ากลับมาแล้ว ซาลาเปาก็นึ่งแล้ว!"),
    say(N_FAT, "ฝ่ามือมังกรไม่ได้ตีให้แรงที่สุด แต่ตีให้คู่ต่อสู้เสียหลัก — มังกรไม่กัดเหยื่อที่ยืนมั่น มันพลิกเหยื่อก่อน"),
    nar("เขาตบแป้งเบา ๆ ทีเดียว แป้งลอยหมุนกลางอากาศแล้วตกลงบนถาดพอดี"),
    say(N_FAT, "เงินนี่ค่าแรง กินซาลาเปาก่อนไป ห้ามปฏิเสธ"),
  ], "กินซาลาเปาและรับวิชา"),

  // ── nd3 · เสมียนนายฉิง ──
  offer(Q.nightSword, "city_capital", [
    nar("เสมียนนายฉิงมองซ้ายมองขวา แล้วกระซิบเบาที่สุดเท่าที่คนอ่านหนังสือทั้งวันจะทำได้"),
    say(N_QING, "ข้าคัดลอกตำราดาบดาวเหนือเข้าหีบหลวงมาสิบสองรอบ จำได้ทุกท่า ทุกตัวอักษร"),
    say(N_QING, "แต่ข้าไม่เคยจับดาบจริงสักครั้ง และตอนนี้มีโจรเร่ร่อนดักข้าทุกคืนที่ตรอกกลับบ้าน"),
    say(N_QING, "ช่วยข้าไล่มันสักสามคน ข้าจะท่องตำราให้เจ้าฟังทั้งเล่ม คำต่อคำ"),
    say(N_QING, "อย่าบอกนายอำเภอนะ ตำราในหีบหลวงห้ามแพร่งพราย... แต่ปากข้าไม่ใช่หีบหลวงนี่"),
  ], "รับปาก — จะคุ้มกันท่าน"),
  complete(Q.nightSword, "city_capital", [
    say(N_QING, "คืนนี้ข้าเดินกลับบ้านได้โดยไม่ต้องอ้อมสามตรอก ฮ่า!"),
    say(N_QING, "ท่าแรก ดาวเหนือชี้ทาง — ปลายดาบไม่ส่าย ข้อความในตำราบอกว่า 'ดาวไม่เคยลังเล'"),
    nar("เขาท่องตำราทั้งเล่มด้วยเสียงราบเรียบ เจ้ารำตามทีละท่าใต้แสงตะเกียงหน้าสำนักงาน"),
    say(N_QING, "เงินนี่เก็บไว้ ข้าเบิกจากค่าน้ำมันตะเกียง... ไม่ ล้อเล่น เงินเก็บข้าเอง"),
  ], "คารวะท่านเสมียน"),
  offer(Q.ledgers, "city_capital", [
    say(N_QING, "หายนะ! หลังคาหอทะเบียนรั่ว ทะเบียนครัวเรือนเปียกไปครึ่งหีบ"),
    say(N_QING, "ถ้านายอำเภอหวู่รู้ ข้าโดนหักเบี้ยหวัดสามเดือน"),
    say(N_QING, "หากระดาษสามแผ่นกับหมึกหนึ่งแท่งให้ข้าที แล้วนั่งคัดด้วยกัน ลายมือเจ้าคงไม่แย่ไปกว่าข้าตอนง่วง"),
  ], "รับช่วย"),
  complete(Q.ledgers, "city_capital", [
    say(N_QING, "เรียบร้อย! ทะเบียนใหม่สวยกว่าเก่า นายอำเภออาจชมข้าด้วยซ้ำ"),
    say(N_QING, "ตำราตัวอักษรเล่มนี้ข้าใช้หัดคัดมาตั้งแต่เด็ก ให้เจ้า ลายมือดีช่วยให้ใจนิ่ง"),
  ], "รับของขวัญ"),

  // ── nm2 · ช่างดูกู ──
  offer(Q.ironPalm, "city_xixia", [
    nar("ช่างดูกูหยิบเหล็กแดงจากเตาด้วยมือเปล่า ดัดเป็นรูปตะขอ แล้ววางลงบนทั่งราวกับไม่รู้สึกอะไร"),
    say(N_DUGU, "จ้องทำไม ผิวข้าด้านเพราะทำแบบนี้มาสามสิบปี"),
    say(N_DUGU, "คนแถวนี้เรียกมันว่าฝ่ามือเกราะ ตบคนก็เจ็บ รับดาบก็ไม่เข้า"),
    say(N_DUGU, "อยากเรียน ขนแร่เหล็กมาสามก้อน แล้วมาตบเหล็กร้อนบนทั่งข้า ถ้ามือไม่พองถึงข้อ ข้าไม่สอน"),
  ], "รับคำ — ไปหาแร่"),
  complete(Q.ironPalm, "city_xixia", [
    say(N_DUGU, "มือพองถึงข้อ ดี ร่างกายเริ่มจำแล้ว"),
    say(N_DUGU, "ฝ่ามือเกราะคือตีแล้วรับ ตีออกไปพร้อมดึงปราณกลับมาคลุมผิว ศัตรูตีกลับมาเจอเหล็ก"),
    nar("ช่างดูกูตบไหล่เจ้าทีเดียว เจ้าเซไปสามก้าว"),
    say(N_DUGU, "แร่ที่เจ้าขนมา ข้าจะตีเป็นหัวขวาน ค่าแรงเอาไป อย่าพูดมาก"),
  ], "รับวิชาจากช่างดูกู"),

  // ── na1 · พ่อค้าหนังสือลี่ ──
  offer(Q.mildew, "city_suzhou", [
    nar("กลิ่นอับชื้นลอยออกมาจากร้านหนังสือ พ่อค้าลี่นั่งกอดตำราเล่มหนาเหมือนกอดลูกที่ป่วย"),
    say(N_LI, "ฝนตกมาสี่สิบวัน ตำราข้าขึ้นราทีละเล่ม หนอนกินกระดาษก็มางานเลี้ยง"),
    say(N_LI, "ช่วยขนไปผึ่งแดดที่ท่าน้ำ แล้วรมควันไล่หนอนในร้านให้หน่อยเถิด"),
    say(N_LI, "เล่มที่เขียนว่า 'อย่าเปิด' ก็... ผึ่งได้ แต่อย่าเปิด"),
  ], "รับช่วย"),
  complete(Q.mildew, "city_suzhou", [
    say(N_LI, "ร้านหอมกลิ่นกระดาษอีกครั้ง ขอบใจมาก!"),
    nar("เขาเหลือบมองตาเจ้า แล้วถอนใจ"),
    say(N_LI, "เจ้าเห็นแผนที่ดาวแล้วใช่ไหม... ไม่เป็นไร คนที่ช่วยข้าผึ่งตำราได้ทั้งวันไม่ใช่คนโลภ ไว้วันหลังข้าจะเล่าให้ฟัง"),
    say(N_LI, "ตำราเบื้องต้นนี่เอาไปก่อน อ่านให้จบ แล้วค่อยกลับมาถามเรื่องดาว"),
  ], "รับตำรา"),
  offer(Q.starChart, "city_suzhou", [
    say(N_LI, "แผนที่ดาวนั่นคือครึ่งหนึ่งของเพลงกระบี่ดาวเหนือ ตาของข้าซื้อมาจากหมอดูเมื่อหกสิบปีก่อน"),
    say(N_LI, "อีกครึ่งเป็นแผ่นเส้นปราณ เดือนก่อนกระบี่พเนจรคนหนึ่งแวะมาซื้อหนังสือ แล้วหยิบมันไปทั้งที่จ่ายเงินแค่ค่ากวีนิพนธ์"),
    say(N_LI, "กระบี่นี้ไม่ใช่วิชาของแขน แต่เป็นวิชาของสมอง ต้องอ่านฟ้าให้ออก ปราณถึงจะเดินตามดาว"),
    say(N_LI, "ชิงแผ่นนั้นคืนมา แล้วขึ้นหลังคาร้านข้าตอนดึก อ่านทั้งสองแผ่นเทียบกับฟ้าจริง"),
    say(N_LI, "ข้าแก่เกินกว่าจะปีนหลังคาแล้ว และ... ข้ากลัวความสูง"),
  ], "รับคำ — จะชิงแผนที่คืน"),
  complete(Q.starChart, "city_suzhou", [
    say(N_LI, "เจ้าเห็นมันใช่ไหม? ดาวเจ็ดดวงที่เรียงเป็นเส้นกระบี่"),
    nar("พ่อค้าลี่เอาสองแผ่นประกบกัน เส้นหมึกต่อกันพอดีเป็นวงโคจรของดาวเหนือ"),
    say(N_LI, "ปลายกระบี่ชี้ดาว ปราณเดินตามเส้น ศัตรูจะมองไม่ออกว่าเจ้าจะแทงจากทางไหน — เหมือนดาวที่หมุนแต่ไม่เคยหลุดวง"),
    say(N_LI, "ข้าอ่านมันมาทั้งชีวิตแต่ใช้ไม่เป็น เจ้าใช้เป็นแล้ว ตาของข้าคงยิ้มอยู่บนนั้น"),
  ], "คารวะพ่อค้าลี่"),

  // ── zs · ช่างทอเหมย ──
  offer(Q.qin, "city_suzhou", [
    nar("ช่างทอเหมยหยุดกี่ทอผ้ากลางคัน มือยังค้างอยู่บนเส้นด้าย"),
    say(N_MEI, "เจ้าได้ยินไหม... เสียงพิณริมคลองเมื่อคืน"),
    say(N_MEI, "นั่นคือเพลงกู่ฉินสะท้านจิตของสามีข้า เขาตายไปเจ็ดปีแล้ว ข้าทอผ้าตามจังหวะเพลงนี้ทุกผืน ทุกลายมีโน้ตซ่อนอยู่"),
    say(N_MEI, "พวกช่างปลอมที่เจ้าช่วยข้าจัดการ มันไม่ได้ลอกแค่ลายผ้า... มันอ่านเพลงจากลายผ้าออกด้วย"),
    say(N_MEI, "พิณของเขายังอยู่กับข้า แต่สายขาดหมด หาผ้าไหมกับด้ายมาให้ข้าฟั่นสายใหม่ แล้วไปดูว่าใครดีดเพลงนั้น"),
    say(N_MEI, "เพลงนี้ดีดผิดจังหวะเดียว คนดีดจะเลือดออกจากนิ้ว ถ้าเขาดีดมาทั้งคืน... ข้ากลัวว่าเขาจะไม่รอด"),
  ], "รับคำ — จะตามหาคนดีดพิณ"),
  {
    kind: "dialog", id: `qd_${Q.qin}_canal`,
    lines: [
      nar("ใต้สะพานหินริมคลอง หญิงสาวผอมซีดนั่งดีดพิณเก่า นิ้วพันผ้าเปื้อนเลือด เสียงพิณทำให้หัวเจ้าหมุน"),
      say("หลานอิง", "อย่าเข้ามา! เพลงนี้ข้าซื้อมาด้วยเงินทั้งหมดที่มี ข้าต้องดีดให้จบ!"),
      nar("เจ้าจำได้ — เป็นเด็กฝึกงานที่หายไปจากร้านช่างทอเหมยเมื่อปีก่อน พวกช่างปลอมหลอกขายเพลงที่อ่านจากลายผ้าให้นาง โดยไม่บอกว่าดีดผิดแล้วพิษเพลงจะย้อนเข้าตัว"),
      say("หลานอิง", "ใครขวาง ข้าจะดีดให้ใจแตก!"),
    ],
    choices: [
      { text: "หยุดเพลงด้วยกำลัง", next: `qd_${Q.qin}_canal_win`, effects: [{ t: "triggerBattle", opponentId: "qf_suzhou_lanying", onWin: `qd_${Q.qin}_canal_win`, onLose: `qd_${Q.qin}_canal_lose`, nonFatal: true }] },
      { text: "ถอยออกมาตั้งสติก่อน", next: "city_suzhou" },
    ],
  },
  {
    kind: "dialog", id: `qd_${Q.qin}_canal_win`,
    lines: [
      nar("สายพิณขาดดังเปรี๊ยะ หลานอิงทรุดลง นิ้วทั้งสิบดำคล้ำจากพิษเพลง"),
      say("หลานอิง", "ข้า... แค่อยากดีดได้เหมือนอาจารย์ผู้ชาย ข้าไม่ได้อยากขโมย..."),
      nar("พิษเพลงไหลขึ้นข้อมือนาง ต้องใช้บัวหิมะเท่านั้นจึงถอนได้ทัน เจ้าพยุงนางไปฝากไว้กับช่างทอเหมย"),
    ],
    choices: [{ text: "ออกตามหาบัวหิมะ", next: "city_suzhou", effects: [{ t: "advanceQuest", questId: Q.qin }] }],
  },
  {
    kind: "dialog", id: `qd_${Q.qin}_canal_lose`,
    lines: [nar("เสียงพิณกระแทกใจจนเจ้าล้มลงกับพื้นหิน เมื่อลืมตาอีกที สะพานว่างเปล่า แต่เสียงพิณยังดังแว่วจากที่ไกล ๆ — นางยังดีดอยู่")],
  },
  complete(Q.qin, "city_suzhou", [
    nar("หลานอิงนั่งพิงกี่ทอผ้า นิ้วพันยาจากบัวหิมะ ช่างทอเหมยวางพิณที่ขึ้นสายใหม่ลงตรงหน้าเจ้า"),
    say(N_MEI, "นางจะหาย แต่จะไม่ได้ดีดพิณไปอีกปี ข้ารับนางกลับมาเป็นศิษย์ทอผ้าแล้ว"),
    say(N_MEI, "ส่วนเพลงนี้... ข้าอยากให้คนที่ยอมช่วยคนที่ทำร้ายตัวเองเป็นผู้รับไป"),
    say(N_MEI, "กู่ฉินสะท้านจิตไม่ได้ทำร้ายร่างกาย มันทำให้ศัตรูมองผิด ฟังผิด จังหวะทุกจังหวะต้องตรง ห้ามโลภเร่ง"),
    nar("นางดีดให้ฟังหนึ่งรอบ ช้า ๆ ทีละโน้ต แล้วยื่นพัดผ้าไหมลายเดียวกับเพลงให้"),
    say(N_MEI, "ลายบนพัดคือโน้ต ลืมเมื่อไหร่ก็กางมันออกดู"),
  ], "คารวะช่างทอเหมย"),

  // ── ne4 · หมอยาไป๋ ──
  offer(Q.lotus, "city_dali", [
    nar("หมอยาไป๋ดึงปิ่นปักผมออกมา ปลายปิ่นเป็นใบมีดเล็กรูปกลีบบัว"),
    say(N_BAI, "ย่าทวดข้าเรียกมันว่าดอกบัวนพรัตน์ กรีดหนอง ปิดแผล ในท่าเดียว"),
    say(N_BAI, "แต่ถ้ากรีดศัตรู มันก็ตัดเส้นปราณเขา แล้วคืนปราณนั้นให้คนกรีด บรรพบุรุษข้าว่าเป็นมีดของหมอที่ต้องเดินป่าคนเดียว"),
    say(N_BAI, "ตอนนี้มีผู้ฝึกพิษคนหนึ่งเอาชาวบ้านแถวตลาดมาลองยา ข้ารักษาตามไม่ทัน"),
    say(N_BAI, "เก็บเม็ดบัวมาให้ข้าสามเม็ด ข้าจะปรุงยาทาใบมีด แล้วไปหยุดเขา กลับมาเมื่อไหร่ข้าสอน"),
  ], "รับคำ — จะหยุดผู้ฝึกพิษ"),
  complete(Q.lotus, "city_dali", [
    say(N_BAI, "คนไข้ข้าหยุดเพิ่มแล้ว ขอบใจเจ้า"),
    say(N_BAI, "จับมีดแบบนี้ ข้อมือหงาย ปลายมีดเหมือนกลีบบัวที่บาน — ตวัดออกคือกรีด ตวัดกลับคือเก็บ"),
    nar("นางแตะปลายมีดที่ข้อมือเจ้าเบา ๆ ความเย็นแล่นขึ้นแขน แผลเก่าที่ไหล่ก็หายปวด"),
    say(N_BAI, "ยาเลือดสองขวดนี่เอาไปด้วย คนเรียนวิชาหมอต้องพกยามากกว่ามีด"),
  ], "รับวิชาจากหมอยาไป๋"),

  // ── nf4 · โปผู้เล่าเรื่อง ──
  offer(Q.envoy, "inn_heluo", [
    nar("โปผู้เล่าเรื่องจิบชาช้า ๆ ทั้งโรงเตี๊ยมเงียบรอฟังนิทานยมฑูตตอนที่ทุกคนรู้จักดี"),
    say(N_PO, "...และยมฑูตไร้นามก็ตบโจรคนที่เก้าลงกลางสะพานเฮ่อลั่ว ฝ่ามือดำเหมือนหมึก"),
    say(N_PO, "ตอนจบน่ะหรือ? คืนนี้ข้าไม่เล่า"),
    nar("เขาเหลือบตามองไปที่ประตู ชายชุดดำคนหนึ่งยืนนิ่งอยู่นอกแสงตะเกียง แล้วก็หายไป"),
    say(N_PO, "เจ้าหนุ่ม... มานั่งข้าง ๆ ข้าก่อน ตอนจบเรื่องนี้ ข้าจะเล่าให้เจ้าฟังคนเดียว"),
  ], "นั่งลงข้างโป"),
  {
    kind: "dialog", id: `qd_${Q.envoy}_tale`, paged: true,
    lines: [
      say(N_PO, "ยมฑูตไร้นามไม่ได้ตายตอนจบหรอก เขาแก่ลง อ้วนขึ้น แล้วก็เปิดปากเล่านิทานหากินในโรงเตี๊ยม"),
      nar("โปพลิกฝ่ามือขึ้น เส้นลายมือดำคล้ำเป็นสายเหมือนหมึกซึม"),
      say(N_PO, "เก้าโจรนั้นเป็นศิษย์ของหอเงาดำ หอนั้นไม่เคยลืม ชายที่ประตูเมื่อกี้คือนักฆ่าเงารุ่นที่สามที่ตามหาข้า"),
      say(N_PO, "ข้าแก่เกินจะตบใครแล้ว ฝ่ามือนี้ใช้ทีไรพิษก็ย้อนเข้าเนื้อตัวเองทีหนึ่ง"),
      say(N_PO, "ปราบนักฆ่านั่นให้ข้า แล้วหาพิษตะขาบกับโสมมา ข้าจะผสมยาเคลือบฝ่ามือให้เจ้า — คนรุ่นข้าไม่มีใครทำให้ จึงเป็นแบบนี้"),
      say(N_PO, "นิทานเรื่องนี้ไม่ควรจบที่ข้า แต่ก็ไม่ควรจบแบบเดิมด้วย"),
    ],
    choices: [{ text: "รับปากจะจบนิทานแทน", next: "inn_heluo", effects: [{ t: "advanceQuest", questId: Q.envoy }] }],
  },
  complete(Q.envoy, "inn_heluo", [
    nar("โปบดพิษตะขาบกับโสมในถ้วยชา กลิ่นฉุนจนแมวโรงเตี๊ยมวิ่งหนี แล้วทายาลงบนฝ่ามือเจ้า"),
    say(N_PO, "ยาจะกันพิษไม่ให้ย้อน ส่วนวิชา — ปราณลงฝ่ามือ พิษตามปราณ ตบให้ถึงเส้นเลือด แล้วถอนมือก่อนพิษจะหาทางกลับ"),
    say(N_PO, "ฝ่ามือยมฑูตไม่ใช่วิชาให้ใช้ทุกวัน ใช้เมื่อคนตรงหน้าจะไม่ปล่อยเจ้าไปเท่านั้น"),
    say(N_PO, "เข็มขัดนี่ของข้าสมัยยังหนุ่ม ตอนนี้คาดไม่รอบพุงแล้ว เอาไปเถอะ"),
    say(N_PO, "ส่วนนิทาน... คืนนี้ข้าจะเล่าตอนจบใหม่ ยมฑูตแก่ตัวลงและได้นอนหลับสนิท"),
  ], "คารวะยมฑูตเฒ่า"),
];

// ═══════════════════════════════════════════════════════════════════════
// Foes
// ═══════════════════════════════════════════════════════════════════════
const OPPONENTS: StoryOpponentSpec[] = [
  { id: "spar_chef_su_twin", name: "พ่อครัวซู (มีดคู่)", ti: 2, category: "human",
    look: { npc: SU, size: 1.05 },
    stats: { STR: 12, AGI: 12, DEX: 8 },
    skillIds: ["ne9", "nm1", "nc7"] },
  { id: "qf_suzhou_lanying", name: "หลานอิงนักพิณพิษเพลง", ti: 3, category: "human",
    look: { sheet: "f2", tint: 0xb8a8d8 },
    stats: { INT: 18, POW: 14, AGI: 10, DEX: 8 },
    skillIds: ["nf1", "sa", "nd9"] },
];

// ═══════════════════════════════════════════════════════════════════════
// Activities and meetings
// ═══════════════════════════════════════════════════════════════════════
const ACTIVITIES: ActivityDef[] = [
  { id: "act_yangzhou_dock_haul", label: "แบกสินค้าที่ท่าเรือ", badge: "labor", icon: "📦", hours: 3, stamina: 20,
    description: "3 ชั่วยาม · แบกกระสอบเกลือขึ้นเรือ · ได้ค่าแรงและฝึกพละกำลัง",
    place: { locationIds: ["city_yangzhou"], cooldownDays: 1,
      reward: { gold: [25, 45], statXp: "STR" },
      doneText: "ไหล่ระบมแต่กระเป๋าหนักขึ้น นายท่าโยนเหรียญให้พร้อมคำว่า 'พรุ่งนี้มาอีก'" } },
  { id: "act_suzhou_teahouse_qin", label: "ฟังกู่ฉินในโรงน้ำชา", badge: "rest", icon: "🎵", hours: 2, stamina: 0,
    description: "2 ชั่วยาม · 15 ตำลึง · ฟังเพลงพิณริมคลอง · ใจสงบ ปัญญาแจ่มใส",
    place: { locationIds: ["city_suzhou"], cooldownDays: 2, costGold: 15,
      reward: { statXp: "INT", stamina: 15, relationship: { npcId: MEI, amount: 2 } },
      doneText: "เพลงพิณจบลงพร้อมชาถ้วยที่สาม ช่างทอเหมยที่นั่งโต๊ะข้าง ๆ พยักหน้าทักเจ้าอย่างเป็นมิตร" } },
];


const EVENT_SCENES: DialogScene[] = [
];

export const CONTENT: PlaceContent = {
  npcs: [],
  quests: QUESTS,
  scenes: [...SCENES, ...EVENT_SCENES],
  activities: ACTIVITIES,
  opponents: OPPONENTS,
};
