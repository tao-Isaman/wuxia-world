# Liveness Layer — the living jianghu

A background simulation that makes the jianghu move while the hero plays. Thirty people — the fifteen sect chiefs, five of their seconds and ten wanderers — and everyone they bring into the world (disciples, heirs, newcomers) age on their birthdays, train, decide for themselves what to do next, walk the real roads between places, join and leave sects, fight their rivals, take disciples, marry and die. When a chief dies, the seat passes on, and so do their quests. The hero meets these people wherever their journeys have taken them, and can spar with or kill any of them.

Every change is an event, and every event becomes a **rumor** that tells it as it happened. The hero's own deeds echo back as rumors too.

The original requirement and plan are kept as history: [specs/liveness-spec.md](specs/liveness-spec.md) (Thai) and [specs/liveness-plan.md](specs/liveness-plan.md). Liveness 2.0 (2026-10-06) replaced most of what they describe; this page is the system as built.

## Contents

- [Files](#files)
- [When it runs](#when-it-runs)
- [Saved state](#saved-state)
- [The people](#the-people)
- [A week in a life](#a-week-in-a-life)
- [Deciding what to do](#deciding-what-to-do)
- [Journeys](#journeys)
- [Seats, heirs and quests](#seats-heirs-and-quests)
- [Generated people](#generated-people)
- [The hero and the living](#the-hero-and-the-living)
- [Rumors](#rumors)
- [Player echoes](#player-echoes)
- [Where the hero hears rumors](#where-the-hero-hears-rumors)
- [Hooks for content](#hooks-for-content)
- [Tests](#tests)
- [Known gaps](#known-gaps)
- [Changing it safely](#changing-it-safely)

## Files

| File | Role |
| --- | --- |
| `lib/world/npc-tick.ts` | `tickAllNamedNpcs` — the weekly simulation: aging, death odds (`deathChance`), training (`trainingGain`), goals, journeys, decisions (`decide`), sect choice (`chooseSect`) |
| `lib/world/npc-life.ts` | the living roster: `seedLiveness`, `npcsAt` / `npcPlaces` (who is where), `killNpc`, `fillEmptySeats` (succession), `questHolder` / `heldQuests` / `settleChargesOfDead` (quests of the dead), `spawnPerson` (generated people), `roadPath` / `journeyTo`, `npcFoeFor` (anyone as a foe), `npcTitle` |
| `lib/world/rumor-engine.ts` | making rumors (`generateNpcEventEcho`, `generatePlayerEcho`, `generateWarning`, `seedLoreRumors`), spread (`rumorReaches`), choosing them (`selectRumorsForScene`) and housekeeping (`maintainRumors`) |
| `lib/world/data/named-npcs.ts` | `NAMED_NPC_DEFAULTS` — the thirty and their starting state |
| `lib/world/data/liveness-roster.ts` | tempers and sexes of the twenty masters, the ten wanderers' starting state, which sects take whom, name pools, `rankTitle`, `powerTier` / `POWER_TIER_LABEL` |
| `lib/world/data/npcs/wanderers.ts`, `scenes-content/wanderers.ts` | the ten wanderers' NpcDefs and talk scenes |
| `lib/world/data/rumor-templates.ts` | templates for NPC events (with `when` filters), player echoes and warnings; `renderTemplate` |
| `lib/world/data/lore-rumors.ts` | `LORE_RUMORS` — 30 hand-written rumors |
| `lib/world/data/opponents.ts` | `npcFoeId` / `parseNpcFoeId` — `npc@<id>@<power>@<sect>` opponents made from a person |
| `lib/world/npc-presence.ts` | `npcPresent` — the dead, the killed and the kidnapped are not on any map |
| `store/world-store.ts` | `advanceTime` runs the tick; `withChargesOfDead`; `startSparWith`, `startKillDuel`, `heroKills`; the player-echo call sites |
| `components/world/popups/npc-interaction-popup.tsx` | the NPC card: title, journey and family, ขอประลอง, ⚔ สังหาร |
| `components/world/location-map.tsx`, `location-view.tsx` | people on the map: residents at their spots, heirs in the old seat, travellers near the way in |
| `components/world/popups/rumor-popup.tsx`, `rumor-listen-button.tsx`, `rumor-banner.tsx` | hearing rumors |

None of these engine modules is in the `lib/world/index.ts` barrel; import them by path.

## When it runs

Every store action that spends time goes through `advanceTime`. After the clock moves it runs:

1. `withChargesOfDead(state, () => tickAllNamedNpcs(state, { currentDay }))` — the tick, then the quests of anyone who died in it (see [Seats, heirs and quests](#seats-heirs-and-quests)).
2. `maintainRumors(state, day)` — expire, archive and cap rumors.

The tick does nothing until 7 days have passed since `lastNpcTickDay`. It then simulates every whole week since, up to 8 in full (`MAX_TICKS_PER_CALL`); weeks beyond that only age people. The leftover days (`since % 7`) count toward the next week.

`seedLiveness` runs on a new game, on every load (the persist `merge`) and at the start of each tick: it seeds any of the thirty who are missing, fills the fields Liveness 2.0 reads into older entries, replaces every entry with a fresh copy (a draft must never change the previous snapshot) and registers generated people with the NPC registry.

## Saved state

Five fields on `WorldStateData` (save v18+, see [save-format.md](save-format.md)): `npcExt`, `rumorPool`, `rumorArchive`, `rumorSeenLog` (newest 50), `lastNpcTickDay`. Liveness 2.0 added no top-level field, so no version bump: everything new is optional on `NpcExtState` and filled on load.

`NpcExtState` per person:

| Field | Meaning |
| --- | --- |
| `power` | 0–100 strength (a float; `powerTier` reads it as 0–4: ไร้ฝีมือ / ฝีมือพอตัว / ชำนาญ / ยอดฝีมือ / ปรมาจารย์) |
| `age`, `birthday` | years; the day of the year (0–364) they turn a year older |
| `status` | `alive` · `secluded` (closed-door training until `secludedUntil`) · `dead` (`missing` is never set) |
| `currentLocation`, `homeLocation` | where they stand now; where they live (a sect member's is the sect's hall) |
| `sect`, `sectRank` | `SectId` or `null`; rank 1–10 (10 the chief's seat, 9 second, 7–8 elders, 4–6 senior disciples) |
| `goals` | `master_art` · `climb_sect` · `avenge` · `find_treasure` · `seek_wisdom` |
| `rivals`, `allies` | people they would fight; people they are close to |
| `temper` | `righteous` (−1 wicked … 1 upright), `ambition`, `wanderlust`, `loyalty` (0–1) |
| `plan` | a journey: `purpose` (wander / visit / join / duel / treasure / home / defect), `path` (places still ahead), `to`, `targetNpcId`, `sect`, `stayDays`, `arrivedDay` |
| `woundedUntil` | beaten in a duel: no travelling or duelling, and a higher death risk, until then |
| `deathDay`, `killedBy` | when and by whom (`"player"`, an NPC id, or none for old age) |
| `heirId` | who took over their seat and their quests |
| `masterId`, `spouseId`, `formerSect` | family and history |
| `dynamic`, `name`, `gender`, `body` | a generated person's identity and costume (m2–m4, f2–f4) |
| `lastTickDay`, `eventHistory` | the last simulated day; the last 10 events, newest first |

Anyone the hero kills gets an entry too (status `dead`), simulated or not, so `npcIsDead` and `npcPresent` cover everyone.

## The people

**The twenty masters** (`named-npcs.ts`): the 15 sect chiefs (rank 10) and five seconds — Shaolin's Luohan, Wudang's Xuancheng, Quanzhen's sword elder, Emei's Huimiao and Sun-Moon's Du Tianhan. Ages 50–76, power 65–96. Their tempers (`NAMED_TEMPERS`) make the chiefs loyal homebodies; Du Tianhan and Songshan's chief are ambitious, Sun-Moon's chief and the Jinyiwei commander lean wicked. Their old feuds stand: Jinyiwei and Sun-Moon, Sun-Moon's second and Shaolin's.

**The ten wanderers** (`npcs/wanderers.ts`): sectless people with no fixed place (`locationIds: []`), each with a talk scene and a strolling costume:

| Id | Name | Starts at | Power | Age | Bent |
| --- | --- | --- | --- | --- | --- |
| `wander_li_changfeng` | หลี่ฉางเฟิง | ฉางอัน | 62 | 34 | swordsman hunting เฮยอิ่ง |
| `wander_su_linger` | ซูหลิงเอ๋อ | โรงเตี๊ยมยั่วไหล | 46 | 21 | wants a sect |
| `wander_chen_dafu` | เฉินต้าฟู่ | หยางโจว | 12 | 46 | travelling merchant |
| `wander_sun_yao` | ซุนเหยา | จินหลิง | 30 | 38 | wandering healer |
| `wander_yunhe` | นักพรตอวิ๋นเหอจื่อ | วิหารหลวงจีนสวรรค์ | 71 | 58 | Daoist of the mountains |
| `wander_hei_ying` | เฮยอิ่ง | ไม้ดำหน้าผา | 66 | 31 | assassin (wicked) |
| `wander_wang_xiaohu` | หวังเสี่ยวหู่ | หมู่บ้านไร้นาม | 16 | 17 | village boy, wants a sect |
| `wander_bai_yutang` | ไป๋อวี้ถัง | ซูโจว | 55 | 28 | gentleman thief |
| `wander_huo_tianlong` | ฮั่วเทียนหลง | ยอดเขามรณะ | 84 | 71 | old sword, feud with Songshan's chief |
| `wander_liu_wenxin` | หลิวเหวินซิน | ต้าหลี่ | 40 | 26 | scholar-swordswoman |

**Generated people** join them as the years pass — see [Generated people](#generated-people).

## A week in a life

`liveWeek` for each living person:

1. **Age.** `birthdaysBetween(lastTickDay, day, birthday)` years are added — one on each birthday.
2. **Death of age.** `deathChance`: a yearly risk by age band (under 40: 0.2 %, 40s 0.5 %, 50s 1.2 %, 60s 3 %, 70s 7 %, 80s 15 %, 90+ 30 %), times `clamp(1.5 − power/100, 0.4, 1.5)` (inner strength keeps a master alive longer), ×3 while wounded, spread over 52 weeks. A death goes through `killNpc`.
3. **Training.** `trainingGain`: `(0.15 + ambition × 0.25) × (1 − power/105) × (0.5…1.5)` a week — quick for the young and weak, slow near the summit — less a little each week past seventy.
4. **Seclusion.** A secluded person trains a little and stays home until `secludedUntil`, then comes out stronger (+3 to +8; event `leave_seclusion`).
5. **Goals** (`workGoals`, +1 to +3 progress a week): `master_art` → +6 power, `master_art` event (silent below power 60); `climb_sect` → one rank up when strong enough (`power ≥ 20 + rank × 8`, never past 9 — the seat comes only by succession; silent below rank 7); `avenge` → a journey to fight the rival; `find_treasure` → a journey to a cave, cliff, mountain or valley, where they find something; `seek_wisdom` → seclusion.
6. **A journey under way** walks on (see [Journeys](#journeys)); otherwise they **decide** what to do.

After every week: `fillEmptySeats` (every sect keeps a chief) and `welcomeNewcomers` (with fewer than 8 sectless travellers, a 25 % chance a newcomer sets out). Long-dead generated people nobody's seat leads through are forgotten after two years.

What five years look like (seeded run, `test:liveness`): every seat held, generated disciples in most sects, a handful of natural deaths and duels to the death, dozens of journeys, sect joins and promotions, a few betrayals and marriages.

## Deciding what to do

`decide` runs for a person with no journey; 35 % of weeks they choose something (`DECIDE_CHANCE`). Each option has a weight from their temper and situation; "stay and train" always weighs 1.

| Choice | Who | Weight | What happens |
| --- | --- | --- | --- |
| go home | a member away from their sect | 2 | a journey home |
| wander / visit | anyone not wounded and not held by the hero | `wanderlust` × 1 (sectless), × 0.25 (members), × 0.08 (chiefs) | a journey to a town, inn, market, village, temple or manor; stay 7–21 days |
| knock on a sect gate | sectless, age 14–45, loyalty > 0.35 | `(1 − wanderlust/2) × 0.6 + ambition × 0.3` | a journey to the sect `chooseSect` picks: upright sects for the righteous, Sun-Moon / Tang / Xiaoyao / Jinyiwei for the crooked; Shaolin men only, Emei / north Hengshan / Gumu women only; near rather than far. At the gate they are taken in with chance `0.45 + 0.2 (under 30) + power/200`; the gifted start as senior disciples |
| go after a rival | a rival alive and not more than 25 % stronger | `ambition × (0.45 wicked / 0.25)`, halved for chiefs | a journey to wherever the rival stands now; followed up to twice if they moved on |
| closed-door training | power ≥ 50, age ≥ 35, at home | `ambition × 0.05` | secluded for 30–120 days |
| take a disciple | rank ≥ 7, age ≥ 35, at home, fewer than 2 disciples, fewer than 6 generated members in the sect | 0.04 | a generated disciple (age 14–22, rank 1) with the master's bent ± a little |
| leave the sect | a member below the seat | `(1 − loyalty) × ambition × 0.04`, ×2.5 when at odds with the school | `betray_sect`; the chief counts them a rival; half the time they walk to another sect (`defect`) |
| marry | an unmarried ally of the other sex, 18–65, neither a monk or nun | 0.05 | both are married (`spouseId`) |

**People the hero has business with stay put**: anyone who gives or takes an active quest does not set out on a new journey (`heldByHero`).

**Duels** (`duel`): each side rolls `power + 0–25`. The winner gains 2 power. The loser dies with chance 0.6 when the winner is wicked, 0.3 in an old feud (0.1 for the upright), else 0.03; otherwise they are wounded for 30–60 days and lose 2 power. A killing makes the dead's master, disciples, spouse and allies count the killer a rival.

## Journeys

`roadPath` walks the real road graph (`LOCATION_ROUTES`), never through the hero's home, the jail or the opening foothill. A journey (`plan`) moves 2 places a week (3 for the very restless); the person stands at each place on the way, so the hero can meet them there. On arrival: a sect gate decides, a duel happens if the rival is there, a treasure is found, a visit becomes a stay. Journeys to join, defect, duel or dig — and a quarter of wanders — are told as `journey` rumors naming the destination.

## Seats, heirs and quests

- **Every sect has a chief.** `fillEmptySeats` gives an empty seat to the member with the best claim: an elder (rank ≥ 7) of thirty or more, else a senior disciple of 35+ with power 50+; failing both, a generated elder (45–65, power 55–75) steps forward. The heir moves home to the hall and takes rank 10; event `new_chief`.
- **The dead chief's seat and quests pass to the heir** (`heirId`). On the map the heir stands at the old chief's spot (`predecessorsOf`). `heldQuests(heir)` lists the old chief's quests, `isQuestTurnInForNpc` accepts the heir for the hand-in, and the quest guide points at the heir.
- **A dead sect member's quests pass to the sect's chief.**
- **`settleChargesOfDead`** runs after every tick and every killing the hero does: an active quest whose giver or hand-in person died passes to their holder (`questHolder` follows `heirId` through the dead), with a log line and a toast; with nobody to take it — a sectless person — it fails.
- **The dead are gone.** `npcPresent` is false for anyone dead, so they leave every map, the card layout, letters and the tournament.

## Generated people

`spawnPerson` makes a person with `dynamic: true`: a name nobody alive has (Buddhist names in Shaolin, Emei and north Hengshan), a sex the sect admits, a costume (m2–m4 / f2–f4, so they can stroll), a temper and a birthday. `syncDynamicNpcs` registers them with the NPC registry (`registerDynamicNpc` in `data/npcs.ts`), so `getNpc`, rumors, the map and the card treat them like authored people. At most 48 are alive at once (`DYNAMIC_CAP`). They come as disciples, as elders who take an empty seat, and as newcomers on the roads.

## The hero and the living

- **Where people are.** `npcsAt(state, locationId)` lists the residents who are home plus every simulated person standing there. Painted maps put residents at their spots, heirs in the inherited seat and travellers on a free spot near the way in, strolling. The quest guide finds a person where they stand now (`npcPlaces`).
- **The NPC card** shows a simulated person's title, age and standing (`npcTitle`: "เจ้าสำนักง้อไบ๊ · อายุ 68 · ปรมาจารย์"), and what the jianghu knows: a journey under way, seclusion, wounds, their master, spouse, a former sect.
- **ขอประลอง with anyone.** `startSparWith` no longer needs `sparOpponentId`: a person without an authored sparring build fights as themselves (`npcFoeFor` → `npc@<id>@<power>@<sect>`, built in `opponents.ts` from their power and their sect's own moves — none for townsfolk under power 10, one to four moves and an inner art as they grow). Fame for a win is the authored value, else `1 + tier × 3`. A secluded person refuses. Winning against anyone the simulation tracks fires `duel_win_named`.
- **⚔ สังหาร anyone.** `startKillDuel` queues a fight to the death (`pendingBattle.killNpcId`). Win → `heroKills`: the person dies (`killNpc` with `by: "player"`; their seat and quests pass on or fail), joins `assassinatedNpcIds`, the hero is **wanted at once at the top of the list** (`wanted = WANTED_MAX`), evil +10, fame +3, the `killed_by_player` news and the `kill_npc` echo go out; killing one's own sect-mates is betraying the sect. Lose or flee → +2 wanted marks (attempted murder); a loss is a fall (wake at home). A successful ลอบสังหาร (quest assassination) counts as a killing too.

## Rumors

### Sources

| Source | Made by | Lifespan | Truth | Weight |
| --- | --- | --- | --- | --- |
| `npc_event` | `generateNpcEventEcho`, from every event that is not silent | 20 days; 40 for big news | always true — it happened | template weight, ×2 for big news |
| `player_echo` | `generatePlayerEcho`, from the hero's deeds | 20 days | 75 % true, 25 % exaggerated (`distorted`) — never false | template weight, +4 for loud deeds (`kill_npc`, leaving a sect, a milestone quest) |
| `lore` | `seedLoreRumors` | flavour: until day 60; leads: until heard | fixed per entry | fixed per entry |
| `warning` | `generateWarning` — only called by tests | until the day after the event | always true | template weight |

- **Big news**: `death_combat`, `killed_by_player`, `master_art`, `betray_sect`, `new_chief`, and anything (but a journey) that befalls a sect's chief.
- **Templates** (`NPC_EVENT_TEMPLATES`) cover every event kind; `when` narrows a template to a journey's purpose, to people with or without a sect, or to a named art. Tokens: `{npc}`, `{npc2}`, `{location}`, `{sect}`, `{art}`, `{item}`, `{dest}` (a journey's destination), `{title}` (the rank title now), `{tier}` (standing by power), `{archetype}`, `{days}`, `{event}`. `renderTemplate` tidies "สำนักสำนัก…", "สำนักพรรค…" and "วิชาวิชา…".
- **Heard news fades**: once heard a rumor lasts at most 15 more days (a lead 30).
- **Deduplication**: a new NPC-event rumor about the same person and kind within 7 days bumps the old one's weight instead.

### Spread

A rumor is heard in its own region (`regionOf` the place it happened). `rumorReaches` lets talk travel by age, with nothing extra saved: the heartland, where all roads meet, hears ordinary news after 10 days and big news after 3; big news reaches every region after 10 days; news that starts in the heartland goes out to every region after 10 days. Lore and warnings stay where they are.

### Choosing what the hero hears

`selectRumorsForScene(state, region, channel, limit)` keeps rumors that have not expired, that reach the region, on an admitted channel (`CHANNEL_ADMITS`: an inn hears inn / market / wilderness, a market market / inn, a sect only sect_internal), whose prerequisites pass; unseen first, then by weight, then newest.

### Housekeeping

`maintainRumors`: expired rumors go to `rumorArchive` (kept a year; lore stays, expired, in the pool), the seen log keeps 50, and the caps hold — over 200, non-lore rumors 90+ days old are archived early; over 500, the soonest-to-expire, lightest go.

## Player echoes

`generatePlayerEcho` renders the hero's **archetype** (by traits: บ้ายุทธ์จักรดีร้ายตามใจตน, ผู้ล้ำลึกหยั่งไม่ถึง, ผู้กล้าแห่งเจียงหู, จอมมาร, นักพรตไร้นาม, else นักท่องยุทธ์) at the hero's current place.

| Action | Fired from |
| --- | --- |
| `duel_win_named` | winning a spar against anyone the simulation tracks |
| `kill_npc` | killing anyone (`heroKills`) |
| `sect_join` | the `joinSect` effect — so every join, the intro quests' reward included |
| `sect_leave_or_betray` | `resignSect` / `betraySect` |
| `sect_rank_up` | `upgradeSectRank` |
| `quest_major_complete` | finishing a milestone (`isMajorQuest`): a quest flagged `isMajor`, any main-story chapter, or a saga's last chapter (the one that hands over its move) |

## Where the hero hears rumors

- **🍶 ฟังข่าวลือ** spots on the city and inn maps (inn channel).
- **Markets and one's own sect grounds**: a map without a rumor spot gets one near the way in when `resolveRumorChannel` admits a channel there — ฟังพ่อค้าคุยกัน at a market, ข่าวภายในสำนัก on the grounds of the hero's own sect (found by hall, so Sun-Moon's `sect_ming` works).
- **The banner**: the top rumor on reaching a city, inn or market (7-day cooldown, 12 s).
- **The NPC card and status badge**: a person's state, journey and family; dead / secluded chips.

## Hooks for content

Unchanged: effects `firePlayerEcho`, `markRumorHeard`, `revealNpcStatus` (no-op); conditions `heardRumor`, `heardRumorAbout`, `npcStatus` (a person the simulation does not track reads as `alive`; a killed one as `dead`). `QuestDef.isMajor` marks a milestone.

## Tests

| Command | Covers |
| --- | --- |
| `bun run test:liveness` | `scripts/test-liveness.ts`: the roster, aging on birthdays, death odds, roads, sect choice, succession (seat, map spot, quests, rumor), a generated elder, quests of the dead, five seeded years, spar with anyone, ⚔ สังหาร (wanted 5, death, echo) and its failure (+2), the two echoes, rumor spread |
| `bun run test:rumors` | lore seeding, selection, caps; every template renders with readable names and true NPC news |
| `bun scripts/smoke-liveness.ts` | a 90-day run: events, inn rumors, caps |
| `tests/browser/liveness.spec.ts` | a traveller on the capital's map, the card, a kill in the browser |

## Known gaps

1. **Templates' `lifespan` is ignored**; the engine uses 20 / 40 days.
2. **Warnings never fire in play** (`generateWarning` has no caller).
3. **`leadsTo` on lore is never read** — following a treasure lead gives nothing extra.
4. **Generated people have no portrait** (the card shows their costume) and only a generic description.
5. **The hero's killings bring no sect revenge** beyond the law and (for one's own sect) the betrayal hunters.
6. **No save repair** for `npcExt` beyond `seedLiveness` completing entries.

## Changing it safely

- Keep both engines pure: no React, no store imports.
- A new event kind needs the `NpcEventKind` variant, templates (`test:rumors` fails on unrendered tokens), a place that fires it (`fireLifeEvent`), and optionally a place in the big-news set.
- A new choice goes in `decide` with a weight from the temper; keep `DECIDE_CHANCE` and the weights low enough that five seeded years stay plausible (`test:liveness`).
- A new authored person needs an entry in `NAMED_NPC_DEFAULTS` (or `WANDERER_DEFAULTS`) whose id is in the NPC registry, a temper and sex (`NAMED_TEMPERS`), and a home with a world-map spot. Older saves pick them up on load (`seedLiveness`).
- Anything that shows NPCs at a place should use `npcsAt` / `npcPlaces` and `npcPresent`, and anything that lists a person's quests `heldQuests`.
