# Combat critic 2 — independent live review

Reviewed `http://127.0.0.1:3017` through `@playwright/test`, with one headless Chromium browser at a time. The first browser closed at its bounded deadline during the delayed fix retest; one brief fresh browser completed that retest and closed in `finally`. Both are fully closed. No video recording. Review date: 2026-09-28.

The clean starter `Critic Two` has STR/AGI/POW/VIT/DEX/LUK/DEF/INT all **1**. Only `pendingBattle = { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal: true }` was seeded. The main evidence was captured before any stat-disclosure fix. No battle implementation, DESIGN, earlier verdict, or builder progress report was used. The mandated shared-context file was read; it contains older project notes, so this cannot honestly be described as completely blind. Nor would hiding game titles make recognizable official reference art blind.

## Verified behavior

| Check | Actual result |
| --- | --- |
| 1440×900 | Both fighters, current actor prompt, both HP/MP readouts, Attack/Guard/Recover buttons and their costs fit simultaneously. No document scrolling. |
| 390×844 | Same information fits. Attack is full width, Guard/Recover share the next row. Both complete fighter silhouettes remain visible. |
| 844×390 | Same information fits, with actions in a right column. Both complete fighter silhouettes remain visible. |
| Orientation | CDP mobile emulation explicitly changed portrait → landscape → portrait, producing three `orientationchange` events. Each state retained one battle canvas and document bounds equal to the viewport. |
| Guard → strike → result | Reproduced three times with unmodified starter stats. Guard spends 2 MP; thief inflicts 20; next strike shows +20% and inflicts 38; victory appears on turn 3. |
| Result/continue | Victory, surviving HP/MP, both poses, and Continue fit in portrait and landscape. Continue returned to `home_player`, cleared `pendingBattle`, retained all stats at 1, and produced no captured page errors. |
| Battle log | Opens and closes. Completed log accurately shows Guard cost, enemy hit 20, hero hit 38, and victory. It overlays the action area while open; the resting combat layout is the simultaneous-visibility pass above. |
| Stat detail, original build | Desktop hover opens the detail and pauses battle. Touch taps do not leave it open. Two fresh-battle taps at 390×844 each had no detail after 400 ms; reproduced with explicit mobile device metrics. Reported for correction. |

## Contact, poses, and HP timing

The actual contact frames pass. Both attackers visibly extend a punch into the other fighter, whose torso recoils. Idle, ready/guard, extended attack, hurt, victory, and defeat are visibly different poses. The winner raises a fist and the loser kneels. This is more than sliding an unchanged standing image across the stage.

Full-page PNG capture was too slow to guarantee the exact contact instant. Therefore a second run captured the live canvas directly during the animation frame in which its impact count changed. These are browser-rendered images, not reconstruction or asset-sheet previews:

- [Enemy punch at contact](combat-critic-2/impact-canvas-1.png)
- [Hero punch at contact](combat-critic-2/impact-canvas-2.png)

Animation-frame observation in the first run places the enemy impact at 1832 ms and visible HP 36→16 at 1856 ms; the hero impact at 392 ms and enemy HP 36→0 at 419 ms. Those clocks are relative to each capture operation, not claimed input latency. The 24–27 ms gap is approximately one or two frames on this run. Damage does not visibly resolve before the hit. Raw samples are in [guard-timeline.json](combat-critic-2/guard-timeline.json) and [strike-timeline.json](combat-critic-2/strike-timeline.json).

## Reference comparison

Compared actual screenshots with the supplied official Steam screenshots: [Dokapon battle](baseline/ref-2338140-0.jpg), [Dokapon actor callout](baseline/ref-2338140-1.jpg), [Hero's Adventure village](baseline/ref-1948980-0.jpg), and [Hero's Adventure characters](baseline/ref-1948980-1.jpg). These still references establish visual composition and detail; they cannot establish animation or audio parity.

The current game clearly has detailed 2D martial-arts characters, legible clothing identities, a richly illustrated setting, and credible contact poses. It is in the requested direction. Hero's Adventure still has more consistent pixel definition between small faces, clothing, silhouettes, and scenery; the reviewed large fighters appear softer and more painterly. Dokapon gives HP, comparative numbers, and actor identity much stronger visual prominence. The reviewed game is calmer, with more visual attention spent on scenery and less on combat information.

This is a functional, attractive combat screen. I would not call commercial-reference parity or a manufactured “wow” pass from this bounded review.

## Evidence

- Layout: [desktop](combat-critic-2/desktop-choice.png), [portrait](combat-critic-2/portrait.png), [landscape](combat-critic-2/landscape.png).
- Results: [desktop](combat-critic-2/desktop-result.png), [portrait](combat-critic-2/portrait-result.png), [landscape](combat-critic-2/landscape-result.png).
- Original stats defect: [tap observations](combat-critic-2/stat-tap-repro.json), [touch screenshot](combat-critic-2/portrait-stat-tap-0.png), [working desktop hover](combat-critic-2/desktop-stat-hover.png).
- [Rotation observations](combat-critic-2/orientation.json), [completed log](combat-critic-2/portrait-final-log.png), [completion state](combat-critic-2/completion.json), [starter fixture](combat-critic-2/starter.json).

## Independent correction retest

**Passed. No remaining functional blocker found within this combat review.** After the touch-stat correction was signaled, a fresh all-stats-1 hero and the same pending encounter were created in a mobile Chromium context. One tap opens the detail and it remains visible after 450 ms with battle paused. Portrait→landscape keeps the same open panel readable and fully inside the viewport: portrait bounds `(27,118,288,226.5)`, landscape `(26,83,288,226.5)`. The labelled close button, outside tap, and Escape each close it and restore `data-paused=false`. Enemy stats also open by tap. Zero captured page errors.

- [Retested portrait stat panel](combat-critic-2/fixed-portrait-stats.png)
- [Retested landscape stat panel](combat-critic-2/fixed-landscape-stats.png)
- [Independent retest results and rendered font sizes](combat-critic-2/fixed-retest.json)

The earlier `fixed-stats.json` came from a viewport restored to desktop during a slow reload and is **not** mobile proof. The authoritative retest is `fixed-retest.json` and the two matching screenshots above, overwritten by the correctly sized fresh run.

## Single biggest remaining gap

**Decision-text hierarchy in phone landscape.** The three choices fit, but their action explanations and costs render at **10 px**, beneath 14 px action titles. This is materially less immediate than Dokapon's prominent combat information, despite the generous illustrated stage. It is a presentation limitation, not a blocked action or scrolling failure.

Acceptance: at 844×390, action explanations and costs render at least 12 px and action titles at least 16 px; a user can read the 2 MP Guard cost and its next-strike benefit without zooming. Preserve all existing passes: both complete fighters, current actor, HP/MP, and all three action buttons visible at once, with no document scrolling, and no regression at 390×844 or 1440×900. Verify from the actual rendered screen, not CSS values alone.
