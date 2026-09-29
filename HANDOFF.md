# Handoff: wusia-sim-web, from Codex agent-175 to the next agent

Written by the orchestrator on 2026-09-29 after agent-175 (Codex) hit its usage limit
at 10:59 local. Codex credits reset on Oct 5 2026 12:20 PM. The next agent runs on
Claude Code and continues from this worktree's branch.

## Where the work lives

- Worktree: `D:\wusia-sim-web-wt\agent-175`, branch `pt/agent-175`, based on `main` at `f43819b` (PR #14).
- The 15 hours of work from 2026-09-28 19:25 to 2026-09-29 10:59 was uncommitted when the agent
  stopped. The orchestrator committed it as a single WIP commit on `pt/agent-175` so a new
  worktree can branch from it. Nothing is pushed. Nothing is merged to `main`.
- Shared coordination notes: `D:\wusia-sim-web\.pterminal\shared.md` (read the agent-175 entries, waves 7 to 10).
- Design and art notes: `DESIGN.md`, `public/art/README.md`.
- Live journal used by the review critics: `public/progress.json`, served at `/progress`.
- Review evidence, critic reports, screenshots: `review/` (latest: `review/wave10-visual-critic.md`, `review/wave10-visual-play/`).

## What the project is now

A Next.js 15 / React 19 wuxia sim. Exploration and battle render through Three.js
(`lib/three/`, `components/game/world-canvas.tsx`, `components/game/battle-canvas.tsx`).
Pure world and combat rules stay in `lib/game/` and `lib/world/`; state in `store/`.
Save format is version 19 and must stay loadable (a version-18 migration test exists).

History that matters: an earlier Phaser.js runtime was built and then removed when the
engine target changed to Three.js. Do not reintroduce Phaser.

Content at the stop: 155 NPCs, 276 unique quests, 986 scenes, all references resolve.
Art: 15 characters, 23 sprite sheets, 304 poses under `public/art/characters/`.

## Verified state at the stop

- `bun run build` passes. Main route first-load JS 471 kB, `/progress` 111 kB.
- `bun run typecheck` passes. `bun run lint` has 6 pre-existing warnings, no errors.
- `bun run test:runtime` (10), `test:combat` (12), `test:navigation` (18), `test:opening`,
  `test:rumors`, `test:investigation`, `test:battle-background` pass.
- `bun run test:e2e` (Playwright, Chromium only, emulated phones): all 11 production browser
  cases pass together in about 2.6 minutes. Run against a production build, not `next dev`.
- Content audit: `bun scripts/audit-content.ts`.
- A production preview was served at http://127.0.0.1:3017. That process is probably gone; restart
  with `bun run build && bun run start -p 3017` (or whatever port the tests expect; check `playwright.config.ts`).

## Review loop the previous agent used

Each wave: builder makes changes, rebuilds, reruns the suites above, then a fresh subagent
"critic" plays the production build and writes `review/waveN-*.md` against two reference games
(Hero's Adventure and Dokapon Kingdom, captures in `review/baseline/`). The recurring critic
verdict through wave 9 and 10: locations look good, but character and event staging still falls
short of the references. Actors read as "soft clusters" at faces, hands and cloth edges at combat scale.

## Open items, in priority order

1. Wave 10 critic verdict on the new production output was still pending. The neutral A/B on the
   hero sprite chose candidate B (larger face, clearer hands and sleeves, stronger punch silhouette).
   Full cast, new directions and actual battle playback still need review.
2. "Readability v2" sprite candidates were being generated when the limit hit: f1, f2, m1, m2, m3,
   merchant, monk (`public/art/characters/*-readability-v2*`). The m1 candidate is NOT active in the
   game. Nothing from v2 is wired in yet. Decide whether to adopt them, then update the atlas and
   rerun the art-loading test.
3. Clinic local-return pacing and ledger acknowledgment followup was underway. Check the diff in
   `lib/world/clinic-preparation.ts`, `components/world/dialog-stage.tsx` and the scenes-content files.
4. Visible choice numbering correction in dialogue was done but awaited a rebuild to verify.
5. Known but unfixed from the first scan: character names flow into raw HTML in battle logs
   (`components/game/battle-log.tsx`), so escape them. The 30 authored lore rumors are seeded only
   by the smoke script, not at runtime.
6. Unverified areas: the full campaign end to end, and collision on every map. Only opening, home
   and capital flows were browser-tested.

## Suggested first hour for the new agent

1. Read `shared.md` agent-175 entries and `DESIGN.md`.
2. `bun install`, `bun run build`, `bun run typecheck`, `bun run test:e2e`. Confirm the numbers above.
3. Open the preview on a phone-sized viewport and play the opening through the clinic quest and
   one capital battle. Compare against `review/wave10-visual-critic.md`.
4. Pick up open item 1 or 2 and keep the wave cadence: change, rebuild, test, critic, note in `shared.md`.

## Coordination rules

- Append progress to `D:\wusia-sim-web\.pterminal\shared.md` under a new heading with your agent name.
- Message the orchestrator with a `{"to":"orchestrator","from":"<agent>","text":"..."}` line in
  `D:\wusia-sim-web\.pterminal\messages.jsonl`. Write UTF-8 with no BOM (see README-agents.md).
- Commit as you go on your own `pt/<agent>` branch. Do not leave a day of work uncommitted again.
