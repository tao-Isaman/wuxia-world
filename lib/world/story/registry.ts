// Compiled story content: lineage quests, story saga chapters, their dialog
// scenes and cutscenes. Built once at module load from lib/world/data/story/.
import { ARTS_BY_ID } from "@/lib/game/data/arts";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import type { StatKey } from "@/lib/game";
import type { Condition, DialogScene, QuestDef } from "../types";
import { NPCS } from "../data/npcs";
import { getItem } from "../data/items";
import { OPPONENTS_BY_ID } from "../data/opponents";
import { SECT_MEMBERSHIPS } from "../data/sect-memberships";
import { LINEAGE_PROLOGUES, LINEAGE_SPECS, SAGA_PROLOGUES, STORY_ARC_SPECS } from "../data/story";
import { compileArc, compileLineage, type StoryResolvers } from "./compile";
import type { CutsceneDef, StoryArcInfo } from "./types";

const NPC_BY_ID = new Map(NPCS.map((n) => [n.id, n]));

/** The stat a skill or art leans on most (its largest bonus). */
function strongestStat(st: Partial<Record<StatKey, number>> | undefined): StatKey {
  let best: StatKey = "STR", value = -Infinity;
  for (const [key, v] of Object.entries(st ?? {}) as [StatKey, number][]) if (v > value) { best = key; value = v; }
  return best;
}

export const STORY_RESOLVERS: StoryResolvers = {
  npcName: (id) => NPC_BY_ID.get(id)?.name ?? id,
  npcHome: (id) => NPC_BY_ID.get(id)?.locationIds[0] ?? id,
  npcSpar: (id) => NPC_BY_ID.get(id)?.sparOpponentId,
  opponentName: (id) => OPPONENTS_BY_ID.get(id)?.name ?? id,
  itemName: (id) => getItem(id)?.name ?? id,
  martial(kind, id) {
    if (kind === "skill") {
      const s = SKILLS_BY_ID.get(id);
      return s ? { ti: s.ti, name: s.n, sc: s.sc, stat: strongestStat(s.st) } : null;
    }
    const a = ARTS_BY_ID.get(id);
    return a && a.id !== "none" ? { ti: a.ti, name: a.n, sc: a.sc, stat: strongestStat(a.stats) } : null;
  },
  sectByLabel(sc) {
    const def = Object.values(SECT_MEMBERSHIPS).find((d) => d?.name === sc);
    return def ? { id: def.id, startRank: def.startRank, topRank: def.topRank } : null;
  },
};

const quests: QuestDef[] = [];
const scenes: DialogScene[] = [];
const cutscenes: CutsceneDef[] = [];
const arcs: StoryArcInfo[] = [];
for (const raw of LINEAGE_SPECS) {
  // A lineage quest with a prologue trial (an older sect art quest) opens only after it.
  const trial = LINEAGE_PROLOGUES[raw.id];
  const done: Condition | undefined = trial ? { t: "questStatus", questId: trial, status: "done" } : undefined;
  const spec = done ? { ...raw, require: raw.require ? { t: "and" as const, all: [raw.require, done] } : done } : raw;
  const c = compileLineage(spec, STORY_RESOLVERS);
  quests.push(...c.quests); scenes.push(...c.scenes); cutscenes.push(...c.cutscenes);
}
for (const raw of STORY_ARC_SPECS) {
  // A saga with a prologue trial (an older sect art quest) opens only after it.
  const trial = SAGA_PROLOGUES[raw.reward.id];
  const spec = trial ? { ...raw, require: { t: "and" as const, all: [raw.require, { t: "questStatus" as const, questId: trial, status: "done" as const }] } } : raw;
  const c = compileArc(spec, STORY_RESOLVERS);
  quests.push(...c.quests); scenes.push(...c.scenes); cutscenes.push(...c.cutscenes); arcs.push(c.info);
}

export const STORY_QUESTS: readonly QuestDef[] = quests;
export const STORY_SCENES: readonly DialogScene[] = scenes;
export const CUTSCENES: readonly CutsceneDef[] = cutscenes;
export const STORY_ARCS: readonly StoryArcInfo[] = arcs;

const CUTSCENES_BY_ID = new Map(cutscenes.map((c) => [c.id, c]));
const ARCS_BY_ID = new Map(arcs.map((a) => [a.id, a]));
export function getCutscene(id: string | null | undefined): CutsceneDef | null { return (id && CUTSCENES_BY_ID.get(id)) || null; }
export function getStoryArc(id: string | null | undefined): StoryArcInfo | null { return (id && ARCS_BY_ID.get(id)) || null; }

/** One way into a sect's martial line: a lineage quest or a saga's first chapter. */
export interface SectLineageEntry {
  kind: "skill" | "art";
  id: string;
  /** The lineage quest, or the saga's first chapter. */
  questId: string;
  /** The saga, when this is a T4. */
  arcId?: string;
  /** The rank the quest needs (`sectRankAtLeast`), or null. */
  rank: number | null;
}

function rankGate(c: Condition | undefined): number | null {
  if (!c) return null;
  if (c.t === "sectRankAtLeast") return c.maxRank;
  if (c.t === "and") for (const sub of c.all) { const r = rankGate(sub); if (r !== null) return r; }
  return null;
}

const QUESTS_BY_ID = new Map(quests.map((q) => [q.id, q]));
const LINEAGE_BY_SECT = new Map<string, SectLineageEntry[]>();
for (const q of quests) {
  if (!q.lineage) continue;
  const info = STORY_RESOLVERS.martial(q.lineage.kind, q.lineage.id);
  if (!info) continue;
  LINEAGE_BY_SECT.set(info.sc, [...(LINEAGE_BY_SECT.get(info.sc) ?? []), { ...q.lineage, questId: q.id, rank: rankGate(q.prereqs) }]);
}
for (const a of arcs) {
  const first = QUESTS_BY_ID.get(a.questIds[0]);
  LINEAGE_BY_SECT.set(a.sc, [...(LINEAGE_BY_SECT.get(a.sc) ?? []), { ...a.reward, questId: a.questIds[0], arcId: a.id, rank: rankGate(first?.prereqs) }]);
}

/** Every lineage quest and saga of a sect (by its Thai label), in tier order. */
export function sectLineage(sc: string): readonly SectLineageEntry[] {
  const tier = (e: SectLineageEntry) => STORY_RESOLVERS.martial(e.kind, e.id)?.ti ?? 0;
  return [...(LINEAGE_BY_SECT.get(sc) ?? [])].sort((a, b) => tier(a) - tier(b) || (b.rank ?? 99) - (a.rank ?? 99));
}
