# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the short version: the rules, commands and facts you need every session. The detail lives in `docs/` — start at [docs/README.md](docs/README.md).

## Project

**กำลังภายใน — ยุทธภพ** is a Thai-language wuxia RPG in the browser.

- **Stack:** Next.js 15 + React 19 + TypeScript, Phaser 4 for the map and the battle board, Zustand for state (six stores), Tailwind + hand-written CSS.
- **Look:** a Dragon Quest XI–style lacquer HUD with parchment menus and full-screen dialogue.
- **Runtime:** Bun (Node 20+ also works).
- **Language:** everything the player reads is Thai; code, ids and comments are English.

**What the player does:**

- Explores 101 places (100 painted maps) joined by 129 roads.
- Meets 225 NPCs and takes 867 quests: 373 hand-written, 154 sect lineage quests and 38 story sagas (340 chapters) with 292 cutscenes.
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
| Objects placed on maps; the map editor (`/game/engine`, แผนที่) | [docs/rendering.md](docs/rendering.md#placed-objects) · [docs/engine.md](docs/engine.md#แผนที่--map-editor) |
| The PixelLab asset library (public/assets/, manifest, pipeline) | [docs/assets.md](docs/assets.md) |
| Music and sound · install and offline | [docs/audio.md](docs/audio.md) · [docs/pwa.md](docs/pwa.md) |
| The editor at `/game/engine`: asset library, maps, skill / art texts | [docs/engine.md](docs/engine.md) |
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
bun run lint                # next lint — 0 errors, 3 known warnings
bun run test:runtime        # the unit suites, one per line:
bun run test:combat
bun run test:opening
bun run test:navigation
bun run test:placements     # placed-object geometry, depth and collision; public/assets/placements.json covers no marker
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
bun run test:story          # every sect skill/art has a quest; lineage + sagas + cutscenes well formed; all play through
bun run test:routes         # compass exits, 8-way road paintings and arrival sides; world coords current
bun run test:places         # place NPCs / quests / activities; every ยุทธจักร T0–T3 move is a quest reward; gifts; presence
bun run test:systems        # practice xp, letters, horse stations, the sword tournament
bun run test:quests         # campaign audit + dead ends + every item/kill/objective quest + guidance + bad-action stages
bun run test:engine         # text overrides over SKILLS / ARTS, the engine's filters / edits / validation, the save route whitelist
bun run test:docs           # generated reference is current + docs links/paths/commands resolve
bun run test:assets         # asset library: manifest contract, files and sizes, footprints, ≥ 3,000 approved
bun run test:e2e            # Playwright (Chromium) on :3017 — start a production server first
bun scripts/audit-content.ts            # every NPC / quest / scene reference resolves
bun scripts/build-docs-reference.ts     # regenerate docs/reference/ after data changes
bun scripts/sort-by-sect.ts             # re-sort skills.ts + arts.ts by sect, then tier (idempotent)
bun scripts/normalize-t3-stats.ts       # rewrite move-skill stat sums to 10/15/20/25/30 (review the diff)
bun scripts/map-collision-tool.ts <id> [json] [png]   # check / draw a painted map's collision
bun scripts/build-npc-sprites.ts        # NPC pixel sprites from public/npcs/body/
bun scripts/import-npc-art.ts --from <dir>   # cut out painted NPC bodies + portraits into public/npcs/, register ids
bun scripts/build-npc-sheets.ts         # rigged animation sheets for the 65 NPCs in lib/characters/npc-sheets.ts + the 8 heroes, 7 archetypes and 22 enemy types
bun scripts/build-creature-atlas.ts --from <dir>   # the 12 painted beasts (b0…b11.png) → public/art/creature-atlas.png
bun scripts/build-hero-walk8.ts --from <dir>   # the heroes' painted 8-direction walk sheets (<id>-walk8.png)
bun scripts/build-hero-actions.ts --from <dir>   # m1 / f1 painted weapon forms + combat poses (<id>-combat.png) and f1's work loops (<id>-work.png)
bun scripts/build-hero-work-loops.ts --from <dir>   # m1's PixelLab-animated work loops (m1-work.png, 8 frames × 14)
bun scripts/smoke-liveness.ts           # 90-day NPC simulation smoke test
bun scripts/build-world-coords.ts       # each place's world-map spot (exit / road directions); rerun after adding a place or road
bun scripts/build-route-variants.ts --from <dir>   # import the 56 directional road paintings (<type>-<dir8>.png)
bun scripts/assets/build-asset-plan.ts && python3 scripts/assets/generate.py run <raw> scripts/assets/plan/*.json && bun scripts/assets/import.ts --raw <raw>   # the PixelLab asset library (docs/assets.md; PIXELLAB_API_TOKEN from the env)
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
store/                    Zustand: world (saved, v23), battle, character (/debug, v3), loading, toast, confirm
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

- `lib/world/battle-bridge.ts` briefs a `pendingBattle` and starts the battle store when the player goes in.
- `lib/stage/grid-battle-runtime.ts` reads the battle store each frame and calls `step()` for AI turns.

`initBattleBridge` is not in the `lib/world` barrel; import it from `@/lib/world/battle-bridge`. `app/page.tsx` calls it once.

**Routes:**

| Route | What |
| --- | --- |
| `/` | the game |
| `/debug` | combat sandbox with two builds from `character-store` and a free grid battle; independent of the world save |
| `/progress` | old journal, data frozen at wave 11 |
| `/game/engine` | the game's editor (asset library, maps, skill / art texts); not linked, `noindex`; writes files only under `bun dev` ([docs/engine.md](docs/engine.md)) |
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
- **`SceneEffect`** (26 kinds) and **`Condition`** (26 kinds) live in `types.ts`, dispatched by `effects.ts` / `conditions.ts`.
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
- **Encounters come while walking**, not on arrival.
  - Every 220 map units walked, `walkTick(pickSpot)` runs; `home_player` and `jail` are safe. There are no treasure or meeting events.
  - **Roaming foes:** per tick a 30 % chance (80 % while hunting a kill-quest target in this zone) puts a foe from the zone's pool on the map (`rollFoeSpawn`, at most 3; store `roamingFoes`, not saved). The runtime draws them (`presentation.foes`) and walking into one calls `engageFoe` → the encounter screen.
  - The **law** (`lawChance(marks)`, 13–45 %) and the **30 % sect-hunter roll** still catch up at once (`rollWalkEvent`).
  - Foes are picked by zone and scaled by the hero's power (`max(day/200, (9 − best sect rank)/8)`): tier mix, elites, and opponent stats ×(1 + 0.6·power) for **every** battle.
  - `rollRandomEvent` is a no-op kept for old content.
- **Law** (`law.ts`).
  - Wanted marks (max 5) come from failed steals (+1) and jail escapes (+2); one fades every 10 quiet days.
  - Law fights are non-fatal. A loss goes to `jail_cell`: arrest (the `jail` map, `jailUntil`, 2 days per mark) or a 300-gold bribe.
- **Bad actions** (`bad-actions.ts`). Steal, assassinate and kidnap use base stats. A failed steal is a non-fatal fight plus a mark; failed assassinations and kidnappings are fatal.
- **Sects** (`data/sect-memberships.ts`, 15 joinable).
  - Ladders: 9 → 1 (eight sects), 5 → 1 (six) or 3 → 1 (Gumu).
  - Ranks grant no martial arts: a rank-up pays gold (`rankUpGold`, half its point cost) and opens lineage quests and sagas, the **only** way to any sect skill or art (`test:story` enforces it; no rank pool, manual, hall, dialog or other quest may teach one). The one exception is the sword tournament champion's prize pick (below).
  - Sect quests are repeatable after a 30-day cooldown.
  - Membership status is `active | resigned | betrayed`. Only `active` counts for `sectMember` / `anySectMember`.
  - Joins go through each intro quest's `joinSect` **reward**, which does not check `joinRequirements`; the intro's `prereqs` are the real gate.
  - Betrayal brings `hunter_<sectId>`; `qst_<sectId>_redemption` (14 sects; not xiaoyao) turns betrayed into resigned.
- **Liveness** (`npc-tick.ts`, `rumor-engine.ts`). Every `advanceTime` call:
  - runs the weekly tick of 20 named NPCs (up to 4 batches; leftover days are dropped);
  - fails active quests whose giver just died;
  - maintains rumors (caps 200 / 500, archive after 365 days).

  Rumors stay in their region and fade: news 20 days (big 40), 15 days once heard (`fadeHeardRumor`), flavour lore by day 60. See [docs/liveness.md](docs/liveness.md).
- **Lineage quests and sagas** (`lib/world/story/`, content in `lib/world/data/story/`). Compact specs compile into quests, dialogs and cutscenes ([docs/story-quests.md](docs/story-quests.md)).
  - Every sect T0–T3 skill / art has one lineage quest `ql_<skill|art>_<id>` (type `side`, `lineage`), gated and sized by tier (`LINEAGE_TIERS`).
  - Every sect T4 is the reward of a saga: 8–10 chapters `st_<arcId>_<nn>` (type `story`), chained on the previous chapter, with films (`DialogScene.cutscene`) and paged dialogs (`paged`).
  - The old sect art quests teach nothing: seven T4 ones are saga prologue trials (`SAGA_PROLOGUES`), eight T3 ones lineage prologue trials (`LINEAGE_PROLOGUES`).
  - Story and lineage quests don't fail when their giver dies. Their offers (and the sect art trials') can be turned down (`DECLINE_TEXT`; the NPC card opens a compiled offer **before** accepting), and dropping one (`abandonQuest`) forgets it instead of failing it, so it is offered again.
  - **Moves arrive as scrolls.** A `learnSkill` / `learnArt` quest reward gives the move's คัมภีร์ (`scroll_skill_<id>` / `scroll_art_<id>`, generated in `items.ts`); reading it teaches the move. Quests show the reward as 📜 วิชาลึกลับ (`MYSTERY_MOVE_LABEL`) and lineage quests are named after their teacher.
  - **T4 stays secret in the sect window**: saga moves are off its list and the seven T4 saga trials are offered only by their giver (`isSecretSectQuest`).
- **Living places** (`data/places/<group>.ts`, one `PlaceContent` each, merged into every registry). Villages, towns and homes have people, quests and activities; every ยุทธจักร T0–T3 move and art is a quest reward, gated by rarity (`test:places`).
  - **Place activities** are `ActivityDef`s with `place` (locations, cooldown in days, cost, rewards), run by `doActivity`; auto maps place their spots (`ACTIVITY_SLOTS`), hand maps need `place.spot`.
  - **NPC looks:** all 68 place NPCs have their own painted portrait and body (`import-npc-art.ts`). Strollers (`look.wander`) are rigged (`ANIMATED_NPC_IDS`); the rest stand as a unique pixel sprite. `look.body` (`registerNpcBodies`) is only the fallback sheet for art-less NPCs.
- **Letters, stations, tournament.**
  - **Letters** (`letters.ts`): each new day an NPC with relationship ≥ 20 may write (one letter a day, 15 days per NPC; odds from relationship, fame, LUK; gift rarity from LUK). Inbox `state.letters`; `openLetter` takes the gift; `deleteLetters` throws letters away (taking an unclaimed gift first).
  - **Horse stations** (`stations.ts`): cities, villages and joinable sects' grounds; ride to a visited station place for gold + time by world-map distance (`stationTravel`).
  - **Sword tournament** (`tournament.ts`): a 360-day year; register at the capital (days 60–89, 100 gold), fight on day 90–92. 32 entrants (hero + the liveness roster + sparring fighters); the hero's bouts are real non-fatal battles (`pendingBattle.tournament`), the rest simulated by power. Bout and place rewards; the champion (hero or NPC) picks one entrant's move or art.
  - **Practice xp** is 30 + 5 % of the xp to the next level, 50 + 6 % at a fitting place (`practiceXpGain`).
- **Presence** (`npc-presence.ts`). An assassinated NPC is gone for good; a kidnapped one is away until `kidnappedUntil` (day + 180) and then stands at their spot again. Maps and the location card filter with `npcPresent`.
- **Gifts** (`gifts.ts`, store `giveGift`). One gift per NPC every 30 days (`giftDays`), an item or 100 / 500 / 1000 / 5000 gold. Worth 1–5 by price; liked ×2 (+2 for a favourite item id), disliked −2. Tastes are `NpcDef.likes` / `dislikes` (item ids, categories, `"gold"`) or follow the NPC's tags.
- **Repair** (`validate.ts`). `validateAndRepair` runs on every load and drops dangling ids.

## Stores (`store/`)

- **`world-store.ts`** is saved as `wusia-world-v1`, **version 23**.
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

1. `pendingBattle` shows `BattleBriefingScreen` first: the foe, its pack and both sides' **power tiers** (`battleBriefing`; random encounters show it on the encounter screen). Going in calls `ensureBattleStarted()`: scale the foe, run `worldBattleSetup` (looks and pack, built once per `pendingBattle`), then `battleStore.start` with the hero's HP / MP.
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
  - Camera: cover fit zoomed in √5 (`MAP_ZOOM`, a fifth of the map in view), following the hero; WASD, tap-to-walk and a joystick.
  - The action target is the nearest marker within 95 units; E reaches 100.
  - Walk ticks every 220 units; a guide arrow (its edge pointer slides clear of every `[data-hud-occluder]` HUD box — tag new HUD boxes); name tags and quest marks.
  - The hero walks with painted eight-direction sprites (`<id>-walk8.png`, `lib/characters/walk8.ts`) and always faces the way they move.
  - Only m1 (male) and f1 (female) are heroes (`PLAYER_BODIES`; older saves fall back by gender, `heroBodyFor`). They have painted action sheets (`lib/characters/hero-actions.ts`): a weapon-family form per cast plus hurt / guard / victory / defeat in battle (`<id>-combat.png`), and a work loop per activity (`<id>-work.png`, grid per hero in `HERO_WORK_LAYOUT`; m1's are 8-frame PixelLab animations) that plays in the work overlay and on the hero on the map while they work (`flashLoading(…, pose)` → `WorldPresentation.heroAction`); unpainted loops are listed in `HERO_WORK_GAPS`.
  - Foes without NPC art are one of 22 painted, rigged enemy types (`FOE_CHARACTER_IDS`, picked by `foeCharacterFor` in `lib/world/battle-looks.ts`); beasts are 12 painted cells of the 4 × 3 creature atlas (`CREATURE_ATLAS`).
  - The 65 rigged NPCs (`ANIMATED_NPC_IDS`, own 4 × 6 sheets) wander near their spot (`npc-wander.ts`) and freeze when the hero is near or coming to them; picking uses `markerPoint` (their current spot).
  - It pauses while any `[role="dialog"]`, `[role="alertdialog"]` or `[data-world-busy]` exists (`worldInputBlocked`).
  - It publishes `data-*` attributes (`data-ready`, `data-player-x/y/frame/motion/facing`, `data-nearby-marker`, `data-guide-marker`, `data-visible-props`…) for tests.
- **Battle runtime.** `grid-battle-runtime.ts` draws the board in 2.5D and plays `state.events`: walk 180 ms per tile, casts with VFX and SFX, damage numbers. It calls `battleStore.step()` about 350 ms after playback idles. Skill VFX come from `cast-vfx.ts` (pure) and `battle-vfx.ts`; skill sounds from `lib/audio/cast-sfx.ts`, using the same profile.
- **Directions.** Travel follows the world-map compass (`lib/world/compass.ts`, `data/world-coords.ts`). Exits sit on the map edge facing their destination (`assignSlotsByBearing`); a road runs the way its exit faces (`routeDirection`, 8 ways, painting `/maps/routes/<type>-<dir>.webp`, region graded at load by `lib/stage/route-grade.ts`); arriving puts the hero beside the exit back (`setArrivalFrom` hints in `lib/stage/types.ts`).
- **Collision.** `world-navigation.ts` (+ `world-footprints-data.ts`) covers all 100 painted maps; `test:navigation` probes every map.
- **Placed objects.** The map editor's objects (`public/assets/placements.json`, fetched once, the manifest only for a map that has some) draw through `lib/assets/placement-geometry.ts` — the one geometry the editor shares: anchor at (x, y), `mapWidth × mapHeight × scale`, flip about the anchor, footprint relative to the anchor; "ground" under characters, "object" by base y (`100 + y·10`, hero `101 + y·10`), "overhead" at 7000+ under signs and the veil. Blocking footprints join the map's solids (`withPlacedSolids`); `placementIssues` (`lib/stage/map-anchors.ts`) and `test:placements` keep every marker reachable. Host: `data-placements`, `data-placement-ids`. Dev hook: `/?engineGoto=<id>` (`bun dev` or `localStorage["wuxia-engine-goto"]="on"`).
- **Rules.** Never put Phaser objects in stores or saves. Don't enable Phaser input. Respect `prefers-reduced-motion`. New popups are `Modal`s, so the map pauses by itself.

## UI and theme

- **Root.** `components/world/world-screen.tsx` picks a view: start → game over → battle → encounter → mapped location (+ dialog over the same canvas) → dialog over a painting → road map → the classic card layout (only `world_journey` and 14 unpainted roads).
- **HUD** (mobile first):
  - top left, stacked: the vitals card (HP / MP / พลัง gauges, no portrait; `hud-vitals.tsx`) over the icon grid: 1 โปรไฟล์ 2 ย่าม 3 วิชา 4 อาชีพ 5 ภารกิจ 6 สำนัก 7 บันทึก 8 จดหมาย (unread badge), then ♪ and install;
  - purse, sundial and day at the top right, with the quest tracker below;
  - law chips at the top centre;
  - พัก and the action button at the bottom right;
  - the จุดหมาย list of markers in tabs.
- **Landscape only.** A portrait viewport turns the whole `body` 90° (`app/globals.css`). So:
  - never use raw `vw` / `vh` — use `calc(N * var(--vh))` (`--vw`, `--vh`, `--dvw`, `--dvh` swap in portrait);
  - write media queries for both orientations (`(orientation: landscape) and (max-height: 500px), (orientation: portrait) and (max-width: 500px)`); Tailwind breakpoints are already raw queries of that shape;
  - map pointer client coordinates through `lib/ui/landscape.ts` (`toPagePoint`, `toClientPoint`, `pageRect`).
- **Menus don't scroll.** A menu section is `<Modal fill>` with `.menu-cols > .menu-col` columns and `.menu-tabs` (`app/menu-layout.css`); long collections page with `PagedGrid` (`components/ui/paged-grid.tsx`, `useShortScreen` for phone cell sizes). Done for โปรไฟล์ (ฉายา: `lib/world/epithet.ts`), ย่าม (paper doll + item window), วิชา, อาชีพ, จดหมาย; ภารกิจ / สำนัก / บันทึก still scroll.
- **Look.** It comes from `app/game-hud.css`, `app/mobile-hud.css`, `app/game-menu.css`, `app/dq-theme.css` (parchment menus), `app/profile.css` and `app/menu-layout.css`, loaded after `app/globals.css`. The cream / ink / vermilion root tokens show only in fallback layouts, toasts and `/debug`.
- **Fonts.** Charm (`--font-display`) for headings of 16 px or more; Sarabun (`--font-body`) for everything else — Thai tone marks blur in Charm below 16 px.

## Conventions

- **Skill / art text overrides.** `SKILLS` and `ARTS` are wrapped in `withTextOverrides` (`data/text-overrides.ts`), which lays `data/text-overrides.json` (written by `/game/engine`) over names and descriptions at load. Edit the literal rows as before; an override wins over them.
- **Field names.** Combat tables in `lib/game/data/` keep **short field names** (`n`, `sc`, `ti`, `w`, `mg`, `st`, `at`, `bp`, `p`, `f`, `dm`, `dr`, `se`, `ee`, `types`), matching `demo.html`. World tables use readable names (`name`, `description`, `price`).
- **Ids** are lowercase snake case with conventional prefixes:
  - places: `city_`, `village_`, `sect_`, `cave_`, `inn_`…;
  - quests: `qc_`, `qv_`, `qw_`, `qe_`, `qst_`; compiled `ql_` (lineage) and `st_` (saga chapters);
  - opponents: `spar_`, `hunt_`, `hunter_`, `law_`, `elite_`, `st_` (saga foes);
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
| a skill or art | `lib/game/data/`; then sort, icon, battle range, and a way to learn it (a sect one also needs a lineage quest or saga — `test:story`) |
| a joinable sect | the long checklist in the guide |

New engine variants (effects, conditions, combat effects) are code changes. Update every dispatcher; for combat, see [docs/combat.md](docs/combat.md#changing-combat-safely).

Content changes need **no save version bump**. Removed ids are dropped on load.

## Saves

- **Keys.** The world save is `localStorage["wusia-world-v1"]`, **version 23**. The "wusia" spelling is historical — never rename it.
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
- **Quests are one-shot.** `abandonQuest` fails a quest for good (it can't be re-accepted) — except lineage quests, saga chapters and sect art trials, which it forgets so they come back. Leaving a sect blocks rejoining it.
- **`_setFlag` looks dev-only but isn't.** The quest-log pin (`trackedQuestId`) and the rumor banner use it.
- **Two rumors never fire.** `sect_join` and `quest_major_complete` player echoes can't happen in play — joins come from quest rewards, and no quest sets `isMajor`.
- **Advisory audits fail by design.** `audit-quest-counts.ts`, `audit-complete-scenes.ts` and `audit-quest-flow.ts` report known false positives.
- **`sharp`** is used by the image scripts but comes in through Next; it is not in `package.json`.
- **More.** [HANDOFF.md](HANDOFF.md#known-issues) lists every known issue.
