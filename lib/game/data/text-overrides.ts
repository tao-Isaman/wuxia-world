import raw from "./text-overrides.json";

// Engine-edited names and descriptions (/game/engine → วิชา) laid over the
// skill and art tables at module load. The file stores only changed fields,
// keyed by id; unknown ids are ignored, so a removed skill never breaks a
// build. Same shape as `TextOverrides` in lib/assets/types.ts (restated here
// because lib/game imports nothing outside itself). See docs/engine.md.

export interface TextOverrideEntry { n?: string; d?: string }
export interface GameTextOverrides {
  version: 1;
  skills: Record<string, TextOverrideEntry>;
  arts: Record<string, TextOverrideEntry>;
}
export type TextTable = "skills" | "arts";

/** Keep only well-formed entries: a non-empty name, a string description. */
export function normalizeTextOverrides(input: unknown): GameTextOverrides {
  const out: GameTextOverrides = { version: 1, skills: {}, arts: {} };
  if (!input || typeof input !== "object") return out;
  for (const table of ["skills", "arts"] as const) {
    const rows = (input as Record<string, unknown>)[table];
    if (!rows || typeof rows !== "object") continue;
    for (const [id, value] of Object.entries(rows as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const { n, d } = value as Record<string, unknown>;
      const entry: TextOverrideEntry = {};
      if (typeof n === "string" && n.trim()) entry.n = n.trim();
      if (typeof d === "string") entry.d = d;
      if (entry.n !== undefined || entry.d !== undefined) out[table][id] = entry;
    }
  }
  return out;
}

/** The committed overrides (lib/game/data/text-overrides.json). */
export const TEXT_OVERRIDES: GameTextOverrides = normalizeTextOverrides(raw);

/** Lay overrides over a table: a new array, changed rows copied, unknown ids ignored. */
export function applyTextOverrides<T extends { id: string; n: string; d?: string }>(
  rows: readonly T[],
  overrides: Record<string, TextOverrideEntry> | undefined,
): T[] {
  if (!overrides) return rows.slice();
  return rows.map((row) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, row.id)) return row;
    const o = overrides[row.id];
    const next = { ...row };
    if (typeof o.n === "string" && o.n.trim()) next.n = o.n.trim();
    if (typeof o.d === "string") next.d = o.d;
    return next;
  });
}

/** Each row's text before the overrides, for the engine's diff and reset. */
export const BASE_TEXT: Record<TextTable, Map<string, { n: string; d?: string }>> = { skills: new Map(), arts: new Map() };

/** Used by skills.ts / arts.ts around their literal tables. */
export function withTextOverrides<T extends { id: string; n: string; d?: string }>(table: TextTable, rows: readonly T[]): T[] {
  for (const row of rows) BASE_TEXT[table].set(row.id, { n: row.n, d: row.d });
  return applyTextOverrides(rows, TEXT_OVERRIDES[table]);
}
