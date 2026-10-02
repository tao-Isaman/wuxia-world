// Shared by the art import scripts: remove a flat painting background.
import sharp from "sharp";

const TOLERANCE = 34, POCKET_TOLERANCE = 10;

/**
 * Cut a painted figure out of its flat background: a flood fill from the border
 * removes every pixel close to the border colour that touches it, flat pockets
 * enclosed by the figure (40+ px of near-exact background) go too, and the
 * outermost ring of the figure is softened. Returns a PNG with alpha.
 */
export interface CutOutOptions {
  /** Max colour distance (0–255) for an enclosed pocket to count as background; 0 keeps every pocket. */
  pocketTolerance?: number;
  /** Smallest pocket (in pixels) that is removed. */
  pocketMin?: number;
}

export async function cutOut(path: string, options: CutOutOptions = {}): Promise<Buffer> {
  const pocketTolerance = options.pocketTolerance ?? POCKET_TOLERANCE, pocketMin = options.pocketMin ?? 40;
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Background colour: the median of the border pixels.
  const border: number[][] = [];
  for (let x = 0; x < w; x += 4) for (const y of [0, h - 1]) border.push([...data.subarray((y * w + x) * 4, (y * w + x) * 4 + 3)]);
  for (let y = 0; y < h; y += 4) for (const x of [0, w - 1]) border.push([...data.subarray((y * w + x) * 4, (y * w + x) * 4 + 3)]);
  const bg = [0, 1, 2].map((c) => border.map((p) => p[c]).sort((a, b) => a - b)[border.length >> 1]);
  const dist = (i: number) => Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
  const isBg = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop()!;
    if (isBg[p] || dist(p * 4) > TOLERANCE) continue;
    isBg[p] = 1;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Pockets of flat background enclosed by the figure (between an arm and the
  // body, inside a coiled whip): near-exact background colour, 40+ pixels.
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (isBg[start] || seen[start] || dist(start * 4) > pocketTolerance) continue;
    const pocket: number[] = [];
    stack.push(start); seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      pocket.push(p);
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !seen[q] && !isBg[q] && dist(q * 4) <= pocketTolerance) { seen[q] = 1; stack.push(q); }
      }
    }
    if (pocketTolerance > 0 && pocket.length >= pocketMin) for (const p of pocket) isBg[p] = 1;
  }
  for (let p = 0; p < w * h; p++) {
    if (isBg[p]) { data[p * 4 + 3] = 0; continue; }
    // Soften the outermost ring of the figure against the removed background.
    const x = p % w, y = (p / w) | 0;
    const edge = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
    if (edge) data[p * 4 + 3] = Math.min(255, Math.round(80 + dist(p * 4) * 4));
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}
