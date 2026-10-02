import type { ComposedPresentation } from "./types";
import { composedActorDepth, composedLamps, composedMapFor, composedSprites, isoSize, isoToWorld } from "../world/data/composed";

const cache = new Map<string, ComposedPresentation>();

/** Render data for an asset-built location map ("composed:<id>"), or undefined for a painting. */
export function composedPresentation(image: string): ComposedPresentation | undefined {
  const map = composedMapFor(image);
  if (!map) return undefined;
  const cached = cache.get(map.id);
  if (cached) return cached;
  const presentation: ComposedPresentation = {
    ...isoSize(map),
    columns: map.columns,
    rows: map.rows,
    toWorld: (u, v) => isoToWorld(map, u, v),
    base: map.base,
    ground: map.ground,
    sprites: composedSprites(map).map(({ src, left, top, width, height, depth, flip }) => ({ src, left, top, width, height, depth, flip })),
    lamps: composedLamps(map),
    actorDepth: composedActorDepth(map),
  };
  cache.set(map.id, presentation);
  return presentation;
}
