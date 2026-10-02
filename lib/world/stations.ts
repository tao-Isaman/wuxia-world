// Horse stations (สถานีพักม้า): fast travel between the cities, the villages
// and the grounds of the 15 joinable sects. From a station the hero rides to
// any other station place they have visited before, paying gold and spending
// time by the world-map distance (faster than walking, no encounters).

import { WORLD_COORDS } from "./data/world-coords";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { getScene } from "./data/scenes";
import type { WorldStateData } from "./types";

export const STATION_FARE = {
  /** Gold: base + per world-map unit. */
  baseGold: 20,
  goldPerUnit: 0.2,
  /** Time in ชั่วยาม (12 a day): per world-map unit, at least 1. */
  hoursPerUnit: 1 / 120,
} as const;

const SECT_GROUNDS = new Set(Object.values(SECT_MEMBERSHIPS).map((m) => m.hallLocationId));

/** Whether a place has a horse station: a city, a village or a big sect's grounds. */
export function hasStation(locationId: string | null | undefined): boolean {
  if (!locationId || !WORLD_COORDS[locationId]) return false;
  if (getScene(locationId)?.kind !== "location") return false;
  return /^(city|village)_/.test(locationId) || SECT_GROUNDS.has(locationId);
}

/** Every place with a station. */
export function stationIds(): string[] {
  return Object.keys(WORLD_COORDS).filter(hasStation);
}

/** World-map distance between two places (0 if either is unplaced). */
export function worldDistance(from: string, to: string): number {
  const a = WORLD_COORDS[from], b = WORLD_COORDS[to];
  return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
}

export interface StationTrip { to: string; distance: number; gold: number; hours: number }

/** The fare for a ride from one station to another. */
export function stationFare(from: string, to: string): StationTrip {
  const distance = worldDistance(from, to);
  return {
    to,
    distance,
    gold: Math.round(STATION_FARE.baseGold + distance * STATION_FARE.goldPerUnit),
    hours: Math.max(1, Math.round(distance * STATION_FARE.hoursPerUnit)),
  };
}

/** Rides offered at `from`: every other visited station place, nearest first. Empty without a station here. */
export function stationTrips(state: Pick<WorldStateData, "visitedLocationIds">, from: string): StationTrip[] {
  if (!hasStation(from)) return [];
  const visited = new Set(state.visitedLocationIds ?? []);
  return stationIds()
    .filter((id) => id !== from && visited.has(id))
    .map((id) => stationFare(from, id))
    .sort((a, b) => a.distance - b.distance);
}
