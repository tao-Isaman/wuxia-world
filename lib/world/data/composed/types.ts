/**
 * Composed maps: a location built from separate game assets (buildings,
 * walls, trees, stalls, props and tiled ground) instead of one painting.
 * Coordinates are world units (x right, y down), the same units the hero
 * walks in; a composed map can be much larger than the 960 × 640 paintings.
 */

/** A solid footprint as fractions of the sprite box (0 = left / top, 1 = right / bottom). */
export interface AssetBase { left: number; right: number; top: number; bottom: number; shape?: "rect" | "ellipse" }

/** One reusable piece of art (public/maps/composed/<id>.webp). */
export interface ComposedAssetDef {
  /** World width of the sprite; its height follows the image's aspect. */
  width: number;
  /**
   * The solid base (one footprint, or several — a gate's two piers either side
   * of its arch). Omitted: the asset is walk-through (lanterns…).
   */
  base?: AssetBase | readonly AssetBase[];
  /** Where the asset meets the ground, as a fraction of its height (default: the base's bottom, else 0.95). */
  ground?: number;
}

/** A placed asset: its ground point (bottom centre of the base) sits at x, y. */
export interface ComposedObject {
  asset: string;
  x: number;
  y: number;
  /** Size multiplier (default 1). */
  scale?: number;
  /** Mirror left↔right. */
  flip?: boolean;
  /** Extra vertical stretch (a north–south wall piece fitted to its run). */
  stretch?: number;
}

/** A rectangle of tiled ground (drawn in order, later areas on top). */
export interface GroundArea {
  material: GroundMaterial;
  x: number;
  y: number;
  w: number;
  h: number;
  /** A darker kerb line around the area (paved streets, canal banks). */
  edge?: boolean;
}

export type GroundMaterial = "paving" | "plaza" | "dirt" | "grass" | "water" | "cobble";

export interface ComposedMap {
  id: string;
  width: number;
  height: number;
  /** Ground under everything. */
  base: GroundMaterial;
  ground: readonly GroundArea[];
  objects: readonly ComposedObject[];
  /** Extra invisible solids (water, the map's outer wall line), in world units. */
  blocks?: readonly { left: number; top: number; right: number; bottom: number }[];
  /** Night lanterns (world units); lantern_post objects are added automatically. */
  lamps?: readonly [number, number][];
}
