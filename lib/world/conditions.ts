import type { Condition, QuestStatus, WorldStateData } from "./types";
import { masteryLevel } from "./data/life-skills";

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
    case "defeatedOpponent": {
      const have = state.defeatedCounts[c.opponentId] ?? 0;
      return have >= (c.count ?? 1);
    }
    case "visitedLocation":
      return state.visitedLocationIds.includes(c.locationId);
    case "stoleFromNpc": {
      const have = state.stoleFromCounts[c.npcId] ?? 0;
      return have >= (c.count ?? 1);
    }
    case "assassinatedNpc":
      return state.assassinatedNpcIds.includes(c.npcId);
    case "kidnappedNpc":
      return state.kidnappedNpcIds.includes(c.npcId);
    case "gender":
      return state.gender === c.equals;
    case "sectMember":
      return state.sectMembership[c.sectId] != null;
    case "anySectMember":
      // Object.keys() is fine here — sectMembership is a small map
      // (≤ SECT_ID count) and only mutated on join / leave. We don't
      // care which sect, only "is the player affiliated with anything?"
      return Object.keys(state.sectMembership).length > 0;
    case "sectRankAtLeast": {
      const m = state.sectMembership[c.sectId];
      if (!m) return false;
      return m.rank <= c.maxRank;
    }
    case "goldAtLeast":
      return state.gold >= c.amount;
    case "learnedArt":
      return (state.playerBuild?.learnedArtIds ?? []).includes(c.artId);
    case "lifeSkillLevel":
      return masteryLevel(state.lifeSkillXp[c.skill] ?? 0) >= c.min;
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
