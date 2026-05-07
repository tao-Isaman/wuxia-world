// Core type system for the wuxia battle sim.
// Discriminated unions on the `t` field mirror the original demo.html shape
// so data tables stay readable and dispatchers can use exhaustive switch.

export type Side = "A" | "B";

export const STAT_KEYS = [
  "STR",
  "AGI",
  "POW",
  "VIT",
  "DEX",
  "LUK",
  "DEF",
  "INT",
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export type StatBlock = Record<StatKey, number>;
export type PartialStats = Partial<StatBlock>;

export interface Derived {
  HP: number;
  MP: number;
  Atk: number;
  PA: number;
  IA: number;
  PD: number;
  ID: number;
  Eva: number;
  Acc: number;
  Cri: number;
  Res: number;
  Spd: number;
}

export type AttackType = "phy" | "int" | null;

export type SkillTierIndex = 0 | 1 | 2 | 3 | 4;

// ─── Weapon mastery families ──────────────────────────────────────────
// Each skill belongs to exactly one family. Mastery is summed per family
// (cap 200) and contributes ×(1 + mastery/200 * 0.5) damage at battle time.
//
//   fist   — กำปั้น, นิ้ว, ฝ่ามือ, ตัวเบา (qinggong / body arts)
//   long   — ทวน, หอก, ไม้พลอง, กระบอง
//   sword  — กระบี่ (jian — straight sword)
//   blade  — ดาบ, ดาบโค้ง, ดาบยาว
//   short  — มีด, พัด
//   hidden — เข็ม, มีดบิน, โซ่, ตะขอ, แส้, อาวุธลับอื่น ๆ
//   music  — ขลุ่ย, พิณ
export const WEAPON_FAMILY_KEYS = [
  "fist",
  "long",
  "sword",
  "blade",
  "short",
  "hidden",
  "music",
] as const;
export type WeaponFamily = (typeof WEAPON_FAMILY_KEYS)[number];

// ─── Skill / art philosophical types ──────────────────────────────────
// Three independent axes a skill or art can sit on. A skill may have one
// tag per axis (or none). The `balance` tag is informational — it never
// contributes to conflict counts, just like an absent tag wouldn't.
//
//   yin / yang        — passive vs aggressive philosophy
//   hard / soft       — bone-shattering vs flowing redirection
//   internal / external — qi-driven vs body-conditioned
//   balance           — neutral on whichever axis it's listed on
//
// See lib/world/skill-conflict.ts for how counts and the > 60 % threshold
// drive the half/zero base-status modifiers.
export const SKILL_TYPE_KEYS = [
  "yin",
  "yang",
  "balance",
  "hard",
  "soft",
  "internal",
  "external",
] as const;
export type SkillType = (typeof SKILL_TYPE_KEYS)[number];

export const SKILL_TYPE_LABEL: Record<SkillType, string> = {
  yin: "หยิน",
  yang: "หยาง",
  balance: "สมดุล",
  hard: "แข็ง",
  soft: "อ่อน",
  internal: "ภายใน",
  external: "ภายนอก",
};

export interface Tier {
  n: string;
  cd: number;
  c: string; // CSS class for badge color
}

// ─── Effects ───────────────────────────────────────────────────────────
// `se` = self-effect (caster), `ee` = enemy-effect (target).
// Each variant matches a branch in the effect dispatchers.

export type SelfEffect =
  | { t: "buff_reflect"; v: number; u: number }
  | { t: "buff_eva"; v: number; u: number }
  | { t: "buff_reduce"; v: number; u: number }
  | { t: "buff_def"; v: number; u: number }
  // Speed buff — adds `v` to the side's effective Spd for `u` turns. Read
  // by tickGauges / getNextTurn so the ATB gauge fills faster while the
  // buff is active.
  | { t: "buff_spd"; v: number; u: number }
  | { t: "heal_pct"; v: number }
  | {
      t: "heal_buff";
      hp: number;
      bt: "buff_def" | "buff_eva" | "buff_reduce";
      bv: number;
      bu: number;
    }
  | { t: "stack_atk"; v: number; mx: number }
  | { t: "buff_iatk_reduce"; iv: number; rv: number; u: number }
  | { t: "buff_reflect_eva"; rv: number; ev: number; u: number };

export type EnemyEffect =
  | { t: "debuff_eva"; v: number; u: number }
  | { t: "debuff_acc"; v: number; u: number }
  | { t: "debuff_def"; v: number; u: number }
  | { t: "debuff_poison"; pp: number; u: number; ev: number }
  | { t: "multi_debuff"; av: number; ev: number; u: number }
  | { t: "heavy_poison"; pp: number; u: number; av: number; ev: number }
  | { t: "drain_mp"; v: number }
  | { t: "dispel"; acc: number; u: number };

// ─── Skill definition (SP table) ───────────────────────────────────────

export interface Skill {
  id: string;
  n: string;
  // Sect / school of origin. Use the canonical name from
  // lib/game/data/sects.ts; default to JIANGHU_SECT ("ยุทธจักร") when the
  // skill isn't tied to a specific sect. Drives data-file ordering and
  // future "learn from sect master" content.
  sc: string;
  ti: SkillTierIndex;
  w: WeaponFamily; // weapon family (mastery key) — see WEAPON_FAMILY_KEYS
  mg: number; // mastery gained per equip
  st: PartialStats;
  at: AttackType;
  bp: number;
  p: number; // % boost on bp
  f: number; // flat add
  dm: number; // damage multiplier
  dr?: number; // life-drain % of damage dealt
  se: SelfEffect | null;
  ee: EnemyEffect | null;
  d: string; // description
  // Philosophical type tags. A skill may have zero, one, or several tags
  // (one per axis). Used by the conflict system in lib/world/skill-conflict.ts.
  types?: readonly SkillType[];
}

// ─── Internal energy art (ARTS table) ──────────────────────────────────

export type ArtPassiveTrigger = "hit_recv" | "on_crit" | "use_int" | "use_act";

export type ArtPassiveEffect =
  | { t: "buff_def"; n?: string; v: number; u: number }
  | { t: "buff_eva"; n?: string; v: number; u: number }
  | { t: "heal_pct"; v: number }
  | { t: "debuff_acc"; n?: string; v: number; u: number }
  | { t: "debuff_eva"; n?: string; v: number; u: number }
  | { t: "debuff_def"; n?: string; v: number; u: number }
  | { t: "stack_atk"; v: number; mx: number }
  | { t: "mult_iatk" }
  | { t: "mult_atk" };

export interface ArtPassive {
  tr: ArtPassiveTrigger;
  ch: number; // chance %
  d: string;
  e: ArtPassiveEffect;
}

export type ArtActiveType =
  | "heal"
  | "heal_cleanse"
  | "atk_phy_pen"
  | "atk_int_pen"
  | "buff_reflect"
  | "buff_reduce"
  | "drain"
  | "drain_phy"
  | "drain_acc"
  | "debuff_acc_dmg"
  | "debuff_poison"
  | "buff_eva_debuff_eva";

export interface ArtActive {
  n: string;
  c: number; // MP cost
  cd: number; // cooldown turns
  t: ArtActiveType;
  d: string;
  // per-type optional fields — kept loose because shape varies by type
  h?: number;
  v?: number;
  u?: number;
  m?: number;
  pen?: number;
  pp?: number;
  ev?: number;
  ad?: number;
  dm?: number;
  selfV?: number;
  eneV?: number;
  adv?: number;
}

export interface Art {
  id: string;
  n: string;
  sc: string;
  tp: string;
  // Tier (พื้นฐาน → เฉพาะ, 0..4) — same axis as Skill. Drives the rough
  // power budget: tier 0 inner skills give ~30 HP+MP/level and 10 stats,
  // climbing to tier 4 = ~70 HP+MP/level and ~50 stats.
  ti: SkillTierIndex;
  stats: PartialStats;
  hL: number;
  mL: number;
  act: ArtActive | null;
  pas: ArtPassive | null;
  // Philosophical type tags. See SKILL_TYPE_KEYS above. When omitted, the
  // engine derives them from the human-readable `tp` string at load time.
  types?: readonly SkillType[];
}

// ─── Equipment (EQUIP table) ───────────────────────────────────────────

export type EquipSlotType = "W" | "A" | "H" | "B" | "BR" | "R" | "C";

export type EquipEffect =
  | { t: "pct_atk"; v: number }
  | { t: "flat_cri"; v: number }
  | { t: "flat_eva"; v: number }
  | { t: "pct_reduce"; v: number }
  | { t: "hp_regen"; v: number }
  | { t: "on_hit"; db: { t: "debuff_eva" | "debuff_acc" | "debuff_def"; v: number; u: number } };

export interface Equipment {
  id: string;
  n: string;
  ty: EquipSlotType;
  atkb: number;
  pdb: number;
  idb: number;
  hpb: number;
  mpb: number;
  st: PartialStats;
  eff: EquipEffect | null;
  // Marks the W-slot item as a musical instrument. The world's music
  // life-skill requires an instrument equipped to grant practice xp.
  instrument?: boolean;
}

// ─── Per-character build state ─────────────────────────────────────────

export interface EquipLoadout {
  W: string | null;
  A: string | null;
  H: string | null;
  B: string | null;
  BR: [string | null, string | null];
  R: [string | null, string | null];
  C: [string | null, string | null];
}

export const SKILL_SLOT_COUNT = 10;

export interface CharacterBuild {
  name: string;
  stats: StatBlock;
  // Currently active inner art. Treated as the 11th "slot" for conflict-
  // counting purposes. Future engine work may unify this into `skillIds`.
  artId: string; // 'none' = no internal energy
  artLevel: number; // 1..10
  // Active move-skill slots. Currently 10 — empty slots are null.
  skillIds: (string | null)[];
  equipment: EquipLoadout;
  // Per-skill level (1..10). Missing entries default to 1. Level scales the
  // skill's base power and the mastery it grants — see lib/game/leveling.ts.
  skillIds_legacy?: never; // sentinel — reserved against accidental rename
  skillLevels?: Record<string, number>;
  // All move skills the player has ever learned (slotted or not). Each
  // contributes its `st` (stat bonus) to combinedStats, so learning more
  // skills passively grows the character. Unlimited.
  learnedSkillIds?: readonly string[];
  // All inner arts the player has learned. Each contributes its scaled
  // stats and HP/MP gains — same shape as the active art, but without the
  // active/passive battle effects (only the stat side).
  learnedArtIds?: readonly string[];
  // Per-art level (1..10). Mirrors `skillLevels`. Missing entries default
  // to the build's `artLevel` for the active art, or 1 for everything else.
  artLevels?: Record<string, number>;
}

// ─── Live battle state ─────────────────────────────────────────────────

export interface BuffRecord {
  t: SelfEffect["t"] | "buff_iatk"; // including derived buff_iatk
  n?: string;
  v: number;
  u: number;
}

export interface DebuffRecord {
  t:
    | "debuff_acc"
    | "debuff_eva"
    | "debuff_def"
    | "debuff_poison";
  n?: string;
  v?: number;
  pp?: number;
  u: number;
}

export interface SideBattleState {
  buffs: BuffRecord[];
  debuffs: DebuffRecord[];
  stk: number; // stack_atk count
}

export interface LogLine {
  cls: "lA" | "lB" | "lS" | "lC";
  txt: string;
}

// "filling" — gauges are animating, no one ready yet
// "player"  — A's gauge hit 100, waiting for click
// "enemy"   — B's gauge hit 100, AI is acting (transient)
// "over"    — battle ended
export type BattlePhase = "start" | "filling" | "player" | "enemy" | "resolving" | "over";

export interface BattleState {
  dA: Derived; // derived snapshot at battle start
  dB: Derived;
  hA: number;
  hB: number;
  mpA: number;
  mpB: number;
  gA: number; // ATB gauges
  gB: number;
  turn: number;
  log: LogLine[];
  winner: Side | null;
  phase: BattlePhase;
  st: { A: SideBattleState; B: SideBattleState };
  cd: { A: number[]; B: number[] }; // skill cooldowns
  iaCD: { A: number; B: number }; // internal-art active CD
  // Per-side count of how many times each skill id was used this battle.
  // Read by the world store on battle end to grant per-skill exp.
  skillUses: { A: Record<string, number>; B: Record<string, number> };
  // Per-side count of how many times each art id's active was fired this
  // battle. Read by the world store on battle end to grant per-art exp
  // (the inner-skill leveling track, parallel to skillExp).
  artUses: { A: Record<string, number>; B: Record<string, number> };
  // Per-side count of incoming hits landed (hitsReceived.A = times A was
  // hit by B's attacks, regardless of damage). Used to grant DEF stat xp
  // on battle end. Reflect damage does not count.
  hitsReceived: { A: number; B: number };
}
