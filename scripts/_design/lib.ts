// Scratch helpers for designing a map's placements in code (preview only).
import sharp from "sharp";
import { readFileSync } from "fs";
import type { AssetEntry, AssetManifest, Placement, PlacementsFile } from "@/lib/assets/types";
import { kitSets, paintKit, cellLine, placeKitSpecial, kitAnchor } from "@/lib/assets/kits";
import { placementsGeometry, byDepth, placementGeometry } from "@/lib/assets/placement-geometry";
import { getLocationMap } from "@/lib/world/data/location-maps";
import { mapAnchors, placementIssues } from "@/lib/stage/map-anchors";
import { groundImageKey } from "@/lib/assets/catalog";

export const manifest = JSON.parse(readFileSync("public/assets/manifest.json", "utf8")) as AssetManifest;
export const index = new Map(manifest.assets.map((a) => [a.id, a] as const));
export const kits = kitSets(manifest.assets);

export class Design {
  list: Placement[] = [];
  n = 0;
  constructor(public mapId: string, public groundTile: string) {}
  id = () => `p_${String(++this.n).padStart(6, "0")}`;
  add(asset: string, x: number, y: number, extra: Partial<Placement> = {}) {
    if (!index.has(asset)) throw new Error("unknown asset " + asset);
    const p: Placement = { id: this.id(), asset, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, ...extra };
    this.list.push(p);
    return p;
  }
  kitLine(set: string, pts: [number, number][]) {
    const k = kits.get(set)!;
    if (!k) throw new Error("no kit " + set);
    for (let i = 1; i < pts.length; i++) this.list = paintKit(this.list, index, k, cellLine({ col: pts[i - 1][0], row: pts[i - 1][1] }, { col: pts[i][0], row: pts[i][1] }), false, this.id).placements;
  }
  kitErase(set: string, cells: [number, number][]) {
    this.list = paintKit(this.list, index, kits.get(set)!, cells.map(([col, row]) => ({ col, row })), true, this.id).placements;
  }
  gate(set: string, col: number, row: number) {
    const k = kits.get(set)!;
    this.list = placeKitSpecial(this.list, index, k, k.specials[0], col, row, this.id()).placements;
  }
  /** Iso: paint every cell (a, b) in the given ranges where `keep` holds. */
  isoFill(set: string, a0: number, a1: number, b0: number, b1: number, keep: (a: number, b: number) => boolean) {
    const cells: { col: number; row: number }[] = [];
    for (let a = a0; a <= a1; a++) for (let b = b0; b <= b1; b++) if (keep(a, b)) cells.push({ col: a, row: b });
    this.list = paintKit(this.list, index, kits.get(set)!, cells, false, this.id).placements;
  }
  /** Iso gate: the set's gate along axis a (`gate_se`) or b (`gate_sw`), first cell (a, b). */
  isoGate(set: string, axis: "a" | "b", a: number, b: number) {
    const k = kits.get(set)!;
    const g = k.specials.find((s) => s.id.endsWith(axis === "a" ? "_gate_se" : "_gate_sw"))!;
    this.list = placeKitSpecial(this.list, index, k, g, a, b, this.id()).placements;
  }
  /** Wang-paint: `upper(i, j)` says whether map vertex (32i, 32j) is the tileset's upper terrain. */
  wang(set: string, upper: (i: number, j: number) => boolean) {
    const tiles = manifest.assets.filter((a) => a.tile?.set === set);
    const key = (c: Record<string, string>) => `${c.NW}${c.NE}${c.SW}${c.SE}`;
    const byCorners = new Map(tiles.map((t) => [key(t.tile!.corners), t] as const));
    for (let r = 0; r < 20; r++) for (let c = 0; c < 30; c++) {
      const v = (i: number, j: number) => upper(i, j) ? "upper" : "lower";
      const corners = { NW: v(c, r), NE: v(c + 1, r), SW: v(c, r + 1), SE: v(c + 1, r + 1) };
      if (Object.values(corners).every((x) => x === "lower")) continue;
      const t = byCorners.get(key(corners));
      if (!t) throw new Error("no tile " + key(corners));
      this.add(t.id, c * 32 + 16, (r + 1) * 32);
    }
  }
  file(): PlacementsFile { return { version: 1, maps: { [this.mapId]: this.list }, grounds: { [this.mapId]: { tile: this.groundTile } } }; }
  check() {
    const map = getLocationMap(this.mapId)!;
    return placementIssues(this.mapId, { ...map, image: groundImageKey(this.groundTile) }, placementsGeometry(this.list, index));
  }
  async render(out: string, opts: { markers?: boolean; footprints?: boolean; scale?: number } = {}) {
    const g = index.get(this.groundTile)!;
    const W = 960, H = 640, S = opts.scale ?? 2;
    const tile = await sharp("public" + g.image).resize(g.mapWidth, g.mapHeight, { kernel: "nearest" }).toBuffer();
    const layers: sharp.OverlayOptions[] = [];
    for (let y = 0; y < H; y += g.mapHeight) for (let x = 0; x < W; x += g.mapWidth) layers.push({ input: tile, left: x, top: y });
    const geo = byDepth(placementsGeometry(this.list, index));
    const cache = new Map<string, Buffer>();
    const markers = opts.markers ? mapAnchors(getLocationMap(this.mapId)!, this.mapId) : [];
    type Item = { depth: number; layer: () => Promise<sharp.OverlayOptions[]> };
    const items: Item[] = geo.map((p) => ({ depth: p.depth, layer: async () => {
      const k = `${p.image}|${Math.round(p.width)}|${Math.round(p.height)}|${p.flip}`;
      if (!cache.has(k)) { let s = sharp("public" + p.image).resize(Math.max(1, Math.round(p.width)), Math.max(1, Math.round(p.height)), { kernel: "nearest" }); if (p.flip) s = s.flop(); cache.set(k, await s.png().toBuffer()); }
      return [{ input: cache.get(k)!, left: Math.round(p.box.left), top: Math.round(p.box.top) }];
    } }));
    for (const m of markers) {
      const person = m.kind === "npc" || m.kind === "spawn";
      items.push({ depth: person ? 100 + m.y * 10 : 8000, layer: async () => {
        const col = m.kind === "npc" ? "#e04040" : m.kind === "exit" ? "#30a0ff" : m.kind === "spawn" ? "#ffffff" : m.kind === "arrival" ? "#80c0ff" : "#ffd040";
        const svg = person
          ? `<svg width="22" height="52"><rect x="3" y="2" width="16" height="48" rx="7" fill="${col}" stroke="#000" stroke-width="2"/></svg>`
          : `<svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="${col}" stroke="#000" stroke-width="2"/></svg>`;
        return [{ input: Buffer.from(svg), left: Math.round(m.x - (person ? 11 : 7)), top: Math.round(m.y - (person ? 52 : 7)) }];
      } });
    }
    items.sort((a, b) => a.depth - b.depth);
    for (const it of items) layers.push(...await it.layer());
    if (opts.footprints) {
      const rects = placementsGeometry(this.list, index).filter((p) => p.blocks).flatMap((p) => p.solids);
      const svg = `<svg width="${W}" height="${H}">${rects.map((r) => `<rect x="${r.left}" y="${r.top}" width="${r.right - r.left}" height="${r.bottom - r.top}" fill="rgba(255,0,0,0.25)" stroke="red"/>`).join("")}</svg>`;
      layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
    }
    const safe = layers.filter((l) => (l.left as number) > -400 && (l.top as number) > -400 && (l.left as number) < W && (l.top as number) < H);
    // sharp can't composite overlays that stick out: crop each to the canvas.
    const fixed: sharp.OverlayOptions[] = [];
    for (const l of safe) {
      const meta = await sharp(l.input as Buffer | string).metadata();
      let left = l.left as number, top = l.top as number, w = meta.width!, h = meta.height!;
      const cx = Math.max(0, -left), cy = Math.max(0, -top);
      const cw = Math.min(w - cx, W - Math.max(0, left)), ch = Math.min(h - cy, H - Math.max(0, top));
      if (cw <= 0 || ch <= 0) continue;
      const input = cx || cy || cw < w || ch < h ? await sharp(l.input as Buffer | string).extract({ left: cx, top: cy, width: cw, height: ch }).toBuffer() : l.input;
      fixed.push({ input, left: Math.max(0, left), top: Math.max(0, top) });
    }
    const flat = await sharp({ create: { width: W, height: H, channels: 4, background: "#000" } }).composite(fixed).png().toBuffer();
    await sharp(flat).resize(W * S, H * S, { kernel: "nearest" }).png().toFile(out);
  }
}
export { placementGeometry, kitAnchor };
