"use client";

// ตู้เสื้อผ้า — the profile's ชุด tab (docs/design/appearance.md): every outfit,
// the hero shown in it with the weapon they carry, worn with one tap, or
// locked with where it comes from (no outfit is sold: quests, drops and the
// tailor's craft, data/outfit-sources.ts); and the ซ่อนอาวุธ toggle for the
// weapon on the body.
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
  // What the wardrobe holds first, then the found outfits still to find, then the rest.
  const rank = (outfit: OutfitDef) => (outfitStatus(state, outfit).unlocked ? 0 : outfit.unlock.t === "item" ? 1 : 2);
  const outfits = wardrobeOutfits(state).sort((a, b) => rank(a) - rank(b));

  const act = (outfit: OutfitDef) => {
    const status = outfitStatus(state, outfit);
    if (!status.unlocked) { toast("info", status.hint, 6000); return; }
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
          const status = outfitStatus(state, outfit);
          const isWorn = outfit.id === worn;
          return (
            <button type="button" className={`wardrobe-card${isWorn ? " wardrobe-card--worn" : ""}${status.unlocked ? "" : " wardrobe-card--locked"}`}
              data-outfit={outfit.id} aria-pressed={isWorn} title={`${outfit.name} — ${outfit.description}${status.hint ? `\n${status.hint}` : ""}`}
              onClick={() => act(outfit)}>
              <OutfitPreview body={state.playerBodyId} tint={outfit.tint} weapon={carried} size={short ? 60 : 76} />
              <b>{outfit.name}</b>
              <small>
                {isWorn ? "สวมอยู่" : status.unlocked ? "สวม" : outfit.unlock.t === "item" ? "🔒 ยังไม่ได้มา" : "🔒 " + status.hint}
              </small>
            </button>
          );
        }} />
    </div>
  );
}
