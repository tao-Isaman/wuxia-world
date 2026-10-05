"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CutsceneLine, CutsceneRuntime } from "@/lib/stage/cutscene-runtime";
import { getCutscene } from "@/lib/world/story/registry";
import type { CutsceneMood } from "@/lib/world/story/types";
import { useWorldStore } from "@/store/world-store";
import styles from "./cutscene-player.module.css";
import { RichText, visibleLength } from "./rich-text";

/**
 * Full-screen film: letterbox, the Phaser stage (lib/stage/cutscene-runtime),
 * subtitles with a typewriter, title cards, fades and a mood grade. Tap,
 * Enter or Space moves on; "อัตโนมัติ" plays hands-free; "ข้าม" ends it.
 * It is a dialog, so the world map underneath pauses.
 */
export function CutscenePlayer({ cutsceneId, onDone }: { cutsceneId: string; onDone: () => void }) {
  const def = getCutscene(cutsceneId);
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<CutsceneRuntime | null>(null);
  const finished = useRef(false);
  const heroName = useWorldStore((s) => s.playerBuild?.name ?? "จอมยุทธ์");
  const heroBody = useWorldStore((s) => s.playerBodyId);
  const [line, setLine] = useState<CutsceneLine | null>(null);
  const [shown, setShown] = useState(0);
  const [card, setCard] = useState<{ text: string; sub?: string } | null>(null);
  const [mood, setMood] = useState<CutsceneMood>("day");
  const [fade, setFade] = useState<{ to: "black" | "white" | "clear" | "flash"; ms: number }>({ to: "black", ms: 0 });
  const [ready, setReady] = useState(false);
  const [auto, setAuto] = useState(false);
  const [beat, setBeat] = useState(-1);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  useEffect(() => {
    if (!def || !host.current) { finish(); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = host.current;
    let cancelled = false;
    let created: CutsceneRuntime | null = null;
    // Phaser is browser-only: load the runtime on the client.
    void import("@/lib/stage/cutscene-runtime").then(({ createCutsceneRuntime }) => {
      if (cancelled) return;
      created = createCutsceneRuntime(node, def, { heroBody, heroName, reducedMotion: reduced }, {
        ready: () => setReady(true),
        line: (next) => { setLine(next); setShown(0); },
        title: setCard,
        fade: (to, ms) => setFade({ to, ms }),
        mood: setMood,
        beat: setBeat,
        done: finish,
        error: () => finish(),
      });
      runtime.current = created;
      created.setAuto(auto);
    }).catch(() => finish());
    return () => { cancelled = true; created?.destroy(); runtime.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cutsceneId]);

  // Typewriter for the current line.
  const text = line?.text ?? "";
  const full = visibleLength(text);
  useEffect(() => {
    if (shown >= full) return;
    const timer = setTimeout(() => setShown((n) => Math.min(full, n + 2)), 22);
    return () => clearTimeout(timer);
  }, [shown, full]);

  const advance = () => {
    if (line && shown < full) { setShown(full); return; }
    runtime.current?.advance();
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); advance(); }
      if (event.key === "Escape") { event.preventDefault(); runtime.current?.skip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => { runtime.current?.setAuto(auto); }, [auto]);

  if (!def || typeof document === "undefined") return null;
  // Portal to <body>: a transformed ancestor (a menu Modal) would otherwise
  // trap this position: fixed layer inside itself.
  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={`ฉาก: ${def.label}`}
      data-testid="cutscene" data-cutscene-id={def.id} data-ready={ready} data-beat={beat} data-mood={mood}
      onClick={advance}>
      <div ref={host} className={`${styles.stage} ${styles[`mood_${mood}`] ?? ""}`} />
      <div className={styles.vignette} aria-hidden="true" />
      {mood === "past" && <div className={styles.grain} aria-hidden="true" />}
      <div className={`${styles.bar} ${styles.top}`} aria-hidden="true" />
      <div className={`${styles.bar} ${styles.bottom}`} aria-hidden="true" />
      <div className={styles.fade} data-fade={fade.to}
        style={{ transitionDuration: `${fade.to === "flash" ? 60 : fade.ms}ms` }}
        onTransitionEnd={() => { if (fade.to === "flash") setFade({ to: "clear", ms: 260 }); }} aria-hidden="true" />
      {card && <div className={styles.card}>
        <h2>{card.text}</h2>
        {card.sub && <p>{card.sub}</p>}
      </div>}
      {line && <div className={`${styles.subtitle} ${line.kind === "narrate" ? styles.narrate : ""} ${line.kind === "think" ? styles.think : ""}`}
        aria-live="polite">
        {line.speaker && line.kind !== "narrate" && <span className={styles.speaker}>{line.speaker}</span>}
        <p>{line.kind === "say" ? <>“<RichText text={text} shown={shown} />”</> : <RichText text={text} shown={shown} />}</p>
        {shown >= full && <span className={styles.next} aria-hidden="true">▼</span>}
      </div>}
      <div className={styles.controls} onClick={(event) => event.stopPropagation()}>
        <button type="button" aria-pressed={auto} onClick={() => setAuto((on) => !on)}>{auto ? "■ อัตโนมัติ" : "▶ อัตโนมัติ"}</button>
        <button type="button" onClick={() => runtime.current?.skip()}>ข้าม ⏭</button>
      </div>
    </div>,
    document.body,
  );
}
