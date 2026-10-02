"use client";

import { useEffect, useRef, useState } from "react";
import { markerCategory, type WorldMarker, type WorldMarkerCategory, type WorldPresentation, type WorldRuntime } from "@/lib/stage/types";
import { TouchStick } from "./touch-stick";
import { useWorldStore } from "@/store/world-store";

export function WorldCanvas({ presentation }: { presentation: WorldPresentation }) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<WorldRuntime | null>(null);
  const latest = useRef(presentation);
  latest.current = presentation;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showPlaces, setShowPlaces] = useState(false);
  const [nearby, setNearby] = useState<string | null>(null);
  const signature = presentation.markers.map((m) => `${m.id}:${m.image ?? m.badge ?? m.icon ?? ""}`).join("|") +
    (presentation.props ?? []).map((prop) => `${prop.id}:${prop.image}`).join("|") +
    (presentation.bystanders ?? []).map((actor) => `${actor.id}:${actor.characterId}`).join("|");
  useEffect(() => { if (presentation.readOnly) setShowPlaces(false); }, [presentation.readOnly]);

  useEffect(() => {
    let disposed = false;
    let instance: WorldRuntime | null = null;
    setReady(false);
    setError(null);
    setShowPlaces(false);
    setNearby(null);
    void import("@/lib/stage/world-runtime").then(({ createWorldRuntime }) => {
      if (disposed || !host.current) return;
      instance = createWorldRuntime(host.current, () => latest.current,
        () => { if (!disposed) setReady(true); },
        (message) => { if (!disposed) { setReady(false); setError(message); } },
        (id) => { if (!disposed) setNearby(id); },
        (pickSpot) => { if (!disposed) useWorldStore.getState().walkTick(pickSpot); });
      runtime.current = instance;
    }).catch((cause: unknown) => {
      // A chunk failed to download or Phaser could not boot — say so.
      console.error("[world] renderer could not start:", cause);
      if (!disposed) setError(`เริ่มฉากไม่ได้ กรุณาลองใหม่\n(${cause instanceof Error ? cause.message : String(cause)})`);
    });
    return () => { disposed = true; runtime.current = null; instance?.destroy(); };
  }, [presentation.key, presentation.image, presentation.playerImage, signature, attempt]);

  return (
    <div className="world-viewport">
      <div ref={host} className="stage-host" data-testid="world-canvas" data-renderer="phaser" data-ready={ready}
        data-read-only={!!presentation.readOnly} role="region" aria-label={`แผนที่ ${presentation.name}`} tabIndex={presentation.readOnly ? -1 : 0} />
      {ready && !error && !presentation.readOnly && <TouchStick host={host} runtime={runtime} />}
      {ready && !error && !presentation.readOnly && <ActionPrompt marker={presentation.markers.find((m) => m.id === nearby)}
        onAct={(id) => { host.current?.focus({ preventScroll: true }); runtime.current?.interact(id); }} />}
      {presentation.worldDescription && <span className="sr-only" role="status">{presentation.worldDescription}</span>}
      {(!ready || error) && (
        <div className="canvas-loading" role="status">
          <div className="pixel-panel p-6 text-center space-y-3">
            <p className="whitespace-pre-line">{error ?? "กำลังเดินทางเข้าสู่ยุทธภพ..."}</p>
            {error && <button className="pixel-action" onClick={() => setAttempt((n) => n + 1)}>ลองใหม่</button>}
          </div>
        </div>
      )}
      {!presentation.readOnly && <div className="world-controls">
        <span className="world-keyboard-hint">WASD / ลูกศร เดิน · E โต้ตอบ</span>
        <span className="world-touch-hint">ลากจอซ้ายเพื่อเดิน · แตะเพื่อไปที่นั่น</span>
        <button type="button" aria-expanded={showPlaces} onClick={() => setShowPlaces((v) => !v)}>
          จุดหมาย <span aria-hidden="true">{showPlaces ? "−" : "+"}</span>
        </button>
      </div>}
      {!presentation.readOnly && showPlaces && <PlacesPanel markers={presentation.markers} onPick={(id) => {
        setShowPlaces(false);
        host.current?.focus();
        runtime.current?.interact(id);
      }} />}
    </div>
  );
}

const PLACE_TABS: readonly { key: WorldMarkerCategory; label: string; glyph: string }[] = [
  { key: "npc", label: "บุคคล", glyph: "💬" },
  { key: "route", label: "เส้นทาง", glyph: "➜" },
  { key: "place", label: "สถานที่", glyph: "🏮" },
  { key: "activity", label: "กิจกรรม", glyph: "✋" },
];

/** จุดหมาย: every marker on the map, sorted into people / roads / places / things to do. */
function PlacesPanel({ markers, onPick }: { markers: readonly WorldMarker[]; onPick: (id: string) => void }) {
  const groups = Object.fromEntries(PLACE_TABS.map((tab) => [tab.key, markers.filter((marker) => markerCategory(marker) === tab.key)])) as
    Record<WorldMarkerCategory, WorldMarker[]>;
  const [chosen, setChosen] = useState<WorldMarkerCategory | null>(null);
  const active = chosen && groups[chosen].length ? chosen : PLACE_TABS.find((tab) => groups[tab.key].length)?.key ?? "npc";
  return (
    <nav className="world-places pixel-panel" aria-label="จุดหมายในแผนที่">
      <div className="world-places-tabs" role="tablist">
        {PLACE_TABS.map((tab) => (
          <button key={tab.key} type="button" role="tab" aria-selected={active === tab.key} data-places-tab={tab.key}
            disabled={!groups[tab.key].length} onClick={() => setChosen(tab.key)}>
            <span aria-hidden="true">{tab.glyph}</span> {tab.label} <small>{groups[tab.key].length}</small>
          </button>
        ))}
      </div>
      {PLACE_TABS.map((tab) => (
        <div key={tab.key} role="tabpanel" hidden={active !== tab.key} className="world-places-list">
          {groups[tab.key].map((marker) => (
            <button key={marker.id} type="button" data-marker-id={marker.id} data-category={tab.key}
              aria-disabled={marker.disabled} onClick={() => onPick(marker.id)}>
              <span aria-hidden="true">{marker.kind === "exit" ? "↗" : marker.glyph ?? (marker.kind === "npc" ? "👤" : "◇")}</span> {marker.label}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

const ACTION_VERB: Record<WorldMarker["kind"], string> = { npc: "คุยกับ", exit: "ไปที่", service: "ใช้" };
const ACTION_GLYPH: Record<WorldMarker["kind"], string> = { npc: "💬", exit: "➜", service: "✋" };

/** Context action when the hero stands next to a person, sign or exit: one big thumb button. */
function ActionPrompt({ marker, onAct }: { marker?: WorldMarker; onAct: (id: string) => void }) {
  if (!marker) return null;
  const text = `${ACTION_VERB[marker.kind]} ${marker.label}`;
  return (
    <button key={marker.id} type="button" className={`action-prompt action-prompt--${marker.kind}`} data-action-marker={marker.id}
      aria-label={text} aria-disabled={marker.disabled} aria-keyshortcuts="E" onClick={() => onAct(marker.id)}>
      <span className="action-prompt-glyph" aria-hidden="true">{marker.kind === "service" && marker.glyph ? marker.glyph : ACTION_GLYPH[marker.kind]}</span>
      <span className="action-prompt-text"><small>{ACTION_VERB[marker.kind]}</small>{marker.label}</span>
      <kbd aria-hidden="true">E</kbd>
    </button>
  );
}
