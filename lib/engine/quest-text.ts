/**
 * Every quest's player-facing text and the moves it rewards, for the
 * engine's name checks (lib/engine/text-edit.ts). The engine loads this file
 * with a dynamic import, so the quest tables stay out of its first bundle.
 */
import { QUESTS } from "@/lib/world/data";
import type { QuestText } from "./text-edit";

export function questTexts(): QuestText[] {
  return QUESTS.map((quest) => ({
    id: quest.id,
    name: quest.name,
    texts: [quest.name, quest.description, quest.briefSummary ?? ""],
    skills: (quest.rewards ?? []).flatMap((r) => (r.t === "learnSkill" ? [r.skillId] : [])),
    arts: (quest.rewards ?? []).flatMap((r) => (r.t === "learnArt" ? [r.artId] : [])),
  }));
}
