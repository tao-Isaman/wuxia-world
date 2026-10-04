/**
 * Modular kits: roads, city walls and house walls built from pieces that join
 * on a square grid (category "kit", AssetEntry.kit). Pure: the engine's map
 * editor paints with them (the kit brush), tests check them, and the game just
 * draws the resulting placements like any other.
 *
 * Grid. A kit set has one cell size (`kit.cell`, map units) and its grid starts
 * at the map's top-left corner, so cell (col, row) covers
 * [col·cell, (col+1)·cell) × [row·cell, (row+1)·cell). A piece's anchor is the
 * bottom centre of the cells it covers: a 1 × 1 piece in (col, row) stands at
 * ((col + ½)·cell, (row + 1)·cell). Walls draw upward from there (their face and
 * top rise above the cell), roads lie flat in it.
 *
 * Iso grid (`kit.grid: "iso"`): diamonds `cell` wide and `cell / 2` tall, so
 * roads and walls run along the same 2:1 diagonals as the library's
 * isometric buildings. Cell (a, b) has its centre at
 * (ISO_ORIGIN_X + (a − b)·cell/2, (a + b + 1)·cell/4); a runs down-right, b
 * down-left. N is the up-right neighbour (b − 1), E down-right (a + 1), S
 * down-left (b + 1), W up-left (a − 1). An iso piece is anchored at the centre
 * of the cells it covers (the bottom of its image is the diamond's lower tip
 * plus nothing below).
 *
 * Connections. `kit.mask` holds the sides a piece joins across: N = 1, E = 2,
 * S = 4, W = 8 (the bits of PixelLab's road sets). A set has one auto piece per
 * mask (plus optional variants); the brush picks each cell's piece from which
 * neighbours hold the same set, so painting a line, a corner or a crossing
 * joins by itself. Special pieces (gates, towers, ends) are placed by hand but
 * snap to the grid, and their mask tells their neighbours which sides they join.
 */
import type { AssetEntry, KitInfo, Placement } from "./types";

export const KIT_N = 1, KIT_E = 2, KIT_S = 4, KIT_W = 8;
export const KIT_SIDES = [
  { bit: KIT_N, dc: 0, dr: -1, opposite: KIT_S },
  { bit: KIT_E, dc: 1, dr: 0, opposite: KIT_W },
  { bit: KIT_S, dc: 0, dr: 1, opposite: KIT_N },
  { bit: KIT_W, dc: -1, dr: 0, opposite: KIT_E },
] as const;

/** "NESW"-style label of a mask, e.g. 10 → "EW", 0 → "·". */
export function maskName(mask: number): string {
  return ["N", "E", "S", "W"].filter((_, i) => mask & (1 << i)).join("") || "·";
}

export interface KitSet {
  set: string;
  kind: KitInfo["kind"];
  cell: number;
  grid?: "iso";
  /** Auto pieces by mask (each mask's variants, ordered by id). */
  pieces: Map<number, AssetEntry[]>;
  /** Hand-placed pieces (gates, towers…). */
  specials: AssetEntry[];
  /** A representative piece (the straight east-west one), for thumbnails. */
  cover: AssetEntry;
}

/** Every kit set in the library, by set id. */
export function kitSets(assets: readonly AssetEntry[]): Map<string, KitSet> {
  const sets = new Map<string, KitSet>();
  for (const asset of assets) {
    const kit = asset.kit;
    if (!kit || asset.status !== "approved") continue;
    let entry = sets.get(kit.set);
    if (!entry) { entry = { set: kit.set, kind: kit.kind, cell: kit.cell, grid: kit.grid, pieces: new Map(), specials: [], cover: asset }; sets.set(kit.set, entry); }
    if (kit.special) entry.specials.push(asset);
    else {
      const list = entry.pieces.get(kit.mask) ?? [];
      list.push(asset);
      entry.pieces.set(kit.mask, list);
    }
  }
  for (const entry of sets.values()) {
    for (const list of entry.pieces.values()) list.sort((a, b) => a.id.localeCompare(b.id));
    entry.specials.sort((a, b) => a.id.localeCompare(b.id));
    entry.cover = entry.pieces.get(KIT_E | KIT_W)?.[0] ?? [...entry.pieces.values()][0]?.[0] ?? entry.cover;
  }
  return sets;
}

const spanOf = (kit: Pick<KitInfo, "span">) => ({ w: kit.span?.w ?? 1, h: kit.span?.h ?? 1 });
/** The grid a kit (or brush) works on. */
export type KitGrid = Pick<KitInfo, "cell" | "grid" | "span">;
export const ISO_ORIGIN_X = 480;

/** The centre of iso cell (a, b) (fractional cells allowed). */
export function isoCenter(cell: number, a: number, b: number): { x: number; y: number } {
  return { x: ISO_ORIGIN_X + (a - b) * cell / 2, y: (a + b + 1) * cell / 4 };
}

/** The anchor of a piece whose first cell is (col, row): square, the span's bottom centre; iso, the span's centre. */
export function kitAnchor(kit: KitGrid, col: number, row: number): { x: number; y: number } {
  const span = spanOf(kit);
  if (kit.grid === "iso") return isoCenter(kit.cell, col + (span.w - 1) / 2, row + (span.h - 1) / 2);
  return { x: (col + span.w / 2) * kit.cell, y: (row + span.h) * kit.cell };
}
/** The first cell of a piece anchored at (x, y). */
export function kitCellOf(kit: KitGrid, x: number, y: number): { col: number; row: number } {
  const span = spanOf(kit);
  if (kit.grid === "iso") {
    const { a, b } = isoCoords(kit.cell, x, y);
    return { col: Math.round(a - (span.w - 1) / 2), row: Math.round(b - (span.h - 1) / 2) };
  }
  return { col: Math.round(x / kit.cell - span.w / 2), row: Math.round(y / kit.cell - span.h) };
}
/** Fractional iso cell coordinates of a map point (cell centres are whole numbers). */
function isoCoords(cell: number, x: number, y: number): { a: number; b: number } {
  const u = (x - ISO_ORIGIN_X) / (cell / 2), v = y / (cell / 4) - 1;
  return { a: (u + v) / 2, b: (v - u) / 2 };
}
/** The cell under a map point. */
export function cellAt(grid: KitGrid | number, x: number, y: number): { col: number; row: number } {
  const g = typeof grid === "number" ? { cell: grid } : grid;
  if (g.grid === "iso") { const { a, b } = isoCoords(g.cell, x, y); return { col: Math.round(a), row: Math.round(b) }; }
  return { col: Math.floor(x / g.cell), row: Math.floor(y / g.cell) };
}
/** Snap a map point to where a piece would stand if its first cell were under the point. */
export function snapToKit(kit: KitInfo, x: number, y: number): { x: number; y: number } {
  const { col, row } = cellAt(kit, x, y);
  return kitAnchor(kit, col, row);
}
/** The outline of a cell in map units (a square or a diamond), for overlays. */
export function cellOutline(grid: KitGrid, col: number, row: number): { x: number; y: number }[] {
  if (grid.grid === "iso") {
    const c = isoCenter(grid.cell, col, row), w = grid.cell / 2, h = grid.cell / 4;
    return [{ x: c.x, y: c.y - h }, { x: c.x + w, y: c.y }, { x: c.x, y: c.y + h }, { x: c.x - w, y: c.y }];
  }
  const x = col * grid.cell, y = row * grid.cell;
  return [{ x, y }, { x: x + grid.cell, y }, { x: x + grid.cell, y: y + grid.cell }, { x, y: y + grid.cell }];
}

const key = (col: number, row: number) => `${col},${row}`;

/** One placement of a set and the cells it covers. */
interface Occupant { placement: Placement; asset: AssetEntry; kit: KitInfo; col: number; row: number }

/** Every cell held by a piece of `set` on a map. */
export function kitCells(placements: readonly Placement[], assets: ReadonlyMap<string, AssetEntry>, set: string): Map<string, Occupant> {
  const cells = new Map<string, Occupant>();
  for (const placement of placements) {
    const asset = assets.get(placement.asset);
    const kit = asset?.kit;
    if (!asset || !kit || kit.set !== set) continue;
    const { col, row } = kitCellOf(kit, placement.x, placement.y);
    const span = spanOf(kit);
    for (let c = 0; c < span.w; c++) for (let r = 0; r < span.h; r++) cells.set(key(col + c, row + r), { placement, asset, kit, col, row });
  }
  return cells;
}

/** Whether the occupant of a neighbouring cell joins back across `side` (its opposite side faces us). */
function joins(occupant: Occupant | undefined, opposite: number): boolean {
  if (!occupant) return false;
  return !occupant.kit.special || (occupant.kit.mask & opposite) !== 0;
}

/** The mask a 1 × 1 auto piece at (col, row) should have, from its neighbours. */
export function maskAt(cells: ReadonlyMap<string, Occupant>, col: number, row: number): number {
  let mask = 0;
  for (const side of KIT_SIDES) if (joins(cells.get(key(col + side.dc, row + side.dr)), side.opposite)) mask |= side.bit;
  return mask;
}

/** A set's piece for a mask: the exact one, else the closest (fewest differing sides, preferring fewer extra joins). */
export function pieceFor(set: KitSet, mask: number, col = 0, row = 0): AssetEntry {
  let best: AssetEntry[] | undefined = set.pieces.get(mask);
  if (!best) {
    let score = Infinity;
    for (const [m, list] of set.pieces) {
      const diff = m ^ mask;
      const s = popcount(diff) * 2 + popcount(diff & m);
      if (s < score) { score = s; best = list; }
    }
  }
  const list = best ?? [set.cover];
  // Variants alternate by cell so long runs don't repeat one image.
  return list[Math.abs(col * 7 + row * 13) % list.length];
}
const popcount = (n: number) => { let c = 0; for (; n; n &= n - 1) c++; return c; };

export interface KitEdit {
  /** The map's placements after the edit. */
  placements: Placement[];
  /** Placement ids added or re-pieced (for selection). */
  changed: string[];
}

/**
 * Paint (or erase) cells with a set: fills each empty cell with an auto piece,
 * removes the set's 1 × 1 pieces from erased cells, then re-pieces every cell
 * of the set next to a change so the joins follow. Cells held by another set
 * are left alone (a road can run under a wall's gate); special pieces are never
 * re-pieced or erased by the brush. `nextId` hands out placement ids.
 */
export function paintKit(placements: readonly Placement[], assets: ReadonlyMap<string, AssetEntry>, set: KitSet,
  cellsToPaint: readonly { col: number; row: number }[], erase: boolean, nextId: () => string): KitEdit {
  let list = [...placements];
  const changed = new Set<string>();
  const cells = kitCells(list, assets, set.set);
  const touched: { col: number; row: number }[] = [];
  for (const { col, row } of cellsToPaint) {
    if (!cellOnMap(set, col, row)) continue;
    const occupant = cells.get(key(col, row));
    if (erase) {
      if (!occupant || occupant.kit.special) continue;
      list = list.filter((p) => p.id !== occupant.placement.id);
      cells.delete(key(col, row));
    } else {
      if (occupant) continue;
      const piece = pieceFor(set, 0, col, row);
      const placement: Placement = { id: nextId(), asset: piece.id, ...kitAnchor(piece.kit!, col, row) };
      list.push(placement);
      cells.set(key(col, row), { placement, asset: piece, kit: piece.kit!, col, row });
      changed.add(placement.id);
    }
    touched.push({ col, row });
  }
  if (!touched.length) return { placements: list, changed: [] };
  return repiece(list, assets, set, touched, changed);
}

/** Whether a cell is on the 960 × 640 map: a square one wholly, an iso one by its centre (so a piece's anchor always is). */
export function cellOnMap(grid: KitGrid, col: number, row: number): boolean {
  if (grid.grid === "iso") {
    // Diamonds tile the map's edges only partly: a cell counts while its centre is on the map.
    const c = isoCenter(grid.cell, col, row);
    return c.x >= 0 && c.x <= 960 && c.y >= 0 && c.y <= 640;
  }
  return col >= 0 && row >= 0 && col < Math.floor(960 / grid.cell) && row < Math.floor(640 / grid.cell);
}

/** Re-pick the auto pieces of `set` in and next to `cells` from their neighbours. */
function repiece(placements: Placement[], assets: ReadonlyMap<string, AssetEntry>, set: KitSet,
  cells: readonly { col: number; row: number }[], changed = new Set<string>()): KitEdit {
  let list = placements;
  const occupied = kitCells(list, assets, set.set);
  const todo = new Set<string>();
  for (const { col, row } of cells) {
    todo.add(key(col, row));
    for (const side of KIT_SIDES) todo.add(key(col + side.dc, row + side.dr));
  }
  const replaced = new Map<string, Placement>();
  for (const k of todo) {
    const occupant = occupied.get(k);
    if (!occupant || occupant.kit.special) continue;
    const piece = pieceFor(set, maskAt(occupied, occupant.col, occupant.row), occupant.col, occupant.row);
    if (piece.id === occupant.placement.asset) continue;
    replaced.set(occupant.placement.id, { ...occupant.placement, asset: piece.id, ...kitAnchor(piece.kit!, occupant.col, occupant.row) });
    changed.add(occupant.placement.id);
  }
  if (replaced.size) list = list.map((p) => replaced.get(p.id) ?? p);
  return { placements: list, changed: [...changed].filter((id) => list.some((p) => p.id === id)) };
}

/**
 * Place a hand-placed piece (a gate) with its top-left cell at (col, row):
 * the set's auto pieces under it go, and the pieces around re-join to it.
 */
export function placeKitSpecial(placements: readonly Placement[], assets: ReadonlyMap<string, AssetEntry>, set: KitSet,
  special: AssetEntry, col: number, row: number, id: string): KitEdit {
  const kit = special.kit!;
  const span = spanOf(kit);
  const covered: { col: number; row: number }[] = [];
  for (let c = 0; c < span.w; c++) for (let r = 0; r < span.h; r++) covered.push({ col: col + c, row: row + r });
  const under = kitCells(placements, assets, set.set);
  const gone = new Set(covered.flatMap((cell) => {
    const occupant = under.get(key(cell.col, cell.row));
    return occupant && !occupant.kit.special ? [occupant.placement.id] : [];
  }));
  const placement: Placement = { id, asset: special.id, ...kitAnchor(kit, col, row) };
  const list = [...placements.filter((p) => !gone.has(p.id)), placement];
  return repiece(list, assets, set, covered, new Set([id]));
}

/** The cells on a grid line from a to b, each sharing a side with the last (so a dragged wall joins up). */
export function cellLine(a: { col: number; row: number }, b: { col: number; row: number }): { col: number; row: number }[] {
  const nx = Math.abs(b.col - a.col), ny = Math.abs(b.row - a.row);
  const sx = Math.sign(b.col - a.col), sy = Math.sign(b.row - a.row);
  const out = [{ col: a.col, row: a.row }];
  let ix = 0, iy = 0;
  while (ix < nx || iy < ny) {
    if (iy >= ny || (ix < nx && (0.5 + ix) / nx < (0.5 + iy) / ny)) ix++; else iy++;
    out.push({ col: a.col + ix * sx, row: a.row + iy * sy });
  }
  return out;
}
