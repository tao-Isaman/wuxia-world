# Gameplay guide

Every system as the player meets it, with the numbers the code uses. Engine details live in:

- [world-engine.md](world-engine.md) — scenes, quests, encounters, law
- [grid-combat.md](grid-combat.md) and [combat.md](combat.md) — battles
- [liveness.md](liveness.md) — NPC simulation and rumors

The content itself (every place, NPC, quest, item) is listed in the [generated reference](reference/README.md).

Time in this game is counted in **ชั่วยาม**: 12 of them make one day, so one ชั่วยาม is two hours of story time.

## Contents

- [Starting a game](#starting-a-game)
- [The screen and controls](#the-screen-and-controls)
- [Time, stamina, HP and MP](#time-stamina-hp-and-mp)
- [Travel](#travel)
- [Random encounters](#random-encounters)
- [Battles](#battles)
- [NPCs](#npcs)
- [Quests and tracking](#quests-and-tracking)
- [The sword tournament](#the-sword-tournament-ชุมนุมวิจารณ์กระบี่)
- [Sects](#sects)
- [Shops, sect halls and artisans](#shops-sect-halls-and-artisans)
- [Life skills and gathering](#life-skills-and-gathering)
- [Items and equipment](#items-and-equipment)
- [Progression](#progression)
- [Stats](#stats)
- [Traits and reputation](#traits-and-reputation)
- [Bad actions](#bad-actions)
- [The law and the jail](#the-law-and-the-jail)
- [Rumors](#rumors)
- [Saving, game over and starting again](#saving-game-over-and-starting-again)
- [Known gameplay gaps](#known-gameplay-gaps)

## Starting a game

The title screen asks for three things:

- a name (1–24 characters; empty becomes "ผู้กล้า");
- a gender (ชาย / หญิง), which some sects require;
- one of four bodies per gender (`m1`–`m4`, `f1`–`f4`).

A new hero starts at home (`home_player`, คฤหาสน์ตนเอง) on day 1 at ยามเหม่า, with:

| | Start |
| --- | --- |
| Stats | 1 in each of the eight |
| HP / MP | 36 / 10 |
| Stamina | 100 / 100 (the maximum never grows) |
| Gold, w-exp | 0 |
| Move skills | หมัดตรง (`basic_punch`), level 1, in slot 1 |
| Inner arts, recipes, sects | none |

Home has three exits:

- ทางออกจากบ้าน to the capital (นครหลวง);
- ตรอกบ้าน to a neighbour's house;
- ทางขึ้นเชิงเขา to the foothill tutorial village (listed in the "อื่น ๆ" drawer).

The tutorial village holds the only main quest, ก้าวแรกสู่ยุทธภพ (`first_steps`), which the village elder starts.

A typical first session in the capital:

1. **Clinic errand.** Physician Lin's supplies run (เสบียงยาของคลินิก: Lin → magistrate Wu → Lin) pays 80 gold, 3 herbs and 20 w-exp.
2. **Free training duel.** The capital hall (🏯) offers a free, non-fatal duel against the apprentice อาเฉิง. It can be won once.
3. **First upgrade.** Spend the w-exp on your first skill upgrade in the วิชา menu.

## The screen and controls

**On a map:**

| Input | Does |
| --- | --- |
| WASD / arrow keys | walk (keyboard) |
| click / tap on the ground | walk there (path-finding around walls) |
| drag on the left half of the screen (touch) | floating joystick |
| click / tap a person or sign | walk to it and use it |
| E, or the round action button | use the nearest marker within reach |
| จุดหมาย + | a list of everything on this map, in tabs: บุคคล · เส้นทาง · สถานที่ · กิจกรรม |
| 1–7 | open a menu section (desktop) |

**HUD:**

- **Top left:** the icon bar — 1 โปรไฟล์, 2 ย่าม (bag), 3 วิชา (skills), 4 อาชีพ (life skills and crafts), 5 ภารกิจ (quests), 6 สำนัก (sect), 7 บันทึก (action log), ♪ sound, and the install button.
- **Top right:** gold (ตำลึง), w-exp (悟), the sundial, the day, and the tracked quest (📌).
- **Top centre:** wanted marks and the jail sentence, when you have any.
- **Bottom right:** พัก (rest), and above it the action button (คุยกับ / ไปที่ / ใช้ + the target's name).
- **Arrival:** entering a location shows its name as a banner. Saving is automatic and continuous.

**Pauses.** The world pauses while any dialog, menu, confirm box or busy overlay is open.

- The busy overlay shows the hero at work and a progress bar for gathering, crafting, practice, rest, jail work and stealth.
- It blocks taps until it finishes.

**Encounters:** F or Enter fights, Esc flees. **Dialogue:** choices are numbered, and Esc leaves when leaving is allowed. Battle keys are in [grid-combat.md](grid-combat.md#battle-ui).

## Time, stamina, HP and MP

### What things cost

| Action | Time (ชั่วยาม) | Stamina |
| --- | --- | --- |
| step from a place onto a road | 1 | 10 |
| step from a road into a place | 2 | 10 |
| gather, start a hunt, craft, use an item, play music, steal / assassinate / kidnap attempt | 0.2 | gather: the node's cost (5–25); others 0 |
| a finished battle (win, loss or retreat) | 0.5 | 5 |
| practise a skill or art | 6 | 30 |
| rest | 12 (a full day) | — |
| a quest objective spot | 1 (some 2 or 4) | 0 |
| buy, sell, equip, level up, talk, start a spar | 0 | 0 |

Night falls from about the 8th ชั่วยาม. It only changes the lighting, the sundial and the music.

### Resting

The พัก button offers what the place allows. Every rest takes 12 ชั่วยาม and restores stamina, HP and MP by the same fraction of their maximum:

| Where | Choice | Cost | Restores |
| --- | --- | --- | --- |
| cities (`city_*`) and inns (`inn_*`) | 🍵 พักโรงเตี๊ยม | 300 gold | 100 % |
| temples and palaces | 🏛 พักที่วัด / พักในลานวัง | free | 50 % |
| anywhere, including the above | 🌿 พักริมทาง | free | 25 % |

There is no passive regeneration. HP and MP carry from fight to fight. Other ways to recover:

- healing items;
- jail meditation;
- release from jail, which lifts HP and MP to at least 60 %.

## Travel

- **Exits.** Each location map has exits (signs with an arrow) on the side facing where the road goes: a place to the east is reached by the right-hand edge. Taking one puts you on the road (a painted route map, or a plain card for a few old roads), where you pick a destination or turn back.
- **Directions.** The road runs the way you left: leave by the right edge and you walk from left to right along it, then arrive on the left side of the next place, beside the exit back.
- **Cost.** A full hop from place to place costs 20 stamina and 3 ชั่วยาม, and trains AGI (see [Stats](#stats)).
- **Tired.** Below 10 stamina, exits are disabled until you rest.
- **Free warps.** Story warps (a dialog that sends you somewhere) and "ปิด" back to the last place are free.
- **The map.** 102 locations and 128 two-way roads; see [reference/locations.md](reference/locations.md).
- **Positions.** Where you stood on each map is remembered for the session only.

### Horse stations (สถานีพักม้า)

Every city, village and the grounds of the 15 joinable sects have a horse station (a horseshoe marker on the map). From one, you can ride to any other station place you have **visited before**:

- **Fare:** 20 gold + 0.2 gold per world-map unit (the capital → ฉางอัน is 65 gold; across the map a few hundred).
- **Time:** 1 ชั่วยาม per 120 units (at least 1) — far quicker than walking the roads, with no stamina cost and no encounters on the way.
- Roaming foes on the map you leave are gone when you arrive.

Code: `lib/world/stations.ts`; the store's `stationTravel`.

## Random encounters

Arriving somewhere never triggers anything. Foes turn up while you **walk**: every 220 map units walked on a location or route map is one *walk tick*. Home and the jail are safe.

- **Foes on the map.** A tick may put a foe on the map (30 %, at most three waiting at once), a short walk away. It stands there with a red ⚔ name tag and watches you. Walk (or tap) into it to face it; walk around it to avoid it. It is gone once you have faced it, and foes stay behind when you leave the map.
- **Who turns up** depends on the place: people in towns, villages and homes; mostly beasts in the wilds; spirits too around sects and temples. Stronger foes, and elites, come as the hero grows (by day and sect rank).
- **Hunting.** While a kill quest wants a foe that lives here, foes turn up more often (80 % a tick) and they are the quest's targets.
- **The law and sect hunters** still catch up at once:

| Check | Chance per tick |
| --- | --- |
| **Law** — only with wanted marks | 13 / 21 / 29 / 37 / 45 % for 1–5 marks |
| **Sect hunter** — only after betraying a sect | 30 % |

There are no treasure or meeting events.

### The encounter screen

Walking into a foe (or being caught by the law or a hunter) opens it. It shows the foe, its tier and its kind (human, beast, supernatural), and the **power tiers** of the foe, its strongest companion and the hero, with a verdict (see [Battles](#battles)). You choose:

- **⚔ ต่อสู้** — fight. Many foes bring weaker companions — wolves, bats, cultists, bandit gangs — and more of them as the hero grows stronger (up to six). The strongest bosses (the bandit king, the cult elder, the bear king) come with their whole gang. Once the hero is strong, the ten named villains — เถ้าแก่โจวตลาดมืด, ทูตเซี่ย, ขุนนางหยาน, หัวหน้าโจรชิง, นักฆ่าเงาหยิง, เจ้าลัทธิจ้าวมังกรเทพ, ผู้อาวุโสตู๋ซื่อ, ฮุยเป้า, ดาบเลือดเซียะลาง and ตู๋โซ่ว — can also cross the hero's path with their followers (rarer than the other bosses).
- **🏃 หนี** — leave. Free against ordinary foes.

  Against a **sect hunter** or a **law pursuer** it is a check of `min(90 %, 30 % + (AGI + LUK) / 2)` on base stats (31 % at the start). A failed check forces the fight.

### Who you meet

The zone decides the kind of foe:

| Zone | Places | Humans / beasts / supernatural |
| --- | --- | --- |
| city | cities, villages, inns, homes | 1 / 0 / 0 |
| mansion | villas | 1 / 0 / 0 |
| sect | sect grounds | 4 / 0 / 1 |
| temple | temples, palaces | 2 / 0 / 1 |
| isle | islands | 2 / 3 / 0 |
| frontier | tribes, markets, deserts | 3 / 2 / 0 |
| wild | mountains, caves, valleys, pools, every road, the tutorial foothill | 1 / 4 / 0.5 |

Foes also grow with your **power**: the larger of `day / 200` and `(9 − best sect rank) / 8`, capped at 1. As power rises:

- the mix shifts from tier 0–1 toward tiers 3–4;
- five elite foes appear;
- **every** opponent's stats are multiplied by `1 + 0.6 × power` (up to ×1.6).

Joining a sect that starts at rank 5 sets power to 0.5 at once. The capital apprentice is the only foe that never scales.

### Life and death

| Fight | If you lose |
| --- | --- |
| random encounters, sect hunters, hunting, failed assassination or kidnapping | **game over** |
| spars, the capital duel, a failed steal, the law | you survive with at least 1 HP (the law takes you to jail) |

## Battles

Battles are turn-based tactics on a board of 10 × 7 tiles, growing to 15 × 10 when many foes join. The full rules are in [grid-combat.md](grid-combat.md).

- **The warning first.** Every fight opens with a briefing before the board: the foe, its companions, and both sides' **power tier** — twelve named steps from สามัญชน to ยอดคนใต้หล้า, each with its own colour (names only, no numbers), scored from stats, inner arts and move skills, never equipment ([combat.md](combat.md#power-tiers)). The verdict reads อันตรายยิ่ง (foe 2+ tiers up), เหนือกว่าเล็กน้อย, สูสี, ด้อยกว่าเล็กน้อย or ด้อยกว่ามาก, and the note says whether a loss can kill. เข้าต่อสู้ (F / Enter) starts the fight; retreating is still possible inside it. The hero's own tier is on the profile.

- **Units.** You are one unit. An accepted encounter can add the foe's companions (up to six); quest fights, spars and hunts are one against one.
- **Your turn.** Move, then use one of the (up to 10) skills or inner arts in your slots, or รอ (wait), or ถอยหนี (retreat).
- **Retreat** succeeds 20–90 % by speed. It gives no rewards and costs the turn if it fails.
- **อัตโนมัติ** lets the AI play for you.
- **Winning** pays:
  - 50 w-exp;
  - loot (2–4 picks from the foe's drop table);
  - 20 xp per use for each skill and art you used;
  - stat xp (see [Stats](#stats));
  - a kill counted for every fallen foe, companions included.
- **Every finished battle** costs 5 stamina and 0.5 ชั่วยาม.

## NPCs

Walk up to a person and talk. The NPC card offers what that person supports:

| Action | Needs | Does |
| --- | --- | --- |
| 💬 ทักทาย | a dialog | their conversation |
| ⚔ ขอประลอง | a spar build (110 NPCs) | a non-fatal duel; a win gives fame (3–22 by their strength) and +1 relationship |
| quests | they give or receive one | offer, progress and turn-in sections |
| ขโมย | something to steal (94 NPCs), or a quest asks for it | see [Bad actions](#bad-actions) |
| ลอบทำร้าย / 🪢 ลักพาตัว | an active quest stage that names them | see [Bad actions](#bad-actions) |

- **Gifts.** Every card has 🎁 ให้ของขวัญ: an item from the bag (not quest items or manuals) or 100 / 500 / 1000 / 5000 gold, once every 30 days per person. A gift is worth 1–5 trust by its price; something the person likes counts double (their favourite item +2 more), something they dislike costs 2. Tastes follow the person (a monk likes herbs and books, dislikes meat and venom; merchants like valuables and gold). Trust gates the T2–T3 teaching quests.
- **Gone and back.** An assassinated person is gone for the rest of the game. A kidnapped one disappears and returns to their spot after 180 days.
- **Strollers.** Some people (farmers, children, guards, servants) wander around their spot; shopkeepers, elders and masters stand still.
- **Quest marks.** A gold **!** over a person means a quest to offer; **?** means something to hand in.
- **Letters (จดหมาย).** A person whose relationship with you is **20 or more** may write to you with a gift — at most one letter a day, and one from each person every 15 days. Each new day every such friend has a chance of `1 % + 0.15 % per relationship point above 20 + 0.02 % per fame + 0.05 % per LUK` (at most 15 %). The gift's rarity (ทั่วไป / ดี / หายาก / ล้ำค่า, by item price) also rises with LUK (and a little with fame); people who like gold may send gold instead. A toast announces a new letter, and the ✉ จดหมาย tab (the 8th HUD icon) shows an unread count; opening a letter puts the gift in your bag. Code: `lib/world/letters.ts`.
- **Named masters.** The 20 named masters (sect chiefs and seconds) live, age and can die (see [liveness.md](liveness.md)). A dead or secluded master shows a badge on their card.

## Quests and tracking

There are 867 quests: one main quest, 526 side quests (97 sect quests, 154 lineage quests and 97 place quests) and 340 story chapters in 38 sagas — see [Lineage quests and sagas](#lineage-quests-and-sagas).

- **Accepting.** Most quests are offered by a person (the **!** mark). Sect quests are taken in the สำนัก menu.
- **Stages.** A quest has 1–4 stages. The quest log (ภารกิจ) shows each one with ✓ done, ▸ current and ○ still ahead.

| Stage kind | How it moves on |
| --- | --- |
| **item** | have the items in the bag. What you already carry counts |
| **kill** | defeat the foes. Only kills made after accepting count |
| **visit** | reach the place |
| **objective** | use the 🔍 spots on the map, or the action in a person's card; each costs time |
| **dialog** | choose the right answer in a conversation |
| **turn-in** | go back to the giver (or the named receiver) |

- **Handing in.** Items gathered for a quest are taken from the bag on hand-in. Rewards can include gold, w-exp, items, skills, arts, traits, relationship and sect points; a receipt card shows what you got.
- **Tracking.** In the quest log, **📌 ติดตาม** pins a quest; without a pin, the newest active quest is tracked. The tracker under the sundial then shows:
  - the current stage and what to do (🎯 with a counter);
  - where to go (📍 with the number of roads left).

  On the map a jade arrow bobs over the target, or over the exit toward it. An edge pointer shows the way when the target is off screen. **➤ นำทาง** in the log points the arrow at a quest.
- **Abandoning** (ละทิ้งภารกิจ) fails the quest for good. It can never be taken again.
- **Losing the giver.** A quest fails when its giver, one of the simulated masters, dies. Lineage quests and saga chapters don't.

### Lineage quests and sagas

Every sect skill and art can be earned from a sect NPC ([story-quests.md](story-quests.md)):

- **Lineage quests** (สืบทอดวิชา) teach a tier 0–3 skill or art. The higher the tier, the harder:

  | Tier | Needs | Task | Rewards |
  | --- | --- | --- | --- |
  | 0 | membership | beat 2 foes | the skill, w-exp 60, 20 sect points |
  | 1 | ¼ up the rank ladder, stat 10 | 3 foes, bring 2 items | w-exp 120, 40 points |
  | 2 | ½ up, stat 15 | 3 foes, 3 items, beat the teacher in a spar | w-exp 200, 60 points |
  | 3 | ¾ up, stat 25 | 4 foes, 2 items, spar | w-exp 320, 100 points |

  The stat is the item's strongest, counted without gear. The three outsider sects, which can't be joined, ask for a way of life instead: evil for ดาวดึงส์ and ดาบโลหิต, the venom life skill for เบญจพิษ.
- **Story sagas** (ตำนาน, 📜) lead to a tier-4 skill or art. Each is 8–10 chapters that retell a legend of มังกรหยก ภาค 3 — set over a hundred years later, with the old heroes in sepia flashbacks — and pay small rewards along the way; the last chapter teaches the technique.
  - Chapter 1 needs a high rank and a stat of 40 (or a way of life for the outsiders); each later chapter opens when the previous one is done.
  - Seven sects' old art quests are now **prologue trials** (บททดสอบก่อนตำนาน) that must be passed before the saga starts.
  - Chapters send you between places to visit, talk, hunt, gather and duel. A duel is never fatal; lose it and try again.
  - Many scenes open with a **film** on the painted map: subtitles, title cards and moods. Tap to go on, ▶ อัตโนมัติ to play hands-free, ข้าม to skip. Long talks show a page at a time (ต่อ ▶).
  - The quest log's **ตำนาน** tab lists every saga with its progress and who gives the next chapter, and replays films already seen (🎬).
- Neither kind can be abandoned.

The quest list per giver and location is in [reference/quests.md](reference/quests.md).

## The sword tournament (ชุมนุมวิจารณ์กระบี่)

Once a year (a year is 360 days) the capital hosts a 32-fighter single-elimination tournament. Its ring is a crossed-swords marker on the capital map.

- **Calendar:** registration opens on day 60 of each year; the tournament is on day 90, and can still be started on the two days after. The first one is on day 90.
- **Registering:** at the capital, for 100 gold.
- **Entrants:** you and 31 NPCs — every living, present master of the liveness roster (the 20 named NPCs), topped up with other fighters who spar. The bracket is drawn at random.
- **Your bouts** are real, non-fatal battles (leaving the ring forfeits). Every other bout is simulated: the stronger fighter (by power score) usually, but not always, wins.
- **Rewards** for each bout you win: 100 / 200 / 400 / 800 / 1600 gold and 50 / 100 / 150 / 250 / 400 w-exp (last 32 → final). Your final place adds w-exp and fame: champion 1500 / +40, runner-up 800 / +25, last 4 500 / +15, last 8 300 / +8, last 16 150 / +4, last 32 60 / +1.
- **The champion's prize:** pick any one move or inner art known by the 32 entrants, sect ones included — the one exception to "sect moves come only from lineage quests and sagas". An NPC champion picks one too and grows a little stronger.
- **Missed it?** If the days pass without you (or you registered and never came), the year is fought among the NPCs; a registration fee is not refunded. Past champions are listed at the ring.

Code: `lib/world/tournament.ts`; the store's `registerTournament`, `fightTournamentBout` and `pickTournamentPrize`.

## Sects

There are 15 joinable sects and 5 more sect grounds you can only visit.

- **Joining.** Each sect has an intro quest from its registrar. Every intro except กู่มู่'s is offered only to someone in no sect, so you hold one membership at a time:

| Sect | Who may take the intro | The intro asks for |
| --- | --- | --- |
| เส้าหลิน | male, evil ≤ 10 | 10 herbs, 10 ginseng, 10 lotus seeds |
| ง้อไบ๊ | female, evil ≤ 10 | the same |
| อู่ตัง, ฉวนเจิน | evil ≤ 10 | the same |
| หัวซาน, ซงซาน, เฮิงซาน | evil ≤ 10 | 3 iron ore and 500 gold (both handed over) |
| ไท่ซาน | evil ≤ 10 | 3 jade and 500 gold |
| เหิงซาน | evil ≤ 10 | 3 paper and 500 gold |
| พรรคยาจก | evil ≤ 10, begging mastery ≥ 2 (ผู้เฒ่ายาจก at the Beggars' grounds teaches begging) | 5 rice dishes and 100 gold |
| พรรคสราญรมย์ | evil ≤ 15 | 10 herbs, 10 ginseng, 2 snow lotus |
| สำนักสุลถัง | evil ≤ 30 | 5 viper, 3 scorpion and 1 centipede venom, 5 herbs |
| องครักษ์เสื้อแพร | evil ≤ 30 | kidnap ทูตหลิวอิง |
| พรรคตะวันจันทรา | evil ≤ 30 | assassinate องครักษ์ฉิน |
| กู่มู่ | a ฉวนเจิน disciple who knows หนึ่งพลังสุริยันต์ (`t3_qz_sun`), evil ≤ 10 | defeat 3 bandit chiefs, then 3 snow lotus and 1 mithril ore; you leave ฉวนเจิน and join กู่มู่ |

- **Ranks** count down: 9 → 1 (eight sects), 5 → 1 (six sects) or 3 → 1 (กู่มู่). A lower number is higher.
  - Sect quests pay sect points, and a rank-up spends them: 6250 points in total on a 9-rank ladder, 1850 on a 5-rank ladder, 1600 for กู่มู่.
  - A rank-up pays gold (half the points it costs) and opens more of the sect's lineage quests and sagas. Ranks grant no martial arts: every sect skill and art comes **only** from its lineage quest or saga. The 🎖 ขั้นและวิชา tab lists them all with what each still needs.
- **Sect quests** (📜 ภารกิจประจำ) can repeat, each 30 days after you last completed it. Some need a minimum rank, and each sect has one art quest. Art quests teach nothing now: seven are trials that open a saga, eight are trials that open the lineage quest of their tier-3 art.
- **Leaving** (in the sect menu) — either way, you can never join that sect again:
  - **ลาออกอย่างเป็นทางการ** (resign): you keep the skills, but that sect's skills and arts stop gaining xp in battle.
  - **ทรยศสำนัก** (betray): evil +5, and the sect's hunter (a tier-4 foe) may ambush you on 30 % of walk ticks. The sect's redemption quest ends the hunt by turning the betrayal into a resignation. สำนักสราญรมย์ has no redemption quest.

Full sect data: [reference/sects.md](reference/sects.md).

## Shops, sect halls and artisans

| Where | What | Sell-back |
| --- | --- | --- |
| general store, 7 cities | 23 items (ซูโจว adds silk) | 50 % |
| inn shop, 4 inns | 5 food and herb items; buys food, herbs, materials | 40 % |
| village shop, 8 villages | 4 items; buys food, herbs, materials | 35 % |
| sect hall (🏯), 7 cities | tier 0–1 jianghu skills (200 / 800 gold) and inner arts (500 / 2000 gold) | — |
| artisans, 49 in all | recipes, crafting and gear; every city has the six crafts | 40 % (35 % in villages and sects) |

Sect styles are never sold in city halls; you learn them by rank inside the sect.

**Crafting** happens at an artisan and has three tabs: 📜 ซื้อสูตร (buy a recipe), 🔧 ประดิษฐ์ (craft) and 🏪 ซื้อ-ขาย (trade, including gear).

- **Professions.** The six craft professions are forge, alchemy, tailoring, chef, jewelry and accessory.
- **Recipes.** Basic recipes cost 80 gold at any artisan of the profession. Specialties are sold only by certain cities' artisans.
- **What you need.** The recipe learned, the inputs in the bag, the mastery level, and an artisan of that profession here.
- **Cost.** 0.2 ชั่วยาม and no stamina. The inputs are always used up.

Full lists: [reference/items-and-crafting.md](reference/items-and-crafting.md).

## Life skills and gathering

There are 19 life skills:

- **Gathering:** mining, woodcutting, hunting, fishing, herbalism, venom.
- **Arts and pastimes:** reading, music, drawing, writing, chess, begging.
- **Thievery:** steal.
- **Crafts:** forge, tailoring, jewelry, alchemy, chef, accessory.

Mastery levels 1–5 need 0 / 100 / 300 / 700 / 1500 xp.

**Gathering spots** sit on maps as signs (mine, tree, fishing spot, herbs, venom, chess table, begging corner). One try costs the node's stamina and 0.2 ชั่วยาม:

- **Success chance:** `55 % + 15 % × (mastery − node level)`, between 10 % and 95 %.
- **Success:** 1–3 picks from the node, more when your mastery exceeds its level; chess and begging also pay gold.
- **xp:** 5 × node level, halved on a failure; plus w-exp +10 and stat xp.
- **Begging** appears only after ผู้เฒ่ายาจก at the Beggars' grounds teaches you. A failed beg costs extra stamina.
- **Hunting** starts a one-against-one fight with a hunt beast. Lose and it is game over; win and you get the spoils and 8 × node level xp.
- **Other ways to train:**
  - reading, music, drawing and writing items (ใช้ in the bag);
  - playing music in the อาชีพ menu, which needs an instrument weapon.

## Items and equipment

**Bag items (126).**

- **Healing:** potions heal HP; ginseng and lotus seeds restore MP; food heals HP.
- **Training:** books and scrolls train a life skill.
- **Manuals (47):** each teaches a skill or art if a stat is high enough — 0 / 10 / 15 / 20 / 30 for tiers 0–4, counting skills and arts but not gear.
- **Quest items:** cannot be sold.

**Gear (76 pieces).** Ten slots: weapon, armour, head, boots, two bracers, two rings, two charms. Gear from the bag is equipped in ย่าม, and a replaced piece goes back to the bag. Stats and effects are in [combat.md](combat.md).

## Progression

### Skills and inner arts

Move skills (178) and inner arts (122) level from 1 to 10. A move skill's power, its stat bonuses and its weapon mastery grow with level; an art's bonuses scale by level / 10.

| Xp to the next level | Formula | Tier 0, lv 1 → 2 | Tier 4, lv 9 → 10 |
| --- | --- | --- | --- |
| move skill | `50 × level × (tier + 1)` | 50 | 2250 |
| inner art | `100 × level × (tier + 1)` | 100 | 4500 |

Where the xp comes from:

| Source | Skill xp | Art xp |
| --- | --- | --- |
| each use in a **won** battle | 20 | 20 per art active |
| **practice** (🧘 ฝึกฝน) | 30 + 5 % of the xp to the next level; 50 + 6 % at a fitting place | same |
| some quest rewards | as written | — |

Practice:

- **Where:** only at sect grounds, mountains, caves, rivers and temples (49 places).
- **Cost:** 30 stamina and 6 ชั่วยาม; it also pays 5 w-exp.
- **Xp per session:** 30 + 5 % of what the skill or art needs for its next level (`practiceXpGain`), so higher levels still move at a steady pace; a maxed skill gets the flat part only.
- **Fitting place (50 + 6 %)** for a matching skill type:
  - caves: yin / soft;
  - mountains and sect grounds: balance / hard;
  - rivers: internal.

  A skill with no yin / yang / balance tag counts as balance, so it gets the mountain bonus.

**W-exp (悟)** is a shared pool. **เร่งด้วย w-exp** in the วิชา menu buys the rest of the current level with it.

| W-exp source | Amount |
| --- | --- |
| won battle | +50 |
| gathering (not hunting) | +10 |
| crafting, using a training item or manual, playing music, practising, jail labour, jail meditation | +5 |
| quest rewards | as written |

- **Ways to learn:**
  - sect ranks;
  - city halls;
  - manuals;
  - quest rewards.
- **Slots.** Learned skills and arts go into 10 slots (the วิชา menu). The first slotted art is your primary art.
- **Forgetting.** ลืม removes a skill or art with no refund.
- **Type conflict** can weaken styles that fight each other — details in [combat.md](combat.md#type-conflict).

## Stats

Eight stats: STR กำลัง, AGI ความเร็ว, POW ภายใน, VIT ร่างกาย, DEX เฉียบคม, LUK โชค, DEF ป้องกัน, INT ฉลาด. What each one feeds (HP, attack, speed, evasion…) is in [combat.md](combat.md#stats).

Stats grow through **stat xp**. Most grants are +10; a stat levels up when its xp reaches `50 × current base` × a per-stat factor:

| Factor | Stats |
| --- | --- |
| ×2.0 | AGI |
| ×0.6 | DEX |
| ×1 | all others |

So STR costs 50 xp at 1 and 500 at 10.

| Stat | Earned by |
| --- | --- |
| STR | each use of a physical skill in a won battle; a successful kidnapping; jail labour (+20) |
| POW | each use of an internal skill in a won battle |
| DEF | each hit you take in a won battle |
| AGI | every step between a place and a road |
| VIT | mining, woodcutting, fishing, herbalism, venom (gathering and their recipes) |
| DEX | the six crafts; a successful steal or assassination |
| INT | reading, music, drawing, writing, chess; playing music |
| LUK | random rolls (below); jail dice (+10) |

Hunting and begging give no stat xp.

**LUK rolls** give +10 LUK xp with chance `min(50 %, 10 % + LUK %)`. They happen:

- on every skill use and every hit taken in a won battle;
- on each travel step;
- on gathering, crafting and using an item;
- on buying, selling, buying a skill, art, recipe or gear, and a successful bad action.

## Traits and reputation

Five traits start at 0 and never drop below 0: good, evil, arrogance, humility, fame. Sect intros check evil, and some quests check traits.

| Change | From |
| --- | --- |
| as written | quest rewards and dialog choices |
| fame + the NPC's value | a spar win |
| evil +2 | a successful steal |
| evil +8, fame +2 | a successful assassination |
| evil +6, arrogance +1 | a successful kidnapping |
| evil +5 | betraying a sect |
| humility +8 | a redemption quest |

**Relationship** with each NPC rises with spars (+1), quests and dialog. Some quests need a minimum.

## Bad actions

From an NPC's card; every attempt takes 0.2 ชั่วยาม and uses base stats:

| | Steal (ขโมย) | Assassinate (ลอบทำร้าย) | Kidnap (ลักพาตัว) |
| --- | --- | --- | --- |
| Offered | any NPC with loot, repeatable | only when a quest asks, once per NPC | only when a quest asks, once per NPC |
| Chance | 50 + DEX + ½ LUK + 3 × steal mastery − 5 × guard tier | 50 + STR + DEX + ½ LUK − 8 × tier | 50 + STR + VIT + ½ LUK − 7 × tier |
| On success | loot, steal xp +25 | quest progress | quest progress |
| On failure | **+1 wanted mark** and a non-fatal fight | a **fatal** fight | a **fatal** fight |

Chances are clamped to 5–95 %. Formulas: [world-engine.md](world-engine.md#bad-actions).

## The law and the jail

- **Wanted marks** (หมายจับ ●○○○○, up to 5) come from failed steals (+1) and jail escapes (+2). One fades every 10 days without a new crime.
- **Pursuers.** While wanted, walk ticks can bring the law: a constable at 1 mark, then imperial guards and a bounty hunter (with a constable) as marks grow. Fleeing uses the AGI + LUK check.
- **Law fights** are not fatal. Win and you walk on (the marks stay); lose and you are taken to a cell, where you either:
  - **accept arrest** — you go to the **jail map** for 2 days per mark (at least 2, at most 10), and your marks are cleared; or
  - **bribe with 300 gold** — you walk free and two marks are removed.
- **The jail** has no exits:

| Spot | Time | Stamina | Effect |
| --- | --- | --- | --- |
| ทุบหิน (labour) | 6 | 25 | the sentence drops 12 ชั่วยาม in all; STR xp +20 |
| ทอยเต๋า (dice) | 2 | 5 | bet 10 gold; win `min(60 %, 40 % + LUK/2 %)` |
| นั่งสมาธิ (meditate) | 6 | 0 | MP full, HP +20 %, stamina +15 |
| แหกคุก (escape) | 2 | 30 | `min(55 %, 20 % + AGI/2 %)`: free with +2 marks; failure adds a day |
| ประตูคุก (gate) | — | — | open when the time is served; before that, offers to sit out the rest at once |

- **People.** ตาเฒ่าหลิว gives tips; ผู้คุมจาง takes the 300-gold bribe.
- **Release.** You are released in the region's city (นครหลวง, ต้าหลี่, ซีเซี่ย, ซูโจว or ฉางอัน) with HP and MP at least 60 %.

## Rumors

At the 🍶 ฟังข่าวลือ spot in a city or inn, you hear up to five rumors from your region, all free. They come from four sources:

- 💬 what the named masters have been doing;
- 🌬 your own deeds;
- 📜 old lore and treasure hints;
- ⚠ warnings.

Some rumors are exaggerated or false, and the game never says which. Details: [liveness.md](liveness.md).

## Saving, game over and starting again

- **Saving.** The game saves itself to this browser (`localStorage`) after every change; there is no save slot. The format and upgrades of old saves are in [save-format.md](save-format.md).
- **Game over** comes from losing a fatal fight. The game-over screen shows the days survived and starts a new run.
- **Clearing a run.** A new run clears the world save only; the /debug builds and sound settings stay.

## Known gameplay gaps

These are real today and listed in [HANDOFF.md](../HANDOFF.md#known-issues):

- An abandoned quest can never be taken again.
- Leaving a sect blocks rejoining it forever. สำนักสราญรมย์ has no redemption quest, so its hunters never stop.
- The 12 non-artisan recipes (drawing, writing, mining, hunting…) have no crafting button.
- Resigning freezes battle xp only; practice and w-exp still raise frozen sect skills.
- Market and sect-internal rumors are hard to reach, and heartland inns never hear the masters' news.
