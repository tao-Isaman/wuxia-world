// Outfits as recolours of a hero's own sheet (docs/design/appearance.md).
// Pure: it reads and writes RGBA pixels, so the browser runs it on a sheet's
// canvas when it loads (lib/characters/sheet.ts) and the tests on plain arrays.
//
// Each hero's clothing is two colour classes read from its pixels (HLS): the
// coloured robe (`primary`) and the light cloth under it (`secondary`). An
// outfit gives each class a target [hue °, saturation, lightness]; a pixel
// keeps its shading (its saturation scales with how far it sits from the
// class's reference, its lightness moves by its offset from it). Skin, hair,
// belts and outlines fall in no class; the head (the top 17 % of each figure)
// is left alone so hair highlights and ribbons keep their colour.

export type Hsl = readonly [number, number, number];

export interface RecolorTint {
  primary: Hsl;
  secondary?: Hsl;
}

type ClothClass = "primary" | "secondary";

interface ClothRule {
  /** Which class a source colour (h in 0–360, l and s in 0–1) belongs to, or null. */
  classify: (h: number, l: number, s: number) => ClothClass | null;
  /** The class's typical saturation and lightness in the source sheet. */
  reference: Record<ClothClass, { s: number; l: number }>;
}

/** The two heroes' cloth (see the design doc's table). */
export const HERO_CLOTH: Readonly<Record<string, ClothRule>> = {
  m1: {
    classify: (h, l, s) => (h >= 170 && h <= 260 && s >= 0.06 && l >= 0.08 ? "primary" : s < 0.12 && l >= 0.55 ? "secondary" : null),
    reference: { primary: { s: 0.25, l: 0.35 }, secondary: { s: 0.03, l: 0.75 } },
  },
  f1: {
    classify: (h, l, s) => (h >= 40 && h <= 190 && s >= 0.03 && l >= 0.15 && l < 0.97 ? "primary" : s < 0.03 && l >= 0.55 ? "secondary" : null),
    reference: { primary: { s: 0.09, l: 0.55 }, secondary: { s: 0, l: 0.78 } },
  },
};

/** The share of a figure's height, from its top, that is the head (never recoloured). */
export const HEAD_SHARE = 0.17;

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, l, 0];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return [h * 60, l, s];
}

export function hslToRgb(h: number, l: number, s: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const hn = h / 360;
  return [Math.round(hue(hn + 1 / 3) * 255), Math.round(hue(hn) * 255), Math.round(hue(hn - 1 / 3) * 255)];
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** One source colour in the outfit's colours, or null when it is not cloth. */
export function recolorColor(rule: ClothRule, tint: RecolorTint, r: number, g: number, b: number): [number, number, number] | null {
  const [h, l, s] = rgbToHsl(r, g, b);
  const cls = rule.classify(h, l, s);
  const target = cls === "primary" ? tint.primary : cls === "secondary" ? tint.secondary : undefined;
  if (!cls || !target) return null;
  const ref = rule.reference[cls];
  const [th, ts, tl] = target;
  const ns = ref.s > 0 ? clamp01(ts * Math.max(0.4, Math.min(1.6, s / ref.s))) : ts;
  const nl = clamp01(tl + (l - ref.l));
  return hslToRgb(th, nl, ns);
}

/**
 * Recolour a sheet in place: `data` is its RGBA pixels (`width` × `height`),
 * laid out in square cells of `cell` px. Returns how many pixels changed.
 */
export function recolorSheet(data: Uint8ClampedArray, width: number, height: number, cell: number, hero: string, tint: RecolorTint): number {
  const rule = HERO_CLOTH[hero];
  if (!rule) return 0;
  const cache = new Map<number, number>();
  let changed = 0;
  for (let cy = 0; cy < height; cy += cell) {
    for (let cx = 0; cx < width; cx += cell) {
      // The figure's top in this cell: the head above HEAD_SHARE of its height stays.
      let top = -1, bottom = -1;
      for (let y = cy; y < Math.min(height, cy + cell); y++) {
        for (let x = cx; x < Math.min(width, cx + cell); x++) {
          if (data[(y * width + x) * 4 + 3] > 10) { if (top < 0) top = y; bottom = y; break; }
        }
      }
      if (top < 0) continue;
      const from = top + Math.floor(HEAD_SHARE * (bottom - top));
      for (let y = from; y <= bottom; y++) {
        for (let x = cx; x < Math.min(width, cx + cell); x++) {
          const i = (y * width + x) * 4;
          if (data[i + 3] <= 10) continue;
          const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
          let out = cache.get(key);
          if (out === undefined) {
            const rgb = recolorColor(rule, tint, data[i], data[i + 1], data[i + 2]);
            out = rgb ? (rgb[0] << 16) | (rgb[1] << 8) | rgb[2] : -1;
            cache.set(key, out);
          }
          if (out < 0) continue;
          data[i] = (out >> 16) & 255; data[i + 1] = (out >> 8) & 255; data[i + 2] = out & 255;
          changed++;
        }
      }
    }
  }
  return changed;
}

export interface FrameBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Each cell's opaque box (cell-relative px; null for an empty cell), row by row. */
export function frameBoxes(data: Uint8ClampedArray, width: number, height: number, cell: number): (FrameBox | null)[] {
  const boxes: (FrameBox | null)[] = [];
  for (let cy = 0; cy + cell <= height; cy += cell) {
    for (let cx = 0; cx + cell <= width; cx += cell) {
      let left = cell, top = cell, right = -1, bottom = -1;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          if (data[((cy + y) * width + cx + x) * 4 + 3] <= 10) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          bottom = y;
        }
      }
      boxes.push(right < 0 ? null : { left, top, right, bottom });
    }
  }
  return boxes;
}
