"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LocationScene } from "@/lib/world";
import { evaluateCondition, getScene } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  scene: LocationScene;
}

// Location view: place description, talk-to-NPC list, outbound routes.
// Routes navigate to a route scene (kind "route") which is its own selection
// screen — even single-destination routes get that intermediate screen so
// authors can give travel narration and the back-button stays consistent.
export function LocationView({ scene }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);

  const visibleNpcs = scene.npcs.filter(
    (n) => !n.visibleIf || evaluateCondition(state, n.visibleIf),
  );
  const visibleRoutes = scene.routes.filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            สถานที่
          </div>
          <h2 className="text-lg font-bold">{scene.name}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground italic">
            {scene.description}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            ผู้คน
          </div>
          {visibleNpcs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีใครให้พูดด้วย
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleNpcs.map((npc) => {
                const target = getScene(npc.dialogSceneId);
                const valid = target?.kind === "dialog";
                return (
                  <Button
                    key={npc.id}
                    variant="outline"
                    disabled={!valid}
                    onClick={() => gotoScene(npc.dialogSceneId)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-semibold text-sm">💬 {npc.name}</span>
                      {npc.hint && (
                        <span className="text-[10px] text-muted-foreground">
                          {npc.hint}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            เส้นทาง
          </div>
          {visibleRoutes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีเส้นทางออกจากที่นี่
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleRoutes.map((route) => {
                const target = getScene(route.routeSceneId);
                const valid = target?.kind === "route";
                return (
                  <Button
                    key={route.routeSceneId}
                    variant="outline"
                    disabled={!valid}
                    onClick={() => gotoScene(route.routeSceneId)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-semibold text-sm">🚶 {route.label}</span>
                      {route.hint && (
                        <span className="text-[10px] text-muted-foreground">
                          {route.hint}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
