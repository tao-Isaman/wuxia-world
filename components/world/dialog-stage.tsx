"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DialogScene } from "@/lib/world";
import { evaluateCondition, npcPortrait, splitBeats } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { CharacterPreview } from "@/components/game/character-preview";
import { npcCharacterId } from "@/lib/characters/catalog";
import { DialogDisplay, useHeroNamer } from "./dialog-display";
import { visibleLength } from "./rich-text";
import { keyTick } from "@/lib/audio/engine";
import { ChoicePanel } from "./choice-panel";
import { CutscenePlayer } from "./cutscene-player";
import type { SceneLine } from "@/lib/world";

import styles from "./dialog-stage.module.css";

/**
 * The conversation standard (every NPC talk, quest offer, hand-in and story
 * beat), laid out like a cutscene: letterbox bars, the speaker standing at the
 * left, one line at a time typed out as a subtitle; tap anywhere (Enter,
 * Space) or ต่อ to go on, ข้าม to jump to the end; the choices come beside the
 * last line. Key words are coloured (RichText).
 */
const TYPE_STEP = 2;
const TYPE_MS = 22;
/** localStorage "on": show a conversation's lines all at once (fast text; the browser tests use it). */
export const DIALOG_INSTANT_KEY = "wuxia-dialog-instant";
function readFlag(read: () => boolean): boolean { try { return read(); } catch { return false; } }

export interface DialogSpeaker { id: string; name: string }

/** The location canvas remains a sibling, with its input and chrome suspended. */
export function DialogStage({ scene, speaker, title, locationName }: {
  scene: DialogScene;
  speaker?: DialogSpeaker;
  /** Heading when the speaker isn't a registered NPC (travel events, narration). */
  title?: string;
  locationName: string;
}) {
  const state = useWorldStore();
  const headingId = useId();
  // A dialog with a film plays it first (once per visit), then shows its lines.
  const [filmDone, setFilmDone] = useState<string | null>(null);
  const filmPending = !!scene.cutscene && filmDone !== scene.id;
  // One line per beat (or all at once with the fast-text flag).
  const [instant] = useState(() => typeof window !== "undefined" && readFlag(() => localStorage.getItem(DIALOG_INSTANT_KEY) === "on"));
  const [reduced] = useState(() => typeof window !== "undefined" && readFlag(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  // A long line plays as several beats (cut between words).
  const lines: readonly SceneLine[] = useMemo(() => instant ? scene.lines : splitBeats(scene.lines), [instant, scene.lines]);
  const beats = instant ? 1 : Math.max(1, lines.length);
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(0);
  useLayoutEffect(() => { setAt(0); setShown(0); }, [scene.id]);
  const named = useHeroNamer();
  const current = instant ? undefined : lines[Math.min(at, lines.length - 1)];
  const full = current ? visibleLength(named(current.text, true)) : 0;
  const typing = !!current && !reduced && shown < full;
  const lastBeat = at >= beats - 1;
  const showChoices = instant || lines.length === 0 || (lastBeat && !typing);
  useEffect(() => {
    if (!typing) return;
    keyTick(); // keys clatter as the line types out (self-throttled)
    const timer = setTimeout(() => setShown((n) => Math.min(full, n + TYPE_STEP)), TYPE_MS);
    return () => clearTimeout(timer);
  }, [typing, shown, full]);
  /** Tap on the words: finish the line, then the next one. */
  const advance = () => {
    if (typing) { setShown(full); return; }
    if (!lastBeat) { setAt((n) => n + 1); setShown(0); }
  };
  /** ต่อ: the next line at once (or finish the last one). */
  const next = () => { if (!lastBeat) { setAt((n) => n + 1); setShown(0); } else setShown(full); };
  const skip = () => { setAt(beats - 1); setShown(Number.MAX_SAFE_INTEGER); };
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const portrait = speaker ? npcPortrait(speaker.id) : undefined;
  const visibleChoices = (scene.choices ?? []).map((choice, index) => ({ choice, index }))
    .filter(({ choice }) => !choice.visibleIf || evaluateCondition(state, choice.visibleIf));
  const leave = visibleChoices.find(({ choice }) => choice.next === state.lastLocationId && !choice.effects?.length);
  const terminal = !scene.next && visibleChoices.length === 0 && !!state.lastLocationId;
  // Only mirror an authored, effect-free departure or ChoicePanel's terminal close.
  // Mandatory decisions keep their original gates, including on Escape.
  const close = leave ? () => state.makeChoice(leave.index) : terminal ? state.exitToLocation : undefined;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      // The location controls become interactive again in the same React commit.
      requestAnimationFrame(() => {
        if (document.querySelector('[data-testid="dialog-stage"]')) return;
        if (previous?.isConnected && !previous.closest("[inert]")) previous.focus({ preventScroll: true });
        else document.querySelector<HTMLElement>('[data-testid="world-canvas"]:not([inert])')?.focus({ preventScroll: true });
      });
    };
  }, []);

  useEffect(() => {
    content.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [scene.id]);

  // Fit the conversation to the screen: shrink the text a step at a time until
  // the lines and every choice show without scrolling (floor 62 %).
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => { setScale(1); }, [scene.id]);
  const shrinkToFit = () => {
    const node = content.current;
    if (node && node.scrollHeight - node.clientHeight > 2) setScale((value) => value > 0.62 ? Math.max(0.62, +(value - 0.06).toFixed(2)) : value);
  };
  useLayoutEffect(shrinkToFit, [scale, scene.id]);
  useEffect(() => {
    const refit = () => setScale(1);
    window.addEventListener("resize", refit);
    return () => window.removeEventListener("resize", refit);
  }, []);

  useEffect(() => {
    const node = content.current;
    if (!node) return;
    const measure = () => shrinkToFit();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    node.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => { observer.disconnect(); node.removeEventListener("scroll", measure); };
  }, [scene.id]);

  if (filmPending) {
    return <CutscenePlayer key={scene.id} cutsceneId={scene.cutscene!} onDone={() => {
      useWorldStore.getState()._setFlag(`seen-cutscene:${scene.cutscene}`, true);
      setFilmDone(scene.id);
    }} />;
  }

  const tapToAdvance = (event: React.MouseEvent) => {
    if (instant || (event.target as Element).closest("button, a")) return;
    advance();
  };
  const name = speaker?.name ?? title ?? "บทสนทนา";

  // Film layout (the cutscene standard): letterbox bars, the speaker standing
  // at the left, the line as a subtitle at the bottom, choices beside it.
  return (
    <div className={styles.stage} data-testid="dialog-stage" data-dialog-scale={scale} data-page={Math.min(at, beats - 1)} data-pages={beats}
      data-typing={typing || undefined}
      style={{ "--dialog-scale": scale } as React.CSSProperties}>
      <section
        className={`${styles.panel} ${portrait || speaker ? styles.withBust : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={tapToAdvance}
        onKeyDown={(event) => {
          if (event.key === "Escape" && close) {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if ((event.key === "Enter" || event.key === " ") && !instant && !(event.target as Element).closest("button, a")) {
            event.preventDefault();
            advance();
            return;
          }
          if (event.key !== "Tab") return;
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], [tabindex="0"]',
          )).filter((node) => !node.hidden && node.getClientRects().length > 0);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!first || !last) return;
          const active = document.activeElement;
          if (event.shiftKey && (active === first || active === heading.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className={styles.vignette} aria-hidden="true" />
        <div className={`${styles.bar} ${styles.top}`}>
          {locationName && <p className={styles.place}>{locationName}</p>}
          <div className={styles.controls}>
            {!showChoices && <button key={at} type="button" data-testid="dialog-next-page" onClick={next} autoFocus>
              ต่อ ▶ <span className={styles.count}>({Math.min(at, beats - 1) + 1}/{beats})</span>
            </button>}
            {!showChoices && !lastBeat && <button type="button" data-testid="dialog-skip" onClick={skip}>ข้าม ⏭</button>}
            {close && <button type="button" className={styles.close} onClick={close} title={leave?.choice.text}>
              จบบทสนทนา <span aria-hidden="true">×</span>
            </button>}
          </div>
        </div>
        {(portrait || speaker) && <div className={styles.bust} aria-hidden="true">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.portrait} src={portrait} alt="" draggable={false} />
          ) : speaker && <div className={styles.portrait}>
            <CharacterPreview id={npcCharacterId(speaker.id)} animate framing="bust" />
          </div>}
        </div>}
        <div ref={content} className={`${styles.content} ${showChoices ? styles.hasChoices : ""}`} tabIndex={0} role="region" aria-label="บทสนทนาและตัวเลือก">
          <div className={styles.talk}>
            <h2 ref={heading} id={headingId} tabIndex={-1} className={styles.speaker}>{name}</h2>
            <div className={`${styles.subtitle} ${instant ? "" : styles.beat}`} data-testid="dialog-lines">
              {(instant || lines.length > 0) && <DialogDisplay key={instant ? "all" : at} scene={scene} speakerName={speaker?.name ?? title}
                lines={instant ? lines : current ? [current] : []} shown={typing ? shown : undefined} />}
              {!instant && !typing && !lastBeat && <span className={styles.nextMark} aria-hidden="true">▼</span>}
            </div>
          </div>
          {showChoices && <div className={styles.choices}><ChoicePanel scene={scene} /></div>}
        </div>
        <div className={`${styles.bar} ${styles.bottom}`} aria-hidden="true" />
      </section>
    </div>
  );
}
