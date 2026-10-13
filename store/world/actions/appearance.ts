// The hero's looks (lib/world/appearance.ts): wear an outfit, hide or show
// the weapon on the body. Outfits are found, never bought (data/outfit-sources.ts).
import { outfitUnlocked } from "@/lib/world/appearance";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const appearanceActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "wearOutfit" | "setHideWeapon"> => ({
  wearOutfit: (id) => {
    const s = get();
    if (!outfitUnlocked(s, id)) return false;
    if (s.appearance.outfit === id) return true;
    set({ appearance: { ...s.appearance, outfit: id } });
    return true;
  },

  setHideWeapon: (hide) => {
    const s = get();
    set({ appearance: { ...s.appearance, hideWeapon: hide } });
  },
});
