// Hero progression inside an action's draft: stat, move-skill and inner-art xp
// with their auto level-ups, the resigned-sect freeze and meridian points.
import { type CharacterBuild, type StatKey, ART_LEVEL_MAX, getArt, getSkill, SKILL_LEVEL_MAX, xpToNextArtLevel, xpToNextLevel } from "@/lib/game";
import { lukRollChance, STAT_XP_PER_ACTION, xpToNextStatLevel } from "@/lib/world/stat-progression";
import type { WorldStateData } from "@/lib/world";
import { SECT_MEMBERSHIPS } from "@/lib/world/data/sect-memberships";
import { appendActionLog } from "./state";

// Push the current skill levels into the player build so the engine reads
// them at battle handoff time (BattleContext snapshots `build.skillLevels`).
export function syncPlayerSkillLevels(state: WorldStateData): void {
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
export function applyStatLevelUps(state: WorldStateData, key: StatKey): void {
  if (!state.playerBuild) return;
  let build: CharacterBuild = state.playerBuild;
  while (true) {
    const base: number = build.stats[key];
    const cost = xpToNextStatLevel(base, key);
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
export function grantStatXp(state: WorldStateData, key: StatKey, amount: number): void {
  if (amount <= 0) return;
  if (!state.playerBuild) return;
  state.statExp[key] = (state.statExp[key] ?? 0) + amount;
  applyStatLevelUps(state, key);
}

// LUK roll on any qualifying action. The base chance is 10 %, +1 % per
// current LUK, capped at 50 %. On pass, banks STAT_XP_PER_ACTION into the
// LUK pool (which can itself level LUK and tighten the next roll).
export function rollLukXp(state: WorldStateData): void {
  if (!state.playerBuild) return;
  const base = state.playerBuild.stats.LUK;
  if (Math.random() < lukRollChance(base)) {
    grantStatXp(state, "LUK", STAT_XP_PER_ACTION);
  }
}

// Returns true if the skill / art was granted via a sect's reward chain
// AND that sect's membership status is "resigned". Resigned skills /
// arts retain their current level but never accumulate further XP —
// the cost of formal resignation. Betrayed sects keep gaining XP (the
// trade-off there is hunter ambushes elsewhere).
export function isFrozen(state: WorldStateData, id: string, sect: string | undefined): boolean {
  for (const [sectId, m] of Object.entries(state.sectMembership)) {
    if (!m || m.status !== "resigned") continue;
    // The resigned sect's own lineage (taught by its lineage quests and
    // sagas), plus anything picked under the old rank pools (older saves).
    if (sect && SECT_MEMBERSHIPS[sectId as import("@/lib/world").SectId]?.name === sect) return true;
    if (Object.values(m.rewardPicks).includes(id)) return true;
  }
  return false;
}

export function isSkillFrozen(state: WorldStateData, skillId: string): boolean {
  return isFrozen(state, skillId, getSkill(skillId)?.sc);
}

export function isArtFrozen(state: WorldStateData, artId: string): boolean {
  return isFrozen(state, artId, getArt(artId)?.sc);
}

// Auto-level a move skill while its xp pool allows. Caps at SKILL_LEVEL_MAX
// and rolls overflow into the next tier (which will simply sit at 0 if the
// skill is now max).
export function applySkillLevelUps(state: WorldStateData, skillId: string): void {
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
      `กระบวนท่า ${sk.n} เลื่อนขั้นเป็น Lv.${state.skillLevel[skillId]}`,
    );
    grantMeridianPoints(state, levelsGained);
  }
  syncPlayerSkillLevels(state);
}

// Auto-level an inner art while its xp pool allows. Levels live on
// `playerBuild.artLevels`; xp lives on top-level `state.artExp`. Caps at
// ART_LEVEL_MAX and rolls overflow forward.
export function applyArtLevelUps(state: WorldStateData, artId: string): void {
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
      `ลมปราณ ${art.n} เลื่อนขั้นเป็น ${newLv}`,
    );
    grantMeridianPoints(state, levelsGained);
  }
}

// แต้มชีพจร: +1 per level a move skill or inner art gains, from every
// source (battle xp, practice, w-exp). Logged as its own kind.
export const MERIDIAN_POINTS_PER_LEVEL = 1;
export function grantMeridianPoints(state: WorldStateData, levels: number): void {
  if (levels <= 0) return;
  const gain = levels * MERIDIAN_POINTS_PER_LEVEL;
  state.meridianPoints = Math.max(0, (state.meridianPoints ?? 0) + gain);
  appendActionLog(state, "meridian", `ได้แต้มชีพจร +${gain} (มี ${state.meridianPoints})`);
}
