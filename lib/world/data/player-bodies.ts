import type { Gender } from "../types";

// The hero's body (public/player/<id>.png): one per gender, set by the
// gender picked on the StartScreen. Only these two carry the painted
// weapon and activity sprites (lib/characters/hero-actions.ts); the other
// m2–m4 / f2–f4 sheets stay for NPCs.
export const PLAYER_BODIES: Record<Gender, readonly string[]> = {
  male: ["m1"],
  female: ["f1"],
};

export const PLAYER_BODY_LABEL: Record<string, string> = {
  m1: "จอมกระบี่หนุ่ม",
  m2: "นักสู้กำยำ",
  m3: "จอมยุทธพเนจรขาว",
  m4: "นักเดินทางโชกโชน",
  f1: "จอมกระบี่สาว",
  f2: "นักสู้คล่องแคล่ว",
  f3: "ยอดหญิงอาภรณ์ขาว",
  f4: "นายพรานสาว",
};

export function playerBodySprite(bodyId: string): string {
  return `/player/${bodyId}.png`;
}

export function defaultBodyFor(gender: Gender): string {
  return PLAYER_BODIES[gender][0];
}

/** A save's body id, or the gender's hero body when it is no longer a hero choice. */
export function heroBodyFor(bodyId: string | undefined, gender: Gender): string {
  return bodyId && PLAYER_BODIES[gender].includes(bodyId) ? bodyId : defaultBodyFor(gender);
}
