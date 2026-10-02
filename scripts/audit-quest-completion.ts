/**
 * Campaign completability audit: can every quest be started, progressed and
 * finished using only content that is actually reachable in the world?
 *
 * Run: bun scripts/audit-quest-completion.ts   (exit 1 on any blocker)
 *
 * Mirrors the engine's real paths, unlike the older offer/complete-scene
 * heuristic in audit-quest-flow.ts:
 *  - start: giver NPC popup (non-sect quests), sect popup (`sectId`), or a
 *    reachable `startQuest` scene effect;
 *  - progress: each stage advances via `autoAdvance` (tickQuestProgress) or a
 *    reachable `advanceQuest` / `finishQuest` effect;
 *  - finish: a last stage with `autoAdvance` auto-finishes; otherwise the
 *    turn-in NPC popup (turnInNpcId ?? giverNpcId) or a reachable `finishQuest`.
 * Reachability starts at START_SCENE_ID and follows routes, destinations,
 * choices, `next`, goto effects, placed NPC dialogs and random meet/treasure
 * events. Items are obtainable from shops, gather/hunt yields, opponent drops,
 * steal loot, scene giveItem, quest rewards and craftable recipes (fixpoint).
 */
import {
  QUESTS, SCENES, SCENES_BY_ID, START_SCENE_ID, NPCS, OPPONENTS_BY_ID, ITEMS_BY_ID, SHOPS, RESOURCES_BY_ID,
  RECIPES, getQuest, type Condition, type SceneEffect, type Scene, type QuestDef,
} from "@/lib/world";
import { FIGHT_EVENTS } from "@/lib/world/data/random-events";
import { SECT_MEMBERSHIPS } from "@/lib/world/data/sect-memberships";
import { getLocationMap } from "@/lib/world/data/location-maps";

// ── Scene reachability ──────────────────────────────────────────────────
function effectsOf(scene: Scene): SceneEffect[] {
  const out: SceneEffect[] = [];
  if (scene.kind === "dialog" || scene.kind === "location") out.push(...(scene.onEnter ?? []));
  if (scene.kind === "dialog") {
    for (const choice of scene.choices ?? []) out.push(...(choice.effects ?? []));
  } else if (scene.kind === "route") {
    for (const dest of scene.destinations) out.push(...(dest.effects ?? []));
  }
  return out;
}
function childScenes(scene: Scene): string[] {
  const out: string[] = [];
  if (scene.kind === "dialog") {
    if (scene.next) out.push(scene.next);
    for (const choice of scene.choices ?? []) out.push(choice.next);
  } else if (scene.kind === "location") {
    for (const route of scene.routes) out.push(route.routeSceneId);
    for (const npc of scene.npcs) out.push(npc.dialogSceneId);
    for (const npc of NPCS) if (npc.locationIds.includes(scene.id) && npc.dialogSceneId) out.push(npc.dialogSceneId);
  } else {
    for (const dest of scene.destinations) out.push(dest.locationId);
    if (scene.back) out.push(scene.back);
  }
  for (const eff of effectsOf(scene)) {
    if (eff.t === "goto") out.push(eff.sceneId);
    if (eff.t === "gotoRandom") out.push(...eff.sceneIds);
    if (eff.t === "triggerBattle") out.push(eff.onWin, eff.onLose);
  }
  return out;
}
const reachable = new Set<string>();
// Losing to a law pursuer (a walk-tick encounter, see lib/world/law.ts) routes to
// jail_cell, so the arrest scene and the jail map it leads to are reachable too.
const queue = [START_SCENE_ID, "jail_cell"];
// Quest offer/complete scenes open from the NPC popup; they are reachable
// whenever that NPC is (checked per quest below), so seed them too.
for (const q of QUESTS) for (const s of [`qs_${q.id}_offer`, `qs_${q.id}_complete`]) if (SCENES_BY_ID.has(s)) queue.push(s);
// Objective spots may open a dialog (QuestObjectiveSpot.sceneId).
for (const q of QUESTS) for (const stage of q.stages) for (const spot of stage.objective?.spots ?? []) if (spot.sceneId) queue.push(spot.sceneId);
while (queue.length) {
  const id = queue.pop()!;
  if (reachable.has(id)) continue;
  const scene = SCENES_BY_ID.get(id);
  if (!scene) continue;
  reachable.add(id);
  queue.push(...childScenes(scene));
}
const reachableLocations = new Set(SCENES.filter((s) => s.kind === "location" && reachable.has(s.id)).map((s) => s.id));
const reachableEffects = SCENES.filter((s) => reachable.has(s.id)).flatMap(effectsOf);

// ── NPC placement ───────────────────────────────────────────────────────
const placedNpcs = new Set<string>();
for (const npc of NPCS) if (npc.locationIds.some((l) => reachableLocations.has(l))) placedNpcs.add(npc.id);
for (const s of SCENES) if (s.kind === "location" && reachableLocations.has(s.id)) for (const n of s.npcs) placedNpcs.add(n.id);

// ── Opponents that can be met ───────────────────────────────────────────
const meetable = new Set<string>(FIGHT_EVENTS.map((e) => e.opponentId));
for (const eff of reachableEffects) if (eff.t === "triggerBattle") meetable.add(eff.opponentId);
for (const npc of NPCS) if (npc.sparOpponentId && placedNpcs.has(npc.id)) meetable.add(npc.sparOpponentId);
const reachableResources = new Set<string>();
for (const s of SCENES) if ((s.kind === "location" || s.kind === "route") && reachable.has(s.id)) for (const r of s.resources ?? []) reachableResources.add(r.resourceId);
for (const id of reachableResources) for (const opp of RESOURCES_BY_ID.get(id)?.opponentIds ?? []) meetable.add(opp);
for (const sectId of Object.keys(SECT_MEMBERSHIPS)) meetable.add(`hunter_${sectId}`);

// ── Obtainable items (fixpoint over recipes) ────────────────────────────
const obtainable = new Set<string>();
for (const shop of SHOPS) if (reachableLocations.has(shop.locationId)) shop.inventory.forEach((i) => obtainable.add(i));
for (const id of reachableResources) RESOURCES_BY_ID.get(id)?.yields.forEach((y) => obtainable.add(y.itemId));
for (const opp of meetable) OPPONENTS_BY_ID.get(opp)?.drops?.forEach((d) => obtainable.add(d.itemId));
for (const npc of NPCS) if (placedNpcs.has(npc.id)) npc.stealLoot?.forEach((d) => obtainable.add(d.itemId));
for (const eff of reachableEffects) if (eff.t === "giveItem") obtainable.add(eff.itemId);
const rewardItems = (q: QuestDef) => (q.rewards ?? []).flatMap((r) => (r.t === "item" ? [r.itemId] : []));
for (let changed = true; changed;) {
  changed = false;
  for (const q of QUESTS) for (const i of rewardItems(q)) if (!obtainable.has(i)) { obtainable.add(i); changed = true; }
  for (const r of RECIPES) {
    if (obtainable.has(r.output.itemId) || !r.inputs.every((inp) => obtainable.has(inp.itemId))) continue;
    obtainable.add(r.output.itemId); changed = true;
  }
}

// ── Condition satisfiability (optimistic about player-driven stats) ─────
function satisfiable(c: Condition, why: string[]): boolean {
  switch (c.t) {
    case "and": return c.all.every((x) => satisfiable(x, why));
    case "or": { const inner: string[] = []; const ok = c.any.some((x) => satisfiable(x, inner)); if (!ok) why.push(...inner); return ok; }
    case "not": return true; // negations gate order, not possibility
    case "hasItem": if (!ITEMS_BY_ID.has(c.itemId)) { why.push(`unknown item ${c.itemId}`); return false; }
      if (!obtainable.has(c.itemId)) { why.push(`item ${c.itemId} cannot be obtained`); return false; } return true;
    case "defeatedOpponent": if (!OPPONENTS_BY_ID.has(c.opponentId)) { why.push(`unknown opponent ${c.opponentId}`); return false; }
      if (!meetable.has(c.opponentId)) { why.push(`opponent ${c.opponentId} is never met`); return false; } return true;
    case "visitedLocation": if (!reachableLocations.has(c.locationId)) { why.push(`location ${c.locationId} unreachable`); return false; } return true;
    case "questStatus": if (!getQuest(c.questId)) { why.push(`unknown quest ${c.questId}`); return false; } return true;
    case "stoleFromNpc": case "assassinatedNpc": case "kidnappedNpc": case "npcRelationship":
      if (!placedNpcs.has(c.npcId)) { why.push(`NPC ${c.npcId} is not placed`); return false; } return true;
    default: return true;
  }
}

// ── Flags content can set ───────────────────────────────────────────────
const settableFlags = new Set<string>();
for (const eff of reachableEffects) if (eff.t === "setFlag") settableFlags.add(eff.flag);
function flagsIn(c: Condition): string[] {
  if (c.t === "and") return c.all.flatMap(flagsIn);
  if (c.t === "or") return c.any.flatMap(flagsIn);
  return c.t === "flag" ? [c.flag] : [];
}

// ── Per-quest verdicts ──────────────────────────────────────────────────
const blockers: string[] = [];
const effectFor = (t: "startQuest" | "advanceQuest" | "finishQuest", id: string) =>
  reachableEffects.some((e) => e.t === t && e.questId === id);
const startedBy = new Map<string, string>();
for (const q of QUESTS) {
  const problems: string[] = [];
  const viaNpc = !q.sectId && !!q.giverNpcId && placedNpcs.has(q.giverNpcId);
  const viaSect = !!q.sectId && !!SECT_MEMBERSHIPS[q.sectId as keyof typeof SECT_MEMBERSHIPS];
  const viaScene = effectFor("startQuest", q.id);
  if (!viaNpc && !viaSect && !viaScene) problems.push(`cannot start (giver ${q.giverNpcId ?? "none"} not placed, no sect, no startQuest)`);
  startedBy.set(q.id, viaNpc ? "npc" : viaSect ? "sect" : viaScene ? "scene" : "-");
  if (q.prereqs) { const why: string[] = []; if (!satisfiable(q.prereqs, why)) problems.push(`prereqs: ${why.join("; ")}`); }
  const sceneAdvance = effectFor("advanceQuest", q.id), sceneFinish = effectFor("finishQuest", q.id);
  // Each middle stage with neither autoAdvance nor objective needs its own
  // advanceQuest beat; the _complete scene only opens at the last stage, so
  // it can't carry the player past a middle one.
  const advanceBeats = reachableEffects.filter((e) => e.t === "advanceQuest" && e.questId === q.id).length;
  const manualStages = q.stages.filter((stage, index) => index < q.stages.length - 1 && !stage.autoAdvance && !stage.objective).length;
  if (manualStages > advanceBeats) problems.push(`${manualStages} middle stage(s) wait on a dialog beat but only ${advanceBeats} advanceQuest effect(s) exist — add an objective`);
  q.stages.forEach((stage, index) => {
    const last = index === q.stages.length - 1;
    for (const spot of stage.objective?.spots ?? []) {
      if (!reachableLocations.has(spot.locationId)) problems.push(`stage ${index} objective at unreachable ${spot.locationId}`);
      else if (!spot.npcId && !getLocationMap(spot.locationId)) problems.push(`stage ${index} objective at ${spot.locationId}, which has no map to place it on`);
      if (spot.sceneId && !SCENES_BY_ID.has(spot.sceneId)) problems.push(`stage ${index} objective opens missing scene ${spot.sceneId}`);
      if (spot.npcId && !NPCS.some((n) => n.id === spot.npcId && n.locationIds.includes(spot.locationId))) problems.push(`stage ${index} objective NPC ${spot.npcId} is not at ${spot.locationId}`);
    }
    if (stage.objective) return;
    if (stage.autoAdvance) {
      for (const flag of flagsIn(stage.autoAdvance)) if (!settableFlags.has(flag)) problems.push(`stage ${index} "${stage.id}" waits on flag ${flag} that nothing sets`);
      const why: string[] = [];
      if (!satisfiable(stage.autoAdvance, why)) problems.push(`stage ${index} "${stage.id}": ${why.join("; ")}`);
      return;
    }
    if (!last && !sceneAdvance && !sceneFinish) problems.push(`stage ${index} "${stage.id}" has no autoAdvance and no reachable advanceQuest`);
    if (last) {
      const turnIn = q.turnInNpcId ?? q.giverNpcId;
      const viaTurnIn = !!turnIn && placedNpcs.has(turnIn);
      if (!viaTurnIn && !sceneFinish && !sceneAdvance) problems.push(`last stage: no auto-finish, turn-in NPC ${turnIn ?? "none"} not placed, no reachable finishQuest`);
    }
  });
  if (problems.length) blockers.push(`${q.id} [${startedBy.get(q.id)}]\n    - ${problems.join("\n    - ")}`);
}

const orphanLocations = SCENES.filter((s) => s.kind === "location" && !reachableLocations.has(s.id)).map((s) => s.id);
if (orphanLocations.length) blockers.push(`unreachable locations (no route from ${START_SCENE_ID}): ${orphanLocations.join(", ")}`);
const counts = [...startedBy.values()].reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {});
console.log(`[quest-completion] ${QUESTS.length} quests · ${reachableLocations.size} reachable locations · ${placedNpcs.size} placed NPCs · ${meetable.size} meetable opponents · ${obtainable.size} obtainable items`);
console.log(`[quest-completion] start paths: ${JSON.stringify(counts)}`);
if (blockers.length) {
  console.log(`[quest-completion] ${blockers.length} quest(s) cannot be completed:\n  ${blockers.join("\n  ")}`);
  process.exit(1);
}
console.log("[quest-completion] OK — every quest can be started, progressed and finished.");
