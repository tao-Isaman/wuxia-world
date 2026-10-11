// The player-visible action log (บันทึก): the kinds of line it can hold, the
// Thai badge each one shows, and appending (the newest ACTION_LOG_MAX
// entries). Pure, so engine effects (a quest reward that resigns from a
// sect…) can log the same lines as the store actions; store/world/state.ts
// re-exports it. `appendActionLog` takes an `ActionLogKind`, so a new kind is
// a type error until it has a label here.
import type { WorldStateData } from "./types";

export const ACTION_LOG_MAX = 100;

export const ACTION_LOG_LABEL = {
  rest: "พัก",
  gather: "เก็บของ",
  craft: "ประดิษฐ์",
  buy: "ซื้อ",
  sell: "ขาย",
  use: "ใช้",
  travel: "เดินทาง",
  combat: "ต่อสู้",
  battle: "ศึก",
  encounter: "พานพบ",
  learn: "เรียน",
  meridian: "ชีพจร",
  quest: "ภารกิจ",
  sect: "สำนัก",
  law: "ทางการ",
  gift: "ของขวัญ",
  activity: "กิจกรรม",
  steal: "ขโมย",
  assassinate: "ลอบสังหาร",
  kidnap: "ลักพาตัว",
  letter: "จดหมาย",
  tournament: "ประลองยุทธ",
  boss: "สัตว์ในตำนาน",
  feud: "ความแค้น",
  lead: "เบาะแส",
  time: "กาลเวลา",
} as const satisfies Record<string, string>;

export type ActionLogKind = keyof typeof ACTION_LOG_LABEL;

export const ACTION_LOG_KINDS = Object.keys(ACTION_LOG_LABEL) as ActionLogKind[];

/** The badge for a saved entry; an unknown kind (an old save) reads as บันทึก. */
export function actionLogLabel(kind: string): string {
  return (ACTION_LOG_LABEL as Record<string, string>)[kind] ?? "บันทึก";
}

/** Append a player-action entry, keeping the newest 100. Mutates `state` in place (a draft). */
export function appendActionLog(state: WorldStateData, kind: ActionLogKind, message: string): void {
  const entry = { day: state.day, time: state.time, kind, message };
  const next = [...(state.actionLog ?? []), entry];
  if (next.length > ACTION_LOG_MAX) next.splice(0, next.length - ACTION_LOG_MAX);
  state.actionLog = next;
}
