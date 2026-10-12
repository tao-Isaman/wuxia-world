# Save format

Without a game server the game keeps everything in the browser's `localStorage`: the player's save is written through Zustand's `persist` middleware after every state change, and the **shared world** (the people and the rumors) beside it under its own key ([design](design/world-clock-and-shared-world.md)). With a server (the released game) each character's save, in this same format, lives on the server, and the world is the server's one world for everyone ([online.md](online.md)).

## Contents

- [Storage keys](#storage-keys)
- [What is not saved](#what-is-not-saved)
- [The world save](#the-world-save)
- [The shared world](#the-shared-world)
- [Loading a save](#loading-a-save)
- [Migration](#migration)
- [Version history](#version-history)
- [Repair on load](#repair-on-load)
- [Flags the code uses](#flags-the-code-uses)
- [The /debug save](#the-debug-save)
- [Changing the save](#changing-the-save)
- [Tests](#tests)

## Storage keys

| Key | Holds | Version |
| --- | --- | --- |
| `localStorage["wusia-world-v1"]` | the player's game (`store/world-store.ts`) — **only without a game server**; with one, each character's save lives on the server ([online.md](online.md#characters-and-saves)) in this same format | **29** |
| `localStorage["wusia-shared-v1"]` | the shared world, `{ version, world }` (`store/world/shared-local.ts`) — only without a game server; with one there is one world on the server for everyone ([online.md](online.md#the-shared-world)) | **1** |
| `localStorage["wuxia-imported-v1"]` | the local hero already imported to the server (the offer is not shown again) | — |
| `localStorage["wusia-character-v1"]` | the two /debug builds (`store/character-store.ts`) | **3** |
| `localStorage["wuxia-audio-v1"]` | sound switches and volumes (`lib/audio/engine.ts`) | — |
| `localStorage["wuxia-random-events"] = "off"` | turns walk-tick encounters off (tests) | — |
| `sessionStorage["wuxia:lastBanner"]` | skips the arrival banner after a reload in the same place | — |

The save keys keep the historical spelling "wusia". Do not rename them: a new key would orphan every existing save.

An installed PWA asks the browser to keep its storage (`navigator.storage.persist()` in `components/pwa.tsx`).

## What is not saved

| Not saved | Why |
| --- | --- |
| `store/battle-store.ts` | a battle is rebuilt from `pendingBattle` after a reload: the briefing shows again and `ensureBattleStarted` (`lib/world/battle-bridge.ts`) restarts it |
| `store/loading-store.ts`, `toast-store.ts`, `confirm-store.ts` | transient UI |
| where the hero stands on each map | an in-memory map in `lib/stage/types.ts`, cleared on a new game |
| Phaser objects, textures, GPU state | never enter a store |

A reload during a battle restarts that battle from the start with the hero's saved HP and MP.

## The world save

`partialize` (`partializeSave`, typed `PlayerSave` = `WorldStateData` without the shared keys) writes the player's data fields of `WorldStateData` (`lib/world/types.ts`), 48 in all, and none of the action functions or [shared-world](#the-shared-world) fields:

| Group | Fields |
| --- | --- |
| Run | `hasGame`, `gameOver`, `gender`, `playerBodyId` |
| Hero | `playerBuild` (stats, slots, gear, learned skills and arts, levels, meridian charts `meridians`), `currentHp`, `currentMp`, `stamina`, `staminaMax` |
| Where | `currentSceneId`, `lastLocationId`, `visitedLocationIds` |
| Time | `day`, `time` (0 to below 12 ชั่วยาม): the world clock's, set on every action (`syncClock`) — saved so a reload shows where the hero was; `startDay` (v28): the world day the hero entered the jianghu (`startNewGame`) — progress that grows with the hero's own days (foe power, `playerPowerIndex`; the game-over day count) reads `daysInJianghu` = `day − startDay` (`lib/world/clock.ts`), never the world's `day` |
| Money and bag | `gold`, `inventory` (item id → count), `inventoryEquipment` (gear key → count; a key is the equipment id plus its options, `eq_t1_w_sword~pa:6,cri:9`, [combat.md](combat.md#gear-options-libgamegearts)) |
| Looks (v29) | `appearance`: `{ outfit, hideWeapon }` (the outfit worn, ซ่อนอาวุธ); `wardrobe`: the outfits bought from tailors (the others unlock from the save itself: sects, the tournament) — [design/appearance.md](design/appearance.md) |
| Progress | `wExp`, `skillLevel`, `skillExp`, `artExp`, `meridianPoints`, `statExp`, `lifeSkillXp` (19 keys), `learnedRecipeIds` |
| Story | `flags`, `quests` (id → `{ id, status, stage, acceptedDefeatedAt?, acceptedHasItemAt? }`), `traits`, `npcStates` |
| Ledgers | `defeatedCounts`, `stoleFromCounts` |
| Sects | `sectMembership` (sect id → `{ rank, points, lastQuestDay, artQuestsDone, rewardPicks, joinedDay, status? }`) |
| Pending | `pendingBattle`, `pendingEncounter`, `pendingHuntYield`, `pendingSpar` |
| Log | `actionLog` (newest 100) |
| Law | `wanted`, `wantedDay`, `jailCityId`, `jailUntil` |
| Rumors heard | `rumorSeenLog` |
| Gifts, letters, activities | `giftDays`, `letters`, `letterDays`, `activityDays` |

Notes:

- **Levels.** Move-skill levels live in `skillLevel` and are mirrored into `playerBuild.skillLevels`. Art levels live only in `playerBuild.artLevels`.
- **Meridians.** `meridianPoints` is the unspent point pool; the learned charts and their point ranks are `playerBuild.meridians` (chart id → rank 0–3 per point).
- **Sect status.** A missing `status` on a membership reads as `"active"`; nothing ever writes the default.
- **Jail time.** `jailUntil` is an absolute count of ชั่วยาม (`day × 12 + time`) on the world clock.

## The shared world

`SHARED_WORLD_KEYS` (`lib/world/shared/world.ts`) — what belongs to the world, not the hero:

| Field | Holds |
| --- | --- |
| `worldSeed` | the world's random seed (each NPC week draws from `seededRng(worldSeed, day)`) |
| `worldEventLog` | the last 500 `WorldEvent`s (`npc_killed`, `npc_kidnapped`, `boss_slain`, `rumor`) |
| `npcExt`, `lastNpcTickDay` | the living jianghu ([liveness.md](liveness.md); Liveness 2.0 added only optional fields inside `npcExt` entries, filled by `seedLiveness` on load) |
| `rumorPool`, `rumorArchive` | the rumors going round, and the expired ones |

Since v28 the hero's own deeds are the save's, not the world's (`PLAYER_FROM_WORLD_KEYS`): `assassinatedNpcIds`, `kidnappedNpcIds`, `kidnappedUntil` (whom this hero killed or carried off — gone from this hero's map), `bossDefeatedDay` (the beasts this hero felled) and `tournament`, `tournamentHistory` (this hero's tournaments). A killing of one of the simulated people still marks them dead in `npcExt`, the world's.

They live on the store's state like any other field (every engine reads `state.npcExt`), but `localWorldService` keeps them under `wusia-shared-v1`. `attachSharedWorld` (in `store/world-store.ts`, right after the store is created) lays the stored world over the loaded save (`joinSharedWorld`), keeping any shared field the save itself carried (an older save — `takeCarriedWorldKeys`); with no stored world, the save's own is kept; a missing seed, people or lore are seeded. It then repairs, writes the world and saves it again whenever a shared field changes. A new game joins the world as it is (`startNewGame({ newWorld: true })` makes a fresh one); `resetGame` keeps it. On a game server the world comes from the server instead and is never written from the browser (`cloudSave.world`, `store/cloud-world.ts`).

## Loading a save

This is Zustand 5 `persist` over synchronous `localStorage`, so it all happens while the store is created:

1. Read `{ state, version }` from `wusia-world-v1`.
2. If `version !== 29` (`SAVE_VERSION`, `store/world/save-version.ts`), run `migrate(state, version)`.
3. Run `merge(persisted, current)`: `{ ...current, ...persisted }` (noting which shared fields the save carried), then `seedLoreRumors` and `seedLiveness` if a game exists, and back-fill `playerBuild.baseHp` (`HERO_BASE_HP`, also added to `currentHp`) for saves made before the hero's flat base HP.

   This step runs for current-version saves too; it is how new lore reaches old saves.
4. Replace the store state with the result.
5. Run `onRehydrateStorage` → `validateAndRepair(state)`.

   It mutates the state object in place, without `set`, so no subscriber fires. The repaired values reach `localStorage` with the next change.
6. `attachSharedWorld` joins the [shared world](#the-shared-world) and repairs once more against it.

## Migration

`migrate` (`migrateSave` in `store/world/persist.ts`) is **one idempotent normalizer**. Its only use of `fromVersion` is v27's rebase (below); the rest works on any older save:

- **v28: the hero's first day (`startDay`).** A save from before v27 counted its own days from 1, so its `startDay` is 1, rebased with every other stamp (a 100-day-old hero stays 100 days old). A v27 save never recorded it: it gets its own `day`, i.e. it counts as starting now (foe power from days restarts at 0; sect rank still raises it). Repair keeps `startDay` a number no later than `day` (it may be below 1 for a rebased old save).

- **v27: onto the world clock.** A save from before v27 counted its own days. `rebaseDays` (`lib/world/shared/rebase.ts`) shifts every day stamp by `worldNow().day − save.day` — `day`, `wantedDay`, `lastNpcTickDay`, `giftDays`, `letterDays`, `activityDays`, `kidnappedUntil`, `bossDefeatedDay`, letters, the action log, heard rumors, rumors and their archive, sect `joinedDay` / `lastQuestDay`, and each person's `lastTickDay`, history, seclusion, wounds, death day and journey — so cooldowns and news keep the time they had left. A jail term left is cut to at most 12 ชั่วยาม; a running tournament is dropped (its history kept). Birthdays are days of the year and stay.

- **The build.**
  - pads `skillIds` to 10 slots;
  - fills `learnedSkillIds` from bare slot ids;
  - fills `learnedArtIds` and `artLevels` from the legacy single `artId` / `artLevel`;
  - puts that legacy art into the first empty slot as `art:<id>`.
- **Field defaults**, written as `{ ...emptyData(), ...saved, … }`:

| Field | Default or repair |
| --- | --- |
| `stamina`, `staminaMax` | 100 when not a number |
| `currentHp`, `currentMp` | full (from `deriveAll`) when missing or negative |
| `lifeSkillXp`, `statExp`, `traits` | merged over a full, zeroed key set |
| `wExp` | 0 when negative or missing |
| `meridianPoints` | 0 when not a non-negative number; floored |
| `skillLevel`, `skillExp`, `artExp`, `npcStates`, `defeatedCounts`, `stoleFromCounts`, `inventoryEquipment`, `sectMembership`, `npcExt` | `{}` when not an object |
| `learnedRecipeIds`, `visitedLocationIds`, `assassinatedNpcIds`, `kidnappedNpcIds`, `rumorPool`, `rumorArchive`, `rumorSeenLog` | `[]` when not an array |
| `day` / `time` | at least 1 / at least 0 |
| `pendingHuntYield`, `pendingSpar`, `pendingEncounter` | `null` when missing |
| `gameOver` | `true` only when it was exactly `true` |
| `actionLog` | the newest 100 |
| `gender` | `"female"` or `"male"` |
| `playerBodyId` | kept, else `f1` / `m1` by gender |
| `lastNpcTickDay` | kept when ≥ 1, else `day` |
| `wanted` | an integer 0–5 |
| `wantedDay` | kept, else `day` |
| `jailCityId`, `jailUntil` | kept when the right type, else `null` |

## Version history

What each version added. v1–v13 and v17→v18 are described in the comment above `migrate`; the others come from the commits that bumped the version.

| Version | Added |
| --- | --- |
| v1 → v2 | `stamina`, `staminaMax`, `lifeSkillXp` (6 keys), `pendingHuntYield` |
| v2 → v3 | `lifeSkillXp` grows to 17 keys |
| v3 → v4 | `day`, `time` |
| v4 → v5 | `wExp`, `skillLevel`, `skillExp` |
| v5 → v6 | `statExp` |
| v6 → v7 | `traits`, `npcStates`, `pendingSpar` |
| v7 → v8 | `currentHp`, `currentMp` |
| v8 → v9 | 10 skill slots; `learnedSkillIds`, `learnedArtIds`, `artLevels` |
| v9 → v10 | `pendingEncounter` |
| v10 → v11 | `actionLog` |
| v11 → v12 | `defeatedCounts`, `visitedLocationIds` |
| v12 → v13 | `artExp` |
| v13 → v14 | `learnedRecipeIds`; the `accessory` life skill |
| v14 → v15 | `inventoryEquipment` (the gear bag) |
| v15 → v16 | `stoleFromCounts`, `assassinatedNpcIds`, `kidnappedNpcIds`; the `steal` life skill |
| v16 → v17 | `gender`, `sectMembership` (the `status` field came later without a bump) |
| v17 → v18 | `npcExt`, `rumorPool`, `rumorArchive`, `rumorSeenLog`, `lastNpcTickDay` |
| v18 → v19 | `playerBodyId` |
| v19 → v20 | `wanted`, `wantedDay`, `jailCityId` |
| v20 → v21 | `jailUntil` |
| v21 → v22 | `kidnappedUntil`, `giftDays`, `activityDays` |
| v22 → v23 | `letters`, `letterDays` (letters from friends); `tournament`, `tournamentHistory` (the sword tournament) |
| v23 → v24 | `meridianPoints` and `playerBuild.meridians` (ชีพจร, meridian charts) |
| v24 → v25 | `lawEvasions` (escapes from the law since the last sentence); `wanted` is no longer clamped to 5 |
| v25 → v26 | `bossDefeatedDay` (boss id → the day each legendary beast last fell, `lib/world/data/bosses.ts`; default `{}`) |
| v26 → v27 | the world clock: day stamps rebased (`rebaseDays`); `worldSeed`, `worldEventLog`; the shared-world fields move out of the save into `wusia-shared-v1` |
| v27 → v28 | the hero's own deeds come back from the shared world (`PLAYER_FROM_WORLD_KEYS`: `assassinatedNpcIds`, `kidnappedNpcIds`, `kidnappedUntil`, `bossDefeatedDay`, `tournament`, `tournamentHistory`): in a world shared by many players these are each player's own; and `startDay` (the hero's first world day: 1 rebased for a pre-v27 save, else the save's `day`). `joinSharedWorld` hands an older local world's values to a save that has none |
| v28 → v29 | `appearance` (`{ outfit: "default", hideWeapon: false }`) and `wardrobe` (`[]`): outfits and the weapon on the body ([design/appearance.md](design/appearance.md)). Repair keeps only tailors' outfits in `wardrobe` (once each) and puts an outfit no longer held (unknown, a sect the hero is no longer an active disciple of, the other gender's) back to `default` |

## Repair on load

`validateAndRepair` (`lib/world/validate.ts`) keeps a save playable after content changes: renamed scenes, removed items, quests, NPCs, opponents, skills, arts or recipes. It first repairs the simulated people (step 0, which belongs to the shared world and so runs even with no game), then returns at once when there is no game, and otherwise runs these steps in order, logging a warning for most fixes.

**The simulated people** (`repairNpcExt`, `lib/world/npc-repair.ts`)

0. `npcExt`: an entry whose id is neither in the NPC registry nor a generated person (`dynamic: true`, id `dyn_<n>`) is dropped. In the rest, `power` is clamped 0–100, `age` 1–130, `sectRank` 1–10 (0 without a sect), the temper 0–1 (`righteous` −1…1) and `birthday` 0–364; an unknown `status` becomes `alive`, an unknown `sect` / `formerSect` / `gender` is cleared; a home or current place that is not a location falls back to the home, the authored home, else `city_capital`; rivals and allies keep known people only (no duplicates, never oneself); `masterId` / `spouseId` / `heirId` naming nobody known and non-finite `secludedUntil` / `woundedUntil` / `deathDay` are removed; malformed goals and history entries are dropped (history kept to 10); a journey through an unknown place or after an unknown person is cancelled (`plan: null`). A non-finite `lastNpcTickDay` becomes `day`. Day stamps are never pulled back to the save's day: the shared world may be ahead of it until the clock syncs. Changed entries are replaced, never mutated.

**Place and time**

1. An unknown `currentSceneId` becomes `home_player`.
2. A `lastLocationId` that is unknown or not a location becomes `null`. This also clears a road id that a walk event pinned there.
3. `flags._skipEventRoll` is deleted; malformed sect-feud flags (`feud:<sect>` …, an unknown sect, a non-number end day) are dropped (`repairFeudFlags`, `lib/world/feuds.ts`).
4. `day` is at least 1 and `time` at least 0; `time` of 12 or more rolls into `day`. `startDay` is a number no later than `day` (missing: `day`). (The world clock then moves them on: `syncClock` never moves time back.)

**Law and pending actions**

5. `wanted` becomes an integer 0–5; a missing `wantedDay` becomes `day`.
6. `jailCityId` must be a location and `jailUntil` a finite number; anything else becomes `null`.
7. `pendingBattle` is cleared if its opponent, `onWin` or `onLose` scene is gone.
8. `pendingHuntYield` is cleared if its resource or return scene is gone.
9. `pendingSpar` is cleared if its NPC is gone.
10. `pendingEncounter` is cleared if its opponent or return scene is gone.

**Bag and quests**

11. Unknown item ids are dropped from `inventory`.
12. Gear (`repairGear`, `lib/world/gear.ts`): unknown pieces are dropped from `inventoryEquipment` and the loadout, counts become positive integers, keys become canonical (options clamped), a piece from before options (fewer than its tier's least) gets them rolled — seeded by its key, so the browser and the server repair it alike — and a piece in the wrong slot type is taken off. No save version bump: keys are still strings.
13. Unknown quest ids are dropped, and each quest's `stage` is clamped to its stage list.

**Hero**

14. `staminaMax` must be above 0 (else 100); `stamina` is clamped to 0…max.
15. HP and MP: with a build, missing or negative values become full and are capped at the maximum; without a build, they are at least 0.
16. All 19 `lifeSkillXp` keys exist and are ≥ 0.
17. `wExp` is ≥ 0.
18. `skillLevel` / `skillExp`: unknown skills are dropped, levels are clamped 1–10 and xp is ≥ 0.
19. `artExp`: unknown arts are dropped and xp is ≥ 0.
20. `learnedRecipeIds` keeps known recipes only, without duplicates.
21. `playerBuild.skillLevels` is copied from `skillLevel`.
22. All 8 `statExp` keys and all 5 `traits` exist and are ≥ 0.
23. The build:
    - `skillIds` is padded to 10;
    - `learnedSkillIds` and `learnedArtIds` keep known ids only (never `"none"`), without duplicates;
    - `artLevels` keeps known arts, clamped 1–10;
    - `meridians` keeps known charts only, each padded / trimmed to the chart's point count with ranks clamped 0–3.
    - `meridianPoints` becomes a non-negative integer (else 0).

**World ledgers and sects**

24. `npcStates`: unknown NPCs are dropped; a relationship that is not a number becomes 0.
25. `defeatedCounts` and `stoleFromCounts` drop unknown ids and keep non-negative integers.
26. `visitedLocationIds`, `assassinatedNpcIds` and `kidnappedNpcIds` keep known ids only, without duplicates. `bossDefeatedDay` keeps known boss ids (`getBoss`) with a finite number day.
27. Each `sectMembership` rank is clamped between the sect's top rank and its start rank.

**Not repaired:**

- unknown ids inside skill slots or equipped gear;
- `gold`;
- flags other than `_skipEventRoll` and the feud flags;
- quest `status`;
- a sect's `status`, or sect ids that no longer exist;
- the rumor arrays;
- `actionLog`, `gender`, `playerBodyId`, `gameOver`;
- whether `jailUntil` agrees with `currentSceneId`.

## Flags the code uses

`flags` is a free `Record<string, boolean | number | string>`. Most flags belong to content (set and read by scene effects and conditions). These are read or written by code:

| Flag | Meaning |
| --- | --- |
| `trackedQuestId` | the quest pinned in the quest log; `"none"` (`TRACK_NONE`) turns tracking off; absent means "newest active quest" |
| `qobj:<questId>:<stageId>:<spotIndex>` | a quest objective spot is done (the stage's **id**, not its index) |
| `_lastBannerDay` | the rumor banner's 7-day cooldown |
| `capital_ledger_recovered` | content flag that also swaps the capital's archive chest to open |
| `begging_learned` | content flag that reveals begging spots |
| `_skipEventRoll` | written by walk events and hunting; nothing reads it any more, and repair deletes it |
| `feud:<sectId>`, `feud_wins:<sectId>`, `feud_victim:<sectId>` | a sect's blood feud against the hero ([liveness.md](liveness.md#sects-avenge-their-dead)): the feud's last day, the avengers beaten, whom they avenge |
| `lead:<rumorId>` | a lore lead the hero heard (`"heard"`) or followed to its place (`"found"`), [liveness.md](liveness.md#leads-and-warnings) |

`trackedQuestId` and `_lastBannerDay` are written through the store's `_setFlag`, which is therefore used by production UI despite its underscore name.

## The /debug save

`wusia-character-v1` holds `{ builds: { A, B } }` for the /debug sandbox; the world never reads it.

- v1 → v2 padded `skillIds` from 5 to 10 slots and seeded the learned arrays.
- v2 → v3 clamps `skillIds` to exactly 10.

Its `migrate` fills a missing side with a default build (ยุนม่อ / ผู้พิทักษ์).

## Changing the save

When you add or change a persisted field:

1. Add it to `WorldStateData` in `lib/world/types.ts` and to `emptyData()` in `store/world/state.ts`.
2. Add it to `partializeSave` in `store/world/persist.ts` (the list is explicit; it is typed `WorldStateData`, so a forgotten field fails `bun run typecheck`).
3. Give it a default in `migrateSave` (same file), so older saves get a valid value.
4. Bump `version` in `store/world-store.ts`, and extend the comment above `migrateSave`.

   If `draftFrom` (`store/world/state.ts`) should copy it per action, add it there too.
5. If it holds content ids, clean them in `validateAndRepair`.
6. Update the version and history in this page and the version in `CLAUDE.md`.
7. Update the e2e test that loads an older save (`tests/browser/game.spec.ts`, "version 18 saves migrate…") to expect the new version.

Content-only changes (a new quest, item or scene) need no version bump: missing records read as defaults, and repair drops removed ids.

## Tests

- **Browser.** `tests/browser/game.spec.ts` loads a hand-written version-18 save and checks that it is upgraded to version 29 and plays.
- **Clock and shared world.** `scripts/test-clock.ts` (`bun run test:clock`) checks the save / shared-world split, `attachSharedWorld`, the carried fields, the v28 hand-over of the hero's deeds, `rebaseDays` and the v26 → v27 `migrate`.
- **Meridians.** `scripts/test-meridians.ts` (`bun run test:meridians`) checks `partialize`, the `migrate` default and the repair of `meridians` / `meridianPoints`.
- **Rumors.** `scripts/test-lore-rumors.ts` (in `bun run test:rumors`) rehydrates v18 / v19 saves and checks the version, lore seeding and repair.
- **Everything else.** Most `scripts/test-*.ts` files import the real store with an in-memory `localStorage`, so they exercise `persist` as well.
