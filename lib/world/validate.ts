import type { LifeSkill, TraitKey, WorldStateData } from "./types";
import { LIFE_SKILL_KEYS, TRAIT_KEYS } from "./types";
import { SCENES_BY_ID, START_SCENE_ID } from "./data/scenes";
import { ITEMS_BY_ID } from "./data/items";
import { QUESTS_BY_ID, getQuest } from "./data/quests";
import { OPPONENTS_BY_ID } from "./data/opponents";
import { RESOURCES_BY_ID } from "./data/resources";
import { NPCS_BY_ID } from "./data/npcs";
import { RECIPES_BY_ID } from "./data/recipes";
import { SKILLS_BY_ID } from "@/lib/game/data/skills";
import { ARTS_BY_ID } from "@/lib/game/data/arts";
import { EQUIPMENT_BY_ID } from "@/lib/game/data/equipment";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import {
  deriveAll,
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

  // Quests: drop unknown quest entries; clamp the stage index into the
  // current QuestDef.stages range so a content edit that shrinks stages
  // can't leave a quest pointing past the end.
  for (const questId of Object.keys(state.quests)) {
    if (!QUESTS_BY_ID.has(questId)) {
      console.warn(`[world] dropping unknown quest "${questId}"`);
      delete state.quests[questId];
      continue;
    }
    const def = getQuest(questId)!;
    const q = state.quests[questId]!;
    const maxStage = Math.max(0, def.stages.length - 1);
    if (typeof q.stage !== "number" || q.stage < 0) q.stage = 0;
    else if (q.stage > maxStage) q.stage = maxStage;
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

  // HP / MP — clamp into [0, deriveAll max]. Reseed missing values to full
  // when the player build is available so the bar reads right after a
  // fresh hydrate.
  if (state.playerBuild) {
    const d = deriveAll(state.playerBuild);
    if (typeof state.currentHp !== "number" || state.currentHp < 0) state.currentHp = d.HP;
    if (typeof state.currentMp !== "number" || state.currentMp < 0) state.currentMp = d.MP;
    state.currentHp = Math.min(d.HP, state.currentHp);
    state.currentMp = Math.min(d.MP, state.currentMp);
  } else {
    state.currentHp = Math.max(0, state.currentHp ?? 0);
    state.currentMp = Math.max(0, state.currentMp ?? 0);
  }

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

  // Inner-art xp pool — drop entries for arts that no longer exist; clamp
  // to non-negative integers. Levels live on playerBuild.artLevels (handled
  // below in the build-learn-arrays cleanup).
  if (!state.artExp || typeof state.artExp !== "object") state.artExp = {};
  for (const aid of Object.keys(state.artExp)) {
    if (!ARTS_BY_ID.has(aid)) {
      delete state.artExp[aid];
      continue;
    }
    const xp = state.artExp[aid];
    state.artExp[aid] = typeof xp === "number" && xp >= 0 ? xp : 0;
  }

  // Learned recipes — drop unknown ids, dedupe.
  if (!Array.isArray(state.learnedRecipeIds)) state.learnedRecipeIds = [];
  state.learnedRecipeIds = Array.from(
    new Set(state.learnedRecipeIds.filter((id) => RECIPES_BY_ID.has(id))),
  );

  // Equipment bag — drop unknown ids, clamp counts to non-negative
  // integers. Equipment ids live in lib/game/data/equipment.ts; missing
  // ids likely mean a piece was renamed or removed between deploys.
  if (
    !state.inventoryEquipment ||
    typeof state.inventoryEquipment !== "object"
  ) {
    state.inventoryEquipment = {};
  } else {
    for (const id of Object.keys(state.inventoryEquipment)) {
      if (!EQUIPMENT_BY_ID.has(id)) {
        console.warn(`[world] dropping unknown equipment id "${id}"`);
        delete state.inventoryEquipment[id];
        continue;
      }
      const v = state.inventoryEquipment[id];
      if (typeof v !== "number" || v <= 0 || !Number.isFinite(v)) {
        delete state.inventoryEquipment[id];
      } else {
        state.inventoryEquipment[id] = Math.floor(v);
      }
    }
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

  // Character traits — ensure every trait key is present and non-negative.
  if (!state.traits || typeof state.traits !== "object") {
    state.traits = Object.fromEntries(TRAIT_KEYS.map((k) => [k, 0])) as Record<TraitKey, number>;
  } else {
    for (const k of TRAIT_KEYS) {
      const v = state.traits[k];
      state.traits[k] = typeof v === "number" && v >= 0 ? v : 0;
    }
  }

  // NPC state — drop entries for NPCs that are no longer in the registry,
  // and clamp relationship to a sane numeric.
  if (!state.npcStates || typeof state.npcStates !== "object") {
    state.npcStates = {};
  } else {
    for (const id of Object.keys(state.npcStates)) {
      if (!NPCS_BY_ID.has(id)) {
        console.warn(`[world] dropping unknown npc state "${id}"`);
        delete state.npcStates[id];
        continue;
      }
      const e = state.npcStates[id];
      if (e && typeof e.relationship !== "number") {
        state.npcStates[id] = { ...e, relationship: 0 };
      }
    }
  }

  // pendingSpar — clear if the NPC was removed from the registry.
  if (state.pendingSpar && !NPCS_BY_ID.has(state.pendingSpar.npcId)) {
    console.warn(`[world] clearing dangling pendingSpar for unknown npc "${state.pendingSpar.npcId}"`);
    state.pendingSpar = null;
  }

  // Quest auto-advance bookkeeping. Drop counters / visits whose target
  // ids no longer exist; clamp counts to non-negative integers.
  if (!state.defeatedCounts || typeof state.defeatedCounts !== "object") {
    state.defeatedCounts = {};
  } else {
    for (const id of Object.keys(state.defeatedCounts)) {
      if (!OPPONENTS_BY_ID.has(id)) {
        delete state.defeatedCounts[id];
        continue;
      }
      const v = state.defeatedCounts[id];
      state.defeatedCounts[id] = typeof v === "number" && v >= 0 ? Math.floor(v) : 0;
    }
  }
  if (!Array.isArray(state.visitedLocationIds)) {
    state.visitedLocationIds = [];
  } else {
    state.visitedLocationIds = Array.from(
      new Set(
        state.visitedLocationIds.filter((id) => {
          const sc = SCENES_BY_ID.get(id);
          return Boolean(sc && sc.kind === "location");
        }),
      ),
    );
  }

  // Bad-action ledgers — drop entries whose target NPCs are no longer in
  // the registry, dedupe array forms, clamp counters to non-negative ints.
  if (!state.stoleFromCounts || typeof state.stoleFromCounts !== "object") {
    state.stoleFromCounts = {};
  } else {
    for (const id of Object.keys(state.stoleFromCounts)) {
      if (!NPCS_BY_ID.has(id)) {
        delete state.stoleFromCounts[id];
        continue;
      }
      const v = state.stoleFromCounts[id];
      state.stoleFromCounts[id] = typeof v === "number" && v >= 0 ? Math.floor(v) : 0;
    }
  }
  if (!Array.isArray(state.assassinatedNpcIds)) {
    state.assassinatedNpcIds = [];
  } else {
    state.assassinatedNpcIds = Array.from(
      new Set(state.assassinatedNpcIds.filter((id) => NPCS_BY_ID.has(id))),
    );
  }
  if (!Array.isArray(state.kidnappedNpcIds)) {
    state.kidnappedNpcIds = [];
  } else {
    state.kidnappedNpcIds = Array.from(
      new Set(state.kidnappedNpcIds.filter((id) => NPCS_BY_ID.has(id))),
    );
  }

  // pendingEncounter — clear if the opponent / return scene is gone.
  if (state.pendingEncounter) {
    const enc = state.pendingEncounter;
    const oppOk = OPPONENTS_BY_ID.has(enc.opponentId);
    const sceneOk = SCENES_BY_ID.has(enc.returnSceneId);
    if (!oppOk || !sceneOk) {
      console.warn(
        `[world] clearing dangling pendingEncounter (opponent=${oppOk} returnScene=${sceneOk})`,
      );
      state.pendingEncounter = null;
    }
  }

  // Build learn arrays — drop any unknown skill / art ids, dedupe, clamp
  // levels into [1, 10]. Pad skillIds to 10 if a save came through with
  // fewer (the migrate already does this for v8→v9 but a hand-edited save
  // could still slip in shorter).
  if (state.playerBuild) {
    const b = state.playerBuild;
    const slots = Array.isArray(b.skillIds) ? [...b.skillIds] : [];
    while (slots.length < 10) slots.push(null);
    const cleanSkills = (b.learnedSkillIds ?? []).filter((id) => SKILLS_BY_ID.has(id));
    const dedupedSkills = Array.from(new Set(cleanSkills));
    const cleanArts = (b.learnedArtIds ?? []).filter((id) => ARTS_BY_ID.has(id) && id !== "none");
    const dedupedArts = Array.from(new Set(cleanArts));
    const cleanLevels: Record<string, number> = {};
    for (const [aid, lv] of Object.entries(b.artLevels ?? {})) {
      if (!ARTS_BY_ID.has(aid)) continue;
      cleanLevels[aid] = Math.max(1, Math.min(10, Math.floor(lv)));
    }
    state.playerBuild = {
      ...b,
      skillIds: slots,
      learnedSkillIds: dedupedSkills,
      learnedArtIds: dedupedArts,
      artLevels: cleanLevels,
    };
  }

  // Sect membership rank clamp. The T3 sects (Huashan, Quanzhen, Songshan,
  // Taishan, Hengshan_south, Hengshan_north) were compressed from 9-rank
  // (9 → 1) to 5-rank (5 → 1). Stale saves may carry rank > startRank;
  // clamp them down so rank-up + auto-grant logic doesn't soft-lock.
  for (const [id, m] of Object.entries(state.sectMembership ?? {})) {
    const def = SECT_MEMBERSHIPS[id as keyof typeof SECT_MEMBERSHIPS];
    if (!def) continue;
    if (typeof m.rank === "number" && m.rank > def.startRank) {
      console.warn(
        `[world] sectMembership.${id} rank ${m.rank} > startRank ${def.startRank} — clamping`,
      );
      m.rank = def.startRank;
    }
    if (typeof m.rank === "number" && m.rank < def.topRank) {
      m.rank = def.topRank;
    }
  }
}
