# Independent world visual review

Review date: 2026-09-28. Production URL: `http://127.0.0.1:3017`.

## Final verdict after production recheck

The rebuilt game fixes the two concrete problems found in the first pass: the market's characters are clear of the landscape status HUD, and Lin's black-haired, pale-robed world character matches his portrait. The player's whole body now clears the roof at Lin's conversation endpoint. These are visible improvements in the running production game, not conclusions from the reported source changes.

**The single biggest remaining reference gap is NPC cast distinctness.** Two capital NPCs have essentially the same orange-robed silhouette, and two have essentially the same dark-robed silhouette. Lin and the blue player are now distinct, but several other inhabitants still look interchangeable. Hero's Adventure's village makes individuals easier to recognize through differences in hair, hats, body shape, clothing, and occupation. This is the next art-quality gap, not a movement or interaction blocker. I still prefer the reference's world presentation; this review does not certify parity.

Acceptance for that single gap: in the default capital view, the six named NPCs should be distinguishable before reading their labels, using visibly different headwear/hair, garment shapes or carried objects. Check again at 390 × 844 and 844 × 390; differences should survive the smaller rendering. Keep their hair/age/clothing consistent with the portraits shown when approached. A tint change alone is insufficient if the silhouette remains interchangeable.

Current comparisons: [final capital side-by-side](world-final-evidence/52-final-side-by-side-capital.png), [final night side-by-side](world-final-evidence/53-final-side-by-side-night.png), [final Dokapon hierarchy comparison](world-final-evidence/54-final-side-by-side-dokapon.png), and [full final comparison board](world-final-evidence/comparison-final.html). Dokapon's close character view is a hierarchy reference, not a claim of equivalent gameplay/camera states.

### Production recheck results

| Check | Final observed result |
| --- | --- |
| Market HUD clearance | Pass for fresh arrival at 844 × 390 and rotation into 390 × 844, guide collapsed and expanded. Both actors' heads/torso remain clear. [Landscape](world-final-evidence/31-recheck-market-landscape-collapsed.png), [expanded landscape](world-final-evidence/32-recheck-market-landscape-expanded.png), [portrait](world-final-evidence/35-recheck-market-portrait-collapsed.png), [expanded portrait](world-final-evidence/34-recheck-market-portrait-expanded.png). |
| Lin identity and endpoint | Pass: young black-haired pale-robed world character matches the portrait; player's feet remain in the lane rather than behind the roof. [Portrait popup](world-final-evidence/36-recheck-lin-portrait-dialogue.png), [world](world-final-evidence/37-recheck-lin-portrait-world.png), [landscape](world-final-evidence/40-recheck-lin-landscape-collapsed.png). |
| Expanded guide at Lin | Heads/torso stay visible in both orientations. Portrait expansion covers Lin's floating nameplate, while the guide itself identifies Lin by name. This is a minor exception to the original all-labels-clear target, not the original actor-obscuring failure. [Portrait expanded](world-final-evidence/38-recheck-lin-portrait-expanded.png), [landscape expanded](world-final-evidence/39-recheck-lin-landscape-expanded.png). |
| Guide scroll | Pass. The 844 × 390 guide's inner content is scrollable; scrolling reveals the final instruction. [Scrolled guide](world-final-evidence/33-recheck-guide-scrolled.png). The initially clipped line is not inaccessible. |
| Wu endpoint | Both actors clear the HUD and guide in both orientations. Minor naming ambiguity: after selecting Wu and closing his correct NPC popup, the nearby proximity label reads “สำนักยุทธิ์” (school), rather than Wu. [Landscape](world-final-evidence/41-recheck-wu-landscape-collapsed.png), [portrait](world-final-evidence/44-recheck-wu-portrait-collapsed.png). |
| School entrance | Reached using the normal destination list. The school popup presents the free guard/counter training introduction and button at portrait size. After closing, the school doorway and actor remain clear in both orientations, guide collapsed/expanded. [Introduction](world-final-evidence/45-recheck-school-portrait-dialogue.png), [portrait endpoint](world-final-evidence/46-recheck-school-portrait-collapsed.png), [landscape endpoint](world-final-evidence/49-recheck-school-landscape-collapsed.png). Combat was not entered in this bounded review. |
| Night on rebuilt production | Repeated the authorized time-only 3 → 9 fixture and verified the rendered `ยามค่ำ` label. Warm windows/lanterns and cooler darker surroundings remain visible. [Night](world-final-evidence/51-recheck-capital-night.png). |

The recheck used another fresh context after the first browser was closed. A random hostile encounter appeared on arrival; I used the normal flee control, then continued. No stats, money, quests, NPC positions, or location fields were edited. Both browser sessions recorded zero page errors and were fully closed; the second process exited successfully before this report was finalized.

## Initial build findings (historical; corrections verified above)

The home is visually attractive, the blue player is identifiable, and world navigation works. I still prefer Hero’s Adventure’s world presentation: its inhabitants have clearer individual shapes and its scenery separates into readable forms more cleanly. This game’s capital has rich surface detail but weaker character prominence. Dokapon’s brighter character-first presentation is a different style; its useful lesson here is that the person being approached remains unmistakably visible.

**The single biggest observable gap is landscape HUD occlusion at the market endpoint.** At 844 × 390, normal travel to the capital market followed by closing its popup leaves the player’s head and upper body, and the merchant’s head, behind the fixed status panel. Only lower bodies protrude below it. The guide relocates to the right, but the status panel still covers the encounter. This makes a successful arrival look visually broken and is more urgent than adding background detail.

Evidence: [market landscape](world-final-evidence/25-capital-market-landscape.png), [Dokapon side-by-side](world-final-evidence/29-side-by-side-dokapon.png). The side-by-side compares hierarchy, not equivalent gameplay or camera states.

Acceptance: at 390 × 844 and 844 × 390, reach Physician Lin, the market, and Magistrate Wu through normal destination controls. After closing each interaction, both characters’ complete head/torso silhouettes and the target label must remain outside status, guide, and menu overlays. The collapsed guide and its expansion control must remain visible. Repeat with the guide expanded; scenery can be covered, but the active pair should remain locatable. Do not solve this by shrinking the characters further.

## Specific observations

| Check | Observation from running game |
| --- | --- |
| Home scale | The approximately 65–70 px player is comfortably readable at 1440 × 900. The home architecture supports that scale. [Home](world-final-evidence/02-home-desktop.png). |
| North/south walk | Rear hair/robe and front face/robe poses are visibly different. Movement has separate leg/robe positions; it does not read as a single unchanged image sliding. [North](world-final-evidence/03-home-walk-north.png), [south](world-final-evidence/04-home-walk-south.png). Static captures cannot establish parity with reference animation. |
| Player distinctness | Blue clothing, scarf, and overhead marker distinguish the player from the capital’s pale, orange, and dark NPCs. Fine facial detail is weak at landscape scale. |
| Foreground depth | The home gate roof covers the character when moving beneath it. Capital storefronts stop direct northward movement, and roofs overlap a character behind them. This produces real depth rather than drawing every character over every roof. [Gate](world-final-evidence/10-home-gate-behind.png), [shop boundary](world-final-evidence/16-capital-front-shop-block.png). |
| Physician approach | Destination routing reaches Lin from the south side of the shop row. On arrival the player’s lower body sits behind the foreground roof; this is plausible layering but a cramped conversation endpoint. [Endpoint](world-final-evidence/18-capital-physician-world.png). |
| NPC identity | Lin’s world sprite has white/gray hair and dark robes, but his popup portrait has black hair, a young face, and pale robes. This is an unmistakable identity mismatch, independent of stylistic preference. [World](world-final-evidence/18-capital-physician-world.png), [portrait](world-final-evidence/17-capital-physician-approach.png). Root acknowledged a source correction; it is not yet verified in a rebuilt production view. |
| Shop approach | The market opens through normal destination travel, beside the west storefront. No edited money/stats were used; purchase buttons are correctly unavailable with zero gold. [Market](world-final-evidence/23-capital-market.png), [world endpoint](world-final-evidence/24-capital-market-world.png). |
| Portrait guide | It automatically collapses when the viewport becomes 390 × 844. Expansion is readable and leaves the player visible at home and Lin’s endpoint, though it occupies a substantial band of world. [Collapsed](world-final-evidence/19-capital-portrait-collapsed.png), [expanded](world-final-evidence/20-capital-portrait-expanded.png). |
| Landscape guide | At 844 × 390, collapsed and expanded controls remain reachable. The expanded panel’s last line is partially clipped in the initial position; its inner scrolling still needs a direct recheck. [Expanded](world-final-evidence/21-capital-landscape-expanded.png), [collapsed](world-final-evidence/22-capital-landscape-collapsed.png). |
| Actual night | With only persisted `state.time` changed from 3 to the valid nighttime value 9, the HUD renders `ยามค่ำ`. The city is darker/cooler and localized warm light appears at visible building windows/lanterns. It is a real night presentation, not a daytime screenshot called night. Hero’s Adventure’s reference has stronger separation between dark ambient space and local warm light; this game’s ground remains comparatively evenly readable. [Actual night](world-final-evidence/26-capital-night-time-only-fixture.png), [night comparison](world-final-evidence/28-side-by-side-night.png). |

## Direct reference comparison

The [comparison board](world-final-evidence/comparison.html) keeps original screenshots uncropped and pairs them visually. [Capital comparison](world-final-evidence/27-side-by-side-capital.png) shows the distinction particularly well: Hero’s Adventure’s village inhabitants have varied hats, heads, bodies, and occupations amid clearly bounded architecture; this game’s two orange-clothed merchants look alike, and the six similar foreground shops compress the capital into a regular strip. The game’s more intricate background texture is attractive, but extra texture does not replace readable people and interaction space.

References inspected directly: official Steam screenshots stored as `review/baseline/ref-1948980-0.jpg` through `-7.jpg` and `ref-2338140-0.jpg` through `-7.jpg`; their source URLs are preserved in the adjacent `reference-1948980.json` and `reference-2338140.json` manifests. Primary comparison anchors were Hero’s Adventure village `-0`, night `-1`, and Dokapon world-character view `-7`.

## Method and limits

Fresh browser context, new male character, ordinary home → road → capital destination travel, keyboard movement, and normal NPC/market interactions. No gameplay state was edited except the explicitly authorized time-only night fixture. No implementation files, previous review reports, or builder summaries were read. Mandatory coordination files were read; the shared coordination file contained a historical project-status entry, so this is an independent fresh critic review, not a scientifically blinded experiment.

One Chromium browser at a time, no video. Captures at 1440 × 900, 390 × 844, and 844 × 390. No page errors were recorded. The browser was fully closed and its process exited successfully before the requested rebuild. This is a bounded world review; it does not certify combat, all NPCs, or the full campaign.

Production recheck is complete. The first-pass screenshots are retained to make the corrections reviewable; the final verdict and current evidence are at the top of this report.
