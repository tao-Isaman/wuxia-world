/**
 * Saving engine edits (/game/engine). Under `bun dev` (or ENGINE_WRITE=1) the
 * save route writes the file into the repo, to be committed; anywhere else
 * (the deployed site is read-only) the browser downloads the JSON instead.
 */
export const ENGINE_FILES = {
  manifest: "public/assets/manifest.json",
  placements: "public/assets/placements.json",
  textOverrides: "lib/game/data/text-overrides.json",
} as const;
export type EngineFileKey = keyof typeof ENGINE_FILES;

export type SaveResult = { ok: true; written: string } | { ok: false; downloaded: boolean; reason: string };

/** Write one engine file (pretty JSON); falls back to a download when the server cannot write. */
export async function saveEngineFile(key: EngineFileKey, data: unknown): Promise<SaveResult> {
  const json = JSON.stringify(data, null, 2) + "\n";
  try {
    const response = await fetch("/game/engine/api/save", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, json }),
    });
    if (response.ok) return { ok: true, written: ENGINE_FILES[key] };
    const reason = (await response.json().catch(() => ({ error: response.statusText }))).error ?? response.statusText;
    return { ok: false, downloaded: download(key, json), reason };
  } catch (error) {
    return { ok: false, downloaded: download(key, json), reason: String(error) };
  }
}

function download(key: EngineFileKey, json: string): boolean {
  if (typeof document === "undefined") return false;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  link.download = ENGINE_FILES[key].split("/").pop()!;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return true;
}
