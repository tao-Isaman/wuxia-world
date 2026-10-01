// Where each repainted auto map's path actually reaches the border, per
// destination, in percent of the painting. Exits default to their edge slot
// (auto-maps.ts EXIT_SLOTS); an entry here moves the marker onto the painted
// path at that edge. Authored with scripts/map-collision-tool.ts --exits.
import type { MapPoint } from "./location-maps";

export const AUTO_MAP_EXIT_POINTS: Readonly<Record<string, Readonly<Record<string, MapPoint>>>> = {};
