import { NPC_PORTRAIT_IDS } from "./npc-portrait-ids";
import { NPC_BODY_IDS } from "./npc-body-ids";
import { NPC_PIXEL_IDS } from "./npc-pixel-ids";

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
// renderer falls back to the shared costume archetype sheet.
export function npcPixelSprite(npcId: string): string | undefined {
  return NPC_PIXEL_IDS.has(npcId) ? `/npcs/pixel/${npcId}.png` : undefined;
}

/** Denser version of the unique sprite for the enlarged battle stage. */
export function npcBattleSprite(npcId: string): string | undefined {
  return NPC_PIXEL_IDS.has(npcId) ? `/npcs/pixel-battle/${npcId}.png` : undefined;
}
