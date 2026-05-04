import type { WorldStateData } from "./types";
import { SCENES_BY_ID, START_SCENE_ID } from "./data/scenes";
import { ITEMS_BY_ID } from "./data/items";
import { QUESTS_BY_ID } from "./data/quests";
import { OPPONENTS_BY_ID } from "./data/opponents";

// Called from persist's onRehydrateStorage. Drops or repairs any references
// to data ids that don't exist anymore (e.g., a scene was removed between
// deploys, or an item id was renamed). Logs to console so authors notice.
export function validateAndRepair(state: WorldStateData): void {
  if (!state.hasGame) return;

  if (!SCENES_BY_ID.has(state.currentSceneId)) {
    console.warn(
      `[world] currentSceneId "${state.currentSceneId}" not found — resetting to "${START_SCENE_ID}"`,
    );
    state.currentSceneId = START_SCENE_ID;
  }

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
}
