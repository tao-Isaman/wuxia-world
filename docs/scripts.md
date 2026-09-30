# Scripts

Every file in `scripts/`, what it does, and whether it is safe to run. Run them from the repo root with Bun (`bun scripts/<file>.ts`); they use the `@/` path alias from `tsconfig.json`. Test scripts are covered in [testing.md](testing.md).

## Contents

- [package.json commands](#packagejson-commands)
- [Checks and audits (read-only)](#checks-and-audits-read-only)
- [Generators (write files)](#generators-write-files)
- [Art and collision tools](#art-and-collision-tools)
- [Content rewriters](#content-rewriters)
- [One-off migrations — do not run](#one-off-migrations--do-not-run)
- [Test scripts](#test-scripts)
- [Review drivers](#review-drivers)

## package.json commands

| Command | Runs |
| --- | --- |
| `bun dev` / `bun run dev` | `next dev` on http://localhost:3000 |
| `bun run build` | `next build` |
| `bun start` / `bun run start -p 3017` | serve the production build |
| `bun run lint` | `next lint` (app, components, lib) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test:*` | the unit suites, see [testing.md](testing.md#unit-suites) |
| `bun run test:docs` | reference pages current + docs links / paths / commands resolve |
| `bun run test:e2e` | Playwright, see [testing.md](testing.md#browser-tests-playwright) |

## Checks and audits (read-only)

| Script | Usage | Does |
| --- | --- | --- |
| `audit-content.ts` | `bun scripts/audit-content.ts` | every NPC / quest / scene reference resolves; duplicate NPC or quest ids fail. Does not check drop tables |
| `audit-quest-completion.ts` | `bun scripts/audit-quest-completion.ts` | the campaign completability audit (in `test:quests`) |
| `audit-manual-names.ts` | `bun scripts/audit-manual-names.ts` | manual item names match the skill / art they teach |
| `audit-complete-scenes.ts` | `bun scripts/audit-complete-scenes.ts` | advisory: `qs_*_complete` scenes that do not fire `finishQuest` (33, all handled by the NPC card's safety net) |
| `audit-quest-counts.ts` | `bun scripts/audit-quest-counts.ts` | advisory: stage text numbers versus auto-advance counts (heuristic, many false alarms) |
| `audit-quest-flow.ts` | `bun scripts/audit-quest-flow.ts` | **legacy** offer → accept → complete heuristic; fails with 168 issues; use `audit-quest-completion.ts` |
| `smoke-liveness.ts` | `bun scripts/smoke-liveness.ts` | a 90-day NPC simulation smoke test with four checks |
| `check-docs.ts` | `bun scripts/check-docs.ts` | docs links, backticked repo paths, `bun run` names and `bun scripts/…` files resolve (in `test:docs`) |
| `audit-character-source-bounds.ps1` | `powershell -File scripts\audit-character-source-bounds.ps1 [-ReportPath …]` | source-art ownership of every character sheet. **Windows PowerShell only** |

## Generators (write files)

| Script | Usage | Writes | Notes |
| --- | --- | --- | --- |
| `build-docs-reference.ts` | `bun scripts/build-docs-reference.ts [--check]` | `docs/reference/*.md` | `--check` writes nothing and fails when a page is stale |
| `build-npc-sprites.ts` | `bun scripts/build-npc-sprites.ts` | `public/npcs/pixel/*.png` (72 px), `public/npcs/pixel-battle/*.png` (150 px), `lib/world/data/npc-pixel-ids.ts` | reads `public/npcs/body/*.png`; needs `sharp` |
| `build-pwa-icons.ts` | `bun scripts/build-pwa-icons.ts` | `public/pwa/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | source `public/player/m1.png`; needs `sharp` |
| `build-route-variants.ts` | `bun scripts/build-route-variants.ts` or `--preview <out.jpg> [type]` | `public/maps/routes/<type>-<region>.webp` | regional colour grades of the 7 road paintings; needs `sharp` |
| `build-jail-map.ts` | `bun scripts/build-jail-map.ts` | `public/maps/jail.png` | paints the jail in Chromium (hard-coded `/opt/pw-browsers/chromium`) |
| `build-map-footprints.ts` | `bun scripts/build-map-footprints.ts <dir>` | `lib/stage/world-footprints-data.ts` | rebuilds **the whole file** from `<dir>/<locationId>.json`. The JSON sources are not in the repo, so a partial folder drops every other map; edit the data file directly for small fixes |

`sharp` arrives through Next.js, not as a direct dependency. Add it to `package.json` if a future Next drops it.

## Art and collision tools

| Script | Usage | Does |
| --- | --- | --- |
| `map-collision-tool.ts` | `bun scripts/map-collision-tool.ts <locationId> [footprints.json] [overlay.png]` | prints marker coordinates, checks every NPC / exit / service is reachable from the spawn, and optionally draws footprints (red) and markers (green / magenta) over the map |
| `repack-character-sheet.ts` | `bun scripts/repack-character-sheet.ts <in.png> <out.png> [rows=4]` | re-packs a generated sprite sheet with uneven gutters onto an equal grid (no resampling); used for every "readability v2" sheet |
| `measure-sheet-gutters.ts` | `bun scripts/measure-sheet-gutters.ts <png> [rows=4]` | proposes a per-sheet layout from transparent gutters (older approach; layouts remain only for wang, feng, qing and m4's directions) |
| `render-character-atlas-audit.ts` | `node --experimental-strip-types scripts/render-character-atlas-audit.ts` | renders every character atlas in Chromium against a running app (`ATLAS_AUDIT_URL`, default http://127.0.0.1:3017) and checks for clipping; writes `review/character-atlas-audit/` |
| `measure-sprite-gutters.ps1` | `-ImagePath <png> -ReportPath <json> [-RowCount 4]` | gutter measurement of one sheet. **Windows PowerShell only** |

## Content rewriters

These rewrite source files. Run them, then review the diff.

| Script | Usage | Does |
| --- | --- | --- |
| `sort-by-sect.ts` | `bun scripts/sort-by-sect.ts` | re-sorts `SKILLS` and `ARTS` by `SECT_ORDER`, then tier, and regenerates the section headers. Idempotent |
| `normalize-t3-stats.ts` | `bun scripts/normalize-t3-stats.ts` | rewrites single-line skills in `skills.ts` so each `st` sums to 10 / 15 / 20 / 25 / 30 for tiers 0–4. It always writes the file; today it changes nothing |

## One-off migrations — do not run

Already applied. Kept for history only.

| Script | What it did | Why not to run it again |
| --- | --- | --- |
| `split-sects-file.ts` | split the sect NPC / quest / scene files into `sects/<file>.ts` + barrels (2026-05-10) | the barrels now hold only spreads; a rerun rewrites them to **empty arrays** |
| `append-templated-quests.ts` | appended the redemption and extra sect quests | a rerun **duplicates 20 quests** |
| `convert-equipment-st.ts` | moved equipment `st` into direct combat boosts | no-op today |
| `rework-poison.ts` | moved 6 poison skills to `poison_dmg` | no-op today, but would overwrite later edits to those skills |

## Test scripts

| Script | Suite |
| --- | --- |
| `test-runtime.ts` | `test:runtime` |
| `test-combat-actions.ts` | `test:combat` |
| `test-clinic-errand.ts`, `test-clinic-preparation.ts`, `test-capital-training.ts`, `test-quest-completion-receipt.ts`, `test-spy-greeting-exits.ts`, `test-lin-herb-dialogue.ts` | `test:opening` |
| `test-battle-background.ts` | `test:battle-background` |
| `test-lore-rumors.ts`, `test-rumor-formatting.ts` | `test:rumors` |
| `test-capital-investigation.ts` | `test:investigation` |
| `test-audio.ts` | `test:audio` |
| `test-law.ts` | `test:law` |
| `test-walk-cycle.ts` | `test:walk` |
| `test-grid-engine.ts` | `test:grid` |
| `test-grid-ai.ts` | `test:grid-ai` |
| `test-grid-skills.ts` | `test:grid-skills` |
| `test-grid-store.ts` | `test:grid-store` |
| `audit-quest-completion.ts`, `test-quest-dead-ends.ts`, `test-quest-turnins.ts`, `test-quest-guide.ts` | `test:quests` |
| `build-docs-reference.ts --check`, `check-docs.ts` | `test:docs` |
| `test-world-vignettes.ts` | none — passes; run it by hand |

`test:navigation` runs the `bun test` files `lib/stage/world-navigation.test.ts` and `lib/stage/world-placement.test.ts`.

## Review drivers

Old evidence drivers live in `review/`, not `scripts/`. See [review/README.md](../review/README.md): they target a running app on :3017, and most describe the pre-Phaser, pre-grid game.
