# World engine

The story side of the game: scenes, the conditions and effects that drive them, quests (with objectives and tracking), random encounters while walking, the law and the jail, and bad actions. It lives in `lib/world/` as pure TypeScript — no React, no I/O — and `store/world-store.ts` wraps it (see [architecture.md](architecture.md)).

The NPC simulation and rumors are in [liveness.md](liveness.md). The content tables (locations, NPCs, quests, items…) are in [content-authoring.md](content-authoring.md) and the generated [reference](reference/README.md). What each action costs the player is in [gameplay.md](gameplay.md).

## Contents

- [Files](#files)
- [Scenes](#scenes)
- [Scene effects](#scene-effects)
- [Conditions](#conditions)
- [Quests](#quests)
- [Quest objectives](#quest-objectives)
- [Quest guide and tracking](#quest-guide-and-tracking)
- [Random encounters](#random-encounters)
- [Law and jail](#law-and-jail)
- [Bad actions](#bad-actions)
- [Location categories and practice](#location-categories-and-practice)
- [Stat progression](#stat-progression)
- [Opening helpers](#opening-helpers)
- [Adding a scene effect or condition](#adding-a-scene-effect-or-condition)
- [Known gaps](#known-gaps)

## Files

| File | Role |
| --- | --- |
| `lib/world/types.ts` | Every world type: scenes, `SceneEffect`, `Condition`, quests, items, life skills, NPCs, opponents, `WorldStateData`, Liveness types, sect membership, `SectId` |
| `lib/world/effects.ts` | `applyEffect` / `applyEffects`, quest progress and rewards, `rollWalkEvent` (law, hunters), `rollFoeSpawn`, `releaseFromJail`, `describeQuestCondition`, offer / turn-in checks |
| `lib/world/conditions.ts` | `evaluateCondition`, `getQuestStatus` |
| `lib/world/quest-objectives.ts` | hands-on objective spots |
| `lib/world/quest-guide.ts` | what to do next for a quest, where, and which way to walk; tracking |
| `lib/world/law.ts` | wanted marks, law pursuers, jail sentences |
| `lib/world/bad-actions.ts` | steal / assassinate / kidnap odds |
| `lib/world/location-categories.ts` | location tags, practice eligibility and bonus |
| `lib/world/stat-progression.ts` | stat xp constants and curves |
| `lib/world/capital-training.ts`, `clinic-preparation.ts` | opening helpers |
| `lib/world/npc-tick.ts`, `rumor-engine.ts` | the Liveness Layer ([liveness.md](liveness.md)) |
| `lib/world/validate.ts` | repair on load ([save-format.md](save-format.md#repair-on-load)) |
| `lib/world/battle-bridge.ts`, `battle-looks.ts` | the battle seam ([grid-combat.md](grid-combat.md#world--battle)) |
| `lib/world/data/` | content tables, plus `random-events.ts`, `activities.ts`, `regions.ts`, `named-npcs.ts`, `rumor-templates.ts`, `lore-rumors.ts` |
| `lib/world/index.ts` | public barrel |

Not in the barrel (import by path): `rollWalkEvent`, `rollFoeSpawn`, `releaseFromJail`, `consumeQuestAutoItems`, and everything in `law.ts`, `bad-actions.ts`, `npc-tick.ts`, `rumor-engine.ts`, `stat-progression.ts`, `capital-training.ts`, `clinic-preparation.ts`, `data/activities.ts`, `data/regions.ts`. `initBattleBridge` is deliberately excluded (it imports the stores; import it from `@/lib/world/battle-bridge`).

## Scenes

`Scene = DialogScene | LocationScene | RouteScene`, discriminated on **`kind`** (effects, conditions and rewards use `t`).

| Kind | Fields | Is |
| --- | --- | --- |
| `dialog` | `lines` (narration / dialogue), `choices?`, `next?`, `onEnter?` | a conversation or a story beat |
| `location` | `name`, `description`, `npcs` (inline `NpcRef`s), `routes` (`RouteRef`s), `resources?`, `categories?`, `onEnter?` | a place the hero stands in |
| `route` | `label`, `description?`, `destinations`, `resources?`, `back?`, `onEnter?` | the road between places |

- `Choice = { text, visibleIf?, effects?, next }` — `next` is required. `NpcRef`, `RouteRef`, `RouteDestination`, `ResourceNodeRef` and `NpcDef` all accept `visibleIf`.
- The game starts at `START_SCENE_ID = "home_player"`.

### How the store moves between scenes

`store/world-store.ts`:

- **`followAutoAdvance`** runs after every scene change (up to 32 hops). On a location it records the visit (`visitedLocationIds`), sets `lastLocationId`, ticks quest progress and stops. It stops at a route, at a dialog with choices, or at a terminal dialog. **A dialog with `next` and no choices jumps straight to `next` without showing its lines** — for "narration, then continue", give the dialog one choice (`{ text: "ก้าวต่อไป", next: "…" }`).
- **Terminal dialogs** (no choices, no `next`) show a "ปิด" button that returns to `lastLocationId` for free (`exitToLocation`).
- If every choice is hidden by `visibleIf`, the UI shows "(ไม่มีตัวเลือก — สถานการณ์อาจเปลี่ยนไป)" with an escape button. Choice buttons are numbered in visible order but call the original index.
- **`takeChoice`**: refuses the whole choice (effects included) if its travel is unaffordable; applies the effects; if a battle was set, stops there (the battle's `onWin` / `onLose` take over); otherwise charges travel, moves, applies the target's `onEnter`, and auto-advances.
- **Travel** is charged only for location → route (10 stamina, 1 ชั่วยาม) and route → location (10 stamina, 2 ชั่วยาม). Every other transition is a free "story warp". Each charged step also gives +10 AGI xp and a LUK roll.
- The `goto` effect only sets `currentSceneId`; it does not run the target's `onEnter`.

## Scene effects

`applyEffect(state, effect)` mutates the state; `applyEffects(state, list)` applies them in order, then ticks quest progress once. The dispatcher is a plain `switch` with **no exhaustiveness guard** — a new variant without a case compiles and silently does nothing.

| `t` | Fields | Does | Used in content |
| --- | --- | --- | --- |
| `setFlag` | flag, value | `flags[flag] = value` | 22 |
| `giveItem` / `takeItem` | itemId, count = 1 | add / remove (clamped at 0) | 27 / 54 |
| `addGold` | amount | gold, floored at 0 | 11 |
| `startQuest` | questId | start (idempotent) and snapshot kill counts | 162 |
| `advanceQuest` | questId | next stage; past the last stage → done with rewards | 36 |
| `finishQuest` | questId, success | done with rewards, or failed; idempotent | 185 |
| `triggerBattle` | opponentId, onWin, onLose, nonFatal? | set `pendingBattle` (always 1 v 1) | 15 |
| `goto` / `gotoRandom` | sceneId / sceneIds | jump (random pick for the list) | 9 / 1 |
| `addTrait` | trait, amount | floored at 0 | several |
| `addNpcRelationship` | npcId, amount | unclamped | 11 |
| `learnSkill` / `learnArt` | skillId / artId, level? | learn and auto-slot into the first empty slot | several |
| `joinSect` | sectId | seed a membership at the start rank (no skills: the sect's lineage quests teach them); no-op if any membership (even resigned / betrayed) exists | 15 |
| `resignSect` / `leaveSect` | sectId | status `resigned` (`leaveSect` is the legacy name) | 14 / 1 |
| `betraySect` | sectId | status `betrayed` | 0 (store action only) |
| `addSectPoints` | sectId, amount | floored at 0 | via quest rewards |
| `imprison` / `bribeJail` / `serveJail` | — | see [Law and jail](#law-and-jail) (`serveJail` is used only by tests) | 1 / 2 / 0 |
| `firePlayerEcho` / `markRumorHeard` / `revealNpcStatus` | … | Liveness hooks ([liveness.md](liveness.md)); `revealNpcStatus` is a no-op | 0 |
| `rollRandomEvent` | — | **no-op**, kept so old content still parses | 0 |

## Conditions

`evaluateCondition(state, c)` returns a boolean; its switch has no default, so a missing case is a TypeScript error.

| `t` | True when |
| --- | --- |
| `flag` | the flag is truthy, or equals `equals` |
| `hasItem` | inventory ≥ count |
| `questStatus` | `none` / `active` / `done` / `failed` matches |
| `trait` | within `min` / `max` (inclusive) |
| `npcRelationship` | within `min` / `max` (default 0) |
| `defeatedOpponent` | total `defeatedCounts` ≥ count (quest stages count since accepting — see below) |
| `visitedLocation` | in `visitedLocationIds` |
| `stoleFromNpc` / `assassinatedNpc` / `kidnappedNpc` | the bad-action ledgers |
| `gender` | the hero's gender |
| `sectMember` / `anySectMember` | an **active** membership (resigned and betrayed don't count) |
| `sectStatus` | a membership has that status |
| `sectRankAtLeast` | rank ≤ `maxRank` (lower is more senior) |
| `goldAtLeast` | gold ≥ amount |
| `learnedArt` / `learnedSkill` | in `learnedArtIds` / `learnedSkillIds` |
| `statAtLeast` | the hero's gearless stat (`gearlessStat`: base + arts + skills, no equipment) ≥ `min` — what manuals check too |
| `lifeSkillLevel` | mastery level ≥ min |
| `heardRumor` / `heardRumorAbout` / `npcStatus` | Liveness state (unused by content today) |
| `and` / `or` / `not` | combinators (`or` is unused by content) |

## Quests

### Definition

- `QuestDef`: `id`, `name`, `description`, `briefSummary?`, `type?` (`"main"` / `"side"` / `"story"`, default main), `giverNpcId?`, `turnInNpcId?` (defaults to the giver), `prereqs?` (a condition), `stages`, `rewards?`, and for sects `sectId?`, `isArtQuest?`, `minSectRank?`; `isMajor?` fires a rumor about the hero on completion. Compiled sect quests also carry `lineage?: { kind, id }` (a lineage quest teaching that skill or art) or `story?: { arcId, chapter }` (a saga chapter) — see [story-quests.md](story-quests.md).
- There is no `repeatable` field: a quest with a `sectId` that isn't an art quest is repeatable, with the sect's `questCooldownDays` (30 for every sect).
- `QuestStage`: `id`, `description`, and at most one of `autoAdvance?` (a condition that advances the stage on its own) or `objective?` (see [Quest objectives](#quest-objectives)). A stage with neither is advanced by a dialog beat (`advanceQuest`) or, on the last stage, by the hand-in.
- `QuestState` (in the save): `{ id, status: "active" | "done" | "failed", stage, acceptedDefeatedAt?, acceptedHasItemAt? }`.
- Quest ids use prefixes by source file: `qc_` (cities), `qv_` (villages), `qw_` (wilderness), `qe_` (evil), `qst_` (sects, temples, spies), and the compiled `ql_` (lineage) and `st_` (saga chapters). Their dialog scenes are `qs_<questId>_offer` and `qs_<questId>_complete`.

### Lifecycle

1. **Offer.**
   - The NPC popup lists quests whose giver or turn-in person is that NPC (`getQuestsForNpc`). `isQuestOfferable` hides every sect quest and every quest that already has an entry (so a done, failed or abandoned quest is never offered again), then checks `prereqs`.
   - Sect quests go through the sect popup: `isSectQuestOfferable(state, def, cooldownDays)` checks, in order, that it is a sect quest, that the hero has a membership (any status), `minSectRank`, art quest not done, not already active, the cooldown since the last completion, then `prereqs`.
2. **Accept.** `startQuest` is idempotent. It walks every stage's `autoAdvance` and snapshots `defeatedCounts` (and the inventory) for the ids it mentions. `acceptSectQuest` deletes the previous entry first, which is what makes sect quests repeatable.
3. **Progress.** `tickQuestProgress` advances every active quest while its current stage's `autoAdvance` holds. It runs after every `applyEffects`, on location entry, after bad actions, and from a store subscription whenever `inventory` or `defeatedCounts` change — so progress never waits for a scene change.
   - **Kills count since accepting** (`current − acceptedDefeatedAt`).
   - **Items count what the hero holds now** (`inventory ≥ count`), so ore gathered before accepting counts. The `acceptedHasItemAt` snapshot is still written but no longer read.
4. **Finish** — three paths, all recording sect completion (`lastQuestDay`, `artQuestsDone`) and the `isMajor` rumor:
   - the last stage's `autoAdvance` holds → done: gathered items are consumed (`consumeQuestAutoItems`), then rewards;
   - `advanceQuest` past the last stage → done with rewards (no item consumption);
   - `finishQuest` → rewards on success, `failed` otherwise.
5. **Hand-in at a person.** `isQuestTurnInForNpc` is true when the quest is active, on its **last** stage, and the NPC is `turnInNpcId ?? giverNpcId`. The popup opens `qs_<id>_complete` if it exists (and closes the quest itself if that scene doesn't), else calls `finishQuestNow` (consume items + finish).
6. **Abandon.** `abandonQuest` marks the quest `failed` with no rewards. It can never be offered or accepted again (sect quests excepted, which the sect popup re-offers after the cooldown). Story and lineage quests refuse (`reason: "keep"`): they are the only way to their skill or art.

`consumeQuestAutoItems` removes `min(count, held)` for every `hasItem` leaf in every stage (including inside `not`). Scene-driven completions use explicit `takeItem` effects instead, so nothing is taken twice.

`describeQuestCondition(state, condition, depth, quest)` turns a condition into progress lines (`{label, current, required, done, negated?}`) for the quest log; kill lines count since accepting when the quest is passed in.

### Rewards

`QuestReward` (applied in order by `applyQuestRewards`): `gold`, `item`, `wExp`, `skillExp` (no immediate level-up), `trait`, `npcRelationship`, `learnSkill`, `learnArt`, `joinSect`, `sectPoints`, `leaveSect`, `resignSect`, `betraySect`. Gold, w-exp and skill xp ignore non-positive amounts; traits, relationships and sect points may be negative (traits and points floor at 0).

### When a quest giver dies

When the NPC simulation kills a named NPC, every active quest whose `giverNpcId` is that NPC fails, with an action-log line and a warning toast "ผู้ให้ภารกิจ … เสียชีวิต — ภารกิจ '…' หยุดลง" (`failQuestsForDeadGivers` in `store/world-store.ts`). 123 quests have one of the 15 simulated sect chiefs as giver. Story and lineage quests are skipped: they outlive their giver. Dead NPCs stay visible and keep offering new quests (see [liveness.md](liveness.md#known-gaps)).

## Quest objectives

`lib/world/quest-objectives.ts`. A stage with `objective = { spots, hours? }` is done in person: the hero goes somewhere and uses a spot. This covers beats that no counter or dialog could drive, such as "observe the city gate at ฉางอัน".

Each spot (`QuestObjectiveSpot`) is one of three kinds:

| Spot | Shows as | Using it |
| --- | --- | --- |
| `{ locationId, label, text? }` | a 🔍 marker on that location's map (id `objective-<questId>-<index>`), placed clear of other markers near the arrival point | takes `hours` ชั่วยาม (default 1), toasts `text`, marks the spot done |
| `+ npcId` | an action under งานภารกิจ in that person's popup (the hero must be at `locationId`) | same |
| `+ sceneId` | a marker that opens that dialog | no time, no flag — the dialog's own choices advance the quest |

- Progress per spot is a flag `qobj:<questId>:<stageId>:<spotIndex>` (the stage **id**, not its index), so it rides the save without a migration.
- When the stage's last spot is done, the quest advances (`advanceQuest`) and progress is re-checked.
- Helpers: `objectiveSpotsFor(state, quest)`, `openObjectiveSpots`, `objectiveSpotsAt(state, locationId)` (map spots only), `objectiveSpotsForNpc`, `objectiveMarkerId`, `objectiveProgress`, `completeObjectiveSpot`. The store action is `doQuestObjective(questId, spotIndex)`.
- Today 35 quests use 44 objective stages with 48 spots (39 on maps, 5 at people, 4 opening scenes).

## Quest guide and tracking

`lib/world/quest-guide.ts` answers "what do I do next for this quest, where, and which way?" for every kind of stage.

`guideForQuest(state, questId)` returns a `QuestGuide`: `kind`, a short `action` ("ซื้อแร่เหล็ก", "พบหมอหลิน"), an optional `progress` counter, the target `locationId` / `locationName`, the `path` there (locations, both ends included), and the `markerId` to point at on arrival. It picks the target in this order:

1. **Open objective spots** — the nearest one (`kind: "objective"`).
2. **The first unmet leaf of the stage's `autoAdvance`**:
   - steal / kidnap / assassinate → that person (`kind: "npc"`);
   - `visitedLocation` → that place (`kind: "place"`);
   - `hasItem` → the nearest shop that sells it (`shop`), else a gathering node that yields it (`gather`, or `hunt` for hunting nodes), else a place whose roaming enemies drop it (`wander`);
   - `defeatedOpponent` → a hunting node with that foe (`hunt`), else a place where it roams (`wander`);
   - if the item or foe has no source, the person named in the stage text.
   "Nearest" = route hops + 2 extra for `wander` sources.
3. **The person named in the stage description** (longest names first), or on the last stage the turn-in person ("ส่งภารกิจที่…").
4. **A place named in the stage description.**
5. **The quest giver** — unless the stage is a trait goal.
6. Otherwise `kind: "none"`: the tracker shows the stage text with no place.

Tracking:

- `trackedQuestId(state)` = `flags.trackedQuestId` while that quest is active, else the newest active quest; the flag value `TRACK_NONE` (`"none"`) turns tracking off. The quest log's 📌 ติดตาม pin and ➤ นำทาง button set the flag.
- `activeGuide(state)` = the guide for the tracked quest. The HUD tracker (`components/world/quest-tracker.tsx`) and the map arrow use it.
- `guideMarkerId(state, guide)` picks the marker to point at: at the target location, the target marker (`npc-<id>`, `objective-…`, `service-<index>` for a shop or node); elsewhere on a location map, the exit toward the next hop (`route_<here>__to__<next>`); on a route map, the destination with the shortest path (`destination-<index>`). The world runtime draws a bobbing jade arrow over it, plus an edge pointer when it is off screen (`data-guide-marker`).
- `pathBetween(from, to)` is a breadth-first search over location → route → location.

Coverage today: 650 of 657 quest stages point to a place (`bun scripts/test-quest-guide.ts`). The rest are the scene-driven tutorial quest and trait goals.

## Random encounters

Nothing rolls on arrival. While the hero walks on a location or route map, the world runtime calls `worldStore.walkTick(pickSpot)` every 220 map units (`WALK_TICK_UNITS`). `pickSpot` is the runtime's `pickFoeSpot`: a free spot 150–320 units from the hero that the hero can reach, away from markers and other foes (map percentages), or null.

`walkTick` does nothing when there is no game, the game is over, a battle or encounter is pending, the scene is `home_player` or `jail` (`SAFE_SCENES`), or `localStorage["wuxia-random-events"] === "off"` (the switch the browser tests use). Otherwise:

1. **`rollWalkEvent(state)`** (`lib/world/effects.ts`): the law, then sect hunters, each setting `pendingEncounter` at once.
   - **The law.** With wanted marks, `lawChance(marks)` spawns a law pursuer; the city whose jail would hold the hero is remembered (`jailCityId`).
   - **Sect hunters.** If any membership is `betrayed`, a 30 % roll spawns that sect's `hunter_<sectId>`.
2. **`rollFoeSpawn(state, present)`**: if fewer than `FOE_SPAWN.maxPerMap` (3) foes wait on this map, a `FOE_SPAWN.chance` (30 %) roll picks a foe from the zone's pool. The store then asks `pickSpot` and adds a `RoamingFoe { id, opponentId, locationId, x, y }` to `roamingFoes`.

| Per walk tick | Chance |
| --- | --- |
| Law pursuer (1–5 marks) | 13 % / 21 % / 29 % / 37 % / 45 % |
| Sect hunter (after a betrayal) | 30 % |
| A foe appears (fewer than 3 about) | 30 % |
| A foe appears while hunting a quest target | 80 % |

**Roaming foes** live only in the store (`roamingFoes`, not saved: a reload clears them). A walk tick on another map drops the old map's foes. The location view passes this map's foes to the runtime as `presentation.foes`; the runtime draws them without a rebuild (a character sheet or a creature-atlas frame, tinted and sized by `opponentLook`, with a red ⚔ tag), and when the hero comes within 30 units of one it calls `engageFoe(id)`. That removes the foe and sets `pendingEncounter`, so the encounter screen offers ⚔ ต่อสู้ (`acceptEncounter` → a battle with the opponent's pack) or 🏃 หนี (`fleeEncounter`: free, except against sect hunters and law pursuers, where it succeeds with `min(90, 30 + (AGI + LUK)/2)` % using base stats — a failure forces the fight).

There are no treasure or meeting events (removed with their scenes).

### Who turns up

`lib/world/data/random-events.ts`:

- **Pool**: 64 fight events (the base roster T0–T4, beasts, gangs, elites and ten named villains at `share` 0.35).
- **Zones** (`zoneOfLocation`): `city_` / `village_` / `inn_` / `home_` → city; `sect_` → sect; `temple_` / `palace_` → temple; `villa_` → mansion; `isle_` → isle; `tribe_` / `market_` / `desert_` → frontier; everything else (mountains, caves, valleys, route maps, the tutorial foothill) → wild.
- **Category weights by zone** (human / beast / supernatural): city 1/0/0 · mansion 1/0/0 · sect 4/0/1 · temple 2/0/1 · wild 1/4/0.5 · isle 2/3/0 · frontier 3/2/0. Cities never spawn beasts.
- **Tier weights follow the hero's power.** `playerPowerIndex(state)` = the larger of `day / 200` and `(9 − rank) / 8` for any sect membership (clamped 0–1). `tierWeightForPower`: T0 `max(0.5, 8 − 7p)`, T1 `max(0.5, 5 − 3p)`, T2 `3 + p`, T3 `1.5 + 4.5p`, T4 `0.5 + 4.5p`, elites `3p` (absent at power 0).
- **Opponent stats scale too.** `applyOpponentStatScale` multiplies every opponent's stats by `1 + 0.6p` (up to ×1.6) before every battle the bridge starts. Joining a sect that starts at rank 5 sets power to 0.5 at once. The capital training apprentice has a hand-written build and is never scaled.
- Named villains the hero has killed, assassinated or kidnapped never turn up again (`encounterFoeAvailable`).

### Hunt boost

When the current stage of an active quest is a top-level `defeatedOpponent` (`collectActiveHuntTargets`) and one of those foes can appear in this zone, a foe appears with 80 % per tick and only the targets appear. It ends by itself when the stage moves on.

## Law and jail

`lib/world/law.ts`, `lib/world/data/activities.ts`, and the jail actions in `store/world-store.ts`.

- **Wanted marks** (หมายจับ, 0–5): +1 for every failed steal, +2 for a successful jail escape. One mark fades every 10 quiet days (`WANTED_DECAY_DAYS`).
- **Pursuers**: `lawChance(m) = min(45 %, 5 % + 8 % × m)` per walk tick. `pickLawPursuer` weights: constable `max(0, 6 − 1.2m)`, imperial guard `m − 1` from 2 marks, bounty hunter `1.5 × (m − 2)` from 3 marks — at 1 mark always a constable, at 5 marks 47 % guard / 53 % bounty hunter. The bounty hunter brings a constable.
- **Law fights** are non-fatal. Winning or escaping clears the pending jail city; losing goes to `jail_cell`.
- **`jail_cell`** offers two choices: accept arrest (`imprison` → the `jail` map), or, with 300 gold, bribe (`bribeJail` → released, 2 marks removed).
- **`imprison`**: sentence = `jailDays(marks) = max(1, min(5, marks)) × 2` days (2 days even with no marks) × 12 ชั่วยาม; marks reset to 0; `jailUntil` = the absolute ชั่วยาม the sentence ends (`day × 12 + time`); HP at least 1.
- **The jail map** has no exits. While `jailUntil` is set, travel to any other place is refused (`jailBlocks`) and walk ticks don't fire there. Any time that passes serves the sentence. Two people live there: ตาเฒ่าหลิว (tips) and ผู้คุมจาง (bribe).
- **Release** (`releaseFromJail`): to the jail city — a `city_*` stays itself, else the nearest city on the world map (`jailCityFor`; unplaced places → นครหลวง). HP and MP are raised to at least 60 %.

Jail activities (`doActivity`, only in `jail`):

| Activity | Time | Stamina | Effect |
| --- | --- | --- | --- |
| ทุบหินใช้แรงงาน (`jail_labor`) | 6 | 25 | sentence −6 extra (−12 in all), STR xp +20, w-exp +5 |
| ทอยเต๋ากับผู้คุม (`jail_dice`) | 2 | 5 | needs 10 gold; win chance `min(60 %, 40 % + LUK/200)`, ±10 gold; LUK xp +10 |
| นั่งสมาธิ (`jail_meditate`) | 6 | 0 | MP full, HP +20 %, stamina +15, w-exp +5 |
| ประตูคุก (`jail_gate`) | 0 | 0 | locked while time remains (the UI offers `serveSentence`: wait it out at once); open afterwards |
| แหกคุกทางกำแพงร้าว (`jail_escape`) | 2 | 30 | success `min(55 %, 20 % + AGI/200)`: free, +2 wanted marks; failure: +1 day |

`serveSentence()` advances time by the remaining sentence (a real `advanceTime`, so the NPC tick and rumor upkeep run) and releases the hero. The `serveJail` effect does the same without `advanceTime`, but no content uses it.

## Bad actions

`lib/world/bad-actions.ts` (odds) and `attemptSteal` / `attemptAssassinate` / `attemptKidnap` in the store. Each attempt takes 0.2 ชั่วยาม and no stamina, and uses **base** stats. Chance = `clamp(50 + score − penalty, 5, 95)` %.

| | Steal | Assassinate | Kidnap |
| --- | --- | --- | --- |
| Score | DEX + 0.5 LUK + 3 × steal mastery (1–5) | STR + DEX + 0.5 LUK | STR + VIT + 0.5 LUK |
| Penalty | 5 × `defenseTier` | 8 × tier | 7 × tier |
| Offered | NPCs with `stealLoot` (94 of 157) or a quest stage that needs the steal, repeatable | when an active quest stage names the NPC; once per NPC | same |
| Success | 1 loot pick (+1 with 30 %), steal xp +25, evil +2, DEX xp +10 | evil +8, fame +2, DEX xp +10 | evil +6, arrogance +1, STR xp +10 |
| Failure | steal xp +8, **+1 wanted mark**, a **non-fatal** fight with the NPC's own spar build (or a tier guard) | a **fatal** fight with a tier guard | a **fatal** fight with a tier guard |

`badActionOffered(state, npc, kind)` is the one rule for which buttons the NPC card shows; `attemptSteal` uses it too. `scripts/test-bad-action-quests.ts` (in `test:quests`) checks that every quest stage needing a steal, assassination or kidnapping offers it on the target's card and advances when done.

Tier guards (`TIER_TO_BAD_ACTION_OPPONENT`): 0 `thug`, 1 `ruffian`, 2 `iron_palm_thug`, 3 `blade_master`, 4 `demonic_master`.

## Location categories and practice

`lib/world/location-categories.ts`.

- 13 categories (`LOCATION_CATEGORY_KEYS`): city, village, inn, home, sect, temple, mansion, isle, mountain, cave, forest, river, frontier.
- `inferCategoriesFromId`: `city_` city · `village_` village · `inn_` inn · `home_` home · `sect_` **sect + mountain** · `temple_` / `palace_` temple · `villa_` mansion · `isle_` isle · `mt_` / `peak_` / `cliff_` / `valley_` mountain · `cave_` / `grotto_` cave · `pool_` / `river_` / `sea_` / `lake_` river · `forest_` / `grove_` forest · `desert_` / `tribe_` / `market_` frontier. A scene's own `categories` win when set (no location sets them today).
- **Practice** (`canPracticeAt`) is allowed at sect, mountain, forest, cave, river and temple locations — 49 places.
- **Xp** (`practiceXpGain`, `PRACTICE_XP`): 30 + 5 % of the xp the skill / art needs for its next level, or 50 + 6 % when the place fits (`practiceMatches`): the location's categories match the skill's types — forest → yang / external, cave → yin / soft, mountain → balance / hard, river → internal. No stacking. At max level only the flat part is given. A skill with no yin / yang / balance tag counts as `balance`, so it gets the mountain bonus (and every sect is a mountain). No location infers `forest` today, so the forest bonus never applies.

## Letters, horse stations and the sword tournament

Three engines that hang off the clock and the map; numbers in [gameplay.md](gameplay.md).

- **Letters** (`lib/world/letters.ts`). `advanceTime` calls `rollLetters(state, dayBefore)` when the day changes (at most the last 7 days). Writers (`letterWriters`): NPCs with relationship ≥ 20, present and alive, not written in 15 days. Each is asked in random order; the first to pass `letterChance(relationship, fame, LUK)` writes that day's one letter, with a gift from `pickLetterGift` at the rarity `giftRarity(roll, LUK, fame)` (giftable items only, the NPC's tastes first, gold for those who like it). `state.letters` (inbox, 40 kept) and `state.letterDays`. The store's `openLetter` takes the gift once.
- **Horse stations** (`lib/world/stations.ts`). `hasStation`: `city_` / `village_` places and the joinable sects' `hallLocationId`s with a world-map spot. `stationTrips(state, from)` lists visited station places with `stationFare` (gold and ชั่วยาม by world-map distance). The store's `stationTravel` pays, advances time and moves the hero (through `onEnter` and auto-advance, like `gotoScene`, without the travel stamina charge). The map shows a `station` marker at a free spot.
- **Sword tournament** (`lib/world/tournament.ts`). A 360-day year; `tournamentPhase(day)` is `registration` (days 60–89), `day` (90–92) or `closed`. `state.tournament` holds this year's `TournamentState` (rounds of seeds, `round`, the hero's place and winnings, the champion and their pick); `state.tournamentHistory` past records. `fightTournamentBout` starts the bracket (`startTournament`: the hero + `drawEntrants`, named roster first) and queues `pendingBattle` with `tournament: true` (non-fatal, no loot). `acknowledgeBattleResult` (win, loss or retreat) calls `resolveRound`, which settles the hero's bout, simulates the rest (`boutOdds` from `powerBreakdown` totals), pays out, and after the final records the year and the prize options (`prizeOptions`: every entrant's moves and art the hero lacks). `pickTournamentPrize` teaches one through `learnSkill` / `learnArt` — the one sanctioned way besides lineage quests and sagas to learn a sect move. `settleTournaments` (each new day) finishes a bracket the hero left and fights a year without the hero among the NPCs.

## Stat progression

`lib/world/stat-progression.ts`:

- Every stat-granting action gives `STAT_XP_PER_ACTION = 10` xp.
- Cost to raise a stat: `xpToNextStatLevel(base, key) = max(1, round(50 × base × mult))`, with AGI ×2.0, DEX ×0.6 and the rest ×1.0. It uses the **base** stat only.
- LUK roll: `lukRollChance(LUK) = min(50 %, 10 % + 1 % × LUK)` → +10 LUK xp on success.
- `STAT_FROM_LIFE_SKILL`: mining, woodcutting, fishing, herbalism, venom → VIT; the six crafts and steal → DEX; reading, music, drawing, writing, chess → INT; hunting and begging → nothing.

Which actions grant which stat: [gameplay.md](gameplay.md#stats).

## Opening helpers

- `lib/world/capital-training.ts` + `lib/world/data/capital-training.ts`: the free beginner bout at the capital hall. The opponent `training_capital_apprentice` (ศิษย์ฝึกหัดอาเฉิง) has fixed tier-0 stats (all 1, `basic_punch`), no drops, is never scaled, and never appears on roads. `capitalTrainingStatus(state)` offers the bout until the first win (needs HP > 1, MP ≥ 2, stamina ≥ 5); `capitalTrainingUpgrade(state)` works out the w-exp top-up for the first skill level afterwards. Scenes `capital_training_duel` / `capital_training_return`.
- `lib/world/clinic-preparation.ts` (`clinicPreparation`): advice after the clinic errand. **No component calls it** since the journey guide was removed; only `test:opening` exercises it.

## Adding a scene effect or condition

1. Add the variant to `SceneEffect` or `Condition` in `lib/world/types.ts`.
2. Add a case to `applyEffect` (`lib/world/effects.ts`) — the compiler will **not** remind you — or to `evaluateCondition` (`lib/world/conditions.ts`), which it will.
3. For a condition that quests can count: also `describeQuestCondition` (quest log), `unmetLeaf` in `quest-guide.ts` (guide), and possibly `evaluateAutoAdvance`.
4. If the audit should understand it, extend `scripts/audit-quest-completion.ts`.
5. Run `bun run typecheck` and `bun run test:quests`.

## Living places

Content for villages, towns, homes and new quests for old NPCs lives in `lib/world/data/places/<group>.ts` (`villages`, `towns`, `homes_a`–`homes_c`, `elders_a`, `elders_b`), each exporting one `PlaceContent` (`npcs`, `quests`, `scenes`, `activities`, `opponents`). `places/index.ts` merges them into the NPC, quest, scene, opponent and activity registries.

- **Place activities.** An `ActivityDef` with `place: { locationIds, cooldownDays, costGold?, reward, doneText, spot? }`. `doActivity` checks the place, the cooldown (`activityDays[id]`), stamina and gold, then pays gold (a range), w-exp, stat xp, a trait, an item (with a chance), stamina, heal or relationship, and logs `activity`. Auto maps put the spot on `ACTIVITY_SLOTS`; hand maps add the ones with `spot`.
- **Presence** (`npc-presence.ts`). `npcPresent(state, id)` is false for `assassinatedNpcIds` and while `day < kidnappedUntil[id]` (set to day + `KIDNAP_RETURN_DAYS` = 180 on a successful kidnapping). The location map and card hide absent NPCs; `kidnappedNpcIds` stays for quest conditions, so the same NPC can't be kidnapped twice.
- **Gifts** (`gifts.ts`, store `giveGift(npcId, { itemId } | { gold })`). Refused while absent, within 30 days of the last gift (`giftDays`), or for quest items and manuals. `giftOutcome` = worth (1–5 by gold value: 120 / 400 / 1000 / 3000) — ×2 when liked, +2 more for a favourite item id, −2 when disliked. Tastes come from `NpcDef.likes` / `dislikes` (item ids, categories, `"gold"`), else from `TAG_TASTES` by the NPC's tags, else food.
- **Skill quests.** Every ยุทธจักร T0–T3 skill and art (except `basic_punch`) is the reward of a quest; the 69 that had none are taught by exactly one place quest. T1+ quests gate on `statAtLeast`, T2+ also on `npcRelationship` with the giver; `test:places` checks both, and that no teacher can be assassinated or kidnapped. Manuals and city school halls may still sell the commoner ones.

## Known gaps

- `sect_join` and `quest_major_complete` rumors never fire in play (joins happen through quest rewards; no quest sets `isMajor`).
- Quest-reward `joinSect` doesn't check the sect's `joinRequirements` (only the unused store action does); the effective gate is the intro quest's `prereqs`.
- An abandoned quest can never be accepted again; a sect the hero left can never be rejoined.
- The `_skipEventRoll` flag is still written but nothing reads it.
- The forest practice bonus is unreachable (no forest locations).
