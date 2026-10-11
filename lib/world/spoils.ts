// What a won fight or a gathering trip pays, rolled from the data: opponent
// loot, a hostile foe's purse, a legendary beast's trophy and gear, move xp and
// a hunt's carcass. Pure, so the game server rolls a checked battle's spoils
// with the same code the browser uses (docs/online.md "Battles on the server").
import { getArt, getSkill } from "../game";
import type { ResourceDef, ResourceYield, WorldStateData } from "./types";
import { getOpponent } from "./data/opponents";
import { getResource } from "./data/resources";
import { gatherSuccessChance, masteryLevel } from "./data/life-skills";
import { pickWeighted } from "./data/random-events";
import { isLawOpponent } from "./law";
import { rollMeridianLoot } from "./meridians";
import { getBoss } from "./data/bosses";
import { dropsGold, moveXpMultiplier, victoryWExp } from "./victory";

/** Battle xp per use of a move skill / an inner art in a won fight (store/world/rules.ts re-exports these). */
export const SKILL_USE_XP = 20;
export const ART_USE_XP = 20;

export interface VictorySpoils {
  gold: number;
  wExp: number;
  items: { itemId: string; count: number }[];
  /** Battle xp per move skill / inner art used (frozen sect moves left out). */
  moves: { id: string; kind: "skill" | "art"; xp: number }[];
  /** A hunt's carcass roll (null when the fight was no hunt). */
  hunt: { items: { itemId: string; count: number }[]; passed: boolean } | null;
  /** Equipment ids won (a legendary beast's rare drop); they go to the gear bag. */
  gear?: string[];
}

/** What a battle left that the spoils read: the hero's move and art uses. */
export interface BattleUses {
  skillUses?: { A?: Record<string, number> };
  artUses?: { A?: Record<string, number> };
}

// Gold in a hostile person's purse by tier (min, max); beasts carry none, and
// spars, tournament bouts and the law pay none.
export const FOE_GOLD: Readonly<Record<number, readonly [number, number]>> = {
  0: [5, 15], 1: [15, 40], 2: [40, 90], 3: [90, 180], 4: [180, 350], 5: [350, 600],
};

/**
 * Roll a won fight's spoils. `frozen` says whether a move no longer earns xp
 * (a resigned sect's, store/world/progression.ts).
 */
export function rollVictorySpoilsFrom(
  s: WorldStateData,
  pb: NonNullable<WorldStateData["pendingBattle"]>,
  battle: BattleUses | null | undefined,
  frozen: (kind: "skill" | "art", id: string) => boolean = () => false,
): VictorySpoils {
  const opp = getOpponent(pb.opponentId);
  const items: Record<string, number> = {};
  let gold = 0;
  const gear: string[] = [];
  if (!pb.tournament) {
    for (const it of rollOpponentLoot(opp?.drops, opp?.ti ?? 0)) items[it.itemId] = (items[it.itemId] ?? 0) + it.count;
    for (const itemId of rollMeridianLoot(pb.opponentId)) items[itemId] = (items[itemId] ?? 0) + 1;
    // A legendary beast: its trophy every time, now and then a piece of top gear.
    const boss = opp?.boss ? getBoss(opp.id) : null;
    if (boss) {
      items[boss.trophyItemId] = (items[boss.trophyItemId] ?? 0) + 1;
      if (boss.gear.length && Math.random() < boss.gearChance) gear.push(boss.gear[Math.floor(Math.random() * boss.gear.length)]!);
    }
    if (!s.pendingSpar && !pb.nonFatal && !isLawOpponent(pb.opponentId) && dropsGold(opp)) {
      const [min, max] = FOE_GOLD[Math.max(0, Math.min(5, opp?.ti ?? 0))];
      gold = min + Math.floor(Math.random() * (max - min + 1));
    }
  }
  // Beasts and legendary beasts teach twice as much per move.
  const xpMult = moveXpMultiplier(opp);
  const moves: VictorySpoils["moves"] = [];
  for (const [id, count] of Object.entries(battle?.skillUses?.A ?? {})) {
    if (typeof count === "number" && count > 0 && getSkill(id) && !frozen("skill", id)) moves.push({ id, kind: "skill", xp: count * SKILL_USE_XP * xpMult });
  }
  for (const [id, count] of Object.entries(battle?.artUses?.A ?? {})) {
    const art = getArt(id);
    if (typeof count === "number" && count > 0 && art && art.id !== "none" && !frozen("art", id)) moves.push({ id, kind: "art", xp: count * ART_USE_XP * xpMult });
  }
  let hunt: VictorySpoils["hunt"] = null;
  const res = s.pendingHuntYield ? getResource(s.pendingHuntYield.resourceId) : null;
  if (res) hunt = rollResourceYield(res, masteryLevel(s.lifeSkillXp[res.skill] ?? 0));
  return { gold, wExp: victoryWExp(opp), items: Object.entries(items).map(([itemId, count]) => ({ itemId, count })), moves, hunt, gear };
}

// Roll loot from an opponent's drop table. Picks count is per-tier:
// tier 0/1 = 2 picks, tier 2/3 = 3, tier 4 / 5 (and legendary beasts) = 4. Same weighted-pick helper
// as resources; merges duplicate item ids.
export function rollOpponentLoot(
  drops: readonly ResourceYield[] | undefined,
  tier: number,
): { itemId: string; count: number }[] {
  if (!drops || drops.length === 0) return [];
  const picks = tier >= 4 ? 4 : tier >= 2 ? 3 : 2;
  return rollWeightedPicks(drops, picks);
}

// Roll a yield. Two-stage:
//   1. Drop check — single mastery-vs-level roll. If it fails, no items.
//   2. Pick count — mastery surplus above the resource level adds picks
//      (clamped 1..3) so a level-5 mastery farming a level-1 node sees a
//      reliable boost without drowning the inventory.
export function rollResourceYield(
  resource: ResourceDef,
  masteryLv: number,
): { items: { itemId: string; count: number }[]; passed: boolean } {
  const passed = Math.random() < gatherSuccessChance(masteryLv, resource.level);
  if (!passed) return { items: [], passed: false };

  const surplus = masteryLv - resource.level;
  let picks = 1;
  if (surplus >= 1) picks++;
  if (surplus >= 3) picks++;
  picks = Math.max(1, Math.min(3, picks));

  return { items: rollWeightedPicks(resource.yields, picks), passed: true };
}

// `picks` weighted draws from a drop / yield table, each with its count rolled
// in its range; duplicate item ids merge. Shared by loot and resource yields.
function rollWeightedPicks(table: readonly ResourceYield[], picks: number): { itemId: string; count: number }[] {
  const merged: Record<string, number> = {};
  for (let i = 0; i < picks; i++) {
    const drop = pickWeighted(table, Math.random());
    if (!drop) continue;
    const min = drop.count?.[0] ?? 1;
    const max = drop.count?.[1] ?? 1;
    const c = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    merged[drop.itemId] = (merged[drop.itemId] ?? 0) + c;
  }
  return Object.entries(merged).map(([itemId, count]) => ({ itemId, count }));
}
