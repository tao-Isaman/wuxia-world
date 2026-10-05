# Sect lineage quests, story sagas and cutscenes

Every sect skill and art can be earned through a quest:

- **Lineage quests** pass on each T0–T3 sect skill and art.
- **Story sagas** are 8–10 linked chapters that tell a legend of มังกรหยก ภาค 3 and end in a T4 sect skill or art.
- **Cutscenes** stage scenes on the painted maps, like a film.

This page covers the engine. How to *write* the content is in [story-writing.md](story-writing.md).

## Contents

- [At a glance](#at-a-glance)
- [Files](#files)
- [Lineage quests](#lineage-quests)
- [Story sagas](#story-sagas)
- [Jianghu sagas](#jianghu-sagas)
- [Cutscenes](#cutscenes)
- [Dialogs: films and pages](#dialogs-films-and-pages)
- [Quest log and NPC card](#quest-log-and-npc-card)
- [Safety rules](#safety-rules)
- [Tests](#tests)

## At a glance

| | Lineage quest | Story saga chapter |
| --- | --- | --- |
| Quest id | `ql_<skill\|art>_<id>` | `st_<arcId>_<nn>` |
| `QuestDef.type` | `"side"`, with `lineage: { kind, id }` | `"story"`, with `story: { arcId, chapter }` |
| Offered by | a sect NPC's card | the chapter's giver (often the master) |
| Gate | not learned, scroll not held; tier-based rank, stat, outsider trait; eight T3 arts also need their old art quest done (`LINEAGE_PROLOGUES`) | chapter 1: the saga's `require` + not learned + scroll not held; then the previous chapter done (+ the chapter's own `require`) |
| Ends with | `learnSkill` / `learnArt` (handed over as the move's scroll) + w-exp + relationship + sect points | small rewards; the last chapter also hands over the T4's scroll (arts read at level 3) |
| Scenes | `qs_<id>_offer`, `qs_<id>_complete` | the same, plus a scene per visit / talk / duel step (`st_<id>_s<n>`, `…_win`, asides `…_a<k>`) |

**Mystery rewards.** `applyQuestRewards` turns `learnSkill` / `learnArt` into the move's scroll item (`scrollItemId(kind, id)`; nothing if known or already held), and the UI shows the reward as `MYSTERY_MOVE_LABEL` (📜 วิชาลึกลับ). Compiled lineage quests are named `สืบทอดวิชาลึกลับของ<teacher>` (`· ม้วนที่ <n>` from a teacher's second lesson on, numbered in `LINEAGE_SPECS` order) and their description and summary name neither move nor tier; `spec.title` still overrides the name. The sect window lists only T0–T3 lineage moves (unlearned ones as วิชาลึกลับ); the T4 saga trials (`SAGA_PROLOGUES`) are `isSecretSectQuest` — off the sect window, offered on their giver's card.

Both reuse the ordinary quest engine: stages, `autoAdvance`, objective spots, NPC-card accept / hand-in, the guide arrow and the HUD tracker.

## Files

| File | What |
| --- | --- |
| `lib/world/story/types.ts` | the authoring formats: `LineageSpec`, `StoryArcSpec`, `StoryStep`, `StoryBeat`, `CutsceneSpec`, `CutsceneBeat` |
| `lib/world/story/compile.ts` | pure compiler (spec → QuestDefs, dialog Scenes, cutscenes); lookups come through `StoryResolvers` |
| `lib/world/story/registry.ts` | compiles all content once; `STORY_QUESTS`, `STORY_SCENES`, `CUTSCENES`, `STORY_ARCS`, `getCutscene`, `getStoryArc`, `STORY_RESOLVERS` |
| `lib/world/data/story/*.ts` | the content, one or two files per sect, each exporting `LINEAGE` and `ARCS`; `index.ts` registers them |
| `lib/world/data/quests.ts`, `scenes.ts`, `opponents.ts` | append `STORY_QUESTS`, `STORY_SCENES` and the sagas' new foes (`st_*`, built from `StoryOpponentSpec`) |
| `lib/stage/cutscene-runtime.ts` | the Phaser film player |
| `components/world/cutscene-player.tsx` (+ `.module.css`) | the full-screen player UI |
| `components/world/dialog-stage.tsx` | plays a dialog's film first, then its lines one beat at a time ([rendering.md](rendering.md#dialogs)) |
| `components/world/saga-list.tsx` | the quest log's ตำนาน tab |
| `scripts/test-story-quests.ts` | `bun run test:story` |

## Lineage quests

`compileLineage` builds the whole quest from the item's tier (`LINEAGE_TIERS`):

| Tier | Rank gate (joinable sects) | Stat gate | Stages | Rewards |
| --- | --- | --- | --- | --- |
| T0 | member, active | — | beat the foe ×2 → return | w-exp 60, sect points 20 |
| T1 | ¼ up the ladder | 10 | foe ×3 → bring the item ×2 → return | w-exp 120, points 40 |
| T2 | ½ up | 15 | foe ×3 → item ×3 → win a spar with the teacher → return | w-exp 200, points 60 |
| T3 | ¾ up | 25 | foe ×4 → item ×2 → spar → return | w-exp 320, points 100 |

- **Rank gate.** `round(startRank − (startRank − topRank) × fraction)`, as `sectRankAtLeast`. For example, a 9 → 1 ladder needs rank 7 / 5 / 3 for T1 / T2 / T3.
- **Stat gate.** `statAtLeast` on the item's strongest stat — the gearless value manuals also check.
- **Outsider sects** (cannot be joined) gate on a way of life instead:
  - สำนักดาวดึงส์ and สำนักดาบโลหิต need evil;
  - พรรคเบญจพิษ needs the venom life skill.
- **The spar** is a `defeatedOpponent` stage on the teacher's `sparOpponentId`. It is skipped when the teacher has no spar build.
- **Kills count since accepting**, like every kill stage.

## Story sagas

`compileArc` turns each chapter into a quest. Each step becomes one stage, plus a final "กลับไปหา <giver>" stage handed in on the NPC card:

| Step | Stage |
| --- | --- |
| `visit` | an objective spot at the place; its dialog's choice advances |
| `talk` | an objective spot on the NPC's card at that place |
| `duel` | a spot opening the before-dialog; its choice starts a **non-fatal** `triggerBattle` (win → the after-dialog, which advances; loss → back to the map, spot still open) |
| `hunt` | `defeatedOpponent` (since accepting) |
| `gather` | `hasItem` (handed over at the end) |
| `trait` / `stat` | `trait` / `statAtLeast` |

Chapters chain on `questStatus … done`. The saga's info (`StoryArcInfo`: titles, quest ids, cutscene ids) drives the quest log.

## Jianghu sagas

The ten jianghu (ยุทธจักร) T4 / T5 moves have no sect to vouch for the hero, so each is the reward of a longer, harder saga in `lib/world/data/story/jianghu/<file>.ts` (arc id `jh_<file>`, `sc: "ยุทธจักร"`, no `sectId`, registered in `index.ts`). `test:story` enforces the size and the gate (`sagaRule`):

| | Chapters | Films | Duels | Arc gate |
| --- | --- | --- | --- | --- |
| Sect T4 saga | 8–10 | ≥ 4 | — | sect member, rank, a stat ≥ 40 |
| Jianghu T4 | 16–20 | ≥ 8 | ≥ 8 | main story done (`st_main_15`), a stat ≥ 80, no sect condition |
| Jianghu T5 | 32–40 | ≥ 16 | ≥ 16 | main story done, a stat ≥ 120, no sect condition |

Their duel foes (`st_jh_*`) are about twice as strong as sect-saga foes, and inner chapters raise stat gates further. Every jianghu T4 / T5 move has exactly one saga (`coverage: every jianghu T4 / T5 move has exactly one saga`).

| File | Reward | Tier |
| --- | --- | --- |
| `six_meridian` | `lmsj` กระบี่ 6 ชีพจร | T4 |
| `lone_sword` | `dgjj` เก้ากระบี่เดียวดาย | T4 |
| `witness_spear` | `ng2` ทวนประจักษ์พยาน | T4 |
| `godslayer_blade` | `ng5` ดาบยาวเทพสังหาร | T4 |
| `cosmos_fist` | `nu2` หมัดสะท้านจักรวาล | T4 |
| `mountain_army` | `military` เคล็ดวิชาภูผาทะลายทัพ | T4 |
| `heaven_fire` | `fire` ตำราเพลิงสวรรค์ | T4 |
| `sunflower` | `khbt` คัมภีร์ทานตะวัน | T5 |
| `nine_yang` | `kuyt` วิชาเก้าเอี้ยง | T5 |
| `nine_yin` | `kgim` คัมภีร์เก้าอิม | T5 |

## Cutscenes

A cutscene is registered under `cs_<sceneId>` and played by a dialog whose `cutscene` field names it.

- **Stage.** The location's painted map (`getLocationMap(stage).image`), centred on `around` (an NPC's spot) or the map's arrival point.
  - Cast positions are grid steps (26 × 18 map units) around that centre, snapped onto walkable ground (`nearestWorldGround`).
  - The camera eases to `camera` targets; `zoom` is in map widths per view (default 2.4).
- **Actors** use the same atlases as the map: hero bodies, archetypes, the 65 rigged NPC sheets, `"hero"` (the player's body), or creature-atlas beasts.
  - They walk with the walk clips (north / south rows when moving vertically), lunge on `attack`, and hold `hurt` / `guard` / `victory` / `defeat`.
  - Speakers turn toward the nearest other actor.
- **Effects:**
  - drawn by Phaser: slash, burst, qi, sparkle, smoke, fire, blood, heal, ice, poison, lightning and shake;
  - DOM overlays: flash and fades;
  - ambient particles: petals, snow, rain.
- **Moods** grade the canvas with CSS filters:
  - `past` is the sepia flashback with film grain;
  - `night`, `dusk`, `snow` and `rain` have their own grades.
- **Controls.** Tap, Enter or Space finishes the typewriter, then moves on. "อัตโนมัติ" advances on a timer (1.4 s + 55 ms per character); "ข้าม" or Esc skips.
- **Pausing.** The player is `role="dialog"`, so the world map pauses underneath.
- **Reduced motion.** `prefers-reduced-motion` turns walks into cuts and turns off shake, particles and bars.
- **Watched films** set the flag `seen-cutscene:<id>`, and the ตำนาน tab can replay them. Flags ride the save, so no save version bump is needed.
- **Test hooks:** `data-testid="cutscene"`, `data-cutscene-id`, `data-ready`, `data-beat`, `data-mood`.

## Dialogs: films and pages

- `DialogScene.cutscene` — `DialogStage` renders the `CutscenePlayer` first, once per visit to that scene, then the lines and choices.
- `DialogScene.paged` — set by the compiler for dialogs of more than 4 lines; kept for old content, since every dialog now plays one line per beat.
  - The lines show a page at a time: up to 4 lines or 260 characters, with a "ต่อ ▶ (n/N)" button.
  - The choices appear after the last page.
  - Test hooks: `data-page` / `data-pages` on the dialog, `data-testid="dialog-next-page"` on the button.
- `"{hero}"` in any line, speaker or cast name becomes the player's name (`DialogDisplay`, the cutscene player).

## Quest log and NPC card

- **Quest log.** The **ตำนาน** tab (`SagaList`) lists every saga — those under way first — with:
  - the sect and reward;
  - chapter progress (✓ / ▶ / ○, future chapter titles hidden);
  - who offers the next chapter and what it still needs;
  - 🎬 replays of watched films.
- **Badges.** Story chapters show 📜 and a "ตำนาน" badge; lineage quests show "สืบทอดวิชา".
- **NPC card.** Chapters and lineage quests are ordinary offers on the giver's card, and the briefing (`qs_<id>_offer`) opens after accepting.

## Safety rules

- **Declinable and droppable, never lost.** Every compiled offer scene (and its asides) carries a `DECLINE_TEXT` choice ("ขอปฏิเสธไว้ก่อน") back to the giver's place; the NPC card opens an offer scene that starts its quest **before** accepting, so declining leaves nothing behind. The sect art trials (no offer scene) ask in a confirm box. `abandonQuest` on a lineage quest, saga chapter or art trial deletes its entry, its `qobj:` flags and the tracking pin instead of failing it: they are the only way to their skill or art (save the sword tournament champion's prize pick — see [gameplay.md](gameplay.md#the-sword-tournament-ชุมนุมวิจารณ์กระบี่)), so they must come back.
- **Outlive their giver.** When the NPC simulation kills a giver, `failQuestsForDeadGivers` skips story and lineage quests. Dead masters stay on their map, so the hand-in still works.
- **New conditions.**
  - `learnedSkill` is the counterpart of `learnedArt`.
  - `statAtLeast` checks a gearless stat (`gearlessStat` in `conditions.ts`).
  - `describeQuestCondition` shows both with counters.

## Tests

`bun run test:story` (`scripts/test-story-quests.ts`); `STORY_SECT=<sect label>` limits it to one sect.

- **Coverage.** Every sect skill and art has exactly one source: a lineage quest (T0–T3) or a saga (T4).
- **One way only.** No other quest, dialog, manual or hall teaches a sect skill or art (sect ranks have no skill pools); scroll items are exempt as the quests' own rewards, and nothing may hand one out directly.
- **Secret trials.** Each T4 saga trial is off the sect window, its giver stands on a map, and the card offers it only to an active member at its rank.
- **Mystery.** No quest that teaches a move names it (or a tier) in its name, summary or description.
- **Scrolls.** The play-through checks each quest hands over exactly its scroll, that reading it teaches the move, and that the saga isn't re-offered while the scroll is unread.
- **Lineage.** The teacher lives at the sect's grounds; the foe roams and is within one tier; the item is obtainable; 2–6 lines each way.
- **Sagas:**
  - 8–10 chapters, with a T4 reward of the same sect;
  - givers on maps; real places, people, foes and items;
  - small rewards and no learn rewards mid-saga;
  - at least 14 lines per chapter;
  - at least 4 cutscenes, including the opening and the finale.
- **Cutscenes.** Real stages and looks, positions on stage, beats naming cast members, known fx, motions and moods.
- **Compiled.** Ids are unique and registered, chapters are chained, and offer / complete scenes exist.
- **Play-through.** Every lineage quest and every chapter runs in the real store: accept → spots, battles and counters → hand-in → learned. A finished saga is not offered again.
- **Difficulty.** T1+ lineage quests have a stat gate; sagas gate chapter 1 on rank and a stat.
