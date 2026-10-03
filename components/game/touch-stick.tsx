"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { WorldRuntime } from "@/lib/stage/types";
import { pageRect, toPagePoint } from "@/lib/ui/landscape";

const RADIUS = 56;   // knob travel, CSS px
const DEAD_ZONE = 10; // a touch that moves less than this is a tap

/**
 * Floating virtual joystick. A touch anywhere on the left half of the map
 * plants the stick under the thumb; dragging walks the hero (analog), and a
 * touch that never drags is handed back to the map as a normal tap. Mouse
 * input is left alone (click-to-walk + keyboard on desktop).
 */
export function TouchStick({ host, runtime }: {
  host: RefObject<HTMLDivElement | null>;
  runtime: RefObject<WorldRuntime | null>;
}) {
  const [stick, setStick] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const active = useRef<{ id: number; x: number; y: number; px: number; py: number; dragged: boolean } | null>(null);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const release = (event: PointerEvent, tap: boolean) => {
      const current = active.current;
      if (!current || current.id !== event.pointerId) return;
      active.current = null;
      setStick(null);
      runtime.current?.setStick(null);
      if (tap && !current.dragged) runtime.current?.tapAt(current.x, current.y);
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || active.current || !(event.target instanceof HTMLCanvasElement)) return;
      // Page coordinates: the page may be turned (landscape-only, lib/ui/landscape.ts).
      const bounds = pageRect(element);
      const at = toPagePoint(event.clientX, event.clientY);
      if (at.x - bounds.left > bounds.width / 2) return;
      // Ours now: keep the map's own tap-to-walk from firing underneath.
      event.stopPropagation();
      event.preventDefault();
      try { element.setPointerCapture(event.pointerId); } catch { /* synthetic or already-released pointer */ }
      active.current = { id: event.pointerId, x: event.clientX, y: event.clientY, px: at.x, py: at.y, dragged: false };
      setStick({ x: at.x - bounds.left, y: at.y - bounds.top, dx: 0, dy: 0 });
    };
    const move = (event: PointerEvent) => {
      const current = active.current;
      if (!current || current.id !== event.pointerId) return;
      event.preventDefault();
      const at = toPagePoint(event.clientX, event.clientY);
      const dx = at.x - current.px, dy = at.y - current.py;
      const distance = Math.hypot(dx, dy);
      if (!current.dragged && distance < DEAD_ZONE) return;
      current.dragged = true;
      const scale = distance > RADIUS ? RADIUS / distance : 1;
      const knob = { dx: dx * scale, dy: dy * scale };
      setStick((value) => value && { ...value, ...knob });
      runtime.current?.setStick({ x: knob.dx / RADIUS, y: knob.dy / RADIUS });
    };
    const up = (event: PointerEvent) => release(event, true);
    const cancel = (event: PointerEvent) => release(event, false);
    element.addEventListener("pointerdown", down, { capture: true });
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", cancel);
    element.addEventListener("lostpointercapture", cancel);
    return () => {
      element.removeEventListener("pointerdown", down, { capture: true });
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", cancel);
      element.removeEventListener("lostpointercapture", cancel);
      runtime.current?.setStick(null);
    };
  }, [host, runtime]);

  return (
    <div className="touch-stick-layer" aria-hidden="true">
      {stick
        ? <div className="touch-stick" style={{ left: stick.x, top: stick.y }}>
          <span className="touch-stick-knob" style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }} />
        </div>
        : <div className="touch-stick touch-stick--idle"><span className="touch-stick-knob" /></div>}
    </div>
  );
}
