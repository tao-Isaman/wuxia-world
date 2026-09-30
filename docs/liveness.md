# Liveness Layer — NPC simulation and rumors

A background simulation that makes the jianghu move while the hero plays. Twenty named masters age, train, climb their sects, take revenge, go into seclusion and die. Each of these events becomes a **rumor** that the hero can overhear at inns. The hero's own deeds echo back as rumors too.

This page describes the Liveness Layer **as built**. The original requirement and the implementation plan are kept as history:

- [specs/liveness-spec.md](specs/liveness-spec.md) — the requirement (Thai)
- [specs/liveness-plan.md](specs/liveness-plan.md) — the plan and its decisions

The code differs from both in many places; [Spec versus code](#spec-versus-code) lists every difference.

## Contents

- [Files](#files)
- [When it runs](#when-it-runs)
- [Saved state](#saved-state)
- [The named NPCs](#the-named-npcs)
- [The weekly NPC tick](#the-weekly-npc-tick)
- [What a year looks like](#what-a-year-looks-like)
- [Quest givers who die](#quest-givers-who-die)
- [Rumors](#rumors)
- [Player echoes](#player-echoes)
- [Where the hero hears rumors](#where-the-hero-hears-rumors)
- [Hooks for content](#hooks-for-content)
- [Tests](#tests)
- [Spec versus code](#spec-versus-code)
- [Known gaps](#known-gaps)
- [Changing it safely](#changing-it-safely)

## Files

| File | Role |
| --- | --- |
| `lib/world/npc-tick.ts` | `tickAllNamedNpcs` — the weekly simulation step |
| `lib/world/rumor-engine.ts` | making rumors (`generateNpcEventEcho`, `generatePlayerEcho`, `generateWarning`, `seedLoreRumors`), choosing them (`selectRumorsForScene`) and housekeeping (`maintainRumors`) |
| `lib/world/data/named-npcs.ts` | `NAMED_NPC_DEFAULTS` — the 20 simulated NPCs and their starting state |
| `lib/world/data/rumor-templates.ts` | text templates for NPC events, player echoes and warnings; `renderTemplate`; lifespans |
| `lib/world/data/lore-rumors.ts` | `LORE_RUMORS` — 30 hand-written rumors that never expire |
| `lib/world/data/regions.ts` | `LOCATION_REGION`, `regionOf`, `CHANNEL_ADMITS`, `REGION_NEIGHBORS` (unused) |
| `lib/world/types.ts` | `NpcExtState`, `NpcGoal`, `NpcEventKind`, `NpcSimStatus`, `Rumor`, `RumorSummary`, `RumorSeenEntry`, `Region`, `RumorChannel`, `RumorTruth`, `RumorSource` |
| `store/world-store.ts` | calls the engines from `advanceTime`; `failQuestsForDeadGivers`; `recordRumorHeard`; the five player-echo call sites |
| `components/world/popups/rumor-popup.tsx` | the rumor list |
| `components/world/rumor-listen-button.tsx` | `resolveRumorChannel` + `RumorListenSection` (a listen button for places without a rumor spot) |
| `components/world/rumor-banner.tsx` | a passive entry banner (effectively never shown, see [Known gaps](#known-gaps)) |
| `components/world/npc-status-badge.tsx` | the dead / secluded / missing chip next to an NPC's name |

None of these engine modules is in the `lib/world/index.ts` barrel; import them by path.

## When it runs

Every store action that spends time goes through `advanceTime` in `store/world-store.ts`. After the clock moves and wanted marks decay, it runs:

1. `failQuestsForDeadGivers(state, () => tickAllNamedNpcs(state, { currentDay: state.day }))` — the NPC tick, wrapped so that quests whose giver just died are failed (see [Quest givers who die](#quest-givers-who-die)).
2. `maintainRumors(state, state.day)` — expire, archive and cap rumors.

This happens once per `advanceTime` call, not once per day passed. Resting a whole day, practising for 6 ชั่วยาม and a single walk tick all count the same.

Lore rumors are seeded by `seedLoreRumors` in `startNewGame`, and again in the persist `merge` for every loaded save that has a game. Seeding is idempotent.

`validateAndRepair` does not look at any Liveness field. The rumor engine allocates missing arrays itself (`ensureRumorArrays`), and `npcExt` is filled lazily on the first tick.

## Saved state

Five fields on `WorldStateData`, all added by save v18 (see [save-format.md](save-format.md)):

| Field | Holds |
| --- | --- |
| `npcExt: Record<string, NpcExtState>` | simulation state per named NPC; empty until the first tick |
| `rumorPool: Rumor[]` | live rumors |
| `rumorArchive: RumorSummary[]` | expired rumors compressed to `{ id, about, truth, expiredDay }`, kept for one year so `heardRumorAbout` still works |
| `rumorSeenLog: RumorSeenEntry[]` | the rumors the hero has listened to (`rumorId`, `dayHeard`, `location`), newest 50 |
| `lastNpcTickDay: number` | the day the simulation last ran up to |

`NpcExtState` per NPC:

| Field | Meaning |
| --- | --- |
| `power` | 0–100 martial strength |
| `age` | years |
| `status` | `alive` · `dead` · `secluded` · `missing` (`missing` is never set) |
| `currentLocation`, `homeLocation` | location ids (the NPC never moves) |
| `sect`, `sectRank` | `SectId` or `null`; rank 0 = unaffiliated … 10 = grandmaster |
| `goals` | 1–3 active `NpcGoal`s |
| `rivals`, `allies` | NPC ids |
| `lastTickDay` | the last simulated day |
| `eventHistory` | the last 10 events, newest first |

A `Rumor`:

| Field | Meaning |
| --- | --- |
| `id` | `rumor_event_<npc>_<kind>_<day>_<rand>`, `rumor_player_<action>_<day>_<rand>`, `rumor_warn_<kind>_<day>_<rand>` or `lore_<suffix>` |
| `text` | the rendered Thai sentence |
| `source` | `npc_event` · `player_echo` · `lore` · `warning` |
| `createdDay`, `expiresDay` | lifetime; lore expires at `Number.MAX_SAFE_INTEGER` |
| `truth` | `true` · `distorted` · `false` — never shown to the player |
| `region` | where it can be heard |
| `channel` | `inn` · `market` · `sect_internal` · `wilderness` |
| `about` | the NPC, location or sect it concerns (`null` when none) |
| `refersToEvent` | `{ eventKind, day, npcId }` for NPC events |
| `leadsTo` | a lead for treasure lore (never read by code) |
| `prerequisites` | conditions that must all pass for the rumor to be offered |
| `weight` | priority; higher is picked first |

## The named NPCs

`NAMED_NPC_DEFAULTS` holds 20 NPCs: the 15 sect chiefs (rank 10) and five seconds. All of them exist in the NPC registry; no other NPC is simulated. Ages 50–76, power 65–96. Every NPC stays at its sect hall.

| NPC id | Name | Sect | Rank | Power | Age | Region | Starting goals |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sect_shaolin_abbot_huiyuan` | เจ้าอาวาสฮุยหยวน | shaolin | 10 | 95 | 76 | south | master_art, seek_wisdom |
| `sect_shaolin_vice_abbot_luohan` | รองเจ้าอาวาสลั่วฮั่น | shaolin | 9 | 78 | 58 | south | climb_sect, master_art |
| `sect_wudang_master_qingxu` | อาจารย์ชิงซวี่ | wudang | 10 | 94 | 72 | north | master_art |
| `sect_wudang_vice_master_xuancheng` | รองอาจารย์เสวียนเฉิง | wudang | 9 | 75 | 54 | north | climb_sect, master_art |
| `sect_huashan_master_yiqing` | อาจารย์ใหญ่อี้ชิง | huashan | 10 | 82 | 62 | west | master_art, find_treasure |
| `sect_quanzhen_master_chongyang` | อาจารย์ใหญ่ฉงหยาง | quanzhen | 10 | 88 | 70 | north | master_art, seek_wisdom |
| `sect_quanzhen_sword_elder_qiuchuji` | อาจารย์ดาบชิวฉู่จี้ | quanzhen | 7 | 65 | 52 | north | master_art, climb_sect |
| `sect_emei_abbess_jingchan` | ท่านนิ้วห้วนจิงฉาน | emei | 10 | 90 | 68 | south | master_art |
| `sect_emei_vice_abbess_huimiao` | รองท่านนิ้วฮุยเหมียว | emei | 9 | 73 | 50 | south | climb_sect, master_art |
| `sect_gumu_mystery_woman` | หญิงปริศนาในสุสาน | gumu | 10 | 96 | 65 | west | find_treasure, seek_wisdom |
| `sect_beggars_chief_hongtian` | หัวหน้าหงเทียน | beggars | 10 | 92 | 64 | jianghu_wild | master_art, seek_wisdom |
| `sect_jinyiwei_leader_zhao` | ผู้บัญชาการจ้าวฝู่ | jinyiwei | 10 | 91 | 55 | east | avenge (Dongfang), master_art |
| `sect_sunmoon_chief_dongfang` | อาจารย์ใหญ่หยินอวี้ | sunmoon | 10 | 93 | 60 | east | master_art, avenge (Huiyuan) |
| `sect_sunmoon_vice_renwoxing` | รองเจ้าสำนักเหรินหวัวสิง | sunmoon | 9 | 80 | 52 | east | climb_sect, avenge (Luohan) |
| `sect_tang_chief_tangmen` | เจ้าสำนักถังเหมิน | tang | 10 | 89 | 67 | east | master_art, find_treasure |
| `sect_xiaoyao_master_yunxiao` | ปรมาจารย์ยุนเซียว | xiaoyao | 10 | 87 | 66 | east | master_art, find_treasure |
| `sect_songshan_master_zuolengchan` | อาจารย์ใหญ่จั่วเหลิงฉาน | songshan | 10 | 84 | 64 | north | climb_sect, master_art |
| `sect_taishan_master_tianmen` | เจ้าสำนักเทียนเหมินเต้าเหริน | taishan | 10 | 80 | 67 | north | master_art, seek_wisdom |
| `sect_hengshan_south_master_modaxiansheng` | อาจารย์ใหญ่โม่ต้า | hengshan_south | 10 | 81 | 65 | south | master_art, seek_wisdom |
| `sect_hengshan_north_abbess_dingyi` | ภิกษุณีติ่งอี้ | hengshan_north | 10 | 79 | 63 | south | master_art |

Rivals and allies are authored in the same file. Rivals feed `avenge` goals; allies make `marry` events possible. No named NPC lives in the **heartland** region.

## The weekly NPC tick

`tickAllNamedNpcs(state, { currentDay })`:

1. If fewer than 7 days have passed since `lastNpcTickDay`, it does nothing.
2. It adds every `NAMED_NPC_DEFAULTS` entry missing from `npcExt` (a deep copy), so the first real tick seeds all 20 and a newly authored NPC joins old saves on their next tick.
3. It runs `min(floor(Δ / 7), 4)` batches, at `simDay = lastNpcTickDay + 7 × batch`. Batches beyond four only age the NPCs, with one `console.warn("[npc-tick] N excess batches collapsed (aging only)")`.
4. It sets `lastNpcTickDay = currentDay`. The `Δ mod 7` leftover days are dropped, so after a 10-day rest the next tick waits another 7 days.

Constants at the top of `npc-tick.ts`:

| Constant | Value |
| --- | --- |
| `TICK_INTERVAL_DAYS` | 7 |
| `MAX_TICKS_PER_CALL` | 4 (28 days) |
| `EVENT_HISTORY_LIMIT` | 10 |
| `NATURAL_DEATH_OVER_70` / `_OVER_85` | 0.05 / 0.15 per tick |
| `RANDOM_EVENT_CHANCE` | 0.08 per tick |
| `BETRAY_SECT_CHANCE` | 0.01 (inner roll of a `betray_sect` event) |
| `GOAL_REROLL_CHANCE` | 0.5 |
| `POWER_CAP` | 100 |
| goal progress | +1 to +3 per tick |

### One NPC, one batch

Only NPCs whose status is `alive` tick. The steps run in this order:

1. **Age** — +1 year only when `simDay % 365 === 0`. Batches fall on a 7-day grid, so this is rarely true (see [Known gaps](#known-gaps)).
2. **Natural death** — above age 85: 15 %; above 70: 5 %. Death fires `death_natural`.
3. **Power growth**, per goal:
   - `master_art`: a 1–5 % chance of +5 to +15.
   - `climb_sect`: +0 to +2.
   - `avenge`: +0 to +1.

   Power is capped at 100.
4. **Goal progress** — each goal gains +1 to +3; a goal that reaches its threshold completes (table below).
5. **Random event** — if still alive, an 8 % chance of one event (table below).

### Goals

| Goal | Completes when progress reaches | On completion |
| --- | --- | --- |
| `master_art` | its threshold (100 for rerolled goals) | power +10; event `master_art` |
| `climb_sect` | threshold (80 rerolled) | if in a sect, `sectRank = min(10, rank + 1)`; event `sect_promotion`. `targetRank` is ignored |
| `avenge` | threshold (60 rerolled) | if the target is alive, the target is set **dead** (no fight is simulated), the avenger gains +5 power, and `death_combat` is fired about the victim |
| `find_treasure` | threshold (50 rerolled) | power +5; event `found_treasure`. No item is created |
| `seek_wisdom` | threshold (70 rerolled) | status becomes **secluded** for good; event `secluded` |

A completed goal is removed. With 50 % chance a replacement is drawn from `GOAL_POOL`:

| Kind | Rerolled goal |
| --- | --- |
| `master_art` | art `kuyt` |
| `climb_sect` | target rank 5; needs a sect |
| `avenge` | a random rival; needs rivals |
| `find_treasure` | `mithril_ore` at `cave_heimu`, a location that does not exist |
| `seek_wisdom` | at `sect_wudang` |

### Random events

When the 8 % roll hits, one event is picked uniformly from those the NPC is eligible for:

| Event | Eligible when | Effect |
| --- | --- | --- |
| `travel` | always | rumor only; the NPC does not move |
| `marry` | another living named NPC lists this NPC in `allies` | rumor only; can repeat |
| `take_disciple` | in a sect, rank ≥ 7, age > 50 | rumor only; no NPC is created |
| `betray_sect` | in a sect | a further 1 % roll clears `sect` and sets `sectRank` to 0 |

`sect_demotion` and `defeated_by_player` are declared event kinds with rumor templates, but nothing fires them.

Every event goes through `fireEvent`: it is pushed onto `eventHistory` and handed to `generateNpcEventEcho` (see [Rumors](#rumors)), at the event's location or the NPC's current location.

## What a year looks like

These are approximate averages from a 300-run simulation made during the docs audit, playing day by day from day 1 to day 366:

| Event | Per year |
| --- | --- |
| travel | ~20 |
| take_disciple | ~18 |
| master_art | ~16.5 |
| marry | ~7.7 |
| sect_promotion | ~5.6 |
| secluded | ~5.2 |
| found_treasure | ~3.6 |
| death_combat | ~2.2 |
| death_natural | ~1.8 |
| betray_sect | ~0.2 |

About 11 of the 20 NPCs are still alive at day 366:

- Almost certain to die in year one:
  - Luohan and Dongfang (100 %) — killed by the `avenge` goals of Renwoxing and Zhao.
  - Qingxu (92 %) and Huiyuan (89 %) — past 70.
- Others: Yiqing 11 %, Zuolengchan 5 %.

On average an NPC gains only 0.54 years of age in the first year.

## Quest givers who die

`failQuestsForDeadGivers` records which named NPCs were alive before the tick. After the tick, every **active** quest whose `giverNpcId` newly died is set to `failed`, with an action-log line and a warning toast (ผู้ให้ภารกิจ … เสียชีวิต — ภารกิจ '…' หยุดลง).

123 quests have one of the 15 simulated chiefs as their giver, so this matters in real play. The limits:

- Only the named 20 can die. Generic givers are never simulated.
- A dead NPC stays on the map and keeps offering new quests.
- The only visible hint that an NPC is dead is the badge in their popup.

## Rumors

### Sources

| Source | Made by | Lifespan | Truth roll | Weight |
| --- | --- | --- | --- | --- |
| `npc_event` | `generateNpcEventEcho`, from every simulated event | 60 days; 120 for big news | 80 % true · 15 % distorted · 5 % false | template weight, ×2 for big news |
| `player_echo` | `generatePlayerEcho`, from five hero actions | 60 days | 65 % true · 25 % distorted · 10 % false | template weight |
| `lore` | `seedLoreRumors` | never expires | fixed per entry (23 true, 6 distorted, 1 false) | fixed per entry |
| `warning` | `generateWarning` — only called by tests | until the day after the event | always true | template weight |

- **Truth variants.** A distorted or false rumor uses the template's `distorted` / `fake` text. When a template has no such text, it falls back to the true text, so the truth is not visible from the wording either.
- **Big news** is `death_combat`, `master_art` or `betray_sect`. The rule "or the actor's `sectRank ≤ 3`" in `isBigNews` never matches: the roster uses 10 for the top rank, so ranks run 7–10.
- **Template `lifespan`** fields are ignored; the engine uses `DEFAULT_LIFESPAN_DAYS` (60) and `BIG_NEWS_LIFESPAN_DAYS` (120) from `rumor-templates.ts`.

### Templates

`lib/world/data/rumor-templates.ts` holds:

- `NPC_EVENT_TEMPLATES`: 23 templates over the 12 event kinds (one for `travel`, two for each other kind).
- `PLAYER_ECHO_TEMPLATES`: 10 templates, two per action.
- `WARNING_TEMPLATES`: one each for `tournament`, `festival`, `sect_gathering`, `bandit_raid` and `eclipse`.

`renderTemplate` fills these tokens:

| Token | Filled with |
| --- | --- |
| `{npc}` | the NPC who did it (display name) |
| `{npc2}` | the other NPC (the avenger, the partner) |
| `{location}` | location display name |
| `{sect}` | sect name (from an id, else "ที่ไม่เปิดเผยชื่อ") |
| `{art}` | inner-art name |
| `{item}` | item name (else "สมบัติที่ไม่ทราบชนิด") |
| `{archetype}` | the hero's archetype (below) |
| `{days}` | days until a warned event |
| `{event}` | the warned event |

An unknown token stays in the text literally and logs a warning outside production.

Channels used by the templates:

| Channel | NPC-event templates | Player-echo templates | Warnings | Lore |
| --- | --- | --- | --- | --- |
| `inn` | 20 | 6 | 4 | 26 |
| `market` | 1 (`found_treasure`) | 1 (`quest_major_complete`) | 1 (`festival`) | 0 |
| `sect_internal` | 1 (`sect_demotion`, never fires) | 3 (one each for `sect_join`, `sect_leave_or_betray`, `sect_rank_up`) | 0 | 0 |
| `wilderness` | 1 (`defeated_by_player`, never fires) | 0 | 0 | 4 |

### Regions and channels

- **Region.** Each rumor is heard only in its own region, or everywhere when its region is `"global"` (no rumor is ever made global in play).
  - The region comes from `regionOf(locationId)`.
  - `LOCATION_REGION` maps all 97 world-map leaves: heartland 10, north 15, south 14, west 13, east 18, jianghu_wild 27.
  - Any other id falls back to `jianghu_wild`: the tutorial foothill (`village`, `tavern`, `viewpoint`), `jail`, `world_journey` and every route id.
  - `REGION_NEIGHBORS` exists but nothing reads it, so rumors never spread to other regions.
- **Channel.** A place listens on one channel, and `CHANNEL_ADMITS` says which rumor channels that includes:

| Listening channel | Hears rumors on |
| --- | --- |
| `inn` | `inn`, `market`, `wilderness` |
| `market` | `market`, `inn` |
| `sect_internal` | `sect_internal` |
| `wilderness` | `wilderness` |

### Lore

`LORE_RUMORS` has 30 entries:

- **Categories:** 10 sect legends, 6 jianghu history, 6 old heroes and 8 treasure / secret-art leads (with `leadsTo`).
- **Channels:** 26 inn and 4 wilderness.
- **Regions:** south 3, north 4, west 7, east 7, jianghu_wild 5 and heartland 4.

Their ids are `lore_<idSuffix>` and `createdDay` is 1. Seeding also repairs lore whose `expiresDay` became `null` after a JSON round trip.

### Deduplication

A new NPC-event rumor about the same NPC and the same event kind, created within 7 days of an existing one, does not create a new entry. The newest matching rumor gains +1 weight instead. Player echoes are never deduplicated.

### Choosing what the hero hears

`selectRumorsForScene(state, region, channel, limit)` is pure. It keeps rumors that:

- are not expired (`expiresDay > day`),
- are in the region (or global),
- are on an admitted channel,
- and whose `prerequisites` all pass.

It sorts them unseen first, then by weight (highest first), then newest first, and returns the first `limit`. Nothing rotates lore; the seen-first sort is the only variety.

### Housekeeping and caps

`maintainRumors(state, day)` runs after every NPC tick call:

1. Expired rumors move to `rumorArchive` as `RumorSummary`.
2. Archive entries older than 365 days are dropped.
3. `rumorSeenLog` is trimmed to the newest 50.
4. `applyCaps` runs (it also runs after every new NPC-event rumor):
   - **Soft cap 200:** non-lore rumors at least 90 days old are archived early until the pool is back to 200.
   - **Hard cap 500:** the excess is dropped without archiving, soonest-to-expire and lowest-weight first (lore sorts last).

Region propagation is a documented TODO at the end of `maintainRumors`.

## Player echoes

`generatePlayerEcho` renders a template with the hero's **archetype**. The first matching rule wins:

| Traits | Archetype |
| --- | --- |
| good > 70 and evil > 70 | บ้ายุทธ์จักรดีร้ายตามใจตน |
| arrogance > 70 and humility > 70 | ผู้ล้ำลึกหยั่งไม่ถึง |
| good > 70 and evil < 30 | ผู้กล้าแห่งเจียงหู |
| evil > 70 and good < 30 | จอมมาร |
| humility > 70 and good > 50 | นักพรตไร้นาม |
| otherwise | นักท่องยุทธ์ |

The rumor is anchored at `lastLocationId ?? currentSceneId`, so it is heard in the hero's current region. `{sect}` is named only when exactly one membership matches. `about` is the target NPC id, when there is one.

Five actions have templates. Only three can fire in normal play:

| Action id | Fired from | Fires in play? |
| --- | --- | --- |
| `duel_win_named` | `acknowledgeBattleResult`, on a win when the sparred NPC (`pendingSpar.npcId`) or the opponent id is a named NPC | yes — spar a named chief and win |
| `sect_join` | the store action `joinSect` | **no** — no UI calls it; the 15 intro quests join through the `joinSect` quest reward, which does not echo |
| `sect_leave_or_betray` | store `resignSect` / `betraySect` (sect popup buttons) | yes; the `resignSect` / `leaveSect` quest rewards do not echo |
| `sect_rank_up` | store `upgradeSectRank` | yes |
| `quest_major_complete` | `recordMajorQuestCompletion` in `effects.ts` | **no** — no quest sets `isMajor` |

## Where the hero hears rumors

- **Rumor spots.** The 12 painted maps of cities and inns (`city_*`, `inn_*`) have a 🍶 ฟังข่าวลือ spot, placed by `auto-maps.ts` (the capital's hand-authored layout has one too). It opens `RumorPopup` on the `inn` channel.
- **Other places.** `RumorListenSection` shows a listen button chosen by `resolveRumorChannel(locationId, sectMembership)`:
  - `market` for an id containing "market" (`market_miao`);
  - `inn` for `inn_*` and `city_*`;
  - `sect_internal` for `sect_<id>` when the hero is an active member of `<id>`.

  On a painted map this button lives in the "อื่น ๆ" drawer. That drawer is shown only for maps without a rumor spot, and only when the map has other content that could not be placed.
- **The popup.** `RumorPopup` asks for the region of `lastLocationId ?? currentSceneId`.
  - It lists up to 5 rumors (inn) or 3 (market, sect), each with a source icon: 💬 NPC event · 🌬 player echo · 📜 lore · ⚠ warning.
  - Truth is never shown.
  - "ฟังต่อ" calls `recordRumorHeard`, which adds the rumor to `rumorSeenLog` (no duplicates, newest 50).
  - Listening costs no time.
- **Banner.** `RumorBanner` would show the top rumor on entering a city, inn or market (7-day cooldown in `flags._lastBannerDay`). It is only mounted in the card layout that `world_journey` uses, so in practice it never appears.
- **Status badge.** `NpcStatusBadge` shows a chip for dead, secluded or missing NPCs, in the NPC popup header and in card-layout NPC lists. Living NPCs get no chip.

## Hooks for content

Scene effects and conditions from the Liveness Layer (full semantics in [world-engine.md](world-engine.md#scene-effects)); no content uses them yet:

| Kind | Name | Does |
| --- | --- | --- |
| effect | `firePlayerEcho { actionId, targetNpcId? }` | makes a player-echo rumor |
| effect | `markRumorHeard { rumorId }` | adds to `rumorSeenLog` (cap 50) |
| effect | `revealNpcStatus { npcId }` | no-op |
| condition | `heardRumor { rumorId }` | the id is in `rumorSeenLog` |
| condition | `heardRumorAbout { target }` | a heard rumor (live or archived) has `about === target` |
| condition | `npcStatus { npcId, status }` | the NPC's simulated status; an NPC that is not simulated reads as `alive` |

`QuestDef.isMajor: true` makes a quest fire `quest_major_complete` when it finishes successfully, through any of the three finishing paths.

## Tests

| Command | Covers |
| --- | --- |
| `bun run test:rumors` | `scripts/test-lore-rumors.ts` (lore seeding on new game and hydrate, selection in the capital, caps, `heardRumor`) and `scripts/test-rumor-formatting.ts` (every template renders without stray tokens, names resolve, tick output) |
| `bun scripts/smoke-liveness.ts` | a 90-day run on a fresh state: at least 3 NPC events, at least 3 inn rumors in the heartland, pool ≤ 500, tick day advanced. Not wired into `package.json` |

## Spec versus code

| Spec item | Status | What the code does |
| --- | --- | --- |
| 20–40 named NPCs | built (low end) | 20 |
| tick "when day % 7 === 0" | different | ticks when ≥ 7 days have passed; leftover days are dropped |
| aging on day % 365 | partly, buggy | checks each batch's `simDay % 365`; the 7-day grid makes birthdays rare |
| death 5 % over 70, 15 % over 85 | built | per tick |
| power growth 0–2 per tick from goals | different | master_art 1–5 % bursts of +5..15; climb_sect 0–2; avenge 0–1 |
| goal rules (power checks, duels, items, travel, priorities) | partly | uniform +1..3 progress; no power checks; avenge kills outright; no items; no travel; no priority; `targetRank` ignored |
| throttle over 28 days: aging + batch goal progress + a log message | partly | aging only, goal progress is lost, English `console.warn` |
| 12 event kinds | partly | 10 fire; `sect_demotion` and `defeated_by_player` never; status `missing` never set |
| travel moves, marry needs relationship ≥ 60, betrayal spawns a hunter, a disciple spawns an NPC, master_art teaches an art | not built | all are rumor-only |
| pool refill (disciples, name pool) | not built | |
| rumor data model | built | ids differ from `rumor_<source>_<timestamp>` |
| NPC-echo distortion 15 / 5, lifespan 60 / 120 | built | template lifespans ignored |
| "expand to global if important" | not built | nothing becomes `global` |
| player echoes incl. boss kills, 25 / 10 distortion, archetypes | partly | 5 actions, no boss kill; 2 of 5 cannot fire |
| 60–100 lore, 10–15 per region, rotate 5 per inn every 14–30 days | partly | 30 lore, 3–7 per region, no rotation |
| warnings from `scheduledEvents` | not built | `generateWarning` exists, only tests call it |
| caps 200 / 500, archive one year | built | the soft cap archives non-lore rumors ≥ 90 days old |
| region propagation | not built | `REGION_NEIGHBORS` unused |
| scene `rumorChannels` field | different | channel is inferred from the location id |
| selection: unseen first, weight, recency | built | |
| false `leadsTo` still gives a partial reward | not built | `leadsTo` is never read |
| seen log cap 50 | built | |
| listening costs 2 h / 1 h | not built | free |
| passive banner | built, effectively unmounted | |
| NPC status + location + rank + death day in the UI | partly | badge only |
| Liveness effects and conditions | built | unused by content |
| plan: dedup, quest auto-fail + toast, five action ids, lazy v17 → v18 fill | built | |
| plan: big-news boost for `sectRank ≤ 3` | dead code | roster ranks are 7–10 |
| plan: 5 lore with `leadsTo` | different | 8 |
| spec §9 acceptance (9 items) | 4 covered | by `smoke-liveness.ts`'s own four checks |

## Known gaps

Each item below is real behaviour today; the fix belongs in code, not in these docs.

1. **Birthdays stop after year one.** Aging checks `simDay % 365 === 0` on a 7-day grid anchored at the first tick day; with a start on day 1 the next hit is day 2920.
2. **Dead NPCs keep working.** They stay on their map, keep their dialog, and keep offering quests, so the quest-failing toast is the main sign. They could be hidden, or `npcStatus` could gate their quests.
3. **Heartland never hears NPC news.** No named NPC lives there, and there is no propagation. The capital, ฉางอัน, จินหลิง, หยางโจว and the two heartland inns only ever get lore and the hero's own echoes.
4. **Market and sect rumors are hard to reach.**
   - `sect_internal` news is reachable only through the "อื่น ๆ" drawer, which appears only on some maps.
   - Sun-Moon members never get it: their hall id is `sect_ming`, but their `SectId` is `sunmoon`.
   - The only market is `market_miao`, and it has no rumor spot.
5. **Two player echoes never fire:** `sect_join` (joining happens through the quest reward) and `quest_major_complete` (no `isMajor` quests).
6. **`find_treasure` rerolls point at `cave_heimu`,** which does not exist; the rumor then names the raw id.
7. **Leftover days are dropped** on every tick, and batches beyond four lose their goal progress.
8. **The banner is not mounted** on painted maps.
9. **No save repair.** `validateAndRepair` does not validate `npcExt` or the rumor arrays.

## Changing it safely

- Keep both engines pure: no React, no store imports. The store calls them.
- A new event kind needs:
  - the `NpcEventKind` variant;
  - templates in `NPC_EVENT_TEMPLATES` (the formatting test fails on missing or unrendered tokens);
  - a place in `npc-tick.ts` that fires it;
  - optionally, an entry in the big-news set.
- A new player echo needs:
  - templates in `PLAYER_ECHO_TEMPLATES`;
  - a `generatePlayerEcho` / `firePlayerEcho` call at the store action that should trigger it.
- A new named NPC needs:
  - an entry in `NAMED_NPC_DEFAULTS` whose id exists in the NPC registry;
  - a location in `LOCATION_REGION`.

  Existing saves pick it up on their next tick, because `ensureSeeded` fills in any missing roster id.
- After a change, run `bun run test:rumors` and `bun scripts/smoke-liveness.ts`.
