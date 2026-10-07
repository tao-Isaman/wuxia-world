// What a fight or a gathering trip pays: victory spoils (rolled once per
// battle), opponent loot, resource yields and used battle items.
import { getArt, getSkill } from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import { gatherSuccessChance, getOpponent, getResource, masteryLevel, pickWeighted, type ResourceDef, type ResourceYield, type WorldStateData } from "@/lib/world";
import { isLawOpponent } from "@/lib/world/law";
import { rollMeridianLoot } from "@/lib/world/meridians";
import { isArtFrozen, isSkillFrozen } from "./progression";
import { getBoss } from "@/lib/world/data/bosses";
import { dropsGold, moveXpMultiplier, victoryWExp } from "@/lib/world/victory";
import { ART_USE_XP, SKILL_USE_XP } from "./rules";
import type { VictorySpoils } from "./types";

// Gold in a hostile person's purse by tier (min, max); beasts carry none, and
// spars, tournament bouts and the law pay none.
export const FOE_GOLD: Readonly<Record<number, readonly [number, number]>> = {
  0: [5, 15], 1: [15, 40], 2: [40, 90], 3: [90, 180], 4: [180, 350], 5: [350, 600],
};
// One roll per pendingBattle (the object the battle was started for).
export const spoilsByBattle = new WeakMap<object, VictorySpoils>();

// Battle items the hero used (potions, poisons, hidden weapons) leave the bag,
// whatever the outcome.
export function consumeBattleItems(draft: WorldStateData, battleState: { itemsUsed?: Record<string, number> } | null | undefined): void {
  const used = Object.entries(battleState?.itemsUsed ?? {}).filter(([, n]) => n > 0);
  if (!used.length) return;
  draft.inventory = { ...draft.inventory };
  for (const [id, n] of used) {
    const left = (draft.inventory[id] ?? 0) - n;
    if (left > 0) draft.inventory[id] = left; else delete draft.inventory[id];
  }
}

// Roll a won fight's spoils from the battle store's final state.
export function rollVictorySpoils(s: WorldStateData, pb: NonNullable<WorldStateData["pendingBattle"]>): VictorySpoils {
  const battleState = useBattleStore.getState().state;
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
  for (const [id, count] of Object.entries(battleState?.skillUses?.A ?? {})) {
    if (typeof count === "number" && count > 0 && getSkill(id) && !isSkillFrozen(s, id)) moves.push({ id, kind: "skill", xp: count * SKILL_USE_XP * xpMult });
  }
  for (const [id, count] of Object.entries(battleState?.artUses?.A ?? {})) {
    const art = getArt(id);
    if (typeof count === "number" && count > 0 && art && art.id !== "none" && !isArtFrozen(s, id)) moves.push({ id, kind: "art", xp: count * ART_USE_XP * xpMult });
  }
  let hunt: VictorySpoils["hunt"] = null;
  const res = s.pendingHuntYield ? getResource(s.pendingHuntYield.resourceId) : null;
  if (res) hunt = rollResourceYield(res, masteryLevel(s.lifeSkillXp[res.skill] ?? 0));
  return { gold, wExp: victoryWExp(opp), items: Object.entries(items).map(([itemId, count]) => ({ itemId, count })), moves, hunt, gear };
}

export function victorySpoilsFor(s: WorldStateData): VictorySpoils | null {
  const pb = s.pendingBattle;
  if (!pb || useBattleStore.getState().state?.winner !== "A") return null;
  let spoils = spoilsByBattle.get(pb);
  if (!spoils) { spoils = rollVictorySpoils(s, pb); spoilsByBattle.set(pb, spoils); }
  return spoils;
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
