# Grid combat

Every battle in the game is a turn-based tactics fight on a tile board, in the style of Wandering Sword: the fastest unit acts first, a turn is "move (optional), then one action", and every skill has a range and an area. The hero fights one opponent, or up to seven when a random encounter brings the opponent's pack; the board grows with the number of fighters, up to 15 × 10.

The damage and effect numbers are not re-implemented here: each cast runs the original engine (`lib/game/battle.ts`, see [combat.md](combat.md)) once per caster–target pair. This page covers the board, the turn system, the AI, the store, the renderer and the battle UI.

## Contents

- [Files](#files)
- [Rules](#rules)
- [Skill ranges and areas](#skill-ranges-and-areas)
- [Resolving a cast: the duel view](#resolving-a-cast-the-duel-view)
- [Engine API](#engine-api)
- [AI](#ai)
- [Retreat](#retreat)
- [Packs](#packs)
- [Battle store](#battle-store)
- [World ↔ battle](#world--battle)
- [Unit looks](#unit-looks)
- [Renderer](#renderer)
- [Battle UI](#battle-ui)
- [Tests](#tests)
- [Known gaps](#known-gaps)

## Files

| Layer | File | Role |
| --- | --- | --- |
| Engine (pure) | `lib/game/grid/types.ts` | contract types; `GRID_DEFAULT_COLS = 10`, `GRID_DEFAULT_ROWS = 7` |
| | `lib/game/grid/geometry.ts` | distances, walking range, aim cells, area cells |
| | `lib/game/grid/skill-grid.ts` | range / area profile for every skill and art, 18 overrides, Thai labels |
| | `lib/game/grid/engine.ts` | battle creation, per-unit turn order, queries, `applyAction` |
| | `lib/game/grid/duel.ts` | runs `battle.ts` for one actor / target pair |
| | `lib/game/grid/ai.ts` | `planTurn` for enemies and auto mode |
| | `lib/game/grid/index.ts` | barrel (separate from `lib/game/index.ts`) |
| Reused core | `lib/game/battle.ts`, `lib/game/effects.ts` | `resolveSkill`, `resolveArtActive`, `gaugeRate`, `tickSideEffects` |
| | `lib/game/combat-actions.ts` | `fleeChance` |
| Store | `store/battle-store.ts` | the live battle (Zustand, not persisted) |
| World seam | `lib/world/battle-bridge.ts`, `lib/world/battle-looks.ts` | start battles from `pendingBattle`; unit looks and packs |
| | `store/world-store.ts` → `acknowledgeBattleResult` | costs, rewards, escapes, defeats |
| Renderer | `lib/stage/grid-battle-runtime.ts` | Phaser board, event playback, AI pacing, pointer input |
| | `lib/stage/cast-vfx.ts`, `lib/stage/battle-vfx.ts`, `lib/audio/cast-sfx.ts` | cast effects and sounds |
| | `lib/stage/battle-background.ts` | background choice |
| UI | `components/game/battle-arena.tsx`, `battle-canvas.tsx`, `battle-log.tsx`, `app/grid-battle.css` | timeline, skill bar, controls, unit card, result panel |

Mount points: `components/world/world-screen.tsx` (world mode, over the map) and `app/debug/page.tsx` (free mode).

## Rules

### Board and starting positions

- The board size follows the number of units (`boardSizeFor` in `lib/game/grid/types.ts`):

  | Units | Board |
  | --- | --- |
  | up to 3 | 10 × 7 (`GRID_DEFAULT_COLS` / `ROWS`) |
  | 4–5 | 12 × 8 |
  | 6–7 | 13 × 9 |
  | 8 or more | 15 × 10 (`GRID_MAX_COLS` / `ROWS`) |

  `battleStore.start` picks it unless `opts.cols` / `opts.rows` are given. The renderer fits any size to the screen, landscape phones included.
- `x` is the column (0 = left), `y` the row (0 = top, the far side). Distances are Manhattan; there is no line of sight — qi flies over heads.
- Blocked cells (rocks) are supported but no world battle uses them; only tests do.
- Allies line up on column `floor(cols/2) − 2`, enemies on column `ceil(cols/2) + 1` (10 × 7: columns 3 and 6), spread out from the middle row, with a back column behind each when the front fills. In a 10 × 7 world battle the hero stands at (3, 3), the primary enemy at (6, 3) and pack members at (6, 2) and (6, 4). The front lines are 3–4 tiles apart, so whoever acts first can walk in and strike on turn one.
- Starting HP is the world HP (at least 1); MP carries over too. Duplicate names get a suffix ("X 2", "X 3").

### Turn order

- Every unit has its own gauge that fills at `gaugeRate(spd) = (spd + 60) / 2600` per virtual millisecond and acts at 100, keeping the overflow. Speed includes `buff_spd` (`unitSpd`).
- Time is virtual: the engine jumps straight to the next unit that reaches 100, so nothing waits in real time. Ties go to the higher gauge, then allies before enemies, then unit order.
- The turn ratio between two units is `(SpdA + 60) : (SpdB + 60)` — Spd 100 vs 20 acts twice as often, not five times.
- `predictOrder(state, count)` forecasts the next turns for the timeline (8 portraits). It ignores stuns and buffs running out.

### A turn

1. `beginNextTurn` picks the next unit and, **for that unit only**, ticks its status (poison, burn, durations, regen) and lowers every slot cooldown by 1. A poison death can end the battle here. A stunned unit loses the turn (log "ถูกสตัน — ข้ามตา!", `stunned` event).
2. The unit may **move** once, up to its move range, before acting.
3. Then exactly one **action**: a skill or art slot aimed at a cell, **wait** (รอ), or **flee** (ถอยหนี, hero only). Moving after acting is not possible; acting without moving is fine; wait and flee are allowed after moving.

Phases (`GridPhase`): `start` (nobody holds the turn) → `turn` (may move or act) → `moved` (must act, wait or flee) → back to `start`; `over` at the end. `state.turn` counts actions (casts, waits, flee attempts, stun skips), not moves.

### Movement

- Move range = `clamp(3 + floor(Spd / 80), 3, 6)`: Spd under 80 → 3 tiles, 80–159 → 4, 160–239 → 5, 240+ → 6. It is fixed when the battle starts (speed buffs don't change it).
- Walking is a breadth-first search over the 4 neighbours: rocks and living enemies block, allies can be walked through but not stood on, fallen units occupy nothing.

### Status, stun and cooldowns

- A unit's status ticks at the start of its own turn, so a duration of N means N of the owner's turns, and poison deals N ticks.
- Stun is checked after the tick lowers it, so a stun of N skips N − 1 turns. The only stun in the data is `sl_truth_staff` (`u: 3`, 100 %) → 2 skipped turns.
- A cast sets the slot's cooldown: `TIERS[tier].cd` for skills (T0 0, T1 2, T2 3, T3 4, T4 5, T5 6) or `act.cd` for arts. It drops by 1 at each of the owner's turns, so cooldown N leaves the slot unusable for N − 1 turns (a tier-1 skill works every other turn).
- A slot is ready when the unit is alive, the slot has a profile, its cooldown is 0, and (for arts) it has an active and enough MP.

### End

A team with no living units loses: `phase "over"`, `winnerTeam`, and the compat `winner` = `"A"` (allies) or `"B"` (enemies), log "━━ ฝ่ายเราชนะ! (N ตา) ━━". A successful retreat ends the battle with `escaped: true` and no winner. The log keeps 100 lines, the event list 200.

## Skill ranges and areas

Every skill and art slot has a `GridSkillProfile`: `range {min, max}` (Manhattan distance from the caster to the aimed cell), `area` and `target` (`enemy` or `self`).

| Area | Covers |
| --- | --- |
| `single` | the aimed cell |
| `diamond N` | cells within Manhattan N of the aim (N = 1 is a plus of 5) |
| `square N` | cells within Chebyshev N (N = 1 is 3×3) |
| `line N` | N cells from the caster outward toward the aim (a thrust or beam; aim must be in the caster's row or column) |
| `arc` | the aimed cell plus its two neighbours across the swing (3 cells) |
| `cross N` | the aimed cell plus N cells in each of the 4 directions |

A cast hits every living unit of the target team inside the area and is refused when that is nobody — a single-target attack needs an enemy on the aimed cell; an area attack may aim at an empty cell if the area covers an enemy.

### How a skill gets its profile

`skillGrid(skill)` in `lib/game/grid/skill-grid.ts` derives a profile from the skill's data:

1. No attack type and no enemy effect → self.
2. Beast moves (`bst_*`) → range 1, single.
3. By weapon family (`int` = internal attack):
   - **fist**: internal T2+ → 1–2 single; else 1–1 single.
   - **sword**: internal T3+ → 1–3 line 3; internal T2 → 1–3 single; internal T0–1 → 1–2 single; physical T2+ → 1–1 arc; physical T0–1 → 1–1 single.
   - **blade**: T1+ → 1–1 arc; T0 → 1–1 single.
   - **long**: T3+ → 1–3 line 3; T0–2 → 1–2 line 2.
   - **short**: 1–1 single.
   - **hidden**: whips, chains and hooks (name has แส้ / โซ่ / ขอ) → range 1–3, others 2–4; 5+ hits or T3+ → diamond 1, else single.
   - **music**: 2–4 diamond (size 2 at T3+, else 1).
4. Internal blade / long / short skills reach 1 further (and lines 1 longer).
5. Melee skills with 4+ hits collapse to single-target.

Then 18 hand-set exceptions (`SKILL_GRID_OVERRIDES`) apply, for example `ep` 18 ฝ่ามือมังกร (1–3 line 3), `lmsj` กระบี่ 6 ชีพจร (1–4 single), `ng5` ดาบยาวเทพสังหาร (3×3 square), `tang_starrain` ดาราพิรุณโปรย (2–4 diamond 2) and `ng6` ขลุ่ยพลิกโลก (2–5 diamond 2). Finally `normalise` caps range at 5, lines at 4 and areas at 2.

`artGrid(art)`: an art with no active has no profile. Heals and buffs (`heal`, `heal_cleanse`, `heal_full_cleanse`, `buff_reflect`, `buff_reduce`, `buff_spd`, `buff_eva_debuff_eva`) are self; `atk_phy_pen` and `drain_phy` are 1–2 single; `debuff_poison` is 1–3 diamond 1; `atk_int_pen`, `drain`, `drain_acc` and `debuff_acc_dmg` are 1–3 diamond 1 at T3+, else 1–3 single.

`describeGrid(profile)` gives the Thai label shown on skill cards and tooltips: `ตนเอง`, `แนวตรง N ช่อง`, or `ระยะ N` / `ระยะ min–max` followed by `เป้าเดียว`, `วงรัศมี N`, `พื้นที่ 3×3`, `กากบาท N` or `ฟันกวาด 3 ช่อง`.

Every skill's and art's profile is listed in [reference/martial-arts.md](reference/martial-arts.md). Today: of 122 arts, 71 are self, 26 are 1–2 single, 20 are 1–3 diamond 1 and 5 are 1–3 single.

## Resolving a cast: the duel view

`doSkill` in `lib/game/grid/engine.ts`, with `lib/game/grid/duel.ts`:

- A **duel view** is a `BattleState` where side A is the caster and side B one target (`makeDuelView`): derived stats, HP / MP, and the units' own status objects **by reference**. `pairContext` caches the `BattleContext` per build pair. After resolving, `commitDuelView` copies HP, MP, status and cooldowns back and adds the use and hit counters.
- The first target resolves normally (`tick: false`, because each unit ticks on its own turn). Every other target in the area resolves as `secondary: true`: damage rolls and the enemy effect only — no cooldown, use count, MP or self effect again. Targets are taken in unit order. If the caster dies mid-sweep (reflect), the rest are skipped.
- Self / support casts pair the caster with its nearest living enemy (effects that need an opponent still work) and then restore that enemy's HP, so support never damages anyone. Status changes on it (for example `buff_eva_debuff_eva`'s evasion debuff) stay.
- Log lines from `battle.ts` pass through `gridLogLines`, which drops the 1v1-only lines.
- Each cast emits a `cast` event with per-target results (`damages`, `crits`, `misses`, `healed`, `killed`); the caster turns to face the aim.

## Engine API

All engine functions mutate the state they are given; callers clone first (the store does).

```ts
// lib/game/grid/engine.ts
GRID_ATB_THRESHOLD = 100
moveRangeFor(spd): number                         // clamp(3 + floor(spd/80), 3, 6)
createGridBattle(specs: UnitSpec[], opts?: { cols?, rows?, blocked? }): GridBattleState
boardOf(state): Board
unitById(state, id): GridUnit | undefined
activeUnit(state): GridUnit | null
isOver(state): boolean
unitSpd(unit): number                             // derived Spd + buff_spd
beginNextTurn(state): GridUnit | null             // advance gauges, tick, skip stunned; null when over
predictOrder(state, count): string[]              // forecast, active unit first
reachableFor(state, unitId): Map<string, Cell[]>  // empty unless active and in phase "turn"
aimableFor(state, unitId, slot): Cell[]
previewArea(state, unitId, slot, aimed): Cell[]
targetsFor(state, unitId, slot, aimed): GridUnit[]
slotReady(state, unitId, slot): boolean
applyAction(state, unitId, action, rng = Math.random): boolean   // false (state untouched) when illegal
```

- `GridAction` = `{ t: "move", to }` | `{ t: "skill", slot, target }` | `{ t: "wait" }` | `{ t: "flee" }`. A skill, wait or flee ends the turn; the next turn is **not** begun automatically.
- `GridEvent` = `move {path}` · `cast {name, tier, source, aimed, cells, results}` · `wait` · `stunned` · `flee {success}` · `end {winner, escaped}`, each with a rising `seq`.
- Compat fields for the world (`winner`, `escaped`, `hA`, `mpA`, `skillUses.A`, `artUses.A`, `hitsReceived.A`) mirror the leader; the `B` fields mirror the first enemy. They refresh at turn start, turn end and battle end.
- `geometry.ts`: `manhattan`, `chebyshev`, `inBounds`, `neighbours`, `facingToward`, `reachableCells`, `aimCells`, `areaCells`. `skill-grid.ts`: `skillGrid`, `artGrid`, `slotGrid(rawSlotId)`, `describeGrid`, `SKILL_GRID_OVERRIDES`. `duel.ts`: `pairContext`, `makeDuelView`, `commitDuelView`, `resolveDuel`, `tickUnit`. `ai.ts`: `planTurn`, `scoreAction`.

## AI

`planTurn(state, unitId): TurnPlan` in `lib/game/grid/ai.ts` plays every enemy turn, and the hero's side when อัตโนมัติ (auto) is on. It is pure and deterministic (no randomness) and takes about 1.5 ms per plan. It never flees.

- It estimates damage without dice by mirroring `battle.ts` (`estimateSkill`, `estimateArt`): the same attack, mastery, stack, defence, buff and art-bonus terms, times hit chance and expected crit. **Change it together with the damage formula.**
- For every reachable tile × ready slot × aim cell it scores the action:
  - per enemy in the area: expected damage (capped at the enemy's HP) × focus (up to ×1.5 on wounded foes, ×1.15 on the hero), plus a kill bonus, plus the value of the debuff it applies, plus life drain;
  - plus the skill's own self effect, minus 0.05 × MP cost;
  - minus a small walking cost, and for ranged units a penalty per adjacent enemy, or for melee units a pull toward the enemy leader.
- Support slots score heals only below 60 % HP (×1.3), and buffs only when an enemy could reach the unit next turn.
- If no action is worth anything, it walks toward the nearest spot from which it could attack, then waits.
- Any real action beats any idle move. Ties break on tile, then slot (wait last), then aim, so the same state always gives the same plan.

## Retreat

- `fleeChance(heroSpd, fastestEnemySpd) = clamp(50 + (heroSpd − enemySpd)/4, 20, 90)` % (`lib/game/combat-actions.ts`), using derived Spd without buffs. Only the hero may flee, on their turn, before or after moving.
- Success: `escaped = true`, the battle ends with no winner and no rewards. Failure: the turn is spent (log "ถอยหนีไม่พ้น … เสียจังหวะ").
- The ถอยหนี button exists only in world mode and shows the odds in its tooltip ("โอกาสหนีรอด N% · พลาดจะเสียตานี้").
- This is different from 🏃 หนี on the encounter screen before a fight, which is free — except against sect hunters and law pursuers, where it is an AGI + LUK check (see [gameplay.md](gameplay.md#random-encounters)).

## Packs

- `OpponentDef.pack` is one `{ opponentId, count }` or a list of them (a gang of mixed kinds), e.g. `elite_bandit_king` brings a lieutenant, two archers and two bandits. Members are the same tier or weaker (`enemyPackSpecs` in `lib/world/battle-looks.ts`, `packMembers` reads either form). Unit ids: `A` hero, `B` primary enemy, `pack1:<id>` … `pack6:<id>`.
- **Reinforcements.** The first member kind gets +1 when the hero's power (`playerPowerIndex`) is at least 0.4 and +2 at 0.75 (`packCounts`). The pack is capped at `MAX_PACK_SIZE = 6`, so a battle has at most 8 units.
- Packs come only with **random encounters** (`PendingBattle.withPack`, set by `encounterBattle` — accepting an encounter, or failing to flee a hunter or the law). Quest battles, spars, hunts and bad-action fights stay 1 v 1.
- 35 opponents have packs — from `vampire_bat` (+2 bats) and `wild_wolf` (+1 wild dog) up to the bosses `elite_bandit_king`, `elite_cult_elder`, `elite_bear_king` and the ten `elite_villain_*` named villains. `hunt_boar` / `hunt_alpha_wolf` only appear on hunting nodes, which never bring packs. The full list is the Pack column of [reference/opponents.md](reference/opponents.md).
- The battle log says "ฝ่ายศัตรูมีพวกอีก N คน" at the start. On a win, only the primary enemy's drops roll, but every fallen pack member counts toward `defeatedCounts` (so pack kills advance kill quests).

## Battle store

`store/battle-store.ts` (`"use client"`, not persisted — a reload mid-fight restarts the battle).

| Member | What it does |
| --- | --- |
| `state`, `builds`, `auto` | the `GridBattleState`, the hero and primary-enemy builds, the auto flag |
| `start(a, b, opts?)` | `opts = { hpA?, mpA?, enemies?, looks?, blocked? }`; creates the battle, logs the opening lines (carry-over HP / MP, mastery per family, each side's primary art, the pack) |
| `move(to)`, `act(slot, target)`, `wait()`, `flee()` | player actions, only on the player's turn; return `false` when refused |
| `setAuto(on)` | อัตโนมัติ: the AI plays the hero's side too |
| `step()` | one visible beat: begin the next turn, or play the AI's move, or its action. Does nothing while the player must act. The renderer calls it. |
| `stepAll()` | repeat `step()` until the player's turn or the end (tests) |
| `reset()` | clear the battle and turn auto off |

Helpers: `isPlayerTurn(state, auto)`, `aiControls(unit, auto)`, `cloneBattle`, `PLAYER_UNIT = "A"`, `PRIMARY_ENEMY_UNIT = "B"`. Every change publishes fresh `state`, `units`, `events` and `log` references. The store never runs a timer.

## World ↔ battle

### Where battles come from

Everything sets `worldStore.pendingBattle = { opponentId, onWin, onLose, nonFatal?, withPack? }`:

| Source | Non-fatal | Pack | After the fight |
| --- | --- | --- | --- |
| Random encounter → ⚔ ต่อสู้ (`acceptEncounter`) | law pursuers only | yes | back where it happened; losing to the law → `jail_cell` |
| Failed 🏃 หนี from a sect hunter or the law | law only | yes | same |
| Scene effect `triggerBattle` (quests, story) | per effect | no | the effect's `onWin` / `onLose` |
| Sparring with an NPC (`startSparWith`) | yes | no | `npc_spar_win` / `npc_spar_lose` |
| Hunting node (`gatherResource`) | **no** | no | same place; spoils on a win |
| Failed steal | yes | no | same place; the NPC's own fighter or a tier guard; +1 wanted mark |
| Failed assassination / kidnap | **no** | no | same place; a tier guard |

### Starting a battle

`lib/world/battle-bridge.ts`: `initBattleBridge()` (called once from `app/page.tsx`) subscribes to `pendingBattle`. `ensureBattleStarted()` then applies the opponent stat scale for the hero's progress (`applyOpponentStatScale`, ×1 to ×3), builds the setup with `worldBattleSetup(opponentId, { bodyId, withPack })`, and calls `battleStore.start(playerBuild, setup.build, { hpA, mpA, looks, enemies })`. It also runs at start-up, so a save with a `pendingBattle` restarts that fight. An unknown opponent clears the pending battle.

### Ending a battle

The result panel's **ดำเนินเรื่อง →** calls `worldStore.acknowledgeBattleResult()`:

- **Every outcome**: stamina −5 (`FIGHT_STAMINA`), +0.5 ชั่วยาม (`FIGHT_HOURS`), HP / MP carried back.
- **Escape**: no rewards; a law escape clears the pending jail city; the hero stays where they are (a dialog scene returns to the last location).
- **Win**: +50 w-exp; +1 kill for the opponent and each fallen pack member; skill xp 20 × uses and art xp 20 × uses (auto-level; skills from a sect the hero resigned from get no battle xp); STR xp for physical skill uses, POW xp for internal ones, DEF xp for hits taken, LUK rolls; sparring fame and +1 relationship; a rumor when the foe is a named NPC; the primary's drop table; quest progress; hunt spoils; then `onWin`.
- **Loss, non-fatal**: HP floored at 1, then `onLose`.
- **Loss, fatal**: game over.

Details of the rewards: [gameplay.md](gameplay.md#progression).

## Unit looks

`UnitLook` is `{ kind: "character", characterId, still? }` (a character atlas, optionally with a unique still sprite) or `{ kind: "creature", frame }` (a cell of `/art/creature-atlas.png`, 8 frames). Both take an optional `tint` (a colour multiplied over the sprite) and `size` (a scale, clamped 0.6–1.6) so one sprite can make several variants — a pale frost wolf, a purple vampire bat, a boss drawn larger than its gang.

- `playerLook(bodyId)` — the hero's chosen body.
- `opponentLook(opponentId, npc?)` — `OpponentDef.look = { sheet?, frame?, tint?, size?, npc? }` overrides the defaults below. `npc` names the NPC the foe is (the 10 villain bosses); a rigged NPC (the sect heads' spars, the villains) fights with its own sheet and real clips, never a still. Beasts otherwise use `creatureFrameFor(id)` (tiger 1, bear 2, boar 3, snakes / spiders / scorpions 4, chickens 5, birds 6, bats 7, else 0); people use an archetype sheet picked from the id, plus their own battle sprite (`/npcs/pixel-battle/<npcId>.png`) when the opponent is a known NPC.
- `worldBattleSetup` returns `{ opponent, build, looks, enemies }`. Pack members get their archetype look, never a still.
- /debug battles use the default looks (hero m1 vs the bandit archetype).

## Renderer

`lib/stage/grid-battle-runtime.ts` — one Phaser 4 game (WebGL, or Canvas on old devices), dynamically imported by `components/game/battle-canvas.tsx`. Phaser's own input is off; pointer events come from DOM listeners.

- **Board**: a 2.5D perspective grid over the battle background. Tiles are 96 px wide at the near row and shrink to 74 % at the far row. The camera fits the whole board.
- **Highlights** (player's turn only): blue move tiles, red aim tiles, an orange area preview, gold rings on units that would be hit, a gold outline under the active unit.
- **Units**: each draws with its own look. Character atlases play their clips (idle, walk, directional walks, hurt, guard for support casts, victory, defeat) and hand-time the attack frames to the hits. Creatures and unique stills get procedural motion (breathing, a hop per tile, squash and stretch on attack, a tilt when hurt, a fall on defeat). Everyone gets the melee lunge, a white hit flash and a knock-back. Each unit has a team ring, a name tag, an HP bar (and an MP bar for allies); the active unit gets a pulsing gold ring and a chevron.
- **Event playback**: events with a newer `seq` play one at a time. A walk takes 180 ms per tile. A cast shows the move name in the tier colour; hit *i* lands at 300 + 110 × *i* ms, with floating numbers (miss พลาด; crit gold with 暴擊; 0-damage debuff casts show ปราณ), HP bars dropping at that moment, and camera shake scaled by tier. Waits, stuns, flee attempts and the end have short captions. After the queue drains the actors snap to the engine state.
- **Pacing**: when it is not the player's turn, the runtime calls `battleStore.step()` 350 ms after playback goes idle (210 ms after a move beat; shorter with reduced motion), so each AI beat animates.
- **Pause**: nothing advances while the tab is hidden or any dialog is open.
- **Reduced motion**: no VFX or shake, shorter timings, the idle frame held (sounds still play).
- **Failure**: on a lost WebGL context or a boot error, the canvas shows **โหลดฉากใหม่**, and the arena keeps the battle moving without animation by calling `step()` every 350 ms.
- **Host attributes** on `[data-testid="battle-canvas"]`: `data-renderer`, `data-renderer-backend` (`webgl` / `canvas`), `data-ready`, `data-battle-background`, `data-background-image`, `data-reduced-motion`, `data-anim` (`idle` / `playing`), `data-event-seq`, `data-units` (JSON id, team, x, y, hp, alive), `data-phase`, `data-active-unit`, `data-highlight` (`move` / `aim` / `none`), `data-zoom`, `data-paused`, `data-vfx-tier`, `data-vfx-shape`, `data-vfx-element`, `data-impact-count`. Test hook: `host.gridCellPoint(x, y)` returns the viewport point of a cell's centre.

### Cast VFX and sound

`lib/stage/cast-vfx.ts` (pure) turns a cast's `{ tier, source }` into a profile; `lib/stage/battle-vfx.ts` draws it.

- **Rarity** (tier 0–4) sets the palette — parchment, jade, sky, violet, gold — and the layers: T1+ glow and charge sparks, T2+ a shockwave ring and afterimages, T3+ a rune circle, an element burst and petals, T4 a stage dim, a light pillar, rays and a screen flash.
- **Weapon family** sets the shape: sword crescent slash, blade heavy cleave, fist burst, long thrust, short flurry, hidden-weapon projectiles, music waves; inner arts are qi orbs. Ranged shapes travel to the first target and don't lunge.
- **Element** comes from the effect or type tags: poison, fire, frost, thunder (stun), blood (drain), qi, shadow, holy (heals).
- Misses get a whiff; support casts get an aura at the target's feet.
- `lib/audio/cast-sfx.ts` plays matching sounds from the same profile: a cast-start swoosh, per-hit strikes (crit accents, bells and gongs at high tiers, element accents), a whiff when everything misses, and a pentatonic arpeggio for support casts.

### Backgrounds

`resolveBattleBackground` in `lib/stage/battle-background.ts`: the beginner practice bout (`training_capital_apprentice`) uses the capital training yard; a battle that starts and ends in the capital (current scene, last location, `onWin` and `onLose` all `city_capital`) uses the capital street; everything else, including /debug, uses the jade courtyard.

## Battle UI

`components/game/battle-arena.tsx` — `mode="world"` (full-screen over the map) or `mode="free"` (the /debug sandbox).

- **Status row** (`data-testid="combat-status"`): a headline (ถึงตา *name*, เล็งเป้า · *skill*, อัตโนมัติ · *name*, …), the turn-order timeline (`data-testid="turn-timeline"`, 8 portraits; tap one to open that unit's card), the turn number, a 📜 log toggle and the ♪ sound button.
- **Field**: the board, a ถึงตาเจ้า callout on the player's turn, the unit card (`data-testid="unit-card"`: side, move range and Spd, HP / MP meters, buff and debuff chips with info), a hint pill, and the log drawer.
- **Skill bar**: a horizontal strip along the bottom, like Wandering Sword — one square tile per filled slot of the acting ally (icon, name, and cooldown "รอ N ตา", MP cost, "MP ไม่พอ", "พร้อม" or "นอกระยะ"), scrolling sideways when the slots don't fit; the controls sit at its right end. The range label (`describeGrid`) is in the tile's tooltip. On a landscape phone the tiles shrink to 58 × 62 and drop the meta line.
- **Controls**: while aiming, **ยกเลิก** (Esc) and **ยืนยัน** (Enter); otherwise **รอ** (W) and, in world mode, **ถอยหนี**; always **อัตโนมัติ** (A). Free mode adds **Reset**. There is no item command and no undo-move.
- **Aiming**: pick a skill card (keys 1–9 map to the visible cards). Self skills, and skills with exactly one useful aim, are pre-aimed. With a mouse, clicking a red tile confirms at once; with touch, the first tap aims (showing the orange area) and a second tap on the same tile confirms. With no skill selected, tapping a blue tile moves.
- **Result panel** (`data-testid="combat-result"`, `data-outcome` = `ally` / `enemy` / `escaped`): ชัยชนะ, พ่ายแพ้ or หนีรอด, the number of turns, and **ดำเนินเรื่อง →** (world) or **เริ่มใหม่** / **Reset** (free). It appears once the battle is over and playback has caught up.

## Tests

| Suite | What it pins |
| --- | --- |
| `bun run test:grid` (`scripts/test-grid-engine.ts`, 14 checks) | layout, name suffixes, move range, walking rules, turn-order ratios and forecast, reach, areas, cooldowns, art MP, own-turn ticks, stun skips, poison deaths, compat mirrors, hero-only flee, full battles ending within 300 turns |
| `bun run test:grid-ai` (13) | legal plans across 36 seeded battles, attrition up to 2500 turns, attacks when adjacent, walk-and-strike, ranged units keep distance, areas aim for 2+ foes, heals only when low, plan time < 15 ms, a 1 v 7 plan on 15 × 10 < 25 ms |
| `bun run test:grid-skills` (7) | every skill and art profile is valid, the self / enemy rule, the 18 overrides, `slotGrid`, `describeGrid` labels |
| `bun run test:grid-store` (13) | bridge start with HP / MP and looks, packs (mixed gangs, power reinforcements, the 6 cap), board size per unit count, variant tint / size, rigged NPC sheets for spars and villains, spar sprites, step pacing, refused input, flee, auto, win rewards including pack kills, fatal vs non-fatal loss, escape without rewards |
| `bun run test:combat` (15) | legacy 1v1 checks plus grid store turns, ties, cooldown timing and flee odds |
| `bun run test:battle-background` | background choice |

Browser specs: `tests/browser/game.spec.ts` (tap a tile with `gridCellPoint`, auto to the result, log drawer, beast battles), `battle-setting.spec.ts` (capital street background survives reload), `law-guide.spec.ts` (ถอยหนี, no rewards), `opening.spec.ts` (the training bout, no guard / recover buttons).

## Known gaps

1. The `hunt_boar` and `hunt_alpha_wolf` packs never spawn (hunting fights don't bring packs).
2. Poison, burn and regen change HP without an event, so health bars catch up only at the next event.
3. The victory / defeat jingle plays when the last action resolves, slightly before the final animation.
4. Tier-5 arts (`khbt`, `kuyt`) draw T4 VFX but their cast banner uses the tier-0 colour.
5. The heavy-blade debris effect is drawn at a fixed spot below the board instead of at the target.
6. Reloading mid-battle restarts it from the beginning (the battle store isn't saved).
7. The ally-support branch in `doSkill` is unreachable: no profile targets allies yet.
8. No browser test covers the battle canvas's โหลดฉากใหม่ retry (only the world canvas's).
