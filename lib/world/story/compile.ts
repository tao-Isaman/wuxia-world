// Compile lineage and story specs (./types) into QuestDefs, dialog Scenes and
// cutscenes. Pure: every lookup it needs comes in through `StoryResolvers`,
// so this module imports no data registry (no import cycles).

import type { StatKey } from "@/lib/game";
import type { Choice, Condition, DialogScene, QuestDef, QuestReward, QuestStage, SceneEffect, SceneLine, SectId } from "../types";
import { scrollItemId } from "../data/items";
import type {
  CutsceneDef, CutsceneSpec, LineageSpec, MainArcSpec, StoryArcInfo, StoryArcSpec, StoryBeat, StoryLine, StoryStep,
} from "./types";

export interface StoryResolvers {
  npcName(id: string): string;
  /** The first place the NPC stands on a painted map. */
  npcHome(id: string): string;
  npcSpar(id: string): string | undefined;
  opponentName(id: string): string;
  itemName(id: string): string;
  /** Tier, Thai name, sect label and strongest stat of a skill or art. */
  martial(kind: "skill" | "art", id: string): { ti: number; name: string; sc: string; stat: StatKey } | null;
  /** The joinable sect with this label, with its rank ladder. */
  sectByLabel(sc: string): { id: SectId; startRank: number; topRank: number } | null;
}

export interface CompiledStory {
  quests: QuestDef[];
  scenes: DialogScene[];
  cutscenes: CutsceneDef[];
}

const DEFAULT_GO = "ก้าวต่อไป";
/** Lines per page before a long story dialog pages. */
const PAGE_THRESHOLD = 4;

export function toSceneLines(lines: readonly StoryLine[]): SceneLine[] {
  return lines.map((line) => typeof line === "string" ? { t: "narration", text: line } : { t: "dialogue", speaker: line[0], text: line[1] });
}

/**
 * Emit the dialog for a beat. `effects` and `next` are what moving on does;
 * asides branch to a one-line reaction that then does the same.
 */
// The offer's way out: the hero walks off and the quest stays on offer.
export const DECLINE_TEXT = "ขอปฏิเสธไว้ก่อน";

function beatScenes(id: string, beat: StoryBeat, effects: SceneEffect[], next: string, out: CompiledStory, cutsceneId: string, label: string, arcId?: string, declinable = false): void {
  const go: Choice = { text: beat.go ?? DEFAULT_GO, next, ...(effects.length ? { effects } : {}) };
  const decline: Choice[] = declinable ? [{ text: DECLINE_TEXT, next }] : [];
  const choices: Choice[] = [go];
  (beat.asides ?? []).forEach((aside, index) => {
    const asideId = `${id}_a${index + 1}`;
    choices.push({ text: aside.say, next: asideId });
    out.scenes.push({ kind: "dialog", id: asideId, lines: toSceneLines(aside.reply), choices: [{ ...go }, ...decline], paged: aside.reply.length > PAGE_THRESHOLD });
  });
  choices.push(...decline);
  const scene: DialogScene = { kind: "dialog", id, lines: toSceneLines(beat.lines), choices, paged: beat.lines.length > PAGE_THRESHOLD };
  if (beat.cutscene) {
    scene.cutscene = cutsceneId;
    out.cutscenes.push(cutscene(cutsceneId, beat.cutscene, label, arcId));
  }
  out.scenes.push(scene);
}

function cutscene(id: string, spec: CutsceneSpec, label: string, arcId?: string): CutsceneDef {
  return { ...spec, id, label, ...(arcId ? { arcId } : {}) };
}

// Not offered while the hero still carries the move's unread คัมภีร์.
const notHolding = (kind: "skill" | "art", id: string): Condition => ({ t: "not", of: { t: "hasItem", itemId: scrollItemId(kind, id), count: 1 } });

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Story sagas ──────────────────────────────────────────────────────

export function storyQuestId(arcId: string, chapter: number): string { return `st_${arcId}_${pad(chapter)}`; }

/** The main story's label in the quest log (where a saga shows its sect). */
export const MAIN_STORY_LABEL = "เนื้อเรื่องหลัก";

export function compileArc(arc: StoryArcSpec | MainArcSpec, r: StoryResolvers): CompiledStory & { info: StoryArcInfo } {
  const out: CompiledStory = { quests: [], scenes: [], cutscenes: [] };
  const saga = "reward" in arc ? arc : null;
  const total = arc.chapters.length;
  arc.chapters.forEach((chapter, index) => {
    const n = index + 1;
    const qid = storyQuestId(arc.id, n);
    const home = r.npcHome(chapter.giver);
    const label = `${arc.title} · บทที่ ${n}`;
    const stages: QuestStage[] = [];
    chapter.steps.forEach((step, s) => {
      const stageId = `s${s + 1}`;
      const sceneId = `st_${qid}_${stageId}`;
      stages.push(compileStep(step, stageId, sceneId, qid, out, r, label, arc.id));
    });
    stages.push({ id: "return", description: `กลับไปหา${r.npcName(chapter.giver)}` });

    const gates: Condition[] = n > 1 ? [{ t: "questStatus", questId: storyQuestId(arc.id, n - 1), status: "done" }]
      : saga ? [saga.require, { t: "not", of: saga.reward.kind === "skill" ? { t: "learnedSkill", skillId: saga.reward.id } : { t: "learnedArt", artId: saga.reward.id } }, notHolding(saga.reward.kind, saga.reward.id)]
      : [];
    if (chapter.require) gates.push(chapter.require);
    const rewards: QuestReward[] = [...chapter.reward];
    if (n === total && saga) {
      rewards.push(saga.reward.kind === "skill"
        ? { t: "learnSkill", skillId: saga.reward.id }
        : { t: "learnArt", artId: saga.reward.id, level: saga.reward.level ?? 3 });
    }
    out.quests.push({
      id: qid,
      name: `${arc.title} · บทที่ ${n}: ${chapter.title}`,
      description: chapter.summary,
      briefSummary: `${saga ? "ตำนาน" : MAIN_STORY_LABEL} ${n}/${total} — ${chapter.title}`,
      type: saga ? "story" : "main",
      story: { arcId: arc.id, chapter: n },
      giverNpcId: chapter.giver,
      prereqs: gates.length === 1 ? gates[0] : { t: "and", all: gates },
      stages,
      rewards,
    });
    beatScenes(`qs_${qid}_offer`, chapter.offer, [{ t: "startQuest", questId: qid }], home, out, `cs_${qid}_offer`, `${label} — ${chapter.title}`, arc.id, true);
    beatScenes(`qs_${qid}_complete`, chapter.complete, [{ t: "finishQuest", questId: qid, success: true }], home, out, `cs_${qid}_complete`, `${label} — ปิดบท`, arc.id);
  });
  const info: StoryArcInfo = {
    id: arc.id, title: arc.title, tagline: arc.tagline,
    ...(saga ? { sc: saga.sc, reward: { kind: saga.reward.kind, id: saga.reward.id }, ...(saga.sectId ? { sectId: saga.sectId } : {}) } : { sc: MAIN_STORY_LABEL, main: true }),
    questIds: arc.chapters.map((_, i) => storyQuestId(arc.id, i + 1)),
    chapterTitles: arc.chapters.map((c) => c.title),
    cutsceneIds: out.cutscenes.map((c) => c.id),
  };
  return { ...out, info };
}

function compileStep(step: StoryStep, stageId: string, sceneId: string, qid: string, out: CompiledStory, r: StoryResolvers, label: string, arcId: string): QuestStage {
  const advance: SceneEffect = { t: "advanceQuest", questId: qid };
  switch (step.t) {
    case "visit":
      beatScenes(sceneId, step.scene, [advance], step.locationId, out, `cs_${sceneId}`, `${label} — ${step.label}`, arcId);
      return { id: stageId, description: step.hint, objective: { spots: [{ locationId: step.locationId, label: step.label, sceneId }] } };
    case "talk":
      beatScenes(sceneId, step.scene, [advance], step.locationId, out, `cs_${sceneId}`, `${label} — ${step.label}`, arcId);
      return { id: stageId, description: step.hint, objective: { spots: [{ locationId: step.locationId, npcId: step.npcId, label: step.label, sceneId }] } };
    case "duel": {
      const winId = `${sceneId}_win`;
      // Win → the after-scene advances; a loss drops back on the map with the spot still open.
      beatScenes(sceneId, step.before, [{ t: "triggerBattle", opponentId: step.opponentId, onWin: winId, onLose: step.locationId, nonFatal: true }], step.locationId, out, `cs_${sceneId}`, `${label} — ${step.label}`, arcId);
      beatScenes(winId, step.after, [advance], step.locationId, out, `cs_${winId}`, `${label} — ${step.label} (ชนะ)`, arcId);
      return { id: stageId, description: step.hint, objective: { spots: [{ locationId: step.locationId, label: step.label, sceneId }] } };
    }
    case "hunt":
      return { id: stageId, description: step.hint, autoAdvance: { t: "defeatedOpponent", opponentId: step.opponentId, count: step.count } };
    case "gather":
      return { id: stageId, description: step.hint, autoAdvance: { t: "hasItem", itemId: step.itemId, count: step.count } };
    case "trait":
      return { id: stageId, description: step.hint, autoAdvance: { t: "trait", trait: step.trait, min: step.min } };
    case "stat":
      return { id: stageId, description: step.hint, autoAdvance: { t: "statAtLeast", stat: step.stat, min: step.min } };
  }
}

// ─── Lineage quests ───────────────────────────────────────────────────

export const TIER_LABEL = ["พื้นฐาน", "ขั้นกลาง", "ขั้นสูง", "ลับ", "เฉพาะ", "ปรมัตถ์"] as const;

/** Difficulty by tier: gates and task sizes. */
export const LINEAGE_TIERS = [
  { rankFrac: 0, stat: 0, foes: 2, items: 0, spar: false, wExp: 60, points: 20, foe: "thug", item: "herb" },
  { rankFrac: 0.25, stat: 10, foes: 3, items: 2, spar: false, wExp: 120, points: 40, foe: "bandit", item: "herb" },
  { rankFrac: 0.5, stat: 15, foes: 3, items: 3, spar: true, wExp: 200, points: 60, foe: "bandit_lieutenant", item: "iron_ore" },
  { rankFrac: 0.75, stat: 25, foes: 4, items: 2, spar: true, wExp: 320, points: 100, foe: "blade_master", item: "ginseng" },
] as const;

/** Gate for sects the hero cannot join: a trait or life skill that fits their way. */
const OUTSIDER_GATES: Record<string, (tier: number) => Condition | null> = {
  "สำนักดาวดึงส์": (ti) => ti ? { t: "trait", trait: "evil", min: [0, 10, 20, 30][ti] } : null,
  "สำนักดาบโลหิต": (ti) => ti ? { t: "trait", trait: "evil", min: [0, 10, 25, 40][ti] } : null,
  "พรรคเบญจพิษ": (ti) => ti ? { t: "lifeSkillLevel", skill: "venom", min: ti } : null,
};

export function lineageQuestId(spec: Pick<LineageSpec, "kind" | "id">): string { return `ql_${spec.kind}_${spec.id}`; }

export function compileLineage(spec: LineageSpec, r: StoryResolvers, seq = 1): CompiledStory {
  const out: CompiledStory = { quests: [], scenes: [], cutscenes: [] };
  const info = r.martial(spec.kind, spec.id);
  if (!info) throw new Error(`lineage: unknown ${spec.kind} ${spec.id}`);
  if (info.ti > 3) throw new Error(`lineage: ${spec.id} is T${info.ti}; T4 items get a story saga`);
  const tier = LINEAGE_TIERS[info.ti];
  const qid = lineageQuestId(spec);
  const home = r.npcHome(spec.giver);
  const learned: Condition = spec.kind === "skill" ? { t: "learnedSkill", skillId: spec.id } : { t: "learnedArt", artId: spec.id };
  const gates: Condition[] = [{ t: "not", of: learned }, notHolding(spec.kind, spec.id)];
  const sect = r.sectByLabel(info.sc);
  if (sect) {
    gates.push({ t: "sectMember", sectId: sect.id }, { t: "sectStatus", sectId: sect.id, status: "active" });
    const rank = Math.round(sect.startRank - (sect.startRank - sect.topRank) * tier.rankFrac);
    if (rank < sect.startRank) gates.push({ t: "sectRankAtLeast", sectId: sect.id, maxRank: rank });
  } else {
    const gate = OUTSIDER_GATES[info.sc]?.(info.ti);
    if (gate) gates.push(gate);
  }
  if (tier.stat) gates.push({ t: "statAtLeast", stat: info.stat, min: tier.stat });
  if (spec.require) gates.push(spec.require);

  const foe = spec.foe ?? tier.foe;
  const item = spec.item ?? tier.item;
  const stages: QuestStage[] = [
    { id: "prove", description: `พิสูจน์ฝีมือ — ออกไปปราบ${r.opponentName(foe)}ให้ได้ ${tier.foes} ครั้ง`, autoAdvance: { t: "defeatedOpponent", opponentId: foe, count: tier.foes } },
  ];
  if (tier.items) stages.push({ id: "bring", description: `หา${r.itemName(item)} ${tier.items} ชิ้นติดตัวไว้เป็นเครื่องคำนับ (มอบให้ตอนรับวิชา)`, autoAdvance: { t: "hasItem", itemId: item, count: tier.items } });
  const spar = tier.spar ? r.npcSpar(spec.giver) : undefined;
  if (spar) stages.push({ id: "spar", description: `ไปหา${r.npcName(spec.giver)} กด "ขอประลอง" แล้วเอาชนะให้ได้`, autoAdvance: { t: "defeatedOpponent", opponentId: spar, count: 1 } });
  stages.push({ id: "return", description: `กลับไปหา${r.npcName(spec.giver)}เพื่อรับคัมภีร์` });

  const rewards: QuestReward[] = [
    spec.kind === "skill" ? { t: "learnSkill", skillId: spec.id } : { t: "learnArt", artId: spec.id, level: 1 },
    { t: "wExp", amount: tier.wExp },
    { t: "npcRelationship", npcId: spec.giver, amount: 3 + info.ti * 2 },
  ];
  if (sect) rewards.push({ t: "sectPoints", sectId: sect.id, amount: tier.points });
  const kindLabel = spec.kind === "skill" ? "วิชา" : "ลมปราณ";
  // The task in one breath for the quest log: what to beat, bring and win.
  const tasks = [`ปราบ${r.opponentName(foe)} ${tier.foes} ครั้ง`];
  if (tier.items) tasks.push(`หา${r.itemName(item)} ${tier.items} ชิ้น`);
  if (spar) tasks.push(`แล้วชนะการประลองกับท่าน`);
  out.quests.push({
    id: qid,
    // The quest never names the move or its tier — only "วิชาลึกลับ"; the
    // scroll it hands over names it. `seq` tells one teacher's quests apart.
    name: spec.title ?? `สืบทอดวิชาลึกลับของ${r.npcName(spec.giver)}${seq > 1 ? ` · ม้วนที่ ${seq}` : ""}`,
    description: `${r.npcName(spec.giver)}แห่ง${info.sc}จะถ่ายทอด${kindLabel}ลึกลับให้ เมื่อพิสูจน์ตนได้: ${tasks.join(" ")} — สำเร็จแล้วจะได้รับคัมภีร์ของวิชานั้น`,
    briefSummary: `สืบทอด${kindLabel}ลึกลับ — ${r.npcName(spec.giver)}`,
    type: "side",
    lineage: { kind: spec.kind, id: spec.id },
    giverNpcId: spec.giver,
    prereqs: { t: "and", all: gates },
    stages,
    rewards,
  });
  beatScenes(`qs_${qid}_offer`, { lines: spec.offer, go: "รับคำ" }, [{ t: "startQuest", questId: qid }], home, out, `cs_${qid}`, "วิชาลึกลับ", undefined, true);
  beatScenes(`qs_${qid}_complete`, { lines: spec.complete, go: "คารวะอาจารย์" }, [{ t: "finishQuest", questId: qid, success: true }], home, out, `cs_${qid}_done`, info.name);
  return out;
}
