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
  // Extra inner arts the NPC has learned in addition to the primary
  // `artId`. Each contributes its scaled stats + HP/MP via `combinedStats`
  // (mirrors the player's learned-arts pool). Pair with `extraArtSlots`
  // to also let the AI fire their actives during the fight.
  learnedArtIds?: readonly string[];
  // Per-art level (1..10). Primary art uses `artLevel` (legacy); every
  // other entry in `learnedArtIds` falls back to 1 when missing here.
  artLevels?: Record<string, number>;
  // Art ids whose actives the NPC can fire during battle. These are
  // appended as `art:xxx` slot strings AFTER the move-skill ids in
  // `skillIds`, so the AI's slot walker dispatches them via
  // resolveArtActive (each gets its own slot cooldown). The primary
  // `artId` doesn't need to be listed — its passive triggers via
  // ctx.artIds[side] regardless. Authors typically list the primary
  // here too, though, so its active also rotates with the rest.
  extraArtSlots?: readonly string[];
}

// Module-level scaling factor for random opponents. Set by the world
// store before the bridge starts a battle (see initBattleBridge). Higher
// `OPPONENT_STAT_SCALE` means random encounters get tougher — drives the
// progression-aware difficulty curve so endgame players don't faceroll
// T1 bandits in 1 hit. Range: 1.0 (default, no scaling) → ~2.5 (max).
let OPPONENT_STAT_SCALE = 1;
export function setOpponentStatScale(scale: number): void {
  OPPONENT_STAT_SCALE = Math.max(1, Math.min(3, scale));
}
export function getOpponentStatScale(): number {
  return OPPONENT_STAT_SCALE;
}

function scaleStats(stats: StatBlock): StatBlock {
  if (OPPONENT_STAT_SCALE === 1) return stats;
  const out = { ...stats };
  for (const k of Object.keys(out) as (keyof StatBlock)[]) {
    out[k] = Math.max(1, Math.floor(out[k] * OPPONENT_STAT_SCALE));
  }
  return out;
}

function build(name: string, tier: 0 | 1 | 2 | 3 | 4, opts: BuildOpts = {}): CharacterBuild {
  const baseSkills = opts.skillIds ?? ["basic_punch"];
  const slotArts = opts.extraArtSlots ?? [];
  const artSlotStrs = slotArts.map((aid) => `art:${aid}`);
  // Concatenate skills first, then any extra art slots. Padding with nulls
  // happens in `slots(...)` to reach the 10-slot target.
  const allSlots = [...baseSkills, ...artSlotStrs];
  // Build the canonical learnedArtIds set: primary + slotted + author-listed
  // extras (deduped). All three contribute stats via combinedStats.
  const primary = opts.artId && opts.artId !== "none" ? [opts.artId] : [];
  const learned = Array.from(
    new Set([...primary, ...(opts.learnedArtIds ?? []), ...slotArts]),
  );
  return {
    name,
    stats: scaleStats({ ...TIER_STATS[tier], ...(opts.stats ?? {}) }),
    artId: opts.artId ?? "none",
    artLevel: opts.artLevel ?? 1,
    skillIds: slots(...allSlots),
    equipment: emptyEquip(),
    learnedArtIds: learned,
    artLevels: opts.artLevels,
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
  // Two arts: t1_goldenbell (primary, lv 6) + t0_lohan (lv 8) — defensive
  // breath rotation typical of an elder monk.
  { id: "spar_shaolin_faming", name: "อาจารย์ฝาหมิง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 }],
    build: () => build("อาจารย์ฝาหมิง", 3, {
      stats: { STR: 8, VIT: 8, DEF: 7, POW: 5 },
      artId: "t1_goldenbell", artLevel: 6,
      skillIds: ["sf", "nd5", "ne1"],
      extraArtSlots: ["t1_goldenbell", "t0_lohan"],
      artLevels: { t1_goldenbell: 6, t0_lohan: 8 },
    }) },

  // ศิษย์เซวียนจี้ (sect_shaolin) — gatekeeper disciple. Light fist work.
  { id: "spar_shaolin_xuanji", name: "ศิษย์เซวียนจี้", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_t0_lohan", weight: 1 }],
    build: () => build("ศิษย์เซวียนจี้", 1, {
      stats: { STR: 4, VIT: 4 },
      artId: "t0_lohan", artLevel: 3,
      skillIds: ["sf", "sl_long_dharma"],
    }) },

  // ─── เส้าหลิน strong roster (T3-T4) — sparring against these is a real fight ─
  // Stats are deliberately above TIER_STATS to make them genuinely fearsome.
  // Each carries a near-max-level art + 4–5 Shaolin signature skills.

  // หัวหน้าศิษย์หยวนเฉวียน (T3) — head disciple, balanced fist + sword.
  // Two arts: t1_goldenbell (primary, lv 8) + t0_lohan (lv 6) — both
  // defensive breaths layered for sustain.
  { id: "spar_shaolin_yuanquan", name: "หัวหน้าศิษย์หยวนเฉวียน", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 }],
    build: () => build("หัวหน้าศิษย์หยวนเฉวียน", 3, {
      stats: { STR: 10, VIT: 10, DEF: 8, POW: 7, DEX: 7 },
      artId: "t1_goldenbell", artLevel: 8,
      skillIds: ["sf", "nd5", "ne1", "ne2"],
      extraArtSlots: ["t1_goldenbell", "t0_lohan"],
      artLevels: { t1_goldenbell: 8, t0_lohan: 6 },
    }) },

  // หลวงพ่อเซียนเหริน (T4) — zen master, Int / finger / sword.
  // Three arts: t3_onefinger (primary, lv 10) + t1_goldenbell (lv 9) +
  // t0_lohan (lv 10). Multi-art rotation lets the AI heal, lay defensive
  // buffs, AND fire 一指禅 nukes in the same fight.
  { id: "spar_shaolin_xianren", name: "หลวงพ่อเซียนเหริน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_ne2", weight: 1 },
      { itemId: "ginseng", weight: 2 }, { itemId: "jade", weight: 1 }],
    build: () => build("หลวงพ่อเซียนเหริน", 4, {
      stats: { POW: 18, INT: 18, DEX: 15, AGI: 12, VIT: 10 },
      artId: "t3_onefinger", artLevel: 10,
      skillIds: ["nd5", "sl_zen_sword", "sl_petal_finger", "ne2"],
      extraArtSlots: ["t3_onefinger", "t1_goldenbell", "t0_lohan"],
      artLevels: { t3_onefinger: 10, t1_goldenbell: 9, t0_lohan: 10 },
    }) },

  // หลวงพ่อจูตี้ (T4) — staff master, hard-external Phy specialist.
  // Stacking diamond's damage-reduction with sl_truth_staff's stun for
  // a brutally durable lockdown fighter. Three arts: diamond (primary,
  // lv 10) + tendon (lv 10) + t1_goldenbell (lv 9) — every breath layers
  // on damage reduction or HP recovery.
  { id: "spar_shaolin_juti", name: "หลวงพ่อจูตี้", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 },
      { itemId: "wood_hard", weight: 3 }, { itemId: "iron_ingot", weight: 2 },
      { itemId: "jade", weight: 1 }],
    build: () => build("หลวงพ่อจูตี้", 4, {
      stats: { STR: 18, VIT: 18, DEF: 15, DEX: 12, AGI: 8 },
      artId: "diamond", artLevel: 10,
      skillIds: ["sl_truth_staff", "sl_staff_dharma", "sl_staff_shaolin", "sl_rock_punch"],
      extraArtSlots: ["diamond", "tendon", "t1_goldenbell"],
      artLevels: { diamond: 10, tendon: 10, t1_goldenbell: 9 },
    }) },

  // หลวงพี่ใหญ่ฮุยเหมียว (T4) — dharma guardian, peak fist tank-bruiser.
  // Tendon (易筋经) at lv 10 + sl_thousand_arms with vitScale 0.5 makes
  // his VIT-stacked stat block hit like a freight train. Three arts:
  // tendon (primary) + diamond + t1_goldenbell stack massive HP and
  // damage-reduction layers — this monk does not die quietly.
  { id: "spar_shaolin_huimiao", name: "หลวงพี่ใหญ่ฮุยเหมียว", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 },
      { itemId: "ginseng", weight: 2 }, { itemId: "jade", weight: 2 },
      { itemId: "wood_sacred", weight: 1 }],
    build: () => build("หลวงพี่ใหญ่ฮุยเหมียว", 4, {
      stats: { STR: 20, VIT: 20, DEF: 15, POW: 10, DEX: 8 },
      artId: "tendon", artLevel: 10,
      skillIds: ["sf", "ne1", "sl_thousand_arms", "sl_rock_punch"],
      extraArtSlots: ["tendon", "diamond", "t1_goldenbell"],
      artLevels: { tendon: 10, diamond: 10, t1_goldenbell: 9 },
    }) },

  // เจ้าอาวาสฮุยหยวน (T4) — *boss tier*. Top-of-game opponent. Stats blow
  // past every other T4 sparring partner: VIT 30 (+ tendon's +20 + diamond's
  // +25 = ~75 VIT total at lv 10) makes sl_thousand_arms' vitScale 0.5
  // generate ~+37 flat damage per swing, and t4_demonsubduer's use_act
  // passive snowballs ATK +24% per active. Six signature skills cover
  // every range AND he carries the full top-tier art rotation: primary
  // t4_demonsubduer + tendon + diamond + t3_onefinger + t1_goldenbell.
  // The combined HP pool from learned arts pushes him over 5000 HP.
  // Defeating him is endgame for the Shaolin path — sparFameReward 18
  // is the highest in the game.
  { id: "spar_shaolin_abbot_huiyuan", name: "เจ้าอาวาสฮุยหยวน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_ne2", weight: 1 },
      { itemId: "man_t0_lohan", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 },
      { itemId: "ginseng", weight: 4 }, { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 }, { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 2 }],
    build: () => build("เจ้าอาวาสฮุยหยวน", 4, {
      stats: { STR: 22, VIT: 30, DEF: 20, POW: 22, INT: 18, DEX: 15, AGI: 14, LUK: 8 },
      artId: "t4_demonsubduer", artLevel: 10,
      skillIds: ["sl_thousand_arms", "sl_truth_staff", "sl_bodhi_palm", "sl_rock_punch", "ne1", "ne2"],
      extraArtSlots: ["t4_demonsubduer", "tendon", "diamond", "t3_onefinger"],
      artLevels: {
        t4_demonsubduer: 10,
        tendon: 10,
        diamond: 10,
        t3_onefinger: 10,
        t1_goldenbell: 10,
      },
      learnedArtIds: ["t1_goldenbell"],
    }) },

  // รองเจ้าอาวาสลั่วฮั่น (T4) — vice-abbot. The second-strongest in the
  // sect (behind only the abbot himself). Five skills covering fist +
  // sword + staff + bodhi palm, with t4_demonsubduer's stack_atk passive
  // turning every active into a snowballing ATK gain. Four arts:
  // t4_demonsubduer (primary) + tendon + diamond + t1_goldenbell — every
  // active fires use_act stack_atk so his damage spirals fast.
  { id: "spar_shaolin_luohan", name: "รองเจ้าอาวาสลั่วฮั่น", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_sf", weight: 1 }, { itemId: "man_nd5", weight: 1 },
      { itemId: "man_ne1", weight: 1 }, { itemId: "man_ne2", weight: 1 },
      { itemId: "man_t0_lohan", weight: 1 }, { itemId: "man_t1_goldenbell", weight: 1 },
      { itemId: "ginseng", weight: 3 }, { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("รองเจ้าอาวาสลั่วฮั่น", 4, {
      stats: { STR: 18, VIT: 18, DEF: 15, POW: 15, DEX: 12, AGI: 12 },
      artId: "t4_demonsubduer", artLevel: 10,
      skillIds: ["sl_thousand_arms", "sl_truth_staff", "sl_bodhi_palm", "ne1", "ne2"],
      extraArtSlots: ["t4_demonsubduer", "tendon", "diamond", "t1_goldenbell"],
      artLevels: { t4_demonsubduer: 10, tendon: 10, diamond: 10, t1_goldenbell: 9 },
    }) },

  // ─── อู่ตัง — sect leadership (T2-T4) ──────────────────────────────
  // อาจารย์ชิงซวี่ (T4) — Wudang grandmaster. Endgame-tier on the
  // balance / soft / internal axis. Carries the full taiji-line rotation
  // (taiji + zixia + t3_yinyang + t2_mindbody) plus the disciple-line
  // capstone moves (heaven sword + taiji fist song + cloud sword + cloud
  // palm). Mirrors Shaolin abbot's role for the Wudang path.
  { id: "spar_wudang_master_qingxu", name: "อาจารย์ชิงซวี่", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_rf", weight: 1 },
      { itemId: "man_cs", weight: 1 },
      { itemId: "ginseng", weight: 4 }, { itemId: "snow_lotus", weight: 2 },
      { itemId: "jade", weight: 4 }, { itemId: "ancient_coin", weight: 3 },
      { itemId: "wood_sacred", weight: 2 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("อาจารย์ชิงซวี่", 4, {
      stats: { STR: 12, VIT: 24, DEF: 18, POW: 28, INT: 22, DEX: 14, AGI: 16, LUK: 8 },
      artId: "taiji", artLevel: 10,
      skillIds: ["wd_heaven_sword", "wd_taiji_fist", "wd_cloud_sword", "wd_cloud_palm", "yy", "rf"],
      extraArtSlots: ["taiji", "zixia", "t3_yinyang", "t2_mindbody"],
      artLevels: { taiji: 10, zixia: 10, t3_yinyang: 10, t2_mindbody: 10, t1_naturalqi: 10 },
      learnedArtIds: ["t1_naturalqi"],
    }) },

  // รองอาจารย์เสวียนเฉิง (T4) — vice master, second only to qingxu.
  // Sword-leaning kit with reflect + cloud sword pressure.
  { id: "spar_wudang_xuancheng", name: "รองอาจารย์เสวียนเฉิง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_rf", weight: 1 },
      { itemId: "ginseng", weight: 3 }, { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }, { itemId: "wood_sacred", weight: 2 }],
    build: () => build("รองอาจารย์เสวียนเฉิง", 4, {
      stats: { POW: 22, INT: 18, VIT: 18, DEF: 14, DEX: 12, AGI: 14 },
      artId: "taiji", artLevel: 10,
      skillIds: ["wd_heaven_sword", "wd_cloud_sword", "wd_yinyang_sword", "rf", "cs"],
      extraArtSlots: ["taiji", "t3_yinyang", "t2_mindbody"],
      artLevels: { taiji: 10, t3_yinyang: 10, t2_mindbody: 9 },
    }) },

  // อาจารย์ดาบหลิงอวี้ (T4) — sword elder. Pure swordmaster kit.
  { id: "spar_wudang_lingyu", name: "อาจารย์ดาบหลิงอวี้", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_cs", weight: 1 },
      { itemId: "jade", weight: 3 }, { itemId: "iron_ore", weight: 2 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("อาจารย์ดาบหลิงอวี้", 4, {
      stats: { POW: 18, INT: 14, DEX: 14, AGI: 16, STR: 8 },
      artId: "zixia", artLevel: 9,
      skillIds: ["wd_heaven_sword", "wd_cloud_sword", "wd_yinyang_sword", "wd_taiji_sword"],
      extraArtSlots: ["zixia", "t3_yinyang"],
      artLevels: { zixia: 9, t3_yinyang: 8 },
    }) },

  // อาจารย์ปราณเป่าชุน (T3) — internal-art elder. Soft / yin support skills.
  { id: "spar_wudang_baochun", name: "อาจารย์ปราณเป่าชุน", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_tj", weight: 1 }, { itemId: "ginseng", weight: 4 },
      { itemId: "herb", weight: 3 }, { itemId: "paper", weight: 2 }],
    build: () => build("อาจารย์ปราณเป่าชุน", 3, {
      stats: { POW: 14, INT: 14, VIT: 10, DEF: 8 },
      artId: "t3_yinyang", artLevel: 8,
      skillIds: ["wd_cloud_palm", "wd_yinyang_sword", "yy", "rf"],
      extraArtSlots: ["t3_yinyang", "t2_mindbody"],
      artLevels: { t3_yinyang: 8, t2_mindbody: 7 },
    }) },

  // หัวหน้าศิษย์จื้อหรง (T2) — head disciple. Solid mid-tier mix.
  { id: "spar_wudang_zhirong", name: "หัวหน้าศิษย์จื้อหรง", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_rf", weight: 1 },
      { itemId: "ginseng", weight: 2 }],
    build: () => build("หัวหน้าศิษย์จื้อหรง", 2, {
      stats: { POW: 9, INT: 7, AGI: 6, DEX: 5 },
      artId: "t2_mindbody", artLevel: 6,
      skillIds: ["wd_yinyang_sword", "wd_taiji_sword", "rf", "cs"],
      extraArtSlots: ["t2_mindbody"],
      artLevels: { t2_mindbody: 6 },
    }) },

  // ศิษย์อวี่เจี้ยน (T2) — sword disciple, mid-tier sparring.
  { id: "spar_wudang_yujian", name: "ศิษย์อวี่เจี้ยน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_tj", weight: 1 }, { itemId: "man_cs", weight: 1 }],
    build: () => build("ศิษย์อวี่เจี้ยน", 2, {
      stats: { POW: 7, AGI: 6, DEX: 5 },
      artId: "t1_naturalqi", artLevel: 5,
      skillIds: ["wd_taiji_sword", "tj", "cs"],
    }) },

  // ศิษย์ชิงซิน (T1) — gatekeeper disciple, novice sparring.
  { id: "spar_wudang_qingxin", name: "ศิษย์ชิงซิน", ti: 1, category: "human",
    drops: [...DROPS_T1,
      { itemId: "man_tj", weight: 1 }],
    build: () => build("ศิษย์ชิงซิน", 1, {
      stats: { POW: 5, AGI: 4 },
      artId: "t0_meditation", artLevel: 4,
      skillIds: ["tj", "cs"],
    }) },

  // ─── หัวซาน — sect leadership (T1-T3) ──────────────────────────────
  // Smaller sword-only sect. Master / vice cap at T3 — strong but not on
  // the legendary tier of Shaolin abbot or Wudang grandmaster. The kit
  // leans on the disciple-line purple-cloud sword + the older huashan
  // shengong art for crit-stack pressure.
  { id: "spar_huashan_master_yiqing", name: "อาจารย์ใหญ่อี้ชิง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "iron_ore", weight: 4 }, { itemId: "wood_hard", weight: 3 },
      { itemId: "jade", weight: 3 }, { itemId: "ancient_coin", weight: 2 },
      { itemId: "mithril_ore", weight: 1 }],
    build: () => build("อาจารย์ใหญ่อี้ชิง", 3, {
      stats: { STR: 14, DEX: 14, AGI: 12, POW: 8, VIT: 10 },
      artId: "t4_huashan_purple", artLevel: 8,
      skillIds: ["hs_purple_cloud", "hs_floating_cloud", "hs_basic_sword"],
      extraArtSlots: ["t4_huashan_purple", "t2_huashan_cloud"],
      artLevels: { t4_huashan_purple: 8, t2_huashan_cloud: 8, t1_huashan_light: 8 },
      learnedArtIds: ["t1_huashan_light"],
    }) },

  { id: "spar_huashan_zifeng", name: "รองอาจารย์จื่อเฟิง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "iron_ore", weight: 3 }, { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("รองอาจารย์จื่อเฟิง", 3, {
      stats: { STR: 12, DEX: 10, AGI: 10, VIT: 8 },
      artId: "t2_huashan_cloud", artLevel: 7,
      skillIds: ["hs_purple_cloud", "hs_floating_cloud", "hs_basic_sword"],
      extraArtSlots: ["t2_huashan_cloud"],
      artLevels: { t2_huashan_cloud: 7, t1_huashan_light: 6 },
      learnedArtIds: ["t1_huashan_light"],
    }) },

  { id: "spar_huashan_qingsong", name: "อาจารย์ดาบชิงซ่ง", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "iron_ore", weight: 3 }, { itemId: "wood_hard", weight: 2 }],
    build: () => build("อาจารย์ดาบชิงซ่ง", 2, {
      stats: { STR: 9, DEX: 8, AGI: 7 },
      artId: "t1_huashan_light", artLevel: 6,
      skillIds: ["hs_floating_cloud", "hs_basic_sword"],
      extraArtSlots: ["t1_huashan_light"],
      artLevels: { t1_huashan_light: 6 },
    }) },

  { id: "spar_huashan_zhongming", name: "หัวหน้าศิษย์จงหมิง", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "iron_ore", weight: 2 }],
    build: () => build("หัวหน้าศิษย์จงหมิง", 2, {
      stats: { STR: 8, DEX: 7, AGI: 6 },
      artId: "t1_huashan_light", artLevel: 5,
      skillIds: ["hs_floating_cloud", "hs_basic_sword"],
    }) },

  { id: "spar_huashan_xiaoyun", name: "ศิษย์เสี่ยวอวิ๋น", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์เสี่ยวอวิ๋น", 1, {
      stats: { STR: 5, DEX: 4 },
      artId: "t0_huashan_qi", artLevel: 4,
      skillIds: ["hs_basic_sword"],
    }) },

  // ─── ฉวนเจิน — sect leadership (T1-T3) ──────────────────────────────
  // Ascetic Daoist sect with yang/hard sword + fist identity. Master and
  // vice cap at T3 (matches Huashan tier — strong but not legendary).
  // The "sun" sub-line drives crit/stack ATK pressure.
  { id: "spar_quanzhen_master_chongyang", name: "อาจารย์ใหญ่ฉงหยาง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_qzjf", weight: 1 }, { itemId: "man_qz_punch", weight: 1 },
      { itemId: "paper", weight: 4 }, { itemId: "ink", weight: 4 },
      { itemId: "ginseng", weight: 3 }, { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }, { itemId: "wood_sacred", weight: 2 }],
    build: () => build("อาจารย์ใหญ่ฉงหยาง", 3, {
      stats: { STR: 14, POW: 14, INT: 10, VIT: 10, DEX: 8 },
      artId: "t3_qz_sun", artLevel: 8,
      skillIds: ["qz_sun_sword", "qz_sun_fist", "qzjf", "qz_punch"],
      extraArtSlots: ["t3_qz_sun", "qzzq", "t3_qz_dragon"],
      artLevels: { t3_qz_sun: 8, qzzq: 9, t3_qz_dragon: 8, t1_qz_horse: 8 },
      learnedArtIds: ["t1_qz_horse"],
    }) },

  { id: "spar_quanzhen_mayu", name: "รองอาจารย์หม่ายวี่", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "man_qzjf", weight: 1 },
      { itemId: "paper", weight: 3 }, { itemId: "ink", weight: 3 },
      { itemId: "jade", weight: 2 }, { itemId: "ancient_coin", weight: 2 }],
    build: () => build("รองอาจารย์หม่ายวี่", 3, {
      stats: { STR: 12, POW: 10, VIT: 10, DEX: 8 },
      artId: "qzzq", artLevel: 8,
      skillIds: ["qz_sun_sword", "qzjf", "qz_hot_sword", "qz_heavy_sword"],
      extraArtSlots: ["qzzq", "t1_qz_horse"],
      artLevels: { qzzq: 8, t1_qz_horse: 7 },
    }) },

  { id: "spar_quanzhen_qiuchuji", name: "อาจารย์ดาบชิวฉู่จี้", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_qzjf", weight: 1 },
      { itemId: "iron_ore", weight: 2 }, { itemId: "paper", weight: 2 }],
    build: () => build("อาจารย์ดาบชิวฉู่จี้", 2, {
      stats: { STR: 9, POW: 7, DEX: 6 },
      artId: "qzzq", artLevel: 6,
      skillIds: ["qz_sun_sword", "qz_hot_sword", "qzjf"],
      extraArtSlots: ["qzzq"],
      artLevels: { qzzq: 6 },
    }) },

  { id: "spar_quanzhen_yaolan", name: "อาจารย์ปราณเหยาหลัน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "man_qz_punch", weight: 1 },
      { itemId: "paper", weight: 3 }, { itemId: "ink", weight: 3 },
      { itemId: "ginseng", weight: 2 }],
    build: () => build("อาจารย์ปราณเหยาหลัน", 2, {
      stats: { POW: 9, INT: 8, VIT: 6 },
      artId: "qzzq", artLevel: 6,
      skillIds: ["qz_sun_fist", "qz_punch", "qzjf"],
      extraArtSlots: ["qzzq"],
      artLevels: { qzzq: 6 },
    }) },

  { id: "spar_quanzhen_yangzi", name: "ศิษย์หยางจื่อ", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์หยางจื่อ", 1, {
      stats: { STR: 5, POW: 4 },
      artId: "t0_qz_speed", artLevel: 4,
      skillIds: ["qz_heavy_sword"],
    }) },

  // ─── ง้อไบ๊ — sect leadership (T1-T4) ──────────────────────────────
  // Buddhist nun sect — leadership tier matches Shaolin / Wudang. Yin /
  // internal sword + fist with the bodhisattva-line capstone. Abbess
  // Jingchan carries the full top-tier kit (4 arts + 6 skills).
  { id: "spar_emei_abbess_jingchan", name: "ท่านนิ้วห้วนจิงฉาน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 4 }, { itemId: "snow_lotus", weight: 3 },
      { itemId: "lotus_seed", weight: 4 }, { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 }, { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 }],
    build: () => build("ท่านนิ้วห้วนจิงฉาน", 4, {
      stats: { STR: 8, VIT: 22, DEF: 16, POW: 28, INT: 24, DEX: 14, AGI: 14, LUK: 8 },
      artId: "t4_em_bodhi", artLevel: 10,
      skillIds: ["em_bodhi_sword", "em_bodhi_palm", "em_plum_sword", "em_buddha_sword", "em_lotus_palm", "em_heart_palm"],
      extraArtSlots: ["t4_em_bodhi", "emei", "t3_em_heart", "t3_em_grace"],
      artLevels: { t4_em_bodhi: 10, emei: 10, t3_em_heart: 10, t3_em_grace: 10, t3_em_ice: 10 },
      learnedArtIds: ["t3_em_ice"],
    }) },

  { id: "spar_emei_huimiao", name: "รองท่านนิ้วฮุยเหมียว", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 3 }, { itemId: "lotus_seed", weight: 3 },
      { itemId: "jade", weight: 3 }, { itemId: "ancient_coin", weight: 2 },
      { itemId: "wood_sacred", weight: 2 }],
    build: () => build("รองท่านนิ้วฮุยเหมียว", 4, {
      stats: { POW: 22, INT: 18, VIT: 16, DEF: 12, DEX: 12, AGI: 12 },
      artId: "emei", artLevel: 10,
      skillIds: ["em_bodhi_palm", "em_plum_sword", "em_lotus_palm", "em_heart_palm", "em_blossom_sword"],
      extraArtSlots: ["emei", "t3_em_heart", "t2_em_garland"],
      artLevels: { emei: 10, t3_em_heart: 9, t2_em_garland: 9 },
    }) },

  { id: "spar_emei_qingxin", name: "ท่านนิ้วดาบชิงซิน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "jade", weight: 3 }, { itemId: "iron_ore", weight: 2 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("ท่านนิ้วดาบชิงซิน", 4, {
      stats: { POW: 18, INT: 14, DEX: 16, AGI: 14, STR: 8 },
      artId: "t3_em_grace", artLevel: 9,
      skillIds: ["em_bodhi_sword", "em_plum_sword", "em_buddha_sword", "em_blossom_sword"],
      extraArtSlots: ["t3_em_grace", "t2_em_garland"],
      artLevels: { t3_em_grace: 9, t2_em_garland: 9 },
    }) },

  { id: "spar_emei_huiyu", name: "ท่านนิ้วฝ่ามือฮุยอวี้", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 4 }, { itemId: "lotus_seed", weight: 3 },
      { itemId: "jade", weight: 2 }],
    build: () => build("ท่านนิ้วฝ่ามือฮุยอวี้", 4, {
      stats: { POW: 18, INT: 16, VIT: 12, DEX: 8 },
      artId: "t4_em_bodhi", artLevel: 9,
      skillIds: ["em_bodhi_palm", "em_lotus_palm", "em_heart_palm"],
      extraArtSlots: ["t4_em_bodhi", "t3_em_heart"],
      artLevels: { t4_em_bodhi: 9, t3_em_heart: 9 },
    }) },

  { id: "spar_emei_yuxin", name: "หมอนิ้วอวี้ซิน", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "herb", weight: 5 }, { itemId: "ginseng", weight: 4 },
      { itemId: "snow_lotus", weight: 2 }, { itemId: "potion_mid", weight: 3 }],
    build: () => build("หมอนิ้วอวี้ซิน", 3, {
      stats: { POW: 14, INT: 14, VIT: 10, DEX: 6 },
      artId: "t3_em_heart", artLevel: 8,
      skillIds: ["em_heart_sword", "em_heart_palm", "em_lotus_palm"],
      extraArtSlots: ["t3_em_heart", "t2_em_garland"],
      artLevels: { t3_em_heart: 8, t2_em_garland: 7 },
    }) },

  { id: "spar_emei_zhihui", name: "หัวหน้าศิษย์จื้อฮุย", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "herb", weight: 3 }, { itemId: "lotus_seed", weight: 2 }],
    build: () => build("หัวหน้าศิษย์จื้อฮุย", 2, {
      stats: { POW: 9, INT: 7, DEX: 6 },
      artId: "t2_em_garland", artLevel: 6,
      skillIds: ["em_blossom_sword", "em_heart_sword", "em_graceful_sword"],
      extraArtSlots: ["t2_em_garland"],
      artLevels: { t2_em_garland: 6 },
    }) },

  { id: "spar_emei_xiaoyu", name: "ศิษย์เสี่ยวอวี้", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "herb", weight: 2 }],
    build: () => build("ศิษย์เสี่ยวอวี้", 2, {
      stats: { POW: 7, INT: 6, DEX: 5 },
      artId: "t1_em_lotus", artLevel: 5,
      skillIds: ["em_lotus_palm", "em_blossom_sword"],
    }) },

  { id: "spar_emei_lingxin", name: "ศิษย์หลิงซิน", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์หลิงซิน", 1, {
      stats: { POW: 5, DEX: 4 },
      artId: "t0_em_meditation", artLevel: 4,
      skillIds: ["em_graceful_sword"],
    }) },

  { id: "spar_emei_yujie", name: "ศิษย์อวี้เจี๋ย", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์อวี้เจี๋ย", 1, {
      stats: { POW: 4, AGI: 4 },
      artId: "t0_em_meditation", artLevel: 3,
      skillIds: ["em_graceful_sword"],
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

  // ─── พรรคยาจก — sect leadership (T1-T4) ──────────────────────────────
  // Big sect, T4 chief tier. Hongtian carries the full disciple-line:
  // bg_lucky_staff (T4 staff) + ep + ng3 + bg_wander_staff + bg_drift
  // skills + arts t4_bg_thousandcrowd + wanderer + t3_bg_sunrenew.
  { id: "spar_beggars_chief_hongtian", name: "หัวหน้าหงเทียน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "rice_dish", weight: 5 }, { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade", weight: 3 }, { itemId: "wood_hard", weight: 3 },
      { itemId: "wood_sacred", weight: 2 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("หัวหน้าหงเทียน", 4, {
      stats: { STR: 22, VIT: 24, DEF: 16, POW: 14, INT: 10, DEX: 14, AGI: 16, LUK: 10 },
      artId: "t4_bg_thousandcrowd", artLevel: 10,
      skillIds: ["bg_lucky_staff", "ep", "ng3", "bg_wander_staff", "bg_drift_staff", "bg_drift_fist"],
      extraArtSlots: ["t4_bg_thousandcrowd", "wanderer", "t3_bg_sunrenew", "t2_bg_nineshadow"],
      artLevels: { t4_bg_thousandcrowd: 10, wanderer: 10, t3_bg_sunrenew: 10, t2_bg_nineshadow: 10, t1_bg_sunshadow: 10 },
      learnedArtIds: ["t1_bg_sunshadow"],
    }) },

  { id: "spar_beggars_lifang", name: "รองหัวหน้าหลี่ฟาง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "rice_dish", weight: 4 }, { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade", weight: 2 }, { itemId: "wood_hard", weight: 2 }],
    build: () => build("รองหัวหน้าหลี่ฟาง", 4, {
      stats: { STR: 18, VIT: 18, DEF: 12, AGI: 14, DEX: 10 },
      artId: "wanderer", artLevel: 10,
      skillIds: ["bg_lucky_staff", "bg_wander_staff", "ng3", "bg_drift_fist", "ep"],
      extraArtSlots: ["wanderer", "t3_bg_sunrenew", "t2_bg_nineshadow"],
      artLevels: { wanderer: 10, t3_bg_sunrenew: 9, t2_bg_nineshadow: 9 },
    }) },

  { id: "spar_beggars_qicheng", name: "อาจารย์ไม้เท้าฉีเฉิง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "wood_hard", weight: 4 }, { itemId: "rice_dish", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("อาจารย์ไม้เท้าฉีเฉิง", 4, {
      stats: { STR: 20, VIT: 14, AGI: 12, DEX: 10, DEF: 8 },
      artId: "t3_bg_sunrenew", artLevel: 9,
      skillIds: ["bg_lucky_staff", "bg_wander_staff", "bg_drift_staff", "bg_snake_staff"],
      extraArtSlots: ["t3_bg_sunrenew", "t2_bg_nineshadow"],
      artLevels: { t3_bg_sunrenew: 9, t2_bg_nineshadow: 8 },
    }) },

  { id: "spar_beggars_wudao", name: "อาจารย์หมัดอู่เต้า", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "rice_dish", weight: 4 }, { itemId: "ancient_coin", weight: 3 },
      { itemId: "jade", weight: 2 }],
    build: () => build("อาจารย์หมัดอู่เต้า", 4, {
      stats: { STR: 20, VIT: 14, POW: 10, DEX: 8 },
      artId: "wanderer", artLevel: 9,
      skillIds: ["ep", "ng3", "bg_drift_fist", "bg_snake_fist"],
      extraArtSlots: ["wanderer", "t3_bg_sunrenew"],
      artLevels: { wanderer: 9, t3_bg_sunrenew: 9 },
    }) },

  { id: "spar_beggars_yunsi", name: "อาจารย์ข่าวสารยุนซือ", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "paper", weight: 5 }, { itemId: "ink", weight: 4 },
      { itemId: "ancient_coin", weight: 3 }],
    build: () => build("อาจารย์ข่าวสารยุนซือ", 3, {
      stats: { STR: 12, AGI: 14, DEX: 10, VIT: 8 },
      artId: "t2_bg_nineshadow", artLevel: 8,
      skillIds: ["bg_drift_fist", "bg_drift_staff", "bg_snake_fist"],
      extraArtSlots: ["t2_bg_nineshadow", "t1_bg_sunshadow"],
      artLevels: { t2_bg_nineshadow: 8, t1_bg_sunshadow: 7 },
    }) },

  { id: "spar_beggars_renhua", name: "หัวหน้าศิษย์เหรินฮัว", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "rice_dish", weight: 3 }, { itemId: "ancient_coin", weight: 2 }],
    build: () => build("หัวหน้าศิษย์เหรินฮัว", 2, {
      stats: { STR: 9, AGI: 7, DEX: 5 },
      artId: "t1_bg_sunshadow", artLevel: 6,
      skillIds: ["bg_drift_staff", "bg_snake_fist", "nc1"],
      extraArtSlots: ["t1_bg_sunshadow"],
      artLevels: { t1_bg_sunshadow: 6 },
    }) },

  { id: "spar_beggars_dawei", name: "ศิษย์ต้าเหว่ย", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "rice_dish", weight: 2 }],
    build: () => build("ศิษย์ต้าเหว่ย", 2, {
      stats: { STR: 8, VIT: 6, AGI: 5 },
      artId: "t1_bg_sunshadow", artLevel: 5,
      skillIds: ["bg_snake_staff", "nc2"],
    }) },

  { id: "spar_beggars_xiaohu", name: "ศิษย์เสี่ยวฮู", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "rice_dish", weight: 2 }],
    build: () => build("ศิษย์เสี่ยวฮู", 2, {
      stats: { STR: 7, AGI: 8, DEX: 4 },
      artId: "t1_bg_sunshadow", artLevel: 5,
      skillIds: ["bg_drift_fist", "bg_snake_fist"],
    }) },

  { id: "spar_beggars_xiaomao", name: "ศิษย์เสี่ยวเหมา", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์เสี่ยวเหมา", 1, {
      stats: { STR: 5, VIT: 4 },
      artId: "t0_bg_survival", artLevel: 3,
      skillIds: ["nc1", "nc2"],
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

  // หญิงปริศนาในสุสาน (T4) — secret-sect mystery woman. Strongest single
  // opponent in the game: stat budget pushed beyond every other T4 master
  // (POW 32 + INT 28 + AGI 18 vs the typical 22-24 for Shaolin abbot or
  // Wudang grandmaster). Carries the FULL Gumu disciple-line — ynxj +
  // both new T4 ice arts + ansh — plus all 3 gumu skills. Defeating her
  // is the new endgame benchmark; sparFame 22 is the highest in the game.
  { id: "spar_gumu_mystery_woman", name: "หญิงปริศนาในสุสาน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 5 }, { itemId: "snow_lotus", weight: 4 },
      { itemId: "jade", weight: 5 }, { itemId: "ancient_coin", weight: 4 },
      { itemId: "wood_sacred", weight: 3 }, { itemId: "mithril_ore", weight: 3 }],
    build: () => build("หญิงปริศนาในสุสาน", 4, {
      stats: { STR: 10, VIT: 24, DEF: 18, POW: 32, INT: 28, DEX: 18, AGI: 18, LUK: 8 },
      artId: "t4_gm_iceweave", artLevel: 10,
      skillIds: ["ansh", "ynss", "gm_sword"],
      extraArtSlots: ["t4_gm_iceweave", "t4_gm_winterstep", "ynxj"],
      artLevels: { t4_gm_iceweave: 10, t4_gm_winterstep: 10, ynxj: 10 },
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

  // ผู้บัญชาการจ้าวฝู่ (sect_jinyiwei) — T4 leader, near Shaolin/Wudang
  // tier. Carries the full disciple-line: T4 godslayer + brocadelord
  // arts + the 3 new T4 weapon skills (execution sword + blade + chain
  // assassin) + the T3 chainmaster.
  { id: "spar_jinyiwei_leader", name: "ผู้บัญชาการจ้าวฝู่", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "man_jy_blade_king", weight: 1 }, { itemId: "man_jy_chainmaster", weight: 1 },
      { itemId: "man_jy_a4_brocadelord", weight: 1 }, { itemId: "man_jy_a3_thunderstride", weight: 1 }],
    build: () => build("ผู้บัญชาการจ้าวฝู่", 4, {
      stats: { STR: 22, AGI: 16, DEX: 16, VIT: 18, DEF: 14, POW: 8 },
      artId: "t4_jy_godslayer", artLevel: 10,
      skillIds: ["jy_execution_blade", "jy_execution_sword", "jy_chain_assassin", "jy_blade_king", "jy_chainmaster", "jy_grapple"],
      extraArtSlots: ["t4_jy_godslayer", "jy_a4_brocadelord", "t3_jy_shadow", "jy_a3_thunderstride"],
      artLevels: { t4_jy_godslayer: 10, jy_a4_brocadelord: 10, t3_jy_shadow: 10, jy_a3_thunderstride: 10, jy_a2_goldarmor: 10 },
      learnedArtIds: ["jy_a2_goldarmor"],
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

  // ─── ELITE — endgame random encounters ────────────────────────────
  // Spawn weight in FIGHT_EVENTS is gated by player power signal (sect
  // rank or day) so these only appear once the player is strong enough
  // to need them. Stats are roughly 2× a regular T4: top-tier multi-art
  // kits, multi-hit signature skills, debuff_atk / stun threats that
  // bypass tank walls. Drops are richer (extra manuals + valuables).
  { id: "elite_blood_rakshasa", name: "อสุรกายโลหิต", ti: 4, category: "supernatural",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 4 }, { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }, { itemId: "wood_sacred", weight: 1 }],
    build: () => build("อสุรกายโลหิต", 4, {
      stats: { STR: 22, AGI: 18, POW: 16, VIT: 18, DEX: 16, LUK: 10, DEF: 16, INT: 12 },
      artId: "blood", artLevel: 10,
      skillIds: ["ep", "ng3", "ne1", "wd_palm"],
      extraArtSlots: ["blood", "tendon"],
      artLevels: { blood: 10, tendon: 10 },
    }) },

  { id: "elite_void_grandmaster", name: "ปรมาจารย์ความว่าง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 4 }, { itemId: "jade", weight: 3 },
      { itemId: "ancient_coin", weight: 2 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("ปรมาจารย์ความว่าง", 4, {
      stats: { POW: 24, INT: 22, DEX: 20, AGI: 20, VIT: 14, LUK: 12 },
      artId: "qiankun", artLevel: 10,
      skillIds: ["dgjj", "sl_petal_finger", "ynss", "ansh"],
      extraArtSlots: ["qiankun", "t3_voidstep"],
      artLevels: { qiankun: 10, t3_voidstep: 10 },
    }) },

  { id: "elite_iron_mountain", name: "ภูเขาเหล็ก", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "iron_ore", weight: 5 }, { itemId: "iron_ingot", weight: 4 },
      { itemId: "ginseng", weight: 3 }, { itemId: "jade", weight: 2 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("ภูเขาเหล็ก", 4, {
      stats: { STR: 24, VIT: 26, DEF: 22, POW: 12, AGI: 8, DEX: 10 },
      artId: "jiuyang", artLevel: 10,
      skillIds: ["sl_truth_staff", "sl_thousand_arms", "sl_rock_punch", "ne1"],
      extraArtSlots: ["jiuyang", "tendon", "diamond"],
      artLevels: { jiuyang: 10, tendon: 10, diamond: 10 },
    }) },

  { id: "elite_phoenix_empress", name: "จักรพรรดินีหงส์เพลิง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 5 }, { itemId: "jade", weight: 4 },
      { itemId: "ancient_coin", weight: 3 }, { itemId: "wood_sacred", weight: 2 },
      { itemId: "mithril_ore", weight: 1 }],
    build: () => build("จักรพรรดินีหงส์เพลิง", 4, {
      stats: { POW: 22, INT: 20, AGI: 18, DEX: 18, VIT: 16, DEF: 14, LUK: 12 },
      artId: "fire", artLevel: 10,
      skillIds: ["sl_petal_finger", "ynss", "qzjf", "yxjf"],
      extraArtSlots: ["fire", "zixia", "scholar"],
      artLevels: { fire: 10, zixia: 10, scholar: 10 },
    }) },

  { id: "elite_demon_emperor", name: "จักรพรรดิมาร", ti: 4, category: "supernatural",
    drops: [...DROPS_T4,
      { itemId: "ginseng", weight: 5 }, { itemId: "jade", weight: 5 },
      { itemId: "ancient_coin", weight: 3 }, { itemId: "wood_sacred", weight: 3 },
      { itemId: "mithril_ore", weight: 2 }],
    build: () => build("จักรพรรดิมาร", 4, {
      stats: { STR: 20, POW: 22, INT: 20, VIT: 22, DEF: 18, DEX: 16, AGI: 16, LUK: 10 },
      artId: "jiuyin", artLevel: 10,
      skillIds: ["dgjj", "ansh", "sl_truth_staff", "sl_thousand_arms", "wd_palm"],
      extraArtSlots: ["jiuyin", "shadow", "heaven"],
      artLevels: { jiuyin: 10, shadow: 10, heaven: 10 },
    }) },

  // ─── พรรคตะวันจันทรา — sect leadership (T1-T4) ─────────────────────
  // Art-focused sect — kits lean heavily on the inner-art rotation.
  // Chief Dongfang carries the full disciple line: qiankun + yxhd +
  // t3_sm_dualfusion + t3_sm_sunmoon arts + mi_firepalm fist (the
  // sect's only move skill).
  { id: "spar_sunmoon_chief_dongfang", name: "เจ้าสำนักต่งฟางปู้ป้าย", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ancient_coin", weight: 5 }, { itemId: "jade", weight: 4 },
      { itemId: "paper", weight: 3 }, { itemId: "ink", weight: 3 },
      { itemId: "wood_sacred", weight: 2 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("เจ้าสำนักต่งฟางปู้ป้าย", 4, {
      stats: { POW: 24, INT: 20, AGI: 16, DEX: 14, VIT: 14, DEF: 8 },
      artId: "qiankun", artLevel: 10,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["qiankun", "yxhd", "t3_sm_dualfusion", "t3_sm_sunmoon"],
      artLevels: { qiankun: 10, yxhd: 10, t3_sm_dualfusion: 10, t3_sm_sunmoon: 10, t3_sm_sunscript: 10 },
      learnedArtIds: ["t3_sm_sunscript"],
    }) },

  { id: "spar_sunmoon_renwoxing", name: "รองเจ้าสำนักเหรินหวัวสิง", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ancient_coin", weight: 4 }, { itemId: "jade", weight: 3 },
      { itemId: "viper_venom", weight: 2 }],
    build: () => build("รองเจ้าสำนักเหรินหวัวสิง", 4, {
      stats: { POW: 22, INT: 16, STR: 10, AGI: 14, VIT: 8 },
      artId: "yxhd", artLevel: 10,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["yxhd", "t3_sm_sunmoon", "t2_sm_sunbody"],
      artLevels: { yxhd: 10, t3_sm_sunmoon: 9, t2_sm_sunbody: 9 },
    }) },

  { id: "spar_sunmoon_zuolengchan", name: "ผู้อาวุโสตะวันจั่วเหลิงฉัน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ancient_coin", weight: 3 }, { itemId: "potion_big", weight: 2 }],
    build: () => build("ผู้อาวุโสตะวันจั่วเหลิงฉัน", 4, {
      stats: { POW: 20, INT: 14, STR: 8, VIT: 10, AGI: 8 },
      artId: "t3_sm_sunmoon", artLevel: 9,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["t3_sm_sunmoon", "t2_sm_sunbody", "t1_sm_sunfire"],
      artLevels: { t3_sm_sunmoon: 9, t2_sm_sunbody: 9, t1_sm_sunfire: 9 },
    }) },

  { id: "spar_sunmoon_xianggwentian", name: "ผู้อาวุโสจันทราเสี่ยงเหวินเทียน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "ancient_coin", weight: 3 }, { itemId: "jade", weight: 2 },
      { itemId: "potion_big", weight: 2 }],
    build: () => build("ผู้อาวุโสจันทราเสี่ยงเหวินเทียน", 4, {
      stats: { POW: 20, INT: 16, AGI: 12, DEX: 10, VIT: 6 },
      artId: "t3_sm_dualfusion", artLevel: 9,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["t3_sm_dualfusion", "t2_sm_moonbody", "t1_sm_moonweave"],
      artLevels: { t3_sm_dualfusion: 9, t2_sm_moonbody: 9, t1_sm_moonweave: 9 },
    }) },

  { id: "spar_sunmoon_qudongfeng", name: "ผู้อาวุโสสมดุลฉวี่ตงเฟิง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "paper", weight: 4 }, { itemId: "ink", weight: 4 },
      { itemId: "ancient_coin", weight: 2 }],
    build: () => build("ผู้อาวุโสสมดุลฉวี่ตงเฟิง", 3, {
      stats: { POW: 14, INT: 14, VIT: 8 },
      artId: "t3_sm_dualfusion", artLevel: 8,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["t3_sm_dualfusion", "t2_sm_sunbody", "t2_sm_moonbody"],
      artLevels: { t3_sm_dualfusion: 8, t2_sm_sunbody: 7, t2_sm_moonbody: 7 },
    }) },

  { id: "spar_sunmoon_yilin", name: "หัวหน้าศิษย์อี้หลิน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "paper", weight: 3 }, { itemId: "ancient_coin", weight: 2 }],
    build: () => build("หัวหน้าศิษย์อี้หลิน", 2, {
      stats: { POW: 9, INT: 7, AGI: 5 },
      artId: "t2_sm_sunbody", artLevel: 6,
      skillIds: ["mi_firepalm"],
      extraArtSlots: ["t2_sm_sunbody"],
      artLevels: { t2_sm_sunbody: 6 },
    }) },

  { id: "spar_sunmoon_lanfenghuang", name: "ศิษย์หลานเฟิงหวง", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "paper", weight: 2 }],
    build: () => build("ศิษย์หลานเฟิงหวง", 2, {
      stats: { POW: 8, INT: 6, STR: 4 },
      artId: "t1_sm_sunfire", artLevel: 5,
      skillIds: ["mi_firepalm"],
    }) },

  { id: "spar_sunmoon_xiaoyu", name: "ศิษย์เสี่ยวอวี้", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์เสี่ยวอวี้", 1, {
      stats: { POW: 5, INT: 4 },
      artId: "t0_sm_dual", artLevel: 4,
      skillIds: ["mi_firepalm"],
    }) },

  // ─── สำนักสุลถัง — sect leadership (T1-T4) ──────────────────────────
  // Tang sect leadership. Hidden weapon + poison kits — high DEX/AGI,
  // multi-hit dart volleys, heavy poison riders. Chief carries the
  // full T4 disciple line.
  { id: "spar_tang_chief_tangmen", name: "เจ้าสำนักถังเหมิน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "viper_venom", weight: 4 }, { itemId: "scorpion_venom", weight: 3 },
      { itemId: "centipede_venom", weight: 3 }, { itemId: "iron_blade", weight: 3 },
      { itemId: "ancient_coin", weight: 4 }, { itemId: "mithril_ore", weight: 1 }],
    build: () => build("เจ้าสำนักถังเหมิน", 4, {
      stats: { DEX: 24, AGI: 18, STR: 12, LUK: 10, VIT: 12, POW: 4 },
      artId: "t4_tang_tenkpoisons", artLevel: 10,
      skillIds: ["tang_heartpierce", "tang_starrain", "tang_meteorpierce", "tang_viperblade", "tang_goldsnake", "tang_starscatter"],
      extraArtSlots: ["t4_tang_tenkpoisons", "t4_tang_skycleaver", "t3_tang_viperpower", "t3_tang_chase"],
      artLevels: { t4_tang_tenkpoisons: 10, t4_tang_skycleaver: 10, t3_tang_viperpower: 10, t3_tang_chase: 10, t2_tang_wavewind: 10 },
      learnedArtIds: ["t2_tang_wavewind"],
    }) },

  { id: "spar_tang_tangshanhu", name: "รองเจ้าสำนักถังซานหู", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "viper_venom", weight: 3 }, { itemId: "iron_blade", weight: 2 },
      { itemId: "ancient_coin", weight: 3 }],
    build: () => build("รองเจ้าสำนักถังซานหู", 4, {
      stats: { DEX: 22, AGI: 16, LUK: 10, STR: 10, VIT: 4 },
      artId: "t4_tang_skycleaver", artLevel: 10,
      skillIds: ["tang_starrain", "tang_meteorpierce", "tang_starscatter", "tang_poison_knife"],
      extraArtSlots: ["t4_tang_skycleaver", "t3_tang_chase"],
      artLevels: { t4_tang_skycleaver: 10, t3_tang_chase: 9 },
    }) },

  { id: "spar_tang_tangzhongtian", name: "ผู้อาวุโสพิษถังจงเทียน", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "viper_venom", weight: 5 }, { itemId: "scorpion_venom", weight: 4 },
      { itemId: "centipede_venom", weight: 3 }, { itemId: "potion_big", weight: 2 }],
    build: () => build("ผู้อาวุโสพิษถังจงเทียน", 4, {
      stats: { DEX: 18, AGI: 12, LUK: 10, VIT: 12, POW: 6 },
      artId: "t4_tang_tenkpoisons", artLevel: 10,
      skillIds: ["tang_viperblade", "tang_meteorpierce", "tang_poison_knife", "tang_goldsnake"],
      extraArtSlots: ["t4_tang_tenkpoisons", "t3_tang_viperpower", "t1_tang_venombody"],
      artLevels: { t4_tang_tenkpoisons: 10, t3_tang_viperpower: 9, t1_tang_venombody: 9 },
    }) },

  { id: "spar_tang_tangshibi", name: "ผู้อาวุโสมีดถังซือปี้", ti: 4, category: "human",
    drops: [...DROPS_T4,
      { itemId: "iron_blade", weight: 4 }, { itemId: "ancient_coin", weight: 2 },
      { itemId: "potion_big", weight: 2 }],
    build: () => build("ผู้อาวุโสมีดถังซือปี้", 4, {
      stats: { STR: 14, DEX: 16, AGI: 10, LUK: 6 },
      artId: "t4_tang_skycleaver", artLevel: 9,
      skillIds: ["tang_heartpierce", "tang_viperblade", "tang_goldsnake"],
      extraArtSlots: ["t4_tang_skycleaver", "t3_tang_viperpower"],
      artLevels: { t4_tang_skycleaver: 9, t3_tang_viperpower: 9 },
    }) },

  { id: "spar_tang_tangrong", name: "ผู้อาวุโสไล่ล่าถังหรง", ti: 3, category: "human",
    drops: [...DROPS_T3,
      { itemId: "ancient_coin", weight: 3 }, { itemId: "viper_venom", weight: 2 }],
    build: () => build("ผู้อาวุโสไล่ล่าถังหรง", 3, {
      stats: { AGI: 16, DEX: 12, STR: 6, LUK: 4 },
      artId: "t3_tang_chase", artLevel: 8,
      skillIds: ["tang_meteorpierce", "tang_starscatter", "tang_poison_knife"],
      extraArtSlots: ["t3_tang_chase", "t2_tang_wavewind"],
      artLevels: { t3_tang_chase: 8, t2_tang_wavewind: 7 },
    }) },

  { id: "spar_tang_tanglin", name: "หัวหน้าศิษย์ถังหลิน", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "viper_venom", weight: 3 }, { itemId: "ancient_coin", weight: 2 }],
    build: () => build("หัวหน้าศิษย์ถังหลิน", 2, {
      stats: { DEX: 10, AGI: 7, STR: 5 },
      artId: "t2_tang_wavewind", artLevel: 6,
      skillIds: ["tang_starscatter", "tang_poison_knife", "tang_basic_knife"],
      extraArtSlots: ["t2_tang_wavewind"],
      artLevels: { t2_tang_wavewind: 6 },
    }) },

  { id: "spar_tang_tangtao", name: "ศิษย์ถังเทา", ti: 2, category: "human",
    drops: [...DROPS_T2,
      { itemId: "viper_venom", weight: 2 }],
    build: () => build("ศิษย์ถังเทา", 2, {
      stats: { DEX: 9, AGI: 7, LUK: 4 },
      artId: "t1_tang_venombody", artLevel: 5,
      skillIds: ["tang_poison_knife", "tang_basic_knife"],
    }) },

  { id: "spar_tang_tangxiu", name: "ศิษย์ถังซิ่ว", ti: 1, category: "human",
    drops: [...DROPS_T1],
    build: () => build("ศิษย์ถังซิ่ว", 1, {
      stats: { DEX: 6, AGI: 4 },
      artId: "t0_tang_sharp", artLevel: 4,
      skillIds: ["tang_basic_knife"],
    }) },
];

export const OPPONENTS_BY_ID = new Map<string, OpponentDef>(
  OPPONENTS.map((o) => [o.id, o]),
);

export function getOpponent(id: string | null | undefined): OpponentDef | null {
  if (!id) return null;
  return OPPONENTS_BY_ID.get(id) ?? null;
}
