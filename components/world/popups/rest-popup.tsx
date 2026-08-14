"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { RestKind } from "@/store/world-store";
import { useWorldStore } from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";

// Which rest tiers a scene offers. The roadside tier is ALWAYS available
// as a no-cost fallback (so a broke player can't get soft-locked); richer
// locations layer the better tier on top:
//   city / inn      → inn (paid full restore) + roadside
//   temple / palace → temple (free half restore) + roadside
//   everywhere else → roadside only
export function restKindsForScene(sceneId: string): RestKind[] {
  if (sceneId.startsWith("inn_") || sceneId.startsWith("city_")) {
    return ["inn", "route"];
  }
  if (sceneId.startsWith("temple_") || sceneId.startsWith("palace_")) {
    return ["temple", "route"];
  }
  return ["route"];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// 🛏 rest popup — opened from the MenuBar icon (or a rest object on a
// location map). Lists the rest tiers the current scene offers; costs
// and restore amounts stay in sync with world-store's rest action.
export function RestPopup({ open, onClose }: Props) {
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const restore = useWorldStore((s) => s.rest);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const gold = useWorldStore((s) => s.gold);

  const kinds = restKindsForScene(currentSceneId);
  const atFull = stamina >= staminaMax;

  return (
    <Modal open={open} onClose={onClose} title="🛏 พักผ่อน">
      <div className="space-y-2">
        {atFull && (
          <p className="text-[11px] text-muted-foreground italic">
            แรงเต็มอยู่แล้ว
          </p>
        )}
        {kinds.map((kind) => {
          const costGold = kind === "inn" ? 300 : 0;
          const goldShort = gold < costGold;
          const title =
            kind === "inn"    ? "🍵 พักที่โรงเตี๊ยม" :
            kind === "temple" ? "🏛 พักที่วัด" :
                                "🌿 พักริมทาง";
          const detail =
            kind === "inn"    ? `ราคา ${costGold} ทอง · 12 ชั่วยาม · ฟื้นเต็ม` :
            kind === "temple" ? `ฟรี · 12 ชั่วยาม · ฟื้น ½` :
                                `ฟรี · 12 ชั่วยาม · ฟื้น ¼`;
          return (
            <div
              key={kind}
              className="flex items-center justify-between gap-2 border border-border p-2"
            >
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
                  onClose();
                }}
              >
                พักผ่อน
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
