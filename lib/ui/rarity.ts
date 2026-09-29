/**
 * Hero's Adventure-style rarity colours: grey → green → blue → purple →
 * orange → red-gold. Used for opponent tiers and item value bands so the
 * same colour language reads across encounters, shops and the bag.
 */
export const RARITY_COLORS = ["#d8d3c2", "#7fd48f", "#6fb8f2", "#c48ff0", "#f0a456", "#f06a55"] as const;

export function rarityColor(rank: number | undefined): string {
  if (typeof rank !== "number" || !Number.isFinite(rank)) return RARITY_COLORS[0];
  return RARITY_COLORS[Math.max(0, Math.min(RARITY_COLORS.length - 1, Math.floor(rank)))];
}

/** Items carry no tier, so their price band stands in for rarity. */
export function itemRarity(price: number | undefined): number {
  const p = price ?? 0;
  return p >= 2000 ? 5 : p >= 800 ? 4 : p >= 300 ? 3 : p >= 120 ? 2 : p >= 40 ? 1 : 0;
}

/** Equipment carries no price or tier; its stat budget stands in for rarity. */
export function equipRarity(eq: { atkb: number; pdb: number; idb: number; hpb: number; mpb: number; pab?: number; iab?: number;
  spdb?: number; evab?: number; accb?: number; crib?: number; resb?: number; eff: unknown }): number {
  const budget = eq.atkb + eq.pdb + eq.idb + (eq.pab ?? 0) + (eq.iab ?? 0) + (eq.hpb + eq.mpb) / 5 +
    ((eq.spdb ?? 0) + (eq.evab ?? 0) + (eq.accb ?? 0) + (eq.crib ?? 0) + (eq.resb ?? 0)) * 1.5 + (eq.eff ? 12 : 0);
  return budget >= 90 ? 5 : budget >= 60 ? 4 : budget >= 38 ? 3 : budget >= 20 ? 2 : budget >= 8 ? 1 : 0;
}
