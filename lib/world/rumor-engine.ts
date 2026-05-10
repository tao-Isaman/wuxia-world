// Liveness Layer §3 — rumor engine.
// Owns rumor generation, distortion, region propagation, expiry, archive,
// dedup, and selection. Pure module: no React, no I/O, no store imports.
// All randomness via Math.random(); all time inputs come from the caller.

import { evaluateCondition } from "./conditions";
import { CHANNEL_ADMITS, regionOf } from "./data/regions";
import { getNamedDefault } from "./data/named-npcs";
import { NPCS_BY_ID } from "./data/npcs";
import {
  BIG_NEWS_LIFESPAN_DAYS,
  DEFAULT_LIFESPAN_DAYS,
  NPC_EVENT_TEMPLATES,
  PLAYER_ECHO_TEMPLATES,
  WARNING_TEMPLATES,
  renderTemplate,
  type RumorTemplate,
} from "./data/rumor-templates";
import { getScene } from "./data/scenes";
import type {
  EventRef,
  NpcEventKind,
  Region,
  Rumor,
  RumorChannel,
  RumorSummary,
  RumorTruth,
  TraitKey,
  WorldStateData,
} from "./types";

// ─── Caps ──────────────────────────────────────────────────────────────
// Spec §3.3 storage budget. Soft cap triggers "early archive" of stale
// rumors; hard cap triggers blunt eviction. Archive ages out at 1 year
// world time. Seen-log is FIFO — oldest entries evicted first.
export const RUMOR_POOL_SOFT_CAP = 200;
export const RUMOR_POOL_HARD_CAP = 500;
export const RUMOR_SEEN_CAP = 50;
export const RUMOR_ARCHIVE_DAYS = 365;

// Big-news rule used by both lifespan + weight booster. Spec §3.2.1.
const BIG_EVENT_KINDS: ReadonlySet<NpcEventKind> = new Set([
  "death_combat",
  "master_art",
  "betray_sect",
]);

// Player-echo distortion is heavier than the standard split (spec §3.2.2).
const PLAYER_ECHO_DISTORT_PCT = 0.25;
const PLAYER_ECHO_FAKE_PCT = 0.10;

// Dedup window: bump weight on a matching rumor created in the last N days
// instead of pushing a new entry (spec §3.2 + bigchange-plan decision #2).
const DEDUP_WINDOW_DAYS = 7;

// Soft-cap early-archive threshold — a rumor older than this can be moved
// to archive before its expiry to reclaim pool space (spec §3.3 + 6.3).
const EARLY_ARCHIVE_AGE_DAYS = 90;

// ─── Public arg shapes ─────────────────────────────────────────────────

export interface NpcEventEchoArgs {
  state: WorldStateData;
  kind: NpcEventKind;
  npcId: string;
  /** Optional secondary actor — killer / target / partner. */
  partnerNpcId?: string;
  locationId: string;
  payload?: Record<string, string | number | boolean>;
}

export interface PlayerEchoArgs {
  state: WorldStateData;
  actionId: string;
  targetNpcId?: string;
}

export interface WarningArgs {
  state: WorldStateData;
  warningKind: string;
  triggerDay: number;
  locationId: string;
  payload?: Record<string, string | number | boolean>;
}

// ─── Helpers exported for tests / callers ──────────────────────────────

// Standard 80/15/5 split. Player-echo uses its own roll inline.
export function rollDistortion(): RumorTruth {
  const r = Math.random();
  if (r < 0.05) return "false";
  if (r < 0.20) return "distorted";
  return "true";
}

export function buildEventRef(
  kind: NpcEventKind,
  day: number,
  aboutNpcId?: string,
): EventRef {
  return { eventKind: kind, day, aboutNpcId };
}

// ─── Internal helpers ──────────────────────────────────────────────────

function pickRandom<T>(pool: readonly T[]): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function rngTag(): string {
  return Math.random().toString(36).slice(2, 8);
}

function npcDisplayName(npcId: string | undefined | null): string {
  if (!npcId) return "ผู้ใดไม่ทราบ";
  // Prefer the NPC registry name (covers both named + generic NPCs).
  const def = NPCS_BY_ID.get(npcId);
  if (def?.name) return def.name;
  // Fall back to npcId — better than crashing the rumor pipeline.
  return npcId;
}

function locationDisplayName(locationId: string | undefined | null): string {
  if (!locationId) return "ที่ใดไม่ทราบ";
  const sc = getScene(locationId);
  if (sc && sc.kind === "location") return sc.name;
  if (sc && sc.kind === "route") return sc.label;
  return locationId;
}

function ensureRumorArrays(state: WorldStateData): void {
  // Defensive: legacy saves may load before the v18 migration. Allocate
  // fresh arrays so we don't mutate frozen literals.
  if (!Array.isArray(state.rumorPool)) state.rumorPool = [];
  if (!Array.isArray(state.rumorArchive)) state.rumorArchive = [];
  if (!Array.isArray(state.rumorSeenLog)) state.rumorSeenLog = [];
}

// Sect rank lookup for the big-news booster. Returns Infinity when the
// NPC has no authored ext default — those NPCs never qualify for the
// rank-based boost.
function sectRankOf(npcId: string): number {
  const def = getNamedDefault(npcId);
  return def?.sectRank ?? Infinity;
}

function isBigNews(kind: NpcEventKind, npcId: string): boolean {
  if (BIG_EVENT_KINDS.has(kind)) return true;
  return sectRankOf(npcId) <= 3;
}

// Spec §3.2.2 — archetype label table. Order matters: more specific
// combinations (good+evil, arrogance+humility) win over single-axis
// labels.
function archetypeLabel(traits: WorldStateData["traits"]): string {
  const t = (k: TraitKey): number => traits[k] ?? 0;
  const good = t("good");
  const evil = t("evil");
  const arr = t("arrogance");
  const hum = t("humility");

  if (good > 70 && evil > 70) return "บ้ายุทธ์จักรดีร้ายตามใจตน";
  if (arr > 70 && hum > 70) return "ผู้ล้ำลึกหยั่งไม่ถึง";
  if (good > 70 && evil < 30) return "ผู้กล้าแห่งเจียงหู";
  if (evil > 70 && good < 30) return "จอมมาร";
  if (hum > 70 && good > 50) return "นักพรตไร้นาม";
  return "นักท่องยุทธ์";
}

// Pick the variant body of the template that matches the rolled truth.
// Falls back to the base text if the variant slot is empty (spec §3.2.1
// — distorted version is optional per template).
function variantText(tpl: RumorTemplate, truth: RumorTruth): string {
  if (truth === "distorted" && tpl.distorted) return tpl.distorted;
  if (truth === "false" && tpl.fake) return tpl.fake;
  return tpl.text;
}

// Cap enforcement helpers. Soft cap evicts stale rumors to archive
// early; hard cap evicts on a (expiresDay asc, weight asc) priority so
// the freshest / loudest rumors survive.
function applyCaps(state: WorldStateData, currentDay: number): void {
  // Soft cap: archive anything older than 90 days when over 200.
  if (state.rumorPool.length > RUMOR_POOL_SOFT_CAP) {
    const stale: number[] = [];
    for (let i = 0; i < state.rumorPool.length; i++) {
      const r = state.rumorPool[i]!;
      if (currentDay - r.createdDay >= EARLY_ARCHIVE_AGE_DAYS) {
        stale.push(i);
      }
    }
    // Archive in reverse so splice indices stay valid.
    for (let i = stale.length - 1; i >= 0; i--) {
      const idx = stale[i]!;
      const removed = state.rumorPool.splice(idx, 1)[0];
      if (removed) state.rumorArchive.push(compress(removed, currentDay));
      if (state.rumorPool.length <= RUMOR_POOL_SOFT_CAP) break;
    }
  }

  // Hard cap: blunt eviction. Sort by (expiresDay asc, weight asc) and
  // drop until under cap. Doesn't archive — these rumors are already
  // crowding out fresher ones, no need to preserve them.
  if (state.rumorPool.length > RUMOR_POOL_HARD_CAP) {
    state.rumorPool.sort((a, b) => {
      if (a.expiresDay !== b.expiresDay) return a.expiresDay - b.expiresDay;
      return a.weight - b.weight;
    });
    const drop = state.rumorPool.length - RUMOR_POOL_HARD_CAP;
    state.rumorPool.splice(0, drop);
  }
}

function compress(r: Rumor, currentDay: number): RumorSummary {
  return {
    id: r.id,
    about: r.about,
    truth: r.truth,
    expiredDay: currentDay,
  };
}

// ─── 3.2.1 — NPC event echo ────────────────────────────────────────────

export function generateNpcEventEcho(args: NpcEventEchoArgs): string | null {
  const { state, kind, npcId, partnerNpcId, locationId, payload } = args;
  ensureRumorArrays(state);

  const pool = NPC_EVENT_TEMPLATES[kind];
  if (!pool || pool.length === 0) return null;

  const tpl = pickRandom(pool);
  if (!tpl) return null;

  // Resolve actor names. Prefer registry (has names for both named +
  // generic NPCs); fall back to the npcId string so missing data still
  // produces a renderable rumor.
  const npcName = npcDisplayName(npcId);
  const npc2Name = partnerNpcId ? npcDisplayName(partnerNpcId) : "";
  const locName = locationDisplayName(locationId);

  // Build the var dict: explicit args win over payload, payload values
  // are coerced to strings before subbing into Thai text.
  const vars: Record<string, string> = {
    npc: npcName,
    npc2: npc2Name,
    location: locName,
  };
  if (payload) {
    for (const [k, v] of Object.entries(payload)) {
      if (vars[k] === undefined || vars[k] === "") vars[k] = String(v);
    }
  }

  const truth = rollDistortion();
  const text = renderTemplate(variantText(tpl, truth), vars);

  // Big-news weight boost (×2) per spec §3.2.1 + plan decision #7.
  const big = isBigNews(kind, npcId);
  const weight = big ? tpl.weight * 2 : tpl.weight;
  const lifespan = big ? BIG_NEWS_LIFESPAN_DAYS : DEFAULT_LIFESPAN_DAYS;

  const currentDay = state.day;
  const region = regionOf(locationId);

  // Dedup: same NPC + same source + same event kind, created within the
  // last 7 days → bump existing weight by +1 and return its id (spec
  // §3.2 + plan decision #2). Walk newest-first so we collapse onto the
  // freshest existing rumor.
  for (let i = state.rumorPool.length - 1; i >= 0; i--) {
    const ex = state.rumorPool[i]!;
    if (
      ex.about === npcId &&
      ex.source === "npc_event" &&
      ex.refersToEvent?.eventKind === kind &&
      currentDay - ex.createdDay <= DEDUP_WINDOW_DAYS
    ) {
      ex.weight += 1;
      return ex.id;
    }
  }

  const id = `rumor_event_${npcId}_${kind}_${currentDay}_${rngTag()}`;
  const rumor: Rumor = {
    id,
    text,
    source: "npc_event",
    createdDay: currentDay,
    expiresDay: currentDay + lifespan,
    truth,
    region,
    channel: tpl.channel,
    about: npcId,
    refersToEvent: buildEventRef(kind, currentDay, npcId),
    leadsTo: null,
    prerequisites: [],
    weight,
  };
  state.rumorPool.push(rumor);
  applyCaps(state, currentDay);
  return id;
}

// ─── 3.2.2 — Player echo ───────────────────────────────────────────────

export function generatePlayerEcho(args: PlayerEchoArgs): string | null {
  const { state, actionId, targetNpcId } = args;
  ensureRumorArrays(state);

  const pool = PLAYER_ECHO_TEMPLATES[actionId];
  if (!pool || pool.length === 0) return null;

  const tpl = pickRandom(pool);
  if (!tpl) return null;

  const archetype = archetypeLabel(state.traits);
  const targetName = targetNpcId ? npcDisplayName(targetNpcId) : "";
  // Player echos use the player's CURRENT scene as the location anchor.
  // Fall back to lastLocationId when the player is mid-dialog scene.
  const sceneId = state.lastLocationId ?? state.currentSceneId;
  const locName = locationDisplayName(sceneId);
  const region = regionOf(sceneId);

  const vars: Record<string, string> = {
    archetype,
    npc: targetName,
    npc2: targetName,
    location: locName,
  };

  // Player-echo distortion: heavier than the standard split.
  const r = Math.random();
  let truth: RumorTruth;
  if (r < PLAYER_ECHO_FAKE_PCT) truth = "false";
  else if (r < PLAYER_ECHO_FAKE_PCT + PLAYER_ECHO_DISTORT_PCT) truth = "distorted";
  else truth = "true";

  const text = renderTemplate(variantText(tpl, truth), vars);

  const currentDay = state.day;
  const id = `rumor_player_${actionId}_${currentDay}_${rngTag()}`;
  const rumor: Rumor = {
    id,
    text,
    source: "player_echo",
    createdDay: currentDay,
    expiresDay: currentDay + DEFAULT_LIFESPAN_DAYS,
    truth,
    region,
    channel: tpl.channel,
    // `about` for player-echo points at the target if any; otherwise null.
    about: targetNpcId ?? null,
    refersToEvent: null,
    leadsTo: null,
    prerequisites: [],
    weight: tpl.weight,
  };
  state.rumorPool.push(rumor);
  applyCaps(state, currentDay);
  return id;
}

// ─── 3.2.4 — Warning ───────────────────────────────────────────────────

export function generateWarning(args: WarningArgs): string | null {
  const { state, warningKind, triggerDay, locationId, payload } = args;
  ensureRumorArrays(state);

  const pool = WARNING_TEMPLATES[warningKind];
  if (!pool || pool.length === 0) return null;

  const tpl = pickRandom(pool);
  if (!tpl) return null;

  const currentDay = state.day;
  const days = Math.max(0, triggerDay - currentDay);
  const locName = locationDisplayName(locationId);
  const vars: Record<string, string> = {
    days: String(days),
    location: locName,
    event: warningKind,
  };
  if (payload) {
    for (const [k, v] of Object.entries(payload)) {
      if (vars[k] === undefined || vars[k] === "") vars[k] = String(v);
    }
  }

  const text = renderTemplate(tpl.text, vars);
  // Warnings are always "true" per spec §3.2.4.
  const truth: RumorTruth = "true";
  const region = regionOf(locationId);

  const id = `rumor_warn_${warningKind}_${triggerDay}_${rngTag()}`;
  const rumor: Rumor = {
    id,
    text,
    source: "warning",
    createdDay: currentDay,
    // Warnings expire one day AFTER the event lands so the day-of player
    // can still hear "today is X day".
    expiresDay: triggerDay + 1,
    truth,
    region,
    channel: tpl.channel,
    about: locationId,
    refersToEvent: null,
    leadsTo: null,
    prerequisites: [],
    weight: tpl.weight,
  };
  state.rumorPool.push(rumor);
  applyCaps(state, currentDay);
  return id;
}

// ─── 3.5 — Selection ───────────────────────────────────────────────────

export function selectRumorsForScene(
  state: WorldStateData,
  region: Region,
  channel: RumorChannel,
  limit: number,
): Rumor[] {
  ensureRumorArrays(state);
  if (limit <= 0) return [];

  const admittedChannels = new Set<RumorChannel>(CHANNEL_ADMITS[channel] ?? []);
  // Defensive: if the channel matrix omits an entry, fall back to
  // strict same-channel admission so the call still works.
  if (admittedChannels.size === 0) admittedChannels.add(channel);

  const seenIds = new Set<string>(
    (state.rumorSeenLog ?? []).map((e) => e.rumorId),
  );

  const filtered = state.rumorPool.filter((r) => {
    if (r.expiresDay <= state.day) return false;
    if (r.region !== region && r.region !== "global") return false;
    if (!admittedChannels.has(r.channel)) return false;
    // Prereqs: every condition must pass.
    for (const pre of r.prerequisites) {
      if (!evaluateCondition(state, pre)) return false;
    }
    return true;
  });

  // Sort: unseen first, then weight desc, then createdDay desc (newer
  // wins ties). Use a stable composite to keep the spec's "tiebreaker"
  // semantics (§3.5).
  filtered.sort((a, b) => {
    const aSeen = seenIds.has(a.id) ? 1 : 0;
    const bSeen = seenIds.has(b.id) ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
    if (a.weight !== b.weight) return b.weight - a.weight;
    return b.createdDay - a.createdDay;
  });

  return filtered.slice(0, limit);
}

// ─── 3.3 + 3.4 — Maintenance ───────────────────────────────────────────
// Per-tick housekeeping. Caller (typically world-store advanceTime hook)
// drives the cadence.
//
// v1 cuts:
//   - Region propagation (spec §3.4 — "+1 region per 14 days for echo,
//     +1 per 7 for player_echo") is deferred. The acceptance criteria
//     don't require multi-region spread for v1; initial-region placement
//     plus the global "warning" hook covers the interesting cases. The
//     hook stays here so the upgrade lands in one file.
export function maintainRumors(state: WorldStateData, currentDay: number): void {
  ensureRumorArrays(state);

  // 1. Move expired rumors → archive.
  const stillActive: Rumor[] = [];
  for (const r of state.rumorPool) {
    if (r.expiresDay <= currentDay) {
      state.rumorArchive.push(compress(r, currentDay));
    } else {
      stillActive.push(r);
    }
  }
  state.rumorPool = stillActive;

  // 2. Prune archive entries past 1 year.
  if (state.rumorArchive.length > 0) {
    state.rumorArchive = state.rumorArchive.filter(
      (s) => currentDay - s.expiredDay < RUMOR_ARCHIVE_DAYS,
    );
  }

  // 3. Trim seen-log to cap (FIFO).
  if (state.rumorSeenLog.length > RUMOR_SEEN_CAP) {
    const drop = state.rumorSeenLog.length - RUMOR_SEEN_CAP;
    state.rumorSeenLog.splice(0, drop);
  }

  // 4. Cap enforcement (soft + hard).
  applyCaps(state, currentDay);

  // 5. Region propagation — DEFERRED for v1. See file header note.
  //    When implemented, walk state.rumorPool, look up REGION_NEIGHBORS,
  //    and clone each propagating rumor into one neighbor region with a
  //    suffixed id (`<originalId>_exp1`). Source-specific cadence:
  //      - "npc_event" → +1 region every 14 days, max 3 expansions
  //      - "player_echo" → +1 region every 7 days, max 4 expansions
  //      - "warning" → instant global if event flagged big (today: stays
  //                    in its origin region — warnings are short-lived)
}
