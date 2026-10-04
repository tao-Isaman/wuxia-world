# Asset library

A library of pixel-art assets made with [PixelLab](https://pixellab.ai) for the map editor and the game: buildings, props, sect sets, nature, ground tiles, item icons, NPC characters, monsters, effects and UI pieces. Every image lives under `public/assets/` and is listed in `public/assets/manifest.json`, which the game and the engine **fetch at runtime** (never import it — it runs to thousands of entries). The contract is `lib/assets/types.ts`; the readers are in `lib/assets/catalog.ts`.

## Contents

- [What is in it](#what-is-in-it)
- [Folder layout and ids](#folder-layout-and-ids)
- [Manifest fields](#manifest-fields)
- [Art direction](#art-direction)
- [The pipeline](#the-pipeline)
- [Adding or regenerating assets](#adding-or-regenerating-assets)
- [Budget used](#budget-used)

## What is in it

| Category | Approved | Size (px) | Made with | What |
| --- | --- | --- | --- | --- |
| `building` | 224 | 128–160 | `generate-image-v2` | 10 kinds × 5 regions (4 designs each) + 15 landmarks: city gates, palace halls, pagodas, sect halls, bridges, a tournament stage |
| `prop` | 966 | 64–84 | `generate-image-v2` | town props (12 kinds per region), village / farm props (6 per region), interior furniture (23 kinds) |
| `sect` | 305 | 64–128 | `create-image-pixen` | 16 per sect × 20 sects: gate, banner, training dummy, weapon rack, altar, lantern + 10 signature objects |
| `nature` | 359 | 40–84 | `generate-image-v2` | 7 kinds × 6 biomes (temperate, bamboo, desert, snow, swamp, coast) |
| `tile` | 480 | 32 | `create-tileset` | 6 Wang tilesets × 5 regions, 16 tiles each |
| `icon` | 417 | 40 | `generate-image-v2` | weapons, armour, accessories, potions, herbs, ores, food, books, valuables, tools, venoms |
| `character` | 225 | 64 | `create-character-v3` | one per NPC in the game data, 8 directions |
| `monster` | 120 | 88 | `create-character-v3` | beasts, spirits, demons, undead and human foe archetypes, 8 directions |
| `fx` | 60 | 64 | `generate-image-v2` | flame, lightning, ice, sword qi, palm wave, poison, smoke, sparks, healing, blood |
| `ui` | 38 | 42–64 | `generate-image-v2` | frames, buttons, medallions, scroll banners, seals, gauge orbs |
| **total** | **3,194** | | | |

By region: heartland 508, east 450, south 440, north 478, west 458, any 860 (icons, fx, ui, monsters, interior furniture, landmarks).

## Folder layout and ids

```
public/assets/manifest.json
public/assets/<category>/<region | sect | group>/<id>.png
public/assets/character/<region>/<id>.png        (the S view)
public/assets/character/<region>/<id>_<dir>.png  (se, e, ne, n, nw, w, sw)
```

Ids are `<prefix>_<region|sect|group>_<name>[_nn]`: `bld_`, `prp_`, `sct_`, `nat_`, `til_`, `ico_`, `chr_`, `mon_`, `fx_`, `ui_` (for example `bld_east_water_house_03`, `sct_wudang_zhenwu_statue`, `chr_south_sect_emei_abbess_jingchan`). A `_nn` suffix numbers the designs one prompt gave; they share `variantOf`. Characters keep the NPC id: `chr_<region>_<npc id>`.

Groups: buildings and props by region (`heartland`, `east`, `south`, `north`, `west`, plus `landmark` and `interior`); sect sets by sect id; nature by biome; icons by kind (`weapon`, `armor`, `potion`…); monsters by kind (`beast`, `demon`, `spirit`, `undead`, `construct`, `human`, `boss`); tiles by region (`subcategory` is the tileset).

## Manifest fields

See `lib/assets/types.ts` for the full contract. How the import fills it:

- **Size.** `width × height` is the trimmed image. `mapWidth × mapHeight` is the drawn size in map units (maps are 960 × 640; a standing person is ~48 tall): set per subject in the plan (a house ~180–230, a pagoda ~150, a barrel ~40, a flower ~20), height from the image's aspect. Characters are scaled so the figure stands 48 tall.
- **Anchor** `anchorX, anchorY` (image px): the base centre — the lowest opaque row, and the mean of the opaque columns in the bottom 12 %. Icons, fx and ui anchor at their centre.
- **Footprint** (map units, relative to the anchor; its top-left corner is at anchor + (x, y), so `{ x: -w/2, y: -h, w, h }` sits centred on the base line), by kind:
  buildings: the lower 30 % of the height, 80 % of the width; solid props: 70 % wide, up to 35 % tall; tall props (posts, statues): 50 % wide; trees: a small trunk box; flat things (rugs, plots, flowers, tiles), low plants, characters, monsters, icons, fx and ui: `null`. The box is clipped to the drawn image (`test:assets` checks it).
- **Layer.** `ground` for flat things and tiles, `overhead` for hanging things, fx and ui, `object` (depth-sorted) for everything else.
- **flippable** is true except for tiles (their corners are directional) and 8-direction characters / monsters.
- **views** (characters and monsters): `S, SE, E, NE, N, NW, W, SW`, all cropped to one shared box so the anchors line up.
- **tile** (an additive optional field, tiles only): `{ set, corners: { NW, NE, SW, SE: "lower" | "upper" } }` — Wang corner autotiling: give every map vertex a terrain, and each cell takes the tile of its set whose corners match. The tags repeat it as `wang:<NW><NE><SW><SE>` (`l` / `u`).
- **source** records the PixelLab tool, the exact prompt, the seed and the job / character / tileset id, so an asset can be regenerated.
- **status** is `approved` for everything in the manifest: rejects are not imported.

## Art direction

One style for the whole library: a high top-down 3/4 RPG view (isometric for buildings) matching the painted maps, a muted painterly palette, a dark outline and a transparent background, in an ancient-China wuxia setting. Five regional looks:

| Region | Look |
| --- | --- |
| heartland | imperial: grey clay tiles, dark red pillars, grey brick, willows and pines |
| east | Jiangnan water towns: white walls, black tiles, arched bridges, boats, lotus |
| south | Dali / Miao: bamboo stilt houses, Bai white walls, tropical trees, swamps |
| north | frontier / Xixia: rammed earth, timber watchtowers, felt tents, steppe, snow |
| west | desert and high mountains: flat-roofed stone, prayer flags, caravans, snow pines |

Every `generate-image-v2` call passes a **style image** (`style_image`): per region, a sheet of the best pilot buildings and props of that region; biomes use their region's sheet, interior furniture the heartland's, icons a sheet of pilot icons. The 20 sects' signature sets come from `create-image-pixen` (one image per specific subject), prompted for the same view, palette and outline.

## The pipeline

All raw output and state live **outside the repo**, in a raw directory of your choice (`<raw>` below). The PixelLab token comes only from the `PIXELLAB_API_TOKEN` environment variable; never commit one.

| Step | Command | Does |
| --- | --- | --- |
| 1. Plan | `bun scripts/assets/build-asset-plan.ts` | writes `scripts/assets/plan/<category>.json`: one job per subject (id, Thai name, category, subcategory, region / sect, tags, prompt, size, method, keep count, map width, kind). Subjects: `scripts/assets/plan-content.ts` (buildings, props, nature, icons, fx, ui, tilesets), `plan-sects.ts` (the 20 sect sets), `plan-actors.ts` (every NPC's character prompt from its tags, sect, gender and age; the monster list) |
| 2. Generate | `python3 scripts/assets/generate.py run <raw> scripts/assets/plan/*.json --workers 8` | runs the jobs in parallel (back-off on HTTP 429), writes `<raw>/out/<category>/<job id>/` (+ `job.json`); resumable (a job with `job.json` is done); a hard budget from `<raw>/budget.json` (`{"start": <balance>, "cap": <generations>}`) stops before the balance would go below `start − cap`; every job is logged to `<raw>/ledger.jsonl`. `generate.py balance <raw>` prints the spend |
| 3. Review | `bun scripts/assets/import.ts --raw <raw> --review` | automatic curation, then contact sheets of the picks per category in `<raw>/review/` (with a `.tsv` mapping each cell to its candidate) and `<raw>/review-report.json` |
| 4. Reject | `bun scripts/assets/curate.ts reject <raw> <sheet> <i,j,…> <reason>` | records hand rejects in `scripts/assets/curation/rejects.json` (reviewed; the import then picks the next-best candidate) |
| 5. Reroll | `bun scripts/assets/curate.ts rerolls <raw>` → `generate.py run <raw> <raw>/rerolls.json` | new attempts (`<job id>__rN`) for jobs left short |
| 6. Import | `bun scripts/assets/import.ts --raw <raw>` | trims, palette-quantizes (≤ 96 colours) and writes `public/assets/<category>/<group>/<id>.png`, computes anchors, footprints and map sizes, writes `manifest.json` sorted by category, then id |
| 7. Test | `bun run test:assets` | contract, ids, files and sizes, footprints inside the drawn image, ≥ 3,000 approved |

`bun scripts/assets/contact-sheet.ts <out.png> [--cell 96] [--cols 12] <images…>` makes a sheet of any images.

**Automatic curation** (in `import.ts`): a candidate is dropped when its alpha is empty or almost empty, when the background was not removed (> 90 % opaque), when it is cut off at the frame edge (> 12 % of the border opaque), or when it nearly duplicates another candidate (a 64-bit luminance dHash plus an 8 × 8 alpha mask, distance ≤ 5). The job's `keep` designs are then picked starting from the most typical candidate and adding the most different one each time, stopping early when the rest are too close (distance < 9) to count as clearly different. One `generate-image-v2` prompt names one kind of thing and gives 16 designs (4 at 86–170 px, 64 at ≤ 42 px); the plan keeps 4 per building prompt, 8–10 per prop prompt, 8–12 per nature prompt, 14 per icon prompt.

## Adding or regenerating assets

- **More of a kind / a new subject:** add a row to `plan-content.ts` / `plan-sects.ts` / `plan-actors.ts`, rerun the plan, `generate.py run` (only the new jobs run), review, import, test.
- **A new NPC** gets a character job automatically on the next plan run.
- **Replace one design:** reject it (`curate.ts reject …`) and import again; the next-best candidate of that job takes its id. For a one-image job (sect, character, monster) run a reroll.
- Commit `scripts/assets/plan/`, `scripts/assets/curation/rejects.json`, `public/assets/**` and `manifest.json`; never the raw directory or a token.

## Budget used

The first library (2026-10-04) cost **6,983 PixelLab generations** of a 7,000 cap (balance 9,952 → 2,969):

| Method | Jobs | Generations | Notes |
| --- | --- | --- | --- |
| `generate-image-v2` | 266 | 5,320 | 20 per call: 16 designs at 43–85 px, 4 at 86–170 px, 64 at ≤ 42 px |
| `create-image-pixen` | 450 | 450 | 1 per image: the sect sets, with two reroll rounds |
| `create-character-v3` | 349 | 698 | 2 per character at 64 px and per monster at 88 px (anything ≤ 90 px costs 2) |
| `create-tileset` | 31 | 124 | 4 per 16-tile set (32 px, `shape_style: "round"`) |
| pilot and probes | 30 | ~100 | method and style tests |
| lost | — | ~290 | jobs in flight when a run was stopped and resubmitted, and request timeouts |

Curation: 82 candidates dropped as cut off, 35 with the background left in, 265 as near-duplicates, 186 rejected by hand (`rejects.json`: wrong subject, unrelated items on rocks, text glyphs, people in sect props, dioramas, western costumes), and about 2,400 unpicked spares (too close to a kept design, or over the keep count) stay in the raw directory.

**Lessons for the next run.**

- `generate-image-v2` at ≤ 42 px with a style image returns its 64 designs cut on a 40 px grid that does not match the drawn grid; `import.ts` stitches the 8 × 8 tiles back together and cuts out each object (`splitSheet`).
- Pixen reads negations as subjects ("no trees" draws trees) and turns "isometric" into dioramas on a ground block; describe only the object ("One single object on a transparent background, seen from above at a 3/4 angle like a top-down RPG prop"). A "training dummy" often comes out as a fighter.
- v2 rocks and snow mounds tend to carry unrelated items (coins, swords, lanterns); expect to reject a few.
- Character jobs take 3–5 minutes each with eight in parallel; a run stopped mid-way resumes them from `pending.json` without paying again, but v2 jobs in flight are lost.
