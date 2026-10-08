# World clock and the shared world — design

A step toward an online game. Two changes, made together:

1. **Time is a world clock**, not a counter the player pushes forward. One game
   day is one real hour; the world keeps moving while the game is closed, and
   every player of one world sees the same day.
2. **The world is shared state**, owned apart from the player: NPC lives and
   deaths, who was killed or carried off, the legendary beasts, the tournament
   and the rumors. Today it lives in the browser beside the save; the
   boundary is drawn so a server can own it later without touching the
   engines.

Decisions (from the brief):

| Question | Decision |
| --- | --- |
| Clock speed | 1 game day = 1 real hour (1 ชั่วยาม = 5 real minutes; a 360-day year ≈ 15 real days) |
| Actions that used to take hours | happen at once and cost stamina or gold instead; waiting is real time |
| NPC fate | fully shared: a death, a killing, a kidnapping or a fallen boss is the same for everyone |

## 1. The clock (`lib/world/clock.ts`, pure)

```ts
export const WORLD_EPOCH_MS: number;    // 2026-10-08 00:00 Asia/Bangkok = world day 1, ชั่วยาม 0
export const MS_PER_DAY = 3_600_000;    // one real hour
export const MS_PER_HOUR = 300_000;     // one ชั่วยาม (12 per day)
export function worldTimeAt(ms: number): { day: number; time: number };   // time 0 ≤ t < 12, fractional
export function msAtWorld(day: number, time?: number): number;
export function now(): number;          // Date.now(), or the test clock
export function worldNow(): { day: number; time: number };
export function setTestClock(ms: number | null): void;   // tests only
export function advanceTestClock(hours: number): void;   // tests only (ชั่วยาม)
export function setTestWorldTime(day: number, time?: number): void;   // tests only
export function formatWait(fromStamp: number, toStamp: number): string;  // "อีก 25 นาที"
```

- `state.day` / `state.time` stay in the save shape but are **never advanced by an
  action**: `syncClock(state)` (`store/world/lifecycle.ts`) sets them from
  `worldTimeAt(now())` and runs what passing time runs (stamina / HP / MP
  regeneration, wanted marks fading, the NPC simulation, rumor upkeep, and on a
  new day letters and the tournament calendar). Time never goes back: a save
  ahead of the clock waits for it.
- `syncClock` runs at the start of every store action (`draftFrom`, through the
  `setDraftClock` hook) and from the `WorldClock` component (every 10 s while
  the page is visible, and when it comes back into view), so the sundial and
  day counter move on their own.
- `advanceTime(state, hours)` is removed. Day-based numbers keep their meaning
  in world days (a 30-day cooldown is 30 real hours).

## 2. Actions that took time

| Action | Before | Now |
| --- | --- | --- |
| Rest at home / own sect | 4 ชั่วยาม, full restore | instant full HP / MP / stamina; again after 2 ชั่วยาม (10 min) |
| Rest at an inn | 12 ชั่วยาม + 300 gold | instant full restore for 300 gold |
| Stamina | restored by rest | also regenerates: the full bar every 6 ชั่วยาม (30 min) |
| HP / MP out of battle | only rest and potions | also regenerate slowly: the full bar every 12 ชั่วยาม (1 h) |
| Gathering, crafting, work, place activities, quest objective spots | 0.2–6 ชั่วยาม | instant; stamina `5 × ชั่วยาม` the action used to take (a minimum of 2) |
| Practice | 6 ชั่วยาม + 30 stamina | 30 stamina |
| Fights | 0.5 ชั่วยาม + 5 stamina | 5 stamina |
| Walking between a place and a road | 1–2 ชั่วยาม + 10 stamina | 10 stamina |
| Horse station ride | gold + hours | gold, instant |
| Death | wake at home the next day | wake at home at once |
| Jail | 2 days per mark (≤ 30) | 1 ชั่วยาม per mark (≤ 12 = 1 real hour), served in real time; labour takes 2 ชั่วยาม off, a failed escape adds 2, meditation once per 3 ชั่วยาม; bribe and escape stay; the gate opens once served |

`hours` fields in content (`ActivityDef.hours`, objective `hours`, trip
`hours`) stay as data and are read as the stamina price
(`staminaForHours(h) = max(2, round(5h))`).

## 3. The shared world

`SharedWorld` (`lib/world/shared/world.ts`, the list `SHARED_WORLD_KEYS`) holds
what belongs to the world, not to one player:

| Field | Was on the save as |
| --- | --- |
| `worldSeed` | — (new: the world's random seed) |
| `npcExt`, `lastNpcTickDay` | same |
| `rumorPool`, `rumorArchive` | same (what *this* player has heard stays on the player: `rumorSeenLog`) |
| `assassinatedNpcIds`, `kidnappedNpcIds`, `kidnappedUntil` | same |
| `bossDefeatedDay` | same |
| `tournament`, `tournamentHistory` | same (the bracket's "player" entrant is the local player for now — a real multi-player bracket is later work) |
| `worldEventLog` | — (new: the last 500 `WorldEvent`s, newest last) |

Everything else (the hero, bag, quests, relationships `npcStates`, gifts,
letters, wanted marks, jail, sect membership) is the player's.

**In memory** the shared fields stay on the store's state object, so every
engine keeps reading `state.npcExt` etc. unchanged. **Ownership** moves:

- `partializeSave` (typed `PlayerSave = Omit<WorldStateData, SharedWorldKey>`)
  no longer writes them into `wusia-world-v1`.
- `lib/world/shared/world.ts` defines the boundary:

  ```ts
  export interface WorldService {
    load(): SharedWorld | null;
    save(world: SharedWorld): void;          // whole-world write (local)
  }
  ```

  `store/world/shared-local.ts` implements it on `localStorage["wusia-shared-v1"]`
  (`{ version: 1, world }`). `attachSharedWorld(useWorldStore)` runs once after
  the save has loaded: it lays the stored world over the state
  (`joinSharedWorld`; with none stored, the state's own — an old save's — is
  kept), seeds a missing `worldSeed`, people and lore, repairs, writes the world
  back, and saves it whenever an action changes a shared field. A save that
  still carries world fields (an older save, or one edited by hand) keeps them
  over the stored world (`takeCarriedWorldKeys`).
- **A new hero joins the world as it is.** `startNewGame` keeps the shared slice
  (the dead stay dead); `resetGame` wipes only the player. `startNewGame({
  newWorld: true })` starts a fresh world too — tests and local play only.
- **Player → world changes are events.** Every place an action changes shared
  state goes through `emitWorldEvent(state, event)` (`lib/world/shared/events.ts`),
  which applies the event with the same reducer a server would run
  (`applyWorldEvent`, pure) and keeps it in `worldEventLog`:

  ```ts
  type WorldEvent =
    | { t: "npc_killed"; npcId: string; byPlayer: string; day: number; locationId: string }
    | { t: "npc_kidnapped"; npcId: string; byPlayer: string; day: number; until: number }
    | { t: "boss_slain"; bossId: string; byPlayer: string; day: number }
    | { t: "rumor"; rumor: Rumor };
  ```

  Senders: `heroKills` (a won ⚔ สังหาร or a successful assassination),
  kidnapping, a fallen legendary beast, and the hero's echoes (`firePlayerEcho`).
  A server-backed service would add `submit(events)`: the client sends the log,
  the server applies and rebroadcasts the world.
- **The simulation is deterministic.** The NPC tick takes each week's random
  numbers from `seededRng(worldSeed, day)` (`lib/world/shared/rng.ts`,
  mulberry32 over an FNV-1a hash), so any machine that applies the same events
  to the same world computes the same people, deaths and heirs — a server, or
  another client checking it. (Rumor wording, distortion and ids still use
  `Math.random`; they ride along as `rumor` events.)
- **Offline catch-up.** On return the world simulates the weeks it missed (up to
  eight in full per sync; a longer gap only ages people), and the hero gets one
  line in the log (kind `time`) and a toast: "ระหว่างที่ท่านไม่อยู่ ผ่านไป N วัน"
  (`syncClock` returns the whole days passed).

## 4. Old saves (save v27)

Old saves counted their own days. On load (`migrate`), the save is rebased onto
the world clock: `offset = worldDayNow − save.day`, added to every day stamp —
the player's (sect `lastQuestDay` / `joinedDay`, `giftDays`, `letterDays`,
letters, `activityDays`, `wantedDay`, `rumorSeenLog`, the action log) and,
when this browser has no shared world yet, the world's it seeds from the save
(`npcExt` birthdays, wounds, seclusion, deaths, journeys; NPC event logs;
rumors; `kidnappedUntil`; `bossDefeatedDay`; `lastNpcTickDay`). A jail term
left is cut to the new scale (≤ 12 ชั่วยาม); a running tournament is dropped
(its history kept). `rebaseDays` is pure and tested.

## 5. Interface

- The sundial and day counter move by themselves.
- Waits read in real time: "อีก 25 นาที" (jail, rest, cooldowns, a boss's
  return, tournament registration).
- พัก says what it costs and when it is ready again.

## 6. Tests

`setTestClock` / `advanceTestClock` / `setTestWorldTime` replace pushing time
with actions in the unit suites; script suites start each new game in a fresh
world (`newWorld: true`). A new `test:clock` covers the clock maths, `syncClock` day
rollovers, regeneration, instant actions and their prices, jail in real time,
offline catch-up, the deterministic simulation (same seed + events → same
world), `applyWorldEvent`, the shared/player split of the save, and the v27
rebase.
