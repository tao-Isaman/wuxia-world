// One-shot audit: scan every quest stage and flag where the description's
// numeric mention disagrees with the autoAdvance condition's `count` /
// `min` value. Catches drift after balance edits (e.g., "ปราบ 1 คน" but
// count: 3) which silently strands players.

import { QUESTS } from "../lib/world/data/quests";
import type { Condition } from "../lib/world/types";

interface Mismatch {
  questId: string;
  questName: string;
  stageId: string;
  description: string;
  conditionSummary: string;
  reason: string;
}

const out: Mismatch[] = [];

function describe(c: Condition): string {
  switch (c.t) {
    case "hasItem": return `hasItem ${c.itemId} count:${c.count ?? 1}`;
    case "defeatedOpponent": return `defeatedOpponent ${c.opponentId} count:${c.count ?? 1}`;
    case "stoleFromNpc": return `stoleFromNpc ${c.npcId} count:${c.count ?? 1}`;
    case "trait": return `trait ${c.trait} min:${c.min ?? "-"} max:${c.max ?? "-"}`;
    case "npcRelationship": return `npcRel ${c.npcId} min:${c.min ?? "-"} max:${c.max ?? "-"}`;
    case "visitedLocation": return `visited ${c.locationId}`;
    case "questStatus": return `quest ${c.questId} = ${c.status}`;
    case "and": return `and(${c.all.map(describe).join(", ")})`;
    case "or": return `or(${c.any.map(describe).join(", ")})`;
    case "not": return `not(${describe(c.of)})`;
    default: return c.t;
  }
}

function extractCounts(c: Condition): number[] {
  switch (c.t) {
    case "hasItem":
    case "defeatedOpponent":
    case "stoleFromNpc": return [c.count ?? 1];
    case "trait":
    case "npcRelationship": {
      const v = c.min ?? c.max;
      return typeof v === "number" ? [v] : [];
    }
    case "and": return c.all.flatMap(extractCounts);
    case "or": return c.any.flatMap(extractCounts);
    case "not": return extractCounts(c.of);
    default: return [];
  }
}

function descNumbers(text: string): number[] {
  // Match arabic + Thai numerals.
  const ARABIC = (text.match(/\d+/g) ?? []).map(Number);
  const THAI_DIGIT_MAP: Record<string, string> = {
    "๐": "0", "๑": "1", "๒": "2", "๓": "3", "๔": "4",
    "๕": "5", "๖": "6", "๗": "7", "๘": "8", "๙": "9",
  };
  const thai = (text.match(/[๐-๙]+/g) ?? []).map((s) =>
    Number(s.split("").map((c) => THAI_DIGIT_MAP[c] ?? c).join("")),
  );
  return [...ARABIC, ...thai];
}

for (const q of QUESTS) {
  for (const s of q.stages) {
    if (!s.autoAdvance) continue;
    const condCounts = extractCounts(s.autoAdvance);
    const descCounts = descNumbers(s.description);
    if (condCounts.length === 0) continue;
    // For each cond count, check if it appears in the description.
    for (const need of condCounts) {
      if (!descCounts.includes(need)) {
        out.push({
          questId: q.id,
          questName: q.name,
          stageId: s.id,
          description: s.description,
          conditionSummary: describe(s.autoAdvance),
          reason: `condition needs ${need} but description has [${descCounts.join(", ") || "none"}]`,
        });
        break;
      }
    }
  }
}

if (out.length === 0) {
  console.log("[audit-quest-counts] OK — no mismatches");
  process.exit(0);
}

console.log(`[audit-quest-counts] ${out.length} mismatch(es) found:\n`);
for (const m of out) {
  console.log(`• ${m.questId} (${m.questName}) stage "${m.stageId}"`);
  console.log(`    desc:       ${m.description}`);
  console.log(`    autoAdv:    ${m.conditionSummary}`);
  console.log(`    issue:      ${m.reason}\n`);
}
process.exit(1);
