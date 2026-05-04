"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterBuild } from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import {
  applyEffects,
  getScene,
  getQuestStatus,
  START_SCENE_ID,
  validateAndRepair,
  type Choice,
  type SceneEffect,
  type WorldStateData,
} from "@/lib/world";

// ─── Starter build ─────────────────────────────────────────────────────
// All stats at 1, single basic_punch skill, no art, no equipment.
// This is the world's standalone player template — completely independent
// of the /debug setup-tab character. Future progression mutates this build
// in the world store, not in character-store.
const STARTER_BUILD = (): CharacterBuild => ({
  name: "ผู้กล้า",
  stats: { STR: 1, AGI: 1, POW: 1, VIT: 1, DEX: 1, LUK: 1, DEF: 1, INT: 1 },
  artId: "none",
  artLevel: 1,
  skillIds: ["basic_punch", null, null, null, null],
  equipment: {
    W: null, A: null, H: null, B: null,
    BR: [null, null], R: [null, null], C: [null, null],
  },
});

interface WorldStore extends WorldStateData {
  // Actions
  startNewGame: () => void;
  makeChoice: (idx: number) => void;
  gotoScene: (sceneId: string) => void;
  clearPendingBattle: () => void;
  // After a battle finishes (state.winner set), the world UI calls this when
  // the user clicks "ดำเนินเรื่อง". It routes to onWin/onLose, clears
  // pendingBattle, and resets the battle store.
  acknowledgeBattleResult: () => void;
  resetGame: () => void;

  // Debug helpers (dev-only consumers).
  _setFlag: (flag: string, value: boolean | number | string) => void;
  _giveGold: (amount: number) => void;
}

const emptyData = (): WorldStateData => ({
  hasGame: false,
  playerBuild: null,
  currentSceneId: START_SCENE_ID,
  flags: {},
  quests: {},
  inventory: {},
  gold: 0,
  pendingBattle: null,
});

// Drains chained `next` pointers: scenes that auto-advance with no choices
// jump immediately to their `next`. Caps at 32 hops to stop accidental loops.
function followAutoAdvance(state: WorldStateData): void {
  for (let i = 0; i < 32; i++) {
    const sc = getScene(state.currentSceneId);
    if (!sc) return;
    if (sc.choices && sc.choices.length > 0) return;
    if (!sc.next) return;
    state.currentSceneId = sc.next;
    if (sc.onEnter) applyEffects(state, sc.onEnter);
  }
}

// Effects might end with `triggerBattle`, in which case we suspend navigation
// (the battle-bridge will start the battle; acknowledgeBattleResult resumes).
function takeChoice(state: WorldStateData, choice: Choice): void {
  const effects: readonly SceneEffect[] = choice.effects ?? [];
  applyEffects(state, effects);
  if (state.pendingBattle) {
    // Battle suspends scene navigation; the onWin/onLose path overrides `next`.
    return;
  }
  state.currentSceneId = choice.next;
  const sc = getScene(state.currentSceneId);
  if (sc?.onEnter) applyEffects(state, sc.onEnter);
  followAutoAdvance(state);
}

export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      ...emptyData(),

      startNewGame: () => {
        set({
          ...emptyData(),
          hasGame: true,
          playerBuild: STARTER_BUILD(),
          currentSceneId: START_SCENE_ID,
        });
        // Run start scene's onEnter + auto-advance through any chained scenes.
        const draft = { ...get() };
        const start = getScene(START_SCENE_ID);
        if (start?.onEnter) applyEffects(draft, start.onEnter);
        followAutoAdvance(draft);
        set({ ...draft });
      },

      makeChoice: (idx) => {
        const s = get();
        if (!s.hasGame || s.pendingBattle) return;
        const sc = getScene(s.currentSceneId);
        if (!sc?.choices) return;
        const choice = sc.choices[idx];
        if (!choice) return;
        const draft: WorldStateData = {
          hasGame: s.hasGame,
          playerBuild: s.playerBuild,
          currentSceneId: s.currentSceneId,
          flags: { ...s.flags },
          quests: { ...s.quests },
          inventory: { ...s.inventory },
          gold: s.gold,
          pendingBattle: s.pendingBattle,
        };
        takeChoice(draft, choice);
        set({ ...draft });
      },

      gotoScene: (sceneId) => {
        if (!getScene(sceneId)) {
          console.warn(`[world] gotoScene: unknown scene "${sceneId}"`);
          return;
        }
        const s = get();
        const draft: WorldStateData = {
          hasGame: s.hasGame,
          playerBuild: s.playerBuild,
          currentSceneId: sceneId,
          flags: { ...s.flags },
          quests: { ...s.quests },
          inventory: { ...s.inventory },
          gold: s.gold,
          pendingBattle: s.pendingBattle,
        };
        const sc = getScene(sceneId);
        if (sc?.onEnter) applyEffects(draft, sc.onEnter);
        followAutoAdvance(draft);
        set({ ...draft });
      },

      clearPendingBattle: () => set({ pendingBattle: null }),

      acknowledgeBattleResult: () => {
        const s = get();
        if (!s.pendingBattle) return;
        const battleState = useBattleStore.getState().state;
        const winner = battleState?.winner;
        if (!winner) return;
        const dest = winner === "A" ? s.pendingBattle.onWin : s.pendingBattle.onLose;
        // Clear the seam first, then navigate (so re-entry doesn't trigger).
        set({ pendingBattle: null });
        useBattleStore.getState().reset();
        get().gotoScene(dest);
      },

      resetGame: () => {
        // Also tear down any in-flight battle so nothing dangles after wipe.
        useBattleStore.getState().reset();
        set({ ...emptyData() });
      },

      _setFlag: (flag, value) =>
        set((s) => ({ flags: { ...s.flags, [flag]: value } })),

      _giveGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold + amount) })),
    }),
    {
      name: "wusia-world-v1",
      version: 1,
      // Only persist the data fields, not the action functions.
      partialize: (s) => ({
        hasGame: s.hasGame,
        playerBuild: s.playerBuild,
        currentSceneId: s.currentSceneId,
        flags: s.flags,
        quests: s.quests,
        inventory: s.inventory,
        gold: s.gold,
        pendingBattle: s.pendingBattle,
      }),
      migrate: (persisted) => persisted as WorldStateData,
      onRehydrateStorage: () => (state) => {
        if (state) validateAndRepair(state);
      },
    },
  ),
);

// Re-export helpers commonly used alongside the store.
export { getQuestStatus };
