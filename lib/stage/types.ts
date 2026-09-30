export interface Point { x: number; y: number }

export interface WorldMarker extends Point {
  id: string;
  label: string;
  kind: "npc" | "exit" | "service";
  image?: string;
  /** Unique native-pixel world sprite for this NPC (single frame); archetype sheet otherwise. */
  sprite?: string;
  icon?: string;
  disabled?: boolean;
  /** Quest marker over an NPC: "offer" shows !, "turnin" shows ?. */
  quest?: "offer" | "turnin";
  /** Quest guide target: a bobbing arrow above it (and an edge pointer while off-screen). */
  guide?: boolean;
  onActivate: () => void;
}

export interface WorldPresentation {
  key: string;
  name: string;
  image: string;
  /** Draw the background painting mirrored left↔right (route variety). */
  mirrorImage?: boolean;
  playerImage: string;
  spawn: Point;
  markers: WorldMarker[];
  time?: number;
  paused?: boolean;
  readOnly?: boolean;
  /** Local speaker marker; used only when reconstructing a conversation without a session position. */
  dialogueSpeakerId?: string;
  props?: (Point & { id: string; image: string; width: number; height: number; visible?: boolean })[];
  bystanders?: (Point & { id: string; characterId: string; size?: number; facingLeft?: boolean; visible?: boolean })[];
  worldDescription?: string;
  rememberPosition?: boolean;
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
export const clearMapPositions = () => positions.clear();

export function stepTowards(from: Point, to: Point, distance: number): Point {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length <= distance || length === 0) return { ...to };
  return { x: from.x + (to.x - from.x) / length * distance, y: from.y + (to.y - from.y) / length * distance };
}
