// Who is standing where. A dead NPC — killed by the hero, in a duel, or of
// old age (npcExt status "dead") — is gone from the world for good; a
// kidnapped one is away for KIDNAP_RETURN_DAYS, then back at their spot.
import type { WorldStateData } from "./types";

export const KIDNAP_RETURN_DAYS = 180;

export function npcPresent(
  state: Pick<WorldStateData, "assassinatedNpcIds" | "kidnappedUntil" | "day"> & Partial<Pick<WorldStateData, "npcExt">>,
  npcId: string,
): boolean {
  if (state.assassinatedNpcIds?.includes(npcId)) return false;
  if (state.npcExt?.[npcId]?.status === "dead") return false;
  const until = state.kidnappedUntil?.[npcId];
  return until === undefined || state.day >= until;
}

/** Days until a kidnapped NPC is back, or 0. */
export function npcAwayDays(state: Pick<WorldStateData, "kidnappedUntil" | "day">, npcId: string): number {
  const until = state.kidnappedUntil?.[npcId];
  return until === undefined ? 0 : Math.max(0, until - state.day);
}
