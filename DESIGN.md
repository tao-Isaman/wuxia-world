# Wuxia pixel-art / Phaser design

## Visual direction

Detailed 32-bit-era pixel characters inhabit warm Chinese courtyards, market streets and mountain landscapes. The palette uses jade, lacquer, muted gold and warm earth. Thai names, story, world geography and progression remain the game's identity. Hero's Adventure: Road to Passion is the single benchmark: coherent character/world scale, perspective, pixel texture, expressive character staging, and clear battle decisions. It is a quality reference, not a source of copied assets or a verified parity claim.

## Runtime boundaries

Phaser 4 owns the 2D world and combat stages (`lib/stage/phaser-stage.ts`): WebGL when available, the Canvas renderer otherwise. Both runtimes are dynamically imported only in the browser. React owns accessible forms, HUD, menus, dialogs and action controls. Pure TypeScript combat/story rules remain in `lib/game` and `lib/world`; Zustand connects them to rendering and persists version-19 saves. Renderer objects, GPU resources and walking positions never enter a save. Three.js (which required WebGL 2) was replaced by Phaser in wave 14.

- `lib/stage/world-runtime.ts`: loading, nearest texture sampling, depth sorting, keyboard/touch input, marker picking, camera follow and animation.
- `lib/stage/world-navigation.ts`: authored solid footprints, swept movement with sliding, nearest accessible ground and visibility-graph detours.
- `lib/stage/world-occlusion.ts`: foreground cutouts from the original paintings, sorted against character feet.
- `lib/stage/world-lighting.ts`: game-clock atmosphere, with authored home/capital lantern pools. This is a stylized flat lighting pass, not dynamic 3D shadow simulation.
- `lib/stage/world-placement.ts`: restores a local conversation beside its known speaker when no session position exists; preserves remembered positions and checks connected ground.
- `lib/stage/battle-background.ts`: selects the practice yard for the exact beginner duel and a capital street only for confirmed capital-origin encounters. Other/debug contexts retain the courtyard; no missing route origin is invented.
- `lib/stage/battle-runtime.ts`: combat clock, local cast timing, sprite poses, impacts and explicit progress callbacks. HP and outcome presentation follow actual impacts rather than independent wall-clock timers.
- `lib/characters`: original-image catalog, shared atlas normalization and animation metadata. Each sheet is scaled once rather than resizing each pose independently.

All Phaser games, textures, input handlers, observers and animation frames are released on teardown. Dialogs, hidden tabs and form input suspend game input; queued world walking is cancelled. Reduced motion removes ambient drift and camera/impact shake, and holds static poses. A lost WebGL context exposes a retry control.

## Characters and spatial design

Eight heroes have 24 poses: idle 4, horizontal walk 4, attack 4, hurt/guard/victory/defeat, north walk 4 and south walk 4. Horizontal movement mirrors; vertical idle retains the facing direction. Four supporting archetypes (elder, monk, merchant, bandit) have 16 poses; NPCs also reuse appropriate hero costumes. Individually drawn Feng, shopkeeper Wang and clerk Qing add 16 poses each. Their bowl/apron, fan/rounded silhouette and cap/document roll distinguish capital inhabitants. Existing NPC portraits remain intact; characters without a portrait use their animated sprite in dialogue and interaction previews.

Generated source sheets have uneven gutters. Each sheet therefore declares its own row and column boundaries, with stepped regions where an extended hand crosses a nominal grid line. The original PNGs remain unchanged. Source ownership and actual browser atlas audits cover 23 sheets and 304 poses; an independent visual review found no clipped body parts or neighboring-pose debris. This integrity result does not establish small-scale readability or commercial parity.

The renderer calibrates source sheets to 128-pixel frames with feet at 120. Transparent margins remain transparent, texture filtering is nearest, and character-only color treatment makes the art fit the warm scenery. A wider camera keeps desktop actors around 71 screen pixels tall. A single nearby/selected caption and compact semantic service signs reduce map clutter. A small ivory chevron identifies the hero among similarly dressed NPCs.

Idle selection and HUD previews use only the base sheet. North/south supplements load when the selected hero enters the world or the gallery explicitly requests a vertical walk. This defers 6.44 MB for the initial four male options, or 12.22 MB when browsing all eight choices, until directional art is needed. Prepared base/full atlases have separate bounded cache keys.

Authored collision and foreground coverage currently includes the home well/gateposts and capital shop row, market stalls, well and gate. Other location paintings keep open movement until individually authored. These limits are explicit; a successful capital circuit does not prove navigation across every map.

## Decisions and first-session flow

Travel remains a world action: route destination effects and costs commit atomically. The visible journey guide uses actual quest state and offers a next step. New players can complete a local clinic errand through Lin, Wu and Lin for 80 gold,3 herbs and 20 WEXP. Small or short screens default to a 46-pixel chip; details remain expandable, preferences persist and placement avoids the hero at interactions. Shop and inventory share exact item-effect labels, exposing recovery, learning and prerequisite numbers before purchase.

Combat shows named actions and costs. Guard spends 2 MP and a turn for 35% next-action mitigation plus a one-use 20% bonus to the next physical strike. A miss spends the charge; repeated Guard refreshes rather than stacks. Recover restores 20% of maximum MP (minimum 2) but spends a turn and reduces evasion by 15 for the next action. The stance is useful against a healthy starter opponent and inferior to attacking a finishable foe in the sampled balance runs. That is a bounded finding, not a complete roster-balance claim.

Nonfatal defeat leaves at least 1 HP and a rest prompt; fatal defeat still ends the run. Player names are escaped before entering formatted battle logs.

After the clinic errand, optional guidance links supplies to a free beginner duel at the capital school, then to an upgrade paid for with earned experience. The named apprentice has fixed starter stats, never enters random-encounter pools, offers a nonfatal return, and cannot be farmed after one win. Normal battle rewards and banked skill experience determine the upgrade cost. No tutorial save flags or new save version are needed. Rest remains usable while wounded even when stamina is full.

On short landscape screens, world status becomes a shallow strip so it leaves conversation silhouettes visible. Guide placement protects the hero, nearby NPCs and the active caption. Lin's young ivory/jade world actor matches his authored portrait; conversations use a lateral approach and actors face each other.

Completion receipts observe real active-to-done quest transitions, cap displayed deltas to authored rewards, and repeat an existing thank-you from the giver. They wait through dialogs and combat, dismiss without blocking world controls, and never replay from a loaded save. Skill upgrades show the actual returned level/cost and derived before/after stats next to a victory pose. Both are transient presentation, with no changes to reward rules or persistence. Owned supplies precede equipment in the bag.

Local NPC dialogue keeps the same keyed world canvas, camera, actors and lighting mounted. World input pauses while ambient animation continues; a compact focus-contained panel presents the existing authored lines and choices. Its close control only mirrors an available effect-free departure or an existing terminal close, so mandatory narrative decisions cannot be skipped. Unassociated narration and travel events retain their illustrated fallback. All five spy greetings include unconditional authored returns without travel cost or encounter rerolls; job previews remain separate from acceptance.

The completed clinic delivery reveals a supply crate and waiting elder beside Lin. `lib/stage/world-vignettes.ts` reads the original quest status; generic prop/bystander rendering adds no save flags or rewards. Their visibility changes without rebuilding the scene. This is one authored consequence, not a town-wide NPC schedule simulation.

The capital investigation places clerk Qing and a sealed document chest near Wu. Explicit interview and retrieval flags advance the existing ledger stages; possession of an old key alone no longer counts as retrieving evidence. Qing lends at most one key and can use his spare if another quest consumes that loan. Existing keys remain usable, and a guarded return awards the original 150 gold, 30 WEXP and eight relationship points once. Mid-conversation reloads, previous stage IDs and older inventories remain supported. Lin's herb advice and Wu's job overview have authored responses and safe returns. Unrelated random meetings cannot inherit the preceding local speaker.

The open chest reads the existing recovered-ledger flag and swaps visibility between two preloaded props, keeping the same canvas and actor positions during conversation. Source-alpha bounds calibrate its base width and floor line. Local dialogue portraits use larger frames; fallback sprites show a face-and-shoulder crop without modifying the shared atlas. Overflowing conversation panels expose a visible scrolling cue.

The existing authored lore pool is initialized idempotently for new games and hydrated saves. Static lore uses finite persisted deadlines and survives the generated-news archive policy. Region, channel, prerequisite and heard-history selection still applies; integration does not fabricate world events. Duplicate route labels include destination names, and palace rest services use palace-specific wording.

Generated rumor names resolve real art/item/sect IDs before formatting. Where legacy event context omits a detail or allows several possible sects, the prose leaves the detail unnamed instead of guessing. Previously saved rumor text is not rewritten.

## Review and evidence

`/progress` is a live journal refreshed every 5 seconds with piece statuses, unresolved criticism, validation and the actual character-animation gallery.

Builders and independent reviewers inspect the running game through Chromium, take actual screenshots and record interactions. Reports distinguish edited fixtures from normal play and label comparison limits. Mandatory shared context and recognizable UI mean the comparisons are not scientifically blind. No reviewer is instructed to manufacture a favorable result.

Deterministic suites cover 10 runtime regressions, 12 combat-action checks, 11 navigation tests, and clinic/preparation/training progression including safe loss and earned upgrades. Browser coverage includes all 8 characters, cardinal walking, save migration, travel, battle completion, touch/resizing, modal pause, reduced motion and WebGL recovery. Current full-build/integration results are recorded in the live journal; individual earlier reports describe their captured revision.

Evidence is under `review/`; repeatable browser tests are under `tests/browser/`. Only Chromium has been exercised, with emulated viewports rather than physical phones. The campaign's hundreds of authored scenes and quests have not all been played. Existing content/quest audits are separate from renderer and opening-loop checks.

## Artwork provenance

The original maps stay location-specific. Active generated assets include the courtyard, two capital battle settings, eight-creature atlas, fifteen character sheets, eight direction supplements, clinic supplies, and closed/open archive chest states. They were created with the built-in imagegen tool; source PNGs are preserved. Full prompts and subjects are documented in [environment provenance](public/art/README.md), [capital battle settings](public/art/battle-capital.md), [character provenance](public/art/characters/README.md), [named townspeople](public/art/characters/townspeople.md), [Qing](public/art/characters/qing.md), [clinic prop provenance](public/art/props/README.md), [archive chest](public/art/props/archive-chest.md) and [open chest](public/art/props/archive-chest-open.md). Experimental candidate artwork is separate until reviewed. Commercial reference screenshots are review evidence only and are not shipped as game artwork.
