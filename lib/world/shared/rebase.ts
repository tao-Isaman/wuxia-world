// Old saves counted their own days (day 1 at a new game, pushed on by every
// action). Save v27 puts every save on the world clock (lib/world/clock.ts):
// on load the save is shifted so its `day` is the world's day now, and every
// day stamp moves with it, so cooldowns, sentences, journeys and news keep
// the time they had left. Birthdays are days of the year and stay. Pure.
import type { WorldStateData } from "../types";
import { HOURS_PER_DAY } from "../clock";
import { JAIL_MAX_HOURS } from "../law";

const shiftRecord = (rec: Record<string, number> | undefined, offset: number): Record<string, number> =>
  Object.fromEntries(Object.entries(rec ?? {}).map(([k, v]) => [k, typeof v === "number" ? v + offset : v]));

/**
 * Add `offset` days to every day stamp of a (possibly partial, old) save in
 * place: the player's and the world's. A jail term left is cut to the new
 * scale (at most JAIL_MAX_HOURS ชั่วยาม), and a running tournament is dropped
 * (its history stays).
 */
export function rebaseDays(p: Partial<WorldStateData>, offset: number): void {
  if (!offset || !Number.isFinite(offset)) return;
  if (typeof p.day === "number") p.day += offset;
  if (typeof p.wantedDay === "number") p.wantedDay += offset;
  if (typeof p.lastNpcTickDay === "number") p.lastNpcTickDay += offset;
  // Jail: an absolute time in ชั่วยาม. What was left shrinks to the new scale.
  if (typeof p.jailUntil === "number" && typeof p.day === "number") {
    const nowHours = p.day * HOURS_PER_DAY + (p.time ?? 0);
    const left = p.jailUntil + offset * HOURS_PER_DAY - nowHours;
    p.jailUntil = nowHours + Math.max(0, Math.min(JAIL_MAX_HOURS, left));
  }
  p.giftDays = shiftRecord(p.giftDays, offset);
  p.letterDays = shiftRecord(p.letterDays, offset);
  p.activityDays = shiftRecord(p.activityDays, offset);
  p.kidnappedUntil = shiftRecord(p.kidnappedUntil, offset);
  p.bossDefeatedDay = shiftRecord(p.bossDefeatedDay, offset);
  if (Array.isArray(p.letters)) p.letters = p.letters.map((l) => ({ ...l, day: l.day + offset }));
  if (Array.isArray(p.actionLog)) p.actionLog = p.actionLog.map((e) => ({ ...e, day: e.day + offset }));
  if (Array.isArray(p.rumorSeenLog)) p.rumorSeenLog = p.rumorSeenLog.map((e) => ({ ...e, dayHeard: e.dayHeard + offset }));
  if (Array.isArray(p.rumorPool)) {
    p.rumorPool = p.rumorPool.map((r) => ({
      ...r,
      createdDay: r.createdDay + offset,
      expiresDay: r.expiresDay + offset,
      refersToEvent: r.refersToEvent ? { ...r.refersToEvent, day: r.refersToEvent.day + offset } : r.refersToEvent,
    }));
  }
  if (Array.isArray(p.rumorArchive)) p.rumorArchive = p.rumorArchive.map((r) => ({ ...r, expiredDay: r.expiredDay + offset }));
  if (p.sectMembership) {
    p.sectMembership = Object.fromEntries(Object.entries(p.sectMembership).map(([id, m]) => [id, m && {
      ...m,
      joinedDay: m.joinedDay + offset,
      lastQuestDay: shiftRecord(m.lastQuestDay, offset),
    }])) as WorldStateData["sectMembership"];
  }
  if (p.npcExt) {
    p.npcExt = Object.fromEntries(Object.entries(p.npcExt).map(([id, e]) => [id, {
      ...e,
      lastTickDay: e.lastTickDay + offset,
      eventHistory: (e.eventHistory ?? []).map((ev) => ({ ...ev, day: ev.day + offset })),
      ...(e.secludedUntil !== undefined ? { secludedUntil: e.secludedUntil + offset } : {}),
      ...(e.woundedUntil !== undefined ? { woundedUntil: e.woundedUntil + offset } : {}),
      ...(e.deathDay !== undefined ? { deathDay: e.deathDay + offset } : {}),
      ...(e.plan ? { plan: { ...e.plan, ...(e.plan.arrivedDay !== undefined ? { arrivedDay: e.plan.arrivedDay + offset } : {}) } } : {}),
    }]));
  }
  p.tournament = null;
}
