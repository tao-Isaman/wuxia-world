# Online play

Players sign in with a username and password, pick one of their characters, and see each other walk, live, on the same map. The server is one Cloudflare Worker in two halves (`server/`): a **Rust** half (accounts, sessions, characters, saves, the realtime rooms) and a **TypeScript** half that runs the game's own engines (`lib/world`, `lib/game`) for what must not be left to the browser. The game talks to it over HTTP and one WebSocket per map (presence). With a server set (the released game):

- **the saves live on the server**: up to four characters per account, each save checked before it is kept;
- **there is one world for everyone** and the server runs it: the simulated jianghu (its people's lives, deaths and successions) and the talk ([The shared world](#the-shared-world));
- **the server checks every fight**: it stages the fight from the saved state, replays what the browser played and rolls the spoils ([Battles on the server](#battles-on-the-server)).

The rest of the game (quests, shops, crafting, walking) still runs in the browser, bounded by the save checks.

## Contents

- [How it fits together](#how-it-fits-together)
- [Event-based design](#event-based-design)
- [The protocol](#the-protocol)
- [The server (`server/`)](#the-server-server)
- [The client (`lib/net/`)](#the-client-libnet)
- [Characters and saves](#characters-and-saves)
- [The shared world](#the-shared-world)
- [Battles on the server](#battles-on-the-server)
- [Data generations (resetting the server)](#data-generations-resetting-the-server)
- [Running it locally](#running-it-locally)
- [Deploying](#deploying)
- [Tests](#tests)
- [Limits and next steps](#limits-and-next-steps)

## How it fits together

```
browser                                   Cloudflare
───────                                   ──────────
                                          Worker: ts/entry.ts (TypeScript) ── everything else ──► src/lib.rs (Rust)
OnlinePanel ──POST /auth/register|login──►   Rust: AccountObject (Durable Object, one per username)
  (store/online-store.ts: token)                    event log, characters, saves
cloud-world ──GET /world, POST /world/echo─► TS: WorldObject (one): the shared world, run hourly
cloud-battle ─POST …/battle/start|log|finish► TS: BattleObject (one per character): checked fights
map runtime ─report(room, motion)─► OnlineSession (lib/net/session.ts)
  draws players() ◄──────────────────  │ one WebSocket: /rooms/<map id>/ws?token=…
                                       └─────────────► Worker checks the token
                                                         └─► RoomObject (Durable Object, one per map)
                                                               decide → events → apply → broadcast
```

- **A room is a map.** Its id is the scene id (`home_player`, `city_capital`, `route_a__to__b`). Walking onto another map closes the socket and opens the new room's.
- **Accounts.** One Durable Object per username: two sign-ups for one name can never both win.
- **Sessions.** A signed token (HMAC-SHA256, 30 days). There is no session table.
- **Two halves, one Worker.** `server/worker/ts/entry.ts` is the Worker's entry: it answers `/world…` and `/characters/<id>/battle/…` itself and hands every other request to the Rust half (worker-build's output, imported as `wuxia-rust`). It checks a session by asking the Rust half (`/auth/me`).
- **The signing key needs no setup.** `KeyObject` (`server/worker/src/keys.rs`, one Durable Object named `2:auth`) makes 32 random bytes the first time it is asked and keeps them in its storage, so the key survives every deploy and nothing has to be configured on Cloudflare. Each Worker isolate caches it in memory.

## Event-based design

All state changes go one way: **command → `decide` → events → `apply`**.

- A **command** is what a player asks for: `join`, `move`, `leave`.
- **`Room::decide(&state, command, now)`** (`server/core/src/room.rs`) checks it and returns the **events** it causes, or a `Rejection`. It never changes state.
- **`Room::apply(&mut state, event)`** folds one event in. It never fails.
- The room's Durable Object numbers each event (`seq`), applies it and broadcasts it.
- Every client applies the same events to its own copy (`lib/net/presence.ts`, `applyServerMsg`). A snapshot (`welcome`) plus the events after its `seq` always rebuild the same room. A gap in `seq` makes the client ask for a fresh snapshot (`sync`).
- Accounts work the same way: `Account::register` decides a `registered` event, and `Account::from_events` rebuilds the account (`server/core/src/auth.rs`).

The pure logic lives in `server/core` (no I/O, clock or randomness), so it is tested natively with `cargo test`. The Worker crate is only glue.

**Hibernation.** Rooms use the Durable Object hibernation API: an idle room may leave memory while its sockets stay open.

- Each socket's **attachment** holds its player's `Presence`; that is the durable truth.
- The in-memory `Room` is a cache, rebuilt from the attachments after a wake-up.
- After a wake-up, `seq` restarts under a new `epoch`, and clients resync from the welcome.

## The protocol

`server/core/src/protocol.rs` and its mirror `lib/net/protocol.ts` (keep them in step; bump `PROTOCOL_VERSION` on both sides). Every frame is one JSON object tagged by `t`.

| Direction | Message | Meaning |
| --- | --- | --- |
| client → server | `hello { v, name, body, x, y, dir }` | the first message: who walks in, and where |
| | `move { x, y, dir, moving }` | position and heading, ~10 a second while walking |
| | `sync` | ask for a fresh snapshot |
| | `ping { at }` | keep-alive |
| server → client | `welcome { you, room, epoch, seq, players }` | the room at `seq` (answer to `hello` / `sync`) |
| | `event { seq, ev }` | one event, in order: `joined { player }`, `moved { id, x, y, dir, moving, at }`, `left { id, reason }` |
| | `pong { at, server }` | the server's time |
| | `error { code, message }` | a refused command: `bad_message`, `bad_version`, `not_joined`, `already_joined`, `bad_profile`, `too_fast`, `room_full`, `replaced` |

**Server rules** (`room.rs`):

- Positions are clamped to the 960 × 640 map.
- A move may cover at most `WALK_SPEED` (150) × 1.6 × the time since the last one, plus 48 units; anything more is `too_fast`.
- Names are 1–24 printable characters; bodies are `m1` or `f1`.
- A room holds at most 64 players.
- Joining again with the same account (a second tab) emits `left { reason: "replaced" }` and closes the older socket with code 4001.

**HTTP:**

| Request | Answer |
| --- | --- |
| `GET /health` | `{ ok, protocol, auth }`: `auth` is `ready`, or `auth_key_unavailable` when the key's Durable Object cannot be reached |
| `POST /auth/register` `{ username, password }` | `{ username, token, expires }`, or `{ error }` with 400 / 409 |
| `POST /auth/login` `{ username, password }` | the same, or 401 `wrong_login` |
| `GET /auth/me?token=…` | `{ username, expires }`, or 401 for a token the server no longer accepts |
| `GET /rooms/<room>/ws?token=…` (WebSocket upgrade) | the room; 401 for a bad token |

Usernames are 3–20 of `a–z 0–9 _`, case-insensitive. Passwords are 6–72 characters, stored as PBKDF2-HMAC-SHA256 with a random salt; the iteration count (`PBKDF2_ITERATIONS`, default 10,000) is stored per account. Error codes: `bad_username`, `bad_password`, `taken`, `wrong_login`, `bad_token`, `expired`; if the key's Durable Object cannot be reached, 500 `auth_key_unavailable`.

## The server (`server/`)

| Path | What |
| --- | --- |
| `server/Cargo.toml` | the workspace (release profile tuned for size) |
| `server/core/src/protocol.rs` | wire types (`ClientMsg`, `ServerMsg`, `RoomEvent`, `Presence`, `Dir8`) |
| `server/core/src/room.rs` | `Room`: `decide` / `apply`, the movement and profile rules |
| `server/core/src/auth.rs` | usernames, password hashing, `Account` (event-sourced), signed tokens |
| `server/core/src/save.rs` | `Roster` (the account's characters), `check_save` / `accept` (the save checks), `grant_gold` (a checked battle's purse) |
| `server/worker/src/lib.rs` | the Rust router, CORS, token checks, forwarding to the Durable Objects; `DATA_EPOCH` / `object_name` |
| `server/worker/src/account.rs` | `AccountObject`: the account's event log, its characters (`roster`) and their saves (`save:<id>`) in Durable Object storage; `/grant` (internal) |
| `server/worker/src/room.rs` | `RoomObject`: hibernating WebSockets, attachments, numbering and broadcast |
| `server/worker/src/keys.rs` | `KeyObject`: makes and keeps the token-signing key; `signing_key` caches it per isolate |
| `server/worker/ts/entry.ts` | the Worker's entry (TypeScript): the world and battle routes, everything else to the Rust half |
| `server/worker/ts/world-doc.ts` · `world-object.ts` | the shared world: the pure document (create, advance, pins, echoes, killings) and `WorldObject` (storage, hourly alarm) |
| `server/worker/ts/battle-doc.ts` · `battle-object.ts` | checked battles: the pure record (stage, replay, judge) and `BattleObject` (one per character: replay, beasts' rest, grants, world killings) |
| `server/worker/ts/env.ts` · `http.ts` · `workers.d.ts` | bindings and object names (`DATA_EPOCH`), HTTP helpers, the few Workers types used |
| `server/worker/wrangler.toml` | `main = "ts/entry.ts"`, the `wuxia-rust` alias, `minify`, bindings `ACCOUNTS` / `ROOMS` / `KEYS` / `WORLD` / `BATTLES`, the SQLite-backed Durable Object migrations (`v1`, `v2` adds `KeyObject`, `v3` `WorldObject` and `BattleObject`), `PBKDF2_ITERATIONS` |

## The client (`lib/net/`)

| File | What |
| --- | --- |
| `lib/net/protocol.ts` | the wire types (mirror of `protocol.rs`) |
| `lib/net/client.ts` | `register` / `login`, the character / save / world / battle calls (`listCharacters`, `storeSave`, `loadWorld`, `postEcho`, `startBattle`…; `ApiFailure`) and `connectRoom` (one socket into one room); no React |
| `lib/net/play-protocol.ts` | the TypeScript half's replies (`WorldReply`, `EchoRequest`, `BattleStartReply`, `BattleVerdict`), shared by browser and server |
| `lib/net/cloud-save.ts` | `cloudSave`: the world store's persist storage on the server (debounced writes on the server's `rev`, status, `settle`), the read-only `WorldService` for the world loaded at entry |
| `store/cloud-world.ts` | follows the server's world: polls it every minute with the hero's pins, lays it over the state (`applyServerWorld`), sends the hero's echoes |
| `store/cloud-battle.ts` | `cloudBattle` / `useCloudBattle`: stage a fight on the server, stream its command log, wait for the verdict |
| `lib/net/presence.ts` | the pure reducer `applyServerMsg` (welcome, events in `seq` order, resync on a gap) |
| `lib/net/session.ts` | `OnlineSession` (`onlineSession`): one socket for the map the hero is on, throttled moves, reconnects |
| `lib/net/config.ts` | the server address: `localStorage["wuxia-game-server"]`, else `NEXT_PUBLIC_GAME_SERVER_URL` |
| `store/online-store.ts` | the sign-in (`wuxia-online-v1`: username, token, expiry, the character last played) and the live status for the HUD |
| `store/cloud-session.ts` | `useCloudSession`: the character list, enter / leave / create / delete / import, the save status; `startCloudSession`, `resumeLastCharacter` |
| `components/world/character-select.tsx` | step 2: the account's characters (เล่น / ลบ), สร้างตัวละครใหม่, นำเข้าตัวละครจากเครื่องนี้ |
| `components/world/online-bridge.tsx` | gives the session the hero's name and body, mirrors its status into the store |
| `components/world/account-step.tsx` | step 1 of the title flow: สมัครใหม่ / มีบัญชีแล้ว, and the step indicator (`FlowSteps`) |
| `components/world/online-panel.tsx` | the HUD's 🌐 ออนไลน์ button and its status / sign-out panel; `useGameServer` |

**Session behaviour** (`OnlineSession`):

- **Driven by the map runtime.** Every frame the runtime calls `presentation.online.report(motion)` with the hero's position, heading and whether they walk (`components/game/world-canvas.tsx` binds it to the map's id). The first report opens the room with that position in `hello`; a report for another map switches rooms.
- **Throttled moves.** Starting or stopping goes out at once; steps in between at most every 100 ms (`MOVE_INTERVAL_MS`). A hero standing still sends nothing.
- **Idle close.** When nothing reports for 15 s (`IDLE_CLOSE_MS`: a battle, a dialogue over a painting, a hidden tab) the socket closes and others see the hero leave. The next report rejoins.
- **Reconnects** back off over 1–15 s. A `replaced` error (the account signed in elsewhere) stops the session and shows a toast.

**Drawing** (`lib/stage/world-runtime.ts`, `updateRemotes`):

- Other players come from `presentation.online.players()` every frame, like the roaming foes.
- Each walks toward the last position the server sent, catching up over ~100 ms; a jump of more than 160 units snaps.
- They use their body's painted eight-way walk cells and wear a **gold** name tag (NPCs' are green).
- The host publishes `data-remote-players` (`[[id, x, y], …]`) for tests.

**The flow** (with a server set): **account → character → play**.

- **Account first.** `WorldScreen` shows the title screen whenever there is no valid login, even for a player who already has a save. Its first step (`AccountStep`) has two tabs: สมัครใหม่ (username, password, confirm) and มีบัญชีแล้ว.
- **Returning players.** A browser that has signed in before opens on log in, with the username filled in.
- **Character.** Once signed in, the account's characters are listed ([Characters and saves](#characters-and-saves)); the one last played on this browser is entered at once.
- **Signing out** (HUD 🌐 → ออกจากระบบ, or an expired token after 30 days) writes what is pending and returns to the account step; **เปลี่ยนตัวละคร** returns to the list.
- Without a server (dev, tests), the title screen is the hero form alone and the save is the browser's, as before. The released game always has one.

**UI:** in game, the HUD has a 🌐 ออนไลน์ button. The button's dot shows the status (green online, yellow connecting, red replaced) and its badge how many others share the map. Without a server, nothing online shows.

## Characters and saves

**What the player sees.** After signing in: up to four characters, each with its day, gold, sect rank and place (from its last save). เล่น enters one; ลบ deletes it after a confirmation (for good); สร้างตัวละครใหม่ opens the hero form. A browser that still holds a hero from the days of local saves offers **นำเข้าตัวละครจากเครื่องนี้** once: the hero becomes a character (gold capped at 100,000, the server's first-save allowance), with the deeds the browser kept in its world (killings, felled beasts, the tournament); the browser's world itself stays behind — there is one world on the server. In game, the 🌐 panel shows the character and the save status (บันทึกแล้ว · กำลังบันทึก… · รอบันทึก · ถูกบันทึกจากที่อื่น · บันทึกไม่ผ่าน).

**API** (`Authorization: Bearer <token>`; the worker checks the token, then the account's `AccountObject` answers):

| Call | Answer |
| --- | --- |
| `GET /characters` | `{ characters: [{ id, name, gender, body, created, updated, rev, summary }] }` |
| `POST /characters` `{ name, gender }` | the new character (`bad_name`, `name_taken`, `too_many`) |
| `DELETE /characters/<id>` | `{ deleted }` (its save goes too) |
| `GET /characters/<id>/save` | `{ rev, save }`: the game's own save JSON `{ version, state }`, `null` before the first |
| `PUT /characters/<id>/save` `{ rev, version, state }` | `{ rev, summary }`, or a refusal below |

**What the server checks** (`server/core/src/save.rs`, `check_save`):

| Refusal | When |
| --- | --- |
| `stale` (409) | the upload does not build on the save the server holds (`rev`): another tab or device saved since |
| `too_fast` (429) | less than a second after the last save |
| `too_large` (413) | over 1 MB |
| `bad_version` (400) | a save version below 27, or below the character's last |
| `name_mismatch` (422) | the hero's name is not the character's |
| `bad_save` (422, `detail`: the field) | not a hero (`hasGame`), stats outside 0–9,999, a skill / art level outside 1–10, stacks outside 0–9,999, gold outside 0–99,999,999, broken numbers |
| `gold_too_fast` (422) | gold rose by more than the server's grants (a checked win's purse, `grant_gold`) plus the allowance: 100,000 at once, refilled at 3,000 a minute — far above what play earns, far below an edited save |

Storage keeps the save and the roster that numbers it in one write.

**The client** (`lib/net/cloud-save.ts`, `store/cloud-session.ts`):

- With a server set, the world store's persist storage is `cloudSave.storage` and it hydrates only when a character is entered (`skipHydration`); the shared world joins through `cloudSave.world` (read only).
- **Entering** loads the shared world, empties the store, hydrates it from the save (a character never played starts as a new hero, in the world as it is), follows the server's world (`followServerWorld`), then lets writes flow and writes once.
- **Writes** are debounced 1.5 s and build on the server's `rev`. A state without a hero is never written. No answer → status รอบันทึก and a retry; `too_fast` → a short wait.
- **`stale`** (the character was saved elsewhere) or **a refusal** stops writing and returns to the list with a toast; entering again loads the server's last good save.
- Leaving, signing out, hiding or closing the page writes what is pending (`keepalive`).
- A reset hero (the old game over) starts again as the same character.

## The shared world

**One world for everyone.** The world is the simulated jianghu — the thirty people and the generated ones (`npcExt`: their ages, sects, journeys, marriages, deaths and heirs) — and the talk (`rumorPool`, `rumorArchive`), with the world's seed and event log (`SHARED_WORLD_KEYS`, `lib/world/shared/world.ts`). On a server there is one `WorldObject` (named `2:world`) and **the server runs it**:

- **It moves with the clock.** Every request first brings the world to the clock (`advanceWorld`): a new day keeps the rumors (`maintainRumors`), each week passed the people live it (`tickAllNamedNpcs`, seeded by the world seed and the day). An alarm every real hour (one game day) keeps it moving when nobody plays.
- **Pins.** The browser sends the people its hero's open quests are about (`heroPins`, with every world poll); the simulation keeps them where they are, as it did for the one local hero. A player's pins last two game days.
- **Deeds become talk.** When the hero does something the jianghu talks about (`firePlayerEcho`: joining a sect, a rank, a killing, a won duel…), the browser sends an **echo** — the deed's id, its target and the hero's side (archetype label, place, sect), never text. The server checks each against the known templates, people, places and sects, allows 30 an hour per player, and writes the rumor itself (`generatePlayerEcho` with `context`).
- **Killing one of the simulated people** in a fight the server checked (⚔ สังหาร, [below](#battles-on-the-server)) kills them for everyone; their seat and quests pass on in every player's game.
- **What stays each player's own** (save v28, `PLAYER_FROM_WORLD_KEYS`): whom this hero killed or carried off outside a checked fight (assassinations, kidnappings — they are gone from this hero's map only), the legendary beasts this hero felled (their 90-day rest), and this hero's tournament. One player's deeds must not empty the map for everyone.

**API** (a session token):

| Call | Answer |
| --- | --- |
| `GET /world[?rev=N&pins=a,b]` | `{ rev, day, time, world }`, or `{ rev, same: true }` when `rev` is current |
| `POST /world/echo` `{ actionId, targetNpcId?, context: { archetype, sceneId, sectId } }` | `{ rev }`; `bad_action`, `bad_target`, `bad_context` (422), `too_many` (429) |

**The browser** (`store/cloud-world.ts`): while a character is played, `setServerRunsWorld(true)` stops the browser's own simulation and rumor upkeep (`syncClock` only trims what the hero heard), the world is asked for every minute (and after each echo), and a newer one is laid over the state (`applyServerWorld`): the shared fields replaced, generated people registered, and the hero's quests of anyone newly dead passed on or ended, with a line in the log.

**Storage.** The document is kept in parts (`meta`, `npcExt`, `rumorPool`, `rumorArchive`, `worldEventLog` — the newest 200 events), each well under the storage limit.

## Battles on the server

Every fight of a character played on the server is **staged, replayed and paid by the server**:

1. **Staging.** Going in (`ensureBattleStarted` → `cloudBattle.begin`), the browser saves (`cloudSave.settle`) and asks `POST /characters/<id>/battle/start`. The server reads the character's last accepted save, stages its `pendingBattle` with the same pure code the browser uses (`worldBattleStart`, `lib/world/battle-setup.ts`: the scaled foe and pack, the hero's build, HP / MP and bag) and picks a random **seed**. A legendary beast this character felled less than its rest ago is refused (`boss_resting`); so is a save with no battle (`no_battle`), and more than 12 starts a minute.
2. **Playing.** The browser starts the battle with exactly the server's fight and seed. A battle is a list of commands (`lib/game/grid/session.ts`: a step, a move, a skill on a cell, wait, flee, an item, อัตโนมัติ on / off); with a seed every die is rolled from it (`withRandom`), and the commands are logged. The log streams to the server every 2.5 s; the server replays each command on its own session as it comes (`playCommands`). A command that cannot happen in that battle voids it (`bad_log`).
3. **The verdict.** When the battle ends the browser sends the rest and asks for the verdict (`finish`). The server's replay says who won, the HP / MP left and the items used, and on a win it rolls the spoils itself (`rollVictorySpoilsFrom`, `lib/world/spoils.ts`). The result panel waits for it ("กำลังตรวจผลการต่อสู้กับเซิร์ฟเวอร์…"; ลองอีกครั้ง when the server cannot be reached), then shows the server's spoils; `acknowledgeBattleResult` applies the verdict, not the browser's own outcome. A battle the server refused counts as left: no rewards, no harm.
4. **Consequences on the server.** A win's gold is granted to the character (`/grant` on its `AccountObject`), so the next save may show it beyond the allowance; a felled beast rests for this character; a won ⚔ สังหาร against one of the simulated people kills them in the shared world.

The browser and the server roll the same numbers because the engines are the same code and every engine call runs under the seed; the browser's battle store and the server's replay share `lib/game/grid/session.ts`. (Tested across engines: the browser's V8 or JavaScriptCore against the server's V8.)

| Call | Answer |
| --- | --- |
| `POST /characters/<id>/battle/start` | `{ battleId, seed, start: { a, b, opts } }` |
| `POST /characters/<id>/battle/log` `{ battleId, from, commands }` | `{ at }` (commands the server holds; a repeated part is skipped) |
| `POST /characters/<id>/battle/finish` `{ battleId, from, commands }` | `{ battleId, winner, escaped, hA, mpA, itemsUsed, spoils }` (asking again gives the same) |

Without a server (dev, tests, `/debug`) battles are unseeded and roll in the browser as before.

## Data generations (resetting the server)

Every Durable Object name starts with the **data generation** (`DATA_EPOCH`, `"2"` since 2026-10-11, in both `server/worker/src/lib.rs` and `server/worker/ts/env.ts`): accounts are `2:<username>`, rooms `2:<map id>`, the signing key `2:auth`, the world `2:world`, battles `2:<username>:<character id>`. Raising it starts the server over — no accounts, characters, saves or world, and a new signing key, so every saved session signs out (the browser lands on the log-in step). The old generation's objects stay in storage, unreachable. Generation 1 (accounts and saves made before 2026-10-11) was left behind this way while nobody played yet.

## Running it locally

Needs Rust (with `rustup target add wasm32-unknown-unknown`) and Node. The first run installs `worker-build` (a few minutes).

```bash
bun run server:dev        # wrangler dev on http://127.0.0.1:8787
```

Nothing to configure: the local server makes its own signing key and keeps it in `server/worker/.wrangler/state` (gitignored), so tokens stay valid across restarts.

Then point the game at it:

- build with `NEXT_PUBLIC_GAME_SERVER_URL=http://127.0.0.1:8787`, or
- in the browser console: `localStorage.setItem("wuxia-game-server", "http://127.0.0.1:8787")`, then reload.

Open the game in two browsers (or a normal and a private window), sign up two accounts, start a hero in each: both begin at home and see each other.

## Deploying

From `server/worker`:

```bash
npx wrangler login
bun run server:deploy                    # wrangler deploy: builds the wasm, bundles ts/entry.ts with the game's lib/, creates the Durable Objects
```

The TypeScript half imports the game's engines straight from the repository (`lib/`, `store/world/state.ts`, `store/world/progression.ts`; no npm packages), so the deploy needs the whole checkout, not only `server/worker` — Workers Builds clones it all.

Then set `NEXT_PUBLIC_GAME_SERVER_URL` to the Worker's URL (`https://wuxia-world.<account>.workers.dev`) in Vercel and redeploy the game.

**From the Cloudflare dashboard** (Workers Builds, deploying on every push): import the repository as a **Worker**, not a Pages project (Pages cannot host Durable Objects).

- The Worker's name must equal `name` in `server/worker/wrangler.toml` (`wuxia-world`), or the build refuses to deploy.
- The build image has no Rust, so the commands install it first.
- Version (preview) URLs are not made for Workers with Durable Objects, so the preview command only checks that the server builds.

| Field | Value |
| --- | --- |
| Root directory | `server/worker` |
| Build command | (empty) |
| Deploy command | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh -s -- -y --profile minimal --target wasm32-unknown-unknown && . "$HOME/.cargo/env" && npx wrangler deploy` |
| Preview command | the same, ending in `npx wrangler deploy --dry-run` |

No variables or secrets to add: the server makes its own signing key (above), and `PBKDF2_ITERATIONS` comes from `wrangler.toml` (variables set only in the dashboard are dropped by the next `wrangler deploy`). `GET /health` answers `{"ok":true,"protocol":1,"auth":"ready"}` once the server is live.

Servers deployed before the key moved into `KeyObject` signed tokens with an `AUTH_SECRET` variable; those tokens stop working once (accounts are untouched), and the `AUTH_SECRET` variable can be deleted. On load, `OnlineBridge` checks a saved token (`checkToken` → `GET /auth/me`); on a 401 it signs out, so the player lands on the log-in step with the name filled in instead of a room that keeps refusing them.

Durable Objects with SQLite storage are on the Workers free plan. PBKDF2 at 10,000 rounds stays within the free plan's CPU budget per request; raise `PBKDF2_ITERATIONS` on a paid plan.

## Tests

| Command | What |
| --- | --- |
| `bun run test:server` | `cargo test` of `wuxia-core`: protocol spelling, `decide` / `apply` (speed limit, bounds, replace, full room, snapshot + events = the same room), accounts and tokens, the roster, every save check and the server's gold grants |
| `bun run test:play-server` | the TypeScript half without a server: battles as replayable commands, the world document (days and weeks, pins, echoes and their limits, killings, beasts), the battle document (staging, replay in parts, refusals, verdict) and the browser's checked-battle loop against them behind a fake fetch |
| `bun run test:net` | the client without a server: the presence reducer (order, gaps, resync), the session (hello with the real position, throttled moves, room switch) against a fake WebSocket, and `cloudSave` against a fake server (debounce, rev, conflict, refusal, retry) |
| `bun run test:online` | against a running server (`bun run server:dev`, or `GAME_SERVER_URL`): sign-up / login / refusals, checking a saved token (`/auth/me`), a bad token, two players' join → move → leave in `seq` order, a refused teleport, a second login replacing the first; characters (limit, unique names, owner only, delete), saves (rev, pace, hero, numbers, gold allowance); the one world (the same for two accounts, an echo heard by the other, refusals); checked battles (staged from the save, the log replayed in parts, the verdict, a T5 purse saved past a spent allowance, a bad log refused, a resting beast, a killing reaching the world) |
| `tests/browser/online.spec.ts` | two browsers sign up on the title screen, start heroes, see each other at home; one walks and the other sees it live; closing one makes them leave; a saved token the server no longer accepts lands on the log-in step; two characters on one account: switch, resume after a reload, see both from another browser, delete one; a fight staged on the server, played on อัตโนมัติ, its result held until the server's verdict and spoils. Skipped when no server answers |

## Limits and next steps

- **Not everything runs on the server.** The world and every fight do; quests, shops, crafting, gathering, gifts and letters still run in the browser, and the save checks (limits, the gold allowance) bound what an edited client can give itself. With no trading between players, that cheating stays in one's own game. Next steps if players come to share an economy: shops and quest rewards as server calls, and an audit of items and moves against the game's tables.
- **What the server trusts in a fight.** It stages the fight from the saved hero, so a hero edited within the save limits fights as edited; and it trusts which fight the save says the hero stands before (the opponent, not its loot or outcome). A reload mid-fight restarts it with a new seed.
- **CPU.** The TypeScript half loads the game's tables at start-up (~6 MB of mostly Thai text, minified; ~2 MB gzipped) and a week of the world or a long replay takes a few milliseconds. The free plan's 10 ms per request fits the usual call; a long boss fight's final replay may need the paid plan's limit.
- **Trust in movement.** The server checks speed and bounds, not collision; a modified client can walk through walls.
- **No chat, no emotes, no seeing heroes fight.** Each is one more command and event in `room.rs`.
- **Rate limits.** A client could flood moves; the throttle is client-side only. A per-socket token bucket in the room would cap it.
