/**
 * Road paintings for the travel screens.
 *   bun scripts/build-route-variants.ts --from <dir>              # import new paintings
 *   bun scripts/build-route-variants.ts --preview <out.jpg> [type-dir]   # see the regional grades
 * --from <dir> imports <type>-<dir8>.png (1536×1024, the road painted from one
 * edge or corner to the opposite one) as /maps/routes/<type>-<dir8>.webp at
 * 1152×768 and deletes any other route file. Regions are not baked: the world
 * runtime grades the pixels when a road map loads (lib/stage/route-grade.ts),
 * and --preview runs that same code.
 */
import sharp from "sharp";
import { readdirSync, unlinkSync } from "node:fs";
import { DIR8 } from "../lib/world/compass";
import { ROUTE_GRADES, gradePixels } from "../lib/stage/route-grade";

const DIR = "public/maps/routes";
const TYPES = ["highway", "country", "forest", "mountain", "gorge", "coast", "lane"];
const args = process.argv.slice(2);

if (args[0] === "--preview") {
  const source = `${DIR}/${args[2] ?? "mountain-N"}.webp`, W = 384, H = 256;
  const regions = [undefined, ...Object.keys(ROUTE_GRADES)];
  const tiles = await Promise.all(regions.map(async (region) => {
    const { data, info } = await sharp(source).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    gradePixels(data, region);
    return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  }));
  await sharp({ create: { width: W * 3, height: H * 2, channels: 3, background: "#000" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 3) * W, top: Math.floor(i / 3) * H }))).jpeg().toFile(args[1]);
  console.log(`wrote ${args[1]}: base, ${Object.keys(ROUTE_GRADES).join(", ")}`);
} else if (args[0] === "--from" && args[1]) {
  const keep = new Set<string>();
  for (const type of TYPES) for (const dir of DIR8) {
    const file = `${type}-${dir}.webp`;
    await sharp(`${args[1]}/${type}-${dir}.png`).resize(1152, 768).webp({ quality: 62 }).toFile(`${DIR}/${file}`);
    keep.add(file);
  }
  let removed = 0;
  for (const file of readdirSync(DIR)) if (!keep.has(file)) { unlinkSync(`${DIR}/${file}`); removed++; }
  console.log(`imported ${keep.size} road paintings; removed ${removed} other files`);
} else {
  console.error("usage: --from <dir> | --preview <out.jpg> [type-dir]");
  process.exit(1);
}
