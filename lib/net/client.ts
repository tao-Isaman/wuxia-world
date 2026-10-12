// The low-level client for the game server (docs/online.md): the HTTP auth,
// character, save, world, battle and social calls, and one WebSocket into one room. No React, no store — the browser
// (lib/net/session.ts) and the server test (scripts/test-online-server.ts)
// both use it.
import { PROTOCOL_VERSION, type ClientMsg, type HeroBody, type Look, type Motion, type ServerMsg, type Session } from "./protocol";
import type { Dir8 } from "@/lib/characters/walk8";
import type { BattleLogRequest, BattleStartReply, BattleVerdict, EchoRequest, WorldReply } from "./play-protocol";
import type { Parcel, SendMailRequest, SocialSnapshot } from "./social-protocol";

/** An auth call the server refused: `code` is its error (`taken`, `wrong_login`, …). */
export class AuthFailure extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

async function auth(server: string, path: "register" | "login", username: string, password: string): Promise<Session> {
  const response = await fetch(`${server.replace(/\/$/, "")}/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json().catch(() => ({ error: "server_error" })) as Partial<Session> & { error?: string };
  if (!response.ok || !body.token) throw new AuthFailure(body.error ?? "server_error", response.status);
  return body as Session;
}

export const register = (server: string, username: string, password: string) => auth(server, "register", username, password);
export const login = (server: string, username: string, password: string) => auth(server, "login", username, password);

/**
 * Whether the server still accepts a saved token: `valid`, `rejected` (401: a
 * bad or expired token, or one signed with an older server key) or `unknown`
 * (no answer — keep the token and try later).
 */
export async function checkToken(server: string, token: string): Promise<"valid" | "rejected" | "unknown"> {
  try {
    const response = await fetch(`${server.replace(/\/$/, "")}/auth/me?token=${encodeURIComponent(token)}`);
    if (response.ok) return "valid";
    return response.status === 401 ? "rejected" : "unknown";
  } catch {
    return "unknown";
  }
}

/** A characters / saves / world call the server refused (`code`: `stale`, `gold_too_fast`, …). */
export class ApiFailure extends Error {
  constructor(public readonly code: string, public readonly status: number, public readonly detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

/** A character on the server (`wuxia_core::save::Character`, without its bookkeeping). */
export interface CharacterInfo {
  id: string;
  name: string;
  gender: "male" | "female";
  body: "m1" | "f1";
  created: number;
  updated: number;
  /** The last accepted save's number (0: never saved). */
  rev: number;
  summary: { day: number; gold: number; location: string | null; sect: string | null; rank: number | null } | null;
}

/** The game's own save JSON (zustand persist's `{ state, version }`). */
export interface SaveBlob {
  version: number;
  state: Record<string, unknown>;
}

async function call<T>(server: string, token: string, method: string, path: string, body?: unknown, keepalive = false): Promise<T> {
  const response = await fetch(`${server.replace(/\/$/, "")}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    keepalive,
  });
  const reply = await response.json().catch(() => ({ error: "server_error" })) as T & { error?: string; detail?: string };
  if (!response.ok) throw new ApiFailure(reply.error ?? "server_error", response.status, reply.detail ?? undefined);
  return reply;
}

export const listCharacters = (server: string, token: string) =>
  call<{ characters: CharacterInfo[] }>(server, token, "GET", "/characters").then((r) => r.characters);
export const createCharacter = (server: string, token: string, name: string, gender: "male" | "female") =>
  call<CharacterInfo>(server, token, "POST", "/characters", { name, gender });
export const deleteCharacter = (server: string, token: string, id: string) =>
  call<{ deleted: string }>(server, token, "DELETE", `/characters/${encodeURIComponent(id)}`);
export const loadSave = (server: string, token: string, id: string) =>
  call<{ rev: number; save: SaveBlob | null }>(server, token, "GET", `/characters/${encodeURIComponent(id)}/save`);
/** Store a save built on `rev` (the server answers `stale` if another tab or device saved since). */
export const storeSave = (server: string, token: string, id: string, rev: number, save: SaveBlob, keepalive = false) =>
  call<{ rev: number; summary: CharacterInfo["summary"] }>(server, token, "PUT", `/characters/${encodeURIComponent(id)}/save`,
    { rev, version: save.version, state: save.state }, keepalive);

/** The one shared world (`same` when `rev` is still current). */
export const loadWorld = (server: string, token: string, rev?: number, pins: readonly string[] = []) => {
  const query = [rev === undefined ? "" : `rev=${rev}`, pins.length ? `pins=${pins.map(encodeURIComponent).join(",")}` : ""].filter(Boolean).join("&");
  return call<WorldReply>(server, token, "GET", query ? `/world?${query}` : "/world");
};
/** Tell the jianghu what the hero did; the server writes the rumor. */
export const postEcho = (server: string, token: string, echo: EchoRequest) =>
  call<{ rev: number }>(server, token, "POST", "/world/echo", echo);

const battlePath = (id: string, what: string) => `/characters/${encodeURIComponent(id)}/battle/${what}`;
/** Stage the saved pending battle on the server: its seed and the exact fight. */
export const startBattle = (server: string, token: string, id: string) =>
  call<BattleStartReply>(server, token, "POST", battlePath(id, "start"), {});
/** Hand the server the commands played so far (it replays them as they come). */
export const logBattle = (server: string, token: string, id: string, log: BattleLogRequest) =>
  call<{ at: number }>(server, token, "POST", battlePath(id, "log"), log);
/** The last commands; the server's verdict and spoils. */
export const finishBattle = (server: string, token: string, id: string, log: BattleLogRequest) =>
  call<BattleVerdict>(server, token, "POST", battlePath(id, "finish"), log);

// ─── Friends, party, whispers, mail (docs/design/social.md) ───────────
/** Everything the สหาย and จดหมาย windows show. */
export const loadSocial = (server: string, token: string) => call<SocialSnapshot>(server, token, "GET", "/social");
/** A social action (`friends/request`, `whisper`, `mail/claim`, …) with its body. */
export const socialAction = <T = { ok: boolean }>(server: string, token: string, action: string, body: Record<string, unknown>) =>
  call<T>(server, token, "POST", `/social/${action}`, body);
/** A party action (`invite`, `accept`, `decline`, `leave`, `kick`, `lead`, `chat`). */
export const partyAction = <T = { ok: boolean }>(server: string, token: string, action: string, body: Record<string, unknown>) =>
  call<T>(server, token, "POST", `/party/${action}`, body);
/** Send a letter; the save in it pays the parcel and postage. */
export const sendMail = (server: string, token: string, request: SendMailRequest) =>
  call<{ rev: number; mailId: string; delivered: boolean; reason: string }>(server, token, "POST", "/social/mail/send", request as unknown as Record<string, unknown>);
/** Take a letter's parcel (gold joins the character's save allowance). */
export const claimMail = (server: string, token: string, id: string, characterId: string) =>
  call<{ parcel: Parcel }>(server, token, "POST", "/social/mail/claim", { id, characterId });

/** The social socket's URL: `ws(s)://<server>/social/ws?token=…`. */
export function socialUrl(server: string, token: string): string {
  return `${server.replace(/\/$/, "").replace(/^http/, "ws")}/social/ws?token=${encodeURIComponent(token)}`;
}

export interface RoomOptions {
  server: string;
  token: string;
  room: string;
  /** Who walks in and where (sent as `hello` when the socket opens). */
  hello: { name: string; body: HeroBody; x: number; y: number; dir: Dir8 } & Partial<Look>;
  onMessage: (message: ServerMsg) => void;
  onOpen?: () => void;
  /** The socket closed (`code` 4001: replaced by another login; 4002: protocol version). */
  onClose?: (code: number, reason: string) => void;
}

export interface RoomConnection {
  move: (motion: Motion) => void;
  sync: () => void;
  ping: () => void;
  /** Say a line to everyone on the map. */
  say: (text: string) => void;
  /** Tell the room the hero's look changed. */
  look: (look: Look) => void;
  close: () => void;
  readonly isOpen: boolean;
}

/** The room's WebSocket URL: `ws(s)://<server>/rooms/<room>/ws?token=…`. */
export function roomUrl(server: string, room: string, token: string): string {
  const base = server.replace(/\/$/, "").replace(/^http/, "ws");
  return `${base}/rooms/${encodeURIComponent(room)}/ws?token=${encodeURIComponent(token)}`;
}

/** Open one socket into one room. Reconnecting is the caller's job (lib/net/session.ts). */
export function connectRoom(options: RoomOptions): RoomConnection {
  const socket = new WebSocket(roomUrl(options.server, options.room, options.token));
  const send = (message: ClientMsg) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };
  socket.addEventListener("open", () => {
    send({ t: "hello", v: PROTOCOL_VERSION, outfit: "default", weapon: null, ...options.hello });
    options.onOpen?.();
  });
  socket.addEventListener("message", (event) => {
    if (typeof event.data !== "string") return;
    try {
      options.onMessage(JSON.parse(event.data) as ServerMsg);
    } catch {
      // A frame we cannot read is dropped; the seq gap brings a resync.
    }
  });
  socket.addEventListener("close", (event) => options.onClose?.(event.code, event.reason));
  return {
    move: (motion) => send({ t: "move", ...motion }),
    sync: () => send({ t: "sync" }),
    ping: () => send({ t: "ping", at: Date.now() }),
    say: (text) => send({ t: "say", text }),
    look: (look) => send({ t: "look", ...look }),
    close: () => socket.close(1000, "bye"),
    get isOpen() { return socket.readyState === WebSocket.OPEN; },
  };
}
