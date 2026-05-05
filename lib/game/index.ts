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
} from "./battle";
export { runAITurn } from "./ai";
