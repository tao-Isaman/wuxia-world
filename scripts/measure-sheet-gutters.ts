/**
 * Measure transparent gutters in an uneven 4-column character sheet.
 * Run: bun scripts/measure-sheet-gutters.ts <png> [rows=4]
 * Prints a CharacterSheetLayout proposal (alpha threshold 32, matching the loader)
 * or reports the rows/cells where no clean gutter exists.
 */
import sharp from "sharp";

const [file, rowArg] = process.argv.slice(2);
if (!file) throw new Error("usage: bun scripts/measure-sheet-gutters.ts <png> [rows]");
const rows = Number(rowArg ?? 4);
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const solid = (x: number, y: number) => data[(y * width + x) * 4 + 3] >= 32;

/** Pick `cuts` split points in the widest empty runs, one per expected gap. */
function splits(length: number, empty: (i: number) => boolean, count: number): number[] | null {
  const runs: { start: number; end: number }[] = [];
  let start = -1;
  for (let i = 0; i <= length; i++) {
    const e = i < length && empty(i);
    if (e && start < 0) start = i;
    if (!e && start >= 0) { runs.push({ start, end: i }); start = -1; }
  }
  const inner = runs.filter((r) => r.start > 0 && r.end < length);
  // Choose the empty run nearest each ideal equal-cell boundary.
  const result: number[] = [];
  for (let k = 1; k < count; k++) {
    const ideal = (k * length) / count;
    let best: { start: number; end: number } | undefined, dist = Infinity;
    for (const r of inner) {
      const mid = (r.start + r.end) / 2, d = Math.abs(mid - ideal);
      if (d < dist && d < length / count / 2) { dist = d; best = r; }
    }
    if (!best) return null;
    result.push(Math.round((best.start + best.end) / 2));
  }
  return [0, ...result, length];
}

const rowEdges = splits(height, (y) => { for (let x = 0; x < width; x++) if (solid(x, y)) return false; return true; }, rows);
if (!rowEdges) { console.log(JSON.stringify({ file, width, height, error: "no clean row gutters" })); process.exit(1); }
const rowColumns: number[][] = [];
for (let r = 0; r < rows; r++) {
  const [y0, y1] = [rowEdges[r], rowEdges[r + 1]];
  const cols = splits(width, (x) => { for (let y = y0; y < y1; y++) if (solid(x, y)) return false; return true; }, 4);
  rowColumns.push(cols ?? []);
}
console.log(JSON.stringify({ file: file.split("/").pop(), width, height, rows: rowEdges, rowColumns }));
