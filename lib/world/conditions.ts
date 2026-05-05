import type { Condition, QuestStatus, WorldStateData } from "./types";

// Pure: read-only check against world state. No mutations.
export function evaluateCondition(state: WorldStateData, c: Condition): boolean {
  switch (c.t) {
    case "flag": {
      const v = state.flags[c.flag];
      if (c.equals === undefined) return Boolean(v);
      return v === c.equals;
    }
    case "hasItem": {
      const have = state.inventory[c.itemId] ?? 0;
      return have >= (c.count ?? 1);
    }
    case "questStatus":
      return getQuestStatus(state, c.questId) === c.status;
    case "trait": {
      const v = state.traits[c.trait] ?? 0;
      if (c.min !== undefined && v < c.min) return false;
      if (c.max !== undefined && v > c.max) return false;
      return true;
    }
    case "npcRelationship": {
      const v = state.npcStates[c.npcId]?.relationship ?? 0;
      if (c.min !== undefined && v < c.min) return false;
      if (c.max !== undefined && v > c.max) return false;
      return true;
    }
    case "and":
      return c.all.every((sub) => evaluateCondition(state, sub));
    case "or":
      return c.any.some((sub) => evaluateCondition(state, sub));
    case "not":
      return !evaluateCondition(state, c.of);
  }
}

export function getQuestStatus(state: WorldStateData, questId: string): QuestStatus {
  const q = state.quests[questId];
  if (!q) return "none";
  return q.status;
}
