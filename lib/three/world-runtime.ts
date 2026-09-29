import * as THREE from "three";
import {
  CHARACTER_CLIPS, characterId, npcCharacterId,
  type CharacterId,
} from "../characters/catalog";
import { loadCharacterAtlas } from "../characters/sheet";
import { worldForeground } from "./world-occlusion";
import { createWorldLighting } from "./world-lighting";
import { drawWorldBadge, warmWorldCharacter } from "./world-style";
import { moveOnWorldGround, planWorldPath, worldFootprints } from "./world-navigation";
import { initialWorldPlacement } from "./world-placement";
import {
  getRememberedMapPosition, rememberMapPosition, stepTowards,
  type Point, type WorldMarker, type WorldPresentation, type WorldRuntime,
} from "./types";

const WIDTH = 960;
const HEIGHT = 640;
const SPEED = 150;
const LOAD_TIMEOUT = 20_000;
// Unique NPC sprites are ~74 native px tall; this frame/size pair gives them the
// same on-screen height as the archetype sheets (54 units × 108/128 of a frame).
const UNIQUE_FRAME = 80;
const UNIQUE_FEET = 78;
const UNIQUE_NPC_SIZE = 50;
const toWorld = (point: Point): Point => ({ x: point.x * WIDTH / 100, y: point.y * HEIGHT / 100 });
const toPercent = (point: Point): Point => ({ x: point.x / WIDTH * 100, y: point.y / HEIGHT * 100 });
const clampPosition = (point: Point): Point => ({
  x: THREE.MathUtils.clamp(point.x, 12, WIDTH - 12),
  y: THREE.MathUtils.clamp(point.y, 18, HEIGHT - 12),
});

export function worldInputBlocked(): boolean {
  const active = document.activeElement;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"]') ||
    !!active?.matches('input, textarea, select, [contenteditable="true"]');
}

type Atlas = Awaited<ReturnType<typeof loadCharacterAtlas>>;
type CharacterVisual = {
  sprite: THREE.Sprite;
  texture: THREE.Texture;
  frame: number;
  facingLeft: boolean;
  columns: number;
  rows: number;
  directional: boolean;
};
type MarkerVisual = {
  group: THREE.Group;
  hit: THREE.Mesh;
  label: THREE.Sprite;
  labelText: string;
  /** Hero's Adventure-style always-on name over an NPC (hidden while the boxed label shows). */
  nameTag?: THREE.Sprite;
  questMark?: THREE.Sprite;
  /** Service / exit badge; fades when the player is far away. */
  icon?: THREE.Sprite;
  halo: THREE.Sprite;
  character?: CharacterVisual;
  opacity: number;
  phase: number;
};

/** A flat orthographic world: map coordinates increase down, Three's Y increases up. */
export function createWorldRuntime(
  parent: HTMLElement,
  read: () => WorldPresentation,
  onReady: () => void,
  onError: (message: string) => void,
): WorldRuntime {
  const initial = read();
  const footprints = worldFootprints(initial.key, initial.image);
  const placement = initialWorldPlacement(initial, getRememberedMapPosition(initial.key), footprints);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const font = getComputedStyle(document.body).fontFamily;
  const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: "low-power" });
  renderer.setClearColor(0x172723, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.imageRendering = "pixelated";
  parent.appendChild(renderer.domElement);
  parent.dataset.renderer = "three";

  const scene = new THREE.Scene();
  const lighting = createWorldLighting(scene, initial.key);
  const camera = new THREE.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, 0.1, 2000);
  camera.position.set(WIDTH / 2, -HEIGHT / 2, 1000);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const groundPoint = new THREE.Vector3();
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const markers = new Map<string, MarkerVisual>();
  let questMarks: Record<"!" | "?", THREE.Texture> = {} as Record<"!" | "?", THREE.Texture>;
  const props = new Map<string, THREE.Sprite>();
  const bystanders = new Map<string, { group: THREE.Group; character: CharacterVisual }>();
  const hitTargets: THREE.Mesh[] = [];
  const keys = new Set<string>();
  const abort = new AbortController();
  const particles: THREE.Sprite[] = [];
  let disposed = false;
  let failed = false;
  let ready = false;
  let animationFrame = 0;
  let lastTime = 0;
  let animationTime = 0;
  let motionTime = 0;
  let lastPositionReport = 0;
  let playerMotion: "idle" | "walk" = "idle";
  let playerFacing: "east" | "west" | "north" | "south" = placement.facing;
  let destination: Point | null = null;
  let waypoints: Point[] = [];
  let interaction: string | null = null;
  let lastInteraction: string | null = placement.speakerMarkerId ?? null;
  let hovered: string | null = null;
  let interactPressed = false;
  let viewWidth = WIDTH;
  let viewHeight = HEIGHT;
  let viewScale = 1;
  let player: CharacterVisual | undefined;
  let actor: THREE.Group | undefined;
  let targetRing: THREE.Sprite | undefined;
  const position = placement.position;
  const cameraPosition: Point = { ...position };

  const blocked = () => read().readOnly || read().paused || document.hidden || worldInputBlocked();
  const resourceMaterial = <T extends THREE.Material>(material: T): T => { materials.add(material); return material; };
  const resourceGeometry = <T extends THREE.BufferGeometry>(geometry: T): T => { geometries.add(geometry); return geometry; };
  const canvasTexture = (canvas: HTMLCanvasElement): THREE.CanvasTexture => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textures.add(texture);
    return texture;
  };
  function drawnTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");
    context.imageSmoothingEnabled = false;
    draw(context);
    return canvasTexture(canvas);
  }
  function sprite(texture: THREE.Texture, width: number, height: number, opacity = 1) {
    const material = resourceMaterial(new THREE.SpriteMaterial({
      map: texture, transparent: true, depthTest: false, depthWrite: false, opacity, toneMapped: false,
    }));
    const result = new THREE.Sprite(material);
    result.scale.set(width, height, 1);
    return result;
  }
  function fail(cause?: unknown) {
    if (disposed || failed) return;
    failed = true;
    ready = false;
    cancelAnimationFrame(animationFrame);
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
      image.onerror = () => finish(new Error("Image load failed"));
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
  function makeCharacter(atlas: Atlas, size: number): CharacterVisual {
    const texture = canvasTexture(atlas.image);
    const body = sprite(texture, size, size);
    warmWorldCharacter(body.material);
    // Each actor owns its UV transform; all frames use the same authored foot baseline.
    body.center.set(0.5, 1 - atlas.feetY / atlas.frameSize);
    const columns = atlas.image.width / atlas.frameSize;
    const rows = atlas.image.height / atlas.frameSize;
    const visual = { sprite: body, texture, frame: -1, facingLeft: false, columns, rows, directional: rows * columns >= 24 };
    setCharacterFrame(visual, 0, false);
    return visual;
  }
  function setCharacterFrame(character: CharacterVisual, frame: number, facingLeft = character.facingLeft) {
    if (character.frame === frame && character.facingLeft === facingLeft) return;
    // Single-frame (unique NPC) atlases always show their one pose.
    const cell = frame % (character.columns * character.rows);
    const column = cell % character.columns;
    const row = Math.floor(cell / character.columns);
    character.texture.repeat.set((facingLeft ? -1 : 1) / character.columns, 1 / character.rows);
    character.texture.offset.set((column + (facingLeft ? 1 : 0)) / character.columns, 1 - (row + 1) / character.rows);
    character.frame = frame;
    character.facingLeft = facingLeft;
  }
  function labelTexture(text: string): THREE.Texture {
    const measurement = document.createElement("canvas").getContext("2d");
    if (!measurement) throw new Error("Canvas context unavailable");
    measurement.font = `13px ${font}`;
    const width = Math.ceil(measurement.measureText(text).width) + 18;
    return drawnTexture(width, 27, (context) => {
      context.fillStyle = "rgba(16, 35, 30, 0.92)";
      context.fillRect(0, 0, width, 27);
      context.fillStyle = "rgba(221, 191, 126, 0.45)";
      context.fillRect(0, 26, width, 1);
      context.fillStyle = "#f4ead0";
      context.font = `13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, width / 2, 13);
    });
  }
  function nameTagTexture(text: string): THREE.Texture {
    const measurement = document.createElement("canvas").getContext("2d");
    if (!measurement) throw new Error("Canvas context unavailable");
    measurement.font = `600 13px ${font}`;
    const width = Math.ceil(measurement.measureText(text).width) + 10;
    return drawnTexture(width, 22, (context) => {
      context.font = `600 13px ${font}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineJoin = "round";
      context.lineWidth = 4;
      context.strokeStyle = "rgba(8, 20, 14, 0.95)";
      context.strokeText(text, width / 2, 11);
      context.fillStyle = "#8ee67a";
      context.fillText(text, width / 2, 11);
    });
  }
  function questMarkTexture(glyph: "!" | "?"): THREE.Texture {
    return drawnTexture(22, 30, (context) => {
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
  function makeLabel(text: string): THREE.Sprite {
    const texture = labelTexture(text);
    const canvas = texture.image as HTMLCanvasElement;
    const label = sprite(texture, canvas.width, canvas.height);
    label.center.set(0.5, 0);
    label.position.y = 38;
    label.renderOrder = 10_000;
    return label;
  }
  function groundRing(color: string, filled = false) {
    return drawnTexture(64, 24, (context) => {
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
  function markerBadge(kind: WorldMarker["kind"], icon?: string) {
    return drawnTexture(32, 36, (context) => drawWorldBadge(context, kind === "exit", icon));
  }
  function rememberPosition() {
    if (initial.rememberPosition !== false) rememberMapPosition(initial.key, toPercent(position));
  }
  function cancelWalk() {
    destination = null;
    waypoints = [];
    interaction = null;
    if (targetRing) targetRing.visible = false;
  }
  function walk(point: Point, marker?: string) {
    lastInteraction = null;
    waypoints = planWorldPath(position, clampPosition(point), footprints);
    destination = waypoints[waypoints.length - 1] ?? null;
    if (!destination) { cancelWalk(); return; }
    interaction = marker ?? null;
    targetRing?.position.set(destination.x, -destination.y, 0);
    if (targetRing) targetRing.visible = true;
  }
  function faceMovement(dx: number, dy: number) {
    if (Math.abs(dy) > Math.abs(dx)) playerFacing = dy < 0 ? "north" : "south";
    else if (Math.abs(dx) > 0.001) playerFacing = dx < 0 ? "west" : "east";
  }
  function moveToMarker(id: string) {
    if (!ready || disposed || blocked()) return;
    const marker = read().markers.find((entry) => entry.id === id);
    if (!marker) return;
    // Disabled actions retain their original explanatory toast.
    if (marker.disabled) { marker.onActivate(); return; }
    const point = toWorld(marker);
    // Stand beside people and below service signs instead of overlapping their art.
    const approach = marker.kind === "npc" ? { x: point.x + (point.x > WIDTH - 60 ? -38 : 38), y: point.y + 4 }
      : { x: point.x, y: point.y + (marker.kind === "service" ? 34 : 10) };
    walk(approach, id);
  }
  function placeCamera(snap = false, dt = 0) {
    const targetX = viewWidth >= WIDTH ? WIDTH / 2 : THREE.MathUtils.clamp(position.x, viewWidth / 2, WIDTH - viewWidth / 2);
    const targetY = viewHeight >= HEIGHT ? HEIGHT / 2 : THREE.MathUtils.clamp(position.y, viewHeight / 2, HEIGHT - viewHeight / 2);
    const follow = snap || reducedMotion ? 1 : 1 - Math.exp(-8 * dt);
    cameraPosition.x += (targetX - cameraPosition.x) * follow;
    cameraPosition.y += (targetY - cameraPosition.y) * follow;
    const scale = Math.max(renderer.domElement.clientWidth, 1) / viewWidth;
    camera.position.x = Math.round(cameraPosition.x * scale) / scale;
    camera.position.y = -Math.round(cameraPosition.y * scale) / scale;
    camera.updateMatrixWorld();
  }
  function resize() {
    if (disposed) return;
    const width = Math.max(parent.clientWidth, 1);
    const height = Math.max(parent.clientHeight, 1);
    // Keep the map's spatial context; portrait still covers and follows its narrower view.
    const scale = Math.max(width / WIDTH, height / HEIGHT);
    viewScale = scale;
    viewWidth = width / scale;
    viewHeight = height / scale;
    renderer.setSize(width, height, false);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    placeCamera(true);
    if (ready) renderer.render(scene, camera);
  }
  function pointRay(event: PointerEvent) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    raycaster.setFromCamera(pointer, camera);
  }
  function markerUnderPointer(): string | null {
    const hits = raycaster.intersectObjects(hitTargets, false);
    // Overlapping transparent hit areas resolve to the visually frontmost actor.
    hits.sort((a, b) => b.object.renderOrder - a.object.renderOrder);
    return hits[0]?.object.userData.markerId as string | undefined ?? null;
  }
  function pointerMove(event: PointerEvent) {
    if (!ready || blocked()) { pointerLeave(); return; }
    pointRay(event);
    hovered = markerUnderPointer();
    parent.style.cursor = hovered ? "pointer" : "crosshair";
  }
  function pointerLeave() { hovered = null; parent.style.cursor = ""; }
  function pointerDown(event: PointerEvent) {
    if (!ready || event.button !== 0 || blocked()) return;
    event.preventDefault();
    parent.focus({ preventScroll: true });
    pointRay(event);
    const marker = markerUnderPointer();
    if (marker) { moveToMarker(marker); return; }
    if (raycaster.ray.intersectPlane(groundPlane, groundPoint)) walk({ x: groundPoint.x, y: -groundPoint.y });
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
  function contextLost(event: Event) { event.preventDefault(); fail("WebGL context lost"); }

  async function initialize() {
    const playerId = characterId(initial.playerImage.match(/(?:^|\/)([mf][1-4])(?:\.|\/|$)/)?.[1] ?? "m1");
    const ids = new Set<CharacterId>([playerId]);
    initial.markers.filter((marker) => marker.kind === "npc").forEach((marker) => ids.add(npcCharacterId(marker.id)));
    initial.bystanders?.forEach((actor) => ids.add(characterId(actor.characterId)));
    const [landscape, atlasEntries, propImages] = await Promise.all([
      loadImage(initial.image),
      // Only the controlled hero walks north/south. Stationary NPCs sharing a
      // hero costume need its base poses, not the large direction supplement.
      Promise.all([...ids].map(async (id) => [id, await loadAtlas(id, id === playerId)] as const)),
      Promise.all((initial.props ?? []).map(async (prop) => [prop.id, await loadImage(prop.image)] as const)),
    ]);
    if (disposed || failed) return;
    const atlases = new Map(atlasEntries);
    // Unique NPC sprites: one native-pixel pose drawn into an 80 px frame so
    // the figure height matches the archetype sheets at size UNIQUE_NPC_SIZE.
    const uniqueAtlases = new Map<string, Atlas>();
    await Promise.all(initial.markers.filter((marker) => marker.kind === "npc" && marker.sprite).map(async (marker) => {
      try {
        const image = await loadImage(marker.sprite!);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = UNIQUE_FRAME;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.imageSmoothingEnabled = false;
        const scale = Math.min(1, (UNIQUE_FRAME - 2) / image.width, (UNIQUE_FEET - 1) / image.height);
        const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
        context.drawImage(image, Math.round((UNIQUE_FRAME - width) / 2), UNIQUE_FEET - height, width, height);
        uniqueAtlases.set(marker.id, { image: canvas, frameSize: UNIQUE_FRAME, feetY: UNIQUE_FEET, columns: 1, rows: 1, directional: false } as unknown as Atlas);
      } catch { /* keep the archetype sheet for this NPC */ }
    }));
    if (disposed || failed) return;
    const backgroundTexture = drawnTexture(WIDTH, HEIGHT, (context) => {
      if (initial.mirrorImage) { context.translate(WIDTH, 0); context.scale(-1, 1); }
      context.drawImage(landscape, 0, 0, WIDTH, HEIGHT);
    });
    const background = new THREE.Mesh(resourceGeometry(new THREE.PlaneGeometry(WIDTH, HEIGHT)),
      resourceMaterial(new THREE.MeshBasicMaterial({ map: backgroundTexture, depthTest: false, depthWrite: false, toneMapped: false })));
    background.position.set(WIDTH / 2, -HEIGHT / 2, -1);
    scene.add(background);

    for (const foreground of worldForeground(initial.key, initial.image)) {
      const points = foreground.contours.flat();
      const left = Math.floor(Math.min(...points.map((point) => point[0])));
      const top = Math.floor(Math.min(...points.map((point) => point[1])));
      const width = Math.ceil(Math.max(...points.map((point) => point[0]))) - left;
      const height = Math.ceil(Math.max(...points.map((point) => point[1]))) - top;
      const texture = drawnTexture(width, height, (context) => {
        context.beginPath();
        foreground.contours.forEach((contour) => {
          contour.forEach(([x, y], index) => {
            if (!index) context.moveTo(x - left, y - top); else context.lineTo(x - left, y - top);
          });
          context.closePath();
        });
        context.clip();
        context.drawImage(backgroundTexture.image as HTMLCanvasElement, -left, -top);
      });
      const cutout = sprite(texture, width, height);
      cutout.position.set(left + width / 2, -(top + height / 2), 0);
      cutout.renderOrder = 100 + foreground.depth * 10;
      scene.add(cutout);
    }

    const shadowTexture = drawnTexture(64, 24, (context) => {
      context.fillStyle = "rgba(29, 28, 15, 0.38)";
      context.beginPath(); context.ellipse(32, 12, 24, 7, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = "rgba(22, 23, 15, 0.22)";
      context.beginPath(); context.ellipse(32, 12, 17, 4, 0, 0, Math.PI * 2); context.fill();
    });
    const npcRing = groundRing("rgba(224, 196, 129, 0.72)");
    for (const prop of initial.props ?? []) {
      const image = propImages.find(([id]) => id === prop.id)![1];
      const texture = drawnTexture(128, 112, (context) => {
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0, 128, 112);
      });
      const visual = sprite(texture, prop.width, prop.height);
      visual.center.set(0.5, 0.05);
      const point = toWorld(prop);
      visual.position.set(point.x, -point.y, 0);
      visual.renderOrder = 100 + point.y * 10;
      visual.visible = prop.visible !== false;
      scene.add(visual);
      props.set(prop.id, visual);
    }
    for (const bystander of initial.bystanders ?? []) {
      const point = toWorld(bystander);
      const group = new THREE.Group();
      group.position.set(point.x, -point.y, 0);
      const shadow = sprite(shadowTexture, 27, 10);
      shadow.renderOrder = 1;
      group.add(shadow);
      const character = makeCharacter(atlases.get(characterId(bystander.characterId))!, bystander.size ?? 51);
      character.sprite.renderOrder = 100 + point.y * 10;
      group.add(character.sprite);
      group.visible = bystander.visible !== false;
      scene.add(group);
      bystanders.set(bystander.id, { group, character });
    }
    const exitBadge = markerBadge("exit");
    questMarks = { "!": questMarkTexture("!"), "?": questMarkTexture("?") };
    initial.markers.forEach((marker, index) => {
      const point = toWorld(marker);
      const group = new THREE.Group();
      group.position.set(point.x, -point.y, 0);
      scene.add(group);
      const halo = sprite(npcRing, 42, 16);
      halo.renderOrder = 2;
      halo.visible = false;
      group.add(halo);
      let character: CharacterVisual | undefined;
      let markerIcon: THREE.Sprite | undefined;
      if (marker.kind === "npc") {
        const shadow = sprite(shadowTexture, 28, 10);
        shadow.renderOrder = 1;
        group.add(shadow);
        const unique = uniqueAtlases.get(marker.id);
        character = unique ? makeCharacter(unique, UNIQUE_NPC_SIZE) : makeCharacter(atlases.get(npcCharacterId(marker.id))!, 54);
        character.sprite.renderOrder = 100 + point.y * 10;
        group.add(character.sprite);
      } else {
        const icon = sprite(marker.kind === "exit" ? exitBadge : markerBadge(marker.kind, marker.icon), 24, 27);
        icon.center.set(0.5, 0);
        icon.position.y = 5;
        icon.renderOrder = 8000;
        group.add(icon);
        markerIcon = icon;
      }
      const label = makeLabel(marker.label);
      label.visible = false;
      group.add(label);
      let nameTag: THREE.Sprite | undefined;
      let questMark: THREE.Sprite | undefined;
      if (character) {
        const tagTexture = nameTagTexture(marker.label);
        const tagCanvas = tagTexture.image as HTMLCanvasElement;
        nameTag = sprite(tagTexture, tagCanvas.width, tagCanvas.height);
        nameTag.center.set(0.5, 0);
        nameTag.renderOrder = 9_000;
        group.add(nameTag);
        questMark = sprite(questMarks[marker.quest === "turnin" ? "?" : "!"], 22, 30);
        questMark.center.set(0.5, 0);
        questMark.renderOrder = 9_001;
        questMark.visible = false;
        group.add(questMark);
      }
      const hitWidth = marker.kind === "npc" ? 50 : 44;
      const hitHeight = marker.kind === "npc" ? 76 : 52;
      const hit = new THREE.Mesh(resourceGeometry(new THREE.PlaneGeometry(hitWidth, hitHeight)),
        resourceMaterial(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })));
      hit.position.y = hitHeight / 2 - 8;
      hit.renderOrder = point.y;
      hit.userData.markerId = marker.id;
      group.add(hit);
      hitTargets.push(hit);
      markers.set(marker.id, { group, hit, label, labelText: marker.label, nameTag, questMark, icon: markerIcon, halo, character, opacity: 1, phase: index * 0.47 });
    });

    actor = new THREE.Group();
    actor.position.set(position.x, -position.y, 0);
    const playerShadow = sprite(shadowTexture, 30, 11);
    playerShadow.renderOrder = 1;
    const playerRing = sprite(groundRing("rgba(225, 199, 139, 0.55)"), 28, 10);
    playerRing.renderOrder = 2;
    player = makeCharacter(atlases.get(playerId)!, 56);
    actor.add(playerShadow, playerRing, player.sprite);
    const playerSign = sprite(drawnTexture(9, 7, (context) => {
      context.fillStyle = "#172b26"; context.fillRect(0, 0, 9, 3); context.fillRect(2, 3, 5, 2); context.fillRect(4, 5, 1, 2);
      context.fillStyle = "#fff0bd"; context.fillRect(1, 1, 7, 1); context.fillRect(2, 2, 5, 1); context.fillRect(3, 3, 3, 1); context.fillRect(4, 4, 1, 1);
    }), 7, 5);
    playerSign.position.y = 57;
    playerSign.renderOrder = 10_001;
    actor.add(playerSign);
    scene.add(actor);
    targetRing = sprite(groundRing("#f4d690"), 26, 12);
    targetRing.renderOrder = 3;
    targetRing.visible = false;
    scene.add(targetRing);

    const moteTexture = drawnTexture(4, 4, (context) => { context.fillStyle = "#f5e0ab"; context.fillRect(1, 0, 2, 4); });
    for (let index = 0; index < 20; index++) {
      const mote = sprite(moteTexture, index % 3 ? 2 : 3, index % 3 ? 2 : 4, 0.16);
      mote.position.set((index * 137 + 37) % WIDTH, -((index * 73 + 67) % HEIGHT), 0);
      mote.renderOrder = 9000;
      mote.visible = !reducedMotion;
      particles.push(mote);
      scene.add(mote);
    }
    ready = true;
    resize();
    updatePresentation(0, false);
    reportPosition();
    renderer.render(scene, camera);
    onReady();
    animationFrame = requestAnimationFrame(tick);
  }

  function reportPosition() {
    const projected = new THREE.Vector3(position.x, -position.y, 0).project(camera);
    parent.dataset.playerScreenX = String((projected.x + 1) * parent.clientWidth / 2);
    parent.dataset.playerScreenY = String((1 - projected.y) * parent.clientHeight / 2);
    parent.dataset.playerScreenHeight = String(56 * viewScale);
    const nearbyBounds: { left: number; top: number; width: number; height: number }[] = [];
    for (const marker of read().markers) {
      const point = toWorld(marker);
      if (Math.hypot(position.x - point.x, position.y - point.y) > 105) continue;
      const visual = markers.get(marker.id);
      if (!visual) continue;
      const projectedNpc = new THREE.Vector3(point.x, -point.y, 0).project(camera);
      const x = (projectedNpc.x + 1) * parent.clientWidth / 2;
      const y = (1 - projectedNpc.y) * parent.clientHeight / 2;
      const height = 54 * viewScale;
      if (visual.character) nearbyBounds.push({ left: x - height * 0.42 - 8,
        top: y - height - 8, width: height * 0.84 + 16, height: height + 16 });
      if (visual.label.visible) {
        const width = visual.label.scale.x * viewScale;
        const labelHeight = visual.label.scale.y * viewScale;
        nearbyBounds.push({ left: x + visual.label.position.x * viewScale - width / 2 - 4,
          top: y - visual.label.position.y * viewScale - labelHeight - 4, width: width + 8, height: labelHeight + 8 });
      }
    }
    parent.dataset.nearbyScreenBounds = JSON.stringify(nearbyBounds);
    parent.dataset.playerX = position.x.toFixed(1);
    parent.dataset.playerY = position.y.toFixed(1);
    parent.dataset.playerMotion = playerMotion;
    parent.dataset.playerFrame = String(player?.frame ?? 0);
    parent.dataset.playerFacing = playerFacing;
  }
  function updatePresentation(dt: number, moving: boolean) {
    if (!actor || !player) return;
    actor.position.set(position.x, -position.y, 0);
    player.sprite.renderOrder = 101 + position.y * 10;
    const nextMotion = moving ? "walk" : "idle";
    if (playerMotion !== nextMotion) { playerMotion = nextMotion; motionTime = 0; }
    const vertical = player.directional && (playerFacing === "north" || playerFacing === "south");
    const clip = vertical ? CHARACTER_CLIPS[playerFacing === "north" ? "walkNorth" : "walkSouth"] : CHARACTER_CLIPS[playerMotion];
    const frame = clip.frames[!moving && (reducedMotion || vertical) ? 0 : Math.floor(motionTime * clip.fps) % clip.frames.length];
    setCharacterFrame(player, frame, playerFacing === "west");
    parent.dataset.playerMotion = playerMotion;
    parent.dataset.playerFrame = String(frame);
    parent.dataset.playerFacing = playerFacing;
    const presentation = read();
    for (const prop of presentation.props ?? []) {
      const visual = props.get(prop.id);
      if (visual) visual.visible = prop.visible !== false;
    }
    for (const [index, bystander] of (presentation.bystanders ?? []).entries()) {
      const visual = bystanders.get(bystander.id);
      if (!visual) continue;
      visual.group.visible = bystander.visible !== false;
      const idle = CHARACTER_CLIPS.idle;
      const frame = idle.frames[reducedMotion ? 0 : Math.floor((animationTime + index * 0.37) * idle.fps) % idle.frames.length];
      setCharacterFrame(visual.character, frame, !!bystander.facingLeft);
    }
    parent.dataset.visibleProps = (presentation.props ?? []).filter(prop => prop.visible !== false).map(prop => prop.id).join(",");
    const currentMarkers = read().markers;
    let nearest: string | null = null;
    let nearestDistance = 105;
    for (const marker of currentMarkers) {
      const point = toWorld(marker);
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      if (distance < nearestDistance) { nearest = marker.id; nearestDistance = distance; }
    }
    const lastMarker = currentMarkers.find((marker) => marker.id === lastInteraction);
    if (!lastMarker || Math.hypot(position.x - toWorld(lastMarker).x, position.y - toWorld(lastMarker).y) > 90) lastInteraction = null;
    const focusedMarker = hovered ?? interaction ?? lastInteraction ?? nearest;
    for (const marker of currentMarkers) {
      const visual = markers.get(marker.id);
      if (!visual) continue;
      const point = toWorld(marker);
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      const selected = hovered === marker.id || interaction === marker.id;
      visual.group.position.set(point.x, -point.y, 0);
      visual.hit.renderOrder = point.y;
      if (visual.labelText !== marker.label) {
        const oldTexture = visual.label.material.map;
        const texture = labelTexture(marker.label);
        visual.label.material.map = texture;
        oldTexture?.dispose();
        if (oldTexture) textures.delete(oldTexture);
        visual.labelText = marker.label;
      }
      const labelWidth = (visual.label.material.map!.image as HTMLCanvasElement).width;
      const labelScale = Math.min(1, (parent.clientWidth - 24) / labelWidth) / viewScale;
      visual.label.scale.set(labelWidth * labelScale, 27 * labelScale, 1);
      visual.label.visible = marker.id === focusedMarker;
      visual.label.position.y = visual.character ? 58 : 33;
      // A nearby sign's caption stays above the hero instead of crossing their torso.
      if (Math.abs(position.x - point.x) < visual.label.scale.x / 2 + 20 && distance < 90) {
        visual.label.position.y = Math.max(visual.label.position.y, point.y - position.y + 60);
      }
      const halfLabel = visual.label.scale.x / 2;
      visual.label.position.x = THREE.MathUtils.clamp(point.x, camera.position.x - viewWidth / 2 + halfLabel + 6,
        camera.position.x + viewWidth / 2 - halfLabel - 6) - point.x;
      if (visual.nameTag) {
        const tagCanvas = visual.nameTag.material.map!.image as HTMLCanvasElement;
        const tagScale = 1 / viewScale;
        visual.nameTag.scale.set(tagCanvas.width * tagScale, tagCanvas.height * tagScale, 1);
        visual.nameTag.position.y = 56;
        visual.nameTag.visible = !visual.label.visible;
        const halfTag = visual.nameTag.scale.x / 2;
        visual.nameTag.position.x = THREE.MathUtils.clamp(point.x, camera.position.x - viewWidth / 2 + halfTag + 4,
          camera.position.x + viewWidth / 2 - halfTag - 4) - point.x;
      }
      if (visual.questMark) {
        const mark = marker.quest === "turnin" ? "?" : "!";
        if (visual.questMark.material.map !== questMarks[mark]) visual.questMark.material.map = questMarks[mark];
        const bob = reducedMotion ? 0 : Math.sin(animationTime * 3 + visual.phase) * 2;
        visual.questMark.scale.set(22 / viewScale, 30 / viewScale, 1);
        visual.questMark.position.y = 56 + (visual.label.visible ? visual.label.scale.y : 22 / viewScale) + 2 + bob;
        visual.questMark.visible = !!marker.quest;
      }
      visual.halo.visible = selected || (marker.kind === "npc" && distance < 80);
      if (visual.character) {
        const idle = CHARACTER_CLIPS.idle;
        const idleFrame = reducedMotion ? idle.frames[0] : idle.frames[Math.floor((animationTime + visual.phase) * idle.fps) % idle.frames.length];
        const nearby = Math.hypot(position.x - point.x, position.y - point.y) < 90;
        setCharacterFrame(visual.character, idleFrame, nearby ? position.x < point.x : visual.character.facingLeft);
        visual.character.sprite.renderOrder = 100 + point.y * 10;
      }
      const opacity = marker.disabled ? 0.5 : 1;
      if (visual.opacity !== opacity) {
        visual.group.traverse((object) => { if (object instanceof THREE.Sprite) object.material.opacity = opacity; });
        visual.opacity = opacity;
      }
      // Keep the painted map in front: far-off service/exit badges recede.
      if (visual.icon) visual.icon.material.opacity = opacity * (selected || distance < 230 ? 1 : 0.5);
    }
    particles.forEach((particle, index) => {
      particle.visible = !reducedMotion;
      if (reducedMotion) return;
      particle.position.x = (particle.position.x + dt * (3 + index % 3)) % WIDTH;
      particle.position.y -= dt * 2;
      if (particle.position.y < -HEIGHT) particle.position.y = 0;
      particle.material.opacity = 0.10 + Math.sin(animationTime * 0.7 + index) ** 2 * 0.10;
    });
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
        const dx = held("KeyD") + held("ArrowRight") - held("KeyA") - held("ArrowLeft");
        const dy = held("KeyS") + held("ArrowDown") - held("KeyW") - held("ArrowUp");
        const previous = { ...position };
        if (dx || dy) {
          lastInteraction = null;
          cancelWalk();
          const length = Math.hypot(dx, dy);
          Object.assign(position, moveOnWorldGround(position, { x: dx / length * SPEED * dt, y: dy / length * SPEED * dt }, footprints));
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
                const point = toWorld(marker);
                faceMovement(point.x - position.x, point.y - position.y);
              }
              marker?.onActivate();
            }
            if (disposed || failed) return;
          }
        }
        moving = Math.hypot(position.x - previous.x, position.y - previous.y) > 0.01;
        if (interactPressed) {
          interactPressed = false;
          const preferred = read().markers.find((marker) => marker.id === lastInteraction);
          const nearest = preferred ? { marker: preferred, point: toWorld(preferred) } : read().markers.map((marker) => ({ marker, point: toWorld(marker) }))
            .sort((a, b) => Math.hypot(position.x - a.point.x, position.y - a.point.y) - Math.hypot(position.x - b.point.x, position.y - b.point.y))[0];
          if (nearest && Math.hypot(position.x - nearest.point.x, position.y - nearest.point.y) < 100) moveToMarker(nearest.marker.id);
        }
      }
      updatePresentation(ambientActive ? dt : 0, moving);
      lighting.update(read().time ?? 0, animationTime, reducedMotion);
      placeCamera(false, dt);
      if (time - lastPositionReport > 150) { reportPosition(); lastPositionReport = time; }
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(tick);
    } catch (error) { fail(error); }
  }

  renderer.domElement.addEventListener("pointermove", pointerMove);
  renderer.domElement.addEventListener("pointerleave", pointerLeave);
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", loseFocus);
  document.addEventListener("visibilitychange", visibilityChanged);
  motionQuery.addEventListener("change", motionChanged);
  const observer = new ResizeObserver(resize);
  observer.observe(parent);
  resize();
  void initialize().catch(fail);

  return {
    interact: moveToMarker,
    destroy() {
      if (disposed) return;
      disposed = true;
      ready = false;
      cancelAnimationFrame(animationFrame);
      abort.abort();
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", loseFocus);
      document.removeEventListener("visibilitychange", visibilityChanged);
      motionQuery.removeEventListener("change", motionChanged);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerleave", pointerLeave);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      lighting.destroy();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      parent.style.cursor = "";
      delete parent.dataset.playerX;
      delete parent.dataset.playerY;
      delete parent.dataset.playerMotion;
      delete parent.dataset.playerFrame;
      delete parent.dataset.playerFacing;
      delete parent.dataset.nearbyScreenBounds;
      delete parent.dataset.visibleProps;
    },
  };
}
