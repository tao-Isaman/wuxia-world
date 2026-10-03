// Homes C — five households of the jianghu:
//   home_chengying  程英 (Cheng Ying) and her cousin Lu Wushuang
//   home_yanji      閻基 (Yan Ji), thief turned bone-setter
//   home_beichou    北醜 (the Ugly One of the North), a scarred spear hermit
//   villa_meizhuang 梅莊 (the Plum Manor of the four Jiangnan friends)
//   villa_fuwei     福威鏢局 (the Lin family's escort agency)
// Teaches (one quest each): gn, nc8, t1_whitehorse, nd2, nm1, fs, ne3, sa, nf3, yyz.
import type { Choice, Condition, DialogScene, NpcDef, QuestDef, SceneEffect, SceneLine } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";
import type { PlaceContent } from "./types";

// ─── Small builders ───────────────────────────────────────────────────
const say = (speaker: string, text: string): SceneLine => ({ t: "dialogue", speaker, text });
const tell = (text: string): SceneLine => ({ t: "narration", text });
const dialog = (id: string, lines: SceneLine[], choices?: Choice[], onEnter?: SceneEffect[]): DialogScene => ({
  kind: "dialog", id, lines, ...(choices ? { choices } : {}), ...(onEnter ? { onEnter } : {}),
});
/** Briefing: accept or decline, both back to the place. */
const offer = (questId: string, place: string, lines: SceneLine[], yes: string, no: string): DialogScene =>
  dialog(`qs_${questId}_offer`, lines, [
    { text: yes, next: place, effects: [{ t: "startQuest", questId }] },
    { text: no, next: place },
  ]);
/** Hand-in: one choice that closes the quest. */
const complete = (questId: string, place: string, lines: SceneLine[], text: string, extra: SceneEffect[] = []): DialogScene =>
  dialog(`qs_${questId}_complete`, lines, [
    { text, next: place, effects: [{ t: "finishQuest", questId, success: true }, ...extra] },
  ]);
const rel = (npcId: string, min: number): Condition => ({ t: "npcRelationship", npcId, min });

// ─── Places ───────────────────────────────────────────────────────────
const CY = "home_chengying";
const YJ = "home_yanji";
const BC = "home_beichou";
const MZ = "villa_meizhuang";
const FW = "villa_fuwei";

// ─── NPC ids and names (speaker names must match NPC names exactly) ──
const CHENG = "home_chengying_mistress_cheng";
const CHENG_N = "เฉิงอิ๋ง";
const LU = "home_chengying_cousin_lu";
const LU_N = "ลู่อู๋ซวง";
const TONG = "home_chengying_gooseboy_tong";
const TONG_N = "อาถงเด็กเลี้ยงห่าน";

const YAN = "home_yanji_bonesetter_yan";
const YAN_N = "หยานจี";
const LIU = "home_yanji_guard_liu";
const LIU_N = "หลิวกระบองไหม้";
const CHUN = "home_yanji_maid_chun";
const CHUN_N = "ชุนเถาสาวใช้";

const BEI = "home_beichou_hermit_bei";
const BEI_N = "เป่ยฉิว";
const AMU = "home_beichou_servant_amu";
const AMU_N = "อาหมู่คนใบ้";
const CAO = "home_beichou_herder_cao";
const CAO_N = "เสี่ยวเฉ่าเด็กเลี้ยงแพะ";

const HUANG = "villa_meizhuang_master_huang";
const HUANG_N = "หวงจงกง";
const HEIBAI = "villa_meizhuang_master_heibai";
const HEIBAI_N = "เฮยไป๋จื่อ";
const DANQING = "villa_meizhuang_painter_danqing";
const DANQING_N = "ตันชิงเซิง";
const DING = "villa_meizhuang_steward_ding";
const DING_N = "พ่อบ้านติงเจียน";

const LINZ = "villa_fuwei_chief_lin";
const LINZ_N = "หลินเจิ้นหนาน";
const PING = "villa_fuwei_young_lin";
const PING_N = "หลินผิงจือ";
const SHI = "villa_fuwei_escort_shi";
const SHI_N = "สื่อเปียวโถว";

// ─── Quest ids ────────────────────────────────────────────────────────
const Q_PEACOCK = "qw_chengying_peacock_fan";      // nd2  T1
const Q_DEW = "qw_chengying_dew_blade";            // nm1  T1
const Q_GEESE = "qw_chengying_lost_geese";
const Q_NEEDLE = "qw_yanji_golden_needle";         // gn   T0
const Q_FIRE = "qw_yanji_fire_staff";              // fs   T2
const Q_LETTER = "qw_yanji_maid_letter";
const Q_SPEAR = "qw_beichou_spinning_spear";       // ne3  T2
const Q_GOATS = "qw_beichou_lost_goats";
const Q_PICTURE = "qw_beichou_mute_picture";
const Q_GUANGLING = "qw_meizhuang_guangling";      // sa   T2
const Q_GO = "qw_meizhuang_go_manual";
const Q_FINGER = "qw_meizhuang_one_finger";        // yyz  T3
const Q_PAINT = "qw_meizhuang_drunk_painter";
const Q_WHIP = "qw_fuwei_riding_whip";             // nc8  T0
const Q_HORSE = "qw_fuwei_white_horse";            // t1_whitehorse T1
const Q_ESCORT = "qw_fuwei_escort_run";
const Q_DRAGON = "qw_fuwei_dragon_spear";          // nf3  T3

// ─── Opponents ────────────────────────────────────────────────────────
const SPAR_LU = "spar_chengying_lu";
const SPAR_LIU = "spar_yanji_liu";
const SPAR_BEI = "spar_beichou_bei";
const SPAR_HUANG = "spar_meizhuang_huang";
const SPAR_SHI = "spar_fuwei_shi";
const FOE_ENVOY = "foe_meizhuang_sunmoon_envoy";
const FOE_LUO = "foe_fuwei_qingcheng_luo";

const opponents: StoryOpponentSpec[] = [
  { id: SPAR_LU, name: LU_N, ti: 1, look: { sheet: "f3" }, stats: { POW: 4, AGI: 4, DEX: 2 }, skillIds: ["nm1", "nc7"] },
  { id: SPAR_LIU, name: LIU_N, ti: 2, look: { sheet: "m3" }, stats: { STR: 7, VIT: 5, POW: 3 }, skillIds: ["fs", "nc6"] },
  { id: SPAR_BEI, name: BEI_N, ti: 2, look: { sheet: "elder", tint: 0xc9a08a }, stats: { STR: 8, AGI: 5, VIT: 4 },
    skillIds: ["ne3", "nc5"], artId: "military", artLevel: 5 },
  { id: SPAR_HUANG, name: HUANG_N, ti: 2, look: { sheet: "elder" }, stats: { POW: 8, INT: 6, DEX: 3 }, skillIds: ["sa", "nc9"] },
  { id: SPAR_SHI, name: SHI_N, ti: 2, look: { sheet: "m3" }, stats: { STR: 7, VIT: 6, AGI: 3 }, skillIds: ["nd4", "nc5"] },
  { id: FOE_ENVOY, name: "ทูตเงาแห่งลัทธิตะวันจันทรา", ti: 3, look: { sheet: "m4", tint: 0x6a4a7a, size: 1.1 },
    stats: { POW: 10, AGI: 8, DEX: 5 }, skillIds: ["nf4", "nd9", "nd8"], artId: "shadow", artLevel: 6 },
  { id: FOE_LUO, name: "ลั่วเหรินเจี๋ยแห่งชิงเฉิง", ti: 3, look: { sheet: "m2", tint: 0x5a7a6a, size: 1.1 },
    stats: { DEX: 9, AGI: 9, STR: 5 }, skillIds: ["nh2", "nf4", "nd11"] },
];

// ─── NPCs ─────────────────────────────────────────────────────────────
const npcs: NpcDef[] = [
  // home_chengying
  { id: CHENG, name: CHENG_N, locationIds: [CY], dialogSceneId: `npc_${CHENG}_talk`,
    description: "ศิษย์คนสุดท้ายของฮ่วงเอี้ยะซือ หญิงสาวอ่อนโยนผู้เป่าขลุ่ยหยก ปักผ้าได้งามที่สุดในแถบนี้ และไม่เคยพูดชื่อคนที่นางคิดถึง",
    tags: ["scholar", "musician", "martial_artist"], look: { body: "f2" },
    likes: ["silk", "song_inter", "lotus_seed", "craft"], dislikes: ["venom"] },
  { id: LU, name: LU_N, locationIds: [CY], dialogSceneId: `npc_${LU}_talk`, sparOpponentId: SPAR_LU, sparFameReward: 4,
    description: "ลูกพี่ลูกน้องของเฉิงอิ๋ง ขาข้างหนึ่งกะเผลก ปากร้ายเป็นไฟ แต่ใครรังแกคนในบ้านนางจะได้เจอดาบก่อนคำด่า",
    tags: ["martial_artist", "family"], look: { body: "f3", wander: true }, defenseTier: 1,
    likes: ["cooked_meat", "spicy_stew", "iron_blade"], dislikes: ["potion"] },
  { id: TONG, name: TONG_N, locationIds: [CY], dialogSceneId: `npc_${TONG}_talk`,
    description: "เด็กกำพร้าที่เฉิงอิ๋งรับมาเลี้ยง ดูแลฝูงห่านแปดตัวที่เชื่อฟังเขาน้อยกว่าเชื่อฟังข้าวเปลือก",
    tags: ["child", "servant"], look: { body: "m1", wander: true },
    likes: ["moon_cake", "rice_dish", "food"], dislikes: ["book"] },

  // home_yanji
  { id: YAN, name: YAN_N, locationIds: [YJ], dialogSceneId: `npc_${YAN}_talk`, defenseTier: 1,
    description: "อดีตหัวขโมยตีนแมวที่กลับใจ (ครึ่งหนึ่ง) มาเป็นหมอจัดกระดูกผู้มั่งคั่ง ยิ้มหวาน นับเงินไวกว่าจับชีพจร",
    tags: ["healer", "merchant", "elder"], look: { body: "merchant" },
    likes: ["gold", "ginseng", "jade", "ancient_coin"], dislikes: ["poison_vial"],
    stealLoot: [{ itemId: "herb", weight: 5 }, { itemId: "ginseng", weight: 2 }, { itemId: "ancient_coin", weight: 2 }, { itemId: "jade", weight: 1 }] },
  { id: LIU, name: LIU_N, locationIds: [YJ], dialogSceneId: `npc_${LIU}_talk`, sparOpponentId: SPAR_LIU, sparFameReward: 6,
    description: "อดีตศิษย์นอกพรรคกระยาจกที่โดนไล่ออกเพราะเมา บัดนี้เป็นผู้คุ้มกันบ้านหยานจี กระบองของเขาไหม้ดำจากการฝึกข้างกองไฟ",
    tags: ["guard", "martial_artist"], look: { body: "m3", wander: true }, defenseTier: 2,
    likes: ["cooked_meat", "spicy_stew", "food"], dislikes: ["herb"] },
  { id: CHUN, name: CHUN_N, locationIds: [YJ], dialogSceneId: `npc_${CHUN}_talk`,
    description: "สาวใช้ช่างพูดจากหมู่บ้านชีกู่ รู้ความลับทุกเรื่องในบ้านนี้ และพร้อมเล่าให้ใครก็ได้ที่ยอมฟัง",
    tags: ["servant"], look: { body: "f1", wander: true },
    likes: ["silk_fan", "jade_pendant", "moon_cake"], dislikes: ["raw_meat"] },

  // home_beichou
  { id: BEI, name: BEI_N, locationIds: [BC], dialogSceneId: `npc_${BEI}_talk`, sparOpponentId: SPAR_BEI, sparFameReward: 8,
    description: "อัปลักษณ์แห่งทิศเหนือ อดีตแม่ทัพทวนที่ใบหน้าถูกไฟเผา ชอบตั้งปริศนาแล้วหัวเราะลั่นเขาเมื่อคนตอบผิด",
    tags: ["elder", "martial_artist", "hermit"], look: { body: "elder" }, defenseTier: 2,
    likes: ["cooked_meat", "alpha_inter", "book", "tiger_claw"], dislikes: ["silk_robe", "jade_pendant"] },
  { id: AMU, name: AMU_N, locationIds: [BC], dialogSceneId: `npc_${AMU}_talk`,
    description: "คนรับใช้ร่างใหญ่ที่พูดไม่ได้ สื่อสารด้วยภาพวาดถ่านบนแผ่นไม้ และทำซาลาเปาอร่อยที่สุดบนเขานี้",
    tags: ["servant", "cook"], look: { body: "m2", wander: true },
    likes: ["rice_dish", "wood_hard", "paper", "food"] },
  { id: CAO, name: CAO_N, locationIds: [BC], dialogSceneId: `npc_${CAO}_talk`,
    description: "เด็กหญิงเลี้ยงแพะจากเชิงเขา ไม่กลัวหน้าตาของเป่ยฉิวเลยสักนิด เพราะ \"ลุงแกเล่านิทานสนุก\"",
    tags: ["child", "herder"], look: { body: "f1", wander: true },
    likes: ["moon_cake", "fortune_charm", "lotus_seed"], dislikes: ["venom"] },

  // villa_meizhuang
  { id: HUANG, name: HUANG_N, locationIds: [MZ], dialogSceneId: `npc_${HUANG}_talk`, sparOpponentId: SPAR_HUANG, sparFameReward: 8,
    description: "พี่ใหญ่แห่งสี่สหายเจียงหนาน คลั่งพิณจนลืมกินข้าว เสียงพิณของเขาทำให้คนฟังหลับหรือล้มลงได้ตามใจ",
    tags: ["elder", "musician", "master"], look: { body: "elder" }, defenseTier: 3,
    likes: ["song_inter", "song_basic", "wood_sacred"], dislikes: ["raw_meat"] },
  { id: HEIBAI, name: HEIBAI_N, locationIds: [MZ], dialogSceneId: `npc_${HEIBAI}_talk`,
    description: "พี่รองผู้หลงใหลหมากล้อม ผมดำครึ่งขาวครึ่ง หน้าซีดเหมือนไม่เคยโดนแดด คิดไกลกว่าใครสิบตา และบางทีก็ไกลเกินไป",
    tags: ["scholar", "master"], look: { body: "m4" }, defenseTier: 3,
    likes: ["book_advanced", "jade", "alpha_master"], dislikes: ["fortune_charm"] },
  { id: DANQING, name: DANQING_N, locationIds: [MZ], dialogSceneId: `npc_${DANQING}_talk`,
    description: "น้องสี่ผู้รักสุรากับภาพวาดเท่ากัน หน้าแดงตลอดปี เดินโซเซไปทั่วสวนพร้อมพู่กันกับจอก",
    tags: ["painter", "drunkard", "master"], look: { body: "m2", wander: true },
    likes: ["image_master", "image_inter", "ink", "cooked_meat"], dislikes: ["book_basic"] },
  { id: DING, name: DING_N, locationIds: [MZ], dialogSceneId: `npc_${DING}_talk`,
    description: "พ่อบ้านเฝ้าประตูคฤหาสน์ อดีตจอมยุทธ \"สายฟ้าซ้ายมือ\" ที่บัดนี้เก่งที่สุดเรื่องไล่แขกไม่ได้รับเชิญ",
    tags: ["servant", "guard"], look: { body: "m1" }, defenseTier: 2,
    likes: ["spicy_stew", "warrior_belt", "gold"] },

  // villa_fuwei
  { id: LINZ, name: LINZ_N, locationIds: [FW], dialogSceneId: `npc_${LINZ}_talk`, defenseTier: 2,
    description: "เจ้าสำนักคุ้มกันฝูเวย ใจดี ยิ้มง่าย ค้าขายเก่งกว่าฟันดาบ และภูมิใจในธงสิงห์ของตระกูลยิ่งกว่าสิ่งใด",
    tags: ["merchant", "official", "master"], look: { body: "merchant" },
    likes: ["gold", "jade", "steel_sword", "ancient_coin"], dislikes: ["poison_vial"],
    stealLoot: [{ itemId: "silver_ring", weight: 4 }, { itemId: "ancient_coin", weight: 3 }, { itemId: "jade", weight: 1 }, { itemId: "gold_ring", weight: 1 }] },
  { id: PING, name: PING_N, locationIds: [FW], dialogSceneId: `npc_${PING}_talk`,
    description: "บุตรชายคนเดียวของตระกูลหลิน หน้าตางามเกินชาย ชอบขี่ม้าล่าสัตว์ และยังไม่รู้ว่ายุทธภพโหดร้ายแค่ไหน",
    tags: ["noble", "hunter"], look: { body: "m1", wander: true },
    likes: ["fur_pelt", "tiger_claw", "silk_fan"], dislikes: ["rock"] },
  { id: SHI, name: SHI_N, locationIds: [FW], dialogSceneId: `npc_${SHI}_talk`, sparOpponentId: SPAR_SHI, sparFameReward: 6,
    description: "หัวหน้าคุ้มกันอาวุโส หนวดเครารก เสียงดังเหมือนฆ้อง คุมเกวียนมายี่สิบปีไม่เคยเสียหีบสักใบ",
    tags: ["guard", "escort", "martial_artist"], look: { body: "m3" }, defenseTier: 2,
    likes: ["cooked_meat", "spicy_stew", "warrior_belt"], dislikes: ["silk_fan"] },
];

// ─── Quests ───────────────────────────────────────────────────────────
const quests: QuestDef[] = [
  // ═══ home_chengying ═══════════════════════════════════════════════
  {
    id: Q_PEACOCK, type: "side", giverNpcId: CHENG,
    name: "วิชาลึกลับของเฉิงอิ๋ง",
    description: "เฉิงอิ๋งกำลังปักนกยูงลงบนพัดผืนใหม่ แต่ผ้าไหมกับด้ายหมดลงกลางทาง นางบอกว่าถ้าพัดเสร็จจะสอนท่าพัดที่ทำให้ตาศัตรูพร่ามัวให้",
    briefSummary: "หาผ้าไหม 2 ผืนกับเส้นด้าย 3 ม้วนให้เฉิงอิ๋ง แล้วช่วยนางลองท่าพัด",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "silk", description: "หาผ้าไหม 2 ผืนและเส้นด้าย 3 ม้วนให้เฉิงอิ๋ง",
        autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "silk", count: 2 }, { t: "hasItem", itemId: "thread", count: 3 }] } },
      { id: "try_fan", description: "ช่วยเฉิงอิ๋งลองท่าพัดนกยูงกลางลานบ้าน",
        objective: { hours: 2, spots: [{ locationId: CY, npcId: CHENG, label: "ยืนเป็นคู่ซ้อมพัดให้เฉิงอิ๋ง",
          text: "พัดสีรุ้งกางออกตรงหน้า ตาเจ้าพร่าไปชั่วขณะ เฉิงอิ๋งหัวเราะเบา ๆ — \"เห็นไหม ศัตรูก็จะเป็นแบบนี้\"" }] } },
      { id: "return", description: "กลับไปหาเฉิงอิ๋งเพื่อเรียนพัดนกยูง" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nd2" }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 }, { t: "npcRelationship", npcId: CHENG, amount: 10 }],
  },
  {
    id: Q_DEW, type: "side", giverNpcId: LU,
    name: "วิชาลึกลับของสาวขากะเผลก",
    description: "พวกอันธพาลในตลาดล้อเลียนการเดินของลู่อู๋ซวง นางไม่อยากให้พี่สาวรู้ จึงขอให้เจ้าไปสั่งสอนแทน แลกกับดาบที่นางฝึกจากหยดน้ำค้างทุกเช้า",
    briefSummary: "สั่งสอนโจรเร่ร่อน 3 คน แล้วฝึกฟันน้ำค้างยามรุ่งกับลู่อู๋ซวง",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "thugs", description: "สั่งสอนโจรเร่ร่อน 3 คนที่ล้อเลียนลู่อู๋ซวง",
        autoAdvance: { t: "defeatedOpponent", opponentId: "thug", count: 3 } },
      { id: "dawn", description: "ฝึกฟันหยดน้ำค้างยามรุ่งที่ลานหน้าบ้านเฉิงอิ๋ง",
        objective: { hours: 2, spots: [{ locationId: CY, label: "ฟันหยดน้ำค้างยามรุ่ง",
          text: "หยดน้ำค้างร่วงจากใบไผ่ เจ้าฟันมันแตกเป็นสองโดยใบไผ่ไม่ไหวติง — เหมือนที่ลู่อู๋ซวงบอกว่า \"ดาบต้องเบากว่าลมหายใจ\"" }] } },
      { id: "return", description: "กลับไปหาลู่อู๋ซวง" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nm1" }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 }, { t: "npcRelationship", npcId: LU, amount: 10 }],
  },
  {
    id: Q_GEESE, type: "side", giverNpcId: TONG,
    name: "ห่านแปดตัวหายไปห้า",
    description: "อาถงเผลอหลับใต้ต้นหลิว ตื่นมาห่านหายไปห้าตัว ถ้าคุณหนูเฉิงรู้ (ซึ่งนางจะไม่ดุ) เขาจะเสียใจมาก",
    briefSummary: "ตามหาห่านที่หนีไปริมลำธารและในพงไผ่หลังบ้าน",
    stages: [
      { id: "search", description: "ต้อนห่านกลับจากริมลำธารและพงไผ่หลังบ้านเฉิงอิ๋ง",
        objective: { spots: [
          { locationId: CY, label: "ต้อนห่านริมลำธาร", text: "ห่านสามตัวกำลังไล่จิกปลาตัวเล็ก เจ้าโดนจิกไปสองที แต่ต้อนกลับมาได้" },
          { locationId: CY, label: "ค้นพงไผ่หลังบ้าน", text: "ห่านอีกสองตัวนอนกกไข่อยู่ในพงไผ่ — มีไข่ด้วย! อาถงต้องดีใจแน่" },
        ] } },
      { id: "return", description: "กลับไปบอกอาถงว่าห่านครบแล้ว" },
    ],
    rewards: [{ t: "gold", amount: 60 }, { t: "item", itemId: "moon_cake", count: 1 }, { t: "trait", trait: "good", amount: 1 }, { t: "npcRelationship", npcId: TONG, amount: 10 }, { t: "npcRelationship", npcId: CHENG, amount: 3 }],
  },

  // ═══ home_yanji ═══════════════════════════════════════════════════
  {
    id: Q_NEEDLE, type: "side", giverNpcId: YAN,
    name: "วิชาลึกลับของหมอจัดกระดูก",
    description: "คนไข้ของหยานจีมาก แต่สมุนไพรในตู้หมด เขาขอสมุนไพร 3 ต้น แลกกับวิชาลึกลับที่ \"เคยใช้ปาหมาเฝ้าบ้านคนอื่น\" สมัยยังเป็นขโมย",
    briefSummary: "นำสมุนไพรหายาก 3 ต้นมาให้หยานจี",
    stages: [
      { id: "herbs", description: "เก็บสมุนไพรหายาก 3 ต้นให้หยานจี", autoAdvance: { t: "hasItem", itemId: "herb", count: 3 } },
      { id: "return", description: "นำสมุนไพรไปให้หยานจีที่บ้าน" },
    ],
    rewards: [{ t: "learnSkill", skillId: "gn" }, { t: "gold", amount: 100 }, { t: "npcRelationship", npcId: YAN, amount: 8 }],
  },
  {
    id: Q_FIRE, type: "side", giverNpcId: LIU,
    name: "กระบองไหม้ไฟ",
    description: "กระบองคู่ใจของหลิวหักกลางเมื่อคืน เขาอยากได้ไม้เนื้อแข็งมาเหลาอันใหม่ แล้วต้องการคู่ซ้อมที่ทนพอจะรับวิชาลึกลับสักยก",
    briefSummary: "หาไม้เนื้อแข็ง 2 ท่อนให้หลิว แล้วประลองกับเขาจนชนะ",
    prereqs: { t: "and", all: [{ t: "statAtLeast", stat: "STR", min: 15 }, rel(LIU, 5)] },
    stages: [
      { id: "wood", description: "หาไม้เนื้อแข็ง 2 ท่อนให้หลิวกระบองไหม้", autoAdvance: { t: "hasItem", itemId: "wood_hard", count: 2 } },
      { id: "spar", description: "ประลองกับหลิวกระบองไหม้ที่ลานบ้านหยานจี",
        objective: { spots: [{ locationId: YJ, npcId: LIU, label: "รับกระบองเพลิงของหลิว", sceneId: `qd_${Q_FIRE}_spar` }] } },
      { id: "return", description: "กลับไปหาหลิวกระบองไหม้" },
    ],
    rewards: [{ t: "learnSkill", skillId: "fs" }, { t: "wExp", amount: 200 }, { t: "npcRelationship", npcId: LIU, amount: 10 }],
  },
  {
    id: Q_LETTER, type: "side", giverNpcId: CHUN,
    name: "จดหมายถึงแม่ที่ชีกู่",
    description: "ชุนเถาเก็บเงินได้ก้อนหนึ่ง อยากส่งไปให้แม่ที่หมู่บ้านชีกู่พร้อมจดหมาย แต่ไม่ไว้ใจคนส่งของ \"เพราะนายท่านเคยเป็นขโมยมาก่อน ข้าเลยรู้ทัน\"",
    briefSummary: "นำจดหมายและเงินของชุนเถาไปส่งที่หมู่บ้านชีกู่",
    stages: [
      { id: "deliver", description: "นำจดหมายของชุนเถาไปส่งให้แม่นางที่หมู่บ้านชีกู่",
        objective: { spots: [{ locationId: "village_qigu", label: "ส่งจดหมายให้แม่ของชุนเถา",
          text: "หญิงชรากอดจดหมายแนบอก แล้วฝากบอกลูกว่า \"อย่าลืมกินข้าว และอย่าพูดมากเกินไป\"" }] } },
      { id: "return", description: "กลับไปบอกชุนเถาที่บ้านหยานจี" },
    ],
    rewards: [{ t: "gold", amount: 80 }, { t: "item", itemId: "rice_dish", count: 1 }, { t: "trait", trait: "good", amount: 1 }, { t: "npcRelationship", npcId: CHUN, amount: 10 }],
  },

  // ═══ home_beichou ═════════════════════════════════════════════════
  {
    id: Q_SPEAR, type: "side", giverNpcId: BEI,
    name: "วิชาลึกลับกับปริศนาสามข้อ",
    description: "เป่ยฉิวจะสอนวิชาลึกลับให้คนที่ตอบปริศนาเขาได้และยืนรับทวนเขาได้ \"หน้าข้าน่าเกลียด แต่ทวนข้างามนัก\"",
    briefSummary: "ตอบปริศนาของเป่ยฉิว แล้วประลองทวนกับเขา",
    prereqs: { t: "and", all: [{ t: "statAtLeast", stat: "STR", min: 15 }, rel(BEI, 5)] },
    stages: [
      { id: "riddle", description: "ตอบปริศนาของเป่ยฉิวให้ถูก",
        objective: { spots: [{ locationId: BC, npcId: BEI, label: "ฟังปริศนาของเป่ยฉิว", sceneId: `qd_${Q_SPEAR}_riddle` }] } },
      { id: "spar", description: "ประลองทวนกับเป่ยฉิวหน้ากระท่อม",
        objective: { spots: [{ locationId: BC, npcId: BEI, label: "รับทวนของเป่ยฉิว", sceneId: `qd_${Q_SPEAR}_spar` }] } },
      { id: "return", description: "กลับไปหาเป่ยฉิวเพื่อเรียนทวนหมุนฟ้า" },
    ],
    rewards: [{ t: "learnSkill", skillId: "ne3" }, { t: "wExp", amount: 200 }, { t: "npcRelationship", npcId: BEI, amount: 10 }],
  },
  {
    id: Q_GOATS, type: "side", giverNpcId: CAO,
    name: "แพะหนีโจร",
    description: "โจรป่าสองคนไล่ยิงแพะของเสี่ยวเฉ่าเล่นจนแตกฝูงขึ้นไปบนผา นางขอให้ไล่โจรแล้วช่วยต้อนแพะกลับคอก",
    briefSummary: "ปราบโจรป่า 2 คน แล้วต้อนแพะกลับคอก",
    stages: [
      { id: "bandits", description: "ปราบโจรป่า 2 คนที่รังควานแพะของเสี่ยวเฉ่า", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 2 } },
      { id: "herd", description: "ต้อนแพะกลับคอกหลังบ้านเป่ยฉิว",
        objective: { spots: [{ locationId: BC, label: "ต้อนแพะกลับคอก",
          text: "แพะตัวผู้ขวิดก้นเจ้าทีหนึ่งก่อนยอมเดินเข้าคอก เป่ยฉิวยืนหัวเราะอยู่ไกล ๆ จนไอ" }] } },
      { id: "return", description: "กลับไปบอกเสี่ยวเฉ่า" },
    ],
    rewards: [{ t: "gold", amount: 90 }, { t: "item", itemId: "fur_pelt", count: 1 }, { t: "npcRelationship", npcId: CAO, amount: 10 }, { t: "npcRelationship", npcId: BEI, amount: 3 }],
  },
  {
    id: Q_PICTURE, type: "side", giverNpcId: AMU,
    name: "ภาพวาดของคนใบ้",
    description: "อาหมู่วาดถ่านบนแผ่นไม้ให้ดู: กระดาษ หมึก และรูปชายหน้าไหม้ เขาอยากเล่าเรื่องหนึ่งให้เจ้านายฟังมานานแล้ว แต่ไม่มีกระดาษดี ๆ จะวาด",
    briefSummary: "หากระดาษสา 2 แผ่นกับหมึก 1 ก้อนให้อาหมู่ แล้วนำภาพไปให้เป่ยฉิวดู",
    stages: [
      { id: "paper", description: "หากระดาษสา 2 แผ่นและหมึกเข้ม 1 ก้อนให้อาหมู่",
        autoAdvance: { t: "and", all: [{ t: "hasItem", itemId: "paper", count: 2 }, { t: "hasItem", itemId: "ink", count: 1 }] } },
      { id: "show", description: "นำภาพวาดของอาหมู่ไปให้เป่ยฉิวดู",
        objective: { spots: [{ locationId: BC, npcId: BEI, label: "ยื่นภาพวาดของอาหมู่ให้เป่ยฉิว",
          text: "ภาพคือค่ายทหารที่ลุกเป็นไฟ และเด็กหนุ่มคนหนึ่งลากแม่ทัพหน้าไหม้ออกมา — เป่ยฉิวเงียบไปนาน \"...ที่แท้เป็นเจ้า\"" }] } },
      { id: "return", description: "กลับไปหาอาหมู่" },
    ],
    rewards: [{ t: "gold", amount: 90 }, { t: "item", itemId: "rice_dish", count: 2 }, { t: "npcRelationship", npcId: AMU, amount: 12 }, { t: "npcRelationship", npcId: BEI, amount: 5 }],
  },

  // ═══ villa_meizhuang ══════════════════════════════════════════════
  {
    id: Q_GUANGLING, type: "side", giverNpcId: HUANG,
    name: "เพลงพิณที่หายสาบสูญ",
    description: "หวงจงกงตามหาโน้ตเพลงโบราณมาครึ่งชีวิต ใครนำตำราเพลงขั้นกลางมาให้และฟังพิณของเขาจบโดยไม่ล้ม เขาจะสอนวิชาลึกลับให้",
    briefSummary: "นำตำราเพลงขั้นกลางมาให้หวงจงกง แล้วประลองกับเสียงพิณของเขา",
    prereqs: { t: "and", all: [{ t: "statAtLeast", stat: "POW", min: 15 }, rel(HUANG, 5)] },
    stages: [
      { id: "score", description: "หาตำราเพลงขั้นกลาง 1 เล่มให้หวงจงกง", autoAdvance: { t: "hasItem", itemId: "song_inter", count: 1 } },
      { id: "spar", description: "ประลองกับเสียงพิณเจ็ดสายของหวงจงกง",
        objective: { spots: [{ locationId: MZ, npcId: HUANG, label: "ฟังพิณเจ็ดสายไร้รูป", sceneId: `qd_${Q_GUANGLING}_spar` }] } },
      { id: "return", description: "กลับไปหาหวงจงกงเพื่อเรียนคีตาอาคม" },
    ],
    rewards: [{ t: "learnSkill", skillId: "sa" }, { t: "wExp", amount: 200 }, { t: "npcRelationship", npcId: HUANG, amount: 10 }],
  },
  {
    id: Q_GO, type: "side", giverNpcId: HEIBAI,
    name: "ตำราหมากของเฮยไป๋จื่อ",
    description: "เฮยไป๋จื่อเล่นหมากกับตัวเองมาสามปีจนเบื่อ เขาอยากได้ตำราขั้นกลางเล่มหนึ่งไว้ศึกษา และคู่เล่นที่ไม่หนีกลางกระดาน",
    briefSummary: "นำตำราขั้นกลางมาให้เฮยไป๋จื่อ แล้วเดินหมากกับเขาหนึ่งกระดาน",
    stages: [
      { id: "book", description: "หาตำราขั้นกลาง 1 เล่มให้เฮยไป๋จื่อ", autoAdvance: { t: "hasItem", itemId: "book_inter", count: 1 } },
      { id: "game", description: "เดินหมากกับเฮยไป๋จื่อในศาลาริมสระ",
        objective: { hours: 3, spots: [{ locationId: MZ, npcId: HEIBAI, label: "เดินหมากกับเฮยไป๋จื่อ",
          text: "สามชั่วยามผ่านไป เจ้าแพ้ยี่สิบเจ็ดเม็ด เฮยไป๋จื่อยิ้มเป็นครั้งแรก \"เจ้าแพ้อย่างมีมารยาท หาได้ยากนัก\"" }] } },
      { id: "return", description: "กลับไปหาเฮยไป๋จื่อ" },
    ],
    rewards: [{ t: "gold", amount: 150 }, { t: "wExp", amount: 40 }, { t: "npcRelationship", npcId: HEIBAI, amount: 10 }],
  },
  {
    id: Q_FINGER, type: "side", giverNpcId: HEIBAI,
    name: "คุกใต้ทะเลสาบ",
    description: "เฮยไป๋จื่อขอให้เจ้าลงไปส่งยาให้ \"แขกชรา\" ที่ถูกขังใต้ทะเลสาบหลังคฤหาสน์ เขาไม่ยอมบอกว่าแขกผู้นั้นคือใคร และทำไมมือเขาจึงสั่น",
    briefSummary: "ลงไปยังคุกใต้ทะเลสาบแทนเฮยไป๋จื่อ — แล้วค้นหาว่าเขาซ่อนอะไรไว้",
    prereqs: { t: "and", all: [{ t: "statAtLeast", stat: "INT", min: 25 }, rel(HEIBAI, 15), { t: "questStatus", questId: Q_GO, status: "done" }] },
    stages: [
      { id: "cell", description: "ลงไปยังคุกใต้ทะเลสาบหลังคฤหาสน์ดงดอกท้อ",
        objective: { spots: [{ locationId: MZ, label: "ลงบันไดสู่คุกใต้ทะเลสาบ", sceneId: `qd_${Q_FINGER}_cell` }] } },
      { id: "envoy", description: "เผชิญหน้ากับทูตเงาที่ซุ่มอยู่ในดงเหมย",
        objective: { spots: [{ locationId: MZ, label: "ตามเงาในดงเหมย", sceneId: `qd_${Q_FINGER}_envoy` }] } },
      { id: "lotus", description: "หาบัวหิมะ 1 ดอกมาถอนพิษฝ่ามือดำให้เฮยไป๋จื่อ", autoAdvance: { t: "hasItem", itemId: "snow_lotus", count: 1 } },
      { id: "return", description: "กลับไปหาเฮยไป๋จื่อพร้อมบัวหิมะ" },
    ],
    rewards: [{ t: "learnSkill", skillId: "yyz" }, { t: "wExp", amount: 320 }, { t: "item", itemId: "jade", count: 1 }, { t: "npcRelationship", npcId: HEIBAI, amount: 10 }, { t: "trait", trait: "good", amount: 2 }],
  },
  {
    id: Q_PAINT, type: "side", giverNpcId: DANQING,
    name: "ภาพเหมือนของคนเมา",
    description: "ตันชิงเซิงประกาศว่าจะวาด \"จอมยุทธผู้มาเยือนใต้ต้นเหมย\" แต่หมึกหมดเพราะเขาเผลอเทลงไปในไหสุรา",
    briefSummary: "หาหมึกเข้ม 2 ก้อนให้ตันชิงเซิง แล้วนั่งเป็นแบบให้เขาวาด",
    stages: [
      { id: "ink", description: "หาหมึกเข้ม 2 ก้อนให้ตันชิงเซิง", autoAdvance: { t: "hasItem", itemId: "ink", count: 2 } },
      { id: "pose", description: "นั่งเป็นแบบใต้ต้นเหมยให้ตันชิงเซิงวาด",
        objective: { hours: 3, spots: [{ locationId: MZ, label: "นั่งเป็นแบบใต้ต้นเหมย",
          text: "ตันชิงเซิงวาดไปดื่มไป พอเสร็จภาพ เจ้าในภาพหล่อกว่าตัวจริงสามเท่า และถือจอกสุราที่เจ้าไม่เคยถือ" }] } },
      { id: "return", description: "กลับไปรับภาพจากตันชิงเซิง" },
    ],
    rewards: [{ t: "gold", amount: 120 }, { t: "item", itemId: "image_basic", count: 1 }, { t: "npcRelationship", npcId: DANQING, amount: 10 }],
  },

  // ═══ villa_fuwei ══════════════════════════════════════════════════
  {
    id: Q_WHIP, type: "side", giverNpcId: PING,
    name: "แส้ม้าของคุณชายหลิน",
    description: "สุนัขล่าเนื้อของหลินผิงจือหิวโซ เขาขี้เกียจไปตลาดเอง จึงขอเนื้อสด 2 ชิ้น แลกกับเคล็ดลับแส้ม้าที่ \"ปัดแมลงวันบนหูม้าโดยม้าไม่สะดุ้ง\"",
    briefSummary: "นำเนื้อสด 2 ชิ้นมาให้หลินผิงจือ",
    stages: [
      { id: "meat", description: "หาเนื้อสด 2 ชิ้นให้หลินผิงจือ", autoAdvance: { t: "hasItem", itemId: "raw_meat", count: 2 } },
      { id: "return", description: "นำเนื้อไปให้หลินผิงจือที่สำนักคุ้มกันฝูเวย" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nc8" }, { t: "gold", amount: 80 }, { t: "npcRelationship", npcId: PING, amount: 8 }],
  },
  {
    id: Q_HORSE, type: "side", giverNpcId: LINZ,
    name: "วิชาลึกลับแห่งฝูเวย",
    description: "โจรเส้นทางดักปล้นเกวียนของฝูเวยถึงสามครั้งในเดือนนี้ หลินเจิ้นหนานขอให้ไปกวาดล้าง แลกกับลมปราณที่ปู่ของเขาฝึกบนหลังม้าขาวตลอดเส้นทางคุ้มกัน",
    briefSummary: "ปราบโจรเส้นทาง 3 คน แล้วปักธงสิงห์คืนหน้าประตูสำนัก",
    prereqs: { t: "statAtLeast", stat: "POW", min: 10 },
    stages: [
      { id: "bandits", description: "ปราบโจรเส้นทาง 3 คนที่ดักปล้นเกวียนฝูเวย", autoAdvance: { t: "defeatedOpponent", opponentId: "road_bandit", count: 3 } },
      { id: "banner", description: "ปักธงสิงห์ของฝูเวยคืนหน้าประตูสำนัก",
        objective: { spots: [{ locationId: FW, label: "ปักธงสิงห์หน้าประตู",
          text: "ธงสิงห์สะบัดเหนือประตูอีกครั้ง คนคุ้มกันโห่ร้อง หลินผิงจือตะโกนว่าเขาก็ช่วย (เขาถือเชือกปลายเดียว)" }] } },
      { id: "return", description: "กลับไปหาหลินเจิ้นหนาน" },
    ],
    rewards: [{ t: "learnArt", artId: "t1_whitehorse", level: 1 }, { t: "wExp", amount: 100 }, { t: "gold", amount: 200 }, { t: "npcRelationship", npcId: LINZ, amount: 10 }],
  },
  {
    id: Q_ESCORT, type: "side", giverNpcId: SHI,
    name: "หีบผ้าไปหยางโจว",
    description: "สื่อเปียวโถวขาดคนคุ้มกันหนึ่งคน เขาขอให้เจ้าช่วยส่งหีบผ้าไหมไปร้านในเมืองหยางโจว และไล่โจรที่ตามมาตอนขากลับ",
    briefSummary: "ส่งหีบผ้าที่หยางโจว แล้วปราบโจรป่า 2 คนระหว่างทางกลับ",
    stages: [
      { id: "deliver", description: "ส่งหีบผ้าให้ร้านผ้าในเมืองหยางโจว",
        objective: { spots: [{ locationId: "city_yangzhou", label: "ส่งหีบผ้าของฝูเวย",
          text: "เถ้าแก่ร้านผ้าเปิดหีบตรวจนับ ครบทุกพับ เขาประทับตราใบรับให้พร้อมชาหนึ่งถ้วย" }] } },
      { id: "bandits", description: "ปราบโจรป่า 2 คนที่ตามมาระหว่างทางกลับ", autoAdvance: { t: "defeatedOpponent", opponentId: "bandit", count: 2 } },
      { id: "return", description: "กลับไปรายงานสื่อเปียวโถว" },
    ],
    rewards: [{ t: "gold", amount: 150 }, { t: "wExp", amount: 50 }, { t: "npcRelationship", npcId: SHI, amount: 10 }],
  },
  {
    id: Q_DRAGON, type: "side", giverNpcId: SHI,
    name: "วิชาลึกลับกับรอยเลือดในคอกม้า",
    description: "เช้านี้ม้าในคอกตายไปสามตัว ไม่มีบาดแผลนอก สื่อเปียวโถวหน้าเครียดเป็นครั้งแรก เขาว่าถ้าเจ้าช่วยสืบเรื่องนี้ได้ เขาจะสอนทวนที่เขาไม่เคยใช้ต่อหน้าใคร",
    briefSummary: "สืบความตายในคอกม้า เผชิญศัตรูที่จ้องสำนักฝูเวย และหาไม้ศักดิ์สิทธิ์มาทำด้ามทวน",
    prereqs: { t: "and", all: [{ t: "statAtLeast", stat: "STR", min: 25 }, rel(SHI, 15), { t: "questStatus", questId: Q_ESCORT, status: "done" }] },
    stages: [
      { id: "stable", description: "สืบรอยเลือดในคอกม้าของสำนักคุ้มกันฝูเวย",
        objective: { spots: [{ locationId: FW, label: "สืบรอยในคอกม้า",
          text: "ม้าทุกตัวหัวใจแหลก แต่ผิวหนังไม่ช้ำ — ฝ่ามือทำลายใจของสำนักชิงเฉิง ข้างรางหญ้ามีรอยเท้าคนใส่รองเท้าฟาง" }] } },
      { id: "luo", description: "เผชิญหน้ากับคนของสำนักชิงเฉิงที่ซุ่มอยู่หลังกำแพงฝูเวย",
        objective: { spots: [{ locationId: FW, label: "ตามรอยเท้าหลังกำแพง", sceneId: `qd_${Q_DRAGON}_luo` }] } },
      { id: "shaft", description: "หาไม้ศักดิ์สิทธิ์ 1 ท่อนมาทำด้ามทวนใหม่ให้สื่อเปียวโถว", autoAdvance: { t: "hasItem", itemId: "wood_sacred", count: 1 } },
      { id: "return", description: "กลับไปหาสื่อเปียวโถวพร้อมไม้ศักดิ์สิทธิ์" },
    ],
    rewards: [{ t: "learnSkill", skillId: "nf3" }, { t: "wExp", amount: 320 }, { t: "item", itemId: "warrior_belt", count: 1 }, { t: "npcRelationship", npcId: SHI, amount: 10 }, { t: "trait", trait: "fame", amount: 2 }],
  },
];

// ─── Dialogs ──────────────────────────────────────────────────────────
const scenes: DialogScene[] = [
  // ═══ home_chengying ═══════════════════════════════════════════════
  dialog(`npc_${CHENG}_talk`, [
    tell("หญิงสาวชุดเขียวอ่อนวางสะดึงปักผ้าลง เสียงขลุ่ยที่ค้างอยู่ในอากาศค่อย ๆ จางไป"),
    say(CHENG_N, "แขกมาถึงบ้านป่าเช่นนี้ คงเดินมาไกล นั่งพักก่อนเถิด ข้าจะชงชาให้"),
    say(CHENG_N, "อาจารย์ของข้าอยู่บนเกาะดอกท้อ ท่านไม่ชอบคน ข้าจึงชอบแทนท่านบ้าง"),
    say(CHENG_N, "ถ้ามีธุระก็ว่ามา ถ้าไม่มี... ฟังขลุ่ยสักเพลงก็ได้"),
  ], [
    { text: "ขลุ่ยหยกเลานั้นงามนัก", next: `npc_${CHENG}_flute` },
    { text: "ได้ยินข่าวลืออะไรมาบ้าง", next: `npc_${CHENG}_rumor` },
    { text: "ลาก่อน", next: CY },
  ]),
  dialog(`npc_${CHENG}_flute`, [
    say(CHENG_N, "อาจารย์ให้ข้าไว้ตอนออกจากเกาะ ท่านบอกว่า \"เป่าเพลงให้คนที่ควรฟัง\""),
    tell("นางเงียบไปครู่หนึ่ง มองไปทางถ้ำทิศตะวันตก"),
    say(CHENG_N, "บางเพลงข้าก็ยังเป่าไม่จบ... ไม่ใช่เพราะลืมโน้ต"),
    say(CHENG_N, "ถ้าเจ้ามีพลังปราณพอ ข้ามีท่าพัดที่อยากถ่ายทอด พัดนกยูงที่ข้าปักยังไม่เสร็จเลย"),
  ]),
  dialog(`npc_${CHENG}_rumor`, [
    say(CHENG_N, "มีคนเดินผ่านมาเล่าว่า ชายแขนเดียวกับนกอินทรียักษ์ผ่านทางนี้เมื่อเดือนก่อน"),
    say(CHENG_N, "ข้าไม่ได้ออกไปดูหรอก... ข้ากำลังปักผ้าอยู่"),
    tell("นิ้วของนางสั่นจนเข็มแทงพลาดไปหนึ่งฝีเข็ม"),
  ]),
  dialog(`npc_${LU}_talk`, [
    tell("หญิงสาวขากะเผลกเดินวนรอบลาน ดาบสั้นเหน็บเอว สายตาคมกริบ"),
    say(LU_N, "จ้องขาข้าทำไม? ถ้าจะสงสารก็เอาไปทิ้งในลำธารซะ"),
    say(LU_N, "ข้าเคยเป็นศิษย์ของหลี่โม่โฉว นางสอนข้าสองอย่าง คือดาบกับการไม่ร้องไห้"),
    say(LU_N, "พี่เฉิงใจดีเกินไป ใครมาบ้านนี้ ข้าต้องดูก่อนว่าคนดีหรือคนเลว"),
  ], [
    { text: "ข้าไม่ได้สงสาร ข้าแค่ชมว่าเจ้าเดินเร็ว", next: `npc_${LU}_praise` },
    { text: "มีอะไรให้ช่วยไหม", next: `npc_${LU}_hook` },
    { text: "ขอตัวก่อน", next: CY },
  ]),
  dialog(`npc_${LU}_praise`, [
    say(LU_N, "...เจ้าพูดจาแปลก แต่ข้าไม่เกลียด"),
    say(LU_N, "ข้าฝึกเดินเร็วเพื่อไล่ตามพวกที่ล้อข้า แล้วฟันกางเกงมันขาด"),
  ]),
  dialog(`npc_${LU}_hook`, [
    say(LU_N, "มีพวกอันธพาลเดินแถวตลาดชอบเลียนท่าเดินข้า หัวเราะกันใหญ่"),
    say(LU_N, "ข้าไปเองไม่ได้ พี่เฉิงจะรู้ แล้วนางจะทำหน้าเศร้า ข้าทนหน้าเศร้าของนางไม่ได้"),
    say(LU_N, "ถ้าเจ้ามีปราณพอจะถือดาบน้ำค้างของข้า มาคุยกันอีกที"),
  ]),
  dialog(`npc_${TONG}_talk`, [
    tell("เด็กชายผอมกะหร่องถือไม้เรียวต้อนห่าน ห่านตัวหนึ่งกำลังจิกน่องเขาอยู่"),
    say(TONG_N, "โอ๊ย! พี่ช่วยด้วย... ไม่ใช่ ๆ ข้าคุมมันได้ ข้าคุมได้!"),
    say(TONG_N, "คุณหนูเฉิงเก็บข้ามาจากข้างทางตอนหิมะตก ข้าเลยต้องดูแลห่านให้ดีที่สุด"),
    say(TONG_N, "แต่ห่านไม่รู้เรื่องบุญคุณ มันรู้แต่เรื่องข้าวเปลือก"),
  ], [
    { text: "ห่านพวกนี้ดุจริง", next: `npc_${TONG}_geese` },
    { text: "ลาก่อนเจ้าหนู", next: CY },
  ]),
  dialog(`npc_${TONG}_geese`, [
    say(TONG_N, "ตัวที่ดุที่สุดชื่อแม่ทัพ ตัวที่ขี้เกียจที่สุดชื่อพี่ลู่... อย่าบอกพี่ลู่นะ"),
    say(TONG_N, "ถ้าพี่มีขนมไหว้พระจันทร์ ข้าจะเล่าความลับให้ฟังเรื่องหนึ่ง"),
  ]),
  offer(Q_PEACOCK, CY, [
    say(CHENG_N, "พัดผืนนี้ข้าปักมาสามเดือน เหลือแค่หางนกยูงอีกเจ็ดขน แต่ไหมกับด้ายหมดพอดี"),
    say(CHENG_N, "ตอนอยู่บนเกาะ ข้าดูนกยูงของอาจารย์รำแพนทุกเช้า มันกางหางทีไร ตาข้าพร่าทุกที"),
    say(CHENG_N, "ข้าเลยคิดท่าพัดขึ้นมาท่าหนึ่ง สะบัดให้ศัตรูตาลายเหมือนเห็นหางนกยูง"),
    say(CHENG_N, "ถ้าเจ้าหาผ้าไหมสองผืนกับด้ายสามม้วนมาให้ได้ พัดเสร็จเมื่อไร ข้าจะสอนท่านี้ให้"),
  ], "ข้าจะหามาให้", "ไว้คราวหน้า"),
  complete(Q_PEACOCK, CY, [
    tell("เฉิงอิ๋งปักขนนกยูงขนสุดท้ายเสร็จ พัดสีรุ้งกางออกในมือนาง"),
    say(CHENG_N, "จำไว้ พัดนกยูงไม่ได้ทำร้ายใคร มันแค่ทำให้ศัตรูมองไม่เห็นทางร้ายของตัวเอง"),
    say(CHENG_N, "สะบัดข้อมือ ไม่ใช่สะบัดแขน... ใช่ อย่างนั้นแหละ"),
    say(CHENG_N, "ขอบใจที่มาเป็นแขกนะ บ้านนี้ไม่ค่อยมีใครมาหัวเราะด้วย"),
  ], "รับวิชาพัดนกยูง"),
  offer(Q_DEW, CY, [
    say(LU_N, "ฟังให้ดี ข้าจะพูดครั้งเดียว"),
    say(LU_N, "มีโจรเร่ร่อนสามคนที่ชอบเดินกะเผลกล้อข้าตามทาง ไปสั่งสอนพวกมันให้หน่อย"),
    say(LU_N, "อย่าฆ่า แค่ให้มันเดินกะเผลกจริง ๆ สักเดือนก็พอ"),
    say(LU_N, "เสร็จแล้วตื่นแต่เช้ามาฝึกที่ลาน ข้าจะสอนดาบน้ำค้าง ดาบที่ข้าฝึกตอนหนีอาจารย์ ทุกเช้าข้าไม่มีอะไรนอกจากน้ำค้างกับใบไผ่"),
  ], "รับปาก จะสั่งสอนให้", "ข้าไม่อยากมีเรื่อง"),
  complete(Q_DEW, CY, [
    say(LU_N, "ได้ยินว่าพวกมันเดินกะเผลกกันทั้งสามคนแล้ว ฮ่า ๆ ๆ"),
    tell("นางหัวเราะจนต้องเกาะเสาไว้ เป็นครั้งแรกที่เจ้าเห็นนางหัวเราะ"),
    say(LU_N, "ดาบน้ำค้างใช้ปราณนำ ไม่ใช่แรง ฟันให้เกราะมันแตกจากข้างใน"),
    say(LU_N, "...ขอบใจ อย่าบอกพี่เฉิงนะ"),
  ], "รับวิชาดาบน้ำค้าง"),
  offer(Q_GEESE, CY, [
    say(TONG_N, "พี่... ข้าหลับไปแป๊บเดียว จริง ๆ แค่แป๊บเดียว"),
    say(TONG_N, "ตื่นมาห่านเหลือสามตัว อีกห้าตัวหายไปไหนไม่รู้"),
    say(TONG_N, "คุณหนูไม่ดุหรอก แต่นางจะยิ้มแล้วบอกว่าไม่เป็นไร... นั่นแหละที่ข้ากลัวที่สุด"),
  ], "ช่วยตามหาห่าน", "ข้ากลัวห่าน"),
  complete(Q_GEESE, CY, [
    say(TONG_N, "ครบ! ครบแปดตัว แถมมีไข่ด้วย!"),
    say(TONG_N, "พี่เอาขนมไหว้พระจันทร์ชิ้นนี้ไป ข้าเก็บไว้กินวันเกิด... ไม่เป็นไร ข้าเกิดใหม่ปีหน้าได้"),
  ], "รับขนมแล้วลูบหัวอาถง"),

  // ═══ home_yanji ═══════════════════════════════════════════════════
  dialog(`npc_${YAN}_talk`, [
    tell("ชายวัยกลางคนในชุดผ้าไหมราคาแพงยิ้มกว้าง นิ้วมือเรียวยาวเกินกว่าจะเป็นมือหมอ"),
    say(YAN_N, "อ้า ยินดีต้อนรับ ปวดหลัง? เคล็ดขัดยอก? กระดูกเคลื่อน? หยานจีรักษาได้หมด ราคากันเอง"),
    say(YAN_N, "เรื่องเก่าข้าน่ะหรือ... ใครเล่าว่าข้าเคยเป็นขโมย? ข้าแค่ \"ยืมของถาวร\" เท่านั้น"),
    say(YAN_N, "เดี๋ยวนี้ข้ากลับใจแล้ว ครึ่งหนึ่ง อีกครึ่งยังคิดอยู่"),
  ], [
    { text: "เจ้าเคยขโมยอะไรมาบ้าง", next: `npc_${YAN}_past` },
    { text: "มีงานอะไรไหม", next: `npc_${YAN}_hook` },
    { text: "ลาก่อน", next: YJ },
  ]),
  dialog(`npc_${YAN}_past`, [
    say(YAN_N, "ชู่ว! เบา ๆ หน่อย"),
    say(YAN_N, "สมัยหนุ่มข้าขโมยหน้ากระดาษตำราดาบตระกูลหูมาสองแผ่น ฝึกจนตาย... เอ้ย ฝึกไม่สำเร็จ"),
    say(YAN_N, "เลยหันมาจับกระดูกแทน อย่างน้อยกระดูกไม่ไล่ฆ่าข้า"),
  ]),
  dialog(`npc_${YAN}_hook`, [
    say(YAN_N, "สมุนไพรในตู้หมดเกลี้ยง คนไข้ก็มากันไม่หยุด"),
    say(YAN_N, "ช่วยข้าหน่อยสิ แลกกับเคล็ดลับปาเข็มของข้า แม่นจนแมลงวันยังหลบไม่ทัน"),
  ]),
  dialog(`npc_${LIU}_talk`, [
    tell("ชายร่างหนาเดินตรวจรอบบ้าน กระบองดำไหม้พาดบ่า กลิ่นสุราจาง ๆ ลอยตาม"),
    say(LIU_N, "หยุด! ...อ้อ แขก เชิญ ๆ"),
    say(LIU_N, "ข้าเคยอยู่พรรคกระยาจกนอกกำแพง วันหนึ่งเมาแล้วไปเตะชามข้าวท่านผู้อาวุโส เลยได้ออกมาเดินเตะฝุ่นแทน"),
    say(LIU_N, "หมอหยานจ้างข้าเฝ้าบ้าน เงินดี แต่บ้านนี้ไม่เคยมีโจรมาเลย... คงเพราะโจรเก่งที่สุดอยู่ในบ้านแล้ว"),
  ], [
    { text: "ทำไมกระบองเจ้าไหม้ดำ", next: `npc_${LIU}_staff` },
    { text: "ขอตัวก่อน", next: YJ },
  ]),
  dialog(`npc_${LIU}_staff`, [
    say(LIU_N, "ข้าฝึกข้างกองไฟทุกคืน ฟาดถ่านแดงจนกระบองติดไฟ แล้วก็ฟาดต่อ"),
    say(LIU_N, "เพื่อนในพรรคเรียกมันว่ากระบองเพลิง ข้าเรียกว่ากระบองที่ลืมดับ"),
    say(LIU_N, "ถ้าเจ้าแข็งแรงพอและเราสนิทกันกว่านี้ ข้าอาจสอนให้ เอาเนื้อย่างมาฝากบ้างก็ดี"),
  ]),
  dialog(`npc_${CHUN}_talk`, [
    tell("สาวใช้ตัวเล็กถือไม้กวาดแต่ไม่ได้กวาด สายตาวาวเมื่อเห็นคนใหม่"),
    say(CHUN_N, "พี่มาจากไหน? มาหานายท่านเหรอ? ระวังกระเป๋าเงินด้วยนะ ล้อเล่น... ครึ่งหนึ่ง"),
    say(CHUN_N, "รู้ไหม พี่หลิวแอบเลี้ยงแมวไว้ใต้ถุน นายท่านแอบนับเงินตอนตีสาม"),
    say(CHUN_N, "ส่วนข้า ข้าแอบคิดถึงแม่ที่ชีกู่"),
  ], [
    { text: "เล่าความลับอีกสิ", next: `npc_${CHUN}_gossip` },
    { text: "ไว้คุยกันใหม่", next: YJ },
  ]),
  dialog(`npc_${CHUN}_gossip`, [
    say(CHUN_N, "มีคนจากเขาเสวี่ยซานมาถามหานายท่านเมื่อเดือนก่อน นายท่านหลบอยู่ในตู้ยาครึ่งวัน"),
    say(CHUN_N, "ข้าว่านายท่านติดหนี้ใครสักคน หนี้เก่ามาก ๆ"),
  ]),
  offer(Q_NEEDLE, YJ, [
    say(YAN_N, "ข้อเสนอดี ๆ ฟังนะ"),
    say(YAN_N, "เอาสมุนไพรหายากมาให้ข้าสามต้น ข้าสอนเข็มทองให้หนึ่งวิชา"),
    say(YAN_N, "เข็มชุดนี้แต่ก่อนข้าใช้ปาหมาเฝ้าบ้านเศรษฐีให้หลับ ตอนนี้ใช้ปักจุดคนไข้ให้หาย ของอย่างเดียวกันแท้ ๆ"),
    say(YAN_N, "ดีลนี้ข้าขาดทุนนะ แต่เห็นแก่หน้าเจ้า"),
  ], "ตกลง", "ข้าว่าเจ้าไม่ขาดทุนหรอก"),
  complete(Q_NEEDLE, YJ, [
    say(YAN_N, "สมุนไพรเกรดดี! ใบไม่ช้ำ รากครบ เจ้ามีแววเป็นขโมย... เอ้ย นักเก็บสมุนไพร"),
    tell("หยานจีหยิบเข็มทองสามเล่มขึ้นมาหมุนระหว่างนิ้วจนเป็นประกาย"),
    say(YAN_N, "จับที่โคน ส่งด้วยข้อมือ อย่าส่งด้วยใจ ใจเรามันโลภ ปาเลยเป้าทุกที"),
    say(YAN_N, "เอาเงินไปด้วย ...ไม่ต้องนับ ข้านับให้แล้ว"),
  ], "รับวิชาเข็มทอง"),
  offer(Q_FIRE, YJ, [
    say(LIU_N, "เมื่อคืนข้าฟาดกระบองใส่หินกลางกองไฟ มันหักเปรี้ยงเป็นสองท่อน"),
    say(LIU_N, "ข้าร้องไห้ครึ่งคืน อย่าบอกใคร"),
    say(LIU_N, "หาไม้เนื้อแข็งมาให้ข้าสองท่อน ข้าจะเหลาอันใหม่ แล้วเรามาลองกันสักยก"),
    say(LIU_N, "ถ้าเจ้ารับกระบองเพลิงข้าได้ ข้าจะสอนวิธีให้กระบองมันร้อนจนเกราะศัตรูละลาย... ในเชิงเปรียบเทียบนะ"),
  ], "ข้าจะหาไม้มาให้", "ข้ายังไม่พร้อม"),
  dialog(`qd_${Q_FIRE}_spar`, [
    tell("หลิวเหลากระบองใหม่เสร็จ แล้วจุ่มปลายลงในกองไฟจนควันขึ้น"),
    say(LIU_N, "ไม้ใหม่ ไฟใหม่ ข้อต่อใหม่ มาเลย!"),
  ], [
    { text: "รับกระบองเพลิง", next: YJ,
      effects: [{ t: "triggerBattle", opponentId: SPAR_LIU, onWin: `qd_${Q_FIRE}_won`, onLose: `qd_${Q_FIRE}_lost`, nonFatal: true }] },
    { text: "ขอเตรียมตัวก่อน", next: YJ },
  ]),
  dialog(`qd_${Q_FIRE}_won`, [
    say(LIU_N, "ฮ่า! เจ้ารับได้ทุกท่า แถมสวนกลับมาอีก"),
    say(LIU_N, "มานี่ ไปนั่งข้างกองไฟกัน ข้าจะสอนให้"),
  ], [{ text: "ตามหลิวไป", next: YJ, effects: [{ t: "advanceQuest", questId: Q_FIRE }] }]),
  dialog(`qd_${Q_FIRE}_lost`, [
    say(LIU_N, "ยังร้อนไม่พอ พักก่อนเถอะ ข้าจะรอ"),
  ]),
  complete(Q_FIRE, YJ, [
    tell("ข้างกองไฟ หลิวสาธิตการหมุนกระบองให้ลมพัดเปลวไฟเกาะปลายไม้"),
    say(LIU_N, "กระบองเพลิงไม่ได้ร้อนเพราะไฟ มันร้อนเพราะใจคนถือ"),
    say(LIU_N, "ฟาดให้ศัตรูเสียหลัก เกราะมันจะเปิดเอง"),
    say(LIU_N, "...และถ้าเจ้าเจอท่านผู้อาวุโสพรรคกระยาจก บอกท่านว่าหลิวเลิกเหล้าแล้ว ครึ่งหนึ่ง"),
  ], "รับวิชากระบองเพลิง"),
  offer(Q_LETTER, YJ, [
    say(CHUN_N, "พี่ ช่วยข้าหน่อยนะ"),
    say(CHUN_N, "ข้าเก็บเงินได้ก้อนหนึ่ง อยากส่งไปให้แม่ที่หมู่บ้านชีกู่ พร้อมจดหมาย"),
    say(CHUN_N, "จะฝากคนส่งของก็ไม่ไว้ใจ อยู่บ้านอดีตขโมยมานานเลยรู้ว่าคนเรามือไวแค่ไหน"),
    say(CHUN_N, "พี่หน้าซื่อดี ข้าไว้ใจพี่"),
  ], "รับจดหมายไปส่ง", "ข้าไม่ว่าง"),
  complete(Q_LETTER, YJ, [
    say(CHUN_N, "แม่สบายดีเหรอ! แม่ฝากบอกอะไรไหม?"),
    say(CHUN_N, "...อย่าพูดมากเกินไป? แม่พูดแบบนี้ทุกปีเลย"),
    say(CHUN_N, "เอาข้าวหมูแดงไปกิน ข้าแอบทำเผื่อไว้ อย่าบอกนายท่าน"),
  ], "ขอบใจชุนเถา"),

  // ═══ home_beichou ═════════════════════════════════════════════════
  dialog(`npc_${BEI}_talk`, [
    tell("ชายชราใบหน้าย่นยับด้วยรอยไฟไหม้นั่งพิงทวนยาว หัวเราะเสียงดังก่อนเจ้าจะทันพูด"),
    say(BEI_N, "ฮ่า ๆ ๆ! ตกใจหน้าข้าหรือ? ไม่เป็นไร ข้าก็ตกใจทุกครั้งที่ส่องน้ำ"),
    say(BEI_N, "คนทางใต้มีปราชญ์ ทางเหนือมีคนอัปลักษณ์ คือข้าเอง เป่ยฉิว"),
    say(BEI_N, "จะเข้าบ้านข้า ต้องตอบปริศนาก่อน... ล้อเล่น เข้ามาเถอะ แต่ห้ามแตะซาลาเปาของอาหมู่"),
  ], [
    { text: "ใบหน้าของท่านไปโดนอะไรมา", next: `npc_${BEI}_scar` },
    { text: "ขอฟังปริศนาสักข้อ", next: `npc_${BEI}_riddle_free` },
    { text: "ลาก่อน", next: BC },
  ]),
  dialog(`npc_${BEI}_scar`, [
    say(BEI_N, "สมัยเป็นแม่ทัพชายแดน ค่ายข้าโดนลอบเผากลางดึก"),
    say(BEI_N, "ข้าตื่นมาอยู่ข้างลำธาร ไม่รู้ว่าใครลากข้าออกมา หน้าก็เป็นแบบนี้แล้ว"),
    say(BEI_N, "ทวนเล่มนี้รอดมากับข้า ทวนที่หมุนจนลมกลายเป็นกำแพง ถ้าเจ้าแข็งแรงพอ และข้าชอบหน้าเจ้า... หน้าเจ้าดีกว่าข้าแน่"),
  ]),
  dialog(`npc_${BEI}_riddle_free`, [
    say(BEI_N, "อะไรเอ่ย ยิ่งยาวยิ่งสั้น?"),
    tell("เจ้าคิดอยู่นาน เป่ยฉิวหัวเราะจนน้ำตาไหล"),
    say(BEI_N, "ชีวิตคนไงเล่า! ฮ่า ๆ ไม่ต้องตอบ ปริศนาของจริงข้าเก็บไว้ให้คนที่จะเรียนทวน"),
  ]),
  dialog(`npc_${AMU}_talk`, [
    tell("ชายร่างใหญ่ยิ้มกว้าง โบกมือทักแล้วชี้ไปที่ลังนึ่งซาลาเปา"),
    tell("เขาหยิบถ่านวาดบนแผ่นไม้: รูปซาลาเปา ลูกศร และรูปหน้าเจ้า"),
    tell("...ดูเหมือนเขาจะถามว่าเจ้าหิวไหม"),
  ], [
    { text: "พยักหน้า แล้วรับซาลาเปา", next: `npc_${AMU}_bun` },
    { text: "ส่ายหน้าอย่างสุภาพ", next: BC },
  ]),
  dialog(`npc_${AMU}_bun`, [
    tell("ซาลาเปาร้อนนุ่ม ไส้หมูสับหอมขิง อาหมู่ยืนดูเจ้ากินด้วยความภูมิใจ"),
    tell("เขาวาดรูปใหม่: ชายหน้าไหม้ เปลวไฟ และเด็กหนุ่มคนหนึ่ง แล้วรีบลบทิ้งด้วยแขนเสื้อ"),
  ]),
  dialog(`npc_${CAO}_talk`, [
    tell("เด็กหญิงผมเปียสองข้างนั่งบนหิน มีลูกแพะนอนบนตัก"),
    say(CAO_N, "พี่ไม่ต้องกลัวลุงเป่ยนะ หน้าลุงน่ากลัวแต่ลุงเล่านิทานสนุกที่สุดในโลก"),
    say(CAO_N, "ลุงเล่าว่าเคยแทงทวนจนลมหมุนเป็นพายุ ข้าว่าลุงโม้ แต่ข้าชอบ"),
    say(CAO_N, "แพะของข้าชื่อซาลาเปา ตั้งตามของที่อาหมู่ทำ"),
  ], [
    { text: "แพะน่ารักดี", next: `npc_${CAO}_goat` },
    { text: "ลาก่อน", next: BC },
  ]),
  dialog(`npc_${CAO}_goat`, [
    say(CAO_N, "ใช่ไหม! แต่ช่วงนี้มีโจรมาไล่ยิงแพะเล่น ข้าโกรธมาก"),
    say(CAO_N, "ถ้าข้าโตเป็นจอมยุทธ ข้าจะเอาแพะขวิดพวกมัน"),
  ]),
  offer(Q_SPEAR, BC, [
    say(BEI_N, "อยากเรียนทวนหมุนฟ้าหรือ? ดี ดีมาก!"),
    say(BEI_N, "แต่ทวนของข้าไม่ใช่ของที่ให้คนโง่ คนโง่ถือทวนหมุนแล้วจะตีหัวตัวเอง"),
    say(BEI_N, "ข้อแรก ตอบปริศนาข้าให้ได้ ข้อสอง ยืนรับทวนข้าให้ได้"),
    say(BEI_N, "ผ่านทั้งสองข้อ ข้าจะสอนวิธีหมุนทวนจนศัตรูหาตัวเจ้าไม่เจอ"),
  ], "ข้าพร้อม", "ข้ากลัวตีหัวตัวเอง"),
  dialog(`qd_${Q_SPEAR}_riddle`, [
    say(BEI_N, "ฟังให้ดี!"),
    say(BEI_N, "อะไรเอ่ย ยิ่งเอาออกยิ่งใหญ่?"),
    tell("เป่ยฉิวยิ้มรอ ทวนในมือหมุนช้า ๆ"),
  ], [
    { text: "หลุม", next: `qd_${Q_SPEAR}_right`, effects: [{ t: "advanceQuest", questId: Q_SPEAR }] },
    { text: "ทองในกระเป๋า", next: `qd_${Q_SPEAR}_wrong` },
    { text: "หนวดของท่าน", next: `qd_${Q_SPEAR}_wrong` },
  ]),
  dialog(`qd_${Q_SPEAR}_right`, [
    say(BEI_N, "หลุม! ถูกต้อง! ฮ่า ๆ ๆ เจ้าไม่โง่"),
    say(BEI_N, "จำไว้ ทวนหมุนฟ้าก็เหมือนหลุม ยิ่งเจ้าหมุนออก ช่องว่างรอบตัวศัตรูยิ่งกว้าง"),
    say(BEI_N, "ข้อสองไม่ใช่ปริศนา มาประลองเมื่อพร้อม"),
  ]),
  dialog(`qd_${Q_SPEAR}_wrong`, [
    tell("เป่ยฉิวหัวเราะจนตกเก้าอี้"),
    say(BEI_N, "ผิด! ผิดมหันต์! กลับไปคิดใหม่ แล้วค่อยมาตอบ"),
  ]),
  dialog(`qd_${Q_SPEAR}_spar`, [
    tell("เป่ยฉิวลุกขึ้น ทวนยาวหมุนเป็นวงจนใบไม้รอบลานปลิวขึ้นฟ้า"),
    say(BEI_N, "อย่าห่วงหน้าข้า ห่วงหน้าเจ้าเถอะ!"),
  ], [
    { text: "รับทวนของเป่ยฉิว", next: BC,
      effects: [{ t: "triggerBattle", opponentId: SPAR_BEI, onWin: `qd_${Q_SPEAR}_won`, onLose: `qd_${Q_SPEAR}_lost`, nonFatal: true }] },
    { text: "ขอพักก่อน", next: BC },
  ]),
  dialog(`qd_${Q_SPEAR}_won`, [
    say(BEI_N, "ดี! ดีมาก! สิบปีแล้วไม่มีใครทำให้ข้าเหงื่อออก"),
    say(BEI_N, "มา ข้าจะสอนให้"),
  ], [{ text: "ตามเป่ยฉิวไป", next: BC, effects: [{ t: "advanceQuest", questId: Q_SPEAR }] }]),
  dialog(`qd_${Q_SPEAR}_lost`, [
    say(BEI_N, "ฮ่า ๆ ล้มเหมือนแพะเลย พักแล้วมาใหม่"),
  ]),
  complete(Q_SPEAR, BC, [
    tell("เป่ยฉิวจับมือเจ้าวางบนด้ามทวน หมุนช้า ๆ ให้รู้สึกถึงน้ำหนัก"),
    say(BEI_N, "มือหน้าเป็นแกน มือหลังเป็นลม หมุนจนศัตรูกะระยะไม่ได้"),
    say(BEI_N, "พอมันหลบผิดทาง ปลายทวนจะรออยู่ตรงนั้นพอดี"),
    say(BEI_N, "หน้าข้าน่าเกลียด แต่ทวนข้างาม ใช่ไหมล่ะ ฮ่า ๆ ๆ"),
  ], "รับวิชาทวนหมุนฟ้า"),
  offer(Q_GOATS, BC, [
    say(CAO_N, "พี่! พี่! มีโจรสองคนมายิงหนังสติ๊กใส่แพะข้า"),
    say(CAO_N, "แพะวิ่งแตกฝูงขึ้นไปบนผาหมดแล้ว ลุงเป่ยหลับอยู่ อาหมู่ก็กำลังนึ่งซาลาเปา"),
    say(CAO_N, "พี่ช่วยไล่โจรแล้วช่วยต้อนแพะให้ข้าได้ไหม? ข้าจะยกขนแพะที่ร่วงให้หมดเลย"),
  ], "ไปไล่โจรให้", "ข้าไม่ถนัดเรื่องแพะ"),
  complete(Q_GOATS, BC, [
    say(CAO_N, "ซาลาเปากลับมาแล้ว! ทุกตัวเลย!"),
    tell("เด็กหญิงกอดแพะทีละตัว แล้วยื่นหนังสัตว์ผืนหนึ่งให้เจ้าอย่างภูมิใจ"),
    say(CAO_N, "ลุงเป่ยฝากให้ ลุงบอกว่า \"คนที่ช่วยแพะ ต้องเป็นคนดี\""),
  ], "รับหนังสัตว์"),
  offer(Q_PICTURE, BC, [
    tell("อาหมู่ดึงแขนเจ้าไปที่มุมครัว แล้ววาดถ่านลงบนแผ่นไม้อย่างตั้งใจ"),
    tell("รูปกระดาษ รูปหมึก รูปชายหน้าไหม้ แล้วรูปตัวเขาเองชี้ไปที่ปากที่พูดไม่ได้"),
    tell("เขาอยากวาดเรื่องสำคัญเรื่องหนึ่งให้เป่ยฉิวดู แต่แผ่นไม้มันเล็กเกินไป"),
  ], "พยักหน้ารับ จะหากระดาษกับหมึกมาให้", "ส่ายหน้า"),
  complete(Q_PICTURE, BC, [
    tell("เป่ยฉิวเดินเข้ามาในครัว ไม่หัวเราะ ไม่พูด เขากอดอาหมู่แน่น"),
    say(BEI_N, "ยี่สิบปีที่ข้าตามหาคนที่ลากข้าออกจากกองไฟ ที่แท้เขานึ่งซาลาเปาให้ข้ากินทุกวัน"),
    tell("อาหมู่ยิ้มทั้งน้ำตา แล้วยัดซาลาเปาสองลูกใส่มือเจ้า"),
  ], "รับซาลาเปา"),

  // ═══ villa_meizhuang ══════════════════════════════════════════════
  dialog(`npc_${HUANG}_talk`, [
    tell("ชายชราผมขาวโพลนนั่งหน้าพิณเจ็ดสาย นิ้วแตะสายเบา ๆ เสียงก้องไปทั่วศาลา"),
    say(HUANG_N, "ข้าคือหวงจงกง พี่ใหญ่ของสี่สหายแห่งคฤหาสน์นี้"),
    say(HUANG_N, "น้องสองเล่นหมาก น้องสามเขียนพู่กัน น้องสี่วาดภาพกับดื่มเหล้า ส่วนข้า... ข้ามีแต่พิณ"),
    say(HUANG_N, "พวกเราถอนตัวจากยุทธภพมาอยู่ที่นี่ เพื่อเฝ้าสิ่งหนึ่ง แต่เรื่องนั้นไม่ใช่เรื่องที่แขกควรถาม"),
  ], [
    { text: "ขอฟังพิณสักเพลง", next: `npc_${HUANG}_song` },
    { text: "ท่านเฝ้าอะไรอยู่", next: `npc_${HUANG}_secret` },
    { text: "ขอตัว", next: MZ },
  ]),
  dialog(`npc_${HUANG}_song`, [
    tell("เสียงพิณพลิ้วดุจลมพัดผ่านดงเหมย เจ้ารู้สึกหนังตาหนักอึ้ง"),
    say(HUANG_N, "พอแล้ว ฟังต่ออีกสามบรรทัดเจ้าจะหลับไปถึงพรุ่งนี้"),
    say(HUANG_N, "เพลงที่ข้าอยากเล่นที่สุดคือเพลงที่ไม่มีใครมีโน้ตอีกแล้ว... ถ้าเจ้าเจอตำราเพลงเก่า ๆ ที่ไหน นึกถึงข้าด้วย"),
  ]),
  dialog(`npc_${HUANG}_secret`, [
    say(HUANG_N, "เจ้ากล้าถาม ข้าก็กล้าไม่ตอบ"),
    tell("เขาดีดสายเส้นต่ำสุดหนึ่งที เสียงหนักอึ้งราวประตูเหล็กปิดลง"),
  ]),
  dialog(`npc_${HEIBAI}_talk`, [
    tell("ชายผอมสูงผมดำครึ่งขาวครึ่งนั่งหน้ากระดานหมาก ไม่เงยหน้าขึ้นมอง"),
    say(HEIBAI_N, "ตาเดินของเจ้าบอกข้าว่าเจ้ากำลังจะถามว่าข้าเป็นใคร"),
    say(HEIBAI_N, "เฮยไป๋จื่อ ดำกับขาว เหมือนหมาก เหมือนคน"),
    say(HEIBAI_N, "ข้าเล่นกับตัวเองมาสามปี ชนะทุกครั้ง แพ้ทุกครั้ง น่าเบื่อทุกครั้ง"),
  ], [
    { text: "ทำไมมือท่านสั่น", next: `npc_${HEIBAI}_hands` },
    { text: "ขอตัวก่อน", next: MZ },
  ]),
  dialog(`npc_${HEIBAI}_hands`, [
    say(HEIBAI_N, "...เจ้าสังเกตเก่ง"),
    say(HEIBAI_N, "นิ้วของข้าฝึกดัชนีเดียวมาทั้งชีวิต วางหมากได้ทะลุกระดาน แต่บางคืนมันสั่นเพราะความคิด"),
    say(HEIBAI_N, "ความคิดที่ข้าไม่ควรคิด เกี่ยวกับใครบางคนใต้ทะเลสาบ"),
  ]),
  dialog(`npc_${DANQING}_talk`, [
    tell("ชายหน้าแดงก่ำเดินโซเซเข้ามา จอกในมือหนึ่ง พู่กันในอีกมือ"),
    say(DANQING_N, "อ้า! หน้าตาเจ้าน่าวาดนัก! จมูกได้รูป คิ้วมีพลัง ส่วนหูนั่น... เอาไว้ก่อน"),
    say(DANQING_N, "ข้าคือตันชิงเซิง หนึ่งวันข้าวาดสามภาพ ดื่มสามไห ไม่เคยผิดสัญญากับตัวเอง"),
    say(DANQING_N, "สุราดีทำให้ภาพมีชีวิต ภาพดีทำให้สุรามีรสชาติ เจ้าเข้าใจไหม? ไม่เข้าใจก็ดื่มก่อน"),
  ], [
    { text: "ดื่มด้วยหนึ่งจอก", next: `npc_${DANQING}_drink` },
    { text: "ขอตัวก่อน", next: MZ },
  ]),
  dialog(`npc_${DANQING}_drink`, [
    tell("สุรารสหวานติดลิ้น กลิ่นองุ่นจากแดนตะวันตก"),
    say(DANQING_N, "ดี! คนที่ดื่มไม่ทำหน้าบูดคือคนที่ข้าวาดได้"),
    say(DANQING_N, "พี่สามกำลังเขียนพู่กันอยู่ในห้องหนังสือ อย่าไปกวนเขานะ เขาจะเขียนชื่อเจ้าลงกำแพงแล้วด่าทุกเช้า"),
  ]),
  dialog(`npc_${DING}_talk`, [
    tell("ชายวัยกลางคนในชุดพ่อบ้านยืนตัวตรงขวางประตูอย่างสุภาพ"),
    say(DING_N, "คฤหาสน์ดงดอกท้อไม่รับแขกที่ไม่ได้นัด แต่ท่านเข้ามาแล้ว ข้าเลยต้องรับ"),
    say(DING_N, "เมื่อก่อนคนเรียกข้าว่าสายฟ้าซ้ายมือ ตอนนี้เรียกว่าพ่อบ้านติง ข้าชอบชื่อหลังมากกว่า เงินเดือนดีกว่า"),
    say(DING_N, "ท่านทั้งสี่ชอบของดี พิณ หมาก พู่กัน ภาพวาด ถ้าอยากให้นายท่านใจดี ลองนำของถูกใจมาฝาก"),
  ], [
    { text: "ขอบคุณที่บอก", next: MZ },
  ]),
  offer(Q_GUANGLING, MZ, [
    say(HUANG_N, "ครึ่งชีวิตของข้าตามหาโน้ตเพลงโบราณบทหนึ่ง เพลงที่นักพรตเล่นก่อนถูกประหาร"),
    say(HUANG_N, "ข่าวว่ามีคนคัดลอกไว้ในตำราเพลงขั้นกลางบางเล่ม ถ้าเจ้าหามาได้ ข้าจะดีดให้ฟัง"),
    say(HUANG_N, "แต่ฟังพิณข้าไม่ใช่เรื่องง่าย คนอ่อนปราณฟังจบแล้วไม่ตื่นอีกเลย"),
    say(HUANG_N, "ถ้าเจ้ายืนได้จนจบเพลง ข้าจะสอนคีตาอาคม เสียงที่ทำให้ศัตรูมองเห็นภาพลวง"),
  ], "ข้าจะหาตำรามาให้", "ข้ายังอยากตื่นอยู่"),
  dialog(`qd_${Q_GUANGLING}_spar`, [
    tell("หวงจงกงเปิดตำราเพลง นิ้วสั่นเล็กน้อยด้วยความตื่นเต้น แล้วเริ่มดีด"),
    say(HUANG_N, "พิณเจ็ดสายไร้รูป ตั้งสติให้ดี!"),
  ], [
    { text: "ตั้งรับเสียงพิณ", next: MZ,
      effects: [{ t: "triggerBattle", opponentId: SPAR_HUANG, onWin: `qd_${Q_GUANGLING}_won`, onLose: `qd_${Q_GUANGLING}_lost`, nonFatal: true }] },
    { text: "ขอตั้งสติก่อน", next: MZ },
  ]),
  dialog(`qd_${Q_GUANGLING}_won`, [
    tell("สายพิณเส้นที่เจ็ดขาดดังเปาะ หวงจงกงนิ่งไปครู่หนึ่ง แล้วหัวเราะเบา ๆ"),
    say(HUANG_N, "สามสิบปีแล้วที่ไม่มีใครทำให้สายพิณข้าขาด"),
  ], [{ text: "คารวะหวงจงกง", next: MZ, effects: [{ t: "advanceQuest", questId: Q_GUANGLING }] }]),
  dialog(`qd_${Q_GUANGLING}_lost`, [
    tell("เจ้าตื่นขึ้นบนม้านั่งในศาลา มีผ้าห่มคลุมตัว"),
    say(HUANG_N, "หลับสบายไหม? พักให้หายแล้วค่อยมาฟังใหม่"),
  ]),
  complete(Q_GUANGLING, MZ, [
    tell("หวงจงกงเปลี่ยนสายพิณ แล้วดีดโน้ตเดียวซ้ำ ๆ ให้เจ้าฟัง"),
    say(HUANG_N, "คีตาอาคมไม่ใช่เพลงที่ฟังด้วยหู มันฟังด้วยปราณ"),
    say(HUANG_N, "ส่งปราณไปกับเสียง ให้ศัตรูเห็นเจ้าอยู่ผิดที่ เล็งผิดทาง"),
    say(HUANG_N, "ตำราเล่มนี้... ข้าจะดีดเพลงนั้นทุกคืน ขอบใจเจ้า"),
  ], "รับวิชาคีตาอาคม"),
  offer(Q_GO, MZ, [
    say(HEIBAI_N, "ข้าต้องการสองอย่าง"),
    say(HEIBAI_N, "หนึ่ง ตำราขั้นกลางสักเล่ม ข้าอ่านของตัวเองจนจำได้ทุกหน้า"),
    say(HEIBAI_N, "สอง คู่เล่นหนึ่งกระดาน ไม่ต้องเก่ง แค่ไม่หนีกลางทาง พี่สี่หนีไปดื่มเหล้าทุกครั้งที่แพ้"),
  ], "รับคำท้า", "ข้าเล่นหมากไม่เป็น"),
  complete(Q_GO, MZ, [
    say(HEIBAI_N, "เจ้าแพ้ แต่ไม่หนี ไม่โกง ไม่บ่น"),
    say(HEIBAI_N, "คนแบบนี้ข้าไว้ใจได้... อาจจะได้"),
    tell("เขามองไปทางทะเลสาบหลังคฤหาสน์ แล้วรีบหันกลับมาที่กระดาน"),
  ], "รับเงินรางวัล"),
  offer(Q_FINGER, MZ, [
    say(HEIBAI_N, "ข้ามีงานหนึ่ง ต้องเป็นคนที่ข้าไว้ใจ และฉลาดพอจะไม่ถามมาก"),
    say(HEIBAI_N, "ใต้ทะเลสาบหลังคฤหาสน์มีคุกเหล็ก แขกชราคนหนึ่งถูกขังไว้ที่นั่นมาสิบสองปี"),
    say(HEIBAI_N, "เอาห่อยานี้ลงไปให้เขา บอกว่า \"เฮยไป๋จื่อยังรอคำตอบ\""),
    say(HEIBAI_N, "ถ้าเจ้าทำได้ ข้าจะสอนดัชนีเอกสุริยัน วิชาที่ข้าไม่เคยสอนใคร"),
  ], "รับห่อยามา", "ข้าไม่อยากลงไปใต้น้ำ"),
  dialog(`qd_${Q_FINGER}_cell`, [
    tell("บันไดหินเปียกชื้นพาลงไปลึกใต้ทะเลสาบ เสียงน้ำหยดก้องไปตามทางเดิน"),
    tell("ประตูคุกเหล็กเปิดอ้า โซ่ขาดกองอยู่บนพื้น คุกว่างเปล่า"),
    tell("บนผนังมีรอยมือสลักลึกเข้าไปในหิน และตัวอักษรขีดด้วยเล็บ: \"ข้าไปแล้ว — ร.\""),
    tell("เจ้าแกะห่อยาดู ข้างในไม่ใช่ยา แต่เป็นผงยานอนหลับ กับจดหมายของเฮยไป๋จื่อที่ขอแลกอิสรภาพกับเคล็ดวิชาดูดพลัง"),
  ], [
    { text: "เก็บจดหมายไว้ แล้วรีบขึ้นไป", next: MZ, effects: [{ t: "advanceQuest", questId: Q_FINGER }] },
    { text: "ยังไม่พร้อม ขึ้นไปก่อน", next: MZ },
  ]),
  dialog(`qd_${Q_FINGER}_envoy`, [
    tell("ในดงเหมย เงาคนในชุดม่วงยืนขวางทาง กลิ่นธูปลัทธิตะวันจันทราโชยมา"),
    say("ทูตเงา", "นายท่านเหรินสั่งไว้ ใครรู้ว่าคุกว่าง ต้องปิดปากให้หมด"),
    say("ทูตเงา", "ส่วนเจ้าคนเล่นหมาก ข้าฝากฝ่ามือดำไว้ที่ไหล่เขาแล้ว อีกสามวันก็จบ"),
  ], [
    { text: "สู้กับทูตเงา", next: MZ,
      effects: [{ t: "triggerBattle", opponentId: FOE_ENVOY, onWin: `qd_${Q_FINGER}_won`, onLose: `qd_${Q_FINGER}_lost` }] },
    { text: "ถอยกลับไปตั้งหลัก", next: MZ },
  ]),
  dialog(`qd_${Q_FINGER}_won`, [
    tell("ทูตเงาล้มลงในกองกลีบเหมย ก่อนหายใจเฮือกสุดท้ายเขาหัวเราะ"),
    say("ทูตเงา", "ฝ่ามือดำ... ต้องใช้บัวหิมะเท่านั้น... ขอให้หาทัน"),
    tell("เจ้ารีบกลับไปที่ศาลา เฮยไป๋จื่อนั่งซีดเผือด ไหล่ดำเป็นรอยมือ เขาเห็นจดหมายในมือเจ้าแล้วก้มหน้า"),
    say(HEIBAI_N, "ข้าโลภ ข้าอยากได้วิชาของเขาจนยอมหลอกเจ้า... แต่เจ้ายังกลับมาช่วยข้า"),
  ], [{ text: "ไปหาบัวหิมะ", next: MZ, effects: [{ t: "advanceQuest", questId: Q_FINGER }] }]),
  dialog(`qd_${Q_FINGER}_lost`, [
    tell("เจ้าหนีรอดออกมาจากดงเหมยได้อย่างหวุดหวิด เงาม่วงยังวนเวียนอยู่ในนั้น"),
  ]),
  complete(Q_FINGER, MZ, [
    tell("บัวหิมะต้มจนน้ำใส รอยดำบนไหล่เฮยไป๋จื่อค่อย ๆ จางลง"),
    say(HEIBAI_N, "หมากทั้งชีวิตของข้า ข้ามองข้ามเม็ดเดียว คือใจคนที่ช่วยข้าโดยไม่หวังอะไร"),
    say(HEIBAI_N, "ดัชนีเอกสุริยัน รวมปราณทั้งร่างไว้ที่ปลายนิ้วเดียว จี้ให้ตรงจุด ศัตรูจะมองไม่เห็นทาง"),
    say(HEIBAI_N, "ใช้มันวางหมากที่ถูกต้อง อย่าใช้มันอย่างที่ข้าเกือบใช้"),
    tell("เขายื่นหยกเม็ดหนึ่งให้ — หมากเม็ดขาวที่เขาเก็บไว้สามสิบปี"),
  ], "รับวิชาดัชนีเอกสุริยัน"),
  offer(Q_PAINT, MZ, [
    say(DANQING_N, "ข้าตัดสินใจแล้ว! ภาพต่อไปของข้าคือ \"จอมยุทธผู้มาเยือนใต้ต้นเหมย\""),
    say(DANQING_N, "ปัญหาเดียวคือหมึกหมด ข้าเผลอเทลงไหเหล้าเมื่อคืน... เหล้าไหนั้นรสชาติแปลกดี"),
    say(DANQING_N, "หาหมึกเข้มมาสองก้อน แล้วมานั่งนิ่ง ๆ ใต้ต้นเหมยให้ข้าวาด"),
  ], "ยินดีเป็นแบบ", "ข้าไม่ชอบนั่งนิ่ง"),
  complete(Q_PAINT, MZ, [
    say(DANQING_N, "เสร็จแล้ว! งามที่สุดในรอบสามวัน!"),
    tell("ในภาพ เจ้าดูสูงกว่าตัวจริง หล่อกว่าตัวจริง และเมากว่าตัวจริงมาก"),
    say(DANQING_N, "เอาไปเลย ข้าวาดใหม่ได้ เพราะหน้าเจ้าข้าจำได้แล้ว... ใช่หน้านี้ใช่ไหม?"),
  ], "รับภาพวาด"),

  // ═══ villa_fuwei ══════════════════════════════════════════════════
  dialog(`npc_${LINZ}_talk`, [
    tell("ชายวัยกลางคนหน้าตาอิ่มเอิบยืนใต้ธงสิงห์ ยิ้มต้อนรับเหมือนต้อนรับลูกค้ารายใหญ่"),
    say(LINZ_N, "ยินดีต้อนรับสู่สำนักคุ้มกันฝูเวย! ส่งของสิบเมือง ไม่เคยหายสักหีบ"),
    say(LINZ_N, "ปู่ของข้า หลินเหยวียนถู ขี่ม้าขาวตัวเดียวสร้างชื่อนี้ขึ้นมา ข้าแค่รักษาไว้"),
    say(LINZ_N, "ความลับของการคุ้มกันคือ เพื่อนมากกว่าศัตรู ข้าจ่ายเงินให้โจรทุกสายจนพวกมันโค้งให้ธงข้า"),
  ], [
    { text: "แล้ววิชาประจำตระกูลล่ะ", next: `npc_${LINZ}_sword` },
    { text: "ช่วงนี้งานเป็นอย่างไรบ้าง", next: `npc_${LINZ}_hook` },
    { text: "ลาก่อน", next: FW },
  ]),
  dialog(`npc_${LINZ}_sword`, [
    say(LINZ_N, "กระบี่ขับมารของตระกูลหลิน! ...ข้าฝึกมาทั้งชีวิต แต่ไม่รู้ทำไมมันไม่เคยเก่งเหมือนที่ปู่ใช้"),
    say(LINZ_N, "มีคนจากเสฉวนมาถามถึงมันบ่อย ๆ ข้าก็ตอบตามจริงว่าไม่มีอะไรลับ"),
    tell("เขาหัวเราะ แต่ตาไม่หัวเราะด้วย"),
  ]),
  dialog(`npc_${LINZ}_hook`, [
    say(LINZ_N, "ไม่ค่อยดี มีโจรเส้นทางกลุ่มใหม่ไม่ยอมรับเงินข้า ปล้นเกวียนไปสามครั้งแล้ว"),
    say(LINZ_N, "ถ้าเจ้ามีปราณพอ ช่วยข้าหน่อย ข้าจะสอนลมปราณที่ปู่ฝึกบนหลังม้าขาวให้"),
  ]),
  dialog(`npc_${PING}_talk`, [
    tell("ชายหนุ่มหน้าตาสะสวยในชุดล่าสัตว์ แส้ม้าหนังแดงห้อยเอว เดินเล่นไปรอบลาน"),
    say(PING_N, "เจ้าก็เป็นจอมยุทธหรือ? ข้าก็อยากเป็น พ่อบอกว่าข้าต้องเรียนบัญชีก่อน"),
    say(PING_N, "เมื่อวานข้าล่ากระต่ายได้สองตัว สุนัขข้ากินไปตัวหนึ่ง อีกตัวมันหนีไป"),
    say(PING_N, "สักวันข้าจะออกไปท่องยุทธภพ ปราบคนเลว ช่วยคนดี มันคงสนุกน่าดู"),
  ], [
    { text: "ยุทธภพไม่ได้สนุกอย่างที่คิดหรอก", next: `npc_${PING}_warn` },
    { text: "แส้ของเจ้าสวยดี", next: `npc_${PING}_whip` },
    { text: "ลาก่อน", next: FW },
  ]),
  dialog(`npc_${PING}_warn`, [
    say(PING_N, "ท่านพูดเหมือนสื่อเปียวโถวเลย"),
    say(PING_N, "แต่บ้านข้าปลอดภัยจะตาย มีธงสิงห์ มีคนคุ้มกันสามสิบคน จะเกิดอะไรขึ้นได้"),
    tell("ลมพัดธงสิงห์ปลิวไสว เจ้ารู้สึกหนาวขึ้นมาโดยไม่รู้สาเหตุ"),
  ]),
  dialog(`npc_${PING}_whip`, [
    say(PING_N, "ใช่ไหมล่ะ! ข้าฝึกจนปัดแมลงวันบนหูม้าได้ ม้ายังไม่สะดุ้งเลย"),
    say(PING_N, "สุนัขข้าหิวอยู่ ถ้าเจ้าช่วยหาเนื้อมาให้ ข้าจะสอนเคล็ดลับให้"),
  ]),
  dialog(`npc_${SHI}_talk`, [
    tell("ชายหนวดเครารกเสียงดังเหมือนฆ้อง กำลังตรวจล้อเกวียนทีละล้อ"),
    say(SHI_N, "หลีกทางหน่อย! เกวียนจะออกบ่ายนี้"),
    say(SHI_N, "ข้าคุมเกวียนมายี่สิบปี ไม่เคยเสียหีบสักใบ เพราะข้าตรวจล้อเกวียนทุกล้อเอง"),
    say(SHI_N, "นายท่านเชื่อในเงิน คุณชายเชื่อในนิทาน ส่วนข้าเชื่อในล้อเกวียนกับปลายทวน"),
  ], [
    { text: "ท่านใช้ทวนหรือ", next: `npc_${SHI}_spear` },
    { text: "ลาก่อน", next: FW },
  ]),
  dialog(`npc_${SHI}_spear`, [
    say(SHI_N, "เคยใช้ สมัยอยู่กองทัพ ทวนที่ปลายประทับตรามังกร"),
    say(SHI_N, "ข้าไม่ใช้มันต่อหน้าใครมาสิบห้าปีแล้ว ใช้ทีไรมีคนตายทุกที"),
    say(SHI_N, "ถ้าเจ้าแข็งแรงจริง และข้าไว้ใจเจ้าพอ วันหนึ่งข้าอาจเล่าให้ฟัง"),
  ]),
  offer(Q_WHIP, FW, [
    say(PING_N, "สุนัขล่าเนื้อของข้าหิวจนหอนทั้งคืน แต่ข้าขี้เกียจไปตลาด... ไม่ใช่ขี้เกียจ ข้ายุ่ง"),
    say(PING_N, "เอาเนื้อสดมาให้สองชิ้น ข้าจะสอนแส้ม้าให้"),
    say(PING_N, "แส้ของข้าสะบัดสองครั้งเร็วจนเหมือนครั้งเดียว ครูฝึกม้าของข้ายังทึ่ง"),
  ], "ได้ จะหาเนื้อมาให้", "ไปตลาดเองสิ"),
  complete(Q_WHIP, FW, [
    tell("สุนัขสามตัวกระโจนใส่เนื้อ หลินผิงจือหัวเราะชอบใจ"),
    say(PING_N, "ดูนะ ข้อมือหลวม ๆ สะบัดออก แล้วดึงกลับก่อนปลายแส้จะสุด"),
    tell("เพียะ! เพียะ! ใบไม้สองใบขาดกลางอากาศ"),
    say(PING_N, "เห็นไหม! ข้าบอกแล้วว่าข้าเก่ง อย่าบอกพ่อนะว่าข้าสอนคนนอก"),
  ], "รับวิชาแส้เบื้องต้น"),
  offer(Q_HORSE, FW, [
    say(LINZ_N, "โจรเส้นทางกลุ่มนี้ไม่รับเงิน ไม่รับเหล้า ไม่รับมิตรภาพ รับแต่หีบของข้า"),
    say(LINZ_N, "ช่วยกวาดล้างให้สักสามคน แล้วปักธงสิงห์คืนหน้าประตู ให้ทุกคนรู้ว่าฝูเวยยังอยู่"),
    say(LINZ_N, "ปู่ของข้าขี่ม้าขาวคุ้มกันเกวียนพันลี้ ไม่เคยเหนื่อย เพราะเขาฝึกลมปราณม้าขาว"),
    say(LINZ_N, "ข้าจะสอนให้ ปราณนี้ช่วยให้ฟื้นตัวเองได้กลางศึก เหมาะกับคนที่ต้องเดินทางไกล"),
  ], "รับงานกวาดล้างโจร", "ข้ายังไม่ว่าง"),
  complete(Q_HORSE, FW, [
    say(LINZ_N, "ธงสิงห์โบกสะบัดอีกครั้ง! ขอบคุณ ขอบคุณจริง ๆ"),
    tell("หลินเจิ้นหนานพาเจ้าไปที่คอกม้า ม้าขาวแก่ตัวหนึ่งยืนสงบอยู่ท้ายคอก"),
    say(LINZ_N, "หายใจตามจังหวะม้าวิ่ง สี่ก้าวเข้า สี่ก้าวออก เวลาโดนตี ปราณจะไหลกลับมาเติมแผลเอง"),
    say(LINZ_N, "อย่างน้อยวิชานี้ข้าก็ฝึกสำเร็จ ไม่เหมือนกระบี่นั่น ฮ่า ๆ"),
  ], "รับลมปราณม้าขาว"),
  offer(Q_ESCORT, FW, [
    say(SHI_N, "คนคุ้มกันของข้าป่วยไปหนึ่ง ท้องเสียเพราะกินซาลาเปาค้างคืน"),
    say(SHI_N, "หีบผ้าไหมหีบนี้ต้องถึงร้านในหยางโจวก่อนตลาดเปิด"),
    say(SHI_N, "ส่งแล้วระวังขากลับด้วย พวกโจรป่าชอบตามคนที่เพิ่งได้เงินค่าส่ง"),
  ], "รับคุ้มกันหีบผ้า", "ข้าไม่ใช่คนคุ้มกัน"),
  complete(Q_ESCORT, FW, [
    say(SHI_N, "ใบรับครบ หีบไม่เสีย คนไม่เจ็บ ดี!"),
    say(SHI_N, "เจ้าทำงานเหมือนคนคุ้มกันเก่า ไม่พูดมาก ไม่หลงทาง"),
    tell("เขาตบไหล่เจ้าแรงจนเกือบล้ม ซึ่งสำหรับสื่อเปียวโถว นั่นคือคำชมสูงสุด"),
  ], "รับค่าจ้าง"),
  offer(Q_DRAGON, FW, [
    say(SHI_N, "ม้าในคอกตายสามตัวเมื่อคืน ไม่มีแผล ไม่มีเลือดออกข้างนอก"),
    say(SHI_N, "ข้าเคยเห็นแบบนี้ครั้งเดียว ตอนอยู่ทางตะวันตก มันคือฝ่ามือที่บดหัวใจจากข้างใน"),
    say(SHI_N, "นายท่านยังยิ้มอยู่ คุณชายยังไปล่าสัตว์ แต่ข้ารู้ว่ามีพายุกำลังมา"),
    say(SHI_N, "ช่วยข้าสืบเรื่องนี้ ข้าจะสอนทวนประทับมังกร ทวนที่ข้าสาบานว่าจะไม่ใช้อีก... แต่บางคำสาบานต้องมีคนรับช่วงต่อ"),
  ], "รับสืบเรื่องนี้", "เรื่องนี้ใหญ่เกินไป"),
  dialog(`qd_${Q_DRAGON}_luo`, [
    tell("รอยเท้ารองเท้าฟางพาไปหลังกำแพง ชายหนุ่มชุดเขียวคนหนึ่งยืนรออยู่อย่างไม่ทุกข์ร้อน"),
    say("ลั่วเหรินเจี๋ย", "ข้าคือลั่วเหรินเจี๋ย หนึ่งในสี่ยอดฝีมือแห่งชิงเฉิง"),
    say("ลั่วเหรินเจี๋ย", "อาจารย์ข้าอยากรู้ว่าตำรากระบี่ขับมารของตระกูลหลินซ่อนอยู่ที่ไหน ม้าสามตัวคือคำทักทาย คราวหน้าจะเป็นคน"),
  ], [
    { text: "สู้กับลั่วเหรินเจี๋ย", next: FW,
      effects: [{ t: "triggerBattle", opponentId: FOE_LUO, onWin: `qd_${Q_DRAGON}_won`, onLose: `qd_${Q_DRAGON}_lost` }] },
    { text: "ถอยไปตั้งหลัก", next: FW },
  ]),
  dialog(`qd_${Q_DRAGON}_won`, [
    tell("ลั่วเหรินเจี๋ยกระโดดข้ามกำแพงหนีไปพร้อมบาดแผล ทิ้งไว้แต่คำขู่"),
    say(SHI_N, "ชิงเฉิง... ข้ากลัวว่าจะเป็นพวกมัน"),
    say(SHI_N, "นายท่านไม่ยอมเชื่อ แต่ข้าจะเตรียมตัว ทวนเก่าของข้าด้ามผุไปแล้ว หาไม้ศักดิ์สิทธิ์มาให้ข้าสักท่อน"),
    say(SHI_N, "ด้ามทวนประทับมังกรต้องเป็นไม้ที่ฟ้าผ่าไม่ตาย ทวนจึงจะไม่หักกลางศึก"),
  ], [{ text: "ไปหาไม้ศักดิ์สิทธิ์", next: FW, effects: [{ t: "advanceQuest", questId: Q_DRAGON }] }]),
  dialog(`qd_${Q_DRAGON}_lost`, [
    tell("เจ้าล้มลงหลังกำแพง เมื่อลืมตา ลั่วเหรินเจี๋ยหายไปแล้ว เหลือแต่เสียงหัวเราะเย็นเยียบในสายลม"),
  ]),
  complete(Q_DRAGON, FW, [
    tell("สื่อเปียวโถวสวมหัวทวนเก่าเข้ากับด้ามไม้ศักดิ์สิทธิ์ ตรามังกรบนหัวทวนวาววับ"),
    say(SHI_N, "ทวนประทับมังกร ไม่มีท่าหลอก ไม่มีท่าหลบ แทงครั้งเดียวให้ทะลุ"),
    say(SHI_N, "ยืนให้มั่นเหมือนกำแพงเมือง ส่งแรงจากเท้าขึ้นไปถึงปลายทวน"),
    say(SHI_N, "ข้าแก่แล้ว ถ้าพายุมาจริง ข้าอยากให้มีคนหนึ่งที่ยังถือทวนนี้อยู่ได้"),
    tell("เขายื่นเข็มขัดนักรบเส้นเก่าให้ — เข็มขัดที่เขาคาดตอนอยู่กองทัพ"),
  ], "รับวิชาทวนประทับมังกร"),

];

// ─── Activities ───────────────────────────────────────────────────────
const activities: ActivityDef[] = [
  { id: "act_chengying_flute", label: "ฟังขลุ่ยหยกริมลำธาร", badge: "rest", icon: "🎶", hours: 2, stamina: 0,
    description: "2 ชั่วยาม · ฟังเฉิงอิ๋งเป่าขลุ่ย · ฟื้นพลังและบาดแผลเล็กน้อย",
    place: { locationIds: [CY], cooldownDays: 2, reward: { stamina: 20, heal: 0.15, relationship: { npcId: CHENG, amount: 1 } },
      doneText: "เพลงขลุ่ยจบลงพร้อมแสงสุดท้ายของวัน ใจเจ้าเบาขึ้น" } },
  { id: "act_chengying_embroider", label: "ช่วยเฉิงอิ๋งปักผ้า", badge: "labor", icon: "🪡", hours: 3, stamina: 10,
    description: "3 ชั่วยาม · ร้อยด้ายให้เฉิงอิ๋ง · ได้ค่าแรงเล็กน้อย ฝึกความแม่นยำ",
    place: { locationIds: [CY], cooldownDays: 1, reward: { gold: [20, 40], statXp: "DEX" },
      doneText: "เข็มแทงนิ้วไปสามที แต่ดอกท้อบนผ้างามขึ้นทุกฝีเข็ม" } },
  { id: "act_yanji_grind", label: "บดยาที่ร้านหมอหยาน", badge: "labor", icon: "⚗️", hours: 3, stamina: 12,
    description: "3 ชั่วยาม · บดสมุนไพรให้หยานจี · ค่าแรงและความรู้เรื่องยา",
    place: { locationIds: [YJ], cooldownDays: 1, reward: { gold: [25, 45], statXp: "INT", item: { itemId: "herb", count: 1, chance: 0.3 } },
      doneText: "หยานจีนับเงินให้สองรอบ — เจ้านับเองอีกรอบ ครบพอดี" } },
  { id: "act_beichou_spear", label: "แทงทวนใส่หุ่นฟาง", badge: "practice", icon: "🔱", hours: 2, stamina: 15,
    description: "2 ชั่วยาม · ฝึกทวนตามที่เป่ยฉิวตะโกนสั่ง · ฝึกพละกำลัง",
    place: { locationIds: [BC], cooldownDays: 1, reward: { wExp: 15, statXp: "STR" },
      doneText: "หุ่นฟางพรุนไปทั้งตัว เป่ยฉิวตะโกนว่า \"ยังช้า!\" แต่ก็ยิ้ม" } },
  { id: "act_beichou_bun", label: "กินซาลาเปาของอาหมู่", badge: "rest", icon: "🥟", hours: 1, stamina: 0,
    description: "1 ชั่วยาม · ซาลาเปาร้อน ๆ จากครัวบนเขา · ฟื้นพลัง",
    place: { locationIds: [BC], cooldownDays: 1, reward: { stamina: 25, relationship: { npcId: AMU, amount: 1 } },
      doneText: "ซาลาเปาไส้หมูสับหอมขิง อาหมู่วาดรูปหน้ายิ้มให้บนแผ่นไม้" } },
  { id: "act_meizhuang_tea", label: "จิบชาดอกเหมยในศาลา", badge: "rest", icon: "🍵", hours: 2, stamina: 0,
    description: "2 ชั่วยาม · 10 ตำลึง · ชาดอกเหมยกับเสียงพิณไกล ๆ · ฟื้นพลังและบาดแผล",
    place: { locationIds: [MZ], cooldownDays: 1, costGold: 10, reward: { stamina: 30, heal: 0.25 },
      doneText: "ชากลิ่นเหมยอุ่นทั่วอก เสียงพิณของหวงจงกงลอยมาจากศาลาฝั่งตรงข้าม" } },
  { id: "act_meizhuang_go", label: "เดินหมากกับพ่อบ้านติง", badge: "dice", icon: "⚫", hours: 2, stamina: 5,
    description: "2 ชั่วยาม · หมากล้อมหนึ่งกระดาน · ฝึกสติปัญญา",
    place: { locationIds: [MZ], cooldownDays: 1, reward: { wExp: 10, statXp: "INT", relationship: { npcId: DING, amount: 1 } },
      doneText: "พ่อบ้านติงแพ้อย่างสุภาพ — เจ้าสงสัยว่าเขาจงใจ" } },
  { id: "act_fuwei_cart", label: "ช่วยขนหีบขึ้นเกวียน", badge: "labor", icon: "📦", hours: 3, stamina: 18,
    description: "3 ชั่วยาม · ขนหีบสินค้าให้สำนักคุ้มกันฝูเวย · ค่าแรงดี ฝึกพละกำลัง",
    place: { locationIds: [FW], cooldownDays: 1, reward: { gold: [30, 55], statXp: "STR", relationship: { npcId: SHI, amount: 1 } },
      doneText: "หีบหนักจนหลังแอ่น สื่อเปียวโถวตะโกนนับ \"สิบเจ็ด! สิบแปด!\" แล้วจ่ายค่าแรงเต็ม" } },
];


export const CONTENT: PlaceContent = { npcs, quests, scenes, activities, opponents };
