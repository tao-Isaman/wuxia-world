import type { SkillType } from "@/lib/game";
import type { LocationCategory, LocationScene } from "./types";

// Practice / category bonus rules.
//
//   forest   → yang, external
//   cave     → yin, soft
//   mountain → balance, hard
//   river    → internal
//
// Locations in any of `PRACTICE_CATEGORIES` allow the player to use the
// "ฝึกฝน" action; the practice XP gets the `PRACTICE_BONUS_MULT` boost when
// the practiced skill / art's `types` overlap with the category's tag list.

export const PRACTICE_BONUS_MULT = 1.3; // 30 % bonus

export const PRACTICE_CATEGORIES: readonly LocationCategory[] = [
  "sect",
  "mountain",
  "forest",
  "cave",
  "river",
  "temple",
];

export const CATEGORY_TYPE_BONUS: Partial<
  Record<LocationCategory, readonly SkillType[]>
> = {
  forest: ["yang", "external"],
  cave: ["yin", "soft"],
  mountain: ["balance", "hard"],
  river: ["internal"],
};

// Infer a default category list from the location id when the scene has no
// explicit `categories` field. Mirrors the prefix scheme used elsewhere in
// the world data so the 80+ existing leaves don't need migrating.
export function inferCategoriesFromId(
  locationId: string,
): readonly LocationCategory[] {
  if (locationId.startsWith("city_")) return ["city"];
  if (locationId.startsWith("village_")) return ["village"];
  if (locationId.startsWith("inn_")) return ["inn"];
  if (locationId.startsWith("home_")) return ["home"];
  // Sects in this game are mountain monasteries — qualifies for both
  // sect-themed and mountain-themed bonuses (อู่ตั๋ง = ["sect","mountain"]).
  if (locationId.startsWith("sect_")) return ["sect", "mountain"];
  if (locationId.startsWith("temple_") || locationId.startsWith("palace_")) {
    return ["temple"];
  }
  if (locationId.startsWith("villa_")) return ["mansion"];
  if (locationId.startsWith("isle_")) return ["isle"];
  if (
    locationId.startsWith("mt_") ||
    locationId.startsWith("peak_") ||
    locationId.startsWith("cliff_") ||
    locationId.startsWith("valley_")
  ) {
    return ["mountain"];
  }
  if (locationId.startsWith("cave_") || locationId.startsWith("grotto_")) {
    return ["cave"];
  }
  if (
    locationId.startsWith("pool_") ||
    locationId.startsWith("river_") ||
    locationId.startsWith("sea_") ||
    locationId.startsWith("lake_")
  ) {
    return ["river"];
  }
  if (locationId.startsWith("forest_") || locationId.startsWith("grove_")) {
    return ["forest"];
  }
  if (
    locationId.startsWith("desert_") ||
    locationId.startsWith("tribe_") ||
    locationId.startsWith("market_")
  ) {
    return ["frontier"];
  }
  return [];
}

export function getLocationCategories(
  scene: Pick<LocationScene, "id" | "categories"> | null | undefined,
): readonly LocationCategory[] {
  if (!scene) return [];
  if (scene.categories && scene.categories.length > 0) return scene.categories;
  return inferCategoriesFromId(scene.id);
}

export function canPracticeAt(
  scene: Pick<LocationScene, "id" | "categories"> | null | undefined,
): boolean {
  const cats = getLocationCategories(scene);
  return cats.some((c) => PRACTICE_CATEGORIES.includes(c));
}

// Returns 1.0 when no category-type pair matches, PRACTICE_BONUS_MULT
// otherwise. The bonus does not stack across categories — a skill that
// matches both forest (yang) and mountain (hard) still gets a single 1.3×.
export function practiceXpBonus(
  scene: Pick<LocationScene, "id" | "categories"> | null | undefined,
  types: readonly SkillType[],
): number {
  if (types.length === 0) return 1.0;
  const cats = getLocationCategories(scene);
  for (const c of cats) {
    const matchTypes = CATEGORY_TYPE_BONUS[c];
    if (!matchTypes) continue;
    if (types.some((t) => matchTypes.includes(t))) return PRACTICE_BONUS_MULT;
  }
  return 1.0;
}

// Compact human-readable summary like "ป่า · ภูเขา (+30% หยาง / ภายนอก / สมดุล / แข็ง)".
// Used by the practice popup so the player sees why a location helps.
export function describeBonusForLocation(
  scene: Pick<LocationScene, "id" | "categories"> | null | undefined,
): {
  matchedTypes: readonly SkillType[];
  hasBonus: boolean;
} {
  const cats = getLocationCategories(scene);
  const set = new Set<SkillType>();
  for (const c of cats) {
    const types = CATEGORY_TYPE_BONUS[c];
    if (types) for (const t of types) set.add(t);
  }
  return {
    matchedTypes: Array.from(set),
    hasBonus: set.size > 0,
  };
}
