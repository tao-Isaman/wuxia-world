// ─── Auto-generated location maps ─────────────────────────────────────
//
// Programmatic LocationMapDef builder for the world-wide map rollout.
// Every mapped location's painting is generated from a per-category
// layout convention (see scripts in the session scratchpad), and this
// module rebuilds marker positions from the SAME conventions at
// runtime — the prompt generator and this builder must stay in
// lockstep: exits go to EXIT_SLOTS in route order (sorted by
// destination id), services go to fixed zones, NPCs fill NPC_SLOTS in
// registry order. Markers therefore land in the right *area* of the
// painting; hand-tune a location by adding a full entry to
// LOCATION_MAPS in location-maps.ts (hand entries always win).

import type { LocationMapDef, LocationMapExit, MapPoint, MapSpot } from "./location-maps";
import { SCENES_BY_ID } from "./scenes";
import { getShopAt } from "./shops";
import { getSectHallAt } from "./sect-halls";
import { getArtisansAt } from "./artisans";
import { getNpcsAtLocation } from "./npcs";
import { RESOURCES_BY_ID } from "./resources";
import { LIFE_SKILL_ICON } from "./life-skills";
import { canPracticeAt } from "../location-categories";

// Edge slots for exits, in assignment order. The prompt generator
// describes "a path leaving at the <label> edge" for each used slot.
export const EXIT_SLOTS: readonly (MapPoint & { edge: string })[] = [
  { x: 50, y: 92, edge: "bottom" },
  { x: 50, y: 7, edge: "top" },
  { x: 5, y: 52, edge: "left" },
  { x: 95, y: 52, edge: "right" },
  { x: 13, y: 88, edge: "bottom-left" },
  { x: 87, y: 88, edge: "bottom-right" },
  { x: 11, y: 9, edge: "top-left" },
  { x: 89, y: 9, edge: "top-right" },
];

// NPC marker slots — a loose scatter around the central area.
export const NPC_SLOTS: readonly MapPoint[] = [
  { x: 37, y: 54 },
  { x: 58, y: 49 },
  { x: 46, y: 64 },
  { x: 65, y: 60 },
  { x: 31, y: 41 },
  { x: 71, y: 47 },
  { x: 41, y: 34 },
  { x: 60, y: 35 },
  { x: 26, y: 60 },
  { x: 52, y: 30 },
];

// Service zones (match the layout language in the prompts).
export const ZONES = {
  spawn: { x: 50, y: 60 },
  shop: { x: 30, y: 44 },       // market / store building on the west side
  sectHall: { x: 62, y: 27 },   // main hall to the north-east
  rest: { x: 73, y: 42 },       // inn / tea house on the east side
  rumor: { x: 78, y: 51 },      // benches by the inn
  practice: { x: 22, y: 30 },   // quiet training ground north-west
  artisanRowY: 70,              // workshop row across the south
  artisanRowX0: 24,
  artisanRowStep: 11,
  resources: [                  // nature corners, assigned in order
    { x: 12, y: 78 },
    { x: 88, y: 74 },
    { x: 14, y: 16 },
    { x: 86, y: 18 },
  ],
} as const;

// Destination id of a generated route scene (route_<src>__to__<dst>).
export function routeDest(sceneId: string, routeSceneId: string): string | null {
  const prefix = `route_${sceneId}__to__`;
  return routeSceneId.startsWith(prefix)
    ? routeSceneId.slice(prefix.length)
    : null;
}

// Locations that received a generated painting. Kept as an explicit
// list (emitted by the generation batch) so a failed/missing image can
// never produce a map view with a broken background.
import { AUTO_MAP_IDS } from "./auto-map-ids";

const cache = new Map<string, LocationMapDef | null>();

export function buildAutoMap(id: string): LocationMapDef | undefined {
  if (cache.has(id)) return cache.get(id) ?? undefined;
  const def = build(id);
  cache.set(id, def ?? null);
  return def;
}

function build(id: string): LocationMapDef | undefined {
  if (!AUTO_MAP_IDS.has(id)) return undefined;
  const scene = SCENES_BY_ID.get(id);
  if (!scene || scene.kind !== "location") return undefined;

  // Exits: routes sorted by destination id → EXIT_SLOTS in order.
  const dests = scene.routes
    .map((r) => routeDest(id, r.routeSceneId))
    .filter((d): d is string => !!d)
    .sort();
  const exits: LocationMapExit[] = dests
    .slice(0, EXIT_SLOTS.length)
    .map((to, i) => ({ to, x: EXIT_SLOTS[i].x, y: EXIT_SLOTS[i].y }));

  // NPCs: registry NPCs at this location + scene NPCs, sorted by id.
  const npcIds = [
    ...getNpcsAtLocation(id).map((n) => n.id),
    ...scene.npcs.map((n) => n.id),
  ].sort();
  const npcSpots: Record<string, MapPoint> = {};
  npcIds.slice(0, NPC_SLOTS.length).forEach((nid, i) => {
    npcSpots[nid] = NPC_SLOTS[i];
  });

  const spots: MapSpot[] = [];
  if (getShopAt(id)) {
    spots.push({ kind: "shop", ...ZONES.shop, icon: "🏪", label: "ตลาด" });
  }
  if (getSectHallAt(id)) {
    spots.push({ kind: "sectHall", ...ZONES.sectHall, icon: "🏯", label: "สำนัก" });
  }
  const artisans = [...getArtisansAt(id)].sort((a, b) =>
    a.profession.localeCompare(b.profession),
  );
  artisans.forEach((a, i) => {
    spots.push({
      kind: "artisan",
      artisanId: a.id,
      x: ZONES.artisanRowX0 + i * ZONES.artisanRowStep,
      y: ZONES.artisanRowY,
      icon: LIFE_SKILL_ICON[a.profession],
    });
  });
  if (id.startsWith("inn_") || id.startsWith("city_")) {
    spots.push({ kind: "rest", ...ZONES.rest, icon: "🍵", label: "โรงเตี๊ยม" });
    spots.push({ kind: "rumor", ...ZONES.rumor, icon: "🍶", label: "ฟังข่าวลือ" });
  } else if (id.startsWith("temple_") || id.startsWith("palace_")) {
    spots.push({ kind: "rest", ...ZONES.rest, icon: "🏛", label: "พักที่วัด" });
  }
  if (canPracticeAt(scene)) {
    spots.push({ kind: "practice", ...ZONES.practice, icon: "🧘", label: "ฝึกฝน" });
  }
  const resources = [...(scene.resources ?? [])].sort((a, b) =>
    a.resourceId.localeCompare(b.resourceId),
  );
  resources.slice(0, ZONES.resources.length).forEach((node, i) => {
    const res = RESOURCES_BY_ID.get(node.resourceId);
    if (!res) return;
    spots.push({
      kind: "resource",
      resourceId: node.resourceId,
      ...ZONES.resources[i],
      icon: LIFE_SKILL_ICON[res.skill],
      label: res.name,
    });
  });

  return {
    image: `/maps/${id}.webp`,
    zoom: 2.3,
    spawn: ZONES.spawn,
    npcSpots,
    exits,
    spots,
  };
}
