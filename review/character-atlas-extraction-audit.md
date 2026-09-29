# Character atlas extraction — builder audit

2026-09-29. This audits source integration and rendered poses, not ordinary gameplay or parity with commercial games.

The original loader assumed equal 4×4 source cells. Authored sheet gutters differ: Wang's idle shoes extend 21 rows below the first equal-grid boundary, his victory hand starts 14 rows above the fourth cell row, and his punch extends 18 columns into the next cell. Qing's raised document starts at y931, above the old y941 boundary. Similar smaller cuts occurred in the older base sheets and m4's directional sheet.

`catalog.ts` now records measured row/column boundaries, per-row gutters where necessary, and stepped source regions for three intact poses whose bounding boxes overlap in otherwise transparent space. `sheet.ts` measures and draws those regions with one common transform per pose. No PNGs were edited; no disconnected props or body parts were discarded. Qing has his own character ID and `city_capital_clerk_qing` mapping.

The repeatable read-only ownership audit covers **23 sheets / 304 poses**. All source coordinates are assigned once, including transparent pixels. All **12,422,089 pixels with alpha ≥32** (the loader's existing measurement threshold) are retained in their assigned regions. There are zero overlapping regions, unassigned coordinates, empty poses, or eight-connected visible strokes crossing between different pose owners. The old equal grids cut 6,689 boundary pixels. Detailed bounds are in [character-source-bounds.json](character-source-bounds.json).

The separate Chromium diagnostic bundles the actual workspace `loadCharacterAtlas`, renders its canvases, checks every normalized pose is nonempty and clear of its 128px cell edges, and verifies base/full cache behavior. I opened and visually inspected all 15 source-versus-atlas comparison sheets. Wang has no detached shoe fragments above walking poses. Extended punches, raised hands, m4's directional heads, Qing's raised document and his fallen document in the seated pose are intact. Feet align consistently, while crouching and seated poses retain their shorter authored height. Four-frame idle motion remains subtle; this correction does not add new animation content.

Representative evidence: [Wang](character-atlas-audit/wang-comparison.png), [Feng](character-atlas-audit/feng-comparison.png), [Qing](character-atlas-audit/qing-comparison.png), [stepped punch region](character-atlas-audit/f2-comparison.png), [directional heads](character-atlas-audit/m4-comparison.png). All fifteen comparisons and the numerical browser report are in `character-atlas-audit/`.

**Scope:** the running production server returned 404 for the newly added Qing PNG. The diagnostic therefore fulfilled artwork requests from workspace files using Playwright routing in its own browser. The loader was the actual workspace implementation. The production server was not rebuilt or restarted, and the diagnostic browser was closed. Production map placement and quest behavior require the coordinator's subsequent build and gameplay check.

Repeat commands, from the workspace root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\audit-character-source-bounds.ps1 -ReportPath review\character-source-bounds.json
node --experimental-strip-types scripts/render-character-atlas-audit.ts
```

TypeScript passed; lint retained six pre-existing warnings. Diagnostic temporary modules use `.js` so concurrent TypeScript checks remain unaffected.
