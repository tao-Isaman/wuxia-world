export interface Point { x: number; y: number }

export interface WorldMarker extends Point {
  id: string;
  label: string;
  kind: "npc" | "exit" | "service";
  image?: string;
  icon?: string;
  disabled?: boolean;
  onActivate: () => void;
}

export interface WorldPresentation {
  key: string;
  name: string;
  image: string;
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

export interface WorldRuntime {
  interact: (id: string) => void;
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
