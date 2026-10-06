// Joining, ranking up in, taking quests from and leaving sects.
import { getQuest } from "@/lib/world";
import { applyEffect, isSectQuestOfferable } from "@/lib/world/effects";
import { evaluateCondition } from "@/lib/world/conditions";
import { SECT_MEMBERSHIPS, rankUpGold } from "@/lib/world/data/sect-memberships";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const sectsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "joinSect" | "upgradeSectRank" | "acceptSectQuest" | "resignSect" | "betraySect"> => ({
  joinSect: (sectId) => {
    const s = get();
    if (!s.hasGame || !s.playerBuild) return { ok: false, reason: "ยังไม่ได้เริ่มเกม" };
    if (s.sectMembership[sectId]) return { ok: false, reason: "เป็นศิษย์อยู่แล้ว" };
    const def = SECT_MEMBERSHIPS[sectId];
    if (!def) return { ok: false, reason: "ไม่พบสำนัก" };
    if (!evaluateCondition(s, def.joinRequirements)) {
      return { ok: false, reason: "ไม่ผ่านเงื่อนไขการรับศิษย์" };
    }
    const draft = draftFrom(s);
    applyEffect(draft, { t: "joinSect", sectId });
    // The joinSect effect also tells the jianghu (a sect_join echo).
    appendActionLog(draft, "sect", `เข้าร่วมสำนัก${def.name} · ขั้นที่ ${def.startRank}`);
    set({ ...draft });
    return { ok: true };
  },

  upgradeSectRank: (sectId) => {
    const s = get();
    const m = s.sectMembership[sectId];
    if (!m) return { ok: false, reason: "ยังไม่ได้เป็นศิษย์" };
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
    dm.points -= cost;
    dm.rank = target;
    // Rank-ups pay gold; the sect's martial arts come from its lineage
    // quests and sagas, which the new rank may open.
    const gold = rankUpGold(def, target);
    draft.gold += gold;
    appendActionLog(
      draft,
      "sect",
      `เลื่อนขั้น${def.name} → ขั้นที่ ${target} (จ่าย ${cost} sect points · ได้รับ ${gold} ตำลึง)`,
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
    const sectDef = SECT_MEMBERSHIPS[sectId];
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
    if ((m.status ?? "active") !== "active") return { ok: false, reason: "ไม่อยู่ในสถานะศิษย์ที่ออกได้" };
    const draft = draftFrom(s);
    applyEffect(draft, { t: "resignSect", sectId });
    const def = SECT_MEMBERSHIPS[sectId];
    appendActionLog(draft, "sect", `ลาออกอย่างเป็นทางการจากสำนัก${def.name} — วิชาที่ได้จากสำนักจะหยุดเลื่อนขั้น`);
    // Liveness Layer: from the public's view a resign and a betray
    // both look like "the player left" — same actionId so they share
    // the template pool.
    applyEffect(draft, { t: "firePlayerEcho", actionId: "sect_leave_or_betray" });
    set({ ...draft });
    return { ok: true };
  },

  betraySect: (sectId) => {
    const s = get();
    const m = s.sectMembership[sectId];
    if (!m) return { ok: false, reason: "ไม่ได้เป็นศิษย์สำนักนี้" };
    if ((m.status ?? "active") !== "active") return { ok: false, reason: "ไม่อยู่ในสถานะศิษย์ที่ทรยศได้" };
    const draft = draftFrom(s);
    applyEffect(draft, { t: "betraySect", sectId });
    // Betrayal is a moral wound — bumps evil + arrogance traits.
    applyEffect(draft, { t: "addTrait", trait: "evil", amount: 5 });
    const def = SECT_MEMBERSHIPS[sectId];
    appendActionLog(draft, "sect", `ทรยศสำนัก${def.name} — ระวังนักล่าจากสำนักจะตามล่าเจ้าในที่ต่าง ๆ`);
    // Liveness Layer: same actionId as resign — the rumor mill
    // doesn't differentiate "left politely" vs "betrayed" until
    // a specific accuser surfaces.
    applyEffect(draft, { t: "firePlayerEcho", actionId: "sect_leave_or_betray" });
    set({ ...draft });
    return { ok: true };
  },
});
