// Repair of the simulated people (`npcExt`, docs/liveness.md) on load, run by
// validateAndRepair: a hand-edited save, a shared world written by an older
// build, or content that dropped an NPC must not crash the weekly tick or
// leave someone standing in a place that no longer exists.
//
// - Entries for ids nobody knows are dropped: an entry must be an NPC in the
//   registry (authored, or one the hero killed) or a generated person
//   (`dynamic: true`).
// - Fields are brought back in range: power 0–100, age 1–130, rank 0–10, the
//   temper's 0–1 (righteous −1…1), birthday 0–364, a known status, sect and
//   gender, places that exist (else home, else the authored home).
// - References to people who are gone (rivals, allies, master, spouse, heir, a
//   journey's target) are cleared; a journey through unknown places is dropped.
// Pure apart from replacing changed entries with fresh objects.
import type { NpcExtState, NpcGoal, NpcSimStatus, SectId, WorldStateData } from "./types";
import { SCENES_BY_ID } from "./data/scenes";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { getNpc } from "./data/npcs";
import { getNamedDefault } from "./data/named-npcs";

const STATUSES: ReadonlySet<NpcSimStatus> = new Set(["alive", "dead", "missing", "secluded"]);
const GOAL_KINDS: ReadonlySet<NpcGoal["kind"]> = new Set(["master_art", "climb_sect", "avenge", "find_treasure", "seek_wisdom"]);
const HISTORY_LIMIT = 10;
/** Where someone goes when neither their place nor their home exists any more. */
const FALLBACK_PLACE = "city_capital";

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const clamp = (v: unknown, lo: number, hi: number, fallback: number) => (finite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
const isPlace = (id: unknown): id is string => typeof id === "string" && SCENES_BY_ID.get(id)?.kind === "location";
const isSect = (id: unknown): id is SectId => typeof id === "string" && Object.prototype.hasOwnProperty.call(SECT_MEMBERSHIPS, id);

/** Is `id` someone the simulation may keep an entry for? */
function knownPerson(id: string, ext: NpcExtState | undefined): boolean {
  if (!ext || typeof ext !== "object") return false;
  if (ext.dynamic) return /^dyn_\d+$/.test(id);
  return !!getNpc(id);
}

function repairEntry(id: string, ext: NpcExtState, people: ReadonlySet<string>, day: number): NpcExtState {
  const authored = getNamedDefault(id);
  const homeFallback = authored?.homeLocation ?? getNpc(id)?.locationIds.find(isPlace) ?? FALLBACK_PLACE;
  const home = isPlace(ext.homeLocation) ? ext.homeLocation : homeFallback;
  const sect = isSect(ext.sect) ? ext.sect : null;
  const person = (v: unknown) => (typeof v === "string" && v !== id && people.has(v) ? v : undefined);
  const ids = (list: unknown) => (Array.isArray(list) ? [...new Set(list.filter((v): v is string => !!person(v)))] : []);
  const out: NpcExtState = {
    ...ext,
    power: clamp(ext.power, 0, 100, authored?.power ?? 30),
    age: Math.round(clamp(ext.age, 1, 130, authored?.age ?? 30)),
    status: STATUSES.has(ext.status) ? ext.status : "alive",
    homeLocation: home,
    currentLocation: isPlace(ext.currentLocation) ? ext.currentLocation : home,
    sect,
    sectRank: sect ? Math.round(clamp(ext.sectRank, 1, 10, 1)) : 0,
    goals: Array.isArray(ext.goals)
      ? ext.goals.filter((g) => g && typeof g === "object" && GOAL_KINDS.has(g.kind) && finite(g.progress) && finite(g.threshold))
      : [],
    rivals: ids(ext.rivals),
    allies: ids(ext.allies),
    // Not capped at today: the shared world may be ahead of this save's day until the clock syncs.
    lastTickDay: finite(ext.lastTickDay) ? Math.max(0, ext.lastTickDay) : day,
    eventHistory: Array.isArray(ext.eventHistory)
      ? ext.eventHistory.filter((e) => e && typeof e === "object" && typeof e.kind === "string" && finite(e.day)).slice(0, HISTORY_LIMIT)
      : [],
  };
  if (out.gender !== undefined && out.gender !== "male" && out.gender !== "female") delete out.gender;
  if (ext.temper && typeof ext.temper === "object") {
    out.temper = {
      righteous: clamp(ext.temper.righteous, -1, 1, 0),
      ambition: clamp(ext.temper.ambition, 0, 1, 0.5),
      wanderlust: clamp(ext.temper.wanderlust, 0, 1, 0.3),
      loyalty: clamp(ext.temper.loyalty, 0, 1, 0.7),
    };
  } else delete out.temper;
  if (ext.birthday !== undefined) out.birthday = Math.round(clamp(ext.birthday, 0, 364, 0));
  for (const key of ["secludedUntil", "woundedUntil", "deathDay"] as const) {
    if (ext[key] !== undefined && !finite(ext[key])) delete out[key];
  }
  for (const key of ["heirId", "masterId", "spouseId"] as const) {
    if (ext[key] !== undefined && !person(ext[key])) delete out[key];
  }
  if (ext.formerSect !== undefined && !isSect(ext.formerSect)) delete out.formerSect;
  if (ext.dynamic && (typeof ext.name !== "string" || !ext.name.trim())) out.name = "ผู้ไร้นาม";
  const plan = ext.plan;
  if (plan !== undefined && plan !== null) {
    const ok = typeof plan === "object" && isPlace(plan.to) && Array.isArray(plan.path) && plan.path.every(isPlace)
      && (plan.targetNpcId === undefined || !!person(plan.targetNpcId)) && (plan.sect === undefined || isSect(plan.sect));
    if (!ok) out.plan = null;
  }
  return out;
}

/**
 * Repair `state.npcExt` in place (changed entries are replaced, never
 * mutated). Returns the ids dropped and the ids whose fields changed.
 */
export function repairNpcExt(state: Pick<WorldStateData, "npcExt" | "day" | "lastNpcTickDay">): { dropped: string[]; fixed: string[] } {
  const dropped: string[] = [];
  const fixed: string[] = [];
  const current = state.npcExt;
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    state.npcExt = {};
    return { dropped, fixed };
  }
  const people = new Set<string>();
  for (const [id, ext] of Object.entries(current)) {
    if (knownPerson(id, ext)) people.add(id);
    else dropped.push(id);
  }
  // Anyone the registry knows may be named as a rival or master even without an entry.
  const anyone: ReadonlySet<string> = { has: (id: string) => people.has(id) || !!getNpc(id) } as ReadonlySet<string>;
  const day = finite(state.lastNpcTickDay) ? state.lastNpcTickDay : finite(state.day) ? state.day : 1;
  const next: Record<string, NpcExtState> = {};
  for (const id of people) {
    const before = current[id]!;
    const after = repairEntry(id, before, anyone, day);
    next[id] = JSON.stringify(after) === JSON.stringify(before) ? before : after;
    if (next[id] !== before) fixed.push(id);
  }
  if (dropped.length || fixed.length) state.npcExt = next;
  if (!finite(state.lastNpcTickDay)) state.lastNpcTickDay = finite(state.day) ? state.day : 1;
  return { dropped, fixed };
}
