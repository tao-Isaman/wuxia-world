// How the hero looks (docs/design/appearance.md): the outfit worn, which ones
// the wardrobe holds and why the others are locked, and how the equipped
// weapon is carried on the body. Pure.
import { getEquip } from "@/lib/game/data/equipment";
import type { WeaponFamily } from "@/lib/game/types";
import { DEFAULT_OUTFIT, OUTFITS, getOutfit, type OutfitDef } from "./data/outfits";
import { equipmentIconId, equipmentIconUrl } from "./data/item-icons";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import type { Condition, Gender, HeroAppearance, SectId, WorldStateData } from "./types";

/** The hero's id in the tournament's records (lib/world/tournament.ts PLAYER). */
const PLAYER = "player";

type AppearanceState = Pick<WorldStateData, "appearance" | "wardrobe" | "sectMembership" | "tournamentHistory" | "gender">;

/** The one gender a sect takes, if its join rules name one (Shaolin: men; Emei: women). */
export function sectGender(sectId: SectId): Gender | null {
  const find = (condition: Condition | undefined): Gender | null => {
    if (!condition) return null;
    if (condition.t === "gender") return condition.equals;
    if (condition.t === "and") for (const part of condition.all) { const g = find(part); if (g) return g; }
    return null;
  };
  return find(SECT_MEMBERSHIPS[sectId]?.joinRequirements);
}

/** Whether an outfit is for this hero at all: a sect's uniform only for the gender it takes. */
export function outfitFits(state: Pick<WorldStateData, "gender">, outfit: OutfitDef): boolean {
  if (outfit.unlock.t !== "sect") return true;
  const gender = sectGender(outfit.unlock.sectId);
  return !gender || gender === state.gender;
}

/** Whether the hero is a disciple of this sect now (active; not resigned or betrayed). */
function inOwnSect(state: Pick<WorldStateData, "sectMembership">, sectId: SectId): boolean {
  const member = state.sectMembership[sectId];
  return !!member && (member.status ?? "active") === "active";
}

/** The outfits the wardrobe lists: everything but other sects' uniforms (only the hero's own sect's shows). */
export function wardrobeOutfits(state: Pick<WorldStateData, "gender" | "sectMembership">): OutfitDef[] {
  return OUTFITS.filter((outfit) => outfitFits(state, outfit) && (outfit.unlock.t !== "sect" || inOwnSect(state, outfit.unlock.sectId)));
}

export type { HeroAppearance };

export const DEFAULT_APPEARANCE: HeroAppearance = { outfit: DEFAULT_OUTFIT, hideWeapon: false };

/** Whether the wardrobe holds an outfit, and if not, what would unlock it. */
export function outfitStatus(state: AppearanceState, outfit: OutfitDef): { unlocked: boolean; hint: string } {
  const unlock = outfit.unlock;
  if (!outfitFits(state, outfit)) return { unlocked: false, hint: state.gender === "male" ? "สำนักนี้รับเฉพาะศิษย์หญิง" : "สำนักนี้รับเฉพาะศิษย์ชาย" };
  switch (unlock.t) {
    case "default":
      return { unlocked: true, hint: "" };
    case "sect": {
      // Only the hero's own sect's uniform: a disciple in good standing.
      const name = SECT_MEMBERSHIPS[unlock.sectId]?.name ?? unlock.sectId;
      return inOwnSect(state, unlock.sectId) ? { unlocked: true, hint: "" } : { unlocked: false, hint: `ศิษย์${name}เท่านั้น` };
    }
    case "tailor":
      return state.wardrobe.includes(outfit.id)
        ? { unlocked: true, hint: "" }
        : { unlocked: false, hint: `ซื้อจากร้านตัดเสื้อในเมือง ${unlock.price.toLocaleString()} ตำลึง` };
    case "champion":
      return state.tournamentHistory.some((record) => record.champion === PLAYER)
        ? { unlocked: true, hint: "" }
        : { unlocked: false, hint: "ชนะชุมนุมประลองกระบี่หัวซาน" };
  }
}

export function outfitUnlocked(state: AppearanceState, id: string): boolean {
  const outfit = getOutfit(id);
  return !!outfit && outfitStatus(state, outfit).unlocked;
}

/** Every outfit the wardrobe holds. */
export function unlockedOutfits(state: AppearanceState): OutfitDef[] {
  return OUTFITS.filter((outfit) => outfitStatus(state, outfit).unlocked);
}

/** The outfit the hero wears now (one no longer held falls back to ชุดเดิม). */
export function currentOutfit(state: AppearanceState): string {
  const id = state.appearance?.outfit ?? DEFAULT_OUTFIT;
  return outfitUnlocked(state, id) ? id : DEFAULT_OUTFIT;
}

/** A tailor sells here: any city. */
export const hasTailor = (sceneId: string | null | undefined) => !!sceneId?.startsWith("city_");

export type BuyOutfitRefusal = "unknown" | "owned" | "not_for_sale" | "no_tailor" | "gold";

/** Why an outfit cannot be bought now, or null. */
export function buyOutfitRefusal(state: AppearanceState & Pick<WorldStateData, "gold" | "currentSceneId">, id: string): BuyOutfitRefusal | null {
  const outfit = getOutfit(id);
  if (!outfit) return "unknown";
  if (outfit.unlock.t !== "tailor") return "not_for_sale";
  if (state.wardrobe.includes(id)) return "owned";
  if (!hasTailor(state.currentSceneId)) return "no_tailor";
  if (state.gold < outfit.unlock.price) return "gold";
  return null;
}

// ─── The weapon on the body ───────────────────────────────────────────

/** Where a weapon is carried on the map. */
export type WeaponCarry = "back" | "waist";

export interface WeaponLook {
  family: WeaponFamily;
  iconId: string;
  /** Null: not drawn (fists, hidden weapons, and the jian the hero's sheet already wears). */
  carry: WeaponCarry | null;
  /** Its length as a share of the standing figure's height. */
  length: number;
}

const CARRY: Record<WeaponFamily, { carry: WeaponCarry | null; length: number }> = {
  long: { carry: "back", length: 0.95 },
  blade: { carry: "back", length: 0.55 },
  music: { carry: "back", length: 0.5 },
  short: { carry: "waist", length: 0.3 },
  sword: { carry: null, length: 0.55 },
  fist: { carry: null, length: 0 },
  hidden: { carry: null, length: 0 },
};

/** A weapon's family, read from its icon (the equipment table carries none). */
export function weaponFamilyOf(equipmentId: string | null | undefined): WeaponFamily | null {
  const equip = getEquip(equipmentId);
  if (!equip || equip.ty !== "W") return null;
  if (equip.instrument) return "music";
  const icon = equipmentIconId(equip.id) ?? "";
  if (icon.includes("jian_sword")) return "sword";
  if (icon.includes("dao_sabre")) return "blade";
  if (icon.includes("spear") || icon.includes("staff") || icon.includes("polearm")) return "long";
  if (icon.includes("fan_weapon") || icon.includes("dagger") || icon.includes("knife")) return "short";
  if (icon.includes("instrument")) return "music";
  if (icon.includes("hidden") || icon.includes("whip") || icon.includes("chain")) return "hidden";
  if (icon.includes("bracer") || icon.includes("gauntlet") || icon.includes("fist")) return "fist";
  return "blade";
}

export function weaponLookOf(equipmentId: string | null | undefined): WeaponLook | null {
  const family = weaponFamilyOf(equipmentId);
  const iconId = equipmentIconId(equipmentId ?? "");
  if (!family || !iconId) return null;
  return { family, iconId, ...CARRY[family] };
}

/** What others see: the outfit, and the weapon carried on the body (null when hidden or not drawn). */
export function heroLook(state: AppearanceState & Pick<WorldStateData, "playerBuild">): { outfit: string; weapon: string | null } {
  const weapon = state.playerBuild?.equipment?.W ?? null;
  const carried = !state.appearance?.hideWeapon && weaponLookOf(weapon)?.carry ? weapon : null;
  return { outfit: currentOutfit(state), weapon: carried };
}

/**
 * A look as the renderers draw it (lib/stage/types.ts CharacterLook): the
 * outfit's recolour and the carried weapon's icon. `weapon` is an equipment
 * id that is shown (heroLook's), or one from another player.
 */
export function characterLook(outfit: string, weapon: string | null) {
  const def = getOutfit(outfit) ?? getOutfit(DEFAULT_OUTFIT)!;
  const carried = weapon ? weaponLookOf(weapon) : null;
  const icon = weapon ? equipmentIconUrl(weapon) : undefined;
  return {
    outfit: def.id,
    tint: def.tint,
    weapon: carried?.carry && icon ? { id: weapon!, icon, carry: carried.carry, length: carried.length } : null,
  };
}
