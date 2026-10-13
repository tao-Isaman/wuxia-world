// Accepting, dropping (forgetting) and handing in quests; hands-on objective spots.
import { applyEffects, getQuest } from "@/lib/world";
import { completeObjectiveSpot } from "@/lib/world/quest-objectives";
import { consumeQuestAutoItems, droppedQuestFlag, repeatQuestFlag, repeatQuestWait } from "@/lib/world/effects";
import { staminaForHours } from "../lifecycle";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const questsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "acceptQuest" | "abandonQuest" | "finishQuestNow" | "doQuestObjective"> => ({
  acceptQuest: (questId) => {
    const s = get();
    const def = getQuest(questId);
    if (!def) return { ok: false, reason: "unknown" };
    const cur = s.quests[questId];
    if (cur && cur.status === "active") return { ok: false, reason: "already-active" };
    const draft = draftFrom(s);
    // A repeatable quest comes back on its own turn (checked on the clock now).
    if (cur && (cur.status === "done" || cur.status === "failed") && (!def.repeatEveryDays || repeatQuestWait(draft, def) > 0)) {
      return { ok: false, reason: "already-done" };
    }
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
    // Dropping a quest forgets it (and its objective progress): it is offered
    // again, by its giver or the sect window. No kind stays failed — nothing
    // in the content reads a failed status, and failing for good locked away
    // quests (and their moves) for one tap. What its start (or a stage
    // already passed) handed over is not paid twice: `qdropped:<id>` keeps
    // how far the hero got (applyEffects, lib/world/effects.ts).
    const quests = { ...draft.quests };
    delete quests[questId];
    draft.quests = quests;
    const flags = { ...draft.flags };
    for (const key of Object.keys(flags)) if (key.startsWith(`qobj:${questId}:`)) delete flags[key];
    if (flags.trackedQuestId === questId) delete flags.trackedQuestId;
    const reached = cur.stage + 1;
    const before = flags[droppedQuestFlag(questId)];
    flags[droppedQuestFlag(questId)] = Math.max(typeof before === "number" ? before : 0, reached);
    draft.flags = flags;
    // Dropping a repeatable quest gives its turn back.
    delete flags[repeatQuestFlag(questId)];
    // Dropping a repeatable sect quest gives its two-hour turn back.
    const m = def.sectId && !def.isArtQuest ? draft.sectMembership[def.sectId] : undefined;
    if (m && def.sectId && m.lastQuestDay?.[questId] != null) {
      const lastQuestDay = { ...m.lastQuestDay };
      delete lastQuestDay[questId];
      draft.sectMembership = { ...draft.sectMembership, [def.sectId]: { ...m, lastQuestDay } };
    }
    appendActionLog(draft, "quest", `ละทิ้งภารกิจ: ${def.name} (รับใหม่ได้ภายหลัง)`);
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
    if (result.sceneId) {
      // A dialog spot that used to take time (a dive, a night's watch) costs stamina instead.
      if (result.hours > 0) { draft.stamina = Math.max(0, draft.stamina - staminaForHours(result.hours)); set({ ...draft }); }
      get().gotoScene(result.sceneId);
      return result;
    }
    if (result.hours > 0) draft.stamina = Math.max(0, draft.stamina - staminaForHours(result.hours));
    const quest = getQuest(questId);
    appendActionLog(draft, "quest", `${quest?.name ?? questId}: ${result.message}`);
    set({ ...draft });
    return result;
  },
});
