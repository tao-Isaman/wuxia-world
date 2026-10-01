# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the short version: the rules, commands and facts you need every session. The detail lives in `docs/` — start at [docs/README.md](docs/README.md).

## Project

**กำลังภายใน — ยุทธภพ** is a Thai-language wuxia RPG in the browser.

- **Stack:** Next.js 15 + React 19 + TypeScript, Phaser 4 for the map and the battle board, Zustand for state (six stores), Tailwind + hand-written CSS.
- **Look:** a Dragon Quest XI–style lacquer HUD with parchment menus and full-screen dialogue.
- **Runtime:** Bun (Node 20+ also works).
- **Language:** everything the player reads is Thai; code, ids and comments are English.

**What the player does:**

- Explores 102 places (101 painted maps) joined by 128 roads.
- Meets 157 NPCs and takes 276 quests.
- Joins one of 15 sects and learns 178 move skills and 122 inner arts.
- Gathers and crafts (19 life skills).
- Steals and gets jailed.
- Fights **turn-based tactics on a 10 × 7 to 15 × 10 board**.

`demo.html` is the original single-file combat prototype. It is the reference for combat *numbers* (damage and effect tuning); everything else was designed in the rebuild.

## Where to look

| Question | Doc |
| --- | --- |
| How does a system play, with its numbers? | [docs/gameplay.md](docs/gameplay.md) |
| Layers, stores, data flow, where code goes | [docs/architecture.md](docs/architecture.md) |
| Stats, damage, effects, levels, type conflict | [docs/combat.md](docs/combat.md) |
| The tactics battle: board, turns, ranges, AI, store, renderer, UI | [docs/grid-combat.md](docs/grid-combat.md) |
| Scenes, effects, conditions, quests, objectives, guide, encounters, law, bad actions | [docs/world-engine.md](docs/world-engine.md) |
| Sect lineage quests, story sagas (มังกรหยก ภาค 3), cutscenes | [docs/story-quests.md](docs/story-quests.md) · writing: [docs/story-writing.md](docs/story-writing.md) |
| NPC simulation and rumors | [docs/liveness.md](docs/liveness.md) |
| Adding content (places, NPCs, quests, items, skills, sects…) | [docs/content-authoring.md](docs/content-authoring.md) |
| Map runtime, collision, characters, HUD, menus, CSS | [docs/rendering.md](docs/rendering.md) |
| Music and sound · install and offline | [docs/audio.md](docs/audio.md) · [docs/pwa.md](docs/pwa.md) |
| Saves, migration, repair | [docs/save-format.md](docs/save-format.md) |
| Tests and scripts | [docs/testing.md](docs/testing.md) · [docs/scripts.md](docs/scripts.md) |
| Every place / NPC / quest / skill / item / foe | [docs/reference/](docs/reference/README.md) (generated) |
| Current state, known issues, next steps | [HANDOFF.md](HANDOFF.md) |
| History | [docs/changelog.md](docs/changelog.md) |

## Commands

```bash
bun install
bun dev                     # http://localhost:3000
bun run build               # next build
bun run start -p 3017       # serve the production build (the e2e port)
bun run typecheck           # tsc --noEmit — must be clean
bun run lint                # next lint — 0 errors, 5 known warnings
bun run test:runtime        # the unit suites, one per line:
bun run test:combat
bun run test:opening
bun run test:navigation
bun run test:battle-background
bun run test:rumors
bun run test:investigation
bun run test:audio
bun run test:law
bun run test:walk
bun run test:grid
bun run test:grid-ai
bun run test:grid-skills
bun run test:grid-store
bun run test:npcs
bun run test:quests         # campaign audit + dead ends + every item/kill/objective quest + guidance + bad-action stages
bun run test:docs           # generated reference is current + docs links/paths/commands resolve
bun run test:e2e            # Playwright (Chromium) on :3017 — start a production server first
bun scripts/audit-content.ts            # every NPC / quest / scene reference resolves
bun scripts/build-docs-reference.ts     # regenerate docs/reference/ after data changes
bun scripts/sort-by-sect.ts             # re-sort skills.ts + arts.ts by sect, then tier (idempotent)
bun scripts/normalize-t3-stats.ts       # rewrite move-skill stat sums to 10/15/20/25/30 (review the diff)
bun scripts/map-collision-tool.ts <id> [json] [png]   # check / draw a painted map's collision
bun scripts/build-npc-sprites.ts        # NPC pixel sprites from public/npcs/body/
bun scripts/build-npc-sheets.ts         # rigged animation sheets for the 30 NPCs in lib/characters/npc-sheets.ts
bun scripts/smoke-liveness.ts           # 90-day NPC simulation smoke test
```

**Do not run:**

- **`scripts/split-sects-file.ts`** or **`scripts/append-templated-quests.ts`** — applied one-off migrations; rerunning them empties the sect barrels or duplicates 20 quests.
- **`bun scripts/build-map-footprints.ts`** with a partial folder — the per-map JSON sources are not in the repo.
- **Bare `bun test`** — it picks up the Playwright specs and fails.
- **`bun scripts/audit-quest-flow.ts`** as a gate — it is a legacy audit with 168 known false positives; `test:quests` replaced it.

## Verify before pushing

1. **Checks.** `bun run typecheck`, `bun run lint`, and every `bun run test:*` suite above.
2. **Browser tests.** For anything touching UI, rendering, stores or saves, run `bun run build`, then `bun run start -p 3017` in the background, then `bun run test:e2e`.
   - Stop the server with `fuser -k 3017/tcp`, **not** `pkill -f "next start"`, which can kill your own shell.
   - `pwa.spec.ts` only passes against a production server.
3. **Content changes.** Also run `bun scripts/audit-content.ts` and `bun scripts/build-docs-reference.ts`; commit the regenerated pages (`test:docs` fails otherwise).
4. **Docs.** Update the guide for the system you touched, add a line to [docs/changelog.md](docs/changelog.md), and refresh [HANDOFF.md](HANDOFF.md) when the verified state or known issues change.

**Cloud containers:**

- Browsers come from `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`; never run `playwright install`.
- Playwright 1.63 wants Chromium 1243, but the container ships 1194. Link the 1194 binaries into the 1243 folders first — the commands are in [docs/testing.md](docs/testing.md#cloud-container-notes).
- `localStorage["wuxia-random-events"] = "off"` (seeded by `playwright.config.ts`) stops walk-tick encounters in tests; only `law-guide.spec.ts` removes it.

## Architecture

```
app/, components/         React: screens, HUD, menus, popups, battle UI
   ↓
store/                    Zustand: world (saved, v21), battle, character (/debug, v3), loading, toast, confirm
   ↓
lib/world/  ──────►  lib/game/          pure engines — no React, no DOM, no I/O
   └ battle-bridge.ts: the one place the world and battle stores meet
lib/stage/ (Phaser, browser only) · lib/characters/ · lib/audio/
```

**Import rules:**

- `lib/game` imports nothing outside itself.
- `lib/world` imports `lib/game`, never React or stores.
- Stores use the engines; components use stores, engines and renderers.

Two deliberate exceptions reach into stores:

- `lib/world/battle-bridge.ts` watches `pendingBattle` and starts the battle store.
- `lib/stage/grid-battle-runtime.ts` reads the battle store each frame and calls `step()` for AI turns.

`initBattleBridge` is not in the `lib/world` barrel; import it from `@/lib/world/battle-bridge`. `app/page.tsx` calls it once.

**Routes:**

| Route | What |
| --- | --- |
| `/` | the game |
| `/debug` | combat sandbox with two builds from `character-store` and a free grid battle; independent of the world save |
| `/progress` | old journal, data frozen at wave 11 |
| `/manifest.webmanifest` | PWA manifest |

## Combat engine (`lib/game/`)

- **`types.ts`** holds discriminated unions on `t`:
  - `SelfEffect` (11 kinds);
  - `EnemyEffect` (13, including `poison_dmg`, `burn_hp_mp`, `stun`, `debuff_atk`);
  - `ArtPassiveEffect`, `EquipEffect`, 14 art-active types;
  - `SkillType` (yin / yang / balance / hard / soft / internal / external);
  - `SKILL_SLOT_COUNT = 10`.
- **Data tables** (`data/`): `TIERS`, `STAT_KEYS`, weapon families, `SECT_ORDER` / `JIANGHU_SECT` (`sects.ts`), `SKILLS` (178, incl. `bst_*` beast moves), `ARTS` (122 + the `none` placeholder; T5: `khbt`, `kuyt`, `kgim`), `EQUIPMENT` (76).
- **Stats.** `derive.ts` (`derive`, `combinedStats`, `deriveAll`, `getMasteryMap`).
  - `combinedStats` merges base + arts + slotted / learned skills with conflict and level scaling.
  - Equipment is **not** in `combinedStats`; `deriveAll` adds it.
- **Damage.** `battle.ts` has `calcSkillDamage`, `resolveSkill` and `resolveArtActive`, which track `skillUses` / `artUses` / `hitsReceived`.

  ```
  raw = max(1, (Atk × stackMod × artBonus + typedAtk + skillEffect) × dm × masteryMod − effectiveDef) × (1 − pctReduce/100)
  skillEffect = effectiveBp(skill, level) × conflict × (1 + p/100) + f + vitScale × VIT
  ```

  - Hit `clamp(80 + (Acc − Eva)/4, 5, 95)`.
  - Crit `clamp(3 + (Cri − Res)/3, 0, 75)`, ×1.5.
  - Mastery `1 + (mastery/200) × 0.5` per matching weapon family (cap 200).
- **Levels 1–10** (`leveling.ts`).
  - `effectiveBp` goes from 50 % at lv 1 to 100 % at lv 10; a skill's `st` bonus scales the same way. Art stats scale by `level/10`.
  - Xp to the next level: skill `50 × lv × (tier+1)`; art `100 × lv × (tier+1)`.
- **Type conflict** (`skill-conflict.ts`). With more than 4 typed entries and one side above 60 % of an axis, the opposing type is halved (internal ↔ external: zeroed).
- **Slots** (`slots.ts`). A slot holds a bare skill id or `"art:<id>"` (`parseSlotId`). The first art slot is the primary art.
- **Turn gauge.** It fills at `(Spd + 60) / 2600` per ms and acts at 100, keeping the overflow. **Don't replace the `+60` baseline with a straight Spd comparison** — it keeps slow characters in the fight (Spd 100 vs 20 is 2:1, not 5:1).
- **The grid** (`lib/game/grid/`) is the live battle system (board 10 × 7 up to 15 × 10 by unit count, `boardSizeFor`; packs up to 6, `MAX_PACK_SIZE`):
  - `engine.ts` handles per-unit gauges, move → act / wait / flee, and packs;
  - `duel.ts` reuses `battle.ts` per target;
  - `skill-grid.ts` has range and area profiles plus 18 overrides;
  - `ai.ts` has `planTurn`.
  - Move range is `clamp(3 + floor(Spd/80), 3, 6)`. Buffs and cooldowns tick on the owner's turn.
  - Retreat odds are `fleeChance` (`combat-actions.ts`), 20–90 %.
- **Legacy.** The 1v1 loop (`tickGauges` / `getNextTurn`), `ai.ts` `runAITurn` and the guard / recover actions are kept only for tests.

## World engine (`lib/world/`)

- **Scenes** (`kind`: `dialog | location | route`).
  - A dialog with `next` and no `choices` **auto-advances without showing its lines**. For narration, use one confirmation choice (`{ text: "ก้าวต่อไป", next }`).
  - A terminal dialog (no choices, no next) shows "ปิด", which returns to `lastLocationId`.
- **`SceneEffect`** (26 kinds) and **`Condition`** (24 kinds) live in `types.ts`, dispatched by `effects.ts` / `conditions.ts`.
  - **The `applyEffect` switch has no exhaustiveness guard**: a new variant without a case compiles and does nothing.
  - Counted conditions also need `describeQuestCondition` and the quest guide's `unmetLeaf`.
- **Quest progress.**
  - Kill stages (`defeatedOpponent`) count kills **since accepting** (snapshot in `acceptedDefeatedAt`).
  - Item stages (`hasItem`) count what the hero **holds now**; items carried before accepting count, and auto-finish / popup hand-in take them (`consumeQuestAutoItems`).
  - A store subscription re-ticks progress whenever `inventory` or `defeatedCounts` changes.
  - The last stage is the "return to the giver" beat; the NPC card offers hand-in there.
  - `qs_<questId>_offer` / `qs_<questId>_complete` are the optional briefing and hand-in dialogs.
- **Objectives** (`quest-objectives.ts`). `QuestStage.objective.spots[]` are 🔍 map spots, NPC-card actions or dialogs for stages nothing else can drive.
  - Each flag is `qobj:<quest>:<stageId>:<i>`.
  - A spot needs the hero at its `locationId` and costs `hours` (default 1).
- **Guide and tracking** (`quest-guide.ts`). `guideForQuest` gives an action, an optional counter, a place and a path for every stage type.
  - `trackedQuestId` is `flags.trackedQuestId`, else the newest active quest.
  - It feeds the quest log, the HUD tracker and the map's guide arrow.
- **Encounters roll while walking**, not on arrival.
  - Every 220 map units walked, `walkTick()` calls `rollWalkEvent(state, 0.4)`; `home_player` and `jail` are safe.
  - Per tick: fight 6 % (32 % while hunting a kill-quest target in this zone), treasure / meeting scaled by LUK.
  - The **law** roll (`lawChance(marks)`, 13–45 %) and the **30 % sect-hunter roll** are **not** scaled.
  - Foes are picked by zone and scaled by the hero's power (`max(day/200, (9 − best sect rank)/8)`): tier mix, elites, and opponent stats ×(1 + 0.6·power) for **every** battle.
  - `rollRandomEvent` is a no-op kept for old content.
- **Law** (`law.ts`).
  - Wanted marks (max 5) come from failed steals (+1) and jail escapes (+2); one fades every 10 quiet days.
  - Law fights are non-fatal. A loss goes to `jail_cell`: arrest (the `jail` map, `jailUntil`, 2 days per mark) or a 300-gold bribe.
- **Bad actions** (`bad-actions.ts`). Steal, assassinate and kidnap use base stats. A failed steal is a non-fatal fight plus a mark; failed assassinations and kidnappings are fatal.
- **Sects** (`data/sect-memberships.ts`, 15 joinable).
  - Ladders: 9 → 1 (eight sects), 5 → 1 (six) or 3 → 1 (Gumu).
  - Each rank has a reward pool; a single-item pool auto-grants.
  - Sect quests are repeatable after a 30-day cooldown.
  - Membership status is `active | resigned | betrayed`. Only `active` counts for `sectMember` / `anySectMember`.
  - Joins go through each intro quest's `joinSect` **reward**, which does not check `joinRequirements`; the intro's `prereqs` are the real gate.
  - Betrayal brings `hunter_<sectId>`; `qst_<sectId>_redemption` (14 sects; not xiaoyao) turns betrayed into resigned.
- **Liveness** (`npc-tick.ts`, `rumor-engine.ts`). Every `advanceTime` call:
  - runs the weekly tick of 20 named NPCs (up to 4 batches; leftover days are dropped);
  - fails active quests whose giver just died;
  - maintains rumors (caps 200 / 500, archive after 365 days).

  Rumors stay in their region. See [docs/liveness.md](docs/liveness.md).
- **Repair** (`validate.ts`). `validateAndRepair` runs on every load and drops dangling ids.

## Stores (`store/`)

- **`world-store.ts`** is saved as `wusia-world-v1`, **version 21**.
  - Actions draft a copy (`draftFrom`, **one level deep** — nested quest, sect and NPC entries are shared), call engine functions, then `set`.
  - Time goes through `advanceTime` (12 ชั่วยาม = 1 day). The player-visible log uses `appendActionLog` (newest 100).
- **`battle-store.ts`** is not saved.
  - `start(a, b, { hpA, mpA, enemies, looks, blocked })`, then `move` / `act` / `wait` / `flee` (player turn), `setAuto`, `step` (one AI beat), `stepAll`, `reset`.
  - Unit ids: `A` hero, `B` main foe, `pack<n>:<opponentId>`.
- **`character-store.ts`** holds the /debug builds, saved as `wusia-character-v1`, version 3.
- **Small stores:**
  - `loading-store.ts`: `flashLoading(message, ms = 1000, kind: "work" | "rest" | "stealth")`, which blocks input while shown.
  - `toast-store.ts`: `toast(kind, message, ms = 2600)`, max 3.
  - `confirm-store.ts`: `await confirmDialog({...})`.
- **Reading stores.** Components read stores with selectors (`useWorldStore((s) => s.flags)`). `getState()` is for event handlers, store internals and the bridge.

**Battle ↔ world:**

1. `pendingBattle` makes the bridge call `ensureBattleStarted()`: scale the foe, run `worldBattleSetup` (looks and pack), then `battleStore.start` with the hero's HP / MP.
2. At the end, the player's ดำเนินเรื่อง → `acknowledgeBattleResult()`. It applies:
   - stamina −5 and 0.5 ชั่วยาม;
   - HP / MP carry-over;
   - on a win: loot, 50 w-exp, 20 xp per skill / art use, stat xp and kill counts (pack members included), then quest progress and `onWin`;
   - on a non-fatal loss: `onLose` with at least 1 HP;
   - on a fatal loss: `gameOver`;
   - on an escape: no rewards.

## Rendering (`lib/stage/`)

- **Stage.** `phaser-stage.ts` makes one `Phaser.Game` per view: `AUTO` (WebGL, Canvas fallback), `pixelArt`, DPR cap 2. **Phaser input is off** — the runtimes use DOM listeners.
- **World runtime.** `world-runtime.ts` works in 960 × 640 map units (y down).
  - Cover-fit camera; WASD, tap-to-walk and a joystick.
  - The action target is the nearest marker within 95 units; E reaches 100.
  - Walk ticks every 220 units; a guide arrow; name tags and quest marks.
  - The 30 rigged NPCs (`ANIMATED_NPC_IDS`, own 4 × 6 sheets) wander near their spot (`npc-wander.ts`) and freeze when the hero is near or coming to them; picking uses `markerPoint` (their current spot).
  - It pauses while any `[role="dialog"]`, `[role="alertdialog"]` or `[data-world-busy]` exists (`worldInputBlocked`).
  - It publishes `data-*` attributes (`data-ready`, `data-player-x/y/frame/motion/facing`, `data-nearby-marker`, `data-guide-marker`, `data-visible-props`…) for tests.
- **Battle runtime.** `grid-battle-runtime.ts` draws the board in 2.5D and plays `state.events`: walk 180 ms per tile, casts with VFX and SFX, damage numbers. It calls `battleStore.step()` about 350 ms after playback idles. Skill VFX come from `cast-vfx.ts` (pure) and `battle-vfx.ts`; skill sounds from `lib/audio/cast-sfx.ts`, using the same profile.
- **Collision.** `world-navigation.ts` (+ `world-footprints-data.ts`) covers all 101 painted maps; `test:navigation` probes every map.
- **Rules.** Never put Phaser objects in stores or saves. Don't enable Phaser input. Respect `prefers-reduced-motion`. New popups are `Modal`s, so the map pauses by itself.

## UI and theme

- **Root.** `components/world/world-screen.tsx` picks a view: start → game over → battle → encounter → mapped location (+ dialog over the same canvas) → dialog over a painting → road map → the classic card layout (only `world_journey` and 16 unpainted roads).
- **HUD** (mobile first):
  - the icon grid at the top left: 1 โปรไฟล์ 2 ย่าม 3 วิชา 4 อาชีพ 5 ภารกิจ 6 สำนัก 7 บันทึก, then ♪ and install;
  - purse, sundial and day at the top right, with the quest tracker below;
  - law chips at the top centre;
  - พัก and the action button at the bottom right;
  - the จุดหมาย list of markers in tabs.
- **Look.** It comes from `app/game-hud.css`, `app/mobile-hud.css`, `app/game-menu.css` and `app/dq-theme.css` (parchment menus), loaded after `app/globals.css`. The cream / ink / vermilion root tokens show only in fallback layouts, toasts and `/debug`.
- **Fonts.** Charm (`--font-display`) for headings of 16 px or more; Sarabun (`--font-body`) for everything else — Thai tone marks blur in Charm below 16 px.

## Conventions

- **Field names.** Combat tables in `lib/game/data/` keep **short field names** (`n`, `sc`, `ti`, `w`, `mg`, `st`, `at`, `bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `types`), matching `demo.html`. World tables use readable names (`name`, `description`, `price`).
- **Ids** are lowercase snake case with conventional prefixes:
  - places: `city_`, `village_`, `sect_`, `cave_`, `inn_`…;
  - quests: `qc_`, `qv_`, `qw_`, `qe_`, `qst_`;
  - opponents: `spar_`, `hunt_`, `hunter_`, `law_`, `elite_`;
  - manuals: `man_`.

  **A location's prefix decides** its categories (practice, bonus), encounter zone, rest options and auto-map spots.
- **Per-sect content** lives in `lib/world/data/{npcs,quests,scenes-content}/sects/<file>.ts`, one import + one spread per barrel (`sects-temples.ts`).
  - Files are mostly named by the **location** suffix.
  - Sun-Moon (`SectId` `sunmoon`, grounds `sect_ming`) is split: its NPCs are in `ming.ts`, while quests and scenes are in both `ming.ts` and `sunmoon.ts`.
  - Jinyiwei's scenes live in `scenes-content/spies.ts`.
- **Skill sort order.** Skills and arts are sorted by sect, then tier — run `bun scripts/sort-by-sect.ts`. Move-skill stat sums per tier are exactly 10 / 15 / 20 / 25 / 30.
- **Player feedback.** Use `toast(kind, message)` in the UI and `appendActionLog(draft, kind, message)` in store actions. Add a label for a new log kind in `components/world/popups/action-log-popup.tsx`.

## Adding content

Most additions are data only. Follow [docs/content-authoring.md](docs/content-authoring.md):

| Adding | Where |
| --- | --- |
| a place | a `leaf()` in `world-map.ts` + a road in `location-routes.ts` + a region in `regions.ts` (+ a painting) |
| an NPC | a regional `npcs/` file (+ talk dialog, spar opponent, art ids) |
| a quest | a regional `quests/` file (+ `qs_` scenes); stages need an `autoAdvance`, an `objective` or reachable dialog beats |
| an item, shop, hall, recipe, artisan, node or opponent | its table in `lib/world/data/` |
| a skill or art | `lib/game/data/`; then sort, icon, battle range, and a way to learn it |
| a joinable sect | the long checklist in the guide |

New engine variants (effects, conditions, combat effects) are code changes. Update every dispatcher; for combat, see [docs/combat.md](docs/combat.md#changing-combat-safely).

Content changes need **no save version bump**. Removed ids are dropped on load.

## Saves

- **Keys.** The world save is `localStorage["wusia-world-v1"]`, **version 21**. The "wusia" spelling is historical — never rename it.
- **Migration.** `migrate` is one idempotent normalizer (it ignores `fromVersion`). The persist `merge` also back-fills lore rumors on every load, and `onRehydrateStorage` runs `validateAndRepair`.
- **Adding a persisted field:**
  1. `WorldStateData` + `emptyData()`;
  2. `partialize`;
  3. a default in `migrate`;
  4. bump `version`;
  5. repair in `validate.ts` if it holds ids;
  6. update [docs/save-format.md](docs/save-format.md) and the e2e test that expects the version (`tests/browser/game.spec.ts`).
- **Not saved:** the battle store (a reload restarts the fight from the saved HP / MP), map positions, and anything Phaser.

## Gotchas

- **Store warnings.** `test:law`, `test:grid`, `test:grid-ai` and `test:quests` print harmless `[zustand persist middleware] Unable to update item` warnings.
- **Quests are one-shot.** `abandonQuest` fails a quest for good (it can't be re-accepted). Leaving a sect blocks rejoining it.
- **`_setFlag` looks dev-only but isn't.** The quest-log pin (`trackedQuestId`) and the rumor banner use it.
- **Two rumors never fire.** `sect_join` and `quest_major_complete` player echoes can't happen in play — joins come from quest rewards, and no quest sets `isMajor`.
- **Advisory audits fail by design.** `audit-quest-counts.ts`, `audit-complete-scenes.ts` and `audit-quest-flow.ts` report known false positives.
- **`sharp`** is used by the image scripts but comes in through Next; it is not in `package.json`.
- **More.** [HANDOFF.md](HANDOFF.md#known-issues) lists every known issue.
