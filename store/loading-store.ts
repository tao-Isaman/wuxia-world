"use client";

import { create } from "zustand";

// ─── Action-loading overlay ────────────────────────────────────────────
// A tiny global store for a 0.3 s "loading" popup that flashes during
// world actions (gather / travel / craft). The actions themselves stay
// synchronous — this is purely visual feedback to make the click feel
// substantial rather than instantaneous.
//
// Usage:
//   useLoadingStore.getState().show("กำลังเก็บของ");
//   gatherResource(id);
//
// The overlay auto-hides after `duration` ms. Calling `show` again while
// active resets the timer with the new message.

interface LoadingStore {
  active: boolean;
  message: string;
  show: (message: string, duration?: number) => void;
  hide: () => void;
}

let activeTimer: ReturnType<typeof setTimeout> | null = null;

export const ACTION_LOADING_DURATION_MS = 1000;

export const useLoadingStore = create<LoadingStore>((set) => ({
  active: false,
  message: "",
  show: (message, duration = ACTION_LOADING_DURATION_MS) => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    set({ active: true, message });
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
export function flashLoading(message: string, duration?: number): void {
  useLoadingStore.getState().show(message, duration);
}
