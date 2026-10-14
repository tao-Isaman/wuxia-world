// Step 0 of docs/design/cloud-architecture.md: every HTTP answer says how long
// the server took (`Server-Timing`, readable from the game's origin), and the
// browsers' own measurements arrive at POST /rum for Workers Analytics Engine.
import type { Env } from "./env";
import { CORS_HEADERS } from "./http";

/** Named durations of one request, in ms. */
export type Timings = Record<string, number>;

/** `response` with `Server-Timing` (total plus `marks`); a socket upgrade goes back untouched. */
export function withTiming(response: Response, began: number, marks: Timings = {}): Response {
  if (response.status === 101 || (response as Response & { webSocket?: unknown }).webSocket) return response;
  const parts = [`total;dur=${Date.now() - began}`, ...Object.entries(marks).map(([name, ms]) => `${name};dur=${ms}`)];
  const headers = new Headers(response.headers);
  headers.set("Server-Timing", parts.join(", "));
  headers.set("Timing-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Server-Timing");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const NUMBER_FIELDS = ["ttfb", "domReady", "load", "fcp", "worldReady", "jsBytes", "jsCached"] as const;

/** One beacon from `lib/net/rum.ts`, flattened for Analytics Engine (`null` when it is not one). */
export function rumPoint(body: unknown, country: string): { blobs: string[]; doubles: number[]; indexes: string[] } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e9 ? v : -1);
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const api = b.api && typeof b.api === "object" ? JSON.stringify(b.api).slice(0, 4000) : "{}";
  return {
    indexes: [text(b.build, 32) || "unknown"],
    blobs: [text(b.build, 32), text(b.conn, 16), country, api],
    doubles: NUMBER_FIELDS.map((k) => num(b[k])),
  };
}

/** POST /rum: keep the beacon (when Analytics Engine is bound) and answer 204. */
export async function handleRum(request: Request, env: Env): Promise<Response> {
  const text = await request.text();
  let point = null;
  if (text.length <= 8_000) {
    try {
      point = rumPoint(JSON.parse(text), String((request as Request & { cf?: { country?: string } }).cf?.country ?? ""));
    } catch {
      point = null;
    }
  }
  if (point) env.RUM?.writeDataPoint(point);
  return new Response(null, { status: point ? 204 : 400, headers: CORS_HEADERS });
}
