// Letters from friends: reading, taking the gift (when the player chooses),
// and throwing letters away.
import { letterGiftLabel } from "@/lib/world/letters";
import { getItem, getNpc } from "@/lib/world";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";
import type { Letter, WorldStateData } from "@/lib/world/types";

/** Put a letter's gift in the bag (on a draft); its label. */
function takeGift(draft: WorldStateData, letter: Letter): string {
  if (letter.gold) draft.gold += letter.gold;
  else if (letter.itemId && getItem(letter.itemId)) {
    draft.inventory[letter.itemId] = (draft.inventory[letter.itemId] ?? 0) + (letter.count ?? 1);
  }
  const gift = letterGiftLabel(letter);
  appendActionLog(draft, "letter", `รับของจากจดหมายของ${getNpc(letter.npcId)?.name ?? "สหาย"} · ได้ ${gift}`);
  return gift;
}

const hasGift = (letter: Letter) => !letter.claimed && !!(letter.gold || letter.itemId);

export const lettersActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "readLetter" | "claimLetterGift" | "claimAllLetterGifts" | "deleteLetters"> => ({
  readLetter: (letterId) => {
    const s = get();
    const letter = s.letters.find((l) => l.id === letterId);
    if (!letter) return { ok: false };
    if (letter.read) return { ok: true };
    const draft = draftFrom(s);
    draft.letters = draft.letters.map((l) => l.id === letterId ? { ...l, read: true } : l);
    set({ ...draft });
    return { ok: true };
  },

  claimLetterGift: (letterId) => {
    const s = get();
    const letter = s.letters.find((l) => l.id === letterId);
    if (!letter || !hasGift(letter)) return { ok: false };
    const draft = draftFrom(s);
    const gift = takeGift(draft, letter);
    draft.letters = draft.letters.map((l) => l.id === letterId ? { ...l, read: true, claimed: true } : l);
    set({ ...draft });
    return { ok: true, gift };
  },

  claimAllLetterGifts: () => {
    const s = get();
    const waiting = s.letters.filter(hasGift);
    if (!waiting.length) return { ok: false, gifts: [] };
    const draft = draftFrom(s);
    const ids = new Set(waiting.map((l) => l.id));
    const gifts = waiting.map((letter) => takeGift(draft, letter));
    draft.letters = draft.letters.map((l) => ids.has(l.id) ? { ...l, read: true, claimed: true } : l);
    set({ ...draft });
    return { ok: true, gifts };
  },

  deleteLetters: (letterIds) => {
    // A gift left in a letter goes with it (the window asks first).
    const ids = new Set(letterIds);
    const s = get();
    const kept = s.letters.filter((l) => !ids.has(l.id));
    const deleted = s.letters.length - kept.length;
    const discarded = s.letters.filter((l) => ids.has(l.id) && hasGift(l)).length;
    if (!deleted) return { ok: false, deleted: 0, discarded: 0 };
    const draft = draftFrom(s);
    draft.letters = kept;
    set({ ...draft });
    return { ok: true, deleted, discarded };
  },
});
