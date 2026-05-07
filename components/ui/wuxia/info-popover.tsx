"use client";

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Hover / tap popover for quick info reveals (skill / art / equipment
// tooltips). Built on Radix Popover (already a dep) so we get
// viewport-aware positioning, escape, and outside-click closing for
// free.
//
// Behavior:
//   - Desktop: hover trigger → opens; mouse leaving trigger AND content
//     → closes. Mouse over content keeps it open (useful for long
//     tooltip cards).
//   - Mobile: tap trigger → toggles. Tap outside → closes (Radix
//     handles via dismissable layer).
//   - Always: focus trigger → opens (a11y).
//
// Why not Radix Tooltip? Radix's tooltip is hover/focus-only by design
// and explicitly skips touch — Popover with custom hover handlers gives
// us both desktop hover and mobile tap from one primitive.

interface InfoPopoverProps {
  /** The element shown inline; clicking / hovering it opens the popover. */
  trigger: React.ReactNode;
  /** Popover body content. Use the SkillTooltip / ArtTooltip wrappers. */
  children: React.ReactNode;
  /** Side preference. Default top. */
  side?: "top" | "bottom" | "left" | "right";
  /** Alignment along the chosen side. Default start so the card snaps
   *  to the trigger's leading edge — better for left-anchored skill
   *  rows where centering would push the card off-screen. */
  align?: "start" | "center" | "end";
  /** Optional extra classes on the popover content. */
  contentClassName?: string;
}

export function InfoPopover({
  trigger,
  children,
  side = "top",
  align = "start",
  contentClassName,
}: InfoPopoverProps) {
  const [open, setOpen] = React.useState(false);

  // Track the hover state of trigger and content separately so the
  // popover only closes when the cursor truly leaves both. Without this,
  // moving the mouse from the trigger into the popover content would
  // briefly fall through "neither hovered" and shut the popover — making
  // long tooltip cards unreadable.
  const triggerHover = React.useRef(false);
  const contentHover = React.useRef(false);

  const onEnter = (which: "trigger" | "content") => {
    if (which === "trigger") triggerHover.current = true;
    else contentHover.current = true;
    setOpen(true);
  };
  const onLeave = (which: "trigger" | "content") => {
    if (which === "trigger") triggerHover.current = false;
    else contentHover.current = false;
    // Defer the close one tick so the cursor has time to land on the
    // counterpart (trigger ↔ content) without flickering.
    window.setTimeout(() => {
      if (!triggerHover.current && !contentHover.current) setOpen(false);
    }, 60);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          // Inline-block so the trigger occupies its child's footprint
          // exactly — important inside flex rows that already lay out
          // skill names with badges.
          className="inline-flex items-center"
          onMouseEnter={() => onEnter("trigger")}
          onMouseLeave={() => onLeave("trigger")}
          onFocus={() => onEnter("trigger")}
          onBlur={() => onLeave("trigger")}
        >
          {trigger}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className={cn(
          "w-80 max-w-[90vw] p-3 text-xs leading-relaxed",
          contentClassName,
        )}
        onMouseEnter={() => onEnter("content")}
        onMouseLeave={() => onLeave("content")}
        // Radix's outside-click dismiss handles mobile tap-away. Opt
        // into auto-focus skip so hover doesn't yank focus from the
        // surrounding form / popup.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
