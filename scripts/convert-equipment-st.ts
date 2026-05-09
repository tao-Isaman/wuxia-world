// One-shot script: read equipment.ts, for each item with non-empty `st`,
// compute equivalent direct combat-stat boosts using the derive formulas
// and rewrite the line. Outputs to stdout — pipe to a tmp file then
// `mv` over the original.
//
// Conversion (matches lib/game/derive.ts `derive()`):
//   STR +N → ATK +3N, PA +2N, HP +3N, Cri +N
//   AGI +N → ATK +N, Eva +2N, SPD +2N
//   POW +N → ATK +N, IA +2N, MP +12N, PD +N, ID +N
//   VIT +N → HP +20N, PD +N, ID +N
//   DEX +N → ATK +N, PA +N, IA +N, Acc +2N
//   DEF +N → HP +10N, PD +2N, ID +2N, Res +0.5N
//   INT +N → ATK +2N, MP +4N, PD +2N, ID +2N
//   LUK +N → PA +N, IA +N, Cri +N, Res +N

import { readFileSync, writeFileSync } from "fs";

const FILE = "lib/game/data/equipment.ts";
const src = readFileSync(FILE, "utf8");

interface Boosts {
  atkb: number; pdb: number; idb: number; hpb: number; mpb: number;
  pab: number; iab: number; spdb: number; evab: number;
  accb: number; crib: number; resb: number;
}
const empty = (): Boosts => ({
  atkb: 0, pdb: 0, idb: 0, hpb: 0, mpb: 0,
  pab: 0, iab: 0, spdb: 0, evab: 0, accb: 0, crib: 0, resb: 0,
});

function applyStat(b: Boosts, stat: string, n: number): void {
  switch (stat) {
    case "STR":
      b.atkb += 3 * n; b.pab += 2 * n; b.hpb += 3 * n; b.crib += n; break;
    case "AGI":
      b.atkb += n; b.evab += 2 * n; b.spdb += 2 * n; break;
    case "POW":
      b.atkb += n; b.iab += 2 * n; b.mpb += 12 * n; b.pdb += n; b.idb += n; break;
    case "VIT":
      b.hpb += 20 * n; b.pdb += n; b.idb += n; break;
    case "DEX":
      b.atkb += n; b.pab += n; b.iab += n; b.accb += 2 * n; break;
    case "DEF":
      b.hpb += 10 * n; b.pdb += 2 * n; b.idb += 2 * n; b.resb += Math.floor(0.5 * n); break;
    case "INT":
      b.atkb += 2 * n; b.mpb += 4 * n; b.pdb += 2 * n; b.idb += 2 * n; break;
    case "LUK":
      b.pab += n; b.iab += n; b.crib += n; b.resb += n; break;
  }
}

const lines = src.split("\n");
let modified = 0;
const out: string[] = [];

for (const line of lines) {
  // Match: ...atkb: N, pdb: N, idb: N, hpb: N, mpb: N, st: { ... }, eff: ...(any trailing fields)... },
  // Allow flexible whitespace and trailing fields after eff (e.g. ", instrument: true").
  const m = line.match(/^(\s*\{[^}]*?ty: "[^"]+",\s*)atkb:\s*(\d+),\s*pdb:\s*(\d+),\s*idb:\s*(\d+),\s*hpb:\s*(\d+),\s*mpb:\s*(\d+),\s*st:\s*\{([^}]*)\},\s*(eff:.*)\s*\}(,?)$/);
  if (!m) {
    out.push(line);
    continue;
  }
  const [, prefix, atkb, pdb, idb, hpb, mpb, stContent, effRest, comma] = m;
  const stTrimmed = stContent!.trim();
  if (stTrimmed === "" || stTrimmed === ",") {
    // Empty st — leave line as-is.
    out.push(line);
    continue;
  }
  // Parse st content like `STR: 8, DEX: 7`
  const b = empty();
  // Start from existing direct boosts.
  b.atkb = +atkb!; b.pdb = +pdb!; b.idb = +idb!;
  b.hpb = +hpb!; b.mpb = +mpb!;
  const statRe = /(STR|AGI|POW|VIT|DEX|DEF|INT|LUK):\s*(\d+)/g;
  let sm: RegExpExecArray | null;
  while ((sm = statRe.exec(stContent!)) !== null) {
    applyStat(b, sm[1]!, +sm[2]!);
  }
  // Build new line. Show only non-zero direct boost fields (compact).
  const fields: string[] = [];
  fields.push(`atkb: ${b.atkb}`);
  fields.push(`pdb: ${b.pdb}`);
  fields.push(`idb: ${b.idb}`);
  fields.push(`hpb: ${b.hpb}`);
  fields.push(`mpb: ${b.mpb}`);
  if (b.pab) fields.push(`pab: ${b.pab}`);
  if (b.iab) fields.push(`iab: ${b.iab}`);
  if (b.spdb) fields.push(`spdb: ${b.spdb}`);
  if (b.evab) fields.push(`evab: ${b.evab}`);
  if (b.accb) fields.push(`accb: ${b.accb}`);
  if (b.crib) fields.push(`crib: ${b.crib}`);
  if (b.resb) fields.push(`resb: ${b.resb}`);
  out.push(`${prefix}${fields.join(", ")}, st: {}, ${effRest!.trim()} }${comma}`);
  modified++;
}

writeFileSync(FILE, out.join("\n"));
console.log(`[convert-equipment-st] modified ${modified} equipment entries`);
