// Liveness 2.0 — the living roster: who is alive, where they stand, who
// inherits a seat, and how a person dies. Pure (no React, no stores); the
// weekly simulation is lib/world/npc-tick.ts, and the world store calls the
// death and quest-transfer helpers when the hero kills someone.
//
//   • Every simulated person has an `npcExt` entry. Authored ones (the thirty
//     in named-npcs.ts) are seeded on a new game; generated ones (disciples,
//     heirs, newcomers) carry `dynamic: true` plus their own name and look,
//     and are registered with the NPC registry so `getNpc` finds them.
//   • A dead person is gone from every map. Anyone the hero kills gets an
//     entry too (status "dead"), so one test — `npcIsDead` — covers both.
//   • When a sect's chief dies (or leaves), the strongest senior member takes
//     the seat; with no one left, an elder is named. The dead chief's quests
//     pass to the heir (`heirId`), and a dead sect member's to the chief.

import type { NpcDef, NpcExtState, NpcEventKind, QuestDef, SectId, WorldStateData } from "./types";
import { getNpc, getNpcsAtLocation, registerDynamicNpc } from "./data/npcs";
import { getNamedDefault, namedNpcIds } from "./data/named-npcs";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { getQuestsForNpc } from "./data/quests";
import { LOCATION_ROUTES } from "./data/location-routes";
import { WORLD_COORDS } from "./data/world-coords";
import {
  DHARMA_NAMES, FEMALE_BODIES, FEMALE_GIVEN, FEMALE_ONLY_SECTS, MALE_BODIES, MALE_GIVEN, NAMED_TEMPERS,
  POWER_TIER_LABEL, SURNAMES, WANDERER_DEFAULTS, powerTier, rankTitle,
} from "./data/liveness-roster";
import { generateNpcEventEcho } from "./rumor-engine";
import { npcFoeId, registerNpcFoeNames } from "./data/opponents";

registerNpcFoeNames((id) => getNpc(id)?.name ?? null);

/** How many generated people may be alive at once (disciples, heirs, newcomers). */
export const DYNAMIC_CAP = 48;
/** Below this many sectless travellers, a newcomer appears in the jianghu. */
export const WANDERERS_MIN = 8;
export const SEAT_RANK = 10;

// ─── Small lookups ─────────────────────────────────────────────────────

export { POWER_TIER_LABEL, powerTier };
/** Power for people the simulation does not track, from how hard they fight back. */
const TIER_POWER = [8, 25, 45, 65, 85] as const;

const HALL_SECT: ReadonlyMap<string, SectId> = new Map(
  Object.values(SECT_MEMBERSHIPS).map((def) => [def.hallLocationId, def.id]),
);
export function sectOfHall(locationId: string | null | undefined): SectId | null {
  return (locationId && HALL_SECT.get(locationId)) || null;
}
export function hallOf(sect: SectId): string {
  return SECT_MEMBERSHIPS[sect]?.hallLocationId ?? `sect_${sect}`;
}
export function sectName(sect: SectId | null | undefined): string | null {
  return sect ? SECT_MEMBERSHIPS[sect]?.name ?? null : null;
}

export function isAliveExt(ext: NpcExtState | undefined): boolean {
  return !!ext && (ext.status === "alive" || ext.status === "secluded");
}

type LifeState = Pick<WorldStateData, "npcExt" | "assassinatedNpcIds">;

/** Dead by any cause: old age, a duel, or the hero's hand. */
export function npcIsDead(state: Partial<LifeState>, npcId: string): boolean {
  return state.npcExt?.[npcId]?.status === "dead" || !!state.assassinatedNpcIds?.includes(npcId);
}

/** The sect a person belongs to: their simulated sect, else the sect whose grounds they stand on. */
export function sectOfNpc(state: Partial<LifeState>, npcId: string): SectId | null {
  const ext = state.npcExt?.[npcId];
  if (ext) return ext.sect;
  const def = getNpc(npcId);
  for (const loc of def?.locationIds ?? []) {
    const sect = sectOfHall(loc);
    if (sect) return sect;
  }
  return null;
}

/** What a person is now, in a few words: "เจ้าสำนักง้อไบ๊ · อายุ 64 · ปรมาจารย์". */
export function npcTitle(state: Partial<LifeState>, npcId: string): string | null {
  const ext = state.npcExt?.[npcId];
  if (!ext) return null;
  const bits = [rankTitle(ext.sectRank, sectName(ext.sect)), `อายุ ${ext.age}`, POWER_TIER_LABEL[powerTier(ext.power)]];
  return bits.join(" · ");
}

/** How strong a person is (0–100): simulated, or guessed from how hard they fight back. */
export function npcPower(state: Partial<LifeState>, npcId: string): number {
  return state.npcExt?.[npcId]?.power ?? TIER_POWER[getNpc(npcId)?.defenseTier ?? 0];
}

/** The opponent a person fights as: their authored sparring build, else one made from their strength and school. */
export function npcFoeFor(state: Partial<LifeState>, npcId: string): string {
  const authored = getNpc(npcId)?.sparOpponentId;
  if (authored) return authored;
  return npcFoeId(npcId, npcPower(state, npcId), sectName(sectOfNpc(state, npcId)));
}

// ─── Where people are ──────────────────────────────────────────────────

/** The places a person can be found now ([] when dead). Simulated people stand where the simulation put them. */
export function npcPlaces(state: Partial<LifeState>, npc: NpcDef): string[] {
  if (npcIsDead(state, npc.id)) return [];
  const ext = state.npcExt?.[npc.id];
  if (ext) return [ext.currentLocation];
  return npc.locationIds;
}

/**
 * Everyone standing at `locationId` (not counting kidnap or quest gating —
 * callers filter with npcPresent / visibleIf): the authored residents who are
 * home, plus every simulated person whose journey has brought them here.
 */
export function npcsAt(state: Partial<LifeState>, locationId: string): NpcDef[] {
  const out: NpcDef[] = [];
  const seen = new Set<string>();
  for (const npc of getNpcsAtLocation(locationId)) {
    const ext = state.npcExt?.[npc.id];
    if (ext && ext.currentLocation !== locationId) continue;
    if (npcIsDead(state, npc.id)) continue;
    out.push(npc);
    seen.add(npc.id);
  }
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) {
    if (seen.has(id) || ext.currentLocation !== locationId || !isAliveExt(ext)) continue;
    const npc = getNpc(id);
    if (npc) out.push(npc);
  }
  return out;
}

/** The dead person whose seat (and map spot) `npcId` took over here, if any. */
export function predecessorsOf(state: Partial<LifeState>, npcId: string): string[] {
  const out: string[] = [];
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) {
    if (ext.status === "dead" && ext.heirId === npcId) out.push(id);
  }
  return out;
}

// ─── Seeding and the generated-people registry ─────────────────────────

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Give an entry the fields Liveness 2.0 reads (older saves lack them). */
function completeExt(id: string, ext: NpcExtState): NpcExtState {
  const roster = NAMED_TEMPERS[id];
  const wanderer = WANDERER_DEFAULTS[id];
  return {
    ...ext,
    goals: ext.goals ?? [],
    rivals: ext.rivals ?? [],
    allies: ext.allies ?? [],
    eventHistory: ext.eventHistory ?? [],
    gender: ext.gender ?? roster?.gender ?? wanderer?.gender ?? "male",
    temper: ext.temper ?? roster?.temper ?? wanderer?.temper ?? { righteous: 0.3, ambition: 0.5, wanderlust: 0.3, loyalty: 0.7 },
    birthday: ext.birthday ?? hashOf(id) % 365,
    // The old engine made seclusion permanent; Liveness 2.0 ends it.
    secludedUntil: ext.status === "secluded" && ext.secludedUntil === undefined ? 0 : ext.secludedUntil,
  };
}

/** A registry NpcDef for a generated person. */
function dynamicDef(id: string, ext: NpcExtState): NpcDef {
  const title = rankTitle(ext.sectRank, sectName(ext.sect));
  return {
    id,
    name: ext.name ?? id,
    description: ext.sect ? `${title} · ศิษย์รุ่นใหม่ที่ยุทธจักรเพิ่งรู้จักชื่อ` : "จอมยุทธ์หน้าใหม่ที่เพิ่งปรากฏตัวในยุทธจักร",
    locationIds: [],
    defenseTier: powerTier(ext.power),
    tags: ["liveness", ext.sect ? "disciple" : "wanderer"],
    look: { body: ext.body ?? (ext.gender === "female" ? "f2" : "m2"), wander: true },
  };
}

/** Register every generated person of this save with the NPC registry. */
export function syncDynamicNpcs(state: Pick<WorldStateData, "npcExt">): void {
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) {
    if (ext.dynamic) registerDynamicNpc(dynamicDef(id, ext));
  }
}

/**
 * Seed the thirty authored people (a new game, or a save from before they
 * existed) and complete every entry. Replaces `npcExt` with fresh objects so
 * a draft never mutates the previous snapshot.
 */
export function seedLiveness(state: WorldStateData): void {
  const next: Record<string, NpcExtState> = {};
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) next[id] = completeExt(id, cloneExt(ext));
  for (const id of namedNpcIds()) {
    if (next[id]) continue;
    const def = getNamedDefault(id);
    if (def) next[id] = completeExt(id, { ...cloneExt(def), lastTickDay: state.day ?? 1 });
  }
  state.npcExt = next;
  syncDynamicNpcs(state);
}

export function cloneExt(ext: NpcExtState): NpcExtState {
  return {
    ...ext,
    goals: (ext.goals ?? []).map((g) => ({ ...g })),
    rivals: [...(ext.rivals ?? [])],
    allies: [...(ext.allies ?? [])],
    eventHistory: (ext.eventHistory ?? []).map((e) => ({ ...e })),
    plan: ext.plan ? { ...ext.plan, path: [...ext.plan.path] } : ext.plan,
    temper: ext.temper ? { ...ext.temper } : undefined,
  };
}

// ─── Generated people ──────────────────────────────────────────────────

export interface SpawnSpec {
  sect: SectId | null;
  rank: number;
  home: string;
  power: number;
  age: number;
  day: number;
  gender?: "male" | "female";
  masterId?: string;
  righteous?: number;
}

function pick<T>(list: readonly T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)]!;
}

/** A name nobody alive in this save already has. */
function freshName(state: WorldStateData, gender: "male" | "female", sect: SectId | null, rng: () => number): string {
  const taken = new Set(Object.entries(state.npcExt).map(([id, e]) => e.name ?? getNpc(id)?.name));
  const monastic = sect === "shaolin" || sect === "emei" || sect === "hengshan_north";
  for (let i = 0; i < 40; i++) {
    const name = monastic
      ? `${gender === "female" ? "ภิกษุณี" : "หลวงจีน"}${pick(DHARMA_NAMES, rng)}`
      : `${pick(SURNAMES, rng)}${pick(gender === "female" ? FEMALE_GIVEN : MALE_GIVEN, rng)}`;
    if (!taken.has(name)) return name;
  }
  return `${pick(SURNAMES, rng)}${pick(gender === "female" ? FEMALE_GIVEN : MALE_GIVEN, rng)}ที่ ${Object.keys(state.npcExt).length}`;
}

export function aliveDynamicCount(state: Pick<WorldStateData, "npcExt">): number {
  return Object.values(state.npcExt).filter((e) => e.dynamic && isAliveExt(e)).length;
}

/** Create a generated person (null at the cap). Registers them at once. */
export function spawnPerson(state: WorldStateData, spec: SpawnSpec, rng: () => number = Math.random): string | null {
  if (aliveDynamicCount(state) >= DYNAMIC_CAP) return null;
  const gender = spec.gender
    ?? (spec.sect && FEMALE_ONLY_SECTS.has(spec.sect) ? "female" : spec.sect === "shaolin" ? "male" : rng() < 0.35 ? "female" : "male");
  let serial = Object.keys(state.npcExt).length + 1;
  while (state.npcExt[`dyn_${serial}`]) serial++;
  const id = `dyn_${serial}`;
  const righteous = spec.righteous ?? (rng() * 1.6 - 0.6);
  const ext: NpcExtState = {
    power: Math.round(spec.power),
    age: spec.age,
    status: "alive",
    currentLocation: spec.home,
    homeLocation: spec.home,
    sect: spec.sect,
    sectRank: spec.rank,
    goals: [],
    rivals: [],
    allies: spec.masterId ? [spec.masterId] : [],
    lastTickDay: spec.day,
    eventHistory: [],
    dynamic: true,
    name: freshName(state, gender, spec.sect, rng),
    gender,
    body: pick(gender === "female" ? FEMALE_BODIES : MALE_BODIES, rng),
    temper: { righteous, ambition: 0.3 + rng() * 0.7, wanderlust: spec.sect ? rng() * 0.5 : 0.5 + rng() * 0.5, loyalty: 0.3 + rng() * 0.7 },
    birthday: Math.floor(rng() * 365),
    masterId: spec.masterId,
  };
  state.npcExt[id] = ext;
  registerDynamicNpc(dynamicDef(id, ext));
  return id;
}

// ─── Events ────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 10;

/** Record an event on a person and tell the jianghu (a rumor). */
export function fireLifeEvent(
  state: WorldStateData,
  npcId: string,
  kind: NpcEventKind,
  day: number,
  opts: { partnerNpcId?: string; locationId?: string; payload?: Record<string, string | number | boolean>; silent?: boolean } = {},
): void {
  const ext = state.npcExt[npcId];
  if (ext) {
    ext.eventHistory = [{ kind, day, ...(opts.payload ? { data: opts.payload } : {}) }, ...(ext.eventHistory ?? [])].slice(0, HISTORY_LIMIT);
  }
  if (opts.silent) return;
  generateNpcEventEcho({
    state,
    kind,
    npcId,
    partnerNpcId: opts.partnerNpcId,
    locationId: opts.locationId ?? ext?.currentLocation ?? getNpc(npcId)?.locationIds[0] ?? "city_capital",
    payload: opts.payload,
  });
}

// ─── Seats and heirs ───────────────────────────────────────────────────

/** The living holder of a sect's seat, if any. */
export function sectChief(state: Pick<WorldStateData, "npcExt">, sect: SectId): string | null {
  for (const [id, ext] of Object.entries(state.npcExt)) {
    if (ext.sect === sect && ext.sectRank >= SEAT_RANK && isAliveExt(ext)) return id;
  }
  return null;
}

/** Living members of a sect, strongest claim first (rank, then power). */
export function sectMembers(state: Pick<WorldStateData, "npcExt">, sect: SectId): string[] {
  return Object.entries(state.npcExt)
    .filter(([, ext]) => ext.sect === sect && isAliveExt(ext))
    .sort(([, a], [, b]) => b.sectRank - a.sectRank || b.power - a.power)
    .map(([id]) => id);
}

/**
 * Every sect has a chief: an empty seat goes to the senior member with the
 * best claim, else an elder steps forward (a generated person). Fires
 * `new_chief`; returns the sects whose seat changed hands.
 */
export function fillEmptySeats(state: WorldStateData, day: number, rng: () => number = Math.random): SectId[] {
  const changed: SectId[] = [];
  for (const sect of Object.keys(SECT_MEMBERSHIPS) as SectId[]) {
    if (sectChief(state, sect)) continue;
    const hall = hallOf(sect);
    // Seniority first: an elder (rank 7+) of thirty or more, else a senior
    // disciple of standing; failing both, one of the sect's elders steps forward.
    const members = sectMembers(state, sect).map((id) => [id, state.npcExt[id]!] as const);
    let heir: string | null = members.find(([, e]) => e.sectRank >= 7 && e.age >= 30)?.[0]
      ?? members.find(([, e]) => e.sectRank >= 4 && e.age >= 35 && e.power >= 50)?.[0] ?? null;
    if (!heir) {
      heir = spawnPerson(state, { sect, rank: SEAT_RANK, home: hall, power: 55 + rng() * 20, age: 45 + Math.floor(rng() * 20), day }, rng);
      if (!heir) continue;
    }
    const ext = state.npcExt[heir]!;
    ext.sectRank = SEAT_RANK;
    ext.homeLocation = hall;
    // The new chief goes home to take the seat.
    if (ext.currentLocation !== hall) ext.plan = journeyTo(ext.currentLocation, hall, "home") ?? null;
    if (!ext.plan) ext.currentLocation = hall;
    // The last chief (dead, or gone) hands their charges to the heir.
    const last = Object.entries(state.npcExt)
      .filter(([id, e]) => id !== heir && (e.sect === sect || e.formerSect === sect) && e.status === "dead" && !e.heirId)
      .sort(([, a], [, b]) => (b.deathDay ?? 0) - (a.deathDay ?? 0))[0];
    if (last && last[1].sectRank >= SEAT_RANK) last[1].heirId = heir;
    fireLifeEvent(state, heir, "new_chief", day, { locationId: hall, payload: { sect } });
    changed.push(sect);
  }
  return changed;
}

/**
 * A person dies. Simulated or not, they get a "dead" entry (so maps, letters
 * and quests all see it); a chief's seat is filled at once and their quests
 * pass to the heir, a member's to their sect's chief.
 */
export function killNpc(
  state: WorldStateData,
  npcId: string,
  day: number,
  cause: { by?: string; kind: "death_natural" | "death_combat" | "killed_by_player"; locationId?: string; silent?: boolean },
  rng: () => number = Math.random,
): void {
  const def = getNpc(npcId);
  const existing = state.npcExt[npcId];
  if (existing?.status === "dead") return;
  const sect = existing ? existing.sect : sectOfNpc(state, npcId);
  const ext: NpcExtState = existing ? existing : {
    power: TIER_POWER[def?.defenseTier ?? 0], age: 40, status: "alive",
    currentLocation: def?.locationIds[0] ?? cause.locationId ?? "city_capital",
    homeLocation: def?.locationIds[0] ?? cause.locationId ?? "city_capital",
    sect: null, sectRank: 0, goals: [], rivals: [], allies: [], lastTickDay: day, eventHistory: [],
  };
  state.npcExt[npcId] = ext;
  const wasChief = ext.sectRank >= SEAT_RANK && !!ext.sect;
  ext.status = "dead";
  ext.deathDay = day;
  ext.plan = null;
  if (cause.by) ext.killedBy = cause.by;
  fireLifeEvent(state, npcId, cause.kind, day, {
    partnerNpcId: cause.by && cause.by !== "player" ? cause.by : undefined,
    locationId: cause.locationId ?? ext.currentLocation,
    payload: { age: ext.age, ...(sect ? { sect } : {}) },
    silent: cause.silent,
  });
  // A spouse is widowed; a disciple loses a master.
  for (const other of Object.values(state.npcExt)) {
    if (other.spouseId === npcId) other.spouseId = undefined;
  }
  if (wasChief) fillEmptySeats(state, day, rng);
  if (!ext.heirId && sect) {
    const chief = sectChief(state, sect);
    if (chief && chief !== npcId) ext.heirId = chief;
  }
}

/** The living person who now holds a (possibly dead) person's charges. */
export function questHolder(state: Partial<LifeState>, npcId: string | null | undefined): string | null {
  let id = npcId ?? null;
  for (let hops = 0; id && hops < 12; hops++) {
    if (!npcIsDead(state, id)) return id;
    id = state.npcExt?.[id]?.heirId ?? null;
  }
  return null;
}

/** Quests a person gives or takes now: their own, and those of the dead whose charges they hold. */
export function heldQuests(state: Partial<LifeState>, npcId: string): QuestDef[] {
  if (npcIsDead(state, npcId)) return [];
  const out = [...getQuestsForNpc(npcId)];
  const seen = new Set(out.map((q) => q.id));
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) {
    if (ext.status !== "dead" || !ext.heirId || questHolder(state, id) !== npcId) continue;
    for (const q of getQuestsForNpc(id)) if (!seen.has(q.id)) { out.push(q); seen.add(q.id); }
  }
  return out;
}

// ─── Roads ─────────────────────────────────────────────────────────────

const NEIGHBOURS: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  const link = (a: string, b: string) => { if (!map.has(a)) map.set(a, []); map.get(a)!.push(b); };
  for (const r of LOCATION_ROUTES) { link(r.a, r.b); link(r.b, r.a); }
  return map;
})();

/** Places travellers never walk through (the hero's home, the jail, the opening foothill). */
const OFF_LIMITS = new Set(["home_player", "jail", "jail_cell", "village", "tavern"]);
export function isPassable(locationId: string): boolean {
  return !OFF_LIMITS.has(locationId) && locationId in WORLD_COORDS;
}

/** The road from one place to another, as the places walked through (from excluded, to last). */
export function roadPath(from: string, to: string): string[] | null {
  if (from === to) return [];
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    for (const next of NEIGHBOURS.get(here) ?? []) {
      if (previous.has(next) || (next !== to && !isPassable(next))) continue;
      previous.set(next, here);
      if (next === to) {
        const path = [to];
        for (let at = here; at !== from; at = previous.get(at)!) path.unshift(at);
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

export function journeyTo(from: string, to: string, purpose: NonNullable<NpcExtState["plan"]>["purpose"],
  extra: Partial<NonNullable<NpcExtState["plan"]>> = {}): NonNullable<NpcExtState["plan"]> | null {
  const path = roadPath(from, to);
  if (!path || path.length === 0) return null;
  return { purpose, path, to, ...extra };
}

/** Places a traveller might head for: towns, inns, markets, villages, temples and manors. */
export const TRAVEL_SPOTS: readonly string[] = Object.keys(WORLD_COORDS)
  .filter((id) => /^(city_|inn_|market_|village_|temple_|villa_)/.test(id) && isPassable(id));

// ─── Quests of the dead ────────────────────────────────────────────────

export interface ChargeChange {
  questId: string;
  questName: string;
  deadId: string;
  /** Who holds the quest now; null when nobody can — the quest fails. */
  holderId: string | null;
}

/** Ids of everyone dead in this state. */
export function deadIds(state: Partial<LifeState>): Set<string> {
  const out = new Set<string>(state.assassinatedNpcIds ?? []);
  for (const [id, ext] of Object.entries(state.npcExt ?? {})) if (ext.status === "dead") out.add(id);
  return out;
}

/**
 * Active quests whose giver or hand-in person just died: their charges pass to
 * the heir (or, for a sect member, the sect's chief); with no one to take them
 * the quest fails. Returns what changed so the caller can tell the player.
 */
export function settleChargesOfDead(
  state: WorldStateData,
  newlyDead: ReadonlySet<string>,
  getQuestDef: (id: string) => QuestDef | null | undefined,
): ChargeChange[] {
  if (!newlyDead.size) return [];
  const changes: ChargeChange[] = [];
  for (const q of Object.values(state.quests)) {
    if (q.status !== "active") continue;
    const def = getQuestDef(q.id);
    if (!def) continue;
    const deadId = [def.turnInNpcId, def.giverNpcId].find((id) => id && newlyDead.has(id));
    if (!deadId) continue;
    const holderId = questHolder(state, deadId);
    if (!holderId) state.quests[q.id] = { ...q, status: "failed" };
    changes.push({ questId: q.id, questName: def.name, deadId, holderId });
  }
  return changes;
}
