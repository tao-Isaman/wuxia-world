// ชีพจร — meridian charts (the contract shared by the engine, the content
// table lib/game/data/meridians.ts and the UI). Pure types and constants.
//
//   • Levelling any move skill or inner art earns meridian points (แต้มชีพจร).
//   • A chart (แผนภาพชีพจร-<name>) is learned from its item; the item can be
//     read only once the hero has learned the chart's required skills / arts.
//   • A chart has 1–12 points (จุดชีพจร) by tier, opened in order; each point
//     has 3 ranks, each rank costs meridian points and adds its bonus.
//   • Bonuses: base stats (STR…) and / or combat stats and effects — the same
//     fields equipment adds (atk, pd, hp, cri, pct_atk, pct_red, hp_regen…).

import type { PartialStats } from "./types";

export type MeridianTier = 0 | 1 | 2 | 3 | 4 | 5;

/** What a chart grows (drives its colour and the silhouette's pose in the UI). */
export type MeridianKind =
  | "base"     // ค่าสถานะพื้นฐาน — STR, AGI, POW, VIT, DEX, LUK, DEF, INT
  | "combat"   // ค่าสถานะการต่อสู้ — atk, pd, id_, hp, mp, pa, ia, spd, acc, res, cri, eva
  | "ability"  // ความสามารถ — pct_atk, pct_red, hp_regen (always-on effects)
  | "buff";    // บัฟพิเศษ — a mix, with a big effect at the last point

/** Combat bonuses: the same keys as the equipment bonus (lib/game/derive.ts EquipBonus). */
export interface MeridianCombat {
  atk: number; pd: number; id_: number; hp: number; mp: number;
  pa: number; ia: number; spd: number; acc: number; res: number;
  cri: number; eva: number;
  /** % attack. */
  pct_atk: number;
  /** % damage taken reduction. */
  pct_red: number;
  /** % HP regained per turn. */
  hp_regen: number;
}

export const MERIDIAN_COMBAT_KEYS: readonly (keyof MeridianCombat)[] = [
  "atk", "pd", "id_", "hp", "mp", "pa", "ia", "spd", "acc", "res", "cri", "eva", "pct_atk", "pct_red", "hp_regen",
];

/** Where a point sits on the body; the UI maps each to a spot on the pose's silhouette. */
export type MeridianBodyPoint =
  | "crown" | "brow" | "throat" | "nape"
  | "l_shoulder" | "r_shoulder" | "chest" | "heart" | "upper_back"
  | "l_elbow" | "r_elbow" | "l_wrist" | "r_wrist" | "l_palm" | "r_palm"
  | "solar" | "navel" | "dantian" | "lower_back" | "tailbone"
  | "l_hip" | "r_hip" | "l_knee" | "r_knee" | "l_ankle" | "r_ankle" | "l_sole" | "r_sole";

export const MERIDIAN_BODY_POINTS: readonly MeridianBodyPoint[] = [
  "crown", "brow", "throat", "nape",
  "l_shoulder", "r_shoulder", "chest", "heart", "upper_back",
  "l_elbow", "r_elbow", "l_wrist", "r_wrist", "l_palm", "r_palm",
  "solar", "navel", "dantian", "lower_back", "tailbone",
  "l_hip", "r_hip", "l_knee", "r_knee", "l_ankle", "r_ankle", "l_sole", "r_sole",
];

/** What one rank of a point adds (cumulative: rank 2 adds rank 1's and rank 2's). */
export interface MeridianRank {
  stats?: PartialStats;
  combat?: Partial<MeridianCombat>;
}

export interface MeridianNode {
  /** Snake case, unique within the chart. */
  id: string;
  /** Thai point name (จุด…). Names may repeat across charts. */
  name: string;
  at: MeridianBodyPoint;
  /** Exactly three ranks. */
  ranks: readonly [MeridianRank, MeridianRank, MeridianRank];
  /**
   * Battle effects that switch on only when this point is filled (rank 3).
   * A chart may carry several, on one point or spread over its points.
   */
  effects?: readonly MeridianEffect[];
}

// ─── Battle effects of filled points ───────────────────────────────────

/** The five elemental rages a hit can wake (stack; each stack its own timer). */
export type MeridianElement =
  | "fire"     // เพลิงพิโรธ — attack +v %
  | "water"    // วารีพิสุทธิ์ — regain v % of max HP at the start of each own turn
  | "wind"     // วายุภักษ์ — battle speed (gauge fill) +v %
  | "earth"    // ปัฐพีแกร่ง — physical and internal defence +v %
  | "thunder"; // อัสนีคลัง — critical chance +v (percentage points)

export const MERIDIAN_ELEMENT_LABEL: Readonly<Record<MeridianElement, string>> = {
  fire: "เพลิงพิโรธ", water: "วารีพิสุทธิ์", wind: "วายุภักษ์", earth: "ปัฐพีแกร่ง", thunder: "อัสนีคลัง",
};

/** A combat status a battle-start effect raises, by v % for its turns. */
export type MeridianOpeningStat = "atk" | "def" | "spd" | "cri" | "eva" | "acc" | "reduce";

/** A stat an attack can lower on its target, by v % for its turns. */
export type MeridianDebuffStat = "atk" | "def" | "spd" | "eva" | "acc";

export type MeridianEffect =
  /** Entering battle: `stat` +v % for the hero's first `turns` turns (5). */
  | { t: "opening"; stat: MeridianOpeningStat; v: number; turns: number }
  /** Once per battle: on falling, rise again with `hpPct` % of max HP. */
  | { t: "revive"; hpPct: number }
  /** When hit: `chance` % to gain an elemental rage (v, `turns` 3–5 turns), stacking up to `maxStacks`. */
  | { t: "rage"; element: MeridianElement; v: number; turns: number; chance: number; maxStacks: number }
  /** Entering battle: a shield worth `pct` % of max HP that soaks damage first. */
  | { t: "shield"; pct: number }
  /** Entering battle: ward off the next `count` debuffs. */
  | { t: "ward"; count: number }
  /** When the hero's attack lands: `chance` % to lower the target's `stat` by v % for `turns` turns. */
  | { t: "sap"; stat: MeridianDebuffStat; v: number; turns: number; chance: number };

export interface MeridianChart {
  /** Snake case, unique. Its item is `chart_<id>`. */
  id: string;
  /** Thai chart name, unique (the item reads "แผนภาพชีพจร-<name>"). */
  name: string;
  ti: MeridianTier;
  kind: MeridianKind;
  /** One or two Thai sentences: what this meridian is. */
  description: string;
  /**
   * Readable only when the hero has learned ALL of these (any tier; a T4 chart
   * may ask for T0–T3 moves). At least one skill or art.
   */
  requires: { skills?: readonly string[]; arts?: readonly string[] };
  /** Opened in order: node i needs node i−1 at rank ≥ 1. */
  nodes: readonly MeridianNode[];
}

/** Points per chart by tier (min, max). T5 is always 12. */
export const MERIDIAN_NODES_BY_TIER: Readonly<Record<MeridianTier, readonly [number, number]>> = {
  0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [7, 8], 4: [9, 10], 5: [12, 12],
};

/** Charts per tier (the content table must match). */
export const MERIDIAN_CHARTS_PER_TIER: Readonly<Record<MeridianTier, number>> = {
  0: 20, 1: 20, 2: 15, 3: 15, 4: 15, 5: 10,
};

/** Meridian points to raise a point of a tier-`ti` chart from rank r−1 to rank r (r = 1..3). */
export function meridianRankCost(ti: MeridianTier, rank: 1 | 2 | 3): number {
  return (ti + 1) * rank;
}

/** Item id of a chart's แผนภาพ. */
export const meridianChartItemId = (chartId: string) => `chart_${chartId}`;

/**
 * A build's charts: chart id → rank of each node (0–3). A learned chart with
 * nothing opened is all zeros. Stored on CharacterBuild.meridians.
 */
export type MeridianState = Readonly<Record<string, readonly number[]>>;
