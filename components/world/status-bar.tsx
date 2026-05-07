"use client";

import { Panel } from "@/components/ui/wuxia/panel";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { deriveAll } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

// Top-of-page status banner — always visible on every world scene.
//
// Wuxia redesign: cream paper Panel with vermilion-accented frame; HP /
// MP / Stamina use the new Progress `variant` prop (hp = red, qi = blue,
// stamina = jade); proper-noun bits (player name) use the Charm display
// font; numeric metrics stay in the readable Sarabun body font; gold +
// w-exp render as vermilion seal-stamp Badges so they read as primary
// values, not chrome.
//
// Mobile layout: the row wraps automatically — at narrow widths the
// three bars and the metric chips drop onto separate lines instead of
// crushing each other. Each bar has a min-width so it doesn't squeeze
// below readability.
export function StatusBar() {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const currentHp = useWorldStore((s) => s.currentHp);
  const currentMp = useWorldStore((s) => s.currentMp);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);
  const wExp = useWorldStore((s) => s.wExp);

  if (!player) return null;

  const d = deriveAll(player);
  const hpCur = Math.min(d.HP, currentHp);
  const mpCur = Math.min(d.MP, currentMp);
  const hpPct = d.HP > 0 ? (hpCur / d.HP) * 100 : 0;
  const mpPct = d.MP > 0 ? (mpCur / d.MP) * 100 : 0;
  const stPct = staminaMax > 0 ? (stamina / staminaMax) * 100 : 0;

  return (
    <Panel padding="p-3">
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        {/* Player name — Charm display font, no shrink */}
        <strong className="font-display text-base shrink-0 text-ink">
          {player.name}
        </strong>

        <StatGauge
          label="HP"
          variant="hp"
          cur={hpCur}
          max={d.HP}
          pct={hpPct}
        />
        <StatGauge
          label="MP"
          variant="qi"
          cur={mpCur}
          max={d.MP}
          pct={mpPct}
        />
        <StatGauge
          label="พลัง"
          variant="stamina"
          cur={stamina}
          max={staminaMax}
          pct={stPct}
        />

        {/* Metric chips — gold + w-exp use seal badges for high signal */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <span className="text-muted-foreground">ทอง</span>
          <Badge variant="seal" className="font-mono text-[11px] px-2 py-0.5">
            {gold}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <span className="text-muted-foreground">w-exp</span>
          <Badge
            variant="outline"
            className="font-mono text-[11px] px-2 py-0.5 border-2 border-jade text-jade"
          >
            {wExp}
          </Badge>
        </div>

        {/* Day + time — calligraphic header style */}
        <div className="shrink-0 text-xs flex items-center gap-1.5">
          <span className="text-muted-foreground font-display">วันที่</span>
          <strong className="font-display text-sm text-ink">{day}</strong>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-foreground">
            {time.toFixed(1)}
            <span className="text-muted-foreground">/12</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}

interface StatGaugeProps {
  label: string;
  variant: "hp" | "qi" | "stamina";
  cur: number;
  max: number;
  pct: number;
}

// One stat gauge — label + numeric reading + segmented bar. The
// segmented bar (`pixel` prop on Progress) gives the classic-JRPG read.
function StatGauge({ label, variant, cur, max, pct }: StatGaugeProps) {
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-baseline justify-between text-[10px] mb-0.5">
        <span className="font-display tracking-wider uppercase text-ink/80">
          {label}
        </span>
        <span className="font-mono text-foreground">
          {cur} / {max}
        </span>
      </div>
      <Progress value={pct} variant={variant} pixel className="h-2.5" />
    </div>
  );
}
