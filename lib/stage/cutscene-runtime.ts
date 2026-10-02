import type * as Phaser from "phaser";
import { CHARACTER_CLIPS, characterId, type CharacterMotion } from "../characters/catalog";
import { loadCharacterAtlas } from "../characters/sheet";
import { getLocationMap } from "../world/data/location-maps";
import type { CastMember, CutsceneBeat, CutsceneDef, CutsceneFx, CutsceneMood, StagePoint } from "../world/story/types";
import { addGridFrames, canvasTexture, createStage, drawCanvas, type Stage } from "./phaser-stage";
import { nearestWorldGround, worldFootprints, type WorldFootprint } from "./world-navigation";
import { composedFootprints, composedMapFor, mapBackdrop } from "../world/data/composed";
import { warmWorldCharacter } from "./world-style";

/**
 * Cutscene player: a short film staged on a location's painted map, in the
 * manner of Wandering Sword's in-engine scenes. Actors (character sheets,
 * rigged NPCs, the hero, beasts) walk, fight and fall on the map while the
 * DOM layer (components/world/cutscene-player.tsx) shows subtitles, title
 * cards, letterbox, fades and the mood grade. Beats run in order; lines wait
 * for advance() (or the auto timer). Phaser input stays off; the component
 * owns input.
 */

const WIDTH = 960;
const HEIGHT = 640;

function scaleFootprints(footprints: readonly WorldFootprint[], sx: number, sy: number): WorldFootprint[] {
  return footprints.map((f) => f.kind === "rect"
    ? { kind: "rect", left: f.left * sx, right: f.right * sx, top: f.top * sy, bottom: f.bottom * sy }
    : { kind: "ellipse", x: f.x * sx, y: f.y * sy, radiusX: f.radiusX * sx, radiusY: f.radiusY * sy });
}
const STEP_X = 26;
const STEP_Y = 18;
const ACTOR_SIZE = 56;
const WALK_SPEED = 70;
const RUN_SPEED = 150;

export type CutsceneLine = { kind: "say" | "think" | "narrate"; speaker?: string; actor?: string; text: string };

export interface CutsceneView {
  ready(): void;
  line(line: CutsceneLine | null): void;
  title(card: { text: string; sub?: string } | null): void;
  /** "black" / "white" fade over `ms`, "clear" to remove, "flash" a white blink. */
  fade(to: "black" | "white" | "clear" | "flash", ms: number): void;
  mood(mood: CutsceneMood): void;
  beat(index: number): void;
  done(): void;
  error(message: string): void;
}

export interface CutsceneRuntime {
  /** Tap: finish the current line and move on. */
  advance(): void;
  setAuto(on: boolean): void;
  skip(): void;
  destroy(): void;
}

type Actor = {
  key: string;
  member: CastMember;
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  kind: "sheet" | "beast";
  directional: boolean;
  frames: number;
  x: number; y: number;
  facingLeft: boolean;
  motion: CharacterMotion;
  motionAt: number;
  heading: "side" | "north" | "south";
  target: { x: number; y: number; speed: number; resolve: () => void } | null;
  alpha: number; fadeTo: number;
  lunge: number;
};

type Particle = { image: Phaser.GameObjects.Image; vx: number; vy: number; life: number; age: number; spin: number; fade: boolean; grow: number };

export function createCutsceneRuntime(parent: HTMLElement, def: CutsceneDef, options: {
  heroBody: string; heroName: string; reducedMotion: boolean;
}, view: CutsceneView): CutsceneRuntime {
  const map = getLocationMap(def.stage);
  const sub = (text: string) => text.split("{hero}").join(options.heroName);
  let scene: Phaser.Scene | undefined;
  let disposed = false;
  let auto = false;
  let skipping = false;
  let lastTime = 0;
  let elapsed = 0;
  let waitingLine: (() => void) | null = null;
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  const actors = new Map<string, Actor>();
  const particles: Particle[] = [];
  const ambient: { kind: "petals" | "snow" | "rain"; until: number } = { kind: "petals", until: 0 };
  let weather: "snow" | "rain" | null = null;
  let camera = { x: WIDTH / 2, y: HEIGHT / 2, zoom: 2.4, tx: WIDTH / 2, ty: HEIGHT / 2, tzoom: 2.4 };
  // A composed (asset-built) stage plays on its 960 × 640 overview picture, its solids scaled to match.
  const composed = map ? composedMapFor(map.image) : undefined;
  const footprints = !map ? [] : composed
    ? scaleFootprints(composedFootprints(composed), WIDTH / composed.width, HEIGHT / composed.height)
    : worldFootprints(def.stage, map.image);
  const anchorPct = (def.around && map?.npcSpots?.[def.around]) || map?.spawn || { x: 50, y: 55 };
  const anchor = { x: anchorPct.x * WIDTH / 100, y: anchorPct.y * HEIGHT / 100 };
  const toStage = (at: StagePoint) => {
    const raw = { x: anchor.x + at[0] * STEP_X, y: anchor.y + at[1] * STEP_Y };
    return footprints.length ? nearestWorldGround(raw, footprints) : raw;
  };
  camera = { ...camera, x: anchor.x, y: anchor.y - 20, tx: anchor.x, ty: anchor.y - 20 };

  const stage: Stage = createStage(parent, "#0d0a08", {
    create(created) { scene = created; resize(); void build().catch((e) => fail(e)); },
    update: (time) => tick(time),
    contextLost: () => fail("WebGL context lost"),
    error: (e) => fail(e),
  });

  function fail(cause: unknown) {
    if (disposed) return;
    view.error(cause instanceof Error ? cause.message : String(cause));
  }
  function resize() {
    stage.fit(Math.max(parent.clientWidth, 1), Math.max(parent.clientHeight, 1));
  }
  const observer = new ResizeObserver(resize);
  observer.observe(parent);

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Cannot load ${src}`));
      image.src = src;
    });
  }

  async function build() {
    if (!scene) return;
    const background = await loadImage(map ? mapBackdrop(map.image) : "/art/jade-courtyard.png");
    if (disposed || !scene) return;
    canvasTexture(scene, "cs:map", drawCanvas(WIDTH, HEIGHT, (c) => c.drawImage(background, 0, 0, WIDTH, HEIGHT)));
    scene.add.image(0, 0, "cs:map").setOrigin(0, 0).setDepth(-1);
    canvasTexture(scene, "cs:shadow", drawCanvas(64, 24, (c) => {
      c.fillStyle = "rgba(20, 16, 10, 0.42)"; c.beginPath(); c.ellipse(32, 12, 24, 7, 0, 0, Math.PI * 2); c.fill();
    }));
    canvasTexture(scene, "cs:dot", drawCanvas(8, 8, (c) => { c.fillStyle = "#fff"; c.beginPath(); c.arc(4, 4, 4, 0, Math.PI * 2); c.fill(); }));
    canvasTexture(scene, "cs:petal", drawCanvas(6, 4, (c) => { c.fillStyle = "#f6b8c8"; c.beginPath(); c.ellipse(3, 2, 3, 2, 0.4, 0, Math.PI * 2); c.fill(); }));
    canvasTexture(scene, "cs:streak", drawCanvas(2, 10, (c) => { c.fillStyle = "rgba(200,220,255,0.7)"; c.fillRect(0, 0, 2, 10); }));
    // Cast textures.
    const needs = new Set<string>();
    for (const member of Object.values(def.cast)) needs.add(lookKey(member.look));
    await Promise.all([...needs].map(async (key) => {
      if (key === "beast") {
        const image = await loadImage("/art/creature-atlas.png");
        if (!scene || scene.textures.exists("cs:beast")) return;
        const texture = scene.textures.addImage("cs:beast", image);
        if (!texture) return;
        for (let cell = 0; cell < 8; cell++) {
          const column = cell % 4, row = Math.floor(cell / 4);
          const left = Math.round(column * image.width / 4), top = Math.round(row * image.height / 2);
          texture.add(cell, 0, left, top, Math.round((column + 1) * image.width / 4) - left, Math.round((row + 1) * image.height / 2) - top);
        }
        return;
      }
      const atlas = await loadCharacterAtlas(characterId(key), true);
      if (!scene) return;
      const texture = canvasTexture(scene, `cs:${key}`, warmWorldCharacter(atlas.image));
      addGridFrames(texture, atlas.frameSize, atlas.columns, atlas.rows);
    }));
    if (disposed || !scene) return;
    for (const [key, member] of Object.entries(def.cast)) addActor(key, member);
    view.mood(def.mood ?? "day");
    if (def.mood === "snow" || def.mood === "rain") weather = def.mood;
    view.ready();
    void play();
  }

  function lookKey(look: string): string {
    if (look.startsWith("beast:")) return "beast";
    if (look === "hero") return characterId(options.heroBody);
    return characterId(look);
  }

  function addActor(key: string, member: CastMember) {
    if (!scene) return;
    const at = toStage(member.at);
    const beast = member.look.startsWith("beast:");
    const texKey = beast ? "cs:beast" : `cs:${lookKey(member.look)}`;
    const frame = beast ? Number(member.look.slice(6)) || 0 : 0;
    const image = scene.add.image(at.x, at.y, texKey, frame).setOrigin(0.5, beast ? 0.9 : 120 / 128);
    const size = ACTOR_SIZE * (member.size ?? 1);
    image.setDisplaySize(beast ? size * 1.1 : size, beast ? size * 0.9 : size);
    if (member.tint) image.setTint(parseInt(member.tint.slice(1), 16));
    const shadow = scene.add.image(at.x, at.y, "cs:shadow").setDisplaySize(30 * (member.size ?? 1), 11);
    const frames = beast ? 1 : (scene.textures.get(texKey).frameTotal - 1);
    const actor: Actor = {
      key, member, image, shadow, kind: beast ? "beast" : "sheet", directional: frames >= 24, frames,
      x: at.x, y: at.y, facingLeft: member.facing === "left", motion: "idle", motionAt: 0, heading: "side",
      target: null, alpha: member.hidden ? 0 : 1, fadeTo: member.hidden ? 0 : 1, lunge: 0,
    };
    actors.set(key, actor);
  }

  // ─── Beats ──────────────────────────────────────────────────────────
  const sleep = (ms: number) => new Promise<void>((resolve) => {
    if (skipping) { resolve(); return; }
    const end = elapsed + ms;
    const check = () => { if (skipping || disposed || elapsed >= end) resolve(); else requestAnimationFrame(check); };
    check();
  });

  function waitForTap(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (skipping) { resolve(); return; }
      waitingLine = resolve;
      armAuto(text);
    });
  }
  function armAuto(text: string) {
    clearTimeout(autoTimer);
    if (!auto || !waitingLine) return;
    autoTimer = setTimeout(() => { const go = waitingLine; waitingLine = null; go?.(); }, 1400 + text.length * 55);
  }

  async function play() {
    view.fade("black", 0);
    view.fade("clear", 700);
    if (def.title) {
      view.title({ text: sub(def.title), sub: def.subtitle ? sub(def.subtitle) : undefined });
      await waitForTap(def.title + (def.subtitle ?? ""));
      view.title(null);
    }
    for (const [index, beat] of def.beats.entries()) {
      if (disposed) return;
      if (skipping) break;
      view.beat(index);
      await runBeat(beat);
    }
    view.line(null);
    view.title(null);
    if (!disposed) {
      view.fade("black", skipping ? 0 : 500);
      await sleep(skipping ? 0 : 520);
      view.done();
    }
  }

  async function runBeat(beat: CutsceneBeat): Promise<void> {
    switch (beat[0]) {
      case "say": case "think": {
        const actor = actors.get(beat[1]);
        view.line({ kind: beat[0], speaker: sub(actor?.member.name ?? beat[1]), actor: beat[1], text: sub(beat[2]) });
        if (actor && beat[0] === "say") faceListener(actor);
        await waitForTap(beat[2]);
        view.line(null);
        return;
      }
      case "narrate":
        view.line({ kind: "narrate", text: sub(beat[1]) });
        await waitForTap(beat[1]);
        view.line(null);
        return;
      case "title":
        view.title({ text: sub(beat[1]), sub: beat[2] ? sub(beat[2]) : undefined });
        await waitForTap(beat[1]);
        view.title(null);
        return;
      case "move": {
        const actor = actors.get(beat[1]);
        if (!actor) return;
        const to = toStage(beat[2]);
        const how = beat[3] ?? "walk";
        const speed = how.startsWith("run") ? RUN_SPEED : WALK_SPEED;
        const arrive = new Promise<void>((resolve) => {
          if (options.reducedMotion || skipping) { actor.x = to.x; actor.y = to.y; resolve(); return; }
          actor.target = { x: to.x, y: to.y, speed, resolve };
          setMotion(actor, "walk");
        });
        if (how === "with" || how === "run-with") return;
        await arrive;
        return;
      }
      case "face": {
        const actor = actors.get(beat[1]);
        if (actor) actor.facingLeft = beat[2] === "left";
        return;
      }
      case "act": {
        const actor = actors.get(beat[1]);
        if (!actor) return;
        setMotion(actor, beat[2]);
        if (beat[2] === "attack") { actor.lunge = 1; await sleep(520); setMotion(actor, "idle"); }
        else await sleep(beat[2] === "defeat" ? 500 : 280);
        return;
      }
      case "fx":
        fx(beat[1], beat[2] ? actors.get(beat[2]) : undefined);
        await sleep(beat[1] === "flash" || beat[1] === "lightning" ? 260 : beat[1] === "shake" ? 300 : 220);
        return;
      case "enter": {
        const actor = actors.get(beat[1]);
        if (!actor) return;
        if (beat[2]) { const at = toStage(beat[2]); actor.x = at.x; actor.y = at.y; }
        actor.fadeTo = 1;
        await sleep(300);
        return;
      }
      case "exit": {
        const actor = actors.get(beat[1]);
        if (actor) actor.fadeTo = 0;
        await sleep(300);
        return;
      }
      case "camera": {
        const actor = beat[1] === "center" ? null : actors.get(beat[1]);
        camera.tx = actor ? actor.x : anchor.x;
        camera.ty = (actor ? actor.y : anchor.y) - 20;
        if (beat[2]) camera.tzoom = Math.min(4, Math.max(1, beat[2]));
        await sleep(650);
        return;
      }
      case "wait":
        await sleep(beat[1]);
        return;
      case "fade":
        view.fade(beat[1] === "out" ? "black" : "clear", 600);
        await sleep(620);
        return;
      case "mood":
        view.mood(beat[1]);
        weather = beat[1] === "snow" || beat[1] === "rain" ? beat[1] : null;
        return;
    }
  }

  /** A speaker turns toward the nearest other visible actor. */
  function faceListener(actor: Actor) {
    let best: Actor | null = null, bestD = Infinity;
    for (const other of actors.values()) {
      if (other === actor || other.alpha < 0.5) continue;
      const d = Math.hypot(other.x - actor.x, other.y - actor.y);
      if (d < bestD) { best = other; bestD = d; }
    }
    if (best && Math.abs(best.x - actor.x) > 4) actor.facingLeft = best.x < actor.x;
  }

  function setMotion(actor: Actor, motion: CharacterMotion | "idle") {
    actor.motion = motion as CharacterMotion;
    actor.motionAt = elapsed;
  }

  // ─── Effects ────────────────────────────────────────────────────────
  function spawn(x: number, y: number, color: number, o: Partial<Particle> & { size?: number; texture?: string; depth?: number } = {}) {
    if (!scene || options.reducedMotion) return;
    const image = scene.add.image(x, y, o.texture ?? "cs:dot").setTint(color).setDepth(o.depth ?? 20000);
    const size = o.size ?? 3;
    image.setDisplaySize(size, size);
    particles.push({ image, vx: o.vx ?? 0, vy: o.vy ?? 0, life: o.life ?? 700, age: 0, spin: o.spin ?? 0, fade: o.fade ?? true, grow: o.grow ?? 0 });
  }

  function fx(kind: CutsceneFx, actor?: Actor) {
    const x = actor ? actor.x : camera.x;
    const y = actor ? actor.y - 26 * (actor.member.size ?? 1) : camera.y;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    switch (kind) {
      case "flash": view.fade("flash", 200); return;
      case "shake": if (!options.reducedMotion) scene?.cameras.main.shake(260, 0.006); return;
      case "lightning": {
        view.fade("flash", 240);
        if (!scene || options.reducedMotion) return;
        const g = scene.add.graphics().setDepth(20001);
        g.lineStyle(2, 0xf4f0ff, 1);
        g.beginPath(); g.moveTo(x + rand(-30, 30), y - 160);
        let px = x, py = y - 160;
        for (let i = 0; i < 6; i++) { px += rand(-14, 14); py += 26; g.lineTo(px, py); }
        g.strokePath();
        scene.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
        return;
      }
      case "slash": {
        if (!scene || options.reducedMotion) return;
        const g = scene.add.graphics().setDepth(20001);
        const dir = actor?.facingLeft ? -1 : 1;
        g.lineStyle(3, 0xfff4d0, 1);
        g.beginPath(); g.arc(x + dir * 10, y, 22, -1.2, 1.2, false); g.strokePath();
        g.lineStyle(1.5, 0xf0c060, 0.9);
        g.beginPath(); g.arc(x + dir * 10, y, 18, -1, 1, false); g.strokePath();
        g.setScale(dir, 1); g.x = dir < 0 ? x * 2 : 0;
        scene.tweens.add({ targets: g, alpha: 0, duration: 340, onComplete: () => g.destroy() });
        return;
      }
      case "burst": {
        if (!scene || options.reducedMotion) return;
        const g = scene.add.graphics().setDepth(20001);
        const state = { r: 4 };
        scene.tweens.add({ targets: state, r: 34, duration: 420, onUpdate: () => {
          g.clear(); g.lineStyle(2.5, 0xffe9b0, 1 - state.r / 36); g.strokeCircle(x, y, state.r);
        }, onComplete: () => g.destroy() });
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; spawn(x, y, 0xfff0c0, { vx: Math.cos(a) * 60, vy: Math.sin(a) * 40, life: 420, size: 2.5 }); }
        return;
      }
      case "qi": for (let i = 0; i < 16; i++) { const a = rand(0, Math.PI * 2); spawn(x + Math.cos(a) * 18, y + 20 + Math.sin(a) * 6, i % 2 ? 0x9fe0ff : 0xe8fff4, { vx: -Math.sin(a) * 18, vy: rand(-46, -24), life: rand(700, 1100), size: rand(2, 3.5) }); } return;
      case "sparkle": for (let i = 0; i < 12; i++) spawn(x + rand(-26, 26), y + rand(-30, 10), 0xfff6c8, { vy: -8, life: rand(500, 900), size: rand(1.5, 3), grow: -1 }); return;
      case "smoke": for (let i = 0; i < 12; i++) spawn(x + rand(-12, 12), y + 22, 0x8a8478, { vx: rand(-14, 14), vy: rand(-22, -8), life: rand(800, 1300), size: rand(6, 10), grow: 10 }); return;
      case "fire": for (let i = 0; i < 18; i++) spawn(x + rand(-12, 12), y + 18, i % 3 ? 0xff9a3c : 0xffe066, { vx: rand(-8, 8), vy: rand(-60, -30), life: rand(400, 800), size: rand(2.5, 4.5), grow: -3 }); return;
      case "blood": for (let i = 0; i < 12; i++) spawn(x, y, 0xb3122a, { vx: rand(-50, 50), vy: rand(-60, -10), life: 600, size: rand(2, 3) }); return;
      case "heal": for (let i = 0; i < 14; i++) spawn(x + rand(-16, 16), y + 20, 0x8ff0a4, { vy: rand(-40, -20), life: rand(700, 1100), size: rand(2, 3.5) }); return;
      case "ice": for (let i = 0; i < 14; i++) spawn(x + rand(-18, 18), y + rand(-20, 20), 0xd6f2ff, { vx: rand(-20, 20), vy: rand(-20, 20), life: 700, size: rand(2, 4), spin: 3 }); return;
      case "poison": for (let i = 0; i < 14; i++) spawn(x + rand(-14, 14), y + 18, i % 2 ? 0x9a5cd6 : 0x6fd65c, { vy: rand(-30, -12), vx: rand(-6, 6), life: rand(800, 1200), size: rand(3, 5), grow: 2 }); return;
      case "petals": ambient.kind = "petals"; ambient.until = elapsed + 5000; return;
    }
  }

  // ─── Frame loop ─────────────────────────────────────────────────────
  function tick(time: number) {
    if (disposed || !scene) return;
    const dt = lastTime ? Math.min(50, time - lastTime) : 16;
    lastTime = time;
    elapsed += dt;
    const s = dt / 1000;
    for (const actor of actors.values()) {
      if (actor.target) {
        const dx = actor.target.x - actor.x, dy = actor.target.y - actor.y;
        const dist = Math.hypot(dx, dy);
        const step = actor.target.speed * s;
        if (dist <= step) {
          actor.x = actor.target.x; actor.y = actor.target.y;
          const done = actor.target.resolve; actor.target = null; setMotion(actor, "idle"); done();
        } else {
          actor.x += dx / dist * step; actor.y += dy / dist * step;
          if (Math.abs(dx) > Math.abs(dy) * 0.8) { actor.heading = "side"; actor.facingLeft = dx < 0; }
          else actor.heading = dy < 0 ? "north" : "south";
        }
      }
      actor.alpha += (actor.fadeTo - actor.alpha) * Math.min(1, s * 6);
      actor.lunge = Math.max(0, actor.lunge - s * 2.2);
      drawActor(actor);
    }
    // Particles.
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) { p.image.destroy(); particles.splice(i, 1); continue; }
      p.image.x += p.vx * s; p.image.y += p.vy * s;
      p.image.rotation += p.spin * s;
      if (p.grow) p.image.setDisplaySize(Math.max(0.5, p.image.displayWidth + p.grow * s), Math.max(0.5, p.image.displayHeight + p.grow * s));
      if (p.fade) p.image.setAlpha(1 - p.age / p.life);
    }
    // Ambient particles: petals, snow, rain around the camera.
    if (!options.reducedMotion) {
      const view = scene.cameras.main.worldView;
      if (ambient.until > elapsed && Math.random() < 0.35) spawn(view.x + Math.random() * view.width, view.y - 4, 0xffffff, { texture: "cs:petal", vx: 14 + Math.random() * 16, vy: 18 + Math.random() * 12, life: 3200, size: 4, spin: 2, fade: false });
      if (weather === "snow" && Math.random() < 0.6) spawn(view.x + Math.random() * view.width, view.y - 4, 0xffffff, { vx: Math.random() * 8 - 4, vy: 16 + Math.random() * 10, life: 5000, size: 1.6 + Math.random(), fade: false });
      if (weather === "rain" && Math.random() < 0.9) spawn(view.x + Math.random() * view.width, view.y - 8, 0xffffff, { texture: "cs:streak", vx: -20, vy: 260, life: 1200, size: 6, fade: false });
    }
    // Camera ease.
    const k = options.reducedMotion ? 1 : Math.min(1, s * 3);
    camera.x += (camera.tx - camera.x) * k;
    camera.y += (camera.ty - camera.y) * k;
    camera.zoom += (camera.tzoom - camera.zoom) * k;
    const cam = scene.cameras.main;
    const scale = Math.max(cam.width / (WIDTH / camera.zoom), cam.height / (HEIGHT / camera.zoom));
    cam.setZoom(scale);
    const halfW = cam.width / scale / 2, halfH = cam.height / scale / 2;
    cam.centerOn(Math.min(WIDTH - halfW, Math.max(halfW, camera.x)), Math.min(HEIGHT - halfH, Math.max(halfH, camera.y)));
  }

  function drawActor(actor: Actor) {
    const t = elapsed - actor.motionAt;
    let frame = 0, lean = 0, hop = 0;
    if (actor.kind === "sheet") {
      if (actor.target) {
        const clip = actor.directional && actor.heading !== "side"
          ? CHARACTER_CLIPS[actor.heading === "north" ? "walkNorth" : "walkSouth"] : CHARACTER_CLIPS.walk;
        frame = clip.frames[Math.floor(t / 1000 * clip.fps * (actor.target.speed > WALK_SPEED ? 1.6 : 1)) % clip.frames.length];
      } else {
        const clip = CHARACTER_CLIPS[actor.motion] ?? CHARACTER_CLIPS.idle;
        const index = Math.floor(t / 1000 * clip.fps);
        frame = clip.repeat === -1 ? clip.frames[index % clip.frames.length] : clip.frames[Math.min(index, clip.frames.length - 1)];
        if (options.reducedMotion && actor.motion === "idle") frame = clip.frames[0];
      }
      actor.image.setFrame(frame % Math.max(1, actor.frames));
    } else {
      // Beasts: one pose, procedural motion.
      if (actor.target && !options.reducedMotion) hop = Math.abs(Math.sin(t / 90)) * 4;
      if (actor.motion === "idle" && !options.reducedMotion) hop = Math.sin(elapsed / 420) * 0.8;
      if (actor.motion === "hurt") lean = -0.12;
      if (actor.motion === "defeat") lean = Math.PI / 2 * 0.9;
    }
    const dir = actor.facingLeft ? -1 : 1;
    const lunge = Math.sin(actor.lunge * Math.PI) * 10 * dir;
    actor.image.setFlipX(actor.facingLeft);
    actor.image.setRotation(lean * dir);
    actor.image.setPosition(actor.x + lunge, actor.y - hop).setDepth(100 + actor.y * 10).setAlpha(actor.alpha);
    actor.shadow.setPosition(actor.x + lunge, actor.y).setDepth(1).setAlpha(actor.alpha * 0.9)
      .setDisplaySize(30 * (actor.member.size ?? 1), 11);
  }

  return {
    advance() {
      const go = waitingLine;
      waitingLine = null;
      clearTimeout(autoTimer);
      go?.();
    },
    setAuto(on) { auto = on; if (waitingLine) armAuto(""); },
    skip() {
      skipping = true;
      for (const actor of actors.values()) if (actor.target) { const done = actor.target.resolve; actor.target = null; done(); }
      const go = waitingLine; waitingLine = null; go?.();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      clearTimeout(autoTimer);
      observer.disconnect();
      stage.destroy();
    },
  };
}
