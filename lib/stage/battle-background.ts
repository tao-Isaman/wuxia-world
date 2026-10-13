import { CAPITAL_TRAINING_OPPONENT_ID } from "@/lib/world/data/capital-training";
import { getLocationMap } from "@/lib/world/data/location-maps";
import { getRouteMap } from "@/lib/world/data/route-maps";
import { getScene } from "@/lib/world/data/scenes";
import type { WorldStateData } from "@/lib/world/types";

export interface BattleBackground {
  /** "courtyard", "capital-training", "capital-street", "place:<locationId>" or "road:<routeSceneId>". */
  id: string;
  image: string;
  label: string;
  /** A road's region grade (lib/stage/route-grade.ts), as the road map draws it. */
  grade?: string;
}

export const BATTLE_BACKGROUNDS: Readonly<Record<"courtyard" | "capital-training" | "capital-street", BattleBackground>> = {
  courtyard: { id: "courtyard", image: "/art/jade-courtyard.png", label: "ลานประลอง" },
  "capital-training": { id: "capital-training", image: "/art/battle-capital-training.png", label: "ลานฝึกนครหลวง" },
  "capital-street": { id: "capital-street", image: "/art/battle-capital-street.png", label: "ถนนในนครหลวง" },
};

type BattleBackgroundContext = Pick<WorldStateData, "pendingBattle" | "currentSceneId" | "lastLocationId"> & {
  mode: "world" | "free";
};

// One object per place / road, so the canvas (keyed on the id) is not rebuilt each render.
const made = new Map<string, BattleBackground | null>();
const once = (id: string, make: () => BattleBackground | null): BattleBackground | null => {
  if (!made.has(id)) made.set(id, make());
  return made.get(id)!;
};
const sceneName = (id: string) => (getScene(id) as { name?: string } | undefined)?.name;

/** A place's own painting: the map the hero stands on. The capital keeps its painted street. */
function placeBackground(locationId: string | null | undefined): BattleBackground | null {
  if (!locationId) return null;
  if (locationId === "city_capital") return BATTLE_BACKGROUNDS["capital-street"];
  return once(`place:${locationId}`, () => {
    const map = getLocationMap(locationId);
    return map ? { id: `place:${locationId}`, image: map.image, label: sceneName(locationId) ?? "ลานประลอง" } : null;
  });
}

/** A road's painting, graded for the land it crosses. */
function roadBackground(routeSceneId: string): BattleBackground | null {
  return once(`road:${routeSceneId}`, () => {
    const road = getRouteMap(routeSceneId);
    if (!road) return null;
    const name = sceneName(routeSceneId);
    return { id: `road:${routeSceneId}`, image: road.image, grade: road.grade, label: name ?? "เส้นทาง" };
  });
}

/**
 * Presentation only: the fight is drawn over the painting of where it began —
 * the road the hero walks, else the place they stand in (a dialog's fight
 * happens at the place the talk is held, `lastLocationId`). The beginner bout
 * has its own yard; /debug and an unknown place keep the jade courtyard.
 */
export function resolveBattleBackground(context: BattleBackgroundContext): BattleBackground {
  const battle = context.pendingBattle;
  if (context.mode !== "world" || !battle) return BATTLE_BACKGROUNDS.courtyard;
  if (battle.opponentId === CAPITAL_TRAINING_OPPONENT_ID) return BATTLE_BACKGROUNDS["capital-training"];
  const here = context.currentSceneId;
  if (here?.startsWith("route_")) return roadBackground(here) ?? BATTLE_BACKGROUNDS.courtyard;
  return placeBackground(here) ?? placeBackground(context.lastLocationId) ?? BATTLE_BACKGROUNDS.courtyard;
}
