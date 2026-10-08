// Moves and meridians: w-exp level-ups, forgetting, practice, slots and meridian points.
import { ART_LEVEL_MAX, effectiveTypes, encodeArtSlot, getArt, getSkill, parseSlotId, SKILL_LEVEL_MAX, xpToNextArtLevel, xpToNextLevel, checkOpenMeridianNode, getMeridianChart } from "@/lib/game";
import { canPracticeAt, getScene, practiceMatches, practiceXpGain } from "@/lib/world";
import { applyArtLevelUps, applySkillLevelUps, grantMeridianPoints, syncPlayerSkillLevels } from "../progression";
import { PRACTICE_HOURS, PRACTICE_STAMINA_COST, W_EXP_PRACTICE } from "../rules";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const trainingActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "openMeridianNode" | "levelUpSkillFromWExp" | "levelUpArtFromWExp" | "forgetSkill" | "forgetArt" | "practiceSkill" | "equipSlot"> => ({
  openMeridianNode: (chartId, index) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "ยังไม่มีตัวละคร" };
    const chart = getMeridianChart(chartId);
    if (!chart) return { ok: false, reason: "ไม่มีแผนภาพชีพจรนี้" };
    const stored = s.playerBuild.meridians?.[chartId];
    const ranks = stored ? chart.nodes.map((_, i) => stored[i] ?? 0) : undefined;
    const check = checkOpenMeridianNode(chart, ranks, index, s.meridianPoints ?? 0);
    if (!check.ok) return check;
    const draft = draftFrom(s);
    const next = [...ranks!];
    next[index] = check.rank;
    draft.meridianPoints = Math.max(0, (draft.meridianPoints ?? 0) - check.cost);
    draft.playerBuild = {
      ...draft.playerBuild!,
      meridians: { ...(draft.playerBuild!.meridians ?? {}), [chartId]: next },
    };
    const node = chart.nodes[index]!;
    appendActionLog(
      draft,
      "meridian",
      `${check.rank === 1 ? "เปิด" : "เสริม"}${node.name.startsWith("จุด") ? node.name : `จุด${node.name}`} (ชีพจร${chart.name}) ขั้น ${check.rank} · -${check.cost} แต้ม`,
    );
    set({ ...draft });
    return { ok: true, rank: check.rank };
  },

  levelUpSkillFromWExp: (skillId) => {
    const s = get();
    const sk = getSkill(skillId);
    if (!sk) return { ok: false, reason: "unknown" };
    const lv = s.skillLevel[skillId] ?? 1;
    if (lv >= SKILL_LEVEL_MAX) return { ok: false, reason: "maxed" };
    const fullCost = xpToNextLevel(sk, lv);
    // Pay only what's missing — the player's already-banked per-skill
    // xp counts toward the level-up.
    const banked = Math.min(s.skillExp[skillId] ?? 0, fullCost);
    const remaining = Math.max(0, fullCost - banked);
    if (s.wExp < remaining) return { ok: false, reason: "insufficient" };

    const draft = draftFrom(s);
    draft.wExp -= remaining;
    // Consume the partial xp pool — it's been spent on this level.
    draft.skillExp[skillId] = 0;
    draft.skillLevel[skillId] = lv + 1;
    syncPlayerSkillLevels(draft);
    appendActionLog(
      draft,
      "learn",
      `เร่งกระบวนท่า ${sk.n} → Lv.${lv + 1} (-${remaining} w-exp)`,
    );
    grantMeridianPoints(draft, 1);
    set({ ...draft });
    return { ok: true, skillId, level: lv + 1, cost: remaining };
  },

  levelUpArtFromWExp: (artId) => {
    const s = get();
    const art = getArt(artId);
    if (!art || art.id === "none") return { ok: false, reason: "unknown" };
    if (!s.playerBuild) return { ok: false, reason: "unknown" };
    const lv = s.playerBuild.artLevels?.[artId] ?? 1;
    if (lv >= ART_LEVEL_MAX) return { ok: false, reason: "maxed" };
    const fullCost = xpToNextArtLevel(art, lv);
    const banked = Math.min(s.artExp[artId] ?? 0, fullCost);
    const remaining = Math.max(0, fullCost - banked);
    if (s.wExp < remaining) return { ok: false, reason: "insufficient" };

    const draft = draftFrom(s);
    draft.wExp -= remaining;
    draft.artExp[artId] = 0;
    draft.playerBuild = {
      ...draft.playerBuild!,
      artLevels: {
        ...(draft.playerBuild!.artLevels ?? {}),
        [artId]: lv + 1,
      },
    };
    appendActionLog(
      draft,
      "learn",
      `เร่งลมปราณ ${art.n} → ขั้น ${lv + 1} (-${remaining} w-exp)`,
    );
    grantMeridianPoints(draft, 1);
    set({ ...draft });
    return { ok: true, artId, level: lv + 1, cost: remaining };
  },

  forgetSkill: (skillId) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const sk = getSkill(skillId);
    if (!sk) return { ok: false, reason: "unknown" };
    const learned = s.playerBuild.learnedSkillIds ?? [];
    if (!learned.includes(skillId)) {
      return { ok: false, reason: "not-learned" };
    }

    const draft = draftFrom(s);
    // Drop from the learned list.
    const nextLearned = learned.filter((id) => id !== skillId);
    // Also clear any equipped slot holding this skill — leaves an
    // empty slot (player can reslot something else manually).
    const nextSlots = draft.playerBuild!.skillIds.map((raw) =>
      raw === skillId ? null : raw,
    );
    const nextSkillLevels = { ...(draft.playerBuild!.skillLevels ?? {}) };
    delete nextSkillLevels[skillId];
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedSkillIds: nextLearned,
      skillIds: nextSlots,
      skillLevels: nextSkillLevels,
    };
    // World-side xp / level tracks too — clear so a future re-learn
    // starts fresh.
    delete draft.skillLevel[skillId];
    delete draft.skillExp[skillId];
    appendActionLog(draft, "learn", `ลืมกระบวนท่า ${sk.n}`);
    set({ ...draft });
    return { ok: true, skillId };
  },

  forgetArt: (artId) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const art = getArt(artId);
    if (!art || art.id === "none") return { ok: false, reason: "unknown" };
    const learned = s.playerBuild.learnedArtIds ?? [];
    if (!learned.includes(artId)) {
      return { ok: false, reason: "not-learned" };
    }

    const draft = draftFrom(s);
    const nextLearned = learned.filter((id) => id !== artId);
    // Unslot — art slots use the "art:<id>" prefix.
    const slotEntry = encodeArtSlot(artId);
    const nextSlots = draft.playerBuild!.skillIds.map((raw) =>
      raw === slotEntry ? null : raw,
    );
    const nextLevels = { ...(draft.playerBuild!.artLevels ?? {}) };
    delete nextLevels[artId];
    // If this was the legacy "active" art, fall back to "none" so
    // the engine doesn't keep applying its scaled bonuses.
    const nextArtId =
      draft.playerBuild!.artId === artId ? "none" : draft.playerBuild!.artId;
    const nextArtLevel =
      draft.playerBuild!.artId === artId ? 1 : draft.playerBuild!.artLevel;
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedArtIds: nextLearned,
      artLevels: nextLevels,
      artId: nextArtId,
      artLevel: nextArtLevel,
      skillIds: nextSlots,
    };
    delete draft.artExp[artId];
    appendActionLog(draft, "learn", `ลืมลมปราณ ${art.n}`);
    set({ ...draft });
    return { ok: true, artId };
  },

  practiceSkill: (rawId) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const info = parseSlotId(rawId);
    if (!info) return { ok: false, reason: "unknown" };
    // Only practice at locations whose categories permit it.
    const sceneNow = getScene(s.currentSceneId);
    const locScene = sceneNow?.kind === "location" ? sceneNow : null;
    if (!locScene || !canPracticeAt(locScene)) {
      return { ok: false, reason: "not-allowed" };
    }
    if (s.stamina < PRACTICE_STAMINA_COST) {
      return { ok: false, reason: "stamina" };
    }

    const draft = draftFrom(s);
    draft.stamina = Math.max(0, draft.stamina - PRACTICE_STAMINA_COST);
    draft.wExp += W_EXP_PRACTICE;

    if (info.kind === "skill") {
      const sk = info.skill;
      const matched = practiceMatches(locScene, effectiveTypes(sk));
      if (!(sk.id in draft.skillLevel)) draft.skillLevel[sk.id] = 1;
      const beforeLv = draft.skillLevel[sk.id]!;
      const xpGained = practiceXpGain(matched, xpToNextLevel(sk, beforeLv));
      draft.skillExp[sk.id] = (draft.skillExp[sk.id] ?? 0) + xpGained;
      applySkillLevelUps(draft, sk.id);
      const afterLv = draft.skillLevel[sk.id]!;
      const leveledUp = afterLv > beforeLv;
      appendActionLog(
        draft,
        "learn",
        `ฝึก ${sk.n} · +${xpGained} xp${matched ? " (สถานที่เหมาะ)" : ""}` +
          (leveledUp ? ` · ขึ้น Lv.${afterLv}` : ""),
      );
      set({ ...draft });
      return {
        ok: true,
        kind: "skill",
        id: sk.id,
        xpGained,
        matched,
        leveledUp,
        newLevel: afterLv,
      };
    }

    // Art branch
    const art = info.art;
    const matched = practiceMatches(locScene, effectiveTypes(art));
    const beforeLv = draft.playerBuild!.artLevels?.[art.id] ?? 1;
    const xpGained = practiceXpGain(matched, xpToNextArtLevel(art, beforeLv));
    draft.artExp[art.id] = (draft.artExp[art.id] ?? 0) + xpGained;
    // Make sure artLevels has an entry so applyArtLevelUps starts from 1.
    if (typeof draft.playerBuild!.artLevels?.[art.id] !== "number") {
      draft.playerBuild = {
        ...draft.playerBuild!,
        artLevels: {
          ...(draft.playerBuild!.artLevels ?? {}),
          [art.id]: 1,
        },
      };
    }
    applyArtLevelUps(draft, art.id);
    const afterLv = draft.playerBuild!.artLevels?.[art.id] ?? beforeLv;
    const leveledUp = afterLv > beforeLv;
    appendActionLog(
      draft,
      "learn",
      `ฝึก ${art.n} · +${xpGained} xp${matched ? " (สถานที่เหมาะ)" : ""}` +
        (leveledUp ? ` · ขึ้นขั้น ${afterLv}` : ""),
    );
    set({ ...draft });
    return {
      ok: true,
      kind: "art",
      id: art.id,
      xpGained,
      matched,
      leveledUp,
      newLevel: afterLv,
    };
  },

  equipSlot: (slotIdx, rawId) => {
    const s = get();
    if (!s.playerBuild) return;
    const slots = [...s.playerBuild.skillIds];
    if (slotIdx < 0 || slotIdx >= slots.length) return;
    // Validate the id resolves before writing it in.
    if (rawId !== null && !parseSlotId(rawId)) return;
    // Move-not-duplicate: if the same id sits in another slot, clear it.
    if (rawId) {
      for (let i = 0; i < slots.length; i++) {
        if (i !== slotIdx && slots[i] === rawId) slots[i] = null;
      }
    }
    slots[slotIdx] = rawId;
    set({
      playerBuild: { ...s.playerBuild, skillIds: slots },
    });
  },
});
