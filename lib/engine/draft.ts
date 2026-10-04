/**
 * Unsaved engine edits kept in this browser's localStorage so a reload does
 * not lose them. Every access is guarded: storage can be missing or throw
 * (private windows, blocked site data), and then drafts simply don't persist.
 */
export const DRAFT_KEYS = {
  manifest: "wuxia-engine-draft-manifest",
  text: "wuxia-engine-draft-text",
} as const;

export function readDraft<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) globalThis.localStorage?.removeItem(key);
    else globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the draft lives only in memory.
  }
}
