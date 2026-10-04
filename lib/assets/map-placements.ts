/**
 * The game's side of map placements: the objects placed on one location map,
 * resolved against the asset manifest into draw-and-collide geometry.
 *
 * public/assets/placements.json is fetched once (cached); the manifest only
 * when the map being opened has placements. Results are cached per map, so
 * reopening a map is synchronous (`peekMapPlacements`). A map without
 * placements costs nothing after the first fetch.
 */
import { groundFor, indexAssets, loadAssetManifest, loadPlacements, placementsFor } from "./catalog";
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

/** A map's replaced ground, resolved: the tile image and the map units it covers. */
export interface ResolvedGround { tile: string; image: string; size: number }
const groundByMap = new Map<string, ResolvedGround | null>();

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
  if (file && !placementsFor(file, locationId).length && !groundFor(file, locationId)) return NONE;
  return undefined;
}
/** The map's replaced ground once its placements are known (null: it keeps its painting). */
export function peekMapGround(locationId: string): ResolvedGround | null {
  return groundByMap.get(locationId) ?? null;
}

/** The map's placements, resolved (cached). Placements naming an unknown asset are skipped. */
export async function loadMapPlacements(locationId: string): Promise<readonly PlacementGeometry[]> {
  const known = peekMapPlacements(locationId);
  if (known) return known;
  const loaded = await placementsFile();
  const list = placementsFor(loaded, locationId);
  const ground = groundFor(loaded, locationId);
  if (!list.length && !ground) return NONE;
  const index = await assetIndex();
  const tile = ground ? index.get(ground.tile) : undefined;
  if (ground && !tile) console.warn(`[world] ${locationId}: ground tile ${ground.tile} is not in the manifest; keeping the painting`);
  groundByMap.set(locationId, tile ? { tile: tile.id, image: tile.image, size: tile.mapWidth } : null);
  const geometry = placementsGeometry(list, index);
  if (geometry.length < list.length) {
    console.warn(`[world] ${list.length - geometry.length} placement(s) on ${locationId} name an unknown asset; skipped`);
  }
  byMap.set(locationId, geometry);
  return geometry;
}

/** Forget everything (tests). */
export function resetMapPlacements(): void {
  file = null; filePending = null; assets = null; assetsPending = null; byMap.clear(); groundByMap.clear();
}
