"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deriveAll } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

// Top-of-page status banner — always visible on every world scene so the
// player can see HP / MP / gold without opening the sidebar. Battle has its
// own HP bars in BattleArena, so this only renders in the non-combat world.
//
// HP / MP are sourced from `deriveAll(playerBuild)` (max stats). The world
// store doesn't yet track post-battle damage, so the bars currently sit at
// 100 %; once a `currentHp / currentMp` field is added to WorldStateData
// the same component will pick it up automatically.
export function StatusBar() {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);
  const wExp = useWorldStore((s) => s.wExp);

  if (!player) return null;

  const d = deriveAll(player);
  const hpCur = d.HP;
  const mpCur = d.MP;
  const hpPct = d.HP > 0 ? (hpCur / d.HP) * 100 : 0;
  const mpPct = d.MP > 0 ? (mpCur / d.MP) * 100 : 0;
  const stPct = staminaMax > 0 ? (stamina / staminaMax) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-4 flex-wrap">
          <strong className="text-sm shrink-0">{player.name}</strong>

          <div className="flex-1 min-w-[120px]">
            <div className="flex items-baseline justify-between text-[10px] mb-0.5">
              <span className="font-semibold tracking-wider uppercase text-rose-600">HP</span>
              <span className="font-mono text-foreground">{hpCur} / {d.HP}</span>
            </div>
            <Progress value={hpPct} indicatorColor="hsl(0, 75%, 55%)" className="h-2" />
          </div>

          <div className="flex-1 min-w-[120px]">
            <div className="flex items-baseline justify-between text-[10px] mb-0.5">
              <span className="font-semibold tracking-wider uppercase text-sky-600">MP</span>
              <span className="font-mono text-foreground">{mpCur} / {d.MP}</span>
            </div>
            <Progress value={mpPct} indicatorColor="hsl(210, 75%, 55%)" className="h-2" />
          </div>

          <div className="flex-1 min-w-[120px]">
            <div className="flex items-baseline justify-between text-[10px] mb-0.5">
              <span className="font-semibold tracking-wider uppercase text-emerald-600">⚡ พลัง</span>
              <span className="font-mono text-foreground">{stamina} / {staminaMax}</span>
            </div>
            <Progress value={stPct} indicatorColor="hsl(140, 60%, 45%)" className="h-2" />
          </div>

          <div className="shrink-0 text-xs">
            <span className="text-muted-foreground">ทอง </span>
            <strong className="text-amber-600">{gold}</strong>
          </div>

          <div className="shrink-0 text-xs">
            <span className="text-muted-foreground">w-exp </span>
            <strong className="text-violet-600">{wExp}</strong>
          </div>

          <div className="shrink-0 text-xs">
            <span className="text-muted-foreground">วันที่ </span>
            <strong>{day}</strong>
            <span className="text-muted-foreground"> · ⌛ </span>
            <strong className="font-mono">{time.toFixed(1)}</strong>
            <span className="text-muted-foreground">/12</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
