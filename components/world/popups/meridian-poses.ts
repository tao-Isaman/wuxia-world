// ชีพจร — the training poses of the meridian screen's silhouette. Pure data and
// geometry (no React): each pose is a skeleton in a 240 × 320 box; the body
// is drawn from it as tapered limbs, a torso, a robe and flowing ribbons, and
// every MeridianBodyPoint is placed from the same joints, so a point always
// sits on the body whatever the pose.
//
// "l_" / "r_" are the figure's own left / right: the figure faces the viewer,
// so its left side is on the viewer's right (larger x).

import type { MeridianBodyPoint, MeridianKind } from "@/lib/game/meridian-types";

export type Pt = readonly [number, number];

export const POSE_BOX = { w: 240, h: 320 } as const;

interface Joints {
  head: Pt; neck: Pt;
  rsh: Pt; lsh: Pt; rel: Pt; lel: Pt; rwr: Pt; lwr: Pt; rha: Pt; lha: Pt;
  pelvis: Pt; rhip: Pt; lhip: Pt; rkn: Pt; lkn: Pt; ran: Pt; lan: Pt; rft: Pt; lft: Pt;
}

export type PoseId = "horse" | "lotus" | "crane" | "palm" | "sky";

export interface MeridianPose {
  id: PoseId;
  /** Thai name of the training pose, shown under the figure. */
  name: string;
  j: Joints;
  /** Seated poses wrap the legs in a lap of robe instead of a skirt. */
  seated?: boolean;
  /** Which way the wind blows the ribbons (−1 left, 1 right). */
  wind: -1 | 1;
  /** Per-pose nudges of a body point (viewBox units). */
  nudge?: Partial<Record<MeridianBodyPoint, Pt>>;
}

export const MERIDIAN_POSES: Record<PoseId, MeridianPose> = {
  // ท่าม้า — wide horse stance, both palms pushing out to the sides.
  horse: {
    id: "horse", name: "ท่าม้าผลักภูผา", wind: 1,
    j: {
      head: [120, 44], neck: [120, 68],
      rsh: [94, 78], lsh: [146, 78], rel: [64, 96], lel: [176, 96], rwr: [36, 92], lwr: [204, 92], rha: [26, 82], lha: [214, 82],
      pelvis: [120, 168], rhip: [105, 166], lhip: [135, 166], rkn: [70, 214], lkn: [170, 214],
      ran: [74, 274], lan: [166, 274], rft: [56, 286], lft: [184, 286],
    },
  },
  // ท่านั่งสมาธิ — seated lotus, hands resting on the knees.
  lotus: {
    id: "lotus", name: "ท่านั่งสมาธิดอกบัว", seated: true, wind: -1,
    j: {
      head: [120, 82], neck: [120, 106],
      rsh: [92, 116], lsh: [148, 116], rel: [74, 164], lel: [166, 164], rwr: [66, 212], lwr: [174, 212], rha: [62, 228], lha: [178, 228],
      pelvis: [120, 214], rhip: [102, 216], lhip: [138, 216], rkn: [44, 256], lkn: [196, 256],
      ran: [142, 254], lan: [98, 264], rft: [164, 244], lft: [76, 256],
    },
    nudge: { r_sole: [-2, -4], l_sole: [2, -2], tailbone: [0, 4] },
  },
  // ท่ากระเรียน — crane on one leg, wings spread.
  crane: {
    id: "crane", name: "ท่ากระเรียนกางปีก", wind: -1,
    j: {
      head: [118, 42], neck: [119, 66],
      rsh: [93, 76], lsh: [145, 76], rel: [62, 56], lel: [178, 92], rwr: [40, 30], lwr: [206, 110], rha: [32, 18], lha: [218, 118],
      pelvis: [120, 164], rhip: [106, 163], lhip: [134, 163], rkn: [110, 226], lkn: [168, 150],
      ran: [112, 288], lan: [150, 210], rft: [96, 298], lft: [148, 226],
    },
  },
  // ท่าผลักฝ่ามือ — bow stance, one palm thrust up and out, the other fist at the waist.
  palm: {
    id: "palm", name: "ท่าธนูผลักฝ่ามือ", wind: 1,
    j: {
      head: [114, 44], neck: [116, 67],
      rsh: [90, 78], lsh: [142, 76], rel: [62, 70], lel: [168, 116], rwr: [38, 52], lwr: [150, 142], rha: [28, 42], lha: [140, 146],
      pelvis: [120, 168], rhip: [106, 167], lhip: [134, 167], rkn: [76, 214], lkn: [164, 226],
      ran: [76, 278], lan: [196, 282], rft: [58, 288], lft: [214, 292],
    },
  },
  // ท่าประคองฟ้า — standing, both palms raised to hold up the sky.
  sky: {
    id: "sky", name: "ท่าสองมือประคองฟ้า", wind: 1,
    j: {
      head: [120, 70], neck: [120, 93],
      rsh: [95, 103], lsh: [145, 103], rel: [70, 62], lel: [170, 62], rwr: [94, 26], lwr: [146, 26], rha: [108, 16], lha: [132, 16],
      pelvis: [120, 190], rhip: [107, 189], lhip: [133, 189], rkn: [100, 244], lkn: [140, 244],
      ran: [98, 296], lan: [142, 296], rft: [84, 306], lft: [156, 306],
    },
    nudge: { r_palm: [-3, 0], l_palm: [3, 0] },
  },
};

const POSES_BY_KIND: Record<MeridianKind, PoseId[]> = {
  base: ["lotus", "sky"],
  combat: ["horse", "palm"],
  ability: ["crane", "horse"],
  buff: ["sky", "lotus"],
};

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The pose a chart is drawn in: by its kind, varied by its id. */
export function poseForChart(chart: { id: string; kind: MeridianKind }): MeridianPose {
  const list = POSES_BY_KIND[chart.kind] ?? POSES_BY_KIND.base;
  return MERIDIAN_POSES[list[hash(chart.id) % list.length]];
}

// ─── vector helpers ────────────────────────────────────────────────────
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const r1 = (n: number) => Math.round(n * 10) / 10;
const fmt = (p: Pt) => `${r1(p[0])} ${r1(p[1])}`;

/** Points on the body that face away from the viewer (drawn as hollow rings). */
export const BACK_POINTS: ReadonlySet<MeridianBodyPoint> = new Set(["nape", "upper_back", "lower_back", "tailbone"]);

/** Where each of the 28 body points sits for a pose (viewBox units). */
export function poseBodyPoints(pose: MeridianPose): Record<MeridianBodyPoint, Pt> {
  const j = pose.j;
  const spine = (t: number): Pt => lerp(j.neck, j.pelvis, t);
  // The figure's left (viewer's right) side of the chest.
  const side = j.lsh[0] > j.rsh[0] ? 1 : -1;
  const back = 11;
  const sole = (an: Pt, ft: Pt): Pt => pose.seated ? lerp(an, ft, 0.55) : add(lerp(an, ft, 0.45), [0, 6]);
  const points: Record<MeridianBodyPoint, Pt> = {
    // Front points run down the centre line; the back points (hollow rings)
    // sit a little to the side so they never hide a front one.
    crown: add(j.head, [0, -17]),
    brow: add(j.head, [0, -2]),
    nape: add(lerp(j.head, j.neck, 0.55), [-back, 0]),
    throat: add(j.neck, [0, 1]),
    upper_back: add(spine(0.09), [-back - 2, 0]),
    chest: spine(0.21),
    heart: add(spine(0.31), [side * 11, 0]),
    solar: spine(0.44),
    lower_back: add(spine(0.55), [-back - 2, 0]),
    navel: spine(0.645),
    dantian: spine(0.82),
    tailbone: add(j.pelvis, [-back + 4, 9]),
    r_shoulder: j.rsh, l_shoulder: j.lsh,
    r_elbow: j.rel, l_elbow: j.lel,
    r_wrist: lerp(j.rwr, j.rel, 0.12), l_wrist: lerp(j.lwr, j.lel, 0.12),
    r_palm: j.rha, l_palm: j.lha,
    r_hip: j.rhip, l_hip: j.lhip,
    r_knee: j.rkn, l_knee: j.lkn,
    r_ankle: j.ran, l_ankle: j.lan,
    r_sole: sole(j.ran, j.rft), l_sole: sole(j.lan, j.lft),
  };
  for (const [k, d] of Object.entries(pose.nudge ?? {}) as [MeridianBodyPoint, Pt][]) points[k] = add(points[k], d);
  return points;
}

// ─── silhouette ─────────────────────────────────────────────────────────

/** A limb: a tapered quad with round caps, as one closed path. */
function limb(a: Pt, b: Pt, wa: number, wb: number): string {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const ra = wa / 2, rb = wb / 2;
  const a1: Pt = [a[0] + nx * ra, a[1] + ny * ra], a2: Pt = [a[0] - nx * ra, a[1] - ny * ra];
  const b1: Pt = [b[0] + nx * rb, b[1] + ny * rb], b2: Pt = [b[0] - nx * rb, b[1] - ny * rb];
  return `M${fmt(a1)} L${fmt(b1)} A${r1(rb)} ${r1(rb)} 0 0 0 ${fmt(b2)} L${fmt(a2)} A${r1(ra)} ${r1(ra)} 0 0 0 ${fmt(a1)}Z`;
}

/** A smooth closed shape through the points (Catmull-Rom → cubic Bézier). */
function blob(points: readonly Pt[], tension = 0.5): string {
  const n = points.length;
  let d = `M${fmt(points[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return `${d}Z`;
}

/** An open smooth curve (for ribbons drawn as strokes). */
function curve(points: readonly Pt[]): string {
  let d = `M${fmt(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
}

/** A ribbon: a tapering band along a curve (closed path). */
function ribbon(points: readonly Pt[], w0: number, w1: number): string {
  const left: Pt[] = [], right: Pt[] = [];
  points.forEach((p, i) => {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (points.length - 1))) / 2;
    left.push([p[0] - (dy / len) * w, p[1] + (dx / len) * w]);
    right.push([p[0] + (dy / len) * w, p[1] - (dx / len) * w]);
  });
  return blob([...left, ...right.reverse()], 0.35);
}

export interface SilhouetteParts {
  /** Filled shapes (the whole body). */
  fills: string[];
  /** Thin flowing strokes (hair ribbons), drawn with the stroke width given. */
  strokes: { d: string; w: number }[];
}

/** The body of a pose as SVG paths, all to be filled in one ink colour. */
export function silhouetteParts(pose: MeridianPose): SilhouetteParts {
  const j = pose.j;
  const wind = pose.wind;
  const fills: string[] = [];
  const strokes: { d: string; w: number }[] = [];
  void curve;

  // Hair: a top-knot, a long tail and a ribbon streaming in the wind.
  const knot = add(j.head, [0, -18]);
  fills.push(`M${fmt(add(knot, [-7, 1]))} a7 6 0 1 1 14 0 a7 6 0 1 1 -14 0Z`);
  fills.push(ribbon([add(knot, [wind * 2, 2]), add(knot, [wind * 14, 4]), add(knot, [wind * 24, 14]), add(knot, [wind * 30, 32]), add(knot, [wind * 38, 50])], 9, 1.5));
  fills.push(ribbon([add(knot, [wind * 4, -2]), add(knot, [wind * 16, -6]), add(knot, [wind * 28, -2]), add(knot, [wind * 40, 4]), add(knot, [wind * 50, 2])], 3.6, 1));
  fills.push(ribbon([add(knot, [wind * 4, 0]), add(knot, [wind * 14, 4]), add(knot, [wind * 26, 10]), add(knot, [wind * 34, 20])], 3, 0.8));
  // Head and neck.
  fills.push(`M${fmt(add(j.head, [-13.5, 0]))} a13.5 16 0 1 1 27 0 a13.5 16 0 1 1 -27 0Z`);
  fills.push(limb(add(j.head, [0, 8]), j.neck, 12, 15));

  // Torso: shoulders broad, a full chest, the waist drawn in, the hips under the robe.
  const waistR = lerp(j.rsh, j.rhip, 0.66), waistL = lerp(j.lsh, j.lhip, 0.66);
  const chestR = lerp(j.rsh, j.rhip, 0.28), chestL = lerp(j.lsh, j.lhip, 0.28);
  fills.push(blob([
    add(j.neck, [-7, -3]), add(j.rsh, [2, -8]), add(j.rsh, [-8, -2]), add(j.rsh, [-9, 8]), add(chestR, [-3, 0]),
    add(waistR, [5, 0]), add(j.rhip, [-8, 0]), add(j.pelvis, [0, 8]), add(j.lhip, [8, 0]),
    add(waistL, [-5, 0]), add(chestL, [3, 0]), add(j.lsh, [9, 8]), add(j.lsh, [8, -2]), add(j.lsh, [-2, -8]), add(j.neck, [7, -3]),
  ], 0.55));
  // Arms with wide sleeves hanging from the forearm.
  for (const [sh, el, wr, ha] of [[j.rsh, j.rel, j.rwr, j.rha], [j.lsh, j.lel, j.lwr, j.lha]] as const) {
    fills.push(limb(sh, el, 19, 14));
    fills.push(limb(el, wr, 14, 10));
    fills.push(limb(wr, ha, 10, 8));
    fills.push(`M${fmt(add(ha, [-5.5, 0]))} a5.5 6 0 1 1 11 0 a5.5 6 0 1 1 -11 0Z`);
    const drop = 14;
    const cuff = lerp(el, wr, 0.92);
    fills.push(blob([lerp(sh, el, 0.75), add(el, [0, 3]), cuff, add(lerp(el, wr, 0.82), [wind * 3, drop + 4]), add(lerp(el, wr, 0.45), [0, drop])], 0.5));
  }

  if (pose.seated) {
    // Lap of robe over folded legs; the feet rest on the thighs.
    fills.push(blob([
      add(j.rhip, [-8, -2]), add(lerp(j.rhip, j.rkn, 0.6), [-2, -8]), add(j.rkn, [-10, 2]), add(j.rkn, [-2, 14]), add(lerp(j.rkn, j.lkn, 0.5), [0, 20]),
      add(j.lkn, [2, 14]), add(j.lkn, [10, 2]), add(lerp(j.lhip, j.lkn, 0.6), [2, -8]), add(j.lhip, [8, -2]),
    ], 0.55));
    for (const [hp, kn, an, ft] of [[j.rhip, j.rkn, j.ran, j.rft], [j.lhip, j.lkn, j.lan, j.lft]] as const) {
      fills.push(limb(hp, kn, 26, 20));
      fills.push(limb(kn, an, 18, 13));
      fills.push(limb(an, ft, 12, 9));
    }
    // A cushion under the lap.
    fills.push(blob([[40, 272], [120, 266], [200, 272], [206, 284], [120, 292], [34, 284]], 0.5));
  } else {
    // Legs in loose trousers, then the robe skirt over the thighs.
    for (const [hp, kn, an, ft] of [[j.rhip, j.rkn, j.ran, j.rft], [j.lhip, j.lkn, j.lan, j.lft]] as const) {
      fills.push(limb(hp, kn, 26, 20));
      fills.push(limb(kn, lerp(kn, an, 0.7), 20, 17));
      fills.push(limb(lerp(kn, an, 0.6), an, 15, 11));
      fills.push(limb(an, ft, 11, 8));
      fills.push(blob([add(an, [-6, 2]), add(ft, [0, -3]), add(ft, [2, 3]), add(an, [-2, 8])], 0.5));
    }
    // Robe panels: coat tails falling from the waist past the knees, flaring out.
    for (const [hp, kn, sgn] of [[j.rhip, j.rkn, -1], [j.lhip, j.lkn, 1]] as const) {
      // A raised knee (the crane) leaves its tail hanging from the hip.
      const hem = kn[1] < hp[1] + 24 ? add(hp, [sgn * 6, 50]) : lerp(hp, kn, 1.12);
      const flare = sgn === wind ? 10 : 4;
      fills.push(blob([
        add(j.pelvis, [sgn * 4, -18]), add(hp, [sgn * 11, -16]), add(hp, [sgn * 14, 4]), add(hem, [sgn * (14 + flare), 4]),
        add(hem, [sgn * (8 + flare), 14]), add(hem, [-sgn * 4, 8]), add(lerp(j.pelvis, hem, 0.5), [-sgn * 2, 4]), add(j.pelvis, [0, 4]),
      ], 0.5));
    }
    // The front flap between the legs, swinging with the wind.
    const flapTop = add(j.pelvis, [0, -8]);
    fills.push(blob([add(flapTop, [-9, 0]), add(flapTop, [9, 0]), add(j.pelvis, [wind * 8 + 6, 48]), add(j.pelvis, [wind * 12, 58]), add(j.pelvis, [wind * 8 - 6, 48])], 0.5));
  }

  // Sash: a belt and two tails streaming in the wind.
  const belt = lerp(j.neck, j.pelvis, 0.8);
  fills.push(limb(add(belt, [-22, 0]), add(belt, [22, 0]), 9, 9));
  const tie: Pt = add(belt, [-wind * 6, 2]);
  fills.push(ribbon([tie, add(tie, [-wind * 14, 10]), add(tie, [-wind * 26, 16]), add(tie, [-wind * 40, 18]), add(tie, [-wind * 54, 26])], 7, 2));
  fills.push(ribbon([tie, add(tie, [-wind * 10, 16]), add(tie, [-wind * 22, 28]), add(tie, [-wind * 34, 34]), add(tie, [-wind * 44, 46])], 6, 1.5));

  return { fills, strokes };
}
