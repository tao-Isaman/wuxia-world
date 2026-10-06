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

// Quests by the person who gives them and the person who takes them in
// (both, when they differ), and by sect — in QUESTS order, built once. The
// map view asks for every person on the map on every render.
type QuestIndexKey = string | null | undefined;
const QUESTS_BY_NPC = new Map<QuestIndexKey, QuestDef[]>();
const QUESTS_BY_SECT = new Map<QuestIndexKey, QuestDef[]>();
function indexQuest(index: Map<QuestIndexKey, QuestDef[]>, key: QuestIndexKey, q: QuestDef): void {
  const list = index.get(key);
  if (list) list.push(q); else index.set(key, [q]);
}
for (const q of QUESTS) {
  indexQuest(QUESTS_BY_NPC, q.giverNpcId, q);
  if (q.turnInNpcId !== q.giverNpcId) indexQuest(QUESTS_BY_NPC, q.turnInNpcId, q);
  indexQuest(QUESTS_BY_SECT, q.sectId, q);
}

// All quests an NPC can offer or turn in. Used by the NPC popup to render
// quest buttons. Matches `giverNpcId` (offers) or `turnInNpcId`. Returns a
// fresh array the caller may change.
export function getQuestsForNpc(npcId: string): QuestDef[] {
  return QUESTS_BY_NPC.get(npcId)?.slice() ?? [];
}

// All quests tagged with a sect id. Used by the sect popup to enumerate
// repeatable + art quests. Does NOT include the gateway intro quest (which
// has no sectId — it's a one-shot side quest in the NPC popup).
export function getQuestsForSect(sectId: string): QuestDef[] {
  return QUESTS_BY_SECT.get(sectId)?.slice() ?? [];
}
