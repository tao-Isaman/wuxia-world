"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

/** How often the page brings the world up to the clock while visible. */
const TICK_MS = 10_000;

/**
 * The world clock runs on real time (lib/world/clock.ts): this keeps the
 * store on it while the page is open — the sundial and day move, stamina /
 * HP / MP regenerate and the world's days happen — and catches up at once
 * when the tab comes back into view (telling the player how many days
 * passed while they were away).
 */
export function WorldClock() {
  useEffect(() => {
    const tick = () => {
      const s = useWorldStore.getState();
      if (!s.hasGame || document.visibilityState !== "visible") return;
      const away = s.syncClock();
      if (away >= 1) toast("info", `ระหว่างที่ท่านไม่อยู่ ผ่านไป ${away} วัน`, 4000);
    };
    tick();
    const timer = window.setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return null;
}
