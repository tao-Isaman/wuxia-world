// Sect blood feuds: a sect avenges a member the hero killed. For FEUD_DAYS
// after the killing, the sect's hunters (`hunter_<sectId>`, the same foes that
// chase a betrayer) may catch up with the hero while they walk. The feud ends
// when the time runs out, when the hero has beaten FEUD_SETTLE_WINS of the
// avengers, or when the avengers strike the hero down (blood is paid).
//
// The feud is the hero's own, so it lives in the player's save, in `flags`
// (no new save field): `feud:<sectId>` = the last day of the feud,
// `feud_wins:<sectId>` = avengers beaten, `feud_victim:<sectId>` = who died.
// Pure: no React, no stores.
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import type { SectId, WorldStateData } from "./types";

/** How long a sect hunts the hero after a killing (each new killing restarts it). */
export const FEUD_DAYS = 60;
/** Chance per walk tick that the avengers catch up (betrayal hunters roll 30 %). */
export const FEUD_CHANCE = 0.12;
/** Avengers beaten before the sect lets the feud go. */
export const FEUD_SETTLE_WINS = 3;

const UNTIL = "feud:";
const WINS = "feud_wins:";
const VICTIM = "feud_victim:";

type FeudState = Pick<WorldStateData, "flags" | "day">;

export function isSectId(id: string): id is SectId {
  return Object.prototype.hasOwnProperty.call(SECT_MEMBERSHIPS, id);
}

/** "สำนักเส้าหลิน", "พรรคยาจก", "องครักษ์เสื้อแพร": a school's name as a sentence names it. */
export function sectTitle(sectId: SectId): string {
  const name = SECT_MEMBERSHIPS[sectId].name;
  return /^(สำนัก|พรรค)/.test(name) || sectId === "jinyiwei" ? name : `สำนัก${name}`;
}

/** The sect a `hunter_<sectId>` opponent hunts for, else null. */
export function hunterSect(opponentId: string): SectId | null {
  if (!opponentId.startsWith("hunter_")) return null;
  const sect = opponentId.slice("hunter_".length);
  return isSectId(sect) ? sect : null;
}

/** The sect declares a feud on the hero for killing `victimId` (restarts the clock and the count). */
export function startFeud(state: FeudState, sectId: SectId, victimId: string): void {
  state.flags[UNTIL + sectId] = state.day + FEUD_DAYS;
  state.flags[WINS + sectId] = 0;
  state.flags[VICTIM + sectId] = victimId;
}

/** Is `sectId` hunting the hero today? */
export function feudActive(state: FeudState, sectId: string): boolean {
  const until = state.flags[UNTIL + sectId];
  return typeof until === "number" && until >= state.day;
}

/** Every sect hunting the hero today. */
export function activeFeuds(state: FeudState): SectId[] {
  const out: SectId[] = [];
  for (const key of Object.keys(state.flags)) {
    if (!key.startsWith(UNTIL)) continue;
    const sect = key.slice(UNTIL.length);
    if (isSectId(sect) && feudActive(state, sect)) out.push(sect);
  }
  return out;
}

/** Whom the sect is avenging. */
export function feudVictim(state: FeudState, sectId: string): string | null {
  const id = state.flags[VICTIM + sectId];
  return typeof id === "string" ? id : null;
}

/** The feud is over: drop its flags. */
export function endFeud(state: FeudState, sectId: string): void {
  delete state.flags[UNTIL + sectId];
  delete state.flags[WINS + sectId];
  delete state.flags[VICTIM + sectId];
}

/** One more avenger beaten; true when that settles the feud (and ends it). */
export function recordFeudWin(state: FeudState, sectId: SectId): boolean {
  const wins = Number(state.flags[WINS + sectId] ?? 0) + 1;
  if (wins >= FEUD_SETTLE_WINS) {
    endFeud(state, sectId);
    return true;
  }
  state.flags[WINS + sectId] = wins;
  return false;
}

/** Feuds whose days have run out are dropped; returns their sects (for the log). */
export function expireFeuds(state: FeudState): SectId[] {
  const out: SectId[] = [];
  for (const key of Object.keys(state.flags)) {
    if (!key.startsWith(UNTIL)) continue;
    const sect = key.slice(UNTIL.length);
    if (feudActive(state, sect)) continue;
    endFeud(state, sect);
    if (isSectId(sect)) out.push(sect);
  }
  return out;
}

/** Repair (validate.ts): drop feud flags for unknown sects, bad values, or with no end day. */
export function repairFeudFlags(flags: WorldStateData["flags"]): void {
  for (const key of Object.keys(flags)) {
    const prefix = [UNTIL, WINS, VICTIM].find((p) => key.startsWith(p));
    if (!prefix) continue;
    const sect = key.slice(prefix.length);
    const value = flags[key];
    const ok = isSectId(sect)
      && typeof flags[UNTIL + sect] === "number" && Number.isFinite(flags[UNTIL + sect] as number)
      && (prefix === VICTIM ? typeof value === "string" : typeof value === "number" && Number.isFinite(value) && value >= 0);
    if (!ok) delete flags[key];
  }
}
