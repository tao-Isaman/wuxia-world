// Accepting, dropping and handing in quests; hands-on objective spots.
import { applyEffects, getQuest } from "@/lib/world";
import { completeObjectiveSpot } from "@/lib/world/quest-objectives";
import { consumeQuestAutoItems } from "@/lib/world/effects";
import { advanceTime } from "../lifecycle";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const questsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "acceptQuest" | "abandonQuest" | "finishQuestNow" | "doQuestObjective"> => ({
  acceptQuest: (questId) => {
    const s = get();
    const def = getQuest(questId);
    if (!def) return { ok: false, reason: "unknown" };
    const cur = s.quests[questId];
    if (cur && cur.status === "active") return { ok: false, reason: "already-active" };
    if (cur && (cur.status === "done" || cur.status === "failed")) {
      return { ok: false, reason: "already-done" };
    }
    const draft = draftFrom(s);
    // applyEffects runs the existing startQuest dispatcher and the
    // quest progress ticker — so a quest whose stage 0 has an
    // autoAdvance that's already true can resolve a step or two on
    // accept (e.g., player already has the requested item).
    applyEffects(draft, [{ t: "startQuest", questId }]);
    appendActionLog(draft, "quest", `รับภารกิจ: ${def.name}`);
    set({ ...draft });
    return { ok: true, questId };
  },

  abandonQuest: (questId) => {
    const s = get();
    const def = getQuest(questId);
    if (!def) return { ok: false, reason: "unknown" };
    const cur = s.quests[questId];
    if (!cur || cur.status !== "active") return { ok: false, reason: "already-done" };
    const draft = draftFrom(s);
    // Saga chapters, lineage quests and the sect art trials are the only
    // way to their skill or art; failing one for good would lock it away,
    // so dropping one just forgets it (and its objective progress) — it is
    // offered again.
    if (def.story || def.lineage || def.isArtQuest) {
      const quests = { ...draft.quests };
      delete quests[questId];
      draft.quests = quests;
      const flags = { ...draft.flags };
      for (const key of Object.keys(flags)) if (key.startsWith(`qobj:${questId}:`)) delete flags[key];
      if (flags.trackedQuestId === questId) delete flags.trackedQuestId;
      draft.flags = flags;
      appendActionLog(draft, "quest", `ละทิ้งภารกิจ: ${def.name} (รับใหม่ได้ภายหลัง)`);
      set({ ...draft });
      return { ok: true, questId };
    }
    // Mark failed without granting rewards — finishQuest's success=false
    // path skips the reward dispatcher.
    applyEffects(draft, [{ t: "finishQuest", questId, success: false }]);
    appendActionLog(draft, "quest", `ละทิ้งภารกิจ: ${def.name}`);
    set({ ...draft });
    return { ok: true, questId };
  },

  finishQuestNow: (questId) => {
    const s = get();
    const def = getQuest(questId);
    if (!def) return { ok: false, reason: "unknown" };
    const cur = s.quests[questId];
    if (!cur || cur.status !== "active") return { ok: false, reason: "already-done" };
    const draft = draftFrom(s);
    // Auto-consume gathered items BEFORE finishQuest fires (so the
    // log entry can show what was taken). This is the popup turn-in
    // path — no scene explicitly handles takeItem here, so the
    // engine cleans up. Scene-driven completes still use explicit
    // takeItem effects and never reach this code path.
    const draftQ = draft.quests[questId];
    if (draftQ) consumeQuestAutoItems(draft, def, draftQ);
    applyEffects(draft, [{ t: "finishQuest", questId, success: true }]);
    appendActionLog(draft, "quest", `สำเร็จภารกิจ: ${def.name}`);
    set({ ...draft });
    return { ok: true, questId };
  },

  doQuestObjective: (questId, spotIndex) => {
    const draft = draftFrom(get());
    const result = completeObjectiveSpot(draft, questId, spotIndex);
    if (!result.ok) return result;
    if (result.sceneId) { get().gotoScene(result.sceneId); return result; }
    advanceTime(draft, result.hours);
    const quest = getQuest(questId);
    appendActionLog(draft, "quest", `${quest?.name ?? questId}: ${result.message}`);
    set({ ...draft });
    return result;
  },
});
