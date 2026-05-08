"use client";

import { create } from "zustand";

// ─── Themed confirmation dialog ───────────────────────────────────────
// Replaces `window.confirm()` with a wuxia-styled modal. Promise-based:
// callers `await confirmDialog({ title, message })` and get true/false
// when the user picks. Only one confirm can be active at a time — calling
// while another is open immediately resolves the previous one to false.
//
// Visual variants:
//   - "default" — neutral border/colour
//   - "warn"    — amber accent (steal / kidnap / one-shot side quests)
//   - "danger"  — vermilion accent (assassination, abandonment)

export type ConfirmVariant = "default" | "warn" | "danger";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ActiveConfirm extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

interface ConfirmStore {
  active: ActiveConfirm | null;
  open: (opts: ConfirmOptions) => Promise<boolean>;
  // Resolve the active confirm with the given value. Calling with no
  // active confirm is a no-op (covers double-clicks / async races).
  resolve: (value: boolean) => void;
}

let nextId = 1;

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  active: null,
  open: (opts) =>
    new Promise<boolean>((resolve) => {
      // If a previous confirm is still open, reject it false so callers
      // don't hang. The new confirm replaces it.
      const prev = get().active;
      if (prev) prev.resolve(false);
      const id = nextId++;
      set({ active: { ...opts, id, resolve } });
    }),
  resolve: (value) => {
    const cur = get().active;
    if (!cur) return;
    cur.resolve(value);
    set({ active: null });
  },
}));

// One-line helper for callers — `await confirmDialog({ message })` is
// the drop-in replacement for `window.confirm(message)`.
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().open(opts);
}
