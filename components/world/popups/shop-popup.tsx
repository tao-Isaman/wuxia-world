"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  ITEM_CATEGORY_LABEL,
  getItem,
  type ItemCategory,
  type ShopDef,
} from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

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
                  className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong>{def.name}</strong>
                      {def.category && (
                        <Badge variant="outline" className="text-[9px]">
                          {ITEM_CATEGORY_LABEL[def.category]}
                        </Badge>
                      )}
                    </div>
                    {def.description && (
                      <div className="text-[10px] text-muted-foreground">{def.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-amber-700 font-mono">{price}🟡</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      disabled={!canAfford}
                      onClick={() => {
                        const r = buyItem(id, 1);
                        if (!r.ok) {
                          toast("error", r.reason === "no-gold" ? "ทองไม่พอ" : "ซื้อไม่ได้");
                          return;
                        }
                        toast("success", `ซื้อ ${def.name} · -${r.spent}🟡`);
                      }}
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
                  className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong>{def.name}</strong>
                      <Badge variant="outline" className="text-[10px]">×{n}</Badge>
                      {def.category && (
                        <Badge variant="outline" className="text-[9px]">
                          {ITEM_CATEGORY_LABEL[def.category]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-amber-700 font-mono">{sellPrice}🟡</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        const r = sellItem(id, 1, shop.sellMultiplier);
                        if (!r.ok) {
                          toast("error", "ขายไม่ได้");
                          return;
                        }
                        toast("success", `ขาย ${def.name} · +${r.gained}🟡`);
                      }}
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
    </Modal>
  );
}
