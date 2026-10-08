// Liveness 2.0 — the weekly life of the jianghu.
//
// `tickAllNamedNpcs` runs from the world store's advanceTime. Every 7 world
// days each living person:
//
//   1. ages — a year on their own birthday (`birthday`, a day of the year);
//   2. may die of age — a yearly risk by age band, lower for the strong,
//      spread over the 52 weeks (`deathChance`);
//   3. trains — power grows fast when young and weak, slowly near the top,
//      and wanes past seventy;
//   4. works at their goals (master an art, climb the sect, avenge a rival,
//      seek a treasure, seek wisdom in seclusion);
//   5. walks one leg of a journey if they are on one (2–3 places a week),
//      and acts on arrival: knocks on a sect gate, fights a rival, digs for a
//      treasure, goes home;
//   6. otherwise decides what to do next from their temper (`decide`):
//      wander, join a sect, enter seclusion, go after a rival, take a
//      disciple, leave their sect, marry — or simply stay and train.
//
// After every week empty sect seats are filled (npc-life.ts fillEmptySeats)
// and, when few sectless travellers are left, a newcomer appears. Every
// change fires an event (eventHistory + a rumor), so what the hero hears is
// what happened.

import type { NpcExtState, NpcGoal, NpcPlan, SectId, WorldStateData } from "./types";
import { ARTS } from "../game/data/arts";
import { getQuest } from "./data/quests";
import {
  CELIBATE_SECTS, CROOKED_SECTS, FEMALE_ONLY_SECTS, MALE_ONLY_SECTS, UPRIGHT_SECTS,
} from "./data/liveness-roster";
import { WORLD_COORDS } from "./data/world-coords";
import { seededRng } from "./shared/rng";
import {
  SEAT_RANK, TRAVEL_SPOTS, WANDERERS_MIN, aliveDynamicCount, DYNAMIC_CAP, fillEmptySeats, fireLifeEvent, hallOf,
  isAliveExt, journeyTo, killNpc, sectMembers, sectName, seedLiveness, spawnPerson,
} from "./npc-life";

export interface TickOptions {
  currentDay: number;
  /** Random source (tests pass a seeded one). */
  rng?: () => number;
  /**
   * The world seed: each week then draws from its own seeded stream
   * (seededRng(seed, day)), so the same world gives the same week on any
   * machine. Ignored when `rng` is given.
   */
  seed?: number;
}

export const TICK_INTERVAL_DAYS = 7;
/** Weeks simulated in full per call; longer gaps only age people (and keep the leftover days). */
const MAX_TICKS_PER_CALL = 8;
const POWER_CAP = 100;
/** Chance a person with nothing on their hands makes a choice this week. */
const DECIDE_CHANCE = 0.35;
const DISCIPLES_PER_MASTER = 2;
const DYNAMIC_PER_SECT = 6;
const STAY_DAYS: readonly [number, number] = [7, 21];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const between = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

// ─── Aging and death ───────────────────────────────────────────────────

/** Birthdays passed in (from, to]. */
export function birthdaysBetween(from: number, to: number, birthday: number): number {
  if (to <= from) return 0;
  return Math.floor((to - birthday) / 365) - Math.floor((from - birthday) / 365);
}

/** Yearly risk of dying of age, before strength is counted. */
function yearlyRisk(age: number): number {
  if (age < 40) return 0.002;
  if (age < 50) return 0.005;
  if (age < 60) return 0.012;
  if (age < 70) return 0.03;
  if (age < 80) return 0.07;
  if (age < 90) return 0.15;
  return 0.3;
}

/** This week's chance of dying of age: inner strength keeps a master alive longer; a wound does not. */
export function deathChance(ext: Pick<NpcExtState, "age" | "power" | "woundedUntil">, day: number): number {
  let yearly = yearlyRisk(ext.age) * clamp(1.5 - ext.power / 100, 0.4, 1.5);
  if ((ext.woundedUntil ?? 0) > day) yearly *= 3;
  return 1 - Math.pow(1 - Math.min(0.95, yearly), 1 / 52);
}

/** A week of practice: quick for the young and weak, slow near the summit, ebbing past seventy. */
export function trainingGain(ext: Pick<NpcExtState, "age" | "power" | "temper">, rng: () => number): number {
  const drive = 0.15 + (ext.temper?.ambition ?? 0.5) * 0.25;
  let gain = drive * (1 - ext.power / 105) * (0.5 + rng());
  if (ext.age > 70) gain -= 0.06 * (ext.age - 70) / 10;
  return gain;
}

// ─── Choosing a sect ───────────────────────────────────────────────────

function admits(sect: SectId, gender: "male" | "female" | undefined): boolean {
  if (MALE_ONLY_SECTS.has(sect)) return gender !== "female";
  if (FEMALE_ONLY_SECTS.has(sect)) return gender === "female";
  return true;
}

function distance(a: string, b: string): number {
  const p = WORLD_COORDS[a], q = WORLD_COORDS[b];
  return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : 9999;
}

/** The sect a sectless person of this bent would walk to: one that takes them, near rather than far. */
export function chooseSect(ext: NpcExtState, rng: () => number, exclude?: SectId | null): SectId | null {
  const pool = (ext.temper?.righteous ?? 0) >= 0 ? UPRIGHT_SECTS : CROOKED_SECTS;
  const options = pool.filter((s) => s !== exclude && admits(s, ext.gender));
  if (!options.length) return null;
  const scored = options.map((s) => ({ s, w: 1 / (1 + distance(ext.currentLocation, hallOf(s)) / 200) + rng() * 0.5 }));
  scored.sort((a, b) => b.w - a.w);
  return scored[0]!.s;
}

// ─── Journeys ──────────────────────────────────────────────────────────

const JOURNEY_TOLD = new Set<NpcPlan["purpose"]>(["join", "duel", "treasure", "defect"]);

function setOut(state: WorldStateData, id: string, ext: NpcExtState, plan: NpcPlan | null, day: number, rng: () => number): boolean {
  if (!plan) return false;
  ext.plan = plan;
  if (JOURNEY_TOLD.has(plan.purpose) || (plan.purpose === "wander" && rng() < 0.25)) {
    fireLifeEvent(state, id, "journey", day, {
      partnerNpcId: plan.targetNpcId,
      payload: { purpose: plan.purpose, dest: plan.to, ...(plan.sect ? { sect: plan.sect } : {}) },
    });
  }
  return true;
}

/** Walk this week's leg (2–3 places); returns true on arrival. */
function walk(ext: NpcExtState): boolean {
  const plan = ext.plan;
  if (!plan) return false;
  const hops = (ext.temper?.wanderlust ?? 0) > 0.7 ? 3 : 2;
  for (let i = 0; i < hops && plan.path.length; i++) ext.currentLocation = plan.path.shift()!;
  return plan.path.length === 0;
}

function joinSect(state: WorldStateData, id: string, ext: NpcExtState, sect: SectId, day: number, rng: () => number): boolean {
  // The gate does not open for everyone: the young and the gifted more often.
  const welcome = 0.45 + (ext.age < 30 ? 0.2 : 0) + ext.power / 200;
  if (rng() > welcome) {
    ext.temper = { ...(ext.temper ?? { righteous: 0, ambition: 0.5, wanderlust: 0.5, loyalty: 0.5 }), wanderlust: Math.min(1, (ext.temper?.wanderlust ?? 0.5) + 0.2) };
    return false;
  }
  ext.sect = sect;
  ext.sectRank = ext.power >= 60 ? 6 : ext.power >= 40 ? 4 : 1;
  ext.homeLocation = hallOf(sect);
  ext.currentLocation = hallOf(sect);
  ext.goals = [...ext.goals.filter((g) => g.kind !== "climb_sect"), { kind: "climb_sect", targetRank: 9, progress: 0, threshold: 60 }];
  fireLifeEvent(state, id, "join_sect", day, { locationId: hallOf(sect), payload: { sect } });
  return true;
}

/** Two people fight. The loser is wounded, or killed when the winner is wicked or the feud is old. */
function duel(state: WorldStateData, id: string, ext: NpcExtState, targetId: string, target: NpcExtState, day: number, rng: () => number): void {
  const mine = ext.power + rng() * 25, theirs = target.power + rng() * 25;
  const [winId, win, loseId, lose] = mine >= theirs ? [id, ext, targetId, target] : [targetId, target, id, ext];
  win.power = Math.min(POWER_CAP, win.power + 2);
  // The wicked kill; an old feud may end in death; the upright spare the beaten.
  const righteous = win.temper?.righteous ?? 0;
  const lethal = righteous < -0.2 ? 0.6 : win.rivals.includes(loseId) ? (righteous > 0.5 ? 0.1 : 0.3) : 0.03;
  if (rng() < lethal) {
    killNpc(state, loseId, day, { by: winId, kind: "death_combat", locationId: win.currentLocation }, rng);
    win.rivals = win.rivals.filter((r) => r !== loseId);
    // Those who loved the dead remember the killer.
    for (const [otherId, other] of Object.entries(state.npcExt)) {
      if (otherId === winId || !isAliveExt(other)) continue;
      const close = other.allies.includes(loseId) || other.masterId === loseId || other.spouseId === loseId
        || state.npcExt[loseId]?.masterId === otherId;
      if (close && !other.rivals.includes(winId)) other.rivals.push(winId);
    }
    return;
  }
  lose.woundedUntil = day + between(rng, 30, 60);
  lose.power = Math.max(1, lose.power - 2);
  fireLifeEvent(state, winId, "duel", day, { partnerNpcId: loseId, locationId: win.currentLocation, payload: { won: true } });
}

function arrive(state: WorldStateData, id: string, ext: NpcExtState, day: number, rng: () => number): void {
  const plan = ext.plan!;
  switch (plan.purpose) {
    case "join":
    case "defect": {
      const sect = plan.sect;
      const joined = sect && !ext.sect ? joinSect(state, id, ext, sect, day, rng) : false;
      ext.plan = joined ? null : { purpose: "wander", path: [], to: ext.currentLocation, stayDays: between(rng, ...STAY_DAYS), arrivedDay: day };
      return;
    }
    case "duel": {
      const targetId = plan.targetNpcId;
      const target = targetId ? state.npcExt[targetId] : undefined;
      if (!targetId || !target || !isAliveExt(target)) { ext.plan = null; return; }
      if (target.currentLocation === ext.currentLocation && target.status === "alive") {
        ext.plan = null;
        duel(state, id, ext, targetId, target, day, rng);
        return;
      }
      // They moved on: follow once more, then give up.
      const retry = plan.stayDays ?? 0;
      ext.plan = retry < 2 ? journeyTo(ext.currentLocation, target.currentLocation, "duel", { targetNpcId: targetId, stayDays: retry + 1 }) : null;
      return;
    }
    case "treasure": {
      ext.power = Math.min(POWER_CAP, ext.power + 4);
      fireLifeEvent(state, id, "found_treasure", day, { payload: { itemId: plan.itemId ?? "ancient_coin", locationId: ext.currentLocation } });
      ext.plan = ext.sect ? journeyTo(ext.currentLocation, ext.homeLocation, "home") : null;
      return;
    }
    case "home":
      ext.plan = null;
      return;
    default:
      // A visit or a wander: stay a while before deciding again.
      if (plan.arrivedDay === undefined) {
        plan.arrivedDay = day;
        plan.stayDays ??= between(rng, ...STAY_DAYS);
      } else if (day - plan.arrivedDay >= (plan.stayDays ?? 7)) {
        ext.plan = null;
      }
  }
}

// ─── Goals ─────────────────────────────────────────────────────────────

const TREASURE_SPOTS: readonly string[] = Object.keys(WORLD_COORDS).filter((id) => /^(cave_|cliff_|mt_|valley_)/.test(id));
const TREASURES = ["ancient_coin", "jade", "snow_lotus", "mithril_ore", "wood_sacred", "jade_amulet"];

function sectArt(sect: SectId | null, rng: () => number): string {
  const name = sectName(sect);
  const arts = ARTS.filter((a) => a.id !== "none" && (name ? a.sc === name : a.sc === "ยุทธจักร"));
  return arts.length ? arts[Math.floor(rng() * arts.length)]!.id : "none";
}

function workGoals(state: WorldStateData, id: string, ext: NpcExtState, day: number, rng: () => number): void {
  const kept: NpcGoal[] = [];
  for (const goal of ext.goals) {
    goal.progress += between(rng, 1, 3);
    if (goal.progress < goal.threshold) { kept.push(goal); continue; }
    switch (goal.kind) {
      case "master_art":
        ext.power = Math.min(POWER_CAP, ext.power + 6);
        fireLifeEvent(state, id, "master_art", day, {
          payload: goal.artId && goal.artId !== "none" ? { artId: goal.artId } : {},
          // A young disciple's progress is no news; a master's is.
          silent: ext.power < 60,
        });
        if (rng() < 0.6) kept.push({ kind: "master_art", artId: sectArt(ext.sect, rng), progress: 0, threshold: 120 });
        break;
      case "climb_sect":
        if (ext.sect && ext.sectRank < SEAT_RANK - 1 && ext.power >= 20 + ext.sectRank * 8) {
          ext.sectRank += 1;
          // Only an elder's rise is talked about outside the sect.
          fireLifeEvent(state, id, "sect_promotion", day, { payload: { sect: ext.sect, rank: ext.sectRank }, silent: ext.sectRank < 7 });
        }
        if (ext.sect && ext.sectRank < SEAT_RANK - 1) kept.push({ ...goal, progress: 0, threshold: 60 + ext.sectRank * 10 });
        break;
      case "avenge": {
        const target = state.npcExt[goal.targetNpcId];
        if (target && isAliveExt(target) && !ext.plan && (ext.woundedUntil ?? 0) <= day) {
          setOut(state, id, ext, journeyTo(ext.currentLocation, target.currentLocation, "duel", { targetNpcId: goal.targetNpcId }), day, rng);
        } else if (target && isAliveExt(target)) {
          kept.push({ ...goal, progress: Math.floor(goal.threshold / 2) });
        }
        break;
      }
      case "find_treasure": {
        if (!ext.plan) {
          const to = TREASURE_SPOTS[Math.floor(rng() * TREASURE_SPOTS.length)]!;
          setOut(state, id, ext, journeyTo(ext.currentLocation, to, "treasure", { itemId: TREASURES[Math.floor(rng() * TREASURES.length)] }), day, rng);
        }
        break;
      }
      case "seek_wisdom":
        enterSeclusion(state, id, ext, day, rng);
        break;
    }
  }
  ext.goals = kept;
}

function enterSeclusion(state: WorldStateData, id: string, ext: NpcExtState, day: number, rng: () => number): void {
  ext.status = "secluded";
  ext.secludedUntil = day + between(rng, 30, 120);
  ext.plan = null;
  ext.currentLocation = ext.homeLocation;
  fireLifeEvent(state, id, "secluded", day, { payload: { locationId: ext.homeLocation } });
}

// ─── Deciding ──────────────────────────────────────────────────────────

/** People the hero has business with stay put while that business is open. */
function heldByHero(state: WorldStateData): Set<string> {
  const held = new Set<string>();
  for (const q of Object.values(state.quests)) {
    if (q.status !== "active") continue;
    const def = getQuest(q.id);
    if (def?.giverNpcId) held.add(def.giverNpcId);
    if (def?.turnInNpcId) held.add(def.turnInNpcId);
  }
  return held;
}

type Choice = { w: number; act: () => void };

function decide(state: WorldStateData, id: string, ext: NpcExtState, day: number, rng: () => number, held: Set<string>): void {
  if (rng() > DECIDE_CHANCE) return;
  const temper = ext.temper ?? { righteous: 0, ambition: 0.5, wanderlust: 0.3, loyalty: 0.7 };
  const chief = ext.sectRank >= SEAT_RANK;
  const wounded = (ext.woundedUntil ?? 0) > day;
  const atHome = ext.currentLocation === ext.homeLocation;
  const choices: Choice[] = [{ w: 1, act: () => {} }];

  // Go home: members away from their sect.
  if (ext.sect && !atHome) choices.push({ w: 2, act: () => setOut(state, id, ext, journeyTo(ext.currentLocation, ext.homeLocation, "home"), day, rng) });

  if (!held.has(id) && !wounded) {
    // Wander: the sectless roam; members visit; chiefs rarely leave their seat.
    const roam = ext.sect ? (chief ? 0.08 : 0.25) : 1;
    choices.push({ w: temper.wanderlust * roam, act: () => {
      const options = TRAVEL_SPOTS.filter((p) => p !== ext.currentLocation);
      const to = options[Math.floor(rng() * options.length)]!;
      setOut(state, id, ext, journeyTo(ext.currentLocation, to, ext.sect ? "visit" : "wander", { stayDays: between(rng, ...STAY_DAYS) }), day, rng);
    } });

    // Knock on a sect gate.
    if (!ext.sect && ext.age >= 14 && ext.age <= 45 && temper.loyalty > 0.35) {
      choices.push({ w: (1 - temper.wanderlust * 0.5) * 0.6 + temper.ambition * 0.3, act: () => {
        const sect = chooseSect(ext, rng, ext.formerSect);
        if (sect) setOut(state, id, ext, journeyTo(ext.currentLocation, hallOf(sect), "join", { sect }), day, rng);
      } });
    }

    // Go after a rival who is within reach.
    const rival = ext.rivals.map((r) => [r, state.npcExt[r]] as const)
      .find(([, r]) => r && r.status === "alive" && r.power <= ext.power * 1.25);
    if (rival) {
      choices.push({ w: temper.ambition * (temper.righteous < 0 ? 0.45 : 0.25) * (chief ? 0.5 : 1), act: () => {
        setOut(state, id, ext, journeyTo(ext.currentLocation, rival[1]!.currentLocation, "duel", { targetNpcId: rival[0] }), day, rng);
      } });
    }
  }

  // Closed-door training.
  if (ext.power >= 50 && ext.age >= 35 && atHome) {
    choices.push({ w: temper.ambition * 0.05, act: () => enterSeclusion(state, id, ext, day, rng) });
  }

  // Take a disciple: elders at home with room in their school.
  if (ext.sect && ext.sectRank >= 7 && ext.age >= 35 && atHome) {
    const mine = Object.values(state.npcExt).filter((e) => e.masterId === id && isAliveExt(e)).length;
    const sectDynamic = sectMembers(state, ext.sect).filter((m) => state.npcExt[m]?.dynamic).length;
    if (mine < DISCIPLES_PER_MASTER && sectDynamic < DYNAMIC_PER_SECT && aliveDynamicCount(state) < DYNAMIC_CAP) {
      choices.push({ w: 0.04, act: () => {
        const disciple = spawnPerson(state, {
          sect: ext.sect, rank: 1, home: ext.homeLocation, power: 8 + rng() * 15, age: between(rng, 14, 22), day,
          masterId: id, righteous: clamp(temper.righteous + (rng() - 0.5) * 0.6, -1, 1),
        }, rng);
        if (!disciple) return;
        state.npcExt[disciple]!.goals = [
          { kind: "climb_sect", targetRank: 9, progress: 0, threshold: 60 },
          { kind: "master_art", artId: sectArt(ext.sect, rng), progress: 0, threshold: 140 },
        ];
        fireLifeEvent(state, id, "take_disciple", day, { partnerNpcId: disciple, payload: { sect: ext.sect! } });
      } });
    }
  }

  // Leave the sect: the disloyal and ambitious, and those at odds with their school.
  if (ext.sect && !chief) {
    const upright = UPRIGHT_SECTS.includes(ext.sect);
    const odds = upright ? temper.righteous < -0.2 : temper.righteous > 0.5;
    choices.push({ w: (1 - temper.loyalty) * temper.ambition * 0.04 * (odds ? 2.5 : 1), act: () => {
      const former = ext.sect!;
      ext.formerSect = former;
      ext.sect = null;
      ext.sectRank = 0;
      ext.goals = ext.goals.filter((g) => g.kind !== "climb_sect");
      fireLifeEvent(state, id, "betray_sect", day, { payload: { formerSect: former } });
      // The sect remembers: its chief counts them a traitor.
      const head = Object.entries(state.npcExt).find(([, e]) => e.sect === former && e.sectRank >= SEAT_RANK && isAliveExt(e));
      if (head && !head[1].rivals.includes(id)) head[1].rivals.push(id);
      const next = rng() < 0.5 ? chooseSect(ext, rng, former) : null;
      setOut(state, id, ext, next ? journeyTo(ext.currentLocation, hallOf(next), "defect", { sect: next }) : null, day, rng);
    } });
  }

  // Marry: an ally of the other sex, both free, neither a monk or nun.
  if (!ext.spouseId && ext.age >= 18 && ext.age < 60 && !(ext.sect && CELIBATE_SECTS.has(ext.sect))) {
    const partner = ext.allies.map((a) => [a, state.npcExt[a]] as const).find(([, p]) =>
      p && isAliveExt(p) && !p.spouseId && p.gender !== ext.gender && p.age >= 18 && p.age < 65
      && !(p.sect && CELIBATE_SECTS.has(p.sect)));
    if (partner) {
      choices.push({ w: 0.05, act: () => {
        ext.spouseId = partner[0];
        partner[1]!.spouseId = id;
        fireLifeEvent(state, id, "marry", day, { partnerNpcId: partner[0] });
      } });
    }
  }

  const total = choices.reduce((sum, c) => sum + c.w, 0);
  let roll = rng() * total;
  for (const choice of choices) {
    roll -= choice.w;
    if (roll < 0) { choice.act(); return; }
  }
}

// ─── One person, one week ──────────────────────────────────────────────

function liveWeek(state: WorldStateData, id: string, day: number, rng: () => number, held: Set<string>): void {
  const ext = state.npcExt[id];
  if (!ext || !isAliveExt(ext)) return;
  const prev = ext.lastTickDay ?? day - TICK_INTERVAL_DAYS;
  ext.lastTickDay = day;
  ext.age += birthdaysBetween(prev, day, ext.birthday ?? 0);

  if (rng() < deathChance(ext, day)) {
    killNpc(state, id, day, { kind: "death_natural" }, rng);
    return;
  }
  ext.power = clamp(ext.power + trainingGain(ext, rng), 1, POWER_CAP);

  if (ext.status === "secluded") {
    if (day < (ext.secludedUntil ?? 0)) { ext.power = Math.min(POWER_CAP, ext.power + 0.3); return; }
    ext.status = "alive";
    ext.secludedUntil = undefined;
    ext.power = Math.min(POWER_CAP, ext.power + 3 + rng() * 5);
    fireLifeEvent(state, id, "leave_seclusion", day, { payload: { locationId: ext.currentLocation } });
  }

  workGoals(state, id, ext, day, rng);
  // workGoals may have sent them into seclusion.
  if (!isAliveExt(ext) || (ext.status as NpcExtState["status"]) === "secluded") return;
  if (ext.plan) {
    if (ext.plan.path.length === 0 || walk(ext)) arrive(state, id, ext, day, rng);
    return;
  }
  decide(state, id, ext, day, rng, held);
}

/** Keep the roads alive: with few sectless travellers left, a newcomer sets out. */
function welcomeNewcomers(state: WorldStateData, day: number, rng: () => number): void {
  const travellers = Object.values(state.npcExt).filter((e) => isAliveExt(e) && !e.sect).length;
  if (travellers >= WANDERERS_MIN || rng() > 0.25) return;
  const home = TRAVEL_SPOTS[Math.floor(rng() * TRAVEL_SPOTS.length)]!;
  const id = spawnPerson(state, { sect: null, rank: 0, home, power: 10 + rng() * 35, age: between(rng, 16, 35), day }, rng);
  if (id) fireLifeEvent(state, id, "newcomer", day, { locationId: home });
}

/** Forget long-dead generated people nobody's seat or charges lead through. */
function pruneDead(state: WorldStateData, day: number): void {
  const heirs = new Set(Object.values(state.npcExt).map((e) => e.heirId).filter(Boolean));
  for (const [id, ext] of Object.entries(state.npcExt)) {
    if (ext.dynamic && ext.status === "dead" && day - (ext.deathDay ?? day) > 720 && !heirs.has(id)) delete state.npcExt[id];
  }
}

// ─── Public entry point ────────────────────────────────────────────────

export function tickAllNamedNpcs(state: WorldStateData, opts: TickOptions): void {
  const weekRng = (day: number): (() => number) =>
    opts.rng ?? (opts.seed ? seededRng(opts.seed, day) : Math.random);
  const since = opts.currentDay - state.lastNpcTickDay;
  if (since < TICK_INTERVAL_DAYS) return;
  // Fresh entries (a draft must not change the previous snapshot), completed for older saves.
  seedLiveness(state);
  const weeks = Math.floor(since / TICK_INTERVAL_DAYS);
  const full = Math.min(weeks, MAX_TICKS_PER_CALL);
  for (let week = 1; week <= full; week++) {
    const day = state.lastNpcTickDay + week * TICK_INTERVAL_DAYS;
    const rng = weekRng(day);
    const held = heldByHero(state);
    for (const id of Object.keys(state.npcExt)) liveWeek(state, id, day, rng, held);
    fillEmptySeats(state, day, rng);
    welcomeNewcomers(state, day, rng);
  }
  // A very long gap (a long sentence, a year at home): the rest only ages people.
  const end = state.lastNpcTickDay + weeks * TICK_INTERVAL_DAYS;
  if (weeks > full) {
    const from = state.lastNpcTickDay + full * TICK_INTERVAL_DAYS;
    for (const ext of Object.values(state.npcExt)) {
      if (!isAliveExt(ext)) continue;
      ext.age += birthdaysBetween(from, end, ext.birthday ?? 0);
      ext.lastTickDay = end;
    }
  }
  pruneDead(state, end);
  // The leftover days (since % 7) count toward the next week.
  state.lastNpcTickDay = end;
}
