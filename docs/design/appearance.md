# Outfits and weapons on the body — design

How the hero's look changes with what they wear and carry: **outfits** (ชุด) chosen in a wardrobe, and the **equipped weapon** slung on the body on the map. Other players see both online.

## What other games do (research, 2026-10-12)

| Approach | Who | Cost | Taken here |
| --- | --- | --- | --- |
| Paper doll: the body cut into layers (head, chest, legs, back, weapon), each item drawn for every frame and facing; a draw-order table per facing | Soulbound, Stardew Valley, Diablo II (per-direction layer priority), Daggerfall | every item × animation × facing (× body type) drawn by hand; the base animation must be locked first | no: our heroes are whole PixelLab sheets, not layers |
| Weapon pinned to an anchor point per frame (the hand, the back), drawn in front of or behind the body by facing | RPG Maker battlers, Construct / GDevelop / Spriter action points | one weapon image per weapon, anchor data per frame | **yes**, the anchor read from each frame's own pixels |
| Whole-outfit sheets, appearance apart from stats (transmog, vanity slots, a wardrobe that keeps what was once unlocked) | Dragon Quest XI costumes, Terraria vanity slots, Diablo 4 wardrobe, Where Winds Meet (and its hide-weapon toggle) | one sheet per outfit, or none with a recolour | **yes**: a wardrobe apart from equipment, a hide-weapon toggle |
| Palette swap / gradient map: one sheet, many colourways (tiers, dyes) | classic consoles, Undertale Yellow's palette shader, Unity PaletteFX | none per variant | **yes**: every outfit is a recolour of the hero's own sheet |
| A fixed look | Octopath Traveler (job outfits only in battle) | none | the starting outfit |

Sources: [Soulbound](https://soulbound.game/news/how-we-built-a-pixel-art-character-and-cosmetic-system/), [Stardew Valley farmer sprite](https://stardewvalleywiki.com/Modding:Farmer_sprite), [Daggerfall paper doll](https://www.dfworkshop.net/items-part-3-paper-doll/), [MergeDCC (Diablo II layers)](https://www.allegro.cc/depot/MergeDCC), [RPG Maker weapon graphic](https://rpgmakerweb.com/blog/making-a-custom-battle-weapon-graphic), [Terraria armor](https://terraria.wiki.gg/wiki/Armor), [Diablo 4 transmog](https://www.techradar.com/features/diablo-4-transmog-is-something-final-fantasy-14-should-learn-from), [Where Winds Meet: hide weapons](https://allthings.how/how-to-hide-your-bow-and-weapons-in-where-winds-meet/), [Undertale Yellow palette shader](https://undertaleyellow.wiki.gg/wiki/Technical:Palette_Shader), [paper doll trade-offs](https://gamedev.net/forums/topic/622607-2d-action-game-sprites-paper-doll-equipment-or-custom-characters-with-unchanging-appearance/).

## Why recolours and icons

The heroes (m1, f1) are single PixelLab sheets (`/art/characters/pl/<id>.png`: walk, idle, stance, attack, hurt, victory, defeat), not layers, and PixelLab has 276 generations left until 2026-11-04 — a new animated outfit costs about 50. So:

- **An outfit is a recolour of the hero's own sheet**, done in the browser when the sheet loads (`lib/characters/outfit-recolor.ts`): every animation, on the map, in battle and in cutscenes, wears it at no art cost.
- **A weapon on the body is the equipped weapon's own icon** (`ico_weapon_*`, 36–48 px), scaled and slung across the back on the map, so each weapon looks like itself.

## Outfits

### The recolour

Each hero's clothing is two colour classes, read from its own pixels (HLS):

| Hero | `primary` (the coloured robe) | `secondary` (the light cloth) |
| --- | --- | --- |
| m1 | hue 170–260°, saturation ≥ 0.06, lightness ≥ 0.08 (the blue robe) | saturation < 0.12, lightness ≥ 0.55 (the white under-robe) |
| f1 | hue 40–190°, saturation ≥ 0.03, lightness 0.15–0.97 (the pale green robe) | saturation < 0.03, lightness ≥ 0.55 (the white) |

An outfit gives a target `[hue, saturation, lightness]` per class. A pixel keeps its shading: its saturation is scaled by how far it sits from the class's reference saturation, and its lightness moves by the difference from the class's reference lightness. Skin (hue around 20–35°, saturated) and dark hair, belts and outlines are in no class and stay as drawn. The top 17 % of each figure (the head) is left alone, so hair highlights and ribbons keep their colour. Colours are cached per source colour, so a sheet recolours in a few tens of milliseconds.

### The outfits

| Outfit | Unlocked by |
| --- | --- |
| ชุดเดิม (the hero's own) | always |
| the uniform of the hero's own sect (one per joinable sect: saffron Shaolin, grey-white Wudang, rose Emei, …) | being its disciple now (active): the wardrobe lists only the own sect's uniform, never another sect's, and a former disciple (resigned or betrayed) no longer wears it. Shaolin takes men and Emei women only (their join rules' `gender`), so an edited save cannot dress the other gender in them |
| six tailor's outfits (ชุดผ้าไหมแดง, ชุดหมึกดำ, ชุดคราม, ชุดเขียวหยก, ชุดขาวไว้ทุกข์, ชุดขุนนางทอง) | bought from a tailor in any city (`city_…`), 300–3,000 ตำลึง; kept for good |
| ชุดยอดฝีมือ (champion's gold) | winning the sword tournament once |

The wardrobe lists ชุดเดิม, the own sect's uniform, the tailors' outfits (to buy or held) and the champion's; what was bought is saved (`wardrobe`), the rest follows from the save (the sect membership, the tournament history).

## The weapon on the body

- **Which:** the equipped weapon (slot W). Its family comes from its icon: `jian_sword` → กระบี่, `dao_sabre` → ดาบ, `spear` / `staff` → อาวุธยาว, `fan_weapon` → อาวุธสั้น, `hidden_weapons` / `whip_chain` → อาวุธลับ, `instrument` → เครื่องดนตรี, bracers → หมัด.
- **Where:** อาวุธยาว, ดาบ and เครื่องดนตรี diagonally across the back; อาวุธสั้น at the waist; หมัด, อาวุธลับ and กระบี่ not drawn (the hero's own sheathed jian is already on the sheet, and hidden weapons are hidden).
- **Size:** a share of the standing figure's height (อาวุธยาว 0.95, ดาบ 0.55, เครื่องดนตรี 0.5, อาวุธสั้น 0.3).
- **Anchor:** each frame's opaque box (measured once per sheet): the mid-back point at 38 % down the figure, shifted toward the back for side views. It follows the body's bob.
- **Draw order by facing** (Diablo II's per-direction priority): facing the viewer (S, SE, SW) and in profile (E, W) the weapon is behind the body; facing away (N, NE, NW) in front of it. Facing west mirrors it.
- **ซ่อนอาวุธ** hides it (saved), like Where Winds Meet.
- Battle keeps the hero's sheet as drawn (the attack draws the jian); the outfit's colours apply there too.

## Online

Every player's look is part of their presence: protocol 3 adds `outfit` and `weapon` to `hello` and the `Presence`, and a `look { outfit, weapon }` command that answers with a `looked { id, outfit, weapon }` event, so others see a change at once without the room being rejoined. The server checks only the shape (`[a-z0-9_]{1,32}` for an outfit, `[A-Za-z0-9_]{1,48}` or nothing for a weapon) and at most 2 looks a second; it does not check that the outfit was earned (it is only a look).

## Save

Version 29 adds `appearance: { outfit, hideWeapon }` and `wardrobe: string[]` (bought outfits). An unknown outfit falls back to ชุดเดิม on load; one no longer unlocked (a betrayed sect's uniform) too.

## Not in this round

- Per-weapon battle animations (the attack is one jian slash for every family): 7 families × 2 heroes ≈ 130 generations.
- New outfit shapes (armour, hats, cloaks): a PixelLab state and its clips per outfit, ~50 generations each.
- Dyes chosen by the player (the recolour takes any colour, the UI offers the set list only).
