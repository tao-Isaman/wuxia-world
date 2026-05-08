"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useConfirmStore } from "@/store/confirm-store";
import { cn } from "@/lib/utils";

// Renders the active confirm prompt from the store. Mounted once at the
// world-screen root next to ToastStack / LoadingOverlay. The store holds
// at most one active dialog, so this component is either rendering it or
// is invisible.
//
// Variant styling: `danger` → vermilion (red); `warn` → amber; `default`
// → neutral. Only the confirm button colour shifts — the cancel button
// stays neutral so dismissing always feels safe.
export function ConfirmDialog() {
  const active = useConfirmStore((s) => s.active);
  const resolve = useConfirmStore((s) => s.resolve);

  // Enter = confirm, Esc = cancel. Modal already wires Esc; we add Enter.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        resolve(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, resolve]);

  if (!active) return null;
  const variant = active.variant ?? "default";

  return (
    <Modal
      open
      onClose={() => resolve(false)}
      title={active.title ?? "ยืนยัน"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-line",
            variant === "danger" && "text-rose-900",
            variant === "warn" && "text-amber-900",
          )}
        >
          {active.message}
        </p>
        <div className="flex gap-2 justify-end pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resolve(false)}
            className="text-xs"
          >
            {active.cancelText ?? "ยกเลิก"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => resolve(true)}
            className={cn(
              "text-xs",
              variant === "danger" && "bg-rose-700 hover:bg-rose-800 text-white",
              variant === "warn" && "bg-amber-600 hover:bg-amber-700 text-white",
            )}
            autoFocus
          >
            {active.confirmText ?? "ยืนยัน"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
