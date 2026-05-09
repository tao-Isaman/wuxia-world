import type { WeaponFamily } from "@/lib/game";

// Composition fallback when a skill has no hand-crafted icon override
// in the registry. One glyph per weapon family — the central 32×32
// area gets filled with a chunky weapon silhouette in the tier accent
// color, outlined in ink. These are deliberately generic so any new
// skill that doesn't ship a custom icon still reads at a glance.

interface WeaponGlyphProps {
  w: WeaponFamily;
  ink: string;
  accent: string;
}

export function WeaponGlyph({ w, ink, accent }: WeaponGlyphProps) {
  switch (w) {
    case "fist":   return <FistGlyph ink={ink} accent={accent} />;
    case "long":   return <LongStaffGlyph ink={ink} accent={accent} />;
    case "sword":  return <SwordGlyph ink={ink} accent={accent} />;
    case "blade":  return <BladeGlyph ink={ink} accent={accent} />;
    case "short":  return <FanGlyph ink={ink} accent={accent} />;
    case "hidden": return <HiddenWeaponGlyph ink={ink} accent={accent} />;
    case "music":  return <FluteGlyph ink={ink} accent={accent} />;
  }
}

interface GlyphProps {
  ink: string;
  accent: string;
}

// Clenched fist — chunky knuckles + thumb sticking out below.
function FistGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <rect x="20" y="22" width="24" height="20" fill={accent} />
      <rect x="22" y="20" width="20" height="4" fill={accent} />
      {/* Knuckle ridges */}
      <rect x="22" y="24" width="4" height="2" fill={ink} />
      <rect x="28" y="24" width="4" height="2" fill={ink} />
      <rect x="34" y="24" width="4" height="2" fill={ink} />
      <rect x="40" y="24" width="4" height="2" fill={ink} />
      {/* Thumb */}
      <rect x="18" y="28" width="4" height="10" fill={accent} />
    </g>
  );
}

// Diagonal staff — long pole with two grip wraps + endcaps.
function LongStaffGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2">
      <line x1="14" y1="50" x2="50" y2="14" stroke={accent} strokeWidth="6" />
      <line x1="14" y1="50" x2="50" y2="14" stroke={ink} strokeWidth="1.5" />
      {/* Grip wraps */}
      <line x1="22" y1="42" x2="26" y2="46" stroke={ink} strokeWidth="2" />
      <line x1="38" y1="26" x2="42" y2="30" stroke={ink} strokeWidth="2" />
      {/* Endcaps */}
      <circle cx="50" cy="14" r="3" fill={accent} />
      <circle cx="14" cy="50" r="3" fill={accent} />
    </g>
  );
}

// Straight Chinese sword (jian) — slim blade pointing up + cross-guard.
function SwordGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <polygon points="32,10 30,40 34,40" fill={accent} />
      <line x1="32" y1="10" x2="32" y2="40" stroke={ink} strokeWidth="1" />
      <rect x="22" y="40" width="20" height="4" fill={ink} />
      <rect x="30" y="44" width="4" height="10" fill={accent} />
      <circle cx="32" cy="55" r="3" fill={ink} />
    </g>
  );
}

// Curved single-edge sabre (dao) — broad curved blade + handle below.
function BladeGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <path d="M 18 12 Q 50 20 48 44 L 38 44 Q 36 22 18 16 Z" fill={accent} />
      <rect x="36" y="44" width="6" height="10" fill={ink} />
      <rect x="34" y="54" width="10" height="3" fill={accent} />
    </g>
  );
}

// Folding fan — three radiating ribs from a hub at the bottom.
function FanGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <path d="M 32 50 L 14 18 Q 32 10 50 18 Z" fill={accent} />
      <line x1="32" y1="50" x2="20" y2="22" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="32" y2="14" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="44" y2="22" stroke={ink} strokeWidth="1.5" />
      <circle cx="32" cy="50" r="3" fill={ink} />
    </g>
  );
}

// Throwing needles + chain — three needles radiating from a center ring.
function HiddenWeaponGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="1.5">
      <circle cx="32" cy="32" r="6" fill="none" stroke={ink} strokeWidth="2" />
      <line x1="32" y1="32" x2="14" y2="14" stroke={accent} strokeWidth="3" />
      <line x1="32" y1="32" x2="50" y2="14" stroke={accent} strokeWidth="3" />
      <line x1="32" y1="32" x2="32" y2="54" stroke={accent} strokeWidth="3" />
      <polygon points="14,14 11,17 17,17" fill={ink} />
      <polygon points="50,14 47,17 53,17" fill={ink} />
      <polygon points="32,54 29,51 35,51" fill={ink} />
    </g>
  );
}

// Bamboo flute — horizontal pipe with finger holes + endcaps.
function FluteGlyph({ ink, accent }: GlyphProps) {
  return (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      <rect x="10" y="28" width="44" height="10" fill={accent} />
      <circle cx="22" cy="33" r="2" fill={ink} />
      <circle cx="30" cy="33" r="2" fill={ink} />
      <circle cx="38" cy="33" r="2" fill={ink} />
      <circle cx="46" cy="33" r="2" fill={ink} />
      <rect x="10" y="28" width="4" height="10" fill={ink} />
      <rect x="50" y="28" width="4" height="10" fill={ink} />
    </g>
  );
}
