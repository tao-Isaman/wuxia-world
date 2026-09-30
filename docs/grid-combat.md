# Grid combat (tactics) — design

Replaces the 1v1 side-view ATB duel with Wandering-Sword-style turn-based
tactics on a tile board, while keeping every skill / art / passive / equipment
number exactly as it is today.

## Rules

- **Board**: 10 × 7 tiles by default (`GRID_DEFAULT_COLS/ROWS`), optional
  blocked tiles (rocks). Manhattan distance for movement and range. No
  line-of-sight.
- **Teams**: `ally` (player; the leader unit is the world's hero) and
  `enemy` (the opponent, optionally with pack members). Engine supports any
  N vs M.
- **Layout**: allies start in columns 1–2, enemies in columns cols-3..cols-2,
  spread around the middle row, facing each other.
- **Turn order**: per-unit ATB using the existing constants — gauge gain per
  ms = `(effectiveSpd + 60) / 2600`, threshold 100, carry-over kept, `buff_spd`
  counts. The engine jumps straight to the next ready unit (no real-time wait).
  `predictOrder(state, n)` forecasts the timeline for the UI.
- **A turn**: at the start of a unit's own turn its status effects tick (poison,
  regen, durations, cooldowns −1). A stunned unit loses the turn. Then:
  optional **move** (≤ `move` tiles; allies passable, enemies/blocked not),
  then exactly one **action**: a skill / inner-art slot aimed at a cell, **wait**
  (end turn), or **flee** (retreat). Acting ends the turn; moving after acting
  is not allowed. A unit may act without moving.
- **Move range**: `move = clamp(3 + floor(Spd / 80), 3, 6)`.
- **Skills**: every skill / art slot has a `GridSkillProfile` (range, area,
  target) from `skillGrid()` / `artGrid()` in `skill-grid.ts`. The aimed cell
  must be in `aimCells`; the action hits every living unit of the profile's
  `target` team inside `areaCells`. An attack aimed where no enemy stands is
  rejected (nothing to hit), except area skills that cover at least one enemy.
- **Resolution** reuses `lib/game/battle.ts` through a **duel view**
  (`DuelView = BattleState`, A = actor, B = one target):
  `dA/dB` = derived, `hA/hB/mpA/mpB` = hp/mp, `st.A/st.B` = the units' own
  `status` objects (by reference), `cd.A/cd.B`, `iaCD`. For an area skill the
  first target resolves normally and the rest as **secondary** hits (no
  cooldown / use count / self-effect / MP again). `battle.ts` gains an options
  bag for this: `resolveSkill(..., opts?: { tick?: boolean; secondary?: boolean })`
  and `resolveArtActive(..., opts?: { slotIdx?, artId?, tick?: boolean; secondary?: boolean })`
  — defaults keep today's behaviour so `test:combat` stays green.
  Self-target skills / arts (buffs, heals) run with B = the actor's nearest
  enemy (effects that need an opponent still work) and never damage it.
- **End**: a team with no living units loses. `winnerTeam` + compat `winner`
  ("A" allies / "B" enemies). **Flee**: `fleeChance(leader Spd, fastest living
  enemy Spd)` from `combat-actions.ts`; success → `escaped`, phase `over`, no
  winner; failure spends the turn.
- **Auto** (อัตโนมัติ): the AI (`planTurn`) plays enemies always and allies when
  auto is on.

## Modules and owners

| File | Owner | Exports |
| --- | --- | --- |
| `lib/game/grid/types.ts` | lead | contract types |
| `lib/game/grid/geometry.ts` | lead | `manhattan`, `reachableCells`, `aimCells`, `areaCells`, `facingToward`, `Board` |
| `lib/game/grid/skill-grid.ts` | B | `skillGrid(skill)`, `artGrid(art)`, `slotGrid(rawSlotId)`, `SKILL_GRID_OVERRIDES` |
| `lib/game/grid/engine.ts` (+ `duel.ts`) | A | see Engine API |
| `lib/game/grid/ai.ts` | C | `planTurn(state, unitId): TurnPlan`, `scoreAction(...)` |
| `lib/game/grid/index.ts` | A | barrel re-exporting all of the above |
| `store/battle-store.ts`, `lib/world/battle-bridge.ts`, opponent packs | D | see Store API |
| `lib/stage/grid-battle-runtime.ts`, `components/game/battle-arena.tsx`, `battle-canvas.tsx` | E | renderer + UI |

## Engine API (`lib/game/grid/engine.ts`)

```ts
createGridBattle(specs: UnitSpec[], opts?: GridBattleOptions): GridBattleState
boardOf(state): Board
unitById(state, id): GridUnit | undefined
activeUnit(state): GridUnit | null
/** Advance ATB to the next ready living unit, tick its effects, set activeId + phase "turn"
 *  (or skip it with a "stunned" event and continue). No-op when phase is "over". */
beginNextTurn(state): GridUnit | null
predictOrder(state, count): string[]            // unit ids, active first
reachableFor(state, unitId): Map<string, Cell[]> // [] when already moved / not active
aimableFor(state, unitId, slot): Cell[]           // valid aim cells for that slot from current pos
previewArea(state, unitId, slot, aimed): Cell[]   // cells the action would cover
slotReady(state, unitId, slot): boolean           // off cooldown, enough MP, has a profile
/** Apply one action for the active unit. Returns false (state untouched) when illegal.
 *  move → phase "moved"; skill / wait / flee → end turn (next turn NOT begun automatically). */
applyAction(state, unitId, action: GridAction, rng?: () => number): boolean
isOver(state): boolean
```

Every successful action appends `GridEvent`s (`move` with the walked path,
`cast` with per-target results, `wait`, `stunned`, `flee`, `end`) and log lines
(unit names escaped). Compat fields (`winner`, `hA`, `mpA`, `skillUses.A` …)
are refreshed after every action from the leader / first enemy.

## Store API (`store/battle-store.ts`, owner D)

Keeps the existing exports used by the world (`state`, `builds`, `start`,
`reset`) and adds grid controls:

```ts
state: GridBattleState | null
builds: { A: CharacterBuild; B: CharacterBuild } | null     // leader + first enemy
auto: boolean
start(a: CharacterBuild, b: CharacterBuild, opts?: { hpA?; mpA?; enemies?: UnitSpec[]; looks?: { A: UnitLook; B: UnitLook }; blocked?: Cell[] })
reset()
setAuto(on: boolean)
move(to: Cell): boolean                // player's active unit
act(slot: number, target: Cell): boolean
wait(): void
flee(): void
/** Drive AI turns: called by the renderer when it has finished playing the
 *  latest events. Runs beginNextTurn + AI plans for enemy (and auto) turns one
 *  step at a time so each action animates. */
step(): void
```

`acknowledgeBattleResult` in the world store keeps reading `state.winner`,
`state.escaped`, `state.hA`, `state.mpA`, `state.skillUses.A`,
`state.artUses.A`, `state.hitsReceived.A` — unchanged.

## Renderer + UI (owner E)

- Phaser runtime draws a 2.5D board (tiles in slight perspective over the
  battle background), units standing on tiles with HP bars, blue move tiles,
  red aim tiles, orange area preview, the active-unit marker, and plays
  `GridEvent`s in order: walk along the path (walk clip, facing), cast (attack
  clip, lunge for melee, existing `cast-vfx` look at each hit cell, damage
  numbers), hurt clip on targets, defeat pose, victory pose.
- **Every unit animates with its own look**: character atlases use their own
  clips (idle / walk / attack / hurt / victory / defeat); creature-atlas beasts
  and unique still sprites get procedural motion (idle bob, hop while walking,
  lunge + squash on attack, flash + knock-back when hurt, fall when defeated).
- UI: timeline (turn order portraits), skill bar (skill / art icons with
  cooldown & MP), buttons **รอ**, **ถอยหนี**, **อัตโนมัติ** (toggle), cancel
  move. Tap a blue tile to move; tap a skill, then a red tile to aim (area
  preview), tap again to confirm. Keyboard: 1–9 skills, W wait, A auto, Esc cancel.
- Host `data-*` for tests: `data-ready`, `data-phase`, `data-active-unit`,
  `data-units` (JSON id/team/x/y/hp), `data-event-seq`, `data-battle-background`.
