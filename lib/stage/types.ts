import type { HeroPoseStrip } from "@/lib/characters/hero-actions";
import type { PlacementGeometry } from "@/lib/assets/placement-geometry";
export interface Point { x: number; y: number }

export type WorldMarkerCategory = "npc" | "route" | "place" | "activity";
export const markerCategory = (marker: Pick<WorldMarker, "kind" | "category">): WorldMarkerCategory =>
  marker.category ?? (marker.kind === "npc" ? "npc" : marker.kind === "exit" ? "route" : "place");

export interface WorldMarker extends Point {
  id: string;
  label: string;
  kind: "npc" | "exit" | "service";
  image?: string;
  /** Unique native-pixel world sprite for this NPC (single frame); archetype sheet otherwise. */
  sprite?: string;
  icon?: string;
  /** Map sign glyph key (service kind or life-skill id); falls back to the icon's file name. */
  badge?: string;
  /** Emoji shown on the action button and in the places list. */
  glyph?: string;
  /** Places-list tab: people, ways out, services, or things to do. */
  category?: WorldMarkerCategory;
  disabled?: boolean;
  /** Quest marker over an NPC: "offer" shows !, "turnin" shows ?. */
  quest?: "offer" | "turnin";
  /** Quest guide target: a bobbing arrow above it (and an edge pointer while off-screen). */
  guide?: boolean;
  /** NPC strolls around its spot (NpcDef.look.wander; needs a four-way walk sheet). */
  wander?: boolean;
  onActivate: () => void;
}

/** A foe waiting on the map (the world store's roamingFoes); walking into it calls `onEngage`. */
export interface WorldFoe extends Point {
  id: string;
  name: string;
  look: { kind: "character"; characterId: string; tint?: number; size?: number }
    | { kind: "creature"; frame: number; tint?: number; size?: number };
  onEngage: () => void;
}

export interface WorldPresentation {
  key: string;
  name: string;
  image: string;
  /** Draw the background painting mirrored left↔right (route variety). */
  mirrorImage?: boolean;
  /** Regional colour grade for the painting (route maps; lib/stage/route-grade.ts). */
  imageGrade?: string;
  playerImage: string;
  spawn: Point;
  /** Which way the hero faces at `spawn` (default east). */
  spawnFacing?: "east" | "west" | "north" | "south";
  markers: WorldMarker[];
  time?: number;
  paused?: boolean;
  readOnly?: boolean;
  /** Local speaker marker; used only when reconstructing a conversation without a session position. */
  dialogueSpeakerId?: string;
  props?: (Point & { id: string; image: string; width: number; height: number; visible?: boolean })[];
  bystanders?: (Point & { id: string; characterId: string; size?: number; facingLeft?: boolean; visible?: boolean })[];
  /** Foes standing on the map, read every frame (no rebuild when they come and go). */
  foes?: WorldFoe[];
  worldDescription?: string;
  rememberPosition?: boolean;
  /**
   * The hero's painted work loop (lib/characters/hero-actions.ts, heroPoseStrip),
   * played in place of the walking sprite while set; read every frame.
   */
  heroAction?: HeroPoseStrip | null;
  /**
   * Objects placed on this map by the engine's map editor
   * (lib/assets/placement-geometry.ts): drawn by layer and depth, their
   * blocking footprints added to the map's collision. `null` while they are
   * still loading (the host waits); absent or empty for none.
   */
  placements?: readonly PlacementGeometry[] | null;
}

/** Map distance (960×640 units) per random-event walk tick. */
export const WALK_TICK_UNITS = 220;

export interface WorldRuntime {
  interact: (id: string) => void;
  /** Forward a tap (viewport coordinates) that the joystick layer did not turn into a drag. */
  tapAt: (clientX: number, clientY: number) => void;
  /** Analog movement from the on-screen joystick (x/y in −1…1), or null when released. */
  setStick: (vector: Point | null) => void;
  destroy: () => void;
}

// Session positions deliberately stay outside saved gameplay data.
const positions = new Map<string, Point>();
export const getRememberedMapPosition = (key: string) => positions.get(key);
export const getMapPosition = (key: string, fallback: Point) => positions.get(key) ?? fallback;
export const rememberMapPosition = (key: string, point: Point) => positions.set(key, point);
export const forgetMapPosition = (key: string) => positions.delete(key);
export const clearMapPositions = () => { positions.clear(); arrivals.clear(); };

// Arrival hints: the place the hero is walking in from, so a location map
// can put them at the exit leading back there (arrive on the side you came
// in). Session-only like positions; set by the route view on arrival.
const arrivals = new Map<string, string>();
export const setArrivalFrom = (locationId: string, fromId: string) => arrivals.set(locationId, fromId);
export const peekArrivalFrom = (locationId: string) => arrivals.get(locationId);
export const clearArrivalFrom = (locationId: string) => arrivals.delete(locationId);

export function stepTowards(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length <= distance || length === 0) return { ...to };
  return { x: from.x + (to.x - from.x) / length * distance, y: from.y + (to.y - from.y) / length * distance };
}
