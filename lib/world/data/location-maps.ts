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
import { assignSlotsByBearing } from "../compass";
import { placeActivitiesAt } from "./activities";
import { capitalAt } from "./composed/city_capital";

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
    npcSpots: {
      home_player_housekeeper_liu: { x: 60, y: 31 }, // under the laundry line
      home_player_gatekeeper_zhou: { x: 57, y: 66 }, // inside the fence, beside the gate
      home_player_neighbor_niu: { x: 82, y: 55 },    // on the hedge road to the neighbour's
    },
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

  // Built from isometric assets (lib/world/data/composed/city_capital.ts):
  // spots are grid points (u, v) turned into percentages by capitalAt.
  city_capital: {
    image: "composed:city_capital",
    spawn: capitalAt(50, 57.5), // on the street just inside the main gate
    npcSpots: {
      city_capital_magistrate_wu: capitalAt(15.5, 24.2),     // before the yamen
      city_capital_clerk_qing: capitalAt(19.6, 24.3),        // between the yamen and the school
      city_capital_physician_lin: capitalAt(12.5, 32.3),     // west edge of the market
      city_capital_merchant_wang: capitalAt(23, 32.2),       // among the market stalls
      spy_capital_feng: capitalAt(17.8, 32),                 // at the bun stall
      evil_capital_blackmarket_zhou: capitalAt(59.6, 46),    // in the lane by the east wall
      merchant_wang: capitalAt(31, 45.6),                    // before the general store
    },
    exits: [
      { to: "home_player", ...capitalAt(50, 59.6), icon: "🏠" },    // inside the main gate (SW wall)
      { to: "village_qigu", ...capitalAt(10, 5.4), icon: "🌾" },    // the north-west gate of the NE wall, to the fields
      { to: "palace_royal", ...capitalAt(34, 5.4), icon: "🏯" },    // the middle NE gate, to the palace walk
      { to: "sect_songshan", ...capitalAt(5.4, 28), icon: "⛰" },    // the NW gate on Songshan lane
      { to: "city_changan", ...capitalAt(5.4, 48), icon: "🚶" },    // the NW gate on the south street
      { to: "city_yangzhou", ...capitalAt(24, 59), icon: "⛵" },    // the canal landing
      { to: "sect_jinyiwei", ...capitalAt(50, 5.4), icon: "🎽" },   // the eastern NE gate, to the guard post
      { to: "inn_yuelai", ...capitalAt(59.6, 16), icon: "🏮" },     // the SE gate on the north street
    ],
    spots: [
      { kind: "shop", ...capitalAt(24, 35.5), icon: "🏪", label: "ตลาดนครหลวง" },
      { kind: "sectHall", ...capitalAt(22.5, 24.2), icon: "🏯", label: "สำนักยุทธิ์" },
      { kind: "rest", ...capitalAt(38.5, 46.4), icon: "🍵", label: "โรงเตี๊ยม" },
      { kind: "rumor", ...capitalAt(39.5, 33.6), icon: "🍶", label: "ฟังข่าวลือ" },
      { kind: "artisan", artisanId: "artisan_city_capital_forge", ...capitalAt(37.5, 53.8), icon: "🔨", label: "ตีเหล็ก" },
      { kind: "artisan", artisanId: "artisan_city_capital_alchemy", ...capitalAt(41.5, 53.8), icon: "⚗️", label: "ปรุงยา" },
      { kind: "artisan", artisanId: "artisan_city_capital_tailoring", ...capitalAt(45.7, 53), icon: "🧵", label: "ตัดเย็บ" },
      { kind: "artisan", artisanId: "artisan_city_capital_chef", ...capitalAt(44, 46.3), icon: "🍜", label: "ครัว" },
      { kind: "artisan", artisanId: "artisan_city_capital_jewelry", ...capitalAt(17.5, 53.6), icon: "💍", label: "อัญมณี" },
      { kind: "artisan", artisanId: "artisan_city_capital_accessory", ...capitalAt(13.5, 53.6), icon: "🧿", label: "เครื่องราง" },
      { kind: "resource", resourceId: "mine_iron", ...capitalAt(56.6, 53.6), icon: "⛏", label: "ขุดแร่" },
      { kind: "resource", resourceId: "wood_soft", ...capitalAt(8.4, 12.5), icon: "🪓", label: "ตัดไม้" },
      { kind: "resource", resourceId: "chess_basic", ...capitalAt(44.2, 35.8), icon: "♟", label: "เล่นหมากรุก" },
      { kind: "resource", resourceId: "beg_street", ...capitalAt(30, 16), icon: "🥣", label: "ขอเงินคนผ่านไปมา" },
      { kind: "resource", resourceId: "beg_market", ...capitalAt(27, 32.3), icon: "🥣", label: "ขอเงินในตลาด" },
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

const compassed = new Map<string, LocationMapDef>();

/**
 * A hand map keeps its painted gate positions, but each destination takes
 * the gate that best matches its compass bearing on the world map (its icon
 * goes with it), like the auto maps.
 */
function withCompassExits(id: string, def: LocationMapDef): LocationMapDef {
  const exits = def.exits ?? [];
  if (exits.length < 2) return def;
  const slotOf = assignSlotsByBearing(id, exits.map((e) => e.to), exits);
  return { ...def, exits: exits.map((e, i) => ({ ...exits[slotOf[i]], to: e.to, icon: e.icon })) };
}

export function getLocationMap(id: string): LocationMapDef | undefined {
  // Hand-authored entries win; every other painted location falls back
  // to the convention-based auto builder (see auto-maps.ts, which
  // imports only types from this module — no runtime cycle).
  const hand = LOCATION_MAPS[id];
  if (!hand) return buildAutoMap(id);
  let def = compassed.get(id);
  if (!def) {
    def = withCompassExits(id, hand);
    // Place activities authored for a hand-painted map must name their spot.
    const extra = placeActivitiesAt(id).filter((a) => a.place?.spot)
      .map((a) => ({ kind: "activity" as const, activityId: a.id, ...a.place!.spot!, icon: a.icon, label: a.label }));
    if (extra.length) def = { ...def, spots: [...(def.spots ?? []), ...extra] };
    compassed.set(id, def);
  }
  return def;
}

/** Where a location's map shows its way out to `to`, if it is on the map. */
export function mapExitTo(id: string, to: string): LocationMapExit | undefined {
  return getLocationMap(id)?.exits?.find((e) => e.to === to);
}
