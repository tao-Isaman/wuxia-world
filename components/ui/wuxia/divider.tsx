import { cn } from "@/lib/utils";

// OrnamentDivider — pixel-art section break. Renders as a horizontal
// faded-ink line with a centered Chinese cloud / lotus glyph, used to
// punctuate section headers inside Panels (location-view sections,
// profile-popup tabs, etc.).
//
// Two variants:
//   "default" — full-width line + centered glyph
//   "small"   — short flourish for sub-sections (no full line, just
//                spacer dots)

interface OrnamentDividerProps {
  className?: string;
  variant?: "default" | "small";
  /** Override the centered glyph. Defaults to "❖" (a stylized lozenge). */
  glyph?: string;
}

export function OrnamentDivider({
  className,
  variant = "default",
  glyph = "❖",
}: OrnamentDividerProps) {
  if (variant === "small") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70",
          className,
        )}
      >
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true" className="text-vermilion">{glyph}</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">·</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-muted-foreground/60",
        className,
      )}
      aria-hidden="true"
    >
      <span className="flex-1 h-px bg-border" />
      <span className="text-vermilion text-sm leading-none">{glyph}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}
