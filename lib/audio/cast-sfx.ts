import type { CastVfx } from "../stage/cast-vfx";
import { audioReady, note, now, punch, swoosh, thump, tone } from "./engine";

/**
 * Skill sounds follow the same profile as the VFX:
 *   weapon family → the strike (blade ring, heavy cleave, palm thump, spear
 *     hiss, needle whistles, zither waves, qi orb)
 *   every landed hit → `punch` (sub boom + driven smack + crack; crits crunch)
 *   rarity → weight: T2+ adds a second layer, T3 a chime, T4 a gong swell
 *   element → an accent (crackle, thunder, bubbles, frost bells, …)
 *   T5 → a taiko under the gong
 *   boss signature (`bss_*`) → the beast's own voice: a hiss, a roar, a
 *     screech, a shell's boom, a pincer's clack, a bull's bellow (signatureSfx)
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
  if (vfx.tier >= 5) note("taiko", 38, t + 0.08, 0.6);
  if (vfx.signature) signatureStartSfx(vfx, t);
}

/** The beast's voice as it winds up. */
function signatureStartSfx(vfx: CastVfx, t: number) {
  switch (vfx.signature) {
    case "fang":
    case "coil":
    case "molt":
      // A serpent's hiss.
      swoosh(t, 0.45, 5200, 3800, 0.22, 6);
      break;
    case "claw":
    case "roar":
    case "frenzy":
      // A tiger's growl swelling to a roar.
      tone(t, vfx.signature === "roar" ? 0.7 : 0.4, 95, 70, 0.3, "sawtooth", 0.5);
      swoosh(t + 0.05, 0.5, 300, 900, 0.2, 0.8);
      break;
    case "feathers":
    case "dive":
    case "gale":
      // An eagle's screech.
      tone(t, 0.3, 2400, 1500, 0.12, "square", 0.4);
      tone(t + 0.04, 0.26, 3000, 1900, 0.06, "sawtooth", 0.4);
      break;
    case "shell":
    case "sun":
    case "quake":
      // A deep shell boom.
      note("taiko", 33, t, 0.7);
      tone(t, 0.6, 60, 45, 0.25, "sine", 0.6);
      break;
    case "pincers":
    case "mirror":
    case "tide":
      // Pincers clack.
      [0, 0.08, 0.14].forEach((d) => note("block", 90, t + d, 0.35));
      break;
    case "charge":
    case "stomp":
    case "rage":
      // A bull's bellow.
      tone(t, 0.6, 140, 85, 0.3, "sawtooth", 0.5);
      tone(t, 0.6, 70, 50, 0.2, "triangle", 0.5);
      break;
    default:
      break;
  }
}

/** Each landed boss hit gets its own crunch / splash / rumble on top of the shape. */
function signatureSfx(vfx: CastVfx, t: number, index: number) {
  switch (vfx.signature) {
    case "fang":
      tone(t, 0.08, 1800, 900, 0.15, "square", 0.2);
      for (let i = 0; i < 3; i++) tone(t + 0.12 + i * 0.08, 0.07, 500 + i * 120, 900, 0.07, "sine", 0.2);
      break;
    case "coil":
      // Bones creak under the squeeze.
      for (let i = 0; i < 4; i++) tone(t + i * 0.07, 0.06, 260 - i * 30, 140, 0.14, "square", 0.2);
      break;
    case "claw":
      swoosh(t - 0.03, 0.12, 3200, 900, 0.3, 3);
      break;
    case "roar":
    case "stomp":
      thump(t, 0.6, 70);
      swoosh(t, 0.6, 200, 60, 0.3, 0.7);
      break;
    case "feathers":
      tone(t, 0.05, 4200 + (index % 3) * 300, 2600, 0.05, "triangle", 0.2);
      break;
    case "dive":
      swoosh(t - 0.2, 0.22, 600, 6000, 0.35, 2);
      thump(t, 0.8, 90);
      break;
    case "gale":
      swoosh(t, 0.7, 900, 300, 0.3, 0.5);
      break;
    case "sun":
      for (let i = 0; i < 5; i++) swoosh(t + 0.05 + i * 0.06, 0.05, 2200 + i * 200, 3000, 0.1, 6);
      break;
    case "quake":
      thump(t, 0.9, 55);
      tone(t, 0.9, 50, 32, 0.3, "sawtooth", 0.6);
      break;
    case "pincers":
      note("block", 96 - (index % 2) * 5, t, 0.4);
      tone(t, 0.12, 3600, 2400, 0.08, "triangle", 0.3);
      break;
    case "tide":
      swoosh(t, 0.8, 500, 2400, 0.25, 0.6);
      break;
    case "charge":
      thump(t, 0.8, 80);
      for (let i = 0; i < 4; i++) swoosh(t + i * 0.05, 0.05, 2600, 3600, 0.12, 6);
      break;
    default:
      break;
  }
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
      punch(t, weight * 0.75, critical);
      break;
    case "heavy":
      swoosh(t - 0.08, 0.26, 700, 2600, weight, 1.2);
      punch(t, weight * 1.15, critical);
      tone(t, 0.5, 1300, 1150, 0.07, "triangle", 0.5);
      break;
    case "impact":
      // Fists and palms: the heaviest body hit, a second smack on the follow-through.
      punch(t, weight * 1.2, critical);
      punch(t + 0.07 * pitch, weight * 0.35);
      swoosh(t, 0.08, 900, 300, weight * 0.6, 0.7);
      break;
    case "thrust":
      swoosh(t - 0.1, 0.14, 1800, 4200, weight * 0.8, 4);
      punch(t, weight * 0.85, critical);
      break;
    case "projectile":
      [0, 0.04, 0.08].slice(0, 1 + Math.floor(vfx.tier / 2)).forEach((d) => tone(t - 0.17 + d, 0.16, 3400, 1700, 0.07, "sine", 0.2));
      tone(t, 0.08, 2200, 1400, 0.1, "square", 0.1);
      punch(t, weight * 0.55, critical);
      break;
    case "wave": {
      // Zither strings sweep as the sound wave travels.
      PENTATONIC.slice(0, 3 + vfx.tier).forEach((step, i) => note("zheng", 69 + step, t - 0.24 + i * 0.04, 0.3));
      punch(t, weight * 0.6, critical);
      break;
    }
    case "orb":
      tone(t - 0.22, 0.24, 220, 880, 0.12, "sine", 0.5);
      punch(t, weight * 0.95, critical);
      swoosh(t, 0.3, 600, 180, weight * 0.5, 0.9);
      break;
  }
  if (critical) { tone(t, 0.12, 1800, 900, 0.14, "square", 0.25); note("block", 96, t, 0.4); }
  if (vfx.tier >= 2) swoosh(t + 0.03, 0.4, 500, 120, 0.12 + vfx.tier * 0.03, 0.8);
  if (vfx.tier >= 3) note("bell", 81 + PENTATONIC[index % 5], t + 0.02, 0.28);
  if (vfx.tier >= 4 && index === 0) note("gong", 43, t, 0.7, 4);
  if (vfx.tier >= 5 && index === 0) note("taiko", 36, t, 0.7);
  elementSfx(vfx, t, index);
  if (vfx.signature) signatureSfx(vfx, t, index);
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
    case "gold":
      [93, 98, 101].forEach((midi, i) => note("bell", midi, t + 0.02 + i * 0.04, 0.12));
      break;
    case "sun":
      tone(t, 0.6, 180, 360, 0.08, "sine", 0.7);
      break;
    case "wind":
      swoosh(t, 0.5, 1200, 400, 0.18, 0.6);
      break;
    case "water":
      for (let i = 0; i < 4; i++) tone(t + 0.05 + i * 0.06, 0.06, 700 + i * 160, 1400, 0.07, "sine", 0.3);
      break;
    case "earth":
      thump(t + 0.04, 0.35, 60);
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
  // A beast's self move: the shed skin rustles, the frenzy roars, the shells ring.
  switch (vfx.signature) {
    case "molt": swoosh(t, 0.8, 4800, 2000, 0.18, 4); break;
    case "frenzy": tone(t, 0.8, 110, 70, 0.32, "sawtooth", 0.5); break;
    case "rage": tone(t, 0.8, 150, 80, 0.3, "sawtooth", 0.5); thump(t + 0.1, 0.5, 70); break;
    case "shell": note("gong", 36, t, 0.6, 4); break;
    case "mirror": [96, 101, 103, 108].forEach((midi, i) => note("bell", midi, t + i * 0.05, 0.16)); break;
    default: break;
  }
}
