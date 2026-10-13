// Weapon match: a move of the family of the weapon in hand hits harder, a
// move of another family softer (WEAPON_MATCH_BONUS / WEAPON_MISMATCH_MALUS).
// Bare hands count as fist for the hero; a foe with no weapon on its build
// (the opponents table carries none) fights neutral. Arts, beast and boss
// moves have no weapon and are never touched.
import { getEquip } from "./data/equipment";
import { isBeastMove } from "./data/sects";
import type { CharacterBuild, Skill, WeaponFamily } from "./types";

export const WEAPON_MATCH_BONUS = 0.1;
export const WEAPON_MISMATCH_MALUS = 0.1;

/** The family of the weapon a build holds; "fist" for a bare-handed hero; null when the rule does not apply. */
export function heldWeaponFamily(build: Pick<CharacterBuild, "equipment" | "baseHp">): WeaponFamily | null {
  const weapon = getEquip(build.equipment?.W ?? null);
  if (weapon?.ty === "W" && weapon.fam) return weapon.fam;
  // Only the world hero carries baseHp (derive.ts); bare hands are their fist.
  return build.baseHp != null ? "fist" : null;
}

/** The damage multiplier of a move used with the weapon family in hand. */
export function weaponMatchMod(held: WeaponFamily | null, skill: Pick<Skill, "id" | "w">): number {
  if (!held || !skill.w || isBeastMove(skill.id)) return 1;
  return skill.w === held ? 1 + WEAPON_MATCH_BONUS : 1 - WEAPON_MISMATCH_MALUS;
}
