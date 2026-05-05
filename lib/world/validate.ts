import type { LifeSkill, WorldStateData } from "./types";
import { LIFE_SKILL_KEYS } from "./types";
import { SCENES_BY_ID, START_SCENE_ID } from "./data/scenes";
import { ITEMS_BY_ID } from "./data/items";
import { QUESTS_BY_ID } from "./data/quests";
import { OPPONENTS_BY_ID } from "./data/opponents";
import { RESOURCES_BY_ID } from "./data/resources";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import {
  SKILL_LEVEL_MAX,
  SKILL_LEVEL_MIN,
  STAT_KEYS,
  type StatKey,
} from "@/lib/game";

// Called from persist's onRehydrateStorage. Drops or repairs any references
// to data ids that don't exist anymore (e.g., a scene was removed between
// deploys, or an item id was renamed). Logs to console so authors notice.
export function validateAndRepair(state: WorldStateData): void {
  if (!state.hasGame) return;

  const cur = SCENES_BY_ID.get(state.currentSceneId);
  if (!cur) {
    console.warn(
      `[world] currentSceneId "${state.currentSceneId}" not found — resetting to "${START_SCENE_ID}"`,
    );
    state.currentSceneId = START_SCENE_ID;
  }

  // lastLocationId must point to a known scene of kind "location".
  if (state.lastLocationId) {
    const ll = SCENES_BY_ID.get(state.lastLocationId);
    if (!ll) {
      console.warn(
        `[world] lastLocationId "${state.lastLocationId}" not found — clearing`,
      );
      state.lastLocationId = null;
    } else if (ll.kind !== "location") {
      console.warn(
        `[world] lastLocationId "${state.lastLocationId}" is not a location — clearing`,
      );
      state.lastLocationId = null;
    }
  }

  // Transient engine flags must never survive a reload — `_skipEventRoll`
  // is set by rollRandomEvent to suppress the immediate return-roll, and
  // would silently swallow the next on-enter event if it leaked.
  delete state.flags._skipEventRoll;

  // Inventory: drop unknown items.
  for (const itemId of Object.keys(state.inventory)) {
    if (!ITEMS_BY_ID.has(itemId)) {
      console.warn(`[world] dropping unknown item "${itemId}" from inventory`);
      delete state.inventory[itemId];
    }
  }

  // Quests: drop unknown quest entries.
  for (const questId of Object.keys(state.quests)) {
    if (!QUESTS_BY_ID.has(questId)) {
      console.warn(`[world] dropping unknown quest "${questId}"`);
      delete state.quests[questId];
    }
  }

  // pendingBattle: clear if opponent unknown or its target scenes missing.
  if (state.pendingBattle) {
    const pb = state.pendingBattle;
    const opponentOk = OPPONENTS_BY_ID.has(pb.opponentId);
    const winOk = SCENES_BY_ID.has(pb.onWin);
    const loseOk = SCENES_BY_ID.has(pb.onLose);
    if (!opponentOk || !winOk || !loseOk) {
      console.warn(
        `[world] clearing dangling pendingBattle (opponent=${opponentOk} onWin=${winOk} onLose=${loseOk})`,
      );
      state.pendingBattle = null;
    }
  }

  // pendingHuntYield: drop if the resource id is gone or the return scene
  // is missing. Without pendingBattle this can also leak across sessions.
  if (state.pendingHuntYield) {
    const phy = state.pendingHuntYield;
    if (!RESOURCES_BY_ID.has(phy.resourceId) || !SCENES_BY_ID.has(phy.returnSceneId)) {
      console.warn(`[world] clearing dangling pendingHuntYield`);
      state.pendingHuntYield = null;
    }
  }

  // Stamina invariants: never negative, never above max, max sane.
  if (typeof state.staminaMax !== "number" || state.staminaMax <= 0) state.staminaMax = 100;
  if (typeof state.stamina !== "number") state.stamina = state.staminaMax;
  state.stamina = Math.max(0, Math.min(state.staminaMax, state.stamina));

  // Life-skill xp: ensure all six keys are present and non-negative.
  if (!state.lifeSkillXp || typeof state.lifeSkillXp !== "object") {
    state.lifeSkillXp = Object.fromEntries(LIFE_SKILL_KEYS.map((k) => [k, 0])) as Record<LifeSkill, number>;
  } else {
    for (const k of LIFE_SKILL_KEYS) {
      const v = state.lifeSkillXp[k];
      state.lifeSkillXp[k] = typeof v === "number" && v >= 0 ? v : 0;
    }
  }

  // Game time invariants. Day must be ≥ 1; time normalised to [0, 12).
  if (typeof state.day !== "number" || state.day < 1) state.day = 1;
  if (typeof state.time !== "number" || state.time < 0) state.time = 0;
  while (state.time >= 12) {
    state.time -= 12;
    state.day += 1;
  }

  // Move-skill progression: clamp level into [1, MAX], drop entries for
  // skills that no longer exist, and keep the player build's `skillLevels`
  // mirror in sync so the engine reads the right multipliers.
  if (typeof state.wExp !== "number" || state.wExp < 0) state.wExp = 0;
  if (!state.skillLevel || typeof state.skillLevel !== "object") state.skillLevel = {};
  if (!state.skillExp || typeof state.skillExp !== "object") state.skillExp = {};
  for (const sid of Object.keys(state.skillLevel)) {
    if (!SKILLS_BY_ID.has(sid)) {
      delete state.skillLevel[sid];
      continue;
    }
    const lv = state.skillLevel[sid];
    if (typeof lv !== "number" || !Number.isFinite(lv)) {
      state.skillLevel[sid] = SKILL_LEVEL_MIN;
    } else {
      state.skillLevel[sid] = Math.max(SKILL_LEVEL_MIN, Math.min(SKILL_LEVEL_MAX, Math.floor(lv)));
    }
  }
  for (const sid of Object.keys(state.skillExp)) {
    if (!SKILLS_BY_ID.has(sid)) {
      delete state.skillExp[sid];
      continue;
    }
    const xp = state.skillExp[sid];
    state.skillExp[sid] = typeof xp === "number" && xp >= 0 ? xp : 0;
  }
  if (state.playerBuild) {
    state.playerBuild = {
      ...state.playerBuild,
      skillLevels: { ...state.skillLevel },
    };
  }

  // Stat-progression pools — ensure all 8 keys are present and non-negative.
  if (!state.statExp || typeof state.statExp !== "object") {
    state.statExp = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Record<StatKey, number>;
  } else {
    for (const k of STAT_KEYS) {
      const v = state.statExp[k];
      state.statExp[k] = typeof v === "number" && v >= 0 ? v : 0;
    }
  }
}
