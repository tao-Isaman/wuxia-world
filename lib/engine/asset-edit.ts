/**
 * The engine's asset library (คลังภาพ), pure part: filtering, paging, edits
 * laid over the manifest, bulk changes and the preview geometry. The React
 * side is components/engine/asset-library.tsx. See docs/engine.md.
 */
import { queryAssets } from "@/lib/assets/catalog";
import type { AssetCategory, AssetEntry, AssetManifest, AssetRegion, AssetStatus, Footprint } from "@/lib/assets/types";

/** The fields the library edits. */
export type AssetEdit = Partial<Pick<AssetEntry,
  "name" | "tags" | "subcategory" | "layer" | "flippable" | "mapWidth" | "mapHeight" | "footprint" | "status">>;
/** Unsaved edits by asset id. */
export type AssetEdits = Record<string, AssetEdit>;

export interface AssetFilter {
  category?: AssetCategory | "";
  subcategory?: string;
  region?: AssetRegion | "";
  sect?: string;
  status?: AssetStatus | "all";
  text?: string;
}

/** Assets matching the library's filters (every status unless one is picked). */
export function filterAssets(assets: readonly AssetEntry[], filter: AssetFilter): AssetEntry[] {
  return queryAssets(assets, {
    category: filter.category || undefined,
    subcategory: filter.subcategory || undefined,
    region: filter.region || undefined,
    sect: filter.sect || undefined,
    status: filter.status ?? "all",
    text: filter.text || undefined,
  });
}

/** Sorted distinct values of a string field (subcategory, sect…), blanks left out. */
export function distinctValues(assets: readonly AssetEntry[], key: "subcategory" | "sect" | "region"): string[] {
  const values = new Set<string>();
  for (const asset of assets) { const value = asset[key]; if (value) values.add(value); }
  return [...values].sort((a, b) => a.localeCompare(b, "th"));
}

export interface Page<T> { items: T[]; page: number; pages: number; total: number }
/** One page of a list (page clamped to range, 0-based). */
export function pageOf<T>(list: readonly T[], page: number, size: number): Page<T> {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const at = Math.min(Math.max(0, Math.floor(page)), pages - 1);
  return { items: list.slice(at * size, at * size + size), page: at, pages, total: list.length };
}

/** An asset with its edit applied. */
export function applyAssetEdit(asset: AssetEntry, edit: AssetEdit | undefined): AssetEntry {
  return edit ? { ...asset, ...edit } : asset;
}

/** Every asset with its edit applied (same order; edits for missing ids ignored). */
export function applyAssetEdits(assets: readonly AssetEntry[], edits: AssetEdits): AssetEntry[] {
  return assets.map((asset) => applyAssetEdit(asset, edits[asset.id]));
}

/** The manifest to save: edits applied, a fresh `generatedAt`. */
export function editedManifest(manifest: AssetManifest, edits: AssetEdits, now = new Date()): AssetManifest {
  return { ...manifest, generatedAt: now.toISOString(), assets: applyAssetEdits(manifest.assets, edits) };
}

function same(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }

/**
 * Merge a change into the edits for one asset, dropping fields that are back
 * to the original value (and the asset entry when nothing is left).
 */
export function mergeAssetEdit(edits: AssetEdits, original: AssetEntry, change: AssetEdit): AssetEdits {
  const merged: AssetEdit = { ...edits[original.id], ...change };
  for (const key of Object.keys(merged) as (keyof AssetEdit)[]) if (same(merged[key], original[key])) delete merged[key];
  const next = { ...edits };
  if (Object.keys(merged).length) next[original.id] = merged; else delete next[original.id];
  return next;
}

/** Drop edits whose asset is gone or whose fields all match the manifest again. */
export function pruneAssetEdits(edits: AssetEdits, assets: readonly AssetEntry[]): AssetEdits {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  let next: AssetEdits = {};
  for (const [id, edit] of Object.entries(edits)) {
    const original = byId.get(id);
    if (original) next = mergeAssetEdit(next, original, edit);
  }
  return next;
}

export type BulkChange = { status: AssetStatus } | { addTags: string[] } | { removeTags: string[] };

/** Apply one bulk change to the selected assets. */
export function bulkEdit(edits: AssetEdits, assets: readonly AssetEntry[], ids: Iterable<string>, change: BulkChange): AssetEdits {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  let next = edits;
  for (const id of ids) {
    const original = byId.get(id);
    if (!original) continue;
    const current = applyAssetEdit(original, next[id]);
    if ("status" in change) next = mergeAssetEdit(next, original, { status: change.status });
    else if ("addTags" in change) next = mergeAssetEdit(next, original, { tags: [...new Set([...current.tags, ...change.addTags])] });
    else next = mergeAssetEdit(next, original, { tags: current.tags.filter((tag) => !change.removeTags.includes(tag)) });
  }
  return next;
}

/** "a, b ,c" → ["a", "b", "c"] (trimmed, no blanks, no repeats). */
export function parseTags(text: string): string[] {
  return [...new Set(text.split(/[,،\n]/).map((tag) => tag.trim()).filter(Boolean))];
}

/** Image px per map unit, on each axis (the preview's footprint scale). */
export function pxPerUnit(asset: Pick<AssetEntry, "width" | "height" | "mapWidth" | "mapHeight">): { x: number; y: number } {
  return { x: asset.mapWidth > 0 ? asset.width / asset.mapWidth : 1, y: asset.mapHeight > 0 ? asset.height / asset.mapHeight : 1 };
}

/** The footprint as a box in image px (for drawing over the image). */
export function footprintToImage(asset: AssetEntry, footprint: Footprint): Footprint {
  const s = pxPerUnit(asset);
  return { x: asset.anchorX + footprint.x * s.x, y: asset.anchorY + footprint.y * s.y, w: footprint.w * s.x, h: footprint.h * s.y };
}

/** A box in image px back to a footprint in map units (rounded, at least 1 × 1). */
export function footprintFromImage(asset: AssetEntry, box: Footprint): Footprint {
  const s = pxPerUnit(asset);
  return {
    x: Math.round((box.x - asset.anchorX) / s.x),
    y: Math.round((box.y - asset.anchorY) / s.y),
    w: Math.max(1, Math.round(box.w / s.x)),
    h: Math.max(1, Math.round(box.h / s.y)),
  };
}

/** A default footprint for an asset that has none: the lower middle of its map size. */
export function defaultFootprint(asset: Pick<AssetEntry, "mapWidth" | "mapHeight">): Footprint {
  const w = Math.max(4, 2 * Math.round(asset.mapWidth * 0.3));
  const h = Math.max(4, Math.round(asset.mapHeight * 0.2));
  return { x: -w / 2, y: -h, w, h };
}
