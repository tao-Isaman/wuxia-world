"use client";

// The world store: the saved game (WorldStateData) and every action on it.
// The actions live in cohesive slices under store/world/actions/; the helpers
// they share (the per-action draft, time, progression, travel, spoils) in
// store/world/; the save's shape and migration in store/world/persist.ts.
// This file only assembles them, so the public API — useWorldStore and every
// action name and signature — is unchanged.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getQuestStatus, validateAndRepair } from "@/lib/world";
import { tickQuestProgress } from "@/lib/world/effects";
import type { WorldStore } from "./world/types";
import { draftFrom, emptyData } from "./world/state";
import { mergeSave, migrateSave, partializeSave } from "./world/persist";
import { gameActions } from "./world/actions/game";
import { sectsActions } from "./world/actions/sects";
import { travelActions } from "./world/actions/travel";
import { lettersActions } from "./world/actions/letters";
import { tournamentActions } from "./world/actions/tournament";
import { battleActions } from "./world/actions/battle";
import { encountersActions } from "./world/actions/encounters";
import { lifeActions } from "./world/actions/life";
import { trainingActions } from "./world/actions/training";
import { shopsActions } from "./world/actions/shops";
import { lawActions } from "./world/actions/law";
import { npcsActions } from "./world/actions/npcs";
import { questsActions } from "./world/actions/quests";

export { MERIDIAN_POINTS_PER_LEVEL } from "./world/progression";
export { TRAVEL_STAMINA_COST, REST_HOME_HOURS, SPAR_WIN_SCENE_ID, SPAR_LOSE_SCENE_ID, PRACTICE_STAMINA_COST, PRACTICE_HOURS } from "./world/rules";
export { HERO_BASE_HP } from "./world/state";
export type { GatherResult, CraftResult, BuyRecipeResult, BuyEquipResult, EquipResult, UnequipResult, UseItemResult, OpenMeridianNodeResult, PracticeMusicResult, LevelUpSkillResult, LevelUpArtResult, ForgetSkillResult, ForgetArtResult, PracticeResult, BuyResult, SellResult, BuyOfferResult, SparResult, QuestActionResult, BadActionResult, VictorySpoils, RestKind, RestResult, ActivityResult, RoamingFoe } from "./world/types";
export type { WorldStore } from "./world/types";

export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      ...gameActions(set, get),
      ...sectsActions(set, get),
      ...travelActions(set, get),
      ...lettersActions(set, get),
      ...tournamentActions(set, get),
      ...battleActions(set, get),
      ...encountersActions(set, get),
      ...lifeActions(set, get),
      ...trainingActions(set, get),
      ...shopsActions(set, get),
      ...lawActions(set, get),
      ...npcsActions(set, get),
      ...questsActions(set, get),
    }),
    {
      name: "wusia-world-v1",
      version: 25,
      // Content backfill also runs for current-version saves (see mergeSave).
      merge: mergeSave,
      // Only persist the data fields, not the action functions.
      partialize: partializeSave,
      // `migrate` is one idempotent normalizer (see migrateSave and docs/save-format.md).
      migrate: migrateSave,
      onRehydrateStorage: () => (state) => {
        if (state) validateAndRepair(state);
        // A save revived from the old game over (merge) is written back at
        // once, so a reload cannot charge the death a second time.
        if (state?.lastDeath) queueMicrotask(() => useWorldStore.setState({}));
      },
    },
  ),
);

// Quest stages waiting on items or kills re-check after ANY change to the bag
// or the kill tally, whichever action caused it (shop, craft, loot, gift, a
// scene effect…), so "10/10 in the log but the quest never advanced" can't
// happen. Only writes back when a stage actually moved.
useWorldStore.subscribe((s, prev) => {
  if (!s.hasGame || (s.inventory === prev.inventory && s.defeatedCounts === prev.defeatedCounts)) return;
  const draft = draftFrom(s);
  draft.quests = Object.fromEntries(Object.entries(s.quests).map(([id, q]) => [id, { ...q }]));
  tickQuestProgress(draft);
  const moved = Object.values(draft.quests).some((q) => {
    const before = s.quests[q.id];
    return !before || before.stage !== q.stage || before.status !== q.status;
  });
  if (moved) useWorldStore.setState({ ...draft });
});

// Re-export helpers commonly used alongside the store.
export { getQuestStatus };
