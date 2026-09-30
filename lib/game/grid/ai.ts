// STUB — replaced by the grid AI subagent. Signature is final.
import type { GridBattleState, TurnPlan } from "./types";

/** Plan the active unit's whole turn: optional move, then one action. */
export function planTurn(state: GridBattleState, unitId: string): TurnPlan {
  void state; void unitId;
  return { action: { t: "wait" } };
}
