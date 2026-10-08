// The wire protocol with the game server — the TypeScript mirror of
// server/core/src/protocol.rs (docs/online.md). Every frame is one JSON object
// tagged by `t`: the client sends commands, the server answers with events
// numbered by the room's `seq`. Keep both files in step (bump PROTOCOL_VERSION
// on both sides when a message changes shape).
import type { Dir8 } from "@/lib/characters/walk8";

export const PROTOCOL_VERSION = 1;

export type HeroBody = "m1" | "f1";

/** A player as everyone in the room sees them. */
export interface Presence {
  /** The account's username. */
  id: string;
  /** The hero's name. */
  name: string;
  body: HeroBody;
  x: number;
  y: number;
  dir: Dir8;
  moving: boolean;
  /** Server time (ms) of the last accepted update. */
  at: number;
}

export interface Motion {
  x: number;
  y: number;
  dir: Dir8;
  moving: boolean;
}

export type ClientMsg =
  | { t: "hello"; v: number; name: string; body: HeroBody; x: number; y: number; dir: Dir8 }
  | ({ t: "move" } & Motion)
  | { t: "sync" }
  | { t: "ping"; at: number };

export type LeaveReason = "closed" | "replaced";

export type RoomEvent =
  | { t: "joined"; player: Presence }
  | ({ t: "moved"; id: string; at: number } & Motion)
  | { t: "left"; id: string; reason: LeaveReason };

export type ErrorCode =
  | "bad_message" | "bad_version" | "not_joined" | "already_joined"
  | "bad_profile" | "too_fast" | "room_full" | "replaced";

export type ServerMsg =
  | { t: "welcome"; you: string; room: string; epoch: string; seq: number; players: Presence[] }
  | { t: "event"; seq: number; ev: RoomEvent }
  | { t: "pong"; at: number; server: number }
  | { t: "error"; code: ErrorCode; message: string };

/** The HTTP API's answer to register / login. */
export interface Session {
  username: string;
  token: string;
  /** Expiry, ms since 1970. */
  expires: number;
}
