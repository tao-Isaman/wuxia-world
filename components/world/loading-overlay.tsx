"use client";

import { useLoadingStore } from "@/store/loading-store";

// Full-screen translucent overlay with a spinner + message. Shown for ~300ms
// while a world action (gather / travel / craft) is "happening" — even
// though the underlying store call is synchronous, the brief flash gives
// the click a satisfying weight.
//
// Mounted once at the top level in WorldScreen so it sits above every
// scene / popup. Pointer events fall through (`pointer-events-none`) so
// the overlay doesn't accidentally swallow taps if a click triggers a
// follow-up action while it's still visible.
export function LoadingOverlay() {
  const active = useLoadingStore((s) => s.active);
  const message = useLoadingStore((s) => s.message);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 pointer-events-none"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm font-medium">{message || "กำลังโหลด..."}</span>
      </div>
    </div>
  );
}
