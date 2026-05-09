import type { ReactElement } from "react";

// ─── Hand-crafted skill icon overrides ────────────────────────────────
//
// The composition `SkillIcon` component renders a generic icon from
// weapon family + tier + type tags. This registry overlays a hand-drawn
// SVG group on top of the base — when a skill's id appears here, the
// custom group renders INSTEAD of the generic weapon glyph (frame +
// background + type accents stay).
//
// Each renderer is a function returning an SVG group (<g>) that draws
// inside the 56×56 inner area (x: 4..60, y: 4..60). Use the provided
// `ink` (border color) and `accent` (tier-tinted fill) for visual
// consistency with the tier frame.
//
// Authoring: keep glyphs CHUNKY (stroke 2, big shapes) so they read at
// 32px tooltip thumbnails. Use 1-3 distinct visual cues that evoke the
// skill's name + theme. Avoid micro-details that disappear at small
// sizes.

export type IconRenderer = (props: { ink: string; accent: string }) => ReactElement;

// Each batch file appends to this object via Object.assign so the build
// stays additive — adding a new batch doesn't touch the registry shape.
export const SKILL_ICON_OVERRIDES: Record<string, IconRenderer> = {};
export const ART_ICON_OVERRIDES: Record<string, IconRenderer> = {};

// ─── Raster (PNG) overrides ───────────────────────────────────────────
//
// For art-style icons we don't want to redraw as SVG (e.g., AI-generated
// pixel-art portraits dropped into public/icons/skills/), register the
// public-relative path here. SkillIcon prefers raster → SVG override →
// generic glyph in that order. The image is rendered inside the tier
// frame at the inset 4..60 box so the ink border + tier ring + corner
// type emblems stay layered on top.
export const SKILL_ICON_RASTER: Record<string, string> = {};
export const ART_ICON_RASTER: Record<string, string> = {};
