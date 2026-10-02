import type { PowerTier } from "@/lib/game";

/** A power tier's name on its own colour (lib/game/power-tier.ts); the top tier glows. */
export function PowerTierBadge({ tier }: { tier: PowerTier }) {
  return (
    <span className={`power-tier-badge${tier.tier === 12 ? " power-tier-peak" : ""}`} data-tier={tier.tier}
      style={{ background: tier.color, color: tier.ink, borderColor: tier.color }}>
      {tier.name}
    </span>
  );
}
