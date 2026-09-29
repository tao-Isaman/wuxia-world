# Wave 7 ordinary-play review

**Verdict: the guided opening works and its rewards are understandable. The game is still below the reference games in character staging and a convincing inhabited world. No material functional blocker occurred in the tested opening.**

**Single biggest remaining gap:** NPCs function as stationary service points in an attractive illustration, rather than people participating in a scene. The capital sprites have recognizably different clothing, builds and portraits, but greeting Feng removes the other visible actors and presents a large portrait over an empty city backdrop. The doctor’s delivery changes dialogue, relationship and resources, without a visible delivery or changed activity in the square. Better rewards cannot supply that missing world response.

## What I actually played

Fresh ordinary character **หลินเดินทาง**, default appearance and base statistics. Home → road → capital → doctor’s medicine errand → magistrate → doctor’s reward → recommended small potion purchase → free practice → first Straight Punch upgrade. I followed the displayed directions, used floor movement and destination controls, and never edited saves, statistics or randomness. Afterward I greeted Feng, declined his offered task on its second page, and reloaded successfully. One Chromium browser, no video, desktop 1440×900 and touch-capable viewports 390×844 / 844×390. Browser is closed. No browser console errors were recorded.

This was a fresh review, **not strictly blinded**. Required coordination context and the assignment framing were supplied. I did not open product implementation or earlier review reports. An agent-status listing incidentally exposed two builder completion blurbs while waiting; they were not used as expected gameplay outcomes.

## Observations

- **Guidance:** The opening clearly identifies whom to visit, what to select, travel energy cost, potion price and the training route. The upgrade guide accounts for experience earned from using the move. I did not need source knowledge to advance.
- **Earned reward:** The medicine claim produces a persistent doctor portrait and acknowledgment with +80 gold, +3 herbs, +20 W-EXP and relationship +2. It remains readable on phone. The card is a meaningful completion beat, although the world itself appears unchanged. [Desktop](wave7-whole-evidence/15-earned-reward.png), [phone](wave7-whole-evidence/16-reward-phone.png).
- **Training and upgrade:** Guarding once, then countering once, won the practice fight without HP loss. Counter damage, enemy recoil and victory were visible. This teaches controls but offers little pressure or decision making. The upgrade subsequently shows level 1→2, BP 13→14, mastery 10→11.1, and 30 W-EXP spent / 40 remaining. Clear accounting; modest excitement and no new move. [Strike](wave7-whole-evidence/27-counter-strike.png), [upgrade](wave7-whole-evidence/33-earned-upgrade.png).
- **Mobile:** Purchase, destination selection, training entry and acknowledgment worked. Portrait upgrade feedback fits. Landscape requires scrolling inside the skill panel to reach its payoff; the quest receipt also prioritizes portrait/relationship over the loot figures in the initial short view. No stuck controls encountered. [Portrait](wave7-whole-evidence/34-upgrade-phone.png), [landscape](wave7-whole-evidence/35-upgrade-landscape.png).
- **Small conversation defect:** Feng’s greeting shows only “accept work” choices numbered 1 and 5; Escape has no effect. Selecting the first reveals a second page with “ขอเวลาคิด”, which exits without acceptance. Thus the initial presentation misleadingly hides the way out; it does **not** force quest acceptance or block progression. [Greeting](wave7-whole-evidence/38-noodle-talk.png), [decline page text](wave7-whole-evidence/40-noodle-accepted.txt).

## Reference comparison

Inspected all sixteen supplied official screenshots, then rendered and visually checked four side-by-side sheets. Sources are the adjacent baseline JSON manifests. These comparisons establish visible presentation, not the reference games’ full gameplay depth.

- [World](wave7-whole-evidence/comparison-world.png): current scenery is richly detailed, but Hero’s Adventure has clearer separation of objects and actors, varied village activity and stronger local staging. The current city’s repeated shop fronts and evenly spaced service characters feel more diagrammatic.
- [Dialogue](wave7-whole-evidence/comparison-dialogue.png): the reference preserves an assembled social scene around its speaker. Current Feng dialogue empties the playable scene and places a portrait beside a relatively small text box. This is the clearest evidence for the priority gap.
- [Dokapon battle](wave7-whole-evidence/comparison-battle.png): current combat communicates attack and damage, but enlarged sprites look softer than the sharp backdrop. Dokapon’s actor/environment integration and dominant turn information are more cohesive and readable at a glance.
- [Wuxia battle](wave7-whole-evidence/comparison-battle-wuxia.png): the current scenic duel is readable, but has less spatial context and environmental participation than the supplied tactical battle image. Different systems; matching its grid is not required.

Evidence, readable DOM snapshots, an ordinary untouched save export for targeted rechecking, and the comparison HTML are in `wave7-whole-evidence/`. This review covers the opening and three substantive NPC contacts, not the entire campaign, broader combat balance or real-device performance. Later fixes should be recorded separately from this original run.
