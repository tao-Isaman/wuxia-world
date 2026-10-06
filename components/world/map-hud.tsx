"use client";
import { useEffect, useRef, useState } from "react";
import { getScene } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { WANTED_MAX, arrestPenalty, describeSentence, sentenceLeft } from "@/lib/world/law";
import { confirmDialog } from "@/store/confirm-store";
import { toast } from "@/store/toast-store";

/** มอบตัว from the wanted chip: show what the arrest will cost, then go straight to the cells. */
async function offerSurrender() {
  const { wanted, surrender } = useWorldStore.getState();
  const p = arrestPenalty(wanted, true);
  const ok = await confirmDialog({
    title: "⛓ มอบตัวต่อทางการ",
    message: [
      `หมายจับ ${wanted} · เดินเข้าไปมอบตัวที่ทางการ ถูกคุมตัวเข้าคุกทันที`,
      `โทษจำคุก ${p.days} วัน · ค่าปรับ ${p.fine.toLocaleString()} ตำลึง (มอบตัวลดโทษกึ่งหนึ่ง ไม่ริบทรัพย์)`,
      p.cripple ? `คดีหนัก: วรยุทธ ${p.cripple} อย่างจะถูกทำลายลง 2 ระดับ` : "",
      "พ้นโทษแล้วหมายจับจะถูกล้าง",
    ].filter(Boolean).join("\n"),
    confirmText: "มอบตัว",
    variant: "warn",
  });
  if (!ok) return;
  const r = surrender();
  if (!r.ok) toast("warn", "มอบตัวไม่ได้ในตอนนี้");
}

/**
 * The twelve double-hours (ชั่วยาม). A world day is 12 units long and starts
 * at dawn, so unit 0 is 卯 (05–07), unit 3 is 午 (noon) and unit 9 is 子.
 */
const SHICHEN = ["卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅"] as const;
const SHICHEN_THAI = ["ยามเหม่า", "ยามเฉิน", "ยามซื่อ", "ยามอู่", "ยามเว่ย", "ยามเซิน", "ยามโหย่ว", "ยามซวี", "ยามไฮ่", "ยามจื่อ", "ยามโฉ่ว", "ยามอิ๋น"];

// Mobile-first exploration HUD in wuxia dress: the world stays clear (menu
// icons top-left, gold and the sundial top-right, the bottom-left free for the
// thumb joystick), and arriving somewhere raises a gold banner. HP / MP / พลัง
// live in the profile popup and the battle screen.
export function MapHud() {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);
  const wExp = useWorldStore((s) => s.wExp);
  const wanted = useWorldStore((s) => s.wanted ?? 0);
  const sentence = useWorldStore((s) => s.jailUntil == null ? null : sentenceLeft(s));
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const lastLocationId = useWorldStore((s) => s.lastLocationId);
  if (!player) return null;
  const scene = getScene(currentSceneId);
  const place = scene?.kind === "location" || scene?.kind === "route" ? scene : getScene(lastLocationId);
  const name = place?.kind === "location" ? place.name : place?.kind === "route" ? place.label.replace(/\s*\(.*\)$/, "") : "ยุทธภพ";
  const phase = time < 4 ? "ยามเช้า" : time < 8 ? "ยามบ่าย" : "ยามค่ำ";
  const hour = ((Math.floor(time) % 12) + 12) % 12;
  return <>
    {/* No party card: the map stays clear. Law status floats top-centre. */}
    {(wanted > 0 || sentence != null) && <div className="hud-law" role="status" data-hud-occluder>
      {wanted > 0 && sentence == null && <button type="button" className="hud-wanted" data-testid="hud-wanted"
        title={`หมายจับ ${wanted} — ระวังเจ้าหน้าที่ตามล่า · แตะเพื่อมอบตัว`} aria-label={`หมายจับ ${wanted} · มอบตัว`} onClick={offerSurrender}>
        ⛓ หมายจับ {wanted <= WANTED_MAX
          ? <>{"●".repeat(wanted)}<i>{"○".repeat(WANTED_MAX - wanted)}</i></>
          : <b>×{wanted}</b>} <small>มอบตัว</small></button>}
      {sentence != null && <span className="hud-sentence">
        {sentence > 0 ? `⛓ เหลือโทษ ${describeSentence(sentence)}` : "🔓 พ้นโทษแล้ว · ไปที่ประตูคุก"}</span>}
    </div>}
    <section className="location-hud" aria-label="สถานที่และเวลา" data-hud-occluder>
      <div className="hud-purse">
        <PurseDelta value={gold} />
        <span title="เงิน"><b>{gold.toLocaleString()}</b> <i>ตำลึง</i></span>
        <span title="W-EXP" className="hud-purse-wexp"><b>{wExp.toLocaleString()}</b> <i>悟</i></span>
      </div>
      <div className="hud-clock">
        <Sundial time={time} />
        <p className="hud-day"><span>วันที่</span> <b>{day}</b></p>
      </div>
      <p className="hud-hour">{SHICHEN_THAI[hour]} · {phase}</p>
      <p className="sr-only">{name}</p>
    </section>
    <ArrivalBanner sceneId={place?.kind === "location" ? place.id : null} name={name} />
  </>;
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

/** DQ XI-style gold name banner when entering a location; fades by itself. */
function ArrivalBanner({ sceneId, name }: { sceneId: string | null; name: string }) {
  const [shown, setShown] = useState<{ id: string; name: string } | null>(null);
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (!sceneId || sceneId === previous.current) return;
    const first = previous.current === null;
    previous.current = sceneId;
    // A reload into the same place is not an arrival worth announcing.
    if (first && sessionStorage.getItem("wuxia:lastBanner") === sceneId) return;
    try { sessionStorage.setItem("wuxia:lastBanner", sceneId); } catch { /* private mode */ }
    setShown({ id: sceneId, name });
    const timer = setTimeout(() => setShown(null), 3200);
    return () => clearTimeout(timer);
  }, [sceneId, name]);
  if (!shown) return null;
  return <>
    <div key={shown.id} className="arrival-banner" role="status" aria-live="polite">
      <span className="arrival-flourish" aria-hidden="true">❖</span>
      <strong>{shown.name}</strong>
      <span className="arrival-flourish" aria-hidden="true">❖</span>
    </div>
    {/* The save is written continuously; arriving is when DQ says so. */}
    <p key={`save-${shown.id}`} className="autosave-note" aria-hidden="true"><span>✒</span> บันทึกอัตโนมัติ…</p>
  </>;
}

/** Floating +N / −N beside the purse whenever gold changes (DQ reward feel). */
function PurseDelta({ value }: { value: number }) {
  const previous = useRef(value);
  const [delta, setDelta] = useState<{ id: number; amount: number } | null>(null);
  useEffect(() => {
    const amount = value - previous.current;
    previous.current = value;
    if (!amount) return;
    setDelta({ id: Date.now(), amount });
    const timer = setTimeout(() => setDelta(null), 1600);
    return () => clearTimeout(timer);
  }, [value]);
  if (!delta) return null;
  return <b key={delta.id} className={`purse-delta${delta.amount < 0 ? " purse-delta--spend" : ""}`} aria-hidden="true">
    {delta.amount > 0 ? "+" : "−"}{Math.abs(delta.amount).toLocaleString()}
  </b>;
}
