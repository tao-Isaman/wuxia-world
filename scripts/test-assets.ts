/**
 * The asset library is well formed (docs/assets.md): every manifest entry
 * matches the contract in lib/assets/types.ts, ids are unique and well formed,
 * every image exists at its stated size (none over 512 px), footprints lie
 * inside the drawn image, and the library holds at least 3,000 approved assets.
 *
 *   bun run test:assets
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { ASSET_CATEGORIES, ASSET_DIRECTIONS, ASSET_REGIONS, type AssetEntry, type AssetManifest } from "@/lib/assets/types";

const MIN_APPROVED = 3000;
const PREFIX: Record<string, string> = { building: "bld", prop: "prp", sect: "sct", nature: "nat", tile: "til", icon: "ico", character: "chr", monster: "mon", fx: "fx", ui: "ui" };
const failures: string[] = [];
const fail = (id: string, message: string) => { if (failures.length < 60) failures.push(`${id}: ${message}`); else failures.length === 60 && failures.push("…"); };

function pngSize(path: string): { width: number; height: number } | null {
  const head = readFileSync(path).subarray(0, 24);
  if (head.toString("latin1", 1, 4) !== "PNG") return null;
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}
function checkImage(id: string, url: string, size?: { width: number; height: number }): void {
  if (!url.startsWith("/assets/")) return fail(id, `image url ${url} is not under /assets/`);
  const path = join("public", url);
  if (!existsSync(path)) return fail(id, `missing file ${path}`);
  const real = pngSize(path);
  if (!real) return fail(id, `${path} is not a PNG`);
  if (real.width > 512 || real.height > 512) fail(id, `${path} is ${real.width}×${real.height} (over 512 px)`);
  if (size && (real.width !== size.width || real.height !== size.height)) fail(id, `${path} is ${real.width}×${real.height}, manifest says ${size.width}×${size.height}`);
}

const manifest = JSON.parse(readFileSync("public/assets/manifest.json", "utf8")) as AssetManifest;
if (manifest.version !== 1) fail("manifest", `version ${manifest.version}`);
if (!Array.isArray(manifest.assets)) throw new Error("manifest.assets is not an array");

const ids = new Set<string>();
const files = new Set<string>();
const counts: Record<string, number> = {};
const regions: Record<string, number> = {};
let approved = 0;
let previous: AssetEntry | null = null;
for (const a of manifest.assets) {
  const id = a.id ?? "(no id)";
  if (ids.has(id)) fail(id, "duplicate id");
  ids.add(id);
  if (!/^[a-z0-9]+(_[a-z0-9]+)+$/.test(id)) fail(id, "id is not lowercase snake case with a prefix");
  if (!(ASSET_CATEGORIES as readonly string[]).includes(a.category)) fail(id, `bad category ${a.category}`);
  else if (!id.startsWith(`${PREFIX[a.category]}_`)) fail(id, `id should start with ${PREFIX[a.category]}_`);
  if (!(ASSET_REGIONS as readonly string[]).includes(a.region)) fail(id, `bad region ${a.region}`);
  if (typeof a.name !== "string" || !/[฀-๿]/.test(a.name)) fail(id, "name is not Thai");
  if (!a.subcategory) fail(id, "no subcategory");
  if (!Array.isArray(a.tags) || !a.tags.length) fail(id, "no tags");
  if (!["approved", "draft", "rejected"].includes(a.status)) fail(id, `bad status ${a.status}`);
  if (!["ground", "object", "overhead"].includes(a.layer)) fail(id, `bad layer ${a.layer}`);
  if (typeof a.flippable !== "boolean") fail(id, "flippable is not a boolean");
  for (const k of ["width", "height", "mapWidth", "mapHeight", "anchorX", "anchorY"] as const)
    if (typeof a[k] !== "number" || !Number.isFinite(a[k]) || a[k] < 0) fail(id, `bad ${k}`);
  if (a.width < 1 || a.height < 1 || a.mapWidth <= 0 || a.mapHeight <= 0) fail(id, "zero size");
  if (a.anchorX > a.width + 0.01 || a.anchorY > a.height + 0.01) fail(id, "anchor outside the image");
  if (Math.abs(a.mapWidth / a.mapHeight - a.width / a.height) > 0.06 * (a.width / a.height)) fail(id, "map size does not keep the image's aspect");
  if (!a.source?.tool || !a.source.prompt || !a.source.size) fail(id, "incomplete source");
  if (a.footprint) {
    const f = a.footprint, sx = a.mapWidth / a.width, sy = a.mapHeight / a.height, eps = 0.6;
    if (f.w <= 0 || f.h <= 0) fail(id, "empty footprint");
    if (f.x < -a.anchorX * sx - eps || f.x + f.w > (a.width - a.anchorX) * sx + eps || f.y < -a.anchorY * sy - eps || f.y + f.h > (a.height - a.anchorY) * sy + eps)
      fail(id, `footprint ${JSON.stringify(f)} lies outside the drawn image`);
  }
  if (a.category === "sect" && !a.sect) fail(id, "sect asset without a sect");
  if (a.category === "tile" && !a.tile) fail(id, "tile without its tileset corners");
  checkImage(id, a.image, { width: a.width, height: a.height });
  files.add(join("public", a.image));
  if (a.category === "character" || a.category === "monster") {
    for (const d of ASSET_DIRECTIONS) {
      const view = a.views?.[d];
      if (!view) { fail(id, `no ${d} view`); continue; }
      checkImage(`${id} ${d}`, view, { width: a.width, height: a.height });
      files.add(join("public", view));
    }
    if (a.views?.S !== a.image) fail(id, "image is not the S view");
  }
  if (previous && (previous.category.localeCompare(a.category) || previous.id.localeCompare(a.id)) > 0) fail(id, "manifest not sorted by category, then id");
  previous = a;
  if (a.status === "approved") { approved++; counts[a.category] = (counts[a.category] ?? 0) + 1; regions[a.region] = (regions[a.region] ?? 0) + 1; }
}

// Every image under public/assets/ is listed.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
}
for (const category of ASSET_CATEGORIES) {
  const dir = join("public/assets", category);
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) if (file.endsWith(".png") && !files.has(file)) fail(file, "image not in the manifest");
}

if (approved < MIN_APPROVED) fail("library", `${approved} approved assets, want at least ${MIN_APPROVED}`);
for (const category of ASSET_CATEGORIES) if (!counts[category]) fail("library", `no approved ${category} assets`);

console.log(`assets: ${manifest.assets.length} entries, ${approved} approved`);
console.log(`  by category: ${ASSET_CATEGORIES.map((c) => `${c} ${counts[c] ?? 0}`).join(", ")}`);
console.log(`  by region:   ${ASSET_REGIONS.map((r) => `${r} ${regions[r] ?? 0}`).join(", ")}`);
if (failures.length) {
  console.error(`FAIL (${failures.length}):\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("test:assets ok");
