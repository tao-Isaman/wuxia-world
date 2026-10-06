// People: meeting, sparring, killing, gifts and the bad actions (steal, assassinate, kidnap).
import { STAT_XP_PER_ACTION } from "@/lib/world/stat-progression";
import { getItem, getNpc, pickWeighted } from "@/lib/world";
import { tickQuestProgress } from "@/lib/world/effects";
import { KIDNAP_RETURN_DAYS, npcPresent } from "@/lib/world/npc-presence";
import { GIFT_REACTION_LINE, giftOutcome, giftWaitDays, giftable } from "@/lib/world/gifts";
import { npcFoeFor, npcIsDead, npcPower, powerTier } from "@/lib/world/npc-life";
import { ASSASSINATE_TRAIT_EVIL, KIDNAP_TRAIT_EVIL, STEAL_TRAIT_EVIL, STEAL_XP_ON_FAIL, STEAL_XP_ON_PASS, TIER_TO_BAD_ACTION_OPPONENT, assassinateChance, badActionOffered, kidnapChance, stealChance } from "@/lib/world/bad-actions";
import { advanceTime, heroKills } from "../lifecycle";
import { grantStatXp, rollLukXp } from "../progression";
import { ACTION_HOURS, SPAR_LOSE_SCENE_ID, SPAR_WIN_SCENE_ID } from "../rules";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const npcsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "meetNpc" | "startSparWith" | "startKillDuel" | "giveGift" | "attemptSteal" | "attemptAssassinate" | "attemptKidnap"> => ({
  meetNpc: (npcId) => {
    const s = get();
    if (!getNpc(npcId)) return;
    const entry = s.npcStates[npcId];
    if (entry?.met) return;
    set({
      npcStates: {
        ...s.npcStates,
        [npcId]: { ...(entry ?? {}), met: true },
      },
    });
  },

  startSparWith: (npcId) => {
    const s = get();
    if (s.pendingBattle) return { ok: false, reason: "pending" };
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown" };
    if (!npcPresent(s, npcId)) return { ok: false, reason: "absent" };
    if (s.npcExt[npcId]?.status === "secluded") return { ok: false, reason: "secluded" };
    // Anyone can be challenged: an authored sparring build, else one made
    // from their strength and school (lib/world/npc-life.ts npcFoeFor).
    const opponentId = npcFoeFor(s, npcId);
    const fameReward = Math.max(0, npc.sparFameReward ?? 1 + powerTier(npcPower(s, npcId)) * 3);
    const draft = draftFrom(s);
    // Mark the player as having met this NPC even if they back out — a
    // sparring offer counts as an introduction.
    const entry = draft.npcStates[npcId] ?? {};
    draft.npcStates[npcId] = { ...entry, met: true };
    draft.pendingSpar = { npcId, fameReward };
    draft.pendingBattle = {
      opponentId,
      onWin: SPAR_WIN_SCENE_ID,
      onLose: SPAR_LOSE_SCENE_ID,
      nonFatal: true,
    };
    set({ ...draft });
    return { ok: true, npcId, opponentId };
  },

  startKillDuel: (npcId) => {
    const s = get();
    if (s.pendingBattle) return { ok: false, reason: "pending" };
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown" };
    if (!npcPresent(s, npcId) || npcIsDead(s, npcId)) return { ok: false, reason: "absent" };
    const opponentId = npcFoeFor(s, npcId);
    const draft = draftFrom(s);
    draft.pendingBattle = {
      opponentId,
      onWin: draft.currentSceneId,
      onLose: draft.currentSceneId,
      killNpcId: npcId,
    };
    appendActionLog(draft, "combat", `ชักอาวุธเข้าใส่${npc.name} — สู้กันถึงตาย`);
    set({ ...draft });
    return { ok: true, npcId, opponentId };
  },

  giveGift: (npcId, gift) => {
    const s = get();
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown", message: "ไม่พบบุคคลนี้" };
    if (!npcPresent(s, npcId)) return { ok: false, reason: "absent", message: `${npc.name} ไม่อยู่ที่นี่` };
    const wait = giftWaitDays(s, npcId);
    if (wait > 0) return { ok: false, reason: "cooldown", message: `เพิ่งให้ของขวัญไป · ให้ได้อีกใน ${wait} วัน` };
    const draft = draftFrom(s);
    let outcome;
    let what: string;
    if ("gold" in gift) {
      if (!(gift.gold > 0) || draft.gold < gift.gold) return { ok: false, reason: "missing", message: "เงินไม่พอ" };
      draft.gold -= gift.gold;
      outcome = giftOutcome(npc, { gold: gift.gold });
      what = `เงิน ${gift.gold} ตำลึง`;
    } else {
      const item = getItem(gift.itemId);
      if (!giftable(item)) return { ok: false, reason: "not-giftable", message: "ของชิ้นนี้ให้เป็นของขวัญไม่ได้" };
      if ((draft.inventory[item.id] ?? 0) < 1) return { ok: false, reason: "missing", message: "ไม่มีของชิ้นนี้" };
      draft.inventory = { ...draft.inventory, [item.id]: draft.inventory[item.id] - 1 };
      if (draft.inventory[item.id] <= 0) delete draft.inventory[item.id];
      outcome = giftOutcome(npc, { item });
      what = item.name;
    }
    const prev = draft.npcStates[npcId] ?? {};
    draft.npcStates = { ...draft.npcStates, [npcId]: { ...prev, met: true, relationship: (prev.relationship ?? 0) + outcome.points } };
    draft.giftDays = { ...draft.giftDays, [npcId]: draft.day };
    appendActionLog(draft, "gift", `ให้${what}แก่${npc.name} · ${GIFT_REACTION_LINE[outcome.reaction]} (ความสนิท ${outcome.points >= 0 ? "+" : ""}${outcome.points})`);
    set({ ...draft });
    return { ok: true, reaction: outcome.reaction, points: outcome.points };
  },

  attemptSteal: (npcId) => {
    const s = get();
    if (s.pendingBattle) return { ok: false, reason: "pending" };
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown" };
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    if (!badActionOffered(s, npc, "steal")) {
      return { ok: false, reason: "not-stealable" };
    }
    const stealXp = s.lifeSkillXp.steal ?? 0;
    const chance = stealChance(s.playerBuild, npc, stealXp);
    const passed = Math.random() * 100 < chance;
    const draft = draftFrom(s);
    advanceTime(draft, ACTION_HOURS);
    if (passed) {
      // Pick 1–2 items from the steal pool, weighted.
      const picks = 1 + (Math.random() < 0.3 ? 1 : 0);
      const merged: Record<string, number> = {};
      for (let i = 0; i < picks; i++) {
        const drop = pickWeighted(npc.stealLoot ?? [], Math.random());
        if (!drop) continue;
        const min = drop.count?.[0] ?? 1;
        const max = drop.count?.[1] ?? 1;
        const c = min + Math.floor(Math.random() * Math.max(1, max - min + 1));
        merged[drop.itemId] = (merged[drop.itemId] ?? 0) + c;
      }
      const items = Object.entries(merged).map(([itemId, count]) => ({ itemId, count }));
      for (const it of items) {
        draft.inventory[it.itemId] = (draft.inventory[it.itemId] ?? 0) + it.count;
      }
      draft.stoleFromCounts[npcId] = (draft.stoleFromCounts[npcId] ?? 0) + 1;
      draft.lifeSkillXp.steal = (draft.lifeSkillXp.steal ?? 0) + STEAL_XP_ON_PASS;
      draft.traits.evil = (draft.traits.evil ?? 0) + STEAL_TRAIT_EVIL;
      grantStatXp(draft, "DEX", STAT_XP_PER_ACTION);
      rollLukXp(draft);
      tickQuestProgress(draft);
      appendActionLog(
        draft,
        "steal",
        `ขโมย ${npc.name}: ${
          items.length > 0
            ? items.map((it) => `${getItem(it.itemId)?.name ?? it.itemId}×${it.count}`).join(", ")
            : "ไม่ได้อะไร"
        } (${chance.toFixed(0)}%)`,
      );
      set({ ...draft });
      return { ok: true, outcome: "passed", chance, items };
    }
    // Failed — caught in the act. Fight the NPC themselves when they
    // have a battle build (sparOpponentId); only NPCs without one
    // fall back to the tier-matched guard.
    const tier = (npc.defenseTier ?? 0) as 0 | 1 | 2 | 3 | 4;
    const opponentId = npc.sparOpponentId ?? TIER_TO_BAD_ACTION_OPPONENT[tier];
    draft.lifeSkillXp.steal = (draft.lifeSkillXp.steal ?? 0) + STEAL_XP_ON_FAIL;
    // Caught: a หมายจับ goes out (max 5). The law now hunts the player.
    draft.wanted = (draft.wanted ?? 0) + 1;
    draft.wantedDay = draft.day;
    draft.pendingBattle = {
      opponentId,
      onWin: draft.currentSceneId,
      onLose: draft.currentSceneId,
      nonFatal: true,
    };
    appendActionLog(draft, "steal", `ขโมย ${npc.name} ล้มเหลว (${chance.toFixed(0)}%) — ถูกจับได้ · หมายจับ ${draft.wanted}`);
    set({ ...draft });
    return { ok: true, outcome: "failed", chance };
  },

  attemptAssassinate: (npcId) => {
    const s = get();
    if (s.pendingBattle) return { ok: false, reason: "pending" };
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown" };
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    if (s.assassinatedNpcIds.includes(npcId)) {
      return { ok: false, reason: "already-done" };
    }
    const chance = assassinateChance(s.playerBuild, npc);
    const passed = Math.random() * 100 < chance;
    const draft = draftFrom(s);
    advanceTime(draft, ACTION_HOURS);
    if (passed) {
      heroKills(draft, npcId);
      draft.traits.evil = (draft.traits.evil ?? 0) + ASSASSINATE_TRAIT_EVIL;
      draft.traits.fame = (draft.traits.fame ?? 0) + 2;
      grantStatXp(draft, "DEX", STAT_XP_PER_ACTION);
      rollLukXp(draft);
      tickQuestProgress(draft);
      appendActionLog(
        draft,
        "assassinate",
        `ลอบสังหาร ${npc.name} สำเร็จ (${chance.toFixed(0)}%)`,
      );
      set({ ...draft });
      return { ok: true, outcome: "passed", chance };
    }
    const tier = (npc.defenseTier ?? 0) as 0 | 1 | 2 | 3 | 4;
    const opponentId = TIER_TO_BAD_ACTION_OPPONENT[tier];
    draft.pendingBattle = {
      opponentId,
      onWin: draft.currentSceneId,
      onLose: draft.currentSceneId,
    };
    appendActionLog(
      draft,
      "assassinate",
      `ลอบสังหาร ${npc.name} ล้มเหลว (${chance.toFixed(0)}%) — ต้องสู้`,
    );
    set({ ...draft });
    return { ok: true, outcome: "failed", chance };
  },

  attemptKidnap: (npcId) => {
    const s = get();
    if (s.pendingBattle) return { ok: false, reason: "pending" };
    const npc = getNpc(npcId);
    if (!npc) return { ok: false, reason: "unknown" };
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    if (s.kidnappedNpcIds.includes(npcId)) {
      return { ok: false, reason: "already-done" };
    }
    const chance = kidnapChance(s.playerBuild, npc);
    const passed = Math.random() * 100 < chance;
    const draft = draftFrom(s);
    advanceTime(draft, ACTION_HOURS);
    if (passed) {
      draft.kidnappedNpcIds.push(npcId);
      // Taken away now; back at their spot after KIDNAP_RETURN_DAYS.
      draft.kidnappedUntil = { ...draft.kidnappedUntil, [npcId]: draft.day + KIDNAP_RETURN_DAYS };
      draft.traits.evil = (draft.traits.evil ?? 0) + KIDNAP_TRAIT_EVIL;
      draft.traits.arrogance = (draft.traits.arrogance ?? 0) + 1;
      grantStatXp(draft, "STR", STAT_XP_PER_ACTION);
      rollLukXp(draft);
      tickQuestProgress(draft);
      appendActionLog(
        draft,
        "kidnap",
        `ลักพาตัว ${npc.name} สำเร็จ (${chance.toFixed(0)}%)`,
      );
      set({ ...draft });
      return { ok: true, outcome: "passed", chance };
    }
    const tier = (npc.defenseTier ?? 0) as 0 | 1 | 2 | 3 | 4;
    const opponentId = TIER_TO_BAD_ACTION_OPPONENT[tier];
    draft.pendingBattle = {
      opponentId,
      onWin: draft.currentSceneId,
      onLose: draft.currentSceneId,
    };
    appendActionLog(
      draft,
      "kidnap",
      `ลักพาตัว ${npc.name} ล้มเหลว (${chance.toFixed(0)}%) — ถูกตอบโต้`,
    );
    set({ ...draft });
    return { ok: true, outcome: "failed", chance };
  },
});
