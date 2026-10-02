import type { ComposedPresentation } from "./types";
import { composedLamps, composedMapFor, composedSprites } from "../world/data/composed";

const cache = new Map<string, ComposedPresentation>();

/** Render data for an asset-built location map ("composed:<id>"), or undefined for a painting. */
export function composedPresentation(image: string): ComposedPresentation | undefined {
  const map = composedMapFor(image);
  if (!map) return undefined;
  const cached = cache.get(map.id);
  if (cached) return cached;
  const presentation: ComposedPresentation = {
    width: map.width,
    height: map.height,
    base: map.base,
    ground: map.ground,
    sprites: composedSprites(map).map(({ src, left, top, width, height, depthY, flip }) => ({ src, left, top, width, height, depthY, flip })),
    lamps: composedLamps(map),
  };
  cache.set(map.id, presentation);
  return presentation;
}
