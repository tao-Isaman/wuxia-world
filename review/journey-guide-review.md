# First-session guidance: implementation evidence

The optional Thai guide now gives a new player a reason to leave home, names the exact destination control, introduces the existing physician quest, and follows an accepted quest's authored current stage. It disappears when no active quest remains after the player has tried a quest. Free exploration remains available throughout.

## Source changes

- `components/world/journey-guide.tsx`: reads existing scene, NPC, quest and stamina state. The only saved preference is `wusia-journey-guide-collapsed`; no game-save fields, quest flags, rewards or navigation mutations are added.
- `app/journey-guide.css`: compact HUD treatment; portrait guide sits above movement controls; landscape guide sits below the player HUD. The guide temporarily hides while the destination chooser is open.
- `components/world/location-view.tsx`: guide placement in map and fallback layouts, plus a landscape-safe extras button class.
- `components/world/route-map-view.tsx`: guide import and placement only, relative to the implementation present when this task began.

## Actual browser verification

Run `node review/check-journey-guide.cjs` against the running `http://127.0.0.1:3017` development server. It creates an isolated browser profile.

- Created a real new player; opened the existing destination chooser and travelled home → road → capital. Stamina changed **100 → 90 → 80**, matching the guide's total 20 and remaining 10.
- Opened หมอหลิน through the destination chooser and accepted **บัวหิมะเพื่อผู้ป่วย** through the normal NPC popup and dialogue choices. The guide changed to the actual stage: **หาบัวหิมะ — งอกได้เพียงที่ก้นหุบเขาตัดใจเท่านั้น**.
- Random arrival events were dismissed through their normal UI; quest acceptance was not injected into the game save.
- Asserted no overlap with `.player-hud`, `.location-hud`, `.world-controls`, `.game-menu` or the extras button, and no document horizontal overflow, at **1440×900, 390×844, and 844×390**. Home, road, capital, active quest and collapsed guide were covered. The landscape road name exposed an initial overlap, which was fixed before the passing run.
- Collapsed/expanded the guide and confirmed the world-save string remained byte-for-byte unchanged; collapse preference persisted across reload.
- Confirmed the guide hides when the destination chooser opens and returns afterward.
- Reloaded the accepted quest and confirmed the stage remained correct.
- Separate persisted-state fixtures verified stage two text, hidden completed onboarding, and the low stamina rest instruction. These fixture checks do **not** claim real completion of the snow lotus quest.
- Final browser run exited **0**, with **no page errors**. Screenshots were visually inspected for portrait home, landscape home/road/capital, and portrait active quest.

Evidence: `review/journey-guide/observations.json`, all screenshots in the same directory, and `accepted-quest-state.json` for a reviewer to resume after the real acceptance flow.

Targeted ESLint passes for all three touched components. TypeScript passed after the first implementation; the final run encountered concurrent battle-arena edits only (missing cast-progress and tooltip/action props), which were reported to the parent agent for integration validation.

This document is implementation verification, not the requested independent critic review.
