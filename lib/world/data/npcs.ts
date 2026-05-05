import type { NpcDef } from "../types";

// ─── NPC registry ──────────────────────────────────────────────────────
// Each entry plants an NPC at one or more locations. Authors fill in the
// optional capability fields per NPC:
//
//   dialogSceneId       — adds a 💬 ทักทาย button (opens that DialogScene)
//   sparOpponentId      — adds a ⚔ ขอประลอง button (triggers a non-fatal
//                         battle; win grants `sparFameReward` ชื่อเสียง)
//   visibleIf           — hide the NPC behind a Condition (quest gating)
//   tags                — free-form labels for future condition queries
//
// Adding a new NPC: append a NpcDef here, list the location ids where they
// live, and (optionally) author a DialogScene for them in scenes.ts.
// LocationView merges these registry NPCs with any inline NpcRef the scene
// already lists, so existing inline NPCs keep working.

export const NPCS: readonly NpcDef[] = [
  {
    id: "swordsman_xiao",
    name: "เซียวจิ้งเทียน",
    description: "นักดาบเร่ร่อนผู้แสวงหาคู่ต่อสู้ระดับเดียวกัน",
    locationIds: ["inn_yuelai"],
    dialogSceneId: "swordsman_xiao_talk",
    sparOpponentId: "thug",
    sparFameReward: 5,
    tags: ["sparring", "wanderer"],
  },
  {
    id: "merchant_wang",
    name: "เถ้าแก่หวาง",
    description: "พ่อค้าใหญ่ในนครหลวง · ชอบฟังเรื่องราวจากผู้เดินทาง",
    locationIds: ["city_capital"],
    dialogSceneId: "merchant_wang_talk",
    tags: ["merchant"],
  },
];

export const NPCS_BY_ID = new Map<string, NpcDef>(NPCS.map((n) => [n.id, n]));

export function getNpc(id: string | null | undefined): NpcDef | null {
  if (!id) return null;
  return NPCS_BY_ID.get(id) ?? null;
}

// All registry NPCs whose locationIds include `locationId`. LocationView
// uses this to decorate the NPC list with the registered NPCs at that spot.
export function getNpcsAtLocation(locationId: string): NpcDef[] {
  const out: NpcDef[] = [];
  for (const n of NPCS) {
    if (n.locationIds.includes(locationId)) out.push(n);
  }
  return out;
}
