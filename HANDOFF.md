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

A Next.js 15 / React 19 wuxia sim. Exploration and battle render through Phaser 4
(`lib/stage/`, `components/game/world-canvas.tsx`, `components/game/battle-canvas.tsx`):
WebGL 1 when available, Phaser's Canvas renderer otherwise.
Pure world and combat rules stay in `lib/game/` and `lib/world/`; state in `store/`.
Save format is version 19 and must stay loadable (a version-18 migration test exists).

History that matters: an early Phaser 3 prototype was replaced by Three.js (r186), and
wave 14 moved both runtimes back to Phaser 4 at the user's request. Three.js required
WebGL 2 and showed nothing on old or GPU-blocklisted browsers; Phaser falls back to Canvas.

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
"critic" plays the production build and writes `review/waveN-*.md` against the reference game.
**As of 2026-09-29 the single benchmark is Hero's Adventure: Road to Passion** (Steam app 1948980;
manifest `review/baseline/reference-1948980.json`, captures fetched locally as `ref-1948980-*.jpg`,
which are gitignored). Dokapon Kingdom is no longer a goal; older wave reports still mention it as history. The recurring critic
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

## Takeover log

### 2026-09-29 — Claude Code agent (resumed-7116b3f9) takes over

- Read this doc. Could not read `D:\wusia-sim-web\.pterminal\shared.md` from the worktree
  sandbox (permission denied outside the worktree); waves 7 to 10 notes still need a re-read
  once access is granted.
- Verified on this branch: `bun run typecheck` passes. Build, lint, unit suites and e2e not
  yet re-run by the new agent.
- `.gitignore` now excludes `.pterminal/` so coordination files never land in a commit.
- Branch `pt/agent-175` pushed to `origin` (github.com/tao-Isaman/wuxia-world) so the WIP
  commit `e50bcf1` is no longer local-only.
- Planned first task: open item 2 (readability-v2 sprites), folding in item 5
  (escape names in `components/game/battle-log.tsx`) in the same wave.

### 2026-09-29 — wave 11 (Claude Code, branch `claude/nice-lamport-hc9w5n`)

Benchmark narrowed to Hero's Adventure: Road to Passion only (DESIGN.md, `/progress`, Dokapon manifest removed).

Baseline re-verified before changes: build, typecheck, lint (6 warnings, 0 errors), all 7 `test:*`
suites, content audit, and `test:e2e` 11/11 against the production build.

Status of the open items above:
1. Wave-10 visual gap: addressed by items 2 and the two HUD changes below. Evidence:
   `review/wave11-evidence/` (`review/wave11-driver.ts`, production build on :3017).
2. **Readability v2 sprites adopted** for m1–m4, f1–f4, elder, monk, merchant and bandit (+ v2
   north/south supplements for m1, m2, m3, f1). They were re-packed onto exact equal grids by
   `scripts/repack-character-sheet.ts` (component clustering, no resampling). The old sheets are kept as `*-v1.png`.
   Character atlas audit: 304 poses, none empty or clipped. Still to do: v2 north/south supplements for m4, f2, f3, f4.
3. Clinic pacing/ledger: covered and passing in `test:opening`, `test:investigation` and the e2e opening/investigation cases.
4. Choice numbering: verified visible ("1.", "2.") in the production dialogue capture.
5. Both sub-items were already fixed: `escapeBattleText` in `lib/game/effects.ts`, and
   `seedLoreRumors` runs at runtime in `store/world-store.ts`.
6. **Collision: done for all 100 painted maps.** `home_player` and `city_capital` keep their hand-tuned
   shapes. The other 98 now have 850 grounded footprints (building bodies, wells, stall tables, ponds, rock
   piles, tree clumps) in `lib/stage/world-footprints-data.ts`, generated by `scripts/build-map-footprints.ts`.
   Perimeter walls, gates, paths and plazas stay open by rule. Author or adjust a map with
   `bun scripts/map-collision-tool.ts <id> <json> <overlay.png>`. `test:navigation` proves that on every
   painted map the spawn is open and every NPC, exit and service is reachable (walk ends within 100 px).
   **Campaign completability: verified structurally.** `bun run test:quests` runs
   `scripts/audit-quest-completion.ts`, which traces every quest's real engine path: start (giver popup,
   sect popup, or `startQuest`), each stage (`autoAdvance` or a reachable `advanceQuest`/`finishQuest`), and
   turn-in. It also checks that items, opponents, NPCs and locations are reachable from `home_player`.
   It found and fixed:
   - The foothill tutorial area (`village`, `tavern`, `viewpoint`, the elder, `first_steps`) was orphaned.
     It is now linked two-way with `home_player`.
   - Silk was never sold. The Suzhou market now sells it (3 sect quests and 2 recipes need it).
   - `qst_wudang_traitor_disciple`, `qst_shaolin_proof_of_heart` and `qst_shaolin_wudang_joint` stalled at
     stage 0 because their advance scenes were unlinked. Old saves stuck there can abandon and re-accept.
   Result: all 276 quests can be started, progressed and finished, and all 101 locations are reachable.
   `scripts/test-quest-dead-ends.ts` replays the fixes through the real store. The older
   `audit-quest-flow.ts` heuristic still lists false positives for NPC turn-ins. A manual playthrough of every
   quest in a browser has not been done; the structural audit plus e2e opening/investigation flows stand in for it.

New benchmark-driven UI (plus a brief "ถึงตาเจ้า" turn callout when the player's turn opens, hidden under reduced motion):
- Dialogue: large face-cropped speaker bust column (188 px desktop, 104 px phone, 132 px short landscape),
  up from 80/60/38 px. It is Hero's Adventure's "face beside the words" framing within our opaque 256 px portraits.
- Battle: turn-order timeline in the status bar (`predictTurnOrder` in `lib/game/battle.ts` runs the real
  `getNextTurn` on a gauge-only copy; unit-tested in `test:combat`). This mirrors Hero's Adventure's action timeline.

Environment note for cloud sessions: Playwright 1.63 expects Chromium build 1243, and this container has 1194
under `/opt/pw-browsers`. Symlink the 1194 binaries into `chromium-1243/chrome-linux64/chrome` and
`chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.

### 2026-09-29 — wave 12: Hero's Adventure UI pass (Claude Code, branch `claude/nice-lamport-hc9w5n`)

Goal: bring the whole UI up to the Hero's Adventure: Road to Passion standard. Evidence is captured by
`review/ui-driver.ts <label>` → `review/ui-evidence/<label>/` (desktop 1440×900, phone 390×844, landscape 844×390).
Independent critiques: `review/wave12-ui-critic.md` (first pass, about 65–70 %) and `review/wave12-ui-critic-2.md`
(about 74 %). The fixes after pass 2 are verified in `review/ui-evidence/wave12h/`.

What changed:
- **Menus** (`components/ui/modal.tsx`, `components/ui/game-menu-context.tsx`, `app/game-menu.css`): menu-bar popups open in one
  full-screen tabbed shell (keys 1–8, red ✕, pixel tab icons in titles). All popups use dark lacquer with bronze frames; light
  utility colours and small text are remapped centrally. Portaled popovers go dark while a panel is open.
- **HUD** (`components/world/map-hud.tsx`, `app/game-hud.css`): round portrait, status strip, place plaque, a sundial with the
  twelve double-hours plus Thai hour/phase, and a medallion menu row with number keys.
- **World** (`lib/stage/world-runtime.ts`, `components/world/location-map.tsx`): green NPC name tags kept on screen, !/? quest
  markers from the same rules as the NPC popup, and far service/exit badges fade.
- **Bag / skills / profile / shop / NPC card**: rarity-framed item tiles (`components/ui/wuxia/item-tile.tsx`,
  `lib/ui/rarity.ts`), a round skill loadout, a hero block, a portrait band.
- **Dialogue**: parchment box, name tab, framed portrait plate breaking the top edge.
- **Encounter**: confrontation panel with a tier colour and F/Esc.
- **Battle**: round hotbar (keys 1–9, cooldown dial, riposte badge), side-coloured turn queue, two docked log lines, big
  gold/red damage numbers with a 暴擊 crit tag.

Still open from the critiques (needs new systems or art, not UI polish):
- Battle has no Item / Retreat / Auto actions; the engine has none of these, so a UI rail was not faked.
- Item icons are category glyphs in rarity frames; the game has no item artwork. Drop 32 px sprites into ItemTile when drawn.
- Painted NPC portraits are opaque squares, so the dialogue bust is a framed plate rather than a cut-out.
- Life-skill and rest rows still use their data emoji (⛏ 🪓 🍵).

### 2026-09-29 — wave 13: unique NPCs + Dragon Quest XI HUD (Claude Code)

**Unique NPC characters.** All 159 NPCs had a unique painted body (`public/npcs/body/<id>.png`) but the world drew
them from 7 shared costume sheets. `bun scripts/build-npc-sprites.ts` turns each painting into native-pixel sprites
(trim, palette reduction, hard alpha, 1 px outline): `public/npcs/pixel/` (72 px, world) and
`public/npcs/pixel-battle/` (150 px, battle). `npcPixelSprite` / `npcBattleSprite` in `lib/world/data/npc-portraits.ts`
feed the world runtime (unique single-pose sprite, archetype sheet as fallback), sparring battles and the turn
queue. The sprites are single poses, so they move with the engine's lunge, recoil and breathing, not frame
animation. Adding a new NPC: drop its painted body PNG in `public/npcs/body/` and rerun the script.

**HUD standard: Dragon Quest XI** (reference captures in `review/baseline/dq11/`, gitignored), kept in wuxia dress:
- Exploration (`components/world/map-hud.tsx`, `app/game-hud.css`): one เมนู button (M) opens a DQ command window with a
  gold ☛ cursor (arrows, 1–8). There is a party card bottom-right (portrait, green name, pill HP/MP/พลัง gauges), a
  purse in ตำลึง plus the sundial top-right, a ringed minimap bottom-left that follows the hero from the canvas
  data attributes, a gold name banner and autosave quill on arrival, and floating +/− gold deltas.
- Menus, shops and popups (`app/dq-theme.css`, loaded last): parchment scrolls with a cinnabar ribbon title,
  lacquer-brown tabs, and paper-inked rarity text.
- Dialogue: a translucent lacquer box with a name tab and gold ☛ choice cursor; the portrait plate breaks the edge.
- Battle: a DQ command list (medal, move name, cost, number key, ☛ cursor) beside a message box (last log lines plus
  the pointed move), with lacquer-brown fighter plates and a green player name.
- Accessibility: decorative CSS glyphs use `content: "☛" / ""` so they stay out of accessible names (this broke
  e2e once).

**Phaser.js: adopted in wave 14** (see below). The earlier "decided against" note is superseded.

## Wave 14: Phaser 4 runtimes (replaces Three.js)

Requested by the user after an in-browser error report ("rewrite it to be Phaser.js").

- `lib/three/` was renamed `lib/stage/`. The pure modules (navigation, placement, footprints, occlusion
  contours, vignettes, battle backgrounds, map probe, types) are unchanged.
- `lib/stage/phaser-stage.ts`: one `Phaser.Game` per stage (`Phaser.AUTO`, `pixelArt`, `Scale.NONE`, drawing
  buffer = host size × devicePixelRatio capped at 2, canvas styled 100 %). Phaser's own input is disabled:
  keyboard, pointer and marker picking stay on DOM listeners so modal pause rules and tests are unchanged.
  `data-renderer="phaser"`, plus `data-renderer-backend="webgl" | "canvas"` on the host.
- `lib/stage/world-runtime.ts` and `battle-runtime.ts` are line-for-line ports of the Three versions: same
  exported API, same dataset contract (player x/y/frame/motion/facing, screen bounds, visible props, fighter
  frames/motions, cast/impact counters, view size, background image, paused), same timings. Map units
  are y-down now, so there is no y flip anywhere.
- The warm character shader is now baked once into each atlas's pixels (`warmWorldCharacter` in
  `world-style.ts`, in linear light). The lantern/night veil is a canvas redrawn only when the hour
  changes, or at ~10 fps while lanterns flicker (`world-lighting.ts`).
- A lost WebGL context still surfaces the retry control (e2e covers it; the test uses `getContext("webgl")`).
- Verified: tsc, lint (existing warnings only), 8 unit suites, e2e 11/11, and smoke runs in Chromium with
  WebGL disabled (`--disable-webgl --disable-3d-apis`): world, night veil and battle all render on Canvas.
- `three` and `@types/three` were removed from package.json.

## Wave 15: installable PWA

- Manifest (`app/manifest.ts`), home-screen icons from the hero sprite (`scripts/build-pwa-icons.ts` → `public/pwa/`),
  Apple web-app meta, `viewport-fit=cover` plus left/right notch insets for the HUD (`app/pwa.css`).
- `public/sw.js` caches the app shell, hashed Next chunks and visited art so the game reloads offline; saves were
  already in localStorage, and installed apps now request persistent storage.
- Install control on the title screen and in the เมนู window (iOS shows Add-to-Home-Screen steps).
- Verified: Chrome reports no installability errors; e2e `pwa.spec.ts` reloads the world offline (12/12 e2e pass).

## Wave 16: mobile-first HUD

- Removed the เมนู command box, the ringed minimap and the floating journey guide ("เตรียมเดินทางครั้งต่อไป").
- Top icon bar for every menu section (`hud-iconbar`), floating left-thumb joystick (`touch-stick.tsx`,
  runtime `setStick` / `tapAt`), and a context action button when the hero stands next to an NPC, sign or exit
  (runtime `onNearby`). Styles in `app/mobile-hud.css`.
- E2E: new `mobile-controls.spec.ts` (icons, joystick drag, action button); 13/13 pass.
