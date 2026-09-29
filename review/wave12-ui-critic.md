# Wave 12 UI critique (vs. Hero's Adventure: Road to Passion)

## 1. Verdict

Wave 12 is a clear step up from `before/`. It replaces the cream web popups (`before/desktop-11-menu-1.png`) and the boxed HUD (`before/desktop-03-capital.png`) with a single dark-jade and gold skin. It also adds a status HUD with a portrait, a zodiac clock dial with a day badge (as in ref-1/ref-2), a round icon dock, a full-screen top-tab menu (the ref-12 pattern) and a visual-novel dialogue box with a nameplate tab and portrait (ref-4/ref-9). Those are the right structures, and the build is now roughly **65–70 % of the way to the reference's UI polish**. What remains is mostly surface work: iconography (placeholder CJK glyphs and system emoji), the type scale (tiny monospace numbers), empty states that read as unfinished, a thin battle command UI, and fit problems at 844×390 landscape.

## 2. Remaining gaps (most impactful first)

| # | Screen | Problem (evidence) | Reference does | Small fix |
|---|---|---|---|---|
| 1 | Bag / Shop | Items are single CJK glyphs in coloured squares (兵 兵 藥 藥 材 材), with no names. Duplicates can only be told apart by border colour (`desktop-11-menu-1`, `phone-11-menu-1`, `desktop-21-service`). | Pixel-art item icons with the name in rarity colour next to them (ref-13). | Put the item name under each tile, rarity-coloured. Auto-select the first item so the detail pane is never empty. Later, swap the glyphs for 32px sprites. |
| 2 | Battle | The commands are only three ~64px circles. There is no Item, Flee or Auto control, and the log is a tiny "บันทึกการต่อสู้ (2)" at bottom-left with its "+" at the far right (`desktop-40-battle`). | Large ~100px skill rings, a right-side rail (Rest, Hidden Weapon, Item, RETREAT) and Auto/x2 (ref-3, ref-6, ref-14). | Scale the rings to about 88px. Add a vertical rail on the right for Item and Flee. Dock a 3-line log above the rings. |
| 3 | Battle | The turn-queue portraits are about 28px and nearly identical, with no side colouring (`desktop-40-battle`, `phone-40-battle`). | A labelled timeline bar with blue-bordered portraits and an "Action" callout (ref-3). | Border the player's portraits indigo and the enemy's vermilion, enlarge the next actor, and label it "ถัดไป". |
| 4 | HUD | The HP/MP/stamina numbers are about 9px monospace ("36/36"), the bars are about 4px tall, and the labels 血/氣/力 are Chinese only (`desktop-03-capital`). | A 22px label and a thick bar per status (ref-1, ref-8). | Show the numbers in 13–14px Sarabun tabular figures, make the bars 6–8px, and add Thai tooltips or micro-labels. |
| 5 | HUD clock | The Thai time of day is gone: the dial shows only "午" and "วันที่ 1" (`desktop-03-capital`). Before, it read "วันที่ 1 · ยามเช้า" (`before/desktop-03-capital`). | The dial carries a readable time caption, "Wu Shi (12:15 PM)" (ref-2). | Print "ยามเที่ยง" under the 午 hub or inside the day pill. |
| 6 | Iconography | System emoji clash with the pixel icons: 🏪 with a "24" convenience-store sign (`desktop-21-service`), 🥷 on the steal action (`desktop-20-npc`), 🎒👤📋🛏📜 on popup headers, and ⛏🪓🎣🎵 on life-skill rows (`desktop-13-menu-3`). | One consistent drawn icon set (ref-1 action bar, ref-3 rail). | Reuse the dock's pixel icons in the popup headers. Replace the emoji with monochrome line glyphs. Remove 🏪 now. |
| 7 | Menu empty states | Quests, Sect, Rest and Log each show one italic line in a 360px empty box (`desktop-14`…`desktop-17`). | Empty slots are drawn as silhouettes with "Empty slot" / "+ Select…" (ref-12). | Show a ghosted illustration and a call to action (e.g. "ไปพบหมอหลินที่นครหลวง"), and shrink the panel height to fit its content. |
| 8 | Dialogue | The body text is about 15px, and the speaker name is repeated above every line even though the nameplate tab already shows it. The portrait sits in a hard black box (`desktop-22-dialogue`). | Body text around 19px at this scale, the name only on the tab, and a cut-out portrait that overlaps the frame (ref-4, ref-9). | Drop the per-line names, raise the body to 18px, and remove the portrait's black background so it breaks the frame. |
| 9 | Profile | Stat labels are opaque abbreviations (PA, IA, PD, ID, Eva, Acc, Cri, Res) with 7px "0/50" XP text (`desktop-10-menu-0`). | Full stat words with explanatory lines (ref-12 tooltip). | Use Thai labels (e.g. "โจมตีกาย") with the abbreviation greyed, and make the XP captions at least 11px. |
| 10 | Skills | The slot editor looks like a web form: a native-style select with chevrons, underlined names that look like hyperlinks, and a red text-link "ลืม" (`desktop-12-menu-2`). | A skill card with the icon, tier colour and "Forget" as a framed button (ref-12). | Replace the select with a slot-click picker, remove the underlines, and make "ลืม" a ghost button that asks for confirmation. |
| 11 | NPC popup | The Steal card has a highlighted background, so a harmful action looks pre-selected. The name appears twice, and the quest list is cut off with no scroll cue (`desktop-20-npc`, `phone-20-npc`). | Contextual actions are equal-weight (ref-2 Stealth / Battle bar). | Use the neutral style for Steal plus a vermilion "เสี่ยง" tag, add a fade at the bottom of the list, and drop the header name. |
| 12 | Map markers | Six identical crossed-sword badges plus arrow squares crowd the capital (`desktop-03-capital`). | The map is sparse: green NPC names and contextual prompts only (ref-8, ref-11). | Show service badges only within about 3 tiles of the player, or on hover. |

## 3. Regressions and bugs

- **`landscape-30-encounter.png`**: the modal is taller than the 390px viewport. The Fight/Flee buttons are clipped at the bottom edge and the footer hint is missing.
- **`landscape-22-dialogue.png`**: the choices are entirely below the fold behind "เลื่อนลงเพื่ออ่านต่อ…". The nameplate tab also overlaps the "นครหลวง" subtitle.
- **`landscape-00-start.png`**: the title block's tagline is cut at the bottom edge, and the Start CTA is off-screen.
- **`landscape-03-capital.png`**: the HUD panel covers the map's NPC labels along the top edge. The "WASD / ลูกศร" keyboard hint appears on a touch-sized viewport, while `phone-03` correctly shows "แตะพื้นเพื่อเดิน".
- **`phone-03-capital.png`**: NPC labels clip at the viewport edges ("…อหลิน" on the left, "เฟิ่งเจ้าของร้านบะห…" on the right).
- **`phone-10-menu-0.png`**: the trait headers break Thai words mid-word ("ความหยิ่ง/ยโส", "ความถ่อม/ตน"), and the values are cut at the panel bottom.
- **`phone-10` … `phone-13`**: the first tab label "โปรไฟล์" is truncated, and all tab labels are about 9px.
- **`phone-22-dialogue.png`**: the floating portrait overlaps the map's "หมอหลิน" name label.
- **`phone-21-service.png`**: the category chip wraps under the name on some rows only, so row heights are uneven. The last row is cut with no fade.
- **`desktop-01-home.png`, `desktop-02-route.png`**: the exit arrow marker is half-hidden between the hint pill and the dock.
- **`desktop-10` … `desktop-17`**: the gold corner brackets (top-left and bottom-right) sit about 5px outside the panel frame and look misregistered.
- **`phone-11-menu-1.png`**: the category tabs wrap, leaving "อาหาร" alone on a second row.
