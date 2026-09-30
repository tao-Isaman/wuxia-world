// ─── Map activities ────────────────────────────────────────────────────
// Things to do at a map spot that aren't gathering or crafting. Each has a
// time + stamina cost; the store's `doActivity` resolves the outcome. The
// jail uses them so a sentence is something the player lives through: hard
// labour shortens it, dice pass the evening, meditation restores qi, the
// gate lets you out once it's served, and the cracked wall tempts escape.

export type ActivityId = "jail_labor" | "jail_dice" | "jail_meditate" | "jail_gate" | "jail_escape";

export interface ActivityDef {
  id: ActivityId;
  label: string;
  /** Map sign glyph key (see drawWorldBadge). */
  badge: string;
  icon: string;
  /** ชั่วยาม spent (the gate spends none; it checks the sentence). */
  hours: number;
  stamina: number;
  description: string;
}

export const ACTIVITIES: readonly ActivityDef[] = [
  { id: "jail_labor", label: "ทุบหินใช้แรงงาน", badge: "labor", icon: "🪨", hours: 6, stamina: 25,
    description: "ทำงานหนัก 6 ชั่วยาม · ลดโทษเพิ่มอีก 6 ชั่วยาม · ฝึกพละกำลัง" },
  { id: "jail_dice", label: "ทอยเต๋ากับผู้คุม", badge: "dice", icon: "🎲", hours: 2, stamina: 5,
    description: "เดิมพัน 10 ตำลึง · ชนะได้ 20 · ดวงดีช่วยได้" },
  { id: "jail_meditate", label: "นั่งสมาธิ", badge: "practice", icon: "🧘", hours: 6, stamina: 0,
    description: "6 ชั่วยาม · ฟื้นปราณเต็ม · ฟื้นพลังและบาดแผลเล็กน้อย" },
  { id: "jail_gate", label: "ประตูคุก", badge: "gate", icon: "🔒", hours: 0, stamina: 0,
    description: "ออกได้เมื่อพ้นโทษ · หรือนั่งนับวันจนครบ" },
  { id: "jail_escape", label: "แหกคุกทางกำแพงร้าว", badge: "escape", icon: "🧱", hours: 2, stamina: 30,
    description: "เสี่ยงหนีด้วยความว่องไว · สำเร็จแต่หมายจับเพิ่ม 2 · พลาดโทษเพิ่ม 1 วัน" },
];

export const ACTIVITIES_BY_ID = new Map<string, ActivityDef>(ACTIVITIES.map((a) => [a.id, a]));
export function getActivity(id: string | null | undefined): ActivityDef | null {
  return id ? ACTIVITIES_BY_ID.get(id) ?? null : null;
}

/** The prison courtyard every city's jail shares; released into `jailCityId`. */
export const JAIL_SCENE_ID = "jail";
/** Dice odds: 40 % + LUK/2 %, capped at 60 %. */
export const jailDiceChance = (luk: number) => Math.min(0.6, 0.4 + luk / 200);
/** Escape odds: 20 % + AGI/2 %, capped at 55 %. */
export const jailEscapeChance = (agi: number) => Math.min(0.55, 0.2 + agi / 200);
