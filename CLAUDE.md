# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`กำลังภายใน — Battle Sim` (Thai-language wuxia/martial-arts 1v1 turn-based battle simulator) rebuilt as a Next.js 15 + React 19 + TypeScript app. UI uses shadcn/ui (Radix + Tailwind) and is styled with Tailwind v3.4. State lives in two Zustand stores. The runtime is Bun, but Node 20+ also works.

`demo.html` (the original single-file prototype) is preserved as a behavioral reference. Don't edit the rebuilt app to "match the demo's bugs" — but if a tuning question comes up, the demo is the source of truth for damage/effect numbers.

## Commands

```bash
bun install          # install deps
bun dev              # next dev — http://localhost:3000
bun run build        # next build
bun start            # run prod build
bun run lint         # next lint (ESLint flat config)
bun run typecheck    # tsc --noEmit
```

There are no tests yet. If you add some, prefer Vitest (zero-config with the Bun runner).

## Architecture

Layered, strict downward dependency — UI depends on stores, stores depend on the engines, engines depend on nothing else (and not on each other except via the explicit bridge):

```
app/, components/        ← React components, Tailwind
   ↓
store/                   ← Zustand wrappers (character, battle, world)
   ↓
lib/game/   lib/world/   ← pure TypeScript engines (no React, no I/O)
              ↓
              battle-bridge.ts  ← only place the two stores talk to each other
```

### `lib/game/` — pure engine

The engine has no React, no DOM, no async, no hooks. It exists to be testable, replaceable, and easy to reason about. Everything UI-facing flows through `lib/game/index.ts` (the public barrel).

- **`types.ts`** — discriminated unions (`SelfEffect`, `EnemyEffect`, `EquipEffect`, `ArtPassiveEffect`) keyed on `t`. New effect types go here first, then in the dispatcher in `effects.ts` — TypeScript's exhaustiveness check on `switch (eff.t)` flags any dispatcher that wasn't updated.
- **`data/`** — five tables (`TIERS`, `SKILLS`, `ARTS`, `EQUIPMENT`, plus stat metadata). Most balance edits are pure additions/tweaks here.
- **`derive.ts`** — base stats → derived combat stats (`derive`), plus `combinedStats`/`deriveAll` that layer art-scaled stats, skill stat bonuses, and equipment bonuses on top.
- **`damage.ts`** — `hitPct`, `critPct`, `hpColor` helpers. Crit multiplier is the constant `CRIT_MULTIPLIER`.
- **`effects.ts`** — three dispatchers (`applySelfEffect`, `applyEnemyEffect`, `checkPassive`/`applyPassiveEffect`), plus `tickEffects` (poison + duration decrement + equipment HP-regen) and `addBuff`/`addDebuff` mutators that dedupe by `t`.
- **`battle.ts`** — `BattleContext` (precomputed inputs that don't change during a battle), `makeContext`/`makeInitialState`, ATB-style `getNextTurn`, the central `calcSkillDamage` formula, `resolveSkill`, `resolveArtActive`. The big inline `switch` inside `resolveArtActive` is per-active-type — adding a new active means adding both an `ArtActiveType` literal in `types.ts` and a case here.
- **`ai.ts`** — `runAITurn` returns a boolean indicating whether it acted; the store uses that to detect lockout and avoid infinite loops.

The damage formula in `calcSkillDamage` is:

```
raw = max(1, (Atk * stackMod * artBonus + typedAtk + skillEffect) * dm * masteryMod - effectiveDef) * (1 - pctReduce/100)
```

Hit %: `clamp(80 + (Acc - Eva)/4, 5, 95)`. Crit %: `clamp(3 + (Cri - Res)/3, 0, 75)`, ×1.5 on crit. Mastery scales as `1 + (mastery/200) * 0.5` per equipped skill of the matching weapon family (cap 200). Art-specific quirks live inline: `taiji` multiplies `IA` by 1.12 on int skills, `scholar` multiplies `Atk` by 1.10 on int skills.

### ATB turn order (real-time animated)

Gauges fill in real time via `tickGauges(state, dtMs)`. Calibration constants in `lib/game/battle.ts`:

```
ATB_BASELINE      = 60     // gauge gain per tick = Spd + 60
ATB_THRESHOLD     = 100    // act when gauge reaches this
ATB_REFERENCE_SPD = 200    // calibration anchor
ATB_REFERENCE_MS  = 1000   // ↑ at that SPD, gauge fills in this many ms
ATB_UNIT_MS       = 2600   // derived: ms per (Spd+60) gauge unit
```

So `Spd 200` fills in **1 sec**, `Spd 100` in **~1.6 sec**, `Spd 20` in **~3.25 sec**. The `+60` baseline means raw SPD ratios are compressed — `Spd 20 vs 100` produces a 2:1 turn ratio, not 5:1.

The animation pipeline:

1. `BattleArena` runs a `requestAnimationFrame` loop while `state.phase === "filling"`, calling `tick(dt)` each frame.
2. `tick()` calls `tickGauges` (caps at 100, no overshoot), then `drainToActor` decides who acts.
3. When gauge fills:
   - Actor `A` → `phase = "player"` → buttons appear, rAF stops.
   - Actor `B` → `phase = "enemy"` → rAF stops, store schedules `runAITurn` after `ENEMY_ACTION_DELAY_MS` (400 ms).
4. After any action, `drainToActor` runs again (handles tied-gauge chain), then `phase` either returns to `"filling"` (rAF resumes) or `"player"`/`"enemy"` (next actor).

`getNextTurn` is kept for the synchronous fast-path (`autoAdvance`); it ticks exactly to the next event with no overshoot. **Don't replace the `+60` baseline or the carry-over with `if (SpdA > SpdB)` — that breaks the intended balance.**

The ATB Progress bar uses `animate={false}` (no CSS transition) because rAF already updates it every frame; with the default transition the bar would lag behind the actual gauge state.

### `lib/world/` — pure world/story engine

A second engine layered on top of the battle sim. The world is the text-based RPG outer game; the battle sim is its combat layer. Same conventions as `lib/game/`: discriminated unions on `t`, data tables, dispatchers, no React.

**Three scene kinds** (`Scene = DialogScene | LocationScene | RouteScene`, discriminated on `kind`):

- **`"dialog"`** — narration + dialogue lines + optional `choices` / `next`. Terminal dialogs (no choices, no next) get a "ปิด" button that returns the player to `lastLocationId`.
- **`"location"`** — persistent place with a description, an `npcs[]` list (each opens a dialog scene), and a `routes[]` list (each opens a route scene). Visiting a location updates `lastLocationId`.
- **`"route"`** — travel screen with a description, `destinations[]` (each navigates to a location with optional `effects`), and a back button (defaults to `lastLocationId`, override via `back`).

`Choice`, `NpcRef`, `RouteRef`, and `RouteDestination` all support `visibleIf: Condition` for gating. Use the existing `goto` effect and `Condition` machinery to navigate between any scene type — they don't care about kind.

**Auto-return**: when a dialog scene ends naturally (no choices, no `next`), the player clicks "ปิด" → `worldStore.exitToLocation()` → goes to `lastLocationId`. Authors don't add explicit `goto` at the end of every NPC dialog — return is automatic. If a dialog should land somewhere *other* than the previous location, give it a choice with explicit `next`.

**Dialog auto-advance gotcha**: a dialog scene with `next` set and no choices auto-advances *without showing its lines* (the renderer follows `next` immediately). For narration-then-continue scenes, use a single confirmation choice (`choices: [{ text: "ก้าวต่อไป", next: "..." }]`) rather than `next`. `next` is only useful for true bridge scenes you want the engine to skip through (e.g., redirector ids preserved for save compatibility).

Module map:

- **`types.ts`** — scene union, `Choice`, `SceneEffect`, `Condition`, `NpcRef`, `RouteRef`, `RouteDestination`, `QuestDef`, `QuestState`, `ItemDef`, `OpponentDef`, `WorldStateData`.
- **`data/`** — `scenes.ts`, `quests.ts`, `items.ts`, `opponents.ts`. Authoring rule: every scene id reference (`next`, `routeSceneId`, `dialogSceneId`, `locationId`, `back`, `onWin`, `onLose`) must exist, otherwise `validateAndRepair` (run on save load) resets the player to `START_SCENE_ID`.
- **`conditions.ts`** — `evaluateCondition(state, c)`: read-only check used by views to filter visible NPCs / routes / destinations / choices.
- **`effects.ts`** — `applyEffect(state, eff)`: mutating dispatcher. The `triggerBattle` effect just *sets* `pendingBattle` — it does **not** start the battle directly.
- **`battle-bridge.ts`** — module-level Zustand subscription. **One-way**: only world→battle is automatic; battle→world is user-driven via the "ดำเนินเรื่อง" button calling `worldStore.acknowledgeBattleResult()`.
- **`validate.ts`** — drops dangling refs (unknown scene ids, removed items/quests, stale `pendingBattle`, `lastLocationId` pointing to non-location scenes).

### Routes

- **`/`** (`app/page.tsx`) — the world game. Renders `<WorldScreen />`, calls `initBattleBridge()` once on mount.
- **`/debug`** (`app/debug/page.tsx`) — dev sandbox with three tabs: setup (CharacterCard A & B), library (SkillLibrary), and the free-form battle sim (`<BattleArena mode="free" />`). The world player is fully decoupled from the character-store builds here; changes in /debug don't affect the world save.

### `store/` — Zustand wrappers

All `"use client"`. Three stores, all independent:

- **`character-store.ts`** — `/debug` setup-tab state (character A & B). Wrapped with `persist` (`wusia-character-v1`, version 1). The world game does **not** read from this store.
- **`battle-store.ts`** — runtime battle state. **Not persisted** — combat is ephemeral; reload mid-fight via the bridge's `reconcile()` restarts the encounter from full HP.
- **`world-store.ts`** — story state (scene, flags, quests, inventory, gold, `pendingBattle`, `playerBuild`). Wrapped with `persist` (`wusia-world-v1`, version 1) + `validateAndRepair` on rehydrate. The world's `playerBuild` is initialized by `startNewGame()` from the local `STARTER_BUILD` (all stats 1, single `basic_punch` skill). Future world progression mutates this build directly — there's no link back to the setup tab.

UI components subscribe via the standard selector pattern: `useWorldStore((s) => s.flags)`. Don't read `getState()` from inside components — only from event handlers / store internals / bridge subscriptions.

### Battle ↔ World seam (`lib/world/battle-bridge.ts`)

`initBattleBridge()` is called once from `app/page.tsx` (idempotent, SSR-safe). It's **one-way automatic** — only the world-to-battle transition is auto-driven; the battle-to-world transition is user-initiated so players see the result before the world resumes.

1. **World → Battle (auto)**: `useWorldStore.subscribe` watches `pendingBattle`. When it appears, the bridge looks up the opponent and calls `battleStore.start(playerBuild, opp.build())`. The world UI then renders `<BattleArena mode="world" onContinue={acknowledge} />` inline (no tab navigation).
2. **Battle → World (manual)**: when `state.winner` is set, `BattleArena` in world mode shows the winner banner with a "ดำเนินเรื่อง →" button. Clicking it calls `worldStore.acknowledgeBattleResult()`, which routes to the right `onWin`/`onLose` scene, clears `pendingBattle`, and resets the battle store.

`reconcile()` runs once on bridge init: if the world has a `pendingBattle` but the battle store is null (refresh wiped it), it restarts the battle so the player can finish.

The bridge only writes to the battle store — never reads. The UI handles the reverse path. This keeps `applyEffect` purely state-mutating; it never starts a battle directly.

### UI layer

- **`components/ui/`** — shadcn primitives (Button, Card, Combobox, etc.). The custom **`Combobox`** wraps Popover + cmdk.
- **`components/game/`** — battle/setup feature components. **`BattleArena`** has a `mode?: "free" | "world"` prop:
  - `"free"` (default): full Reset / Auto / Restart buttons; reads display names from setup-tab character A & B as fallback.
  - `"world"`: only the post-battle "ดำเนินเรื่อง →" button (calls `onContinue`); display reads from `battleStore.builds` (set by `start()`), so player/opponent names match the world's encounter.
  
  The `BattleLog` uses `dangerouslySetInnerHTML` because log lines are pre-formatted with `<b>`, `<span class="lp">`, etc. — those strings are produced inside `lib/game/effects.ts` and `battle.ts` from controlled inputs (no user content). Inline classes (`.lp`, `.lC`) live in `app/globals.css`.
- **`components/world/`** — world feature components. `WorldScreen` is the page root; it renders one of these based on state:
  - `<StartScreen />` (no save)
  - `<BattleArena mode="world" />` (pendingBattle is set)
  - Otherwise it dispatches on `scene.kind`:
    - `"dialog"` → `<DialogDisplay />` + `<ChoicePanel />`
    - `"location"` → `<LocationView />` (description, NPC list, route list)
    - `"route"` → `<RouteView />` (description, destination list, back button)
  
  Sidebar (`PlayerStatus` / `QuestLog` / dev-only `DebugOverlay`) renders alongside all scene kinds. `DialogDisplay` and `ChoicePanel` are typed against `DialogScene` specifically — passing a location/route to them is a TS error.

### Adding new game content

Most additions don't require touching dispatchers:

- **New skill / equipment / art** → append to the relevant table in `lib/game/data/`. Use existing `se`/`ee`/`eff` types if possible.
- **New location** → append a `{ kind: "location", ... }` entry to `SCENES`. Reference NPC dialogs by `dialogSceneId` and outbound routes by `routeSceneId`.
- **New route** → append a `{ kind: "route", ... }` entry. List destinations with optional `effects` (e.g., gold cost, flag set on first arrival). The back button defaults to `lastLocationId` — override via `back` only for one-way travel.
- **New dialog scene** → append a `{ kind: "dialog", ... }` entry. End on either a `choices` array or a terminal scene (no `next`, no `choices`) so the player can return via the auto "ปิด" button. Don't use `next` without `choices` unless you want the lines skipped.
- **New quest / item / opponent** → append to the relevant table in `lib/world/data/`. The cheapest authoring loop is the dev-only Debug Overlay — jump straight to the new scene without playing through everything.
- **New effect type** (combat) → variant in `lib/game/types.ts` + case in `lib/game/effects.ts` (or `battle.ts` for art-active types). TS exhaustiveness flags missed dispatchers.
- **New scene effect / condition** (world) → variant in `lib/world/types.ts` + case in `effects.ts` / `conditions.ts`. Same TS exhaustiveness story.
- **New world opponent** → append to `OPPONENTS` with a `build()` factory. The factory pattern lets future encounters scale off flags / quest progression without sharing mutable build state. **Calibrate against the player's current stats**: at game start the player has STARTER_BUILD (all 1s + `basic_punch`); demo opponents mirror that for a 50/50 fight.

### Save format & migrations

Two persisted Zustand slices, separate localStorage keys, separate version fields:

- `wusia-character-v1` — `{ builds: { A, B } }` (only used by /debug)
- `wusia-world-v1` — world state minus action functions (see `partialize`)

`battle-store` is intentionally not persisted.

When a schema changes, bump `version` and add a `migrate(persisted, fromVersion)` that reshapes old payloads. Identity migrations are fine for additive changes. `validateAndRepair` (world-store only) is a separate safety net for content drift (renamed scene ids, removed items, etc.) — it runs on every rehydrate.

`worldStore.resetGame()` wipes the world slice and resets the battle store. Character builds persist independently and are unaffected.

### Conventions kept from the original

The combat data tables use compact field names (`bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `mg`, `ti`, `w`, etc.) so they cross-reference cleanly with `demo.html`. **Keep this style in `lib/game/data/`** — verbose names there hurt readability when scanning 80 entries. World data (scenes / quests / items) is touched even more often during authoring, so it uses readable field names (`text`, `speaker`, `description`, etc.) rather than shorthand. Engine functions and React components use full names everywhere.

Thai is the canonical UI language; skill / art / equipment / scene / quest / item names stay in Thai. If we ever want i18n later, the natural seam is to give each item an i18n key alongside `n`/`name` rather than translating the existing strings.
