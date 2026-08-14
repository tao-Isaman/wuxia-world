"use client";

import { Progress } from "@/components/ui/progress";
import { deriveAll } from "@/lib/game";
import { getScene } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

// Compact in-map status HUD (top-left overlay of the fullscreen map):
// location name, player name, HP / MP / stamina bars, gold, w-exp,
// day + time — the fullscreen replacement for StatusBar.
export function MapHud() {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const currentHp = useWorldStore((s) => s.currentHp);
  const currentMp = useWorldStore((s) => s.currentMp);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);
  const wExp = useWorldStore((s) => s.wExp);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);

  if (!player) return null;
  const d = deriveAll(player);
  const hpCur = Math.min(d.HP, currentHp);
  const mpCur = Math.min(d.MP, currentMp);
  const scene = getScene(currentSceneId);
  const sceneName = scene?.kind === "location" ? scene.name : "";

  return (
    <div className="absolute top-2 left-2 z-30 w-56 p-2 bg-ink/80 text-paper space-y-1 shadow-pixel">
      <div className="flex items-baseline justify-between gap-2">
        <strong className="font-display text-sm truncate">{player.name}</strong>
        <span className="text-[10px] text-paper/70 font-display truncate">
          {sceneName}
        </span>
      </div>
      <HudGauge label="HP" variant="hp" cur={hpCur} max={d.HP} />
      <HudGauge label="MP" variant="qi" cur={mpCur} max={d.MP} />
      <HudGauge label="พลัง" variant="stamina" cur={stamina} max={staminaMax} />
      <div className="flex items-center justify-between text-[10px] text-paper/80 font-mono">
        <span>💰 {gold}</span>
        <span className="text-jade">w-exp {wExp}</span>
        <span>
          วันที่ {day} · {time.toFixed(1)}/12
        </span>
      </div>
    </div>
  );
}

function HudGauge({
  label,
  variant,
  cur,
  max,
}: {
  label: string;
  variant: "hp" | "qi" | "stamina";
  cur: number;
  max: number;
}) {
  const pct = max > 0 ? (cur / max) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 text-[9px] font-display tracking-wider uppercase text-paper/80">
        {label}
      </span>
      <Progress value={pct} variant={variant} pixel className="h-2 flex-1" />
      <span className="w-14 text-right text-[9px] font-mono text-paper/90">
        {cur}/{max}
      </span>
    </div>
  );
}
