"use client";

// ตู้เสื้อผ้า — the profile's ชุด tab (docs/design/appearance.md): every outfit,
// the hero shown in it with the weapon they carry, worn with one tap, bought
// from a tailor in any city, or locked with what would unlock it; and the
// ซ่อนอาวุธ toggle for the weapon on the body.
import { useShortScreen } from "@/components/ui/use-short-screen";
import { PagedGrid } from "@/components/ui/paged-grid";
import type { OutfitDef } from "@/lib/world/data/outfits";
import { currentOutfit, hasTailor, outfitStatus, wardrobeOutfits, weaponLookOf } from "@/lib/world/appearance";
import { equipmentIconUrl } from "@/lib/world/data/item-icons";
import { getEquip } from "@/lib/game/data/equipment";
import { WEAPON_FAMILY_LABEL } from "@/lib/game/data/weapons";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";
import { OutfitPreview } from "./outfit-preview";

const REFUSAL_TEXT = {
  unknown: "ไม่มีชุดนี้",
  owned: "มีชุดนี้แล้ว",
  not_for_sale: "ชุดนี้ซื้อไม่ได้",
  no_tailor: "ต้องอยู่ในเมืองที่มีร้านตัดเสื้อ",
  gold: "ทองไม่พอ",
} as const;

export function Wardrobe() {
  const state = useWorldStore();
  const short = useShortScreen();
  const worn = currentOutfit(state);
  const weaponId = state.playerBuild?.equipment.W ?? null;
  const weapon = weaponLookOf(weaponId);
  const icon = weaponId ? equipmentIconUrl(weaponId) : undefined;
  const carried = weapon?.carry && icon && !state.appearance.hideWeapon ? { icon, carry: weapon.carry, length: weapon.length } : null;
  const tailorHere = hasTailor(state.currentSceneId);
  // What the wardrobe holds first, then what a tailor sells, then the rest.
  const rank = (outfit: OutfitDef) => (outfitStatus(state, outfit).unlocked ? 0 : outfit.unlock.t === "tailor" ? 1 : 2);
  const outfits = wardrobeOutfits(state).sort((a, b) => rank(a) - rank(b));

  const act = async (outfit: OutfitDef) => {
    const status = outfitStatus(state, outfit);
    if (status.unlocked) {
      if (state.wearOutfit(outfit.id)) toast("success", `สวม${outfit.name}แล้ว`);
      return;
    }
    if (outfit.unlock.t !== "tailor") { toast("info", status.hint); return; }
    const price = outfit.unlock.price;
    if (!(await confirmDialog({ title: "ร้านตัดเสื้อ", message: `ตัด${outfit.name} ราคา ${price.toLocaleString()} ตำลึง?`, confirmText: "ซื้อ" }))) return;
    const result = useWorldStore.getState().buyOutfit(outfit.id);
    if (result.ok) toast("success", `ได้${outfit.name}แล้ว และสวมทันที`);
    else toast("warn", REFUSAL_TEXT[result.reason ?? "unknown"]);
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
          const price = outfit.unlock.t === "tailor" ? outfit.unlock.price : null;
          return (
            <button type="button" className={`wardrobe-card${isWorn ? " wardrobe-card--worn" : ""}${status.unlocked ? "" : " wardrobe-card--locked"}`}
              data-outfit={outfit.id} aria-pressed={isWorn} title={`${outfit.name} — ${outfit.description}${status.hint ? `\n${status.hint}` : ""}`}
              onClick={() => void act(outfit)}>
              <OutfitPreview body={state.playerBodyId} tint={outfit.tint} weapon={carried} size={short ? 60 : 76} />
              <b>{outfit.name}</b>
              <small>
                {isWorn ? "สวมอยู่" : status.unlocked ? "สวม" : price !== null ? `${price.toLocaleString()} ตำลึง${tailorHere ? "" : " · ในเมือง"}` : "🔒 " + status.hint}
              </small>
            </button>
          );
        }} />
    </div>
  );
}
