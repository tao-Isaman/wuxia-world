# Foes, habitats, T5 and legendary beasts — design contract

The shared contract for the wave that makes foes live where they belong, grow
stronger, and adds a fifth tier and six legendary beasts (บอส). Every part of the
wave codes against this page; ids here are fixed.

## Goals (from the brief)

1. T3 and T4 foes are clearly stronger.
2. Every NPC-backed fighter is one power tier stronger.
3. Foes live in habitats and spawn only there — no more strays. A kill quest
   sends the hero to its quarry's habitat.
4. Beasts drop no gold but give much more experience.
5. A new tier 5 (T5) of foes, about the hero's power tiers 9–10, with PixelLab
   art.
6. No gods, demons or spirits: the `supernatural` category is gone. The world is
   grounded wuxia (legendary beasts are animals, not spirits).
7. Six legendary beasts (บอส): large animated sprites, minions, harder than T5,
   each in its own lair, back 90 days after it falls, a lot of experience and
   good drops, own skills with own effects.

## Power targets

Power score and tiers come from `lib/game/power-tier.ts`
(tier 6 ≥ 180, 7 ≥ 260, 8 ≥ 370, 9 ≥ 520, 10 ≥ 720, 11 ≥ 1000, 12 ≥ 1400).

| Foes | Today | Target (before the day / rank stat scale) |
| --- | --- | --- |
| T3 | 80–170 (tiers 4–5) | ×1.6 → about tiers 5–6 |
| T4 | 250–310 (tiers 6–7), elites 390–500 | ×1.45 → tiers 7–8, elites 8–9 |
| T5 (new) | — | 520–900 (tiers 9–10) |
| Bosses (new) | — | 1100–1600 (tiers 11–12), plus minions |
| NPC-backed fighters | — | ×1.4 (one tier) |

**Booster.** `boostBuild(build, factor)` (pure, `lib/world/data/opponents.ts`) raises
a build's stats so its power score grows by `factor`: add `(factor − 1) × score`
spread over the eight stats in proportion to the build's own stats. Opponents
apply it at registry level (wrapping each `OpponentDef.build`):

- ti 3 → ×1.6, ti 4 → ×1.45 (every T3 / T4 opponent, story and place foes too);
- NPC-backed fighters → ×1.4: `spar_*`, `npc@…` and `lawnpc@…` foes, `hunter_*`,
  and any opponent with `look.npc`. When both apply, use the larger factor.
- T5 and bosses are authored at their targets (no booster).

The day / sect-rank stat scale (`applyOpponentStatScale`, ×1 → ×1.6) stays.

## Habitats

`lib/world/data/habitats.ts` (new):

```ts
export type Biome = "forest" | "mountain" | "snow" | "desert" | "steppe" | "river"
  | "coast" | "swamp" | "cave" | "road" | "town";
export const PLACE_BIOMES: Record<string, Biome[]>;   // every location and every road (route scene)
export const FOE_HABITATS: Record<string, Biome[]>;   // every FIGHT_EVENTS opponent
export function biomesOf(sceneId: string): Biome[];
export function foeLivesAt(opponentId: string, sceneId: string): boolean;
```

- Roads get their biome from their painting type (`coast` → coast, `forest` →
  forest, `mountain` / `gorge` → mountain, `highway` / `lane` / `country` → road)
  plus the region (west deserts, north steppe and snow).
- Settled places (`isSettledPlace`) are `town`: only town foes (thieves, drunks,
  ruffians) live there, and still **only as a kill quest's quarry** (no strays
  in town).
- `fightEventsForLocation(locationId, power)` keeps its signature but returns
  only foes that live there. The quest guide (`opponentSources`) then points to
  their habitats with no change of its own.
- `rollFoeSpawn`: while hunting, the quarry spawns only where it lives.
- Checks: every FIGHT_EVENTS foe lives somewhere; every wild place and road has
  foes; every `defeatedOpponent` quest stage has a place.

## Categories

`EnemyCategory = "human" | "beast"`. The supernatural foes go:

| Id | Becomes |
| --- | --- |
| `snow_demon` ปีศาจหิมะ | `snow_leopard` เสือดาวหิมะ (beast, T3, snow); story / quest text rewritten to match |
| `ghost_swordsman` วิญญาณจอมกระบี่ | `shadowless_swordsman` จอมกระบี่ไร้เงา (human, T3); text rewritten (a living, impossibly fast swordsman, not a ghost) |
| `dragon_phoenix_master`, `immortal_warrior` | removed (T5 masters take the top of the pool) |
| `elite_blood_rakshasa`, `elite_demon_emperor` | removed |
| `st_jh_lone_sword_shadow` เงาบนหินเรียบ | human |
| `st_jh_nine_yang_white_ape` วานรเผือกเฒ่า | beast |

## Spoils

- **Gold:** beasts drop none (`victorySpoils`). Humans unchanged.
- **Experience on a win** (`victoryWExp(opponent)` in `lib/world/victory.ts`, replaces the flat 50):
  humans `40 + 20 × ti`; beasts `80 + 60 × ti`; bosses `boss.wExp` (3,000–4,000).
  Move / art use xp: beasts and bosses ×2.
- Bosses: a guaranteed trophy item (`trophy_<boss>`, high sell price, a crafting
  material) plus 4 rolls from a boss table (T4/T5 materials, big potions,
  meridian charts, a rare chance at T4 equipment).

## Tier 5

`OpponentDef.ti` becomes `0 | 1 | 2 | 3 | 4 | 5`. Six T5 foes, each with an
animated sheet (`look.anim`):

| Id | Name | Kind | Habitat |
| --- | --- | --- | --- |
| `t5_nameless_sword_hermit` | ฤๅษีกระบี่ไร้นาม | human | mountain, snow |
| `t5_blood_blade_lord` | จ้าวดาบโลหิต | human | desert, steppe |
| `t5_poison_matriarch` | แม่เฒ่าพันพิษ | human (woman) | swamp, forest |
| `t5_iron_monk` | ภิกษุเกราะเหล็กนอกรีต | human | mountain, road |
| `t5_white_tiger` | พยัคฆ์ขาวหิมะ | beast | snow, mountain |
| `t5_wolf_king` | ราชาหมาป่าทุ่งเหนือ | beast (pack of wolves) | steppe, forest |

T5 spawn only with hero power ≥ 0.6 (`tierWeightForPower(5, p)`), rarer than T4.

## Legendary beasts (บอส)

`lib/world/data/bosses.ts` (new):

```ts
export interface BossDef {
  id: string;              // = its opponent id
  name: string;
  lair: string;            // location id (a wild place)
  spot: { x: number; y: number };   // map % where it waits (a reachable free spot)
  respawnDays: number;     // 90
  wExp: number;
  trophyItemId: string;
}
export const BOSSES: readonly BossDef[];
export function bossAlive(state, bossId): boolean;            // not defeated within respawnDays
export function bossesAt(state, locationId): BossDef[];       // alive bosses in that lair
```

| Id | Name | Sheet | Lair (suggested, one per region) | Minions |
| --- | --- | --- | --- | --- |
| `boss_golden_serpent` | งูยักษ์เกล็ดทองคำ | `boss_golden_serpent` | `cave_jinshe` ถ้ำงูทอง (east), spot 82, 32 | `viper_snake` + `jade_python` |
| `boss_blood_tiger` | พยัคฆ์โลหิตลายคราม | `boss_blood_tiger` | `valley_hudie` ถ้ำหุบเขาผีเสื้อ (south), spot 84, 26 | `mountain_tiger` + `golden_tiger` |
| `boss_sword_eagle` | อินทรียักษ์จ้าวแห่งกระบี่ | `boss_sword_eagle` | `cliff_motian` ยอดเขามรณะ (north), spot 54, 24 | 2× `thunder_eagle` |
| `boss_sun_turtle` | เต่ายักษ์แบกตะวัน | `boss_sun_turtle` | `isle_wuming` เกาะไร้ชื่อ (east), spot 84, 32 | 2× `stone_turtle` เต่ากระดองหิน (new T4 coast beast) |
| `boss_blade_crab` | ปูวิเศษจ้าวแห่งดาบ | `boss_blade_crab` | `pool_heilong` สระมังกรดำ (west), spot 66, 24 | 2× `iron_crab` ปูก้ามเหล็ก (new T3 coast beast) |
| `boss_flame_bull` | กระทิงยักษ์เขาเพลิง | `boss_flame_bull` | `peak_guangming` ยอดแสงสว่าง (heartland), spot 70, 32 | 2× `blood_boar` |

As built: the six lairs cover all five regions (two in the east: a cave and an
isle). The tiger moved south (no north lair fits a tiger and the eagle both)
and the bull to the heartland's Bright Peak, so every region has one. The two
new minion beasts also roam (coast / river / swamp) as ordinary encounters.
`BossDef` also carries `gear` + `gearChance` (a 15 % chance of one top piece
from its list, into the gear bag) and `lore` (the lore rumor's text). Each boss
slots one common `bst_*` move after its three `bss_*` moves, so it fights even
before the combat engine's boss moves exist.

(The user wrote อินทรีย์; the game uses the standard spelling อินทรี.)

- Opponent: `ti: 5`, `category: "beast"`, `boss: true` (new optional
  `OpponentDef.boss`), `look: { anim: "<sheet>" }` (new optional
  `OpponentDef.look.anim`), `pack` = its minions (always brought).
- **Saved state:** `bossDefeatedDay: Record<string, number>` (save **v26**):
  `migrate` default `{}`, `validate.ts` drops unknown boss ids.
- **On the map:** an alive boss stands at its lair spot as a `WorldFoe` with
  `boss: true` and `look: { kind: "anim", sheet }`. Walking into it opens the
  encounter screen; going in starts the battle with its pack (`withPack`).
- **Win** (`bossSlain` in `lib/world/victory.ts`, called by `acknowledgeBattleResult`):
  `bossDefeatedDay[id] = day`, trophy + boss drops, `boss.wExp`, a big
  rumor ("…ถูกปราบแล้ว"), an action-log line. It is back after 90 days.
- **Lore:** each boss has a lore rumor pointing at its lair, so the player can
  learn where it lives.

### Boss skills (combat engine)

Each boss carries three moves of its own (`sc: "สัตว์ร้าย"`; not learnable,
outside every sect / quest coverage check) and each has at least one effect of
its own. New effect kinds (dispatchers, `never` guards, skill text, VFX):

| Boss | Moves | Its own effect |
| --- | --- | --- |
| งูยักษ์เกล็ดทองคำ | `bss_serpent_fang` เขี้ยวพิษทองคำ · `bss_serpent_coil` รัดกระดูกแหลก · `bss_serpent_molt` ลอกคราบเกล็ดทอง | `bind` (stun + PDef down), `molt` (cleanse self, heal, reflect) |
| พยัคฆ์โลหิตลายคราม | `bss_tiger_claw` กรงเล็บเลือดคราม · `bss_tiger_roar` คำรามสะท้านภพ (area) · `bss_tiger_frenzy` โลหิตคลั่ง | `bleed` (DoT that grows each turn), `frenzy` (atk up, stronger the lower its HP) |
| อินทรียักษ์จ้าวแห่งกระบี่ | `bss_eagle_feathers` ขนนกพันกระบี่ (6 hits, area) · `bss_eagle_dive` ดิ่งฟ้าผ่าภูผา · `bss_eagle_gale` ปีกพายุ (area) | `pierce` (ignores part of PDef), `blind` (Acc down + a chance the target's move fails) |
| เต่ายักษ์แบกตะวัน | `bss_turtle_shell` กระดองแบกตะวัน · `bss_turtle_sun` ตะวันแผดเผา (area) · `bss_turtle_quake` ทับภูผา | `sun_shell` (shield of max HP % + reflect), `scorch` (burn + no healing) |
| ปูวิเศษจ้าวแห่งดาบ | `bss_crab_pincers` คีมพันดาบ (4 hits) · `bss_crab_mirror` กระดองสะท้อนดาบ · `bss_crab_tide` ฟองคลื่นหมอก (area) | `sunder` (strips buffs and shields, PDef down) |
| กระทิงยักษ์เขาเพลิง | `bss_bull_charge` เขาเพลิงพุ่งทะลวง (line) · `bss_bull_stomp` กระทืบธรณี (area stun) · `bss_bull_rage` เพลิงโทสะ | `scorch`, `frenzy` |

Each boss also has its own inner art `art_boss_<x>` (ti 5, not learnable) for
its HP / MP pool and a fitting passive.

## Art (PixelLab)

`lib/characters/anim-sheets.ts` is the contract: one PNG per sheet at
`/art/anims/<id>.png`, rows of equal frames — `idle` (row 0), `attack` (row 1),
`hurt` (row 2, optional) — with `frameW`, `frameH`, `feetY`, `facing`, `scale`,
written by `scripts/build-anim-sheets.ts` into `anim-sheets-data.ts`.
Placeholders (creature-atlas cells) ship until the art lands.

- Bosses: big (frames about 160–256 px), side-on facing right, 6–8 frame idle and
  attack loops, a short hurt clip.
- T5: 96–128 px people / beasts, same clips.

## Rendering

- `UnitLook` gains `{ kind: "anim"; sheet; tint?; size? }` (`lib/game/grid/types.ts`):
  the battle runtime plays `idle`, `attack` on its casts, `hurt` when hit, flips
  to face its target, scales by `sheet.scale × size`.
- `WorldFoe.look` gains the same `anim` kind and `boss?: boolean`: the world
  runtime draws it large, playing `idle`, with a name plate; it does not drift.
- `opponentLook` (`lib/world/battle-looks.ts`) returns `{ kind: "anim", sheet }`
  for opponents with `look.anim`; the encounter / briefing portraits
  (`components/game/foe-portrait.tsx`) draw the sheet's first idle frame.
