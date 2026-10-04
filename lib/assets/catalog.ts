/**
 * Reading the asset library and the map placements. Both live under
 * public/assets/ and are fetched once on demand (the game only when a map has
 * placements, the engine on open); the query helpers are pure. See
 * lib/assets/types.ts.
 */
import type { AssetCategory, AssetEntry, AssetManifest, AssetRegion, MapGround, Placement, PlacementsFile } from "./types";

export const ASSET_MANIFEST_URL = "/assets/manifest.json";
export const PLACEMENTS_URL = "/assets/placements.json";

let manifest: Promise<AssetManifest> | null = null;
let placements: Promise<PlacementsFile> | null = null;

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    return response.ok ? await response.json() as T : fallback;
  } catch {
    return fallback;
  }
}

/** The asset manifest (cached; an empty one when it cannot load). */
export function loadAssetManifest(): Promise<AssetManifest> {
  manifest ??= fetchJson<AssetManifest>(ASSET_MANIFEST_URL, { version: 1, generatedAt: "", assets: [] });
  return manifest;
}
/** Every map's placements (cached; empty when it cannot load). */
export function loadPlacements(): Promise<PlacementsFile> {
  placements ??= fetchJson<PlacementsFile>(PLACEMENTS_URL, { version: 1, maps: {} });
  return placements;
}
/** Forget the cached files (the engine after it saves). */
export function reloadAssetData(): void { manifest = null; placements = null; }

export function placementsFor(file: PlacementsFile, locationId: string): Placement[] { return file.maps[locationId] ?? []; }
export function groundFor(file: PlacementsFile, locationId: string): MapGround | undefined { return file.grounds?.[locationId]; }

/**
 * The stand-in "image" of a map whose painting is replaced by a ground: no
 * painted collision or foreground matches it (lib/stage/world-navigation.ts,
 * world-occlusion.ts), so only placed objects block.
 */
export const groundImageKey = (tile: string) => `ground:${tile}`;
/** The image a map is checked and drawn with: its ground's key when it has one, else its painting. */
export function effectiveMapImage(file: PlacementsFile | null | undefined, locationId: string, painting: string): string {
  const ground = file ? groundFor(file, locationId) : undefined;
  return ground ? groundImageKey(ground.tile) : painting;
}

export function indexAssets(assets: readonly AssetEntry[]): Map<string, AssetEntry> { return new Map(assets.map((asset) => [asset.id, asset])); }

export interface AssetQuery {
  category?: AssetCategory;
  subcategory?: string;
  region?: AssetRegion;
  sect?: string;
  /** Matches the Thai name, the id or any tag (case-insensitive substring). */
  text?: string;
  /** Default: approved only. */
  status?: AssetEntry["status"] | "all";
}

/** Assets matching every given filter, in manifest order. */
export function queryAssets(assets: readonly AssetEntry[], query: AssetQuery = {}): AssetEntry[] {
  const text = query.text?.trim().toLowerCase();
  const status = query.status ?? "approved";
  return assets.filter((asset) =>
    (status === "all" || asset.status === status) &&
    (!query.category || asset.category === query.category) &&
    (!query.subcategory || asset.subcategory === query.subcategory) &&
    (!query.region || asset.region === query.region || asset.region === "any") &&
    (!query.sect || asset.sect === query.sect) &&
    (!text || asset.name.toLowerCase().includes(text) || asset.id.includes(text) || asset.tags.some((tag) => tag.toLowerCase().includes(text))));
}

/** Counts per category. */
export function assetCounts(assets: readonly AssetEntry[], status: AssetEntry["status"] | "all" = "approved"): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const asset of assets) if (status === "all" || asset.status === status) counts[asset.category] = (counts[asset.category] ?? 0) + 1;
  return counts;
}
