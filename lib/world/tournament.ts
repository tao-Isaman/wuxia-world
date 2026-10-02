// ชุมนุมวิจารณ์กระบี่ — the yearly sword tournament at the capital.
//
// Registration opens TOURNAMENT.registerFrom days into each year (a year is
// TOURNAMENT.yearDays days) and the tournament is fought on day
// TOURNAMENT.startDay, or on any of the next `graceDays` days, at the capital.
// 32 entrants: the hero (if registered) and the liveness NPCs (the named
// roster), topped up with other fighters who spar. Single elimination over
// five rounds. The hero's bouts are real non-fatal battles; every other bout
// is simulated from the two fighters' power scores. Each bout the hero wins
// pays gold and w-exp; their final place pays w-exp and ชื่อเสียง. The
// champion picks one move or art from everything the 32 entrants know —
// an NPC champion picks too (and grows a little stronger). The prize is the
// one documented exception to "sect moves come only from lineage quests".
// If the day passes without the hero, the year is fought without them.

import { getArt, parseSlotId, powerBreakdown, type CharacterBuild } from "@/lib/game";
import { namedNpcIds } from "./data/named-npcs";
import { NPCS, getNpc } from "./data/npcs";
import { getOpponent } from "./data/opponents";
import { npcPresent } from "./npc-presence";
import type { TournamentRecord, TournamentState, WorldStateData } from "./types";

export const TOURNAMENT = {
  locationId: "city_capital",
  yearDays: 360,
  /** Day of the year registration opens, and the tournament day. */
  registerFrom: 60,
  startDay: 90,
  /** Days after the tournament day it can still be started. */
  graceDays: 2,
  fee: 100,
  size: 32,
  historyMax: 20,
} as const;

export const PLAYER = "player";
/** Gold and w-exp for a bout won, by round (last 32 … final). */
export const BOUT_GOLD = [100, 200, 400, 800, 1600] as const;
export const BOUT_WEXP = [50, 100, 150, 250, 400] as const;
/** Final place when knocked out in a round (index = round); the champion is 1. */
export const PLACE_BY_ROUND = [17, 9, 5, 3, 2] as const;
export const PLACE_WEXP: Record<number, number> = { 1: 1500, 2: 800, 3: 500, 5: 300, 9: 150, 17: 60 };
export const PLACE_FAME: Record<number, number> = { 1: 40, 2: 25, 3: 15, 5: 8, 9: 4, 17: 1 };
export const ROUND_LABEL = ["รอบ 32 คน", "รอบ 16 คน", "รอบ 8 คน", "รอบรองชนะเลิศ", "รอบชิงชนะเลิศ"] as const;
export const PLACE_LABEL: Record<number, string> = { 1: "ชนะเลิศ", 2: "รองชนะเลิศ", 3: "อันดับ 3–4", 5: "อันดับ 5–8", 9: "อันดับ 9–16", 17: "อันดับ 17–32" };

type Rng = () => number;
type TState = Pick<WorldStateData, "day" | "tournament" | "tournamentHistory" | "npcExt" | "assassinatedNpcIds" | "kidnappedUntil"
  | "playerBuild" | "gold" | "wExp" | "traits" | "currentSceneId">;

export const yearOf = (day: number) => Math.floor((day - 1) / TOURNAMENT.yearDays) + 1;
export const dayOfYear = (day: number) => ((day - 1) % TOURNAMENT.yearDays) + 1;
/** The absolute day of a year's tournament. */
export const tournamentDay = (year: number) => (year - 1) * TOURNAMENT.yearDays + TOURNAMENT.startDay;

export type TournamentPhase = "closed" | "registration" | "day";
/** Where the calendar is: registration window, tournament days, or closed. */
export function tournamentPhase(day: number): TournamentPhase {
  const d = dayOfYear(day);
  if (d >= TOURNAMENT.startDay && d <= TOURNAMENT.startDay + TOURNAMENT.graceDays) return "day";
  if (d >= TOURNAMENT.registerFrom && d < TOURNAMENT.startDay) return "registration";
  return "closed";
}
/** Days until this year's (or next year's) registration opens, 0 while it is open. */
export function daysUntilRegistration(day: number): number {
  const d = dayOfYear(day);
  if (d >= TOURNAMENT.registerFrom && d <= TOURNAMENT.startDay + TOURNAMENT.graceDays) return 0;
  return d < TOURNAMENT.registerFrom ? TOURNAMENT.registerFrom - d : TOURNAMENT.yearDays - d + TOURNAMENT.registerFrom;
}

/** This year's tournament state, if any (an older one is history). */
export function currentTournament(state: Pick<WorldStateData, "tournament" | "day">): TournamentState | null {
  const t = state.tournament;
  return t && t.year === yearOf(state.day) ? t : null;
}
export const registered = (state: Pick<WorldStateData, "tournament" | "day">) => !!currentTournament(state);
/** The record of this year's tournament, once fought. */
export function yearRecord(state: Pick<WorldStateData, "tournamentHistory">, year: number): TournamentRecord | undefined {
  return state.tournamentHistory?.find((r) => r.year === year);
}

export type RegisterBlock = "closed" | "elsewhere" | "registered" | "gold" | "done";
/** Why the hero can't register now, or null if they can. */
export function registerBlock(state: TState): RegisterBlock | null {
  if (tournamentPhase(state.day) === "closed") return "closed";
  if (yearRecord(state, yearOf(state.day))) return "done";
  if (state.currentSceneId !== TOURNAMENT.locationId) return "elsewhere";
  if (registered(state)) return "registered";
  if (state.gold < TOURNAMENT.fee) return "gold";
  return null;
}

/** Pay the fee and enter this year's tournament. */
export function registerForTournament(state: TState): boolean {
  if (registerBlock(state)) return false;
  state.gold -= TOURNAMENT.fee;
  state.tournament = { year: yearOf(state.day), status: "registered", rounds: [], round: 0, playerOut: false, gold: 0, wExp: 0 };
  return true;
}

// ─── Entrants ─────────────────────────────────────────────────────────

/** The battle build an entrant fights with: their sparring opponent's build. */
export function entrantBuild(id: string): CharacterBuild | null {
  const opp = getOpponent(getNpc(id)?.sparOpponentId);
  return opp ? opp.build() : null;
}
/** The opponent id an NPC entrant fights the hero as. */
export const entrantOpponentId = (id: string) => getNpc(id)?.sparOpponentId ?? null;

function canEnter(state: TState, id: string): boolean {
  if (!getNpc(id) || !entrantBuild(id) || !npcPresent(state, id)) return false;
  const ext = state.npcExt?.[id];
  return !ext || ext.status === "alive";
}

/** NPC entrants: the living liveness roster first, then other sparring fighters, shuffled in. */
export function drawEntrants(state: TState, count: number, rng: Rng): string[] {
  const shuffle = <T,>(list: T[]) => {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  };
  const named = namedNpcIds().filter((id) => canEnter(state, id));
  const namedSet = new Set(named);
  const others = shuffle(NPCS.map((n) => n.id).filter((id) => !namedSet.has(id) && canEnter(state, id)));
  return shuffle([...named, ...others].slice(0, count));
}

/** An entrant's power score (the hero's from their build). */
export function entrantPower(state: Pick<WorldStateData, "playerBuild">, id: string): number {
  const build = id === PLAYER ? state.playerBuild : entrantBuild(id);
  return build ? powerBreakdown(build).total : 0;
}

/** Odds that `a` beats `b` in a simulated bout. */
export function boutOdds(a: number, b: number): number {
  const scale = Math.max(1, 0.12 * (a + b) / 2);
  return 1 / (1 + Math.exp(-(a - b) / scale));
}

// ─── Running it ───────────────────────────────────────────────────────

export type StartBlock = "closed" | "elsewhere" | "unregistered" | "started";
export function startBlock(state: TState): StartBlock | null {
  if (tournamentPhase(state.day) !== "day") return "closed";
  if (state.currentSceneId !== TOURNAMENT.locationId) return "elsewhere";
  const t = currentTournament(state);
  if (!t) return "unregistered";
  if (t.status !== "registered") return "started";
  return null;
}

/** Draw the bracket and begin round one with the hero in it. */
export function startTournament(state: TState, rng: Rng = Math.random): boolean {
  if (startBlock(state)) return false;
  const t = currentTournament(state)!;
  const seeds = [PLAYER, ...drawEntrants(state, TOURNAMENT.size - 1, rng)];
  for (let i = seeds.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [seeds[i], seeds[j]] = [seeds[j], seeds[i]]; }
  state.tournament = { ...t, status: "running", rounds: [seeds], round: 0 };
  return true;
}

/** The pairs of a round, in bracket order. */
export function roundPairs(t: TournamentState, round = t.round): [string, string | undefined][] {
  const seeds = t.rounds[round] ?? [];
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < seeds.length; i += 2) pairs.push([seeds[i], seeds[i + 1]]);
  return pairs;
}

/** The hero's opponent this round, or null (out, finished or not running). */
export function playerOpponent(t: TournamentState | null): string | null {
  if (!t || t.status !== "running" || t.playerOut) return null;
  const pair = roundPairs(t).find(([a, b]) => a === PLAYER || b === PLAYER);
  return pair ? (pair[0] === PLAYER ? pair[1] ?? null : pair[0]) : null;
}

export interface RoundOutcome { playerWon?: boolean; gold: number; wExp: number; fame: number; finished: boolean }

/**
 * Settle the current round: the hero's bout by `playerWon` (ignored once they
 * are out), every other bout simulated. Pays the hero, records their place
 * when they go out, and finishes the tournament after the final.
 */
export function resolveRound(state: TState, playerWon: boolean | null, rng: Rng = Math.random): RoundOutcome {
  const t = currentTournament(state);
  const outcome: RoundOutcome = { gold: 0, wExp: 0, fame: 0, finished: false };
  if (!t || t.status !== "running") return outcome;
  const round = t.round;
  const winners: string[] = [];
  let playerOut = t.playerOut, playerPlace = t.playerPlace;
  for (const [a, b] of roundPairs(t)) {
    if (b === undefined) { winners.push(a); continue; }
    if ((a === PLAYER || b === PLAYER) && !playerOut) {
      const won = playerWon === true;
      outcome.playerWon = won;
      winners.push(won ? PLAYER : a === PLAYER ? b : a);
      if (won) { outcome.gold += BOUT_GOLD[round]; outcome.wExp += BOUT_WEXP[round]; }
      else { playerOut = true; playerPlace = PLACE_BY_ROUND[round]; }
      continue;
    }
    winners.push(rng() < boutOdds(entrantPower(state, a), entrantPower(state, b)) ? a : b);
  }
  // Out this round: the place pays w-exp and fame.
  if (playerOut && !t.playerOut && playerPlace) {
    outcome.wExp += PLACE_WEXP[playerPlace] ?? 0;
    outcome.fame += PLACE_FAME[playerPlace] ?? 0;
  }
  const next: TournamentState = { ...t, rounds: [...t.rounds, winners], round: round + 1, playerOut, playerPlace,
    gold: t.gold + outcome.gold, wExp: t.wExp + outcome.wExp };
  if (winners.length === 1) {
    const champion = winners[0];
    next.status = "finished";
    next.champion = champion;
    next.pickOptions = prizeOptions(next, state.playerBuild);
    if (champion === PLAYER) {
      next.playerPlace = 1;
      outcome.wExp += PLACE_WEXP[1];
      outcome.fame += PLACE_FAME[1];
      next.wExp += PLACE_WEXP[1];
    } else if (next.pickOptions.length) {
      // An NPC champion picks too, and grows a little stronger for it.
      next.championPick = next.pickOptions[Math.floor(rng() * next.pickOptions.length)];
      const ext = state.npcExt?.[champion];
      if (ext) state.npcExt[champion] = { ...ext, power: Math.min(100, ext.power + 2) };
    }
    recordYear(state, next);
    outcome.finished = true;
  }
  state.tournament = next;
  state.gold += outcome.gold;
  state.wExp += outcome.wExp;
  if (outcome.fame) state.traits = { ...state.traits, fame: (state.traits.fame ?? 0) + outcome.fame };
  return outcome;
}

/** Simulate every remaining round (the hero is out, or never came). */
export function finishTournament(state: TState, rng: Rng = Math.random): void {
  for (let guard = 0; guard < 6; guard++) {
    const t = currentTournament(state);
    if (!t || t.status !== "running") return;
    resolveRound(state, null, rng);
  }
}

/** Everything the 32 entrants know, as slot ids, that the hero hasn't learned. */
export function prizeOptions(t: TournamentState, hero: CharacterBuild | null): string[] {
  const known = new Set<string>([...(hero?.learnedSkillIds ?? []), ...(hero?.learnedArtIds ?? []).map((id) => `art:${id}`)]);
  const options = new Set<string>();
  for (const id of t.rounds[0] ?? []) {
    if (id === PLAYER) continue;
    const build = entrantBuild(id);
    if (!build) continue;
    for (const raw of build.skillIds) if (raw && parseSlotId(raw)) options.add(raw);
    if (build.artId && build.artId !== "none" && getArt(build.artId)) options.add(`art:${build.artId}`);
  }
  return [...options].filter((raw) => !known.has(raw)).sort();
}

/** The hero, as champion, takes one move or art from the options. */
export function pickPrize(state: TState, slotId: string): { kind: "skill"; id: string } | { kind: "art"; id: string } | null {
  const t = currentTournament(state);
  if (!t || t.status !== "finished" || t.champion !== PLAYER || t.championPick) return null;
  if (!t.pickOptions?.includes(slotId)) return null;
  const slot = parseSlotId(slotId);
  if (!slot) return null;
  state.tournament = { ...t, championPick: slotId };
  state.tournamentHistory = (state.tournamentHistory ?? []).map((r) => r.year === t.year ? { ...r, championPick: slotId } : r);
  return slot.kind === "skill" ? { kind: "skill", id: slot.skill.id } : { kind: "art", id: slot.art.id };
}

function recordYear(state: TState, t: TournamentState): void {
  const record: TournamentRecord = { year: t.year, champion: t.champion!, championPick: t.championPick, playerPlace: t.playerPlace };
  const history = (state.tournamentHistory ?? []).filter((r) => r.year !== t.year);
  state.tournamentHistory = [...history, record].slice(-TOURNAMENT.historyMax);
}

/**
 * After a tournament's last day: a year fought without the hero is simulated
 * (an unstarted registration is forfeit), and a bracket the hero left
 * running is finished. Called as time passes.
 */
export function settleTournaments(state: TState, rng: Rng = Math.random): void {
  const year = yearOf(state.day);
  const past = dayOfYear(state.day) > TOURNAMENT.startDay + TOURNAMENT.graceDays;
  const t = currentTournament(state);
  if (t?.status === "running" && (past || t.playerOut)) {
    if (!t.playerOut) {
      // Walked away mid-tournament: a forfeit.
      state.tournament = { ...t, playerOut: true, playerPlace: PLACE_BY_ROUND[t.round] };
    }
    finishTournament(state, rng);
  }
  if (!past || yearRecord(state, year)) return;
  // Nobody fought this year with the hero: run it among the NPCs.
  const seeds = drawEntrants(state, TOURNAMENT.size, rng);
  if (seeds.length < 2) return;
  // A registration never started is forfeit (the fee is gone).
  state.tournament = { year, status: "running", rounds: [seeds], round: 0, playerOut: true, gold: 0, wExp: 0 };
  finishTournament(state, rng);
}

/** Display name of an entrant. */
export function entrantName(id: string, heroName = "ท่าน"): string {
  return id === PLAYER ? heroName : getNpc(id)?.name ?? id;
}
/** Display name of a prize option. */
export function prizeName(slotId: string): string {
  const slot = parseSlotId(slotId);
  if (!slot) return slotId;
  return slot.kind === "skill" ? slot.skill.n : `${slot.art.n} (กำลังภายใน)`;
}
