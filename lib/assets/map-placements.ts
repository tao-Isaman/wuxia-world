/**
 * The game's side of map placements: the objects placed on one location map,
 * resolved against the asset manifest into draw-and-collide geometry.
 *
 * public/assets/placements.json is fetched once (cached); the manifest only
 * when the map being opened has placements. Results are cached per map, so
 * reopening a map is synchronous (`peekMapPlacements`). A map without
 * placements costs nothing after the first fetch.
 */
import { indexAssets, loadAssetManifest, loadPlacements, placementsFor } from "./catalog";
import { placementsGeometry, type PlacementGeometry } from "./placement-geometry";
import type { AssetEntry, PlacementsFile } from "./types";
import { enginePreviewActive, enginePreviewPlacements } from "@/lib/engine/goto";

/** A placements file that cannot load in this long counts as empty (the map must open). */
const LOAD_TIMEOUT = 8_000;
const NONE: readonly PlacementGeometry[] = Object.freeze([]);

let file: PlacementsFile | null = null;
let filePending: Promise<PlacementsFile> | null = null;
let assets: Map<string, AssetEntry> | null = null;
let assetsPending: Promise<Map<string, AssetEntry>> | null = null;
const byMap = new Map<string, readonly PlacementGeometry[]>();

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), LOAD_TIMEOUT))]);
}

function placementsFile(): Promise<PlacementsFile> {
  if (file) return Promise.resolve(file);
  filePending ??= (async () => {
    const preview = enginePreviewActive() ? enginePreviewPlacements() : null;
    file = preview ?? await withTimeout(loadPlacements(), { version: 1, maps: {} });
    return file;
  })();
  return filePending;
}

function assetIndex(): Promise<Map<string, AssetEntry>> {
  if (assets) return Promise.resolve(assets);
  assetsPending ??= withTimeout(loadAssetManifest(), { version: 1 as const, generatedAt: "", assets: [] })
    .then((manifest) => (assets = indexAssets(manifest.assets)));
  return assetsPending;
}

/** The map's placements if already known (synchronous), else undefined. */
export function peekMapPlacements(locationId: string): readonly PlacementGeometry[] | undefined {
  const cached = byMap.get(locationId);
  if (cached) return cached;
  if (file && !placementsFor(file, locationId).length) return NONE;
  return undefined;
}

/** The map's placements, resolved (cached). Placements naming an unknown asset are skipped. */
export async function loadMapPlacements(locationId: string): Promise<readonly PlacementGeometry[]> {
  const known = peekMapPlacements(locationId);
  if (known) return known;
  const list = placementsFor(await placementsFile(), locationId);
  if (!list.length) return NONE;
  const index = await assetIndex();
  const geometry = placementsGeometry(list, index);
  if (geometry.length < list.length) {
    console.warn(`[world] ${list.length - geometry.length} placement(s) on ${locationId} name an unknown asset; skipped`);
  }
  byMap.set(locationId, geometry);
  return geometry;
}

/** Forget everything (tests). */
export function resetMapPlacements(): void {
  file = null; filePending = null; assets = null; assetsPending = null; byMap.clear();
}
