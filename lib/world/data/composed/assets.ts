import type { ComposedAssetDef } from "./types";
import { COMPOSED_ASSET_PIXELS } from "./asset-pixels";

// World sizes and solid bases of the composed-map art (public/maps/composed/).
// The hero is about 56 units tall; a shophouse is ~220 units wide. Bases are
// the footprint of the walls on the ground in the three-quarter view, as
// fractions of the trimmed sprite (see scripts/render-composed-map.ts --bases).
const BUILDING = { left: 0.07, right: 0.93, top: 0.56, bottom: 0.93 } as const;
const STALL = { left: 0.12, right: 0.88, top: 0.62, bottom: 0.94 } as const;
const TRUNK = { left: 0.42, right: 0.58, top: 0.86, bottom: 0.97, shape: "ellipse" } as const;

export const COMPOSED_ASSETS: Record<string, ComposedAssetDef> = {
  palace_gate: { width: 620, base: { left: 0.05, right: 0.95, top: 0.5, bottom: 0.86 } },
  yamen: { width: 440, base: BUILDING },
  inn: { width: 460, base: BUILDING },
  shop_apothecary: { width: 230, base: BUILDING },
  shop_cloth: { width: 230, base: BUILDING },
  shop_general: { width: 230, base: BUILDING },
  smithy: { width: 250, base: BUILDING },
  house_a: { width: 210, base: BUILDING },
  house_b: { width: 230, base: { left: 0.04, right: 0.96, top: 0.6, bottom: 0.94 } },
  house_c: { width: 210, base: BUILDING },
  temple: { width: 400, base: BUILDING },
  pagoda: { width: 200, base: { left: 0.14, right: 0.86, top: 0.84, bottom: 0.97 } },
  gate_tower: { width: 460, base: { left: 0.02, right: 0.98, top: 0.72, bottom: 0.95 } },
  wall_segment: { width: 460, base: { left: 0, right: 1, top: 0.74, bottom: 0.95 } },
  granary: { width: 220, base: BUILDING },
  stall_fruit: { width: 130, base: STALL },
  stall_food: { width: 130, base: STALL },
  stall_pottery: { width: 130, base: STALL },
  stall_cloth: { width: 130, base: STALL },
  tree_willow: { width: 170, base: TRUNK },
  tree_pine: { width: 150, base: TRUNK },
  tree_plum: { width: 150, base: TRUNK },
  tree_maple: { width: 160, base: TRUNK },
  well: { width: 70, base: { left: 0.18, right: 0.82, top: 0.58, bottom: 0.95, shape: "ellipse" } },
  cart: { width: 90, base: { left: 0.1, right: 0.9, top: 0.5, bottom: 0.95 } },
  crates: { width: 80, base: { left: 0.08, right: 0.92, top: 0.45, bottom: 0.95 } },
  lantern_post: { width: 36 },
  stone_lion: { width: 46, base: { left: 0.15, right: 0.85, top: 0.7, bottom: 0.97 } },
  bridge: { width: 240, ground: 0.92 },
  notice_board: { width: 80, base: { left: 0.2, right: 0.8, top: 0.86, bottom: 0.97 } },
  flower_bed: { width: 120, base: { left: 0.04, right: 0.96, top: 0.35, bottom: 0.96 } },
  rock_garden: { width: 120, base: { left: 0.12, right: 0.88, top: 0.62, bottom: 0.96 } },
};

export interface ComposedAssetGeometry extends ComposedAssetDef {
  id: string;
  height: number;
  /** Ground line as a fraction of the height. */
  groundAt: number;
}

/** The world size of an asset, from its definition and the processed image's aspect. */
export function composedAsset(id: string): ComposedAssetGeometry | undefined {
  const def = COMPOSED_ASSETS[id];
  const pixels = COMPOSED_ASSET_PIXELS[id];
  if (!def || !pixels) return undefined;
  const height = def.width * pixels[1] / pixels[0];
  return { ...def, id, height, groundAt: def.ground ?? def.base?.bottom ?? 0.95 };
}

/** Processed art density: image pixels per world unit. */
export const COMPOSED_PX_PER_UNIT = 2;
