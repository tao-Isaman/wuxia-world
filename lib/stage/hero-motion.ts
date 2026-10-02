// How the hero's body moves for a cast on the battle board, by the kind of
// skill: a sword sweeps, a sabre leaps and cleaves, fists dash and punch, a
// spear drives through, daggers dart in a flurry, hidden weapons are thrown
// from a step back, music is played afloat, an inner art is channelled with
// the body rising in its own qi, and support casts hold a guard. Pure: the
// battle runtime asks for a pose each frame and applies it to the sprite.

import type { CastVfx } from "./cast-vfx";

export type HeroMove = "sweep" | "cleave" | "strike" | "lunge" | "flurry" | "throw" | "play" | "channel" | "guard";

const SHAPE_MOVE: Record<CastVfx["shape"], HeroMove> = {
  slash: "sweep",
  heavy: "cleave",
  impact: "strike",
  thrust: "lunge",
  flurry: "flurry",
  projectile: "throw",
  wave: "play",
  orb: "channel",
};

/** The body move for a cast. */
export function heroMoveFor(vfx: Pick<CastVfx, "shape" | "kind">, opts: { support: boolean }): HeroMove {
  if (opts.support) return "guard";
  if (vfx.kind === "art") return "channel";
  return SHAPE_MOVE[vfx.shape] ?? "strike";
}

/** Whether the move closes in on its target (the runtime gives it the melee travel). */
export const movesIn = (move: HeroMove) => move === "sweep" || move === "cleave" || move === "strike" || move === "lunge" || move === "flurry";

export interface HeroPose {
  /** Fraction of the melee travel toward the target (0 = home, 1 = at the target). */
  reach: number;
  /** Extra steps along the aim, in board units at scale 1 (negative = back). */
  step: number;
  /** Sideways offset across the aim (board units). */
  side: number;
  /** Height off the ground (board units). */
  lift: number;
  /** Lean in radians; positive leans toward the facing direction. */
  lean: number;
  sx: number;
  sy: number;
  /** Leave fading afterimages while true. */
  ghost: boolean;
  /** 0–1 strength of the qi aura under the hero. */
  aura: number;
}

export interface MoveTiming {
  /** When the first hit lands and when the last one does (ms from the cast's start). */
  hitDelay: number;
  lastImpact: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (k: number) => Math.sin(clamp01(k) * Math.PI / 2);
const REST: HeroPose = { reach: 0, step: 0, side: 0, lift: 0, lean: 0, sx: 1, sy: 1, ghost: false, aura: 0 };

/** The hero's pose `age` ms into a cast. Rests at 0 before it starts and once it is over. */
export function heroPose(move: HeroMove, age: number, timing: MoveTiming): HeroPose {
  const { hitDelay, lastImpact } = timing;
  const end = lastImpact + 360;
  if (age <= 0 || age >= end) return REST;
  // Wind-up to the first hit, then the hits, then the recovery home.
  const windup = clamp01(age / hitDelay);
  const recover = clamp01((age - lastImpact - 65) / 220);
  const striking = age >= hitDelay && age <= lastImpact + 100;
  const out = easeOut(windup) * (1 - recover);
  const hitPhase = striking ? ((age - hitDelay) % 110) / 110 : 0;
  const impact = striking ? 1 - hitPhase : 0;
  switch (move) {
    case "sweep":
      // Dash in and draw the blade across: the body turns from a coiled lean into the cut.
      return { ...REST, reach: out, lean: windup < 1 ? -0.22 * windup : 0.28 * (1 - recover) * (0.6 + 0.4 * impact),
        sx: 1 + 0.06 * impact, sy: 1 - 0.04 * impact, ghost: windup > 0.25 && recover < 0.9 };
    case "cleave":
      // Leap up over the foe and come down hard.
      return { ...REST, reach: out, lift: windup < 1 ? 46 * Math.sin(windup * Math.PI) * 0.9 + 10 * windup : 10 * (1 - recover) * (1 - impact),
        lean: windup < 1 ? -0.18 : 0.32 * impact * (1 - recover),
        sx: striking ? 1 + 0.16 * impact : 1, sy: striking ? 1 - 0.14 * impact : 1, ghost: windup > 0.3 && windup < 1 };
    case "strike":
      // A quick dash and a straight punch; each hit snaps the body forward.
      return { ...REST, reach: out, step: 6 * impact, lean: 0.14 * out + 0.1 * impact,
        sx: 1 + 0.1 * impact, sy: 1 - 0.08 * impact, ghost: windup > 0.4 && !striking };
    case "lunge":
      // A long thrust that drives past the guard, the body flat behind the point.
      return { ...REST, reach: Math.min(1.25, out * 1.25), lean: 0.24 * out, sx: 1 + 0.08 * out, sy: 1 - 0.06 * out,
        ghost: windup > 0.2 && recover < 0.8 };
    case "flurry":
      // Darting in and out around the target, a blur of small cuts.
      return { ...REST, reach: out * (0.8 + 0.2 * impact), side: striking ? 9 * Math.sin((age - hitDelay) / 38) : 0,
        lean: 0.12 * out, ghost: windup > 0.15 && recover < 0.9 };
    case "throw":
      // Step back, wind the arm, and release.
      return { ...REST, step: windup < 1 ? -14 * easeOut(windup) : -14 * (1 - recover),
        lean: windup < 1 ? -0.16 * windup : 0.18 * impact * (1 - recover), sx: 1 + 0.06 * impact, sy: 1 - 0.05 * impact };
    case "play":
      // Afloat, swaying with the tune.
      return { ...REST, lift: 8 * easeOut(windup) * (1 - recover) + 3 * Math.sin(age / 130), lean: 0.08 * Math.sin(age / 160),
        aura: 0.6 * (1 - recover) };
    case "channel":
      // The body rises in its own qi, swells as the art releases, and settles.
      return { ...REST, lift: 20 * easeOut(windup) * (1 - recover), lean: -0.06 * easeOut(windup) * (1 - recover),
        sx: 1 + 0.05 * impact, sy: 1 + 0.05 * impact, aura: (0.6 + 0.4 * Math.abs(Math.sin(age / 90))) * (1 - recover) };
    case "guard":
      return { ...REST, sy: 1 - 0.04 * (1 - recover), aura: 0.45 * (1 - recover) };
  }
}
