// Dialog choices and moving between scenes (roads, horse stations).
import { hasStation, stationTrips } from "@/lib/world/stations";
import { applyEffects, getScene } from "@/lib/world";
import { evaluateCondition } from "@/lib/world/conditions";
import { advanceTime } from "../lifecycle";
import { canAffordTravelTo, chargeTravelIfNeeded, followAutoAdvance, jailBlocks, takeChoice } from "../navigation";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const travelActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "makeChoice" | "travelRoute" | "gotoScene" | "exitToLocation" | "canTravelTo" | "stationTravel"> => ({
  makeChoice: (idx) => {
    const s = get();
    if (!s.hasGame || s.pendingBattle) return;
    const sc = getScene(s.currentSceneId);
    if (sc?.kind !== "dialog" || !sc.choices) return;
    const choice = sc.choices[idx];
    if (!choice) return;
    const draft = draftFrom(s);
    // Drop the draft entirely if takeChoice refuses (e.g., stamina too
    // low for a travel-bearing choice). State stays exactly as it was.
    if (!takeChoice(draft, choice)) return;
    set({ ...draft });
  },

  travelRoute: (locationId) => {
    const s = get();
    if (!s.hasGame || s.pendingBattle || s.pendingEncounter || s.gameOver) return;
    const scene = getScene(s.currentSceneId);
    if (scene?.kind !== "route") return;
    const destination = scene.destinations.find((d) => d.locationId === locationId &&
      (!d.visibleIf || evaluateCondition(s, d.visibleIf)));
    if (!destination || !getScene(locationId)) return;
    const draft = draftFrom(s);
    if (!takeChoice(draft, { text: destination.label, next: locationId, effects: destination.effects })) return;
    set({ ...draft });
  },

  gotoScene: (sceneId) => {
    if (!getScene(sceneId)) {
      console.warn(`[world] gotoScene: unknown scene "${sceneId}"`);
      return;
    }
    const draft = draftFrom(get());
    if (jailBlocks(draft, sceneId)) return;
    // Refuse the move entirely when stamina is too low for an overworld
    // travel hop — UI buttons should also be disabled, but defend here
    // in case something slips through.
    if (!chargeTravelIfNeeded(draft, sceneId)) return;
    draft.currentSceneId = sceneId;
    const sc = getScene(sceneId);
    if (sc?.onEnter) applyEffects(draft, sc.onEnter);
    followAutoAdvance(draft);
    set({ ...draft });
  },

  exitToLocation: () => {
    const s = get();
    if (!s.lastLocationId) return;
    if (s.lastLocationId === s.currentSceneId) return;
    const draft = draftFrom(s);
    // No travel cost — exiting a dialog back to where you already are
    // isn't movement.
    draft.currentSceneId = draft.lastLocationId!;
    const sc = getScene(draft.currentSceneId);
    if (sc?.onEnter) applyEffects(draft, sc.onEnter);
    followAutoAdvance(draft);
    set({ ...draft });
  },

  canTravelTo: (sceneId) => canAffordTravelTo(get(), sceneId),

  stationTravel: (to) => {
    const s = get();
    if (!hasStation(s.currentSceneId)) return { ok: false, reason: "no-station" };
    const trip = stationTrips(s, s.currentSceneId).find((t) => t.to === to);
    if (!trip) return { ok: false, reason: "unknown" };
    if (s.gold < trip.gold) return { ok: false, reason: "gold" };
    const draft = draftFrom(s);
    draft.gold -= trip.gold;
    advanceTime(draft, trip.hours);
    appendActionLog(draft, "travel", `ขี่ม้าจากสถานีพักม้าไป${(getScene(to) as { name?: string } | null)?.name ?? to} · ${trip.gold} ตำลึง`);
    draft.currentSceneId = to;
    const sc = getScene(to);
    if (sc?.onEnter) applyEffects(draft, sc.onEnter);
    followAutoAdvance(draft);
    set({ ...draft, roamingFoes: [] });
    return { ok: true };
  },
});
