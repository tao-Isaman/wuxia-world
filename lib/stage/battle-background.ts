import { CAPITAL_TRAINING_OPPONENT_ID } from "@/lib/world/data/capital-training";
import type { WorldStateData } from "@/lib/world/types";

export interface BattleBackground {
  id: "courtyard" | "capital-training" | "capital-street";
  image: string;
  label: string;
}

export const BATTLE_BACKGROUNDS: Readonly<Record<BattleBackground["id"], BattleBackground>> = {
  courtyard: { id: "courtyard", image: "/art/jade-courtyard.png", label: "ลานประลอง" },
  "capital-training": { id: "capital-training", image: "/art/battle-capital-training.png", label: "ลานฝึกนครหลวง" },
  "capital-street": { id: "capital-street", image: "/art/battle-capital-street.png", label: "ถนนในนครหลวง" },
};

type BattleBackgroundContext = Pick<WorldStateData, "pendingBattle" | "currentSceneId" | "lastLocationId"> & {
  mode: "world" | "free";
};

/** Presentation only: existing world intent identifies where combat began. */
export function resolveBattleBackground(context: BattleBackgroundContext): BattleBackground {
  const battle = context.pendingBattle;
  if (context.mode !== "world" || !battle) return BATTLE_BACKGROUNDS.courtyard;
  if (battle.opponentId === CAPITAL_TRAINING_OPPONENT_ID) return BATTLE_BACKGROUNDS["capital-training"];

  // Random events fire on location arrival. The former route is no longer
  // recorded, so a home→capital journey must not imply a road-side fight.
  // Require both location anchors and both returns to agree on the city.
  if (context.currentSceneId === "city_capital" && context.lastLocationId === "city_capital" &&
      battle.onWin === "city_capital" && battle.onLose === "city_capital") {
    return BATTLE_BACKGROUNDS["capital-street"];
  }
  return BATTLE_BACKGROUNDS.courtyard;
}
