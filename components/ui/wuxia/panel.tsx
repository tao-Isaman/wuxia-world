import * as React from "react";
import { cn } from "@/lib/utils";

// Panel — pixel-bordered frame, the canonical world-UI replacement for
// shadcn Card. Uses the `.frame-pixel` (vermilion-accented) or
// `.frame-pixel-quiet` (ink-only) 9-slice border defined in globals.css.
//
// Scroll discipline (locked from pressure-test): when used inside a Modal
// or anywhere the inner content overflows, the Panel itself MUST NOT have
// `overflow: auto` — the 9-slice border-image clips ugly at the scroll
// edge. Wrap the scrollable region inside the Panel:
//
//   <Panel><div className="overflow-y-auto max-h-[70vh]">...</div></Panel>
//
// Variants:
//   "default" — vermilion-accented frame, used for primary surfaces
//                (status bar, main location card, profile / inventory
//                roots).
//   "quiet"   — ink-only frame for inner / nested panels (popup body,
//                section sub-cards, slot rows) so the chrome doesn't
//                fight at every nest level.
//   "flat"    — no frame, just the cream background. For toasts (where
//                stacking on a modal would double-bevel) and rare
//                in-line surfaces.

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "quiet" | "flat";
  // Inner padding. Use the standard Tailwind p-* sizes ("p-3", "p-4") —
  // applied to a child wrapper so the border-image stays untouched. Pass
  // an empty string to let the consumer set padding themselves on inner
  // children (e.g., when the panel hosts a complex layout).
  padding?: string;
}

const VARIANT_FRAME: Record<NonNullable<PanelProps["variant"]>, string> = {
  default: "frame-pixel",
  quiet: "frame-pixel-quiet",
  flat: "border border-border",
};

export function Panel({
  className,
  variant = "default",
  padding = "p-3",
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        VARIANT_FRAME[variant],
        "bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className={padding}>{children}</div>
    </div>
  );
}
