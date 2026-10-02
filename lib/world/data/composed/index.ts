import type { ComposedMap } from "./types";
import { composedAsset } from "./assets";
import { CITY_CAPITAL_MAP } from "./city_capital";

export type { ComposedMap, ComposedObject, GroundArea, GroundMaterial, ComposedAssetDef } from "./types";
export { COMPOSED_ASSETS, composedAsset, COMPOSED_PX_PER_UNIT } from "./assets";

export const COMPOSED_MAPS: Record<string, ComposedMap> = {
  city_capital: CITY_CAPITAL_MAP,
};

/** A location map image naming a composed map: "composed:<id>". */
export const COMPOSED_PREFIX = "composed:";
export function composedMapFor(image: string | undefined): ComposedMap | undefined {
  return image?.startsWith(COMPOSED_PREFIX) ? COMPOSED_MAPS[image.slice(COMPOSED_PREFIX.length)] : undefined;
}

/** A placed sprite, resolved to world units: its box, its ground (depth) line and its solid base. */
export interface ComposedSprite {
  asset: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** World y where it meets the ground: actors above this line are drawn behind it. */
  depthY: number;
  flip: boolean;
  base?: { kind: "rect"; left: number; top: number; right: number; bottom: number }
    | { kind: "ellipse"; x: number; y: number; radiusX: number; radiusY: number };
}

export function composedSprites(map: ComposedMap): ComposedSprite[] {
  const out: ComposedSprite[] = [];
  for (const object of map.objects) {
    const asset = composedAsset(object.asset);
    if (!asset) continue;
    const scale = object.scale ?? 1;
    const width = asset.width * scale, height = asset.height * scale;
    const top = object.y - asset.groundAt * height, left = object.x - width / 2;
    const flip = !!object.flip;
    let base: ComposedSprite["base"];
    if (asset.base) {
      const l = flip ? 1 - asset.base.right : asset.base.left, r = flip ? 1 - asset.base.left : asset.base.right;
      const box = { left: left + l * width, right: left + r * width, top: top + asset.base.top * height, bottom: top + asset.base.bottom * height };
      base = asset.base.shape === "ellipse"
        ? { kind: "ellipse", x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2, radiusX: (box.right - box.left) / 2, radiusY: (box.bottom - box.top) / 2 }
        : { kind: "rect", ...box };
    }
    out.push({ asset: object.asset, src: `/maps/composed/${object.asset}.webp`, left, top, width, height, depthY: object.y, flip, base });
  }
  return out;
}

/** Everything solid on the map: the sprites' bases plus the authored blocks. */
export function composedFootprints(map: ComposedMap) {
  return [
    ...composedSprites(map).flatMap((sprite) => sprite.base ? [sprite.base] : []),
    ...(map.blocks ?? []).map((block) => ({ kind: "rect" as const, ...block })),
  ];
}

/** Night light sources: authored lamps plus every lantern post's lantern. */
export function composedLamps(map: ComposedMap): [number, number][] {
  const posts = composedSprites(map).filter((sprite) => sprite.asset === "lantern_post")
    .map((sprite): [number, number] => [sprite.left + sprite.width * 0.62, sprite.top + sprite.height * 0.3]);
  return [...(map.lamps ?? []).map(([x, y]): [number, number] => [x, y]), ...posts];
}
