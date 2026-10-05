# Combat engine

The numbers behind every fight: stats, damage, hit and crit, levels, mastery, type conflict, effects, and the skill / art / equipment tables. All of it lives in `lib/game/` as pure TypeScript (no React, no DOM, no async).

The battle the player sees is the tactics board described in [grid-combat.md](grid-combat.md). The board decides *who acts, where they stand and whom a cast reaches*; this engine decides *what each cast does*. The grid calls `resolveSkill` / `resolveArtActive` from `lib/game/battle.ts` once per caster–target pair (see [Duel view](grid-combat.md#resolving-a-cast-the-duel-view)).

> The code and the data tables are the source of truth for numbers. `demo.html` (the original prototype) is history: MP, IA, Spd and several effects have deliberately changed since (see [demo.html](#demohtml)).

## Contents

- [Files](#files)
- [Stats](#stats)
- [Move-skill damage](#move-skill-damage)
- [Inner-art actives](#inner-art-actives)
- [Levels, mastery and type conflict](#levels-mastery-and-type-conflict)
- [Cooldowns and MP](#cooldowns-and-mp)
- [Effects](#effects)
- [Slots and the primary art](#slots-and-the-primary-art)
- [Turn-order gauge](#turn-order-gauge)
- [Power tiers](#power-tiers)
- [Data tables](#data-tables)
- [Battle log](#battle-log)
- [Skill and art icons](#skill-and-art-icons)
- [The /debug sandbox](#the-debug-sandbox)
- [Legacy 1v1 code kept for tests](#legacy-1v1-code-kept-for-tests)
- [Known quirks](#known-quirks)
- [Changing combat safely](#changing-combat-safely)

## Files

| File | What it holds |
| --- | --- |
| `lib/game/types.ts` | Every type: stats, `Derived`, `Skill`, `Art`, `Equipment`, `CharacterBuild`, the effect unions (discriminated on `t`), buff / debuff records, `BattleState`. Also `STAT_KEYS`, `WEAPON_FAMILY_KEYS`, `SKILL_TYPE_KEYS`, `SKILL_SLOT_COUNT = 10`. |
| `lib/game/index.ts` | Public barrel for UI code. |
| `lib/game/derive.ts` | Base stats → derived stats (`derive`, `deriveAll`), stat merging (`statBreakdown`, `combinedStats`), equipment totals (`getEquipBonus`), weapon mastery (`getMasteryMap`). |
| `lib/game/damage.ts` | `hitPct`, `critPct`, `CRIT_MULTIPLIER = 1.5`. |
| `lib/game/leveling.ts` | Skill and art level curves and xp costs. |
| `lib/game/skill-conflict.ts` | The yin/yang, hard/soft, internal/external penalty (`computeConflictFactors`, `getStatusFactor`, `effectiveTypes`). |
| `lib/game/slots.ts` | Slot encoding: a bare skill id or `art:<id>` (`parseSlotId`, `firstArtSlotIndex`, `placeInFirstEmpty`). |
| `lib/game/effects.ts` | Effect dispatchers, buff / debuff stacking, damage-over-time and regen ticks, `escapeBattleText`. |
| `lib/game/battle.ts` | `BattleContext`, the damage formula (`calcSkillDamage`), `resolveSkill`, `resolveArtActive`, the gauge rate (`gaugeRate`), and the legacy 1v1 turn loop. |
| `lib/game/combat-actions.ts` | `fleeChance` (live), plus the legacy guard / recover actions (tests only). Not in the barrel. |
| `lib/game/ai.ts` | Legacy 1v1 AI `runAITurn`. **No callers.** The live AI is `lib/game/grid/ai.ts`. |
| `lib/game/data/` | `tiers.ts`, `stats.ts`, `weapons.ts`, `sects.ts`, `skills.ts`, `arts.ts`, `equipment.ts` (+ `index.ts`). |

Imports that bypass the barrel: `components/game/battle-arena.tsx` imports `fleeChance` from `@/lib/game/combat-actions`; `store/battle-store.ts` and `lib/world/battle-looks.ts` import `@/lib/game/types`; `lib/world/validate.ts` and `lib/world/rumor-engine.ts` import the `*_BY_ID` maps from `lib/game/data/*`. The grid layer has its own barrel, `lib/game/grid/index.ts`.

## Stats

### Base stats

Eight base stats (`STAT_KEYS`, labels in `lib/game/data/stats.ts`):

| Key | Thai | Key | Thai |
| --- | --- | --- | --- |
| STR | กำลัง | DEX | เฉียบคม |
| AGI | ความเร็ว | LUK | โชค |
| POW | ภายใน | DEF | ป้องกัน |
| VIT | ร่างกาย | INT | ฉลาด |

A new world hero starts with every stat at 1 and a flat `baseHp` of 100 (so 136 HP, not 36). The /debug sandbox gives a 200-point budget (`STAT_BUDGET`). In the world, stats grow through stat xp (see [gameplay.md](gameplay.md#stats)).

### Derived stats

`derive(stats)` (`lib/game/derive.ts`):

| Derived | Formula |
| --- | --- |
| HP | `VIT×20 + DEF×10 + STR×3` |
| MP | `POW×5 + INT×5` |
| Atk | `STR×3 + AGI + POW + DEX + INT×2` |
| PA (physical attack) | `STR×2 + DEX + LUK` |
| IA (internal attack) | `POW×4 + DEX + LUK` |
| PD (physical defence) | `DEF×2 + VIT + INT×2` |
| ID (internal defence) | `DEF×2 + POW + VIT + INT×2` |
| Eva | `AGI×2` |
| Acc | `DEX×2` |
| Cri | `STR + LUK` |
| Res | `LUK + floor(DEF×0.5)` |
| Spd | `max(AGI×2 + POW, 1)` |

### Where the stats come from

`statBreakdown(build)` splits a build's stats into five buckets; `combinedStats` = base + arts + skills + meridians (everything but equipment).

1. **base** — `build.stats`.
2. **fromArts** — the active art (`build.artId`) adds `floor(stat × artLevel/10 × conflict)` per stat; every other art in `learnedArtIds` adds the same with its own level (`artLevels[id] ?? 1`).
3. **fromSkills** — every slotted skill and every learned skill (counted once) adds its `st` bonus × `bpMultiplier(level)` × conflict. A fresh level-1 skill gives half its listed stats; level 10 gives all.
4. **fromEquipment** — the legacy `st` field of equipment. **Always zero**: every item has `st: {}` and `combinedStats` leaves equipment out on purpose.
5. **fromMeridians** — the base stats of every opened meridian point (ชีพจร, [below](#meridians-ชีพจร)), flat: no level or conflict scaling.

`deriveAll(build)` then:

1. derives from `combinedStats`;
2. adds art HP / MP: `floor(hL × level × conflict)` and `floor(mL × level × conflict)` for the active art and each learned art;
3. adds the build's flat `baseHp` to HP (the world hero carries `HERO_BASE_HP` = 100 from `store/world-store.ts`; foes and /debug builds have none);
4. adds equipment and meridian combat fields directly to the derived values (`getBuildBonus` = `getEquipBonus` + the meridian `combat` bonus): `Atk += atkb`, `PD += pdb`, `ID += idb`, `HP += hpb`, `MP += mpb`, `PA += pab`, `IA += iab`, `Spd += spdb`, `Acc += accb`, `Res += resb`, `Cri += crib + flat_cri`, `Eva += evab + flat_eva`.

`pct_atk`, `pct_reduce` / `pct_red` and `hp_regen` (equipment and meridians) are not folded into `Derived`; the battle reads them from `ctx.equipBonus`, which `makeContext` fills with `getBuildBonus(build)` — so 1v1, grid duels (`pairContext`) and the grid AI's damage estimate all see meridians.

### Meridians (ชีพจร)

`lib/game/meridians.ts` (pure; types and constants in `meridian-types.ts`, the 95 charts in `data/meridians.ts`).

- A build's learned charts are `build.meridians`: chart id → one rank (0–3) per point. A learned chart with nothing opened is all zeros.
- Points open in order: point i needs point i−1 at rank ≥ 1 (`meridianNodeState`: `locked | open | max`).
- Raising a point of a tier-`ti` chart to rank r costs `(ti + 1) × r` meridian points (`meridianRankCost`, `meridianNextCost` → null at rank 3); a full chart costs `points × 6 × (ti + 1)` (`meridianChartFullCost`).
- A point at rank r gives its ranks 1..r added together (`meridianRankBonus`); `meridianChartBonus` and `meridianBuildBonus` sum them into `{ stats, combat }`.
- `stats` (STR…INT) join `combinedStats` as `fromMeridians`; `combat` (the `EquipBonus` keys: `atk pd id_ hp mp pa ia spd acc res cri eva pct_atk pct_red hp_regen`) join `deriveAll` and the battle context through `getBuildBonus`.
- Charts per tier: T0 20 (1–2 points), T1 20 (3–4), T2 15 (5–6), T3 15 (7–8), T4 15 (9–10), T5 10 (12). The world side (points, chart items, sources) is in [world-engine.md](world-engine.md#meridians-ชีพจร).

#### Battle effects of filled points

A point may carry `effects` (`MeridianEffect`), live only at rank 3: `meridianActiveEffects(build)` lists them, `makeContext` stores them as `ctx.meridian[side]`, and `lib/game/meridian-battle.ts` runs them. Durations count the owner's own turns (stored as `u = turns + 1`, since statuses tick at the start of the owner's turn).

| Effect | When | What (status `t`) |
| --- | --- | --- |
| `opening {stat, v, turns}` | grid battle start (`meridianStart`) | atk → `buff_atk_pct`, def → `buff_def_pct`, spd → `buff_spd_pct`, cri → `buff_cri_rate`, acc → `buff_acc_pct`, reduce → `buff_reduce`, eva → `buff_eva` (flat: v % of Eva); `n` = `เปิดฉาก·<stat>` |
| `shield {pct}` | battle start | `shield`, v = pct % of max HP; soaks attack hits before HP (`landDamage`), removed at 0; never ticks down |
| `ward {count}` | battle start | `ward`, v = charges; `addDebuff` (every debuff path: skills, arts, passives, weapons, saps) blocks the debuff and spends one; never ticks down |
| `revive {hpPct}` | battle start → `GridUnit.revive` | a unit at 0 HP rises with hpPct % of max HP, once (`settle` / after a cast; not reported `killed`) |
| `rage {element, v, turns, chance, maxStacks}` | each landed hit on the unit (`rollRage`) | one record per stack, `el` set, own timer; at `maxStacks` the oldest renews. fire `buff_atk_pct`, water `buff_regen`, wind `buff_spd_pct`, earth `buff_def_pct`, thunder `buff_cri_rate`; `n` = `MERIDIAN_ELEMENT_LABEL` |
| `sap {stat, v, turns, chance}` | once per target an attack landed on (`rollSaps`) | atk → `debuff_atk` −v %, spd → `debuff_spd` −v %, def / eva / acc → `debuff_def` / `debuff_eva` / `debuff_acc` of −v % of the target's (PD+ID)/2 / Eva / Acc |

The math: `buff_atk_pct` adds to the move multiplier (like gear `pct_atk`) and scales Atk in art actives; `buff_def_pct` scales the defender's PD / ID; `buff_cri_rate` adds points after `critPct` (cap 100); `buff_acc_pct` scales Acc; `buff_spd_pct` − `debuff_spd` scale the gauge fill (`spdWithPct`: `(Spd + 60) × (1 + p/100) − 60`); `buff_regen` heals v % of max HP after the tick at the start of the owner's turn. The % buffs never merge (`addBuff` keeps each record). The grid AI's estimates mirror all of it. Foes have no meridians, so nothing changes for them. Triggers are collected on the view (`BattleState.procs`) and become grid `proc` events ([grid-combat.md](grid-combat.md#meridian-procs)).

Consequences worth knowing:

- An art that sits only in a skill slot (not `artId`, not in `learnedArtIds`) gives its active and passive but **no stats, HP or MP**. The world always adds learned arts to `learnedArtIds`, so this only bites in /debug.
- Low-level arts give almost no stats because of `floor` (at level 1, `STR 6 × 0.1` floors to 0).
- A fight snapshots the derived stats at the start (`unit.derived` in the grid); stat changes mid-fight come only from buffs and debuffs.

## Move-skill damage

`calcSkillDamage(state, side, skill, ctx)` in `lib/game/battle.ts` runs once per hit for skills with an attack type (`at` = `"phy"` or `"int"`):

```
raw = max(1, (Atk × sm × ab + ta + se) × dm × mm − ed) × (1 − pR/100)
dmg = round(raw × riposte × (crit ? 1.5 : 1))
```

| Term | Meaning |
| --- | --- |
| `Atk` | attacker's derived Atk |
| `sm` | stack modifier: `max(0, 1 + stk×stkV/100 + equipment pct_atk/100 + Σ debuff_atk/100)` (scales the Atk term only) |
| `ab` | art bonus: 1.10 for int skills when the primary art is `scholar`, else 1 |
| `ta` | typed attack: `PA` for physical skills, `IA × im` for internal skills; `im = 1 + Σ buff_iatk/100`, ×1.12 more for int skills when the primary art is `taiji` |
| `se` | skill effect: `effectiveBp(skill, level) × conflict × (1 + p/100) + f + vitScale × VIT` |
| `dm` | the skill's damage multiplier |
| `mm` | mastery: `1 + (mastery[family]/200) × 0.5` (max ×1.5) |
| `ed` | effective defence: `max(0, (PD for phy / ID for int) + Σ buff_def − Σ |debuff_def|)` |
| `pR` | percent reduction: `Σ defender buff_reduce + defender equipment pct_reduce` (not clamped at 100) |
| `riposte` | legacy guard bonus (1 + v/100) — unreachable in the game today |

`buff_def` / `debuff_def` change whichever defence the attack targets (PD or ID). `stack_atk` and `pct_atk` scale only the Atk term, not PA / IA / the skill term.

### Hit and crit

- Hit: `hitPct(acc, eva) = clamp(80 + (acc − eva)/4, 5, 95)`. Attacker accuracy includes `debuff_acc`; defender evasion includes `debuff_eva` and `buff_eva`.
- Crit: `critPct(cri, res) = clamp(3 + (cri − res)/3, 0, 75)`; attacker Cri includes `buff_cri`. A crit multiplies by 1.5 after `raw`, then rounds.

### Multi-hit, drain and reflect

`resolveSkill(state, side, slotIdx, skillId, ctx, opts?)`:

- `hits` (default 1) rolls hit and crit per hit; each hit deals `round(dmg / hits)`, so the total approximates one full hit. 51 skills are multi-hit (up to 15 hits for `tang_starrain`).
- For each **landed** hit, in order: the target loses HP and counts a hit received → life drain `round(perHit × dr/100)` heals the caster → reflect → the weapon's `on_hit` debuff → the caster's `on_crit` passive (if crit) → the target's `hit_recv` passive → the caster's `use_int` passive (int skills) → the skill's enemy effect `ee` → win check.
- `ee` applies **per landed hit** (stackable debuffs accumulate). A miss does nothing but log "พลาด!".
- The skill's self effect `se` applies **once per cast**, after the hits.
- Reflect is consumed on the first landed hit and divided by the hit count, so multi-hit skills take much less reflect.
- A skill with `at: null` (5 skills: `rf`, `cs`, `yy`, `ig`, `pn`) rolls no damage; it applies `ee` once.
- Cooldown and the use counter are set before the hits. A stunned caster loses the turn with no cooldown and no use recorded.

`opts.tick: false` skips the global effect tick (the grid ticks each unit on its own turn). `opts.secondary: true` is used for extra area targets: no cooldown, no use count, no self effect, no stun check — only damage rolls and `ee`.

## Inner-art actives

`resolveArtActive(state, side, ctx, opts?)` fires an art's active (`act`). It fails (returns `false`) when the art has no active, is on cooldown, or MP is short. Otherwise it pays `act.c` MP, sets the cooldown `act.cd`, counts the use, and resolves by type:

| `act.t` | Fields | Effect | Arts |
| --- | --- | --- | --- |
| `atk_phy_pen` | `m`, `pen` | `max(1, (Atk+PA)·m − (PD·(1−pen/100) + Σbuff_def)) × (1−pR/100)` | 25 |
| `atk_int_pen` | `m`, `pen` | same with IA / ID | 10 |
| `drain` | `m`, `h` | `(Atk+IA)·m − (ID+Σbuff_def)`, heals `h`% of the damage | 5 |
| `drain_phy` | `m`, `h` | `(Atk+PA)·m − (PD+Σbuff_def)`, heals `h`% | 2 |
| `drain_acc` | `m`, `h`, `adv` | debuff_acc `adv` for 2 turns, then like `drain` | 2 |
| `debuff_acc_dmg` | `ad`, `u`, `dm` | debuff_acc `ad`, then `(Atk+IA)·dm − (ID+Σbuff_def)` | 4 |
| `debuff_poison` | `pp`, `ev`, `u` | poison `pp`% + debuff_eva `ev`, no hit roll | 4 |
| `heal` | `h` | heal `h`% of max HP | 16 |
| `heal_cleanse` | `h` | heal, remove the last debuff | 15 |
| `heal_full_cleanse` | `h`, `mh` | heal HP `h`% and MP `mh`%, clear all debuffs | 1 (`kuyt`) |
| `buff_reflect` | `v`, `u` | replace the caster's reflect buff | 14 |
| `buff_reduce` | `v`, `u` | replace the caster's damage-reduction buff | 17 |
| `buff_spd` | `v`, `u` | add a speed buff (stacks) | 1 (`khbt`) |
| `buff_eva_debuff_eva` | `selfV`, `eneV`, `u` | replace the caster's evasion buff, debuff the target's evasion | 7 |

Damage actives roll hit (same Acc / Eva rule) and crit (×1.5), but **ignore** mastery, attack stacks, equipment `pct_atk`, `debuff_atk`, `buff_iatk`, the taiji / scholar bonus, the target's `debuff_def` and the target's equipment `pct_reduce` (only its `buff_reduce` counts). After the switch, the activated art's `use_act` passive fires, and the primary art's `use_int` passive fires for internal-type actives. A stunned caster still pays the MP and cooldown. Misses are reported to the renderer as 0-damage hits.

## Levels, mastery and type conflict

### Skill and art levels

`lib/game/leveling.ts` — levels run 1–10 for both.

| Function | Formula | Notes |
| --- | --- | --- |
| `bpMultiplier(lv)` | `0.5 + (lv−1)/18` | lv 1 = 0.5, lv 10 = 1.0; scales `bp` and a skill's `st` bonus |
| `mgMultiplier(lv)` | `1 + (lv−1)/9` | lv 1 = 1.0, lv 10 = 2.0; scales mastery gain |
| `effectiveBp(skill, lv)` | `bp × bpMultiplier(lv)` | |
| `effectiveMg(skill, lv)` | `mg × mgMultiplier(lv)` | |
| `xpToNextLevel(skill, lv)` | `50 × lv × (tier + 1)` | 1→10 costs 2 250 × (tier+1) |
| `xpToNextArtLevel(art, lv)` | `100 × lv × (tier + 1)` | twice the skill cost; 1→10 costs 4 500 × (tier+1) |

Arts scale their `stats` by `level/10` and add `hL` / `mL` HP / MP per level. Where the xp comes from (battle use, practice, w-exp) is in [gameplay.md](gameplay.md#progression).

### Weapon mastery

`getMasteryMap(skillIds, skillLevels, conflict)`: every **slotted** skill adds `effectiveMg(skill, level) × conflict` to its weapon family (`fist`, `long`, `sword`, `blade`, `short`, `hidden`, `music`), capped at 200 per family. In damage, one multiplier per family: `1 + mastery/200 × 0.5`, so at most ×1.5 for every skill of that family.

### Type conflict

`computeConflictFactors(build)` in `lib/game/skill-conflict.ts`:

- Counted entries: every distinct slotted or learned skill and every learned art (not `none`). **Untyped entries count toward the trigger too.**
- The penalty needs at least 5 entries (`> CONFLICT_MIN_LEARNED = 4`).
- For each axis pair, if one side holds more than 60 % (`CONFLICT_THRESHOLD`) of the pair's tags, the other side gets a factor: `yang ⇄ yin` and `hard ⇄ soft` halve it (×0.5), `internal ⇄ external` zeroes it (×0). `balance` tags are never tallied.
- `effectiveTypes(item)`: the item's `types`; a skill with no tags falls back on its attack type (`phy` → external, `int` → internal).
- `getStatusFactor(item)` = the lowest factor over the item's tags. It scales a skill's `bp`, `st` and `mg`, and an art's `stats`, `hL` and `mL`. It does **not** touch effects, art actives or passives.

## Cooldowns and MP

- A move skill's cooldown is `TIERS[ti].cd`: 0 / 2 / 3 / 4 / 5 / 6 for tiers 0–5. Tier-0 skills have no cooldown.
- An art active's cooldown is `act.cd` (3 for 97 arts, 4 for 24, 6 for 2) and it costs `act.c` MP (12–60).
- In the grid, cooldowns count down at the start of the unit's own turn; a slot is ready at 0, and an art slot also needs enough MP. Cooldown N therefore means "usable every N own turns".

## Effects

All effect unions are discriminated on `t`. The dispatchers are in `lib/game/effects.ts` (skills, passives, ticks) and `lib/game/battle.ts` (art actives). The switches are plain `switch` statements with **no exhaustiveness guard** — a missing case silently does nothing.

### Self effects (skill `se`)

| `t` | Fields | Meaning | Skills |
| --- | --- | --- | --- |
| `buff_reflect` | v, u | reflect v% of the next landed hit | 8 |
| `buff_eva` | v, u | Eva +v | 11 |
| `buff_reduce` | v, u | damage taken −v% | 4 |
| `buff_def` | v, u | +v to the targeted defence | 8 |
| `buff_spd` | v, u | +v Spd for turn order | 3 |
| `buff_cri` | v, u | Cri +v | 0 |
| `heal_pct` | v | heal v% of max HP | 5 |
| `heal_buff` | hp, bt, bv, bu | heal hp% plus a def / eva / reduce buff | 2 |
| `stack_atk` | v, mx | +1 attack stack (max `mx`), each worth v% of Atk; lasts the battle | 20 |
| `buff_iatk_reduce` | iv, rv, u | IA buff plus damage reduction | 0 |
| `buff_reflect_eva` | rv, ev, u | reflect plus Eva | 0 |

### Enemy effects (skill `ee`)

| `t` | Fields | Meaning | Skills |
| --- | --- | --- | --- |
| `debuff_eva` | v, u | Eva + v (negative) | 19 |
| `debuff_acc` | v, u | Acc + v | 24 |
| `debuff_def` | v, u | defence −\|v\| | 25 |
| `debuff_atk` | v, u | the target's attack modifier + v% | 1 |
| `multi_debuff` | av, ev, u | debuff_acc + debuff_eva | 10 |
| `debuff_def_eva` | dv, ev, u | debuff_def + debuff_eva | 7 |
| `poison_dmg` | pp, u | pure poison: pp% of max HP per tick (the Tang and jianghu poison weapons) | 7 |
| `debuff_poison` | pp, u, ev | poison pp% **plus** debuff_eva ev | 3 |
| `heavy_poison` | pp, u, av, ev | poison plus debuff_acc and debuff_eva | 1 |
| `burn_hp_mp` | dmg, mp, u | burn dmg% HP and mp% MP per tick | 2 |
| `stun` | u, ch | ch% chance to stun | 1 (`sl_truth_staff`) |
| `drain_mp` | v | move v% of the target's MP to the caster | 0 |
| `dispel` | acc, u | remove the target's first buff, add debuff_acc | 0 |

### Equipment effects (`eff`)

| `t` | Meaning |
| --- | --- |
| `pct_atk` v | attack modifier + v% (move skills only) |
| `flat_cri` v / `flat_eva` v | derived Cri / Eva + v |
| `pct_reduce` v | damage taken −v% (move-skill hits only) |
| `hp_regen` v | v% of max HP per tick |
| `on_hit` `{db}` | on each landed move-skill hit, add a debuff to the target — **weapon (W) slot only** |

### Art passives

`pas = { tr, ch, d, e }`: when trigger `tr` happens, `e` fires with `ch`% chance. Only the **primary art** (see [below](#slots-and-the-primary-art)) has live passives.

| Trigger | When | Arts |
| --- | --- | --- |
| `hit_recv` | the holder takes a landed skill hit | 41 |
| `on_crit` | the holder lands a move-skill crit | 30 |
| `use_int` | the holder lands an int skill hit or uses an int-type active | 31 |
| `use_act` | right after that art's own active | 21 |

Passive effects: `buff_def`, `buff_eva`, `buff_reflect`, `buff_spd_cri` (speed and crit together, `khbt`), `heal_pct`, `debuff_acc`, `debuff_eva`, `debuff_def`, `stack_atk`, `mult_iatk`, `mult_atk`.

`mult_iatk` and `mult_atk` do **nothing in the dispatcher**. Their only real effect is hard-coded in `calcSkillDamage` for two art ids: `taiji` (IA ×1.12 on int skills) and `scholar` (Atk ×1.10 on int skills), applied whenever that art is primary. Nine other arts carry these passives with no effect: `t4_em_bodhi`, `qzzq`, `t3_sm_dualfusion`, `qiankun`, `t3_xy_seepower`, `bmzq`, `bmsg`, `t3_heartmind`, `shenzhao`.

### Buffs, debuffs and ticks

- **Stack** (value adds up, duration = the longer one): `buff_def`, `buff_eva`, `buff_reduce`, `buff_reflect`, `buff_spd`, `buff_iatk`; `debuff_def`, `debuff_eva`, `debuff_acc`, `debuff_atk`.
- **Replace** (a new one overwrites): `buff_cri`, `debuff_poison` (also used by `poison_dmg`), `burn_hp_mp`, `stun`. The art actives `buff_reflect`, `buff_reduce` and `buff_eva_debuff_eva` also replace.
- **Caps**: ±100 for `buff_reduce` and `buff_reflect`, ±200 for everything else.
- **Tick** (`tickSideEffects` in the grid, once at the start of the unit's own turn): poison and burn damage, then every duration −1 and expired records removed, then regen (equipment `hp_regen`, and the primary art's `hpRegenPct` / `mpRegenPct` aura — only `kuyt`, 5 % / 5 %). Durations therefore count the **owner's own turns**. Almost all authored durations are 5.
- **Stun**: a `stun` debuff with `u > 0` skips the unit's turn. The tick lowers `u` before the check, so `u: 3` skips two turns.

## Slots and the primary art

- A build has 10 slots (`SKILL_SLOT_COUNT`); each holds `null`, a skill id, or `art:<artId>` (`ART_SLOT_PREFIX`). `parseSlotId` returns `{ kind: "skill", skill }`, `{ kind: "art", art }` or `null`.
- The **primary art** is the first `art:` slot, or else `build.artId`. It drives passives, the aura regen and the taiji / scholar bonuses. Other slotted arts can still fire their actives; `use_act` belongs to whichever art fired.
- `BattleContext` (`makeContext`) carries names, primary art ids, the weapon id, equipment totals, masteries (slotted skills, with level and conflict), skill levels, conflict factors and `combinedStats` (no equipment).

## Power tiers

`lib/game/power-tier.ts` gives every fighter one power score and one of twelve named tiers. It counts what was trained and never what is worn:

```
score = Σ stats            (combinedStats: base + inner-art and move-skill bonuses, conflict-scaled; no equipment)
      + ½ × Σ effectiveBp  (the slotted move skills, at their levels)
      + Σ (tier + 1) × level   (every known inner art; the active one at artLevel)
```

| Tier | Name | From | Colour |
| --- | --- | --- | --- |
| 1 | สามัญชน | 0 | grey #8b8d84 |
| 2 | ศิษย์ฝึกหัด | 25 | parchment #d8cfb2 |
| 3 | ศิษย์สำนัก | 45 | green #6cae55 |
| 4 | มือดีประจำถิ่น | 75 | teal #1f7a6d |
| 5 | ท่องเที่ยวทั่วหล้า | 120 | blue #2a6cbf |
| 6 | ผู้เชี่ยวชาญวรยุทธ์ | 180 | indigo #5148c4 |
| 7 | ฝีมือล้ำลึกเหนือคน | 260 | purple #8640bb |
| 8 | วรยุทธโดดเด่นใต้หล้า | 370 | magenta #b3327f |
| 9 | จอมยุทธไร้พ่าย | 520 | red #bf2f25 |
| 10 | ปรมาจารย์ยุทธภพ | 720 | orange #e9802a |
| 11 | เป็นหนึ่งในยุทธจักร | 1000 | gold #ecc338 |
| 12 | ยอดคนใต้หล้า | 1400 | radiant gold, glowing |

- **Calibration.** Each threshold is about 1.4× the last. The 286 opponents fall in tiers 1–10 (a fresh hero and the capital's trainee in 1, the median foe in 5, the strongest sect masters in 10). Tiers 11–12 are for a hero who trains past them.
- **API.** `powerBreakdown(build)` (stats / moves / arts / total), `powerScore`, `powerTierOf(score)`, `powerTier(build)`, and `powerOutlook(heroTier, foeTier)`: `deadly` (foe 2+ tiers up), `stronger`, `even`, `weaker`, `trivial` (2+ down).
- **Names and colours on screen.** Each tier has its own colour (`color`, with a text `ink` that reads on it at ≥ 4.5:1 contrast), shown as a badge (`components/world/power-tier-badge.tsx`); the top tier glows gold (`.power-tier-peak`; the pulse stops under reduced motion). Players see the tier's name, never its number or the score; the numbers stay internal (ordering, the verdict, `data-*` test attributes).
- **Where it shows.** Before every fight (the briefing screen, or the random-encounter screen) with the foe's tier, its pack's strongest, the hero's tier and the outlook; and on the profile under the hero's name. Opponents are scored after the progression stat scale, so the warning matches the fight. See [architecture.md](architecture.md#the-battle-bridge).
- **Tests.** `test:combat` checks the table (distinct names and colours, readable text), the formula and that gear does not count; `test:grid-store` checks the briefing.

## Turn-order gauge

Each unit fills a gauge at `gaugeRate(spd) = (spd + 60) / 2600` units per millisecond and acts at 100, keeping any overflow. So Spd 200 fills in 1 s, Spd 100 in about 1.6 s, Spd 20 in about 3.25 s, and the turn ratio between two units is `(SpdA + 60) / (SpdB + 60)` — Spd 100 vs 20 is 2:1, Spd 200 vs 100 is only 1.625:1. The `+60` baseline is deliberate: it keeps slow characters in the fight. Don't replace it with a straight Spd comparison.

The grid engine runs this gauge per unit (`advanceGauges`, `predictOrder` in `lib/game/grid/engine.ts`, with `unitSpd` adding `buff_spd`). The 1v1 versions in `battle.ts` (`tickGauges`, `getNextTurn`, `predictTurnOrder`) are only used by tests.

## Data tables

Exact lists with every id: [reference/martial-arts.md](reference/martial-arts.md). Short field names are kept on purpose (they match `demo.html` and make 100-row tables scannable).

**Tiers** (`TIERS`, `lib/game/data/tiers.ts`): 0 พื้นฐาน · 1 ขั้นกลาง · 2 ขั้นสูง · 3 ลับ · 4 เฉพาะ · 5 ปรมัตถ์ (cooldowns 0–6). Skills use tiers 0–4; three arts are tier 5 (`khbt` คัมภีร์ทานตะวัน, `kuyt` วิชาเก้าเอี้ยง and `kgim` คัมภีร์เก้าอิม).

**Sects** (`lib/game/data/sects.ts`): `SECT_ORDER` lists 21 names in display order, ending with `JIANGHU_SECT` = ยุทธจักร (unaffiliated). Both tables are sorted by sect, then tier (`bun scripts/sort-by-sect.ts`). ลิ่งจิ้วกง and พรรคอสูรโลหิต have no skills or arts yet.

**Weapon families** (skills only; equipment has none): `fist` หมัด/ฝ่ามือ 58 · `sword` กระบี่ 56 · `hidden` อาวุธลับ 21 · `long` อาวุธยาว 19 · `blade` ดาบ 12 · `short` อาวุธสั้น 7 · `music` เครื่องดนตรี 5.

### Move skills (`SKILLS`, `lib/game/data/skills.ts`) — 178

Per tier 32 / 37 / 42 / 41 / 26; 9 beast moves (`bst_*`, used by hunting beasts); 117 physical, 56 internal, 5 with no damage roll.

| Field | Meaning |
| --- | --- |
| `id`, `n` | id and Thai name |
| `sc` | sect (must be in `SECT_ORDER`) |
| `ti` | tier — sets the cooldown and xp cost |
| `w` | weapon family (mastery bucket) |
| `mg` | mastery gained while slotted (standard `20 × (ti+1)`) |
| `st` | stat bonus; the sum is exactly 10 / 15 / 20 / 25 / 30 for tiers 0–4 (`bun scripts/normalize-t3-stats.ts` rewrites toward it) |
| `at` | `"phy"` (PA vs PD), `"int"` (IA vs ID) or `null` (no damage roll) |
| `bp`, `p`, `f` | base power, % boost on it, flat add |
| `dm` | damage multiplier |
| `dr?` | life drain % |
| `vitScale?` | adds `vitScale × VIT` to the skill term (3 skills) |
| `hits?` | number of hits (default 1) |
| `se`, `ee` | self effect (once per cast), enemy effect (per landed hit) |
| `d` | description |
| `types?` | conflict tags |

### Inner arts (`ARTS`, `lib/game/data/arts.ts`) — 122

`ARTS[0]` is the `none` placeholder (`getArt` falls back to it and never returns null). Per tier 18 / 19 / 20 / 27 / 37 / 2. Every art has both an active and a passive.

| Field | Meaning |
| --- | --- |
| `id`, `n`, `sc`, `ti` | as for skills (tiers 0–5) |
| `tp` | display-only type text |
| `stats` | stat bonus at level 10 (scaled by `level/10`) |
| `hL`, `mL` | HP and MP per level |
| `act` | active: `n` name, `c` MP, `cd` cooldown, `t` type, `d` text, plus per-type fields (see [Inner-art actives](#inner-art-actives)) |
| `pas` | passive `{ tr, ch, d, e }` |
| `hpRegenPct?`, `mpRegenPct?` | aura regen per tick (primary art only) |
| `types?` | conflict tags (arts with no tags are neutral) |

### Equipment (`EQUIPMENT`, `lib/game/data/equipment.ts`) — 76

Per slot: W 21 · A 10 · H 9 · B 9 · BR 10 · R 8 · C 9. A loadout has 10 slots: W, A, H, B, two BR, two R, two C.

| Field | Meaning |
| --- | --- |
| `id`, `n`, `ty` | id, Thai name, slot type |
| `atkb`, `pdb`, `idb`, `hpb`, `mpb` | direct boosts (required) |
| `pab?`, `iab?`, `spdb?`, `evab?`, `accb?`, `crib?`, `resb?` | direct boosts (optional) |
| `st` | legacy base-stat boost — **ignored**, keep `{}` |
| `eff` | equipment effect or `null` |
| `instrument?` | a musical instrument (the music life skill needs one in the W slot) |

## Battle log

- `escapeBattleText` (`lib/game/effects.ts`) escapes `& < > " '` in every character name before it enters a log line; `scripts/test-runtime.ts` checks it with an `<img onerror>` name. Skill, art and item names are authored data and are not escaped.
- A skill line reads `[turn] name → <b>skill</b>{tag} dmg (ตี h/n) <span class="lp">[hit% crit%]</span>`; a crit renders as `<span class="lC">★CRIT! n</span>`. Status lines start with `&nbsp;` and a glyph (⟳ self, ✗ enemy, ◆ passive, ☠ poison, 🔥 burn, 💊 regen, 🌱 aura, ↩ reflect, 🗡 on-hit).
- `components/game/battle-log.tsx` renders lines newest first with `dangerouslySetInnerHTML`; `.lp` and `.lC` are styled in `app/globals.css`.
- Every cast records `state.lastCast` (`hits`, per-hit damage / crit / miss, `tier`, `source`), which the grid turns into events and the renderer turns into VFX.

## Skill and art icons

`SkillIcon` / `ArtIcon` (`components/game/skill-icon/`) draw a 64×64 icon: a tier frame, the glyph, type accents and a "×N" badge for multi-hit skills. The glyph is the raster PNG (`public/icons/skills/<id>.png`, `public/icons/arts/<id>.png` — every skill and art has one), else a hand-drawn SVG override (`skill-icons-batch-*.tsx`), else a generic weapon / art glyph. Tier colours: T0 stone, T1 emerald, T2 sky, T3 purple, T4 orange, T5 red.

## The /debug sandbox

`app/debug/page.tsx` (not linked from the game; open `/debug`) has three tabs:

1. **ตั้งค่า + วิชา** — two `CharacterCard`s (A and B): name, an NPC preset picker (loads any opponent's build), stat sliders against the 200-point budget, derived stats, 10 skill / art slots with level sliders and a mastery preview, and 9 equipment slots.
2. **คลังวิชา** — a table of every move skill (`SkillLibrary`).
3. **สมรภูมิ** — `<BattleArena mode="free" />`: the same grid battle as the game, between build A and build B, with เริ่มใหม่ and Reset.

Builds persist in `localStorage["wusia-character-v1"]` (version 3, `store/character-store.ts`). The world never reads this store. There is no art picker in the UI, so a hand-slotted art in /debug has no stats (see [Where the stats come from](#where-the-stats-come-from)).

## Legacy 1v1 code kept for tests

The first version was a real-time 1v1 battle. These pieces remain but the game no longer calls them:

- the 1v1 turn loop in `battle.ts`: `makeInitialState`, `tickGauges`, `peekReadyActor`, `consumeGauge`, `getNextTurn`, `predictTurnOrder`, `decrementCooldowns`, the `iaCD` art cooldown, `castEndsAt`;
- `runAITurn` in `ai.ts` (no callers at all);
- guard (ตั้งรับ: 2 MP, 35 % damage reduction, a 20 % riposte on the next physical hit) and recover (รวบรวมปราณ: +20 % max MP, Eva −15) in `combat-actions.ts` (`resolveCombatAction`).

`bun run test:combat` still checks them, and `scripts/test-capital-training.ts` uses the 1v1 loop as a balance check. The live battle bar offers skills, รอ, ถอยหนี and อัตโนมัติ only. `fleeChance` in `combat-actions.ts` is the one live function: `clamp(50 + (SpdA − SpdB)/4, 20, 90)`.

## demo.html

The single-file prototype at the repo root (excluded from TypeScript). It has its own 94 skills, 25 arts and 35 items, and older formulas. The current code has deliberately moved on:

| Topic | demo.html | Now |
| --- | --- | --- |
| MP | POW×12 + INT×4 | POW×5 + INT×5 |
| IA | POW×2 + … | POW×4 + … |
| Spd | AGI×2 | AGI×2 + POW |
| Attack stacks | fixed 3 % per stack | per source (`stkV`) |
| Equipment `st` | used | ignored |

It has no multi-hit, `vitScale`, `poison_dmg`, burn, stun, type conflict, skill levels or tier 5.

## Known quirks

These are how the code behaves today; fix them deliberately, with tests.

1. `mult_iatk` / `mult_atk` passives only work for `taiji` and `scholar`; nine arts carry them for nothing.
2. Art actives skip mastery, stacks, `pct_atk`, the target's `debuff_def` and equipment `pct_reduce`; a stunned caster still pays MP and cooldown; art misses are reported as 0-damage hits.
3. Reflect is consumed on the first hit of a multi-hit skill and divided by the hit count.
4. Percent reduction is not clamped at 100; in an extreme stack, reflect and drain could turn negative.
5. The effect switches have no exhaustiveness guard. Only `components/game/buff-descriptions.tsx` is compiler-checked, for buff / debuff record types.
6. `components/world/skill-tooltip.tsx` (`describeEffect`) has no text for `buff_cri`, `debuff_atk`, `debuff_def_eva`, `burn_hp_mp`, `poison_dmg` or `stun`, so about 18 skill tooltips show the raw effect name.
7. `lib/game/grid/ai.ts` re-implements the damage formulas as an estimator. Change both together.
8. Unused but dispatched: self effects `buff_cri`, `buff_iatk_reduce`, `buff_reflect_eva`; enemy effects `drain_mp`, `dispel`.

## Changing combat safely

1. Change the formula or data in `lib/game/`.
2. Mirror damage changes in the grid AI estimator (`lib/game/grid/ai.ts`), and add tooltip text (`components/world/skill-tooltip.tsx`) and a badge label (`components/game/buff-descriptions.tsx`) for a new effect. A new effect may also want a VFX element accent (`lib/stage/cast-vfx.ts`).
3. New skill or art: append to the table, then `bun scripts/sort-by-sect.ts` and `bun scripts/normalize-t3-stats.ts`; add an icon PNG (else it gets a generic glyph); check its grid range (`skillGrid`, overrides in `lib/game/grid/skill-grid.ts`). Full steps: [content-authoring.md](content-authoring.md#move-skills-and-inner-arts).
4. Run `bun run test:combat`, `bun run test:grid`, `bun run test:grid-skills`, `bun run test:grid-ai`, `bun run test:grid-store` and `bun run typecheck`.
5. Regenerate the reference: `bun scripts/build-docs-reference.ts`.
