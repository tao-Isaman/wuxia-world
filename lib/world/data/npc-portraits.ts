import { NPC_PORTRAIT_IDS } from "./npc-portrait-ids";
import { NPC_BODY_IDS } from "./npc-body-ids";

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
