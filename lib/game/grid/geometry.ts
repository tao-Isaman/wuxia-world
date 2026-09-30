// ─── Grid geometry (pure) ─────────────────────────────────────────────
// Distances, walking range, aim range and area-of-effect cells for the
// tactics board. Manhattan distance everywhere (diamond-shaped ranges, as in
// Wandering Sword). No line-of-sight: wuxia qi flies over heads.

import { cellKey, sameCell, type AreaShape, type Cell, type Facing, type GridSkillProfile } from "./types";

export interface Board {
  cols: number;
  rows: number;
  /** cellKey → blocked terrain */
  blocked: ReadonlySet<string>;
}

export const manhattan = (a: Cell, b: Cell): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const chebyshev = (a: Cell, b: Cell): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
export const inBounds = (board: Pick<Board, "cols" | "rows">, c: Cell): boolean =>
  c.x >= 0 && c.y >= 0 && c.x < board.cols && c.y < board.rows;

const STEPS: readonly Cell[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
export const neighbours = (c: Cell): Cell[] => STEPS.map((d) => ({ x: c.x + d.x, y: c.y + d.y }));

/** Which way a unit faces when acting from `from` toward `to` (horizontal wins ties). */
export function facingToward(from: Cell, to: Cell, fallback: Facing = "right"): Facing {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (!dx && !dy) return fallback;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/**
 * Tiles a unit can walk to this turn (including where it stands), with the
 * path to each. Breadth-first over 4-neighbours within `move` steps.
 *   - blocked terrain and enemies stop movement;
 *   - allies can be walked through but not stood on.
 * `occupiedByAlly` / `occupiedByEnemy` are cellKey sets excluding the mover.
 */
export function reachableCells(
  board: Board,
  from: Cell,
  move: number,
  occupiedByAlly: ReadonlySet<string>,
  occupiedByEnemy: ReadonlySet<string>,
): Map<string, Cell[]> {
  const paths = new Map<string, Cell[]>([[cellKey(from), [from]]]);
  const queue: Cell[] = [from];
  while (queue.length) {
    const here = queue.shift()!;
    const path = paths.get(cellKey(here))!;
    if (path.length - 1 >= move) continue;
    for (const next of neighbours(here)) {
      const key = cellKey(next);
      if (!inBounds(board, next) || board.blocked.has(key) || occupiedByEnemy.has(key) || paths.has(key)) continue;
      paths.set(key, [...path, next]);
      queue.push(next);
    }
  }
  // Allies can be passed through, never stopped on.
  for (const key of occupiedByAlly) if (key !== cellKey(from)) paths.delete(key);
  return paths;
}

/** Cells a skill can be aimed at from `origin` (inside the board, blocked cells excluded). */
export function aimCells(board: Board, origin: Cell, profile: GridSkillProfile): Cell[] {
  const out: Cell[] = [];
  const { min, max } = profile.range;
  for (let y = origin.y - max; y <= origin.y + max; y++) {
    for (let x = origin.x - max; x <= origin.x + max; x++) {
      const c = { x, y };
      const d = manhattan(origin, c);
      if (d < min || d > max || !inBounds(board, c) || board.blocked.has(cellKey(c))) continue;
      if (profile.area.kind === "line" && d > 0 && x !== origin.x && y !== origin.y) continue;
      out.push(c);
    }
  }
  return out;
}

/** Unit direction from `from` toward `to` along the dominant axis (never 0,0 unless equal). */
function direction(from: Cell, to: Cell): Cell {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (!dx && !dy) return { x: 1, y: 0 };
  return Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
}

/** Every cell an area covers when `caster` aims at `aimed` (clipped to the board). */
export function areaCells(board: Pick<Board, "cols" | "rows">, caster: Cell, aimed: Cell, area: AreaShape): Cell[] {
  const cells: Cell[] = [];
  const push = (c: Cell) => { if (inBounds(board, c) && !cells.some((o) => sameCell(o, c))) cells.push(c); };
  switch (area.kind) {
    case "single":
      push(aimed);
      break;
    case "diamond":
      for (let dy = -area.size; dy <= area.size; dy++)
        for (let dx = -area.size; dx <= area.size; dx++)
          if (Math.abs(dx) + Math.abs(dy) <= area.size) push({ x: aimed.x + dx, y: aimed.y + dy });
      break;
    case "square":
      for (let dy = -area.size; dy <= area.size; dy++)
        for (let dx = -area.size; dx <= area.size; dx++) push({ x: aimed.x + dx, y: aimed.y + dy });
      break;
    case "cross":
      push(aimed);
      for (const d of STEPS) for (let i = 1; i <= area.size; i++) push({ x: aimed.x + d.x * i, y: aimed.y + d.y * i });
      break;
    case "line": {
      const d = direction(caster, aimed);
      for (let i = 1; i <= area.size; i++) push({ x: caster.x + d.x * i, y: caster.y + d.y * i });
      break;
    }
    case "arc": {
      const d = direction(caster, aimed);
      push(aimed);
      push({ x: aimed.x + d.y, y: aimed.y + d.x });
      push({ x: aimed.x - d.y, y: aimed.y - d.x });
      break;
    }
  }
  return cells;
}
