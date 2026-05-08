import type { QuestDef } from "../types";
import { QUESTS_CITIES } from "./quests/cities";
import { QUESTS_VILLAGES } from "./quests/villages";
import { QUESTS_SECTS_TEMPLES } from "./quests/sects-temples";
import { QUESTS_WILDERNESS } from "./quests/wilderness";
import { QUESTS_EVIL } from "./quests/evil";

// ─── Quest registry ────────────────────────────────────────────────────
// Aggregator. Authors add new quests to one of the regional files under
// `lib/world/data/quests/` so the four regional content batches stay
// editable in parallel without merge conflicts.
//
// QuestDef.type defaults to "main" when omitted. Side quests must set
// `type: "side"` so they're filtered from the main-story flow and never
// re-offer once `done` or `failed`.

// Core / tutorial quest. Stays in this file since it predates the regional
// split (its dialog beats live in `lib/world/data/scenes.ts` core block).
const CORE_QUESTS: readonly QuestDef[] = [
  {
    id: "first_steps",
    name: "ก้าวแรกสู่ยุทธภพ",
    description: "เรียนรู้โลกของยุทธภพและพิสูจน์ฝีมือ",
    type: "main",
    stages: [
      { id: "talk_elder", description: "พูดคุยกับผู้อาวุโสในหมู่บ้าน" },
      { id: "defeat_thug", description: "ปราบโจรหน้าใหม่" },
      { id: "return", description: "กลับไปรายงานผู้อาวุโส" },
    ],
  },
];

export const QUESTS: readonly QuestDef[] = [
  ...CORE_QUESTS,
  ...QUESTS_CITIES,
  ...QUESTS_VILLAGES,
  ...QUESTS_SECTS_TEMPLES,
  ...QUESTS_WILDERNESS,
  ...QUESTS_EVIL,
];

export const QUESTS_BY_ID = new Map<string, QuestDef>(QUESTS.map((q) => [q.id, q]));

export function getQuest(id: string | null | undefined): QuestDef | null {
  if (!id) return null;
  return QUESTS_BY_ID.get(id) ?? null;
}

// All quests an NPC can offer or turn in. Used by the NPC popup to render
// quest buttons. Filters by `giverNpcId` (offers) and `turnInNpcId` (or
// giverNpcId when turn-in falls back to the giver). Cheap because the
// QUESTS table stays small (single-digit hundreds at most).
export function getQuestsForNpc(npcId: string): QuestDef[] {
  const out: QuestDef[] = [];
  for (const q of QUESTS) {
    if (q.giverNpcId === npcId) out.push(q);
    else if (q.turnInNpcId === npcId) out.push(q);
  }
  return out;
}
