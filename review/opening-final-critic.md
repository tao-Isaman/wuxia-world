# Fresh opening actual-play review

**Verdict: the targeted opening works, makes sense, and provides a modest but real payoff.** I completed a normal new game through the first errand, useful purchase, beginner practice, earned skill upgrade, healing and reload. No blocker appeared. I would keep playing after this opening. It is not yet at the reference games' level of character presence or reward presentation, and passing this short loop is not evidence of whole-game depth or balance.

**Largest remaining gap: the final earned improvement is presented like a quiet form update.** Winning the practice has readable poses and an obvious result. Spending the resulting W-EXP changes `Lv.1` to `Lv.2`, BP 13 to 14 and mastery 10 to 11 amid technical labels and empty slots. There is no comparably clear moment saying what the hero has just learned or why it matters. The earlier shop also feels like a utility catalogue rather than an encounter with a merchant. Against Dokapon's large, characterful decision/result presentation and Hero's Adventure's scene-bound conversations, this is the point where the opening loses energy. A compact contextual upgrade acknowledgment with the actual improvement would do more here than more tutorial text or more systems. This is a presentation priority, not a demand for a cinematic or an artificial 'wow'.

## Method and independence

- Reviewed production at `http://127.0.0.1:3017` only after the root's NEW BUILD READY message, September 28, 2026.
- One Chromium browser and one fresh context, no video. Rendered screenshots inspected directly. Desktop 1440×900, portrait 390×844 and landscape 844×390.
- All gameplay used ordinary buttons, taps and the game's destination navigation. No localStorage inspection, edited save, altered stats, forced battle outcome, RNG override or diagnostic fixture. No source edits or implementation reading.
- Mandatory coordination files were read. Browser tests/configuration were consulted only to identify launch/control infrastructure. No prior review reports were read.
- Independence limitation: before build readiness, a builder sent an unsolicited suggested path and exact anticipated results. I notified root and disregarded that message as evidence. The on-screen guide independently supplied the path and guard→punch lesson; all outcomes below were directly observed. This is therefore an independent actual-play assessment, but not a perfectly blinded one.
- Compared actual screenshots against the supplied official Steam reference images, not builder summaries: Hero's Adventure `ref-1948980-{0,1,2,4}.jpg`; Dokapon Kingdom `ref-2338140-{0,1,3,4}.jpg`, with their manifests under `review/baseline`.

## What I actually played

| Step | Observed result | Evidence |
| --- | --- | --- |
| New hero สายลม, default male/blue appearance | 36 HP, 10 MP, 100 stamina, no money/W-EXP. Guide names the doctor, city, purpose and total travel cost. | [Opening](opening-final-evidence/02-opening-desktop.png) |
| Home → road → capital | Stamina 100→90→80; guide updates to the next destination. Destination buttons move the character through the scene before the interaction. | [Road](opening-final-evidence/03-first-road.png) |
| Doctor's clinic errand | Accepted the supplies errand, met the magistrate, selected its named dialogue option, returned to the doctor and explicitly claimed the reward. Dialogue gives a plausible need and response. | [Acceptance dialogue](opening-final-evidence/06-quest-accepted.png), [hand-in](opening-final-evidence/08-quest-hand-in.png) |
| First reward | Money 80, W-EXP 20, rare herbs ×3. The next guide explains a 50-money healing potion and its 30 HP maximum recovery. | [Reward and next guidance](opening-final-evidence/09-first-reward.png) |
| Meaningful preparation | Bought one small healing potion in the portrait shop. Money became 30; inventory showed the potion ×1 and herbs ×3. Held the potion while healthy. | [Portrait shop](opening-final-evidence/11-market-portrait.png), [inventory](opening-final-evidence/12-purchased-potion-portrait.png) |
| Optional beginner practice | The hall and guide explicitly explain no fee, nonfatal loss, resource/time cost, reward and guard→punch lesson. Entered voluntarily at full HP. | [Training offer](opening-final-evidence/15-training-hall.png) |
| Actual fight | Guard consumed 2 MP. Opponent punch did 20 damage, leaving 16/36 HP. The next punch displayed the +20% counterattack, dealt 38, and won in 3 turns. No defeat or retry occurred. | [Desktop battle](opening-final-evidence/16-duel-desktop-start.png), [portrait decision](opening-final-evidence/18-duel-portrait-choice.png), [victory](opening-final-evidence/19-duel-first-outcome.png) |
| Earned progression | Returned to capital with 70 W-EXP, stamina 75 and 16 HP. Equipped punch showed 20/50 skill XP; paid the displayed remaining 30 W-EXP. Punch became Lv.2, W-EXP 40, BP 14, mastery 11. | [Landscape skills](opening-final-evidence/23-skills-landscape.png), [earned upgrade](opening-final-evidence/25-skills-portrait-earned-upgrade.png) |
| Purchase proves useful | Used the previously bought potion from inventory. HP 16→36, explicit actual recovery HP +20, potion removed, herbs retained. | [Healing](opening-final-evidence/26-potion-used-portrait.png) |
| Reload | Name/location, HP 36, MP 8, stamina 75, money 30 and W-EXP 40 persisted. Reopened menus: equipped punch Lv.2, completed clinic quest, herbs ×3 and no potion persisted. | [Reload](opening-final-evidence/27-reload-portrait.png), [skill persisted](opening-final-evidence/28-reload-skill-persisted.png), [quest persisted](opening-final-evidence/30-completed-quest-persisted.png) |

## How it feels against the references

The opening is coherent because each step supplies a reason and an actionable next move. The doctor is helping patients; the magistrate authorizes supplies; the reward pays for preparation; practice turns the taught defensive choice into visible counterattack damage; the reward then upgrades the equipped skill. I never had to guess which unrelated quest to take or grind to bridge an unexplained resource gap. Buying the potion mattered after the fight. These are actual strengths, not merely completed checklist items.

The scenery establishes a convincing wuxia mood and gives the world generous screen space. The doctor portrait and authored exchange add identity. However, Hero's Adventure's inspected village and conversation scenes have richer actor presence and stronger feeling of people occupying a place. Here the guidance panel and destination list do much of the narrative work. The city is attractive, but this short errand primarily feels guided rather than discovered.

The practice fight is the most satisfying part of this run. Portrait retains both actors, health and large actions; the counterattack is explicitly marked; victory and defeat poses read immediately. Dokapon's comparison still exposes weaker emphasis on the surrounding reward and improvement moments. The duel needed only two player selections, so it demonstrates a lesson successfully without establishing sustained tactical depth. I would not use this one ordinary win to claim all random outcomes are fair or all opponents are balanced.

## Responsive findings and limits

- Portrait shop, inventory, skills and battle were readable and usable by tapping. No blocking clipping was observed in these flows.
- Landscape skill upgrade remained reachable. The landscape bag requires scrolling through ten empty equipment slots before reaching consumables. This is unnecessary friction for a quick recovery action; give owned usable items earlier prominence. [Landscape bag](opening-final-evidence/13-bag-landscape.png).
- Landscape battle result, stats interaction and expandable battle log were exercised. Active combat actions were played on desktop/portrait, not landscape; I do not claim a complete landscape combat-input test. Stats/log captures include a transient fading overlay and should not be used as clean visual-composition evidence.
- The guide disappears after the first upgrade, appropriately ending its specific lesson. Longer-term self-directed goals were not tested.
- No page errors were collected. Audio, long-term performance, loss recovery, repeated practice, other skill builds and later-game quests are outside this run's evidence.

Evidence lives in `review/opening-final-evidence/`. The action journal records the actual UI commands. Images 04 and 05 caught movement/transition before their intended destination/dialogue; the conclusions above rely on the later settled captures instead. Browser was fully closed and its driver process exited successfully at the end. No product source files were changed.
