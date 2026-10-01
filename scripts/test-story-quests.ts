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
import { CHARACTER_IDS } from "../lib/characters/catalog";
import { LINEAGE_SPECS, STORY_ARC_SPECS } from "../lib/world/data/story";
import { CUTSCENES, STORY_ARCS, STORY_QUESTS, STORY_RESOLVERS } from "../lib/world/story/registry";
import { lineageQuestId, storyQuestId, LINEAGE_TIERS } from "../lib/world/story/compile";
import type { CutsceneSpec, StoryBeat, StoryLine, StoryStep } from "../lib/world/story/types";
import { getNpc, getOpponent, getItem, getScene, getQuest, SHOPS, RESOURCES, RECIPES, OPPONENTS } from "../lib/world/data";
import { FIGHT_EVENTS } from "../lib/world/data/random-events";
import { getLocationMap } from "../lib/world/data/location-maps";
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
const standsAt = (npcId: string, locationId: string) => !!getLocationMap(locationId)?.npcSpots?.[npcId] && !!getNpc(npcId)?.locationIds.includes(locationId);

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
    const ok = look === "hero" || (CHARACTER_IDS as readonly string[]).includes(look) || /^beast:[0-7]$/.test(look);
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
    case "visit": if (!getLocationMap(step.locationId)) err(`${where}: ${step.locationId} has no map`); checkBeat(where, step.scene, 3); break;
    case "talk": if (!standsAt(step.npcId, step.locationId)) err(`${where}: ${step.npcId} does not stand at ${step.locationId}`); checkBeat(where, step.scene, 3); break;
    case "duel":
      if (!getLocationMap(step.locationId)) err(`${where}: ${step.locationId} has no map`);
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

check("story sagas: 8–10 chapters, T4 reward of that sect, rich dialogue, real places, people and foes, small rewards", () => {
  const ids = new Set<string>();
  for (const arc of STORY_ARC_SPECS) {
    if (!inScope(arc.sc)) continue;
    const where = `saga ${arc.id}`;
    if (ids.has(arc.id)) err(`${where}: duplicate id`); ids.add(arc.id);
    if (!/^[a-z0-9_]+$/.test(arc.id)) err(`${where}: id must be snake case`);
    const info = STORY_RESOLVERS.martial(arc.reward.kind, arc.reward.id);
    if (!info || info.ti !== 4) err(`${where}: reward ${arc.reward.id} is not a T4 ${arc.reward.kind}`);
    else if (info.sc !== arc.sc) err(`${where}: reward is ${info.sc}, saga says ${arc.sc}`);
    if (arc.chapters.length < 8 || arc.chapters.length > 10) err(`${where}: ${arc.chapters.length} chapters (8–10)`);
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
    if (films < 4) err(`${where}: ${films} cutscenes (at least 4: opening, two turns, finale)`);
    if (!arc.chapters[arc.chapters.length - 1].complete.cutscene) err(`${where}: the finale needs a cutscene`);
    if (!arc.chapters[0].offer.cutscene) err(`${where}: the opening needs a cutscene`);
    for (const o of arc.opponents ?? []) {
      if (!o.id.startsWith("st_")) err(`${where}: new opponent ${o.id} must start with st_`);
      for (const s of o.skillIds) if (!SKILLS.some((k) => k.id === s)) err(`${where}: opponent ${o.id} skill ${s}`);
      if (o.artId && !ARTS.some((a) => a.id === o.artId)) err(`${where}: opponent ${o.id} art ${o.artId}`);
    }
  }
});

check("compiled: unique ids, every scene reachable, cutscenes registered, chapters chained", () => {
  const seen = new Set<string>();
  for (const q of STORY_QUESTS) { if (seen.has(q.id)) err(`duplicate quest ${q.id}`); seen.add(q.id); if (getQuest(q.id) !== q) err(`${q.id} not registered`); }
  for (const c of CUTSCENES) if (!c.beats.length) err(`cutscene ${c.id} empty`);
  for (const arc of STORY_ARCS) {
    arc.questIds.forEach((id, i) => {
      const q = getQuest(id);
      if (!q || q.type !== "story" || q.story?.chapter !== i + 1) err(`${id}: not chapter ${i + 1}`);
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
  if (def.story?.chapter === 1) satisfyQuestGates(def.prereqs);
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

check("play-through: every lineage quest and every saga chapter, accept → steps → hand-in, through the real store", () => {
  let lineages = 0, chapters = 0;
  for (const l of LINEAGE_SPECS) {
    const info = STORY_RESOLVERS.martial(l.kind, l.id)!;
    if (!inScope(info.sc)) continue;
    store().startNewGame({ name: "ผู้ทดสอบ", gender: "female" } as never);
    empower(info.sc);
    try {
      play(getQuest(lineageQuestId(l))!);
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
      const b = store().playerBuild!;
      assert.ok(arc.reward.kind === "skill" ? b.learnedSkillIds?.includes(arc.reward.id) : b.learnedArtIds?.includes(arc.reward.id), `saga ${arc.id}: taught ${arc.reward.id}`);
      assert.ok(!evaluateCondition(store(), getQuest(storyQuestId(arc.id, 1))!.prereqs!), `saga ${arc.id}: not offered again once learned`);
    } catch (e) { err(e instanceof Error ? e.message : String(e)); }
  }
  console.log(`  played ${lineages} lineage quests and ${chapters} saga chapters`);
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
