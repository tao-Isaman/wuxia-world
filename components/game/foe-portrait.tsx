"use client";

import type { UnitLook } from "@/lib/game/grid";
import { CREATURE_ATLAS, CREATURE_FRAME_COUNT } from "@/lib/characters/catalog";
import { foeLook } from "@/lib/world/battle-looks";
import { CharacterPreview } from "./character-preview";

/**
 * A unit drawn from its battle look: a creature-atlas cell, a painted still,
 * or a character sheet. The battle board, its timeline, the encounter and
 * briefing screens all use it, so a foe looks the same everywhere.
 */
export function LookPortrait({ look, framing = "bust", animate = false }: {
  look: UnitLook; framing?: "body" | "bust"; animate?: boolean;
}) {
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
