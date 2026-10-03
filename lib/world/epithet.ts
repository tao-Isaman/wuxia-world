import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import type { SectId, TraitKey, WorldStateData } from "./types";

// ฉายา — the name the jianghu gives the hero, read off their record. The
// first rule that fits wins: a sword-tournament crown, a price on their
// head, the top of a sect's ladder, then their strongest trait.

const TRAIT_EPITHETS: Record<TraitKey, readonly [number, string][]> = {
  good: [[60, "ผู้พิทักษ์ธรรมแห่งยุทธภพ"], [25, "จอมยุทธ์ผู้ทรงธรรม"], [8, "ผู้มีน้ำใจ"]],
  evil: [[60, "มารร้ายแห่งยุทธภพ"], [25, "จอมยุทธ์ทางมาร"], [8, "คนพาลแห่งแดนเถื่อน"]],
  arrogance: [[40, "ผู้ไม่เห็นใครในสายตา"], [15, "ผู้ทะนงตน"]],
  humility: [[40, "ยอดคนผู้ไร้นาม"], [15, "ผู้ถ่อมตน"]],
  fame: [[60, "ผู้มีชื่อก้องยุทธภพ"], [25, "ดาวรุ่งแห่งยุทธภพ"], [8, "ผู้เริ่มมีชื่อ"]],
};

export const NEWCOMER_EPITHET = "ผู้มาใหม่ในยุทธภพ";

type EpithetState = Pick<WorldStateData, "traits" | "tournamentHistory" | "sectMembership" | "wanted">;

export function heroEpithet(state: EpithetState): string {
  const crowns = (state.tournamentHistory ?? []).filter((r) => r.champion === "player").length;
  if (crowns >= 2) return "ราชันกระบี่ใต้หล้า";
  if (crowns === 1) return "ยอดกระบี่แห่งชุมนุมวิจารณ์กระบี่";
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
