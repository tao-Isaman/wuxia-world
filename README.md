# กำลังภายใน — ยุทธภพ

A Thai-language wuxia RPG that runs in the browser. You walk a painted world of cities, sects, mountains, caves and islands. You take quests, join one of fifteen sects and learn its martial arts, gather and craft, and fight turn-based **tactics battles** on a tile board.

- **Built with** Next.js 15, React 19, TypeScript, Phaser 4, Zustand and Tailwind; runs on Bun (Node 20+ also works).
- **Look.** Pixel art with a Dragon Quest XI–style lacquer HUD and parchment menus.
- **Language.** Every word the player reads is Thai.
- **Install.** The game installs as a full-screen app and plays offline once visited.

## Quick start

```bash
bun install
bun dev            # http://localhost:3000
```

A new game starts at the hero's home (`home_player`), next door to the capital (`city_capital`). The first session usually runs through:

1. Physician Lin's clinic errand.
2. A free training duel at the capital hall.
3. The first skill upgrade with earned w-exp.

## Commands

| Command | Does |
| --- | --- |
| `bun dev` | development server on :3000 |
| `bun run build` / `bun start` | production build / serve it |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint (app, components, lib) |
| `bun run test:<suite>` | unit suites — `runtime`, `combat`, `opening`, `navigation`, `battle-background`, `rumors`, `investigation`, `audio`, `law`, `walk`, `grid`, `grid-ai`, `grid-skills`, `grid-store`, `npcs`, `story`, `quests`, `docs` |
| `bun run test:e2e` | Playwright browser tests on :3017 — run `bun run build` and `bun run start -p 3017` first |
| `bun scripts/audit-content.ts` | check every content reference resolves |
| `bun scripts/build-docs-reference.ts` | regenerate the content reference in `docs/reference/` |

What each suite covers and how to run e2e: [docs/testing.md](docs/testing.md). Every script: [docs/scripts.md](docs/scripts.md).

## What's in the game

| | |
| --- | --- |
| **World** | 101 places (96 on the world map), joined by 128 hand-named roads; 100 painted maps with collision; day and night on a 12-ชั่วยาม clock |
| **People** | 225 NPCs with portraits and sprites, some strolling about their spot, each with gift tastes; 20 of them (the sect masters) age, train, feud and die in a weekly background simulation |
| **Quests** | 882 quests: a 15-chapter main story plus 1 older main quest, 526 side (97 sect quests and 154 lineage quests that pass on every sect skill and art up to tier 3) and 340 story chapters, with item, kill, visit, objective and dialog stages; any quest can be tracked, with a HUD tracker and a map arrow |
| **Story sagas** | 38 sagas of 8–10 chapters, one per tier-4 sect skill or art, retelling legends of มังกรหยก ภาค 3 (304 cutscenes in all, with the main story's) played on the painted maps |
| **Sects** | 20 sect grounds; 15 are joinable, each with an intro quest, a rank ladder (rank-ups pay gold and open the sect's lineage quests), repeatable sect quests, and hunters for betrayers |
| **Combat** | turn-based tactics on a 10 × 7 board, up to 15 × 10 for big gangs. Per-unit turn order by speed; move and cast with ranges and areas; enemy packs; retreat; auto-play |
| **Martial arts** | 173 move skills and 111 inner arts in tiers 0–4 (three tier-5 arts). Levels 1–10, weapon mastery, type conflict; 76 pieces of gear |
| **Life** | 19 life skills, 25 gathering nodes, 49 artisans with 32 recipes, 19 shops, 7 city halls, 126 items |
| **Danger** | random encounters while walking, scaled to your progress; stealing, assassination and kidnapping; wanted marks, law pursuers and a jail map |
| **Rumors** | inns carry news of the masters' deeds, the hero's own echoes, and old lore |
| **Sound** | recorded main theme, battle and desert songs (MP3, ~11 MB) over procedural pentatonic music, jingles and synthesized skill sounds |

How all of it plays, with the numbers: [docs/gameplay.md](docs/gameplay.md). Every place, person, quest, skill, item and foe: [docs/reference/](docs/reference/README.md).

## How the code is organised

```
app/, components/        React: screens, HUD, menus, popups, battle UI
store/                   Zustand: world (saved), battle, character (/debug), loading, toast, confirm
lib/game/                pure combat engine (+ grid/ tactics engine, data/ tables)
lib/world/               pure story engine (+ data/ content tables); battle-bridge.ts joins world and battle
lib/stage/               Phaser renderers for the map and the battle board, collision, VFX
lib/characters/          sprite atlases and animation
lib/audio/               procedural music and sound
public/                  maps, art, portraits, icons, the service worker
scripts/                 tests, audits, generators, tools
tests/browser/           Playwright specs
docs/                    guides, generated reference, specs, changelog
```

The engines are plain TypeScript with no React or I/O. Stores wrap them, and components read the stores. The world state saves to `localStorage` (save version 23). Details: [docs/architecture.md](docs/architecture.md).

## Documentation

Start at **[docs/README.md](docs/README.md)** — it maps every question to a document. The main guides:

| Guide | For |
| --- | --- |
| [Gameplay](docs/gameplay.md) | every system from the player's side |
| [Architecture](docs/architecture.md) | layers, stores, data flow |
| [Combat engine](docs/combat.md) · [Grid combat](docs/grid-combat.md) | damage and effects · the tactics battle |
| [World engine](docs/world-engine.md) · [Liveness Layer](docs/liveness.md) | scenes, quests, encounters, law · NPC simulation and rumors |
| [Content authoring](docs/content-authoring.md) | adding places, people, quests, items, skills, sects |
| [Rendering and UI](docs/rendering.md) · [Audio](docs/audio.md) · [PWA](docs/pwa.md) | the map, HUD and menus · sound · install and offline |
| [Save format](docs/save-format.md) · [Testing](docs/testing.md) · [Scripts](docs/scripts.md) | saves and migration · checks · tools |
| [Changelog](docs/changelog.md) | what changed, by pull request |

Top-level documents:

- [HANDOFF.md](HANDOFF.md) — current state, known issues, next steps.
- [DESIGN.md](DESIGN.md) — art and UX direction.
- [CLAUDE.md](CLAUDE.md) — working rules for Claude Code.
- [ONBOARDING.md](ONBOARDING.md) — getting a new teammate started.

## Other routes

- **`/debug`** — a combat sandbox. Build two characters (stats, slots, gear) and fight them on the grid. It is separate from the world save.
- **`/progress`** — the old development journal and a character animation gallery; its data stopped at wave 11.

## License and credits

Sect, skill and inner-art names draw on wuxia fiction — Jin Yong (金庸) and Gu Long (古龙) — and the *9 Yin* / *JY Online* games. The author hand-wrote the combat numbers first in the single-file prototype `demo.html`; the rebuild ports them.

The artwork was generated for this project; provenance and prompts are in [public/art/README.md](public/art/README.md). This is a single-author personal project and a work in progress.
