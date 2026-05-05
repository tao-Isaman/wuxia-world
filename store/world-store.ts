"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterBuild } from "@/lib/game";
import { getEquip } from "@/lib/game";
import { useBattleStore } from "@/store/battle-store";
import {
  applyEffects,
  gatherSuccessChance,
  getItem,
  getRecipe,
  getResource,
  getScene,
  getQuestStatus,
  LIFE_SKILL_KEYS,
  masteryLevel,
  pickWeighted,
  START_SCENE_ID,
  validateAndRepair,
  type Choice,
  type LifeSkill,
  type ResourceDef,
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

const STARTER_STAMINA = 100;
const STAMINA_REGEN_PER_LEAF = 5;       // recovered each time the player walks into a location
const HUNT_XP_MULT = 8;                 // hunting xp = 8 * resourceLevel (combat is risky)
const GATHER_XP_MULT = 5;               // non-combat xp = 5 * resourceLevel
const CRAFT_XP_MULT = 5;                // craft xp = 5 * recipe.requiredMastery
const FAIL_XP_FRACTION = 0.5;           // failed drop checks still teach you — half xp
// Sentinel mastery used for recipes with no skill — always passes the gate.
const MAX_DUMMY_LEVEL = 99;

// Result of a gather attempt — surfaced so the UI can show a small banner.
// On a fresh successful non-combat gather: type "yield". On hunting: type
// "battle" (the spoils land via acknowledgeBattleResult once the fight ends).
//
// `dropCheck` distinguishes a clean failure ("passed", but the weighted
// picks happened to land on nothing) from the explicit mastery-vs-level
// drop-check failure ("failed", the player wasn't skilled enough this round).
export type GatherResult =
  | { ok: false; reason: "stamina" | "no-build" | "missing" | "unknown" }
  | {
      ok: true;
      type: "yield";
      resourceId: string;
      items: { itemId: string; count: number }[];
      xpGained: number;
      skill: LifeSkill;
      dropCheck: "passed" | "failed";
      successChance: number;
    }
  | { ok: true; type: "battle"; resourceId: string; opponentId: string };

export type CraftResult =
  | { ok: false; reason: "missing-input" | "missing-mastery" | "unknown" }
  | {
      ok: true;
      recipeId: string;
      outputItemId: string;
      outputCount: number;
      xpGained: number;
      dropCheck: "passed" | "failed" | "none";
    };

// Result of using a consumable item (book, song book, image, etc.).
export type UseItemResult =
  | { ok: false; reason: "unknown" | "missing" | "no-effect" }
  | { ok: true; itemId: string; skill: LifeSkill; xpGained: number };

// Result of clicking the "เล่นเพลง" practice button.
export type PracticeMusicResult =
  | { ok: false; reason: "no-instrument" | "no-build" }
  | { ok: true; xpGained: number };

// Practice xp granted per "เล่นเพลง" click. Small so the loop isn't trivial
// to grind — books and song books are the bigger xp source.
const PRACTICE_MUSIC_XP = 10;

interface WorldStore extends WorldStateData {
  // Actions
  startNewGame: () => void;
  makeChoice: (idx: number) => void;
  gotoScene: (sceneId: string) => void;
  // Used by the "ปิด" button on terminal dialogs and by the route-screen
  // back button. No-op if lastLocationId is null (very early in a fresh game).
  exitToLocation: () => void;
  clearPendingBattle: () => void;
  // After a battle finishes (state.winner set), the world UI calls this when
  // the user clicks "ดำเนินเรื่อง". It routes to onWin/onLose, clears
  // pendingBattle, and resets the battle store. If a hunt was in flight,
  // the spoils are dropped here on win.
  acknowledgeBattleResult: () => void;
  resetGame: () => void;

  // Activity actions
  gatherResource: (resourceId: string) => GatherResult;
  craftRecipe: (recipeId: string) => CraftResult;
  useItem: (itemId: string) => UseItemResult;
  practiceMusic: () => PracticeMusicResult;

  // Debug helpers (dev-only consumers).
  _setFlag: (flag: string, value: boolean | number | string) => void;
  _giveGold: (amount: number) => void;
}

const emptyLifeSkillXp = (): Record<LifeSkill, number> =>
  Object.fromEntries(LIFE_SKILL_KEYS.map((k) => [k, 0])) as Record<LifeSkill, number>;

const emptyData = (): WorldStateData => ({
  hasGame: false,
  playerBuild: null,
  currentSceneId: START_SCENE_ID,
  lastLocationId: null,
  flags: {},
  quests: {},
  inventory: {},
  gold: 0,
  stamina: STARTER_STAMINA,
  staminaMax: STARTER_STAMINA,
  lifeSkillXp: emptyLifeSkillXp(),
  pendingBattle: null,
  pendingHuntYield: null,
});

// Walk through `next` pointers on dialog scenes. Stops at the first scene
// that requires user input (any choices, route, or location). Updates
// `lastLocationId` whenever it lands on a location, and ticks stamina regen
// on each leaf entry (with a full reset at home_player).
function followAutoAdvance(state: WorldStateData): void {
  for (let i = 0; i < 32; i++) {
    const sc = getScene(state.currentSceneId);
    if (!sc) return;
    if (sc.kind === "location") {
      const arrivedAtNewLeaf = state.lastLocationId !== state.currentSceneId;
      state.lastLocationId = state.currentSceneId;
      if (arrivedAtNewLeaf) regenStaminaOnArrival(state);
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

function regenStaminaOnArrival(state: WorldStateData): void {
  if (state.currentSceneId === "home_player") {
    state.stamina = state.staminaMax;
    return;
  }
  state.stamina = Math.min(state.staminaMax, state.stamina + STAMINA_REGEN_PER_LEAF);
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

// Shallow-clone the data fields so the persisted slice picks up the change.
function draftFrom(s: WorldStateData): WorldStateData {
  return {
    hasGame: s.hasGame,
    playerBuild: s.playerBuild,
    currentSceneId: s.currentSceneId,
    lastLocationId: s.lastLocationId,
    flags: { ...s.flags },
    quests: { ...s.quests },
    inventory: { ...s.inventory },
    gold: s.gold,
    stamina: s.stamina,
    staminaMax: s.staminaMax,
    lifeSkillXp: { ...s.lifeSkillXp },
    pendingBattle: s.pendingBattle,
    pendingHuntYield: s.pendingHuntYield,
  };
}

// Roll a yield. Two-stage:
//   1. Drop check — single mastery-vs-level roll. If it fails, no items.
//   2. Pick count — mastery surplus above the resource level adds picks
//      (clamped 1..3) so a level-5 mastery farming a level-1 node sees a
//      reliable boost without drowning the inventory.
function rollResourceYield(
  resource: ResourceDef,
  masteryLv: number,
): { items: { itemId: string; count: number }[]; passed: boolean } {
  const passed = Math.random() < gatherSuccessChance(masteryLv, resource.level);
  if (!passed) return { items: [], passed: false };

  const surplus = masteryLv - resource.level;
  let picks = 1;
  if (surplus >= 1) picks++;
  if (surplus >= 3) picks++;
  picks = Math.max(1, Math.min(3, picks));

  const merged: Record<string, number> = {};
  for (let i = 0; i < picks; i++) {
    const drop = pickWeighted(resource.yields, Math.random());
    if (!drop) continue;
    const min = drop.count?.[0] ?? 1;
    const max = drop.count?.[1] ?? 1;
    const c = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    merged[drop.itemId] = (merged[drop.itemId] ?? 0) + c;
  }
  return {
    items: Object.entries(merged).map(([itemId, count]) => ({ itemId, count })),
    passed: true,
  };
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
        const draft = draftFrom(get());
        const start = getScene(START_SCENE_ID);
        if (start?.onEnter) applyEffects(draft, start.onEnter);
        followAutoAdvance(draft);
        set({ ...draft });
      },

      makeChoice: (idx) => {
        const s = get();
        if (!s.hasGame || s.pendingBattle) return;
        const sc = getScene(s.currentSceneId);
        if (sc?.kind !== "dialog" || !sc.choices) return;
        const choice = sc.choices[idx];
        if (!choice) return;
        const draft = draftFrom(s);
        takeChoice(draft, choice);
        set({ ...draft });
      },

      gotoScene: (sceneId) => {
        if (!getScene(sceneId)) {
          console.warn(`[world] gotoScene: unknown scene "${sceneId}"`);
          return;
        }
        const draft = draftFrom(get());
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
        draft.currentSceneId = draft.lastLocationId!;
        const sc = getScene(draft.currentSceneId);
        if (sc?.onEnter) applyEffects(draft, sc.onEnter);
        followAutoAdvance(draft);
        set({ ...draft });
      },

      clearPendingBattle: () => set({ pendingBattle: null, pendingHuntYield: null }),

      acknowledgeBattleResult: () => {
        const s = get();
        if (!s.pendingBattle) return;
        const battleState = useBattleStore.getState().state;
        const winner = battleState?.winner;
        if (!winner) return;
        const dest = winner === "A" ? s.pendingBattle.onWin : s.pendingBattle.onLose;

        // If a hunt was in flight, the win-side gets the spoils. Lose → nothing.
        const draft = draftFrom(s);
        draft.pendingBattle = null;
        const hunt = draft.pendingHuntYield;
        draft.pendingHuntYield = null;
        if (winner === "A" && hunt) {
          const res = getResource(hunt.resourceId);
          if (res) {
            const lvl = masteryLevel(draft.lifeSkillXp[res.skill] ?? 0);
            const yieldRoll = rollResourceYield(res, lvl);
            for (const it of yieldRoll.items) {
              draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
            }
            // Win + drop-check pass = full xp; win + check-fail (carcass
            // unusable) = half xp. Losing the battle gives no xp at all.
            const xp = HUNT_XP_MULT * res.level;
            draft.lifeSkillXp[res.skill] =
              (draft.lifeSkillXp[res.skill] ?? 0) + (yieldRoll.passed ? xp : Math.floor(xp * FAIL_XP_FRACTION));
          }
        }
        set({ ...draft });
        useBattleStore.getState().reset();
        get().gotoScene(dest);
      },

      resetGame: () => {
        // Also tear down any in-flight battle so nothing dangles after wipe.
        useBattleStore.getState().reset();
        set({ ...emptyData() });
      },

      gatherResource: (resourceId) => {
        const s = get();
        const res = getResource(resourceId);
        if (!res) return { ok: false, reason: "unknown" };
        if (!s.playerBuild) return { ok: false, reason: "no-build" };
        if (s.stamina < res.staminaCost) return { ok: false, reason: "stamina" };

        // Hunting: spend stamina, queue a battle. Spoils land in
        // acknowledgeBattleResult on win.
        if (res.skill === "hunting" && res.opponentIds && res.opponentIds.length > 0) {
          const oppId =
            res.opponentIds[Math.floor(Math.random() * res.opponentIds.length)]!;
          const draft = draftFrom(s);
          draft.stamina = Math.max(0, draft.stamina - res.staminaCost);
          draft.pendingHuntYield = {
            resourceId: res.id,
            returnSceneId: s.currentSceneId,
          };
          draft.pendingBattle = {
            opponentId: oppId,
            onWin: s.currentSceneId,
            onLose: s.currentSceneId,
          };
          // Suppress the post-battle return-roll just like other on-enter events.
          draft.flags._skipEventRoll = true;
          set({ ...draft });
          return { ok: true, type: "battle", resourceId: res.id, opponentId: oppId };
        }

        // Non-combat: spend stamina, roll drop check + yield, grant xp.
        // Failed checks still give half xp — low-tier grinding is the
        // legitimate path to higher mastery. Begging-style activities pay
        // an extra stamina hit only when the drop check fails.
        const draft = draftFrom(s);
        draft.stamina = Math.max(0, draft.stamina - res.staminaCost);
        const lvl = masteryLevel(draft.lifeSkillXp[res.skill] ?? 0);
        const successChance = gatherSuccessChance(lvl, res.level);
        const yieldRoll = rollResourceYield(res, lvl);
        for (const it of yieldRoll.items) {
          draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
        }
        // Drop-check pass also pays out gold for begging / chess activities.
        if (yieldRoll.passed && res.goldYield) {
          const [g0, g1] = res.goldYield;
          const gold = g0 + Math.floor(Math.random() * Math.max(1, g1 - g0 + 1));
          draft.gold = Math.max(0, draft.gold + gold);
        }
        // Extra failure stamina cost (used by begging — botched approach
        // costs 2× the listed stamina total).
        if (!yieldRoll.passed && res.failureExtraStamina) {
          draft.stamina = Math.max(0, draft.stamina - res.failureExtraStamina);
        }
        const fullXp = GATHER_XP_MULT * res.level;
        const xpGained = yieldRoll.passed ? fullXp : Math.floor(fullXp * FAIL_XP_FRACTION);
        draft.lifeSkillXp[res.skill] = (draft.lifeSkillXp[res.skill] ?? 0) + xpGained;
        set({ ...draft });
        return {
          ok: true,
          type: "yield",
          resourceId: res.id,
          items: yieldRoll.items,
          xpGained,
          skill: res.skill,
          dropCheck: yieldRoll.passed ? "passed" : "failed",
          successChance,
        };
      },

      craftRecipe: (recipeId) => {
        const s = get();
        const r = getRecipe(recipeId);
        if (!r) return { ok: false, reason: "unknown" };

        // Mastery gate — recipes can require a minimum mastery level on
        // their `skill`. Below the threshold we refuse the attempt before
        // touching the inventory.
        const required = r.requiredMastery ?? 1;
        const skill = r.skill;
        const masteryLv = skill ? masteryLevel(s.lifeSkillXp[skill] ?? 0) : MAX_DUMMY_LEVEL;
        if (skill && masteryLv < required) {
          return { ok: false, reason: "missing-mastery" };
        }

        for (const inp of r.inputs) {
          if ((s.inventory[inp.itemId] ?? 0) < inp.count) {
            return { ok: false, reason: "missing-input" };
          }
        }

        const draft = draftFrom(s);
        // Inputs are consumed regardless of drop-check outcome — failed
        // craft = ingredients lost, success = ingredients lost + output.
        for (const inp of r.inputs) {
          const cur = draft.inventory[inp.itemId] ?? 0;
          const next = cur - inp.count;
          if (next <= 0) delete draft.inventory[inp.itemId];
          else draft.inventory[inp.itemId] = next;
        }

        let dropCheck: "passed" | "failed" | "none" = "none";
        let outputProduced = false;
        if (r.usesDropCheck) {
          const passed = Math.random() < gatherSuccessChance(masteryLv, required);
          dropCheck = passed ? "passed" : "failed";
          outputProduced = passed;
        } else {
          outputProduced = true;
        }

        if (outputProduced) {
          draft.inventory[r.output.itemId] =
            (draft.inventory[r.output.itemId] ?? 0) + r.output.count;
        }

        // XP scales with recipe required mastery; failed drop-checks still
        // teach you something (half xp).
        const fullXp = CRAFT_XP_MULT * required;
        const xpGained = dropCheck === "failed" ? Math.floor(fullXp * FAIL_XP_FRACTION) : fullXp;
        if (skill) {
          draft.lifeSkillXp[skill] = (draft.lifeSkillXp[skill] ?? 0) + xpGained;
        }
        set({ ...draft });
        return {
          ok: true,
          recipeId: r.id,
          outputItemId: r.output.itemId,
          outputCount: outputProduced ? r.output.count : 0,
          xpGained,
          dropCheck,
        };
      },

      useItem: (itemId) => {
        const s = get();
        const def = getItem(itemId);
        if (!def) return { ok: false, reason: "unknown" };
        if ((s.inventory[itemId] ?? 0) <= 0) return { ok: false, reason: "missing" };
        if (!def.use) return { ok: false, reason: "no-effect" };

        const draft = draftFrom(s);
        // Consume one count.
        const cur = draft.inventory[itemId] ?? 0;
        if (cur <= 1) delete draft.inventory[itemId];
        else draft.inventory[itemId] = cur - 1;

        const eff = def.use;
        if (eff.t === "trainSkill") {
          draft.lifeSkillXp[eff.skill] = (draft.lifeSkillXp[eff.skill] ?? 0) + eff.xp;
          set({ ...draft });
          return { ok: true, itemId, skill: eff.skill, xpGained: eff.xp };
        }
        // Unknown effect t — fall through; no xp granted but item consumed.
        set({ ...draft });
        return { ok: false, reason: "no-effect" };
      },

      practiceMusic: () => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "no-build" };
        const wId = s.playerBuild.equipment.W;
        const w = getEquip(wId);
        if (!w?.instrument) return { ok: false, reason: "no-instrument" };
        const draft = draftFrom(s);
        draft.lifeSkillXp.music = (draft.lifeSkillXp.music ?? 0) + PRACTICE_MUSIC_XP;
        set({ ...draft });
        return { ok: true, xpGained: PRACTICE_MUSIC_XP };
      },

      _setFlag: (flag, value) =>
        set((s) => ({ flags: { ...s.flags, [flag]: value } })),

      _giveGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold + amount) })),
    }),
    {
      name: "wusia-world-v1",
      version: 3,
      // Only persist the data fields, not the action functions.
      partialize: (s) => ({
        hasGame: s.hasGame,
        playerBuild: s.playerBuild,
        currentSceneId: s.currentSceneId,
        lastLocationId: s.lastLocationId,
        flags: s.flags,
        quests: s.quests,
        inventory: s.inventory,
        gold: s.gold,
        stamina: s.stamina,
        staminaMax: s.staminaMax,
        lifeSkillXp: s.lifeSkillXp,
        pendingBattle: s.pendingBattle,
        pendingHuntYield: s.pendingHuntYield,
      }),
      // Migrations:
      //   v1 → v2 added stamina, staminaMax, lifeSkillXp (6 keys),
      //            pendingHuntYield.
      //   v2 → v3 grew lifeSkillXp from 6 → 17 keys (added cultural,
      //            social, crafting families). Existing xp values are
      //            preserved; missing keys default to 0.
      migrate: (persisted, fromVersion) => {
        const p = (persisted ?? {}) as Partial<WorldStateData>;
        const out: WorldStateData = {
          ...emptyData(),
          ...p,
          stamina: typeof p.stamina === "number" ? p.stamina : STARTER_STAMINA,
          staminaMax: typeof p.staminaMax === "number" ? p.staminaMax : STARTER_STAMINA,
          // Merge: empty defaults first, then any persisted values overlay.
          lifeSkillXp: { ...emptyLifeSkillXp(), ...(p.lifeSkillXp ?? {}) } as Record<LifeSkill, number>,
          pendingHuntYield: p.pendingHuntYield ?? null,
        };
        void fromVersion;
        return out;
      },
      onRehydrateStorage: () => (state) => {
        if (state) validateAndRepair(state);
      },
    },
  ),
);

// Re-export helpers commonly used alongside the store.
export { getQuestStatus };
