// Towns group: เมืองลิ้งเซียว (city_lingxiao), พระราชวังหลวง (palace_royal)
// and ชนเผ่าหุยซู (tribe_huizu). People, quests, things to do and walk-time
// meetings, plus the ยุทธจักร skills / arts these places pass on:
//   city_lingxiao — t0_fiveyuan (ลุงไป๋), nd10 (หูเตาถ่าน), ne7 (เฝิงหานเหมย), nf8 (ซือหม่าเหยียน)
//   palace_royal  — nc5 (จ้าวเทีย), t2_plumblossom (ชุ่ยเอ๋อ), t3_voidstep (ขันทีเกา)
//   tribe_huizu   — t1_blackiron (ช่างไห่), nd7 (หม่าต้าหลี่), ne11 (นาซีร์)
import type { DialogScene, NpcDef, QuestDef, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const nar = (text: string): SceneLine => ({ t: "narration", text });

const LX = "city_lingxiao";
const PR = "palace_royal";
const HZ = "tribe_huizu";

// Speaker names (must equal the NPC names for portraits).
const BAI = "ลุงไป๋";
const HU = "หูเตาถ่าน";
const FENG = "เฝิงหานเหมย";
const SIMA = "ซือหม่าเหยียน";
const XUE = "เสี่ยวเสวี่ย";
const GAO = "ขันทีเกา";
const ZHAO = "จ้าวเทีย";
const CUI = "ชุ่ยเอ๋อ";
const QIAN = "ขุนนางเฉียน";
const HAI = "ช่างไห่";
const MA = "หม่าต้าหลี่";
const NASIR = "นาซีร์";
const AISHA = "อาอีซา";

// ─── NPCs ─────────────────────────────────────────────────────────────
const NPCS: NpcDef[] = [
  // เมืองลิ้งเซียว — the snowy sky city
  {
    id: "city_lingxiao_sweeper_bai", name: BAI,
    description: "ชายชรากวาดหิมะหน้าประตูเมืองมาสี่สิบหนาว ปากบ่นทั้งวันแต่ใจดีเกินใคร",
    locationIds: [LX], dialogSceneId: "npc_city_lingxiao_sweeper_bai_talk",
    tags: ["elder", "laborer"], look: { body: "elder" },
    likes: ["cooked_meat", "ginseng", "food"], dislikes: ["venom"],
  },
  {
    id: "city_lingxiao_coal_hu", name: HU,
    description: "คนขายถ่านร่างหนา หน้าดำเขม่า หัวเราะเสียงดังจนหิมะบนหลังคาร่วง",
    locationIds: [LX], dialogSceneId: "npc_city_lingxiao_coal_hu_talk",
    tags: ["merchant", "laborer"], look: { body: "m4", wander: true },
    likes: ["wood_hard", "raw_meat", "gold"], dislikes: ["book"],
    stealLoot: [{ itemId: "wood_hard", weight: 5 }, { itemId: "wood_soft", weight: 4 }, { itemId: "ancient_coin", weight: 1 }],
  },
  {
    id: "city_lingxiao_guard_feng", name: FENG,
    description: "หญิงยามประตูหิมะ เย็นชาราวน้ำแข็ง แต่แอบเลี้ยงแมวจรไว้ในป้อมยาม",
    locationIds: [LX], dialogSceneId: "npc_city_lingxiao_guard_feng_talk",
    sparOpponentId: "spar_city_lingxiao_feng", sparFameReward: 5, defenseTier: 2,
    tags: ["guard", "fighter"], look: { body: "f3", wander: true },
    likes: ["snow_lotus", "potion", "herb"], dislikes: ["food"],
  },
  {
    id: "city_lingxiao_scholar_sima", name: SIMA,
    description: "บัณฑิตถูกเนรเทศจากนครหลวง ถือพัดเก่าโบกไฟให้เตาอุ่นทั้งที่หิมะตก กลอนเพราะแต่ยิ้มเศร้า",
    locationIds: [LX], dialogSceneId: "npc_city_lingxiao_scholar_sima_talk",
    tags: ["scholar", "poet"], look: { body: "m1" },
    likes: ["ink", "paper", "silk_fan", "book"], dislikes: ["venom", "raw_meat"],
    stealLoot: [{ itemId: "ink", weight: 4 }, { itemId: "paper", weight: 4 }, { itemId: "alpha_inter", weight: 1 }],
  },
  {
    id: "city_lingxiao_child_xue", name: XUE,
    description: "เด็กหญิงแก้มแดงลูกคนขายซาลาเปา ปาลูกหิมะใส่คนแปลกหน้าเป็นงานอดิเรก",
    locationIds: [LX], dialogSceneId: "npc_city_lingxiao_child_xue_talk",
    tags: ["child"], look: { body: "f1", wander: true },
    likes: ["moon_cake", "food", "fortune_charm"], dislikes: ["herb"],
  },

  // พระราชวังหลวง — court people
  {
    id: "palace_royal_eunuch_gao", name: GAO,
    description: "ขันทีวัยกลางคนผู้ดูแลคลังเสบียง เดินไม่มีเสียงเท้า พูดเบา ยิ้มบาง ไม่มีใครรู้ที่มาของเขา",
    locationIds: [PR], dialogSceneId: "npc_palace_royal_eunuch_gao_talk",
    defenseTier: 3, tags: ["eunuch", "servant", "official"], look: { body: "m3" },
    likes: ["jade", "jade_pendant", "valuable"], dislikes: ["raw_meat"],
    stealLoot: [{ itemId: "ancient_coin", weight: 4 }, { itemId: "silk", weight: 3 }, { itemId: "jade_pendant", weight: 1 }],
  },
  {
    id: "palace_royal_guard_zhao", name: ZHAO,
    description: "ทหารองครักษ์หนุ่มจากชนบท ตัวโตใจซื่อ ถือทวนเฝ้าระเบียงวังพลางคิดถึงบ้านนา",
    locationIds: [PR], dialogSceneId: "npc_palace_royal_guard_zhao_talk",
    sparOpponentId: "spar_palace_royal_zhao", sparFameReward: 3, defenseTier: 1,
    tags: ["guard", "soldier", "fighter"], look: { body: "m2", wander: true },
    likes: ["cooked_meat", "rice_dish", "warrior_belt"], dislikes: ["book"],
  },
  {
    id: "palace_royal_maid_cui", name: CUI,
    description: "นางกำนัลช่างเจรจา รู้ข่าวลือทุกตำหนัก แอบนำยาไปให้พระสนมชราในตำหนักเย็นทุกคืน",
    locationIds: [PR], dialogSceneId: "npc_palace_royal_maid_cui_talk",
    tags: ["servant", "maid"], look: { body: "f2", wander: true },
    likes: ["silk", "moon_cake", "jade_pendant"], dislikes: ["venom", "raw_meat"],
  },
  {
    id: "palace_royal_official_qian", name: QIAN,
    description: "ขุนนางกรมพิธีการ ท้องพลุ้ย พูดจาอ้อมค้อม รักหน้าตามากกว่าความจริง",
    locationIds: [PR], dialogSceneId: "npc_palace_royal_official_qian_talk",
    defenseTier: 2, tags: ["official", "noble"], look: { body: "merchant" },
    likes: ["gold", "valuable", "alpha_master"], dislikes: ["material"],
    stealLoot: [{ itemId: "ancient_coin", weight: 5 }, { itemId: "silk", weight: 3 }, { itemId: "jade", weight: 1 }, { itemId: "gold_ring", weight: 1 }],
  },

  // ชนเผ่าหุยซู — the Hui tribe of the west
  {
    id: "tribe_huizu_smith_hai", name: HAI,
    description: "ช่างตีเหล็กชราแห่งเผ่าหุย มือหยาบดังหนังอูฐ ตีเหล็กพลางท่องบทสวดเบา ๆ",
    locationIds: [HZ], dialogSceneId: "npc_tribe_huizu_smith_hai_talk",
    defenseTier: 2, tags: ["smith", "elder", "craftsman"], look: { body: "elder" },
    likes: ["iron_ore", "iron_ingot", "spicy_stew"], dislikes: ["rice_dish"],
    stealLoot: [{ itemId: "iron_ingot", weight: 4 }, { itemId: "iron_ore", weight: 4 }, { itemId: "iron_blade", weight: 1 }],
  },
  {
    id: "tribe_huizu_wrestler_ma", name: MA,
    description: "นักมวยปล้ำแชมป์เผ่า ไหล่กว้างเท่าประตูกระโจม ชอบท้าคนแปลกหน้าแล้วเลี้ยงชาเมื่อแพ้",
    locationIds: [HZ], dialogSceneId: "npc_tribe_huizu_wrestler_ma_talk",
    sparOpponentId: "spar_tribe_huizu_ma", sparFameReward: 3, defenseTier: 1,
    tags: ["fighter", "herder"], look: { body: "m2", wander: true },
    likes: ["raw_meat", "cooked_meat", "warrior_belt"], dislikes: ["rice_dish", "book"],
  },
  {
    id: "tribe_huizu_caravan_nasir", name: NASIR,
    description: "หัวหน้าคาราวานผู้ผ่านทะเลทรายมาร้อยเที่ยว แผลกรงเล็บสิงห์บนแขนคือเรื่องที่เขาเล่าไม่เคยซ้ำกัน",
    locationIds: [HZ], dialogSceneId: "npc_tribe_huizu_caravan_nasir_talk",
    sparOpponentId: "spar_tribe_huizu_nasir", sparFameReward: 5, defenseTier: 2,
    tags: ["merchant", "guard", "fighter"], look: { body: "m1" },
    likes: ["tiger_claw", "fur_pelt", "leather", "gold"], dislikes: ["rice_dish"],
    stealLoot: [{ itemId: "fur_pelt", weight: 4 }, { itemId: "silk", weight: 3 }, { itemId: "ancient_coin", weight: 2 }],
  },
  {
    id: "tribe_huizu_herder_aisha", name: AISHA,
    description: "เด็กหญิงเลี้ยงแกะผ้าคลุมผมสีส้ม นับแกะได้ทุกตัวแต่ลืมทางกลับกระโจมเป็นประจำ",
    locationIds: [HZ], dialogSceneId: "npc_tribe_huizu_herder_aisha_talk",
    tags: ["child", "herder"], look: { body: "f1", wander: true },
    likes: ["moon_cake", "fortune_charm", "food"], dislikes: ["rice_dish"],
  },
];

// ─── Opponents (spars and quest foes) ─────────────────────────────────
const OPPONENTS: StoryOpponentSpec[] = [
  { id: "spar_city_lingxiao_feng", name: FENG, ti: 2, look: { sheet: "f3" },
    stats: { POW: 6, INT: 4, AGI: 3 }, skillIds: ["ne7", "nc4", "nd12"] },
  { id: "opp_city_lingxiao_red_veil", name: "หญิงผ้าคลุมแดง", ti: 3, look: { sheet: "f4", tint: 0xffb0a0 },
    stats: { POW: 8, INT: 8, AGI: 5 }, skillIds: ["nf8", "ne4", "nd2"], artId: "t1_redlotus", artLevel: 6 },
  { id: "spar_palace_royal_zhao", name: ZHAO, ti: 1, look: { sheet: "m2" },
    stats: { STR: 5, VIT: 4 }, skillIds: ["nc5", "nd4"] },
  { id: "opp_palace_royal_shadow", name: "เงาไร้รอยรุ่นสอง", ti: 3, look: { sheet: "m1", tint: 0x8a8aa8 },
    stats: { AGI: 9, DEX: 7, LUK: 4 }, skillIds: ["nd9", "nf4", "gn"], artId: "t3_voidstep", artLevel: 6 },
  { id: "spar_tribe_huizu_ma", name: MA, ti: 1, look: { sheet: "m2" },
    stats: { STR: 6, VIT: 5 }, skillIds: ["nd7", "nc4"] },
  { id: "spar_tribe_huizu_nasir", name: NASIR, ti: 2, look: { sheet: "m1" },
    stats: { STR: 6, DEX: 5, AGI: 3 }, skillIds: ["ne11", "nd10", "na2"] },
];

// ─── Quests ───────────────────────────────────────────────────────────
const QUESTS: QuestDef[] = [
  // ── เมืองลิ้งเซียว ──
  {
    id: "qc_city_lingxiao_snow_sweep", type: "side",
    name: "ไม้กวาดห้าธาตุ",
    description: "ลุงไป๋ปวดหลังจนกวาดหิมะไม่ไหว ขอให้ช่วยกวาดแทนสักเช้า แล้วจะสอนวิชาที่ซ่อนอยู่ในท่ากวาดให้",
    briefSummary: "กวาดหิมะหน้าประตูเมืองและบันไดหอกลองแทนลุงไป๋",
    giverNpcId: "city_lingxiao_sweeper_bai",
    stages: [
      { id: "sweep", description: "กวาดหิมะหน้าประตูเมืองและบันไดหอกลองแห่งเมืองลิ้งเซียว",
        objective: { spots: [
          { locationId: LX, label: "กวาดหิมะหน้าประตูเมือง", text: "เจ้ากวาดหิมะตามจังหวะที่ลุงไป๋สอน ซ้าย ขวา หมุนเอว ก้าวถอย เหงื่อออกทั้งที่หนาวจัด" },
          { locationId: LX, label: "เกลี่ยหิมะบนบันไดหอกลอง", text: "บันไดสามสิบขั้นสะอาดเอี่ยม เจ้ารู้สึกว่าลมหายใจเข้าจังหวะกับไม้กวาดอย่างประหลาด" },
        ] } },
      { id: "return", description: "กลับไปหาลุงไป๋ที่ประตูเมือง" },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "learnArt", artId: "t0_fiveyuan", level: 1 },
      { t: "npcRelationship", npcId: "city_lingxiao_sweeper_bai", amount: 10 },
    ],
  },
  {
    id: "qc_city_lingxiao_brazier", type: "side",
    name: "เตาไฟสามมุมเมือง",
    description: "พายุหิมะใกล้มา หูเตาถ่านต้องจุดเตาผิงสาธารณะสามมุมเมือง แต่ถ่านไม้แข็งหมดเกลี้ยง",
    briefSummary: "หาไม้เนื้อแข็ง 3 ท่อนให้หูเตาถ่าน แล้วช่วยจุดเตาสามมุมเมือง",
    giverNpcId: "city_lingxiao_coal_hu",
    prereqs: { t: "statAtLeast", stat: "STR", min: 10 },
    stages: [
      { id: "wood", description: "หาไม้เนื้อแข็ง 3 ท่อนมาให้หูเตาถ่าน",
        autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 3 } },
      { id: "light", description: "จุดเตาผิงสาธารณะสามมุมเมืองลิ้งเซียว",
        objective: { spots: [
          { locationId: LX, label: "จุดเตาผิงมุมตลาด", text: "ไฟลุกพรึ่บ แม่ค้าซาลาเปาปรบมือ เด็ก ๆ วิ่งมายื่นมือผิง" },
          { locationId: LX, label: "จุดเตาผิงหน้าศาลเจ้า", text: "ลมหิมะตีไฟจนเกือบดับ เจ้าตะปบถ่านด้วยมือเปล่าตามที่หูสอน ร้อนแต่ไม่ไหม้" },
          { locationId: LX, label: "จุดเตาผิงใต้ป้อมยาม", text: "ยามหญิงพยักหน้าขอบคุณเพียงนิด แต่แมวในป้อมรีบมานอนข้างเตาทันที" },
        ] } },
      { id: "return", description: "กลับไปบอกหูเตาถ่านว่าเตาทั้งสามติดแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 100 },
      { t: "learnSkill", skillId: "nd10" },
      { t: "npcRelationship", npcId: "city_lingxiao_coal_hu", amount: 10 },
    ],
  },
  {
    id: "qc_city_lingxiao_ice_palm", type: "side",
    name: "ฝ่ามือใต้ลมหนาว",
    description: "เฝิงหานเหมยบอกว่าวิชาลึกลับเรียนจากตำราไม่ได้ ต้องยืนเวรกลางพายุหิมะทั้งคืนก่อน แล้วรับฝ่ามือของนางให้ได้",
    briefSummary: "ยืนเวรกลางพายุหิมะ แล้วประลองชนะเฝิงหานเหมย",
    giverNpcId: "city_lingxiao_guard_feng",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 15 },
      { t: "npcRelationship", npcId: "city_lingxiao_guard_feng", min: 5 },
    ] },
    stages: [
      { id: "night_watch", description: "ยืนเวรยามที่ประตูหิมะของเมืองลิ้งเซียวตลอดคืน",
        objective: { hours: 4, spots: [
          { locationId: LX, label: "ยืนเวรกลางพายุหิมะ", text: "ทั้งคืนเจ้ายืนนิ่งให้หิมะพอกไหล่ เมื่อฟ้าสาง ฝ่ามือเย็นเฉียบแต่ลมปราณกลับไหลลื่นกว่าเคย" },
        ] } },
      { id: "spar", description: "ประลองฝีมือให้ชนะเฝิงหานเหมย",
        autoAdvance: { t: "defeatedOpponent", opponentId: "spar_city_lingxiao_feng", count: 1 } },
      { id: "return", description: "กลับไปคุยกับเฝิงหานเหมยที่ป้อมยาม" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnSkill", skillId: "ne7" },
      { t: "npcRelationship", npcId: "city_lingxiao_guard_feng", amount: 10 },
    ],
  },
  {
    id: "qc_city_lingxiao_poem_ink", type: "side",
    name: "หมึกแข็งตัวในเมืองหิมะ",
    description: "หมึกของบัณฑิตซือหม่าเหยียนแข็งเป็นก้อนน้ำแข็ง เขาอยากเขียนกลอนปลอบใจชาวเมืองก่อนพายุใหญ่",
    briefSummary: "หาหมึก 2 แท่งและกระดาษ 3 แผ่น แล้วไปอ่านกลอนที่ลานตลาด",
    giverNpcId: "city_lingxiao_scholar_sima",
    stages: [
      { id: "supplies", description: "หาหมึกเข้ม 2 แท่งและกระดาษสา 3 แผ่นมาให้ซือหม่าเหยียน",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "ink", count: 2 },
          { t: "hasItem", itemId: "paper", count: 3 },
        ] } },
      { id: "recite", description: "นำกลอนของซือหม่าเหยียนไปอ่านให้ชาวเมืองฟังที่ลานตลาด",
        objective: { spots: [
          { locationId: LX, label: "อ่านกลอนที่ลานตลาด", text: "\"หิมะทับหลังคาได้ ทับใจคนไม่ได้\" ชาวเมืองเงียบไปครู่หนึ่ง แล้วมีคนยื่นชาร้อนให้เจ้า" },
        ] } },
      { id: "return", description: "กลับไปเล่าให้ซือหม่าเหยียนฟัง" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "city_lingxiao_scholar_sima", amount: 10 },
    ],
  },
  {
    id: "qc_city_lingxiao_heaven_fan", type: "side",
    name: "พัดเพลิงกลางหิมะ",
    description: "พัดเก่าของซือหม่าเหยียนขาดวิ่น เขาจะซ่อมมันแล้วถ่ายทอดวิชาลึกลับให้ แต่มีเงาแดงคอยตามพัดเล่มนั้นอยู่",
    briefSummary: "ซ่อมพัดเพลิงของซือหม่าเหยียน และเผชิญหน้ากับหญิงผ้าคลุมแดงที่ตามล่ามัน",
    giverNpcId: "city_lingxiao_scholar_sima",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "INT", min: 25 },
      { t: "npcRelationship", npcId: "city_lingxiao_scholar_sima", min: 15 },
      { t: "questStatus", questId: "qc_city_lingxiao_poem_ink", status: "done" },
    ] },
    stages: [
      { id: "materials", description: "หาบัวหิมะ 1 ดอกและผ้าไหม 2 ผืนเพื่อซ่อมพัดของซือหม่าเหยียน",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "snow_lotus", count: 1 },
          { t: "hasItem", itemId: "silk", count: 2 },
        ] } },
      { id: "ambush", description: "เฝ้าเรือนพักของซือหม่าเหยียนยามดึก จับเงาแดงที่ลอบเข้ามา",
        objective: { spots: [
          { locationId: LX, label: "ซุ่มเฝ้าเรือนบัณฑิตยามดึก", sceneId: "qd_qc_city_lingxiao_heaven_fan_ambush" },
        ] } },
      { id: "truth", description: "ถามความจริงจากซือหม่าเหยียน",
        objective: { spots: [
          { locationId: LX, label: "ถามความจริงเรื่องพัด", npcId: "city_lingxiao_scholar_sima", sceneId: "qd_qc_city_lingxiao_heaven_fan_truth" },
        ] } },
      { id: "return", description: "รับพัดที่ซ่อมเสร็จจากซือหม่าเหยียน" },
    ],
    rewards: [
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "silk_fan", count: 1 },
      { t: "learnSkill", skillId: "nf8" },
      { t: "npcRelationship", npcId: "city_lingxiao_scholar_sima", amount: 15 },
    ],
  },

  // ── พระราชวังหลวง ──
  {
    id: "qc_palace_royal_spear_patrol", type: "side",
    name: "เวรยามแทนจ้าวเทีย",
    description: "จ้าวเทียได้จดหมายจากบ้าน แต่ติดเวรยามจนไม่มีเวลาอ่าน เขาขอให้ช่วยเดินตรวจแทนหนึ่งรอบ",
    briefSummary: "เดินตรวจระเบียงวังสองจุดแทนจ้าวเทีย",
    giverNpcId: "palace_royal_guard_zhao",
    stages: [
      { id: "patrol", description: "เดินตรวจระเบียงตะวันออกและประตูสวนหลวงแทนจ้าวเทีย",
        objective: { spots: [
          { locationId: PR, label: "ตรวจระเบียงตะวันออก", text: "เจ้าถือทวนของจ้าวเทียเดินตรวจ ทวนหนักกว่าที่คิด ต้องใช้เอวพาไม่ใช่แขน" },
          { locationId: PR, label: "ตรวจประตูสวนหลวง", text: "ไม่มีอะไรผิดปกติ นอกจากนางกำนัลสองคนที่หัวเราะคิกคักเมื่อเห็นท่าถือทวนของเจ้า" },
        ] } },
      { id: "return", description: "คืนทวนให้จ้าวเทียที่ระเบียงวัง" },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "learnSkill", skillId: "nc5" },
      { t: "npcRelationship", npcId: "palace_royal_guard_zhao", amount: 10 },
    ],
  },
  {
    id: "qc_palace_royal_rat_store", type: "side",
    name: "หนูในคลังหลวง",
    description: "ขันทีเกาต้องต้มน้ำแกงโสมถวายพระพันปี แต่หนูกัดโสมในคลังจนเหลือแต่ราก",
    briefSummary: "หาโสม 2 รากให้ขันทีเกา แล้วไล่หนูในคลังเสบียง",
    giverNpcId: "palace_royal_eunuch_gao",
    stages: [
      { id: "ginseng", description: "หาโสม 2 รากมาให้ขันทีเกา",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 2 } },
      { id: "rats", description: "ไล่หนูในคลังเสบียงของพระราชวังหลวง",
        objective: { hours: 2, spots: [
          { locationId: PR, label: "อุดรูหนูในคลังเสบียง", text: "เจ้าอุดรูได้เจ็ดรู แต่สังเกตเห็นรอยเท้าคนเบาหวิวบนฝุ่นคานเพดาน ซึ่งหนูทำไม่ได้แน่" },
          { locationId: PR, label: "ไล่หนูออกจากกองข้าวสาร", text: "หนูตัวโตกระโจนหนี เจ้าหันไปเห็นขันทีเกายืนอยู่ข้างหลังตั้งแต่เมื่อไรไม่รู้ ไม่มีเสียงเท้าสักนิด" },
        ] } },
      { id: "return", description: "กลับไปรายงานขันทีเกา" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "palace_royal_eunuch_gao", amount: 10 },
    ],
  },
  {
    id: "qc_palace_royal_plum_garden", type: "side",
    name: "ดอกเหมยในตำหนักเย็น",
    description: "ชุ่ยเอ๋อแอบนำยาไปให้พระสนมชราในตำหนักเย็นทุกคืน แต่คืนหลัง ๆ มีมือมีดซุ่มอยู่ในสวนเหมย",
    briefSummary: "หาสมุนไพรให้พระสนมชรา และปราบมือมีดในสวนเหมย",
    giverNpcId: "palace_royal_maid_cui",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 15 },
      { t: "npcRelationship", npcId: "palace_royal_maid_cui", min: 5 },
    ] },
    stages: [
      { id: "herbs", description: "หาสมุนไพรหายาก 3 ต้นมาให้ชุ่ยเอ๋อ",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 3 } },
      { id: "garden", description: "คุ้มกันชุ่ยเอ๋อผ่านสวนเหมยไปตำหนักเย็นยามดึก",
        objective: { spots: [
          { locationId: PR, label: "คุ้มกันชุ่ยเอ๋อผ่านสวนเหมย", sceneId: "qd_qc_palace_royal_plum_garden_ambush" },
        ] } },
      { id: "return", description: "กลับไปหาชุ่ยเอ๋อ" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t2_plumblossom", level: 1 },
      { t: "npcRelationship", npcId: "palace_royal_maid_cui", amount: 10 },
    ],
  },
  {
    id: "qc_palace_royal_void_step", type: "side",
    name: "เงาไร้รอยสองรุ่น",
    description: "มีขโมยเดินบนหลังคาหอสมบัติโดยไม่ทิ้งรอย ขันทีเกาขอให้ช่วยจับ เขาดูรู้จักฝีเท้านี้ดีเกินไป",
    briefSummary: "ตามรอยขโมยไร้เงาในวังหลวง และค้นความลับของขันทีเกา",
    giverNpcId: "palace_royal_eunuch_gao",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "AGI", min: 25 },
      { t: "npcRelationship", npcId: "palace_royal_eunuch_gao", min: 15 },
      { t: "questStatus", questId: "qc_palace_royal_rat_store", status: "done" },
    ] },
    stages: [
      { id: "traces", description: "สืบรอยขโมยบนหลังคาหอสมบัติและที่ประตูทิศเหนือของพระราชวังหลวง",
        objective: { spots: [
          { locationId: PR, label: "สำรวจหลังคาหอสมบัติ", text: "กระเบื้องไม่แตกสักแผ่น ฝุ่นไม่ถูกกวน มีเพียงรอยเท้าครึ่งเสี้ยวที่ปลายชายคา เหมือนคนเหยียบอากาศ" },
          { locationId: PR, label: "ถามยามประตูทิศเหนือ", text: "ยามเล่าว่าเห็นเงาดำผ่านไปเมื่อคืน \"เร็วเหมือนขันทีเกาตอนหนุ่มเลย\" แล้วรีบเอามือปิดปาก" },
        ] } },
      { id: "bait", description: "หาหยกล้ำค่า 1 ก้อนมาให้ขันทีเกาใช้เป็นเหยื่อล่อ",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 1 } },
      { id: "ambush", description: "ซุ่มรอขโมยที่หอสมบัติยามเที่ยงคืน",
        objective: { spots: [
          { locationId: PR, label: "ซุ่มรอที่หอสมบัติ", sceneId: "qd_qc_palace_royal_void_step_ambush" },
        ] } },
      { id: "return", description: "กลับไปเผชิญหน้ากับขันทีเกา" },
    ],
    rewards: [
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "fortune_charm", count: 1 },
      { t: "learnArt", artId: "t3_voidstep", level: 1 },
      { t: "npcRelationship", npcId: "palace_royal_eunuch_gao", amount: 15 },
    ],
  },

  // ── ชนเผ่าหุยซู ──
  {
    id: "qc_tribe_huizu_black_iron", type: "side",
    name: "ลมหายใจของเตาหลอม",
    description: "ช่างไห่จะหลอมเหล็กดำให้คาราวาน แต่แร่ไม่พอและเครื่องเป่าลมต้องใช้คนลมหายใจยาว",
    briefSummary: "หาแร่เหล็ก 3 ก้อนให้ช่างไห่ แล้วสูบเครื่องเป่าลมเตาหลอม",
    giverNpcId: "tribe_huizu_smith_hai",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "ore", description: "หาแร่เหล็ก 3 ก้อนมาให้ช่างไห่",
        autoAdvance: { t: "hasItem", itemId: "iron_ore", count: 3 } },
      { id: "bellows", description: "สูบเครื่องเป่าลมเตาหลอมของช่างไห่จนเหล็กกลายเป็นสีดำ",
        objective: { hours: 2, spots: [
          { locationId: HZ, label: "สูบเครื่องเป่าลมเตาหลอม", text: "สูบเข้าช้า ปล่อยออกยาว ตามจังหวะค้อนของช่างไห่ เหล็กแดงค่อย ๆ หม่นเป็นสีดำมัน ลมปราณในท้องเจ้าก็หนักแน่นขึ้น" },
        ] } },
      { id: "return", description: "กลับไปหาช่างไห่ที่โรงตีเหล็ก" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 100 },
      { t: "learnArt", artId: "t1_blackiron", level: 1 },
      { t: "npcRelationship", npcId: "tribe_huizu_smith_hai", amount: 10 },
    ],
  },
  {
    id: "qc_tribe_huizu_tiger_palm", type: "side",
    name: "วิชาลึกลับหน้ากระโจม",
    description: "นักรบทะเลทรายมาข่มขู่เก็บค่าผ่านทางจากเผ่า หม่าต้าหลี่อยากรู้ว่าเจ้าแข็งพอจะรับวิชาลึกลับหรือเปล่า",
    briefSummary: "ปราบนักรบทะเลทราย 3 คนแล้วกลับไปหาหม่าต้าหลี่",
    giverNpcId: "tribe_huizu_wrestler_ma",
    prereqs: { t: "statAtLeast", stat: "STR", min: 10 },
    stages: [
      { id: "raiders", description: "ปราบนักรบทะเลทราย 3 คนที่ข่มขู่ชนเผ่าหุยซู",
        autoAdvance: { t: "defeatedOpponent", opponentId: "desert_marauder", count: 3 } },
      { id: "return", description: "กลับไปหาหม่าต้าหลี่หน้ากระโจม" },
    ],
    rewards: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 100 },
      { t: "learnSkill", skillId: "nd7" },
      { t: "npcRelationship", npcId: "tribe_huizu_wrestler_ma", amount: 10 },
    ],
  },
  {
    id: "qc_tribe_huizu_lion_claw", type: "side",
    name: "วิชาลึกลับแห่งเส้นทางคาราวาน",
    description: "ฝูงหมาป่าหิมะลงจากเขามาขย้ำอูฐคาราวาน นาซีร์จะสอนวิชาลึกลับให้คนที่ทั้งไล่ฝูงหมาป่าได้และรับมือเขาได้",
    briefSummary: "ปราบหมาป่าหิมะ แล้วประลองชนะนาซีร์",
    giverNpcId: "tribe_huizu_caravan_nasir",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: "tribe_huizu_caravan_nasir", min: 5 },
    ] },
    stages: [
      { id: "wolves", description: "ปราบหมาป่าหิมะที่ขย้ำอูฐคาราวาน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "frost_wolf", count: 1 } },
      { id: "spar", description: "ประลองฝีมือให้ชนะนาซีร์",
        autoAdvance: { t: "defeatedOpponent", opponentId: "spar_tribe_huizu_nasir", count: 1 } },
      { id: "return", description: "กลับไปคุยกับนาซีร์ที่ลานคาราวาน" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnSkill", skillId: "ne11" },
      { t: "npcRelationship", npcId: "tribe_huizu_caravan_nasir", amount: 10 },
    ],
  },
  {
    id: "qc_tribe_huizu_lost_lambs", type: "side",
    name: "ลูกแกะสามตัว",
    description: "อาอีซานับแกะได้ขาดไปสามตัว ถ้ากลับกระโจมไปไม่ครบ แม่จะไม่ให้กินขนม",
    briefSummary: "ตามหาลูกแกะสามตัวของอาอีซารอบชนเผ่า",
    giverNpcId: "tribe_huizu_herder_aisha",
    stages: [
      { id: "search", description: "ตามหาลูกแกะสามตัวรอบชนเผ่าหุยซู",
        objective: { spots: [
          { locationId: HZ, label: "ค้นหลังกองฟาง", text: "ลูกแกะตัวแรกนอนหลับอุตุอยู่ในกองฟาง เจ้าอุ้มมันขึ้นมาทั้งที่มันยังกรน" },
          { locationId: HZ, label: "ส่องใต้เกวียนคาราวาน", text: "ตัวที่สองกำลังเคี้ยวเชือกผูกเกวียนของนาซีร์อย่างเพลิดเพลิน" },
          { locationId: HZ, label: "ไล่ตามเสียงร้องริมบ่อน้ำ", text: "ตัวที่สามติดอยู่ในพุ่มหนาม เจ้าแกะมันออกมาได้พร้อมรอยข่วนเต็มแขน" },
        ] } },
      { id: "return", description: "พาลูกแกะกลับไปคืนอาอีซา" },
    ],
    rewards: [
      { t: "gold", amount: 60 },
      { t: "wExp", amount: 20 },
      { t: "trait", trait: "good", amount: 1 },
      { t: "npcRelationship", npcId: "tribe_huizu_herder_aisha", amount: 15 },
    ],
  },
];

// ─── Dialog scenes ────────────────────────────────────────────────────
const back = (loc: string, text = "ลาก่อน") => ({ text, next: loc });

const TALK_SCENES: DialogScene[] = [
  // ลุงไป๋
  { kind: "dialog", id: "npc_city_lingxiao_sweeper_bai_talk", lines: [
    say(BAI, "หลบ ๆ หน่อยพ่อคุณ เดี๋ยวหิมะกองนี้ก็ทับเท้าเจ้าหรอก"),
    say(BAI, "สี่สิบหนาวแล้วที่ข้ากวาดประตูนี้ ประตูยังอยู่ ข้าก็ยังอยู่ หิมะก็ยังตก ฮ่า"),
    nar("ไม้กวาดในมือเขาเคลื่อนเป็นวงกลมสม่ำเสมอ ราวกับร่ายรำมากกว่าทำงาน"),
    say(BAI, "คนหนุ่มสมัยนี้อยากได้วิชาสูงส่ง ไม่มีใครอยากกวาดหิมะสักคน"),
  ], choices: [
    { text: "ท่าที่ลุงกวาดดูไม่ธรรมดาเลย", next: "npc_city_lingxiao_sweeper_bai_more" },
    back(LX),
  ] },
  { kind: "dialog", id: "npc_city_lingxiao_sweeper_bai_more", lines: [
    say(BAI, "ตาดีนี่! ตอนหนุ่มข้าเคยเป็นศิษย์รับใช้สำนักหนึ่ง ได้แค่ห้าธาตุพื้นฐานติดตัวมา"),
    say(BAI, "ไม้ ไฟ ดิน ทอง น้ำ ซ้าย ขวา หมุน ถอย ก้าว ทุกท่ากวาดหิมะก็คือห้าธาตุนั่นแหละ"),
    say(BAI, "แต่หลังข้าไม่ดีแล้ว ถ้ามีใครกวาดแทนสักเช้า ข้าจะสอนให้ฟรี ๆ เลย"),
  ], choices: [back(LX, "ไว้จะมาช่วยนะลุง")] },

  // หูเตาถ่าน
  { kind: "dialog", id: "npc_city_lingxiao_coal_hu_talk", lines: [
    say(HU, "ถ่านร้อน ๆ จ้า! ถ่านไม้แข็งเผาทั้งคืนไม่มอด! อ้าว ลูกค้าหน้าใหม่"),
    say(HU, "เมืองนี้หนาวจนน้ำลายแข็งก่อนถึงพื้น ไม่มีถ่านข้า คนตายไปครึ่งเมืองแล้ว ฮ่า ๆ"),
    nar("เขายื่นมือเปล่าเข้าไปคีบถ่านแดงออกจากเตา ราวกับหยิบซาลาเปา"),
  ], choices: [
    { text: "มือท่านไม่ร้อนหรือ", next: "npc_city_lingxiao_coal_hu_more" },
    back(LX),
  ] },
  { kind: "dialog", id: "npc_city_lingxiao_coal_hu_more", lines: [
    say(HU, "ร้อนสิ! แต่ข้าฝึกกรงเล็บเพลิงมาตั้งแต่เด็ก พ่อข้าบอกว่าคนขายถ่านต้องมือไวกว่าไฟ"),
    say(HU, "ปีนี้พายุมาเร็ว ไม้แข็งก็ขาด เตาผิงสาธารณะสามมุมเมืองยังไม่ได้จุดเลย"),
    say(HU, "ถ้าแขนเจ้าแข็งแรงพอจะแบกไม้ ข้าจะสอนวิธีคีบไฟไม่ให้มือไหม้"),
  ], choices: [back(LX, "ข้าจะลองดู")] },

  // เฝิงหานเหมย
  { kind: "dialog", id: "npc_city_lingxiao_guard_feng_talk", lines: [
    say(FENG, "ชื่อ ที่มา ธุระ ตอบสั้น ๆ"),
    nar("นางจ้องเจ้าด้วยสายตาเย็นกว่าหิมะ แต่มีขนแมวสีส้มติดอยู่บนแขนเสื้อ"),
    say(FENG, "เมืองลิ้งเซียวไม่ชอบคนแปลกหน้า และไม่ชอบคนที่มองแขนเสื้อข้านาน ๆ"),
    say(FENG, "ถ้าไม่มีธุระก็อย่าขวางทางลม"),
  ], choices: [
    { text: "แมวในป้อมยามชื่ออะไร", next: "npc_city_lingxiao_guard_feng_cat" },
    { text: "ได้ยินว่าท่านใช้ฝ่ามือน้ำแข็ง", next: "npc_city_lingxiao_guard_feng_palm" },
    back(LX),
  ] },
  { kind: "dialog", id: "npc_city_lingxiao_guard_feng_cat", lines: [
    say(FENG, "...ซาลาเปา"),
    say(FENG, "อย่าบอกใคร ถ้าหัวหน้ายามรู้ เขาจะเอามันไปไล่หนูในโรงเสบียง มันขี้เกียจเกินกว่าจะไล่หนู"),
    nar("มุมปากนางกระตุกขึ้นนิดหนึ่ง แล้วก็กลับเป็นน้ำแข็งเหมือนเดิม"),
  ], choices: [{ text: "ความลับของเรา", effects: [{ t: "addNpcRelationship", npcId: "city_lingxiao_guard_feng", amount: 2 }], next: LX }] },
  { kind: "dialog", id: "npc_city_lingxiao_guard_feng_palm", lines: [
    say(FENG, "ฝ่ามือน้ำแข็งไม่ได้มาจากตำรา มันมาจากการยืนให้ลมหนาวกัดกระดูกทุกคืน"),
    say(FENG, "ลมปราณต้องแน่นพอจะไม่แข็งตายเสียก่อน และใจต้องนิ่งพอจะไม่หนีกลับบ้าน"),
    say(FENG, "ข้าไม่สอนคนที่ข้าไม่ไว้ใจ ถ้าอยากเรียน ทำให้ข้าไว้ใจก่อน"),
  ], choices: [back(LX, "จะจำไว้")] },

  // ซือหม่าเหยียน
  { kind: "dialog", id: "npc_city_lingxiao_scholar_sima_talk", lines: [
    say(SIMA, "\"ฟ้าสูงแผ่นดินกว้าง หิมะขาวกลบรอยเท้า\" อา ท่านผู้มาเยือน เชิญนั่งผิงไฟก่อน"),
    nar("เขาโบกพัดเก่าขาดวิ่นเบา ๆ ถ่านในเตาก็แดงวาบขึ้นทุกครั้งที่พัดผ่าน"),
    say(SIMA, "ข้าเคยรับราชการที่นครหลวง เขียนฎีกาผิดไปฉบับเดียวก็ได้มาชมหิมะที่นี่ตลอดชีวิต"),
    say(SIMA, "แต่หิมะก็งามดี ข้าไม่เสียใจหรอก มากเกินไปนิดหน่อยเท่านั้น"),
  ], choices: [
    { text: "พัดเล่มนั้นทำไมไฟถึงลุกตาม", next: "npc_city_lingxiao_scholar_sima_fan" },
    { text: "มีข่าวอะไรจากนครหลวงบ้างไหม", next: "npc_city_lingxiao_scholar_sima_rumor" },
    back(LX),
  ] },
  { kind: "dialog", id: "npc_city_lingxiao_scholar_sima_fan", lines: [
    say(SIMA, "ฮ่า สายตาไวนัก พัดนี้ชื่อพัดเพลิงสวรรค์ ใช้ลมปราณผลักไอร้อนไปกับลม"),
    say(SIMA, "ข้าได้มันมาเมื่อยี่สิบปีก่อน... ด้วยวิธีที่ไม่ค่อยน่าภูมิใจนัก"),
    nar("เขาหยุดพัด แล้วมองออกไปที่หิมะนานจนไฟในเตาหรี่ลง"),
    say(SIMA, "ไว้เราคุ้นกันกว่านี้ ข้าอาจเล่าให้ฟัง"),
  ], choices: [back(LX)] },
  { kind: "dialog", id: "npc_city_lingxiao_scholar_sima_rumor", lines: [
    say(SIMA, "ข่าวมาถึงที่นี่ช้ากว่าหิมะละลาย แต่ได้ยินว่าในวังหลวงมีขโมยเดินบนหลังคาไม่ทิ้งรอย"),
    say(SIMA, "คนเฒ่าคนแก่ในวังบอกว่าเหมือนเงาไร้รอยเมื่อยี่สิบปีก่อน ที่หายไปโดยไม่มีใครจับได้"),
  ], choices: [back(LX, "น่าสนใจ")] },

  // เสี่ยวเสวี่ย
  { kind: "dialog", id: "npc_city_lingxiao_child_xue_talk", lines: [
    nar("ลูกหิมะลูกหนึ่งกระทบหน้าผากเจ้าดังปุ"),
    say(XUE, "โดนแล้ว! คนที่สิบเจ็ดของวันนี้!"),
    say(XUE, "ท่านพี่เป็นคนต่างเมืองใช่ไหม คนในเมืองหลบเก่งหมดแล้ว ไม่สนุกเลย"),
    say(XUE, "แม่บอกว่าห้ามปาคนถือดาบ แต่ท่านพี่ดูใจดี เลยไม่เป็นไร"),
  ], choices: [
    { text: "ปาลูกหิมะกลับไปเบา ๆ", effects: [{ t: "addNpcRelationship", npcId: "city_lingxiao_child_xue", amount: 2 }], next: "npc_city_lingxiao_child_xue_play" },
    back(LX, "ลาก่อนเจ้าตัวแสบ"),
  ] },
  { kind: "dialog", id: "npc_city_lingxiao_child_xue_play", lines: [
    say(XUE, "ว้าย! ฮ่า ๆ ๆ ท่านพี่เล่นด้วย!"),
    say(XUE, "บอกความลับให้อย่างหนึ่ง ลุงไป๋ไม่ได้แค่กวาดหิมะนะ ข้าเห็นเขากวาดโจรล้มไปสามคนด้วยไม้กวาดอันเดียว"),
  ], choices: [back(LX, "ขอบใจนะ")] },

  // ขันทีเกา
  { kind: "dialog", id: "npc_palace_royal_eunuch_gao_talk", lines: [
    nar("เจ้าไม่ได้ยินเสียงเท้าเลย แต่เมื่อหันกลับไป ขันทีเกาก็ยืนอยู่ตรงนั้นแล้ว"),
    say(GAO, "ผู้มาเยือนจากนอกวัง ขออภัยที่ทำให้ตกใจ เป็นนิสัยเก่าของบ่าวแก่"),
    say(GAO, "ที่นี่กำแพงมีหู ระเบียงมีตา ท่านพูดน้อยไว้จะดีกว่า"),
    say(GAO, "บ่าวดูแลคลังเสบียงเท่านั้น ไม่มีอำนาจอะไรหรอก แต่ใครหิวในวัง บ่าวรู้หมด"),
  ], choices: [
    { text: "ท่านเดินเงียบเหลือเกิน ฝึกมาจากไหน", next: "npc_palace_royal_eunuch_gao_step" },
    back(PR),
  ] },
  { kind: "dialog", id: "npc_palace_royal_eunuch_gao_step", lines: [
    say(GAO, "ฮึ ๆ ในวังนี้ คนที่เดินเสียงดังมักอายุสั้น"),
    say(GAO, "บ่าวอยู่ที่นี่มายี่สิบปี เรียนรู้ว่าเท้าที่ดีที่สุดคือเท้าที่ไม่มีใครจำได้"),
    nar("รอยยิ้มของเขาบางเหมือนกระดาษ ไม่บอกอะไรมากกว่านั้น"),
  ], choices: [back(PR)] },

  // จ้าวเทีย
  { kind: "dialog", id: "npc_palace_royal_guard_zhao_talk", lines: [
    say(ZHAO, "หยุด! เอ่อ... ขอโทษ ท่านเป็นแขกที่ได้รับอนุญาตใช่ไหม หน้าตาไม่เหมือนคนร้าย"),
    say(ZHAO, "ข้าจ้าวเทีย มาจากหมู่บ้านริมแม่น้ำ แม่ส่งข้ามาเป็นทหารเพราะกินข้าวเก่งเกินไป"),
    say(ZHAO, "ทวนนี่หนักนะ แต่หนักน้อยกว่าคันไถ ข้าเลยถือได้ทั้งวัน"),
  ], choices: [
    { text: "สอนข้าถือทวนได้ไหม", next: "npc_palace_royal_guard_zhao_spear" },
    { text: "ในวังมีเรื่องอะไรน่ารู้บ้าง", next: "npc_palace_royal_guard_zhao_rumor" },
    back(PR),
  ] },
  { kind: "dialog", id: "npc_palace_royal_guard_zhao_spear", lines: [
    say(ZHAO, "ทวนเบื้องต้นน่ะง่าย ใช้เอวพา ไม่ใช่แขน เหมือนเหวี่ยงจอบนั่นแหละ"),
    say(ZHAO, "แต่ข้าไม่มีเวลาสอนเลย จดหมายจากแม่มาตั้งสามวันยังไม่ได้เปิดอ่าน"),
    say(ZHAO, "ถ้าท่านช่วยเดินเวรแทนสักรอบ ข้าจะสอนให้ทั้งท่าเลย สัญญาลูกผู้ชาย"),
  ], choices: [back(PR, "เดี๋ยวมาช่วย")] },
  { kind: "dialog", id: "npc_palace_royal_guard_zhao_rumor", lines: [
    say(ZHAO, "ชู่ว... พักนี้มีคนเห็นเงาดำบนหลังคาหอสมบัติ ทหารรุ่นพี่บอกว่าเป็นผี"),
    say(ZHAO, "แต่ผีไม่น่าจะขโมยขนมไหว้พระจันทร์จากครัวหลวงนะ ข้าว่าคนแน่ ๆ"),
  ], choices: [back(PR, "ขอบใจ")] },

  // ชุ่ยเอ๋อ
  { kind: "dialog", id: "npc_palace_royal_maid_cui_talk", lines: [
    say(CUI, "ว้าย แขกจากข้างนอก! ท่านเดินผ่านตลาดนครหลวงมาใช่ไหม ขนมไหว้พระจันทร์ร้านป้าหลิวยังขายอยู่หรือเปล่า"),
    say(CUI, "ข้าชุ่ยเอ๋อ นางกำนัลชั้นสาม ซักผ้า ปักผ้า ส่งข่าว... เอ้ย ส่งชา"),
    say(CUI, "อยากรู้เรื่องตำหนักไหน ถามข้าได้ ข้ารู้ก่อนพระสนมเองเสียอีก"),
  ], choices: [
    { text: "ได้ยินว่าเจ้าไปตำหนักเย็นทุกคืน", next: "npc_palace_royal_maid_cui_cold" },
    { text: "เล่าข่าวลือให้ฟังหน่อย", next: "npc_palace_royal_maid_cui_rumor" },
    back(PR),
  ] },
  { kind: "dialog", id: "npc_palace_royal_maid_cui_cold", lines: [
    say(CUI, "ชู่ว! ใครบอกท่าน... อ้อ ก็ข้าเองที่เล่าให้ทั้งวังฟังแหละ"),
    say(CUI, "พระสนมเหมยถูกส่งไปตำหนักเย็นตั้งแต่ข้ายังเด็ก ท่านเป็นคนเดียวที่ใจดีกับข้าตอนข้าทำถ้วยแตก"),
    say(CUI, "ท่านสอนข้าหายใจเหมือนดอกเหมยบานกลางหิมะ บอกว่าเป็นวิชาที่ช่วยให้รอดในวังได้"),
    say(CUI, "แต่พักหลังสวนเหมยไม่ปลอดภัยเลย ข้ากลัว..."),
  ], choices: [back(PR, "ถ้ามีอะไรให้ช่วยบอกได้")] },
  { kind: "dialog", id: "npc_palace_royal_maid_cui_rumor", lines: [
    say(CUI, "ขุนนางเฉียนกินเลี้ยงเจ็ดมื้อต่อวัน แต่บอกหมอหลวงว่ากินแค่ข้าวต้ม"),
    say(CUI, "แล้วก็... ขันทีเกาน่ะ ไม่มีใครเคยได้ยินเสียงเท้าเขาเลยสักครั้ง น่าขนลุกไหมล่ะ"),
  ], choices: [back(PR, "ฮ่า ๆ ขอบใจ")] },

  // ขุนนางเฉียน
  { kind: "dialog", id: "npc_palace_royal_official_qian_talk", lines: [
    say(QIAN, "อะแฮ่ม ผู้ใดกันที่บังอาจ... อ้อ แขกที่ได้รับอนุญาต ดี ดี"),
    say(QIAN, "ข้าคือเฉียน ผู้ช่วยเจ้ากรมพิธีการ พิธีทุกพิธีในวังต้องผ่านตาข้า"),
    say(QIAN, "ท่านแต่งกายไม่ถูกระเบียบเลยนะ แต่ข้าใจกว้าง ถ้ามีของขวัญติดมือ ข้าอาจมองไม่เห็น"),
  ], choices: [
    { text: "มีงานคัดลอกเอกสารให้ทำไหม", next: "npc_palace_royal_official_qian_work" },
    back(PR),
  ] },
  { kind: "dialog", id: "npc_palace_royal_official_qian_work", lines: [
    say(QIAN, "ฎีกากองเท่าภูเขาอยู่ในห้องข้า ผู้ช่วยลาป่วยหมด ใครลายมือดีก็มาคัดได้"),
    say(QIAN, "ค่าจ้างข้าให้ตามระเบียบ... ระเบียบที่ข้าเขียนเองนะ ฮ่า ๆ"),
  ], choices: [back(PR)] },

  // ช่างไห่
  { kind: "dialog", id: "npc_tribe_huizu_smith_hai_talk", lines: [
    nar("เสียงค้อนกระทบทั่งดังเป็นจังหวะ ช่างชราหยุดมือแล้วเช็ดเหงื่อด้วยผ้าคลุมศีรษะ"),
    say(HAI, "อัสสลามุอะลัยกุม ผู้เดินทาง สันติจงมีแด่ท่าน"),
    say(HAI, "ข้าตีเหล็กให้เผ่ามาห้าสิบปี เกือกม้า มีดตัดเชือก ดาบให้คนคุ้มกันคาราวาน"),
    say(HAI, "เหล็กดีต้องหายใจเหมือนคน เข้าช้า ออกยาว รีบเมื่อไรเหล็กก็เปราะ"),
  ], choices: [
    { text: "เหล็กหายใจได้ด้วยหรือ", next: "npc_tribe_huizu_smith_hai_iron" },
    back(HZ),
  ] },
  { kind: "dialog", id: "npc_tribe_huizu_smith_hai_iron", lines: [
    say(HAI, "ได้สิ และคนที่ตีเหล็กนาน ๆ ก็หายใจเหมือนเหล็ก ลมปราณเหล็กดำของบรรพบุรุษข้าก็มาจากเตานี้"),
    say(HAI, "แต่ปีนี้แร่ขาด คาราวานของนาซีร์จะออกเดินทางแล้ว ข้ายังหลอมเหล็กดำไม่เสร็จ"),
    say(HAI, "ถ้าเจ้ามีแร่และมีลมหายใจยาวพอ มาช่วยข้าที่เตาเถิด"),
  ], choices: [back(HZ, "ข้าจะหาแร่มาให้")] },

  // หม่าต้าหลี่
  { kind: "dialog", id: "npc_tribe_huizu_wrestler_ma_talk", lines: [
    say(MA, "เฮ้! เจ้าคนแปลกหน้า! แขนเจ้าดูพอใช้ได้ มาปล้ำกับข้าสักยกไหม"),
    say(MA, "แพ้ข้าไม่ต้องอาย ทั้งเผ่ายังไม่มีใครชนะข้าได้นอกจากแม่ข้า"),
    nar("เขาหัวเราะลั่น ตบไหล่เจ้าจนตัวเอียง"),
  ], choices: [
    { text: "ทำไมคนทะเลทรายมาวนเวียนที่นี่", next: "npc_tribe_huizu_wrestler_ma_raiders" },
    back(HZ),
  ] },
  { kind: "dialog", id: "npc_tribe_huizu_wrestler_ma_raiders", lines: [
    say(MA, "พวกนักรบทะเลทรายมาเรียกค่าผ่านทางจากบ่อน้ำของเรา บ่อน้ำที่บรรพบุรุษขุดเอง!"),
    say(MA, "ข้าตบไปสองคนแล้ว แต่ผู้อาวุโสบอกว่าข้าต้องอยู่เฝ้ากระโจม"),
    say(MA, "ถ้าเจ้าไล่พวกมันได้ ข้าจะสอนฝ่ามือเสือให้ ฝ่ามือที่ตบอูฐล้มได้ทั้งตัว"),
  ], choices: [back(HZ, "ตกลง")] },

  // นาซีร์
  { kind: "dialog", id: "npc_tribe_huizu_caravan_nasir_talk", lines: [
    say(NASIR, "ผู้เดินทางหรือ นั่งลงก่อน ชาร้อนในทะเลทรายมีค่ากว่าทองคำ"),
    say(NASIR, "ข้านาซีร์ พาคาราวานจากซีเซี่ยไปถึงแดนตะวันตกมาร้อยเที่ยว"),
    nar("เขาพับแขนเสื้อขึ้น เผยรอยแผลสี่เส้นยาวตลอดแขน"),
    say(NASIR, "แผลนี่หรือ อยากฟังฉบับไหนล่ะ ฉบับสิงโตทะเลทราย หรือฉบับเสือดาวหิมะ"),
  ], choices: [
    { text: "ฉบับที่จริงที่สุด", next: "npc_tribe_huizu_caravan_nasir_scar" },
    back(HZ),
  ] },
  { kind: "dialog", id: "npc_tribe_huizu_caravan_nasir_scar", lines: [
    say(NASIR, "ฮ่า ฉบับจริงน่าเบื่อที่สุด อาจารย์ข้าฝึกกรงเล็บสิงห์ให้ข้า แล้วข้าพลาดตอนรับกระบวนท่า"),
    say(NASIR, "แต่ท่านั้นช่วยชีวิตข้ามาหลายครั้งในทะเลทราย ทั้งจากโจรและหมาป่า"),
    say(NASIR, "พักนี้ฝูงหมาป่าหิมะลงจากเขามาขย้ำอูฐบ่อยขึ้น ข้าต้องการคนช่วย"),
  ], choices: [back(HZ, "ขอบคุณสำหรับชา")] },

  // อาอีซา
  { kind: "dialog", id: "npc_tribe_huizu_herder_aisha_talk", lines: [
    say(AISHA, "หนึ่ง สอง สาม... สิบเก้า... เอ๊ะ ไม่สิ สิบเก้า... ยี่สิบสอง..."),
    say(AISHA, "อ๊ะ ท่านทำข้านับผิด! ต้องเริ่มใหม่หมดเลย"),
    say(AISHA, "แกะข้ามียี่สิบห้าตัว แต่นับทีไรได้ยี่สิบสองทุกที แม่จะดุข้าแน่ ๆ"),
  ], choices: [
    { text: "แกะชื่ออะไรบ้าง", next: "npc_tribe_huizu_herder_aisha_names" },
    back(HZ),
  ] },
  { kind: "dialog", id: "npc_tribe_huizu_herder_aisha_names", lines: [
    say(AISHA, "ตัวนั้นชื่อหิมะ ตัวนั้นชื่อเมฆ ตัวนั้นชื่อหม่าต้าหลี่เพราะมันชอบชนคน"),
    say(AISHA, "อย่าบอกพี่หม่านะ เขาจะงอน"),
  ], choices: [{ text: "ไม่บอกแน่นอน", effects: [{ t: "addNpcRelationship", npcId: "tribe_huizu_herder_aisha", amount: 2 }], next: HZ }] },
];

const QUEST_SCENES: DialogScene[] = [
  // ── qc_city_lingxiao_snow_sweep ──
  { kind: "dialog", id: "qs_qc_city_lingxiao_snow_sweep_offer", lines: [
    say(BAI, "โอ๊ย หลังข้า... เจ้า ใช่เจ้านั่นแหละ ช่วยคนแก่สักเช้าได้ไหม"),
    say(BAI, "กวาดหน้าประตูเมือง แล้วก็บันไดหอกลอง แค่นั้นเอง"),
    say(BAI, "จำไว้ ซ้าย ขวา หมุนเอว ก้าวถอย ห้ามกวาดมั่ว ไม่งั้นหิมะจะกลับมาที่เดิม"),
  ], choices: [
    { text: "ได้เลยลุง", effects: [{ t: "startQuest", questId: "qc_city_lingxiao_snow_sweep" }], next: LX },
    back(LX, "วันนี้ยังไม่ว่าง"),
  ] },
  { kind: "dialog", id: "qs_qc_city_lingxiao_snow_sweep_complete", lines: [
    say(BAI, "สะอาดดี! แล้วเจ้ารู้สึกอะไรไหมตอนกวาด"),
    say(BAI, "ลมหายใจกับไม้กวาดเข้าจังหวะกันใช่ไหมล่ะ นั่นแหละห้าธาตุพื้นฐาน เจ้าเรียนไปครึ่งหนึ่งแล้วโดยไม่รู้ตัว"),
    nar("ลุงไป๋จับมือเจ้าวาดเป็นวงห้าทิศ อธิบายการเดินลมปราณผ่านแต่ละธาตุจนเจ้าเข้าใจ"),
    say(BAI, "พรุ่งนี้หลังข้าหายแล้ว เจ้าไม่ต้องมากวาดอีก แต่มาคุยกับคนแก่บ้างก็ได้"),
  ], choices: [
    { text: "ขอบคุณลุงไป๋", effects: [{ t: "finishQuest", questId: "qc_city_lingxiao_snow_sweep", success: true }], next: LX },
  ] },

  // ── qc_city_lingxiao_brazier ──
  { kind: "dialog", id: "qs_qc_city_lingxiao_brazier_offer", lines: [
    say(HU, "พายุใหญ่จะมาคืนนี้ เตาผิงสาธารณะสามมุมเมืองต้องติดไฟ ไม่งั้นขอทานกับเด็กกำพร้าแข็งตายแน่"),
    say(HU, "ไม้แข็งข้าหมดเกลี้ยง เจ้าไปหามาสามท่อน แล้วช่วยข้าจุดเตาด้วย"),
    say(HU, "จุดไฟกลางพายุหิมะไม่ง่ายนะ ต้องคีบถ่านเร็วกว่าลม ข้าจะสอนให้"),
  ], choices: [
    { text: "ข้าจะไปหาไม้มา", effects: [{ t: "startQuest", questId: "qc_city_lingxiao_brazier" }], next: LX },
    back(LX, "ไว้ก่อน"),
  ] },
  { kind: "dialog", id: "qs_qc_city_lingxiao_brazier_complete", lines: [
    say(HU, "ฮ่า ๆ ๆ เห็นไหม! ไฟสามดวงสว่างทั้งเมือง พายุก็ทำอะไรไม่ได้!"),
    say(HU, "แล้วมือเจ้าล่ะ แดงนิดหน่อยแต่ไม่พอง ดีมาก เจ้าเริ่มจับไฟเป็นแล้ว"),
    nar("หูเตาถ่านสาธิตกรงเล็บเพลิง ปลายนิ้วร้อนแดงเหมือนถ่าน ตะปบเสาไม้จนเป็นรอยไหม้ห้ารอย"),
    say(HU, "ตะปบให้เร็ว ถอนให้ไว ไฟจะติดคู่ต่อสู้ ไม่ติดมือเจ้า จำไว้!"),
  ], choices: [
    { text: "ขอบคุณท่านหู", effects: [{ t: "finishQuest", questId: "qc_city_lingxiao_brazier", success: true }], next: LX },
  ] },

  // ── qc_city_lingxiao_ice_palm ──
  { kind: "dialog", id: "qs_qc_city_lingxiao_ice_palm_offer", lines: [
    say(FENG, "เจ้ายังอยากเรียนฝ่ามือน้ำแข็งอยู่หรือ"),
    say(FENG, "คืนนี้พายุแรงที่สุดของปี ยืนเวรที่ประตูหิมะจนฟ้าสาง ห้ามขยับ ห้ามผิงไฟ"),
    say(FENG, "ถ้ายังไม่แข็งตาย มาประลองกับข้า รับฝ่ามือข้าได้ ข้าจะสอน"),
    say(FENG, "...และอย่าเพิ่งตาย ซาลาเปาจะเศร้า"),
  ], choices: [
    { text: "ข้าจะยืนจนฟ้าสาง", effects: [{ t: "startQuest", questId: "qc_city_lingxiao_ice_palm" }], next: LX },
    back(LX, "ขอเตรียมตัวก่อน"),
  ] },
  { kind: "dialog", id: "qs_qc_city_lingxiao_ice_palm_complete", lines: [
    say(FENG, "เจ้ารับฝ่ามือข้าได้ แปลว่าลมหนาวเมื่อคืนสอนเจ้าแล้วครึ่งหนึ่ง"),
    say(FENG, "อีกครึ่งคือดึงความเย็นจากกระดูกมาไว้ที่ฝ่ามือ แล้วปล่อยตอนกระทบ อย่าปล่อยก่อน"),
    nar("นางวางฝ่ามือบนแก้วน้ำ ผิวน้ำแข็งตัวเป็นลายดอกไม้ในพริบตา"),
    say(FENG, "เจ้าผ่านแล้ว ...ซาลาเปาฝากขอบใจที่จุดเตาใต้ป้อมยามด้วย ถ้าเจ้าเป็นคนจุดน่ะนะ"),
  ], choices: [
    { text: "รับวิชาด้วยความเคารพ", effects: [{ t: "finishQuest", questId: "qc_city_lingxiao_ice_palm", success: true }], next: LX },
  ] },

  // ── qc_city_lingxiao_poem_ink ──
  { kind: "dialog", id: "qs_qc_city_lingxiao_poem_ink_offer", lines: [
    say(SIMA, "ดูนี่สิ หมึกของข้าแข็งเป็นหินไปแล้ว กระดาษก็ชื้นจนเขียนไม่ติด"),
    say(SIMA, "ชาวเมืองกลัวพายุใหญ่ ข้าอยากเขียนกลอนปลอบใจพวกเขาสักบท บัณฑิตไร้ดาบมีแต่พู่กันเท่านั้น"),
    say(SIMA, "ช่วยหาหมึกสองแท่งกับกระดาษสามแผ่นให้ข้าได้ไหม แล้วช่วยอ่านให้ด้วย เสียงข้าแหบแล้ว"),
  ], choices: [
    { text: "ยินดีช่วย", effects: [{ t: "startQuest", questId: "qc_city_lingxiao_poem_ink" }], next: LX },
    back(LX, "ไว้คราวหน้า"),
  ] },
  { kind: "dialog", id: "qs_qc_city_lingxiao_poem_ink_complete", lines: [
    say(SIMA, "มีคนยื่นชาร้อนให้หรือ ฮ่า ๆ นั่นแหละรางวัลของกวี"),
    say(SIMA, "ตอนอยู่นครหลวง ข้าเขียนกลอนให้ฮ่องเต้อ่าน ไม่เคยมีใครยื่นชาให้ข้าเลยสักถ้วย"),
    say(SIMA, "ขอบใจเจ้ามาก สหายร่วมหิมะ"),
  ], choices: [
    { text: "ยินดีครับท่านบัณฑิต", effects: [{ t: "finishQuest", questId: "qc_city_lingxiao_poem_ink", success: true }], next: LX },
  ] },

  // ── qc_city_lingxiao_heaven_fan ──
  { kind: "dialog", id: "qs_qc_city_lingxiao_heaven_fan_offer", lines: [
    say(SIMA, "สหายเอ๋ย ข้าเคยบอกว่าจะเล่าเรื่องพัดนี้ให้ฟังใช่ไหม"),
    say(SIMA, "พัดเพลิงสวรรค์ขาดวิ่นจนใช้ได้อีกไม่กี่ครั้ง ข้าอยากซ่อมมัน แล้วถ่ายทอดวิชาให้เจ้า ก่อนที่มันจะตายไปพร้อมข้า"),
    say(SIMA, "ต้องใช้บัวหิมะหนึ่งดอกต้มกาวทนไฟ และผ้าไหมสองผืน"),
    nar("เขาเหลือบมองหน้าต่าง น้ำเสียงเบาลง"),
    say(SIMA, "อีกอย่าง... พักนี้มีเงาแดงวนเวียนรอบเรือนข้ายามดึก ข้าคิดว่ามันตามพัดเล่มนี้มา"),
  ], choices: [
    { text: "ข้าจะช่วยท่าน", effects: [{ t: "startQuest", questId: "qc_city_lingxiao_heaven_fan" }], next: LX },
    back(LX, "ขอคิดดูก่อน"),
  ] },
  { kind: "dialog", id: "qd_qc_city_lingxiao_heaven_fan_ambush", lines: [
    nar("เที่ยงคืน หิมะหยุดตก เมืองเงียบจนได้ยินเสียงเกล็ดน้ำแข็งแตก"),
    nar("เงาร่างหนึ่งในผ้าคลุมสีแดงกระโดดลงจากหลังคา เปิดหน้าต่างเรือนบัณฑิตอย่างแผ่วเบา"),
    say("หญิงผ้าคลุมแดง", "หลีกไป คนนอก! พัดนั่นไม่ใช่ของเขา และเรื่องนี้ไม่ใช่เรื่องของเจ้า!"),
    nar("นางสะบัดพัดอีกเล่มในมือ ไอร้อนพุ่งตรงมาจนหิมะรอบตัวเจ้าละลายเป็นไอ"),
  ], choices: [
    { text: "ขวางนางไว้", effects: [{ t: "triggerBattle", opponentId: "opp_city_lingxiao_red_veil", onWin: "qd_qc_city_lingxiao_heaven_fan_unmask", onLose: LX, nonFatal: true }], next: "qd_qc_city_lingxiao_heaven_fan_unmask" },
    back(LX, "ถอยไปตั้งหลักก่อน"),
  ] },
  { kind: "dialog", id: "qd_qc_city_lingxiao_heaven_fan_unmask", lines: [
    nar("ผ้าคลุมแดงหลุดออก เผยใบหน้าหญิงวัยกลางคนผมแซมขาว ดวงตาแดงก่ำด้วยน้ำตามากกว่าความโกรธ"),
    say("หญิงผ้าคลุมแดง", "ข้าชื่อหลิวหง พัดเล่มนั้นคืองานชิ้นสุดท้ายของอาจารย์ข้า"),
    say("หลิวหง", "ยี่สิบปีก่อน บัณฑิตหนุ่มคนหนึ่งมาขอพักที่สำนักเรา แล้วหายไปพร้อมพัดและตำรา"),
    say("หลิวหง", "อาจารย์ตรอมใจตาย ข้าตามหาเขามาทั้งชีวิต ...ถามเขาเองสิ ว่าข้าโกหกหรือเปล่า"),
  ], choices: [
    { text: "ข้าจะไปถามเขาเอง", effects: [{ t: "advanceQuest", questId: "qc_city_lingxiao_heaven_fan" }], next: LX },
  ] },
  { kind: "dialog", id: "qd_qc_city_lingxiao_heaven_fan_truth", paged: true, lines: [
    nar("ซือหม่าเหยียนนั่งนิ่งอยู่หน้าเตาที่มอดดับ ไม่ต้องให้เจ้าถาม เขาก็รู้"),
    say(SIMA, "นางพูดจริง ข้าคือบัณฑิตหนุ่มคนนั้น"),
    say(SIMA, "ข้าอยากสอบเข้ารับราชการ แต่ยากจนจนไม่มีค่าเดินทาง ข้าคิดว่าพัดกับตำราจะขายได้ราคา"),
    say(SIMA, "แต่พอได้อ่านตำรา ข้ากลับขายมันไม่ลง ข้าฝึกมันทุกคืน แล้วเข้าใจว่าข้าขโมยของที่ไม่มีวันคืนได้"),
    say(SIMA, "ข้าถูกเนรเทศมาที่นี่ ข้าคิดว่าเป็นกรรมตามทัน ข้าไม่เคยกล้ากลับไปหาอาจารย์ของนางเลย"),
    say(SIMA, "สหาย เจ้าคิดว่าข้าควรทำอย่างไร"),
  ], choices: [
    { text: "ไปขอขมาหลิวหง แล้วสอนวิชาต่อในนามอาจารย์ของนาง",
      effects: [{ t: "addTrait", trait: "good", amount: 2 }, { t: "advanceQuest", questId: "qc_city_lingxiao_heaven_fan" }],
      next: "qd_qc_city_lingxiao_heaven_fan_amends" },
    { text: "คืนพัดให้หลิวหง แต่ส่งวิชาต่อให้คนรุ่นหลังไม่ให้สูญหาย",
      effects: [{ t: "addTrait", trait: "humility", amount: 2 }, { t: "advanceQuest", questId: "qc_city_lingxiao_heaven_fan" }],
      next: "qd_qc_city_lingxiao_heaven_fan_amends" },
  ] },
  { kind: "dialog", id: "qd_qc_city_lingxiao_heaven_fan_amends", lines: [
    nar("ซือหม่าเหยียนเดินออกไปกลางหิมะ คุกเข่าลงต่อหน้าหลิวหงที่รออยู่ใต้ป้อมยาม"),
    nar("ทั้งสองคุยกันนานจนฟ้าสาง เมื่อกลับมา ตาของเขาแดงแต่ไหล่ดูเบาลง"),
    say(SIMA, "นางบอกว่า อาจารย์สร้างพัดนี้ให้คนอุ่น ไม่ใช่ให้คนเก็บไว้คนเดียว"),
    say(SIMA, "มาเถิด เมื่อพัดซ่อมเสร็จ ข้าจะสอนเจ้าในนามของนาง และของอาจารย์นาง"),
  ], choices: [back(LX, "ตกลง")] },
  { kind: "dialog", id: "qs_qc_city_lingxiao_heaven_fan_complete", paged: true, lines: [
    nar("ซือหม่าเหยียนกางพัดที่ซ่อมใหม่ ผ้าไหมขาวเคลือบกาวบัวหิมะ เปล่งไอร้อนจาง ๆ แม้ยังไม่โบก"),
    say(SIMA, "พัดเพลิงสวรรค์ไม่ได้เผาด้วยไฟ แต่ด้วยลมปราณที่อุ่นพอจะทำให้คนข้างหน้าตาพร่า"),
    say(SIMA, "รวมปราณที่ข้อมือ หมุนเป็นวงเหมือนพัดไฟในเตา แล้วสะบัดตอนลมหายใจออกสุด"),
    nar("เจ้าฝึกตามจนพลบค่ำ หิมะรอบตัวละลายเป็นวงกลมกว้างสามก้าว"),
    say(SIMA, "หลิวหงฝากพัดผ้าไหมเล่มนี้ให้เจ้า นางว่าคนที่ขวางนางได้สมควรมีพัดดี ๆ ติดตัว"),
    say(SIMA, "ส่วนพัดเก่า ข้าจะคืนให้นาง อย่างที่ควรเป็นตั้งแต่ยี่สิบปีก่อน"),
  ], choices: [
    { text: "รับวิชาและพัดด้วยความเคารพ", effects: [{ t: "finishQuest", questId: "qc_city_lingxiao_heaven_fan", success: true }], next: LX },
  ] },

  // ── qc_palace_royal_spear_patrol ──
  { kind: "dialog", id: "qs_qc_palace_royal_spear_patrol_offer", lines: [
    say(ZHAO, "ท่านจะช่วยจริงหรือ! ดีจริง ๆ"),
    say(ZHAO, "เดินตรวจระเบียงตะวันออกหนึ่งรอบ แล้วไปดูประตูสวนหลวงด้วย ถือทวนข้าไปนะ ทหารไม่มีทวนเดี๋ยวโดนถาม"),
    say(ZHAO, "ข้าจะแอบอ่านจดหมายแม่ตรงนี้ อย่าบอกหัวหน้ากองนะ"),
  ], choices: [
    { text: "รับทวนไปเดินตรวจ", effects: [{ t: "startQuest", questId: "qc_palace_royal_spear_patrol" }], next: PR },
    back(PR, "ไว้คราวหน้า"),
  ] },
  { kind: "dialog", id: "qs_qc_palace_royal_spear_patrol_complete", lines: [
    say(ZHAO, "กลับมาแล้ว! แม่ข้าเขียนมาว่าวัวที่บ้านคลอดลูกแฝด ฮ่า ๆ"),
    say(ZHAO, "สัญญาคือสัญญา มา ข้าสอนทวนเบื้องต้นให้"),
    nar("จ้าวเทียสาธิตท่าแทง ปัด กวาด ทุกท่าส่งแรงจากเอวเหมือนคนไถนา เรียบง่ายแต่หนักแน่น"),
    say(ZHAO, "แค่นี้แหละ ฝึกทุกวันจนทวนเป็นแขนข้างที่สาม"),
  ], choices: [
    { text: "ขอบใจจ้าวเทีย", effects: [{ t: "finishQuest", questId: "qc_palace_royal_spear_patrol", success: true }], next: PR },
  ] },

  // ── qc_palace_royal_rat_store ──
  { kind: "dialog", id: "qs_qc_palace_royal_rat_store_offer", lines: [
    say(GAO, "พระพันปีโปรดน้ำแกงโสมทุกเช้า แต่หนูในคลังกัดโสมจนเหลือแต่ราก"),
    say(GAO, "หากท่านหาโสมมาได้สองราก แล้วช่วยไล่หนูในคลังด้วย บ่าวจะตอบแทนอย่างงาม"),
    say(GAO, "อ้อ คานเพดานคลังเก่าแล้ว อย่าปีนขึ้นไปเชียว"),
  ], choices: [
    { text: "รับปาก", effects: [{ t: "startQuest", questId: "qc_palace_royal_rat_store" }], next: PR },
    back(PR, "ไว้คราวหน้า"),
  ] },
  { kind: "dialog", id: "qs_qc_palace_royal_rat_store_complete", lines: [
    say(GAO, "โสมสดดี พระพันปีจะทรงพอพระทัย"),
    say(GAO, "ท่านเห็นรอยเท้าบนคานหรือ ...ฮึ ๆ ท่านตาดีกว่าทหารยามทั้งวังรวมกัน"),
    nar("ขันทีเกายิ้มบาง แต่แววตาเหมือนกำลังชั่งน้ำหนักบางอย่างในใจ"),
    say(GAO, "ไว้วันหน้า บ่าวอาจต้องขอแรงท่านอีก"),
  ], choices: [
    { text: "ยินดี", effects: [{ t: "finishQuest", questId: "qc_palace_royal_rat_store", success: true }], next: PR },
  ] },

  // ── qc_palace_royal_plum_garden ──
  { kind: "dialog", id: "qs_qc_palace_royal_plum_garden_offer", lines: [
    say(CUI, "ท่าน... ข้าขอร้องได้ไหม เรื่องนี้ข้าบอกใครในวังไม่ได้เลย"),
    say(CUI, "พระสนมเหมยไอหนักขึ้นทุกคืน หมอหลวงไม่ยอมไปตำหนักเย็น ข้าต้องการสมุนไพรสามต้นต้มยา"),
    say(CUI, "แล้วคืนก่อน มีมือมีดซุ่มในสวนเหมย ข้าเกือบโดนแทง! ข้าไม่รู้ว่ามันมาเพื่อข้า หรือเพื่อท่าน"),
    say(CUI, "ช่วยคุ้มกันข้าไปส่งยาสักคืน แล้วข้าจะขอให้ท่านพระสนมสอนวิชาให้ท่าน"),
  ], choices: [
    { text: "ข้าจะคุ้มกันเจ้าเอง", effects: [{ t: "startQuest", questId: "qc_palace_royal_plum_garden" }], next: PR },
    back(PR, "ขอเตรียมตัวก่อน"),
  ] },
  { kind: "dialog", id: "qd_qc_palace_royal_plum_garden_ambush", lines: [
    nar("ยามสาม ดอกเหมยร่วงบนหิมะบาง ๆ ชุ่ยเอ๋อถือตะเกียงเดินนำ มือสั่นจนแสงไฟไหว"),
    nar("เงามืดพุ่งออกจากหลังต้นเหมย ใบมีดสะท้อนแสงจันทร์"),
    say(CUI, "มันมาอีกแล้ว!"),
  ], choices: [
    { text: "เข้าขวางมือมีด", effects: [{ t: "triggerBattle", opponentId: "night_blade", onWin: "qd_qc_palace_royal_plum_garden_safe", onLose: PR, nonFatal: true }], next: "qd_qc_palace_royal_plum_garden_safe" },
    back(PR, "พาชุ่ยเอ๋อถอยกลับก่อน"),
  ] },
  { kind: "dialog", id: "qd_qc_palace_royal_plum_garden_safe", lines: [
    nar("มือมีดหนีข้ามกำแพงไป ทิ้งป้ายเอวไว้หนึ่งอัน เป็นป้ายของคนในตำหนักพระสนมคนโปรด"),
    say(CUI, "พระสนมคนโปรดกลัวว่าพระสนมเหมยจะได้กลับมา... ถึงขั้นส่งคนมาฆ่าคนส่งยาเลยหรือ"),
    nar("ประตูตำหนักเย็นเปิดออก หญิงชราผมขาวในชุดซีดยิ้มให้ทั้งสองคน"),
    say("พระสนมเหมย", "ชุ่ยเอ๋อพาแขกมาด้วยหรือ เข้ามาเถิด ข้าไม่มีอะไรนอกจากชาจืดกับลมหายใจของดอกเหมย"),
  ], choices: [
    { text: "เข้าไปในตำหนักเย็น", effects: [{ t: "advanceQuest", questId: "qc_palace_royal_plum_garden" }], next: PR },
  ] },
  { kind: "dialog", id: "qs_qc_palace_royal_plum_garden_complete", paged: true, lines: [
    say(CUI, "ท่านพระสนมดื่มยาแล้วหลับสบายเป็นครั้งแรกในรอบเดือน"),
    say(CUI, "ท่านฝากวิชานี้มาให้ท่าน ลมปราณเหมยห้ากลีบ ท่านบอกว่ามันช่วยให้ทนหนาวได้ทั้งในหิมะและในวัง"),
    nar("ชุ่ยเอ๋อสอนการหายใจห้าจังหวะ ดังกลีบเหมยห้ากลีบบานทีละกลีบ ลมปราณเย็นแต่อ่อนโยนไหลเวียนรักษาบาดแผล"),
    say(CUI, "ข้าเองก็เรียนจากท่านมาแบบนี้แหละ ข้าเลยไม่เคยป่วยแม้ซักผ้ากลางหิมะ"),
    say(CUI, "ขอบคุณนะ ถ้ามีข่าวลืออะไรในวัง ท่านมาถามข้าได้ก่อนใครเลย"),
  ], choices: [
    { text: "รับวิชาด้วยความเคารพ", effects: [{ t: "finishQuest", questId: "qc_palace_royal_plum_garden", success: true }], next: PR },
  ] },

  // ── qc_palace_royal_void_step ──
  { kind: "dialog", id: "qs_qc_palace_royal_void_step_offer", lines: [
    say(GAO, "ท่านคงได้ยินเรื่องเงาบนหลังคาหอสมบัติแล้ว"),
    say(GAO, "มันไม่ได้ขโมยอะไรมากมาย ขนมนิดหน่อย หยกชิ้นเล็กหนึ่งชิ้น แต่ถ้าราชองครักษ์จับได้ก่อน มันจะถูกตัดหัว"),
    say(GAO, "บ่าวอยากให้ท่านจับมันก่อน และพามาหาบ่าว... อย่างเงียบที่สุด"),
    nar("ขันทีเกาพูดถึงขโมยราวกับพูดถึงลูกหลานตัวเอง"),
  ], choices: [
    { text: "ข้าจะตามรอยมัน", effects: [{ t: "startQuest", questId: "qc_palace_royal_void_step" }], next: PR },
    back(PR, "ขอคิดดูก่อน"),
  ] },
  { kind: "dialog", id: "qd_qc_palace_royal_void_step_ambush", lines: [
    nar("เที่ยงคืน เจ้าวางหยกล้ำค่าไว้บนแท่นในหอสมบัติตามที่ขันทีเกาบอก แล้วซ่อนตัวหลังเสา"),
    nar("ไม่มีเสียง ไม่มีลม แต่หยกหายไปจากแท่นแล้ว เงาร่างหนึ่งยืนอยู่บนขื่อ หัวเราะเบา ๆ"),
    say("เงาไร้รอยรุ่นสอง", "ตามข้าทันด้วยหรือ เจ้าก็ไม่ธรรมดา"),
  ], choices: [
    { text: "กระโจนขึ้นขื่อตามไป", effects: [{ t: "triggerBattle", opponentId: "opp_palace_royal_shadow", onWin: "qd_qc_palace_royal_void_step_unmask", onLose: PR, nonFatal: true }], next: "qd_qc_palace_royal_void_step_unmask" },
    back(PR, "รอจังหวะใหม่"),
  ] },
  { kind: "dialog", id: "qd_qc_palace_royal_void_step_unmask", paged: true, lines: [
    nar("เงาร่างนั้นล้มลงบนกระเบื้อง ผ้าปิดหน้าหลุด เป็นชายหนุ่มอายุไม่ถึงยี่สิบ"),
    say("เงาไร้รอยรุ่นสอง", "ข้าแพ้... แต่ข้าไม่ได้มาขโมยเพื่อตัวเอง ข้ามาตามหาคนคนหนึ่ง"),
    say("เงาไร้รอยรุ่นสอง", "ยี่สิบปีก่อน อาจารย์ของอาจารย์ข้า เงาไร้รอย ย่องเข้าวังแล้วไม่เคยกลับออกมา"),
    say("เงาไร้รอยรุ่นสอง", "ก้าวที่ข้าใช้ เขาเป็นคนคิด คนในวังที่เดินได้แบบเดียวกันมีแค่คนเดียว"),
    nar("เขามองข้ามไหล่เจ้าไปที่ระเบียงมืด ซึ่งมีเงาร่างผอมยืนนิ่งอยู่ ขันทีเกา"),
    say("เงาไร้รอยรุ่นสอง", "ท่านปู่อาจารย์... ใช่ท่านหรือไม่"),
  ], choices: [
    { text: "พาทั้งสองไปคุยกันในที่ลับตา", effects: [{ t: "advanceQuest", questId: "qc_palace_royal_void_step" }], next: PR },
  ] },
  { kind: "dialog", id: "qs_qc_palace_royal_void_step_complete", paged: true, lines: [
    say(GAO, "ใช่ บ่าวคือเงาไร้รอยคนนั้น"),
    say(GAO, "ยี่สิบปีก่อน บ่าวย่องเข้ามาขโมยไข่มุกราตรี แล้วถูกจับได้ในคืนเดียวกัน คนที่จับบ่าวได้คือพระพันปีที่ยังเป็นพระสนมเอก"),
    say(GAO, "นางไม่ส่งบ่าวไปประหาร แต่ถามว่าอยากมีชีวิตอยู่ในวังไหม แลกกับการรับใช้นางตลอดชีวิต บ่าวเลือกชีวิต"),
    say(GAO, "เด็กคนนั้น บ่าวจะส่งออกไปนอกวังคืนนี้ พร้อมจดหมายถึงศิษย์ของบ่าว ให้เลิกตามหาคนที่ตายไปแล้ว"),
    nar("ขันทีเกาลุกขึ้น ก้าวหนึ่งก้าวโดยไม่มีเสียง แล้วไปปรากฏอีกฟากห้องราวกับระยะทางไม่มีอยู่จริง"),
    say(GAO, "ก้าวว่างไร้รอย ต้องลืมน้ำหนักตัวเอง ลืมเสียงเท้า ลืมว่าตัวเองเคยอยู่ตรงไหน"),
    say(GAO, "บ่าวไม่คิดจะสอนใครอีกแล้ว แต่ท่านรู้ความลับของบ่าว และยังเก็บมันไว้ วิชานี้จึงควรเป็นของท่าน"),
    say(GAO, "หยกที่ใช้ล่อ บ่าวขอเก็บคืนคลัง ส่วนเครื่องรางนี้รับไปเถิด ขอให้โชคเดินตามท่านเงียบ ๆ เหมือนเงา"),
  ], choices: [
    { text: "รับวิชาและเก็บความลับไว้", effects: [{ t: "finishQuest", questId: "qc_palace_royal_void_step", success: true }], next: PR },
  ] },

  // ── qc_tribe_huizu_black_iron ──
  { kind: "dialog", id: "qs_qc_tribe_huizu_black_iron_offer", lines: [
    say(HAI, "คาราวานของนาซีร์จะออกเดินทางในอีกไม่กี่วัน ข้าต้องหลอมเหล็กดำทำโซ่ล้อเกวียน"),
    say(HAI, "หาแร่เหล็กมาสามก้อน แล้วมาสูบเครื่องเป่าลมให้ข้า แขนข้าแก่เกินจะทำทั้งสองอย่างพร้อมกัน"),
    say(HAI, "ถ้าเจ้าหายใจตามเตาได้ ข้าจะสอนลมปราณเหล็กดำที่ปู่ข้าสอนข้า"),
  ], choices: [
    { text: "อินชาอัลลอฮ์ ข้าจะช่วย", effects: [{ t: "startQuest", questId: "qc_tribe_huizu_black_iron" }], next: HZ },
    back(HZ, "ไว้ก่อน"),
  ] },
  { kind: "dialog", id: "qs_qc_tribe_huizu_black_iron_complete", lines: [
    say(HAI, "ดูสิ เหล็กดำเงาเหมือนตาอูฐ แข็งแต่ไม่เปราะ"),
    say(HAI, "เจ้าหายใจตามเตาได้ดี ลมปราณเหล็กดำก็คือเช่นนั้น เข้าช้าให้ร้อน ออกยาวให้แกร่ง"),
    nar("ช่างไห่วางมือบนท้องเจ้า สอนให้รวมปราณไว้ใต้สะดือจนรู้สึกหนักแน่นราวทั่งเหล็ก"),
    say(HAI, "ใครตีเจ้า มือเขาจะเจ็บเอง ขอพระเจ้าคุ้มครองเจ้าตลอดทาง"),
  ], choices: [
    { text: "ขอบคุณท่านช่างไห่", effects: [{ t: "finishQuest", questId: "qc_tribe_huizu_black_iron", success: true }], next: HZ },
  ] },

  // ── qc_tribe_huizu_tiger_palm ──
  { kind: "dialog", id: "qs_qc_tribe_huizu_tiger_palm_offer", lines: [
    say(MA, "นักรบทะเลทรายสามคน วนเวียนแถวบ่อน้ำทุกวัน เรียกค่าน้ำจากแม่บ้านของเผ่า!"),
    say(MA, "ไปจัดการพวกมันให้หมด กลับมาแล้วข้าจะสอนฝ่ามือเสือให้"),
    say(MA, "ถ้าเจ้าแพ้ ก็กลับมากินชากับข้า ไม่ต้องอาย ฮ่า ๆ"),
  ], choices: [
    { text: "รับคำท้า", effects: [{ t: "startQuest", questId: "qc_tribe_huizu_tiger_palm" }], next: HZ },
    back(HZ, "ไว้คราวหน้า"),
  ] },
  { kind: "dialog", id: "qs_qc_tribe_huizu_tiger_palm_complete", lines: [
    say(MA, "สามคน! เจ้าจัดการได้หมดจริง ๆ! แม่บ้านทั้งเผ่าจะทำแป้งทอดเลี้ยงเจ้าแน่"),
    say(MA, "มา ฝ่ามือเสือ ย่อตัวเหมือนเสือหมอบ ส่งแรงจากเท้าผ่านเอวไปที่ฝ่ามือ แล้วตบ!"),
    nar("หม่าต้าหลี่ตบกระสอบทรายจนขาดกลาง ทรายพุ่งกระจายเต็มลาน อาอีซาวิ่งมาบ่นว่าแกะตกใจ"),
    say(MA, "ขอโทษอาอีซา! นั่นแหละ ฝึกจนตบกระสอบขาดได้ แล้วเจ้าจะไม่กลัวใครในทะเลทราย"),
  ], choices: [
    { text: "ขอบใจท่านหม่า", effects: [{ t: "finishQuest", questId: "qc_tribe_huizu_tiger_palm", success: true }], next: HZ },
  ] },

  // ── qc_tribe_huizu_lion_claw ──
  { kind: "dialog", id: "qs_qc_tribe_huizu_lion_claw_offer", lines: [
    say(NASIR, "เมื่อคืนหมาป่าหิมะฆ่าอูฐข้าไปสองตัว ถ้ามันมาอีก คาราวานจะออกเดินทางไม่ได้"),
    say(NASIR, "ไล่ฝูงมันไปให้ได้ แล้วมาประลองกับข้า อาจารย์ข้าสอนว่ากรงเล็บสิงห์ต้องสอนคนที่รับมันได้เท่านั้น"),
    say(NASIR, "ข้าไม่อยากให้ใครมีแผลแบบข้า"),
  ], choices: [
    { text: "รับคำ", effects: [{ t: "startQuest", questId: "qc_tribe_huizu_lion_claw" }], next: HZ },
    back(HZ, "ไว้คราวหน้า"),
  ] },
  { kind: "dialog", id: "qs_qc_tribe_huizu_lion_claw_complete", lines: [
    say(NASIR, "เจ้ารับกรงเล็บข้าได้โดยไม่มีแผล ดีกว่าข้าตอนหนุ่มเสียอีก"),
    say(NASIR, "กรงเล็บสิงห์คือการฉีกเกราะ งอนิ้วให้แข็ง ตะปบเฉียงลง ฉีกผ่านไม่ใช่กดค้าง"),
    nar("นาซีร์ตะปบหนังอูฐที่ขึงไว้ ขาดเป็นสี่ริ้วขนานกันพอดี"),
    say(NASIR, "เมื่อไรผ่านเส้นทางคาราวาน บอกชื่อข้า เจ้าจะได้ชาร้อนทุกกระโจม"),
  ], choices: [
    { text: "ขอบคุณท่านนาซีร์", effects: [{ t: "finishQuest", questId: "qc_tribe_huizu_lion_claw", success: true }], next: HZ },
  ] },

  // ── qc_tribe_huizu_lost_lambs ──
  { kind: "dialog", id: "qs_qc_tribe_huizu_lost_lambs_offer", lines: [
    say(AISHA, "ท่านพี่! ช่วยหาลูกแกะให้หน่อย หายไปสามตัว!"),
    say(AISHA, "ถ้าแม่รู้ แม่จะไม่ให้กินขนมงาเลยทั้งเดือน"),
    say(AISHA, "พวกมันชอบซ่อนในที่แปลก ๆ กองฟาง ใต้เกวียน ริมบ่อน้ำ"),
  ], choices: [
    { text: "พี่จะช่วยหา", effects: [{ t: "startQuest", questId: "qc_tribe_huizu_lost_lambs" }], next: HZ },
    back(HZ, "ขอโทษนะ ตอนนี้ไม่ว่าง"),
  ] },
  { kind: "dialog", id: "qs_qc_tribe_huizu_lost_lambs_complete", lines: [
    say(AISHA, "ครบแล้ว! ยี่สิบห้าตัว! ...ยี่สิบสี่... เอ๊ะ ยี่สิบห้า!"),
    say(AISHA, "ท่านพี่เก่งที่สุดในทะเลทรายเลย เก่งกว่าพี่หม่าอีก อย่าบอกเขานะ"),
    say(AISHA, "เอานี่ไป เงินเก็บของข้าเอง แม่ไม่รู้หรอก"),
  ], choices: [
    { text: "ขอบใจอาอีซา", effects: [{ t: "finishQuest", questId: "qc_tribe_huizu_lost_lambs", success: true }], next: HZ },
  ] },
];

const EVENT_SCENES: DialogScene[] = [


];

// ─── Activities ───────────────────────────────────────────────────────
const ACTIVITIES: ActivityDef[] = [
  { id: "act_city_lingxiao_snow_sit", label: "นั่งสมาธิกลางหิมะ", badge: "practice", icon: "🧘", hours: 3, stamina: 10,
    description: "นั่งนิ่งให้หิมะพอกไหล่ ฝึกลมปราณให้อุ่นจากข้างใน · ฝึกพลังภายใน",
    place: { locationIds: [LX], cooldownDays: 1, reward: { statXp: "POW", wExp: 15 },
      doneText: "หิมะละลายเป็นวงรอบตัวเจ้า ลมปราณไหลเวียนอุ่นทั่วร่าง" } },
  { id: "act_city_lingxiao_haul_coal", label: "ช่วยหูแบกถ่าน", badge: "labor", icon: "🪵", hours: 3, stamina: 20,
    description: "แบกถ่านส่งตามบ้านในพายุหิมะ · ได้ค่าแรงและน้ำใจหูเตาถ่าน",
    place: { locationIds: [LX], cooldownDays: 1, reward: { gold: [25, 45], statXp: "STR", relationship: { npcId: "city_lingxiao_coal_hu", amount: 1 } },
      doneText: "หูเตาถ่านยัดเหรียญใส่มือเจ้า \"แบกเก่งกว่าลาข้าอีก ฮ่า ๆ\"" } },
  { id: "act_palace_royal_spear_drill", label: "ซ้อมทวนกับทหารยาม", badge: "practice", icon: "🔱", hours: 2, stamina: 15,
    description: "ซ้อมแทงทวนกับจ้าวเทียที่ลานฝึกองครักษ์ · ฝึกพละกำลัง",
    place: { locationIds: [PR], cooldownDays: 1, reward: { statXp: "STR", wExp: 10, relationship: { npcId: "palace_royal_guard_zhao", amount: 1 } },
      doneText: "จ้าวเทียปาดเหงื่อแล้วหัวเราะ \"วันนี้ท่านแทงหุ่นฟางขาดสามตัว!\"" } },
  { id: "act_palace_royal_copy_edicts", label: "คัดฎีกาให้ขุนนางเฉียน", badge: "labor", icon: "📜", hours: 4, stamina: 10,
    description: "คัดลอกฎีกาและบัญชีพิธีการ · ได้ค่าจ้างและฝึกปัญญา",
    place: { locationIds: [PR], cooldownDays: 2, reward: { gold: [40, 70], statXp: "INT" },
      doneText: "ขุนนางเฉียนนับเหรียญให้ช้า ๆ \"ลายมือใช้ได้ ...ตามระเบียบ\"" } },
  { id: "act_tribe_huizu_wrestle", label: "ปล้ำมวยหน้ากระโจม", badge: "practice", icon: "🤼", hours: 2, stamina: 15,
    description: "มวยปล้ำแบบชนเผ่ากับหนุ่ม ๆ ในเผ่า · ฝึกพละกำลัง",
    place: { locationIds: [HZ], cooldownDays: 1, reward: { statXp: "STR", wExp: 10, relationship: { npcId: "tribe_huizu_wrestler_ma", amount: 1 } },
      doneText: "เจ้าทุ่มหนุ่มในเผ่าล้มไปสองคน หม่าต้าหลี่ตะโกนเชียร์ลั่นลาน" } },
  { id: "act_tribe_huizu_milk_tea", label: "จิบชานมในกระโจม", badge: "rest", icon: "🍵", hours: 1, stamina: 0,
    description: "ชานมเกลือร้อน ๆ กับแป้งทอด 5 ตำลึง · ฟื้นแรงและบาดแผล",
    place: { locationIds: [HZ], cooldownDays: 1, costGold: 5, reward: { stamina: 25, heal: 0.2 },
      doneText: "ชานมเค็มนิด ๆ อุ่นถึงท้อง เจ้ารู้สึกสดชื่นขึ้นมาก" } },
];


export const CONTENT: PlaceContent = {
  npcs: NPCS,
  quests: QUESTS,
  scenes: [...TALK_SCENES, ...QUEST_SCENES, ...EVENT_SCENES],
  activities: ACTIVITIES,
  opponents: OPPONENTS,
};
