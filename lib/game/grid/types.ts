// ─── Grid combat: shared contract ─────────────────────────────────────
// Turn-based tactics in the Wandering Sword mould: units stand on a tile
// board, the fastest acts first (per-unit ATB), a turn is "move (optional)
// then one action (skill / inner art / wait / retreat)", every skill has a
// range and an area, and any side can be played by the AI ("อัตโนมัติ").
//
// Pure data + types only. Damage and status effects are NOT reimplemented:
// the engine drives lib/game/battle.ts (resolveSkill / resolveArtActive)
// through a per-pair duel view, so every existing skill, art, passive and
// equipment effect keeps its exact numbers. See docs/grid-combat.md.

import type {
  BattleState,
  CharacterBuild,
  Derived,
  LogLine,
  Side,
  SideBattleState,
  SkillTierIndex,
} from "../types";
import type { MeridianElement } from "../meridian-types";

/** Board coordinate: x = column (0 = left), y = row (0 = top / far side). */
export interface Cell { x: number; y: number }
export const cellKey = (c: Cell): string => `${c.x},${c.y}`;
export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

export type Facing = "left" | "right" | "up" | "down";
export type Team = "ally" | "enemy";

// ─── Skill geometry (see skill-grid.ts) ────────────────────────────────
/**
 * Where a skill may be aimed and what it hits.
 *   range   — Manhattan distance from the caster to the aimed cell
 *             (min 0 = may aim at own cell; self skills use {0,0}).
 *   area    — cells hit around / along the aimed cell (see areaCells).
 *   target  — who is affected inside the area.
 */
export interface GridSkillProfile {
  range: { min: number; max: number };
  area: AreaShape;
  target: "enemy" | "ally" | "self";
}

/**
 * Area shapes. `size` meaning per kind:
 *   single — just the aimed cell
 *   diamond — cells within Manhattan `size` of the aimed cell (size 1 = plus)
 *   square — cells within Chebyshev `size` of the aimed cell (size 1 = 3×3)
 *   line   — `size` cells from the caster outward through the aimed cell
 *            (a thrust / beam; aimed cell must be in a straight line)
 *   arc    — the aimed cell plus its two neighbours perpendicular to the
 *            caster→target direction (a sweeping slash, 3 cells)
 *   cross  — aimed cell plus `size` cells in each of the 4 directions
 */
export type AreaShape =
  | { kind: "single" }
  | { kind: "diamond"; size: number }
  | { kind: "square"; size: number }
  | { kind: "line"; size: number }
  | { kind: "arc" }
  | { kind: "cross"; size: number };

// ─── Units ─────────────────────────────────────────────────────────────
/** How the renderer draws a unit (resolved by the store from world data). */
/**
 * How a unit is drawn. `tint` multiplies the sprite's colours (0xRRGGBB) and
 * `size` scales it (1 = normal) — used to tell enemy variants apart (a frost
 * wolf, a hulking boss) on top of a shared sheet or creature frame.
 */
export type UnitLook =
  | { kind: "character"; characterId: string; still?: string; tint?: number; size?: number }   // atlas (+ optional unique still sprite)
  | { kind: "creature"; frame: number; tint?: number; size?: number };                        // /art/creature-atlas.png frame

export interface UnitSpec {
  id: string;
  team: Team;
  build: CharacterBuild;
  look: UnitLook;
  /** Starting HP / MP (clamped to the derived max); defaults to full. */
  hp?: number;
  mp?: number;
  /** The unit the world tracks (player): its HP/MP/uses are mirrored into the compat fields. */
  leader?: boolean;
  /** Starting cell; the engine lays units out when omitted. */
  pos?: Cell;
}

export interface GridUnit {
  id: string;
  team: Team;
  name: string;
  build: CharacterBuild;
  look: UnitLook;
  leader: boolean;
  derived: Derived;
  hp: number;
  mp: number;
  pos: Cell;
  facing: Facing;
  /** Status effects in the exact shape battle.ts / effects.ts use. */
  status: SideBattleState;
  /** Skill-slot cooldowns (same indices as build.skillIds) + legacy inner-art CD. */
  cd: number[];
  iaCD: number;
  /** Per-unit ATB gauge (0..100). */
  gauge: number;
  /** Tiles this unit may walk in one turn. */
  move: number;
  alive: boolean;
  /** Per-unit usage counters (drive skill / art XP in the world). */
  skillUses: Record<string, number>;
  artUses: Record<string, number>;
  hitsReceived: number;
  /** Meridian revive pending: rise with this % of max HP on falling (cleared when used). */
  revive?: number;
}

// ─── Battle items (the world's consumables, carried into the fight) ─────
/**
 * What a battle item does when the player uses it (costs the turn).
 * `heal` restores the user (flat + % of max); `throw` hits one foe within
 * `range` tiles for `power + Acc × dexScale − half its PD`, never missing,
 * and may leave poison (`pct` % of max HP per turn for `turns` turns).
 */
export type BattleItemEffect =
  | { t: "heal"; hp?: number; hpPct?: number; mp?: number; mpPct?: number }
  | { t: "throw"; power: number; dexScale: number; range: number; poison?: { pct: number; turns: number } };

// ─── Actions (what the UI / AI submits) ────────────────────────────────
export type GridAction =
  | { t: "move"; to: Cell }
  | { t: "skill"; slot: number; target: Cell }   // slot = index into build.skillIds (skill or "art:" slot)
  | { t: "wait" }
  | { t: "flee" }
  /** Use a battle item from the bag (state.bag); `target` is the user's own cell for heals. */
  | { t: "item"; itemId: string; name: string; effect: BattleItemEffect; target: Cell };

/** A whole turn as the AI plans it: optional move, then one action. */
export interface TurnPlan { move?: Cell; action: Exclude<GridAction, { t: "move" }> }

// ─── Presentation events (renderer reads the latest) ───────────────────
export interface TargetResult {
  unitId: string;
  damages: number[];
  crits: boolean[];
  misses: boolean[];
  /** HP gained (drain / heal) — shown as green numbers. */
  healed: number;
  killed: boolean;
}

export type GridEvent =
  | { seq: number; t: "move"; unitId: string; path: Cell[] }
  | { seq: number; t: "cast"; unitId: string; name: string; tier: SkillTierIndex;
      source: { kind: "skill" | "art" | "item"; id: string; poison?: boolean }; aimed: Cell; cells: Cell[]; results: TargetResult[] }
  | { seq: number; t: "wait"; unitId: string }
  | { seq: number; t: "stunned"; unitId: string }
  | { seq: number; t: "flee"; unitId: string; success: boolean }
  | { seq: number; t: "end"; winner: Team | null; escaped: boolean }
  /** A meridian (ชีพจร) trigger on `unitId` — float `label`, burst by `kind` (rage: its element). */
  | { seq: number; t: "proc"; unitId: string; kind: GridProcKind; label: string; el?: MeridianElement };

export type GridProcKind = "revive" | "shield" | "ward" | "rage" | "sap" | "opening" | "absorb";

// ─── Battle state ──────────────────────────────────────────────────────
export type GridPhase =
  | "start"
  | "turn"      // `activeId` is choosing (move not yet taken)
  | "moved"     // `activeId` already moved this turn, must act or wait
  | "over";

export interface GridBattleState {
  cols: number;
  rows: number;
  /** Impassable cells (rocks, wells…) as cellKey strings. */
  blocked: string[];
  units: GridUnit[];
  activeId: string | null;
  phase: GridPhase;
  /** Global action counter (every resolved action +1). */
  turn: number;
  log: LogLine[];
  /** Presentation queue: every event appended; renderer plays those with seq > last seen. */
  events: GridEvent[];
  winnerTeam: Team | null;

  // ── Compat mirror for the world store / sound director (unchanged readers) ──
  // "A" = allies won, "B" = enemies won. hA / mpA / skillUses.A / artUses.A /
  // hitsReceived.A mirror the leader (player) unit; B mirrors the first enemy.
  winner: Side | null;
  escaped?: boolean;
  hA: number;
  mpA: number;
  hB: number;
  mpB: number;
  skillUses: { A: Record<string, number>; B: Record<string, number> };
  artUses: { A: Record<string, number>; B: Record<string, number> };
  hitsReceived: { A: number; B: number };
  /** The leader's battle items left (item id → count); absent when none were brought. */
  bag?: Record<string, number>;
  /** Battle items used so far (item id → count): the world takes them from the inventory. */
  itemsUsed?: Record<string, number>;
}

/** Options for createGridBattle. */
export interface GridBattleOptions {
  cols?: number;   // default 10
  rows?: number;   // default 7
  blocked?: Cell[];
}

export const GRID_DEFAULT_COLS = 10;
export const GRID_DEFAULT_ROWS = 7;

/** The per-pair duel view type the engine builds to call battle.ts (A = actor, B = target). */
export type DuelView = BattleState;

/** The largest board a battle grows to (fits a phone held sideways). */
export const GRID_MAX_COLS = 15;
export const GRID_MAX_ROWS = 10;

/**
 * Board size for a battle with `units` units in total: the 10 × 7 duel board
 * for small fights, growing with the crowd up to 15 × 10.
 */
export function boardSizeFor(units: number): { cols: number; rows: number } {
  if (units <= 3) return { cols: GRID_DEFAULT_COLS, rows: GRID_DEFAULT_ROWS };
  if (units <= 5) return { cols: 12, rows: 8 };
  if (units <= 7) return { cols: 13, rows: 9 };
  return { cols: GRID_MAX_COLS, rows: GRID_MAX_ROWS };
}
