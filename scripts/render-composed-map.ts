/**
 * Render a composed map to one picture: ground, then every object sorted by
 * its ground line, the way the game draws them.
 *
 *   bun scripts/render-composed-map.ts <map id> <out.png> [--scale 0.5] [--bases] [--markers]
 *
 * --bases outlines every solid (red); --markers dots the location map's
 * NPCs (blue), exits (green) and services (yellow) and the spawn (white).
 */
import sharp from "sharp";
import { COMPOSED_MAPS, COMPOSED_PREFIX, composedFootprints, composedSprites } from "../lib/world/data/composed";
import { getLocationMap } from "../lib/world/data/location-maps";

const [id, outFile] = process.argv.slice(2);
const map = COMPOSED_MAPS[id];
if (!map || !outFile) throw new Error("usage: bun scripts/render-composed-map.ts <map id> <out.png> [--scale 0.5] [--bases] [--markers]");
const scaleArg = process.argv.indexOf("--scale");
const S = scaleArg > 0 ? Number(process.argv[scaleArg + 1]) : 0.5;
const W = Math.round(map.width * S), H = Math.round(map.height * S);

const tile = async (material: string) => {
  const size = Math.max(1, Math.round(256 * S));
  return sharp(`public/maps/composed/ground/${material}.webp`).resize(size, size).png().toBuffer();
};
const layers: sharp.OverlayOptions[] = [];
const fill = async (material: string, x: number, y: number, w: number, h: number) => {
  const t = await tile(material);
  const area = await sharp({ create: { width: Math.max(1, Math.round(w * S)), height: Math.max(1, Math.round(h * S)), channels: 4, background: "#0000" } })
    .composite([{ input: t, tile: true, left: 0, top: 0 }]).png().toBuffer();
  layers.push({ input: area, left: Math.round(x * S), top: Math.round(y * S) });
};
await fill(map.base, 0, 0, map.width, map.height);
for (const area of map.ground) await fill(area.material, area.x, area.y, area.w, area.h);
for (const sprite of composedSprites(map).sort((a, b) => a.depthY - b.depthY)) {
  let img = sharp(`public${sprite.src}`).resize(Math.max(1, Math.round(sprite.width * S)), Math.max(1, Math.round(sprite.height * S)));
  if (sprite.flip) img = img.flop();
  layers.push({ input: await img.png().toBuffer(), left: Math.round(sprite.left * S), top: Math.round(sprite.top * S) });
}
const svg: string[] = [];
if (process.argv.includes("--bases")) {
  for (const f of composedFootprints(map)) {
    svg.push(f.kind === "rect"
      ? `<rect x="${f.left * S}" y="${f.top * S}" width="${(f.right - f.left) * S}" height="${(f.bottom - f.top) * S}" fill="rgba(255,0,0,0.18)" stroke="red" stroke-width="1"/>`
      : `<ellipse cx="${f.x * S}" cy="${f.y * S}" rx="${f.radiusX * S}" ry="${f.radiusY * S}" fill="rgba(255,0,0,0.18)" stroke="red" stroke-width="1"/>`);
  }
}
if (process.argv.includes("--markers")) {
  const def = getLocationMap(id);
  if (def?.image === `${COMPOSED_PREFIX}${id}`) {
    const dot = (p: { x: number; y: number }, colour: string) => svg.push(`<circle cx="${p.x / 100 * map.width * S}" cy="${p.y / 100 * map.height * S}" r="${Math.max(3, 9 * S)}" fill="${colour}" stroke="black"/>`);
    Object.values(def.npcSpots ?? {}).forEach((p) => dot(p, "#3b82f6"));
    (def.exits ?? []).forEach((p) => dot(p, "#22c55e"));
    (def.spots ?? []).forEach((p) => dot(p, "#facc15"));
    dot(def.spawn, "#ffffff");
  }
}
if (svg.length) layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.join("")}</svg>`), left: 0, top: 0 });
await sharp({ create: { width: W, height: H, channels: 4, background: "#556b2f" } }).composite(layers).png().toFile(outFile);
console.log(`wrote ${outFile} (${W}×${H})`);
