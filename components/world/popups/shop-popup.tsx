"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ITEM_CATEGORY_LABEL,
  getItem,
  type ItemCategory,
  type ShopDef,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { ItemEffects } from "@/components/world/item-effects";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { itemIconUrl } from "@/lib/world/data/item-icons";
import { itemRarity, rarityColor } from "@/lib/ui/rarity";

interface Props {
  open: boolean;
  shop: ShopDef | null;
  onClose: () => void;
}

// Generic shop popup — buy from `shop.inventory`, sell from the player's
// bag. The same component drives city general stores, inn food shops, and
// village stalls; the only differences are the inventory list, which
// categories the shop accepts on sell-back, and the sell-multiplier.
export function ShopPopup({ open, shop, onClose }: Props) {
  const gold = useWorldStore((s) => s.gold);
  const inventory = useWorldStore((s) => s.inventory);
  const buyItem = useWorldStore((s) => s.buyItem);
  const sellItem = useWorldStore((s) => s.sellItem);
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  // The item whose details are open (tap a row or its tile), on either tab.
  const [detailId, setDetailId] = useState<string | null>(null);
  useEffect(() => { if (!open) setDetailId(null); }, [open]);

  if (!shop) return null;

  const accepts: readonly ItemCategory[] | undefined = shop.acceptsCategories;
  const acceptsAll = !accepts || accepts.length === 0;

  const canSell = (cat: ItemCategory | undefined): boolean => {
    if (acceptsAll) return true;
    if (!cat) return false;
    return accepts!.includes(cat);
  };

  const sellable = Object.entries(inventory).filter(([id, n]) => {
    if (n <= 0) return false;
    const def = getItem(id);
    if (!def) return false;
    if ((def.price ?? 0) <= 0) return false; // unsellable (quest items)
    return canSell(def.category);
  });

  const buy = (id: string, name: string) => {
    const r = buyItem(id, 1);
    if (!r.ok) {
      toast("error", r.reason === "no-gold" ? "ทองไม่พอ" : "ซื้อไม่ได้");
      return;
    }
    toast("success", `ซื้อ ${name} · -${r.spent}🟡`);
  };
  const sell = (id: string, name: string) => {
    const r = sellItem(id, 1, shop.sellMultiplier);
    if (!r.ok) {
      toast("error", "ขายไม่ได้");
      return;
    }
    toast("success", `ขาย ${name} · +${r.gained}🟡`);
  };
  const detail = detailId ? getItem(detailId) : null;
  const detailOwned = detailId ? inventory[detailId] ?? 0 : 0;
  const detailSelling = tab === "sell";
  const detailPrice = detail ? (detailSelling ? Math.floor((detail.price ?? 0) * shop.sellMultiplier) : detail.price ?? 0) : 0;

  return (
    <Modal open={open} onClose={onClose} title={shop.label}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={tab === "buy" ? "default" : "outline"}
              className="h-7 text-[11px]"
              onClick={() => setTab("buy")}
            >
              ซื้อ
            </Button>
            <Button
              size="sm"
              variant={tab === "sell" ? "default" : "outline"}
              className="h-7 text-[11px]"
              onClick={() => setTab("sell")}
            >
              ขาย ({Math.round(shop.sellMultiplier * 100)}%)
            </Button>
          </div>
          <div>
            <span className="text-muted-foreground">ทอง </span>
            <strong className="text-amber-600">{gold}</strong>
          </div>
        </div>

        {tab === "buy" ? (
          <ul className="space-y-1.5">
            {shop.inventory.map((id) => {
              const def = getItem(id);
              if (!def) return null;
              const price = def.price ?? 0;
              const canAfford = gold >= price;
              return (
                <li
                  key={id}
                  className="shop-row"
                  data-shop-item={id}
                  onClick={() => setDetailId(id)}
                >
                  <ItemTile glyph={CATEGORY_GLYPH[def.category ?? "misc"]} icon={itemIconUrl(def.id)} rarity={itemRarity(def.price)} label={`ดูรายละเอียด ${def.name}`} onClick={() => setDetailId(id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="shop-name" style={{ color: rarityColor(itemRarity(def.price)) }}>{def.name}</strong>
                      {def.category && (
                        <Badge variant="outline" className="text-[9px]">
                          {ITEM_CATEGORY_LABEL[def.category]}
                        </Badge>
                      )}
                    </div>
                    {def.description && (
                      <div className="text-[10px] text-muted-foreground">{def.description}</div>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-1" aria-label="ผลเมื่อใช้">
                      <ItemEffects effect={def.use} battle={def.battle} />
                      <span className="text-[10px] text-muted-foreground">มี {inventory[id] ?? 0} ชิ้น</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="shop-price"><i className="hud-coin" aria-hidden="true" />{price}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 min-w-11 px-2 text-[11px]"
                      disabled={!canAfford}
                      onClick={(e) => { e.stopPropagation(); buy(id, def.name); }}
                    >
                      ซื้อ
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : sellable.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2 text-center">
            ไม่มีของที่ขายให้ร้านนี้ได้ (
            {acceptsAll
              ? "ลองหาของในย่ามอีกครั้ง"
              : `รับซื้อเฉพาะ: ${accepts!.map((c) => ITEM_CATEGORY_LABEL[c]).join(", ")}`}
            )
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sellable.map(([id, n]) => {
              const def = getItem(id);
              if (!def) return null;
              const price = def.price ?? 0;
              const sellPrice = Math.floor(price * shop.sellMultiplier);
              return (
                <li
                  key={id}
                  className="shop-row"
                  data-shop-item={id}
                  onClick={() => setDetailId(id)}
                >
                  <ItemTile glyph={CATEGORY_GLYPH[def.category ?? "misc"]} icon={itemIconUrl(def.id)} rarity={itemRarity(def.price)} count={n} label={`ดูรายละเอียด ${def.name}`} onClick={() => setDetailId(id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong className="shop-name" style={{ color: rarityColor(itemRarity(def.price)) }}>{def.name}</strong>
                      <Badge variant="outline" className="text-[10px]">×{n}</Badge>
                      {def.category && (
                        <Badge variant="outline" className="text-[9px]">
                          {ITEM_CATEGORY_LABEL[def.category]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="shop-price"><i className="hud-coin" aria-hidden="true" />{sellPrice}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 min-w-11 px-2 text-[11px]"
                      onClick={(e) => { e.stopPropagation(); sell(id, def.name); }}
                    >
                      ขาย
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ─── The tapped item: a small window over the shop, portalled to
           <body> so the shop card's transform and scroll don't clip it ── */}
      {detail && detailId && typeof document !== "undefined" && createPortal(
        <div className="bag-popup-backdrop shop-detail-backdrop" onClick={() => setDetailId(null)}>
          <div className="bag-popup" role="dialog" aria-label="รายละเอียดสินค้า" data-testid="shop-item-detail" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bag-popup-close" aria-label="กลับไปที่ร้าน" onClick={() => setDetailId(null)}>✕</button>
            <h3 className="bag-detail-name" style={{ color: rarityColor(itemRarity(detail.price)) }}>{detail.name}</h3>
            <p className="bag-detail-meta">
              {ITEM_CATEGORY_LABEL[detail.category ?? "misc"]} · มีอยู่ {detailOwned} ชิ้น · {detailSelling ? "ร้านรับซื้อ" : "ราคา"} {detailPrice} ทอง
            </p>
            {detail.description && <p className="bag-detail-text">{detail.description}</p>}
            <div className="bag-detail-effects"><ItemEffects effect={detail.use} battle={detail.battle} /></div>
            {detailSelling ? (
              <button type="button" className="pixel-action bag-detail-action" disabled={detailOwned <= 0}
                onClick={() => sell(detailId, detail.name)}>ขาย 1 ชิ้น (+{detailPrice})</button>
            ) : (
              <button type="button" className="pixel-action bag-detail-action" disabled={gold < detailPrice}
                onClick={() => buy(detailId, detail.name)}>ซื้อ 1 ชิ้น (−{detailPrice})</button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </Modal>
  );
}
