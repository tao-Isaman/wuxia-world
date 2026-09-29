"use client";
import { deriveAll } from "@/lib/game";
import { getScene } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";
import { useWorldStore } from "@/store/world-store";

/**
 * The twelve double-hours (ชั่วยาม). A world day is 12 units long and starts
 * at dawn, so unit 0 is 卯 (05–07), unit 3 is 午 (noon) and unit 9 is 子.
 */
const SHICHEN = ["卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅"] as const;
const SHICHEN_THAI = ["ยามเหม่า", "ยามเฉิน", "ยามซื่อ", "ยามอู่", "ยามเว่ย", "ยามเซิน", "ยามโหย่ว", "ยามซวี", "ยามไฮ่", "ยามจื่อ", "ยามโฉ่ว", "ยามอิ๋น"];

// Hero's Adventure-style exploration HUD: a slim status strip (top-left), the
// place name on a plaque (top-centre) and a sundial with the day (top-right).
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
  const name = scene?.kind === "location" ? scene.name : scene?.kind === "route" ? scene.label.replace(/\s*\(.*\)$/, "") : "ยุทธภพ";
  const phase = time < 4 ? "ยามเช้า" : time < 8 ? "ยามบ่าย" : "ยามค่ำ";
  return <>
    <section className="player-hud" aria-label="สถานะตัวละคร">
      <div className="hud-portrait" aria-hidden="true"><CharacterPreview id={bodyId} framing="bust" /></div>
      <div className="hud-strip pixel-panel">
        <strong className="hud-player-name">{player.name}</strong>
        <div className="hud-vitals">
          <Gauge label="HP" glyph="血" value={hp} max={stats.HP} color="#d4604f" />
          <Gauge label="MP" glyph="氣" value={mp} max={stats.MP} color="#6fa9c7" />
          <Gauge label="พลัง" glyph="力" value={stamina} max={staminaMax} color="#a9bb6c" />
        </div>
        <div className="hud-wallet">
          <span title="เงิน"><i className="hud-coin" aria-hidden="true" />{gold.toLocaleString()}<span className="sr-only"> เงิน</span></span>
          <span title="W-EXP"><i className="hud-wexp" aria-hidden="true">悟</i>{wExp.toLocaleString()}<span className="sr-only"> W-EXP</span></span>
        </div>
      </div>
    </section>
    <h2 className="location-plaque" aria-label={`สถานที่: ${name}`}><span>{name}</span></h2>
    <section className="location-hud" aria-label="สถานที่และเวลา">
      <Sundial time={time} />
      <p className="hud-day"><span>วันที่</span> <b>{day}</b></p>
      <p className="hud-hour">{SHICHEN_THAI[((Math.floor(time) % 12) + 12) % 12]} · {phase}</p>
      <p className="sr-only">{name}</p>
    </section>
  </>;
}

function Gauge({ label, glyph, value, max, color }: { label: string; glyph: string; value: number; max: number; color: string }) {
  const current = Math.max(0, Math.min(value, max));
  return <div className="hud-gauge" title={`${label} ${Math.round(current)}/${max}`}>
    <span className="hud-glyph" style={{ color }} aria-hidden="true">{glyph}</span>
    <div role="progressbar" aria-label={label} aria-valuenow={current} aria-valuemin={0} aria-valuemax={max}
      className="hud-gauge-track"><div style={{ width: (max > 0 ? current / max * 100 : 0) + "%", backgroundColor: color }} /></div>
    <small>{Math.round(current)}<span>/{max}</span></small>
  </div>;
}

/** Sundial: the current double-hour sits under the gold pointer at the top. */
function Sundial({ time }: { time: number }) {
  const index = ((Math.floor(time) % 12) + 12) % 12;
  const night = index >= 7 && index <= 10; // 戌 through 丑
  const turn = -(time / 12) * 360; // the ring turns; the pointer stays up
  return <div className={`sundial${night ? " sundial--night" : ""}`} role="img"
    aria-label={`${SHICHEN_THAI[index]} (${SHICHEN[index]}) · ${night ? "กลางคืน" : "กลางวัน"}`}>
    <svg viewBox="-50 -50 100 100" aria-hidden="true">
      <circle r="48" className="sundial-rim" />
      <circle r="41" className="sundial-sky" />
      <g className="sundial-ring" style={{ transform: `rotate(${turn}deg)` }}>
        {SHICHEN.map((glyph, i) => {
          const angle = (i / 12) * 2 * Math.PI - Math.PI / 2 + Math.PI / 12;
          return <text key={glyph} x={Math.cos(angle) * 35} y={Math.sin(angle) * 35 + 4}
            className={i === index ? "sundial-current" : undefined}
            transform={`rotate(${-turn} ${Math.cos(angle) * 35} ${Math.sin(angle) * 35})`}>{glyph}</text>;
        })}
      </g>
      <circle r="22" className="sundial-face" />
      <text y="6" className="sundial-hour">{SHICHEN[index]}</text>
      <path d="M0 -49 L5 -40 L-5 -40 Z" className="sundial-pointer" />
    </svg>
  </div>;
}
