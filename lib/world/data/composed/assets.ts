import type { ComposedAssetDef, GridRect } from "./types";
import { COMPOSED_ASSET_PIXELS } from "./asset-pixels";
import { ISO_TILE_W } from "./iso";

// Footprints and sizes of the isometric composed-map art (public/maps/composed/).
// A tile is 64 × 32 world units; the hero is about 56 units tall, so a 3 × 3
// shophouse is a 192-unit diamond. `tiles` follow each painting's base: its
// bottom corner sits a / (a + b) across the art (scripts/build-composed-assets.ts
// --measure), and scripts/render-composed-map.ts --bases draws the solids.
const WALK: readonly GridRect[] = [];
const TRUNK: readonly GridRect[] = [[0.3, 0.3, 0.7, 0.7]];
const TREE = { tiles: [1, 1], solid: TRUNK, ground: 0.96 } as const;

export const COMPOSED_ASSETS: Record<string, ComposedAssetDef> = {
  // Shops and houses.
  shop_a: { tiles: [3, 3] },
  shop_cloth: { tiles: [3.5, 2.2] },
  apothecary: { tiles: [3, 3] },
  smithy: { tiles: [3, 3] },
  pawnshop: { tiles: [3, 3] },
  house_a: { tiles: [3, 3] },
  house_b: { tiles: [3, 3] },
  house_c: { tiles: [4, 4] },
  granary: { tiles: [3, 3] },
  // Halls.
  inn: { tiles: [6.5, 3.5] },
  teahouse: { tiles: [6.5, 3.3] },
  yamen: { tiles: [5.5, 4] },
  palace: { tiles: [7, 6] },
  temple: { tiles: [6, 5] },
  pagoda: { tiles: [3, 3] },
  mansion: { tiles: [6, 5] },
  escort: { tiles: [6, 5] },
  ruined_temple: { tiles: [5, 4] },
  pavilion: { tiles: [2, 2] },
  // The city wall: straight pieces along u, a gate with a passage, corner towers.
  wall: { tiles: [6, 0.85] },
  // The passage runs through the gate along v, under the arch in the middle of its u side.
  gate: { tiles: [4, 2], solid: [[0, 0, 0.3, 1], [0.7, 0, 1, 1]] },
  tower: { tiles: [2, 2] },
  // Water.
  bridge: { tiles: [4.5, 1.5], solid: WALK },
  dock: { tiles: [4, 2], solid: WALK },
  // Bow to the lower left: lies along v (flip it for water running along u).
  boat: { tiles: [1.2, 3] },
  pond: { tiles: [3, 2] },
  // Market.
  stall_fruit: { tiles: [2, 1.2] },
  stall_food: { tiles: [2, 1.3] },
  stall_pottery: { tiles: [1.4, 1.8] },
  stall_cloth: { tiles: [1.6, 1.7] },
  umbrella_table: { tiles: [1.2, 1.2] },
  well: { tiles: [1, 1] },
  bench: { tiles: [0.5, 2] },
  cart: { tiles: [1, 1.6] },
  barrels: { tiles: [1, 1] },
  haystack: { tiles: [1, 1] },
  notice_board: { tiles: [1, 0.3] },
  // Fences and garden walls.
  fence: { tiles: [2.5, 0.25] },
  garden_wall: { tiles: [5, 0.7], solid: [[0, 0, 0.4, 1], [0.6, 0, 1, 1]] },
  // Lights and decoration.
  // The post stands at 0.3 of the art; its lantern hangs on the arm to the right.
  lantern_post: { tiles: [0.4, 0.4], width: 44, shift: 0.2, solid: WALK, lamps: [[0.75, 0.35]] },
  // Strung along v (flip it to run along u).
  lantern_line: { tiles: [0.3, 3], solid: WALK, lamps: [[0.3, 0.45], [0.5, 0.4], [0.7, 0.3]] },
  flag_line: { tiles: [3, 0.3], solid: WALK },
  banner_pole: { tiles: [0.4, 0.4], width: 48, shift: 0.17 },
  stone_lantern: { tiles: [0.6, 0.6], width: 44, lamps: [[0.5, 0.35]] },
  stone_lion: { tiles: [0.7, 0.7], width: 52 },
  flower_pots: { tiles: [1, 1] },
  laundry: { tiles: [2, 0.4], solid: WALK },
  rocks: { tiles: [1.5, 1.5] },
  planter_tree: { tiles: [1, 1], width: 80 },
  // Trees (shared with the earlier three-quarter set: they read the same from any side).
  tree_pine: { ...TREE, width: 150 },
  tree_willow: { ...TREE, width: 170 },
  tree_plum: { ...TREE, width: 150 },
  tree_maple: { ...TREE, width: 160 },
  bamboo: { ...TREE, width: 140 },
};

/** Processed images are this many pixels per world unit. */
export const COMPOSED_PX_PER_UNIT = 2;
/** A 512 px ground texture covers this many (unprojected) world units. */
export const COMPOSED_GROUND_TILE_UNITS = 64;

/** Sprite width in world units: as defined, else the footprint diamond plus a little eave overhang. */
export const assetWidth = (def: ComposedAssetDef) => def.width ?? (def.tiles[0] + def.tiles[1]) * ISO_TILE_W / 2 * 1.08;

export interface ComposedAssetGeometry extends ComposedAssetDef {
  id: string;
  width: number;
  height: number;
  /** Where the footprint's bottom corner sits, as a fraction of the height. */
  groundAt: number;
}

/** The world size of an asset, from its definition and the processed image's aspect. */
export function composedAsset(id: string): ComposedAssetGeometry | undefined {
  const def = COMPOSED_ASSETS[id];
  const pixels = COMPOSED_ASSET_PIXELS[id];
  if (!def || !pixels) return undefined;
  const width = assetWidth(def);
  return { ...def, id, width, height: width * pixels[1] / pixels[0], groundAt: def.ground ?? 0.98 };
}
