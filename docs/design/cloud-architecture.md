# Cloud architecture: Cloudflare + Supabase — design

> **Status: decided 2026-10-14; step 0–1 in progress ([§10](#10-the-migration-in-shippable-steps)).** Today the game is served by Vercel, the online server is one Cloudflare Worker whose Durable Objects keep everything ([online.md](../online.md)), and without a server the save lives in the browser. This page designs the move of **everything** onto Cloudflare and Supabase, with performance as the first concern. The owner's decisions are at the end ([Decisions](#decisions)): own username + password accounts, Rust for the realtime and event-sourced core, a server reset, budget no constraint.

## Goals

1. **Everything on two platforms.** The game's pages and art on Cloudflare; the server on Cloudflare; the durable, queryable record of players and the economy in Supabase Postgres. No Vercel, no data only in a browser for the released game (the browser-only mode stays for development and tests).
2. **Performance first.** Players are in Thailand and nearby. A click must never wait on a database across the sea; the game must open fast on a phone over 4G.
3. **One owner per datum.** Every piece of state has exactly one authority. Copies are caches or read models, never a second truth.

## Where things stand (measured 2026-10-14)

| What | Today | Size / rate |
| --- | --- | --- |
| Game pages | Next.js 15 on Vercel; one route handler, dev-only (`app/game/engine/api/save`) | first-load JS has one **6.8 MB** chunk (the game's tables, mostly Thai text; **1.3 MB gzipped**) |
| Art, maps, audio | `public/` on Vercel | **277 MB**, 8,273 files (8,080 PNG, 154 WebP, 11 MP3) |
| Accounts, characters, saves | `AccountObject` (DO, SQLite) | a new save is **1.7 KB** (0.8 KB gzipped); a long-played one tens of KB; written at most every 1.5 s |
| The shared world | one `WorldObject` | **30–37 KB** JSON (7–9 KB gzipped); every player asks for it **every minute** |
| Rooms, battles, hubs, parties, raids | Durable Objects (SQLite) | moves ~10/s per walking player; battle logs every 2.5 s |
| Token-signing key | `KeyObject` | one DO read per isolate |
| Server code | one Worker, TS entry + Rust (wasm) | the TS half loads ~6 MB of tables at start-up |

What hurts most, in order:

1. **The first load.** A 1.3 MB gzipped script that blocks the game, then hundreds of PNGs per map. This is what every player pays every visit after a deploy.
2. **The world poll.** Every player hits the **one** `WorldObject` every minute, and each request first brings the world to the clock. It is a global hot spot that grows linearly with players, for a document that is the same for everyone.
3. **Cold isolates.** The server parses ~6 MB of tables on every new isolate; the first request in an isolate also fetches the signing key from `KeyObject`.
4. **Nothing is queryable.** Data sits in thousands of separate DOs: no leaderboard, no "find a player", no economy audit, no admin view without visiting each object.

## Principles

1. **The hot path never waits for Postgres.** A Durable Object answers the player (single writer, storage on the same machine, a few ms). Supabase is written **after** the answer, in batches.
2. **What is the same for everyone is served from the edge cache.** The world document, game tables, art and leaderboards are immutable per version and cached by Cloudflare's CDN close to the player.
3. **Push, don't poll.** The sockets the game already holds (the room, the social hub) carry "something changed"; the client then fetches the immutable version.
4. **Check identity inside the isolate.** A signed token is verified with a key held in memory: no hop per request.
5. **Immutable, content-hashed files.** Anything static is named by its hash and cached for a year; a deploy changes names, not caches.

## Target architecture

```
                     player (browser / installed PWA)
                       │           │                 │
         static files  │   API +   │ sockets          │ sign-in
                       ▼   ws      ▼                  ▼
┌──────────────────────────────── Cloudflare ─────────────────┐   ┌──────── Supabase (ap-southeast-1) ────────┐
│ game.<domain>   Workers Static Assets (Next static export)  │   │ (Auth not used: own accounts, see §2)     │
│ cdn.<domain>    R2 bucket + CDN cache (art, maps, audio,    │   │ Postgres                                   │
│                 game tables JSON; hashed, immutable)        │   │   profiles, characters, saves_current,     │
│ api.<domain>    Edge Worker: token check (key in memory),   │   │   save_snapshots (meta), ledger,           │
│                 rate limits, routing, Cache API             │   │   battles, mail, friends, world_history,   │
│                  │                                          │   │   leaderboards (materialized)              │
│                  ▼  Durable Objects (authoritative, hot)    │   │   pg_cron · PITR backups                   │
│   CharacterObject · RoomObject · WorldObject · BattleObject │   └─────────────▲──────────────────────────────┘
│   PlayerHub · PartyObject · RaidObject                      │                 │ batched upserts
│                  │ outbox (SQLite) → alarm                  │                 │
│                  ▼                                          │                 │
│   Queue "sync" ──► Sync Worker ──► Hyperdrive ──────────────┼─────────────────┘
│   R2 "snapshots": daily save snapshots, long battle logs    │
└─────────────────────────────────────────────────────────────┘
```

## Who owns what

| Data | Owner (authority) | In Supabase | On the player's path |
| --- | --- | --- | --- |
| Credentials, sessions | **AccountObject** (Rust, event-sourced) | `accounts` (mirror, incl. the password hash, for recovery) | sign-in only (rare); every other request checks the signed token in the isolate |
| Username, display name | **AccountObject** | `accounts` (mirror) | carried in the token |
| Characters, the live save | **CharacterObject** (DO) | `characters`, `saves_current` (read model, ≤ 30 s behind) | save = one DO write (~5–20 ms) |
| Save history | R2 snapshots + `save_snapshots` rows | metadata | never |
| The shared world | **WorldObject** | `world_history` (deaths, successions, rumors archived) | served from the edge cache by revision |
| Map presence, map chat | **RoomObject** | no (ephemeral) | the socket |
| A battle in progress | **BattleObject** / **RaidObject** | `battles` (verdict, spoils, seed; the log in R2 if long) | the battle calls |
| Gold grants, parcels, spoils (economy) | the DO that makes them | `ledger` (append-only) | never |
| Friends, blocks, mail, whispers | **PlayerHub** | `friendships`, `mail` (read model) | the hub socket / calls |
| Party | **PartyObject** | no (ephemeral) | the hub |
| Leaderboards, player search, admin views | **Postgres** (derived) | materialized views | edge-cached API, 60 s |
| Game tables (skills, quests, items…) | the repository | no | hashed JSON on the CDN |

The rule that keeps this simple: **a DO owns anything a player can change in a click; Postgres owns only identity and what is derived from the DOs.** Nothing in the game ever reads Postgres to decide an action, so a slow or paused database cannot slow or stop play.

## 1. The game's pages and art

**Hosting.** The game is a client-side app: its one route handler is the dev-only engine save. Build it as a **static export** (`output: "export"`, the engine's write route kept to `bun dev`) and serve it with **Workers Static Assets** on `game.<domain>`. No server rendering is needed, so there is no Node runtime to cold-start (OpenNext on Workers stays an option if a server-rendered page is ever wanted).

**The 6.8 MB chunk.** Split the game's tables out of the JavaScript:

- A new build script (`build-data-bundles`) writes each table group (skills + arts, items + equipment, quests by region, scenes by region, NPCs, story) as **hashed JSON** to the CDN (`/data/<group>.<hash>.json`), Brotli-compressed by Cloudflare.
- The client loads what the first screen needs (the hero, the home map, its NPCs and scenes), then the rest in the background; a region's quests and scenes arrive before the hero walks in (the world map knows the roads).
- JSON parses several times faster than the same data as JavaScript, and a changed quest no longer invalidates the whole bundle.
- The **server** loads the same files once per isolate from R2 (or as Worker text modules), lazily per group, so a world request does not parse the battle tables.

**Art and audio** (277 MB) move to an **R2 bucket behind `cdn.<domain>`**:

- Names carry a content hash (`maps/city_capital.3f9a1c.webp`); `Cache-Control: public, max-age=31536000, immutable`; a manifest (`/data/assets.<hash>.json`) maps ids to names. A deploy uploads only new hashes.
- **PNG → lossless WebP** for pixel art and sheets (typically 25–35 % smaller, no blur), lossy WebP / AVIF for the painted maps (already WebP for some). Done once by a script beside the existing asset pipeline (`sharp` is already a dev dependency).
- **Many small PNGs → atlases** where they load together (item icons, NPC portraits by region): one request instead of dozens; HTTP/3 helps the rest.
- **Audio**: MP3 stays (universal), streamed and loaded on first need, never in the first load.
- The service worker (`docs/pwa.md`) precaches the shell and the home region, and caches the rest on first use; hashed names make its cache safe across deploys.

Expected effect: the game interactive after **~300–400 KB** of script instead of 1.3 MB, maps from the nearest Cloudflare city (Bangkok has one), and a repeat visit almost entirely from the device.

## 2. Identity: own accounts, checked at the edge

Decision: **username + password, as today** — no Supabase Auth for now.

- **`AccountObject` stays the authority** (Rust, one per username, event-sourced: `registered`, later `password_changed`, `banned`…). One object per name makes a duplicate sign-up impossible without a database round trip. PBKDF2 stays; on the paid plan raise `PBKDF2_ITERATIONS` (the count is stored per account, so old accounts keep working and are upgraded at their next sign-in).
- **Tokens are verified in the isolate, with no hop.** Today the TypeScript half asks the Rust half's `/auth/me` and the first request of an isolate reads the key from `KeyObject`. Instead the token becomes **self-describing** — `base64url(payload).base64url(HMAC-SHA256)`, payload `{ sub: username, iat, exp, gen }` — and both halves verify it with the key cached in memory (one `KeyObject` read per isolate, then none). A token carries the data generation, so a reset signs everyone out without a list of sessions.
- **Mirrored to Postgres** through the outbox: `accounts (username, created_at, pbkdf2 hash + salt + rounds, status)`. The hash lives only in a table no browser role can read; it is there so a lost or reset object can be rebuilt (§3, cold start). Supabase Auth can still be added later (e-mail, Google, LINE) by linking `auth.users` to `accounts.username`.
- **Sockets.** A WebSocket cannot send headers from the browser: the client asks `POST /ws-ticket` for a 60 s ticket (signed with the same key, holds `sub` + the room) and opens the socket with it, so the 30-day token never sits in a URL or a log.
- **Rate limits** at the edge with the Workers Rate Limiting binding (sign-in per IP and per username; API per user), before any DO is woken.

## 3. Durable Objects: the hot, authoritative state

The objects stay; their names keep the `DATA_EPOCH` prefix.

**Who writes which object.** Decision: **Rust does the realtime and the event-sourced core; TypeScript does what needs the game's engines.**

| Rust (`server/core` pure `decide` / `apply`, `server/worker/src` glue) | TypeScript (`server/worker/ts`, runs `lib/`) |
| --- | --- |
| `RoomObject`: presence, map chat, looks, the 100 ms tick, the move bucket, interest management (§7) | `WorldObject`: the simulated jianghu, echoes, killings |
| `AccountObject`: the account's event log, sign-in, tokens | `BattleObject`, `RaidObject`: staging, seeded replay, verdicts, spoils |
| `CharacterObject`: the character's save as an event stream — `saved { rev, patch }`, `granted { gold }`, `debited { parcel }` — with the save checks (`save.rs`) | `PlayerHub`, `PartyObject`: friends, mail, whispers, parties |
| the **outbox** and its flush (one crate, `wuxia-outbox`, used by every Rust object; a TS twin with the same row shape) | the **Sync Worker** (Queue consumer → Hyperdrive → Postgres) and the edge entry |

Everything a Rust object does is a command → `decide` → events → `apply`, and **the events are what goes to the outbox**: Postgres receives the same facts the object folded, so the read model is a projection of the event stream, not a second copy written by hand.

Changes:

- **`CharacterObject` per character** (split from `AccountObject`, Rust): a save is one character's business, so two characters of one account never queue behind each other, and the object's memory holds one save. The account keeps its roster (ids, names) as events.
- **Location hints.** Objects are created with `locationHint: "apac"` so they live near the players (and near Singapore, where Supabase is). `WorldObject` too.
- **Storage stays SQLite inside the DO** (strongly consistent, on the same machine). Each object that feeds Supabase keeps an **outbox table**: `(seq INTEGER PRIMARY KEY, kind, key, rev, body)`, written **in the same transaction** as the change it describes (`ctx.storage.transactionSync`).
- **Flushing.** An alarm (set when the outbox goes from empty to non-empty) sends the outbox to the **`sync` Queue** in one `sendBatch` and deletes what was sent. For saves the outbox is **coalesced**: one row per character, replaced on each save, so a player saving every 1.5 s produces one Supabase write per flush window (30 s, and at once when they leave).
- **Cold start from Supabase.** A `CharacterObject` with empty storage (a new data generation, a restore) loads `saves_current` from Postgres through Hyperdrive once, then owns it again. This is also the disaster-recovery path.

## 4. Supabase: the record, the read model, the queries

**Region:** `ap-southeast-1` (Singapore), the closest to Thai players and to Cloudflare's SEA objects. **Plan:** Pro for the released game (the free plan pauses an idle project and has no PITR).

**Access from Workers: Hyperdrive** (pooled connections kept warm near the database, no TLS handshake per request) with `postgres.js`. Only the Sync Worker and a few admin / leaderboard routes talk to Postgres; **the browser never talks to Supabase**. All tables have RLS on with **no policies for `anon` / `authenticated`**: nothing is readable from the browser; the Worker connects as a dedicated role with exactly the grants it needs.

**Schema (sketch):**

```sql
create table accounts (                         -- mirror of AccountObject (the authority)
  username citext primary key check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null,
  status text not null default 'active',        -- active, banned
  pw_hash bytea not null, pw_salt bytea not null, pw_rounds int not null  -- for recovery only; no browser role can read it
);

create table characters (
  id text primary key,                         -- the id the DO uses
  username citext not null references accounts on delete cascade,
  name text unique not null, gender text not null, body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  summary jsonb not null default '{}'          -- day, gold, rank, place (the list screen)
);
create index on characters (username) where deleted_at is null;

create table saves_current (                    -- read model, ≤ 30 s behind the DO
  character_id text primary key references characters on delete cascade,
  rev bigint not null, version int not null,
  state jsonb not null,                         -- TOAST-compressed by Postgres
  updated_at timestamptz not null
);

create table save_snapshots (                   -- one a day per active character; the body in R2
  character_id text references characters on delete cascade,
  rev bigint, taken_at timestamptz, r2_key text,
  primary key (character_id, rev)
);

create table ledger (                           -- every gold / item movement the server made
  id bigint generated always as identity,
  at timestamptz not null, character_id text not null,
  kind text not null,                           -- battle_spoils, grant, parcel_out, parcel_in, postage…
  gold bigint not null default 0, items jsonb, ref text,
  primary key (at, id)
) partition by range (at);                      -- monthly partitions (pg_partman); old months detach to cold storage

create table battles (
  id text primary key, character_id text not null, started_at timestamptz, finished_at timestamptz,
  opponent text, seed bigint, winner text, spoils jsonb, log_r2_key text
);
create index on battles (character_id, finished_at desc);

create table world_history (                    -- the jianghu's past: deaths, successions, felled beasts, archived rumors
  id bigint generated always as identity primary key,
  world_day int not null, kind text not null, npc_id text, body jsonb not null
);
create index on world_history (npc_id, world_day);

create table friendships (a citext, b citext, since timestamptz, primary key (a, b));
create table mail (id text primary key, to_user citext, from_user citext, sent_at timestamptz,
                   body text, parcel jsonb, state text);   -- read model of the hubs
create index on mail (to_user, sent_at desc);

create materialized view leaderboard_power as
  select c.id, c.name, (c.summary->>'power')::int as power, (c.summary->>'rank')::int as rank
  from characters c where c.deleted_at is null order by power desc limit 500;
-- refreshed every 5 min by pg_cron (concurrently, with a unique index)
```

**The Sync Worker** (Queue consumer, `max_batch_size` 100, `max_batch_timeout` 5 s):

- Groups a batch by table and writes each group in **one statement** (`insert … select from unnest($1::text[], …) on conflict … do update … where excluded.rev > saves_current.rev`): one round trip per table per batch, idempotent, and an old message can never overwrite a newer save.
- Retries with backoff; a message that keeps failing goes to a dead-letter queue and an alert. The DOs are still right, so a sync outage loses nothing: the outbox and the queue hold it.

**What Supabase adds that the game cannot have today:** leaderboards (power, wealth, sect, tournament champions), "find a player" for friend requests by name, the economy audit (gold created vs. destroyed per day; a character whose gold outruns the ledger), admin / support views in Supabase Studio, analytics (retention, where players stop in the main story), and backups with point-in-time recovery.

## 5. The shared world without the hot spot

- `WorldObject` keeps running the world (alarm every real hour, echoes, killings). When its revision changes it writes the document to **R2** as `world/<epoch>/<rev>.json` (gzipped, ~9 KB) and tells the hubs the new `rev` (one fan-out message; each hub pushes `world_rev` on the social socket it already has).
- The client fetches `GET /world/<rev>` — **immutable**, served by the edge Worker from the Cache API / R2 with `max-age=31536000, immutable`. Thousands of players cost the `WorldObject` **nothing**; it is touched only by writes.
- Optional: `GET /world/<from>..<to>` as a JSON merge patch when the client is one revision behind (the usual case: a few hundred bytes).
- **Pins** (the people a hero's quests are about) move off the poll: the client sends them with its hub `status` when its quests change; the hub forwards the set to `WorldObject` at most once a minute.
- **The clock.** `now` comes from the socket's `pong` (it already carries the server time), so the browser no longer needs the poll to keep to the server's clock.
- A rolling history: deaths, successions and archived rumors go to `world_history` through the outbox, so the world document itself stays small.

## 6. Saves: smaller, rarer, cheaper

- **Deltas.** The client keeps the last acknowledged save and sends a **JSON merge patch** against its `rev` (`PATCH /characters/<id>/save`); a typical patch after a fight or a purchase is a few hundred bytes. A full save is sent on entry, after a refusal, or when the patch would be larger than the save.
- **Compression.** Bodies over 4 KB are gzipped in the browser (`CompressionStream`) and sent with `Content-Encoding: gzip`.
- **Validation on what changed.** The checks (`check_save`) run on the merged state but skip unchanged sections (the patch says which keys moved), keeping the per-save CPU under a millisecond.
- **Debounce** stays 1.5 s on the client; the DO acknowledges in one local write; Postgres sees at most one write per character per 30 s.
- **Snapshots.** Once a day per active character the DO writes the full save to R2 (`saves/<character>/<rev>.json.gz`) and a `save_snapshots` row: a support tool can restore any day.

## 7. Rooms, battles, hubs

- **Rooms.** Broadcast in **ticks**: collect a room's `moved` events for 100 ms and send one frame per tick (`events: [...]`) instead of one per move. For a full room (64 players) that is ~10 frames/s per socket instead of up to 640. Positions as integers. A per-socket token bucket enforces the move rate on the server (today it is client-side only).
- **Interest management** when rooms grow: send far-away players' moves at 2–4 Hz instead of 10.
- **Battles.** Unchanged in shape (seeded replay is already cheap). The log flushes every 5 s instead of 2.5 s (it only matters at the verdict); the verdict and spoils go to `battles` and `ledger` through the outbox; a log over 64 KB goes to R2.
- **Hubs and parties.** Unchanged; friendships and mail are mirrored to Postgres for "find a player", the mailbox list on a fresh device, and moderation.

## 8. Performance budget

Targets for a player in Bangkok on 4G, measured with `Server-Timing` headers and a small real-user beacon (Workers Analytics Engine):

| Moment | Target (p75) | How |
| --- | --- | --- |
| Title screen visible | < 1.0 s | static HTML + CSS from the edge, script after |
| Game interactive (returning, cached) | < 1.5 s | service worker + hashed files, first data group only |
| Game interactive (first visit) | < 4 s | ~350 KB script + first data group + home map |
| Map change (new region) | < 300 ms | region data and map prefetched by the roads |
| Save acknowledged | < 60 ms | token checked in memory → DO local write |
| World update after a change | < 2 s | push `world_rev` → edge-cached document |
| Another player's step seen | < 150 ms | room tick 100 ms + socket |
| Battle verdict | < 300 ms | DO replay of the last commands only |
| Supabase read model behind the game | < 30 s | coalesced outbox → queue → batched upsert |

**Load on Postgres** at 1,000 players online: saves ≤ 33 rows/s, arriving as ~1 batched statement per second per table; battles and ledger a few rows/s; leaderboards refreshed every 5 minutes. Well inside the smallest Pro instance; the database is never in the request path, so a spike there is invisible to players.

**Load on the hot spot:** the `WorldObject` today takes 1,000 requests a minute at 1,000 players (each advancing the world first); after §5 it takes the hourly alarm, echoes and killings only.

## 9. Plans

Budget is not a constraint (decision 4), so the design uses what performs best: **Workers Paid** (CPU time for long replays, Queues, higher Durable Object limits, Smart Placement, Hyperdrive), **R2** behind the CDN, and **Supabase Pro** in Singapore with point-in-time recovery; Supabase compute can start at the smallest size because the database only takes batched writes and a few cached queries, and grows without touching the game. Vercel is no longer needed.

## 10. The migration, in shippable steps

Each step ships alone and is measured before the next.

| # | Step | Gain |
| --- | --- | --- |
| 0 | `Server-Timing` on every route, a real-user beacon, the bundle report in CI | numbers to compare against |
| 1 | Static export on Workers Static Assets; `public/` to R2 with hashed names; PNG → WebP; atlases; service worker precache by region | the first load (largest win), Vercel gone |
| 2 | Game tables out of the JS bundle into hashed JSON, loaded by group (client and server) | script 1.3 MB → ~350 KB; faster server cold starts |
| 3 | World by revision from the edge cache; `world_rev` pushed on the hub socket; pins via the hub; clock from `pong` | removes the global hot spot |
| 4 | **Server reset (`DATA_EPOCH` 5).** Supabase project (Singapore), schema, Hyperdrive, the `sync` Queue and Sync Worker; outboxes (Rust crate + TS twin) in every object that feeds Postgres | the record, leaderboards, audit, backups |
| 5 | Self-describing tokens verified in the isolate by both halves; socket tickets; edge rate limits | no auth hop on any request |
| 6 | `CharacterObject` per character; delta + gzip saves | smaller, more parallel saves |
| 7 | Room ticks, server-side move bucket, interest management | realtime that scales per room |
| 8 | Leaderboards, find-a-player, admin views; daily snapshots in R2 | features on the new data |

**Existing data: reset** (decision 3). Step 4 raises `DATA_EPOCH` to 5: everyone signs up again on the new server, as with generations 1–3. No export route.

**What does not change:** the engines (`lib/game`, `lib/world`) and their tests, the seeded battle replay, the save format and its version, and the browser-only mode used by `bun dev` and the test suites.

## Decisions

Made by the owner on 2026-10-14:

| # | Question | Decision |
| --- | --- | --- |
| 1 | Accounts | **Own username + password** (as today) — `AccountObject` is the authority, mirrored to Postgres; Supabase Auth maybe later |
| 2 | The Rust half | **Kept, for the realtime and the event-sourced core**: rooms, accounts, characters and saves, the outbox; TypeScript keeps what runs the game's engines |
| 3 | Existing accounts | **Reset** (`DATA_EPOCH` 5 at step 4) |
| 4 | Budget | **Not a constraint**: Workers Paid, R2, Supabase Pro |
