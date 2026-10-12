// The hero's looks (lib/world/appearance.ts): wear an outfit, buy one from a
// city tailor, hide or show the weapon on the body.
import { buyOutfitRefusal, outfitUnlocked } from "@/lib/world/appearance";
import { getOutfit } from "@/lib/world/data/outfits";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const appearanceActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "wearOutfit" | "buyOutfit" | "setHideWeapon"> => ({
  wearOutfit: (id) => {
    const s = get();
    if (!outfitUnlocked(s, id)) return false;
    if (s.appearance.outfit === id) return true;
    set({ appearance: { ...s.appearance, outfit: id } });
    return true;
  },

  buyOutfit: (id) => {
    const s = get();
    const refusal = buyOutfitRefusal(s, id);
    if (refusal) return { ok: false, reason: refusal };
    const outfit = getOutfit(id)!;
    const price = outfit.unlock.t === "tailor" ? outfit.unlock.price : 0;
    const draft = draftFrom(s);
    draft.gold -= price;
    draft.wardrobe = [...draft.wardrobe, id];
    draft.appearance = { ...draft.appearance, outfit: id };
    appendActionLog(draft, "buy", `ตัด${outfit.name}จากร้านตัดเสื้อ · ${price.toLocaleString()} ตำลึง`);
    set({ ...draft });
    return { ok: true };
  },

  setHideWeapon: (hide) => {
    const s = get();
    set({ appearance: { ...s.appearance, hideWeapon: hide } });
  },
});
