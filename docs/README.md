# Documentation

Start with the [project README](../README.md) for what the game is and how to run it. This page tells you which document answers which question.

## Find what you need

| I want to… | Read |
| --- | --- |
| Play the game and understand every system from the player's side | [Gameplay guide](gameplay.md) |
| Understand how the code is layered and how data flows | [Architecture](architecture.md) |
| Change combat numbers: stats, damage, hit / crit, levels, type conflict, effects | [Combat engine](combat.md) |
| Change the tactics battle: board, turns, ranges, AI, battle UI | [Grid combat](grid-combat.md) |
| Sect lineage quests, story sagas, cutscenes (engine) | [Story quests](story-quests.md) |
| Write a lineage quest or a saga (voice, lore, rules) | [Story writing](story-writing.md) |
| Change scenes, conditions, effects, quests, objectives, quest tracking, random events, law | [World engine](world-engine.md) |
| Change the NPC simulation or rumors | [Liveness Layer](liveness.md) |
| Add a location, NPC, quest, item, recipe, skill, opponent or a whole sect | [Content authoring](content-authoring.md) |
| Look up any location, sect, quest, NPC, skill, item or opponent | [Reference (generated)](reference/README.md) |
| Change the map view, characters, HUD, menus, VFX or styling | [Rendering and UI](rendering.md) |
| Change music or sound effects | [Audio](audio.md) |
| Change install / offline behaviour | [PWA](pwa.md) |
| Change what is saved, or bump the save version | [Save format](save-format.md) |
| Run or write tests, audits and browser checks | [Testing](testing.md) |
| Find a maintenance script and how to call it | [Scripts](scripts.md) |
| See what changed and when | [Changelog](changelog.md) |
| Know the current state, open problems and next steps | [HANDOFF.md](../HANDOFF.md) |
| Follow the art and UX direction | [DESIGN.md](../DESIGN.md) |
| Work on the code with Claude Code (rules, commands, gotchas) | [CLAUDE.md](../CLAUDE.md) |

## All documents

**Guides** (written by hand, kept in step with the code):

- [architecture.md](architecture.md) — layers, modules, stores, the battle bridge, the render boundary.
- [gameplay.md](gameplay.md) — exploration, time, rest, travel, encounters, law and jail, quests and tracking, sects, life skills, crafting, progression, rumors.
- [combat.md](combat.md) — the damage engine: derived stats, formulas, skills, arts, equipment, leveling, type conflict, effects.
- [grid-combat.md](grid-combat.md) — the tactics battle system: rules, engine API, AI, store, renderer and UI.
- [story-quests.md](story-quests.md) — sect lineage quests, story sagas, the cutscene player, paged dialogs and the ตำนาน tab.
- [story-writing.md](story-writing.md) — how to write lineage quests and sagas: the มังกรหยก ภาค 3 framing, voice, rules, Thai names, lore hooks.
- [world-engine.md](world-engine.md) — scenes, conditions, effects, quests, objectives, guide, random events, law, bad actions.
- [liveness.md](liveness.md) — NPC simulation and rumors as built, and how they differ from the spec.
- [content-authoring.md](content-authoring.md) — step-by-step recipes for adding content, with the checks to run.
- [rendering.md](rendering.md) — Phaser stage, world runtime, maps and collision, characters, HUD and menus, VFX, styling.
- [audio.md](audio.md) — procedural music and sound.
- [pwa.md](pwa.md) — manifest, service worker, install button.
- [save-format.md](save-format.md) — persisted keys, version history, migrations, repair on load.
- [testing.md](testing.md) — unit suites, audits, Playwright, how to verify a change.
- [scripts.md](scripts.md) — every script in `scripts/`.
- [changelog.md](changelog.md) — history by pull request.

**Reference** (generated from the data by `bun scripts/build-docs-reference.ts`; never edit by hand):

- [reference/README.md](reference/README.md) — totals and page list.
- [locations](reference/locations.md) · [sects](reference/sects.md) · [quests](reference/quests.md) · [people](reference/npcs.md) · [martial arts and equipment](reference/martial-arts.md) · [items and crafting](reference/items-and-crafting.md) · [opponents](reference/opponents.md)

**Specs and worksheets** (design documents; each says how far the code follows it):

- [specs/liveness-spec.md](specs/liveness-spec.md) — the original NPC simulation + rumor requirement (Thai).
- [specs/liveness-plan.md](specs/liveness-plan.md) — the implementation plan and decisions for that spec.
- [specs/sect-template.md](specs/sect-template.md) — a fill-in sheet for designing a new sect.
- [specs/shaolin-sheet.md](specs/shaolin-sheet.md) — the sheet filled in for วัดเส้าหลิน, as a worked example.
- [specs/location-concepts.md](specs/location-concepts.md) — the original location concept list with Chinese names and notes.

**Elsewhere in the repo:**

- [review/README.md](../review/README.md) — past critic reports and screenshot evidence (historical).
- [public/art/README.md](../public/art/README.md) — where the generated artwork came from, with prompts.

## Keeping the docs true

- After changing game data, run `bun scripts/build-docs-reference.ts` and commit the pages it rewrites. `--check` exits 1 when they are stale.
- When you change a system, update its guide in the same pull request, and add a line to the [changelog](changelog.md).
- Guides point at files and functions by name (`lib/world/quest-guide.ts`, `guideForQuest`) so a search finds the code. Keep names exact.
