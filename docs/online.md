# Online play

Players sign in with a username and password and see each other walk, live, on the same map. The server is a Cloudflare Worker written in Rust (`server/`); the game talks to it over HTTP (accounts) and one WebSocket per map (presence). The save still lives in the browser; only presence is online so far.

## Contents

- [How it fits together](#how-it-fits-together)
- [Event-based design](#event-based-design)
- [The protocol](#the-protocol)
- [The server (`server/`)](#the-server-server)
- [The client (`lib/net/`)](#the-client-libnet)
- [Running it locally](#running-it-locally)
- [Deploying](#deploying)
- [Tests](#tests)
- [Limits and next steps](#limits-and-next-steps)

## How it fits together

```
browser                                   Cloudflare
───────                                   ──────────
OnlinePanel ──POST /auth/register|login──► Worker (server/worker/src/lib.rs)
  (store/online-store.ts: token)              └─► AccountObject (Durable Object, one per username)
                                                    event log: registered { salt, hash, iterations }
map runtime ─report(room, motion)─► OnlineSession (lib/net/session.ts)
  draws players() ◄──────────────────  │ one WebSocket: /rooms/<map id>/ws?token=…
                                       └─────────────► Worker checks the token
                                                         └─► RoomObject (Durable Object, one per map)
                                                               decide → events → apply → broadcast
```

- **A room is a map.** Its id is the scene id (`home_player`, `city_capital`, `route_a__to__b`). Walking onto another map closes the socket and opens the new room's.
- **Accounts.** One Durable Object per username: two sign-ups for one name can never both win.
- **Sessions.** A signed token (HMAC-SHA256, 30 days). There is no session table.
- **The signing key needs no setup.** `KeyObject` (`server/worker/src/keys.rs`, one Durable Object named `auth`) makes 32 random bytes the first time it is asked and keeps them in its storage, so the key survives every deploy and nothing has to be configured on Cloudflare. Each Worker isolate caches it in memory.

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
| `server/worker/src/lib.rs` | the router, CORS, token checks, forwarding to the Durable Objects |
| `server/worker/src/account.rs` | `AccountObject`: the account's event log in Durable Object storage |
| `server/worker/src/room.rs` | `RoomObject`: hibernating WebSockets, attachments, numbering and broadcast |
| `server/worker/src/keys.rs` | `KeyObject`: makes and keeps the token-signing key; `signing_key` caches it per isolate |
| `server/worker/wrangler.toml` | bindings `ACCOUNTS` / `ROOMS` / `KEYS`, the SQLite-backed Durable Object migrations (`v1`, `v2` adds `KeyObject`), `PBKDF2_ITERATIONS` |

## The client (`lib/net/`)

| File | What |
| --- | --- |
| `lib/net/protocol.ts` | the wire types (mirror of `protocol.rs`) |
| `lib/net/client.ts` | `register` / `login` (HTTP) and `connectRoom` (one socket into one room); no React |
| `lib/net/presence.ts` | the pure reducer `applyServerMsg` (welcome, events in `seq` order, resync on a gap) |
| `lib/net/session.ts` | `OnlineSession` (`onlineSession`): one socket for the map the hero is on, throttled moves, reconnects |
| `lib/net/config.ts` | the server address: `localStorage["wuxia-game-server"]`, else `NEXT_PUBLIC_GAME_SERVER_URL` |
| `store/online-store.ts` | the sign-in (`wuxia-online-v1`: username, token, expiry) and the live status for the HUD |
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
- **Character.** Once signed in, a player without a save creates a character (the account is shown above the form, with เปลี่ยนบัญชี). A player with a save goes straight into the game.
- **Signing out** (HUD 🌐 → ออกจากระบบ, or an expired token after 30 days) returns to the account step. The local save stays.
- Without a server, the title screen is the character form alone, as before.

**UI:** in game, the HUD has a 🌐 ออนไลน์ button. The button's dot shows the status (green online, yellow connecting, red replaced) and its badge how many others share the map. Without a server, nothing online shows.

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
bun run server:deploy                    # wrangler deploy: builds the wasm, creates the Durable Objects
```

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
| `bun run test:server` | `cargo test` of `wuxia-core`: protocol spelling, `decide` / `apply` (speed limit, bounds, replace, full room, snapshot + events = the same room), accounts and tokens |
| `bun run test:net` | the client without a server: the presence reducer (order, gaps, resync) and the session (hello with the real position, throttled moves, room switch) against a fake WebSocket |
| `bun run test:online` | against a running server (`bun run server:dev`, or `GAME_SERVER_URL`): sign-up / login / refusals, checking a saved token (`/auth/me`), a bad token, two players' join → move → leave in `seq` order, a refused teleport, a second login replacing the first |
| `tests/browser/online.spec.ts` | two browsers sign up on the title screen, start heroes, see each other at home; one walks and the other sees it live; closing one makes them leave; a saved token the server no longer accepts lands on the log-in step. Skipped when no server answers |

## Limits and next steps

- **Only presence is online.** The save, the shared world (`lib/world/shared/`, `WorldService`) and the clock are still local. Next: a `WorldService` backed by a world Durable Object, reusing the `WorldEvent` reducer, with the server's time from `pong.server`.
- **Trust.** The server checks speed and bounds, not collision; a modified client can walk through walls. Fights, items and gold are not checked at all.
- **No chat, no emotes, no seeing heroes fight.** Each is one more command and event in `room.rs`.
- **Rate limits.** A client could flood moves; the throttle is client-side only. A per-socket token bucket in the room would cap it.
