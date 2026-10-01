import { NPC_PORTRAIT_IDS } from "./npc-portrait-ids";
import { NPC_BODY_IDS } from "./npc-body-ids";
import { NPC_PIXEL_IDS } from "./npc-pixel-ids";
import { hasAnimatedSheet } from "@/lib/characters/npc-sheets";

// Public-relative portrait path for an NPC, or undefined when the id
// has no generated art (callers fall back to the 👤 emoji marker).
export function npcPortrait(npcId: string): string | undefined {
  return NPC_PORTRAIT_IDS.has(npcId) ? `/npcs/${npcId}.png` : undefined;
}

// Full-body transparent sprite for map markers, or undefined. Callers
// fall back to the bust portrait chip, then the emoji.
export function npcBodySprite(npcId: string): string | undefined {
  return NPC_BODY_IDS.has(npcId) ? `/npcs/body/${npcId}.png` : undefined;
}

// Unique pixel world sprite (scripts/build-npc-sprites.ts), or undefined so the
// renderer uses a character sheet: the NPC's own rigged sheet when it has one
// (ANIMATED_NPC_IDS — it walks and wanders), else the shared costume archetype.
export function npcPixelSprite(npcId: string): string | undefined {
  return NPC_PIXEL_IDS.has(npcId) && !hasAnimatedSheet(npcId) ? `/npcs/pixel/${npcId}.png` : undefined;
}

/** Denser version of the unique sprite for the enlarged battle stage (none for rigged NPCs: they play real clips). */
export function npcBattleSprite(npcId: string): string | undefined {
  return NPC_PIXEL_IDS.has(npcId) && !hasAnimatedSheet(npcId) ? `/npcs/pixel-battle/${npcId}.png` : undefined;
}
