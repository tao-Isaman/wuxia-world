// ชีพจร — the meridian engine. Pure: chart lookup, node order / cost, and the
// bonuses a build's opened points give. The content lives in
// data/meridians.ts, the contract in meridian-types.ts.
//
//   • A learned chart is a key of `build.meridians` holding one rank (0–3)
//     per node; node i opens only once node i−1 has rank ≥ 1.
//   • Rank r of a node costs meridianRankCost(chart.ti, r) meridian points.
//   • A node at rank r gives ranks[0..r−1] added together (cumulative).
//   • Base stats join combinedStats / statBreakdown (`fromMeridians`);
//     combat fields join deriveAll and the battle's per-side bonus
//     (`getBuildBonus` in derive.ts).

import type { CharacterBuild, PartialStats } from "./types";
import { STAT_KEYS } from "./types";
import { MERIDIAN_CHARTS } from "./data/meridians";
import {
  MERIDIAN_COMBAT_KEYS,
  meridianRankCost,
  type MeridianChart,
  type MeridianCombat,
  type MeridianEffect,
  type MeridianKind,
  type MeridianNode,
} from "./meridian-types";

export const MERIDIAN_RANK_MAX = 3;

/** Thai label of a chart's kind. */
export const MERIDIAN_KIND_LABEL: Readonly<Record<MeridianKind, string>> = {
  base: "ค่าสถานะพื้นฐาน",
  combat: "ค่าสถานะการต่อสู้",
  ability: "ความสามารถ",
  buff: "บัฟพิเศษ",
};

const CHARTS_BY_ID = new Map<string, MeridianChart>(MERIDIAN_CHARTS.map((c) => [c.id, c]));

export function getMeridianChart(id: string | null | undefined): MeridianChart | undefined {
  if (!id) return undefined;
  return CHARTS_BY_ID.get(id);
}

export function emptyMeridianCombat(): MeridianCombat {
  return {
    atk: 0, pd: 0, id_: 0, hp: 0, mp: 0,
    pa: 0, ia: 0, spd: 0, acc: 0, res: 0,
    cri: 0, eva: 0, pct_atk: 0, pct_red: 0, hp_regen: 0,
  };
}

export interface MeridianBonus {
  stats: PartialStats;
  combat: MeridianCombat;
}

function addInto(out: MeridianBonus, src: { stats?: PartialStats; combat?: Partial<MeridianCombat> }): void {
  if (src.stats) {
    for (const k of STAT_KEYS) {
      const v = src.stats[k];
      if (v) out.stats[k] = (out.stats[k] ?? 0) + v;
    }
  }
  if (src.combat) {
    for (const k of MERIDIAN_COMBAT_KEYS) {
      const v = src.combat[k];
      if (v) out.combat[k] += v;
    }
  }
}

/** Clamp a stored rank into 0..3 (non-numbers → 0). */
export function clampMeridianRank(rank: unknown): number {
  if (typeof rank !== "number" || !Number.isFinite(rank)) return 0;
  return Math.max(0, Math.min(MERIDIAN_RANK_MAX, Math.floor(rank)));
}

/** What a node gives at `rank` (ranks 1..rank added together). */
export function meridianRankBonus(node: MeridianNode, rank: number): MeridianBonus {
  const out: MeridianBonus = { stats: {}, combat: emptyMeridianCombat() };
  const r = clampMeridianRank(rank);
  for (let i = 0; i < r; i++) addInto(out, node.ranks[i] ?? {});
  return out;
}

/** What a chart gives with these node ranks. */
export function meridianChartBonus(chart: MeridianChart, ranks: readonly number[]): MeridianBonus {
  const out: MeridianBonus = { stats: {}, combat: emptyMeridianCombat() };
  chart.nodes.forEach((node, i) => {
    const r = clampMeridianRank(ranks[i]);
    for (let k = 0; k < r; k++) addInto(out, node.ranks[k] ?? {});
  });
  return out;
}

/**
 * Everything a build's learned charts give. `lookup` defaults to the content
 * table (tests pass their own charts).
 */
export function meridianBuildBonus(
  build: Pick<CharacterBuild, "meridians">,
  lookup: (id: string) => MeridianChart | undefined = getMeridianChart,
): MeridianBonus {
  const out: MeridianBonus = { stats: {}, combat: emptyMeridianCombat() };
  for (const [id, ranks] of Object.entries(build.meridians ?? {})) {
    const chart = lookup(id);
    if (!chart || !Array.isArray(ranks)) continue;
    addInto(out, meridianChartBonus(chart, ranks));
  }
  return out;
}

/**
 * The battle effects a build's filled points switch on: every rank-3 node of
 * every learned chart. Foes without `meridians` get none.
 */
export function meridianActiveEffects(
  build: Pick<CharacterBuild, "meridians">,
  lookup: (id: string) => MeridianChart | undefined = getMeridianChart,
): MeridianEffect[] {
  const out: MeridianEffect[] = [];
  for (const [id, ranks] of Object.entries(build.meridians ?? {})) {
    const chart = lookup(id);
    if (!chart || !Array.isArray(ranks)) continue;
    chart.nodes.forEach((node, i) => {
      if (node.effects?.length && clampMeridianRank(ranks[i]) >= MERIDIAN_RANK_MAX) out.push(...node.effects);
    });
  }
  return out;
}

export type MeridianNodeState = "locked" | "open" | "max";

/** Node i is locked until node i−1 has rank ≥ 1; "max" at rank 3. */
export function meridianNodeState(chart: MeridianChart, ranks: readonly number[], i: number): MeridianNodeState {
  if (i < 0 || i >= chart.nodes.length) return "locked";
  if (clampMeridianRank(ranks[i]) >= MERIDIAN_RANK_MAX) return "max";
  if (i > 0 && clampMeridianRank(ranks[i - 1]) < 1) return "locked";
  return "open";
}

/** Points to raise node i one rank, or null when it is at rank 3 (or no such node). */
export function meridianNextCost(chart: MeridianChart, ranks: readonly number[], i: number): number | null {
  if (i < 0 || i >= chart.nodes.length) return null;
  const r = clampMeridianRank(ranks[i]);
  if (r >= MERIDIAN_RANK_MAX) return null;
  return meridianRankCost(chart.ti, (r + 1) as 1 | 2 | 3);
}

/** Points a chart takes to open every node to rank 3. */
export function meridianChartFullCost(chart: MeridianChart): number {
  return chart.nodes.length * (meridianRankCost(chart.ti, 1) + meridianRankCost(chart.ti, 2) + meridianRankCost(chart.ti, 3));
}

/** Points already spent on a chart. */
export function meridianChartSpent(chart: MeridianChart, ranks: readonly number[]): number {
  let total = 0;
  chart.nodes.forEach((_, i) => {
    const r = clampMeridianRank(ranks[i]);
    for (let k = 1; k <= r; k++) total += meridianRankCost(chart.ti, k as 1 | 2 | 3);
  });
  return total;
}

/** A chart's ranks as stored, padded / trimmed to its node count and clamped. */
export function normalizeMeridianRanks(chart: MeridianChart, ranks: readonly unknown[] | null | undefined): number[] {
  const src = Array.isArray(ranks) ? ranks : [];
  return chart.nodes.map((_, i) => clampMeridianRank(src[i]));
}

/** The required skills / arts the build has not learned yet (empty = readable). */
export function missingMeridianRequirements(
  chart: MeridianChart,
  build: Pick<CharacterBuild, "learnedSkillIds" | "learnedArtIds"> | null | undefined,
): { skills: string[]; arts: string[] } {
  const skills = new Set(build?.learnedSkillIds ?? []);
  const arts = new Set(build?.learnedArtIds ?? []);
  return {
    skills: (chart.requires.skills ?? []).filter((id) => !skills.has(id)),
    arts: (chart.requires.arts ?? []).filter((id) => !arts.has(id)),
  };
}

export type OpenMeridianCheck =
  | { ok: true; rank: number; cost: number }
  | { ok: false; reason: string };

/**
 * Can node `index` of a learned chart go up one rank with `points`? Returns
 * the new rank and its cost, or a Thai reason. Pure — the store spends.
 */
export function checkOpenMeridianNode(
  chart: MeridianChart,
  ranks: readonly number[] | undefined,
  index: number,
  points: number,
): OpenMeridianCheck {
  if (!ranks) return { ok: false, reason: "ยังไม่ได้เรียนแผนภาพชีพจรนี้" };
  if (!Number.isInteger(index) || index < 0 || index >= chart.nodes.length) {
    return { ok: false, reason: "ไม่มีจุดชีพจรนี้" };
  }
  const state = meridianNodeState(chart, ranks, index);
  if (state === "max") return { ok: false, reason: "จุดชีพจรนี้เปิดถึงขั้นสูงสุดแล้ว" };
  if (state === "locked") {
    const prev = chart.nodes[index - 1];
    return { ok: false, reason: `ต้องเปิดจุด${prev ? stripJud(prev.name) : "ก่อนหน้า"}ก่อน` };
  }
  const cost = meridianNextCost(chart, ranks, index)!;
  if (points < cost) return { ok: false, reason: `แต้มชีพจรไม่พอ · ต้องใช้ ${cost} (มี ${Math.max(0, Math.floor(points))})` };
  return { ok: true, rank: clampMeridianRank(ranks[index]) + 1, cost };
}

const stripJud = (name: string) => (name.startsWith("จุด") ? name.slice(3) : name);
