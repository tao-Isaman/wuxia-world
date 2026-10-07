# Rendering and UI

How the game is drawn and operated: the Phaser stage, the world map runtime, collision, characters, map signs, the HUD, menus and popups, and the styling layers. The battle board's renderer is described in [grid-combat.md](grid-combat.md#renderer).

## Contents

- [Files](#files)
- [Screen flow](#screen-flow)
- [The Phaser stage](#the-phaser-stage)
- [The world runtime](#the-world-runtime)
- [Maps](#maps)
- [Navigation and collision](#navigation-and-collision)
- [Placed objects](#placed-objects)
- [Characters](#characters)
- [Map signs and markers](#map-signs-and-markers)
- [HUD](#hud)
- [Menus and popups](#menus-and-popups)
- [Overlays](#overlays)
- [Controls](#controls)
- [Styling](#styling)
- [Public assets](#public-assets)
- [The /progress page](#the-progress-page)
- [Rules for this layer](#rules-for-this-layer)
- [Known issues](#known-issues)

## Files

| Area | Files |
| --- | --- |
| Stage | `lib/stage/phaser-stage.ts` (`createStage`, `canvasTexture`, `addGridFrames`, `drawCanvas`, `stagePixelRatio`) |
| World runtime | `lib/stage/world-runtime.ts` (`createWorldRuntime`); host React component `components/game/world-canvas.tsx` |
| Pure world helpers | `lib/stage/types.ts` (markers, `WALK_TICK_UNITS`, session map positions), `world-navigation.ts`, `world-footprints-data.ts`, `world-placement.ts`, `world-map-probe.ts`, `map-anchors.ts`, `world-occlusion.ts`, `world-lighting.ts`, `world-vignettes.ts`, `world-style.ts` |
| Placed objects | `lib/assets/placement-geometry.ts` (pure, shared with the map editor), `lib/assets/map-placements.ts` (loader), `components/world/use-map-placements.ts` — see [Placed objects](#placed-objects) |
| Battle renderer | `lib/stage/grid-battle-runtime.ts`, `battle-vfx.ts`, `status-vfx.ts` (a look for every buff / debuff: icon row above the unit, auras, shield bubble, ward runes, rage glows, apply bursts and expire fades, proc bursts and floating Thai labels; catalog `lib/ui/status-catalog.ts`; host `data-statuses` / `data-procs`), `cast-vfx.ts` (pure), `hero-motion.ts` (pure), `battle-background.ts` (pure); host `components/game/battle-canvas.tsx` |
| Cutscenes | `lib/stage/cutscene-runtime.ts` (`createCutsceneRuntime`); host `components/world/cutscene-player.tsx` (+ `.module.css`) — see [story-quests.md](story-quests.md#cutscenes) |
| Characters | `lib/characters/catalog.ts`, `sheet.ts`, `walk-cycle.ts`; `components/game/character-preview.tsx` |
| World UI | `components/world/` — `world-screen.tsx` (root), `location-view.tsx`, `location-map.tsx`, `route-map-view.tsx`, `route-view.tsx`, `dialog-stage.tsx`, `choice-panel.tsx`, `encounter-screen.tsx`, `map-hud.tsx`, `menu-bar.tsx`, `quest-tracker.tsx`, `quest-log.tsx`, `rest-quick-action.tsx`, `quest-completion-receipt.tsx`, `confirm-dialog.tsx`, `loading-overlay.tsx`, `toast-stack.tsx`, rumor components, `popups/` |
| Touch | `components/game/touch-stick.tsx` |
| UI primitives | `components/ui/` (shadcn-style), `components/ui/wuxia/`, `lib/ui/rarity.ts` |
| Styles | `app/*.css`, `components/world/dialog-stage.module.css`, `components/world/popups/upgrade-payoff.module.css`, `tailwind.config.ts` |

## Screen flow

`app/page.tsx` renders `MobileLandscape` → `<main>` with the heading, `<WorldScreen />`, `<QuestCompletionReceipt />` and `<SoundDirector />`. It calls `initBattleBridge()` once.

`WorldScreen` (`components/world/world-screen.tsx`) picks one view, in this order:

1. **Not hydrated yet** — a "กำลังโหลด..." panel.
2. **`!hasGame`** — `StartScreen`: name, gender, four bodies per gender with a large animated preview, install and sound buttons.
3. **`gameOver`** — `GameOverScreen` (legacy: death no longer sets it, and older saves stuck there are revived on load). A fall shows `DeathReport` (ฟื้นคืนสติ: what was lost) over whichever view comes next.
4. **`pendingBattle`** — while the battle store is empty, `MapBackdrop` + `<BattleBriefingScreen />` (the foe and both sides' power tiers; เข้าต่อสู้ / F / Enter calls `ensureBattleStarted()`); once it runs, `MapBackdrop` + `<BattleArena mode="world" onContinue={acknowledgeBattleResult} />`.
5. **`pendingEncounter`** — `MapBackdrop` (status HUD only) + `EncounterScreen`: portrait, tier chip coloured by rarity, ⚔ ต่อสู้ (F / Enter) and 🏃 หนี (Esc).
6. **Unknown scene** — "ไม่พบฉาก …" + a restart button.
7. **A location with a painted map** — `LocationView` over the Phaser canvas. A dialog that continues a conversation at that place keeps the **same keyed canvas** mounted, read-only, with `DialogStage` on top.
8. **Any other dialog** — `MapBackdrop` (the place's painting at 40 %) + `DialogStage`, titled by the first speaker.
9. **A road with a painting** — `RouteMapView`.
10. **Otherwise** — the classic cream card layout (`StatusBar`, `MenuBar`, `LocationView` / `RouteView`). Only `world_journey` and 14 unpainted roads reach it.

`LoadingOverlay`, `ToastStack` and `ConfirmDialog` are mounted beside every branch.

### Dialogs

`DialogStage` uses the cutscene layout over the live scene (`dialog-stage.module.css`): black letterbox bars top and bottom (11 vh, 8 vh on phones), the place name and the controls (**ต่อ**, **ข้าม**, **จบบทสนทนา ×**) in the top bar, the speaker's portrait standing at the left and fading into the scene, the speaker's name tab over a film subtitle box at the bottom, and the choices in a column beside the box (under it on narrow screens). The whole section is the tap target.

- **The conversation standard.** Every NPC talk, quest offer, hand-in and story beat plays **one line at a time**, typed out like a film's subtitles: 2 characters every 22 ms, or at once under `prefers-reduced-motion`.
  - Lines longer than 140 characters are cut between words into more beats (`splitBeats`).
  - Tapping anywhere outside a button (the words are `dialog-lines`), Enter or Space finishes the typing, then moves on. **ต่อ ▶ (n/m)** (`dialog-next-page`) moves on at once. **ข้าม ⏭** (`dialog-skip`) jumps to the last line.
  - The choices appear after the last line, which stays on screen beside them.
  - The host shows `data-page`, `data-pages` (beats) and `data-typing`.
  - `localStorage["wuxia-dialog-instant"] = "on"` shows all lines at once (fast text). `playwright.config.ts` seeds it for the suite; `dialogue.spec.ts` turns it off.
- **Key words.** `RichText` (`components/world/rich-text.tsx`) colours the key words in dialogue lines, choices and film subtitles via `markText` (`lib/world/text-marks.ts`):
  - `**marked**` words: gold;
  - people (NPCs): jade;
  - places: sky blue;
  - items: amber;
  - sects: coral;
  - moves and arts: violet;
  - foes: red;
  - numbers: pale gold;
  - the age's terms (คัมภีร์, หอคัมภีร์หลวง, องครักษ์เสื้อแพร…), marked as key.

  Classes are `.text-mark-<kind>` (`app/game-hud.css`). `{hero}` in a line is marked too.

- Text shrinks in 0.06 steps to a floor of 0.62 until nothing scrolls, with a scroll hint if it still overflows.
- "จบบทสนทนา ×" and Esc appear only when leaving is free: an effect-free choice back to the last place, or a terminal dialog.
- Tab is trapped inside the dialog, and focus returns to the canvas afterwards.

## The Phaser stage

`createStage(parent, background, { create, update, contextLost, error })` makes one `Phaser.Game` per view:

- **Renderer.** `Phaser.AUTO` (WebGL when possible, else Canvas), `pixelArt`, no antialias, `powerPreference: "low-power"`, audio off.
- **Input off.** Phaser input is disabled; the runtimes listen to DOM pointer and key events themselves.
- **Buffer.** `Scale.NONE`, with the drawing buffer = host CSS size × `min(devicePixelRatio, 2)`. The canvas is styled 100 % and pixelated.
- **Context loss.** A `webglcontextlost` event raises `contextLost`; the host shows "ลองใหม่". Recovery is manual (no automatic retry).
- **Helpers.** `canvasTexture` (a DOM canvas → texture), `addGridFrames`, `drawCanvas`.

Both runtimes are loaded with a dynamic `import()` in the browser only. The host publishes `data-renderer-backend` (`webgl` | `canvas`).

## The world runtime

`createWorldRuntime(parent, read, onReady, onError, onNearby?, onWalkTick?)` returns `{ interact, tapAt, setStick, destroy }`. It calls `read()` every frame, so labels, props, time and markers update without a rebuild. The host (`world-canvas.tsx`) rebuilds it only when the map key, image, hero image, marker / prop / bystander signature, or retry count changes.

- **Map space.** 960 × 640 units, y down. The hero walks 150 units/s; walkable bounds are x 12–948, y 18–628.
- **Camera.**
  - Cover-fit and then zoomed in by `MAP_ZOOM` (√5): `scale = max(w/960, h/640) × √5`, so about a fifth of the map's area is in view. It follows the hero, clamped to the map.
  - Labels, name tags, quest marks, the guide arrow and marker badges divide by the scale, so they keep their on-screen size.
  - Smoothing `1 − e^(−8·dt)`; it snaps under reduced motion.
  - The authored `zoom` on map definitions is **not** used.
- **Pause.** Input stops while `readOnly`, the tab is hidden, or `worldInputBlocked()` is true: any `[role="dialog"]`, `[role="alertdialog"]` or `[data-world-busy]` element is present, or a text field has focus. Queued walks are cancelled.

  The rest bubble, sound bubble and places list are not dialogs, so they do not pause the map.
- **Movement.**
  - Keys and the stick slide along walls (`moveOnWorldGround`).
  - A tap plans a path (`planWorldPath`).
  - Tapping a marker walks to its approach point (NPC ±38 x; service +34 y; exit +10 y) and activates it on arrival, turning NPCs to face the hero.
  - A disabled marker activates at once, which shows its explanation.
- **Picking.** Hit boxes are 50 × 76 for NPCs and 44 × 52 for others; overlaps go to the front-most marker.
- **Nearby.** The nearest marker within **95** units drives the action button (`onNearby`, `data-nearby-marker`). **E** uses the last-used marker, else the nearest within 100.

  NPCs within 90 units face the hero. Signs 230+ units away fade to 50 %, and disabled markers draw at 50 %.
- **Wandering NPCs.** The 65 rigged NPCs (see NPC looks below) stroll around their map spot (`lib/stage/npc-wander.ts`): a standable point within 34 units of home (flattened vertically), at 36 units/s, then a 1.5–4.5 s pause, with a seeded random per NPC. They play the walk clip for the way they head (north / south rows included).
  - A wanderer stands still while the hero is within 120 units, while the hero is walking to it or hovering it, while the map is paused or read-only, and under `prefers-reduced-motion`. It never steps onto blocked ground or within 36 units of the hero.
  - Picking, the action button, **E**, the approach point, the guide arrow and the nearby bounds all use the NPC's current spot (`markerPoint`), not the authored one.
  - `data-wandering-npcs` publishes `{ markerId: [x, y] }` for tests.
- **Walk ticks.** Every 220 units actually walked, the runtime calls `onWalkTick()`, which calls `useWorldStore.getState().walkTick()` (random encounters, see [world-engine.md](world-engine.md#random-encounters)).
- **Positions.** The hero's spot on each map is remembered for the session only (never saved).
  - Leaving by an exit forgets that map's spot.
  - A new game clears all spots.
  - After a reload inside a conversation, `initialWorldPlacement` puts the hero 28–64 units beside the speaker, facing them.
- **Depth.**
  - Map painting at −1; shadows, halos (selected or near NPCs) and the target ring below.
  - Characters, props and bystanders by foot y (`100 + y·10`; the hero `101 + y·10`), and placed objects of the "object" layer by their base y on the same scale; "ground" placements at −0.9…−0.1, "overhead" ones at 7000–7064 (see [Placed objects](#placed-objects)).
  - Signs at 8000, the night veil at 8900, dust motes at 9000.
  - Always-on green NPC name tags at 9010; quest marks (gold **!**, white **?**) at 9011; the guide arrow at 9012.
  - One boxed caption at 10000: hovered, else the walk target, else the last used, else the nearest within 105.
  - The hero's ivory chevron at 10001; the off-screen guide pointer at 12000.
- **Sizes.** Hero 56 units tall; archetype NPCs 54; bystanders 51; unique NPC sprites 50.
- **Roaming foes.** `presentation.foes` (the store's `roamingFoes` for this map) is read every frame, so foes appear and vanish without a rebuild. Each is drawn from its `foeLook` (the same look as in battle): a character sheet idling and turning to watch the hero, or a creature-atlas frame breathing, tinted and sized by the look, with a red ⚔ name tag at 9020. Within 30 units of the hero (`FOE_TOUCH`) it calls `onEngage` once. The runtime also picks their spots for the store (`pickFoeSpot`: 150–320 units away, unblocked, reachable, clear of markers and other foes) through the walk-tick callback. A tap on a foe's sprite walks the hero into it, ahead of any marker under it (`foeAt`). They wait on roads too (`RouteMapView`, via `roamingFoesOn` in `components/world/roaming-foes.ts`). A beast is cropped to its painted pixels at its atlas cell's scale.
- **Guide arrow.** A jade arrow bobs over the marker flagged `guide` (the tracked quest's target). When that marker is off screen, a pulsing edge pointer turns toward it. Published as `data-guide-marker`.
  - **Never under the HUD.** HUD boxes over the map carry `data-hud-occluder` (the vitals + menu stack, purse and sundial, quest tracker, law chips, rest button, action button, places control, the extras button); the runtime measures them once a frame while the guide needs them (`hudOccluders`; boxes come and go — the action button appears beside a marker). An arrow they would cover turns into the edge pointer, and the pointer slides in along its ray toward the screen centre — still pointing the same way — until it clears every box. Its host-pixel spot is published as `data-guide-edge` (`x,y`). Give any new HUD box over the map `data-hud-occluder`.
- **Occluders.** Foreground cut-outs from the painting, sorted against feet (`world-occlusion.ts`). Only `home_player` and `city_capital` have them.
- **Lighting.** A flat veil over the scene (`world-lighting.ts`). Night fades in from ชั่วยาม 8 and is full from 9. Lantern pools exist only on `home_player` and `city_capital`; they flicker at about 10 fps, except under reduced motion.
- **Vignettes.** `capitalVignette` (`world-vignettes.ts`) adds story props on `city_capital` only:
  - clinic supplies and a waiting elder once the clinic errand is done;
  - the archive chest, closed or open by `capital_ledger_recovered`.
- **Loading.** The map image, props and atlases load in parallel with a 20 s timeout each. A unique NPC sprite that fails falls back to the archetype sheet. Any other failure shows "โหลดฉากไม่สำเร็จ กรุณาลองใหม่" and a "ลองใหม่" button.
- **Reduced motion.** When `prefers-reduced-motion` is set (it updates live):
  - the camera snaps;
  - idle frames hold;
  - the mark and arrow bobs and the dust motes are off;
  - lantern flicker stops.
- **Host `data-*` attributes** on `.stage-host[data-testid="world-canvas"]`:

| Attribute | Value |
| --- | --- |
| `data-renderer` | always `phaser` |
| `data-renderer-backend` | `webgl` or `canvas` |
| `data-ready` | the scene has loaded |
| `data-read-only` | the canvas is showing under a dialog |
| `data-player-x`, `data-player-y` | the hero's position |
| `data-player-frame`, `data-player-motion`, `data-player-facing` | the hero's animation state |
| `data-visible-props` | the story props currently shown |
| `data-nearby-marker` | the marker the action button targets |
| `data-guide-marker` | the marker the guide arrow points at |
| `data-guide-edge` | `x,y` host pixels of the edge pointer while it shows (clear of every `data-hud-occluder` box) |
| `data-placements`, `data-placement-ids` | placed objects drawn on this map: count, ids (space separated) |
| `data-foes`, `data-foe-ids`, `data-foes-at` | roaming foes drawn: count, ids, map positions (JSON); test hook `host.worldScreenPoint(x, y)` gives a map point's viewport point |
| `data-player-screen-*`, `data-nearby-screen-bounds` | screen coordinates; no reader remains |

  Position fields refresh every 150 ms. The e2e suite reads these attributes.

## Maps

### Location maps

`getLocationMap(id)` (`lib/world/data/location-maps.ts`) returns a hand-authored `LocationMapDef` if one exists, else `buildAutoMap(id)` for ids in `AUTO_MAP_IDS`.

| Kind | Maps | Image |
| --- | --- | --- |
| Hand-authored | `home_player`, `city_capital`, `jail` | `/maps/<id>.png` |
| Auto layout | 97 ids, including the foothill `village` and `tavern` | `/maps/<id>.webp` |
| None | `world_journey` | classic card layout |

`buildAutoMap` places markers by convention:

- exits in 8 edge slots, each destination on the slot that faces it on the world map (see [Directions](#directions));
- NPCs in 10 slots (sorted by id);
- shop, hall, rest, rumor and practice in fixed zones;
- artisans along a row;
- chess and begging on a street corner;
- nature nodes at the map edge.

Anything that does not fit is listed in the **"อื่น ๆ ในบริเวณนี้" drawer** (`.journey-extras`). Six maps show the drawer today:

| Map | Why |
| --- | --- |
| `home_player` | its road to the foothill village has no exit marker |
| `city_dali` | 9 roads, 8 exit slots |
| `sect_beggars` | 11 NPCs, 10 slots |
| `village`, `tavern` | their tutorial roads have no exit marker |

`LocationMap` (`components/world/location-map.tsx`) turns a map into `WorldMarker`s:

| Marker | Id | Built from |
| --- | --- | --- |
| NPCs | `npc-<id>` | registry and scene NPCs at `npcSpots`, with a quest mark `offer` / `turnin` |
| services | `service-<i>` | shop, sectHall, artisan, rest, rumor, practice, resource, activity |
| quest objective spots | `objective-<quest>-<i>` | 🔍, placed on free ground near the spawn |
| exits | `route_<scene>__to__<to>` | disabled below 10 stamina |

One marker gets `guide: true` from `activeGuide` / `guideMarkerId`. While a dialog is shown, the markers and the hour are frozen.

### Directions

Travel follows the compass of the world map. Leave a place by its right-hand exit and the road runs west → east: you start at the road's left edge, walk right, and arrive on the left side of the next place.

- **World map.** `lib/world/data/world-coords.ts` holds a spot for each of the 97 places joined by roads (1500 × 1000, north up). It is generated by `bun scripts/build-world-coords.ts`, a seeded force layout: regions pull toward their compass side, a few wild places are pinned near their Jin Yong geography, and roads act as springs. Rerun it after adding a place or a road; `test:routes` fails while it is stale. Each place's region is then read back from its spot (`regionOf` in `lib/world/data/regions.ts`): the heartland within 170 units of the capital, else its compass quarter; it picks the road paintings' colour grade.
- **Compass** (`lib/world/compass.ts`). `Dir8` (N, NE, E, SE, S, SW, W, NW), `worldBearing(a, b)`, `mapPointDir` (the side of a 3:2 painting a point sits on), and `assignSlotsByBearing`.
- **Exits.** `assignSlotsByBearing` puts each destination on the edge slot closest to its bearing; on the 77 repainted auto maps the marker then snaps onto its painted path (`AUTO_MAP_EXIT_POINTS`, `lib/world/data/auto-map-exits.ts`, authored with `map-collision-tool.ts --exits`). The slot is chosen exactly (a DP over destinations × used slots). On auto maps the first N slots have painted paths; any other slot costs ~43° extra (`UNPAINTED_SLOT_COST`), so an exit leaves its painted path only when that path points well away. Hand maps keep their painted gates and only reassign which destination uses which gate (the icon goes along).
- **Road direction.** `routeDirection(a, b)` is the side of `a`'s exit to `b`; a road with no exit marker (a card) follows the world bearing.
- **Arrival.** The route view records an arrival hint (`setArrivalFrom` in `lib/stage/types.ts`, session-only). `LocationMap` then spawns the hero 70 map units inside the exit back to where they came from (within reach of it), facing into the map (`spawnFacing`). Turning back on a road does the same at the start. A remembered position still wins, and leaving by an exit forgets the road's old position, so a road always starts at its near end.

### Road maps

`getRouteMap(sceneId)` (`lib/world/data/route-maps.ts`) serves the generated `route_<a>__to__<b>` scenes:

- **Road type.** `classifyRouteEdge` picks one of 7 from the endpoints' prefixes: highway, country, forest, mountain, gorge, coast or lane.
- **Direction.** `routeDirection` (above); `RouteMapDef.direction`.
- **Painting.** `/maps/routes/<type>-<dir>.webp`: 56 top-down paintings (7 types × 8 directions, the road running from one edge or corner to the opposite one, 1152 × 768). The region (`RouteMapDef.grade`: the destination's, else the start's, unless heartland) is applied when the map loads: `gradePixels` (`lib/stage/route-grade.ts`) collapses each region's grade into one affine colour transform and runs it over the background canvas (`WorldPresentation.imageGrade`). `scripts/build-route-variants.ts --from <dir>` imports new paintings; `--preview` renders a painting in every grade.
- **Layout** (`routeGeometry(dir)`). Spawn 12 % along the road from its near end, the destination at its far end (extra destinations fan out beside it), ย้อนกลับ at the near edge. The hero faces the way the road runs.

`RouteMapView` shows destination markers (`destination-<i>`) and a `back` marker, all disabled when the hero is too tired to travel. The 14 hand-written roads (`tavern_road`, `back_road`, `village_to_world`, 11 `cat_*`) have no painting and use the classic `RouteView` card.

## Navigation and collision

Pure code in `lib/stage/world-navigation.ts`, in 960 × 640 map units.

- **Shapes.** `WorldFootprint = { kind: "rect", left, top, right, bottom } | { kind: "ellipse", x, y, radiusX, radiusY }`. Foot radius 6, clearance 0.75.
- **Lookup.** `worldFootprints(key, image)` returns:

| Map | Shapes |
| --- | --- |
| `home_player` | 3 hand-authored: the well and two gateposts |
| `city_capital` | 11 hand-authored: shop walls, the well, stalls, two buildings |
| `jail` | 10 hand-authored: cell block, walls, rock pile, millstone, trough, desk, rack |
| any `/maps/<key>.webp` | `PAINTED_MAP_FOOTPRINTS[key]` from `world-footprints-data.ts` (98 maps, 850 shapes) |
| anything else | open ground |

- **Algorithms.**
  - `worldPointBlocked`;
  - `worldSegmentClear` (a swept test, so the hero can't tunnel through);
  - `nearestWorldGround`;
  - `moveOnWorldGround` (sub-steps of 4 units or less, sliding along walls);
  - `planWorldPath` (A* over a visibility graph of rect corners and 20-gon ellipses, the straight-line distance as the heuristic and the swept test only for an edge that would improve a route; `[]` when unreachable, which cancels the walk). About 1 ms on a painted map, ~25 ms with 120 placed objects.
- **Probe.** `probeWorldMap` (`world-map-probe.ts`) checks that the spawn is free and that every marker can be reached within 100 units. `bun run test:navigation` runs it over every painted map.
- **Tools.** `bun scripts/map-collision-tool.ts <id> [json] [png]` prints and draws a map's markers and shapes. `bun scripts/build-map-footprints.ts <dir>` regenerates the data file, but the per-map JSON sources are not in the repo (see [scripts.md](scripts.md#generators-write-files)).

## Placed objects

Objects placed on a location map with the engine's map editor (`/game/engine`, แผนที่ — see [engine.md](engine.md#แผนที่--map-editor)) are drawn by the world runtime and block like the painting's own solids. The data is `public/assets/placements.json` (`{ version: 1, maps: { <locationId>: Placement[] }, grounds?: { <locationId>: { tile } } }`) and the asset library `public/assets/manifest.json`; the types are in `lib/assets/types.ts`.

- **Ground.** A map with a `grounds[locationId]` entry draws that tile repeated at its map size instead of its painting (`WorldPresentation.ground`, `peekMapGround`); its `image` becomes the stand-in `ground:<tile>`, so no painted collision (`worldFootprints`) or foreground (`worldForeground`) applies. A conversation restored on reload keeps the ground's image too (`LocationMap` freezes the presentation before the placements load). `city_capital` is built this way, by `bun scripts/build-capital-layout.ts`, as a **draft**: until it is finished the game shows the painting (`DRAFT_PLACED_MAPS` in `location-maps.ts` — `map-placements.ts` drops a draft's placements and ground, and `getLocationMap` gives its painted spots without moved markers), while the map editor, its playtest tab (`showDraftMaps(true)`) and the placement tests use the placed version (`CAPITAL_PLACED`). Switch it on by moving `CAPITAL_PLACED` into `LOCATION_MAPS` and emptying `DRAFT_PLACED_MAPS`. The layout is deterministic and rewrites only `maps.city_capital` and `grounds.city_capital`: the imperial avenue (three cells) runs from the south gate through the plaza to the walled yamen, the market street (two) crosses it at the plaza, one- and two-cell lanes between rows of shops facing them. Its markers (`location-maps.ts`) stand in front of the buildings they belong to; rerun the script after moving one, since props are left off every marker.
- **Loading.** `useMapPlacements(locationId)` (`components/world/use-map-placements.ts`) → `loadMapPlacements` (`lib/assets/map-placements.ts`). `placements.json` is fetched once per page (8 s timeout, then treated as empty); the manifest only when the map being opened has placements. Results are cached per map, so a map is resolved once and later visits are synchronous. `LocationMap` passes the result as `WorldPresentation.placements`; while it is `null` (still loading) `WorldCanvas` waits, so the map is built once with its solids. A map without placements behaves exactly as before. A placement whose asset id is not in the manifest is skipped (with a console warning).
- **Geometry** (`placementGeometry` in `lib/assets/placement-geometry.ts`, pure; the editor draws with the same function):
  - `x, y` is the asset's anchor (`anchorX, anchorY` in image px — its base centre) in map units;
  - the image is drawn `mapWidth × mapHeight × scale` map units; `flip` mirrors it about the anchor (Phaser mirrors a frame in place, so the runtime mirrors the origin too);
  - `dir` picks the 8-direction view (`views[dir]`), falling back to `image`;
  - `footprint {x, y, w, h}` is a box in map units **relative to the anchor** (top-left at `x + f.x, y + f.y`), scaled and mirrored with the image. It blocks when `collide ?? true` (and the asset has a footprint). An asset with `solids` (several boxes, e.g. a gate's two piers) blocks with those instead (`PlacementGeometry.solids`). A building without `solids` blocks with its base diamond (`baseDiamond`: 2:1, as wide as the footprint, bottom corner at its bottom centre, cut to its depth, in 8-unit bands): the box's lower corners lie on the street in front, and two rows of boxes would close a one-cell lane. Every solid adds visibility-graph corners to `planWorldPath`, so purely decorative props (lantern poles, banners, plants) can be placed with `collide: false`. Kit pieces (roads, walls) are ordinary placements on their set's grid ([assets.md](assets.md#kits-roads-and-walls-that-join)).
- **Layers and depth.** "ground" (−0.9…−0.1 by y) lies on the painting, under shadows and every character; "object" sorts with the characters by its base y (`100 + y·10`, so the hero on the same line stands in front and a hero further up is behind); "overhead" (7000–7064) is over every character but under signs (8000), the night veil (8900) and the labels. The painting's own occluders (`world-occlusion.ts`) use the same scale, so they sort against placed objects too. While the hero's body is inside an overhead object's picture, or behind a standing object (inside its picture, feet above its base), that object fades to 45 % (instantly under reduced motion).
- **Collision.** `withPlacedSolids(worldFootprints(…), blockingRects(geometry))` (`world-navigation.ts`) adds each blocking footprint as a rect; everything else — `moveOnWorldGround`, `planWorldPath`, the spawn fix-up, wandering NPCs and roaming-foe spots — just sees more solids. Without placements it returns the map's own list unchanged.
- **Never sealing a marker.** `placementIssues` (`lib/stage/map-anchors.ts`) lists placements whose footprint covers a map anchor (the spawn, the arrival spot by each exit, every NPC spot, exit and service, the horse station and tournament ring where `freeSpot` puts them with every NPC present, or the spot the hero walks to for one), and markers that the spawn could reach before but not after. The map editor shows them as warnings; `bun run test:placements` fails on any in `placements.json`, and on placements naming an unknown map or (once the manifest is filled) an unknown asset.
- **Images** load in parallel with the rest of the scene; one that fails is skipped (its footprint still blocks), never failing the map. Each image URL is one texture.
- **Not yet:** asset `animations` are not played (a placement shows its still image); road maps take no placements; the service worker does not cache `/assets/`, so placements are missing offline.

## Characters

- **Catalog** (`lib/characters/catalog.ts`): 15 characters.
  - Heroes: `m1`–`m4` and `f1`–`f4`.
  - Archetypes: `elder`, `monk`, `merchant`, `bandit`.
  - Townspeople: `feng`, `wang`, `qing`.
- **Sheets.** `/art/characters/<id>.png` is a 4 × 4 grid of 128 px cells with feet at y 120; heroes add `/art/characters/<id>-directions.png` (4 × 2). That makes 304 poses. The clips:

| Clip | Frames | fps |
| --- | --- | --- |
| idle | 0–3 | 4 |
| walk (side) | 4–7 | 8 |
| attack | 8–11 | 10 |
| hurt / guard / victory / defeat | 12 / 13 / 14 / 15 | — |
| walk north | 16–19 | 8 |
| walk south | 20–23 | 8 |

  Horizontal movement mirrors the side walk. Sheets with uneven gutters declare their own layout (wang, feng, qing, m4's directions). Newer sheets are pre-packed onto an equal grid by `scripts/repack-character-sheet.ts`.
- **Atlas build** (`sheet.ts`):
  - It measures each pose's opaque bounds and scales the whole sheet once, so the median standing height is 108 px.
  - Output is a 512 × 512 atlas (512 × 768 with directions).
  - Direction sheets load only when needed: the world loads them for the hero and the rigged NPCs.
  - A failed load is evicted so it can retry.
- **Walk cycle** (`walk-cycle.ts`): left foot up → pass → right foot up → pass. The lifted leg bends from the hip, and passing frames bob 1 px. Tested by `bun run test:walk`.
- **World tint.** `warmWorldCharacter` bakes a warm ink tint into world atlases (`world-style.ts`); previews stay untinted.
- **NPC looks.**
  - **65 rigged NPCs** (`ANIMATED_NPC_IDS` in `lib/characters/npc-sheets.ts`: the 15 sect heads, the five opening / key city people, the 10 villains and the 35 strolling townsfolk of the villages, towns and homes) have a full sheet in the hero layout — idle, walk, attack, hurt, guard, victory, defeat, walk north and walk south — at `/art/characters/npc/<id>.png` (4 × 4) and `<id>-directions.png` (4 × 2). Their character id is the NPC id (`npcCharacterId`), so the same loader and clips play them on the map and in battle.
    - `scripts/build-npc-sheets.ts` rigs each sheet from the painted body like a paper puppet. The 104 px pixel figure is cut at the neck, the waist and the centre of the lower body into four parts (back leg, front leg, torso, head). Each pose gives every part its own transform — legs swing from the hip, the torso bends at the waist, the head tilts at the neck — under one whole-body tilt and scale, and the parts are drawn back to front with 2 px of overlap so joints never open.
    - Every one of the 24 cells is its own pose: idle breathes in, sways right, breathes out, sways left; walk is left stride, passing, right stride, passing, leaning into the step; attack is coil back, lunge with a qi arc, follow-through, recover; hurt is knocked back and flushed; guard is a crouch; victory is chest out with glints; defeat is lying down; north and south alternate legs and shoulders. The back view repaints the head above the neck in the hair or hat colour and shades the body. The loader adds the foot beats to every walk row.
    - A figure whose lunge would leave its cell (a wide carrying pole) is narrowed step by step until every pose fits; the others keep the full 104 px height.
    - `test:npcs` fails if two cells of a clip differ by less than 15 % of their pixels, or any two cells by less than 10 %.
    - Limits: the paintings face front, so the side walk is a narrower, leaning front view, and the back view is approximate (a beard below the neck stays). Real side and back art would replace these sheets one for one.
  - The other 162 NPC ids with art have a unique single-pose world sprite (`/npcs/pixel/<id>.png`, 74 px) and battle sprite (`/npcs/pixel-battle/<id>.png`, 152 px), built from `/npcs/body/<id>.png` by `scripts/build-npc-sprites.ts`. They stand at their spot and get procedural motion in battle.
  - The others use an archetype sheet chosen by `npcCharacterId(id)`: named overrides, then id patterns (women and nuns → f1 / f3, monks → monk, thieves → bandit, elders → elder, officials → m3, merchants → merchant, beggars → m2, guards → m4…).
  - Three registry NPCs have no art at all: `jail_elder_prisoner`, `jail_guard_zhang`, `city_capital_clerk_qing`.
- **Portraits.** `/npcs/<id>.png` (256 × 256), used by the dialog bust, the NPC card and the quest receipt.
- **Hero action sheets.** The two heroes (m1, f1) also have painted action sheets (`lib/characters/hero-actions.ts`), every cell `HERO_ACTION_CELL` (256 × 160, feet on row 150, a standing figure 104 px — the walk8 scale), facing right:
  - `/art/characters/<id>-combat.png`, 6 × 8: one row per weapon family (stance, wind-up, strike, follow-through, recover), then stance · qi cast · hurt · guard · victory · defeat.
  - `/art/characters/<id>-work.png`: a loop per activity (`HERO_ACTIVITIES`), laid out per hero by `HERO_WORK_LAYOUT` — f1 4 × 14 painted cells of 256 × 160; m1 8 × 14 cells of 128 px animated by PixelLab from his painted poses (`scripts/build-hero-work-loops.ts`, `scripts/animate-hero-work.py`).

  The battle runtime loads the combat sheet as a second texture and swaps it in for a cast (the row of the skill's weapon family, `heroAttackColumn` timed to the hits; an art plays the cast pose), guard, hurt, victory and defeat, scaling it by `atlas.figure / 104` with origin (0.5, 150/160) so the feet stay put; idle and walking stay on the base sheet. `data-hero-pose` / `data-hero-poses` on the battle host report the frames. The work overlay (`flashLoading(message, ms, kind, pose)`) plays a pose as a CSS sprite (`HeroActionSprite`); gathering picks it by life skill (`lifeSkillPose`), place activities by badge (`badgePose`), practice by weapon (`practicePose`), rest is `sleep`. The map plays the same loop on the hero while the overlay is up: `location-map.tsx` passes `heroAction` (`heroPoseStrip`) in the presentation, and the world runtime swaps the walking sprite for it — scaled to the walking figure, feet on the same spot, mirrored when the hero last faced west, frames on the clock since the map is paused (`data-player-action` = `<row>:<frame>`, empty when idle). Rows listed in `HERO_WORK_GAPS` are unpainted and keep the plain preview. `scripts/build-hero-actions.ts` builds the sheets from painted strips (split by connected parts: a dart or rock joins the figure on its left; touching figures are cut at their thinnest column), `scripts/paint-hero-actions.py` paints the strips.
- **Hero eight-way walk.** Each hero also has a painted walking sheet, `/art/characters/<id>-walk8.png` (4 × 7 cells): a four-step walk and a standing pose in five painted directions (S, SE, E, NE, N); SW, W and NW are their east twins mirrored. `scripts/build-hero-walk8.ts` builds it from five painted strips per hero (standing + four steps), cut out, split at the gaps, scaled once per strip, centred on the head and torso and set on one foot line. The loader appends the cells to the atlas as frames 24–51 (`lib/characters/walk8.ts`). On the map the hero's heading follows the actual movement (`dir8FromVector`, with a little hysteresis so a joystick near a diagonal doesn't flicker) and they stand in the last heading; on the battle board their steps use the same cells. `data-player-dir` reports the heading.
- **Hero body.** `playerBodyId` picks the atlas `m1`…`f4`. The eight hero sheets are rigged by `scripts/build-npc-sheets.ts` from painted bodies in `/player/body/<id>.png` (imported with `import-npc-art.ts --heroes`), the same way and in the same painted style as the NPCs, so the hero matches the people around them. `/player/*.png`, `/player/body/*.png` and `/npcs/body/*.png` are build inputs; the game never fetches them.
- **`CharacterPreview`** (`components/game/character-preview.tsx`) is a 128 × 128 animated canvas, with an optional bust crop. It is used by the start screen, profile, busy overlay, dialog fallback, encounter screen, upgrade card and `/progress`.
- **Archetypes and enemy types.** The seven costume archetypes (`elder`, `monk`, `merchant`, `bandit`, `feng`, `wang`, `qing`; NPC fallbacks and cutscene extras) and the 22 enemy types (`FOE_CHARACTER_IDS`, `foe_thief` … `foe_empress`) are painted bodies in `/foes/body/<id>.png` (imported with `import-npc-art.ts --foes`), rigged by `build-npc-sheets.ts` into `/art/characters/<id>.png` + `-directions.png` exactly like the heroes. Every foe without NPC art is drawn as one of them (`foeCharacterFor`), on the map and in battle.
- **Art versions.** Art repainted under the same file name (the creature atlas, the seven costume sheets) is requested with `?v=ART_VERSION` (`lib/characters/catalog.ts`) so no browser or service-worker cache keeps the old picture; bump `ART_VERSION` when repainting in place.
- **Creature atlas.** `/art/creature-atlas.png` is 12 painted beasts on a 4 × 3 grid of 160 px cells, facing left (`CREATURE_ATLAS`, `creatureCell` in `lib/characters/catalog.ts`): wolf, tiger, bear, boar, snake, fowl, raptor, bat, hare, squirrel, wild cat, centipede. `scripts/build-creature-atlas.ts --from <dir>` cuts each painting out, sizes it by kind and reduces it to the sheets' pixel look. Used by roaming foes, battles and cutscenes (see [grid-combat.md](grid-combat.md#unit-looks)).

## Map signs and markers

`WorldMarker` (`lib/stage/types.ts`):

| Field | Meaning |
| --- | --- |
| `id`, `label`, `x`, `y` | identity, caption, position in % of the map |
| `kind` | `npc`, `exit` or `service` |
| `image`, `sprite`, `icon` | art for the marker |
| `badge` | which line-art sign to draw |
| `glyph` | the emoji shown on the action button and in the places list |
| `category` | the places-list tab |
| `disabled` | drawn at 50 %; activating it only explains why |
| `quest` | `offer` or `turnin` mark over an NPC |
| `guide` | the guide arrow points here |
| `onActivate` | what using it does |

- **Signs.** `badge` picks a line-art glyph from `GLYPHS` (`lib/stage/world-style.ts`, 28 keys):
  - services: rest, shop, sect, rumor, practice;
  - the six crafts and the gathering skills, plus chess and begging;
  - `investigate` for quest objective spots;
  - gate, labor, dice and escape for the jail.

  Signs are octagon plates; exits share an arrow sign, and an unknown key draws "+".
- **Categories.** `category` sorts จุดหมาย into tabs: `npc` บุคคล, `route` เส้นทาง, `place` สถานที่, `activity` กิจกรรม. It defaults from `kind` (npc → npc, exit → route, service → place).

## HUD

On a map (`MapHud` in `components/world/map-hud.tsx` + `MenuBar hud`):

- **Top left:** `.hud-topleft` stacks the vitals card (`components/world/hud-vitals.tsx`, `[data-testid="hud-vitals"]`: HP / MP / พลัง gauges as `role="meter"`, no portrait) over the icon bar (`nav.hud-iconbar[aria-label="เมนูเกม"]`).
  - Nine section icons: 1 โปรไฟล์, 2 ย่าม, 3 วิชา, 4 อาชีพ, 5 ภารกิจ (badge = active quests), 6 สำนัก (badge = things to do), 7 บันทึก, 8 จดหมาย (badge = unread), 9 ชีพจร (badge = unspent meridian points, shown only while some point can be opened with them — `meridianActionable`).
  - Then ♪ and the install icon.
  - Layout: two rows on desktop and landscape; on phones, rows of four.
- **Top right:** the purse and the day.
  - Gold "ตำลึง" and w-exp "悟", each with a floating +N / −N for 1.6 s.
  - The sundial: 12 shichen from 卯; the ring turns, and 戌–丑 are styled as night.
  - The "วันที่ N" pill, and the hour line (hidden on phones).
- **Quest tracker** under the purse (`quest-tracker.tsx`): 📌 stage n/N, the quest name, 🎯 action and counter, 📍 place and roads left. Tapping it opens the quest log.
- **Top centre:** law chips — "⛓ หมายจับ ●●○○○", "⛓ เหลือโทษ …", "🔓 พ้นโทษแล้ว · ไปที่ประตูคุก".
- **Arrival banner.**
  - Entering a location shows "❖ name ❖" for 3.2 s.
  - It is skipped after a reload in the same place (`sessionStorage["wuxia:lastBanner"]`).
  - The "✒ บันทึกอัตโนมัติ…" note beside it is cosmetic; saving is continuous.
- **Bottom right, a thumb column:**
  - พัก (rest, `rest-quick-action.tsx`), whose bubble offers the rests the place allows;
  - above it, the action button (`.action-prompt[data-action-marker]`: คุยกับ / ไปที่ / ใช้ + glyph + label + an E badge on desktop);
  - above that, the controls pill with the จุดหมาย toggle.

There is no portrait, status strip or minimap on maps; HP, MP and พลัง are the slim vitals card top-left.

## Landscape only

The game is laid out for a landscape screen. A portrait viewport (a phone held upright) shows it turned on its side:

- **The turn.** `app/globals.css`: under `@media (orientation: portrait)` the `body` is `position: fixed`, `100dvh × 100dvw`, `transform: rotate(90deg) translateY(-100%)` about its top-left. Fixed descendants (menus, toasts, portals) turn with it. The PWA manifest asks for `orientation: "landscape"`.
- **Viewport units.** Nothing uses raw `vw` / `vh`: every size goes through `--vw`, `--vh`, `--dvw`, `--dvh` (`calc(70 * var(--vh))`), which swap in portrait so "height" is always the short side the player sees.
- **Media queries** are written for both orientations: `(orientation: landscape) and (max-height: 500px), (orientation: portrait) and (max-width: 500px)`. Tailwind's `sm` / `md` / `lg` / `xl` / `2xl` are raw queries of the same shape (`tailwind.config.ts`). Write new ones the same way.
- **Pointers.** Client coordinates are screen coordinates. Code that maps a pointer onto the page (the map runtime's `toMap` / `tapAt`, the battle board's `toWorld`, the joystick, the HUD occluders) goes through `lib/ui/landscape.ts`: `toPagePoint`, `toClientPoint`, `pageRect`. Test hooks (`worldScreenPoint`, `gridCellPoint`) return client coordinates.
- **Not handled:** `env(safe-area-inset-*)` still names the physical edges, so a notch is padded on the wrong side when turned; Radix popovers place themselves in client space and may sit off their trigger when turned.

## Menus and popups

A menu section opens as a full-screen **menu shell** (`components/ui/modal.tsx` + `game-menu-context.tsx`).

- **No scrolling, landscape columns.** A section opened with `<Modal fill>` takes the whole stage (`.hud-menu-panel--fill`, at most 700 px tall; on short screens its title hides — the tab names it). Its content is `.menu-cols > .menu-col` framed columns (`app/menu-layout.css`) with `.menu-tabs` for switching inside a column. Long collections use `PagedGrid` (`components/ui/paged-grid.tsx`): it measures its box, shows the cells that fit and pages the rest (◀ n/m ▶). `useShortScreen()` picks smaller cells on a phone. `.menu-col--scroll` is the last resort (the skill detail with its upgrade card).

- The shell has a tab strip, a red ✕ and a titled parchment panel. Digits switch tabs and Esc closes.
- A modal opened inside the shell (a confirm) floats as a card.
- Both are `role="dialog"`, so the map pauses.

| Popup (`components/world/popups/`) | Shows |
| --- | --- |
| `profile-popup.tsx` | three columns (`fill`): who (figure, name, ฉายา from `lib/world/epithet.ts`, gold, HP / MP / พลัง bars, power tier, sects, the five traits) · tabs ค่าพลัง (base stats with training bars; tap for sources) / อุปกรณ์ · detailed status (combat numbers, weapon mastery, move bonuses); styles `app/profile.css` |
| `inventory-popup.tsx` | two columns: worn gear as a paper doll around the hero (`DOLL_AREA` grid areas) · category tabs over a `PagedGrid` of the bag (gear first, then items). Picking anything opens a small window (`.bag-popup`: details, ใช้ / ติดตั้ง / ถอด); its ✕ (`z-index: 2`, above the name's `filter`) or tapping outside it goes back to the bag |
| `move-skills-popup.tsx` | three columns: counts, weapon mastery, conflicts and the 10 loadout slots · the learned library (`PagedGrid`, filters) · the picked move (`SkillDetail`: actions first — equip / replace / remove, เลื่อนระดับ (ใช้ประสบการณ์ยุทธ) with the `upgrade-payoff.tsx` card, ลืม — then the plain-Thai summary and numbers from `lib/game/skill-text.ts`, and ค่าประสบการณ์) |
| `life-skills-popup.tsx` | tabs มาสเตอร์รี่ / ฝึกฝน / สูตรที่เรียน, each a `PagedGrid` of tiles: the 19 life skills · music practice and training items · learned recipes (read-only) |
| `letters-popup.tsx` | two columns: the inbox (`PagedGrid`; the gift as an item tile, ● unread, ลบที่อ่านแล้ว) · the open letter (portrait, text, the gift tile and rarity, ลบ). Deleting takes an unclaimed gift first (`deleteLetters`) |
| `meridian-popup.tsx` | ชีพจร, three columns (`app/meridian.css`): the learned charts (`PagedGrid`; tier badge, points opened, a rank bar in the kind's colour) and the unspent แต้มชีพจร · the chart on a black silhouette under a moon: one of five training poses (`components/world/popups/meridian-poses.ts`, picked by kind and chart id) drawn from a skeleton, every `MeridianBodyPoint` placed from the same joints (back points are dashed rings); points are buttons joined in node order (lit lines flow once opened), glowing by rank, the openable one breathing; hover (mouse) or tap shows a tooltip with each rank's bonus and the next cost; the bar under it opens / raises the picked point (`openMeridianNode`) · the chart's total bonus, points spent, description and requirements (✓ / ✗). No chart yet → an explanation of how to get one |
| `quest-log-popup.tsx` → `components/world/quest-log.tsx` | กำลังทำ / สำเร็จ / ละทิ้ง; each row expands to the stage checklist, the guide box (🎯 / 📍 / ➤ นำทาง), objective spots, 📌 ติดตาม, ละทิ้งภารกิจ |
| `sect-membership-popup.tsx` | the sect, rank-up, 🎖 rewards, 📜 sect quests, ☯ arts, leaving (resign or betray) |
| `action-log-popup.tsx` | the last 100 actions, newest first |
| `npc-interaction-popup.tsx` | the NPC card: portrait, badges, description; ทักทาย, ขอประลอง, ขโมย, ลอบทำร้าย, ลักพาตัว; objective actions, hand-ins, offers, active quests |
| `shop-popup.tsx` | ซื้อ · ขาย. Tapping a row (or its tile) opens the item's window (`.bag-popup` in `.shop-detail-backdrop`, portalled to `<body>` so the card's transform and scroll don't clip it): details, effects, owned, price, and ซื้อ / ขาย 1 ชิ้น |
| `sect-hall-popup.tsx` | the city hall's offers; the capital's free training duel |
| `artisan-popup.tsx` | ซื้อสูตร · ประดิษฐ์ · ซื้อ-ขาย |
| `practice-popup.tsx` | skills and arts to practise, the place bonus, the cost |
| `rumor-popup.tsx` | the rumor list and "ฟังต่อ" (see [liveness.md](liveness.md#where-the-hero-hears-rumors)) |

## Overlays

- **Toasts** (`toast-stack.tsx`, `store/toast-store.ts`): top centre, at most 3 at once (the oldest is dropped), 2.6 s by default. Kinds success, info, warn, error; tap to dismiss.
- **Busy overlay** (`loading-overlay.tsx`, `store/loading-store.ts`): `flashLoading(message, duration = 1000, kind = "work" | "rest" | "stealth")`.
  - It shows the hero working, resting or sneaking, with a bar that fills over the duration.
  - As `.work-overlay[data-world-busy]` it swallows taps and pauses the map.
  - Durations: gather, craft and practice 1000 ms; rest 1400; jail activities 1200; serving a sentence 1600; a map objective 1200; a steal approach 1000.
- **Confirm** (`confirm-dialog.tsx`, `store/confirm-store.ts`): `await confirmDialog({ title, message, confirmText, cancelText, variant })`.
  - Variants: default, warn, danger. Enter confirms and Esc cancels.
  - A new confirm resolves the open one as `false`.
- **Cutscene player** (`cutscene-player.tsx`): a full-screen film for a dialog whose `cutscene` field names one ([story-quests.md](story-quests.md#cutscenes)).
  - Its own Phaser game on the location's painting, letterboxed, with subtitles, title cards, fades and a CSS mood grade.
  - Portalled to `<body>` at z-index 300, because a transformed ancestor (a menu `Modal`) would trap its fixed layer.
  - The runtime is imported dynamically: a static Phaser import breaks server rendering.
  - It is `role="dialog"`, so the map pauses underneath.
- **Quest receipt** (`quest-completion-receipt.tsx` + `-data.ts`) appears on a real active → done change.
  - It never replays after a reload.
  - It shows the giver, a thank-you line from the complete scene, and the rewards (capped at what the quest grants).
  - It waits while a dialog, battle or encounter is up, and closes on ✕, "เดินทางต่อ", Esc, a tap outside or a movement key.

## Controls

| Input | Where | Does |
| --- | --- | --- |
| WASD / arrows | map | walk (ignored with Alt / Ctrl / Meta) |
| tap / click ground | map | walk there |
| tap / click marker | map | walk to it and use it |
| touch-drag, left half | map (touch and pen only) | floating joystick: knob radius 56 px, a tap under 10 px is forwarded as a tap |
| E | map | use the last-used or nearest marker within 100 units |
| 1–7 | map (desktop) | open a menu section; inside the shell, switch tabs |
| Esc | menus, bubbles, dialogs | close or leave, when allowed |
| F / Enter · Esc | encounter | fight · flee |
| Enter · Esc | confirm | confirm · cancel |
| battle keys | battle | see [grid-combat.md](grid-combat.md#battle-ui) |

The controls pill reads "WASD / ลูกศร เดิน · E โต้ตอบ" on desktop and "ลากจอซ้ายเพื่อเดิน · แตะเพื่อไปที่นั่น" on touch.

The places list (`PlacesPanel`, `nav.world-places`) has four tabs: บุคคล 💬 · เส้นทาง ➜ · สถานที่ 🏮 · กิจกรรม ✋.

- Entries are `button[data-marker-id][data-category]`.
- Picking one closes the list and uses the marker.

## Styling

`app/layout.tsx` loads Charm (`--font-display`) and Sarabun (`--font-body`) from Google Fonts, then these CSS files in order:

| File | Covers |
| --- | --- |
| `app/globals.css` | Tailwind layers, root tokens (cream, ink, vermilion, jade, `--radius: 0`), paper texture, headings in Charm, battle-log classes, `.pixel` and 9-slice frame utilities |
| `app/pixel-game.css` | first-generation chrome: panels, title screen and creation form, world viewport, controls pill, places list |
| `app/game-menu.css` | the dark-lacquer pass: the menu shell, encounter panel, item tiles, bag, loadout, profile hero, NPC card |
| `app/game-hud.css` | the Dragon Quest XI style HUD: `--dq-*` tokens, purse, sundial, day pill, arrival banner, drawer button |
| `app/dq-theme.css` | the final skin: **parchment scrolls** for menus and popups (cinnabar ribbon titles), lacquer panels, encounter and battle tokens |
| `app/pwa.css` | install button and hint, standalone overscroll, notch margins |
| `app/mobile-hud.css` | top-left stack (vitals card + icon bar), rest button and bubble, action button, thumb column, joystick, sound bubble, busy overlay, law chips, quest tracker, breakpoints |
| `app/profile.css` | the profile sheet |
| `app/grid-battle.css` | the battle (imported by `battle-arena.tsx`) |
| `app/quest-completion-receipt.css` | the receipt card |
| `app/progress/progress.css` | `/progress` |
| `components/world/dialog-stage.module.css` | the dialog stage (its last block, full screen, wins) |

`app/combat-actions.css` is an orphan from the old side-view battle; nothing imports it.

What the player actually sees:

- **Always-on chrome** is Dragon Quest XI–style lacquer: dark brown boxes (`#2a1611`), a bronze edge (`#9a7442`), gold (`#e2bd6a`), cream text, rounded boxes, pills and round buttons.
- **Menus, shops and popups** are parchment scrolls with cinnabar ribbon titles inside a dark shell.
- **Dialog** is a full-screen lacquer box with gold hairlines and a ☛ choice cursor.
- **The root cream-and-ink tokens** show only where nothing overrides them: the loading placeholder, game over, the classic card layout, toasts and `/debug`.

More styling details:

- **Tailwind** (`tailwind.config.ts`):
  - colour aliases `ink`, `paper`, `vermilion`, `jade`, `sideA`, `sideB`;
  - fonts `display` (Charm), `sans` (Sarabun), `action` (Jomyuth, declared but unused);
  - `rounded-sm/md/lg` = 0;
  - shadows `pixel` / `pixel-down`.

  Charm is for headings of 16 px or more; below that, Thai tone marks blur, so use Sarabun.
- **Breakpoints.**
  - Phones: `max-width` 640 / 639 / 480 px.
  - Short landscape: `(max-height: 560px) and (min-width: 641px)` for the HUD, `(max-height: 500px) and (orientation: landscape)` for dialogs and menus.
  - `(pointer: coarse)` hides keyboard hints and shows the idle joystick.
  - Safe areas via `env(safe-area-inset-*)` (the page sets `viewport-fit=cover`).
- **z-index ladder:**

| z-index | Layer |
| --- | --- |
| 29 | joystick, arrival banner |
| 30–32 | HUD |
| 34 | rest button |
| 35 | places list |
| 40 | map layers |
| 45 | dialog stage and receipt |
| 50 | menus and modals |
| 150 | toasts |
| 200 | busy overlay |

- **Primitives.**
  - `components/ui/`: Badge (with a `seal` variant), Button (`pixel`), Card, Combobox, Command, Input, Modal (menu-shell aware), Popover, Progress (`variant` hp / qi / exp / stamina, `pixel`), Slider, Table, Tabs.
  - `components/ui/wuxia/`: `Panel` (default / quiet / flat), `WuxiaButton`, `InfoPopover`, `ItemTile` (rarity frame + the item's library icon (`icon`, `lib/world/data/item-icons.ts`), else a category glyph 材 草 毒 藥 食 書 譜 工 寶 令 雜 or slot glyph 兵 衣 冠 靴 腕 戒 飾), `OrnamentDivider` (unused).
- **Rarity** (`lib/ui/rarity.ts`): grey, green, blue, purple, orange, red-gold.
  - Items by price: 40 / 120 / 300 / 800 / 2000.
  - Gear by stat budget: 8 / 20 / 38 / 60 / 90.

## Public assets

| Path | Holds |
| --- | --- |
| `public/maps/` | 98 `.webp` + 3 `.png` location paintings (1536 × 1024); `routes/` 56 road paintings (7 types × 8 directions; regions graded at load) |
| `public/art/` | `jade-courtyard.png` (title and default battle), `battle-capital-training.png`, `battle-capital-street.png`, `creature-atlas.png`; `characters/` sheets; `props/` story props. Provenance: [public/art/README.md](../public/art/README.md) |
| `public/npcs/` | 159 portraits; `body/` 159 paintings (build input); `pixel/` and `pixel-battle/` 159 sprites each |
| `public/player/` | 8 hero stills (build input for the PWA icons) |
| `public/icons/` | `skills/` 178, `arts/` 122, `ui/` 8 menu icons |
| `public/pwa/` | install icons (see [pwa.md](pwa.md)) |
| `public/fonts/jomyuth/` | a declared, unused font |
| `public/sw.js`, `public/progress.json` | the service worker; the frozen journal data |

`public/art/characters/` also ships 16 `-v1` rollback sheets and 16 `readability-v2` sources that nothing loads (about 50 MB). The old chibi-style hero sheets can be rebuilt from their v2 sources with `repack-character-sheet.ts`.

## The /progress page

`app/progress/page.tsx` polls `/progress.json` every 5 seconds. It shows pieces, reviews, checks and a gallery of all 15 characters × 9 motions.

The data in `public/progress.json` is **frozen at wave 11** (2026-09-29), so treat the page as history plus a character gallery. [HANDOFF.md](../HANDOFF.md) and the [changelog](changelog.md) are current.

## Rules for this layer

- Keep Phaser objects, textures and DOM nodes out of stores and saves.
- Do not enable Phaser input. The DOM listeners and `worldInputBlocked` are what make dialogs pause the map.
- Release everything on teardown: games, textures, observers, listeners, animation frames.
- Publish state for tests as `data-*` attributes on the host, not through globals.
- Respect `prefers-reduced-motion` in new animations, in both the runtime and CSS.
- New popups should be `Modal`s (`role="dialog"`) so the map pauses by itself.

## Known issues

- **Drawer button.** The quest tracker may cover the "อื่น ๆ" drawer button (both sit at the top right) on the six maps that show the drawer, including `home_player`.
- **Market and sect-internal rumors** are reachable only through the drawer.
- **Menus still scrolling.** ภารกิจ, สำนัก and บันทึก (and shop / artisan / hall popups) keep their old scrolling layouts; only โปรไฟล์, ย่าม, วิชา, อาชีพ, จดหมาย and ชีพจร are landscape columns.
- **Turned portrait** (see [Landscape only](#landscape-only)): safe-area insets name the physical edges, and Radix popovers (the stat tooltips, comboboxes) may sit off their trigger.
- **Action log.** Kinds `battle`, `encounter`, `steal`, `assassinate` and `kidnap` show their raw English names, and `travel` is labelled but never logged.
- **`/progress` and the cache.** With the service worker active, each 5-second poll of `/progress.json?t=…` adds a cache entry and eventually pushes real art out of the 900-entry cache.
- **Night.** The sundial styles 戌–丑 (7–10) as night; the veil and the night music run from 8 to 11.
- **Minor.** `map-hud.tsx` reads `sessionStorage` outside `try`. The authored map `zoom` values are ignored.
