"use client";

import { deriveAll } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

// HP / MP / stamina gauges for the map HUD — a slim lacquer card above the
// icon menu (top-left), no portrait.
export function HudVitals() {
  const player = useWorldStore((s) => s.playerBuild);
  const currentHp = useWorldStore((s) => s.currentHp);
  const currentMp = useWorldStore((s) => s.currentMp);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  if (!player) return null;
  const d = deriveAll(player);
  const gauges = [
    { key: "hp", label: "HP", name: "พลังชีวิต", cur: Math.min(d.HP, currentHp), max: d.HP },
    { key: "mp", label: "MP", name: "ปราณ", cur: Math.min(d.MP, currentMp), max: d.MP },
    { key: "st", label: "พลัง", name: "กำลังกาย", cur: stamina, max: staminaMax },
  ];
  return (
    <section className="hud-strip hud-vitals-card" aria-label="พลังชีวิต ปราณ และกำลังกาย" data-testid="hud-vitals">
      <div className="hud-vitals">
        {gauges.map((g) => {
          const pct = g.max > 0 ? Math.max(0, Math.min(100, (g.cur / g.max) * 100)) : 0;
          return (
            <div key={g.key} className={`hud-gauge hud-gauge--${g.key}`} title={`${g.name} ${g.cur}/${g.max}`}
              role="meter" aria-label={g.name} aria-valuemin={0} aria-valuemax={g.max} aria-valuenow={g.cur} data-gauge={g.key}>
              <span className="hud-gauge-label">{g.label}</span>
              <span className="hud-gauge-track"><div style={{ width: `${pct}%` }} /></span>
              <small>{g.cur}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}
