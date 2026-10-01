# Changelog

What changed, when, and in which pull request. Newest first. Each entry says what a player or developer would notice; the pull request diff has the detail. Some older entries describe systems that later changes replaced — those are marked **(replaced)** with a pointer to the change that replaced them.

Pull requests are on [github.com/tao-Isaman/wuxia-world](https://github.com/tao-Isaman/wuxia-world/pulls?q=is%3Apr+is%3Amerged). The waves are the build → test → review rounds the agents worked in (see [HANDOFF.md](../HANDOFF.md)).

## 2026-10-01

### Every new NPC has their own face

- **68 new portraits and painted bodies** (gpt-image-2, in the style of the existing NPC art) for the people of the villages, towns and homes.
- **The 35 strollers play their own rigged sheets** (walk, idle, attack, hurt…) on the map and in battle, instead of a shared m/f body; the 33 who stand still have their own pixel sprite. `ANIMATED_NPC_IDS` grows from 30 to 65.
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
