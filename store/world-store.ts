"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterBuild, EquipSlotType, StatKey } from "@/lib/game";
import {
  ART_LEVEL_MAX,
  combinedStats,
  deriveAll,
  effectiveTypes,
  encodeArtSlot,
  getArt,
  getEquip,
  getSkill,
  isArtSlot,
  parseSlotId,
  placeInFirstEmpty,
  SKILL_LEVEL_MAX,
  STAT_KEYS,
  xpToNextArtLevel,
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
  canPracticeAt,
  gatherSuccessChance,
  getArtisansAt,
  getItem,
  getNpc,
  getOpponent,
  getQuest,
  getRecipe,
  getResource,
  getScene,
  getQuestStatus,
  LIFE_SKILL_KEYS,
  masteryLevel,
  pickWeighted,
  practiceXpBonus,
  START_SCENE_ID,
  TRAIT_KEYS,
  validateAndRepair,
  type Choice,
  type LifeSkill,
  type ResourceDef,
  type ResourceYield,
  type SceneEffect,
  type TraitKey,
  type WorldStateData,
} from "@/lib/world";
import { tickQuestProgress } from "@/lib/world/effects";

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
  | { ok: false; reason: "missing-input" | "missing-mastery" | "not-learned" | "no-artisan" | "unknown" }
  | {
      ok: true;
      recipeId: string;
      outputItemId: string;
      outputCount: number;
      xpGained: number;
      dropCheck: "passed" | "failed" | "none";
    };

// Result of buying a recipe at an artisan. `already-learned` means the
// recipe is already in learnedRecipeIds; `no-gold` is self-explanatory.
export type BuyRecipeResult =
  | { ok: false; reason: "unknown" | "already-learned" | "no-gold" }
  | { ok: true; recipeId: string; spent: number };

// Result of buying a piece of equipment at an artisan. The bought
// equipment lands in `inventoryEquipment`, NOT directly in a slot.
export type BuyEquipResult =
  | { ok: false; reason: "unknown" | "no-gold" }
  | { ok: true; equipId: string; spent: number };

// Result of equipping a bag item into a slot. `swapped` (when present)
// is the id of the item that got pushed back into the bag.
export type EquipResult =
  | { ok: false; reason: "unknown" | "missing" | "no-build" }
  | {
      ok: true;
      equipId: string;
      slotType: EquipSlotType;
      slotIdx: number;
      swapped: string | null;
    };

// Result of moving an equipped item back into the bag.
export type UnequipResult =
  | { ok: false; reason: "empty" | "unknown" | "no-build" }
  | { ok: true; equipId: string; slotType: EquipSlotType; slotIdx: number };

// Result of using a consumable item (book, song book, image, potion, …).
// Discriminated on `kind` so the UI can render different feedback per use.
//
// Manual-use failure modes are item-preserving: `stat-too-low` and
// `already-learned` both refuse the use without consuming the item, so
// the player isn't punished for guessing. The popup shows a toast.
export type UseItemResult =
  | { ok: false; reason: "unknown" | "missing" | "no-effect" | "no-build" | "full" }
  | { ok: false; reason: "stat-too-low"; stat: StatKey; needed: number; current: number }
  | { ok: false; reason: "already-learned"; itemId: string }
  | { ok: true; kind: "trainSkill"; itemId: string; skill: LifeSkill; xpGained: number }
  | {
      ok: true;
      kind: "heal";
      itemId: string;
      hpHealed: number;
      mpHealed: number;
    }
  | { ok: true; kind: "manualLearnSkill"; itemId: string; skillId: string }
  | { ok: true; kind: "manualLearnArt"; itemId: string; artId: string; level: number };

// Result of clicking the "เล่นเพลง" practice button.
export type PracticeMusicResult =
  | { ok: false; reason: "no-instrument" | "no-build" }
  | { ok: true; xpGained: number };

// Result of attempting to level up a move skill via either xp source.
export type LevelUpSkillResult =
  | { ok: false; reason: "unknown" | "maxed" | "insufficient" }
  | { ok: true; skillId: string; level: number; cost: number };

// Result of attempting to level up an inner art via w-exp.
export type LevelUpArtResult =
  | { ok: false; reason: "unknown" | "maxed" | "insufficient" }
  | { ok: true; artId: string; level: number; cost: number };

// Result of attempting "ฝึกฝน" on a learned skill / art at a location.
export type PracticeResult =
  | { ok: false; reason: "no-build" | "stamina" | "unknown" | "not-allowed" }
  | {
      ok: true;
      kind: "skill" | "art";
      id: string;
      xpGained: number;
      bonusMult: number;
      leveledUp: boolean;
      newLevel: number;
    };

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

// Result of attempting to accept / abandon a quest from the NPC popup.
export type QuestActionResult =
  | { ok: false; reason: "unknown" | "already-active" | "already-done" | "prereq" }
  | { ok: true; questId: string };

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
// Per-art xp gained for each art active fired in a battle the player won.
// Same value as SKILL_USE_XP — the natural 2× difficulty comes from the
// art-tier xp curve being 2× the move-skill curve, not from a smaller drop.
const ART_USE_XP = 20;

// "ฝึกฝน" practice action — costs stamina + ชั่วยาม, awards xp on the
// chosen skill / art. Practice xp scales with the location's category-type
// bonus (forest/cave/mountain/river — see lib/world/location-categories.ts).
export const PRACTICE_STAMINA_COST = 30;
export const PRACTICE_HOURS = 6;
const PRACTICE_BASE_XP = 30;
const W_EXP_PRACTICE = 5;

// Crafting professions that require an artisan + learned recipe to
// craft. Non-artisan recipes (mining-derived, drawing/writing, etc.)
// keep the legacy "craft inline" behavior.
const ARTISAN_PROFESSIONS: ReadonlySet<LifeSkill> = new Set<LifeSkill>([
  "forge",
  "alchemy",
  "tailoring",
  "chef",
  "jewelry",
  "accessory",
]);

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
  // Mirror of levelUpSkillFromWExp for inner arts. Cost = xpToNextArtLevel
  // (2× the equivalent skill cost). Auto-leveling on artExp overflow is
  // handled by applyArtLevelUps post-battle.
  levelUpArtFromWExp: (artId: string) => LevelUpArtResult;
  // "ฝึกฝน" — train a single skill / art at the current location. `rawId`
  // accepts the slot-encoded form ("art:xxx" for inner arts, bare id for
  // move skills). Costs PRACTICE_STAMINA_COST + PRACTICE_HOURS; xp scales
  // with the location's category-type bonus.
  practiceSkill: (rawId: string) => PracticeResult;

  // Shop / sect-hall purchases. All return a discriminated result so the
  // popups can show the right toast on success / failure.
  buyItem: (itemId: string, count: number) => BuyResult;
  sellItem: (itemId: string, count: number, sellMultiplier: number) => SellResult;
  buyMoveSkill: (skillId: string, price: number) => BuyOfferResult;
  buyInnerSkill: (artId: string, price: number) => BuyOfferResult;
  // Buy a recipe at an artisan — adds the id to learnedRecipeIds. The
  // popup filters out already-learned recipes so this should rarely
  // hit the `already-learned` rejection in practice.
  buyRecipe: (recipeId: string, price: number) => BuyRecipeResult;
  // Buy a piece of equipment at an artisan — drops gold, adds the id
  // to inventoryEquipment. Equip via `equipFromBag` afterwards.
  buyEquipment: (equipId: string, price: number) => BuyEquipResult;
  // Move an equipment id from inventoryEquipment into the matching
  // slot on playerBuild.equipment. Picks the first empty slot for the
  // multi-slot types (BR / R / C); on a full slot it swaps with index
  // 0 and pushes the displaced id back into the bag.
  equipFromBag: (equipId: string) => EquipResult;
  // Move a currently-equipped id back into the bag. `slotIdx` is
  // required for multi-slot types (BR / R / C) and ignored for the
  // single-slot ones (W / A / H / B).
  unequipFromSlot: (slotType: EquipSlotType, slotIdx?: 0 | 1) => UnequipResult;

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

  // Quest actions. `acceptQuest` is the lightweight version of dispatching
  // `startQuest` from a dialog choice — useful when the NPC popup wants to
  // start a quest directly without routing through a scripted scene.
  acceptQuest: (questId: string) => QuestActionResult;
  // Marks the quest as failed (and clears progress). Side quests do not
  // re-offer after failure — once failed, the NPC popup hides them.
  abandonQuest: (questId: string) => QuestActionResult;
  // Engine-side turn-in. Used by the NPC popup when a quest has no
  // `qs_<id>_complete` dialog scene to route to — without this fallback,
  // such quests would never grant rewards. Equivalent to a dialog choice
  // that emits `finishQuest({ success: true })`.
  finishQuestNow: (questId: string) => QuestActionResult;

  // Random-encounter resolution. `acceptEncounter` promotes a pending
  // fight-or-flee offer to an actual battle; `fleeEncounter` clears the
  // offer and stays put.
  acceptEncounter: () => void;
  fleeEncounter: () => void;

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
  artExp: {},
  learnedRecipeIds: [],
  inventoryEquipment: {},
  statExp: emptyStatExp(),
  traits: emptyTraits(),
  npcStates: {},
  defeatedCounts: {},
  visitedLocationIds: [],
  day: 1,
  time: 0,
  pendingBattle: null,
  pendingEncounter: null,
  pendingHuntYield: null,
  pendingSpar: null,
  gameOver: false,
  actionLog: [],
});

// Append a player-action entry to the rolling log. Keeps the most recent
// 100. Mutates `state` in place so it's safe to call from inside a draft
// before the final `set({ ...draft })`.
const ACTION_LOG_MAX = 100;
function appendActionLog(state: WorldStateData, kind: string, message: string): void {
  const entry = { day: state.day, time: state.time, kind, message };
  const next = [...state.actionLog, entry];
  if (next.length > ACTION_LOG_MAX) next.splice(0, next.length - ACTION_LOG_MAX);
  state.actionLog = next;
}

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
  let levelsGained = 0;
  while (true) {
    const lv = state.skillLevel[skillId] ?? 1;
    if (lv >= SKILL_LEVEL_MAX) break;
    const cost = xpToNextLevel(sk, lv);
    const xp = state.skillExp[skillId] ?? 0;
    if (xp < cost) break;
    state.skillLevel[skillId] = lv + 1;
    state.skillExp[skillId] = xp - cost;
    levelsGained++;
  }
  if (levelsGained > 0) {
    appendActionLog(
      state,
      "learn",
      `วิชาฝีมือ ${sk.n} เลื่อนขั้นเป็น Lv.${state.skillLevel[skillId]}`,
    );
  }
  syncPlayerSkillLevels(state);
}

// Auto-level an inner art while its xp pool allows. Levels live on
// `playerBuild.artLevels`; xp lives on top-level `state.artExp`. Caps at
// ART_LEVEL_MAX and rolls overflow forward.
function applyArtLevelUps(state: WorldStateData, artId: string): void {
  const art = getArt(artId);
  if (!art || art.id === "none") return;
  let build: CharacterBuild | null = state.playerBuild;
  if (!build) return;
  let levelsGained = 0;
  while (true) {
    const cur: number = build.artLevels?.[artId] ?? 1;
    if (cur >= ART_LEVEL_MAX) break;
    const cost = xpToNextArtLevel(art, cur);
    const xp = state.artExp[artId] ?? 0;
    if (xp < cost) break;
    build = {
      ...build,
      artLevels: { ...(build.artLevels ?? {}), [artId]: cur + 1 },
    };
    state.artExp[artId] = xp - cost;
    levelsGained++;
  }
  state.playerBuild = build;
  if (levelsGained > 0) {
    const newLv = build.artLevels?.[artId] ?? 1;
    appendActionLog(
      state,
      "learn",
      `วิชาในกาย ${art.n} เลื่อนขั้นเป็น ${newLv}`,
    );
  }
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
      recordVisit(state, state.currentSceneId);
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
    artExp: { ...s.artExp },
    learnedRecipeIds: [...s.learnedRecipeIds],
    inventoryEquipment: { ...s.inventoryEquipment },
    statExp: { ...s.statExp },
    traits: { ...s.traits },
    npcStates: { ...s.npcStates },
    defeatedCounts: { ...s.defeatedCounts },
    visitedLocationIds: [...s.visitedLocationIds],
    day: s.day,
    time: s.time,
    pendingBattle: s.pendingBattle,
    pendingEncounter: s.pendingEncounter,
    pendingHuntYield: s.pendingHuntYield,
    pendingSpar: s.pendingSpar,
    gameOver: s.gameOver,
    actionLog: [...s.actionLog],
  };
}

// Record a location visit for `Condition.visitedLocation` lookups. Idempotent.
function recordVisit(state: WorldStateData, locationId: string): void {
  if (!state.visitedLocationIds.includes(locationId)) {
    state.visitedLocationIds.push(locationId);
  }
}

// Roll loot from an opponent's drop table. Picks count is per-tier:
// tier 0/1 = 2 picks, tier 2/3 = 3, tier 4 = 4. Same weighted-pick helper
// as resources; merges duplicate item ids.
function rollOpponentLoot(
  drops: readonly ResourceYield[] | undefined,
  tier: number,
): { itemId: string; count: number }[] {
  if (!drops || drops.length === 0) return [];
  const picks = tier >= 4 ? 4 : tier >= 2 ? 3 : 2;
  const merged: Record<string, number> = {};
  for (let i = 0; i < picks; i++) {
    const drop = pickWeighted(drops, Math.random());
    if (!drop) continue;
    const min = drop.count?.[0] ?? 1;
    const max = drop.count?.[1] ?? 1;
    const c = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
    merged[drop.itemId] = (merged[drop.itemId] ?? 0) + c;
  }
  return Object.entries(merged).map(([itemId, count]) => ({ itemId, count }));
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
        set({
          pendingBattle: null,
          pendingEncounter: null,
          pendingHuntYield: null,
          pendingSpar: null,
        }),

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
        // Bump the defeat counter so `Condition.defeatedOpponent` quests
        // can auto-advance against this kill.
        draft.defeatedCounts[pb.opponentId] =
          (draft.defeatedCounts[pb.opponentId] ?? 0) + 1;
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
        // Inner-art XP — every art active fired counts toward its own
        // per-art pool, mirroring the move-skill loop above. Auto-levels
        // when the pool overflows the (2×) art-tier cost.
        const artUses = battleState?.artUses?.A ?? {};
        for (const [aid, count] of Object.entries(artUses)) {
          if (typeof count !== "number" || count <= 0) continue;
          const art = getArt(aid);
          if (!art || art.id === "none") continue;
          draft.artExp[aid] = (draft.artExp[aid] ?? 0) + count * ART_USE_XP;
          // Make sure an artLevels entry exists so applyArtLevelUps can
          // read a starting level — also covers legacy builds that learned
          // an art without populating artLevels.
          if (draft.playerBuild) {
            const cur = draft.playerBuild.artLevels?.[aid];
            if (typeof cur !== "number") {
              draft.playerBuild = {
                ...draft.playerBuild,
                artLevels: { ...(draft.playerBuild.artLevels ?? {}), [aid]: 1 },
              };
            }
          }
          applyArtLevelUps(draft, aid);
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

        // Roll the opponent's drop table (separate from hunt-yield, which
        // covers gathering kicks; these are the random-encounter loot).
        const oppDef = getOpponent(pb.opponentId);
        const lootSummary: string[] = [];
        if (oppDef?.drops && oppDef.drops.length > 0) {
          const lootRolls = rollOpponentLoot(oppDef.drops, oppDef.ti ?? 0);
          for (const it of lootRolls) {
            draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
            const def = getItem(it.itemId);
            lootSummary.push(`${def?.name ?? it.itemId}×${it.count}`);
          }
        }
        appendActionLog(
          draft,
          "combat",
          `ชนะ ${oppDef?.name ?? pb.opponentId}` +
            (lootSummary.length > 0 ? ` · ${lootSummary.join(", ")}` : ""),
        );

        // Now that loot, kill counts, and skill xp have all been written,
        // give the quest progress ticker a chance to advance any active
        // quest whose autoAdvance condition just became true.
        tickQuestProgress(draft);

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
        // Build a one-liner for the toast/log.
        if (yieldRoll.passed) {
          const itemPart = yieldRoll.items.length > 0
            ? yieldRoll.items.map((it) => {
                const def = getItem(it.itemId);
                return `${def?.name ?? it.itemId}×${it.count}`;
              }).join(", ")
            : "ไม่ได้ของ";
          appendActionLog(draft, "gather", `เก็บ ${res.name}: ${itemPart} · +${xpGained} xp`);
        } else {
          appendActionLog(draft, "gather", `เก็บ ${res.name}: ลองมือไม่สำเร็จ · +${xpGained} xp`);
        }
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

        // Artisan gating — the 6 craft professions (forge / alchemy /
        // tailoring / chef / jewelry / accessory) require:
        //   1. the recipe is in `learnedRecipeIds` (bought from an
        //      artisan)
        //   2. the player is currently at a location with an artisan
        //      whose profession matches recipe.skill
        // Other recipes (gathering-derived, drawing/writing) keep the
        // legacy "craft inline anywhere" behavior — they were never
        // shop-gated and the user's redesign explicitly targeted the
        // craftsman shops.
        const skill = r.skill;
        if (skill && ARTISAN_PROFESSIONS.has(skill)) {
          if (!s.learnedRecipeIds.includes(recipeId)) {
            return { ok: false, reason: "not-learned" };
          }
          const here = getArtisansAt(s.currentSceneId);
          const matching = here.find((a) => a.profession === skill);
          if (!matching) return { ok: false, reason: "no-artisan" };
        }

        // Mastery gate — recipes can require a minimum mastery level on
        // their `skill`. Below the threshold we refuse the attempt before
        // touching the inventory.
        const required = r.requiredMastery ?? 1;
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
        const outDef = getItem(r.output.itemId);
        if (dropCheck === "failed") {
          appendActionLog(draft, "craft", `ประดิษฐ์ ${r.name}: พลาด · +${xpGained} xp`);
        } else {
          appendActionLog(
            draft,
            "craft",
            `ประดิษฐ์ ${outDef?.name ?? r.output.itemId}×${r.output.count} · +${xpGained} xp`,
          );
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

        // Pre-flight for ตำราวิชา (manual) items — refuse without consuming
        // when the player can't actually use it. Two failure modes:
        //   - already learned (don't waste the manual)
        //   - effective stat below the requirement (book stays in inventory)
        //
        // The stat check uses `combinedStats(playerBuild, undefined,
        // { excludeEquipment: true })[reqStat]` — i.e. base + slotted /
        // learned skill bonuses (level-scaled) + art bonuses + conflict,
        // but NOT equipment. Rationale: a player should earn higher-tier
        // manuals through training (skills + arts) rather than just
        // suiting up. Battle damage / derived combat stats keep equipment
        // included via the default `combinedStats` call.
        if (def.use.t === "manualLearnSkill" || def.use.t === "manualLearnArt") {
          if (!s.playerBuild) return { ok: false, reason: "no-build" };
          if (def.use.t === "manualLearnSkill") {
            const learned = s.playerBuild.learnedSkillIds ?? [];
            if (learned.includes(def.use.skillId)) {
              return { ok: false, reason: "already-learned", itemId };
            }
          } else {
            const learned = s.playerBuild.learnedArtIds ?? [];
            if (learned.includes(def.use.artId)) {
              return { ok: false, reason: "already-learned", itemId };
            }
          }
          const reqStat = def.use.reqStat;
          const reqValue = def.use.reqValue;
          const current =
            combinedStats(s.playerBuild, undefined, { excludeEquipment: true })[
              reqStat
            ] ?? 0;
          if (current < reqValue) {
            return { ok: false, reason: "stat-too-low", stat: reqStat, needed: reqValue, current };
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
          appendActionLog(draft, "use", `ใช้ ${def.name} · +${eff.xp} xp`);
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
          const parts: string[] = [];
          if (hpHealed > 0) parts.push(`HP +${hpHealed}`);
          if (mpHealed > 0) parts.push(`MP +${mpHealed}`);
          appendActionLog(draft, "use", `ใช้ ${def.name} · ${parts.join(" / ") || "ไม่มีพลังให้ฟื้น"}`);
          set({ ...draft });
          return { ok: true, kind: "heal", itemId, hpHealed, mpHealed };
        }
        if (eff.t === "manualLearnSkill") {
          // Pre-flight already verified player meets the stat req and
          // hasn't learned the skill — apply the learn effect, which also
          // auto-slots the skill (see lib/world/effects.ts).
          applyEffects(draft, [{ t: "learnSkill", skillId: eff.skillId }]);
          draft.wExp += W_EXP_USE_ITEM;
          appendActionLog(draft, "learn", `ฝึก ${def.name} · เรียนวิชา ${getSkill(eff.skillId)?.n ?? eff.skillId}`);
          set({ ...draft });
          return { ok: true, kind: "manualLearnSkill", itemId, skillId: eff.skillId };
        }
        if (eff.t === "manualLearnArt") {
          const lv = eff.level && eff.level >= 1 ? eff.level : 1;
          applyEffects(draft, [{ t: "learnArt", artId: eff.artId, level: lv }]);
          draft.wExp += W_EXP_USE_ITEM;
          appendActionLog(draft, "learn", `ฝึก ${def.name} · เรียนวิชาในกาย ${getArt(eff.artId)?.n ?? eff.artId}`);
          set({ ...draft });
          return { ok: true, kind: "manualLearnArt", itemId, artId: eff.artId, level: lv };
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
        const restLabel = kind === "inn" ? "พักโรงเตี๊ยม" : kind === "temple" ? "พักวัด" : "พักริมทาง";
        appendActionLog(
          draft,
          "rest",
          cost > 0
            ? `${restLabel} · -${cost}🟡 · ฟื้น ${restored} แรง`
            : `${restLabel} · ฟื้น ${restored} แรง`,
        );
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
        appendActionLog(
          draft,
          "learn",
          `เร่งวิชาฝีมือ ${sk.n} → Lv.${lv + 1} (-${cost} w-exp)`,
        );
        set({ ...draft });
        return { ok: true, skillId, level: lv + 1, cost };
      },

      levelUpArtFromWExp: (artId) => {
        const s = get();
        const art = getArt(artId);
        if (!art || art.id === "none") return { ok: false, reason: "unknown" };
        if (!s.playerBuild) return { ok: false, reason: "unknown" };
        const lv = s.playerBuild.artLevels?.[artId] ?? 1;
        if (lv >= ART_LEVEL_MAX) return { ok: false, reason: "maxed" };
        const cost = xpToNextArtLevel(art, lv);
        if (s.wExp < cost) return { ok: false, reason: "insufficient" };

        const draft = draftFrom(s);
        draft.wExp -= cost;
        draft.playerBuild = {
          ...draft.playerBuild!,
          artLevels: {
            ...(draft.playerBuild!.artLevels ?? {}),
            [artId]: lv + 1,
          },
        };
        appendActionLog(
          draft,
          "learn",
          `เร่งวิชาในกาย ${art.n} → ขั้น ${lv + 1} (-${cost} w-exp)`,
        );
        set({ ...draft });
        return { ok: true, artId, level: lv + 1, cost };
      },

      practiceSkill: (rawId) => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "no-build" };
        const info = parseSlotId(rawId);
        if (!info) return { ok: false, reason: "unknown" };
        // Only practice at locations whose categories permit it.
        const sceneNow = getScene(s.currentSceneId);
        const locScene = sceneNow?.kind === "location" ? sceneNow : null;
        if (!locScene || !canPracticeAt(locScene)) {
          return { ok: false, reason: "not-allowed" };
        }
        if (s.stamina < PRACTICE_STAMINA_COST) {
          return { ok: false, reason: "stamina" };
        }

        const draft = draftFrom(s);
        draft.stamina = Math.max(0, draft.stamina - PRACTICE_STAMINA_COST);
        advanceTime(draft, PRACTICE_HOURS);
        draft.wExp += W_EXP_PRACTICE;

        if (info.kind === "skill") {
          const sk = info.skill;
          const types = effectiveTypes(sk);
          const mult = practiceXpBonus(locScene, types);
          const xpGained = Math.floor(PRACTICE_BASE_XP * mult);
          draft.skillExp[sk.id] = (draft.skillExp[sk.id] ?? 0) + xpGained;
          if (!(sk.id in draft.skillLevel)) draft.skillLevel[sk.id] = 1;
          const beforeLv = draft.skillLevel[sk.id]!;
          applySkillLevelUps(draft, sk.id);
          const afterLv = draft.skillLevel[sk.id]!;
          const leveledUp = afterLv > beforeLv;
          appendActionLog(
            draft,
            "learn",
            `ฝึก ${sk.n} · +${xpGained} xp${mult > 1 ? ` (×${mult.toFixed(2)})` : ""}` +
              (leveledUp ? ` · ขึ้น Lv.${afterLv}` : ""),
          );
          set({ ...draft });
          return {
            ok: true,
            kind: "skill",
            id: sk.id,
            xpGained,
            bonusMult: mult,
            leveledUp,
            newLevel: afterLv,
          };
        }

        // Art branch
        const art = info.art;
        const types = effectiveTypes(art);
        const mult = practiceXpBonus(locScene, types);
        const xpGained = Math.floor(PRACTICE_BASE_XP * mult);
        draft.artExp[art.id] = (draft.artExp[art.id] ?? 0) + xpGained;
        const beforeLv = draft.playerBuild!.artLevels?.[art.id] ?? 1;
        // Make sure artLevels has an entry so applyArtLevelUps starts from 1.
        if (typeof draft.playerBuild!.artLevels?.[art.id] !== "number") {
          draft.playerBuild = {
            ...draft.playerBuild!,
            artLevels: {
              ...(draft.playerBuild!.artLevels ?? {}),
              [art.id]: 1,
            },
          };
        }
        applyArtLevelUps(draft, art.id);
        const afterLv = draft.playerBuild!.artLevels?.[art.id] ?? beforeLv;
        const leveledUp = afterLv > beforeLv;
        appendActionLog(
          draft,
          "learn",
          `ฝึก ${art.n} · +${xpGained} xp${mult > 1 ? ` (×${mult.toFixed(2)})` : ""}` +
            (leveledUp ? ` · ขึ้นขั้น ${afterLv}` : ""),
        );
        set({ ...draft });
        return {
          ok: true,
          kind: "art",
          id: art.id,
          xpGained,
          bonusMult: mult,
          leveledUp,
          newLevel: afterLv,
        };
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
        appendActionLog(draft, "buy", `ซื้อ ${def.name}×${count} · -${total}🟡`);
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
        appendActionLog(draft, "sell", `ขาย ${def.name}×${count} · +${gained}🟡`);
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
        appendActionLog(draft, "learn", `เรียน ${sk.n} (วิชาฝีมือ) · -${price}🟡`);
        set({ ...draft });
        return { ok: true, id: skillId, spent: price };
      },

      buyRecipe: (recipeId, price) => {
        const s = get();
        const r = getRecipe(recipeId);
        if (!r) return { ok: false, reason: "unknown" };
        if (s.learnedRecipeIds.includes(recipeId)) {
          return { ok: false, reason: "already-learned" };
        }
        if (s.gold < price) return { ok: false, reason: "no-gold" };
        const draft = draftFrom(s);
        draft.gold -= price;
        draft.learnedRecipeIds = [...draft.learnedRecipeIds, recipeId];
        rollLukXp(draft);
        appendActionLog(draft, "learn", `เรียนสูตร ${r.name} · -${price}🟡`);
        set({ ...draft });
        return { ok: true, recipeId, spent: price };
      },

      buyEquipment: (equipId, price) => {
        const s = get();
        const e = getEquip(equipId);
        if (!e) return { ok: false, reason: "unknown" };
        if (s.gold < price) return { ok: false, reason: "no-gold" };
        const draft = draftFrom(s);
        draft.gold -= price;
        draft.inventoryEquipment[equipId] =
          (draft.inventoryEquipment[equipId] ?? 0) + 1;
        rollLukXp(draft);
        appendActionLog(draft, "buy", `ซื้อ ${e.n} · -${price}🟡`);
        set({ ...draft });
        return { ok: true, equipId, spent: price };
      },

      equipFromBag: (equipId) => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "no-build" };
        const e = getEquip(equipId);
        if (!e) return { ok: false, reason: "unknown" };
        if ((s.inventoryEquipment[equipId] ?? 0) < 1) {
          return { ok: false, reason: "missing" };
        }

        const draft = draftFrom(s);
        const eq = { ...draft.playerBuild!.equipment };
        const ty = e.ty;
        let chosenIdx = 0;
        let swapped: string | null = null;

        // Multi-slot types: prefer the first empty slot, else swap into
        // index 0 and push the displaced id back to the bag.
        if (ty === "BR" || ty === "R" || ty === "C") {
          const arr = [...eq[ty]] as [string | null, string | null];
          const emptyIdx = arr.findIndex((v) => v === null);
          chosenIdx = emptyIdx === -1 ? 0 : emptyIdx;
          if (arr[chosenIdx] !== null) swapped = arr[chosenIdx];
          arr[chosenIdx] = equipId;
          eq[ty] = arr;
        } else {
          // Single-slot types — direct swap.
          if (eq[ty] !== null) swapped = eq[ty];
          eq[ty] = equipId;
        }

        draft.playerBuild = { ...draft.playerBuild!, equipment: eq };

        // Pull one copy out of the bag; push any displaced id back.
        const bag = { ...draft.inventoryEquipment };
        const remain = (bag[equipId] ?? 0) - 1;
        if (remain <= 0) delete bag[equipId];
        else bag[equipId] = remain;
        if (swapped) bag[swapped] = (bag[swapped] ?? 0) + 1;
        draft.inventoryEquipment = bag;

        const swappedDef = swapped ? getEquip(swapped) : null;
        appendActionLog(
          draft,
          "use",
          swapped
            ? `ติดตั้ง ${e.n} (เก็บ ${swappedDef?.n ?? swapped} กลับย่าม)`
            : `ติดตั้ง ${e.n}`,
        );
        set({ ...draft });
        return {
          ok: true,
          equipId,
          slotType: ty,
          slotIdx: chosenIdx,
          swapped,
        };
      },

      unequipFromSlot: (slotType, slotIdx) => {
        const s = get();
        if (!s.playerBuild) return { ok: false, reason: "no-build" };
        const idx = (slotIdx ?? 0) as 0 | 1;
        const eq = { ...s.playerBuild.equipment };
        let cur: string | null = null;
        if (slotType === "BR" || slotType === "R" || slotType === "C") {
          cur = eq[slotType][idx];
        } else {
          cur = eq[slotType];
        }
        if (!cur) return { ok: false, reason: "empty" };
        const e = getEquip(cur);
        if (!e) return { ok: false, reason: "unknown" };

        const draft = draftFrom(s);
        const next = { ...draft.playerBuild!.equipment };
        if (slotType === "BR" || slotType === "R" || slotType === "C") {
          const arr = [...next[slotType]] as [string | null, string | null];
          arr[idx] = null;
          next[slotType] = arr;
        } else {
          next[slotType] = null;
        }
        draft.playerBuild = { ...draft.playerBuild!, equipment: next };
        draft.inventoryEquipment[cur] =
          (draft.inventoryEquipment[cur] ?? 0) + 1;
        appendActionLog(draft, "use", `ถอด ${e.n} เก็บลงย่าม`);
        set({ ...draft });
        return { ok: true, equipId: cur, slotType, slotIdx: idx };
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
        const artDef = getArt(artId);
        appendActionLog(draft, "learn", `เรียน ${artDef?.n ?? artId} (วิชาในกาย) · -${price}🟡`);
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

      acceptEncounter: () => {
        const s = get();
        if (!s.pendingEncounter || s.pendingBattle) return;
        const enc = s.pendingEncounter;
        const opp = getOpponent(enc.opponentId);
        if (!opp) {
          set({ pendingEncounter: null });
          return;
        }
        // Stage as a real battle. The bridge picks this up and starts
        // the fight; on resolution acknowledgeBattleResult routes back
        // to the encounter's returnSceneId.
        set({
          pendingEncounter: null,
          pendingBattle: {
            opponentId: enc.opponentId,
            onWin: enc.returnSceneId,
            onLose: enc.returnSceneId,
          },
        });
      },

      fleeEncounter: () => {
        const s = get();
        if (!s.pendingEncounter) return;
        // No combat: just discard the offer. The player stays at the
        // location they were on, no stamina cost beyond the move that
        // brought them here.
        set({ pendingEncounter: null });
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

      acceptQuest: (questId) => {
        const s = get();
        const def = getQuest(questId);
        if (!def) return { ok: false, reason: "unknown" };
        const cur = s.quests[questId];
        if (cur && cur.status === "active") return { ok: false, reason: "already-active" };
        if (cur && (cur.status === "done" || cur.status === "failed")) {
          return { ok: false, reason: "already-done" };
        }
        const draft = draftFrom(s);
        // applyEffects runs the existing startQuest dispatcher and the
        // quest progress ticker — so a quest whose stage 0 has an
        // autoAdvance that's already true can resolve a step or two on
        // accept (e.g., player already has the requested item).
        applyEffects(draft, [{ t: "startQuest", questId }]);
        appendActionLog(draft, "quest", `รับภารกิจ: ${def.name}`);
        set({ ...draft });
        return { ok: true, questId };
      },

      abandonQuest: (questId) => {
        const s = get();
        const def = getQuest(questId);
        if (!def) return { ok: false, reason: "unknown" };
        const cur = s.quests[questId];
        if (!cur || cur.status !== "active") return { ok: false, reason: "already-done" };
        const draft = draftFrom(s);
        // Mark failed without granting rewards — finishQuest's success=false
        // path skips the reward dispatcher.
        applyEffects(draft, [{ t: "finishQuest", questId, success: false }]);
        appendActionLog(draft, "quest", `ละทิ้งภารกิจ: ${def.name}`);
        set({ ...draft });
        return { ok: true, questId };
      },

      finishQuestNow: (questId) => {
        const s = get();
        const def = getQuest(questId);
        if (!def) return { ok: false, reason: "unknown" };
        const cur = s.quests[questId];
        if (!cur || cur.status !== "active") return { ok: false, reason: "already-done" };
        const draft = draftFrom(s);
        applyEffects(draft, [{ t: "finishQuest", questId, success: true }]);
        appendActionLog(draft, "quest", `สำเร็จภารกิจ: ${def.name}`);
        set({ ...draft });
        return { ok: true, questId };
      },

      _setFlag: (flag, value) =>
        set((s) => ({ flags: { ...s.flags, [flag]: value } })),

      _giveGold: (amount) => set((s) => ({ gold: Math.max(0, s.gold + amount) })),
    }),
    {
      name: "wusia-world-v1",
      version: 15,
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
        artExp: s.artExp,
        learnedRecipeIds: s.learnedRecipeIds,
        inventoryEquipment: s.inventoryEquipment,
        statExp: s.statExp,
        traits: s.traits,
        npcStates: s.npcStates,
        defeatedCounts: s.defeatedCounts,
        visitedLocationIds: s.visitedLocationIds,
        day: s.day,
        time: s.time,
        pendingBattle: s.pendingBattle,
        pendingEncounter: s.pendingEncounter,
        pendingHuntYield: s.pendingHuntYield,
        pendingSpar: s.pendingSpar,
        gameOver: s.gameOver,
        actionLog: s.actionLog,
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
      //   v9 → v10 added pendingEncounter. Existing saves default null.
      //   v10 → v11 added actionLog. Existing saves start with empty log.
      //   v11 → v12 added defeatedCounts + visitedLocationIds (quest auto-
      //            advance bookkeeping). Existing saves start empty — quest
      //            progress that depended on past kills/visits won't auto-
      //            backfill, which is fine for net-new content.
      //   v12 → v13 added artExp (per-art xp pool, parallel to skillExp).
      //            Existing saves start with empty pools — arts the player
      //            already learned keep their existing artLevels and grow
      //            from there.
      //   v13 → v14 added learnedRecipeIds + accessory life-skill key.
      //            Crafting now requires the recipe to be in
      //            learnedRecipeIds AND the player to be at an artisan
      //            of the matching profession (forge / alchemy /
      //            tailoring / chef / jewelry / accessory). Existing
      //            saves start with no recipes learned — players have to
      //            buy them at city / village / sect artisans.
      //   v14 → v15 added inventoryEquipment (bag for purchased gear).
      //            Equipment items can now be bought at artisans into
      //            this bag and equipped via `equipFromBag` /
      //            `unequipFromSlot`. Existing saves start with an
      //            empty bag.
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
          artExp: p.artExp && typeof p.artExp === "object" ? { ...p.artExp } : {},
          learnedRecipeIds: Array.isArray(p.learnedRecipeIds)
            ? [...p.learnedRecipeIds]
            : [],
          inventoryEquipment:
            p.inventoryEquipment && typeof p.inventoryEquipment === "object"
              ? { ...p.inventoryEquipment }
              : {},
          statExp: { ...emptyStatExp(), ...(p.statExp ?? {}) } as Record<StatKey, number>,
          traits: { ...emptyTraits(), ...(p.traits ?? {}) } as Record<TraitKey, number>,
          npcStates: p.npcStates && typeof p.npcStates === "object" ? { ...p.npcStates } : {},
          defeatedCounts:
            p.defeatedCounts && typeof p.defeatedCounts === "object"
              ? { ...p.defeatedCounts }
              : {},
          visitedLocationIds: Array.isArray(p.visitedLocationIds)
            ? [...p.visitedLocationIds]
            : [],
          day: typeof p.day === "number" && p.day >= 1 ? p.day : 1,
          time: typeof p.time === "number" && p.time >= 0 ? p.time : 0,
          pendingHuntYield: p.pendingHuntYield ?? null,
          pendingSpar: p.pendingSpar ?? null,
          pendingEncounter: p.pendingEncounter ?? null,
          gameOver: p.gameOver === true,
          actionLog: Array.isArray(p.actionLog) ? p.actionLog.slice(-ACTION_LOG_MAX) : [],
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
