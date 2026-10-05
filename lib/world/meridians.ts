// ชีพจร — where meridian chart items come from (the content table
// data/meridian-sources.ts) and the world-side reading check. The pure
// engine (ranks, costs, bonuses) is lib/game/meridians.ts.
//
//   • shops: the chart item joins that shop's stock (data/shops.ts).
//   • loot: beating that opponent rolls `chance` (0–1) for the chart item,
//     on top of its normal drops (store acknowledgeBattleResult).
//   • questRewards: the quest's rewards gain the chart item (data/quests.ts).

import {
  MERIDIAN_CHARTS,
  meridianChartItemId,
  missingMeridianRequirements,
  getSkill,
  getArt,
  type CharacterBuild,
  type MeridianChart,
} from "@/lib/game";
import { MERIDIAN_SOURCES } from "./data/meridian-sources";

export interface MeridianSource {
  shops?: readonly string[];
  loot?: readonly { opponentId: string; chance: number }[];
  questRewards?: readonly string[];
}

const SOURCES: Readonly<Record<string, MeridianSource>> = MERIDIAN_SOURCES;

/** Where a chart can be found (empty when the table has no entry). */
export function meridianSourceOf(chartId: string): MeridianSource {
  return SOURCES[chartId] ?? {};
}

/** Chart item ids a shop sells, in chart order. */
export function meridianChartItemsSoldIn(shopId: string): string[] {
  return MERIDIAN_CHARTS
    .filter((c) => meridianSourceOf(c.id).shops?.includes(shopId))
    .map((c) => meridianChartItemId(c.id));
}

/** Chart items an opponent may drop, with their chance (0–1). */
export function meridianLootFor(opponentId: string): { itemId: string; chance: number }[] {
  const out: { itemId: string; chance: number }[] = [];
  for (const c of MERIDIAN_CHARTS) {
    for (const l of meridianSourceOf(c.id).loot ?? []) {
      if (l.opponentId === opponentId && l.chance > 0) out.push({ itemId: meridianChartItemId(c.id), chance: Math.min(1, l.chance) });
    }
  }
  return out;
}

/** Roll an opponent's chart drops (each rolled on its own). */
export function rollMeridianLoot(opponentId: string, rand: () => number = Math.random): string[] {
  return meridianLootFor(opponentId).filter((l) => rand() < l.chance).map((l) => l.itemId);
}

/** Chart item ids a quest hands over as an extra reward. */
export function meridianChartItemsForQuest(questId: string): string[] {
  return MERIDIAN_CHARTS
    .filter((c) => meridianSourceOf(c.id).questRewards?.includes(questId))
    .map((c) => meridianChartItemId(c.id));
}

/**
 * Why the hero can't read this chart yet (Thai), or null when they can.
 * Already learned is a reason too.
 */
export function meridianReadBlock(chart: MeridianChart, build: CharacterBuild | null | undefined): string | null {
  if (!build) return "ยังไม่มีตัวละคร";
  if (build.meridians?.[chart.id]) return "เรียนแผนภาพชีพจรนี้แล้ว";
  const miss = missingMeridianRequirements(chart, build);
  const names = [
    ...miss.skills.map((id) => getSkill(id)?.n ?? id),
    ...miss.arts.map((id) => getArt(id)?.n ?? id),
  ];
  if (names.length > 0) return `ต้องเรียน ${names.join(", ")} ก่อนจึงอ่านแผนภาพนี้เข้าใจ`;
  return null;
}
