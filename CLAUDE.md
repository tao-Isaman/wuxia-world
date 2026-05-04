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

Three layers, strict directionality — UI depends on stores, stores depend on the engine, engine depends on nothing else:

```
app/, components/        ← React components, Tailwind
   ↓
store/                   ← Zustand wrappers
   ↓
lib/game/                ← pure TypeScript engine (no React, no I/O)
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

### `store/` — Zustand wrappers

Two stores, both `"use client"`:

- **`character-store.ts`** — setup state (stats, skills, arts, equipment per side). All mutations clamp/dedupe at the boundary (e.g. `setStat` enforces the 200-point budget; `setSkillSlot` clears duplicates from other slots).
- **`battle-store.ts`** — runtime battle state. Mutate-then-publish: pure logic mutates the `BattleState` in place, then the store calls `set({ state: { ...state } })` so subscribers re-render via reference change. The internal `advanceUntilPlayer` loop runs the ATB + AI turns until it's the player's turn (or the battle ends), capped by `MAX_AI_CHAIN` to prevent infinite loops if the AI is locked out (no usable skills + no MP for IA).

UI components subscribe to these stores via the standard Zustand selector pattern: `useCharacterStore((s) => s.builds[side])`. Don't read `getState()` from inside components — only from event handlers / store internals.

### UI layer

- **`components/ui/`** — shadcn primitives (Button, Card, Combobox, etc.). The custom **`Combobox`** wraps Popover + cmdk and replaces the searchable-dropdown helper from the original demo.
- **`components/game/`** — feature components. Each subscribes to whatever slice of the store it needs. The `BattleLog` uses `dangerouslySetInnerHTML` because log lines are pre-formatted with `<b>`, `<span class="lp">`, etc. — those strings are produced inside `lib/game/effects.ts` and `battle.ts` from controlled inputs (no user content), so the XSS surface is the engine itself. Inline classes referenced by those strings (`.lp`, `.lC`) live in `app/globals.css`.

### Adding new game content

Most additions don't require touching dispatchers:

- **New skill** → append to `SKILLS` in `lib/game/data/skills.ts`. Use existing `se`/`ee` types if possible.
- **New equipment** → append to `EQUIPMENT`. Use existing `eff` types if possible.
- **New art** → append to `ARTS`. The active's `t` field must match an existing case in `resolveArtActive`'s switch (or you'll need to add a new one).
- **New effect type** → add a variant to the relevant union in `types.ts`, then add a case to the relevant dispatcher in `effects.ts` (or `battle.ts` for art active types). TypeScript will tell you which dispatchers need updating.

### Conventions kept from the original

The data tables use compact field names (`bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `mg`, `ti`, `w`, etc.) so they cross-reference cleanly with `demo.html` for tuning checks. **Keep this style in the data files** — verbose names there hurt readability when scanning 80 entries. Engine functions and React components, by contrast, use full names (`resolveSkill`, `applySelfEffect`, `BattleContext`) since those are touched far less often than the data.

Thai is the canonical UI language; skill/art/equipment names stay in Thai. If we ever want i18n later, the natural seam is to give each item an i18n key alongside `n` rather than translating the existing strings.
