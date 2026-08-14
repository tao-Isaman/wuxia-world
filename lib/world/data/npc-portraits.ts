import { NPC_PORTRAIT_IDS } from "./npc-portrait-ids";

// Public-relative portrait path for an NPC, or undefined when the id
// has no generated art (callers fall back to the 👤 emoji marker).
export function npcPortrait(npcId: string): string | undefined {
  return NPC_PORTRAIT_IDS.has(npcId) ? `/npcs/${npcId}.png` : undefined;
}
