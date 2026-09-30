# Sect Authoring Template

Fill in this template and hand it back to me. With a complete sheet I can build the entire sect (location + skills + arts + NPCs + quests + scenes) in one pass without follow-up questions. Skip optional sections you don't care about — defaults are noted in `(parens)`.

> Reference build: see the **องครักษ์เสื้อแพร / Jinyiwei** sect for a fully-populated example. Tier budgets and convention notes live in `CLAUDE.md` and the data files themselves (`lib/game/data/skills.ts`, `lib/game/data/arts.ts`).

---

## 1 · Sect identity

| Field | Value |
|---|---|
| Thai name (canonical) | _e.g._ `องครักษ์เสื้อแพร` |
| One-line concept | _e.g._ "Imperial brocade-clad guards — government enforcers" |
| Alignment | `orthodox` / `unorthodox` / `evil` / `neutral` |
| Dominant philosophical axes | `yang` or `yin` · `hard` or `soft` · `internal` or `external` (pick the 1-2 the lineage leans into) |
| Signature weapon families (1-3) | from `{fist, long, sword, blade, short, hidden, music}` — see `lib/game/data/weapons.ts` |
| Color / motif keyword (for naming) | _e.g._ "vermilion silk + gold thread" |

---

## 2 · Location on the world map

| Field | Value |
|---|---|
| Location id (snake_case, prefixed `sect_`) | _e.g._ `sect_jinyiwei` |
| Display name (Thai) | _e.g._ `องครักษ์เสื้อแพร` |
| Description (1 sentence + Chinese name) | _e.g._ "锦衣卫 · กรมรักษาวังหลวง · สวมเสื้อแพรปักทอง" |
| Anchor neighbors (existing leaf ids that connect in) | _e.g._ `palace_royal`, `city_capital` |
| Per-direction route labels | one pair per neighbor: `fromA / fromB` (+ optional `hintA / hintB`) — see existing entries in `lib/world/data/location-routes.ts` |

The new location is added to the SECTS list in `lib/world/data/world-map.ts` and routes append to `lib/world/data/location-routes.ts`. Don't worry about `SECT_ORDER` in `lib/game/data/sects.ts` — I add that automatically when the canonical name is given.

---

## 3 · Move skills (วิชาฝีมือ)

**Recommended count**: 5-8 skills total. Spread tiers so the lineage has an entry-point and a capstone.

**Suggested tier distribution** (adjust to taste):
- T0: 1 (entry — usually unaffiliated/cheap; weak stats)
- T1: 1-2
- T2: 2
- T3: 1-2
- T4: 1 (capstone signature)

**Per-skill fields** (one row per skill — table below or freeform):

| # | Thai name | Tier | Weapon | Stats | bp / p / f / dm | drain (dr%) | Self effect (`se`) | Enemy effect (`ee`) | Types | One-line description |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | _e.g._ `โซ่กรงเล็บฝึกหัด` | 0 | hidden | STR 4, AGI 4 | 38 / 0 / 8 / 1 | — | — | — | yang, external | "Phy โซ่ตวัดพื้นฐาน" |
| 2 | … | … | … | … | … | … | … | … | … | … |

**Stat budget per tier** (rough — totals across `STR/DEX/AGI/POW/VIT/DEF/INT/LUK`):
| Tier | Stat sum | bp | mg (mastery gain) |
|---|---|---|---|
| 0 | ~8 | 30-45 | 20 |
| 1 | ~15 | 45-60 | 40 |
| 2 | ~22 | 55-75 | 60 |
| 3 | ~28 | 65-90 | 80 |
| 4 | ~35 | 80-110 | 100 |

**Effect variants** (pick from these — see `lib/game/types.ts` for the full union):

- `se` (self): `buff_def` `buff_eva` `buff_reflect` `buff_reduce` `buff_spd` `heal_pct` `heal_buff` `stack_atk` `buff_iatk_reduce` `buff_reflect_eva`
- `ee` (enemy): `debuff_eva` `debuff_acc` `debuff_def` `debuff_poison` `multi_debuff` `heavy_poison` `drain_mp` `dispel`

If you don't know which to pick, just describe the *intent* ("hits hard once, then weakens enemy defense") and I'll choose the variant.

---

## 4 · Inner arts (วิชาในกาย)

**Recommended count**: 3-5 arts.

**Tier distribution**:
- T0: 1 (foundation breath)
- T1-2: 1-2 (intermediate)
- T3: 0-1
- T4: 1 (signature)

**Per-art fields**:

| # | Thai name | Tier | Stats (sum/composition) | hL / mL | Active (`act`) | Passive (`pas`) | Types | Description |
|---|---|---|---|---|---|---|---|---|
| 1 | _e.g._ `ลมปราณเสื้อแพร` | 0 | STR 5, VIT 4 | 18 / 10 | "ตั้งแถวรับ" — `buff_reduce v18 u2 cd3` | `hit_recv 25%` → `buff_def +10 u1` | yang, external | "Foundation breath" |

**Tier budgets** (per `lib/game/data/arts.ts` headers):
| Tier | hL+mL total/lv | Stat sum at lv 10 |
|---|---|---|
| 0 | ~30 | 10 |
| 1 | ~40 | 20 |
| 2 | ~50 | 30 |
| 3 | ~60 | 40 |
| 4 | ~70 | 50 |

**Active types**: `heal`, `heal_cleanse`, `buff_reduce`, `buff_reflect`, `buff_eva_debuff_eva`, `atk_phy_pen`, `atk_int_pen`, `drain`, `drain_phy`, `drain_acc`, `debuff_poison`, `debuff_acc_dmg`.

**Passive triggers (`tr`)**: `hit_recv` (when hit) · `on_crit` · `use_int` · `use_act`.

If unsure: tell me the *flavor* ("steady defensive breath" / "burst-strike capstone") and I'll wire variants.

---

## 5 · Sect-resident NPCs

**Recommended count**: 2-4. Roles to consider: leader, elder/teacher, soldier/disciple, gatekeeper, archivist.

**Per NPC**:

| Field | Example | Notes |
|---|---|---|
| `id` | `sect_jinyiwei_leader_zhao` | snake_case; pattern `sect_<sect>_<role>_<name>` |
| Thai name | `ผู้บัญชาการจ้าวฝู่` | |
| Description (1 sentence) | `ผู้บัญชาการกรม · มือขวาขององค์จักรพรรดิ` | |
| Tier | 1-4 | drives stats and sparFameReward |
| Sparrable? | yes / no | If yes I create a matching `spar_*` opponent with sect skills + art |
| `sparFameReward` | 4-14 | scales with tier (T1=4, T4=14) |
| `defenseTier` | 1-4 | for steal/assassinate quests |
| `stealLoot` (3-5 weighted items) | `ancient_coin ×5, jade ×3, …` | |
| Hosts quests? | side / bad / both / none | If "none", they're sparring-only |
| Personality cue (1 line for ambient talk) | `พูดน้อยแต่หนัก` | informs the talk dialog |

---

## 6 · Scattered / ranged NPCs (optional)

If the sect has agents outside its hall (spies / messengers / informants), list them here. Each one gets its own ambient + offer/complete dialogs.

| Field | Example |
|---|---|
| `id` | `spy_capital_feng` |
| Cover identity | `เฟิงเจ้าของร้านบะหมี่` |
| Location | `city_capital` |
| Tier | 1-3 |
| Sparrable? | yes / no |
| Quests offered | `qst_*` and/or `qe_*` ids |

---

## 7 · Quests

Indicate the **total split** (e.g., 10 side + 5 bad, or 6 side + 0 bad). I'll distribute roughly evenly across NPCs unless you specify a different breakdown.

**Per quest** (or a freeform list — I'll write the structured form):

| Field | Notes |
|---|---|
| `id` | `qst_*` for side, `qe_*` for bad |
| Thai name | short |
| Brief summary | 1 line |
| Description | 2-3 lines |
| Giver NPC id | from §5 / §6 |
| Stages | 1-4. For each: id, description, optional `autoAdvance` condition |
| Prereqs (optional) | another quest done / trait threshold / npc relationship |
| Rewards | gold, wExp, item(s), learnSkill, learnArt, addTrait, addNpcRelationship |

**Available `autoAdvance` conditions** (from `lib/world/types.ts`):

- **Side-quest friendly**: `visitedLocation { locationId }` · `defeatedOpponent { opponentId, count? }` · `hasItem { itemId, count? }` · `flag { flag }` · `npcRelationship { npcId, min }` · `trait { trait, min }` · `questStatus { questId, status }`
- **Bad-quest only** (need a target NPC that exists in the registry): `stoleFromNpc { npcId, count? }` · `assassinatedNpc { npcId }` · `kidnappedNpc { npcId }`

For bad quests, pick targets from the existing roster. Common ones: `merchant_wang`, `city_capital_magistrate_wu`, `city_capital_physician_lin`, `villa_yaowang_doctor_shennong`, `sect_emei_abbess_jingchan`, `sect_shaolin_abbot_huiyuan`, `sect_wudang_master_qingxu`, `temple_dalun_monk_kongxin`, `palace_zhongyang_envoy_liuying`, `villa_yanzi_lord_yanfeng`, etc.

**Reward profile guidance**:
- Side: gold 250-700, wExp 80-150, npcRelationship +8 to +16, sometimes `trait good +3-5`, occasionally a sect manual or unique item.
- Bad: gold 600-900, wExp 130-160, `trait evil +8-12` (sometimes `+arrogance` / `+fame`), no skill/art rewards.

---

## 8 · Equipment line (optional)

If the sect has signature gear, list:

- Equipment id (snake_case, e.g., `eq_t3_w_jy_imperial_blade`)
- Slot: `W` (weapon) `A` (armor) `H` (head) `B` (boots) `BR` (bracer) `R` (ring) `C` (charm)
- Tier (0-4)
- Stats (small numbers per tier — see `lib/game/data/equipment.ts`)
- Optional weapon family (for W slot only)
- Sold at: which artisan or shop

---

## 9 · Sect-hall offerings (optional)

If the sect should run its own learning hall on-site (so the player can buy this lineage's tier 0-1 styles with gold):

- Skill / art ids to offer
- Per-tier price (default: skill T0 200g, T1 800g; art T0 500g, T1 2000g)

> Note: the *city* sect halls don't sell sect-affiliated styles — that's the rule from CLAUDE.md. A per-sect hall is opt-in.

---

## 10 · Save migration

Adding new content (skills / arts / NPCs / quests / scenes / opponents / items) doesn't require a save migration — they're appended to readonly tables and `validateAndRepair` drops dangling refs on rehydrate. **Don't bump `wusia-world-v1` version.**

---

## How to hand off

You can give me:

1. **A filled-in copy of this template** (most thorough), or
2. **A loose brief**: "I want a Wudang-style internal-soft sect, 5 skills 4 arts, 2 NPCs at the sect, 6 side quests, no bad quests, no spies." With that I'll fill in the table myself and confirm with you before writing the data.

Either way: if any field is missing or ambiguous, I default it from the example (Jinyiwei) and call out the assumptions in the summary.
