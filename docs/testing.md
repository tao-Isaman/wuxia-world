# Testing

How the game is checked: fast Bun unit suites, content audits, the docs check, and Playwright browser tests.

## Contents

- [Before you push](#before-you-push)
- [Unit suites](#unit-suites)
- [Content audits](#content-audits)
- [Docs check](#docs-check)
- [Browser tests (Playwright)](#browser-tests-playwright)
- [Running e2e against a production build](#running-e2e-against-a-production-build)
- [Cloud container notes](#cloud-container-notes)
- [Lint and typecheck](#lint-and-typecheck)
- [Gotchas](#gotchas)
- [Writing a test](#writing-a-test)

## Before you push

```bash
bun run typecheck
bun run lint
for s in runtime combat opening navigation battle-background rumors investigation audio law walk grid grid-ai grid-skills grid-store quests docs; do
  bun run test:$s || break
done
bun run build && bun run test:e2e      # with a production server on :3017, see below
```

All unit suites together take well under a minute. The full e2e run takes a few minutes.

## Unit suites

Each suite is a Bun script (or `bun test` file) wired as `test:*` in `package.json`. A suite prints PASS lines and exits non-zero on the first failure.

| Script | Runs | Checks | Covers |
| --- | --- | --- | --- |
| `test:runtime` | `scripts/test-runtime.ts` | 9 | constant-speed movement, map positions cleared for a new hero, escaped names in battle logs, battle-store stepping, a waiting player turn can't be skipped, fatal / non-fatal defeat, route effects and cost commit together, blocked destinations, the save's version and `partialize` |
| `test:combat` | `scripts/test-combat-actions.ts` | 15 | mostly the **legacy** 1v1 action layer (guard, riposte, recover — no longer in the UI), the grid store's turn use, the 1v1 turn forecast, and `fleeChance` (the one live function there) |
| `test:opening` | 6 scripts | 12 | the clinic errand and its exact rewards; the (unused) preparation advice; the capital training duel (fixed stats, non-fatal, once); the quest completion receipt fires once; spy greetings always have a free exit; Lin's and Wu's read-only replies |
| `test:navigation` | `bun test lib/stage/world-navigation.test.ts lib/stage/world-placement.test.ts` | 19 | collision and path planning on the hand maps; **every painted map** keeps its spawn open and every NPC, exit and service reachable; placing the hero beside the speaker after a reload |
| `test:battle-background` | `scripts/test-battle-background.ts` | 2 | which battle background a fight gets, and that it survives a save round trip |
| `test:rumors` | `scripts/test-lore-rumors.ts`, `scripts/test-rumor-formatting.ts` | 5 + 4 | lore seeding (new game and v18 / v19 hydration), caps, selection rules; 104 template × truth combinations render without stray `{tokens}` |
| `test:investigation` | `scripts/test-capital-investigation.ts` | 5 | the capital ledger and corrupt-clerk quests end to end, legacy stages, the one-time reward |
| `test:audio` | `scripts/test-audio.ts` | 4 | the note data in `lib/audio/songs.ts`: timing, ranges, pentatonic modes, the battle drums |
| `test:law` | `scripts/test-law.ts` | 8 | wanted marks, pursuers, jail sentence, bribe, theft marks, the jail map and its activities |
| `test:walk` | `scripts/test-walk-cycle.ts` | 1 | the walk cycle alternates feet and bobs 1 px |
| `test:grid` | `scripts/test-grid-engine.ts` | 14 | the grid engine: layout, movement rules, turn order, ranges and areas, arts, damage over time, stun, victory, flee, full battles against real opponents, packs |
| `test:grid-ai` | `scripts/test-grid-ai.ts` | 13 | AI legality and behaviour over dozens of seeded battles; average planning time under 15 ms |
| `test:grid-skills` | `scripts/test-grid-skills.ts` | 7 | every skill (178) and art (122) has a valid battle range; the 18 overrides exist; Thai range labels |
| `test:grid-store` | `scripts/test-grid-store.ts` | 13 | battle store + bridge + looks + the world hand-off: HP carry-over, packs and board sizes, spar sprites, rigged NPC sheets, flee, auto mode, win / loss / escape results |
| `test:npcs` | `scripts/test-npc-sheets.ts` | 7 | the 48 rigged NPCs: art, placement, complete sheets, every frame a distinct pose, catalog wiring, the 10 villain bosses in the encounter pool; wandering stays near home, off blocked ground and still when frozen |
| `test:story` | `scripts/test-story-quests.ts` | — | every sect skill and art has exactly one quest source and nothing else (rank, manual, hall, dialog, other quest) teaches it; lineage quests (teacher, foe, item, spar tier, lines) and sagas (8–10 chapters, lines, cutscenes, small rewards) are well formed; every cutscene's stage, cast and beats resolve; **every** lineage quest and saga chapter plays through in the real store to the learned skill or art; difficulty gates by tier. `STORY_SECT=<label>` limits it to one sect |
| `test:routes` | `scripts/test-routes.ts` | 8 | world coords are current; compass helpers; one exit per slot and every exit within 90° of its destination's bearing; every road runs its exit's way and has its painting; snapped exit points on a real exit at the border; road geometry on the painting for all 8 directions; regional grades; arrivals land beside the exit back |
| `test:places` | `scripts/test-places.ts` | 12 | every ยุทธจักร T0–T3 move and art is a quest reward (the 69 new ones from one place quest) gated by rarity; each of the 20 villages / towns / homes has NPCs, an activity and quests on its map; new NPCs have a dialog, a look (only m/f bodies wander) and gift tastes; activities and meetings registered; no teacher is an assassination / kidnap target; presence (assassinated / 180-day kidnap); gift worth and tastes; the store's `giveGift` cooldown and gold; activity cooldowns; home meetings on safe ground |
| `test:quests` | 5 scripts | — | the campaign audit, dead-end regressions, playing **every** item / kill / objective quest (213) through the real store, guidance for all 657 stages, and every steal / assassinate / kidnap quest stage (39) |
| `test:docs` | `scripts/build-docs-reference.ts --check`, `scripts/check-docs.ts` | — | the generated reference is current; links, repo paths and commands in the docs resolve |

### `test:quests` in detail

- **`scripts/audit-quest-completion.ts`** walks the game the way the engine does.
  - Starting points: `home_player`, the jail cell, random-event dialogs and every offer, complete and objective scene.
  - It computes which locations, NPCs, opponents and items can be reached or obtained.
  - It then checks every quest can be started (NPC card, sect menu or a `startQuest` scene), progressed (auto-advance, objective spots or reachable `advanceQuest` beats) and finished.
  - It fails on a middle stage with too few beats, and on a flag stage that nothing sets.
- **`scripts/test-quest-dead-ends.ts`** covers regressions for quests that were once impossible.
- **`scripts/test-quest-turnins.ts`** accepts, progresses and hands in every item, kill and objective quest through the real store. Items are carried before accepting, objective spots are used in place, and kills count only after accepting.
- **`scripts/test-bad-action-quests.ts`** finds every stage that needs a steal, assassination or kidnapping and checks that the target stands on a map, that their card offers the action, and that a successful attempt through the real store moves the quest on.
- **`scripts/test-quest-guide.ts`** checks tracking (newest, pinned, off) and that every stage of every quest has an action; fewer than 10 % may lack a place. `GUIDE_DEBUG=1` lists the stages with no place.

## Content audits

Read-only scripts, not wired into `package.json`:

| Command | Checks | Status |
| --- | --- | --- |
| `bun scripts/audit-content.ts` | every NPC / quest / scene reference resolves; no duplicate NPC or quest ids | passes — run it after every content change |
| `bun scripts/audit-manual-names.ts` | each manual's name matches what it teaches | passes |
| `bun scripts/smoke-liveness.ts` | a 90-day NPC simulation and rumor run | passes |
| `bun scripts/audit-complete-scenes.ts` | every `qs_*_complete` scene fires `finishQuest` | **advisory**: 33 scenes flagged, all covered by the NPC card's `finishQuestNow` safety net |
| `bun scripts/audit-quest-counts.ts` | numbers in stage text match the auto-advance counts | **advisory**: about 109 heuristic mismatches, mostly `count: 1` stages whose text has no digit |
| `bun scripts/audit-quest-flow.ts` | the old offer → accept → complete heuristic | **legacy**: 168 issues; replaced by `audit-quest-completion.ts` in `test:quests` |

## Docs check

`bun run test:docs` runs two scripts:

- **`bun scripts/build-docs-reference.ts --check`** regenerates [docs/reference/](reference/README.md) in memory and fails if any page differs. Without `--check` it rewrites the pages.
- **`bun scripts/check-docs.ts`** checks the root docs, `docs/`, `public/art/` and `review/README.md`:
  - markdown links point at files that exist;
  - backticked repo paths exist;
  - every `bun run <name>` is a real `package.json` script;
  - every `bun scripts/<file>` exists.

  History pages (`docs/changelog.md`, `docs/specs/`) get only the link check, because they rightly name files that no longer exist.

## Browser tests (Playwright)

`playwright.config.ts`:

- `testDir: tests/browser`, Chromium only, 1 worker.
- Test timeout 90 s; `expect` timeout 15 s.
- Base URL `http://127.0.0.1:3017`, viewport 1440 × 900.
- Traces are kept on failure.
- **`storageState` seeds `localStorage["wuxia-random-events"] = "off"`** so walk ticks never ambush a test. Only `law-guide.spec.ts` removes the key, and it restores it afterwards.
- `webServer` starts **`next dev`** on :3017 when nothing is listening there (`reuseExistingServer` unless `CI` is set).

Many specs replace `Math.random` in the page to make rolls predictable.

24 tests in 14 spec files:

| Spec | Tests | Covers |
| --- | --- | --- |
| `audio.spec.ts` | 1 | music follows title → world → battle; the ♪ bubble; settings persist |
| `battle-setting.spec.ts` | 1 | a capital encounter keeps its street background through a reload and phone rotation |
| `characters.spec.ts` | 2 | all eight heroes animate idle and four walk directions in Phaser; reduced motion; WebGL context loss and "ลองใหม่" recovery |
| `dialogue.spec.ts` | 2 | local replies keep the same world canvas; quest offers away from a map fit on screen without scrolling at three sizes |
| `game.spec.ts` | 6 | exploration, menu pause, travel, NPC card, reload; grid battle by tap and auto; unit info by touch; phone rotation; a version-18 save migrates to 22; rigged NPCs wander in the capital and wait for the hero |
| `investigation.spec.ts` | 1 | capital rumors and the ledger investigation survive a mid-dialog reload and pay once |
| `law-guide.spec.ts` | 3 | walking while wanted draws the law; jail days per mark; retreat gives no rewards; the quest guide and the busy overlay |
| `mobile-controls.spec.ts` | 1 | phone HUD: icon bar, joystick, action button, rest bubble, profile |
| `opening.spec.ts` | 1 | the first session: clinic errand, a bought potion, the free duel on auto, rests, a w-exp upgrade |
| `pwa.spec.ts` | 1 | manifest and icons, an active service worker, an offline reload — **needs a production server** |
| `quest-tracking.spec.ts` | 1 | pinning a quest, the HUD tracker, and the ฉางอัน spy objective advancing in person |
| `routes.spec.ts` | 1 | home → capital: the road map's direction, the hero starting at its near end, and arriving beside the exit back home |
| `places.spec.ts` | 1 | a village has its new people; a 500-gold gift raises trust and starts the 30-day wait; a kidnapped NPC leaves the map and is back after 180 days |
| `story.spec.ts` | 2 | a saga chapter's film plays (title card, tap, skip), the long briefing pages, and the quest log's ตำนาน tab replays the film; the sect window's ขั้นและวิชา tab lists the sect's skills with their quests, and a rank-up pays gold and teaches nothing |

Screenshots from specs go to `test-results/screenshots/`; failure traces go to `test-results/<test>/`. Both are git-ignored.

## Running e2e against a production build

The service worker only registers in production, and dev-server first compiles are slow. Use a production server:

```bash
bun run build
bun run start -p 3017        # in another shell, or in the background
bun run test:e2e             # reuses the running server
bun run test:e2e tests/browser/law-guide.spec.ts   # one spec
```

- With `CI` set, Playwright refuses to reuse the server and fails if :3017 is taken.
- To stop the background server, kill whatever listens on :3017 (`fuser -k 3017/tcp`). Do not `pkill -f "next start"`: that pattern can match your own shell.

## Cloud container notes

- `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; do not run `playwright install`.
- Playwright 1.63 expects Chromium revision **1243**, but the container ships **1194** (Chromium 141). Tests run once the 1243 folders point at the 1194 binaries:

```bash
cd /opt/pw-browsers
mkdir -p chromium-1243/chrome-linux64 chromium_headless_shell-1243/chrome-headless-shell-linux64
ln -sf /opt/pw-browsers/chromium-1194/chrome-linux/chrome chromium-1243/chrome-linux64/chrome
ln -sf /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
       chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
touch chromium-1243/INSTALLATION_COMPLETE chromium_headless_shell-1243/INSTALLATION_COMPLETE
```

- `scripts/build-jail-map.ts` launches `/opt/pw-browsers/chromium` directly.
- There is no PowerShell, so the `.ps1` tools in `scripts/` and `review/` cannot run here.

## Lint and typecheck

- **`bun run typecheck`** (`tsc --noEmit`) covers every `.ts` / `.tsx` file, including `scripts/`, `tests/` and `review/`. It must be clean.
- **`bun run lint`** (`next lint`, ESLint flat config) covers `app/`, `components/` and `lib/` only; `store/`, `scripts/` and `tests/` are not linted.
  - Today it reports 0 errors and 5 known warnings: unused `accent` and `DIR_INFO`, and three hook-dependency warnings.
  - `next lint` prints a deprecation notice; it still works on Next 15.5.

## Gotchas

- **Never run bare `bun test`.** Bun also collects `tests/browser/*.spec.ts` and fails with "Playwright Test did not expect test() to be called here". `test:navigation` passes explicit files for this reason.
- **Harmless warnings.** `test:law`, `test:grid`, `test:grid-ai` and `test:quests` print many `[zustand persist middleware] Unable to update item 'wusia-world-v1'` warnings. They import the store without a `localStorage` shim; filter with `| grep -v "zustand persist"`.
- **`test:combat`** mostly guards legacy 1v1 code that the game no longer uses (see [combat.md](combat.md#legacy-1v1-code-kept-for-tests)).
- **`scripts/test-world-vignettes.ts`** passes but is not wired into any `test:*` script.
- **`scripts/test-runtime.ts`** still names one check "Three.js runtime objects…". The renderer is Phaser; the assertion is right.

## Writing a test

- **Pure logic** (`lib/game`, `lib/world`): import the function and assert with `node:assert/strict`. Print one `PASS …` line per check.
- **Store behaviour.** Install an in-memory `localStorage` and `window` before importing the store, then import it dynamically:

```ts
const memory = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => memory.set(k, v),
  removeItem: (k: string) => memory.delete(k),
} });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: globalThis.localStorage } });
const { useWorldStore } = await import("../store/world-store");
```

- **Randomness.** Replace `Math.random` for the duration of a check when an outcome depends on a roll.
- **Wiring.** Add the script to a `test:*` entry in `package.json`, and list it in this page and in `CLAUDE.md`.
- **Browser tests** go in `tests/browser/*.spec.ts`.
  - Read the world through the host's `data-*` attributes (`data-ready`, `data-player-x`, `data-guide-marker`, `data-units`…) rather than pixels.
  - Seed state by writing a save to `localStorage` before loading the page.
