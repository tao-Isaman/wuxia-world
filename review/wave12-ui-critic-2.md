# Wave 12 UI critique, second pass (wave12g vs. Hero's Adventure)

All screenshot names below are in `review/ui-evidence/wave12g/`.

## 1. Status of the first-pass findings

| # | Item | Status | Proof |
|---|---|---|---|
| 1 | Bag / shop glyph icons | PARTLY | `desktop-11-menu-1`: names now appear under the tiles in rarity colour, and the detail pane is auto-selected. The icons are still CJK glyphs (兵 藥 材), in `desktop-21-service` too. |
| 2 | Battle commands | PARTLY | `desktop-40-battle`: the rings are about 84px. There is still no Item / Flee / Auto rail, and the log is still a 10px line at the bottom-left with its "+" at the far right. `landscape-40-battle` has a good right-hand command list. |
| 3 | Turn queue | FIXED | `desktop-40-battle`: the portraits are indigo or vermilion, the next actor is enlarged and labelled "ลงมือ". |
| 4 | HUD numbers and bars | OPEN | `desktop-03-capital`: the numbers are about 11px, the bars about 5px, and the labels are still Chinese-only (血 氣 力). |
| 5 | Clock caption | PARTLY | `desktop-03-capital`, `desktop-30-encounter`: "ยามอู่ · ยามเที่ยง" is back, but it is about 9px of plain text over the map and hard to read. |
| 6 | Emoji iconography | PARTLY | The tabs and popup headers use pixel icons, and 🏪 is gone (`desktop-21-service`). Emoji remain on the life-skill rows (`desktop-13-menu-3`), on Greet / Steal and 🟡 in the NPC popup (`desktop-20-npc`), and on the rest rows (`desktop-16-menu-6`). |
| 7 | Empty states | PARTLY | `desktop-14`, `desktop-15`, `desktop-17` now have a ghost glyph and a call to action. The panels are still a fixed ~360px, so about 60 % of each is empty. |
| 8 | Dialogue | PARTLY | `desktop-22-dialogue`: the per-line names are gone and the body is about 18px. The portrait still sits in a hard black box instead of breaking the frame. |
| 9 | Profile labels | PARTLY | `desktop-10-menu-0`: Thai labels now come with a greyed abbreviation. The "0/50" XP captions are still about 9px monospace. |
| 10 | Skills editor | PARTLY | `desktop-12-menu-2`: a ring slot bar with "+ ว่าง" has been added. The native-style select with chevrons is still there, and "ลืม" is a tiny red box. |
| 11 | NPC popup | PARTLY | The name now appears once (`desktop-20-npc`). Steal still has a lighter, pre-selected-looking background, and the quest list is cut off with no fade. |
| 12 | Map markers | PARTLY | `desktop-03-capital`: the far badges are dimmed. Six crossed-sword badges still line the shop row. |
| R | Landscape encounter clipped | FIXED | `landscape-30-encounter` |
| R | Landscape dialogue choices below fold | FIXED | `landscape-22-dialogue` |
| R | Landscape start CTA off-screen | OPEN | `landscape-00-start`: the tagline fits, but "เริ่มเกมใหม่" is still below the fold. |
| R | Landscape HUD covers labels, WASD hint | OPEN | `landscape-03-capital`: the HUD still covers a top label, and it still says "WASD / ลูกศร". |
| R | Phone NPC labels clip at edges | FIXED | `phone-03-capital` |
| R | Phone trait headers break mid-word | UNVERIFIED | The trait section is not in the frame in `phone-10-menu-0`. |
| R | Phone tab labels truncated / 9px | FIXED | `phone-10-menu-0`: two rows of 4 tabs, about 12px. |
| R | Phone dialogue portrait overlaps a label | FIXED | `phone-22-dialogue` |
| R | Phone shop uneven rows, last row cut | OPEN | `phone-21-service`: the chip wraps on rows 2–3 only, and there is no fade at the bottom. |
| R | Exit arrow hidden by the dock | PARTLY | Clear in `desktop-02-route`. It still grazes the top of the dock in `desktop-01-home`. |
| R | Corner brackets misregistered | OPEN | `desktop-11-menu-1`, `desktop-14-menu-4`: the top-left and bottom-right brackets still sit off the frame. |
| R | Phone bag tabs wrap | OPEN | `phone-11-menu-1`: "อาหาร" is alone on the second row. |

## 2. New problems

- **`landscape-20-npc.png`**: the portrait banner and description fill the modal, so Greet, Steal and the quests are entirely below the fold with no scroll cue.
- **`landscape-10-menu-0.png`, `landscape-11-menu-1.png`**: the hero card and the equipment strip take up the whole 390px height. The stats and the "ติดตั้ง" button are off-screen, with no fade.
- **`phone-40-battle.png`**: the header wraps mid-phrase ("เลือกกระบวน / ท่า"), and the battle log is still a 10px footer.
- **`desktop-40-battle.png`**: about 60px of empty band separates the arena from the rings, which makes the command area feel detached.
- **`desktop-01-home.png`**: an unlabelled clipboard square floats under the clock and does not match any HUD element.
- **`landscape-03-capital.png`**: the HUD drops the max values ("36" instead of "36/36"), so HP no longer reads as a fraction.
- **`phone-03-capital.png`**: the "นครหลวง" location pill is jammed under the HUD edge, and "พ่อค้าหวัง" and "เถ้าแก่โจวตลาดมืด" are stacked with no gap between them.

## 3. Overall

**About 74 %** toward the reference UI bar, up from 65–70 %.

The structural fixes landed. The turn queue now reads like ref-3. The skill slots borrow ref-12's ring and "+" grammar. The tabs and headers share one pixel icon set. Thai-first stat labels, empty states with a call to action, and the landscape encounter and dialogue fixes remove the most amateur-looking moments. What keeps the build below 80 % is the layer the reference gets right everywhere:

- **Real item art.** The CJK glyph tiles remain.
- **Readable HUD figures.** The 9–11px numbers and thin bars remain.
- **A complete battle control set.** There is still no Item / Flee / Auto rail and no readable log.
- **One icon language.** Emoji linger in the life-skill, NPC and rest rows.

Landscape is also still the weakest orientation: the start, NPC, profile and bag screens all hide their primary action below the fold. Fixing the HUD type, the battle rail and the landscape scroll affordances would push the build past 80 %.
