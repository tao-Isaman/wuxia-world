import { WORLD_COORDS } from "./data/world-coords";

/**
 * หมายจับ (wanted marks). They have no ceiling: a failed theft adds one, a
 * jail break or a failed attempt on a life two, a killing five. The HUD shows
 * five seals, then a number. While wanted, every walk tick may send the law
 * after the hero: constables first, then imperial guards and bounty hunters,
 * and — the longer the hero slips the law (`lawEvasions`) — the Brocade
 * Guard (องครักษ์เสื้อแพร), at last their commander in person. Upright people
 * of the jianghu may waylay a wanted hero to hand them over. Losing to any of
 * them is arrest: a sentence, a fine, and for the worst records the seizure
 * of property and the crippling of one's martial arts (`arrestPenalty`).
 * Giving oneself up (มอบตัว) halves the sentence and the fine and spares the
 * worst. Marks fade one per 10 quiet days; serving time clears them.
 */
/** Seals the HUD shows before it switches to a number; also the marks a killing adds. */
export const WANTED_MAX = 5;
export const KILL_MARKS = 5;
export const WANTED_DECAY_DAYS = 10;
/** The longest sentence, in ชั่วยาม: one world day (one real hour). */
export const JAIL_MAX_HOURS = 12;
export const JAIL_BRIBE_GOLD = 300;
export const LAW_OPPONENTS = [
  "law_constable", "law_imperial_guard", "law_bounty_hunter", "law_jinyiwei_agent", "law_jinyiwei_captain",
] as const;
export type LawOpponentId = (typeof LAW_OPPONENTS)[number];
/** A person fighting for the law (an upright ambusher, the Brocade Guard's commander): `lawnpc@<npc foe id>`. */
export const LAW_NPC_PREFIX = "lawnpc@";

export const isLawOpponent = (id: string | null | undefined): boolean =>
  !!id && ((LAW_OPPONENTS as readonly string[]).includes(id) || id.startsWith(LAW_NPC_PREFIX));

/** "หมายจับ 3" … the count, for logs. */
export const wantedText = (marks: number) => `หมายจับ ${marks}`;

/** Chance per walk tick that the law catches up: more marks, and every escape, make them keener. */
export function lawChance(marks: number, evasions = 0): number {
  if (marks <= 0) return 0;
  return Math.min(0.55, 0.05 + Math.min(marks, WANTED_MAX) * 0.08 + Math.min(evasions, 10) * 0.01);
}

/** "chief": the Brocade Guard's commander comes in person (resolved by the caller to whoever holds the seat). */
export type LawPursuer = LawOpponentId | "chief";

/**
 * Who comes. Constables for petty crime; guards and bounty hunters as the
 * marks pile up; the Brocade Guard as the hero keeps slipping the law
 * (`evasions`: escapes, fights won, bribes, jail breaks) or the marks grow
 * past five; after eight escapes with five marks or more, their commander.
 */
export function pickLawPursuer(marks: number, roll: number, evasions = 0): LawPursuer {
  const m = Math.max(1, Math.min(10, marks));
  const e = Math.max(0, evasions);
  const weights: Record<LawPursuer, number> = {
    law_constable: Math.max(0, 6 - m * 1.2 - e * 0.5),
    law_imperial_guard: m >= 2 ? Math.min(m, 5) - 1 : 0,
    law_bounty_hunter: m >= 3 ? (Math.min(m, 5) - 2) * 1.5 : 0,
    law_jinyiwei_agent: e >= 1 || m >= 4 ? e * 0.8 + Math.max(0, m - 3) : 0,
    law_jinyiwei_captain: e >= 4 || m >= 7 ? Math.max(0, e - 3) * 0.6 + Math.max(0, m - 6) * 0.6 : 0,
    chief: e >= 8 && m >= 5 ? 0.5 + (e - 8) * 0.3 : 0,
  };
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total <= 0) return "law_constable";
  let pick = roll * total;
  for (const [id, w] of Object.entries(weights) as [LawPursuer, number][]) {
    pick -= w;
    if (pick < 0) return id;
  }
  return "law_constable";
}

/** Chance per walk tick (when wanted ≥ 2) that an upright person of the jianghu waylays the hero to hand them over. */
export function ambushChance(marks: number): number {
  if (marks < 2) return 0;
  return Math.min(0.2, 0.03 + Math.min(marks, 10) * 0.015);
}

/** The sentence for a record, in ชั่วยาม: one per mark (five real minutes), at most JAIL_MAX_HOURS. */
export const jailHours = (marks: number) => Math.max(1, Math.min(JAIL_MAX_HOURS, marks));
/** The jailer's price grows with the record: 300 for up to two marks, 150 more per mark after. */
export const bribeCost = (marks: number) => JAIL_BRIBE_GOLD + Math.max(0, marks - 2) * 150;

export interface ArrestPenalty {
  /** The sentence in ชั่วยาม (5 real minutes each), served on the world clock. */
  hours: number;
  fine: number;
  /** Seize property: a share of the gold left and some carried goods (5+ marks). */
  confiscate: boolean;
  /** Martial arts crippled: how many of the hero's best moves lose two levels (10+ marks). */
  cripple: number;
}

/** What an arrest costs, by the record. Giving oneself up halves the sentence and the fine and spares the worst. */
export function arrestPenalty(marks: number, surrendered = false): ArrestPenalty {
  const m = Math.max(1, marks);
  const hours = jailHours(m);
  const fine = 50 * m;
  const cripple = m >= 10 ? Math.min(4, 1 + Math.floor((m - 10) / 5)) : 0;
  if (surrendered) return { hours: Math.max(1, Math.ceil(hours / 2)), fine: Math.floor(fine / 2), confiscate: false, cripple: Math.max(0, cripple - 1) };
  return { hours, fine, confiscate: m >= 5, cripple };
}

/** ชั่วยาม per day (mirrors HOURS_PER_DAY in the world store). */
export const JAIL_HOURS_PER_DAY = 12;
/** Absolute game time in ชั่วยาม, the unit `jailUntil` is stored in. */
export const absoluteHours = (state: { day: number; time: number }) => state.day * JAIL_HOURS_PER_DAY + state.time;
/** ชั่วยาม still to serve (0 once free or released). */
export const sentenceLeft = (state: { day: number; time: number; jailUntil?: number | null }) =>
  state.jailUntil == null ? 0 : Math.max(0, state.jailUntil - absoluteHours(state));
/** A sentence in real time: "25 นาที", "1 ชั่วโมง" (a ชั่วยาม is five real minutes). */
export function describeSentence(hours: number): string {
  const minutes = Math.ceil(hours * 5 - 1e-6);
  if (minutes <= 0) return "ไม่เหลือ";
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return `${h} ชั่วโมง${m ? ` ${m} นาที` : ""}`;
}


/** The city whose jail holds a player caught at `sceneId`: that city, else the nearest city on the world map. */
export function jailCityFor(sceneId: string | null | undefined): string {
  if (sceneId?.startsWith("city_")) return sceneId;
  const here = sceneId ? WORLD_COORDS[sceneId] : undefined;
  if (!here) return "city_capital";
  let best = "city_capital", bestDistance = Infinity;
  for (const [id, point] of Object.entries(WORLD_COORDS)) {
    if (!id.startsWith("city_")) continue;
    const distance = Math.hypot(point.x - here.x, point.y - here.y);
    if (distance < bestDistance) { best = id; bestDistance = distance; }
  }
  return best;
}
