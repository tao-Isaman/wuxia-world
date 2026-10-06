// Jianghu saga: คัมภีร์ทานตะวัน (art `khbt`, jianghu T5) — "ทานตะวันในวังเย็น".
// See docs/story-quests.md and docs/story-writing.md.
//
// The legend (invented for the game): about eighty years ago a Han seamstress
// of the Yuan palace, คุยเหนียง, turned the motion of her needle into an art of
// lightness and wrote it down. Its first line reads "จงตัดวังในตนเสียก่อน" —
// cut the palace inside you. A Yuan eunuch copyist read the one character
// (宮, วัง / โทษตอน) as the castration punishment, and his corrupt copy came to
// the Ming court's หอคัมภีร์หลวง with the Yuan archive, in the forbidden
// section. Generations of young eunuchs maimed themselves for it. The hero's
// father (the vault's keeper, main story) burned that copy a year before he
// died, after the old consort told him it was a lie.
//
// The present (1401): the original was never in the vault. คุยเหนียง stitched it
// into a sunflower robe; her daughter หลานอวี้, now a forgotten old consort in
// the cold palace, unpicked it into five panels and hid them with five people.
// ขันทีใหญ่กู้ชิวเซิง ("เข็มแดง"), who learned the corrupt copy by heart thirty
// years ago, is burning up from it, sells its lines to the northern army and
// buys poor boys to make "ขันทีเงา" for อ๋องเยียน. ขันทีเกา, who read the same
// copy beside him and stopped, guards the consort. The hero gathers the
// panels, survives a betrayal (ชุ่ยเอ๋อ, whose brother Gu holds), learns at
// หุบเขาตัดใจ what "ตัด" means, frees the boys and the consort in the north,
// and ends Gu in the palace — and the art is the true reading: ตัดใจจากกิเลส.
//
// Six acts, 35 chapters. Givers stand on maps (palace, capital, inns, towns,
// the wilds); films carry the turns; duels against new st_jh_sunflower_* foes
// and a few existing spar / elite builds.
import type { CutsceneSpec, LineageSpec, StoryArcSpec, StoryChapterSpec, StoryOpponentSpec } from "../../../story/types";
import type { Condition } from "../../../types";

// ─── People (givers and talk targets: they stand on their maps) ───────
const GAO = "palace_royal_eunuch_gao";
const CUI = "palace_royal_maid_cui";
const ZHAO = "palace_royal_guard_zhao";
const QIAN = "palace_royal_official_qian";
const FENG = "spy_capital_feng";
const BLACK = "evil_capital_blackmarket_zhou";
const LIN = "city_capital_physician_lin";
const QING = "city_capital_clerk_qing";
const PO = "inn_heluo_storyteller_po";
const SIMA = "city_lingxiao_scholar_sima";
const WEI = "wld_bingcan_scholar_wei";
const WEAVER = "city_suzhou_weaver_mei";
const BOOKS = "city_suzhou_book_merchant_li";
const KONG = "city_jinling_strategist_kong";
const GATE_YAN = "city_changan_guard_yan";
const SI = "spy_village_si";
const JUEQING = "wld_jueqing_elder_lin";
const LIU = "home_player_housekeeper_liu";

// Speaker names as on their cards.
const N_GAO = "ขันทีเกา";
const N_CUI = "ชุ่ยเอ๋อ";
const N_ZHAO = "จ้าวเทีย";
const N_QIAN = "ขุนนางเฉียน";
const N_FENG = "เฟิงเจ้าของร้านบะหมี่";
const N_BLACK = "เถ้าแก่โจวตลาดมืด";
const N_LIN = "หมอหลิน";
const N_QING = "เสมียนนายฉิง";
const N_PO = "โปผู้เล่าเรื่อง";
const N_SIMA = "ซือหม่าเหยียน";
const N_WEI = "เว่ยชิงเหวิน";
const N_WEAVER = "ช่างทอเหมย";
const N_BOOKS = "พ่อค้าหนังสือลี่";
const N_KONG = "นักยุทธศาสตร์กง";
const N_GATE_YAN = "ยามหยาน";
const N_SI = "ซื่อชาวนาในชีกู่";
const N_JUEQING = "หลินชัวซัน";
const N_LIU = "ป้าหลิว";
// People who appear only in films and lines.
const N_CONSORT = "พระสนมชราหลานอวี้";
const N_KUI = "คุยเหนียง";
const N_GU = "ขันทีใหญ่กู้ชิวเซิง";
const N_MASK = "หน้ากากเข็มแดง";
const N_LONG = "เสี่ยวหลง";
const N_SHADOW = "ขันทีเงา";
const N_WIDOW = "แม่ม่ายใยไหม";
const N_BROCADE = "เสื้อแพรไร้ตรา";
const N_NORTH = "ทูตเหล็กทัพเหนือ";
const N_CAPTAIN = "นายกองเถียนหลง";
const N_FATHER = "นายหอคัมภีร์";
const N_SUNMOON = "อาจารย์ใหญ่หยินอวี้";
const N_JYW = "ผู้บัญชาการจ้าวฝู่";
const N_OFFICIAL_YAN = "ขุนนางหยาน";

// ─── New foes ─────────────────────────────────────────────────────────
const SHADOW = "st_jh_sunflower_shadow_eunuch";
const WIDOW = "st_jh_sunflower_silk_widow";
const BROCADE = "st_jh_sunflower_unmarked_brocade";
const NORTH = "st_jh_sunflower_north_envoy";
const CAPTAIN = "st_jh_sunflower_palace_captain";
const MASK = "st_jh_sunflower_red_mask";
const GAO_TEST = "st_jh_sunflower_gao_silent_step";
const LONG = "st_jh_sunflower_xiaolong";
const GU = "st_jh_sunflower_gu_red_needle";

const OPPONENTS: readonly StoryOpponentSpec[] = [
  { id: SHADOW, name: N_SHADOW, ti: 4, category: "human",
    look: { sheet: "foe_assassin", tint: 0x6b6f7a },
    stats: { AGI: 34, DEX: 30, STR: 22, VIT: 22, POW: 20 },
    skillIds: ["nd9", "pn", "tang_heartpierce", "jy_chain_assassin"], artId: "t3_sm_sunscript", artLevel: 8 },
  { id: WIDOW, name: N_WIDOW, ti: 4, category: "human",
    look: { sheet: "foe_assassin_f", tint: 0x9a7fa8 },
    stats: { DEX: 36, AGI: 34, INT: 24, VIT: 24, LUK: 20 },
    skillIds: ["tang_starrain", "pn", "nf7", "tang_viperblade"], artId: "t4_tang_tenkpoisons", artLevel: 6 },
  { id: BROCADE, name: N_BROCADE, ti: 4, category: "human",
    look: { sheet: "foe_constable", tint: 0x7a2e2e, size: 1.05 },
    stats: { STR: 34, AGI: 30, VIT: 30, DEX: 28, DEF: 24 },
    skillIds: ["jy_execution_blade", "jy_chain_assassin", "jy_sword"], artId: "jy_a4_brocadelord", artLevel: 7 },
  { id: NORTH, name: N_NORTH, ti: 4, category: "human",
    look: { sheet: "foe_enforcer", tint: 0x4a5a6a, size: 1.12 },
    stats: { STR: 40, VIT: 36, POW: 30, AGI: 28, DEF: 28 },
    skillIds: ["nf3", "nf2", "jy_execution_sword", "ws"], artId: "t4_jy_godslayer", artLevel: 7 },
  { id: CAPTAIN, name: N_CAPTAIN, ti: 4, category: "human",
    look: { sheet: "foe_guard", tint: 0xb0413e, size: 1.1 },
    stats: { STR: 36, VIT: 38, DEF: 32, AGI: 26, POW: 26 },
    skillIds: ["nh1", "nf3", "jy_execution_blade"], artId: "jy_a4_brocadelord", artLevel: 7 },
  { id: MASK, name: N_MASK, ti: 4, category: "human",
    look: { sheet: "foe_ghost", tint: 0xa83246, size: 1.05 },
    stats: { AGI: 40, DEX: 36, POW: 30, STR: 26, VIT: 28, INT: 30 },
    skillIds: ["nd9", "pn", "tang_starrain", "tang_heartpierce"], artId: "t3_sm_sunscript", artLevel: 10 },
  { id: GAO_TEST, name: "ขันทีเกา (เท้าไร้เสียง)", ti: 4, category: "human",
    look: { sheet: "m3", tint: 0x8a8a8a },
    stats: { AGI: 42, DEX: 36, INT: 36, VIT: 30, POW: 30 },
    skillIds: ["nd9", "nd11", "hgs_swift_blade", "pn"], artId: "t3_voidstep", artLevel: 10 },
  { id: LONG, name: N_LONG, ti: 4, category: "human",
    look: { sheet: "foe_swordsman", tint: 0x6b6f7a, size: 0.95 },
    stats: { AGI: 42, DEX: 34, STR: 26, VIT: 28, LUK: 24 },
    skillIds: ["nd11", "nd9", "tang_heartpierce", "pn"], artId: "t3_sm_sunscript", artLevel: 9 },
  { id: GU, name: N_GU, ti: 4, category: "human",
    look: { sheet: "foe_strategist", tint: 0xa83246, size: 1.12 },
    stats: { AGI: 50, DEX: 46, POW: 42, INT: 40, STR: 36, VIT: 38, DEF: 30 },
    skillIds: ["nd9", "pn", "tang_starrain", "tang_heartpierce", "jy_chain_assassin"], artId: "yxhd", artLevel: 9 },
];

// ─── Gates ────────────────────────────────────────────────────────────
// The arc asks for the main story and AGI 120 (the art is speed). Inner
// chapters raise the bar with other stats and traits; `test:story` plays the
// saga with every stat at 120, so no single gate goes above that.
const MAIN_DONE: Condition = { t: "questStatus", questId: "st_main_15", status: "done" };
const stat = (s: "AGI" | "DEX" | "INT" | "VIT" | "POW" | "STR", min: number): Condition => ({ t: "statAtLeast", stat: s, min });
const all = (...c: Condition[]): Condition => ({ t: "and", all: c });

// Colours for the films.
const RED_ROBE = "#a83246";
const GREY_ROBE = "#6b6f7a";
const OLD_SILK = "#d8c8a8";
const SUN = "#e8b84a";
const YUAN_GREY = "#8a8a8a";
const MING_RED = "#b0413e";

// ═════════════════════════════════════════════════════════════════════
// ACT 1 · เข็มแดงในวังหลวง (1–6)
// Old copyists of the burned vault die with an embroidery needle in the
// neck; one writes "ทานตะวัน" in blood. Lines of a forbidden text are being
// auctioned to the north. The old consort in the cold palace knows the
// truth: the copy the father burned was a lie, and the original is five
// pieces of cloth.
// ═════════════════════════════════════════════════════════════════════

const FILM_OPENING: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "night",
  title: "ทานตะวันในวังเย็น", subtitle: "ยุทธจักร · ตำนานที่ไม่มีสำนักใดรับรอง",
  cast: {
    scribe: { name: "ขันทีชราหลี่ผู้คัดลอก", look: "elder", at: [-3, 0], facing: "right", tint: YUAN_GREY },
    mask: { name: N_MASK, look: "foe_ghost", at: [5, -1], facing: "left", tint: RED_ROBE, hidden: true },
    gao: { name: N_GAO, look: "m3", at: [6, 1], facing: "left", hidden: true },
  },
  beats: [
    ["narrate", "ยามสามในวังหลวง ลมหนาวพัดผ่านระเบียงที่เคยพาไปถึงหอคัมภีร์หลวง — หอที่ไหม้เหลือแต่ตอตะโกเมื่อสองปีก่อน"],
    ["say", "scribe", "ข้าคัดลอกหนังสือมาสี่สิบปี… ข้าไม่เคยจำอะไรได้เลยสักตัว ข้าสาบาน"],
    ["enter", "mask", [5, -1]],
    ["move", "mask", [0, 0], "run"],
    ["say", "mask", "คนที่เคยเช็ดฝุ่นหมวดต้องห้าม ไม่มีใครลืมได้หรอก ท่านลุง"],
    ["act", "mask", "attack"],
    ["fx", "flash", "scribe"],
    ["act", "scribe", "defeat"],
    ["exit", "mask"],
    ["wait", 700],
    ["enter", "gao", [6, 1]],
    ["move", "gao", [-1, 1]],
    ["narrate", "ปลายนิ้วของคนตายเปื้อนเลือด บนแผ่นหินเขาเขียนไว้สามพยางค์ ลายมือสั่นแต่ชัดเจน"],
    ["title", "ทานตะวัน"],
    ["think", "gao", "สามสิบปีแล้ว… ข้านึกว่ามันไหม้ไปพร้อมกับนายหอแล้วเสียอีก"],
    ["fade", "out"],
  ],
};

const FILM_ROOFTOP: CutsceneSpec = {
  stage: "palace_royal", around: ZHAO, mood: "night",
  title: "เงาบนหลังคา", subtitle: "ยามสองคืนเดือนมืด",
  cast: {
    zhao: { name: N_ZHAO, look: ZHAO, at: [-2, 1], facing: "right" },
    hero: { name: "{hero}", look: "hero", at: [-4, 1], facing: "right" },
    shadow: { name: N_SHADOW, look: "foe_assassin", at: [5, -2], facing: "left", tint: GREY_ROBE, hidden: true },
  },
  beats: [
    ["say", "zhao", "คืนก่อนมันวิ่งผ่านตรงนี้ เร็วจนข้านึกว่าแมว แต่แมวไม่ใส่รองเท้าผ้าไหม"],
    ["enter", "shadow", [5, -2]],
    ["move", "shadow", [2, -1], "run"],
    ["fx", "smoke", "shadow"],
    ["say", "shadow", "นายหอตายแล้ว ลูกของนายหอก็ไม่ควรอยู่ในวังนี้"],
    ["say", "zhao", "พูดได้ด้วย! งั้นไม่ใช่แมว!"],
    ["act", "shadow", "attack"],
    ["fx", "slash", "hero"],
    ["act", "hero", "guard"],
    ["think", "hero", "เสียงลมหายใจมันร้อน… ร้อนเหมือนคนเป็นไข้ที่ยังวิ่งได้"],
    ["fade", "out"],
  ],
};

const FILM_AUCTION: CutsceneSpec = {
  stage: "inn_heluo", around: PO, mood: "night",
  title: "บรรทัดละแท่งทอง", subtitle: "ห้องชั้นบน โรงเตี๊ยมเฮ่อลั่ว",
  cast: {
    seller: { name: N_WIDOW, look: "foe_assassin_f", at: [0, -1], facing: "right", tint: "#9a7fa8" },
    north: { name: N_NORTH, look: "foe_enforcer", at: [4, 0], facing: "left", tint: "#4a5a6a", size: 1.1 },
    court: { name: "คนรับใช้ของขุนนาง", look: "merchant", at: [-4, 0], facing: "right", tint: MING_RED },
    hero: { name: "{hero}", look: "hero", at: [-1, 2], facing: "right" },
  },
  beats: [
    ["narrate", "ตะเกียงสามดวง ผู้ซื้อสองฝ่าย ทองกองบนโต๊ะสูงกว่าถ้วยชา และนางผู้ขายที่ไม่เคยถอดผ้าคลุมหน้า"],
    ["say", "seller", "บรรทัดที่สามสิบเอ็ด ว่าด้วยการเดินลมปราณผ่านจุดฮุ่ยอิน ราคาเดิม หนึ่งแท่ง"],
    ["say", "north", "ทัพเหนือรับหมด ทั้งบรรทัดที่เหลือ และคนที่ท่องมันได้ด้วย"],
    ["say", "court", "นายท่านของข้าในวังก็ให้สองแท่ง… เอ่อ ขอผ่อนได้ไหม เบี้ยหวัดยังไม่ออก"],
    ["think", "hero", "ขายวิชาเป็นบรรทัดเหมือนขายผ้าเป็นศอก… แล้วใครกันที่ท่องมันได้ทั้งเล่ม"],
    ["act", "seller", "idle"],
    ["say", "seller", "อ้อ แขกที่ยืนข้างบันได ไม่ซื้อก็อย่ายืนฟังฟรี"],
    ["fx", "poison", "hero"],
    ["fade", "out"],
  ],
};

const FILM_BURNING: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "past",
  title: "สามปีก่อน", subtitle: "หมวดต้องห้าม หอคัมภีร์หลวง",
  cast: {
    father: { name: N_FATHER, look: "qing", at: [-1, 0], facing: "right" },
    gao: { name: N_GAO, look: "m3", at: [3, 0], facing: "left" },
  },
  beats: [
    ["narrate", "หนึ่งปีก่อนไฟไหม้หอ นายหอคัมภีร์ยืนหน้าเตาถ่าน มือถือม้วนกระดาษสีเหลืองซีดที่ขอบถูกแมลงกิน"],
    ["say", "gao", "พระสนมในตำหนักเย็นบอกท่านแล้วใช่ไหม ว่าม้วนนั้นคัดลอกผิดตั้งแต่ตัวอักษรแรก"],
    ["say", "father", "นางบอกว่าเด็กหนุ่มกี่ร้อยคนเสียชีวิตเพราะอักษรตัวเดียว… ข้าเป็นคนทำบัญชี ข้านับได้"],
    ["think", "father", "หกม้วนที่เหลือข้าเผาเพราะมันฆ่าคน ม้วนนี้ข้าเผาเพราะมันโกหก"],
    ["fx", "fire", "father"],
    ["fx", "smoke"],
    ["say", "father", "ในบัญชีจะเขียนว่า 'เผาแล้ว' ใครตามล่ามันก็จะได้แต่กระดาษเปล่า"],
    ["say", "gao", "ต้นฉบับจริงไม่เคยเข้าหอนี้ นายหอ และข้าขอให้มันไม่มีวันเข้า"],
    ["fade", "out"],
  ],
};

const FILM_COLD_PALACE: CutsceneSpec = {
  stage: "palace_royal", around: CUI, mood: "night",
  title: "ตำหนักเย็น", subtitle: "ที่ที่ฮ่องเต้ลืม",
  cast: {
    consort: { name: N_CONSORT, look: "f4", at: [1, -1], facing: "left", tint: OLD_SILK },
    cui: { name: N_CUI, look: CUI, at: [-2, 0], facing: "right" },
    hero: { name: "{hero}", look: "hero", at: [-4, 1], facing: "right" },
  },
  beats: [
    ["narrate", "ตำหนักเย็นไม่มีตะเกียงเกินหนึ่งดวง หญิงชราผมขาวนั่งปักผ้าอยู่ใต้แสงนั้น เข็มของนางไม่เคยหยุด"],
    ["say", "cui", "พระสนม หม่อมฉันพาลูกของนายหอมาแล้วเพคะ"],
    ["move", "hero", [-1, 0]],
    ["say", "consort", "เดินเหมือนเขาเลย… เดินเหมือนคนที่กลัวจะเหยียบกระดาษของใครเข้า"],
    ["say", "consort", "พ่อของเจ้านั่งตรงนั้นเมื่อสามปีก่อน ถามข้าว่าคัมภีร์ม้วนหนึ่งควรเผาหรือไม่ ข้าบอกว่าเผาเถิด มันไม่ใช่ของแม่ข้า"],
    ["think", "hero", "ของแม่… นาง?"],
    ["fx", "sparkle", "consort"],
    ["fade", "out"],
  ],
};

const FILM_MASK_FLEES: CutsceneSpec = {
  stage: "palace_royal", around: CUI, mood: "night",
  title: "รองเท้าผ้าไหมสีแดง",
  cast: {
    mask: { name: N_MASK, look: "foe_ghost", at: [1, 0], facing: "left", tint: RED_ROBE },
    hero: { name: "{hero}", look: "hero", at: [-2, 0], facing: "right" },
    consort: { name: N_CONSORT, look: "f4", at: [-5, -1], facing: "right", tint: OLD_SILK },
  },
  beats: [
    ["act", "mask", "hurt"],
    ["say", "mask", "ลูกนายหอ… ฝีเท้าใช้ได้ แต่เจ้ายังวิ่งตามสิ่งที่อยากได้ ข้าได้ยินมันในลมหายใจเจ้า"],
    ["say", "consort", "เจ้าอีกแล้ว… สามสิบปีก่อนเจ้ายังเป็นเด็กถือไม้กวาด ตอนนี้ถือเข็ม"],
    ["say", "mask", "พระสนมจำข้าได้ด้วย ช่างน่าซึ้งใจ ข้าจะกลับมาเอาผ้าทุกผืน — ก่อนที่ไฟในตัวข้าจะเผาข้าหมด"],
    ["fx", "smoke", "mask"],
    ["exit", "mask"],
    ["think", "hero", "ไฟในตัว… หมอหลินพูดถูก มันกำลังไหม้จากข้างใน"],
    ["fade", "out"],
  ],
};

const ACT1: readonly StoryChapterSpec[] = [
  // ── 1 ──
  {
    title: "ทานตะวันที่เขียนด้วยเลือด",
    summary: "ขันทีชราผู้เคยคัดลอกหนังสือในหอคัมภีร์หลวงตายด้วยเข็มปักผ้าเล่มเดียวที่ต้นคอ ก่อนตายเขาเขียนคำว่า 'ทานตะวัน' ด้วยเลือด ขันทีเกาเรียกเจ้าเข้าวัง",
    giver: GAO,
    offer: {
      cutscene: FILM_OPENING,
      lines: [
        "ขันทีเกายืนรอเจ้าที่หน้าคลังเสบียงก่อนรุ่งสาง ไม่มีเสียงเท้า ไม่มีรอยยิ้มบางเหมือนทุกครั้ง",
        [N_GAO, "เจ้าฉีกบัญชีของบิดาส่งคืนทุกสำนักไปแล้ว ยุทธภพยกย่องเจ้า ข้าก็ยกย่อง… แต่บัญชีมีบรรทัดหนึ่งที่เจ้าส่งคืนไม่ได้"],
        [N_GAO, "**หมวดต้องห้ามเจ็ดม้วน** บิดาเจ้าเขียนว่า 'เผาแล้ว' และมันเผาแล้วจริง ข้ายืนดูอยู่ข้างเตา"],
        [N_GAO, "แต่เดือนนี้ขันทีชราที่เคยเช็ดฝุ่นหมวดนั้นตายไปสามคน คนที่สามเขียนคำสุดท้ายด้วยเลือด — **ทานตะวัน**"],
        [N_GAO, "ศพยังอยู่ระเบียงตะวันตก ไปดูให้ทันก่อนขุนนางกรมพิธีจะสั่งล้างพื้น เพราะในวังนี้ ความจริงถูกล้างทิ้งเร็วกว่าคราบชา"],
        [N_GAO, "แล้วไปถามชุ่ยเอ๋อ นางรู้ข่าวลือทุกตำหนักก่อนข่าวลือจะรู้ตัวเอง"],
      ],
      go: "รับคำ ตามเข้าไปในวัง",
      asides: [
        { say: "ท่านเรียกข้ามาเพราะข้าเป็นลูกนายหอ หรือเพราะข้าว่างงาน", reply: [
          [N_GAO, "ทั้งสองอย่าง คนว่างงานในวังนี้มีมาก แต่คนว่างงานที่ข้าไว้ใจมีอยู่คนเดียว"],
          [N_GAO, "อีกอย่าง ข้าอยากแก่ตาย และคนที่อยากแก่ตายไม่ควรสืบเรื่องนี้เอง"],
        ] },
      ],
    },
    steps: [
      { t: "visit", locationId: "palace_royal", label: "ดูศพที่ระเบียงตะวันตก", hint: "เข้าวังหลวง ดูศพขันทีชราที่ระเบียงตะวันตกก่อนมีคนล้างพื้น",
        scene: { lines: [
          "ศพถูกคลุมด้วยเสื่อเก่า ขันทีหนุ่มสองคนถือถังน้ำยืนรอคำสั่งล้างพื้น เจ้าเปิดเสื่อออกครึ่งหนึ่ง",
          "ที่ต้นคอมีจุดแดงเล็กเท่าหัวเข็ม ไม่มีรอยมีด ไม่มีรอยฟกช้ำ ปลายนิ้วชี้ขวาของศพแข็งทื่ออยู่เหนืออักษรเลือดสามพยางค์",
          "เจ้าคีบสิ่งหนึ่งออกจากรอยแตกของแผ่นหิน — **เข็มปักผ้าสีเงิน** ร้อยด้ายแดงไว้ครึ่งคืบ ด้ายนั้นยังมีกลิ่นยาเย็นจาง ๆ",
          ["ขันทีหนุ่มถือถัง", "ท่านผู้กล้าเสร็จหรือยังขอรับ ขุนนางเฉียนสั่งว่าก่อนฟ้าสางพื้นต้องหอม ไม่ว่าใครจะตายบนนั้น"],
        ], go: "เก็บเข็มไว้ แล้วไปหาชุ่ยเอ๋อ" } },
      { t: "talk", npcId: CUI, locationId: "palace_royal", label: "ถามชุ่ยเอ๋อเรื่องขันทีชราที่ตาย", hint: "ถามชุ่ยเอ๋อในวังหลวงว่าขันทีชราสามคนที่ตายเดือนนี้เกี่ยวข้องกันอย่างไร",
        scene: { lines: [
          [N_CUI, "เจ้าอีกแล้ว! คราวก่อนเจ้าถือกล่องยาให้ข้าเก่งมาก จ้าวเทียยังถามถึงอยู่เลยว่าคนบ้านนาคนนั้นเลี้ยงควายกี่ตัว"],
          [N_CUI, "สามคนที่ตาย… ท่านลุงหลี่ ท่านลุงหวง กับท่านลุงเผิง ทั้งสามเคยเป็นขันทีเช็ดฝุ่นในหอคัมภีร์ตอนยังหนุ่ม ก่อนจะถูกย้ายไปคัดลอกเอกสาร"],
          [N_CUI, "และทั้งสามคนมีเข็มปักผ้าปักอยู่ที่ต้นคอ คนในวังเลยลือกันว่าผีนางกำนัลปักผ้าออกมาอาละวาด"],
          [N_CUI, "ข้าไม่เชื่อเรื่องผีหรอก ผีไม่ต้องใช้ด้ายราคาแพงขนาดนั้น ด้ายแดงแบบนี้มีแต่ **กรมเย็บปักหลวง** ที่ได้เบิก"],
        ], go: "จดชื่อกรมเย็บปักหลวงไว้" } },
    ],
    complete: {
      lines: [
        [N_GAO, "กรมเย็บปักหลวง… ข้าคิดไว้แล้ว แต่ข้าไม่อยากคิดถูก"],
        [N_GAO, "เจ้ากรมคนปัจจุบันคือ **ขันทีใหญ่กู้ชิวเซิง** เขาเข้าวังพร้อมข้า ปีเดียวกัน เดือนเดียวกัน กวาดพื้นหอคัมภีร์ด้วยไม้กวาดคู่เดียวกัน"],
        [N_GAO, "ข้าไม่ได้บอกว่าเขาฆ่าใคร ข้าแค่บอกว่าเขาเป็นคนเดียวที่เหลืออยู่จากเด็กกวาดพื้นรุ่นนั้น… นอกจากข้า"],
        [N_GAO, "เก็บเข็มนั่นไว้ให้ดี และคืนนี้อย่านอนใกล้หน้าต่าง"],
      ],
      go: "รับคำเตือน",
    },
    reward: [
      { t: "wExp", amount: 120 },
      { t: "gold", amount: 100 },
      { t: "npcRelationship", npcId: GAO, amount: 3 },
    ],
  },

  // ── 2 ──
  {
    title: "เงาบนหลังคาวัง",
    summary: "จ้าวเทียองครักษ์หนุ่มจากบ้านนาเห็นเงาวิ่งบนหลังคาทุกคืน เขายอมพาเจ้าขึ้นเวรยามด้วย ถ้าเจ้าพิสูจน์ได้ว่าไม่ใช่ขโมยด้วยการประลองกับเขาก่อน",
    giver: ZHAO,
    offer: {
      lines: [
        [N_ZHAO, "อ้าว คนบ้านนา! บ้านเจ้าปีนี้ข้าวงามไหม ควายของข้าที่บ้านชื่อเจ้าดำ ปีนี้มันคงอ้วนกว่าข้าแล้ว"],
        [N_ZHAO, "เรื่องเงาบนหลังคานั่นจริงนะ ข้าเห็นสามคืนติด เร็วกว่าเหยี่ยว เงียบกว่าแม่ข้าตอนโกรธ"],
        [N_ZHAO, "ผู้กองสั่งว่าห้ามคนนอกขึ้นเวร แต่ถ้าข้าประลองกับเจ้าแล้วรายงานว่า 'ทดสอบฝีมือคนช่วยงาน' ก็ไม่ผิดระเบียบ"],
        [N_ZHAO, "ข้าจะไม่ออมมือนะ… ถ้าข้าแพ้ เจ้าห้ามเล่าให้ชุ่ยเอ๋อฟัง นางจะเล่าต่อให้ทั้งวังฟังภายในครึ่งชั่วยาม"],
      ],
      go: "ตกลงประลอง",
      asides: [
        { say: "ถ้าข้าแพ้ล่ะ", reply: [
          [N_ZHAO, "ก็ช่วยข้าแบกกระสอบข้าวให้ขันทีเกาสามสิบกระสอบ เขาชอบนับผิดแล้วให้นับใหม่"],
        ] },
      ],
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "ประลองกับจ้าวเทีย", hint: "ประลองฝีมือกับจ้าวเทียที่ระเบียงวังหลวง", opponentId: "spar_palace_royal_zhao",
        before: { lines: [
          "จ้าวเทียหมุนทวนสองรอบ ปลายทวนเฉียดโคมไฟจนสั่น เขารีบเอามือประคองโคมก่อนจะตั้งท่า",
          [N_ZHAO, "ขอโทษ ขอโทษ โคมนี้ต้องเบิกใหม่ทีละสามวัน… เอาละ มาเลย!"],
        ], go: "ตั้งท่า" },
        after: { lines: [
          [N_ZHAO, "โอ๊ย… เจ้าไม่ได้เร็วกว่าข้ามากหรอก แต่เจ้าไม่เคยไปยืนรอตรงที่ข้าจะไป เจ้าไปถึงก่อนเสมอ"],
          [N_ZHAO, "ข้าจะรายงานว่าผ่าน แล้วคืนนี้ยามสองไปเจอกันที่ระเบียงเหนือ อย่าลืมรองเท้าที่ไม่มีเสียง"],
        ] } },
      { t: "duel", locationId: "palace_royal", label: "ซุ่มดักเงาบนหลังคา", hint: "ขึ้นเวรยามสองกับจ้าวเทีย ดักเงาที่วิ่งบนหลังคาวัง", opponentId: SHADOW,
        before: { cutscene: FILM_ROOFTOP, lines: [
          "เงานั้นลงจากหลังคาเบาเหมือนใบไม้ เป็นชายหนุ่มหน้าซีด แก้มเกลี้ยงไม่มีหนวด ดวงตาแดงก่ำเหมือนคนไม่ได้นอนมาหลายปี",
          [N_ZHAO, "ข้าจับขาซ้าย เจ้าจับขาขวา… เดี๋ยว มันมีเข็มด้วย ข้าขอจับขาซ้ายจากระยะไกลแล้วกัน"],
        ], go: "สู้" },
        after: { lines: [
          "ขันทีเงาทรุดลง ไอเป็นควันบาง ๆ ราวกับไฟคุอยู่ในอก เขากัดอะไรบางอย่างในปาก แล้วหัวเราะ",
          [N_SHADOW, "ไม่ต้องจับข้า… ไฟของข้ามันมาถึงหัวใจแล้ว ท่านอาจารย์บอกว่าคนที่ไม่ผ่านพิธีตัด ไฟจะเผาจากข้างใน"],
          [N_SHADOW, "ข้าอายุสิบเก้า… ข้าแค่อยากเร็วพอจะไม่ต้องหิวอีก"],
          "เขาหลับตาไปในอ้อมแขนของจ้าวเทีย ในแขนเสื้อมีกระดาษพับหนึ่งแผ่น เขียนบรรทัดเดียวด้วยลายมือเด็ก",
        ] } },
    ],
    complete: {
      lines: [
        [N_ZHAO, "สิบเก้า… น้องชายข้าก็สิบเก้า ปีนี้มันอยู่บ้าน ไถนา บ่นว่าเจ้าดำเดินช้า"],
        [N_ZHAO, "ข้าไม่เข้าใจหรอกว่าวิชาอะไรทำให้เด็กคนหนึ่งยอมให้ไฟเผาตัวเอง ข้ารู้แค่ว่าคนสอนมันสมควรโดนทวนจิ้มสักที"],
        [N_ZHAO, "กระดาษนั่นเขียนว่าอะไร… 'ผู้ใดปรารถนาวิชานี้ จงตัดวังในตนเสียก่อน' — ตัดวัง? วังใคร? วังนี้ใหญ่จะตาย ตัดยังไงหมด"],
        "เจ้าพับกระดาษเก็บ ลายมือเด็กคนนั้นเขียนคำว่า **วัง** ซ้ำจนกระดาษทะลุ",
      ],
      go: "เก็บกระดาษไว้กับเข็ม",
    },
    reward: [
      { t: "wExp", amount: 150 },
      { t: "trait", trait: "fame", amount: 2 },
      { t: "npcRelationship", npcId: ZHAO, amount: 5 },
    ],
  },

  // ── 3 ──
  {
    title: "เข็มเล่มนั้นของใคร",
    summary: "หมอหลินขอดูเข็มและด้ายแดง ยาเย็นบนด้ายเป็นยาที่ใช้กับคนที่เพิ่งผ่านโทษตอน — และคนเขียนบรรทัดนั้นกำลังป่วยด้วยไฟในเส้นลมปราณ ระหว่างนี้มีมือมีดราตรีตามเจ้าทุกตรอก",
    giver: LIN,
    offer: {
      lines: [
        "หมอหลินคีบเข็มขึ้นส่องกับแสงตะวัน แล้วดมด้ายแดงนานเกินกว่าที่หมอปกติจะดม",
        [N_LIN, "ยาเย็นกลิ่นนี้ ข้าเคยปรุงให้วังครั้งเดียวในชีวิต… สำหรับเด็กชายที่เพิ่งผ่านโทษตอน มันห้ามเลือดและดับไข้"],
        [N_LIN, "แต่คนที่ทาไว้บนเข็มไม่ได้ใช้มันห้ามเลือดคนอื่น เขาใช้มันกับตัวเองทุกวัน จนกลิ่นติดด้าย — **เขากำลังดับไฟในตัวเอง**"],
        [N_LIN, "อีกเรื่อง ตั้งแต่เจ้าเดินเข้าร้านมา มีคนถือมีดสั้นยืนอยู่ปากตรอกสามคน และหลังคาอีกหนึ่ง"],
        [N_LIN, "ไล่พวกมันไปให้หมดก่อน แล้วไปดูร้านด้ายไหมหน้าวัง ข้าอยากรู้ว่าด้ายแดงนี่เบิกออกมาในชื่อใคร"],
      ],
      go: "ออกไปจัดการคนในตรอก",
    },
    steps: [
      { t: "hunt", opponentId: "night_blade", count: 4, hint: "ไล่มือมีดราตรีที่ตามเจ้าทุกตรอก 4 คน (พบระหว่างเดินทาง)" },
      { t: "visit", locationId: "city_capital", label: "สืบที่ร้านด้ายไหมหน้าวัง", hint: "ไปร้านด้ายไหมหน้าวังในนครหลวง ถามว่าด้ายแดงของกรมเย็บปักหลวงถูกเบิกออกไปในชื่อใคร",
        scene: { lines: [
          "ร้านด้ายไหมหน้าวังแขวนด้ายเป็นพวงหลากสี เถ้าแก่ร้านเห็นด้ายแดงในมือเจ้าแล้วรีบปิดบานหน้าต่าง",
          ["เถ้าแก่ร้านด้าย", "ด้ายนี้ขายไม่ได้ ข้าเพียงย้อมส่งกรมเย็บปักหลวงปีละสิบห่อ แต่ปีนี้เขาเบิกไปห้าสิบห่อ"],
          ["เถ้าแก่ร้านด้าย", "ผู้มารับไม่ใช่ช่างปัก เป็นเด็กหนุ่มหน้าซีดเหมือนกันหมด เดินไม่มีเสียงเท้า แล้วจ่ายเป็นทองแท่งประทับตราทางเหนือ"],
          ["เถ้าแก่ร้านด้าย", "ข้าถามว่าจะเอาไปปักอะไรเยอะขนาดนี้ เด็กคนหนึ่งตอบว่า 'ปักชื่อคนที่จะตาย' แล้วหัวเราะกันทั้งกลุ่ม"],
        ], go: "กลับไปบอกหมอหลิน" } },
    ],
    complete: {
      lines: [
        [N_LIN, "ทองแท่งตราทางเหนือ… ทัพของอ๋องเยียนจ่ายค่าด้ายให้กรมเย็บปักหลวงของฮ่องเต้เจี้ยนเหวิน ตลกดีไหมล่ะ"],
        [N_LIN, "ข้าตรวจร่างขันทีเงาที่จ้าวเทียหามมาเมื่อเช้า ชีพจรเขาร้อนเหมือนเหล็กในเตา เส้นลมปราณสายหยางไหม้เป็นทางยาว"],
        [N_LIN, "วิชาที่เขาฝึกให้ความเร็วโดยเผาตัวเองเป็นฟืน ตำราบอกให้เขา 'ตัด' เพื่อดับไฟ เขาไม่ได้ตัด ไฟเลยลามถึงหัวใจ"],
        [N_LIN, "ข้าเป็นหมอ ข้าบอกเจ้าได้อย่างเดียว — ตำราที่ต้องให้คนทำร้ายตัวเองก่อนถึงจะไม่ตาย ไม่ใช่ตำรา มันคือกับดัก"],
        [N_LIN, "แล้วอีกอย่าง เลิกเอาเข็มพิษมาจิ้มโต๊ะข้าเล่นได้แล้ว นั่นโต๊ะไม้หอม ข้าผ่อนอยู่"],
      ],
    },
    reward: [
      { t: "wExp", amount: 150 },
      { t: "item", itemId: "potion_mid", count: 3 },
      { t: "npcRelationship", npcId: LIN, amount: 4 },
    ],
  },

  // ── 4 ──
  {
    title: "ประมูลบรรทัดละแท่งทอง",
    summary: "เถ้าแก่โจวตลาดมืดได้ข่าวว่ามีคนขายวิชาต้องห้ามทีละบรรทัดที่โรงเตี๊ยมเฮ่อลั่ว เขาโกรธมาก — ไม่ใช่เพราะมันผิด แต่เพราะไม่มีใครแบ่งค่านายหน้าให้เขา",
    giver: BLACK,
    offer: {
      lines: [
        [N_BLACK, "ลูกนายหอ! ลูกค้าคนโปรด! คราวก่อนเจ้าทำให้ข้าเสียม้วนประทับดอกบัวไปหนึ่งม้วน คราวนี้เจ้าจะช่วยให้ข้าได้คืน"],
        [N_BLACK, "มีนางคนหนึ่งเปิดประมูลวิชาต้องห้ามที่โรงเตี๊ยมเฮ่อลั่ว ขายทีละบรรทัด บรรทัดละแท่งทอง ในเมืองของข้า โดยไม่บอกข้าสักคำ"],
        [N_BLACK, "ข้าไม่ได้ว่าขายวิชาผิดนะ ข้าก็ขาย ข้าว่าขายโดยไม่ผ่านข้ามันผิด ตลาดมืดก็มีมารยาท"],
        [N_BLACK, "ไปถามโปผู้เล่าเรื่องก่อน หมอนั่นฟังทุกโต๊ะในโรงเตี๊ยมแล้วเอามาเล่าเกินจริงสองเท่า หารสองก็ได้ความจริง"],
      ],
      go: "ไปโรงเตี๊ยมเฮ่อลั่ว",
      asides: [
        { say: "ถ้าข้าจับนางได้ ท่านจะเอาวิชานั้นไปขายต่อหรือเปล่า", reply: [
          [N_BLACK, "ข้า? ขายวิชาที่ทำให้คนต้องตอนตัวเอง? ลูกค้าข้าเป็นนักเลง ไม่ใช่คนบ้า ขายไม่ออกหรอก"],
          [N_BLACK, "…ถ้าขายออกข้าก็ไม่ขาย ข้ามีหลักการ หลักการคือข้าอยากอายุยืน"],
        ] },
      ],
    },
    steps: [
      { t: "talk", npcId: PO, locationId: "inn_heluo", label: "ถามโปผู้เล่าเรื่องเรื่องการประมูล", hint: "ถามโปผู้เล่าเรื่องที่โรงเตี๊ยมเฮ่อลั่วว่าการประมูลวิชาจัดที่ไหน เมื่อไร",
        scene: { lines: [
          [N_PO, "การประมูลน่ะหรือ! ข้าได้ยินว่าแขกมาพันคน ทองกองสูงเท่าเจดีย์ นางผู้ขายบินลงมาจากเพดานพร้อมกลีบดอกไม้!"],
          [N_PO, "…หารสองก็ได้ แขกห้าสิบคน ทองกองเท่าโต๊ะ นางเดินขึ้นบันไดมาธรรมดา แต่เดินไม่มีเสียงจริง ๆ"],
          [N_PO, "บรรทัดแรกที่นางอ่านให้ฟังฟรีเป็นของแถม คนทั้งห้องหัวเราะ — 'ผู้ใดปรารถนาวิชานี้ จงตัด**วัง**ในตนเสียก่อน'"],
          [N_PO, "แต่มีชายตัวโตจากทางเหนือคนหนึ่งไม่หัวเราะ เขาจดลงสมุด คืนนี้ยามสามมีรอบสุดท้ายที่ห้องชั้นบน"],
        ], go: "รอรอบยามสาม" } },
      { t: "duel", locationId: "inn_heluo", label: "บุกห้องประมูลชั้นบน", hint: "ขึ้นห้องชั้นบนของโรงเตี๊ยมเฮ่อลั่วยามสาม หยุดนางผู้ขายวิชา", opponentId: WIDOW,
        before: { cutscene: FILM_AUCTION, lines: [
          "ทูตทัพเหนือคว้าห่อทองแล้วกระโดดออกทางหน้าต่าง คนรับใช้ขุนนางมุดใต้โต๊ะ นางผู้ขายสะบัดแขนเสื้อ — ใยไหมเส้นบางวาวขึงทั่วห้อง",
          [N_WIDOW, "ด้ายของข้าตัดคอคนได้ง่ายกว่าตัดผ้า ยืนนิ่ง ๆ แล้วเจ้าจะตายสวย"],
        ], go: "ฝ่าใยไหม" },
        after: { lines: [
          [N_WIDOW, "พอ… พอแล้ว ข้าไม่ได้ท่องอะไรเองสักบรรทัด ข้าแค่รับกระดาษมาอ่านแล้วเผาทิ้งทีละแผ่น"],
          [N_WIDOW, "คนส่งกระดาษเป็นขันทีหน้าซีดคนละคนทุกคืน แต่ลายมือเป็นของคนคนเดียว — ลายมืองามเหมือนเส้นด้าย"],
          [N_WIDOW, "เขาจ่ายข้าส่วนหนึ่ง เก็บอีกส่วนไว้ซื้อเด็กจากหมู่บ้านที่อดอยาก ข้าไม่ถาม เพราะคนถามในงานนี้อายุสั้น"],
        ] } },
    ],
    complete: {
      lines: [
        [N_BLACK, "ซื้อเด็กด้วยเงินขายวิชา แล้วเอาเด็กไปฝึกวิชาที่ขาย… นี่มันไม่ใช่การค้า นี่มันเตาเผาคน"],
        [N_BLACK, "ข้าเป็นคนเลว ข้ารู้ตัว แต่ข้ามีลูกสาวสองคน ข้าไม่ขายเด็ก"],
        [N_BLACK, "เอาแผ่นกระดาษที่นางยังไม่ได้เผานี่ไป ลายมือแบบนี้ในนครหลวงมีคนเขียนได้ไม่ถึงห้าคน ไปถามเสมียนฉิง เขาจำลายมือคนได้แม่นกว่าจำหน้า"],
        [N_BLACK, "ส่วนค่านายหน้าของข้า… ช่างมันเถอะ คราวนี้ข้าฟรีให้ บอกใครเรื่องนี้ ข้าจะขึ้นราคาเจ้าสองเท่า"],
      ],
    },
    reward: [
      { t: "gold", amount: 200 },
      { t: "wExp", amount: 180 },
      { t: "trait", trait: "good", amount: 2 },
    ],
  },

  // ── 5 ──
  {
    title: "บัตรรายการที่ไม่ไหม้",
    summary: "เสมียนนายฉิงจำลายมือบนแผ่นกระดาษได้ทันที แล้วนึกขึ้นได้ว่าบิดาของเจ้าทิ้งบัตรรายการหมวดต้องห้ามไว้ใต้แท่นหินในซากหอ — บัตรที่เขียนว่าต้นฉบับไม่เคยเข้าหอ",
    giver: QING,
    offer: {
      lines: [
        [N_QING, "ลายมือนี้… ลายมือเส้นด้าย ทั้งวังเรียกอย่างนั้น เป็นของเจ้ากรมเย็บปักหลวง ขันทีใหญ่กู้ชิวเซิง"],
        [N_QING, "เขาเคยมาขอยืมตำราในหอทุกเดือน นายท่านไม่เคยให้ยืมหมวดต้องห้าม แต่เขาไม่ต้องยืม — เขาท่องจำมันได้ตั้งแต่สมัยกวาดพื้น"],
        [N_QING, "เดี๋ยวนะ นายท่านเคยให้ข้าเขียนบัตรรายการหมวดต้องห้ามใหม่ทั้งเจ็ดใบก่อนเผาม้วนจริง ใบหนึ่งท่านเขียนหมายเหตุเองด้วยหมึกแดง"],
        [N_QING, "บัตรพวกนั้นท่านเก็บใต้แผ่นหินอีกแผ่นในซากหอ ไม่ใช่แผ่นใต้แท่นฝนหมึกที่เจ้าเคยยก อีกแผ่นข้างเตาถ่าน"],
        [N_QING, "เอากระดาษสาไปด้วย ถ้าบัตรเปื่อย ข้าจะคัดลอกให้ใหม่ ข้าคัดลอกมาทั้งชีวิต มือข้ายังจำได้แม้ใจข้าจะกลัว"],
      ],
      go: "ไปเตรียมกระดาษ แล้วเข้าซากหอ",
    },
    steps: [
      { t: "gather", itemId: "paper", count: 5, hint: "หากระดาษสา 5 แผ่นให้เสมียนนายฉิงใช้คัดลอกบัตรที่เปื่อย" },
      { t: "visit", locationId: "palace_royal", label: "ยกแผ่นหินข้างเตาถ่านในซากหอ", hint: "เข้าซากหอคัมภีร์หลวงในพระราชวังหลวงยามค่ำ ยกแผ่นหินข้างเตาถ่านที่บิดาเคยเผาม้วนต้องห้าม",
        scene: { cutscene: FILM_BURNING, lines: [
          "ใต้แผ่นหินข้างเตาถ่านมีห่อผ้าน้ำมัน บัตรรายการเจ็ดใบเรียงกันเรียบร้อย ทุกใบเขียนว่า 'เผาแล้ว' ด้วยลายมือของบิดา",
          "ใบที่เจ็ดเขียนชื่อว่า **คัมภีร์ทานตะวัน** ใต้ชื่อมีหมายเหตุด้วยหมึกแดง ตัวอักษรเล็กแต่หนักแน่น",
          [N_FATHER, "ฉบับในหอเป็นสำเนาที่ขันทีราชวงศ์หยวนคัดลอก อ่านอักษรตัวแรกผิด ต้นฉบับไม่เคยเข้าหอนี้ — สอบถามพระสนมในตำหนักเย็น"],
          "ท้ายบัตรมีอีกบรรทัดที่เขียนทีหลัง หมึกจางกว่า: 'ถ้าลูกพ่อมาถึงบัตรใบนี้ ขอโทษที่ทิ้งงานค้างไว้ให้อีกชิ้น'",
        ], go: "กอดบัตรใบนั้นไว้ครู่หนึ่ง" } },
    ],
    complete: {
      lines: [
        [N_QING, "นายท่าน… ท่านรู้ว่าเรื่องนี้ยังไม่จบตั้งแต่ตอนนั้น"],
        [N_QING, "ข้าคัดลอกบัตรให้ใหม่แล้ว เก็บฉบับจริงไว้ ลายมือพ่อไม่ควรอยู่ในห่อผ้าน้ำมันใต้แผ่นหิน มันควรอยู่กับลูก"],
        [N_QING, "พระสนมในตำหนักเย็น… ทั้งวังมีพระสนมที่ถูกลืมอยู่องค์เดียว ชุ่ยเอ๋อเอายาไปให้ทุกคืน"],
        [N_QING, "ถ้าพระสนมเป็นคนบอกนายท่านว่าม้วนนั้นอ่านผิด แปลว่านางรู้ว่าอ่านถูกต้องอ่านอย่างไร ไปเถิด ก่อนลายมือเส้นด้ายจะไปถึงนางก่อน"],
      ],
    },
    reward: [
      { t: "wExp", amount: 150 },
      { t: "npcRelationship", npcId: QING, amount: 5 },
      { t: "item", itemId: "ink", count: 3 },
    ],
  },

  // ── 6 ──
  {
    title: "ตำหนักเย็น",
    summary: "ชุ่ยเอ๋อพาเจ้าไปเฝ้าพระสนมชราหลานอวี้ในตำหนักเย็น นางเป็นลูกสาวของผู้เขียนคัมภีร์ — และคืนเดียวกันนั้น หน้ากากเข็มแดงก็มาถึง",
    giver: CUI,
    offer: {
      lines: [
        [N_CUI, "พระสนมขอพบเจ้าเอง! ทั้งปีนางไม่เคยขอพบใครนอกจากหมอหลินกับข้า แล้วก็แมวสีส้มที่ขโมยปลาจากห้องเครื่อง"],
        [N_CUI, "นางเข้าวังมาตั้งแต่ราชวงศ์หยวนแตก ฮ่องเต้หงอู่รับนางเป็นพระสนมแค่ปีเดียว แล้วก็ลืมนางไปสามสิบปี"],
        [N_CUI, "ถือกล่องยานี่ไว้ ใครถามก็บอกว่าเจ้าเป็นคนถือกล่องยาให้ข้า เหมือนคราวก่อน… เจ้าถือเก่งมาก ข้าชมจริง"],
        [N_CUI, "อ้อ พระสนมไม่ชอบคนพูดเสียงดัง ไม่ชอบคนรีบ และไม่ชอบคนที่จ้องเข็มของนางนานเกินไป"],
      ],
      go: "ถือกล่องยาตามไป",
    },
    steps: [
      { t: "visit", locationId: "palace_royal", label: "เฝ้าพระสนมในตำหนักเย็น", hint: "ไปตำหนักเย็นกับชุ่ยเอ๋อยามสอง เฝ้าพระสนมชราหลานอวี้",
        scene: { cutscene: FILM_COLD_PALACE, lines: [
          [N_CONSORT, "แม่ของข้าชื่อ **คุยเหนียง** เป็นนางกำนัลปักผ้าในวังของราชวงศ์หยวน เข็มของนางเร็วจนช่างปักทั้งกรมเรียกนางว่าเข็มไร้เงา"],
          [N_CONSORT, "นางเขียนวิชาของนางไว้เล่มหนึ่ง ขันทีหยวนขโมยร่างไปคัดลอก แล้วอ่านอักษรตัวแรกผิด สำเนานั้นกินเด็กหนุ่มไปนับไม่ถ้วน"],
          [N_CONSORT, "ต้นฉบับจริง แม่ปักลงบนเสื้อคลุมลายทานตะวัน ข้าใส่มันเข้าวังนี้… แล้วข้าก็เลาะมันออกเป็นห้าผืน ฝากไว้กับห้าคน"],
          [N_CONSORT, "เพราะวังนี้มีคนจำได้ว่าเสื้อตัวนั้นเป็นของใคร และวังนี้ไม่เคยลืมสิ่งที่มันอยากได้"],
        ], go: "ถามว่าห้าคนนั้นเป็นใคร" } },
      { t: "duel", locationId: "palace_royal", label: "ขวางหน้ากากเข็มแดงที่ประตูตำหนัก", hint: "หยุดหน้ากากเข็มแดงที่บุกตำหนักเย็นกลางดึก", opponentId: MASK,
        before: { lines: [
          "ตะเกียงดวงเดียวดับวูบ เข็มสามเล่มปักอยู่บนเสาตรงระดับคอของชุ่ยเอ๋อพอดี — ห่างไปแค่ครึ่งนิ้ว",
          [N_MASK, "พระสนมเพคะ กระหม่อมมาขอเสื้อคลุมทานตะวัน ไม่ว่ามันจะเหลือกี่ผืน"],
          [N_CUI, "กรี๊ด— ข้าไม่ได้กรี๊ดนะ ข้าแค่ส่งสัญญาณ! จ้าวเทีย!"],
        ], go: "ยืนขวางหน้าพระสนม" },
        after: { cutscene: FILM_MASK_FLEES, lines: [
          "หน้ากากเข็มแดงหายไปบนหลังคา ทิ้งกลิ่นยาเย็นกับรอยเท้าไหม้บนกระเบื้อง ชุ่ยเอ๋อนั่งลงกับพื้น มือยังกำกล่องยาแน่น",
          [N_CONSORT, "เขาคือเด็กกวาดพื้นคนนั้น… กู้ชิวเซิง สามสิบปีก่อนเขาเคยช่วยข้าหิ้วถังน้ำ แล้วถามว่าเสื้อลายทานตะวันของข้าตัดเย็บที่ไหน"],
        ] } },
    ],
    complete: {
      lines: [
        [N_CONSORT, "ห้าคนที่ข้าฝากผ้าไว้ ข้าบอกได้แค่สามคน อีกสองคนเจ้าต้องหาเอง เพราะข้าสัญญากับพวกเขาว่าจะไม่เอ่ยชื่อ"],
        [N_CONSORT, "ผืนแรกอยู่กับบ้านช่างทอที่ซูโจว ผืนที่สองอยู่กับครูที่สอนข้าอ่านหนังสือ เขาถูกเนรเทศไปเมืองหิมะ ผืนที่สามถูกพวกเม้งก่าชิงไปเมื่อสี่สิบปีก่อน"],
        [N_CONSORT, "ไปหาให้ครบก่อนเด็กกวาดพื้นคนนั้น ไม่ใช่เพื่อให้เจ้าได้วิชา… เพื่อให้มีคนอ่านมันถูกเสียทีหลังจากแปดสิบปี"],
        [N_CUI, "แล้วเด็กกวาดพื้นคนนั้นก็รู้แล้วว่าพระสนมยังมีชีวิต… ข้าจะนอนเฝ้าที่นี่ทุกคืน ถึงข้าจะกลัวจนฟันกระทบกันก็ตาม"],
      ],
      go: "รับคำพระสนม",
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 150 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: CUI, amount: 5 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// ACT 2 · ผ้าห้าผืน (7–13)
// The panels: a Suzhou weaver's house (a renegade Brocade Guard gets there
// first), the exiled scholar in the snow city who taught the consort to
// read (and was exiled for reading one character two ways), the Sun-Moon
// sect whose "abridged" sunflower came from a stolen panel, and the north's
// envoy hunting them in Jinling. Sewn together, the panels still begin
// "จงตัดวังในตน" — and ขันทีเกา turns pale: he has read it before.
// ═════════════════════════════════════════════════════════════════════

const FILM_KUI: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "past",
  title: "แปดสิบปีก่อน", subtitle: "กรมปักผ้า วังของราชวงศ์หยวน",
  cast: {
    kui: { name: N_KUI, look: "f2", at: [-1, 0], facing: "right", tint: SUN },
    yuan: { name: "ขันทีหยวนผู้คัดลอก", look: "m3", at: [5, 0], facing: "left", tint: YUAN_GREY, hidden: true },
  },
  beats: [
    ["narrate", "แปดสิบปีก่อน ในวังของราชวงศ์หยวน นางกำนัลชาวฮั่นคนหนึ่งปักผ้าเร็วจนเข็มไม่ทิ้งเงา"],
    ["think", "kui", "ทานตะวันไม่เคยวิ่งตามตะวัน มันแค่หันไป… ใจเบาเท่าไร กายก็หันได้เร็วเท่านั้น"],
    ["act", "kui", "attack"],
    ["fx", "sparkle", "kui"],
    ["say", "kui", "อักษรตัวแรกของวิชาข้าคือ 'วัง' — วังที่คนสร้างขังตัวเองไว้ในใจ ใครอยากเบา ต้องตัดวังนั้นก่อน"],
    ["enter", "yuan", [5, 0]],
    ["move", "yuan", [2, 0]],
    ["say", "yuan", "นางกำนัลเขียนหนังสือได้ด้วยหรือ ส่งมา ของทุกอย่างในวังเป็นของวัง"],
    ["fx", "flash", "yuan"],
    ["think", "yuan", "'ตัดวัง'… ในภาษาของวังมีความหมายเดียว — โทษตอน ช่างเหมาะกับพวกเราเหลือเกิน"],
    ["narrate", "คืนนั้นคุยเหนียงหนีออกจากวัง เหลือไว้เพียงร่างแรกที่ถูกคัดลอกผิดหนึ่งตัวอักษร และอักษรตัวนั้นกินคนมาแปดสิบปี"],
    ["fade", "out"],
  ],
};

const FILM_LOOM: CutsceneSpec = {
  stage: "city_suzhou", around: WEAVER, mood: "dusk",
  title: "กี่ทอผ้าที่ซูโจว",
  cast: {
    weaver: { name: N_WEAVER, look: "f2", at: [-1, 0], facing: "right" },
    brocade: { name: N_BROCADE, look: "foe_constable", at: [5, 1], facing: "left", tint: "#7a2e2e", hidden: true },
    hero: { name: "{hero}", look: "hero", at: [-4, 1], facing: "right" },
  },
  beats: [
    ["narrate", "เสียงกี่ทอผ้าดังเป็นจังหวะ จนกระทั่งเสียงฝีเท้าหนัก ๆ กลบมัน"],
    ["enter", "brocade", [5, 1]],
    ["move", "brocade", [2, 1]],
    ["say", "brocade", "ป้ายข้าถูกฉีกตราไปแล้ว แต่ดาบยังไม่ถูกฉีก ผ้าลายทานตะวันอยู่ไหน แม่ช่างทอ"],
    ["say", "weaver", "ข้าทอผ้าวันละสามพับ ทานตะวันมีทุกพับ ท่านจะเอาพับไหน"],
    ["say", "brocade", "พับที่มีตัวหนังสือซ่อนในตะเข็บ ผู้ซื้อทางเหนือจ่ายดีกว่าเบี้ยหวัดเสื้อแพรสิบปี"],
    ["act", "brocade", "attack"],
    ["fx", "slash", "weaver"],
    ["move", "hero", [0, 1], "run"],
    ["act", "hero", "guard"],
    ["fade", "out"],
  ],
};

const FILM_SNOW_SCHOLAR: CutsceneSpec = {
  stage: "city_lingxiao", around: SIMA, mood: "snow",
  title: "เมืองหิมะ", subtitle: "บัณฑิตผู้อ่านผิดหนึ่งตัว",
  cast: {
    sima: { name: N_SIMA, look: "m1", at: [0, 0], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [-3, 1], facing: "right" },
    child: { name: "เสี่ยวเสวี่ย", look: "city_lingxiao_child_xue", at: [4, 1], facing: "left", hidden: true },
  },
  beats: [
    ["narrate", "หิมะตกลงบนพัดเก่าของบัณฑิตที่โบกไฟให้เตาอุ่น ทั้งที่ไฟไม่เคยติดเพราะหิมะ"],
    ["say", "sima", "ลูกศิษย์ข้าในวังส่งเจ้ามาหรือ หลานอวี้… นางยังอ่านหนังสือกลับหัวเวลาเบื่ออยู่ไหม"],
    ["enter", "child", [4, 1]],
    ["act", "child", "attack"],
    ["fx", "ice", "sima"],
    ["say", "child", "โดนแล้ว! ท่านบัณฑิตแพ้อีกแล้ว!"],
    ["say", "sima", "ข้าแพ้ลูกหิมะเด็กหกขวบทุกวัน แพ้ขันทีในวังครั้งเดียว ครั้งนั้นแพงกว่า"],
    ["think", "hero", "ยิ้มเศร้าเหมือนที่คนในเมืองว่าจริง ๆ"],
    ["fade", "out"],
  ],
};

const FILM_SNOW_SHADOWS: CutsceneSpec = {
  stage: "city_lingxiao", around: SIMA, mood: "snow",
  title: "รอยเท้าที่ไม่จมหิมะ",
  cast: {
    hero: { name: "{hero}", look: "hero", at: [-1, 1], facing: "right" },
    sima: { name: N_SIMA, look: "m1", at: [-4, 0], facing: "right" },
    s1: { name: N_SHADOW, look: "foe_assassin", at: [5, -1], facing: "left", tint: GREY_ROBE, hidden: true },
    s2: { name: N_SHADOW, look: "foe_assassin", at: [5, 2], facing: "left", tint: GREY_ROBE, hidden: true },
  },
  beats: [
    ["narrate", "หิมะหนาครึ่งแข้ง แต่รอยเท้าที่ตามมาจากประตูเมืองตื้นเหมือนคนเดินบนผงแป้ง"],
    ["enter", "s1", [5, -1]],
    ["enter", "s2", [5, 2]],
    ["move", "s1", [2, -1], "run-with"],
    ["move", "s2", [2, 2], "run"],
    ["say", "s1", "ท่านอาจารย์ใหญ่สั่งมา ผ้าผืนที่สองกับบัณฑิตปากมาก — เอาไปทั้งคู่"],
    ["say", "sima", "ปากมากหรือ ข้าพูดวันละสามประโยคเพราะหนาวจนปากแข็ง"],
    ["fx", "ice", "s2"],
    ["think", "hero", "ร้อนจนหิมะละลายรอบตัวมัน… ไฟในตัวพวกนี้ลุกโชนกว่าคนในวังเสียอีก"],
    ["fade", "out"],
  ],
};

const FILM_MING_THEFT: CutsceneSpec = {
  stage: "sect_ming", mood: "past",
  title: "สี่สิบปีก่อน", subtitle: "ถนนคาราวานนอกเมืองหลวงเก่า",
  cast: {
    young: { name: "หลานอวี้ในวัยสาว", look: "f1", at: [-2, 0], facing: "right", tint: OLD_SILK },
    cult: { name: "ผู้อาวุโสเม้งก่า", look: "foe_cultist", at: [4, 0], facing: "left", tint: "#c0392b", hidden: true },
  },
  beats: [
    ["narrate", "สี่สิบปีก่อน ก่อนราชวงศ์หยวนล่มไม่กี่ปี หญิงสาวคนหนึ่งเดินทางไปกับคาราวานผ้า สวมเสื้อคลุมลายทานตะวัน"],
    ["enter", "cult", [4, 0]],
    ["move", "cult", [1, 0], "run"],
    ["say", "cult", "เปลวเพลิงศักดิ์สิทธิ์ต้องการวิชาเร็วเพื่อสู้กับทัพมองโกล นางคงไม่ว่าอะไร"],
    ["act", "cult", "attack"],
    ["fx", "slash", "young"],
    ["say", "young", "เอาไปผืนเดียวพอ แล้วจำไว้ — อ่านไม่ครบ ใช้ไม่ได้ ใช้ไม่ถูก ก็จะเจ็บเอง"],
    ["think", "cult", "ผืนเดียวก็เร็วกว่าที่ข้าเคยเห็น… พรรคเราย่อมันได้"],
    ["narrate", "เศษผ้าผืนนั้นกลายเป็นคัมภีร์ทานตะวันฉบับย่อของพรรคที่สืบทอดเปลวเพลิงมาจนวันนี้"],
    ["fade", "out"],
  ],
};

const FILM_SEWING: CutsceneSpec = {
  stage: "palace_royal", around: CUI, mood: "night",
  title: "เย็บคืนเป็นผืน", subtitle: "ตำหนักเย็น",
  cast: {
    consort: { name: N_CONSORT, look: "f4", at: [0, -1], facing: "left", tint: OLD_SILK },
    cui: { name: N_CUI, look: CUI, at: [-3, 0], facing: "right" },
    gao: { name: N_GAO, look: "m3", at: [4, 0], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [-1, 1], facing: "right" },
  },
  beats: [
    ["narrate", "ผ้าสามผืนวางเรียงบนโต๊ะ พระสนมเย็บมันเข้าหากันด้วยเข็มที่เร็วจนตะเกียงไม่ทันสั่น"],
    ["fx", "sparkle", "consort"],
    ["say", "consort", "ทานตะวันสามในห้าดอก… ตัวอักษรในตะเข็บต่อกันแล้ว อ่านดูสิ ลูกนายหอ"],
    ["say", "hero", "'ผู้ใดปรารถนาวิชานี้ จงตัดวังในตนเสียก่อน'… ต้นฉบับก็เขียนอย่างนี้เหมือนกัน"],
    ["say", "cui", "ก็เหมือนกันหมดเลยนี่เพคะ! ข้าอุตส่าห์หวังว่าแม่ของพระสนมจะเขียนว่า 'จงกินข้าวให้อิ่มเสียก่อน'"],
    ["camera", "gao", 2.2],
    ["think", "gao", "เหมือนกันทุกตัวอักษร… เหมือนคืนนั้นทุกตัวอักษร"],
    ["act", "gao", "hurt"],
    ["say", "gao", "พระสนม… กระหม่อมขอตัวก่อน"],
    ["exit", "gao"],
    ["say", "consort", "ปล่อยเขาไป สามสิบปีที่เขาไม่เคยอ่านมันอีก วันนี้เขาเพิ่งได้อ่านซ้ำ"],
    ["fade", "out"],
  ],
};

const ACT2: readonly StoryChapterSpec[] = [
  // ── 7 ──
  {
    title: "เรื่องของคุยเหนียง",
    summary: "ขันทีเกาเล่าเรื่องนางกำนัลปักผ้าแห่งวังหยวนผู้เขียนวิชานี้ และขันทีผู้คัดลอกที่อ่านผิดหนึ่งตัวอักษร ผ้าผืนแรกอยู่ที่บ้านช่างทอในซูโจว",
    giver: GAO,
    require: all(stat("AGI", 120), { t: "trait", trait: "fame", min: 20 }),
    offer: {
      cutscene: FILM_KUI,
      lines: [
        [N_GAO, "พระสนมเล่าให้ข้าฟังตั้งแต่ข้ายังเป็นเด็กกวาดพื้น ข้าเล่าต่อให้เจ้าฟังวันนี้ ลดลงครึ่งหนึ่ง เพราะข้าพูดไม่เก่งเท่านาง"],
        [N_GAO, "ขันทีหยวนคนนั้นสอนสำเนาของเขาให้ขันทีรุ่นหลัง รุ่นแล้วรุ่นเล่า ทุกคนตัดตัวเองก่อนเปิดหน้าที่สอง เพราะหน้าแรกสั่งไว้อย่างนั้น"],
        [N_GAO, "ทุกคนได้ความเร็ว ไม่มีใครได้ความสงบ ไฟในเส้นลมปราณเผาพวกเขาทีละคน เร็วบ้าง ช้าบ้าง"],
        [N_GAO, "บ้านช่างทอที่ซูโจวรับซ่อมเสื้อของพระสนมเมื่อสามสิบปีก่อน แล้วไม่เคยส่งคืนผืนหนึ่ง นั่นคือสิ่งที่นางขอ"],
        [N_GAO, "ช่างทอชอบผ้าไหมดี ๆ มากกว่าเงิน เอาไปฝากนางสักสามพับ คนที่ทอผ้าให้วังมาทั้งชีวิตเกลียดคนที่มาตัวเปล่า"],
      ],
      go: "ออกเดินทางไปซูโจว",
      asides: [
        { say: "ท่านรู้เรื่องนี้ละเอียดเหลือเกิน", reply: [
          [N_GAO, "คนกวาดพื้นได้ยินทุกอย่าง เพราะไม่มีใครเห็นคนกวาดพื้น"],
          [N_GAO, "…ถามต่ออีกคำ ข้าจะนับกระสอบข้าวผิดให้เจ้าแบกใหม่"],
        ] },
      ],
    },
    steps: [
      { t: "gather", itemId: "silk", count: 3, hint: "หาผ้าไหม 3 พับไปฝากช่างทอเหมยที่ซูโจว" },
      { t: "talk", npcId: WEAVER, locationId: "city_suzhou", label: "ขอผ้าลายทานตะวันจากช่างทอเหมย", hint: "ไปซูโจว ถามช่างทอเหมยเรื่องผ้าลายทานตะวันที่บ้านนางรับซ่อมเมื่อสามสิบปีก่อน",
        scene: { lines: [
          [N_WEAVER, "ผ้าไหมสามพับ… ทอที่หางโจว เนื้อแน่น ย้อมดี เจ้ารู้จักเลือก หรือคนส่งเจ้ามารู้จักเลือก"],
          [N_WEAVER, "เสื้อคลุมทานตะวันน่ะหรือ อาจารย์ของข้ารับซ่อมจากวัง แล้วเห็นว่าตะเข็บบนดอกทานตะวันไม่ใช่ลาย มันคือตัวหนังสือ"],
          [N_WEAVER, "นางเลาะไว้ผืนหนึ่งเป็นแบบ แล้วเย็บกลับคืนด้วยผ้าใหม่ ก่อนตายนางสั่งข้าว่าถ้ามีคนจากวังมาขอ ให้ดูว่าคนนั้นมาด้วยมือหรือด้วยดาบ"],
          [N_WEAVER, "เมื่อวานมีคนมาด้วยดาบ ข้าบอกว่าพรุ่งนี้ค่อยมา วันนี้เจ้ามาด้วยผ้าไหม… แต่พรุ่งนี้ของเขาคือคืนนี้"],
        ], go: "อยู่เฝ้าบ้านช่างทอคืนนี้" } },
    ],
    complete: {
      lines: [
        "นกพิราบสื่อสารของขันทีเกาบินกลับวังพร้อมจดหมายของเจ้า ครึ่งวันต่อมามันบินกลับมาพร้อมคำตอบสั้นที่สุดเท่าที่เคยเห็น",
        [N_GAO, "'คนมาด้วยดาบคือเสื้อแพรที่ถูกฉีกตรา ข้ารู้จัก เขาเคยเป็นคนดี อย่าฆ่าเขาถ้าไม่จำเป็น — เกา'"],
        [N_GAO, "'ป.ล. ข้าไม่ได้เขียนจดหมายยาวกว่านี้มาสิบปี มือข้าเมื่อย'"],
      ],
    },
    reward: [
      { t: "wExp", amount: 180 },
      { t: "npcRelationship", npcId: WEAVER, amount: 5 },
      { t: "item", itemId: "potion_mid", count: 2 },
    ],
  },

  // ── 8 ──
  {
    title: "ตะเข็บซ่อนอักษร",
    summary: "เสื้อแพรไร้ตรามาถึงบ้านช่างทอตามนัด หลังจากนั้นผ้าผืนแรกก็อยู่ในมือเจ้า แต่ตะเข็บของมันอ่านไม่ออก — พ่อค้าหนังสือลี่อาจรู้วิธี",
    giver: WEAVER,
    offer: {
      lines: [
        [N_WEAVER, "ข้าซ่อนผ้าไว้ในที่ที่ไม่มีใครค้น — ใต้กองผ้าเช็ดเท้า ผู้ชายในวังไม่มีวันจับผ้าเช็ดเท้า"],
        [N_WEAVER, "แต่ก่อนจะเอาให้เจ้า ข้าอยากเห็นว่าเจ้ากันดาบเขาออกจากกี่ทอของข้าได้หรือไม่ กี่นี้อายุแก่กว่าข้า"],
        [N_WEAVER, "แล้วไปหาพ่อค้าหนังสือลี่ข้างสะพาน ตะเข็บแบบนี้ไม่ใช่อักษรธรรมดา มันคือขีดของตัวอักษรที่ถูกแยกออกจากกัน"],
        [N_WEAVER, "ลี่อ่านตำราเก่ามามากกว่ากินข้าว เขาจะรู้ว่าต้องอ่านทางไหน"],
      ],
      go: "รอคนถือดาบ",
    },
    steps: [
      { t: "duel", locationId: "city_suzhou", label: "กันเสื้อแพรไร้ตราออกจากบ้านช่างทอ", hint: "ปกป้องบ้านช่างทอเหมยในซูโจวจากเสื้อแพรไร้ตรา", opponentId: BROCADE,
        before: { cutscene: FILM_LOOM, lines: [
          [N_BROCADE, "เจ้าคือลูกนายหอที่ฉีกบัญชีแจกทุกสำนัก… คนดีเกินไปมักจนตาย ข้าเคยเป็นคนดี ข้ารู้"],
          [N_WEAVER, "ห้ามโดนกี่ทอ! ใครโดนกี่ทอ ข้าจะคิดค่าเสียหายทั้งสองคน!"],
        ], go: "สู้" },
        after: { lines: [
          [N_BROCADE, "ข้ารับใช้กรมองครักษ์สิบปี จับคน ขนคัมภีร์ เขาฉีกตราข้าทิ้งตอนฮ่องเต้องค์ใหม่สั่งลดกำลัง เมียข้ายังต้องกินข้าว"],
          [N_BROCADE, "คนจ่ายเงินข้าคือคนของกรมเย็บปักหลวง เขาบอกว่าผ้าผืนเดียวพอซื้อนาได้สิบไร่… ข้าไม่อยากได้นา ข้าอยากได้ตราคืน"],
          "เขาวางดาบลงบนพื้น แล้วเดินออกไปทางสะพานโดยไม่หันหลังมา บนดาบมีรอยตราเก่าที่ถูกขูดออก",
        ] } },
      { t: "talk", npcId: BOOKS, locationId: "city_suzhou", label: "ให้พ่อค้าหนังสือลี่อ่านตะเข็บ", hint: "เอาผ้าผืนแรกไปให้พ่อค้าหนังสือลี่ข้างสะพานในซูโจวดูวิธีอ่านตะเข็บ",
        scene: { lines: [
          [N_BOOKS, "โอ้… โอ้! ตะเข็บแยกขีด! ข้าเคยอ่านเจอในบันทึกช่างปักราชวงศ์ซ่ง แต่ไม่เคยเห็นของจริง ขอข้าจับอีกทีได้ไหม แค่ทีเดียว"],
          [N_BOOKS, "ฟังนะ ทุกฝีเข็มคือหนึ่งขีด เข็มขึ้นคือขีดนอน เข็มลงคือขีดตั้ง ด้ายเปลี่ยนสีคือขึ้นตัวใหม่ อ่านเรียงตามที่กลีบทานตะวันหัน"],
          [N_BOOKS, "แต่ผืนเดียวอ่านได้แค่เศษประโยค ขีดของตัวอักษรหนึ่งตัวอาจแยกอยู่ในสองผืน คนเขียนไม่อยากให้ใครอ่านได้จากผ้าผืนเดียว"],
          [N_BOOKS, "ข้าลอกวิธีอ่านลงกระดาษให้แล้ว… แลกกับให้ข้าดูผ้าอีกสักครึ่งชั่วยาม ได้ไหม ข้าไม่ขโมยหรอก ข้าแค่ร้องไห้ใส่"],
        ], go: "ให้เขาดูครึ่งชั่วยาม" } },
    ],
    complete: {
      lines: [
        [N_WEAVER, "ผืนนี้เป็นของเจ้าแล้ว อาจารย์ข้าบอกว่าผ้าที่เก็บไว้นานเกินไปจะกลายเป็นฝุ่น ผ้าต้องได้ใช้"],
        [N_WEAVER, "เจ้าเห็นไหม ดอกทานตะวันบนผืนนี้หันไปทางซ้าย อาจารย์ข้าบอกว่าดอกบนผืนอื่นหันไปคนละทาง — เย็บรวมกันแล้วดอกทั้งหมดจะหันไปที่เดียว"],
        [N_WEAVER, "ไปที่ไหนต่อ เมืองหิมะหรือ ใส่เสื้อหนา ๆ คนซูโจวอย่างข้าเห็นหิมะทีไรเป็นหวัดทุกที"],
      ],
    },
    reward: [
      { t: "wExp", amount: 200 },
      { t: "gold", amount: 150 },
      { t: "item", itemId: "silk_robe", count: 1 },
    ],
  },

  // ── 9 ──
  {
    title: "บัณฑิตผู้อ่านผิดหนึ่งตัว",
    summary: "ซือหม่าเหยียนบัณฑิตเนรเทศในเมืองลิ้งเซียวเคยเป็นครูสอนหนังสือพระสนม และถูกไล่ออกจากนครหลวงเพราะอ่านอักษรตัวเดียวให้ฮ่องเต้ฟังสองแบบ ผ้าผืนที่สองของเขาถูกแช่แข็งไว้ในถ้ำน้ำแข็งไหม",
    giver: SIMA,
    offer: {
      cutscene: FILM_SNOW_SCHOLAR,
      lines: [
        [N_SIMA, "อักษรตัวนั้นจีนอ่านว่า **กง** แปลว่าวังก็ได้ แปลว่าโทษตอนก็ได้ ขึ้นกับว่าคนอ่านอยู่ในวังมานานแค่ไหน"],
        [N_SIMA, "ยี่สิบปีก่อน ฮ่องเต้หงอู่ให้ข้าอ่านสำเนาหมวดต้องห้ามถวาย ข้าอ่านทั้งสองความหมาย แล้วทูลว่าความหมายแรกน่าจะถูก"],
        [N_SIMA, "พระองค์ตรัสว่า 'บัณฑิตที่เห็นวังเป็นสิ่งที่ต้องตัด ไม่ควรอยู่ในวัง' ข้าก็เลยมาอยู่ที่นี่ ที่ที่ไม่มีวัง มีแต่หิมะ"],
        [N_SIMA, "ผ้าผืนที่หลานอวี้ฝากไว้ ข้าไม่กล้าเก็บในบ้าน ข้าฝากบัณฑิตเว่ยที่ถ้ำน้ำแข็งไหม เขาแช่มันไว้ในน้ำแข็งเหมือนแช่ไหมน้ำแข็งของเขา"],
        [N_SIMA, "ทางไปถ้ำมีหมาป่าหิมะ ระวังให้ดี พวกมันชอบคนแปลกหน้ามากกว่าข้า"],
      ],
      go: "ออกเดินทางไปถ้ำน้ำแข็งไหม",
    },
    steps: [
      { t: "hunt", opponentId: "frost_wolf", count: 4, hint: "ไล่หมาป่าหิมะบนทางไปถ้ำน้ำแข็งไหม 4 ตัว (พบระหว่างเดินทาง)" },
      { t: "talk", npcId: WEI, locationId: "cave_bingcan", label: "ขอผ้าในก้อนน้ำแข็งจากบัณฑิตเว่ย", hint: "ไปถ้ำน้ำแข็งไหม ขอให้เว่ยชิงเหวินสกัดผ้าผืนที่สองออกจากน้ำแข็ง",
        scene: { lines: [
          [N_WEI, "ซือหม่าส่งเจ้ามาหรือ เขายังโบกพัดใส่เตาที่ไม่มีไฟอยู่ไหม คนที่หวังว่าไฟจะติดกลางหิมะ ข้ารักเขาตรงนั้น"],
          "เว่ยชิงเหวินใช้สิ่วไม้เคาะก้อนน้ำแข็งใสก้อนหนึ่งจนแตกเป็นสองซีก ผ้าลายทานตะวันอยู่ข้างในเหมือนดอกไม้ที่หลับมายี่สิบปี",
          [N_WEI, "น้ำแข็งไม่ทำให้ไหมเสีย มันแค่ทำให้ทุกอย่างหยุดรอ ข้าเลือกถ้ำนี้แทนราชสำนักก็ด้วยเหตุผลเดียวกัน"],
          [N_WEI, "ดอกทานตะวันผืนนี้หันไปทางขวา ส่วนผืนในมือเจ้าหันไปทางซ้าย… ระหว่างกลางต้องมีอีกหลายดอกที่หันหน้าตรง"],
        ], go: "ห่อผ้าไว้ใต้เสื้อให้อุ่น" } },
    ],
    complete: {
      lines: [
        [N_SIMA, "สองผืนแล้วหรือ ดี… อ่านดูสิ ตะเข็บที่ต่อกันได้บอกว่าอะไร"],
        "เจ้าอ่านตามวิธีของพ่อค้าลี่ ขีดสองผืนประกอบกันได้เป็นประโยคสั้นหนึ่งประโยค",
        ["{hero}", "'ทานตะวันหันตามตะวัน แต่ไม่เคยเด็ดตะวันลงมากอด'"],
        [N_SIMA, "ฮ่า… นี่ไง ประโยคที่ไม่มีในสำเนาของวัง ขันทีหยวนคัดลอกแค่หน้าแรกกับท่าทาง แต่ทิ้งเหตุผลไว้ข้างหลัง"],
        [N_SIMA, "ระวังตัวคืนนี้ เมื่อเช้ามีคนแปลกหน้าห้าคนเข้าเมืองทางประตูตะวันออก หิมะไม่จมเท้าพวกมันเลย"],
      ],
    },
    reward: [
      { t: "wExp", amount: 200 },
      { t: "npcRelationship", npcId: SIMA, amount: 5 },
      { t: "item", itemId: "snow_lotus", count: 1 },
    ],
  },

  // ── 10 ──
  {
    title: "รอยเท้าที่ไม่จมหิมะ",
    summary: "ขันทีเงาห้าคนตามผ้ามาถึงเมืองหิมะ พวกมันเร็วกว่าคนในวัง และร้อนกว่า — หิมะละลายทุกที่ที่มันเหยียบ",
    giver: SIMA,
    offer: {
      lines: [
        [N_SIMA, "พวกมันล้อมบ้านข้าไว้แล้ว ห้าคน เดินวนเหมือนกาวนรอบศพ ข้ายังไม่ตายนะ ข้าแค่หนาว"],
        [N_SIMA, "ข้าสู้ไม่เป็น แต่ข้าอ่านเป็น อ่านท่าเดินของพวกมันออก — มันวิ่งเร็วเพราะเผาตัวเอง ยิ่งวิ่งนาน ยิ่งหอบหนัก"],
        [N_SIMA, "อย่าวิ่งไล่ ให้มันวิ่งเข้าหาเจ้าเอง ทานตะวันไม่วิ่งตามตะวัน จำประโยคเมื่อเช้าได้ไหม"],
        [N_SIMA, "แล้วระหว่างนั้น ลองอ่านขีดบนผ้าอีกรอบ ข้าว่าเจ้ายังอ่านตกไปหลายขีด สายตาคนรีบอ่านอะไรได้ครึ่งเดียว"],
      ],
      go: "ออกไปยืนกลางหิมะ",
    },
    steps: [
      { t: "duel", locationId: "city_lingxiao", label: "รับมือขันทีเงากลางหิมะ", hint: "เผชิญหน้าขันทีเงาที่ล้อมบ้านซือหม่าเหยียนในเมืองลิ้งเซียว", opponentId: SHADOW,
        before: { cutscene: FILM_SNOW_SHADOWS, lines: [
          "เจ้ายืนนิ่งกลางลาน หิมะเกาะไหล่ ขันทีเงาวิ่งวนเร็วขึ้นทุกรอบ ไอร้อนพวยพุ่งจากปากของพวกมันเหมือนกาน้ำเดือด",
          [N_SIMA, "อย่าตามมัน! …ข้าพูดกับเจ้านะ ไม่ได้พูดกับพวกมัน พวกมันตามอะไรก็ได้"],
        ], go: "รอให้มันเข้ามาเอง" },
        after: { lines: [
          "ขันทีเงาคนสุดท้ายล้มลงในกองหิมะ ไอขาวพวยขึ้นจากตัวมัน หิมะรอบกายละลายเป็นแอ่งน้ำ",
          [N_SHADOW, "ท่านอาจารย์ใหญ่บอกว่าวันพิธีตัดใกล้แล้ว… ผ่านพิธีแล้วไฟจะสงบ… ทำไมรุ่นพี่ที่ผ่านพิธีถึงยังร้อนอยู่ล่ะ"],
          [N_SIMA, "เพราะไฟไม่ได้อยู่ใต้ท้องเจ้า เด็กโง่ มันอยู่ในใจคนที่อยากได้ทุกอย่างเร็วเกินไป"],
        ] } },
      { t: "stat", stat: "INT", min: 80, hint: "ฝึกอ่านขีดบนผ้าจนค่าฉลาดถึง 80 — สายตาคนรีบอ่านได้ครึ่งเดียว" },
    ],
    complete: {
      lines: [
        [N_SIMA, "อ่านอีกครั้งสิ ทีนี้อ่านช้า ๆ"],
        ["{hero}", "'…ทานตะวันไม่เคยเด็ดตะวันลงมากอด มันจึงหันได้ทุกทิศโดยไม่ต้องย้ายราก'"],
        [N_SIMA, "นั่นแหละความเร็วที่แม่ของหลานอวี้หมายถึง ไม่ใช่วิ่งให้ถึงก่อน แต่ไม่ต้องแบกอะไรไปด้วย"],
        [N_SIMA, "ฝากบอกลูกศิษย์ข้า ว่าครูของนางยังอ่านหนังสือกลับหัวเวลาเบื่อเหมือนกัน… แล้วก็ฝากกลอนนี้ไปด้วย ข้าเขียนให้นางทุกปี ไม่เคยได้ส่ง"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "item", itemId: "paper", count: 3 },
    ],
  },

  // ── 11 ──
  {
    title: "ฉบับย่อของพรรคตะวันจันทรา",
    summary: "โปผู้เล่าเรื่องรู้นิทานที่พรรคตะวันจันทราไม่อยากให้ใครเล่า: คัมภีร์ทานตะวันฉบับย่อของพวกเขามาจากผ้าที่ชิงจากหญิงสาวบนถนนคาราวานเมื่อสี่สิบปีก่อน",
    giver: PO,
    offer: {
      lines: [
        [N_PO, "นิทานเรื่องนี้ข้าเล่าได้ครั้งเดียวต่อปี เพราะคืนที่ข้าเล่า จะมีคนจากพรรคตะวันจันทรามานั่งฟังแถวหน้า แล้วไม่ปรบมือ"],
        [N_PO, "สี่สิบปีก่อน ผู้อาวุโสเม้งก่าคนหนึ่งปล้นคาราวานผ้า ได้ผ้าลายทานตะวันไปผืนเดียว แล้วพรรคก็มีวิชาเร็วที่ไม่มีใครรู้ที่มา"],
        [N_PO, "เขาเรียกมันว่าฉบับย่อ ฟังดูสุภาพดีนะ ย่อจากหนึ่งในห้า ข้าว่าเรียกว่าฉบับเศษผ้าดีกว่า… อย่าบอกใครว่าข้าพูด"],
        [N_PO, "ไปพรรคตะวันจันทราเถิด อาจารย์ใหญ่หยินอวี้เป็นคนตรง ไม่ชอบของที่ได้มาด้วยการปล้น แต่ก็ไม่ชอบคืนของให้คนที่ชนะนางไม่ได้"],
      ],
      go: "เดินทางไปพรรคตะวันจันทรา",
      asides: [
        { say: "หารสองแล้วนิทานนี้จริงแค่ไหน", reply: [
          [N_PO, "นิทานนี้ข้าไม่ได้เติมเลยสักคำ จึงน่ากลัวกว่าทุกเรื่องที่ข้าเคยเล่า"],
        ] },
      ],
    },
    steps: [
      { t: "visit", locationId: "sect_ming", label: "ขอดูผ้าผืนที่พรรคเก็บไว้", hint: "ไปพรรคตะวันจันทรา ขอดูผ้าลายทานตะวันที่ผู้อาวุโสรุ่นก่อนชิงมา",
        scene: { cutscene: FILM_MING_THEFT, lines: [
          "ผู้อาวุโสจูอิงพาเจ้าเข้าห้องเก็บของศักดิ์สิทธิ์ ผ้าลายทานตะวันผืนหนึ่งถูกขึงในกรอบไม้ ข้างใต้มีป้ายเขียนว่า 'ต้นตำรับคัมภีร์ทานตะวัน'",
          ["ผู้อาวุโสจูอิง", "พรรคเราย่อมันได้สิบสองท่า ฝึกแล้วทนทานดี แต่ไม่เคยเร็วอย่างที่ผู้อาวุโสรุ่นก่อนเล่า ทุกคนคิดว่าเพราะพวกเราขี้เกียจ"],
          ["ผู้อาวุโสจูอิง", "เจ้าบอกว่ามีอีกสี่ผืน… ถ้าอย่างนั้น สี่สิบปีที่ผ่านมาเราฝึกหนึ่งในห้าของประโยคเดียว"],
          ["ผู้อาวุโสจูอิง", "อาจารย์ใหญ่รอเจ้าอยู่ที่ลาน นางบอกว่าผ้าที่ได้มาด้วยมือ ต้องคืนไปด้วยมือ"],
        ], go: "ไปพบอาจารย์ใหญ่ที่ลาน" } },
      { t: "duel", locationId: "sect_ming", label: "ประลองกับอาจารย์ใหญ่หยินอวี้", hint: "ประลองกับอาจารย์ใหญ่หยินอวี้ที่ลานพรรคตะวันจันทรา เพื่อรับผ้าผืนที่สามคืน", opponentId: "spar_sunmoon_chief_dongfang",
        before: { lines: [
          [N_SUNMOON, "พรรคเราปล้นผ้ามาเพราะสงคราม ข้าคืนผ้าเพราะสงครามจบแล้ว แต่ข้าจะไม่คืนให้คนที่ใช้มันไม่เป็น"],
          [N_SUNMOON, "ฉบับย่อของเราคือทั้งหมดที่เรามี ใช้มันชนะข้าไม่ได้ เจ้าก็ไม่ได้อะไรกลับไป"],
        ], go: "ประลอง" },
        after: { lines: [
          [N_SUNMOON, "เจ้าไม่ได้เร็วกว่าข้า เจ้าแค่ไม่ได้ฝืน… ฉบับย่อของเราสอนให้ฝืน เพราะเราเหลือแค่ท่า ไม่เหลือเหตุผล"],
          [N_SUNMOON, "เอาไป แล้วเมื่อผ้าครบห้าผืน กลับมาเล่าให้พรรคเราฟังว่าเหตุผลที่หายไปสี่สิบปีคืออะไร"],
        ] } },
    ],
    complete: {
      lines: [
        [N_PO, "นางคืนให้จริงหรือ! ทั้งที่แพ้! เดี๋ยว… เจ้าชนะ? นี่เป็นตอนจบที่ดีกว่าที่ข้าแต่งไว้อีก"],
        [N_PO, "คืนนี้ข้าจะเล่าเรื่องนี้ แต่จะบอกว่าเจ้าสู้กับอาจารย์ใหญ่สามวันสามคืน มีมังกรบินผ่านด้วย"],
        [N_PO, "อ้อ มีข่าวมาจากจินหลิง ทูตทัพเหนือคนที่ซื้อบรรทัดที่โรงเตี๊ยมข้า กำลังไปหานักยุทธศาสตร์กงที่นั่น ฟังดูไม่ใช่การไปเยี่ยมเพื่อนเก่า"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "trait", trait: "fame", amount: 3 },
      { t: "npcRelationship", npcId: PO, amount: 4 },
    ],
  },

  // ── 12 ──
  {
    title: "สองทัพหนึ่งคัมภีร์",
    summary: "นักยุทธศาสตร์กงในจินหลิงวาดภาพศึกจิ้งหนานให้เจ้าดู: ฝ่ายเหนืออยากได้กองขันทีเงา ฝ่ายใต้อยากได้วิชาเดียวกัน — และทูตเหล็กทัพเหนือมาถึงประตูบ้านเขาแล้ว",
    giver: KONG,
    require: stat("INT", 100),
    offer: {
      lines: [
        [N_KONG, "เจ้าถือผ้าสามผืนเดินผ่านครึ่งแผ่นดินมาหาข้า ทั้งที่ทั้งสองทัพตามหามันอยู่ นี่ไม่ใช่ความกล้า นี่คือคณิตศาสตร์ที่แย่มาก"],
        [N_KONG, "ฟังให้ดี อ๋องเยียนอยากได้ทหารที่วิ่งเร็วกว่าม้าเพื่อตัดเส้นเสบียง ขันทีใหญ่กู้สัญญาว่าจะส่งร้อยคนให้ หลังพิธีตัด"],
        [N_KONG, "ฝ่ายวังก็ไม่ได้ดีกว่า ขุนนางกรมพิธีบางคนอยากได้วิชาเดียวกันมาฝึกทหารรักษาพระองค์ เขาแค่ยังจ่ายช้ากว่า"],
        [N_KONG, "ทูตเหล็กของทัพเหนือมาที่นี่เมื่อเช้า เขาเสนอตำแหน่งให้ข้า แลกกับให้ข้าบอกว่าเจ้าจะผ่านประตูไหน ข้าบอกเขาว่าประตูหน้าบ้านข้าเอง"],
        [N_KONG, "ข้าเป็นนักยุทธศาสตร์ ข้าไม่ได้หลอกเขา ข้าแค่เลือกสนามรบให้เจ้า"],
      ],
      go: "ไปยืนรอหน้าประตูบ้านนักยุทธศาสตร์",
    },
    steps: [
      { t: "duel", locationId: "city_jinling", label: "เผชิญหน้าทูตเหล็กทัพเหนือ", hint: "รอทูตเหล็กทัพเหนือหน้าบ้านนักยุทธศาสตร์กงในจินหลิง แล้วเอาชนะเขา", opponentId: NORTH,
        before: { lines: [
          [N_NORTH, "ข้าจำเจ้าได้ คนที่ยืนข้างบันไดที่โรงเตี๊ยม ข้าไม่ได้มาฆ่า ข้ามาซื้อ ผ้าสามผืน ทองสามหีบ"],
          [N_NORTH, "แผ่นดินกำลังจะเปลี่ยนเจ้าของ ใครเลือกข้างเร็วก็ได้ที่นั่งดี ใครเลือกช้าก็ได้ยืน"],
          ["{hero}", "ข้าไม่ได้เลือกข้างไหน ข้าเลือกเด็กที่ท่านจะซื้อไปตอน"],
        ], go: "สู้" },
        after: { lines: [
          [N_NORTH, "ข้ารบมาสามปี ฆ่าคนสายเลือดเดียวกันมากกว่าที่ข้าจะนับ… ข้าไม่เคยถามว่าทหารใหม่ร้อยคนนั้นมาจากไหน"],
          [N_NORTH, "บอกขันทีใหญ่ของเจ้าเถิด ว่าทัพเหนือจะรับของได้ที่วังจงหยาง ไม่ว่าข้าจะชนะหรือแพ้ คำสั่งนี้ไม่ได้มาจากข้า"],
          "เขาลุกขึ้นยืนอย่างทหาร เก็บทวนแล้วเดินออกทางประตูเมือง ไม่หันกลับมาอีก",
        ] } },
      { t: "trait", trait: "fame", min: 30, hint: "ให้ชื่อเสียงไปถึงทั้งสองฝ่าย (ชื่อเสียง 30) — คนที่ไม่มีใครรู้จักจะถูกซื้อหรือถูกฆ่าก่อน" },
    ],
    complete: {
      lines: [
        [N_KONG, "วังจงหยาง… ทางเหนือ ใกล้แนวรบ ข้าจะจดไว้ ศึกจิ้งหนานมีแผนที่ร้อยฉบับ แต่ทุกฉบับลงเอยที่ราษฎรเดินเท้าเปล่า"],
        [N_KONG, "เจ้าเริ่มมีชื่อแล้ว ดี ชื่อเป็นเกราะชนิดเดียวที่ทั้งสองทัพยังลังเลจะฟัน"],
        [N_KONG, "กลับวังหลวงเถิด เย็บผ้าที่มีอยู่ก่อน แล้วถามตัวเองว่าทำไมสองผืนที่เหลือถึงยังไม่มีใครบอกเจ้าว่าอยู่ที่ไหน"],
        [N_KONG, "ในสงคราม คนที่รู้มากที่สุดมักพูดน้อยที่สุด… หรือไม่ก็เป็นขันทีที่ไม่มีเสียงเท้า"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 200 },
      { t: "trait", trait: "good", amount: 2 },
    ],
  },

  // ── 13 ──
  {
    title: "เย็บคืนเป็นผืน",
    summary: "ผ้าสามผืนกลับถึงตำหนักเย็น พระสนมขอด้ายมาเย็บมันเข้าด้วยกัน ตัวอักษรในตะเข็บต่อกันเป็นประโยคแรก — และขันทีเกาหน้าซีดเหมือนเห็นผี",
    giver: CUI,
    offer: {
      lines: [
        [N_CUI, "เจ้ากลับมาแล้ว! ตัวดำขึ้น ผอมลง ใส่เสื้อไหมซูโจวด้วย ใครให้มา บอกมาเดี๋ยวนี้ ข้าจะเอาไปเล่าทั้งวัง"],
        [N_CUI, "พระสนมจะเย็บผ้าเอง แต่ด้ายในตำหนักเย็นหมด ขุนนางเฉียนตัดงบด้ายเพราะว่า 'พระสนมที่ถูกลืมไม่จำเป็นต้องปักผ้า'"],
        [N_CUI, "หาเส้นด้ายมาให้ทีสักหกม้วน ข้าจะขโมยจากห้องเครื่องก็ได้ แต่ข้าเคยโดนจับเพราะขโมยขนมมาแล้วครั้งหนึ่ง ไม่อยากเสียประวัติ"],
        [N_CUI, "ขันทีเกาก็จะมาด้วย เขาบอกว่า 'จะมายืนดูเฉย ๆ' แต่เขาไม่เคยมาตำหนักเย็นตอนพระสนมอ่านหนังสือเลยสักครั้ง แปลกไหม"],
      ],
      go: "ไปหาเส้นด้าย",
    },
    steps: [
      { t: "gather", itemId: "thread", count: 6, hint: "หาเส้นด้าย 6 ม้วนให้พระสนมใช้เย็บผ้าสามผืนเข้าด้วยกัน" },
      { t: "visit", locationId: "palace_royal", label: "ดูพระสนมเย็บผ้าในตำหนักเย็น", hint: "นำเส้นด้ายไปตำหนักเย็นยามค่ำ ดูพระสนมเย็บผ้าสามผืนเข้าด้วยกัน",
        scene: { cutscene: FILM_SEWING, lines: [
          "ขันทีเกาหายไปในความมืดของระเบียง พระสนมวางเข็มลง เป็นครั้งแรกที่เจ้าเห็นมือของนางหยุดนิ่ง",
          [N_CONSORT, "ผืนที่สี่อยู่กับเขา ข้าฝากไว้เมื่อยี่สิบปีก่อน เพราะเขาเป็นคนเดียวในวังที่เคยอ่านสำเนาแล้ว…ไม่ทำตาม"],
          [N_CONSORT, "ข้าไม่ได้บอกเจ้าตั้งแต่แรก เพราะเรื่องของเขา เขาต้องเล่าเอง"],
          [N_CUI, "ขันทีเกา… ขันทีเกาที่นับกระสอบข้าวผิดทุกวัน? ข้านึกว่าเขาแค่ตาไม่ดี"],
        ], go: "ตามขันทีเกาไป" } },
    ],
    complete: {
      lines: [
        "ระเบียงตะวันตกมืดสนิท ขันทีเกานั่งอยู่บนขั้นบันไดหน้าซากหอคัมภีร์ ผ้าลายทานตะวันผืนหนึ่งพับอยู่บนตัก",
        [N_CUI, "ข้าตามมาด้วยนะ ข้าไม่ได้สอดรู้ ข้าแค่… ห่วง"],
        [N_GAO, "สามสิบปีก่อน ข้ากับกู้ชิวเซิงกวาดพื้นตรงนี้ คืนหนึ่งเราเปิดม้วนที่ห้ามเปิด อ่านหน้าแรกด้วยกัน"],
        [N_GAO, "พรุ่งนี้มาหาข้าที่คลังเสบียง ข้าจะเล่าที่เหลือ… คืนนี้ข้าขอนั่งตรงนี้อีกสักพัก"],
      ],
      go: "ปล่อยให้เขานั่งลำพัง",
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 150 },
      { t: "npcRelationship", npcId: CUI, amount: 5 },
      { t: "npcRelationship", npcId: GAO, amount: 3 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// ACT 3 · ขันทีสองคน (14–19)
// Gao and Gu, two boy sweepers, opened the forbidden scroll together thirty
// years ago. Gu practised it to the end; Gao stopped when his nose bled. The
// trail of bought boys runs through the villages and a corrupt official in
// Chang'an; the court's own man wants the panels too. Gu, unmasked, wounds
// Gao — and the four panels vanish from a hiding place only two people knew.
// ═════════════════════════════════════════════════════════════════════

const FILM_TWO_SWEEPERS: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "past",
  title: "สามสิบปีก่อน", subtitle: "หมวดต้องห้าม ยามสาม",
  cast: {
    gao: { name: "เด็กกวาดพื้นเกา", look: "m3", at: [-2, 0], facing: "right", size: 0.85 },
    gu: { name: "เด็กกวาดพื้นกู้", look: "m4", at: [1, 0], facing: "left", size: 0.85, tint: OLD_SILK },
  },
  beats: [
    ["narrate", "สามสิบปีก่อน เด็กกวาดพื้นสองคนที่ถูกส่งเข้าวังตั้งแต่ห้าขวบ แอบจุดเทียนในหมวดที่ห้ามเปิด"],
    ["say", "gu", "'จงตัดวังในตนเสียก่อน' — เห็นไหม เกา เราถูกตัดมาแล้วตั้งแต่เด็ก ฟ้าเลือกพวกเราให้ฝึกวิชานี้"],
    ["say", "gao", "ฟ้าไม่ได้เลือก พ่อแม่เราจน แค่นั้น"],
    ["say", "gu", "งั้นก็ให้วิชานี้เลือกแทนฟ้า ข้าจะเร็วจนไม่มีใครในวังนี้ตบหัวข้าได้อีก"],
    ["act", "gu", "attack"],
    ["fx", "fire", "gu"],
    ["narrate", "หนึ่งเดือนต่อมา เด็กทั้งสองเร็วขึ้นจนขันทีรุ่นพี่ตามไม่ทัน และเลือดกำเดาของเกาไหลทุกเช้า"],
    ["act", "gao", "hurt"],
    ["fx", "blood", "gao"],
    ["say", "gao", "ข้าเลิก… ตัวหนังสือที่ทำให้เลือดออกทุกวันไม่ได้สอนอะไร มันกินเรา"],
    ["say", "gu", "เจ้าเลิกเพราะเจ้ากลัว ข้าไม่กลัว ข้าจะอ่านต่อจนถึงหน้าสุดท้าย"],
    ["think", "gao", "สามสิบปีที่ข้ากวาดพื้นอย่างเงียบ ๆ ข้าบอกตัวเองว่ามันคือการไม่ทำร้ายใคร… แต่มันคือการไม่ช่วยใครด้วย"],
    ["fade", "out"],
  ],
};

const FILM_CART: CutsceneSpec = {
  stage: "village_taishan", mood: "dusk",
  title: "เกวียนที่ไม่มีเสียงร้องไห้",
  cast: {
    zhao: { name: N_ZHAO, look: ZHAO, at: [-3, 1], facing: "right" },
    hero: { name: "{hero}", look: "hero", at: [-1, 1], facing: "right" },
    shadow: { name: N_SHADOW, look: "foe_assassin", at: [4, 0], facing: "left", tint: GREY_ROBE },
    boy: { name: "อาโถว ลูกพี่ลูกน้องจ้าวเทีย", look: "village_noname_child_xiaowu", at: [6, 1], facing: "left", size: 0.85 },
  },
  beats: [
    ["narrate", "เกวียนผ้าใบปิดมิดชิดสามเล่มจอดพักริมหมู่บ้านไท่ซาน ในเกวียนมีเด็กชายยี่สิบคน ไม่มีใครร้องไห้ เพราะร้องแล้วไม่ได้กิน"],
    ["say", "zhao", "อาโถว! อาโถว ข้าเอง! พี่จ้าวเทีย ลูกป้าสาม คนที่ตกคันนาตอนแปดขวบ!"],
    ["say", "boy", "…พี่เทีย? เขาบอกว่าพี่ตายในศึกทางเหนือแล้ว เขาบอกว่าถ้าไปกับเขา บ้านจะได้ข้าวสามกระสอบ"],
    ["say", "shadow", "เด็กพวกนี้ถูกซื้อมาถูกต้องตามสัญญา ผู้ใหญ่บ้านประทับนิ้วแล้ว"],
    ["say", "zhao", "ข้าก็ประทับนิ้วได้ ประทับลงหน้าเจ้านี่แหละ!"],
    ["act", "zhao", "attack"],
    ["fx", "burst", "shadow"],
    ["move", "hero", [2, 1], "run"],
    ["fade", "out"],
  ],
};

const FILM_LEDGER_NIGHT: CutsceneSpec = {
  stage: "city_changan", around: GATE_YAN, mood: "night",
  title: "บัญชีซื้อคน", subtitle: "จวนขุนนางหยาน ฉางอัน",
  cast: {
    hero: { name: "{hero}", look: "hero", at: [-3, 1], facing: "right" },
    gate: { name: N_GATE_YAN, look: "foe_guard", at: [-5, 0], facing: "right" },
    official: { name: N_OFFICIAL_YAN, look: "evil_changan_corrupt_official_yan", at: [3, 0], facing: "left", hidden: true },
  },
  beats: [
    ["narrate", "ห้องบัญชีของขุนนางหยานกลิ่นหมึกใหม่และไม้จันทน์ บนชั้นมีสมุดปกครามเล่มหนึ่งเขียนว่า 'ค่าแรงงานส่งเหนือ'"],
    ["say", "gate", "ข้าเฝ้าประตูเมืองมาสิบปี เกวียนผ้าใบทุกเล่มผ่านใต้จมูกข้า แล้วนายก็สั่งไม่ให้ข้าเปิดดู"],
    ["think", "hero", "เด็กหนึ่งคน… ห้าตำลึง ตรงช่องหมายเหตุเขียนว่า 'หลังพิธี ราคาสามสิบ'"],
    ["enter", "official", [3, 0]],
    ["say", "official", "ยามประตูเมืองกับแขกไม่ได้รับเชิญ… ดึกขนาดนี้มาตรวจบัญชีให้ข้าหรือ ขยันเกินเบี้ยหวัดไปแล้ว"],
    ["act", "official", "attack"],
    ["fx", "poison", "gate"],
    ["fade", "out"],
  ],
};

const FILM_UNMASKED: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "night",
  title: "เข็มแดงถอดหน้ากาก",
  cast: {
    gao: { name: N_GAO, look: "m3", at: [-2, 0], facing: "right" },
    gu: { name: N_GU, look: "foe_strategist", at: [3, 0], facing: "left", tint: RED_ROBE, size: 1.1 },
    hero: { name: "{hero}", look: "hero", at: [-5, 1], facing: "right", hidden: true },
  },
  beats: [
    ["narrate", "คืนเดือนดับ ขันทีสองคนยืนกลางลานคลังเสบียง คนหนึ่งถือไม้กวาด อีกคนถือเข็ม"],
    ["say", "gu", "เกา เพื่อนเก่า เจ้ายังกวาดพื้นอยู่อีกหรือ สามสิบปีแล้ว ฝุ่นในวังนี้ยังไม่หมดอีกหรือ"],
    ["say", "gao", "ฝุ่นไม่เคยหมด ชิวเซิง แต่ข้าไม่เคยต้องดื่มยาเย็นทุกเช้าเพื่อให้มีชีวิตถึงเย็น"],
    ["say", "gu", "ข้าได้ยินว่าแม่ของพระสนมเขียนประโยคที่ขาดไปไว้ในผ้า ประโยคที่จะดับไฟในตัวข้า ส่งมาให้ข้า แล้วข้าจะเลิกซื้อเด็ก"],
    ["say", "gao", "เจ้าโกหกเก่งขึ้นทุกปี"],
    ["act", "gu", "attack"],
    ["fx", "flash", "gao"],
    ["act", "gao", "hurt"],
    ["fx", "blood", "gao"],
    ["enter", "hero", [-5, 1]],
    ["move", "hero", [-1, 1], "run"],
    ["say", "gu", "ลูกนายหอ มาทันเวลาพอดี พ่อเจ้าเผาสำเนาของข้า ข้าจะเอาต้นฉบับคืนจากลูกเขา ยุติธรรมดี"],
    ["fade", "out"],
  ],
};

const ACT3: readonly StoryChapterSpec[] = [
  // ── 14 ──
  {
    title: "สามสิบปีก่อนในหมวดต้องห้าม",
    summary: "ขันทีเกาเล่าความลับที่เก็บไว้สามสิบปี: เขากับกู้ชิวเซิงเคยฝึกสำเนาฉบับวังด้วยกัน แล้วเขาเลิก ก่อนจะมอบผ้าผืนที่สี่ เขาขอดูว่าเจ้าสู้ด้วยอะไร",
    giver: GAO,
    require: all(stat("AGI", 120), stat("INT", 100)),
    offer: {
      cutscene: FILM_TWO_SWEEPERS,
      lines: [
        "คลังเสบียงยามเช้ามีแต่กลิ่นข้าวสารกับเสียงหนู ขันทีเกานั่งบนกระสอบ ผ้าลายทานตะวันพับวางข้างตัว",
        [N_GAO, "ข้าไม่ได้นับกระสอบผิดเพราะตาไม่ดี ข้านับผิดเพราะถ้านับถูก ขุนนางเฉียนจะเอาส่วนเกินไปขาย ข้าเลยนับให้ไม่มีส่วนเกิน"],
        [N_GAO, "กับวิชานี้ก็เหมือนกัน ข้าไม่เคยลืม ข้าแค่ทำเป็นนับผิดมาสามสิบปี"],
        [N_GAO, "ผ้าผืนที่สี่อยู่นี่ แต่ข้าจะไม่ส่งให้คนที่อยากได้มันเหมือนชิวเซิงอยากได้ สู้กับข้าหนึ่งยก"],
        [N_GAO, "ถ้าเจ้าชนะด้วยความอยาก ข้าจะรู้ แล้วข้าจะเผามันเหมือนที่พ่อเจ้าเผาสำเนา"],
      ],
      go: "รับคำท้า",
      asides: [
        { say: "ท่านขันทีก็สู้เป็นด้วยหรือ", reply: [
          [N_GAO, "ข้าเดินไม่มีเสียงเท้ามาสามสิบปี เจ้าคิดว่าข้าฝึกกับรองเท้าหรือ"],
        ] },
      ],
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "ประลองกับขันทีเกาที่คลังเสบียง", hint: "ประลองกับขันทีเกาที่คลังเสบียงในวังหลวง", opponentId: GAO_TEST,
        before: { lines: [
          "ขันทีเกาถอดรองเท้าวางเรียงกันเรียบร้อย แล้วยืนบนกระสอบข้าวด้วยเท้าเปล่า กระสอบไม่บุบแม้แต่น้อย",
          [N_GAO, "เท้าไร้เสียงคือทั้งหมดที่ข้าเก็บไว้จากเดือนนั้น ที่เหลือข้าทิ้งไปพร้อมเลือดกำเดา มาเถอะ"],
        ], go: "สู้" },
        after: { lines: [
          [N_GAO, "เจ้าไม่ได้ไล่ตามข้า เจ้ารอให้ข้าพลาดเอง… ดี คนที่อยากได้ ไม่เคยรอเป็น"],
          [N_GAO, "ผืนที่สี่เป็นของเจ้า ข้าเก็บมันยี่สิบปีโดยไม่เคยคลี่ออกอ่าน เพราะข้ากลัวว่าข้าจะอยากฝึกอีก"],
          "เขาส่งผ้าให้ด้วยมือที่สั่นเล็กน้อย เป็นครั้งแรกที่เจ้าเห็นมือของขันทีเกาสั่น",
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "ชิวเซิงฝึกจนจบสำเนา เขาเร็วที่สุดในวังนี้ และร้อนที่สุดด้วย ทุกเช้าเขาดื่มยาเย็นเหมือนคนดื่มน้ำ"],
        [N_GAO, "ห้าปีก่อนเขาเริ่มสอนเด็กกวาดพื้นรุ่นใหม่ ข้าเห็นแต่ไม่พูด ข้าบอกตัวเองว่าไม่ใช่เรื่องของข้า"],
        [N_GAO, "สองปีก่อนเขาเริ่มซื้อเด็กจากข้างนอก เด็กที่ยังไม่ถูกตัด… ข้าก็ยังไม่พูด"],
        [N_GAO, "วันนี้ข้าพูดแล้ว ช้าไปห้าปี ช้ากว่าคนแขนเดียวที่ส่งหีบของพ่อเจ้าเสียอีก"],
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: GAO, amount: 6 },
    ],
  },

  // ── 15 ──
  {
    title: "เด็กที่ถูกซื้อ",
    summary: "เฟิงเจ้าของร้านบะหมี่ — สายลับใหญ่ของกรมองครักษ์ — รู้ว่าเกวียนซื้อเด็กผ่านหมู่บ้านชีกู่ และมีคนค้าคนคอยคุ้มกันตามทาง",
    giver: FENG,
    offer: {
      lines: [
        [N_FENG, "บะหมี่ชามนี้ข้าเลี้ยง เค็มไปหน่อย ข้าใส่เกลือตอนฟังรายงาน ข่าวเลวทำให้มือข้าหนัก"],
        [N_FENG, "กรมองครักษ์รู้เรื่องเกวียนซื้อเด็กมาสามเดือน แต่ผู้บัญชาการสั่งให้ 'ดูไว้ก่อน' เพราะคนจ่ายเงินมีชื่ออยู่ทั้งสองฝั่งของสงคราม"],
        [N_FENG, "ข้าไม่ได้สั่งให้เจ้าทำอะไรนะ ข้าแค่บอกว่าซื่อชาวนาในชีกู่รู้ว่าเกวียนผ่านเมื่อไร และพวกค้าคนที่คุ้มเกวียนชอบเดินถนนสายนั้นตอนพลบ"],
        [N_FENG, "ถ้ามีใครถามว่าข้าบอกเจ้า ข้าจะบอกว่าข้าแค่ขายบะหมี่ บะหมี่เค็มด้วย ไม่มีใครเชื่อว่าสายลับจะทำบะหมี่เค็มขนาดนี้"],
      ],
      go: "กินบะหมี่ให้หมด แล้วออกเดินทาง",
      asides: [
        { say: "บะหมี่นี่เค็มจริง ๆ นะ", reply: [
          [N_FENG, "ข้ารู้ ถ้าวันไหนมันจืด แปลว่าแผ่นดินสงบ ข้ายังไม่เคยทำจืดได้สักชามตั้งแต่เปิดร้าน"],
        ] },
      ],
    },
    steps: [
      { t: "talk", npcId: SI, locationId: "village_qigu", label: "ถามซื่อชาวนาเรื่องเกวียนผ้าใบ", hint: "ไปหมู่บ้านชีกู่ ถามซื่อชาวนาว่าเกวียนซื้อเด็กผ่านเมื่อไร ไปทางไหน",
        scene: { lines: [
          [N_SI, "เกวียนผ้าใบสามเล่ม ผ่านทุกสิบวัน ไปทางไท่ซาน เขาซื้อเด็กชายอายุสิบสองถึงสิบเก้า จ่ายเป็นข้าวสามกระสอบ"],
          [N_SI, "ปีนี้ฝนแล้ง ทัพผ่านสองรอบ ข้าวหมดยุ้ง ข้าวสามกระสอบมีค่ากว่าลูกชายคนที่สาม… พ่อแม่พูดอย่างนั้นแล้วก็ร้องไห้"],
          [N_SI, "ข้าจดทุกเกวียนส่งให้นายข้างบน ไม่เคยมีใครมา นอกจากเจ้า"],
          [N_SI, "เกวียนเที่ยวหน้าออกพรุ่งนี้ ไปทางหมู่บ้านไท่ซาน มีคนคุมราวสิบคน ถ้าเจ้าจะไป ไปกับคนที่รู้จักหมู่บ้านนั้นจะดีกว่า"],
        ], go: "จดเส้นทางเกวียน" } },
      { t: "hunt", opponentId: "ruffian", count: 5, hint: "จัดการพวกคนร้ายที่คุ้มเกวียนค้าคนตามถนน 5 คน (พบระหว่างเดินทาง)" },
    ],
    complete: {
      lines: [
        [N_FENG, "ห้าคนนั้นเป็นแค่ลูกจ้างรายวัน ค่าแรงคนละสองตำลึง น้อยกว่าราคาเด็กหนึ่งคน แต่พอแล้วสำหรับให้พวกมันไม่ถามอะไร"],
        [N_FENG, "เกวียนเที่ยวหน้าไปหมู่บ้านไท่ซาน… เดี๋ยวนะ จ้าวเทียทหารวังมาจากแถวนั้นไม่ใช่หรือ เขาเคยมากินบะหมี่ข้าแล้วบ่นถึงควาย"],
        [N_FENG, "ไปบอกเขาเถิด ทหารบ้านนาคนหนึ่งที่รู้จักทุกคันนา มีค่ากว่าสายลับสิบคนที่รู้จักแต่ชื่อถนน"],
        ["{hero}", "แล้วท่านล่ะ จะรายงานผู้บัญชาการว่าอย่างไร"],
        [N_FENG, "ข้าจะรายงานว่า 'ดูไว้แล้ว' ตามคำสั่งทุกตัวอักษร ดูไว้แล้ว และเห็นคนหนึ่งลงมือ"],
        [N_FENG, "อีกอย่าง ถ้าเจอใครในหมู่บ้านนั้นขายเกลือถูก ซื้อมาให้ข้าสักถุง ข้าใช้เปลืองเหลือเกินช่วงนี้"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 150 },
      { t: "trait", trait: "good", amount: 3 },
    ],
  },

  // ── 16 ──
  {
    title: "ลูกพี่ลูกน้องจากบ้านนา",
    summary: "จ้าวเทียได้ยินชื่อหมู่บ้านไท่ซานแล้วหน้าซีด ลูกพี่ลูกน้องของเขาอยู่ที่นั่น เขาลาเวรโดยไม่ขออนุญาตใครเป็นครั้งแรกในชีวิต",
    giver: ZHAO,
    offer: {
      lines: [
        [N_ZHAO, "หมู่บ้านไท่ซาน? ป้าสามของข้าอยู่ที่นั่น! ลูกป้าสามชื่ออาโถว อายุสิบสาม ตัวเล็ก ชอบขี่หลังเจ้าดำ"],
        [N_ZHAO, "ปีนี้ฝนแล้ง… ป้าสามไม่เคยเขียนจดหมายมาเพราะเขียนไม่เป็น ข้าก็ไม่เคยกลับเพราะผู้กองไม่ให้ลา"],
        [N_ZHAO, "ข้าจะไปกับเจ้า ผู้กองจะลงโทษข้าก็ให้ลงไป ข้าเฝ้าระเบียงที่ไม่มีใครเดินมาสามปีแล้ว วันนี้ข้าจะเฝ้าเด็ก"],
        [N_ZHAO, "อ้อ ถ้าเห็นควายสีดำที่มีรอยด่างรูปจันทร์เสี้ยวบนหน้าผาก นั่นเจ้าดำ อย่าตกใจถ้ามันวิ่งมาเลียหน้าข้า"],
      ],
      go: "ออกเดินทางกับจ้าวเทีย",
    },
    steps: [
      { t: "duel", locationId: "village_taishan", label: "หยุดเกวียนค้าเด็กที่หมู่บ้านไท่ซาน", hint: "ไปหมู่บ้านไท่ซานกับจ้าวเทีย หยุดเกวียนผ้าใบและขันทีเงาที่คุมมา", opponentId: SHADOW,
        before: { cutscene: FILM_CART, lines: [
          "ขันทีเงาคนคุมเกวียนดึงเข็มออกจากแขนเสื้อสามเล่ม เด็ก ๆ ในเกวียนนั่งนิ่ง ไม่มีใครกล้ามอง",
          [N_ZHAO, "อาโถว หลับตาไว้ นับหนึ่งถึงร้อยแบบตอนเล่นซ่อนหา พี่จะเปิดผ้าใบให้ก่อนเจ้านับถึงห้าสิบ"],
        ], go: "สู้" },
        after: { lines: [
          "ขันทีเงาล้มลงข้างล้อเกวียน จ้าวเทียกระชากผ้าใบออกทีละเล่ม เด็กยี่สิบคนกะพริบตามองแสงพลบค่ำเหมือนลูกนกเพิ่งออกจากไข่",
          [N_ZHAO, "อาโถว! นับถึงไหนแล้ว… สามสิบเจ็ด? ดี พี่มาก่อนห้าสิบ พี่ไม่ผิดสัญญา"],
        ] } },
      { t: "visit", locationId: "village_taishan", label: "พาเด็ก ๆ กลับบ้าน", hint: "พาเด็กที่ถูกซื้อกลับเข้าหมู่บ้านไท่ซาน คืนให้พ่อแม่",
        scene: { lines: [
          "ทั้งหมู่บ้านออกมายืนที่ลานข้าว แม่คนหนึ่งวิ่งเข้ามากอดลูกชายแล้วตีหลังลูกไปพร้อมกัน ร้องไห้ไปด่าไป",
          "ป้าสามของจ้าวเทียคุกเข่ากับพื้น เอาหน้าผากแตะหลังมืออาโถว พูดซ้ำแต่คำว่า 'แม่ขอโทษ'",
          "แล้วควายดำตัวหนึ่งที่มีรอยด่างรูปจันทร์เสี้ยวก็วิ่งฝ่าฝูงคนเข้ามา เลียหน้าจ้าวเทียจนหมวกองครักษ์หลุดกระเด็น",
          [N_ZHAO, "เจ้าดำ! อ้วนขึ้นจริงด้วย! …อย่าเลียตรงนั้น ข้าเพิ่งโกนหนวด"],
        ], go: "ปล่อยให้จ้าวเทียคุยกับควายสักพัก" } },
    ],
    complete: {
      lines: [
        [N_ZHAO, "ข้าแบ่งเบี้ยหวัดสามเดือนให้ป้าสามแล้ว ข้าวสามกระสอบ ไม่มีใครต้องขายลูกแลกมันอีก"],
        [N_ZHAO, "อาโถวเล่าว่าในเกวียนเที่ยวก่อน มีพี่ชายคนหนึ่งชื่อเสี่ยวหลง เก่งที่สุด ขันทีใหญ่รักมันเหมือนลูก มันสอนเด็กใหม่ทุกคืน"],
        [N_ZHAO, "แต่เสี่ยวหลงชอบพูดถึงพี่สาวในวังหลวง บอกว่าพี่สาวเอายาไปให้พระสนมทุกคืน… เจ้าว่าข้าคิดมากไปหรือเปล่า"],
        "จ้าวเทียหยุดพูด แล้วหันไปมองทางวังหลวง สีหน้าของทหารบ้านนาคนนั้นไม่มีเรื่องควายหลงเหลืออยู่เลย",
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: ZHAO, amount: 6 },
    ],
  },

  // ── 17 ──
  {
    title: "ขุนนางท้องพลุ้ยขอซื้อ",
    summary: "ขุนนางเฉียนแห่งกรมพิธีเชิญเจ้าไปจิบชา เขาเสนอตำแหน่งในวังแลกกับผ้าทั้งหมด — ฝ่ายวังก็อยากได้วิชาเดียวกัน แค่จ่ายช้ากว่า",
    giver: QIAN,
    offer: {
      lines: [
        [N_QIAN, "เชิญ เชิญ ชาจากหวงซาน หนึ่งตำลึงต่อหนึ่งกำมือ ดื่มช้า ๆ ความรู้สึกผิดของข้าจะได้ลดลงตามราคา"],
        [N_QIAN, "ข้ารู้ว่าเจ้าถือผ้าอะไรอยู่ ข้ารู้ว่าขันทีใหญ่กู้ขายมันให้ฝ่ายเหนือ ข้าเลยคิดว่า… ทำไมฝ่ายเราไม่ซื้อก่อนล่ะ"],
        [N_QIAN, "ตำแหน่งผู้ตรวจการกรมพิธี เบี้ยหวัดปีละสองร้อยตำลึง บ้านในนครหลวง แลกกับผ้าสี่ผืน แล้วเราจะฝึกทหารรักษาพระองค์ให้เร็วเหมือนเงา"],
        [N_QIAN, "ไม่ต้องตอบตอนนี้ ข้าให้นายกองเถียนหลงรอฟังคำตอบอยู่ข้างนอกแล้ว เขาเป็นคนใจร้อน แต่ซื่อสัตย์มาก… ต่อข้า"],
      ],
      go: "วางถ้วยชาลง",
      asides: [
        { say: "ทหารรักษาพระองค์ต้องผ่านพิธีตัดด้วยหรือเปล่า", reply: [
          [N_QIAN, "เรื่องรายละเอียดเป็นของกรมอื่น ข้าเป็นกรมพิธี ข้าดูแลแค่ว่าพิธีจะจัดวันไหน"],
          "ขุนนางเฉียนจิบชาต่อโดยไม่หันมามองหน้าเจ้า",
        ] },
      ],
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "ผ่านนายกองเถียนหลงที่ประตูกรมพิธี", hint: "ปฏิเสธข้อเสนอของขุนนางเฉียน แล้วผ่านนายกองเถียนหลงที่รอหน้าประตูกรมพิธี", opponentId: CAPTAIN,
        before: { lines: [
          [N_CAPTAIN, "นายท่านบอกว่าถ้าเจ้าปฏิเสธ ให้ข้าช่วยเจ้าคิดใหม่ ข้าคิดด้วยกระบองเก่งกว่าคิดด้วยหัว"],
          [N_CAPTAIN, "ไม่มีอะไรส่วนตัวนะ ข้ามีลูกห้าคน ทุกคนกินข้าวเก่งกว่าข้า"],
        ], go: "สู้" },
        after: { lines: [
          [N_CAPTAIN, "…เอาละ ข้าคิดใหม่แล้ว เจ้าก็คิดใหม่แล้ว เราต่างคนต่างไม่เปลี่ยนใจ ยุติธรรมดี"],
          [N_CAPTAIN, "บอกเจ้าไว้อย่างหนึ่ง นายท่านของข้าส่งจดหมายไปฉางอันทุกเดือน ถึงขุนนางหยาน ข้าเป็นคนถือไปเอง ข้าไม่เคยเปิดอ่าน แต่ข้าไม่ใช่คนโง่"],
        ] } },
      { t: "trait", trait: "good", min: 40, hint: "ยืนหยัดด้วยความดี (ความดี 40) — ผ้าเหล่านี้ไม่มีราคาสำหรับคนที่รู้ว่ามันใช้ทำอะไร" },
    ],
    complete: {
      lines: [
        [N_QIAN, "เจ้าปฏิเสธข้อเสนอที่ดีที่สุดในชีวิตเจ้า ข้าจะจดไว้ในบันทึกพิธี ในหมวด 'คนแปลก'"],
        [N_QIAN, "ฟังนะ ข้าไม่ใช่คนเลว ข้าแค่เป็นขุนนางมาสามสิบปี ทุกปีมีคนบอกข้าว่าแผ่นดินจะเปลี่ยนเจ้าของ ข้าแค่อยากอยู่ให้ถึงเจ้าของคนต่อไป"],
        [N_QIAN, "ส่วนจดหมายถึงฉางอัน… นั่นเป็นเรื่องการค้า ขุนนางหยานส่งผ้าไหมดีให้ข้า ข้าส่งข่าววังให้เขา ไม่มีใครเสียหาย"],
        "เขาพูดประโยคสุดท้ายเร็วเกินไป และเหงื่อซึมขมับทั้งที่ห้องเย็นเฉียบ",
        [N_ZHAO, "ข้ายืนเฝ้าประตูกรมพิธีมาสามปี ขุนนางเฉียนเหงื่อออกแบบนี้แค่ตอนเดียว — ตอนโกหกเรื่องงบโคมไฟ"],
        [N_ZHAO, "ไปฉางอันเถิด ยามหยานที่ประตูเมืองเป็นคนซื่อ เขาเคยส่งข้าวต้มให้ข้าตอนข้าป่วยระหว่างทางเข้าเมืองหลวง"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 100 },
      { t: "trait", trait: "humility", amount: 2 },
    ],
  },

  // ── 18 ──
  {
    title: "บัญชีซื้อคนแห่งฉางอัน",
    summary: "ยามหยานผู้เฝ้าประตูเมืองฉางอันรู้มานานว่าเกวียนผ้าใบผ่านใต้จมูกเขาทุกสิบวัน ขุนนางหยานผู้เป็นนายสั่งไม่ให้เปิดดู — แต่สมุดบัญชีของขุนนางจดทุกอย่างไว้",
    giver: GATE_YAN,
    offer: {
      lines: [
        [N_GATE_YAN, "ข้าเป็นยามประตูเมือง หน้าที่ข้าคือเปิดเกวียนทุกเล่มที่ผ่าน แต่นายท่านขุนนางหยานสั่งว่าเกวียนผ้าใบสามเล่มนั้น 'ไม่ต้องเปิด'"],
        [N_GATE_YAN, "ข้าทำตามมาสองปี ทุกคืนข้าได้ยินเสียงไอในเกวียน แล้วข้าก็บอกตัวเองว่าเป็นเสียงลม"],
        [N_GATE_YAN, "นายท่านจดทุกอย่างลงสมุด เขาเชื่อว่าคนที่จดบัญชีละเอียดจะไม่มีวันโดนโกง ข้าว่าคนที่จดบัญชีละเอียดจะโดนจับได้ง่ายกว่า"],
        [N_GATE_YAN, "คืนนี้ข้าเข้าเวรหน้าจวน ข้าจะเปิดประตูหลังให้ ครั้งนี้ข้าจะไม่บอกตัวเองว่าเป็นเสียงลม"],
      ],
      go: "รอเวรยามคืนนี้",
    },
    steps: [
      { t: "visit", locationId: "city_changan", label: "ค้นห้องบัญชีของขุนนางหยาน", hint: "เข้าจวนขุนนางหยานในฉางอันทางประตูหลัง ค้นสมุดบัญชีซื้อเด็ก",
        scene: { cutscene: FILM_LEDGER_NIGHT, lines: [
          "สมุดบัญชีปกครามบันทึกเด็กสามร้อยสิบสองคนในสองปี ชื่อหมู่บ้าน ราคา และช่องสุดท้ายที่เขียนว่า 'ส่งวังจงหยาง'",
          "หน้าท้ายสุดเป็นจดหมายที่ยังไม่ส่ง ลายมือเส้นด้ายของขันทีใหญ่กู้: 'พิธีตัดร้อยคนแรกจะทำที่วังจงหยาง เมื่อได้ประโยคที่ขาดจากผ้า'",
          [N_GATE_YAN, "ร้อยคน… ข้าเปิดประตูให้เกวียนพวกนั้นผ่านไปเองกับมือ"],
          "เสียงฝีเท้าดังมาจากระเบียง กลิ่นไม้จันทน์ปนกลิ่นพิษ ขุนนางหยานไม่ได้นอนอย่างที่ยามหยานคิด",
        ], go: "เผชิญหน้าเจ้าของสมุด" } },
      { t: "duel", locationId: "city_changan", label: "เอาชนะขุนนางหยาน", hint: "เอาชนะขุนนางหยานทุจริตที่จับได้คาห้องบัญชี", opponentId: "elite_villain_yan",
        before: { lines: [
          [N_OFFICIAL_YAN, "เด็กยากจนตายในยุ้งข้าวว่างก็ตาย ตายในวังจงหยางก็ตาย อย่างน้อยทางของข้าพ่อแม่ได้ข้าวสามกระสอบ"],
          [N_OFFICIAL_YAN, "เจ้าจะเอาสมุดไปให้ใคร ศาลของฮ่องเต้เจี้ยนเหวินหรือ อีกปีสองปีศาลนั้นจะยังมีหรือเปล่าก็ไม่รู้"],
        ], go: "สู้" },
        after: { lines: [
          [N_OFFICIAL_YAN, "เอาไปเถอะ สมุดเล่มนั้น… ข้ามีอีกสามเล่มที่จดว่าใครในวังรับเงินข้าบ้าง เจ้าอยากได้ไหม ข้าขายถูก ๆ"],
          [N_GATE_YAN, "ไม่ต้องขาย ข้าจะเก็บไว้ให้ศาลเอง ไม่ว่าจะเป็นศาลของฮ่องเต้องค์ไหน"],
        ] } },
    ],
    complete: {
      lines: [
        [N_GATE_YAN, "สมุดเล่มที่สองมีชื่อขุนนางเฉียนแห่งกรมพิธี รับผ้าไหมทุกเดือน และส่งข่าวว่าพระสนมในตำหนักเย็นยังมีชีวิต ตั้งแต่สามเดือนก่อน"],
        [N_GATE_YAN, "สามเดือนก่อน… ก่อนที่ขันทีชราคนแรกจะตายด้วยเข็มเสียอีก"],
        [N_GATE_YAN, "ข้าจะส่งเกวียนที่เหลือกลับหมู่บ้านทุกเล่มที่ยังอยู่ในฉางอัน ส่วนที่ไปวังจงหยางแล้ว… ข้าทำได้แค่ภาวนา"],
        [N_GATE_YAN, "เจ้ากลับวังหลวงเร็วเถอะ คนที่รู้ว่าพระสนมยังอยู่ ไม่ได้รู้เพื่อจะส่งดอกไม้ไปเยี่ยม"],
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "gold", amount: 200 },
      { t: "trait", trait: "fame", amount: 3 },
    ],
  },

  // ── 19 ──
  {
    title: "เข็มแดงถอดหน้ากาก",
    summary: "ขันทีใหญ่กู้ชิวเซิงมาหาขันทีเกาด้วยตัวเอง ไม่สวมหน้ากากอีกแล้ว คืนนั้นขันทีเกาล้มลง และผ้าสี่ผืนที่ซ่อนไว้ก็หายไปจากที่ที่มีเพียงสองคนรู้",
    giver: GAO,
    require: all(stat("AGI", 120), stat("DEX", 110)),
    offer: {
      lines: [
        [N_GAO, "สมุดจากฉางอัน… ข้าอ่านแล้ว สามร้อยสิบสองชื่อ ข้าอ่านทุกชื่อ ช้า ๆ เหมือนนับกระสอบข้าว"],
        [N_GAO, "ผ้าสี่ผืน ข้าซ่อนไว้ในที่ที่ปลอดภัยที่สุดในวัง ข้ากับชุ่ยเอ๋อสองคนเท่านั้นที่รู้ ส่วนเจ้า… ข้าไม่บอก เผื่อเจ้าถูกจับ"],
        [N_GAO, "ชิวเซิงส่งข้อความมาเมื่อเช้า บอกว่าคืนนี้จะมาเยี่ยมเพื่อนเก่าที่คลังเสบียง"],
        [N_GAO, "ข้าจะรอเขา เจ้าอยู่ห่าง ๆ ถ้าข้าแพ้ ค่อยออกมา ถ้าข้าชนะ… ก็ช่วยข้าแบกกระสอบข้าวที่เขาทำล้มด้วย"],
      ],
      go: "ซ่อนตัวรอที่มุมคลัง",
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "เข้าขวางขันทีใหญ่กู้ชิวเซิง", hint: "รอที่คลังเสบียงยามค่ำ เมื่อขันทีเกาล้มลง ให้เข้าขวางขันทีใหญ่กู้ชิวเซิง", opponentId: MASK,
        before: { cutscene: FILM_UNMASKED, lines: [
          "ขันทีใหญ่กู้ถอดหน้ากากแดงโยนทิ้ง ใบหน้าข้างใต้งามจนน่ากลัว ผิวขาวซีดเหมือนกระดาษ แต่เส้นเลือดที่ขมับแดงก่ำเหมือนถ่านไฟ",
          [N_GU, "สามสิบปีที่ข้าเร็วที่สุดในวังนี้ แต่ไม่เคยหลับได้เกินครึ่งชั่วยาม รู้ไหมว่ามันเป็นอย่างไร ลูกนายหอ"],
        ], go: "สู้" },
        after: { lines: [
          "เข็มแดงพลาดเป้าไปปักเสาคลังจนทะลุ ขันทีใหญ่กู้ถอยหลังสามก้าว หัวเราะทั้งที่หอบหายใจ ไอร้อนพวยออกจากปาก",
          [N_GU, "เจ้าเก่ง… แต่ข้าไม่ได้มาเพื่อชนะเจ้าคืนนี้ ข้ามาเพื่อให้เจ้ากับเกาอยู่ตรงนี้นานพอ"],
          [N_GU, "ผ้าสี่ผืนในกล่องยาของพระสนม — ป่านนี้คนของข้าคงถึงกำแพงวังแล้ว"],
          "เขากระโดดขึ้นหลังคาแล้วหายไปในความมืด ขันทีเกาพยายามลุกตาม แล้วทรุดลง เลือดซึมจากรอยเข็มสามจุดที่หน้าอก",
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "กล่องยา… เขารู้ว่ากล่องยา ข้าไม่เคยบอกใคร นอกจาก…"],
        "ขันทีเกาไม่พูดชื่อนั้นออกมา เขาหลับตา มือที่กำแขนเสื้อเจ้าค่อย ๆ คลายออก",
        [N_ZHAO, "ข้าวิ่งไปตำหนักเย็นมาแล้ว พระสนมปลอดภัย กล่องยาว่างเปล่า… และชุ่ยเอ๋อไม่อยู่ ไม่มีใครเห็นนางตั้งแต่ตะวันตก"],
        [N_ZHAO, "หมอหลินกำลังมา ข้าวิ่งไปตามเอง… เจ้าอยู่กับขันทีเกาไว้ อย่าให้เขาหลับนานเกินไป"],
      ],
      go: "ประคองขันทีเกาไว้",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "trait", trait: "fame", amount: 3 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// ACT 4 · หุบเขาตัดใจ (20–25)
// ชุ่ยเอ๋อ betrayed the hiding place: Gu holds her brother เสี่ยวหลง, his best
// pupil. She confesses and turns his trap around. The storyteller spreads a
// ridiculous "true reading" to make the buyers squabble. At หุบเขาตัดใจ the old
// man who once loved the consort keeps the fifth panel and the meaning of
// "ตัด": a heart let go, not a body cut. The hero beats เสี่ยวหลง without
// harming him — and learns the consort has been taken north.
// ═════════════════════════════════════════════════════════════════════

const FILM_CUI_CONFESSES: CutsceneSpec = {
  stage: "palace_royal", around: CUI, mood: "rain",
  title: "นางกำนัลกับกล่องยา",
  cast: {
    cui: { name: N_CUI, look: CUI, at: [0, 0], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [-3, 0], facing: "right" },
    long: { name: N_LONG, look: "foe_swordsman", at: [5, -1], facing: "left", tint: GREY_ROBE, size: 0.95, hidden: true },
  },
  beats: [
    ["narrate", "ฝนตกตั้งแต่รุ่งสาง ชุ่ยเอ๋อยืนกลางลานหน้าตำหนักเย็น ไม่กางร่ม ไม่หลบ เหมือนรอให้ฝนลงโทษนางแทนใคร"],
    ["say", "cui", "ข้าเอง… ข้าบอกเขาเรื่องกล่องยา"],
    ["say", "cui", "ปีก่อนน้องชายข้าเสี่ยวหลงถูกขายไปกับเกวียน ขันทีใหญ่เจอข้าในวัง บอกว่าถ้าข้าเล่าเรื่องพระสนมให้ฟังทุกเดือน น้องข้าจะไม่ต้องผ่านพิธีตัด"],
    ["mood", "past"],
    ["enter", "long", [5, -1]],
    ["say", "long", "พี่ อย่าร้องสิ ท่านอาจารย์ใหญ่ใจดีกับข้า ข้าวิ่งเร็วที่สุดในรุ่น ไม่มีใครตีข้าได้แล้ว"],
    ["exit", "long"],
    ["mood", "rain"],
    ["say", "cui", "ข้าบอกตัวเองว่าเล่าแค่เรื่องเล็ก ๆ เรื่องพระสนมเสวยอะไร นอนกี่ยาม… แล้วเรื่องเล็กก็กลายเป็นกล่องยา"],
    ["act", "cui", "defeat"],
    ["think", "hero", "นางนอนเฝ้าตำหนักเย็นทุกคืนจนฟันกระทบกัน… ทั้งที่รู้ว่าคนที่นางกลัวคือคนที่นางรายงานอยู่"],
    ["fade", "out"],
  ],
};

const FILM_NAIL_RUMOR: CutsceneSpec = {
  stage: "inn_heluo", around: PO, mood: "day",
  title: "คัมภีร์ฉบับตัดเล็บ",
  cast: {
    po: { name: N_PO, look: "elder", at: [0, -1], facing: "right" },
    b1: { name: "นักเลงหน้าโต๊ะ", look: "foe_brawler", at: [3, 1], facing: "left" },
    b2: { name: "จอมยุทธ์พเนจร", look: "foe_swordsman", at: [-3, 1], facing: "right" },
    hero: { name: "{hero}", look: "hero", at: [-5, 0], facing: "right" },
  },
  beats: [
    ["say", "po", "ความลับสุดยอดที่ข้าได้มาจากวังหลวง! คัมภีร์ทานตะวันฉบับแท้ บรรทัดแรกเขียนว่า — 'จงตัด**เล็บ**ในตนเสียก่อน'!"],
    ["say", "b1", "เล็บ? เล็บมือหรือเล็บเท้า"],
    ["say", "po", "ทั้งสองอย่าง! ยิ่งสั้นยิ่งเร็ว! ลมไม่ติดเล็บ!"],
    ["act", "b2", "idle"],
    ["say", "b2", "ข้าซื้อบรรทัดที่สามสิบเอ็ดมาแท่งทองหนึ่ง ไม่เห็นมีเรื่องเล็บ…"],
    ["say", "po", "เพราะเจ้าซื้อของปลอม! ของแท้ต้องตัดเล็บ! ใครอยากตอนตัวเอง ไปถามคนที่ขายของปลอมให้เจ้าสิ"],
    ["fx", "petals"],
    ["narrate", "ภายในสามวัน ครึ่งหนึ่งของยุทธภพตัดเล็บสั้นกุด อีกครึ่งหนึ่งตามล่าคนขายบรรทัดเพื่อขอเงินคืน"],
    ["think", "hero", "ตลาดของบรรทัดต้องห้ามพังลงเพราะเรื่องเล็บ… โปผู้เล่าเรื่องอาจเป็นนักยุทธศาสตร์ที่น่ากลัวที่สุดในแผ่นดิน"],
    ["fade", "out"],
  ],
};

const FILM_JUEQING_PAST: CutsceneSpec = {
  stage: "valley_jueqing", around: JUEQING, mood: "past",
  title: "สี่สิบปีก่อน", subtitle: "ปากหุบเขาตัดใจ",
  cast: {
    lin: { name: "หลินชัวซันในวัยหนุ่ม", look: "m2", at: [-2, 0], facing: "right" },
    lanyu: { name: "หลานอวี้ในวัยสาว", look: "f1", at: [2, 0], facing: "left", tint: OLD_SILK },
  },
  beats: [
    ["narrate", "สี่สิบปีก่อน ก่อนหญิงสาวจะถูกพาเข้าวังของราชวงศ์ใหม่ นางแวะที่ปากหุบเขาแห่งนี้เป็นครั้งสุดท้าย"],
    ["say", "lin", "ไปกับข้าเถอะ หุบเขานี้ลึกพอจะไม่มีวังไหนตามมาถึง"],
    ["say", "lanyu", "ถ้าข้าหนี เขาจะเผาหมู่บ้านที่แม่ข้าเคยพัก ข้ารู้จักวังดี วังไม่เคยลืม"],
    ["fx", "petals"],
    ["say", "lanyu", "เก็บผืนนี้ไว้ แม่บอกว่าผืนนี้คือหัวใจของวิชา ตัดใจจากข้าให้ได้ แล้วเจ้าจะอ่านมันออก"],
    ["move", "lanyu", [6, 0]],
    ["exit", "lanyu"],
    ["think", "lin", "ตัดใจ… ข้าคิดว่าต้องตัดสิ่งที่รักทิ้ง สี่สิบปีต่อมาข้าจึงรู้ว่าต้องตัดสิ่งที่อยากได้"],
    ["fade", "out"],
  ],
};

const FILM_XIAOLONG: CutsceneSpec = {
  stage: "cliff_heimu", mood: "dusk",
  title: "ศิษย์เอกของเข็มแดง", subtitle: "หน้าผาไม้ดำ",
  cast: {
    long: { name: N_LONG, look: "foe_swordsman", at: [3, 0], facing: "left", tint: GREY_ROBE, size: 0.95 },
    hero: { name: "{hero}", look: "hero", at: [-2, 0], facing: "right" },
    zhao: { name: N_ZHAO, look: ZHAO, at: [-5, 1], facing: "right" },
  },
  beats: [
    ["narrate", "หน้าผาไม้ดำ ลมพัดแรงจนต้นไม้เอนไปทางเดียวกันหมด เด็กหนุ่มคนหนึ่งยืนบนขอบผาโดยไม่ต้องจับอะไร"],
    ["say", "long", "พี่สาวข้าส่งเจ้ามาหรือ นางโกหกข้ามาทั้งปี บอกว่าในวังสบายดี ข้าก็โกหกนางว่าข้าสบายดี เราเป็นพี่น้องที่โกหกเก่งเหมือนกัน"],
    ["say", "zhao", "เด็กอายุสิบหกพูดจาเหมือนคนแก่ ข้าไม่ชอบเลย"],
    ["say", "long", "ท่านอาจารย์ใหญ่บอกว่าถ้าข้าหยุดเจ้าได้ ข้าจะไม่ต้องผ่านพิธี และพี่ข้าจะได้ออกจากวัง"],
    ["think", "hero", "ตาเขาแดง ลมหายใจร้อน… ไฟของเด็กคนนี้ยังไม่ถึงหัวใจ ยังทัน"],
    ["act", "long", "attack"],
    ["fx", "qi", "long"],
    ["fade", "out"],
  ],
};

const ACT4: readonly StoryChapterSpec[] = [
  // ── 20 ──
  {
    title: "บาดแผลเข็มเย็น",
    summary: "หมอหลินบอกว่าเข็มสามเล่มที่อกขันทีเกาเคลือบยาเย็นเข้มข้นจนเลือดหยุดไหลเวียน ต้องใช้บัวหิมะและโสมดึงความอุ่นกลับมา ก่อนเขาจะหลับไม่ตื่น",
    giver: LIN,
    offer: {
      lines: [
        [N_LIN, "เข็มสามเล่ม แทงเลี่ยงหัวใจไปครึ่งนิ้วทุกเล่ม เขาไม่ได้อยากฆ่าขันทีเกา เขาอยากให้ขันทีเกาเย็นลงช้า ๆ เหมือนที่ตัวเขาร้อนขึ้นช้า ๆ"],
        [N_LIN, "ข้าต้องการบัวหิมะสองดอกกับโสมสามราก บัวหิมะดึงพิษเย็นออก โสมเติมไฟกลับ ฟังดูง่าย แต่ถ้าสัดส่วนผิด เขาจะไหม้แทน"],
        [N_LIN, "ระหว่างที่เจ้าหายา ข้าจะคุยกับเขาไปเรื่อย ๆ หมอที่ดีต้องคุยกับคนไข้ หมอที่ดีมากต้องทำให้คนไข้โกรธจนไม่อยากตาย"],
        [N_LIN, "ข้าจะเล่าเรื่องที่ข้าโกงเขาค่ายาแก้ไอทุกหน้าหนาว เขาต้องฟื้นขึ้นมาทวงแน่"],
      ],
      go: "ออกไปหายา",
    },
    steps: [
      { t: "gather", itemId: "snow_lotus", count: 2, hint: "หาบัวหิมะ 2 ดอกให้หมอหลินดึงพิษเย็นออกจากอกขันทีเกา" },
      { t: "gather", itemId: "ginseng", count: 3, hint: "หาโสม 3 รากให้หมอหลินเติมความอุ่นกลับคืน" },
      { t: "talk", npcId: GAO, locationId: "palace_royal", label: "อยู่ข้างขันทีเกาตอนเขาฟื้น", hint: "กลับพระราชวังหลวง อยู่ข้างขันทีเกาตอนยาของหมอหลินออกฤทธิ์",
        scene: { lines: [
          "ขันทีเกาลืมตาขึ้นตอนเที่ยงคืน คำแรกที่เขาพูดคือ 'ค่ายาแก้ไอ… หมอนั่นโกงข้าจริงหรือ'",
          [N_GAO, "ข้าฝันว่ากวาดพื้นหอคัมภีร์อยู่ ฝุ่นไม่หมดสักที แล้วพ่อเจ้าก็เดินมาบอกว่า 'เลิกกวาดได้แล้ว ไปเปิดหน้าต่าง'"],
          [N_GAO, "ชุ่ยเอ๋อ… อย่าโกรธนาง ถ้าจะโกรธ โกรธข้า ข้าเห็นนางร้องไห้ทุกครั้งที่เดินออกจากตำหนักเย็น และข้าไม่เคยถาม"],
          [N_GAO, "ผ้าผืนที่ห้า พระสนมไม่เคยบอกใครว่าอยู่ไหน แต่ทุกฤดูใบไม้ผลิ นางส่งดอกไม้แห้งหนึ่งกำไปที่ **หุบเขาตัดใจ**"],
        ], go: "ให้เขาพักต่อ" } },
    ],
    complete: {
      lines: [
        [N_LIN, "ไข้ลดแล้ว ชีพจรกลับมาเต้นเป็นจังหวะ… ช้ากว่าคนปกตินิดหน่อย แต่ขันทีเกาก็ไม่เคยรีบอะไรอยู่แล้ว"],
        [N_LIN, "เรื่องค่ายาแก้ไอ ข้าโกงเขาจริง สามปีติด ข้าจะคืนให้ตอนเขาหายดี ถ้าเขาจำได้"],
        [N_LIN, "แล้วก็… ชุ่ยเอ๋อมาที่ร้านข้าเมื่อชั่วยามก่อน ตัวเปียกฝน ถามว่าขันทีเกาจะตายไหม ข้าบอกว่าไม่ นางร้องไห้แล้ววิ่งไปทางตำหนักเย็น"],
        ["{hero}", "ท่านหมอ… ท่านคิดว่านางเป็นคนบอกเรื่องกล่องยาหรือเปล่า"],
        [N_LIN, "ข้าเป็นหมอ ข้าดูออกแค่ว่าคนไหนป่วย คนที่ร้องไห้แบบนั้นป่วยหนักกว่าขันทีเกาเสียอีก — ป่วยที่ใจ"],
        [N_LIN, "ไปหานางเถิด ยาของข้ารักษาได้แค่ครึ่งเดียว อีกครึ่งต้องใช้คนที่นางกลัวว่าจะไม่ให้อภัย"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "item", itemId: "potion_big", count: 2 },
      { t: "npcRelationship", npcId: LIN, amount: 5 },
    ],
  },

  // ── 21 ──
  {
    title: "น้องชายของนางกำนัล",
    summary: "ชุ่ยเอ๋อสารภาพทุกอย่างกลางสายฝน ขันทีใหญ่กู้สั่งให้นางพาเจ้าไปติดกับดักที่วิหารหลวงจีนสวรรค์ นางขอให้เจ้าไปตามนัด — เพื่อจับคนที่วางกับดัก และหาว่าน้องชายนางอยู่ที่ไหน",
    giver: CUI,
    offer: {
      cutscene: FILM_CUI_CONFESSES,
      lines: [
        [N_CUI, "เขาสั่งให้ข้าพาเจ้าไปวิหารหลวงจีนสวรรค์คืนพรุ่งนี้ บอกว่ามีคนรู้ที่อยู่ของผ้าผืนที่ห้า ที่นั่นจะมีคนรอเจ้าอยู่… ไม่ใช่คนที่รู้อะไร"],
        [N_CUI, "ข้าบอกเจ้าก่อนได้ เพราะข้าโกหกเขาเป็นแล้ว ข้าเรียนจากเขาเองทั้งปี"],
        [N_CUI, "ไปตามนัดเถิด จับคนที่รออยู่ให้ได้ มันต้องรู้ว่าเสี่ยวหลงอยู่ไหน… ข้าไม่มีสิทธิ์ขออะไรจากเจ้าแล้ว แต่ข้าขอ"],
        [N_CUI, "แล้วหลังจากนั้น ถ้าเจ้าจะส่งข้าให้ศาล ข้าจะไปเอง ข้าจะถือกล่องยาไปด้วย จะได้มีอะไรทำมือ"],
      ],
      go: "ไปตามนัดที่วิหาร",
      asides: [
        { say: "ข้าไม่ส่งเจ้าให้ศาลหรอก", reply: [
          [N_CUI, "อย่าใจดีกับข้าตอนนี้ ข้ายังร้องไห้ไม่เสร็จ ถ้าเจ้าใจดี ข้าจะร้องต่ออีกสามวัน"],
        ] },
      ],
    },
    steps: [
      { t: "duel", locationId: "temple_tianning", label: "ซ้อนกับดักที่วิหารหลวงจีนสวรรค์", hint: "ไปวิหารหลวงจีนสวรรค์ตามนัดยามค่ำ จับคนที่ขันทีใหญ่ส่งมาซุ่มรอ", opponentId: WIDOW,
        before: { lines: [
          "ใยไหมเส้นบางขึงขวางทุกทางเข้าลานวิหาร พระเณรถูกขังรวมไว้ในหอระฆัง แม่ม่ายใยไหมนั่งไขว่ห้างอยู่บนหลังคา",
          [N_WIDOW, "เจอกันอีกแล้ว คราวก่อนข้าบอกว่าคนถามในงานนี้อายุสั้น คราวนี้ข้าได้ค่าจ้างสามเท่า เลยต้องทำให้สั้นจริง ๆ"],
          [N_WIDOW, "นางกำนัลตัวน้อยไม่มาด้วยหรือ น่าเสียดาย ขันทีใหญ่อยากให้นางเห็น"],
        ], go: "สู้" },
        after: { lines: [
          [N_WIDOW, "ข้าแพ้สองครั้งให้คนคนเดียว นี่ไม่ดีต่อราคาค่าจ้างของข้าเลย"],
          [N_WIDOW, "เด็กชื่อเสี่ยวหลงหรือ ข้าเคยเห็น เขาคุมขันทีเงารุ่นใหม่อยู่ที่ **หน้าผาไม้ดำ** ฝึกวิ่งบนขอบผาทุกเย็น"],
          [N_WIDOW, "ฟังนะ ข้ารับงานฆ่าคน ไม่รับงานตอนเด็ก งานนี้ข้าเลิก ฝากบอกขันทีใหญ่ด้วยว่าค่าจ้างข้าไม่คืน"],
        ] } },
    ],
    complete: {
      lines: [
        [N_CUI, "หน้าผาไม้ดำ… เขายังมีชีวิต ยังวิ่งได้ ยังอยู่ในแผ่นดินเดียวกับข้า"],
        [N_CUI, "ข้าขอไปด้วยไม่ได้ ข้ารู้ ข้าวิ่งไม่เป็น สู้ไม่เป็น เป็นแต่เล่าข่าว และข่าวของข้าทำร้ายคนมามากพอแล้ว"],
        [N_CUI, "แต่ข้าทำอย่างหนึ่งได้ ข้าจะเล่าข่าวปลอมให้ขันทีใหญ่ฟังต่อไป บอกเขาว่าเจ้าติดกับดักแล้ว บาดเจ็บหนัก นอนซมอยู่ร้านหมอหลิน"],
        [N_CUI, "เขาจะเชื่อ เพราะข้าไม่เคยโกหกเขามาก่อน… นั่นแหละที่ทำให้ข้าอยากร้องไห้อีก"],
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "trait", trait: "humility", amount: 3 },
      { t: "npcRelationship", npcId: CUI, amount: 6 },
    ],
  },

  // ── 22 ──
  {
    title: "คัมภีร์ฉบับตัดเล็บ",
    summary: "โปผู้เล่าเรื่องมีแผน: ปล่อยข่าวลือว่าคัมภีร์ฉบับแท้สั่งให้ 'ตัดเล็บ' จนตลาดบรรทัดต้องห้ามพัง นักฆ่าที่ได้เงินจากการขายบรรทัดจะหันมากัดกันเอง",
    giver: PO,
    offer: {
      lines: [
        [N_PO, "ข้าได้ยินจากเถ้าแก่โจวว่าบรรทัดต้องห้ามยังขายอยู่ทั่วยุทธภพ ราคาตกเหลือบรรทัดละครึ่งแท่ง เพราะคนเริ่มสงสัยว่าซื้อไปแล้วต้องตอนตัวเอง"],
        [N_PO, "ข้ามีความคิดดี ๆ ข้าจะเล่านิทานว่าคัมภีร์ฉบับแท้เขียนว่า 'จงตัด**เล็บ**ในตนเสียก่อน'"],
        [N_PO, "คนที่ซื้อบรรทัดไปจะคิดว่าตัวเองโดนหลอก ไปทวงเงินคืนจากคนขาย คนขายก็คือพวกนักฆ่าเงาที่ขันทีใหญ่จ้างไว้"],
        [N_PO, "เจ้าแค่ช่วยจัดการนักฆ่าที่โกรธข้าสักสามคน ข้าเป็นนักเล่าเรื่อง ไม่ใช่นักสู้ ข้าสู้ได้แต่ด้วยคำคุณศัพท์"],
      ],
      go: "ฟังโปเล่านิทาน",
      asides: [
        { say: "ท่านไม่กลัวนักฆ่ามาตามเล่นงานหรือ", reply: [
          [N_PO, "กลัวสิ! ข้าจึงให้เจ้ารับหน้าแทน ข้าจะบอกในนิทานว่าเจ้าหล่อ… หรือสวย… หรือทั้งสองอย่าง เจ้าเลือกเอง"],
        ] },
      ],
    },
    steps: [
      { t: "visit", locationId: "inn_heluo", label: "ฟังนิทานคัมภีร์ฉบับตัดเล็บ", hint: "ไปโรงเตี๊ยมเฮ่อลั่ว ดูโปผู้เล่าเรื่องปล่อยข่าวลือเรื่องคัมภีร์ฉบับตัดเล็บ",
        scene: { cutscene: FILM_NAIL_RUMOR, lines: [
          "สามวันต่อมา โรงเตี๊ยมเฮ่อลั่วต้องแขวนป้าย 'ห้ามตัดเล็บบนโต๊ะอาหาร' เพราะมีเศษเล็บตกลงในน้ำแกงสองชาม",
          ["เถ้าแก่โรงเตี๊ยม", "นี่โป! นิทานเจ้าทำให้ข้าต้องจ้างคนกวาดเล็บเพิ่มอีกคน!"],
          [N_PO, "ค่าจ้างคนกวาดเล็บถูกกว่าค่าทำศพเด็กร้อยคน เถ้าแก่ คิดเลขเป็นไหม"],
          "เถ้าแก่เงียบไป แล้วยกน้ำชามาให้โปอีกกาโดยไม่คิดเงิน",
        ], go: "รอพวกนักฆ่าที่โกรธ" } },
      { t: "hunt", opponentId: "shadow_assassin", count: 3, hint: "จัดการนักฆ่าเงาที่ออกตามล่าโปเพราะตลาดบรรทัดต้องห้ามพัง 3 คน (พบระหว่างเดินทาง)" },
    ],
    complete: {
      lines: [
        [N_PO, "ตลาดบรรทัดต้องห้ามพังแล้ว! ไม่มีใครซื้ออีก! เพราะทุกคนกลัวว่าบรรทัดที่ซื้อจะสั่งให้ตัดเล็บเท้า"],
        [N_PO, "เงินที่ขันทีใหญ่ใช้ซื้อเด็กก็หมดไปด้วย เถ้าแก่โจวบอกว่าเกวียนเที่ยวหน้ายกเลิกแล้ว ไม่มีทองจ่าย"],
        [N_PO, "นิทานเรื่องนี้ข้าจะเล่าทุกปี และทุกปีข้าจะบอกว่าข้าเป็นคนคิดเองทั้งหมด… ซึ่งก็จริง ข้าแค่ให้เจ้าโดนตีแทน"],
        [N_PO, "อ้อ มีชายแก่จากหุบเขาตัดใจส่งข่าวมาทางคาราวานผ้า เขาฝากถามว่า 'ปีนี้ดอกไม้แห้งยังไม่มา นางสบายดีหรือเปล่า'"],
      ],
    },
    reward: [
      { t: "wExp", amount: 220 },
      { t: "gold", amount: 150 },
      { t: "trait", trait: "fame", amount: 3 },
    ],
  },

  // ── 23 ──
  {
    title: "ผู้เฒ่าตัดใจ",
    summary: "หลินชัวซันอยู่ปากหุบเขาตัดใจมาสี่สิบปี เขาเคยรักหญิงสาวที่ถูกพาเข้าวัง และเก็บผ้าผืนที่ห้าไว้ — ผืนที่นางเรียกว่าหัวใจของวิชา",
    giver: JUEQING,
    offer: {
      cutscene: FILM_JUEQING_PAST,
      lines: [
        [N_JUEQING, "นางยังมีชีวิต… ดี ข้าไม่ได้ถามว่านางสบายดีไหม คนในตำหนักเย็นไม่มีใครสบายดี ข้าถามแค่ว่ายังมีชีวิต"],
        [N_JUEQING, "สี่สิบปีก่อนข้าคิดว่า 'ตัดใจ' แปลว่าเลิกรักนาง ข้าพยายามสิบปีแล้วก็ทำไม่ได้ ข้าเลยคิดว่าข้าเป็นคนอ่อนแอ"],
        [N_JUEQING, "แล้ววันหนึ่งข้าสังเกตว่าข้าไม่ได้อยากให้นางกลับมาอีกแล้ว ข้าแค่อยากให้นางมีชีวิตอยู่ ที่ไหนก็ได้ กับใครก็ได้"],
        [N_JUEQING, "วันนั้นข้าอ่านผ้าผืนนี้ออก ไม่ต้องตัดความรัก ต้องตัดความอยากได้ ความรักที่ไม่อยากได้อะไรตอบแทนนั้นเบามาก เบาจนเดินบนน้ำค้างได้"],
        [N_JUEQING, "ลงไปนั่งที่ก้นหุบเขาสักคืน ไม่ต้องคิดเรื่องผ้า ไม่ต้องคิดเรื่องวิชา คิดเรื่องสิ่งที่เจ้าอยากได้ที่สุด แล้วดูว่ามันหนักแค่ไหน"],
      ],
      go: "ลงไปก้นหุบเขา",
    },
    steps: [
      { t: "visit", locationId: "valley_jueqing_bottom", label: "นั่งสมาธิหนึ่งคืนที่ก้นหุบเขา", hint: "ลงไปก้นหุบเขาตัดใจ นั่งสมาธิหนึ่งคืน คิดถึงสิ่งที่อยากได้ที่สุด",
        scene: { lines: [
          "ก้นหุบเขามืดและเย็น ดอกไม้ป่าที่ไม่มีชื่อบานอยู่รอบโขดหิน เจ้านั่งลงแล้วหลับตา",
          "สิ่งแรกที่ผุดขึ้นมาคือหน้าบิดา — เจ้าอยากให้เขากลับบ้านช่วงตรุษตามสัญญา อยากได้ยินเขาพูดว่า 'เขียนคำว่าคืนให้พ่อดูหน่อย'",
          "สิ่งต่อมาคือวิชา เจ้าอยากเร็วพอจะหยุดเข็มแดงได้ อยากเร็วพอจะไม่มีใครต้องตายเพราะเจ้าไปถึงช้า",
          "สิ่งสุดท้ายเงียบกว่าทุกอย่าง — เจ้าอยากให้ทุกคนรู้ว่าเจ้าเป็นลูกที่ดีของนายหอ ความอยากนั้นหนักที่สุด และเจ้าไม่เคยรู้ตัวว่าแบกมันอยู่",
          "ตอนฟ้าสาง เจ้าวางมันลงทีละอย่าง ไม่ได้ทิ้ง แค่วางไว้ข้างโขดหิน แล้วลุกขึ้นยืน ร่างกายเบาจนแปลกใจ",
        ], go: "เดินขึ้นจากก้นหุบเขา" } },
      { t: "trait", trait: "humility", min: 40, hint: "วางความอยากลงทีละอย่าง (ความถ่อมตน 40)" },
    ],
    complete: {
      lines: [
        [N_JUEQING, "เดินขึ้นมาไม่หอบเลย ทางนั้นชันกว่าบันไดวังเสียอีก"],
        [N_JUEQING, "เจ้ายังรักพ่อเจ้าเท่าเดิมใช่ไหม ยังอยากหยุดเข็มแดงเท่าเดิม แต่ไม่ต้องแบกมันวิ่งแล้ว นั่นแหละ 'ตัด'"],
        [N_JUEQING, "พวกขันทีอ่านคำว่าตัดแล้วนึกถึงมีด เพราะในวังมีแต่มีด คนนอกวังอ่านแล้วนึกถึงกรรไกรตัดเล็บ เพราะโปเล่านิทาน… ฮ่า ข่าวมาถึงที่นี่ด้วย"],
        [N_JUEQING, "ผืนที่ห้าอยู่กับข้า แต่มีคนอื่นมาตามหามันก่อนเจ้า ชายตัวโตจากทางเหนือ ตั้งค่ายอยู่ปากหุบเขาตั้งแต่เมื่อวาน"],
      ],
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "trait", trait: "humility", amount: 4 },
      { t: "npcRelationship", npcId: JUEQING, amount: 6 },
    ],
  },

  // ── 24 ──
  {
    title: "ผืนที่ห้า",
    summary: "ทูตเหล็กทัพเหนือตามมาถึงหุบเขาตัดใจ คราวนี้เขาไม่ได้มาซื้อ เขามาตามคำสั่งที่เขาเกลียด — และหลินชัวซันจะยกผ้าผืนที่ห้าให้คนที่ยังยืนอยู่",
    giver: JUEQING,
    offer: {
      lines: [
        [N_JUEQING, "เขามาคนเดียว ไม่พาทหาร นั่งก่อไฟรอทั้งคืน ไม่บุก ไม่ขู่ ข้าว่าเขาไม่ได้อยากอยู่ที่นี่มากกว่าเรา"],
        [N_JUEQING, "แต่คำสั่งของทัพคือคำสั่ง คนที่ตัดใจจากคำสั่งไม่ได้ ก็ต้องสู้ไปตามมัน"],
        [N_JUEQING, "ไปคุยกับเขา หรือสู้กับเขา ข้าไม่สน ข้าแก่แล้ว ข้าสนแค่ว่าผ้าผืนนี้จะไปอยู่กับคนที่อ่านมันออก"],
        [N_JUEQING, "อีกอย่าง ไฟของเขาทำให้ดอกไม้หน้าบ้านข้าเหี่ยว ไล่เขาไปไกล ๆ ด้วยก็ดี"],
      ],
      go: "ไปหากองไฟที่ปากหุบเขา",
    },
    steps: [
      { t: "duel", locationId: "valley_jueqing", label: "เผชิญหน้าทูตเหล็กที่ปากหุบเขา", hint: "ไปปากหุบเขาตัดใจ เอาชนะทูตเหล็กทัพเหนือที่มารอผ้าผืนที่ห้า", opponentId: NORTH,
        before: { lines: [
          [N_NORTH, "เราเจอกันอีกแล้ว ข้าบอกเจ้าที่จินหลิงว่าคำสั่งไม่ได้มาจากข้า วันนี้ก็เช่นกัน"],
          [N_NORTH, "ขันทีใหญ่กู้บอกแม่ทัพว่าผ้าผืนนี้คือกุญแจของกองทหารร้อยคน แม่ทัพสั่งให้ข้าเอามาให้ได้ ไม่ว่าต้องฆ่ากี่คน"],
          [N_NORTH, "ข้าอยากให้คนแรกที่ข้าต้องฆ่าเป็นคนที่สู้ข้าได้ อย่างน้อยข้าจะไม่ต้องละอาย"],
        ], go: "สู้" },
        after: { lines: [
          [N_NORTH, "อีกแล้ว… เจ้าไม่ได้ตีแรงกว่าคราวก่อน แต่ข้าหาเจ้าไม่เจอ เหมือนเจ้าไม่ได้ยืนอยู่ตรงที่ข้าเห็น"],
          [N_NORTH, "ข้าจะกลับไปรายงานว่าผ้าผืนนี้ไม่มีอยู่จริง แม่ทัพจะโกรธ แต่แม่ทัพโกรธทุกวันอยู่แล้ว"],
          "ทูตเหล็กดับกองไฟด้วยมือเปล่า แล้วโค้งให้บ้านของหลินชัวซันหนึ่งครั้งก่อนเดินจากไป",
        ] } },
    ],
    complete: {
      lines: [
        "หลินชัวซันหยิบกล่องไม้เก่าออกจากใต้เตียง ผ้าลายทานตะวันผืนสุดท้ายพับไว้ข้างในกับดอกไม้แห้งสี่สิบกำ หนึ่งกำต่อหนึ่งปี",
        [N_JUEQING, "ผืนนี้ดอกทานตะวันหันหน้าตรง ทุกผืนที่เหลือจะหันมาหามัน นางบอกว่าเป็นหัวใจ"],
        [N_JUEQING, "ฝากบอกนางว่าดอกไม้แห้งปีนี้ข้าไม่ต้องการ ให้นางเก็บไว้ดูเองที่ตำหนักเย็น… ข้าสบายดี นางไม่ต้องห่วงข้าอีกแล้ว"],
        [N_JUEQING, "ไปเถิด กลิ่นลมจากทางตะวันออกบอกว่ามีเรื่องที่หน้าผาไม้ดำ"],
      ],
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "gold", amount: 200 },
      { t: "trait", trait: "good", amount: 3 },
    ],
  },

  // ── 25 ──
  {
    title: "เสี่ยวหลง",
    summary: "จ้าวเทียพาเจ้าไปหน้าผาไม้ดำ ที่เสี่ยวหลงศิษย์เอกของเข็มแดงคุมขันทีเงารุ่นใหม่ เจ้าต้องหยุดเขาโดยไม่ทำร้าย — เพราะพี่สาวของเขารออยู่",
    giver: ZHAO,
    require: all(stat("AGI", 120), { t: "trait", trait: "humility", min: 40 }),
    offer: {
      lines: [
        [N_ZHAO, "ชุ่ยเอ๋อมาหาข้าที่ระเบียง นางให้ของมาชิ้นหนึ่ง — ตุ๊กตาฟางหน้าตาเหมือนควาย บอกว่าน้องชายนางทำให้ตอนเด็ก ให้เอาไปให้เขาดู"],
        [N_ZHAO, "ข้าว่ามันเหมือนหมามากกว่าควาย แต่ข้าไม่ได้บอกนาง ข้าเป็นคนมีมารยาท"],
        [N_ZHAO, "ข้าลาเวรอีกครั้งแล้ว ผู้กองบอกว่าถ้าข้าลาอีก ข้าจะได้ไปเฝ้าคอกม้า ข้าบอกว่าดีเลย ม้าคุยรู้เรื่องกว่าผู้กอง"],
        [N_ZHAO, "สัญญากับข้าอย่างหนึ่ง เด็กคนนั้นอายุเท่าน้องข้า อย่าให้เขาตกผา"],
      ],
      go: "สัญญา แล้วออกเดินทาง",
    },
    steps: [
      { t: "duel", locationId: "cliff_heimu", label: "หยุดเสี่ยวหลงบนหน้าผาไม้ดำ", hint: "ไปไม้ดำหน้าผากับจ้าวเทีย หยุดเสี่ยวหลงโดยไม่ให้เขาตกผา", opponentId: LONG,
        before: { cutscene: FILM_XIAOLONG, lines: [
          "เสี่ยวหลงวิ่งเร็วจนลมหวีดตามหลัง เข็มในมือเขาไม่มีพิษ เขาเลือกเข็มเปล่าเอง",
          [N_ZHAO, "เขาเลือกเข็มไม่มีพิษ… เห็นไหม เด็กคนนี้ยังไม่หายไปไหน"],
        ], go: "รับมือ โดยไม่เร่งตาม" },
        after: { lines: [
          "เสี่ยวหลงเสียหลักที่ขอบผา เจ้าคว้าข้อมือเขาไว้ทัน จ้าวเทียคว้าข้อเท้าเจ้าไว้อีกที ทั้งสามคนห้อยอยู่ครู่หนึ่งแบบไม่มีใครดูดีเลย",
          [N_ZHAO, "ดึงขึ้นมาเร็ว! ข้าจับขาเจ้าไว้ได้อีกไม่นาน ขาเจ้าลื่นเหมือนปลาไหล!"],
          "ตุ๊กตาฟางหล่นจากอกเสื้อจ้าวเทีย เสี่ยวหลงมองมันแล้วร้องไห้ เป็นครั้งแรกในรอบปีที่ไอร้อนในตัวเขาจางลง",
          [N_LONG, "ควายของข้า… พี่ยังเก็บไว้"],
          [N_ZHAO, "นั่นควายหรอกหรือ ข้านึกว่าหมา… ไม่ ข้าไม่ได้พูด"],
        ] } },
    ],
    complete: {
      lines: [
        [N_LONG, "ท่านอาจารย์ใหญ่ไม่อยู่ที่หน้าผานี้แล้ว เขาไปทางเหนือตั้งแต่สองคืนก่อน พร้อมผ้าสี่ผืน… และพร้อมพระสนม"],
        [N_LONG, "คืนที่พี่ข้าบอกว่าเจ้าบาดเจ็บนอนซมที่ร้านหมอ เขาหัวเราะแล้วบอกว่า 'ดี งั้นตำหนักเย็นก็ไม่มีใครเฝ้า'"],
        [N_LONG, "เขาพาพระสนมไปวังจงหยาง เพราะผ้าสี่ผืนเขาอ่านไม่ออก เขาต้องให้คนเย็บเป็นคนอ่าน และพิธีตัดร้อยคนจะทำที่นั่น"],
        [N_ZHAO, "ข่าวปลอมของชุ่ยเอ๋อ… ทำให้เขาไปเร็วขึ้น นางจะต้องโทษตัวเองอีกแน่ เราไม่บอกนางเรื่องนี้ได้ไหม"],
        "เจ้ามองไปทางเหนือ ควันจากแนวรบลอยเป็นเส้นบางบนขอบฟ้า ศึกจิ้งหนานยังไม่จบ และพระสนมชราคนหนึ่งกำลังถูกพาเข้าไปกลางมัน",
      ],
      go: "หันหน้าไปทางเหนือ",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: ZHAO, amount: 6 },
      { t: "npcRelationship", npcId: CUI, amount: 4 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// ACT 5 · ตะวันเหนือ (26–30)
// North, into ศึกจิ้งหนาน: the road of deserters and wagons, the Brocade
// Guards' own price for help, ขันทีเกา leaving the palace for the first time
// in thirty years, the raid on วังจงหยาง where the boys and the consort are
// held, and the northern envoy's last order. Gu is not there — he has gone
// back to the capital to open the palace gate for the north, and he waits
// for the fifth panel.
// ═════════════════════════════════════════════════════════════════════

const FILM_NORTH_ROAD: CutsceneSpec = {
  stage: "mt_leigu", mood: "night",
  title: "ถนนสายเหนือ", subtitle: "ศึกจิ้งหนาน ปีที่สาม",
  cast: {
    hero: { name: "{hero}", look: "hero", at: [-4, 1], facing: "right" },
    soldier: { name: "ทหารหนีทัพ", look: "foe_marauder", at: [3, 0], facing: "left" },
    boy: { name: "เด็กในเกวียน", look: "village_noname_child_xiaowu", at: [5, 1], facing: "left", size: 0.85 },
  },
  beats: [
    ["narrate", "ป้อมหลำกู่ร้างมาตั้งแต่ฤดูใบไม้ร่วง ทัพทั้งสองฝ่ายผ่านมันไปมาเหมือนน้ำขึ้นน้ำลง เหลือไว้แต่ทหารที่หลงทางและหนีทัพ"],
    ["say", "soldier", "เกวียนผ้าใบผ่านไปเมื่อเช้า ขันทีหน้าซีดจ่ายค่าผ่านทางเป็นข้าวสามกระสอบ ข้ารับไว้ ข้าหิว"],
    ["say", "boy", "พี่ ๆ ทหาร… วังจงหยางไกลอีกไหม"],
    ["say", "soldier", "อีกสองวัน… ข้าไม่ได้มองหน้าเด็กพวกนั้นเลย ข้ากลัวจะเห็นหน้าน้องชายตัวเอง"],
    ["think", "hero", "ทุกคนบนถนนนี้ขายอะไรสักอย่างแลกกับข้าวสามกระสอบ… บางคนขายลูก บางคนขายตา"],
    ["fx", "fire", "soldier"],
    ["fx", "smoke"],
    ["fade", "out"],
  ],
};

const FILM_GAO_GATE: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "dusk",
  title: "ประตูวังที่ไม่เคยข้าม",
  cast: {
    gao: { name: N_GAO, look: "m3", at: [-1, 0], facing: "right" },
    zhao: { name: N_ZHAO, look: ZHAO, at: [2, 0], facing: "left" },
    lin: { name: N_LIN, look: LIN, at: [-4, 1], facing: "right" },
  },
  beats: [
    ["narrate", "ขันทีเกายืนหน้าประตูวังด้านตะวันออก ผ้าพันแผลยังพันอยู่ใต้เสื้อ มือถือห่อผ้าเล็ก ๆ ห่อเดียว"],
    ["say", "zhao", "ท่านขันทีจะออกไปจริงหรือ สามสิบปีไม่เคยก้าวข้ามธรณีประตูนี้เลยนะ ข้าเฝ้ามาสามปี ข้ารู้"],
    ["say", "gao", "สามสิบปีที่ข้าบอกตัวเองว่าข้างนอกไม่มีอะไรสำหรับขันที… แต่ข้างนอกมีเด็กร้อยคนที่กำลังจะเป็นขันทีเพราะข้าเงียบ"],
    ["say", "lin", "เดินช้า ๆ แผลยังไม่ปิด และอย่าใช้เท้าไร้เสียงนั่น ข้าอยากได้ยินว่าท่านล้มตรงไหน"],
    ["move", "gao", [1, 0]],
    ["act", "gao", "idle"],
    ["think", "gao", "ธรณีประตูสูงแค่คืบเดียว… ข้ากลัวมันมาสามสิบปี"],
    ["move", "gao", [4, 0]],
    ["say", "zhao", "ข้ามแล้ว! ท่านขันทีข้ามแล้ว! …ข้าควรปรบมือไหม"],
    ["fade", "out"],
  ],
};

const FILM_ZHONGYANG_RAID: CutsceneSpec = {
  stage: "palace_zhongyang", mood: "night",
  title: "พระราชวังจงหยาง", subtitle: "ลานพิธี ยามสาม",
  cast: {
    cui: { name: N_CUI, look: CUI, at: [-4, 1], facing: "right" },
    hero: { name: "{hero}", look: "hero", at: [-2, 1], facing: "right" },
    long: { name: N_LONG, look: "foe_swordsman", at: [-5, 0], facing: "right", tint: GREY_ROBE, size: 0.95 },
    shadow: { name: N_SHADOW, look: "foe_assassin", at: [3, 0], facing: "left", tint: GREY_ROBE },
  },
  beats: [
    ["narrate", "ลานพิธีของวังจงหยางมีแท่นหินกลางลาน บนแท่นมีมีดเล่มเล็กวางเรียงกันร้อยเล่ม ใต้ระเบียงมีเด็กชายนั่งเรียงแถว ไม่มีใครหลับ"],
    ["say", "cui", "ข้าจะร้องเพลงที่พระสนมร้องกล่อมแมวทุกคืน ถ้านางได้ยิน นางจะรู้ว่าเรามาแล้ว"],
    ["say", "long", "พี่… เพลงนั้นมันเพลงกล่อมแมว พี่ร้องเพี้ยนตั้งแต่ข้าห้าขวบ"],
    ["say", "cui", "เพี้ยนแต่ดัง! ใครจะสนใจ!"],
    ["narrate", "เสียงร้องเพลงเพี้ยน ๆ ดังขึ้นกลางความเงียบ จากหอทางทิศเหนือ มีเสียงฮัมตอบกลับมาเบา ๆ — ตรงจังหวะทุกคำ"],
    ["say", "shadow", "ใครน่ะ! พิธีตัดยังไม่ถึงเวลา!"],
    ["act", "shadow", "attack"],
    ["fx", "slash", "hero"],
    ["act", "hero", "guard"],
    ["fade", "out"],
  ],
};

const FILM_ENVOY_ORDER: CutsceneSpec = {
  stage: "palace_zhongyang", mood: "dusk",
  title: "คำสั่งสุดท้าย",
  cast: {
    north: { name: N_NORTH, look: "foe_enforcer", at: [1, 0], facing: "left", tint: "#4a5a6a", size: 1.1 },
    hero: { name: "{hero}", look: "hero", at: [-2, 0], facing: "right" },
    consort: { name: N_CONSORT, look: "f4", at: [-5, -1], facing: "right", tint: OLD_SILK },
    zhao: { name: N_ZHAO, look: ZHAO, at: [-4, 1], facing: "right" },
  },
  beats: [
    ["act", "north", "defeat"],
    ["narrate", "ทูตเหล็กคุกเข่าข้างหนึ่ง ปักทวนลงดิน ทหารเหนือห้าสิบนายที่ล้อมลานยืนนิ่ง รอคำสั่งของเขา"],
    ["say", "north", "ทุกคนฟัง! เด็กพวกนี้ไม่ใช่ทหาร ไม่ใช่เสบียง ไม่ใช่ของกำนัล เปิดประตูวัง ให้พวกเขากลับบ้าน"],
    ["say", "north", "ถ้าแม่ทัพถามว่าใครสั่ง บอกว่าข้า ข้าจะรับโทษเอง ข้ารับโทษเก่งกว่ารับคำสั่ง"],
    ["fx", "petals"],
    ["say", "consort", "เด็กกวาดพื้นคนนั้นไม่อยู่ที่นี่หรอก ลูกนายหอ เขาไปตั้งแต่ข้าอ่านผ้าสี่ผืนให้ฟังจบ"],
    ["say", "consort", "เขาบอกว่าทัพเหนือจะมาถึงนครหลวงในไม่ช้า และเขาจะเป็นคนเปิดประตูวังรับ… หลังจากได้ผืนที่ห้าจากเจ้า"],
    ["say", "zhao", "เปิดประตูวังให้ข้าศึก? ข้าเฝ้าประตูนั้นมาสามปี! ข้าไม่ยอม!"],
    ["think", "hero", "เขาไม่ต้องตามหาข้าอีกแล้ว เขาจะรอข้าอยู่ในวัง ที่ที่ทุกอย่างเริ่ม"],
    ["fade", "out"],
  ],
};

const ACT5: readonly StoryChapterSpec[] = [
  // ── 26 ──
  {
    title: "แผนที่ศึก",
    summary: "นักยุทธศาสตร์กงกางแผนที่ศึกจิ้งหนานให้ดูเส้นทางไปพระราชวังจงหยาง ถนนเต็มไปด้วยทหารหนีทัพที่ปล้นทุกอย่างที่เคลื่อนไหว — รวมถึงเกวียนเด็ก",
    giver: KONG,
    require: all(stat("AGI", 120), stat("VIT", 100)),
    offer: {
      lines: [
        [N_KONG, "วังจงหยางอยู่ใกล้แนวรบ ทางไปมีสามสาย สายหนึ่งผ่านทัพใต้ สายหนึ่งผ่านทัพเหนือ สายที่สามผ่านป้อมหลำกู่ที่ไม่มีทัพไหนอยากได้"],
        [N_KONG, "เจ้าจะไปสายที่สาม เพราะสองสายแรกต้องอธิบายว่าเจ้าเป็นใคร และคำอธิบายของเจ้ายาวเกินไปสำหรับทหารเฝ้าด่าน"],
        [N_KONG, "สายที่สามมีทหารหนีทัพตั้งกลุ่มปล้นอยู่สี่ห้ากลุ่ม หัวหน้าแต่ละกลุ่มเคยเป็นนายกองมาก่อน ฝีมือไม่ธรรมดา"],
        [N_KONG, "ไปดูที่ป้อมหลำกู่ก่อนว่าเกวียนผ่านไปกี่เล่ม ข้าอยากรู้ว่าเราตามหลังเขาอยู่กี่วัน ในสงคราม หนึ่งวันคือเด็กสิบคน"],
      ],
      go: "ออกเดินทางขึ้นเหนือ",
      asides: [
        { say: "ท่านไม่ไปด้วยหรือ", reply: [
          [N_KONG, "ข้าเป็นนักยุทธศาสตร์ ข้าไปได้แค่ในแผนที่ ในแผนที่ข้าเดินเร็วมาก ข้างนอกข้าเดินช้ากว่าเต่าที่เป็นหวัด"],
        ] },
      ],
    },
    steps: [
      { t: "visit", locationId: "mt_leigu", label: "สำรวจเส้นทางที่ป้อมหลำกู่", hint: "ไปป้อมหลำกู่ ดูว่าเกวียนเด็กผ่านไปทางเหนือเมื่อไร",
        scene: { cutscene: FILM_NORTH_ROAD, lines: [
          "รอยล้อเกวียนสามเส้นลึกในโคลน ยังไม่ทันแห้ง เศษผ้าใบติดอยู่กับกิ่งไม้ข้างทาง บนเศษผ้ามีรอยมือเด็กเปื้อนดิน",
          ["ทหารหนีทัพ", "เกวียนผ่านไปไม่ถึงวัน ถ้าเจ้าจะตาม อย่าเดินทางกลางคืน กลุ่มของนายกองเก่าพวกนั้นไม่ได้แค่หิว มันบ้าไปแล้ว"],
          ["ทหารหนีทัพ", "ข้าเคยเป็นทหารเหมือนกัน แต่ข้าหนีเพราะไม่อยากฆ่าคน พวกนั้นหนีเพราะอยากฆ่าโดยไม่ต้องมีใครสั่ง"],
          "เขาแบ่งข้าวหนึ่งกระสอบจากสามกระสอบที่ได้มา วางไว้ข้างทาง สำหรับเกวียนเที่ยวต่อไปที่อาจไม่มีวันมา",
        ], go: "ตามรอยล้อเกวียนต่อไป" } },
      { t: "hunt", opponentId: "bandit_lieutenant", count: 4, hint: "จัดการหัวหน้ากลุ่มทหารหนีทัพที่ปล้นบนถนนสายเหนือ 4 คน (พบระหว่างเดินทาง)" },
    ],
    complete: {
      lines: [
        [N_KONG, "ตามหลังหนึ่งวัน… ดีกว่าที่ข้าคำนวณไว้ครึ่งวัน เจ้าเดินเร็วขึ้น หรือข้าคำนวณผิด ข้าเลือกเชื่ออย่างแรก"],
        [N_KONG, "ข้าส่งนกไปหาเฟิงร้านบะหมี่แล้ว กรมองครักษ์มีด่านลับอยู่ใกล้วังจงหยาง ถ้าเขายอมช่วย เจ้าจะเข้าไปได้โดยไม่ต้องปีนกำแพง"],
        [N_KONG, "แต่เฟิงเป็นคนของกรม และกรมไม่เคยช่วยใครฟรี ระวังบะหมี่ของเขาด้วย ข้าได้ยินว่าเค็มขึ้นทุกครั้งที่ข่าวแย่ลง"],
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "gold", amount: 200 },
      { t: "item", itemId: "potion_big", count: 2 },
    ],
  },

  // ── 27 ──
  {
    title: "บะหมี่ชามสุดท้าย",
    summary: "เฟิงเจ้าของร้านบะหมี่ได้รับคำสั่งจากกรมองครักษ์: ยึดผ้าผืนที่ห้าไว้ก่อนทั้งสองทัพ เขาไม่อยากทำ แต่เขาทำตามคำสั่งมาตลอดชีวิต",
    giver: FENG,
    offer: {
      lines: [
        [N_FENG, "บะหมี่ชามนี้ข้าไม่คิดเงิน และมันเค็มที่สุดตั้งแต่ข้าเปิดร้าน ข้าใส่เกลือไปครึ่งถุงตอนอ่านคำสั่ง"],
        [N_FENG, "ผู้บัญชาการสั่งว่า 'ยึดผ้าผืนที่ห้าไว้ในคลังของกรม เพื่อมิให้ตกถึงมือฝ่ายใด' ฟังดูดีใช่ไหม หอคัมภีร์หลวงก็เริ่มจากประโยคแบบนี้"],
        [N_FENG, "ข้าทำตามคำสั่งมายี่สิบปี จับคน ฟังคน จดชื่อคน… วันนี้ข้าจะทำตามคำสั่งอีกครั้ง ข้าจะพยายามยึดผ้าจากเจ้า"],
        [N_FENG, "คำสั่งไม่ได้บอกว่าข้าต้องสำเร็จ ข้าแค่ต้องพยายาม… ดังนั้นพยายามอย่าให้ข้าสำเร็จนะ"],
      ],
      go: "วางตะเกียบลง",
    },
    steps: [
      { t: "duel", locationId: "city_capital", label: "ประลองกับเฟิงในตรอกร้านบะหมี่", hint: "ประลองกับเฟิงเจ้าของร้านบะหมี่ในตรอกหลังนครหลวง อย่าให้เขายึดผ้าผืนที่ห้าไป", opponentId: "spar_spy_feng",
        before: { lines: [
          "เฟิงพับแขนเสื้อขึ้น ผ้ากันเปื้อนยังคาดเอว ในมือถือตะเกียบเหล็กคู่หนึ่งแทนอาวุธ",
          [N_FENG, "ตะเกียบนี้ข้าใช้คีบเส้นมายี่สิบปี คีบลูกดอกก็เคย คีบลูกตาคนก็เคย… ขอโทษ ข้าพูดเรื่องนี้ไม่ควร มาเถิด"],
          "ลูกค้าสองคนที่โต๊ะริมตรอกยกชามบะหมี่หนีเข้าไปกินในร้าน โดยไม่ลืมยกขวดน้ำส้มสายชูไปด้วย",
        ], go: "สู้" },
        after: { lines: [
          [N_FENG, "พยายามแล้ว ล้มเหลวแล้ว ข้าจะรายงานตามจริงทุกตัวอักษร ผู้บัญชาการจะได้เห็นว่าข้าพยายามแค่ไหน — แผลที่แขนนี่ไง"],
          [N_FENG, "เอาป้ายนี้ไป ป้ายผ่านด่านลับของกรมใกล้วังจงหยาง ข้าไม่ได้ให้ เจ้าขโมยไปตอนเราสู้กัน จำไว้นะ"],
          "เขาเช็ดตะเกียบกับผ้ากันเปื้อน แล้วหันไปตักน้ำแกงใส่ชามใหม่ ชามนี้เขาไม่ได้ใส่เกลือเลย",
        ] } },
    ],
    complete: {
      lines: [
        [N_FENG, "ป้ายนั่นเปิดด่านได้ แต่ไม่ได้เปิดใจผู้บัญชาการ เขาจะรู้ภายในสามวันว่าป้ายหาย"],
        [N_FENG, "ถ้าเจ้าอยากให้กรมองครักษ์ช่วยจริง ๆ ต้องไปคุยกับผู้บัญชาการจ้าวฝู่เอง เขาไม่ฟังคำพูด เขาฟังหมัด"],
        [N_FENG, "ขันทีเกากำลังจะไปที่นั่นด้วย ข้าได้ข่าวว่าเขาเตรียมข้ามประตูวัง… สามสิบปีแล้วนะ ข้าเฝ้าดูเขามาตลอด ไม่นึกว่าจะได้เห็นวันนี้"],
        [N_FENG, "ชามนี้ลองชิมหน่อย บอกข้าว่ามันจืดไหม… จืดหรือ ดี วันนี้ข่าวดี"],
      ],
    },
    reward: [
      { t: "wExp", amount: 240 },
      { t: "trait", trait: "fame", amount: 3 },
      { t: "npcRelationship", npcId: FENG, amount: 6 },
    ],
  },

  // ── 28 ──
  {
    title: "ขันทีกับเสื้อแพร",
    summary: "ขันทีเกาก้าวข้ามธรณีประตูวังเป็นครั้งแรกในรอบสามสิบปี เพื่อไปขอให้ผู้บัญชาการกรมองครักษ์ส่งคนคุ้มกันเด็กกลับบ้าน — ผู้บัญชาการขอดูหมัดก่อนฟังคำ",
    giver: GAO,
    offer: {
      cutscene: FILM_GAO_GATE,
      lines: [
        [N_GAO, "ข้างนอกวังเสียงดังกว่าที่ข้าคิด นกร้อง คนตะโกน ล้อเกวียน… ข้าคิดว่าข้าจะชอบความเงียบมากกว่า แต่ข้าคิดผิด"],
        [N_GAO, "ผู้บัญชาการจ้าวฝู่ ข้ารู้จักเขาตั้งแต่เขายังเป็นองครักษ์ชั้นผู้น้อย เขาเคยมาขอข้าวสารจากคลังข้าตอนเบี้ยหวัดค้าง ข้าให้เกินไปหนึ่งกระสอบ"],
        [N_GAO, "เด็กร้อยคนที่วังจงหยาง เมื่อเราพาออกมาได้ ต้องมีคนคุ้มกันพวกเขากลับทุกหมู่บ้าน ทั้งสองทัพไม่มีใครว่าง มีแต่เสื้อแพรที่ว่าง"],
        [N_GAO, "ข้าจะพูด เจ้าจะสู้ ผู้บัญชาการคนนี้ฟังคำพูดได้ก็ต่อเมื่อหมัดของเขาเพิ่งแพ้"],
      ],
      go: "เดินทางไปกรมองครักษ์เสื้อแพร",
    },
    steps: [
      { t: "duel", locationId: "sect_jinyiwei", label: "ประลองกับผู้บัญชาการจ้าวฝู่", hint: "ไปกรมองครักษ์เสื้อแพรกับขันทีเกา ประลองกับผู้บัญชาการจ้าวฝู่เพื่อขอคนคุ้มกันเด็ก", opponentId: "spar_jinyiwei_leader",
        before: { lines: [
          [N_JYW, "ขันทีเกาออกจากวัง… ข้านึกว่าจะได้เห็นแม่น้ำไหลกลับก่อน"],
          [N_JYW, "เฟิงรายงานว่าลูกนายหอขโมยป้ายผ่านด่านของกรมไปตอนประลองกัน ข้าเชื่อ เพราะเฟิงไม่เคยโกหกเก่งขนาดนั้น… เอาละ ให้ข้าดูว่าเจ้าขโมยเก่งแค่ไหน"],
        ], go: "ประลอง" },
        after: { lines: [
          [N_JYW, "ข้าล้มคนมาเจ็ดคนในศึกเดียวเมื่อสิบปีก่อน วันนี้ข้าล้มเองครั้งเดียวก็พอแล้ว"],
          [N_JYW, "สามสิบนาย ม้าหกตัว เกวียนสิบเล่ม พอสำหรับพาเด็กร้อยคนกลับบ้าน บอกพวกมันว่าเป็นงานของกรม ไม่ใช่ของทัพไหน"],
          [N_GAO, "ข้าติดหนี้ท่านหนึ่งกระสอบ"],
          [N_JYW, "ไม่ ข้าติดท่าน… กระสอบนั้นข้ายังจำได้ ลูกข้ากินมันทั้งหน้าหนาว"],
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "สามสิบนาย… ข้าไม่เคยมีใครให้ข้ามากกว่าข้าวสารหนึ่งกระสอบ"],
        [N_GAO, "ข้างนอกวังผู้คนเดินเร็วแต่ไม่มีใครวิ่งหนีใคร ข้ายังปรับตัวไม่ได้ เดินไปทีไรเท้าข้าเงียบเองทุกที"],
        [N_GAO, "ชุ่ยเอ๋อยืนกรานจะไปวังจงหยางด้วย นางบอกว่าพระสนมจะได้ยินเสียงเพลงของนาง ข้าบอกว่าเสียงนางเพี้ยน นางบอกว่านั่นแหละสัญญาณ"],
        [N_GAO, "ไปกับนางเถิด ข้าจะตามไปพร้อมกองคุ้มกัน ช้ากว่าหน่อย ขาข้ายังไม่ชินกับพื้นที่ไม่ได้ปูหิน"],
      ],
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "trait", trait: "fame", amount: 3 },
      { t: "npcRelationship", npcId: GAO, amount: 6 },
    ],
  },

  // ── 29 ──
  {
    title: "ชิงตัวพระสนม",
    summary: "ชุ่ยเอ๋อกับเสี่ยวหลงนำทางเข้าพระราชวังจงหยางยามค่ำ เพลงกล่อมแมวเพี้ยน ๆ ของนางคือสัญญาณ ขันทีเงาเฝ้าลานพิธีที่มีมีดร้อยเล่มวางรอ",
    giver: CUI,
    offer: {
      lines: [
        [N_CUI, "ข้าไปด้วย ห้ามเถียง ข้าเป็นคนบอกเขาเรื่องกล่องยา ข้าต้องเป็นคนเอาพระสนมกลับมา"],
        [N_CUI, "เสี่ยวหลงรู้ทางเข้าวังจงหยาง เขาวิ่งรอบกำแพงทุกเย็นตอนฝึก… ไม่ต้องห่วง เขาเลิกวิ่งรอบกำแพงคนอื่นแล้ว เขาจะวิ่งรอบนาที่บ้านแทน"],
        [N_CUI, "พระสนมร้องเพลงกล่อมแมวส้มทุกคืน ถ้านางได้ยินเพลงนั้น นางจะฮัมตอบ เราจะรู้ว่านางอยู่หอไหน"],
        [N_CUI, "อย่าบอกข้าว่าข้าร้องเพี้ยน ทุกคนบอกแล้ว รวมถึงแมวด้วย"],
      ],
      go: "ออกเดินทางไปวังจงหยาง",
    },
    steps: [
      { t: "duel", locationId: "palace_zhongyang", label: "บุกลานพิธีในพระราชวังจงหยาง", hint: "บุกพระราชวังจงหยางยามค่ำกับชุ่ยเอ๋อและเสี่ยวหลง ฝ่าขันทีเงาที่เฝ้าลานพิธี", opponentId: SHADOW,
        before: { cutscene: FILM_ZHONGYANG_RAID, lines: [
          "ขันทีเงาที่เฝ้าลานเป็นรุ่นพี่ของเสี่ยวหลง ผ่านพิธีตัดมาแล้วสองปี ตาของเขาแดงก่ำ และร้อนจนน้ำค้างบนกระเบื้องรอบตัวระเหยเป็นไอ",
          [N_LONG, "รุ่นพี่… พวกเราเลิกได้ ไฟมันไม่หยุดเพราะมีด มันหยุดเพราะเราเลิกวิ่ง"],
        ], go: "สู้" },
        after: { lines: [
          "รุ่นพี่ขันทีเงาทรุดลงนั่งกับพื้นลาน มองมีดร้อยเล่มบนแท่น แล้วก็หัวเราะทั้งน้ำตา",
          [N_SHADOW, "สองปีที่ข้าทนร้อน เพราะเขาบอกว่าวันหนึ่งไฟจะสงบ… มันไม่เคยสงบเลย ข้าแค่เลิกรู้สึก"],
          [N_LONG, "มากับพวกเรา หมอหลินในนครหลวงมียาเย็นที่ไม่ต้องกินทุกเช้า"],
        ] } },
      { t: "visit", locationId: "palace_zhongyang", label: "ตามเสียงฮัมไปหาพระสนม", hint: "ตามเสียงฮัมเพลงกล่อมแมวไปหอทางทิศเหนือของพระราชวังจงหยาง ช่วยพระสนมออกมา",
        scene: { lines: [
          "ประตูหอทิศเหนือถูกล็อกด้วยโซ่ทองแดง พระสนมนั่งปักผ้าอยู่ข้างใน ราวกับไม่ได้ถูกจับมา แค่ย้ายที่นั่งปักผ้า",
          [N_CONSORT, "ชุ่ยเอ๋อ เจ้าร้องเพี้ยนกว่าเดิมอีก"],
          [N_CUI, "หม่อมฉันขอโทษเพคะ… เรื่องกล่องยา เรื่องทุกอย่าง หม่อมฉัน…"],
          [N_CONSORT, "ข้ารู้ตั้งแต่เดือนแรกแล้ว เด็กโง่ คนที่โกหกข้าไม่เคยเอายามาให้ตรงเวลาทุกคืนหรอก เจ้าเอามาตรงเวลาทุกคืน ข้าเลยรู้ว่าเจ้าไม่ได้อยากทำ"],
          "ชุ่ยเอ๋อร้องไห้โฮ เสี่ยวหลงยืนเกาหัวอยู่หน้าประตู ไม่รู้จะเข้าไปกอดใครก่อน",
        ], go: "พาพระสนมออกจากหอ" } },
    ],
    complete: {
      lines: [
        [N_CONSORT, "เด็กกวาดพื้นคนนั้นให้ข้าอ่านผ้าสี่ผืนให้ฟัง ข้าอ่านให้ฟังทุกตัวอักษร ไม่ได้โกหกเลยสักคำ"],
        [N_CONSORT, "เพราะผ้าสี่ผืนไม่มีคำตอบที่เขาอยากได้ คำตอบอยู่ในผืนที่ห้า ผืนที่หัวใจหันหน้าตรง"],
        [N_CONSORT, "และต่อให้เขาได้ผืนที่ห้า เขาก็อ่านไม่ออก คนที่อยากได้วิชานี้มาทั้งชีวิตอ่านมันไม่ออก มันเขียนไว้แบบนั้น"],
        [N_CUI, "แล้วลานพิธีข้างนอก… ทหารทางเหนือห้าสิบนายกำลังเดินเข้ามา มีชายตัวโตถือทวนนำหน้า"],
      ],
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "trait", trait: "good", amount: 4 },
      { t: "npcRelationship", npcId: CUI, amount: 6 },
    ],
  },

  // ── 30 ──
  {
    title: "คำสั่งสุดท้ายของทูตเหล็ก",
    summary: "ทูตเหล็กทัพเหนือยืนขวางประตูพระราชวังจงหยางพร้อมทหารห้าสิบนาย คำสั่งของเขาคือส่งเด็กร้อยคนให้ทัพ — คราวนี้เขาจะสู้เพื่อดูว่าคำสั่งนั้นควรค่าแก่การทำตามหรือไม่",
    giver: ZHAO,
    require: all(stat("AGI", 120), { t: "trait", trait: "fame", min: 50 }),
    offer: {
      lines: [
        [N_ZHAO, "ข้ามาทันแล้ว! กองคุ้มกันของกรมองครักษ์ตามมาข้างหลังอีกครึ่งวัน ขันทีเกาขี่ม้าไม่เป็น ต้องนั่งเกวียนเสบียงมา"],
        [N_ZHAO, "ชายตัวโตที่ประตูบอกว่าจะคุยกับเจ้าคนเดียว ไม่ให้ทหารของเขาขยับ ข้าว่าเขาเป็นคนประหลาดดี ข้าชอบ"],
        [N_ZHAO, "เด็กร้อยคนอยู่ข้างหลังเรา พวกเขาเงียบมาก เงียบเหมือนอาโถวตอนนั่งในเกวียน ข้าไม่ชอบความเงียบแบบนี้เลย"],
        [N_ZHAO, "ไปเถิด ข้าจะยืนข้างหน้าเด็ก ๆ ถือทวนไว้ ไม่ได้จะสู้ใคร แค่ให้พวกเขามีอะไรมองที่ไม่ใช่มีดบนแท่น"],
      ],
      go: "เดินไปที่ประตูวัง",
    },
    steps: [
      { t: "duel", locationId: "palace_zhongyang", label: "สู้กับทูตเหล็กที่ประตูพระราชวังจงหยาง", hint: "เผชิญหน้าทูตเหล็กทัพเหนือที่ประตูพระราชวังจงหยาง เพื่อให้เด็กร้อยคนได้กลับบ้าน", opponentId: NORTH,
        before: { lines: [
          [N_NORTH, "ครั้งที่สามแล้ว ลูกนายหอ ครั้งแรกข้าซื้อ ครั้งที่สองข้าทำตามคำสั่ง ครั้งนี้ข้าจะสู้เพื่อถามตัวเอง"],
          [N_NORTH, "ถ้าข้าชนะ ข้าจะทำตามคำสั่งต่อไปทั้งชีวิต ถ้าข้าแพ้… ข้าจะลองไม่ทำตามดูสักครั้ง"],
        ], go: "สู้" },
        after: { cutscene: FILM_ENVOY_ORDER, lines: [
          "ประตูวังจงหยางเปิดออก เด็กชายร้อยคนเดินออกมาเป็นแถว ทหารกรมองครักษ์ที่เพิ่งมาถึงอุ้มคนที่เดินไม่ไหวขึ้นเกวียน",
          [N_NORTH, "ข้าไม่รู้ชื่อเด็กพวกนี้สักคน ข้าจะไม่ถามด้วย คนที่ไม่รู้ชื่อจะได้ลืมง่ายกว่า… แต่ข้าคงไม่ลืม"],
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "ข้ามาถึงช้าไปครึ่งวัน เกวียนเสบียงคันนี้ช้ากว่าเต่าที่นักยุทธศาสตร์กงพูดถึงเสียอีก"],
        [N_GAO, "พระสนมเล่าให้ข้าฟังแล้ว ชิวเซิงจะเปิดประตูวังหลวงให้ทัพเหนือ… และเขาจะรอเจ้าอยู่ข้างใน"],
        [N_GAO, "เขาไม่ได้อยากได้ผ้าผืนที่ห้าแค่เพื่อวิชาแล้ว เขาอยากรู้ว่าสามสิบปีของเขามีความหมายหรือไม่ คนที่ไหม้มานานขนาดนั้น อยากได้คำตอบมากกว่ายา"],
        [N_GAO, "กลับบ้านสักคืนก่อนเถิด ลูกนายหอ คนที่จะเข้าวังไปเจอเขาควรได้กินข้าวบ้านสักมื้อ"],
      ],
      go: "มุ่งหน้ากลับใต้",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "gold", amount: 250 },
      { t: "trait", trait: "good", amount: 5 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════
// ACT 6 · ตัดวังในใจ (31–35)
// A night at home with ป้าหลิว. ขุนนางเฉียน has sold the inner gate to Gu;
// the hero takes it back with the palace's own people at their side, meets
// Gu in the courtyard where two boy sweepers once read a forbidden page, and
// the consort reads all five panels aloud. The art is the true reading:
// cut the palace in the heart — ตัดใจจากกิเลส. ขันทีเกา walks out of the
// palace gate for good.
// ═════════════════════════════════════════════════════════════════════

const FILM_HOME_NIGHT: CutsceneSpec = {
  stage: "home_player", around: LIU, mood: "dusk",
  title: "ข้าวหมูแดงก่อนศึก", subtitle: "คฤหาสน์ชนบท",
  cast: {
    liu: { name: N_LIU, look: "f4", at: [-2, 0], facing: "right", tint: "#c8c0b0" },
    zhou: { name: "ลุงโจว", look: "home_player_gatekeeper_zhou", at: [3, 0], facing: "left" },
    niu: { name: "อาหนิว", look: "home_player_neighbor_niu", at: [5, 1], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [0, 1], facing: "right" },
  },
  beats: [
    ["narrate", "โต๊ะข้าวตั้งครบสี่ที่เหมือนวันที่บัญชีกลับบ้าน ข้าวหมูแดงพูนจาน และกลิ่นธูปจากห้องหนังสือของบิดาลอยมาจาง ๆ"],
    ["say", "liu", "ผอมลงอีกแล้ว ไปทางเหนือมาหรือ ทางเหนือไม่มีข้าวกินหรืออย่างไร"],
    ["say", "zhou", "ทางเหนือมีแต่สงคราม ป้าหลิว สงครามไม่เคยมีข้าวพอให้ใคร"],
    ["say", "niu", "ข้าได้ยินว่าเจ้าชนะขันทีมาแล้วหลายคน! ขันทีหลังแข็งไหม แข็งเท่าข้าไหม"],
    ["say", "liu", "อาหนิว กินข้าวไป"],
    ["think", "hero", "พรุ่งนี้ต้องเข้าวัง ไปพบคนที่ไหม้มาสามสิบปีเพราะอยากได้สิ่งหนึ่ง… คืนนี้ข้าขอกินข้าวช้า ๆ สักมื้อ"],
    ["fx", "petals"],
    ["fade", "out"],
  ],
};

const FILM_INNER_GATE: CutsceneSpec = {
  stage: "palace_royal", around: ZHAO, mood: "night",
  title: "ประตูชั้นใน",
  cast: {
    zhao: { name: N_ZHAO, look: ZHAO, at: [-3, 1], facing: "right" },
    cui: { name: N_CUI, look: CUI, at: [-5, 0], facing: "right" },
    long: { name: N_LONG, look: "foe_swordsman", at: [-1, 1], facing: "right", tint: GREY_ROBE, size: 0.95 },
    hero: { name: "{hero}", look: "hero", at: [-2, 0], facing: "right" },
    brocade: { name: N_BROCADE, look: "foe_constable", at: [4, 0], facing: "left", tint: "#7a2e2e" },
  },
  beats: [
    ["narrate", "ประตูชั้นในของวังหลวงปิดสนิท ขันทีเงาที่เหลือยืนบนกำแพง และชายในเสื้อแพรไร้ตราคนเดิมยืนขวางอยู่หน้าบานประตู"],
    ["say", "brocade", "เขาสัญญาว่าทัพใหม่จะคืนตราให้ข้า ตราของจริง ไม่ใช่ตราที่ถูกขูด… ข้าไม่มีอะไรจะเสียอีกแล้ว"],
    ["say", "long", "ข้าเคยคิดแบบนั้น ท่านลุง จนพี่สาวข้าเอาตุ๊กตาควายมาให้ดู"],
    ["say", "zhao", "มันคือหมา… ไม่ ข้าไม่ได้พูด ตอนนี้ไม่ใช่เวลา"],
    ["say", "cui", "ไปเถอะ ข้าจะร้องเพลง เผื่อใครข้างในจะได้ยิน"],
    ["move", "hero", [1, 0]],
    ["act", "brocade", "attack"],
    ["fx", "slash", "hero"],
    ["fade", "out"],
  ],
};

const FILM_SWEEPERS_COURTYARD: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "night",
  title: "ลานที่เด็กกวาดพื้นสองคนเคยยืน",
  cast: {
    gu: { name: N_GU, look: "foe_strategist", at: [3, 0], facing: "left", tint: RED_ROBE, size: 1.12 },
    hero: { name: "{hero}", look: "hero", at: [-2, 0], facing: "right" },
    gao: { name: N_GAO, look: "m3", at: [-5, 1], facing: "right" },
  },
  beats: [
    ["narrate", "ลานหน้าซากหอคัมภีร์หลวง ขันทีใหญ่กู้นั่งอยู่บนขั้นบันไดเดียวกับที่ขันทีเกาเคยนั่ง เข็มแดงปักเรียงบนแขนเสื้อเหมือนขนนก"],
    ["say", "gu", "ทัพเหนือถอยไปแล้ว เพราะเด็กร้อยคนที่สัญญาไว้ไม่มา ประตูที่ข้าจะเปิดก็ไม่มีใครมารับ"],
    ["say", "gu", "ไม่เป็นไร ข้าไม่ได้อยากเปิดประตูให้ใครจริง ๆ หรอก ข้าแค่อยากให้มีใครสักคนมาถึงตรงนี้ และบอกข้าว่าผืนที่ห้าเขียนว่าอะไร"],
    ["say", "gao", "ชิวเซิง พอเถิด"],
    ["say", "gu", "พอ? สามสิบปีที่ข้าไม่ได้หลับเกินครึ่งชั่วยาม เจ้ามาบอกข้าว่าพอ?"],
    ["fx", "fire", "gu"],
    ["act", "gu", "attack"],
    ["fx", "lightning", "hero"],
    ["think", "hero", "อย่าวิ่งตาม… ทานตะวันไม่เด็ดตะวัน มันแค่หันไป"],
    ["fade", "out"],
  ],
};

const FILM_FIVE_PANELS: CutsceneSpec = {
  stage: "palace_royal", around: CUI, mood: "night",
  title: "ผ้าห้าผืน", subtitle: "ตำหนักเย็น ก่อนรุ่งสาง",
  cast: {
    consort: { name: N_CONSORT, look: "f4", at: [0, -1], facing: "left", tint: OLD_SILK },
    gu: { name: N_GU, look: "foe_strategist", at: [3, 1], facing: "left", tint: RED_ROBE, size: 1.05 },
    gao: { name: N_GAO, look: "m3", at: [5, 0], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [-3, 1], facing: "right" },
    kui: { name: N_KUI, look: "f2", at: [-5, -1], facing: "right", tint: "#9fc3ff", hidden: true },
  },
  beats: [
    ["narrate", "พระสนมเย็บผ้าผืนที่ห้าเข้ากลางผืนอื่น ดอกทานตะวันทั้งห้าดอกหันมาหาดอกกลางพร้อมกัน เหมือนทุ่งดอกไม้ที่เพิ่งเห็นตะวันขึ้น"],
    ["fx", "sparkle", "consort"],
    ["say", "consort", "'ผู้ใดปรารถนาวิชานี้ จงตัดวังในตนเสียก่อน'"],
    ["say", "consort", "'วังคือสิ่งที่คนสร้างไว้เก็บสิ่งที่อยากได้ ยศ ทอง ความแค้น ความรักที่ต้องได้คืน ยิ่งสร้างสูง ยิ่งแบกหนัก'"],
    ["enter", "kui", [-5, -1]],
    ["say", "kui", "'ตัดใจจากกิเลสเสีย ไม่ต้องตัดกาย ไม่ต้องตัดความรัก ตัดแค่ความอยากครอบครอง แล้วกายจะเบาดั่งทานตะวันหันตามแสง'"],
    ["exit", "kui"],
    ["act", "gu", "defeat"],
    ["say", "gu", "ไม่ต้องตัดกาย… ฮ่า… ฮ่าฮ่า สามสิบปี เกา สามสิบปีที่ข้าวิ่งตามประโยคที่บอกให้ข้าหยุดวิ่ง"],
    ["say", "gao", "ข้าก็นั่งเงียบอยู่กับประโยคเดียวกันสามสิบปี ชิวเซิง เราสองคนอ่านไม่ออกพอ ๆ กัน"],
    ["think", "hero", "ไฟในตัวเขาไม่ได้ดับเพราะยา… มันเบาลงเพราะเขาเลิกอยากได้คำตอบอื่น"],
    ["fade", "out"],
  ],
};

const FILM_FINALE: CutsceneSpec = {
  stage: "palace_royal", around: GAO, mood: "day",
  title: "ทานตะวันหันตามแสง", subtitle: "รุ่งเช้า ประตูวังด้านตะวันออก",
  cast: {
    gao: { name: N_GAO, look: "m3", at: [-1, 0], facing: "right" },
    cui: { name: N_CUI, look: CUI, at: [-4, 1], facing: "right" },
    long: { name: N_LONG, look: "foe_swordsman", at: [-5, 0], facing: "right", tint: GREY_ROBE, size: 0.95 },
    zhao: { name: N_ZHAO, look: ZHAO, at: [3, 1], facing: "left" },
    hero: { name: "{hero}", look: "hero", at: [1, 1], facing: "left" },
  },
  beats: [
    ["narrate", "ขันทีใหญ่กู้หลับไปตอนฟ้าสาง เป็นครั้งแรกในรอบสามสิบปีที่เขาหลับนานกว่าครึ่งชั่วยาม และไม่ตื่นขึ้นมาอีก ใบหน้าของเขาเย็นและสงบ"],
    ["narrate", "ขันทีเกากวาดลานหน้าซากหอคัมภีร์หนึ่งรอบ ช้า ๆ เหมือนกวาดให้คนสองคน แล้ววางไม้กวาดพิงเสาไว้"],
    ["say", "gao", "สามสิบปีที่ข้ากวาดพื้นวังนี้ วันนี้ข้าจะกวาดเป็นครั้งสุดท้าย"],
    ["say", "zhao", "ท่านขันทีจะไปไหน"],
    ["say", "gao", "ข้างนอก ข้าได้ยินว่ามีหุบเขาที่ชายแก่คนหนึ่งปลูกดอกไม้รอใครบางคน ข้าจะไปช่วยเขารดน้ำ… พระสนมฝากดอกไม้แห้งปีนี้ไปด้วย"],
    ["say", "cui", "หม่อมฉันจะพาเสี่ยวหลงกลับบ้านที่ชนบทสักเดือน แล้วจะกลับมาเอายาให้พระสนมทุกคืนเหมือนเดิม ตรงเวลาทุกคืน"],
    ["say", "long", "พี่ร้องเพลงกล่อมแมวไปตลอดทางได้ไหม… ไม่ใช่ ข้าล้อเล่น อย่าร้อง"],
    ["move", "gao", [5, 0]],
    ["exit", "gao"],
    ["think", "hero", "ทานตะวันไม่เคยเด็ดตะวันลงมากอด… วันนี้ข้าเข้าใจแล้วว่ามันเบาเพราะอะไร"],
    ["title", "คัมภีร์ทานตะวัน", "ตัดวังในใจ"],
    ["fade", "out"],
  ],
};

const ACT6: readonly StoryChapterSpec[] = [
  // ── 31 ──
  {
    title: "ข้าวหมูแดงก่อนศึก",
    summary: "ขันทีเกาบอกให้กลับบ้านสักคืนก่อนเข้าวัง ป้าหลิวตั้งโต๊ะข้าวรอเหมือนรู้ล่วงหน้า ในห้องหนังสือของบิดา พู่กันหักครึ่งยังวางอยู่ที่เดิม",
    giver: LIU,
    offer: {
      cutscene: FILM_HOME_NIGHT,
      lines: [
        [N_LIU, "ป้าไม่ถามหรอกว่าไปทำอะไรมา ป้าเห็นจากตาก็รู้ว่าเจ้าไปเห็นของที่ไม่อยากเห็น"],
        [N_LIU, "ท่านพ่อของเจ้าก็เป็นแบบนี้ กลับบ้านทีไรตาเหนื่อยเหมือนคนแบกกระดาษหมื่นแผ่น แล้วก็นั่งดูเจ้าหลับทั้งคืน"],
        [N_LIU, "คืนนี้ไปนั่งในห้องหนังสือของท่านสักพัก ไม่ต้องทำอะไร นั่งเฉย ๆ ป้าจะต้มน้ำชาไว้"],
        [N_LIU, "พรุ่งนี้จะไปไหนก็ไป แต่คืนนี้นอนที่บ้าน เตียงเจ้ายังไม่มีใครนอน อาหนิวขอแล้วป้าไม่ให้"],
      ],
      go: "กินข้าวให้หมดจาน",
      asides: [
        { say: "ป้าทำข้าวหมูแดงทุกครั้งที่ข้ากลับมาเลยนะ", reply: [
          [N_LIU, "ก็เจ้าชอบ ป้าทำอย่างอื่นเป็นแต่ไม่อยากทำ ข้าวหมูแดงทำแล้วป้าไม่ต้องคิด คิดมากแล้วจะร้องไห้"],
        ] },
      ],
    },
    steps: [
      { t: "visit", locationId: "home_player", label: "นั่งในห้องหนังสือของบิดา", hint: "นั่งในห้องหนังสือของบิดาที่คฤหาสน์ คืนก่อนเข้าวัง",
        scene: { lines: [
          "ห้องหนังสือของบิดาเงียบ ป้ายวิญญาณตั้งอยู่ที่เดิม พู่กันหักครึ่งวางข้าง ๆ กับบัตรรายการใบที่เจ็ดที่เจ้าเพิ่งวางไว้",
          "เจ้าหยิบกระดาษแผ่นหนึ่ง เขียนคำว่า 'คืน' ตามที่บิดาเคยขอให้เขียนเมื่อสามปีก่อน ลายมือดีกว่าตอนนั้นมาก",
          "แล้วเจ้าเขียนอีกคำข้าง ๆ — 'วาง' ไม่ใช่ทิ้ง ไม่ใช่ลืม แค่วางลงไว้ตรงนี้",
          "ควันธูปลอยตรงขึ้นไป เจ้านึกถึงประโยคบนผ้า และเป็นครั้งแรกตั้งแต่ได้หีบของบิดาที่เจ้าไม่รู้สึกว่าต้องรีบไปไหน",
        ], go: "ดับตะเกียงแล้วไปนอน" } },
      { t: "trait", trait: "good", min: 50, hint: "ใจที่ไม่อยากครอบครองอะไร (ความดี 50)" },
    ],
    complete: {
      lines: [
        [N_LIU, "หลับสบายไหม ป้าได้ยินเสียงกรนตั้งแต่ยามสอง ท่านพ่อของเจ้าก็กรนแบบนี้"],
        "ลุงโจวยืนรอที่ประตู กระบองสั้นเหน็บเอว ห่อข้าวของป้าหลิวสะพายหลังอีกห่อ ห่อเล็กลงกว่าคราวก่อนนิดหนึ่ง",
        ["ลุงโจว", "คราวนี้ข้าไม่ไปด้วย ในวังมีคนของเจ้าพอแล้ว ข้าเฝ้าประตูนี้ไว้ให้มีที่กลับ"],
        ["อาหนิว", "ถ้าเจอขันทีหลังแข็ง ส่งมาประลองกับข้าได้นะ! …ไม่ต้องก็ได้ ข้าพูดเฉย ๆ"],
      ],
      go: "ออกเดินทางสู่วังหลวง",
    },
    reward: [
      { t: "item", itemId: "rice_dish", count: 5 },
      { t: "trait", trait: "good", amount: 3 },
      { t: "npcRelationship", npcId: LIU, amount: 6 },
    ],
  },

  // ── 32 ──
  {
    title: "ขุนนางผู้ขายประตู",
    summary: "ขุนนางเฉียนขายประตูชั้นในของวังให้ขันทีใหญ่กู้แลกกับตำแหน่งในราชสำนักใหม่ นายกองเถียนหลงได้รับคำสั่งให้เฝ้ามันไว้ — และขันทีเงาที่เหลือยืนเรียงบนกำแพง",
    giver: GAO,
    require: all(stat("AGI", 120), stat("STR", 100)),
    offer: {
      lines: [
        [N_GAO, "ขุนนางเฉียนเปลี่ยนเวรยามประตูชั้นในทั้งหมดเมื่อสามวันก่อน ทหารวังถูกย้ายไปเฝ้าคอกม้า รวมทั้งจ้าวเทียด้วย"],
        [N_GAO, "จ้าวเทียบอกว่าดี ม้าคุยรู้เรื่องกว่าผู้กอง แต่ข้าว่าเขาโกรธ เขาไม่พูดเรื่องควายมาสองวันแล้ว"],
        [N_GAO, "นายกองเถียนหลงเฝ้าประตูตามคำสั่ง เขาเป็นคนซื่อต่อคนที่จ่ายเบี้ยหวัด คราวนี้คนจ่ายคือคนที่กำลังจะขายวัง"],
        [N_GAO, "ข้าจะไปคุยกับขุนนางเฉียนเอง ข้ารู้ว่าเขาเอาข้าวส่วนเกินไปขายที่ไหนมาสิบปี เขาจะอยากฟังข้ามาก"],
      ],
      go: "ไปประตูชั้นใน",
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "ผ่านนายกองเถียนหลงที่ประตูชั้นใน", hint: "ไปประตูชั้นในของวังหลวง เอาชนะนายกองเถียนหลงที่เฝ้าตามคำสั่งขุนนางเฉียน", opponentId: CAPTAIN,
        before: { lines: [
          [N_CAPTAIN, "เจ้าอีกแล้ว คราวก่อนเราต่างคนต่างไม่เปลี่ยนใจ คราวนี้ข้าก็ยังไม่เปลี่ยน ลูกข้ายังกินข้าวเก่งเท่าเดิม"],
          [N_CAPTAIN, "แต่ข้าบอกเจ้าอย่างหนึ่ง ถ้าข้าแพ้ ข้าจะถือว่าคำสั่งนี้ล้มเหลวอย่างสมเกียรติ"],
        ], go: "สู้" },
        after: { lines: [
          [N_CAPTAIN, "ล้มเหลวอย่างสมเกียรติ… เอาละ ข้าจะไปถามนายท่านว่าวังใหม่จ่ายเบี้ยหวัดเท่าไร ถ้าเขาตอบไม่ได้ ข้าจะกลับมาเฝ้าประตูให้ฮ่องเต้องค์เดิม"],
          [N_GAO, "ขุนนางเฉียนตอบไม่ได้หรอก เขากำลังนั่งร้องไห้อยู่ในคลังเสบียง ข้าเพิ่งเล่าให้เขาฟังว่าข้าจดอะไรไว้บ้างตลอดสิบปี"],
        ] } },
      { t: "duel", locationId: "palace_royal", label: "ไล่ขันทีเงาลงจากกำแพงวัง", hint: "ไล่ขันทีเงาที่ยึดกำแพงวังหลวงลงมา ก่อนพวกมันจะเปิดประตูให้ใคร", opponentId: SHADOW,
        before: { lines: [
          "ขันทีเงาเจ็ดคนยืนเรียงบนกำแพง พวกมันเห็นนายกองเดินออกไปแล้วมองหน้ากัน ไม่มีใครสั่งอะไร",
          [N_SHADOW, "ท่านอาจารย์ใหญ่บอกให้เฝ้าจนกว่าทัพเหนือจะมา… ทัพเหนือไม่มา แล้วเราต้องเฝ้าไปถึงเมื่อไร"],
        ], go: "สู้" },
        after: { lines: [
          "ขันทีเงาลงจากกำแพงทีละคน คนสุดท้ายถามว่าหมอหลินรับคนไข้ตอนกลางคืนไหม จ้าวเทียที่เพิ่งวิ่งมาจากคอกม้าบอกว่ารับ แล้วอาสาพาไปเอง",
          [N_ZHAO, "ข้าได้ยินเรื่องหมดแล้ว! ผู้กองถูกย้ายไปคอกม้าแทนข้า ม้ารักเขามาก… ข้าโกหก ม้าเตะเขา"],
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "ประตูชั้นนอกคืนแล้ว แต่ประตูชั้นในยังปิด ชิวเซิงอยู่ข้างใน ในลานหน้าซากหอ"],
        [N_GAO, "เสื้อแพรไร้ตราคนนั้นยืนเฝ้าบานสุดท้ายอยู่ ข้าเห็นจากหลังคา เขาไม่ได้ถือดาบเหมือนคนอยากสู้ เขาถือเหมือนคนที่ไม่รู้จะวางมันลงตรงไหน"],
        [N_GAO, "ชุ่ยเอ๋อกับเสี่ยวหลงมาถึงแล้ว นางบอกว่าจะยืนข้างเจ้า ข้าบอกว่าอันตราย นางบอกว่าข้ามันขันทีขี้กลัว… นางพูดถูก"],
      ],
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "gold", amount: 200 },
      { t: "trait", trait: "fame", amount: 3 },
    ],
  },

  // ── 33 ──
  {
    title: "พี่น้อง",
    summary: "ชุ่ยเอ๋อและเสี่ยวหลงยืนข้างเจ้าหน้าประตูชั้นในบานสุดท้าย เสื้อแพรไร้ตราคนเดิมขวางอยู่ — ชายผู้อยากได้ตราคืนจนลืมว่าตราเคยมีไว้ทำอะไร",
    giver: CUI,
    offer: {
      lines: [
        [N_CUI, "ข้าไม่ได้มาสู้ ข้ามาเพราะทุกครั้งที่มีเรื่องในวังนี้ ข้าเป็นคนเล่าข่าว คราวนี้ข้าอยากเป็นคนอยู่ในข่าวบ้าง"],
        [N_LONG, "ข้ามาสู้ ข้าเร็วกว่าพี่ แล้วข้าก็รู้ว่าขันทีเงาที่เหลือจะยอมฟังข้ามากกว่าฟังเจ้า"],
        [N_CUI, "เสี่ยวหลง อย่าพูดแบบนั้นกับผู้มีพระคุณ… แต่ก็จริงของเขา"],
        [N_CUI, "เมื่อผ่านประตูนี้ไป ข้าจะไปเอาพระสนมมาจากตำหนักเย็น นางบอกว่าต้องอ่านผ้าห้าผืนให้คนคนหนึ่งฟังต่อหน้า คนที่ถามคำถามนี้มาสามสิบปี"],
      ],
      go: "เดินไปประตูบานสุดท้าย",
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "เปิดประตูชั้นในบานสุดท้าย", hint: "ไปประตูชั้นในบานสุดท้ายกับชุ่ยเอ๋อและเสี่ยวหลง เอาชนะเสื้อแพรไร้ตราที่เฝ้าอยู่", opponentId: BROCADE,
        before: { cutscene: FILM_INNER_GATE, lines: [
          [N_BROCADE, "ครั้งก่อนข้าวางดาบที่ซูโจว แล้วก็หยิบมันขึ้นมาใหม่ เพราะไม่มีใครบอกข้าว่าข้าควรถืออะไรแทน"],
          [N_LONG, "ถือเกวียนเด็กกลับบ้านสิ ท่านลุง กรมองครักษ์กำลังขาดคนขับ ข้าได้ยินผู้บัญชาการบ่น"],
        ], go: "สู้" },
        after: { lines: [
          "เสื้อแพรไร้ตราวางดาบลงเป็นครั้งที่สอง คราวนี้เขาไม่หยิบมันขึ้นมาอีก เขาแกะป้ายเอวที่ถูกขูดตราออก วางไว้ข้างดาบ",
          [N_BROCADE, "ขับเกวียนหรือ… ข้าขับเกวียนเป็นตั้งแต่ก่อนถือดาบเป็น บ้านข้าอยู่ริมทางเกวียน"],
          [N_CUI, "เขาไปแล้ว… เขายิ้มด้วย เจ้าเห็นไหม ข้าจะเล่าเรื่องนี้ให้ทั้งวังฟัง แต่จะเล่าว่าเขาร้องไห้ จะได้ซึ้งกว่า"],
        ] } },
      { t: "stat", stat: "DEX", min: 80, hint: "มือที่นิ่งพอจะรับเข็มโดยไม่ต้องไล่ตาม (เฉียบคม ≥ 80)" },
    ],
    complete: {
      lines: [
        "ประตูบานสุดท้ายเปิดออก ลานหน้าซากหอคัมภีร์หลวงอยู่ข้างหลังมัน แสงตะเกียงดวงเดียวส่องคนคนหนึ่งที่นั่งบนขั้นบันได",
        [N_CUI, "ข้าจะไปเอาพระสนมมา เสี่ยวหลงจะไปกับข้า… เจ้าอย่าเพิ่งตายนะ ข้ายังไม่ได้ขอโทษเจ้าแบบเป็นทางการเลย"],
        [N_LONG, "ท่านอาจารย์ใหญ่… เขาสอนข้าทุกอย่าง ยกเว้นวิธีหยุด ถ้าเจ้าสอนเขาได้ ช่วยสอนด้วย"],
        [N_GAO, "ข้าจะเข้าไปกับเจ้า ไม่ได้จะช่วยสู้ ข้าแค่ไม่อยากให้เขาต้องอยู่ในลานนั้นคนเดียวอีก"],
      ],
      go: "ก้าวเข้าลาน",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "npcRelationship", npcId: CUI, amount: 6 },
      { t: "trait", trait: "good", amount: 3 },
    ],
  },

  // ── 34 ──
  {
    title: "เข็มแดงกับทานตะวัน",
    summary: "ขันทีใหญ่กู้ชิวเซิงรออยู่ในลานที่เด็กกวาดพื้นสองคนเคยเปิดม้วนต้องห้าม เขาเร็วที่สุดในวัง ร้อนที่สุดในแผ่นดิน — และเหนื่อยที่สุดในชีวิต",
    giver: GAO,
    require: all(stat("AGI", 120), stat("VIT", 100), { t: "trait", trait: "fame", min: 50 }),
    offer: {
      lines: [
        [N_GAO, "ข้ารู้จักเขามาตั้งแต่ห้าขวบ เขาเป็นเด็กที่วิ่งเร็วที่สุดในบรรดาเด็กกวาดพื้น และเป็นคนเดียวที่ร้องไห้ทุกคืนเพราะคิดถึงแม่"],
        [N_GAO, "วันที่เขาอ่านหน้าแรก เขาบอกข้าว่า 'ถ้าเร็วพอ แม่จะไม่ต้องขายข้าอีก' ทั้งที่แม่ขายเขาไปแล้ว"],
        [N_GAO, "อย่าสู้เพื่อชนะเขา เขาแพ้มาสามสิบปีแล้ว สู้ให้เขาเห็นว่าความเร็วแบบไหนที่ไม่ต้องเผาตัวเอง"],
        [N_GAO, "และถ้าเจ้าพลาด… ข้าจะยืนตรงนี้ ข้าจะไม่เงียบอีก"],
      ],
      go: "ก้าวออกกลางลาน",
    },
    steps: [
      { t: "duel", locationId: "palace_royal", label: "เผชิญหน้าขันทีใหญ่กู้ชิวเซิง", hint: "เผชิญหน้าขันทีใหญ่กู้ชิวเซิงที่ลานหน้าซากหอคัมภีร์หลวง", opponentId: GU,
        before: { cutscene: FILM_SWEEPERS_COURTYARD, lines: [
          "เข็มแดงพุ่งมาเป็นสาย เร็วจนเสียงมาถึงหลังรอยแผล ขันทีใหญ่กู้หายไปจากที่ยืนและปรากฏขึ้นข้างหลังเจ้า หายใจออกเป็นไฟ",
          [N_GU, "เร็วกว่านี้ไม่ได้แล้ว ลูกนายหอ ร่างนี้ไหม้ไปครึ่งหนึ่งแล้ว มาสิ ทำให้มันไหม้หมดเสียที"],
        ], go: "ไม่ไล่ตาม แค่หันไปหาเขา" },
        after: { lines: [
          "เข็มเล่มสุดท้ายหลุดจากมือขันทีใหญ่กู้ หมุนกลางอากาศแล้วตกลงบนแผ่นหินข้างเตาถ่าน — ตรงที่บิดาเจ้าเคยเผาสำเนา",
          "เขาคุกเข่าลง ไอร้อนพวยจากปากเป็นสายสุดท้าย ไม่มีแรงลุก แต่ก็ไม่มีแรงจะไม่ลุกอีกแล้ว",
          [N_GU, "เจ้าไม่ได้เร็วกว่าข้า… เจ้าแค่ไม่ได้วิ่ง ข้าวิ่งมาทั้งชีวิต แต่เจ้ายืนอยู่ตรงที่ข้าจะไปถึงก่อนทุกที"],
          [N_GU, "ผืนที่ห้า… อ่านให้ข้าฟังได้ไหม ข้าไม่เอาแล้ว ข้าแค่อยากรู้"],
        ] } },
    ],
    complete: {
      lines: [
        [N_GAO, "ชุ่ยเอ๋อพาพระสนมมาแล้ว นางเดินช้า ๆ ถือกล่องปักผ้าไว้ในมือ บอกว่าเย็บผืนที่ห้าเข้าไปได้ในเวลาจิบชาหมดถ้วย"],
        [N_GAO, "ชิวเซิงขอให้ข้าประคองเขาไปตำหนักเย็น เขาบอกว่าอยากฟังที่นั่น ที่ที่เขาเคยช่วยพระสนมหิ้วถังน้ำเมื่อสามสิบปีก่อน"],
        [N_GAO, "เขาเบาลงมากเลย… เบาจนข้าแบกได้คนเดียว"],
      ],
      go: "ตามไปตำหนักเย็น",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "fame", amount: 5 },
    ],
  },

  // ── 35 ──
  {
    title: "ตัดวังในใจ",
    summary: "ในตำหนักเย็นก่อนรุ่งสาง พระสนมเย็บผ้าห้าผืนเข้าด้วยกันและอ่านคัมภีร์ของมารดาออกเสียงเป็นครั้งแรกในรอบแปดสิบปี ให้คนที่อ่านมันผิดมาทั้งชีวิตได้ฟัง",
    giver: GAO,
    offer: {
      lines: [
        "ตำหนักเย็นมีตะเกียงสามดวงคืนนี้ ชุ่ยเอ๋อจุดเพิ่มเองโดยไม่ขออนุญาตใคร จ้าวเทียยืนเฝ้าประตู เสี่ยวหลงนั่งยอง ๆ อยู่ข้างแมวสีส้ม",
        [N_GAO, "ข้าวางเขาลงบนเสื่อแล้ว เขายังตื่นอยู่ ตาเขาเปิดค้างไว้เหมือนกลัวจะหลับก่อนได้ยิน"],
        [N_GAO, "พระสนมขอให้เจ้านั่งใกล้ ๆ นางบอกว่าแม่ของนางเขียนวิชานี้ให้คนที่ไม่อยากได้มัน และเจ้าเป็นคนแรกที่นางเจอ"],
        [N_GAO, "ข้า… ข้าจะยืนข้างหลัง ข้ายืนข้างหลังมาสามสิบปี คืนนี้ข้ายืนได้อีกคืน"],
      ],
      go: "นั่งลงข้างพระสนม",
    },
    steps: [
      { t: "visit", locationId: "palace_royal", label: "ฟังพระสนมอ่านผ้าห้าผืน", hint: "นั่งในตำหนักเย็น ฟังพระสนมอ่านผ้าห้าผืนที่เย็บเข้าด้วยกัน",
        scene: { cutscene: FILM_FIVE_PANELS, lines: [
          "พระสนมอ่านต่อไปอีกนาน ทุกท่าของวิชาอยู่ในตะเข็บ ท่าเดินที่ไม่ไล่ตาม ท่าหลบที่ไม่หนี ลมหายใจที่ไม่เก็บอะไรไว้ในอก",
          [N_CONSORT, "แม่บอกข้าว่า คนที่ฝึกวิชานี้ด้วยความอยากได้จะเร็ว แต่จะไหม้ คนที่ฝึกด้วยใจที่วางแล้วจะเร็ว และจะเย็น"],
          [N_CONSORT, "ความเร็วของทานตะวันไม่ได้มาจากขา มันมาจากการที่ไม่มีอะไรรั้งไว้"],
          [N_GU, "เกา… พรุ่งนี้กวาดลานด้วยกันสักรอบได้ไหม ข้าอยากกวาดช้า ๆ ดูบ้าง"],
          [N_GAO, "ได้สิ ชิวเซิง ข้าจะนับกระสอบผิดให้เจ้าดูด้วย"],
        ], go: "อยู่ในตำหนักจนฟ้าสาง" } },
    ],
    complete: {
      cutscene: FILM_FINALE,
      lines: [
        [N_CONSORT, "ผ้าห้าผืนนี้ข้าจะเก็บไว้ปักต่อจนตาย มันเป็นเสื้อของแม่ ไม่ใช่ตำรา"],
        [N_CONSORT, "แต่ข้าคัดลอกตัวอักษรทั้งหมดลงกระดาษไว้แล้ว ด้วยลายมือของข้าเอง อักษรตัวแรกเขียนให้ชัดที่สุดในชีวิต — **วัง** ไม่ใช่อย่างอื่น"],
        [N_CONSORT, "รับไว้ ลูกนายหอ พ่อของเจ้าเผาฉบับที่โกหก ลูกของเขาควรได้ถือฉบับที่พูดจริง"],
        [N_CONSORT, "อย่าเก็บมันไว้ในวังไหน ทั้งวังหิน วังทอง หรือวังในใจ อ่านจบแล้ว ส่งต่อให้คนที่ไม่อยากได้มันเหมือนเจ้า"],
        "เจ้ารับม้วนกระดาษไว้ในมือ มันเบากว่าที่คิด เบาเหมือนไม่มีอะไรต้องแบก",
      ],
      go: "รับคัมภีร์ทานตะวัน",
    },
    reward: [
      { t: "wExp", amount: 250 },
      { t: "gold", amount: 300 },
      { t: "trait", trait: "humility", amount: 5 },
      { t: "npcRelationship", npcId: GAO, amount: 10 },
    ],
  },
];

// ─── The saga ─────────────────────────────────────────────────────────

export const LINEAGE: readonly LineageSpec[] = [];
export const ARCS: readonly StoryArcSpec[] = [
  {
    id: "jh_sunflower",
    title: "ทานตะวันในวังเย็น",
    tagline: "หมวดต้องห้ามถูกเผาไปแล้ว — แต่มีคนท่องมันได้ทั้งเล่ม กำลังขายให้ทัพเหนือทีละบรรทัด และซื้อเด็กหนุ่มด้วยเงินนั้น",
    sc: "ยุทธจักร",
    reward: { kind: "art", id: "khbt", level: 3 },
    require: all(MAIN_DONE, stat("AGI", 120)),
    opponents: OPPONENTS,
    chapters: [...ACT1, ...ACT2, ...ACT3, ...ACT4, ...ACT5, ...ACT6],
  },
];
