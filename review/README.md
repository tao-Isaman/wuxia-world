# Review evidence (historical)

This folder holds the critic reports and evidence from the visual and UX review loop of **2026-09-28 and 2026-09-29** (waves 7–12).

**Everything here is history.** Every report predates:

- the Phaser port (wave 14);
- the grid tactics battle (PR #28);
- the mobile HUD and quest tracking.

Many describe things that no longer exist: the Three.js renderer, the 1v1 Attack / Guard / Recover battle, the journey guide panel, the เมนู command box. For the current state, read [HANDOFF.md](../HANDOFF.md), the [changelog](../docs/changelog.md) and the guides in [docs/](../docs/README.md).

## What is and isn't in git

- **Tracked:** the reports, JSON and text evidence, and the driver scripts.
- **Local only:** screenshots and videos (`review/**/*.png`, `*.jpg`, `*.webm`, `*.zip` are git-ignored). A fresh clone has none of them, so many image links in the reports do not resolve.
- **Missing:** `.pterminal/` (a Windows-side coordination folder) and `review/wave10-evidence/` are not in the repo.

## Reports

| Report | Date | Phase | What it judged |
| --- | --- | --- | --- |
| `baseline-critic.md` | 2026-09-28 | before wave 7 | named visual comparison with Hero's Adventure / Dokapon; biggest gap: actors vs environment |
| `combat-critic-1.md` (+ `combat-critic-1/first-visual-judgment.md`) | 2026-09-28 | old 1v1 battle | function vs layout; landscape 844 × 390 failed |
| `combat-critic-2.md` | 2026-09-28 | old 1v1 battle | independent live combat review; a touch bug on stat taps |
| `world-critic-1.md` (+ `world-critic-1/initial-ab.md`) | 2026-09-28 | Three.js world | anonymous A/B and world play |
| `world-critic-2/report.md` | 2026-09-29 | Three.js world | live world review |
| `world-final-critic.md` | 2026-09-28 | Three.js world | recheck; remaining gap: NPC cast distinctness |
| `whole-game-critic.md` (+ `whole-game-critic/play-notes.md`) | 2026-09-28 | opening | the first reward loop through ordinary play |
| `opening-final-critic.md` (+ `opening-final-evidence/acceptance.md`) | 2026-09-28 | opening | the opening works; upgrade presentation gap |
| `journey-guide-review.md` | 2026-09-29 | first-session guide | the journey guide panel (removed in wave 16) |
| `wave7-whole-critic.md` | 2026-09-29 | wave 7 | the opening; NPCs read as service points |
| `wave8-whole-critic.md` | 2026-09-29 | wave 8 | running-game critique including the ledger quest start |
| `wave9-whole-critic.md` | 2026-09-29 | wave 9 | opening and investigation; staging gap |
| `validation.md` | 2026-09-29 | wave 10 | build sizes, lint, test counts, 11 e2e cases, content audit at that time |
| `wave10-visual-critic.md` | 2026-09-29 | wave 10 | production screenshots vs the reference, neutral A/B |
| `m1-readability-v2-technical.md` | 2026-09-29 | wave 10 | A/B render check of the m1 v2 sprite candidate (uses the removed Three.js runtime) |
| `character-atlas-extraction-audit.md` | 2026-09-29 | atlas extraction | 23 sheets / 304 poses, pixel ownership |
| `atlas-fresh-critic.md` | 2026-09-29 | atlas | visual integrity of all 304 normalized poses |
| `wave12-ui-critic.md` | 2026-09-29 | wave 12 | UI vs Hero's Adventure, about 65–70 % |
| `wave12-ui-critic-2.md` | 2026-09-29 | wave 12, second pass | about 74 %; status of the first pass's items |
| `world-navigation/README.md` | 2026-09-29 | world renderer | collision circuits, directional frames |

Other tracked files include:

- `visual-comparison.html` (its images are not present);
- `battle-three/` (three JSON files from the old battle);
- `clinic-errand/`;
- the source-bounds JSON files;
- one-off `.cjs` checkers (`check-*.cjs`, `verify-lazy-art.cjs`, `run-baseline.cjs`, …).

## Drivers

All drivers expect the app on http://127.0.0.1:3017.

| Driver | Output | State |
| --- | --- | --- |
| `ui-driver.ts [label]` (`node --experimental-strip-types`) | `ui-evidence/<label>/` screenshots at three viewports | **stale**: clicks the removed เมนู button |
| `wave11-driver.ts` | `wave11-evidence/` | pre-grid: expects an attack button to strike at once; still captures |
| `npc-driver.ts` | `ui-evidence/npcs/` | plausible |
| `route-driver.ts <routeSceneId…>` | `ui-evidence/routes/<id>.png` | plausible |
| `*.cjs` (about 24 files) | per-report evidence | one-offs; some hard-code Windows paths |
| `*.ps1` | source-bounds JSON | Windows PowerShell only |

The TypeScript drivers typecheck and launch Chromium without an explicit path, so in the cloud container they need `PLAYWRIGHT_BROWSERS_PATH` and the Chromium shim described in [docs/testing.md](../docs/testing.md#cloud-container-notes).

## The /progress page

`/progress` (`app/progress/page.tsx`) was the live journal of this loop. Its data, `public/progress.json`, stopped at **wave 11**, so it is history too.

## If the review loop restarts

New reports should:

- state the commit they judged;
- keep screenshots local (they are git-ignored) or commit small ones on purpose;
- land in a dated folder here, with a line added to the table above.
