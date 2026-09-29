/**
 * Build the PWA / home-screen icons from the hero sprite:
 * jade lacquer disc, gold rim, the hero's bust in native pixels.
 * Run: bun scripts/build-pwa-icons.ts
 */
import sharp from "sharp";

const HERO = "public/player/m1.png";

async function icon(size: number, out: string, maskable: boolean) {
  // Maskable icons keep the face inside the central 80 % safe zone; the body runs off the bottom edge.
  const art = maskable ? 0.74 : 0.8;
  const rim = maskable ? "" : `<circle cx="50" cy="50" r="47" fill="none" stroke="#d9b36a" stroke-width="3"/>
    <circle cx="50" cy="50" r="43.5" fill="none" stroke="#140a07" stroke-width="1.5"/>`;
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <defs><radialGradient id="g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#2e5446"/><stop offset="1" stop-color="#10201b"/></radialGradient></defs>
    ${maskable ? `<rect width="100" height="100" fill="url(#g)"/>` : `<circle cx="50" cy="50" r="48.5" fill="url(#g)"/>`}
    ${rim}
  </svg>`);
  // Bust: the top of the 192 px figure, upscaled with nearest-neighbour.
  const bustSize = Math.round(size * art);
  const bust = await sharp(await heroBust()).resize(bustSize, bustSize, { kernel: "nearest" }).png().toBuffer();
  const offset = Math.round((size - bustSize) / 2);
  // The disc clips the figure so the bust fades into the rim, not a hard crop line.
  const clip = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    ${maskable ? `<rect width="100" height="100"/>` : `<circle cx="50" cy="50" r="43" />`}</svg>`);
  const figure = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: bust, left: offset, top: maskable ? size - bustSize : offset + Math.round(size * 0.1) }, { input: clip, blend: "dest-in" }])
    .png().toBuffer();
  await sharp(background).resize(size, size).composite([{ input: figure }]).png().toFile(out);
}

/** Head and shoulders, with the sheet's leftover magenta key pixels removed. */
async function heroBust(): Promise<Buffer> {
  const { data, info } = await sharp(HERO).extract({ left: 52, top: 8, width: 88, height: 88 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 70 && b > 70 && g < Math.min(r, b) * 0.55 && Math.abs(r - b) < 90) data[i + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

await icon(192, "public/pwa/icon-192.png", false);
await icon(512, "public/pwa/icon-512.png", false);
await icon(512, "public/pwa/icon-maskable-512.png", true);
await icon(180, "public/pwa/apple-touch-icon.png", true);
console.log("icons written to public/pwa/");
