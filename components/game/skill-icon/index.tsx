import type { Art, Skill } from "@/lib/game";
import {
  SKILL_ICON_OVERRIDES,
  ART_ICON_OVERRIDES,
  SKILL_ICON_RASTER,
  ART_ICON_RASTER,
} from "../skill-icons-registry";
// Side-effect imports — each batch file registers its hand-crafted
// icons via Object.assign on the registry maps. Importing them here
// guarantees every override is live before any icon renders.
import "../skill-icons-batch-1";
import "../skill-icons-batch-2";
import "../skill-icons-batch-3";
import "../skill-icons-batch-4";
import "../skill-icons-batch-5";

import { INK, TIER_FRAME_COLOR } from "./constants";
import { TierFrame } from "./tier-frame";
import { TypeAccents } from "./type-accents";
import { WeaponGlyph } from "./weapon-glyph";
import { ArtGlyph } from "./art-glyph";

// ─── 64×64 SVG icon for skills + arts ─────────────────────────────────
//
// Layered composition:
//   1. <TierFrame>      ink border + tier ring + tier-tinted gradient
//   2. central glyph    hand-crafted override (preferred) OR
//                       weapon-family / art-type composition fallback
//   3. <TypeAccents>    8×8 type emblems in the top corners
//   4. multi-hit badge  bottom-right circle with ×N (skills only)
//
// Hand-crafted overrides live in skill-icons-batch-*.tsx files —
// adding a new icon is one entry per skill in those modules.

interface SkillIconProps {
  skill: Skill;
  size?: number;
  className?: string;
}

export function SkillIcon({ skill, size = 64, className }: SkillIconProps) {
  const accent = TIER_FRAME_COLOR[skill.ti];
  const raster = SKILL_ICON_RASTER[skill.id];
  const override = SKILL_ICON_OVERRIDES[skill.id];
  const glyph = raster
    ? <RasterGlyph href={raster} />
    : override
      ? override({ ink: INK, accent })
      : <WeaponGlyph w={skill.w} ink={INK} accent={accent} />;
  return (
    <IconSvg label={skill.n} size={size} className={className}>
      <TierFrame tier={skill.ti} gradientId={`gr-skill-${skill.id}`} />
      {glyph}
      <TypeAccents types={skill.types ?? []} />
      {skill.hits != null && skill.hits > 1 && (
        <MultiHitBadge count={skill.hits} />
      )}
    </IconSvg>
  );
}

interface ArtIconProps {
  art: Art;
  size?: number;
  className?: string;
}

export function ArtIcon({ art, size = 64, className }: ArtIconProps) {
  const accent = TIER_FRAME_COLOR[art.ti];
  const raster = ART_ICON_RASTER[art.id];
  const override = ART_ICON_OVERRIDES[art.id];
  const glyph = raster
    ? <RasterGlyph href={raster} />
    : override
      ? override({ ink: INK, accent })
      : <ArtGlyph primary={art.types?.[0]} ink={INK} accent={accent} />;
  return (
    <IconSvg label={art.n} size={size} className={className}>
      <TierFrame tier={art.ti} gradientId={`gr-art-${art.id}`} />
      {glyph}
      <TypeAccents types={art.types ?? []} />
    </IconSvg>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────

interface IconSvgProps {
  label: string;
  size: number;
  className?: string;
  children: React.ReactNode;
}

// Shared SVG wrapper — pixelated rendering for crisp scaling, ARIA
// label drawn from the skill / art name, fixed 64×64 viewBox.
function IconSvg({ label, size, className, children }: IconSvgProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={label}
      style={{ imageRendering: "pixelated" }}
    >
      {children}
    </svg>
  );
}

// Renders a raster (PNG) override inset inside the tier frame. The 4..60
// box matches the inner bevel so the ink border + tier ring + corner
// type emblems still layer on top. `preserveAspectRatio="xMidYMid slice"`
// crops a non-square source to fill the box without distortion.
function RasterGlyph({ href }: { href: string }) {
  return (
    <image
      href={href}
      x={4}
      y={4}
      width={56}
      height={56}
      preserveAspectRatio="xMidYMid slice"
    />
  );
}

// Bottom-right circular badge showing the skill's per-cast hit count
// (e.g., dgjj 9 swords → "×9"). Only shown when hits > 1.
function MultiHitBadge({ count }: { count: number }) {
  return (
    <g>
      <circle cx="52" cy="52" r="9" fill={INK} />
      <text
        x="52"
        y="56"
        fontFamily="system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#fff"
        textAnchor="middle"
      >
        ×{count}
      </text>
    </g>
  );
}
