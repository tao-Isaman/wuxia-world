"use client";

import type { DialogScene } from "@/lib/world";

interface Props {
  scene: DialogScene;
}

// Game-HUD conversation box — dark translucent ink panel rendered over
// the map backdrop (see WorldScreen's dialog branch), like a JRPG text
// box. Speaker names stay vermilion; narration reads as stage notes.
export function DialogDisplay({ scene }: Props) {
  return (
    <div className="bg-ink/85 text-paper shadow-pixel p-4 space-y-3">
      {scene.lines.map((line, i) => {
        if (line.t === "narration") {
          return (
            <p
              key={i}
              className="text-base leading-relaxed italic text-paper/70"
            >
              {line.text}
            </p>
          );
        }
        return (
          <div key={i} className="space-y-1">
            <div className="text-sm font-bold text-primary font-display">
              {line.speaker}
            </div>
            <p className="text-base leading-relaxed pl-3 border-l-2 border-primary/50">
              &ldquo;{line.text}&rdquo;
            </p>
          </div>
        );
      })}
    </div>
  );
}
