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
  getQuestsForNpc,
  ITEMS,
  ITEMS_BY_ID,
  getItem,
  MYSTERY_MOVE_LABEL,
  SCROLL_PREFIX,
  scrollArtLevel,
  scrollItemId,
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
  ARTISANS,
  getArtisansAt,
  getArtisan,
  recipesOfferedBy,
  equipmentOfferedBy,
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
export {
  PRACTICE_XP,
  practiceXpGain,
  PRACTICE_CATEGORIES,
  CATEGORY_TYPE_BONUS,
  getLocationCategories,
  inferCategoriesFromId,
  canPracticeAt,
  practiceMatches,
  describeBonusForLocation,
} from "./location-categories";
export { evaluateCondition, getQuestStatus } from "./conditions";
export { KIDNAP_RETURN_DAYS, npcAwayDays, npcPresent } from "./npc-presence";
export { TRACK_NONE, activeGuide, guideForQuest, guideMarkerId, pathBetween, routeBackTarget, stageTargetNpc, trackedQuestId, type GuideKind, type QuestGuide } from "./quest-guide";
export {
  completeObjectiveSpot, objectiveMarkerId, objectiveProgress, objectiveSpotsAt, objectiveSpotsFor, objectiveSpotsForNpc,
  openObjectiveSpots, type ActiveObjectiveSpot, type ObjectiveResult,
} from "./quest-objectives";
export {
  applyEffect,
  applyEffects,
  collectActiveHuntTargets,
  describeQuestCondition,
  isQuestOfferable,
  isSecretSectQuest,
  isQuestTurnInForNpc,
  isSectQuestOfferable,
  tickQuestProgress,
  type QuestProgressLine,
} from "./effects";
export { validateAndRepair } from "./validate";
export {
  LOCATION_MAPS,
  getLocationMap,
  type LocationMapDef,
  type LocationMapExit,
  type MapPoint,
  type MapSpot,
} from "./data/location-maps";
export {
  classifyRouteEdge,
  getRouteMap,
  type RouteMapDef,
  type RouteMapType,
} from "./data/route-maps";
export { npcBattleSprite, npcBodySprite, npcPixelSprite, npcPortrait } from "./data/npc-portraits";
export {
  PLAYER_BODIES,
  PLAYER_BODY_LABEL,
  defaultBodyFor,
  heroBodyFor,
  playerBodySprite,
} from "./data/player-bodies";
export {
  SECT_MEMBERSHIPS,
  rankUpGold,
  type SectMembershipDef,
} from "./data/sect-memberships";
export { getQuestsForSect } from "./data";
// `initBattleBridge` is intentionally NOT exported from the barrel —
// it imports the world & battle stores, which would create a cycle when
// world-store imports from this barrel. Import it directly from
// "@/lib/world/battle-bridge" in app entry points instead.
export { BEAT_CHARS, markText, plainText, sliceSegments, splitBeats, type MarkKind, type TextSegment } from "./text-marks";
