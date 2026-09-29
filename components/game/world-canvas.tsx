"use client";

import { useEffect, useRef, useState } from "react";
import type { WorldPresentation, WorldRuntime } from "@/lib/three/types";
import { protectActorFromGuide } from "./world-overlay-placement";

export function WorldCanvas({ presentation }: { presentation: WorldPresentation }) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<WorldRuntime | null>(null);
  const latest = useRef(presentation);
  latest.current = presentation;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showPlaces, setShowPlaces] = useState(false);
  const signature = presentation.markers.map((m) => `${m.id}:${m.image ?? m.icon ?? ""}`).join("|") +
    (presentation.props ?? []).map((prop) => `${prop.id}:${prop.image}`).join("|") +
    (presentation.bystanders ?? []).map((actor) => `${actor.id}:${actor.characterId}`).join("|");
  useEffect(() => { if (presentation.readOnly) setShowPlaces(false); }, [presentation.readOnly]);
  useEffect(() => {
    if (!ready || !host.current) return;
    return protectActorFromGuide(host.current);
  }, [ready, presentation.key]);

  useEffect(() => {
    let disposed = false;
    let instance: WorldRuntime | null = null;
    setReady(false);
    setError(null);
    setShowPlaces(false);
    void import("@/lib/three/world-runtime").then(({ createWorldRuntime }) => {
      if (disposed || !host.current) return;
      instance = createWorldRuntime(host.current, () => latest.current,
        () => { if (!disposed) setReady(true); },
        (message) => { if (!disposed) { setReady(false); setError(message); } });
      runtime.current = instance;
    }).catch(() => { if (!disposed) setError("เริ่มฉากไม่ได้ กรุณาลองใหม่"); });
    return () => { disposed = true; runtime.current = null; instance?.destroy(); };
  }, [presentation.key, presentation.image, presentation.playerImage, signature, attempt]);

  return (
    <div className="world-viewport">
      <div ref={host} className="three-host" data-testid="world-canvas" data-renderer="three" data-ready={ready}
        data-read-only={!!presentation.readOnly} role="region" aria-label={`แผนที่ ${presentation.name}`} tabIndex={presentation.readOnly ? -1 : 0} />
      {presentation.worldDescription && <span className="sr-only" role="status">{presentation.worldDescription}</span>}
      {(!ready || error) && (
        <div className="canvas-loading" role="status">
          <div className="pixel-panel p-6 text-center space-y-3">
            <p>{error ?? "กำลังเดินทางเข้าสู่ยุทธภพ..."}</p>
            {error && <button className="pixel-action" onClick={() => setAttempt((n) => n + 1)}>ลองใหม่</button>}
          </div>
        </div>
      )}
      {!presentation.readOnly && <div className="world-controls">
        <span className="world-keyboard-hint">WASD / ลูกศร เดิน · E โต้ตอบ</span>
        <span className="world-touch-hint">แตะพื้นเพื่อเดิน</span>
        <button type="button" aria-expanded={showPlaces} onClick={() => setShowPlaces((v) => !v)}>
          จุดหมาย <span aria-hidden="true">{showPlaces ? "−" : "+"}</span>
        </button>
      </div>}
      {!presentation.readOnly && showPlaces && (
        <nav className="world-places pixel-panel" aria-label="จุดหมายในแผนที่">
          {presentation.markers.map((marker) => (
            <button key={marker.id} type="button" data-marker-id={marker.id} aria-disabled={marker.disabled} onClick={() => {
              setShowPlaces(false);
              host.current?.focus();
              runtime.current?.interact(marker.id);
            }}>
              <span aria-hidden="true">{marker.kind === "exit" ? "↗" : "◇"}</span> {marker.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
