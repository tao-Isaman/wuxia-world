// Sect membership rules shared by the store actions, quest rewards and the
// UI: who may join or rejoin a sect, the redemption quests, and the freeze
// on a resigned sect's moves. Pure.
import { getArt, getSkill } from "../game";
import type { QuestDef, SectId, SectMembership, WorldStateData } from "./types";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { QUESTS } from "./data/quests";
import { evaluateCondition } from "./conditions";

/** Days after leaving (or being forgiven) before a sect takes the hero back. */
export const REJOIN_COOLDOWN_DAYS = 30;

export type SectStatus = NonNullable<SectMembership["status"]>;

/** A membership's status; a missing one reads as "active" (older saves). */
export function membershipStatus(m: Pick<SectMembership, "status">): SectStatus {
  return m.status ?? "active";
}

// ─── Redemption ────────────────────────────────────────────────────────
/** The quest that turns a betrayal into a resignation: `qst_<sectId>_redemption`. */
export function redemptionQuestId(sectId: SectId): string {
  return `qst_${sectId}_redemption`;
}

export function isRedemptionQuest(def: Pick<QuestDef, "id" | "sectId">): boolean {
  return !!def.sectId && def.id === redemptionQuestId(def.sectId);
}

// ─── Joining and rejoining ─────────────────────────────────────────────
let introBySect: Map<SectId, QuestDef> | null = null;
/** The quest whose reward makes the hero a disciple (its `joinSect` reward). */
export function sectIntroQuest(sectId: SectId): QuestDef | undefined {
  if (!introBySect) {
    introBySect = new Map();
    for (const q of QUESTS) {
      for (const r of q.rewards ?? []) if (r.t === "joinSect" && !introBySect.has(r.sectId)) introBySect.set(r.sectId, q);
    }
  }
  return introBySect.get(sectId);
}

/** Days left before a resigned sect takes the hero back (0 = now). */
export function rejoinWaitDays(state: Pick<WorldStateData, "day" | "sectMembership">, sectId: SectId): number {
  const m = state.sectMembership[sectId];
  if (!m || membershipStatus(m) !== "resigned" || typeof m.leftDay !== "number") return 0;
  return Math.max(0, m.leftDay + REJOIN_COOLDOWN_DAYS - state.day);
}

export type SectJoinCheck =
  | { ok: true; rejoin: boolean }
  | { ok: false; reason: string; waitDays?: number };

/**
 * May the hero become (again) a disciple of `sectId` now?
 *   - one sect at a time: no other active membership;
 *   - a betrayer must first be forgiven (the redemption quest);
 *   - a resigned member may come back REJOIN_COOLDOWN_DAYS after leaving;
 *   - a first join needs the sect's intro quest done (`viaQuest`: the
 *     intro's own reward is asking, so it is done by then);
 *   - always the sect's `joinRequirements`.
 */
export function sectJoinCheck(state: WorldStateData, sectId: SectId, opts: { viaQuest?: boolean } = {}): SectJoinCheck {
  const def = SECT_MEMBERSHIPS[sectId];
  if (!def) return { ok: false, reason: "ไม่พบสำนัก" };
  const m = state.sectMembership[sectId];
  const status = m ? membershipStatus(m) : null;
  if (status === "active") return { ok: false, reason: "เป็นศิษย์อยู่แล้ว" };
  if (status === "betrayed") return { ok: false, reason: `เจ้าเคยทรยศ${def.name} — ต้องทำภารกิจไถ่บาปให้สำเร็จก่อน` };
  for (const [otherId, other] of Object.entries(state.sectMembership)) {
    if (otherId !== sectId && other && membershipStatus(other) === "active") {
      return { ok: false, reason: `ยังเป็นศิษย์${SECT_MEMBERSHIPS[otherId as SectId]?.name ?? "สำนักอื่น"}อยู่ — ต้องออกจากสำนักเดิมก่อน` };
    }
  }
  if (status === "resigned") {
    const wait = rejoinWaitDays(state, sectId);
    if (wait > 0) return { ok: false, reason: `กลับเข้าสำนักได้อีกในอีก ${wait} วัน`, waitDays: wait };
  } else if (!opts.viaQuest) {
    const intro = sectIntroQuest(sectId);
    if (intro && state.quests[intro.id]?.status !== "done") return { ok: false, reason: `ต้องผ่านภารกิจ "${intro.name}" ก่อน` };
  }
  if (!evaluateCondition(state, def.joinRequirements)) return { ok: false, reason: "ยังไม่ผ่านเงื่อนไขการรับศิษย์ของสำนัก" };
  return { ok: true, rejoin: status === "resigned" };
}

/** The best rank the hero ever held in a sect (lower is better). */
export function bestSectRank(m: Pick<SectMembership, "rank" | "bestRank">): number {
  return Math.min(m.rank, m.bestRank ?? m.rank);
}

// ─── The resigned sect's freeze ────────────────────────────────────────
/**
 * True when the move belongs to a sect the hero resigned from (its lineage,
 * by `sc`, or a pick under the old rank pools). Such moves keep their level
 * but gain no xp from any source — battle, practice, w-exp, quest rewards —
 * until the hero rejoins. Betrayed sects keep growing (their price is the
 * hunters).
 */
export function isFrozen(state: Pick<WorldStateData, "sectMembership">, id: string, sect: string | undefined): boolean {
  for (const [sectId, m] of Object.entries(state.sectMembership)) {
    if (!m || m.status !== "resigned") continue;
    if (sect && SECT_MEMBERSHIPS[sectId as SectId]?.name === sect) return true;
    if (Object.values(m.rewardPicks ?? {}).includes(id)) return true;
  }
  return false;
}

export function isSkillFrozen(state: Pick<WorldStateData, "sectMembership">, skillId: string): boolean {
  return isFrozen(state, skillId, getSkill(skillId)?.sc);
}

export function isArtFrozen(state: Pick<WorldStateData, "sectMembership">, artId: string): boolean {
  return isFrozen(state, artId, getArt(artId)?.sc);
}

/** Thai line for a frozen move (toasts and logs). */
export const FROZEN_MOVE_TEXT = "วิชานี้มาจากสำนักที่เจ้าลาออกแล้ว — จะไม่เก่งขึ้นจนกว่าจะกลับเข้าสำนัก";
