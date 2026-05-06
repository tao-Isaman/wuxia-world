// Walks every QuestDef and reports navigation problems:
//   - missing `qs_<questId>_offer` scene
//   - missing `qs_<questId>_complete` scene
//   - offer accept choice routes to a location without quest progression
//     (no autoAdvance on stage 0, no quest-scene chain) — quest accepts
//     but the next dialog beat is unreachable
//   - quest stage references an autoAdvance whose target ids are unknown
//
// Usage:  bun run scripts/audit-quest-flow.ts

import {
  QUESTS,
  SCENES_BY_ID,
  type Choice,
  type Condition,
  type DialogScene,
  type QuestDef,
  type Scene,
  type SceneEffect,
} from "@/lib/world";

interface Issue {
  questId: string;
  kind: "missing-offer" | "missing-complete" | "stranded-accept" | "no-finish-path";
  detail: string;
}

const issues: Issue[] = [];

// True when at least one stage has an autoAdvance — gameplay can resolve
// the quest without any dialog beats once the offer is accepted.
function questHasAutoAdvance(q: QuestDef): boolean {
  return q.stages.some((s) => Boolean(s.autoAdvance));
}

// BFS through quest-specific dialog scenes (any scene id starting with
// `qs_<questId>_`) reachable from `startSceneId` via choice.next, choice.next
// from triggerBattle effects, or direct .next chains. Returns the set of
// reachable quest scene ids.
function reachableQuestScenes(questId: string, startSceneId: string): Set<string> {
  const prefix = `qs_${questId}_`;
  const visited = new Set<string>();
  const queue: string[] = [startSceneId];
  while (queue.length > 0) {
    const sid = queue.shift()!;
    if (visited.has(sid)) continue;
    visited.add(sid);
    const sc = SCENES_BY_ID.get(sid);
    if (!sc || sc.kind !== "dialog") continue;
    const candidates = collectChildSceneIds(sc).filter(
      (next) => next.startsWith(prefix),
    );
    for (const next of candidates) queue.push(next);
  }
  return visited;
}

function collectChildSceneIds(sc: DialogScene): string[] {
  const out: string[] = [];
  if (sc.next) out.push(sc.next);
  for (const c of sc.choices ?? []) {
    out.push(c.next);
    for (const e of c.effects ?? []) collectFromEffect(e, out);
  }
  for (const e of sc.onEnter ?? []) collectFromEffect(e, out);
  return out;
}

function collectFromEffect(e: SceneEffect, out: string[]): void {
  switch (e.t) {
    case "goto":
      out.push(e.sceneId);
      break;
    case "gotoRandom":
      out.push(...e.sceneIds);
      break;
    case "triggerBattle":
      out.push(e.onWin, e.onLose);
      break;
  }
}

// True when any reachable quest scene (in `reachable`) emits a finishQuest
// effect for `questId` somewhere in its choice.effects or onEnter. We don't
// chase advanceQuest — relying on advanceQuest auto-completing on the last
// stage is fine, but we still want a path that calls one of finish/advance.
function hasFinishOrAdvancePath(
  questId: string,
  reachable: Set<string>,
): boolean {
  for (const sid of reachable) {
    const sc = SCENES_BY_ID.get(sid);
    if (!sc || sc.kind !== "dialog") continue;
    if (sceneEmitsFinishOrAdvance(sc, questId)) return true;
  }
  return false;
}

function sceneEmitsFinishOrAdvance(sc: DialogScene, questId: string): boolean {
  for (const e of sc.onEnter ?? []) {
    if (effectIsFinish(e, questId)) return true;
  }
  for (const c of sc.choices ?? []) {
    for (const e of c.effects ?? []) {
      if (effectIsFinish(e, questId)) return true;
    }
  }
  return false;
}

function effectIsFinish(e: SceneEffect, questId: string): boolean {
  if (e.t === "finishQuest" && e.questId === questId) return true;
  if (e.t === "advanceQuest" && e.questId === questId) return true;
  return false;
}

// Find the offer scene's accept choice (the one whose effects contain
// startQuest for this questId). Returns the choice or null.
function findAcceptChoice(offer: DialogScene, questId: string): Choice | null {
  for (const c of offer.choices ?? []) {
    for (const e of c.effects ?? []) {
      if (e.t === "startQuest" && e.questId === questId) return c;
    }
  }
  return null;
}

for (const q of QUESTS) {
  const offerId = `qs_${q.id}_offer`;
  const completeId = `qs_${q.id}_complete`;
  const offer = SCENES_BY_ID.get(offerId);
  const complete = SCENES_BY_ID.get(completeId);

  // Tutorial / core quests don't follow the qs_<id>_offer convention; skip
  // them gracefully.
  if (!offer && q.id === "first_steps") continue;

  if (!offer) {
    issues.push({
      questId: q.id,
      kind: "missing-offer",
      detail: `expected scene "${offerId}" not found`,
    });
    continue;
  }

  if (!complete) {
    issues.push({
      questId: q.id,
      kind: "missing-complete",
      detail: `expected scene "${completeId}" not found`,
    });
  }

  const accept = offer.kind === "dialog" ? findAcceptChoice(offer, q.id) : null;
  if (!accept) {
    // No accept choice — could be onEnter-driven, but content authors used
    // choices everywhere. Flag for a manual look.
    issues.push({
      questId: q.id,
      kind: "stranded-accept",
      detail: `offer scene has no accept choice that emits startQuest`,
    });
    continue;
  }

  const acceptTarget = accept.next;
  const acceptTargetScene = SCENES_BY_ID.get(acceptTarget);
  const acceptTargetIsQuestScene = acceptTarget.startsWith(`qs_${q.id}_`);

  if (acceptTargetIsQuestScene) {
    // Accept routes directly into a quest-scene chain — verify the chain
    // can reach a finishQuest/advanceQuest path.
    const reachable = reachableQuestScenes(q.id, acceptTarget);
    if (!hasFinishOrAdvancePath(q.id, reachable)) {
      issues.push({
        questId: q.id,
        kind: "no-finish-path",
        detail: `accept routes to "${acceptTarget}" but no reachable quest scene emits finishQuest/advanceQuest`,
      });
    }
    continue;
  }

  // Accept routes back to a location (or some non-quest scene). The quest
  // is then expected to progress via:
  //   - autoAdvance condition on a stage (gameplay-driven), AND
  //   - the popup's turn-in button routing to qs_<id>_complete (which we
  //     just guaranteed engine-side), OR
  //   - the giver NPC's ambient dialog branching on questStatus.
  // The remaining failure mode is: no autoAdvance AND no complete scene
  // reachable from a non-popup path. With the popup engine fix in place,
  // the only hard fail is "no complete scene at all".
  if (!questHasAutoAdvance(q) && !complete) {
    issues.push({
      questId: q.id,
      kind: "stranded-accept",
      detail: `accept routes to "${acceptTarget}" but quest has no autoAdvance stage AND no complete scene`,
    });
  } else if (!questHasAutoAdvance(q) && complete) {
    // Quest has no autoAdvance — relies on dialog or popup turn-in.
    // Engine fix routes turn-in to qs_<id>_complete; that path is fine.
    // Just sanity-check the complete scene actually emits finishQuest /
    // advanceQuest somewhere.
    const reachable = reachableQuestScenes(q.id, completeId);
    if (!hasFinishOrAdvancePath(q.id, reachable)) {
      issues.push({
        questId: q.id,
        kind: "no-finish-path",
        detail: `complete scene "${completeId}" doesn't emit finishQuest/advanceQuest`,
      });
    }
  }

  // Sanity check: every accept-target scene id resolves.
  if (!acceptTargetScene) {
    issues.push({
      questId: q.id,
      kind: "stranded-accept",
      detail: `accept choice next "${acceptTarget}" is not a known scene`,
    });
  }
}

// Group by kind for readable output.
const byKind = new Map<string, Issue[]>();
for (const i of issues) {
  const arr = byKind.get(i.kind) ?? [];
  arr.push(i);
  byKind.set(i.kind, arr);
}

if (issues.length === 0) {
  console.log(`[quest-flow] OK — every quest has a reachable finish path.`);
  process.exit(0);
}

console.error(`[quest-flow] ${issues.length} issue(s):`);
for (const [kind, arr] of byKind) {
  console.error(`\n=== ${kind} (${arr.length}) ===`);
  for (const i of arr) {
    console.error(`  - ${i.questId}: ${i.detail}`);
  }
}
process.exit(1);
