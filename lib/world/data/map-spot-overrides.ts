/**
 * Marker positions moved in the engine's map editor (/game/engine, แผนที่ →
 * ย้ายจุด): the spawn, NPCs, exits and service spots of a location map. The
 * editor writes map-spot-overrides.json (map percentages, like
 * LocationMapDef); getLocationMap lays it over the hand-authored or automatic
 * map, so the runtime, the quest guide and every test see the moved points.
 */
import type { LocationMapDef, MapPoint } from "./location-maps";
import raw from "./map-spot-overrides.json";

/** One map's moved markers. `spots` is keyed by the spot's index in `LocationMapDef.spots`. */
export interface MapSpotEdits {
  spawn?: MapPoint;
  npcs?: Record<string, MapPoint>;
  exits?: Record<string, MapPoint>;
  spots?: Record<string, MapPoint>;
}
export interface MapSpotOverridesFile {
  version: 1;
  maps: Record<string, MapSpotEdits>;
}

export const MAP_SPOT_OVERRIDES: MapSpotOverridesFile = raw as MapSpotOverridesFile;

const at = (p: MapPoint): MapPoint => ({ x: p.x, y: p.y });

/** A map with `edits` laid over it (only points that exist on the map move). */
export function applySpotEdits(def: LocationMapDef, edits: MapSpotEdits | undefined): LocationMapDef {
  if (!edits) return def;
  const npcs = edits.npcs ?? {}, exits = edits.exits ?? {}, spots = edits.spots ?? {};
  return {
    ...def,
    ...(edits.spawn ? { spawn: at(edits.spawn) } : {}),
    ...(def.npcSpots ? { npcSpots: Object.fromEntries(Object.entries(def.npcSpots).map(([id, p]) => [id, npcs[id] ? at(npcs[id]) : p])) } : {}),
    ...(def.exits ? { exits: def.exits.map((e) => exits[e.to] ? { ...e, ...at(exits[e.to]) } : e) } : {}),
    ...(def.spots ? { spots: def.spots.map((s, i) => spots[i] ? { ...s, ...at(spots[i]) } : s) } : {}),
  };
}
