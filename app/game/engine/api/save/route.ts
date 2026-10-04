import { writeFile } from "node:fs/promises";
import path from "node:path";
import { checkSaveRequest, engineWritable } from "@/lib/engine/save-policy";

// Writes an engine file into the repo. Only under `bun dev` or ENGINE_WRITE=1:
// the deployed site is read-only and the engine downloads the JSON instead.
// GET tells the engine which of the two it is (its status chip).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ writable: engineWritable() });
}

export async function POST(request: Request) {
  if (!engineWritable()) return Response.json({ error: "บันทึกลงไฟล์ได้เฉพาะตอนรัน bun dev" }, { status: 403 });
  const check = checkSaveRequest(await request.json().catch(() => null));
  if (!check.ok) return Response.json({ error: check.error }, { status: check.status });
  await writeFile(path.join(process.cwd(), check.path), check.json, "utf8");
  return Response.json({ ok: true, written: check.path });
}
