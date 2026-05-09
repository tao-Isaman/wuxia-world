import type { SkillType } from "@/lib/game";

// Composition fallback for arts that have no hand-crafted icon
// override. Arts don't have a weapon family, so the glyph is
// chosen by the art's primary type tag — each tag maps to a qi-flow
// visualisation that suits the philosophical theme.

interface ArtGlyphProps {
  primary: SkillType | undefined;
  ink: string;
  accent: string;
}

export function ArtGlyph({ primary, ink, accent }: ArtGlyphProps) {
  switch (primary) {
    case "yang":     return <YangSunGlyph ink={ink} accent={accent} />;
    case "yin":      return <YinMoonGlyph ink={ink} accent={accent} />;
    case "internal": return <InternalSpiralGlyph ink={ink} accent={accent} />;
    case "external": return <ExternalBurstGlyph ink={ink} accent={accent} />;
    case "hard":     return <DiamondGlyph ink={ink} accent={accent} />;
    case "soft":     return <FlowingWaveGlyph ink={ink} accent={accent} />;
    case "balance":
    default:         return <TaijiGlyph ink={ink} accent={accent} />;
  }
}

interface GlyphProps {
  ink: string;
  accent: string;
}

// Sun-flame qi — central disk + 8 radial flame rays.
function YangSunGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <circle cx="32" cy="32" r="10" fill={accent} />
      <circle cx="32" cy="32" r="4" fill={ink} />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(angle) * 14;
        const y1 = 32 + Math.sin(angle) * 14;
        const x2 = 32 + Math.cos(angle) * 22;
        const y2 = 32 + Math.sin(angle) * 22;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={accent}
            strokeWidth="3"
          />
        );
      })}
    </g>
  );
}

// Crescent moon over a cool-tone night sky.
function YinMoonGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <circle cx="32" cy="32" r="14" fill="#1e1b4b" />
      <circle cx="36" cy="28" r="11" fill={accent} />
      {/* Two distant stars */}
      <circle cx="26" cy="36" r="2" fill="#fff" />
      <circle cx="38" cy="38" r="1.5" fill="#fff" />
    </g>
  );
}

// Inner qi spiral — central disk with a flowing s-curve highlight.
function InternalSpiralGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <circle cx="32" cy="32" r="14" fill={accent} />
      <path
        d="M 32 18 Q 46 32 32 46 Q 18 32 32 18 Z"
        fill="#fff"
        opacity="0.7"
        stroke={ink}
        strokeWidth="1"
      />
      <circle cx="32" cy="32" r="3" fill={ink} />
    </g>
  );
}

// Bursting outward energy — 10-point star with a dark core.
function ExternalBurstGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <polygon
        points="32,12 36,28 52,28 40,38 44,52 32,44 20,52 24,38 12,28 28,28"
        fill={accent}
      />
      <circle cx="32" cy="32" r="4" fill={ink} />
    </g>
  );
}

// Diamond / crystal — angular layered diamond shapes.
function DiamondGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <polygon points="32,12 50,32 32,52 14,32" fill={accent} />
      <polygon points="32,20 44,32 32,44 20,32" fill="#fff" opacity="0.5" />
      <line x1="32" y1="12" x2="32" y2="52" stroke={ink} strokeWidth="1" />
      <line x1="14" y1="32" x2="50" y2="32" stroke={ink} strokeWidth="1" />
    </g>
  );
}

// Flowing waves — three concentric wavy arcs evoking moving water.
function FlowingWaveGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" fill="none">
      <path
        d="M 14 32 Q 23 22 32 32 Q 41 42 50 32"
        stroke={accent}
        strokeWidth="3"
      />
      <path
        d="M 14 40 Q 23 30 32 40 Q 41 50 50 40"
        stroke={accent}
        strokeWidth="3"
      />
      <path
        d="M 14 24 Q 23 14 32 24 Q 41 34 50 24"
        stroke={accent}
        strokeWidth="3"
      />
    </g>
  );
}

// Big taiji — yin-yang divider with two opposing dots.
function TaijiGlyph({ ink }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <circle cx="32" cy="32" r="18" fill="#fff" />
      <path
        d="M 32 14 A 18 18 0 0 1 32 50 A 9 9 0 0 0 32 32 A 9 9 0 0 1 32 14 Z"
        fill={ink}
      />
      <circle cx="32" cy="23" r="2.5" fill={ink} />
      <circle cx="32" cy="41" r="2.5" fill="#fff" />
    </g>
  );
}
