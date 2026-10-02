/**
 * Composed maps: a location built from separate isometric game assets
 * (buildings, walls, trees, stalls, props) on tiled ground instead of one
 * painting. Everything is authored on a 2:1 isometric grid: `u` runs to the
 * lower right of the screen, `v` to the lower left, one tile is
 * ISO_TILE_W × ISO_TILE_H world units on screen (lib/world/data/composed/iso.ts).
 * The hero still walks in screen-space world units (x right, y down).
 */

/** A rectangle on the grid: [u0, v0, u1, v1] (tiles, or fractions of a footprint). */
export type GridRect = readonly [number, number, number, number];

/** One reusable piece of art (public/maps/composed/<id>.webp). */
export interface ComposedAssetDef {
  /** Footprint in tiles along u × v, for the art as painted (its front faces the lower left). */
  tiles: readonly [number, number];
  /** Sprite width in world units (default: the footprint diamond's width). */
  width?: number;
  /** Where the footprint's bottom corner sits, as a fraction of the sprite's height (default 0.98). */
  ground?: number;
  /** Shift of the sprite left (−) or right (+) of the footprint, as a fraction of its width. */
  shift?: number;
  /**
   * The solid parts as fractions of the footprint (default: all of it, slightly
   * inset). `[]` makes the asset walk-through (lanterns, bridges, docks).
   */
  solid?: readonly GridRect[];
  /** Night lights on the sprite, as fractions of its box (0.5, 0.2 = centred, a fifth of the way down). */
  lamps?: readonly (readonly [number, number])[];
}

/** A placed asset: its footprint's top corner sits on grid point (u, v). */
export interface ComposedObject {
  asset: string;
  u: number;
  v: number;
  /** Mirror left↔right: the footprint swaps its sides and the front faces the lower right. */
  flip?: boolean;
  /** Size multiplier for the sprite and its footprint (default 1). */
  scale?: number;
}

/** A grid rectangle of tiled ground (drawn in order, later areas on top). */
export interface GroundArea {
  material: GroundMaterial;
  u: number;
  v: number;
  w: number;
  h: number;
  /** A darker kerb line around the area (paved streets, canal banks). */
  edge?: boolean;
}

export type GroundMaterial = "paving" | "plaza" | "dirt" | "grass" | "water" | "cobble";

export interface ComposedMap {
  id: string;
  /** Grid size in tiles (u × v). */
  columns: number;
  rows: number;
  /** Ground under everything. */
  base: GroundMaterial;
  ground: readonly GroundArea[];
  objects: readonly ComposedObject[];
  /** Extra invisible solids on the grid (water). */
  blocks?: readonly GridRect[];
  /** Extra night lanterns, on the grid; lantern assets are added automatically. */
  lamps?: readonly (readonly [number, number])[];
}
