// Sect lineage quests (T0–T3) and story sagas (T4): coverage, references,
// difficulty, cutscenes, and a play-through of every quest in the real store.
//
//   bun run test:story                    # everything
//   STORY_SECT=อู่ตัง bun run test:story   # one sect's content (writers' loop)
//
// Content lives in lib/world/data/story/; the format is lib/world/story/types.ts.
import assert from "node:assert/strict";
import { SKILLS } from "../lib/game/data/skills";
import { ARTS } from "../lib/game/data/arts";
import { CHARACTER_IDS, CREATURE_FRAME_COUNT } from "../lib/characters/catalog";
import { LINEAGE_SPECS, MAIN_ARC, SAGA_PROLOGUES, STORY_ARC_SPECS } from "../lib/world/data/story";
import { isQuestOfferable, isSecretSectQuest } from "../lib/world/effects";
import { CUTSCENES, STORY_ARCS, STORY_QUESTS, STORY_RESOLVERS } from "../lib/world/story/registry";
import { DECLINE_TEXT, lineageQuestId, storyQuestId, LINEAGE_TIERS } from "../lib/world/story/compile";
import type { CutsceneSpec, StoryBeat, StoryLine, StoryStep } from "../lib/world/story/types";
import { getNpc, getOpponent, getItem, getScene, getQuest, SHOPS, RESOURCES, RECIPES, OPPONENTS, QUESTS, SCENES, ITEMS, SECT_HALLS, SCROLL_PREFIX, scrollItemId } from "../lib/world/data";
import { FIGHT_EVENTS } from "../lib/world/data/random-events";
import { getLocationMap } from "../lib/world/data/location-maps";
import { WORLD_COORDS } from "../lib/world/data/world-coords";
import { SECT_MEMBERSHIPS } from "../lib/world/data/sect-memberships";
import { evaluateCondition } from "../lib/world/conditions";
import type { Condition, QuestDef, QuestReward, WorldStateData } from "../lib/world/types";

const ONLY = process.env.STORY_SECT;
const errors: string[] = [];
const err = (msg: string) => errors.push(msg);
let passed = 0;
function check(name: string, fn: () => void) {
  const before = errors.length;
  try { fn(); } catch (e) { err(`${name}: ${e instanceof Error ? e.message : e}`); }
  if (errors.length === before) { passed++; console.log(`PASS ${name}`); } else console.log(`FAIL ${name}`);
}

const SECT_SKILLS = SKILLS.filter((s) => s.sc !== "ยุทธจักร" && !s.id.startsWith("bst_"));
const SECT_ARTS = ARTS.filter((a) => a.id !== "none" && a.sc !== "ยุทธจักร");
const ITEMS_TEXT = JSON.stringify([SHOPS, RESOURCES.map((r) => r.yields), RECIPES.map((r) => r.output), OPPONENTS.map((o) => o.drops ?? [])]);
const obtainable = (itemId: string) => ITEMS_TEXT.includes(`"${itemId}"`);
const roaming = new Set([...FIGHT_EVENTS.map((e) => e.opponentId), ...RESOURCES.flatMap((r) => r.opponentIds ?? [])]);
const inScope = (sc: string) => !ONLY || sc === ONLY;
const lineOk = (line: StoryLine) => typeof line === "string" ? line.trim().length > 0 : line[0].trim().length > 0 && line[1].trim().length > 0;
/** A place on the world map, with a map of its own (the auto-map builder also answers off-world ids such as the legacy "village"); the jail is reached by arrest. */
const placeMap = (id: string) => getScene(id)?.kind === "location" && (WORLD_COORDS[id] || id === "jail") ? getLocationMap(id) : undefined;
const standsAt = (npcId: string, locationId: string) => !!placeMap(locationId)?.npcSpots?.[npcId] && !!getNpc(npcId)?.locationIds.includes(locationId);

const JIANGHU = "ยุทธจักร";
/** The main story's last chapter: every jianghu saga waits for it. */
const MAIN_LAST = storyQuestId(MAIN_ARC.id, MAIN_ARC.chapters.length);
/**
 * Saga size and difficulty. A sect T4 saga: 8–10 chapters, 4 films. A jianghu
 * saga has no sect to vouch for the hero, so it is twice as long and hard (T4:
 * 16–20 chapters, 8 films, 8 duels, gate stat ≥ 80) and a jianghu T5 twice that
 * again (32–40 chapters, 16 films, 16 duels, gate stat ≥ 120). Both need the
 * main story finished.
 */
function sagaRule(arc: { sc: string }, ti: number) {
  if (arc.sc !== JIANGHU) return { chapters: [8, 10], films: 4, duels: 0, stat: 0 } as const;
  return ti >= 5 ? { chapters: [32, 40], films: 16, duels: 16, stat: 120 } as const : { chapters: [16, 20], films: 8, duels: 8, stat: 80 } as const;
}
function gateLeaves(c: Condition | undefined): Condition[] {
  if (!c) return [];
  return c.t === "and" ? c.all.flatMap(gateLeaves) : [c];
}
function checkJianghuGate(where: string, arc: { require: Condition }, rule: { stat: number }) {
  const leaves = gateLeaves(arc.require);
  if (leaves.some((l) => l.t === "sectMember" || l.t === "sectRankAtLeast" || l.t === "anySectMember")) err(`${where}: a jianghu saga asks for no sect`);
  if (!leaves.some((l) => l.t === "questStatus" && l.questId === MAIN_LAST && l.status === "done")) err(`${where}: needs the main story finished (${MAIN_LAST} done)`);
  const stat = Math.max(0, ...leaves.map((l) => l.t === "statAtLeast" ? l.min : 0));
  if (stat < rule.stat) err(`${where}: gate stat ${stat} (at least ${rule.stat})`);
}

check("coverage: every jianghu T4 / T5 move has exactly one saga", () => {
  if (ONLY && ONLY !== JIANGHU) return;
  const moves = [...SKILLS.filter((x) => x.sc === JIANGHU && x.ti >= 4).map((x) => ({ kind: "skill", id: x.id, n: x.n })),
    ...ARTS.filter((x) => x.sc === JIANGHU && x.ti >= 4).map((x) => ({ kind: "art", id: x.id, n: x.n }))];
  for (const m of moves) {
    const by = STORY_ARC_SPECS.filter((a) => a.reward.kind === m.kind && a.reward.id === m.id);
    if (by.length !== 1) err(`jianghu ${m.kind} ${m.id} ${m.n}: ${by.length} sagas (needs exactly 1)`);
  }
});

check("coverage: every sect skill and art has exactly one way in — a lineage quest (T0–T3) or a story saga (T4)", () => {
  const grants = new Map<string, string[]>();
  for (const l of LINEAGE_SPECS) grants.set(`${l.kind}:${l.id}`, [...(grants.get(`${l.kind}:${l.id}`) ?? []), lineageQuestId(l)]);
  for (const a of STORY_ARC_SPECS) grants.set(`${a.reward.kind}:${a.reward.id}`, [...(grants.get(`${a.reward.kind}:${a.reward.id}`) ?? []), a.id]);
  const items = [...SECT_SKILLS.map((s) => ({ kind: "skill", id: s.id, ti: s.ti, sc: s.sc, n: s.n })), ...SECT_ARTS.map((a) => ({ kind: "art", id: a.id, ti: a.ti, sc: a.sc, n: a.n }))];
  const missing: string[] = [];
  for (const it of items.filter((i) => inScope(i.sc))) {
    const by = grants.get(`${it.kind}:${it.id}`) ?? [];
    if (!by.length) missing.push(`${it.sc} T${it.ti} ${it.kind} ${it.id} ${it.n}`);
    if (by.length > 1) err(`${it.kind} ${it.id} is granted by ${by.join(", ")}`);
    const viaStory = STORY_ARC_SPECS.some((a) => a.reward.id === it.id && a.reward.kind === it.kind);
    if (by.length && it.ti === 4 && !viaStory) err(`${it.id} is T4 and must come from a story saga`);
    if (by.length && it.ti < 4 && viaStory) err(`${it.id} is T${it.ti}; sagas are for T4`);
  }
  if (missing.length) err(`${missing.length} sect items with no quest:\n    ${missing.join("\n    ")}`);
  for (const l of LINEAGE_SPECS) if (!items.some((i) => i.kind === l.kind && i.id === l.id)) err(`lineage ${l.id}: not a sect ${l.kind}`);
});

check("one way only: no other quest, dialog, manual or hall teaches a sect skill or art", () => {
  const sectItem = new Set([...SECT_SKILLS.map((x) => `skill:${x.id}`), ...SECT_ARTS.map((x) => `art:${x.id}`)]);
  const teach = (where: string, node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach((n) => teach(where, n)); return; }
    const o = node as Record<string, unknown>;
    const key = o.t === "learnSkill" || o.t === "manualLearnSkill" ? `skill:${o.skillId}` : o.t === "learnArt" || o.t === "manualLearnArt" ? `art:${o.artId}` : null;
    if (key && sectItem.has(key)) err(`${where} teaches ${key} — sect items come only from their lineage quest or saga`);
    for (const v of Object.values(o)) if (v && typeof v === "object") teach(where, v);
  };
  for (const q of QUESTS) if (!q.lineage && !q.story) teach(`quest ${q.id}`, q.rewards);
  for (const sc of SCENES) teach(`scene ${sc.id}`, sc);
  // A quest's คัมภีร์ is how its own reward arrives; nothing else may hand one out.
  for (const it of ITEMS) if (!it.id.startsWith(SCROLL_PREFIX)) teach(`item ${it.id}`, it);
  const scrollRefs = JSON.stringify([QUESTS.map((q) => q.rewards), SCENES, SHOPS, RESOURCES, RECIPES, OPPONENTS, SECT_HALLS]).match(new RegExp(`"${SCROLL_PREFIX}[a-z0-9_]+"`, "g")) ?? [];
  if (scrollRefs.length) err(`scroll items handed out directly: ${[...new Set(scrollRefs)].join(", ")}`);
  for (const h of SECT_HALLS) for (const o of h.offers) if (sectItem.has(`${o.kind}:${o.id}`)) err(`hall ${h.locationId} sells ${o.kind} ${o.id}`);
});

check("lineage quests: a real teacher of that sect, a fitting foe and an obtainable gift, 2–6 lines each way", () => {
  for (const l of LINEAGE_SPECS) {
    const info = STORY_RESOLVERS.martial(l.kind, l.id);
    if (!info || !inScope(info.sc)) continue;
    const where = `lineage ${l.id}`;
    const npc = getNpc(l.giver);
    if (!npc) { err(`${where}: giver ${l.giver} is not an NPC`); continue; }
    if (!npc.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[l.giver])) err(`${where}: giver ${l.giver} stands on no map`);
    const sect = STORY_RESOLVERS.sectByLabel(info.sc);
    if (sect) {
      const hall = SECT_MEMBERSHIPS[sect.id]?.hallLocationId;
      if (hall && !npc.locationIds.includes(hall)) err(`${where}: giver ${l.giver} does not live at ${hall} (${info.sc})`);
    }
    const tier = LINEAGE_TIERS[info.ti];
    const foe = getOpponent(l.foe ?? tier.foe);
    if (!foe) err(`${where}: foe ${l.foe} does not exist`);
    else {
      if ((foe.ti ?? 0) > info.ti + 1 || (foe.ti ?? 0) < info.ti - 1) err(`${where}: foe ${foe.id} is T${foe.ti}, the skill is T${info.ti} (allow ±1)`);
      if (!roaming.has(foe.id)) err(`${where}: foe ${foe.id} never roams (not in FIGHT_EVENTS or a hunt)`);
    }
    // The T2–T3 spar is with the teacher's own build: it must be a fair fight for that tier.
    const spar = tier.spar ? npc.sparOpponentId : undefined;
    const sparFoe = spar ? getOpponent(spar) : null;
    if (sparFoe && (sparFoe.ti ?? 0) > info.ti + 1) err(`${where}: teacher ${l.giver}'s spar ${spar} is T${sparFoe.ti}, too strong for a T${info.ti} lesson (pick a teacher whose spar is T${info.ti}–T${info.ti + 1})`);
    const item = l.item ?? tier.item;
    if (tier.items && (!getItem(item) || !obtainable(item))) err(`${where}: item ${item} is missing or unobtainable`);
    for (const [name, lines] of [["offer", l.offer], ["complete", l.complete]] as const) {
      if (lines.length < 2 || lines.length > 6) err(`${where}: ${name} has ${lines.length} lines (2–6)`);
      if (!lines.every(lineOk)) err(`${where}: ${name} has an empty line`);
    }
  }
});

function checkBeat(where: string, beat: StoryBeat, minLines = 1) {
  if (beat.lines.length < minLines) err(`${where}: ${beat.lines.length} lines (at least ${minLines})`);
  if (!beat.lines.every(lineOk)) err(`${where}: empty line`);
  for (const aside of beat.asides ?? []) if (!aside.say.trim() || !aside.reply.length || !aside.reply.every(lineOk)) err(`${where}: bad aside`);
  if (beat.cutscene) checkCutscene(where, beat.cutscene);
}

const FX = new Set(["slash", "burst", "qi", "flash", "shake", "sparkle", "smoke", "lightning", "petals", "fire", "blood", "heal", "ice", "poison"]);
const MOTIONS = new Set(["attack", "hurt", "guard", "victory", "defeat", "idle"]);
const MOODS = new Set(["day", "dusk", "night", "past", "snow", "rain"]);
function checkCutscene(where: string, c: CutsceneSpec) {
  const w = `${where} cutscene`;
  const map = getLocationMap(c.stage);
  if (!map) err(`${w}: stage ${c.stage} has no painted map`);
  if (c.around && map && !map.npcSpots?.[c.around]) err(`${w}: ${c.around} has no spot on ${c.stage}`);
  if (c.mood && !MOODS.has(c.mood)) err(`${w}: mood ${c.mood}`);
  const cast = Object.entries(c.cast);
  if (!cast.length) err(`${w}: empty cast`);
  for (const [key, m] of cast) {
    const look = m.look;
    const ok = look === "hero" || (CHARACTER_IDS as readonly string[]).includes(look) || (/^beast:(\d+)$/.test(look) && Number(look.slice(6)) < CREATURE_FRAME_COUNT);
    if (!ok) err(`${w}: ${key} look "${look}" is not a sheet`);
    if (Math.abs(m.at[0]) > 6 || Math.abs(m.at[1]) > 3) err(`${w}: ${key} at ${m.at} is off stage (x −6…6, y −3…3)`);
    if (m.tint && !/^#[0-9a-f]{6}$/i.test(m.tint)) err(`${w}: ${key} tint ${m.tint}`);
    if (!m.name.trim()) err(`${w}: ${key} has no name`);
  }
  if (c.beats.length < 4) err(`${w}: only ${c.beats.length} beats`);
  let lines = 0;
  for (const [i, b] of c.beats.entries()) {
    const actor = (name: string) => { if (!c.cast[name]) err(`${w} beat ${i}: unknown actor ${name}`); };
    switch (b[0]) {
      case "say": case "think": actor(b[1]); if (!b[2].trim()) err(`${w} beat ${i}: empty`); lines++; break;
      case "narrate": case "title": if (!b[1].trim()) err(`${w} beat ${i}: empty`); lines++; break;
      case "move": actor(b[1]); if (Math.abs(b[2][0]) > 6 || Math.abs(b[2][1]) > 3) err(`${w} beat ${i}: off stage`); break;
      case "face": actor(b[1]); break;
      case "act": actor(b[1]); if (!MOTIONS.has(b[2])) err(`${w} beat ${i}: motion ${b[2]}`); break;
      case "fx": if (!FX.has(b[1])) err(`${w} beat ${i}: fx ${b[1]}`); if (b[2]) actor(b[2]); break;
      case "enter": case "exit": actor(b[1]); break;
      case "camera": if (b[1] !== "center") actor(b[1]); break;
      case "wait": if (b[1] < 0 || b[1] > 4000) err(`${w} beat ${i}: wait ${b[1]}`); break;
      case "fade": break;
      case "mood": if (!MOODS.has(b[1])) err(`${w} beat ${i}: mood ${b[1]}`); break;
      default: err(`${w} beat ${i}: unknown beat ${(b as readonly unknown[])[0]}`);
    }
  }
  if (lines < 3) err(`${w}: tells too little (${lines} lines of text)`);
}

function checkStep(where: string, step: StoryStep) {
  switch (step.t) {
    case "visit": if (!placeMap(step.locationId)) err(`${where}: ${step.locationId} has no map`); checkBeat(where, step.scene, 3); break;
    case "talk": if (!standsAt(step.npcId, step.locationId)) err(`${where}: ${step.npcId} does not stand at ${step.locationId}`); checkBeat(where, step.scene, 3); break;
    case "duel":
      if (!placeMap(step.locationId)) err(`${where}: ${step.locationId} has no map`);
      if (!getOpponent(step.opponentId)) err(`${where}: opponent ${step.opponentId} missing`);
      checkBeat(`${where} before`, step.before, 2); checkBeat(`${where} after`, step.after, 2); break;
    case "hunt": if (!getOpponent(step.opponentId) || !roaming.has(step.opponentId)) err(`${where}: ${step.opponentId} does not roam`); if (step.count < 1 || step.count > 8) err(`${where}: count ${step.count}`); break;
    case "gather": if (!getItem(step.itemId) || !obtainable(step.itemId)) err(`${where}: item ${step.itemId} unobtainable`); if (step.count < 1 || step.count > 10) err(`${where}: count ${step.count}`); break;
    case "trait": case "stat": if (step.min < 1 || step.min > 80) err(`${where}: min ${step.min}`); break;
  }
  if (!step.hint.trim()) err(`${where}: empty hint`);
}

function checkReward(where: string, r: QuestReward) {
  if (r.t === "gold" && r.amount > 300) err(`${where}: gold ${r.amount} > 300`);
  if (r.t === "wExp" && r.amount > 250) err(`${where}: wExp ${r.amount} > 250`);
  if (r.t === "item" && (!getItem(r.itemId) || (r.count ?? 1) > 5)) err(`${where}: item reward ${r.itemId}`);
  if (r.t === "learnSkill" || r.t === "learnArt") err(`${where}: chapters must not teach (only the saga's end does)`);
  if (r.t === "joinSect" || r.t === "leaveSect" || r.t === "resignSect" || r.t === "betraySect") err(`${where}: membership rewards are not allowed`);
}

check("story sagas: 8–10 chapters for a sect T4 (jianghu: 16–20 for T4, 32–40 for T5, gated twice / four times as hard), T4 reward of that sect, rich dialogue, real places, people and foes, small rewards", () => {
  const ids = new Set<string>();
  for (const arc of STORY_ARC_SPECS) {
    if (!inScope(arc.sc)) continue;
    const where = `saga ${arc.id}`;
    if (ids.has(arc.id)) err(`${where}: duplicate id`); ids.add(arc.id);
    if (!/^[a-z0-9_]+$/.test(arc.id)) err(`${where}: id must be snake case`);
    const info = STORY_RESOLVERS.martial(arc.reward.kind, arc.reward.id);
    const rule = sagaRule(arc, info?.ti ?? 4);
    if (!info || (info.ti !== 4 && !(arc.sc === JIANGHU && info.ti === 5))) err(`${where}: reward ${arc.reward.id} is not a T4 ${arc.reward.kind}${arc.sc === JIANGHU ? " (or a jianghu T5)" : ""}`);
    else if (info.sc !== arc.sc) err(`${where}: reward is ${info.sc}, saga says ${arc.sc}`);
    if (arc.chapters.length < rule.chapters[0] || arc.chapters.length > rule.chapters[1]) err(`${where}: ${arc.chapters.length} chapters (${rule.chapters.join("–")})`);
    if (arc.sc === JIANGHU) checkJianghuGate(where, arc, rule);
    let films = 0;
    for (const [i, ch] of arc.chapters.entries()) {
      const cw = `${where} ch${i + 1}`;
      if (!getNpc(ch.giver) || !getNpc(ch.giver)!.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[ch.giver])) err(`${cw}: giver ${ch.giver} is not on a map`);
      if (!ch.title.trim() || !ch.summary.trim()) err(`${cw}: title / summary`);
      if (ch.steps.length < 1 || ch.steps.length > 3) err(`${cw}: ${ch.steps.length} steps (1–3)`);
      checkBeat(`${cw} offer`, ch.offer, 4);
      checkBeat(`${cw} complete`, ch.complete, 3);
      ch.steps.forEach((s, k) => checkStep(`${cw} step ${k + 1}`, s));
      ch.reward.forEach((r) => checkReward(cw, r));
      if (!ch.reward.length) err(`${cw}: no reward`);
      const beats = [ch.offer, ch.complete, ...ch.steps.flatMap((s) => s.t === "visit" || s.t === "talk" ? [s.scene] : s.t === "duel" ? [s.before, s.after] : [])];
      films += beats.filter((b) => b.cutscene).length;
      const words = beats.flatMap((b) => b.lines).length + beats.reduce((n, b) => n + (b.cutscene?.beats.filter((x) => x[0] === "say" || x[0] === "narrate" || x[0] === "think").length ?? 0), 0);
      if (words < 14) err(`${cw}: only ${words} lines of story (at least 14)`);
    }
    if (films < rule.films) err(`${where}: ${films} cutscenes (at least ${rule.films}: opening, turns, finale)`);
    const duels = arc.chapters.flatMap((ch) => ch.steps).filter((st) => st.t === "duel").length;
    if (duels < rule.duels) err(`${where}: ${duels} duels (at least ${rule.duels})`);
    if (!arc.chapters[arc.chapters.length - 1].complete.cutscene) err(`${where}: the finale needs a cutscene`);
    if (!arc.chapters[0].offer.cutscene) err(`${where}: the opening needs a cutscene`);
    for (const o of arc.opponents ?? []) {
      if (!o.id.startsWith("st_")) err(`${where}: new opponent ${o.id} must start with st_`);
      for (const s of o.skillIds) if (!SKILLS.some((k) => k.id === s)) err(`${where}: opponent ${o.id} skill ${s}`);
      if (o.artId && !ARTS.some((a) => a.id === o.artId)) err(`${where}: opponent ${o.id} art ${o.artId}`);
    }
  }
});

check("main story: about 15 chained chapters from a new game, at least 10 films, real places, people and foes, small rewards, teaches nothing", () => {
  if (ONLY) return;
  const where = `main ${MAIN_ARC.id}`;
  if (MAIN_ARC.chapters.length < 14 || MAIN_ARC.chapters.length > 16) err(`${where}: ${MAIN_ARC.chapters.length} chapters (14–16)`);
  if (!MAIN_ARC.tagline.trim()) err(`${where}: tagline`);
  let films = 0;
  for (const [i, ch] of MAIN_ARC.chapters.entries()) {
    const cw = `${where} ch${i + 1}`;
    if (!getNpc(ch.giver) || !getNpc(ch.giver)!.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[ch.giver])) err(`${cw}: giver ${ch.giver} is not on a map`);
    if (!ch.title.trim() || !ch.summary.trim()) err(`${cw}: title / summary`);
    if (ch.steps.length < 1 || ch.steps.length > 3) err(`${cw}: ${ch.steps.length} steps (1–3)`);
    checkBeat(`${cw} offer`, ch.offer, 3);
    checkBeat(`${cw} complete`, ch.complete, 2);
    ch.steps.forEach((s, k) => checkStep(`${cw} step ${k + 1}`, s));
    ch.reward.forEach((r) => checkReward(cw, r));
    if (!ch.reward.length) err(`${cw}: no reward`);
    const beats = [ch.offer, ch.complete, ...ch.steps.flatMap((s) => s.t === "visit" || s.t === "talk" ? [s.scene] : s.t === "duel" ? [s.before, s.after] : [])];
    films += beats.filter((b) => b.cutscene).length;
  }
  if (films < 10) err(`${where}: ${films} cutscenes (at least 10)`);
  if (MAIN_ARC.chapters.length && !MAIN_ARC.chapters[0].offer.cutscene) err(`${where}: the opening needs a cutscene`);
  for (const o of MAIN_ARC.opponents ?? []) {
    if (!o.id.startsWith("st_")) err(`${where}: new opponent ${o.id} must start with st_`);
    for (const s of o.skillIds) if (!SKILLS.some((k) => k.id === s)) err(`${where}: opponent ${o.id} skill ${s}`);
    if (o.artId && !ARTS.some((a) => a.id === o.artId)) err(`${where}: opponent ${o.id} art ${o.artId}`);
  }
});

check("compiled: unique ids, every scene reachable, cutscenes registered, chapters chained", () => {
  const seen = new Set<string>();
  for (const q of STORY_QUESTS) { if (seen.has(q.id)) err(`duplicate quest ${q.id}`); seen.add(q.id); if (getQuest(q.id)?.id !== q.id) err(`${q.id} not registered`); }
  for (const c of CUTSCENES) if (!c.beats.length) err(`cutscene ${c.id} empty`);
  for (const arc of STORY_ARCS) {
    arc.questIds.forEach((id, i) => {
      const q = getQuest(id);
      if (!q || q.type !== (arc.main ? "main" : "story") || q.story?.chapter !== i + 1) err(`${id}: not chapter ${i + 1}`);
      if (!getScene(`qs_${id}_offer`) || !getScene(`qs_${id}_complete`)) err(`${id}: offer / complete scene missing`);
    });
  }
});

// ─── Play-through in the real store ───────────────────────────────────
const { useWorldStore } = await import("../store/world-store");
const store = () => useWorldStore.getState();
Math.random = () => 0.5;

/** Make the hero able to meet any gate: top rank in the sect, strong, the right traits and life skills. */
function empower(sectLabel: string) {
  const sect = STORY_RESOLVERS.sectByLabel(sectLabel);
  const s = store();
  const build = { ...s.playerBuild!, stats: Object.fromEntries(Object.keys(s.playerBuild!.stats).map((k) => [k, 120])) as NonNullable<typeof s.playerBuild>["stats"] };
  const membership = sect ? { [sect.id]: { sectId: sect.id, rank: sect.topRank, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 0, status: "active" as const } } : {};
  useWorldStore.setState({
    playerBuild: build, sectMembership: { ...s.sectMembership, ...membership },
    traits: Object.fromEntries(Object.keys(s.traits).map((k) => [k, 90])) as typeof s.traits,
    lifeSkillXp: Object.fromEntries(Object.keys(s.lifeSkillXp).map((k) => [k, 999999])) as typeof s.lifeSkillXp,
    gold: 99999,
  });
}

function satisfyAuto(c: Condition) {
  if (c.t === "and") { c.all.forEach(satisfyAuto); return; }
  if (c.t === "defeatedOpponent") useWorldStore.setState({ defeatedCounts: { ...store().defeatedCounts, [c.opponentId]: (store().defeatedCounts[c.opponentId] ?? 0) + (c.count ?? 1) } });
  if (c.t === "hasItem") useWorldStore.setState({ inventory: { ...store().inventory, [c.itemId]: (store().inventory[c.itemId] ?? 0) + (c.count ?? 1) } });
  // Traits and stats were raised by empower(); nudge the store to re-tick.
  useWorldStore.setState({ inventory: { ...store().inventory } });
}

/** Take the "go on" choice of the current dialog until it leaves dialogs (or a battle starts). */
function runDialog(questId: string, winBattles = true) {
  for (let guard = 0; guard < 12; guard++) {
    const scene = getScene(store().currentSceneId);
    if (scene?.kind !== "dialog" || !scene.choices?.length) return;
    const pending = () => store().pendingBattle;
    store().makeChoice(0);
    const battle = pending();
    if (battle && winBattles) {
      // Resolve the fight as a win: clear it and follow onWin.
      useWorldStore.setState({ pendingBattle: null });
      store().gotoScene(battle.onWin);
    }
    void questId;
  }
}

/** Mark quests that a gate names as done (prologue trials), so the play-through can start. */
function satisfyQuestGates(c: Condition | undefined) {
  if (!c) return;
  if (c.t === "and") { c.all.forEach(satisfyQuestGates); return; }
  if (c.t === "questStatus" && c.status === "done" && !store().quests[c.questId]) {
    useWorldStore.setState({ quests: { ...store().quests, [c.questId]: { id: c.questId, status: "done", stage: 0 } } });
  }
}

function play(def: QuestDef) {
  const where = def.id;
  if (def.story?.chapter === 1 || def.lineage) satisfyQuestGates(def.prereqs);
  assert.ok(evaluateCondition(store(), def.prereqs ?? { t: "and", all: [] }), `${where}: offerable after the previous one`);
  const accepted = store().acceptQuest(def.id);
  assert.ok(accepted.ok, `${where}: accept`);
  const home = STORY_RESOLVERS.npcHome(def.giverNpcId!);
  useWorldStore.setState({ currentSceneId: `qs_${def.id}_offer`, lastLocationId: home });
  runDialog(def.id);
  for (let i = 0; i < def.stages.length - 1; i++) {
    const stage = def.stages[i];
    const at = store().quests[def.id]?.stage ?? 0;
    if (at > i) continue; // already met (a trait or stat the hero has)
    assert.equal(at, i, `${where}: on stage ${i}`);
    if (stage.objective) {
      const spot = stage.objective.spots[0];
      useWorldStore.setState({ currentSceneId: spot.locationId, lastLocationId: spot.locationId });
      const r = store().doQuestObjective(def.id, 0);
      assert.ok(r.ok, `${where}: spot ${spot.label} (${r.ok ? "" : r.message})`);
      runDialog(def.id);
    } else if (stage.autoAdvance) satisfyAuto(stage.autoAdvance);
    assert.ok((store().quests[def.id]?.stage ?? 0) > i, `${where}: stage ${i} (${stage.description}) advanced`);
  }
  useWorldStore.setState({ currentSceneId: `qs_${def.id}_complete`, lastLocationId: home });
  runDialog(def.id);
  assert.equal(store().quests[def.id]?.status, "done", `${where}: handed in`);
}

// The quest hands over the move's คัมภีร์; reading it from the bag teaches it.
function readScroll(kind: "skill" | "art", id: string, where: string) {
  const scroll = scrollItemId(kind, id);
  assert.equal(store().inventory[scroll] ?? 0, 1, `${where}: got ${scroll}`);
  const r = store().useItem(scroll);
  assert.ok(r.ok, `${where}: read ${scroll} (${r.ok ? "" : r.reason})`);
  assert.equal(store().inventory[scroll] ?? 0, 0, `${where}: scroll used up`);
}

check("main story: chapter 1 is offered from the first moment of a new game", () => {
  if (ONLY) return;
  store().startNewGame({ name: "ผู้ทดสอบ", gender: "male" } as never);
  const first = getQuest(storyQuestId(MAIN_ARC.id, 1));
  if (!first || first.type !== "main") err("main: chapter 1 is not a main quest");
  else if (!isQuestOfferable(store(), first) || !evaluateCondition(store(), first.prereqs ?? { t: "and", all: [] })) err("main: chapter 1 is not offered on a new game");
});

check("play-through: every lineage quest and every saga chapter, accept → steps → hand-in, through the real store", () => {
  let lineages = 0, chapters = 0;
  for (const l of LINEAGE_SPECS) {
    const info = STORY_RESOLVERS.martial(l.kind, l.id)!;
    if (!inScope(info.sc)) continue;
    store().startNewGame({ name: "ผู้ทดสอบ", gender: "female" } as never);
    empower(info.sc);
    try {
      play(getQuest(lineageQuestId(l))!);
      const pre = store().playerBuild!;
      assert.ok(!(l.kind === "skill" ? pre.learnedSkillIds : pre.learnedArtIds)?.includes(l.id), `lineage ${l.id}: not learned before reading the scroll`);
      readScroll(l.kind, l.id, `lineage ${l.id}`);
      const b = store().playerBuild!;
      assert.ok(l.kind === "skill" ? b.learnedSkillIds?.includes(l.id) : b.learnedArtIds?.includes(l.id), `lineage ${l.id}: learned`);
      lineages++;
    } catch (e) { err(e instanceof Error ? e.message : String(e)); }
  }
  for (const arc of STORY_ARC_SPECS) {
    if (!inScope(arc.sc)) continue;
    store().startNewGame({ name: "ผู้ทดสอบ", gender: "female" } as never);
    empower(arc.sc);
    try {
      arc.chapters.forEach((_, i) => { play(getQuest(storyQuestId(arc.id, i + 1))!); chapters++; });
      assert.ok(!evaluateCondition(store(), getQuest(storyQuestId(arc.id, 1))!.prereqs!), `saga ${arc.id}: not offered again while the scroll is unread`);
      readScroll(arc.reward.kind, arc.reward.id, `saga ${arc.id}`);
      const b = store().playerBuild!;
      assert.ok(arc.reward.kind === "skill" ? b.learnedSkillIds?.includes(arc.reward.id) : b.learnedArtIds?.includes(arc.reward.id), `saga ${arc.id}: taught ${arc.reward.id}`);
      assert.ok(!evaluateCondition(store(), getQuest(storyQuestId(arc.id, 1))!.prereqs!), `saga ${arc.id}: not offered again once learned`);
    } catch (e) { err(e instanceof Error ? e.message : String(e)); }
  }
  if (!ONLY && MAIN_ARC.chapters.length) {
    store().startNewGame({ name: "ผู้ทดสอบ", gender: "male" } as never);
    empower("");
    try { MAIN_ARC.chapters.forEach((_, i) => { play(getQuest(storyQuestId(MAIN_ARC.id, i + 1))!); chapters++; }); }
    catch (e) { err(e instanceof Error ? e.message : String(e)); }
  }
  console.log(`  played ${lineages} lineage quests and ${chapters} saga / main chapters`);
});

check("decline and drop: every lineage / saga offer can be turned down, and an accepted one dropped and taken again", () => {
  for (const q of STORY_QUESTS) {
    const offer = getScene(`qs_${q.id}_offer`);
    if (!offer || offer.kind !== "dialog") { err(`${q.id}: no offer scene`); continue; }
    const starts = (c: { effects?: readonly { t: string }[] }) => (c.effects ?? []).some((e) => e.t === "startQuest");
    if (!(offer.choices ?? []).some((c) => c.text === DECLINE_TEXT && !starts(c))) err(`${q.id}: offer has no ${DECLINE_TEXT}`);
    if (!(offer.choices ?? []).some(starts)) err(`${q.id}: offer cannot be accepted`);
  }
  // The jianghu sagas have no lineage quests: then the drop check below has nothing to drop.
  const l = LINEAGE_SPECS.find((x) => inScope(STORY_RESOLVERS.martial(x.kind, x.id)!.sc));
  if (!l) return;
  const def = getQuest(lineageQuestId(l))!;
  store().startNewGame({ name: "ผู้ทดสอบ", gender: "female" } as never);
  empower(STORY_RESOLVERS.martial(l.kind, l.id)!.sc);
  assert.ok(isQuestOfferable(store(), def), `${def.id}: offered`);
  assert.ok(store().acceptQuest(def.id).ok, `${def.id}: accepted`);
  assert.ok(store().abandonQuest(def.id).ok, `${def.id}: dropped`);
  assert.equal(store().quests[def.id], undefined, `${def.id}: forgotten after dropping`);
  assert.ok(isQuestOfferable(store(), def), `${def.id}: offered again after dropping`);
});

check("secret trials: the T4 saga trials are off the sect window and offered by their giver", () => {
  for (const [reward, qid] of Object.entries(SAGA_PROLOGUES)) {
    const def = getQuest(qid);
    if (!def?.sectId) { err(`trial ${qid} (${reward}): not a sect quest`); continue; }
    if (!isSecretSectQuest(qid)) err(`trial ${qid}: not secret`);
    if (!def.giverNpcId || !getNpc(def.giverNpcId)?.locationIds.some((loc) => getLocationMap(loc)?.npcSpots?.[def.giverNpcId!])) err(`trial ${qid}: giver stands on no map`);
    const rank = def.minSectRank ?? 1;
    const member = (r: number, status: "active" | "resigned") => ({ ...store(), sectMembership: { [def.sectId!]: { rank: r, points: 0, lastQuestDay: {}, artQuestsDone: [], rewardPicks: {}, joinedDay: 0, status } } }) as unknown as WorldStateData;
    const open = { ...def, prereqs: undefined };
    if (!isQuestOfferable(member(rank, "active"), open)) err(`trial ${qid}: giver does not offer it at rank ${rank}`);
    if (isQuestOfferable(member(rank + 1, "active"), open)) err(`trial ${qid}: offered below rank ${rank}`);
    if (isQuestOfferable(member(rank, "resigned"), open)) err(`trial ${qid}: offered to a former member`);
  }
  for (const q of QUESTS) if (q.sectId && !isSecretSectQuest(q.id) && isQuestOfferable(store(), { ...q, prereqs: undefined })) err(`sect quest ${q.id} offered by an NPC`);
});

check("mystery: no quest that teaches a move names it or its tier in its name, summary or description", () => {
  for (const q of QUESTS) for (const r of q.rewards ?? []) {
    if (r.t !== "learnSkill" && r.t !== "learnArt") continue;
    const name = r.t === "learnSkill" ? SKILLS.find((x) => x.id === r.skillId)?.n : ARTS.find((x) => x.id === r.artId)?.n;
    for (const text of [q.name, q.description, q.briefSummary ?? ""]) {
      if (name && text.includes(name)) err(`${q.id}: names its reward "${name}" — say วิชาลึกลับ`);
      if (/\(ขั้น|\bT[0-5]\b/.test(text)) err(`${q.id}: names a tier — "${text.slice(0, 60)}"`);
    }
  }
});

check("difficulty grows with the tier: higher tiers gate on rank and stats and ask for more", () => {
  for (const l of LINEAGE_SPECS) {
    const info = STORY_RESOLVERS.martial(l.kind, l.id)!;
    if (!inScope(info.sc)) continue;
    const q = getQuest(lineageQuestId(l))!;
    const text = JSON.stringify(q.prereqs);
    if (info.ti >= 1 && !text.includes("statAtLeast")) err(`${q.id}: T${info.ti} needs a stat gate`);
    if (info.ti >= 2 && q.stages.length < 3) err(`${q.id}: T${info.ti} needs at least 3 stages`);
  }
  for (const arc of STORY_ARC_SPECS) {
    if (!inScope(arc.sc)) continue;
    const text = JSON.stringify(arc.require);
    if (!text.includes("statAtLeast")) err(`saga ${arc.id}: chapter 1 needs a stat gate (T4: 40)`);
    if (arc.sectId && !text.includes("sectRankAtLeast")) err(`saga ${arc.id}: chapter 1 needs a sect rank gate`);
  }
});

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`${passed} story quest checks passed (${LINEAGE_SPECS.length} lineage quests, ${STORY_ARC_SPECS.length} sagas, ${CUTSCENES.length} cutscenes)`);
