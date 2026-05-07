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
];

export const OPPONENTS_BY_ID = new Map<string, OpponentDef>(
  OPPONENTS.map((o) => [o.id, o]),
);

export function getOpponent(id: string | null | undefined): OpponentDef | null {
  if (!id) return null;
  return OPPONENTS_BY_ID.get(id) ?? null;
}
