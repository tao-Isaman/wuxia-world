// The low-level client for the game server (docs/online.md): the HTTP auth
// calls and one WebSocket into one room. No React, no store — the browser
// (lib/net/session.ts) and the server test (scripts/test-online-server.ts)
// both use it.
import { PROTOCOL_VERSION, type ClientMsg, type HeroBody, type Motion, type ServerMsg, type Session } from "./protocol";
import type { Dir8 } from "@/lib/characters/walk8";

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

export interface RoomOptions {
  server: string;
  token: string;
  room: string;
  /** Who walks in and where (sent as `hello` when the socket opens). */
  hello: { name: string; body: HeroBody; x: number; y: number; dir: Dir8 };
  onMessage: (message: ServerMsg) => void;
  onOpen?: () => void;
  /** The socket closed (`code` 4001: replaced by another login; 4002: protocol version). */
  onClose?: (code: number, reason: string) => void;
}

export interface RoomConnection {
  move: (motion: Motion) => void;
  sync: () => void;
  ping: () => void;
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
    send({ t: "hello", v: PROTOCOL_VERSION, ...options.hello });
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
    close: () => socket.close(1000, "bye"),
    get isOpen() { return socket.readyState === WebSocket.OPEN; },
  };
}
