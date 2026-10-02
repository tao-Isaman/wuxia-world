# Save format

The game keeps everything in the browser's `localStorage` through Zustand's `persist` middleware. There is no server and no save slot: the world save is written after every state change.

## Contents

- [Storage keys](#storage-keys)
- [What is not saved](#what-is-not-saved)
- [The world save](#the-world-save)
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
| `localStorage["wusia-world-v1"]` | the world game (`store/world-store.ts`) | **21** |
| `localStorage["wusia-character-v1"]` | the two /debug builds (`store/character-store.ts`) | **3** |
| `localStorage["wuxia-audio-v1"]` | sound switches and volumes (`lib/audio/engine.ts`) | — |
| `localStorage["wuxia-random-events"] = "off"` | turns walk-tick encounters off (tests) | — |
| `sessionStorage["wuxia:lastBanner"]` | skips the arrival banner after a reload in the same place | — |

The two save keys keep the historical spelling "wusia". Do not rename them: a new key would orphan every existing save.

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

`partialize` writes every data field of `WorldStateData` (`lib/world/types.ts`), 47 in all, and none of the action functions:

| Group | Fields |
| --- | --- |
| Run | `hasGame`, `gameOver`, `gender`, `playerBodyId` |
| Hero | `playerBuild` (stats, slots, gear, learned skills and arts, levels), `currentHp`, `currentMp`, `stamina`, `staminaMax` |
| Where | `currentSceneId`, `lastLocationId`, `visitedLocationIds` |
| Time | `day` (from 1), `time` (0 to below 12 ชั่วยาม) |
| Money and bag | `gold`, `inventory` (item id → count), `inventoryEquipment` (gear id → count) |
| Progress | `wExp`, `skillLevel`, `skillExp`, `artExp`, `statExp`, `lifeSkillXp` (19 keys), `learnedRecipeIds` |
| Story | `flags`, `quests` (id → `{ id, status, stage, acceptedDefeatedAt?, acceptedHasItemAt? }`), `traits`, `npcStates` |
| Ledgers | `defeatedCounts`, `stoleFromCounts`, `assassinatedNpcIds`, `kidnappedNpcIds` |
| Sects | `sectMembership` (sect id → `{ rank, points, lastQuestDay, artQuestsDone, rewardPicks, joinedDay, status? }`) |
| Pending | `pendingBattle`, `pendingEncounter`, `pendingHuntYield`, `pendingSpar` |
| Log | `actionLog` (newest 100) |
| Law | `wanted`, `wantedDay`, `jailCityId`, `jailUntil` |
| Liveness | `npcExt`, `rumorPool`, `rumorArchive`, `rumorSeenLog`, `lastNpcTickDay` |

Notes:

- **Levels.** Move-skill levels live in `skillLevel` and are mirrored into `playerBuild.skillLevels`. Art levels live only in `playerBuild.artLevels`.
- **Sect status.** A missing `status` on a membership reads as `"active"`; nothing ever writes the default.
- **Jail time.** `jailUntil` is an absolute count of ชั่วยาม (`day × 12 + time`).

## Loading a save

This is Zustand 5 `persist` over synchronous `localStorage`, so it all happens while the store is created:

1. Read `{ state, version }` from `wusia-world-v1`.
2. If `version !== 21`, run `migrate(state, version)`.
3. Run `merge(persisted, current)`: `{ ...current, ...persisted }`, then `seedLoreRumors` if a game exists.

   This step runs for current-version saves too; it is how new lore reaches old saves.
4. Replace the store state with the result.
5. Run `onRehydrateStorage` → `validateAndRepair(state)`.

   It mutates the state object in place, without `set`, so no subscriber fires. The repaired values reach `localStorage` with the next change.

## Migration

`migrate` in `store/world-store.ts` is **one idempotent normalizer**; it ignores `fromVersion`. It works on any older save:

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

## Repair on load

`validateAndRepair` (`lib/world/validate.ts`) keeps a save playable after content changes: renamed scenes, removed items, quests, NPCs, opponents, skills, arts or recipes. It returns at once when there is no game, and otherwise runs these steps in order, logging a warning for most fixes.

**Place and time**

1. An unknown `currentSceneId` becomes `home_player`.
2. A `lastLocationId` that is unknown or not a location becomes `null`. This also clears a road id that a walk event pinned there.
3. `flags._skipEventRoll` is deleted.
4. `day` is at least 1 and `time` at least 0; `time` of 12 or more rolls into `day`.

**Law and pending actions**

5. `wanted` becomes an integer 0–5; a missing `wantedDay` becomes `day`.
6. `jailCityId` must be a location and `jailUntil` a finite number; anything else becomes `null`.
7. `pendingBattle` is cleared if its opponent, `onWin` or `onLose` scene is gone.
8. `pendingHuntYield` is cleared if its resource or return scene is gone.
9. `pendingSpar` is cleared if its NPC is gone.
10. `pendingEncounter` is cleared if its opponent or return scene is gone.

**Bag and quests**

11. Unknown item ids are dropped from `inventory`.
12. Unknown gear ids are dropped from `inventoryEquipment`; counts become positive integers.
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
    - `artLevels` keeps known arts, clamped 1–10.

**World ledgers and sects**

24. `npcStates`: unknown NPCs are dropped; a relationship that is not a number becomes 0.
25. `defeatedCounts` and `stoleFromCounts` drop unknown ids and keep non-negative integers.
26. `visitedLocationIds`, `assassinatedNpcIds` and `kidnappedNpcIds` keep known ids only, without duplicates.
27. Each `sectMembership` rank is clamped between the sect's top rank and its start rank.

**Not repaired:**

- unknown ids inside skill slots or equipped gear;
- `gold`;
- flags other than `_skipEventRoll`;
- quest `status`;
- a sect's `status`, or sect ids that no longer exist;
- `npcExt` and the rumor arrays;
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

`trackedQuestId` and `_lastBannerDay` are written through the store's `_setFlag`, which is therefore used by production UI despite its underscore name.

## The /debug save

`wusia-character-v1` holds `{ builds: { A, B } }` for the /debug sandbox; the world never reads it.

- v1 → v2 padded `skillIds` from 5 to 10 slots and seeded the learned arrays.
- v2 → v3 clamps `skillIds` to exactly 10.

Its `migrate` fills a missing side with a default build (ยุนม่อ / ผู้พิทักษ์).

## Changing the save

When you add or change a persisted field:

1. Add it to `WorldStateData` in `lib/world/types.ts` and to `emptyData()` in `store/world-store.ts`.
2. Add it to `partialize` in the persist options (the list is explicit).
3. Give it a default in `migrate`, so older saves get a valid value.
4. Bump `version`, and extend the comment above `migrate`.
5. If it holds content ids, clean them in `validateAndRepair`.
6. Update the version and history in this page and the version in `CLAUDE.md`.
7. Update the e2e test that loads an older save (`tests/browser/game.spec.ts`, "version 18 saves migrate…") to expect the new version.

Content-only changes (a new quest, item or scene) need no version bump: missing records read as defaults, and repair drops removed ids.

## Tests

- **Browser.** `tests/browser/game.spec.ts` loads a hand-written version-18 save and checks that it is upgraded to version 23 and plays.
- **Rumors.** `scripts/test-lore-rumors.ts` (in `bun run test:rumors`) rehydrates v18 / v19 saves and checks the version, lore seeding and repair.
- **Everything else.** Most `scripts/test-*.ts` files import the real store with an in-memory `localStorage`, so they exercise `persist` as well.
