// Letters from friends: opening and throwing away.
import { letterGiftLabel } from "@/lib/world/letters";
import { getItem, getNpc } from "@/lib/world";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const lettersActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "openLetter" | "deleteLetters"> => ({
  openLetter: (letterId) => {
    const s = get();
    const letter = s.letters.find((l) => l.id === letterId);
    if (!letter) return { ok: false };
    const draft = draftFrom(s);
    let gift: string | undefined;
    if (!letter.claimed) {
      if (letter.gold) draft.gold += letter.gold;
      else if (letter.itemId && getItem(letter.itemId)) {
        draft.inventory[letter.itemId] = (draft.inventory[letter.itemId] ?? 0) + (letter.count ?? 1);
      }
      gift = letterGiftLabel(letter);
      appendActionLog(draft, "letter", `เปิดจดหมายจาก${getNpc(letter.npcId)?.name ?? "สหาย"} · ได้ ${gift}`);
    }
    draft.letters = draft.letters.map((l) => l.id === letterId ? { ...l, read: true, claimed: true } : l);
    set({ ...draft });
    return { ok: true, gift };
  },

  deleteLetters: (letterIds) => {
    const ids = new Set(letterIds);
    const gifts: string[] = [];
    // Never lose a gift: open (and claim) any unclaimed one first.
    for (const letter of get().letters) {
      if (ids.has(letter.id) && !letter.claimed) {
        const gift = get().openLetter(letter.id).gift;
        if (gift) gifts.push(gift);
      }
    }
    const s = get();
    const kept = s.letters.filter((l) => !ids.has(l.id));
    const deleted = s.letters.length - kept.length;
    if (!deleted) return { ok: false, deleted: 0, gifts };
    const draft = draftFrom(s);
    draft.letters = kept;
    set({ ...draft });
    return { ok: true, deleted, gifts };
  },
});
