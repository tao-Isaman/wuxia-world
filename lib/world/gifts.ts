// Gifts to NPCs: one gift per NPC every GIFT_COOLDOWN_DAYS raises the
// relationship by the gift's worth, doubled when the NPC likes it; a disliked
// gift costs relationship. Tastes are NpcDef.likes / dislikes (item categories,
// item ids, or "gold"), else they follow the NPC's tags.

import type { ItemCategory, ItemDef, NpcDef, WorldStateData } from "./types";

export const GIFT_COOLDOWN_DAYS = 30;
/** Gold amounts offered in the gift picker. */
export const GOLD_GIFTS = [100, 500, 1000, 5000] as const;

export type GiftReaction = "love" | "like" | "plain" | "dislike";

// Tag → what that kind of person likes / dislikes.
const TAG_TASTES: readonly { tags: readonly string[]; likes: readonly string[]; dislikes?: readonly string[] }[] = [
  { tags: ["monk", "nun", "zen", "shaolin", "emei", "hengshan_north", "vice_abbot"], likes: ["herb", "book", "moon_cake", "rice_dish"], dislikes: ["venom", "cooked_meat", "spicy_stew"] },
  { tags: ["taoist", "wudang", "quanzhen", "taishan", "internal"], likes: ["herb", "book", "potion"], dislikes: ["venom"] },
  { tags: ["scholar", "historian", "storyteller", "musician", "noble"], likes: ["book", "valuable"], dislikes: ["venom", "material"] },
  { tags: ["healer", "herbalist", "physician"], likes: ["herb", "potion", "book"] },
  { tags: ["venom", "tang", "hidden_weapon"], likes: ["venom", "herb"] },
  { tags: ["merchant", "innkeeper", "official", "authority", "envoy", "underworld", "gossip"], likes: ["valuable", "gold"] },
  { tags: ["beggars", "beggar", "farmer", "fisherman", "local", "prisoner"], likes: ["food", "gold"] },
  { tags: ["chef"], likes: ["food", "herb", "material"] },
  { tags: ["craftsman", "forge", "blacksmith", "hunter"], likes: ["material", "craft"] },
  { tags: ["swordsman", "swordswoman", "blade", "soldier", "guard", "retired_warrior", "staff_master", "sparring", "jinyiwei"], likes: ["craft", "potion", "food"] },
  { tags: ["villain", "evil_sect", "shadow"], likes: ["valuable", "venom", "gold"], dislikes: ["book"] },
  { tags: ["elder", "master", "sect_master", "recluse", "hermit"], likes: ["book", "herb", "moon_cake"] },
];
const DEFAULT_LIKES: readonly string[] = ["food"];

export function npcTastes(npc: Pick<NpcDef, "likes" | "dislikes" | "tags">): { likes: readonly string[]; dislikes: readonly string[] } {
  if (npc.likes || npc.dislikes) return { likes: npc.likes ?? [], dislikes: npc.dislikes ?? [] };
  const likes = new Set<string>(), dislikes = new Set<string>();
  for (const taste of TAG_TASTES) {
    if (!taste.tags.some((t) => npc.tags?.includes(t))) continue;
    taste.likes.forEach((l) => likes.add(l));
    taste.dislikes?.forEach((d) => dislikes.add(d));
  }
  for (const l of likes) dislikes.delete(l);
  return { likes: likes.size ? [...likes] : DEFAULT_LIKES, dislikes: [...dislikes] };
}

/** Items that can be given: anything sellable except quest items and manuals. */
export function giftable(item: ItemDef | null | undefined): item is ItemDef {
  if (!item) return false;
  const cat: ItemCategory | undefined = item.category;
  return cat !== "quest" && cat !== "manual" && (item.price ?? 0) > 0;
}

/** Base relationship worth of a gift by its gold value (1–5). */
export function giftWorth(gold: number): number {
  return gold >= 3000 ? 5 : gold >= 1000 ? 4 : gold >= 400 ? 3 : gold >= 120 ? 2 : 1;
}

export interface GiftOutcome { reaction: GiftReaction; points: number }

/** What a gift (an item, or `gold` coins) does for this NPC. */
export function giftOutcome(npc: Pick<NpcDef, "likes" | "dislikes" | "tags">, gift: { item: ItemDef } | { gold: number }): GiftOutcome {
  const { likes, dislikes } = npcTastes(npc);
  const keys = "gold" in gift ? ["gold"] : [gift.item.id, gift.item.category ?? "misc"];
  const worth = giftWorth("gold" in gift ? gift.gold : gift.item.price ?? 0);
  if (keys.some((k) => dislikes.includes(k))) return { reaction: "dislike", points: -2 };
  if (keys.some((k) => likes.includes(k))) {
    // A liked gift doubles; a favourite item (named by id) is a delight.
    const favourite = "item" in gift && likes.includes(gift.item.id);
    return { reaction: favourite || worth >= 4 ? "love" : "like", points: worth * 2 + (favourite ? 2 : 0) };
  }
  return { reaction: "plain", points: worth };
}

/** Days until this NPC accepts another gift (0 = now). */
export function giftWaitDays(state: Pick<WorldStateData, "giftDays" | "day">, npcId: string): number {
  const last = state.giftDays?.[npcId];
  return last === undefined ? 0 : Math.max(0, last + GIFT_COOLDOWN_DAYS - state.day);
}

export const GIFT_REACTION_LINE: Record<GiftReaction, string> = {
  love: "ยิ้มกว้างอย่างดีใจที่สุด — ของชิ้นนี้ถูกใจยิ่งนัก",
  like: "รับไว้ด้วยรอยยิ้ม ดูท่าจะชอบมาก",
  plain: "รับไว้อย่างสุภาพ",
  dislike: "ขมวดคิ้ว รับไว้อย่างเสียไม่ได้",
};
