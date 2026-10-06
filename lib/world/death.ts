// Death is not the end: a hero who falls in a fatal fight is found and carried
// home, waking a day later with a price paid. Pure: the store applies it.
//
//   • half the gold is gone (DEATH_GOLD_LOSS);
//   • 1–3 random kinds of carried items lose half their stack (rounded up) —
//     quest items, move scrolls / manuals and books (meridian charts) are kept,
//     and worn equipment is never touched;
//   • the hero wakes at home (home_player) with 30 % HP / MP.

import { getItem } from "./data/items";
import type { ItemCategory, WorldStateData } from "./types";

export const DEATH_GOLD_LOSS = 0.5;
export const DEATH_ITEM_KINDS: readonly [number, number] = [1, 3];
export const DEATH_REVIVE_PLACE = "home_player";
export const DEATH_REVIVE_FRACTION = 0.3;
/** Never lost on death: what quests need and what teaches (scrolls, manuals, charts). */
const KEPT_CATEGORIES: ReadonlySet<ItemCategory> = new Set(["quest", "manual", "book"]);

export interface DeathPenalty {
  goldLost: number;
  itemsLost: { itemId: string; count: number }[];
}

/** Items a death may take from: carried, with a count, and not kept. */
export function deathLosableItems(inventory: Readonly<Record<string, number>>): string[] {
  return Object.keys(inventory).filter((id) => {
    if ((inventory[id] ?? 0) <= 0) return false;
    if (id.startsWith("scroll_") || id.startsWith("chart_")) return false;
    const item = getItem(id);
    return !!item && !(item.category && KEPT_CATEGORIES.has(item.category));
  }).sort();
}

/** What a death costs (does not change the state). `rng` returns [0, 1). */
export function rollDeathPenalty(state: Pick<WorldStateData, "gold" | "inventory">, rng: () => number = Math.random): DeathPenalty {
  const goldLost = Math.floor(Math.max(0, state.gold) * DEATH_GOLD_LOSS);
  const pool = deathLosableItems(state.inventory);
  const [min, max] = DEATH_ITEM_KINDS;
  const kinds = Math.min(pool.length, min + Math.floor(rng() * (max - min + 1)));
  const itemsLost: DeathPenalty["itemsLost"] = [];
  for (let i = 0; i < kinds; i++) {
    const [itemId] = pool.splice(Math.floor(rng() * pool.length), 1);
    itemsLost.push({ itemId, count: Math.ceil(state.inventory[itemId] / 2) });
  }
  return { goldLost, itemsLost };
}

/** Take the penalty from a draft (gold and inventory only). */
export function applyDeathPenalty(state: Pick<WorldStateData, "gold" | "inventory">, penalty: DeathPenalty): void {
  state.gold = Math.max(0, state.gold - penalty.goldLost);
  const inventory = { ...state.inventory };
  for (const { itemId, count } of penalty.itemsLost) {
    const left = (inventory[itemId] ?? 0) - count;
    if (left > 0) inventory[itemId] = left; else delete inventory[itemId];
  }
  state.inventory = inventory;
}

/** The Thai lines for the report and the log. */
export function describeDeathPenalty(penalty: DeathPenalty): string[] {
  const lines: string[] = [];
  if (penalty.goldLost > 0) lines.push(`เงินหาย ${penalty.goldLost.toLocaleString()} ตำลึง`);
  for (const { itemId, count } of penalty.itemsLost) lines.push(`${getItem(itemId)?.name ?? itemId} หาย ×${count}`);
  if (!lines.length) lines.push("ไม่มีสิ่งใดติดตัวให้สูญเสีย");
  return lines;
}
