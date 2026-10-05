# Content authoring

Step-by-step recipes for adding content, and the checks that catch mistakes. Content is plain TypeScript data. Most additions need no engine change: you append to a table, and the registries, the popups, the audits and the [reference pages](reference/README.md) pick it up.

Engine semantics (scene kinds, every effect and condition, how quests advance) are in [world-engine.md](world-engine.md). Combat field meanings are in [combat.md](combat.md#data-tables).

## Contents

- [Where content lives](#where-content-lives)
- [Checks to run](#checks-to-run)
- [A location](#a-location)
- [A road between two places](#a-road-between-two-places)
- [A painted map](#a-painted-map)
- [An NPC](#an-npc)
- [A dialog scene](#a-dialog-scene)
- [A quest](#a-quest)
- [An item](#an-item)
- [A shop or a sect-hall offer](#a-shop-or-a-sect-hall-offer)
- [A recipe or an artisan](#a-recipe-or-an-artisan)
- [A gathering node](#a-gathering-node)
- [An opponent](#an-opponent)
- [Move skills and inner arts](#move-skills-and-inner-arts)
- [Equipment](#equipment)
- [A joinable sect](#a-joinable-sect)
- [Named NPCs and rumors](#named-npcs-and-rumors)
- [Style rules](#style-rules)

## Where content lives

| Content | File(s) | Registry / helper |
| --- | --- | --- |
| locations (world map) | `lib/world/data/world-map.ts` (`leaf()` in 11 arrays) | `SCENES`, `getScene` |
| roads | `lib/world/data/location-routes.ts` | generated `route_<a>__to__<b>` scenes |
| tutorial scenes, jail, walk-event dialogs | `lib/world/data/scenes.ts` (`CORE_SCENES`) | |
| dialog scenes | `lib/world/data/scenes-content/{cities,villages,wilderness,evil,spies}.ts`, `scenes-content/sects/<file>.ts` | |
| painted maps | `lib/world/data/auto-map-ids.ts`, `auto-maps.ts`, `location-maps.ts`; images in `public/maps/` | `getLocationMap` |
| road paintings | `lib/world/data/route-maps.ts`; images in `public/maps/routes/` | `getRouteMap` |
| NPCs | `lib/world/data/npcs.ts` (core), `npcs/{cities,villages,wilderness,evil,spies}.ts`, `npcs/sects/<file>.ts` | `NPCS`, `getNpc`, `getNpcsAtLocation` |
| NPC art | `public/npcs/`; id sets in `npc-portrait-ids.ts`, `npc-body-ids.ts`, `npc-pixel-ids.ts` | `npcPortrait`, `npcBodySprite`, `npcPixelSprite`, `npcBattleSprite` |
| quests | `lib/world/data/quests.ts` (core), `quests/{cities,villages,wilderness,evil,spies}.ts`, `quests/sects/<file>.ts` | `QUESTS`, `getQuest`, `getQuestsForNpc`, `getQuestsForSect` |
| items | `lib/world/data/items.ts`; icons in `item-icons.ts` | `ITEMS`, `getItem`, `itemIconUrl` |
| shops | `lib/world/data/shops.ts` | `getShopAt` |
| city sect halls | `lib/world/data/sect-halls.ts` | `getSectHallAt` |
| artisans | `lib/world/data/artisans.ts` | `getArtisansAt`, `recipesOfferedBy`, `equipmentOfferedBy` |
| recipes | `lib/world/data/recipes.ts` | `getRecipe` |
| gathering nodes | `lib/world/data/resources.ts` (placement in `world-map.ts`) | `getResource` |
| opponents | `lib/world/data/opponents.ts` | `OPPONENTS`, `getOpponent` |
| random encounters | `lib/world/data/random-events.ts` | `fightEventsForLocation` |
| sects | `lib/world/data/sect-memberships.ts`, `lib/game/data/sects.ts`, `SectId` in `lib/world/types.ts` | `SECT_MEMBERSHIPS` |
| move skills, inner arts, gear | `lib/game/data/skills.ts`, `arts.ts`, `equipment.ts` | `SKILLS_BY_ID`, `getArt`, `getEquip` |
| regions (rumors, road colours) | `lib/world/data/regions.ts` | `regionOf` (from the world map) |
| simulated NPCs, rumor text, lore | `lib/world/data/named-npcs.ts`, `rumor-templates.ts`, `lore-rumors.ts` | see [liveness.md](liveness.md) |

The per-sect files are mostly named after the **location** suffix, not the `SectId`:

- The Sun-Moon sect (`SectId` `sunmoon`, grounds `sect_ming`) keeps its NPCs in `npcs/sects/ming.ts`. Its quests and scenes are split between `ming.ts` and `sunmoon.ts`.
- Jinyiwei has no `scenes-content/sects/` file; its scenes are in `scenes-content/spies.ts`.
- Lore-only sects have NPC and scene files but no quest file.

## Checks to run

Run these after any content change:

| Command | Catches |
| --- | --- |
| `bun scripts/audit-content.ts` | NPC / quest / scene references that do not resolve; duplicate NPC or quest ids |
| `bun run test:quests` | every quest can be started, progressed and finished from `home_player`; every item and kill quest plays through the real store; every stage has guidance |
| `bun run typecheck` | wrong field names, bad unions, missing `Record<SectId, …>` entries |
| `bun run test:navigation` | a painted map whose spawn, NPCs, exits or services cannot be reached |
| `bun run test:grid-skills` | a skill or art without a valid battle range |
| `bun scripts/build-docs-reference.ts` | regenerates `docs/reference/`; `--check` fails when the pages are stale |

These are **advisory** — they fail today for known, harmless reasons, so read their output rather than their exit code:

- `bun scripts/audit-manual-names.ts` (manual names match what they teach)
- `bun scripts/audit-complete-scenes.ts`
- `bun scripts/audit-quest-counts.ts`

`audit-content.ts` does **not** check opponent drop tables. Check new `drops` item ids by hand.

## A location

1. Add `leaf("id", "ชื่อ", "description")` to the right array in `lib/world/data/world-map.ts`: `CITIES`, `VILLAGES`, `SECTS`, `ISLES`, `TERRAIN`, `CAVES`, `TEMPLES`, `MANSIONS`, `INNS`, `HOMES` or `MISC`. The array decides:
   - the default gathering nodes (`CATEGORY_RESOURCES`);
   - the world-hub category;
   - for cities and villages, chess and begging spots.
2. Pick the id **prefix** with care — it drives several systems:

| Prefix | Categories (practice, bonus) | Encounter zone | Rest | Auto-map spots |
| --- | --- | --- | --- | --- |
| `city_` | city | city (humans only) | inn 300 gold + roadside | rest, rumor |
| `village_` | village | city | roadside | — |
| `inn_` | inn | city | inn + roadside | rest, rumor |
| `home_` | home | city | roadside | — |
| `sect_` | sect + mountain (practice, balance/hard bonus) | sect | roadside | practice |
| `temple_`, `palace_` | temple (practice) | temple | free ½ + roadside | rest, practice |
| `villa_` | mansion | mansion | roadside | — |
| `isle_` | isle | isle | roadside | — |
| `mt_`, `peak_`, `cliff_`, `valley_` | mountain (practice, balance/hard bonus) | wild | roadside | practice |
| `cave_`, `grotto_` | cave (practice, yin/soft bonus) | wild | roadside | practice |
| `pool_`, `river_`, `sea_`, `lake_` | river (practice, internal bonus) | wild | roadside | practice |
| `forest_`, `grove_` | forest (practice, yang/external bonus) | wild | roadside | practice |
| `desert_`, `tribe_`, `market_` | frontier | frontier | roadside | — |
| anything else | none | wild | roadside | — |

   `leaf()` cannot set `categories`. To override the inferred set, add `categories: [...]` to the object by hand.
3. Add at least one road in `location-routes.ts` (below). A leaf with no road is attached to the lowest-degree leaf, with a console warning.
4. Optionally add the id to `LAYOUT_REGION` in `lib/world/data/regions.ts` to pull it toward a side of the world map, then rerun `bun scripts/build-world-coords.ts`. Its live region (rumors, road colours, music) is read from where it lands: the heartland near the capital, else its compass quarter.
5. Optional:
   - a painting (below);
   - a shop, hall or artisans keyed by `locationId`;
   - special gathering nodes (`RARE_SPOTS` in `world-map.ts`).
6. Run `bun scripts/build-docs-reference.ts` and check [reference/locations.md](reference/locations.md).

A location written straight into `SCENES` (like `jail`) is outside `ALL_LEAVES`, so `location-routes.ts` entries that name it are silently ignored.

## A road between two places

Append to `LOCATION_ROUTES` in `lib/world/data/location-routes.ts`:

```ts
{ a: "city_dali", b: "village_meihua", fromA: "ทางดอกเหมย", fromB: "ถนนสู่ต้าหลี่", hintA: "…", hintB: "…" },
```

- Both directions are generated: `route_<a>__to__<b>` and `route_<b>__to__<a>`, each using its own label.
- The road painting is chosen from the two endpoints' prefixes (coast, gorge, mountain, forest, lane, highway or country), the direction the road leaves by, and the region.
- **After adding a place or a road,** run `bun scripts/build-world-coords.ts` (the world-map spot that sets exit directions); `bun run test:routes` fails while it is stale.
- An auto-laid map shows at most **8 exits**, each on the edge facing its destination. With more roads, the worst-fitting one is listed only in the "อื่น ๆ" drawer.

## A painted map

Two kinds:

- **Auto layout** — the common case. Add the id to `AUTO_MAP_IDS` (`lib/world/data/auto-map-ids.ts`) and put the painting at `public/maps/<id>.webp`. `buildAutoMap` then places:
  - exits in 8 slots, sorted by destination id;
  - up to 10 NPCs, sorted by id;
  - shop / hall / rest / rumor / practice spots in fixed zones;
  - artisans in a row;
  - chess and begging on a street corner;
  - nature nodes at the edge.
- **Hand layout** — add a `LocationMapDef` to `LOCATION_MAPS` in `lib/world/data/location-maps.ts` with explicit `npcSpots`, `exits` and `spots` (see `home_player`, `city_capital`, `jail`). A hand entry wins over the auto layout.

**Collision.** Without footprints the ground is open everywhere.

- Check a map with `bun scripts/map-collision-tool.ts <id> [footprints.json] [overlay.png]`. It prints the marker coordinates, checks every NPC, exit and service is reachable, and can draw an overlay.
- Painted maps take their shapes from `lib/stage/world-footprints-data.ts`.

  `bun scripts/build-map-footprints.ts <dir>` rewrites that whole file from `<dir>/<id>.json`. The per-map JSON sources are **not** in the repo, so a run with a partial folder drops every map it does not contain. Edit the data file directly for small fixes.
- Hand maps take their shapes from `lib/stage/world-navigation.ts`.

Then run `bun run test:navigation`: every painted map must keep its spawn open and every marker reachable.

## An NPC

1. Append an `NpcDef` to the regional file (`npcs/<region>.ts` or `npcs/sects/<file>.ts`):

```ts
{
  id: "city_capital_physician_lin",
  name: "หมอหลิน",
  description: "…",
  locationIds: ["city_capital"],
  dialogSceneId: "npc_city_capital_physician_lin_talk", // enables 💬
  sparOpponentId: "spar_…",                             // enables ⚔ (non-fatal)
  sparFameReward: 5,
  defenseTier: 1,                                        // 0–4, steal / assassinate / kidnap difficulty
  stealLoot: [{ itemId: "herb", weight: 5 }],            // enables ขโมย
  tags: ["healer"],
  visibleIf: { t: "flag", flag: "…" },                   // optional
},
```

2. **Talk dialog.** Write the dialog scene (convention `npc_<npcId>_talk`). Give it at least one choice that returns to the location (`next` = the location id), so the player can leave.
3. **Spar.** Add an opponent (see [An opponent](#an-opponent)). Its id convention is `spar_<sect>_<name>`.
4. **Quests** attach through the quest's `giverNpcId` / `turnInNpcId`. `NpcDef.questIds` is informational only; no code reads it.
5. **Art** is resolved by id:
   - Put a 256×256 portrait at `public/npcs/<id>.png` and a 192×192 body at `public/npcs/body/<id>.png`.
   - Add the id to `npc-portrait-ids.ts` and `npc-body-ids.ts`.
   - Or paint them on a flat light background and run `bun scripts/import-npc-art.ts --from <dir>` (`<dir>/body/<id>.png`, `<dir>/portrait/<id>.png`): it cuts the figure out, fits it into the 192 px frame, sizes the portrait and registers both ids.
   - Run `bun scripts/build-npc-sprites.ts`, which writes `public/npcs/pixel/`, `public/npcs/pixel-battle/` and `npc-pixel-ids.ts`.

   Without art, the NPC uses an archetype costume chosen by `npcCharacterId` (`lib/characters/catalog.ts`) from its id.

   **To make the NPC walk and wander** (a full animation sheet instead of the single pose), add its id to `ANIMATED_NPC_IDS` in `lib/characters/npc-sheets.ts` and run `bun scripts/build-npc-sheets.ts`. It needs the body painting. Commit the two PNGs in `public/art/characters/npc/`; `bun run test:npcs` checks them.
6. **Map placement.** An auto map places up to 10 NPCs per location. More spill into the "อื่น ๆ" drawer.

## A dialog scene

```ts
{
  kind: "dialog",
  id: "qs_qc_example_offer",
  lines: [
    { t: "dialogue", speaker: "หมอหลิน", text: "…" },
    { t: "narration", text: "…" },
  ],
  choices: [
    { text: "รับปาก", effects: [{ t: "startQuest", questId: "qc_example" }], next: "city_capital" },
    { text: "ขอคิดดูก่อน", next: "city_capital" },
  ],
}
```

- `next` is required on every choice. `effects` run before the move.
- **A dialog with `next` and no `choices` skips its lines** (it auto-advances). For narration that should be read, use a single confirmation choice: `{ text: "ก้าวต่อไป", next: "…" }`.
- A dialog with neither choices nor `next` is **terminal**: it shows "ปิด", which returns to the last location for free.
- `visibleIf` hides a choice. When every choice is hidden, the stage shows an escape button.
- A choice that costs travel (for example, from a location onto a road) is refused as a whole — effects included — when the hero lacks stamina.
- **Speaker.** The portrait and heading come from the NPC whose `dialogSceneId` is this scene, else from the first `dialogue` line whose `speaker` equals an NPC's `name` exactly.
  - When that NPC stands at the current location, the dialog plays over the live map.
  - Otherwise it plays over the place's painting.
- Scenes that belong to a quest follow the `qs_<questId>_<beat>` naming (see below).

## A quest

1. Append a `QuestDef` to the regional quest file. Id prefixes by convention: `qc_` city, `qv_` village, `qw_` wilderness, `qe_` evil, `qst_` sect and other.

```ts
{
  id: "qc_example",
  type: "side",                  // omitted = "main"; only first_steps is main
  name: "…",
  description: "…",
  briefSummary: "…",             // shown on the offer card and the log
  giverNpcId: "city_capital_physician_lin",
  turnInNpcId: undefined,        // defaults to the giver
  prereqs: { t: "trait", trait: "evil", max: 10 },
  stages: [
    { id: "gather", description: "เก็บสมุนไพร 5 ต้น",
      autoAdvance: { t: "hasItem", itemId: "herb", count: 5 } },
    { id: "return", description: "นำสมุนไพรกลับไปให้หมอหลิน" },
  ],
  rewards: [{ t: "gold", amount: 80 }, { t: "wExp", amount: 20 }],
}
```

2. **Stages** — pick one way for each middle stage to move on:

| Stage kind | How |
| --- | --- |
| item | `autoAdvance: { t: "hasItem", itemId, count }` — counts what the hero **holds now** (items carried before accepting count). The items are taken on hand-in |
| kill | `autoAdvance: { t: "defeatedOpponent", opponentId, count }` — counts kills **since accepting**. The foe must be able to appear: in `FIGHT_EVENTS` for a zone the player can reach, or through a scene's `triggerBattle` |
| visit | `autoAdvance: { t: "visitedLocation", locationId }` |
| bad deed | `autoAdvance: { t: "stoleFromNpc" / "kidnappedNpc" / "assassinatedNpc", npcId }` — naming the NPC also makes the kidnap / assassinate buttons appear on them |
| objective | `objective: { spots: [{ locationId, label, text?, npcId?, sceneId? }], hours? }` — 🔍 spots on the map (or actions on a person's card) that the player uses in person. See [world-engine.md](world-engine.md#quest-objectives) |
| dialog | a scene choice with `{ t: "advanceQuest", questId }` |

3. **The last stage** is the "return to the giver" beat, with no `autoAdvance`. The NPC card shows ส่งมอบภารกิจ when the quest is on its last stage and the NPC is the turn-in person.
4. **Optional dialogs:**
   - **`qs_<questId>_offer`** — the NPC card opens it right after accepting (the briefing).
   - **`qs_<questId>_complete`** — opened on hand-in. It should run `{ t: "finishQuest", questId, success: true }`; if it doesn't, the card calls `finishQuestNow` as a safety net. Use `takeItem` in this scene when you want explicit item hand-over.
5. **Rewards** (`QuestReward`):
   - `gold`, `item`, `wExp`, `skillExp`
   - `trait`, `npcRelationship`
   - `learnSkill`, `learnArt` — handed over as the move's scroll (`scroll_skill_<id>` / `scroll_art_<id>`, generated for every move and art); the UI calls it 📜 วิชาลึกลับ, so don't name the move in the quest's name or summary
   - `joinSect`, `sectPoints`, `leaveSect`, `resignSect`, `betraySect`
6. **Sect quests.** Set `sectId` and the quest moves from the NPC card to the sect menu.
   - It repeats 30 days after each completion.
   - `isArtQuest: true` makes it a one-shot.
   - `minSectRank` gates it by rank (lower number = higher rank).
   - Sect quests usually have no `qs_` scenes and are handed in from the sect menu.
7. **Stage text** should name the person or place ("นำสมุนไพรกลับไปให้หมอหลิน"). The quest guide falls back to names it finds in the text when a stage has no machine-readable target.
8. Run `bun run test:quests`. `audit-quest-completion.ts` fails on:
   - a quest nobody can start;
   - a middle stage with no `autoAdvance`, no objective and too few reachable `advanceQuest` beats;
   - a flag stage that nothing sets;
   - an item nobody can obtain.

   `test-quest-turnins.ts` plays every item, kill and objective quest through the real store.

## An item

```ts
{ id: "herb", name: "สมุนไพร", description: "…", category: "herb", price: 10,
  use: { t: "heal", hp: 20 } },
```

- **`category`** — one of 11: material, herb, venom, potion, food, book, manual, craft, valuable, quest, misc. It sets the bag filter and which shops buy the item.
- **`price`** — the shop price. Sell-back is the price × the shop's multiplier. Quest items use `category: "quest"` with `price: 0`, so they cannot be sold.
- **`use`** — one of:
  - `{ t: "heal", hp?, mp? }`;
  - `{ t: "trainSkill", skill, xp }`;
  - `{ t: "manualLearnSkill" | "manualLearnArt", … }`, for manuals with the `man_` prefix — unaffiliated skills only; sect skills come only from quests. The stat gate by tier is 0 / 10 / 15 / 20 / 30.
- **Obtainable.** Make the item reachable: a shop, a node yield, a drop table, steal loot, a recipe, `giveItem` or a quest reward. `test:quests` computes what can be obtained and fails quests that need an unobtainable item.

## A shop or a sect-hall offer

- **Shops** (`shops.ts`) — one `ShopDef` per location:
  - `{ id, locationId, label, inventory: itemIds, acceptsCategories?, sellMultiplier }`;
  - cities use `COMMON_CITY_SHOP` (50 % sell-back), inns `INN_SHOP` (40 %), villages `VILLAGE_SHOP` (35 %);
  - a second entry for the same location replaces the first.
- **City halls** (`sect-halls.ts`) — `{ locationId, label, description, offers: [{ id, kind: "skill" | "art", price }] }`.
  - Only unaffiliated (`sc: "ยุทธจักร"`) tier 0–1 styles belong here: skills 200 / 800 gold, arts 500 / 2000.
  - Sect styles are earned by rank inside the sect.

## A recipe or an artisan

- **Recipe** (`recipes.ts`): `{ id, name, inputs, output, skill, requiredMastery?, usesDropCheck?, basic? }`.
  - `basic: true` puts it on every artisan of that profession for 80 gold.
  - A specialty recipe must be assigned: a row in `CITY_SPECIALTIES` (`{ city, prof, recipeId, price }`) or an artisan's `recipes`.
  - Only the six craft professions (forge, alchemy, tailoring, chef, jewelry, accessory) have a crafting screen. A recipe for another life skill (mining, drawing…) can be defined, but no UI crafts it.
- **Artisan** (`artisans.ts`):
  - A new city gets all six artisans from one row in `CITIES_WITH_FULL_ROSTER`.
  - A single artisan in a village or sect goes in `SINGLE_PROFESSION_ARTISANS`.
  - Gear offers come from `PROF_BASIC_EQUIPMENT`, `CITY_EQUIPMENT_SPECIALTIES` and `EQUIPMENT_PRICE`.

## A gathering node

1. Append a `ResourceDef` to `resources.ts`:
   - `{ id, name, skill, level: 1–5, staminaCost, yields: [{ itemId, weight }], goldYield?, failureExtraStamina?, opponentIds?, hint? }`;
   - hunting nodes set `opponentIds`, a pool of `hunt_*` opponents fought 1v1.
2. Place it. A node that is not placed is never seen (six exist today). Three ways:
   - a category default in `CATEGORY_RESOURCES` (`world-map.ts`);
   - a `RARE_SPOTS` entry, which replaces a location's defaults;
   - the social loops for cities and villages.

   Put `visibleIf` on the `ResourceNodeRef` to gate it, as begging does.

## An opponent

```ts
{ id: "wild_wolf", name: "หมาป่า", ti: 1, category: "beast", drops: DROPS_T1,
  pack: { opponentId: "wild_dog", count: 1 },
  build: () => build("หมาป่า", 1, { stats: { AGI: 5, DEX: 4 }, skillIds: ["…"] }) },
```

- **`ti`** (0–4) sets the stats baseline in `build()`, the loot count (2 / 3 / 4 picks) and the encounter tier weight.
- **`category`** (`human` / `beast` / `supernatural`) sets which zones it appears in and how it looks. A beast picks a creature-atlas frame by keywords in its id (tiger, bear, boar, snake, chicken / pheasant, eagle / bird, bat, rabbit / hare, squirrel, cat / lynx, centipede / spider / scorpion; else wolf). A person without NPC art is drawn as one of the 22 painted enemy types (`foeCharacterFor` in `battle-looks.ts`: thief, bandit, bandit chief, brawler, archer, pirate, marauder, assassin ×2, poisoner, swordsman, swordswoman, ghost, cultist, master, monk, constable, guard, enforcer, strategist, brute, empress), read from keywords in its id.
- **`drops`** — per-tier defaults `DROPS_T0`…`DROPS_T4`, or a custom list. Check the item ids yourself.
- **`pack`** adds weaker companions, only when the fight comes from an accepted encounter. It is one `{ opponentId, count }` or a list for a mixed gang (`[{ opponentId: "bandit_lieutenant", count: 1 }, { opponentId: "bandit_archer", count: 2 }]`). The first kind gains +1 / +2 as the hero grows stronger; the total is capped at 6. Members must not be stronger than the leader (`test:grid-store` checks).
- **`look`** (optional) makes a variant from an existing sprite. `{ npc: "evil_capital_blackmarket_zhou" }` makes the foe that NPC, drawn with the NPC's own sheet (the villain bosses do this). Otherwise: `{ sheet: "foe_pirate" }` picks an enemy type (an older hero / archetype id such as `"m2"` maps onto the nearest type), `{ frame: 0 }` a creature-atlas cell, `tint: 0xc6e6ff` multiplies a colour over it and `size: 1.25` draws it larger (0.6–1.6). Bosses use a larger size so they stand out from their gang.
- **Random encounters.** Add `{ id: "fight_…", weight: TIER_SPAWN_WEIGHT[ti], opponentId }` to `FIGHT_EVENTS` in `random-events.ts`. The weight is replaced by the power-scaled tier weight at runtime.
- **Other ways to meet it:**
  - a scene `triggerBattle` (add `nonFatal: true` for a friendly fight);
  - an NPC's `sparOpponentId`;
  - a hunting node's `opponentIds`.
- **Scaling.** Every opponent built with the shared `build()` helper is scaled by the hero's power before each battle. A hand-written build (like the capital apprentice) is not.

## Move skills and inner arts

1. **Add the entry.** Append a skill to `SKILLS` in `lib/game/data/skills.ts`, or an art to `ARTS` in `lib/game/data/arts.ts`. Keep the short field names. The fields are listed in [combat.md](combat.md#data-tables).
   - `sc` must be a name in `SECT_ORDER`, or `ยุทธจักร` for unaffiliated.
   - `ti` 0–4 (arts may use 5).
   - A skill's `st` must sum to **10 / 15 / 20 / 25 / 30** for tiers 0–4.
   - `types` feeds the type-conflict system and the practice-place bonus.
   - `hits: n` makes a multi-strike skill; enemy effects apply on every hit.
2. **Sort.** Run `bun scripts/sort-by-sect.ts` to keep both tables sorted by sect, then tier. It is idempotent.
3. **Stat budgets.** Run `bun scripts/normalize-t3-stats.ts`. It **rewrites** `skills.ts` toward the budgets (single-line entries only), so review the diff.
4. **Icon.** Add `public/icons/skills/<id>.png` or `public/icons/arts/<id>.png`. Otherwise it gets a generic glyph.
5. **Battle range.** Check it with `bun run test:grid-skills`. The profile is derived from weapon family, attack type, tier and hits; add a `SKILL_GRID_OVERRIDES` entry in `lib/game/grid/skill-grid.ts` for special shapes.
6. **Make it learnable.** A **sect** skill or art has exactly one source, its lineage quest or saga (below); nothing else may teach it. An unaffiliated (ยุทธจักร) one uses one or more of:
   - a city hall offer (tier 0–1 only);
   - a manual item (`man_…` with `manualLearnSkill` / `manualLearnArt`; check with `bun scripts/audit-manual-names.ts`);
   - a quest reward `learnSkill` / `learnArt` (arrives as its scroll);
   - an opponent's build, which shows it in battle only.

   **A sect skill or art needs exactly one quest source, and no other** (`bun run test:story` fails otherwise): a `LineageSpec` for T0–T3, or a whole `StoryArcSpec` saga for T4, in `lib/world/data/story/<sect>.ts`. See [story-writing.md](story-writing.md).
7. **Check it.** Run `bun run typecheck` and `bun run test:grid-skills`, then regenerate the reference ([reference/martial-arts.md](reference/martial-arts.md)).

New **effect** kinds (a new `se` / `ee` / passive / art-active type) are engine changes: see [combat.md](combat.md#changing-combat-safely).

## Dialogue lines

Every dialog plays one line per beat, with its key words coloured. Write short lines, and mark extra key words with `**…**`. See [story-writing.md → Voice](story-writing.md#voice).

## Equipment

Append to `EQUIPMENT` in `lib/game/data/equipment.ts`:

- `ty` is the slot: W, A, H, B, BR, R or C.
- Put the boosts in `atkb`, `pdb`, `idb`, `hpb`, `mpb` (required) and the optional `pab`, `iab`, `spdb`, `evab`, `accb`, `crib`, `resb`.
- `st` is ignored; keep `{}`.
- `eff` is an equipment effect or `null`.
- `instrument: true` marks a music weapon.
- Give it an icon in `EQUIPMENT_ICONS` (`lib/world/data/item-icons.ts`); a new item likewise needs one in `ITEM_ICONS`. `test:assets` fails otherwise ([assets.md](assets.md#item-icons)).

Sell it through artisans (`equipmentOfferedBy`) or give it as a quest item.

## A joinable sect

This touches many files. In order:

1. **Types and names.**
   - Extend the `SectId` union in `lib/world/types.ts`. TypeScript then demands the `SECT_MEMBERSHIPS` entry.
   - Add the display name to `SECT_ORDER` in `lib/game/data/sects.ts`.
2. **Grounds.** Add the location (`sect_<id>` leaf in `SECTS`), a road, a region and a painting.
3. **Membership.** Add a `SectMembershipDef` to `SECT_MEMBERSHIPS` in `lib/world/data/sect-memberships.ts`:
   - `name`, `hallLocationId`, `registrarNpcId`;
   - `startRank` / `topRank` (9 → 1, 5 → 1 or 3 → 1) and `rankUpCost(rank)`;
   - `questCooldownDays` (30 elsewhere);
   - `joinRequirements`. The quest reward does **not** check it; put the real gate in the intro quest's `prereqs`.
4. **Files.** Create the three mirror files and add one import + one spread line to each barrel:
   - `lib/world/data/npcs/sects/<file>.ts` (barrel: `npcs/sects-temples.ts`);
   - `lib/world/data/quests/sects/<file>.ts` (barrel: `quests/sects-temples.ts`);
   - `lib/world/data/scenes-content/sects/<file>.ts` (barrel: `scenes-content/sects-temples.ts`).
5. **People.** The registrar and other residents, each with a spar opponent (`spar_<sect>_<name>`).
6. **Intro quest.** Given by the registrar, with **no** `sectId`:
   - `prereqs` includes `{ t: "not", of: { t: "anySectMember" } }` and the real gates;
   - stages for the entry task;
   - rewards `joinSect` + `sectPoints`;
   - optional `qs_` offer / complete scenes that collect a fee with `addGold` (a negative amount) and `takeItem`.
7. **Sect quests.** Repeatable quests and one art quest, all with `sectId`.
8. **Betrayal.**
   - A `hunter_<sectId>` opponent (tier 4).
   - A redemption quest `qst_<sectId>_redemption`, gated by `{ t: "sectStatus", sectId, status: "betrayed" }`, whose rewards include `resignSect`.
9. **Lineage and sagas.** A lineage quest for each of the sect's T0–T3 skills and arts, and a saga for each T4, in `lib/world/data/story/<sect>.ts` (registered in `story/index.ts`). See [story-writing.md](story-writing.md).
10. **Optional.** Add the chief to the Liveness roster.
11. **Check.** Run `bun scripts/audit-content.ts`, `bun run test:quests`, `bun run test:story`, `bun run typecheck`, and regenerate the reference ([reference/sects.md](reference/sects.md)).

## Places: people and activities

New life for a village, town or home goes in a group file under `lib/world/data/places/` (one `PlaceContent`; add a new group to `places/index.ts`). Ids: NPCs `<place>_<role>_<name>`, activities `act_<place>_<slug>`.

- **An NPC** also takes `look: { body, wander }` (body `m1`–`m4`, `f1`–`f4`, `elder`, `monk`, `merchant`, `bandit`…; only m/f bodies can wander) and `likes` / `dislikes` for gifts. On an auto map it gets an `NPC_SLOTS` spot; on a hand map add an `npcSpots` entry.
- **An activity** is an `ActivityDef` with `place` (see [world-engine.md](world-engine.md#living-places)). Hand maps need `place.spot`.
- **A skill quest** follows the rarity table: T0 a chore, T1 `statAtLeast 10`, T2 `statAtLeast 15` + `npcRelationship ≥ 5`, T3 `statAtLeast 25` + `npcRelationship ≥ 15` + an earlier quest of the giver. Never make a teacher an assassination or kidnap target.
- Run `bun run test:places` as well as the usual checks.

## Named NPCs and rumors

- **Simulated NPC.** Add an entry to `NAMED_NPC_DEFAULTS` in `lib/world/data/named-npcs.ts`, with `power`, `age`, `sect`, `sectRank`, goals, rivals and allies. Its id must exist in the NPC registry. Existing saves pick it up on their next weekly tick.
- **Rumor templates** live in `rumor-templates.ts` and **lore** in `lore-rumors.ts`. Use only the documented tokens; `bun run test:rumors` fails on stray `{tokens}`.

Details: [liveness.md](liveness.md#changing-it-safely).

## Style rules

- **Language.** Thai for everything the player reads: names, descriptions, dialog, stage text. English for ids and code.
- **Field names.**
  - Combat tables (`lib/game/data/`) keep the short field names (`n`, `sc`, `ti`, `bp`, `st`, `se`, `ee`…), matching `demo.html`.
  - World tables use readable names (`name`, `description`, `price`).
- **Ids** are lowercase snake case with the conventional prefixes:
  - places: `city_`, `sect_`, `cave_`…;
  - quests: `qc_`, `qst_`…;
  - opponents: `spar_`, `hunt_`, `hunter_`, `law_`, `elite_`;
  - manuals: `man_`.
- **Never rename a persisted id** (a scene, item, quest or skill in live saves) without expecting repair to drop it from old saves.
- **Barrel files.** Do not run `scripts/split-sects-file.ts` or `scripts/append-templated-quests.ts`. They were one-off migrations; rerunning them empties the sect barrels or duplicates 20 quests.
