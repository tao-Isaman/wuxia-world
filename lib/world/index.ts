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
} from "./data";
export { evaluateCondition, getQuestStatus } from "./conditions";
export { applyEffect, applyEffects } from "./effects";
export { validateAndRepair } from "./validate";
// `initBattleBridge` is intentionally NOT exported from the barrel —
// it imports the world & battle stores, which would create a cycle when
// world-store imports from this barrel. Import it directly from
// "@/lib/world/battle-bridge" in app entry points instead.
