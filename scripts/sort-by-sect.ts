// One-shot sorter for lib/game/data/skills.ts and lib/game/data/arts.ts.
//
// Reads each file, parses every top-level entry inside the SKILLS / ARTS
// array, sorts entries first by SECT_ORDER (sect bucket), then by `ti`
// (tier ascending) within each bucket, and rewrites the file with a
// `// ─── <sect name> ───` header before each bucket. Header comments
// are regenerated — any prior section comments are dropped.
//
// Run: `bun scripts/sort-by-sect.ts`

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SECT_ORDER, JIANGHU_SECT } from "../lib/game/data/sects";

interface Entry {
  text: string;
  sc: string;
  ti: number;
}

// Find the index of `[` that opens the array literal after the export
// declaration, and the matching `]` that closes it. Brace-aware so a
// stats object inside an entry doesn't fool the matcher. Skip past the
// `Skill[]` / `Art[]` type signature — find the `[` that comes AFTER the
// `=` sign so we don't accidentally match the empty type-array brackets.
function findArrayBody(src: string, declaration: string): { open: number; close: number } {
  const declIdx = src.indexOf(declaration);
  if (declIdx < 0) throw new Error(`declaration not found: ${declaration}`);
  const eqIdx = src.indexOf("=", declIdx);
  if (eqIdx < 0) throw new Error("`=` not found after declaration");
  const open = src.indexOf("[", eqIdx);
  if (open < 0) throw new Error("array open not found");
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return { open, close: i };
    }
  }
  throw new Error("array close not found");
}

// Parse the entries inside an array literal body. Each entry is a
// top-level `{...}` object, possibly spanning multiple lines (arts.ts).
// We walk character-by-character tracking brace depth + string state +
// comment state. Comments can contain stray apostrophes (e.g. "target's")
// that would otherwise trip the string-state tracker, so they're skipped
// outright.
function splitEntries(body: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr: '"' | "'" | "`" | null = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    const next = body[i + 1];
    if (inStr) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    // Skip line comments — `//` to end-of-line. Comments live OUTSIDE
    // entries (they're section headers), so we never lose entry content
    // by skipping them.
    if (c === "/" && next === "/") {
      while (i < body.length && body[i] !== "\n") i++;
      continue;
    }
    // Skip block comments — `/* ... */`. Same reasoning.
    if (c === "/" && next === "*") {
      i += 2;
      while (i < body.length - 1 && !(body[i] === "*" && body[i + 1] === "/")) i++;
      i++; // land on the `/`; loop's i++ moves past it
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c as '"' | "'" | "`";
      continue;
    }
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        // Capture trailing comma + whitespace up to newline so the
        // emitted text ends cleanly. We trim later.
        let end = i + 1;
        while (end < body.length && (body[end] === "," || body[end] === " ")) end++;
        entries.push(body.slice(start, end).trim().replace(/,$/, ""));
        start = -1;
      }
    }
  }
  return entries;
}

// Pull the `sc:` value out of an entry. Tolerates both `sc: "X"` and
// `sc:"X"` forms; assumes the value is a string literal (true for our
// data tables).
function extractSc(entry: string): string {
  const m = entry.match(/sc:\s*"([^"]*)"/);
  if (!m) throw new Error(`no sc found in entry: ${entry.slice(0, 80)}…`);
  return m[1];
}

// Pull the `ti:` value out of an entry. Defaults to 0 if missing
// (shouldn't happen — every skill / art carries ti).
function extractTi(entry: string): number {
  const m = entry.match(/ti:\s*(\d+)/);
  if (!m) return 0;
  return parseInt(m[1], 10);
}

function sortAndRewrite(filePath: string, declaration: string): void {
  const src = readFileSync(filePath, "utf8");
  const { open, close } = findArrayBody(src, declaration);
  const body = src.slice(open + 1, close);
  const entries = splitEntries(body);

  // Bucket entries by sect, preserving declaration order WITHIN a tier
  // (stable sort is critical so two entries with the same sect+tier
  // don't shuffle relative to each other).
  const buckets = new Map<string, Entry[]>();
  for (const text of entries) {
    const sc = extractSc(text);
    const ti = extractTi(text);
    const bucket = buckets.get(sc) ?? [];
    bucket.push({ text, sc, ti });
    buckets.set(sc, bucket);
  }

  for (const [, bucket] of buckets) {
    bucket.sort((a, b) => a.ti - b.ti);
  }

  // Build the canonical sect order: SECT_ORDER first, then any sects
  // that don't appear in SECT_ORDER (shouldn't happen — sect names are
  // controlled — but stay defensive). The sentinel "" / empty sect (the
  // `none` art) gets emitted at the very top, before any header.
  const orderedSects: string[] = [];
  if (buckets.has("")) orderedSects.push("");
  for (const sect of SECT_ORDER) {
    if (buckets.has(sect)) orderedSects.push(sect);
  }
  for (const sect of buckets.keys()) {
    if (!orderedSects.includes(sect)) orderedSects.push(sect);
  }

  // Emit. Each sect block:
  //   <blank line>
  //   // ─── <sect name> ───
  //   <entries, each on its own line, trailing comma>
  const lines: string[] = [];
  for (const sect of orderedSects) {
    const items = buckets.get(sect) ?? [];
    if (items.length === 0) continue;
    if (sect !== "") {
      lines.push("");
      lines.push(`  // ─── ${sect} ───`);
    }
    for (const item of items) {
      lines.push(`  ${item.text},`);
    }
  }

  const before = src.slice(0, open + 1);
  const after = src.slice(close);
  const newBody = "\n" + lines.join("\n") + "\n";
  const out = before + newBody + after;
  writeFileSync(filePath, out, "utf8");
  const totalEntries = entries.length;
  console.log(`[sort] ${path.basename(filePath)} — ${totalEntries} entries, ${orderedSects.length} sects (sentinel + ${orderedSects.filter((s) => s !== "").length} named).`);
}

// Bun-only: import.meta.dir is the absolute directory of this script.
// `as unknown as { dir: string }` suppresses TS's stricter ImportMeta.
const META_DIR = (import.meta as unknown as { dir: string }).dir;
const ROOT = path.resolve(META_DIR, "..");
sortAndRewrite(path.join(ROOT, "lib/game/data/skills.ts"), "export const SKILLS");
sortAndRewrite(path.join(ROOT, "lib/game/data/arts.ts"), "export const ARTS");
console.log(`[sort] Use SECT_ORDER as the canonical sequence: ${[JIANGHU_SECT].length ? "" : ""}${SECT_ORDER.length} sects total (jianghu = ${JIANGHU_SECT}).`);
