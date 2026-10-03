/**
 * World coordinates: where each place sits on the world map, for compass
 * directions (exits on location maps, route paintings, arrival sides).
 *   bun scripts/build-world-coords.ts            # rewrite lib/world/data/world-coords.ts
 *   bun scripts/build-world-coords.ts --check    # fail when the file is stale
 *
 * A seeded force layout: every region pulls its places toward its compass
 * anchor (north up, east right), a few places of the wild jianghu are pinned
 * near their Jin Yong geography, and each road is a spring.
 *
 * Places already on the map keep their spot: the location paintings' exits
 * and road directions are drawn against it, and a fresh layout moves
 * everything. Only a new place is positioned — at its laid-out spot, carried
 * into the current map's frame by its neighbours already placed.
 *   bun scripts/build-world-coords.ts --relayout   # recompute every spot (repaint exits after!)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { SCENES } from "../lib/world/data/scenes";
import { LOCATION_ROUTES } from "../lib/world/data/location-routes";
import { LAYOUT_REGION } from "../lib/world/data/regions";

const OUT = "lib/world/data/world-coords.ts";
export const WORLD_W = 1500, WORLD_H = 1000;

const ANCHOR: Record<string, [number, number]> = {
  heartland: [0, 0], north: [0, -1], south: [0.05, 1], west: [-1.25, 0.05], east: [1.25, 0],
};
// Wild places with a known place in the novels' geography.
const HINT: Record<string, [number, number]> = {
  sect_wudu: [-0.7, 0.9], market_miao: [-0.8, 1], pool_heilong: [-0.55, 1.05], sect_xingxiu: [-1.4, -0.8],
  sea_xingxiu: [-1.55, -0.95], city_lingxiao: [-1.1, -0.9], cliff_heimu: [0.6, -0.7], mt_tiezhang: [-0.3, 0.8],
  isle_wane: [1.4, 1], isle_boni: [1.5, 1.15], isle_wuming: [1.6, 0.6], sect_beggars: [0.3, 0.35],
  valley_jueqing: [-0.55, -0.25], valley_jueqing_bottom: [-0.6, -0.1], valley_baihua: [-0.2, 0.55],
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutWorld(): Record<string, { x: number; y: number }> {
  const rand = mulberry32(7);
  const ids = new Set(SCENES.filter((s) => s.kind === "location").map((s) => s.id));
  const roads = LOCATION_ROUTES.filter((r) => ids.has(r.a) && ids.has(r.b));
  const linked = [...new Set(roads.flatMap((r) => [r.a, r.b]))].sort();
  const index = new Map(linked.map((id, i) => [id, i]));
  const edges = roads.map((r) => [index.get(r.a)!, index.get(r.b)!] as const);
  const anchor = (id: string) => HINT[id] ?? ANCHOR[LAYOUT_REGION[id] ?? ""];
  const pos = linked.map((id) => {
    const a = anchor(id) ?? [rand() * 2 - 1, rand() * 2 - 1];
    return [a[0] + (rand() - 0.5) * 0.5, a[1] + (rand() - 0.5) * 0.5];
  });
  const n = linked.length, k = 0.16;
  let temp = 0.1;
  for (let it = 0; it < 1500; it++) {
    const disp = pos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1];
      const d2 = dx * dx + dy * dy + 1e-6, d = Math.sqrt(d2);
      let f = (k * k / d2) * 0.9;
      if (d < 0.11) f += (0.11 - d) * 4;
      disp[i][0] += dx / d * f; disp[i][1] += dy / d * f; disp[j][0] -= dx / d * f; disp[j][1] -= dy / d * f;
    }
    for (const [a, b] of edges) {
      const dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1], d = Math.hypot(dx, dy) + 1e-6, f = (d - k) * 1.2;
      disp[a][0] -= dx / d * f; disp[a][1] -= dy / d * f; disp[b][0] += dx / d * f; disp[b][1] += dy / d * f;
    }
    linked.forEach((id, i) => {
      const a = anchor(id); if (!a) return;
      const w = HINT[id] ? 0.35 : 0.25;
      disp[i][0] += (a[0] - pos[i][0]) * w; disp[i][1] += (a[1] - pos[i][1]) * w;
    });
    for (let i = 0; i < n; i++) {
      const d = Math.hypot(disp[i][0], disp[i][1]) + 1e-9, s = Math.min(d, temp);
      pos[i][0] += disp[i][0] / d * s; pos[i][1] += disp[i][1] / d * s;
    }
    temp = Math.max(0.002, temp * 0.997);
  }
  const xs = pos.map((p) => p[0]), ys = pos.map((p) => p[1]), m = 90;
  const sx = (WORLD_W - 2 * m) / (Math.max(...xs) - Math.min(...xs)), sy = (WORLD_H - 2 * m) / (Math.max(...ys) - Math.min(...ys));
  return Object.fromEntries(linked.map((id, i) => [id, {
    x: Math.round(m + (pos[i][0] - Math.min(...xs)) * sx), y: Math.round(m + (pos[i][1] - Math.min(...ys)) * sy),
  }]));
}

// The spots already on the map (empty with --relayout).
function existing(): Record<string, { x: number; y: number }> {
  if (process.argv.includes("--relayout")) return {};
  const found: Record<string, { x: number; y: number }> = {};
  try {
    for (const m of readFileSync(OUT, "utf8").matchAll(/^  (\w+): \{ x: (-?\d+), y: (-?\d+) \},$/gm)) found[m[1]] = { x: Number(m[2]), y: Number(m[3]) };
  } catch { /* first run */ }
  return found;
}

function stableCoords(): Record<string, { x: number; y: number }> {
  const fresh = layoutWorld();
  const kept = existing();
  const out: Record<string, { x: number; y: number }> = {};
  const fresher: string[] = [];
  for (const id of Object.keys(fresh)) (kept[id] ? (out[id] = kept[id]) : fresher.push(id));
  // A new place keeps its offset from the placed places it is closest to in the fresh layout.
  for (const id of fresher) {
    const near = Object.keys(out).sort((a, b) => Math.hypot(fresh[a].x - fresh[id].x, fresh[a].y - fresh[id].y) - Math.hypot(fresh[b].x - fresh[id].x, fresh[b].y - fresh[id].y)).slice(0, 3);
    const dx = near.reduce((sum, n) => sum + out[n].x - fresh[n].x, 0) / Math.max(1, near.length);
    const dy = near.reduce((sum, n) => sum + out[n].y - fresh[n].y, 0) / Math.max(1, near.length);
    out[id] = { x: Math.round(fresh[id].x + dx), y: Math.round(fresh[id].y + dy) };
  }
  return Object.fromEntries(Object.keys(fresh).map((id) => [id, out[id]]));
}

const coords = stableCoords();
const body = `// Generated by scripts/build-world-coords.ts — do not edit by hand; rerun it
// after adding a place or a road. Positions on a ${WORLD_W} × ${WORLD_H} world map
// (x east, y south). Only places joined by roads are placed.

export const WORLD_MAP_SIZE = { width: ${WORLD_W}, height: ${WORLD_H} } as const;

export const WORLD_COORDS: Readonly<Record<string, { x: number; y: number }>> = {
${Object.entries(coords).map(([id, p]) => `  ${id}: { x: ${p.x}, y: ${p.y} },`).join("\n")}
};
`;
if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  if (current !== body) { console.error(`${OUT} is stale — run bun scripts/build-world-coords.ts`); process.exit(1); }
  console.log(`${OUT} is current (${Object.keys(coords).length} places)`);
} else {
  writeFileSync(OUT, body);
  console.log(`wrote ${Object.keys(coords).length} places to ${OUT}`);
}
