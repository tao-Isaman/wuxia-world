"use client";
import { deriveAll } from "@/lib/game";
import { getScene } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";
import { useWorldStore } from "@/store/world-store";

export function MapHud() {
  const player = useWorldStore((s) => s.playerBuild);
  const bodyId = useWorldStore((s) => s.playerBodyId);
  const gold = useWorldStore((s) => s.gold);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const hp = useWorldStore((s) => s.currentHp);
  const mp = useWorldStore((s) => s.currentMp);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);
  const wExp = useWorldStore((s) => s.wExp);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  if (!player) return null;
  const stats = deriveAll(player);
  const scene = getScene(currentSceneId);
  const name = scene?.kind === "location" ? scene.name : scene?.kind === "route" ? scene.label : "ยุทธภพ";
  return <>
    <section className="player-hud pixel-panel" aria-label="สถานะตัวละคร">
      <div className="hud-portrait">
        <CharacterPreview id={bodyId} />
      </div>
      <div className="hud-vitals">
        <strong className="hud-player-name">{player.name}</strong>
        <Gauge label="HP" value={hp} max={stats.HP} color="#cf6555" />
        <Gauge label="MP" value={mp} max={stats.MP} color="#75a5b6" />
        <Gauge label="พลัง" value={stamina} max={staminaMax} color="#a3b476" />
      </div>
      <div className="hud-wallet"><span>เงิน <b>{gold.toLocaleString()}</b></span><span>W-EXP <b>{wExp.toLocaleString()}</b></span></div>
    </section>
    <section className="location-hud pixel-panel" aria-label="สถานที่และเวลา">
      <span className="location-ornament" aria-hidden="true">◇</span>
      <div><strong>{name}</strong><p>วันที่ {day} · {time < 4 ? "ยามเช้า" : time < 8 ? "ยามบ่าย" : "ยามค่ำ"}</p></div>
    </section>
  </>;
}
function Gauge({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const current = Math.max(0, Math.min(value, max));
  return <div className="hud-gauge">
    <span>{label}</span>
    <div role="progressbar" aria-label={label} aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}
      className="hud-gauge-track"><div style={{ width: (max > 0 ? current / max * 100 : 0) + "%", backgroundColor: color }} /></div>
    <small>{Math.round(current)}/{max}</small>
  </div>;
}
