# Changelog

What changed, when, and in which pull request. Newest first. Each entry says what a player or developer would notice; the pull request diff has the detail. Some older entries describe systems that later changes replaced — those are marked **(replaced)** with a pointer to the change that replaced them.

Pull requests are on [github.com/tao-Isaman/wuxia-world](https://github.com/tao-Isaman/wuxia-world/pulls?q=is%3Apr+is%3Amerged). The waves are the build → test → review rounds the agents worked in (see [HANDOFF.md](../HANDOFF.md)).

## 2026-10-01

### Wave 26 — enemy variety, bigger battles, bottom skill strip, bad-action quests

- **More enemies.** 14 new foes in `opponents.ts`: variants of existing beasts and people (vampire bat, frost wolf, blood boar, bandit archer and lieutenant, night blade, cult zealot), stronger tier-3 foes (golden tiger, jade python, thunder eagle, ghost swordsman) and three tier-4 bosses with their gangs (`elite_bandit_king`, `elite_cult_elder`, `elite_bear_king`). All roll in random encounters; the bosses only once the hero is strong.
- **Sprite variants.** `UnitLook` and `OpponentDef.look` take `tint` and `size`, so one sprite makes several foes and bosses stand taller than their gang.
- **Bigger packs.** `pack` can be a mixed list; 23 foes bring companions, the first kind gains +1 / +2 as the hero grows stronger, capped at 6.
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
