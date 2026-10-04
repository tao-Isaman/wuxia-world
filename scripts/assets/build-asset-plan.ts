/**
 * Writes the asset library's job list: scripts/assets/plan/<category>.json
 * (docs/assets.md). Subjects come from plan-content.ts, plan-sects.ts and
 * plan-actors.ts plus the game data (every NPC gets a character). Rerunning
 * is safe: job ids are stable, and generate.py skips jobs already done.
 *
 *   bun scripts/assets/build-asset-plan.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { NPCS } from "@/lib/world/data";
import { regionOf } from "@/lib/world/data/regions";
import {
  ART_REGIONS, BIOME_REGION, BIOME_THAI, BUILDINGS, FX, ICONS, INTERIOR_PROPS, LANDMARKS, NATURE, REGION_LOOK, REGION_THAI,
  TILESETS, TOWN_PROPS, UI, VILLAGE_PROPS, type AssetKind, type Biome, type PropSubject,
} from "./plan-content";
import { SECTS, SECT_SLOTS } from "./plan-sects";
import { MONSTERS, npcPrompt } from "./plan-actors";

export type Method = "v2" | "pixen" | "char3" | "tileset";

export interface PlanJob {
  /** Job id; the assets it yields are `<id>` (keep 1) or `<id>_01…` (keep > 1). */
  id: string;
  category: string;
  subcategory: string;
  region: string;
  sect?: string;
  /** Folder under public/assets/<category>/. */
  group: string;
  /** Thai display name (numbered at import when keep > 1). */
  name: string;
  tags: string[];
  kind: AssetKind;
  /** Display width on a map, in map units (a standing person is ~48 tall). */
  mapWidth: number;
  /** How many clearly different designs to keep. */
  keep: number;
  method: Method;
  size: { w: number; h: number };
  prompt: string;
  /** Style image key (<raw>/style/<key>.png) for v2. */
  style?: string;
  template?: string;
  lower?: string;
  upper?: string;
  transition?: string;
  shape_style?: "round" | "square";
  transition_size?: number;
  detail?: string;
  shading?: string;
  estimate?: number;
}

const TAIL = "muted painterly palette, dark outline, ancient China wuxia setting, transparent background, no ground platform under it, no text";
const OBJECT_VIEW = "High top-down 3/4 RPG view from above";
const BUILDING_VIEW = "Isometric 3/4 view from above showing the roof and two walls, whole building in frame";

const jobs: Record<string, PlanJob[]> = {};
const ids = new Set<string>();
function add(job: PlanJob): void {
  if (!/^[a-z0-9]+(_[a-z0-9]+)+$/.test(job.id)) throw new Error(`bad id ${job.id}`);
  if (ids.has(job.id)) throw new Error(`duplicate id ${job.id}`);
  ids.add(job.id);
  (jobs[job.category] ??= []).push(job);
}
const sq = (n: number) => ({ w: n, h: n });

// ─── buildings ───
for (const region of ART_REGIONS) {
  for (const [key, thai, subject, sub, width] of BUILDINGS[region]) add({
    id: `bld_${region}_${key}`, category: "building", subcategory: sub, region, group: region, name: thai,
    tags: [thai, key.replace(/_/g, " "), sub, region, REGION_THAI[region]], kind: "building", mapWidth: width, keep: 4,
    method: "v2", size: sq(128), style: `region-${region}`,
    prompt: `pixel art game asset: ${subject}, ${REGION_LOOK[region]}. ${BUILDING_VIEW}, ${TAIL}.`,
  });
}
for (const [key, thai, subject, sub, width, region] of LANDMARKS) add({
  id: `bld_${region === "any" ? "landmark" : region}_${key}`, category: "building", subcategory: sub, region, group: region === "any" ? "landmark" : region,
  name: thai, tags: [thai, key.replace(/_/g, " "), sub, "landmark", "สถานที่สำคัญ"], kind: "building", mapWidth: width, keep: 4,
  method: "v2", size: sq(160), style: region === "any" ? "region-heartland" : `region-${region}`,
  prompt: `pixel art game asset: ${subject}${region === "any" ? "" : `, ${REGION_LOOK[region]}`}. ${BUILDING_VIEW}, ${TAIL}.`,
});

// ─── props ───
function prop(prefix: string, region: string, group: string, s: PropSubject, keep: number, setTag: string, look: string, style: string): void {
  const [key, thai, subject, sub, kind, width, size = 64] = s;
  add({
    id: `prp_${prefix}_${key}`, category: "prop", subcategory: sub, region, group, name: thai,
    tags: [thai, key.replace(/_/g, " "), sub, setTag, region], kind, mapWidth: width, keep, method: "v2", size: sq(size), style,
    prompt: `pixel art game asset: ${subject}${look ? `, ${look}` : ""}. ${OBJECT_VIEW}, ${TAIL}, single object centered.`,
  });
}
for (const region of ART_REGIONS) {
  for (const s of TOWN_PROPS[region]) prop(region, region, region, s, 8, "town", REGION_LOOK[region].split(":")[0], `region-${region}`);
  for (const s of VILLAGE_PROPS[region]) prop(region, region, region, s, 10, "village", REGION_LOOK[region].split(":")[0].replace("style", "village"), `region-${region}`);
}
for (const s of INTERIOR_PROPS) prop("interior", "any", "interior", s, 9, "interior", "ancient Chinese interior furniture", "interior");

// ─── nature ───
for (const biome of Object.keys(NATURE) as Biome[]) {
  for (const [key, thai, subject, sub, kind, width, size = 64] of NATURE[biome]) add({
    id: `nat_${biome}_${key}`, category: "nature", subcategory: sub, region: BIOME_REGION[biome], group: biome, name: thai,
    tags: [thai, key.replace(/_/g, " "), sub, biome, BIOME_THAI[biome]], kind, mapWidth: width, keep: size <= 42 ? 12 : 8,
    method: "v2", size: sq(size), style: `biome-${biome}`,
    prompt: `pixel art game asset: ${subject}. ${OBJECT_VIEW}, ${TAIL}, single plant or object centered.`,
  });
}

// ─── sects (one pixen image per subject) ───
for (const sect of SECTS) {
  const subjects: [string, string, string, string, AssetKind, number, number][] = [
    ...SECT_SLOTS.map(([key, thai, fn, sub, kind, width, size]) => [key, thai, fn(sect), sub, kind, width, size] as [string, string, string, string, AssetKind, number, number]),
    ...sect.items,
  ];
  for (const [key, thai, subject, sub, kind, width, size] of subjects) add({
    id: `sct_${sect.id}_${key}`, category: "sect", subcategory: sub, region: sect.region, sect: sect.id, group: sect.id,
    name: `${thai}${SECT_SLOTS.some((slot) => slot[0] === key) ? sect.thai : ""}`,
    tags: [thai, sect.thai, sect.thaiEn ?? sect.id, key.replace(/_/g, " "), sub], kind, mapWidth: width, keep: 1,
    method: "pixen", size: sq(size),
    // Pixen reads negations as subjects ("no trees" draws trees) and turns "isometric" into dioramas:
    // describe only the object and how it is seen.
    prompt: `pixel art game sprite: ${subject.split(", ")[0]}, ${sect.thaiEn} sect style. One single ${kind === "building" ? "building" : "object"} on a transparent background, seen from above at a 3/4 angle like a top-down RPG ${kind === "building" ? "building" : "prop"}, dark outline, muted colours.`,
  });
}

// ─── icons ───
for (const [key, thai, subject, sub] of ICONS) add({
  id: `ico_${sub}_${key}`, category: "icon", subcategory: sub, region: "any", group: sub, name: thai,
  tags: [thai, key.replace(/_/g, " "), sub, "icon", "ไอคอน"], kind: "icon", mapWidth: 24, keep: 14, method: "v2", size: sq(40), style: "icon",
  prompt: `pixel art inventory item icon: ${subject}, ancient China wuxia, muted painterly palette, dark outline, centered, transparent background, no text.`,
});

// ─── fx / ui ───
for (const [key, thai, subject, keep] of FX) add({
  id: `fx_effect_${key}`, category: "fx", subcategory: "effect", region: "any", group: "effect", name: thai,
  tags: [thai, key.replace(/_/g, " "), "effect", "เอฟเฟกต์"], kind: "fx", mapWidth: 48, keep, method: "v2", size: sq(64),
  prompt: `pixel art game effect sprite: ${subject}, wuxia martial arts effect, dark outline where solid, centered, transparent background, no text.`,
});
for (const [key, thai, subject, size, keep] of UI) add({
  id: `ui_hud_${key}`, category: "ui", subcategory: key, region: "any", group: "hud", name: thai,
  tags: [thai, key.replace(/_/g, " "), "ui"], kind: "ui", mapWidth: size, keep, method: "v2", size: sq(size),
  prompt: `pixel art game UI element: ${subject}, ancient Chinese lacquer, parchment and gold style, muted palette, centered, transparent background, no text, no letters.`,
});

// ─── characters (every NPC) ───
for (const npc of NPCS) {
  const a = npcPrompt(npc);
  const region = regionOf(npc.locationIds[0]);
  add({
    id: `chr_${region}_${npc.id}`, category: "character", subcategory: a.age === "child" ? "child" : a.sect ? "sect" : (npc.tags?.[0] ?? "npc"),
    region, ...(a.sect ? { sect: a.sect } : {}), group: region, name: npc.name,
    tags: [npc.name, npc.id, a.gender, a.age, ...(npc.tags ?? [])], kind: "actor", mapWidth: 48, keep: 1, method: "char3", size: sq(64),
    template: "mannequin", prompt: a.prompt,
  });
}

// ─── monsters ───
for (const [key, thai, subject, sub, template] of MONSTERS) add({
  id: `mon_${sub}_${key}`, category: "monster", subcategory: sub, region: "any", group: sub, name: thai,
  tags: [thai, key.replace(/_/g, " "), sub], kind: "actor", mapWidth: sub === "boss" ? 80 : 56, keep: 1, method: "char3", size: sq(88), template,
  prompt: `${subject}; pixel art game monster, ancient China wuxia fantasy, muted colours`,
});

// ─── tiles ───
for (const region of ART_REGIONS) {
  for (const [key, thai, lower, upper, transition] of TILESETS[region]) add({
    id: `til_${region}_${key}`, category: "tile", subcategory: key, region, group: region, name: thai,
    tags: [thai, key.replace(/_/g, " "), "tile", region, REGION_THAI[region]], kind: "tile", mapWidth: 32, keep: 16, method: "tileset", size: sq(32),
    prompt: `${lower} | ${upper}`, lower: `${lower}, muted colours`, upper: `${upper}, muted colours`, transition, estimate: 4,
    shape_style: "round", transition_size: 0, detail: "highly detailed", shading: "detailed shading",
  });
}

mkdirSync("scripts/assets/plan", { recursive: true });
let total = 0, cost = 0;
for (const [category, list] of Object.entries(jobs)) {
  const est = list.reduce((sum, j) => sum + (j.method === "v2" ? 20 : j.method === "pixen" ? 1 : j.method === "char3" ? 2 : (j.estimate ?? 4)), 0);
  const assets = list.reduce((sum, j) => sum + j.keep, 0);
  total += assets; cost += est;
  writeFileSync(`scripts/assets/plan/${category}.json`, JSON.stringify({ category, jobs: list }, null, 1) + "\n");
  console.log(`${category.padEnd(10)} ${String(list.length).padStart(4)} jobs → ${String(assets).padStart(4)} assets, ~${est} generations`);
}
console.log(`total ${total} assets, ~${cost} generations`);
