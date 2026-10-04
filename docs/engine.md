# Engine

`/game/engine` is the in-browser tool for editing game data: the asset library (คลังภาพ), maps (แผนที่) and skills (วิชา). Edits are saved with `saveEngineFile` (`lib/engine/save.ts`): under `bun dev` (or `ENGINE_WRITE=1`) the save route writes the file into the repo to be committed; anywhere else the browser downloads the JSON instead.

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

### Shortcuts

| Key | Does |
| --- | --- |
| Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y | undo · redo (unlimited; a slider drag is one step) |
| Delete / Backspace | delete the selection (undo brings it back selected) |
| Arrow keys | nudge 1 unit (Shift: 10; with the grid on, one grid step) |
| Ctrl+D | duplicate (+16, +16) |
| Ctrl+A | select every object on the map |
| Esc | disarm the palette, else clear the selection |

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
