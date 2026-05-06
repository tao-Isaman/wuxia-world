# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`กำลังภายใน — Battle Sim` (Thai-language wuxia / martial-arts text-RPG with a 1v1 turn-based battle layer) built as a Next.js 15 + React 19 + TypeScript app. UI uses shadcn/ui (Radix + Tailwind) and is styled with Tailwind v3.4. State lives in four Zustand stores. The runtime is Bun, but Node 20+ also works.

`demo.html` (the original single-file prototype) is preserved as a behavioral reference for the *combat layer*. The world / RPG layer was designed in the rebuild and has no demo precedent. If a tuning question comes up about damage / effect numbers, the demo is the source of truth.

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
store/                   ← Zustand wrappers (character, battle, world, loading, toast)
   ↓
lib/game/   lib/world/   ← pure TypeScript engines (no React, no I/O)
              ↓
              battle-bridge.ts  ← only place the two stores talk to each other
```

### `lib/game/` — pure combat engine

The engine has no React, no DOM, no async, no hooks. Everything UI-facing flows through `lib/game/index.ts` (the public barrel).

- **`types.ts`** — discriminated unions on `t` (`SelfEffect`, `EnemyEffect`, `EquipEffect`, `ArtPassiveEffect`). Also `SkillType` (yin / yang / balance / hard / soft / internal / external) for the conflict system, and `SKILL_SLOT_COUNT = 10`.
- **`data/`** — static tables: `TIERS`, `SKILLS`, `ARTS`, `EQUIPMENT`, `STAT_KEYS`, `WEAPON_FAMILY_*`, `SECT_ORDER`/`JIANGHU_SECT`/`sectRank` (canonical sect list).
- **`derive.ts`** — base stats → derived combat stats (`derive`), `combinedStats` (merges base + active art + learned arts + slotted skills + learned skills + equipment, with conflict factors applied), `deriveAll` (adds HP/MP gain from arts), `getMasteryMap` (per-weapon-family mastery, scaled by skill level).
- **`damage.ts`** — `hitPct`, `critPct`, `hpColor`, `CRIT_MULTIPLIER`.
- **`leveling.ts`** — `effectiveBp(skill, level)` (lv 1 = 50 % bp, lv 10 = 100 %); `effectiveMg(skill, level)` (lv 1 = 100 %, lv 10 = 200 %); `xpToNextLevel(skill, level)` = `50 × level × (tier + 1)`.
- **`skill-conflict.ts`** — `computeConflictFactors(build, lookups)`. Counts learned skills + arts (excluding `balance` from axis tallies but including in the trigger threshold). When > 4 typed entries and one type holds > 60 % of an axis pair, the opposing type gets a half / zero modifier on `bp`, `st`, `mg`, and art HP / MP / stat scaling.
- **`slots.ts`** — slot encoding helpers. A slot string is either a bare skill id (`"tj"`) or an art id with `"art:"` prefix (`"art:taiji"`). `parseSlotId` returns a discriminated `{ kind, skill | art }`. `firstArtSlotIndex` picks the primary art for `BattleContext.artIds`.
- **`effects.ts`** — `applySelfEffect`, `applyEnemyEffect`, `checkPassive` / `applyPassiveEffect`, `tickEffects` (poison + duration decrement + equipment HP-regen), `addBuff` / `addDebuff`. New self-effect variants (`buff_spd`, etc.) go here first; the dispatcher `switch (eff.t)` enforces exhaustiveness.
- **`battle.ts`** — `BattleContext`, `makeContext` / `makeInitialState` (accepts `InitialStateOpts.hpA / mpA` for carryover), the central `calcSkillDamage`, `resolveSkill` (tracks `state.skillUses[side][skillId]`, `state.hitsReceived[ds]`), `resolveArtActive` (slot-aware via `opts.slotIdx`). ATB-style `tickGauges` / `getNextTurn` use `effectiveSpd` to layer `buff_spd` on top of derived SPD.
- **`ai.ts`** — `runAITurn` parses each available slot via `parseSlotId` and dispatches to `resolveSkill` (skill) or `resolveArtActive` (art, MP-gated). Returns a boolean for lockout detection.

The damage formula in `calcSkillDamage`:

```
raw = max(1, (Atk * stackMod * artBonus + typedAtk + skillEffect) * dm * masteryMod - effectiveDef) * (1 - pctReduce/100)
```

…where `skillEffect = effectiveBp(sk, level) * conflictFactor * (1 + p/100) + f`.

Hit %: `clamp(80 + (Acc - Eva)/4, 5, 95)`. Crit %: `clamp(3 + (Cri - Res)/3, 0, 75)`, ×1.5 on crit. Mastery scales as `1 + (mastery/200) * 0.5` per equipped skill of the matching family (cap 200), with skill-level + conflict multipliers folded into the per-skill `mg` contribution.

### ATB turn order (real-time animated)

Calibration constants in `lib/game/battle.ts`:

```
ATB_BASELINE      = 60     // gauge gain per tick = effectiveSpd + 60
ATB_THRESHOLD     = 100
ATB_REFERENCE_SPD = 200
ATB_REFERENCE_MS  = 1000
ATB_UNIT_MS       = 2600   // ms per (Spd+60) gauge unit
```

So `Spd 200` fills in **1 sec**, `Spd 100` in **~1.6 sec**, `Spd 20` in **~3.25 sec**. The `+60` baseline compresses raw SPD ratios — `Spd 20 vs 100` produces a 2:1 turn ratio, not 5:1. **Don't replace the `+60` baseline or carry-over with `if (SpdA > SpdB)` — that breaks the intended balance.**

`effectiveSpd(state, side)` adds `buff_spd` modifiers to `state.dA.Spd / dB.Spd` so a temporary speed buff actually ticks the gauge faster.

The animation pipeline:

1. `BattleArena` runs a `requestAnimationFrame` loop while `state.phase === "filling"`, calling `tick(dt)` each frame.
2. `tick()` calls `tickGauges` (caps at 100), then `drainToActor`.
3. When gauge fills:
   - Actor `A` → `phase = "player"` → buttons appear, rAF stops.
   - Actor `B` → `phase = "enemy"` → rAF stops, store schedules `runAITurn` after `ENEMY_ACTION_DELAY_MS` (400 ms).
4. After any action, `drainToActor` runs again (handles tied-gauge chain).

The ATB Progress bar uses `animate={false}` because rAF already updates it every frame.

### `lib/world/` — pure world / story engine

A second engine layered on top of the battle sim. Same conventions as `lib/game/`: discriminated unions on `t`, data tables, dispatchers, no React.

**Three scene kinds** (`Scene = DialogScene | LocationScene | RouteScene`):

- **`"dialog"`** — narration + dialogue lines + optional `choices` / `next`. Terminal dialogs (no choices, no next) get a "ปิด" button that returns to `lastLocationId`.
- **`"location"`** — persistent place. Description + `npcs[]` + `routes[]` + optional `resources[]`. `home_player` is the starter location (`START_SCENE_ID`).
- **`"route"`** — travel screen. `destinations[]` (each navigates to a location with optional `effects`) + back button.

`Choice`, `NpcRef`, `RouteRef`, and `RouteDestination` all support `visibleIf: Condition`.

**Auto-return**: terminal dialogs return to `lastLocationId` via the "ปิด" button. **Dialog auto-advance gotcha**: a dialog with `next` set and no choices auto-advances *without showing its lines*. For narration-then-continue, use a single confirmation choice (`choices: [{ text: "ก้าวต่อไป", next: "..." }]`).

#### Module map (`lib/world/`)

- **`types.ts`** — scene union, `Choice`, `SceneEffect` (incl. `learnSkill` / `learnArt` / `addTrait` / `addNpcRelationship` / `triggerBattle` with optional `nonFatal`), `Condition` (incl. `trait` / `npcRelationship`), `NpcDef`, `NpcStateEntry`, `OpponentDef` (with `ti`, `category`, `drops`), `ItemDef` (with `category`, `price`, `use: trainSkill | heal`), `TraitKey` (5 traits), `EnemyCategory`, `ITEM_CATEGORIES`, `WorldStateData`, `ActionLogEntry`, `PendingBattle`, `PendingEncounter`, `PendingHuntYield`, `PendingSpar`.
- **`stat-progression.ts`** — `STAT_XP_PER_ACTION = 10`, `xpToNextStatLevel(base) = 50 × base`, `lukRollChance(base) = min(50%, 10% + 1% × base)`, `STAT_FROM_LIFE_SKILL` (mining/wood/fishing/herbalism/venom → VIT, hard crafts → DEX, cultural → INT).
- **`conditions.ts`** — `evaluateCondition(state, c)`.
- **`effects.ts`** — `applyEffect` dispatcher.
- **`validate.ts`** — drops dangling refs, clamps numeric ranges, syncs `playerBuild.skillLevels` from world `skillLevel` map. Runs on rehydrate.
- **`battle-bridge.ts`** — module-level Zustand subscription. **One-way**: world → battle is automatic (passes current HP / MP into the next fight); battle → world is user-driven via `acknowledgeBattleResult`.

#### Data tables (`lib/world/data/`)

- **`scenes.ts`** — Core tutorial scenes + `WORLD_MAP_SCENES`. `START_SCENE_ID = "home_player"`.
- **`world-map.ts`** — 7 cities, 7 villages, 17 sects, 10 isles, 11 terrain features, 12 caves, 5 temples, 4 mansions, 4 inns, 11 NPC homes, 7 misc — total **~85 leaves**. Builds the connectivity graph from `LOCATION_ROUTES` (no random fill). Direction backtracker (still produces N/S/E/W ordering for sort) is bounded by a step budget.
- **`location-routes.ts`** — explicit hand-curated edge list. Each entry is a `LocationRoute { a, b, fromA, fromB, hintA?, hintB? }` with **per-direction labels** (the route button reads "ลำคลองใหญ่" going one way and "ลำคลองใหญ่" / "ทางย้อนสู่..." coming back). Adding a new edge only requires appending here.
- **`sects.ts`** — `SECT_ORDER` and `JIANGHU_SECT = "ยุทธจักร"`. Default sect for unaffiliated skills / arts.
- **`opponents.ts`** — 35 `OpponentDef`s across **5 tiers** (5 / 10 / 10 / 5 / 5). Each has `ti`, `category` (human / beast / supernatural), `drops`, `build()`. Tier 2+ carry move skills; tier 3+ carry inner skills with levels.
- **`npcs.ts`** — `NpcDef` registry. `dialogSceneId?` enables 💬 talk; `sparOpponentId?` enables ⚔ spar (non-fatal battle); `locationIds[]` places them.
- **`items.ts`** — every item has `category` (10 categories) and `price`. `use` can be `{ t: "trainSkill" }` or `{ t: "heal", hp?, mp? }`.
- **`shops.ts`** — `ShopDef` per location. Inventory + `acceptsCategories` filter + `sellMultiplier`. Cities = full general store (50 % sell-back), inns = food-focused (40 %), villages = tiny (35 %).
- **`sect-halls.ts`** — `SectHallDef` per city. Each city's martial school sells **different** tier 0 / 1 move skills + inner skills.
- **`recipes.ts`**, **`resources.ts`**, **`life-skills.ts`** — crafting + gathering catalogs.
- **`random-events.ts`** — `EVENT_PROBABILITY.fight = 0.15`, treasure scales with LUK (5 % + LUK/200, cap 25 %), meet (10 % + LUK/300, cap 35 %). `FIGHT_EVENTS` is tier-weighted (T0 weight 8 → T4 weight 0.5). `fightEventsForLocation(id)` filters by zone (city = humans only, wild = beasts + humans + a touch of supernatural, etc.) — see `ZONE_CATEGORY_WEIGHT`.

### Routes

- **`/`** (`app/page.tsx`) — the world game. Renders `<WorldScreen />`, calls `initBattleBridge()` once on mount.
- **`/debug`** (`app/debug/page.tsx`) — dev sandbox: setup tab (CharacterCard A & B), library, free-form `<BattleArena mode="free" />`. World player is fully decoupled from `character-store`.

### `store/` — Zustand wrappers

All `"use client"`. Five stores:

- **`character-store.ts`** — `/debug` setup-tab state. Persisted (`wusia-character-v1`, version 2). World does **not** read from this. v1 → v2 padded `skillIds` 5 → 10 and seeded `learnedSkillIds` / `learnedArtIds` / `artLevels`.
- **`battle-store.ts`** — runtime battle state. **Not persisted**. `start(a, b, opts?)` accepts `hpA / mpA` carryover. `useSkill(slotIdx)` parses the slot and dispatches to `resolveSkill` or `resolveArtActive`.
- **`world-store.ts`** — story state (scenes, flags, quests, inventory, gold, traits, NPC states, skill / stat progression, action log). Persisted (`wusia-world-v1`, version 11) with `validateAndRepair` on rehydrate.
- **`loading-store.ts`** — `flashLoading(message, duration?)`. Auto-hides after 300 ms by default. Used for gather / craft / rest action feel (NOT travel — travel is instant).
- **`toast-store.ts`** — `toast(kind, message, durationMs?)`. Stack of up to 3 visible at once, auto-dismiss after 2.6 s. Kinds: success / info / warn / error.

UI components subscribe via the standard selector pattern: `useWorldStore((s) => s.flags)`. Don't read `getState()` from inside components — only from event handlers / store internals / bridge subscriptions.

### Player progression systems (in world-store)

- **W-exp (`wExp`)** — global pool, earned from any action (gather +10, craft +5, useItem +5, practice +5, fight win +50). Spent via the move-skill popup's "เร่งด้วย w-exp" button.
- **Per-skill xp (`skillExp[id]`)** — earned per use of that skill in a winning battle (`SKILL_USE_XP × count`). **Auto-levels** when full.
- **Per-stat xp (`statExp[STR..LUK]`)** — see mapping in `stat-progression.ts`. **Auto-levels** when crossing `xpToNextStatLevel`. Cost scales with the *base* stat (item / skill bonuses excluded).
- **Traits (`traits.good / evil / arrogance / humility / fame`)** — adjusted by `addTrait` SceneEffect and sparring wins (fame). Read by `Condition.trait`.
- **NPC relationship (`npcStates[id].relationship`)** — adjusted by `addNpcRelationship` SceneEffect. Read by `Condition.npcRelationship`.
- **Action log (`actionLog: ActionLogEntry[]`)** — last 100 events. Pushed by `appendActionLog(state, kind, message)` from inside store actions. Surfaced via `📜 บันทึก` menu popup.

### Battle ↔ World seam (`lib/world/battle-bridge.ts`)

`initBattleBridge()` is called once from `app/page.tsx` (idempotent, SSR-safe). **One-way automatic** — only the world-to-battle transition is auto-driven.

1. **World → Battle (auto)**: `useWorldStore.subscribe` watches `pendingBattle`. When set, the bridge looks up the opponent and calls `battleStore.start(playerBuild, opp.build(), { hpA: ws.currentHp, mpA: ws.currentMp })`. The world UI renders `<BattleArena mode="world" onContinue={acknowledge} />` inline.
2. **Battle → World (manual)**: `BattleArena` shows a "ดำเนินเรื่อง →" button when `state.winner` is set. Clicking calls `worldStore.acknowledgeBattleResult()`, which:
   - Charges `FIGHT_STAMINA` + advances time by `FIGHT_HOURS`
   - Snapshots `state.hA / mpA` back into `currentHp / currentMp`
   - On **win**: rolls opponent's drop table, banks w-exp, grants per-skill xp from `state.skillUses.A`, rolls STR/POW/DEF/LUK stat xp, awards spar fame if `pendingSpar` is set, drops hunt yield if `pendingHuntYield` is set, then `gotoScene(onWin)`
   - On **non-fatal loss** (sparring): clears state and routes to `onLose`
   - On **fatal loss**: sets `gameOver = true`

`reconcile()` runs once on bridge init: if `pendingBattle` exists but the battle store is null (refresh wiped it), it restarts the battle.

### Random encounters (fight / flee)

When `rollRandomEvent` rolls a fight (15 % base), it sets `pendingEncounter` (NOT `pendingBattle` directly). The world UI swaps to `<EncounterScreen>` showing tier + category badges and two buttons:

- **⚔ ต่อสู้** → `acceptEncounter()` promotes the offer to `pendingBattle`. Bridge starts the fight.
- **🏃 หนี** → `fleeEncounter()` clears the offer. Player stays put, no cost.

`fightEventsForLocation(id)` filters the encounter pool by zone — see `ZONE_CATEGORY_WEIGHT` in `random-events.ts`.

### UI layer

- **`components/ui/`** — shadcn primitives (Button, Card, Combobox, Modal, etc.). Custom `Combobox` wraps Popover + cmdk.
- **`components/game/`** — battle / setup feature components. **`BattleArena`** has a `mode?: "free" | "world"` prop (free = full controls, world = continue-only). `BattleLog` uses `dangerouslySetInnerHTML` because log lines are pre-formatted HTML produced from controlled inputs in `effects.ts` / `battle.ts`. Inline classes (`.lp`, `.lC`) live in `app/globals.css`.
- **`components/world/`** — world feature components. `WorldScreen` is the page root. Render precedence:
  - `!hasGame` → `<StartScreen />`
  - `gameOver` → `<GameOverScreen />`
  - `pendingBattle` → `<BattleArena mode="world" />`
  - `pendingEncounter` → `<EncounterScreen />`
  - else → scene-based (dialog / location / route view)
  - Always mounted at root: `<LoadingOverlay />` + `<ToastStack />`
- **`components/world/popups/`** — modal popups for the menu bar (profile, inventory, move skills, inner skills, life skills, action log, NPC interaction, shop, sect hall).

### Adding new game content

Most additions don't require touching dispatchers:

- **New skill** → append to `SKILLS` in `lib/game/data/skills.ts` (with `sc` + `ti` + optional `types`). Sort order: by sect → tier.
- **New inner skill** → append to `ARTS` in `lib/game/data/arts.ts` (same sort).
- **New equipment** → append to `EQUIPMENT`.
- **New location** → append a `{ kind: "location", ... }` to `SCENES` (or use the `leaf()` helper in `world-map.ts`). Then add at least one entry to `LOCATION_ROUTES` so it's reachable. Console will warn if a leaf has no explicit route.
- **New route between locations** → append a `LocationRoute` with both directional labels to `location-routes.ts`.
- **New dialog scene** → append a `{ kind: "dialog", ... }`. End on `choices` or terminal (auto "ปิด"). Don't use `next` without `choices` unless you want lines skipped.
- **New quest / item / opponent / NPC / shop / sect hall** → append to the matching table in `lib/world/data/`. Most have a single registry export + a `getX(id)` helper.
- **New combat effect** → variant in `lib/game/types.ts` + case in `effects.ts` (or `battle.ts` for art-active types). TS exhaustiveness flags missed dispatchers.
- **New scene effect / condition** → variant in `lib/world/types.ts` + case in `effects.ts` / `conditions.ts`.
- **New trait** → append to `TRAIT_KEYS` and `TRAIT_LABEL`. The dispatcher and condition handler treat it generically.
- **New action with toast feedback** → call `toast("success" | "info" | "warn" | "error", message)` and (from the store) `appendActionLog(draft, kind, message)`. Add a label to `KIND_LABEL` / `KIND_COLOR` in `action-log-popup.tsx`.

### Save format & migrations

Two persisted Zustand slices, separate localStorage keys, separate version fields:

- `wusia-character-v1` — `{ builds: { A, B } }` (only used by /debug). Version 2 (v1 → v2 padded slots, seeded learned arrays).
- `wusia-world-v1` — world state minus action functions. Version **11**. Migration chain (additive defaults at each step):
  1. v1 → v2: stamina + lifeSkillXp(6) + pendingHuntYield
  2. v2 → v3: lifeSkillXp 6 → 17 keys
  3. v3 → v4: day / time
  4. v4 → v5: wExp / skillLevel / skillExp
  5. v5 → v6: statExp
  6. v6 → v7: traits / npcStates / pendingSpar
  7. v7 → v8: currentHp / currentMp
  8. v8 → v9: skillIds 5 → 10 + learnedSkillIds / learnedArtIds / artLevels (auto-slots legacy `artId` into a free slot)
  9. v9 → v10: pendingEncounter
  10. v10 → v11: actionLog

`battle-store` is intentionally not persisted.

`validateAndRepair` (world-store only) is the safety net for content drift (renamed scene ids, removed items / quests / opponents / NPCs / arts, stale `pendingBattle` / `pendingEncounter` / `pendingSpar`, dangling `learnedSkillIds` / `learnedArtIds`). It runs on every rehydrate.

`worldStore.resetGame()` wipes the world slice and resets the battle store. Character builds persist independently.

### Conventions kept from the original

The combat data tables use compact field names (`bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `mg`, `ti`, `w`, `sc`, `types`) so they cross-reference cleanly with `demo.html`. **Keep this style in `lib/game/data/`** — verbose names there hurt readability when scanning 100+ entries. World data (scenes / quests / items / shops / NPCs) is touched even more often during authoring, so it uses readable field names (`text`, `speaker`, `description`, `category`, `price`, etc.).

Thai is the canonical UI language; skill / art / equipment / scene / quest / item / shop / NPC names stay in Thai. If we ever want i18n later, the natural seam is to give each item an i18n key alongside `n` / `name` rather than translating the existing strings.
