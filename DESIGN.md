# Design direction

The art and UX direction of กำลังภายใน, and the decisions that shape how it looks and feels. How the code implements it is in [docs/rendering.md](docs/rendering.md) and [docs/grid-combat.md](docs/grid-combat.md); history is in [docs/changelog.md](docs/changelog.md).

## Contents

- [Visual direction](#visual-direction)
- [The interface](#the-interface)
- [Characters and scale](#characters-and-scale)
- [Maps and movement](#maps-and-movement)
- [Battles](#battles)
- [Sound](#sound)
- [First session](#first-session)
- [Principles that hold](#principles-that-hold)
- [Evidence and review](#evidence-and-review)
- [Artwork provenance](#artwork-provenance)

## Visual direction

- **Setting.** Detailed 32-bit-era pixel characters in warm Chinese courtyards, market streets and mountain landscapes.
- **Palette.** Jade, lacquer, muted gold and warm earth. Thai names, story, geography and progression are the game's identity.
- **Benchmark.** *Hero's Adventure: Road to Passion* is the single reference for:
  - coherent character-to-world scale;
  - perspective;
  - pixel texture;
  - expressive character staging;
  - clear battle decisions.

  It is a quality bar, not a source of assets and not a claim of parity.

## The interface

The interface follows a **Dragon Quest XI** reading of that direction:

- **HUD chrome** is dark lacquer (`#2a1611`) with a bronze edge and gold hairlines. It uses rounded boxes, pills and round buttons, kept small and in the corners so the map stays visible:
  - the icon grid at the top left;
  - purse, sundial and day at the top right, with the tracked quest under them;
  - law chips at the top centre;
  - a thumb column at the bottom right: rest, the context action, the controls pill.
- **Menus, shops and popups** are **parchment scrolls** with cinnabar ribbon titles, opened as one full-screen tabbed shell (keys 1–7).
- **Conversation** is a full-screen lacquer box: a portrait bust beside the lines and choices. The text shrinks (down to 62 %) until nothing scrolls. Local conversations keep the live town underneath.
- **Mobile first.** It works in both orientations, with no CSS rotation.
  - A floating joystick on the left half of the screen, and tap-to-walk.
  - One context button for the nearest thing.
  - The จุดหมาย list offers every map action in tabs, which also serves keyboard users.
  - Safe-area insets respect notches.
- **Busy feedback.** Gathering, crafting, practice, rest, jail work and stealth show the hero at work, with a progress bar that blocks input for the action's duration.
- **Type.** Charm for headings of 16 px or more; Sarabun for body text. Small Thai text never uses Charm, because tone marks blur.
- **No party card, status strip or minimap on the map.** HP and MP live in the profile and in battle. Guidance comes from the quest tracker and the jade guide arrow.

## Characters and scale

- **Heroes.** Eight heroes (`m1`–`m4`, `f1`–`f4`) have 24 poses:
  - idle 4 and a horizontal walk 4 (mirrored for left);
  - attack 4;
  - hurt, guard, victory and defeat;
  - north walk 4 and south walk 4.
- **Other sheets.** Four archetypes (elder, monk, merchant, bandit) and three townspeople (Feng, Wang, Qing) have 16 poses — 304 poses in all.
- **Readability v2** (adopted 2026-09-29) enlarged faces and hands, so figures read at 60–70 px. m4, f2, f3 and f4 still use their older north / south sheets, calibrated to the new height — the one remaining visual mismatch.
- **Atlas scaling.** Each sheet is scaled once (median standing height 108 px in a 128 px cell, feet at 120), never pose by pose. Texture sampling is nearest-neighbour, and world characters get a warm ink tint to sit in the painted scenery.
- **NPCs.** Every NPC who matters has a painted portrait and a unique single-pose world sprite (159 ids). Archetype sheets are the fallback. The hero wears a small ivory chevron to stand out among similar costumes.
- **Scale on screen.** The camera is cover-fit to the 960 × 640 map, so a 56-unit hero is about 50–85 screen pixels tall, depending on the window.
- **One caption at a time** (hovered, targeted, last used or nearest) keeps the map clean. Every NPC also has a small green name tag.
- **Deferred art.** North / south direction sheets load only when the hero actually needs them (7.2 MB for the four male heroes, 13.5 MB for all eight).

## Maps and movement

- **Paintings.** Every location except the `world_journey` hub has a painting. Three are hand-authored (home, the capital, the jail); 98 use a convention-based auto layout. Roads use seven painted road types, colour-graded by region and mirrored for variety.
- **Collision.** All 101 maps have collision footprints (850 generated shapes plus the hand-authored ones). Walking slides along walls, and tapping plans a path around them.

  Foreground occlusion (the hero walking behind a roof or stall) exists only on home and the capital.
- **Lighting.** A flat night veil, with lantern pools on home and the capital. This is a stylized pass, not dynamic lighting.
- **Story props.** Small changes appear in the world only where a quest result is real: the clinic's supplies and a waiting patient after the errand; the archive chest, open once the ledger is recovered.
- **Positions.** The hero's spot on each map is remembered for the session, never in the save. After a reload inside a conversation, the hero reappears beside the speaker, facing them.

## Battles

- **The board.** Battles are tactics on a 10 × 7 board (up to 15 × 10 when a gang joins), drawn in 2.5D perspective over a painted background:
  - the capital training yard for the beginner duel;
  - a capital street for capital fights;
  - the jade courtyard otherwise.
- **Turns.** The turn order is visible as a portrait timeline. On your turn, blue tiles show where you can move, red tiles where you can aim, and orange tiles the area a cast will hit.
- **Actions.** Skill cards show range, cooldown and MP. รอ, ถอยหนี and อัตโนมัติ are always one tap away.
- **Motion.** Character atlases play their own clips. Beasts and unique stills get procedural bob, hop, lunge, flash and fall.
- **VFX.** Every cast has an effect built from three things: the skill's **tier** (palette and layers, up to a stage-dimming tier-4 pillar), its **weapon family** (the shape) and its **element** (the accent).
- **Pacing.** AI turns play one beat at a time so the player can follow them.
- **Reduced motion.** It turns off VFX and camera shake and shortens the timings.

## Sound

All sound is procedural:

- pentatonic loops for the title, exploring, night and battle;
- jingles for encounters, victory, defeat, quests and level-ups;
- skill sounds derived from the same profile as the skill's VFX.

Nothing plays until the first tap. See [docs/audio.md](docs/audio.md).

## First session

The capital is built to teach the loop without a tutorial overlay:

1. **Clinic errand.** Physician Lin → magistrate Wu → Lin. It pays 80 gold, 3 herbs, 20 w-exp and +2 relationship, and leaves supplies and a patient visible at the clinic.
2. **Free training duel.** Offered in the capital hall against a fixed beginner (apprentice อาเฉิง). It is non-fatal, never appears in random encounters, and can be won once.
3. **First upgrade.** The w-exp from the duel buys the first skill upgrade. The upgrade card shows the real before-and-after numbers.
4. **Beyond.**
   - The capital's ledger investigation (interview Qing, borrow a key, open the chest, report to Wu) pays 150 gold, 30 w-exp and 8 relationship, once.
   - The rumor spot at the inn introduces the lore.

Guidance for this and every other quest comes from `lib/world/quest-guide.ts`, shown in three places: the quest log (🎯 what / 📍 where / ➤ นำทาง), the HUD tracker and the map arrow. The older floating journey guide was removed.

## Principles that hold

- **Atomic travel.** Travel is a world action: a road's effects and its stamina / time cost commit together, or not at all.
- **No free wins, no hidden costs.** Shop and bag labels show the exact effect numbers. Rewards shown on the quest receipt are capped at what the quest actually grants, and the receipt never replays from a loaded save.
- **Conversations can't be skipped by accident.** The close control appears only when leaving is really free: an effect-free way back, or a terminal dialog. Required story choices can't be bypassed.
- **Defeat.** A non-fatal defeat (spars, the law, a failed steal) leaves at least 1 HP. A fatal one (random encounters, hunters, hunts, failed assassination or kidnapping) ends the run.
- **Save discipline.** Renderer objects, GPU resources and walking positions never enter a save. Old saves keep working: new fields get defaults, and removed content is dropped on load.
- **Accessibility.**
  - Every map action is also a button in the จุดหมาย list.
  - Dialogs trap focus and return it.
  - Reduced motion is honoured in the map, the battle and CSS.
  - Player names are escaped in battle logs.

## Evidence and review

The visual and UX review loop of 2026-09-28/29 is kept in [review/](review/README.md): critic reports, JSON and text evidence, and drivers. It is history — every report predates the Phaser port and the grid battle.

Today's checks are automated:

- 16 `bun run test:*` suites;
- 19 Playwright browser tests (movement, all eight heroes' animations, menus pausing the map, travel, grid battles by tap and auto, touch and rotation, save migration, the opening loop, law and jail, quest tracking, audio and offline PWA);
- content audits.

See [docs/testing.md](docs/testing.md). Browser tests have only run on Chromium with emulated phone viewports, not on physical phones. The campaign's hundreds of quests are checked by the quest audits, not all played by hand.

## Artwork provenance

Generated artwork — the courtyard, the capital battle settings, the creature atlas, the character sheets and direction supplements, and the story props — was made with the built-in image tool, with the source PNGs kept.

- **Prompts and subjects:** [public/art/README.md](public/art/README.md), [character sheets](public/art/characters/README.md), [townspeople](public/art/characters/townspeople.md), [Qing](public/art/characters/qing.md), [capital battle settings](public/art/battle-capital.md), [clinic supplies](public/art/props/README.md), [archive chest](public/art/props/archive-chest.md) and [open chest](public/art/props/archive-chest-open.md).
- **Scripted art:** the jail map is painted by `scripts/build-jail-map.ts`, and NPC pixel sprites are derived from their paintings by `scripts/build-npc-sprites.ts`.
- **Commercial screenshots** are review evidence only and never shipped as game art.
