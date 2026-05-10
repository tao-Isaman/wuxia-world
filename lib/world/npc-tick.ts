// Liveness Layer §2.4 — NPC tick engine.
// Public entry point is `tickAllNamedNpcs`, called from world-store's
// advanceTime() between day-loops.
//
// Tick frequency: every 7 world days.
// Throttle: at most 4 ticks per advanceTime call (28 days). Excess days
// roll aging only + log a single console.warn — keeps `advanceTime(365)`
// from melting under per-NPC event rolls.

import type {
  WorldStateData,
  NpcExtState,
  NpcGoal,
  NpcEventKind,
  NpcEventLog,
} from "./types";
import { getNamedDefault, namedNpcIds } from "./data/named-npcs";
import { generateNpcEventEcho } from "./rumor-engine";

export interface TickOptions {
  // World day at which the tick batch is being processed. `tickAllNamedNpcs`
  // diffs this against `state.lastNpcTickDay` to decide how many 7-day
  // batches to run.
  currentDay: number;
}

const TICK_INTERVAL_DAYS = 7;
const MAX_TICKS_PER_CALL = 4;
const EVENT_HISTORY_LIMIT = 10;

// Per-tick chances. Tuned to match spec §2.4 + §2.5.
const NATURAL_DEATH_OVER_70 = 0.05;
const NATURAL_DEATH_OVER_85 = 0.15;
const RANDOM_EVENT_CHANCE = 0.08;
const BETRAY_SECT_CHANCE = 0.01;
const GOAL_REROLL_CHANCE = 0.5;
const POWER_CAP = 100;

// Goal-completion thresholds + per-tick progress nudge ranges (inclusive).
const GOAL_PROGRESS_MIN = 1;
const GOAL_PROGRESS_MAX = 3;

// Replacement-goal templates. Each kind has a small parameterised builder
// so a freshly rerolled goal has reasonable defaults rather than
// duplicating the previous goal verbatim.
const GOAL_POOL: Record<NpcGoal["kind"], () => NpcGoal> = {
  master_art: () => ({ kind: "master_art", artId: "kuyt", progress: 0, threshold: 100 }),
  climb_sect: () => ({ kind: "climb_sect", targetRank: 5, progress: 0, threshold: 80 }),
  // avenge needs a real rival id; reroll caller fills in (or skips when none)
  avenge: () => ({ kind: "avenge", targetNpcId: "", progress: 0, threshold: 60 }),
  find_treasure: () => ({
    kind: "find_treasure",
    itemId: "mithril_ore",
    locationId: "cave_heimu",
    progress: 0,
    threshold: 50,
  }),
  seek_wisdom: () => ({ kind: "seek_wisdom", locationId: "sect_wudang", progress: 0, threshold: 70 }),
};

const GOAL_KINDS: NpcGoal["kind"][] = [
  "master_art",
  "climb_sect",
  "avenge",
  "find_treasure",
  "seek_wisdom",
];

// ─── Helpers ───────────────────────────────────────────────────────────

function randInt(minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1));
}

function pushEvent(
  npc: NpcExtState,
  kind: NpcEventKind,
  day: number,
  data?: Record<string, string | number | boolean>,
): void {
  const entry: NpcEventLog = data ? { kind, day, data } : { kind, day };
  npc.eventHistory.unshift(entry);
  if (npc.eventHistory.length > EVENT_HISTORY_LIMIT) {
    npc.eventHistory.length = EVENT_HISTORY_LIMIT;
  }
}

function fireEvent(
  state: WorldStateData,
  npcId: string,
  npc: NpcExtState,
  kind: NpcEventKind,
  day: number,
  options: {
    partnerNpcId?: string;
    locationId?: string;
    payload?: Record<string, string | number | boolean>;
  } = {},
): void {
  pushEvent(npc, kind, day, options.payload);
  generateNpcEventEcho({
    state,
    kind,
    npcId,
    partnerNpcId: options.partnerNpcId,
    locationId: options.locationId ?? npc.currentLocation,
    payload: options.payload,
  });
}

// Lazy seed: ensure every authored named NPC has a runtime ext entry the
// first time we tick. Generic NPCs (those not in NAMED_NPC_DEFAULTS) are
// never seeded — they remain implicitly "alive" in the conditions layer.
function ensureSeeded(state: WorldStateData): void {
  const ids = namedNpcIds();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (state.npcExt[id]) continue;
    const def = getNamedDefault(id);
    if (!def) continue;
    // Deep-clone the authored default so runtime mutation never bleeds
    // back into the static map.
    state.npcExt[id] = {
      power: def.power,
      age: def.age,
      status: def.status,
      currentLocation: def.currentLocation,
      homeLocation: def.homeLocation,
      sect: def.sect,
      sectRank: def.sectRank,
      goals: def.goals.map((g) => ({ ...g })),
      rivals: def.rivals.slice(),
      allies: def.allies.slice(),
      lastTickDay: def.lastTickDay,
      eventHistory: def.eventHistory.map((e) => ({ ...e })),
    };
  }
}

// ─── Per-NPC tick stages ───────────────────────────────────────────────

// §2.4 step 2: aging tick. Birthday rolls only when the simulated day
// crosses a 365-day boundary.
function ageStep(npc: NpcExtState, simDay: number): void {
  if (simDay > 0 && simDay % 365 === 0) {
    npc.age += 1;
  }
}

// §2.4 step 3: natural death roll, gated on age band.
function naturalDeathRoll(
  state: WorldStateData,
  npcId: string,
  npc: NpcExtState,
  simDay: number,
): boolean {
  let chance = 0;
  if (npc.age > 85) chance = NATURAL_DEATH_OVER_85;
  else if (npc.age > 70) chance = NATURAL_DEATH_OVER_70;
  if (chance <= 0) return false;
  if (Math.random() >= chance) return false;
  npc.status = "dead";
  fireEvent(state, npcId, npc, "death_natural", simDay, {
    payload: { age: npc.age },
  });
  return true;
}

// §2.4 step 4: power growth driven by goals. master_art rolls a small
// chance of a +5..15 power burst; climb_sect grants a steady +0..2.
function powerGrowthStep(npc: NpcExtState): void {
  let gain = 0;
  for (let i = 0; i < npc.goals.length; i++) {
    const goal = npc.goals[i];
    if (goal.kind === "master_art") {
      const odds = 0.01 + Math.random() * 0.04; // 1%..5% as spec §2.3
      if (Math.random() < odds) {
        gain += randInt(5, 15);
      }
    } else if (goal.kind === "climb_sect") {
      gain += randInt(0, 2);
    } else if (goal.kind === "avenge") {
      // training for vengeance — modest steady gain
      gain += randInt(0, 1);
    }
  }
  if (gain > 0) {
    npc.power = Math.min(POWER_CAP, npc.power + gain);
  }
}

// Pick a replacement goal kind, biased by what the NPC already does.
// Avoids handing a sect-climb goal to a sect-less wanderer.
function rollNewGoal(npc: NpcExtState): NpcGoal | null {
  const kind = GOAL_KINDS[randInt(0, GOAL_KINDS.length - 1)];
  // Skip sect-related kinds for unaffiliated NPCs.
  if (kind === "climb_sect" && npc.sect == null) return null;
  if (kind === "avenge") {
    if (npc.rivals.length === 0) return null;
    const rivalId = npc.rivals[randInt(0, npc.rivals.length - 1)];
    const goal = GOAL_POOL.avenge() as Extract<NpcGoal, { kind: "avenge" }>;
    goal.targetNpcId = rivalId;
    return goal;
  }
  return GOAL_POOL[kind]();
}

// §2.4 step 5: bump each goal's progress, fire completion events on
// crossing threshold, and optionally reroll a replacement.
function goalProgressStep(
  state: WorldStateData,
  npcId: string,
  npc: NpcExtState,
  simDay: number,
): void {
  if (npc.goals.length === 0) return;
  // Walk the array bottom-up so `splice` doesn't perturb future indices.
  for (let i = npc.goals.length - 1; i >= 0; i--) {
    const goal = npc.goals[i];
    goal.progress += randInt(GOAL_PROGRESS_MIN, GOAL_PROGRESS_MAX);
    if (goal.progress < goal.threshold) continue;

    // Fire completion event by goal kind.
    switch (goal.kind) {
      case "master_art":
        npc.power = Math.min(POWER_CAP, npc.power + 10);
        fireEvent(state, npcId, npc, "master_art", simDay, {
          payload: { artId: goal.artId },
        });
        break;
      case "climb_sect":
        if (npc.sect != null) {
          npc.sectRank = Math.min(10, npc.sectRank + 1);
          fireEvent(state, npcId, npc, "sect_promotion", simDay, {
            payload: { sect: npc.sect, rank: npc.sectRank },
          });
        }
        break;
      case "avenge":
        // Fires as a duel result. Without an NPC-NPC combat resolver in
        // v1 we treat the rival as defeated.
        if (goal.targetNpcId) {
          const rival = state.npcExt[goal.targetNpcId];
          if (rival && rival.status === "alive") {
            rival.status = "dead";
            npc.power = Math.min(POWER_CAP, npc.power + 5);
            fireEvent(state, goal.targetNpcId, rival, "death_combat", simDay, {
              partnerNpcId: npcId,
              payload: { killer: npcId },
            });
          }
        }
        break;
      case "find_treasure":
        npc.power = Math.min(POWER_CAP, npc.power + 5);
        fireEvent(state, npcId, npc, "found_treasure", simDay, {
          locationId: goal.locationId,
          payload: { itemId: goal.itemId, locationId: goal.locationId },
        });
        break;
      case "seek_wisdom":
        npc.status = "secluded";
        fireEvent(state, npcId, npc, "secluded", simDay, {
          locationId: goal.locationId,
          payload: { locationId: goal.locationId },
        });
        break;
    }

    // Drop the completed goal.
    npc.goals.splice(i, 1);

    // 50% chance to roll a replacement (subject to gating in rollNewGoal).
    if (Math.random() < GOAL_REROLL_CHANCE) {
      const replacement = rollNewGoal(npc);
      if (replacement) npc.goals.push(replacement);
    }
  }
}

// §2.4 step 6: 8% chance per tick to fire one of the random ambient
// events. Each event is pre-checked against its own prerequisites.
function randomEventStep(
  state: WorldStateData,
  npcId: string,
  npc: NpcExtState,
  simDay: number,
): void {
  if (Math.random() >= RANDOM_EVENT_CHANCE) return;

  // Build the eligible event roster on the fly.
  const eligible: NpcEventKind[] = ["travel"]; // travel is always eligible
  // marry: requires a target NPC whose allies array references this NPC
  let marryPartnerId: string | null = null;
  for (const otherId in state.npcExt) {
    if (otherId === npcId) continue;
    const other = state.npcExt[otherId];
    if (other.status !== "alive") continue;
    if (other.allies.includes(npcId)) {
      marryPartnerId = otherId;
      break;
    }
  }
  if (marryPartnerId) eligible.push("marry");

  // take_disciple: high-rank elder NPCs (sectRank ≥ 7 + age > 50)
  if (npc.sect != null && npc.sectRank >= 7 && npc.age > 50) {
    eligible.push("take_disciple");
  }

  // betray_sect: rare — only rolled inside the random event branch and
  // gated on actually being in a sect. The 1% sub-roll fires below.
  if (npc.sect != null) {
    eligible.push("betray_sect");
  }

  const pick = eligible[randInt(0, eligible.length - 1)];

  switch (pick) {
    case "travel": {
      // For v1 we don't have a location graph here; just record the
      // current location as the new one (no-op state) so the rumor
      // template still has something to say. Real travel destinations
      // can be wired in later from world-map.
      fireEvent(state, npcId, npc, "travel", simDay, {
        payload: { fromLocation: npc.currentLocation },
      });
      break;
    }
    case "marry": {
      if (!marryPartnerId) break;
      fireEvent(state, npcId, npc, "marry", simDay, {
        partnerNpcId: marryPartnerId,
        payload: { partner: marryPartnerId },
      });
      break;
    }
    case "take_disciple": {
      // We don't spawn a new NPC entity in v1 — that's a §2.6 deferred
      // item. We just fire the event so a rumor can mention it.
      fireEvent(state, npcId, npc, "take_disciple", simDay);
      break;
    }
    case "betray_sect": {
      if (Math.random() >= BETRAY_SECT_CHANCE) break;
      const formerSect = npc.sect;
      npc.sect = null;
      npc.sectRank = 0;
      fireEvent(state, npcId, npc, "betray_sect", simDay, {
        payload: formerSect ? { formerSect } : {},
      });
      break;
    }
    default:
      break;
  }
}

// ─── Public entry point ────────────────────────────────────────────────

export function tickAllNamedNpcs(state: WorldStateData, opts: TickOptions): void {
  const daysSinceLast = opts.currentDay - state.lastNpcTickDay;
  if (daysSinceLast < TICK_INTERVAL_DAYS) {
    // Not yet time. Don't even bump lastNpcTickDay — we want the next
    // call to see the same delta and tick when it crosses the boundary.
    return;
  }

  ensureSeeded(state);

  const totalBatches = Math.floor(daysSinceLast / TICK_INTERVAL_DAYS);
  const ranBatches = Math.min(totalBatches, MAX_TICKS_PER_CALL);
  const excessBatches = totalBatches - ranBatches;

  // Snapshot the id list once — npcExt won't gain entries mid-tick (no
  // procedural NPC spawn in v1) so this is safe and cheap.
  const ids = Object.keys(state.npcExt);

  for (let batch = 1; batch <= ranBatches; batch++) {
    // Simulated day this batch lands on. Each batch represents 7 elapsed
    // world days from the last tick.
    const simDay = state.lastNpcTickDay + batch * TICK_INTERVAL_DAYS;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const npc = state.npcExt[id];
      if (npc.status !== "alive") continue;

      ageStep(npc, simDay);

      const died = naturalDeathRoll(state, id, npc, simDay);
      if (died) {
        npc.lastTickDay = simDay;
        continue;
      }

      powerGrowthStep(npc);
      goalProgressStep(state, id, npc, simDay);
      // Re-check status — goal completion (e.g. seek_wisdom) may have
      // moved us into "secluded".
      if (npc.status !== "alive") {
        npc.lastTickDay = simDay;
        continue;
      }
      randomEventStep(state, id, npc, simDay);

      npc.lastTickDay = simDay;
    }
  }

  // §2.4 throttle: excess batches accrue aging only.
  if (excessBatches > 0) {
    for (let batch = 1; batch <= excessBatches; batch++) {
      const simDay =
        state.lastNpcTickDay + (ranBatches + batch) * TICK_INTERVAL_DAYS;
      for (let i = 0; i < ids.length; i++) {
        const npc = state.npcExt[ids[i]];
        if (npc.status !== "alive") continue;
        ageStep(npc, simDay);
        // Even in dark time the NPC's lastTickDay catches up so the next
        // call doesn't double-count.
        npc.lastTickDay = simDay;
      }
    }
    // One concise warning per call, regardless of how many batches were
    // collapsed. Keeps `advanceTime(365)` from spamming the console.
    console.warn(
      `[npc-tick] ${excessBatches} excess batches collapsed (aging only)`,
    );
  }

  // Clamp clock to caller's currentDay (single, final write).
  state.lastNpcTickDay = opts.currentDay;
}
