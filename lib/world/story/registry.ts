// Compiled story content: lineage quests, story saga chapters, their dialog
// scenes and cutscenes. Built once at module load from lib/world/data/story/.
import { ARTS_BY_ID } from "@/lib/game/data/arts";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import type { StatKey } from "@/lib/game";
import type { DialogScene, QuestDef } from "../types";
import { NPCS } from "../data/npcs";
import { getItem } from "../data/items";
import { OPPONENTS_BY_ID } from "../data/opponents";
import { SECT_MEMBERSHIPS } from "../data/sect-memberships";
import { LINEAGE_SPECS, SAGA_PROLOGUES, STORY_ARC_SPECS } from "../data/story";
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
for (const spec of LINEAGE_SPECS) {
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
