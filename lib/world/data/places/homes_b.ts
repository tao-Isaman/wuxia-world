// Homes B: the households of four jianghu names.
//   home_nanxian      南贤 — the hermit sage by the Quanzhen valley stream
//   home_yideng       一燈 — the monk who was once the Southern Emperor, and his
//                            fisher / farmer / scholar disciples
//   home_tianboguang  韩飞狼 (หานเฟยหลาง) — a reformed lone blade trying to go straight
//   home_miaoren      苗人鳳 — the frontier swordsman and his daughter
// Teaches (one quest each): dg, nc7, t1_redlotus, nd12, nd9, ch, ne13, ne9, nf2, nh2.
import type { Choice, DialogScene, NpcDef, QuestDef, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

// ─── small authoring helpers ───────────────────────────────────────────
const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const nar = (text: string): SceneLine => ({ t: "narration", text });
const dialog = (id: string, lines: SceneLine[], choices: Choice[]): DialogScene => ({ kind: "dialog", id, lines, choices });
/** A terminal side-dialog ("ปิด" returns to the place). */
const aside = (id: string, lines: SceneLine[]): DialogScene => ({ kind: "dialog", id, lines });

/** Talk dialog + its two asides (rumor, hook). */
function talk(npcId: string, loc: string, lines: SceneLine[], rumor: { label: string; lines: SceneLine[] },
  hook?: { label: string; lines: SceneLine[] }): DialogScene[] {
  const base = `npc_${npcId}_talk`;
  const choices: Choice[] = [{ text: rumor.label, next: `${base}_rumor` }];
  if (hook) choices.push({ text: hook.label, next: `${base}_hook` });
  choices.push({ text: "ลาก่อน", next: loc });
  const out = [dialog(base, lines, choices), aside(`${base}_rumor`, rumor.lines)];
  if (hook) out.push(aside(`${base}_hook`, hook.lines));
  return out;
}
const offer = (questId: string, loc: string, lines: SceneLine[], accept = "รับปาก"): DialogScene =>
  dialog(`qs_${questId}_offer`, lines, [{ text: accept, next: loc }]);
const complete = (questId: string, loc: string, lines: SceneLine[], thanks = "รับไว้ด้วยความขอบคุณ"): DialogScene =>
  dialog(`qs_${questId}_complete`, lines, [{ text: thanks, effects: [{ t: "finishQuest", questId, success: true }], next: loc }]);
/** A fight beat: the fight dialog, then a won dialog whose choice advances the quest. */
function fightBeat(questId: string, slug: string, loc: string, opponentId: string, lines: SceneLine[], fightText: string,
  wonLines: SceneLine[], nonFatal = true): DialogScene[] {
  const fightId = `qd_${questId}_${slug}`;
  const wonId = `qd_${questId}_${slug}_won`;
  return [
    dialog(fightId, lines, [
      { text: fightText, effects: [{ t: "triggerBattle", opponentId, onWin: wonId, onLose: loc, nonFatal }], next: wonId },
      { text: "ขอเตรียมตัวก่อน", next: loc },
    ]),
    dialog(wonId, wonLines, [{ text: "ก้าวต่อไป", effects: [{ t: "advanceQuest", questId }], next: loc }]),
  ];
}

const NX = "home_nanxian";
const YD = "home_yideng";
const TBG = "home_tianboguang";
const MR = "home_miaoren";

// ─── NPCs ──────────────────────────────────────────────────────────────
const npcs: NpcDef[] = [
  // home_nanxian
  {
    id: "home_nanxian_sage_nanxian", name: "ท่านหนานเสียน",
    description: "ปราชญ์สันโดษแห่งลำธารหุบเขา อดีตนักกระบี่ที่วางกระบี่มาชงชาแต่งกลอน พูดน้อยแต่ทุกคำคมเหมือนคมดาบ",
    locationIds: [NX], dialogSceneId: "npc_home_nanxian_sage_nanxian_talk",
    sparOpponentId: "spar_home_nanxian_sage", sparFameReward: 6,
    tags: ["elder", "scholar", "master"], defenseTier: 3,
    stealLoot: [{ itemId: "book_inter", weight: 2 }, { itemId: "lotus_seed", weight: 4 }, { itemId: "ink", weight: 3 }],
    look: { body: "elder" }, likes: ["book", "paper", "ink", "lotus_seed"], dislikes: ["venom"],
  },
  {
    id: "home_nanxian_servant_ashu", name: "อาซู",
    description: "เด็กรับใช้ตัวเล็กของท่านหนานเสียน ซุกซน ช่างพูด ชอบแอบกินขนมที่ตั้งไว้ไหว้",
    locationIds: [NX], dialogSceneId: "npc_home_nanxian_servant_ashu_talk",
    tags: ["child", "servant"], look: { body: "m1", wander: true },
    likes: ["moon_cake", "food", "gold"], dislikes: ["herb"],
  },
  {
    id: "home_nanxian_woodcutter_bai", name: "ลุงฉาย",
    description: "คนตัดฟืนร่างกำยำที่หาบฟืนขึ้นลงเขาทุกวัน ไม้คานของแกหนักจนนักเลงต้องหลีกทาง",
    locationIds: [NX], dialogSceneId: "npc_home_nanxian_woodcutter_bai_talk",
    tags: ["woodcutter", "laborer"], look: { body: "m3", wander: true },
    likes: ["cooked_meat", "food", "wood_hard"], dislikes: ["book"],
  },
  // home_yideng
  {
    id: "home_yideng_monk_yideng", name: "อู๋เฉินไต้ซือ",
    description: "พระชราเชื้อสายตระกูลต้วนแห่งต้าหลี่ (สายเดียวกับหนานตี้ในตำนาน) สละยศศักดิ์มาจุดตะเกียงดวงเดียวในกระท่อม ใจดีและรักษาคนไม่เลือกหน้า",
    locationIds: [YD], dialogSceneId: "npc_home_yideng_monk_yideng_talk",
    sparOpponentId: "spar_home_yideng_monk", sparFameReward: 8,
    tags: ["monk", "healer", "elder", "master"], defenseTier: 4,
    look: { body: "monk" }, likes: ["herb", "lotus_seed", "book"], dislikes: ["venom", "raw_meat"],
  },
  {
    id: "home_yideng_fisher_diancang", name: "ฤๅษีประมงชิงเจียง",
    description: "ศิษย์คนโตของอู๋เฉิน เคยเป็นแม่ทัพเรือแห่งต้าหลี่ บัดนี้นั่งตกปลาเฝ้าทางขึ้นกระท่อม ตะขอเบ็ดของเขาไม่เคยพลาดทั้งปลาและคน",
    locationIds: [YD], dialogSceneId: "npc_home_yideng_fisher_diancang_talk",
    sparOpponentId: "spar_home_yideng_fisher", sparFameReward: 4,
    tags: ["fisher", "disciple", "guard"], defenseTier: 2,
    look: { body: "m4" }, likes: ["fish_dragon", "fish_carp", "fish_eel", "food"], dislikes: ["silk"],
  },
  {
    id: "home_yideng_farmer_geng", name: "ชาวนาเกิง",
    description: "ศิษย์ผู้ไถนาบนขั้นบันไดหลังกระท่อม เคยแบกหินกั้นดินถล่มด้วยสองมือ หัวเราะเสียงดังกว่าควายของตัวเอง",
    locationIds: [YD], dialogSceneId: "npc_home_yideng_farmer_geng_talk",
    tags: ["farmer", "disciple"], look: { body: "m2", wander: true },
    likes: ["rice_dish", "cooked_meat", "food"], dislikes: ["book"],
  },
  {
    id: "home_yideng_scholar_zhu", name: "บัณฑิตเยี่ยจื่อหลาน",
    description: "ศิษย์บัณฑิตของอู๋เฉิน อดีตอัครเสนาบดีต้าหลี่ ใช้พู่กันจิ้มจุดได้แม่นกว่าเข็ม แต่ชอบท่องกลอนจนคนฟังหลับ",
    locationIds: [YD], dialogSceneId: "npc_home_yideng_scholar_zhu_talk",
    tags: ["scholar", "disciple", "official"], defenseTier: 1,
    stealLoot: [{ itemId: "paper", weight: 4 }, { itemId: "ink", weight: 4 }, { itemId: "alpha_inter", weight: 1 }],
    look: { body: "m1" }, likes: ["alpha_inter", "book", "paper", "ink"], dislikes: ["raw_meat"],
  },
  // home_tianboguang
  {
    id: "home_tianboguang_blade_tian", name: "หานเฟยหลาง",
    description: "\"ผู้เดินทางหมื่นลี้เพียงลำพัง\" จอมดาบไวที่ชื่อเสียงเคยเหม็นทั่วยุทธภพ บัดนี้ปฏิญาณกลับตัว แต่ปากยังเร็วกว่าดาบ",
    locationIds: [TBG], dialogSceneId: "npc_home_tianboguang_blade_tian_talk",
    sparOpponentId: "spar_home_tianboguang", sparFameReward: 6,
    tags: ["swordsman", "outlaw", "reformed"], defenseTier: 3,
    stealLoot: [{ itemId: "ancient_coin", weight: 3 }, { itemId: "silver_ring", weight: 2 }, { itemId: "jade", weight: 1 }],
    look: { body: "bandit" }, likes: ["spicy_stew", "cooked_meat", "gold"], dislikes: ["book"],
  },
  {
    id: "home_tianboguang_cook_luo", name: "ป้าหลัว",
    description: "แม่ครัวชายแดนที่หานเฟยหลางกลัวที่สุดในโลก ทัพพีของนางเคาะหัวจอมดาบมาแล้วนับไม่ถ้วน",
    locationIds: [TBG], dialogSceneId: "npc_home_tianboguang_cook_luo_talk",
    tags: ["cook", "servant"], look: { body: "f4", wander: true },
    likes: ["raw_meat", "herb", "silk"], dislikes: ["venom"],
  },
  {
    id: "home_tianboguang_soldier_chen", name: "ทหารแก่เฉิน",
    description: "ทหารธนูชายแดนปลดประจำการที่มาอาศัยเฝ้าคอกม้า ฟันหลอไปสามซี่แต่สายธนูยังไม่หย่อน อ่านหนังสือไม่ออกสักตัว ศึกจิ้งหนานเคยเรียกเขากลับไปรบอีกครั้ง",
    locationIds: [TBG], dialogSceneId: "npc_home_tianboguang_soldier_chen_talk",
    tags: ["guard", "soldier", "elder"], look: { body: "m3", wander: true },
    likes: ["cooked_meat", "iron_ingot", "potion"], dislikes: ["silk"],
  },
  // home_miaoren
  {
    id: "home_miaoren_master_miao", name: "เยวี่ยเหรินซาน",
    description: "\"พระพุทธหน้าทอง\" นักกระบี่ชายแดนผู้ได้ฉายาไร้เทียมทานใต้หล้า เงียบขรึม ซื่อตรง และรักลูกสาวยิ่งกว่าชื่อเสียง",
    locationIds: [MR], dialogSceneId: "npc_home_miaoren_master_miao_talk",
    sparOpponentId: "spar_home_miaoren_master", sparFameReward: 8,
    tags: ["swordsman", "master", "hero"], defenseTier: 4,
    look: { body: "m4" }, likes: ["tiger_claw", "steel_sword", "cooked_meat"], dislikes: ["poison_vial", "venom"],
  },
  {
    id: "home_miaoren_daughter_ruolan", name: "เยวี่ยรั่วหลิง",
    description: "ลูกสาวคนเดียวของเยวี่ยเหรินซาน อ่อนโยนแต่หัวแข็ง ชอบเล่นพิณใต้ต้นหลิวและแอบซ้อมกระบี่ตอนพ่อไม่อยู่",
    locationIds: [MR], dialogSceneId: "npc_home_miaoren_daughter_ruolan_talk",
    tags: ["daughter", "musician"], look: { body: "f1", wander: true },
    likes: ["silk", "jade_pendant", "silk_fan", "song_basic"], dislikes: ["raw_meat"],
  },
  {
    id: "home_miaoren_spearman_zhong", name: "ทหารทวนเฒ่าจง",
    description: "อดีตนายกองทวนแห่งด่านชายแดน เพื่อนบ้านและคนเฝ้าประตูของตระกูลเยวี่ย ยืนตรงเหมือนด้ามทวนแม้หลังจะค่อมแล้ว",
    locationIds: [MR], dialogSceneId: "npc_home_miaoren_spearman_zhong_talk",
    sparOpponentId: "spar_home_miaoren_spearman", sparFameReward: 4,
    tags: ["guard", "soldier", "elder"], defenseTier: 2,
    look: { body: "elder" }, likes: ["wood_hard", "iron_ingot", "cooked_meat"], dislikes: ["silk"],
  },
];

// ─── opponents (spars and quest foes) ──────────────────────────────────
const opponents: StoryOpponentSpec[] = [
  { id: "spar_home_nanxian_sage", name: "ท่านหนานเสียน", ti: 3, look: { sheet: "elder" },
    stats: { POW: 9, INT: 9, AGI: 6 }, skillIds: ["nf2", "nc3"], artId: "t3_heartmind", artLevel: 5 },
  { id: "foe_home_nanxian_masked_sword", name: "กระบี่สวมหน้ากาก", ti: 3, look: { sheet: "m4", tint: 0x6f7682 },
    stats: { POW: 8, INT: 7, AGI: 8 }, skillIds: ["nf2", "nh2"], artId: "t1_blackiron", artLevel: 6 },
  { id: "spar_home_yideng_monk", name: "อู๋เฉินไต้ซือ", ti: 4, look: { sheet: "monk" },
    stats: { POW: 12, DEX: 11, DEF: 10 }, skillIds: ["nd9", "nd12"], artId: "t3_dragonelephant", artLevel: 6 },
  { id: "spar_home_yideng_fisher", name: "ฤๅษีประมงชิงเจียง", ti: 2, look: { sheet: "m4" },
    stats: { STR: 6, DEX: 6 }, skillIds: ["ch", "nd9"], artId: "t1_blackiron", artLevel: 4 },
  { id: "spar_home_tianboguang", name: "หานเฟยหลาง", ti: 3, look: { sheet: "bandit" },
    stats: { STR: 8, AGI: 10, DEX: 6 }, skillIds: ["ne9", "nc7"], artId: "t2_tigerroar", artLevel: 5 },
  { id: "foe_home_tianboguang_holding_back", name: "หานเฟยหลาง (ออมมือ)", ti: 2, look: { sheet: "bandit" },
    stats: { STR: 6, AGI: 7 }, skillIds: ["ne9", "nc7"] },
  { id: "spar_home_miaoren_master", name: "เยวี่ยเหรินซาน", ti: 4, look: { sheet: "m4" },
    stats: { STR: 12, AGI: 12, DEX: 9 }, skillIds: ["nh2", "nf2"], artId: "t3_voidstep", artLevel: 6 },
  { id: "spar_home_miaoren_spearman", name: "ทหารทวนเฒ่าจง", ti: 2, look: { sheet: "elder" },
    stats: { STR: 7, POW: 5 }, skillIds: ["ne13", "dg"], artId: "t2_craneform", artLevel: 3 },
  { id: "foe_home_miaoren_poison_doctor", name: "หมอปลอมมือสังหาร", ti: 3, look: { sheet: "merchant", tint: 0x7a8a6a },
    stats: { DEX: 8, AGI: 7, LUK: 5 }, skillIds: ["nd9", "ch", "pn"], artId: "t1_blackiron", artLevel: 6 },
];

// ─── quests ────────────────────────────────────────────────────────────
const quests: QuestDef[] = [
  // ── home_nanxian ──
  {
    id: "qw_home_nanxian_carrying_pole", type: "side", name: "ไม้คานของลุงฉาย",
    description: "ลุงฉายคนตัดฟืนเจ็บหลังหาบฟืนไม่ไหว ถ้าเจ้าหาไม้มาให้ห้ามัด แกจะสอนวิธีใช้ไม้คานตีคนให้",
    briefSummary: "หาไม้เนื้ออ่อนให้ลุงฉาย แลกกับวิชาลึกลับ",
    giverNpcId: "home_nanxian_woodcutter_bai",
    stages: [
      { id: "wood", description: "หาไม้เนื้ออ่อน 5 ท่อนให้ลุงฉาย", autoAdvance: { t: "hasItem", itemId: "wood_soft", count: 5 } },
      { id: "return", description: "นำไม้กลับไปให้ลุงคนตัดฟืนที่บ้านหนานเสียน" },
    ],
    rewards: [{ t: "learnSkill", skillId: "dg" }, { t: "gold", amount: 80 }, { t: "npcRelationship", npcId: "home_nanxian_woodcutter_bai", amount: 5 }],
  },
  {
    id: "qw_home_nanxian_red_lotus", type: "side", name: "บัวแดงในสระหน้าบ้าน",
    description: "ท่านหนานเสียนเห็นปราณในตัวเจ้าพอจะจุดไฟได้ จึงให้ไปเก็บเม็ดบัวและนั่งสมาธิริมสระ เพื่อเรียนลมปราณลึกลับ",
    briefSummary: "เก็บเม็ดบัว นั่งสมาธิริมสระ แล้วรับลมปราณลึกลับ",
    giverNpcId: "home_nanxian_sage_nanxian",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "seeds", description: "เก็บเม็ดบัว 3 เม็ดให้ท่านหนานเสียน", autoAdvance: { t: "hasItem", itemId: "lotus_seed", count: 3 } },
      { id: "meditate", description: "นั่งสมาธิริมสระบัวที่บ้านหนานเสียน",
        objective: { spots: [{ locationId: NX, label: "นั่งสมาธิริมสระบัว",
          text: "เจ้านั่งจนตะวันคล้อย ไออุ่นจากท้องน้อยค่อย ๆ ไหลขึ้นมาเหมือนดอกบัวแย้มกลีบ" }], hours: 2 } },
      { id: "return", description: "กลับไปบอกท่านหนานเสียนว่ารู้สึกถึงไฟในกาย" },
    ],
    rewards: [{ t: "learnArt", artId: "t1_redlotus", level: 1 }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: "home_nanxian_sage_nanxian", amount: 10 }],
  },
  {
    id: "qw_home_nanxian_lonely_sword", type: "side", name: "กระบี่ที่ไร้เพื่อน",
    description: "ท่านหนานเสียนเล่าถึงพี่น้องร่วมสาบานที่ตายไปเมื่อยี่สิบปีก่อน และกระบี่ที่ตนคิดขึ้นในความเหงานับแต่นั้น ก่อนสอนจะขอให้เจ้าไปเคารพหลุมศพเขาที่ฉวนเจิน",
    briefSummary: "ตามรอยพี่น้องร่วมสาบานของท่านหนานเสียน แลกกับวิชาลึกลับ",
    giverNpcId: "home_nanxian_sage_nanxian",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 25 },
      { t: "npcRelationship", npcId: "home_nanxian_sage_nanxian", min: 15 },
      { t: "questStatus", questId: "qw_home_nanxian_red_lotus", status: "done" },
    ] },
    stages: [
      { id: "tablet", description: "ตามหาศิลาจารึกของไป๋เจี้ยนหลังสำนักฉวนเจิน",
        objective: { spots: [{ locationId: "sect_quanzhen", label: "ตามหาศิลาจารึกไป๋เจี้ยน",
          text: "ศิลาจารึกยังอยู่ แต่ใต้ฐานไม่มีกระดูกสักชิ้น มีเพียงรอยกระบี่ใหม่เอี่ยมสลักว่า \"รออยู่\"" }] } },
      { id: "lotus", description: "หาบัวหิมะ 2 ดอกให้ท่านหนานเสียนใช้ปรุงยาลมปราณ", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 2 } },
      { id: "masked", description: "เฝ้ารอคนที่สลักคำว่า \"รออยู่\" ที่บ้านหนานเสียน",
        objective: { spots: [{ locationId: NX, label: "เฝ้ารอริมลำธารยามดึก", sceneId: "qd_qw_home_nanxian_lonely_sword_masked" }] } },
      { id: "return", description: "กลับไปเล่าเรื่องทั้งหมดให้ท่านหนานเสียนฟัง" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nf2" }, { t: "wExp", amount: 320 }, { t: "item", itemId: "jade_pendant" },
      { t: "npcRelationship", npcId: "home_nanxian_sage_nanxian", amount: 10 }],
  },

  // ── home_yideng ──
  {
    id: "qw_home_yideng_one_lamp", type: "side", name: "ตะเกียงดวงเดียว",
    description: "ชาวเขาคนหนึ่งตกหน้าผามาสลบหน้ากระท่อม อู๋เฉินไต้ซือขอให้เจ้าช่วยหาสมุนไพรและป้อนยาตลอดคืน",
    briefSummary: "หาสมุนไพรและดูแลคนเจ็บกับอู๋เฉินไต้ซือ",
    giverNpcId: "home_yideng_monk_yideng",
    stages: [
      { id: "herbs", description: "หาสมุนไพรหายาก 3 ต้นให้อู๋เฉินไต้ซือ", autoAdvance: { t: "hasItem", itemId: "herb", count: 3 } },
      { id: "nurse", description: "เฝ้าป้อนยาคนเจ็บในกระท่อมอู๋เฉิน",
        objective: { spots: [{ locationId: YD, label: "เฝ้าไข้คนเจ็บ",
          text: "เจ้าเปลี่ยนผ้าเย็นทั้งคืน ใต้แสงตะเกียงดวงเดียว รุ่งเช้าคนเจ็บลืมตาและร้องเรียกหาแม่" }], hours: 4 } },
      { id: "return", description: "กลับไปแจ้งอู๋เฉินไต้ซือว่าคนเจ็บฟื้นแล้ว" },
    ],
    rewards: [{ t: "gold", amount: 120 }, { t: "wExp", amount: 60 }, { t: "item", itemId: "potion_mid" },
      { t: "trait", trait: "good", amount: 3 }, { t: "npcRelationship", npcId: "home_yideng_monk_yideng", amount: 10 }],
  },
  {
    id: "qw_home_yideng_terrace_wall", type: "side", name: "กำแพงนาขั้นบันได",
    description: "ฝนถล่มกำแพงหินนาขั้นบันไดของชาวนาเกิง หมูป่ายังลงมาขุดกล้าซ้ำ เขาจะสอนฝ่ามือที่ใช้ยันดินถล่มให้ ถ้าเจ้าช่วยซ่อม",
    briefSummary: "ขนหินซ่อมกำแพงนาและไล่หมูป่า แลกกับวิชาลึกลับ",
    giverNpcId: "home_yideng_farmer_geng",
    prereqs: { t: "statAtLeast", stat: "DEF", min: 10 },
    stages: [
      { id: "rocks", description: "หาก้อนหิน 5 ก้อนให้ชาวนาเกิง", autoAdvance: { t: "hasItem", itemId: "rock", count: 5 } },
      { id: "boars", description: "ปราบหมูป่า 3 ตัวที่ลงมาทำลายนา", autoAdvance: { t: "defeatedOpponent", opponentId: "wild_boar", count: 3 } },
      { id: "return", description: "กลับไปหาชาวนาเกิงที่บ้านอู๋เฉิน" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nd12" }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: "home_yideng_farmer_geng", amount: 5 }],
  },
  {
    id: "qw_home_yideng_brush_point", type: "side", name: "พู่กันจิ้มจุด",
    description: "บัณฑิตเยี่ยจื่อหลานหมึกหมด กลอนค้างครึ่งบท ถ้าเจ้าหาหมึกมาให้ เขาจะสอนวิธีปาเข็มให้ตรงจุดเหมือนจุดพู่กัน",
    briefSummary: "หาหมึกให้บัณฑิตเยี่ยจื่อหลาน ฝึกจิ้มจุดบนลำไผ่ แลกกับวิชาลึกลับ",
    giverNpcId: "home_yideng_scholar_zhu",
    prereqs: { t: "statAtLeast", stat: "DEX", min: 10 },
    stages: [
      { id: "ink", description: "หาหมึกเข้ม 2 แท่งให้บัณฑิตเยี่ยจื่อหลาน", autoAdvance: { t: "hasItem", itemId: "ink", count: 2 } },
      { id: "bamboo", description: "ฝึกปาเข็มใส่ข้อไผ่ที่บ้านอู๋เฉิน",
        objective: { spots: [{ locationId: YD, label: "ปาเข็มใส่ข้อไผ่",
          text: "เข็มแรกพลาด เข็มที่ร้อยตรงข้อไผ่พอดี ไผ่ทั้งลำสั่นแต่ไม่แตก" }], hours: 2 } },
      { id: "return", description: "กลับไปให้บัณฑิตเยี่ยจื่อหลานตรวจฝีมือ" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nd9" }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: "home_yideng_scholar_zhu", amount: 5 }],
  },
  {
    id: "qw_home_yideng_fishhook", type: "side", name: "ตะขอเบ็ดเฝ้าทาง",
    description: "ฤๅษีประมงชิงเจียงไม่ยอมให้ใครผ่านง่าย ๆ ถ้าอยากได้วิชาโซ่เกี่ยวของเขา ต้องหาปลามาเลี้ยงและรับตะขอของเขาให้ได้หนึ่งยก",
    briefSummary: "หาปลาคาร์ปให้ฤๅษีประมง แล้วประลองกับเขา แลกกับวิชาลึกลับ",
    giverNpcId: "home_yideng_fisher_diancang",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: "home_yideng_fisher_diancang", min: 5 },
    ] },
    stages: [
      { id: "fish", description: "หาปลาคาร์ป 3 ตัวให้ฤๅษีประมงชิงเจียง", autoAdvance: { t: "hasItem", itemId: "fish_carp", count: 3 } },
      { id: "spar", description: "ประลองกับฤๅษีประมงชิงเจียงริมลำธาร",
        objective: { spots: [{ locationId: YD, label: "รับตะขอฤๅษีประมง", npcId: "home_yideng_fisher_diancang",
          sceneId: "qd_qw_home_yideng_fishhook_spar" }] } },
      { id: "return", description: "คุยกับฤๅษีประมงชิงเจียงหลังการประลอง" },
    ],
    rewards: [{ t: "learnSkill", skillId: "ch" }, { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: "home_yideng_fisher_diancang", amount: 5 }],
  },

  // ── home_tianboguang ──
  {
    id: "qw_home_tianboguang_horse_thieves", type: "side", name: "ขโมยม้าตัวจิ๋ว",
    description: "มีขโมยมาแอบแก้เชือกม้าในคอกทุกคืน ทหารแก่เฉินขี้เกียจวิ่งไล่ เลยขอให้เจ้าจัดการ แลกกับดาบยาวท่าพื้นฐานของทหารชายแดน",
    briefSummary: "ปราบขโมยน้อย 2 คน แลกกับวิชาลึกลับ",
    giverNpcId: "home_tianboguang_soldier_chen",
    stages: [
      { id: "thieves", description: "ปราบขโมยน้อย 2 คน", autoAdvance: { t: "defeatedOpponent", opponentId: "petty_thief", count: 2 } },
      { id: "return", description: "กลับไปบอกทหารแก่เฉินที่คอกม้า" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nc7" }, { t: "gold", amount: 100 },
      { t: "npcRelationship", npcId: "home_tianboguang_soldier_chen", amount: 5 }],
  },
  {
    id: "qw_home_tianboguang_vow", type: "side", name: "ของที่ขโมยมา ต้องคืนเจ้าของ",
    description: "หานเฟยหลางปฏิญาณกลับตัว แต่หีบของเขายังมีของโจรเก่าอยู่ใบหนึ่ง เขาไม่กล้าเข้าเมืองซีเซี่ยเอง จึงขอให้เจ้าแอบเอาไปคืนร้านเครื่องประดับ",
    briefSummary: "แอบคืนของที่หานเฟยหลางเคยขโมยให้ร้านในซีเซี่ย",
    giverNpcId: "home_tianboguang_blade_tian",
    stages: [
      { id: "return_goods", description: "แอบคืนห่อเครื่องประดับที่หน้าร้านในเมืองซีเซี่ย",
        objective: { spots: [{ locationId: "city_xixia", label: "แอบวางห่อคืนหน้าร้านเครื่องประดับ",
          text: "เจ้าวางห่อผ้าไว้หน้าประตู เถ้าแก่เปิดดูแล้วร้องไห้ — ปิ่นทองของแม่เขาหายไปเจ็ดปี" }] } },
      { id: "return", description: "กลับไปบอกหานเฟยหลางว่าของถึงมือเจ้าของแล้ว" },
    ],
    rewards: [{ t: "gold", amount: 150 }, { t: "wExp", amount: 60 }, { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: "home_tianboguang_blade_tian", amount: 8 }],
  },
  {
    id: "qw_home_tianboguang_dragon_blade", type: "side", name: "ดาบไวกว่าปาก",
    description: "หานเฟยหลางอยากพิสูจน์ว่าคนกลับตัวก็สอนวิชาได้ เขาให้เจ้าไปปราบหัวหน้าโจรที่ใช้ชื่อเขาไปปล้น แล้วรับดาบเขา (แบบออมมือ) ให้ได้",
    briefSummary: "ปราบหัวหน้าโจรแอบอ้าง แล้วประลองกับหานเฟยหลาง แลกกับวิชาลึกลับ",
    giverNpcId: "home_tianboguang_blade_tian",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: "home_tianboguang_blade_tian", min: 5 },
    ] },
    stages: [
      { id: "impostor", description: "ปราบหัวหน้าโจรที่แอบอ้างชื่อหานเฟยหลาง", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit_chief", count: 1 } },
      { id: "spar", description: "ประลองกับหานเฟยหลางที่บ้านนักรบชายแดน",
        objective: { spots: [{ locationId: TBG, label: "รับดาบหานเฟยหลาง", npcId: "home_tianboguang_blade_tian",
          sceneId: "qd_qw_home_tianboguang_dragon_blade_spar" }] } },
      { id: "return", description: "ฟังหานเฟยหลางอธิบายเคล็ดดาบยาวมังกร" },
    ],
    rewards: [{ t: "learnSkill", skillId: "ne9" }, { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: "home_tianboguang_blade_tian", amount: 5 }],
  },

  // ── home_miaoren ──
  {
    id: "qw_home_miaoren_tiger", type: "side", name: "เสือกินคนแห่งตรอกชายแดน",
    description: "เสือภูเขาตัวหนึ่งลงมาคาบแพะของชาวบ้าน เยวี่ยเหรินซานไม่อยากทิ้งลูกสาวไว้ลำพัง จึงขอให้เจ้าไปจัดการแทน",
    briefSummary: "ปราบเสือภูเขาแทนเยวี่ยเหรินซาน",
    giverNpcId: "home_miaoren_master_miao",
    stages: [
      { id: "tiger", description: "ปราบเสือภูเขา 1 ตัว", autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 1 } },
      { id: "return", description: "กลับไปบอกเยวี่ยเหรินซานว่าเสือถูกปราบแล้ว" },
    ],
    rewards: [{ t: "gold", amount: 150 }, { t: "wExp", amount: 80 }, { t: "trait", trait: "fame", amount: 2 },
      { t: "npcRelationship", npcId: "home_miaoren_master_miao", amount: 10 }],
  },
  {
    id: "qw_home_miaoren_new_shaft", type: "side", name: "ด้ามทวนใหม่ของนายกองจง",
    description: "ด้ามทวนของทหารทวนเฒ่าจงหักตอนไล่โจร เขาอยากได้ด้ามใหม่ และอยากรู้ว่าเจ้าคู่ควรกับวิชาลึกลับหรือไม่",
    briefSummary: "หาไม้เนื้อแข็งทำด้ามทวน แล้วประลองกับนายกองจง แลกกับวิชาลึกลับ",
    giverNpcId: "home_miaoren_spearman_zhong",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: "home_miaoren_spearman_zhong", min: 5 },
    ] },
    stages: [
      { id: "wood", description: "หาไม้เนื้อแข็ง 2 ท่อนให้ทหารทวนเฒ่าจง", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 2 } },
      { id: "spar", description: "ประลองกับทหารทวนเฒ่าจงหน้าประตูบ้านเยวี่ย",
        objective: { spots: [{ locationId: MR, label: "ลองทวนใหม่กับนายกองจง", npcId: "home_miaoren_spearman_zhong",
          sceneId: "qd_qw_home_miaoren_new_shaft_spar" }] } },
      { id: "return", description: "ฟังทหารทวนเฒ่าจงสอนเคล็ดทวนหยินหยาง" },
    ],
    rewards: [{ t: "learnSkill", skillId: "ne13" }, { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: "home_miaoren_spearman_zhong", amount: 5 }],
  },
  {
    id: "qw_home_miaoren_poisoned_cure", type: "side", name: "ยาตาของพระพุทธหน้าทอง",
    description: "ตาของเยวี่ยเหรินซานพร่ามัวมาตั้งแต่ศึกกับตระกูลหู มีหมอแปลกหน้าในซีเซี่ยอ้างว่ารักษาได้ ก่อนสอนกระบี่ เขาขอให้เจ้าช่วยตามเรื่องนี้",
    briefSummary: "ช่วยหายาตาให้เยวี่ยเหรินซาน แลกกับวิชาลึกลับ",
    giverNpcId: "home_miaoren_master_miao",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "AGI", min: 25 },
      { t: "npcRelationship", npcId: "home_miaoren_master_miao", min: 15 },
      { t: "questStatus", questId: "qw_home_miaoren_tiger", status: "done" },
    ] },
    stages: [
      { id: "rumor", description: "สืบเรื่องหมอแปลกหน้าในเมืองซีเซี่ย",
        objective: { spots: [{ locationId: "city_xixia", label: "สืบเรื่องหมอแปลกหน้า",
          text: "คนในตลาดว่าหมอคนนั้นไม่เคยรักษาใคร แต่ถามทางไปบ้านเยวี่ยทุกวัน และจ่ายด้วยเงินจากเมืองหลวง" }] } },
      { id: "ginseng", description: "หาโสม 2 รากให้เยวี่ยรั่วหลิงต้มยาจริงสำรองไว้", autoAdvance: { t: "hasItem", itemId: "ginseng", count: 2 } },
      { id: "doctor", description: "เฝ้าดูตอนหมอแปลกหน้ามาถึงบ้านเยวี่ย",
        objective: { spots: [{ locationId: MR, label: "จับตาหมอแปลกหน้า", sceneId: "qd_qw_home_miaoren_poisoned_cure_doctor" }] } },
      { id: "return", description: "กลับไปหาเยวี่ยเหรินซาน" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nh2" }, { t: "wExp", amount: 320 }, { t: "item", itemId: "potion_big" },
      { t: "npcRelationship", npcId: "home_miaoren_master_miao", amount: 10 }],
  },
];

// ─── dialogs ───────────────────────────────────────────────────────────
const SAGE = "ท่านหนานเสียน", ASHU = "อาซู", BAI = "ลุงฉาย";
const YIDENG = "อู๋เฉินไต้ซือ", FISHER = "ฤๅษีประมงชิงเจียง", GENG = "ชาวนาเกิง", ZHU = "บัณฑิตเยี่ยจื่อหลาน";
const TIAN = "หานเฟยหลาง", LUO = "ป้าหลัว", CHEN = "ทหารแก่เฉิน";
const MIAO = "เยวี่ยเหรินซาน", RUOLAN = "เยวี่ยรั่วหลิง", ZHONG = "ทหารทวนเฒ่าจง";

const scenes: DialogScene[] = [
  // ── talk: home_nanxian ──
  ...talk("home_nanxian_sage_nanxian", NX, [
    nar("ชายชรานั่งขัดสมาธิบนแผ่นหินริมลำธาร กาน้ำชาเดือดเบา ๆ ข้างตัว"),
    say(SAGE, "มาแล้วหรือ นั่งเถิด ชาชาวฉวนเจินขมเกินไป ชาข้าขมกำลังดี"),
    say(SAGE, "คนหนุ่มสมัยนี้ถือกระบี่ก่อนถือใจ ข้าเองก็เคยเป็นเช่นนั้น"),
    say(SAGE, "ถ้าอยากฟังกลอนก็นั่ง ถ้าอยากฟังกระบี่ก็รอให้ชาหมดถ้วยก่อน"),
  ], { label: "ถามข่าวคราวแถบนี้", lines: [
    say(SAGE, "นักพรตฉวนเจินลงมาถกเรื่องเต๋ากับข้าเดือนละครั้ง แพ้ทุกครั้ง แล้วก็กลับมาใหม่ทุกครั้ง"),
    say(SAGE, "ได้ยินว่าข้างสำนักกู่มู่มีคนเห็นหญิงชุดขาวเดินบนยอดหญ้า ข้าว่าคงเป็นศิษย์สำนักนั้น ไม่ใช่ผีหรอก"),
  ] }, { label: "ขอเรียนวิชาจากท่าน", lines: [
    say(SAGE, "ลมปราณไม่ใช่ของแจก ถ้าปราณในตัวเจ้ายังเย็นเหมือนน้ำในลำธาร ข้าจุดไฟให้ไม่ได้"),
    say(SAGE, "ฝึกให้ปราณถึงสิบเสียก่อน แล้วค่อยมาคุยเรื่องบัวแดง"),
    say(SAGE, "ส่วนกระบี่ของข้า... เป็นกระบี่ของคนเหงา อย่าเพิ่งอยากได้เลย"),
  ] }),
  ...talk("home_nanxian_servant_ashu", NX, [
    say(ASHU, "ชู่ว์! อย่าบอกท่านอาจารย์นะว่าข้ากินขนมไหว้ไปสองชิ้น"),
    say(ASHU, "ท่านอาจารย์ตื่นตีห้า ชงชา แต่งกลอน แล้วก็บ่นว่ากลอนไม่ดี ทุกวันเลย"),
    say(ASHU, "โตขึ้นข้าจะเป็นจอมกระบี่ หรือไม่ก็เปิดร้านขนม ยังไม่ได้ตัดสินใจ"),
  ], { label: "มีเรื่องอะไรน่าสนใจบ้าง", lines: [
    say(ASHU, "ลุงฉายตีโจรสามคนด้วยไม้คานเดียว! ข้าเห็นกับตา... ก็เกือบเห็น ข้าแอบอยู่หลังกองฟืน"),
    say(ASHU, "เวลาท่านอาจารย์มองไปทางฉวนเจินนาน ๆ ห้ามไปกวนนะ เขาว่าคิดถึงเพื่อนเก่า"),
  ] }),
  ...talk("home_nanxian_woodcutter_bai", NX, [
    nar("ชายร่างใหญ่วางหาบฟืนลง เหงื่อท่วมหลัง"),
    say(BAI, "โอย หลังข้า... ตัดฟืนมาสามสิบปีไม่เคยเจ็บ ปีนี้เพิ่งรู้ว่าตัวเองแก่"),
    say(BAI, "ไม้คานนี่น่ะ หาบฟืนก็ได้ ตีโจรก็ดี ข้าใช้มาทั้งชีวิต"),
  ], { label: "คุยเรื่องทางแถวนี้", lines: [
    say(BAI, "ทางลงลำธารไปฉวนเจินลื่นตอนฝนตก ระวังหัวทิ่ม ข้าเห็นนักพรตหนุ่มกลิ้งลงมาสองคนแล้ว"),
    say(BAI, "ไม้เนื้ออ่อนหาได้ตามป่าทั่วไป ตัดเองก็ได้ ซื้อก็ได้ ข้าไม่ถือ"),
  ] }, { label: "ไม้คานตีโจรได้จริงหรือ", lines: [
    say(BAI, "ได้สิ! ข้าเรียกมันว่าดามอกุน พลองปราบมาร ฟังดูเท่ใช่ไหม ข้าตั้งเอง"),
    say(BAI, "ช่วยข้าหาไม้มาสักห้าท่อน แล้วข้าจะสอนให้ ไม่คิดเงิน"),
  ] }),
  // ── talk: home_yideng ──
  ...talk("home_yideng_monk_yideng", YD, [
    nar("ในกระท่อมไม้ไผ่ ตะเกียงน้ำมันดวงเดียวส่องหน้าพระชราผู้นั่งนิ่ง"),
    say(YIDENG, "อามิตตาพุทธ ผู้มาเยือนเดินทางไกลมาเหนื่อยแล้ว ดื่มน้ำก่อนเถิด"),
    say(YIDENG, "อาตมาเคยมีบัลลังก์ มีกองทัพ มีวังทั้งวัง สุดท้ายเหลือตะเกียงดวงเดียวนี้ กลับสว่างกว่าเดิม"),
    say(YIDENG, "ถ้าโยมมีความทุกข์ เล่าได้ ถ้าโยมมีบาดแผล ให้อาตมาดู"),
  ], { label: "ถามถึงศิษย์ทั้งสี่", lines: [
    say(YIDENG, "ประมง คนตัดฟืน ชาวนา บัณฑิต เดิมเป็นแม่ทัพเรือ ขุนพล เสนาบดี และอัครมหาเสนาบดีของต้าหลี่"),
    say(YIDENG, "พวกเขาตามอาตมามาบวชใจ ส่วนคนตัดฟืนนั้นลงเขาไปนานแล้ว เหลือสามคนที่ยังดื้อเฝ้าทางอยู่"),
    say(YIDENG, "ถ้าโยมอยากเรียนอะไร ลองถามพวกเขาดู แต่ละคนก็มีของดีติดตัว"),
  ] }, { label: "ขอช่วยงานท่าน", lines: [
    say(YIDENG, "เมื่อคืนมีชาวเขาตกผามาสลบหน้าประตู อาตมาต้องการสมุนไพรและคนช่วยเฝ้าไข้"),
    say(YIDENG, "บุญนั้นไม่มีราคา แต่อาตมาก็จะไม่ปล่อยให้โยมเหนื่อยเปล่า"),
  ] }),
  ...talk("home_yideng_fisher_diancang", YD, [
    nar("ชายร่างสูงนั่งบนโขดหินกลางลำธาร คันเบ็ดไม่ขยับ แต่ตาจ้องเจ้าไม่วางตา"),
    say(FISHER, "หยุดตรงนั้น จะขึ้นไปหาอาจารย์ข้า ต้องผ่านข้าก่อน"),
    say(FISHER, "...ล้อเล่น อาจารย์สั่งให้ต้อนรับทุกคน ข้าแค่ชอบเห็นหน้าคนตกใจ"),
    say(FISHER, "ปลาในลำธารนี้ฉลาด ข้าตกมาสามปีได้ตัวใหญ่ตัวเดียว แล้วก็ปล่อยไป เพราะมันมองหน้าข้า"),
  ], { label: "ถามข่าวทางต้าหลี่", lines: [
    say(FISHER, "ตระกูลต้วนในต้าหลี่ยังส่งคนมาขอให้อาจารย์กลับไปครองราชย์ปีละหน อาจารย์ตอบด้วยรอยยิ้มทุกปี"),
    say(FISHER, "ทางไปง้อไบ๊ข้ามลำธารป่าด้านใต้ มีแม่ชีลงมาตักน้ำบ่อย อย่าไปทำกร่างใส่ นางตีเจ็บ"),
  ] }, { label: "อยากเรียนตะขอเบ็ดของท่าน", lines: [
    say(FISHER, "ตะขอข้าเกี่ยวปลาได้ เกี่ยวคนก็ได้ ข้าเรียกมันว่าโซ่เกี่ยวสังหาร"),
    say(FISHER, "แต่ข้าไม่สอนคนแปลกหน้า และไม่สอนคนแขนลีบ มีแรงสักสิบห้า แล้วมาเป็นเพื่อนข้าก่อน"),
  ] }),
  ...talk("home_yideng_farmer_geng", YD, [
    say(GENG, "ฮ่า ๆ ๆ! แขกมา! ควายข้ายังไม่เคยเห็นหน้าเจ้า เดี๋ยวมันจะมาดม"),
    say(GENG, "ข้าเคยถือดาบนำทัพ ตอนนี้ถือคันไถ ข้าว่าคันไถซื่อสัตย์กว่า"),
    say(GENG, "นาขั้นบันไดนี่ข้าก่อกำแพงหินเองทุกก้อน ฝนมาเมื่อไหร่ก็พังเมื่อนั้น ฮ่า ๆ"),
  ], { label: "ถามเรื่องในหุบ", lines: [
    say(GENG, "หมูป่าบนเขาช่วงนี้ซ่า ลงมาขุดกล้าข้าทุกคืน ถ้าเจอที่ไหนจัดการให้ข้าด้วย"),
    say(GENG, "บัณฑิตเยี่ยน่ะ อย่าให้เขาเริ่มท่องกลอนนะ เมื่อวานข้าหลับไปตื่นหนึ่งเขายังไม่จบ"),
  ] }, { label: "ทำไมมือท่านหนาอย่างนั้น", lines: [
    say(GENG, "ยันดินถล่มมาทั้งชีวิตไงเล่า! ข้าเรียกท่านี้ว่าฝ่ามือสร้างกำแพง ฟาดออกไปแล้วตัวเองก็แข็งเหมือนกำแพงไปด้วย"),
    say(GENG, "ถ้าเจ้ากระดูกแข็งพอ ช่วยข้าซ่อมนาแล้วข้าสอนให้"),
  ] }),
  ...talk("home_yideng_scholar_zhu", YD, [
    nar("บัณฑิตวัยกลางคนยืนหน้าโต๊ะเขียนหนังสือใต้ต้นไผ่ พู่กันค้างกลางอากาศ"),
    say(ZHU, "\"สายน้ำไหลไม่หวนคืน แสงตะเกียงไม่...\" ไม่... ไม่อะไรดีนะ"),
    say(ZHU, "อ้อ มีแขก ขออภัย ข้าเคยเป็นอัครเสนาบดี ติดนิสัยคิดเรื่องเดียวนาน ๆ"),
    say(ZHU, "พู่กันกับเข็มต่างกันแค่ปลาย ใจที่จิ้มลงไปนั้นอันเดียวกัน"),
  ], { label: "ขอฟังเรื่องเล่า", lines: [
    say(ZHU, "สมัยอยู่ในวัง ข้าเคยจิ้มจุดชีพจรมือสังหารด้วยพู่กันขณะเขียนฎีกาไม่เสร็จ ฎีกาเลอะหมึก ข้าเสียดายฎีกามากกว่า"),
    say(ZHU, "หมึกแถวนี้หายาก ต้องลงไปซื้อที่ต้าหลี่ หรือทำเองจากเขม่า"),
  ] }, { label: "เข็มตีจุดเรียนยากไหม", lines: [
    say(ZHU, "ไม่ยาก ถ้ามือนิ่งพอ ว่องไวสักสิบ แล้วนำหมึกมาให้ข้าสักสองแท่ง กลอนข้าจะได้จบ"),
  ] }),
  // ── talk: home_tianboguang ──
  ...talk("home_tianboguang_blade_tian", TBG, [
    nar("ชายหนวดเฟิ้มนั่งเหยียดขาบนม้านั่ง ดาบพาดตัก กำลังแทะขาไก่"),
    say(TIAN, "อ้าว! มาหาหานเฟยหลางผู้เดินทางหมื่นลี้เพียงลำพังหรือ... ตอนนี้เดินแค่ร้อยก้าวไปครัวป้าหลัว"),
    say(TIAN, "ข้ากลับตัวแล้วนะ! ปฏิญาณต่อหน้าฟ้าดิน ต่อหน้าป้าหลัว ซึ่งน่ากลัวกว่าฟ้าดิน"),
    say(TIAN, "ดาบข้ายังเร็วเหมือนเดิม เร็วจนแมลงวันที่บินผ่านกลายเป็นแมลงวันสองตัว"),
  ], { label: "ถามข่าวชายแดน", lines: [
    say(TIAN, "มีหัวหน้าโจรใช้ชื่อข้าไปปล้นกองคาราวานแถวทะเลทราย ชื่อเสียงข้าเหม็นพออยู่แล้ว ไม่ต้องช่วยเติม!"),
    say(TIAN, "นักรบทะเลทรายช่วงนี้ลงมาถึงซากเมืองเก่า อย่าเดินคนเดียวตอนพลบ ยกเว้นเจ้าจะเก่งเท่าข้า ซึ่งไม่มีทาง"),
  ] }, { label: "ทำไมถึงกลับตัว", lines: [
    say(TIAN, "แพ้พนันกับคนคนหนึ่ง เขาให้ข้าปฏิญาณ... เอาเป็นว่าข้าแพ้ แล้วก็ดีใจที่แพ้"),
    say(TIAN, "แต่ของโจรเก่ายังค้างในหีบอยู่ ข้าไม่กล้าเข้าเมืองเอง กลัวคนจำหน้าได้ เจ้าช่วยข้าได้ไหมล่ะ"),
  ] }),
  ...talk("home_tianboguang_cook_luo", TBG, [
    say(LUO, "จะมาขอข้าวหรือ นั่งลง ล้างมือก่อน! ที่นี่ใครไม่ล้างมือไม่ได้กิน รวมถึงจอมดาบหมื่นลี้นั่นด้วย"),
    say(LUO, "ไอ้หานมันกินเหมือนหมาป่าสามตัว แต่ก็ผ่าฟืน แบกน้ำ ไม่บ่น นับว่าดีขึ้น"),
    say(LUO, "ถ้ามันทำตัวไม่ดีอีก ทัพพีข้ายังอยู่"),
  ], { label: "ถามเรื่องในบ้าน", lines: [
    say(LUO, "ทหารแก่เฉินบ่นเรื่องขโมยม้าทุกเช้า แต่ไม่เคยลุกไปไล่สักที ข้าว่าเขาชอบมีเรื่องให้บ่น"),
    say(LUO, "เนื้อสดหายากที่ชายแดน ใครเอามาฝากข้าจะทำต้มเผ็ดให้กินจนน้ำตาไหล"),
  ] }),
  ...talk("home_tianboguang_soldier_chen", TBG, [
    say(CHEN, "หยุด! ใครมา... อ้อ คนธรรมดา นึกว่าขโมยม้า"),
    say(CHEN, "ข้ารับใช้ด่านชายแดนสามสิบปี ฟันหลอไปสามซี่ ได้เบี้ยหวัดพอซื้อเกลือ"),
    say(CHEN, "ดาบยาวสองมือน่ะ ฟันลงไปทีเดียวม้าก็หยุด คนก็หยุด ไม่ต้องคิดมาก"),
  ], { label: "ถามเรื่องขโมยม้า", lines: [
    say(CHEN, "มีขโมยตัวเล็ก ๆ มาแก้เชือกม้าทุกคืน วิ่งเร็วยังกับกระต่าย เข่าข้าไล่ไม่ทันแล้ว"),
    say(CHEN, "ถ้าเจ้าจัดการได้สองตัว ข้าจะสอนดาบยาวท่าพื้นฐานให้ ท่าที่ทหารทุกคนต้องรู้"),
  ] }),
  // ── talk: home_miaoren ──
  ...talk("home_miaoren_master_miao", MR, [
    nar("ชายร่างสูงหน้าคล้ำยืนนิ่งใต้ชายคา กระบี่พิงผนัง ตาหรี่มองมาอย่างระวัง"),
    say(MIAO, "เยวี่ยเหรินซาน ข้าเอง ถ้ามาท้าประลองก็ว่ามา ถ้ามาเป็นแขกก็นั่ง"),
    say(MIAO, "คนเรียกข้าว่าไร้เทียมทานใต้หล้า ข้าไม่เคยตั้งชื่อนั้นเอง และไม่ชอบมันนัก"),
    say(MIAO, "ศัตรูตระกูลข้ายังไม่หมด ข้าจึงไม่ห่างลูกสาวไปไหน"),
  ], { label: "ถามข่าวชายแดน", lines: [
    say(MIAO, "เสือภูเขาตัวหนึ่งลงมาถึงตรอกชายแดน คาบแพะไปสามตัวแล้ว ข้าไปไม่ได้เพราะต้องเฝ้าบ้าน"),
    say(MIAO, "ถ้าเจ้าได้ยินใครถามทางมาบ้านข้าในซีเซี่ย จำหน้าเขาไว้ให้ดี"),
  ] }, { label: "ขอเรียนกระบี่ตระกูลเยวี่ย", lines: [
    say(MIAO, "กระบี่ข้าไม่สอนคนที่ข้ายังไม่รู้จักใจ"),
    say(MIAO, "ช่วยข้าสักเรื่อง ให้ข้าเห็นว่าเจ้าไว้ใจได้ และให้ขาเจ้าไวพอจะตามกระบี่ทัน แล้วค่อยว่ากัน"),
  ] }),
  ...talk("home_miaoren_daughter_ruolan", MR, [
    nar("หญิงสาวนั่งใต้ต้นหลิว ดีดพิณเบา ๆ แล้วหยุดเมื่อเห็นเจ้า"),
    say(RUOLAN, "ท่านพ่อไม่ชอบให้แขกมาใกล้ข้า แต่ท่านพ่อก็ไม่อยู่ตรงนี้นี่นา"),
    say(RUOLAN, "ข้าแอบซ้อมกระบี่ตอนท่านพ่อออกไปตักน้ำ อย่าบอกท่านนะ"),
    say(RUOLAN, "บางคืนท่านพ่อขยี้ตานาน ๆ เหมือนมองอะไรไม่ชัด ข้าเป็นห่วง"),
  ], { label: "คุยเรื่องพิณ", lines: [
    say(RUOLAN, "เพลงนี้ท่านแม่สอนก่อนจากไป ข้าเล่นทุกเย็น ท่านพ่อจะนั่งฟังเงียบ ๆ ที่ประตู"),
    say(RUOLAN, "ถ้าท่านเจอผ้าไหมดี ๆ ในเมือง ข้าอยากได้มาทำผ้าคลุมพิณ"),
  ] }),
  ...talk("home_miaoren_spearman_zhong", MR, [
    say(ZHONG, "หยุดหน้าประตู! บอกชื่อ บอกธุระ... ขาข้าค่อม แต่ทวนข้ายังตรง"),
    say(ZHONG, "ข้าเคยคุมกองทวนสามร้อยคนที่ด่านนอก ตอนนี้คุมประตูบานเดียว งานเบาลง ใจไม่เบา"),
    say(ZHONG, "ท่านเยวี่ยช่วยชีวิตข้าไว้ครั้งหนึ่ง ข้าจึงเฝ้าประตูให้ท่านไปจนตาย"),
  ], { label: "ถามเรื่องชายแดน", lines: [
    say(ZHONG, "นักรบทะเลทรายเคลื่อนไหวแปลก ๆ แถวซากเมืองเก่า สมัยข้ายังรับราชการ เขาไม่กล้าเข้าใกล้เมืองขนาดนี้"),
    say(ZHONG, "ไม้เนื้อแข็งดี ๆ ต้องตัดจากป่าเขา ไม้ชายแดนแห้งเปราะ ทำด้ามทวนไม่ได้"),
  ] }, { label: "อยากเรียนทวนจากท่าน", lines: [
    say(ZHONG, "ทวนหยินหยาง แทงหนึ่งหลอก แทงหนึ่งจริง ศัตรูมองไม่ออกว่าอันไหน"),
    say(ZHONG, "ด้ามทวนข้าหักอยู่ และข้าไม่สอนคนที่ข้ายังไม่สนิทใจ แขนต้องมีแรงสักสิบห้าด้วย"),
  ] }),

  // ── quest dialogs: home_nanxian ──
  offer("qw_home_nanxian_carrying_pole", NX, [
    say(BAI, "ดีมาก! ไม้เนื้ออ่อนห้าท่อน ตัดจากป่าก็ได้ ซื้อก็ได้"),
    say(BAI, "ข้าแบกไม่ไหว แต่ยังสอนได้ ปากข้าไม่ได้เจ็บหลังสักหน่อย"),
  ]),
  complete("qw_home_nanxian_carrying_pole", NX, [
    say(BAI, "ห้าท่อนพอดี! เอาล่ะ จับไม้คานนี่ ยืนให้มั่น"),
    say(BAI, "ดามอกุนไม่มีอะไรมาก ยกให้สูง ฟาดให้หนัก ใช้หลังไม่ใช่ใช้แขน"),
    nar("ลุงฉายฟาดไม้คานลงตอไม้ ตอไม้แยกเป็นสองซีก แล้วแกก็ร้องโอยกุมหลัง"),
    say(BAI, "...นั่นแหละที่ข้าบอกว่าใช้หลัง จำไว้ อย่าใช้มากเกินเหมือนข้า"),
  ], "รับวิชาและช่วยนวดหลังลุงฉาย"),
  offer("qw_home_nanxian_red_lotus", NX, [
    say(SAGE, "ปราณเจ้าอุ่นขึ้นแล้ว ข้ารู้สึกได้ตั้งแต่เจ้าเดินเข้ามา"),
    say(SAGE, "บัวแดงเพลิงน้อยคือการจุดไฟเล็ก ๆ ในท้องน้อย แล้วเลี้ยงมันเหมือนเลี้ยงบัวในสระ"),
    say(SAGE, "ไปเก็บเม็ดบัวมาสามเม็ด แล้วนั่งสมาธิริมสระหน้าบ้าน ดูบัวให้นานจนเจ้าลืมว่าตัวเองกำลังดูบัว"),
    say(SAGE, "ถ้าเจ้าเผลอหลับ ก็ไม่เป็นไร อาซูหลับทุกครั้ง"),
  ]),
  complete("qw_home_nanxian_red_lotus", NX, [
    say(SAGE, "ใบหน้าเจ้าแดงระเรื่อ ไฟติดแล้ว"),
    say(SAGE, "จำไว้ ไฟน้อยต้องเลี้ยงด้วยลมหายใจยาว อย่าโหมจนไหม้ตัวเอง"),
    nar("ท่านหนานเสียนบดเม็ดบัวผสมชาให้เจ้าดื่ม ความอุ่นแผ่ซ่านจากท้องน้อยขึ้นถึงอก"),
    say(SAGE, "วันหน้าถ้าปราณเจ้าลึกกว่านี้... ข้าอาจเล่าเรื่องกระบี่ให้ฟัง"),
  ]),
  offer("qw_home_nanxian_lonely_sword", NX, [
    say(SAGE, "ยี่สิบปีก่อน ข้ากับไป๋เจี้ยนสาบานเป็นพี่น้องกันที่ฉวนเจิน เราถกกันว่ากระบี่ควรมีเพื่อนหรือไม่"),
    say(SAGE, "เราประลองกันเพื่อหาคำตอบ เขาตกผาไป ข้าสร้างศิลาจารึกให้เขาหลังสำนัก"),
    say(SAGE, "นับแต่นั้นข้าฝึกกระบี่คนเดียว กระบี่ที่ดูดพลังคนอื่นมาเลี้ยงตัว เพราะไม่มีใครเลี้ยงมัน"),
    say(SAGE, "ข้าแก่เกินจะเดินขึ้นไปแล้ว ไปเคารพเขาแทนข้า แล้วข้าจะสอนดาบโดดเดี่ยวให้เจ้า"),
  ], "รับปากจะไปเคารพหลุมศพ"),
  ...fightBeat("qw_home_nanxian_lonely_sword", "masked", NX, "foe_home_nanxian_masked_sword", [
    nar("ดึกสงัด เสียงลำธารเงียบผิดปกติ ชายสวมหน้ากากไม้ยืนบนโขดหินกลางน้ำ กระบี่ในมือไม่สะท้อนแสงจันทร์"),
    say("กระบี่สวมหน้ากาก", "เจ้าคือคนที่ไปขุดศิลาจารึกข้า เจ้าหนานเสียนส่งมาหรือ ตัวเองไม่กล้ามาหรืออย่างไร"),
    say("กระบี่สวมหน้ากาก", "ยี่สิบปีข้ารอให้เขาขึ้นมาหาข้า เขากลับนั่งชงชา"),
    say("กระบี่สวมหน้ากาก", "ดี ข้าจะลองกระบี่กับศิษย์เขาก่อน แล้วค่อยลองกับเขา"),
  ], "ชักอาวุธรับกระบี่", [
    nar("หน้ากากไม้แตกครึ่ง ใบหน้าชายชราผมขาวโผล่ออกมา มีแผลเป็นยาวจากหน้าผากถึงคาง"),
    say("ไป๋เจี้ยน", "ฮ่า... ศิษย์เขาก็ยังเลี้ยงไฟอุ่น ๆ แบบเดียวกัน"),
    say("ไป๋เจี้ยน", "บอกเขาว่าไป๋เจี้ยนยังไม่ตาย และไม่ได้โกรธแล้ว แค่อยากให้เขาลงมาจากหินนั่นบ้าง"),
    nar("ชายชราหายไปในความมืด ทิ้งกระบี่ไม่มีฝักไว้บนโขดหิน"),
  ]),
  complete("qw_home_nanxian_lonely_sword", NX, [
    nar("ท่านหนานเสียนฟังเงียบ ๆ ถ้วยชาในมือสั่นจนน้ำชากระฉอก"),
    say(SAGE, "ไป๋เจี้ยน... เจ้ายังอยู่ เจ้าบ้า เจ้าปล่อยให้ข้าเหงายี่สิบปี"),
    say(SAGE, "ดาบโดดเดี่ยวเกิดจากความเหงา บัดนี้ข้ารู้แล้วว่าข้าไม่ได้โดดเดี่ยว จึงยกมันให้เจ้าได้"),
    say(SAGE, "ใช้มันดูดพลังศัตรูมาเลี้ยงตัว แต่อย่าใช้ชีวิตแบบมัน คนเราต้องมีเพื่อน"),
    say(SAGE, "จี้หยกนี้ไป๋เจี้ยนให้ข้าวันสาบาน เจ้าเก็บไว้ ข้าจะไปหาเขาเอง"),
  ], "รับวิชาและจี้หยก"),

  // ── quest dialogs: home_yideng ──
  offer("qw_home_yideng_one_lamp", YD, [
    say(YIDENG, "ชาวเขาผู้นี้ซี่โครงหักสองซี่ ไข้ขึ้นสูง อาตมาต่อกระดูกแล้ว แต่ยาหมด"),
    say(YIDENG, "สมุนไพรหายากสามต้นพอต้มยาได้สามวัน หาได้ตามป่าเขาหรือในตลาดต้าหลี่"),
    say(YIDENG, "แล้วอยู่เฝ้าไข้กับอาตมาสักคืน ตะเกียงดวงเดียวส่องได้สองคนพอดี"),
  ]),
  complete("qw_home_yideng_one_lamp", YD, [
    say(YIDENG, "อามิตตาพุทธ เขาร้องเรียกหาแม่ แปลว่าใจเขากลับมาแล้ว"),
    say(YIDENG, "โยมนั่งเฝ้าทั้งคืนไม่บ่นสักคำ อาตมาเคยมีขุนนางนับร้อย หาคนแบบนี้ได้ไม่ถึงสิบ"),
    say(YIDENG, "รับยานี้ไว้ วันหนึ่งโยมเองก็อาจต้องมีคนเฝ้าไข้"),
  ], "พนมมือรับ"),
  offer("qw_home_yideng_terrace_wall", YD, [
    say(GENG, "ฮ่า ๆ มาช่วยจริงหรือ! ดี!"),
    say(GENG, "หินห้าก้อน ก้อนเท่าหัวควาย หาได้ตามเหมืองหรือลำธาร แล้วหมูป่าสามตัวที่ชอบมาขุดนา จัดการให้ข้าด้วย"),
    say(GENG, "ทำเสร็จแล้วข้าจะสอนวิธียันกำแพงด้วยฝ่ามือ"),
  ]),
  complete("qw_home_yideng_terrace_wall", YD, [
    nar("ชาวนาเกิงวางหินทีละก้อน แล้วตบฝ่ามือลงบนกำแพง หินทั้งแถวแน่นสนิทเหมือนก่อด้วยปูน"),
    say(GENG, "เห็นไหม! ฝ่ามือสร้างกำแพง ตีออกไปข้างหน้า แต่แรงสะท้อนกลับมาเป็นเกราะให้ตัวเอง"),
    say(GENG, "ลองดู ตบกำแพงข้า... เบา ๆ นะ! เบา ๆ! โอ๊ย ฮ่า ๆ ๆ ดีมาก!"),
  ], "รับวิชาและช่วยก่อกำแพงต่อ"),
  offer("qw_home_yideng_brush_point", YD, [
    say(ZHU, "หมึกเข้มสองแท่ง ข้าจะได้จบกลอน \"แสงตะเกียงไม่...\" ที่ค้างมาสามวัน"),
    say(ZHU, "แล้วเจ้าลองปาเข็มใส่ข้อไผ่หลังบ้านดู ให้ตรงข้อพอดี ไม่ใช่ตรงปล้อง"),
    say(ZHU, "ข้อไผ่ก็เหมือนจุดชีพจร พลาดไปนิดเดียว ไผ่ก็แค่เป็นรู"),
  ]),
  complete("qw_home_yideng_brush_point", YD, [
    say(ZHU, "\"แสงตะเกียงไม่เคยดับ\" ใช่! จบแล้ว! ขอบคุณสำหรับหมึก"),
    say(ZHU, "ส่วนเข็มของเจ้า... ข้อไผ่สั่นแต่ไม่แตก แปลว่าเจ้าจิ้มถูกจุด"),
    say(ZHU, "เข็มตีจุด ปาทีละสี่เม็ด ไม่ต้องฆ่า แค่ทำให้ตาศัตรูพร่า มือเขาก็พลาดเอง"),
    say(ZHU, "เดี๋ยวข้าอ่านกลอนทั้งบทให้ฟังเป็นของขวัญ... อ้าว จะไปแล้วหรือ"),
  ], "รับวิชาแล้วรีบขอตัว"),
  offer("qw_home_yideng_fishhook", YD, [
    say(FISHER, "เป็นเพื่อนข้าแล้ว แขนก็มีแรงแล้ว ดี"),
    say(FISHER, "ก่อนอื่น หาปลาคาร์ปมาสามตัว ข้าตกเองไม่ได้ เพราะปลาที่นี่จำหน้าข้าได้"),
    say(FISHER, "แล้วมายืนรับตะขอข้าสักยก ถ้าไม่ล้มลงน้ำ ข้าสอน"),
  ]),
  ...fightBeat("qw_home_yideng_fishhook", "spar", YD, "spar_home_yideng_fisher", [
    nar("ฤๅษีประมงสะบัดคันเบ็ด สายโซ่เหล็กพร้อมตะขอแหวกอากาศดังหวีด"),
    say(FISHER, "ปลาคาร์ปอร่อยมาก ขอบใจ ทีนี้มาดูว่าเจ้าจะโดนเกี่ยวหรือเปล่า"),
    say(FISHER, "ระวังขา ตะขอข้าชอบเกี่ยวข้อเท้า"),
  ], "ตั้งท่ารับตะขอ", [
    say(FISHER, "ฮึ ไม่ล้มลงน้ำ ไม่ร้องขอชีวิต ใช้ได้"),
    say(FISHER, "มานั่งบนหินนี่ ข้าจะบอกเคล็ดของโซ่เกี่ยว"),
  ]),
  complete("qw_home_yideng_fishhook", YD, [
    say(FISHER, "โซ่เกี่ยวสังหาร ฟาดสองหน หนแรกเกี่ยว หนหลังกระชาก ศัตรูเสียหลักหลบอะไรไม่ได้อีก"),
    say(FISHER, "สมัยข้าเป็นแม่ทัพเรือ ข้าใช้มันเกี่ยวโจรสลัดขึ้นจากน้ำทีละคน เหมือนตกปลา"),
    say(FISHER, "อย่าใช้มันกับปลาในลำธารนี้นะ พวกมันเป็นเพื่อนข้า"),
  ], "รับวิชาโซ่เกี่ยว"),

  // ── quest dialogs: home_tianboguang ──
  offer("qw_home_tianboguang_horse_thieves", TBG, [
    say(CHEN, "ขโมยตัวเล็กสองคน ชอบมาตอนพลบค่ำ ไม่ก็แถวถนนเข้าเมือง"),
    say(CHEN, "ตีให้หมอบก็พอ ไม่ต้องฆ่า มันยังเด็ก ข้าแค่อยากนอนหลับเต็มตาสักคืน"),
  ]),
  complete("qw_home_tianboguang_horse_thieves", TBG, [
    say(CHEN, "สองคน! ดีมาก คืนนี้ข้าได้นอนแล้ว"),
    say(CHEN, "เอาล่ะ ดาบยาวพื้นฐาน จับสองมือ ยกเหนือหัว ฟันลงตรง ๆ อย่าเอียง"),
    nar("ทหารแก่เฉินสาธิตท่าฟันซ้ำสิบครั้ง ครั้งที่สิบเอ็ดดาบหลุดมือปักดินหน้าคอกม้า"),
    say(CHEN, "...มือข้ามันลื่น ไม่ใช่ท่าผิด เจ้าจำท่าสิบครั้งแรกไว้ก็พอ"),
  ], "รับวิชาแล้วเก็บดาบคืนให้"),
  offer("qw_home_tianboguang_vow", TBG, [
    say(TIAN, "ในห่อนี้มีปิ่นทอง สร้อยเงิน กับแหวนหยก ข้าขโมยมาจากร้านเครื่องประดับในซีเซี่ยเมื่อเจ็ดปีก่อน"),
    say(TIAN, "ข้าเข้าเมืองไม่ได้ ทหารยามยังติดภาพวาดข้าอยู่หน้าประตู... แม้จะวาดไม่หล่อเท่าตัวจริง"),
    say(TIAN, "เอาไปวางหน้าร้านตอนเช้ามืด อย่าบอกว่าใครส่ง แค่ให้มันกลับบ้าน"),
  ], "รับห่อผ้าไว้"),
  complete("qw_home_tianboguang_vow", TBG, [
    say(TIAN, "เถ้าแก่ร้องไห้หรือ... ปิ่นของแม่เขา... ข้าไม่รู้เลย"),
    nar("หานเฟยหลางเงียบไปนาน แล้วยกมือขยี้ตา อ้างว่าฝุ่นทะเลทรายเข้าตา"),
    say(TIAN, "รับนี่ไป เงินที่ข้าหามาด้วยการแบกน้ำให้ป้าหลัว สะอาดทุกเหรียญ"),
    say(LUO, "ฮึ! ในที่สุดก็ทำเรื่องดีเป็น คืนนี้ให้กินขาไก่สองขา"),
  ]),
  offer("qw_home_tianboguang_dragon_blade", TBG, [
    say(TIAN, "มีไอ้หัวหน้าโจรตัวหนึ่งปล้นคาราวานแล้วตะโกนว่า \"ข้าคือหานเฟยหลาง!\" ข้าไม่เคยตะโกนชื่อตัวเองตอนปล้น ข้าไม่โง่ขนาดนั้น"),
    say(TIAN, "เจ้าไปจัดการมัน แล้วกลับมารับดาบข้าสักยก ข้าจะออมมือ... ส่วนหนึ่ง"),
    say(TIAN, "ผ่านได้ ข้าสอนดาบยาวมังกร ดาบที่ทำให้ข้าเดินคนเดียวได้หมื่นลี้"),
  ]),
  ...fightBeat("qw_home_tianboguang_dragon_blade", "spar", TBG, "foe_home_tianboguang_holding_back", [
    say(TIAN, "ได้ข่าวแล้ว หัวหน้าโจรนั่นตอนนี้ร้องว่า \"ข้าไม่ใช่หานเฟยหลาง!\" ฮ่า ๆ ดีมาก"),
    say(TIAN, "ทีนี้ตาข้า ดาบข้าเร็ว อย่ากะพริบตา"),
    say(LUO, "ไอ้หาน! ถ้าแขกเลือดออกสักหยด เย็นนี้แกอด!"),
    say(TIAN, "...ได้ยินแล้ว ป้า ข้าออมมือมากขึ้นอีกนิด"),
  ], "ชักอาวุธรับดาบ", [
    say(TIAN, "ฮ่า! รับได้ตั้งหลายดาบ ข้าออมมือแค่ครึ่งเดียวนะ จริง ๆ"),
    say(TIAN, "มานี่ ข้าจะอธิบายว่าทำไมดาบหนักถึงเร็วได้"),
  ]),
  complete("qw_home_tianboguang_dragon_blade", TBG, [
    say(TIAN, "ดาบยาวมังกร ไม่ได้เร็วเพราะแขน เร็วเพราะน้ำหนักดาบพาไป เจ้าแค่ไม่ขวางมัน"),
    say(TIAN, "ฟันลงหนึ่งครั้ง แรงเท่าสองครั้ง เหมือนมังกรสะบัดหาง"),
    say(TIAN, "เมื่อก่อนข้าใช้มันทำเรื่องเลว เจ้าเอาไปใช้ทำเรื่องดีแทนข้าหน่อย จะได้หักลบกัน"),
  ], "รับวิชาดาบยาวมังกร"),

  // ── quest dialogs: home_miaoren ──
  offer("qw_home_miaoren_tiger", MR, [
    say(MIAO, "เสือตัวนั้นเคยโดนพรานยิงธนูเข้าขา มันจึงเลิกล่ากวาง มาล่าแพะที่วิ่งช้ากว่า"),
    say(MIAO, "ข้าจะไปเองก็ได้ แต่ข้าไม่ทิ้งรั่วหลันไว้ลำพัง"),
    say(MIAO, "ไปจัดการมันให้ข้า ชาวบ้านจะได้นอนหลับ"),
  ]),
  complete("qw_home_miaoren_tiger", MR, [
    say(MIAO, "ข้าได้ยินข่าวจากชาวบ้านแล้ว"),
    say(MIAO, "เจ้าทำงานเงียบ ไม่โอ้อวด ข้าชอบคนแบบนี้"),
    say(RUOLAN, "ท่านพ่อพูดว่าชอบ! ท่านพ่อไม่เคยพูดว่าชอบใครเลยนะ"),
    say(MIAO, "...รั่วหลัน ไปเล่นพิณ"),
  ]),
  offer("qw_home_miaoren_new_shaft", MR, [
    say(ZHONG, "ไม้เนื้อแข็งสองท่อน ท่อนหนึ่งทำด้าม ท่อนหนึ่งสำรองไว้ เผื่อข้าแทงแรงเกิน"),
    say(ZHONG, "แล้วมาลองทวนใหม่กับข้าหน้าประตู ข้าจะดูว่าเจ้ายืนได้นานแค่ไหน"),
  ]),
  ...fightBeat("qw_home_miaoren_new_shaft", "spar", MR, "spar_home_miaoren_spearman", [
    nar("ทหารทวนเฒ่าจงหมุนทวนด้ามใหม่สองรอบ เสียงลมหวีด หลังที่ค่อมยืดตรงขึ้นทันที"),
    say(ZHONG, "ด้ามดี! ทีนี้ระวัง แทงหนึ่งหลอก แทงหนึ่งจริง"),
  ], "ตั้งท่ารับทวน", [
    say(ZHONG, "ฮ่า! สามสิบปีแล้วไม่มีใครรับทวนข้าได้ครบยก ยกเว้นท่านเยวี่ย"),
    say(ZHONG, "เจ้าคู่ควรแล้ว มาฟังเคล็ด"),
  ]),
  complete("qw_home_miaoren_new_shaft", MR, [
    say(ZHONG, "ทวนหยินหยาง ปลายทวนคือหยาง ด้ามทวนคือหยิน แทงด้วยปลาย หลอกด้วยด้าม"),
    say(ZHONG, "ศัตรูมองตามปลายทวน ตาเขาก็พร่า ส่วนเจ้ามองที่อกเขาตลอด"),
    say(ZHONG, "ไปเถอะ ข้าจะยืนเฝ้าประตูต่อ ด้วยทวนที่เจ้าหาไม้มาให้"),
  ], "คารวะนายกองจง"),
  offer("qw_home_miaoren_poisoned_cure", MR, [
    say(MIAO, "ตาข้าพร่ามาตั้งแต่ศึกกับหูอีเตา ข้าไม่เคยบอกใคร แต่รั่วหลันรู้"),
    say(MIAO, "มีหมอคนหนึ่งในซีเซี่ยส่งข่าวว่ารักษาได้ จะมาที่บ้านเร็ว ๆ นี้"),
    say(MIAO, "ข้าไม่ไว้ใจคนที่มาเสนอตัวเอง ไปสืบให้ข้าในเมือง แล้วหาโสมให้รั่วหลันต้มยาจริงสำรองไว้"),
    say(MIAO, "ถ้าเรื่องนี้จบด้วยดี กระบี่ตระกูลเยวี่ยท่าหนึ่งจะเป็นของเจ้า"),
  ], "รับปากจะช่วย"),
  ...fightBeat("qw_home_miaoren_poisoned_cure", "doctor", MR, "foe_home_miaoren_poison_doctor", [
    nar("หมอในชุดผ้าฝ้ายสะอาดเกินคนเดินทางไกลมาถึงประตู ถือกล่องยาไม้หอม ยิ้มไม่ถึงตา"),
    say("หมอปลอมมือสังหาร", "ข้ามารักษาตาท่านเยวี่ย ยานี้หยอดสามหยดก็หาย"),
    say(RUOLAN, "ท่านหมอ ยาของท่านกลิ่นเหมือนดอกเมฆดำ... ท่านแม่เคยบอกว่าดอกนี้ทำให้ตาบอด"),
    nar("รอยยิ้มของหมอหายวับ มือหนึ่งล้วงเข็มพิษออกจากแขนเสื้อ"),
    say("หมอปลอมมือสังหาร", "เด็กปากดี! ซุนกุยหลงจ่ายข้าให้เอาตาเยวี่ยเหรินซาน ข้าจะเอาชีวิตพวกเจ้าแถมไปด้วย"),
  ], "ขวางหน้าก่อนเข็มพิษถึงตัวรั่วหลัน", [
    nar("มือสังหารล้มลง กล่องยาไม้หอมแตกกระจาย ผงสีดำหกเต็มพื้น หญ้ารอบ ๆ เหี่ยวทันที"),
    say(RUOLAN, "ท่านช่วยท่านพ่อไว้... ช่วยข้าไว้ด้วย"),
    say(MIAO, "ซุนกุยหลง... ยังไม่เลิกอีก ไปข้างในเถิด ข้ามีเรื่องจะคุย"),
  ]),
  complete("qw_home_miaoren_poisoned_cure", MR, [
    say(MIAO, "ถ้าข้าหยอดยานั่น ข้าคงไม่ได้เห็นหน้ารั่วหลันอีกเลย"),
    say(RUOLAN, "ยาโสมที่ท่านหามา ข้าต้มให้ท่านพ่อแล้ว ท่านพ่อบอกว่าเห็นชัดขึ้นนิดหนึ่ง"),
    say(MIAO, "กระบี่วิเศษ ตระกูลเยวี่ยสืบมาสามชั่วคน ฟันศัตรูแล้วดึงลมปราณเขามาซ่อมบาดแผลตัวเอง"),
    say(MIAO, "ขาต้องไวกว่ากระบี่ กระบี่ถึงจะฟังเจ้า เจ้าไวพอแล้ว"),
    say(MIAO, "ยานี้ข้าเก็บไว้ใช้ยามจำเป็น บัดนี้เจ้าน่าจะจำเป็นกว่าข้า"),
  ], "รับกระบี่วิเศษ"),

];

// ─── activities ────────────────────────────────────────────────────────
const activities: ActivityDef[] = [
  { id: "act_home_nanxian_tea", label: "ชงชาฟังกลอนกับท่านหนานเสียน", badge: "practice", icon: "🍵", hours: 2, stamina: 5,
    description: "นั่งชงชาริมลำธาร ฟังกลอนและคำสอนเรื่องกระบี่ · ฝึกปัญญา",
    place: { locationIds: [NX], cooldownDays: 3, reward: { statXp: "INT", wExp: 10,
      relationship: { npcId: "home_nanxian_sage_nanxian", amount: 1 } },
      doneText: "ชาหมดกาน้ำ กลอนหมดบท ใจเจ้าสงบลงอย่างประหลาด" } },
  { id: "act_home_nanxian_firewood", label: "ช่วยลุงฉายผ่าฟืน", badge: "labor", icon: "🪓", hours: 3, stamina: 15,
    description: "ผ่าฟืนกองโตให้บ้านหนานเสียน · ได้ค่าแรงเล็กน้อยและฝึกพละกำลัง",
    place: { locationIds: [NX], cooldownDays: 1, reward: { gold: [20, 40], statXp: "STR" },
      doneText: "ฟืนกองสูงท่วมหัว ลุงฉายยกนิ้วโป้งให้" } },
  { id: "act_home_yideng_chant", label: "สวดมนต์เย็นกับอู๋เฉินไต้ซือ", badge: "rest", icon: "🪷", hours: 2, stamina: 0,
    description: "นั่งสวดมนต์ใต้แสงตะเกียงดวงเดียว · ฟื้นบาดแผลและใจ",
    place: { locationIds: [YD], cooldownDays: 2, reward: { heal: 0.3, stamina: 15, trait: { trait: "humility", amount: 1 } },
      doneText: "เสียงสวดเงียบลง ความเหนื่อยล้าหายไปพร้อมควันธูป" } },
  { id: "act_home_yideng_fishing", label: "ตกปลาข้างฤๅษีประมง", badge: "fishing", icon: "🎣", hours: 2, stamina: 8,
    description: "นั่งตกปลาริมลำธารเงียบ ๆ ข้างฤๅษีประมง · อาจได้ปลาคาร์ป",
    place: { locationIds: [YD], cooldownDays: 1, reward: { item: { itemId: "fish_carp", count: 1, chance: 0.6 }, statXp: "DEX" },
      doneText: "ฤๅษีประมงพยักหน้า \"มือนิ่งดี\" ทั้งที่ตัวเองยังไม่ได้สักตัว" } },
  { id: "act_home_tianboguang_horses", label: "ช่วยเลี้ยงม้าศึก", badge: "labor", icon: "🐎", hours: 3, stamina: 15,
    description: "ขนหญ้า ตักน้ำ แปรงขนม้าให้ทหารแก่เฉิน · ได้ค่าแรงและฝึกความทรหด",
    place: { locationIds: [TBG], cooldownDays: 1, reward: { gold: [25, 45], statXp: "VIT" },
      doneText: "ม้าศึกเอาจมูกดุนไหล่เจ้า ทหารแก่เฉินบอกว่ามันไม่เคยทำแบบนี้กับใคร" } },
  { id: "act_home_tianboguang_quickdraw", label: "ฝึกชักดาบเร็วกับหานเฟยหลาง", badge: "practice", icon: "⚔️", hours: 2, stamina: 12,
    description: "ฟันเทียนให้ดับโดยไม่ให้ล้ม · ฝึกความว่องไว",
    place: { locationIds: [TBG], cooldownDays: 2, reward: { statXp: "AGI", wExp: 15 },
      doneText: "เทียนเล่มสุดท้ายดับ ไส้ขาดแต่ตัวเทียนยังตั้งอยู่ หานเฟยหลางผิวปากยาว" } },
  { id: "act_home_miaoren_stance", label: "ยืนม้าซ้อมกระบี่ตามท่านเยวี่ย", badge: "practice", icon: "🗡️", hours: 3, stamina: 15,
    description: "ยืนม้าข้างเยวี่ยเหรินซานยามเช้า เลียนท่ากระบี่ช้า ๆ · ฝึกความว่องไว",
    place: { locationIds: [MR], cooldownDays: 2, reward: { statXp: "AGI", wExp: 15,
      relationship: { npcId: "home_miaoren_master_miao", amount: 1 } },
      doneText: "ขาสั่นจนเดินไม่ตรง เยวี่ยเหรินซานพยักหน้าครั้งเดียว ซึ่งนับว่าเป็นคำชม" } },
  { id: "act_home_miaoren_zither", label: "ฟังเยวี่ยรั่วหลิงดีดพิณ", badge: "rest", icon: "🎵", hours: 1, stamina: 0,
    description: "นั่งใต้ต้นหลิวฟังเพลงพิณยามเย็น · ฟื้นพลังเล็กน้อย",
    place: { locationIds: [MR], cooldownDays: 1, reward: { stamina: 10, relationship: { npcId: "home_miaoren_daughter_ruolan", amount: 1 } },
      doneText: "เพลงจบ ลมชายแดนพัดเบาลง รั่วหลันยิ้มอาย ๆ" } },
];


export const CONTENT: PlaceContent = { npcs, quests, scenes, activities, opponents };
