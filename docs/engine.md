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

`components/engine/map-editor.tsx` (`MapEditor({ assets })`) is owned by the map team; it places library assets on maps and saves `public/assets/placements.json`. Until it lands, the tab shows a กำลังพัฒนา note.

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
