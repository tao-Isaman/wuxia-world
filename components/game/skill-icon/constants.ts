import type { SkillTierIndex } from "@/lib/game";

// ─── Shared constants for the icon system ─────────────────────────────
//
// Single ink color used as the universal stroke + dark accent across
// every layer (frame, glyphs, type badges). Centralised here so a theme
// tweak ripples through with one edit.

export const INK = "#1a120a";

// Tier rarity color — drives both the frame ring and the per-glyph
// accent fill. Same palette as the cast animation overlay so player
// memory carries across UI surfaces.
export const TIER_FRAME_COLOR: Record<SkillTierIndex, string> = {
  0: "#78716c",  // T0 stone-500 grey
  1: "#059669",  // T1 emerald-600 green
  2: "#0284c7",  // T2 sky-600 blue
  3: "#9333ea",  // T3 purple-600 purple
  4: "#f97316",  // T4 orange-500 orange
};

// Inner background gradient — top-stop → bottom-stop, tier-tinted to
// reinforce rarity at a glance. Lighter shade on top reads as "lit
// from above" so the icon feels embossed.
export const TIER_BG_GRADIENT: Record<SkillTierIndex, [string, string]> = {
  0: ["#f5f5f4", "#d6d3d1"],
  1: ["#d1fae5", "#6ee7b7"],
  2: ["#dbeafe", "#93c5fd"],
  3: ["#ede9fe", "#c4b5fd"],
  4: ["#fed7aa", "#fb923c"],
};
