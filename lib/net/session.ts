// The online session in the browser (docs/online.md): one socket into the
// room of the map the hero stands on. The map runtime drives it every frame
// through `report(room, motion)` — that is what joins a room (with the hero's
// real position), switches rooms on a new map, and sends moves (throttled).
// When the map stops reporting (a battle, a menu over a painting, a closed
// tab) the socket is closed after a short while, so others see the hero leave.
import { connectRoom, type RoomConnection } from "./client";
import { applyServerMsg, emptyPresence, othersIn, type PresenceState } from "./presence";
import type { HeroBody, Look, Motion, Presence } from "./protocol";

/** A line of map chat as the chat box shows it. */
export interface MapLine {
  id: string;
  name: string;
  text: string;
  at: number;
}

/** How long a chat line floats over its speaker's head (ms). */
export const BUBBLE_MS = 6000;

/** Moves are sent at most this often while walking (ms)… */
export const MOVE_INTERVAL_MS = 100;
/** …and a standing hero re-sends nothing. A silent map closes the socket after this long. */
export const IDLE_CLOSE_MS = 15_000;
const PING_MS = 20_000;
/**
 * The room refuses a step longer than walking could make (server/core/src/room.rs
 * WALK_SPEED × SPEED_SLACK per second + JUMP_SLACK). A hero placed somewhere
 * else on the same map (the arrival side after a scene change, a warp) rejoins
 * there instead of sending a move the room would refuse.
 */
const WALK_REACH_PER_S = 150 * 1.6 * 0.8;
const JUMP_REACH = 40;
/** A refusal within this long of a chat line is that line's (`too_fast`); others are not chat's (ms). */
const SAY_ERROR_WINDOW_MS = 3000;
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
  /** The hero's look (outfit, carried weapon): sent in `hello`, and as `look` when it changes. */
  private look: Look = { outfit: "default", weapon: null };
  private lastSent: Motion | null = null;
  private lastSentAt = 0;
  /** When we last said a line on this map (a `too_fast` soon after is the chat's). */
  private lastSayAt = 0;
  private lastReportAt = 0;
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private chatListeners = new Set<(line: MapLine) => void>();
  private chatErrorListeners = new Set<(code: string) => void>();
  /** The last line each player said on this map (for bubbles). */
  private bubbles = new Map<string, MapLine>();
  /** The seq of the last chat line heard (a line arriving out of order is still shown, once). */
  private lastSaidSeq = 0;
  status: OnlineStatus = "off";

  /** Sign in (or out, with null): the next report joins the current map. */
  configure(config: OnlineConfig | null) {
    const changed = JSON.stringify(config) !== JSON.stringify(this.config);
    this.config = config;
    if (!changed) return;
    this.disconnect();
    this.setStatus(config ? "offline" : "off");
  }

  /** The hero's look now; others see a change at once (no rejoin). */
  setLook(look: Look) {
    if (look.outfit === this.look.outfit && look.weapon === this.look.weapon) return;
    this.look = { ...look };
    if (this.conn?.isOpen && this.presence.epoch !== null) this.conn.look(this.look);
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
    // Placed far away on the same map (not walked there): rejoin at the new spot.
    if (last) {
      const reach = WALK_REACH_PER_S * Math.max(0, Date.now() - this.lastSentAt) / 1000 + JUMP_REACH;
      if (Math.hypot(motion.x - last.x, motion.y - last.y) > reach) {
        this.disconnect();
        this.room = room;
        this.open();
        return;
      }
    }
    // Starting or stopping goes out at once; steps in between at MOVE_INTERVAL_MS.
    const urgent = !last || last.moving !== motion.moving;
    if (!urgent && Date.now() - this.lastSentAt < MOVE_INTERVAL_MS) return;
    this.conn.move(motion);
    this.lastSent = motion;
    this.lastSentAt = Date.now();
  }

  /** Say a line to everyone on this map; false when not in a room. */
  say(text: string): boolean {
    if (!this.conn?.isOpen || this.presence.epoch === null) return false;
    this.conn.say(text);
    this.lastSayAt = Date.now();
    return true;
  }

  /** Every map chat line heard (ours included, as the server echoes it). */
  onChat(listener: (line: MapLine) => void): () => void {
    this.chatListeners.add(listener);
    return () => { this.chatListeners.delete(listener); };
  }

  /** A map chat line the server refused (`too_fast`, `bad_text`). */
  onChatError(listener: (code: string) => void): () => void {
    this.chatErrorListeners.add(listener);
    return () => { this.chatErrorListeners.delete(listener); };
  }

  /** What `id` said in the last few seconds on `room`'s map (drawn over their head), or null. */
  bubble(room: string, id: string): string | null {
    if (room !== this.room) return null;
    const line = this.bubbles.get(id);
    return line && Date.now() - line.at < BUBBLE_MS ? line.text : null;
  }

  /** Our own username in the room (null before the welcome). */
  get you(): string | null {
    return this.presence.you;
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
    this.lastSaidSeq = 0;
    this.lastSent = { ...motion };
    this.lastSentAt = Date.now();
    const conn = connectRoom({
      server: config.server,
      token: config.token,
      room,
      hello: { name: config.name, body: config.body, x: motion.x, y: motion.y, dir: motion.dir, ...this.look },
      onMessage: (message) => {
        if (conn !== this.conn) return;
        if (message.t === "error" && message.code === "replaced") { this.setStatus("replaced"); return; }
        // Only a refused chat line reaches the chat (a refused step is not "typing too fast").
        if (message.t === "error" && (message.code === "too_fast" || message.code === "bad_text") && Date.now() - this.lastSayAt < SAY_ERROR_WINDOW_MS) {
          for (const listener of this.chatErrorListeners) listener(message.code);
        }
        if (message.t === "event" && message.ev.t === "said" && message.seq > Math.max(this.presence.seq, this.lastSaidSeq)) {
          this.lastSaidSeq = message.seq;
          const line: MapLine = { id: message.ev.id, name: message.ev.name, text: message.ev.text, at: Date.now() };
          this.bubbles.set(line.id, line);
          for (const listener of this.chatListeners) listener(line);
        }
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
    this.bubbles.clear();
    this.lastSent = null;
    this.emit();
  }
}

/** The one session of this page. */
export const onlineSession = new OnlineSession();
