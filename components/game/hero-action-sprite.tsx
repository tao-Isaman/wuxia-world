"use client";
import type { CSSProperties } from "react";
import { heroPoseStrip, type HeroPose } from "@/lib/characters/hero-actions";

/**
 * The hero playing a painted loop (lib/characters/hero-actions.ts) — mining,
 * a sword form, meditation… — as a CSS sprite: the row's frames step across
 * the sheet. Reduced motion holds the first frame.
 */
export function HeroActionSprite({ id, pose, figure = 62 }: { id: string; pose: HeroPose; figure?: number }) {
  const strip = heroPoseStrip(id, pose);
  // A standing hero is `figure` px tall, whatever the sheet's cell size.
  const scale = figure / strip.figure;
  const w = strip.width * scale, h = strip.height * scale;
  const style = {
    width: w, height: h,
    backgroundImage: `url(${strip.url})`,
    backgroundSize: `${w * strip.columns}px ${h * strip.rows}px`,
    backgroundPositionY: `${-h * strip.row}px`,
    "--hero-action-end": `${-w * strip.frames}px`,
    animationDuration: `${strip.frames * 1000 / strip.fps}ms`,
    animationTimingFunction: `steps(${strip.frames})`,
  } as CSSProperties;
  return <div className="hero-action-sprite" style={style} data-hero-pose={`${pose.sheet}:${pose.row}`} aria-hidden="true" />;
}
