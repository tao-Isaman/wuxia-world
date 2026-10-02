/**
 * Render a composed map to one picture: isometric ground, then every object
 * in draw order, the way the game draws them.
 *
 *   bun scripts/render-composed-map.ts <map id> <out.png> [--scale 0.5] [--bases] [--markers] [--overview]
 *
 * --bases outlines every solid (red); --markers dots the location map's
 * NPCs (blue), exits (green) and services (yellow) and the spawn (white).
 * --overview writes the 960 × 640 WebP used behind dialogs and in cutscenes
 * (public/maps/composed/<id>-overview.webp) instead.
 */
import sharp from "sharp";
import { COMPOSED_GROUND_TILE_UNITS, COMPOSED_MAPS, COMPOSED_PREFIX, ISO_TILE_W, composedFootprints, composedSprites, isoSize, isoToWorld } from "../lib/world/data/composed";
import { getLocationMap } from "../lib/world/data/location-maps";

const [id, outArg] = process.argv.slice(2);
const map = COMPOSED_MAPS[id];
const overview = process.argv.includes("--overview");
const outFile = overview ? `public/maps/composed/${id}-overview.webp` : outArg;
if (!map || !outFile) throw new Error("usage: bun scripts/render-composed-map.ts <map id> <out.png> [--scale 0.5] [--bases] [--markers] [--overview]");
const size = isoSize(map);
const scaleArg = process.argv.indexOf("--scale");
const S = overview ? 960 / size.width : scaleArg > 0 ? Number(process.argv[scaleArg + 1]) : 0.5;
const W = Math.round(size.width * S), H = Math.round(size.height * S);
const G = COMPOSED_GROUND_TILE_UNITS;

const tiles = new Map<string, Buffer>();
const tile = async (material: string, px: number) => {
  const key = `${material}:${px}`;
  if (!tiles.has(key)) tiles.set(key, await sharp(`public/maps/composed/ground/${material}.webp`).resize(px, px).png().toBuffer());
  return tiles.get(key)!;
};
/** A top-down tiled patch of `w × h` units whose pattern starts `ox, oy` units into the texture. */
async function patch(material: string, w: number, h: number, ox: number, oy: number) {
  const px = Math.max(2, Math.round(G * S));
  const aw = Math.max(1, Math.round(w * S)), ah = Math.max(1, Math.round(h * S));
  const sx = Math.round((ox % G) * S), sy = Math.round((oy % G) * S);
  const full = await sharp({ create: { width: Math.ceil((aw + sx) / px + 1) * px, height: Math.ceil((ah + sy) / px + 1) * px, channels: 4, background: "#0000" } })
    .composite([{ input: await tile(material, px), tile: true, left: 0, top: 0 }]).png().toBuffer();
  return sharp(full).extract({ left: sx, top: sy, width: aw, height: ah }).png().toBuffer();
}

const layers: sharp.OverlayOptions[] = [];
// The base under everything, squashed like the game's.
const base = await patch(map.base, size.width, size.height * 2, 0, 0);
layers.push({ input: await sharp(base).resize(W, H, { fit: "fill" }).png().toBuffer(), left: 0, top: 0 });
// Ground areas: laid out unprojected, then turned 45° and squashed to half height.
const side = ISO_TILE_W / Math.SQRT2;
const c = Math.SQRT1_2;
for (const area of map.ground) {
  const flat = await patch(area.material, area.w * side, area.h * side, area.u * side, area.v * side);
  const meta = await sharp(flat).metadata();
  const raw = await sharp(flat).affine([[c, -c], [c / 2, c / 2]], { background: "#0000", interpolator: "bilinear" }).png().toBuffer();
  // Keep only the area's diamond (the affine's edges smear past it).
  const rm = await sharp(raw).metadata();
  const fw = meta.width!, fh = meta.height!;
  const diamond = [[c * fh, 0], [c * fh + c * fw, c * fw / 2], [c * fw, c * (fw + fh) / 2], [0, c * fh / 2]];
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${rm.width}" height="${rm.height}"><polygon points="${diamond.map(([x, y]) => `${x},${y}`).join(" ")}" fill="#fff"/></svg>`);
  const turned = await sharp(raw).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const at = isoToWorld(map, area.u, area.v);
  const left = Math.round(at.x * S - c * meta.height!), top = Math.round(at.y * S);
  const tm = await sharp(turned).metadata();
  // Clip to the picture.
  const cl = Math.max(0, -left), ct = Math.max(0, -top);
  const cw = Math.min(tm.width! - cl, W - Math.max(0, left)), ch = Math.min(tm.height! - ct, H - Math.max(0, top));
  if (cw <= 0 || ch <= 0) continue;
  layers.push({ input: await sharp(turned).extract({ left: cl, top: ct, width: cw, height: ch }).png().toBuffer(), left: Math.max(0, left), top: Math.max(0, top) });
}
const kerbs = map.ground.filter((area) => area.edge).map((area) => {
  const points = [isoToWorld(map, area.u, area.v), isoToWorld(map, area.u + area.w, area.v), isoToWorld(map, area.u + area.w, area.v + area.h), isoToWorld(map, area.u, area.v + area.h)];
  return `<polygon points="${points.map((p) => `${p.x * S},${p.y * S}`).join(" ")}" fill="none" stroke="rgba(43,35,24,0.38)" stroke-width="${Math.max(1, 3 * S)}"/>`;
});
if (kerbs.length) layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${kerbs.join("")}</svg>`), left: 0, top: 0 });
for (const sprite of [...composedSprites(map)].sort((a, b) => a.depth - b.depth)) {
  let img = sharp(`public${sprite.src}`).resize(Math.max(1, Math.round(sprite.width * S)), Math.max(1, Math.round(sprite.height * S)));
  if (sprite.flip) img = img.flop();
  // Clip sprites that hang over the map's edge.
  let buffer = await img.png().toBuffer();
  let left = Math.round(sprite.left * S), top = Math.round(sprite.top * S);
  const meta = await sharp(buffer).metadata();
  const cl = Math.max(0, -left), ct = Math.max(0, -top);
  const cw = Math.min(meta.width! - cl, W - Math.max(0, left)), ch = Math.min(meta.height! - ct, H - Math.max(0, top));
  if (cw <= 0 || ch <= 0) continue;
  if (cl || ct || cw < meta.width! || ch < meta.height!) buffer = await sharp(buffer).extract({ left: cl, top: ct, width: cw, height: ch }).png().toBuffer();
  left = Math.max(0, left); top = Math.max(0, top);
  layers.push({ input: buffer, left, top });
}
const svg: string[] = [];
if (process.argv.includes("--bases")) {
  for (const f of composedFootprints(map)) {
    svg.push(`<polygon points="${f.points.map((p) => `${p.x * S},${p.y * S}`).join(" ")}" fill="rgba(255,0,0,0.18)" stroke="red" stroke-width="1"/>`);
  }
}
if (process.argv.includes("--markers")) {
  const def = getLocationMap(id);
  if (def?.image === `${COMPOSED_PREFIX}${id}`) {
    const dot = (p: { x: number; y: number }, colour: string) => svg.push(`<circle cx="${p.x / 100 * W}" cy="${p.y / 100 * H}" r="${Math.max(3, 9 * S)}" fill="${colour}" stroke="black"/>`);
    Object.values(def.npcSpots ?? {}).forEach((p) => dot(p, "#3b82f6"));
    (def.exits ?? []).forEach((p) => dot(p, "#22c55e"));
    (def.spots ?? []).forEach((p) => dot(p, "#facc15"));
    dot(def.spawn, "#ffffff");
  }
}
if (svg.length) layers.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.join("")}</svg>`), left: 0, top: 0 });
const picture = sharp({ create: { width: W, height: H, channels: 4, background: "#556b2f" } }).composite(layers);
if (overview) {
  // Flatten first: the overview is 960 × 640 whatever the map's aspect.
  const flat = await picture.png().toBuffer();
  await sharp(flat).resize(960, 640, { fit: "fill" }).webp({ quality: 82 }).toFile(outFile);
} else {
  await picture.png().toFile(outFile);
}
console.log(`wrote ${outFile} (${overview ? "960×640" : `${W}×${H}`})`);
