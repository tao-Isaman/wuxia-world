# Fresh character-atlas visual review

Date: 2026-09-29. Reviewer: atlas_fresh_critic.

## Independence and scope

The required `.pterminal/shared.md` and `.pterminal/README-agents.md` were read before review. The shared context contains historical implementation and review statements, so this is an independent visual review with limited context, not a strictly blind review. No product source, builder reports, or additional prior review conclusions were consulted. The bounded subject is character integrity and presentation, not whole-game or campaign quality.

After the coordinator's READY signal, I inspected all fifteen browser-rendered comparison PNGs under `character-atlas-audit/`. Each puts the unchanged source sheet beside the normalized engine atlas. I subsequently inspected the new production desktop/phone Qing dialogue captures and the freshly captured character gallery. This review is based on the visible images, not a builder summary. No browser has been launched by this reviewer.

## Reference observations made before output inspection

Inspected all eight supplied Hero's Adventure: Road to Passion screenshots, `baseline/ref-1948980-0.jpg` through `baseline/ref-1948980-7.jpg`, with source URLs recorded in `baseline/reference-1948980.json`.

- Village characters in reference 0 have distinct headwear, hair, robes, and body proportions at their actual scene scale. Facial areas and hands remain separated from dark clothing through simple light clusters.
- References 1, 2, and 7 show consistent head/body construction from different directions. Character detail is selective: hair mass, face, belt, sleeves, footwear, and weapon form coherent large clusters instead of competing fine texture.
- Combat references 3 and 6 show readable bent knees, hands, weapon directions, and open negative space around active limbs. Character outlines survive against textured terrain; large heads and controlled shading support identification.
- Reference 4 distinguishes many nearby characters through silhouette and costume color. The enlarged dialogue portrait is more detailed than the on-map sprite; the small sprite remains readable on its own.

These are observations of the supplied static reference screenshots. They do not establish reference animation quality or frame-to-frame consistency.

## Rendered-output findings

**Extraction integrity: pass for all 304 shown poses.** I examined the complete normalized side of every comparison: eight heroes with 24 poses each and seven supporting characters with 16 poses each. I found no visibly clipped hands, feet, heads, cloth tails, or weapons; no fragment belonging to a neighboring pose; and no unexplained identity or whole-body scale change introduced between the source and normalized images.

All row/column references below are one-based within the normalized atlas. Hero rows 5 and 6 are rear/front directional walking poses. Row 4 includes recoil, defense, raised-arm, and defeated poses.

| Character / evidence | Poses inspected | Specific visual evidence |
| --- | ---: | --- |
| `character-atlas-audit/m1-comparison.png` | 24 | Blue sash/hair tails, fists, sword/scabbard, and separated boots survive normalization. Extended punch R3C3 and kneeling R4C4 remain complete. |
| `character-atlas-audit/m2-comparison.png` | 24 | Exposed arms, wraps, headband tails, and feet remain coherent. R3C3 retains the full extended arm; rear/front rows retain costume identity. |
| `character-atlas-audit/m3-comparison.png` | 24 | Pale robe folds, teal edges, hair ribbon, and back-carried implement remain visible. R3C3 preserves the sleeve/hand outline; kneeling form is complete. |
| `character-atlas-audit/m4-comparison.png` | 24 | Ragged cloak ends and back disk remain part of the correct silhouette. No foreign fragments around the wide punch or leaning recoil. |
| `character-atlas-audit/f1-comparison.png` | 24 | Green ribbons, separated sleeves/hands, boots, and rear hair silhouette remain intact. Front/rear walking rows preserve the same costume. |
| `character-atlas-audit/f2-comparison.png` | 24 | Red tails, bare-leg separation, wraps, and complete punch hand read clearly. The kneeling pose changes height appropriately without losing feet or hands. |
| `character-atlas-audit/f3-comparison.png` | 24 | Pink trim and long hair remain connected to the intended pose; the wide sleeve and thin punch hand are intact. R4C4 preserves the kneeling robe boundary. |
| `character-atlas-audit/f4-comparison.png` | 24 | Bow, quiver, ponytail, and tattered hem remain identifiable across directions. R3C3 and R4C3 have complete extended fists. |
| `character-atlas-audit/bandit-comparison.png` | 16 | Torn tunic, red sash, fists, and boots remain whole through wide combat and kneeling poses. |
| `character-atlas-audit/elder-comparison.png` | 16 | White beard, long sleeves, gold trim, and open palms survive. Wide sleeve in R3C3 and trailing robe in R4C4 are not cut off. |
| `character-atlas-audit/feng-comparison.png` | 16 | Bowl and utensil are retained in idle/walk. Their disappearance in combat is already present in the source, not extraction loss. Hands and hem remain complete. |
| `character-atlas-audit/merchant-comparison.png` | 16 | Ornate robe panels, sleeve openings, moustache, and hands remain consistently positioned. Wide sleeves do not bring adjacent-pose debris. |
| `character-atlas-audit/monk-comparison.png` | 16 | Bald head, yellow sash, wrapped shins, and shoes remain readable. Extended sleeve/hand and defeated pose remain complete. |
| `character-atlas-audit/qing-comparison.png` | 16 | Cap and paper/scroll remain identifiable; open palms and wide seated defeat R4C4 fit without clipped shoes or debris. |
| `character-atlas-audit/wang-comparison.png` | 16 | Broad torso and rounded face remain distinct from the slim merchant. Fan in idle and beads/pendants remain intact; wider sleeves and defeat pose fit. |

The source/normalized comparison shows expected loss of fine costume texture when larger source figures are reduced, especially M3 and F2. It does not show a missing body part. Character identity is strongest through costume color and large accessories: M2's exposed arms, Elder's beard, Monk's bald head/yellow robe, Wang's broad torso, and Qing's cap all read immediately. The women in long pale robes depend more heavily on color and hair/accessories for differentiation.

A numerical cross-check on the rendered PNG cell contents supports the scale assessment. M4's side idle is approximately 108–109 pixels tall and its frontal row is 108–109; F1 is 110 versus 108. Their frontal drawings can look more compact because of body orientation, but the images do not substantiate a meaningful extraction-related height jump. These are approximate screenshot content bounds, not runtime metadata. Raised-arm and crouched/defeated frames intentionally have different total heights.

## Biggest remaining gap against the reference

**Small-scale facial and limb readability is weaker than Hero's Adventure.** Our normalized figures have attractive costume shading and complete silhouettes, but the long-bodied proportions leave relatively little pixel area for faces and hands. Fine cloth highlights compete for attention. M3 and F3 first-row faces, for example, are much less immediately expressive than the nearby NPC faces in `baseline/ref-1948980-0.jpg` at a broadly comparable displayed body height. The reference's larger head shapes, simpler facial clusters, and more deliberate separation between hands, sleeves, and weapons make individual people and combat intent easier to read quickly (`ref-1948980-3.jpg` and `ref-1948980-6.jpg`).

This is an art-direction/presentation gap, not an atlas-slicing defect. Passing the extraction check does not establish reference parity. The useful next improvement is to allocate more of the visible sprite to faces/hands and simplify competing microtexture, then judge at actual world and combat display sizes. It is not necessary to imitate the exact reference proportions to improve those priorities.

## Production scene follow-up

Additional images inspected directly:

- `../test-results/screenshots/qing-ledger-desktop.png` — 1440 × 900 production dialogue/world capture.
- `../test-results/screenshots/qing-ledger-phone.png` — 390 × 844 production dialogue/world capture.
- `wave7-character-gallery.png` — freshly recaptured production gallery despite the historical filename; the visible selected motion is WalkNorth.

**The production scenes confirm the small-scale readability gap.** Qing's cap and pale sleeves, Wang's broad green-and-gold body, the pale-green woman's long costume, and the merchants' color blocks remain recognizable. I see no new per-sprite missing extremity or neighboring-frame fragment in these screenshots. The woman at the phone's far left is partly outside the viewport, which is a camera crop rather than evidence of atlas damage.

Faces in the world are only a few pixels across and convey little individual expression. The dark brown/black figure near the central gate loses some torso and limb separation against shop shadows and the heavily textured pavement. The pale and saturated costumes stand out more successfully. This is not a blanket claim that the characters disappear: position, costume color, and broad silhouette are readable, while facial identity and fine limb distinctions are weaker.

The dialogue portrait repeats a very small full-body sprite, leaving the face especially difficult to read even though the panel has ample presence. Compare with `baseline/ref-1948980-4.jpg`, where a large expressive portrait provides facial detail alongside the simpler on-map sprite. A close character portrait or larger face-focused rendering would improve dialogue identity without requiring larger world actors.

The object beside Qing reads as an ornate warm-colored chest/box in both captures and contrasts with the cool robe and stone. Its specific ledger contents or changed state are not visually obvious at this size; that meaning is supplied by the dialogue text. These stills do not prove that the chest never changes or lacks an interaction response. They only show that the depicted state is not self-explanatory as a ledger/paper payoff.

The gallery shows that the artwork has detail available at larger display size: garment edges, hair ribbons, equipment, and the supporting characters' faces resolve substantially better against the plain background. It also shows a directional presentation limit: with WalkNorth selected, the eight heroes visibly face away while the seven supporting characters remain depicted from the side. That is screenshot evidence of different directional coverage in the gallery, not a claim that a supporting actor is moving incorrectly in the production scene.

The reference and production screenshots use different resolutions and camera framing, so this is a qualitative comparison of the displayed output rather than a controlled equal-pixel-budget test. The strongest supported conclusion remains that our current world/dialogue presentation does not preserve character expression as clearly as the reference.

## Limits

The comparisons and production captures are actual browser-rendered output, but all evidence inspected by this reviewer is static. The atlas establishes the integrity of the shown cells, and the production scenes establish readability against the shown terrain. They do not establish animation cadence, interpolation, foot sliding, directional switching in motion, combat impact, or readability in other scenes. The gallery's selected motion is visible, but one screenshot cannot verify playback. No broad campaign or full-game quality conclusion is made here.
