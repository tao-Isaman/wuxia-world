"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// WuxiaButton — pixel-art chrome button using stacked box-shadow bevels
// (no border-image, simpler than Panel). The shadow recipe is defined as
// the `pixel` shadow token in tailwind.config.ts, with `pixel-down` as
// the pressed-state mirror.
//
// Three variants:
//   "default"     cream face + ink border + pixel bevel (most common)
//   "primary"     vermilion face for primary CTA (เริ่ม / ยืนยัน /
//                  รับภารกิจ)
//   "ghost"       transparent — for tertiary actions (ปิด / ลาจาก) where
//                  the pixel chrome would visually shout
//
// Sizes mirror shadcn's button — sm/default/lg — but render flat (no
// rounded corners, fixed pixel border).

const wuxiaButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "border-2 border-ink",
    "shadow-pixel active:shadow-pixel-down active:translate-y-0.5",
    "font-display tracking-wide",
    "transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-card text-foreground hover:bg-secondary",
        primary: "bg-vermilion text-primary-foreground hover:brightness-110",
        ghost:
          "bg-transparent border-transparent shadow-none hover:bg-secondary text-foreground active:translate-y-0",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface WuxiaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof wuxiaButtonVariants> {
  asChild?: boolean;
}

export const WuxiaButton = React.forwardRef<
  HTMLButtonElement,
  WuxiaButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(wuxiaButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
WuxiaButton.displayName = "WuxiaButton";

export { wuxiaButtonVariants };
