import type { SkillType } from "@/lib/game";
import { INK } from "./constants";

// Top-corner emblems that signal a skill / art's philosophical tags.
// At most two are shown — one in the top-left corner (primary type)
// and one in the top-right (secondary type, if different). Each
// emblem is an 8×8 stamp at corner offset (4,6) or (50,6) so they
// sit just inside the tier ring.

interface TypeAccentsProps {
  types: readonly SkillType[];
}

export function TypeAccents({ types }: TypeAccentsProps) {
  const primary = types[0];
  const secondary = types[1];
  return (
    <g>
      {primary && <TypeBadge type={primary} x={6} y={6} />}
      {secondary && secondary !== primary && (
        <TypeBadge type={secondary} x={50} y={6} />
      )}
    </g>
  );
}

interface TypeBadgeProps {
  type: SkillType;
  x: number;
  y: number;
}

function TypeBadge({ type, x, y }: TypeBadgeProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <BadgeShape type={type} />
    </g>
  );
}

// Each type maps to a recognisable mini-emblem. Designed to be
// readable as 8×8 stamps even at icon thumbnails (32px).
function BadgeShape({ type }: { type: SkillType }) {
  switch (type) {
    case "yang":
      return <YangSun />;
    case "yin":
      return <YinMoon />;
    case "hard":
      return <HardRock />;
    case "soft":
      return <SoftCloud />;
    case "internal":
      return <InternalSpiral />;
    case "external":
      return <ExternalStar />;
    case "balance":
      return <BalanceTaiji />;
  }
}

function YangSun() {
  // Bright sun — yellow disk with dark core.
  return (
    <>
      <circle cx="4" cy="4" r="4" fill="#facc15" stroke={INK} strokeWidth="1" />
      <circle cx="4" cy="4" r="1.5" fill={INK} />
    </>
  );
}

function YinMoon() {
  // Crescent — dark backdrop with a pale offset disk.
  return (
    <>
      <circle cx="4" cy="4" r="4" fill="#1e1b4b" stroke={INK} strokeWidth="1" />
      <circle cx="5.5" cy="3.5" r="3" fill="#cbd5e1" />
    </>
  );
}

function HardRock() {
  // Chunky angular rock outline.
  return (
    <>
      <polygon
        points="0,8 2,1 7,0 8,5 5,8"
        fill="#78716c"
        stroke={INK}
        strokeWidth="1"
      />
      <line x1="3" y1="3" x2="5" y2="6" stroke={INK} strokeWidth="0.5" />
    </>
  );
}

function SoftCloud() {
  // Wispy cloud silhouette.
  return (
    <path
      d="M 1 5 Q 1 2 4 2 Q 5 0 7 2 Q 8 4 7 6 L 1 6 Z"
      fill="#e0f2fe"
      stroke={INK}
      strokeWidth="1"
    />
  );
}

function InternalSpiral() {
  // Qi swirl — purple disk with a flowing s-curve highlight.
  return (
    <>
      <circle cx="4" cy="4" r="4" fill="#7c3aed" stroke={INK} strokeWidth="1" />
      <path d="M 4 1 Q 7 4 4 7 Q 1 4 4 1 Z" fill="#fff" opacity="0.6" />
    </>
  );
}

function ExternalStar() {
  // Burst star — sharp red impact line.
  return (
    <polygon
      points="4,0 5,3 8,3 6,5 7,8 4,6 1,8 2,5 0,3 3,3"
      fill="#dc2626"
      stroke={INK}
      strokeWidth="0.5"
    />
  );
}

function BalanceTaiji() {
  // ☯ — the classic split with two opposing dots.
  return (
    <>
      <circle cx="4" cy="4" r="4" fill="#fff" stroke={INK} strokeWidth="1" />
      <path
        d="M 4 0 A 4 4 0 0 1 4 8 A 2 2 0 0 0 4 4 A 2 2 0 0 1 4 0 Z"
        fill={INK}
      />
      <circle cx="4" cy="2" r="0.6" fill={INK} />
      <circle cx="4" cy="6" r="0.6" fill="#fff" />
    </>
  );
}
