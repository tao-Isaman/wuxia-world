"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { DialogScene } from "@/lib/world";
import { evaluateCondition, npcPortrait } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { CharacterPreview } from "@/components/game/character-preview";
import { npcCharacterId } from "@/lib/characters/catalog";
import { DialogDisplay } from "./dialog-display";
import { ChoicePanel } from "./choice-panel";
import styles from "./dialog-stage.module.css";

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
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
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
    const measure = () => { setMoreBelow(node.scrollHeight - node.clientHeight - node.scrollTop > 4); shrinkToFit(); };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const child of node.children) observer.observe(child);
    node.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => { observer.disconnect(); node.removeEventListener("scroll", measure); };
  }, [scene.id]);

  return (
    <div className={styles.stage} data-testid="dialog-stage" data-dialog-scale={scale}
      style={{ "--dialog-scale": scale } as React.CSSProperties}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={(event) => {
          if (event.key === "Escape" && close) {
            event.preventDefault();
            event.stopPropagation();
            close();
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
        {(portrait || speaker) && <div className={styles.bust} aria-hidden="true">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.portrait} src={portrait} alt="" draggable={false} />
          ) : speaker && <div className={styles.portrait}>
            <CharacterPreview id={npcCharacterId(speaker.id)} animate framing="bust" />
          </div>}
        </div>}
        <div className={styles.main}>
          <header className={styles.heading}>
            <div className={styles.identity}>
              <h2 ref={heading} id={headingId} tabIndex={-1}>{speaker?.name ?? title ?? "บทสนทนา"}</h2>
              {locationName && <p>{locationName}</p>}
            </div>
            {close && <button type="button" className={styles.close} onClick={close} title={leave?.choice.text}>
              จบบทสนทนา <span aria-hidden="true">×</span>
            </button>}
          </header>
          <div ref={content} className={styles.content} tabIndex={0} role="region" aria-label="บทสนทนาและตัวเลือก">
            <div className={styles.lines}><DialogDisplay scene={scene} speakerName={speaker?.name} /></div>
            <div className={styles.choices}><ChoicePanel scene={scene} /></div>
          </div>
          {moreBelow && <div className={styles.scrollHint} aria-hidden="true">เลื่อนลงเพื่ออ่านต่อและดูตัวเลือก ↓</div>}
        </div>
      </section>
    </div>
  );
}
