// Moving between scenes inside an action's draft: travel costs, the jail
// lock, dialog choices and auto-advance.
import { STAT_XP_PER_ACTION } from "@/lib/world/stat-progression";
import { followLeads } from "@/lib/world/rumor-engine";
import { WAYPOINT_FLAG, applyEffects, getItem, getQuest, getScene, type Choice, type SceneEffect, type WorldStateData } from "@/lib/world";
import { tickQuestProgress } from "@/lib/world/effects";
import { JAIL_SCENE_ID } from "@/lib/world/data/activities";
import { appendActionLog } from "./state";
import { grantStatXp, rollLukXp } from "./progression";
import { LOC_TO_ROUTE_HOURS, ROUTE_TO_LOC_HOURS } from "./rules";

// The two real overworld transitions (location → road, road → location);
// null for a story warp. Travel itself is free: stamina goes on fights and
// activities, never on the road.
export function travelTransitionHours(
  source: ReturnType<typeof getScene>,
  target: ReturnType<typeof getScene>,
): number | null {
  if (!source || !target) return null;
  if (source.kind === "location" && target.kind === "route") return LOC_TO_ROUTE_HOURS;
  if (source.kind === "route" && target.kind === "location") return ROUTE_TO_LOC_HOURS;
  return null;
}

/** While a sentence runs, no location or road outside the jail can be entered. */
export function jailBlocks(state: WorldStateData, targetSceneId: string): boolean {
  if (state.jailUntil == null || targetSceneId === JAIL_SCENE_ID) return false;
  const kind = getScene(targetSceneId)?.kind;
  return kind === "location" || kind === "route";
}

/** Whether the hero may go to a scene now: only a running sentence stops them (travel costs no stamina). */
export function canAffordTravelTo(state: WorldStateData, targetSceneId: string): boolean {
  if (state.currentSceneId === targetSceneId) return true;
  return !jailBlocks(state, targetSceneId);
}

// The two real overworld transitions (location → route, route → location)
// cost nothing but still train: AGI xp and a LUK roll. Story warps (dialog →
// anywhere, location → location, etc.) give neither. Returns false only when
// the jail keeps the hero in; callers abort the navigation then.
export function chargeTravelIfNeeded(state: WorldStateData, targetSceneId: string): boolean {
  if (state.currentSceneId === targetSceneId) return true;
  if (jailBlocks(state, targetSceneId)) return false;
  const target = getScene(targetSceneId);
  const source = getScene(state.currentSceneId);
  const hours = travelTransitionHours(source, target);
  if (hours === null) return true; // story warp — free
  // Overworld travel — grant AGI xp + roll for LUK.
  grantStatXp(state, "AGI", STAT_XP_PER_ACTION);
  rollLukXp(state);
  return true;
}

// Walk through `next` pointers on dialog scenes. Stops at the first scene
// that requires user input (any choices, route, or location). Updates
// `lastLocationId` whenever it lands on a location.
export function followAutoAdvance(state: WorldStateData): void {
  for (let i = 0; i < 32; i++) {
    const sc = getScene(state.currentSceneId);
    if (!sc) return;
    if (sc.kind === "location") {
      state.lastLocationId = state.currentSceneId;
      recordVisit(state, state.currentSceneId);
      // A rumor's lead followed here pays out once (lib/world/rumor-engine.ts followLeads).
      for (const found of followLeads(state, state.currentSceneId)) {
        const item = found.itemId ? getItem(found.itemId)?.name : null;
        appendActionLog(state, "lead", `ตามข่าวลือมาถึง${sc.name}${item ? ` พบ${item}` : " พบร่องรอยตามที่เล่าลือ"} · +${found.wExp} ประสบการณ์ยุทธ`);
      }
      tickQuestProgress(state);
      return; // locations wait for the player
    }
    if (sc.kind === "route") return; // routes wait for the player
    // dialog
    if (sc.choices && sc.choices.length > 0) return;
    if (!sc.next) return; // terminal dialog → wait for "ปิด" click
    state.currentSceneId = sc.next;
    const next = getScene(state.currentSceneId);
    if (next?.onEnter) applyEffects(state, next.onEnter);
  }
}

// Effects might end with `triggerBattle`, in which case we suspend navigation
// (the battle-bridge will start the battle; acknowledgeBattleResult resumes).
//
// Returns false when the choice required overworld travel and the player
// couldn't afford the stamina cost — caller discards the draft.
export function takeChoice(state: WorldStateData, choice: Choice): boolean {
  // Pre-flight: refuse the whole choice (effects + nav) when the jail keeps
  // the hero in, so a locked-in hero can't trigger its side effects.
  if (!canAffordTravelTo(state, choice.next)) return false;

  const effects: readonly SceneEffect[] = choice.effects ?? [];
  // Quests this choice accepts (an offer's รับ choice): log them as the NPC
  // card's accept does.
  const accepting = effects.flatMap((e) => (e.t === "startQuest" && !state.quests[e.questId] ? [e.questId] : []));
  applyEffects(state, effects);
  for (const id of accepting) {
    if (state.quests[id]) appendActionLog(state, "quest", `รับภารกิจ: ${getQuest(id)?.name ?? id}`);
  }
  if (state.pendingBattle) {
    // Battle suspends scene navigation; the onWin/onLose path overrides `next`.
    return true;
  }
  // Overworld travel is free; it only trains AGI / LUK.
  if (!chargeTravelIfNeeded(state, choice.next)) return false;
  state.currentSceneId = choice.next;
  const sc = getScene(state.currentSceneId);
  if (sc?.onEnter) applyEffects(state, sc.onEnter);
  followAutoAdvance(state);
  return true;
}

// Record a location visit for `Condition.visitedLocation` lookups. Idempotent.
export function recordVisit(state: WorldStateData, locationId: string): void {
  if (!state.visitedLocationIds.includes(locationId)) {
    state.visitedLocationIds.push(locationId);
  }
  // Reaching the world map's waypoint ends it.
  if (state.flags[WAYPOINT_FLAG] === locationId) {
    const flags = { ...state.flags };
    delete flags[WAYPOINT_FLAG];
    state.flags = flags;
    const place = getScene(locationId);
    appendActionLog(state, "travel", `ถึง${place?.kind === "location" ? place.name : "จุดหมาย"}แล้ว · จุดหมายบนแผนที่สิ้นสุด`);
  }
}
