"use client";

import { useEffect, useState } from "react";

// Auto-landscape for touch devices: when a phone is held in portrait,
// rotate the entire app 90° so the game always plays landscape — the
// reliable cross-platform approach (iOS has no Orientation Lock API).
// The rotated wrapper becomes the containing block for every `fixed`
// layer inside (fullscreen maps, HUD, modals), so the whole game UI
// rotates as one unit. Click coordinates inside the maps use
// offsetX/offsetY, which browsers report in local (pre-transform)
// space, so walking stays accurate.
//
// Applies on portrait touch screens (and narrow portrait windows, which
// also makes it testable in a desktop browser).
const QUERY =
  "(orientation: portrait) and ((pointer: coarse) or (max-width: 920px))";

export function MobileLandscape({ children }: { children: React.ReactNode }) {
  const [rotate, setRotate] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setRotate(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!rotate) return <>{children}</>;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100dvh",
        height: "100dvw",
        transform: "rotate(90deg) translateY(-100%)",
        transformOrigin: "top left",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}
