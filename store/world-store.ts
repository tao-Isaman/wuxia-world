"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterBuild, StatKey } from "@/lib/game";
import {
  deriveAll,
  encodeArtSlot,
  getEquip,
  getSkill,
  isArtSlot,
  parseSlotId,
  placeInFirstEmpty,
  SKILL_LEVEL_MAX,
  STAT_KEYS,
  xpToNextLevel,
} from "@/lib/game";
import {
  lukRollChance,
  statFromLifeSkill,
  STAT_XP_PER_ACTION,
  xpToNextStatLevel,
} from "@/lib/world/stat-progression";
import { useBattleStore } from "@/store/battle-store";
import {
  applyEffects,
  gatherSuccessChance,
  getItem,
  getNpc,
  getRecipe,
  getResource,
  getScene,
  getQuestStatus,
  LIFE_SKILL_KEYS,
  masteryLevel,
  pickWeighted,
  START_SCENE_ID,
  TRAIT_KEYS,
  validateAndRepair,
  type Choice,
  type LifeSkill,
  type ResourceDef,
  type SceneEffect,
  type TraitKey,
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
  skillIds: ["basic_punch", null, null, null, null, null, null, null, null, null],
  equipment: {
    W: null, A: null, H: null, B: null,
    BR: [null, null], R: [null, null], C: [null, null],
  },
  learnedSkillIds: ["basic_punch"],
  learnedArtIds: [],
  artLevels: {},
});

const STARTER_STAMINA = 100;
const HUNT_XP_MULT = 8;                 // hunting xp = 8 * resourceLevel (combat is risky)
const GATHER_XP_MULT = 5;               // non-combat xp = 5 * resourceLevel
const CRAFT_XP_MULT = 5;                // craft xp = 5 * recipe.requiredMastery
const FAIL_XP_FRACTION = 0.5;           // failed drop checks still teach you — half xp
// Sentinel mastery used for recipes with no skill — always passes the gate.
const MAX_DUMMY_LEVEL = 99;

// Game-time costs. `HOURS_PER_DAY` = 12 ชั่วยาม.
const HOURS_PER_DAY = 12;
// Stepping out of a location onto a road is the cheap half of a journey;
// arriving at a destination from the road is the expensive half.
const LOC_TO_ROUTE_HOURS = 1;
const ROUTE_TO_LOC_HOURS = 2;
// Stamina spent on every overworld travel (location → route or route →
// location). Exported so the UI can disable buttons when the player can't
// afford the move.
export const TRAVEL_STAMINA_COST = 10;
const ACTION_HOURS = 0.2;
const FIGHT_HOURS = 0.5;
const FIGHT_STAMINA = 5;
const REST_HOURS = 12;
const REST_INN_COST = 300;

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

// Result of using a consumable item (book, song book, image, potion, …).
// Discriminated on `kind` so the UI can render different feedback per use.
export type UseItemResult =
  | { ok: false; reason: "unknown" | "missing" | "no-effect" | "no-build" | "full" }
  | { ok: true; kind: "trainSkill"; itemId: string; skill: LifeSkill; xpGained: number }
  | {
      ok: true;
      kind: "heal";
      itemId: string;
      hpHealed: number;
      mpHealed: number;
    };

// Result of clicking the "เล่นเพลง" practice button.
export type PracticeMusicResult =
  | { ok: false; reason: "no-instrument" | "no-build" }
  | { ok: true; xpGained: number };

// Result of attempting to level up a move skill via either xp source.
export type LevelUpSkillResult =
  | { ok: false; reason: "unknown" | "maxed" | "insufficient" }
  | { ok: true; skillId: string; level: number; cost: number };

// ─── Shop / sect-hall result types ────────────────────────────────────
export type BuyResult =
  | { ok: false; reason: "unknown" | "not-for-sale" | "no-gold" }
  | { ok: true; itemId: string; count: number; spent: number };

export type SellResult =
  | { ok: false; reason: "unknown" | "missing" | "not-accepted" | "unsellable" }
  | { ok: true; itemId: string; count: number; gained: number };

export type BuyOfferResult =
  | { ok: false; reason: "unknown" | "no-gold" | "already-learned" }
  | { ok: true; id: string; spent: number };

// Result of attempting to start a sparring match with a registered NPC.
// `unsupported` means the NPC has no `sparOpponentId` configured; `pending`
// means the player already has a battle queued.
export type SparResult =
  | { ok: false; reason: "unknown" | "unsupported" | "pending" }
  | { ok: true; npcId: string; opponentId: string };

// Generic post-spar landing scenes — all sparring routes here on
// resolution. Authors don't need a per-NPC outcome scene.
export const SPAR_WIN_SCENE_ID = "npc_spar_win";
export const SPAR_LOSE_SCENE_ID = "npc_spar_lose";

// Three rest tiers — see plan above.
export type RestKind = "inn" | "temple" | "route";

export type RestResult =
  | { ok: false; reason: "gold" }
  | { ok: true; kind: RestKind; cost: number; restored: number };

// Practice xp granted per "เล่นเพลง" click. Small so the loop isn't trivial
// to grind — books and song books are the bigger xp source.
const PRACTICE_MUSIC_XP = 10;

// W-exp drop rates per action. W-exp is the "any-action" pool the player
// can spend to level up move skills, alongside the per-skill xp bar that
// only fills via combat use.
const W_EXP_GATHER = 10;
const W_EXP_CRAFT = 5;
const W_EXP_USE_ITEM = 5;
const W_EXP_PRACTICE_MUSIC = 5;
const W_EXP_FIGHT_WIN = 50;
// Per-skill xp gained for each use of a skill in a battle the player won.
const SKILL_USE_XP = 20;

interface WorldStore extends WorldStateData {
  // Actions
  startNewGame: () => void;
  makeChoice: (idx: number) => void;
  gotoScene: (sceneId: string) => void;
  // Used by the "ปิด" button on terminal dialogs and by the route-screen
  // back button. No-op if lastLocationId is null (very early in a fresh game).
  exitToLocation: () => void;
  // True when navigating to `targetSceneId` either won't cost stamina
  // (story warps) or the player can pay the overworld travel cost. UI uses
  // this to disable destination / route buttons preemptively.
  canTravelTo: (targetSceneId: string) => boolean;
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
  rest: (kind: RestKind) => RestResult;

  // Spend w-exp to skip the per-skill xp grind and level a move skill by
  // one tier. The skill's own xp bar auto-levels on overflow without any
  // user action — no separate "level up via skill xp" button is needed.
  levelUpSkillFromWExp: (skillId: string) => LevelUpSkillResult;

  // Shop / sect-hall purchases. All return a discriminated result so the
  // popups can show the right toast on success / failure.
  buyItem: (itemId: string, count: number) => BuyResult;
  sellItem: (itemId: string, count: number, sellMultiplier: number) => SellResult;
  buyMoveSkill: (skillId: string, price: number) => BuyOfferResult;
  buyInnerSkill: (artId: string, price: number) => BuyOfferResult;

  // Equip a learned skill or art into a specific slot. `rawId` follows
  // the slot encoding from `lib/game/slots.ts` — bare skill id or
  // "art:<artId>". Pass null to clear the slot. Idempotent: assigning the
  // same id to a slot it already occupies is a no-op; assigning to a new
  // slot moves it (the old slot is cleared).
  equipSlot: (slotIdx: number, rawId: string | null) => void;

  // NPC interactions. The popup calls these on click — they keep all the
  // state-mutation logic in the store so adding more interaction kinds
  // (gifting, hiring, training) later means adding one method here, not
  // pushing logic into the component.
  meetNpc: (npcId: string) => void;
  startSparWith: (npcId: string) => SparResult;

  // Debug helpers (dev-only consumers).
  _setFlag: (flag: string, value: boolean | number | string) => void;
  _giveGold: (amount: number) => void;
}

const emptyLifeSkillXp = (): Record<LifeSkill, number> =>
  Object.fromEntries(LIFE_SKILL_KEYS.map((k) => [k, 0])) as Record<LifeSkill, number>;

const emptyStatExp = (): Record<StatKey, number> =>
  Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>;

const emptyTraits = (): Record<TraitKey, number> =>
  Object.fromEntries(TRAIT_KEYS.map((k) => [k, 0])) as Record<TraitKey, number>;

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
  currentHp: 0,
  currentMp: 0,
  lifeSkillXp: emptyLifeSkillXp(),
  wExp: 0,
  skillLevel: {},
  skillExp: {},
  statExp: emptyStatExp(),
  traits: emptyTraits(),
  npcStates: {},
  day: 1,
  time: 0,
  pendingBattle: null,
  pendingHuntYield: null,
  pendingSpar: null,
  gameOver: false,
});

// Push the current skill levels into the player build so the engine reads
// them at battle handoff time (BattleContext snapshots `build.skillLevels`).
function syncPlayerSkillLevels(state: WorldStateData): void {
  if (!state.playerBuild) return;
  state.playerBuild = {
    ...state.playerBuild,
    skillLevels: { ...state.skillLevel },
  };
}

// Auto-level a stat as many times as the accumulated xp allows. The cost
// uses the player's *base* stat (build.stats[k]) — equipment / skill
// bonuses are deliberately excluded so an item-stacked LUK can't make LUK
// itself harder to grow. Mutates draft.playerBuild on each tier crossed.
function applyStatLevelUps(state: WorldStateData, key: StatKey): void {
  if (!state.playerBuild) return;
  let build: CharacterBuild = state.playerBuild;
  while (true) {
    const base: number = build.stats[key];
    const cost = xpToNextStatLevel(base);
    const xp = state.statExp[key] ?? 0;
    if (xp < cost) break;
    build = {
      ...build,
      stats: { ...build.stats, [key]: base + 1 },
    };
    state.statExp[key] = xp - cost;
  }
  state.playerBuild = build;
}

// Bank stat xp + auto-level. Skips silently when there's no player build.
function grantStatXp(state: WorldStateData, key: StatKey, amount: number): void {
  if (amount <= 0) return;
  if (!state.playerBuild) return;
  state.statExp[key] = (state.statExp[key] ?? 0) + amount;
  applyStatLevelUps(state, key);
}

// LUK roll on any qualifying action. The base chance is 10 %, +1 % per
// current LUK, capped at 50 %. On pass, banks STAT_XP_PER_ACTION into the
// LUK pool (which can itself level LUK and tighten the next roll).
function rollLukXp(state: WorldStateData): void {
  if (!state.playerBuild) return;
  const base = state.playerBuild.stats.LUK;
  if (Math.random() < lukRollChance(base)) {
    grantStatXp(state, "LUK", STAT_XP_PER_ACTION);
  }
}

// Auto-level a move skill while its xp pool allows. Caps at SKILL_LEVEL_MAX
// and rolls overflow into the next tier (which will simply sit at 0 if the
// skill is now max).
function applySkillLevelUps(state: WorldStateData, skillId: string): void {
  const sk = getSkill(skillId);
  if (!sk) return;
  while (true) {
    const lv = state.skillLevel[skillId] ?? 1;
    if (lv >= SKILL_LEVEL_MAX) break;
    const cost = xpToNextLevel(sk, lv);
    const xp = state.skillExp[skillId] ?? 0;
    if (xp < cost) break;
    state.skillLevel[skillId] = lv + 1;
    state.skillExp[skillId] = xp - cost;
  }
  syncPlayerSkillLevels(state);
}

// In-place time advance. Rolls `time` over each `HOURS_PER_DAY` and
// increments `day`. Negative deltas are not supported (game time is one-way).
function advanceTime(state: WorldStateData, hours: number): void {
  if (hours <= 0) return;
  let total = state.time + hours;
  let day = state.day;
  while (total >= HOURS_PER_DAY) {
    total -= HOURS_PER_DAY;
    day++;
  }
  state.time = total;
  state.day = day;
}

// Returns true when the move is either free (story warp / same scene) or
// the player has enough stamina for the overworld travel cost. UI buttons
// can call this against the current state to grey themselves out.
function travelTransitionHours(
  source: ReturnType<typeof getScene>,
  target: ReturnType<typeof getScene>,
): number | null {
  if (!source || !target) return null;
  if (source.kind === "location" && target.kind === "route") return LOC_TO_ROUTE_HOURS;
  if (source.kind === "route" && target.kind === "location") return ROUTE_TO_LOC_HOURS;
  return null;
}

function canAffordTravelTo(state: WorldStateData, targetSceneId: string): boolean {
  if (state.currentSceneId === targetSceneId) return true;
  const target = getScene(targetSceneId);
  const source = getScene(state.currentSceneId);
  const hours = travelTransitionHours(source, target);
  if (hours === null) return true; // story warp — free, always allowed
  return state.stamina >= TRAVEL_STAMINA_COST;
}

// Charge the per-navigation travel cost only on the two real overworld
// transitions:
//   location → route  → 10 stamina + 1 ชั่วยาม (stepping onto a road)
//   route → location  → 10 stamina + 2 ชั่วยาม (arriving at a destination)
// Story warps (dialog → anywhere, location → location, etc.) are free —
// only walking the map costs stamina and time.
//
// Returns false when the move is real travel and the player cannot afford
// the stamina cost. Callers must abort the navigation in that case.
function chargeTravelIfNeeded(state: WorldStateData, targetSceneId: string): boolean {
  if (state.currentSceneId === targetSceneId) return true;
  const target = getScene(targetSceneId);
  const source = getScene(state.currentSceneId);
  const hours = travelTransitionHours(source, target);
  if (hours === null) return true; // story warp — free
  if (state.stamina < TRAVEL_STAMINA_COST) return false;
  state.stamina -= TRAVEL_STAMINA_COST;
  advanceTime(state, hours);
  // Successful overworld travel — grant AGI xp + roll for LUK.
  grantStatXp(state, "AGI", STAT_XP_PER_ACTION);
  rollLukXp(state);
  return true;
}

// Walk through `next` pointers on dialog scenes. Stops at the first scene
// that requires user input (any choices, route, or location). Updates
// `lastLocationId` whenever it lands on a location.
function followAutoAdvance(state: WorldStateData): void {
  for (let i = 0; i < 32; i++) {
    const sc = getScene(state.currentSceneId);
    if (!sc) return;
    if (sc.kind === "location") {
      state.lastLocationId = state.currentSceneId;
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
function takeChoice(state: WorldStateData, choice: Choice): boolean {
  // Pre-flight: refuse the whole choice (effects + nav) when the move is
  // real travel and the player can't pay. Otherwise zero-stamina players
  // could still trigger flag/quest side effects by tapping a route.
  if (!canAffordTravelTo(state, choice.next)) return false;

  const effects: readonly SceneEffect[] = choice.effects ?? [];
  applyEffects(state, effects);
  if (state.pendingBattle) {
    // Battle suspends scene navigation; the onWin/onLose path overrides `next`.
    return true;
  }
  // Same-target navigation (closing a dialog back to where you stood) is free;
  // a different route/location pays the travel cost.
  if (!chargeTravelIfNeeded(state, choice.next)) return false;
  state.currentSceneId = choice.next;
  const sc = getScene(state.currentSceneId);
  if (sc?.onEnter) applyEffects(state, sc.onEnter);
  followAutoAdvance(state);
  return true;
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
    currentHp: s.currentHp,
    currentMp: s.currentMp,
    lifeSkillXp: { ...s.lifeSkillXp },
    wExp: s.wExp,
    skillLevel: { ...s.skillLevel },
    skillExp: { ...s.skillExp },
    statExp: { ...s.statExp },
    traits: { ...s.traits },
    npcStates: { ...s.npcStates },
    day: s.day,
    time: s.time,
    pendingBattle: s.pendingBattle,
    pendingHuntYield: s.pendingHuntYield,
    pendingSpar: s.pendingSpar,
    gameOver: s.gameOver,
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
        const fresh = emptyData();
        fresh.hasGame = true;
        fresh.playerBuild = STARTER_BUILD();
        fresh.currentSceneId = START_SCENE_ID;
        // Seed level 1 for the starter skill so the UI has an entry to
        // display from turn one.
        for (const sid of fresh.playerBuild.skillIds) {
          if (sid) fresh.skillLevel[sid] = 1;
        }
        syncPlayerSkillLevels(fresh);
        // Start at full HP / MP — both are derived from the player build's
        // VIT / DEF / POW / INT and snapshotted here so the bar reads right
        // before the player ever enters a fight.
        const d = deriveAll(fresh.playerBuild);
        fresh.currentHp = d.HP;
        fresh.currentMp = d.MP;
        set({ ...fresh });
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
        // Drop the draft entirely if takeChoice refuses (e.g., stamina too
        // low for a travel-bearing choice). State stays exactly as it was.
        if (!takeChoice(draft, choice)) return;
        set({ ...draft });
      },

      gotoScene: (sceneId) => {
        if (!getScene(sceneId)) {
          console.warn(`[world] gotoScene: unknown scene "${sceneId}"`);
          return;
        }
        const draft = draftFrom(get());
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

      clearPendingBattle: () =>
        set({ pendingBattle: null, pendingHuntYield: null, pendingSpar: null }),

      acknowledgeBattleResult: () => {
        const s = get();
        if (!s.pendingBattle) return;
        const battleState = useBattleStore.getState().state;
        const winner = battleState?.winner;
        if (!winner) return;

        const pb = s.pendingBattle;
        // Combat charges flat 5 stamina + 0.5 ชั่วยาม regardless of outcome.
        const draft = draftFrom(s);
        draft.stamina = Math.max(0, draft.stamina - FIGHT_STAMINA);
        advanceTime(draft, FIGHT_HOURS);
        draft.pendingBattle = null;
        // Carry surviving HP / MP back into the world. Even on loss we copy
        // — non-fatal sparring leaves the player with whatever HP they had
        // at the final hit, fatal losses route to gameOver and the values
        // get reset by `resetGame` anyway.
        if (battleState) {
          draft.currentHp = Math.max(0, battleState.hA);
          draft.currentMp = Math.max(0, battleState.mpA);
        }

        // Loss path. Fatal battles → game over (existing behaviour).
        // Non-fatal battles (sparring) → route to onLose, world resumes.
        if (winner !== "A") {
          draft.pendingHuntYield = null;
          if (pb.nonFatal) {
            draft.pendingSpar = null;
            set({ ...draft });
            useBattleStore.getState().reset();
            get().gotoScene(pb.onLose);
            return;
          }
          draft.gameOver = true;
          set({ ...draft });
          useBattleStore.getState().reset();
          return;
        }

        // Win path: bank w-exp + per-skill xp + stat xp from every move
        // used and every hit taken, then drop hunt spoils if a hunt was in
        // flight, then route to the encounter's onWin destination.
        draft.wExp = Math.max(0, draft.wExp + W_EXP_FIGHT_WIN);
        const uses = battleState?.skillUses?.A ?? {};
        let actionTotal = 0;
        for (const [sid, count] of Object.entries(uses)) {
          if (typeof count !== "number" || count <= 0) continue;
          const sk = getSkill(sid);
          if (!sk) continue;
          actionTotal += count;
          draft.skillExp[sid] = (draft.skillExp[sid] ?? 0) + count * SKILL_USE_XP;
          if (!(sid in draft.skillLevel)) draft.skillLevel[sid] = 1;
          // Per-skill auto-level on overflow.
          applySkillLevelUps(draft, sid);
          // STR for physical attacks, POW for internal attacks. Non-attack
          // skills (pure buffs / debuffs / heals) grant nothing here.
          if (sk.at === "phy") {
            grantStatXp(draft, "STR", count * STAT_XP_PER_ACTION);
          } else if (sk.at === "int") {
            grantStatXp(draft, "POW", count * STAT_XP_PER_ACTION);
          }
        }
        // DEF — one tick per incoming hit landed during the fight.
        const hits = battleState?.hitsReceived?.A ?? 0;
        if (hits > 0) {
          grantStatXp(draft, "DEF", hits * STAT_XP_PER_ACTION);
        }
        // LUK — one roll per resolved player action plus per hit absorbed.
        const lukRolls = actionTotal + hits;
        for (let i = 0; i < lukRolls; i++) rollLukXp(draft);

        // Sparring victory → grant ชื่อเสียง and bump the NPC's relationship
        // a touch (winning a friendly match earns respect, not enmity).
        const spar = draft.pendingSpar;
        draft.pendingSpar = null;
        if (spar) {
          const reward = Math.max(0, spar.fameReward);
          if (reward > 0) {
            draft.traits.fame = (draft.traits.fame ?? 0) + reward;
          }
          const entry = draft.npcStates[spar.npcId] ?? {};
          draft.npcStates[spar.npcId] = {
            ...entry,
            met: true,
            relationship: (entry.relationship ?? 0) + 1,
          };
        }

        const hunt = draft.pendingHuntYield;
        draft.pendingHuntYield = null;
        if (hunt) {
          const res = getResource(hunt.resourceId);
          if (res) {
            const lvl = masteryLevel(draft.lifeSkillXp[res.skill] ?? 0);
            const yieldRoll = rollResourceYield(res, lvl);
            for (const it of yieldRoll.items) {
              draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
            }
            // Win + drop-check pass = full xp; win + check-fail (carcass
            // unusable) = half xp.
            const xp = HUNT_XP_MULT * res.level;
            draft.lifeSkillXp[res.skill] =
              (draft.lifeSkillXp[res.skill] ?? 0) + (yieldRoll.passed ? xp : Math.floor(xp * FAIL_XP_FRACTION));
          }
        }
        set({ ...draft });
        useBattleStore.getState().reset();
        get().gotoScene(s.pendingBattle.onWin);
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
          advanceTime(draft, ACTION_HOURS);
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
        advanceTime(draft, ACTION_HOURS);
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
        draft.wExp += W_EXP_GATHER;
        const statKey = statFromLifeSkill(res.skill);
        if (statKey) grantStatXp(draft, statKey, STAT_XP_PER_ACTION);
        rollLukXp(draft);
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
        advanceTime(draft, ACTION_HOURS);
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
        draft.wExp += W_EXP_CRAFT;
        // Hard crafts → DEX, cultural recipes (drawing / writing) → INT.
        const craftStat = statFromLifeSkill(skill);
        if (craftStat) grantStatXp(draft, craftStat, STAT_XP_PER_ACTION);
        rollLukXp(draft);
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

        // Pre-flight for heal items: refuse if both targets are already at
        // max so the player doesn't waste a potion.
        if (def.use.t === "heal") {
          if (!s.playerBuild) return { ok: false, reason: "no-build" };
          const d = deriveAll(s.playerBuild);
          const hpRoom = Math.max(0, d.HP - s.currentHp);
          const mpRoom = Math.max(0, d.MP - s.currentMp);
          const wantsHp = (def.use.hp ?? 0) > 0;
          const wantsMp = (def.use.mp ?? 0) > 0;
          if ((!wantsHp || hpRoom === 0) && (!wantsMp || mpRoom === 0)) {
            return { ok: false, reason: "full" };
          }
        }

        const draft = draftFrom(s);
        advanceTime(draft, ACTION_HOURS);
        // Consume one count.
        const cur = draft.inventory[itemId] ?? 0;
        if (cur <= 1) delete draft.inventory[itemId];
        else draft.inventory[itemId] = cur - 1;

        const eff = def.use;
        if (eff.t === "trainSkill") {
          draft.lifeSkillXp[eff.skill] = (draft.lifeSkillXp[eff.skill] ?? 0) + eff.xp;
          draft.wExp += W_EXP_USE_ITEM;
          // Cultural training items (book / song book / image / writing /
          // chess) feed INT through the same skill→stat map.
          const itemStat = statFromLifeSkill(eff.skill);
          if (itemStat) grantStatXp(draft, itemStat, STAT_XP_PER_ACTION);
          rollLukXp(draft);
          set({ ...draft });
          return { ok: true, kind: "trainSkill", itemId, skill: eff.skill, xpGained: eff.xp };
        }
        if (eff.t === "heal") {
          // playerBuild was checked above for heal items.
          const d = deriveAll(draft.playerBuild!);
          const hpHealed =
            eff.hp && eff.hp > 0
              ? Math.min(d.HP - draft.currentHp, eff.hp)
              : 0;
          const mpHealed =
            eff.mp && eff.mp > 0
              ? Math.min(d.MP - draft.currentMp, eff.mp)
              : 0;
          draft.currentHp = Math.min(d.HP, draft.currentHp + hpHealed);
          draft.currentMp = Math.min(d.MP, draft.currentMp + mpHealed);
          rollLukXp(draft);
          set({ ...draft });
          return { ok: true, kind: "heal", itemId, hpHealed, mpHealed };
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
        advanceTime(draft, ACTION_HOURS);
        draft.lifeSkillXp.music = (draft.lifeSkillXp.music ?? 0) + PRACTICE_MUSIC_XP;
        draft.wExp += W_EXP_PRACTICE_MUSIC;
        // Music is a cultural action → INT.
        grantStatXp(draft, "INT", STAT_XP_PER_ACTION);
        rollLukXp(draft);
        set({ ...draft });
        return { ok: true, xpGained: PRACTICE_MUSIC_XP };
      },

      rest: (kind) => {
        const s = get();
        const max = s.staminaMax;
        let cost = 0;
        let pct = 0;
        if (kind === "inn") {
          cost = REST_INN_COST;
          pct = 1;
        } else if (kind === "temple") {
          pct = 0.5;
        } else {
          // route
          pct = 0.25;
        }
        if (s.gold < cost) return { ok: false, reason: "gold" };
        const draft = draftFrom(s);
        draft.gold -= cost;
        const restored = Math.floor(max * pct);
        draft.stamina = Math.min(max, draft.stamina + restored);
        // Resting restores HP / MP at the same proportion as stamina —
        // matches the existing "ฟื้นเต็ม / ½ / ¼" labels which were always
        // meant to cover every pool, not stamina alone.
        if (draft.playerBuild) {
          const d = deriveAll(draft.playerBuild);
          draft.currentHp = Math.min(d.HP, draft.currentHp + Math.floor(d.HP * pct));
          draft.currentMp = Math.min(d.MP, draft.currentMp + Math.floor(d.MP * pct));
        }
        advanceTime(draft, REST_HOURS);
        set({ ...draft });
        return { ok: true, kind, cost, restored };
      },

      levelUpSkillFromWExp: (skillId) => {
        const s = get();
        const sk = getSkill(skillId);
        if (!sk) return { ok: false, reason: "unknown" };
        const lv = s.skillLevel[skillId] ?? 1;
        if (lv >= SKILL_LEVEL_MAX) return { ok: false, reason: "maxed" };
        const cost = xpToNextLevel(sk, lv);
        if (s.wExp < cost) return { ok: false, reason: "insufficient" };

        const draft = draftFrom(s);
        draft.wExp -= cost;
        draft.skillLevel[skillId] = lv + 1;
        syncPlayerSkillLevels(draft);
        set({ ...draft });
        return { ok: true, skillId, level: lv + 1, cost };
      },

      buyItem: (itemId, count) => {
        if (count <= 0) return { ok: false, reason: "unknown" };
        const s = get();
        const def = getItem(itemId);
        if (!def) return { ok: false, reason: "unknown" };
        const price = def.price ?? 0;
        if (price <= 0) return { ok: false, reason: "not-for-sale" };
        const total = price * count;
        if (s.gold < total) return { ok: false, reason: "no-gold" };
        const draft = draftFrom(s);
        draft.gold -= total;
        draft.inventory[itemId] = (draft.inventory[itemId] ?? 0) + count;
        rollLukXp(draft);
        set({ ...draft });
        return { ok: true, itemId, count, spent: total };
      },

      sellItem: (itemId, count, sellMultiplier) => {
        if (count <= 0) return { ok: false, reason: "unknown" };
        const s = get();
        const def = getItem(itemId);
        if (!def) return { ok: false, reason: "unknown" };
        const price = def.price ?? 0;
        if (price <= 0) return { ok: false, reason: "unsellable" };
        const have = s.inventory[itemId] ?? 0;
        if (have < count) return { ok: false, reason: "missing" };
        const draft = draftFrom(s);
        const remaining = have - count;
        if (remaining <= 0) delete draft.inventory[itemId];
        else draft.inventory[itemId] = remaining;
        const gained = Math.floor(price * sellMultiplier) * count;
        draft.gold = Math.max(0, draft.gold + gained);
        rollLukXp(draft);
        set({ ...draft });
        return { ok: true, itemId, count, gained };
      },

      buyMoveSkill: (skillId, price) => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "unknown" };
        const sk = getSkill(skillId);
        if (!sk) return { ok: false, reason: "unknown" };
        if ((s.playerBuild.learnedSkillIds ?? []).includes(skillId)) {
          return { ok: false, reason: "already-learned" };
        }
        if (s.gold < price) return { ok: false, reason: "no-gold" };
        const draft = draftFrom(s);
        draft.gold -= price;
        const cur = draft.playerBuild!.learnedSkillIds ?? [];
        const slots = [...draft.playerBuild!.skillIds];
        if (!slots.includes(skillId)) {
          for (let i = 0; i < slots.length; i++) {
            if (slots[i] === null) { slots[i] = skillId; break; }
          }
        }
        draft.playerBuild = {
          ...draft.playerBuild!,
          learnedSkillIds: [...cur, skillId],
          skillIds: slots,
        };
        rollLukXp(draft);
        set({ ...draft });
        return { ok: true, id: skillId, spent: price };
      },

      buyInnerSkill: (artId, price) => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "unknown" };
        if ((s.playerBuild.learnedArtIds ?? []).includes(artId)) {
          return { ok: false, reason: "already-learned" };
        }
        if (s.gold < price) return { ok: false, reason: "no-gold" };
        const draft = draftFrom(s);
        draft.gold -= price;
        const curArts = draft.playerBuild!.learnedArtIds ?? [];
        const levels = { ...(draft.playerBuild!.artLevels ?? {}) };
        const slots = [...draft.playerBuild!.skillIds];
        const slotEntry = `art:${artId}`;
        if (!slots.includes(slotEntry)) {
          for (let i = 0; i < slots.length; i++) {
            if (slots[i] === null) { slots[i] = slotEntry; break; }
          }
        }
        draft.playerBuild = {
          ...draft.playerBuild!,
          learnedArtIds: [...curArts, artId],
          artLevels: { ...levels, [artId]: levels[artId] ?? 1 },
          skillIds: slots,
        };
        rollLukXp(draft);
        set({ ...draft });
        return { ok: true, id: artId, spent: price };
      },

      equipSlot: (slotIdx, rawId) => {
        const s = get();
        if (!s.playerBuild) return;
        const slots = [...s.playerBuild.skillIds];
        if (slotIdx < 0 || slotIdx >= slots.length) return;
        // Validate the id resolves before writing it in.
        if (rawId !== null && !parseSlotId(rawId)) return;
        // Move-not-duplicate: if the same id sits in another slot, clear it.
        if (rawId) {
          for (let i = 0; i < slots.length; i++) {
            if (i !== slotIdx && slots[i] === rawId) slots[i] = null;
          }
        }
        slots[slotIdx] = rawId;
        set({
          playerBuild: { ...s.playerBuild, skillIds: slots },
        });
      },

      meetNpc: (npcId) => {
        const s = get();
        if (!getNpc(npcId)) return;
        const entry = s.npcStates[npcId];
        if (entry?.met) return;
        set({
          npcStates: {
            ...s.npcStates,
            [npcId]: { ...(entry ?? {}), met: true },
          },
        });
      },

      startSparWith: (npcId) => {
        const s = get();
        if (s.pendingBattle) return { ok: false, reason: "pending" };
        const npc = getNpc(npcId);
        if (!npc) return { ok: false, reason: "unknown" };
        if (!npc.sparOpponentId) return { ok: false, reason: "unsupported" };

        const fameReward = Math.max(0, npc.sparFameReward ?? 0);
        const draft = draftFrom(s);
        // Mark the player as having met this NPC even if they back out — a
        // sparring offer counts as an introduction.
        const entry = draft.npcStates[npcId] ?? {};
        draft.npcStates[npcId] = { ...entry, met: true };
        draft.pendingSpar = { npcId, fameReward };
        draft.pendingBattle = {
          opponentId: npc.sparOpponentId,
          onWin: SPAR_WIN_SCENE_ID,
          onLose: SPAR_LOSE_SCENE_ID,
          nonFatal: true,
        };
        set({ ...draft });
        return { ok: true, npcId, opponentId: npc.sparOpponentId };
      },

      _setFlag: (flag, value) =>
        set((s) => ({ flags: { ...s.flags, [flag]: value } })),

      _giveGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold + amount) })),
    }),
    {
      name: "wusia-world-v1",
      version: 9,
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
        currentHp: s.currentHp,
        currentMp: s.currentMp,
        lifeSkillXp: s.lifeSkillXp,
        wExp: s.wExp,
        skillLevel: s.skillLevel,
        skillExp: s.skillExp,
        statExp: s.statExp,
        traits: s.traits,
        npcStates: s.npcStates,
        day: s.day,
        time: s.time,
        pendingBattle: s.pendingBattle,
        pendingHuntYield: s.pendingHuntYield,
        pendingSpar: s.pendingSpar,
        gameOver: s.gameOver,
      }),
      // Migrations:
      //   v1 → v2 added stamina/staminaMax/lifeSkillXp(6)/pendingHuntYield.
      //   v2 → v3 grew lifeSkillXp from 6 → 17 keys.
      //   v3 → v4 added day/time. Both default to 1/0 — players returning
      //           after this update find themselves on day 1 morning.
      //   v4 → v5 added wExp / skillLevel / skillExp. Existing skills default
      //           to level 1 (the new nerfed baseline) with empty xp pools.
      //   v5 → v6 added statExp pools (one per StatKey). Existing players
      //           start with empty pools and grow stats from there.
      //   v6 → v7 added traits + npcStates + pendingSpar. Existing players
      //           start with all-zero traits and no NPC interactions.
      //   v7 → v8 added currentHp / currentMp. Existing players are seeded
      //           at full HP/MP from deriveAll(playerBuild).
      //   v8 → v9 expanded skillIds 5 → 10 slots; added learnedSkillIds /
      //           learnedArtIds / artLevels. Existing slotted skills + the
      //           active art are seeded into the learned arrays.
      migrate: (persisted, fromVersion) => {
        const p = (persisted ?? {}) as Partial<WorldStateData>;
        // Pad the build's skillIds to 10 and back-fill learned arrays.
        if (p.playerBuild) {
          const b = p.playerBuild as CharacterBuild;
          const slots = Array.isArray(b.skillIds) ? [...b.skillIds] : [];
          while (slots.length < 10) slots.push(null);
          // learnedSkillIds: only count entries that are bare skill ids
          // (skip "art:" prefixed entries, which would be art slots).
          const learnedSkillIds =
            b.learnedSkillIds ??
            (slots.filter(
              (s): s is string => typeof s === "string" && !s.startsWith("art:"),
            ) as readonly string[]);
          const learnedArtIds =
            b.learnedArtIds ??
            (b.artId && b.artId !== "none"
              ? ([b.artId] as readonly string[])
              : []);
          const artLevels =
            b.artLevels ??
            (b.artId && b.artId !== "none"
              ? { [b.artId]: b.artLevel }
              : {});
          // Auto-slot the legacy artId into a free slot so the player can
          // actually use it under the new unified-slot system.
          if (
            b.artId &&
            b.artId !== "none" &&
            !slots.some((s) => s === encodeArtSlot(b.artId))
          ) {
            placeInFirstEmpty(slots, encodeArtSlot(b.artId));
          }
          p.playerBuild = {
            ...b,
            skillIds: slots,
            learnedSkillIds,
            learnedArtIds,
            artLevels,
          };
        }
        const seedHpMp =
          p.playerBuild ? deriveAll(p.playerBuild as CharacterBuild) : null;
        const out: WorldStateData = {
          ...emptyData(),
          ...p,
          stamina: typeof p.stamina === "number" ? p.stamina : STARTER_STAMINA,
          staminaMax: typeof p.staminaMax === "number" ? p.staminaMax : STARTER_STAMINA,
          currentHp:
            typeof p.currentHp === "number" && p.currentHp >= 0
              ? p.currentHp
              : seedHpMp?.HP ?? 0,
          currentMp:
            typeof p.currentMp === "number" && p.currentMp >= 0
              ? p.currentMp
              : seedHpMp?.MP ?? 0,
          lifeSkillXp: { ...emptyLifeSkillXp(), ...(p.lifeSkillXp ?? {}) } as Record<LifeSkill, number>,
          wExp: typeof p.wExp === "number" && p.wExp >= 0 ? p.wExp : 0,
          skillLevel: p.skillLevel && typeof p.skillLevel === "object" ? { ...p.skillLevel } : {},
          skillExp: p.skillExp && typeof p.skillExp === "object" ? { ...p.skillExp } : {},
          statExp: { ...emptyStatExp(), ...(p.statExp ?? {}) } as Record<StatKey, number>,
          traits: { ...emptyTraits(), ...(p.traits ?? {}) } as Record<TraitKey, number>,
          npcStates: p.npcStates && typeof p.npcStates === "object" ? { ...p.npcStates } : {},
          day: typeof p.day === "number" && p.day >= 1 ? p.day : 1,
          time: typeof p.time === "number" && p.time >= 0 ? p.time : 0,
          pendingHuntYield: p.pendingHuntYield ?? null,
          pendingSpar: p.pendingSpar ?? null,
          gameOver: p.gameOver === true,
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
