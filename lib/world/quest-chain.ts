import type { Condition, QuestDef, WorldStateData } from "./types";
import { QUESTS, getQuest } from "./data/quests";
import { getNpc } from "./data/npcs";
import { getScene } from "./data/scenes";
import { STORY_ARCS } from "./story/registry";
import { describeQuestCondition } from "./effects";
import { npcPlaces, questHolder } from "./npc-life";
import { pathBetween } from "./quest-guide";

/** The quest that follows `questId` and how to get it: who offers it, where they stand, what still blocks it. */
export interface ChainNext {
  quest: QuestDef;
  /** Already accepted (or done) — nothing to look for. */
  taken: boolean;
  giverName: string | null;
  locationId: string | null;
  locationName: string | null;
  /** Road legs from the hero, or null when there is no path. */
  legs: number | null;
  /** A sect quest is taken from the สำนัก window, not from a person. */
  fromSectWindow: boolean;
  /** Unmet conditions of its offer, as quest-log labels. */
  gates: string[];
}

const needsDone = (c: Condition | undefined, questId: string): boolean => {
  if (!c) return false;
  if (c.t === "and") return c.all.some((x) => needsDone(x, questId));
  if (c.t === "or") return c.any.some((x) => needsDone(x, questId));
  return c.t === "questStatus" && c.questId === questId && c.status === "done";
};

// Quests that open when another is done, by that quest's id (built once).
let followers: Map<string, QuestDef[]> | null = null;
function followersOf(questId: string): QuestDef[] {
  if (!followers) {
    followers = new Map();
    for (const arc of STORY_ARCS) arc.questIds.forEach((id, i) => {
      const next = getQuest(arc.questIds[i + 1]);
      if (next) followers!.set(id, [next]);
    });
    for (const q of QUESTS) {
      const walk = (c: Condition | undefined): string[] => !c ? [] : c.t === "and" ? c.all.flatMap(walk) : c.t === "or" ? c.any.flatMap(walk)
        : c.t === "questStatus" && c.status === "done" ? [c.questId] : [];
      for (const before of walk(q.prereqs)) {
        if (followers.get(before)?.some((x) => x.id === q.id)) continue;
        if (!needsDone(q.prereqs, before)) continue;
        followers.set(before, [...(followers.get(before) ?? []), q]);
      }
    }
  }
  return followers.get(questId) ?? [];
}

/** What comes after `questId` (a saga's next chapter, the main story's, or a quest it unlocks). */
export function chainNext(state: WorldStateData, questId: string): ChainNext[] {
  return followersOf(questId).map((quest) => {
    const taken = !!state.quests[quest.id];
    const fromSectWindow = !!quest.sectId && !quest.giverNpcId;
    const giver = getNpc(questHolder(state, quest.giverNpcId) ?? quest.giverNpcId);
    const places = giver ? npcPlaces(state, giver) : [];
    const here = state.currentSceneId;
    const scored = places.map((id) => ({ id, path: here ? (id === here ? [here] : pathBetween(here, id)) : null }))
      .sort((a, b) => (a.path?.length ?? 99) - (b.path?.length ?? 99));
    const best = scored[0];
    const location = best ? getScene(best.id) : null;
    const gates = taken ? [] : describeQuestCondition(state, quest.prereqs ?? { t: "and", all: [] })
      .filter((line) => !line.done && !line.negated && !(line.label ?? "").includes(questId))
      .map((line) => line.label);
    return {
      quest, taken, fromSectWindow, gates,
      giverName: giver?.name ?? null,
      locationId: best?.id ?? null,
      locationName: location?.kind === "location" ? location.name : null,
      legs: best?.path ? best.path.length - 1 : null,
    };
  });
}
