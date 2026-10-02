// New life for towns, villages and homes (and new quests for old faces).
// Each group file exports one PlaceContent; this barrel merges them into the
// registries (npcs.ts, quests.ts, scenes.ts, opponents.ts, activities). See docs/content-authoring.md#places.
import type { PlaceContent } from "./types";
import { CONTENT as villages } from "./villages";
import { CONTENT as towns } from "./towns";
import { CONTENT as homesA } from "./homes_a";
import { CONTENT as homesB } from "./homes_b";
import { CONTENT as homesC } from "./homes_c";
import { CONTENT as eldersA } from "./elders_a";
import { CONTENT as eldersB } from "./elders_b";

const GROUPS: readonly PlaceContent[] = [villages, towns, homesA, homesB, homesC, eldersA, eldersB];

export const PLACE_NPCS = GROUPS.flatMap((g) => g.npcs);
export const PLACE_QUESTS = GROUPS.flatMap((g) => g.quests);
export const PLACE_SCENES = GROUPS.flatMap((g) => g.scenes);
export const PLACE_ACTIVITY_DEFS = GROUPS.flatMap((g) => g.activities);
export const PLACE_OPPONENT_SPECS = GROUPS.flatMap((g) => g.opponents);
