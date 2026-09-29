import { deriveAll, getSkill, SKILL_LEVEL_MAX, xpToNextLevel } from "@/lib/game";
import { CAPITAL_TRAINING_OPPONENT_ID } from "./data/capital-training";
import type { WorldStateData } from "./types";

type TrainingState = Pick<WorldStateData,
  "currentSceneId" | "playerBuild" | "currentHp" | "currentMp" | "stamina" | "defeatedCounts" | "pendingBattle" | "gameOver"
>;

/** Shared by the hall and its optional guide; never changes saved progress. */
export function capitalTrainingStatus(state: TrainingState) {
  if (state.currentSceneId !== "city_capital" || !state.playerBuild || state.gameOver) return null;
  const maximum = deriveAll(state.playerBuild);
  const hp = state.currentHp ?? maximum.HP;
  const mp = state.currentMp ?? maximum.MP;
  const completed = (state.defeatedCounts[CAPITAL_TRAINING_OPPONENT_ID] ?? 0) > 0;
  const needsRest = hp < maximum.HP || mp < 2 || state.stamina < 5;
  return { completed, needsRest, hp, maxHp: maximum.HP, mp,
    canStart: !completed && !state.pendingBattle && hp > 1 && mp >= 2 && state.stamina >= 5 };
}

type UpgradeState = Pick<WorldStateData, "defeatedCounts" | "skillLevel" | "skillExp" | "wExp">;

/** A single starter-skill upgrade. Spending W-EXP consumes its banked XP,
 * which naturally ends this hint, including across reloads. */
export function capitalTrainingUpgrade(state: UpgradeState) {
  if (!(state.defeatedCounts[CAPITAL_TRAINING_OPPONENT_ID] > 0)) return null;
  const skill = getSkill("basic_punch")!;
  const level = state.skillLevel[skill.id] ?? 1;
  const banked = state.skillExp[skill.id] ?? 0;
  if (level >= SKILL_LEVEL_MAX || banked <= 0) return null;
  const cost = Math.max(0, xpToNextLevel(skill, level) - banked);
  return state.wExp >= cost ? { skill, level, cost } : null;
}
