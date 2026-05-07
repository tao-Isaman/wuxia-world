# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`กำลังภายใน — Battle Sim` (Thai-language wuxia / martial-arts text-RPG with a 1v1 turn-based battle layer) built as a Next.js 15 + React 19 + TypeScript app. UI uses shadcn/ui (Radix + Tailwind) wrapped in a custom **wuxia ink-on-paper** theme (Charm display + Sarabun body, vermilion + jade + cream palette, pixel-bordered chrome). Light mode only. State lives in five Zustand stores. The runtime is Bun, but Node 20+ also works.

`demo.html` (the original single-file prototype) is preserved as a behavioral reference for the *combat layer*. The world / RPG layer was designed in the rebuild and has no demo precedent. If a tuning question comes up about damage / effect numbers, the demo is the source of truth.

## Commands

```bash
bun install          # install deps
bun dev              # next dev — http://localhost:3000
bun run build        # next build
bun start            # run prod build
bun run lint         # next lint (ESLint flat config)
bun run typecheck    # tsc --noEmit
bun scripts/audit-content.ts     # scene / quest / NPC / item reference audit
bun scripts/audit-quest-flow.ts  # offer→accept→complete chain audit
```

There are no tests yet. If you add some, prefer Vitest (zero-config with the Bun runner).

## Architecture

Layered, strict downward dependency — UI depends on stores, stores depend on the engines, engines depend on nothing else (and not on each other except via the explicit bridge):

```
app/, components/        ← React components, Tailwind, wuxia primitives
   ↓
store/                   ← Zustand wrappers (character, battle, world, loading, toast)
   ↓
lib/game/   lib/world/   ← pure TypeScript engines (no React, no I/O)
              ↓
              battle-bridge.ts  ← only place the two stores talk to each other
```

### `lib/game/` — pure combat engine

The engine has no React, no DOM, no async, no hooks. Everything UI-facing flows through `lib/game/index.ts` (the public barrel).

- **`types.ts`** — discriminated unions on `t` (`SelfEffect`, `EnemyEffect`, `EquipEffect`, `ArtPassiveEffect`). Also `SkillType` (yin / yang / balance / hard / soft / internal / external) for the conflict system, and `SKILL_SLOT_COUNT = 10`. `BattleState` carries both `skillUses` and `artUses` (per-side counters used by the world store to grant per-skill / per-art XP post-battle).
- **`data/`** — static tables: `TIERS`, `SKILLS` (incl. `bst_*` beast moves), `ARTS`, `EQUIPMENT`, `STAT_KEYS`, `WEAPON_FAMILY_*`, `SECT_ORDER`/`JIANGHU_SECT`/`sectRank` (canonical sect list).
- **`derive.ts`** — base stats → derived combat stats (`derive`), `combinedStats` (merges base + active art + learned arts + slotted skills + learned skills + equipment, with conflict factors AND skill-level scaling on `sk.st`), `deriveAll` (adds HP/MP gain from arts), `getMasteryMap` (per-weapon-family mastery, scaled by skill level).
- **`damage.ts`** — `hitPct`, `critPct`, `hpColor`, `CRIT_MULTIPLIER`.
- **`leveling.ts`** — `effectiveBp(skill, level)` (lv 1 = 50 % bp, lv 10 = 100 %); `effectiveMg(skill, level)` (lv 1 = 100 %, lv 10 = 200 %); `xpToNextLevel(skill, level)` = `50 × level × (tier + 1)`. **Inner arts** also level 1–10 (`ART_LEVEL_MAX = 10`); `xpToNextArtLevel(art, lv)` = **2× the equivalent skill cost** (`100 × lv × (tier + 1)`).
- **`skill-conflict.ts`** — `computeConflictFactors(build, lookups)`. Counts learned skills + arts (excluding `balance` from axis tallies but including in the trigger threshold). When > 4 typed entries and one type holds > 60 % of an axis pair, the opposing type gets a half / zero modifier on `bp`, `st`, `mg`, and art HP / MP / stat scaling.
- **`slots.ts`** — slot encoding helpers. A slot string is either a bare skill id (`"tj"`) or an art id with `"art:"` prefix (`"art:taiji"`). `parseSlotId` returns a discriminated `{ kind, skill | art }`. `firstArtSlotIndex` picks the primary art for `BattleContext.artIds`.
- **`effects.ts`** — `applySelfEffect`, `applyEnemyEffect`, `checkPassive` / `applyPassiveEffect`, `tickEffects` (poison + duration decrement + equipment HP-regen), `addBuff` / `addDebuff`. New self-effect variants (`buff_spd`, etc.) go here first; the dispatcher `switch (eff.t)` enforces exhaustiveness.
- **`battle.ts`** — `BattleContext`, `makeContext` / `makeInitialState` (accepts `InitialStateOpts.hpA / mpA` for carryover), the central `calcSkillDamage`, `resolveSkill` (tracks `state.skillUses[side][skillId]`, `state.hitsReceived[ds]`), `resolveArtActive` (slot-aware via `opts.slotIdx`; tracks `state.artUses[side][artId]`). ATB-style `tickGauges` / `getNextTurn` use `effectiveSpd` to layer `buff_spd` on top of derived SPD.
- **`ai.ts`** — `runAITurn` parses each available slot via `parseSlotId` and dispatches to `resolveSkill` (skill) or `resolveArtActive` (art, MP-gated). Returns a boolean for lockout detection.

The damage formula in `calcSkillDamage`:

```
raw = max(1, (Atk * stackMod * artBonus + typedAtk + skillEffect) * dm * masteryMod - effectiveDef) * (1 - pctReduce/100)
```

…where `skillEffect = effectiveBp(sk, level) * conflictFactor * (1 + p/100) + f`.

Hit %: `clamp(80 + (Acc - Eva)/4, 5, 95)`. Crit %: `clamp(3 + (Cri - Res)/3, 0, 75)`, ×1.5 on crit. Mastery scales as `1 + (mastery/200) * 0.5` per equipped skill of the matching family (cap 200), with skill-level + conflict multipliers folded into the per-skill `mg` contribution.

**Skill-stat scaling**: `combinedStats` multiplies each move-skill's `sk.st` contribution by `bpMultiplier(skLv)` (lv 1 = 50 %, lv 10 = 100 %), so a freshly learned skill grants half its listed stat bonus and the full value at lv 10 — same curve as bp. Arts continue to scale stats by `lv / 10`.

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

### `lib/world/` — pure world / story engine

A second engine layered on top of the battle sim. Same conventions as `lib/game/`: discriminated unions on `t`, data tables, dispatchers, no React.

**Three scene kinds** (`Scene = DialogScene | LocationScene | RouteScene`):

- **`"dialog"`** — narration + dialogue lines + optional `choices` / `next`. Terminal dialogs (no choices, no next) get a "ปิด" button that returns to `lastLocationId`.
- **`"location"`** — persistent place. Description + `npcs[]` + `routes[]` + optional `resources[]` + optional `categories[]`. `home_player` is the starter location (`START_SCENE_ID`).
- **`"route"`** — travel screen. `destinations[]` (each navigates to a location with optional `effects`) + back button.

`Choice`, `NpcRef`, `RouteRef`, and `RouteDestination` all support `visibleIf: Condition`.

**Auto-return**: terminal dialogs return to `lastLocationId` via the "ปิด" button. **Dialog auto-advance gotcha**: a dialog with `next` set and no choices auto-advances *without showing its lines*. For narration-then-continue, use a single confirmation choice (`choices: [{ text: "ก้าวต่อไป", next: "..." }]`).

#### Module map (`lib/world/`)

- **`types.ts`** — scene union, `Choice`, `SceneEffect` (incl. `learnSkill` / `learnArt` / `addTrait` / `addNpcRelationship` / `triggerBattle` with optional `nonFatal`), `Condition` (incl. `trait` / `npcRelationship` / `defeatedOpponent` / `visitedLocation`), `NpcDef`, `NpcStateEntry`, `OpponentDef` (with `ti`, `category`, `drops`), `ItemDef` (with `category`, `price`, `use: trainSkill | heal`), `TraitKey` (5 traits), `EnemyCategory`, `LocationCategory` (13 keys), `ITEM_CATEGORIES`, `WorldStateData` (incl. `artExp`, `learnedRecipeIds`), `ActionLogEntry`, `PendingBattle`, `PendingEncounter`, `PendingHuntYield`, `PendingSpar`, `RecipeDef.basic?: boolean`, `ArtisanDef`.
- **`location-categories.ts`** — `inferCategoriesFromId`, `getLocationCategories`, `canPracticeAt`, `practiceXpBonus`, `describeBonusForLocation`. Practice categories: sect / mountain / forest / cave / river / temple. Bonus map: forest → yang/external, cave → yin/soft, mountain → balance/hard, river → internal. Bonus is a flat 1.30× multiplier — no stacking.
- **`stat-progression.ts`** — `STAT_XP_PER_ACTION = 10`, `xpToNextStatLevel(base) = 50 × base`, `lukRollChance(base) = min(50%, 10% + 1% × base)`, `STAT_FROM_LIFE_SKILL` (mining / wood / fishing / herbalism / venom → VIT, hard crafts incl. accessory → DEX, cultural → INT).
- **`conditions.ts`** — `evaluateCondition(state, c)`.
- **`effects.ts`** — `applyEffect` dispatcher, plus `tickQuestProgress`, `isQuestOfferable`, `isQuestTurnInForNpc`, **`collectActiveHuntTargets(state)`** (Set of opponentIds the player is hunting via current-stage `defeatedOpponent` autoAdvance — used by `rollRandomEvent` for the hunt-boost rule).
- **`validate.ts`** — drops dangling refs, clamps numeric ranges, drops unknown skill / art / recipe ids, syncs `playerBuild.skillLevels` from world `skillLevel` map. Runs on rehydrate.
- **`battle-bridge.ts`** — module-level Zustand subscription. **One-way**: world → battle is automatic (passes current HP / MP into the next fight); battle → world is user-driven via `acknowledgeBattleResult`.

#### Data tables (`lib/world/data/`)

- **`scenes.ts`** — Core tutorial scenes + `WORLD_MAP_SCENES`. `START_SCENE_ID = "home_player"`.
- **`world-map.ts`** — 7 cities, 7 villages, 17 sects, 10 isles, 11 terrain features, 12 caves, 5 temples, 4 mansions, 4 inns, 11 NPC homes, 7 misc — total **~85 leaves**. Builds the connectivity graph from `LOCATION_ROUTES` (no random fill).
- **`location-routes.ts`** — explicit hand-curated edge list. Each entry is a `LocationRoute { a, b, fromA, fromB, hintA?, hintB? }` with **per-direction labels**.
- **`sects.ts`** — `SECT_ORDER` and `JIANGHU_SECT = "ยุทธจักร"`. Default sect for unaffiliated skills / arts.
- **`opponents.ts`** — **45 `OpponentDef`s** across **5 tiers** (5 / 10 / 10 / 5 / 5 random-event roster + **10 hunt-only beasts** with the `hunt_*` prefix). Hunt opponents use base TIER_STATS (no overrides) so they're naturally weaker than tier-equivalent random-event beasts; they carry the `bst_*` skill family.
- **`npcs.ts` / `npcs/`** — `NpcDef` registry. `dialogSceneId?` enables 💬 talk; `sparOpponentId?` enables ⚔ spar (non-fatal battle); `locationIds[]` places them. Two pickup-only contacts added in cities for delivery quests (Wang at the capital, Li the book merchant at suzhou).
- **`items.ts`** — every item has `category` (10 categories) and `price`. `use` can be `{ t: "trainSkill" }` or `{ t: "heal", hp?, mp? }`. Quest items carry `category: "quest"` + `price: 0` so shops won't sell them.
- **`shops.ts`** — `ShopDef` per location. Inventory + `acceptsCategories` filter + `sellMultiplier`. Cities = full general store (50 % sell-back), inns = food-focused (40 %), villages = tiny (35 %).
- **`sect-halls.ts`** — `SectHallDef` per city. **Tier 0–1 ยุทธจักร skills + arts only** — sect-affiliated styles must be learned at the parent sect, not the public city hall. Each city's roster differs.
- **`artisans.ts`** — `ArtisanDef` per location. **All 7 cities auto-generate 6 craft artisans each** (forge / alchemy / tailoring / chef / jewelry / accessory) via the `buildCityArtisan` helper. Plus hand-curated single-profession artisans in select villages and sects. `recipesOfferedBy(artisan)` folds in basic recipes for the profession + the artisan's specialty list, so authors only declare specialties — basic staples come for free.
- **`recipes.ts`** — crafting recipes. `RecipeDef.basic === true` opts a recipe into the per-profession fan-out (every artisan of that profession sells it). Specialty recipes are hand-assigned to specific artisans in `artisans.ts`.
- **`life-skills.ts`** — 18 life skills incl. the new `accessory`. `LIFE_SKILL_LABEL`, `LIFE_SKILL_ICON`, mastery thresholds, drop-check formula.
- **`resources.ts`** — gather + hunt nodes. Hunt nodes (`hunt_forest`, `hunt_mountain`, `hunt_legendary`) point at the dedicated `hunt_*` opponent pool — separate from random-event beasts.
- **`random-events.ts`** — `EVENT_PROBABILITY.fight = 0.15`, **`fightHunting = 0.80`** (hunt boost); treasure / meet scale with LUK (5 % + LUK/200, cap 25 %; 10 % + LUK/300, cap 35 %). `FIGHT_EVENTS` is tier-weighted (T0 weight 8 → T4 weight 0.5). `fightEventsForLocation(id)` filters by zone (city = humans only, wild = beasts + humans + a touch of supernatural, etc.) — see `ZONE_CATEGORY_WEIGHT`.
- **`quests.ts`** — quest definitions split per zone (`cities.ts` / `villages.ts` / `sects-temples.ts` / `wilderness.ts`). Stages have optional `autoAdvance: Condition`; the engine ticks progress after every effect via `tickQuestProgress`.

### Routes

- **`/`** (`app/page.tsx`) — the world game. Renders `<WorldScreen />`, calls `initBattleBridge()` once on mount.
- **`/debug`** (`app/debug/page.tsx`) — dev sandbox: setup tab (CharacterCard A & B), library, free-form `<BattleArena mode="free" />`. World player is fully decoupled from `character-store`.

### `store/` — Zustand wrappers

All `"use client"`. Five stores:

- **`character-store.ts`** — `/debug` setup-tab state. Persisted (`wusia-character-v1`, version 2). World does **not** read from this. v1 → v2 padded `skillIds` 5 → 10 and seeded `learnedSkillIds` / `learnedArtIds` / `artLevels`.
- **`battle-store.ts`** — runtime battle state. **Not persisted**. `start(a, b, opts?)` accepts `hpA / mpA` carryover. `useSkill(slotIdx)` parses the slot and dispatches to `resolveSkill` or `resolveArtActive`. `BattleState` tracks both `skillUses` and `artUses` for the world store to drain on win.
- **`world-store.ts`** — story state (scenes, flags, quests, inventory, gold, traits, NPC states, skill / art / stat progression, learned recipes, action log). Persisted (`wusia-world-v1`, **version 14**) with `validateAndRepair` on rehydrate. Notable actions: `practiceSkill`, `levelUpArtFromWExp`, `levelUpSkillFromWExp`, `buyRecipe`, `craftRecipe` (artisan-gated for the 6 craft professions), `abandonQuest`.
- **`loading-store.ts`** — `flashLoading(message, duration?)`. Auto-hides after 300 ms by default. Used for gather / craft / rest / practice action feel (NOT travel — travel is instant).
- **`toast-store.ts`** — `toast(kind, message, durationMs?)`. Stack of up to 3 visible at once, auto-dismiss after 2.6 s. Kinds: success / info / warn / error.

UI components subscribe via the standard selector pattern: `useWorldStore((s) => s.flags)`. Don't read `getState()` from inside components — only from event handlers / store internals / bridge subscriptions.

### Player progression systems (in world-store)

- **W-exp (`wExp`)** — global pool, earned from any action (gather +10, craft +5, useItem +5, practice +5, fight win +50). Spent via "เร่งด้วย w-exp" buttons on either move skills or arts.
- **Per-skill xp (`skillExp[id]`)** — earned per use of that skill in a winning battle (`SKILL_USE_XP × count`). **Auto-levels** when full.
- **Per-art xp (`artExp[id]`)** — parallel to `skillExp`. Earned per art active fired in a winning battle. **Cost curve = 2× the move-skill cost** (`xpToNextArtLevel` in lib/game/leveling). **Auto-levels** when full; level cap = 10. Levels live on `playerBuild.artLevels`.
- **Per-stat xp (`statExp[STR..LUK]`)** — see mapping in `stat-progression.ts`. **Auto-levels** when crossing `xpToNextStatLevel`. Cost scales with the *base* stat (item / skill bonuses excluded).
- **Traits (`traits.good / evil / arrogance / humility / fame`)** — adjusted by `addTrait` SceneEffect and sparring wins (fame). Read by `Condition.trait`.
- **NPC relationship (`npcStates[id].relationship`)** — adjusted by `addNpcRelationship` SceneEffect. Read by `Condition.npcRelationship`.
- **Defeated counts (`defeatedCounts[opponentId]`)** — incremented in `acknowledgeBattleResult` on win. Read by `Condition.defeatedOpponent`. Drives the hunt-boost rule.
- **Visited locations (`visitedLocationIds`)** — pushed when a location scene is entered. Read by `Condition.visitedLocation`.
- **Learned recipes (`learnedRecipeIds`)** — recipe id list; populated by `buyRecipe` at artisan popups. `craftRecipe` requires the recipe to be in this list AND the player to be at an artisan whose profession matches `recipe.skill` (for the 6 craft professions only).
- **Action log (`actionLog: ActionLogEntry[]`)** — last 100 events. Pushed by `appendActionLog(state, kind, message)` from inside store actions. Surfaced via `📜 บันทึก` menu popup.

### Practice action

- `store/world-store.ts` → `practiceSkill(rawId)` accepts the slot-encoded form (`"art:xxx"` for inner arts, bare id for move skills).
- Costs `PRACTICE_STAMINA_COST = 30` + advances `PRACTICE_HOURS = 6` ชั่วยาม.
- Awards `PRACTICE_BASE_XP = 30` xp on the chosen skill / art (hits `skillExp` or `artExp`); auto-levels.
- **Location bonus**: `practiceXpBonus(scene, types)` returns `1.30` when the location's category set intersects the skill/art's `types` per the rule `forest→yang/external · cave→yin/soft · mountain→balance/hard · river→internal`. Otherwise `1.0`.
- Eligibility: `canPracticeAt(scene)` must return true (sect / mountain / forest / cave / river / temple). LocationView renders the "🧘 ฝึกฝน" button only for eligible locations.
- Popup: `components/world/popups/practice-popup.tsx`. Shows learned skills + arts, location's matched bonus types, stamina check; uses `flashLoading` for a 1-sec deliberate pause.

### Hunt-boost mechanic

- Active when `collectActiveHuntTargets(state)` returns a non-empty set AND at least one target appears in `fightEventsForLocation(currentSceneId)`.
- `rollRandomEvent` swaps the encounter chance from `EVENT_PROBABILITY.fight` (0.15) to `EVENT_PROBABILITY.fightHunting` (0.80) and restricts the pool to the targets only.
- Treasure / meet bands are suppressed during a hunt (the player is in focus mode).
- Falls back to default behavior when no target fits the zone (e.g., kill-tigers quest while inside a city zone where beasts are filtered out).
- The boost ends automatically when the quest stage advances past the kill condition (e.g., to "return to NPC") because `collectActiveHuntTargets` only inspects current-stage `defeatedOpponent` autoAdvances.

### Crafting / artisans

- 6 craft professions are artisan-gated: **forge / alchemy / tailoring / chef / jewelry / accessory**. `craftRecipe` for these professions requires (a) `learnedRecipeIds.includes(recipeId)` AND (b) the player be at a location with `getArtisansAt(scene.id)` containing an artisan whose `profession === recipe.skill`.
- Other recipes (mining / hunting / herbalism / venom / woodcutting / fishing / drawing / writing) keep the legacy "craft inline anywhere" behavior — they were never shop-gated.
- Cities: every city auto-hosts all 6 artisans via `buildCityArtisan` in `artisans.ts`.
- Villages / sects: hand-curated, one profession per location.
- Recipe distribution: `RecipeDef.basic === true` recipes auto-fan-out to every artisan of that profession at a default basic price. Specialty (non-basic) recipes appear only on artisans listed in `CITY_SPECIALTIES` or in `SINGLE_PROFESSION_ARTISANS.recipes`. Adding a new specialty = one row in `CITY_SPECIALTIES`.
- ArtisanPopup (`components/world/popups/artisan-popup.tsx`) exposes three tabs: ซื้อสูตร (buy recipes filtered to unlearned) · ประดิษฐ์ (craft from learned recipes filtered to this profession) · ซื้อ-ขาย (small item shop with `acceptsCategories` filter on sell-back).
- The lifeskills popup's "สูตรที่เรียน" tab is read-only — it lists what the player has learned and points them at the right artisan; no craft button.

### Battle ↔ World seam (`lib/world/battle-bridge.ts`)

`initBattleBridge()` is called once from `app/page.tsx` (idempotent, SSR-safe). **One-way automatic** — only the world-to-battle transition is auto-driven.

1. **World → Battle (auto)**: `useWorldStore.subscribe` watches `pendingBattle`. When set, the bridge looks up the opponent and calls `battleStore.start(playerBuild, opp.build(), { hpA: ws.currentHp, mpA: ws.currentMp })`. The world UI renders `<BattleArena mode="world" onContinue={acknowledge} />` inline.
2. **Battle → World (manual)**: `BattleArena` shows a "ดำเนินเรื่อง →" button when `state.winner` is set. Clicking calls `worldStore.acknowledgeBattleResult()`, which:
   - Charges `FIGHT_STAMINA` + advances time by `FIGHT_HOURS`
   - Snapshots `state.hA / mpA` back into `currentHp / currentMp`
   - On **win**: rolls opponent's drop table, banks w-exp, grants per-skill xp from `state.skillUses.A`, **per-art xp from `state.artUses.A`**, rolls STR/POW/DEF/LUK stat xp, awards spar fame if `pendingSpar` is set, drops hunt yield if `pendingHuntYield` is set, increments `defeatedCounts[opponentId]`, then `gotoScene(onWin)`
   - On **non-fatal loss** (sparring): clears state and routes to `onLose`
   - On **fatal loss**: sets `gameOver = true`

`reconcile()` runs once on bridge init: if `pendingBattle` exists but the battle store is null (refresh wiped it), it restarts the battle.

### Random encounters (fight / flee)

When `rollRandomEvent` rolls a fight (15 % base, **80 % during a hunt**), it sets `pendingEncounter` (NOT `pendingBattle` directly). The world UI swaps to `<EncounterScreen>` showing tier + category badges and two buttons:

- **⚔ ต่อสู้** → `acceptEncounter()` promotes the offer to `pendingBattle`. Bridge starts the fight.
- **🏃 หนี** → `fleeEncounter()` clears the offer. Player stays put, no cost.

`fightEventsForLocation(id)` filters the encounter pool by zone — see `ZONE_CATEGORY_WEIGHT` in `random-events.ts`. The hunt-boost rule additionally restricts the pool to `defeatedOpponent` quest targets.

### UI layer

- **`components/ui/`** — shadcn primitives (Button, Card, Combobox, Modal, Progress, Badge). `Button` has a `pixel` variant; `Progress` has a `variant: "hp" | "qi" | "exp" | "stamina"` plus a `pixel` boolean for segmented JRPG-style fills; `Badge` has a `seal` variant for vermilion 印章 stamps.
- **`components/ui/wuxia/`** — wuxia-only primitives: `Panel` (pixel-bordered frame via `border-image` 9-slice from inline SVG; variants `default` vermilion, `quiet` ink, `flat` borderless), `WuxiaButton` (stacked-shadow pixel bevel, `default` / `primary` / `ghost` variants), `OrnamentDivider` (vermilion ❖ section break).
- **`components/game/`** — battle / setup feature components. **`BattleArena`** has a `mode?: "free" | "world"` prop (free = full controls, world = continue-only). `BattleLog` uses `dangerouslySetInnerHTML` because log lines are pre-formatted HTML produced from controlled inputs in `effects.ts` / `battle.ts`. Inline classes (`.lp`, `.lC`) live in `app/globals.css`; `.lC` (crit / special-name highlight) is now driven by `--primary` (vermilion), not a hardcoded amber.
- **`components/world/`** — world feature components. `WorldScreen` is the page root. Single-column layout (sidebar removed; quest log / profile / etc. all live in the menu-bar popups). Render precedence:
  - `!hasGame` → `<StartScreen />`
  - `gameOver` → `<GameOverScreen />`
  - `pendingBattle` → `<BattleArena mode="world" />`
  - `pendingEncounter` → `<EncounterScreen />`
  - else → scene-based (dialog / location / route view)
  - Always mounted at root: `<LoadingOverlay />` + `<ToastStack />`
- **`components/world/popups/`** — modal popups for the menu bar: profile, inventory, move skills, life skills, **quest log** (tabbed: กำลังทำ / สำเร็จ / ละทิ้ง with click-to-expand stage checklist + cancel button), action log, NPC interaction, shop, sect hall, **artisan**, **practice**.

### Theme tokens (`app/globals.css` + `tailwind.config.ts`)

- **Palette** — light only. `--background` cream paper, `--foreground` ink black, `--primary` vermilion 朱红, `--accent` jade 翠青, `--destructive` deeper crimson, `--border` faded ink. Battle-side accents: `--side-a` indigo ink, `--side-b` vermilion. `--radius: 0` (pixel chrome has no curves).
- **Fonts** — `var(--font-display)` = Charm (Google), `var(--font-body)` = Sarabun. Loaded via `next/font/google` in `app/layout.tsx`. **Charm is reserved for ≥ 16px headers / proper-noun labels**; Thai tone marks render blurry below that — use Sarabun for body / dialog.
- **Background** — body has a tiled inline-SVG paper-noise texture, *not* pixelated.
- **Pixel utilities** — `.pixel` (`image-rendering: pixelated`), `.frame-pixel` and `.frame-pixel-quiet` (9-slice border via inline-SVG `border-image`). Tailwind `boxShadow.pixel` / `pixel-down` provide the WuxiaButton bevel.
- **Wuxia color aliases** — `bg-ink`, `bg-paper`, `bg-vermilion`, `bg-jade`, `text-ink`, `text-vermilion`, `text-jade` for places where the shadcn semantic tokens (`primary` / `accent`) don't fit the use case (e.g., HP red distinct from vermilion primary).

### Adding new game content

Most additions don't require touching dispatchers:

- **New skill** → append to `SKILLS` in `lib/game/data/skills.ts` (with `sc` + `ti` + optional `types`). Sort order: by sect → tier.
- **New inner skill** → append to `ARTS` in `lib/game/data/arts.ts` (same sort).
- **New equipment** → append to `EQUIPMENT`.
- **New location** → append a `{ kind: "location", ... }` to `SCENES` (or use the `leaf()` helper in `world-map.ts`). Optionally pass `categories: [...]` to override the prefix-inferred set. Then add at least one entry to `LOCATION_ROUTES` so it's reachable. Console will warn if a leaf has no explicit route.
- **New route between locations** → append a `LocationRoute` with both directional labels to `location-routes.ts`.
- **New dialog scene** → append a `{ kind: "dialog", ... }`. End on `choices` or terminal (auto "ปิด"). Don't use `next` without `choices` unless you want lines skipped.
- **New quest / item / opponent / NPC / shop / sect hall** → append to the matching table in `lib/world/data/`. Most have a single registry export + a `getX(id)` helper.
- **New artisan** → append to `SINGLE_PROFESSION_ARTISANS` in `artisans.ts`. To give a city's existing auto-generated artisan a unique recipe, append a row to `CITY_SPECIALTIES` (one line: `{ city, prof, recipeId, price }`).
- **New basic recipe** → set `basic: true` on the `RecipeDef`. It auto-fans out to every artisan of that profession; no manual wiring per shop.
- **New combat effect** → variant in `lib/game/types.ts` + case in `effects.ts` (or `battle.ts` for art-active types). TS exhaustiveness flags missed dispatchers.
- **New scene effect / condition** → variant in `lib/world/types.ts` + case in `effects.ts` / `conditions.ts`.
- **New trait** → append to `TRAIT_KEYS` and `TRAIT_LABEL`. The dispatcher and condition handler treat it generically.
- **New action with toast feedback** → call `toast("success" | "info" | "warn" | "error", message)` and (from the store) `appendActionLog(draft, kind, message)`. Add a label to `KIND_LABEL` / `KIND_COLOR` in `action-log-popup.tsx`.

### Save format & migrations

Two persisted Zustand slices, separate localStorage keys, separate version fields:

- `wusia-character-v1` — `{ builds: { A, B } }` (only used by /debug). Version 2 (v1 → v2 padded slots, seeded learned arrays).
- `wusia-world-v1` — world state minus action functions. **Version 14**. Migration chain (additive defaults at each step):
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
  11. v11 → v12: defeatedCounts + visitedLocationIds (quest auto-advance bookkeeping)
  12. v12 → v13: artExp (per-art XP pool)
  13. v13 → v14: learnedRecipeIds + accessory life-skill key. Crafting now requires the recipe to be learned + the player to be at a matching artisan.

`battle-store` is intentionally not persisted.

`validateAndRepair` (world-store only) is the safety net for content drift (renamed scene ids, removed items / quests / opponents / NPCs / arts / recipes, stale `pendingBattle` / `pendingEncounter` / `pendingSpar`, dangling `learnedSkillIds` / `learnedArtIds` / `learnedRecipeIds`). It runs on every rehydrate.

`worldStore.resetGame()` wipes the world slice and resets the battle store. Character builds persist independently.

### Conventions kept from the original

The combat data tables use compact field names (`bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `mg`, `ti`, `w`, `sc`, `types`) so they cross-reference cleanly with `demo.html`. **Keep this style in `lib/game/data/`** — verbose names there hurt readability when scanning 100+ entries. World data (scenes / quests / items / shops / NPCs / artisans) is touched even more often during authoring, so it uses readable field names (`text`, `speaker`, `description`, `category`, `price`, etc.).

Thai is the canonical UI language; skill / art / equipment / scene / quest / item / shop / NPC / artisan names stay in Thai. If we ever want i18n later, the natural seam is to give each item an i18n key alongside `n` / `name` rather than translating the existing strings.
