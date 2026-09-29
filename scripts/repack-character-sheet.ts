/**
 * Re-pack an uneven generated character sheet into an exact equal-cell grid.
 * Run: bun scripts/repack-character-sheet.ts <in.png> <out.png> [rows=4]
 *
 * Generated sheets place poses on irregular gutters, and a raised fist or long
 * punch can cross the neighbouring row's bounding band. Pixels (alpha >= 32,
 * matching the atlas loader) are split into 8-connected components; each
 * component joins the pose whose row/column cluster contains its centre.
 * Every pose is copied pixel-for-pixel (no resampling) into its own cell,
 * horizontally centred with its lowest pixel on the shared 88 % baseline.
 */
import sharp from "sharp";

const [input, output, rowArg] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: bun scripts/repack-character-sheet.ts <in.png> <out.png> [rows]");
const rows = Number(rowArg ?? 4), columns = 4;
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const solid = (i: number) => data[i * 4 + 3] >= 32;

// 8-connected component labelling.
const label = new Int32Array(width * height).fill(-1);
const comps: { area: number; sx: number; sy: number; pixels: number[] }[] = [];
const stack: number[] = [];
for (let start = 0; start < width * height; start++) {
  if (!solid(start) || label[start] >= 0) continue;
  const id = comps.length, comp = { area: 0, sx: 0, sy: 0, pixels: [] as number[] };
  comps.push(comp); label[start] = id; stack.push(start);
  while (stack.length) {
    const p = stack.pop()!, x = p % width, y = (p - x) / width;
    comp.area++; comp.sx += x; comp.sy += y; comp.pixels.push(p);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const q = ny * width + nx;
      if (solid(q) && label[q] < 0) { label[q] = id; stack.push(q); }
    }
  }
}

/** Weighted 1-D k-means, initialised at equal divisions of `span`. */
function kmeans(values: { v: number; w: number }[], k: number, span: number): number[] {
  let centres = Array.from({ length: k }, (_, i) => ((i + 0.5) * span) / k);
  for (let iter = 0; iter < 50; iter++) {
    const sum = new Array(k).fill(0), weight = new Array(k).fill(0);
    for (const { v, w } of values) {
      const c = nearest(centres, v); sum[c] += v * w; weight[c] += w;
    }
    centres = centres.map((c, i) => (weight[i] ? sum[i] / weight[i] : c));
  }
  return centres;
}
function nearest(centres: number[], v: number) {
  let best = 0;
  for (let i = 1; i < centres.length; i++) if (Math.abs(centres[i] - v) < Math.abs(centres[best] - v)) best = i;
  return best;
}

const centred = comps.map((c) => ({ ...c, cx: c.sx / c.area, cy: c.sy / c.area }));
const rowCentres = kmeans(centred.map((c) => ({ v: c.cy, w: c.area })), rows, height);
const groups: { pixels: number[] }[] = Array.from({ length: rows * columns }, () => ({ pixels: [] }));
const owner = new Int32Array(comps.length);
for (let r = 0; r < rows; r++) {
  const inRow = centred.map((c, id) => ({ c, id })).filter(({ c }) => nearest(rowCentres, c.cy) === r);
  const colCentres = kmeans(inRow.map(({ c }) => ({ v: c.cx, w: c.area })), columns, width);
  for (const { c, id } of inRow) {
    owner[id] = r * columns + nearest(colCentres, c.cx);
    for (const p of c.pixels) groups[owner[id]].pixels.push(p);
  }
}

const boxes = groups.map(({ pixels }, index) => {
  if (!pixels.length) throw new Error(`${input}: pose ${index} is empty`);
  let l = width, r = -1, t = height, b = -1;
  for (const p of pixels) { const x = p % width, y = (p - x) / width; l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
  return { l, r, t, b, w: r - l + 1, h: b - t + 1 };
});
const pad = 16;
const cellW = Math.max(...boxes.map((b) => b.w)) + pad * 2;
// Feet sit at 88 % of the cell; the tallest pose still keeps `pad` above it.
const cellH = Math.ceil((Math.max(...boxes.map((b) => b.h)) + pad) / 0.88);
const baseline = Math.round(cellH * 0.88);
const out = Buffer.alloc(cellW * columns * cellH * rows * 4);
const outW = cellW * columns;
groups.forEach(({ pixels }, index) => {
  const box = boxes[index];
  const ox = (index % columns) * cellW + Math.round((cellW - box.w) / 2) - box.l;
  const oy = Math.floor(index / columns) * cellH + baseline - 1 - box.b;
  // Copy the whole bounding box's visible and faint pixels belonging to this pose.
  for (const p of pixels) {
    const x = p % width, y = (p - x) / width, o = ((y + oy) * outW + (x + ox)) * 4;
    data.copy(out, o, p * 4, p * 4 + 4);
  }
  // Faint (alpha < 32) antialias pixels touching this pose keep its soft edge.
  for (let y = box.t - 1; y <= box.b + 1; y++) for (let x = box.l - 1; x <= box.r + 1; x++) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (solid(p) || data[p * 4 + 3] === 0) continue;
    let owned = false;
    for (let dy = -1; dy <= 1 && !owned; dy++) for (let dx = -1; dx <= 1 && !owned; dx++) {
      const q = (y + dy) * width + (x + dx);
      if (q >= 0 && q < width * height && label[q] >= 0 && owner[label[q]] === index) owned = true;
    }
    if (owned) data.copy(out, ((y + oy) * outW + (x + ox)) * 4, p * 4, p * 4 + 4);
  }
});
await sharp(out, { raw: { width: outW, height: cellH * rows, channels: 4 } }).png().toFile(output);
console.log(JSON.stringify({ input, output, components: comps.length, cell: [cellW, cellH], size: [outW, cellH * rows],
  poses: boxes.map((b) => [b.w, b.h]) }));
