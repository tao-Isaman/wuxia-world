import * as Phaser from "phaser";
import { RAGE_STYLES, statusKey, statusStyle, type StatusIcon, type StatusStyle } from "@/lib/ui/status-catalog";
import type { MeridianElement } from "@/lib/game/meridian-types";

/**
 * Battle status visuals — one look for every buff and debuff a unit carries:
 *   • a row of status icons over the unit (pictogram per kind, ▲ / ▼, stack count);
 *   • a persistent aura while it lasts (motes rising for buffs, sinking for
 *     debuffs, dripping poison, embers for burn, stars circling a stunned head,
 *     a qi bubble for a shield that shrinks with it, ward runes that orbit and
 *     break one by one, an elemental glow for rages);
 *   • a burst when it lands and a fade when it ends;
 *   • proc bursts (revive, shield, ward, rage, sap, opening, absorb).
 * Everything is pooled per unit and textures are drawn once per colour into
 * canvases (the Canvas renderer has no tint), so a frame allocates nothing.
 */

export interface StatusAnchor {
  /** Feet point (world) and the row scale. */
  x: number; y: number; s: number;
  /** Figure height at scale 1. */
  head: number;
  /** World y of the top of the HP bars (icons sit above it). */
  top: number;
  /** The unit sprite's depth. */
  depth: number;
  /** Draw nothing (dead, fled, not on the board). */
  hidden: boolean;
}

/** The status records of a unit (GridUnit.status), read loosely so new kinds draw too. */
export interface StatusSource {
  buffs: readonly { t: string; n?: string; v?: number; u?: number; el?: string }[];
  debuffs: readonly { t: string; n?: string; v?: number; u?: number; el?: string }[];
  stk?: number;
  stkV?: number;
}

export type ProcKind = "revive" | "shield" | "ward" | "rage" | "sap" | "opening" | "absorb";

export interface StatusVfx {
  /** Per frame: draw a unit's statuses (pass the status object it should show; same object = no diff). */
  sync(id: string, status: StatusSource | null, anchor: StatusAnchor, now: number): void;
  /** A one-off proc burst on a unit. */
  proc(id: string, kind: ProcKind, el: MeridianElement | undefined, anchor: StatusAnchor, now: number): void;
  /** CSS px → world units (call on resize). */
  setUiScale(scale: number): void;
  setReduced(reduced: boolean): void;
  /** Advance the transient bursts. */
  update(now: number): void;
  /** For tests: the status keys shown per unit. */
  shown(id: string): string[];
  /** How many status icons a unit shows (0 = none). */
  iconCount(id: string): number;
  destroy(): void;
}

export interface StatusVfxOptions {
  /** A floating label (status applied / ended). */
  label: (text: string, color: string, x: number, y: number) => void;
}

interface Group { key: string; style: StatusStyle; stacks: number; v: number; u: number; t: string; icon?: string }

interface UnitFx {
  icons: { bg: Phaser.GameObjects.Image; count: Phaser.GameObjects.Image }[];
  motes: Phaser.GameObjects.Image[];
  stars: Phaser.GameObjects.Image[];
  runes: Phaser.GameObjects.Image[];
  bubble: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  groups: Group[];
  /** Groups with a mote aura, and the one that colours the ground glow. */
  aura: Group[];
  lead: Group | null;
  ref: StatusSource | null;
  shieldMax: number;
  shieldV: number;
  wards: number;
  keys: Set<string>;
  primed: boolean;
}

interface Bit {
  item: Phaser.GameObjects.Image;
  live: boolean;
  start: number; life: number;
  x: number; y: number; vx: number; vy: number; ay: number;
  w0: number; w1: number; h0: number; h1: number;
  a0: number; spin: number;
}

const ICON_PX = 16;      // CSS px per status icon
const MAX_ICONS = 6;
const MOTES = 8;
const BITS = 96;
const hex = (c: number) => c.toString(16).padStart(6, "0");
const rgba = (c: number, a: number) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const lighten = (c: number, k: number) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  return (Math.round(r + (255 - r) * k) << 16) | (Math.round(g + (255 - g) * k) << 8) | Math.round(b + (255 - b) * k);
};

export function createStatusVfx(scene: Phaser.Scene, options: StatusVfxOptions): StatusVfx {
  let ui = 1;
  let reduced = false;
  const units = new Map<string, UnitFx>();
  const COUNT_KEYS: string[] = [];
  const bits: Bit[] = [];
  let bitCursor = 0;

  // ── Textures (drawn once per colour) ────────────────────────────────
  function make(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void): string {
    if (scene.textures.exists(key)) return key;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d")!, w, h);
    scene.textures.addCanvas(key, canvas);
    return key;
  }
  const glowTex = (color: number) => make(`sfx:glow:${hex(color)}`, 64, 64, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.18, rgba(color, 0.9)); g.addColorStop(0.55, rgba(color, 0.28)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  });
  const ringTex = (color: number) => make(`sfx:ring:${hex(color)}`, 128, 128, (c, w) => {
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = i === 4 ? "rgba(255,255,255,.95)" : rgba(color, 0.14 + i * 0.16);
      c.lineWidth = 12 - i * 2.5;
      c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 8, 0, Math.PI * 2); c.stroke();
    }
  });
  const pillarTex = (color: number) => make(`sfx:pillar:${hex(color)}`, 48, 192, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.35, rgba(color, 0.55)); g.addColorStop(0.5, "rgba(255,255,255,.95)");
    g.addColorStop(0.65, rgba(color, 0.55)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "destination-in";
    const v = c.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(0.3, "rgba(0,0,0,1)"); v.addColorStop(0.85, "rgba(0,0,0,1)"); v.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = v; c.fillRect(0, 0, w, h);
  });
  const bubbleTex = (color: number) => make(`sfx:bubble:${hex(color)}`, 128, 160, (c, w, h) => {
    const cx = w / 2, cy = h / 2, rx = w / 2 - 4, ry = h / 2 - 4;
    c.save(); c.translate(cx, cy); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
    g.addColorStop(0, rgba(color, 0.04)); g.addColorStop(0.8, rgba(color, 0.2)); g.addColorStop(1, rgba(color, 0.55));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    c.strokeStyle = rgba(lighten(color, 0.5), 0.9); c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, rx - 1.5, 0, Math.PI * 2); c.stroke();
    // Hex weave and a highlight.
    c.strokeStyle = rgba(lighten(color, 0.4), 0.22); c.lineWidth = 1.2;
    for (let a = 0; a < 6; a++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a * Math.PI / 3) * rx, Math.sin(a * Math.PI / 3) * rx); c.stroke(); }
    c.beginPath(); c.arc(0, 0, rx * 0.62, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(-rx * 0.38, -rx * 0.5, rx * 0.2, rx * 0.09, -0.6, 0, Math.PI * 2); c.fill();
    c.restore();
  });
  const runeTex = (color: number) => make(`sfx:rune:${hex(color)}`, 40, 40, (c, w) => {
    const g = c.createRadialGradient(20, 20, 0, 20, 20, 20);
    g.addColorStop(0, rgba(color, 0.55)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(0, 0, w, w);
    c.strokeStyle = "rgba(255,248,220,.95)"; c.lineWidth = 2;
    c.beginPath(); c.arc(20, 20, 11, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "rgba(255,248,220,.95)";
    c.fillRect(14, 14, 12, 2.4); c.fillRect(14, 19, 5, 2.4); c.fillRect(21, 19, 5, 2.4); c.fillRect(14, 24, 12, 2.4);
  });
  const starTex = (color: number) => make(`sfx:star:${hex(color)}`, 32, 32, (c) => {
    c.translate(16, 16);
    c.fillStyle = rgba(color, 1); c.strokeStyle = "rgba(60,40,0,.8)"; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 13, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill(); c.stroke();
  });
  const chevronTex = (color: number) => make(`sfx:chev:${hex(color)}`, 40, 28, (c) => {
    c.strokeStyle = "rgba(20,10,8,.8)"; c.lineWidth = 9; c.lineCap = "round"; c.lineJoin = "round";
    c.beginPath(); c.moveTo(6, 6); c.lineTo(20, 20); c.lineTo(34, 6); c.stroke();
    c.strokeStyle = rgba(color, 1); c.lineWidth = 5;
    c.beginPath(); c.moveTo(6, 6); c.lineTo(20, 20); c.lineTo(34, 6); c.stroke();
  });
  const countTex = (n: number) => make(`sfx:count:${n}`, 28, 20, (c) => {
    c.fillStyle = "rgba(20,10,8,.9)"; c.beginPath(); c.roundRect(1, 1, 26, 18, 8); c.fill();
    c.font = "700 14px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff6d8";
    c.fillText(`×${n}`, 14, 11);
  });

  /** A status icon: a dark medallion, the kind's pictogram in its colour, ▲ / ▼ in the corner. */
  function iconTex(style: StatusStyle): string {
    return make(`sfx:icon:${style.icon}:${hex(style.color)}:${style.arrow ?? ""}:${style.kind}`, 48, 48, (c) => {
      const color = style.color;
      c.fillStyle = style.kind === "buff" ? "rgba(18,24,20,.92)" : "rgba(34,12,12,.92)";
      c.beginPath(); c.arc(24, 24, 21, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rgba(color, 1); c.lineWidth = 3; c.stroke();
      c.save(); c.translate(24, 24);
      drawIcon(c, style.icon, color);
      c.restore();
      if (style.arrow) {
        c.fillStyle = style.arrow === "up" ? "#7dff9a" : "#ff6a5a";
        c.strokeStyle = "rgba(10,6,4,.95)"; c.lineWidth = 2;
        c.beginPath();
        if (style.arrow === "up") { c.moveTo(38, 2); c.lineTo(47, 14); c.lineTo(29, 14); }
        else { c.moveTo(38, 46); c.lineTo(47, 34); c.lineTo(29, 34); }
        c.closePath(); c.stroke(); c.fill();
      }
    });
  }

  // ── Pools ───────────────────────────────────────────────────────────
  function unitFx(id: string): UnitFx {
    let fx = units.get(id);
    if (fx) return fx;
    const img = (key: string) => scene.add.image(0, 0, key).setVisible(false);
    fx = {
      icons: [], motes: [], stars: [], runes: [],
      bubble: img(bubbleTex(0x7fd8ff)),
      glow: img(glowTex(0xffffff)),
      groups: [], aura: [], lead: null, ref: null, shieldMax: 0, shieldV: 0, wards: 0, keys: new Set(), primed: false,
    };
    for (let i = 0; i < MOTES; i++) fx.motes.push(img(glowTex(0xffffff)));
    for (let i = 0; i < 3; i++) fx.stars.push(img(starTex(0xfff27a)));
    for (let i = 0; i < 5; i++) fx.runes.push(img(runeTex(0xf3d27a)));
    units.set(id, fx);
    return fx;
  }
  function iconSlot(fx: UnitFx, i: number) {
    while (fx.icons.length <= i) {
      fx.icons.push({ bg: scene.add.image(0, 0, countTex(1)).setVisible(false), count: scene.add.image(0, 0, countTex(2)).setVisible(false) });
    }
    return fx.icons[i];
  }
  function bit(key: string): Bit {
    let b: Bit;
    if (bits.length < BITS) {
      b = { item: scene.add.image(0, 0, key), live: true, start: 0, life: 1, x: 0, y: 0, vx: 0, vy: 0, ay: 0, w0: 1, w1: 1, h0: 1, h1: 1, a0: 1, spin: 0 };
      bits.push(b);
    } else {
      b = bits[bitCursor];
      bitCursor = (bitCursor + 1) % BITS;
      b.item.setTexture(key);
    }
    b.live = true;
    b.item.setVisible(true).setRotation(0).setAlpha(1).setBlendMode(Phaser.BlendModes.ADD);
    return b;
  }
  function spawn(key: string, now: number, life: number, x: number, y: number, o: Partial<Pick<Bit, "vx" | "vy" | "ay" | "w0" | "w1" | "h0" | "h1" | "a0" | "spin">>, depth: number, normal = false) {
    const b = bit(key);
    b.start = now; b.life = life; b.x = x; b.y = y;
    b.vx = o.vx ?? 0; b.vy = o.vy ?? 0; b.ay = o.ay ?? 0;
    b.w0 = o.w0 ?? 20; b.w1 = o.w1 ?? b.w0; b.h0 = o.h0 ?? b.w0; b.h1 = o.h1 ?? (b.h0 * b.w1 / b.w0);
    b.a0 = o.a0 ?? 1; b.spin = o.spin ?? 0;
    b.item.setDepth(depth).setPosition(x, y).setDisplaySize(b.w0, b.h0);
    if (normal) b.item.setBlendMode(Phaser.BlendModes.NORMAL);
  }

  // ── Bursts ──────────────────────────────────────────────────────────
  function ring(color: number, a: StatusAnchor, now: number, grow: boolean, life = 520) {
    const w = 70 * a.s;
    spawn(ringTex(color), now, life, a.x, a.y, { w0: grow ? w * 0.4 : w * 1.3, w1: grow ? w * 1.5 : w * 0.3, h0: (grow ? w * 0.4 : w * 1.3) * 0.42, h1: (grow ? w * 1.5 : w * 0.3) * 0.42 }, a.depth - 0.1);
  }
  function sparks(color: number, a: StatusAnchor, now: number, n: number, dir: -1 | 1, spread = 1) {
    const key = glowTex(color);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const x = a.x + Math.cos(ang) * 22 * a.s * spread;
      const y = a.y - a.head * a.s * (dir < 0 ? 0.15 : 0.95) + Math.sin(ang) * 6 * a.s;
      spawn(key, now + 0, 520 + (i % 3) * 120, x, y, { vx: Math.cos(ang) * 8, vy: dir * (60 + (i % 4) * 22) * a.s, w0: 12 * a.s, w1: 4 * a.s }, a.depth + 0.2);
    }
  }
  function applyBurst(g: Group, a: StatusAnchor, now: number) {
    if (reduced) return;
    const buff = g.style.kind === "buff";
    ring(g.style.color, a, now, true);
    sparks(g.style.color, a, now, 8, buff ? -1 : 1);
    if (!buff) {
      // A debuff lands: chevrons fall onto the head.
      for (let i = 0; i < 3; i++) {
        spawn(chevronTex(g.style.color), now + i * 70, 420, a.x, a.y - a.head * a.s * 1.25 - i * 10 * a.s,
          { vy: 90 * a.s, w0: 22 * a.s, a0: 0.95 }, a.depth + 0.3, true);
      }
    }
  }
  function expireBurst(g: Group, a: StatusAnchor, now: number) {
    if (reduced) return;
    ring(g.style.color, a, now, false, 420);
  }

  function proc(id: string, kind: ProcKind, el: MeridianElement | undefined, a: StatusAnchor, now: number) {
    unitFx(id);
    if (a.hidden) return;
    const chestY = a.y - a.head * a.s * 0.55;
    switch (kind) {
      case "revive": {
        const gold = 0xffd36a;
        spawn(pillarTex(gold), now, 1100, a.x, a.y - a.head * a.s * 0.9, { w0: 40 * a.s, w1: 70 * a.s, h0: a.head * a.s * 2.4, h1: a.head * a.s * 2.6 }, a.depth + 0.4);
        ring(gold, a, now, true, 800);
        ring(0xff8a4a, a, now + 0, true, 1100);
        if (!reduced) {
          // Phoenix wings: two fans of embers sweeping up and out.
          for (let i = 0; i < 14; i++) {
            const side = i % 2 ? 1 : -1, k = Math.floor(i / 2) / 7;
            spawn(glowTex(i % 3 ? gold : 0xff7a3a), now + k * 160, 900, a.x, chestY,
              { vx: side * (40 + k * 90) * a.s, vy: -(90 + k * 40) * a.s, ay: 60 * a.s, w0: 18 * a.s, w1: 5 * a.s }, a.depth + 0.5);
          }
        }
        break;
      }
      case "shield": {
        ring(0x7fd8ff, a, now, true, 700);
        spawn(bubbleTex(0x7fd8ff), now, 600, a.x, chestY, { w0: 40 * a.s, w1: 90 * a.s, a0: 0.9 }, a.depth + 0.3);
        break;
      }
      case "absorb": {
        spawn(bubbleTex(0x7fd8ff), now, 380, a.x, chestY, { w0: 84 * a.s, w1: 96 * a.s, a0: 1 }, a.depth + 0.35);
        if (!reduced) sparks(0xbfefff, a, now, 6, -1, 1.4);
        break;
      }
      case "ward": {
        ring(0xf3d27a, a, now, true, 700);
        for (let i = 0; i < 5; i++) {
          const ang = (i / 5) * Math.PI * 2;
          spawn(runeTex(0xf3d27a), now + i * 60, 600, a.x + Math.cos(ang) * 40 * a.s, chestY + Math.sin(ang) * 12 * a.s,
            { w0: 26 * a.s, w1: 14 * a.s, vy: -20 * a.s }, a.depth + 0.3);
        }
        break;
      }
      case "rage": {
        const color = el ? RAGE_STYLES[el].color : 0xff5a2a;
        ring(color, a, now, true, 560);
        if (!reduced) sparks(color, a, now, 10, -1, 0.8);
        spawn(glowTex(color), now, 500, a.x, chestY, { w0: 50 * a.s, w1: 110 * a.s, h0: 90 * a.s, h1: 160 * a.s, a0: 0.75 }, a.depth - 0.05);
        break;
      }
      case "sap": {
        const color = 0xc65a8a;
        for (let i = 0; i < 4; i++) {
          spawn(chevronTex(color), now + i * 60, 460, a.x, a.y - a.head * a.s * 1.35 - i * 12 * a.s,
            { vy: 120 * a.s, w0: 26 * a.s, a0: 1 }, a.depth + 0.3, true);
        }
        ring(color, a, now, false, 460);
        break;
      }
      case "opening": {
        const color = 0xffc86a;
        ring(color, a, now, true, 900);
        ring(color, a, now + 0, true, 1300);
        spawn(pillarTex(color), now, 900, a.x, a.y - a.head * a.s * 0.7, { w0: 60 * a.s, w1: 30 * a.s, h0: a.head * a.s * 1.8, a0: 0.7 }, a.depth - 0.05);
        if (!reduced) sparks(color, a, now, 12, -1, 1.2);
        break;
      }
    }
  }

  // ── Per-frame status drawing ────────────────────────────────────────
  function regroup(fx: UnitFx, status: StatusSource | null) {
    fx.groups = [];
    fx.aura = [];
    fx.lead = null;
    if (!status) return;
    const add = (r: StatusSource["buffs"][number], kind: "buff" | "debuff") => {
      const key = statusKey(r);
      const found = fx.groups.find((g) => g.key === key);
      if (found) { found.stacks++; found.v += r.v ?? 0; found.u = Math.max(found.u, r.u ?? 0); return; }
      fx.groups.push({ key, style: statusStyle(r, kind), stacks: 1, v: r.v ?? 0, u: r.u ?? 0, t: r.t });
    };
    for (const b of status.buffs) add(b, "buff");
    if ((status.stk ?? 0) > 0) fx.groups.push({ key: "stack_atk", style: statusStyle({ t: "stack_atk" }, "buff"), stacks: status.stk!, v: (status.stk ?? 0) * (status.stkV ?? 0), u: 0, t: "stack_atk" });
    for (const d of status.debuffs) add(d, "debuff");
    for (const g of fx.groups) g.icon = iconTex(g.style);
    fx.aura = fx.groups.filter((g) => g.style.aura === "rise" || g.style.aura === "fall" || g.style.aura === "drip");
    fx.lead = fx.groups.find((g) => g.style.kind === "buff" && g.t !== "shield" && g.t !== "ward") ?? fx.groups.find((g) => g.style.kind === "debuff") ?? null;
  }

  function sync(id: string, status: StatusSource | null, a: StatusAnchor, now: number) {
    const fx = unitFx(id);
    if (status !== fx.ref) {
      fx.ref = status;
      regroup(fx, status);
      const next = new Set(fx.groups.map((g) => g.key));
      if (fx.primed && !a.hidden) {
        for (const g of fx.groups) if (!fx.keys.has(g.key)) {
          applyBurst(g, a, now);
          options.label(`${g.style.kind === "buff" ? "▲" : "▼"} ${g.style.label}`, g.style.kind === "buff" ? "#bff5cf" : "#ffb4a6",
            a.x, a.top - 34 * ui);
        }
        for (const key of fx.keys) if (!next.has(key)) {
          const old = statusStyle({ t: key.split(":")[0], el: key.split(":")[1] }, key.startsWith("debuff") || key === "stun" || key === "burn_hp_mp" ? "debuff" : "buff");
          expireBurst({ key, style: old, stacks: 0, v: 0, u: 0, t: key }, a, now);
        }
      }
      fx.keys = next;
      fx.primed = true;
      // Shield: remember its fullest value; a gone shield shatters.
      const shield = fx.groups.find((g) => g.t === "shield");
      const v = shield ? Math.max(0, shield.v) : 0;
      if (v > fx.shieldMax || !shield) fx.shieldMax = v;
      if (!shield && fx.shieldV > 0 && !a.hidden && !reduced) {
        const chestY = a.y - a.head * a.s * 0.55;
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          spawn(glowTex(0xbfefff), now, 560, a.x + Math.cos(ang) * 26 * a.s, chestY + Math.sin(ang) * 34 * a.s,
            { vx: Math.cos(ang) * 120 * a.s, vy: Math.sin(ang) * 90 * a.s, ay: 160 * a.s, w0: 12 * a.s, w1: 3 * a.s }, a.depth + 0.4);
        }
        ring(0x7fd8ff, a, now, true, 420);
        options.label("โล่แตก", "#bfefff", a.x, a.top - 34 * ui);
      }
      fx.shieldV = v;
      // Ward: a broken rune flashes away.
      const ward = fx.groups.find((g) => g.t === "ward");
      const wards = ward ? Math.max(0, Math.round(ward.v)) : 0;
      if (wards < fx.wards && !a.hidden) {
        for (let i = wards; i < fx.wards && i < 5; i++) {
          const r = fx.runes[i];
          spawn(runeTex(0xfff2c0), now, 420, r.x, r.y, { w0: 16 * a.s, w1: 40 * a.s, a0: 1 }, a.depth + 0.4);
        }
      }
      fx.wards = wards;
    }

    const show = !a.hidden;
    const groups = fx.groups;
    // Icon row (centred over the bars).
    const icons = Math.min(MAX_ICONS, groups.length);
    const size = ICON_PX * ui, gap = 2 * ui;
    const rowW = icons * size + (icons - 1) * gap;
    for (let i = 0; i < Math.max(icons, fx.icons.length); i++) {
      const slot = iconSlot(fx, i);
      if (i >= icons || !show) { slot.bg.setVisible(false); slot.count.setVisible(false); continue; }
      const g = groups[i];
      const x = a.x - rowW / 2 + size / 2 + i * (size + gap), y = a.top - size / 2 - 2 * ui;
      const key = g.icon!;
      if (slot.bg.texture.key !== key) slot.bg.setTexture(key);
      // A status about to end blinks.
      const ending = g.u === 1 && g.t !== "buff_riposte" && !reduced ? 0.55 + 0.45 * Math.abs(Math.sin(now / 160)) : 1;
      slot.bg.setVisible(true).setPosition(x, y).setDisplaySize(size, size).setDepth(34).setAlpha(ending);
      const n = g.t === "ward" ? Math.round(g.v) : g.t === "stack_atk" ? g.stacks : g.stacks > 1 ? g.stacks : 0;
      if (n > 1) {
        const ck = COUNT_KEYS[Math.min(9, n)] ??= countTex(Math.min(9, n));
        if (slot.count.texture.key !== ck) slot.count.setTexture(ck);
        slot.count.setVisible(true).setPosition(x + size * 0.38, y + size * 0.36).setDisplaySize(size * 0.78, size * 0.56).setDepth(34.1);
      } else slot.count.setVisible(false);
    }

    // Aura motes, cycling through the statuses that have one.
    const auraGroups = fx.aura;
    const chestY = a.y - a.head * a.s * 0.55;
    for (let i = 0; i < MOTES; i++) {
      const m = fx.motes[i];
      if (!show || reduced || auraGroups.length === 0) { m.setVisible(false); continue; }
      const g = auraGroups[i % auraGroups.length];
      const key = glowTex(g.style.color);
      if (m.texture.key !== key) m.setTexture(key);
      const period = g.style.aura === "drip" ? 1300 : 1700;
      const t = ((now + i * (period / MOTES) * 1.7) % period) / period;
      const side = Math.sin(i * 2.4 + 0.7) * 24 * a.s;
      let y: number;
      if (g.style.aura === "rise") y = a.y - t * a.head * a.s * 1.05;
      else if (g.style.aura === "fall") y = a.y - a.head * a.s * (1.05 - t * 0.95);
      else y = chestY + t * a.head * a.s * 0.5;
      const sway = Math.sin(now / 300 + i) * 4 * a.s;
      const w = (g.style.aura === "drip" ? 9 : 11) * a.s * (1 - t * 0.5);
      m.setVisible(true).setPosition(a.x + side + sway, y).setDisplaySize(w, w * (g.style.aura === "drip" ? 1.4 : 1))
        .setAlpha(Math.sin(t * Math.PI) * 0.9).setDepth(a.depth + (i % 2 ? 0.05 : -0.05)).setBlendMode(Phaser.BlendModes.ADD);
    }

    // Ground glow in the strongest (latest) buff's colour; red-violet if only debuffs.
    const lead = fx.lead;
    if (show && lead) {
      const key = glowTex(lead.style.color);
      if (fx.glow.texture.key !== key) fx.glow.setTexture(key);
      const pulse = reduced ? 1 : 1 + Math.sin(now / 380) * 0.08;
      fx.glow.setVisible(true).setPosition(a.x, a.y + 2 * a.s).setDisplaySize(100 * a.s * pulse, 34 * a.s * pulse)
        .setAlpha(lead.style.kind === "buff" ? 0.55 : 0.45).setDepth(a.depth - 0.3).setBlendMode(Phaser.BlendModes.ADD);
    } else fx.glow.setVisible(false);

    // Stun: stars circling the head.
    let stunned = false;
    for (let i = 0; i < groups.length; i++) if (groups[i].t === "stun") stunned = true;
    for (let i = 0; i < fx.stars.length; i++) {
      const star = fx.stars[i];
      if (!show || !stunned) { star.setVisible(false); continue; }
      const ang = (reduced ? 0 : now / 360) + i * (Math.PI * 2 / 3);
      const y = a.y - a.head * a.s * 1.02 + Math.sin(ang) * 5 * a.s;
      star.setVisible(true).setPosition(a.x + Math.cos(ang) * 20 * a.s, y).setDisplaySize(13 * a.s, 13 * a.s)
        .setRotation(reduced ? 0 : now / 200).setDepth(a.depth + (Math.sin(ang) > 0 ? 0.2 : -0.2));
    }

    // Shield bubble, shrinking with what is left.
    if (show && fx.shieldV > 0) {
      const frac = fx.shieldMax > 0 ? Math.max(0.35, Math.sqrt(fx.shieldV / fx.shieldMax)) : 1;
      const wob = reduced ? 0 : Math.sin(now / 420) * 0.025;
      const w = 82 * a.s * (0.6 + 0.4 * frac) * (1 + wob), h = a.head * a.s * 1.12 * (0.6 + 0.4 * frac) * (1 - wob);
      fx.bubble.setVisible(true).setPosition(a.x, a.y - h / 2 + 4 * a.s).setDisplaySize(w, h)
        .setAlpha(0.55 + 0.35 * frac).setDepth(a.depth + 0.15).setBlendMode(Phaser.BlendModes.NORMAL);
    } else fx.bubble.setVisible(false);

    // Ward runes orbiting the waist.
    for (let i = 0; i < fx.runes.length; i++) {
      const r = fx.runes[i];
      if (!show || i >= Math.min(5, fx.wards)) { r.setVisible(false); continue; }
      const n = Math.min(5, fx.wards);
      const ang = (reduced ? 0 : now / 900) + i * (Math.PI * 2 / n);
      const front = Math.sin(ang) > 0;
      r.setVisible(true).setPosition(a.x + Math.cos(ang) * 34 * a.s, a.y - a.head * a.s * 0.42 + Math.sin(ang) * 9 * a.s)
        .setDisplaySize(15 * a.s, 15 * a.s).setAlpha(front ? 1 : 0.55).setDepth(a.depth + (front ? 0.25 : -0.25))
        .setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  function update(now: number) {
    for (const b of bits) {
      if (!b.live) continue;
      const age = now - b.start;
      if (age < 0) { b.item.setVisible(false); continue; }
      if (age >= b.life) { b.live = false; b.item.setVisible(false); continue; }
      const t = age / b.life, s = age / 1000;
      b.item.setVisible(true)
        .setPosition(b.x + b.vx * s, b.y + b.vy * s + 0.5 * b.ay * s * s)
        .setDisplaySize(b.w0 + (b.w1 - b.w0) * t, b.h0 + (b.h1 - b.h0) * t)
        .setAlpha(b.a0 * Math.min(1, (1 - t) * 2.2) * Math.min(1, age / 60))
        .setRotation(b.spin * s);
    }
  }

  return {
    sync, proc, update,
    setUiScale(scale) { ui = scale; },
    setReduced(value) { reduced = value; },
    shown(id) { return units.get(id)?.groups.map((g) => g.key) ?? []; },
    iconCount(id) { return Math.min(MAX_ICONS, units.get(id)?.groups.length ?? 0); },
    destroy() {
      for (const fx of units.values()) {
        for (const slot of fx.icons) { slot.bg.destroy(); slot.count.destroy(); }
        for (const m of [...fx.motes, ...fx.stars, ...fx.runes, fx.bubble, fx.glow]) m.destroy();
      }
      units.clear();
      for (const b of bits) b.item.destroy();
      bits.length = 0;
    },
  };
}

/** The pictograms, drawn centred at (0, 0) in a ~30 px box. */
function drawIcon(c: CanvasRenderingContext2D, icon: StatusIcon, color: number) {
  const fill = rgba(color, 1);
  c.fillStyle = fill; c.strokeStyle = fill; c.lineWidth = 3; c.lineCap = "round"; c.lineJoin = "round";
  const path = (pts: number[][], close = true) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (close) c.closePath(); };
  switch (icon) {
    case "sword":
      path([[-2, -13], [2, -13], [2, 5], [-2, 5]]); c.fill();
      c.fillRect(-8, 5, 16, 3); c.fillRect(-1.5, 8, 3, 6);
      break;
    case "shield":
      path([[0, -13], [11, -8], [10, 3], [0, 13], [-10, 3], [-11, -8]]); c.fill();
      c.fillStyle = "rgba(0,0,0,.35)"; path([[0, -8], [6, -5], [5, 2], [0, 7]]); c.fill();
      break;
    case "rock":
      path([[-12, 9], [-8, -4], [-2, -11], [6, -7], [12, 2], [9, 10]]); c.fill();
      c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2; path([[-2, -11], [0, 0], [9, 10]], false); c.stroke();
      break;
    case "swirl":
      c.beginPath(); for (let a = 0; a < Math.PI * 3.2; a += 0.2) { const r = 2 + a * 1.15; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
      break;
    case "chevrons":
      c.lineWidth = 3.5;
      path([[-9, -2], [0, -11], [9, -2]], false); c.stroke();
      path([[-9, 8], [0, -1], [9, 8]], false); c.stroke();
      break;
    case "star":
      c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 5.5 : 13, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
      break;
    case "drop":
      c.beginPath(); c.moveTo(0, -13); c.bezierCurveTo(9, -2, 10, 4, 0, 12); c.bezierCurveTo(-10, 4, -9, -2, 0, -13); c.fill();
      c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.arc(-3, 3, 2.5, 0, Math.PI * 2); c.fill();
      break;
    case "flame":
      c.beginPath(); c.moveTo(0, 13); c.bezierCurveTo(-12, 10, -10, -3, -3, -13); c.bezierCurveTo(-2, -5, 4, -6, 4, -11);
      c.bezierCurveTo(12, -2, 11, 10, 0, 13); c.fill();
      c.fillStyle = "rgba(255,240,180,.85)"; c.beginPath(); c.moveTo(0, 11); c.bezierCurveTo(-5, 9, -4, 2, 0, -3); c.bezierCurveTo(4, 2, 5, 9, 0, 11); c.fill();
      break;
    case "bolt":
      path([[3, -14], [-8, 2], [-1, 2], [-4, 14], [8, -3], [1, -3]]); c.fill();
      break;
    case "mirror":
      c.beginPath(); c.ellipse(0, -2, 8, 10, 0, 0, Math.PI * 2); c.stroke(); c.fillRect(-1.5, 8, 3, 6);
      c.lineWidth = 2; path([[-3, -6], [3, 0]], false); c.stroke();
      break;
    case "riposte":
      c.lineWidth = 3.5; c.beginPath(); c.arc(0, 1, 9, Math.PI * 0.9, Math.PI * 2.3); c.stroke();
      path([[7, -10], [11, -2], [3, -3]]); c.fill();
      break;
    case "qi":
      c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, -5.5, 5.5, -Math.PI / 2, Math.PI / 2); c.arc(0, 5.5, 5.5, -Math.PI / 2, Math.PI / 2, true); c.arc(0, 0, 11, Math.PI / 2, -Math.PI / 2); c.fill();
      break;
    case "bubble":
      path([[0, -13], [11, -6.5], [11, 6.5], [0, 13], [-11, 6.5], [-11, -6.5]]); c.stroke();
      c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1;
      break;
    case "rune":
      c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.stroke();
      c.fillRect(-6, -6, 12, 2.6); c.fillRect(-6, -1.3, 4.5, 2.6); c.fillRect(1.5, -1.3, 4.5, 2.6); c.fillRect(-6, 3.4, 12, 2.6);
      break;
    case "skull":
      c.beginPath(); c.arc(0, -3, 9, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(5, 10); c.lineTo(-5, 10); c.closePath(); c.fill();
      c.fillStyle = "rgba(0,0,0,.85)"; c.beginPath(); c.arc(-3.5, -2, 2.6, 0, Math.PI * 2); c.arc(3.5, -2, 2.6, 0, Math.PI * 2); c.fill();
      break;
    case "spiral":
      c.lineWidth = 2.6;
      c.beginPath(); for (let a = 0; a < Math.PI * 4; a += 0.2) { const r = 1 + a * 0.85; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } c.stroke();
      break;
    case "eye":
      c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(0, -11, 12, 0); c.quadraticCurveTo(0, 11, -12, 0); c.stroke();
      c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill();
      c.lineWidth = 2.4; path([[-11, 10], [11, -10]], false); c.stroke();
      break;
    case "fist":
      c.beginPath(); c.roundRect(-9, -7, 18, 15, 4); c.fill();
      c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(-4, -7, 1.5, 7); c.fillRect(1, -7, 1.5, 7); c.fillRect(-9, 0, 18, 1.5);
      break;
    case "plus":
      c.fillRect(-3, -11, 6, 22); c.fillRect(-11, -3, 22, 6);
      break;
  }
}
