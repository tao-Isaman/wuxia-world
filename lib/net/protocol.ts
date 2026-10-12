// The wire protocol with the game server — the TypeScript mirror of
// server/core/src/protocol.rs (docs/online.md). Every frame is one JSON object
// tagged by `t`: the client sends commands, the server answers with events
// numbered by the room's `seq`. Keep both files in step (bump PROTOCOL_VERSION
// on both sides when a message changes shape).
import type { Dir8 } from "@/lib/characters/walk8";

export const PROTOCOL_VERSION = 3;

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
  /** The outfit worn (protocol 3; lib/world/data/outfits.ts). */
  outfit: string;
  /** The equipment id of the weapon carried on the body, if shown. */
  weapon: string | null;
}

/** A player's look: the outfit worn and the weapon carried (protocol 3). */
export interface Look {
  outfit: string;
  weapon: string | null;
}

export interface Motion {
  x: number;
  y: number;
  dir: Dir8;
  moving: boolean;
}

export type ClientMsg =
  | ({ t: "hello"; v: number; name: string; body: HeroBody; x: number; y: number; dir: Dir8 } & Look)
  | ({ t: "move" } & Motion)
  | { t: "sync" }
  | { t: "ping"; at: number }
  /** A line of map chat (1–120 characters, 5 per 10 s). */
  | { t: "say"; text: string }
  /** The look changed (at most one every 500 ms). */
  | ({ t: "look" } & Look);

export type LeaveReason = "closed" | "replaced";

export type RoomEvent =
  | { t: "joined"; player: Presence }
  | ({ t: "moved"; id: string; at: number } & Motion)
  | { t: "left"; id: string; reason: LeaveReason }
  /** A line of map chat, with the speaker's hero name. */
  | { t: "said"; id: string; name: string; text: string; at: number }
  /** A player changed their look. */
  | ({ t: "looked"; id: string; at: number } & Look);

export type ErrorCode =
  | "bad_message" | "bad_version" | "not_joined" | "already_joined"
  | "bad_profile" | "too_fast" | "room_full" | "replaced" | "bad_text";

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
