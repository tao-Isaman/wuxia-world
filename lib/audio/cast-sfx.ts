import type { CastVfx } from "../stage/cast-vfx";
import { audioReady, note, now, swoosh, thump, tone } from "./engine";

/**
 * Skill sounds follow the same profile as the VFX:
 *   weapon family → the strike (blade ring, heavy cleave, palm thump, spear
 *     hiss, needle whistles, zither waves, qi orb)
 *   rarity → weight: T2+ adds a second layer, T3 a chime, T4 a gong swell
 *   element → an accent (crackle, thunder, bubbles, frost bells, …)
 */

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16];

/** Qi gathering before the strike (plays during the 300 ms wind-up). */
export function castStartSfx(vfx: CastVfx) {
  if (!audioReady()) return;
  const t = now();
  if (vfx.tier >= 1 || vfx.kind === "art") {
    swoosh(t, 0.3, 300, 1800 + vfx.tier * 400, 0.12 + vfx.tier * 0.04, 3);
    tone(t, 0.3, 180 + vfx.tier * 40, 420 + vfx.tier * 140, 0.05 + vfx.tier * 0.02, "triangle");
  }
  if (vfx.tier >= 3) note("bell", 86 + vfx.tier, t + 0.05, 0.2);
  if (vfx.tier >= 4) note("gong", 40, t, 0.55, 4);
}

/** Projectile / wave launch sounds are timed to the hit, so ranged shapes whistle in flight. */
export function impactSfx(vfx: CastVfx, index: number, critical: boolean) {
  if (!audioReady()) return;
  const t = now();
  const weight = 0.45 + vfx.tier * 0.1 + (critical ? 0.2 : 0);
  const pitch = 1 + (index % 3) * 0.06;
  switch (vfx.shape) {
    case "slash":
    case "flurry":
      swoosh(t - 0.04, 0.16, 2400 * pitch, 6200, weight * 0.8, 2);
      // The blade's ring.
      tone(t, 0.35, 2600 * pitch, 2450 * pitch, 0.08 + vfx.tier * 0.02, "triangle", 0.5);
      thump(t, weight * 0.5, 130);
      break;
    case "heavy":
      swoosh(t - 0.08, 0.26, 700, 2600, weight, 1.2);
      thump(t, weight, 95);
      tone(t, 0.5, 1300, 1150, 0.07, "triangle", 0.5);
      break;
    case "impact":
      thump(t, weight * 1.1, 170 * pitch);
      swoosh(t, 0.08, 900, 300, weight * 0.6, 0.7);
      break;
    case "thrust":
      swoosh(t - 0.1, 0.14, 1800, 4200, weight * 0.8, 4);
      thump(t, weight * 0.7, 140);
      break;
    case "projectile":
      [0, 0.04, 0.08].slice(0, 1 + Math.floor(vfx.tier / 2)).forEach((d) => tone(t - 0.17 + d, 0.16, 3400, 1700, 0.07, "sine", 0.2));
      tone(t, 0.08, 2200, 1400, 0.1, "square", 0.1);
      thump(t, weight * 0.5, 200);
      break;
    case "wave": {
      // Zither strings sweep as the sound wave travels.
      PENTATONIC.slice(0, 3 + vfx.tier).forEach((step, i) => note("zheng", 69 + step, t - 0.24 + i * 0.04, 0.3));
      thump(t, weight * 0.5, 180);
      break;
    }
    case "orb":
      tone(t - 0.22, 0.24, 220, 880, 0.12, "sine", 0.5);
      thump(t, weight * 0.9, 120);
      swoosh(t, 0.3, 600, 180, weight * 0.5, 0.9);
      break;
  }
  if (critical) { tone(t, 0.12, 1800, 900, 0.14, "square", 0.25); note("block", 96, t, 0.4); }
  if (vfx.tier >= 2) swoosh(t + 0.03, 0.4, 500, 120, 0.12 + vfx.tier * 0.03, 0.8);
  if (vfx.tier >= 3) note("bell", 81 + PENTATONIC[index % 5], t + 0.02, 0.28);
  if (vfx.tier >= 4 && index === 0) note("gong", 43, t, 0.7, 4);
  elementSfx(vfx, t, index);
}

function elementSfx(vfx: CastVfx, t: number, index: number) {
  switch (vfx.element) {
    case "fire":
      for (let i = 0; i < 6; i++) swoosh(t + 0.03 + i * 0.045, 0.04, 2500 + i * 300, 3500, 0.12, 6);
      break;
    case "thunder":
      swoosh(t, 0.08, 5000, 1200, 0.5, 0.5);
      tone(t + 0.02, 0.9, 70, 38, 0.3, "sawtooth", 0.4);
      break;
    case "poison":
      for (let i = 0; i < 4; i++) tone(t + 0.1 + i * 0.09, 0.07, 300 + i * 90, 600 + i * 120, 0.08, "sine", 0.2);
      break;
    case "frost":
      [96, 100, 103].forEach((midi, i) => note("bell", midi, t + i * 0.05, 0.16));
      break;
    case "blood":
      swoosh(t + 0.1, 0.5, 200, 900, 0.14, 2);
      break;
    case "qi":
      tone(t, 0.5, 330 + index * 20, 495, 0.06, "sine", 0.6);
      break;
    case "shadow":
      tone(t, 0.6, 110, 82, 0.1, "sawtooth", 0.5);
      break;
    case "holy":
      [81, 86, 88].forEach((midi, i) => note("bell", midi, t + i * 0.06, 0.2));
      break;
    case "none":
      break;
  }
}

/** A dodge: just the air parting. */
export function whiffSfx(vfx: CastVfx) {
  if (!audioReady()) return;
  swoosh(now(), 0.22, 1400, 3200, 0.25 + vfx.tier * 0.03, 1.5);
}

/** Buffs and heals: a rising zither/bell arpeggio, richer with rarity. */
export function supportSfx(vfx: CastVfx) {
  if (!audioReady()) return;
  const t = now();
  const notes = PENTATONIC.slice(0, 3 + vfx.tier);
  notes.forEach((step, i) => note(vfx.element === "holy" ? "bell" : "zheng", 74 + step, t + i * 0.07, 0.28));
  swoosh(t, 0.6, 400, 2400, 0.1 + vfx.tier * 0.03, 2);
  if (vfx.tier >= 4) note("gong", 45, t, 0.5, 4);
}
