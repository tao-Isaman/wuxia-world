import { regionOf } from "./data/regions";

/**
 * หมายจับ (wanted marks). A failed theft adds a mark (max 5). While wanted,
 * every walk tick may send the law after the player — constables at first,
 * imperial guards and bounty hunters as the marks pile up. Losing to them
 * lands the player in the nearest city's jail for 2 days per mark. Marks
 * fade by one after 10 quiet days, and serving time clears them.
 */
export const WANTED_MAX = 5;
export const WANTED_DECAY_DAYS = 10;
export const JAIL_DAYS_PER_MARK = 2;
export const JAIL_BRIBE_GOLD = 300;
export const LAW_OPPONENTS = ["law_constable", "law_imperial_guard", "law_bounty_hunter"] as const;
export type LawOpponentId = (typeof LAW_OPPONENTS)[number];

export const isLawOpponent = (id: string | null | undefined): id is LawOpponentId =>
  !!id && (LAW_OPPONENTS as readonly string[]).includes(id);

/** Chance per walk tick that the law catches up with a wanted player. */
export function lawChance(marks: number): number {
  if (marks <= 0) return 0;
  return Math.min(0.45, 0.05 + Math.min(marks, WANTED_MAX) * 0.08);
}

/** Who comes: constables for petty crime, guards and bounty hunters for the notorious. */
export function pickLawPursuer(marks: number, roll: number): LawOpponentId {
  const m = Math.max(1, Math.min(WANTED_MAX, marks));
  const weights: Record<LawOpponentId, number> = {
    law_constable: Math.max(0, 6 - m * 1.2),
    law_imperial_guard: m >= 2 ? m - 1 : 0,
    law_bounty_hunter: m >= 3 ? (m - 2) * 1.5 : 0,
  };
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let pick = roll * total;
  for (const id of LAW_OPPONENTS) {
    pick -= weights[id];
    if (pick < 0) return id;
  }
  return "law_constable";
}

/** ชั่วยาม per day (mirrors HOURS_PER_DAY in the world store). */
export const JAIL_HOURS_PER_DAY = 12;
/** Absolute game time in ชั่วยาม, the unit `jailUntil` is stored in. */
export const absoluteHours = (state: { day: number; time: number }) => state.day * JAIL_HOURS_PER_DAY + state.time;
/** ชั่วยาม still to serve (0 once free or released). */
export const sentenceLeft = (state: { day: number; time: number; jailUntil?: number | null }) =>
  state.jailUntil == null ? 0 : Math.max(0, state.jailUntil - absoluteHours(state));
/** "2 วัน 4 ชั่วยาม" */
export function describeSentence(hours: number): string {
  const days = Math.floor(hours / JAIL_HOURS_PER_DAY), rest = hours % JAIL_HOURS_PER_DAY;
  return [days ? `${days} วัน` : "", rest ? `${rest} ชั่วยาม` : ""].filter(Boolean).join(" ") || "ไม่เหลือ";
}

export const jailDays = (marks: number) => Math.max(1, Math.min(WANTED_MAX, marks)) * JAIL_DAYS_PER_MARK;

// Region → the city whose jail takes the prisoner.
const REGION_JAIL: Record<string, string> = {
  heartland: "city_capital",
  south: "city_dali",
  west: "city_xixia",
  east: "city_suzhou",
  north: "city_changan",
  jianghu_wild: "city_capital",
};

/** The city whose jail holds a player caught at `sceneId`. */
export function jailCityFor(sceneId: string | null | undefined): string {
  if (sceneId?.startsWith("city_")) return sceneId;
  return REGION_JAIL[regionOf(sceneId)] ?? "city_capital";
}
