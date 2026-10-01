"use client";

import type { DialogScene, SceneLine } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  scene: DialogScene;
  /** The staged speaker already named on the dialogue tab; their lines skip the repeat. */
  speakerName?: string;
  /** Show only these lines (a page of a paged dialog). */
  lines?: readonly SceneLine[];
}

// Game-HUD conversation box — dark translucent ink panel rendered over
// the map backdrop (see WorldScreen's dialog branch), like a JRPG text
// box. Speaker names stay vermilion; narration reads as stage notes.
export function DialogDisplay({ scene, speakerName, lines }: Props) {
  // "{hero}" in story text is the player's name.
  const hero = useWorldStore((s) => s.playerBuild?.name ?? "จอมยุทธ์");
  const named = (text: string) => text.includes("{hero}") ? text.split("{hero}").join(hero) : text;
  return (
    <div className="bg-ink/85 text-paper shadow-pixel p-4 space-y-3">
      {(lines ?? scene.lines).map((raw, i) => {
        const line: SceneLine = raw.t === "narration" ? { t: "narration", text: named(raw.text) }
          : { t: "dialogue", speaker: named(raw.speaker), text: named(raw.text) };
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
