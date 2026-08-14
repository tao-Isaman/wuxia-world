// ─── AI-painted location maps ─────────────────────────────────────────
//
// Per-location painted map definitions for the click-to-move map view.
// A location with an entry here renders <LocationMap> — a camera
// viewport over a zoomed painting where NPCs, exits, and service spots
// (shop / artisans / rest / rumor / resources) are clickable objects.
// Entries NOT placed on the map fall back to the classic button cards,
// so partial authoring is safe. Locations without an entry keep the
// classic card UI untouched.
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

// Service / activity objects standing on the map. Clicking one walks the
// player there, then opens the matching popup / action — the same flows
// as the classic cards, just spatial.
export type MapSpot =
  | ({ kind: "shop"; icon?: string; label?: string } & MapPoint)
  | ({ kind: "sectHall"; icon?: string; label?: string } & MapPoint)
  | ({ kind: "artisan"; artisanId: string; icon?: string; label?: string } & MapPoint)
  | ({ kind: "rest"; icon?: string; label?: string } & MapPoint)
  | ({ kind: "rumor"; icon?: string; label?: string } & MapPoint)
  | ({ kind: "resource"; resourceId: string; icon?: string; label?: string } & MapPoint);

export interface LocationMapDef {
  /** public-relative path of the painted map (3:2 landscape) */
  image: string;
  /** camera zoom — world width as a multiple of the viewport width.
   *  1 = whole map visible (no camera); ~2-2.5 = "part of vision". */
  zoom?: number;
  /** where the player token stands when entering the location */
  spawn: MapPoint;
  /** npcId (scene NpcRef id or registry NpcDef id) → marker position */
  npcSpots?: Record<string, MapPoint>;
  exits?: LocationMapExit[];
  spots?: MapSpot[];
}

export const LOCATION_MAPS: Record<string, LocationMapDef> = {
  home_player: {
    image: "/maps/home_player.png",
    zoom: 2,
    spawn: { x: 42, y: 50 }, // courtyard, between house steps and the well
    exits: [
      // main gate + dirt path running off the bottom edge → the capital
      { to: "city_capital", x: 54, y: 86, icon: "🚶" },
      // hedge-lined alley on the right edge → Hong's house
      { to: "home_hong", x: 87, y: 46, icon: "🌿" },
    ],
    spots: [
      // sleep in your own bed — roadside-tier rest via the rest popup
      { kind: "rest", x: 30, y: 38, icon: "🛏", label: "นอนพัก" },
    ],
  },

  city_capital: {
    image: "/maps/city_capital.png",
    zoom: 2.4,
    spawn: { x: 47, y: 78 }, // just inside the main south gate
    npcSpots: {
      city_capital_magistrate_wu: { x: 56, y: 27 }, // steps of the north compound
      city_capital_physician_lin: { x: 33, y: 60 }, // in front of the apothecary
      city_capital_merchant_wang: { x: 42, y: 44 }, // among the market stalls
      spy_capital_feng: { x: 62, y: 57 },           // noodle stand by the kitchen row
      evil_capital_blackmarket_zhou: { x: 90, y: 33 }, // shadowy corner near the east gate
    },
    exits: [
      { to: "home_player", x: 47, y: 88, icon: "🏠" },   // main south gate
      { to: "village_qigu", x: 30, y: 7, icon: "🌾" },    // north fields
      { to: "palace_royal", x: 64, y: 6, icon: "🏯" },    // palace walkway, north
      { to: "sect_songshan", x: 9, y: 10, icon: "⛰" },   // mountain trail, north-west
      { to: "city_changan", x: 3, y: 32, icon: "🚶" },    // royal highway, west
      { to: "city_yangzhou", x: 4, y: 62, icon: "⛵" },   // grand canal, south-west
      { to: "sect_jinyiwei", x: 92, y: 19, icon: "🎽" },  // guard alley, east gate
      { to: "inn_yuelai", x: 95, y: 55, icon: "🏮" },     // old alley, east
    ],
    spots: [
      { kind: "shop", x: 20, y: 44, icon: "🏪", label: "ตลาดนครหลวง" },
      { kind: "sectHall", x: 50, y: 24, icon: "🏯", label: "สำนักยุทธิ์" },
      { kind: "rest", x: 76, y: 46, icon: "🍵", label: "โรงเตี๊ยม" },
      { kind: "rumor", x: 81, y: 52, icon: "🍶", label: "ฟังข่าวลือ" },
      { kind: "artisan", artisanId: "artisan_city_capital_forge", x: 17, y: 72, icon: "🔨", label: "ตีเหล็ก" },
      { kind: "artisan", artisanId: "artisan_city_capital_alchemy", x: 30, y: 72, icon: "⚗️", label: "ปรุงยา" },
      { kind: "artisan", artisanId: "artisan_city_capital_tailoring", x: 43, y: 72, icon: "🧵", label: "ตัดเย็บ" },
      { kind: "artisan", artisanId: "artisan_city_capital_chef", x: 56, y: 72, icon: "🍜", label: "ครัว" },
      { kind: "artisan", artisanId: "artisan_city_capital_jewelry", x: 69, y: 72, icon: "💍", label: "อัญมณี" },
      { kind: "artisan", artisanId: "artisan_city_capital_accessory", x: 81, y: 72, icon: "🧿", label: "เครื่องราง" },
    ],
  },
};

export function getLocationMap(id: string): LocationMapDef | undefined {
  return LOCATION_MAPS[id];
}
