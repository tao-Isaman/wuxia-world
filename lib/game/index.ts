// Public surface of the game engine.
// UI code should depend on this barrel rather than the internal modules.

export * from "./types";
export {
  TIERS,
  STAT_KEYS,
  STAT_LABEL,
  STAT_BUDGET,
  DEFAULT_STATS,
  SKILLS,
  ARTS,
  EQUIPMENT,
  SLOT_LABELS,
  WEAPON_FAMILY_LABEL,
  WEAPON_FAMILY_HINT,
  getSkill,
  getArt,
  getEquip,
} from "./data";
export {
  derive,
  deriveAll,
  combinedStats,
  getEquipBonus,
  getEquipStatBonus,
  getEquippedItems,
  getMasteryMap,
  getWeaponMastery,
  totalStatPoints,
  type EquipBonus,
  type MasteryMap,
} from "./derive";
export { hitPct, critPct, hpColor, CRIT_MULTIPLIER } from "./damage";
export {
  SKILL_LEVEL_MIN,
  SKILL_LEVEL_MAX,
  SKILL_XP_BASE,
  getSkillLevel,
  clampLevel,
  bpMultiplier,
  mgMultiplier,
  effectiveBp,
  effectiveMg,
  xpToNextLevel,
} from "./leveling";
export {
  CONFLICT_MIN_LEARNED,
  CONFLICT_THRESHOLD,
  CONFLICT_HALF_FACTOR,
  CONFLICT_ZERO_FACTOR,
  computeConflictFactors,
  effectiveTypes,
  getStatusFactor,
  type ConflictFactors,
} from "./skill-conflict";
export {
  ART_SLOT_PREFIX,
  parseSlotId,
  encodeArtSlot,
  isArtSlot,
  firstArtSlotIndex,
  placeInFirstEmpty,
  type SlotInfo,
} from "./slots";
export {
  opposite,
  addBuff,
  addDebuff,
  logLine,
  applySelfEffect,
  applyEnemyEffect,
  checkPassive,
  checkWin,
  tickEffects,
} from "./effects";
export {
  makeContext,
  makeInitialState,
  getNextTurn,
  gaugeRate,
  tickGauges,
  peekReadyActor,
  consumeGauge,
  decrementCooldowns,
  calcSkillDamage,
  resolveSkill,
  resolveArtActive,
  type BattleContext,
  type DamageResult,
  type InitialStateOpts,
} from "./battle";
export { runAITurn } from "./ai";
