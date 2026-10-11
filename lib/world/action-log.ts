// The kinds of line the player's action log (บันทึก) can hold and the Thai
// badge each one shows. `appendActionLog` takes an `ActionLogKind`, so a new
// kind is a type error until it has a label here.

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
