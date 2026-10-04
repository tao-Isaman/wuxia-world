/**
 * Where and how a placed object (Placement + its AssetEntry) is drawn on a
 * 960 × 640 map, and the ground it blocks. Pure: the game's world runtime
 * (lib/stage/world-runtime.ts) and the engine's map editor
 * (components/engine/map-editor.tsx) both draw from this, so the editor
 * shows exactly what the game draws.
 *
 * Conventions (see docs/rendering.md#placed-objects):
 * - `Placement.x / y` is the asset's anchor (`anchorX / anchorY`, its base
 *   centre) in map units.
 * - The image is drawn `mapWidth × mapHeight × scale` map units, the anchor
 *   pinned to (x, y); `flip` mirrors it about the anchor.
 * - `AssetEntry.footprint` is a box `{ x, y, w, h }` in map units relative to
 *   the anchor: its top-left corner is (x + footprint.x, y + footprint.y).
 *   It scales with `scale` and mirrors with `flip`.
 * - Depth follows the world runtime: map −1, shadows 1–3, characters by foot
 *   y (`100 + y·10`, the hero `101 + y·10`), signs 8000, night veil 8900.
 *   "ground" sits on the painting under everything (−0.9…−0.1), "object"
 *   sorts with characters by its base y, "overhead" is over every character
 *   (7000…7064) but under signs, labels and the night veil.
 */
import type { AssetDirection, AssetEntry, Placement } from "./types";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 640;

export type PlacementLayer = NonNullable<Placement["layer"]>;

/** An axis-aligned box in map units. */
export interface MapRect { left: number; top: number; right: number; bottom: number }

/** Depth of a character (NPC, bystander, foe) standing with its feet at `y`. */
export const characterDepth = (y: number) => 100 + y * 10;
/** The hero draws just in front of a character on the same line. */
export const heroDepth = (y: number) => 101 + y * 10;

/** Depth of a placed object by layer and base (anchor) y. */
export function placementDepth(layer: PlacementLayer, y: number): number {
  const t = Math.min(Math.max(y, 0), MAP_HEIGHT) / MAP_HEIGHT;
  if (layer === "ground") return -0.9 + t * 0.8;
  if (layer === "overhead") return 7000 + t * 64;
  return characterDepth(y);
}

export interface PlacementGeometry {
  id: string;
  asset: string;
  /** The image to draw: the `dir` view when the asset has it, else the default image. */
  image: string;
  /** Anchor in map units. */
  x: number;
  y: number;
  /** Display size in map units. */
  width: number;
  height: number;
  /** Anchor as a fraction of the (unflipped) image, for an origin-based renderer (Phaser). */
  originX: number;
  originY: number;
  flip: boolean;
  /** The drawn box in map units (already mirrored when flipped). */
  box: MapRect;
  layer: PlacementLayer;
  depth: number;
  /** The footprint in map units, or null when the asset has none. */
  footprint: MapRect | null;
  /** Whether the footprint blocks walking (`collide ?? footprint !== null`). */
  blocks: boolean;
}

/** The image for a view: an 8-direction asset's `dir` view, else its default image. */
export function placementImage(asset: AssetEntry, dir?: AssetDirection): string {
  return (dir && asset.views?.[dir]) || asset.image;
}

/** Everything needed to draw and collide one placement. */
export function placementGeometry(placement: Placement, asset: AssetEntry): PlacementGeometry {
  const scale = placement.scale && placement.scale > 0 ? placement.scale : 1;
  const flip = !!placement.flip;
  const width = asset.mapWidth * scale;
  const height = asset.mapHeight * scale;
  const originX = asset.width > 0 ? asset.anchorX / asset.width : 0.5;
  const originY = asset.height > 0 ? asset.anchorY / asset.height : 1;
  const left = placement.x - (flip ? 1 - originX : originX) * width;
  const top = placement.y - originY * height;
  const layer = placement.layer ?? asset.layer ?? "object";
  let footprint: MapRect | null = null;
  if (asset.footprint) {
    const f = asset.footprint;
    const fx = flip ? -(f.x + f.w) : f.x;
    footprint = {
      left: placement.x + fx * scale, top: placement.y + f.y * scale,
      right: placement.x + (fx + f.w) * scale, bottom: placement.y + (f.y + f.h) * scale,
    };
  }
  return {
    id: placement.id, asset: asset.id, image: placementImage(asset, placement.dir), x: placement.x, y: placement.y,
    width, height, originX, originY, flip, box: { left, top, right: left + width, bottom: top + height },
    layer, depth: placementDepth(layer, placement.y), footprint,
    blocks: !!footprint && (placement.collide ?? true),
  };
}

/** Geometry for every placement whose asset is known (unknown asset ids are skipped). */
export function placementsGeometry(placements: readonly Placement[], assets: ReadonlyMap<string, AssetEntry>): PlacementGeometry[] {
  const out: PlacementGeometry[] = [];
  for (const placement of placements) {
    const asset = assets.get(placement.asset);
    if (asset) out.push(placementGeometry(placement, asset));
  }
  return out;
}

/** The blocking footprints of placed objects, as boxes in map units. */
export function blockingRects(geometry: readonly PlacementGeometry[]): MapRect[] {
  return geometry.flatMap((g) => g.blocks && g.footprint ? [g.footprint] : []);
}

/** Draw order for a renderer without depth (the editor's DOM): back to front. */
export function byDepth<T extends { depth: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.depth - b.depth);
}
