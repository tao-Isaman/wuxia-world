# Artwork provenance

Where the generated artwork in `public/art/` came from, with the prompts used. All of it was made with the built-in image generation tool for this project; commercial reference screenshots were used only for review and are not shipped.

| Asset | Used by | Provenance |
| --- | --- | --- |
| `jade-courtyard.png` | title screen, default battle background | [below](#jade-courtyard) |
| `creature-atlas.png` | beast units in battle | [below](#creature-atlas) |
| `battle-capital-training.png`, `battle-capital-street.png` | capital battle backgrounds (`lib/stage/battle-background.ts`) | [battle-capital.md](battle-capital.md) |
| `characters/*.png` | hero, archetype and townspeople sprite sheets (`lib/characters/catalog.ts`) | [characters/README.md](characters/README.md), [townspeople.md](characters/townspeople.md), [qing.md](characters/qing.md), the `*-readability-v2*.md` notes |
| `props/clinic-supplies.png` | capital story prop (`lib/stage/world-vignettes.ts`) | [props/README.md](props/README.md) |
| `props/archive-chest.png`, `props/archive-chest-open.png` | capital story prop | [archive-chest.md](props/archive-chest.md), [archive-chest-open.md](props/archive-chest-open.md) |

Not documented here: the location and road paintings in `public/maps/`, the NPC portraits and bodies in `public/npcs/`, the icons in `public/icons/`, and the jail map (`public/maps/jail.png`, painted by `scripts/build-jail-map.ts`). The unique NPC sprites in `public/npcs/pixel/` and `pixel-battle/` are derived from `public/npcs/body/` by `scripts/build-npc-sprites.ts`.

## Jade courtyard

`jade-courtyard.png`: generated with the built-in imagegen tool for this project's title screen and battle stage. The original remains in the local generated-images directory. Existing character and location artwork is retained.

## Generation prompt

Create a production game environment bitmap, landscape 16:9, for a Thai-language Chinese wuxia RPG. Detailed 32-bit-era pixel art with intentional hard square pixel clusters, richly layered colors and precise dithering, comparable to beautifully crafted late-1990s 2D RPG environments. No smooth painted surfaces, no photography, no vector shapes. Scene: a secluded martial-arts mountain courtyard at dawn, broad stone fighting terrace in the foreground, low jade-green tiled roofs and weathered red timber pavilion at the right, ancient pine framing upper corners, a distant winding river and layered blue-green mist mountains, pale peach morning sky. Warm golden light catches roof tiles and individual stones, deep forest green shadows, small vermilion lantern accents. Side-view / slight elevated game battle-stage perspective: large open horizontal stone terrace along bottom third suitable for two standing fighters, distant scenery above. Keep left center atmospheric and uncluttered for a title UI overlay. No characters, text, symbols, logos, UI, frames, watermarks. Full-bleed finished pixel-art environment, crisply defined tiles and foliage, suitable both as title-screen backdrop and battle stage.

## Creature atlas

`creature-atlas.png`: 12 beasts painted one by one with gpt-image-2 in the style of the NPC art (a villain body as the style reference), side view facing left on white, then built by `bun scripts/build-creature-atlas.ts --from <dir>` (`<dir>/b0.png` … `b11.png`): cut out, sized by kind, quantised to 48 colours with hard alpha and a 1 px dark outline, on a 4 × 3 grid of 160 px cells (`CREATURE_ATLAS` in `lib/characters/catalog.ts`). `creatureFrameFor` in `lib/world/battle-looks.ts` picks the cell: 0 wolf, 1 tiger, 2 bear, 3 boar, 4 snake, 5 fowl, 6 raptor, 7 bat, 8 hare, 9 squirrel, 10 wild cat, 11 centipede.

Prompt (per beast): "Paint ONE animal in exactly the same art style as the reference image: a semi-realistic painted Chinese wuxia RPG illustration, rich muted natural colours, fine detail, soft lighting. Side view, the animal FACING LEFT, its whole body visible and centred, plain flat pure white background (#FFFFFF) everywhere, no ground, no shadow, no text, no frame. The animal: …"
