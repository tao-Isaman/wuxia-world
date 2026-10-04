# The engine (`/game/engine`)

The game's own editor: a desktop tool for the asset library, the maps and the skill / art texts. It lives at `/game/engine`, is not linked from the game, and carries `robots: noindex` (`app/game/engine/layout.tsx`).

## Contents

- [Layout](#layout)
- [Saving: dev vs deployed](#saving-dev-vs-deployed)
- [คลังภาพ (asset library)](#คลังภาพ-asset-library)
- [แผนที่ (map editor)](#แผนที่-map-editor)
- [วิชา (skill and art texts)](#วิชา-skill-and-art-texts)
- [Text overrides in the game](#text-overrides-in-the-game)
- [Files](#files)
- [Tests](#tests)
- [แผนที่ / Map editor](#แผนที่--map-editor)

## Layout

- `app/game/engine/page.tsx` renders `EngineApp` (`components/engine/engine-app.tsx`): a header with three tabs — คลังภาพ · แผนที่ · วิชา — and a save-mode chip. The last tab is remembered per browser (`localStorage["wuxia-engine-tab"]`).
- It is **not** the landscape-locked game HUD. It scrolls, is laid out for a desktop (three columns: filters · list · detail, stacking below 1100 px and 700 px), and is styled by `app/game/engine/engine.css`, all scoped under `.engine-root`.
- The root carries `data-engine-root`; `app/globals.css` uses `:has([data-engine-root])` to switch off the portrait 90° turn and restore real `--vw` / `--vh` while the engine is open.

## Saving: dev vs deployed

Saving goes through `saveEngineFile(key, data)` (`lib/engine/save.ts`), which POSTs `{ key, json }` to `/game/engine/api/save` (`app/game/engine/api/save/route.ts`).

| Where | `GET /game/engine/api/save` | Saving |
| --- | --- | --- |
| `bun dev` (or any server with `ENGINE_WRITE=1`) | `{ writable: true }` — chip **บันทึกลงไฟล์ได้ (dev)** | writes the file into the repo; commit it |
| a production build / the deployed site | `{ writable: false }` — chip **อ่านอย่างเดียว · บันทึกจะดาวน์โหลด** | the route answers 403 and the browser downloads the JSON; put it in place in the repo and commit |

- The route writes only the three whitelisted files in `ENGINE_FILES`: `public/assets/manifest.json`, `public/assets/placements.json`, `lib/game/data/text-overrides.json`. `lib/engine/save-policy.ts` holds the rules (`engineWritable`, `isEngineFileKey` — own keys only, so `toString` or `__proto__` are refused — and `checkSaveRequest`, which also parses the JSON).
- **Drafts.** Unsaved edits stay in this browser's `localStorage` (`wuxia-engine-draft-manifest`, `wuxia-engine-draft-text`, `lib/engine/draft.ts`, every access in try/catch) until they are saved to a file or discarded (ทิ้งการแก้ไข). After a download the draft is kept, because the repo file has not changed yet.

## คลังภาพ (asset library)

`components/engine/asset-library.tsx`, `asset-detail.tsx`; pure helpers in `lib/engine/asset-edit.ts`.

- Loads `public/assets/manifest.json` (`loadAssetManifest`, see `lib/assets/types.ts` for the `AssetEntry` shape). The asset pipeline fills it; the engine only edits fields.
- **Filters:** category (with counts), subcategory, region (`any` assets match every region), sect, status (draft / approved / rejected / all) and a text search over the name, id and tags (Thai or English). The grid shows 60 thumbnails a page, lazily loaded, pixelated on a checkerboard; 3,500 entries stay fast.
- **Detail:** a big preview with the anchor (blue cross) and the footprint (red box) drawn over it — drag the box to move it, drag a corner to resize; the numbers follow in map units relative to the anchor (`footprintToImage` / `footprintFromImage`). All 8 views when the asset has them. Editable: name, tags, subcategory, layer, flippable, map width / height, footprint (on / off and x, y, w, h) and status (ร่าง / อนุมัติ / ปฏิเสธ). คืนค่าเดิม drops the asset's edits.
- **Bulk:** tick thumbnails (or Shift / Ctrl-click; เลือกทั้งหน้า) → set status, add or remove tags.
- Edits are a map of changed fields per id (`mergeAssetEdit` drops a field set back to its value); **บันทึก manifest** saves the whole manifest with them applied and a fresh `generatedAt` (`editedManifest`). The map editor receives the assets with the edits applied.

## แผนที่ (map editor)

Places library assets on the 100 painted maps and saves `public/assets/placements.json`; the full guide is [แผนที่ / Map editor](#แผนที่--map-editor) below.

## วิชา (skill and art texts)

`components/engine/skill-text-editor.tsx`; pure helpers in `lib/engine/text-edit.ts`.

- A table of all 178 skills and 122 arts (not the `none` placeholder), filtered by kind, sect (`sc`), tier (`ti`), weapon family (`w`, skills only), text, edited only, problems only.
- Only the **name** (`n`) and **description** (`d`) are editable. Numbers are shown read-only in short Thai (`skillNumbers`, `artNumbers`). Arts have no description in the table; one set here shows on the art card, the skills window and the sect hall.
- The preview is the game's own card (`SkillCard` / `ArtCard` from `components/world/skill-tooltip.tsx`), updated as you type.
- **Validation** (`validateTextRows`): a name must not be empty, longer than 32 characters (`NAME_MAX`) or the same as another move of its kind (an error when an edit causes it; the table's own `เงาสังหาร` pair is a warning); a description may be at most 140 characters (`DESC_MAX`). A warning comes when a quest that teaches the move names it in its name, summary or description — the game's rule is that quests say วิชาลึกลับ, and `test:story` fails on it ([story-quests.md](story-quests.md)). The detail panel also lists every quest whose text mentions the name (`questsMentioning`; the quest index loads lazily from `lib/engine/quest-text.ts`). Saving is blocked while there are errors.
- **บันทึกข้อความวิชา** saves `lib/game/data/text-overrides.json` with only the changed fields, sorted by id (`overridesToSave`).

## Text overrides in the game

- `lib/game/data/text-overrides.ts` imports the JSON and lays it over the tables at module load: `SKILLS` and `ARTS` are `withTextOverrides(table, [ … ])`, so `SKILLS_BY_ID`, `getSkill`, `getArt`, the scroll items, the reference docs and every screen show the override.
- Unknown ids and blank names are ignored (`normalizeTextOverrides`, `applyTextOverrides`); `BASE_TEXT` keeps the table's own text for the editor.
- The literal arrays still start right after `= withTextOverrides<…>("…", [`, so `bun scripts/sort-by-sect.ts` and `bun scripts/normalize-t3-stats.ts` work as before.
- **After saving overrides**, run `bun scripts/build-docs-reference.ts` (the reference lists skill names) and `bun run test:story` (a renamed move must not appear in its quest's text), then commit.

## Files

| File | What |
| --- | --- |
| `app/game/engine/page.tsx`, `layout.tsx`, `engine.css` | the route, metadata (`noindex`), styles |
| `app/game/engine/api/save/route.ts` | GET: writable? · POST: write a whitelisted file (dev only) |
| `components/engine/engine-app.tsx` | tabs, save-mode chip, manifest + edits state, notices |
| `components/engine/asset-library.tsx`, `asset-detail.tsx`, `labels.ts` | the asset library |
| `components/engine/map-editor.tsx` | the map editor (map team) |
| `components/engine/skill-text-editor.tsx` | the skill / art text editor |
| `lib/engine/save.ts`, `save-policy.ts`, `draft.ts` | saving, the route's rules, local drafts |
| `lib/engine/asset-edit.ts`, `text-edit.ts`, `quest-text.ts` | pure helpers |
| `lib/game/data/text-overrides.ts`, `text-overrides.json` | the overrides and how the tables take them |

## Tests

- `bun run test:engine` (`scripts/test-engine.ts`): overrides change a name / description and ignore unknown ids, the committed file is applied, the draft keeps only changes, validation, text filters, asset filters / paging / edits / bulk, footprint geometry, and the save route's whitelist.
- `tests/browser/engine.spec.ts` (Playwright, with a fixture manifest and images from `tests/fixtures/engine/`): filters, the detail panel, a footprint drag, the draft across a reload, discard, bulk reject, the download fallback on a production server, the map tab, the skill editor's filters, live preview and validation, the saved overrides file, no portrait turn, and no link from the game.

## แผนที่ / Map editor

Places objects from the asset library on the 100 painted location maps. The game draws them with the same geometry and adds their footprints to the map's collision — see [rendering.md](rendering.md#placed-objects).

### Files

| File | What |
| --- | --- |
| `components/engine/map-editor.tsx` | `MapEditor({ assets })`: the layout, the working file, history, shortcuts, save, draft, play-test |
| `components/engine/map-editor/model.ts` | pure: undo / redo history, ids (`p_000123`), edits, `normalizeFile` |
| `components/engine/map-editor/map-stage.tsx` | the map view: painting, placed objects, overlays, markers, pointer gestures |
| `components/engine/map-editor/asset-palette.tsx` | the approved assets: filters, thumbnails, arm / drag |
| `components/engine/map-editor/inspector.tsx` | the selection's fields and the map's warnings |
| `components/engine/map-editor/kit-brush.tsx` | ชิ้นต่อกัน: the road / wall kit sets, paint / erase, their gates |
| `lib/assets/kits.ts` | pure: kit sets, the grid, joins (`paintKit`, `placeKitSpecial`) |
| `components/engine/map-editor/map-editor.module.css` | the tool's styles |
| `lib/assets/placement-geometry.ts` | where a placement draws and what it blocks; shared with the game |
| `lib/stage/map-anchors.ts` | the map's fixed points and `placementIssues` |
| `lib/engine/goto.ts`, `components/world/engine-goto.tsx` | the play-test hook in the game |

The engine page renders `<MapEditor assets={manifest.assets} />` in its แผนที่ tab, passing every asset in the manifest; the palette offers only approved ones (`queryAssets`), while placed objects of any status still draw.

### Using it

- **Maps.** The left column lists every painted location map (`home_player`, `city_capital`, `jail` and the auto maps) by Thai name and id, with a search box and the number of objects on each. The last map is remembered (`localStorage["wuxia-engine-map"]`).
- **View.** The painting at fit size; the mouse wheel zooms about the cursor (50 %–800 %), Space-drag, Alt-drag or the middle button pans, and the bar under it has − / พอดีจอ / + and the cursor's map coordinates.
- **Markers** (read-only, toggle จุดสำคัญ): NPC spots and the spawn drawn as standing figures at the game's character depth, so objects in front cover them as in the game; exits, service spots and the arrival spot beside each exit (มาจาก…) as labelled pins.
- **Overlays.** ฐานวัตถุ shows each object's footprint (solid red: blocks; dashed: walk-through); เส้นชนของแผนที่ shows the painting's own solids (`worldFootprints`) in blue; สแนปกริด snaps placing, dragging and nudging to a 4 / 8 / 16 / 32-unit grid and draws it.
- **Placing.** Filter the palette by category, region, sect or text; click a thumbnail to arm it and click the map to place it (Shift-click keeps it armed), or drag a thumbnail onto the map. An 8-direction asset starts on its S view.
- **Editing.** Click to select, Shift / Ctrl-click to add or remove, drag on empty ground to box-select (Shift adds). Drag to move. The inspector sets x / y, scale (slider or number), flip (only for `flippable` assets), layer (ground / object / overhead, or the asset's default), collide (the asset's default, always, never) and the 8-direction view, and has ทำซ้ำ and ลบ.
- **Depth preview** is the game's rule (`placementDepth`): the DOM draws back to front by the same depth values.
- **Warnings.** A footprint over an anchor (spawn, arrival spot, NPC, exit, service, the horse station or tournament ring, or the spot the hero walks to for one) and a marker the spawn can no longer reach are listed under the inspector (click one to select the object) and marked red on the map. The check runs after each edit paints (`useDeferredValue`); the map's own probe is cached. Quest objective spots (🔍) are placed at run time near the spawn and are not checked; keep the ground around the spawn clear. Objects whose asset is missing from the manifest show as red dashed boxes.

### พื้น (ground)

The **พื้น** select in the toolbar replaces a map's painting with one ground tile repeated over the map (the library's solid Wang fills; `placements.json` `grounds`). With a ground, the painting's own collision and foreground cut-outs are gone in the editor and the game — only placed objects stand and block — so a map can be built entirely in the engine. ภาพวาดเดิม brings the painting back. The setting is part of the working file (undo, draft, save, play-test).

### ชิ้นต่อกัน (kit brush)

The panel above the palette paints roads, city walls, house walls and fences from the library's kits ([assets.md](assets.md#kits-roads-and-walls-that-join)):

- **Pick a set** under the ถนน / กำแพงเมือง / กำแพงบ้าน tabs (fences are with the house walls; plazas with the roads). **แนวทแยง** (on by default) lists the iso sets that lean like the isometric buildings; off, the square-grid ones. The map shows the set's grid — diamonds for iso sets, squares (48 for roads, 32 for walls) otherwise — and the cell under the cursor.
- **Paint.** Click a cell, or drag: the stroke fills the cells along the drag (each touching the last), and every piece picks itself from its neighbours — straights, corners, T-junctions, crossings and ends. One stroke is one undo step.
- **Erase.** ⌫ ลบ, or hold Shift while dragging: pieces come out and the rest re-join (a corner becomes two ends).
- **Gates.** ＋ ประตู… arms the set's gate; click the map and it snaps to the grid, replaces the wall pieces under it, and the run on each side joins it. Its passage stays walkable; the piers block. The brush never moves or erases a gate (select it and press Delete).
- A kit piece armed from the palette also snaps to its grid. Pieces of different sets don't join each other, so a road can run under a gate. Esc leaves the brush.

### Shortcuts

| Key | Does |
| --- | --- |
| Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y | undo · redo (unlimited; a slider drag is one step) |
| Delete / Backspace | delete the selection (undo brings it back selected) |
| Arrow keys | nudge 1 unit (Shift: 10; with the grid on, one grid step) |
| Ctrl+D | duplicate (+16, +16) |
| Ctrl+A | select every object on the map |
| Esc | disarm the palette, else leave the kit brush, else clear the selection |

Shortcuts are ignored while a text field has focus or the editor is hidden.

### Saving

- **บันทึก** writes every map's placements, normalized (maps sorted, empty maps dropped, default fields left out), with `saveEngineFile("placements", file)` to `public/assets/placements.json`; outside `bun dev` the JSON downloads instead. The status reads ● ยังไม่บันทึก until then.
- **Draft.** The working file is kept in `localStorage["wuxia-engine-placements-draft"]` while it differs from the saved one, and reopened on the next visit; the page asks before closing with unsaved changes. ทิ้งการแก้ไข returns to the saved file.
- Commit `public/assets/placements.json` after saving, then run `bun run test:placements`: it fails on unknown maps or assets, duplicate ids, objects off the map, and any object that covers or cuts off a marker.

### เล่นทดสอบ (play-test)

The button opens the game in a new tab at the current map, with the editor's unsaved objects:

1. It stores the working file in `localStorage["wuxia-engine-preview"]`, sets the local flag `localStorage["wuxia-engine-goto"] = "on"` and opens `/?engineGoto=<locationId>&enginePreview=1`.
2. In the game, `EngineGoto` (`components/world/engine-goto.tsx`, mounted in `app/page.tsx`) runs only under `bun dev` or with that flag. Once the save has loaded it copies the save to `localStorage["wusia-world-v1:before-engine-goto"]`, then sets the current scene and last location to the map (no travel cost, no time, no `onEnter` effects; roaming foes cleared), and removes `engineGoto` from the address. It does nothing without a started game, during a battle, an encounter, a game over or a jail term.
3. `enginePreview=1` marks the tab (sessionStorage) so `loadMapPlacements` draws the stored working file instead of fetching `placements.json`.

To undo a jump by hand, copy `wusia-world-v1:before-engine-goto` back over `wusia-world-v1` in the browser's storage and reload. To turn the hook off in a production build, remove `wuxia-engine-goto`.

### Tests

- `bun run test:placements` (`lib/stage/placements.test.ts`): geometry (anchor, scale, flip, views, overrides), depth against characters, a footprint blocking movement and paths routing around it, maps without placements unchanged, path planning time with 40 objects, the checker, and the committed `placements.json`.
- `tests/browser/placements.spec.ts` serves a fixture manifest and placements (`tests/fixtures/placements/`) with `page.route`: the game draws them (`data-placements`) and the hero cannot walk through the crate but taps around it; `engineGoto` and the preview; the editor places, drags, nudges, undoes / redoes, deletes, warns and saves (the save route is stubbed). `MAP_EDITOR_URL` points the editor test at another page; it skips when `/game/engine` is missing.
