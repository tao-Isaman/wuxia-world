# The phone HUD — what the research says and what we do

A short note on the 2026-10-13 HUD pass: the guidance we read, how the game measured against it on an 844 × 390 phone (landscape), and what changed. Layout and code live in [rendering.md](../rendering.md#hud).

## What the guidance says

| Topic | Guidance | Source |
| --- | --- | --- |
| Touch targets | 44 × 44 pt (iOS) / 48 × 48 dp (Android) at least; 48–56 px is more comfortable for game UI; at least 8 px between targets; a small icon can keep its look and grow its hit area with padding | [Smashing Magazine](https://shop.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/), [W3C mobile target size](https://www.w3.org/WAI/GL/mobile-a11y-tf/wiki/Proposed_SC_Target_Size), [specification.website](https://specification.website/spec/accessibility/touch-target-size/) |
| Text size | Essential text legible at 12 in; the Xbox handheld guidance puts the smallest text at 14 px of 1080p height (18 px recommended); a player text-size setting is better still | [Xbox Accessibility Guidelines 101](https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/101), [Xbox handheld guidelines](https://devdocs.xbox.com/build/gdk-and-engines/handheld/handheld-guidelines-and-testcases), [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=3285) |
| Hierarchy | Keep survival data (health) always shown, tactical data (objective, minimap) hideable, strategic screens (inventory, full map) on demand only; one main HUD cluster; keep the centre of the screen clear | [StraySpark: game UI principles](https://www.strayspark.studio/blog/game-ui-ux-design-principles), [Roblox: UI and UX design](https://create.roblox.com/docs/production/game-design/ui-ux-design) |
| Thumbs | Landscape is held with both hands: movement under the left thumb, actions under the right, nothing under a resting thumb | [UX Mag: The Mobile Frontier](https://uxmag.com/articles/excerpt-from-the-new-book-the-mobile-frontier), [game UI patterns reference](https://cdn.jsdelivr.net/npm/@hegemonart/get-design-done@1.60.4/reference/domains/gaming-patterns.md) |
| Clutter | Small screens drown in buttons; collapse to a narrow stack or contextual chips before covering the playfield | [Roblox: wireframe your layouts](https://create.roblox.com/docs/tutorials/curriculums/user-interface-design/wireframe-your-layouts), [Pixune: mobile game UI review](https://pixune.com/blog/best-examples-mobile-game-ui-design/) |

These are design heuristics from platform guides and design writing, not controlled studies; playtesting on real phones decides.

## How the game measured (844 × 390, before)

- The top-left stack (vitals + 11 section icons in three rows) covered about 250 × 200 px of the map at all times — strategic screens in permanent HUD space.
- Section icons were 38–40 px (under 44) with 9 px labels; the vitals' labels were 9 px.
- The จุดหมาย pill kept an empty half (and a divider) where the hidden keyboard hint was.
- The overheard-rumor banner could run to three lines across the bottom centre.
- The battle unit card read "136/136 HP" in English.
- What already fit: joystick under the left thumb; action, rest and จุดหมาย under the right; menus as full-screen panels with 44 px tabs; the chat a single bar at the bottom centre.

## What changed

- **เมนู folds the section icons** (strategic → on demand). Phones start folded and fold again after a section opens; the folded button sums the icons' badges so nothing waiting is missed. Larger screens keep the icons out. Hotkeys are unchanged.
- **44 px targets, larger text**: every HUD icon ≥ 44 × 44 px; labels 10.5–11 px; vitals labels 11 px and numbers 12 px.
- **จุดหมาย** is a plain 44 px button on touch screens.
- **Rumor banner** at most two lines, narrower on phones, so the centre stays clear.
- **Thai in battle**: ชีวิต / ปราณ on the unit card.
- **Guidance on the HUD**: a boat leg names its pier in the tracker on every screen size.

## Not done yet (ideas)

- A text-size setting (the Xbox guidance's strongest advice).
- Movable / resizable touch controls.
- Hiding the vitals card while at full health and walking (adaptive HUD).
