/**
 * Isometric kit pieces (lib/assets/kits.ts, `grid: "iso"`), drawn by casting
 * a ray per pixel through a small solid model — a band along the diamond
 * grid's axes, raised `height` (0 for a road), with optional crenellated
 * parapets or a tiled coping, minus a gate's passage. Textures are sampled
 * in grid space (one texture tile per cell), so neighbouring pieces join
 * without seams and every surface leans the 2:1 way of the library's
 * isometric buildings. Pure pixels: used by scripts/assets/build-kits.ts.
 */
import type { Footprint } from "@/lib/assets/types";
import { KIT_E, KIT_N, KIT_S, KIT_W } from "@/lib/assets/kits";

export interface Img { w: number; h: number; px: Uint8ClampedArray }

export interface IsoLook {
  /** Diamond width in map units (= px); its height is half. */
  cell: number;
  /** Half the band's width across its run, in cells (0.5 fills the cell). */
  thick: number;
  /** Face height in map units (0: a flat road or plaza). */
  height: number;
  /** City walls: merlon height along the open edges of the walkway. */
  parapet?: number;
  /** House walls: ridge height of a tiled coping over the top. */
  coping?: number;
  face: Img;
  top: Img;
  /** The coping's roof tiles (else `top`). */
  roof?: Img;
}
export interface IsoGate {
  /** The axis the wall runs along: "a" (down-right) or "b" (down-left). */
  axis: "a" | "b";
  shape: "arch" | "door" | "moon" | "gap";
  /** Passage width in map units. */
  width: number;
}
export interface IsoPiece {
  /** Joins of the piece's run (N up-right, E down-right, S down-left, W up-left). */
  mask: number;
  /** Cells along `gate.axis` (default 1). */
  span?: number;
  gate?: IsoGate;
}
export interface IsoResult { img: Img; anchorX: number; anchorY: number; solids: Footprint[] }

const SIDES = [
  { bit: KIT_N, da: 0, db: -1 }, { bit: KIT_E, da: 1, db: 0 },
  { bit: KIT_S, da: 0, db: 1 }, { bit: KIT_W, da: -1, db: 0 },
] as const;
const AXIS_LEN = Math.hypot(0.5, 0.25); // map units per cell along an axis, per unit of `cell`

export function renderIso(look: IsoLook, piece: IsoPiece): IsoResult {
  const W = look.cell, H = look.height, t = look.thick;
  const span = piece.span ?? 1;
  const axis = piece.gate?.axis ?? "a";
  // The piece's own cells and which sides each joins.
  const own = new Map<string, number>();
  const ownCells: [number, number][] = [];
  for (let i = 0; i < span; i++) ownCells.push(axis === "a" ? [i, 0] : [0, i]);
  const key = (a: number, b: number) => `${a},${b}`;
  for (const [a, b] of ownCells) {
    let conn = 0;
    for (const s of SIDES) {
      const inside = ownCells.some(([x, y]) => x === a + s.da && y === b + s.db);
      if (inside || piece.mask & s.bit) conn |= s.bit;
    }
    // Inner cells of a span join along it; the ends take the run's joins.
    own.set(key(a, b), conn);
  }
  // Neighbours across joined sides continue with their centre and the arm back.
  const conns = new Map(own);
  for (const [a, b] of ownCells) for (const s of SIDES) {
    const k = key(a + s.da, b + s.db);
    if (own.get(key(a, b))! & s.bit && !own.has(k)) conns.set(k, (conns.get(k) ?? 0) | SIDES[(SIDES.indexOf(s) + 2) % 4].bit);
  }
  const band = (A: number, B: number): boolean => {
    const ca = Math.round(A), cb = Math.round(B);
    const conn = conns.get(key(ca, cb));
    if (conn === undefined) return false;
    const fa = A - ca, fb = B - cb;
    if (t >= 0.5) return true;
    if (Math.abs(fa) <= t && Math.abs(fb) <= t) return true;
    if (conn & KIT_E && fa >= t && Math.abs(fb) <= t) return true;
    if (conn & KIT_W && fa <= -t && Math.abs(fb) <= t) return true;
    if (conn & KIT_S && fb >= t && Math.abs(fa) <= t) return true;
    if (conn & KIT_N && fb <= -t && Math.abs(fa) <= t) return true;
    return false;
  };
  const isOwn = (A: number, B: number) => own.has(key(Math.round(A), Math.round(B)));
  // Distance (cells) from a band point to the nearest open edge, capped.
  const edgeDistance = (A: number, B: number, cap: number) => {
    for (let d = 0.02; d <= cap; d += 0.02) {
      if (!band(A + d, B) || !band(A - d, B) || !band(A, B + d) || !band(A, B - d)) return d;
    }
    return cap;
  };
  // Gate passage, in map units along the run and up.
  const gate = piece.gate;
  const along0 = (span - 1) / 2;
  const passage = (A: number, B: number, h: number): boolean => {
    if (!gate) return false;
    const u = ((axis === "a" ? A : B) - along0) * W * AXIS_LEN;
    const across = Math.abs((axis === "a" ? B : A)) <= t + 0.02;
    if (!across) return false;
    const r = gate.width / 2;
    if (gate.shape === "gap") return Math.abs(u) < r;
    if (gate.shape === "door") return Math.abs(u) < r && h < H - 8;
    if (gate.shape === "moon") { const cy = r - 4; return u * u + (h - cy) * (h - cy) < r * r; }
    const spring = Math.max(r, 40 - r);
    return Math.abs(u) < r && (h < spring || u * u + (h - spring) * (h - spring) < r * r);
  };
  const roofTop = (A: number, B: number) => H + (look.coping ?? 0) * Math.min(1, edgeDistance(A, B, t) / Math.max(0.04, t));
  const solid = (A: number, B: number, h: number): boolean => {
    if (h < 0 || !band(A, B)) return false;
    if (passage(A, B, h)) return false;
    if (h <= H) return true;
    if (look.coping) return h <= roofTop(A, B);
    if (look.parapet && h <= H + look.parapet) {
      const near = 0.07;
      const openA = !band(A + near, B) || !band(A - near, B);
      const openB = !band(A, B + near) || !band(A, B - near);
      if (!openA && !openB) return false;
      const along = openB ? A : B; // merlons run along the open edge
      return ((along * 4) % 1 + 1) % 1 < 0.62;
    }
    return false;
  };
  const extra = (look.parapet ?? 0) + (look.coping ?? 0) + 1;
  // Image extent: the own cells' diamonds, raised by the wall.
  const centres = ownCells.map(([a, b]) => ({ x: (a - b) * W / 2, y: (a + b) * W / 4 }));
  const minX = Math.min(...centres.map((c) => c.x)) - W / 2, maxX = Math.max(...centres.map((c) => c.x)) + W / 2;
  const minY = Math.min(...centres.map((c) => c.y)) - W / 4 - H - extra, maxY = Math.max(...centres.map((c) => c.y)) + W / 4;
  const w = Math.round(maxX - minX), hgt = Math.round(maxY - minY);
  const ox = -minX, oy = -minY;
  const img: Img = { w, h: hgt, px: new Uint8ClampedArray(w * hgt * 4) };
  const owner = new Uint8Array(w * hgt); // 0 empty, 1 own, 2 a neighbour's
  const toGrid = (sx: number, sy: number) => ({ A: sx / W + 2 * sy / W, B: 2 * sy / W - sx / W });
  const TS = look.top.w; // texture px per cell
  const sample = (tex: Img, x: number, y: number) => {
    const xi = ((Math.floor(x) % tex.w) + tex.w) % tex.w, yi = ((Math.floor(y) % tex.h) + tex.h) % tex.h;
    const i = (yi * tex.w + xi) * 4;
    return [tex.px[i], tex.px[i + 1], tex.px[i + 2]];
  };
  const hMax = H + extra;
  for (let py = 0; py < hgt; py++) for (let px = 0; px < w; px++) {
    const sx = px + 0.5 - ox, sy = py + 0.5 - oy;
    for (let h = Math.ceil(hMax); h >= 0; h--) {
      const { A, B } = toGrid(sx, sy + h);
      if (!solid(A, B, h)) continue;
      if (!isOwn(A, B)) { owner[py * w + px] = 2; break; }
      owner[py * w + px] = 1;
      let rgb: number[], f: number;
      if (!solid(A, B, h + 1)) {
        // A top: the walkway, a merlon's cap, the coping or the road.
        if (h > H && look.coping) {
          rgb = sample(look.roof ?? look.top, A * TS, B * TS);
          const ridge = roofTop(A, B) >= H + (look.coping ?? 0) - 0.6;
          f = ridge ? 0.62 : 1.0;
        } else if (h > H) { rgb = sample(look.face, A * TS, B * TS); f = 1.08; }
        else { rgb = sample(look.top, A * TS, B * TS); f = H > 0 ? 1.04 : 1; }
      } else {
        // A face: which way it looks decides its light.
        const step = 2 / W;
        const rightFace = !solid(A + step, B, h);
        const along = rightFace ? B : A;
        const tex = h > H ? look.face : look.face;
        rgb = sample(tex, along * TS * 1.4, (H - h) + 7);
        f = (rightFace ? 0.86 : 0.66) * (0.84 + 0.16 * Math.min(1, h / Math.max(1, H)));
        if (look.coping && h > H) f *= 0.55; // the coping's eave in shadow
        if (h <= 1) f *= 0.7;
      }
      const i = (py * w + px) * 4;
      img.px[i] = rgb[0] * f; img.px[i + 1] = rgb[1] * f; img.px[i + 2] = rgb[2] * f; img.px[i + 3] = 255;
      break;
    }
  }
  // Outline where the piece meets open ground (not where a neighbour's solid goes on).
  const dark = new Uint8Array(w * hgt);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    if (owner[y * w + x] !== 1) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= hgt) continue;
      if (owner[ny * w + nx] === 0) { dark[y * w + x] = 1; break; }
    }
  }
  const edge = H > 0 ? 0.5 : 0.72;
  for (let i = 0; i < dark.length; i++) if (dark[i]) { img.px[i * 4] *= edge; img.px[i * 4 + 1] *= edge; img.px[i * 4 + 2] *= edge; }
  // Anchor: the centre of the span.
  const anchorLocal = axis === "a" ? { x: along0 * W / 2, y: along0 * W / 4 } : { x: -along0 * W / 2, y: along0 * W / 4 };
  const anchorX = ox + anchorLocal.x, anchorY = oy + anchorLocal.y;
  // Blocking ground: the band (own cells, passage open) as a staircase of 4-unit strips.
  const solids: Footprint[] = [];
  if (H > 0) {
    const STEP = 4;
    for (let y0 = Math.floor(minY + H + extra); y0 < maxY; y0 += STEP) {
      const sy = y0 + STEP / 2;
      let run: number | null = null;
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        const { A, B } = toGrid(x + 0.5, sy);
        const inside = band(A, B) && isOwn(A, B) && !passage(A, B, 0);
        if (inside && run === null) run = x;
        if ((!inside || x === Math.ceil(maxX)) && run !== null) {
          solids.push({ x: run - anchorLocal.x, y: y0 - anchorLocal.y, w: x - run, h: STEP });
          run = null;
        }
      }
    }
  }
  return { img, anchorX, anchorY, solids };
}
