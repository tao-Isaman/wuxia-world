# Asset library

A library of pixel-art assets made with [PixelLab](https://pixellab.ai) for the map editor and the game: buildings, props, sect sets, nature, ground tiles, item icons, NPC characters, monsters, effects and UI pieces. Every image lives under `public/assets/` and is listed in `public/assets/manifest.json`, which the game and the engine **fetch at runtime** (never import it — it runs to thousands of entries). The contract is `lib/assets/types.ts`; the readers are in `lib/assets/catalog.ts`.

## Contents

- [What is in it](#what-is-in-it)
- [Folder layout and ids](#folder-layout-and-ids)
- [Manifest fields](#manifest-fields)
- [Art direction](#art-direction)
- [The pipeline](#the-pipeline)
- [Adding or regenerating assets](#adding-or-regenerating-assets)
- [Kits: roads and walls that join](#kits-roads-and-walls-that-join)
- [Animated big foes](#animated-big-foes)
- [PixelLab characters](#pixellab-characters)
- [Budget used](#budget-used)

## What is in it

| Category | Approved | Size (px) | Made with | What |
| --- | --- | --- | --- | --- |
| `building` | 224 | 128–160 | `generate-image-v2` | 10 kinds × 5 regions (4 designs each) + 15 landmarks: city gates, palace halls, pagodas, sect halls, bridges, a tournament stage |
| `prop` | 966 | 64–84 | `generate-image-v2` | town props (12 kinds per region), village / farm props (6 per region), interior furniture (23 kinds) |
| `sect` | 305 | 64–128 | `create-image-pixen` | 16 per sect × 20 sects: gate, banner, training dummy, weapon rack, altar, lantern + 10 signature objects |
| `nature` | 359 | 40–84 | `generate-image-v2` | 7 kinds × 6 biomes (temperate, bamboo, desert, snow, swamp, coast) |
| `tile` | 480 | 32 | `create-tileset` | 6 Wang tilesets × 5 regions, 16 tiles each |
| `icon` | 417 | 40 | `generate-image-v2` | weapons, armour, accessories, potions, herbs, ores, food, books, valuables, tools, venoms; every game item and equipment piece uses one ([item icons](#item-icons)) |
| `character` | 225 | 64 | `create-character-v3` | one per NPC in the game data, 8 directions |
| `monster` | 120 | 88 | `create-character-v3` | beasts, spirits, demons, undead and human foe archetypes, 8 directions |
| `fx` | 60 | 64 | `generate-image-v2` | flame, lightning, ice, sword qi, palm wave, poison, smoke, sparks, healing, blood |
| `ui` | 38 | 42–64 | `generate-image-v2` | frames, buttons, medallions, scroll banners, seals, gauge orbs |
| `kit` | 928 | 30–96 | `create-tiles-pro` | modular roads, city walls, house walls and fences that join on a grid ([Kits](#kits-roads-and-walls-that-join)) |
| **total** | **4,122** | | | |

By region: heartland 607, east 500, south 523, north 544, west 508, any 976 (icons, fx, ui, monsters, interior furniture, landmarks, the region-free kits).


### Item icons

Every item and equipment piece shows an icon from this library in the bag, shops and letters (`ItemTile`'s `icon`). The table is static — `lib/world/data/item-icons.ts`: `ITEM_ICONS` (item id → icon id), `EQUIPMENT_IDS` / `EQUIPMENT_ICONS`, and `itemIconId` / `equipmentIconId` / `itemIconUrl` / `equipmentIconUrl` (URL `/assets/icon/<group>/<id>.png`), so the bag needs no manifest fetch. Scroll items (`scroll_skill_*`, `scroll_art_*`) and manuals take their move's tier: `ico_book_scroll_*` for move skills, `ico_book_book_*` for inner arts. A new item or equipment id needs an entry here, else it shows its category glyph and `test:assets` fails.

## Folder layout and ids

```
public/assets/manifest.json
public/assets/<category>/<region | sect | group>/<id>.png
public/assets/character/<region>/<id>.png        (the S view)
public/assets/character/<region>/<id>_<dir>.png  (se, e, ne, n, nw, w, sw)
```

Ids are `<prefix>_<region|sect|group>_<name>[_nn]`: `bld_`, `prp_`, `sct_`, `nat_`, `til_`, `ico_`, `chr_`, `mon_`, `fx_`, `ui_`, `kit_` (for example `bld_east_water_house_03`, `sct_wudang_zhenwu_statue`, `chr_south_sect_emei_abbess_jingchan`). A `_nn` suffix numbers the designs one prompt gave; they share `variantOf`. Characters keep the NPC id: `chr_<region>_<npc id>`.

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
- **solids** (optional): several blocking boxes in the footprint's frame when one box is too coarse — a gate's two piers with the passage open. They block instead of `footprint`, which stays their bounds (`PlacementGeometry.solids`, `blockingRects`).
- **kit** (category `kit` only): `{ set, kind, cell, mask, span?, special? }` — see [Kits](#kits-roads-and-walls-that-join).
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

## Kits: roads and walls that join

Category `kit` holds modular pieces that snap to a grid and join their neighbours, so a road network or a walled compound is painted, not assembled by hand. The logic is `lib/assets/kits.ts`; the pieces are built by `scripts/assets/build-kits.ts`.

**Sets.** One style is one set (`kit.set`, e.g. `kit_heartland_road_cobble`, `kit_east_wall_house_whiteink`):

| Kind | Sets | Cell | Pieces | Made from |
| --- | --- | --- | --- | --- |
| roads (`kind: "road"`, layer `ground`) | 12: dirt, cobble, flagstone, brick, bluestone (east), red clay and boardwalk (south), gravel, temple stepping stones, desert sand (west), loess cart road and snow (north) | 48 | 16 each | a PixelLab road set (`create-tiles-pro`, feature `roads`) over plain grass; the grass is keyed out so the road lies on any painting, the 1 px frame is cropped; the stamp-only plaza tile is the lone piece |
| city walls (`kind: "wall"`, `_wall_city_`) | 6: grey brick (heartland), granite (east), red sandstone (south), rammed earth (north), adobe (west), mountain fieldstone fort (any) | 32 | 16 + a 3-cell arched gate | built here from PixelLab texture tiles: face 56 high, 24 thick, a walkway with crenellated parapets |
| house walls (`kind: "wall"`, `_wall_house_`) | 8: white plaster with black tiles (east, moon gate), grey brick, red palace wall with yellow tiles, temple wall with green tiles, mossy brick (south), rammed earth (north), adobe (west), fieldstone | 32 | 16 + a gate | face 40 high, 10 thick, a tiled coping with a ridge (or a flat top) |
| fences (`kind: "fence"`) | 2: planks, bamboo (south) | 32 | 16 + a gate | face 26 high, 6 thick |

**Grid.** A set has one cell size and its grid starts at the map's top-left: cell (col, row) covers `[col·cell, (col+1)·cell) × [row·cell, (row+1)·cell)`. Every piece is one cell wide (`mapWidth = cell`) and anchored at the **bottom centre of its cell** — `((col + ½)·cell, (row + 1)·cell)`; a gate spanning 3 cells (`kit.span`) is anchored at the bottom centre of the span. Walls draw upward from their cell: the top sits `height` above the wall's ground band (the band is centred in the cell), with a face under every edge that looks south, so they depth-sort with characters like any object (a hero north of the wall walks behind it).

**Joins.** `kit.mask` is the sides a piece joins across: N 1, E 2, S 4, W 8 (PixelLab's road bits). Every set has a piece for each of the 16 masks — lone, 4 ends, 2 straights, 4 corners, 4 T-junctions and the crossing. `paintKit` fills or erases cells and re-picks the pieces in and around them from which neighbours hold the same set (`maskAt`, `pieceFor`); special pieces (`kit.special`: the gates) are placed by hand, never picked or erased by the brush, and join the sides in their mask; `placeKitSpecial` drops the auto pieces under a gate and re-joins its neighbours. Walls block with their exact band: a corner's L (`solids`), a gate's two piers with its passage open.

**Look.** All wall pieces of a set are drawn from the same two textures sampled in world space (texture period = cell), so runs join without seams and all 16 masks agree. Gates: a round arch in a city wall (the top runs across), a door or a moon gate in a house wall, a gap in a fence.

**Rebuild.** `bun scripts/assets/build-kits.ts plan` writes `scripts/assets/kits/plan.json` (one texture set + the 12 road sets); run it through `generate.py` (method `tilespro`, ~20 generations for the textures, ~40 per road set), then `bun scripts/assets/build-kits.ts build --raw <raw>`: it rebuilds `public/assets/kit/` and replaces the manifest's `kit` entries only (`import.ts` never touches them). The kit plan is kept out of `scripts/assets/plan/` so `import.ts` doesn't import it.

**Iso sets (diagonal).** The library's buildings are isometric (their walls lean 2:1), so every kit also comes on an **iso grid** (`kit.grid: "iso"`, set ids `kit_<region>_isoroad_`, `_isoplaza_`, `_isowall_`, `_isofence_`): 9 roads, 2 plazas (full cells) and iso versions of all 16 wall / fence styles, gates in both directions (`_gate_se` along a, `_gate_sw` along b). Cells are diamonds `cell` wide and `cell / 2` tall on one lattice for roads and walls (64): cell (a, b) has its centre at (480 + (a − b)·32, (a + b + 1)·16); a runs down-right, b down-left; N is up-right (b − 1), E down-right, S down-left, W up-left. An iso piece is anchored at its diamond's centre (a gate at the centre of its span) and blocks with a staircase of 4-unit boxes along its diagonal band (`solids`). They are drawn by `scripts/assets/kits-iso.ts`, which casts a ray per pixel through a small solid model (band, height, parapet or coping, gate passage) and samples a library ground tile (roads) or the texture set (walls) in grid space, so pieces join without seams and faces light like the buildings'. Iso cells count as on the map while their centre is.

**In the editor.** The map editor's ชิ้นต่อกัน panel is the brush: [engine.md](engine.md#ชิ้นต่อกัน-kit-brush).

## Animated big foes

The six legendary beasts (บอส) and the six tier-5 foes are not library assets: each has one animated sheet, `public/art/anims/<id>.png`, described by `lib/characters/anim-sheets.ts` (the contract) and `lib/characters/anim-sheets-data.ts` (generated). A sheet is rows of equal frames — `idle` (row 0, a loop), `attack` (row 1), `hurt` (row 2) — painted side-on **facing right**, with `frameW` / `frameH`, `feetY` (the ground line, 0..1 of the frame), `scale` (height next to a person) and each clip's frames and fps.

| Sheets | Frame | Scale | Clips |
| --- | --- | --- | --- |
| bosses: `boss_golden_serpent`, `boss_blood_tiger`, `boss_sword_eagle`, `boss_sun_turtle`, `boss_blade_crab`, `boss_flame_bull` | 152–215 × 125–183 px | 2.2–2.6 by bulk | idle 8, attack 6–8, hurt 4 |
| T5 people: `t5_nameless_sword_hermit`, `t5_blood_blade_lord`, `t5_poison_matriarch`, `t5_iron_monk` | 119–133 × 111–139 px | 1.05–1.2 | idle 8, attack 8, hurt 4 |
| T5 beasts: `t5_white_tiger`, `t5_wolf_king` | 161–170 × 114–118 px | 1.3–1.35 | idle 8, attack 8, hurt 4 |

**How they were made** (2026-10-07, about 440 generations):

1. **Design.** One `create_image_pro` call per subject (4 candidates at ≤ 170 px, 20–25 generations): a side view facing right on a transparent background — bosses on 168 px canvases, people 96 × 128, T5 beasts 128 × 96. The best candidate was picked by eye.
2. **Room to move.** The pick was placed on a larger canvas (bosses 224 wide with 30 px of headroom, people 152 × 140–144, beasts 176 × 120) so a lunge or a raised weapon is not cut off. Without an API token this was done inside PixelLab: the free `pixelart_workbench draw` with a one-node recipe (`canvas`, the view `offset`, one `copy` of the whole source) takes the candidate's download URL as its source and returns a hosted `full.png`. (Pasting a sprite as inline base64 into an MCP call is unreliable past a few KB: one came through garbled.)
3. **Object.** `create_object_pro_flash` with that URL as `first_frame_url` and `n_directions: 1` saves it as a one-direction object for free.
4. **Clips.** `animate_object` (v3, about 2–5 generations each at these sizes): idle 8 frames, attack 8, hurt 4, each prompt starting "side view, facing right". Every clip starts from the same object frame, so all clips share one canvas and stay registered. The object's ZIP (`/mcp/objects/<id>/download`) holds every take.
5. **Pack.** `bun scripts/build-anim-sheets.ts --from <raw>` reads `<raw>/<id>/{idle,attack,hurt}/NN.png`, takes the frames listed in its `SUBJECTS` table, crops every frame of a subject to their common drawn box (1 px margin), sets `feetY` from the start pose's lowest pixel, writes a palette PNG (the 12 sheets total about 770 KB) and rewrites the data file with a `?v=` content hash. Rerunning on the same frames changes nothing; `bun scripts/build-anim-sheets.ts --from <raw> <id>` rebuilds one sheet and keeps the others.

**Prompting lessons.** v3 drifts on long idles (a sword creeps up, a coil unwinds), so most idles play a ping-pong of their first five frames. "Hit reaction" prompts often draw a white impact flash or turn into a counter-strike; "is hurt by a blow to its face … shrinks back … No effects" gives a clean flinch. Say what must stay ("the sun orb stays fixed on top of the shell") or the model may spend it — the first turtle attack threw its sun away. The raw takes, picks and object ids stay in the raw directory, never in the repo.

**Boss re-rolls (2026-10-08, about 60 generations).** The first boss sheets had faults that were re-rolled on the same objects: the turtle's sun changed colour in idle and its fire jet ran off the frame ("keeps exactly the same colour… a SHORT burst of fire that stays close in front of its mouth"); the crab's attack drew a white X ("No slash marks, no white flash, no X shapes"); the tiger's, bull's and serpent's hurt clips barely moved ("recoils hard… crouches low and slides backward", picking the frames without an impact flash). The eagle stood on a painted rock, so it got a new design (`create_image_pro` with the old eagle as `style_image_url`, "standing directly on the ground on its two talons, no rock"), a new 224 × 184 object and three new clips. Two turtle hurt takes still invented things (a swirl, an arrow), so its hurt clip is hand-made with `pixelart_workbench draw`: the head cut out onto a layer behind the shell and slid back under it while the body rocks 2 px — every pixel stays the original. In battle every animated foe also flashes white, blushes red and is knocked back when hit (`grid-battle-runtime.ts`).

## PixelLab characters

People and beasts are being redrawn and animated by PixelLab, replacing the paintings rigged like paper puppets (`build-npc-sheets.ts`) and the creature atlas's stills. The styles were picked from three candidates per kind on 2026-10-08:

| Kind | Style | Made with |
| --- | --- | --- |
| people (heroes, NPCs, enemy types) | **B**: 128 px, selective outline, high detail, low top-down | `create_character` `mode: "v3"`, `size: 128`, `outline: "selective outline"`, `detail: "high detail"`, the description ending "vibrant saturated colors, rich shading, clean readable silhouette" (3 generations) |
| beasts | **C**: Pro Flash, 128 × 128 | `create_character_pro_flash`, `template_id: "dog"` (or the kind's template), "full body pixel art sprite of …, standing on four legs facing the viewer, vibrant saturated colors, crisp clean pixels, transparent background" (8 generations) |

**Clips** (`animate_character`, named with `animation_name` — the packers look clips up by that name):

| Name | Directions | How | Cost |
| --- | --- | --- | --- |
| `walk` | south, south-east, east, north-east, north (west-facing ones are mirrored) | v3 **loop**: `custom_start_frame_url` and `end_frame_url` both the same mid-stride frame, 8 frames: "one complete walking cycle in place… ends exactly back in the starting pose so it loops seamlessly; the sheathed sword stays at his hip in every frame". The closing frame repeats the first, so the clip uses `walk_loop#0-7` (beasts: template `walk-8-frames`) | 4 per direction |
| `idle` | south (the map) and east (battle) | template `breathing-idle` (beasts `idle`) | 1 per direction |
| `attack` | east | the draw (frames 5–6 of a first v3 take, "draws the jian sword and slashes forward…") then a v3 slash started from the drawn-sword frame (`custom_start_frame_url`), 10 frames: "lunges forward with a big step and swings the drawn sword in a wide, powerful diagonal slash from high overhead down to low in front, full body twisting into the blow with a bright white blade streak, then recovers into a ready stance holding the sword forward" — `["attack#5-6", "slash#1-10"]` | 4 + 5 |
| `hurt` | east | v3, 6 frames: "is hit by a blow, flinches and recoils one step backward, then recovers his footing; the sword stays sheathed at his hip, no punching, no effects" | 3 |
| `stance` | east | v3, 8 frames: "stands in a ready wuxia guard stance, knees bent, one hand on the sword hilt at his hip… no punching" — the guard pose | 4 |
| `victory` | east | v3, 8 frames: "raises the sword high overhead in triumph" | 4 |
| `defeat` | east | v3, 8 frames: "is struck hard, staggers backward, drops to his knees and collapses… lying still on the ground; the sword stays sheathed at his hip, no jumping, no kicking" | 4 |

A person costs about 50 generations (3 to create, about 47 to animate); a beast about 16. Twenty jobs can run at once per account.

**Loops and strikes.** A plain v3 clip drifts away from its first pose, so a walk built from it jumps when it wraps (the last-to-first difference was about twice a normal step). Giving the same frame as start and end makes v3 come back to it: the closing frame matched the first (pixel difference under 1 against 20–40 between steps), so dropping it gives a seamless loop. A one-shot "draws and slashes" spent most of its frames standing and drawing; starting a second clip from the drawn-sword frame gives the whole clip to the swing. Prompts asking for glow can wash the body out ("her robe keeps its colours" did not help; the diagonal-slash wording did).

**Templates redraw the figure; v3 keeps it.** A template clip (`walking-8-frames`, `taking-punch`, `falling-back-death`, `fight-stance-idle-8-frames`) is redrawn frame by frame from a bare skeleton: the sword came and went between walk frames, the hit and the fall started from a boxer's fists and the fall kicked into the air. Template `skeleton-v3` (the skeleton posed onto the character's own pixels) is steadier but still let the sword drift. v3 custom clips that say what must stay ("the sword stays sheathed at his hip in every frame") keep the outfit and weapon whole, so every person clip except the breathing idle is v3. A take is picked per clip in `scripts/pixellab-characters.json` (`clips`), so a re-roll under a new animation name replaces a clip without renaming anything. Check every walk direction by the feet: a foot in the air should move the way the body walks. m1's north take stepped backward (the lifted foot came toward the camera), so it plays reversed (`"walk:north": "walk_loop#7-0"`); `"walk:east"` picks a take for one direction only.

**Pipeline.**

1. `scripts/pixellab-characters.json` maps a game id to its PixelLab character id (`m1`, `f1`, `beast_wolf`…) and, optionally, which take each clip uses (`clips`).
2. `PIXELLAB_API_TOKEN=… python3 scripts/pixellab-characters.py <raw> [id …]` downloads rotations and every clip to `<raw>/<id>/rotations/<dir>.png` and `<raw>/<id>/<clip>/<dir>/NN.png` (the raw directory stays outside the repo).
3. People: `bun scripts/build-pixellab-sheets.ts --from <raw> [id …]` packs `public/art/characters/pl/<id>.png` and rewrites `lib/characters/pl-sheets-data.ts`. Frames keep their native pixels; a custom clip's larger canvas (172 px for a 128 px character) is aligned by its centre, and every frame stands on the south rotation's foot row. Cells are square (146–148 px for style B), eight to a row.
4. Beasts: add the kind to `BEAST_SHEETS` (`lib/characters/anim-sheets.ts`, by creature-atlas frame) and to `SUBJECTS` in `scripts/build-anim-sheets.ts`, then `bun scripts/build-anim-sheets.ts --from <raw> beast_<kind>`. It reads `<clip>/east/NN.png` and pads custom clips to one canvas; the beast then plays its sheet in battle, on the map and on the encounter screens (`opponentLook` → `beastSheetFor`).

**In the game.** A character id with a sheet in `pl-sheets-data.ts` loads it instead of its rigged sheet (`loadCharacterAtlas`, a missing PNG falls back to the rigged one). The atlas brings its own `clips` (8-frame walks), `battleIdle` (side-facing breathing), `walk8Cells` and `native: true`: renderers draw the cell `figureScale` larger so the 120 px figure stands as tall as a rigged 108 px one, the map skips the warm ink tint, the battle spreads the attack clip over the hit beats and leaves out the painted combat sheet (`<id>-combat.png`, another style). The work loops (`<id>-work.png`) are still the painted ones.

**Done so far** (2026-10-08, about 250 generations with the style round and the v3 re-rolls): heroes `m1`, `f1` (all clips) and `beast_wolf`.

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
