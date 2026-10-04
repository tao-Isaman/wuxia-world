import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ENGINE_FILES, type EngineFileKey } from "@/lib/engine/save";

// Writes an engine file into the repo. Only under `bun dev` or ENGINE_WRITE=1:
// the deployed site is read-only and the engine downloads the JSON instead.
export const dynamic = "force-dynamic";

function engineWritable(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ENGINE_WRITE === "1";
}

export async function POST(request: Request) {
  if (!engineWritable()) return Response.json({ error: "บันทึกลงไฟล์ได้เฉพาะตอนรัน bun dev" }, { status: 403 });
  const body = await request.json().catch(() => null) as { key?: string; json?: string } | null;
  const key = body?.key as EngineFileKey | undefined;
  if (!key || !(key in ENGINE_FILES) || typeof body?.json !== "string") return Response.json({ error: "bad request" }, { status: 400 });
  try { JSON.parse(body.json); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  await writeFile(path.join(process.cwd(), ENGINE_FILES[key]), body.json, "utf8");
  return Response.json({ ok: true, written: ENGINE_FILES[key] });
}
