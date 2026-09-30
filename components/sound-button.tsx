"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getAudioSettings, setAudioSettings, subscribeAudio, unlockAudio } from "@/lib/audio/engine";

const defaults = { music: true, sfx: true, musicVolume: 0.55, sfxVolume: 0.8 };

/** ♪ button with a small bubble: music and sound-effect switches and volumes. */
export function SoundButton({ className = "hud-icon" }: { className?: string }) {
  const settings = useSyncExternalStore(subscribeAudio, getAudioSettings, () => defaults);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", escape); };
  }, [open]);
  const silent = !settings.music && !settings.sfx;
  return (
    <span ref={root} className="sound-control">
      <button type="button" className={className} aria-label="เสียง" title="เสียง" aria-expanded={open}
        onClick={() => { unlockAudio(); setOpen((value) => !value); }}>
        <span className="hud-icon-glyph" aria-hidden="true">{silent ? "🔇" : "♪"}</span>
        <span className="hud-icon-label" aria-hidden="true">เสียง</span>
      </button>
      {open && (
        <div className="sound-bubble" role="group" aria-label="ตั้งค่าเสียง">
          <label>
            <input type="checkbox" checked={settings.music} onChange={(e) => setAudioSettings({ music: e.target.checked })} />
            <span>ดนตรี</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} aria-label="ความดังดนตรี"
              disabled={!settings.music} onChange={(e) => setAudioSettings({ musicVolume: Number(e.target.value) })} />
          </label>
          <label>
            <input type="checkbox" checked={settings.sfx} onChange={(e) => setAudioSettings({ sfx: e.target.checked })} />
            <span>เสียงประกอบ</span>
            <input type="range" min={0} max={1} step={0.05} value={settings.sfxVolume} aria-label="ความดังเสียงประกอบ"
              disabled={!settings.sfx} onChange={(e) => setAudioSettings({ sfxVolume: Number(e.target.value) })} />
          </label>
        </div>
      )}
    </span>
  );
}
