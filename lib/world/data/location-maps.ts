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

import { buildAutoMap } from "./auto-maps";

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
  | ({ kind: "practice"; icon?: string; label?: string } & MapPoint)
  | ({ kind: "resource"; resourceId: string; icon?: string; label?: string } & MapPoint)
  | ({ kind: "activity"; activityId: string; icon?: string; label?: string } & MapPoint);

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
    zoom: 2.2,
    spawn: { x: 46, y: 48 }, // courtyard, between the porch steps and the well
    exits: [
      // main gate + dirt path running off the bottom edge → the capital
      { to: "city_capital", x: 47, y: 87, icon: "🚶" },
      // hedge-lined road climbing the right edge → Hong's house
      { to: "home_hong", x: 85, y: 36, icon: "🌿" },
    ],
    spots: [
      // sleep on your own porch — roadside-tier rest via the rest popup
      { kind: "rest", x: 37, y: 37, icon: "🛏", label: "นอนพัก" },
      // hunt in the pine woods past the bottom-left fence
      { kind: "resource", resourceId: "hunt_forest", x: 10, y: 86, icon: "🏹", label: "ล่าสัตว์" },
    ],
  },

  city_capital: {
    image: "/maps/city_capital.png",
    zoom: 2.6,
    spawn: { x: 50, y: 78 }, // just inside the main south gate
    npcSpots: {
      city_capital_magistrate_wu: { x: 49, y: 35 }, // paved courtyard below the north gate
      city_capital_clerk_qing: { x: 41, y: 31 }, // government frontage above the left market awning; lateral approach stays clear of Wu
      city_capital_physician_lin: { x: 35, y: 58 }, // in front of the apothecary
      city_capital_merchant_wang: { x: 58, y: 44 }, // among the market stalls
      spy_capital_feng: { x: 62, y: 58 },           // noodle stand by the kitchen row
      evil_capital_blackmarket_zhou: { x: 90, y: 47 }, // shadowy corner below the east gate
      merchant_wang: { x: 27, y: 42 },              // เถ้าแก่หวาง, by the general store
    },
    exits: [
      { to: "home_player", x: 50, y: 88, icon: "🏠" },   // main south gate
      { to: "village_qigu", x: 28, y: 6, icon: "🌾" },    // north fields
      { to: "palace_royal", x: 78, y: 5, icon: "🏯" },    // palace walkway, north-east
      { to: "sect_songshan", x: 8, y: 8, icon: "⛰" },    // mountain trail, north-west
      { to: "city_changan", x: 4, y: 40, icon: "🚶" },    // royal highway, west
      { to: "city_yangzhou", x: 10, y: 88, icon: "⛵" },  // grand canal, south-west
      { to: "sect_jinyiwei", x: 93, y: 28, icon: "🎽" },  // guard gate, east
      { to: "inn_yuelai", x: 95, y: 62, icon: "🏮" },     // old alley, east
    ],
    spots: [
      { kind: "shop", x: 25, y: 38, icon: "🏪", label: "ตลาดนครหลวง" },
      { kind: "sectHall", x: 52, y: 33, icon: "🏯", label: "สำนักยุทธิ์" }, // courtyard entrance, below the gate roof
      { kind: "rest", x: 78, y: 40, icon: "🍵", label: "โรงเตี๊ยม" },
      { kind: "rumor", x: 72, y: 47, icon: "🍶", label: "ฟังข่าวลือ" },
      { kind: "artisan", artisanId: "artisan_city_capital_forge", x: 21, y: 72, icon: "🔨", label: "ตีเหล็ก" },
      { kind: "artisan", artisanId: "artisan_city_capital_alchemy", x: 35, y: 72, icon: "⚗️", label: "ปรุงยา" },
      { kind: "artisan", artisanId: "artisan_city_capital_tailoring", x: 47, y: 72, icon: "🧵", label: "ตัดเย็บ" },
      { kind: "artisan", artisanId: "artisan_city_capital_chef", x: 60, y: 72, icon: "🍜", label: "ครัว" },
      { kind: "artisan", artisanId: "artisan_city_capital_jewelry", x: 72, y: 72, icon: "💍", label: "อัญมณี" },
      { kind: "artisan", artisanId: "artisan_city_capital_accessory", x: 83, y: 72, icon: "🧿", label: "เครื่องราง" },
      { kind: "resource", resourceId: "mine_iron", x: 93, y: 90, icon: "⛏", label: "ขุดแร่" },
      { kind: "resource", resourceId: "wood_soft", x: 6, y: 55, icon: "🪓", label: "ตัดไม้" },
      // Street life: chess by the tea house, begging along the market street.
      { kind: "resource", resourceId: "chess_basic", x: 85, y: 52, icon: "♟", label: "เล่นหมากรุก" },
      { kind: "resource", resourceId: "beg_street", x: 45, y: 50, icon: "🥣", label: "ขอเงินคนผ่านไปมา" },
      { kind: "resource", resourceId: "beg_market", x: 31, y: 50, icon: "🥣", label: "ขอเงินในตลาด" },
    ],
  },
};

// The prison courtyard (painted by scripts/build-jail-map.ts). No exits:
// the only ways out are the gate once the sentence is served, a bribe, or
// the cracked east wall.
LOCATION_MAPS.jail = {
  image: "/maps/jail.png",
  zoom: 2.4,
  spawn: { x: 50, y: 62 },
  npcSpots: {
    jail_elder_prisoner: { x: 36, y: 42 },
    jail_guard_zhang: { x: 66, y: 72 },
  },
  exits: [],
  spots: [
    { kind: "rest", x: 22, y: 45, icon: "🛏", label: "นอนบนฟาง" },
    { kind: "activity", activityId: "jail_labor", x: 22, y: 66, icon: "🪨" },
    { kind: "activity", activityId: "jail_dice", x: 79, y: 74, icon: "🎲" },
    { kind: "activity", activityId: "jail_meditate", x: 80, y: 42, icon: "🧘" },
    { kind: "activity", activityId: "jail_escape", x: 90, y: 50, icon: "🧱" },
    { kind: "activity", activityId: "jail_gate", x: 50, y: 88, icon: "🔒" },
  ],
};

export function getLocationMap(id: string): LocationMapDef | undefined {
  // Hand-authored entries win; every other painted location falls back
  // to the convention-based auto builder (see auto-maps.ts, which
  // imports only types from this module — no runtime cycle).
  return LOCATION_MAPS[id] ?? buildAutoMap(id);
}
