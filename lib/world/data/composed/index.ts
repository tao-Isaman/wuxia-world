import type { ComposedMap, GridRect } from "./types";
import { composedAsset } from "./assets";
import { isoDiamond, isoSize, isoToWorld, worldToIso } from "./iso";
import { CITY_CAPITAL_MAP } from "./city_capital";

export type { ComposedMap, ComposedObject, GroundArea, GroundMaterial, ComposedAssetDef, GridRect } from "./types";
export { COMPOSED_ASSETS, composedAsset, COMPOSED_PX_PER_UNIT, COMPOSED_GROUND_TILE_UNITS } from "./assets";
export { ISO_TILE_W, ISO_TILE_H, ISO_TOP_PAD, isoSize, isoToWorld, worldToIso, isoPercent, isoDiamond } from "./iso";

export const COMPOSED_MAPS: Record<string, ComposedMap> = {
  city_capital: CITY_CAPITAL_MAP,
};

/** A location map image naming a composed map: "composed:<id>". */
export const COMPOSED_PREFIX = "composed:";
export function composedMapFor(image: string | undefined): ComposedMap | undefined {
  return image?.startsWith(COMPOSED_PREFIX) ? COMPOSED_MAPS[image.slice(COMPOSED_PREFIX.length)] : undefined;
}

/** A 960 × 640 picture of a composed map (scripts/render-composed-map.ts), for dialog backdrops and cutscene stages. */
export const composedOverview = (id: string) => `/maps/composed/${id}-overview.webp`;
/** The still picture behind a location: its painting, or a composed map's overview. */
export function mapBackdrop(image: string): string {
  const map = composedMapFor(image);
  return map ? composedOverview(map.id) : image;
}

interface Point { x: number; y: number }
/** A solid convex outline in world units (a footprint diamond, or a corner outside the grid). */
export interface ComposedSolid { kind: "poly"; points: Point[] }

/** A placed sprite, resolved to world units: its box, its footprint and its draw order. */
export interface ComposedSprite {
  asset: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  flip: boolean;
  /** Draw order: 100 + 10 × the footprint centre's world y (actors use their feet). */
  depth: number;
  /** The whole footprint on the grid, for deciding whether an actor stands in front. */
  footprint: GridRect;
  solids: ComposedSolid[];
  lamps: [number, number][];
}

const DEFAULT_SOLID: GridRect = [0.04, 0.04, 0.96, 0.96];
const sprites = new WeakMap<ComposedMap, ComposedSprite[]>();

export function composedSprites(map: ComposedMap): ComposedSprite[] {
  const cached = sprites.get(map);
  if (cached) return cached;
  const out: ComposedSprite[] = [];
  for (const object of map.objects) {
    const asset = composedAsset(object.asset);
    if (!asset) continue;
    const scale = object.scale ?? 1, flip = !!object.flip;
    // Mirroring the art swaps its u and v sides.
    const [a, b] = flip ? [asset.tiles[1], asset.tiles[0]] : asset.tiles;
    const u0 = object.u, v0 = object.v, u1 = u0 + a * scale, v1 = v0 + b * scale;
    const bottom = isoToWorld(map, u1, v1), west = isoToWorld(map, u0, v1), east = isoToWorld(map, u1, v0);
    const width = asset.width * scale, height = asset.height * scale;
    const left = (west.x + east.x) / 2 + (flip ? -1 : 1) * (asset.shift ?? 0) * width - width / 2;
    const top = bottom.y - asset.groundAt * height;
    const solids = (asset.solid ?? [DEFAULT_SOLID]).map(([fu0, fv0, fu1, fv1]): ComposedSolid => {
      const [su0, sv0, su1, sv1] = flip ? [fv0, fu0, fv1, fu1] : [fu0, fv0, fu1, fv1];
      return { kind: "poly", points: isoDiamond(map, u0 + su0 * a * scale, v0 + sv0 * b * scale, u0 + su1 * a * scale, v0 + sv1 * b * scale) };
    });
    const lamps = (asset.lamps ?? []).map(([fx, fy]): [number, number] => [left + (flip ? 1 - fx : fx) * width, top + fy * height]);
    const centre = isoToWorld(map, (u0 + u1) / 2, (v0 + v1) / 2);
    out.push({ asset: object.asset, src: `/maps/composed/${object.asset}.webp`, left, top, width, height, flip,
      depth: 100 + centre.y * 10, footprint: [u0, v0, u1, v1], solids, lamps });
  }
  sprites.set(map, out);
  return out;
}

/** Everything solid on the map: the sprites' footprints, the authored blocks, and the corners outside the grid. */
export function composedFootprints(map: ComposedMap): ComposedSolid[] {
  const { width, height } = isoSize(map);
  const top = isoToWorld(map, 0, 0), right = isoToWorld(map, map.columns, 0), bottom = isoToWorld(map, map.columns, map.rows), left = isoToWorld(map, 0, map.rows);
  const corners: ComposedSolid[] = [
    { kind: "poly", points: [{ x: 0, y: 0 }, { x: top.x, y: 0 }, top, left] },
    { kind: "poly", points: [{ x: top.x, y: 0 }, { x: width, y: 0 }, right, top] },
    { kind: "poly", points: [right, { x: width, y: height }, bottom] },
    { kind: "poly", points: [left, bottom, { x: 0, y: height }] },
  ];
  return [
    ...composedSprites(map).flatMap((sprite) => sprite.solids),
    ...(map.blocks ?? []).map(([u0, v0, u1, v1]): ComposedSolid => ({ kind: "poly", points: isoDiamond(map, u0, v0, u1, v1) })),
    ...corners,
  ];
}

/** Night light sources: authored lamps plus every lantern asset's lights. */
export function composedLamps(map: ComposedMap): [number, number][] {
  const authored = (map.lamps ?? []).map(([u, v]): [number, number] => { const p = isoToWorld(map, u, v); return [p.x, p.y]; });
  return [...authored, ...composedSprites(map).flatMap((sprite) => sprite.lamps)];
}

/**
 * Draw order for an actor standing at a world point. Sorting on the feet alone
 * fails beside long or deep footprints, so the actor is lifted above every
 * sprite it stands in front of (past the footprint's far u or v edge) and kept
 * below every sprite it stands behind, among the sprites its body overlaps.
 */
export function composedActorDepth(map: ComposedMap): (point: Point, base: number) => number {
  const list = composedSprites(map);
  const BUCKET = 256;
  const buckets = new Map<number, ComposedSprite[]>();
  for (const sprite of list) {
    for (let b = Math.floor(sprite.left / BUCKET); b <= Math.floor((sprite.left + sprite.width) / BUCKET); b++) {
      const bucket = buckets.get(b) ?? []; bucket.push(sprite); buckets.set(b, bucket);
    }
  }
  return (point, base) => {
    const { u, v } = worldToIso(map, point.x, point.y);
    let lower = -Infinity, upper = Infinity;
    for (const sprite of buckets.get(Math.floor(point.x / BUCKET)) ?? []) {
      // The actor's body: about 24 units wide and 60 tall above the feet.
      if (point.x + 12 < sprite.left || point.x - 12 > sprite.left + sprite.width) continue;
      if (point.y < sprite.top || point.y - 60 > sprite.top + sprite.height) continue;
      const [u0, v0, u1, v1] = sprite.footprint;
      const inside = u > u0 && u < u1 && v > v0 && v < v1;
      const front = inside ? u + v > (u0 + u1 + v0 + v1) / 2 : u >= u1 || v >= v1;
      if (front) lower = Math.max(lower, sprite.depth); else upper = Math.min(upper, sprite.depth);
    }
    if (base <= lower) return lower + 0.5;
    if (base >= upper) return upper > lower ? Math.max(lower + 0.25, upper - 0.5) : lower + 0.5;
    return base;
  };
}
