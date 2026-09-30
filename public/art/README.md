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

`creature-atlas.png`: generated with the built-in imagegen tool, with alpha preserved. Four columns and two rows; the battle renderer (`lib/stage/grid-battle-runtime.ts`) draws one cell per beast, chosen by `creatureFrameFor` in `lib/world/battle-looks.ts` (0 generic, 1 tiger, 2 bear, 3 boar, 4 snake, 5 fowl, 6 raptor, 7 bat), without creating derivative asset files. The eight archetypes are reused for the existing beast roster.

Prompt: Production sprite atlas for a detailed 32-bit pixel-art wuxia RPG. Exactly 8 enemy creature sprites arranged on an exact evenly spaced 4-column by 2-row grid. Transparent background with real alpha; no checkerboard painted in. Every sprite must fit inside its own equal-sized cell with generous empty padding and all feet aligned near the lower part of the cell. Side view / slight three-quarter, all creatures face left for a 2D battle stage. Row 1 left to right: grey wolf, orange striped tiger, bulky brown bear, dark wild boar. Row 2 left to right: green coiled venomous snake with raised head, wild golden rooster, pale giant eagle, dark bat with wings spread. Mature detailed pixel art, clean hard square pixel clusters, rich natural color shading, a few warm highlights, dark edge definition. Consistent pixel density and lighting across all eight sprites. No people, scenery, shadows outside cells, text, numbers, frames, separators, UI, labels, or watermarks. Wide landscape sheet.
