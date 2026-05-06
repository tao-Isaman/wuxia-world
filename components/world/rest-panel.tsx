"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RestKind } from "@/store/world-store";
import { useWorldStore } from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";

interface Props {
  kind: RestKind;
}

// Small "พัก" card surfaced on inn/temple/route screens. Costs and restore
// amounts are computed from the player's staminaMax to stay in sync with
// world-store's rest action. Result feedback flows through the toast
// stack instead of an inline message.
export function RestPanel({ kind }: Props) {
  const restore = useWorldStore((s) => s.rest);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const gold = useWorldStore((s) => s.gold);

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
      <CardContent className="p-3">
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
              flashLoading("กำลังพักผ่อน...");
              const r = restore(kind);
              if (!r.ok) {
                toast("error", "ทองไม่พอจะพักโรงเตี๊ยม");
                return;
              }
              toast("success", `พักผ่อนแล้ว · ฟื้น ${r.restored} แรง · เวลาเดินไป 12 ชั่วยาม`);
            }}
          >
            พักผ่อน
          </Button>
        </div>
        {atFull && (
          <div className="mt-2 text-[10px] text-muted-foreground italic">
            แรงเต็มอยู่แล้ว
          </div>
        )}
      </CardContent>
    </Card>
  );
}
