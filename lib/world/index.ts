// Public surface for the world / story engine.
// UI code should import from here rather than reaching into internal modules.

export * from "./types";
export {
  SCENES,
  SCENES_BY_ID,
  getScene,
  START_SCENE_ID,
  QUESTS,
  QUESTS_BY_ID,
  getQuest,
  ITEMS,
  ITEMS_BY_ID,
  getItem,
  OPPONENTS,
  OPPONENTS_BY_ID,
  getOpponent,
  fightEventsForLocation,
  zoneOfLocation,
  ZONE_CATEGORY_WEIGHT,
  type EnemyZone,
  NPCS,
  NPCS_BY_ID,
  getNpc,
  getNpcsAtLocation,
  SHOPS,
  SHOPS_BY_LOCATION,
  getShopAt,
  type ShopDef,
  SECT_HALLS,
  SECT_HALLS_BY_LOCATION,
  getSectHallAt,
  type SectHallDef,
  type SectHallOffer,
  RESOURCES,
  RESOURCES_BY_ID,
  getResource,
  RECIPES,
  RECIPES_BY_ID,
  getRecipe,
  LIFE_SKILL_LABEL,
  LIFE_SKILL_ICON,
  MASTERY_THRESHOLDS,
  MAX_MASTERY,
  DROP_CHECK_BASE,
  DROP_CHECK_PER_DELTA,
  DROP_CHECK_MIN,
  DROP_CHECK_MAX,
  masteryLevel,
  masteryProgress,
  gatherSuccessChance,
  pickWeighted,
} from "./data";
export { evaluateCondition, getQuestStatus } from "./conditions";
export { applyEffect, applyEffects } from "./effects";
export { validateAndRepair } from "./validate";
// `initBattleBridge` is intentionally NOT exported from the barrel —
// it imports the world & battle stores, which would create a cycle when
// world-store imports from this barrel. Import it directly from
// "@/lib/world/battle-bridge" in app entry points instead.
