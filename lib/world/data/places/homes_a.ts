// Homes A: the hero's own home, ฮูเฝย์'s frontier house, เฉิงคุน's house by
// the Ming grounds and หมอเซวี่ยมู่หัว's house near Butterfly Valley.
// People, quests, dialogs, things to do and meetings (PlaceContent).
//
// Skill quests here (each the only quest that teaches it):
//   t0_ironshirt  qw_home_player_iron_shirt        อาหนิว (home_player)
//   nc6           qw_home_player_cudgel             ลุงโจว (home_player)
//   nd8           qw_home_hufei_iron_whip           เอวี๋ยนจื่ออี (home_hufei)
//   ne8           qw_home_hufei_drunken_fist        เหล่าจิ่ว (home_hufei)
//   t2_tigerroar  qw_home_hufei_tiger_roar          ฮูเฝย์ (home_hufei)
//   t1_eagleclaw  qw_home_chengkun_eagle_claw       เฉินโหย่วเลี่ยง (home_chengkun)
//   ne12          qw_home_chengkun_nine_heavens     ลุงอู๋คนสวน (home_chengkun)
//   nd11          qw_home_xuemuhua_opera_sword      หลี่ขุยเหล่ย (home_xuemuhua)
//   nh1           qw_home_xuemuhua_monkey_staff     หลี่ขุยเหล่ย (home_xuemuhua)
//   nf1           qw_home_xuemuhua_killing_qin      คังกว่างหลิง (home_xuemuhua)
import type { DialogScene, NpcDef, QuestDef, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { MeetEventDef } from "../random-events";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const nar = (text: string): SceneLine => ({ t: "narration", text });

// ─── Names (speakers must match NpcDef.name exactly) ────────────────────
const LIU = "ป้าหลิว";
const ZHOU = "ลุงโจว";
const NIU = "อาหนิว";
const HUFEI = "ฮูเฝย์";
const PING = "ผิงอาสี่";
const YUAN = "เอวี๋ยนจื่ออี";
const JIU = "เหล่าจิ่ว";
const CHEN = "เฉินโหย่วเลี่ยง";
const WU = "ลุงอู๋คนสวน";
const CUI = "เสี่ยวชุ่ย";
const XUE = "หมอเซวี่ยมู่หัว";
const KANG = "คังกว่างหลิง";
const LI = "หลี่ขุยเหล่ย";
const DAN = "เสี่ยวตัน";

// ─── NPC ids ────────────────────────────────────────────────────────────
const N = {
  liu: "home_player_housekeeper_liu",
  zhou: "home_player_gatekeeper_zhou",
  niu: "home_player_neighbor_niu",
  hufei: "home_hufei_master_hufei",
  ping: "home_hufei_servant_ping",
  yuan: "home_hufei_guest_yuan",
  jiu: "home_hufei_guest_jiu",
  chen: "home_chengkun_disciple_chen",
  wu: "home_chengkun_gardener_wu",
  cui: "home_chengkun_maid_cui",
  xue: "home_xuemuhua_doctor_xue",
  kang: "home_xuemuhua_guest_kang",
  li: "home_xuemuhua_guest_li",
  dan: "home_xuemuhua_apprentice_dan",
} as const;

const talkId = (npcId: string) => `npc_${npcId}_talk`;

// ═══════════════════════════════════════════════════════════════════════
// NPCs
// ═══════════════════════════════════════════════════════════════════════
const NPCS: NpcDef[] = [
  // ── home_player ──────────────────────────────────────────────────────
  {
    id: N.liu, name: LIU,
    description: "แม่นมชราผู้ดูแลบ้านมาตั้งแต่เจ้ายังเดินไม่คล่อง ปากบ่นแต่มือไม่เคยหยุดตักข้าวให้",
    locationIds: ["home_player"], dialogSceneId: talkId(N.liu),
    tags: ["servant", "elder", "cook"],
    look: { body: "elder" },
    likes: ["moon_cake", "food", "herb", "silk"], dislikes: ["venom"],
  },
  {
    id: N.zhou, name: ZHOU,
    description: "คนเฝ้าประตูขาเป๋ อดีตคนคุ้มกันสินค้าที่พกกระบองสั้นติดเอวไม่เคยห่าง ชอบเล่าเรื่องเก่าซ้ำจนป้าหลิวเบื่อ",
    locationIds: ["home_player"], dialogSceneId: talkId(N.zhou),
    tags: ["guard", "elder", "fighter"],
    look: { body: "m3", wander: true },
    likes: ["cooked_meat", "food", "wood_hard", "gold"], dislikes: ["book"],
  },
  {
    id: N.niu, name: NIU,
    description: "หนุ่มตัดฟืนบ้านติดกัน ตัวโตใจซื่อ ตั้งใจจะเป็นจอมยุทธด้วยการให้คนเอาไม้ทุบหลังทุกเช้า",
    locationIds: ["home_player"], dialogSceneId: talkId(N.niu),
    tags: ["woodcutter", "farmer", "neighbor"],
    look: { body: "m1", wander: true },
    likes: ["raw_meat", "cooked_meat", "food", "iron_ingot"], dislikes: ["book"],
  },

  // ── home_hufei ───────────────────────────────────────────────────────
  {
    id: N.hufei, name: HUFEI,
    description: "จอมดาบจิ้งจอกเหินแห่งตระกูลฮู ใจร้อนแต่ใจจริง เห็นคนถูกรังแกไม่ได้ ยิ่งเป็นคนจนยิ่งทนไม่ได้",
    locationIds: ["home_hufei"], dialogSceneId: talkId(N.hufei),
    sparOpponentId: "spar_home_hufei_hufei", sparFameReward: 8,
    defenseTier: 3,
    tags: ["master", "blademaster", "hero"],
    look: { body: "m4" },
    likes: ["tiger_claw", "cooked_meat", "food", "steel_sword"], dislikes: ["poison_vial", "venom"],
  },
  {
    id: N.ping, name: PING,
    description: "คนรับใช้ชราหน้าบากผู้อุ้มฮูเฝย์หนีตายตั้งแต่ยังแบเบาะ ทุกวันยังเช็ดป้ายวิญญาณนายเก่าไม่เคยขาด",
    locationIds: ["home_hufei"], dialogSceneId: talkId(N.ping),
    tags: ["servant", "elder"],
    look: { body: "elder" },
    likes: ["food", "cooked_meat", "herb", "moon_cake"], dislikes: ["gold"],
  },
  {
    id: N.yuan, name: YUAN,
    description: "หญิงชุดม่วงลึกลับที่แวะมาค้างทีไรของในบ้านหายทุกที แต่ก็คืนให้พร้อมโน้ตกวน ๆ เสมอ",
    locationIds: ["home_hufei"], dialogSceneId: talkId(N.yuan),
    sparOpponentId: "spar_home_hufei_yuan", sparFameReward: 4,
    tags: ["guest", "swordswoman", "wanderer"],
    look: { body: "f2", wander: true },
    likes: ["silk", "silk_fan", "jade_pendant", "craft"], dislikes: ["raw_meat"],
  },
  {
    id: N.jiu, name: JIU,
    description: "ชายแก่ขี้เมาที่ขอค้างคืนเดียวแต่อยู่มาสามเดือน เดินโซเซทั้งวันแต่ไม่เคยล้มสักครั้ง",
    locationIds: ["home_hufei"], dialogSceneId: talkId(N.jiu),
    sparOpponentId: "spar_home_hufei_jiu", sparFameReward: 6,
    tags: ["guest", "drunkard", "fighter"],
    look: { body: "m2", wander: true },
    likes: ["fish_carp", "cooked_meat", "food", "gold"], dislikes: ["potion"],
  },

  // ── home_chengkun ────────────────────────────────────────────────────
  {
    id: N.chen, name: CHEN,
    description: "ศิษย์เอกของเฉิงคุน ยิ้มหวานพูดเพราะ ตาไม่เคยยิ้มตาม คุมบ้านแทนอาจารย์ที่หายไปเป็นปี",
    locationIds: ["home_chengkun"], dialogSceneId: talkId(N.chen),
    sparOpponentId: "spar_home_chengkun_chen", sparFameReward: 4,
    defenseTier: 2,
    stealLoot: [{ itemId: "ancient_coin", weight: 4 }, { itemId: "silver_ring", weight: 2 }, { itemId: "jade", weight: 1 }],
    tags: ["disciple", "schemer", "fighter"],
    look: { body: "m2" },
    likes: ["gold", "jade", "valuable", "gold_ring"], dislikes: ["food"],
  },
  {
    id: N.wu, name: WU,
    description: "คนสวนเงียบขรึมผู้ตัดแต่งต้นสนทุกวันอย่างประณีตเกินคนสวน มือมีด้านของคนจับกระบี่มาครึ่งชีวิต",
    locationIds: ["home_chengkun"], dialogSceneId: talkId(N.wu),
    tags: ["gardener", "servant", "secret"],
    look: { body: "m3", wander: true },
    likes: ["lotus_seed", "herb", "wood_hard", "snow_lotus"], dislikes: ["gold"],
  },
  {
    id: N.cui, name: CUI,
    description: "สาวใช้ช่างพูดที่กลัวบ้านหลังนี้ไปทุกห้อง โดยเฉพาะห้องหนังสือที่ไม่มีใครได้เข้า",
    locationIds: ["home_chengkun"], dialogSceneId: talkId(N.cui),
    tags: ["servant", "maid"],
    look: { body: "f1", wander: true },
    likes: ["silk_fan", "moon_cake", "thread", "food"], dislikes: ["venom", "poison_vial"],
  },

  // ── home_xuemuhua ────────────────────────────────────────────────────
  {
    id: N.xue, name: XUE,
    description: "หมอเทวดาผู้ได้ฉายา ‘ศัตรูยมบาล’ ช่วยคนได้ทุกโรค ยกเว้นโรคขี้บ่นของตัวเอง",
    locationIds: ["home_xuemuhua"], dialogSceneId: talkId(N.xue),
    defenseTier: 2,
    stealLoot: [{ itemId: "herb", weight: 5 }, { itemId: "potion_mid", weight: 3 }, { itemId: "ginseng", weight: 1 }],
    tags: ["healer", "master", "scholar"],
    look: { body: "m4" },
    likes: ["ginseng", "snow_lotus", "herb", "book"], dislikes: ["poison_vial", "venom"],
  },
  {
    id: N.kang, name: KANG,
    description: "พี่ใหญ่แห่งแปดสหายหุบเขาหานกู่ คลั่งพิณจนลืมกินข้าว มาค้างบ้านน้องหมอเพราะหนีเรื่องที่ไม่ยอมเล่า",
    locationIds: ["home_xuemuhua"], dialogSceneId: talkId(N.kang),
    tags: ["musician", "guest", "scholar"],
    look: { body: "elder" },
    likes: ["song_advanced", "song_inter", "silk", "book"], dislikes: ["raw_meat"],
  },
  {
    id: N.li, name: LI,
    description: "น้องเล็กแห่งแปดสหาย นักแสดงงิ้วผู้เล่นบทจนลืมว่าตัวเองชื่ออะไร วันนี้เป็นเห้งเจีย พรุ่งนี้อาจเป็นฮ่องเต้",
    locationIds: ["home_xuemuhua"], dialogSceneId: talkId(N.li),
    sparOpponentId: "spar_home_xuemuhua_li", sparFameReward: 8,
    tags: ["actor", "guest", "fighter"],
    look: { body: "m2", wander: true },
    likes: ["silk_robe", "moon_cake", "silk", "craft"], dislikes: ["rock"],
  },
  {
    id: N.dan, name: DAN,
    description: "เด็กฝึกบดยาของหมอเซวี่ย จำชื่อสมุนไพรได้สามร้อยชนิด แต่จำไม่ได้ว่าวางสากไว้ไหน",
    locationIds: ["home_xuemuhua"], dialogSceneId: talkId(N.dan),
    tags: ["child", "apprentice", "healer"],
    look: { body: "m1", wander: true },
    likes: ["moon_cake", "food", "herb", "lotus_seed"], dislikes: ["venom"],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Opponents (spars and quest foes)
// ═══════════════════════════════════════════════════════════════════════
const OPPONENTS: StoryOpponentSpec[] = [
  { id: "spar_home_hufei_hufei", name: HUFEI, ti: 2, category: "human",
    look: { sheet: "m4", tint: 0x8a5a3a },
    stats: { STR: 9, AGI: 8, VIT: 7, DEX: 6 },
    skillIds: ["ne9", "nm1", "nd7"], artId: "t1_eagleclaw", artLevel: 5 },
  { id: "spar_home_hufei_yuan", name: YUAN, ti: 1, category: "human",
    look: { sheet: "f2", tint: 0x7a4a9a },
    stats: { DEX: 6, AGI: 6 },
    skillIds: ["nd1", "nc8", "nd6"], artId: "t0_butterfly", artLevel: 4 },
  { id: "spar_home_hufei_jiu", name: JIU, ti: 2, category: "human",
    look: { sheet: "m2", tint: 0x9a7a4a },
    stats: { AGI: 9, STR: 7, VIT: 6 },
    skillIds: ["ne8", "nc4", "nd7"] },
  { id: "spar_home_chengkun_chen", name: CHEN, ti: 1, category: "human",
    look: { sheet: "m2", tint: 0x3a4a6a },
    stats: { STR: 6, DEX: 5 },
    skillIds: ["nd10", "nm2", "nc4"], artId: "t1_eagleclaw", artLevel: 3 },
  { id: "spar_home_xuemuhua_li", name: "เห้งเจีย (หลี่ขุยเหล่ย)", ti: 3, category: "human",
    look: { sheet: "m2", tint: 0xc8902a },
    stats: { AGI: 12, INT: 10, POW: 9, DEX: 8 },
    skillIds: ["ne10", "ne3", "nd4", "nd11"], artId: "t2_craneform", artLevel: 6 },
  { id: "qfoe_home_xuemuhua_traitor", name: "ศิษย์ทรยศพิณมาร", ti: 3, category: "human",
    look: { sheet: "m3", tint: 0x4a2a5a },
    stats: { POW: 12, INT: 10, DEX: 8 },
    skillIds: ["zs", "sa", "pn"], artId: "t1_blackiron", artLevel: 6 },
];

// ═══════════════════════════════════════════════════════════════════════
// Quests
// ═══════════════════════════════════════════════════════════════════════
const QUESTS: QuestDef[] = [
  // ── home_player ──────────────────────────────────────────────────────
  {
    id: "qw_home_player_knee_balm",
    type: "side",
    name: "ยาทาเข่าของป้าหลิว",
    description: "ป้าหลิวเข่าปวดทุกครั้งที่ฝนจะตก แต่ไม่ยอมเสียเงินไปหาหมอ เจ้าจึงต้องหาสมุนไพรมาต้มยาให้เอง",
    briefSummary: "หาสมุนไพร 3 หน่วย ต้มยาที่เตาหน้าบ้าน แล้วไปบอกป้าหลิว",
    giverNpcId: N.liu,
    stages: [
      { id: "herbs", description: "หาสมุนไพรหายาก 3 หน่วยมาให้ป้าหลิว",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 3 } },
      { id: "brew", description: "ต้มยาทาเข่าที่เตาหน้าบ้าน",
        objective: { spots: [{ locationId: "home_player", label: "ต้มยาที่เตาหน้าบ้าน",
          text: "ควันสมุนไพรลอยฟุ้งทั่วลาน กลิ่นขมจนไก่บ้านข้างเคียงหนี แต่ยาข้นได้ที่แล้ว" }], hours: 2 } },
      { id: "return", description: "นำยาไปทาเข่าให้ป้าหลิว" },
    ],
    rewards: [
      { t: "gold", amount: 50 },
      { t: "item", itemId: "potion", count: 3 },
      { t: "item", itemId: "rice_dish", count: 1 },
      { t: "trait", trait: "good", amount: 1 },
      { t: "npcRelationship", npcId: N.liu, amount: 10 },
    ],
  },
  {
    id: "qw_home_player_cudgel",
    type: "side",
    name: "กระบองของคนเฝ้าประตู",
    description: "ลุงโจวสัญญาว่าจะสอนวิชากระบองสั้นที่เคยใช้ไล่โจรบนเส้นทางคุ้มกันสินค้า แต่ขอให้ทำงานบ้านที่เขาขี้เกียจทำก่อน",
    briefSummary: "ผ่าฟืนและซ่อมรั้วข้างประตูให้ลุงโจว",
    giverNpcId: N.zhou,
    stages: [
      { id: "chores", description: "ผ่าฟืนกองหลังบ้านและซ่อมรั้วข้างประตูบ้าน",
        objective: { spots: [
          { locationId: "home_player", label: "ผ่าฟืนกองหลังบ้าน",
            text: "ฟืนกองโตกลายเป็นท่อนเรียบร้อย ข้อมือเจ้าชาจนรู้สึกถึงจังหวะการหวดลงน้ำหนัก" },
          { locationId: "home_player", label: "ซ่อมรั้วข้างประตู",
            text: "เจ้าตอกหลักรั้วใหม่จนแน่น ลุงโจวยืนกอดอกพยักหน้าว่า ‘มือหนักดี’" },
        ] } },
      { id: "return", description: "กลับไปหาลุงโจวที่ประตูบ้าน" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nc6" },
      { t: "gold", amount: 60 },
      { t: "npcRelationship", npcId: N.zhou, amount: 10 },
    ],
  },
  {
    id: "qw_home_player_iron_shirt",
    type: "side",
    name: "หลังที่ทุบไม่เจ็บ",
    description: "อาหนิวฝึกเกราะผ้าเหล็กพื้นด้วยการให้คนเอาไม้ทุบหลัง แต่ช่วงนี้มัวแต่ไล่ขโมยที่มาขุดผักในแปลงบ้านเจ้า",
    briefSummary: "ไล่ขโมยน้อย 2 คนที่ชอบมาขโมยผักแถวนครหลวง แล้วกลับไปหาอาหนิว",
    giverNpcId: N.niu,
    stages: [
      { id: "thieves", description: "ปราบขโมยน้อย 2 คนแถวนครหลวง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "petty_thief", count: 2 } },
      { id: "return", description: "กลับไปเล่าให้อาหนิวฟังที่บ้าน" },
    ],
    rewards: [
      { t: "learnArt", artId: "t0_ironshirt", level: 1 },
      { t: "gold", amount: 80 },
      { t: "npcRelationship", npcId: N.niu, amount: 10 },
    ],
  },

  // ── home_hufei ───────────────────────────────────────────────────────
  {
    id: "qw_home_hufei_memorial",
    type: "side",
    name: "ธูปหน้าป้ายวิญญาณ",
    description: "ใกล้วันครบรอบวันตายของฮูอิตเตา บิดาของฮูเฝย์ ผิงอาสี่อยากจัดเครื่องเซ่นให้สมเกียรติ แต่ขาไม่ดีพอจะไปตลาด",
    briefSummary: "หาเนื้อย่าง 2 ชิ้นมาเป็นเครื่องเซ่น จุดธูปหน้าป้ายวิญญาณ แล้วบอกผิงอาสี่",
    giverNpcId: N.ping,
    stages: [
      { id: "offering", description: "หาเนื้อย่าง 2 ชิ้นมาให้ผิงอาสี่เป็นเครื่องเซ่น",
        autoAdvance: { t: "hasItem", itemId: "cooked_meat", count: 2 } },
      { id: "incense", description: "จุดธูปหน้าป้ายวิญญาณฮูอิตเตาในบ้านฮูเฝย์",
        objective: { spots: [{ locationId: "home_hufei", label: "จุดธูปหน้าป้ายวิญญาณ",
          text: "ควันธูปลอยตรงขึ้นไม่ไหวติง ผิงอาสี่กระซิบว่า ‘นายท่านพอใจแล้ว’ ก่อนเช็ดตาด้วยแขนเสื้อ" }] } },
      { id: "return", description: "กลับไปบอกผิงอาสี่ว่าเซ่นไหว้เรียบร้อย" },
    ],
    rewards: [
      { t: "gold", amount: 80 },
      { t: "item", itemId: "potion_mid", count: 1 },
      { t: "npcRelationship", npcId: N.ping, amount: 10 },
      { t: "npcRelationship", npcId: N.hufei, amount: 5 },
    ],
  },
  {
    id: "qw_home_hufei_iron_whip",
    type: "side",
    name: "แส้ม่วงกับระฆังลม",
    description: "เอวี๋ยนจื่ออีท้าว่าถ้าเจ้าสะบัดแส้ให้ระฆังลมดังโดยไม่ให้ขาด และไล่โจรที่ดักปล้นกองคาราวานแถวชายแดนได้ นางจะสอนแส้เหล็กดูดชีพให้",
    briefSummary: "ฝึกแส้ตีระฆังลม ปราบโจรเส้นทาง 3 คน แล้วกลับไปหาเอวี๋ยนจื่ออี",
    giverNpcId: N.yuan,
    prereqs: { t: "statAtLeast", stat: "DEX", min: 10 },
    stages: [
      { id: "bells", description: "สะบัดแส้ตีระฆังลมที่ชายคาบ้านฮูเฝย์",
        objective: { spots: [{ locationId: "home_hufei", label: "สะบัดแส้ตีระฆังลม",
          text: "ครั้งแรกเชือกระฆังขาด ครั้งที่สิบระฆังดังกังวานโดยไม่ไหวติง เอวี๋ยนจื่ออีปรบมือช้า ๆ อย่างกวนประสาท" }], hours: 2 } },
      { id: "bandits", description: "ปราบโจรเส้นทาง 3 คนที่ดักปล้นคาราวาน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 3 } },
      { id: "return", description: "กลับไปหาเอวี๋ยนจื่ออีที่บ้านฮูเฝย์" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nd8" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: N.yuan, amount: 10 },
    ],
  },
  {
    id: "qw_home_hufei_drunken_fist",
    type: "side",
    name: "กับแกล้มของเหล่าจิ่ว",
    description: "เหล่าจิ่วเมาแล้วพูดว่า ‘หมัดเมาต้องเรียนตอนอิ่ม’ เขาอยากได้ปลาย่างแกล้มเหล้า และอยากได้น้ำเต้าเหล้าคืนจากนักเลงที่แย่งไป",
    briefSummary: "หาปลาคาร์ป 2 ตัว ปราบนักเลงฝ่ามือเหล็กที่แย่งน้ำเต้าเหล้า แล้วกลับไปหาเหล่าจิ่ว",
    giverNpcId: N.jiu,
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "AGI", min: 15 },
      { t: "npcRelationship", npcId: N.jiu, min: 5 },
    ] },
    stages: [
      { id: "fish", description: "หาปลาคาร์ป 2 ตัวมาให้เหล่าจิ่ว",
        autoAdvance: { t: "hasItem", itemId: "fish_carp", count: 2 } },
      { id: "gourd", description: "ปราบนักเลงฝ่ามือเหล็กที่แย่งน้ำเต้าเหล้าของเหล่าจิ่วไป",
        autoAdvance: { t: "defeatedOpponent", opponentId: "iron_palm_thug", count: 1 } },
      { id: "return", description: "นำน้ำเต้าเหล้ากลับไปให้เหล่าจิ่ว" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ne8" },
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 120 },
      { t: "npcRelationship", npcId: N.jiu, amount: 10 },
    ],
  },
  {
    id: "qw_home_hufei_tiger_roar",
    type: "side",
    name: "เสียงคำรามของตระกูลฮู",
    description: "ฮูเฝย์บอกว่าลมปราณเสือคำรามไม่ได้เรียนจากตำรา แต่เรียนจากการได้ยินเสือจริงคำรามใส่หน้า แล้วยังยืนอยู่ได้",
    briefSummary: "ปราบเสือภูเขา ประลองกับฮูเฝย์ให้ชนะ แล้วกลับไปคุยกับเขา",
    giverNpcId: N.hufei,
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "STR", min: 15 },
      { t: "npcRelationship", npcId: N.hufei, min: 5 },
    ] },
    stages: [
      { id: "tiger", description: "ปราบเสือภูเขาในป่าเขา",
        autoAdvance: { t: "defeatedOpponent", opponentId: "mountain_tiger", count: 1 } },
      { id: "spar", description: "ประลองกับฮูเฝย์ที่ลานบ้านให้ชนะ",
        objective: { spots: [{ locationId: "home_hufei", npcId: N.hufei, label: "รับคำท้าประลองของฮูเฝย์",
          sceneId: "qd_qw_home_hufei_tiger_roar_spar" }] } },
      { id: "return", description: "คุยกับฮูเฝย์หลังการประลอง" },
    ],
    rewards: [
      { t: "learnArt", artId: "t2_tigerroar", level: 1 },
      { t: "wExp", amount: 200 },
      { t: "trait", trait: "fame", amount: 2 },
      { t: "npcRelationship", npcId: N.hufei, amount: 10 },
    ],
  },

  // ── home_chengkun ────────────────────────────────────────────────────
  {
    id: "qw_home_chengkun_mend_robe",
    type: "side",
    name: "เสื้อคลุมที่ห้ามขาด",
    description: "เสี่ยวชุ่ยทำเสื้อคลุมของเฉิงคุนขาดตอนซัก ถ้าอาจารย์กลับมาเห็นนางคงโดนไล่ หรือแย่กว่านั้น",
    briefSummary: "หาเส้นด้าย 3 ม้วน ให้ศิษย์เฉินตรวจเสื้อ แล้วกลับไปหาเสี่ยวชุ่ย",
    giverNpcId: N.cui,
    stages: [
      { id: "thread", description: "หาเส้นด้าย 3 ม้วนมาให้เสี่ยวชุ่ยปะเสื้อ",
        autoAdvance: { t: "hasItem", itemId: "thread", count: 3 } },
      { id: "inspect", description: "นำเสื้อที่ปะแล้วไปให้เฉินโหย่วเลี่ยงตรวจ",
        objective: { spots: [{ locationId: "home_chengkun", npcId: N.chen, label: "ให้ศิษย์เฉินตรวจเสื้อคลุม",
          text: "เฉินโหย่วเลี่ยงพลิกเสื้อดูนาน ก่อนยิ้ม ‘เรียบร้อยดี อาจารย์ไม่มีวันรู้’ แต่เขาลูบกระเป๋าลับในซับเสื้อก่อนคืน" }] } },
      { id: "return", description: "กลับไปบอกเสี่ยวชุ่ยว่ารอดแล้ว" },
    ],
    rewards: [
      { t: "gold", amount: 90 },
      { t: "item", itemId: "moon_cake", count: 2 },
      { t: "trait", trait: "good", amount: 1 },
      { t: "npcRelationship", npcId: N.cui, amount: 10 },
    ],
  },
  {
    id: "qw_home_chengkun_eagle_claw",
    type: "side",
    name: "จดหมายที่ไม่ควรถึงมือใคร",
    description: "เฉินโหย่วเลี่ยงบอกว่าโจรป่าปล้นคนส่งจดหมายของอาจารย์ เขาขอให้เจ้าจัดการพวกมันอย่างเงียบ ๆ แลกกับลมปราณกรงเล็บอินทรี",
    briefSummary: "ปราบโจรป่า 3 คนที่ปล้นคนส่งจดหมาย แล้วกลับไปหาเฉินโหย่วเลี่ยง",
    giverNpcId: N.chen,
    prereqs: { t: "statAtLeast", stat: "STR", min: 10 },
    stages: [
      { id: "bandits", description: "ปราบโจรป่า 3 คนที่ปล้นคนส่งจดหมายของเฉิงคุน",
        autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 3 } },
      { id: "return", description: "กลับไปรายงานเฉินโหย่วเลี่ยงอย่างเงียบ ๆ" },
    ],
    rewards: [
      { t: "learnArt", artId: "t1_eagleclaw", level: 1 },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: N.chen, amount: 10 },
    ],
  },
  {
    id: "qw_home_chengkun_nine_heavens",
    type: "side",
    name: "คนสวนผู้ไม่ใช่คนสวน",
    description: "ลุงอู๋คนสวนแอบเฝ้าบ้านเฉิงคุนมาหลายปี เขาขอให้เจ้าเข้าไปดูห้องหนังสือที่ไม่มีใครได้เข้า แลกกับกระบี่ที่เขาไม่ได้จับมานาน",
    briefSummary: "แอบค้นห้องหนังสือของเฉิงคุน ปราบมือมีดราตรีที่ตามมา แล้วกลับไปหาลุงอู๋",
    giverNpcId: N.wu,
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 15 },
      { t: "npcRelationship", npcId: N.wu, min: 5 },
    ] },
    stages: [
      { id: "study", description: "แอบค้นห้องหนังสือของเฉิงคุน",
        objective: { spots: [{ locationId: "home_chengkun", label: "แอบเข้าห้องหนังสือ",
          sceneId: "qd_qw_home_chengkun_nine_heavens_study" }] } },
      { id: "assassin", description: "ปราบมือมีดราตรีที่เฉิงคุนจ้างมาตามปิดปาก",
        autoAdvance: { t: "defeatedOpponent", opponentId: "night_blade", count: 1 } },
      { id: "return", description: "กลับไปบอกลุงอู๋สิ่งที่เจ้าพบ" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "ne12" },
      { t: "wExp", amount: 200 },
      { t: "trait", trait: "good", amount: 2 },
      { t: "npcRelationship", npcId: N.wu, amount: 10 },
    ],
  },

  // ── home_xuemuhua ────────────────────────────────────────────────────
  {
    id: "qw_home_xuemuhua_herb_store",
    type: "side",
    name: "ตู้ยาที่ว่างเปล่า",
    description: "คนไข้จากหุบผีเสื้อมาไม่ขาดสาย ตู้ยาของหมอเซวี่ยเหลือแต่ฝุ่น เขาขอสมุนไพรกับโสมไว้ตั้งตำรับใหม่",
    briefSummary: "หาสมุนไพร 4 หน่วยและโสม 1 ราก แล้วกลับไปหาหมอเซวี่ยมู่หัว",
    giverNpcId: N.xue,
    stages: [
      { id: "herbs", description: "หาสมุนไพรหายาก 4 หน่วยให้หมอเซวี่ยมู่หัว",
        autoAdvance: { t: "hasItem", itemId: "herb", count: 4 } },
      { id: "ginseng", description: "หาโสม 1 รากให้หมอเซวี่ยมู่หัว",
        autoAdvance: { t: "hasItem", itemId: "ginseng", count: 1 } },
      { id: "return", description: "นำสมุนไพรกับโสมไปส่งหมอเซวี่ยมู่หัว" },
    ],
    rewards: [
      { t: "gold", amount: 150 },
      { t: "item", itemId: "potion_mid", count: 2 },
      { t: "wExp", amount: 40 },
      { t: "npcRelationship", npcId: N.xue, amount: 10 },
    ],
  },
  {
    id: "qw_home_xuemuhua_lost_score",
    type: "side",
    name: "โน้ตเพลงที่ลมพัดหาย",
    description: "คังกว่างหลิงแต่งเพลงพิณค้างไว้ครึ่งเดียว อีกครึ่งเขาว่า ‘ลมพัดไปแล้ว’ เขาให้เจ้าไปฟังเสียงรอบบ้านแล้วหากระดาษมาจดใหม่",
    briefSummary: "ฟังเสียงไผ่และลำธารรอบบ้านหมอ หากระดาษสา 2 แผ่น แล้วกลับไปหาคังกว่างหลิง",
    giverNpcId: N.kang,
    stages: [
      { id: "listen", description: "ฟังเสียงกอไผ่และเสียงลำธารรอบบ้านหมอเซวี่ย",
        objective: { spots: [
          { locationId: "home_xuemuhua", label: "ฟังเสียงลมผ่านกอไผ่",
            text: "ลมพัดผ่านไผ่เป็นจังหวะสามสั้นหนึ่งยาว เจ้าจำไว้แม้ไม่รู้ว่าจะจำไปทำไม" },
          { locationId: "home_xuemuhua", label: "ฟังเสียงลำธารหลังสวนยา",
            text: "น้ำกระทบหินเป็นเสียงสูงต่ำสลับกัน ฟังนานเข้าก็เหมือนมีคนดีดพิณอยู่ใต้น้ำ" },
        ] } },
      { id: "paper", description: "หากระดาษสา 2 แผ่นมาให้คังกว่างหลิงจดโน้ต",
        autoAdvance: { t: "hasItem", itemId: "paper", count: 2 } },
      { id: "return", description: "เล่าเสียงที่ได้ยินให้คังกว่างหลิงฟัง" },
    ],
    rewards: [
      { t: "gold", amount: 120 },
      { t: "item", itemId: "song_basic", count: 1 },
      { t: "npcRelationship", npcId: N.kang, amount: 10 },
    ],
  },
  {
    id: "qw_home_xuemuhua_killing_qin",
    type: "side",
    name: "เพลงพิณที่ไม่ควรมีใครได้ยิน",
    description: "คังกว่างหลิงเคยแต่งเพลงพิณที่ฆ่าคนได้ แล้วเผาโน้ตทิ้ง แต่มีคนจำมันได้ครึ่งหนึ่ง และคนนั้นกำลังตามหาอีกครึ่ง",
    briefSummary: "ถามหมอเซวี่ยเรื่องบาดแผลประหลาด ซุ่มจับศิษย์ทรยศ หาหยกมาซ่อมหมุดพิณ แล้วกลับไปหาคังกว่างหลิง",
    giverNpcId: N.kang,
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "POW", min: 25 },
      { t: "npcRelationship", npcId: N.kang, min: 15 },
      { t: "questStatus", questId: "qw_home_xuemuhua_lost_score", status: "done" },
    ] },
    stages: [
      { id: "wound", description: "ถามหมอเซวี่ยมู่หัวเรื่องคนไข้ที่หูเลือดออกโดยไม่มีบาดแผล",
        objective: { spots: [{ locationId: "home_xuemuhua", npcId: N.xue, label: "ถามเรื่องคนไข้หูเลือดออก",
          text: "หมอเซวี่ยกระซิบ ‘ไม่ใช่พิษ ไม่ใช่ฝ่ามือ เป็นเสียง… เสียงพิณของพี่ใหญ่ แต่เล่นผิดครึ่งเพลง คนเล่นยังวนเวียนแถวนี้’" }] } },
      { id: "ambush", description: "ซุ่มดักคนเล่นพิณปริศนาที่ลานหลังบ้านหมอเซวี่ย",
        objective: { spots: [{ locationId: "home_xuemuhua", label: "ซุ่มดักคนเล่นพิณยามดึก",
          sceneId: "qd_qw_home_xuemuhua_killing_qin_ambush" }] } },
      { id: "jade", description: "หาหยกล้ำค่า 1 ก้อนมาทำหมุดพิณใหม่ให้คังกว่างหลิง",
        autoAdvance: { t: "hasItem", itemId: "jade", count: 1 } },
      { id: "return", description: "นำหยกกลับไปให้คังกว่างหลิง" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nf1" },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "song_advanced", count: 1 },
      { t: "npcRelationship", npcId: N.kang, amount: 15 },
    ],
  },
  {
    id: "qw_home_xuemuhua_opera_sword",
    type: "side",
    name: "ดาบไม้ของคณะงิ้ว",
    description: "หลี่ขุยเหล่ยจะเล่นงิ้วฉากจอมกระบี่ให้คนไข้ดู แต่ดาบไม้หักหมด เขาสัญญาว่าถ้าช่วย จะสอนกระบี่ลมที่ใช้รำจริงบนเวที",
    briefSummary: "หาไม้เนื้ออ่อน 3 ท่อน ซ้อมรำกระบี่กับหลี่ขุยเหล่ย แล้วรับวิชา",
    giverNpcId: N.li,
    prereqs: { t: "statAtLeast", stat: "AGI", min: 10 },
    stages: [
      { id: "wood", description: "หาไม้เนื้ออ่อน 3 ท่อนมาเหลาเป็นดาบไม้",
        autoAdvance: { t: "hasItem", itemId: "wood_soft", count: 3 } },
      { id: "rehearse", description: "ซ้อมรำกระบี่บนเวทีกับหลี่ขุยเหล่ย",
        objective: { spots: [{ locationId: "home_xuemuhua", npcId: N.li, label: "ซ้อมรำกระบี่กับหลี่ขุยเหล่ย",
          text: "หลี่ขุยเหล่ยหมุนตัวสามรอบแล้วชี้ดาบไม้มาที่จมูกเจ้า ‘ช้าไปครึ่งจังหวะ! อีกที!’ ห้าสิบรอบต่อมา เจ้าก็หมุนตามทันเหมือนลมพัด" }], hours: 2 } },
      { id: "return", description: "คุยกับหลี่ขุยเหล่ยหลังซ้อมเสร็จ" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nd11" },
      { t: "wExp", amount: 100 },
      { t: "gold", amount: 200 },
      { t: "npcRelationship", npcId: N.li, amount: 10 },
    ],
  },
  {
    id: "qw_home_xuemuhua_monkey_staff",
    type: "side",
    name: "เห้งเจียบุกบ้านหมอ",
    description: "หลี่ขุยเหล่ยจะเล่นงิ้วไซอิ๋วฉากใหญ่ และอยากได้ ‘คู่ซ้อมที่ไม่รู้ตัวว่ากำลังซ้อม’ เจ้าไม่รู้หรอกว่านั่นหมายถึงเจ้า",
    briefSummary: "ช่วยจัดฉากงิ้ว เผชิญหน้าเห้งเจียบุกบ้าน หาไม้ศักดิ์สิทธิ์มาทำพลอง แล้วกลับไปหาหลี่ขุยเหล่ย",
    giverNpcId: N.li,
    prereqs: { t: "and", all: [
      { t: "statAtLeast", stat: "INT", min: 25 },
      { t: "npcRelationship", npcId: N.li, min: 15 },
      { t: "questStatus", questId: "qw_home_xuemuhua_opera_sword", status: "done" },
    ] },
    stages: [
      { id: "stage", description: "ช่วยจัดฉากงิ้วไซอิ๋วที่ลานหน้าบ้านหมอเซวี่ย",
        objective: { spots: [{ locationId: "home_xuemuhua", label: "จัดฉากงิ้วไซอิ๋ว",
          text: "เจ้าแขวนผ้าเมฆ ตั้งภูเขากระดาษ และวางบัลลังก์ไม้ให้ ‘เง็กเซียนฮ่องเต้’ เสร็จแล้วหลี่ขุยเหล่ยก็หายตัวไปเฉย ๆ" }], hours: 2 } },
      { id: "monkey", description: "เผชิญหน้าเห้งเจียที่บุกเข้าลานบ้านหมอยามค่ำ",
        objective: { spots: [{ locationId: "home_xuemuhua", label: "ออกไปดูเสียงโครมคราม",
          sceneId: "qd_qw_home_xuemuhua_monkey_staff_monkey" }] } },
      { id: "wood", description: "หาไม้ศักดิ์สิทธิ์ 1 ท่อนมาทำพลองให้หลี่ขุยเหล่ย",
        autoAdvance: { t: "hasItem", itemId: "wood_sacred", count: 1 } },
      { id: "return", description: "นำไม้ศักดิ์สิทธิ์กลับไปให้หลี่ขุยเหล่ย" },
    ],
    rewards: [
      { t: "learnSkill", skillId: "nh1" },
      { t: "wExp", amount: 320 },
      { t: "item", itemId: "silk_robe", count: 1 },
      { t: "npcRelationship", npcId: N.li, amount: 15 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Dialogs
// ═══════════════════════════════════════════════════════════════════════
const leave = (locationId: string) => ({ text: "ลาก่อน", next: locationId });
const ok = (locationId: string, text = "รับทราบ") => ({ text, next: locationId });

/** A talk dialog with a rumor and a hook branch (both terminal dialogs). */
function talk(npcId: string, locationId: string, lines: SceneLine[],
  rumor: { text: string; lines: SceneLine[] }, hook: { text: string; lines: SceneLine[] }): DialogScene[] {
  const id = talkId(npcId);
  return [
    { kind: "dialog", id, lines, choices: [
      { text: rumor.text, next: `${id}_rumor` },
      { text: hook.text, next: `${id}_hook` },
      leave(locationId),
    ] },
    { kind: "dialog", id: `${id}_rumor`, lines: rumor.lines },
    { kind: "dialog", id: `${id}_hook`, lines: hook.lines },
  ];
}

/** Offer (briefing) and complete (hand-in) dialogs of a quest. */
function questScenes(questId: string, locationId: string, offer: SceneLine[], complete: SceneLine[],
  thanks = "รับไว้ด้วยความขอบคุณ"): DialogScene[] {
  return [
    { kind: "dialog", id: `qs_${questId}_offer`, lines: offer, choices: [ok(locationId, "รับปาก")] },
    { kind: "dialog", id: `qs_${questId}_complete`, lines: complete, choices: [
      { text: thanks, effects: [{ t: "finishQuest", questId, success: true }], next: locationId },
    ] },
  ];
}

const SCENES: DialogScene[] = [
  // ══ home_player ══════════════════════════════════════════════════════
  ...talk(N.liu, "home_player", [
    nar("หญิงชราผมขาวกำลังตากผ้าอยู่ใต้ราวไม้ไผ่ เห็นเจ้าก็รีบเช็ดมือกับผ้ากันเปื้อน"),
    say(LIU, "ตื่นแล้วหรือหลานรัก? ข้าวต้มยังอุ่นอยู่ในหม้อ กินก่อนค่อยออกไปเที่ยวเตร่"),
    say(LIU, "บ้านหลังนี้ตอนนี้เหลือแต่เรากับลุงโจวขาเป๋ ข้าก็แก่ลงทุกวัน เข่ามันฟ้องเวลาฝนจะตก"),
    say(LIU, "แต่ป้าไม่ห่วงบ้านหรอก ป้าห่วงเจ้า ออกไปข้างนอกแล้วอย่าลืมทางกลับก็พอ"),
  ], {
    text: "ช่วงนี้นครหลวงมีอะไรใหม่ไหมป้า",
    lines: [
      say(LIU, "แม่ค้าผักในตลาดเล่าว่าหมอหลินที่นครหลวงรับคนช่วยงาน ได้ทั้งเงินทั้งสมุนไพร"),
      say(LIU, "แล้วก็มีสำนักยุทธิ์เปิดให้ลองประลองฟรีกับศิษย์ฝึกหัด… อย่าไปให้เขาทุบจนหน้าบวมกลับมาล่ะ"),
    ],
  }, {
    text: "เข่าป้ายังปวดอยู่หรือ",
    lines: [
      say(LIU, "ปวดสิ ปวดทุกครั้งที่ฟ้าครึ้ม แต่จะให้ไปเสียเงินหาหมอ ป้าไม่ยอมหรอก"),
      say(LIU, "ถ้าเจ้าเจอสมุนไพรดี ๆ สักสามกำ เอามาต้มให้ป้าทาก็พอแล้ว ป้าจะทำข้าวหมูแดงให้เป็นการตอบแทน"),
    ],
  }),
  ...questScenes("qw_home_player_knee_balm", "home_player", [
    say(LIU, "เจ้านี่ใจดีเหมือนนายหญิงไม่มีผิด"),
    say(LIU, "สมุนไพรหายากสามกำนะหลานรัก ไปเก็บตามป่าหรือซื้อที่ตลาดนครหลวงก็ได้"),
    say(LIU, "ได้มาแล้วเอาไปต้มที่เตาหน้าบ้าน ไฟอ่อน ๆ อย่าให้ไหม้ ป้ารู้ว่าเจ้าชอบใจร้อน"),
    nar("ป้าหลิวหันไปตากผ้าต่อ แต่มุมปากยิ้มอยู่"),
  ], [
    nar("เจ้าค่อย ๆ ทายาลงบนเข่าที่บวมแดงของป้าหลิว"),
    say(LIU, "โอ๊ย… ร้อน… แต่ดีขึ้นจริง ๆ ด้วย"),
    say(LIU, "ใครสอนเจ้าต้มยาเก่งขนาดนี้ หรือว่าเจ้าแอบไปเรียนกับหมอหลิน?"),
    say(LIU, "เอ้า เอายาเลือดนี่ไปด้วย กับข้าวหมูแดงห่อนี้ ข้างนอกไม่มีใครทำให้เจ้ากินอร่อยเท่าป้าหรอก"),
  ], "รับห่อข้าวด้วยความซาบซึ้ง"),

  ...talk(N.zhou, "home_player", [
    nar("ชายแก่ขาเป๋นั่งพิงประตู กระบองสั้นวางพาดตัก ตาหรี่เหมือนหลับแต่หูกระดิกทุกครั้งที่มีเสียงฝีเท้า"),
    say(ZHOU, "อ้อ เจ้าเองหรือ นึกว่าโจร"),
    say(ZHOU, "สมัยข้ายังคุ้มกันสินค้า ข้าเคยใช้กระบองท่อนนี้ไล่โจรสิบสองคนบนเขาหวงหลิงคนเดียว"),
    say(ZHOU, "…เมื่อวานข้าบอกว่าแปดคนหรือ? ก็ ข้าแก่แล้ว จำเลขไม่ค่อยได้ แต่จำท่ากระบองได้ทุกท่า"),
  ], {
    text: "เส้นทางไปนครหลวงปลอดภัยไหมลุง",
    lines: [
      say(ZHOU, "ทางลงนครหลวงพอไปได้ แต่ช่วงนี้มีเด็กขโมยแถวนั้นชอบล้วงย่าม"),
      say(ZHOU, "ส่วนทางขึ้นเขาไปหมู่บ้านเชิงเขา ผู้อาวุโสที่นั่นกำลังหาคนหนุ่มช่วยงาน ลองไปดูสิ"),
    ],
  }, {
    text: "สอนกระบองให้ข้าบ้างได้ไหม",
    lines: [
      say(ZHOU, "สอนได้ แต่วิชากระบองต้องเริ่มจากข้อมือ และข้อมือที่ดีมาจากการผ่าฟืน"),
      say(ZHOU, "หลังบ้านมีฟืนกองโต รั้วข้างประตูก็โยกเยก… ข้าไม่ได้ขี้เกียจนะ ข้ากำลังทดสอบเจ้า"),
    ],
  }),
  ...questScenes("qw_home_player_cudgel", "home_player", [
    say(ZHOU, "ดี! ฟืนหลังบ้านกองหนึ่ง รั้วข้างประตูอีกแนวหนึ่ง"),
    say(ZHOU, "ผ่าฟืนให้ลงน้ำหนักที่ปลายขวาน ไม่ใช่ที่ไหล่ ตอกหลักรั้วให้ตรงเหมือนแทงกระบอง"),
    say(ZHOU, "ทำเสร็จแล้วมาหาข้า ข้าจะนั่งตรงนี้… ทดสอบเจ้าต่อไป"),
  ], [
    say(ZHOU, "ฟืนเรียบร้อย รั้วตั้งตรง ข้อมือเจ้าเริ่มรู้จักน้ำหนักแล้ว"),
    nar("ลุงโจวลุกขึ้นอย่างกะเผลก แต่พอกระบองสั้นอยู่ในมือ ขาข้างที่เป๋ก็เหมือนหายไป"),
    say(ZHOU, "ดูให้ดี ตีสั้น ดึงกลับเร็ว อย่าเหวี่ยงให้สุดแขน เพราะศัตรูไม่รอให้เจ้าดึงกลับ"),
    say(ZHOU, "นี่แหละกระบองสั้นที่ไล่โจรสิบสอง… หรือแปด… หรือห้าคน ช่างมันเถอะ เจ้าจำท่าได้ก็พอ"),
  ], "ฝึกตามจนคล่องมือ"),

  ...talk(N.niu, "home_player", [
    nar("หนุ่มร่างใหญ่แบกฟืนเดินผ่านมา หลังเปลือยเต็มไปด้วยรอยช้ำเป็นแถวเหมือนลายเสือ"),
    say(NIU, "เฮ้ย เพื่อนบ้าน! วันนี้มีคนทุบหลังข้าหรือยัง? ยังเลย มาช่วยทุบหน่อยสิ"),
    say(NIU, "ไม่ต้องตกใจ นี่คือการฝึกเกราะผ้าเหล็ก ตำราบอกว่าทุบทุกวัน สามปีจะไม่รู้สึกอะไร"),
    say(NIU, "ข้าฝึกมาสองปีครึ่งแล้ว ตอนนี้ยังรู้สึกอยู่ แต่น้อยลงนิดนึง"),
  ], {
    text: "เห็นใครแปลก ๆ แถวนี้ไหม",
    lines: [
      say(NIU, "มีเด็กขโมยสองคนชอบมาขุดหัวไชเท้าในแปลงผักบ้านเจ้าตอนกลางคืน แล้ววิ่งหนีลงไปทางนครหลวง"),
      say(NIU, "ข้าไล่ไม่ทัน ข้าตัวหนักไป แต่ถ้ามันมาทุบข้า มันจะเจ็บมือเอง ฮ่า ๆ"),
    ],
  }, {
    text: "เกราะผ้าเหล็กนี่สอนข้าได้ไหม",
    lines: [
      say(NIU, "ได้สิ! ข้าเรียนมาจากพ่อ พ่อเรียนจากปู่ ปู่เรียนจากใครไม่รู้ที่ทุบปู่"),
      say(NIU, "แต่ข้าไม่มีเวลาสอนถ้ายังต้องเฝ้าแปลงผักบ้านเจ้าทุกคืน ช่วยไล่เจ้าขโมยสองคนนั้นให้ข้าก่อนสิ"),
    ],
  }),
  ...questScenes("qw_home_player_iron_shirt", "home_player", [
    say(NIU, "เยี่ยม! เจ้าขโมยน้อยสองคนนั้นมักป้วนเปี้ยนแถวทางลงนครหลวง"),
    say(NIU, "จับได้แล้วไม่ต้องทำร้ายมากนะ แค่ให้มันรู้ว่าแปลงผักบ้านนี้มีเจ้าของ"),
    say(NIU, "เสร็จแล้วกลับมา ข้าจะสอนวิธีให้หลังแข็งเหมือนประตูไม้สัก"),
  ], [
    say(NIU, "ไล่ไปแล้วจริงหรือ! ผักบ้านเจ้าปลอดภัย ป้าหลิวคงดีใจจนทำขนมให้"),
    say(NIU, "มา ข้าสอนตามสัญญา หายใจเข้าลึก ๆ เก็บลมไว้ใต้สะดือ แล้วเกร็งตั้งแต่ปลายเท้าถึงต้นคอ"),
    nar("อาหนิวหยิบท่อนฟืนขึ้นมาแล้วฟาดลงที่หลังเจ้าเบา ๆ… แล้วไม่เบาเท่าไหร่"),
    say(NIU, "รู้สึกไหม? ลมปราณมันดันกลับ! นี่แหละเกราะผ้าเหล็กพื้น ทีนี้เจ้าก็มีคนช่วยทุบหลังทุกเช้าแล้ว"),
  ], "รับวิชาพร้อมหลังที่ระบม"),

  // ══ home_hufei ═══════════════════════════════════════════════════════
  ...talk(N.hufei, "home_hufei", [
    nar("ชายหนุ่มหนวดเครารุงรัง ดาบพาดหลัง กำลังผ่าแตงโมด้วยดาบเล่มยาวทีละลูกอย่างแม่นยำ"),
    say(HUFEI, "แขกหรือ? นั่งก่อน กินแตงโมก่อน บ้านข้าจนแต่ไม่เคยไล่แขก"),
    say(HUFEI, "ข้าไม่ชอบพิธีรีตอง ข้าชอบคนตรง ๆ เห็นคนเลวรังแกคนจนก็ฟัน จบ"),
    say(HUFEI, "ผิงอาสี่บ่นว่าข้าใจร้อน ก็จริง แต่ถ้าใจเย็นกว่านี้ คนที่ข้าช่วยไว้คงตายไปหลายคนแล้ว"),
  ], {
    text: "ชายแดนช่วงนี้เป็นอย่างไร",
    lines: [
      say(HUFEI, "โจรเส้นทางดักปล้นคาราวานถี่ขึ้น พวกเศรษฐีในเมืองซีเซี่ยจ้างคุ้มกันได้ ชาวบ้านจ้างไม่ได้"),
      say(HUFEI, "ในป่าเขามีเสือภูเขาตัวหนึ่งกินวัวชาวบ้านไปสามตัวแล้ว ข้ากำลังคิดว่าจะไปคุยกับมัน… ด้วยดาบ"),
    ],
  }, {
    text: "ได้ยินว่าตระกูลฮูมีลมปราณเสือคำราม",
    lines: [
      say(HUFEI, "พ่อข้า ฮูอิตเตา ฝึกมันจนเสียงตะโกนทำให้ม้าศัตรูทรุด ข้าเรียนจากบันทึกที่ผิงอาสี่เก็บไว้"),
      say(HUFEI, "แต่บันทึกไม่ได้สอนทุกอย่าง ต้องเคยยืนต่อหน้าเสือจริง แล้วยังไม่หนี ถ้าเจ้ามีแรงพอ และข้าเชื่อใจเจ้าพอ ข้าจะสอน"),
    ],
  }),
  ...questScenes("qw_home_hufei_tiger_roar", "home_hufei", [
    say(HUFEI, "ฟังให้ดี เสือคำรามไม่ใช่เสียงที่ออกจากคอ มันออกจากท้อง จากความกล้าที่ไม่ถอย"),
    say(HUFEI, "ไปหาเสือภูเขาในป่าเขา ล้มมันให้ได้ ฟังมันคำรามใส่หน้าเจ้าให้เต็มหู"),
    say(HUFEI, "แล้วกลับมาประลองกับข้า ถ้ายังยืนต่อหน้าดาบข้าได้โดยไม่สั่น เจ้าก็พร้อมแล้ว"),
  ], [
    say(HUFEI, "ฮ่า! ขาเจ้าไม่สั่นแม้แต่นิดเดียว"),
    nar("ฮูเฝย์ยืนตรง หายใจเข้าจนอกขยาย แล้วตะโกนออกมา เสียงนั้นทำให้ใบไม้ทั้งลานปลิวและผิงอาสี่ทำถ้วยชาตก"),
    say(HUFEI, "นี่แหละเสือคำราม ดึงลมปราณจากท้อง ผ่านกระดูกสันหลัง ระเบิดออกทางเสียงและหมัด"),
    say(HUFEI, "ใช้มันปกป้องคนที่สู้ไม่ได้ ไม่ใช่ใช้ข่มคนที่อ่อนกว่า สัญญากับพ่อข้าตรงป้ายวิญญาณนั่น"),
  ], "สัญญาต่อหน้าป้ายวิญญาณ"),
  {
    kind: "dialog", id: "qd_qw_home_hufei_tiger_roar_spar",
    lines: [
      nar("ฮูเฝย์วางแตงโมลง ชักดาบเล่มยาวออกจากหลังช้า ๆ"),
      say(HUFEI, "เสือภูเขาล้มแล้วหรือ? ดี ทีนี้ถึงตาข้า"),
      say(HUFEI, "ข้าจะไม่ออมมือ เพราะศัตรูจริงไม่เคยออมมือ แต่ข้าจะไม่ฆ่าเจ้า… เว้นแต่เจ้าวิ่งหนี"),
    ],
    choices: [
      { text: "ตั้งท่ารับดาบ",
        effects: [{ t: "triggerBattle", opponentId: "spar_home_hufei_hufei", nonFatal: true,
          onWin: "qd_qw_home_hufei_tiger_roar_won", onLose: "qd_qw_home_hufei_tiger_roar_lost" }],
        next: "home_hufei" },
      { text: "ขอเตรียมตัวก่อน", next: "home_hufei" },
    ],
  },
  {
    kind: "dialog", id: "qd_qw_home_hufei_tiger_roar_won",
    lines: [
      nar("ดาบของฮูเฝย์หยุดห่างคอเจ้าไม่ถึงนิ้ว แต่หมัดของเจ้าก็หยุดตรงหน้าอกเขาพอดี"),
      say(HUFEI, "เสมอ? ไม่ เจ้าชนะ เพราะเจ้าไม่หลับตา"),
    ],
    choices: [{ text: "ก้าวต่อไป", effects: [{ t: "advanceQuest", questId: "qw_home_hufei_tiger_roar" }], next: "home_hufei" }],
  },
  {
    kind: "dialog", id: "qd_qw_home_hufei_tiger_roar_lost",
    lines: [
      say(HUFEI, "ยังไม่พอ ไปกินข้าว นอนให้เต็มอิ่ม แล้วกลับมาใหม่"),
      say(PING, "นายน้อยพูดแบบนี้กับทุกคน แต่ไม่เคยพูดกับคนที่เขาไม่เห็นแววหรอก"),
    ],
  },

  ...talk(N.ping, "home_hufei", [
    nar("ชายชราใบหน้าเต็มไปด้วยรอยแผลไฟไหม้ กำลังเช็ดป้ายวิญญาณไม้ด้วยผ้าขาวอย่างทะนุถนอม"),
    say(PING, "แขกของนายน้อยหรือ เชิญ ๆ ข้าจะต้มชาให้"),
    say(PING, "ข้าอุ้มนายน้อยหนีออกมาตั้งแต่ยังแบเบาะ คืนนั้นไฟไหม้ทั้งโรงเตี๊ยม ข้าเหลือแต่ใบหน้านี้กับเด็กคนหนึ่ง"),
    say(PING, "ทุกวันนี้ข้าไม่มีอะไรต้องการ นอกจากเห็นนายน้อยมีกินมีใช้ และไม่ตายเร็วกว่าข้า"),
  ], {
    text: "บ้านนี้มีแขกเยอะจัง",
    lines: [
      say(PING, "นายน้อยใจกว้าง ใครมาก็รับ แม่นางชุดม่วงมาแล้วก็หายไปพร้อมของในบ้าน แล้วก็เอามาคืน"),
      say(PING, "ส่วนตาแก่ขี้เมานั่น บอกว่าจะค้างคืนเดียว อยู่มาสามเดือนแล้ว แต่ข้าเห็นเขาซ้อมหมัดตอนตีสามทุกคืน"),
    ],
  }, {
    text: "มีอะไรให้ข้าช่วยไหม",
    lines: [
      say(PING, "อีกไม่กี่วันก็ครบรอบวันตายของนายท่านฮูอิตเตา ข้าอยากจัดเครื่องเซ่นให้ดีหน่อย"),
      say(PING, "แต่ขาข้าไปตลาดไม่ไหวแล้ว ถ้าเจ้าหาเนื้อย่างมาได้สักสองชิ้น ข้าจะขอบคุณจนวันตาย"),
    ],
  }),
  ...questScenes("qw_home_hufei_memorial", "home_hufei", [
    say(PING, "ขอบคุณ ขอบคุณจริง ๆ"),
    say(PING, "เนื้อย่างสองชิ้น นายท่านชอบกินเนื้อกับเหล้าแรง ๆ เหล้าข้ามีแล้ว ขาดแต่กับแกล้ม"),
    say(PING, "ได้มาแล้วช่วยจุดธูปหน้าป้ายวิญญาณแทนข้าด้วย มือข้าสั่นจนจุดไม่ติดแล้ว"),
  ], [
    say(PING, "นายท่านคงยิ้มอยู่บนนั้น"),
    nar("ผิงอาสี่ก้มกราบป้ายวิญญาณสามครั้ง แล้วหันมากราบเจ้าอีกครั้ง เจ้ารีบประคองเขาขึ้น"),
    say(PING, "เจ้าเป็นคนดี นายน้อยชอบคนดี ข้าจะบอกนายน้อยให้ ไม่ต้องห่วง"),
    say(PING, "เอายานี่ไปด้วย ข้าเก็บไว้นานแล้วไม่มีใครใช้ นายน้อยไม่เคยยอมกินยา"),
  ]),

  ...talk(N.yuan, "home_hufei", [
    nar("หญิงสาวชุดม่วงนั่งไขว่ห้างบนรั้ว แกว่งแส้เส้นเล็กเล่นเหมือนแมวแกว่งหาง"),
    say(YUAN, "อ้าว มีแขกใหม่ ฮูเฝย์ไม่ได้บอกข้าเลย… หรือบอกแล้วแต่ข้าไม่ได้ฟัง"),
    say(YUAN, "ข้าชื่ออะไรไม่สำคัญ วันนี้ข้าชื่อเอวี๋ยนจื่ออี พรุ่งนี้อาจชื่ออื่น"),
    say(YUAN, "ระวังย่ามด้วยนะ ข้าไม่ได้ขโมย ข้าแค่ยืมไปดูแล้วคืน ถามฮูเฝย์ดูสิ"),
  ], {
    text: "เจ้ามาที่นี่ทำไม",
    lines: [
      say(YUAN, "มาทวงหนี้ ฮูเฝย์ติดข้าอยู่หนึ่งคำขอบคุณ ข้าจะอยู่จนกว่าเขาจะพูด"),
      say(YUAN, "ระหว่างรอ ข้าก็ไล่โจรเส้นทางเล่น ๆ แถวชายแดน พวกมันดักปล้นคาราวานเกลือ ชาวบ้านไม่มีเกลือกินมาเดือนหนึ่งแล้ว"),
    ],
  }, {
    text: "แส้ของเจ้าดูไม่ธรรมดา",
    lines: [
      say(YUAN, "ตาดี แส้เหล็กเส้นนี้ตีแล้วดูดเลือดลมของศัตรูกลับมาเป็นแรงเรา"),
      say(YUAN, "อยากเรียน? มือต้องไวและแม่นพอจะตีระฆังลมโดยไม่ทำเชือกขาด แล้วต้องกล้าพอจะไล่โจรสามคน"),
    ],
  }),
  ...questScenes("qw_home_hufei_iron_whip", "home_hufei", [
    say(YUAN, "ตกลง! ข้าชอบคนที่ไม่ถามมาก"),
    say(YUAN, "ระฆังลมแขวนอยู่ที่ชายคา ตีให้ดังโดยไม่ให้มันหลุด ถ้าหลุดเจ้าจ่ายค่าระฆังให้ผิงอาสี่"),
    say(YUAN, "จากนั้นไปไล่โจรเส้นทางสามคน พวกมันชอบซุ่มแถวทางเข้าเมืองซีเซี่ย"),
  ], [
    say(YUAN, "สามคน? ข้าไล่ได้ห้า แต่สำหรับมือใหม่ก็ถือว่าใช้ได้"),
    nar("นางสะบัดแส้ทีเดียว ใบไม้สามใบขาดกลางอากาศ แล้วปลายแส้ก็ม้วนกลับมาอยู่ในมือ"),
    say(YUAN, "จำไว้ ตีครั้งแรกให้เจ็บ ตีครั้งที่สองให้ดูด อย่าโลภตีครั้งที่สาม เพราะแขนเจ้าจะพันกันเอง"),
    say(YUAN, "อ้อ ย่ามเจ้าข้าคืนให้แล้วนะ ข้างในมีเงินเท่าเดิม… เกือบเท่าเดิม"),
  ], "ตรวจย่ามแล้วรับวิชา"),

  ...talk(N.jiu, "home_hufei", [
    nar("ชายแก่ผมยุ่งเดินโซเซผ่านลาน มือหนึ่งถือถ้วยเหล้าเปล่า อีกมือคว้าอากาศเหมือนหาน้ำเต้า"),
    say(JIU, "ฮึก… เจ้า… เจ้าเห็นน้ำเต้าเหล้าข้าไหม? สีเหลือง ๆ กลม ๆ มีเหล้าอยู่ข้างใน… เคยมี"),
    say(JIU, "ข้าไม่ได้เมานะ ข้าแค่เดินแบบนี้มาตั้งแต่เกิด"),
    nar("เขาเซจะล้มใส่เจ้า แต่พอเจ้ายื่นมือไปรับ เขาก็หมุนตัวกลับไปยืนตรงได้ราวกับไม่เคยเซ"),
  ], {
    text: "น้ำเต้าเหล้าหายไปไหน",
    lines: [
      say(JIU, "นักเลงฝ่ามือเหล็กคนหนึ่งแย่งไปตอนข้ากำลังหลับ… ฮึก… ตอนข้ากำลังทำสมาธิ"),
      say(JIU, "ข้าจะไปเอาคืนก็ได้ แต่ท้องว่าง หมัดเมาต้องเรียนตอนอิ่ม ต้องสู้ตอนอิ่มด้วย"),
    ],
  }, {
    text: "ท่าเดินของลุงเมื่อกี้คือวิชาอะไร",
    lines: [
      say(JIU, "วิชาอะไร? ข้าเมา! …ก็ได้ ๆ มันคือหมัดเมา เซให้ศัตรูหลงทาง แล้วต่อยตอนมันงง"),
      say(JIU, "คนเรียนต้องขาไวมาก ๆ และข้าต้องชอบหน้าเจ้าพอ หาของแกล้มอร่อย ๆ มาให้ข้าบ้างสิ ข้าจะได้ชอบเจ้า"),
    ],
  }),
  ...questScenes("qw_home_hufei_drunken_fist", "home_hufei", [
    say(JIU, "ฮ่า ฮ่า! มีคนจะเลี้ยงข้า!"),
    say(JIU, "ปลาคาร์ปสองตัว ย่างให้หนังกรอบ ๆ ข้าจะให้ผิงอาสี่ย่างเอง เขาบ่นแต่ทำอร่อย"),
    say(JIU, "แล้วไปเอาน้ำเต้าข้าคืนจากนักเลงฝ่ามือเหล็ก มันจะหลอกเจ้าว่าน้ำเต้าเป็นของมัน อย่าเชื่อ ของข้ามีรอยกัด"),
  ], [
    say(JIU, "น้ำเต้าข้า! รอยกัดยังอยู่! เหล้าหายไปครึ่งหนึ่ง… ช่างมัน"),
    nar("เหล่าจิ่วยกน้ำเต้าขึ้นดื่ม แล้วเริ่มเดินเซไปรอบลาน หมัดของเขาโผล่มาจากมุมที่ไม่น่าจะมีหมัด"),
    say(JIU, "ดูขาข้า ไม่ใช่ดูหมัด! เซไปซ้ายให้มันตามซ้าย ล้มไปข้างหน้าให้มันถอย แล้วต่อยตอนมันคิดว่าเจ้าจะล้ม"),
    say(JIU, "เจ้าเมาไม่เป็นก็ไม่เป็นไร แค่ทำให้ศัตรูคิดว่าเจ้าเมาก็พอ ฮึก… อันนี้ข้าเมาจริง"),
  ], "ประคองเหล่าจิ่วแล้วรับวิชา"),

  // ══ home_chengkun ════════════════════════════════════════════════════
  ...talk(N.chen, "home_chengkun", [
    nar("ชายหนุ่มแต่งกายเรียบร้อยยืนรอที่ประตู ยิ้มกว้างเหมือนรู้ว่าเจ้าจะมา"),
    say(CHEN, "ยินดีต้อนรับสู่บ้านอาจารย์เฉิงคุน ข้าน้อยเฉินโหย่วเลี่ยง ศิษย์ผู้ดูแลบ้านแทนท่าน"),
    say(CHEN, "อาจารย์ออกเดินทางไปทำธุระสำคัญ ธุระอะไร… ข้าน้อยไม่กล้าถาม ศิษย์ดีไม่ควรถามมาก"),
    say(CHEN, "แต่ถ้าท่านมีธุระที่ข้าน้อยช่วยได้ ข้าน้อยยินดีเสมอ ข้าน้อยชอบคนมีฝีมือ คนมีฝีมือมีประโยชน์"),
  ], {
    text: "ได้ยินว่าแถวนี้ใกล้พรรคเม้งก่า",
    lines: [
      say(CHEN, "ใกล้มาก ใกล้จนอาจารย์บอกว่าได้ยินเสียงพวกมันสวดไฟทุกคืน"),
      say(CHEN, "อาจารย์ไม่ชอบพรรคนั้นเลย… ไม่ชอบมาก ๆ ไม่ชอบมาหลายสิบปี ท่านอย่าไปถามอาจารย์เรื่องนี้นะ"),
    ],
  }, {
    text: "มีงานอะไรให้ทำไหม",
    lines: [
      say(CHEN, "มีเรื่องเล็ก ๆ คนส่งจดหมายของอาจารย์ถูกโจรป่าปล้น จดหมายหายไปหลายฉบับ"),
      say(CHEN, "ข้าน้อยอยากให้คนแข็งแรงไปจัดการพวกมัน เงียบ ๆ ไม่ต้องให้ใครรู้ ข้าน้อยตอบแทนด้วยลมปราณกรงเล็บอินทรีได้"),
    ],
  }),
  ...questScenes("qw_home_chengkun_eagle_claw", "home_chengkun", [
    say(CHEN, "ข้าน้อยรู้ว่าเลือกคนไม่ผิด"),
    say(CHEN, "โจรป่าสามคน พวกมันซุ่มตามทางขึ้นยอดเขากวงหมิงกับทางเข้าเมือง จัดการให้หมด"),
    say(CHEN, "ถ้าเจอจดหมาย… ไม่ต้องเปิดอ่านนะขอรับ เผาทิ้งได้เลย อาจารย์คงไม่อยากให้มันตกถึงมือใคร"),
  ], [
    say(CHEN, "สามคน เรียบร้อย ไม่มีใครเห็น ดีมาก"),
    nar("เฉินโหย่วเลี่ยงยกมือขึ้น นิ้วทั้งห้างอเหมือนกรงเล็บนก แล้วจิกลงบนเสาไม้จนเป็นรูห้ารู"),
    say(CHEN, "ลมปราณกรงเล็บอินทรี ส่งพลังไปที่ปลายนิ้ว จับแล้วอย่าปล่อย เหมือนอินทรีจับเหยื่อ"),
    say(CHEN, "อาจารย์สอนข้าน้อยว่า ‘จับแล้วอย่าปล่อย’ ใช้ได้กับทุกเรื่อง ไม่ใช่แค่วิชา… เจ้าจะเข้าใจเองสักวัน"),
  ], "รับวิชาแล้วรีบลา"),

  ...talk(N.wu, "home_chengkun", [
    nar("ชายชราผมดอกเลากำลังเล็มกิ่งสนด้วยกรรไกร ทุกครั้งที่ตัดเสียงดังเพียงครั้งเดียว ไม่เคยต้องตัดซ้ำ"),
    say(WU, "…"),
    say(WU, "คนแปลกหน้าไม่ควรเดินเพ่นพ่านในบ้านนี้"),
    say(WU, "ต้นสนต้นนี้ข้าปลูกเอง สิบปีแล้ว นานพอจะเห็นว่าใครเข้าออกบ้านนี้บ้าง"),
  ], {
    text: "ลุงอยู่บ้านนี้มานานแล้วหรือ",
    lines: [
      say(WU, "นานพอจะรู้ว่าเฉิงคุนไม่เคยไปไหนนาน ๆ โดยไม่มีคนตายตามมา"),
      say(WU, "เจ้าไม่ได้ยินข้าพูดอะไรทั้งนั้น ข้าเป็นแค่คนสวน"),
    ],
  }, {
    text: "มือลุงไม่เหมือนมือคนสวน",
    lines: [
      nar("ลุงอู๋หยุดกรรไกร แล้วมองเจ้าเป็นครั้งแรก"),
      say(WU, "ตาดี ถ้าเจ้ามีลมปราณภายในพอ และข้าไว้ใจเจ้าพอ วันหนึ่งข้าอาจขอให้เจ้าช่วยดูห้องหนังสือที่ไม่มีใครได้เข้า"),
      say(WU, "แลกกับกระบี่เก้าฟ้า ที่มือคนสวนคู่นี้ไม่ได้จับมาสิบปี"),
    ],
  }),
  ...questScenes("qw_home_chengkun_nine_heavens", "home_chengkun", [
    say(WU, "ข้าไม่ใช่คนสวน ข้าเป็นคนของพรรคเม้งก่า ถูกส่งมาเฝ้าเฉิงคุนเพราะเขาเกลียดพรรคเรามาตั้งแต่ก่อนเจ้าเกิด"),
    say(WU, "สิบปีข้าไม่เคยเข้าห้องหนังสือได้ เฉินโหย่วเลี่ยงเฝ้ามันเหมือนสุนัข แต่เขาไม่สนใจแขก"),
    say(WU, "เข้าไปดูว่าข้างในมีอะไร แล้วระวังตัว ถ้าเฉิงคุนรู้ เขาจะส่งคนมาปิดปากเจ้า"),
  ], [
    say(WU, "จดหมายถึงสำนักใหญ่หกสำนัก… รายชื่อคนในพรรคเรา… เขาจะยุให้ทั้งยุทธภพบุกยอดเขากวงหมิง"),
    nar("ลุงอู๋วางกรรไกรลง แล้วหยิบกิ่งสนกิ่งหนึ่งขึ้นมาแทน กิ่งไม้ในมือเขาส่งเสียงหวีดเหมือนกระบี่"),
    say(WU, "กระบี่เก้าฟ้า ส่งลมปราณจากใจขึ้นฟ้าเก้าชั้น แต่ละท่าซ้อนพลังของท่าก่อนหน้า ยิ่งสู้ยิ่งคม"),
    say(WU, "ข้าจะส่งข่าวไปที่พรรค ส่วนเจ้า เก็บกระบี่นี้ไว้ใช้กับคนอย่างเฉิงคุน ไม่ใช่กับคนบริสุทธิ์"),
  ], "รับวิชาและเก็บความลับ"),
  {
    kind: "dialog", id: "qd_qw_home_chengkun_nine_heavens_study",
    lines: [
      nar("เจ้ารอจนเฉินโหย่วเลี่ยงไปตรวจประตูหน้า แล้วแง้มประตูห้องหนังสือเข้าไป"),
      nar("ในห้องมีแต่ตำราพระธรรม แต่ใต้แท่นวางพระมีกล่องไม้ ในกล่องเต็มไปด้วยจดหมายประทับตราหกสำนักใหญ่"),
      nar("ฉบับบนสุดเขียนว่า ‘เมื่อเม้งก่าแตกแยก ทุกสำนักจะขึ้นยอดเขากวงหมิงพร้อมกัน’ ลงนามด้วยชื่อที่ไม่ใช่เฉิงคุน: ‘หยวนเจิน’"),
      nar("เสียงฝีเท้าดังมาจากระเบียง เงาดำผ่านหน้าต่างไปอย่างรวดเร็ว มีคนเห็นเจ้าแล้ว"),
    ],
    choices: [
      { text: "จดจำเนื้อความแล้วรีบออกมา",
        effects: [{ t: "advanceQuest", questId: "qw_home_chengkun_nine_heavens" }], next: "home_chengkun" },
      { text: "ยังไม่ใช่เวลา ถอยออกมาก่อน", next: "home_chengkun" },
    ],
  },

  ...talk(N.cui, "home_chengkun", [
    nar("สาวใช้ตัวเล็กหอบผ้ากองโตเดินผ่าน พอเห็นเจ้าก็สะดุ้งจนผ้าเกือบหล่น"),
    say(CUI, "ว้าย! นึกว่าศิษย์พี่เฉิน… เอ๊ย ขอโทษเจ้าค่ะ ท่านเป็นแขกหรือเจ้าคะ"),
    say(CUI, "บ้านนี้เงียบมาก เงียบจนน่ากลัว นายท่านไม่อยู่ ศิษย์พี่เฉินก็ยิ้มทั้งวัน ลุงอู๋ก็ไม่พูด"),
    say(CUI, "ข้ามาทำงานที่นี่เพราะค่าจ้างดี แต่ทุกคืนข้าได้ยินเสียงคนเดินในห้องหนังสือ ทั้งที่ไม่มีใครอยู่"),
  ], {
    text: "นายท่านเฉิงคุนเป็นคนอย่างไร",
    lines: [
      say(CUI, "ใจดีมากเจ้าค่ะ พูดเสียงนุ่ม ให้รางวัลบ่อย… แต่คนรับใช้คนก่อนข้าหายไปหลังทำถ้วยชาของนายท่านแตก"),
      say(CUI, "ศิษย์พี่เฉินบอกว่าเขากลับบ้านเกิด แต่ข้าไม่รู้ว่าบ้านเกิดเขาอยู่ไหน ไม่มีใครรู้"),
    ],
  }, {
    text: "เจ้าดูมีเรื่องกลุ้มใจ",
    lines: [
      say(CUI, "ข้าซักเสื้อคลุมของนายท่านจนขาดเจ้าค่ะ! ถ้านายท่านกลับมาเห็น ข้าคง… กลับบ้านเกิดเหมือนคนก่อน"),
      say(CUI, "ถ้ามีเส้นด้ายดี ๆ ข้าปะได้เนียนจนมองไม่เห็นเลยเจ้าค่ะ แต่ข้าออกไปซื้อไม่ได้ ศิษย์พี่เฉินไม่ให้ออก"),
    ],
  }),
  ...questScenes("qw_home_chengkun_mend_robe", "home_chengkun", [
    say(CUI, "จริงหรือเจ้าคะ! ท่านเป็นคนดีที่สุดที่เคยมาบ้านนี้"),
    say(CUI, "เส้นด้ายสามม้วนเจ้าค่ะ สีอะไรก็ได้ ข้าย้อมเองได้"),
    say(CUI, "ปะเสร็จแล้วต้องให้ศิษย์พี่เฉินตรวจก่อนเก็บเข้าตู้ ข้าไม่กล้าเอาไปให้เขาเอง ท่านช่วยเอาไปให้ได้ไหมเจ้าคะ"),
  ], [
    say(CUI, "ศิษย์พี่เฉินว่าเรียบร้อยใช่ไหมเจ้าคะ! ข้ารอดแล้ว!"),
    say(CUI, "ข้าทำขนมไหว้พระจันทร์ไว้ให้ท่าน… เอ่อ จริง ๆ ทำไว้ให้นายท่าน แต่นายท่านไม่อยู่ ท่านกินแทนนะเจ้าคะ"),
    say(CUI, "แล้วก็… ตอนปะเสื้อ ข้าเจอกระเป๋าลับในซับใน มีกระดาษเขียนว่า ‘หยวนเจิน’ ท่านว่าใครหรือเจ้าคะ?"),
    nar("เจ้าไม่ตอบ เสี่ยวชุ่ยก็ไม่ถามต่อ บางเรื่องในบ้านนี้ไม่รู้ดีกว่า"),
  ], "รับขนมแล้วลา"),

  // ══ home_xuemuhua ════════════════════════════════════════════════════
  ...talk(N.xue, "home_xuemuhua", [
    nar("ชายวัยกลางคนในชุดหมอนั่งจับชีพจรคนไข้ อีกมือจดตำรับยาโดยไม่ต้องมอง"),
    say(XUE, "ป่วยตรงไหน? ไม่ป่วย? งั้นอย่ายืนบังแสง"),
    say(XUE, "คนเรียกข้าว่าศัตรูยมบาล เพราะยมบาลส่งใครมาข้าก็ส่งกลับ ยมบาลเลยไม่ชอบหน้าข้า"),
    say(XUE, "บ้านข้าตอนนี้แน่นกว่าโรงเตี๊ยม พี่ใหญ่คังมาดีดพิณ น้องเล็กหลี่มาเล่นงิ้ว คนไข้ก็มาไม่หยุด ยาก็หมดตู้"),
  ], {
    text: "หุบผีเสื้อแถวนี้มีอะไรน่าสนใจ",
    lines: [
      say(XUE, "หุบผีเสื้อมีหมอเทวดาอีกคน รักษาเฉพาะคนพรรคมาร ข้ารักษาทุกคนยกเว้นคนที่ข้ารำคาญ ต่างกันนิดเดียว"),
      say(XUE, "ทางสวนสมุนไพรใหญ่ก็มีหุบยาเทพ ถ้าเจ้าจะไปเก็บสมุนไพร ระวังงูด้วย ข้าไม่อยากเสียยาแก้พิษกับคนประมาท"),
    ],
  }, {
    text: "ให้ข้าช่วยหายาได้ไหม",
    lines: [
      say(XUE, "ช่วยได้สิ ข้าต้องการสมุนไพรหายากสี่หน่วยกับโสมอีกหนึ่งราก"),
      say(XUE, "ข้าจ่ายเป็นเงินและยาเลือดที่ข้าปรุงเอง ดีกว่าที่ขายในตลาดสามเท่า… ข้าไม่ได้คุย ข้าพูดความจริง"),
    ],
  }),
  ...questScenes("qw_home_xuemuhua_herb_store", "home_xuemuhua", [
    say(XUE, "ดี มีคนมีประโยชน์เข้าบ้านสักที"),
    say(XUE, "สมุนไพรหายากสี่หน่วย เลือกที่รากไม่ช้ำ แล้วโสมอีกหนึ่งราก โสมป่าดีกว่าโสมปลูก แต่ตอนนี้ข้าไม่เลือก"),
    say(XUE, "ได้ครบแล้วเอามาให้ข้า อย่าเอาไปให้เสี่ยวตัน เขาจะวางไว้ที่ไหนสักที่แล้วลืม"),
  ], [
    say(XUE, "รากสวย ไม่ช้ำ โสมก็ใช้ได้"),
    nar("หมอเซวี่ยบดสมุนไพรลงครกด้วยความเร็วที่ตามไม่ทัน แล้วปั้นเป็นเม็ดยาสีแดงสองเม็ดยื่นให้เจ้า"),
    say(XUE, "ยาเลือดตำรับข้า กินตอนเลือดใกล้หมด อย่ากินเล่น"),
    say(XUE, "เจ้าช่วยข้าแล้ว วันหน้าถ้าเจ้าเกือบตาย มาหาข้า ข้าจะส่งเจ้ากลับจากยมบาลให้ฟรีหนึ่งครั้ง"),
  ]),

  ...talk(N.kang, "home_xuemuhua", [
    nar("ชายชราเคราขาวนั่งใต้ต้นไผ่ กอดพิณโบราณไว้แน่นเหมือนกอดลูก ดีดเสียงเดียวซ้ำไปซ้ำมา"),
    say(KANG, "ชู่ว! ฟังสิ… เสียงนี้… ไม่ใช่ ผิดอีกแล้ว"),
    say(KANG, "ข้าคังกว่างหลิง พี่ใหญ่แห่งแปดสหายหุบเขาหานกู่ น้องหมอเซวี่ยเป็นน้องห้า น้องหลี่เป็นน้องแปด"),
    say(KANG, "พวกเราแต่ละคนหลงใหลศิลปะคนละแขนงจนอาจารย์ไล่ออกจากสำนัก ข้าหลงพิณ หลงจนบางทีลืมว่าพิณก็ฆ่าคนได้"),
  ], {
    text: "ทำไมอาจารย์ถึงไล่ออก",
    lines: [
      say(KANG, "อาจารย์ไม่ได้โกรธพวกเรา ท่านกลัวศัตรูเก่าจะตามมาทำร้ายพวกเราต่างหาก เลยแกล้งไล่ แกล้งเป็นใบ้ แกล้งตาย"),
      say(KANG, "ศัตรูนั้นชื่อ… ไม่ ข้าไม่พูดชื่อมัน พูดแล้วเสียงพิณข้าจะเพี้ยนไปสามวัน"),
    ],
  }, {
    text: "เพลงที่ท่านดีดอยู่ขาดอะไร",
    lines: [
      say(KANG, "ขาดครึ่งหลัง ข้าแต่งครึ่งแรกเสร็จเมื่อคืน ครึ่งหลังลมพัดหายไปพร้อมกระดาษ"),
      say(KANG, "เสียงจริงอยู่รอบบ้านนี้แหละ ไผ่ ลำธาร… หูข้าแก่แล้ว ถ้ามีหูหนุ่ม ๆ ไปฟังแทน แล้วหากระดาษมาให้ข้าจดสักสองแผ่น…"),
    ],
  }),
  ...questScenes("qw_home_xuemuhua_lost_score", "home_xuemuhua", [
    say(KANG, "ดี ดีมาก! หูหนุ่ม ๆ!"),
    say(KANG, "ไปฟังเสียงลมผ่านกอไผ่ แล้วไปฟังลำธารหลังสวนยา ฟังให้นาน ฟังจนเจ้าลืมว่ากำลังฟัง"),
    say(KANG, "แล้วหากระดาษสาสองแผ่น น้องหมอใช้กระดาษข้าเขียนตำรับยาหมดแล้ว เขาว่ามันว่าง ข้าว่ามันคือเพลง"),
  ], [
    say(KANG, "สามสั้นหนึ่งยาว… สูงต่ำสลับ… ใช่! ใช่แล้ว!"),
    nar("คังกว่างหลิงจดโน้ตลงกระดาษอย่างบ้าคลั่ง แล้วดีดพิณยาวต่อเนื่องเป็นครั้งแรก เสียงนั้นทำให้คนไข้ในบ้านหลับสนิททั้งห้อง"),
    say(KANG, "เพลงกล่อมคนไข้ น้องหมอต้องชอบแน่ เอาตำราเพลงพื้นฐานนี่ไป ข้าเขียนไว้ตอนหนุ่ม ๆ ตอนยังไม่เก่ง"),
    say(KANG, "เจ้ามีหูดี วันหน้าถ้าเจ้ามีใจนิ่งพอ… อาจมีเพลงอื่นที่ข้าอยากให้เจ้าได้ยิน"),
  ], "รับตำราเพลง"),
  ...questScenes("qw_home_xuemuhua_killing_qin", "home_xuemuhua", [
    say(KANG, "เจ้าเคยถามว่าพิณฆ่าคนได้ไหม ได้ ข้าเคยแต่งเพลงหนึ่ง ‘กู่ฉินสังหาร’ ดีดแล้วเลือดลมคนฟังปั่นป่วนจนหูแตก"),
    say(KANG, "ข้าเผาโน้ตทิ้งตั้งแต่สามสิบปีก่อน แต่ศิษย์คนหนึ่งของข้าแอบจำไปได้ครึ่งเพลง แล้วหนีไปเข้าพรรคดาวพิษ"),
    say(KANG, "ช่วงนี้มีคนไข้หูเลือดออกมาหาน้องหมอบ่อย ข้ากลัวว่ามันกลับมาแล้ว และมันมาหาอีกครึ่งเพลงในหัวข้า"),
    say(KANG, "ไปถามน้องหมอเรื่องคนไข้ก่อน แล้วช่วยข้าจับมัน ข้าไม่อยากฆ่าศิษย์ แต่ข้าก็ไม่อยากให้มันฆ่าใครอีก"),
  ], [
    say(KANG, "หยกเนื้อดี… หมุดพิณใหม่จะไม่แตกอีก"),
    nar("คังกว่างหลิงใส่หมุดหยก ตั้งสาย แล้วดีดเพียงสามเสียง ใบไผ่รอบตัวขาดร่วงเป็นวงกลม"),
    say(KANG, "นี่คือกู่ฉินสังหาร ทั้งเพลง ข้าสอนเจ้าเพราะเจ้าเห็นแล้วว่าครึ่งเพลงในมือคนใจร้ายทำอะไรได้"),
    say(KANG, "เพลงที่ฆ่าคนได้ ต้องเล่นด้วยใจที่ไม่อยากฆ่า จำไว้ ถ้าวันไหนเจ้าดีดแล้วสนุก ให้วางพิณลงทันที"),
  ], "รับเพลงด้วยใจสงบ"),
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_killing_qin_ambush",
    lines: [
      nar("ยามสาม เสียงพิณแผ่วเบาดังมาจากหลังสวนยา เจ้าย่องไปจนเห็นชายชุดดำนั่งดีดพิณใต้แสงจันทร์"),
      nar("เสียงนั้นทำให้หัวเจ้าปวดเหมือนมีเข็มแทง หูอื้อ เลือดลมพลุ่งพล่าน"),
      say("ศิษย์ทรยศพิณมาร", "อาจารย์ส่งเด็กมาหรือ? ดี ฆ่าเจ้าแล้วข้าจะได้ยินเสียงอาจารย์ร้องไห้ เสียงนั้นคงเป็นครึ่งเพลงที่ข้าขาด"),
    ],
    choices: [
      { text: "ปิดหูด้วยลมปราณแล้วบุกเข้าไป",
        effects: [{ t: "triggerBattle", opponentId: "qfoe_home_xuemuhua_traitor", nonFatal: true,
          onWin: "qd_qw_home_xuemuhua_killing_qin_caught", onLose: "qd_qw_home_xuemuhua_killing_qin_escaped" }],
        next: "home_xuemuhua" },
      { text: "ถอยกลับไปตั้งหลัก", next: "home_xuemuhua" },
    ],
  },
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_killing_qin_caught",
    lines: [
      nar("สายพิณของศิษย์ทรยศขาดผึง หมุดพิณหยกของมันแตกกระจาย มันทรุดลงกับพื้น"),
      say(KANG, "พอแล้ว…"),
      nar("คังกว่างหลิงยืนอยู่ข้างหลังเจ้าตั้งแต่เมื่อไหร่ไม่รู้ เขามองศิษย์ด้วยตาแดงก่ำ แล้วกดจุดให้มันหลับ"),
      say(KANG, "ข้าจะพามันไปให้น้องหมอรักษาหู แล้วจะสอนมันใหม่ตั้งแต่เพลงแรก พิณข้าก็ร้าวเพราะเสียงมันเหมือนกัน ต้องหาหยกมาทำหมุดใหม่"),
    ],
    choices: [{ text: "ก้าวต่อไป", effects: [{ t: "advanceQuest", questId: "qw_home_xuemuhua_killing_qin" }], next: "home_xuemuhua" }],
  },
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_killing_qin_escaped",
    lines: [
      nar("เจ้าทรุดลงกุมหู เมื่อได้สติอีกที ชายชุดดำหายไปแล้ว เหลือแต่รอยเท้าบนดินชื้น"),
      say(XUE, "หูไม่แตก ยังโชคดี พักให้หาย แล้วคืนพรุ่งนี้มันคงกลับมาอีก"),
    ],
  },

  ...talk(N.li, "home_xuemuhua", [
    nar("ชายร่างผอมสวมหน้ากากลิงกระโดดลงจากหลังคา ตีลังกาสามตลบแล้วยืนเท้าเดียวต่อหน้าเจ้า"),
    say(LI, "ข้าคือเห้งเจีย มหาเทพเท่าฟ้า! เจ้าเป็นใคร? ปีศาจขาวกระดูกหรือ?"),
    nar("เขาถอดหน้ากากออก ยิ้มกว้างอย่างเขินอาย"),
    say(LI, "ขอโทษ ๆ ข้าซ้อมบทอยู่ ข้าชื่อหลี่ขุยเหล่ย น้องเล็กแห่งแปดสหาย อาชีพเล่นงิ้ว งานอดิเรกก็เล่นงิ้ว"),
    say(LI, "บางวันข้าเล่นจนลืมว่าตัวเองเป็นใคร พี่หมอบอกว่าเป็นโรค ข้าว่าเป็นพรสวรรค์"),
  ], {
    text: "งิ้วเรื่องต่อไปคือเรื่องอะไร",
    lines: [
      say(LI, "ไซอิ๋ว! ฉากเห้งเจียอาละวาดสวรรค์ ข้าจะเล่นให้คนไข้พี่หมอดู หัวเราะแล้วหายเร็ว พี่หมอไม่เชื่อ แต่ข้าเชื่อ"),
      say(LI, "แต่ก่อนนั้นต้องเล่นฉากจอมกระบี่ให้คล่องก่อน ดาบไม้ข้าหักหมดเลย พี่ใหญ่คังนั่งทับไปสองเล่ม"),
    ],
  }, {
    text: "ท่ารำบนเวทีของท่านใช้สู้จริงได้ไหม",
    lines: [
      say(LI, "ได้สิ! ท่ารำงิ้วทุกท่ามาจากวิชาจริง แค่ใส่เสื้อสวย ๆ กับตีกลองเพิ่ม"),
      say(LI, "กระบี่ลมที่ข้ารำ เร็วจนผ้าคลุมพลิ้ว คนดูเห็นแต่ลม ถ้าเจ้าขาไวพอ หาไม้มาทำดาบไม้ให้ข้า ข้าสอนให้"),
      say(LI, "ส่วนพลองเทวดาของเห้งเจียน่ะหรือ… อันนั้นต้องให้ข้ารู้จักเจ้าดีกว่านี้ก่อน"),
    ],
  }),
  ...questScenes("qw_home_xuemuhua_opera_sword", "home_xuemuhua", [
    say(LI, "เยี่ยม! ในที่สุดก็มีคนช่วยงานฝ่ายฉาก!"),
    say(LI, "ไม้เนื้ออ่อนสามท่อน เหลาง่าย หักง่าย ไม่เจ็บคนดู"),
    say(LI, "ได้มาแล้วมาซ้อมกับข้า ข้าเล่นเป็นจอมกระบี่ เจ้าเล่นเป็น… อีกจอมกระบี่ ที่แพ้"),
  ], [
    say(LI, "ดีมาก! ห้าสิบรอบสุดท้ายเจ้าหมุนตามข้าทัน ข้าเกือบโดนดาบไม้จิ้มตา"),
    nar("หลี่ขุยเหล่ยหมุนดาบไม้ ผ้าคลุมพลิ้วเป็นวงกลม แล้วฟันลงทีเดียว ใบไม้ที่ร่วงลงมาแยกเป็นสองซีกในอากาศ"),
    say(LI, "กระบี่ลม หลักคือเท้า ไม่ใช่มือ เท้าเร็ว คนดูก็เห็นแต่ลม ศัตรูก็ฟันโดนแต่ลม"),
    say(LI, "ฉากหน้าเราจะเล่นไซอิ๋ว ข้าอาจต้องการคู่ซ้อมอีก… เตรียมตัวไว้ ฮ่า ๆ"),
  ], "โค้งให้คนดูในจินตนาการ"),
  ...questScenes("qw_home_xuemuhua_monkey_staff", "home_xuemuhua", [
    say(LI, "ฉากใหญ่! เห้งเจียอาละวาดสวรรค์! เจ้าต้องช่วยข้าจัดเวที แขวนเมฆ ตั้งภูเขา วางบัลลังก์เง็กเซียน"),
    say(LI, "ฉากนี้ต้องสมจริง สมจริงจนคนดูลืมหายใจ สมจริงจน… อ้อ ไม่มีอะไร"),
    say(LI, "แล้วก็ ถ้าคืนนี้มีเสียงโครมครามที่ลาน อย่าตกใจนะ บ้านพี่หมอมีลิงป่าบ่อย"),
    nar("เขาขยิบตา แล้วเดินจากไปพร้อมฮัมเพลงงิ้วอย่างอารมณ์ดีเกินเหตุ"),
  ], [
    say(LI, "ไม้ศักดิ์สิทธิ์! เบาแต่ไม่หัก เหมาะกับพลองวิเศษที่สุด"),
    nar("หลี่ขุยเหล่ยเหลาไม้ทั้งคืน รุ่งเช้าเขาควงพลองสีทองรอบตัวจนเกิดลมหมุนพัดใบไผ่ขึ้นฟ้า"),
    say(LI, "พลองเทวดา ใช้ปัญญานำแรง ทุกท่าหลอกให้ศัตรูมองผิดที่ แล้วตีตรงที่มันไม่ได้มอง เหมือนเห้งเจียหลอกสวรรค์"),
    say(LI, "เมื่อคืนที่เจ้าสู้กับเห้งเจีย… ใช่ ข้าเอง ข้าขอโทษ แต่ไม่มีใครรำพลองได้จริงถ้าไม่เคยโดนพลองจริงตีหัว ฮ่า ๆ เอาชุดนี้ไปด้วย ชุดแสดงที่ดีที่สุดของข้า"),
  ], "รับพลองและให้อภัย"),
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_monkey_staff_monkey",
    lines: [
      nar("กลางดึก เสียงโครมครามดังจากลาน ภูเขากระดาษล้ม บัลลังก์เง็กเซียนแตกกระจาย"),
      nar("บนหลังคามีร่างหนึ่งสวมหน้ากากลิงทองคำ ควงพลองยาวจนเกิดเสียงหวีด"),
      say("เห้งเจีย", "ข้าคือมหาเทพเท่าฟ้า! ใครขวางทางข้าขึ้นสวรรค์ ต้องลิ้มรสพลองข้า!"),
      nar("เสียงนั้นคุ้นหูอย่างประหลาด แต่พลองที่ฟาดลงมาไม่ได้ออมมือเลยสักนิด"),
    ],
    choices: [
      { text: "รับมือเห้งเจีย",
        effects: [{ t: "triggerBattle", opponentId: "spar_home_xuemuhua_li", nonFatal: true,
          onWin: "qd_qw_home_xuemuhua_monkey_staff_won", onLose: "qd_qw_home_xuemuhua_monkey_staff_lost" }],
        next: "home_xuemuhua" },
      { text: "หลบเข้าบ้านไปก่อน", next: "home_xuemuhua" },
    ],
  },
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_monkey_staff_won",
    lines: [
      nar("พลองของเห้งเจียหลุดมือหักเป็นสองท่อน ร่างนั้นตีลังกาหนีขึ้นหลังคาแล้วหายไปในความมืด"),
      nar("รุ่งเช้า หลี่ขุยเหล่ยนั่งกินข้าวต้มที่ลานหน้าบ้าน หัวมีผ้าพันแผลหนึ่งรอบ"),
      say(LI, "เมื่อคืนมีลิงป่าอีกแล้วหรือ? น่ากลัวจัง… อ้อ ใช่ ข้าอยากได้ไม้ดี ๆ มาทำพลองใหม่ พลองเก่าข้า… หักน่ะ"),
    ],
    choices: [{ text: "ก้าวต่อไป", effects: [{ t: "advanceQuest", questId: "qw_home_xuemuhua_monkey_staff" }], next: "home_xuemuhua" }],
  },
  {
    kind: "dialog", id: "qd_qw_home_xuemuhua_monkey_staff_lost",
    lines: [
      nar("พลองฟาดลงข้างหัวเจ้าอย่างจงใจ ไม่โดน แต่ลมพลองทำให้เจ้าล้มลงกับพื้น"),
      say("เห้งเจีย", "ยังไม่ถึงขั้น! กลับไปฝึกมาใหม่ ข้าจะรอบนหลังคานี้แหละ"),
    ],
  },

  ...talk(N.dan, "home_xuemuhua", [
    nar("เด็กชายตัวเล็กวิ่งวุ่นไปมา มือถือสากบดยา ปากท่องชื่อสมุนไพรไม่หยุด"),
    say(DAN, "ชะเอม ตังกุย โสม บัวหิมะ… สากข้าอยู่ไหน… อ้าว อยู่ในมือ"),
    say(DAN, "พี่เป็นคนไข้หรือ? ไม่ใช่? งั้นช่วยหาครกให้หน่อย ข้าวางไว้ตรงนี้แน่ ๆ"),
    say(DAN, "อาจารย์บอกว่าข้าจะเป็นหมอเก่งได้ ถ้าเลิกลืมของ ข้าว่าข้าจะเป็นหมอเก่งที่ลืมของก็ได้นี่"),
  ], {
    text: "อาจารย์เจ้าดุไหม",
    lines: [
      say(DAN, "ดุแต่ปาก! อาจารย์บ่นทุกวันว่าคนไข้เยอะ แต่ไม่เคยไล่ใครกลับเลย"),
      say(DAN, "เมื่อคืนมีคนไข้หูเลือดออกมาสองคน อาจารย์นั่งดูอาการทั้งคืน ไม่ยอมนอน แล้วก็บ่นทั้งคืนด้วย"),
    ],
  }, {
    text: "ข้าช่วยอะไรได้ไหม",
    lines: [
      say(DAN, "ช่วยบดยาที่มุมห้องยาได้นะ อาจารย์ให้ค่าแรงด้วย แล้วบางทีก็แบ่งยาให้"),
      say(DAN, "หรือถ้าพี่มีขนมไหว้พระจันทร์… ข้าไม่ได้ขอนะ ข้าแค่บอกว่าข้าชอบ"),
    ],
  }),
];

// ═══════════════════════════════════════════════════════════════════════
// Place activities
// ═══════════════════════════════════════════════════════════════════════
const ACTIVITIES: ActivityDef[] = [
  { id: "act_home_player_well", label: "ตักน้ำรดแปลงผัก", badge: "labor", icon: "🪣", hours: 2, stamina: 10,
    description: "ตักน้ำจากบ่อหน้าบ้านไปรดผัก · ฝึกกำลัง · ป้าหลิวชอบใจ",
    place: { locationIds: ["home_player"], spot: { x: 47, y: 60 }, cooldownDays: 1,
      reward: { statXp: "STR", relationship: { npcId: N.liu, amount: 1 } },
      doneText: "ผักทั้งแปลงชุ่มน้ำ ป้าหลิวตะโกนชมจากราวผ้า แขนเจ้าล้าแต่แข็งขึ้น" } },
  { id: "act_home_player_garden", label: "ถอนหญ้าในแปลงผัก", badge: "herbalism", icon: "🌱", hours: 3, stamina: 10,
    description: "ดูแลแปลงผักหลังบ้าน · บางทีเจอสมุนไพรขึ้นแซม",
    place: { locationIds: ["home_player"], spot: { x: 22, y: 55 }, cooldownDays: 2,
      reward: { statXp: "VIT", item: { itemId: "herb", count: 1, chance: 0.5 } },
      doneText: "แปลงผักสะอาดตา เจ้าเจอสมุนไพรต้นเล็ก ๆ ขึ้นแซมอยู่ข้างรั้วด้วย" } },
  { id: "act_home_hufei_blade_post", label: "ฟันหุ่นไม้กับฮูเฝย์", badge: "practice", icon: "🪵", hours: 4, stamina: 20,
    description: "ซ้อมฟันหุ่นไม้ที่ลานบ้านฮูเฝย์ · ฝึกกำลัง · ได้ใจเจ้าบ้าน",
    place: { locationIds: ["home_hufei"], cooldownDays: 1,
      reward: { wExp: 10, statXp: "STR", relationship: { npcId: N.hufei, amount: 1 } },
      doneText: "หุ่นไม้เหลือแต่ตอ ฮูเฝย์หัวเราะลั่น ‘พรุ่งนี้ทำหุ่นใหม่ด้วยนะ’" } },
  { id: "act_home_chengkun_eavesdrop", label: "แอบฟังใต้หน้าต่าง", badge: "investigate", icon: "👂", hours: 2, stamina: 5,
    description: "แอบฟังเฉินโหย่วเลี่ยงคุยกับคนส่งสาร · ฝึกปัญญา · เสี่ยงถูกจับได้",
    place: { locationIds: ["home_chengkun"], cooldownDays: 3,
      reward: { wExp: 15, statXp: "INT", relationship: { npcId: N.wu, amount: 1 } },
      doneText: "เจ้าได้ยินชื่อ ‘หยวนเจิน’ กับ ‘วัดเส้าหลิน’ ก่อนเสียงฝีเท้าใกล้เข้ามา ลุงอู๋พยักหน้าให้เจ้าเบา ๆ จากสวน" } },
  { id: "act_home_xuemuhua_grind", label: "ช่วยบดยาให้หมอ", badge: "alchemy", icon: "⚗️", hours: 3, stamina: 15,
    description: "ช่วยเสี่ยวตันบดสมุนไพรในห้องยา · ได้ค่าแรงและบางทีได้ยา",
    place: { locationIds: ["home_xuemuhua"], cooldownDays: 1,
      reward: { gold: [10, 25], statXp: "INT", item: { itemId: "potion", count: 1, chance: 0.4 }, relationship: { npcId: N.xue, amount: 1 } },
      doneText: "ผงยาละเอียดเหมือนแป้ง หมอเซวี่ยพยักหน้าครั้งเดียว ซึ่งสำหรับเขาถือว่าชมมาก" } },
];

// ═══════════════════════════════════════════════════════════════════════
// Place meetings
// ═══════════════════════════════════════════════════════════════════════
const EVENTS: MeetEventDef[] = [
  // NOTE: home_player is a safe scene (store/world-store.ts SAFE_SCENES), so
  // walk ticks never roll there and this meeting cannot fire yet.
  { id: "pev_home_player_peddler", weight: 2, dialogSceneId: "pev_home_player_peddler", locationIds: ["home_player"] },
  { id: "pev_home_hufei_tea", weight: 2, dialogSceneId: "pev_home_hufei_tea", locationIds: ["home_hufei"] },
  { id: "pev_home_chengkun_shadow", weight: 2, dialogSceneId: "pev_home_chengkun_shadow", locationIds: ["home_chengkun"] },
  { id: "pev_home_xuemuhua_patient", weight: 2, dialogSceneId: "pev_home_xuemuhua_patient", locationIds: ["home_xuemuhua"] },
];

const EVENT_SCENES: DialogScene[] = [
  {
    kind: "dialog", id: "pev_home_player_peddler",
    lines: [
      nar("พ่อค้าเร่แบกหาบผ่านหน้าบ้าน ร้องขายเสียงดัง ‘ขนมไหว้พระจันทร์ ไส้เม็ดบัว หวานเหมือนรักแรก!’"),
      say(LIU, "หลานรัก ซื้อให้ป้าสักชิ้นสิ ป้าไม่ได้กินมาตั้งแต่นายท่านยังอยู่"),
    ],
    choices: [
      { text: "ซื้อให้ป้าหลิว (10 ตำลึง)", visibleIf: { t: "goldAtLeast", amount: 10 },
        effects: [{ t: "addGold", amount: -10 }, { t: "addNpcRelationship", npcId: N.liu, amount: 3 }, { t: "addTrait", trait: "good", amount: 1 }],
        next: "home_player" },
      { text: "ส่ายหน้าให้พ่อค้า", next: "home_player" },
    ],
  },
  {
    kind: "dialog", id: "pev_home_hufei_tea",
    lines: [
      nar("ผิงอาสี่เดินกะเผลกมาพร้อมถาดชาร้อน วางลงข้างเจ้าโดยไม่พูดอะไร"),
      say(PING, "ลมชายแดนแรง ดื่มชาก่อน นายน้อยสั่งไว้ว่าแขกต้องไม่หนาว"),
    ],
    choices: [
      { text: "ดื่มชาแล้วขอบคุณ",
        effects: [{ t: "addNpcRelationship", npcId: N.ping, amount: 2 }, { t: "addNpcRelationship", npcId: N.hufei, amount: 1 }],
        next: "home_hufei" },
    ],
  },
  {
    kind: "dialog", id: "pev_home_chengkun_shadow",
    lines: [
      nar("เงาดำวูบผ่านกำแพงบ้าน คนสวมหมวกปีกกว้างหย่อนห่อผ้าลงหน้าประตูแล้วหันหลังจะไป"),
      nar("เมื่อเห็นเจ้า มันชักมีดสั้นออกมาทันที"),
    ],
    choices: [
      { text: "ขวางทางมันไว้",
        effects: [{ t: "triggerBattle", opponentId: "night_blade", nonFatal: true,
          onWin: "pev_home_chengkun_shadow_won", onLose: "home_chengkun" }],
        next: "home_chengkun" },
      { text: "ปล่อยมันไป", next: "home_chengkun" },
    ],
  },
  {
    kind: "dialog", id: "pev_home_chengkun_shadow_won",
    lines: [
      nar("มือมีดหนีข้ามกำแพงไป ทิ้งห่อผ้าไว้ ข้างในมีเหรียญเงินกับจดหมายที่ถูกเผาจนอ่านไม่ออก"),
      say(WU, "เก็บเหรียญไว้ เผาจดหมายทิ้ง อย่าให้ศิษย์เฉินเห็น"),
    ],
    choices: [
      { text: "ทำตามที่ลุงอู๋บอก",
        effects: [{ t: "addGold", amount: 40 }, { t: "addNpcRelationship", npcId: N.wu, amount: 2 }],
        next: "home_chengkun" },
    ],
  },
  {
    kind: "dialog", id: "pev_home_xuemuhua_patient",
    lines: [
      nar("ชายคนหนึ่งแบกเพื่อนที่เท้าบวมเป่งเดินโซเซมาหน้าบ้านหมอ ล้มลงตรงหน้าเจ้า"),
      say(DAN, "งูกัด! พี่ช่วยแบกเข้าไปในห้องยาหน่อย ข้าจะไปตามอาจารย์!"),
    ],
    choices: [
      { text: "แบกคนเจ็บเข้าห้องยา",
        effects: [{ t: "addTrait", trait: "good", amount: 1 }, { t: "addNpcRelationship", npcId: N.xue, amount: 2 },
          { t: "giveItem", itemId: "potion", count: 1 }],
        next: "home_xuemuhua" },
      { text: "ปล่อยให้คนอื่นจัดการ", next: "home_xuemuhua" },
    ],
  },
];

export const CONTENT: PlaceContent = {
  npcs: NPCS,
  quests: QUESTS,
  scenes: [...SCENES, ...EVENT_SCENES],
  activities: ACTIVITIES,
  events: EVENTS,
  opponents: OPPONENTS,
};
