import * as Phaser from "phaser";
import type { CastVfx } from "./cast-vfx";

/**
 * Battle skill VFX. Every cast gets a look from its CastVfx profile:
 *   rarity (tier 0–4) → palette, layer count, particle budget
 *     T0 a clean strike · T1 + glow · T2 + afterimage & shockwave
 *     T3 + rune circles & element burst · T4 + light pillar, rays, screen flash
 *   weapon family → strike shape (crescent, heavy cleave, palm burst, thrust,
 *     flurry, thrown needles, sound waves, qi orb)
 *   element → accent particles (poison bubbles, embers, frost shards,
 *     lightning, blood wisps, qi swirl, shadow mist, holy rays; the beasts'
 *     gold scales, sun flare, wind crescents, sea spray, rock chips)
 *   T5 (ปรมัตถ์) → crimson palette, the densest particle budget
 *   boss signature (`bss_*` moves) → its own wind-up, hit mark or self aura
 *     (gold fangs, tightening coils, blue-blood rakes, shock rings, a dive
 *     from the sky, feather-blades, grit whirl, sun disc, crater, pincer X,
 *     sea mist, horns of flame…)
 * Textures are drawn once per colour into canvases, so the Canvas renderer
 * looks the same as WebGL (no tinting needed).
 */

export interface Point { x: number; y: number }

type TextureKind = "glow" | "spark" | "streak" | "ring" | "crescent" | "rune" | "bolt" | "petal";

interface Particle {
  item: Phaser.GameObjects.Image;
  start: number;
  life: number;
  x: number; y: number;
  vx: number; vy: number;
  ax: number; ay: number;
  w: number; h: number;
  grow: number;
  rotation: number; spin: number;
  alpha: number;
  fadeIn: number;
  /** Optional path: travel from (x,y) to (tx,ty) with ease-out over the life. */
  tx?: number; ty?: number;
}

export interface BattleVfx {
  /** Cast start: charge-up at the caster, and ranged projectiles timed to land on each hit. */
  cast(vfx: CastVfx, caster: Point, target: Point, dir: 1 | -1, hitTimes: number[], now: number, duration: number): void;
  /** One landed hit at the contact point. */
  impact(vfx: CastVfx, at: Point, caster: Point, dir: 1 | -1, index: number, critical: boolean, now: number): void;
  /** A dodged hit: the blade-light passes through empty air. */
  whiff(vfx: CastVfx, at: Point, dir: 1 | -1, index: number, now: number): void;
  /** A buff / heal / stance on the caster (feet point). */
  support(vfx: CastVfx, feet: Point, height: number, now: number): void;
  update(now: number): void;
  /** Live particle count, for tests. */
  count(): number;
  destroy(): void;
}

export function createBattleVfx(scene: Phaser.Scene, view: () => { left: number; top: number; width: number; height: number }): BattleVfx {
  const particles: Particle[] = [];
  const overlays: { rect: Phaser.GameObjects.Rectangle; start: number; life: number; peak: number; hold: number }[] = [];
  const hex = (color: number) => color.toString(16).padStart(6, "0");
  const rgb = (color: number) => [(color >> 16) & 255, (color >> 8) & 255, color & 255];
  const rgba = (color: number, alpha: number) => `rgba(${rgb(color).join(",")},${alpha})`;
  let boltVariant = 0;
  let linger = 1;

  function texture(kind: TextureKind, color: number, variant = 0): string {
    const key = `vfx:${kind}:${hex(color)}:${variant}`;
    if (scene.textures.exists(key)) return key;
    const size = kind === "spark" || kind === "petal" ? 24 : kind === "streak" ? 96 : 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = kind === "streak" ? 16 : kind === "bolt" ? 128 : size;
    const c = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
    if (kind === "glow" || kind === "spark") {
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(kind === "spark" ? 0.25 : 0.12, rgba(color, 0.95));
      g.addColorStop(0.5, rgba(color, 0.35));
      g.addColorStop(1, rgba(color, 0));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    } else if (kind === "streak") {
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.7, rgba(color, 0.85)); g.addColorStop(1, "rgba(255,255,255,1)");
      c.fillStyle = g;
      c.beginPath(); c.moveTo(0, cy); c.quadraticCurveTo(w * 0.6, 1, w, cy); c.quadraticCurveTo(w * 0.6, h - 1, 0, cy); c.fill();
    } else if (kind === "ring") {
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = i === 5 ? "rgba(255,255,255,.9)" : rgba(color, 0.12 + i * 0.12);
        c.lineWidth = 12 - i * 2;
        c.beginPath(); c.arc(cx, cy, w / 2 - 8, 0, Math.PI * 2); c.stroke();
      }
    } else if (kind === "crescent") {
      // A blade-light arc: soft colour body, white-hot leading edge, tapered ends.
      for (let i = 0; i < 7; i++) {
        c.strokeStyle = i === 6 ? "rgba(255,255,255,.9)" : rgba(color, 0.22 + i * 0.13);
        c.lineWidth = i === 6 ? 2 : 18 - i * 2.4;
        c.lineCap = "round";
        c.beginPath(); c.arc(cx - 18, cy, w / 2 - 14, -Math.PI * 0.42, Math.PI * 0.42); c.stroke();
      }
      c.globalCompositeOperation = "destination-in";
      const fade = c.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(0.25, "rgba(0,0,0,1)"); fade.addColorStop(0.75, "rgba(0,0,0,1)"); fade.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = fade; c.fillRect(0, 0, w, h);
    } else if (kind === "rune") {
      c.translate(cx, cy);
      c.strokeStyle = rgba(color, 0.9); c.fillStyle = rgba(color, 0.9);
      c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 58, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 44, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 8; i++) {
        c.save(); c.rotate(i * Math.PI / 4);
        c.fillRect(-1, -58, 2, 10);
        // Trigram-like bars between the circles.
        const broken = (i + variant) % 3 === 0;
        c.fillRect(-7, -54, broken ? 5 : 14, 2.5); if (broken) c.fillRect(2, -54, 5, 2.5);
        c.restore();
      }
      c.lineWidth = 1.5; c.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.lineTo(Math.cos(a) * 44, Math.sin(a) * 44); }
      c.closePath(); c.stroke();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 44);
      g.addColorStop(0, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 44, 0, Math.PI * 2); c.fill();
    } else if (kind === "bolt") {
      // Jagged lightning from top to bottom, glow then white core.
      const points: [number, number][] = [[cx, 0]];
      let x = cx;
      for (let y = 12; y < h; y += 12) { x = Math.max(8, Math.min(w - 8, x + (((y * 37 + variant * 53) % 29) - 14))); points.push([x, y]); }
      for (const [width, style] of [[9, rgba(color, 0.35)], [4, rgba(color, 0.9)], [1.5, "rgba(255,255,255,1)"]] as const) {
        c.strokeStyle = style; c.lineWidth = width; c.lineJoin = "round"; c.beginPath();
        points.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke();
      }
    } else if (kind === "petal") {
      c.translate(cx, cy); c.rotate(0.6);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 10);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, rgba(color, 0.2));
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2); c.fill();
    }
    scene.textures.addCanvas(key, canvas);
    return key;
  }

  function add(kind: TextureKind, color: number, now: number, spec: Partial<Particle> & { x: number; y: number; w: number; h: number; life: number },
    options: { delay?: number; blend?: "add" | "normal"; depth?: number; variant?: number } = {}) {
    // Light (glows, sparks) adds; shaped strokes draw normally so they stay vivid on bright backdrops.
    const blend = options.blend ?? (kind === "glow" || kind === "spark" ? "add" : "normal");
    const item = scene.add.image(spec.x, spec.y, texture(kind, color, options.variant ?? 0))
      .setDepth(options.depth ?? 26).setBlendMode(blend === "normal" ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD)
      .setAlpha(0).setVisible(false);
    const particle: Particle = { item, start: now + (options.delay ?? 0), vx: 0, vy: 0, ax: 0, ay: 0, grow: 0, rotation: 0, spin: 0,
      alpha: 1, fadeIn: 0, ...spec };
    // Rarer casts linger longer so the player can take them in.
    particle.life *= linger;
    item.setRotation(particle.rotation);
    particles.push(particle);
    return particle;
  }

  function flash(color: number, now: number, peak: number, life: number, delay = 0, hold = 0) {
    const v = view();
    const rect = scene.add.rectangle(v.left + v.width / 2, v.top + v.height / 2, v.width + 40, v.height + 40, color, 1)
      .setDepth(60).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    overlays.push({ rect, start: now + delay, life, peak, hold });
  }
  function dim(now: number, duration: number) {
    const v = view();
    const rect = scene.add.rectangle(v.left + v.width / 2, v.top + v.height / 2, v.width + 40, v.height + 40, 0x05070a, 1)
      .setDepth(4).setAlpha(0);
    overlays.push({ rect, start: now, life: duration, peak: 0.42, hold: duration - 400 });
  }

  const rand = (seed: number) => { const s = Math.sin(seed * 12.9898) * 43758.5453; return s - Math.floor(s); };

  // ── Element accents ─────────────────────────────────────────────────
  function elementBurst(vfx: CastVfx, at: Point, caster: Point, now: number, scale: number, seed: number) {
    const n = Math.round((3 + vfx.tier * 2) * scale);
    const a = vfx.accent;
    switch (vfx.element) {
      case "poison":
        for (let i = 0; i < n; i++) add("spark", a, now, { x: at.x + (rand(seed + i) - 0.5) * 50, y: at.y + (rand(seed + i * 3) - 0.5) * 30,
          w: 8 + rand(i) * 8, h: 8 + rand(i) * 8, vy: -20 - rand(seed + i * 7) * 30, life: 700 + i * 30, grow: 0.6, alpha: 0.85 }, { delay: i * 25, blend: "normal" });
        break;
      case "fire":
        for (let i = 0; i < n + 2; i++) add("spark", a, now, { x: at.x + (rand(seed + i) - 0.5) * 40, y: at.y, w: 6, h: 9,
          vx: (rand(seed + i * 5) - 0.5) * 80, vy: -40 - rand(seed + i * 2) * 90, ay: -60, life: 600 + rand(i) * 300, grow: -0.6 }, { delay: i * 15 });
        add("glow", a, now, { x: at.x, y: at.y, w: 70 * scale, h: 70 * scale, life: 320, grow: 0.8, alpha: 0.8 });
        break;
      case "frost":
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2 + seed;
          add("streak", a, now, { x: at.x, y: at.y, w: 26, h: 6, rotation: angle, vx: Math.cos(angle) * 110, vy: Math.sin(angle) * 110, life: 380, grow: -0.3 });
        }
        add("ring", a, now, { x: at.x, y: at.y, w: 40, h: 40, life: 420, grow: 1.6, alpha: 0.8 });
        break;
      case "thunder":
        for (let i = 0; i < 1 + Math.floor(vfx.tier / 2); i++) {
          add("bolt", a, now, { x: at.x + (i - 0.5) * 22, y: at.y - 80, w: 40, h: 170, life: 260, alpha: 1 }, { delay: i * 70, variant: boltVariant++ % 4, depth: 28 });
        }
        flash(a, now, 0.18, 200);
        break;
      case "blood":
        // Life drains back along the arm to the caster.
        for (let i = 0; i < n; i++) add("spark", a, now, { x: at.x + (rand(seed + i) - 0.5) * 30, y: at.y + (rand(seed + i * 9) - 0.5) * 30,
          tx: caster.x, ty: caster.y, w: 9, h: 9, life: 520 + i * 25, alpha: 0.9 }, { delay: 80 + i * 30 });
        break;
      case "qi":
        add("ring", a, now, { x: at.x, y: at.y, w: 30, h: 30, life: 480, grow: 2.4, alpha: 0.7, spin: 4 });
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2;
          add("spark", a, now, { x: at.x + Math.cos(angle) * 46, y: at.y + Math.sin(angle) * 30, tx: at.x, ty: at.y, w: 7, h: 7, life: 300 });
        }
        break;
      case "shadow":
        for (let i = 0; i < n; i++) add("glow", a, now, { x: at.x + (rand(seed + i) - 0.5) * 60, y: at.y + (rand(seed + i * 4) - 0.5) * 50,
          w: 40, h: 40, vy: -12, life: 700, grow: 0.8, alpha: 0.45 }, { blend: "normal", delay: i * 30 });
        break;
      case "holy":
        for (let i = 0; i < 6; i++) add("streak", a, now, { x: at.x, y: at.y, w: 70, h: 10, rotation: -Math.PI / 2 + (i - 2.5) * 0.35, life: 420, alpha: 0.7, grow: 0.4 }, { delay: i * 20 });
        break;
      // ── The legendary beasts' elements ──
      case "gold":
        // Glinting scales scatter and spin.
        for (let i = 0; i < n; i++) add("petal", a, now, { x: at.x + (rand(seed + i) - 0.5) * 40, y: at.y + (rand(seed + i * 2) - 0.5) * 30, w: 12, h: 7,
          rotation: rand(i) * 6, vx: (rand(seed + i * 5) - 0.5) * 140, vy: -30 - rand(i * 3) * 70, ay: 120, spin: 6, life: 640 }, { delay: i * 18 });
        add("glow", a, now, { x: at.x, y: at.y, w: 60 * scale, h: 60 * scale, life: 260, grow: 0.6, alpha: 0.7 });
        break;
      case "sun":
        // A small sun flares, its rays turning.
        add("glow", a, now, { x: at.x, y: at.y, w: 90 * scale, h: 90 * scale, life: 420, grow: 0.5, alpha: 0.85 });
        for (let i = 0; i < 8; i++) add("streak", a, now, { x: at.x, y: at.y, w: 80 * scale, h: 8, rotation: (i / 8) * Math.PI * 2 + seed, spin: 1.2, life: 420, alpha: 0.75, grow: 0.3 }, { delay: 20 });
        break;
      case "wind":
        // Gusts curl past in crescents.
        for (let i = 0; i < Math.max(3, Math.round(n / 2)); i++) add("crescent", a, now, { x: at.x + (rand(seed + i) - 0.5) * 50, y: at.y + (rand(seed + i * 3) - 0.5) * 40,
          w: 40, h: 70, rotation: rand(i) * 6, spin: 8, vx: 160 * (rand(i * 7) - 0.3), life: 360, alpha: 0.6, grow: 0.4 }, { delay: i * 30 });
        break;
      case "water":
        // Spray and foam, then a ripple.
        for (let i = 0; i < n + 2; i++) add("spark", a, now, { x: at.x, y: at.y, w: 9, h: 9, vx: (rand(seed + i) - 0.5) * 200, vy: -60 - rand(seed + i * 4) * 120, ay: 380, life: 520 }, { delay: i * 10 });
        add("ring", a, now, { x: at.x, y: at.y + 30, w: 40, h: 14, life: 520, grow: 3, alpha: 0.7 }, { depth: 7 });
        break;
      case "earth":
        // Rock chips fly from the ground and a dust ring spreads.
        for (let i = 0; i < n + 3; i++) add("spark", a, now, { x: at.x + (rand(seed + i) - 0.5) * 60, y: at.y + 40, w: 13, h: 10,
          vx: (rand(seed + i * 3) - 0.5) * 160, vy: -60 - rand(seed + i * 5) * 120, ay: 300, life: 600 }, { blend: "normal", depth: 12 });
        add("ring", a, now, { x: at.x, y: at.y + 40, w: 50, h: 16, life: 560, grow: 3.4, alpha: 0.6 }, { blend: "normal", depth: 7 });
        break;
      case "none":
        break;
    }
  }

  // ── The legendary beasts' signatures (on top of the family shape) ────
  const BLOOD = 0xc4122a, GOLD = 0xffd23a, SUN = 0xffb000, SEA = 0x4fc3ff, FIRE = 0xff5a1a, STONE = 0xa88252;

  /** Before the hits: the beast gathers itself (and a diver climbs, a bull lowers its horns). */
  function signatureCast(vfx: CastVfx, caster: Point, target: Point, dir: 1 | -1, hitTimes: number[], now: number) {
    const first = hitTimes[0] ?? 300;
    switch (vfx.signature) {
      case "roar":
      case "stomp":
        // The wind-up: rings gather in toward the beast.
        for (let r = 0; r < 3; r++) add("ring", vfx.accent, now, { x: caster.x, y: caster.y, w: 220 - r * 40, h: 120 - r * 20, life: 260, grow: -0.7, alpha: 0.5 }, { delay: r * 50 });
        break;
      case "dive":
        // The eagle climbs out of sight, then a light pillar marks where it lands.
        add("streak", vfx.accent, now, { x: caster.x, y: caster.y - 40, w: 160, h: 18, rotation: -Math.PI / 2, vy: -500, life: 220, alpha: 0.8 });
        add("streak", 0xffffff, now, { x: target.x, y: target.y - 200, tx: target.x, ty: target.y, w: 220, h: 26, rotation: Math.PI / 2, life: Math.max(120, first - 40) }, { delay: 40, depth: 28 });
        add("ring", vfx.accent, now, { x: target.x, y: target.y + 40, w: 90, h: 26, life: first, alpha: 0.6, grow: -0.4 }, { depth: 7 });
        break;
      case "charge":
        // Flames trail along the line of the charge.
        for (let i = 0; i < 10; i++) {
          const t = i / 10;
          add("spark", FIRE, now, { x: caster.x + (target.x - caster.x) * t, y: caster.y + (target.y - caster.y) * t + 30, w: 14, h: 18, vy: -60, ay: -40, life: 420 },
            { delay: first * t * 0.8 });
        }
        add("streak", vfx.accent, now, { x: caster.x, y: caster.y, tx: target.x, ty: target.y, w: 200, h: 30, rotation: Math.atan2(target.y - caster.y, target.x - caster.x), life: first }, { depth: 27 });
        break;
      case "feathers":
        // A fan of feather-blades streams from the wings onto the target.
        for (const [i, at] of hitTimes.entries()) {
          add("streak", 0xf2fbff, now, { x: caster.x + (rand(i) - 0.5) * 60, y: caster.y - 50 - rand(i * 3) * 40, tx: target.x + (rand(i * 5) - 0.5) * 40, ty: target.y + (rand(i * 7) - 0.5) * 30,
            w: 44, h: 8, rotation: Math.atan2(target.y - caster.y + 50, target.x - caster.x), life: 200 }, { delay: Math.max(0, at - 200), depth: 27 });
        }
        break;
      case "sun":
        // A sun rises over the turtle before the blast.
        add("glow", SUN, now, { x: caster.x, y: caster.y - 110, w: 60, h: 60, life: first + 120, grow: 1.4, alpha: 0.9, fadeIn: 120 }, { depth: 27 });
        break;
      case "tide":
        // A wave rolls from the crab to the target.
        for (let n = 0; n < 3; n++) add("crescent", SEA, now, { x: caster.x, y: caster.y + 10, tx: target.x, ty: target.y, w: 50 + n * 10, h: 90 + n * 20,
          rotation: dir === 1 ? 0 : Math.PI, life: Math.max(160, first - n * 40), alpha: 0.7 - n * 0.15, grow: 0.4 }, { delay: n * 40 });
        break;
      default:
        break;
    }
  }

  /** Each landed hit: the beast's mark on top of the shape's impact. */
  function signatureImpact(vfx: CastVfx, at: Point, dir: 1 | -1, index: number, now: number) {
    const facing = dir === 1 ? 0 : Math.PI;
    switch (vfx.signature) {
      case "fang":
        // Two gold fangs snap shut, venom drips.
        for (const side of [-1, 1]) add("streak", GOLD, now, { x: at.x, y: at.y + side * 26, w: 60, h: 10, rotation: side * Math.PI / 2, vy: -side * 140, life: 180 });
        for (let i = 0; i < 5; i++) add("spark", vfx.accent, now, { x: at.x + (rand(i + index) - 0.5) * 20, y: at.y, w: 8, h: 12, vy: 30, ay: 260, life: 600 }, { delay: 120 + i * 40, blend: "normal" });
        break;
      case "coil":
        // Golden coils tighten round the body.
        for (let r = 0; r < 3; r++) add("ring", GOLD, now, { x: at.x, y: at.y - 10 + r * 22, w: 110, h: 34, life: 520, grow: -0.55, alpha: 0.9, spin: 0 }, { delay: r * 70, blend: "normal" });
        break;
      case "claw":
        // Three parallel blue-blood rakes.
        for (let s = 0; s < 3; s++) add("streak", s === 1 ? 0x5f8cff : BLOOD, now, { x: at.x + (s - 1) * 12, y: at.y + (s - 1) * 6, w: 120, h: 9,
          rotation: facing + dir * (0.9 + (index % 2) * 0.3), life: 240, grow: 0.3 }, { delay: s * 25 });
        for (let i = 0; i < 6; i++) add("spark", BLOOD, now, { x: at.x, y: at.y, w: 8, h: 8, vx: dir * (40 + rand(i) * 120), vy: -40 + rand(i * 3) * 60, ay: 300, life: 500 }, { blend: "normal" });
        break;
      case "roar":
      case "stomp":
        // Concentric shock rings sweep through the hit unit.
        for (let r = 0; r < 3; r++) add("ring", vfx.accent, now, { x: at.x, y: at.y + (vfx.signature === "stomp" ? 40 : 0), w: 40, h: vfx.signature === "stomp" ? 14 : 40, life: 420, grow: 3 + r, alpha: 0.7 }, { delay: r * 60 });
        if (vfx.signature === "stomp") flash(STONE, now, 0.12, 200);
        break;
      case "feathers":
        // Feathers stick and quiver, then flutter away.
        add("petal", 0xf2fbff, now, { x: at.x + (rand(index) - 0.5) * 30, y: at.y + (rand(index * 2) - 0.5) * 30, w: 22, h: 8, rotation: rand(index * 5) * 6, vy: 20, ay: 40, spin: 2, life: 700 });
        break;
      case "dive":
        // The strike from above: a lightning-white column and a crater ring.
        add("bolt", 0xffffff, now, { x: at.x, y: at.y - 90, w: 50, h: 190, life: 240 }, { depth: 28 });
        add("ring", STONE, now, { x: at.x, y: at.y + 40, w: 60, h: 18, life: 520, grow: 3, alpha: 0.8 }, { blend: "normal", depth: 7 });
        flash(0xffffff, now, 0.22, 200);
        break;
      case "gale":
        // A whirl of grit closes over the eyes.
        add("ring", 0xd8fff2, now, { x: at.x, y: at.y - 20, w: 70, h: 70, life: 520, spin: 9, grow: -0.3, alpha: 0.7 });
        for (let i = 0; i < 5; i++) add("glow", 0x6e6a8a, now, { x: at.x + (rand(i + index) - 0.5) * 40, y: at.y - 30, w: 30, h: 30, life: 600, grow: 0.6, alpha: 0.4 }, { blend: "normal", delay: i * 30 });
        break;
      case "sun":
        // Heat haze: embers lift off the scorched target.
        for (let i = 0; i < 8; i++) add("spark", SUN, now, { x: at.x + (rand(i + index) - 0.5) * 50, y: at.y + 20, w: 8, h: 12, vy: -90 - rand(i) * 60, life: 700 }, { delay: i * 25 });
        break;
      case "quake":
        // The shell crashes down: a heavy dust ring and a screen thump.
        add("ring", STONE, now, { x: at.x, y: at.y + 40, w: 70, h: 22, life: 600, grow: 3.6, alpha: 0.75 }, { blend: "normal", depth: 7 });
        flash(STONE, now, 0.16, 220);
        break;
      case "pincers":
        // An X of claw-steel, armour shards flying off.
        for (const s of [-1, 1]) add("crescent", 0xe8f6ff, now, { x: at.x, y: at.y, w: 70, h: 104, rotation: facing + s * 0.8, life: 200, spin: -s * 3 });
        for (let i = 0; i < 5; i++) add("spark", 0xb8c4cc, now, { x: at.x, y: at.y, w: 10, h: 6, vx: (rand(i + index) - 0.5) * 220, vy: -80 - rand(i * 2) * 80, ay: 320, life: 520 }, { blend: "normal" });
        break;
      case "tide":
        // Sea mist settles on the target.
        for (let i = 0; i < 4; i++) add("glow", 0xcfeeff, now, { x: at.x + (rand(i + index) - 0.5) * 60, y: at.y + (rand(i * 3) - 0.5) * 30, w: 50, h: 36, vx: 12, life: 900, grow: 0.8, alpha: 0.45 }, { blend: "normal", delay: i * 40 });
        break;
      case "charge":
        // Horns of flame burst through.
        add("glow", FIRE, now, { x: at.x, y: at.y, w: 110, h: 110, life: 340, grow: 0.7, alpha: 0.85 });
        for (const s of [-1, 1]) add("crescent", FIRE, now, { x: at.x - dir * 10, y: at.y + s * 18, w: 50, h: 80, rotation: facing + s * 0.5, vx: dir * 120, life: 260 });
        break;
      default:
        break;
    }
  }

  /** Self moves: shedding skin, a blood-red frenzy, the sun shell, the mirror shell, a flaming rage. */
  function signatureSupport(vfx: CastVfx, feet: Point, height: number, now: number) {
    const chest = feet.y - height * 0.5;
    switch (vfx.signature) {
      case "molt":
        // The old skin flakes off in gold, a fresh sheen sweeps up.
        for (let i = 0; i < 16; i++) add("petal", GOLD, now, { x: feet.x + (rand(i) - 0.5) * 80, y: feet.y - rand(i * 3) * height, w: 14, h: 8,
          rotation: rand(i * 5) * 6, vx: (rand(i * 7) - 0.5) * 80, vy: 30, ay: 140, spin: 5, life: 900 }, { delay: i * 20 });
        add("streak", 0xffffff, now, { x: feet.x, y: feet.y, tx: feet.x, ty: feet.y - height, w: 110, h: 20, life: 520, alpha: 0.7 }, { depth: 12 });
        break;
      case "frenzy":
      case "rage": {
        // A blood-red (or flame) column and veins of red sparks.
        const c = vfx.signature === "rage" ? FIRE : BLOOD;
        add("glow", c, now, { x: feet.x, y: chest, w: 130, h: height * 1.3, life: 700, alpha: 0.55, fadeIn: 80 }, { blend: "normal", depth: 9 });
        for (let i = 0; i < 14; i++) add("spark", c, now, { x: feet.x + (rand(i) - 0.5) * 70, y: feet.y, w: 9, h: 14, vy: -160 - rand(i * 3) * 120, ay: -60, life: 620 }, { delay: i * 25 });
        flash(c, now, 0.2, 260);
        break;
      }
      case "shell":
        // A sun disc settles round the shell.
        add("ring", SUN, now, { x: feet.x, y: chest, w: 160, h: height * 1.2, life: 900, alpha: 0.85, grow: -0.1, fadeIn: 120 }, { depth: 12 });
        add("glow", SUN, now, { x: feet.x, y: chest, w: 170, h: height * 1.25, life: 900, alpha: 0.35, fadeIn: 120 });
        for (let i = 0; i < 8; i++) add("streak", SUN, now, { x: feet.x, y: chest, w: 120, h: 8, rotation: (i / 8) * Math.PI * 2, spin: 1, life: 700, alpha: 0.6 }, { delay: 60 });
        break;
      case "mirror":
        // The shell turns to a mirror: a bright sheen sweeps across it.
        add("ring", SEA, now, { x: feet.x, y: chest, w: 150, h: height * 1.1, life: 800, alpha: 0.8, spin: 0, fadeIn: 100 }, { depth: 12 });
        add("streak", 0xffffff, now, { x: feet.x - 70, y: chest - 20, tx: feet.x + 70, ty: chest + 20, w: 40, h: 120, rotation: 0.4, life: 420, alpha: 0.85 }, { delay: 120, depth: 13 });
        break;
      default:
        break;
    }
  }

  function travel(vfx: CastVfx, from: Point, to: Point, at: number, now: number, index: number) {
    const spread = (rand(index * 3.1) - 0.5) * 24;
    const target = { x: to.x, y: to.y + spread * 0.5 };
    const angle = Math.atan2(target.y - from.y, target.x - from.x);
    if (vfx.shape === "projectile") {
      const needles = 1 + Math.floor(vfx.tier / 2);
      for (let n = 0; n < needles; n++) {
        add("streak", vfx.glow, now, { x: from.x, y: from.y + (n - (needles - 1) / 2) * 8, tx: target.x, ty: target.y + (n - (needles - 1) / 2) * 6,
          w: 34 + vfx.tier * 6, h: 7, rotation: angle, life: 170 }, { delay: at - 170 + n * 18, depth: 27 });
      }
    } else if (vfx.shape === "wave") {
      for (let n = 0; n < 3; n++) {
        add("crescent", vfx.glow, now, { x: from.x, y: from.y, tx: target.x, ty: target.y, w: 28 + n * 8, h: 56 + n * 14,
          rotation: angle, life: 240, alpha: 0.8 - n * 0.15, grow: 0.5 }, { delay: at - 240 + n * 40 });
      }
    } else if (vfx.shape === "orb") {
      const size = 26 + vfx.tier * 8;
      add("glow", vfx.glow, now, { x: from.x, y: from.y, tx: target.x, ty: target.y, w: size, h: size, life: 220 }, { delay: at - 220, depth: 27 });
      add("glow", vfx.core, now, { x: from.x, y: from.y, tx: target.x, ty: target.y, w: size * 0.45, h: size * 0.45, life: 220 }, { delay: at - 220, depth: 28 });
      for (let n = 0; n < 4 + vfx.tier * 2; n++) {
        const t = n / (4 + vfx.tier * 2);
        add("spark", vfx.accent, now, { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t + (rand(n) - 0.5) * 14,
          w: 7, h: 7, vy: -10, life: 260, alpha: 0.8 }, { delay: at - 220 + t * 220 });
      }
    }
  }

  return {
    cast(vfx, caster, target, dir, hitTimes, now, duration) {
      const t = vfx.tier;
      linger = 1;
      // Charge: qi gathers into the hand; rarer arts draw a rune under the caster.
      if (t >= 1 || vfx.kind === "art") {
        const n = 4 + t * 3;
        for (let i = 0; i < n; i++) {
          const angle = (i / n) * Math.PI * 2 + rand(i + now) * 0.5;
          const radius = 50 + t * 8;
          add("spark", i % 2 ? vfx.glow : vfx.accent, now, { x: caster.x + Math.cos(angle) * radius, y: caster.y + Math.sin(angle) * radius * 0.7,
            tx: caster.x + dir * 12, ty: caster.y, w: 7 + t, h: 7 + t, life: 240, fadeIn: 60 }, { delay: i * 8 });
        }
        add("glow", vfx.glow, now, { x: caster.x + dir * 12, y: caster.y, w: 30 + t * 10, h: 30 + t * 10, life: 320, grow: 0.5, alpha: 0.8, fadeIn: 120 });
      }
      if (t >= 3) {
        add("rune", vfx.glow, now, { x: caster.x, y: caster.y + 88, w: 120 + t * 10, h: 34 + t * 3, life: Math.max(700, duration - 150), spin: 0, alpha: 0.9, fadeIn: 150 },
          { depth: 6, variant: t });
      }
      if (t >= 4) {
        dim(now, duration);
        flash(vfx.glow, now, 0.22, 260, 40);
        // Pillar of light on the caster.
        add("streak", vfx.core, now, { x: caster.x, y: caster.y - 40, w: 260, h: 42, rotation: -Math.PI / 2, life: 520, alpha: 0.75, fadeIn: 80 }, { depth: 9 });
      }
      for (const [index, at] of hitTimes.entries()) travel(vfx, { x: caster.x + dir * 20, y: caster.y }, target, at, now, index);
      if (vfx.signature) signatureCast(vfx, caster, target, dir, hitTimes, now);
    },

    impact(vfx, at, caster, dir, index, critical, now) {
      const t = vfx.tier;
      linger = 1.4 + t * 0.15;
      const scale = (1 + t * 0.14) * (critical ? 1.25 : 1);
      const facing = dir === 1 ? 0 : Math.PI;
      const tilt = (index % 2 ? 0.55 : -0.55) * dir;
      const glow = vfx.glow, core = vfx.core;
      // Base glint every strike gets: light, plus a solid tier-coloured bloom that reads on bright stages.
      add("glow", glow, now, { x: at.x, y: at.y, w: 46 * scale, h: 46 * scale, life: 220, grow: 0.6, alpha: 0.9 });
      if (t >= 1) add("glow", glow, now, { x: at.x, y: at.y, w: 70 * scale, h: 70 * scale, life: 260, grow: 0.5, alpha: 0.45 }, { blend: "normal", depth: 25 });
      switch (vfx.shape) {
        case "slash":
        case "heavy":
        case "flurry": {
          const big = vfx.shape === "heavy" ? 1.35 : vfx.shape === "flurry" ? 0.7 : 1;
          const strokes = vfx.shape === "flurry" ? 2 + (t >= 3 ? 1 : 0) : t >= 4 ? 3 : t >= 2 ? 2 : 1;
          for (let s = 0; s < strokes; s++) {
            const angle = facing + tilt * (s % 2 ? -1 : 1) + (vfx.shape === "flurry" ? (rand(index * 7 + s) - 0.5) * 1.4 : 0);
            const cy = at.y + (vfx.shape === "flurry" ? (rand(s + index) - 0.5) * 30 : 0);
            // Afterimage trail, the coloured blade-light, then a white-hot edge.
            if (t >= 2) add("crescent", glow, now, { x: at.x - dir * 30, y: cy, w: 66 * scale * big, h: 98 * scale * big, rotation: angle - dir * 0.35, life: 260, alpha: 0.45, grow: 0.2 }, { delay: s * 55 });
            add("crescent", s ? core : glow, now, { x: at.x - dir * 8, y: cy, w: 78 * scale * big, h: 116 * scale * big, rotation: angle, life: 260, grow: 0.25, spin: dir * 1.4 }, { delay: s * 55 + 10 });
            add("crescent", 0xffffff, now, { x: at.x - dir * 4, y: cy, w: 60 * scale * big, h: 96 * scale * big, rotation: angle, life: 160, grow: 0.3, spin: dir * 1.4, alpha: 0.9 }, { delay: s * 55 + 10, blend: "add" });
          }
          // A thin cut line across the target.
          add("streak", core, now, { x: at.x, y: at.y, w: 110 * scale * big, h: 6, rotation: facing + tilt * 0.8, life: 200, grow: 0.3 });
          if (vfx.shape === "heavy") {
            for (let i = 0; i < 6 + t * 2; i++) add("spark", 0xc9a877, now, { x: at.x + (rand(i) - 0.5) * 40, y: 369, w: 12, h: 8,
              vx: (rand(i * 3) - 0.5) * 120, vy: -30 - rand(i * 5) * 50, ay: 160, life: 480 }, { blend: "normal", depth: 12 });
          }
          break;
        }
        case "impact": {
          add("ring", core, now, { x: at.x, y: at.y, w: 26 * scale, h: 26 * scale, life: 300, grow: 2.2 });
          for (let i = 0; i < 6 + t * 2; i++) {
            const angle = (i / (6 + t * 2)) * Math.PI * 2;
            add("streak", glow, now, { x: at.x + Math.cos(angle) * 10, y: at.y + Math.sin(angle) * 10, w: 30 * scale, h: 6, rotation: angle,
              vx: Math.cos(angle) * 140, vy: Math.sin(angle) * 140, life: 220, grow: -0.4 });
          }
          if (t >= 3) add("rune", glow, now, { x: at.x, y: at.y, w: 70 * scale, h: 70 * scale, life: 420, grow: 0.5, spin: dir * 3, alpha: 0.8 }, { variant: index });
          break;
        }
        case "thrust": {
          for (let l = 0; l < 1 + Math.floor(t / 2); l++) {
            add("streak", l ? glow : core, now, { x: at.x - dir * 60, y: at.y + (l - Math.floor(t / 4)) * 9, w: 150 * scale, h: 9, rotation: facing,
              vx: dir * 90, life: 200, grow: 0.2 }, { delay: l * 30 });
          }
          add("ring", glow, now, { x: at.x, y: at.y, w: 22 * scale, h: 34 * scale, life: 260, grow: 1.4 });
          break;
        }
        case "projectile":
        case "wave":
        case "orb": {
          add("ring", glow, now, { x: at.x, y: at.y, w: 24 * scale, h: 24 * scale, life: 300, grow: 2 });
          add("glow", core, now, { x: at.x, y: at.y, w: 60 * scale, h: 60 * scale, life: 260, grow: 0.8, alpha: 0.9 });
          break;
        }
      }
      if (vfx.signature) signatureImpact(vfx, at, dir, index, now);
      // Rarity layers.
      const sparks = [6, 9, 13, 18, 26, 32][Math.min(5, t)] + (critical ? 8 : 0);
      for (let i = 0; i < sparks; i++) {
        const angle = i * 2.39996 + index;
        const speed = 60 + rand(i + index * 13) * (90 + t * 30);
        add("spark", i % 3 === 0 ? vfx.accent : glow, now, { x: at.x, y: at.y, w: 6 + t, h: 6 + t,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ay: 90, life: 280 + rand(i) * 220, grow: -0.5 });
      }
      if (t >= 2) {
        // Shockwave + afterimage echo.
        add("ring", glow, now, { x: at.x, y: at.y, w: 30, h: 16, life: 380, grow: 3.2, alpha: 0.6 }, { delay: 40 });
      }
      if (t >= 3) {
        elementBurst(vfx.element === "none" ? { ...vfx, element: "qi" } : vfx, at, caster, now, scale, index + 1);
        for (let i = 0; i < 6; i++) add("petal", vfx.accent, now, { x: at.x, y: at.y, w: 14, h: 8, rotation: rand(i) * 6,
          vx: (rand(i * 2 + index) - 0.5) * 160, vy: -40 - rand(i * 3) * 80, ay: 70, spin: 4, life: 800 }, { delay: 30 });
      } else {
        elementBurst(vfx, at, caster, now, scale, index + 1);
      }
      if (t >= 4) {
        flash(vfx.core, now, critical ? 0.5 : 0.32, 260);
        for (let i = 0; i < 10; i++) add("streak", vfx.core, now, { x: at.x, y: at.y, w: 150, h: 12, rotation: (i / 10) * Math.PI * 2,
          life: 360, grow: 0.5, alpha: 0.8 }, { delay: 30 });
        add("streak", vfx.glow, now, { x: at.x, y: at.y - 120, w: 300, h: 60, rotation: -Math.PI / 2, life: 420, alpha: 0.6 }, { depth: 9 });
      } else if (critical) {
        flash(0xffffff, now, 0.16, 160);
      }
    },

    whiff(vfx, at, dir, index, now) {
      linger = 1.2;
      const facing = dir === 1 ? 0 : Math.PI;
      if (vfx.shape === "slash" || vfx.shape === "heavy" || vfx.shape === "flurry") {
        add("crescent", vfx.glow, now, { x: at.x + dir * 24, y: at.y - 14, w: 60, h: 90, rotation: facing + (index % 2 ? 0.5 : -0.5) * dir,
          vx: dir * 120, life: 220, alpha: 0.5, grow: 0.3 });
      } else {
        add("streak", vfx.glow, now, { x: at.x + dir * 20, y: at.y - 18, w: 90, h: 7, rotation: facing, vx: dir * 200, life: 200, alpha: 0.6 });
      }
    },

    support(vfx, feet, height, now) {
      const t = vfx.tier;
      linger = 1.2 + t * 0.1;
      const glow = vfx.element === "none" ? vfx.glow : vfx.accent;
      // Ground ring, a coloured aura column, and rings of light rising up the body.
      add("ring", glow, now, { x: feet.x, y: feet.y, w: 70, h: 20, life: 560, grow: 1.4, alpha: 0.95 }, { depth: 7 });
      add("glow", glow, now, { x: feet.x, y: feet.y - height * 0.45, w: 80 + t * 16, h: height * 1.15, life: 620, grow: 0.15, alpha: 0.5, fadeIn: 120 }, { depth: 9, blend: "normal" });
      add("glow", vfx.core, now, { x: feet.x, y: feet.y - height * 0.45, w: 60 + t * 12, h: height, life: 560, alpha: 0.6, fadeIn: 120 }, { depth: 12 });
      for (let r = 0; r < 2 + Math.floor(t / 2); r++) {
        add("ring", glow, now, { x: feet.x, y: feet.y - 6, w: 64, h: 18, vy: -150, life: 520, alpha: 0.8, grow: -0.2 }, { delay: 80 + r * 140, depth: 12 });
      }
      const n = 10 + t * 5;
      for (let i = 0; i < n; i++) add(i % 4 === 0 ? "petal" : "spark", i % 2 ? glow : vfx.core, now, {
        x: feet.x + (rand(i + now) - 0.5) * 80, y: feet.y - rand(i * 3) * 30, w: 10 + t * 2, h: 10 + t * 2,
        vy: -70 - rand(i * 5) * 80, life: 650 + rand(i) * 400, grow: -0.4, fadeIn: 80 }, { delay: i * 22 });
      if (t >= 2) add("rune", glow, now, { x: feet.x, y: feet.y, w: 120 + t * 10, h: 34 + t * 3, life: 900, spin: 1.2, alpha: 1, fadeIn: 120 }, { depth: 6, variant: t });
      if (t >= 4) {
        add("streak", vfx.core, now, { x: feet.x, y: feet.y - 140, w: 300, h: 50, rotation: -Math.PI / 2, life: 700, alpha: 0.7, fadeIn: 120 }, { depth: 9 });
        flash(vfx.glow, now, 0.2, 320);
      }
      if (vfx.signature) signatureSupport(vfx, feet, height, now);
    },

    update(now) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.start;
        if (age < 0) continue;
        if (age >= p.life) { p.item.destroy(); particles.splice(i, 1); continue; }
        const k = age / p.life, s = age / 1000;
        let x = p.x + p.vx * s + 0.5 * p.ax * s * s;
        let y = p.y + p.vy * s + 0.5 * p.ay * s * s;
        if (p.tx !== undefined && p.ty !== undefined) {
          const e = 1 - (1 - k) ** 2;
          x = p.x + (p.tx - p.x) * e; y = p.y + (p.ty - p.y) * e;
        }
        const size = Math.max(0.05, 1 + p.grow * k);
        const fadeIn = p.fadeIn ? Math.min(1, age / p.fadeIn) : 1;
        p.item.setVisible(true).setPosition(x, y).setDisplaySize(p.w * size, p.h * size)
          .setRotation(p.rotation + p.spin * s).setAlpha(p.alpha * fadeIn * Math.min(1, (1 - k) * 2.2));
      }
      for (let i = overlays.length - 1; i >= 0; i--) {
        const o = overlays[i];
        const age = now - o.start;
        if (age < 0) continue;
        if (age >= o.life) { o.rect.destroy(); overlays.splice(i, 1); continue; }
        const rise = Math.min(1, age / 90);
        const fall = age < o.hold ? 1 : 1 - (age - o.hold) / Math.max(1, o.life - o.hold);
        o.rect.setAlpha(o.peak * rise * Math.max(0, fall));
      }
    },

    count: () => particles.length,

    destroy() {
      particles.splice(0).forEach((p) => p.item.destroy());
      overlays.splice(0).forEach((o) => o.rect.destroy());
    },
  };
}
