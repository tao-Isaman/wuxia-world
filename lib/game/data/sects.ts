// ─── Canonical sect list ──────────────────────────────────────────────
// Move skills and inner skills get a `sc` (sect / school) tag matching
// one of these names. Anything that isn't tied to a specific sect lives
// under JIANGHU_SECT. The order here drives display + data-file ordering
// (sort by sect first, then by tier).
//
// Sect names mirror lib/world/data/world-map.ts so the player's location
// names match the skill / art origins one-to-one.

export const JIANGHU_SECT = "ยุทธจักร";

/**
 * The legendary beasts' (บอส) own moves and inner arts: `sc` of every
 * `bss_*` move and `art_boss_*` art. Not a sect anyone joins and never
 * learnable — no scroll, quest, shop, tournament or coverage check counts
 * them (use `isBossMove` / `isBossArt`).
 */
export const BEAST_SECT = "สัตว์ร้าย";

/** A legendary beast's move (`bss_*`): fought, never learned. */
export const isBossMove = (id: string): boolean => id.startsWith("bss_");
/** A legendary beast's inner art (`art_boss_*`): fought, never learned. */
export const isBossArt = (id: string): boolean => id.startsWith("art_boss_");
/**
 * True for moves no one can learn: the plain beasts' `bst_*` bites and claws
 * and the legendary beasts' `bss_*` moves.
 */
export const isBeastMove = (id: string): boolean => id.startsWith("bst_") || isBossMove(id);

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
  "สำนักสกุลถัง",
  JIANGHU_SECT,
  // Not a sect: the legendary beasts' own moves and arts sort last.
  BEAST_SECT,
];

// Sortable rank: lower = earlier. Entries not in SECT_ORDER are pushed
// into the JIANGHU_SECT bucket. Useful for `Array.sort` of a SKILLS or
// ARTS slice if any UI needs a re-sorted view at runtime.
export function sectRank(sc: string): number {
  const i = SECT_ORDER.indexOf(sc);
  return i < 0 ? SECT_ORDER.indexOf(JIANGHU_SECT) : i;
}
