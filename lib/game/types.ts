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
  ti: SkillTierIndex;
  w: string; // weapon family (mastery key)
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
  stats: PartialStats;
  hL: number;
  mL: number;
  act: ArtActive | null;
  pas: ArtPassive | null;
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

export interface CharacterBuild {
  name: string;
  stats: StatBlock;
  artId: string; // 'none' = no internal energy
  artLevel: number; // 1..10
  skillIds: (string | null)[]; // 5 slots
  equipment: EquipLoadout;
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
}
