/**
 * Contact sheets for reviewing generated assets (docs/assets.md).
 *
 *   bun scripts/assets/contact-sheet.ts <out.png> [--cell 96] [--cols 12] [--labels a,b,…] <image …>
 *   bun scripts/assets/contact-sheet.ts <out.png> --list <file listing "path<TAB>label" per line>
 *
 * Each image is scaled (nearest neighbour) into a square cell on a neutral
 * green-grey ground, with its label (default: its index) in the corner.
 */
import { readFileSync } from "fs";
import sharp from "sharp";

export interface SheetItem { path: string; label: string }

export async function contactSheet(out: string, items: SheetItem[], cell = 96, cols = 12): Promise<void> {
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const pad = 4, label = 12;
  const W = cols * (cell + pad) + pad, H = rows * (cell + pad + label) + pad;
  const composites: sharp.OverlayOptions[] = [];
  for (const [i, item] of items.entries()) {
    const x = pad + (i % cols) * (cell + pad), y = pad + Math.floor(i / cols) * (cell + pad + label);
    try {
      const meta = await sharp(item.path).metadata();
      const scale = Math.min(cell / (meta.width ?? cell), cell / (meta.height ?? cell));
      const w = Math.max(1, Math.round((meta.width ?? cell) * scale)), h = Math.max(1, Math.round((meta.height ?? cell) * scale));
      const input = await sharp(item.path).resize(w, h, { kernel: "nearest" }).png().toBuffer();
      composites.push({ input, left: x + Math.floor((cell - w) / 2), top: y + Math.floor((cell - h) / 2) });
    } catch { /* unreadable: leave the cell empty */ }
    const text = item.label.replace(/[<&>]/g, "").slice(0, Math.floor(cell / 5.2));
    composites.push({ input: Buffer.from(`<svg width="${cell}" height="${label}"><text x="1" y="10" font-size="10" font-family="monospace" fill="#fff">${text}</text></svg>`), left: x, top: y + cell });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: "#6f7f6f" } }).composite(composites).png().toFile(out);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const out = args.shift();
  if (!out) throw new Error("usage: contact-sheet.ts <out.png> [--cell N] [--cols N] [--list file] <images…>");
  let cell = 96, cols = 12, labels: string[] = [];
  const items: SheetItem[] = [];
  while (args.length) {
    const a = args.shift()!;
    if (a === "--cell") cell = Number(args.shift());
    else if (a === "--cols") cols = Number(args.shift());
    else if (a === "--labels") labels = args.shift()!.split(",");
    else if (a === "--list") for (const line of readFileSync(args.shift()!, "utf8").split("\n").filter(Boolean)) {
      const [path, label] = line.split("\t");
      items.push({ path, label: label ?? String(items.length) });
    } else items.push({ path: a, label: "" });
  }
  items.forEach((item, i) => { if (!item.label) item.label = labels[i] ?? String(i); });
  await contactSheet(out, items, cell, cols);
  console.log(`${out}: ${items.length} images`);
}
