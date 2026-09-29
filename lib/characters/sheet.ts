import { CHARACTER_FEET_Y, CHARACTER_FRAME_SIZE, CHARACTER_GRID, CHARACTER_SHEET_LAYOUTS, CHARACTER_DIRECTION_LAYOUTS, characterSheet, hasDirectionalSheet, type CharacterId, type CharacterSheetLayout } from "./catalog";

export interface CharacterAtlas {
  image: HTMLCanvasElement; frameSize: 128; feetY: 120; columns: 4; rows: number; directional: boolean;
}
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

/** Normalize padding and scale per source sheet, preserving pose variation and original PNGs. */
async function prepareAtlas(id: CharacterId, directional: boolean): Promise<CharacterAtlas> {
  const [source, directionSource] = await Promise.all([
    loadImage(characterSheet(id)),
    directional ? loadImage(`/art/characters/${id}-directions.png`) : Promise.resolve(null),
  ]);
  const base = measureFrames(source, 4, CHARACTER_SHEET_LAYOUTS[id]);
  const directions = directionSource ? measureFrames(directionSource, 2, CHARACTER_DIRECTION_LAYOUTS[id]) : [];
  const baseHeight = median(base.slice(0, 12).map((frame) => frame.height));
  // Different exports can have different source resolution. Calibrate each sheet
  // once; never resize each pose separately, which makes walking visibly pulse.
  const directionRatio = directions.length ? baseHeight / median(directions.map((frame) => frame.height)) : 1;
  const frames = [...base.map((frame) => ({ ...frame, ratio: 1 })),
    ...directions.map((frame) => ({ ...frame, ratio: directionRatio }))];
  const scale = Math.min(108 / baseHeight,
    118 / Math.max(...frames.map((frame) => frame.width * frame.ratio)),
    116 / Math.max(...frames.map((frame) => frame.height * frame.ratio)));
  const image = document.createElement("canvas");
  const rows = directional ? 6 : 4;
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
    const targetX = x + Math.round((CHARACTER_FRAME_SIZE - width) / 2), targetY = y + CHARACTER_FEET_Y - height;
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
  return { image, frameSize: CHARACTER_FRAME_SIZE, feetY: CHARACTER_FEET_Y, columns: CHARACTER_GRID, rows, directional };
}

export function loadCharacterAtlas(id: CharacterId, includeDirections = true): Promise<CharacterAtlas> {
  const directional = includeDirections && hasDirectionalSheet(id);
  const key = `${id}:${directional ? "full" : "base"}`;
  const cached = atlases.get(key);
  if (cached) return cached;
  const pending = prepareAtlas(id, directional).catch((error) => { atlases.delete(key); throw error; });
  atlases.set(key, pending);
  return pending;
}
