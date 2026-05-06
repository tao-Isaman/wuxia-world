"use client";

import { useToastStore, type ToastKind } from "@/store/toast-store";

// Top-of-screen toast stack. Mounted once at the WorldScreen root. Each
// entry has a kind that drives its colour: success (emerald), info
// (slate), warn (amber), error (rose). Tap a toast to dismiss it early.

const KIND_STYLES: Record<ToastKind, string> = {
  success: "border-emerald-500/60 bg-emerald-50 text-emerald-900",
  info:    "border-slate-400/60 bg-slate-50 text-slate-900",
  warn:    "border-amber-500/60 bg-amber-50 text-amber-900",
  error:   "border-rose-500/60 bg-rose-50 text-rose-900",
};

const KIND_ICON: Record<ToastKind, string> = {
  success: "✓",
  info:    "ℹ",
  warn:    "⚠",
  error:   "✕",
};

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-1.5 pointer-events-none w-full max-w-md px-3">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto w-full text-left rounded-md border px-3 py-2 shadow-md text-xs flex items-start gap-2 ${KIND_STYLES[t.kind]}`}
          aria-live="polite"
        >
          <span className="font-bold text-sm leading-tight shrink-0">{KIND_ICON[t.kind]}</span>
          <span className="flex-1 leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
