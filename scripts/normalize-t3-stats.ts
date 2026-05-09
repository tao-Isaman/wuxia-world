// One-shot move-skill stat normalizer (all tiers).
//
// Reads lib/game/data/skills.ts, finds every entry, parses the
// `st: { ... }` block, and rewrites it so the sum of all stat values
// equals the per-tier TARGETS table. Scales the largest values down or
// pads with filler stats (DEX → AGI → LUK → VIT) if the entry has
// room.
//
// Run: `bun scripts/normalize-t3-stats.ts`

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Per-tier stat-sum target. +5 per tier — keeps the budget legible:
//   T0 = 10  (entry-level — STR5 VIT5 etc.)
//   T1 = 15  (intermediate — STR6 VIT5 DEX4)
//   T2 = 20  (advanced sect basics)
//   T3 = 25  (master tier disciple-line)
//   T4 = 30  (legendary signatures)
const TARGETS: Record<number, number> = {
  0: 10,
  1: 15,
  2: 20,
  3: 25,
  4: 30,
};
const META_DIR = (import.meta as unknown as { dir: string }).dir;
const FILE = path.resolve(META_DIR, "..", "lib/game/data/skills.ts");

const src = readFileSync(FILE, "utf8");
const lines = src.split("\n");
let changed = 0;
const report: { id: string; tier: number; before: number; after: number }[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]!;
  const tiMatch = line.match(/ti:\s*(\d+),/);
  if (!tiMatch) continue;
  const tier = parseInt(tiMatch[1]!, 10);
  const TARGET = TARGETS[tier];
  if (TARGET === undefined) continue;
  const idMatch = line.match(/id:\s*"([^"]+)"/);
  const stMatch = line.match(/st:\s*\{([^}]+)\}/);
  if (!idMatch || !stMatch) continue;
  const id = idMatch[1]!;
  const stBody = stMatch[1]!;
  // Parse "STR: 10, AGI: 8" → entries
  const entries: [string, number][] = [];
  for (const part of stBody.split(",")) {
    const m = part.trim().match(/^([A-Z]+):\s*(\d+)$/);
    if (!m) continue;
    entries.push([m[1]!, parseInt(m[2]!, 10)]);
  }
  const before = entries.reduce((s, [, v]) => s + v, 0);
  if (before === TARGET) continue;

  // Adjustment strategy:
  //   Bump up: distribute the deficit to the LARGEST stat (so a skill
  //     leaning STR/POW gets more of that). If deficit > 4, also pad
  //     a third stat with the leftover.
  //   Trim down: subtract from the LARGEST stat first (caps the highest
  //     to maintain rough proportions).
  const next = entries.map(([k, v]) => [k, v] as [string, number]);
  const delta = TARGET - before;
  if (delta > 0) {
    // Bump — split delta across the top 1-2 stats first, then fall
    // back to adding a small DEX/AGI/LUK filler.
    const sorted = [...next].sort((a, b) => b[1] - a[1]);
    const big = sorted[0]!;
    if (delta <= 2) {
      const idx = next.findIndex((e) => e[0] === big[0]);
      next[idx]![1] += delta;
    } else {
      const idx0 = next.findIndex((e) => e[0] === big[0]);
      next[idx0]![1] += 1;
      const second = sorted[1];
      const idx1 = second ? next.findIndex((e) => e[0] === second[0]) : -1;
      if (idx1 >= 0) next[idx1]![1] += 1;
      // Remaining deficit → push into a third stat (use DEX as default
      // filler; if DEX already present, use AGI; then LUK).
      let rem = delta - (idx1 >= 0 ? 2 : 1);
      if (rem > 0) {
        const fillers = ["DEX", "AGI", "LUK", "VIT"];
        const haveStats = new Set(next.map((e) => e[0]));
        let filler = fillers.find((f) => !haveStats.has(f));
        if (!filler) {
          // All filler stats already present — bump biggest one by rem.
          const idx = next.findIndex((e) => e[0] === big[0]);
          next[idx]![1] += rem;
        } else {
          next.push([filler, rem]);
        }
      }
    }
  } else {
    // Trim — pull from largest stats first.
    let trim = -delta;
    while (trim > 0) {
      const sorted = [...next].sort((a, b) => b[1] - a[1]);
      const top = sorted[0]!;
      const idx = next.findIndex((e) => e[0] === top[0]);
      const take = Math.min(trim, top[1] - 1); // never zero out
      if (take <= 0) break;
      next[idx]![1] -= take;
      trim -= take;
    }
  }

  const after = next.reduce((s, [, v]) => s + v, 0);
  if (after !== TARGET) {
    console.error(`[warn] ${id}: target ${TARGET} but landed at ${after}`);
  }
  const newStBody = next.map(([k, v]) => `${k}: ${v}`).join(", ");
  const newLine = line.replace(/st:\s*\{[^}]+\}/, `st: { ${newStBody} }`);
  lines[i] = newLine;
  changed++;
  report.push({ id, tier, before, after });
}

writeFileSync(FILE, lines.join("\n"), "utf8");
console.log(`[normalize] Per-tier targets: ${JSON.stringify(TARGETS)}.`);
console.log(`[normalize] Changed ${changed} skills:`);
for (const r of report) {
  console.log(`  T${r.tier} ${r.id.padEnd(24)} ${r.before} → ${r.after}`);
}
