import { CHARACTER_CLIPS, CHARACTER_FEET_Y, CHARACTER_FRAME_SIZE, CHARACTER_GRID, CHARACTER_SHEET_LAYOUTS, CHARACTER_DIRECTION_LAYOUTS, characterDirectionSheet, characterSheet, characterWalk8Sheet, hasDirectionalSheet, hasWalk8Sheet, type CharacterClip, type CharacterClips, type CharacterId, type CharacterSheetLayout } from "./catalog";
import { getPlSheet, type PlSheet } from "./pl-sheets";
import { applyWalkBeat, WALK_BEATS } from "./walk-cycle";
import { DEFAULT_WALK8, type Walk8Cells } from "./walk8";

export interface CharacterAtlas {
  image: HTMLCanvasElement; frameSize: number; feetY: number; columns: number; rows: number; directional: boolean;
  /** The atlas carries the eight-direction walk cells (`walk8Cells`, lib/characters/walk8.ts). */
  walk8: boolean;
  walk8Cells: Walk8Cells | null;
  /** A standing figure's height in atlas px (the hero action cells scale to it, lib/characters/hero-actions.ts). */
  figure: number;
  /** Frames and rates per motion. */
  clips: CharacterClips;
  /** Standing in battle, when it differs from the map's idle (a PixelLab sheet's side-facing breathing). */
  battleIdle?: CharacterClip;
  /**
   * A PixelLab sheet at its native pixels (lib/characters/pl-sheets.ts): its figure is not the
   * rigged sheets' 108 px, so renderers scale it by `figureScale`, and the map keeps its colours.
   */
  native: boolean;
}
/** The standing height every rigged atlas is normalised to; renderers size figures against it. */
export const ATLAS_FIGURE = 108;
/** How much larger a cell must be drawn so this atlas's figure stands as tall as a rigged one's. */
export function figureScale(atlas: Pick<CharacterAtlas, "native" | "figure" | "frameSize">): number {
  return atlas.native ? atlas.frameSize / CHARACTER_FRAME_SIZE * ATLAS_FIGURE / atlas.figure : 1;
}
/** Painted walk8 cells keep their authored placement: feet on this row of each 128 px cell. */
const WALK8_SOURCE_FEET = 119;
const atlases = new Map<string, Promise<CharacterAtlas>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Cannot load character artwork: ${src}`));
    image.src = src;
  });
}

/** Source cells are separate from the regular 128px cells in the output atlas. */
export function characterSourceCells(width: number, height: number, rows: number, layout?: CharacterSheetLayout) {
  if (layout && (layout.width !== width || layout.height !== height || layout.rows.length !== rows + 1)) {
    throw new Error(`Character source layout does not match ${width}×${height}/${rows} rows`);
  }
  const defaultXEdges = layout?.columns ?? Array.from({ length: CHARACTER_GRID + 1 }, (_, column) => Math.round(column * width / CHARACTER_GRID));
  const yEdges = layout?.rows ?? Array.from({ length: rows + 1 }, (_, row) => Math.round(row * height / rows));
  return Array.from({ length: CHARACTER_GRID * rows }, (_, index) => {
    const column = index % CHARACTER_GRID, row = Math.floor(index / CHARACTER_GRID);
    const xEdges = layout?.rowColumns?.[row] ?? defaultXEdges;
    const regions = layout?.regions?.[index]?.map(([x, y, width, height]) => ({ x, y, width, height })) ??
      [{ x: xEdges[column], y: yEdges[row], width: xEdges[column + 1] - xEdges[column], height: yEdges[row + 1] - yEdges[row] }];
    const x = Math.min(...regions.map((region) => region.x)), y = Math.min(...regions.map((region) => region.y));
    return { x, y, width: Math.max(...regions.map((region) => region.x + region.width)) - x,
      height: Math.max(...regions.map((region) => region.y + region.height)) - y, regions };
  });
}

function measureFrames(source: HTMLImageElement, rows: number, layout?: CharacterSheetLayout) {
  const scratch = document.createElement("canvas");
  scratch.width = source.width; scratch.height = source.height;
  const context = scratch.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Character texture canvas is unavailable");
  context.drawImage(source, 0, 0);
  return characterSourceCells(source.width, source.height, rows, layout).map(({ regions }, index) => {
    let left = source.width, right = -1, top = source.height, bottom = -1;
    for (const region of regions) {
      const pixels = context.getImageData(region.x, region.y, region.width, region.height).data;
      for (let p = 3; p < pixels.length; p += 4) {
        if (pixels[p] < 32) continue;
        const px = region.x + (p - 3) / 4 % region.width, py = region.y + Math.floor((p - 3) / 4 / region.width);
        left = Math.min(left, px); right = Math.max(right, px);
        top = Math.min(top, py); bottom = Math.max(bottom, py);
      }
    }
    if (right < left || bottom < top) throw new Error(`Empty character frame: ${source.src}/${index}`);
    return { source, x: left, y: top, width: right - left + 1, height: bottom - top + 1, regions };
  });
}
// Copy-then-sort rather than toSorted(): Safari < 16 / Chrome < 110 lack it and
// every character atlas (so the whole map) would fail to load there.
function median(values: number[]) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; }

/** A PixelLab sheet is already packed on its grid: draw it once and take its clips. */
async function preparePlAtlas(sheet: PlSheet): Promise<CharacterAtlas> {
  const source = await loadImage(sheet.url);
  const image = document.createElement("canvas");
  image.width = source.width; image.height = source.height;
  const context = image.getContext("2d");
  if (!context) throw new Error("Character atlas canvas is unavailable");
  context.drawImage(source, 0, 0);
  return { image, frameSize: sheet.cell, feetY: sheet.feetY, columns: sheet.columns, rows: sheet.rows, directional: true,
    walk8: true, walk8Cells: sheet.walk8, figure: sheet.figure, clips: sheet.clips, battleIdle: sheet.battleIdle, native: true };
}

/** Normalize padding and scale per source sheet, preserving pose variation and original PNGs. */
async function prepareAtlas(id: CharacterId, directional: boolean): Promise<CharacterAtlas> {
  const walk8 = directional && hasWalk8Sheet(id);
  const [source, directionSource, walk8Source] = await Promise.all([
    loadImage(characterSheet(id)),
    directional ? loadImage(characterDirectionSheet(id)) : Promise.resolve(null),
    // A missing walk8 sheet only costs the eight-way walk, never the character.
    walk8 ? loadImage(characterWalk8Sheet(id)).catch(() => null) : Promise.resolve(null),
  ]);
  const base = measureFrames(source, 4, CHARACTER_SHEET_LAYOUTS[id]);
  const directions = directionSource ? measureFrames(directionSource, 2, CHARACTER_DIRECTION_LAYOUTS[id]) : [];
  const baseHeight = median(base.slice(0, 12).map((frame) => frame.height));
  // Different exports can have different source resolution. Calibrate each sheet
  // once; never resize each pose separately, which makes walking visibly pulse.
  const directionRatio = directions.length ? baseHeight / median(directions.map((frame) => frame.height)) : 1;
  // Walk8 cells are drawn whole (their figures are already placed on a shared
  // foot line and centred on the torso); their bounds only calibrate the size.
  const walk8Bounds = walk8Source ? measureFrames(walk8Source, 7) : [];
  const walk8Ratio = walk8Bounds.length ? baseHeight / median(walk8Bounds.slice(20, 25).map((frame) => frame.height)) : 1;
  const walk8Cells = walk8Bounds.map((_, index) => {
    const x = index % CHARACTER_GRID * CHARACTER_FRAME_SIZE, y = Math.floor(index / CHARACTER_GRID) * CHARACTER_FRAME_SIZE;
    const cell = { x, y, width: CHARACTER_FRAME_SIZE, height: CHARACTER_FRAME_SIZE };
    return { source: walk8Source!, ...cell, regions: [cell], ratio: walk8Ratio, feet: y + WALK8_SOURCE_FEET };
  });
  const measured = [...base.map((frame) => ({ ...frame, ratio: 1 })),
    ...directions.map((frame) => ({ ...frame, ratio: directionRatio })),
    ...walk8Bounds.map((frame) => ({ ...frame, ratio: walk8Ratio }))];
  const frames: (typeof measured[number] & { feet?: number })[] = [...measured.slice(0, base.length + directions.length), ...walk8Cells];
  const scale = Math.min(108 / baseHeight,
    118 / Math.max(...measured.map((frame) => frame.width * frame.ratio)),
    116 / Math.max(...measured.map((frame) => frame.height * frame.ratio)));
  const image = document.createElement("canvas");
  const rows = directional ? (walk8Cells.length ? 13 : 6) : 4;
  image.width = CHARACTER_FRAME_SIZE * CHARACTER_GRID;
  image.height = CHARACTER_FRAME_SIZE * rows;
  const output = image.getContext("2d");
  if (!output) throw new Error("Character atlas canvas is unavailable");
  output.imageSmoothingEnabled = false;
  frames.forEach((frame, index) => {
    const width = Math.round(frame.width * frame.ratio * scale);
    const height = Math.round(frame.height * frame.ratio * scale);
    const x = index % CHARACTER_GRID * CHARACTER_FRAME_SIZE;
    const y = Math.floor(index / CHARACTER_GRID) * CHARACTER_FRAME_SIZE;
    // The frame's foot row lands on the shared baseline (a measured pose's feet are its bottom edge).
    const feet = (frame.feet ?? frame.y + frame.height) - frame.y;
    const targetX = x + Math.round((CHARACTER_FRAME_SIZE - width) / 2), targetY = y + CHARACTER_FEET_Y - Math.round(feet * height / frame.height);
    // Several source gutters bend around a complete raised hand or extended
    // punch. Clip only to the authored regions, then draw once with one common
    // transform, so pieces retain their original alignment without raster seams.
    output.save();
    output.beginPath();
    for (const region of frame.regions) {
      const left = Math.max(region.x, frame.x), top = Math.max(region.y, frame.y);
      const right = Math.min(region.x + region.width, frame.x + frame.width);
      const bottom = Math.min(region.y + region.height, frame.y + frame.height);
      if (right <= left || bottom <= top) continue;
      output.rect(targetX + (left - frame.x) * width / frame.width, targetY + (top - frame.y) * height / frame.height,
        (right - left) * width / frame.width, (bottom - top) * height / frame.height);
    }
    output.clip();
    output.drawImage(frame.source, frame.x, frame.y, frame.width, frame.height, targetX, targetY, width, height);
    output.restore();
  });
  // Give every walk clip a clear left-foot / right-foot beat.
  const pixels = output.getImageData(0, 0, image.width, image.height);
  const walkCells = [4, 5, 6, 7, ...(directional ? [16, 17, 18, 19, 20, 21, 22, 23] : [])];
  for (const index of walkCells) {
    applyWalkBeat(pixels.data, image.width, { x: index % CHARACTER_GRID * CHARACTER_FRAME_SIZE,
      y: Math.floor(index / CHARACTER_GRID) * CHARACTER_FRAME_SIZE, size: CHARACTER_FRAME_SIZE, feetY: CHARACTER_FEET_Y },
    WALK_BEATS[index % 4]);
  }
  output.putImageData(pixels, 0, 0);
  return { image, frameSize: CHARACTER_FRAME_SIZE, feetY: CHARACTER_FEET_Y, columns: CHARACTER_GRID, rows, directional, walk8: walk8Cells.length > 0,
    walk8Cells: walk8Cells.length > 0 ? DEFAULT_WALK8 : null, figure: baseHeight * scale, clips: CHARACTER_CLIPS, native: false };
}

export function loadCharacterAtlas(id: CharacterId, includeDirections = true): Promise<CharacterAtlas> {
  const pl = getPlSheet(id);
  if (pl) {
    const key = `${id}:pl`;
    const cached = atlases.get(key);
    if (cached) return cached;
    // A PixelLab sheet that fails to load falls back to the rigged sheet of the same id.
    const pending = preparePlAtlas(pl).catch(() => { atlases.delete(key); return prepareAtlas(id, includeDirections && hasDirectionalSheet(id)); });
    atlases.set(key, pending);
    return pending;
  }
  const directional = includeDirections && hasDirectionalSheet(id);
  const key = `${id}:${directional ? "full" : "base"}`;
  const cached = atlases.get(key);
  if (cached) return cached;
  const pending = prepareAtlas(id, directional).catch((error) => { atlases.delete(key); throw error; });
  atlases.set(key, pending);
  return pending;
}
