// The real calendar, in Thai time (Asia/Bangkok, UTC+7 all year): what the
// player's schedules run on — the sect quest every two hours, a friend's
// letter every three, the Mount Hua tournament every two weeks. The world
// clock (clock.ts) still runs the world: one game day is one real hour, so a
// real span of N hours is N world days, and the day-stamped state keeps
// working; this file only names real times for the player. Pure.
import { MS_PER_DAY, msAtWorld, now } from "./clock";

/** Thai time is UTC+7, with no summer time. */
export const THAI_OFFSET_MS = 7 * 3_600_000;
export const MS_PER_HOUR_REAL = 3_600_000;

const DAY_NAMES = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"] as const;
const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."] as const;

/** The Thai wall clock at a real time. */
export function thaiParts(ms: number): { weekday: number; date: number; month: number; hour: number; minute: number } {
  const d = new Date(ms + THAI_OFFSET_MS);
  return { weekday: d.getUTCDay(), date: d.getUTCDate(), month: d.getUTCMonth(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

const two = (n: number) => String(n).padStart(2, "0");

/** "20:00 น." */
export function thaiClock(ms: number): string {
  const p = thaiParts(ms);
  return `${two(p.hour)}:${two(p.minute)} น.`;
}

/** "วันเสาร์ 17 ต.ค. 20:00 น." */
export function thaiDateTime(ms: number): string {
  const p = thaiParts(ms);
  return `วัน${DAY_NAMES[p.weekday]} ${p.date} ${MONTHS[p.month]} ${two(p.hour)}:${two(p.minute)} น.`;
}

/** The real time a world day begins at, in Thai words ("วันเสาร์ 17 ต.ค. 20:00 น."). */
export const thaiDateOfDay = (day: number) => thaiDateTime(msAtWorld(day));

/**
 * How long until a real time, in Thai ("อีก 25 นาที", "อีก 1 ชั่วโมง 10 นาที",
 * "อีก 3 วัน 4 ชั่วโมง"); "" once it has passed.
 */
export function realWait(toMs: number, fromMs: number = now()): string {
  const minutes = Math.ceil((toMs - fromMs) / 60_000 - 1e-6);
  if (minutes <= 0) return "";
  if (minutes < 60) return `อีก ${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return `อีก ${hours} ชั่วโมง${rest ? ` ${rest} นาที` : ""}`;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return `อีก ${days} วัน${h ? ` ${h} ชั่วโมง` : ""}`;
}

/** Real hours as world days (one world day is one real hour). */
export const worldDaysOfHours = (hours: number) => hours * (MS_PER_HOUR_REAL / MS_PER_DAY);
