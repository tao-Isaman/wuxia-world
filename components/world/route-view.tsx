"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RouteScene } from "@/lib/world";
import { evaluateCondition } from "@/lib/world";
import { TRAVEL_STAMINA_COST, useWorldStore } from "@/store/world-store";

interface Props {
  scene: RouteScene;
}

// Route view: travel narration + destination list + back button.
// The back target is `scene.back` if explicitly set, otherwise lastLocationId
// (the location the player came from). If neither is available, the back
// button is hidden — that should only happen if the route was reached via
// goto and the player has never visited a location, which is unusual.
export function RouteView({ scene }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const stamina = useWorldStore((s) => s.stamina);
  const tooTired = stamina < TRAVEL_STAMINA_COST;

  const visibleDests = scene.destinations.filter(
    (d) => !d.visibleIf || evaluateCondition(state, d.visibleIf),
  );

  const backTarget = scene.back ?? state.lastLocationId;

  const travel = useWorldStore((s) => s.travelRoute);

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            กำลังเดินทาง
          </div>
          <h2 className="text-lg font-bold">🚶 {scene.label}</h2>
          {scene.description && (
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              {scene.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            จุดหมาย
          </div>
          {visibleDests.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีปลายทางที่ผ่านได้ตอนนี้
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleDests.map((d) => (
                <Button
                  key={d.locationId}
                  variant="outline"
                  disabled={tooTired}
                  onClick={() => travel(d.locationId)}
                  className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">→ {d.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ⚡ {TRAVEL_STAMINA_COST}
                      {d.hint && <span className="ml-2">{d.hint}</span>}
                      {tooTired && (
                        <span className="text-rose-600 ml-2">พลังไม่พอ</span>
                      )}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          )}
          {backTarget && backTarget !== state.currentSceneId && (
            <Button
              variant="ghost"
              size="sm"
              disabled={tooTired}
              onClick={() => gotoScene(backTarget)}
              className="w-full text-xs text-muted-foreground"
            >
              ← ย้อนกลับ
              {tooTired && <span className="text-rose-600 ml-2">พลังไม่พอ</span>}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
