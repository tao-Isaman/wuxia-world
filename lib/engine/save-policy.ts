/**
 * The save route's rules (app/game/engine/api/save/route.ts), kept pure so
 * scripts/test-engine.ts can check them: when the server may write, and which
 * request bodies it accepts (only the whitelisted engine files).
 */
import { ENGINE_FILES, type EngineFileKey } from "./save";

/** Writes only under `bun dev` or with ENGINE_WRITE=1; the deployed site is read-only. */
export function engineWritable(env: { NODE_ENV?: string; ENGINE_WRITE?: string } = process.env): boolean {
  return env.NODE_ENV === "development" || env.ENGINE_WRITE === "1";
}

/** An own key of ENGINE_FILES (not "toString", "__proto__"…). */
export function isEngineFileKey(key: unknown): key is EngineFileKey {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(ENGINE_FILES, key);
}

export type SaveRequestCheck =
  | { ok: true; key: EngineFileKey; json: string; path: string }
  | { ok: false; status: 400; error: string };

/** Validate a POST body `{ key, json }`: a whitelisted key and parseable JSON text. */
export function checkSaveRequest(body: unknown): SaveRequestCheck {
  const { key, json } = (body && typeof body === "object" ? body : {}) as { key?: unknown; json?: unknown };
  if (!isEngineFileKey(key) || typeof json !== "string") return { ok: false, status: 400, error: "bad request" };
  try { JSON.parse(json); } catch { return { ok: false, status: 400, error: "invalid JSON" }; }
  return { ok: true, key, json, path: ENGINE_FILES[key] };
}
