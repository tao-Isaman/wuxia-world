// ชุมนุมประลองกระบี่หัวซาน — the sword tournament on Mount Hua (the Huashan
// sect's grounds), held every two real weeks on the Thai calendar
// (calendar.ts). Each round (still called a "year" in the code and the save,
// `TournamentState.year`) begins on a Monday at 00:00: the holder of
// Huashan's seat sends the hero an invitation letter with the fee for the
// road (`sendTournamentInvitation`), and registration is open until the
// second Saturday at 20:00, when the bouts begin; they can be fought until
// that Sunday at 23:00. One world day is one real hour, so the round is
// TOURNAMENT.yearDays = 14 × 24 world days, counted from TOURNAMENT.anchorDay.
// 32 entrants: the hero (if registered) and the liveness NPCs (the named
// roster), topped up with other fighters who spar. Single elimination over
// five rounds. The hero's bouts are real non-fatal battles; every other bout
// is simulated from the two fighters' power scores. Each bout the hero wins
// pays gold and w-exp; their final place pays w-exp and ชื่อเสียง. The
// champion picks one move or art from everything the 32 entrants know, every
// time — an NPC champion picks too (and grows a little stronger). The prize
// is the one documented exception to "sect moves come only from lineage
// quests". If the days pass without the hero, the round is fought without them.

import { getArt, parseSlotId, powerBreakdown, type CharacterBuild } from "@/lib/game";
import { getNamedDefault, namedNpcIds } from "./data/named-npcs";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { NPCS, getNpc } from "./data/npcs";
import { getOpponent, npcFoeId } from "./data/opponents";
import { npcPresent } from "./npc-presence";
import { generateWarning } from "./rumor-engine";
import { sectChief } from "./npc-life";
import { thaiDateOfDay } from "./calendar";
import type { TournamentRecord, TournamentState, WorldStateData } from "./types";

export const TOURNAMENT = {
  locationId: "sect_huashan",
  /** A round is two real weeks: 14 × 24 world days (one world day is one real hour). */
  yearDays: 336,
  /** The world day a round began on: Monday 2026-10-05, 00:00 Thai time (world day 1 is Tuesday 2026-10-13). */
  anchorDay: -191,
  /** Day of the round registration opens (Monday of week one, 00:00), and the tournament day (Saturday of week two, 20:00). */
  registerFrom: 1,
  startDay: 309,
  /** Days after the tournament day it can still be started: until Sunday 23:00. */
  graceDays: 26,
  fee: 100,
  size: 32,
  historyMax: 20,
} as const;

/** The tournament's name, everywhere the player reads it. */
export const TOURNAMENT_NAME = "ชุมนุมประลองกระบี่หัวซาน";
/** Who writes the invitation when nobody holds Huashan's seat (an old save before the first tick). */
const HOST_FALLBACK = "sect_huashan_master_yiqing";

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

/** The tournament round (1, 2, …) a world day falls in. */
export const yearOf = (day: number) => Math.floor((day - TOURNAMENT.anchorDay) / TOURNAMENT.yearDays) + 1;
/** The day of its round, 1–yearDays (each is one real hour). */
export const dayOfYear = (day: number) => (((day - TOURNAMENT.anchorDay) % TOURNAMENT.yearDays) + TOURNAMENT.yearDays) % TOURNAMENT.yearDays + 1;
/** The absolute world day a round begins on. */
export const roundStartDay = (year: number) => TOURNAMENT.anchorDay + (year - 1) * TOURNAMENT.yearDays;
/** The absolute day of a round's tournament (its first bout hour). */
export const tournamentDay = (year: number) => roundStartDay(year) + TOURNAMENT.startDay - 1;
/** The absolute day after a round's last bout hour (the tournament is over). */
export const tournamentEndDay = (year: number) => tournamentDay(year) + TOURNAMENT.graceDays + 1;

export type TournamentPhase = "closed" | "registration" | "day";
/** Where the calendar is: registration window, tournament days, or closed. */
export function tournamentPhase(day: number): TournamentPhase {
  const d = dayOfYear(day);
  if (d >= TOURNAMENT.startDay && d <= TOURNAMENT.startDay + TOURNAMENT.graceDays) return "day";
  if (d >= TOURNAMENT.registerFrom && d < TOURNAMENT.startDay) return "registration";
  return "closed";
}
/** Days (real hours) until this round's (or the next round's) registration opens, 0 while it is open. */
export function daysUntilRegistration(day: number): number {
  const d = dayOfYear(day);
  if (d >= TOURNAMENT.registerFrom && d <= TOURNAMENT.startDay + TOURNAMENT.graceDays) return 0;
  return d < TOURNAMENT.registerFrom ? TOURNAMENT.registerFrom - d : TOURNAMENT.yearDays - d + TOURNAMENT.registerFrom;
}

/** This round's tournament state, if any (an older one is history). */
export function currentTournament(state: Pick<WorldStateData, "tournament" | "day">): TournamentState | null {
  const t = state.tournament;
  return t && t.year === yearOf(state.day) ? t : null;
}
export const registered = (state: Pick<WorldStateData, "tournament" | "day">) => !!currentTournament(state);
/** The record of a round's tournament, once fought. */
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

/** Pay the fee and enter this round's tournament. */
export function registerForTournament(state: TState): boolean {
  if (registerBlock(state)) return false;
  state.gold -= TOURNAMENT.fee;
  state.tournament = { year: yearOf(state.day), status: "registered", rounds: [], round: 0, playerOut: false, gold: 0, wExp: 0 };
  return true;
}

// ─── Entrants ─────────────────────────────────────────────────────────

/** The opponent id an NPC entrant fights the hero as: their sparring build, else (a wanderer) one made from their strength and school. */
export function entrantOpponentId(id: string): string | null {
  const authored = getNpc(id)?.sparOpponentId;
  if (authored) return authored;
  const ext = getNamedDefault(id);
  return ext ? npcFoeId(id, ext.power, ext.sect ? SECT_MEMBERSHIPS[ext.sect]?.name ?? null : null) : null;
}
/** The battle build an entrant fights with. */
export function entrantBuild(id: string): CharacterBuild | null {
  const opp = getOpponent(entrantOpponentId(id));
  return opp ? opp.build() : null;
}

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
  return currentTournament(state) ? resolveRoundOf(state, playerWon, rng) : { gold: 0, wExp: 0, fame: 0, finished: false };
}

/** resolveRound on the hero's tournament state, whatever round it belongs to. */
function resolveRoundOf(state: TState, playerWon: boolean | null, rng: Rng): RoundOutcome {
  const t = state.tournament;
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
 * After a tournament's last hour: a round fought without the hero is
 * simulated (an unstarted registration is forfeit), and a bracket the hero
 * left running is finished. A round that ended while the hero was away is
 * settled when they come back (the one just before this one at least).
 * Called as time passes.
 */
export function settleTournaments(state: TState, rng: Rng = Math.random): void {
  const year = yearOf(state.day);
  const simulate = (round: number) => {
    const seeds = drawEntrants(state, TOURNAMENT.size, rng);
    if (seeds.length < 2) return;
    // A registration never started is forfeit (the fee is gone).
    state.tournament = { year: round, status: "running", rounds: [seeds], round: 0, playerOut: true, gold: 0, wExp: 0 };
    finishRound(state, rng);
  };
  // A round of the hero's from before (they were away when it ended).
  const old = state.tournament;
  if (old && old.year < year && !yearRecord(state, old.year)) {
    if (old.status === "running") {
      if (!old.playerOut) state.tournament = { ...old, playerOut: true, playerPlace: PLACE_BY_ROUND[old.round] };
      finishRound(state, rng);
    } else if (old.status === "registered") simulate(old.year);
  }
  // The round before this one, if nobody settled it (the hero never came).
  if (year > 1 && !yearRecord(state, year - 1) && (state.tournament?.year ?? 0) < year) simulate(year - 1);
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
  // Nobody fought this round with the hero: run it among the NPCs.
  simulate(year);
}

/** Simulate every remaining bout of the hero's tournament state, whatever round it belongs to. */
function finishRound(state: TState, rng: Rng): void {
  for (let guard = 0; guard < 6 && state.tournament?.status === "running"; guard++) resolveRoundOf(state, null, rng);
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

// ─── The invitation ────────────────────────────────────────────────────

/** The host: whoever holds Huashan's seat now, else its authored master (if alive). */
export function tournamentHost(state: Pick<WorldStateData, "npcExt" | "assassinatedNpcIds" | "kidnappedUntil" | "day">): string | null {
  const chief = sectChief(state as WorldStateData, "huashan");
  if (chief) return chief;
  return getNpc(HOST_FALLBACK) && npcPresent(state, HOST_FALLBACK) ? HOST_FALLBACK : null;
}

/**
 * While registration is open (checked on each new world day — a real hour —
 * after `fromDay`), Huashan's chief writes to the hero once a round: when,
 * where, the fee — and the fee itself for the road. Returns it when sent.
 */
export function sendTournamentInvitation(state: WorldStateData, fromDay: number): import("./types").Letter | null {
  if (state.day <= fromDay || tournamentPhase(state.day) !== "registration") return null;
  {
    const day = state.day;
    const year = yearOf(day);
    const id = `letter_invite_${year}`;
    if ((state.letters ?? []).some((l) => l.id === id)) return null;
    const host = tournamentHost(state);
    if (!host) return null;
    const name = getNpc(host)?.name ?? "เจ้าสำนักหัวซาน";
    const letter = {
      id, day, npcId: host, rarity: 2, gold: TOURNAMENT.fee, read: false, claimed: false,
      text: `ถึงจอมยุทธ์ผู้มีฝีมือ — สำนักหัวซานขอเชิญท่านร่วม${TOURNAMENT_NAME}ครั้งที่ ${year} `
        + `เปิดรับลงชื่อที่ลานบนยอดเขาหัวซานตั้งแต่บัดนี้จนก่อน${thaiDateOfDay(tournamentDay(year))} ค่าลงชื่อ ${TOURNAMENT.fee} ตำลึง `
        + `ประลองจริงตั้งแต่${thaiDateOfDay(tournamentDay(year))} ถึง${thaiDateOfDay(tournamentEndDay(year))} ยอดฝีมือสามสิบสองคนจะได้วัดกันว่าใครคือกระบี่อันดับหนึ่งแห่งยุคนี้ `
        + `ข้าแนบค่าเดินทางมาให้ด้วย หวังว่าจะได้พบท่านบนยอดเขา — ${name}`,
    };
    state.letters = [...(state.letters ?? []), letter];
    return letter;
  }
  return null;
}

/** Days before the tournament the inns start talking about it (a warning rumor): three real days. */
export const TOURNAMENT_WARNING_DAYS = 72;

/**
 * The tournament's warning rumor (rumor-engine `generateWarning`, kind
 * `tournament`): from TOURNAMENT_WARNING_DAYS before the tournament day until
 * the day before it, every inn hears "อีก N วันจะมีชุมนุมประลองกระบี่หัวซาน…".
 * One rumor a round (id `rumor_warn_tournament_y<year>`), its day count kept
 * current on every sync. Returns its id, or null outside the window.
 */
export function scheduleTournamentWarning(state: WorldStateData): string | null {
  const year = yearOf(state.day);
  const day = tournamentDay(year);
  const left = day - state.day;
  if (left < 1 || left > TOURNAMENT_WARNING_DAYS) return null;
  return generateWarning({
    state,
    warningKind: "tournament",
    triggerDay: day,
    locationId: TOURNAMENT.locationId,
    payload: { event: TOURNAMENT_NAME },
    id: `rumor_warn_tournament_y${year}`,
    expiresDay: day - 1,
    region: "global",
  });
}
