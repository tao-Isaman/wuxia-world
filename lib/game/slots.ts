import type { Art, Skill } from "./types";
import { getArt, getSkill } from "./data";

// ─── Unified slot encoding ────────────────────────────────────────────
// A skill slot holds one of:
//   null            → empty
//   "<skill_id>"    → move skill
//   "art:<art_id>"  → inner art active
//
// The "art:" prefix keeps the dispatch unambiguous even if a future skill
// id collides with an art id. Helpers here are the single chokepoint for
// reading / encoding slot ids — everywhere else uses the kind tag.

export const ART_SLOT_PREFIX = "art:";

export type SlotInfo =
  | { kind: "skill"; skill: Skill; rawId: string }
  | { kind: "art"; art: Art; rawId: string }
  | null;

export function parseSlotId(raw: string | null | undefined): SlotInfo {
  if (!raw) return null;
  if (raw.startsWith(ART_SLOT_PREFIX)) {
    const id = raw.slice(ART_SLOT_PREFIX.length);
    const art = getArt(id);
    if (!art || art.id === "none") return null;
    return { kind: "art", art, rawId: raw };
  }
  const skill = getSkill(raw);
  if (skill) return { kind: "skill", skill, rawId: raw };
  return null;
}

export function encodeArtSlot(artId: string): string {
  return `${ART_SLOT_PREFIX}${artId}`;
}

export function isArtSlot(raw: string | null | undefined): boolean {
  return typeof raw === "string" && raw.startsWith(ART_SLOT_PREFIX);
}

// First slot index holding an art, or -1. Used by makeContext to pick the
// "primary" art for passive triggers and stat-scaling shortcuts.
export function firstArtSlotIndex(slots: readonly (string | null)[]): number {
  for (let i = 0; i < slots.length; i++) {
    if (isArtSlot(slots[i])) return i;
  }
  return -1;
}

// Place an entry into the first empty slot. Returns the slot index used,
// or -1 if every slot was full. Mutates the array in place.
export function placeInFirstEmpty(
  slots: (string | null)[],
  rawId: string,
): number {
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === null) {
      slots[i] = rawId;
      return i;
    }
  }
  return -1;
}
