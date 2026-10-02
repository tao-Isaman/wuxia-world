import * as Phaser from "phaser";
import { isPlayerTurn, useBattleStore } from "@/store/battle-store";
import {
  aimableFor,
  previewArea,
  reachableFor,
  targetsFor,
  type Cell,
  type GridBattleState,
  type GridEvent,
  type GridUnit,
  type Team,
  type UnitLook,
} from "@/lib/game/grid";
import { heroMoveFor, heroPose, movesIn, type HeroMove } from "./hero-motion";
import { CHARACTER_CLIPS, CHARACTER_FEET_Y, CHARACTER_FRAME_SIZE, characterId, type CharacterMotion } from "@/lib/characters/catalog";
import { WALK8_FPS, dir8FromVector, walk8Frame, walk8Source, type Dir8 } from "@/lib/characters/walk8";
import { loadCharacterAtlas } from "@/lib/characters/sheet";
import { BATTLE_BACKGROUNDS, type BattleBackground } from "./battle-background";
import { addGridFrames, canvasTexture, createStage, type Stage } from "./phaser-stage";
import { castVfx, type CastVfx } from "./cast-vfx";
import { createBattleVfx, type BattleVfx, type Point } from "./battle-vfx";
import { castStartSfx, impactSfx, supportSfx, whiffSfx } from "../audio/cast-sfx";

// ─── Grid battle stage ────────────────────────────────────────────────
// A Wandering-Sword-style 2.5D tactics board: the battle painting behind a
// tile grid in gentle perspective (far rows narrower and shorter), units
// standing on tiles and depth-sorted by row. Plays the store's GridEvent
// queue in order (walk, cast, captions, end poses), then calls step() so
// AI turns flow one beat at a time. Input stays on the DOM (Phaser input is
// off): pointer → board cell through the inverse perspective transform.

/** Tile width / depth at the nearest row (world px); far rows shrink to S_FAR. */
const TW = 96;
const TH = 54;
const S_FAR = 0.74;
/** Character frame (128 px sheet cell) display size at scale 1. */
const FRAME = 150;
/** Visible figure height inside a sheet frame. */
const FIGURE = FRAME * 108 / CHARACTER_FRAME_SIZE;
const HIT_DELAY = 300;
const HIT_GAP = 110;
const WALK_MS = 180;
const STEP_PACE = 350;
const TIER_COLORS = ["#f7edcf", "#b7e9cc", "#abd3ed", "#e3bcec", "#f4cc91"];
const TEAM_RING: Record<Team, number> = { ally: 0x6fd39a, enemy: 0xe7684a };
const TEAM_HP: Record<Team, number> = { ally: 0x59c784, enemy: 0xe0553b };
const TEAM_TAG: Record<Team, string> = { ally: "#c5f2d4", enemy: "#ffc9b6" };

export interface GridBattleUi {
  /** Selected skill slot of the active unit (null = move mode). */
  slot: number | null;
  /** Tapped aim cell (confirm by tapping it again). */
  aimed: Cell | null;
  /** Mouse hover cell. */
  hover: Cell | null;
  /** Unit whose info card is open. */
  inspect: string | null;
}

export interface GridBattleRuntimeOptions {
  background?: BattleBackground;
  onReady: () => void;
  onError: (reason?: string) => void;
  /** A tap / click on the board: the cell (or null off-board) and the living unit standing there. */
  onTap: (cell: Cell | null, unitId: string | null, pointerType: string) => void;
  /** Mouse hover moved to another cell (null = off the board). */
  onHover: (cell: Cell | null) => void;
  /** Event playback started (true) or the queue drained (false). */
  onAnim: (playing: boolean) => void;
  /** An event finished playing (its seq), or the stage joined a battle whose history ends at seq. */
  onPlayed?: (seq: number) => void;
}

export interface GridBattleRuntime {
  setUi: (ui: GridBattleUi) => void;
  destroy: () => void;
}

/** The canvas host exposes `gridCellPoint(x, y)` → viewport point of a cell's centre (for tests). */
export type GridBattleHost = HTMLElement & { gridCellPoint?: (x: number, y: number) => Point | null };

type ActorKind = "sheet" | "still" | "creature";

interface Actor {
  id: string;
  team: Team;
  index: number;
  /** Variant colour multiplied into the sprite (UnitLook.tint). */
  tint?: number;
  kind: ActorKind;
  directional: boolean;
  /** Painted eight-way walk cells (heroes, lib/characters/walk8.ts). */
  walk8: boolean;
  /** Heading of the current walk step, for walk8 actors. */
  walkDir: Dir8;
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  ring: Phaser.GameObjects.Ellipse;
  tag: Phaser.GameObjects.Image;
  tagW: number;
  tagH: number;
  bars: Phaser.GameObjects.Graphics;
  barsKey: string;
  /** Display size at scale 1 and the feet line (origin y). */
  dispW: number;
  dispH: number;
  head: number;
  /** Board position (continuous; a cell's centre is x + .5). */
  u: number;
  v: number;
  /** 1 = facing right. */
  hFacing: 1 | -1;
  motion: CharacterMotion;
  motionStart: number;
  frame: number;
  walk: { path: Cell[]; start: number; step: number } | null;
  attack: {
    start: number; lastImpact: number; hitDelay: number; dx: number; dy: number; travel: number; support: boolean;
    /** The hero side's body move for this cast (lib/stage/hero-motion.ts); enemies keep the plain lunge. */
    move?: HeroMove;
    /** The cast's glow colour, for afterimages and the qi aura. */
    glow: number;
  } | null;
  /** When the last afterimage was left, and the qi aura under the feet (made on first use). */
  lastGhost: number;
  aura: Phaser.GameObjects.Ellipse | null;
  hurtUntil: number;
  flashUntil: number;
  knockUntil: number;
  knockX: number;
  knockY: number;
  dead: boolean;
  deadAt: number;
  fledAt: number;
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  /** Last computed screen feet point and scale. */
  x: number;
  y: number;
  s: number;
}

type EffectObject = Phaser.GameObjects.Image;
interface Effect { item: EffectObject; key: string; born: number; life: number; x: number; y: number; vy: number; w: number; h: number; grow: number }

interface CastPlay {
  ev: Extract<GridEvent, { t: "cast" }>;
  vfx: CastVfx;
  hits: number;
  nextHit: number;
  lastImpact: number;
  healed: boolean;
  killed: boolean;
  support: boolean;
}
interface Playback { ev: GridEvent; start: number; duration: number; cast: CastPlay | null }

export function createGridBattleRuntime(parent: HTMLElement, options: GridBattleRuntimeOptions): GridBattleRuntime {
  let destroyed = false;
  let failed = false;
  let ready = false;
  let lastTime = 0;
  let elapsed = 0;
  let scene: Phaser.Scene | undefined;
  let observer: ResizeObserver | undefined;
  let vfx: BattleVfx | undefined;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionPreference.matches;
  const font = getComputedStyle(document.body).fontFamily;

  // Board + camera
  let cols = 10, rows = 7;
  let zoom = 1;            // CSS px per world unit
  let uiScale = 1;         // world units per CSS px
  let camX = 0, camY = 0;  // camera centre (world)
  let cssW = 1, cssH = 1;
  let shakeUntil = 0, shakeAmp = 1.5;
  let background: Phaser.GameObjects.Image | undefined;
  let veil: Phaser.GameObjects.Rectangle | undefined;
  let boardGfx: Phaser.GameObjects.Graphics | undefined;
  let overlayGfx: Phaser.GameObjects.Graphics | undefined;
  let activeRing: Phaser.GameObjects.Ellipse | undefined;
  let activeMark: Phaser.GameObjects.Graphics | undefined;

  // Units + playback
  const actors: Actor[] = [];
  const actorById = new Map<string, Actor>();
  const effects: Effect[] = [];
  let textSerial = 0;
  let lastSeq = 0;
  let current: Playback | null = null;
  let playing = false;
  let idleSince = 0;
  let lastStepAt = -Infinity;
  let banner: { item: Phaser.GameObjects.Image; key: string; w: number; h: number; until: number } | null = null;

  // Overlay inputs
  let ui: GridBattleUi = { slot: null, aimed: null, hover: null, inspect: null };
  let drawnState: GridBattleState | null = null;
  let drawnUi: GridBattleUi | null = null;
  let drawnIdle = false;
  let drawnAuto = false;
  let unitsState: GridBattleState | null = null;
  let tapStart: { x: number; y: number; id: number } | null = null;
  let hoverKey = "";

  // ── Perspective ─────────────────────────────────────────────────────
  const rowScale = (v: number) => S_FAR + (1 - S_FAR) * v / rows;
  const rowY = (v: number) => TH * (S_FAR * v + (1 - S_FAR) * v * v / (2 * rows));
  const boardX = (u: number, v: number) => (u - cols / 2) * TW * rowScale(v);
  function rowOf(y: number): number {
    const a = TH * (1 - S_FAR) / (2 * rows), b = TH * S_FAR;
    return (-b + Math.sqrt(Math.max(0, b * b + 4 * a * y))) / (2 * a);
  }
  /** World point → board cell (null off the board). */
  function cellAt(wx: number, wy: number): Cell | null {
    const v = rowOf(wy);
    if (!(v >= 0 && v < rows)) return null;
    const u = wx / (TW * rowScale(v)) + cols / 2;
    if (!(u >= 0 && u < cols)) return null;
    return { x: Math.floor(u), y: Math.floor(v) };
  }
  function toWorld(clientX: number, clientY: number): Point {
    const rect = parent.getBoundingClientRect();
    return { x: camX + (clientX - rect.left - cssW / 2) / zoom, y: camY + (clientY - rect.top - cssH / 2) / zoom };
  }

  function fail(cause?: unknown) {
    if (destroyed || failed) return;
    failed = true;
    parent.dataset.ready = "false";
    if (cause) console.error("[battle] stage failed:", cause);
    options.onError(cause instanceof Error ? cause.message : typeof cause === "string" ? cause : undefined);
  }
  function onMotionChange(event: MediaQueryListEvent) {
    reduced = event.matches;
    parent.dataset.reducedMotion = String(reduced);
  }

  // ── Camera: fit the whole board (plus the far row's heads) into the field ──
  function resize() {
    if (destroyed) return;
    cssW = Math.max(1, Math.round(parent.clientWidth));
    cssH = Math.max(1, Math.round(parent.clientHeight));
    stage.fit(cssW, cssH);
    const left = boardX(0, rows) - 14, right = boardX(cols, rows) + 14;
    const top = -(FIGURE * S_FAR + 34), bottom = rowY(rows) + 14;
    zoom = Math.min(cssW / (right - left), cssH / (bottom - top));
    uiScale = 1 / zoom;
    const vw = cssW / zoom, vh = cssH / zoom;
    camX = (left + right) / 2;
    // Tall fields (portrait phones): stand the board low, on the painting's ground.
    camY = (top + bottom) / 2 - Math.max(0, vh - (bottom - top)) * 0.3;
    if (background) {
      const cover = Math.max(vw / background.width, vh / background.height);
      const h = background.height * cover;
      background.setPosition(camX, camY + vh / 2 - h / 2).setDisplaySize(background.width * cover, h);
    }
    veil?.setPosition(camX, camY).setSize(vw + 4, vh + 4);
    for (const actor of actors) placeTag(actor);
    if (banner) banner.item.setDisplaySize(banner.w * uiScale, banner.h * uiScale);
    placeCamera(0);
    parent.dataset.zoom = zoom.toFixed(3);
    drawnState = null; // redraw overlays at the new scale
  }
  function placeCamera(shake: number) {
    const camera = scene?.cameras.main;
    if (!camera) return;
    camera.setSize(stage.game.scale.width, stage.game.scale.height);
    camera.setZoom(zoom * stage.dpr);
    camera.centerOn(camX + shake, camY - shake * 0.4);
  }
  const view = () => ({ left: camX - cssW / zoom / 2, top: camY - cssH / zoom / 2, width: cssW / zoom, height: cssH / zoom });

  const stage: Stage = createStage(parent, "#1c0f0a", {
    create(created) {
      scene = created;
      observer = new ResizeObserver(resize);
      observer.observe(parent);
      void initialize().catch(fail);
    },
    update: (time) => update(time),
    contextLost: () => fail("WebGL context lost"),
    error: fail,
  });
  motionPreference.addEventListener("change", onMotionChange);
  parent.dataset.renderer = "phaser";
  parent.dataset.reducedMotion = String(reduced);
  parent.dataset.anim = "idle";
  parent.dataset.eventSeq = "0";

  // ── Text textures ───────────────────────────────────────────────────
  function textCanvas(text: string, color: string, size: number, kind: "plain" | "banner" | "tag" = "plain") {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Battle label canvas is unavailable");
    const scale = 2;
    context.font = `600 ${size * scale}px ${font}`;
    const pad = kind === "banner" ? 56 : kind === "tag" ? 10 : 20;
    const width = Math.min(560, Math.ceil(context.measureText(text).width / scale) + pad);
    const height = size + (kind === "tag" ? 8 : 20);
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.scale(scale, scale);
    if (kind === "banner") {
      context.fillStyle = "rgba(42, 22, 17, .9)";
      context.fillRect(0, 1, width, height - 2);
      context.fillStyle = "#9a7442";
      context.fillRect(12, 0, width - 24, 1.5);
      context.fillRect(12, height - 1.5, width - 24, 1.5);
      context.fillStyle = "#e2bd6a";
      context.fillRect(10, height / 2 - 2, 4, 4);
      context.fillRect(width - 14, height / 2 - 2, 4, 4);
    } else if (kind === "tag") {
      context.fillStyle = "rgba(24, 12, 9, .72)";
      context.fillRect(0, 0, width, height);
    }
    context.font = `600 ${size}px ${font}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    if (kind !== "tag") {
      context.strokeStyle = "#1a0d09";
      context.lineWidth = size >= 26 ? 6 : 4;
      context.strokeText(text, width / 2, height / 2 + 1, width - 12);
    }
    context.fillStyle = color;
    context.fillText(text, width / 2, height / 2 + 1, width - 8);
    return { canvas, width, height };
  }
  function textImage(text: string, color: string, size: number, kind: "plain" | "banner" | "tag" = "plain") {
    const { canvas, width, height } = textCanvas(text, color, size, kind);
    const key = `gbtext:${textSerial++}`;
    canvasTexture(scene!, key, canvas);
    const item = scene!.add.image(0, 0, key);
    return { item, key, width, height };
  }
  /** Floating text (damage numbers, captions) sized in CSS px so it reads on phones. */
  function floatText(text: string, color: string, size: number, x: number, y: number, life: number, grow = 0) {
    const t = textImage(text, color, size);
    t.item.setDepth(40);
    const effect: Effect = { item: t.item, key: t.key, born: elapsed, life: reduced ? Math.min(life, 700) : life,
      x, y, vy: reduced ? 0 : -40, w: t.width, h: t.height, grow: reduced ? 0 : grow };
    t.item.setPosition(x, y).setDisplaySize(t.width * uiScale, t.height * uiScale);
    effects.push(effect);
  }
  function showBanner(text: string, tier: number, duration: number) {
    clearBanner();
    const t = textImage(text, TIER_COLORS[tier] ?? TIER_COLORS[0], 16, "banner");
    t.item.setDepth(45).setDisplaySize(t.width * uiScale, t.height * uiScale);
    banner = { item: t.item, key: t.key, w: t.width, h: t.height, until: elapsed + duration };
  }
  function clearBanner() {
    if (!banner) return;
    banner.item.destroy();
    scene?.textures.remove(banner.key);
    banner = null;
  }

  // ── Board ───────────────────────────────────────────────────────────
  function quad(g: Phaser.GameObjects.Graphics, x: number, y: number, inset: number) {
    const x0 = x + inset, x1 = x + 1 - inset, y0 = y + inset, y1 = y + 1 - inset;
    g.beginPath();
    g.moveTo(boardX(x0, y0), rowY(y0));
    g.lineTo(boardX(x1, y0), rowY(y0));
    g.lineTo(boardX(x1, y1), rowY(y1));
    g.lineTo(boardX(x0, y1), rowY(y1));
    g.closePath();
  }
  function drawBoard(state: GridBattleState) {
    const g = boardGfx!;
    g.clear();
    // Soft ground shadow under the whole board.
    g.fillStyle(0x0d1a12, 0.22);
    g.beginPath();
    g.moveTo(boardX(-0.15, -0.1), rowY(-0.1));
    g.lineTo(boardX(cols + 0.15, -0.1), rowY(-0.1));
    g.lineTo(boardX(cols + 0.15, rows + 0.1), rowY(rows + 0.1));
    g.lineTo(boardX(-0.15, rows + 0.1), rowY(rows + 0.1));
    g.closePath();
    g.fillPath();
    const blocked = new Set(state.blocked);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const rock = blocked.has(`${x},${y}`);
        quad(g, x, y, 0.035);
        g.fillStyle(rock ? 0x3b2a1c : (x + y) % 2 ? 0x24402c : 0x2c4a33, rock ? 0.75 : 0.26);
        g.fillPath();
        g.lineStyle(1.4, 0xd8e6bd, rock ? 0.2 : 0.38);
        g.strokePath();
        if (rock) {
          const cx = boardX(x + 0.5, y + 0.55), cy = rowY(y + 0.55), s = rowScale(y + 0.5);
          g.fillStyle(0x6b5a44, 0.95);
          g.fillEllipse(cx, cy - 6 * s, TW * 0.5 * s, TH * 0.62 * s);
          g.fillStyle(0x8d7a5d, 0.9);
          g.fillEllipse(cx - 6 * s, cy - 11 * s, TW * 0.26 * s, TH * 0.3 * s);
        }
      }
    }
  }

  const unitAt = (state: GridBattleState, c: Cell) =>
    state.units.find((o) => o.alive && o.pos.x === c.x && o.pos.y === c.y) ?? null;

  function drawOverlay(state: GridBattleState, idle: boolean, auto: boolean) {
    const g = overlayGfx!;
    g.clear();
    let mode = "none";
    const playerTurn = idle && isPlayerTurn(state, auto);
    const active = state.activeId ? state.units.find((o) => o.id === state.activeId) : undefined;
    if (playerTurn && active) {
      if (ui.slot === null) {
        for (const path of reachableFor(state, active.id).values()) {
          const c = path[path.length - 1];
          if (c.x === active.pos.x && c.y === active.pos.y) continue;
          quad(g, c.x, c.y, 0.06);
          g.fillStyle(0x3f9cff, 0.34);
          g.fillPath();
          g.lineStyle(2, 0x9fd0ff, 0.9);
          g.strokePath();
          mode = "move";
        }
      } else {
        mode = "aim";
        const aim = aimableFor(state, active.id, ui.slot);
        const focus = ui.aimed ?? ui.hover;
        let focusValid = false;
        for (const c of aim) {
          if (focus && c.x === focus.x && c.y === focus.y) focusValid = true;
          quad(g, c.x, c.y, 0.06);
          g.fillStyle(0xe0523a, 0.28);
          g.fillPath();
          g.lineStyle(2, 0xff9a86, 0.85);
          g.strokePath();
        }
        if (focus && focusValid) {
          for (const c of previewArea(state, active.id, ui.slot, focus)) {
            quad(g, c.x, c.y, 0.1);
            g.fillStyle(0xffa53a, 0.5);
            g.fillPath();
            g.lineStyle(2.4, 0xffe0a0, 1);
            g.strokePath();
          }
          for (const t of targetsFor(state, active.id, ui.slot, focus)) {
            const s = rowScale(t.pos.y + 0.5);
            g.lineStyle(3, 0xffc24a, 1);
            g.strokeEllipse(boardX(t.pos.x + 0.5, t.pos.y + 0.5), rowY(t.pos.y + 0.5), TW * 0.8 * s, TH * 0.72 * s);
          }
          if (ui.aimed) {
            quad(g, ui.aimed.x, ui.aimed.y, 0.02);
            g.lineStyle(3, 0xffffff, 0.95);
            g.strokePath();
          }
        }
      }
      // The active unit's own tile, in gold.
      quad(g, active.pos.x, active.pos.y, 0.04);
      g.lineStyle(2.5, 0xf3c979, 0.95);
      g.strokePath();
    }
    if (ui.hover) {
      quad(g, ui.hover.x, ui.hover.y, 0.03);
      g.lineStyle(1.6, 0xffffff, 0.7);
      g.strokePath();
    }
    const inspected = ui.inspect ? state.units.find((o) => o.id === ui.inspect && o.alive) : undefined;
    if (inspected) {
      quad(g, inspected.pos.x, inspected.pos.y, 0.03);
      g.lineStyle(2, 0x9fe8ff, 0.95);
      g.strokePath();
    }
    parent.dataset.highlight = mode;
  }

  // ── Units ───────────────────────────────────────────────────────────
  const lookKey = (look: UnitLook) => look.kind === "creature" ? "creature"
    : look.still ? `still:${look.still}` : `char:${characterId(look.characterId)}`;

  interface LookTexture { key: string; kind: ActorKind; feet: number[]; directional: boolean; walk8?: boolean; w: number; h: number }
  const textures = new Map<string, Promise<LookTexture>>();
  function textureFor(look: UnitLook): Promise<LookTexture> {
    const key = lookKey(look);
    const cached = textures.get(key);
    if (cached) return cached;
    const pending = (async (): Promise<LookTexture> => {
      if (look.kind === "creature") {
        const image = await loadImage("/art/creature-atlas.png");
        const texture = scene!.textures.addImage(`gb:${key}`, image);
        if (!texture) throw new Error("Battle creature texture is unavailable");
        const feet: number[] = [];
        for (let cell = 0; cell < 8; cell++) {
          const column = cell % 4, row = Math.floor(cell / 4);
          const left = Math.round(column * image.width / 4), top = Math.round(row * image.height / 2);
          texture.add(cell, 0, left, top, Math.round((column + 1) * image.width / 4) - left, Math.round((row + 1) * image.height / 2) - top);
          feet.push(creatureFeet(image, cell));
        }
        return { key: `gb:${key}`, kind: "creature" as const, feet, directional: false, w: image.width / 4, h: image.height / 2 };
      }
      if (look.still) {
        try {
          const still = await stillAtlas(look.still);
          canvasTexture(scene!, `gb:${key}`, still.image);
          return { key: `gb:${key}`, kind: "still" as const, feet: [still.feetY / still.frameSize], directional: false, w: still.frameSize, h: still.frameSize };
        } catch {
          return textureFor({ kind: "character", characterId: look.characterId });
        }
      }
      const atlas = await loadCharacterAtlas(characterId(look.characterId));
      const texture = canvasTexture(scene!, `gb:${key}`, atlas.image);
      addGridFrames(texture, atlas.frameSize, atlas.columns, atlas.rows);
      return { key: `gb:${key}`, kind: "sheet" as const, feet: [atlas.feetY / atlas.frameSize], directional: atlas.directional, walk8: atlas.walk8,
        w: atlas.frameSize, h: atlas.frameSize };
    })();
    textures.set(key, pending);
    return pending;
  }

  async function makeActor(unit: GridUnit, index: number): Promise<Actor> {
    const tex = await textureFor(unit.look);
    const frame = tex.kind === "creature" && unit.look.kind === "creature" ? Math.max(0, Math.min(7, unit.look.frame)) : 0;
    const feet = tex.feet[tex.kind === "creature" ? frame : 0] ?? 0.94;
    const size = Math.max(0.6, Math.min(1.6, unit.look.size ?? 1));
    const dispH = (tex.kind === "creature" ? FRAME * 0.92 : FRAME) * size;
    const dispW = dispH * tex.w / tex.h;
    const head = tex.kind === "creature" ? dispH * feet * 0.72 : FIGURE * size;
    const image = scene!.add.image(0, 0, tex.key, tex.kind === "still" ? undefined : frame).setOrigin(0.5, feet);
    const shadow = scene!.add.ellipse(0, 0, TW * 0.56, TH * 0.4, 0x080604, 0.4).setDepth(3);
    const ring = scene!.add.ellipse(0, 0, TW * 0.72, TH * 0.6).setDepth(3.2);
    ring.isFilled = false;
    ring.setStrokeStyle(2, TEAM_RING[unit.team], 0.8);
    const tagText = unit.name.length > 12 ? `${unit.name.slice(0, 11)}…` : unit.name;
    const tagInfo = textImage(tagText, TEAM_TAG[unit.team], 11, "tag");
    tagInfo.item.setDepth(31);
    const bars = scene!.add.graphics().setDepth(30);
    const actor: Actor = {
      id: unit.id, team: unit.team, index, kind: tex.kind, directional: tex.directional, walk8: !!tex.walk8, walkDir: "E",
      image, shadow, ring, tag: tagInfo.item, tagW: tagInfo.width, tagH: tagInfo.height, bars, barsKey: "",
      dispW, dispH, head,
      u: unit.pos.x + 0.5, v: unit.pos.y + 0.5, hFacing: unit.facing === "left" ? -1 : 1,
      motion: "idle", motionStart: -index * 170, frame,
      walk: null, attack: null, lastGhost: 0, aura: null, hurtUntil: 0, flashUntil: 0, knockUntil: 0, knockX: 0, knockY: 0,
      dead: !unit.alive, deadAt: -10_000, fledAt: -1,
      hp: unit.hp, mp: unit.mp, maxHp: unit.derived.HP, maxMp: unit.derived.MP,
      x: 0, y: 0, s: 1,
      tint: unit.look.tint,
    };
    if (actor.dead) setMotion(actor, "defeat");
    placeTag(actor);
    return actor;
  }
  function placeTag(actor: Actor) {
    actor.tag.setDisplaySize(actor.tagW * uiScale, actor.tagH * uiScale);
    actor.bars.setScale(uiScale);
  }
  function setMotion(actor: Actor, motion: CharacterMotion) {
    if (actor.motion === motion) return;
    actor.motion = motion;
    actor.motionStart = elapsed;
  }
  function drawBars(actor: Actor) {
    const key = `${actor.hp}|${actor.mp}|${actor.dead}`;
    if (key === actor.barsKey) return;
    actor.barsKey = key;
    const g = actor.bars;
    g.clear();
    if (actor.dead) return;
    const w = 44, h = 5;
    const hp = actor.maxHp > 0 ? Math.max(0, Math.min(1, actor.hp / actor.maxHp)) : 0;
    g.fillStyle(0x140a07, 0.85);
    g.fillRect(-w / 2 - 1, -1, w + 2, h + 2 + (actor.team === "ally" && actor.maxMp > 0 ? 3 : 0));
    g.fillStyle(0x4a2a20, 1);
    g.fillRect(-w / 2, 0, w, h);
    g.fillStyle(hp < 0.25 ? 0xf0a33a : TEAM_HP[actor.team], 1);
    g.fillRect(-w / 2, 0, Math.round(w * hp), h);
    if (actor.team === "ally" && actor.maxMp > 0) {
      const mp = Math.max(0, Math.min(1, actor.mp / actor.maxMp));
      g.fillStyle(0x2a3550, 1);
      g.fillRect(-w / 2, h + 1, w, 2);
      g.fillStyle(0x6fa8ff, 1);
      g.fillRect(-w / 2, h + 1, Math.round(w * mp), 2);
    }
  }
  const chest = (actor: Actor): Point => ({ x: actor.x, y: actor.y - actor.head * actor.s * 0.52 });
  const cellPoint = (c: Cell): Point => ({ x: boardX(c.x + 0.5, c.y + 0.5), y: rowY(c.y + 0.5) });

  // Afterimages: a fading, glow-tinted copy of the sprite where the hero just was.
  const ghosts: { item: Phaser.GameObjects.Image; born: number }[] = [];
  function leaveGhost(actor: Actor) {
    const source = actor.image;
    const ghost = scene!.add.image(source.x, source.y, source.texture.key, source.frame.name)
      .setOrigin(source.originX, source.originY).setDisplaySize(source.displayWidth, source.displayHeight)
      .setFlipX(source.flipX).setRotation(source.rotation).setTint(actor.attack?.glow ?? 0xffffff)
      .setAlpha(0.42).setDepth(source.depth - 0.05);
    ghosts.push({ item: ghost, born: elapsed });
  }
  function updateGhosts() {
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const age = elapsed - ghosts[i].born;
      if (age >= 240) { ghosts[i].item.destroy(); ghosts.splice(i, 1); continue; }
      ghosts[i].item.setAlpha(0.42 * (1 - age / 240));
    }
  }

  function updateActor(actor: Actor, activeId: string | null) {
    // Board position (walking interpolates tile to tile).
    let hop = 0;
    let motion: CharacterMotion = actor.motion;
    if (actor.walk) {
      const { path, start, step } = actor.walk;
      const t = (elapsed - start) / step;
      const i = Math.min(path.length - 2, Math.max(0, Math.floor(t)));
      const k = Math.min(1, Math.max(0, t - i));
      const a = path[i], b = path[i + 1];
      if (t >= path.length - 1 || !b) {
        const end = path[path.length - 1];
        actor.u = end.x + 0.5; actor.v = end.y + 0.5;
        actor.walk = null;
        motion = "idle";
      } else {
        actor.u = a.x + 0.5 + (b.x - a.x) * k;
        actor.v = a.y + 0.5 + (b.y - a.y) * k;
        if (b.x !== a.x) actor.hFacing = b.x > a.x ? 1 : -1;
        actor.walkDir = dir8FromVector(b.x - a.x, b.y - a.y, actor.walkDir);
        motion = b.y < a.y && actor.directional ? "walkNorth" : b.y > a.y && actor.directional ? "walkSouth" : "walk";
        if (actor.kind !== "sheet" && !reduced) hop = Math.abs(Math.sin(k * Math.PI)) * 9;
      }
    }
    const s = rowScale(actor.v);
    let x = boardX(actor.u, actor.v), y = rowY(actor.v);
    let sx = 1, sy = 1, rotation = 0, alpha = 1;
    let ghostNow = false, auraNow = 0;

    // Attack lunge / support pose.
    if (actor.attack) {
      const age = elapsed - actor.attack.start;
      if (age > actor.attack.lastImpact + 360) actor.attack = null;
      else {
        motion = actor.attack.support ? "guard" : "attack";
        if (actor.attack.move && !reduced) {
          // The hero side moves by skill: sweep, cleave, strike, lunge, flurry, throw, play, channel or guard.
          const pose = heroPose(actor.attack.move, age, { hitDelay: actor.attack.hitDelay, lastImpact: actor.attack.lastImpact });
          const along = actor.attack.travel * pose.reach + pose.step * s;
          x += actor.attack.dx * along - actor.attack.dy * pose.side * s;
          y += actor.attack.dy * along + actor.attack.dx * pose.side * s;
          hop += pose.lift;
          rotation += pose.lean * actor.hFacing;
          sx *= pose.sx; sy *= pose.sy;
          ghostNow = pose.ghost;
          auraNow = pose.aura;
        } else if (actor.attack.travel > 0 && !reduced) {
          const approach = Math.min(1, Math.max(0, (age - 70) / 200));
          const retreat = Math.min(1, Math.max(0, (age - actor.attack.lastImpact - 65) / 220));
          const lunge = Math.sin(approach * Math.PI / 2) * (1 - retreat) * actor.attack.travel;
          x += actor.attack.dx * lunge; y += actor.attack.dy * lunge;
        }
        if (actor.kind !== "sheet" && !reduced && !actor.attack.support) {
          if (age < HIT_DELAY) { const k = age / HIT_DELAY; sx = 1 - 0.07 * k; sy = 1 + 0.07 * k; }
          else if (age < actor.attack.lastImpact + 120) {
            const k = ((age - HIT_DELAY) % HIT_GAP) / HIT_GAP;
            sx = 1.1 - 0.08 * k; sy = 0.9 + 0.08 * k;
          }
        }
      }
    }
    if (actor.dead) motion = "defeat";
    else if (actor.hurtUntil > elapsed && !actor.attack) motion = "hurt";
    else if (!actor.attack && !actor.walk && (motion === "hurt" || motion === "attack" || motion === "guard" || motion.startsWith("walk"))) motion = "idle";
    setMotion(actor, motion);

    // Knock-back when hurt.
    if (actor.knockUntil > elapsed && !reduced) {
      const k = (actor.knockUntil - elapsed) / 220;
      x += actor.knockX * Math.sin(k * Math.PI) * 9 * s;
      y += actor.knockY * Math.sin(k * Math.PI) * 5 * s;
    }
    const age = elapsed - actor.motionStart;
    if (actor.kind === "sheet") {
      let frame = actor.frame;
      if (motion === "attack" && actor.attack) {
        const a = elapsed - actor.attack.start;
        frame = reduced ? 10 : a < 135 ? 8 : a < HIT_DELAY ? 9 : a < actor.attack.lastImpact + 100 ? 10 + (Math.floor((a - HIT_DELAY) / HIT_GAP) % 2) : 11;
      } else if (actor.walk8 && motion.startsWith("walk")) {
        frame = walk8Frame(actor.walkDir, reduced ? null : Math.floor(Math.max(0, age) * WALK8_FPS / 1000) % 4).frame;
      } else {
        const clip = CHARACTER_CLIPS[motion];
        const progress = reduced && motion === "idle" ? 0 : Math.floor(Math.max(0, age) * clip.fps / 1000);
        frame = clip.frames[clip.repeat === -1 ? progress % clip.frames.length : Math.min(progress, clip.frames.length - 1)];
      }
      if (frame !== actor.frame) { actor.image.setFrame(frame, false, false); actor.frame = frame; }
      if (motion === "defeat") alpha = 0.78;
    } else {
      // Procedural motion for single-pose stills and creature-atlas beasts.
      if (!reduced && motion === "idle") { const b = Math.sin(elapsed / 450 + actor.index * 1.7) * 0.016; sy *= 1 + b; sx *= 1 - b * 0.5; }
      if (!reduced && motion === "victory") hop = Math.abs(Math.sin(elapsed / 260)) * 7;
      if (motion === "hurt" && !reduced) rotation = -actor.hFacing * 0.08;
      if (motion === "defeat") {
        const k = reduced ? 1 : Math.min(1, (elapsed - actor.deadAt) / 480);
        const ease = 1 - (1 - k) * (1 - k);
        rotation = -actor.hFacing * 1.35 * ease;
        alpha = 1 - 0.62 * ease;
      }
    }
    if (actor.fledAt >= 0) alpha *= Math.max(0, 1 - (elapsed - actor.fledAt) / 500);

    actor.x = x; actor.y = y; actor.s = s;
    const creature = actor.kind === "creature";
    const walkingVertical = motion === "walkNorth" || motion === "walkSouth";
    actor.image.setPosition(Math.round(x), y - hop * s)
      .setDisplaySize(actor.dispW * s * sx, actor.dispH * s * sy)
      .setFlipX(actor.walk8 && motion.startsWith("walk") ? walk8Source(actor.walkDir).mirror
        : walkingVertical ? false : creature ? actor.hFacing > 0 : actor.hFacing < 0)
      .setRotation(rotation).setAlpha(alpha)
      .setDepth(5 + actor.v * 2 + actor.index * 0.001 + (actor.attack ? 0.5 : 0));
    if (actor.flashUntil > elapsed) actor.image.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    else if (actor.tint !== undefined) actor.image.setTint(actor.tint).setTintMode(Phaser.TintModes.MULTIPLY);
    else actor.image.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    if (ghostNow && elapsed - actor.lastGhost > 45) { actor.lastGhost = elapsed; leaveGhost(actor); }
    if (auraNow > 0 || actor.aura) {
      actor.aura ??= scene!.add.ellipse(0, 0, TW * 0.95, TW * 0.36, actor.attack?.glow ?? 0xbfeaff, 1);
      actor.aura.setPosition(x, y + 2 * s).setScale(s * (1 + 0.08 * auraNow)).setFillStyle(actor.attack?.glow ?? 0xbfeaff, 0.5 * auraNow)
        .setVisible(auraNow > 0).setDepth(5 + actor.v * 2 - 0.2);
    }
    actor.shadow.setPosition(x, y + 2 * s).setScale(s * (creature ? 1.3 : 1)).setAlpha(actor.dead ? 0.15 : 0.4 * alpha);
    const active = activeId === actor.id && !actor.dead;
    actor.ring.setPosition(x, y + 2 * s).setScale(s).setVisible(!actor.dead && actor.fledAt < 0);
    actor.ring.setAlpha(active ? 0 : 0.7);
    // Name tag + bars over the head.
    const headY = y - hop * s - actor.head * s * sy;
    const showTag = !actor.dead && actor.fledAt < 0 && (TW * s * zoom >= 46 || active || ui.inspect === actor.id);
    actor.tag.setVisible(showTag).setPosition(Math.round(x), headY - 16 * uiScale);
    actor.bars.setVisible(!actor.dead && actor.fledAt < 0).setPosition(Math.round(x), headY - 7 * uiScale);
    actor.tag.setDepth(31 + actor.v * 0.1);
    actor.bars.setDepth(30 + actor.v * 0.1);
    drawBars(actor);
    if (active && activeRing && activeMark) {
      const pulse = reduced ? 0 : Math.sin(elapsed / 220) * 0.06;
      activeRing.setVisible(true).setPosition(x, y + 2 * s).setScale(s * (1 + pulse)).setAlpha(0.95);
      const bob = reduced ? 0 : Math.sin(elapsed / 260) * 4;
      activeMark.setVisible(true).setPosition(Math.round(x), headY - (showTag ? 30 : 16) * uiScale + bob * uiScale).setScale(uiScale);
    }
  }

  // ── Event playback ──────────────────────────────────────────────────
  function nextEvent(state: GridBattleState): GridEvent | null {
    const events = state.events;
    for (let i = 0; i < events.length; i++) if (events[i].seq > lastSeq) return events[i];
    return null;
  }
  function caption(actor: Actor | undefined, text: string, color = "#f7eedb") {
    if (!actor) return;
    floatText(text, color, 15, actor.x, actor.y - actor.head * actor.s - 26 * uiScale, 900);
  }
  function startEvent(ev: GridEvent, state: GridBattleState) {
    const pace = reduced ? 0.5 : 1;
    let duration = 300;
    let cast: CastPlay | null = null;
    switch (ev.t) {
      case "move": {
        const actor = actorById.get(ev.unitId);
        const step = reduced ? 60 : WALK_MS;
        if (actor && ev.path.length > 1) actor.walk = { path: ev.path, start: elapsed, step };
        duration = Math.max(0, ev.path.length - 1) * step + 30;
        break;
      }
      case "cast": {
        const actor = actorById.get(ev.unitId);
        const profile = castVfx({ tier: ev.tier, source: ev.source });
        const hits = Math.max(1, ...ev.results.map((r) => r.damages.length));
        const support = ev.results.every((r) => r.damages.length === 0);
        const delay = reduced ? 150 : HIT_DELAY;
        const gap = reduced ? 80 : HIT_GAP;
        const lastImpact = delay + (hits - 1) * gap;
        const killed = ev.results.some((r) => r.killed);
        cast = { ev, vfx: profile, hits, nextHit: 0, lastImpact, healed: false, killed, support };
        duration = lastImpact + (reduced ? 320 : 520) + (killed ? 380 * pace : 0);
        if (actor) {
          const aim = cellPoint(ev.aimed);
          const ownCell = Math.abs(actor.u - 0.5 - ev.aimed.x) < 0.01 && Math.abs(actor.v - 0.5 - ev.aimed.y) < 0.01;
          if (ev.aimed.x !== Math.round(actor.u - 0.5)) actor.hFacing = ev.aimed.x > actor.u - 0.5 ? 1 : -1;
          else {
            const firstFoe = ev.results.map((r) => actorById.get(r.unitId)).find((a) => a && a !== actor);
            if (firstFoe && Math.abs(firstFoe.u - actor.u) > 0.01) actor.hFacing = firstFoe.u > actor.u ? 1 : -1;
          }
          const ranged = profile.shape === "projectile" || profile.shape === "wave" || profile.shape === "orb";
          const dx = aim.x - actor.x, dy = aim.y - actor.y;
          const dist = Math.hypot(dx, dy);
          const tiles = Math.abs(actor.u - 0.5 - ev.aimed.x) + Math.abs(actor.v - 0.5 - ev.aimed.y);
          const move = actor.team === "ally" ? heroMoveFor(profile, { support }) : undefined;
          const melee = !support && !ownCell && tiles <= 2 && (move ? movesIn(move) : !ranged);
          const travel = melee ? Math.max(0, dist - TW * 0.55 * actor.s) : 0;
          actor.attack = { start: elapsed, lastImpact, hitDelay: delay, dx: dist ? dx / dist : 0, dy: dist ? dy / dist : 0, travel, support,
            move, glow: profile.glow };
          parent.dataset.heroMove = move ?? parent.dataset.heroMove ?? "";
          if (!support) castStartSfx(profile);
          if (!reduced && !support && vfx) {
            const firstTarget = ev.results.map((r) => actorById.get(r.unitId)).find((a) => a && a !== actor);
            const hitTimes: number[] = [];
            for (let i = 0; i < hits; i++) hitTimes.push(delay + i * gap);
            vfx.cast(profile, chest(actor), firstTarget ? chest(firstTarget) : { x: aim.x, y: aim.y - 50 * actor.s },
              actor.hFacing, hitTimes, elapsed, duration);
          }
        }
        showBanner(ev.name, ev.tier, duration);
        parent.dataset.vfxTier = String(profile.tier);
        parent.dataset.vfxShape = profile.shape;
        parent.dataset.vfxElement = profile.element;
        break;
      }
      case "wait": caption(actorById.get(ev.unitId), "รอจังหวะ", "#e6dcc0"); duration = reduced ? 250 : 480; break;
      case "stunned": {
        const actor = actorById.get(ev.unitId);
        if (actor) { actor.hurtUntil = elapsed + 320; actor.knockUntil = elapsed + 220; actor.knockX = -actor.hFacing; actor.knockY = 0; }
        caption(actor, "ถูกสตัน · ข้ามตา", "#fff27a");
        duration = reduced ? 350 : 700;
        break;
      }
      case "flee": {
        const actor = actorById.get(ev.unitId);
        caption(actor, ev.success ? "หนีรอด!" : "หนีไม่พ้น", ev.success ? "#bff0cf" : "#ffc2ae");
        if (actor && ev.success) { actor.hFacing = actor.team === "ally" ? -1 : 1; actor.fledAt = elapsed + 150; }
        duration = reduced ? 350 : 700;
        break;
      }
      case "end": {
        for (const actor of actors) {
          const unit = state.units.find((o) => o.id === actor.id);
          if (ev.winner && unit?.alive && unit.team === ev.winner && actor.fledAt < 0) setMotion(actor, "victory");
        }
        duration = reduced ? 300 : 650;
        break;
      }
    }
    current = { ev, start: elapsed, duration, cast };
    setPlaying(true);
  }
  function castHit(play: CastPlay, index: number) {
    const caster = actorById.get(play.ev.unitId);
    let anyHit = false, anyMiss = false, anyCrit = false;
    for (const r of play.ev.results) {
      const target = actorById.get(r.unitId);
      if (!target) continue;
      if (play.support) {
        if (index === 0 && !reduced && vfx) vfx.support(play.vfx, { x: target.x, y: target.y }, target.head * target.s * 0.8, elapsed);
        continue;
      }
      if (index >= r.damages.length) continue;
      const damage = r.damages[index] ?? 0;
      const missed = !!r.misses[index];
      const crit = !!r.crits[index];
      const at = chest(target);
      const dir: 1 | -1 = caster ? (target.x >= caster.x ? 1 : -1) : 1;
      const onAlly = target.team === "ally";
      const color = missed ? "#c7d3c5" : crit ? "#ffd24a" : onAlly ? "#ff7a64" : "#fff0c8";
      const text = missed ? "พลาด" : damage > 0 ? String(damage) : "ปราณ";
      const jitter = ((index % 3) - 1) * 12 * uiScale;
      floatText(text, color, missed ? 16 : crit ? 28 : 22, target.x + jitter,
        target.y - target.head * target.s - (18 + (index % 2) * 14) * uiScale, 900, crit ? 0.12 : 0);
      if (crit && !missed && damage > 0) floatText("暴擊", "#ffe9a8", 13, target.x + jitter, target.y - target.head * target.s - 44 * uiScale, 900);
      if (missed) {
        anyMiss = true;
        if (!reduced && vfx) vfx.whiff(play.vfx, at, dir, index, elapsed);
        continue;
      }
      anyHit = true; anyCrit ||= crit;
      if (damage > 0) {
        target.hp = Math.max(0, target.hp - damage);
        target.hurtUntil = elapsed + 220;
        target.flashUntil = elapsed + 90;
        target.knockUntil = elapsed + 220;
        const kx = caster ? target.x - caster.x : dir, ky = caster ? target.y - caster.y : 0;
        const kl = Math.hypot(kx, ky) || 1;
        target.knockX = kx / kl; target.knockY = ky / kl;
      }
      if (!reduced && vfx) {
        vfx.impact(play.vfx, at, caster ? chest(caster) : at, dir, index, crit, elapsed);
        if (damage > 0) { shakeAmp = 1.2 + play.vfx.tier * 0.5 + (crit ? 1 : 0); shakeUntil = elapsed + (crit ? 85 : 55) + play.vfx.tier * 20; }
      }
    }
    if (play.support) { if (index === 0) supportSfx(play.vfx); }
    else if (anyHit) impactSfx(play.vfx, index, anyCrit);
    else if (anyMiss) whiffSfx(play.vfx);
    parent.dataset.impactCount = String(Number(parent.dataset.impactCount ?? "0") + 1);
  }
  function advancePlayback(state: GridBattleState) {
    const play = current!;
    const age = elapsed - play.start;
    const cast = play.cast;
    if (cast) {
      const delay = reduced ? 150 : HIT_DELAY, gap = reduced ? 80 : HIT_GAP;
      while (cast.nextHit < cast.hits && age >= delay + cast.nextHit * gap) castHit(cast, cast.nextHit++);
      if (!cast.healed && age >= cast.lastImpact + 120) {
        cast.healed = true;
        for (const r of cast.ev.results) {
          const target = actorById.get(r.unitId);
          if (!target || r.healed <= 0) continue;
          target.hp = Math.min(target.maxHp, target.hp + r.healed);
          floatText(`+${r.healed}`, "#9ff0b4", 20, target.x, target.y - target.head * target.s - 30 * uiScale, 900);
        }
      }
      if (cast.killed && age >= cast.lastImpact + 200) {
        cast.killed = false;
        for (const r of cast.ev.results) {
          const target = actorById.get(r.unitId);
          if (target && r.killed && !target.dead) { target.dead = true; target.deadAt = elapsed; target.hp = 0; }
        }
      }
    }
    if (age >= play.duration) {
      lastSeq = play.ev.seq;
      parent.dataset.eventSeq = String(lastSeq);
      options.onPlayed?.(lastSeq);
      current = null;
      idleSince = elapsed;
      const next = nextEvent(state);
      if (next) startEvent(next, state);
    }
  }
  function setPlaying(value: boolean) {
    if (playing === value) return;
    playing = value;
    parent.dataset.anim = value ? "playing" : "idle";
    options.onAnim(value);
  }
  /** Snap every actor to the engine state (after the queue drains, or on start). */
  function syncActors(state: GridBattleState, initial: boolean) {
    for (const unit of state.units) {
      const actor = actorById.get(unit.id);
      if (!actor) continue;
      if (!actor.walk) { actor.u = unit.pos.x + 0.5; actor.v = unit.pos.y + 0.5; }
      if (unit.facing === "left") actor.hFacing = -1;
      else if (unit.facing === "right") actor.hFacing = 1;
      actor.hp = unit.hp; actor.mp = unit.mp;
      actor.maxHp = unit.derived.HP; actor.maxMp = unit.derived.MP;
      if (!unit.alive && !actor.dead) { actor.dead = true; actor.deadAt = initial ? -10_000 : elapsed; }
      if (unit.alive && actor.dead) { actor.dead = false; setMotion(actor, "idle"); }
    }
    if (initial && state.phase === "over") {
      for (const actor of actors) {
        const unit = state.units.find((o) => o.id === actor.id);
        if (state.winnerTeam && unit?.alive && unit.team === state.winnerTeam) setMotion(actor, "victory");
      }
    }
  }
  function publishUnits(state: GridBattleState) {
    if (unitsState === state) return;
    unitsState = state;
    parent.dataset.units = JSON.stringify(state.units.map((u) => ({ id: u.id, team: u.team, x: u.pos.x, y: u.pos.y, hp: u.hp, alive: u.alive })));
    parent.dataset.phase = state.phase;
    parent.dataset.activeUnit = state.activeId ?? "";
  }

  // ── Frame loop ──────────────────────────────────────────────────────
  function update(now: number) {
    if (destroyed || failed || !ready) return;
    const delta = lastTime ? Math.min(100, Math.max(0, now - lastTime)) : 0;
    lastTime = now;
    const paused = document.hidden || !!document.querySelector('[role="dialog"], dialog[open]');
    if (parent.dataset.paused !== String(paused)) parent.dataset.paused = String(paused);
    if (paused) return;
    try {
      elapsed += delta;
      const store = useBattleStore.getState();
      const state = store.state;
      if (!state) return;
      publishUnits(state);
      if (current) advancePlayback(state);
      if (!current) {
        const next = nextEvent(state);
        if (next) startEvent(next, state);
        else if (playing) {
          syncActors(state, false);
          setPlaying(false);
        }
      }
      // Pace the AI: one visible beat after the last animation settles.
      if (!current && !playing && state.phase !== "over" && !isPlayerTurn(state, store.auto)) {
        const pace = (reduced ? 200 : STEP_PACE) * (state.phase === "moved" ? 0.6 : 1);
        if (elapsed - idleSince >= pace && elapsed - lastStepAt >= pace) {
          lastStepAt = elapsed;
          store.step();
        }
      }
      const idle = !current && !playing;
      if (drawnState !== state || drawnUi !== ui || drawnIdle !== idle || drawnAuto !== store.auto) {
        drawnState = state; drawnUi = ui; drawnIdle = idle; drawnAuto = store.auto;
        drawOverlay(state, idle, store.auto);
      }
      const activeId = idle ? state.activeId : current?.ev && "unitId" in current.ev ? current.ev.unitId : null;
      activeRing?.setVisible(false);
      activeMark?.setVisible(false);
      for (let i = 0; i < actors.length; i++) updateActor(actors[i], activeId);
      updateGhosts();

      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        const age = elapsed - effect.born;
        if (age >= effect.life) {
          effect.item.destroy();
          scene?.textures.remove(effect.key);
          effects.splice(i, 1);
          continue;
        }
        const t = age / effect.life;
        const growth = 1 + t * effect.grow;
        effect.item.setPosition(effect.x, effect.y + effect.vy * uiScale * age / 1000)
          .setDisplaySize(effect.w * uiScale * growth, effect.h * uiScale * growth)
          .setAlpha(Math.min(1, (1 - t) * 2.3));
      }
      if (banner) {
        const v = view();
        banner.item.setPosition(camX, v.top + (banner.h / 2 + 8) * uiScale)
          .setAlpha(Math.min(1, Math.max(0, (banner.until - elapsed) / 180)));
        if (elapsed >= banner.until) clearBanner();
      }
      if (vfx) vfx.update(elapsed);
      placeCamera(!reduced && elapsed < shakeUntil ? Math.sin(elapsed * 0.13) * shakeAmp : 0);
    } catch (error) { fail(error); }
  }

  // ── Input (DOM pointer → board cell) ────────────────────────────────
  function pick(clientX: number, clientY: number): { cell: Cell | null; unitId: string | null } {
    const state = useBattleStore.getState().state;
    const p = toWorld(clientX, clientY);
    let cell = cellAt(p.x, p.y);
    let unit = state && cell ? unitAt(state, cell) : null;
    if (state && !unit) {
      // A tap on a unit's body (which stands over the tile behind it) picks that unit.
      let best: Actor | null = null;
      for (const actor of actors) {
        if (actor.dead || actor.fledAt >= 0) continue;
        const half = TW * 0.32 * actor.s;
        if (p.x < actor.x - half || p.x > actor.x + half || p.y > actor.y || p.y < actor.y - actor.head * actor.s) continue;
        if (!best || actor.v > best.v) best = actor;
      }
      if (best) {
        const u = state.units.find((o) => o.id === best!.id && o.alive);
        if (u) { unit = u; cell = { ...u.pos }; }
      }
    }
    return { cell, unitId: unit?.id ?? null };
  }
  function pointerDown(event: PointerEvent) {
    if (!ready || event.button > 0) return;
    tapStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  }
  function pointerUp(event: PointerEvent) {
    if (!ready || !tapStart || tapStart.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
    tapStart = null;
    if (moved > 12) return;
    const { cell, unitId } = pick(event.clientX, event.clientY);
    options.onTap(cell, unitId, event.pointerType || "mouse");
  }
  function pointerMove(event: PointerEvent) {
    if (!ready || event.pointerType !== "mouse") return;
    const { cell } = pick(event.clientX, event.clientY);
    const key = cell ? `${cell.x},${cell.y}` : "";
    if (key === hoverKey) return;
    hoverKey = key;
    options.onHover(cell);
  }
  function pointerLeave() {
    if (hoverKey === "") return;
    hoverKey = "";
    options.onHover(null);
  }
  // Test / tooling hook: viewport coordinates of a cell's centre (null before the stage is ready).
  (parent as GridBattleHost).gridCellPoint = (x: number, y: number) => {
    if (!ready) return null;
    const rect = parent.getBoundingClientRect();
    const p = cellPoint({ x, y });
    return { x: rect.left + cssW / 2 + (p.x - camX) * zoom, y: rect.top + cssH / 2 + (p.y - camY) * zoom };
  };
  parent.addEventListener("pointerdown", pointerDown);
  parent.addEventListener("pointerup", pointerUp);
  parent.addEventListener("pointermove", pointerMove);
  parent.addEventListener("pointerleave", pointerLeave);

  // ── Boot ────────────────────────────────────────────────────────────
  async function initialize() {
    const state = useBattleStore.getState().state;
    if (!state) throw new Error("No battle to draw");
    cols = state.cols; rows = state.rows;
    const backdrop = options.background ?? BATTLE_BACKGROUNDS.courtyard;
    const backgroundImage = await loadImage(backdrop.image);
    if (destroyed || failed || !scene) return;
    parent.dataset.backgroundImage = backdrop.image;
    scene.textures.addImage("gb:backdrop", backgroundImage);
    background = scene.add.image(0, 0, "gb:backdrop").setDepth(0);
    veil = scene.add.rectangle(0, 0, 10, 10, 0x1c0f0a, 0.18).setDepth(0.5);
    boardGfx = scene.add.graphics().setDepth(1);
    overlayGfx = scene.add.graphics().setDepth(2);
    activeRing = scene.add.ellipse(0, 0, TW * 0.86, TH * 0.74).setDepth(3.4).setVisible(false);
    activeRing.isFilled = false;
    activeRing.setStrokeStyle(3, 0xf3c979, 1);
    activeMark = scene.add.graphics().setDepth(33).setVisible(false);
    activeMark.fillStyle(0x1a0d09, 0.9);
    activeMark.fillTriangle(-9, -11, 9, -11, 0, 2);
    activeMark.fillStyle(0xf3c979, 1);
    activeMark.fillTriangle(-6.5, -9.5, 6.5, -9.5, 0, -0.5);
    drawBoard(state);
    const made = await Promise.all(state.units.map((unit, index) => makeActor(unit, index)));
    if (destroyed || failed) return;
    for (const actor of made) { actors.push(actor); actorById.set(actor.id, actor); }
    vfx = createBattleVfx(scene, view);
    // Join mid-battle (remount / retry): history is not replayed.
    const latest = useBattleStore.getState().state ?? state;
    lastSeq = latest.events.length ? latest.events[latest.events.length - 1].seq : 0;
    parent.dataset.eventSeq = String(lastSeq);
    syncActors(latest, true);
    publishUnits(latest);
    ready = true;
    resize();
    options.onPlayed?.(lastSeq);
    options.onReady();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    motionPreference.removeEventListener("change", onMotionChange);
    parent.removeEventListener("pointerdown", pointerDown);
    parent.removeEventListener("pointerup", pointerUp);
    parent.removeEventListener("pointermove", pointerMove);
    parent.removeEventListener("pointerleave", pointerLeave);
    delete (parent as GridBattleHost).gridCellPoint;
    vfx?.destroy();
    stage.destroy();
  }

  return {
    setUi(next) { ui = next; },
    destroy,
  };
}

/** A unique NPC sprite in one 128 px frame, with the archetype sheets' figure height and feet line. */
async function stillAtlas(url: string) {
  const image = await loadImage(url);
  const unit = Math.max(1, image.height / 108, image.width / 124);
  const size = Math.round(CHARACTER_FRAME_SIZE * unit), feet = Math.round(CHARACTER_FEET_Y * unit);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Battle sprite canvas is unavailable");
  context.imageSmoothingEnabled = false;
  const scale = Math.min(108 * unit / image.height, 124 * unit / image.width);
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  context.drawImage(image, Math.round((size - width) / 2), feet - height, width, height);
  return { image: canvas, frameSize: size, feetY: feet };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Battle artwork failed to load: ${url}`));
    image.src = url;
  });
}

/** Visible feet line of one creature-atlas cell (0..1 of the cell height). */
function creatureFeet(image: HTMLImageElement, frame: number): number {
  const column = frame % 4;
  const row = Math.floor(frame / 4);
  const left = Math.round(column * image.width / 4);
  const top = Math.round(row * image.height / 2);
  const width = Math.round((column + 1) * image.width / 4) - left;
  const height = Math.round((row + 1) * image.height / 2) - top;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return 1;
  context.drawImage(image, left, top, width, height, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  for (let index = pixels.length - 1; index >= 3; index -= 4) {
    if (pixels[index] > 32) return (Math.floor(index / 4 / width) + 1) / height;
  }
  return 1;
}
