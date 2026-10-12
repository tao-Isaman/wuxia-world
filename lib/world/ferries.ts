// Ferries (เรือข้ามฟาก): nobody walks to the islands. A boatman (ลุงจาง
// คนแจวเรือ) waits at the mainland ports and on every island; the hero pays him
// by the world-map distance and arrives at once, like a horse station ride
// (stations.ts). The sea lanes in location-routes.ts (`sea: true`) only lay the
// islands out on the world map and draw the boat lanes on it.

import { WORLD_COORDS } from "./data/world-coords";
import { getScene } from "./data/scenes";

/** The boatman, drawn as a person on every pier's map (not a registry NPC: he can't be fought, robbed or killed). */
export const FERRYMAN = { id: "ferry_boatman", name: "ลุงจาง คนแจวเรือ", markerId: "npc-ferry_boatman" } as const;

/** Mainland harbours with a boat out to sea. */
export const FERRY_PORTS = ["city_suzhou", "city_yangzhou"] as const;

export const FERRY_FARE = {
  /** Gold: base + per world-map unit (a boat costs more than a horse). */
  baseGold: 40,
  goldPerUnit: 0.5,
} as const;

const isIsland = (id: string) => id.startsWith("isle_");

/** Every place a boat calls at: the ports and the islands. */
export function ferryStops(): string[] {
  return [...FERRY_PORTS, ...Object.keys(WORLD_COORDS).filter(isIsland)]
    .filter((id) => getScene(id)?.kind === "location" && WORLD_COORDS[id]);
}

/** Whether the boatman waits here. */
export function hasFerry(locationId: string | null | undefined): boolean {
  return !!locationId && ferryStops().includes(locationId);
}

export interface FerryTrip { to: string; distance: number; gold: number }

export function ferryFare(from: string, to: string): FerryTrip {
  const a = WORLD_COORDS[from], b = WORLD_COORDS[to];
  const distance = a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  return { to, distance, gold: Math.round(FERRY_FARE.baseGold + distance * FERRY_FARE.goldPerUnit) };
}

/** Where the boat sails from here: every other stop, nearest first (empty without a boatman). */
export function ferryTrips(from: string): FerryTrip[] {
  if (!hasFerry(from)) return [];
  return ferryStops().filter((id) => id !== from).map((id) => ferryFare(from, id)).sort((a, b) => a.distance - b.distance);
}

/** Whether two places are one boat ride apart. */
export function isFerryHop(from: string, to: string): boolean {
  return from !== to && hasFerry(from) && hasFerry(to);
}
