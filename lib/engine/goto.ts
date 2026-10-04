/**
 * Play-testing a map from the engine's map editor (เล่นทดสอบ). The editor
 * opens `/?engineGoto=<locationId>&enginePreview=1` in a new tab; the game
 * (components/world/engine-goto.tsx) moves the hero there and draws the
 * editor's unsaved placements instead of public/assets/placements.json.
 *
 * Only active under `bun dev`, or once the browser carries the local flag
 * `localStorage["wuxia-engine-goto"] = "on"` (the editor sets it on the same
 * origin). Never part of the save. Browser only; every storage access is guarded.
 */
import type { PlacementsFile } from "@/lib/assets/types";

export const ENGINE_GOTO_FLAG = "wuxia-engine-goto";
/** localStorage: the editor's working placements (a PlacementsFile) for a preview tab. */
export const ENGINE_PREVIEW_KEY = "wuxia-engine-preview";
/** sessionStorage: this tab previews the editor's placements. */
const PREVIEW_SESSION_KEY = "wuxia-engine-preview";
/** localStorage: the save as it was before the last engine jump. */
export const ENGINE_SAVE_BACKUP_KEY = "wusia-world-v1:before-engine-goto";

function storageGet(storage: () => Storage, key: string): string | null {
  try { return storage().getItem(key); } catch { return null; }
}
function storageSet(storage: () => Storage, key: string, value: string): void {
  try { storage().setItem(key, value); } catch { /* private mode or blocked storage */ }
}

/** Whether the engine's dev hooks run in this browser. */
export function engineToolsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NODE_ENV === "development" || storageGet(() => localStorage, ENGINE_GOTO_FLAG) === "on";
}

/** The `engineGoto` location id in the address, when the hooks are on. */
export function engineGotoTarget(): string | null {
  if (!engineToolsEnabled()) return null;
  return new URLSearchParams(window.location.search).get("engineGoto");
}

/** This tab shows the editor's unsaved placements (set by `?enginePreview=1`, kept for the tab). */
export function enginePreviewActive(): boolean {
  if (!engineToolsEnabled()) return false;
  if (new URLSearchParams(window.location.search).get("enginePreview") === "1") {
    storageSet(() => sessionStorage, PREVIEW_SESSION_KEY, "1");
    return true;
  }
  return storageGet(() => sessionStorage, PREVIEW_SESSION_KEY) === "1";
}

/** The editor's working placements for a preview tab, or null. */
export function enginePreviewPlacements(): PlacementsFile | null {
  const raw = storageGet(() => localStorage, ENGINE_PREVIEW_KEY);
  if (!raw) return null;
  try {
    const file = JSON.parse(raw) as PlacementsFile;
    return file && typeof file.maps === "object" ? file : null;
  } catch { return null; }
}

/** The editor: hand the working placements to a new game tab at `locationId` (returns the URL). */
export function prepareEnginePlaytest(locationId: string, file: PlacementsFile): string {
  storageSet(() => localStorage, ENGINE_GOTO_FLAG, "on");
  storageSet(() => localStorage, ENGINE_PREVIEW_KEY, JSON.stringify(file));
  return `/?engineGoto=${encodeURIComponent(locationId)}&enginePreview=1`;
}

export { storageGet as engineStorageGet, storageSet as engineStorageSet };
