"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getItem, type NpcDef } from "@/lib/world";
import { GIFT_COOLDOWN_DAYS, GIFT_REACTION_LINE, GOLD_GIFTS, giftWaitDays, giftable } from "@/lib/world/gifts";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

/** "ให้ของขวัญ" on the NPC card: pick an item from the bag, or some gold. One gift per NPC a month. */
export function GiftPicker({ npc }: { npc: NpcDef }) {
  const [open, setOpen] = useState(false);
  const inventory = useWorldStore((s) => s.inventory);
  const gold = useWorldStore((s) => s.gold);
  const wait = useWorldStore((s) => giftWaitDays(s, npc.id));
  const giveGift = useWorldStore((s) => s.giveGift);
  const items = Object.entries(inventory)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ item: getItem(id), n }))
    .filter((e): e is { item: NonNullable<ReturnType<typeof getItem>>; n: number } => giftable(e.item))
    .sort((a, b) => (b.item.price ?? 0) - (a.item.price ?? 0));

  const give = (gift: { itemId: string } | { gold: number }) => {
    const result = giveGift(npc.id, gift);
    if (!result.ok) { toast("warn", result.message); return; }
    toast(result.points >= 0 ? "success" : "warn", `${npc.name} ${GIFT_REACTION_LINE[result.reaction]} · ความสนิท ${result.points >= 0 ? "+" : ""}${result.points}`);
    setOpen(false);
  };

  return (
    <div data-testid="gift-picker">
      <Button variant="outline" disabled={wait > 0} onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="w-full justify-start text-left h-auto py-2 whitespace-normal">
        <span className="flex flex-col items-start gap-0.5">
          <span className="font-semibold text-sm npc-action-label">ให้ของขวัญ</span>
          <span className="text-[10px] text-muted-foreground">
            {wait > 0 ? `ให้ได้อีกใน ${wait} วัน` : `เพิ่มความสนิทตามความชอบ · เดือนละครั้ง (${GIFT_COOLDOWN_DAYS} วัน)`}
          </span>
        </span>
      </Button>
      {open && wait === 0 && (
        <div className="mt-1.5 space-y-1.5 border border-border p-2 bg-muted/20">
          <div className="flex flex-wrap gap-1.5">
            {GOLD_GIFTS.map((amount) => (
              <Button key={amount} size="sm" variant="outline" disabled={gold < amount} onClick={() => give({ gold: amount })}
                data-gift-gold={amount}>💰 {amount}</Button>
            ))}
          </div>
          {items.length === 0
            ? <p className="text-xs text-muted-foreground">ในย่ามไม่มีของที่เหมาะจะให้</p>
            : <ul className="max-h-48 overflow-auto space-y-1">
                {items.map(({ item, n }) => (
                  <li key={item.id}>
                    <button type="button" className="w-full flex justify-between gap-2 text-left text-xs px-2 py-1 hover:bg-muted/40"
                      onClick={() => give({ itemId: item.id })} data-gift-item={item.id}>
                      <span>{item.name} <span className="text-muted-foreground">×{n}</span></span>
                      <span className="text-muted-foreground tabular-nums">{item.price} ตำลึง</span>
                    </button>
                  </li>
                ))}
              </ul>}
        </div>
      )}
    </div>
  );
}
