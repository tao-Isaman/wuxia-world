import type { Condition, QuestDef, QuestStage } from "../types";
import { QUESTS_CITIES } from "./quests/cities";
import { QUESTS_VILLAGES } from "./quests/villages";
import { QUESTS_SECTS_TEMPLES } from "./quests/sects-temples";
import { QUESTS_WILDERNESS } from "./quests/wilderness";
import { QUESTS_EVIL } from "./quests/evil";
import { QUESTS_SPIES } from "./quests/spies";
import { STORY_QUESTS } from "../story/registry";
import { PLACE_QUESTS } from "./places";
import { LINEAGE_PROLOGUES, SAGA_PROLOGUES } from "./story";
import { scaleMoveStat } from "./move-gates";
import { meridianChartItemsForQuest } from "../meridians";

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

// ─── Stat gates on the way to a move ───────────────────────────────────
// Lineage quests, saga chapters (not the main story), the sect trials that
// open them and quests that teach a move have every stat gate scaled by
// MOVE_STAT_GATE_SCALE (./move-gates). A stat stage's hint has its number
// rewritten to match.
const scaleStat = scaleMoveStat;
const PROLOGUE_QUESTS = new Set([...Object.values(SAGA_PROLOGUES), ...Object.values(LINEAGE_PROLOGUES)]);

function scaleGate(c: Condition): Condition {
  switch (c.t) {
    case "statAtLeast": return { ...c, min: scaleStat(c.min) };
    case "and": return { ...c, all: c.all.map(scaleGate) };
    case "or": return { ...c, any: c.any.map(scaleGate) };
    case "not": return { ...c, of: scaleGate(c.of) };
    default: return c;
  }
}

function scaleStage(stage: QuestStage): QuestStage {
  const a = stage.autoAdvance;
  if (!a) return stage;
  const scaled = scaleGate(a);
  if (scaled === a) return stage;
  // "…ให้ถึง 80" → "…ให้ถึง 40" when the stage is a single stat gate.
  const description = a.t === "statAtLeast" && scaled.t === "statAtLeast"
    ? stage.description.replace(new RegExp(`(^|[^0-9])${a.min}(?![0-9])`, "g"), `$1${scaled.min}`)
    : stage.description;
  return { ...stage, autoAdvance: scaled, description };
}

/** True for quests on the way to a move (see MOVE_STAT_GATE_SCALE). */
export function isMoveQuest(q: QuestDef): boolean {
  if (q.lineage || PROLOGUE_QUESTS.has(q.id)) return true;
  if (q.story && q.type !== "main") return true;
  return (q.rewards ?? []).some((r) => r.t === "learnSkill" || r.t === "learnArt");
}

function scaleMoveQuest(q: QuestDef): QuestDef {
  if (!isMoveQuest(q)) return q;
  return { ...q, ...(q.prereqs ? { prereqs: scaleGate(q.prereqs) } : {}), stages: q.stages.map(scaleStage) };
}

export const QUESTS: readonly QuestDef[] = [
  ...CORE_QUESTS,
  ...QUESTS_CITIES,
  ...QUESTS_VILLAGES,
  ...QUESTS_SECTS_TEMPLES,
  ...QUESTS_WILDERNESS,
  ...QUESTS_EVIL,
  ...QUESTS_SPIES,
  // Sect lineage quests and story saga chapters (lib/world/data/story).
  ...STORY_QUESTS,
  ...PLACE_QUESTS,
].map(scaleMoveQuest).map(withMeridianCharts);

/** Meridian charts whose source table names this quest join its rewards. */
function withMeridianCharts(q: QuestDef): QuestDef {
  const items = meridianChartItemsForQuest(q.id)
    .filter((itemId) => !(q.rewards ?? []).some((r) => r.t === "item" && r.itemId === itemId));
  if (items.length === 0) return q;
  return { ...q, rewards: [...(q.rewards ?? []), ...items.map((itemId) => ({ t: "item" as const, itemId }))] };
}

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

// All quests tagged with a sect id. Used by the sect popup to enumerate
// repeatable + art quests. Does NOT include the gateway intro quest (which
// has no sectId — it's a one-shot side quest in the NPC popup).
export function getQuestsForSect(sectId: string): QuestDef[] {
  const out: QuestDef[] = [];
  for (const q of QUESTS) if (q.sectId === sectId) out.push(q);
  return out;
}
