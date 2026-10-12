// Tuning constants shared by the world store's actions: time and stamina
// costs, xp rates, rest prices. Gameplay numbers — change them deliberately.
import type { LifeSkill } from "@/lib/world";

export const HUNT_XP_MULT = 8;                 // hunting xp = 8 * resourceLevel (combat is risky)
export const GATHER_XP_MULT = 5;               // non-combat xp = 5 * resourceLevel
export const CRAFT_XP_MULT = 5;                // craft xp = 5 * recipe.requiredMastery
export const FAIL_XP_FRACTION = 0.5;           // failed drop checks still teach you — half xp
// Sentinel mastery used for recipes with no skill — always passes the gate.
export const MAX_DUMMY_LEVEL = 99;

// Game time: 12 ชั่วยาม a day, on the world clock (lib/world/clock.ts, one
// day = one real hour). Actions no longer take time; the `*_HOURS` numbers
// below are what an action used to take and set its stamina price
// (staminaForHours in ./lifecycle).
export { HOURS_PER_DAY } from "@/lib/world/clock";
// Stepping out of a location onto a road is the cheap half of a journey;
// arriving at a destination from the road is the expensive half.
export const LOC_TO_ROUTE_HOURS = 1;
export const ROUTE_TO_LOC_HOURS = 2;
// Travel costs no stamina: only fights and activities spend it.
export const ACTION_HOURS = 0.2;
export const FIGHT_HOURS = 0.5;
export const FIGHT_STAMINA = 5;
// Sleeping in one's own bed (home_player) or at one's own sect (an active
// disciple on its grounds): free and a full restore; a temple half, the
// roadside a quarter. These free rests are ready again after
// REST_COOLDOWN_HOURS ชั่วยาม (10 real minutes); an inn room (full) any time.
export const REST_COOLDOWN_HOURS = 2;
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
// A won fight pays by the foe: lib/world/victory.ts victoryWExp.
// Per-skill / per-art xp for each use in a battle the player won (the art's is
// the same — the natural 2× difficulty comes from the art-tier xp curve being
// 2× the move-skill curve). Defined with the spoils roll, lib/world/spoils.ts.
export { ART_USE_XP, SKILL_USE_XP } from "@/lib/world/spoils";

// "ฝึกฝน" practice action — costs stamina + ชั่วยาม, awards xp on the
// chosen skill / art. Practice xp scales with the location's category-type
// bonus (forest/cave/mountain/river — see lib/world/location-categories.ts).
export const PRACTICE_STAMINA_COST = 30;
export const PRACTICE_HOURS = 6;
export const W_EXP_PRACTICE = 5;

// Crafting professions that require an artisan + learned recipe to
// craft. Non-artisan recipes (mining-derived, drawing/writing, etc.) are
// crafted anywhere (`craftsAnywhere`, the อาชีพ menu's ประดิษฐ์ tab).
export { ARTISAN_PROFESSIONS } from "@/lib/world/data/recipes";

/** w-exp from one session of jail meditation; one sitting per JAIL_MEDITATE_COOLDOWN ชั่วยาม. */
export const JAIL_MEDITATE_WEXP = 40;
export const JAIL_MEDITATE_COOLDOWN = 3;
/** ชั่วยาม a stint of hard labour takes off the sentence; a failed escape adds JAIL_ESCAPE_PENALTY_HOURS. */
export const JAIL_LABOR_HOURS = 2;
export const JAIL_ESCAPE_PENALTY_HOURS = 2;
