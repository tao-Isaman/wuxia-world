"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

// Progress — Radix-backed progress bar. After the wuxia redesign two new
// affordances were added without losing existing call-site compatibility:
//
//   1. `variant` — semantic preset that picks the indicator color from
//      the wuxia palette and adds a thin ink border so the bar sits
//      flush with pixel chrome. Existing calls without a variant render
//      the original cream-on-vermilion track and continue to honor
//      `indicatorColor` for one-off bars (e.g., the per-stat XP slivers
//      inside ProfilePopup).
//   2. `pixel` — turns off the smooth `transition-all` and snaps the
//      indicator into 5% steps via a CSS clip-path, giving the
//      classic-JRPG segmented look. Default is the smooth bar that
//      already shipped.

type ProgressVariant = "hp" | "qi" | "exp" | "stamina";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Hex / hsl override for the indicator. Wins over `variant` when set. */
  indicatorColor?: string;
  /** Disable the CSS transition on the indicator. Defaults to true (smooth).
   * The battle ATB bars set this false because they already update every
   * frame via rAF and a 150ms transition would smudge instant resets. */
  animate?: boolean;
  /** Picks an indicator color from the wuxia palette. */
  variant?: ProgressVariant;
  /** Render the indicator as 20 segmented blocks (classic-JRPG bar). */
  pixel?: boolean;
}

// Variant → indicator color. Tracks remain bg-secondary; only the fill
// shifts. HP / stamina lean warm so the player parses them at a glance.
const VARIANT_COLOR: Record<ProgressVariant, string> = {
  hp: "hsl(0 70% 48%)",       // lacquer red
  qi: "hsl(220 60% 45%)",     // ink-blue
  exp: "hsl(40 70% 45%)",     // antique gold
  stamina: "hsl(150 35% 38%)",// jade green
};

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    { className, value, indicatorColor, animate = true, variant, pixel, ...props },
    ref,
  ) => {
    const fill = indicatorColor ?? (variant ? VARIANT_COLOR[variant] : "hsl(var(--primary))");
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden bg-secondary",
          // Tracks for variant-marked bars get a hairline ink edge so they
          // sit flush against pixel chrome.
          variant && "border border-ink/70",
          // Default rounded corners only when no wuxia variant is chosen
          // (preserves the legacy look on /debug + battle ATB).
          !variant && !pixel && "rounded-full",
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1",
            animate && "transition-all",
            // Segmented JRPG-style fill — 20 vertical blocks via a tiled
            // gradient mask. Each segment is 5% wide, separated by a 1px
            // gap so the player reads discrete pips.
            pixel &&
              "[mask-image:repeating-linear-gradient(90deg,#000_0_calc(5%-1px),transparent_calc(5%-1px)_5%)]",
          )}
          style={{
            transform: `translateX(-${100 - (value ?? 0)}%)`,
            backgroundColor: fill,
          }}
        />
      </ProgressPrimitive.Root>
    );
  },
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
