import { clamp } from "@/lib/utils";

// Hit % formula: 80 baseline, ±0.25 per (Acc - Eva), clamped [5, 95].
export function hitPct(acc: number, eva: number): number {
  return clamp(80 + (acc - eva) / 4, 5, 95);
}

// Crit % formula: 3 baseline, +0.33 per (Cri - Res), clamped [0, 75].
// On crit, damage is multiplied by 1.5.
export function critPct(cri: number, res: number): number {
  return clamp(3 + (cri - res) / 3, 0, 75);
}

export const CRIT_MULTIPLIER = 1.5;

// HP-bar color buckets — used in both setup preview and battle UI.
export function hpColor(pct: number): string {
  return pct > 50 ? "#1D9E75" : pct > 20 ? "#BA7517" : "#E24B4A";
}
