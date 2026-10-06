import type { Condition, NpcDef, QuestDef, RouteScene, WorldStateData } from "./types";
import { NPCS, getNpc } from "./data/npcs";
import { getQuest } from "./data/quests";
import { SCENES, getScene } from "./data/scenes";
import { getItem } from "./data/items";
import { getOpponent } from "./data/opponents";
import { SHOPS } from "./data/shops";
import { getResource } from "./data/resources";
import { fightEventsForLocation } from "./data/random-events";
import { getLocationMap, type MapSpot } from "./data/location-maps";
import { evaluateCondition } from "./conditions";
import { describeQuestCondition, type QuestProgressLine } from "./effects";
import { objectiveMarkerId, objectiveSpotsFor } from "./quest-objectives";
import { npcPlaces, questHolder } from "./npc-life";

/**
 * Quest guidance for every kind of stage: what to do next for a quest, where
 * to do it, and which way to walk.
 *
 *   objective — a hands-on spot on the map / an action with a person (QuestStage.objective)
 *   gather / shop / hunt / wander — the nearest place to get a wanted item or meet a wanted foe
 *   place     — a location the stage wants visited
 *   npc       — the person the stage names ("พบนายอำเภอหวู่…"), or the turn-in person on the last stage
 *
 * The tracked quest (flags.trackedQuestId, else the newest active quest) is
 * what the HUD tracker shows and the map arrows point at.
 */
export type GuideKind = "objective" | "npc" | "place" | "shop" | "gather" | "hunt" | "wander" | "none";

export interface QuestGuide {
  questId: string;
  questName: string;
  stageIndex: number;
  stageCount: number;
  stageText: string;
  kind: GuideKind;
  /** What to do, in a few words ("คุยกับหมอหลิน", "ซื้อแร่เหล็ก"). */
  action: string;
  /** Counter for item / kill / multi-spot stages. */
  progress?: { current: number; required: number };
  npcId?: string;
  npcName?: string;
  /** Marker to point at once at the target location (npc-…, objective-…, service-…). */
  markerId?: string;
  locationId: string | null;
  locationName: string | null;
  /** Locations from here to the target, both ends included (length 1 = already there). */
  path: string[];
}

/** Flag value that means "track nothing". */
export const TRACK_NONE = "none";

// Longest names first so "หมอหลิน" wins over a shorter name inside it.
// Each placed NPC by full name, plus the short name before a bracketed title
// ("หวงชิงเฉวียน (ปรมาจารย์ฤาษี)" → "หวงชิงเฉวียน") when no one else shares it —
// stage text usually says the short one. Longest keys first.
const NAMED_NPCS: { npc: NpcDef; key: string }[] = (() => {
  const placed = NPCS.filter((npc) => npc.name.length >= 2 && npc.locationIds.length > 0);
  const full = new Set(placed.map((npc) => npc.name));
  const shortCount = new Map<string, number>();
  const shortOf = (name: string) => name.replace(/\s*\(.*$/, "").trim();
  for (const npc of placed) { const short = shortOf(npc.name); if (short !== npc.name) shortCount.set(short, (shortCount.get(short) ?? 0) + 1); }
  const keys = placed.flatMap((npc) => {
    const short = shortOf(npc.name);
    const usable = short !== npc.name && short.length >= 2 && !full.has(short) && shortCount.get(short) === 1;
    return usable ? [{ npc, key: npc.name }, { npc, key: short }] : [{ npc, key: npc.name }];
  });
  return keys.sort((a, b) => b.key.length - a.key.length);
})();

/** The person the current stage of `quest` names, or the turn-in person on the last stage. */
export function stageTargetNpc(state: WorldStateData, quest: QuestDef): NpcDef | null {
  const progress = state.quests[quest.id];
  if (!progress || progress.status !== "active") return null;
  const stage = quest.stages[progress.stage];
  if (!stage) return null;
  const named = namedNpcIn(stage.description);
  if (named) return named;
  // A dead giver's hand-in passes to their heir.
  if (progress.stage === quest.stages.length - 1) return getNpc(questHolder(state, quest.turnInNpcId ?? quest.giverNpcId)) ?? null;
  return null;
}

function namedNpcIn(text: string): NpcDef | null {
  let best: { npc: NpcDef; at: number } | null = null;
  const taken: [number, number][] = [];
  for (const { npc, key } of NAMED_NPCS) {
    const at = text.indexOf(key);
    if (at < 0 || taken.some(([start, end]) => at >= start && at < end)) continue;
    taken.push([at, at + key.length]);
    if (!best || at < best.at) best = { npc, at };
  }
  return best?.npc ?? null;
}

// Longest names first so "ป่าไผ่ใหญ่" wins over "ป่าไผ่".
const NAMED_LOCATIONS = SCENES.flatMap((s) => (s.kind === "location" && s.name.length >= 3 ? [{ id: s.id, name: s.name }] : []))
  .sort((a, b) => b.name.length - a.name.length);

function namedLocationIn(text: string): string | null {
  let best: { id: string; at: number } | null = null;
  for (const location of NAMED_LOCATIONS) {
    const at = text.indexOf(location.name);
    if (at >= 0 && (!best || at < best.at)) best = { id: location.id, at };
  }
  return best?.id ?? null;
}

/** Location adjacency through route scenes: A → route_A__to__B → B. */
function neighbours(locationId: string): string[] {
  const scene = getScene(locationId);
  if (scene?.kind !== "location") return [];
  const out: string[] = [];
  for (const ref of scene.routes) {
    const route = getScene(ref.routeSceneId);
    if (route?.kind !== "route") continue;
    for (const destination of route.destinations) if (destination.locationId !== locationId) out.push(destination.locationId);
  }
  return out;
}

/**
 * Breadth-first predecessor map from `from` over the whole world. The road
 * graph is static content, so each origin's map is built once and shared
 * (read-only: callers only walk it with pathIn).
 */
const walks = new Map<string, ReadonlyMap<string, string>>();
function walkFrom(from: string): ReadonlyMap<string, string> {
  let previous = walks.get(from);
  if (!previous) { previous = searchFrom(from); walks.set(from, previous); }
  return previous;
}

function searchFrom(from: string): Map<string, string> {
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    for (const next of neighbours(here)) {
      if (previous.has(next)) continue;
      previous.set(next, here);
      queue.push(next);
    }
  }
  return previous;
}

function pathIn(previous: ReadonlyMap<string, string>, from: string, to: string): string[] | null {
  if (!previous.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(previous.get(path[0])!);
  return path;
}

/** Shortest walk between two locations (breadth-first), or null if unreachable. */
export function pathBetween(from: string, to: string): string[] | null {
  return from === to ? [from] : pathIn(walkFrom(from), from, to);
}

/**
 * Where a road's ย้อนกลับ exit leads: its explicit `back`, else the place the
 * hero came from (`lastLocationId`), else the road's own origin
 * (`route_<origin>__to__<destination>`) — a save from before walk events
 * stopped pinning the road as lastLocationId still gets a way back.
 */
export function routeBackTarget(state: Pick<WorldStateData, "lastLocationId">, scene: RouteScene): string | null {
  if (scene.back) return scene.back;
  const last = state.lastLocationId;
  if (last && last !== scene.id && getScene(last)?.kind === "location") return last;
  const origin = scene.id.startsWith("route_") ? scene.id.slice("route_".length).split("__to__")[0] : null;
  return origin && getScene(origin)?.kind === "location" ? origin : null;
}

/** Where the player stands for routing: a location, or the route's origin. */
function currentLocation(state: WorldStateData): string | null {
  const scene = getScene(state.currentSceneId);
  if (scene?.kind === "location") return scene.id;
  if (scene?.kind === "route") return routeBackTarget(state, scene) ?? state.lastLocationId;
  return state.lastLocationId;
}

const locationName = (id: string) => {
  const scene = getScene(id);
  return scene?.kind === "location" ? scene.name : id;
};

// ── Where things can be had (static, cached) ─────────────────────────────
interface Source { locationId: string; kind: "shop" | "gather" | "hunt" | "wander"; markerId?: string; cost: number }
const LOCATIONS = SCENES.filter((s) => s.kind === "location");
const sourceCache = new Map<string, Source[]>();

function serviceMarker(locationId: string, match: (spot: MapSpot) => boolean): string | undefined {
  const index = getLocationMap(locationId)?.spots?.findIndex(match) ?? -1;
  return index >= 0 ? "service-" + index : undefined;
}

const fightPools = new Map<string, Set<string>>();
function fightPool(locationId: string): Set<string> {
  let pool = fightPools.get(locationId);
  if (!pool) {
    pool = new Set(locationId === "home_player" ? [] : fightEventsForLocation(locationId).map((event) => event.opponentId));
    fightPools.set(locationId, pool);
  }
  return pool;
}

/** Places where a foe can be fought: hunting grounds first, else roaming encounters. */
function opponentSources(opponentId: string): Source[] {
  const key = "opp:" + opponentId;
  const cached = sourceCache.get(key);
  if (cached) return cached;
  const out: Source[] = [];
  for (const scene of LOCATIONS) {
    if (scene.kind !== "location") continue;
    for (const node of scene.resources ?? []) {
      if (!getResource(node.resourceId)?.opponentIds?.includes(opponentId)) continue;
      out.push({ locationId: scene.id, kind: "hunt", cost: 0,
        markerId: serviceMarker(scene.id, (spot) => spot.kind === "resource" && spot.resourceId === node.resourceId) });
    }
    if (fightPool(scene.id).has(opponentId)) out.push({ locationId: scene.id, kind: "wander", cost: 2 });
  }
  sourceCache.set(key, out);
  return out;
}

/** Places to get an item: shops, gathering nodes, then foes that drop it. */
export function itemSources(itemId: string): Source[] {
  const key = "item:" + itemId;
  const cached = sourceCache.get(key);
  if (cached) return cached;
  const out: Source[] = [];
  for (const shop of SHOPS) {
    if (!shop.inventory.includes(itemId)) continue;
    out.push({ locationId: shop.locationId, kind: "shop", cost: 0,
      markerId: serviceMarker(shop.locationId, (spot) => spot.kind === "shop") });
  }
  for (const scene of LOCATIONS) {
    if (scene.kind !== "location") continue;
    for (const node of scene.resources ?? []) {
      const resource = getResource(node.resourceId);
      if (!resource?.yields.some((y) => y.itemId === itemId)) continue;
      out.push({ locationId: scene.id, kind: resource.opponentIds?.length ? "hunt" : "gather", cost: 0,
        markerId: serviceMarker(scene.id, (spot) => spot.kind === "resource" && spot.resourceId === node.resourceId) });
    }
  }
  if (!out.length) {
    for (const scene of LOCATIONS) {
      for (const opponentId of fightPool(scene.id)) {
        if (!getOpponent(opponentId)?.drops?.some((d) => d.itemId === itemId)) continue;
        out.push({ locationId: scene.id, kind: "wander", cost: 2 });
        break;
      }
    }
  }
  sourceCache.set(key, out);
  return out;
}

/** First unmet counted / place leaf of a stage condition. */
function unmetLeaf(state: WorldStateData, c: Condition, quest: QuestDef): Condition | null {
  if (c.t === "and") {
    for (const sub of c.all) { const leaf = unmetLeaf(state, sub, quest); if (leaf) return leaf; }
    return null;
  }
  if (c.t === "or") return c.any.some((sub) => evaluateCondition(state, sub)) ? null : unmetLeaf(state, c.any[0], quest);
  if (c.t === "hasItem" || c.t === "defeatedOpponent") {
    const [line] = describeQuestCondition(state, c, 0, state.quests[quest.id]);
    return line && !line.done ? c : null;
  }
  if (c.t === "visitedLocation" || c.t === "stoleFromNpc" || c.t === "kidnappedNpc" || c.t === "assassinatedNpc") {
    return evaluateCondition(state, c) ? null : c;
  }
  return null;
}

type Target = Omit<QuestGuide, "questId" | "questName" | "stageIndex" | "stageCount" | "stageText" | "path" | "locationName"> & { path?: string[] };

function nearest(sources: Source[], here: string | null, previous: ReadonlyMap<string, string> | null): { source: Source; path: string[] } | null {
  let best: { source: Source; path: string[]; score: number } | null = null;
  for (const source of sources) {
    const path = here && previous ? (source.locationId === here ? [here] : pathIn(previous, here, source.locationId)) : null;
    const score = (path ? path.length : 99) + source.cost;
    if (!best || score < best.score) best = { source, path: path ?? [], score };
  }
  return best;
}

function npcTarget(state: WorldStateData, npc: NpcDef, action: string, here: string | null, previous: ReadonlyMap<string, string> | null): Target {
  // Where they stand now: a travelling person's road, a resident's home.
  const places = npcPlaces(state, npc);
  const pick = nearest(places.map((locationId) => ({ locationId, kind: "shop" as const, cost: 0 })), here, previous);
  return { kind: "npc", action, npcId: npc.id, npcName: npc.name, markerId: "npc-" + npc.id,
    locationId: pick?.source.locationId ?? places[0] ?? null, path: pick?.path };
}

/** Guide for one active quest's current stage (null when not active). */
export function guideForQuest(state: WorldStateData, questId: string): QuestGuide | null {
  const quest = getQuest(questId);
  const progress = state.quests[questId];
  if (!quest || !progress || progress.status !== "active") return null;
  const stage = quest.stages[progress.stage];
  if (!stage) return null;
  const here = currentLocation(state);
  const previous = here ? walkFrom(here) : null;
  const last = progress.stage === quest.stages.length - 1;
  let target: Target | null = null;
  // An item / foe with no known source: keep its counter for the fallbacks below.
  let pending: { action: string; progress: { current: number; required: number } } | null = null;

  // 1. Hands-on objective spots.
  const spots = objectiveSpotsFor(state, quest);
  const open = spots.filter((s) => !s.done);
  if (open.length) {
    const pick = nearest(open.map((s) => ({ locationId: s.spot.locationId, kind: "shop" as const, cost: 0 })), here, previous)!;
    const spot = open.find((s) => s.spot.locationId === pick.source.locationId) ?? open[0];
    const npc = spot.spot.npcId ? getNpc(spot.spot.npcId) : undefined;
    target = { kind: "objective", action: spot.spot.label, locationId: spot.spot.locationId, path: pick.path,
      markerId: npc ? "npc-" + npc.id : objectiveMarkerId(quest.id, spot.spotIndex), npcId: npc?.id, npcName: npc?.name,
      progress: spots.length > 1 ? { current: spots.length - open.length, required: spots.length } : undefined };
  }

  // 2. Items, foes and places the stage counts.
  if (!target && stage.autoAdvance) {
    const leaf = unmetLeaf(state, stage.autoAdvance, quest);
    if (leaf?.t === "stoleFromNpc" || leaf?.t === "kidnappedNpc" || leaf?.t === "assassinatedNpc") {
      const npc = getNpc(leaf.npcId);
      const verb = leaf.t === "stoleFromNpc" ? "ขโมยจาก" : leaf.t === "kidnappedNpc" ? "ลักพาตัว" : "ลอบสังหาร";
      if (npc) target = npcTarget(state, npc, verb + npc.name, here, previous);
    } else if (leaf?.t === "visitedLocation") {
      target = { kind: "place", action: `เดินทางไป${locationName(leaf.locationId)}`, locationId: leaf.locationId };
    } else if (leaf?.t === "hasItem" || leaf?.t === "defeatedOpponent") {
      const [line] = describeQuestCondition(state, leaf, 0, progress) as QuestProgressLine[];
      const counter = { current: Math.min(line.current, line.required), required: line.required };
      const sources = leaf.t === "hasItem" ? itemSources(leaf.itemId) : opponentSources(leaf.opponentId);
      const pick = nearest(sources, here, previous);
      const itemName = leaf.t === "hasItem" ? getItem(leaf.itemId)?.name ?? leaf.itemId : "";
      const foeName = leaf.t === "defeatedOpponent" ? getOpponent(leaf.opponentId)?.name ?? leaf.opponentId : "";
      if (pick) {
        const verb = leaf.t === "defeatedOpponent"
          ? pick.source.kind === "hunt" ? `ล่า${foeName}` : `ปราบ${foeName} · เดินสำรวจเพื่อพบเจอ`
          : pick.source.kind === "shop" ? `ซื้อ${itemName}` : pick.source.kind === "gather" ? `เก็บ${itemName}`
          : pick.source.kind === "hunt" ? `ล่าสัตว์หา${itemName}` : `หา${itemName} จากศัตรูแถบนี้`;
        target = { kind: pick.source.kind, action: verb, locationId: pick.source.locationId, path: pick.path,
          markerId: pick.source.markerId, progress: counter };
      } else {
        // No world source (a letter someone hands over): fall back to the named person.
        const npc = namedNpcIn(stage.description);
        if (npc) target = { ...npcTarget(state, npc, `พบ${npc.name}`, here, previous), progress: counter };
        else pending = { action: leaf.t === "hasItem" ? `หา${itemName}` : `ปราบ${foeName}`, progress: counter };
      }
    }
  }

  // 3. The person the stage names, or the turn-in person at the end.
  if (!target) {
    const npc = stageTargetNpc(state, quest);
    if (npc) target = npcTarget(state, npc, last ? `ส่งภารกิจที่${npc.name}` : `พบ${npc.name}`, here, previous);
  }
  // 4. A place the stage names, else the quest giver (dialog-driven beats
  //    continue with them). Trait goals ("สะสมความถ่อมตน") have no place.
  if (!target) {
    const place = namedLocationIn(stage.description);
    if (place) target = { kind: "place", action: pending?.action ?? stage.description, locationId: place };
  }
  if (!target && stage.autoAdvance?.t !== "trait") {
    const giver = getNpc(questHolder(state, quest.giverNpcId));
    if (giver) target = npcTarget(state, giver, `พบ${giver.name}`, here, previous);
  }
  target ??= { kind: "none", action: pending?.action ?? stage.description, locationId: null };
  if (pending && !target.progress) target.progress = pending.progress;

  const path = target.path ?? (target.locationId && here ? pathIn(previous!, here, target.locationId) ?? [] : []);
  return {
    ...target,
    questId: quest.id, questName: quest.name, stageIndex: progress.stage, stageCount: quest.stages.length,
    stageText: stage.description, path,
    locationName: target.locationId ? locationName(target.locationId) : null,
  };
}

/** The quest the player tracks: the chosen one while active, else the newest active quest ("none" = nothing). */
export function trackedQuestId(state: WorldStateData): string | null {
  const flag = state.flags.trackedQuestId;
  if (flag === TRACK_NONE) return null;
  if (typeof flag === "string" && state.quests[flag]?.status === "active") return flag;
  const active = Object.values(state.quests).filter((quest) => quest.status === "active" && getQuest(quest.id));
  return active.length ? active[active.length - 1].id : null;
}

/** Guide for the tracked quest. */
export function activeGuide(state: WorldStateData): QuestGuide | null {
  const id = trackedQuestId(state);
  return id ? guideForQuest(state, id) : null;
}

/**
 * Which marker on the current map the guide arrow should sit on:
 *   at the target's location → the target marker (person, spot, shop, hunting ground)
 *   elsewhere on a location map → the exit toward the next stop
 *   on a route map → the destination closest to the target
 */
export function guideMarkerId(state: WorldStateData, guide: QuestGuide): string | null {
  if (!guide.locationId) return null;
  const scene = getScene(state.currentSceneId);
  if (scene?.kind === "location") {
    if (scene.id === guide.locationId) return guide.markerId ?? null;
    const next = guide.path[1];
    return next ? "route_" + scene.id + "__to__" + next : null;
  }
  if (scene?.kind === "route") {
    // Same filter + indexing as RouteMapView's destination markers.
    const visible = scene.destinations.filter((d) => !d.visibleIf || evaluateCondition(state, d.visibleIf));
    let best: string | null = null, bestLength = Infinity;
    visible.forEach((destination, index) => {
      const path = pathBetween(destination.locationId, guide.locationId!);
      if (path && path.length < bestLength) { best = "destination-" + index; bestLength = path.length; }
    });
    // Turning back (RouteMapView's "back" marker) when the target lies behind.
    const back = routeBackTarget(state, scene);
    const behind = back ? pathBetween(back, guide.locationId) : null;
    if (behind && behind.length < bestLength) best = "back";
    return best;
  }
  return null;
}
