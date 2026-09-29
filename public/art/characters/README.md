# Animated character sheets

## Active art: readability v2 (adopted 2026-09-29)

Hero's Adventure: Road to Passion is the benchmark: faces, hands and action
silhouettes must read when a character is only 60–70 screen pixels tall. The
twelve `*-readability-v2.png` candidates (m1–m4, f1–f4, elder, monk, merchant,
bandit) plus the four `*-readability-v2-directions.png` supplements (m1, m2, m3,
f1) are now the active sheets: larger faces, visible fists and fewer noisy folds.
Their per-sheet prompts and provenance are in the matching `*-readability-v2*.md`.

- `<id>.png` / `<id>-directions.png` are produced from the v2 source by
  `bun scripts/repack-character-sheet.ts <v2.png> <out.png> [rows]`. The generated
  sources use irregular gutters, and a raised victory fist can rise into the band
  of the row above, so straight cuts fail. The script labels 8-connected alpha
  components (threshold 32, like the loader), clusters them into rows and columns,
  and copies each pose pixel-for-pixel, with no resampling, onto an exact equal
  grid with feet on a shared 88 % baseline. No catalog layout is needed.
- The previous sheets are kept as `<id>-v1.png` / `<id>-v1-directions.png` for rollback.
- m4, f2, f3 and f4 have no v2 north/south supplement yet and still use their v1
  `-directions.png`. The loader calibrates them to the v2 standing height. This is
  the remaining visual mismatch in the set.
- Wang, Feng and Qing are unchanged and keep their measured layouts in `lib/characters/catalog.ts`.
- Verify: `node --experimental-strip-types scripts/render-character-atlas-audit.ts`
  with the production build on port 3017 (all 304 poses, no clipping).


## Additional NPC archetypes

Four additional sheets — elder.png, monk.png, merchant.png, bandit.png — use the same 16-frame layout and built-in generation tool. Existing NPC body images were identity references. Each uses the shared prompt in “Prompts for the other six sheets” with the following subject:

- elder (reference: public/npcs/body/elder.png): An elderly wuxia scholar with long white beard and grey topknot, deep indigo outer robes and sage green inner robe, muted gold trim, brown shoes. Gentle dignified face, adult proportions. No hand-held staff.
- monk (reference: public/npcs/body/sect_shaolin_disciple_xuanji.png): A shaved-head male Shaolin monk, saffron orange layered robes over cream cloth, brown prayer beads, pale wrapped calves and dark cloth slippers. Calm disciplined expression, compact martial stance.
- merchant (reference: public/npcs/body/city_capital_merchant_wang.png): A middle-aged Chinese merchant, small black mustache and bun, emerald green brocade robe with ochre inner tunic, russet belt and hanging coin pouch, brown shoes. Remove the market stall and packages, only character body.
- bandit (reference: public/npcs/body/thug.png): A rough young male bandit with black dishevelled ponytail, charcoal-grey and brown ragged martial clothes, crimson sash and wristwraps, dark brown boots. Empty hands, no weapon, threatening expression.

Generated with the built-in imagegen tool, using the existing player images as identity references. Originals are preserved in the local generated-images directory. Files m1.png–m4.png and f1.png–f4.png cover all eight selectable characters.

Each sheet has four columns and four rows: idle 0–3, walking 4–7, attack 8–11, hurt 12, guard 13, victory 14, defeat 15. The renderer normalizes transparent padding onto 128-pixel frames, uses one scale for the whole sheet, and grounds feet on the same baseline. Native artwork is preserved. NPCs use costume archetypes; their unique authored portraits and dialog art remain.

## Prompts for m1 and f1

Use case: stylized-concept. Asset type: production animated character spritesheet for an existing Thai wuxia Phaser RPG. Use the input image only as a character identity and clothing reference. Completely redraw as authentic detailed 32-bit-era pixel art: clearly visible square pixel clusters, hand-placed stepped contours, limited coherent color ramps, crisp dark outlines, fabric folds made of pixel clusters. Never smooth illustration, vector art, painted shading or antialiasing.
Produce ONE transparent PNG sheet on an EXACT 4-column by 4-row equal-cell grid, 16 full-body poses of the SAME character. No grid lines, text, labels, numbers, shadows, scenery or other characters. Each cell has identical dimensions; character pelvis centered horizontally, feet on an identical baseline 88% down the cell. Consistent head size, body height and costume across every frame. Leave 12% transparent margins inside each cell; no limb or cloth crosses cell boundaries. Character always faces RIGHT in a three-quarter side view. Native sprite appearance about 64 pixels wide by 112 pixels tall, enlarged with nearest-neighbor pixels within each cell. Normal adult proportions, not chibi.
Rows, top to bottom; each row reads left to right:
Row 1: four distinct subtle IDLE breathing frames, relaxed fighting stance, slight sleeve and hair movement.
Row 2: four WALK cycle frames, left leg forward, passing pose, right leg forward, passing pose; clearly different legs and counter-swinging arms, feet aligned.
Row 3: four unarmed martial-arts ATTACK frames: guard anticipation, draw fist back, fully extended straight punch to the RIGHT, recover. Keep any sword or bow sheathed on the back/hip.
Row 4: recoil HIT pose leaning back left; firm two-arm GUARD pose; VICTORY raised fist; DEFEAT kneeling with bowed head. The kneeling frame must stay on the same ground baseline.
Exact 16-cell layout is critical because game code will slice it directly. Real alpha transparency, no checkerboard baked into image.

- m1: Young male swordsman in cobalt blue robes with pale blue inner tunic, brown waist belt, black high ponytail and dark boots.
- f1: Young female swordswoman in jade-green and ivory robes with jade sash, long black ponytail, jade hair ribbon and dark boots.

## Prompts for the other six sheets

Use case: stylized-concept. Production animated character spritesheet for an existing Thai wuxia Phaser RPG. Use the input image only as character identity and clothing reference. Completely redraw as authentic detailed 32-bit-era pixel art: visible square pixel clusters, stepped contours, limited coherent color ramps, crisp dark outlines and pixel-cluster fabric folds. No smooth illustration, vector art, painted shading or antialiasing.
ONE transparent PNG sheet, EXACT 4-column by 4-row equal-cell grid, 16 full-body poses of the SAME character. No grid lines, text, labels, numbers, shadows, scenery or extra characters. Identical cell sizes, body height and costume; pelvis centered, feet baseline 88% down every cell. Leave 12% transparent margins inside cells. Always faces RIGHT, three-quarter side view. Native sprite appearance about 64 pixels wide by 112 pixels tall, enlarged with nearest-neighbor pixels. Adult proportions, not chibi.
Rows top to bottom, left to right:
Row 1: four distinct subtle IDLE breathing frames; sleeve/hair movement.
Row 2: four WALK cycle frames: left leg forward, passing, right leg forward, passing; clearly different legs and counter-swinging arms.
Row 3: four unarmed ATTACK frames: guard anticipation, draw fist back, fully extended straight punch RIGHT, recover. Sword/bow stays sheathed.
Row 4: HIT recoil leaning left; firm two-arm GUARD pose; VICTORY raised fist; DEFEAT kneeling bowed head. Kneeling feet stay on the same ground baseline.
Exact 16-cell grid is critical; game code slices directly. Real alpha transparency, no baked checkerboard.

- m2: Athletic muscular male martial artist, sleeveless ochre and amber tunic, russet headband, brown shorts and tall leather boots, wrist wraps.
- m3: Elegant young male wandering swordsman in ivory-white and pale mint robes, jade sash, long black high ponytail, white boots, sheathed sword.
- m4: Weathered adult male traveller with short beard, charcoal and warm brown layered robes, leather belt, muted moss shoulder cape and brown boots.
- f2: Athletic young female martial artist in vermilion and orange tunic over dark shorts, red head ribbon, long black ponytail, leather boots and wrist wraps.
- f3: Elegant young female martial artist in ivory-white and pale pink layered robes, rose sash, long black hair with a pink blossom, white boots.
- f4: Young female huntress in charcoal grey and brown travel robes, moss green sash, long dark ponytail, brown boots, bow and quiver on her back.

## Directional walking supplements

All eight heroes also use `{id}-directions.png`: four north/back-view frames followed by four south/front-view frames. The browser combines the original sixteen poses and eight directional poses into a four-column, six-row 128-pixel atlas. Each source sheet is calibrated once to the same standing height; foot baselines remain fixed. NPC archetypes retain their sixteen-pose atlas. The gallery substitutes horizontal walking for NPC directional previews.

Generated using the built-in imagegen tool with the matching original sixteen-pose sheet as the identity and style reference. Actual browser compositing and alpha samples verify transparency. Three extraction experiments were inspected but not selected; the original eight supplements are used.

### Shared directional prompt

Use case: stylized-concept. Create a supplemental movement spritesheet for the SAME wuxia game character in the reference sheet. Reference is identity, costume and PIXEL STYLE only. Detailed 32-bit pixel art, clear hard square pixel clusters, stepped outlines, limited color ramps, adult proportions, no smooth painted shading.
EXACT 4 columns by 2 rows, EIGHT equal cells on a transparent PNG. All cells have the same size, feet at the same baseline 88% down each cell, identical head/body size throughout, 12% transparent margin, no touching cell edges. Nothing else: no text, lines, labels, background, shadows, scenery or weapons in hands.
TOP ROW four NORTH/up walking frames, BACK VIEW walking away from viewer toward the top of the screen: left-leg step, passing, right-leg step, passing. Show back of head and ponytail; no face visible. Arms counter-swing and cloth shifts.
BOTTOM ROW four SOUTH/down walking frames, FRONT VIEW walking toward viewer toward bottom of screen: left-leg step, passing, right-leg step, passing. Symmetric front-facing torso with readable face, hands and feet. Slight elevated RPG camera view, not profile.
Do not put any side-facing sprites in this sheet. Keep the same costume, hair, accessories and crisp pixel density as the reference. These exact eight frames will be sliced for real directional animation in a Three.js RPG. Actual alpha transparency.

- m1: Young male swordsman in cobalt blue and pale blue robes, brown belt, high black ponytail, blue ribbon.
- m2: Muscular male fighter in sleeveless ochre tunic, brown shorts, russet headband and leather boots.
- m3: Young male wandering swordsman in ivory and mint long robes, jade sash, black ponytail.
- m4: Bearded male traveller in charcoal and brown layered robes, leather belt, moss shoulder cape.
- f1: Young female swordswoman in jade-green and ivory robes, jade sash, black ponytail, green ribbon.
- f2: Young female fighter in vermilion/orange tunic and dark shorts, red ribbon and leather boots.
- f3: Young female martial artist in ivory and pale pink robes, rose sash, flowing black hair and pink blossom.
- f4: Female huntress in charcoal and brown travel robes, moss sash, black ponytail, bow/quiver on back.
