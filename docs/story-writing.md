# Writing sect quests and story sagas

How to write the content in `lib/world/data/story/`: the **lineage quests** that pass on every T0–T3 sect skill and art, and the **story sagas** that lead to every T4 sect skill and art. The engine side (compiler, cutscene player, quest log) is in [story-quests.md](story-quests.md); the format is `lib/world/story/types.ts`. The worked example is `lib/world/data/story/wudang.ts`: copy its shape and its quality bar.

## Contents

- [The two kinds](#the-two-kinds)
- [The legend we tell](#the-legend-we-tell)
- [Timeline and novel characters](#timeline-and-novel-characters)
- [The main story](#the-main-story)
- [Voice](#voice)
- [Lineage quests](#lineage-quests)
- [Story sagas](#story-sagas)
- [Cutscenes](#cutscenes)
- [Rules the validator enforces](#rules-the-validator-enforces)
- [Thai names from the novel](#thai-names-from-the-novel)
- [Lore hooks per sect](#lore-hooks-per-sect)

## The two kinds

| | Lineage quest | Story saga |
| --- | --- | --- |
| For | each T0–T3 sect skill / art | each T4 sect skill / art |
| Length | one quest | 8–10 chapters, each its own quest |
| Written | `LineageSpec`: teacher, 2–6 offer lines, 2–6 lesson lines, a foe, an item | `StoryArcSpec`: chapters with dialogue, steps and cutscenes |
| Difficulty | built by the compiler from the tier (rank, stat, foes, items, a spar) | `require` on chapter 1 (rank + stat 40), steps and chapter gates you choose |
| Reward | the skill / art + w-exp + sect points | small rewards per chapter; the last chapter teaches the T4 |

## The legend we tell

The sagas retell **มังกรหยก ภาค 3** (ดาบมังกรหยก, 倚天屠龍記): the Dragon-Slaying Saber and the Heaven-Reliant Sword, ปรมาจารย์เตียซำฮง of บู๊ตึ๊ง, เตียบ่อกี้, the six great sects against เม้งก่า, เจียซุ่นราชสีห์ขนทอง, เตียบ้อ of the Yuan court, the Nine Yin and Nine Yang manuals.

**Framing — keep it this way:**

- The legend is **living memory**: the game is set about 40 years after it ([Timeline](#timeline-and-novel-characters)). Today's elders (our NPCs) were young disciples or witnesses then, or are its people's children and disciples.
- Novel characters appear **only in flashback cutscenes** (`mood: "past"`) and in what elders tell. The hero never meets them: those still alive have withdrawn (below).
- Each saga follows the hero in the **present day**, retracing one legend: an elder tells part of it, the hero goes somewhere, something from that legend echoes now (a descendant, a lost object, an old grudge, a misunderstanding), and the T4 skill or art is the lesson of that legend.
- Use the game's sect names (เส้าหลิน, อู่ตัง, ง้อไบ๊, พรรคยาจก…). The old names (บู๊ตึ๊ง, เม้งก่า, ยอดกวงเม้ง) are fine inside the legend.
- Paraphrase; write your own scenes and dialogue. Never copy passages from the novel or its translations. One famous line said in your own words is fine.

## Timeline and novel characters

**The present day is the 3rd year of Jianwen (ค.ศ. 1401), about 40 years after มังกรหยก ภาค 3.** ปรมาจารย์เตียซำฮง is alive at about 154.

### The age we play in (the game's lore)

1. **The seizure (about 18–12 years ago).** ฮ่องเต้หงอู่ (จูหยวนจาง), first emperor of the Ming, founded the องครักษ์เสื้อแพร (1382). He set them on the jianghu and gathered the great sects' scriptures (คัมภีร์) into the court: copied, confiscated or taken by force. They went into the **หอคัมภีร์หลวง** in the capital. Sects kept only what their masters carried in their heads. Many arts thinned out in a generation.
2. **The emperor's death (3 years ago, 1398).** His grandson, ฮ่องเต้เจี้ยนเหวิน, came to the throne and reined in the องครักษ์เสื้อแพร.
3. **The scattering (the last two years).** His uncle, อ๋องเยียน (จูตี้), rose in revolt from เป่ยผิง (ศึกจิ้งหนาน, 1399–). In the chaos the หอคัมภีร์หลวง was emptied:
   - some scrolls were stolen and sold by its guards;
   - some were smuggled back to their sects;
   - some were hunted by agents of both sides for their armies.
4. **Now: an age of strife.** Sects great and small are gathering their lost scriptures and training again, and old rivalries flare. The war in the north drags on. That is why every master in the game hands the hero a **คัมภีร์**: the sect has just recovered it.

### How long ago

| Event | Distance now |
| --- | --- |
| ก๊วยเซียง, หลวงจีนกักอ้วน, the founding of ง้อไบ๊, young เตียซำฮง leaving เส้าหลิน, the Condor-era heroes, Xiangyang | ร้อยกว่าปีก่อน (about 140) |
| เตียซำฮง founding อู่ตัง's arts | about a hundred years and more |
| เตียชุ่ยซัว meeting ฮึงซ่อซ่อ | หกสิบกว่าปีก่อน |
| เกาะไฟน้ำแข็ง, the Dragon Saber's return, the master's 100th birthday (เตียชุ่ยซัว and ฮึงซ่อซ่อ die) | ห้าสิบกว่าปีก่อน |
| young เตียบ่อกี้'s cold poison, หุบผีเสื้อ | ห้าสิบปีก่อน / เกือบห้าสิบปี |
| the siege of ยอดกวงเม้ง, วัดหมื่นสุข, the Shaolin hero gathering, the war against the Yuan | สี่สิบกว่าปีก่อน / ราวสี่สิบปีก่อน |
| the founding of the Ming (1368) | สามสิบกว่าปีก่อน |
| the seizure of the scriptures | สิบกว่าปีก่อน |
| ฮ่องเต้หงอู่'s death | สามปีก่อน |
| the scattering, ศึกจิ้งหนาน | สองปีมานี้ |

### Who is alive

- **เตียซำฮง** (about 154) lives in seclusion behind อู่ตัง. No one sees him; a master may relay a word.
- **เตียบ่อกี้** (about 60) and **เตียบ้อ** left the jianghu long ago, whereabouts unknown.
- **จิวจี้เยียก** (about 58) has withdrawn. She is not the current ง้อไบ๊ head.
- **Dead:**
  - **เจียซุ่น** died a monk at เส้าหลิน some years ago.
  - **เอี้ยเซียว, ฮวมเอี๊ยว, อุ่ยอิดเซี้ยว** are dead or nearly all gone; stay vague.
  - **ซือไท้เมียะเจ็ก, ฮึงเทียนเจ็ง, โอ้วแชงู and อ๋องหลันกู, เตียชุ่ยซัว and ฮึงซ่อซ่อ, ค่งเกี่ยน, ตั้งอิ้วเลี้ยง** died in the novel.
- **เซ่งคุน** was crippled and vanished.
- **Today's elders** (60–75) were young disciples or witnesses at ยอดกวงเม้ง. A family link to the legend is a child or a grandchild.

### Novel characters

- **Earlier novels** (the Condor trilogy, แปดเทพอสูรมังกรฟ้า: ก๊วยเจ๋ง, อึ้งย้ง, เอี้ยก้วย, ฮ่วงเอี้ยะซือ, หวังฉงหยาง, โฮ่งชีก๋ง…) are **history**. Their people never appear alive. A present-day heir may carry the family name: หวงชิงเฉวียน of เกาะดอกท้อ descends from ฮ่วงเอี้ยะซือ many generations down (a grandson of อึ้งย้ง took the Huang name to keep the island); he calls อึ้งย้ง ท่านย่าบรรพชน.
- **Later novels** (กระบี่เย้ยยุทธจักร, จิ้งจอกภูเขาหิมะ / จิ้งจอกอหังการ…) **don't exist yet**. Never use their names, nor their family plots under the same names.
- **Every NPC has an invented name.** Before naming one, check it is not a novel character's. The 2026-10 rename gave 41 NPCs invented names, for example:
  - จั่วเหลิงฉาน → เกาซงเหยียน
  - เหรินหวัวสิง → ตู้เทียนหาน
  - ฮ่วงเอี้ยะซือ → หวงชิงเฉวียน
  - อิดเต็ง → อู๋เฉินไต้ซือ
  - ฮูเฝย์ → ไป๋เฝยหยาง
  - หลินผิงจือ → เฉาเหวินจือ

  Their ids are unchanged.

## The main story

`lib/world/data/story/main.ts` (`MAIN_ARC`, a `MainArcSpec`) holds **คัมภีร์ที่หลุดจากวังหลวง**: 15 chained chapters (`st_main_01`…`15`, quest type `main`) and 12 films. It has the same chapter / step / beat format as a saga, with these differences:

- no sect, no gate on chapter 1, no move at the end;
- chapter 1 is on offer from ป้าหลิว at home the moment a new game starts;
- it leads the quest log's ตำนาน list.

The story:

- The hero is the child of the **นายหอคัมภีร์** (keeper of the หอคัมภีร์หลวง).
- After ฮ่องเต้หงอู่'s death he sent the seized scrolls home in secret through the Beggars' network.
- Two years ago a dismissed องครักษ์เสื้อแพร inspector, **เมิ่งมือหมึก** (selling himself to the northern army), killed him for the vault's ledger and burned the vault.
- A box the father hid reaches the hero two years late. The trail runs:
  - from the manor and the village to the capital (clerk ฉิง, หมอหลิน, the black market);
  - through the Beggars, อู่ตัง and เส้าหลิน;
  - to the burned vault in the palace and an empty fort in the north.
- The hero tears the ledger into pages, and each sect gets back only its own. The free game then opens: sects, lineages and sagas.
- Villains are the `st_main_*` opponents. The องครักษ์เสื้อแพร as a body stays grey.

`test:story` checks it:

- 14–16 chapters and at least 10 films;
- real givers, places and foes;
- small rewards and no move;
- chapter 1 offered on a new game;
- a full play-through.

## Voice

**The conversation standard** (every dialog, offer, hand-in, step scene and film) is described under [rendering.md → Dialogs](rendering.md#dialogs).

- **One line per beat.** The player reads each line on its own, typed out. Write a line as one breath: about 140 characters at most. Longer lines are cut between words automatically, but a line that ends on its own beat reads better.
- **Key words stand out by themselves.** People, places, items, sects, moves and arts, foes, numbers and the age's terms (คัมภีร์, หอคัมภีร์หลวง, องครักษ์เสื้อแพร…) are coloured.
- **Mark anything else that matters with `**double stars**`**, such as a clue, a password or the thing to bring: `"จำคำนี้ไว้ — **ลมไม่มีเงา**"`. Use one or two per line at most; a line where everything is marked marks nothing. Always close the stars (`test:runtime` checks every line).

- **Thai wuxia register:** ข้า / เจ้า / ท่าน, ขอรับ / เจ้าค่ะ, "ศิษย์", "อาจารย์". Natural Thai, no English.
- **Meaningful:** every saga has a theme that *is* the skill or art. For example, Taiji fist is "ยอมลืม", and the hero learns the art by living its idea, not by grinding.
- **Funny:** every chapter gets at least one light moment. Use dry masters, over-earnest disciples, bandits who regret everything, terrible tea, and `asides` (joke replies). Never mock the tragedy itself.
- **Gripping (น่าติดตาม):** end each chapter on a hook — a bell at night, a stranger at the gate, a missing page.
- **Stakes rise:** a quiet start, a mid-saga twist, a climax duel, a warm or bittersweet finale.
- **"{hero}"** is the player's name: use it as a speaker in lines and as a cast name. The hero's gender is unknown, so avoid gendered words for them.

## Lineage quests

```ts
{ kind: "skill", id: "wd_cloud_palm", giver: VICE, foe: "blade_master", item: "ginseng",
  offer: [["รองอาจารย์เสวียนเฉิง", "หมัดเคลื่อนเมฆาไร้รูป …"], ["รองอาจารย์เสวียนเฉิง", "พิชิตอาจารย์ดาบสี่คน …"]],
  complete: [["รองอาจารย์เสวียนเฉิง", "…"], "narration …"] },
```

- **Teacher by tier:**
  - T0: a junior disciple or gatekeeper;
  - T1: the head disciple or an older disciple;
  - T2: an elder;
  - T3: the vice master or a senior elder.

  The master is kept for sagas. The teacher must stand at the sect's grounds; for the three outsider sects, any of their NPCs.
- **The compiler builds the task from the tier.**
  - The offer lines must *say* the task in story terms: who to beat, what to bring, and the spar with the teacher at T2–T3.

    | Tier | Rank gate | Stat gate | Task |
    | --- | --- | --- | --- |
    | T0 | — | — | beat 2 foes |
    | T1 | 1/4 up the ladder | 10 | 3 foes + 2 items |
    | T2 | halfway | 15 | 3 foes + 3 items + win a spar with the teacher |
    | T3 | 3/4 up | 25 | 4 foes + 2 items + spar |

  - **`foe`** must roam (appear on the road or a hunt) and be within one tier of the skill. Pick from the brief's roaming list.
  - **`item`** must be obtainable. Defaults: `herb` (T0–T1), `iron_ore` (T2), `ginseng` (T3).
- **Each quest should feel like this teacher teaching this technique.** Name the idea of the move, give the teacher a quirk, and keep it short.

## Story sagas

```ts
const MY_SAGA: StoryArcSpec = {
  id: "emei_heaven_sword",               // snake case, unique
  title: "…", tagline: "…",
  sc: "ง้อไบ๊", sectId: "emei",
  reward: { kind: "skill", id: "em_bodhi_sword" },
  require: { t: "and", all: [
    { t: "sectMember", sectId: "emei" },
    { t: "sectRankAtLeast", sectId: "emei", maxRank: 3 },   // see below
    { t: "statAtLeast", stat: "INT", min: 40 },             // the reward's main stat
  ] },
  opponents: [ /* optional named villains, id "st_<sect>_…" */ ],
  chapters: [ /* 8–10 */ ],
};
```

- **Rank gate for chapter 1:**
  - a 9 → 1 ladder: `maxRank: 3`;
  - 5 → 1: `maxRank: 2`;
  - Gumu 3 → 1: `maxRank: 1`.

  Outsider sects (no `sectId`) gate on a trait or life skill plus the stat, e.g. `{ t: "trait", trait: "evil", min: 40 }`.
- **Chapters** — each one has:
  - `title`, `summary` and `giver` (who offers it and takes the hand-in; may differ per chapter);
  - optional `require` (an extra gate, e.g. a higher stat or a trait, to pace the saga);
  - `offer` (the briefing — often a cutscene), `steps` (1–3) and `complete` (the hand-in);
  - `reward` (small: gold ≤ 300, wExp ≤ 250, ≤ 5 of an item, traits, relationship).
- **Steps** — mix them; a saga with only `visit` is dull:

  | Step | What the player does | Notes |
  | --- | --- | --- |
  | `visit` | goes to a place and plays a scene (🔍 on the map) | any location with a map |
  | `talk` | talks to someone there (an action on their card) | `npcId` must stand at `locationId` |
  | `duel` | scene → battle → (win) scene | never fatal; losing leaves the spot open to retry. Use a named villain, a roaming foe, or a teacher's spar build (`spar_…`) |
  | `hunt` | beat a roaming foe N times | |
  | `gather` | bring N of an obtainable item | |
  | `trait` / `stat` | reach a trait or stat value | pacing, and growth that fits the theme (humility for Taiji, evil for blood arts…) |

- **Go places.** Visit other sects, cities, caves and islands that fit the legend (Shaolin for Xie Xun, the ice island for the Dragon Saber…), not only your own grounds.
- **Dialogue amount:** each chapter needs at least 14 story lines across its dialogs and cutscene text. Offers have at least 4 lines, hand-ins at least 3, and visit / talk scenes at least 3. Long dialogs page automatically.
- **Climax:** chapter N−1 or N has a `duel` against the saga's villain or the master's spar build.
- **Finale:** the last chapter's `complete` has a cutscene, and its lines hand over the skill or art.

## Cutscenes

A cutscene is a short film on a painted map, in the Wandering Sword manner: actors walk, fight and talk with subtitles; title cards, letterbox and effects frame it.

```ts
cutscene: {
  stage: "sect_wudang",          // a location with a painted map
  around: "sect_wudang_master_qingxu",   // optional: centre on this NPC's spot there
  mood: "past",                  // day | dusk | night | past (sepia flashback) | snow | rain
  title: "ร้อยกว่าปีก่อน", subtitle: "ยอดเขาบู๊ตึ๊ง",
  cast: {
    sanfeng: { name: "ปรมาจารย์เตียซำฮง", look: "elder", at: [0, -1], facing: "right", tint: "#f2efe6" },
    wuji:    { name: "เตียบ่อกี้", look: "m1", at: [-6, 1], facing: "right", hidden: true },
    hero:    { name: "{hero}", look: "hero", at: [-2, 1] },
  },
  beats: [
    ["narrate", "…"], ["enter", "wuji", [-6, 1]], ["move", "wuji", [-2, 1]],
    ["say", "sanfeng", "…"], ["think", "wuji", "…"],
    ["act", "sanfeng", "attack"], ["fx", "qi", "sanfeng"], ["fx", "shake"],
    ["camera", "wuji", 2.6], ["wait", 600], ["fade", "out"],
  ],
},
```

- **Looks:**
  - `hero`;
  - hero bodies `m1`–`m4`, `f1`–`f4`;
  - archetypes `elder`, `monk`, `merchant`, `bandit`, `feng`, `wang`, `qing`;
  - enemy types `foe_bandit`, `foe_cultist`, `foe_constable`… (`FOE_CHARACTER_IDS` in `lib/characters/catalog.ts`);
  - any rigged NPC id (the sect heads and villains marked ANIMATED in the brief);
  - `beast:0`–`beast:7` (wolf, tiger, bear, boar, snake, rooster, eagle, bat).

  Give legend figures a body plus a `tint` (white robes `#f2efe6`, Yuan court grey `#8a8a8a`, Ming red `#e07a5f`, ghostly `#9fc3ff`) and a `size` (1.1–1.2 for towering figures).
- **Stage:** `at` is a grid around the stage centre — x −6…6 (left → right), y −3…3 (back → front). Keep everyone within about 6 steps, so the whole scene stays in frame.
- **Beats:**
  - `say` / `think` / `narrate` / `title` wait for a tap;
  - `move` waits for the walk, unless its 4th value is `"with"` or `"run-with"`, so two people can walk together;
  - `act`: attack, hurt, guard, victory, defeat, idle;
  - `fx`: slash, burst, qi, flash, shake, sparkle, smoke, lightning, petals, fire, blood, heal, ice, poison.
- **Length:** 8–20 beats, with at least 3 lines of text. A good film shows something dialogue can't: an entrance, a strike, a fall, a reveal.
- **How many:** each saga needs at least 4 — the opening (chapter 1's `offer`), two turning points, and the finale (the last `complete`). Flashbacks of the novel use `mood: "past"`.

## Rules the validator enforces

`STORY_SECT=<sect label> bun run test:story` checks only your sect; `bun run test:story` checks everything.

- **Coverage.** Every sect skill and art has exactly one source: T0–T3 a lineage quest, T4 a saga.
- **Ids exist:**
  - NPCs, and that they stand on a map;
  - places with maps;
  - opponents: hunt foes and lineage foes must roam;
  - obtainable items, skills and arts.
- **Shape:** 8–10 chapters; 1–3 steps; the line minimums above; at least 4 cutscenes per saga, with an opening and a finale; small rewards; no learn or sect rewards in chapters.
- **Cutscenes:**
  - real looks;
  - positions in range;
  - beats naming cast members;
  - known fx, motions and moods;
  - at least 3 lines of text and 4 beats.
- **Play-through.** Every quest is played in the real store: accept → each step → hand-in → the next chapter opens → the reward is learned.
- **Difficulty:** T1+ lineage has a stat gate; sagas gate chapter 1 on rank and a stat.

## Thai names from the novel

The usual Thai renderings:

| Character | Thai name |
| --- | --- |
| Zhang Wuji | เตียบ่อกี้ |
| Zhang Sanfeng | เตียซำฮง |
| Zhang Cuishan | เตียชุ่ยซัว |
| Yin Susu | ฮึงซ่อซ่อ |
| Xie Xun, the Golden Lion King | เจียซุ่น (ราชสีห์ขนทอง) |
| Zhou Zhiruo | จิวจี้เยียก |
| Zhao Min | เตียบ้อ |
| Xiaozhao | เซียวเจียว |
| Abbess Miejue | ซือไท้เมียะเจ็ก |
| Yang Xiao | เอี้ยเซียว |
| Fan Yao | ฮวมเอี๊ยว |
| Wei Yixiao, the Bat King | อุ่ยอิดเซี้ยว (ราชาค้างคาว) |
| Yin Tianzheng, the White-Browed Eagle King | ฮึงเทียนเจ็ง (ราชาอินทรีคิ้วขาว) |
| Cheng Kun | เซ่งคุน |
| Yu Daiyan | ยู้ไต้งำ |
| Hu Qingniu, the doctor | โอ้วแชงู |
| Wang Nangu, his poisoner wife | อ๋องหลันกู |
| Chen Youliang | ตั้งอิ้วเลี้ยง |
| The two Xuanming elders | สองเฒ่าเฮี้ยนเม้ง |
| Ji Xiaofu | กี่เฮี้ยวฮู้ |
| Guo Xiang | ก๊วยเซียง |
| The monk Jueyuan | หลวงจีนกักอ้วน |

Places and objects:

| Place or object | Thai name |
| --- | --- |
| Dragon-Slaying Saber | ดาบฆ่ามังกร |
| Heaven-Reliant Sword | กระบี่อิงฟ้า |
| Bright Peak | ยอดกวงเม้ง |
| The Ming cult | เม้งก่า |
| Ice-Fire Island | เกาะไฟน้ำแข็ง |
| Nine Yin / Nine Yang | คัมภีร์เก้าอิม / เก้าเอี้ยง |
| Qiankun Danuoyi | วิชาเคลื่อนย้ายจักรวาล |

When unsure of a minor name, use a title instead ("ผู้เฒ่าแห่งวังหลวง", "ภิกษุชราสามรูปใต้ต้นสน").

## Lore hooks per sect

Starting points; invent freely within the legend's spirit.

- **เส้าหลิน**
  - Jueyuan reciting the Nine Yang while carrying iron buckets (tendon, inner strength).
  - เจียซุ่น imprisoned in a pit beneath three pines, guarded by three elder monks and their Vajra Demon-Subduing Circle (the demon-subduing art, the staff).
  - ค่งเกี่ยน, who let เจียซุ่น strike him thirteen times without fighting back, to end his killing (thousand-arms: strength that refuses to strike).
  - เซ่งคุน hiding in the temple under a monk's name, exposed at the hero gathering (diamond: an unbreakable body, an unbreakable truth).
- **อู่ตัง** — beyond Taiji fist:
  - the Taiji sword taught with a wooden sword, "forget it" again (heaven sword);
  - เตียชุ่ยซัว, ฮึงซ่อซ่อ and the Dragon Saber, ending on the hundredth birthday (taiji art: grief, balance);
  - the betrayal of a senior disciple's son and the cost of jealousy (zixia: clear purple mist, a clear heart).
- **ง้อไบ๊**
  - ก๊วยเซียง wandering the world, then founding the sect;
  - the secret inside the Heaven Sword and the Dragon Saber;
  - ซือไท้เมียะเจ็ก's harsh duty;
  - กี่เฮี้ยวฮู้, who would not kill the man she loved;
  - จิวจี้เยียก's Nine-Yin claw and her regret (mercy vs duty — the bodhi palm and sword).
- **หัวซาน**
  - the elder who used golden-silkworm poison and betrayed the woman who saved him;
  - the two-elder saber formation at Bright Peak (purple mist, Huashan's honour).
- **กู่มู่**
  - the woman in yellow, heir of the ancient tomb, who appears at the hero gathering to set things right;
  - the sorrow palm (ansh) born of a sixteen-year wait;
  - cold jade and winter steps.
- **พรรคยาจก**
  - the false chief and ตั้งอิ้วเลี้ยง's plot;
  - the Eighteen Dragon palms half lost;
  - the staff technique — our "เพลงไม้เท้าตีสุข" is a pun on "ตีสุนัข": use it;
  - the beggars' network of a thousand eyes;
  - the wandering qi.
- **พรรคตะวันจันทรา** (heirs of เม้งก่า)
  - เตียบ่อกี้ learning the universe-shifting art in the secret tunnel beneath Bright Peak with เซียวเจียว;
  - the old chief who died there;
  - the Holy Fire tokens of Persia;
  - เซียวเจียว's farewell.
- **พรรคสราญรมย์**
  - the two Xiaoyao envoys: เอี้ยเซียว, and ฮวมเอี๊ยว, who scarred his own face and lived for years as a mute monk among the enemy (a comedy about a talker who must not talk);
  - the art of drawing in another's strength.
- **พรรคเบญจพิษ**
  - อ๋องหลันกู, who poisoned herself to make her doctor husband โอ้วแชงู prove his skill (poison vs healing, a marriage of rivals);
  - the five poisons made one body.
- **สำนักดาบโลหิต**
  - rage and redemption: เจียซุ่น's killing spree to draw out เซ่งคุน, signing the master's name in blood, and his final peace as a monk;
  - the blood art that eats its wielder.
- **องครักษ์เสื้อแพร** (heirs of the court's guards)
  - เตียบ้อ and the Yuan court;
  - the two Xuanming elders and their cold palm;
  - the tower where six sects' masters were drugged and caged;
  - duty vs conscience, and a princess who chose love over the court.
- **สำนักสกุลถัง**
  - the saber feast on Wangpan island, where hidden weapons rained;
  - the forging of the saber and the sword from one black-iron blade (sky-cleaver);
  - a poisoner granny's needles;
  - the Tang art of ten thousand poisons as care, not cruelty.
