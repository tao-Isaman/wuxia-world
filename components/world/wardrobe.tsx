"use client";

// ตู้เสื้อผ้า — the profile's ชุด tab (docs/design/appearance.md): the outfits
// the hero has (an outfit not yet had is not shown — they come from quests,
// drops and the tailor's craft, data/outfit-sources.ts), each shown on the hero
// with the weapon they carry and worn with one tap; and the ซ่อนอาวุธ toggle
// for the weapon on the body.
import { useShortScreen } from "@/components/ui/use-short-screen";
import { PagedGrid } from "@/components/ui/paged-grid";
import type { OutfitDef } from "@/lib/world/data/outfits";
import { currentOutfit, outfitStatus, wardrobeOutfits, weaponLookOf } from "@/lib/world/appearance";
import { equipmentIconUrl } from "@/lib/world/data/item-icons";
import { getEquip } from "@/lib/game/data/equipment";
import { WEAPON_FAMILY_LABEL } from "@/lib/game/data/weapons";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { OutfitPreview } from "./outfit-preview";

export function Wardrobe() {
  const state = useWorldStore();
  const short = useShortScreen();
  const worn = currentOutfit(state);
  const weaponId = state.playerBuild?.equipment.W ?? null;
  const weapon = weaponLookOf(weaponId);
  const icon = weaponId ? equipmentIconUrl(weaponId) : undefined;
  const carried = weapon?.carry && icon && !state.appearance.hideWeapon ? { icon, carry: weapon.carry, length: weapon.length } : null;
  // Only what the hero has: an outfit not yet had stays out of sight.
  const outfits = wardrobeOutfits(state).filter((outfit) => outfitStatus(state, outfit).unlocked);

  const act = (outfit: OutfitDef) => {
    if (state.wearOutfit(outfit.id)) toast("success", `สวม${outfit.name}แล้ว`);
  };

  return (
    <div className="wardrobe" role="tabpanel" aria-label="ชุด" data-testid="wardrobe" data-worn={worn}>
      <div className="wardrobe-head">
        <span>
          อาวุธ: {weaponId ? <b>{getEquip(weaponId)?.n}</b> : <i>ไม่ได้ถือ</i>}
          {weapon && <small> · {WEAPON_FAMILY_LABEL[weapon.family]}{weapon.carry ? (weapon.carry === "back" ? " · สะพายหลัง" : " · เหน็บเอว") : " · ไม่แสดงบนตัว"}</small>}
        </span>
        <label className="wardrobe-toggle">
          <input type="checkbox" checked={state.appearance.hideWeapon} data-testid="hide-weapon"
            onChange={(e) => state.setHideWeapon(e.target.checked)} />
          ซ่อนอาวุธ
        </label>
      </div>
      <PagedGrid items={outfits} itemKey={(o) => o.id} cellWidth={short ? 96 : 112} cellHeight={short ? 118 : 140} gap={6} label="ชุด"
        render={(outfit) => {
          const isWorn = outfit.id === worn;
          return (
            <button type="button" className={`wardrobe-card${isWorn ? " wardrobe-card--worn" : ""}`}
              data-outfit={outfit.id} aria-pressed={isWorn} title={`${outfit.name} — ${outfit.description}`}
              onClick={() => act(outfit)}>
              <OutfitPreview body={state.playerBodyId} tint={outfit.tint} weapon={carried} size={short ? 60 : 76} />
              <b>{outfit.name}</b>
              <small>
                {isWorn ? "สวมอยู่" : "สวม"}
              </small>
            </button>
          );
        }} />
    </div>
  );
}
