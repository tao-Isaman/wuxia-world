"use client";
import { useEffect, useState } from "react";
import { loadMapPlacements, peekMapPlacements } from "@/lib/assets/map-placements";
import type { PlacementGeometry } from "@/lib/assets/placement-geometry";

/**
 * The objects placed on a location map (public/assets/placements.json),
 * resolved for drawing; null while they load. Known maps — and every map
 * without placements once the file has loaded — resolve synchronously.
 */
export function useMapPlacements(locationId: string): readonly PlacementGeometry[] | null {
  const [loaded, setLoaded] = useState<{ id: string; list: readonly PlacementGeometry[] } | null>(null);
  const known = peekMapPlacements(locationId);
  useEffect(() => {
    if (peekMapPlacements(locationId)) return;
    let live = true;
    void loadMapPlacements(locationId).then((list) => { if (live) setLoaded({ id: locationId, list }); });
    return () => { live = false; };
  }, [locationId]);
  return known ?? (loaded?.id === locationId ? loaded.list : null);
}
