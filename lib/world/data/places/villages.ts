// Villages group: หมู่บ้านไร้นาม (village_noname), หมู่บ้านหัวซาน
// (village_huashan), หมู่บ้านไท่ซาน (village_taishan) and โรงเตี๊ยมมีหว่าง
// (inn_youjian). People, quests, things to do and meetings for each, plus
// the ยุทธจักร skill / art quests:
//   nd1 · ne6 · nf7 (whips)        — village_noname
//   qf · nd6 (swords)              — village_huashan
//   art:t0_butterfly · ne10 (staff) — village_taishan
//   nc4 · art:t2_eighttri · art:t3_heartmind — inn_youjian
import type { DialogScene, NpcDef, QuestDef, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const narr = (text: string): SceneLine => ({ t: "narration", text });

// ─── Names (dialog speakers must match NpcDef.name exactly) ──────────
const QIAO = "ยายเฉียว";
const LU = "ลู่เกวียน";
const XIAOWU = "เสี่ยวอู๋";
const LING = "ครูหลิง";
const YANG = "หยางซื่อ";
const TIE = "เถี่ยตัน";
const SHI = "สือเปียนตาน";
const DIE = "ยายเตี๋ย";
const CHEN = "บัณฑิตเฉิน";
const MEI = "เหมยเหนียง";
const BAO = "ปาวซาลาเปา";
const GUA = "ซินแสกว้า";

// ═══════════════════════════════════════════════════════════════════
// NPCs
// ═══════════════════════════════════════════════════════════════════

const NPCS: NpcDef[] = [
  // ─── village_noname ───────────────────────────────────────────────
  {
    id: "village_noname_whip_qiao",
    name: QIAO,
    description: "หญิงชราต้อนแพะด้วยแส้หนังเส้นยาว ปากร้ายใจดี ไม่เคยบอกใครว่าเมื่อก่อนเคยเป็นใคร",
    locationIds: ["village_noname"],
    dialogSceneId: "npc_village_noname_whip_qiao_talk",
    sparOpponentId: "spar_village_noname_whip_qiao",
    sparFameReward: 4,
    defenseTier: 2,
    tags: ["elder", "master", "hidden_weapon", "retired_warrior"],
    look: { body: "f3" },
    likes: ["moon_cake", "snake_skin", "herb"],
    dislikes: ["venom"],
  },
  {
    id: "village_noname_carter_lu",
    name: LU,
    description: "คนขับเกวียนวัวเสียงดังผู้วิ่งเส้นทางทรายระหว่างซากเมืองร้างกับหมู่บ้าน หวดแส้ทีไรวัวยังสะดุ้ง",
    locationIds: ["village_noname"],
    dialogSceneId: "npc_village_noname_carter_lu_talk",
    sparOpponentId: "spar_village_noname_carter_lu",
    sparFameReward: 2,
    defenseTier: 1,
    stealLoot: [
      { itemId: "wood_soft", weight: 3, count: [1, 2] },
      { itemId: "rice_dish", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["carter", "traveller", "local"],
    look: { body: "m2", wander: true },
    likes: ["rice_dish", "leather", "gold"],
    dislikes: ["book"],
  },
  {
    id: "village_noname_child_xiaowu",
    name: XIAOWU,
    description: "เด็กกำพร้าช่างพูดผู้ตั้งชื่อให้ทุกสิ่งในหมู่บ้านที่ไม่มีชื่อ — รวมถึงคนแปลกหน้าด้วย",
    locationIds: ["village_noname"],
    dialogSceneId: "npc_village_noname_child_xiaowu_talk",
    tags: ["child", "local"],
    look: { body: "m1", wander: true },
    likes: ["moon_cake", "rice_dish", "fortune_charm"],
    dislikes: ["herb"],
  },

  // ─── village_huashan ──────────────────────────────────────────────
  {
    id: "village_huashan_teacher_ling",
    name: LING,
    description: "อดีตจอมกระบี่ผู้เปิดลานดินสอนเด็กในหมู่บ้านถือดาบไม้ เข้มงวดแต่แอบให้ขนมทุกเย็น",
    locationIds: ["village_huashan"],
    dialogSceneId: "npc_village_huashan_teacher_ling_talk",
    defenseTier: 2,
    tags: ["elder", "swordsman", "teacher"],
    look: { body: "elder" },
    likes: ["moon_cake", "book", "iron_sword"],
    dislikes: ["venom"],
  },
  {
    id: "village_huashan_dreamer_yang",
    name: YANG,
    description: "ชายหนุ่มผู้สอบเข้าสำนักหัวซานตกมาสามปีซ้อน ยังตื่นมาฝึกกระบี่รับแสงอรุณทุกเช้าไม่เคยขาด",
    locationIds: ["village_huashan"],
    dialogSceneId: "npc_village_huashan_dreamer_yang_talk",
    sparOpponentId: "spar_village_huashan_dreamer_yang",
    sparFameReward: 3,
    defenseTier: 1,
    tags: ["swordsman", "sparring"],
    look: { body: "m3", wander: true },
    likes: ["potion", "cooked_meat", "steel_sword"],
    dislikes: ["spicy_stew"],
  },
  {
    id: "village_huashan_apprentice_tie",
    name: TIE,
    description: "ลูกมือช่างเหล็กถังร่างอ้วนกลม หน้าเปื้อนเขม่าตลอดเวลา ฝันอยากตีดาบให้ศิษย์หัวซานสักเล่ม",
    locationIds: ["village_huashan"],
    dialogSceneId: "npc_village_huashan_apprentice_tie_talk",
    stealLoot: [
      { itemId: "iron_ingot", weight: 2 },
      { itemId: "iron_ore", weight: 3, count: [1, 2] },
      { itemId: "iron_blade", weight: 1 },
    ],
    tags: ["craftsman", "forge", "blacksmith"],
    look: { body: "m4", wander: true },
    likes: ["iron_ore", "cooked_meat", "material"],
    dislikes: ["book"],
  },

  // ─── village_taishan ──────────────────────────────────────────────
  {
    id: "village_taishan_porter_shi",
    name: SHI,
    description: "ลูกหาบไหล่เหล็กแห่งไท่ซาน แบกของขึ้นบันไดเจ็ดพันขั้นด้วยไม้คานเพียงอันเดียว พูดน้อย กินจุ",
    locationIds: ["village_taishan"],
    dialogSceneId: "npc_village_taishan_porter_shi_talk",
    sparOpponentId: "spar_village_taishan_porter_shi",
    sparFameReward: 4,
    defenseTier: 2,
    tags: ["porter", "staff_master", "local"],
    look: { body: "m2", wander: true },
    likes: ["cooked_meat", "spicy_stew", "potion"],
    dislikes: ["book"],
  },
  {
    id: "village_taishan_granny_die",
    name: DIE,
    description: "ยายแก่ขายผีเสื้อกระดาษให้ผู้แสวงบุญ หายใจช้ายาวจนใครเห็นก็นึกว่านั่งหลับ",
    locationIds: ["village_taishan"],
    dialogSceneId: "npc_village_taishan_granny_die_talk",
    defenseTier: 1,
    tags: ["elder", "herbalist"],
    look: { body: "f4" },
    likes: ["lotus_seed", "herb", "moon_cake"],
    dislikes: ["venom"],
  },
  {
    id: "village_taishan_pilgrim_chen",
    name: CHEN,
    description: "บัณฑิตตกยากผู้พยายามขึ้นยอดไท่ซานไปชมอรุณมาแล้วเก้าครั้ง หลับก่อนถึงยอดทุกครั้ง",
    locationIds: ["village_taishan"],
    dialogSceneId: "npc_village_taishan_pilgrim_chen_talk",
    stealLoot: [
      { itemId: "paper", weight: 3, count: [1, 2] },
      { itemId: "ink", weight: 2 },
      { itemId: "ancient_coin", weight: 1 },
    ],
    tags: ["scholar", "pilgrim"],
    look: { body: "m3", wander: true },
    likes: ["book", "paper", "ink"],
    dislikes: ["material"],
  },

  // ─── inn_youjian ──────────────────────────────────────────────────
  {
    id: "inn_youjian_keeper_mei",
    name: MEI,
    description: "เถ้าแก่เนี้ยปากคมแห่งโรงเตี๊ยมมีหว่าง คิดเงินเร็วกว่าลูกคิด และดูออกทุกครั้งว่าแขกโกหก",
    locationIds: ["inn_youjian"],
    dialogSceneId: "npc_inn_youjian_keeper_mei_talk",
    defenseTier: 3,
    stealLoot: [
      { itemId: "ancient_coin", weight: 3 },
      { itemId: "silk", weight: 2 },
      { itemId: "jade", weight: 1 },
    ],
    tags: ["innkeeper", "merchant"],
    look: { body: "f2" },
    likes: ["silk", "jade_pendant", "valuable"],
    dislikes: ["raw_meat"],
  },
  {
    id: "inn_youjian_cook_bao",
    name: BAO,
    description: "พ่อครัวซาลาเปามือหนาผู้นวดแป้งวันละพันลูก ฝ่ามือนุ่มเหมือนเมฆแต่ตบโต๊ะทีไรถ้วยกระโดด",
    locationIds: ["inn_youjian"],
    dialogSceneId: "npc_inn_youjian_cook_bao_talk",
    defenseTier: 1,
    tags: ["chef"],
    look: { body: "m4" },
    likes: ["raw_meat", "herb", "food"],
    dislikes: ["venom"],
  },
  {
    id: "inn_youjian_diviner_gua",
    name: GUA,
    description: "หมอดูประจำโต๊ะริมหน้าต่าง ทำนายแม่นจนน่ากลัว แต่ชอบทำนายแต่เรื่องที่ผ่านไปแล้ว",
    locationIds: ["inn_youjian"],
    dialogSceneId: "npc_inn_youjian_diviner_gua_talk",
    defenseTier: 2,
    stealLoot: [
      { itemId: "ancient_coin", weight: 2 },
      { itemId: "paper", weight: 2 },
      { itemId: "book_basic", weight: 1 },
    ],
    tags: ["scholar", "diviner"],
    look: { body: "elder" },
    likes: ["book", "ink", "ancient_coin"],
    dislikes: ["spicy_stew"],
  },
];

// ═══════════════════════════════════════════════════════════════════
// Opponents (spars and named quest foes)
// ═══════════════════════════════════════════════════════════════════

const OPPONENTS: StoryOpponentSpec[] = [
  { id: "spar_village_noname_whip_qiao", name: QIAO, ti: 2, category: "human",
    look: { sheet: "f3" },
    stats: { DEX: 7, AGI: 6, STR: 5, VIT: 3 },
    skillIds: ["nd1", "ne6", "pn"] },
  { id: "spar_village_noname_carter_lu", name: LU, ti: 1, category: "human",
    look: { sheet: "m2" },
    stats: { STR: 5, AGI: 4, VIT: 4 },
    skillIds: ["nd1", "basic_punch"] },
  { id: "foe_noname_masked_disciple", name: "ซือหลางหน้ากากเหล็ก", ti: 3, category: "human",
    look: { sheet: "m4", tint: 0x6a6070, size: 1.1 },
    stats: { DEX: 10, AGI: 9, STR: 7, VIT: 5 },
    skillIds: ["nf7", "ne6", "nd9", "ch"] },
  { id: "spar_village_huashan_dreamer_yang", name: YANG, ti: 1, category: "human",
    look: { sheet: "m3" },
    stats: { POW: 5, STR: 4, AGI: 4 },
    skillIds: ["nd6", "qf", "nd3"] },
  { id: "spar_village_taishan_porter_shi", name: SHI, ti: 2, category: "human",
    look: { sheet: "m2", size: 1.1 },
    stats: { POW: 7, STR: 6, VIT: 6 },
    skillIds: ["ne10", "nd4", "dg"] },
  { id: "foe_taishan_toll_chief", name: "หัวหน้าโจรเก็บค่าผ่านทาง", ti: 2, category: "human",
    look: { sheet: "m4", tint: 0x8a6a4a },
    stats: { STR: 7, VIT: 6, AGI: 4 },
    skillIds: ["ne3", "nc5", "ig"] },
  { id: "foe_youjian_shadow_diviner", name: "หมอดูเงา", ti: 2, category: "human",
    look: { sheet: "m3", tint: 0x5a5a7a },
    stats: { INT: 7, DEX: 6, AGI: 5 },
    skillIds: ["nd2", "ne4", "nd9"] },
  { id: "foe_youjian_sky_room_guest", name: "หลี่เซียวเฟิง", ti: 3, category: "human",
    look: { sheet: "m3", tint: 0xb0a0c8, size: 1.05 },
    stats: { INT: 10, POW: 9, AGI: 7, DEX: 6 },
    skillIds: ["nf2", "nh2", "nd6"], artId: "t3_heartmind", artLevel: 3 },
];

// ═══════════════════════════════════════════════════════════════════
// Quests
// ═══════════════════════════════════════════════════════════════════

const QUESTS: QuestDef[] = [
  // ─── village_noname ───────────────────────────────────────────────
  {
    id: "qv_noname_eight_lash",
    type: "side",
    name: "วิชาลึกลับของคนขับเกวียน",
    description: "ลู่เกวียนถูกโจรเส้นทางดักปล้นบนทางทรายจนวัวตื่นหนีไปครึ่งฝูง เขาจะสอนวิชาลึกลับให้ ถ้าเจ้าช่วยไล่โจรและหาหนังมาถักแส้เส้นใหม่",
    briefSummary: "ปราบโจรเส้นทาง 3 คน แล้วนำหนังสัตว์ 2 ผืนมาให้ลู่เกวียน",
    giverNpcId: "village_noname_carter_lu",
    prereqs: { t: "statAtLeast", stat: "AGI", min: 10 },
    stages: [
      { id: "bandits", description: "ปราบโจรเส้นทาง 3 คนที่ดักปล้นเกวียนแถวหมู่บ้านไร้นาม",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 3 } },
      { id: "hide", description: "หาหนังสัตว์ 2 ผืนให้ลู่เกวียนถักแส้เส้นใหม่",
        autoAdvance: { t: "hasItem", itemId: "fur_pelt", count: 2 } },
      { id: "return", description: "กลับไปหาลู่เกวียนที่หมู่บ้านไร้นาม" },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "learnSkill", skillId: "nd1" },
      { t: "npcRelationship", npcId: "village_noname_carter_lu", amount: 10 },
    ],
  },
  {
    id: "qv_noname_rampart_whip",
    type: "side",
    name: "แส้ของยายเฉียว",
    description: "ยายเฉียวเห็นเจ้าฟาดแส้แล้วบ่นว่า 'ตีลมทั้งวัน' นางยอมสอนแส้ที่ฟาดทะลุโล่ไม้ได้ ถ้าเจ้าทนฝึกกับต้นหลิวแห้งและรับแส้นางได้สักยก",
    briefSummary: "ฝึกฟาดแส้ใส่ต้นหลิวแห้ง แล้วประลองกับยายเฉียว",
    giverNpcId: "village_noname_whip_qiao",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: "village_noname_whip_qiao", min: 5 },
    ] },
    stages: [
      { id: "willow", description: "ฟาดแส้ใส่ต้นหลิวแห้งท้ายหมู่บ้านไร้นามจนเปลือกร่อน",
        objective: { hours: 2, spots: [
          { locationId: "village_noname", label: "ฟาดแส้ใส่ต้นหลิวแห้ง",
            text: "เปลือกหลิวร่อนเป็นริ้ว ข้อมือเจ้าชาจนแทบถือแส้ไม่อยู่ — ยายเฉียวพยักหน้าเล็กน้อยจากหน้าคอกแพะ" },
        ] } },
      { id: "spar", description: "รับแส้ยายเฉียวหนึ่งยกที่หมู่บ้านไร้นาม",
        objective: { spots: [
          { locationId: "village_noname", label: "ประลองแส้กับยายเฉียว", sceneId: "qd_qv_noname_rampart_whip_spar" },
        ] } },
      { id: "return", description: "กลับไปคารวะยายเฉียว" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnSkill", skillId: "ne6" },
      { t: "npcRelationship", npcId: "village_noname_whip_qiao", amount: 10 },
    ],
  },
  {
    id: "qv_noname_nine_tails",
    type: "side",
    name: "วิชาลึกลับใต้ซากหอคอย",
    description: "ยายเฉียวเล่าความลับว่าครั้งหนึ่งนางคือนางพญาแส้แห่งด่านทราย ผู้ฝังแส้ของตนไว้ใต้ซากเมืองร้าง บัดนี้มีชายสวมหน้ากากเหล็กตามหาแส้นั้นอยู่",
    briefSummary: "ถักแส้ใหม่ ขุดด้ามแส้เก่าที่ซากเมืองร้าง แล้วเผชิญชายหน้ากากเหล็ก",
    giverNpcId: "village_noname_whip_qiao",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "DEX", min: 25 },
      { t: "npcRelationship", npcId: "village_noname_whip_qiao", min: 15 },
      { t: "questStatus", questId: "qv_noname_rampart_whip", status: "done" },
    ] },
    stages: [
      { id: "braid", description: "หาหนังงู 3 ผืนและหนังฟอก 2 ผืนมาให้ยายเฉียวถักหางแส้เก้าเส้น",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "snake_skin", count: 3 },
          { t: "hasItem", itemId: "leather", count: 2 },
        ] } },
      { id: "dig", description: "ขุดหาด้ามแส้เก่าใต้ซากหอคอยในซากเมืองร้าง",
        objective: { hours: 2, spots: [
          { locationId: "desert_ruins", label: "ขุดใต้ซากหอคอย",
            text: "ใต้ทรายลึกสามศอกมีกล่องเหล็กขึ้นสนิม ข้างในคือด้ามแส้หัวมังกร... และรอยเท้าสดใหม่ของใครบางคนที่มาถึงก่อนเจ้า" },
        ] } },
      { id: "masked", description: "เผชิญชายหน้ากากเหล็กที่ตามมาถึงหมู่บ้านไร้นาม",
        objective: { spots: [
          { locationId: "village_noname", label: "เผชิญชายหน้ากากเหล็ก", sceneId: "qd_qv_noname_nine_tails_masked" },
        ] } },
      { id: "return", description: "นำด้ามแส้กลับไปให้ยายเฉียว" },
    ],
    rewards: [
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "jade_amulet", count: 1 },
      { t: "learnSkill", skillId: "nf7" },
      { t: "npcRelationship", npcId: "village_noname_whip_qiao", amount: 15 },
      { t: "trait", trait: "good", amount: 2 },
    ],
  },

  // ─── village_huashan ──────────────────────────────────────────────
  {
    id: "qv_huashan_clear_wind",
    type: "side",
    name: "ดาบไม้ของลานดิน",
    description: "ดาบไม้ของเด็ก ๆ ในลานฝึกครูหลิงหักหมด ครูหลิงขอไม้เนื้ออ่อนมาเหลาใหม่ แลกกับกระบวนท่าวิชาลึกลับที่เขาสอนเด็กทุกคน",
    briefSummary: "นำไม้เนื้ออ่อน 3 ท่อนมาให้ครูหลิง",
    giverNpcId: "village_huashan_teacher_ling",
    stages: [
      { id: "wood", description: "หาไม้เนื้ออ่อน 3 ท่อน (ร้านในหมู่บ้านมีขาย)",
        autoAdvance: { t: "hasItem", itemId: "wood_soft", count: 3 } },
      { id: "return", description: "นำไม้ไปให้ครูหลิงที่ลานดินหมู่บ้านหัวซาน" },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "learnSkill", skillId: "qf" },
      { t: "npcRelationship", npcId: "village_huashan_teacher_ling", amount: 10 },
    ],
  },
  {
    id: "qv_huashan_yang_sword",
    type: "side",
    name: "กระบี่รับอรุณ",
    description: "หยางซื่อคิดกระบวนท่าลึกลับขึ้นเองจากการฝึกรับแสงอรุณมาสามปี แต่ไม่มีใครเชื่อ เขาขอให้เจ้าเป็นพยานยามเช้า และช่วยสั่งสอนพวกคนร้ายที่มาเยาะเย้ยเขาทุกวัน",
    briefSummary: "ฝึกรับอรุณกับหยางซื่อ แล้วปราบคนร้าย 3 คน",
    giverNpcId: "village_huashan_dreamer_yang",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "dawn", description: "ฝึกกระบี่รับแสงอรุณกับหยางซื่อที่ลานหินหมู่บ้านหัวซาน",
        objective: { hours: 2, spots: [
          { locationId: "village_huashan", label: "ฝึกกระบี่รับแสงอรุณ",
            text: "แสงแรกกระทบใบกระบี่ ลมปราณร้อนวิ่งจากฝ่าเท้าขึ้นถึงข้อมือ — หยางซื่อตะโกนว่า 'เห็นไหม! ข้าไม่ได้บ้า!'" },
        ] } },
      { id: "bullies", description: "ปราบคนร้าย 3 คนที่ชอบมาเยาะเย้ยหยางซื่อ",
        autoAdvance: { t: "defeatedOpponent", opponentId: "ruffian", count: 3 } },
      { id: "return", description: "กลับไปหาหยางซื่อที่หมู่บ้านหัวซาน" },
    ],
    rewards: [
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "learnSkill", skillId: "nd6" },
      { t: "npcRelationship", npcId: "village_huashan_dreamer_yang", amount: 10 },
    ],
  },
  {
    id: "qv_huashan_forge_ore",
    type: "side",
    name: "เหล็กเล่มแรกของเถี่ยตัน",
    description: "เถี่ยตันอยากตีดาบเล่มแรกของตัวเองให้เสร็จก่อนอาจารย์ถังกลับมา แต่เขาเผลอเอาแร่ของร้านไปขายแลกเนื้อย่างหมดแล้ว",
    briefSummary: "นำแร่เหล็ก 3 ก้อนและไม้เนื้อแข็ง 2 ท่อนมาให้เถี่ยตัน",
    giverNpcId: "village_huashan_apprentice_tie",
    stages: [
      { id: "ore", description: "หาแร่เหล็ก 3 ก้อนและไม้เนื้อแข็ง 2 ท่อนสำหรับเผาถ่าน",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "iron_ore", count: 3 },
          { t: "hasItem", itemId: "wood_hard", count: 2 },
        ] } },
      { id: "return", description: "นำของไปให้เถี่ยตันที่ร้านตีเหล็กหมู่บ้านหัวซาน" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "iron_ingot", count: 1 },
      { t: "npcRelationship", npcId: "village_huashan_apprentice_tie", amount: 10 },
    ],
  },

  // ─── village_taishan ──────────────────────────────────────────────
  {
    id: "qv_taishan_butterfly_breath",
    type: "side",
    name: "ลมหายใจผีเสื้อ",
    description: "ยายเตี๋ยหายใจช้าจนผีเสื้อมาเกาะไหล่ นางบอกว่าเป็นแค่วิชาหายใจของคนแก่ ถ้าเจ้าช่วยหาสมุนไพรกับขนมมาให้ นางจะสอนให้",
    briefSummary: "นำสมุนไพรหายาก 2 หน่วยและขนมไหว้พระจันทร์ 1 ชิ้นมาให้ยายเตี๋ย",
    giverNpcId: "village_taishan_granny_die",
    stages: [
      { id: "gifts", description: "หาสมุนไพรหายาก 2 หน่วยและขนมไหว้พระจันทร์ 1 ชิ้น",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "herb", count: 2 },
          { t: "hasItem", itemId: "moon_cake", count: 1 },
        ] } },
      { id: "return", description: "นำของไปให้ยายเตี๋ยที่หมู่บ้านไท่ซาน" },
    ],
    rewards: [
      { t: "gold", amount: 60 },
      { t: "learnArt", artId: "t0_butterfly", level: 1 },
      { t: "npcRelationship", npcId: "village_taishan_granny_die", amount: 10 },
    ],
  },
  {
    id: "qv_taishan_porter_load",
    type: "side",
    name: "หาบแทนสือเปียนตาน",
    description: "สือเปียนตานข้อเท้าแพลง แต่ศาลกลางทางขึ้นเขายังรอธูปกับน้ำมันตะเกียง เขาขอให้เจ้าแบกแทนสักเที่ยว",
    briefSummary: "แบกธูปและน้ำมันตะเกียงขึ้นบันไดไท่ซาน",
    giverNpcId: "village_taishan_porter_shi",
    stages: [
      { id: "carry", description: "แบกของสองหาบขึ้นบันไดหินเหนือหมู่บ้านไท่ซาน",
        objective: { hours: 2, spots: [
          { locationId: "village_taishan", label: "แบกหีบธูปขึ้นบันได",
            text: "ไม้คานกดไหล่จนชา ขั้นที่ร้อยเจ้าเริ่มเข้าใจว่าทำไมสือเปียนตานไม่ค่อยพูด" },
          { locationId: "village_taishan", label: "แบกไหน้ำมันตะเกียงไปศาลกลางทาง",
            text: "เฒ่าเฝ้าศาลรับไหน้ำมันไปพลางบ่นว่า 'มาช้ากว่าเจ้าสือตั้งครึ่งชั่วยาม'" },
        ] } },
      { id: "return", description: "กลับไปบอกสือเปียนตานว่าของถึงแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "wExp", amount: 30 },
      { t: "npcRelationship", npcId: "village_taishan_porter_shi", amount: 10 },
    ],
  },
  {
    id: "qv_taishan_wind_staff",
    type: "side",
    name: "วิชาลึกลับบนไม้คาน",
    description: "ไม้คานของสือเปียนตานหมุนได้เร็วจนเกิดลม เขาไม่เคยเรียกมันว่าวิชา แต่เมื่อโจรมาตั้งด่านเก็บค่าผ่านทางผู้แสวงบุญ เขาก็ยอมสอนเจ้าให้ใช้มัน",
    briefSummary: "ประลองไม้คานกับสือเปียนตาน แล้วขับไล่หัวหน้าโจรเก็บค่าผ่านทาง",
    giverNpcId: "village_taishan_porter_shi",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 15 },
      { t: "npcRelationship", npcId: "village_taishan_porter_shi", min: 5 },
    ] },
    stages: [
      { id: "spar", description: "ประลองไม้คานกับสือเปียนตานที่หมู่บ้านไท่ซาน",
        objective: { spots: [
          { locationId: "village_taishan", label: "ประลองไม้คานกับสือเปียนตาน", sceneId: "qd_qv_taishan_wind_staff_spar" },
        ] } },
      { id: "toll", description: "ขับไล่หัวหน้าโจรที่ตั้งด่านเก็บค่าผ่านทางเชิงบันไดไท่ซาน",
        objective: { spots: [
          { locationId: "village_taishan", label: "ไปที่ด่านโจรเชิงบันได", sceneId: "qd_qv_taishan_wind_staff_toll" },
        ] } },
      { id: "return", description: "กลับไปหาสือเปียนตานที่หมู่บ้านไท่ซาน" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnSkill", skillId: "ne10" },
      { t: "npcRelationship", npcId: "village_taishan_porter_shi", amount: 10 },
      { t: "trait", trait: "good", amount: 1 },
    ],
  },

  // ─── inn_youjian ──────────────────────────────────────────────────
  {
    id: "qv_youjian_cloud_palm",
    type: "side",
    name: "ซาลาเปาร้อยลูก",
    description: "ปาวซาลาเปาต้องนวดแป้งให้ทันแขกคณะใหญ่ เขาบอกว่าถ้าเจ้านวดแป้งร้อยลูกได้โดยแป้งไม่ขาด ฝ่ามือเจ้าก็พร้อมรับวิชาลึกลับแล้ว",
    briefSummary: "ช่วยปาวซาลาเปานวดแป้งในครัวโรงเตี๊ยมมีหว่าง",
    giverNpcId: "inn_youjian_cook_bao",
    stages: [
      { id: "knead", description: "นวดแป้งซาลาเปาร้อยลูกในครัวโรงเตี๊ยมมีหว่าง",
        objective: { hours: 2, spots: [
          { locationId: "inn_youjian", label: "นวดแป้งซาลาเปาร้อยลูก",
            text: "ลูกที่สิบแป้งขาด ลูกที่ห้าสิบเริ่มนุ่ม ลูกที่ร้อยฝ่ามือเจ้าลอยเบาเหมือนแตะก้อนเมฆ" },
        ] } },
      { id: "return", description: "กลับไปหาปาวซาลาเปาในครัว" },
    ],
    rewards: [
      { t: "gold", amount: 100 },
      { t: "item", itemId: "rice_dish", count: 2 },
      { t: "learnSkill", skillId: "nc4" },
      { t: "npcRelationship", npcId: "inn_youjian_cook_bao", amount: 10 },
    ],
  },
  {
    id: "qv_youjian_special_menu",
    type: "side",
    name: "เมนูพิเศษของมีหว่าง",
    description: "ใคร ๆ ก็ลือถึงเมนูพิเศษของโรงเตี๊ยมมีหว่าง เหมยเหนียงต้องการปลาคาร์ปสดสองตัว และให้เจ้ายกจานปิดฝาไปเสิร์ฟซินแสกว้า — ห้ามเปิดดู",
    briefSummary: "หาปลาคาร์ป 2 ตัว แล้วยกจานปิดฝาไปให้ซินแสกว้า",
    giverNpcId: "inn_youjian_keeper_mei",
    stages: [
      { id: "carp", description: "หาปลาคาร์ปสด 2 ตัวมาให้เหมยเหนียง",
        autoAdvance: { t: "hasItem", itemId: "fish_carp", count: 2 } },
      { id: "serve", description: "ยกจานปิดฝาไปเสิร์ฟซินแสกว้าที่โต๊ะริมหน้าต่าง",
        objective: { spots: [
          { locationId: "inn_youjian", npcId: "inn_youjian_diviner_gua", label: "ยกจานพิเศษไปเสิร์ฟ",
            text: "ซินแสกว้าเปิดฝาจาน ใต้ปลานึ่งมีกระดาษพับเล็ก ๆ เขาอ่านแล้วเผาทิ้งในเตาชาโดยไม่พูดสักคำ" },
        ] } },
      { id: "return", description: "กลับไปบอกเหมยเหนียงว่าเสิร์ฟแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: "inn_youjian_keeper_mei", amount: 10 },
    ],
  },
  {
    id: "qv_youjian_eight_gates",
    type: "side",
    name: "แปดประตูของซินแสกว้า",
    description: "ซินแสกว้าบอกว่าโรงเตี๊ยมนี้ตั้งอยู่บนผังแปดทิศพอดี และมีหมอดูอีกคนมาตั้งโต๊ะขวางประตูชีวิตของเขา เขาจะสอนวิชาลึกลับให้ผู้ที่เดินผังได้และไล่หมอดูเงาไปได้",
    briefSummary: "เดินผังแปดประตู แล้วขับไล่หมอดูเงา",
    giverNpcId: "inn_youjian_diviner_gua",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "INT", min: 15 },
      { t: "npcRelationship", npcId: "inn_youjian_diviner_gua", min: 5 },
    ] },
    stages: [
      { id: "gates", description: "ยืนตามประตูชีวิต ประตูเกิด และประตูเปิด ในโรงเตี๊ยมมีหว่างและริมทะเลสาบซูโจว",
        objective: { hours: 1, spots: [
          { locationId: "inn_youjian", label: "ยืนที่ประตูชีวิต (มุมตะวันออกเฉียงเหนือ)",
            text: "ลมพัดผ่านหน้าต่างพอดีกับลมหายใจเข้า เจ้ารู้สึกเหมือนทั้งห้องหายใจพร้อมเจ้า" },
          { locationId: "inn_youjian", label: "ยืนที่ประตูเกิด (ใต้ขื่อกลาง)",
            text: "เงาตะเกียงแปดดวงซ้อนกันเป็นวง เจ้าเห็นทางเดินที่ไม่เคยสังเกตมาก่อน" },
          { locationId: "city_suzhou", label: "ยืนที่ประตูเปิดริมทะเลสาบ",
            text: "เงาเจดีย์บนผิวน้ำชี้กลับไปทางโรงเตี๊ยมมีหว่างพอดี — ผังแปดทิศใหญ่กว่าที่คิด" },
        ] } },
      { id: "shadow", description: "ขับไล่หมอดูเงาที่ตั้งโต๊ะขวางประตูชีวิตของโรงเตี๊ยมมีหว่าง",
        objective: { spots: [
          { locationId: "inn_youjian", label: "เผชิญหมอดูเงา", sceneId: "qd_qv_youjian_eight_gates_shadow" },
        ] } },
      { id: "return", description: "กลับไปหาซินแสกว้าที่โต๊ะริมหน้าต่าง" },
    ],
    rewards: [
      { t: "wExp", amount: 200 },
      { t: "learnArt", artId: "t2_eighttri", level: 1 },
      { t: "npcRelationship", npcId: "inn_youjian_diviner_gua", amount: 10 },
    ],
  },
  {
    id: "qv_youjian_heart_mind",
    type: "side",
    name: "แขกห้องฟ้า",
    description: "แขกห้องฟ้าชั้นบนไม่ยอมลงมากินข้าวมาเจ็ดวัน เหมยเหนียงขอให้เจ้าเฝ้ายามดึก — และบอกว่าถ้าเจ้ามองใจเขาออก นางจะสอนวิชาที่อาจารย์ของนางสอนให้มองใจคน",
    briefSummary: "ต้มชาสงบใจ เฝ้าห้องฟ้ายามดึก แล้วเผชิญหน้าแขกปริศนา",
    giverNpcId: "inn_youjian_keeper_mei",
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "INT", min: 25 },
      { t: "npcRelationship", npcId: "inn_youjian_keeper_mei", min: 15 },
      { t: "questStatus", questId: "qv_youjian_special_menu", status: "done" },
    ] },
    stages: [
      { id: "tea", description: "หาโสม 2 ราก และเม็ดบัว 2 กำ มาต้มชาสงบใจให้เหมยเหนียง",
        autoAdvance: { t: "and", all: [
          { t: "hasItem", itemId: "ginseng", count: 2 },
          { t: "hasItem", itemId: "lotus_seed", count: 2 },
        ] } },
      { id: "watch", description: "เฝ้าหน้าห้องฟ้าชั้นบนโรงเตี๊ยมมีหว่างยามดึก",
        objective: { hours: 3, spots: [
          { locationId: "inn_youjian", label: "เฝ้าหน้าห้องฟ้ายามดึก",
            text: "ยามสาม ประตูห้องฟ้าแง้มออก ชายในห้องไม่ได้นอน — เขานั่งวาดภาพหน้าเหมยเหนียงซ้ำไปซ้ำมาจนเต็มพื้นห้อง" },
        ] } },
      { id: "confront", description: "เผชิญหน้าแขกห้องฟ้าที่โรงเตี๊ยมมีหว่าง",
        objective: { spots: [
          { locationId: "inn_youjian", label: "เคาะประตูห้องฟ้า", sceneId: "qd_qv_youjian_heart_mind_guest" },
        ] } },
      { id: "return", description: "กลับไปหาเหมยเหนียงที่โต๊ะคิดเงิน" },
    ],
    rewards: [
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "jade_pendant", count: 1 },
      { t: "learnArt", artId: "t3_heartmind", level: 1 },
      { t: "npcRelationship", npcId: "inn_youjian_keeper_mei", amount: 15 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// Dialogs
// ═══════════════════════════════════════════════════════════════════

/** An offer (briefing) scene: lines, then one choice back to the place. */
function offer(questId: string, place: string, lines: SceneLine[], go = "รับคำ"): DialogScene {
  return { kind: "dialog", id: `qs_${questId}_offer`, lines, choices: [{ text: go, next: place }] };
}
/** A hand-in scene that closes the quest. */
function complete(questId: string, place: string, lines: SceneLine[], go = "รับไว้ด้วยความขอบคุณ"): DialogScene {
  return {
    kind: "dialog", id: `qs_${questId}_complete`, lines,
    choices: [{ text: go, effects: [{ t: "finishQuest", questId, success: true }], next: place }],
  };
}
/** A terminal side dialog (shows ปิด). */
const aside = (id: string, lines: SceneLine[]): DialogScene => ({ kind: "dialog", id, lines });

const SCENES: DialogScene[] = [
  // ─── Talk: village_noname ─────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_village_noname_whip_qiao_talk",
    lines: [
      narr("หญิงชรานั่งบนขอนไม้หน้าคอกแพะ แส้หนังขดอยู่บนตักเหมือนงูหลับ"),
      say(QIAO, "มองอะไร ไม่เคยเห็นคนแก่ต้อนแพะรึ"),
      narr("แพะตัวหนึ่งเดินออกนอกแถว ปลายแส้สะบัดเปรี๊ยะ — ใบไม้หน้าจมูกมันขาดสองท่อน แต่ขนแพะไม่ร่วงสักเส้น"),
      say(QIAO, "หมู่บ้านนี้ไม่มีชื่อ คนที่อยู่ก็ไม่อยากมีชื่อ เจ้าเองก็อย่าถามชื่อใครให้มากนัก"),
      say(QIAO, "ถ้าอยากคุย เอาขนมไหว้พระจันทร์มาสักชิ้น ฟันข้ายังดีพอจะเคี้ยว"),
    ],
    choices: [
      { text: "ถามว่าเมื่อก่อนยายเป็นใคร", next: "npc_village_noname_whip_qiao_talk_past" },
      { text: "ถามเรื่องคนแปลกหน้าในหมู่บ้าน", next: "npc_village_noname_whip_qiao_talk_rumor" },
      { text: "คารวะแล้วลาไป", next: "village_noname" },
    ],
  },
  aside("npc_village_noname_whip_qiao_talk_past", [
    say(QIAO, "เมื่อก่อนข้าก็เป็นยายแก่ต้อนแพะนี่แหละ แค่ยังไม่แก่"),
    narr("นางหัวเราะแห้ง ๆ แล้วลูบแส้บนตัก"),
    say(QIAO, "แส้เส้นนี้เส้นที่สามสิบแล้ว เส้นแรกน่ะ... ข้าฝังไว้ที่ที่ไม่มีใครอยากไป"),
    say(QIAO, "ถ้าเจ้าข้อมือแข็งพอวันหนึ่ง ข้าอาจสอนให้แส้มันทะลุอะไรได้มากกว่าใบไม้"),
  ]),
  aside("npc_village_noname_whip_qiao_talk_rumor", [
    say(QIAO, "สองสามคืนมานี้มีคนเดินวนรอบซากเมืองร้างทางใต้ ใส่หน้ากากเหล็ก"),
    say(QIAO, "ลู่เกวียนเห็นแล้วตกใจจนวัวหลุดเชือก ฮึ คนขับเกวียนสมัยนี้ใจเสาะ"),
    say(QIAO, "ข้าไม่สนหรอก... ไม่สนจริง ๆ"),
    narr("แต่นิ้วนางกำด้ามแส้แน่นจนข้อขาว"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_noname_carter_lu_talk",
    lines: [
      narr("ชายร่างหนาเดินเลาะเกวียนวัว ตรวจเชือกพลางบ่นกับวัวเสียงดัง"),
      say(LU, "เฮ้ย! ผู้เดินทาง! ไปซากเมืองร้างไหม? ห้าเหรียญ ไม่ต่อ!"),
      say(LU, "อ้อ ไม่ไป? งั้นก็ช่างเถอะ ทางทรายช่วงนี้ไม่ค่อยปลอดภัยอยู่แล้ว"),
      say(LU, "โจรเส้นทางมันดักตรงเนินทรายเงียบ ข้าหวดแส้แปดทิศไล่ได้สองคน คนที่สามขโมยวัวข้าไปเฉย"),
      narr("เขาสะบัดแส้ฟาดอากาศรอบตัวแปดครั้งเร็วจนเสียงดังติดกันเป็นสาย"),
    ],
    choices: [
      { text: "ชมว่าแส้เมื่อครู่ไม่ธรรมดา", next: "npc_village_noname_carter_lu_talk_whip" },
      { text: "ถามข่าวบนเส้นทางทราย", next: "npc_village_noname_carter_lu_talk_rumor" },
      { text: "ลาไป", next: "village_noname" },
    ],
  },
  aside("npc_village_noname_carter_lu_talk_whip", [
    say(LU, "ฮ่า! ตาถึงนี่! ข้าเรียนจากพ่อ พ่อเรียนจากปู่ ปู่ขโมยดูมาจากยายเฉียวตอนนางยังสาว"),
    say(LU, "อย่าไปบอกนางนะ นางยังไม่รู้"),
    say(LU, "ถ้าเจ้าขาไวพอ และช่วยไล่โจรพวกนั้นให้ข้าได้ ข้าสอนให้ก็ได้ — ไม่คิดเงิน คิดแค่หนังสัตว์สองผืนไว้ถักแส้ใหม่"),
  ]),
  aside("npc_village_noname_carter_lu_talk_rumor", [
    say(LU, "ซากเมืองร้างมีคนขุดทรายหาของเก่ากันทั้งปี ส่วนใหญ่ได้แต่ทรายเข้าหู"),
    say(LU, "แต่เมื่อวานมีคนใส่หน้ากากเหล็กจ้างเกวียนข้าไปส่ง จ่ายเป็นเงินแท่ง ข้าไม่กล้ารับ"),
    say(LU, "คนที่จ่ายเกินราคาน่ะ ข้าไม่ไว้ใจ"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_noname_child_xiaowu_talk",
    lines: [
      narr("เด็กชายผอมแห้งวิ่งมาหยุดตรงหน้าเจ้า เอียงคอมองตั้งแต่หัวจรดเท้า"),
      say(XIAOWU, "ข้าตั้งชื่อให้ทุกอย่างในหมู่บ้าน! บ่อน้ำนั่นชื่อ 'ป้าน้ำลาย' แพะยายเฉียวชื่อ 'ท่านขุนนาง'"),
      say(XIAOWU, "เจ้าชื่ออะไร? ไม่ต้องบอก! ข้าตั้งให้เอง..."),
      narr("เขาหลับตาครุ่นคิดอยู่นาน"),
      say(XIAOWU, "'พี่รองเท้าเปื้อนทราย'! เหมาะมาก!"),
    ],
    choices: [
      { text: "ถามว่าเสี่ยวอู๋ตั้งชื่อตัวเองว่าอะไร", next: "npc_village_noname_child_xiaowu_talk_name" },
      { text: "หัวเราะแล้วลาไป", next: "village_noname" },
    ],
  },
  aside("npc_village_noname_child_xiaowu_talk_name", [
    say(XIAOWU, "เสี่ยวอู๋ไง! ยายเฉียวเรียกข้าว่า 'อู๋' แปลว่าไม่มี เพราะข้าไม่มีพ่อแม่"),
    say(XIAOWU, "แต่ข้าว่ามันแปลว่า 'ห้า' ด้วย เพราะข้ากินซาลาเปาได้ห้าลูก!"),
    say(XIAOWU, "พี่รองเท้าเปื้อนทรายมีขนมไหม? ข้าจะตั้งชื่อขนมให้ก่อนกิน"),
  ]),

  // ─── Talk: village_huashan ────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_village_huashan_teacher_ling_talk",
    lines: [
      narr("ชายชราผมขาวยืนกลางลานดิน เด็กสิบกว่าคนฟาดดาบไม้ตามจังหวะไม้ตะพดที่เขาเคาะพื้น"),
      say(LING, "หนึ่ง! สอง! หยวน เจ้าฟาดพี่เจ้าอีกทีข้าจะฟาดเจ้าคืน!"),
      say(LING, "อ้อ ผู้มาเยือน ยืนดูได้ ไม่เสียเงิน แต่ถ้าหัวเราะเด็กข้า เสียฟัน"),
      say(LING, "เด็กพวกนี้ครึ่งหนึ่งจะขึ้นเขาไปสอบเข้าหัวซาน อีกครึ่งจะกลับมาทำนา ข้าสอนเหมือนกันหมด"),
    ],
    choices: [
      { text: "ถามว่าครูหลิงเคยอยู่หัวซานหรือไม่", next: "npc_village_huashan_teacher_ling_talk_past" },
      { text: "ถามเรื่องดาบไม้ที่หักกองอยู่มุมลาน", next: "npc_village_huashan_teacher_ling_talk_hook" },
      { text: "ลาไป", next: "village_huashan" },
    ],
  },
  aside("npc_village_huashan_teacher_ling_talk_past", [
    say(LING, "เคยอยู่ เคยออก เคยกลับมา — เรื่องยาว คนแก่ไม่ชอบเล่าเรื่องยาว"),
    say(LING, "สิ่งเดียวที่ข้าเอาลงมาจากเขาคือชิงเฟิงเจี้ยน กระบี่ลมใส ไม่หรูหรา แต่ไม่เคยทำให้ใครตาย"),
    say(LING, "เพราะงั้นข้าถึงกล้าสอนเด็ก"),
  ]),
  aside("npc_village_huashan_teacher_ling_talk_hook", [
    say(LING, "นั่นแหละปัญหา เด็กพวกนี้ฟาดกันเองจนดาบไม้หักหมด"),
    say(LING, "ข้าต้องการไม้เนื้ออ่อนสามท่อนมาเหลาใหม่ ร้านในหมู่บ้านก็มีขาย แต่ขาข้าไม่ค่อยดี"),
    say(LING, "ช่วยข้าสักหน่อย ข้าจะสอนชิงเฟิงเจี้ยนให้เจ้าเหมือนสอนเด็ก ๆ — ไม่มีลด ไม่มีแถม"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_huashan_dreamer_yang_talk",
    lines: [
      narr("ชายหนุ่มเหงื่อท่วมกำลังร่ายกระบี่หันหน้าไปทางทิศตะวันออก ทั้งที่ตอนนี้ไม่ใช่เวลาเช้าแล้ว"),
      say(YANG, "ข้ากำลังจำแสงเมื่อเช้าอยู่ อย่าเพิ่งพูด... เอาละ พูดได้"),
      say(YANG, "ข้าหยางซื่อ สอบเข้าหัวซานตกมาสามปี ปีแรกเพราะป่วย ปีสองเพราะฝนตก ปีสามเพราะ... ข้าก็ไม่รู้"),
      say(YANG, "แต่ข้าคิดกระบี่ท่าหนึ่งได้เอง รับแสงอรุณเข้ากระบี่ ฟันทีเดียวเกราะผ่อน"),
      narr("ไกล ๆ มีเสียงหัวเราะเยาะของพวกคนร้ายประจำหมู่บ้าน"),
    ],
    choices: [
      { text: "ถามเรื่องกระบี่ที่เขาคิดเอง", next: "npc_village_huashan_dreamer_yang_talk_sword" },
      { text: "ให้กำลังใจว่าปีหน้าคงสอบติด", next: "npc_village_huashan_dreamer_yang_talk_cheer" },
      { text: "ลาไป", next: "village_huashan" },
    ],
  },
  aside("npc_village_huashan_dreamer_yang_talk_sword", [
    say(YANG, "ข้าเรียกมันว่ากระบี่หยาง ฟังดูโอ่ไปหน่อย แต่ชื่อข้าก็หยาง ไม่ใช้ก็เสียของ"),
    say(YANG, "ไม่มีใครเชื่อว่ามันใช้ได้จริง ถ้าเจ้ามีลมปราณพอ มาเป็นพยานให้ข้าตอนเช้าสักวันเถอะ"),
    say(YANG, "แล้วถ้าเจ้าช่วยปิดปากพวกที่หัวเราะข้าทุกวันได้... ข้าสอนให้หมดเปลือก"),
  ]),
  aside("npc_village_huashan_dreamer_yang_talk_cheer", [
    say(YANG, "ปีหน้า! ใช่! ปีหน้าข้าจะไปตั้งแต่ตีสาม จะได้ไม่ติดฝน"),
    narr("เขากำหมัดแน่น แล้วก็ลดลงช้า ๆ"),
    say(YANG, "...ถ้าปีหน้าไม่ติดอีก ข้าจะเปิดลานสอนเด็กแข่งกับครูหลิง ฮ่า ๆ"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_huashan_apprentice_tie_talk",
    lines: [
      narr("เด็กหนุ่มอ้วนหน้าดำด้วยเขม่าวิ่งออกมาจากร้านตีเหล็ก ในมือยังถือค้อน"),
      say(TIE, "ท่านมาสั่งดาบ? อาจารย์ถังไม่อยู่ ไปส่งดาบบนเขา! ข้าเถี่ยตัน ลูกมือ ตีได้... เกือบทุกอย่าง"),
      say(TIE, "อย่ามองเตานะ มันดับเพราะถ่านหมด ไม่ใช่เพราะข้าลืมเติม"),
      say(TIE, "...ก็ลืมนิดหน่อย"),
    ],
    choices: [
      { text: "ถามว่าแร่ของร้านหายไปไหน", next: "npc_village_huashan_apprentice_tie_talk_hook" },
      { text: "ถามข่าวคราวบนเขาหัวซาน", next: "npc_village_huashan_apprentice_tie_talk_rumor" },
      { text: "ลาไป", next: "village_huashan" },
    ],
  },
  aside("npc_village_huashan_apprentice_tie_talk_hook", [
    say(TIE, "คือ... ข้าเอาไปแลกเนื้อย่างที่ตลาด มันหอมมาก ท่านไม่เข้าใจหรอก"),
    say(TIE, "ถ้าอาจารย์กลับมาเจอเตาว่าง ข้าโดนค้อนแน่ ต้องการแร่เหล็กสามก้อน ไม้เนื้อแข็งสองท่อนไว้เผาถ่าน"),
    say(TIE, "ช่วยข้าที แล้วข้าจะตีแท่งเหล็กให้ท่านหนึ่งแท่ง — ตีเองกับมือ!"),
  ]),
  aside("npc_village_huashan_apprentice_tie_talk_rumor", [
    say(TIE, "อาจารย์บอกว่าบนเขาช่วงนี้สั่งดาบเยอะผิดปกติ สายกระบี่กับสายลมปราณทะเลาะกันอีกแล้วมั้ง"),
    say(TIE, "ข้าไม่สนเรื่องสาย ข้าสนแค่ว่าเขาจ่ายตรงเวลา"),
  ]),

  // ─── Talk: village_taishan ────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_village_taishan_porter_shi_talk",
    lines: [
      narr("ชายไหล่กว้างวางไม้คานพาดบ่า ปลายทั้งสองข้างแขวนหีบไม้หนักอึ้ง แต่เขายืนนิ่งเหมือนไม่มีอะไรอยู่บนบ่า"),
      say(SHI, "..."),
      say(SHI, "เจ็ดพันขั้น วันละสองเที่ยว"),
      say(SHI, "ขึ้นช้า ลงเร็ว ไม่พูด ไม่เหนื่อย"),
      narr("ท้องเขาร้องดังลั่น"),
      say(SHI, "...หิว"),
    ],
    choices: [
      { text: "ถามเรื่องไม้คานที่หมุนจนเกิดลม", next: "npc_village_taishan_porter_shi_talk_pole" },
      { text: "ถามข่าวบนทางขึ้นเขา", next: "npc_village_taishan_porter_shi_talk_rumor" },
      { text: "ลาไป", next: "village_taishan" },
    ],
  },
  aside("npc_village_taishan_porter_shi_talk_pole", [
    say(SHI, "ไม้คาน ไม่ใช่อาวุธ"),
    narr("เขาหมุนไม้คานรอบตัวหนึ่งรอบ ใบไม้แห้งรอบเท้าปลิวว่อนเป็นวง"),
    say(SHI, "...แต่ถ้าจำเป็น ก็เป็น"),
    say(SHI, "คนช่วยข้าแบก ข้าจำ"),
  ]),
  aside("npc_village_taishan_porter_shi_talk_rumor", [
    say(SHI, "โจร ตั้งด่าน เชิงบันได"),
    say(SHI, "เก็บเงินคนแก่ คนจน คนมาไหว้เทพ"),
    narr("ไม้คานในมือเขาลั่นเอี๊ยดเบา ๆ"),
    say(SHI, "ข้าไม่ชอบ"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_taishan_granny_die_talk",
    lines: [
      narr("หญิงชรานั่งหลับตาใต้ต้นสน รอบตัวมีผีเสื้อกระดาษหลากสีปักไม้เรียงเป็นแถว ผีเสื้อจริงตัวหนึ่งเกาะอยู่บนไหล่นาง"),
      say(DIE, "ชู่ว... อย่าเดินแรง มันกำลังหายใจพร้อมข้า"),
      say(DIE, "ผีเสื้อกระดาษตัวละสองเหรียญ ซื้อไปปล่อยบนยอดเขา เทพไท่ซานจะได้รู้ว่าเจ้ามา"),
      say(DIE, "หรือจะนั่งหายใจกับยายสักพักก็ได้ ไม่คิดเงิน"),
    ],
    choices: [
      { text: "ถามว่าทำไมผีเสื้อมาเกาะยาย", next: "npc_village_taishan_granny_die_talk_breath" },
      { text: "ถามเรื่องตำนานของไท่ซาน", next: "npc_village_taishan_granny_die_talk_legend" },
      { text: "ลาไป", next: "village_taishan" },
    ],
  },
  aside("npc_village_taishan_granny_die_talk_breath", [
    say(DIE, "เพราะยายหายใจช้าพอ มันเลยนึกว่ายายเป็นดอกไม้"),
    say(DIE, "สามีข้าเป็นนักพรตบนเขา สอนลมปราณผีเสื้อให้ข้าไว้รักษาอาการหอบ ตอนนี้เขาไปแล้ว เหลือแต่ลมหายใจนี่"),
    say(DIE, "ถ้าเจ้าเอาสมุนไพรกับขนมมาฝากยาย ยายจะสอนให้ — หายใจเป็นแล้วแผลก็หายไว"),
  ]),
  aside("npc_village_taishan_granny_die_talk_legend", [
    say(DIE, "ฮ่องเต้ทุกองค์ต้องขึ้นมาเซ่นฟ้าที่นี่ เดินขึ้นเองนะ ไม่มีใครหาม"),
    say(DIE, "องค์หนึ่งเหนื่อยจนนั่งพักกลางทาง แล้วตั้งชื่อหินก้อนนั้นว่า 'หินฮ่องเต้เหนื่อย'"),
    say(DIE, "บัณฑิตเฉินชอบไปนั่งหลับบนหินก้อนนั้นทุกครั้ง เลยไม่เคยถึงยอดสักที"),
  ]),
  {
    kind: "dialog",
    id: "npc_village_taishan_pilgrim_chen_talk",
    lines: [
      narr("บัณฑิตเสื้อปะชุนเดินวนรอบหมู่บ้าน มือถือพู่กัน ปากท่องบทกวีชมอรุณ"),
      say(CHEN, "ยลอรุณเหนือไท่ซาน ฟ้าแยกจากดิน... อา! สวัสดีสหาย"),
      say(CHEN, "ข้าเฉิน บัณฑิตสอบตกเจ็ดครั้ง ขึ้นเขาชมอรุณไม่ถึงยอดเก้าครั้ง ตัวเลขดีทั้งคู่ใช่ไหม"),
      say(CHEN, "บทกวีชมอรุณข้าแต่งเสร็จแล้ว ขาดแต่อรุณจริง ๆ ให้ชม"),
    ],
    choices: [
      { text: "ถามว่าทำไมขึ้นไม่ถึงยอดสักที", next: "npc_village_taishan_pilgrim_chen_talk_why" },
      { text: "ขอฟังข่าวจากผู้แสวงบุญ", next: "npc_village_taishan_pilgrim_chen_talk_rumor" },
      { text: "ลาไป", next: "village_taishan" },
    ],
  },
  aside("npc_village_taishan_pilgrim_chen_talk_why", [
    say(CHEN, "ข้าออกตอนเที่ยงคืนทุกครั้ง แต่ถึงหินฮ่องเต้เหนื่อยก็ง่วง นั่งพักนิดเดียว..."),
    say(CHEN, "ตื่นมาอีกทีก็สาย อรุณผ่านไปแล้ว ผีเสื้อยายเตี๋ยเกาะหน้าข้าเต็ม"),
    say(CHEN, "ปีนี้ข้าจะลองให้สือเปียนตานหาบข้าขึ้นไป แต่เขาคิดค่าหาบเป็นเนื้อย่างสามจาน"),
  ]),
  aside("npc_village_taishan_pilgrim_chen_talk_rumor", [
    say(CHEN, "มีโจรตั้งด่านเชิงบันได เก็บค่าผ่านทางคนละสิบเหรียญ ข้าไม่มีสิบเหรียญ เลยยังไม่ได้ขึ้น"),
    say(CHEN, "อีกเรื่อง สำนักไท่ซานบนเขากับสำนักซงซานทางตะวันตกมองหน้ากันไม่ติดอีกแล้ว"),
    say(CHEN, "บัณฑิตอย่างข้าได้แต่แต่งกลอนเสียดสีทั้งสองฝ่าย... เบา ๆ"),
  ]),

  // ─── Talk: inn_youjian ────────────────────────────────────────────
  {
    kind: "dialog",
    id: "npc_inn_youjian_keeper_mei_talk",
    lines: [
      narr("หญิงวัยกลางคนในชุดสีหมากสุกเคาะลูกคิดเร็วจนเป็นเสียงเดียว ตาไม่ละจากบัญชีแต่เห็นเจ้าตั้งแต่ก้าวเข้าประตู"),
      say(MEI, "ห้องธรรมดาคืนละสามสิบ ห้องดีห้าสิบ ห้องฟ้ามีคนเช่าแล้ว ไม่ต้องถาม"),
      say(MEI, "กินข้าวสั่งที่เด็ก จะฟังข่าวนั่งใกล้ซินแส จะก่อเรื่องออกไปก่อนนอกประตู"),
      say(MEI, "ส่วนเรื่องเมนูพิเศษที่คนลือกัน... ใครถามข้าคิดค่าถามสิบเหรียญ"),
      narr("นางเงยหน้าขึ้นยิ้มนิดหนึ่ง"),
      say(MEI, "ล้อเล่น ห้าเหรียญพอ"),
    ],
    choices: [
      { text: "ถามเรื่องโรงเตี๊ยมคู่แข่ง", next: "npc_inn_youjian_keeper_mei_talk_rival" },
      { text: "ถามถึงแขกห้องฟ้า", next: "npc_inn_youjian_keeper_mei_talk_sky" },
      { text: "ลาไป", next: "inn_youjian" },
    ],
  },
  aside("npc_inn_youjian_keeper_mei_talk_rival", [
    say(MEI, "เฉาอ้วนที่เกาเซิ่งน่ะรึ ส่งคนมาแอบชิมเมนูข้าเดือนละสามรอบ"),
    say(MEI, "ข้าให้ชิมเต็มที่ ชิมไปก็ทำไม่ได้ เพราะเมนูพิเศษของข้าไม่ได้อยู่ที่ปลา"),
    say(MEI, "อยู่ที่ใครเป็นคนกิน"),
  ]),
  aside("npc_inn_youjian_keeper_mei_talk_sky", [
    narr("ลูกคิดหยุดชั่วครู่หนึ่ง"),
    say(MEI, "แขกจ่ายล่วงหน้าเดือนหนึ่ง เงียบ ไม่ก่อเรื่อง ไม่กินข้าว"),
    say(MEI, "แขกแบบนี้ข้าชอบที่สุด"),
    narr("แต่เสียงลูกคิดหลังจากนั้นช้าลงอย่างเห็นได้ชัด"),
  ]),
  {
    kind: "dialog",
    id: "npc_inn_youjian_cook_bao_talk",
    lines: [
      narr("กลิ่นซาลาเปานึ่งลอยออกจากครัว ชายร่างใหญ่นวดแป้งด้วยฝ่ามือทั้งสอง แป้งพองฟูราวก้อนเมฆ"),
      say(BAO, "หิวไหม? หิวแน่ หน้าแบบนี้หิว"),
      say(BAO, "ซาลาเปาข้านุ่มที่สุดในเขตซูโจว เพราะข้าไม่นวดด้วยแรง ข้านวดด้วยลม"),
      narr("เขาตบแป้งเบา ๆ ครั้งเดียว ถ้วยชาบนโต๊ะข้าง ๆ กระโดดขึ้นหนึ่งนิ้ว"),
      say(BAO, "อุ๊ย ลืมตัว"),
    ],
    choices: [
      { text: "ถามว่าฝ่ามือนั่นเรียนมาจากไหน", next: "npc_inn_youjian_cook_bao_talk_palm" },
      { text: "ขอฟังซุบซิบในครัว", next: "npc_inn_youjian_cook_bao_talk_rumor" },
      { text: "ลาไป", next: "inn_youjian" },
    ],
  },
  aside("npc_inn_youjian_cook_bao_talk_palm", [
    say(BAO, "พ่อข้าเป็นนักมวยเร่ ตีคนไม่เป็น แต่นวดแป้งเก่ง"),
    say(BAO, "เขาบอกว่าฝ่ามือเมฆต้องนุ่มก่อนจะหนัก ใครนวดแป้งร้อยลูกไม่ขาด ก็เรียนได้"),
    say(BAO, "วันนี้คณะผู้แสวงบุญจองซาลาเปาสามร้อยลูก ข้านวดไม่ทัน... เจ้าอยากลองไหม?"),
  ]),
  aside("npc_inn_youjian_cook_bao_talk_rumor", [
    say(BAO, "เถ้าแก่เนี้ยสั่งปลาคาร์ปนึ่งทุกครั้งที่ซินแสกว้ามา แต่ซินแสไม่เคยกินปลา"),
    say(BAO, "แล้วแขกห้องฟ้าน่ะ ข้าวที่ส่งขึ้นไปลงมาเต็มชามทุกมื้อ ข้าเสียใจจะตาย"),
    say(BAO, "คนที่ไม่กินซาลาเปาข้า ต้องมีเรื่องในใจแน่ ๆ"),
  ]),
  {
    kind: "dialog",
    id: "npc_inn_youjian_diviner_gua_talk",
    lines: [
      narr("ชายชราเคราแพะนั่งริมหน้าต่าง บนโต๊ะมีกระดานแปดทิศกับเหรียญทองแดงสามเหรียญ"),
      say(GUA, "นั่งเถอะ ข้าดูออกแล้วว่าเจ้าจะนั่ง"),
      narr("เขาทอยเหรียญ พลิกดู แล้วพยักหน้า"),
      say(GUA, "เมื่อวานเจ้าเดินทางมาไกล กินข้าวไม่ตรงเวลา และเหยียบอะไรไม่ดีมา — ดูรองเท้าสิ"),
      say(GUA, "ข้าทำนายอดีตแม่นที่สุดในใต้หล้า อนาคตน่ะ... เดี๋ยวมันก็กลายเป็นอดีต แล้วค่อยทำนาย"),
    ],
    choices: [
      { text: "ขอให้ทำนายดวง", next: "npc_inn_youjian_diviner_gua_talk_fortune" },
      { text: "ถามเรื่องกระดานแปดทิศ", next: "npc_inn_youjian_diviner_gua_talk_board" },
      { text: "ลาไป", next: "inn_youjian" },
    ],
  },
  aside("npc_inn_youjian_diviner_gua_talk_fortune", [
    narr("ซินแสกว้าทอยเหรียญอีกรอบ คิ้วขมวดนิดหนึ่ง"),
    say(GUA, "ดวงเจ้า... ผ่านประตูมาแล้วหลายบาน แต่ยังไม่เคยหันกลับไปดูว่าเปิดทิ้งไว้กี่บาน"),
    say(GUA, "ฟังดูลึกซึ้งใช่ไหม ข้าพูดแบบนี้กับทุกคน แต่กับเจ้าข้าหมายความตามนั้นจริง ๆ"),
  ]),
  aside("npc_inn_youjian_diviner_gua_talk_board", [
    say(GUA, "โรงเตี๊ยมนี้สร้างบนผังแปดทิศพอดี ประตูชีวิตอยู่ที่หน้าต่างนี้ ข้าเลยนั่งตรงนี้มายี่สิบปี"),
    say(GUA, "แต่เดือนนี้มีหมอดูอีกคนมาตั้งโต๊ะขวางทางลมหน้าโรงเตี๊ยม ลมปราณทั้งร้านอุดตัน แขกทะเลาะกันทุกคืน"),
    say(GUA, "ถ้าเจ้าคบหาข้านานพอและหัวไวพอ ข้ามีวิชาหนึ่งจะสอน — แปดทิศมหาเวท เดินผังเป็นก็ต่อยคนเป็น"),
  ]),

  // ─── Quest dialogs: village_noname ────────────────────────────────
  offer("qv_noname_eight_lash", "village_noname", [
    say(LU, "ดี! ดีมาก! โจรเส้นทางพวกนั้นมีสามคน ดักแถวเนินทรายระหว่างนี้กับซากเมืองร้าง"),
    say(LU, "สู้กับมันต้องไม่ยืนนิ่ง แส้แปดทิศเกิดมาเพื่อสิ่งนี้ — ฟาดรอบตัว ไม่ให้ใครเข้าใกล้"),
    say(LU, "ไล่มันได้แล้ว หาหนังสัตว์มาสองผืนด้วย แส้เส้นเก่าข้าขาดไปตอนไล่คนที่สาม"),
    narr("วัวของเขาร้องมอ เหมือนจะเห็นด้วย"),
  ]),
  complete("qv_noname_eight_lash", "village_noname", [
    say(LU, "สามคน! เจ้าจัดการได้หมด! วัวข้ายังนอนหลับสบายเลย"),
    narr("เขาถักหนังสัตว์เป็นแส้เส้นใหม่อย่างคล่องมือ แล้วยื่นปลายแส้ให้เจ้า"),
    say(LU, "ยืนกลางวง ฟาดหน้า ฟาดหลัง ซ้าย ขวา แล้วเฉียงทั้งสี่ — ข้อมือเป็นแกน อย่าใช้ไหล่"),
    say(LU, "นั่น! เสียงแบบนั้นแหละ! แส้แปดทิศของตระกูลลู่... ที่ปู่ขโมยดูมาอีกที ฮ่า ๆ"),
    say(LU, "เงินนี่ก็รับไป ค่าเกวียนทั้งปีที่เจ้าช่วยข้าไว้"),
  ], "ขอบคุณลู่เกวียน"),
  offer("qv_noname_rampart_whip", "village_noname", [
    say(QIAO, "ข้าดูเจ้ามาหลายวันแล้ว แขนมีแรงแต่ฟาดลม"),
    say(QIAO, "แส้ที่ดีต้องหนักที่ปลาย เบาที่ด้าม ฟาดลงไปต้องทะลุของที่ขวางได้ ไม่ใช่แค่ส่งเสียง"),
    say(QIAO, "ไปฟาดต้นหลิวแห้งท้ายหมู่บ้านจนเปลือกมันร่อน แล้วมารับแส้ข้าสักยก"),
    say(QIAO, "ถ้าเจ้ายังยืนอยู่ได้ ข้าจะสอนแส้ทะลุปราการ ถ้าไม่ได้ ก็ไปนอนให้แพะเลีย"),
  ]),
  {
    kind: "dialog",
    id: "qd_qv_noname_rampart_whip_spar",
    lines: [
      narr("ยายเฉียวลุกจากขอนไม้ ปลดแส้จากเอว แพะทั้งคอกถอยไปเบียดกันที่มุม"),
      say(QIAO, "ข้าแก่แล้ว ไม่ออมมือหรอก เพราะออมไม่เป็น"),
      say(QIAO, "มา"),
    ],
    choices: [
      { text: "ตั้งท่ารับแส้ยายเฉียว",
        effects: [{ t: "triggerBattle", opponentId: "spar_village_noname_whip_qiao", onWin: "qd_qv_noname_rampart_whip_won", onLose: "qd_qv_noname_rampart_whip_lost", nonFatal: true }],
        next: "qd_qv_noname_rampart_whip_won" },
      { text: "ขอเวลาเตรียมตัวก่อน", next: "village_noname" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_noname_rampart_whip_won",
    lines: [
      narr("ปลายแส้ยายเฉียวตกลงพื้น นางหอบเบา ๆ แล้วหัวเราะออกมาเป็นครั้งแรก"),
      say(QIAO, "ฮึ ยังยืนอยู่ได้ แถมทำข้าเหงื่อออก"),
      say(QIAO, "มาหาข้าที่คอกแพะ จะสอนให้ว่าทำไมแส้ข้าทะลุโล่ไม้ได้"),
    ],
    choices: [{ text: "คารวะยายเฉียว", effects: [{ t: "advanceQuest", questId: "qv_noname_rampart_whip" }], next: "village_noname" }],
  },
  aside("qd_qv_noname_rampart_whip_lost", [
    narr("เจ้านอนแผ่อยู่กลางคอกแพะ แพะตัวหนึ่งเดินมาเลียหน้า"),
    say(QIAO, "บอกแล้วว่าจะได้นอนให้แพะเลีย พักให้หายแล้วมาใหม่"),
  ]),
  complete("qv_noname_rampart_whip", "village_noname", [
    say(QIAO, "ฟังให้ดี แส้ไม่ได้ฟาดด้วยแขน แส้ฟาดด้วยคลื่น"),
    narr("นางสะบัดแส้ช้า ๆ ให้ดู คลื่นวิ่งจากด้ามไปปลาย เร็วขึ้น เร็วขึ้น จนปลายแส้หายไปจากสายตา"),
    say(QIAO, "คลื่นแรกเปิด คลื่นที่สองแหวก คลื่นที่สามทะลุ — ปราการไหนก็ต้องเปิดทาง"),
    say(QIAO, "ข้าไม่ได้สอนใครมาสามสิบปี เจ้าอย่าทำให้ข้าเสียใจ"),
  ], "รับวิชาด้วยความเคารพ"),
  offer("qv_noname_nine_tails", "village_noname", [
    say(QIAO, "เจ้าเคยได้ยินชื่อ 'แส้เก้าหัว' ไหม"),
    narr("นางไม่รอคำตอบ"),
    say(QIAO, "สามสิบปีก่อน คนในยุทธภพกลัวชื่อนี้ ข้าฟาดคนมามากจนไม่อยากมีชื่ออีก เลยมาอยู่หมู่บ้านที่ไม่มีชื่อ"),
    say(QIAO, "แส้เส้นแรกของข้าฝังไว้ใต้ซากหอคอยในเมืองร้าง ตอนนี้มีคนใส่หน้ากากเหล็กตามหามัน"),
    say(QIAO, "หาหนังงูกับหนังฟอกมา ข้าจะถักหางแส้เก้าเส้นรอไว้ แล้วไปเอาด้ามแส้มาก่อนมันจะได้ไป"),
    say(QIAO, "...ระวังตัวด้วย คนที่รู้ว่าแส้อยู่ที่ไหน มีอยู่แค่คนเดียวนอกจากข้า"),
  ], "รับปากยายเฉียว"),
  {
    kind: "dialog",
    id: "qd_qv_noname_nine_tails_masked",
    lines: [
      narr("ชายสวมหน้ากากเหล็กยืนรอที่ปากทางหมู่บ้าน มือถือแส้เก้าหางที่หางทุกเส้นมีตะขอ"),
      say("ชายหน้ากากเหล็ก", "ด้ามแส้หัวมังกร ส่งมา"),
      say("ชายหน้ากากเหล็ก", "นางสอนข้าถึงแปดหัว แล้วหนีไปโดยไม่สอนหัวที่เก้า สามสิบปีที่ข้าตามหา นางรู้ไหม"),
      narr("เสียงเขาสั่นใต้หน้ากาก — เขาคือศิษย์ที่ยายเฉียวทิ้งไว้"),
    ],
    choices: [
      { text: "บอกว่าจะส่งด้ามแส้คืนให้ยายเฉียวเท่านั้น",
        effects: [{ t: "triggerBattle", opponentId: "foe_noname_masked_disciple", onWin: "qd_qv_noname_nine_tails_won", onLose: "qd_qv_noname_nine_tails_lost", nonFatal: true }],
        next: "qd_qv_noname_nine_tails_won" },
      { text: "ถอยไปตั้งหลักก่อน", next: "village_noname" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_noname_nine_tails_won",
    lines: [
      narr("หน้ากากเหล็กกระเด็นหลุด ใต้นั้นคือชายวัยกลางคนที่น้ำตานองหน้า"),
      say("ซือหลาง", "ข้าไม่ได้อยากได้แส้... ข้าแค่อยากถามนางว่าทำไมทิ้งข้า"),
      narr("ยายเฉียวยืนอยู่ตรงนั้นตั้งแต่เมื่อไรไม่รู้ แส้ในมือนางลดลงช้า ๆ"),
      say(QIAO, "เพราะหัวที่เก้าคือการรู้ว่าเมื่อไรต้องหยุดฟาด ซือหลาง ข้าเองก็เพิ่งเรียนรู้มันตอนทิ้งเจ้า"),
      say(QIAO, "ข้าขอโทษ"),
      narr("ซือหลางคุกเข่าลงต่อหน้าอาจารย์ แพะทั้งคอกพร้อมใจกันร้องเหมือนจะให้อภัยแทน"),
    ],
    choices: [{ text: "ปล่อยให้ศิษย์อาจารย์ได้คุยกัน", effects: [{ t: "advanceQuest", questId: "qv_noname_nine_tails" }], next: "village_noname" }],
  },
  aside("qd_qv_noname_nine_tails_lost", [
    narr("ตะขอทั้งเก้าเกี่ยวเสื้อเจ้าขาดเป็นริ้ว เจ้าทรุดลงกับทราย แต่ด้ามแส้ยังอยู่ในมือ"),
    say("ชายหน้ากากเหล็ก", "ข้าจะรอ ไปบอกนางว่าข้ารอ"),
  ]),
  complete("qv_noname_nine_tails", "village_noname", [
    narr("ยายเฉียวสวมด้ามแส้หัวมังกรเข้ากับหางทั้งเก้าที่นางถักรอไว้ มือนางไม่สั่นเลยสักนิด"),
    say(QIAO, "แส้เก้าหัว หัวแรกถึงแปดฟาดเพื่อชนะ หัวที่เก้าฟาดเพื่อหยุด"),
    say(QIAO, "ซือหลางจะอยู่ช่วยข้าต้อนแพะสักพัก เจ้าเด็กนั่นต้อนแพะไม่เป็นเลย น่าขัน"),
    say(QIAO, "เจ้าพาศิษย์ข้ากลับมา ข้าก็ให้วิชาที่ข้าเคยหวงที่สุดแก่เจ้า — กับเครื่องรางหยกนี่ ของที่ข้าใส่ตอนยังมีชื่อ"),
    say(QIAO, "ใช้มันให้ดี และจำหัวที่เก้าไว้ให้แม่น"),
  ], "คุกเข่ารับแส้เก้าหัว"),

  // ─── Quest dialogs: village_huashan ───────────────────────────────
  offer("qv_huashan_clear_wind", "village_huashan", [
    say(LING, "ดี ไม้เนื้ออ่อนสามท่อน ร้านหัวหมู่บ้านมีขาย อย่าซื้อท่อนที่มีตาไม้ มันหักง่าย"),
    say(LING, "เด็ก ๆ หยุดฝึกไปสองวันแล้ว เริ่มเอาไม้ไผ่มาฟาดกันแทน แย่กว่าเดิม"),
  ]),
  complete("qv_huashan_clear_wind", "village_huashan", [
    narr("ครูหลิงเหลาไม้เป็นดาบไม้หกเล่มในเวลาที่เจ้าดื่มชาหมดถ้วย แจกเด็ก ๆ แล้วยื่นเล่มสุดท้ายให้เจ้า"),
    say(LING, "ยืนแถวหลังสุด ทำตามเด็ก อย่าอาย"),
    say(LING, "ชิงเฟิงเจี้ยน — ลมใส ไม่ฟันลึก ไม่แทงตรงหัวใจ แค่บอกคู่ต่อสู้ว่าเจ้าเร็วกว่า"),
    narr("เด็กหญิงตัวเล็กที่สุดในแถวหันมาแก้ท่าให้เจ้าอย่างจริงจัง"),
    say(LING, "เก่ง เจ้าเรียนเร็วกว่าหยวนอีก แต่หยวนอายุห้าขวบนะ"),
  ], "คารวะครูหลิง"),
  offer("qv_huashan_yang_sword", "village_huashan", [
    say(YANG, "จริงเหรอ! เจ้าจะเป็นพยานให้ข้า!"),
    say(YANG, "พรุ่งนี้... ไม่สิ เมื่อไรก็ได้ที่เจ้าว่าง มาที่ลานหินทางตะวันออก ข้าจะร่ายกระบี่หยางให้ดู"),
    say(YANG, "แล้วพวกคนร้ายที่ชอบมาขว้างหินใส่ข้าตอนฝึก มันมีสามคน ถ้าเจ้าเจอ ฝากสั่งสอนด้วย"),
    say(YANG, "ข้าเองก็อยากสู้ แต่ครูหลิงบอกว่าคนที่สอบตกสามปีไม่ควรมีเรื่อง... เดี๋ยวปีหน้าเขาไม่รับ"),
  ]),
  complete("qv_huashan_yang_sword", "village_huashan", [
    say(YANG, "พวกมันไม่มาอีกแล้ว! เมื่อเช้าข้าฝึกได้ทั้งชั่วยามโดยไม่มีหินลอยมาสักก้อน!"),
    narr("หยางซื่อหันหน้าไปทางตะวันออก ยกกระบี่ขึ้นรับแสง"),
    say(YANG, "ดูนะ — สูดแสงเข้าทางเท้า ส่งผ่านเอว ปล่อยออกที่ปลายกระบี่ ฟันทีเดียว เกราะมันจะคลาย"),
    say(YANG, "ข้าไม่รู้ว่าหัวซานจะรับข้าไหม แต่อย่างน้อยกระบี่หยางของข้าก็มีศิษย์คนแรกแล้ว"),
    say(YANG, "เงินนี่ข้าเก็บไว้ค่าเดินทางขึ้นไปสอบ... แต่เจ้าเอาไปเถอะ ข้าจะเดินขึ้นไปเอง"),
  ], "รับกระบี่หยาง"),
  offer("qv_huashan_forge_ore", "village_huashan", [
    say(TIE, "จริงนะ! แร่เหล็กสามก้อน ไม้เนื้อแข็งสองท่อน"),
    say(TIE, "แร่หาได้ตามเหมืองหรือเขาหิน ไม้เนื้อแข็งตัดได้ในป่า"),
    say(TIE, "รีบหน่อยนะ อาจารย์ถังลงเขามาเมื่อไรข้าก็จบ"),
  ]),
  complete("qv_huashan_forge_ore", "village_huashan", [
    narr("เถี่ยตันโยนไม้ลงเตา สูบลมจนไฟลุกโชน แล้วตีแร่จนเป็นแท่งเหล็กเงาวับ"),
    say(TIE, "ดูสิ! แท่งแรกที่ไม่บิ่น! อาจารย์ต้องชมแน่"),
    say(TIE, "แท่งนี้ของท่าน ข้าสัญญาแล้ว — วันหนึ่งข้าจะตีดาบให้ท่านทั้งเล่ม ไม่ใช่แค่แท่ง"),
  ], "รับแท่งเหล็ก"),

  // ─── Quest dialogs: village_taishan ───────────────────────────────
  offer("qv_taishan_butterfly_breath", "village_taishan", [
    say(DIE, "สมุนไพรสองหน่วยกับขนมไหว้พระจันทร์ชิ้นหนึ่ง"),
    say(DIE, "สมุนไพรไว้ต้มน้ำให้ผีเสื้อ ขนมไว้ให้ยาย ยายแก่แล้ว กินของหวานได้"),
    say(DIE, "ไม่ต้องรีบ ผีเสื้อไม่เคยรีบ"),
  ]),
  complete("qv_taishan_butterfly_breath", "village_taishan", [
    narr("ยายเตี๋ยกินขนมช้า ๆ ทีละคำ แล้วชี้ให้เจ้านั่งข้าง ๆ ใต้ต้นสน"),
    say(DIE, "หายใจเข้า นับสี่ กลั้นนับสี่ ออกนับแปด — เหมือนผีเสื้อกระพือปีก ขึ้นเร็ว ลงช้า"),
    say(DIE, "ลมปราณจะไหลเบาจนบาดแผลลืมเจ็บ พิษที่ค้างก็จะหลุดออกไปกับลมหายใจ"),
    narr("ผ่านไปครู่หนึ่ง ผีเสื้อสีเหลืองตัวหนึ่งบินมาเกาะไหล่เจ้า"),
    say(DIE, "เห็นไหม มันนึกว่าเจ้าเป็นดอกไม้แล้ว เงินนี่รับไปซื้อผีเสื้อกระดาษไปปล่อยบนยอดนะ"),
  ], "ขอบคุณยายเตี๋ย"),
  offer("qv_taishan_porter_load", "village_taishan", [
    say(SHI, "ข้อเท้า แพลง"),
    say(SHI, "หีบธูป ไปบันได ไหน้ำมัน ไปศาลกลางทาง"),
    say(SHI, "ไหล่ตรง เดินช้า อย่าหยุด"),
    narr("เขายื่นไม้คานให้ ไม้คานหนักกว่าที่เจ้าคิดสองเท่า"),
  ]),
  complete("qv_taishan_porter_load", "village_taishan", [
    say(SHI, "ถึงแล้ว"),
    say(SHI, "...ดี"),
    narr("เขาตบไหล่เจ้าหนึ่งครั้ง เจ้าทรุดลงครึ่งตัว"),
    say(SHI, "ค่าหาบ เอาไป คนช่วยข้าแบก ข้าจำ"),
  ], "รับค่าหาบ"),
  offer("qv_taishan_wind_staff", "village_taishan", [
    say(SHI, "เจ้า ช่วยข้าแบก ข้าจำ"),
    say(SHI, "โจร ตั้งด่าน เชิงบันได ข้าไปคนเดียว ข้าจะตีมันตาย"),
    say(SHI, "ไม่ดี"),
    say(SHI, "เจ้ารับไม้คานข้าให้ได้ก่อน แล้วไปไล่มัน ไล่ ไม่ใช่ฆ่า"),
    say(SHI, "พลองลม ไม่ได้ตีให้เจ็บ ตีให้ล้ม ให้ลืม ให้วิ่ง"),
  ]),
  {
    kind: "dialog",
    id: "qd_qv_taishan_wind_staff_spar",
    lines: [
      narr("สือเปียนตานปลดหีบออกจากไม้คาน หมุนมันรอบตัวช้า ๆ หนึ่งรอบ ลมพัดฝุ่นขึ้นเป็นวงรอบเท้าเจ้า"),
      say(SHI, "รับ"),
    ],
    choices: [
      { text: "ตั้งท่ารับไม้คาน",
        effects: [{ t: "triggerBattle", opponentId: "spar_village_taishan_porter_shi", onWin: "qd_qv_taishan_wind_staff_spar_won", onLose: "qd_qv_taishan_wind_staff_spar_lost", nonFatal: true }],
        next: "qd_qv_taishan_wind_staff_spar_won" },
      { text: "ขอพักก่อน", next: "village_taishan" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_taishan_wind_staff_spar_won",
    lines: [
      narr("ไม้คานหยุดหมุน สือเปียนตานหายใจแรงเป็นครั้งแรกที่เจ้าเคยเห็น"),
      say(SHI, "ดี"),
      say(SHI, "ไปด่าน เชิงบันได"),
    ],
    choices: [{ text: "มุ่งหน้าไปที่ด่านโจร", effects: [{ t: "advanceQuest", questId: "qv_taishan_wind_staff" }], next: "village_taishan" }],
  },
  aside("qd_qv_taishan_wind_staff_spar_lost", [
    narr("ไม้คานปัดขาเจ้าทีเดียว ท้องฟ้ากับพื้นดินสลับที่กัน"),
    say(SHI, "ล้ม ลืม... อย่าวิ่ง พักแล้วมาใหม่"),
  ]),
  {
    kind: "dialog",
    id: "qd_qv_taishan_wind_staff_toll",
    lines: [
      narr("ไม้ขวางทางเชิงบันได ชายหน้าบากนั่งบนหีบเงิน ลูกน้องสองคนยืนเก็บเหรียญจากหญิงชราผู้แสวงบุญ"),
      say("หัวหน้าโจรเก็บค่าผ่านทาง", "ผ่านทางคนละสิบเหรียญ ไหว้เทพยังต้องจ่ายค่าธูป ผ่านทางก็ต้องจ่ายค่าบันได"),
      say("หัวหน้าโจรเก็บค่าผ่านทาง", "ไม่จ่ายก็กลับไปไหว้เทพที่บ้าน ฮ่า ๆ"),
    ],
    choices: [
      { text: "หมุนไม้คานเข้าใส่",
        effects: [{ t: "triggerBattle", opponentId: "foe_taishan_toll_chief", onWin: "qd_qv_taishan_wind_staff_toll_won", onLose: "qd_qv_taishan_wind_staff_toll_lost", nonFatal: true }],
        next: "qd_qv_taishan_wind_staff_toll_won" },
      { text: "ถอยไปเตรียมตัวก่อน", next: "village_taishan" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_taishan_wind_staff_toll_won",
    lines: [
      narr("หัวหน้าโจรล้มกลิ้งลงบันไดสามขั้น ลุกขึ้นมาแล้ววิ่งไม่หันหลัง ลูกน้องวิ่งตามไปพร้อมหีบเงินเปล่า"),
      narr("หญิงชราผู้แสวงบุญเก็บเหรียญคืนแจกทุกคน แล้วโค้งให้เจ้า"),
      say(CHEN, "ทางโล่งแล้ว! ปีนี้ข้าจะได้เห็นอรุณจริง ๆ สักที!"),
    ],
    choices: [{ text: "กลับไปหาสือเปียนตาน", effects: [{ t: "advanceQuest", questId: "qv_taishan_wind_staff" }], next: "village_taishan" }],
  },
  aside("qd_qv_taishan_wind_staff_toll_lost", [
    narr("ไม้กระบองของโจรกระแทกเข้าที่ท้อง เจ้ากลิ้งลงบันไดมาหยุดที่เท้าสือเปียนตาน"),
    say(SHI, "ลมยังไม่พอ พักแล้วไปใหม่"),
  ]),
  complete("qv_taishan_wind_staff", "village_taishan", [
    say(SHI, "ไล่ ไม่ฆ่า ดี"),
    narr("เขาวางไม้คานลงในมือเจ้า แล้วจับมือเจ้าหมุนช้า ๆ หนึ่งรอบ"),
    say(SHI, "หมุนจากเอว ไม่ใช่แขน ปลายไม้กินลม ลมกินตามัน มันมองไม่เห็น มันพลาด"),
    say(SHI, "พ่อข้าหาบ ปู่ข้าหาบ ไม่มีใครเรียกวิชา เจ้าเรียกพลองลมก็ได้ ชื่อดี"),
    narr("เป็นประโยคที่ยาวที่สุดที่เจ้าเคยได้ยินจากปากเขา"),
  ], "คารวะสือเปียนตาน"),

  // ─── Quest dialogs: inn_youjian ───────────────────────────────────
  offer("qv_youjian_cloud_palm", "inn_youjian", [
    say(BAO, "ดี! ล้างมือ ถอดแหวน พับแขนเสื้อ"),
    say(BAO, "นวดแป้งห้ามใช้แรง ใช้แรงแป้งเหนียว ใช้ลมแป้งฟู"),
    say(BAO, "ร้อยลูกไม่ขาด ข้าสอนฝ่ามือเมฆให้ ขาดลูกไหนเริ่มนับใหม่ ฮ่า ๆ"),
  ], "พับแขนเสื้อ"),
  complete("qv_youjian_cloud_palm", "inn_youjian", [
    narr("ปาวซาลาเปาจับซาลาเปาลูกที่ร้อยขึ้นมาบีบเบา ๆ แป้งยุบแล้วคืนตัวช้า ๆ"),
    say(BAO, "นุ่ม! นุ่มเหมือนของข้า! เกือบ!"),
    say(BAO, "ทีนี้ ยกฝ่ามือขึ้น ปล่อยให้มันลอยเหมือนเมฆ แล้วค่อยวางน้ำหนักลงตอนแตะเป้า"),
    narr("เขาตบเสาครัวเบา ๆ ฝุ่นแป้งบนขื่อร่วงลงมาเป็นหิมะ"),
    say(BAO, "นั่นแหละฝ่ามือเมฆ ข้าวสองห่อนี่ค่าแรง เงินนี่ค่านวด กินให้อิ่มแล้วค่อยไปตบใคร"),
  ], "รับฝ่ามือเมฆ"),
  offer("qv_youjian_special_menu", "inn_youjian", [
    say(MEI, "เมนูพิเศษ ปลาคาร์ปนึ่งเหล้าเหลือง ข้าต้องการปลาสดสองตัว"),
    say(MEI, "ข้าทำเสร็จแล้ว เจ้ายกไปเสิร์ฟซินแสกว้าที่โต๊ะริมหน้าต่าง"),
    narr("นางวางฝาครอบลงบนจานเปล่าให้ดู แล้วจ้องตาเจ้า"),
    say(MEI, "ห้ามเปิดฝา ห้ามถาม ห้ามเล่าให้เฉาอ้วนฟัง ทำได้ไหม"),
  ], "รับปาก"),
  complete("qv_youjian_special_menu", "inn_youjian", [
    say(MEI, "ซินแสได้กินแล้ว? ดี"),
    say(MEI, "เจ้าไม่เปิดฝา ข้ารู้ เพราะถ้าเปิด ฝาจะไม่ได้วางทับรอยเดิม"),
    narr("นางนับเงินใส่มือเจ้าโดยไม่ต้องมองลูกคิด"),
    say(MEI, "คนที่เก็บความลับเป็น หายากกว่าปลาคาร์ปเสียอีก วันหลังข้าอาจมีงานที่ใหญ่กว่านี้ให้"),
  ], "รับเงิน"),
  offer("qv_youjian_eight_gates", "inn_youjian", [
    say(GUA, "ประตูมีแปด ชีวิต เกิด เปิด หยุด ทุกข์ ตาย ซ่อน และแสดง"),
    say(GUA, "เจ้าไม่ต้องจำ ไปยืนที่ประตูชีวิต ประตูเกิดในโรงเตี๊ยมนี้ แล้วไปยืนประตูเปิดที่ริมทะเลสาบซูโจว ร่างกายจะจำเอง"),
    say(GUA, "จากนั้นไปไล่หมอดูเงาที่ตั้งโต๊ะขวางลมหน้าโรงเตี๊ยม มันเป็นนักต้มตุ๋น แต่มือมันไม่ใช่ของนักต้มตุ๋น"),
    say(GUA, "ข้าทำนายได้ว่าเจ้าจะชนะ... หลังเจ้าชนะแล้วนะ"),
  ], "รับคำซินแส"),
  {
    kind: "dialog",
    id: "qd_qv_youjian_eight_gates_shadow",
    lines: [
      narr("ชายในชุดดำนั่งหลังโต๊ะหมอดูตรงทางลมพอดี บนโต๊ะไม่มีเหรียญ ไม่มีกระดาน มีแต่มีดสั้นปักอยู่เล่มหนึ่ง"),
      say("หมอดูเงา", "ดูดวงไหม? ข้าทำนายได้ว่าวันนี้เจ้าจะเจ็บตัว"),
      say("หมอดูเงา", "ตาเฒ่ากว้านั่งบนประตูชีวิตมายี่สิบปี ถึงตาคนอื่นบ้าง"),
    ],
    choices: [
      { text: "ก้าวเข้าประตูชีวิตแล้วตั้งท่า",
        effects: [{ t: "triggerBattle", opponentId: "foe_youjian_shadow_diviner", onWin: "qd_qv_youjian_eight_gates_shadow_won", onLose: "qd_qv_youjian_eight_gates_shadow_lost", nonFatal: true }],
        next: "qd_qv_youjian_eight_gates_shadow_won" },
      { text: "ถอยกลับไปตั้งหลัก", next: "inn_youjian" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_youjian_eight_gates_shadow_won",
    lines: [
      narr("หมอดูเงาเก็บโต๊ะหนีไปในพริบตา ลมเย็นจากทะเลสาบพัดผ่านประตูโรงเตี๊ยมเข้ามาเต็มห้อง"),
      narr("แขกสองโต๊ะที่กำลังทะเลาะกันหยุดกึก แล้วหันมาชนจอกกันแทน"),
    ],
    choices: [{ text: "กลับไปหาซินแสกว้า", effects: [{ t: "advanceQuest", questId: "qv_youjian_eight_gates" }], next: "inn_youjian" }],
  },
  aside("qd_qv_youjian_eight_gates_shadow_lost", [
    narr("เจ้าก้าวพลาดไปตกประตูทุกข์ มีดสั้นของหมอดูเงาเฉียดคอไปนิดเดียว"),
    say(GUA, "ข้าทำนายไว้แล้วว่าเจ้าจะแพ้รอบนี้ พักก่อน รอบหน้าค่อยชนะ"),
  ]),
  complete("qv_youjian_eight_gates", "inn_youjian", [
    say(GUA, "ลมกลับมาแล้ว ข้าทำนายไว้แล้วว่าจะเป็นเช่นนี้ — เมื่อครู่นี้เอง"),
    narr("ซินแสกว้าวางเหรียญทองแดงแปดเหรียญเป็นวงบนโต๊ะ แล้วให้เจ้าวางมือตรงกลาง"),
    say(GUA, "แปดทิศมหาเวท ไม่ใช่การเดินให้ครบแปดประตู แต่คือการรู้ว่าศัตรูยืนอยู่ประตูไหน แล้วเปิดประตูนั้นดูดลมปราณมันออกมา"),
    say(GUA, "เจ้ายืนประตูชีวิตได้แล้ว ต่อไปก็แค่อย่าเดินเข้าประตูตายเอง"),
    say(GUA, "ข้าทำนายได้ว่าเจ้าจะใช้มันดี... ไว้ข้าจะยืนยันอีกทีหลังจากนั้น"),
  ], "คารวะซินแสกว้า"),
  offer("qv_youjian_heart_mind", "inn_youjian", [
    say(MEI, "ข้าเคยมีอาจารย์ สอนวิชากลใจเป็นจิต วิชาที่มองใจคนออกเหมือนมองบัญชี"),
    say(MEI, "อาจารย์มีศิษย์สองคน ข้ากับศิษย์พี่ ก่อนตายท่านมอบคัมภีร์ให้ข้า ศิษย์พี่หาว่าข้าขโมย"),
    narr("ลูกคิดในมือนางนิ่งสนิท"),
    say(MEI, "แขกห้องฟ้า... ข้าไม่แน่ใจ ข้าไม่กล้ามองใจเขา กลัวจะเห็นสิ่งที่ไม่อยากเห็น"),
    say(MEI, "หาโสมกับเม็ดบัวมาต้มชาสงบใจ เฝ้าห้องเขายามดึกแทนข้า แล้วเคาะประตูแทนข้า"),
    say(MEI, "ถ้าเจ้ามองใจเขาออก ข้าจะสอนวิชานี้ให้ เพราะเจ้าจะพิสูจน์แล้วว่าใช้มันเป็น"),
  ], "รับปากเหมยเหนียง"),
  {
    kind: "dialog",
    id: "qd_qv_youjian_heart_mind_guest",
    paged: true,
    lines: [
      narr("เจ้าถือชาสงบใจขึ้นไปเคาะประตูห้องฟ้า ประตูเปิดออกเอง ภาพวาดใบหน้าเหมยเหนียงนับร้อยแผ่นปลิวว่อน"),
      say("หลี่เซียวเฟิง", "นางส่งเจ้ามา นางไม่กล้ามาเอง นางยังกลัวข้าอยู่"),
      say("หลี่เซียวเฟิง", "ข้าตามหานางสิบปี เพื่อเอาคัมภีร์ที่นางขโมยไปคืน"),
      narr("แต่ดวงตาของเขาไม่มีความแค้น — มีแต่ความเหนื่อยล้าของคนที่โกหกตัวเองมานาน"),
      say("หลี่เซียวเฟิง", "เจ้ามองข้าแบบนั้นทำไม! ข้าบอกว่าข้ามาเอาคัมภีร์!"),
      narr("ลมปราณในห้องปั่นป่วน เขาฝึกวิชาเดียวกับนาง และกำลังพยายามอ่านใจเจ้า"),
    ],
    choices: [
      { text: "สบตาเขาแล้วตั้งท่า",
        effects: [{ t: "triggerBattle", opponentId: "foe_youjian_sky_room_guest", onWin: "qd_qv_youjian_heart_mind_guest_won", onLose: "qd_qv_youjian_heart_mind_guest_lost", nonFatal: true }],
        next: "qd_qv_youjian_heart_mind_guest_won" },
      { text: "วางชาไว้แล้วถอยออกมาก่อน", next: "inn_youjian" },
    ],
  },
  {
    kind: "dialog",
    id: "qd_qv_youjian_heart_mind_guest_won",
    paged: true,
    lines: [
      narr("หลี่เซียวเฟิงทรุดลงกลางกองภาพวาด เจ้ายื่นชาสงบใจให้ เขารับไปถือไว้นาน"),
      say("หลี่เซียวเฟิง", "...ข้ารู้มาตลอด อาจารย์ให้คัมภีร์นาง เพราะใจข้าตอนนั้นเต็มไปด้วยความอยากชนะ"),
      say("หลี่เซียวเฟิง", "ข้าไม่ได้มาเอาคัมภีร์ ข้ามาเพราะอยากขอโทษ แต่ปากมันพูดไม่ออก"),
      narr("เสียงฝีเท้าบนบันได เหมยเหนียงยืนอยู่ที่ประตู ในมือไม่มีลูกคิด"),
      say(MEI, "ศิษย์พี่ ชาจะเย็นแล้ว"),
      narr("เจ้าปิดประตูห้องฟ้าเบา ๆ แล้วเดินลงบันไดมา"),
    ],
    choices: [{ text: "ปล่อยให้ศิษย์พี่ศิษย์น้องได้คุยกัน", effects: [{ t: "advanceQuest", questId: "qv_youjian_heart_mind" }], next: "inn_youjian" }],
  },
  aside("qd_qv_youjian_heart_mind_guest_lost", [
    narr("สายตาของหลี่เซียวเฟิงทะลุเข้ามาในใจเจ้า ทุกท่าที่เจ้าคิดจะออก เขาเห็นก่อนเจ้าขยับ"),
    say("หลี่เซียวเฟิง", "ใจเจ้ายังไม่นิ่งพอ กลับไปดื่มชาของเจ้าเองก่อนเถอะ"),
  ]),
  complete("qv_youjian_heart_mind", "inn_youjian", [
    narr("เช้าวันรุ่งขึ้น หลี่เซียวเฟิงลงมากินซาลาเปาสามลูก ปาวซาลาเปาร้องไห้ดีใจอยู่ในครัว"),
    say(MEI, "สิบปีที่ข้าหนี เจ้าใช้คืนเดียวทำให้จบ"),
    say(MEI, "วิชากลใจเป็นจิต ไม่ใช่การอ่านใจคนอื่น แต่คือการทำใจตัวเองให้นิ่งพอ จนใจคนอื่นสะท้อนลงมาเอง เหมือนน้ำนิ่งสะท้อนจันทร์"),
    narr("นางวางมือบนหน้าผากเจ้า ลมปราณเย็นไหลเข้ามาเหมือนน้ำชาไหลลงถ้วย"),
    say(MEI, "จี้หยกนี่อาจารย์ให้ข้าไว้คู่กับคัมภีร์ ข้ายกให้เจ้า ส่วนคัมภีร์... ข้าจะเผาทิ้งพรุ่งนี้กับศิษย์พี่"),
    say(MEI, "อ้อ ค่าห้องเดือนนี้ข้าไม่คิดเจ้า แต่เดือนหน้าคิดเต็มนะ"),
  ], "คารวะเหมยเหนียง"),

];

// ═══════════════════════════════════════════════════════════════════
// Activities
// ═══════════════════════════════════════════════════════════════════

const ACTIVITIES: ActivityDef[] = [
  {
    id: "act_noname_herd_goats", label: "ช่วยยายเฉียวต้อนแพะ", badge: "labor", icon: "🐐", hours: 2, stamina: 10,
    description: "ต้อนแพะยายเฉียวกลับคอก 2 ชั่วยาม · ฝึกความว่องไว · ได้เงินค่าแรงเล็กน้อย",
    place: {
      locationIds: ["village_noname"], cooldownDays: 1,
      reward: { gold: [10, 25], statXp: "AGI", relationship: { npcId: "village_noname_whip_qiao", amount: 1 } },
      doneText: "แพะครบทุกตัว ยายเฉียวพยักหน้าแล้วโยนเหรียญให้ — 'ยังวิ่งช้ากว่าแพะ'",
    },
  },
  {
    id: "act_huashan_wood_dummy", label: "ฝึกกระบี่กับหุ่นไม้", badge: "practice", icon: "🗡️", hours: 2, stamina: 12,
    description: "ฟันหุ่นไม้ข้างลานดินครูหลิง 2 ชั่วยาม · ฝึกความแม่นยำ · ได้ประสบการณ์ยุทธ์",
    place: {
      locationIds: ["village_huashan"], cooldownDays: 1,
      reward: { wExp: 15, statXp: "DEX" },
      doneText: "หุ่นไม้มีรอยกระบี่ใหม่สิบกว่ารอย เด็ก ๆ ในลานปรบมือให้",
    },
  },
  {
    id: "act_taishan_stone_steps", label: "ไต่บันไดหินพันขั้น", badge: "practice", icon: "⛰️", hours: 3, stamina: 20,
    description: "ไต่บันไดไท่ซานขึ้นลงหนึ่งเที่ยว 3 ชั่วยาม · ฝึกความอึด · ได้ประสบการณ์ยุทธ์",
    place: {
      locationIds: ["village_taishan"], cooldownDays: 1,
      reward: { wExp: 20, statXp: "VIT" },
      doneText: "ขาสั่นทั้งสองข้าง แต่ลมหายใจยาวขึ้น สือเปียนตานแซงเจ้าไปสองรอบระหว่างทาง",
    },
  },
  {
    id: "act_taishan_incense", label: "จุดธูปขอพรเทพไท่ซาน", badge: "rest", icon: "🪔", hours: 1, stamina: 0,
    description: "ถวายธูป 10 ตำลึงที่ศาลเชิงเขา · ใจสงบ ฟื้นแรงเล็กน้อย · บางทีได้เครื่องรางกลับมา",
    place: {
      locationIds: ["village_taishan"], cooldownDays: 7, costGold: 10,
      reward: { stamina: 15, trait: { trait: "humility", amount: 1 }, item: { itemId: "fortune_charm", count: 1, chance: 0.1 } },
      doneText: "ควันธูปลอยตรงขึ้นฟ้าไม่เอนเลย ผู้แสวงบุญข้าง ๆ กระซิบว่าเป็นลางดี",
    },
  },
  {
    id: "act_youjian_dice", label: "ทอยเต๋ากับแขกโต๊ะมุม", badge: "dice", icon: "🎲", hours: 1, stamina: 3,
    description: "เดิมพัน 20 ตำลึงกับแขกขี้เมา · ได้คืน 0–50 · ฝึกโชค",
    place: {
      locationIds: ["inn_youjian"], cooldownDays: 1, costGold: 20,
      reward: { gold: [0, 50], statXp: "LUK" },
      doneText: "ลูกเต๋ากลิ้งตกโต๊ะ เหมยเหนียงเก็บค่าโต๊ะไปหนึ่งเหรียญโดยไม่เงยหน้า",
    },
  },
  {
    id: "act_youjian_wash_bowls", label: "ช่วยล้างชามหลังครัว", badge: "labor", icon: "🍜", hours: 2, stamina: 10,
    description: "ล้างชามให้ปาวซาลาเปา 2 ชั่วยาม · ได้ค่าแรง · บางทีได้ข้าวกล่องติดมือ",
    place: {
      locationIds: ["inn_youjian"], cooldownDays: 1,
      reward: { gold: [15, 30], item: { itemId: "rice_dish", count: 1, chance: 0.5 }, relationship: { npcId: "inn_youjian_cook_bao", amount: 1 } },
      doneText: "ชามกองเท่าภูเขาหายไปหมด ปาวซาลาเปายัดซาลาเปาร้อน ๆ ใส่ปากเจ้าหนึ่งลูก",
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════


export const CONTENT: PlaceContent = {
  npcs: NPCS,
  quests: QUESTS,
  scenes: SCENES,
  activities: ACTIVITIES,
  opponents: OPPONENTS,
};
