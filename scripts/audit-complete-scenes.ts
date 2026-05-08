// Audit: every `qs_<questId>_complete` dialog scene MUST eventually fire
// `finishQuest` (otherwise the NPC popup's turn-in path navigates to the
// scene without closing the quest, letting the player re-turn-in
// indefinitely). Acceptable locations: scene's onEnter effects, or any
// of the scene's choice's effects.

import { SCENES } from "../lib/world/data/scenes";
import type { Scene, SceneEffect } from "../lib/world/types";

interface Bad {
  sceneId: string;
  questId: string;
  reason: string;
}

const out: Bad[] = [];

function effectsHaveFinish(effects: readonly SceneEffect[] | undefined, questId: string): boolean {
  if (!effects) return false;
  return effects.some((e) => e.t === "finishQuest" && e.questId === questId);
}

for (const sc of SCENES as readonly Scene[]) {
  // Scene id pattern: qs_<questId>_complete. The quest id is the literal
  // middle (could be qst_*, qc_*, qe_*, etc — keep whatever prefix the
  // author chose).
  const m = sc.id.match(/^qs_(.+)_complete$/);
  if (!m) continue;
  const questId = m[1]!;
  if (sc.kind !== "dialog") continue;

  // Accepted: onEnter has finishQuest, OR any choice's effects have it.
  const inOnEnter = effectsHaveFinish(sc.onEnter, questId);
  const inAnyChoice = (sc.choices ?? []).some((c) =>
    effectsHaveFinish(c.effects, questId),
  );

  if (!inOnEnter && !inAnyChoice) {
    out.push({
      sceneId: sc.id,
      questId,
      reason: "no finishQuest in onEnter or any choice",
    });
  }
}

if (out.length === 0) {
  console.log("[audit-complete-scenes] OK — every qs_*_complete scene fires finishQuest");
  process.exit(0);
}

console.log(`[audit-complete-scenes] ${out.length} broken complete scene(s):\n`);
for (const b of out) {
  console.log(`• ${b.sceneId}`);
  console.log(`    expected finishQuest: ${b.questId}`);
  console.log(`    reason: ${b.reason}\n`);
}
process.exit(1);
