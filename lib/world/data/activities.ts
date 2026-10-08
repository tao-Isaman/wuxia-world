// ─── Map activities ────────────────────────────────────────────────────
// Things to do at a map spot that aren't gathering or crafting. Each has a
// time + stamina cost; the store's `doActivity` resolves the outcome. The
// jail uses them so a sentence is something the player lives through: hard
// labour shortens it, dice pass the evening, meditation restores qi, the
// gate lets you out once it's served, and the cracked wall tempts escape.

import type { StatKey } from "@/lib/game";
import type { TraitKey } from "../types";
import type { MapPoint } from "./location-maps";
import { PLACE_ACTIVITIES } from "./place-activities";

export type JailActivityId = "jail_labor" | "jail_dice" | "jail_meditate" | "jail_gate" | "jail_escape";
export type ActivityId = JailActivityId | (string & {});

/**
 * A place activity (everything but the jail's): done at a spot on the place's
 * map, at most once per `cooldownDays`, for the costs and rewards below. The
 * store's `doActivity` resolves it generically (lib/world/place-activity.ts).
 */
export interface PlaceActivity {
  /** Places whose map shows it. */
  locationIds: readonly string[];
  /** Spot on the painting (percent); auto maps pick a free slot when omitted. */
  spot?: MapPoint;
  /** Days before it can be done again (default 1). */
  cooldownDays?: number;
  /** Gold it costs to do. */
  costGold?: number;
  reward: {
    /** Gold won, uniform in [min, max]. */
    gold?: readonly [number, number];
    wExp?: number;
    statXp?: StatKey;
    trait?: { trait: TraitKey; amount: number };
    /** An item, with a chance (default 1). */
    item?: { itemId: string; count?: number; chance?: number };
    /** Restore stamina / HP / MP (fractions of max for HP and MP). */
    stamina?: number;
    heal?: number;
    /** Relationship with an NPC of the place. */
    relationship?: { npcId: string; amount: number };
  };
  /** What the toast says when it is done. */
  doneText: string;
}

export interface ActivityDef {
  id: ActivityId;
  label: string;
  /** Map sign glyph key (see drawWorldBadge). */
  badge: string;
  icon: string;
  /** ชั่วยาม it used to take (actions are instant now; > 0 plays the work overlay). */
  hours: number;
  stamina: number;
  description: string;
  /** Set for place activities; jail activities have their own logic. */
  place?: PlaceActivity;
}


export const ACTIVITIES: readonly ActivityDef[] = [
  { id: "jail_labor", label: "ทุบหินใช้แรงงาน", badge: "labor", icon: "🪨", hours: 6, stamina: 25,
    description: "ทำงานหนัก · ลดโทษ 10 นาที · ฝึกพละกำลัง" },
  { id: "jail_dice", label: "ทอยเต๋ากับผู้คุม", badge: "dice", icon: "🎲", hours: 2, stamina: 5,
    description: "เดิมพัน 10 ตำลึง · ชนะได้ 20 · ดวงดีช่วยได้" },
  { id: "jail_meditate", label: "นั่งสมาธิ", badge: "practice", icon: "🧘", hours: 6, stamina: 0,
    description: "นั่งได้ทุก 15 นาที · ฟื้นปราณเต็ม · ฟื้นพลังและบาดแผลเล็กน้อย · ตรึกตรองวิชาได้ w-exp +40" },
  { id: "jail_gate", label: "ประตูคุก", badge: "gate", icon: "🔒", hours: 0, stamina: 0,
    description: "ออกได้เมื่อพ้นโทษ · โทษนับตามเวลาจริง" },
  { id: "jail_escape", label: "แหกคุกทางกำแพงร้าว", badge: "escape", icon: "🧱", hours: 2, stamina: 30,
    description: "เสี่ยงหนีด้วยความว่องไว · สำเร็จแต่หมายจับเพิ่ม 2 · พลาดโทษเพิ่ม 10 นาที" },
  ...PLACE_ACTIVITIES,
];

/** Place activities shown on a location's map. */
export function placeActivitiesAt(locationId: string): readonly ActivityDef[] {
  return ACTIVITIES.filter((a) => a.place?.locationIds.includes(locationId));
}

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
