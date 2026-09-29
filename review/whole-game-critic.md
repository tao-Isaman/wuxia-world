# Fresh whole-game integration review — completed bounded opening review

Reviewed normal play at `http://127.0.0.1:3017` on 2026-09-28. One fresh Chromium context, hero **เมฆา**, default male blue swordsman. No save edits, boosted stats, forced encounters, production-code edits, or prior review/implementation reading used to drive the playthrough. Required coordination documents were read; browser test file was used as navigation-label help. Desktop 1440×900, portrait 390×844, landscape 844×390. Evidence is actual rendered screenshots in `review/whole-game-critic/`.

## Current verdict after the revised opening

**The revised opening now completes a coherent, reachable first reward loop through ordinary play.** A genuinely fresh second hero, **เมฆาใหม่**, followed the clinic recommendation, delivered Lin's request to Magistrate Wu, returned, claimed **80 gold / 20 W-EXP / 3 rare herbs**, bought supplies, and retained the completed quest and purchases after reload. Neither ordinary-play hero had edited saves or boosted stats. One browser/page was active at a time; browser and driver were fully closed at the end.

This is a substantial improvement over the first pass below. The clinic task names the next NPC, tells the player to greet and select the request, then explicitly points back to Lin's turn-in action. It is suitable for zero money and starter stats. The advanced lotus option now visibly states the valley location and herbalism level 5 prerequisite. The misleading original recommendation is no longer the opening path.

**The biggest remaining game-design gap is the handoff from preparation to a suitable next challenge.** The reviewed session can now earn and compare supplies, but the local errand is a prescribed delivery sequence with no competing choice, and after preparation the player again has an unranked set of city activities and exits. I did not find, or claim to have exhaustively searched for, a clearly signposted next beginner challenge. An actual first-road random encounter was a mid-tier desert warrior; I used its explicitly safe escape. This demonstrates a safe choice, but it is not a graduated combat introduction. A next quality criterion would be one visible, optional low-risk challenge that lets the player use the new supplies or training, understand the stakes, and return with a reason to continue. The separate battle fixture below shows the combat system can support a tactical choice; it does not prove that the world naturally teaches that choice.

**The biggest remaining visual-coherence issue I directly observed is character identity across presentations.** Physician Lin is a blue-and-gold elderly man in the world, a young black-haired portrait in the popup, and a green-robed young herbalist in dialogue. The art is individually detailed, but the same person does not consistently look like the same person. The latest world sprites sit more convincingly relative to doors, and the jade/parchment menus fit the world much better than the initial white/red screens. Portrait identity matching is a more meaningful next art improvement than adding more decorative detail.

## Revised ordinary-play evidence

1. **Fresh start and travel:** new empty context, hero เมฆาใหม่, HP36/36, MP10/10, stamina100, gold0, W-EXP0. Followed home exit toward capital. A random mid-tier desert-warrior encounter appeared; selected the visible safe escape and arrived in capital at stamina80. No fight was forced into this main save.
2. **Accept and progress:** Destinations → Lin → clinic supplies. Dialogue states both parties are in the capital. Destinations → Wu → Greet → deliver Lin's request. Wu confirms delivery; helper explicitly directs return and turn-in. Evidence `41-revised-opening.png`, `43-revised-lin-offer.png`, `44-clinic-acceptance.png`, `45-magistrate-clinic-dialogue.png`, `46-magistrate-confirmation.png`, `47-return-helper.png`.
3. **Claim reward:** Lin popup → completed clinic task → claim reward. HUD changes to80gold/20WEXP; inventory has3rareherbs. Evidence `49-lin-turnin-popup.png`, `50-clinic-reward-dialogue.png`, `51-clinic-completed.png`, `52-reward-inventory.png`. I initially chose Lin's generic greeting on return, which did not discuss the task; the helper and separate turn-in button nevertheless made recovery clear.
4. **Spend reward:** normal market purchase of small potion50 and mooncake30; inventory shows HP+30 and HP+20, each quantity1, with3rareherbs still present. This spends the actual earned gold; it is not a test grant. Evidence `53-market.png` through `56-inventory-effects.png`.
5. **Persistence:** normal reload; completed tab shows clinic quest1, inventory retains potion1/mooncake1/herbs3, W-EXP20, gold0, capital/day1/stamina80. Evidence `57-completion-after-reload.png`, `58-items-after-reload.png`. Exact main-session storage is preserved in `revised-real-play-state.json`; it was later restored without editing for the latest shop capture.
6. **Phone usability:** inventory effects and Use buttons visible at390×844. Touch tap moved the player from x480/y499.2 to x542.9/y496.7. At844×390, quest completion content/Close fit; another normal touch moved the player to x660.9/y515.3. No horizontal overflow. Evidence `59-phone-inventory.png`–`64-landscape-moved.png`. These coordinates are visible runtime DOM attributes used only to corroborate the rendered movement, not state modifications.

The original shop showed flavor descriptions without effect quantities before purchase. This was reported, then independently rechecked on the restored real-play save after revision: the buy rows now show HP+30/+80/+200, food effects, XP effects for books, and owned counts. Screenshot `81-shop-effects-latest.png` confirms this issue is addressed. The current prepared main hero correctly has no preparation hint (`80-real-prepared-world-latest.png`).

## Clearly separated supplemental fixtures

**Combat orientation/outcome fixture:** a separate fresh context and fresh hero **ศึกทดลอง** was created through the title UI. Its clean start is saved in `fixture-clean-start-state.json`. Only `pendingBattle` was set to a nonfatal petty-thief encounter returning home; no stats, skill levels, resources, items, or enemy health were changed. This is interface/short-fight evidence, not an organic quest encounter.

- Battle holds at the player's turn while choosing. Both fighters start36HP/10MP. Enemy info exposes Hit82%/Crit4% and combat stats.
- Chose **Guard**, spending2MP. The enemy punch dealt20; player remained16HP. The visible status and punch card showed the next physical counter bonus+20%.
- Chose **Straight Punch**, dealing38 and winning in3actor turns. Continue returned to home with16HP/8MP, stamina95, W-EXP50. No boosted character was needed.
- Portrait390×844 keeps large fighters, HP/MP, the turn prompt and all three action controls readable. Landscape844×390 places actions alongside the scene and exposes a clear result/Continue panel. Screens `70-fixture-battle-start.png`–`77-fixture-return-world.png` document this.
- The tested build had a real landscape defect: opening the log after victory covered and intercepted Continue. A normal Playwright click failed because the combat-log subtree intercepted the pointer. Collapsing the log allowed Continue. The log's dark blue/red text was also low contrast (`76-fixture-result-log.png`). The coordinator subsequently supplied an illustration-bounded parchment-log fix and a regression test. **That final fix was not independently re-rendered by this reviewer because the fixture context was already closed; production regression verification remains with the coordinator.**

**Preparation-hint fixture:** the main ordinary-play run had already spent its reward before the final hint was added. To inspect that conditional UI, a separate context cloned the completed real-play snapshot and explicitly set only gold80, inventory `{herb:3}`, and W-EXP20. This controlled state is not counted as another genuine reward loop. It showed the correct market route, potion50gold/HP30, current80gold, and skill-upgrade50WEXP versus available20. Buying one potion through the normal shop reduced gold to30 and dismissed the hint (`82-controlled-preparation-hint.png`, `83-controlled-preparation-cleared.png`). This supports the conditional UI behavior; the earlier real fresh play supports the earned reward.

No production code was changed by this reviewer. No production timing, all-scene coverage, advanced progression balance, or commercial parity is claimed. Development-server contention and restarts are excluded from performance conclusions. A latest-build night scene was not independently revisited.

## Initial pass record — superseded opening finding

**The recommended first objective stops being actionable immediately after acceptance.** Home and capital give clear directions to Physician Lin, but Lin's snow-lotus quest gives conflicting geography and then no next-hop route. NPC dialogue says it grows only on high mountains. The journal/helper say only at the bottom of Heartbreak Valley (ก้นหุบเขาตัดใจ). The capital has eight exit labels, none naming that valley. A new character has zero money, an empty inventory, and one starter punch. Nothing in this handoff explains whether the task is suitable for that character.

Reproduction through visible UI:
1. Create a new hero; follow recommended Destinations → home exit → capital. Stamina falls 100→90→80 as advertised.
2. Destinations → Physician Lin → snow-lotus offer → accept → acknowledge.
3. Open Quests and expand snow lotus. See bottom-of-valley instruction and 0/1 item count, without travel directions or an access requirement.
4. Close journal. Helper only repeats the item objective and says to see Quests.
5. Try the doctor's mountain clue: capital → ทางขึ้นเขา → ซงซาน. The six exits here are ทางลงเขา, ทางเหนือผ่านเขา, ทางใต้ผ่านเขา, เนินยอดเขา, ทางตะวันออก, เนินเชิงเขา. None resolves where the valley is. Stop rather than wander indefinitely; return normally to capital.

Evidence: `09-quest-offer.png`, `10-accepted.png`, `12-quest-objective.png`, `13-after-acceptance-guidance.png`, `23-mountain-route.png`, `25-songshan-exits.png`.

Fix criterion: a starter with untouched stats and money can follow one consistent objective, see the next useful person/exit at each step, make a meaningful decision, and obtain a visible first reward without external knowledge. If snow lotus is advanced, keep it as an optional advanced quest and recommend a genuinely local starter task instead.

After this finding was reported, the coordinator independently reported a source-level herbalism-5 gate and began a replacement local errand. The gate was **not reached through travel in this playthrough**, and is not the basis of the original navigation finding. The revised popup now states this prerequisite visibly. The ordinary-play retest above verifies the replacement opening.

## Initial pass actions

- Created hero normally; followed home → road → capital; greeted Lin and asked about herbs; accepted snow-lotus quest; inspected objective/reward.
- Opened profile, inventory, skills, rest and quest screens. Profile showed starter stats plus punch bonuses; inventory had no items/equipment and 0 gold; only Straight Punch was learned/equipped.
- Free roadside rest restored stamina 80→100 and advanced day 1 morning→day 2 morning. Paid inn rest cost 300 and was disabled. This provides recovery; no stamina softlock was observed.
- Inspected nearby alternatives: both merchant Wang popups offered greeting only; magistrate offered missing ledger/corrupt clerk/amnesty quests; noodle-shop Feng offered a bandit-chief task and a local framing/theft task. No obvious beginner difficulty/route preview was presented.
- Feng's local theft task refers to เถ้าแก่หวาง, but that merchant's popup offered no steal action when checked. This is a suspicious affordance mismatch; that alternative quest was not accepted or exhaustively tested.
- Travelled capital→Songshan, inspected exits, then returned to capital. This was a bounded navigation attempt, not successful lotus gathering or quest completion.
- Resized the same hero to phone portrait and landscape, opened/expanded the quest journal, then reloaded. Hero name, active quest, Songshan location, day 2 afternoon and stamina 80 persisted. No horizontal page overflow in either viewport. Returned to desktop and capital normally; state at pause: day 2 night, stamina 60, HP36/36, MP10/10, gold0.
- No app page errors observed during this pass. Development server and host contention caused delays/restart; these are excluded from production performance judgment.

## Initial pass visual/usability observations — preserve historical status

The title, courtyard and capital make a convincing visual entrance. The sprites are detailed enough to read as people with clothing and poses, rather than abstract tokens. The jade/gold framing and scenery belong together. Destinations are an effective accessible fallback, and the opening explanation of travel cost is concrete.

At that stage the opening was still a set of attractive places and exposed systems rather than a cohesive rewarding first session. The successful revised local loop and latest shop effects now address the central first-session failure; the broader progression handoff remains the design limit described above.

Additional observed friction:
- Detailed NPC portraits help dialogue, but the physician's world sprite is a blue elder while his dialogue portrait is a green young herbalist. Several Songshan fighters also use the same blue swordsman as the player. The player's identity becomes hard to pick out in a crowded phone frame (`26-phone-world.png`, `29-landscape-world.png`). Give the player a stable distinct marker/shadow and use NPC-specific visual matching where feasible.
- Initial plain white/red modal screens abruptly changed the visual language (`12-quest-objective.png`, `27-phone-quest.png`, `28-landscape-quest.png`). **Revised jade/parchment menus were independently observed and address this.**
- Initial NPC popups exposed English tags and raw relationship IDs. **Revised Lin popup uses Thai roles and human-readable relationship names; independently confirmed in `43-revised-lin-offer.png`.**
- Phone HUD/navigation consume a substantial part of the frame, although the center stays usable. Landscape quest content and Close fit. This is usable layout evidence, not a complete touch/combat accessibility pass.
- Clicking the snow-lotus offer immediately raises quest count and displays an accepted toast while the dialogue still offers Accept/Decline (`10-accepted.png`). Consent/state wording should have a single clear moment. Decline consequences were not tested.

## Final review boundary

Bounded opening, reward use, reload, phone movement/menu checks, a separate clean-stat battle, and supplemental preparation UI verification are complete. All reviewer browser contexts and the browser were closed. Final battle-log regression verification belongs to the coordinator's production run. This report does not claim a playthrough of all 964 scenes or parity with Hero's Adventure/Dokapon.
