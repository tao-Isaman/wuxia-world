"use client";

import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  STAT_KEYS,
  STAT_LABEL,
  STAT_BUDGET,
  totalStatPoints,
  type Side,
} from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";

interface Props {
  side: Side;
}

export function StatSliders({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const setStat = useCharacterStore((s) => s.setStat);

  const total = useMemo(() => totalStatPoints(build.stats), [build.stats]);
  const remaining = STAT_BUDGET - total;
  const pct = (total / STAT_BUDGET) * 100;
  const indicatorColor =
    remaining === 0 ? "#E24B4A" : remaining < 20 ? "#BA7517" : "#7F77DD";

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>คะแนน <strong className="text-foreground">{total}</strong>/{STAT_BUDGET}</span>
          <span className={remaining === 0 ? "text-destructive" : ""}>เหลือ {remaining}</span>
        </div>
        <Progress value={pct} indicatorColor={indicatorColor} className="h-2" />
      </div>

      <div className="space-y-2">
        {STAT_KEYS.map((k) => {
          const cur = build.stats[k];
          const max = Math.min(cur + remaining, 100);
          return (
            <div key={k} className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-16 shrink-0">{STAT_LABEL[k]}</label>
              <Slider
                min={1}
                max={max}
                step={1}
                value={[cur]}
                onValueChange={(v) => setStat(side, k, v[0])}
                className="flex-1"
              />
              <span className="text-xs font-semibold w-8 text-right">{cur}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
