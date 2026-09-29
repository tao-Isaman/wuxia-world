# Independent world/play review 1

Reviewed the actual running game at `http://127.0.0.1:3017` in Chromium on 2026-09-28 at 1440×900, 390×844, and 844×390. This is a review of the captured build, before the subsequent world-renderer revision. No application or test files were edited. Evidence is in `review/world-critic-1/`, including a continuous browser recording in its `video/` directory.

## Initial anonymous A/B judgment

Recorded in `world-critic-1/initial-ab.md` before opening the game: **B communicates the more coherent professional 2D adventure world.** Its people, buildings, vegetation, props, outlines, shadows, and perspective belong together. A has attractive environmental detail, but the sharp, saturated, large character and black-backed marker appear pasted over a softer painterly scene. That inconsistent visual construction is A's single largest gap.

I did not confidently recognize B's source during the initial judgment. A's UI and Thai labels made it identifiable as a game capture, so this was an anonymous comparison rather than a scientifically blind experiment. Developer-required coordination reading inadvertently exposed historical builder notes in `shared.md`. I did not read DESIGN.md, progress.json, implementation, or earlier reviewer reports. I read the allowed browser test for navigation labels and the save key. After all live captures, I viewed the supplied Hero's Adventure and Dokapon reference images; the first Hero's Adventure reference was B.

## Verdict

**Functional exploration is present; the world does not yet meet the references' visual and spatial coherence.** The biggest remaining gap is the integration of characters with the world: scale and style make the actors look superimposed, and traversing painted solid structures proves that this is also a spatial problem. More background detail alone will not resolve it.

Capital screenshots are stronger evidence than the home opening: several men have the same blue outfit and silhouette as the player, actor height approaches the visible shop-front height, and the player can move across stall canopies and roofs. In the references, even deliberately stylized proportions consistently explain where a character stands and how it relates to surrounding objects.

## Actual actions

1. Opened the title at 1440×900. The initial navigation briefly displayed `Can't resolve '@/app/combat-actions.css'`. After eight seconds the title recovered without a fix from me. Captured the error as `01-title-desktop.png` and recovered title as `02-title-desktop-recovered.png`.
2. Entered `World Critic One` and clicked `เริ่มเกมใหม่`. Captured home as `03-home-desktop.png`.
3. Focused the world. Held D for 650 ms, A for 400 ms, and W for 400 ms, capturing each while the key was held; released each key and sampled idle. Screenshot execution adds time to each held-key segment, so these are minimum hold durations. Captures `04`–`07` show right-facing walking, left-facing walking behind the well beam, upward movement, and the following idle.
4. Opened `จุดหมาย`, selected `ทางออกจากบ้าน` (`route_home_player__to__city_capital`), and watched the actor travel toward the home gate. Capture `09-route-desktop.png` is still home during that travel, despite its filename. An attempted destination click before travel completed timed out; after arrival I reopened the destination list and selected `destination-0`. Captured the actual road as `10-route-arrived.png` and the capital as `11-capital-arrival.png`. No save edits or teleporting were used. Stamina became 80.
5. From the capital entrance held W for 950 ms, released and waited 800 ms, then repeated. This moved north across the painted shop row and into the square (`12-capital-north-through-shop.png`, `13-capital-square.png`).
6. Opened `จุดหมาย`, selected `npc-city_capital_physician_lin`, and waited for approach and interaction. Captured the physician popup (`14`), clicked `ทักทาย`, and read the resulting conversation (`15`, `16`). Clicked `ลาจาก` to return. The conversation correctly used a separate scene rather than the popup; an inspection expecting a world canvas while inside that conversation timed out, which was an observer assumption, not a game failure.
7. Resized the same session to 390×844 and captured `17-capital-portrait.png`. Tapped (270,490), waited 1.6 seconds, and captured `18-capital-portrait-touch.png`. Observed player position changed from (336.0,381.2) to (392.7,371.6).
8. Resized to 844×390 and captured `19-capital-landscape.png`. Tapped (470,154), waited 1.3 seconds, and captured `20-landscape-touch-near-well.png`. The actor moved into the square near the well. Document width equaled viewport width, 844 px.
9. Resized back to 1440×900. Took three idle samples separated by at least 350 ms (`21-idle-*`), then three held-A samples separated by at least 80 ms plus screenshot time (`22-walk-left-*`). Idle frame observations were 3,2,2 at a constant (470.0,331.0). Walking frames were 5,7,4, with X changing 365.0→265.0→167.5. Released A, waited 500 ms, then held S for 170 ms plus capture time (`23-walk-down.png`). Closed the browser context to finish the video.

## Observed checks

| Check | Result | Evidence and practical consequence |
|---|---|---|
| Home → road → capital | PASS | Destination selection moves the character before transition. The route and capital load and stamina updates. |
| NPC approach and conversation | PASS | Physician popup, greeting conversation, and leave action work. The greeting has a readable full character portrait. |
| Idle and walk animation over time | PASS, limited | Actual live samples show changing poses/frame indices and different leg positions. Idle stays at the same world position. This establishes animation, not a claim of consistently smooth playback on other hardware. |
| Horizontal direction | PASS | D faces right; A faces left (`04`, `05`, `22`). |
| North/south direction | FAIL | W and S retain a horizontal side-facing pose (`06`, `23`). The actor slides vertically while visually walking sideways. |
| Feet on ordinary ground | PARTIAL | Feet and the shadow/selection ring align reasonably on open paving. The bright thin gold ellipse is more a UI marker than a convincing environmental shadow. |
| Home foreground well | PASS for sampled overlap | The wooden beam/post covers the actor when moving behind it (`05`). This is real partial occlusion. It does not establish collision around the well. |
| Gate depth | PARTIAL | The roof hides the lower actor during the home exit approach (`09`), and gate travel succeeds. The capture alone cannot establish every front/back overlap transition. |
| Capital obstacle/ground integration | FAIL | W crosses the entire painted shop row (`11`→`12`). Held A puts the actor over a stall canopy (`22-walk-left-1`); S puts feet and the selection ring on the forge roof (`23`). These positions read as walking on buildings without stairs, elevation changes, or an intentional roof-traversal animation. |
| Actor/environment proportions and style | FAIL | Character height nearly matches the visible shop frontage, and hard dark sprite edges/high blue saturation differ strongly from the background's softer rendering (`11`, `13`, `21`). |
| Population identity | FAIL | Multiple men repeat the player's blue robe and silhouette. The physician has a distinct pale-green silhouette, but the square still reads as repeated player avatars (`13`). |
| Labels and markers | FAIL for coherence; functional for access | Nearby labels are readable but very large, overlap actors/architecture, and sometimes stack (`13`). Black squares behind service icons look like asset backgrounds (`03`, `13`). The destination list reliably exposes actions. NPC popup also exposes English role tags and a raw relationship ID in quest rewards (`14`). |
| Portrait touch | PASS with major framing limitation | Tap moves the actor and the menu fits. However, the top status/location stack and bottom quest/menu stack hide much of the world. The expanded quest occupies almost full width from roughly y542–698. The lower-left development indicator overlaps the first menu item (`17`, `18`). |
| Landscape resize/touch | PASS with framing limitation | Touch works after resize; no horizontal overflow. One world canvas is 1440×900 after resizing back; the second canvas belongs to the HUD portrait, not a duplicate world. At 844×390 the left status/quest stack occupies about one-third of the width and most of its height (`19`, `20`). The helper changes to keyboard wording despite this being a touch-enabled session. |
| Runtime errors | PARTIAL | Initial transient build error was captured; no new page errors appeared during the subsequent world exploration. Concurrent development means this is not a clean production availability claim. |

## Concrete acceptance criterion for the largest gap

On a new 1440×900 capital recording, start at the entry gate and complete one continuous circuit around the well, both adjacent market stalls, and a shop front, then return through the gate. Pass only if (1) feet remain on plausible ground on every sampled frame, (2) painted solid stalls/buildings block or visibly route movement, (3) the same actor appears behind foreground props when north of them and in front when south, and (4) north/south motion has an appropriate facing pose. A side-by-side still at the end should also show actor height comfortably below a doorway and NPC silhouettes that can be distinguished without reading labels. Re-run the circuit at 390×844 and 844×390 with the player's next step and nearest interaction visible without collapsing an essential navigation panel.

This criterion addresses the observed gap. It does not require copying either reference's art style or claim that their entire gameplay was evaluated.

## Evidence

- Main comparison: `world-critic-1/initial-ab.md`.
- Strongest integration evidence: `world-critic-1/13-capital-square.png`, `world-critic-1/22-walk-left-1.png`, `world-critic-1/23-walk-down.png`.
- Responsive evidence: `world-critic-1/17-capital-portrait.png`, `world-critic-1/19-capital-landscape.png`.
- Continuous capture: `world-critic-1/video/page@9f52e297e9f7f114469d60c0f5e082f1.webm`.
- `world-critic-1/browser-driver.cjs` is the review-only Playwright capture helper; it made no app or test changes.
