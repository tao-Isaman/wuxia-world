// Regional colour grades for the road paintings, applied to the pixels once
// when a road map loads (world-runtime), so 56 base paintings serve every
// region. Pure: works on any RGBA byte array (canvas ImageData or sharp raw).

type Op =
  | { t: "matrix"; m: readonly [number, number, number, number, number, number, number, number, number] }
  | { t: "linear"; a: readonly [number, number, number]; b: readonly [number, number, number] }
  | { t: "saturate"; s: number }
  | { t: "bright"; k: number };

const hue = (deg: number): Extract<Op, { t: "matrix" }> => {
  // The CSS hue-rotate matrix.
  const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  return { t: "matrix", m: [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ] };
};

/** Region → grade. Heartland keeps the painting as it is. */
export const ROUTE_GRADES: Readonly<Record<string, readonly Op[]>> = {
  // Frost highlands: cooled, desaturated, lifted toward snow light.
  north: [{ t: "matrix", m: [0.62, 0.26, 0.12, 0.22, 0.64, 0.14, 0.2, 0.26, 0.64] }, { t: "linear", a: [0.92, 0.95, 1.04], b: [26, 28, 40] }, { t: "saturate", s: 0.8 }],
  // Western desert: ochre sand, sun-bleached greens.
  west: [{ t: "matrix", m: [1.12, 0.22, 0, 0.24, 0.8, 0, 0.08, 0.22, 0.42] }, { t: "linear", a: [1, 0.98, 0.95], b: [18, 10, 0] }, { t: "saturate", s: 0.8 }],
  // Lush humid south: deeper, greener, richer.
  south: [{ t: "matrix", m: [0.82, 0.08, 0.06, 0.04, 1.02, 0.08, 0, 0.12, 1.02] }, { t: "saturate", s: 1.3 }, { t: "bright", k: 0.9 }, hue(10)],
  // Misty eastern coast at dawn: soft contrast, rose-teal haze.
  east: [{ t: "linear", a: [0.8, 0.8, 0.84], b: [44, 36, 44] }, { t: "matrix", m: [1.02, 0, 0.02, 0, 0.98, 0.04, 0.02, 0.04, 1.02] }, { t: "saturate", s: 0.9 }],
  // Wild jianghu: dusk — cool violet shadow, the road lit by the last light.
  jianghu_wild: [{ t: "linear", a: [0.66, 0.66, 0.86], b: [4, 6, 24] }, { t: "saturate", s: 0.82 }],
};

/** Collapse a grade into one 3×4 affine colour transform (all ops are affine). */
function compile(ops: readonly Op[]): number[] {
  // Rows: [r g b 1] → r', g', b'.
  let t = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  const apply = (m: number[]) => {
    // m is 3×4 acting on [r g b 1]; new = m ∘ t.
    const out = new Array(12).fill(0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) out[i * 4 + j] = m[i * 4] * t[j] + m[i * 4 + 1] * t[4 + j] + m[i * 4 + 2] * t[8 + j] + (j === 3 ? m[i * 4 + 3] : 0);
    }
    t = out;
  };
  for (const op of ops) {
    switch (op.t) {
      case "matrix": apply([op.m[0], op.m[1], op.m[2], 0, op.m[3], op.m[4], op.m[5], 0, op.m[6], op.m[7], op.m[8], 0]); break;
      case "linear": apply([op.a[0], 0, 0, op.b[0], 0, op.a[1], 0, op.b[1], 0, 0, op.a[2], op.b[2]]); break;
      case "bright": apply([op.k, 0, 0, 0, 0, op.k, 0, 0, 0, 0, op.k, 0]); break;
      case "saturate": {
        // Lerp toward Rec. 709 luma.
        const s = op.s, lr = 0.2126 * (1 - s), lg = 0.7152 * (1 - s), lb = 0.0722 * (1 - s);
        apply([lr + s, lg, lb, 0, lr, lg + s, lb, 0, lr, lg, lb + s, 0]);
        break;
      }
    }
  }
  return t;
}

const compiled = new Map<string, number[]>();

/** Grade RGBA pixels in place for a region; unknown regions are left as they are. */
export function gradePixels(data: Uint8ClampedArray | Uint8Array, region: string | undefined, channels = 4): void {
  if (!region || !ROUTE_GRADES[region]) return;
  let t = compiled.get(region);
  if (!t) { t = compile(ROUTE_GRADES[region]); compiled.set(region, t); }
  const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = clamp(t[0] * r + t[1] * g + t[2] * b + t[3]);
    data[i + 1] = clamp(t[4] * r + t[5] * g + t[6] * b + t[7]);
    data[i + 2] = clamp(t[8] * r + t[9] * g + t[10] * b + t[11]);
  }
}
