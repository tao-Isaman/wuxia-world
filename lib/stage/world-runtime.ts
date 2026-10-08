import { gradePixels } from "./route-grade";
import { pageRect, toClientPoint, toPagePoint } from "@/lib/ui/landscape";
import type * as Phaser from "phaser";
import {
  CHARACTER_CLIPS, CHARACTER_FRAME_SIZE, CREATURE_ATLAS, characterId, creatureCell, npcCharacterId,
  type CharacterId,
} from "../characters/catalog";
import { loadCharacterAtlas } from "../characters/sheet";
import { getAnimSheet, type AnimSheet } from "../characters/anim-sheets";
import { animFrame, animScaleOf, animVisibleTop } from "./anim-frame";
import type { HeroPoseStrip } from "../characters/hero-actions";
import { hasAnimatedSheet } from "../characters/npc-sheets";
import { WALK8_FIRST_FRAME, WALK8_FPS, WALK8_FRAMES, dir8FromVector, walk8Frame, type Dir8 } from "../characters/walk8";
import { WANDER_FREEZE_DISTANCE, createWanderer, stepWanderer, type Wanderer } from "./npc-wander";
import { worldForeground } from "./world-occlusion";
import { createWorldLighting } from "./world-lighting";
import { drawWorldBadge, warmWorldCharacter } from "./world-style";
import { moveOnWorldGround, planWorldPath, withPlacedSolids, worldFootprints, worldPointBlocked } from "./world-navigation";
import { blockingRects, characterDepth, heroDepth, type PlacementGeometry } from "../assets/placement-geometry";
import { initialWorldPlacement } from "./world-placement";
import { addGridFrames, canvasTexture, createStage, drawCanvas, stagePixelRatio, type Stage } from "./phaser-stage";
import {
  WALK_TICK_UNITS, getRememberedMapPosition, rememberMapPosition, stepTowards,
  type Point, type RemotePlayer, type WorldFoe, type WorldMarker, type WorldPresentation, type WorldRuntime,
} from "./types";

const WIDTH = 960;
const HEIGHT = 640;
const SPEED = 150;
/** How far the camera zooms in past a cover fit: √5, so a fifth of the map's area is in view. */
const MAP_ZOOM = Math.sqrt(5);
const LOAD_TIMEOUT = 20_000;
/** The hero sprite's display size (a 128 px atlas cell). */
const PLAYER_SIZE = 56;
// Unique NPC sprites are ~74 native px tall; this frame/size pair gives them the
// same on-screen height as the archetype sheets (54 units × 108/128 of a frame).
const UNIQUE_FRAME = 80;
const UNIQUE_FEET = 78;
const UNIQUE_NPC_SIZE = 50;
/** How close (map units) the hero must come to a roaming foe to engage it. */
const FOE_TOUCH = 30;
/** A roaming foe's figure height (map units) at size 1: a 54-unit sheet cell × its 108 / 128 px figure. */
const FOE_FIGURE = 54 * 108 / 128;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toWorld = (point: Point): Point => ({ x: point.x * WIDTH / 100, y: point.y * HEIGHT / 100 });
const toPercent = (point: Point): Point => ({ x: point.x / WIDTH * 100, y: point.y / HEIGHT * 100 });
const clampPosition = (point: Point): Point => ({ x: clamp(point.x, 12, WIDTH - 12), y: clamp(point.y, 18, HEIGHT - 12) });

export function worldInputBlocked(): boolean {
  const active = document.activeElement;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"], [data-world-busy]') ||
    !!active?.matches('input, textarea, select, [contenteditable="true"]');
}

type Atlas = { image: HTMLCanvasElement; frameSize: number; feetY: number; figure?: number };
type CharacterVisual = {
  image: Phaser.GameObjects.Image;
  frame: number;
  facingLeft: boolean;
  frames: number;
  directional: boolean;
};
type TextSprite = { image: Phaser.GameObjects.Image; width: number; height: number };
type MarkerVisual = {
  point: Point;
  halo: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Image;
  label: TextSprite;
  labelText: string;
  /** Hero's Adventure-style always-on name over an NPC (hidden while the boxed label shows). */
  nameTag?: TextSprite;
  questMark?: Phaser.GameObjects.Image;
  /** Service / exit badge; fades when the player is far away. */
  icon?: Phaser.GameObjects.Image;
  character?: CharacterVisual;
  opacity: number;
  phase: number;
};

/** A flat 2D world in 960×640 map units, drawn by Phaser (WebGL, or Canvas on old devices). */
export function createWorldRuntime(
  parent: HTMLElement,
  read: () => WorldPresentation,
  onReady: () => void,
  onError: (message: string) => void,
  /** The interactable marker the hero is standing next to changed (drives the action button). */
  onNearby?: (markerId: string | null) => void,
  /**
   * Called for every WALK_TICK_UNITS the hero walks. `pickSpot` finds a free
   * spot the hero can reach, away from them (map percentages), for a foe.
   */
  onWalkTick?: (pickSpot: () => Point | null) => void,
): WorldRuntime {
  const initial = read();
  // Objects placed by the engine's map editor block like the painting's own solids.
  const placed = initial.placements ?? [];
  const footprints = withPlacedSolids(worldFootprints(initial.key, initial.image), blockingRects(placed));
  const placement = initialWorldPlacement(initial, getRememberedMapPosition(initial.key), footprints);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const font = getComputedStyle(document.body).fontFamily;
  const lighting = createWorldLighting(initial.key);
  const markers = new Map<string, MarkerVisual>();
  const props = new Map<string, Phaser.GameObjects.Image>();
  /** Placed objects drawn (object / overhead ones fade while the hero is behind or under them). */
  const placedVisuals: { geometry: PlacementGeometry; image: Phaser.GameObjects.Image; alpha: number }[] = [];
  const bystanders = new Map<string, { shadow: Phaser.GameObjects.Image; character: CharacterVisual }>();
  /** Rigged NPCs stroll around their spot; keyed by marker id. */
  const wanderers = new Map<string, Wanderer>();
  /** Where a marker stands now: a wandering NPC's current spot, else its authored point. */
  const markerPoint = (marker: WorldMarker): Point => wanderers.get(marker.id)?.pos ?? toWorld(marker);
  const keys = new Set<string>();
  const abort = new AbortController();
  const particles: { image: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  let scene: Phaser.Scene | undefined;
  let disposed = false;
  let failed = false;
  let ready = false;
  let lastTime = 0;
  let animationTime = 0;
  let shadowTexture = "";
  let motionTime = 0;
  let lastPositionReport = 0;
  let playerMotion: "idle" | "walk" = "idle";
  let playerFacing: "east" | "west" | "north" | "south" = placement.facing;
  // Eight-way heading for heroes with painted walk8 cells (lib/characters/walk8.ts).
  let playerBaseScaleY: number | undefined;
  let playerDir: Dir8 = ({ east: "E", west: "W", north: "N", south: "S" } as const)[placement.facing];
  let destination: Point | null = null;
  let waypoints: Point[] = [];
  let interaction: string | null = null;
  let lastInteraction: string | null = placement.speakerMarkerId ?? null;
  let hovered: string | null = null;
  let interactPressed = false;
  /** Analog stick from the on-screen joystick: x/y in −1…1, null when released. */
  let stick: Point | null = null;
  let nearbyReported: string | null | undefined;
  let walked = 0;
  let viewWidth = WIDTH;
  let viewHeight = HEIGHT;
  let viewScale = 1;
  let textureSerial = 0;
  let player: CharacterVisual | undefined;
  /** A standing hero's height in their atlas px (scales the work loops to match). */
  let playerFigure = 104;
  /** Work-loop sheets by url, loaded on first use, and the sprite that plays them. */
  const actionSheets = new Map<string, string | null>();
  let actionImage: Phaser.GameObjects.Image | undefined;
  let actor: { shadow: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Image; sign: Phaser.GameObjects.Image } | undefined;
  let targetRing: Phaser.GameObjects.Image | undefined;
  let veil: { image: Phaser.GameObjects.Image; texture: Phaser.Textures.CanvasTexture } | undefined;
  const position = placement.position;
  const cameraPosition: Point = { ...position };

  const dpr = stagePixelRatio();
  let markerQuestMarks: Record<"!" | "?", string> = { "!": "", "?": "" };
  let guideArrow: Phaser.GameObjects.Image | null = null;
  let guideEdge: Phaser.GameObjects.Image | null = null;
  const blocked = () => read().readOnly || read().paused || document.hidden || worldInputBlocked();

  parent.dataset.renderer = "phaser";
  const stage: Stage = createStage(parent, "#172723", {
    create(created) {
      scene = created;
      resize();
      void initialize().catch(fail);
    },
    update: (time) => tick(time),
    contextLost: () => fail("WebGL context lost"),
    error: fail,
  });

  function fail(cause?: unknown) {
    if (disposed || failed) return;
    failed = true;
    ready = false;
    keys.clear();
    parent.style.cursor = "";
    // Keep the real reason visible (and in the console) so a player's report
    // says what broke instead of only "failed to load".
    const reason = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
    if (cause) console.error("[world] scene failed:", cause);
    onError(`โหลดฉากไม่สำเร็จ กรุณาลองใหม่${reason ? `\n(${reason})` : ""}`);
  }
  function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        abort.signal.removeEventListener("abort", cancel);
        image.onload = null;
        image.onerror = null;
        if (error) { image.src = ""; reject(error); } else resolve(image);
      };
      const cancel = () => finish(new Error("World disposed"));
      const timeout = window.setTimeout(() => finish(new Error("Image load timed out")), LOAD_TIMEOUT);
      image.onload = () => finish();
      image.onerror = () => finish(new Error(`Image load failed: ${source}`));
      abort.signal.addEventListener("abort", cancel, { once: true });
      image.src = source;
    });
  }
  async function loadAtlas(id: CharacterId, includeDirections: boolean): Promise<Atlas> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancel: (() => void) | undefined;
    try {
      return await Promise.race([
        loadCharacterAtlas(id, includeDirections),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Character load timed out")), LOAD_TIMEOUT); }),
        new Promise<never>((_, reject) => {
          cancel = () => reject(new Error("World disposed"));
          abort.signal.addEventListener("abort", cancel, { once: true });
        }),
      ]);
    } finally {
      clearTimeout(timeout);
      if (cancel) abort.signal.removeEventListener("abort", cancel);
    }
  }
  function texture(canvas: HTMLCanvasElement, prefix = "t"): string {
    const key = `${prefix}:${textureSerial++}`;
    canvasTexture(scene!, key, canvas);
    return key;
  }
  function image(key: string, depth: number, width?: number, height?: number): Phaser.GameObjects.Image {
    const item = scene!.add.image(0, 0, key).setDepth(depth);
    if (width !== undefined && height !== undefined) item.setDisplaySize(width, height);
    return item;
  }
  /** One warmed atlas texture per character sheet, with numbered frames. */
  function characterTexture(key: string, atlas: Atlas): { key: string; frames: number } {
    const columns = Math.max(1, Math.round(atlas.image.width / atlas.frameSize));
    const rows = Math.max(1, Math.round(atlas.image.height / atlas.frameSize));
    if (!scene!.textures.exists(key)) addGridFrames(canvasTexture(scene!, key, warmWorldCharacter(atlas.image)), atlas.frameSize, columns, rows);
    return { key, frames: columns * rows };
  }
  function makeCharacter(key: string, atlas: Atlas, size: number): CharacterVisual {
    const sheet = characterTexture(key, atlas);
    const body = scene!.add.image(0, 0, sheet.key, 0);
    // All frames share the authored foot baseline.
    body.setOrigin(0.5, atlas.feetY / atlas.frameSize).setDisplaySize(size, size);
    const visual = { image: body, frame: -1, facingLeft: false, frames: sheet.frames, directional: sheet.frames >= 24 };
    setCharacterFrame(visual, 0, false);
    return visual;
  }
  function setCharacterFrame(character: CharacterVisual, frame: number, facingLeft = character.facingLeft) {
    if (character.frame === frame && character.facingLeft === facingLeft) return;
    // Single-frame (unique NPC) atlases always show their one pose.
    character.image.setFrame(frame % character.frames, false, false);
    character.image.setFlipX(facingLeft);
    character.frame = frame;
    character.facingLeft = facingLeft;
  }
  /** Text drawn at device resolution; `width` / `height` are CSS pixels. */
  function textSprite(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void, depth: number): TextSprite {
    const canvas = drawCanvas(width * dpr, height * dpr, (context) => { context.scale(dpr, dpr); draw(context); });
    const item = image(texture(canvas, "text"), depth);
    item.setOrigin(0.5, 1);
    return { image: item, width, height };
  }
  function measure(text: string, weight = ""): number {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");
    context.font = `${weight}13px ${font}`;
    return context.measureText(text).width;
  }
  function makeLabel(text: string): TextSprite {
    const width = Math.ceil(measure(text)) + 18;
    return textSprite(width, 27, (context) => {
      context.fillStyle = "rgba(16, 35, 30, 0.92)";
      context.fillRect(0, 0, width, 27);
      context.fillStyle = "rgba(221, 191, 126, 0.45)";
      context.fillRect(0, 26, width, 1);
      context.fillStyle = "#f4ead0";
      context.font = `13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, width / 2, 13);
    }, 10_000);
  }
  function makeNameTag(text: string, color = "#8ee67a"): TextSprite {
    const width = Math.ceil(measure(text, "600 ")) + 10;
    return textSprite(width, 22, (context) => {
      context.font = `600 13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "rgba(8, 20, 14, 0.95)";
      context.strokeText(text, width / 2, 11);
      context.fillStyle = color;
      context.fillText(text, width / 2, 11);
    }, 9_010);
  }
  function questMarkCanvas(glyph: "!" | "?"): HTMLCanvasElement {
    return drawCanvas(22 * dpr, 30 * dpr, (context) => {
      context.scale(dpr, dpr);
      context.font = "900 26px serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = 5;
      context.strokeStyle = "#2a1a05";
      context.strokeText(glyph, 11, 16);
      context.fillStyle = glyph === "!" ? "#ffd24a" : "#f4f0e4";
      context.fillText(glyph, 11, 16);
    });
  }
  /** Downward jade arrow for the quest guide (points right when used as the edge pointer, see rotation). */
  function guideArrowCanvas(): HTMLCanvasElement {
    return drawCanvas(28 * dpr, 30 * dpr, (context) => {
      context.scale(dpr, dpr);
      context.beginPath();
      context.moveTo(14, 28); context.lineTo(2, 13); context.lineTo(9, 13); context.lineTo(9, 2);
      context.lineTo(19, 2); context.lineTo(19, 13); context.lineTo(26, 13); context.closePath();
      context.lineJoin = "round";
      context.lineWidth = 3;
      context.strokeStyle = "#10261d";
      context.stroke();
      context.fillStyle = "#6fe0a8";
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.55)";
      context.fillRect(11, 4, 3, 10);
    });
  }
  function groundRing(color: string, filled = false) {
    return drawCanvas(64, 24, (context) => {
      context.strokeStyle = color;
      context.fillStyle = "rgba(232, 207, 139, 0.10)";
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(32, 12, 28, 8, 0, 0, Math.PI * 2);
      if (filled) context.fill();
      context.stroke();
      context.fillStyle = color;
      context.fillRect(30, 1, 4, 2);
    });
  }
  function markerBadge(kind: WorldMarker["kind"], glyph?: string) {
    return drawCanvas(32, 36, (context) => drawWorldBadge(context, kind === "exit", glyph));
  }
  function rememberPosition() {
    if (initial.rememberPosition !== false) rememberMapPosition(initial.key, toPercent(position));
  }
  function cancelWalk() {
    destination = null;
    waypoints = [];
    interaction = null;
    targetRing?.setVisible(false);
  }
  function walk(point: Point, marker?: string) {
    lastInteraction = null;
    waypoints = planWorldPath(position, clampPosition(point), footprints);
    destination = waypoints[waypoints.length - 1] ?? null;
    if (!destination) { cancelWalk(); return; }
    interaction = marker ?? null;
    targetRing?.setPosition(destination.x, destination.y).setVisible(true);
  }
  // A new heading must hold briefly before the hero turns, so letting go of a
  // diagonal (two keys never come up on the same frame) doesn't snap them to
  // the last key's direction. Starting from standing still turns at once.
  let dirCandidate: Dir8 | null = null, dirCandidateSince = 0, lastMoveAt = -Infinity;
  const TURN_HOLD_MS = 90;
  function faceMovement(dx: number, dy: number, turnNow = false) {
    const now = performance.now();
    const next = dir8FromVector(dx, dy, playerDir);
    if (turnNow || next === playerDir || now - lastMoveAt > 150) { playerDir = next; dirCandidate = null; }
    else if (next !== dirCandidate) { dirCandidate = next; dirCandidateSince = now; }
    else if (now - dirCandidateSince >= TURN_HOLD_MS) { playerDir = next; dirCandidate = null; }
    lastMoveAt = now;
    if (Math.abs(dy) > Math.abs(dx)) playerFacing = dy < 0 ? "north" : "south";
    else if (Math.abs(dx) > 0.001) playerFacing = dx < 0 ? "west" : "east";
  }
  function moveToMarker(id: string) {
    if (!ready || disposed || blocked()) return;
    const marker = read().markers.find((entry) => entry.id === id);
    if (!marker) return;
    // Disabled actions retain their original explanatory toast.
    if (marker.disabled) { marker.onActivate(); return; }
    const point = markerPoint(marker);
    // Stand beside people and below service signs instead of overlapping their art.
    const approach = marker.kind === "npc" ? { x: point.x + (point.x > WIDTH - 60 ? -38 : 38), y: point.y + 4 }
      : { x: point.x, y: point.y + (marker.kind === "service" ? 34 : 10) };
    walk(approach, id);
  }
  /** Camera centre in map units, snapped to whole device pixels. */
  function cameraCenter(): Point {
    const unit = viewScale * dpr;
    return { x: Math.round(cameraPosition.x * unit) / unit, y: Math.round(cameraPosition.y * unit) / unit };
  }
  function placeCamera(snap = false, dt = 0) {
    const targetX = viewWidth >= WIDTH ? WIDTH / 2 : clamp(position.x, viewWidth / 2, WIDTH - viewWidth / 2);
    const targetY = viewHeight >= HEIGHT ? HEIGHT / 2 : clamp(position.y, viewHeight / 2, HEIGHT - viewHeight / 2);
    const follow = snap || reducedMotion ? 1 : 1 - Math.exp(-8 * dt);
    cameraPosition.x += (targetX - cameraPosition.x) * follow;
    cameraPosition.y += (targetY - cameraPosition.y) * follow;
    const camera = scene?.cameras.main;
    if (!camera) return;
    const center = cameraCenter();
    camera.setZoom(viewScale * dpr);
    camera.centerOn(center.x, center.y);
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(parent.clientWidth, 1);
    const height = Math.max(parent.clientHeight, 1);
    // Cover the screen, then zoom in so the view holds a fifth of the map's
    // area and the camera follows the hero.
    const scale = Math.max(width / WIDTH, height / HEIGHT) * MAP_ZOOM;
    viewScale = scale;
    viewWidth = width / scale;
    viewHeight = height / scale;
    stage.fit(width, height);
    placeCamera(true);
  }
  /** CSS pixel inside the host → map units. */
  function toMap(event: PointerEvent): Point {
    const bounds = pageRect(parent);
    const at = toPagePoint(event.clientX, event.clientY);
    const center = cameraCenter();
    return {
      x: center.x - viewWidth / 2 + (at.x - bounds.left) / viewScale,
      y: center.y - viewHeight / 2 + (at.y - bounds.top) / viewScale,
    };
  }
  function toScreen(point: Point): Point {
    const center = cameraCenter();
    return { x: (point.x - center.x + viewWidth / 2) * viewScale, y: (point.y - center.y + viewHeight / 2) * viewScale };
  }
  // Tests: viewport point of a map point (to tap a foe, say).
  (parent as HTMLElement & { worldScreenPoint?: (x: number, y: number) => Point }).worldScreenPoint = (x, y) => {
    const bounds = pageRect(parent), p = toScreen({ x, y });
    return toClientPoint(bounds.left + p.x, bounds.top + p.y);
  };
  function markerAt(point: Point): string | null {
    let best: { id: string; y: number } | null = null;
    for (const marker of read().markers) {
      if (!markers.has(marker.id)) continue;
      const at = markerPoint(marker);
      const width = marker.kind === "npc" ? 50 : 44;
      const height = marker.kind === "npc" ? 76 : 52;
      if (Math.abs(point.x - at.x) > width / 2 || point.y > at.y + 8 || point.y < at.y + 8 - height) continue;
      // Overlapping hit areas resolve to the visually frontmost actor.
      if (!best || at.y > best.y) best = { id: marker.id, y: at.y };
    }
    return best?.id ?? null;
  }
  function pointerMove(event: PointerEvent) {
    if (!ready || blocked()) { pointerLeave(); return; }
    hovered = markerAt(toMap(event));
    parent.style.cursor = hovered ? "pointer" : "crosshair";
  }
  function pointerLeave() { hovered = null; parent.style.cursor = ""; }
  function pointerDown(event: PointerEvent) {
    if (!ready || event.button !== 0 || blocked()) return;
    if (!(event.target instanceof HTMLCanvasElement)) return;
    event.preventDefault();
    tapAt(event.clientX, event.clientY);
  }
  /** A tap on the map (viewport coordinates): approach a marker, or walk to the ground point. */
  function tapAt(clientX: number, clientY: number) {
    if (!ready || blocked()) return;
    parent.focus({ preventScroll: true });
    const point = toMap({ clientX, clientY } as PointerEvent);
    // A foe drawn over a marker wins the tap: the hero walks into it.
    const foe = foeAt(point);
    if (foe) { walk(foe); return; }
    const marker = markerAt(point);
    if (marker) { moveToMarker(marker); return; }
    walk(point);
  }
  const movementKeys = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyE"]);
  function keyDown(event: KeyboardEvent) {
    if (!ready || !movementKeys.has(event.code) || event.altKey || event.ctrlKey || event.metaKey || blocked()) return;
    event.preventDefault();
    keys.add(event.code);
    if (event.code === "KeyE" && !event.repeat) interactPressed = true;
  }
  function keyUp(event: KeyboardEvent) { keys.delete(event.code); }
  function loseFocus() { keys.clear(); interactPressed = false; cancelWalk(); lastTime = 0; }
  function visibilityChanged() { if (document.hidden) loseFocus(); else lastTime = 0; }
  function motionChanged() { reducedMotion = motionQuery.matches; }

  async function initialize() {
    const playerId = characterId(initial.playerImage.match(/(?:^|\/)([mf][1-4])(?:\.|\/|$)/)?.[1] ?? "m1");
    const ids = new Set<CharacterId>([playerId]);
    initial.markers.filter((marker) => marker.kind === "npc").forEach((marker) => ids.add(npcCharacterId(marker.id)));
    // Sheets that walk in four directions: the hero's, rigged NPCs', and wandering NPCs' bodies.
    const walkers = new Set<string>(initial.markers.filter((marker) => marker.kind === "npc" && marker.wander).map((marker) => npcCharacterId(marker.id)));
    initial.bystanders?.forEach((actor) => ids.add(characterId(actor.characterId)));
    const placedUrls = [...new Set(placed.map((item) => item.image))];
    const [landscape, atlasEntries, propImages, placedImages] = await Promise.all([
      loadImage(initial.ground?.image ?? initial.image),
      // Only the controlled hero walks north/south. Stationary NPCs sharing a
      // hero costume need its base poses, not the large direction supplement.
      // Rigged NPCs walk in every direction, so they load it too.
      Promise.all([...ids].map(async (id) => [id, await loadAtlas(id, id === playerId || hasAnimatedSheet(id) || walkers.has(id))] as const)),
      Promise.all((initial.props ?? []).map(async (prop) => [prop.id, await loadImage(prop.image)] as const)),
      // A placed object whose image fails is skipped (its footprint still blocks).
      Promise.all(placedUrls.map(async (url) => [url, await loadImage(url).catch((error: unknown) => {
        console.warn("[world] placed object image failed:", url, error);
        return null;
      })] as const)),
    ]);
    if (disposed || failed || !scene) return;
    const atlases = new Map(atlasEntries);
    // Unique NPC sprites: one native-pixel pose drawn into an 80 px frame so
    // the figure height matches the archetype sheets at size UNIQUE_NPC_SIZE.
    const uniqueAtlases = new Map<string, Atlas>();
    await Promise.all(initial.markers.filter((marker) => marker.kind === "npc" && marker.sprite).map(async (marker) => {
      try {
        const source = await loadImage(marker.sprite!);
        const canvas = drawCanvas(UNIQUE_FRAME, UNIQUE_FRAME, (context) => {
          const scale = Math.min(1, (UNIQUE_FRAME - 2) / source.width, (UNIQUE_FEET - 1) / source.height);
          const width = Math.round(source.width * scale), height = Math.round(source.height * scale);
          context.drawImage(source, Math.round((UNIQUE_FRAME - width) / 2), UNIQUE_FEET - height, width, height);
        });
        uniqueAtlases.set(marker.id, { image: canvas, frameSize: UNIQUE_FRAME, feetY: UNIQUE_FEET });
      } catch { /* keep the archetype sheet for this NPC */ }
    }));
    if (disposed || failed || !scene) return;
    const ground = initial.ground;
    const backgroundCanvas = drawCanvas(WIDTH, HEIGHT, (context) => {
      if (ground) {
        // A replaced painting: the ground tile repeated over the map at its map size.
        context.imageSmoothingEnabled = false;
        const size = Math.max(4, ground.size);
        for (let y = 0; y < HEIGHT; y += size) for (let x = 0; x < WIDTH; x += size) context.drawImage(landscape, x, y, size, size);
        return;
      }
      if (initial.mirrorImage) { context.translate(WIDTH, 0); context.scale(-1, 1); }
      context.drawImage(landscape, 0, 0, WIDTH, HEIGHT);
      if (initial.imageGrade) {
        const pixels = context.getImageData(0, 0, WIDTH, HEIGHT);
        gradePixels(pixels.data, initial.imageGrade);
        context.putImageData(pixels, 0, 0);
      }
    });
    image(texture(backgroundCanvas, "map"), -1).setOrigin(0, 0);

    for (const foreground of worldForeground(initial.key, initial.image)) {
      const points = foreground.contours.flat();
      const left = Math.floor(Math.min(...points.map((point) => point[0])));
      const top = Math.floor(Math.min(...points.map((point) => point[1])));
      const width = Math.ceil(Math.max(...points.map((point) => point[0]))) - left;
      const height = Math.ceil(Math.max(...points.map((point) => point[1]))) - top;
      const cutout = drawCanvas(width, height, (context) => {
        context.beginPath();
        foreground.contours.forEach((contour) => {
          contour.forEach(([x, y], index) => {
            if (!index) context.moveTo(x - left, y - top); else context.lineTo(x - left, y - top);
          });
          context.closePath();
        });
        context.clip();
        context.drawImage(backgroundCanvas, -left, -top);
      });
      image(texture(cutout, "occluder"), 100 + foreground.depth * 10).setOrigin(0, 0).setPosition(left, top);
    }

    drawPlacements(new Map(placedImages));

    const shadowKey = shadowTexture = texture(drawCanvas(64, 24, (context) => {
      context.fillStyle = "rgba(29, 28, 15, 0.38)";
      context.beginPath(); context.ellipse(32, 12, 24, 7, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = "rgba(22, 23, 15, 0.22)";
      context.beginPath(); context.ellipse(32, 12, 17, 4, 0, 0, Math.PI * 2); context.fill();
    }), "shadow");
    const npcRing = texture(groundRing("rgba(224, 196, 129, 0.72)"), "ring");
    for (const prop of initial.props ?? []) {
      const source = propImages.find(([id]) => id === prop.id)![1];
      const key = texture(drawCanvas(128, 112, (context) => context.drawImage(source, 0, 0, 128, 112)), "prop");
      const point = toWorld(prop);
      const visual = image(key, 100 + point.y * 10, prop.width, prop.height).setOrigin(0.5, 0.95).setPosition(point.x, point.y);
      visual.setVisible(prop.visible !== false);
      props.set(prop.id, visual);
    }
    for (const bystander of initial.bystanders ?? []) {
      const point = toWorld(bystander);
      const shadow = image(shadowKey, 1, 27, 10).setPosition(point.x, point.y);
      const id = characterId(bystander.characterId);
      const character = makeCharacter(`char:${id}`, atlases.get(id)!, bystander.size ?? 51);
      character.image.setPosition(point.x, point.y).setDepth(100 + point.y * 10);
      shadow.setVisible(bystander.visible !== false);
      character.image.setVisible(bystander.visible !== false);
      bystanders.set(bystander.id, { shadow, character });
    }
    const exitBadge = texture(markerBadge("exit"), "badge");
    const questMarks = { "!": texture(questMarkCanvas("!"), "quest"), "?": texture(questMarkCanvas("?"), "quest") };
    initial.markers.forEach((marker, index) => {
      const point = toWorld(marker);
      const halo = image(npcRing, 2, 42, 16).setPosition(point.x, point.y).setVisible(false);
      let character: CharacterVisual | undefined;
      let shadow: Phaser.GameObjects.Image | undefined;
      let markerIcon: Phaser.GameObjects.Image | undefined;
      if (marker.kind === "npc") {
        shadow = image(shadowKey, 1, 28, 10).setPosition(point.x, point.y);
        const unique = uniqueAtlases.get(marker.id);
        const id = npcCharacterId(marker.id);
        character = unique ? makeCharacter(`unique:${marker.id}`, unique, UNIQUE_NPC_SIZE) : makeCharacter(`char:${id}`, atlases.get(id)!, 54);
        character.image.setPosition(point.x, point.y).setDepth(100 + point.y * 10);
        if (!unique && (hasAnimatedSheet(id) || marker.wander) && character.directional) wanderers.set(marker.id, createWanderer(marker.id, point));
      } else {
        const key = marker.kind === "exit" ? exitBadge : texture(markerBadge(marker.kind, marker.badge ?? marker.icon), "badge");
        markerIcon = image(key, 8000, 24, 27).setOrigin(0.5, 1).setPosition(point.x, point.y - 5);
      }
      const label = makeLabel(marker.label);
      label.image.setVisible(false);
      let nameTag: TextSprite | undefined;
      let questMark: Phaser.GameObjects.Image | undefined;
      if (character) {
        nameTag = makeNameTag(marker.label);
        questMark = image(questMarks[marker.quest === "turnin" ? "?" : "!"], 9_011).setOrigin(0.5, 1).setVisible(false);
      }
      markers.set(marker.id, { point, halo, shadow, label, labelText: marker.label, nameTag, questMark, icon: markerIcon, character, opacity: 1, phase: index * 0.47 });
    });
    markerQuestMarks = questMarks;
    const guideKey = texture(guideArrowCanvas(), "guide");
    guideArrow = image(guideKey, 9_012).setOrigin(0.5, 1).setVisible(false);
    guideEdge = image(guideKey, 12_000).setOrigin(0.5, 0.5).setVisible(false);

    const playerShadow = image(shadowKey, 1, 30, 11);
    const playerRing = image(texture(groundRing("rgba(225, 199, 139, 0.55)"), "ring"), 2, 28, 10);
    player = makeCharacter(`char:${playerId}`, atlases.get(playerId)!, PLAYER_SIZE);
    playerFigure = atlases.get(playerId)!.figure ?? playerFigure;
    const playerSign = image(texture(drawCanvas(9, 7, (context) => {
      context.fillStyle = "#172b26"; context.fillRect(0, 0, 9, 3); context.fillRect(2, 3, 5, 2); context.fillRect(4, 5, 1, 2);
      context.fillStyle = "#fff0bd"; context.fillRect(1, 1, 7, 1); context.fillRect(2, 2, 5, 1); context.fillRect(3, 3, 3, 1); context.fillRect(4, 4, 1, 1);
    }), "sign"), 10_001, 7, 5);
    actor = { shadow: playerShadow, ring: playerRing, sign: playerSign };
    targetRing = image(texture(groundRing("#f4d690"), "ring"), 3, 26, 12).setVisible(false);

    lighting.update(read().time ?? 0, 0, reducedMotion);
    const veilTexture = canvasTexture(scene, "veil", lighting.canvas);
    veil = { image: image("veil", 8900).setOrigin(0, 0).setAlpha(lighting.opacity), texture: veilTexture };

    const mote = texture(drawCanvas(4, 4, (context) => { context.fillStyle = "#f5e0ab"; context.fillRect(1, 0, 2, 4); }), "mote");
    for (let index = 0; index < 20; index++) {
      const item = image(mote, 9000, index % 3 ? 2 : 3, index % 3 ? 2 : 4).setAlpha(0.16).setVisible(!reducedMotion);
      particles.push({ image: item, x: (index * 137 + 37) % WIDTH, y: (index * 73 + 67) % HEIGHT });
    }
    ready = true;
    resize();
    updatePresentation(0, false);
    reportPosition();
    onReady();
  }

  /** Draw the placed objects: anchor at (x, y), sized, mirrored, by layer depth (lib/assets/placement-geometry.ts). */
  function drawPlacements(images: Map<string, HTMLImageElement | null>) {
    for (const geometry of placed) {
      const source = images.get(geometry.image);
      if (!source) continue;
      const key = `placement:${geometry.image}`;
      if (!scene!.textures.exists(key)) scene!.textures.addImage(key, source);
      // Phaser mirrors a flipped frame in place, so the origin mirrors too: the anchor stays on (x, y).
      const visual = scene!.add.image(geometry.x, geometry.y, key)
        .setOrigin(geometry.flip ? 1 - geometry.originX : geometry.originX, geometry.originY)
        .setDisplaySize(geometry.width, geometry.height).setFlipX(geometry.flip).setDepth(geometry.depth);
      placedVisuals.push({ geometry, image: visual, alpha: 1 });
    }
    parent.dataset.placements = String(placedVisuals.length);
    parent.dataset.placementIds = placedVisuals.map((visual) => visual.geometry.id).join(" ");
  }
  /**
   * An overhead object over the hero, or a standing object the hero walks
   * behind (their body inside its picture, their feet above its base),
   * fades so the hero stays visible.
   */
  function updatePlacementFade(dt: number) {
    for (const visual of placedVisuals) {
      const { box, layer, y } = visual.geometry;
      if (layer === "ground") continue;
      const body = { x: position.x, y: position.y - 26 };
      const covers = body.x > box.left + 4 && body.x < box.right - 4 && body.y > box.top + 4 && body.y < box.bottom &&
        (layer === "overhead" || position.y < y);
      const target = covers ? 0.45 : 1;
      if (visual.alpha === target) continue;
      const step = reducedMotion || !dt ? 1 : Math.min(1, dt * 6);
      visual.alpha = Math.abs(target - visual.alpha) < 0.02 ? target : visual.alpha + (target - visual.alpha) * step;
      visual.image.setAlpha(visual.alpha);
    }
  }
  function reportPosition() {
    const screen = toScreen(position);
    parent.dataset.playerScreenX = String(screen.x);
    parent.dataset.playerScreenY = String(screen.y);
    parent.dataset.playerScreenHeight = String(56 * viewScale);
    const nearbyBounds: { left: number; top: number; width: number; height: number }[] = [];
    for (const marker of read().markers) {
      const point = markerPoint(marker);
      if (Math.hypot(position.x - point.x, position.y - point.y) > 105) continue;
      const visual = markers.get(marker.id);
      if (!visual) continue;
      const { x, y } = toScreen(point);
      const height = 54 * viewScale;
      if (visual.character) nearbyBounds.push({ left: x - height * 0.42 - 8,
        top: y - height - 8, width: height * 0.84 + 16, height: height + 16 });
      if (visual.label.image.visible) {
        const label = visual.label.image;
        const box = toScreen({ x: label.x, y: label.y });
        const width = label.displayWidth * viewScale;
        const labelHeight = label.displayHeight * viewScale;
        nearbyBounds.push({ left: box.x - width / 2 - 4, top: box.y - labelHeight - 4, width: width + 8, height: labelHeight + 8 });
      }
    }
    parent.dataset.nearbyScreenBounds = JSON.stringify(nearbyBounds);
    parent.dataset.wanderingNpcs = JSON.stringify(Object.fromEntries([...wanderers].map(([id, w]) => [id, [Math.round(w.pos.x), Math.round(w.pos.y)]])));
    parent.dataset.playerX = position.x.toFixed(1);
    parent.dataset.playerY = position.y.toFixed(1);
    parent.dataset.playerMotion = playerMotion;
    parent.dataset.playerFrame = String(player?.frame ?? 0);
    parent.dataset.playerFacing = playerFacing;
  }
  // ── Roaming foes ─────────────────────────────────────────────────────
  // Foes come and go without rebuilding the map: each frame the visuals are
  // synced to `read().foes`. They stand at their spot, turn to watch the hero
  // and, when the hero walks into one, call its `onEngage` (the encounter).
  interface FoeVisual {
    body: Phaser.GameObjects.Image;
    character?: CharacterVisual;
    /** An animated sheet (bosses, T5): its texture's frames per row and the frame on show. */
    anim?: { sheet: AnimSheet; columns: number; frame: number; top: number };
    /** A legendary beast's glow on the ground under it. */
    aura?: Phaser.GameObjects.Image;
    shadow: Phaser.GameObjects.Image;
    tag: TextSprite;
    /** How close the hero must come to engage it (bigger for big beasts). */
    touch: number;
    boss: boolean;
    phase: number;
    engaged: boolean;
  }
  const foeVisuals = new Map<string, FoeVisual>();
  const foeLoading = new Set<string>();
  // A beast is cropped to its painted pixels (so its name tag sits just above
  // it), keeping its atlas cell's scale (so a hare stays smaller than a bear).
  const creatureFrames = new Map<number, Promise<{ key: string; cellHeight: number }>>();
  let creatureSheet: Promise<HTMLImageElement> | null = null;
  function creatureFrameTexture(frame: number): Promise<{ key: string; cellHeight: number }> {
    let pending = creatureFrames.get(frame);
    if (!pending) {
      creatureSheet ??= loadImage(CREATURE_ATLAS.url);
      pending = creatureSheet.then((sheet) => {
        const { left, top, width: w, height: h } = creatureCell(sheet.width, sheet.height, frame);
        const cell = drawCanvas(w, h, (context) => context.drawImage(sheet, left, top, w, h, 0, 0, w, h));
        const pixels = cell.getContext("2d")!.getImageData(0, 0, w, h).data;
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (pixels[(y * w + x) * 4 + 3] < 32) continue;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 < 0) return { key: texture(cell, "foe"), cellHeight: h };
        const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
        return { key: texture(drawCanvas(cw, ch, (context) => context.drawImage(cell, x0, y0, cw, ch, 0, 0, cw, ch)), "foe"), cellHeight: h };
      });
      creatureFrames.set(frame, pending);
    }
    return pending;
  }
  /** One texture per animated sheet, cut into its frames (row-major). */
  const animTextures = new Map<string, Promise<{ key: string; columns: number; top: number }>>();
  function animTexture(sheet: AnimSheet): Promise<{ key: string; columns: number; top: number }> {
    let pending = animTextures.get(sheet.id);
    if (!pending) {
      pending = loadImage(sheet.url).then((source) => {
        const key = `anim:${sheet.id}`;
        const columns = Math.max(1, Math.floor(source.width / sheet.frameW));
        if (!scene!.textures.exists(key)) {
          const canvas = drawCanvas(source.width, source.height, (context) => context.drawImage(source, 0, 0));
          addGridFrames(canvasTexture(scene!, key, canvas), sheet.frameW, columns, Math.max(1, Math.floor(source.height / sheet.frameH)), sheet.frameH);
        }
        return { key, columns, top: animVisibleTop(source, sheet) };
      });
      pending.catch(() => animTextures.delete(sheet.id));
      animTextures.set(sheet.id, pending);
    }
    return pending;
  }
  function bossAuraCanvas(): HTMLCanvasElement {
    return drawCanvas(128, 44, (context) => {
      const glow = context.createRadialGradient(64, 64, 4, 64, 64, 64);
      glow.addColorStop(0, "rgba(255, 210, 110, 0.95)");
      glow.addColorStop(0.5, "rgba(226, 92, 40, 0.6)");
      glow.addColorStop(1, "rgba(120, 20, 10, 0)");
      context.save();
      context.scale(1, 44 / 128);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(64, 64, 64, 0, Math.PI * 2);
      context.fill();
      context.restore();
      // A gold ring marks the lair's ground.
      context.strokeStyle = "rgba(255, 214, 120, 0.85)";
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(64, 22, 52, 15, 0, 0, Math.PI * 2);
      context.stroke();
    });
  }
  /** A legendary beast's name plate: gold on lacquer, a little larger than a foe's tag. */
  function makeBossTag(text: string): TextSprite {
    const label = `◆ ${text} ◆`;
    const width = Math.ceil(measure(label, "700 ") * 15 / 13) + 20;
    return textSprite(width, 26, (context) => {
      context.fillStyle = "rgba(48, 8, 6, 0.92)";
      context.fillRect(0, 1, width, 24);
      context.strokeStyle = "rgba(240, 196, 98, 0.95)";
      context.lineWidth = 1.5;
      context.strokeRect(1, 2, width - 2, 22);
      context.font = `700 15px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffd77a";
      context.fillText(label, width / 2, 13.5);
    }, 9_030);
  }
  function makeFoeTag(text: string): TextSprite {
    const label = `⚔ ${text}`;
    const width = Math.ceil(measure(label, "600 ")) + 14;
    return textSprite(width, 22, (context) => {
      context.fillStyle = "rgba(70, 12, 10, 0.88)";
      context.fillRect(0, 1, width, 20);
      context.font = `600 13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffd9cf";
      context.fillText(label, width / 2, 11);
    }, 9_020);
  }
  async function addFoe(foe: WorldFoe) {
    foeLoading.add(foe.id);
    try {
      const size = 54 * (foe.look.size ?? 1);
      let body: Phaser.GameObjects.Image;
      let character: CharacterVisual | undefined;
      let anim: FoeVisual["anim"];
      const sheet = foe.look.kind === "anim" ? getAnimSheet(foe.look.sheet) : null;
      if (sheet) {
        // Bosses and T5: the sheet's idle clip, `scale × size` figures tall, feet on the spot.
        const { key, columns, top } = await animTexture(sheet);
        if (disposed || !scene) return;
        const figure = FOE_FIGURE * animScaleOf(sheet, foe.look.size);
        const height = figure / Math.max(0.4, sheet.feetY);
        const first = sheet.clips.idle.row * columns;
        body = scene.add.image(0, 0, key, first).setDepth(100).setOrigin(0.5, sheet.feetY)
          .setDisplaySize(height * sheet.frameW / sheet.frameH, height);
        anim = { sheet, columns, frame: first, top };
      } else if (foe.look.kind === "creature" || foe.look.kind === "anim") {
        // (An anim look whose sheet is unknown stands as a beast.)
        const { key, cellHeight } = await creatureFrameTexture(foe.look.kind === "creature" ? foe.look.frame : 0);
        if (disposed || !scene) return;
        body = image(key, 100).setOrigin(0.5, 1);
        const source = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
        const scale = size * 1.25 / cellHeight;
        body.setDisplaySize(source.width * scale, source.height * scale);
      } else {
        const atlas = await loadAtlas(characterId(foe.look.characterId), false);
        if (disposed || !scene) return;
        character = makeCharacter(`char:${foe.look.characterId}`, atlas, size);
        body = character.image;
      }
      if (foe.look.tint !== undefined) body.setTint(foe.look.tint);
      const boss = !!foe.boss;
      // A big beast's shadow, aura and reach grow with its painted width.
      const reach = anim ? Math.max(1, body.displayWidth / 64) : 1;
      const shadow = image(shadowTexture, 1, 30 * reach, 11 * Math.sqrt(reach));
      const aura = boss ? image(texture(bossAuraCanvas(), "aura"), 1.5, Math.max(60, body.displayWidth * 1.05), Math.max(22, body.displayWidth * 0.36)) : undefined;
      const tag = boss ? makeBossTag(foe.name) : makeFoeTag(foe.name);
      tag.image.setDisplaySize(tag.width / viewScale, tag.height / viewScale);
      const touch = anim ? Math.max(FOE_TOUCH, body.displayWidth * 0.34) : FOE_TOUCH;
      foeVisuals.set(foe.id, { body, character, anim, aura, shadow, tag, touch, boss, phase: Math.random() * 6, engaged: false });
    } catch (error) {
      console.warn("[world] foe could not be drawn:", error);
    } finally {
      foeLoading.delete(foe.id);
    }
  }
  function removeFoe(id: string) {
    const visual = foeVisuals.get(id);
    if (!visual) return;
    visual.body.destroy(); visual.shadow.destroy(); visual.tag.image.destroy(); visual.aura?.destroy();
    foeVisuals.delete(id);
  }
  function updateFoes(paused: boolean) {
    const foes = read().foes ?? [];
    const ids = new Set(foes.map((foe) => foe.id));
    for (const id of [...foeVisuals.keys()]) if (!ids.has(id)) removeFoe(id);
    for (const foe of foes) {
      if (!foeVisuals.has(foe.id) && !foeLoading.has(foe.id)) void addFoe(foe);
      const visual = foeVisuals.get(foe.id);
      if (!visual) continue;
      const point = toWorld(foe);
      const facingLeft = position.x < point.x;
      if (visual.anim) {
        // An animated sheet plays its idle loop in place (a boss never drifts from its lair), turned to watch the hero.
        const { sheet, columns } = visual.anim;
        const frame = animFrame(sheet.clips.idle, columns, reducedMotion ? 0 : (animationTime + visual.phase) * 1000, true);
        if (frame !== visual.anim.frame) { visual.body.setFrame(frame, false, false); visual.anim.frame = frame; }
        visual.body.setFlipX(sheet.facing === "right" ? facingLeft : !facingLeft).setPosition(point.x, point.y);
        if (visual.aura) {
          const pulse = reducedMotion ? 0.75 : 0.62 + 0.25 * Math.sin((animationTime + visual.phase) * 2.1);
          visual.aura.setPosition(point.x, point.y).setAlpha(pulse);
        }
      } else if (visual.character) {
        const idle = CHARACTER_CLIPS.idle;
        const frame = reducedMotion ? idle.frames[0] : idle.frames[Math.floor((animationTime + visual.phase) * idle.fps) % idle.frames.length];
        setCharacterFrame(visual.character, frame, facingLeft);
        visual.body.setPosition(point.x, point.y);
      } else {
        // Beasts breathe and shift their weight.
        const bob = reducedMotion ? 0 : Math.sin((animationTime + visual.phase) * 3.2) * 1.5;
        visual.body.setFlipX(!facingLeft).setPosition(point.x, point.y - Math.max(0, bob));
      }
      visual.body.setDepth(100 + point.y * 10);
      visual.shadow.setPosition(point.x, point.y);
      const top = visual.anim ? visual.body.displayHeight * Math.max(0.25, visual.anim.sheet.feetY - visual.anim.top) : visual.body.displayHeight * 0.92;
      visual.tag.image.setDisplaySize(visual.tag.width / viewScale, visual.tag.height / viewScale)
        .setPosition(point.x, point.y - top - 2);
      // Walking into the foe starts the encounter (once).
      if (!paused && !visual.engaged && Math.hypot(position.x - point.x, position.y - point.y) < visual.touch) {
        visual.engaged = true;
        cancelWalk();
        foe.onEngage();
      }
    }
    parent.dataset.foes = String(foeVisuals.size);
    parent.dataset.foeIds = [...foeVisuals.keys()].join(" ");
    // Tests: each drawn foe's look kind ("anim" for bosses / T5) and the legendary beasts among them.
    parent.dataset.foeLooks = JSON.stringify(Object.fromEntries(foes.filter((foe) => foeVisuals.has(foe.id))
      .map((foe) => [foe.id, foeVisuals.get(foe.id)!.anim ? "anim" : foe.look.kind])));
    parent.dataset.bossFoes = foes.filter((foe) => foe.boss && foeVisuals.has(foe.id)).map((foe) => foe.id).join(" ");
    parent.dataset.foesAt = JSON.stringify(foes.filter((foe) => foeVisuals.has(foe.id)).map((foe) => {
      const p = toWorld(foe);
      return [Math.round(p.x), Math.round(p.y)];
    }));
  }
  // ── Other players (online, docs/online.md) ───────────────────────────
  // Synced to `read().online.players()` every frame, like the foes. Each walks
  // smoothly toward the last position the server sent (moves arrive ~10×/s)
  // on the painted eight-way walk sheet of their body.
  interface RemoteVisual {
    character: CharacterVisual;
    shadow: Phaser.GameObjects.Image;
    tag: TextSprite;
    pos: Point;
    phase: number;
  }
  const remoteVisuals = new Map<string, RemoteVisual>();
  const remoteLoading = new Set<string>();
  /** Gold name tags tell players from NPCs (green). */
  const PLAYER_TAG_COLOR = "#f6d77a";
  async function addRemote(remote: RemotePlayer) {
    remoteLoading.add(remote.id);
    try {
      const id = characterId(remote.body === "f1" ? "f1" : "m1");
      const atlas = await loadAtlas(id, true);
      if (disposed || failed || !scene || remoteVisuals.has(remote.id)) return;
      const character = makeCharacter(`char:${id}`, atlas, PLAYER_SIZE);
      const shadow = image(shadowTexture, 1, 30, 11);
      const tag = makeNameTag(remote.name, PLAYER_TAG_COLOR);
      remoteVisuals.set(remote.id, { character, shadow, tag, pos: { x: remote.x, y: remote.y }, phase: Math.random() });
    } catch (error) {
      console.warn("[world] could not draw another player:", remote.id, error);
    } finally {
      remoteLoading.delete(remote.id);
    }
  }
  function removeRemote(id: string) {
    const visual = remoteVisuals.get(id);
    if (!visual) return;
    visual.character.image.destroy(); visual.shadow.destroy(); visual.tag.image.destroy();
    remoteVisuals.delete(id);
  }
  function updateRemotes(dt: number) {
    const others = read().online?.players() ?? [];
    const ids = new Set(others.map((remote) => remote.id));
    for (const id of [...remoteVisuals.keys()]) if (!ids.has(id)) removeRemote(id);
    for (const remote of others) {
      if (!remoteVisuals.has(remote.id) && !remoteLoading.has(remote.id)) void addRemote(remote);
      const visual = remoteVisuals.get(remote.id);
      if (!visual) continue;
      const gap = Math.hypot(remote.x - visual.pos.x, remote.y - visual.pos.y);
      if (gap > 160 || reducedMotion) visual.pos = { x: remote.x, y: remote.y };
      else if (gap > 0.1) {
        // Catch up with the latest position over ~100 ms (one move interval).
        const pull = Math.min(1, dt * 10);
        visual.pos = { x: visual.pos.x + (remote.x - visual.pos.x) * pull, y: visual.pos.y + (remote.y - visual.pos.y) * pull };
      }
      const walking = remote.moving || gap > 2;
      const step = walking && !reducedMotion ? Math.floor((animationTime + visual.phase) * WALK8_FPS) % 4 : null;
      const pose = walk8Frame(remote.dir, step);
      setCharacterFrame(visual.character, pose.frame, pose.mirror);
      const { x, y } = visual.pos;
      visual.character.image.setPosition(x, y).setDepth(characterDepth(y));
      visual.shadow.setPosition(x, y);
      visual.tag.image.setDisplaySize(visual.tag.width / viewScale, visual.tag.height / viewScale).setPosition(x, y - PLAYER_SIZE - 2);
    }
    parent.dataset.remotePlayers = JSON.stringify([...remoteVisuals].map(([id, visual]) => [id, Math.round(visual.pos.x), Math.round(visual.pos.y)]));
  }

  /** The spot of the frontmost roaming foe whose sprite covers `point`, or null. */
  function foeAt(point: Point): Point | null {
    let best: Point | null = null;
    for (const foe of read().foes ?? []) {
      const visual = foeVisuals.get(foe.id);
      if (!visual) continue;
      const at = toWorld(foe);
      const width = Math.max(28, visual.body.displayWidth * 0.6);
      const height = visual.body.displayHeight * (visual.anim ? Math.max(0.25, visual.anim.sheet.feetY - visual.anim.top) : 0.95);
      if (Math.abs(point.x - at.x) > width / 2 || point.y > at.y + 8 || point.y < at.y - height) continue;
      if (!best || at.y > best.y) best = at;
    }
    return best;
  }
  /** A free, reachable spot for a foe: not under the hero's feet, nor on a marker or another foe. */
  function pickFoeSpot(): Point | null {
    const markers = read().markers.map((marker) => markerPoint(marker));
    const others = (read().foes ?? []).map((foe) => toWorld(foe));
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 170;
      const spot = { x: position.x + Math.cos(angle) * distance, y: position.y + Math.sin(angle) * distance * 0.75 };
      if (spot.x < 50 || spot.x > WIDTH - 50 || spot.y < 70 || spot.y > HEIGHT - 40) continue;
      if (worldPointBlocked(spot, footprints)) continue;
      if ([...markers, ...others].some((p) => Math.hypot(p.x - spot.x, p.y - spot.y) < 70)) continue;
      const path = planWorldPath(position, spot, footprints);
      const end = path[path.length - 1];
      if (!end || Math.hypot(end.x - spot.x, end.y - spot.y) > 4) continue;
      return toPercent(spot);
    }
    return null;
  }

  /** The texture key of a work-loop sheet, or null while it loads (or if it failed). */
  function heroActionSheet(strip: HeroPoseStrip): string | null {
    if (actionSheets.has(strip.url)) return actionSheets.get(strip.url) ?? null;
    actionSheets.set(strip.url, null);
    const source = new Image();
    source.onload = () => {
      if (disposed || !scene) return;
      const key = `hero-action:${strip.url}`;
      const sheet = scene.textures.exists(key) ? scene.textures.get(key) : scene.textures.addImage(key, source);
      if (!sheet) return;
      addGridFrames(sheet, strip.width, strip.columns, Math.round(source.height / strip.height), strip.height);
      actionSheets.set(strip.url, key);
    };
    source.src = strip.url;
    return null;
  }
  /**
   * While the hero works (gathering, crafting, practice, rest), they play the
   * painted loop on the spot instead of standing: same feet, same size, facing
   * the way they last walked. It runs on the clock, since the map is paused then.
   */
  function updateHeroAction() {
    if (!player) return;
    const strip = read().heroAction;
    const key = strip ? heroActionSheet(strip) : null;
    if (!strip || !key) {
      actionImage?.setVisible(false);
      player.image.setVisible(true);
      parent.dataset.playerAction = "";
      return;
    }
    actionImage ??= scene!.add.image(0, 0, key, 0);
    if (actionImage.texture.key !== key) actionImage.setTexture(key, 0);
    const step = reducedMotion ? 0 : Math.floor(performance.now() * strip.fps / 1000) % strip.frames;
    // Display px per sheet px: the loop's standing figure as tall as the walking one.
    const unit = PLAYER_SIZE / CHARACTER_FRAME_SIZE * playerFigure / strip.figure;
    const west = playerDir === "W" || playerDir === "SW" || playerDir === "NW";
    actionImage.setFrame(strip.row * strip.columns + step, false, false)
      .setOrigin(west ? 1 - strip.anchor / strip.width : strip.anchor / strip.width, strip.feet / strip.height)
      .setDisplaySize(strip.width * unit, strip.height * unit).setFlipX(west)
      .setPosition(position.x, position.y).setDepth(player.image.depth).setVisible(true);
    player.image.setVisible(false);
    parent.dataset.playerAction = `${strip.row}:${step}`;
  }

  function updatePresentation(dt: number, moving: boolean) {
    if (!actor || !player) return;
    actor.shadow.setPosition(position.x, position.y);
    actor.ring.setPosition(position.x, position.y);
    actor.sign.setPosition(position.x, position.y - 57);
    player.image.setPosition(position.x, position.y).setDepth(heroDepth(position.y));
    const nextMotion = moving ? "walk" : "idle";
    if (playerMotion !== nextMotion) { playerMotion = nextMotion; motionTime = 0; }
    let frame: number;
    if (player.frames >= WALK8_FIRST_FRAME + WALK8_FRAMES) {
      // Painted eight-way walk: the hero always faces the way they move; standing keeps the last heading.
      const step = moving && !reducedMotion ? Math.floor(motionTime * WALK8_FPS) % 4 : null;
      const pose = walk8Frame(playerDir, step);
      frame = pose.frame;
      setCharacterFrame(player, frame, pose.mirror);
      // Standing still, the painted pose breathes: a slow 1 % rise from the feet.
      playerBaseScaleY ??= player.image.scaleY;
      player.image.scaleY = playerBaseScaleY * (step === null && !reducedMotion ? 1 + 0.01 * Math.sin(animationTime * 2.2) : 1);
    } else {
      const vertical = player.directional && (playerFacing === "north" || playerFacing === "south");
      const clip = vertical ? CHARACTER_CLIPS[playerFacing === "north" ? "walkNorth" : "walkSouth"] : CHARACTER_CLIPS[playerMotion];
      frame = clip.frames[!moving && (reducedMotion || vertical) ? 0 : Math.floor(motionTime * clip.fps) % clip.frames.length];
      setCharacterFrame(player, frame, playerFacing === "west");
    }
    updateHeroAction();
    parent.dataset.playerDir = playerDir;
    parent.dataset.playerMotion = playerMotion;
    parent.dataset.playerFrame = String(frame);
    parent.dataset.playerFacing = playerFacing;
    const presentation = read();
    for (const prop of presentation.props ?? []) props.get(prop.id)?.setVisible(prop.visible !== false);
    for (const [index, bystander] of (presentation.bystanders ?? []).entries()) {
      const visual = bystanders.get(bystander.id);
      if (!visual) continue;
      visual.shadow.setVisible(bystander.visible !== false);
      visual.character.image.setVisible(bystander.visible !== false);
      const idle = CHARACTER_CLIPS.idle;
      const idleFrame = idle.frames[reducedMotion ? 0 : Math.floor((animationTime + index * 0.37) * idle.fps) % idle.frames.length];
      setCharacterFrame(visual.character, idleFrame, !!bystander.facingLeft);
    }
    parent.dataset.visibleProps = (presentation.props ?? []).filter(prop => prop.visible !== false).map(prop => prop.id).join(",");
    const currentMarkers = presentation.markers;
    let nearest: string | null = null;
    let nearestDistance = 105;
    for (const marker of currentMarkers) {
      const point = markerPoint(marker);
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      if (distance < nearestDistance) { nearest = marker.id; nearestDistance = distance; }
    }
    const lastMarker = currentMarkers.find((marker) => marker.id === lastInteraction);
    if (!lastMarker || Math.hypot(position.x - markerPoint(lastMarker).x, position.y - markerPoint(lastMarker).y) > 90) lastInteraction = null;
    const focusedMarker = hovered ?? interaction ?? lastInteraction ?? nearest;
    // The action button offers whatever the hero is standing next to.
    const reachable = nearestDistance <= 95 ? nearest : null;
    if (reachable !== nearbyReported) {
      nearbyReported = reachable;
      parent.dataset.nearbyMarker = reachable ?? "";
      onNearby?.(reachable);
    }
    const center = cameraCenter();
    const viewLeft = center.x - viewWidth / 2, viewRight = center.x + viewWidth / 2;
    for (const marker of currentMarkers) {
      const visual = markers.get(marker.id);
      if (!visual) continue;
      const wanderer = wanderers.get(marker.id);
      if (wanderer) {
        const frozen = dt === 0 || reducedMotion || !!presentation.readOnly || marker.id === interaction || marker.id === hovered ||
          Math.hypot(position.x - wanderer.pos.x, position.y - wanderer.pos.y) < WANDER_FREEZE_DISTANCE;
        stepWanderer(wanderer, dt, frozen, (spot) => spot.x > 16 && spot.x < WIDTH - 16 && spot.y > 40 && spot.y < HEIGHT - 12 &&
          !worldPointBlocked(spot, footprints) && Math.hypot(spot.x - position.x, spot.y - position.y) > 36);
      }
      const point = markerPoint(marker);
      visual.point = point;
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      const selected = hovered === marker.id || interaction === marker.id;
      visual.halo.setPosition(point.x, point.y);
      visual.shadow?.setPosition(point.x, point.y);
      // Service and exit badges keep a fixed on-screen size whatever the zoom.
      visual.icon?.setDisplaySize(34 / viewScale, 38 / viewScale).setPosition(point.x, point.y - 5);
      if (visual.labelText !== marker.label) {
        const old = visual.label.image;
        const oldKey = old.texture.key;
        visual.label = makeLabel(marker.label);
        old.destroy();
        scene?.textures.remove(oldKey);
        visual.labelText = marker.label;
      }
      const label = visual.label;
      const labelScale = Math.min(1, (parent.clientWidth - 24) / label.width) / viewScale;
      const labelWidth = label.width * labelScale, labelHeight = label.height * labelScale;
      label.image.setDisplaySize(labelWidth, labelHeight);
      label.image.setVisible(marker.id === focusedMarker);
      let lift = visual.character ? 58 : 33;
      // A nearby sign's caption stays above the hero instead of crossing their torso.
      if (Math.abs(position.x - point.x) < labelWidth / 2 + 20 && distance < 90) lift = Math.max(lift, point.y - position.y + 60);
      label.image.setPosition(clamp(point.x, viewLeft + labelWidth / 2 + 6, viewRight - labelWidth / 2 - 6), point.y - lift);
      if (visual.nameTag) {
        const tag = visual.nameTag;
        const tagWidth = tag.width / viewScale;
        tag.image.setDisplaySize(tagWidth, tag.height / viewScale);
        tag.image.setVisible(!label.image.visible);
        tag.image.setPosition(clamp(point.x, viewLeft + tagWidth / 2 + 4, viewRight - tagWidth / 2 - 4), point.y - 56);
      }
      if (visual.questMark) {
        const mark = marker.quest === "turnin" ? "?" : "!";
        if (visual.questMark.texture.key !== markerQuestMarks[mark]) visual.questMark.setTexture(markerQuestMarks[mark]);
        const bob = reducedMotion ? 0 : Math.sin(animationTime * 3 + visual.phase) * 2;
        visual.questMark.setDisplaySize(22 / viewScale, 30 / viewScale);
        visual.questMark.setPosition(point.x, point.y - (56 + (label.image.visible ? labelHeight : 22 / viewScale) + 2 + bob));
        visual.questMark.setVisible(!!marker.quest);
      }
      visual.halo.setVisible(selected || (marker.kind === "npc" && distance < 80));
      if (visual.character) {
        if (wanderer?.moving) {
          // Strolling: the walk clip for the way it heads (north / south on the directional rows).
          const vertical = wanderer.facing === "north" || wanderer.facing === "south";
          const clip = CHARACTER_CLIPS[vertical ? (wanderer.facing === "north" ? "walkNorth" : "walkSouth") : "walk"];
          const frame = clip.frames[Math.floor((animationTime + visual.phase) * clip.fps) % clip.frames.length];
          setCharacterFrame(visual.character, frame, vertical ? visual.character.facingLeft : wanderer.facing === "west");
        } else {
          const idle = CHARACTER_CLIPS.idle;
          const idleFrame = reducedMotion ? idle.frames[0] : idle.frames[Math.floor((animationTime + visual.phase) * idle.fps) % idle.frames.length];
          setCharacterFrame(visual.character, idleFrame, distance < 90 ? position.x < point.x : visual.character.facingLeft);
        }
        visual.character.image.setPosition(point.x, point.y).setDepth(characterDepth(point.y));
      }
      const opacity = marker.disabled ? 0.5 : 1;
      if (visual.opacity !== opacity) {
        for (const item of [visual.halo, visual.shadow, visual.label.image, visual.nameTag?.image, visual.questMark, visual.character?.image]) item?.setAlpha(opacity);
        visual.opacity = opacity;
      }
      // Keep the painted map in front: far-off service/exit badges recede.
      visual.icon?.setAlpha(opacity * (selected || distance < 230 ? 1 : 0.5));
    }
    updateGuide(currentMarkers, center);
    particles.forEach((particle, index) => {
      particle.image.setVisible(!reducedMotion);
      if (reducedMotion) return;
      particle.x = (particle.x + dt * (3 + index % 3)) % WIDTH;
      particle.y += dt * 2;
      if (particle.y > HEIGHT) particle.y = 0;
      particle.image.setPosition(particle.x, particle.y);
      particle.image.setAlpha(0.10 + Math.sin(animationTime * 0.7 + index) ** 2 * 0.10);
    });
  }
  /**
   * HUD boxes drawn over the map (`[data-hud-occluder]`: the vitals + menu
   * stack, purse and sundial, quest tracker, law chips, rest / action / places
   * column), in host pixels with a little padding. Measured once a frame,
   * only while the guide needs it — HUD boxes come and go (the action button
   * appears beside a marker), so a cached set would let the pointer slip under one.
   */
  let occluders: { left: number; top: number; right: number; bottom: number }[] = [];
  let occludersFrame = -1;
  let frameCount = 0;
  function hudOccluders() {
    if (occludersFrame === frameCount) return occluders;
    occludersFrame = frameCount;
    const host = pageRect(parent);
    const pad = 6;
    occluders = [...document.querySelectorAll<HTMLElement>("[data-hud-occluder]")]
      .map((element) => pageRect(element))
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ left: r.left - host.left - pad, top: r.top - host.top - pad, right: r.right - host.left + pad, bottom: r.bottom - host.top + pad }));
    return occluders;
  }
  /** True when a host-pixel point, grown by `radius`, touches a HUD box. */
  function underHud(x: number, y: number, radius: number) {
    return hudOccluders().some((r) => x + radius > r.left && x - radius < r.right && y + radius > r.top && y - radius < r.bottom);
  }
  /**
   * Quest guide: an arrow bobbing over the guided marker, or a pointer on the
   * view's edge toward it. Neither hides under the HUD: an arrow the HUD would
   * cover becomes the pointer, and the pointer slides in along its ray (so it
   * still points the right way) until it is clear of every HUD box.
   */
  function updateGuide(currentMarkers: WorldMarker[], center: Point) {
    if (!guideArrow || !guideEdge) return;
    const target = currentMarkers.find((marker) => marker.guide);
    parent.dataset.guideMarker = target?.id ?? "";
    if (!target) { guideArrow.setVisible(false); guideEdge.setVisible(false); delete parent.dataset.guideEdge; return; }
    const visual = markers.get(target.id);
    const point = markerPoint(target);
    const bob = reducedMotion ? 0 : Math.abs(Math.sin(animationTime * 3.4)) * 7;
    const lift = (visual?.character ? 64 + (visual.questMark?.visible ? 30 : 0) : 40) + bob;
    const halfW = viewWidth / 2, halfH = viewHeight / 2;
    // Host pixels: the view's centre and a map point's place on screen.
    const screenX = (x: number) => (x - center.x + halfW) * viewScale;
    const screenY = (y: number) => (y - center.y + halfH) * viewScale;
    const margin = 26 / viewScale;
    const dx = point.x - center.x, dy = point.y - 30 - center.y;
    const offscreen = Math.abs(dx) > halfW - margin || Math.abs(dy) > halfH - margin;
    const arrowHidden = !offscreen && underHud(screenX(point.x), screenY(point.y - lift) - 14, 13);
    guideArrow.setDisplaySize(26 / viewScale, 28 / viewScale).setPosition(point.x, point.y - lift).setVisible(!arrowHidden);
    const showEdge = offscreen || arrowHidden;
    guideEdge.setVisible(showEdge);
    if (!showEdge) { delete parent.dataset.guideEdge; return; }
    // Start on the view's edge (or at the covered marker), then walk in toward the centre.
    let scale = offscreen ? Math.min((halfW - margin) / Math.max(Math.abs(dx), 1), (halfH - margin) / Math.max(Math.abs(dy), 1)) : 1;
    const step = 4 / viewScale / Math.max(Math.hypot(dx, dy), 1);
    while (scale > 0.15 && underHud(screenX(center.x + dx * scale), screenY(center.y + dy * scale), 17)) scale -= step;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(animationTime * 5) * 0.08;
    const x = center.x + dx * scale, y = center.y + dy * scale;
    guideEdge.setDisplaySize(30 * pulse / viewScale, 32 * pulse / viewScale)
      .setPosition(x, y)
      .setRotation(Math.atan2(dy, dx) - Math.PI / 2);
    parent.dataset.guideEdge = `${Math.round(screenX(x))},${Math.round(screenY(y))}`;
  }
  function tick(time: number) {
    if (disposed || failed || !ready || !player) return;
    frameCount++;
    try {
      const dt = lastTime ? Math.min(Math.max(time - lastTime, 0), 50) / 1000 : 0;
      lastTime = time;
      const paused = blocked();
      const ambientActive = !document.hidden && (!paused || !!read().readOnly);
      if (ambientActive) { animationTime += dt; motionTime += dt; }
      let moving = false;
      if (paused) {
        cancelWalk();
        keys.clear();
        interactPressed = false;
      } else {
        const held = (key: string) => keys.has(key) ? 1 : 0;
        let dx = held("KeyD") + held("ArrowRight") - held("KeyA") - held("ArrowLeft");
        let dy = held("KeyS") + held("ArrowDown") - held("KeyW") - held("ArrowUp");
        // The joystick is analog: a small push walks slowly, a full push at full speed.
        let pace = 1;
        const push = stick ? Math.hypot(stick.x, stick.y) : 0;
        if (!dx && !dy && stick && push > 0.18) {
          dx = stick.x; dy = stick.y;
          pace = Math.min(1, 0.35 + push);
        }
        const previous = { ...position };
        if (dx || dy) {
          lastInteraction = null;
          cancelWalk();
          const length = Math.hypot(dx, dy);
          Object.assign(position, moveOnWorldGround(position, { x: dx / length * SPEED * pace * dt, y: dy / length * SPEED * pace * dt }, footprints));
          faceMovement(dx, dy);
          rememberPosition();
        } else if (destination) {
          const waypoint = waypoints[0] ?? destination;
          const next = stepTowards(position, waypoint, SPEED * dt);
          faceMovement(next.x - position.x, next.y - position.y);
          Object.assign(position, next);
          // Save before activation: an exit may intentionally clear its map position.
          rememberPosition();
          if (Math.hypot(position.x - waypoint.x, position.y - waypoint.y) < 0.5) {
            Object.assign(position, waypoint);
            waypoints.shift();
            rememberPosition();
          }
          if (!waypoints.length) {
            const id = interaction;
            cancelWalk();
            if (id) {
              lastInteraction = id;
              const marker = read().markers.find((entry) => entry.id === id);
              if (marker?.kind === "npc") {
                const point = markerPoint(marker);
                faceMovement(point.x - position.x, point.y - position.y, true);
              }
              marker?.onActivate();
            }
            if (disposed || failed) return;
          }
        }
        const step = Math.hypot(position.x - previous.x, position.y - previous.y);
        moving = step > 0.01;
        walked += step;
        if (walked >= WALK_TICK_UNITS) {
          walked -= WALK_TICK_UNITS;
          onWalkTick?.(pickFoeSpot);
          if (disposed || failed) return;
        }
        if (interactPressed) {
          interactPressed = false;
          const preferred = read().markers.find((marker) => marker.id === lastInteraction);
          const nearest = preferred ? { marker: preferred, point: markerPoint(preferred) } : read().markers.map((marker) => ({ marker, point: markerPoint(marker) }))
            .sort((a, b) => Math.hypot(position.x - a.point.x, position.y - a.point.y) - Math.hypot(position.x - b.point.x, position.y - b.point.y))[0];
          if (nearest && Math.hypot(position.x - nearest.point.x, position.y - nearest.point.y) < 100) moveToMarker(nearest.marker.id);
        }
      }
      updatePresentation(ambientActive ? dt : 0, moving);
      updatePlacementFade(dt);
      updateFoes(paused);
      // Online: tell the session where the hero is (it throttles), and draw the others.
      read().online?.report({ x: Math.round(position.x * 10) / 10, y: Math.round(position.y * 10) / 10, dir: playerDir, moving });
      updateRemotes(dt);
      if (disposed || failed) return;
      if (veil) {
        if (lighting.update(read().time ?? 0, animationTime, reducedMotion)) veil.texture.refresh();
        veil.image.setAlpha(lighting.opacity);
      }
      placeCamera(false, dt);
      if (time - lastPositionReport > 150) { reportPosition(); lastPositionReport = time; }
    } catch (error) { fail(error); }
  }

  parent.addEventListener("pointermove", pointerMove);
  parent.addEventListener("pointerleave", pointerLeave);
  parent.addEventListener("pointerdown", pointerDown);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", loseFocus);
  document.addEventListener("visibilitychange", visibilityChanged);
  motionQuery.addEventListener("change", motionChanged);
  const observer = new ResizeObserver(resize);
  observer.observe(parent);

  return {
    interact: moveToMarker,
    tapAt,
    setStick(vector) {
      stick = vector;
      if (vector) { lastInteraction = null; cancelWalk(); }
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      ready = false;
      abort.abort();
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", loseFocus);
      document.removeEventListener("visibilitychange", visibilityChanged);
      motionQuery.removeEventListener("change", motionChanged);
      parent.removeEventListener("pointermove", pointerMove);
      parent.removeEventListener("pointerleave", pointerLeave);
      parent.removeEventListener("pointerdown", pointerDown);
      stage.destroy();
      parent.style.cursor = "";
      delete parent.dataset.playerX;
      delete parent.dataset.playerY;
      delete parent.dataset.playerMotion;
      delete parent.dataset.playerFrame;
      delete parent.dataset.playerFacing;
      delete parent.dataset.playerDir;
      delete parent.dataset.nearbyScreenBounds;
      delete parent.dataset.wanderingNpcs;
      delete parent.dataset.visibleProps;
      delete parent.dataset.nearbyMarker;
      delete parent.dataset.placements;
      delete parent.dataset.placementIds;
      delete parent.dataset.remotePlayers;
    },
  };
}
