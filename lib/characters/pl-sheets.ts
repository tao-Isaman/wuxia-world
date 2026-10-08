// PixelLab character sheets: people drawn and animated by PixelLab (style B,
// docs/assets.md#pixellab-characters) instead of rigged from a painted body.
// Each is one PNG at /art/characters/pl/<id>.png — square cells on a grid,
// every frame at its native pixels with the feet on one row — packed by
// scripts/build-pixellab-sheets.ts, which also rewrites pl-sheets-data.ts.
// lib/characters/sheet.ts turns a sheet into a CharacterAtlas whose clips and
// eight-way walk come from here, so the map, battle and cutscene renderers
// play the longer PixelLab clips without knowing where they came from.

import type { CharacterClip, CharacterMotion } from "./catalog";
import { PL_SHEET_DATA } from "./pl-sheets-data";
import type { Walk8Direction } from "./walk8";

export interface PlSheet {
  id: string;
  /** /art/characters/pl/<id>.png with a ?v= content hash. */
  url: string;
  /** One square cell's size, in px. */
  cell: number;
  columns: number;
  rows: number;
  /** The feet row inside a cell, in px. */
  feetY: number;
  /** A standing figure's height, in px (the renderers scale it to the usual figure). */
  figure: number;
  clips: Record<CharacterMotion, CharacterClip>;
  /** Standing in battle: the side-facing breathing (the map's idle faces the viewer). */
  battleIdle?: CharacterClip;
  /** The eight-way walk: four steps or more per painted direction, and the standing poses. */
  walk8: { walk: Record<Walk8Direction, readonly number[]>; stand: Record<Walk8Direction, number>; fps: number };
}

export const PL_SHEETS: Readonly<Record<string, PlSheet>> = PL_SHEET_DATA;

export function getPlSheet(id: string | null | undefined): PlSheet | null {
  return (id && PL_SHEETS[id]) || null;
}
