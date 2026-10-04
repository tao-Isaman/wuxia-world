import sharp from "sharp";
import { readFileSync } from "fs";
import type { AssetManifest } from "@/lib/assets/types";
const m = JSON.parse(readFileSync("public/assets/manifest.json", "utf8")) as AssetManifest;
const pick = m.assets.filter((a) => a.category === "building" && (a.region === "heartland" || a.id.includes("landmark")));
const cell = 150, cols = 12;
const layers: sharp.OverlayOptions[] = [];
for (const [i, a] of pick.entries()) {
  const img = await sharp("public" + a.image).resize(cell - 6, cell - 22, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  layers.push({ input: img, left: (i % cols) * cell + 3, top: Math.floor(i / cols) * cell + 3 });
  const svg = `<svg width="${cell}" height="18"><text x="2" y="13" font-size="12" fill="#fff">${i} ${a.subcategory}</text></svg>`;
  layers.push({ input: Buffer.from(svg), left: (i % cols) * cell, top: Math.floor(i / cols) * cell + cell - 18 });
  console.log(i, a.id, a.mapWidth, Math.round(a.mapHeight), JSON.stringify(a.footprint));
}
await sharp({ create: { width: cols * cell, height: Math.ceil(pick.length / cols) * cell, channels: 4, background: "#556b44" } }).composite(layers).png().toFile(process.argv[2]);
