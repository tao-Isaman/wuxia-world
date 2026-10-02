import { gradePixels } from "./route-grade";
import type * as Phaser from "phaser";
import {
  CHARACTER_CLIPS, characterId, npcCharacterId,
  type CharacterId,
} from "../characters/catalog";
import { loadCharacterAtlas } from "../characters/sheet";
import { hasAnimatedSheet } from "../characters/npc-sheets";
import { WALK8_FIRST_FRAME, WALK8_FPS, WALK8_FRAMES, dir8FromVector, walk8Frame, type Dir8 } from "../characters/walk8";
import { WANDER_FREEZE_DISTANCE, createWanderer, stepWanderer, type Wanderer } from "./npc-wander";
import { worldForeground } from "./world-occlusion";
import { createWorldLighting } from "./world-lighting";
import { drawWorldBadge, warmWorldCharacter } from "./world-style";
import { moveOnWorldGround, planWorldPath, worldFootprints, worldPointBlocked } from "./world-navigation";
import { initialWorldPlacement } from "./world-placement";
import { addGridFrames, canvasTexture, createStage, drawCanvas, stagePixelRatio, type Stage } from "./phaser-stage";
import {
  WALK_TICK_UNITS, getRememberedMapPosition, rememberMapPosition, stepTowards,
  type Point, type WorldMarker, type WorldPresentation, type WorldRuntime,
} from "./types";

const WIDTH = 960;
const HEIGHT = 640;
const SPEED = 150;
/** How far the camera zooms in past a cover fit: √10, so a tenth of the map's area is in view. */
const MAP_ZOOM = Math.sqrt(10);
const LOAD_TIMEOUT = 20_000;
// Unique NPC sprites are ~74 native px tall; this frame/size pair gives them the
// same on-screen height as the archetype sheets (54 units × 108/128 of a frame).
const UNIQUE_FRAME = 80;
const UNIQUE_FEET = 78;
const UNIQUE_NPC_SIZE = 50;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toWorld = (point: Point): Point => ({ x: point.x * WIDTH / 100, y: point.y * HEIGHT / 100 });
const toPercent = (point: Point): Point => ({ x: point.x / WIDTH * 100, y: point.y / HEIGHT * 100 });
const clampPosition = (point: Point): Point => ({ x: clamp(point.x, 12, WIDTH - 12), y: clamp(point.y, 18, HEIGHT - 12) });

export function worldInputBlocked(): boolean {
  const active = document.activeElement;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"], [data-world-busy]') ||
    !!active?.matches('input, textarea, select, [contenteditable="true"]');
}

type Atlas = { image: HTMLCanvasElement; frameSize: number; feetY: number };
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
  /** Called for every WALK_TICK_UNITS the hero walks (random-event ticks). */
  onWalkTick?: () => void,
): WorldRuntime {
  const initial = read();
  const footprints = worldFootprints(initial.key, initial.image);
  const placement = initialWorldPlacement(initial, getRememberedMapPosition(initial.key), footprints);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const font = getComputedStyle(document.body).fontFamily;
  const lighting = createWorldLighting(initial.key);
  const markers = new Map<string, MarkerVisual>();
  const props = new Map<string, Phaser.GameObjects.Image>();
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
  function makeNameTag(text: string): TextSprite {
    const width = Math.ceil(measure(text, "600 ")) + 10;
    return textSprite(width, 22, (context) => {
      context.font = `600 13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "rgba(8, 20, 14, 0.95)";
      context.strokeText(text, width / 2, 11);
      context.fillStyle = "#8ee67a";
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
    // Cover the screen, then zoom in so the view holds a tenth of the map's
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
    const bounds = parent.getBoundingClientRect();
    const center = cameraCenter();
    return {
      x: center.x - viewWidth / 2 + (event.clientX - bounds.left) / viewScale,
      y: center.y - viewHeight / 2 + (event.clientY - bounds.top) / viewScale,
    };
  }
  function toScreen(point: Point): Point {
    const center = cameraCenter();
    return { x: (point.x - center.x + viewWidth / 2) * viewScale, y: (point.y - center.y + viewHeight / 2) * viewScale };
  }
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
    const [landscape, atlasEntries, propImages] = await Promise.all([
      loadImage(initial.image),
      // Only the controlled hero walks north/south. Stationary NPCs sharing a
      // hero costume need its base poses, not the large direction supplement.
      // Rigged NPCs walk in every direction, so they load it too.
      Promise.all([...ids].map(async (id) => [id, await loadAtlas(id, id === playerId || hasAnimatedSheet(id) || walkers.has(id))] as const)),
      Promise.all((initial.props ?? []).map(async (prop) => [prop.id, await loadImage(prop.image)] as const)),
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
    const backgroundCanvas = drawCanvas(WIDTH, HEIGHT, (context) => {
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

    const shadowKey = texture(drawCanvas(64, 24, (context) => {
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
    player = makeCharacter(`char:${playerId}`, atlases.get(playerId)!, 56);
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
  function updatePresentation(dt: number, moving: boolean) {
    if (!actor || !player) return;
    actor.shadow.setPosition(position.x, position.y);
    actor.ring.setPosition(position.x, position.y);
    actor.sign.setPosition(position.x, position.y - 57);
    player.image.setPosition(position.x, position.y).setDepth(101 + position.y * 10);
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
        visual.character.image.setPosition(point.x, point.y).setDepth(100 + point.y * 10);
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
  /** Quest guide: an arrow bobbing over the guided marker, or a pointer on the view's edge toward it. */
  function updateGuide(currentMarkers: WorldMarker[], center: Point) {
    if (!guideArrow || !guideEdge) return;
    const target = currentMarkers.find((marker) => marker.guide);
    parent.dataset.guideMarker = target?.id ?? "";
    if (!target) { guideArrow.setVisible(false); guideEdge.setVisible(false); return; }
    const visual = markers.get(target.id);
    const point = markerPoint(target);
    const bob = reducedMotion ? 0 : Math.abs(Math.sin(animationTime * 3.4)) * 7;
    const lift = (visual?.character ? 64 + (visual.questMark?.visible ? 30 : 0) : 40) + bob;
    guideArrow.setDisplaySize(26 / viewScale, 28 / viewScale).setPosition(point.x, point.y - lift).setVisible(true);
    const halfW = viewWidth / 2, halfH = viewHeight / 2;
    const margin = 26 / viewScale;
    const dx = point.x - center.x, dy = point.y - 30 - center.y;
    const offscreen = Math.abs(dx) > halfW - margin || Math.abs(dy) > halfH - margin;
    guideEdge.setVisible(offscreen);
    if (offscreen) {
      const scale = Math.min((halfW - margin) / Math.max(Math.abs(dx), 1), (halfH - margin) / Math.max(Math.abs(dy), 1));
      const pulse = reducedMotion ? 1 : 1 + Math.sin(animationTime * 5) * 0.08;
      guideEdge.setDisplaySize(30 * pulse / viewScale, 32 * pulse / viewScale)
        .setPosition(center.x + dx * scale, center.y + dy * scale)
        .setRotation(Math.atan2(dy, dx) - Math.PI / 2);
    }
  }
  function tick(time: number) {
    if (disposed || failed || !ready || !player) return;
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
          onWalkTick?.();
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
    },
  };
}
