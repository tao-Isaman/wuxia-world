// Compiled story content: lineage quests, story saga chapters, their dialog
// scenes and cutscenes. Built once at module load from lib/world/data/story/.
import { ARTS_BY_ID } from "@/lib/game/data/arts";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import { WEAPON_FAMILY_LABEL } from "@/lib/game/data/weapons";
import type { StatKey } from "@/lib/game";
import type { Condition, DialogScene, QuestDef } from "../types";
import { NPCS } from "../data/npcs";
import { WORLD_MAP_SCENES } from "../data/world-map";
import { getItem } from "../data/items";
import { OPPONENTS_BY_ID } from "../data/opponents";
import { SECT_MEMBERSHIPS } from "../data/sect-memberships";
import { LINEAGE_PROLOGUES, LINEAGE_SPECS, MAIN_ARC, SAGA_PROLOGUES, STORY_ARC_SPECS } from "../data/story";
import { compileArc, compileLineage, type StoryResolvers } from "./compile";
import type { CutsceneDef, LineageSpec, StoryArcInfo } from "./types";

const NPC_BY_ID = new Map(NPCS.map((n) => [n.id, n]));

/** The stat a skill or art leans on most (its largest bonus). */
function strongestStat(st: Partial<Record<StatKey, number>> | undefined): StatKey {
  let best: StatKey = "STR", value = -Infinity;
  for (const [key, v] of Object.entries(st ?? {}) as [StatKey, number][]) if (v > value) { best = key; value = v; }
  return best;
}

const PLACE_NAMES = new Map(WORLD_MAP_SCENES.flatMap((s) => (s.kind === "location" ? [[s.id, s.name] as const] : [])));

export const STORY_RESOLVERS: StoryResolvers = {
  npcName: (id) => NPC_BY_ID.get(id)?.name ?? id,
  npcHome: (id) => NPC_BY_ID.get(id)?.locationIds[0] ?? id,
  placeName: (id) => PLACE_NAMES.get(id) ?? id,
  npcSpar: (id) => NPC_BY_ID.get(id)?.sparOpponentId,
  opponentName: (id) => OPPONENTS_BY_ID.get(id)?.name ?? id,
  itemName: (id) => getItem(id)?.name ?? id,
  martial(kind, id) {
    if (kind === "skill") {
      const s = SKILLS_BY_ID.get(id);
      return s ? { ti: s.ti, name: s.n, sc: s.sc, stat: strongestStat(s.st), family: WEAPON_FAMILY_LABEL[s.w] } : null;
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
const lessonsBy = new Map<string, number>();
// One lineage quest per sect, tier and kind: its moves are a choice made once at
// the hand-in (สายมีดสั้น or สายอาวุธลับ…). The first spec of the group gives the
// teacher, the trial and the lines; the rest only add their move to the choice.
const lineageGroups = new Map<string, LineageSpec[]>();
for (const raw of LINEAGE_SPECS) {
  const info = STORY_RESOLVERS.martial(raw.kind, raw.id);
  const key = `${info?.sc}|${info?.ti}|${raw.kind}`;
  lineageGroups.set(key, [...(lineageGroups.get(key) ?? []), raw]);
}
for (const group of lineageGroups.values()) {
  const raw = group[0];
  // A move with a prologue trial (an older sect art quest) keeps its tier's quest closed until it is done.
  const trials = [...new Set(group.map((g) => LINEAGE_PROLOGUES[g.id]).filter(Boolean))];
  const done: Condition[] = trials.map((questId) => ({ t: "questStatus", questId, status: "done" }));
  const extra = [...(raw.require ? [raw.require] : []), ...done];
  const spec = extra.length ? { ...raw, require: extra.length === 1 ? extra[0] : { t: "and" as const, all: extra } } : raw;
  const seq = (lessonsBy.get(raw.giver) ?? 0) + 1;
  lessonsBy.set(raw.giver, seq);
  const c = compileLineage(spec, STORY_RESOLVERS, seq, group.map((g) => g.id));
  quests.push(...c.quests); scenes.push(...c.scenes); cutscenes.push(...c.cutscenes);
}
// The main story first: its chapters chain from a new game.
if (MAIN_ARC.chapters.length) {
  const c = compileArc(MAIN_ARC, STORY_RESOLVERS);
  quests.push(...c.quests); scenes.push(...c.scenes); cutscenes.push(...c.cutscenes); arcs.push(c.info);
}
// A sect's sagas open over its last three ranks, in the order they are listed:
// the first at rank 3, the last at rank 1 (two: 3, 2 · four: 3, 3, 2, 1 · five:
// 3, 3, 2, 2, 1) — not all at once. Each saga's sectRankAtLeast gate is set here.
export const SAGA_RANK: ReadonlyMap<string, number> = (() => {
  const bySect = new Map<string, string[]>();
  for (const arc of STORY_ARC_SPECS) if (arc.sectId) bySect.set(arc.sectId, [...(bySect.get(arc.sectId) ?? []), arc.id]);
  const out = new Map<string, number>();
  for (const ids of bySect.values()) ids.forEach((id, i) => out.set(id, 3 - Math.floor((i * 3) / ids.length)));
  return out;
})();
const withSagaRank = (c: Condition, rank: number): Condition =>
  c.t === "and" ? { ...c, all: c.all.map((x) => withSagaRank(x, rank)) }
    : c.t === "sectRankAtLeast" ? { ...c, maxRank: rank } : c;

for (const raw0 of STORY_ARC_SPECS) {
  const rank = SAGA_RANK.get(raw0.id);
  const raw = rank ? { ...raw0, require: withSagaRank(raw0.require, rank) } : raw0;
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
  const { kind } = q.lineage;
  for (const id of q.lineage.options ?? [q.lineage.id]) {
    const info = STORY_RESOLVERS.martial(kind, id);
    if (!info) continue;
    LINEAGE_BY_SECT.set(info.sc, [...(LINEAGE_BY_SECT.get(info.sc) ?? []), { kind, id, questId: q.id, rank: rankGate(q.prereqs) }]);
  }
}
for (const a of arcs) {
  if (!a.reward) continue; // the main story belongs to no sect
  const first = QUESTS_BY_ID.get(a.questIds[0]);
  LINEAGE_BY_SECT.set(a.sc, [...(LINEAGE_BY_SECT.get(a.sc) ?? []), { ...a.reward, questId: a.questIds[0], arcId: a.id, rank: rankGate(first?.prereqs) }]);
}

/** The lineage quest that offers a move (alone, or as one of its tier's choices). */
export function lineageQuestOf(kind: "skill" | "art", id: string): string | null {
  return quests.find((q) => q.lineage?.kind === kind && (q.lineage.options ?? [q.lineage.id]).includes(id))?.id ?? null;
}

/** Every lineage quest and saga of a sect (by its Thai label), in tier order. */
export function sectLineage(sc: string): readonly SectLineageEntry[] {
  const tier = (e: SectLineageEntry) => STORY_RESOLVERS.martial(e.kind, e.id)?.ti ?? 0;
  return [...(LINEAGE_BY_SECT.get(sc) ?? [])].sort((a, b) => tier(a) - tier(b) || (b.rank ?? 99) - (a.rank ?? 99));
}

/** A sect's lineage quests (no sagas), one per tier and kind, in tier order. */
export interface SectLineageQuest {
  kind: "skill" | "art";
  /** The quest's first move (its teacher's line). */
  id: string;
  /** Every move the quest offers; more than one is a choice made once. */
  options: readonly string[];
  questId: string;
  rank: number | null;
}

export function sectLineageQuests(sc: string): readonly SectLineageQuest[] {
  const out: SectLineageQuest[] = [];
  for (const e of sectLineage(sc)) {
    if (e.arcId || out.some((q) => q.questId === e.questId)) continue;
    const lineage = QUESTS_BY_ID.get(e.questId)?.lineage;
    if (!lineage) continue;
    out.push({ kind: lineage.kind, id: lineage.id, options: lineage.options ?? [lineage.id], questId: e.questId, rank: e.rank });
  }
  return out;
}
