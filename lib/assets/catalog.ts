/**
 * Reading the asset library (lib/assets/manifest.json): lookups and queries
 * shared by the game runtime and the engine. Pure; see lib/assets/types.ts.
 */
import manifestJson from "./manifest.json";
import type { AssetCategory, AssetEntry, AssetManifest, AssetRegion } from "./types";

export const ASSET_MANIFEST = manifestJson as AssetManifest;
const BY_ID = new Map(ASSET_MANIFEST.assets.map((asset) => [asset.id, asset]));

/** An asset by id (any status), or undefined. */
export function getAsset(id: string): AssetEntry | undefined { return BY_ID.get(id); }

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
export function queryAssets(query: AssetQuery = {}, assets: readonly AssetEntry[] = ASSET_MANIFEST.assets): AssetEntry[] {
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

/** Counts per category (approved only unless `all`). */
export function assetCounts(all = false): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const asset of ASSET_MANIFEST.assets) if (all || asset.status === "approved") counts[asset.category] = (counts[asset.category] ?? 0) + 1;
  return counts;
}
