"use client";

import { create } from "zustand";
import type { HeroPose } from "@/lib/characters/hero-actions";

// ─── Action "working" overlay ──────────────────────────────────────────
// While the hero gathers / crafts / rests / practises, a progress bar
// shows them working and the whole screen ignores input until it fills —
// no double actions, no walking off mid-task. The store calls themselves
// stay synchronous; this is the time the action takes on screen.
//
// Usage:  flashLoading("กำลังเก็บของ...");  gatherResource(id);

export type WorkKind = "work" | "rest" | "stealth";

interface LoadingStore {
  active: boolean;
  message: string;
  kind: WorkKind;
  duration: number;
  /** Increments per job so the bar restarts when a new job begins. */
  job: number;
  /** The painted loop the hero plays (mining, a sword form…); null shows the plain preview. */
  pose: HeroPose | null;
  show: (message: string, duration?: number, kind?: WorkKind, pose?: HeroPose | null) => void;
  hide: () => void;
}

let activeTimer: ReturnType<typeof setTimeout> | null = null;

export const ACTION_LOADING_DURATION_MS = 1000;

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  active: false,
  message: "",
  kind: "work",
  duration: ACTION_LOADING_DURATION_MS,
  job: 0,
  pose: null,
  show: (message, duration = ACTION_LOADING_DURATION_MS, kind = "work", pose = null) => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    set({ active: true, message, kind, duration, pose, job: get().job + 1 });
    if (typeof window !== "undefined") {
      activeTimer = setTimeout(() => {
        set({ active: false, message: "" });
        activeTimer = null;
      }, duration);
    }
  },
  hide: () => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    set({ active: false, message: "" });
  },
}));

// Convenience: import once where you trigger an action so call sites stay
// short — `flashLoading("เก็บของ")` instead of three lines of store work.
export function flashLoading(message: string, duration?: number, kind?: WorkKind, pose?: HeroPose | null): void {
  useLoadingStore.getState().show(message, duration, kind, pose);
}
