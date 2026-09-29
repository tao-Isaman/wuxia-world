"use client";

import type { DialogScene } from "@/lib/world";

interface Props {
  scene: DialogScene;
  /** The staged speaker already named on the dialogue tab; their lines skip the repeat. */
  speakerName?: string;
}

// Game-HUD conversation box — dark translucent ink panel rendered over
// the map backdrop (see WorldScreen's dialog branch), like a JRPG text
// box. Speaker names stay vermilion; narration reads as stage notes.
export function DialogDisplay({ scene, speakerName }: Props) {
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
            {line.speaker !== speakerName && <div className="text-sm font-bold text-primary font-display">
              {line.speaker}
            </div>}
            <p className="text-base leading-relaxed pl-3 border-l-2 border-primary/50">
              &ldquo;{line.text}&rdquo;
            </p>
          </div>
        );
      })}
    </div>
  );
}
