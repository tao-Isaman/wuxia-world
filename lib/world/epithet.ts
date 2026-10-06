import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import type { SectId, TraitKey, WorldStateData } from "./types";

// ฉายา — the name the jianghu gives the hero, read off their record. The
// first rule that fits wins: a sword-tournament crown, a mix of traits all
// at COMBO_MIN or more (the widest mix first), a price on their head, the
// top of a sect's ladder, then their strongest trait.

const TRAIT_EPITHETS: Record<TraitKey, readonly [number, string][]> = {
  good: [[60, "ผู้พิทักษ์ธรรมแห่งยุทธภพ"], [25, "จอมยุทธ์ผู้ทรงธรรม"], [8, "ผู้มีน้ำใจ"]],
  evil: [[60, "มารร้ายแห่งยุทธภพ"], [25, "จอมยุทธ์ทางมาร"], [8, "คนพาลแห่งแดนเถื่อน"]],
  arrogance: [[40, "ผู้ไม่เห็นใครในสายตา"], [15, "ผู้ทะนงตน"]],
  humility: [[40, "ยอดคนผู้ไร้นาม"], [15, "ผู้ถ่อมตน"]],
  fame: [[60, "ผู้มีชื่อก้องยุทธภพ"], [25, "ดาวรุ่งแห่งยุทธภพ"], [8, "ผู้เริ่มมีชื่อ"]],
};

export const NEWCOMER_EPITHET = "ผู้มาใหม่ในยุทธภพ";

/** Every trait of a mix must reach this. */
export const COMBO_MIN = 60;

// Mixes of traits, each needing all of its traits at COMBO_MIN or more.
// More traits beat fewer; among equals, the higher total wins.
export const COMBO_EPITHETS: readonly { traits: readonly TraitKey[]; name: string }[] = [
  { traits: ["good", "evil", "arrogance", "humility", "fame"], name: "เทพเซียนผู้ข้ามพ้นดีชั่ว" },
  // Three traits
  { traits: ["good", "evil", "fame"], name: "ตำนานที่ไม่มีใครหยั่งถึง" },
  { traits: ["evil", "arrogance", "fame"], name: "ราชาปีศาจครองยุทธภพ" },
  { traits: ["good", "humility", "fame"], name: "ปรมาจารย์ผู้ค้ำจุนแผ่นดิน" },
  { traits: ["good", "arrogance", "fame"], name: "ราชันธรรมผู้ไม่ก้มหัวให้ใคร" },
  { traits: ["evil", "humility", "fame"], name: "มารในคราบนักบวช" },
  { traits: ["good", "evil", "arrogance"], name: "คนบ้าผู้ไม่แยแสฟ้าดิน" },
  { traits: ["good", "evil", "humility"], name: "ฤๅษีผู้หลงทางระหว่างธรรมกับมาร" },
  { traits: ["arrogance", "humility", "fame"], name: "ยอดคนผู้เป็นปริศนา" },
  // Two traits
  { traits: ["good", "evil"], name: "คนบ้าแปลกประหลาด" },
  { traits: ["evil", "arrogance"], name: "จอมมารโดยเนื้อแท้" },
  { traits: ["evil", "humility"], name: "หน้าเนื้อใจเสือ" },
  { traits: ["evil", "fame"], name: "มารร้ายที่ทั้งแผ่นดินหวาดกลัว" },
  { traits: ["good", "humility"], name: "พระโพธิสัตว์เดินดิน" },
  { traits: ["good", "fame"], name: "วีรชนแห่งแผ่นดิน" },
  { traits: ["good", "arrogance"], name: "ผู้ทรงธรรมผู้ทะนงตน" },
  { traits: ["arrogance", "humility"], name: "คนสองหน้าแห่งยุทธภพ" },
  { traits: ["arrogance", "fame"], name: "ยอดฝีมือผู้หยิ่งผยอง" },
  { traits: ["humility", "fame"], name: "ผู้ยิ่งใหญ่ที่ไม่เคยโอ้อวด" },
];

type EpithetState = Pick<WorldStateData, "traits" | "tournamentHistory" | "sectMembership" | "wanted">;

export function heroEpithet(state: EpithetState): string {
  const crowns = (state.tournamentHistory ?? []).filter((r) => r.champion === "player").length;
  if (crowns >= 2) return "ราชันกระบี่ใต้หล้า";
  if (crowns === 1) return "ยอดกระบี่แห่งเขาหัวซาน";
  const value = (trait: TraitKey) => state.traits?.[trait] ?? 0;
  let combo: { size: number; total: number; name: string } | null = null;
  for (const { traits, name } of COMBO_EPITHETS) {
    if (!traits.every((trait) => value(trait) >= COMBO_MIN)) continue;
    const total = traits.reduce((sum, trait) => sum + value(trait), 0);
    if (!combo || traits.length > combo.size || (traits.length === combo.size && total > combo.total)) combo = { size: traits.length, total, name };
  }
  if (combo) return combo.name;
  if ((state.wanted ?? 0) >= 3) return "ผู้ต้องหาที่ทางการตามล่า";
  for (const [id, m] of Object.entries(state.sectMembership ?? {})) {
    const def = SECT_MEMBERSHIPS[id as SectId];
    if (m && def && m.status === "active" && m.rank <= def.topRank) return `ประมุขแห่ง${def.name}`;
  }
  let best: { value: number; name: string } | null = null;
  for (const [trait, steps] of Object.entries(TRAIT_EPITHETS) as [TraitKey, readonly [number, string][]][]) {
    const value = state.traits?.[trait] ?? 0;
    const step = steps.find(([min]) => value >= min);
    if (step && (!best || value > best.value)) best = { value, name: step[1] };
  }
  return best?.name ?? NEWCOMER_EPITHET;
}
