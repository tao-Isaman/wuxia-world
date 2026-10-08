// The client's copy of a room, kept by the same events the server applies
// (server/core/src/room.rs). Pure: `applyServerMsg` folds one server message
// into the state and says when the client missed something and must ask for
// a fresh snapshot (`sync`).
import type { Presence, RoomEvent, ServerMsg } from "./protocol";

export interface PresenceState {
  /** The room's server instance; `null` until the first welcome. */
  epoch: string | null;
  /** The last event applied. */
  seq: number;
  /** Our own username. */
  you: string | null;
  players: Readonly<Record<string, Presence>>;
}

export const emptyPresence = (): PresenceState => ({ epoch: null, seq: 0, you: null, players: {} });

export function applyEvent(players: Readonly<Record<string, Presence>>, ev: RoomEvent): Record<string, Presence> {
  switch (ev.t) {
    case "joined":
      return { ...players, [ev.player.id]: ev.player };
    case "moved": {
      const player = players[ev.id];
      if (!player) return { ...players };
      return { ...players, [ev.id]: { ...player, x: ev.x, y: ev.y, dir: ev.dir, moving: ev.moving, at: ev.at } };
    }
    case "left": {
      const next = { ...players };
      delete next[ev.id];
      return next;
    }
  }
}

/**
 * Fold one server message into the state. `resync` is true when an event
 * arrived out of order (a gap in `seq`): it is not applied, and the caller
 * should send `sync` for a new welcome.
 */
export function applyServerMsg(state: PresenceState, message: ServerMsg): { state: PresenceState; resync: boolean } {
  switch (message.t) {
    case "welcome":
      return {
        state: { epoch: message.epoch, seq: message.seq, you: message.you, players: Object.fromEntries(message.players.map((p) => [p.id, p])) },
        resync: false,
      };
    case "event":
      if (state.epoch === null || message.seq <= state.seq) return { state, resync: false };
      if (message.seq !== state.seq + 1) return { state, resync: true };
      return { state: { ...state, seq: message.seq, players: applyEvent(state.players, message.ev) }, resync: false };
    default:
      return { state, resync: false };
  }
}

/** Everyone in the room but us. */
export function othersIn(state: PresenceState): Presence[] {
  return Object.values(state.players).filter((player) => player.id !== state.you);
}
