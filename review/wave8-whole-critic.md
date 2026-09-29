# Wave 8 — independent running-game critique

Reviewed 2026-09-29, production at `http://127.0.0.1:3017`. **The opening is playable and occasionally convincing; this is still well short of the references as a coherent inhabited game.** The most important remaining gap appears immediately after the first upgrade: finding a sensible next activity becomes much less reliable than following the clinic tutorial.

This report records the build actually served during the playthrough. The coordinator subsequently reported source fixes for some conversation issues; those claims are not treated as verified fixes here.

## Method and limits

- One fresh Chromium profile, one browser, no video. New male character, first blue appearance, name เดินธาร. No edited save, stats, items, RNG, or programmatic game-state mutation. Actions used visible buttons, keyboard movement, and touch taps. DOM text was read to inspect rendered choices, not product source.
- Desktop **1440×900**, portrait **390×844**, landscape **844×390**. These are browser viewport simulations with touch enabled, not physical-device tests.
- Played home → road → capital, a naturally occurring thief encounter, Dr Lin conversation and goodbye, the complete clinic errand, potion use and purchase, training, and an earned first skill upgrade. Then tried rumors, the magistrate's work conversation, accepted the missing-ledger quest, consulted its journal, and traveled to the palace by inference. Stopped there; the ledger quest was not completed.
- Inspected official reference image files and their supplied Steam manifests. Did not play the commercial reference games. Their screenshots establish visual standards, not proof of comparative balance, animation quality, campaign depth, or performance.
- **Not scientifically blinded.** The games are recognizable, the brief names them, and the mandatory shared coordination file contains previous builder status. I did not read product source, earlier review reports, or optional agent-status material. Findings below come from this run and the reference images, not those status claims.
- Browser reported zero page errors and zero console errors in this bounded run. Selector mistakes in the driver are automation errors, not game defects. Browser was explicitly closed after evidence capture.

Raw evidence and corresponding UI text: [wave8-whole-evidence](wave8-whole-evidence/). Reproduction driver: [wave8-whole-driver.cjs](wave8-whole-driver.cjs). Comparison pages preserve the entire original image with proportional fitting and letterboxing, without retouching.

## What ordinary play actually proved

| Action | Observed result | Evidence |
|---|---|---|
| Leave home, enter capital | Two travel costs reduced energy from 100 to 80. A random thief encounter interrupted arrival. | [Home](wave8-whole-evidence/02-home-desktop.png), [road](wave8-whole-evidence/05-road.png), [encounter](wave8-whole-evidence/07-capital-desktop.png) |
| Guard, then straight punch against thief | MP 10→8; received 20 damage; following punch dealt 38 and won. HP 16/36, W-EXP 50 afterward. | [Decision](wave8-whole-evidence/10-battle-ready.png), [combat log](wave8-whole-evidence/13-battle-log.png) |
| Casual Dr Lin conversation | Both actors stayed visible in the city. The herbs question repeated the same screen; goodbye led to a random monk gift event under the doctor's header. Closing it returned to play. | [Greeting](wave8-whole-evidence/18-casual-greeting.png), [unchanged response](wave8-whole-evidence/20-casual-after-herbs.png), [goodbye event](wave8-whole-evidence/21-goodbye.png) |
| Clinic request → magistrate → doctor → claim reward | +80 gold, +20 W-EXP, +3 rare herbs, +2 Dr Lin relationship. A supplies crate and a waiting patient appeared beside the doctor. | [Reward](wave8-whole-evidence/32-clinic-payoff-desktop.png), [before](wave8-whole-evidence/15-capital-desktop.png), [after](wave8-whole-evidence/33-capital-after-clinic.png) |
| Use gifted potion; buy replacement | First potion restored HP 16→36 and disappeared. Purchase cost 50 gold, leaving 30. | [Before](wave8-whole-evidence/34-inventory-before-potion.txt), [used](wave8-whole-evidence/35-potion-used.txt), [bought](wave8-whole-evidence/37-potion-purchased.txt) |
| Free training, guard → punch | Won in three counted turns; HP 16/36, MP 6/10, energy 70, W-EXP 120 after return. | [School](wave8-whole-evidence/38-training-school.txt), [phone](wave8-whole-evidence/40-training-phone-ready.png), [landscape](wave8-whole-evidence/43-training-counter-landscape.png) |
| Earned upgrade | Spent 10 W-EXP to finish the remaining XP requirement; punch Lv.1→2, BP 13→14, mastery 10→11.1; W-EXP 110 remained. Clear before/after receipt. | [Before](wave8-whole-evidence/45-upgrade-before-landscape.txt), [receipt](wave8-whole-evidence/47-earned-upgrade-desktop.png) |
| Use purchased potion after training | HP 16→36, potion consumed. | [Purchased potion used](wave8-whole-evidence/48-purchased-potion-used.txt) |
| Choose what to do next | Rumors empty; magistrate's offered-work dialogue did not advance. Quest card accepted missing ledger. Journal said to talk to a clerk in an office but gave no navigable office name or route. Palace reached using 20 more energy; no clerk found there. | [Rumors](wave8-whole-evidence/50-next-activity-rumor.png), [work dialogue](wave8-whole-evidence/51-next-magistrate-work.png), [journal](wave8-whole-evidence/57-ledger-details.png), [palace](wave8-whole-evidence/63-palace-desktop.png) |

Some filenames reflect the anticipated next screen: `07-capital-desktop` is the random encounter prompt, not a city capture. `15-capital-desktop` is the settled city. `61-palace-next-destination` was captured before travel finished; `62` and `63` show the settled palace. Conclusions use the settled captures.

## Side-by-side judgments

### 1. World and inhabitants

[Open comparison](wave8-whole-evidence/comparison-world.png) · [interactive-size HTML](wave8-whole-evidence/comparison-world.html)

The capital has attractive architecture, a readable main square, distinct NPC costumes, foreground structure, and a consistent warm palette. It is substantially more credible than an empty map with menu buttons. But at the same displayed width the actors and useful objects surrender too much attention to roof and ground texture. The sprites, their hard edges, and their scale do not completely belong to the environment's visual language. Repeated service symbols communicate functionality more strongly than the businesses themselves.

The [official Hero's Adventure village reference](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1948980/ss_912e85b24d5aca87ab5a5d3d0e42bbd3b1d556d7.1920x1080.jpg?t=1786720220) has simpler surface detail but more legible social staging: people stand around a well, goods, and distinct workplaces; animals and household objects give the scene specific life. More texture is not the missing ingredient here. More purposeful inhabitants are.

### 2. Conversations

[Open comparison](wave8-whole-evidence/comparison-conversation.png) · [HTML](wave8-whole-evidence/comparison-conversation.html)

Ordinary dialogue keeps the hero and Dr Lin standing together on the actual city scene. That continuity works. The bottom panel also reads better than the initial NPC action popup, which dims almost everything and packs quest cards into a small generic modal.

The [official Hero's Adventure conversation image](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1948980/ss_b17660e80b78119b6f3404c5219309d8398aac6a.1920x1080.jpg?t=1786720220) gives the speaker a large expressive portrait and a scene staged around the speaker. Here the portrait is a tiny thumbnail, the participants remain small, and two paragraphs plus choices dominate. The result is understandable but emotionally distant. Worse, the observed dead-end choices and stale speaker header undermine the continuity that the scene framing otherwise earns.

### 3. Combat and strategy

[Open comparison](wave8-whole-evidence/comparison-battle.png) · [HTML](wave8-whole-evidence/comparison-battle.html)

Combat has real actors, visible turn state, explicit costs, readable recovery risk, and a visible guard-to-counterattack relationship. Phone and landscape layouts retain every action. The actor scale is much stronger than in exploration. These are genuine strengths.

The [official Dokapon combat reference](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2338140/ss_0b097c2af138a5cacced0512a760969f7fb2f81d.1920x1080.jpg?t=1786481577) uses large, immediately comparable names, health and combat statistics. Here health and MP are small corner details while the detailed backdrop occupies most attention. The game's enlarged pixel actors also look softer than the scenery. The road thief and training both used the same scenic mountain terrace despite occurring in different places; it is a handsome generic arena, not a convincing continuation of either location.

The two fights establish a useful tutorial decision, not deep strategy. Both opponents had 36 HP; guard then punch beat both with the same observed incoming damage. The opening did not make me adapt to a distinct enemy intention or choose between multiple offensive approaches. I did not test later moves, enemy variety, recovery balance, or a difficult encounter, so I cannot generalize this to the full combat system.

### 4. Shops and progression

[Open comparison](wave8-whole-evidence/comparison-shop.png) · [HTML](wave8-whole-evidence/comparison-shop.html)

The market communicates price, owned count, recovery value and affordability. Potion use produces a real HP change. The upgrade receipt gives precise before/after numbers and an understandable explanation. The clinic's added crate and patient are the best example in this run of a menu action making the place meaningfully different.

Yet the service presentation is a small-font scrolling inventory sheet. There is no seller, personal reaction, or distinct shop interior. The [official Dokapon shop reference](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2338140/ss_ff8d9b016635a73f48b165d89418945baf45745f.1920x1080.jpg?t=1786481577) makes the merchant and selected item's consequence the dominant elements. The browser game's market is functional; it is not comparably memorable.

### 5. Beyond the prepared opening

[Open comparison](wave8-whole-evidence/comparison-next-world.png) · [HTML](wave8-whole-evidence/comparison-next-world.html)

The palace is an impressive background with almost nothing happening in it. No NPC was visible. Its destination list offered resting at a temple, training, gathering ordinary herbs, and two indistinguishable `ตรอกในวัง` exits. That is a weak match between this specific place and its offered activities. The palace was my inference from a government-office quest, not a destination the quest explicitly directed me to. I do not claim the clerk is missing from the game; I claim I could not discover a reliable route to him from the information offered.

## Controls and small-screen findings

- Arrow-key movement worked in the courtyard. Destination selection walked the actor toward interactions and eventually changed locations. Some approaches took several seconds; the destination drawer closes before arrival, making short waits feel unacknowledged. A small walking-to-target indicator would improve feedback.
- [Portrait battle](wave8-whole-evidence/40-training-phone-ready.png) and [landscape battle](wave8-whole-evidence/41-training-landscape.png) fit actors, HP and all actions. Landscape's side controls are a sensible use of space.
- [Portrait conversation](wave8-whole-evidence/24-magistrate-phone.png) keeps participants visible, but the third option is below the initial visible panel. Scrolling is needed; a clearer continuation cue would help. I used the visible first choice successfully by touch.
- The portrait world HUD is large and the eight bottom-menu buttons are tightly packed. Long destination lists need scrolling and provide limited geographic structure. These are usability costs, not demonstrated blockers.
- **Transient overlap, not a proven persistent bug:** [capture 26](wave8-whole-evidence/26-capital-phone.png), taken immediately after leaving the magistrate dialogue, shows the guidance bar covering the hero. A later comparable settled state after 1.5 seconds places the bar at the bottom and leaves the hero visible: [capture 58](wave8-whole-evidence/58-phone-settled-magistrate.png). The exact initial clinic stage was not rerun; do not report permanent obstruction from capture 26 alone.

## Fix priorities from observed evidence

1. **Make the next self-directed quest discoverable and grounded.** Give the missing-ledger objective a named office, a route clue or map target, and a visible clerk where the clue leads. Give the palace interactions that belong there and distinguish its two identically named exits. Ensure the first rumor service can provide a useful local lead rather than becoming the player's first empty followup. Acceptance check: a new player can find and begin the next quest without product-source knowledge or a walkthrough.
2. **Make every conversation choice visibly respond.** Dr Lin's herbs question and the magistrate's offered-work question both left the same text/options. A random monk and a later random traveler inherited the preceding NPC's portrait/name. Preserve original captures 20, 21, 51 and 55 as failures; only a rebuilt playthrough can close them.
3. **Carry scene identity through services and combat.** Frame a recognisable merchant, give the current speaker more expressive space, and use an arena that matches the encounter location. Keep the functioning world-actor continuity. Reduce environmental visual noise where it competes with actors and actionable objects.
4. **Require adaptation after the lesson.** A second enemy should make a different choice useful through a clear intention, cost, or weakness. Guard/punch is a comprehensible lesson; repeating it is not sufficient evidence of a satisfying strategic loop.
5. **Tighten the presentation of longer systems.** Reduce repeated empty skill slots, prioritise the selected shop item, improve small HUD type, and make hidden conversation choices/destination continuation more obvious. These improvements matter after the continuity and next-objective defects.

**Single biggest remaining gap:** the game does not consistently turn its illustrated places into understandable opportunities for action after the guided opening. The clinic's physical payoff shows the right direction. The empty rumor followup, unchanged work reply, vague office objective, and largely vacant palace show why another pass focused on more art alone would miss the problem.

I would describe this build as a promising opening slice with working progression, attractive environments, and usable mobile combat. I would not describe it as reference-level, comprehensively tested, or ready to claim a complete whole-game experience.
