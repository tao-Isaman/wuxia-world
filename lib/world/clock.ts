// The world clock (docs/design/world-clock-and-shared-world.md): one game day
// is one real hour, counted from a fixed epoch, so every player of a world
// sees the same day and the world moves on while the game is closed. Pure: the
// store reads `now()` and sets `state.day` / `state.time` from it (syncClock);
// no action pushes time forward any more.

/** World day 1, ชั่วยาม 0: 2026-10-08 00:00 Asia/Bangkok. */
export const WORLD_EPOCH_MS = Date.UTC(2026, 9, 7, 17, 0, 0);
/** Twelve ชั่วยาม to a day. */
export const HOURS_PER_DAY = 12;
/** One game day is one real hour. */
export const MS_PER_DAY = 3_600_000;
/** One ชั่วยาม is five real minutes. */
export const MS_PER_HOUR = MS_PER_DAY / HOURS_PER_DAY;

let testNow: number | null = null;

/** The real time the world is at: `Date.now()`, or the test clock when one is set. */
export function now(): number {
  return testNow ?? Date.now();
}

/** Tests only: pin the clock (ms since 1970), or `null` to follow real time again. */
export function setTestClock(ms: number | null): void {
  testNow = ms;
}

/** Tests only: move the pinned clock on by `hours` ชั่วยาม (pins it at now() first). */
export function advanceTestClock(hours: number): void {
  testNow = now() + hours * MS_PER_HOUR;
}

/** Tests only: pin the clock at a world day and ชั่วยาม. */
export function setTestWorldTime(day: number, time = 0): void {
  testNow = msAtWorld(day, time);
}

export interface WorldTime {
  /** World day, 1 at the epoch (may be ≤ 0 before it). */
  day: number;
  /** ชั่วยาม into the day, 0 ≤ time < 12 (fractional). */
  time: number;
}

/** The world day and ชั่วยาม at a real time. */
export function worldTimeAt(ms: number): WorldTime {
  const days = (ms - WORLD_EPOCH_MS) / MS_PER_DAY;
  const whole = Math.floor(days);
  return { day: whole + 1, time: (days - whole) * HOURS_PER_DAY };
}

/** The world time right now. */
export function worldNow(): WorldTime {
  return worldTimeAt(now());
}

/** The real time (ms) a world day and ชั่วยาม fall at. */
export function msAtWorld(day: number, time = 0): number {
  return WORLD_EPOCH_MS + (day - 1 + time / HOURS_PER_DAY) * MS_PER_DAY;
}

/** A world time as one number of days (day + time / 12), for comparing and waiting. */
export function worldStamp(t: WorldTime): number {
  return t.day + t.time / HOURS_PER_DAY;
}

/** ชั่วยาม between two world stamps (b − a), never negative. */
export function hoursBetween(a: number, b: number): number {
  return Math.max(0, (b - a) * HOURS_PER_DAY);
}

/**
 * How long until a world stamp, in real time, in Thai ("อีก 25 นาที",
 * "อีก 2 ชั่วโมง 10 นาที", "อีก 3 วัน 4 ชั่วโมง"); "" once it has passed.
 */
export function formatWait(fromStamp: number, toStamp: number): string {
  // Rounded up to the minute (less a hair, so float noise never adds one).
  const minutes = Math.ceil((toStamp - fromStamp) * (MS_PER_DAY / 60_000) - 1e-6);
  if (minutes <= 0) return "";
  if (minutes < 60) return `อีก ${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return `อีก ${hours} ชั่วโมง${rest ? ` ${rest} นาที` : ""}`;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return `อีก ${days} วัน${h ? ` ${h} ชั่วโมง` : ""}`;
}
