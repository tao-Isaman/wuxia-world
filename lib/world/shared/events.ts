// Player → world changes (docs/design/world-clock-and-shared-world.md §3).
// Everything an action does to the shared world — a killing, a kidnapping, a
// fallen legendary beast, the news of what the hero did — is a WorldEvent,
// applied by one pure reducer. Today the reducer runs in the browser on the
// local world; a server would run the same reducer and rebroadcast.
import type { Rumor, WorldStateData } from "../types";
import { killNpc } from "../npc-life";
import { bossSlain } from "../victory";

export type WorldEvent =
  | { t: "npc_killed"; npcId: string; byPlayer: string; day: number; locationId: string }
  | { t: "npc_kidnapped"; npcId: string; byPlayer: string; day: number; until: number }
  | { t: "boss_slain"; bossId: string; byPlayer: string; day: number }
  | { t: "rumor"; rumor: Rumor };

/** Events the world keeps (newest last); a server would keep its own. */
export const WORLD_EVENT_LOG_MAX = 500;

/** Apply one event to the shared fields of a state. Pure apart from mutating `state`. */
export function applyWorldEvent(state: WorldStateData, ev: WorldEvent): void {
  switch (ev.t) {
    case "npc_killed":
      killNpc(state, ev.npcId, ev.day, { by: "player", kind: "killed_by_player", locationId: ev.locationId });
      if (!state.assassinatedNpcIds.includes(ev.npcId)) state.assassinatedNpcIds = [...state.assassinatedNpcIds, ev.npcId];
      return;
    case "npc_kidnapped":
      if (!state.kidnappedNpcIds.includes(ev.npcId)) state.kidnappedNpcIds = [...state.kidnappedNpcIds, ev.npcId];
      state.kidnappedUntil = { ...state.kidnappedUntil, [ev.npcId]: ev.until };
      return;
    case "boss_slain":
      bossSlain(state, ev.bossId, ev.day);
      return;
    case "rumor":
      state.rumorPool = [...(state.rumorPool ?? []).filter((r) => r.id !== ev.rumor.id), ev.rumor];
      return;
    default: {
      const never: never = ev;
      void never;
    }
  }
}

/** Keep an event in the world's log (it has been applied already). */
export function recordWorldEvent(state: WorldStateData, ev: WorldEvent): void {
  const log = [...(state.worldEventLog ?? []), ev];
  if (log.length > WORLD_EVENT_LOG_MAX) log.splice(0, log.length - WORLD_EVENT_LOG_MAX);
  state.worldEventLog = log;
}

/** What an action calls to change the shared world: apply the event, then log it. */
export function emitWorldEvent(state: WorldStateData, ev: WorldEvent): void {
  applyWorldEvent(state, ev);
  recordWorldEvent(state, ev);
}
