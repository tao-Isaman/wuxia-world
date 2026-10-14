// Real-user measurements (docs/design/cloud-architecture.md, step 0): how long
// the game takes to open and how long the server takes to answer, measured
// on players' own devices and sent once per visit to the game server's /rum
// (Workers Analytics Engine). Only with a game server set; nothing personal
// is sent — timings, the build, the connection type.

import { gameServerUrl } from "./config";

/** `performance.mark` names the game sets. */
export const RUM_MARKS = { worldReady: "wuxia:world-ready" } as const;

interface ApiStat { n: number; ms: number; max: number }
const api = new Map<string, ApiStat>();
let started = false;
let sent = false;

/** One server call's round trip, grouped by route (ids folded away). */
export function recordApiTiming(path: string, ms: number): void {
  const route = path.split("?")[0]!.replace(/\/characters\/[^/]+/, "/characters/:id").replace(/\/raid\/[^/]+/, "/raid/:boss");
  const stat = api.get(route) ?? { n: 0, ms: 0, max: 0 };
  stat.n += 1;
  stat.ms += ms;
  stat.max = Math.max(stat.max, ms);
  api.set(route, stat);
}

/** Mark the moment the first map is drawn (once per visit). */
export function markWorldReady(): void {
  if (typeof performance === "undefined" || performance.getEntriesByName(RUM_MARKS.worldReady).length) return;
  performance.mark(RUM_MARKS.worldReady);
}

/** What this visit measured so far (pure enough to test with a fake `performance`). */
export function collectRum(perf: Performance = performance): Record<string, unknown> {
  const nav = perf.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const paint = Object.fromEntries(perf.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)]));
  const scripts = (perf.getEntriesByType("resource") as PerformanceResourceTiming[]).filter((e) => e.initiatorType === "script");
  const world = perf.getEntriesByName(RUM_MARKS.worldReady)[0];
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  return {
    build: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
    conn: connection?.effectiveType ?? "",
    ttfb: nav ? Math.round(nav.responseStart) : null,
    domReady: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    load: nav ? Math.round(nav.loadEventEnd) : null,
    fcp: paint["first-contentful-paint"] ?? null,
    worldReady: world ? Math.round(world.startTime) : null,
    jsBytes: scripts.reduce((sum, e) => sum + (e.transferSize || 0), 0),
    jsCached: scripts.filter((e) => e.transferSize === 0).length,
    api: Object.fromEntries([...api].map(([route, s]) => [route, { n: s.n, avg: Math.round(s.ms / s.n), max: Math.round(s.max) }])),
  };
}

/** Send the visit's numbers when the page is hidden or closed (once). */
export function startRum(): void {
  if (started || typeof window === "undefined") return;
  const server = gameServerUrl();
  if (!server) return;
  started = true;
  const send = () => {
    if (sent) return;
    sent = true;
    // text/plain keeps the beacon a simple request (no CORS preflight).
    navigator.sendBeacon?.(`${server}/rum`, new Blob([JSON.stringify(collectRum())], { type: "text/plain" }));
  };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") send(); });
  window.addEventListener("pagehide", send);
}
