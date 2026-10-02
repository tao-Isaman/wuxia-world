// Letters (จดหมาย): friends write to the hero. Each new day, every NPC whose
// relationship with the hero is high enough may send a letter with a gift —
// at most one letter a day, and one per NPC every LETTER_RULES.cooldownDays.
// The odds rise with the relationship, the hero's ชื่อเสียง (fame) and LUK;
// LUK (and a little fame) also lifts the gift's rarity. Letters wait in the
// inbox (state.letters) until the hero opens them and takes the gift.

import { getItem, ITEMS } from "./data/items";
import { getNpc } from "./data/npcs";
import { giftable, giftWorth, npcTastes } from "./gifts";
import { npcPresent } from "./npc-presence";
import type { ItemDef, Letter, NpcDef, WorldStateData } from "./types";

export const LETTER_RULES = {
  /** Relationship an NPC needs before they write. */
  minRelationship: 20,
  /** Days between two letters from the same NPC. */
  cooldownDays: 15,
  /** Letters kept in the inbox (the oldest read ones go first). */
  inboxMax: 40,
  /** Most new days rolled in one advanceTime call (a long rest doesn't flood the inbox). */
  maxDaysPerTick: 7,
} as const;

/** Gift rarity: 1 ทั่วไป · 2 ดี · 3 หายาก · 4 ล้ำค่า (by the item's price, `giftWorth`). */
export type GiftRarity = 1 | 2 | 3 | 4;
export const RARITY_LABEL: Record<GiftRarity, string> = { 1: "ทั่วไป", 2: "ดี", 3: "หายาก", 4: "ล้ำค่า" };
/** Gold sent instead of an item, by rarity, to NPCs who like gold. */
const GOLD_BY_RARITY: Record<GiftRarity, number> = { 1: 60, 2: 200, 3: 600, 4: 2000 };

type Rng = () => number;
type LetterState = Pick<WorldStateData, "npcStates" | "letterDays" | "letters" | "day" | "traits" | "playerBuild"
  | "assassinatedNpcIds" | "kidnappedUntil" | "npcExt">;

const luck = (state: Pick<WorldStateData, "playerBuild">) => Math.max(0, state.playerBuild?.stats.LUK ?? 0);
const fameOf = (state: Pick<WorldStateData, "traits">) => Math.max(0, state.traits?.fame ?? 0);

/** Chance (0–0.15) that this NPC writes today, from the relationship, fame and LUK. */
export function letterChance(relationship: number, fame: number, luk: number): number {
  if (relationship < LETTER_RULES.minRelationship) return 0;
  const chance = 0.01 + (relationship - LETTER_RULES.minRelationship) * 0.0015 + fame * 0.0002 + luk * 0.0005;
  return Math.max(0, Math.min(0.15, chance));
}

/** The gift's rarity for one roll (`roll` in 0..1): LUK and fame shift it upward. */
export function giftRarity(roll: number, luk: number, fame: number): GiftRarity {
  const score = roll * 100 + Math.min(40, luk * 0.4) + Math.min(10, fame * 0.05);
  return score >= 99 ? 4 : score >= 92 ? 3 : score >= 75 ? 2 : 1;
}

/** NPCs who could write today: friends, present, alive, off cooldown. */
export function letterWriters(state: LetterState): NpcDef[] {
  const out: NpcDef[] = [];
  for (const [npcId, entry] of Object.entries(state.npcStates ?? {})) {
    if ((entry?.relationship ?? 0) < LETTER_RULES.minRelationship) continue;
    const npc = getNpc(npcId);
    if (!npc || !npcPresent(state, npcId)) continue;
    if (state.npcExt?.[npcId] && state.npcExt[npcId].status !== "alive") continue;
    const last = state.letterDays?.[npcId];
    if (last !== undefined && state.day - last < LETTER_RULES.cooldownDays) continue;
    out.push(npc);
  }
  return out;
}

/** What the NPC sends: an item of the rolled rarity (their tastes first), or gold if they like gold. */
export function pickLetterGift(npc: Pick<NpcDef, "likes" | "dislikes" | "tags">, rarity: GiftRarity, rng: Rng):
  { itemId: string; count: number } | { gold: number } {
  const { likes, dislikes } = npcTastes(npc);
  if (likes.includes("gold") && rng() < 0.5) return { gold: GOLD_BY_RARITY[rarity] };
  const ok = (item: ItemDef) => giftable(item) && !dislikes.includes(item.id) && !dislikes.includes(item.category ?? "misc");
  for (let tier = rarity; tier >= 1; tier--) {
    const pool = ITEMS.filter((item) => ok(item) && Math.min(4, giftWorth(item.price ?? 0)) === tier);
    if (!pool.length) continue;
    const liked = pool.filter((item) => likes.includes(item.id) || likes.includes(item.category ?? "misc"));
    const from = liked.length && rng() < 0.7 ? liked : pool;
    const item = from[Math.floor(rng() * from.length)];
    // Common gifts come in a small bundle.
    return { itemId: item.id, count: tier === 1 ? 1 + Math.floor(rng() * 3) : 1 };
  }
  return { gold: GOLD_BY_RARITY[rarity] };
}

const OPENINGS = [
  "ไม่ได้พบกันนานหลายวัน ข้ายังนึกถึงท่านอยู่เสมอ",
  "ได้ยินข่าวคราวของท่านในยุทธภพ ข้ายินดียิ่งนัก",
  "ลมหนาวพัดผ่านมา ข้านึกถึงน้ำใจที่ท่านเคยมีให้",
  "วันนี้ว่างจากธุระ จึงเขียนสารมาถามไถ่",
  "ข้าเพิ่งกลับจากเดินทาง ได้ของติดไม้ติดมือมาบ้าง",
  "ชื่อเสียงของท่านเลื่องลือมาถึงที่นี่แล้ว",
];
const CLOSINGS = [
  "ของเล็กน้อยนี้ขอมอบเป็นน้ำใจ โปรดรับไว้เถิด",
  "หวังว่าของชิ้นนี้จะเป็นประโยชน์ในการเดินทางของท่าน",
  "ขอให้ท่านเดินทางปลอดภัย แล้วแวะมาเยี่ยมกันบ้าง",
  "ข้าเห็นของนี้แล้วนึกถึงท่านทันที",
];

/** The letter's text, picked by `rng`. */
export function letterText(npc: Pick<NpcDef, "name">, rng: Rng): string {
  const open = OPENINGS[Math.floor(rng() * OPENINGS.length)];
  const close = CLOSINGS[Math.floor(rng() * CLOSINGS.length)];
  return `${open} ${close}\n\n— ${npc.name}`;
}

/**
 * Roll the letters for the days from `fromDay` (exclusive) to `state.day`
 * (inclusive), at most LETTER_RULES.maxDaysPerTick of them. Mutates `state`
 * (letters, letterDays) and returns the new letters.
 */
export function rollLetters(state: LetterState, fromDay: number, rng: Rng = Math.random): Letter[] {
  const sent: Letter[] = [];
  const first = Math.max(fromDay + 1, state.day - LETTER_RULES.maxDaysPerTick + 1);
  state.letters ??= [];
  state.letterDays ??= {};
  for (let day = first; day <= state.day; day++) {
    const writers = letterWriters({ ...state, day });
    // Shuffle so no NPC is always asked first; the first success writes today's letter.
    for (let i = writers.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [writers[i], writers[j]] = [writers[j], writers[i]]; }
    for (const npc of writers) {
      const relationship = state.npcStates[npc.id]?.relationship ?? 0;
      if (rng() >= letterChance(relationship, fameOf(state), luck(state))) continue;
      const rarity = giftRarity(rng(), luck(state), fameOf(state));
      const gift = pickLetterGift(npc, rarity, rng);
      const letter: Letter = {
        id: `letter_${day}_${npc.id}`,
        day,
        npcId: npc.id,
        text: letterText(npc, rng),
        rarity,
        ...("gold" in gift ? { gold: gift.gold } : { itemId: gift.itemId, count: gift.count }),
        read: false,
        claimed: false,
      };
      state.letters = [...state.letters, letter];
      state.letterDays = { ...state.letterDays, [npc.id]: day };
      sent.push(letter);
      break;
    }
  }
  trimInbox(state);
  return sent;
}

/** Keep the inbox within LETTER_RULES.inboxMax: drop the oldest claimed letters first, then the oldest. */
export function trimInbox(state: Pick<WorldStateData, "letters">): void {
  const letters = state.letters ?? [];
  if (letters.length <= LETTER_RULES.inboxMax) return;
  let excess = letters.length - LETTER_RULES.inboxMax;
  const kept = letters.filter((letter) => {
    if (excess > 0 && letter.claimed) { excess--; return false; }
    return true;
  });
  state.letters = kept.slice(Math.max(0, kept.length - LETTER_RULES.inboxMax));
}

/** Letters not yet opened. */
export const unreadLetters = (state: Pick<WorldStateData, "letters">) => (state.letters ?? []).filter((letter) => !letter.read).length;

/** A short description of the gift ("ยาสมุนไพร ×2", "200 ตำลึง"). */
export function letterGiftLabel(letter: Letter): string {
  if (letter.gold) return `${letter.gold} ตำลึง`;
  const item = getItem(letter.itemId);
  return item ? `${item.name}${(letter.count ?? 1) > 1 ? ` ×${letter.count}` : ""}` : "ของขวัญ";
}
