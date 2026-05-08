// Audit: every manualLearnSkill / manualLearnArt item should reference
// the same Thai name as the skill / art it teaches. Drift confuses
// players who use a manual called "X" expecting to learn skill "X" but
// actually receive skill "Y".

import { ITEMS } from "../lib/world/data/items";
import { getSkill, getArt } from "../lib/game";

interface Drift {
  itemId: string;
  itemName: string;
  targetId: string;
  targetName: string;
  kind: "skill" | "art";
}

const drift: Drift[] = [];

for (const it of ITEMS) {
  if (!it.use) continue;
  if (it.use.t === "manualLearnSkill") {
    const sk = getSkill(it.use.skillId);
    if (!sk) {
      drift.push({
        itemId: it.id,
        itemName: it.name,
        targetId: it.use.skillId,
        targetName: "(MISSING)",
        kind: "skill",
      });
      continue;
    }
    // Loose match: item name should contain the skill's Thai name (or
    // the skill name should appear in the item name). Tolerates the
    // "ตำรา" prefix and minor decoration.
    if (!it.name.includes(sk.n) && !sk.n.includes(it.name.replace(/^ตำรา/, ""))) {
      drift.push({
        itemId: it.id,
        itemName: it.name,
        targetId: sk.id,
        targetName: sk.n,
        kind: "skill",
      });
    }
  } else if (it.use.t === "manualLearnArt") {
    const a = getArt(it.use.artId);
    if (!a || a.id === "none") {
      drift.push({
        itemId: it.id,
        itemName: it.name,
        targetId: it.use.artId,
        targetName: "(MISSING)",
        kind: "art",
      });
      continue;
    }
    if (!it.name.includes(a.n) && !a.n.includes(it.name.replace(/^ตำรา/, ""))) {
      drift.push({
        itemId: it.id,
        itemName: it.name,
        targetId: a.id,
        targetName: a.n,
        kind: "art",
      });
    }
  }
}

if (drift.length === 0) {
  console.log("[audit-manual-names] OK — all manual names match their target skill/art");
  process.exit(0);
}

console.log(`[audit-manual-names] ${drift.length} manual(s) with name drift:\n`);
for (const d of drift) {
  console.log(`• ${d.itemId}`);
  console.log(`    item name:    "${d.itemName}"`);
  console.log(`    teaches:      ${d.targetId} = "${d.targetName}" (${d.kind})\n`);
}
process.exit(1);
