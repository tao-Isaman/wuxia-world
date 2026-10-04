import sharp from "sharp";
import { renderIso, type Img, type IsoLook } from "../assets/kits-iso";
const RAW = "/tmp/claude-0/-home-user-wuxia-world/c7f28893-139e-59e9-bd6c-3142407f3b16/scratchpad/assets-raw/out/kit/kit_textures_01";
async function load(p: string): Promise<Img> { const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { w: info.width, h: info.height, px: new Uint8ClampedArray(data) }; }
const tex = async (i: number) => load(`${RAW}/${String(i).padStart(2, "0")}.png`);
const city: IsoLook = { cell: 64, thick: 0.28, height: 56, parapet: 6, face: await tex(0), top: await tex(1) };
const house: IsoLook = { cell: 64, thick: 0.1, height: 40, coping: 7, face: await tex(3), top: await tex(2), roof: await tex(2) };
const road: IsoLook = { cell: 96, thick: 0.36, height: 0, face: await tex(1), top: await load("public/assets/tile/heartland/til_heartland_grass_paving_07.png") };
const layers: sharp.OverlayOptions[] = [];
let x = 10;
const put = async (r: ReturnType<typeof renderIso>, y = 20) => {
  layers.push({ input: await sharp(Buffer.from(r.img.px.buffer), { raw: { width: r.img.w, height: r.img.h, channels: 4 } }).png().toBuffer(), left: x, top: y });
  x += r.img.w + 10;
};
for (const m of [0, 10, 5, 3, 6, 12, 9, 15, 14]) await put(renderIso(city, { mask: m }));
await put(renderIso(city, { mask: 10, span: 3, gate: { axis: "a", shape: "arch", width: 30 } }));
await put(renderIso(city, { mask: 5, span: 3, gate: { axis: "b", shape: "arch", width: 30 } }));
x = 10;
for (const m of [0, 10, 5, 3, 15]) await put(renderIso(house, { mask: m }), 220);
await put(renderIso(house, { mask: 10, gate: { axis: "a", shape: "moon", width: 26 } }), 220);
for (const m of [0, 10, 5, 3, 15, 14]) await put(renderIso(road, { mask: m }), 220);
await sharp({ create: { width: x + 600, height: 330, channels: 4, background: { r: 120, g: 98, b: 70, alpha: 1 } } }).composite(layers).png().toBuffer()
  .then((b) => sharp(b).resize((x + 600) * 2, 660, { kernel: "nearest" }).toFile(process.argv[2]));
