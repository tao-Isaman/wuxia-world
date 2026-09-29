/**
 * Regional colour grades for the shared road paintings.
 *   bun scripts/build-route-variants.ts [--preview <out.jpg>]
 * Each /maps/routes/<type>.webp gets one graded copy per region
 * (/maps/routes/<type>-<region>.webp; heartland keeps the original), so a
 * mountain pass in the snowy north, the western desert or the lush south
 * reads as a different road. Mirroring is done at runtime (RouteMapDef.mirror).
 */
import sharp from "sharp";
import { readdirSync } from "node:fs";

const DIR = "public/maps/routes";
type Grade = (image: sharp.Sharp) => sharp.Sharp;
export const ROUTE_GRADES: Record<string, Grade> = {
  // Frost highlands: cooled, desaturated, lifted toward snow light.
  north: (i) => i.recomb([[0.62, 0.26, 0.12], [0.22, 0.64, 0.14], [0.2, 0.26, 0.64]]).linear([0.92, 0.95, 1.04], [26, 28, 40]).modulate({ saturation: 0.8 }),
  // Western desert: ochre sand, sun-bleached greens.
  west: (i) => i.recomb([[1.12, 0.22, 0], [0.24, 0.8, 0], [0.08, 0.22, 0.42]]).linear([1, 0.98, 0.95], [18, 10, 0]).modulate({ saturation: 0.8 }),
  // Lush humid south: deeper, greener, richer.
  south: (i) => i.recomb([[0.82, 0.08, 0.06], [0.04, 1.02, 0.08], [0, 0.12, 1.02]]).modulate({ saturation: 1.3, brightness: 0.9, hue: 10 }),
  // Misty eastern coast at dawn: soft contrast, rose-teal haze.
  east: (i) => i.linear([0.8, 0.8, 0.84], [44, 36, 44]).recomb([[1.02, 0, 0.02], [0, 0.98, 0.04], [0.02, 0.04, 1.02]]).modulate({ saturation: 0.9 }),
  // Wild jianghu: dusk — cool violet shadow, the road lit by the last light.
  jianghu_wild: (i) => i.linear([0.66, 0.66, 0.86], [4, 6, 24]).modulate({ saturation: 0.82 }),
};

const args = process.argv.slice(2);
const types = readdirSync(DIR).filter((f) => /^[a-z]+\.webp$/.test(f)).map((f) => f.replace(".webp", ""));
if (args[0] === "--preview") {
  const source = `${DIR}/${args[2] ?? "mountain"}.webp`, W = 384, H = 256;
  const tiles = [await sharp(source).resize(W, H).toBuffer()];
  for (const grade of Object.values(ROUTE_GRADES)) tiles.push(await grade(sharp(source).resize(W, H)).toBuffer());
  await sharp({ create: { width: W * 3, height: H * 2, channels: 3, background: "#000" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 3) * W, top: Math.floor(i / 3) * H }))).jpeg().toFile(args[1]);
} else {
  for (const type of types) for (const [region, grade] of Object.entries(ROUTE_GRADES)) {
    await grade(sharp(`${DIR}/${type}.webp`)).webp({ quality: 80 }).toFile(`${DIR}/${type}-${region}.webp`);
  }
  console.log(`wrote ${types.length * Object.keys(ROUTE_GRADES).length} graded route paintings`);
}
