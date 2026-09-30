# Sect Authoring Template

> **Status (2026-09-30):** a live worksheet, checked against the code. The build steps it feeds are in [content-authoring.md → A joinable sect](../content-authoring.md#a-joinable-sect); field meanings are in [combat.md](../combat.md#data-tables); a filled-in example is [shaolin-sheet.md](shaolin-sheet.md). Current sects: [reference/sects.md](../reference/sects.md).

Fill in this template and hand it back to me. With a complete sheet I can build the entire sect (location + membership ladder + skills + arts + NPCs + quests + scenes) in one pass without follow-up questions. Skip optional sections you don't care about — defaults are noted in `(parens)`.

> Reference builds: **องครักษ์เสื้อแพร / Jinyiwei** (9-rank ladder, spies outside the hall) and **เส้าหลิน / Shaolin** (see the sheet above). Tier budgets and conventions live in `lib/game/data/skills.ts`, `lib/game/data/arts.ts` and `lib/world/data/sect-memberships.ts`.

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

**Stat budget per tier** (totals across `STR/DEX/AGI/POW/VIT/DEF/INT/LUK`). The stat sum is exact — `bun scripts/normalize-t3-stats.ts` rewrites single-line skills toward it. The bp column is the range used by existing skills:
| Tier | Stat sum (exact) | bp in use | mg (mastery gain) |
|---|---|---|---|
| 0 | 10 | 25-58 | 20 |
| 1 | 15 | 0-66 | 40 |
| 2 | 20 | 0-80 | 60 |
| 3 | 25 | 50-95 | 80 |
| 4 | 30 | 75-100 | 100 |

Optional extras: `hits: n` (multi-strike; enemy effects roll per hit), `dr` (life drain %), `vitScale` (adds `vitScale × VIT` to the skill term).

**Effect variants** (pick from these — `lib/game/types.ts` has the unions; [combat.md](../combat.md#effects) explains each):

- `se` (self, once per cast): `buff_def` `buff_eva` `buff_reflect` `buff_reduce` `buff_spd` `buff_cri` `heal_pct` `heal_buff`
- `ee` (enemy, per landed hit): `debuff_eva` `debuff_acc` `debuff_def` `debuff_atk` `debuff_def_eva` `debuff_poison` `heavy_poison` `poison_dmg` `burn_hp_mp` `multi_debuff` `drain_mp` `dispel` `stun`

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

**Tier budgets** (the values most existing arts use):
| Tier | hL+mL total/lv | Stat sum at lv 10 |
|---|---|---|
| 0 | ~30 | ~10 |
| 1 | ~40 | 15-20 |
| 2 | ~50 | 20-30 |
| 3 | ~60 | 30-40 |
| 4 | ~70 | 42-60 |

Two arts are tier 5 (`khbt`, `kuyt`); sect arts stay within 0-4.

**Active types** (14): `heal`, `heal_cleanse`, `heal_full_cleanse`, `buff_reduce`, `buff_reflect`, `buff_spd`, `buff_eva_debuff_eva`, `atk_phy_pen`, `atk_int_pen`, `drain`, `drain_phy`, `drain_acc`, `debuff_poison`, `debuff_acc_dmg`.

**Passive triggers (`tr`)**: `hit_recv` (when hit) · `on_crit` · `use_int` · `use_act`. Passive effects: `buff_def` `buff_eva` `buff_reflect` `buff_spd_cri` `heal_pct` `debuff_acc` `debuff_eva` `debuff_def` `stack_atk` (`mult_atk` / `mult_iatk` exist in the type but do nothing today — see [combat.md](../combat.md#art-passives)).

If unsure: tell me the *flavor* ("steady defensive breath" / "burst-strike capstone") and I'll wire variants.

---

## 5 · Membership (joinable sects)

Skip this section for a lore-only sect (visitable grounds, no membership — like ลิ่งจิ้วกง or พรรคเบญจพิษ). For a joinable sect I also add the `SectId`, the `SECT_MEMBERSHIPS` entry, a `hunter_<sectId>` and a redemption quest.

| Field | Options / defaults |
|---|---|
| `SectId` (short English id) | _e.g._ `jinyiwei` (the location may differ: Sun-Moon is `sunmoon` at `sect_ming`) |
| Registrar NPC | the NPC who gives the intro quest (usually the head) |
| Rank ladder | `9 → 1` (8 sects: total 6250 points), `5 → 1` (6 sects: 1850 points) or `3 → 1` (Gumu: 1600). Lower number = higher rank |
| Rank-up costs | default 9-rank table: 8:100 7:200 6:350 5:500 4:700 3:1000 2:1400 1:2000; 5-rank: 4:100 3:250 2:500 1:1000 |
| Reward pools per rank | skills and arts unlocked at each rank. One id = granted automatically; several = the player picks one |
| Join gate (intro quest `prereqs`) | always `not anySectMember`; plus any of: gender, `trait evil ≤ N` (10 for orthodox, 15-30 for unorthodox), a life-skill level, a learned art, another sect's membership |
| Intro task (stages) | _e.g._ bring 10 herbs / 10 ginseng / 10 lotus seeds; pay 500 gold + 3 materials; kidnap or assassinate a named NPC |
| Sect quests | 3-6 repeatable quests (`sectId`, 30-day cooldown after completion), 1 art quest (`isArtQuest`), optional rank-gated ones (`minSectRank`) |
| Sect points per quest | 20-200, typically 50-70 (`sectPoints` reward); the intro quest also grants some |
| Redemption quest | `qst_<sectId>_redemption`, offered only to a betrayer (`sectStatus: "betrayed"`); rewards wExp 300, humility +8, `resignSect`, relationship +10 |
| Hunter | `hunter_<sectId>`, tier 4, ambushes a betrayer on 30 % of walk ticks |

---

## 6 · Sect-resident NPCs

**Recommended count**: 2-4. Roles to consider: leader, elder/teacher, soldier/disciple, gatekeeper, archivist.

**Per NPC**:

| Field | Example | Notes |
|---|---|---|
| `id` | `sect_jinyiwei_leader_zhao` | snake_case; pattern `sect_<sect>_<role>_<name>` |
| Thai name | `ผู้บัญชาการจ้าวฝู่` | |
| Description (1 sentence) | `ผู้บัญชาการกรม · มือขวาขององค์จักรพรรดิ` | |
| Tier | 1-4 | drives stats and sparFameReward |
| Sparrable? | yes / no | If yes I create a matching `spar_*` opponent with sect skills + art |
| `sparFameReward` | 3-22 | scales with the spar opponent's tier: T1 3-5, T2 5-10, T3 8-12, T4 12-22 (18 for most sect masters) |
| `defenseTier` | 1-4 | for steal/assassinate quests |
| `stealLoot` (3-5 weighted items) | `ancient_coin ×5, jade ×3, …` | |
| Hosts quests? | side / bad / both / none | If "none", they're sparring-only |
| Personality cue (1 line for ambient talk) | `พูดน้อยแต่หนัก` | informs the talk dialog |

---

## 7 · Scattered / ranged NPCs (optional)

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

## 8 · Quests

Indicate the **total split** (e.g., 10 side + 5 bad, or 6 side + 0 bad). I'll distribute roughly evenly across NPCs unless you specify a different breakdown.

**Per quest** (or a freeform list — I'll write the structured form):

| Field | Notes |
|---|---|
| `id` | `qst_*` for side, `qe_*` for bad |
| Thai name | short |
| Brief summary | 1 line |
| Description | 2-3 lines |
| Giver NPC id | from §6 / §7 |
| Stages | 1-4. For each: id, description, and optionally an `autoAdvance` condition **or** an `objective` (🔍 map / NPC spots the player uses in person). The last stage is the "return to the giver" beat |
| Prereqs (optional) | another quest done / trait threshold / npc relationship |
| Rewards | gold, wExp, item(s), learnSkill, learnArt, addTrait, addNpcRelationship |

**Available `autoAdvance` conditions** (from `lib/world/types.ts`):

- **Side-quest friendly**: `visitedLocation { locationId }` · `defeatedOpponent { opponentId, count? }` (kills since accepting) · `hasItem { itemId, count? }` (what the hero holds now) · `goldAtLeast { amount }` · `flag { flag }` · `npcRelationship { npcId, min }` · `trait { trait, min }` · `questStatus { questId, status }`
- **Bad-quest only** (need a target NPC that exists in the registry): `stoleFromNpc { npcId, count? }` · `assassinatedNpc { npcId }` · `kidnappedNpc { npcId }`

For bad quests, pick targets from the existing roster. Common ones: `merchant_wang`, `city_capital_magistrate_wu`, `city_capital_physician_lin`, `villa_yaowang_doctor_shennong`, `sect_emei_abbess_jingchan`, `sect_shaolin_abbot_huiyuan`, `sect_wudang_master_qingxu`, `temple_dalun_monk_kongxin`, `palace_zhongyang_envoy_liuying`, `villa_yanzi_lord_yanfeng`, etc.

**Reward profile guidance**:
- Side: gold 250-700, wExp 80-150, npcRelationship +8 to +16, sometimes `trait good +3-5`, occasionally a sect manual or unique item.
- Bad: gold 600-900, wExp 130-160, `trait evil +8-12` (sometimes `+arrogance` / `+fame`), no skill/art rewards.

---

## 9 · Equipment line (optional)

If the sect has signature gear, list:

No sect has signature gear yet — this would be the first. Existing ids follow three patterns: legacy `W1`…`C5`, artisan gear `eq_t<tier>_<slot>_<material>`, and city specials `eq_<city>_<slot>_<name>` (76 pieces in all, see [reference/martial-arts.md](../reference/martial-arts.md)).

- Equipment id (snake_case, e.g., `eq_t3_w_jy_imperial_blade`)
- Slot: `W` (weapon) `A` (armor) `H` (head) `B` (boots) `BR` (bracer) `R` (ring) `C` (charm)
- Direct boosts: `atkb`, `pdb`, `idb`, `hpb`, `mpb` (+ optional `pab`, `iab`, `spdb`, `evab`, `accb`, `crib`, `resb`); keep `st: {}` (ignored)
- Optional equipment effect (`eff`)
- Sold at: which artisan (via `equipmentOfferedBy`) or as a quest reward

---

## 10 · Sect-hall offerings (optional)

If the sect should run its own learning hall on-site (so the player can buy this lineage's tier 0-1 styles with gold):

- Skill / art ids to offer
- Per-tier price (default: skill T0 200g, T1 800g; art T0 500g, T1 2000g)

> Note: the *city* sect halls don't sell sect-affiliated styles. No sect location has a hall today; members learn by rank (§ 5). A per-sect hall is opt-in: a `SectHallDef` keyed by the sect's location id.

---

## 11 · Save migration

Adding new content (skills / arts / NPCs / quests / scenes / opponents / items / a new `SectId`) doesn't require a save migration — they're appended to readonly tables and `validateAndRepair` drops dangling refs on rehydrate. **Don't bump `wusia-world-v1` version.**

---

## How to hand off

You can give me:

1. **A filled-in copy of this template** (most thorough), or
2. **A loose brief**: "I want a Wudang-style internal-soft sect, 5 skills 4 arts, 2 NPCs at the sect, 6 side quests, no bad quests, no spies." With that I'll fill in the table myself and confirm with you before writing the data.

Either way: if any field is missing or ambiguous, I default it from the example (Jinyiwei) and call out the assumptions in the summary.
