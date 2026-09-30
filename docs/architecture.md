# Architecture

How the code is laid out, which layer may import which, how state flows, and where new code belongs.

## Contents

- [Stack](#stack)
- [Layers](#layers)
- [Directory map](#directory-map)
- [The engines](#the-engines)
- [Stores](#stores)
- [Data flow](#data-flow)
- [The battle bridge](#the-battle-bridge)
- [The render boundary](#the-render-boundary)
- [Routes](#routes)
- [Conventions](#conventions)
- [Where new code goes](#where-new-code-goes)

## Stack

| Piece | Version / notes |
| --- | --- |
| Next.js | 15 (App Router), React 19, `reactStrictMode` |
| TypeScript | 5.9, strict; path alias `@/*` → repo root |
| Rendering | Phaser 4 (WebGL, Canvas fallback) for the map and the battle board; React for everything else |
| State | Zustand 5, with `persist` for the world save |
| Styling | Tailwind 3 + hand-written CSS in `app/*.css`; shadcn-style primitives |
| Audio | Web Audio API, all procedural |
| Runtime | Bun for scripts and tests; Node 20+ works for Next |
| Tests | Bun scripts, `bun test` for two files, Playwright (Chromium) |
| Deploy | Vercel is implied (`VERCEL_GIT_COMMIT_SHA` in `next.config.ts`); there is no CI config in the repo |

## Layers

```
app/, components/            React: screens, HUD, menus, popups, battle UI
      │
      ▼
store/                       Zustand: world (saved), battle, character (/debug), loading, toast, confirm
      │
      ▼
lib/world/  ──────────►  lib/game/          pure TypeScript engines (no React, no DOM, no I/O)
(story engine)          (combat engine)
      ▲
lib/world/battle-bridge.ts  the one place world and battle stores meet

lib/stage/, lib/characters/ Phaser renderers and sprite atlases (browser only)
lib/audio/                  Web Audio (browser only)
```

The import rules:

| Module | May import |
| --- | --- |
| `lib/game/` | nothing outside itself |
| `lib/world/` | `lib/game/` (types, data tables, `deriveAll`, leveling) and itself — never React or the stores |
| `store/` | the engines |
| `components/`, `app/` | stores, engines and renderers |

Two deliberate exceptions reach up into stores:

- **`lib/world/battle-bridge.ts`** subscribes to the world store and starts battles in the battle store.
- **`lib/stage/grid-battle-runtime.ts`** reads the battle store every frame and calls `step()` to pace AI turns.

`lib/world/index.ts` does not export `initBattleBridge`, so importing the engine barrel never pulls in the stores.

## Directory map

| Path | Holds |
| --- | --- |
| `app/` | `layout.tsx` (fonts, metadata, CSS order, `PwaRegister`), `page.tsx` (the game), `debug/` (combat sandbox), `progress/` (frozen journal), `manifest.ts`, all global CSS |
| `components/world/` | the world UI: `world-screen.tsx` (root), maps, dialogs, HUD, quest tracker and log, overlays, `popups/` |
| `components/game/` | battle UI (`battle-arena.tsx`, `battle-canvas.tsx`, `battle-log.tsx`), skill icons, `world-canvas.tsx`, `touch-stick.tsx`, `character-preview.tsx`, /debug setup widgets |
| `components/ui/`, `components/ui/wuxia/` | primitives |
| `components/*.tsx` | `pwa.tsx`, `sound-director.tsx`, `sound-button.tsx`, `mobile-landscape.tsx` |
| `store/` | the six Zustand stores |
| `lib/game/` | combat engine; `data/` tables; `grid/` tactics engine |
| `lib/world/` | story engine; `data/` content tables |
| `lib/stage/` | Phaser stage, world runtime, grid battle runtime, VFX, navigation and other pure helpers |
| `lib/characters/` | character catalog, atlas building, walk cycle |
| `lib/audio/` | songs, synth engine, skill sounds |
| `lib/ui/rarity.ts`, `lib/utils.ts` | small UI helpers (`cn`) |
| `public/` | maps, art, NPC portraits and sprites, icons, PWA icons, `sw.js` |
| `scripts/` | tests, audits, generators, tools ([scripts.md](scripts.md)) |
| `tests/browser/` | Playwright specs |
| `review/` | historical critic reports and evidence ([review/README.md](../review/README.md)) |
| `docs/` | these guides, generated reference, specs, changelog |
| `demo.html` | the original single-file combat prototype (reference for combat numbers) |

## The engines

**`lib/game/` — combat** (details in [combat.md](combat.md) and [grid-combat.md](grid-combat.md)):

- **Data:** `types.ts` and `data/` (tiers, stats, weapons, sects, 178 skills, 123 arts, 76 gear).
- **Numbers:** `derive.ts` (stats → HP, attack, speed…), `damage.ts`, `leveling.ts`, `skill-conflict.ts`, `slots.ts`, `effects.ts`.
- **One duel:** `battle.ts` resolves one skill or art between two sides (`resolveSkill`, `resolveArtActive`).
- **The live battle:** `grid/` drives it on a 10 × 7 board. It **reuses `battle.ts`** for every hit by building a two-sided "duel view" per target.
- **Legacy:** `ai.ts`, `combat-actions.ts` and the 1v1 turn loop are kept for tests; `fleeChance` is the only live piece.

**`lib/world/` — story** (details in [world-engine.md](world-engine.md) and [liveness.md](liveness.md)):

- **Types:** `types.ts` holds the scene union, `SceneEffect` (26 kinds), `Condition` (24 kinds), quests, items, NPCs, opponents and `WorldStateData`.
- **Rules:** `effects.ts` (the effect dispatcher, quest progress and rewards, walk-tick encounters), `conditions.ts`, `validate.ts` (save repair).
- **Systems:** `quest-objectives.ts` and `quest-guide.ts`; `law.ts`, `bad-actions.ts`, `stat-progression.ts`, `location-categories.ts`; `npc-tick.ts` and `rumor-engine.ts`.
- **Seam to battle:** `battle-looks.ts` and `battle-bridge.ts`.
- **Content:** everything in `data/` ([content-authoring.md](content-authoring.md)).

Both engines are plain functions over plain data. World functions take the state and mutate it (`applyEffect(state, eff)`); the store hands them a draft copy and publishes the result.

## Stores

| Store | Saved | Holds | Key actions |
| --- | --- | --- | --- |
| `store/world-store.ts` | `wusia-world-v1`, v21 | the whole run (`WorldStateData`, 47 fields) | new game, travel, choices, rest, gather, craft, practice, shop, quests, sects, bad actions, law, encounters, `acknowledgeBattleResult`, `walkTick` |
| `store/battle-store.ts` | no | the current grid battle (`state: GridBattleState`), `auto` | `start`, `move`, `act`, `wait`, `flee`, `setAuto`, `step`, `stepAll`, `reset` |
| `store/character-store.ts` | `wusia-character-v1`, v3 | two /debug builds | slot, stat and gear editing for /debug |
| `store/loading-store.ts` | no | the busy overlay | `flashLoading(message, ms = 1000, kind)` |
| `store/toast-store.ts` | no | up to 3 toasts | `toast(kind, message, ms = 2600)` |
| `store/confirm-store.ts` | no | one themed confirm | `await confirmDialog({...})` |

Save format, migration and repair are in [save-format.md](save-format.md).

**World-store patterns:**

- **Draft and set.** Most actions build `draftFrom(get())`, mutate the draft through engine functions, then `set({ ...draft })`.

  `draftFrom` copies one level deep only: nested records (a quest entry, a sect membership, an NPC's sim state) are shared with the previous state and mutated in place. Code that compares before and after must deep-copy first, as the quest subscription does.
- **Action log.** `appendActionLog(state, kind, message)` records player-visible events (newest 100).
- **Time.** Every action that spends time calls `advanceTime(state, hours)`. That also decays wanted marks, runs the weekly NPC tick, fails quests whose giver died, and maintains rumors.
- **Quest progress.** A module-level subscription re-runs `tickQuestProgress` whenever `inventory` or `defeatedCounts` changes, so progress never waits for a scene change.
- **Reading the store.** Components use selectors: `useWorldStore((s) => s.flags)`. `getState()` is for event handlers, store internals and the bridge — never for rendering.

## Data flow

**Talking to an NPC and accepting a quest:**

1. **Walk.** The player taps the NPC on the map. `world-runtime.ts` walks the hero there and calls the marker's `onActivate`.
2. **Accept.** `LocationView` opens `npc-interaction-popup.tsx`, which lists offers (`isQuestOfferable`). Accepting calls `acceptQuest`.
3. **Apply.** The store drafts and applies `{ t: "startQuest" }`: `effects.ts` adds the quest, snapshots kill counts and ticks progress. The store then sets the new state.
4. **Brief.** The popup opens `qs_<quest>_offer` if it exists (`gotoScene`), so `WorldScreen` shows `DialogStage` over the same map.
5. **Guide.** The quest tracker and the map's guide arrow recompute from `guideForQuest` (`quest-guide.ts`) on the next render.

**Walking into a fight:**

1. **Roll.** The runtime reports 220 walked units → `walkTick()` → `rollWalkEvent(draft, 0.4)`, which may set `pendingEncounter`.
2. **Choose.** `WorldScreen` shows `EncounterScreen`. ⚔ calls `acceptEncounter()`, which sets `pendingBattle`.
3. **Start.** The bridge sees `pendingBattle` and calls `ensureBattleStarted()`: it scales the opponent, builds the units and looks, and runs `battleStore.start(...)`.
4. **Fight.** `BattleArena` and `grid-battle-runtime.ts` play the battle. Player input calls `move` / `act`; AI turns advance through `step()`.
5. **Return.** At the end the player presses ดำเนินเรื่อง → `acknowledgeBattleResult()`, which applies stamina, time, HP / MP, rewards, kill counts and quest progress, clears `pendingBattle` and goes to `onWin` / `onLose`.

## The battle bridge

`initBattleBridge()` (`lib/world/battle-bridge.ts`) is called once from `app/page.tsx`. It is idempotent and does nothing during server rendering.

- **World → battle, automatic.** A subscription on `pendingBattle` calls `ensureBattleStarted()`. That function:
  1. applies the power-based opponent stat scale;
  2. calls `worldBattleSetup(opponentId, { bodyId, withPack })`;
  3. starts the battle store with the hero's build and current HP / MP, the looks and the pack.

  It also runs at start-up and from `WorldScreen`, so a reload during a battle restarts it (the battle store is not saved).
- **Battle → world, by the player.** Nothing flows back until the player acknowledges the result. `acknowledgeBattleResult` reads the finished battle state once.

## The render boundary

- **Browser only.** Phaser lives only in `lib/stage/` and is loaded with dynamic `import()` from `world-canvas.tsx` and `battle-canvas.tsx`.
- **Runtimes read, never own.** A runtime reads plain data through a `read()` callback or the battle store and draws it. It holds no game state of its own and writes nothing into stores except through their public actions.
- **Output.** Runtimes publish their state as `data-*` attributes on the host element, for tests and the HUD.
- **Nothing renderer-side is saved.** Phaser objects, textures and map positions never enter a store or a save.
- **Input.** Phaser input is off. DOM listeners plus `worldInputBlocked()` make any open dialog pause the map.

Details: [rendering.md](rendering.md) and [grid-combat.md](grid-combat.md#renderer).

## Routes

| Route | File | What |
| --- | --- | --- |
| `/` | `app/page.tsx` | the game: `WorldScreen`, `QuestCompletionReceipt`, `SoundDirector`; calls `initBattleBridge()` |
| `/debug` | `app/debug/page.tsx` | combat sandbox: two builds (`character-store`), skill library, a free grid battle (`BattleArena mode="free"`). Independent of the world save |
| `/progress` | `app/progress/page.tsx` | the old development journal (data frozen at wave 11) and a character animation gallery |
| `/manifest.webmanifest` | `app/manifest.ts` | the PWA manifest |

## Conventions

- **Discriminated unions** everywhere:
  - effects, conditions, rewards and combat effects switch on `t`;
  - scenes switch on `kind`;
  - slot strings are a bare skill id or `art:<id>` (`parseSlotId`).
- **Exhaustiveness.** New variants need a case in every dispatcher.
  - Combat effect dispatchers enforce it through TypeScript.
  - The world `applyEffect` switch does **not**: a missing case compiles and silently does nothing.
- **Data field names.**
  - Combat tables use short names (`n`, `sc`, `ti`, `bp`, `st`, `se`, `ee`), matching `demo.html`.
  - World tables use readable names.
- **Language.** Thai for everything shown to the player; English for code, ids and comments.
- **Registries.** Each content table exports the array, a `*_BY_ID` map and a `getX(id)` helper, and most have a barrel. Import engine code through `@/lib/game` and `@/lib/world`, except modules kept out of the barrels (listed in [world-engine.md](world-engine.md#files)).
- **Imports.** Use the `@/` alias for cross-directory imports.
- **Randomness.** Engines use `Math.random`; tests replace it where an outcome matters.

## Where new code goes

| You are adding… | Put it in |
| --- | --- |
| a rule about damage, stats, effects | `lib/game/` (+ [combat.md](combat.md)) |
| a battle-board rule, range, AI behaviour | `lib/game/grid/` (+ [grid-combat.md](grid-combat.md)) |
| a scene effect, condition, quest or encounter rule | `lib/world/types.ts` + `effects.ts` / `conditions.ts` (+ [world-engine.md](world-engine.md)) |
| content (places, people, quests, items…) | `lib/world/data/` or `lib/game/data/` ([content-authoring.md](content-authoring.md)) |
| a player action | a world-store action that drafts, calls engine functions, logs, and sets |
| something drawn on the map or board | `lib/stage/` (pure helpers separate from Phaser code) |
| a screen, HUD element or popup | `components/world/` (popups in `popups/`, as a `Modal`) |
| a persisted field | `WorldStateData` + the save steps in [save-format.md](save-format.md#changing-the-save) |
| a test | `scripts/test-*.ts` wired into a `test:*` script, or `tests/browser/` ([testing.md](testing.md)) |
