import type { DialogScene, NpcDef, QuestDef } from "../../types";
import type { ActivityDef } from "../activities";
import type { StoryOpponentSpec } from "../../story/types";

/** One content group: people, quests, dialogs and things to do for a few places. */
export interface PlaceContent {
  npcs: readonly NpcDef[];
  quests: readonly QuestDef[];
  scenes: readonly DialogScene[];
  activities: readonly ActivityDef[];
  /** Spar / quest foes, built like the story foes (opponents.ts). */
  opponents: readonly StoryOpponentSpec[];
}

export const EMPTY_PLACE_CONTENT: PlaceContent = { npcs: [], quests: [], scenes: [], activities: [], opponents: [] };
