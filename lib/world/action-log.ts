// The player-visible action log (บันทึก): the newest ACTION_LOG_MAX entries.
// Pure, so engine effects (a quest reward that resigns from a sect…) can log
// the same lines as the store actions. store/world/state.ts re-exports it.
import type { WorldStateData } from "./types";

export const ACTION_LOG_MAX = 100;

/** Append a player-action entry, keeping the newest 100. Mutates `state` in place (a draft). */
export function appendActionLog(state: WorldStateData, kind: string, message: string): void {
  const entry = { day: state.day, time: state.time, kind, message };
  const next = [...(state.actionLog ?? []), entry];
  if (next.length > ACTION_LOG_MAX) next.splice(0, next.length - ACTION_LOG_MAX);
  state.actionLog = next;
}
