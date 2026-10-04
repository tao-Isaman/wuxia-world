# Changelog

What changed, when, and in which pull request. Newest first. Each entry says what a player or developer would notice; the pull request diff has the detail. Some older entries describe systems that later changes replaced — those are marked **(replaced)** with a pointer to the change that replaced them.

Pull requests are on [github.com/tao-Isaman/wuxia-world](https://github.com/tao-Isaman/wuxia-world/pulls?q=is%3Apr+is%3Amerged). The waves are the build → test → review rounds the agents worked in (see [HANDOFF.md](../HANDOFF.md)).

## 2026-10-04

### The engine at `/game/engine`: asset library, map tab, skill and art texts

- **A browser editor for the game's data**, not linked from the game and `noindex` ([engine.md](engine.md)). Three tabs: คลังภาพ (the asset library), แผนที่ (the map editor's place) and วิชา (skill / art texts). A chip says whether saving writes into the repo (`bun dev`, or `ENGINE_WRITE=1`) or downloads the JSON (the deployed, read-only site); unsaved edits stay as a local draft until saved or discarded.
- **คลังภาพ** filters `public/assets/manifest.json` by category, subcategory, region, sect, status and Thai / English text, 60 thumbnails a page; the detail panel draws the anchor and the footprint over the image (drag to move or resize), shows all 8 views and edits name, tags, subcategory, layer, flip, map size, footprint and status; bulk approve / reject / tag.
- **วิชา** edits the names and descriptions of the 178 skills and 122 arts with the game's own card as a live preview, checks empty / long / duplicate names, long descriptions and quests that would name the move they teach, and saves only the changes to `lib/game/data/text-overrides.json`.
- **The game shows the overrides.** `SKILLS` / `ARTS` take `text-overrides.json` at load (`withTextOverrides`, unknown ids ignored); arts may now carry a description (`Art.d`), shown on the art card, the skills window and the sect hall.
- The save route answers `GET` with whether it can write, and its whitelist now accepts only its three own keys. New suite `test:engine` (12 checks) and `engine.spec.ts` (3 browser tests).

### Objects placed on maps, and the map editor

- **The game draws placed objects.** Objects placed with the engine's map editor (`public/assets/placements.json`, images from the asset library) are drawn on their location map: "ground" ones under everyone, "object" ones sorted with the hero and NPCs by their base, "overhead" ones over everyone (fading while the hero is under or behind them). Their footprints block walking, tap-to-walk paths, wandering NPCs and roaming-foe spots. Maps without placements are unchanged ([rendering.md](rendering.md#placed-objects)).
- **Map editor** (`/game/engine`, แผนที่): pick any of the 100 painted maps, place approved assets by click or drag, select / box-select, move, nudge, scale, flip, layer, collide, 8-direction view, duplicate, delete, snap to a grid, unlimited undo / redo, footprints and the map's own collision as overlays, NPC / exit / service / spawn markers, warnings when an object covers or cuts off one; saves through `saveEngineFile`, keeps a draft, and เล่นทดสอบ opens the game at the map with the unsaved objects (`/?engineGoto=<id>`, dev or a local flag) ([engine.md](engine.md#แผนที่--map-editor)).
- Tests: `bun run test:placements`; `tests/browser/placements.spec.ts`.

### The male hero works for real: PixelLab work loops, played on the map

- m1's 14 work loops are now 8-frame animations made with PixelLab from his painted poses (`animate-with-text-v3`): a full pickaxe swing that sends chips flying, an axe biting into the stump, a rod jerking up on a bite, a bow drawn to the cheek and loosed, a hammer ringing on a glowing blade… (`HERO_WORK_LAYOUT.m1`: 8 × 14 cells of 128 px, 8 fps). f1 keeps her painted 4-frame loops.
- **The hero does the work on the map.** While gathering, crafting, practising or resting, the hero on the map plays the loop in place of standing, same feet and size, facing the way they last walked (`WorldPresentation.heroAction`, `data-player-action`); the work card still shows it too.
- Tooling: `scripts/build-hero-work-loops.ts` (`--first` cuts the start frames, `--from` builds the sheet) and `scripts/animate-hero-work.py` (PixelLab, `PIXELLAB_API_TOKEN` from the environment).

## 2026-10-03

### Painted fighting and work poses; one hero per gender

- **The hero fights with the weapon of the move.** Each of the seven weapon families (fist, spear, sword, sabre, fan, darts, flute) has its own painted five-frame form — stance, wind-up, strike, follow-through, recovery — held with that weapon; a cast plays the form of its skill's family over the body tweens, an inner art the qi-cast pose. Being hit, guarding, winning and falling are painted poses too (`lib/characters/hero-actions.ts`, `<id>-combat.png`).
- **Work has its own animation.** Gathering, crafting, practising and resting show the hero at it in the work overlay: mining, woodcutting, fishing, herb gathering, archery, snake catching, smithing, cooking, alchemy, needlework, meditation, reading, the zither and sleep (`<id>-work.png`, a four-frame loop each). Practising a move plays its weapon form; an inner art, meditation.
- **One hero per gender.** The character screen sets the body by gender — m1 (blue-robed swordsman) or f1 (white and pale-green robes); the other six bodies stay for NPCs. A save with one of them plays as the hero of its gender (`heroBodyFor`, repaired on load).
- f1's alchemy, needlework, meditation, reading, zither and sleep loops are not painted yet (the image credits ran out); those keep the old preview (`HERO_WORK_GAPS`). `scripts/paint-hero-actions.py` paints the missing strips with an `OPENAI_API_KEY`, `scripts/build-hero-actions.ts` builds the sheets.

### ฉายา for mixes of traits

- 19 new titles for traits that are all at 60 or more together: all five (เทพเซียนผู้ข้ามพ้นดีชั่ว), nine triples (ราชาปีศาจครองยุทธภพ, ปรมาจารย์ผู้ค้ำจุนแผ่นดิน…) and all ten pairs (คนบ้าแปลกประหลาด for good + evil, จอมมารโดยเนื้อแท้ for evil + arrogance…). A wider mix beats a narrower one, then the higher total; mixes rank under a tournament crown and above wanted marks, sect rank and single traits (`COMBO_EPITHETS`). The full list is in [gameplay.md](gameplay.md#ฉายา).

### Landscape only; menus in columns, no scrolling; rumors fade

- **The game is landscape only.** A portrait viewport (a phone held upright) shows the game turned 90° (`app/globals.css` turns the `body`; manifest `orientation: "landscape"`). Every viewport unit goes through `--vw/--vh/--dvw/--dvh`, every media query (and Tailwind's breakpoints) is written for both orientations, and pointer code maps screen coordinates back through `lib/ui/landscape.ts` (map taps, joystick, battle board, HUD occluders, test hooks).
- **Menus are landscape columns with tabs, not scrolling.** `<Modal fill>` + `.menu-cols` (`app/menu-layout.css`); long lists page with `PagedGrid` (◀ n/m ▶).
  - **โปรไฟล์:** three columns — who you are (name, a **ฉายา** read off your record by `lib/world/epithet.ts`, HP / MP / พลัง, sect, power tier, reputation) · tabs ค่าพลัง / อุปกรณ์ · detailed status. Moves moved to วิชา, reputation to the first column.
  - **ย่าม:** worn gear laid out around the hero (paper doll) · the bag as a paged grid with category tabs; picking a thing opens a small window with its details and actions, tapping outside goes back.
  - **วิชา:** status and the 10 slots · the library · the picked move with its actions first.
  - **อาชีพ:** tiles instead of a list, same three tabs.
  - **จดหมาย:** inbox and the open letter side by side; gifts show as icons; letters can be deleted (one, or all read ones; an unclaimed gift goes to the bag first — `deleteLetters`).
- **Rumors fade.** News lasts 20 days (big news 40, was 60 / 120); a heard rumor fades within 15 days (a lead 30, `fadeHeardRumor`); flavour lore fades by day 60 instead of never; treasure leads stay until heard. The arrival rumor banner now shows on painted maps and fades after 12 seconds (it used to hide itself the moment it appeared).

### The guide arrow no longer hides under the HUD

- The quest guide's edge pointer used to sit on the very edge of the screen, so toward the top-left (vitals + menu), top-right (purse, sundial, quest tracker) or bottom-right (rest / action / places) it hid under the HUD. HUD boxes now carry `data-hud-occluder`; the pointer slides in along its ray until it is clear of them, still pointing the right way, and an arrow over a marker the HUD covers turns into that pointer. `guide-hud.spec.ts` walks a phone and a desktop view around and checks the pointer is never under a HUD box.

### Turn down or drop a sect move quest; vitals on the HUD

- **Offers can be turned down.** Lineage quests and saga chapters open their offer before accepting; besides รับคำ it now has **ขอปฏิเสธไว้ก่อน**, which leaves the quest on offer. The sect art trials, which have no offer scene, ask in a confirm box (รับภารกิจ / ขอปฏิเสธไว้ก่อน).
- **They can be dropped.** ละทิ้งภารกิจ now works on lineage quests, saga chapters and sect art trials: the quest and its progress are forgotten, not failed, so the giver offers it again (they are the only way to their move).
- **HP / MP / พลัง on the map HUD.** A slim lacquer card with the three gauges sits top-left above the icon menu, no portrait (`hud-vitals.tsx`).

### Quests give scrolls; the move stays a mystery; a new skills window

- **A quest that teaches a move hands over its คัมภีร์ instead.** Every `learnSkill` / `learnArt` quest reward (lineage quests, saga finales, place quests) now puts a scroll in the bag — `scroll_skill_<id>` / `scroll_art_<id>`, one generated per move and art (`lib/world/data/items.ts`), unsellable, no stat gate. Reading it (ใช้) teaches the move, as before auto-slotted; a T4+ art starts at level 3, the rest at 1. Nothing else hands out scrolls (`test:story`). A lineage quest or saga isn't offered again while its scroll sits unread.
- **Quests no longer say which move or what tier.** Quest offers, the quest log and the saga list show the reward as **📜 วิชาลึกลับ**; lineage quests are named after their teacher (สืบทอดวิชาลึกลับของ<teacher>, ม้วนที่ 2… when a teacher has several), and the 15 sect trial quests no longer name their art; 60-odd hand-written place quests and nine saga finales had the move's name taken out of their title, summary and description (`test:story` now fails on any quest that names its move or a tier there). The hand-in receipt names the scroll.
- **The sect window keeps T4 secret.** The ขั้นและวิชา list drops the saga (T4) moves and shows the rest as วิชาลึกลับ until learned; the seven T4 saga trials (บททดสอบก่อนตำนาน) leave the วิชาในกาย tab — their giver now offers them on the NPC card to an active member of high enough rank (`isSecretSectQuest`).
- **The skills window is two panes.** The 10 slots stay on top; below, the library of everything learned sits on the left (icon, name, kind, level, slot number; filter ทั้งหมด / ฝีมือ / ในกาย) and the picked move on the right, in full, with ติดตั้งลงช่อง / แทนที่ช่อง / ถอดออก, เร่งด้วย w-exp and ลืมวิชา. The per-slot dropdown is gone.
- Lint is down to 3 known warnings (the old skills window's two hook warnings went with it).

### Beggars' skill names

- `ep` is now **18 ฝ่ามือพิชิตมังกร** (was "18 ฝ่ามือมังกร") and `bg_lucky_staff` **เพลงไม้เท้าตีสุนัข** (was "เพลงไม้เท้าตีสุข"), with every saga, NPC, rumor and dialog line that names them.
- The staff saga "ตีสุนัข ตีให้สุข" keeps its misheard-name story, but now ends with the true name: the chief says the manual's name is ตีสุนัข and its heart is ตีสุข.

### Foes on roads; beasts drawn right

- **Roads now show their foes.** Walking a road already spawned foes, but the road view never drew them, so they were invisible and could not be fought — kill quests whose target lives in the wilds (สืบทอดไม้เท้าขอทาน's wild dogs, say) could stall on the road. `RouteMapView` passes the road's foes like the location view (`components/world/roaming-foes.ts`).
- **Beasts and repainted archetypes no longer come from a stale cache.** The creature atlas and the seven costume sheets were repainted under the same file names, so a browser (or the service worker's stale-while-revalidate) could keep the old pictures and cut them on the new grid — wrong or empty beasts. Their URLs now carry `?v=ART_VERSION` (`lib/characters/catalog.ts`); bump it when art is repainted in place.
- A beast on the map is cropped to its painted pixels (keeping its cell's scale), so its ⚔ tag sits just above it.

### Regions follow the map

- A place's region (ภาคกลาง / เหนือ / ใต้ / ออก / ตก) now comes from where it sits on the world map: within 170 units of the capital is the heartland, beyond it the compass quarter from the capital. The old hand table had 27 places in a catch-all "wild" region and some on the wrong side (Shaolin "south" though west of the capital). Now: heartland 20, north 16, south 9, east 21, west 31.
- It drives rumor regions and road colour grades. The hand table stays only as the world-map layout seed (`LAYOUT_REGION`).
- Jail: a hero caught outside a city goes to the nearest city's jail (was one city per region).
- **The herb-garden south was cut off.** คุ้มสมุนไพร, บ้านแพทย์น้ำจืด, ถ้ำหุบเขาผีเสื้อ and ถ้ำแมงมุม were joined only to each other, so their people and quests could not be reached on foot. A new road links คุ้มสมุนไพร to สำนักสุลถัง (129 roads), and `test:routes` now fails if any place can't be reached by road from the hero's home.
- `build-world-coords.ts` keeps every existing spot and lays out only new places (a full relayout moved dozens of places and broke the painted exits); `--relayout` still recomputes everything.

### Recorded music

- The main theme (two versions), the battle song and the desert / trade song are real recordings now (`public/audio/`, made with Suno). The 150 MB of WAV masters became 10.8 MB of MP3 (~110 kb/s, loudness-normalised, silence trimmed). Desert places (`desert_*`, `tribe_*`, `city_xixia`, `mt_baituo`, `sect_xingxiu`) play the desert song.
- The synthesized songs remain as the fallback when a recording can't load (offline). Jingles, UI and skill sounds are still synthesized.

## 2026-10-02

### Letters, horse stations, the sword tournament, faster practice

- **Letters (จดหมาย).** Friends (relationship 20+) write with gifts: at most one letter a day and one per person every 15 days; the odds rise with relationship, fame and LUK, and LUK lifts the gift's rarity (ทั่วไป / ดี / หายาก / ล้ำค่า). A toast announces each one; the new 8th HUD tab ✉ จดหมาย shows the unread count, and opening a letter takes its gift.
- **Horse stations (สถานีพักม้า).** Cities, villages and the 15 joinable sects' grounds have one: ride to any station place you have visited for gold and a few ชั่วยาม by distance, with no encounters.
- **ชุมนุมวิจารณ์กระบี่.** A yearly 32-fighter tournament at the capital (register days 60–89 for 100 gold, fought on day 90). Your bouts are real non-fatal battles, the rest simulated by power; each win pays gold and w-exp, your place pays w-exp and fame, and the champion picks any one move or art from the entrants (an NPC champion picks too). Years you miss are fought among the NPCs.
- **Practice** gives 30 xp + 5 % of the next level, or 50 + 6 % at a fitting place (was a flat 30 / 39).
- Save version 23 (`letters`, `letterDays`, `tournament`, `tournamentHistory`). New `bun run test:systems` (17 checks) and `tests/browser/systems.spec.ts` (3 tests).

### Painted enemies and beasts

- **Every foe is painted in the game's style.** Ordinary foes used to borrow the old hand-drawn costume sheets (a thief, a river pirate and a demon master could all be the same "merchant"). Now there are 22 enemy types — thief, bandit, bandit chief, brawler, archer, river pirate, desert marauder, two assassins, poisoner, swordsman, swordswoman, ghost, cult master, evil master, warrior monk, constable, palace guard, enforcer, schemer, brute and empress — each a painted body rigged into full clips (walk, attack, hurt, guard, victory, defeat, front and back walks) like the heroes and NPCs. `foeCharacterFor` picks one for every opponent without NPC art, on the map and in battle.
- **The seven costume archetypes** (elder, monk, merchant, bandit, feng, wang, qing) are repainted and rigged the same way, so cutscene extras and art-less NPCs match too.
- **Twelve painted beasts** replace the old eight-beast atlas: wolf, tiger, bear, boar, snake, rooster, eagle, bat, and new hare, squirrel, wild cat and centipede (hunt rabbits, squirrels, jungle cats, lynxes and centipedes no longer borrow the wolf or the snake). `bun scripts/build-creature-atlas.ts --from <dir>` builds the 4 × 3 atlas.
- **Tapping a foe** walks into it even when it stands over a shop or NPC marker (the foe wins the tap).
- `test:npcs` checks every enemy type is rigged and used, every foe without art draws as one, and every beast has a frame of its kind.

### Foes on the map, and the hero fights by skill

- **No more dice-roll fights.** Walking now brings foes onto the map: each walk tick has a 30 % chance (80 % while hunting a kill-quest target here) to put one a short walk away, at most three at once. They stand with a red ⚔ tag and watch the hero; walk (or tap) into one to face it on the fight-or-flee screen, or walk around it. Who turns up still follows the place (people in towns, beasts in the wilds, spirits near sects and temples) and the hero's power.
- **The law and sect hunters** still catch up at once, as before.
- **Treasure and meeting events are gone**, with their scenes — the four treasures, the three wayside meetings and the 27 place meetings.
- **The hero moves by skill in battle.** A sword sweeps, a sabre leaps and cleaves, fists dash and punch, a spear lunges through, daggers dart in a flurry, hidden weapons are thrown from a step back, music is played afloat, inner arts are channelled rising in qi, and support casts hold a guard — with afterimages and a qi aura (`lib/stage/hero-motion.ts`).
- New `rollFoeSpawn`, store `roamingFoes` / `engageFoe`, `presentation.foes`, `roaming-foes.spec.ts`; `test:law` and `test:grid-skills` check the spawns and the moves.

### Power tiers get their own names and colours

- **New tier names:** สามัญชน, ศิษย์ฝึกหัด, ศิษย์สำนัก, มือดีประจำถิ่น, ท่องเที่ยวทั่วหล้า, ผู้เชี่ยวชาญวรยุทธ์, ฝีมือล้ำลึกเหนือคน, วรยุทธโดดเด่นใต้หล้า, จอมยุทธไร้พ่าย, ปรมาจารย์ยุทธภพ, เป็นหนึ่งในยุทธจักร, ยอดคนใต้หล้า.
- **Each tier has its own colour**, from grey through green, blue, purple and red to orange and gold; ยอดคนใต้หล้า glows. The badge colours show on the fight warning, the encounter screen and the profile.

### Power tiers and a warning before every fight

- **Twelve power tiers** (ระดับพลัง), shown by name only, scored from a fighter's stats, inner arts and move skills — never equipment ([combat.md](combat.md#power-tiers)).
- **Before every fight** the game now shows the foe, its pack, and both sides' tiers with a plain verdict (อันตรายยิ่ง … ด้อยกว่าเจ้ามาก), whether it is fatal, and a เข้าต่อสู้ button. Random encounters show the same reading on their fight-or-flee screen. Battles no longer start by themselves.
- **The profile** shows the hero's tier and score under their name.

### The camera eases back a little

- **The world camera now zooms in about 2.2× (√5)** instead of 3.2×: a fifth of the map is in view, so more of the place shows around the hero and the paintings are less pixelated.

### A closer camera on every map

- **The world camera zooms in about 3.2× (√10)** past its old cover fit on every location map, so a tenth of the map is in view and the hero is about a quarter of the screen tall. Labels, name tags, quest marks, the guide arrow and service / exit badges keep their on-screen size.

### The capital stays a painting

- **นครหลวง is back to its painted 960 × 640 map**, with its old camera, markers and collision. The asset-built isometric city merged in [#44](https://github.com/tao-Isaman/wuxia-world/pull/44) was reverted in full; its engine (composed maps, polygon collision, grid pathing) and art are in that pull request's history if they are wanted again.

### The hero walks in eight painted directions

- **Real directional sprites for the eight heroes.** For each one, five painted strips (front, three-quarter front, profile, three-quarter back, back), each a standing pose and a four-step walk, replace the rigged puppet walk. The west-facing directions mirror the east ones, giving eight headings.
- **The hero faces the way they walk**, by keys, joystick or tap-to-walk, and keeps that heading when they stop. On the battle board their steps use the same sprites.
- New `scripts/build-hero-walk8.ts`, `lib/characters/walk8.ts` and `/art/characters/<id>-walk8.png`; the atlas loader appends the cells as frames 24–51. `test:npcs` checks the sheets and the heading rules.

### The hero matches the world

- **The eight selectable heroes are repainted** (gpt-image-2) in the same semi-realistic painted style as the NPCs, keeping each one's costume, hair and colours, with realistic proportions instead of the big-headed "readability v2" look.
- Their sheets are now rigged by `scripts/build-npc-sheets.ts` from `public/player/body/<id>.png` (new `import-npc-art.ts --heroes`), like the NPCs', so the hero walks, fights and falls the same way as the people around them. The m4 direction layout is gone; the v2 sources stay for rollback.

## 2026-10-01

### The last 32 new NPCs painted

- Portraits and bodies for the households of หนานเสียน, อิดเต็ง, เถียนป๋อกวง, เหมียวเหรินเฟิง, เฉิงอิ๋ง, หยานจี and เป่ยฉิว, the Plum Manor, Fuwei, หูเตาถ่าน and หมอเซวี่ย's last two guests. All 68 place NPCs now have their own art: the 35 strollers play their own rigged sheets (`ANIMATED_NPC_IDS` 48 → 65), the 33 who stand have their own sprites.

### Every new NPC has their own face

- **36 new portraits and painted bodies** (gpt-image-2, in the style of the existing NPC art) for the people of the villages, towns, the palace, the Hui tribe and four homes. The other 32 (the later homes) wait for more image credits and keep their archetype body.
- **The 18 painted strollers play their own rigged sheets** (walk, idle, attack, hurt…) on the map and in battle, instead of a shared m/f body; the 18 painted ones who stand still have their own pixel sprite. `ANIMATED_NPC_IDS` grows from 30 to 48.
- `build-npc-sheets.ts` narrows a figure whose attack pose would leave its cell (the porter's carrying pole); the existing sheets are unchanged.
- New `scripts/import-npc-art.ts` cuts painted bodies out of a flat background, fits them to the body frame and registers the ids. `npcCharacterId` now prefers an NPC's own sheet over its authored fallback body, and so does a spar's battle look.

### Living villages, towns and homes

- **People everywhere.** The 20 places that had no one now have 68 new NPCs: villagers, court eunuchs and maids, Hui herders, the masters of the famous homes (ฮูเฝย์, หนานเสียน, อิดเต็งไต้ซือ, เถียนป๋อกวง, เหมียวเหรินเฟิง, เฉิงอิ๋ง, หยานจี, เป่ยฉิว, the Plum Manor four, the Lin family) and their households, and the hero's own housekeeper and neighbours. 35 of them stroll around their spot (`NpcDef.look`); shopkeepers, elders and masters stand at their post.
- **97 new quests**, 26 of them for NPCs who were already in the game. 69 of them teach every ยุทธจักร T0–T3 move and inner art that had no quest, gated by rarity: T0 a chore, T1 a stat and a few foes, T2 also the giver's trust and a spar, T3 a long story with a twist, a tier-3 foe and an earlier quest of the giver.
- **37 place activities** (dice, chores, drills, tea, prayers…) with a cooldown in days, and **28 place meetings** that happen while walking there; the hero's home rolls only its own (no fights).
- **Gifts.** Every NPC card has ให้ของขวัญ: an item from the bag or 100–5000 gold, once a month per person. Liked gifts count double, a favourite item more, a disliked one costs trust.
- **Assassinated NPCs are gone for good; kidnapped ones are away for 180 days**, then back at their spot.
- **The viewpoint is gone** (`viewpoint`, its two roads and painting).
- Save version 22 (`kidnappedUntil`, `giftDays`, `activityDays`). New `lib/world/data/places/`, `lib/world/gifts.ts`, `lib/world/npc-presence.ts` and `bun run test:places`.

### Location maps repainted to match their exits

- **77 auto-map paintings repainted** (gpt-image-2, from the old painting as reference, then a targeted second pass on 49) so their paths lead to the exits the compass now puts them at. Buildings and layouts stayed put.
- **New collision** for all 77, re-authored against the new paintings and checked with `map-collision-tool.ts` (every marker reachable).
- **Exits sit on their paths.** `lib/world/data/auto-map-exits.ts` snaps each exit marker onto the point where its painted path meets the border; `map-collision-tool.ts` gains `--exits` and `--image`.
- About 20 paintings still show an extra dead-end path off an edge, and four exits have no painted path (see HANDOFF).

### Directional roads

- **Exits face where they go.** Every place has a spot on a world map (`lib/world/data/world-coords.ts`, built by `scripts/build-world-coords.ts`). Exits on a location map sit on the edge facing their destination: a place to the east is reached by the right-hand edge. Auto maps prefer their painted paths when one points within ~43°; hand maps keep their gates and reassign destinations.
- **Roads run the way you left.** 56 new top-down road paintings, 7 types × 8 directions (N, NE, E, SE, S, SW, W, NW), replace the 42 bottom-to-top ones. Leave by the right edge and you start at the road's left end, walk right, and the destination waits at the right end. Regional colours are graded when the map loads (`lib/stage/route-grade.ts`), so the folder shrank from 19 MB to 14 MB.
- **Arrive on the side you came in.** Reaching a place (or turning back) puts the hero beside the exit back where they came from, facing into the map. A road always starts at its near end.
- New `lib/world/compass.ts`, `bun run test:routes` and `tests/browser/routes.spec.ts`.

### One way to every sect skill: its quest

- **Sect ranks no longer grant martial arts.** The skill and art pools (`skillsByRank` / `artsByRank`), the reward picker and the auto-grants are gone. A rank-up now pays gold (`rankUpGold`, half its point cost) and opens more lineage quests and sagas. The sect window's tab is now 🎖 ขั้นและวิชา: rank-up, then every sect skill and art with its quest and what it still needs.
- **Old quests stop teaching sect skills.** The eight T3 sect art quests are now lineage prologue trials (`LINEAGE_PROLOGUES`) that open their art's lineage quest. Six other quests pay gold instead: `qst_shaolin_proof_of_heart`, `qst_shaolin_iron_training`, `qst_shaolin_wudang_joint`, `qst_wudang_sacred_herb`, `qw_kunlun_exile_truth` and `qe_xueyu_sect_initiation` (which taught the T4 `blood` and skipped its saga). Their lines were rewritten to match.
- **25 sect manuals removed** (`man_sf`, `man_tj`, `man_jy_*`…), with their drops; seven spy quests pay 400 gold instead. Saves drop them on load. The dangling `man_ne2` drop went too.
- **Resigning** freezes the xp of every skill and art of that sect, not only the old rank picks.
- `test:story` checks that nothing but the lineage quest or saga teaches a sect skill or art.

### Sect lineage quests, story sagas and cutscenes

- **Every sect skill and art now has a quest.** 154 lineage quests (สืบทอดวิชา, `ql_*`) pass on each tier 0–3 sect skill and art from an NPC at the sect's grounds. Difficulty follows the tier: rank and gearless-stat gates, more foes, items, and a spar with the teacher from T2. The outsider sects gate on evil or the venom life skill.
- **38 story sagas** (ตำนาน, `st_*`, quest type `"story"`), one per T4 sect skill or art: 8–10 chapters each (340 in all) that retell legends of มังกรหยก ภาค 3 a century later, with funny present-day casts, flashbacks, twists, small rewards per chapter and the technique at the end. 38 new saga bosses (`st_*` opponents).
- **Cutscenes.** 292 films staged on the painted maps (`lib/stage/cutscene-runtime.ts`, `components/world/cutscene-player.tsx`): actors walk and fight with their sheets, Phaser effects, moods (the sepia `past` flashback, night, dusk, snow, rain), letterbox, subtitles with a typewriter, title cards, auto-play and skip.
- **Dialogs** play a film first (`DialogScene.cutscene`), page long talks (`paged`, "ต่อ ▶"), and replace `{hero}` with the player's name.
- **Quest log.** A ตำนาน tab with saga progress, the next chapter's giver and gates, and 🎬 replays; 📜 / "ตำนาน" and "สืบทอดวิชา" badges.
- **Rules.** Story and lineage quests can't be abandoned and don't fail when their giver dies. The seven old T4 art quests became prologue trials that open their saga. New conditions `learnedSkill` and `statAtLeast` (26 kinds).
- New `bun run test:story` and `tests/browser/story.spec.ts`; docs [story-quests.md](story-quests.md) and [story-writing.md](story-writing.md).

### Inner arts: คัมภีร์เก้าอิม replaces เก้าหยินจิงชี่ and เก้าหยางเซินกง

- **Removed** the T4 arts `jiuyin` เก้าหยินจิงชี่ and `jiuyang` เก้าหยางเซินกง (122 arts now). Saves that held them drop them on load (`validateAndRepair`).
- **New T5 art `kgim` คัมภีร์เก้าอิม** (ยุทธจักร, หยิน · ภายใน): INT +30, POW +30, DEX +20, HP / MP growth 20 / 60, MP regen 5 %.
  - Active กรงเล็บกระดูกขาวเก้าอิม: Int ×1.8, pierces 50 % IDef, 55 MP, cooldown 5.
  - Passive: every Int skill gives the foe PDef −15 for 2 turns.
  - It takes over the nine-yin icon.
- **Opponents moved over:** จักรพรรดิมาร now uses `kgim`, ภูเขาเหล็ก uses `kuyt` วิชาเก้าเอี้ยง, and นักรบอมตะ uses `diamond`. The nine-yin lore rumor names the new manual.

### Rigged NPC sheets: a distinct pose in every frame

- The first sheets warped the whole painting, so many frames repeated: idle 1 = 3, walk 4 = 6 and 5 = 7, and all eight north / south walk frames were the same picture.
- `scripts/build-npc-sheets.ts` now cuts each figure into back leg, front leg, torso and head and poses them separately. The result: real strides, a coiled wind-up, a lunge with a qi arc, a knocked-back and flushed hurt pose, a crouched guard, and a victory with glints.
- `test:npcs` now fails when two frames of a clip are too alike.

### Wave 27 — animated, wandering NPCs and named villains

- **30 NPCs walk like the hero.** The 15 sect heads, หมอหลิน, นายอำเภอหวู่, เถ้าแก่หวาง, ทูตหลิวอิง, นักยุทธศาสตร์กง and 10 villains now have full animation sheets in the hero layout: idle, walk, attack, hurt, guard, victory, defeat, walk north and walk south. `scripts/build-npc-sheets.ts` rigs them from each NPC's painting into `public/art/characters/npc/`; the list is `lib/characters/npc-sheets.ts`.
- **They wander.** On the map these NPCs stroll around their spot with the walk clip for the way they head, and stand still when the hero comes near, walks to them or hovers them (`lib/stage/npc-wander.ts`). Picking, the action button and the guide follow where they stand.
- **They fight with real clips.** Sparring a sect head now plays that NPC's own walk and attack frames instead of a single still.
- **10 villain bosses.** `elite_villain_*` opponents are the villains themselves (`look.npc`): เถ้าแก่โจวตลาดมืด, ทูตเซี่ย, ขุนนางหยาน, หัวหน้าโจรชิง, นักฆ่าเงาหยิง, เจ้าลัทธิจ้าวมังกรเทพ, ผู้อาวุโสตู๋ซื่อ, ฮุยเป้า, ดาบเลือดเซียะลาง and ตู๋โซ่ว, each with a gang. They join the encounter pool once the hero is strong, rarer than other bosses (`share`), and never after the hero has killed or kidnapped them.
- New `bun run test:npcs`; `test:grid-store` and the e2e suite check the new looks and the wandering.

### Wave 26 — enemy variety, bigger battles, bottom skill strip, bad-action quests

- **More enemies.** 14 new foes in `opponents.ts`: variants of existing beasts and people (vampire bat, frost wolf, blood boar, bandit archer and lieutenant, night blade, cult zealot), stronger tier-3 foes (golden tiger, jade python, thunder eagle, ghost swordsman) and three tier-4 bosses with their gangs (`elite_bandit_king`, `elite_cult_elder`, `elite_bear_king`). All roll in random encounters; the bosses only once the hero is strong.
- **Sprite variants.** `UnitLook` and `OpponentDef.look` take `tint` and `size`, so one sprite makes several foes and bosses stand taller than their gang.
- **Bigger packs.** `pack` can be a mixed list; 25 foes bring companions, the first kind gains +1 / +2 as the hero grows stronger, capped at 6.
- **Bigger boards.** The board grows with the number of units — 10 × 7, 12 × 8, 13 × 9, up to 15 × 10 (`boardSizeFor`) — and fits a landscape phone.
- **Skill strip.** The battle skill bar is now a horizontal strip of icon tiles along the bottom, like Wandering Sword, with the controls at its right end.
- **Bad-action quests.** One rule (`badActionOffered`) now decides the steal / assassinate / kidnap buttons. Fixed เถ้าแก่หวาง (both copies), whom a spy quest asks the hero to rob but who had nothing to steal, so no steal button appeared. New `scripts/test-bad-action-quests.ts` (in `test:quests`) checks all 39 such stages.

## 2026-09-30

### Docs rewrite ([#30](https://github.com/tao-Isaman/wuxia-world/pull/30))

- **Audit.** Every document was checked against the code, and the stale claims were corrected. Examples:
  - save version 21, not 19;
  - 15 joinable sects, not 11;
  - encounters roll per walk tick, not on arrival;
  - item stages count what the hero holds;
  - there are six stores.
- **Rewritten:** [README](../README.md), [CLAUDE.md](../CLAUDE.md), [HANDOFF.md](../HANDOFF.md) (now current state, known issues and next steps; its wave log moved here), [DESIGN.md](../DESIGN.md) and [ONBOARDING.md](../ONBOARDING.md).
- **New topic guides** under [docs/](README.md): gameplay, architecture, combat, grid combat, world engine, Liveness Layer, content authoring, rendering and UI, audio, PWA, save format, testing, scripts.
- **Generated reference pages** ([docs/reference/](reference/README.md)) for every location, sect, quest, NPC, skill, art, gear, item, recipe and opponent. `scripts/build-docs-reference.ts` builds them, and its `--check` mode fails when a page is stale.
- **`bun run test:docs`** checks that the reference is current and that every link, backticked repo path and command in the docs resolves (`scripts/check-docs.ts`).
- **Specs moved under `docs/specs/`** with status banners: the Liveness Layer spec and plan, the sect template (updated to the membership system and current budgets), the Shaolin sheet (rewritten from current data) and the location concept list.
- **`review/README.md`** indexes the historical critic reports. The `public/art` provenance notes now show which sheets are active.

### Wave 25 — quest objectives and quest tracking ([#29](https://github.com/tao-Isaman/wuxia-world/pull/29))

- Fixed quests that could never finish: 44 stages across 35 quests had no way forward (for example เครือข่ายสายลับ's "observe the city gate" at ฉางอัน). They now have **objectives**: 🔍 spots on the map, actions in a person's popup, or links that open the quest's own dialog (`QuestStage.objective`, `lib/world/quest-objectives.ts`).
- **Tracking for every quest type**: the guide points at people, objective spots, places to visit, the nearest source of a wanted item (shop, gathering node, hunt, enemy drops) and where a wanted foe roams.
- Quest log: a 📌 ติดตาม pin per active quest. HUD: a tracker under the sundial showing the tracked quest's step, action, counter and distance.
- `audit-quest-completion.ts` now fails on middle stages with no way forward and on flag stages nothing sets. New `scripts/test-quest-guide.ts`; e2e `quest-tracking.spec.ts`.

### Wave 24 — grid tactics combat ([#28](https://github.com/tao-Isaman/wuxia-world/pull/28))

- Battles moved to a Wandering-Sword-style tactics board (10×7 tiles): per-unit turn order, move then act, ranges and areas for every skill and art, enemy AI and an อัตโนมัติ auto mode. Damage and effects still come from the original engine (`lib/game/battle.ts`) through a per-pair duel view. See [grid-combat.md](grid-combat.md).
- Random encounters can bring an opponent's pack (up to 2 extra enemies).
- Every unit animates with its own look: character atlases play their clips; beasts and unique NPC stills get procedural motion.
- **(replaces)** the real-time side-view 1v1 battle screen (`lib/stage/battle-runtime.ts`, removed).

### Wave 23 — item and kill quests always hand in ([#27](https://github.com/tao-Isaman/wuxia-world/pull/27))

- Fetch quests counted only items gained after accepting while the log showed the bag total (10/10 shown, never advanced). Item stages now count what the hero holds; kill stages count kills since accepting, and the log shows the same number.
- The store re-checks quest progress whenever the inventory or kill counts change.
- `scripts/test-quest-turnins.ts` plays every item / kill quest from accept to hand-in.

### Wave 22 — jail map, retreat, places tabs ([#26](https://github.com/tao-Isaman/wuxia-world/pull/26))

- The jail is a real map (`jail`): locked in until the sentence ends, with labour, dice, meditation, a risky escape, the gate, a prisoner and a bribable guard. Save version 21 (`jailUntil`).
- Battle: ถอยหนี (retreat) replaced ตั้งรับ (guard) and รวบรวมปราณ (recover).
- จุดหมาย (places list) got tabs: บุคคล / เส้นทาง / สถานที่ / กิจกรรม. Every map activity has its own sign glyph.
- The walk cycle alternates feet (`lib/characters/walk-cycle.ts`). The top-left party card was removed.

### Wave 21 — dialogue fits everywhere ([#25](https://github.com/tao-Isaman/wuxia-world/pull/25))

- Quest offers and event dialogs away from a staged map use the same full-screen dialogue stage, which shrinks text until nothing scrolls.
- Chess and begging moved to cities and villages only, on street corners.

### Wave 20 — walk ticks, wanted marks, quest guide, busy overlay ([#24](https://github.com/tao-Isaman/wuxia-world/pull/24))

- Random events roll while walking (every 220 map units), never on arrival.
- Failed steals add หมายจับ (wanted) marks; walking may bring constables, imperial guards or bounty hunters; losing means jail time (`lib/world/law.ts`). Save version 20.
- Busy actions show the hero working behind a progress bar that blocks input.
- First quest guide: who to see and where, with map arrows (extended to every stage type in wave 25).
- Talking to a person is full-screen and auto-fits.

## 2026-09-29 → 2026-09-30

### Wave 19 — music and sound ([#23](https://github.com/tao-Isaman/wuxia-world/pull/23))

- Procedural soundtrack and effects, no audio files (`lib/audio/`): world, night, battle and title music, jingles, skill sounds from the VFX profile, and a ♪ settings bubble.

### Wave 18 — skill VFX ([#22](https://github.com/tao-Isaman/wuxia-world/pull/22))

- Every skill and art cast gets VFX by rarity (tier), weapon family and element (`lib/stage/cast-vfx.ts`, `battle-vfx.ts`).
- Fixed a turn-order crash ("no actor after tick"). The day pill moved below the sundial.

### Wave 17 — HUD polish ([#21](https://github.com/tao-Isaman/wuxia-world/pull/21))

- Compact action button; rest became a round button with a bubble of rest choices; readable profile tabs. (The HP card it added top-left was removed in wave 22.)

### Wave 16 — mobile-first HUD ([#20](https://github.com/tao-Isaman/wuxia-world/pull/20))

- Top icon bar for every menu, a floating left-thumb joystick, and a context action button near people, signs and exits. **(replaces)** the เมนู command window, minimap and floating journey guide.

### Wave 15 — installable PWA ([#19](https://github.com/tao-Isaman/wuxia-world/pull/19))

- Web app manifest, home-screen icons, a hand-written service worker that caches the app and visited art for offline play, and an install button.

### Wave 14 — Phaser 4 ([#18](https://github.com/tao-Isaman/wuxia-world/pull/18))

- World and battle renderers rewritten in Phaser 4 (WebGL with a Canvas fallback). **(replaces)** the Three.js runtime, which needed WebGL 2 and showed nothing on old or GPU-blocklisted browsers. `lib/three/` became `lib/stage/`.
- Route scenes got varied road maps; an old-browser crash was fixed.

### Waves 12–13 — Hero's Adventure UI, unique NPC sprites, Dragon Quest XI HUD ([#17](https://github.com/tao-Isaman/wuxia-world/pull/17))

- Menus open in one full-screen tabbed shell; rarity-framed item tiles; skill loadout; parchment dialogue with a portrait plate.
- Every NPC got its own pixel sprite in the world and in battle (`scripts/build-npc-sprites.ts` → `public/npcs/pixel*`).
- Dragon Quest XI-style HUD in wuxia dress (purse, sundial, arrival banner, autosave quill). Parts were later replaced by the mobile-first HUD (wave 16).

### Wave 11 — benchmark on Hero's Adventure ([#16](https://github.com/tao-Isaman/wuxia-world/pull/16))

- Readability-v2 character sprites adopted (re-packed with `scripts/repack-character-sheet.ts`).
- Grounded collision for all 98 generated maps (`lib/stage/world-footprints-data.ts`, `scripts/build-map-footprints.ts`, `scripts/map-collision-tool.ts`).
- Campaign completability audit (`scripts/audit-quest-completion.ts`) and five dead ends fixed.
- Large dialogue portrait busts; a turn-order timeline in battle.

### Wave 7–10 handoff ([#15](https://github.com/tao-Isaman/wuxia-world/pull/15))

- Work from an earlier agent: a Three.js runtime (replaced in wave 14), review waves 7–10 under `review/`, readability-v2 sprite candidates, the `/progress` journal and the first handoff doc.

## 2026-08-14 — maps and game-style UI (#1–#14)

- AI-generated icons for every move skill (#1) and inner art (#2).
- Painted location maps with click-to-move, first at home (#3), then every location: 98 generated paintings with convention-based marker layouts (#7).
- Game-style UI: icon menu bar, camera viewport maps, services as map objects (#4); full-screen map with in-map HUD (#5); a detailed home map (#6).
- Route edges became walkable road maps (#8).
- 2D NPC portraits; battles and dialogs play over the map (#9); full-body NPC sprites on maps (#10).
- Selectable player bodies and larger character models (#11); portrait auto-rotation on phones (#12, later removed); map position fixes and steal fights against the robbed NPC (#13); conversations inside the game HUD (#14).

## 2026-05-07 → 2026-05-10 — the text RPG

- The original single-file prototype (`demo.html`) became a Next.js app: the combat engine (`lib/game/`), the world / story engine (`lib/world/`), sects and the disciple system, skill rework and rebalancing, bad-action quests (steal / kidnap / assassinate), roadside rest.
- The Liveness Layer (NPC simulation and rumors) was specified in `docs/specs/liveness-spec.md` and built (`lib/world/npc-tick.ts`, `lib/world/rumor-engine.ts`) on 2026-05-10.
