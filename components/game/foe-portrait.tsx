"use client";

import { useEffect, useRef } from "react";
import type { UnitLook } from "@/lib/game/grid";
import { getAnimSheet, type AnimSheet } from "@/lib/characters/anim-sheets";
import { CREATURE_ATLAS, CREATURE_FRAME_COUNT } from "@/lib/characters/catalog";
import { foeLook } from "@/lib/world/battle-looks";
import { CharacterPreview } from "./character-preview";

/**
 * A unit drawn from its battle look: an animated sheet's idle frame (bosses,
 * T5), a creature-atlas cell, a painted still, or a character sheet. The battle board, its timeline, the encounter and
 * briefing screens all use it, so a foe looks the same everywhere.
 */
export function LookPortrait({ look, framing = "bust", animate = false }: {
  look: UnitLook; framing?: "body" | "bust"; animate?: boolean;
}) {
  if (look.kind === "anim") {
    const sheet = getAnimSheet(look.sheet);
    if (sheet) return <AnimPortrait sheet={sheet} framing={framing} animate={animate} />;
    look = { kind: "creature", frame: 0 };
  }
  if (look.kind === "creature") {
    const { columns, rows, url } = CREATURE_ATLAS;
    const frame = Math.max(0, Math.min(CREATURE_FRAME_COUNT - 1, look.frame));
    const column = frame % columns, row = Math.floor(frame / columns);
    return <span className="gb-creature" aria-hidden="true" data-creature-frame={frame} style={{
      display: "block", width: "100%", height: "100%", backgroundRepeat: "no-repeat", imageRendering: "pixelated",
      backgroundImage: `url(${url})`,
      backgroundSize: `${columns * 100}% ${rows * 100}%`,
      backgroundPosition: `${columns > 1 ? (column * 100) / (columns - 1) : 0}% ${rows > 1 ? (row * 100) / (rows - 1) : 0}%`,
    }} />;
  }
  if (look.still) {
    return <span className="gb-still" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={look.still} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: framing === "bust" ? "50% 4%" : "50% 100%", imageRendering: "pixelated", transform: framing === "bust" ? "scale(1.6)" : undefined, transformOrigin: "50% 0" }} />
    </span>;
  }
  return <CharacterPreview id={look.characterId} framing={framing} animate={animate} />;
}

/** The foe `opponentId` as the battle will draw it (`foeLook`). */
export function FoePortrait({ opponentId, framing = "body", animate = true }: {
  opponentId: string; framing?: "body" | "bust"; animate?: boolean;
}) {
  return <LookPortrait look={foeLook(opponentId)} framing={framing} animate={animate} />;
}

/**
 * An animated sheet's idle clip cropped to one frame and fitted to the box
 * (feet down for "body", centred for "bust"), turned to face the hero: the
 * first frame, or the looping idle when `animate` (and motion is not reduced).
 */
function AnimPortrait({ sheet, framing, animate }: { sheet: AnimSheet; framing: "body" | "bust"; animate: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = canvas.current;
    const context = target?.getContext("2d");
    if (!target || !context) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const columns = Math.max(1, Math.floor(image.width / sheet.frameW));
      const { row, frames, fps } = sheet.clips.idle;
      const count = Math.max(1, Math.min(frames, columns));
      let frame = 0;
      const draw = () => {
        context.clearRect(0, 0, target.width, target.height);
        context.imageSmoothingEnabled = false;
        context.drawImage(image, frame * sheet.frameW, row * sheet.frameH, sheet.frameW, sheet.frameH, 0, 0, sheet.frameW, sheet.frameH);
        target.dataset.animFrame = String(frame);
      };
      draw();
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (animate && !reduced && count > 1) timer = setInterval(() => { frame = (frame + 1) % count; draw(); }, 1000 / Math.max(1, fps));
    };
    image.src = sheet.url;
    return () => { cancelled = true; if (timer) clearInterval(timer); image.onload = null; };
  }, [sheet, animate]);
  return <span className="gb-anim" aria-hidden="true" data-anim-sheet={sheet.id} style={{ display: "block", width: "100%", height: "100%", overflow: "hidden" }}>
    <canvas ref={canvas} width={sheet.frameW} height={sheet.frameH} style={{
      display: "block", width: "100%", height: "100%", objectFit: "contain", objectPosition: framing === "bust" ? "50% 50%" : "50% 100%",
      imageRendering: "pixelated", transform: sheet.facing === "right" ? "scaleX(-1)" : undefined,
    }} />
  </span>;
}
