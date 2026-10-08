// The online session in the browser (docs/online.md): one socket into the
// room of the map the hero stands on. The map runtime drives it every frame
// through `report(room, motion)` — that is what joins a room (with the hero's
// real position), switches rooms on a new map, and sends moves (throttled).
// When the map stops reporting (a battle, a menu over a painting, a closed
// tab) the socket is closed after a short while, so others see the hero leave.
import { connectRoom, type RoomConnection } from "./client";
import { applyServerMsg, emptyPresence, othersIn, type PresenceState } from "./presence";
import type { HeroBody, Motion, Presence } from "./protocol";

/** Moves are sent at most this often while walking (ms)… */
export const MOVE_INTERVAL_MS = 100;
/** …and a standing hero re-sends nothing. A silent map closes the socket after this long. */
export const IDLE_CLOSE_MS = 15_000;
const PING_MS = 20_000;
const RETRY_MS = [1000, 2000, 4000, 8000, 15_000];

export type OnlineStatus = "off" | "connecting" | "online" | "offline" | "replaced";

export interface OnlineConfig {
  server: string;
  token: string;
  name: string;
  body: HeroBody;
}

type Listener = () => void;

export class OnlineSession {
  private config: OnlineConfig | null = null;
  private conn: RoomConnection | null = null;
  private room: string | null = null;
  private presence: PresenceState = emptyPresence();
  private others: Presence[] = [];
  private lastMotion: Motion | null = null;
  private lastSent: Motion | null = null;
  private lastSentAt = 0;
  private lastReportAt = 0;
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  status: OnlineStatus = "off";

  /** Sign in (or out, with null): the next report joins the current map. */
  configure(config: OnlineConfig | null) {
    const changed = JSON.stringify(config) !== JSON.stringify(this.config);
    this.config = config;
    if (!changed) return;
    this.disconnect();
    this.setStatus(config ? "offline" : "off");
  }

  /** Everyone else on the room's map (read every frame by the runtime). */
  players(room: string): readonly Presence[] {
    return room === this.room ? this.others : [];
  }

  /** The hero on `room`'s map is at `motion` now. */
  report(room: string, motion: Motion) {
    if (!this.config || this.status === "replaced") return;
    this.lastReportAt = Date.now();
    this.lastMotion = motion;
    if (room !== this.room) {
      this.disconnect();
      this.room = room;
      this.open();
      return;
    }
    if (!this.conn?.isOpen || this.presence.epoch === null) return;
    const last = this.lastSent;
    const changed = !last || last.x !== motion.x || last.y !== motion.y || last.dir !== motion.dir || last.moving !== motion.moving;
    if (!changed) return;
    // Starting or stopping goes out at once; steps in between at MOVE_INTERVAL_MS.
    const urgent = !last || last.moving !== motion.moving;
    if (!urgent && Date.now() - this.lastSentAt < MOVE_INTERVAL_MS) return;
    this.conn.move(motion);
    this.lastSent = motion;
    this.lastSentAt = Date.now();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Who is in the current room (for the HUD), us included. */
  get roomSize(): number {
    return Object.keys(this.presence.players).length;
  }

  get currentRoom(): string | null {
    return this.room;
  }

  private setStatus(status: OnlineStatus) {
    if (this.status === status) return;
    this.status = status;
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }

  private open() {
    const config = this.config;
    const room = this.room;
    const motion = this.lastMotion;
    if (!config || !room || !motion) return;
    this.setStatus("connecting");
    this.presence = emptyPresence();
    this.others = [];
    this.lastSent = { ...motion };
    this.lastSentAt = Date.now();
    const conn = connectRoom({
      server: config.server,
      token: config.token,
      room,
      hello: { name: config.name, body: config.body, x: motion.x, y: motion.y, dir: motion.dir },
      onMessage: (message) => {
        if (conn !== this.conn) return;
        if (message.t === "error" && message.code === "replaced") { this.setStatus("replaced"); return; }
        const { state, resync } = applyServerMsg(this.presence, message);
        if (resync) conn.sync();
        if (state !== this.presence) {
          this.presence = state;
          this.others = othersIn(state);
          if (message.t === "welcome") { this.retry = 0; this.setStatus("online"); }
          this.emit();
        }
      },
      onClose: (code) => {
        if (conn !== this.conn) return;
        this.conn = null;
        this.presence = emptyPresence();
        this.others = [];
        if (code === 4001) { this.setStatus("replaced"); return; }
        this.setStatus("offline");
        this.scheduleRetry();
      },
    });
    this.conn = conn;
    this.timer ??= setInterval(() => this.housekeep(), 1000);
  }

  private scheduleRetry() {
    if (this.retryTimer || !this.config) return;
    const wait = RETRY_MS[Math.min(this.retry, RETRY_MS.length - 1)];
    this.retry++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      // Only while the map is still reporting; otherwise the next report reopens it.
      if (!this.conn && this.room && Date.now() - this.lastReportAt < IDLE_CLOSE_MS) this.open();
    }, wait);
  }

  private lastPing = 0;
  private housekeep() {
    if (!this.conn) return;
    const now = Date.now();
    if (now - this.lastReportAt > IDLE_CLOSE_MS) {
      // Nobody is drawing this map any more: leave the room until it reports again.
      this.disconnect();
      this.setStatus(this.config ? "offline" : "off");
      return;
    }
    if (now - this.lastPing > PING_MS) { this.lastPing = now; this.conn.ping(); }
  }

  private disconnect() {
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    const conn = this.conn;
    this.conn = null;
    conn?.close();
    this.room = null;
    this.presence = emptyPresence();
    this.others = [];
    this.lastSent = null;
    this.emit();
  }
}

/** The one session of this page. */
export const onlineSession = new OnlineSession();
