"use client";

import { useEffect } from "react";
import { Card, CardContent } from "./card";
import { Button } from "./button";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  // Optional max-width override; defaults to a comfortable popup size.
  maxWidth?: string;
}

// Lightweight modal — backdrop click + Escape close, scrolls inside the card
// if the content overflows the viewport. Built on top of Card so the visual
// language matches the rest of the world UI.
export function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/50 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className={`w-full ${maxWidth} my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-bold">{title ?? ""}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-base"
              aria-label="ปิด"
            >
              ✕
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}
