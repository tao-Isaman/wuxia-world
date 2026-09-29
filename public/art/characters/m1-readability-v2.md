# M1 readability candidate v2

Status: isolated candidate; not integrated into the runtime catalog.

Generated with the built-in imagegen tool. Original m1.png is the identity and pose-order reference. Official Hero’s Adventure screenshots in review/baseline were inspected for small-scale readability only; no commercial artwork is included in this asset.

## Exact prompt

Use case: identity-preserve.
Asset type: a revised 16-pose transparent pixel-art character sheet for a browser wuxia RPG, designed for characters displayed only 60–70 pixels tall.
Input image 1 is the existing hero sheet. Preserve this exact young adult male hero's identity: black high ponytail tied with a cobalt ribbon, determined mature face, cobalt-blue split travelling robe, pale blue/ivory crossed inner collar and inner skirt, brown leather waist belt with small brass clasp, brown wrist guards and boots, sword sheathed at the left hip. Preserve all sixteen pose roles and their reading order. Redraw the pixel art rather than adding sharpness or texture.

PRIMARY CHANGE: make facial expression, hands, action silhouette and major costume planes readable at small screen size. Use deliberate compact adult RPG proportions: approximately FIVE head lengths from chin/top of head to soles, a somewhat larger visible face and hands than the reference, shorter robe/lower legs, strong shoulders, anatomically credible joints. Mature face, firm small eyes, straight nose and jaw: NOT a child, not a giant-headed chibi mascot. Keep enough open face outside the bangs that eye, nose and cheek form distinct warm pixel clusters. Hands have a clear thumb silhouette and a visible warm light plane; fists do not disappear into cuffs.

Pixel technique: authentic detailed 32-bit-era hand-pixelled sprites, clean square clusters and stepped contours, a restrained cohesive palette. Large intentional light/midtone/shadow planes with selective small details only at collar, belt and face. Warm tan skin with light peach highlights, clear pale collar, rich mid-bright cobalt robe, deep indigo shadows. Simplify the many tiny fabric stitches and noisy speckles into a few elegant angular folds. Selective light-blue edge pixels on lit shoulders, sleeves and robe hem separate the body from busy warm-brown terrain. The dark outer contour remains slim and crisp, with no thick black moat, neon glow, white halo, bloom, blur, gradients or antialiasing. Black hair uses a few readable blue-grey highlight clusters. Visual density about a carefully authored 45×72-pixel sprite, shown enlarged with nearest-neighbor pixel blocks. The face should remain readable at 65 screen pixels tall.

COMPOSITION IS CRITICAL: ONE transparent PNG, EXACT four columns by four rows of equal cells. 16 complete separate full-body poses, no extras. Align cell centers and row baselines on a strict regular grid. Each cell has generous clean transparent gutters: all hair, hands, sword and feet remain inside the middle 80 percent of the cell width, with at least 10 percent empty margin on all four edges. Identical head size, body scale and costume across every frame. Feet lie at 87 percent of each cell's height; kneeling knees/boots rest on that same baseline. Do not stretch one pose to fill its cell. Face RIGHT in a three-quarter side view throughout, with only pose-appropriate head turns.
Row 1, left to right: four subtle but distinct idle breathing frames; relaxed ready posture, small chest/sleeve and ponytail shifts, stable foot positions.
Row 2: four clear walking cycle frames moving RIGHT: left foot forward/right foot back, passing contact, right foot forward/left foot back, opposite passing contact. Counter-swinging arms, consistent body height, full visible feet.
Row 3: four unarmed straight-punch action frames: compact anticipation with fists raised, clear wind-up with fist drawn back, fully extended forward punch RIGHT and weight on front leg, recovery to guard. Sword stays sheathed, no effect slash.
Row 4: HIT recoil leaning back to left; two-arm GUARD protecting face and chest; VICTORY with one fist raised above head; DEFEAT kneeling with bowed head. All four complete and grounded.

True alpha transparency, not a painted checkerboard. No ground shadows, scenery, labels, numbers, borders, text, particles or other objects. Preserve the original hero; improve visual communication, not ornamentation.

## Targeted proportion revision prompt

Use case: precise-object-edit. Edit the provided transparent sixteen-pose pixel-art wuxia hero sheet. Change ONLY character proportions and pixel-cluster simplification, preserving the cobalt robe, pale blue collar, brown belt/boots/wrist guards, sheathed sword, black ponytail/blue ribbon, pose order, transparency and crisp pixel-art medium.

The current heads are still too small. Make the actual skull/face area FORTY PERCENT LARGER in each of all sixteen poses, not just the hair, so his facial expression remains readable when the whole sprite is displayed 65 pixels tall. Make both bare hands TWENTY-FIVE PERCENT LARGER so each thumb/knuckle gesture reads. Shorten the length from shoulders to soles by about FIFTEEN PERCENT, especially robe skirt and lower legs. Preserve believable shoulders, elbows, knees and wrists. Result should be an intentional adult RPG sprite with the top-of-skull-to-soles height about FOUR AND A HALF head lengths, instead of the current roughly seven. This is crucial: noticeably larger face, not cosmetic sharpening. Keep adult masculine facial features and straight nose/jaw; no baby face, enormous round anime eyes, tiny torso or generic chibi mascot.

Fit these new compact proportions in every pose, with matched head size and body scale. Draw clear light warm face and hand pixel clusters, dark angular eyebrows/eyes, a short nose highlight, one cheek shadow. Keep a clean black/navy silhouette with selective pale-blue shoulder/robe-edge highlights and simple angular fabric planes. No busy stippling or noisy tiny embroidery. No blur or painted antialiasing. Coherent detailed 32-bit-era pixel-art palette, not a modern smooth cartoon.

Keep EXACTLY FOUR COLUMNS × FOUR ROWS on a transparent PNG; 16 full-body separate poses. Preserve the input order: row 1 four idle frames, row 2 four rightward walk frames, row 3 anticipation/wind-up/extended right punch/recovery, row 4 recoil/guard/raised-fist victory/kneeling defeat. Each cell equal size. Body center fixed in each cell and grounded at 87% of cell height. All limbs, hair and swords remain entirely inside each cell, with wide transparent gutters, no touching neighbors. All face right in a three-quarter view, except pose-appropriate turns. Maintain feet baselines. Sword stays sheathed, no new props or effects.
True alpha transparency. No background, ground shadows, text, grids, labels or borders.

## Transparent-margin correction prompt

Use case: precise-object-edit. This image is a sixteen-pose pixel-art hero spritesheet. Preserve the current larger face/hands, compact adult proportions, costume, colors, all sixteen poses, every pixel-art detail, and true alpha transparency. Do not redesign the hero.
Correct ONLY the spacing/layout problem: the hair of the recoil pose at BOTTOM LEFT is cut off at the image's left edge. Redraw that same complete recoil pose fully visible and move its center slightly RIGHT so all hair and cloth fit within its own first-column cell. Give it at least 24 source pixels of clear transparency from the outer left edge. Keep the other fifteen poses unchanged in appearance and order.
The final image must contain exactly 4 columns × 4 rows, no cut-off limbs or hair, no overlapping neighboring frames. Every pose fully visible with clean transparent gaps. Do not add or remove poses. No background, checkerboard, text, labels, grid lines, shadows or glow.

## Provenance and source cells

- Tool: built-in imagegen, identity-preserving edit workflow. No CLI fallback, scripted pixel repainting, or alpha removal.
- Final source: `C:\Users\PC\.codex\generated_images\01a0eb31-0164-7733-86b7-eedcc31d7935\exec-861b4722-ea1a-4b67-b7e4-43328e0a5105.png`.
- Final workspace asset: `public/art/characters/m1-readability-v2.png`.
- SHA-256: `8ac959e94b38f1df2b008345d9df43618177448b4662b7265e9e2602291f63da`.
- Earlier generated sources (not selected): `exec-461bc12b-5960-4da6-b6e4-48324a689e27.png` (proportions too close to original), then `exec-883f12f1-7c61-492d-9382-aa867007c578.png` (bottom-left recoil hair clipped at sheet edge), in the same generated-images directory. Originals remain there.
- Final source size: **1199 × 1312**. Cell proposal: columns **[0, 326, 610, 920, 1199]**, rows **[0, 359, 674, 970, 1312]**. These are measured transparent gutters, not a claim of equal exported cells.
- Alpha threshold 32, matching the runtime loader: **651,927** visible pixels, all assigned once; **0** cell-edge pixels; **16** nonempty frames. The outermost visible pixel is x=32, so the corrected recoil is no longer clipped against the left image edge.
- Reproduce read-only source measurement with `powershell -File review/measure-m1-readability-v2.ps1`; detailed bounds in `review/m1-readability-v2-source-bounds.json`.
- Source inspection: the face and bare hands occupy larger, clearer shapes; robe folds have fewer noisy details. This does not establish commercial parity or a final terrain-readability verdict. The generated alpha includes intermediate values and should not be described as strictly binary native pixel art.
- No revised north/south supplement exists. The active runtime and original sheet/catalog are unchanged. A separate diagnostic runtime comparison and fresh review are required before integration.

## Runtime comparison diagnostic

`review/render-m1-readability-v2.cjs` imports the actual atlas loader and Three.js world runtime into a temporary diagnostic-only bundle. It renders both versions in separate browser contexts, at the same capital position, dimensions, light, and simulated motion timestamps. Only the candidate context routes the m1 base PNG to this candidate and supplies the measured source-cell layout. Active source files and the running application are not modified.

The script writes neutral A/B screenshots and a comparison page, with identity in a separate `mapping.json`. All sixteen base poses are shown at actual game display scale; four genuine eastward walking frames use real keyboard input and world movement. Attack snapshots select base pose frames through a diagnostic idle-clip override; they are explicitly labeled as posed rather than played combat. No new directional artwork is supplied. The NPC/UI layers are omitted equally so forced pose changes affect only the hero.

`node review/render-m1-readability-v2.cjs --compile-only` passed. The coordinated `--run` also passed: both variants rendered all sixteen base poses without empty frames or edge pixels, plus four genuine walking frames; positions and frame sequences matched. Browser errors were empty and Chromium closed. Evidence is in `review/m1-readability-v2/`; the identity mapping is deliberately separate from the neutral comparison images. Technical details are in `review/m1-readability-v2-technical.md`. Temporary entries use `.js` and are cleaned on exit. No builder preference or commercial-parity verdict was recorded.
