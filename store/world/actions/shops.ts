// Shops, sect halls and artisans: buying and selling, recipes, equipment in and out of the bag.
import { getArt, getEquip, getSkill } from "@/lib/game";
import { getItem, getRecipe } from "@/lib/world";
import { rollLukXp } from "../progression";
import { appendActionLog, draftFrom } from "../state";
import type { WorldGet, WorldSet, WorldStore } from "../types";

export const shopsActions = (set: WorldSet, get: WorldGet): Pick<WorldStore, "buyItem" | "sellItem" | "buyMoveSkill" | "buyInnerSkill" | "buyRecipe" | "buyEquipment" | "equipFromBag" | "unequipFromSlot"> => ({
  buyItem: (itemId, count) => {
    if (count <= 0) return { ok: false, reason: "unknown" };
    const s = get();
    const def = getItem(itemId);
    if (!def) return { ok: false, reason: "unknown" };
    const price = def.price ?? 0;
    if (price <= 0) return { ok: false, reason: "not-for-sale" };
    const total = price * count;
    if (s.gold < total) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= total;
    draft.inventory[itemId] = (draft.inventory[itemId] ?? 0) + count;
    rollLukXp(draft);
    appendActionLog(draft, "buy", `ซื้อ ${def.name}×${count} · -${total}🟡`);
    set({ ...draft });
    return { ok: true, itemId, count, spent: total };
  },

  sellItem: (itemId, count, sellMultiplier) => {
    if (count <= 0) return { ok: false, reason: "unknown" };
    const s = get();
    const def = getItem(itemId);
    if (!def) return { ok: false, reason: "unknown" };
    const price = def.price ?? 0;
    if (price <= 0) return { ok: false, reason: "unsellable" };
    const have = s.inventory[itemId] ?? 0;
    if (have < count) return { ok: false, reason: "missing" };
    const draft = draftFrom(s);
    const remaining = have - count;
    if (remaining <= 0) delete draft.inventory[itemId];
    else draft.inventory[itemId] = remaining;
    const gained = Math.floor(price * sellMultiplier) * count;
    draft.gold = Math.max(0, draft.gold + gained);
    rollLukXp(draft);
    appendActionLog(draft, "sell", `ขาย ${def.name}×${count} · +${gained}🟡`);
    set({ ...draft });
    return { ok: true, itemId, count, gained };
  },

  buyMoveSkill: (skillId, price) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "unknown" };
    const sk = getSkill(skillId);
    if (!sk) return { ok: false, reason: "unknown" };
    if ((s.playerBuild.learnedSkillIds ?? []).includes(skillId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    const cur = draft.playerBuild!.learnedSkillIds ?? [];
    const slots = [...draft.playerBuild!.skillIds];
    if (!slots.includes(skillId)) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null) { slots[i] = skillId; break; }
      }
    }
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedSkillIds: [...cur, skillId],
      skillIds: slots,
    };
    rollLukXp(draft);
    appendActionLog(draft, "learn", `เรียน ${sk.n} (กระบวนท่า) · -${price}🟡`);
    set({ ...draft });
    return { ok: true, id: skillId, spent: price };
  },

  buyInnerSkill: (artId, price) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "unknown" };
    if ((s.playerBuild.learnedArtIds ?? []).includes(artId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    const curArts = draft.playerBuild!.learnedArtIds ?? [];
    const levels = { ...(draft.playerBuild!.artLevels ?? {}) };
    const slots = [...draft.playerBuild!.skillIds];
    const slotEntry = `art:${artId}`;
    if (!slots.includes(slotEntry)) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null) { slots[i] = slotEntry; break; }
      }
    }
    draft.playerBuild = {
      ...draft.playerBuild!,
      learnedArtIds: [...curArts, artId],
      artLevels: { ...levels, [artId]: levels[artId] ?? 1 },
      skillIds: slots,
    };
    rollLukXp(draft);
    const artDef = getArt(artId);
    appendActionLog(draft, "learn", `เรียน ${artDef?.n ?? artId} (ลมปราณ) · -${price}🟡`);
    set({ ...draft });
    return { ok: true, id: artId, spent: price };
  },

  buyRecipe: (recipeId, price) => {
    const s = get();
    const r = getRecipe(recipeId);
    if (!r) return { ok: false, reason: "unknown" };
    if (s.learnedRecipeIds.includes(recipeId)) {
      return { ok: false, reason: "already-learned" };
    }
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    draft.learnedRecipeIds = [...draft.learnedRecipeIds, recipeId];
    rollLukXp(draft);
    appendActionLog(draft, "learn", `เรียนสูตร ${r.name} · -${price}🟡`);
    set({ ...draft });
    return { ok: true, recipeId, spent: price };
  },

  buyEquipment: (equipId, price) => {
    const s = get();
    const e = getEquip(equipId);
    if (!e) return { ok: false, reason: "unknown" };
    if (s.gold < price) return { ok: false, reason: "no-gold" };
    const draft = draftFrom(s);
    draft.gold -= price;
    draft.inventoryEquipment[equipId] =
      (draft.inventoryEquipment[equipId] ?? 0) + 1;
    rollLukXp(draft);
    appendActionLog(draft, "buy", `ซื้อ ${e.n} · -${price}🟡`);
    set({ ...draft });
    return { ok: true, equipId, spent: price };
  },

  equipFromBag: (equipId) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const e = getEquip(equipId);
    if (!e) return { ok: false, reason: "unknown" };
    if ((s.inventoryEquipment[equipId] ?? 0) < 1) {
      return { ok: false, reason: "missing" };
    }

    const draft = draftFrom(s);
    const eq = { ...draft.playerBuild!.equipment };
    const ty = e.ty;
    let chosenIdx = 0;
    let swapped: string | null = null;

    // Multi-slot types: prefer the first empty slot, else swap into
    // index 0 and push the displaced id back to the bag.
    if (ty === "BR" || ty === "R" || ty === "C") {
      const arr = [...eq[ty]] as [string | null, string | null];
      const emptyIdx = arr.findIndex((v) => v === null);
      chosenIdx = emptyIdx === -1 ? 0 : emptyIdx;
      if (arr[chosenIdx] !== null) swapped = arr[chosenIdx];
      arr[chosenIdx] = equipId;
      eq[ty] = arr;
    } else {
      // Single-slot types — direct swap.
      if (eq[ty] !== null) swapped = eq[ty];
      eq[ty] = equipId;
    }

    draft.playerBuild = { ...draft.playerBuild!, equipment: eq };

    // Pull one copy out of the bag; push any displaced id back.
    const bag = { ...draft.inventoryEquipment };
    const remain = (bag[equipId] ?? 0) - 1;
    if (remain <= 0) delete bag[equipId];
    else bag[equipId] = remain;
    if (swapped) bag[swapped] = (bag[swapped] ?? 0) + 1;
    draft.inventoryEquipment = bag;

    const swappedDef = swapped ? getEquip(swapped) : null;
    appendActionLog(
      draft,
      "use",
      swapped
        ? `ติดตั้ง ${e.n} (เก็บ ${swappedDef?.n ?? swapped} กลับย่าม)`
        : `ติดตั้ง ${e.n}`,
    );
    set({ ...draft });
    return {
      ok: true,
      equipId,
      slotType: ty,
      slotIdx: chosenIdx,
      swapped,
    };
  },

  unequipFromSlot: (slotType, slotIdx) => {
    const s = get();
    if (!s.playerBuild) return { ok: false, reason: "no-build" };
    const idx = (slotIdx ?? 0) as 0 | 1;
    const eq = { ...s.playerBuild.equipment };
    let cur: string | null = null;
    if (slotType === "BR" || slotType === "R" || slotType === "C") {
      cur = eq[slotType][idx];
    } else {
      cur = eq[slotType];
    }
    if (!cur) return { ok: false, reason: "empty" };
    const e = getEquip(cur);
    if (!e) return { ok: false, reason: "unknown" };

    const draft = draftFrom(s);
    const next = { ...draft.playerBuild!.equipment };
    if (slotType === "BR" || slotType === "R" || slotType === "C") {
      const arr = [...next[slotType]] as [string | null, string | null];
      arr[idx] = null;
      next[slotType] = arr;
    } else {
      next[slotType] = null;
    }
    draft.playerBuild = { ...draft.playerBuild!, equipment: next };
    draft.inventoryEquipment[cur] =
      (draft.inventoryEquipment[cur] ?? 0) + 1;
    appendActionLog(draft, "use", `ถอด ${e.n} เก็บลงย่าม`);
    set({ ...draft });
    return { ok: true, equipId: cur, slotType, slotIdx: idx };
  },
});
