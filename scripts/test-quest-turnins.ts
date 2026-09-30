// Plays every quest whose progress waits on items or kills through the real
// world store, the way a player does it:
//   1. already carry the items (or gather them after accepting),
//   2. accept, 3. satisfy each counted stage, 4. hand it in at the turn-in NPC
//   through the same path as the NPC popup (the _complete scene, else
//   finishQuestNow), and assert the quest ends "done" with the items delivered.
// Regression: qc_xixia_iron_supply showed 10/10 ore but never advanced because
// ore held before accepting did not count.
import assert from "node:assert/strict";
import { QUESTS } from "../lib/world/data/quests";
import { applyEffect, isQuestTurnInForNpc, describeQuestCondition } from "../lib/world/effects";
import { getScene } from "../lib/world";
import type { Condition, QuestDef, WorldStateData } from "../lib/world/types";

const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();
Math.random = () => 0.5;

type Need = { items: Record<string, number>; kills: Record<string, number>; visits: string[]; other: boolean };
function needs(c: Condition, out: Need = { items: {}, kills: {}, visits: [], other: false }): Need {
  if (c.t === "and") c.all.forEach((sub) => needs(sub, out));
  else if (c.t === "visitedLocation") out.visits.push(c.locationId);
  else if (c.t === "or") needs(c.any[0], out);
  else if (c.t === "hasItem") out.items[c.itemId] = Math.max(out.items[c.itemId] ?? 0, c.count ?? 1);
  else if (c.t === "defeatedOpponent") out.kills[c.opponentId] = Math.max(out.kills[c.opponentId] ?? 0, c.count ?? 1);
  else out.other = true;
  return out;
}

const counted = QUESTS.filter((q) => q.stages.some((stage) => stage.autoAdvance || stage.objective));
let objectiveStages = 0;
let played = 0, skipped = 0;
const failures: string[] = [];

function handIn(def: QuestDef): void {
  const npc = def.turnInNpcId ?? def.giverNpcId;
  if (npc) assert.ok(isQuestTurnInForNpc(store(), def, npc), `${def.id}: turn-in NPC ${npc} offers the hand-in`);
  const complete = getScene(`qs_${def.id}_complete`);
  if (complete?.kind === "dialog") {
    // Popup path 1: the completion scene closes the quest from a choice.
    useWorldStore.setState({ currentSceneId: complete.id });
    for (let step = 0; step < 6 && store().quests[def.id]?.status === "active"; step++) {
      const scene = getScene(store().currentSceneId);
      if (scene?.kind !== "dialog" || !scene.choices?.length) break;
      const index = Math.max(0, scene.choices.findIndex((choice) => choice.effects?.some((e) => e.t === "finishQuest" || e.t === "advanceQuest")));
      store().makeChoice(index);
    }
    if (store().quests[def.id]?.status === "active") store().finishQuestNow(def.id);
  } else {
    assert.equal(store().finishQuestNow(def.id).ok, true, `${def.id}: popup turn-in`);
  }
}

for (const def of counted) {
  store().startNewGame({ name: "ผู้ทดสอบ", gender: def.id.includes("emei") ? "female" : "male" } as never);
  const wants = def.stages.map((stage) => stage.autoAdvance ? needs(stage.autoAdvance) : null);
  const lastIndex = def.stages.length - 1;
  // Only quests whose counted stages are items / kills and whose other stages
  // are the final hand-in can be driven generically; dialog-driven middles are
  // covered by test:quests.
  const drivable = def.stages.every((stage, i) => (stage.objective ? !stage.objective.spots.some((spot) => spot.sceneId)
    : wants[i] ? !wants[i]!.other : i === lastIndex));
  if (!drivable) { skipped++; continue; }
  try {
    // Carry every required item BEFORE accepting (the regression).
    const bag: Record<string, number> = {};
    for (const want of wants) for (const [item, count] of Object.entries(want?.items ?? {})) bag[item] = Math.max(bag[item] ?? 0, count);
    useWorldStore.setState({ inventory: { ...bag } });
    const draft = JSON.parse(JSON.stringify(store())) as WorldStateData;
    applyEffect(draft, { t: "startQuest", questId: def.id });
    useWorldStore.setState({ quests: draft.quests });
    for (const [i, want] of wants.entries()) {
      const objective = def.stages[i].objective;
      if (objective && store().quests[def.id]?.stage === i) {
        // Walk to each spot and use it, the way the map / NPC popup does.
        for (const [spotIndex, spot] of objective.spots.entries()) {
          useWorldStore.setState({ currentSceneId: spot.locationId, lastLocationId: spot.locationId });
          const result = store().doQuestObjective(def.id, spotIndex);
          assert.ok(result.ok, `${def.id}: objective ${spot.label} at ${spot.locationId}: ${result.ok ? "" : result.message}`);
        }
        assert.ok((store().quests[def.id]?.stage ?? 0) > i || store().quests[def.id]?.status === "done", `${def.id}: objective stage ${i} advanced`);
        objectiveStages++;
        continue;
      }
      if (!want) continue;
      if (want.visits.length) useWorldStore.setState({ visitedLocationIds: [...new Set([...store().visitedLocationIds, ...want.visits])] });
      const kills = { ...store().defeatedCounts };
      for (const [opponent, count] of Object.entries(want.kills)) kills[opponent] = (kills[opponent] ?? 0) + count;
      // Nudge the bag too so the store re-checks progress even for item-only stages.
      useWorldStore.setState({ defeatedCounts: kills, inventory: { ...store().inventory } });
      const q = store().quests[def.id]!;
      if (q.status === "active") {
        assert.ok(q.stage > i, `${def.id}: stage ${i} advanced once its items/kills were met`);
        const lines = describeQuestCondition(store(), def.stages[i].autoAdvance!, 0, q);
        void lines;
      }
    }
    if (store().quests[def.id]?.status === "active") handIn(def);
    assert.equal(store().quests[def.id]?.status, "done", `${def.id}: finished`);
    played++;
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

// The quest log and the evaluator agree on kill counts since accepting.
store().startNewGame({ name: "ผู้ทดสอบ", gender: "male" } as never);
useWorldStore.setState({ defeatedCounts: { bandit_thug: 7 } });
const killQuest = counted.find((q) => q.stages[0].autoAdvance?.t === "defeatedOpponent");
if (killQuest) {
  const draft = JSON.parse(JSON.stringify(store())) as WorldStateData;
  const c = killQuest.stages[0].autoAdvance as Extract<Condition, { t: "defeatedOpponent" }>;
  draft.defeatedCounts[c.opponentId] = 7;
  applyEffect(draft, { t: "startQuest", questId: killQuest.id });
  const [line] = describeQuestCondition(draft, c, 0, draft.quests[killQuest.id]);
  if (line.current !== 0) failures.push(`quest log shows ${line.current} kills from before accepting`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`PASS ${played} item/kill/objective quests accept → progress → hand in → done (${objectiveStages} objective stages; ${skipped} dialog-driven ones left to test:quests)`);
