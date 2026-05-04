import type { CharacterBuild } from "@/lib/game";
import type { OpponentDef } from "../types";

// Opponents table. The `build` factory returns a fresh CharacterBuild each
// time so future encounters can scale off flags or quest progression.
//
// Keep starter opponents calibrated against the world's STARTER_BUILD
// (all stats 1, single basic_punch skill). At those stats the player can
// just barely win — that's the whole point of starting weak.
export const OPPONENTS: readonly OpponentDef[] = [
  {
    id: "thug",
    name: "โจรเร่ร่อน",
    build: (): CharacterBuild => ({
      name: "โจรเร่ร่อน",
      // Mirror the player's STARTER_BUILD: ~50/50 fight that comes down to
      // ATB tie-break + crit luck. Authors can scale later opponents up.
      stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
      artId: "none",
      artLevel: 1,
      skillIds: ["basic_punch", null, null, null, null],
      equipment: {
        W: null, A: null, H: null, B: null,
        BR: [null, null], R: [null, null], C: [null, null],
      },
    }),
  },
];

export const OPPONENTS_BY_ID = new Map<string, OpponentDef>(
  OPPONENTS.map((o) => [o.id, o]),
);

export function getOpponent(id: string | null | undefined): OpponentDef | null {
  if (!id) return null;
  return OPPONENTS_BY_ID.get(id) ?? null;
}
