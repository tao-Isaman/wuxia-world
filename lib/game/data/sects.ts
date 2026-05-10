// ─── Canonical sect list ──────────────────────────────────────────────
// Move skills and inner skills get a `sc` (sect / school) tag matching
// one of these names. Anything that isn't tied to a specific sect lives
// under JIANGHU_SECT. The order here drives display + data-file ordering
// (sort by sect first, then by tier).
//
// Sect names mirror lib/world/data/world-map.ts so the player's location
// names match the skill / art origins one-to-one.

export const JIANGHU_SECT = "ยุทธจักร";

// Sect display order. JIANGHU_SECT is intentionally last as the catch-all
// bucket — most generic / unaffiliated entries land there.
export const SECT_ORDER: readonly string[] = [
  "เส้าหลิน",
  "อู่ตัง",
  "ง้อไบ๊",
  "หัวซาน",
  "ซงซาน",
  "ไท่ซาน",
  "เฮิงซาน",
  "เหิงซาน",
  "ฉวนเจิน",
  "กู่มู่",
  "ลิ่งจิ้วกง",
  "พรรคยาจก",
  "พรรคตะวันจันทรา",
  "พรรคสราญรมย์",
  "สำนักดาวดึงส์",
  "พรรคเบญจพิษ",
  "พรรคอสูรโลหิต",
  "สำนักดาบโลหิต",
  "องครักษ์เสื้อแพร",
  "สำนักสุลถัง",
  JIANGHU_SECT,
];

// Sortable rank: lower = earlier. Entries not in SECT_ORDER are pushed
// into the JIANGHU_SECT bucket. Useful for `Array.sort` of a SKILLS or
// ARTS slice if any UI needs a re-sorted view at runtime.
export function sectRank(sc: string): number {
  const i = SECT_ORDER.indexOf(sc);
  return i < 0 ? SECT_ORDER.indexOf(JIANGHU_SECT) : i;
}
