// Saves on the game server (docs/online.md#characters-and-saves). With a game
// server set the world store does not use localStorage: its persist storage
// is `cloudSave.storage`, bound to the character being played, and the shared
// world goes through `cloudSave.world` (a WorldService). No React, no store
// imports: store/cloud-session.ts drives it.
//
// Writes are debounced (the store changes many times a second) and build on
// the save the server holds (`rev`): if another tab or device saved since,
// the server answers `stale` and this one stops writing (status `conflict`)
// until the character is entered again. A save the server refuses (gold too
// fast, a broken number) stops writing too (status `rejected`); a network
// failure retries.
import type { StateStorage } from "zustand/middleware";
import type { SharedWorld, WorldService } from "@/lib/world/shared/world";
import { ApiFailure, loadSave, storeSave, storeWorld, type SaveBlob } from "./client";
import { gameServerUrl } from "./config";

export type CloudStatus = "off" | "saved" | "saving" | "offline" | "conflict" | "rejected";

/** Debounce of save and world writes, ms (the server allows one save a second). */
export const SAVE_DEBOUNCE_MS = 1500;
const WORLD_DEBOUNCE_MS = 4000;
const RETRY_MS = 5000;

interface Active {
  server: string;
  token: string;
  id: string;
  /** The rev of the save the server holds (and our next write builds on). */
  rev: number;
}

/** Whether saves go to the game server: a server is set (production always). */
export const cloudMode = (): boolean => gameServerUrl() !== null;

class CloudSave {
  private active: Active | null = null;
  private paused = true;
  private pending: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inflight: Promise<void> | null = null;
  private worldCache: SharedWorld | null = null;
  private worldPending: SharedWorld | null = null;
  private worldTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  status: CloudStatus = "off";
  /** The server's code for the last refusal (`gold_too_fast`, `bad_save`…). */
  lastError: string | null = null;

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(status: CloudStatus, error: string | null = this.lastError): void {
    this.status = status;
    this.lastError = error;
    for (const listener of this.listeners) listener();
  }

  /** Bind to a character (writes stay paused until `resume`). */
  select(server: string, token: string, id: string): void {
    this.clear();
    this.active = { server, token, id, rev: 0 };
    this.paused = true;
    this.set("saved", null);
  }

  /** Start writing (after the character's save has loaded). */
  resume(): void {
    this.paused = false;
  }

  /** Stop writing and forget the character (after `flush`). */
  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.worldTimer) clearTimeout(this.worldTimer);
    this.timer = this.worldTimer = null;
    this.pending = this.worldPending = null;
    this.worldCache = null;
    this.active = null;
    this.paused = true;
    this.set("off", null);
  }

  get characterId(): string | null {
    return this.active?.id ?? null;
  }

  /** zustand persist's storage: the active character's save on the server. */
  readonly storage: StateStorage = {
    getItem: async () => {
      const active = this.active;
      if (!active) return null;
      const { rev, save } = await loadSave(active.server, active.token, active.id);
      if (this.active !== active) return null;
      active.rev = rev;
      return save ? JSON.stringify(save) : null;
    },
    setItem: (_name, value) => {
      if (!this.active || this.paused || this.status === "conflict" || this.status === "rejected") return;
      // A hero-less state (a reset) is not a save: the server would refuse it.
      if (value.includes('"hasGame":false')) return;
      this.pending = value;
      this.schedule(SAVE_DEBOUNCE_MS);
    },
    removeItem: () => {},
  };

  private schedule(ms: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, ms);
  }

  /** Write the pending save now (`keepalive` lets it finish as the page closes). */
  async flush(keepalive = false): Promise<void> {
    if (this.inflight) await this.inflight;
    const active = this.active;
    const value = this.pending;
    if (!active || value === null || this.paused) return;
    this.pending = null;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const save = JSON.parse(value) as SaveBlob;
    this.set("saving");
    this.inflight = (async () => {
      try {
        const { rev } = await storeSave(active.server, active.token, active.id, active.rev, save, keepalive);
        if (this.active !== active) return;
        active.rev = rev;
        this.set(this.pending ? "saving" : "saved", null);
      } catch (error) {
        if (this.active !== active) return;
        if (error instanceof ApiFailure) {
          if (error.code === "too_fast") {
            this.pending ??= value;
            this.schedule(1200);
          } else if (error.code === "stale") {
            this.set("conflict", error.code);
          } else {
            this.set("rejected", error.detail ? `${error.code}:${error.detail}` : error.code);
          }
        } else {
          // No answer: keep the newest save and try again.
          this.pending ??= value;
          this.set("offline");
          this.schedule(RETRY_MS);
        }
      }
    })();
    await this.inflight;
    this.inflight = null;
    if (this.pending && !this.timer && this.status === "saving") this.schedule(SAVE_DEBOUNCE_MS);
  }

  /** The account's shared world, loaded before the save (`WorldService.load` is synchronous). */
  setWorld(world: SharedWorld | null): void {
    this.worldCache = world;
  }

  readonly world: WorldService = {
    load: () => this.worldCache,
    save: (world) => {
      this.worldCache = world;
      if (!this.active || this.paused) return;
      this.worldPending = world;
      if (this.worldTimer) clearTimeout(this.worldTimer);
      this.worldTimer = setTimeout(() => { this.worldTimer = null; void this.flushWorld(); }, WORLD_DEBOUNCE_MS);
    },
  };

  async flushWorld(keepalive = false): Promise<void> {
    const active = this.active;
    const world = this.worldPending;
    if (!active || !world) return;
    this.worldPending = null;
    if (this.worldTimer) { clearTimeout(this.worldTimer); this.worldTimer = null; }
    try {
      await storeWorld(active.server, active.token, world, keepalive);
    } catch {
      if (this.active === active && !this.worldPending) {
        this.worldPending = world;
        this.worldTimer = setTimeout(() => { this.worldTimer = null; void this.flushWorld(); }, RETRY_MS);
      }
    }
  }

  /** Write everything pending (leaving a character, signing out, closing the page). */
  async flushAll(keepalive = false): Promise<void> {
    await Promise.all([this.flush(keepalive), this.flushWorld(keepalive)]);
  }
}

export const cloudSave = new CloudSave();
