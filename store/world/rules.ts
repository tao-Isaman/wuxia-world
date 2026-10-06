// Tuning constants shared by the world store's actions: time and stamina
// costs, xp rates, rest prices. Gameplay numbers — change them deliberately.
import type { LifeSkill } from "@/lib/world";

export const HUNT_XP_MULT = 8;                 // hunting xp = 8 * resourceLevel (combat is risky)
export const GATHER_XP_MULT = 5;               // non-combat xp = 5 * resourceLevel
export const CRAFT_XP_MULT = 5;                // craft xp = 5 * recipe.requiredMastery
export const FAIL_XP_FRACTION = 0.5;           // failed drop checks still teach you — half xp
// Sentinel mastery used for recipes with no skill — always passes the gate.
export const MAX_DUMMY_LEVEL = 99;

// Game-time costs. `HOURS_PER_DAY` = 12 ชั่วยาม.
export const HOURS_PER_DAY = 12;
// Stepping out of a location onto a road is the cheap half of a journey;
// arriving at a destination from the road is the expensive half.
export const LOC_TO_ROUTE_HOURS = 1;
export const ROUTE_TO_LOC_HOURS = 2;
// Stamina spent on every overworld travel (location → route or route →
// location). Exported so the UI can disable buttons when the player can't
// afford the move.
export const TRAVEL_STAMINA_COST = 10;
export const ACTION_HOURS = 0.2;
export const FIGHT_HOURS = 0.5;
export const FIGHT_STAMINA = 5;
export const REST_HOURS = 12;
// Sleeping in one's own bed (home_player) or at one's own sect (an active
// disciple on its grounds): free, a full restore, 4 ชั่วยาม.
export const REST_HOME_HOURS = 4;
export const REST_INN_COST = 300;

// Generic post-spar landing scenes — all sparring routes here on
// resolution. Authors don't need a per-NPC outcome scene.
export const SPAR_WIN_SCENE_ID = "npc_spar_win";
export const SPAR_LOSE_SCENE_ID = "npc_spar_lose";

// Practice xp granted per "เล่นเพลง" click. Small so the loop isn't trivial
// to grind — books and song books are the bigger xp source.
export const PRACTICE_MUSIC_XP = 10;

// W-exp drop rates per action. W-exp is the "any-action" pool the player
// can spend to level up move skills, alongside the per-skill xp bar that
// only fills via combat use.
export const W_EXP_GATHER = 10;
export const W_EXP_CRAFT = 5;
export const W_EXP_USE_ITEM = 5;
export const W_EXP_PRACTICE_MUSIC = 5;
export const W_EXP_FIGHT_WIN = 50;
// Per-skill xp gained for each use of a skill in a battle the player won.
export const SKILL_USE_XP = 20;
// Per-art xp gained for each art active fired in a battle the player won.
// Same value as SKILL_USE_XP — the natural 2× difficulty comes from the
// art-tier xp curve being 2× the move-skill curve, not from a smaller drop.
export const ART_USE_XP = 20;

// "ฝึกฝน" practice action — costs stamina + ชั่วยาม, awards xp on the
// chosen skill / art. Practice xp scales with the location's category-type
// bonus (forest/cave/mountain/river — see lib/world/location-categories.ts).
export const PRACTICE_STAMINA_COST = 30;
export const PRACTICE_HOURS = 6;
export const W_EXP_PRACTICE = 5;

// Crafting professions that require an artisan + learned recipe to
// craft. Non-artisan recipes (mining-derived, drawing/writing, etc.)
// keep the legacy "craft inline" behavior.
export const ARTISAN_PROFESSIONS: ReadonlySet<LifeSkill> = new Set<LifeSkill>([
  "forge",
  "alchemy",
  "tailoring",
  "chef",
  "jewelry",
  "accessory",
]);

/** w-exp from one session of jail meditation (6 ชั่วยาม). */
export const JAIL_MEDITATE_WEXP = 40;
