import type { QuestDef, QuestObjectiveSpot, WorldStateData } from "./types";
import { getQuest } from "./data/quests";
import { applyEffect, tickQuestProgress } from "./effects";

/**
 * Hands-on quest objectives (QuestStage.objective): spots the player uses in
 * person to advance a stage that no dialog or counter drives — "observe the
 * city gate", "search the south edge of town", "hand the letter over".
 * Progress per spot is a flag (`qobj:<quest>:<stage>:<index>`), so it rides
 * the save without a migration. Location spots show on the map; spots with an
 * `npcId` show as an action in that person's popup.
 */
export interface ActiveObjectiveSpot {
  questId: string;
  questName: string;
  stageIndex: number;
  spotIndex: number;
  spot: QuestObjectiveSpot;
  done: boolean;
}

export const objectiveFlag = (questId: string, stageId: string, spotIndex: number) => `qobj:${questId}:${stageId}:${spotIndex}`;

/** Spots of the current stage of one active quest (done or not). */
export function objectiveSpotsFor(state: WorldStateData, def: QuestDef): ActiveObjectiveSpot[] {
  const progress = state.quests[def.id];
  if (!progress || progress.status !== "active") return [];
  const stage = def.stages[progress.stage];
  if (!stage?.objective) return [];
  return stage.objective.spots.map((spot, spotIndex) => ({
    questId: def.id, questName: def.name, stageIndex: progress.stage, spotIndex, spot,
    done: state.flags[objectiveFlag(def.id, stage.id, spotIndex)] === true,
  }));
}

/** Every open spot across active quests. */
export function openObjectiveSpots(state: WorldStateData): ActiveObjectiveSpot[] {
  const out: ActiveObjectiveSpot[] = [];
  for (const progress of Object.values(state.quests)) {
    if (progress.status !== "active") continue;
    const def = getQuest(progress.id);
    if (def) out.push(...objectiveSpotsFor(state, def).filter((s) => !s.done));
  }
  return out;
}

/** Open map spots at a location (not the person-bound ones). */
export const objectiveSpotsAt = (state: WorldStateData, locationId: string) =>
  openObjectiveSpots(state).filter((s) => s.spot.locationId === locationId && !s.spot.npcId);

/** Open person-bound spots for an NPC. */
export const objectiveSpotsForNpc = (state: WorldStateData, npcId: string) =>
  openObjectiveSpots(state).filter((s) => s.spot.npcId === npcId);

/** Map marker id of a location spot. */
export const objectiveMarkerId = (questId: string, spotIndex: number) => `objective-${questId}-${spotIndex}`;

/** Done / total for the current stage's objective, or null when it has none. */
export function objectiveProgress(state: WorldStateData, def: QuestDef): { done: number; total: number } | null {
  const spots = objectiveSpotsFor(state, def);
  return spots.length ? { done: spots.filter((s) => s.done).length, total: spots.length } : null;
}

export type ObjectiveResult =
  | { ok: true; message: string; advanced: boolean; hours: number; sceneId?: string }
  | { ok: false; message: string };

/**
 * Use one spot. Mutates `state` (a draft): marks the spot, and when the
 * stage's last spot is done advances the quest and re-checks auto stages.
 * The caller advances time by `hours`, or opens `sceneId` for a dialog spot.
 */
export function completeObjectiveSpot(state: WorldStateData, questId: string, spotIndex: number): ObjectiveResult {
  const def = getQuest(questId);
  if (!def) return { ok: false, message: "ไม่มีภารกิจนี้" };
  const spots = objectiveSpotsFor(state, def);
  const entry = spots[spotIndex];
  if (!entry) return { ok: false, message: "ภารกิจนี้ไม่มีสิ่งที่ต้องทำที่นี่แล้ว" };
  if (entry.done) return { ok: false, message: "ทำตรงนี้ไปแล้ว" };
  if (state.currentSceneId !== entry.spot.locationId) return { ok: false, message: "ต้องไปทำที่สถานที่นั้น" };
  const stage = def.stages[entry.stageIndex];
  // Dialog-driven spot: the scene's own choices advance the quest.
  // Its hours (only when the stage sets them) pass before the dialog opens.
  if (entry.spot.sceneId) return { ok: true, message: "", advanced: false, hours: stage.objective?.hours ?? 0, sceneId: entry.spot.sceneId };
  state.flags[objectiveFlag(def.id, stage.id, spotIndex)] = true;
  const remaining = spots.filter((s) => !s.done && s.spotIndex !== spotIndex).length;
  const lead = entry.spot.text ?? `${entry.spot.label} · เสร็จแล้ว`;
  let advanced = false;
  if (remaining === 0) {
    applyEffect(state, { t: "advanceQuest", questId });
    tickQuestProgress(state);
    advanced = true;
  }
  const hours = stage.objective?.hours ?? 1;
  const tail = advanced ? "" : ` (เหลืออีก ${remaining} แห่ง)`;
  return { ok: true, message: lead + tail, advanced, hours };
}
