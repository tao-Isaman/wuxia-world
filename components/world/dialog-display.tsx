"use client";

import type { DialogScene, SceneLine } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { RichText } from "./rich-text";

interface Props {
  scene: DialogScene;
  /** The staged speaker already named on the dialogue tab; their lines skip the repeat. */
  speakerName?: string;
  /** Show only these lines (the beat on screen). */
  lines?: readonly SceneLine[];
  /** Typewriter: show only this many characters of the (single) line. */
  shown?: number;
}

/** "{hero}" in story text is the player's name — marked, in the words; plain in a speaker label. */
export function useHeroNamer() {
  const hero = useWorldStore((s) => s.playerBuild?.name ?? "จอมยุทธ์");
  return (text: string, marked = false) => text.includes("{hero}") ? text.split("{hero}").join(marked ? `**${hero}**` : hero) : text;
}

// Game-HUD conversation box — dark translucent ink panel rendered over
// the map backdrop (see WorldScreen's dialog branch), like a JRPG text
// box. Speaker names stay vermilion; narration reads as stage notes; key
// words are coloured (RichText).
export function DialogDisplay({ scene, speakerName, lines, shown }: Props) {
  const named = useHeroNamer();
  return (
    <div className="bg-ink/85 text-paper shadow-pixel p-4 space-y-3">
      {(lines ?? scene.lines).map((raw, i) => {
        if (raw.t === "narration") {
          return (
            <p key={i} className="text-base leading-relaxed italic text-paper/70" data-line-kind="narration">
              <RichText text={named(raw.text, true)} shown={shown} />
            </p>
          );
        }
        const speaker = named(raw.speaker);
        return (
          <div key={i} className="space-y-1" data-line-kind="dialogue">
            {speaker !== speakerName && <div className="text-sm font-bold text-primary font-display">
              {speaker}
            </div>}
            <p className="text-base leading-relaxed pl-3 border-l-2 border-primary/50">
              &ldquo;<RichText text={named(raw.text, true)} shown={shown} />&rdquo;
            </p>
          </div>
        );
      })}
    </div>
  );
}
