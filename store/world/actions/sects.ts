// Joining (and rejoining), ranking up in, taking quests from and leaving sects.
// Every action here works only on a membership in the right standing: rank-ups
// and sect quests for an active disciple, leaving from an active one, joining
// through sectJoinCheck (lib/world/sects.ts). The consequences of joining and
// leaving (log, echo, betrayal's evil) live in the effects themselves, so a
// quest reward does the same as these buttons.
import { getQuest } from "@/lib/world";
import { applyEffect, isSectQuestOfferable } from "@/lib/world/effects";
import { SECT_MEMBERSHIPS, rankUpGold } from "@/lib/world/data/sect-memberships";
import { membershipStatus, sectJoinCheck } from "@/lib/world/sects";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const sectsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "joinSect" | "upgradeSectRank" | "acceptSectQuest" | "resignSect" | "betraySect"> => ({
  joinSect: (sectId) => {
    const s = get();
    if (!s.hasGame || !s.playerBuild) return { ok: false, reason: "ยังไม่ได้เริ่มเกม" };
    const def = SECT_MEMBERSHIPS[sectId];
    if (!def) return { ok: false, reason: "ไม่พบสำนัก" };
    // A first join after the intro quest (when its reward could not admit
    // the hero), or the return of a resigned disciple after the cooldown.
    const check = sectJoinCheck(s, sectId);
    if (!check.ok) return { ok: false, reason: check.reason };
    const draft = draftFrom(s);
    applyEffect(draft, { t: "joinSect", sectId });
    // The joinSect effect also tells the jianghu (a sect_join echo).
    appendActionLog(draft, "sect", `${check.rejoin ? "กลับเข้า" : "เข้าร่วม"}สำนัก${def.name} · ขั้นที่ ${def.startRank}`);
    set({ ...draft });
    return { ok: true };
  },

  upgradeSectRank: (sectId) => {
    const s = get();
    const m = s.sectMembership[sectId];
    if (!m) return { ok: false, reason: "ยังไม่ได้เป็นศิษย์" };
    if (membershipStatus(m) !== "active") return { ok: false, reason: "ไม่ได้เป็นศิษย์ของสำนักนี้แล้ว" };
    const def = SECT_MEMBERSHIPS[sectId];
    if (!def) return { ok: false, reason: "ไม่พบสำนัก" };
    if (m.rank <= def.topRank) return { ok: false, reason: "ขั้นสูงสุดแล้ว" };
    const target = m.rank - 1;
    const cost = def.rankUpCost(target);
    if (m.points < cost) {
      return { ok: false, reason: `ต้องการ ${cost} sect points (มี ${m.points})` };
    }
    const draft = draftFrom(s);
    const dm = draft.sectMembership[sectId];
    if (!dm) return { ok: false, reason: "membership lost" };
    // Nested entries are shared with the previous state (draftFrom is one
    // level deep): replace the membership instead of mutating it.
    const best = dm.bestRank ?? dm.rank;
    // Rank-ups pay gold — once per rank: a disciple who came back climbs
    // again without being paid twice. The sect's martial arts come from its
    // lineage quests and sagas, which the new rank may open.
    const gold = target < best ? rankUpGold(def, target) : 0;
    draft.sectMembership[sectId] = { ...dm, points: dm.points - cost, rank: target, bestRank: Math.min(best, target) };
    draft.gold += gold;
    appendActionLog(
      draft,
      "sect",
      `เลื่อนขั้น${def.name} → ขั้นที่ ${target} (จ่าย ${cost} sect points${gold ? ` · ได้รับ ${gold} ตำลึง` : ""})`,
    );
    // Liveness Layer: rank-up is a public milestone — player-echo
    // rumor lands in the pool for inn-goers to repeat.
    applyEffect(draft, { t: "firePlayerEcho", actionId: "sect_rank_up" });
    set({ ...draft });
    return { ok: true };
  },

  acceptSectQuest: (sectId, questId) => {
    const s = get();
    const def = getQuest(questId);
    if (!def) return { ok: false, reason: "ไม่พบภารกิจ" };
    if (def.sectId !== sectId) return { ok: false, reason: "ไม่ใช่ภารกิจของสำนักนี้" };
    const sectDef = SECT_MEMBERSHIPS[sectId];
    // isSectQuestOfferable also requires an active membership.
    const check = isSectQuestOfferable(s, def, sectDef.questCooldownDays);
    if (!check.offerable) {
      return {
        ok: false,
        reason: check.reason ?? `รอเหลืออีก ${check.cooldownLeft} วัน`,
      };
    }
    const draft = draftFrom(s);
    // Reset prior done/failed status so the quest can be re-accepted on
    // its next cooldown cycle. Active status is blocked by the offer
    // helper above. lastQuestDay is recorded at completion (see
    // recordSectQuestCompletion in effects.ts), not at accept — so
    // abandoning + re-accepting doesn't game the cooldown.
    delete draft.quests[questId];
    applyEffect(draft, { t: "startQuest", questId });
    appendActionLog(draft, "sect", `รับภารกิจสำนัก: ${def.name}`);
    set({ ...draft });
    return { ok: true };
  },

  resignSect: (sectId) => {
    const s = get();
    const m = s.sectMembership[sectId];
    if (!m) return { ok: false, reason: "ไม่ได้เป็นศิษย์สำนักนี้" };
    if (membershipStatus(m) !== "active") return { ok: false, reason: "ไม่อยู่ในสถานะศิษย์ที่ออกได้" };
    const draft = draftFrom(s);
    // The effect freezes the sect's moves, logs and tells the jianghu.
    draft.sectMembership[sectId] = { ...m };
    applyEffect(draft, { t: "resignSect", sectId });
    set({ ...draft });
    return { ok: true };
  },

  betraySect: (sectId) => {
    const s = get();
    const m = s.sectMembership[sectId];
    if (!m) return { ok: false, reason: "ไม่ได้เป็นศิษย์สำนักนี้" };
    if (membershipStatus(m) !== "active") return { ok: false, reason: "ไม่อยู่ในสถานะศิษย์ที่ทรยศได้" };
    const draft = draftFrom(s);
    // The effect sets the hunters on the hero, adds evil +5, logs and tells the jianghu.
    draft.sectMembership[sectId] = { ...m };
    applyEffect(draft, { t: "betraySect", sectId });
    set({ ...draft });
    return { ok: true };
  },
});
