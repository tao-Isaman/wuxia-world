/**
 * The map editor's data model: the whole PlacementsFile under edit, an
 * unlimited undo / redo history of it, and the pure edits. No React.
 */
import type { AssetEntry, Placement, PlacementsFile } from "@/lib/assets/types";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/assets/placement-geometry";
import { AUTO_MAP_IDS } from "@/lib/world/data/auto-map-ids";

/** Every painted location map, hand-authored first. */
export const EDITOR_MAP_IDS: readonly string[] = ["home_player", "city_capital", "jail", ...AUTO_MAP_IDS];

export const EMPTY_FILE: PlacementsFile = { version: 1, maps: {} };
/** localStorage: the unsaved working file. */
export const DRAFT_KEY = "wuxia-engine-placements-draft";

export interface History {
  past: PlacementsFile[];
  present: PlacementsFile;
  future: PlacementsFile[];
}
export const initHistory = (file: PlacementsFile): History => ({ past: [], present: file, future: [] });

/** Record a new state (no-op when nothing changed). */
export function commit(history: History, next: PlacementsFile): History {
  if (next === history.present) return history;
  return { past: [...history.past, history.present], present: next, future: [] };
}
export function undo(history: History): History {
  const previous = history.past.at(-1);
  return previous ? { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] } : history;
}
export function redo(history: History): History {
  const next = history.future[0];
  return next ? { past: [...history.past, history.present], present: next, future: history.future.slice(1) } : history;
}

/** Replace one map's list (structural sharing: other maps keep their arrays). */
export function setMap(file: PlacementsFile, mapId: string, list: Placement[]): PlacementsFile {
  return { ...file, maps: { ...file.maps, [mapId]: list } };
}
/** Change the placements in `ids` on a map; untouched when `edit` changes nothing. */
export function editPlacements(file: PlacementsFile, mapId: string, ids: ReadonlySet<string>,
  edit: (placement: Placement) => Placement): PlacementsFile {
  const list = file.maps[mapId] ?? [];
  let changed = false;
  const next = list.map((placement) => {
    if (!ids.has(placement.id)) return placement;
    const edited = clean(edit(placement));
    if (JSON.stringify(edited) !== JSON.stringify(placement)) changed = true;
    return edited;
  });
  return changed ? setMap(file, mapId, next) : file;
}

/** The next free `p_000123` id across every map. */
export function nextPlacementId(file: PlacementsFile, taken: ReadonlySet<string> = new Set()): string {
  let max = 0;
  for (const list of Object.values(file.maps)) for (const p of list) {
    const n = /^p_(\d+)$/.exec(p.id);
    if (n) max = Math.max(max, Number(n[1]));
  }
  let id: string;
  do { id = `p_${String(++max).padStart(6, "0")}`; } while (taken.has(id));
  return id;
}

export const clampToMap = (x: number, y: number) => ({
  x: Math.round(Math.min(MAP_WIDTH, Math.max(0, x)) * 10) / 10,
  y: Math.round(Math.min(MAP_HEIGHT, Math.max(0, y)) * 10) / 10,
});
export const snap = (value: number, grid: number | null) => grid ? Math.round(value / grid) * grid : value;

/** Drop default-valued fields so the saved JSON stays small and diffable. */
export function clean(placement: Placement): Placement {
  const out: Placement = { id: placement.id, asset: placement.asset, x: placement.x, y: placement.y };
  if (placement.scale !== undefined && placement.scale !== 1) out.scale = Math.round(placement.scale * 1000) / 1000;
  if (placement.flip) out.flip = true;
  if (placement.dir) out.dir = placement.dir;
  if (placement.layer) out.layer = placement.layer;
  if (placement.collide !== undefined) out.collide = placement.collide;
  return out;
}

/** A new placement of `asset` at a map point. */
export function newPlacement(file: PlacementsFile, asset: AssetEntry, x: number, y: number): Placement {
  return { id: nextPlacementId(file), asset: asset.id, ...clampToMap(x, y), ...(asset.views?.S ? { dir: "S" as const } : {}) };
}

/** The file as saved: maps sorted by id, empty maps dropped, every placement cleaned; grounds sorted (none: no field). */
export function normalizeFile(file: PlacementsFile): PlacementsFile {
  const maps: Record<string, Placement[]> = {};
  for (const id of Object.keys(file.maps).sort()) if (file.maps[id]?.length) maps[id] = file.maps[id].map(clean);
  const grounds: NonNullable<PlacementsFile["grounds"]> = {};
  for (const id of Object.keys(file.grounds ?? {}).sort()) if (file.grounds![id]?.tile) grounds[id] = { tile: file.grounds![id].tile };
  return Object.keys(grounds).length ? { version: 1, maps, grounds } : { version: 1, maps };
}

/** Replace a map's painting with a tiled ground (or bring the painting back with null). */
export function setGround(file: PlacementsFile, mapId: string, tile: string | null): PlacementsFile {
  if ((file.grounds?.[mapId]?.tile ?? null) === tile) return file;
  const grounds = { ...file.grounds };
  if (tile) grounds[mapId] = { tile }; else delete grounds[mapId];
  return { ...file, grounds };
}
export const sameFile = (a: PlacementsFile, b: PlacementsFile) => JSON.stringify(normalizeFile(a)) === JSON.stringify(normalizeFile(b));
