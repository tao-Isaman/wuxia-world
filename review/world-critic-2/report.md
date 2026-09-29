# Independent live world review

Verdict: attractive detailed scenery, working exploration, but the capital does not yet meet the coherent inhabited-world quality of the supplied Hero's Adventure references. This is not a visual-quality pass.

## Scope and independence

Reviewed the actual game at http://127.0.0.1:3017 in one Chromium context/page. Read the mandatory shared context and browser navigation test, but no application implementation, DESIGN.md, progress.json, builder reports or earlier verdicts. The required shared context contains historical implementation statements; these were not used as evidence for this verdict. No application code changed.

Completed real new-game home → road → capital travel before any fixture changes. Arrival state was capital, day 1, time 3, stamina 80. Only day and time were then changed to day 9/time 0. No position, money, quest, inventory or character attributes were seeded.

Compared live captures directly with supplied official reference files `../baseline/ref-1948980-0.jpg`, `ref-1948980-1.jpg`, `ref-1948980-2.jpg`, and `ref-1948980-4.jpg`. This was a labeled comparison, not a blinded A/B. The game's Thai HUD and distinct actor art make origin obvious; no claim of blind preference or "wow" validation is made.

The coordinator stopped this bounded pass to release a severely contended shared machine. Therefore 844×390, night/time 9, purchase completion, and complete touch-only route traversal remain unverified. Combat was excluded as requested.

## Single biggest remaining gap: people and scenery do not share a convincing scale and ground plane

The capital's buildings, stalls and well are rendered as a small town vista, while the tall actor sprites read closer to a near-camera character view. In `05-capital-arrival.png`, `11-click-to-well.jpg`, `16-well-northeast.png`, and `22-well-solid-back.png`, people are disproportionately tall beside shop doors and stalls. The white-robed northern NPC visibly overlaps the gate roof with its feet rather than reading as standing on the courtyard paving. The hero can also reach the leafy boundary beside that courtyard (`16-well-northeast.png`), where the ground contact is less convincing than the open square.

The official village reference (`ref-1948980-0.jpg`) gives buildings, fences, props and people a consistent shared scale and clear contact with the ground. Its simpler surfaces read more immediately as a place. The live game's fine foliage and architecture detail are appealing, but detail alone does not close this integration gap.

Acceptance criterion: at the capital's north gate, central well, both market stall clusters and all six storefronts, use one explicit actor/environment scale. In a continuous uncut keyboard-and-click circuit, each standing actor must fit below the lintel of a normal human doorway at the same depth; feet must remain on a visibly walkable surface, with no roof/foliage standing illusion. Passing behind a well, stall or shop must hide only the anatomically correct lower/body region, and returning in front must restore it without a pop. Capture the same circuit at desktop, 390×844, and 844×390. A still attractive square is insufficient evidence of this pass.

## Confirmed passes

- Normal home → road → capital travel worked, with an actual walk to the destination markers. Stamina became 80. See `02-home.png`, `03-home-destinations.png`, `04-road.png`, `05-capital-arrival.png`, and `arrival-state.json`.
- Keyboard movement and click routing both worked around the storefront row and into the central square. At x172.5, north input stopped at y491.7 instead of crossing the storefront. Clicking visible square ground from the south storefront path reached x433.3/y333.3. See `08`–`11` captures and the movement log.
- The well resisted direct approach. South-side north input at x476.7 moved y336.7 → y332.9, then stopped. A second approach near its northeast side at x497.9 stopped southward travel at y310.4. These are measured collision checks, not proof of every contour. See `17`–`22` and `movement-observations.json`.
- The loop included the central well, left and right market areas, the northern path, and the storefront frontage. Four movement directions produced visibly different hero poses/back views. The screenshots are sequential gameplay captures; their provisional filenames do not imply an exact landmark position.
- Physician and market destinations both navigated to the interaction and opened usable dialogs. The physician exposed the snow-lotus quest; the market displayed products and prices. See `23-physician.png`, `24-market.png`. No purchase was attempted with the normal starting 0-gold save.
- At 390×844, a real touchscreen tap moved the hero from x240/y253.2 to x232.8/y314.7. Destination panel and compact objective guidance remained accessible. See `25`–`28`.
- No browser `pageerror` events were recorded in the captured run. This does not erase the development-server stall described below.

## Confirmed fail: portrait HUD can cover the hero

At 390×844 immediately after normal Market access, the compact objective bar crosses the hero's upper body. Only part of the blue robe/feet remains visible beneath it (`25-portrait-morning.png`). The player needs to see their character at the interaction endpoint, not only after moving away.

Acceptance criterion: repeat home arrival, physician arrival, market arrival and the well loop at both mobile sizes with the objective collapsed and expanded. The whole actor silhouette plus a small margin around its feet must remain in unobscured world space whenever no modal is open. The objective must be readable and tap targets accessible without covering that space.

## Unresolved and limits

- The portrait destination list extends below its visible panel; the home route's DOM box was at y1110.2 in an 844px viewport. One CDP touch scroll gesture caused no visible scroll. This is an unresolved touch-scrolling observation, not a demonstrated app defect: it needs a real touch drag or validated gesture harness before judging destination access. Do not count the existence of a DOM route button as successful mobile navigation.
- Screens around the well show plausible front/side placement, but this pass does not prove exact occlusion transitions for every solid prop. Do not overclaim universal feet/depth correctness.
- Morning/time 0 was inspected. Night/time 9 and 844×390 were not reached before the coordinator ended capture.
- The first fixture reload stalled on the beige loading screen (`07-reload-stalled.png`). The coordinator reported a 67-second development response and restarted the development server. The page later recovered with day 9/time 0 and no page errors. Treat this as development availability noise, not proven production loading behavior.
- This is exploration/world review. Strategic depth and sustained enjoyment cannot be certified from this bounded sample; combat was deliberately outside scope.

## Evidence

All screenshots are actual browser captures in this directory. `movement-observations.json` contains measured keyboard and portrait touch positions. `arrival-state.json` records the normally reached capital before fixtures. Video recording failed to finalize: the encoder stalled during context close and left a zero-byte file. There is no usable video evidence. The browser was closed successfully and its verified stalled encoder was stopped to release the shared machine. Still captures and coordinate observations are the evidence for this report.
