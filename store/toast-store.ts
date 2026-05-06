"use client";

import { create } from "zustand";

// ─── Toast notifications ──────────────────────────────────────────────
// Stack of short-lived messages shown at the top of the world screen.
// Used by every player-driven action (rest / gather / craft / shop) to
// surface the result without taking up inline UI space.
//
// Toasts auto-dismiss after `duration` ms (default 2.6 s) so they stay
// out of the way during a fast play loop. Up to MAX_VISIBLE are shown
// simultaneously — older toasts shift up as new ones come in.

export type ToastKind = "success" | "info" | "warn" | "error";

export interface ToastEntry {
  id: number;
  kind: ToastKind;
  message: string;
  // Wall-clock ms timestamp when this toast appeared. Renderer uses this
  // to compute fade-out timing if it wants animation later.
  createdAt: number;
}

interface ToastStore {
  toasts: ToastEntry[];
  push: (kind: ToastKind, message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

export const TOAST_DEFAULT_DURATION_MS = 2600;
export const TOAST_MAX_VISIBLE = 3;

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (kind, message, durationMs = TOAST_DEFAULT_DURATION_MS) => {
    const id = nextId++;
    const entry: ToastEntry = { id, kind, message, createdAt: Date.now() };
    set((s) => {
      const next = [...s.toasts, entry];
      // Keep at most MAX_VISIBLE; drop the oldest first.
      while (next.length > TOAST_MAX_VISIBLE) next.shift();
      return { toasts: next };
    });
    if (typeof window !== "undefined") {
      const t = setTimeout(() => {
        timers.delete(id);
        get().dismiss(id);
      }, durationMs);
      timers.set(id, t);
    }
  },
  dismiss: (id) => {
    const t = timers.get(id);
    if (t) {
      clearTimeout(t);
      timers.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
  },
}));

// Convenience helpers — most callers want a single line.
export function toast(kind: ToastKind, message: string, durationMs?: number): void {
  useToastStore.getState().push(kind, message, durationMs);
}
