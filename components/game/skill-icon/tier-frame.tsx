import type { SkillTierIndex } from "@/lib/game";
import { INK, TIER_FRAME_COLOR, TIER_BG_GRADIENT } from "./constants";

// Layered tier frame shared by SkillIcon + ArtIcon. Renders:
//   1. 2px ink border
//   2. 2px tier-color ring (rarity signal)
//   3. 56×56 inner area filled with a top-down tier gradient
//
// The gradient id MUST be unique per icon so multiple icons on the
// same page don't share a single defs entry — caller passes its
// own id (typically the skill / art id).

interface TierFrameProps {
  tier: SkillTierIndex;
  gradientId: string;
}

export function TierFrame({ tier, gradientId }: TierFrameProps) {
  const ring = TIER_FRAME_COLOR[tier];
  const [stopTop, stopBottom] = TIER_BG_GRADIENT[tier];
  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stopTop} />
          <stop offset="1" stopColor={stopBottom} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" fill={INK} />
      <rect x="2" y="2" width="60" height="60" fill={ring} />
      <rect x="4" y="4" width="56" height="56" fill={`url(#${gradientId})`} />
    </>
  );
}
