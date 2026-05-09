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
  | { t: "debuff_atk"; v: number; u: number }
  | { t: "debuff_poison"; pp: number; u: number; ev: number }
  | { t: "multi_debuff"; av: number; ev: number; u: number }
  // Combo: PDef + Eva debuff in one effect (mirrors multi_debuff but on
  // a different axis). Used by chain / sweep weapons that erode both
  // armor AND footwork. `dv` = PDef value (negative), `ev` = Eva value.
  | { t: "debuff_def_eva"; dv: number; ev: number; u: number }
  | { t: "heavy_poison"; pp: number; u: number; av: number; ev: number }
  | { t: "drain_mp"; v: number }
  | { t: "dispel"; acc: number; u: number }
  // เผาไหม้ — DoT ทั้ง HP และ MP. `dmg` = % ของ max HP ต่อเทิร์น,
  // `mp` = % ของ max MP ต่อเทิร์น. ใช้ใน tickEffects ตามจำนวน u.
  | { t: "burn_hp_mp"; dmg: number; mp: number; u: number }
  // สตัน — บล็อก action เป้าหมายเป็นเวลา u เทิร์น โดยมีโอกาส ch%
  // ที่ทำให้ติดสถานะตอนใช้สกิล. ตรวจที่ต้นรอบของ resolveSkill /
  // resolveArtActive เพื่อข้ามตา.
  | { t: "stun"; u: number; ch: number };

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
  // VIT-scaled flat damage rider. When set, the skill's flat damage gains
  // `vitScale × caster.VIT` (combined stats) — designed for vit-bruiser
  // signature moves (อรหันต์พันกร). Read by `calcSkillDamage`.
  vitScale?: number;
  // Multi-hit count. When > 1, the skill resolves `hits` damage rolls in
  // a single turn — each rolled independently (so crits stack, misses
  // happen, and reflect / hit_recv passives fire per-hit). Each hit deals
  // `1/hits × normal_damage` rounded so the total approximates a single-
  // hit damage. Authors who want a multi-hit that totals MORE than a
  // single hit should also bump `dm` or `bp` to compensate.
  // Default 1 (single hit) when omitted.
  hits?: number;
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
  // Direct combat-stat boosts. Equipment now contributes ONLY through
  // these fields — the legacy `st` (base-stat boost) field is kept
  // type-compatibly but ignored by combinedStats / deriveAll. This
  // prevents tank stat-stacking from cascading through every derived
  // formula (PD 415 wall problem).
  atkb: number;          // ATK
  pdb: number;           // PD (physical defense)
  idb: number;           // ID (internal defense)
  hpb: number;           // HP
  mpb: number;           // MP
  pab?: number;          // PA (physical attack)
  iab?: number;          // IA (internal attack)
  spdb?: number;         // SPD (ATB gauge speed)
  evab?: number;         // Eva
  accb?: number;         // Acc
  crib?: number;         // Cri
  resb?: number;         // Res
  // Legacy base-stat boost — kept for back-compat (older saves /
  // serialised data) but UNUSED by the engine. Authors should leave
  // empty `{}` and use the direct boost fields above.
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
    | "debuff_atk"
    | "debuff_poison"
    | "burn_hp_mp"
    | "stun";
  n?: string;
  v?: number;
  pp?: number;
  // burn_hp_mp uses `pp` (HP %) + `mpp` (MP %) per tick.
  mpp?: number;
  u: number;
}

export interface SideBattleState {
  buffs: BuffRecord[];
  debuffs: DebuffRecord[];
  // stack_atk: counter + value-per-stack. The damage formula uses
  // `stk × stkV / 100` as the ATK% boost, so different skills can grant
  // different per-stack amounts (e.g., huashan +5%, lmsj +10%, ng7 +10%).
  // Multiple sources overwrite stkV with the latest applied value —
  // mixing two skills' stacks isn't a designed scenario.
  stk: number;
  stkV: number;
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
  // Latest cast event — UI overlay reads this and renders a staggered
  // animation: skill name first (0.3s, large text), then each hit's
  // damage popping in turn (0.1s stagger). `seq` increments every time
  // a skill / art active fires so React can detect changes even when the
  // same skill is cast twice in a row. Cleared when a battle starts;
  // never persisted.
  lastCast?: {
    seq: number;
    side: Side;
    name: string;
    hits: number;        // total hits resolved (≥ 1)
    // Skill / art tier (0..4) — drives the rarity-tinted name color in
    // the cast animation overlay (T0 white → T4 orange).
    tier: SkillTierIndex;
    // Per-hit results — `length === hits`. Each hit independently rolled
    // hit/crit/miss in resolveSkill. Buff / no-attack skills emit a
    // single placeholder hit (damage 0, miss false) so the UI still
    // announces the cast name.
    hitDamages: number[];
    hitCrits: boolean[];
    hitMisses: boolean[];
  };
  // Wall-clock timestamp (Date.now()) at which the most-recent cast
  // animation finishes playing. While Date.now() < this value, the ATB
  // tick + enemy-AI scheduler PAUSE so the player has time to read the
  // animation before the next turn fires. Cleared/expired naturally —
  // tick logic just compares against Date.now().
  castEndsAt?: number;
}
