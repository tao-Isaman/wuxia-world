// ─── AI-painted location maps ─────────────────────────────────────────
//
// Per-location painted map definitions for the click-to-move map view.
// A location with an entry here renders <LocationMap> instead of the
// ผู้คน / เส้นทาง button cards (entries NOT placed on the map fall back
// to the cards, so partial authoring is safe). Locations without an
// entry keep the classic card UI untouched.
//
// Coordinates are percentages of the map image (x: 0..100 left→right,
// y: 0..100 top→bottom) so markers stay glued to the painting at any
// render width.

export interface MapPoint {
  x: number;
  y: number;
}

export interface LocationMapExit extends MapPoint {
  /** Destination location id — binds to the generated route scene
   *  `route_<locationId>__to__<to>` (see world-map.ts routeId). */
  to: string;
  /** Marker emoji, default 🚶 */
  icon?: string;
}

export interface LocationMapDef {
  /** public-relative path of the painted map (3:2 landscape) */
  image: string;
  /** where the player token stands when entering the location */
  spawn: MapPoint;
  /** npcId (scene NpcRef id or registry NpcDef id) → marker position */
  npcSpots?: Record<string, MapPoint>;
  exits?: LocationMapExit[];
}

export const LOCATION_MAPS: Record<string, LocationMapDef> = {
  home_player: {
    image: "/maps/home_player.png",
    spawn: { x: 42, y: 50 }, // courtyard, between house steps and the well
    exits: [
      // main gate + dirt path running off the bottom edge → the capital
      { to: "city_capital", x: 54, y: 86, icon: "🚶" },
      // hedge-lined alley on the right edge → Hong's house
      { to: "home_hong", x: 87, y: 46, icon: "🌿" },
    ],
  },
};

export function getLocationMap(id: string): LocationMapDef | undefined {
  return LOCATION_MAPS[id];
}
