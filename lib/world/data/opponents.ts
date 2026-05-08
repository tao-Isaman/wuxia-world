import type { CharacterBuild, EquipLoadout, StatBlock } from "@/lib/game";
import type { OpponentDef, ResourceYield } from "../types";

// ─── Opponent roster (35 entries, organised by tier) ────────────────
// Tier 0 (5): chaff — STARTER_BUILD-equivalent.
// Tier 1 (10): early roadside threats.
// Tier 2 (10): journeyman fighters with one move skill apiece.
// Tier 3 (5): masters carrying tier-1/2 skills + an inner skill.
// Tier 4 (5): legendary foes with several leveled skills + a strong inner.
//
// Each entry's `build()` factory returns a fresh CharacterBuild so future
// scaling (story flags, quest tier-ups) can layer on top without mutating
// the shared object. `drops` rolls 2–4 weighted picks on win — see
// world-store.ts `acknowledgeBattleResult`.

const emptyEquip = (): EquipLoadout => ({
  W: null, A: null, H: null, B: null,
  BR: [null, null], R: [null, null], C: [null, null],
});

const slots = (...ids: (string | null)[]): (string | null)[] => {
  const out = [...ids];
  while (out.length < 10) out.push(null);
  return out;
};

const TIER_STATS: Record<0 | 1 | 2 | 3 | 4, StatBlock> = {
  0: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
  1: { STR: 3, AGI: 3, POW: 1, VIT: 3, DEX: 2, LUK: 1, DEF: 2, INT: 1 },
  2: { STR: 5, AGI: 4, POW: 3, VIT: 4, DEX: 3, LUK: 2, DEF: 3, INT: 2 },
  3: { STR: 7, AGI: 6, POW: 5, VIT: 6, DEX: 5, LUK: 3, DEF: 5, INT: 3 },
  4: { STR: 10, AGI: 9, POW: 8, VIT: 9, DEX: 8, LUK: 5, DEF: 8, INT: 6 },
};

interface BuildOpts {
  stats?: Partial<StatBlock>;
  artId?: string;
  artLevel?: number;
  skillIds?: (string | null)[];
}

function build(name: string, tier: 0 | 1 | 2 | 3 | 4, opts: BuildOpts = {}): CharacterBuild {
  const baseSkills = opts.skillIds ?? ["basic_punch"];
  return {
    name,
    stats: { ...TIER_STATS[tier], ...(opts.stats ?? {}) },
    artId: opts.artId ?? "none",
    artLevel: opts.artLevel ?? 1,
    skillIds: slots(...baseSkills),
    equipment: emptyEquip(),
  };
}

// Per-tier default loot tables. Individual opponents can override with a
// custom `drops` list when their lore calls for it (e.g., venomous beasts
// carry venom items, treasure-hunting bandits carry coins).
const DROPS_T0: readonly ResourceYield[] = [
  { itemId: "rock", weight: 6 },
  { itemId: "raw_meat", weight: 4 },
  { itemId: "wood_soft", weight: 3 },
];
const DROPS_T1: readonly ResourceYield[] = [
  { itemId: "iron_ore", weight: 5 },
  { itemId: "copper_ore", weight: 4 },
  { itemId: "fur_pelt", weight: 4 },
  { itemId: "herb", weight: 3 },
  { itemId: "potion", weight: 2 },
];
const DROPS_T2: readonly ResourceYield[] = [
  { itemId: "silver_ore", weight: 4 },
  { itemId: "ginseng", weight: 3 },
  { itemId: "fish_eel", weight: 3 },
  { itemId: "leather", weight: 3 },
  { itemId: "snake_skin", weight: 3 },
  { itemId: "potion_mid", weight: 2 },
];
const DROPS_T3: readonly ResourceYield[] = [
  { itemId: "gold_ore", weight: 3 },
  { itemId: "lotus_seed", weight: 3 },
  { itemId: "tiger_claw", weight: 2 },
  { itemId: "bear_claw", weight: 2 },
  { itemId: "jade", weight: 2 },
  { itemId: "potion_big", weight: 2 },
  { itemId: "ancient_coin", weight: 1 },
];
const DROPS_T4: readonly ResourceYield[] = [
  { itemId: "mithril_ore", weight: 2 },
  { itemId: "snow_lotus", weight: 2 },
  { itemId: "fish_dragon", weight: 1 },
  { itemId: "centipede_venom", weight: 2 },
  { itemId: "jade_amulet", weight: 1 },
  { itemId: "wood_sacred", weight: 1 },
  { itemId: "ancient_coin", weight: 3 },
  { itemId: "potion_big", weight: 3 },
];

export const OPPONENTS: readonly OpponentDef[] = [
  // ─── Tier 0 (5) ─────────────────────────────────────────────────
  { id: "petty_thief", name: "ขโมยน้อย", ti: 0, category: "human", drops: DROPS_T0,
    build: () => build("ขโมยน้อย", 0) },
  { id: "drunk_brawler", name: "ชายเมาก่อเรื่อง", ti: 0, category: "human", drops: DROPS_T0,
    build: () => build("ชายเมา", 0, { stats: { STR: 2 } }) },
  { id: "wild_dog", name: "หมาป่าเล็ก", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("หมาป่าเล็ก", 0, { stats: { AGI: 2 } }) },
  { id: "wild_chicken", name: "ไก่ป่า", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("ไก่ป่า", 0, { stats: { AGI: 2, LUK: 2 } }) },
  { id: "small_snake", name: "งูเล็ก", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("งูเล็ก", 0, { stats: { DEX: 2 } }) },

  // ─── Tier 1 (10) ────────────────────────────────────────────────
  { id: "thug", name: "โจรเร่ร่อน", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("โจรเร่ร่อน", 1) },
  { id: "bandit", name: "โจรป่า", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("โจรป่า", 1, { stats: { STR: 4 }, skillIds: ["nc7"] }) },
  { id: "ruffian", name: "คนร้าย", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("คนร้าย", 1, { stats: { STR: 4 }, skillIds: ["basic_punch", "nc4"] }) },
  { id: "wild_beast", name: "สัตว์ป่าดุร้าย", ti: 1, category: "beast", drops: DROPS_T1,
    build: () => build("สัตว์ป่าดุร้าย", 1, { stats: { STR: 4, VIT: 4 } }) },
  { id: "wild_boar", name: "หมูป่า", ti: 1, category: "beast", drops: DROPS_T1,
    build: () => build("หมูป่า", 1, { stats: { STR: 4, VIT: 4 } }) },
  { id: "wild_wolf", name: "หมาป่า", ti: 1, category: "beast", drops: DROPS_T1,
    build: () => build("หมาป่า", 1, { stats: { AGI: 5, DEX: 4 } }) },
  { id: "road_bandit", name: "โจรเส้นทาง", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("โจรเส้นทาง", 1, { skillIds: ["ns1"] }) },
  { id: "river_pirate", name: "โจรสลัดน้ำ", ti: 1, category: "human",
    drops: [...DROPS_T1, { itemId: "fish_carp", weight: 4 }],
    build: () => build("โจรสลัดน้ำ", 1, { stats: { STR: 4, AGI: 3 }, skillIds: ["nc8"] }) },
  { id: "desert_marauder", name: "นักรบทะเลทราย", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("นักรบทะเลทราย", 1, { stats: { STR: 4, AGI: 3, DEX: 3 }, skillIds: ["gn"] }) },
  { id: "fortune_thief", name: "หมอดูปลอม", ti: 1, category: "human", drops: DROPS_T1,
    build: () => build("หมอดูปลอม", 1, { stats: { LUK: 3, DEX: 3 }, skillIds: ["nc9"] }) },

  // ─── Tier 2 (10) — sect-disciple level, one move skill each ─────
  { id: "mountain_tiger", name: "เสือภูเขา", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "tiger_claw", weight: 1 }],
    build: () => build("เสือภูเขา", 2, { stats: { STR: 6, AGI: 5 } }) },
  { id: "brown_bear", name: "หมีสีน้ำตาล", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "bear_claw", weight: 1 }],
    build: () => build("หมีสีน้ำตาล", 2, { stats: { STR: 7, VIT: 6 } }) },
  { id: "viper_snake", name: "งูเห่ายักษ์", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "viper_venom", weight: 2 }],
    build: () => build("งูเห่ายักษ์", 2, { stats: { DEX: 6, AGI: 5 } }) },
  { id: "giant_centipede", name: "ตะขาบยักษ์", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "scorpion_venom", weight: 2 }],
    build: () => build("ตะขาบยักษ์", 2, { stats: { DEX: 5, VIT: 5 } }) },
  { id: "bandit_chief", name: "หัวหน้าโจร", ti: 2, category: "human", drops: DROPS_T2,
    build: () => build("หัวหน้าโจร", 2, { skillIds: ["nc7", "nm2"] }) },
  { id: "iron_palm_thug", name: "นักเลงฝ่ามือเหล็ก", ti: 2, category: "human", drops: DROPS_T2,
    build: () => build("นักเลงฝ่ามือเหล็ก", 2, { stats: { STR: 6 }, skillIds: ["nc4", "nd7"] }) },
  { id: "flying_swallow", name: "นกนางแอ่นบิน", ti: 2, category: "human", drops: DROPS_T2,
    build: () => build("นกนางแอ่นบิน", 2, { stats: { AGI: 7, DEX: 5 }, skillIds: ["qf", "nd11"] }) },
  { id: "poison_practitioner", name: "ผู้ฝึกพิษ", ti: 2, category: "human",
    drops: [...DROPS_T2, { itemId: "scorpion_venom", weight: 2 }],
    build: () => build("ผู้ฝึกพิษ", 2, { stats: { DEX: 6, LUK: 4 }, skillIds: ["pn", "nd9"] }) },
  { id: "wandering_swordsman", name: "กระบี่พเนจร", ti: 2, category: "human", drops: DROPS_T2,
    build: () => build("กระบี่พเนจร", 2, { skillIds: ["ns1", "nd3"] }) },
  { id: "sect_disciple", name: "ลูกศิษย์สำนัก", ti: 2, category: "human", drops: DROPS_T2,
    build: () => build("ลูกศิษย์สำนัก", 2, { skillIds: ["nc1", "nd5"] }) },

  // ─── Tier 3 (5) — masters with inner skill + multi skills ───────
  { id: "blade_master", name: "อาจารย์ดาบ", ti: 3, category: "human", drops: DROPS_T3,
    build: () => build("อาจารย์ดาบ", 3, {
      artId: "t1_eagleclaw", artLevel: 5,
      skillIds: ["ns1", "nd3", "ne9"],
    }) },
  { id: "shadow_assassin", name: "นักฆ่าเงา", ti: 3, category: "human", drops: DROPS_T3,
    build: () => build("นักฆ่าเงา", 3, {
      stats: { DEX: 8, AGI: 7, LUK: 5 },
      artId: "t1_blackiron", artLevel: 5,
      skillIds: ["pn", "nd9", "ne6"],
    }) },
  { id: "wudang_disciple", name: "สาวกอู่ตัง", ti: 3, category: "human", drops: DROPS_T3,
    build: () => build("สาวกอู่ตัง", 3, {
      artId: "t0_lohan", artLevel: 6,
      skillIds: ["tj", "rf", "cs"],
    }) },
  { id: "snow_demon", name: "ปีศาจหิมะ", ti: 3, category: "supernatural",
    drops: [...DROPS_T3, { itemId: "snow_lotus", weight: 1 }],
    build: () => build("ปีศาจหิมะ", 3, {
      stats: { POW: 7, INT: 5, VIT: 7 },
      artId: "snow", artLevel: 4,
      skillIds: ["nm1", "ne7"],
    }) },
  { id: "sect_elder", name: "ผู้อาวุโสสำนัก", ti: 3, category: "human", drops: DROPS_T3,
    build: () => build("ผู้อาวุโสสำนัก", 3, {
      artId: "t1_whitehorse", artLevel: 6,
      skillIds: ["nc7", "nd5", "ne2"],
    }) },

  // ─── Tier 4 (5) — legendary foes ────────────────────────────────
  { id: "demonic_master", name: "จอมยุทธมาร", ti: 4, category: "human", drops: DROPS_T4,
    build: () => build("จอมยุทธมาร", 4, {
      artId: "blood", artLevel: 8,
      skillIds: ["bs", "ep", "nf3", "ng2"],
    }) },
  { id: "legendary_swordsman", name: "ราชากระบี่", ti: 4, category: "human", drops: DROPS_T4,
    build: () => build("ราชากระบี่", 4, {
      stats: { STR: 11, AGI: 10, DEX: 9 },
      artId: "huashan", artLevel: 8,
      skillIds: ["dgjj", "qzjf", "nf2", "ne9"],
    }) },
  { id: "dragon_phoenix_master", name: "ปรมาจารย์มังกร-หงส์", ti: 4, category: "supernatural", drops: DROPS_T4,
    build: () => build("ปรมาจารย์มังกร-หงส์", 4, {
      artId: "tendon", artLevel: 9,
      skillIds: ["ep", "ng3", "nu2", "ne1"],
    }) },
  { id: "heretical_grandmaster", name: "เจ้าสำนักอธรรม", ti: 4, category: "human", drops: DROPS_T4,
    build: () => build("เจ้าสำนักอธรรม", 4, {
      stats: { POW: 10, INT: 9, DEX: 8 },
      artId: "shadow", artLevel: 8,
      skillIds: ["nf6", "wd_palm", "nf7", "nf8"],
    }) },
  { id: "immortal_warrior", name: "นักรบอมตะ", ti: 4, category: "supernatural", drops: DROPS_T4,
    build: () => build("นักรบอมตะ", 4, {
      stats: { STR: 12, VIT: 12, DEF: 10 },
      artId: "jiuyang", artLevel: 9,
      skillIds: ["ep", "ng3", "nu1", "ng2"],
    }) },

  // ─── Hunt-only beasts (tier 0–2) ───────────────────────────────
  // Spawn ONLY through hunting resources (resources.ts → hunt_*). Stats
  // follow the base TIER_STATS without overrides — random-event beasts
  // of the same tier carry stat boosts (e.g., mountain_tiger STR+1
  // AGI+1) and therefore hit harder. All skills come from the
  // `bst_*` family in lib/game/data/skills.ts so the hunting layer
  // feels claw / fang / venom rather than wuxia palm-strike.
  // ─── tier 0 — small forest game ────────
  { id: "hunt_rabbit", name: "กระต่ายป่า", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("กระต่ายป่า", 0, { stats: { AGI: 2 }, skillIds: ["bst_bite"] }) },
  { id: "hunt_pheasant", name: "ไก่ฟ้า", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("ไก่ฟ้า", 0, { stats: { AGI: 2 }, skillIds: ["bst_claw"] }) },
  { id: "hunt_squirrel", name: "กระรอกแก้ม", ti: 0, category: "beast", drops: DROPS_T0,
    build: () => build("กระรอกแก้ม", 0, { stats: { AGI: 2, DEX: 2 }, skillIds: ["bst_bite"] }) },

  // ─── tier 1 — woodland predators ────────
  { id: "hunt_wild_dog", name: "สุนัขป่า", ti: 1, category: "beast", drops: DROPS_T1,
    build: () => build("สุนัขป่า", 1, { skillIds: ["bst_bite", "bst_pounce"] }) },
  { id: "hunt_boar", name: "หมูป่าฝูง", ti: 1, category: "beast",
    drops: [...DROPS_T1, { itemId: "raw_meat", weight: 4 }],
    build: () => build("หมูป่าฝูง", 1, { stats: { VIT: 4 }, skillIds: ["bst_charge", "bst_bite"] }) },
  { id: "hunt_jungle_cat", name: "เสือดาวป่า", ti: 1, category: "beast",
    drops: [...DROPS_T1, { itemId: "fur_pelt", weight: 4 }],
    build: () => build("เสือดาวป่า", 1, { skillIds: ["bst_claw", "bst_pounce"] }) },

  // ─── tier 2 — mountain & legendary apex ────────
  // Note: these are deliberately weaker than random-event tier-2 beasts
  // (mountain_tiger, brown_bear) — they carry no stat overrides while
  // those carry +1–2 STR/AGI/VIT.
  { id: "hunt_alpha_wolf", name: "หมาป่าจ่าฝูง", ti: 2, category: "beast", drops: DROPS_T2,
    build: () => build("หมาป่าจ่าฝูง", 2, { skillIds: ["bst_pounce", "bst_roar"] }) },
  { id: "hunt_giant_bear", name: "หมีหิน", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "bear_claw", weight: 1 }],
    build: () => build("หมีหิน", 2, { skillIds: ["bst_maul", "bst_charge"] }) },
  { id: "hunt_mountain_lynx", name: "เสือเขาเล็ก", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "tiger_claw", weight: 1 }],
    build: () => build("เสือเขาเล็ก", 2, { skillIds: ["bst_pounce", "bst_fang"] }) },
  { id: "hunt_jungle_serpent", name: "งูยักษ์ป่า", ti: 2, category: "beast",
    drops: [...DROPS_T2, { itemId: "viper_venom", weight: 2 }],
    build: () => build("งูยักษ์ป่า", 2, { skillIds: ["bst_venom", "bst_constrict"] }) },

  // ─── NPC sparring partners ────────────────────────────────────
  // Bespoke opponents whose move skills + inner art match the NPC's
  // identity. Pointed to from `NpcDef.sparOpponentId`. Players see
  // these only via the ⚔ ขอประลอง button — never spawn from random
  // encounters or hunting, so no entry in random-events.ts.

  // เซียวจิ้งเทียน (inn_yuelai) — wandering swordsman, light agile sword.
  { id: "spar_swordsman_xiao", name: "เซียวจิ้งเทียน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_ns1", weight: 1 }, { itemId: "man_qf", weight: 1 },
      { itemId: "man_nd3", weight: 1 }, { itemId: "man_t0_sevenstar", weight: 1 }],
    build: () => build("เซียวจิ้งเทียน", 2, {
      stats: { STR: 5, AGI: 7, DEX: 6, POW: 3, VIT: 4 },
      artId: "t0_sevenstar", artLevel: 5,
      skillIds: ["ns1", "qf", "nd3"],
    }) },

  // อาจารย์ฝาหมิง (sect_shaolin) — Shaolin elder, hard external palm work.
  { id: "spar_shaolin_faming", name: "อาจารย์ฝาหมิง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 }],
    build: () => build("อาจารย์ฝาหมิง", 3, {
      stats: { STR: 8, VIT: 8, DEF: 7, POW: 5 },
      artId: "t1_goldenbell", artLevel: 6,
      skillIds: ["sf", "nd5", "ne1"],
    }) },

  // ชิวเฉียน (mt_kunlun) — Kunlun exile, sword-and-internal hermit style.
  { id: "spar_kunlun_qiu", name: "ชิวเฉียน", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_nm1", weight: 1 }, { itemId: "man_nd11", weight: 1 },
      { itemId: "man_nc3", weight: 1 }],
    build: () => build("ชิวเฉียน", 3, {
      stats: { POW: 8, INT: 7, AGI: 7, DEX: 6 },
      artId: "t3_voidstep", artLevel: 6,
      skillIds: ["nm1", "nd11", "nc3"],
    }) },

  // ─── Per-sect sparring partners (T1-T3) ───────────────────────────
  // One opponent per sect-NPC sparring partner. Skill / art picks lean on
  // the sect's signature catalogue so each fight feels distinct (Shaolin
  // hard external, Wudang taiji-soft, Gumu yin-internal sword, etc.).

  // T1 — early sparring (sect intro)
  { id: "spar_taishan_disciple", name: "ศิษย์คุนหวู่", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_nc7", weight: 1 }, { itemId: "man_nm2", weight: 1 },
      { itemId: "man_t0_fiveyuan", weight: 1 }],
    build: () => build("ศิษย์คุนหวู่", 1, {
      stats: { STR: 5, VIT: 4 },
      artId: "t0_fiveyuan", artLevel: 4,
      skillIds: ["nc7", "nm2"],
    }) },
  { id: "spar_hengshan_south_disciple", name: "ศิษย์เยว่ผาน", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_nc3", weight: 1 }, { itemId: "man_nd11", weight: 1 },
      { itemId: "man_t1_redlotus", weight: 1 }],
    build: () => build("ศิษย์เยว่ผาน", 1, {
      stats: { AGI: 5, DEX: 4 },
      artId: "t1_redlotus", artLevel: 3,
      skillIds: ["nc3", "nd11"],
    }) },
  { id: "spar_hengshan_north_nun", name: "นักพรตจิงซิน", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_nc9", weight: 1 }, { itemId: "man_nm1", weight: 1 },
      { itemId: "man_t1_blackiron", weight: 1 }],
    build: () => build("นักพรตจิงซิน", 1, {
      stats: { POW: 5, INT: 4 },
      artId: "t1_blackiron", artLevel: 3,
      skillIds: ["nc9", "nm1"],
    }) },
  { id: "spar_songshan_disciple", name: "ศิษย์หลี่เฟิง", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_ns1", weight: 1 }, { itemId: "man_nd3", weight: 1 },
      { itemId: "man_t1_eagleclaw", weight: 1 }],
    build: () => build("ศิษย์หลี่เฟิง", 1, {
      stats: { STR: 5, AGI: 4 },
      artId: "t1_eagleclaw", artLevel: 3,
      skillIds: ["ns1", "nd3"],
    }) },

  // T2 — mid sparring (sect signature styles)
  { id: "spar_wudang_disciple", name: "สาวกชิงเฟิง", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_rf", weight: 1 },
      { itemId: "man_cs", weight: 1 }],
    build: () => build("สาวกชิงเฟิง", 2, {
      stats: { POW: 6, AGI: 5, DEX: 4 },
      artId: "t3_yinyang", artLevel: 4,
      skillIds: ["tj", "rf", "cs"],
    }) },
  { id: "spar_emei_nun", name: "นักพรตชิงอวี้", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_nc3", weight: 1 }, { itemId: "man_nm1", weight: 1 },
      { itemId: "man_t2_plumblossom", weight: 1 }],
    build: () => build("นักพรตชิงอวี้", 2, {
      stats: { POW: 6, INT: 5, DEX: 4 },
      artId: "t2_plumblossom", artLevel: 4,
      skillIds: ["nc3", "nm1"],
    }) },
  { id: "spar_huashan_disciple", name: "ศิษย์เจี้ยนอี้", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_ns1", weight: 1 }, { itemId: "man_nd3", weight: 1 },
      { itemId: "man_qf", weight: 1 }, { itemId: "man_t2_eighttri", weight: 1 }],
    build: () => build("ศิษย์เจี้ยนอี้", 2, {
      stats: { STR: 6, AGI: 5, DEX: 4 },
      artId: "t2_eighttri", artLevel: 5,
      skillIds: ["ns1", "nd3", "qf"],
    }) },
  { id: "spar_lingjiu_lady", name: "หญิงสาวจื่อเสีย", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_nd9", weight: 1 }, { itemId: "man_nd11", weight: 1 },
      { itemId: "man_t2_plumblossom", weight: 1 }],
    build: () => build("หญิงสาวจื่อเสีย", 2, {
      stats: { AGI: 7, DEX: 6 },
      artId: "t2_plumblossom", artLevel: 5,
      skillIds: ["nd9", "nd11"],
    }) },
  { id: "spar_beggars_brawler", name: "ยาจกจิ๊ว", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_nc1", weight: 1 }, { itemId: "man_ne8", weight: 1 },
      { itemId: "man_t1_eagleclaw", weight: 1 }],
    build: () => build("ยาจกจิ๊ว", 2, {
      stats: { STR: 6, AGI: 6, VIT: 4 },
      artId: "t1_eagleclaw", artLevel: 4,
      skillIds: ["nc1", "ne8"],
    }) },
  { id: "spar_xingxiu_disciple", name: "ศิษย์ตู๋โซ่ว", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_pn", weight: 1 }, { itemId: "man_nd9", weight: 1 },
      { itemId: "man_t2_snakeform", weight: 1 }],
    build: () => build("ศิษย์ตู๋โซ่ว", 2, {
      stats: { DEX: 7, LUK: 5 },
      artId: "t2_snakeform", artLevel: 4,
      skillIds: ["pn", "nd9"],
    }) },
  { id: "spar_wudu_miao", name: "หมอพิษอาหมาน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_pn", weight: 1 }, { itemId: "man_nd9", weight: 1 },
      { itemId: "man_t2_snakeform", weight: 1 }],
    build: () => build("หมอพิษอาหมาน", 2, {
      stats: { DEX: 6, LUK: 6, POW: 3 },
      artId: "t2_snakeform", artLevel: 5,
      skillIds: ["pn", "nd9"],
    }) },
  { id: "spar_quanzhen_disciple", name: "สาวกชงซวี", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_qzjf", weight: 1 }, { itemId: "man_qz_punch", weight: 1 },
      { itemId: "man_qzzq", weight: 1 }],
    build: () => build("สาวกชงซวี", 2, {
      stats: { POW: 6, INT: 6, DEX: 4 },
      artId: "qzzq", artLevel: 4,
      skillIds: ["qzjf", "qz_punch"],
    }) },

  // T3 — late sparring (master tier, sect signature arts)
  { id: "spar_gumu_disciple", name: "ศิษย์เลิ่งเยว่", ti: 3, category: "human",
    // All-T3 loadout — drops a thematic T1 sword manual she carries.
    drops: [...DROPS_T3, { itemId: "man_nd3", weight: 1 }],
    build: () => build("ศิษย์เลิ่งเยว่", 3, {
      stats: { POW: 8, INT: 8, DEX: 5 },
      artId: "ynxj", artLevel: 5,
      skillIds: ["gm_sword", "ynss"],
    }) },
  { id: "spar_xiaoyao_master", name: "ปรมาจารย์ยุนเซียว", ti: 3, category: "human",
    // All-T3 loadout — drops a thematic T0 fan manual.
    drops: [...DROPS_T3, { itemId: "man_nc9", weight: 1 }],
    build: () => build("ปรมาจารย์ยุนเซียว", 3, {
      stats: { POW: 8, INT: 8, AGI: 6 },
      artId: "bmzq", artLevel: 5,
      skillIds: ["xy_punch", "yxjf"],
    }) },
  { id: "spar_ming_envoy", name: "ผู้แทนหั่วจี้", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_nd10", weight: 1 }, { itemId: "man_ne8", weight: 1 }],
    build: () => build("ผู้แทนหั่วจี้", 3, {
      stats: { STR: 8, POW: 6, AGI: 5 },
      artId: "t3_dragonelephant", artLevel: 5,
      skillIds: ["nd10", "ne8"],
    }) },
  { id: "spar_xuedao_blade", name: "ดาบเลือดเซียะลาง", ti: 3, category: "human",
    // All-T3 loadout — drops a thematic T1 sword manual.
    drops: [...DROPS_T3, { itemId: "man_nd3", weight: 1 }],
    build: () => build("ดาบเลือดเซียะลาง", 3, {
      stats: { STR: 9, AGI: 7, DEX: 5 },
      artId: "blood", artLevel: 4,
      skillIds: ["bs", "nf6"],
    }) },
  { id: "spar_xueyu_master", name: "จอมยุทธฉือยิง", ti: 3, category: "human",
    drops: [...DROPS_T3, { itemId: "man_nd10", weight: 1 }],
    build: () => build("จอมยุทธฉือยิง", 3, {
      stats: { STR: 9, AGI: 8, DEX: 6 },
      artId: "blood", artLevel: 5,
      skillIds: ["bs", "nf6", "nd10"],
    }) },

  // ─── Jinyiwei (องครักษ์เสื้อแพร) — sect roster ───────────────────────
  // Leader = T4 with the signature t4 art + multiple sect skills. Soldiers
  // = T3 with the t3 art + 2 sect skills. Stats lean on STR/AGI/DEX/VIT
  // (the lineage is yang/external pursuit work).

  // ผู้บัญชาการจ้าวฝู่ (sect_jinyiwei) — T4 leader, very strong.
  { id: "spar_jinyiwei_leader", name: "ผู้บัญชาการจ้าวฝู่", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_jy_blade_king", weight: 1 }, { itemId: "man_jy_chainmaster", weight: 1 },
      { itemId: "man_jy_a4_brocadelord", weight: 1 }, { itemId: "man_jy_a3_thunderstride", weight: 1 }],
    build: () => build("ผู้บัญชาการจ้าวฝู่", 4, {
      stats: { STR: 14, AGI: 12, DEX: 10, VIT: 10, DEF: 8 },
      artId: "jy_a4_brocadelord", artLevel: 8,
      skillIds: ["jy_blade_king", "jy_chainmaster", "jy_grapple", "jy_blade"],
    }) },

  // องครักษ์ฉิน (sect_jinyiwei) — T3 saber soldier.
  { id: "spar_jinyiwei_qin", name: "องครักษ์ฉิน", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_jy_blade", weight: 1 }, { itemId: "man_jy_eagleclaw", weight: 1 },
      { itemId: "man_jy_a3_thunderstride", weight: 1 }, { itemId: "man_jy_a2_goldarmor", weight: 1 }],
    build: () => build("องครักษ์ฉิน", 3, {
      stats: { STR: 10, DEX: 9, AGI: 7, VIT: 6 },
      artId: "jy_a3_thunderstride", artLevel: 6,
      skillIds: ["jy_blade", "jy_eagleclaw", "jy_chain"],
    }) },

  // องครักษ์ลู่ (sect_jinyiwei) — T3 chain specialist, grappler.
  { id: "spar_jinyiwei_lu", name: "องครักษ์ลู่", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_jy_chain", weight: 1 }, { itemId: "man_jy_grapple", weight: 1 },
      { itemId: "man_jy_a2_goldarmor", weight: 1 }, { itemId: "man_jy_a1_silktread", weight: 1 }],
    build: () => build("องครักษ์ลู่", 3, {
      stats: { STR: 9, DEX: 10, AGI: 7, VIT: 7 },
      artId: "jy_a2_goldarmor", artLevel: 7,
      skillIds: ["jy_chain", "jy_grapple", "jy_eagleclaw"],
    }) },

  // ─── Jinyiwei spies scattered across the world (5) ─────────────────
  // Each spy is sparrable (the player can challenge their cover) and
  // carries a slimmer Jinyiwei loadout — one move skill + one inner art.

  // สายลับเฟิงในนครหลวง (city_capital) — T2 chief informant.
  { id: "spar_spy_feng", name: "เฟิงผู้ส่งข่าว", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_jy_chain", weight: 1 }, { itemId: "man_jy_a0_brocade", weight: 1 }],
    build: () => build("เฟิงผู้ส่งข่าว", 2, {
      stats: { STR: 5, DEX: 8, AGI: 7, LUK: 5 },
      artId: "jy_a1_silktread", artLevel: 4,
      skillIds: ["jy_chain", "ns2"],
    }) },

  // สายลับซีในหยางโจว (city_yangzhou) — T2 port watcher, sword.
  { id: "spar_spy_xi", name: "ซีท่าเรือ", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_jy_blade", weight: 1 }, { itemId: "man_jy_a1_silktread", weight: 1 }],
    build: () => build("ซีท่าเรือ", 2, {
      stats: { STR: 7, AGI: 7, DEX: 6 },
      artId: "jy_a1_silktread", artLevel: 5,
      skillIds: ["jy_blade", "qf"],
    }) },

  // สายลับเหมยในต้าหลี่ (city_dali) — T2 southwest border ear.
  { id: "spar_spy_mei", name: "เหมยพรานป่า", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_jy_eagleclaw", weight: 1 }, { itemId: "man_jy_a0_brocade", weight: 1 }],
    build: () => build("เหมยพรานป่า", 2, {
      stats: { STR: 6, DEX: 8, AGI: 6, VIT: 4 },
      artId: "jy_a0_brocade", artLevel: 6,
      skillIds: ["jy_eagleclaw", "gn"],
    }) },

  // สายลับโจวในโรงเตี๊ยมยั่วไหล (inn_yuelai) — T1 listening post.
  { id: "spar_spy_zhou", name: "โจวพ่อค้าเหล้า", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_jy_chain", weight: 1 }, { itemId: "man_jy_a0_brocade", weight: 1 }],
    build: () => build("โจวพ่อค้าเหล้า", 1, {
      stats: { STR: 4, DEX: 6, AGI: 5 },
      artId: "jy_a0_brocade", artLevel: 3,
      skillIds: ["jy_chain"],
    }) },

  // สายลับซื่อในชีกู่ (village_qigu) — T1 rural agent posing as farmer.
  { id: "spar_spy_si", name: "ซื่อชาวนา", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_jy_grapple", weight: 1 }, { itemId: "man_jy_a0_brocade", weight: 1 }],
    build: () => build("ซื่อชาวนา", 1, {
      stats: { STR: 6, VIT: 5, DEX: 5 },
      artId: "jy_a0_brocade", artLevel: 4,
      skillIds: ["jy_grapple"],
    }) },
];

export const OPPONENTS_BY_ID = new Map<string, OpponentDef>(
  OPPONENTS.map((o) => [o.id, o]),
);

export function getOpponent(id: string | null | undefined): OpponentDef | null {
  if (!id) return null;
  return OPPONENTS_BY_ID.get(id) ?? null;
}
