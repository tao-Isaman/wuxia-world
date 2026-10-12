// The social socket in the browser (docs/design/social.md): one socket to the
// account's own PlayerHub on the game server. The hub pushes what happens to
// the player (a whisper, a friend request, new mail, the party); the browser
// tells it who it plays and where (`status`), which is what friends and the
// party see. Reconnects with back-off; no React, no store (store/social-store.ts
// drives it).
import { socialUrl } from "./client";
import type { SocialClientMsg, SocialPush } from "./social-protocol";

const RETRY_MS = [1000, 2000, 4000, 8000, 15_000, 30_000];
const PING_MS = 25_000;

export type SocialStatus = "off" | "connecting" | "online" | "offline";

export interface SocialConfig {
  server: string;
  token: string;
}

export interface HeroStatus {
  name: string;
  body: string;
  location: string | null;
  characterId: string | null;
}

export class SocialSocket {
  private config: SocialConfig | null = null;
  private socket: WebSocket | null = null;
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private hero: HeroStatus | null = null;
  status: SocialStatus = "off";
  onPush: (message: SocialPush) => void = () => {};
  /** The socket (re)opened: the snapshot may be stale. */
  onOpen: () => void = () => {};
  onStatus: (status: SocialStatus) => void = () => {};

  configure(config: SocialConfig | null): void {
    if (JSON.stringify(config) === JSON.stringify(this.config)) return;
    this.close();
    this.config = config;
    this.retry = 0;
    if (config) this.open();
    else this.setStatus("off");
  }

  /** Tell the hub who the player is and where they stand (sent again on every reconnect). */
  setHero(hero: HeroStatus | null): void {
    const same = JSON.stringify(hero) === JSON.stringify(this.hero);
    this.hero = hero;
    if (!same && hero) this.send({ t: "status", ...hero });
  }

  private send(message: SocialClientMsg): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private setStatus(status: SocialStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.onStatus(status);
  }

  private open(): void {
    const config = this.config;
    if (!config) return;
    this.setStatus("connecting");
    const socket = new WebSocket(socialUrl(config.server, config.token));
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (socket !== this.socket) return;
      this.retry = 0;
      this.setStatus("online");
      if (this.hero) this.send({ t: "status", ...this.hero });
      this.pingTimer ??= setInterval(() => this.send({ t: "ping" }), PING_MS);
      this.onOpen();
    });
    socket.addEventListener("message", (event) => {
      if (socket !== this.socket || typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as SocialPush | { t: "pong" };
        if (message.t !== "pong") this.onPush(message);
      } catch {
        // An unreadable frame is dropped.
      }
    });
    socket.addEventListener("close", () => {
      if (socket !== this.socket) return;
      this.socket = null;
      this.setStatus("offline");
      this.scheduleRetry();
    });
  }

  private scheduleRetry(): void {
    if (this.retryTimer || !this.config) return;
    const wait = RETRY_MS[Math.min(this.retry, RETRY_MS.length - 1)];
    this.retry++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.socket && this.config) this.open();
    }, wait);
  }

  private close(): void {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, "bye");
  }
}

/** The one social socket of this page. */
export const socialSocket = new SocialSocket();
