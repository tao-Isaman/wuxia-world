"use client";

import { useLoadingStore } from "@/store/loading-store";
import { useWorldStore } from "@/store/world-store";
import { CharacterPreview } from "@/components/game/character-preview";

// While an action runs, the hero is shown at work over a progress bar and
// the screen takes no input (the layer catches taps, and `data-world-busy`
// makes the world runtime ignore keys) until the bar fills.
export function LoadingOverlay() {
  const active = useLoadingStore((s) => s.active);
  const message = useLoadingStore((s) => s.message);
  const kind = useLoadingStore((s) => s.kind);
  const duration = useLoadingStore((s) => s.duration);
  const job = useLoadingStore((s) => s.job);
  const bodyId = useWorldStore((s) => s.playerBodyId);

  if (!active) return null;

  return (
    <div className="work-overlay" data-world-busy="" aria-busy="true" onPointerDown={(event) => event.preventDefault()}>
      <div className="work-card" role="status" aria-live="polite">
        <div className={`work-hero work-hero--${kind}`} aria-hidden="true">
          <CharacterPreview id={bodyId} animate motion={kind === "rest" ? "idle" : "attack"} />
        </div>
        <div className="work-body">
          <span className="work-label">{message || "กำลังทำงาน..."}</span>
          <div className="work-track" role="progressbar" aria-label={message || "กำลังทำงาน"}>
            <div key={job} className="work-fill" style={{ animationDuration: `${duration}ms` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
