import { PLACE_NPCS } from "./places";
import { registerNpcBodies } from "@/lib/characters/catalog";
import type { NpcDef } from "../types";
import { NPCS_CITIES } from "./npcs/cities";
import { NPCS_VILLAGES } from "./npcs/villages";
import { NPCS_SECTS_TEMPLES } from "./npcs/sects-temples";
import { NPCS_WILDERNESS } from "./npcs/wilderness";
import { NPCS_EVIL } from "./npcs/evil";
import { NPCS_SPIES } from "./npcs/spies";
import { NPCS_WANDERERS } from "./npcs/wanderers";

// ─── NPC registry ──────────────────────────────────────────────────────
// Each entry plants an NPC at one or more locations. Authors fill in the
// optional capability fields per NPC:
//
//   dialogSceneId       — adds a 💬 ทักทาย button (opens that DialogScene)
//   sparOpponentId      — adds a ⚔ ขอประลอง button (triggers a non-fatal
//                         battle; win grants `sparFameReward` ชื่อเสียง)
//   questIds            — pulls quests this NPC offers / turns in
//   visibleIf           — hide the NPC behind a Condition (quest gating)
//   tags                — free-form labels for future condition queries
//
// Adding a new NPC: append a NpcDef to one of the region files under
// `lib/world/data/npcs/` (cities / villages / sects-temples / wilderness),
// list the location ids where they live, and (optionally) author a
// DialogScene for them in `lib/world/data/scenes-content/<region>.ts`.

// Demo / tutorial NPCs that pre-date the regional split. Kept here so the
// authoring rule "regional NPCs live in npcs/<region>.ts" stays clean.
const CORE_NPCS: readonly NpcDef[] = [
  {
    id: "swordsman_xiao",
    name: "เซียวจิ้งเทียน",
    description: "นักดาบเร่ร่อนผู้แสวงหาคู่ต่อสู้ระดับเดียวกัน",
    locationIds: ["inn_yuelai"],
    dialogSceneId: "swordsman_xiao_talk",
    sparOpponentId: "spar_swordsman_xiao",
    sparFameReward: 5,
    tags: ["sparring", "wanderer"],
  },
  // The jail's two regulars (lib/world/data/activities.ts runs its chores).
  {
    id: "jail_elder_prisoner",
    name: "ตาเฒ่าหลิวนักโทษ",
    description: "นักโทษชราผู้รู้ทุกซอกมุมของคุกหลวง",
    locationIds: ["jail"],
    dialogSceneId: "jail_elder_prisoner_talk",
    tags: ["prisoner"],
  },
  {
    id: "jail_guard_zhang",
    name: "ผู้คุมจาง",
    description: "ผู้คุมเวรประตูเหล็ก · รับสินบนถ้าไม่มีใครเห็น",
    locationIds: ["jail"],
    dialogSceneId: "jail_guard_zhang_talk",
    tags: ["guard"],
  },
  {
    id: "merchant_wang",
    name: "เถ้าแก่หวาง",
    description: "พ่อค้าใหญ่ในนครหลวง · ชอบฟังเรื่องราวจากผู้เดินทาง",
    locationIds: ["city_capital"],
    dialogSceneId: "merchant_wang_talk",
    defenseTier: 1,
    stealLoot: [
      { itemId: "ancient_coin", weight: 4 },
      { itemId: "jade", weight: 2 },
      { itemId: "silk", weight: 3 },
    ],
    tags: ["merchant"],
  },
];

export const NPCS: readonly NpcDef[] = [
  ...CORE_NPCS,
  ...NPCS_CITIES,
  ...NPCS_VILLAGES,
  ...NPCS_SECTS_TEMPLES,
  ...NPCS_WILDERNESS,
  ...NPCS_EVIL,
  ...NPCS_SPIES,
  ...NPCS_WANDERERS,
  ...PLACE_NPCS,
];

export const NPCS_BY_ID = new Map<string, NpcDef>(NPCS.map((n) => [n.id, n]));
registerNpcBodies(Object.fromEntries(NPCS.filter((n) => n.look?.body).map((n) => [n.id, n.look!.body!])));

// Generated people (Liveness 2.0: disciples, newcomers, heirs) live in the
// save (npcExt with `dynamic: true`); lib/world/npc-life.ts registers them
// here so every lookup by id finds them like an authored NPC.
const DYNAMIC_NPCS = new Map<string, NpcDef>();
export function registerDynamicNpc(def: NpcDef): void {
  DYNAMIC_NPCS.set(def.id, def);
  if (def.look?.body) registerNpcBodies({ [def.id]: def.look.body });
}
export function isDynamicNpc(id: string): boolean {
  return DYNAMIC_NPCS.has(id) && !NPCS_BY_ID.has(id);
}

export function getNpc(id: string | null | undefined): NpcDef | null {
  if (!id) return null;
  return NPCS_BY_ID.get(id) ?? DYNAMIC_NPCS.get(id) ?? null;
}

// Registry NPCs by the locations they live at, in NPCS order (built once:
// the map view asks for every render).
const NPCS_BY_LOCATION = new Map<string, NpcDef[]>();
for (const n of NPCS) {
  for (const locationId of new Set(n.locationIds)) {
    const list = NPCS_BY_LOCATION.get(locationId);
    if (list) list.push(n); else NPCS_BY_LOCATION.set(locationId, [n]);
  }
}

// All registry NPCs whose locationIds include `locationId`. LocationView
// uses this to decorate the NPC list with the registered NPCs at that spot.
// Returns a fresh array the caller may change.
export function getNpcsAtLocation(locationId: string): NpcDef[] {
  return NPCS_BY_LOCATION.get(locationId)?.slice() ?? [];
}
