"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RestKind } from "@/store/world-store";
import { useWorldStore } from "@/store/world-store";

interface Props {
  kind: RestKind;
}

// Small "พัก" card surfaced on inn/temple/route screens. Costs and restore
// amounts are computed from the player's staminaMax to stay in sync with
// world-store's rest action.
export function RestPanel({ kind }: Props) {
  const restore = useWorldStore((s) => s.rest);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const gold = useWorldStore((s) => s.gold);
  const [last, setLast] = useState<string | null>(null);

  const costGold = kind === "inn" ? 300 : 0;
  const goldShort = gold < costGold;
  const atFull = stamina >= staminaMax;

  const title =
    kind === "inn"    ? "🍵 พักที่โรงเตี๊ยม" :
    kind === "temple" ? "🏛 พักที่วัด" :
                        "🌿 พักริมทาง";

  const detail =
    kind === "inn"    ? `ราคา ${costGold} ทอง · 12 ชั่วยาม · ฟื้นเต็ม` :
    kind === "temple" ? `ฟรี · 12 ชั่วยาม · ฟื้น ½` :
                        `ฟรี · 12 ชั่วยาม · ฟื้น ¼`;

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col items-start gap-0.5">
            <strong className="text-sm">{title}</strong>
            <span className="text-[10px] text-muted-foreground">{detail}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={goldShort || atFull}
            onClick={() => {
              const r = restore(kind);
              if (!r.ok) {
                setLast("ทองไม่พอจะพักโรงเตี๊ยม");
                return;
              }
              setLast(`พักผ่อนแล้ว · ฟื้น ${r.restored} แรง · เวลาเดินไป 12 ชั่วยาม`);
            }}
          >
            พักผ่อน
          </Button>
        </div>
        {last && (
          <div className="rounded bg-muted/40 px-2 py-1.5 text-[11px]">{last}</div>
        )}
        {atFull && (
          <div className="text-[10px] text-muted-foreground italic">
            แรงเต็มอยู่แล้ว
          </div>
        )}
      </CardContent>
    </Card>
  );
}
