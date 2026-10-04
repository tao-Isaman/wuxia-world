/**
 * The game asset library (images under public/assets/, listed in
 * public/assets/manifest.json) and the objects placed on maps
 * (public/assets/placements.json). Both are fetched at runtime (only when
 * needed), never bundled: the library runs to thousands of entries.
 *
 * This file is the contract between the asset pipeline (scripts/assets/),
 * the engine (/game/engine) and the game runtime. Serializable data only:
 * safe for React, Phaser and pure tests. See docs/assets.md.
 */

/** The five world regions an asset belongs to (lib/world/data/regions.ts), or "any". */
export const ASSET_REGIONS = ["heartland", "east", "south", "north", "west", "any"] as const;
export type AssetRegion = typeof ASSET_REGIONS[number];

/** Top-level categories: the library's tabs. */
export const ASSET_CATEGORIES = [
  "building",   // houses, shops, inns, temples, towers, bridges, gates, halls
  "prop",       // town / village / interior objects: stalls, carts, barrels, lanterns, furniture
  "sect",       // a sect's signature set: banners, statues, dummies, weapon racks, altars
  "nature",     // trees, bushes, rocks, flowers, bamboo, water plants
  "tile",       // ground tiles from top-down tilesets
  "icon",       // item / equipment / material icons
  "character",  // NPC bodies (8 directions, optional walk)
  "monster",    // beasts, demons, ghosts and foe types (8 directions, optional attack)
  "fx",         // effect sprites
  "ui",         // frames, buttons, badges
] as const;
export type AssetCategory = typeof ASSET_CATEGORIES[number];

/** Eight map directions, as the character sprites use them. */
export const ASSET_DIRECTIONS = ["S", "SE", "E", "NE", "N", "NW", "W", "SW"] as const;
export type AssetDirection = typeof ASSET_DIRECTIONS[number];

export type AssetStatus = "draft" | "approved" | "rejected";

/** A box on the ground, in map units relative to the asset's anchor (its base centre). */
export interface Footprint { x: number; y: number; w: number; h: number }

export interface AssetEntry {
  /** Stable id: `<category prefix>_<region|sect|group>_<name>[_nn]`, lowercase snake case (e.g. `bld_east_teahouse_02`). */
  id: string;
  /** Thai display name. */
  name: string;
  category: AssetCategory;
  /** Free-form second level, e.g. "shop", "house", "stall", "tree", "herb", "weapon". */
  subcategory: string;
  region: AssetRegion;
  /** A SectId when the asset belongs to one sect (category "sect"). */
  sect?: string;
  /** Search words, Thai or English. */
  tags: string[];
  /** Public URL of the default image (the S view for 8-direction assets), e.g. `/assets/building/east/bld_east_teahouse_02.png`. */
  image: string;
  /** Image size in px. */
  width: number;
  height: number;
  /**
   * Display size on a map in map units (960 × 640 maps; a standing person is ~52
   * units tall). The engine scales `image` to this; placements may scale further.
   */
  mapWidth: number;
  mapHeight: number;
  /** Anchor in image px (base centre): sorts depth against characters and pins the footprint. */
  anchorX: number;
  anchorY: number;
  /** Ground the hero cannot walk through, or null for walk-through decoration. */
  footprint: Footprint | null;
  /** Default layer when placed: "ground" (always under characters), "object" (depth-sorted), "overhead" (always over). */
  layer: "ground" | "object" | "overhead";
  /** Whether a left-right mirror still looks right (most props: yes; signs with text: no). */
  flippable: boolean;
  /** 8-direction assets: one image per direction, keyed by direction. */
  views?: Partial<Record<AssetDirection, string>>;
  /** Animations: name → frame URLs (or one sheet URL + frame count). */
  animations?: Record<string, { frames: string[]; fps: number; directions?: AssetDirection[] }>;
  /** Groups near-identical designs from one prompt. */
  variantOf?: string;
  /**
   * Tiles (category "tile") only: the Wang tileset the tile belongs to and the
   * terrain at its four corners. Place the tile whose corners match the map's
   * corner vertices; adjacent tiles of one set then join seamlessly.
   */
  tile?: { set: string; corners: Record<"NW" | "NE" | "SW" | "SE", "lower" | "upper"> };
  /** How it was made, so it can be regenerated. */
  source: { tool: string; prompt: string; seed?: number; jobId?: string; size: number };
  status: AssetStatus;
}

export interface AssetManifest {
  version: 1;
  generatedAt: string;
  assets: AssetEntry[];
}

/** One object placed on a map by the engine's map editor. */
export interface Placement {
  /** Unique within the map (e.g. `p_000123`). */
  id: string;
  /** AssetEntry.id. */
  asset: string;
  /** Anchor position in map units (0–960, 0–640). */
  x: number;
  y: number;
  /** Multiplies the asset's mapWidth / mapHeight (default 1). */
  scale?: number;
  /** Mirror left-right. */
  flip?: boolean;
  /** 8-direction assets: which view. */
  dir?: AssetDirection;
  /** Overrides the asset's layer. */
  layer?: "ground" | "object" | "overhead";
  /** Overrides whether its footprint blocks walking (default: footprint !== null). */
  collide?: boolean;
}

/** Every map's placed objects, keyed by location id (public/assets/placements.json). */
export interface PlacementsFile {
  version: 1;
  maps: Record<string, Placement[]>;
}

/** Engine-edited names and descriptions laid over the skill / art tables (lib/game/data/text-overrides.json). */
export interface TextOverrides {
  version: 1;
  skills: Record<string, { n?: string; d?: string }>;
  arts: Record<string, { n?: string; d?: string }>;
}
