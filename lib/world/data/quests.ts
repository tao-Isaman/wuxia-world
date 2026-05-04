import type { QuestDef } from "../types";

// Quests table. Add new quests here. `stages` is an ordered list; the world
// state stores the current stage index per active quest.
export const QUESTS: readonly QuestDef[] = [
  {
    id: "first_steps",
    name: "ก้าวแรกสู่ยุทธภพ",
    description: "เรียนรู้โลกของยุทธภพและพิสูจน์ฝีมือ",
    stages: [
      { id: "talk_elder", description: "พูดคุยกับผู้อาวุโสในหมู่บ้าน" },
      { id: "defeat_thug", description: "ปราบโจรหน้าใหม่" },
      { id: "return", description: "กลับไปรายงานผู้อาวุโส" },
    ],
  },
];

export const QUESTS_BY_ID = new Map<string, QuestDef>(QUESTS.map((q) => [q.id, q]));

export function getQuest(id: string | null | undefined): QuestDef | null {
  if (!id) return null;
  return QUESTS_BY_ID.get(id) ?? null;
}
