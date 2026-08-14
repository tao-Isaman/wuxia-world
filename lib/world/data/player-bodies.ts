import type { Gender } from "../types";

// Selectable player body sprites (public/player/<id>.png, transparent
// full-body pixel sprites). Four per gender, picked at character
// creation on the StartScreen.
export const PLAYER_BODIES: Record<Gender, readonly string[]> = {
  male: ["m1", "m2", "m3", "m4"],
  female: ["f1", "f2", "f3", "f4"],
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
