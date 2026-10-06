// Giving oneself up and serving a sentence.
import { applyEffect, releaseFromJail } from "@/lib/world/effects";
import { jailCityFor, sentenceLeft } from "@/lib/world/law";
import { JAIL_SCENE_ID } from "@/lib/world/data/activities";
import { advanceTime } from "../lifecycle";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const lawActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "surrender" | "serveSentence"> => ({
  surrender: () => {
    const s = get();
    if (!s.hasGame || (s.wanted ?? 0) <= 0) return { ok: false, reason: "not-wanted" };
    if (s.jailUntil != null || s.pendingBattle || s.pendingEncounter) return { ok: false, reason: "busy" };
    const draft = draftFrom(s);
    const marks = draft.wanted;
    draft.jailCityId = jailCityFor(draft.lastLocationId ?? draft.currentSceneId);
    applyEffect(draft, { t: "imprison", surrender: true });
    appendActionLog(draft, "law", `มอบตัวต่อทางการ (หมายจับ ${marks}) · ${String(draft.flags._arrestReport ?? "").split("\n").join(" · ")}`);
    // Taken straight to the cells: no road to walk, no stamina to pay.
    draft.currentSceneId = JAIL_SCENE_ID;
    set({ ...draft, roamingFoes: [] });
    return { ok: true };
  },

  serveSentence: () => {
    const s = get();
    if (s.jailUntil == null) return;
    const draft = draftFrom(s);
    advanceTime(draft, sentenceLeft(draft));
    releaseFromJail(draft);
    draft.currentSceneId = draft.lastLocationId!;
    appendActionLog(draft, "law", "นั่งนับวันจนพ้นโทษ ออกจากคุกหลวง");
    set({ ...draft });
  },
});
