import type { Tier } from "../types";

// CD values are also referenced via TIERS[ti].cd in damage logic.
export const TIERS: readonly Tier[] = [
  { n: "พื้นฐาน", cd: 0, c: "tier-0" },
  { n: "ขั้นกลาง", cd: 2, c: "tier-1" },
  { n: "ขั้นสูง", cd: 3, c: "tier-2" },
  { n: "ลับ", cd: 4, c: "tier-3" },
  { n: "เฉพาะ", cd: 5, c: "tier-4" },
] as const;
