"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deriveAll } from "@/lib/game";
import { getItem } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

export function PlayerStatus() {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const inventory = useWorldStore((s) => s.inventory);

  if (!player) return null;

  const d = deriveAll(player);
  const items = Object.entries(inventory).filter(([, n]) => n > 0);

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <strong className="text-sm">{player.name}</strong>
            <Badge variant="outline" className="text-[9px]">
              snapshot
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
            <span className="text-muted-foreground">HP <strong className="text-foreground">{d.HP}</strong></span>
            <span className="text-muted-foreground">MP <strong className="text-foreground">{d.MP}</strong></span>
            <span className="text-muted-foreground">ATK <strong className="text-foreground">{d.Atk}</strong></span>
            <span className="text-muted-foreground">SPD <strong className="text-foreground">{d.Spd}</strong></span>
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            ทรัพย์สิน
          </div>
          <div className="text-xs">
            ทอง: <strong className="text-amber-600">{gold}</strong>
          </div>
        </div>

        <div className="border-t pt-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            ของในย่าม
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">ว่างเปล่า</p>
          ) : (
            <ul className="space-y-1">
              {items.map(([id, n]) => {
                const def = getItem(id);
                return (
                  <li key={id} className="text-xs">
                    <strong>{def?.name ?? id}</strong> ×{n}
                    {def?.description && (
                      <div className="text-[10px] text-muted-foreground">{def.description}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
